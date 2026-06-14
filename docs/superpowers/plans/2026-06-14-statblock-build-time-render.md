# Statblock Build-Time Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render creature statblocks as build-time HTML in Go (the `featureblock_page.go` model) instead of a client-rendered JSON island, with a captured golden test proving the output is identical to today's `steel-statblock.js`, and slim the client script down to interactivity-only.

**Architecture:** Split the statblock site path into an unchanged parse stage (`buildStatblockIsland` → `sbIsland` struct) and a new output stage. A new `internal/site/statblock_card.go` ports `steel-statblock.js`'s `render()` 1:1 into Go (`renderStatblockCard`), `buildStatblockIslandPage` calls it instead of marshalling a JSON island, and `steel-statblock.js` is reduced to `wire()` (collapsible bands) + the sticky mini-header. Equivalence is guaranteed by a golden test: a Brave capture script renders the current JS over committed island inputs, and a Go test asserts `renderStatblockCard` produces byte-identical HTML.

**Tech Stack:** Go 1.26 (steel-etl, run via `devbox run -- bash -c 'cd steel-etl && go …'`); MkDocs Material + vanilla ES5 JS (v2); Brave via playwright-core for capture/e2e (`v2/tests/e2e/*.cjs`). Spec: [`docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md`](../specs/2026-06-14-statblock-build-time-render-design.md).

---

## Pre-flight

- [ ] **Confirm Go builds and the statblock tests pass on a clean tree**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run Statblock'`
Expected: PASS (`TestBuildStatblockIsland_DevilHighJudge`, `..._ResolvesLinksInAllFields`, `TestBuildStatblockIslandPage_EmitsIsland`).

- [ ] **Create a feature branch** (we are on `main`)

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl && git checkout -b feat/statblock-build-time-render
cd /home/scott/code/steelCompendium/workspace/v2 && git checkout -b feat/statblock-build-time-render
```
(Two separate git repos — branch and commit in each.)

- [ ] **Read the key context files** (do not skip): `steel-etl/internal/site/statblock_page.go` (the parse stage + the `sbIsland`/`sbFeature` structs you will render), `v2/docs/javascripts/steel-statblock.js` (the renderer being ported), `steel-etl/internal/site/featureblock_page.go` (the build-time-HTML pattern to mirror).

---

### Task 1: Golden inputs — island JSON from page fixtures

The bridge between the two repos: the Go test computes an `sbIsland` from a markdown page constant; the Brave capture script renders the *current* JS over the **same** island. We commit the island JSON so both sides share one input.

**Files:**
- Create: `steel-etl/internal/site/statblock_card_test.go`
- Create (generated, committed): `steel-etl/internal/site/testdata/statblock_golden/{devil-high-judge,link-test,minion,summoner-dice}.island.json`

- [ ] **Step 1.1: Add the three new page fixtures + the golden fixture list**

Create `steel-etl/internal/site/statblock_card_test.go` with the fixtures. `devilHighJudgePage` and `linkedFieldsPage` already exist in `statblock_page_test.go` (same package) — reuse them, do not redefine.

```go
package site

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// A minion: organization "Minion", a single passive trait + one ability.
const minionPage = `---
name: Goblin Cutter
organization: Minion
role: Harrier
level: 1
ev: "3"
size: 1S
speed: 6
stamina: "5"
stability: "0"
free_strike: "2"
might: "1"
agility: "2"
reason: "-1"
intuition: "0"
presence: "-1"
keywords:
    - Goblin
type: statblock
---

> 🗡️ **Cutting Strike**
>
> | **Melee, Strike** | **Main action** |
> |-------------------|----------------:|
> | **📏 Melee 1**    | **🎯 One creature** |
>
> **Power Roll + 2:**
>
> - **≤11:** 2 damage
> - **12-16:** 4 damage
> - **17+:** 6 damage

> ⭐️ **Mob Tactics**
>
> The cutter deals 1 extra damage for each other goblin adjacent to its target.
`

// A summoner signature with the dice-in-title power-roll form: the dice live in
// the title and the three tiers are bare digit-led paragraphs below the table.
const summonerDicePage = `---
name: Bound Imp
organization: ""
role: Support
level: 1
ev: "4"
size: 1T
speed: 5
stamina: "8"
stability: "0"
free_strike: "1"
might: "0"
agility: "2"
reason: "1"
intuition: "1"
presence: "0"
keywords:
    - Demon
type: statblock
---

> 🏹 **Spirit Bolt 2d10 + R**
>
> | **Magic, Ranged** | **Main action** |
> |-------------------|----------------:|
> | **📏 Ranged 10**  | **🎯 One creature** |
>
> 11 damage
>
> 16 damage; pushed 1
>
> 21 damage; pushed 2
`

// goldenFixtures maps a golden basename to its source page markdown. The two
// reused constants live in statblock_page_test.go.
var goldenFixtures = map[string]string{
	"devil-high-judge": devilHighJudgePage,
	"link-test":        linkedFieldsPage,
	"minion":           minionPage,
	"summoner-dice":    summonerDicePage,
}

const goldenDir = "testdata/statblock_golden"

// islandFor reproduces exactly what buildStatblockIslandPage feeds the renderer:
// split frontmatter, strip retainer-advancement (a no-op for these fixtures),
// then build the island.
func islandFor(page string) sbIsland {
	fm, body := splitFrontmatter(page)
	base, _ := splitRetainerAdvancement(body)
	return buildStatblockIsland(fm, base)
}
```

- [ ] **Step 1.2: Add the island-input writer test (run under an env flag)**

Append to `statblock_card_test.go`:

```go
// TestStatblockGolden_WriteIslandInputs regenerates the committed island JSON
// inputs the Brave capture script consumes. It only writes when
// STEEL_UPDATE_GOLDEN=1; otherwise it asserts the committed JSON still matches
// the current parser output (so a parser change that drifts the inputs fails
// loudly, telling you to regenerate + recapture).
func TestStatblockGolden_WriteIslandInputs(t *testing.T) {
	update := os.Getenv("STEEL_UPDATE_GOLDEN") == "1"
	for name, page := range goldenFixtures {
		isl := islandFor(page)
		got, err := json.MarshalIndent(isl, "", "  ")
		if err != nil {
			t.Fatalf("%s: marshal: %v", name, err)
		}
		got = append(got, '\n')
		path := filepath.Join(goldenDir, name+".island.json")
		if update {
			if err := os.MkdirAll(goldenDir, 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(path, got, 0644); err != nil {
				t.Fatal(err)
			}
			continue
		}
		want, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("%s: %v (run STEEL_UPDATE_GOLDEN=1 go test to generate)", name, err)
		}
		if string(got) != string(want) {
			t.Errorf("%s.island.json drifted from parser output — regenerate with STEEL_UPDATE_GOLDEN=1 and recapture golden.html", name)
		}
	}
}
```

- [ ] **Step 1.3: Generate the island inputs**

Run: `devbox run -- bash -c 'cd steel-etl && STEEL_UPDATE_GOLDEN=1 go test ./internal/site/ -run TestStatblockGolden_WriteIslandInputs -v'`
Expected: PASS; four files now exist under `steel-etl/internal/site/testdata/statblock_golden/`.

Verify: `ls steel-etl/internal/site/testdata/statblock_golden/` → four `*.island.json` files.

- [ ] **Step 1.4: Commit (steel-etl repo)**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/site/statblock_card_test.go internal/site/testdata/statblock_golden/
git commit -m "test: statblock golden fixtures + island JSON inputs"
```

---

### Task 2: Golden outputs — capture current JS render via Brave

**Files:**
- Create: `v2/tests/e2e/capture-statblock-golden.cjs`
- Create (generated, committed under steel-etl): `steel-etl/internal/site/testdata/statblock_golden/{devil-high-judge,link-test,minion,summoner-dice}.golden.html`

- [ ] **Step 2.1: Write the capture script**

The script loads any statblock page (so `window.SCStatblock` is present in the *current, un-slimmed* build), then for each committed `*.island.json` calls `SCStatblock.render(island)`, strips the one runtime-only artifact `wire()` adds to the root (the `--sticky-top` inline `style`), and writes `<name>.golden.html`. It reads/writes the steel-etl testdata dir (sibling repo under the workspace root).

```js
/*
 * capture-statblock-golden.cjs — capture the CURRENT steel-statblock.js render()
 * output as golden HTML for the Go build-time-render equivalence test.
 *
 *   cd v2
 *   devbox run -- mkdocs build                                   # ~145s
 *   devbox run -- python3 -m http.server 8124 --directory site &
 *   devbox run -- node tests/e2e/capture-statblock-golden.cjs
 *
 * Reads  ../steel-etl/internal/site/testdata/statblock_golden/<name>.island.json
 * Writes ../steel-etl/internal/site/testdata/statblock_golden/<name>.golden.html
 *
 * Env: E2E_BASE (default http://127.0.0.1:8124/), BRAVE_PATH
 *      (default /opt/brave.com/brave/brave),
 *      SEED_PAGE (default Browse/monster/arixx/arixx/ — any statblock page).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

function resolvePlaywrightCore() {
  try { return require("playwright-core"); } catch (_) {}
  try { return require("playwright"); } catch (_) {}
  const npx = path.join(os.homedir(), ".npm", "_npx");
  let best = null, bestVer = "";
  try {
    for (const hash of fs.readdirSync(npx)) {
      const dir = path.join(npx, hash, "node_modules", "playwright-core");
      const pkg = path.join(dir, "package.json");
      if (fs.existsSync(pkg)) {
        const ver = JSON.parse(fs.readFileSync(pkg, "utf8")).version || "";
        if (ver > bestVer) { bestVer = ver; best = dir; }
      }
    }
  } catch (_) {}
  if (best) return require(best);
  throw new Error("playwright-core not found");
}

const BASE = process.env.E2E_BASE || "http://127.0.0.1:8124/";
const BRAVE = process.env.BRAVE_PATH || "/opt/brave.com/brave/brave";
const SEED = process.env.SEED_PAGE || "Browse/monster/arixx/arixx/";
const DATA = path.resolve(__dirname, "../../../steel-etl/internal/site/testdata/statblock_golden");

(async () => {
  const names = fs.readdirSync(DATA)
    .filter((f) => f.endsWith(".island.json"))
    .map((f) => f.replace(/\.island\.json$/, ""));
  if (!names.length) throw new Error("no *.island.json inputs in " + DATA);

  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(BASE + SEED, { waitUntil: "networkidle" });
  await page.waitForSelector(".sb-wrap"); // SCStatblock is loaded + mounted

  for (const name of names) {
    const island = JSON.parse(fs.readFileSync(path.join(DATA, name + ".island.json"), "utf8"));
    const html = await page.evaluate((data) => {
      const node = window.SCStatblock.render(data);
      node.removeAttribute("style"); // wire() sets --sticky-top on the root; runtime-only
      return node.outerHTML;
    }, island);
    fs.writeFileSync(path.join(DATA, name + ".golden.html"), html);
    console.log("wrote " + name + ".golden.html (" + html.length + " bytes)");
  }

  await browser.close();
})().catch((e) => { console.error("CAPTURE ERROR:", e.stack || e.message); process.exit(2); });
```

- [ ] **Step 2.2: Build the site (needed for a seed page) and capture**

```bash
cd /home/scott/code/steelCompendium/workspace/v2
devbox run -- mkdocs build
devbox run -- python3 -m http.server 8124 --directory site &
devbox run -- node tests/e2e/capture-statblock-golden.cjs
```
Expected: "wrote …golden.html" four times. Leave the server running for Task 6. Verify: `ls steel-etl/internal/site/testdata/statblock_golden/*.golden.html` → four files.

- [ ] **Step 2.3: Commit (both repos — script in v2, golden HTML in steel-etl)**

```bash
cd /home/scott/code/steelCompendium/workspace/v2
git add tests/e2e/capture-statblock-golden.cjs
git commit -m "test: Brave capture script for statblock golden HTML"

cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/site/testdata/statblock_golden/
git commit -m "test: captured statblock golden HTML (current JS renderer)"
```

---

### Task 3: Failing equivalence test (RED)

**Files:**
- Modify: `steel-etl/internal/site/statblock_card_test.go`

- [ ] **Step 3.1: Add the normalizer + equivalence test**

Append to `statblock_card_test.go`:

```go
// normalizeStatblockHTML drops insignificant whitespace so a Go single-line
// build matches the browser's outerHTML serialization. Neither side emits
// inter-tag whitespace (the JS html string is fully concatenated; Go uses a
// single Builder), so stripping newlines/tabs + trimming is sufficient.
func normalizeStatblockHTML(s string) string {
	s = strings.ReplaceAll(s, "\n", "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\t", "")
	return strings.TrimSpace(s)
}

func TestStatblockCard_GoldenEquivalence(t *testing.T) {
	for name, page := range goldenFixtures {
		t.Run(name, func(t *testing.T) {
			want, err := os.ReadFile(filepath.Join(goldenDir, name+".golden.html"))
			if err != nil {
				t.Fatalf("%v (run the capture script — Task 2)", err)
			}
			got := renderStatblockCard(islandFor(page))
			if g, w := normalizeStatblockHTML(got), normalizeStatblockHTML(string(want)); g != w {
				t.Errorf("renderStatblockCard != golden for %s\n--- got ---\n%s\n--- want ---\n%s", name, g, w)
			}
		})
	}
}
```

- [ ] **Step 3.2: Run it to confirm it fails to compile (renderStatblockCard undefined)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestStatblockCard_GoldenEquivalence'`
Expected: **build failure** — `undefined: renderStatblockCard`. That is the RED state; do not commit a broken build. Proceed to Task 4.

---

### Task 4: Implement the Go renderer (GREEN)

**Files:**
- Create: `steel-etl/internal/site/statblock_card.go`

This is a 1:1 port of `steel-statblock.js`'s render functions. Two equivalence traps drive the helper choices:
1. **Escaping:** JS `esc()` escapes only `& < > "` (NOT `'`). `html.EscapeString` would escape `'` → `&#39;` and break equality on every "can't"/possessive. Use the JS-matching `sbEsc` below, never `html.EscapeString`.
2. **Links already resolved:** the parse stage baked hrefs via `resolveSbLinks`, so `richSb` converts already-resolved `[text](href)` to `<a class="sb-term" href>` and must **not** re-run `cardHref`.

- [ ] **Step 4.1: Write the file**

```go
package site

// High-Fantasy Steel STATBLOCK cards rendered at BUILD TIME.
//
// renderStatblockCard is a 1:1 Go port of v2/docs/javascripts/steel-statblock.js's
// render()/renderFeature()/… It emits the same .sb-wrap DOM the client script used
// to build, so steel-statblock.css and the data-sb-* preference system are unchanged
// and the slimmed client script only wires interactivity (collapsible bands + sticky
// header). Equivalence is locked by TestStatblockCard_GoldenEquivalence against HTML
// captured from the (previous) JS renderer. See
// docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md.
//
// The input sbIsland and its parsing (buildStatblockIsland, statblock_page.go) are
// unchanged — this file replaces only the JSON-island output stage.

import (
	"fmt"
	"regexp"
	"strings"
)

type sbAct struct{ glyph, label string }

// sbACT mirrors the JS ACT map (DrawSteelGlyphs placeholder + eyebrow label).
var sbACT = map[string]sbAct{
	"main":      {"l", "Main Action"},
	"maneuver":  {"f", "Maneuver"},
	"triggered": {")", "Triggered Action"},
	"move":      {"o", "Move Action"},
	"passive":   {"*", "Trait"},
	"villain":   {"*", "Villain Action"},
	"malice":    {"*", "Malice"},
}

var sbTierGlyph = map[string]string{"low": "!", "mid": "@", "high": "#"}

var (
	// JS rich() link regex (runs on already-escaped text): label = non-"]",
	// href = non-")"/non-space. Matched verbatim so the port is faithful.
	sbRichLinkRe = regexp.MustCompile(`\[([^\]]+)\]\(([^)\s]+)\)`)
	// JS rich() bold regex: lazy inner match.
	sbRichBoldRe = regexp.MustCompile(`\*\*(.+?)\*\*`)
	// costBadge leading-count split.
	sbCostNumRe = regexp.MustCompile(`^\s*(\d+)\s+(.*)$`)
)

// sbEsc matches the JS esc(): escape & < > " (NOT '). Single left-to-right pass,
// like the JS regex replace, so an inserted "amp;" is never re-processed.
func sbEsc(s string) string {
	return strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", `"`, "&quot;").Replace(s)
}

// richSb matches the JS rich(): esc, then [text](href) → sb-term anchor, then
// **bold** → <b>. Links are ALREADY resolved (resolveSbLinks in the parse stage),
// so the href passes through unchanged — no cardHref here.
func richSb(s string) string {
	s = sbEsc(s)
	s = sbRichLinkRe.ReplaceAllString(s, `<a class="sb-term" href="${2}">${1}</a>`)
	s = sbRichBoldRe.ReplaceAllString(s, `<b>${1}</b>`)
	return s
}

// sbCostBadge ports costBadge(): a leading integer gets the mono .num treatment.
func sbCostBadge(cost string) string {
	if cost == "" {
		return ""
	}
	var inner string
	if m := sbCostNumRe.FindStringSubmatch(cost); m != nil {
		inner = `<span class="num">` + sbEsc(m[1]) + `</span> ` + richSb(m[2])
	} else {
		inner = richSb(cost)
	}
	return `<div class="sc-ability__cost">` + inner + `</div>`
}

// renderStatblockSpecField ports specField(): one CSS-reflowable field cell.
func renderStatblockSpecField(mod, label, valueHTML string) string {
	return `<div class="sb__field sb__field--` + mod + `"><span class="sb__field-l">` +
		sbEsc(label) + `</span><span class="sb__field-v">` + valueHTML + `</span></div>`
}

// renderStatblockFeature ports renderFeature(): the flattened steel feature article.
func renderStatblockFeature(f sbFeature) string {
	a, ok := sbACT[f.Action]
	if !ok {
		a = sbACT["passive"]
	}
	const dia = `<span class="sc-ability__dia"></span>`
	var b strings.Builder
	fmt.Fprintf(&b, `<article class="sc-ability sb__feat" data-action="%s" data-kind="%s">`, sbEsc(f.Action), sbEsc(f.Kind))

	// head: crest + inline icon (CSS shows one) · (eyebrow=usage) name · cost
	b.WriteString(`<div class="sb__feat-head">`)
	b.WriteString(`<span class="sc-crest sb__feat-crest"><span class="sb__feat-glyph">` + a.glyph + `</span></span>`)
	b.WriteString(`<span class="sb__feat-icon"><span class="sb__feat-glyph">` + a.glyph + `</span></span>`)
	b.WriteString(`<div class="sb__feat-titles">`)
	eyebrow := f.Usage
	if eyebrow == "" && f.Kind == "passive" {
		eyebrow = "Trait"
	}
	if eyebrow != "" {
		b.WriteString(`<div class="sb__feat-eyebrow">` + dia + richSb(eyebrow) + `</div>`)
	}
	b.WriteString(`<h3 class="sb__feat-name sc-ability__name">` + richSb(f.Name) + `</h3>`)
	b.WriteString(`</div>`)
	b.WriteString(`<div class="sb__feat-corner">` + sbCostBadge(f.Cost) + `</div>`)
	b.WriteString(`</div>`)

	// passive / malice → plain body paragraph, done.
	if f.Body != "" {
		b.WriteString(`<p class="sb__feat-body">` + richSb(f.Body) + `</p>`)
		b.WriteString(`</article>`)
		return b.String()
	}

	// keyword + usage block
	if len(f.Keywords) > 0 || f.Usage != "" {
		b.WriteString(`<div class="sb__ku">`)
		if len(f.Keywords) > 0 {
			var chips strings.Builder
			for _, k := range f.Keywords {
				chips.WriteString(`<span class="sc-ability__chip">` + sbEsc(k) + `</span>`)
			}
			b.WriteString(renderStatblockSpecField("kw", "Keywords", chips.String()))
		}
		if f.Usage != "" {
			b.WriteString(renderStatblockSpecField("usage", "Action", richSb(f.Usage)))
		}
		b.WriteString(`</div>`)
	}

	// distance + target block
	if f.Distance != "" || f.Target != "" {
		dist, tgt := f.Distance, f.Target
		if dist == "" {
			dist = "—"
		}
		if tgt == "" {
			tgt = "—"
		}
		b.WriteString(`<div class="sb__dt">`)
		b.WriteString(renderStatblockSpecField("dist", "Distance", richSb(dist)))
		b.WriteString(renderStatblockSpecField("tgt", "Target", richSb(tgt)))
		b.WriteString(`</div>`)
	}

	// power roll
	if f.PowerRoll != nil {
		b.WriteString(`<div class="sc-ability__pr">`)
		if f.PowerRoll.Formula != "" {
			b.WriteString(`<div class="sc-ability__pr-head">` + dia +
				`<span class="pre">Power Roll</span><span class="chars">` + sbEsc(f.PowerRoll.Formula) + `</span></div>`)
		}
		b.WriteString(`<div class="sc-ability__pr-rows">`)
		for _, t := range []string{"low", "mid", "high"} {
			if v, ok := f.PowerRoll.Tiers[t]; ok { // map only holds non-empty tiers; mirrors JS != null
				b.WriteString(`<div class="sc-ability__tier" data-tier="` + t + `"><span class="badge">` +
					sbTierGlyph[t] + `</span><span class="res">` + richSb(v) + `</span></div>`)
			}
		}
		b.WriteString(`</div></div>`)
	}

	// sections (Trigger / Effect / Special)
	for _, s := range f.Sections {
		b.WriteString(`<div class="sc-ability__section"><div class="sc-ability__section-head">` + dia +
			`<span class="tag">` + richSb(s.Label) + `</span></div><div class="sc-ability__section-body"><p>` +
			richSb(s.Text) + `</p></div></div>`)
	}

	// trailing note
	if f.Trailing != "" {
		b.WriteString(`<p class="sb__feat-trailing">` + richSb(f.Trailing) + `</p>`)
	}

	// enhancements (spend X rows)
	for _, e := range f.Enhancements {
		b.WriteString(`<div class="sc-ability__enh"><span class="cost">` + richSb(e.Cost) +
			`</span><span class="txt">` + richSb(e.Text) + `</span></div>`)
	}

	b.WriteString(`</article>`)
	return b.String()
}

// renderStatblockBand ports band(): a collapsible Villain/Malice section. Emitted
// open (data-open="true"); the slim client script toggles it.
func renderStatblockBand(kind, title, glyph, introHTML, featuresHTML string) string {
	return `<section class="sb__band sb__band--` + kind + `" data-open="true">` +
		`<button type="button" class="sb__band-head" aria-expanded="true">` +
		`<span class="sc-crest sb__band-crest"><span class="sb__band-glyph">` + glyph + `</span></span>` +
		`<span class="sb__band-title">` + sbEsc(title) + `</span>` +
		`<span class="sb__band-chev" aria-hidden="true">▾</span>` +
		`</button>` +
		`<div class="sb__band-body">` + introHTML + featuresHTML + `</div>` +
		`</section>`
}

func sbMetaCell(label, value string) string {
	return `<div class="sb__field sb__field--meta"><span class="sb__field-l">` + sbEsc(label) +
		`</span><span class="sb__field-v">` + richSb(value) + `</span></div>`
}

// renderStatblockMeta ports renderMeta(): the fixed 2×2 secondary stats.
func renderStatblockMeta(m sbMeta) string {
	return `<div class="sb__meta">` +
		sbMetaCell("Immunity", m.Immunity) +
		sbMetaCell("Weakness", m.Weakness) +
		sbMetaCell("Movement", m.Movement) +
		sbMetaCell(m.Captain.Label, m.Captain.Value) +
		`</div>`
}

// renderStatblockChars ports renderChars().
func renderStatblockChars(list []sbChar) string {
	var b strings.Builder
	b.WriteString(`<div class="sb__chars">`)
	for _, c := range list {
		b.WriteString(`<div class="sb__char"><span class="sb__char-box">` + sbEsc(c.K) +
			`</span><span class="sb__char-v">` + sbEsc(c.V) +
			`</span><span class="sb__char-l">` + sbEsc(c.L) + `</span></div>`)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// renderStatblockSticky ports renderSticky(): the mini-header node (present in
// markup; revealed by the client script on scroll).
func renderStatblockSticky(d sbIsland) string {
	var defs strings.Builder
	for _, x := range d.Defenses {
		defs.WriteString(`<span class="m"><b>` + sbEsc(x.V) + `</b>` + sbEsc(x.L) + `</span>`)
	}
	var chars strings.Builder
	for _, c := range d.Characteristics {
		chars.WriteString(`<span class="c"><b>` + sbEsc(c.V) + `</b><i>` + sbEsc(c.K) + `</i></span>`)
	}
	metaPairs := [][2]string{
		{"Movement", d.Meta.Movement},
		{d.Meta.Captain.Label, d.Meta.Captain.Value},
		{"Immunity", d.Meta.Immunity},
		{"Weakness", d.Meta.Weakness},
	}
	var meta strings.Builder
	for _, kv := range metaPairs {
		meta.WriteString(`<span class="sm"><b>` + sbEsc(kv[0]) + `</b>` + sbEsc(kv[1]) + `</span>`)
	}
	return `<div class="sb__sticky" aria-hidden="true">` +
		`<div class="sb__sticky-row1">` +
		`<span class="sb__sticky-id"><span class="sb__sticky-name">` + sbEsc(d.Name) + `</span>` +
		`<span class="sb__sticky-role" data-role="` + sbEsc(d.RoleKey) + `">` + sbEsc(d.Role) + `</span></span>` +
		`<span class="sb__sticky-stats"><span class="sb__sticky-defs">` + defs.String() + `</span>` +
		`<span class="sb__sticky-chars">` + chars.String() + `</span></span>` +
		`</div>` +
		`<div class="sb__sticky-row2">` + meta.String() + `</div>` +
		`</div>`
}

// renderStatblockCard ports render(): the full .sb-wrap card. Villain-kind
// features group into a collapsible "Villain Actions" band, matching the JS.
// The shared family Malice band stays omitted (not in island data; FOLLOWUPS #7).
func renderStatblockCard(d sbIsland) string {
	var defs strings.Builder
	for _, x := range d.Defenses {
		defs.WriteString(`<div class="sb__stat"><span class="v">` + sbEsc(x.V) +
			`</span><span class="l">` + sbEsc(x.L) + `</span></div>`)
	}

	var feat, villain strings.Builder
	for _, f := range d.Features {
		if f.Kind == "villain" {
			villain.WriteString(renderStatblockFeature(f))
		} else {
			feat.WriteString(renderStatblockFeature(f))
		}
	}
	villainHTML := ""
	if villain.Len() > 0 {
		villainHTML = renderStatblockBand("villain", "Villain Actions", sbACT["villain"].glyph, "", villain.String())
	}

	var b strings.Builder
	b.WriteString(`<div class="sb-wrap" data-role="` + sbEsc(d.RoleKey) + `" data-creature="` + sbEsc(d.ID) + `">`)
	b.WriteString(renderStatblockSticky(d))
	b.WriteString(`<article class="sb md-typeset" data-role="` + sbEsc(d.RoleKey) + `">`)
	b.WriteString(`<header class="sb__head"><div class="sb__head-row">` +
		`<div class="sb__identity"><div class="sb__kw">` + sbEsc(d.Ancestry) + `</div>` +
		`<h2 class="sb__name">` + sbEsc(d.Name) + `</h2></div>` +
		`<div class="sb__class"><div class="sb__level">Level ` + sbEsc(d.Level) + `</div>` +
		`<div class="sb__role" data-role="` + sbEsc(d.RoleKey) + `">` + sbEsc(d.Role) + `</div>` +
		`<div class="sb__ev">EV ` + sbEsc(d.EV) + `</div></div></div></header>`)
	b.WriteString(`<div class="sb__defenses">` + defs.String() + `</div>`)
	b.WriteString(renderStatblockMeta(d.Meta))
	b.WriteString(renderStatblockChars(d.Characteristics))
	b.WriteString(`<div class="sb__features">` + feat.String() + villainHTML + `</div>`)
	b.WriteString(`</article></div>`)
	return b.String()
}
```

- [ ] **Step 4.2: Run the equivalence test**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestStatblockCard_GoldenEquivalence -v'`
Expected: **PASS** for all four subtests. If a subtest fails, the error prints got vs want — diff them; the mismatch is almost always an escaping (`'`/`"`), attribute-order, or empty-tier issue. Do NOT edit the golden to match Go; fix the port.

- [ ] **Step 4.3: Run the whole site package (regression)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`
Expected: PASS (the existing `TestBuildStatblockIslandPage_EmitsIsland` still passes — we have not changed the page builder yet).

- [ ] **Step 4.4: Commit (steel-etl repo)**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/site/statblock_card.go internal/site/statblock_card_test.go
git commit -m "feat: build-time statblock card renderer (Go port of steel-statblock.js)"
```

---

### Task 5: Swap the page builder to emit the card

**Files:**
- Modify: `steel-etl/internal/site/statblock_page.go` (the tail of `buildStatblockIslandPage`, lines ~138-150, and the file-header comment lines ~5-22)
- Modify: `steel-etl/internal/site/statblock_page_test.go` (`TestBuildStatblockIslandPage_EmitsIsland`)

- [ ] **Step 5.1: Update the page-builder output**

In `statblock_page.go`, replace the island-wrapping tail of `buildStatblockIslandPage`. Old:

```go
	base, advGroups := splitRetainerAdvancement(body)
	js, err := json.Marshal(buildStatblockIsland(fm, base))
	if err != nil {
		return data, false
	}
	// Wrap the island in a .sc-statblock-mount container. Material's
	// navigation.instant recreates inline <script>s and strips their attributes
	// (class + type), so after a client-side nav the script is no longer findable
	// by `script.sc-statblock-data` — but the container DIV's class survives.
	// steel-statblock.js locates the mount, then reads the child <script> body.
	// Same pattern as .sc-browse-mount / .sc-bestiary-mount. See
	// v2/.repo-docs/decisions/2026-06-11-client-scripts-navigation-instant.md and
	// .../2026-06-09-instant-nav-strips-script-attrs.md.
	island := "<div class=\"sc-statblock-mount\">" +
		"<script type=\"application/json\" class=\"sc-statblock-data\">\n" + string(js) + "\n</script>" +
		"</div>\n"
	adv := renderRetainerAdvancement(fm, advGroups)
	return []byte("---\n" + fm + "\n---\n\n" + island + adv), true
```

New:

```go
	base, advGroups := splitRetainerAdvancement(body)
	// Build-time HTML card (the featureblock_page.go model): renderStatblockCard
	// emits the same .sb-wrap DOM steel-statblock.js used to build client-side, so
	// the card can later be embedded inline on any page. Contiguous (no blank
	// lines) so md_in_html passes it through verbatim.
	card := renderStatblockCard(buildStatblockIsland(fm, base))
	// Retainer advancement abilities render as a Forged Band card below the
	// statblock (Plan 4, renderRetainerAdvancement); "" for non-retainers.
	adv := renderRetainerAdvancement(fm, advGroups)
	return []byte("---\n" + fm + "\n---\n\n" + card + "\n" + adv), true
```

Then remove the now-unused `encoding/json` import from `statblock_page.go` (the file no longer marshals — `go build` will flag it if missed).

- [ ] **Step 5.2: Update the file-header comment**

In `statblock_page.go`, replace the header paragraph that describes the island path (lines ~5-10, beginning "Where ability_cards.go emits a finished `.sc-ability` card directly…") with:

```go
// Where this file once emitted a JSON island for steel-statblock.js to mount,
// it now parses a `type: statblock` page into the sbIsland model and hands it to
// renderStatblockCard (statblock_card.go), which emits the finished .sb-wrap DOM
// at build time — the featureblock_page.go model. This file owns the PARSE stage
// (frontmatter + body blockquotes → sbIsland); statblock_card.go owns rendering.
```

- [ ] **Step 5.3: Update the page-builder test**

In `statblock_page_test.go`, replace `TestBuildStatblockIslandPage_EmitsIsland` with:

```go
func TestBuildStatblockIslandPage_EmitsCard(t *testing.T) {
	out, ok := buildStatblockIslandPage([]byte(devilHighJudgePage))
	if !ok {
		t.Fatal("expected statblock page to be rewritten")
	}
	s := string(out)
	// Build-time .sb-wrap card, no JSON island.
	if !strings.Contains(s, `<div class="sb-wrap" data-role="leader" data-creature="devil-high-judge">`) {
		t.Fatal("sb-wrap card missing")
	}
	if strings.Contains(s, "sc-statblock-mount") || strings.Contains(s, "sc-statblock-data") {
		t.Error("JSON island markup should be gone")
	}
	// Frontmatter preserved.
	if !strings.HasPrefix(s, "---\n") || !strings.Contains(s, "type: statblock") {
		t.Error("frontmatter not preserved")
	}
	// A representative rendered feature is present.
	if !strings.Contains(s, "Infernal Decree") || !strings.Contains(s, `class="sb__features"`) {
		t.Error("rendered features missing")
	}

	// Non-statblock pages pass through untouched.
	if _, ok := buildStatblockIslandPage([]byte("---\ntype: ability\nname: X\n---\n\nbody")); ok {
		t.Error("non-statblock page should not be rewritten")
	}
}
```

Remove the now-unused `"encoding/json"` import from `statblock_page_test.go` if no other test in the file uses it (the parser tests do not; `go vet`/build will confirm).

- [ ] **Step 5.4: Run the site package tests**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`
Expected: PASS, including `TestBuildStatblockIslandPage_EmitsCard` and the golden equivalence test.

- [ ] **Step 5.5: Verify a retainer renders card + advancement at the page level**

The retainer advancement card is appended by the unchanged `renderRetainerAdvancement`; confirm the swap didn't drop it. Existing coverage is `retainer_page_test.go`.

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run Retainer -v'`
Expected: PASS.

- [ ] **Step 5.6: Commit (steel-etl repo)**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/site/statblock_page.go internal/site/statblock_page_test.go
git commit -m "feat: emit build-time statblock card; retire the JSON island"
```

---

### Task 6: Slim `steel-statblock.js` + full site verification

**Files:**
- Modify: `v2/docs/javascripts/steel-statblock.js`

- [ ] **Step 6.1: Replace the file with the wire-only version**

The statblock DOM is now server-rendered, so the script keeps ONLY runtime behavior: collapsible bands (`wire`) and the sticky mini-header (`wire`'s scroll logic + `chromeBottom`), plus `teardown` and the navigation.instant-safe `init`. `init` now finds every `.sb-wrap` and wires it instead of mounting islands. All render functions (`render`, `mount`, `renderFeature`, `renderSticky`, `band`, `specField`, `costBadge`, `rich`, `esc`, `el`, `ACT`, `TIER_GLYPH`) are deleted.

```js
/* ============================================================
   Steel Compendium — steel-statblock.js
   Statblock DOM is rendered at BUILD TIME by steel-etl
   (internal/site/statblock_card.go) into the .sb-wrap markup styled
   by steel-statblock.css. This script only attaches RUNTIME behavior
   to those server-rendered cards:
     - collapsible Villain Actions / Malice bands
     - the sticky mini-header that reveals on scroll
   It builds no DOM. navigation.instant-safe: subscribes to document$,
   idempotent init, tears down window listeners on each page swap.
   See docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md.
   ============================================================ */
(function (global) {
  "use strict";

  // Window scroll/resize handlers the sticky mini-header registers, tracked so
  // they can be torn down on the next navigation.
  var stickyHandlers = [];

  function wire(wrap) {
    // collapsible bands
    wrap.querySelectorAll(".sb__band-head").forEach(function (h) {
      h.addEventListener("click", function () {
        var b = h.closest(".sb__band");
        var open = b.getAttribute("data-open") === "true";
        b.setAttribute("data-open", open ? "false" : "true");
        h.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
    // sticky mini-header reveal (rAF-throttled scroll)
    var head = wrap.querySelector(".sb__head");
    if (!head) return;
    var ticking = false;
    var lastTop = -1;
    // Real bottom edge of Material's fixed chrome (header + sticky tabs).
    // Measured, not hardcoded: the bar height varies with the configured fonts
    // and the tabs row disappears below 76.25em — a constant either overlaps the
    // tabs or floats with a gap. Falls back to the CSS default.
    function chromeBottom() {
      var bottom = 0;
      var header = document.querySelector(".md-header");
      if (header) bottom = header.getBoundingClientRect().bottom;
      var tabs = document.querySelector(".md-tabs");
      if (tabs) {
        var tr = tabs.getBoundingClientRect();
        if (tr.height > 0) bottom = Math.max(bottom, tr.bottom);
      }
      return bottom > 0 ? Math.round(bottom) : 96;
    }
    function update() {
      ticking = false;
      var top = chromeBottom();
      if (top !== lastTop) {
        lastTop = top;
        wrap.style.setProperty("--sticky-top", top + "px");
      }
      var hr = head.getBoundingClientRect();
      var wr = wrap.getBoundingClientRect();
      wrap.classList.toggle("is-stuck", hr.bottom < top + 2 && wr.bottom > top + 74);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    stickyHandlers.push(onScroll);
    update();
  }

  // Tear down the previous page's sticky scroll/resize listeners. Under
  // navigation.instant the JS context survives page swaps, so without this each
  // visited statblock leaks a window listener pinning a detached .sb-wrap.
  function teardown() {
    stickyHandlers.forEach(function (h) {
      window.removeEventListener("scroll", h);
      window.removeEventListener("resize", h);
    });
    stickyHandlers = [];
  }

  // Wire every server-rendered statblock on the page. Runs on EVERY page view:
  // navigation.instant does not re-fire DOMContentLoaded, so subscribe to
  // document$. Idempotent (teardown first; addEventListener on fresh nodes).
  function init() {
    teardown();
    document.querySelectorAll(".sb-wrap").forEach(wire);
  }
  if (typeof document$ !== "undefined" && document$ && typeof document$.subscribe === "function") {
    document$.subscribe(init);
  } else if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  global.SCStatblock = { wire: wire };
})(window);
```

- [ ] **Step 6.2: Rebuild the site (build-time render change ⇒ full rebuild)**

```bash
cd /home/scott/code/steelCompendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
cd v2 && devbox run -- mkdocs build
```
Expected: clean builds. (The first command regenerates `v2/docs/Browse/**` statblock pages as `.sb-wrap` HTML; the second builds the MkDocs site.)

- [ ] **Step 6.3: Confirm the island is gone and cards are server-rendered**

```bash
cd /home/scott/code/steelCompendium/workspace/v2
grep -rl "sc-statblock-data" docs/Browse/ | wc -l   # expect 0
grep -rl 'class="sb-wrap"' docs/Browse/ | head -3    # expect statblock pages
```
Expected: 0 islands; `.sb-wrap` present in generated statblock pages.

- [ ] **Step 6.4: Run the e2e regression** (server from Task 2 still up; else restart per the header of the test file)

```bash
cd /home/scott/code/steelCompendium/workspace/v2
devbox run -- node tests/e2e/statblock-featstyle.e2e.cjs
devbox run -- node tests/e2e/settings-panel.e2e.cjs
```
Expected: ALL CHECKS PASSED for both. These wait on `.sb-wrap` (now present at load) and exercise the `data-sb-*` preference system + collapsible/sticky behavior against the server-rendered DOM.

- [ ] **Step 6.5: Visual spot-check (screenshots for the user)**

Capture `Browse/monster/arixx/arixx/` (solo with villain band) in card mode (default) and flat mode (`document.documentElement.setAttribute("data-sb-featstyle","flat")`), dark scheme, full statblock in frame, AND scroll partway to confirm the sticky mini-header still reveals. Save to `/tmp/sb-render-card.png`, `/tmp/sb-render-flat.png`, `/tmp/sb-render-sticky.png`; show all three to the user. Confirm: no duplicate `<h1>` title above the card, bands collapse on click, links work.

- [ ] **Step 6.6: Commit (v2 repo)**

```bash
cd /home/scott/code/steelCompendium/workspace/v2
git add docs/javascripts/steel-statblock.js
git commit -m "refactor: slim steel-statblock.js to wire-only (DOM now server-rendered)"
```

---

### Task 7: Docs

**Files:**
- Modify: `steel-etl/docs/statblocks.md`
- Modify: `steel-etl/CLAUDE.md`
- Modify: `v2/CLAUDE.md`

- [ ] **Step 7.1: `steel-etl/docs/statblocks.md`** — in the "Parsing" section, replace the sentence describing the island output. Find:

```
`StatblockParser` parses the stat grid + embedded ability/trait blockquotes;
```
and add, after the existing parsing paragraph, a new paragraph:

```
**Site rendering (build-time HTML, 2026-06-14).** `type: statblock` pages no longer
emit a JSON island. `buildStatblockIslandPage` (`internal/site/statblock_page.go`,
the parse stage) hands the `sbIsland` to `renderStatblockCard`
(`internal/site/statblock_card.go`), which emits the finished `.sb-wrap` DOM at build
time — the same DOM `v2/docs/javascripts/steel-statblock.js` used to build client-side
(now slimmed to wire-only: collapsible bands + sticky header). Equivalence is locked
by `TestStatblockCard_GoldenEquivalence` (golden HTML captured from the old JS
renderer; inputs under `internal/site/testdata/statblock_golden/`). This is the
`featureblock_page.go` model and unblocks embedding statblock cards inline on any page.
Design: `docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md`.
```

- [ ] **Step 7.2: `steel-etl/CLAUDE.md`** — in the Key files table, update the `statblock_page.go` row and add a `statblock_card.go` row:

Old:
```
| `internal/site/statblock_page.go` | Renders `type: statblock` page bodies into JSON islands mounted by v2 `steel-statblock.js` |
```
New:
```
| `internal/site/statblock_page.go` | Parses `type: statblock` page bodies → the `sbIsland` model (stat grid + blockquote features) |
| `internal/site/statblock_card.go` | Renders an `sbIsland` into the build-time `.sb-wrap` HTML card (Go port of `steel-statblock.js`) |
```

- [ ] **Step 7.3: `v2/CLAUDE.md`** — in the Key Rules `navigation.instant` bullet, the statblock is no longer a JSON-island example. Change the parenthetical "(b) if it reads a JSON data island…" example list reference to note statblocks moved to build-time HTML. Append to that bullet:

```
**Statblocks are no longer a JSON island** (2026-06-14): they render to `.sb-wrap`
HTML at build time (steel-etl `statblock_card.go`); `steel-statblock.js` only wires
runtime behavior (collapsible bands + sticky header) and still must be
`document$`-safe. The remaining JSON-island consumers are the Browse/bestiary search
mounts.
```

- [ ] **Step 7.4: Commit (both repos)**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add docs/statblocks.md CLAUDE.md
git commit -m "docs: statblock build-time rendering (island → .sb-wrap card)"

cd /home/scott/code/steelCompendium/workspace/v2
git add CLAUDE.md
git commit -m "docs: statblocks render at build time; client script is wire-only"
```

---

## Self-review checklist (completed during plan authoring)

- **Spec coverage:** §"What stays/changes" → Tasks 4-5; §"Component 1 renderer" → Task 4; §"Component 2 richSb" → Task 4 (Step 4.1 `richSb`/`sbEsc`); §"Component 3 slim JS" → Task 6; §"Testing" golden+e2e+screenshots → Tasks 1-3, 6; §"Docs" → Task 7. Retainer variant: covered at page level (Task 5.5) rather than in the golden set, since advancement is rendered by the unchanged `renderRetainerAdvancement`, not `renderStatblockCard` — a deliberate, spec-intent-faithful refinement noted in Task 1.
- **Escaping trap** (`'` vs `html.EscapeString`; `"`/nbsp in text) handled by `sbEsc` matching JS `esc()`; fixtures chosen without literal `"`/nbsp in feature text.
- **Type consistency:** `sbIsland`, `sbFeature`, `sbMeta`, `sbChar`, `sbLV`, `sbPowerRoll` are the existing structs from `statblock_page.go`; `renderStatblockCard`/`renderStatblockFeature`/… names are used identically across Tasks 3-5.

## Out of scope (tracked in FOLLOWUPS #10)

- CSS-only interactivity (`<details>` bands / pure-CSS sticky) to retire the script entirely.
- Removing the `resolveSbLinks` pre-pass so the model holds raw links (folding `richSb` toward `richInline`).
- Embedding statblock cards inline in chapter/Read pages (the goal this unblocks; ROADMAP).
