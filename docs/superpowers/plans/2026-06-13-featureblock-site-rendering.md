# Featureblock Site Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `type: featureblock` and `type: dynamic-terrain` pages as the High-Fantasy Steel "Forged Band" card — a build-time HTML renderer in steel-etl, a new CSS sheet, and a two-control Featureblocks settings group — reading the structured frontmatter Plan 1 already ships.

**Architecture:** Plan 2 of the featureblock-cards effort (spec: `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, phase 2). A new `internal/site/featureblock_page.go` `yaml.Unmarshal`s the page frontmatter (Plan 1 made it non-lossy: `kind`/`level`/`flavor`/`role`/`terrain_type`/`stats[]`/`features[]`) and emits a finished `.fb-wrap` card directly — the build-time-HTML model of `ability_cards.go`, **not** a JSON island. Each feature is `article.sc-ability.fb__feat`, so it reuses the ability-card grammar (`costBadge`/`richInline`/`cardHref`/`tierGlyph`/`renderSectionBlock`/`sbActionKind`) and the steel-ability-cards.css internals verbatim; the new sheet styles only the wrap/head/stats and the kill-block + card/flat/grid/ledger preferences. **No fixture routing, retainer split, or companion cards** — those are Plans 3–5.

**Tech Stack:** Go (`devbox run -- go test ./...` from workspace root, or `cd steel-etl` inside `devbox shell`), `gopkg.in/yaml.v3` (already a site-package dep), CSS (composes `--fx-*`/`--sc-*` tokens), vanilla JS settings drawer, Brave-via-playwright-core e2e.

**Repos & branches:** This plan changes **two sub-repos**. Before Task 1, create a feature branch in each:
```bash
cd steel-etl && git checkout -b feat/featureblock-rendering && cd ..
cd v2        && git checkout -b feat/featureblock-rendering && cd ..
```
- Tasks 1–4 commit in `steel-etl/`.
- Tasks 5–9 commit in `v2/`.
- Task 10 (verification) builds across both; no commit.
- Task 11 (docs) commits in `v2/` (none — DESIGN.md is workspace-level), `steel-etl/`, and the **workspace** repo (already on branch `feat/featureblock-cards-plan2`).

The workspace-repo `steel-etl` pointer bump + the actual deploy happen at deploy time (user-driven), **not** in this plan.

**The build-output trap:** `v2/site/` is the mkdocs build output (gitignored — `git check-ignore` confirms). Edit **only** `v2/docs/javascripts/settings-panel.js`; never `v2/site/...`. The `mkdocs build` in Task 10 regenerates `site/`.

---

## File structure

| File | Responsibility |
|---|---|
| Create `steel-etl/internal/site/featureblock_page.go` | `buildFeatureblockPage` (dispatch + frontmatter unmarshal) and `renderFeatureblockCard` (the `.fb-wrap` HTML) |
| Create `steel-etl/internal/site/featureblock_page_test.go` | String-contains DOM tests (the `bestiary_cards_test.go` pattern) |
| Modify `steel-etl/internal/site/build.go` | Dispatch `buildFeatureblockPage` in `buildSection`, before `injectH1` |
| Create `v2/docs/stylesheets/steel-featureblock.css` | The Forged Band sheet (wrap/head/stats + kill-block + card/flat/grid/ledger + responsive/print) |
| Modify `v2/docs/stylesheets/palette.css` | Add `--sc-role-*` tokens (single source for the role accent paydown) |
| Modify `v2/docs/stylesheets/steel-statblock.css` | Swap the literal role hexes for `var(--sc-role-*)` (pure refactor, no visual change) |
| Modify `v2/mkdocs.yml` | Add `steel-featureblock.css` to `extra_css` after `steel-statblock.css` |
| Modify `v2/docs/javascripts/settings-panel.js` | The Featureblocks settings group (`data-fb-*`, two controls, no presets) |
| Modify `v2/overrides/main.html` | Early-apply `data-fb-*` (matched pair with the panel) |
| Create `v2/tests/e2e/featureblock.e2e.cjs` | e2e: cards render with role band; drawer flips `data-fb-*` and reflows; both schemes |

All `go` commands run from `steel-etl/` (inside `devbox shell`, or prefix `devbox run --` from the workspace root).

---

### Task 1: Renderer scaffold — frontmatter unmarshal + dispatch

**Files:**
- Create: `steel-etl/internal/site/featureblock_page.go`
- Create: `steel-etl/internal/site/featureblock_page_test.go`

- [ ] **Step 1: Write the failing test**

`featureblock_page_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

const fbMalicePage = `---
name: Basilisk Malice
type: featureblock
kind: malice
flavor: At the start of any basilisk's turn, you can spend Malice to activate one of the following features.
features:
    - icon: "🔳"
      name: Walleye
      cost: 7 Malice
      body: A basilisk spews reflective spittle across an adjacent vertical surface.
---

At the start of any basilisk's turn, you can spend Malice to activate one of the following features.

> 🔳 **Walleye (7 Malice)**
>
> A basilisk spews reflective spittle across an adjacent vertical surface.
`

func TestBuildFeatureblockPage_NonFeatureblockPassesThrough(t *testing.T) {
	in := []byte("---\nname: Foo\ntype: ability\n---\n\nbody\n")
	out, ok := buildFeatureblockPage(in)
	if ok {
		t.Fatalf("ability page should not be handled by the featureblock renderer")
	}
	if string(out) != string(in) {
		t.Fatalf("non-featureblock data must be returned unchanged")
	}
}

func TestBuildFeatureblockPage_MaliceWrap(t *testing.T) {
	out, ok := buildFeatureblockPage([]byte(fbMalicePage))
	if !ok {
		t.Fatal("featureblock page should be handled")
	}
	s := string(out)
	// frontmatter preserved
	if !strings.HasPrefix(s, "---\n") || !strings.Contains(s, "type: featureblock") {
		t.Errorf("frontmatter not preserved:\n%s", s)
	}
	for _, want := range []string{
		`class="fb-wrap"`, `data-role="malice"`, `data-kind="malice"`,
		`class="fb md-typeset"`, `class="fb__head"`,
		`class="fb__eyebrow"`, "Malice Features",
		`class="fb__name"`, "Basilisk Malice",
		`class="fb__flavor"`, "spend Malice to activate",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("missing %q in:\n%s", want, s)
		}
	}
}

```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/site/ -run TestBuildFeatureblockPage -v`
Expected: FAIL — `undefined: buildFeatureblockPage`

- [ ] **Step 3: Write the implementation**

`featureblock_page.go` (this step lands the dispatch, the frontmatter struct, and the head/flavor; features come in Task 3):

```go
package site

// High-Fantasy Steel FEATUREBLOCK pages for the Steel Compendium MkDocs site.
//
// Featureblocks (malice blocks, named feature blocks like Ajax's Tactical
// Stance) and dynamic terrain are a titled COLLECTION of features under a
// loose-stat header — statblock-like in anatomy, not rigor. Where
// statblock_page.go emits a JSON island the client renderer mounts, this emits
// a finished `.fb-wrap` card at BUILD TIME (the ability_cards.go model), so the
// same renderer can later embed cards inside non-focused pages (spec
// docs/superpowers/specs/2026-06-12-featureblock-cards-design.md, "Architecture
// choice B").
//
// SITE-ONLY: runs inside `steel-etl site` against the generated md-linked pages;
// the shared data repos are never touched. Plan 1 made the page frontmatter
// non-lossy (kind/level/flavor/role/terrain_type/stats[]/features[], validated
// by featureblock.schema.json), so this reads frontmatter directly — NO body
// re-parse. Each feature is `article.sc-ability.fb__feat`, reusing the
// ability-card grammar (costBadge / richInline / cardHref / tierGlyph /
// renderSectionBlock / sbActionKind from ability_cards.go + statblock_page.go).
//
// SCOPE (Plan 2): type:featureblock + type:dynamic-terrain only. Fixture routing
// (Plan 3), retainer advancement split (Plan 4), and companion advancement cards
// (Plan 5) are NOT handled here.

import (
	"fmt"
	"html"
	"strings"

	"gopkg.in/yaml.v3"
)

// ── frontmatter shape (mirrors featureblock.schema.json) ──
type fbPowerRoll struct {
	Formula string            `yaml:"formula"`
	Tiers   map[string]string `yaml:"tiers"`
}
type fbSection struct {
	Label string `yaml:"label"`
	Text  string `yaml:"text"`
}
type fbEnh struct {
	Cost string `yaml:"cost"`
	Text string `yaml:"text"`
}
type fbFeature struct {
	Icon         string       `yaml:"icon"`
	Name         string       `yaml:"name"`
	Cost         string       `yaml:"cost"`
	Usage        string       `yaml:"usage"`
	Keywords     []string     `yaml:"keywords"`
	Distance     string       `yaml:"distance"`
	Target       string       `yaml:"target"`
	PowerRoll    *fbPowerRoll `yaml:"power_roll"`
	Sections     []fbSection  `yaml:"sections"`
	Enhancements []fbEnh      `yaml:"enhancements"`
	Body         string       `yaml:"body"`
	Trailing     string       `yaml:"trailing"`
	Level        int          `yaml:"level"`
}
type fbStat struct {
	Name  string `yaml:"name"`
	Value string `yaml:"value"`
}
type fbDoc struct {
	Name        string      `yaml:"name"`
	Type        string      `yaml:"type"`
	Kind        string      `yaml:"kind"`
	Level       int         `yaml:"level"`
	Flavor      string      `yaml:"flavor"`
	Role        string      `yaml:"role"`
	TerrainType string      `yaml:"terrain_type"`
	Stats       []fbStat    `yaml:"stats"`
	Features    []fbFeature `yaml:"features"`
}

// buildFeatureblockPage rewrites a type:featureblock | type:dynamic-terrain page
// body into the .fb-wrap card. Returns (newData, true) when handled; (data,
// false) otherwise so the caller writes the page unchanged. Frontmatter is
// preserved verbatim; injectH1 (next in buildSection) prepends the "# Name"
// MkDocs needs for title/nav (CSS hides it once .fb-wrap is present).
func buildFeatureblockPage(data []byte) ([]byte, bool) {
	fm, _ := splitFrontmatter(string(data))
	switch strings.TrimSpace(parseFrontmatterField(fm, "type")) {
	case "featureblock", "dynamic-terrain":
	default:
		return data, false
	}
	var doc fbDoc
	if err := yaml.Unmarshal([]byte(fm), &doc); err != nil {
		return data, false // malformed frontmatter → leave page as-is
	}
	card := renderFeatureblockCard(doc)
	return []byte("---\n" + fm + "\n---\n\n" + card), true
}

// fbDataRole maps a doc to the [data-role] the CSS colors. Terrain/fixtures use
// their combat role; malice/feature blocks fall back to grey via the
// "malice"/"feature" keys (defined in steel-featureblock.css).
func fbDataRole(doc fbDoc) string {
	if r := strings.ToLower(strings.TrimSpace(doc.Role)); r != "" {
		return r
	}
	if doc.Kind == "malice" {
		return "malice"
	}
	return "feature"
}

// fbEyebrow composes the head eyebrow line: "Level N <TerrainType> · <Role>" for
// terrain/fixtures, else "Malice Features" / "Features".
func fbEyebrow(doc fbDoc) string {
	if doc.TerrainType != "" {
		s := doc.TerrainType
		if doc.Level > 0 {
			s = fmt.Sprintf("Level %d %s", doc.Level, doc.TerrainType)
		}
		if r := strings.TrimSpace(doc.Role); r != "" {
			s += " · " + r
		}
		return s
	}
	if doc.Kind == "malice" {
		return "Malice Features"
	}
	return "Features"
}

// renderFeatureblockCard builds the contiguous (no blank-line) raw-HTML card so
// md_in_html passes it through verbatim. Features land in Task 3.
func renderFeatureblockCard(doc fbDoc) string {
	name := strings.TrimSpace(doc.Name)
	if name == "" {
		name = "Featureblock"
	}

	var b strings.Builder
	fmt.Fprintf(&b, "<div class=\"fb-wrap\" data-role=\"%s\"", html.EscapeString(fbDataRole(doc)))
	if doc.Kind != "" {
		fmt.Fprintf(&b, " data-kind=\"%s\"", html.EscapeString(doc.Kind))
	}
	b.WriteString(">\n")
	b.WriteString("<article class=\"fb md-typeset\">\n")

	// head: eyebrow + name
	b.WriteString("<header class=\"fb__head\">\n")
	fmt.Fprintf(&b, "<div class=\"fb__eyebrow\">%s</div>\n", html.EscapeString(fbEyebrow(doc)))
	fmt.Fprintf(&b, "<h2 class=\"fb__name\">%s</h2>\n", html.EscapeString(name))
	b.WriteString("</header>\n")

	if f := strings.TrimSpace(doc.Flavor); f != "" {
		fmt.Fprintf(&b, "<div class=\"fb__flavor\">%s</div>\n", richInline(f))
	}

	b.WriteString(renderFbStats(doc.Stats))
	b.WriteString(renderFbFeats(doc.Features))

	b.WriteString("</article>\n")
	b.WriteString("</div>\n")
	return b.String()
}

// renderFbStats / renderFbFeats are filled in Tasks 2 and 3.
func renderFbStats(stats []fbStat) string { return "" }
func renderFbFeats(feats []fbFeature) string { return "" }
```

- [ ] **Step 4: Run to verify pass**

Run: `go test ./internal/site/ -run TestBuildFeatureblockPage -v`
Expected: PASS (2 tests). `renderFbStats`/`renderFbFeats` are stubs; the malice test asserts only head/flavor, which exist.

- [ ] **Step 5: Commit**

```bash
git add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git commit -m "feat: featureblock page renderer scaffold (head + flavor, frontmatter unmarshal)"
```

---

### Task 2: Loose stats block

**Files:**
- Modify: `steel-etl/internal/site/featureblock_page.go` (`renderFbStats`)
- Modify: `steel-etl/internal/site/featureblock_page_test.go`

- [ ] **Step 1: Write the failing test**

Append to `featureblock_page_test.go`:

```go
const fbTerrainPage = `---
name: Angry Beehive
type: dynamic-terrain
level: 2
terrain_type: Hazard
role: Hexer
flavor: This beehive is full of angry bees.
stats:
    - name: EV
      value: "2"
    - name: Stamina
      value: "3 per square"
features:
    - icon: "🌀"
      name: Deactivate
      body: The beehive can't be deactivated.
    - icon: "❗️"
      name: Your Fears Become Manifest
      usage: Main action
      keywords:
        - Area
        - Magic
      distance: 10 burst
      power_roll:
        formula: + 2
        tiers:
            low: P < 1 slowed (EoT)
            mid: P < 2 slowed and weakened (EoT)
            high: P < 3 frightened (EoT)
---

body
`

func TestRenderFbStats(t *testing.T) {
	out, ok := buildFeatureblockPage([]byte(fbTerrainPage))
	if !ok {
		t.Fatal("terrain page should be handled")
	}
	s := string(out)
	for _, want := range []string{
		`data-role="hexer"`, "Level 2 Hazard · Hexer",
		`class="fb__stats"`,
		`class="fb__stat"`, `class="fb__stat-l">EV<`, `class="fb__stat-v">2<`,
		`class="fb__stat-l">Stamina<`, "3 per square",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("missing %q in:\n%s", want, s)
		}
	}
}

func TestRenderFbStats_EmptyWhenAbsent(t *testing.T) {
	out, _ := buildFeatureblockPage([]byte(fbMalicePage))
	if strings.Contains(string(out), `class="fb__stats"`) {
		t.Error("malice block has no stats; fb__stats container should be omitted")
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/site/ -run TestRenderFbStats -v`
Expected: FAIL — `fb__stats` absent (stub returns "")

- [ ] **Step 3: Implement `renderFbStats`**

Replace the `renderFbStats` stub:

```go
// renderFbStats lays out the loose header stats ("EV: 2", "Stamina: 3 per
// square"). The grid-vs-ledger layout is a pure CSS reflow (data-fb-stats), so
// the markup is layout-agnostic: an ordered list of label/value cells.
func renderFbStats(stats []fbStat) string {
	if len(stats) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString("<div class=\"fb__stats\">\n")
	for _, st := range stats {
		fmt.Fprintf(&b,
			"<div class=\"fb__stat\"><div class=\"fb__stat-l\">%s</div><div class=\"fb__stat-v\">%s</div></div>\n",
			html.EscapeString(strings.TrimSpace(st.Name)), richInline(strings.TrimSpace(st.Value)))
	}
	b.WriteString("</div>\n")
	return b.String()
}
```

- [ ] **Step 4: Run to verify pass**

Run: `go test ./internal/site/ -run "TestRenderFbStats|TestBuildFeatureblockPage" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git commit -m "feat: featureblock loose stats block"
```

---

### Task 3: Features — head, action accent, internals

**Files:**
- Modify: `steel-etl/internal/site/featureblock_page.go` (`renderFbFeats`, helpers)
- Modify: `steel-etl/internal/site/featureblock_page_test.go`

- [ ] **Step 1: Write the failing tests**

Append:

```go
func TestRenderFbFeats_PassiveMalice(t *testing.T) {
	out, _ := buildFeatureblockPage([]byte(fbMalicePage))
	s := string(out)
	for _, want := range []string{
		`class="fb__feats"`,
		`class="sc-ability fb__feat" data-action="passive"`, // 🔳 → no usage/cost-table → passive
		`class="fb__feat-icon"`, "🔳",
		`class="fb__feat-name`, "Walleye",
		`class="sc-ability__cost"`, "Malice", // cost badge "7 Malice"
		`class="fb__feat-body"`, "reflective spittle",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("missing %q in:\n%s", want, s)
		}
	}
}

func TestRenderFbFeats_TerrainSpecialAndPowerRoll(t *testing.T) {
	out, _ := buildFeatureblockPage([]byte(fbTerrainPage))
	s := string(out)
	for _, want := range []string{
		`data-action="special"`, "Deactivate", // 🌀 → special (icon fallback, not passive)
		`data-action="main"`, "Your Fears Become Manifest", // usage "Main action" → main
		`class="sc-ability__chip">Area<`, `class="sc-ability__chip">Magic<`,
		`class="sc-ability__rail"`, "10 burst",
		`class="sc-ability__pr"`, "Power Roll", "+ 2",
		`class="sc-ability__tier" data-tier="low"`, "slowed",
		`class="sc-ability__tier" data-tier="high"`, "frightened",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("missing %q in:\n%s", want, s)
		}
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/site/ -run TestRenderFbFeats -v`
Expected: FAIL — `fb__feats` and feature markup absent (stub returns "")

- [ ] **Step 3: Implement `renderFbFeats` + helpers**

Replace the `renderFbFeats` stub:

```go
// fbIconAction maps a table-less feature's source emoji to an action accent so
// terrain's 🌀 Deactivate / ❕ Activate and malice passives don't all flatten to
// "passive" (spec §3). Mirrors ability-cards.js EMOJI_MAP, collapsed onto the
// action-accent vocabulary steel-featureblock.css colors. Keys are STRING
// literals matched with Contains — robust to the trailing U+FE0F variation
// selector book emoji carry (a rune-literal map would choke on those).
var fbIconAction = map[string]string{
	"🗡": "main", "🏹": "main", "❇": "main",
	"👤": "maneuver",
	"❗": "triggered", "❕": "triggered",
	"⭐": "passive",
	"☠": "villain",
	"🌀": "special",
}

// fbFeatureAction picks the [data-action] accent. Abilities with a usage word
// (or villain cost) route through sbActionKind exactly like statblock features;
// table-less features fall back to their icon emoji, then to "passive".
func fbFeatureAction(f fbFeature) string {
	if strings.HasPrefix(strings.ToLower(strings.TrimSpace(f.Cost)), "villain action") {
		return "villain"
	}
	if strings.TrimSpace(f.Usage) != "" {
		action, _ := sbActionKind(f.Usage, f.Cost)
		return action
	}
	icon := strings.TrimSpace(f.Icon)
	for k, a := range fbIconAction {
		if strings.Contains(icon, k) {
			return a
		}
	}
	return "passive"
}

// renderFbFeats renders the feature list. Each feature is article.sc-ability so
// it inherits steel-ability-cards.css internals; the one-line head (icon · name
// · cost) replaces the ability card's crest/eyebrow ceremony.
func renderFbFeats(feats []fbFeature) string {
	if len(feats) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString("<div class=\"fb__feats\">\n")
	for _, f := range feats {
		fmt.Fprintf(&b, "<article class=\"sc-ability fb__feat\" data-action=\"%s\">\n", fbFeatureAction(f))

		// head: icon · name · cost
		b.WriteString("<div class=\"fb__feat-head\">")
		if ic := strings.TrimSpace(f.Icon); ic != "" {
			fmt.Fprintf(&b, "<span class=\"fb__feat-icon\">%s</span>", html.EscapeString(ic))
		}
		fmt.Fprintf(&b, "<h3 class=\"fb__feat-name sc-ability__name\">%s</h3>", html.EscapeString(strings.TrimSpace(f.Name)))
		fmt.Fprintf(&b, "<div class=\"fb__feat-corner\">%s</div>", costBadge(strings.TrimSpace(f.Cost)))
		b.WriteString("</div>\n")

		// keyword chips (reused ability-card grammar)
		if len(f.Keywords) > 0 {
			b.WriteString("<div class=\"sc-ability__kw\">")
			for _, k := range f.Keywords {
				fmt.Fprintf(&b, "<span class=\"sc-ability__chip\">%s</span>", richInline(strings.TrimSpace(k)))
			}
			b.WriteString("</div>\n")
		}

		// distance / target rail
		if strings.TrimSpace(f.Distance) != "" || strings.TrimSpace(f.Target) != "" {
			b.WriteString("<div class=\"sc-ability__rail\">")
			fmt.Fprintf(&b, "<div class=\"sc-ability__cell\"><div class=\"l\">Distance</div><div class=\"v\">%s</div></div>", railValue(f.Distance))
			fmt.Fprintf(&b, "<div class=\"sc-ability__cell\"><div class=\"l\">Targets</div><div class=\"v\">%s</div></div>", railValue(f.Target))
			b.WriteString("</div>\n")
		}

		// power roll
		if f.PowerRoll != nil {
			b.WriteString(fbPowerRollHTML(*f.PowerRoll))
		}

		// titled sections (Effect / Trigger / Special …)
		for _, s := range f.Sections {
			b.WriteString("<div class=\"sc-ability__section\">")
			if l := strings.TrimSpace(s.Label); l != "" {
				fmt.Fprintf(&b, "<div class=\"sc-ability__section-head\"><span class=\"sc-ability__dia\"></span><span class=\"tag\">%s</span></div>", html.EscapeString(l))
			}
			fmt.Fprintf(&b, "<div class=\"sc-ability__section-body\">%s</div>", renderSectionBlock(strings.TrimSpace(s.Text)))
			b.WriteString("</div>\n")
		}

		// cost enhancements (2 Malice / Spend …)
		for _, e := range f.Enhancements {
			fmt.Fprintf(&b, "<div class=\"sc-ability__enh\"><span class=\"cost\">%s</span><span class=\"txt\">%s</span></div>\n",
				html.EscapeString(strings.TrimSpace(e.Cost)), richInline(strings.TrimSpace(e.Text)))
		}

		// table-less prose body / post-table trailing note
		if body := strings.TrimSpace(f.Body); body != "" {
			fmt.Fprintf(&b, "<div class=\"fb__feat-body\">%s</div>\n", richInline(body))
		}
		if tr := strings.TrimSpace(f.Trailing); tr != "" {
			fmt.Fprintf(&b, "<div class=\"fb__feat-trailing\">%s</div>\n", richInline(tr))
		}

		b.WriteString("</article>\n")
	}
	b.WriteString("</div>\n")
	return b.String()
}

// fbPowerRollHTML renders the steel power-roll panel: an optional
// "Power Roll <formula>" head (omitted for a bare test, where formula is "")
// followed by the glyph-badged tier rows. Reuses tierGlyph / tierKey
// (ability_cards.go). Unlike the ability card's tierPanelHTML (which hardcodes
// "Power Roll +" before the characteristics), this prints the stored formula
// verbatim — it already carries its sign ("+ 2") or full dice ("2d10 + R").
func fbPowerRollHTML(pr fbPowerRoll) string {
	var b strings.Builder
	b.WriteString("<div class=\"sc-ability__pr\">")
	if f := strings.TrimSpace(pr.Formula); f != "" {
		fmt.Fprintf(&b, "<div class=\"sc-ability__pr-head\"><span class=\"sc-ability__dia\"></span><span class=\"pre\">Power Roll</span><span class=\"chars\">%s</span></div>", richInline(f))
	}
	b.WriteString("<div class=\"sc-ability__pr-rows\">")
	for i := 0; i < 3; i++ {
		if v := strings.TrimSpace(pr.Tiers[tierKey[i]]); v != "" {
			fmt.Fprintf(&b, "<div class=\"sc-ability__tier\" data-tier=\"%s\"><span class=\"badge\">%s</span><span class=\"res\">%s</span></div>",
				tierKey[i], tierGlyph[i], richInline(v))
		}
	}
	b.WriteString("</div></div>\n")
	return b.String()
}
```

- [ ] **Step 4: Run to verify pass**

Run: `go test ./internal/site/ -run "TestRenderFbFeats|TestRenderFbStats|TestBuildFeatureblockPage" -v`
Expected: PASS (all featureblock tests)

- [ ] **Step 5: Run the whole package + vet, commit**

Run: `go test ./internal/site/ && go vet ./internal/site/`
Expected: ok — existing statblock/ability/bestiary tests still pass (the new file adds package-level names `fbIconAction`/`fbFeatureAction`/etc.; if any collide with an existing symbol, rename the fb one).

```bash
git add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git commit -m "feat: featureblock features — head, action accent, power roll, sections"
```

---

### Task 4: Wire the renderer into the site build

**Files:**
- Modify: `steel-etl/internal/site/build.go` (in `buildSection`, ~line 248)

- [ ] **Step 1: Add the dispatch**

In `build.go`, after the `buildStatblockIslandPage` block and **before** `data = injectH1(data)`:

```go
		// Featureblock / dynamic-terrain pages → the High-Fantasy Steel
		// .fb-wrap "Forged Band" card (build-time HTML, frontmatter-driven).
		// Site-only; runs before injectH1 like the cards above.
		if card, ok := buildFeatureblockPage(data); ok {
			data = card
		}
```

The block now reads:
```go
		if island, ok := buildStatblockIslandPage(data); ok {
			data = island
		}

		// Featureblock / dynamic-terrain pages → the High-Fantasy Steel
		// .fb-wrap "Forged Band" card (build-time HTML, frontmatter-driven).
		// Site-only; runs before injectH1 like the cards above.
		if card, ok := buildFeatureblockPage(data); ok {
			data = card
		}

		// Inject h1 header from frontmatter "name" field if the body lacks one
		data = injectH1(data)
```

- [ ] **Step 2: Build + vet the package**

Run: `go build ./... && go vet ./internal/site/`
Expected: ok. (`buildStatblockIslandPage` returns `false` for featureblock/terrain pages — `type != "statblock"` — so the two dispatches never collide.)

- [ ] **Step 3: Run the full test suite**

Run: `go test ./...`
Expected: ok

- [ ] **Step 4: Commit**

```bash
git add internal/site/build.go
git commit -m "feat: dispatch featureblock renderer in site build"
```

---

### Task 5: Role-token paydown (palette.css + steel-statblock.css)

**Files:**
- Modify: `v2/docs/stylesheets/palette.css`
- Modify: `v2/docs/stylesheets/steel-statblock.css:29-43`

> **Commit in `v2/`.** This is a **pure refactor** — the hex values are identical, just relocated to a single source. No visual change; the statblock e2e (Task 10) re-validates.

- [ ] **Step 1: Add `--sc-role-*` tokens to palette.css**

At the **top of `palette.css`**, immediately after the header comment block (before the `[data-md-color-scheme="default"]` block), add a scheme-independent `:root` block (the role hexes were scheme-independent in steel-statblock.css):

```css
/* ── Role accent palette (single source) ──
   One saturated color per Draw Steel combat role, consumed by
   steel-statblock.css (.sb-wrap[data-role]) and steel-featureblock.css
   (.fb-wrap[data-role]). Malice/feature blocks reuse the grey leader hue. */
:root {
    --sc-role-ambusher:   #e3c14a;  /* yellow */
    --sc-role-harrier:    #e07ba8;  /* pink   */
    --sc-role-artillery:  #a87cd6;  /* purple */
    --sc-role-brute:      #5d8fe0;  /* blue   */
    --sc-role-controller: #e0584b;  /* red    */
    --sc-role-leader:     #9aa2a8;  /* grey   */
    --sc-role-solo:       #9aa2a8;  /* grey   */
    --sc-role-hexer:      #5cc98a;  /* green  */
    --sc-role-mount:      #48c9b0;  /* teal   */
    --sc-role-support:    #e8954a;  /* orange */
    --sc-role-defender:   #c7a173;  /* tan    */
    --sc-role-minion:     #9aa2a8;  /* grey   */
    --sc-role-malice:     #9aa2a8;  /* grey — malice & named feature blocks */
}
```

- [ ] **Step 2: Point steel-statblock.css at the tokens**

Replace lines 29–43 of `steel-statblock.css` (the `/* ── ROLE palette … ── */` block) with:

```css
/* ── ROLE palette: one saturated color per block, keyed to Role.
   Hexes live in palette.css (--sc-role-*) as the single source. ── */
.sb-wrap[data-role="ambusher"]   { --role: var(--sc-role-ambusher); }
.sb-wrap[data-role="harrier"]    { --role: var(--sc-role-harrier); }
.sb-wrap[data-role="artillery"]  { --role: var(--sc-role-artillery); }
.sb-wrap[data-role="brute"]      { --role: var(--sc-role-brute); }
.sb-wrap[data-role="controller"] { --role: var(--sc-role-controller); }
.sb-wrap[data-role="leader"]     { --role: var(--sc-role-leader); }
.sb-wrap[data-role="solo"]       { --role: var(--sc-role-solo); }
.sb-wrap[data-role="hexer"]      { --role: var(--sc-role-hexer); }
.sb-wrap[data-role="mount"]      { --role: var(--sc-role-mount); }
.sb-wrap[data-role="support"]    { --role: var(--sc-role-support); }
.sb-wrap[data-role="defender"]   { --role: var(--sc-role-defender); }
.sb-wrap[data-role="minion"]     { --role: var(--sc-role-minion); }
/* the role word in the header + sticky needs --role on its own element too */
.sb__sticky-role[data-role="leader"]{--role:var(--sc-role-leader)} .sb__sticky-role[data-role="brute"]{--role:var(--sc-role-brute)}
.sb__role[data-role="leader"]{--role:var(--sc-role-leader)} .sb__role[data-role="brute"]{--role:var(--sc-role-brute)}
```

- [ ] **Step 3: Sanity-check no literal role hex remains in steel-statblock.css's role block**

Run: `grep -n "data-role=\"" v2/docs/stylesheets/steel-statblock.css | grep "#"`
Expected: no output (every `data-role` rule now uses `var(--sc-role-*)`).

- [ ] **Step 4: Commit (in v2/)**

```bash
cd v2
git add docs/stylesheets/palette.css docs/stylesheets/steel-statblock.css
git commit -m "refactor: move role hexes to palette.css --sc-role-* (single source)"
cd ..
```

---

### Task 6: steel-featureblock.css — plate, head, stats

**Files:**
- Create: `v2/docs/stylesheets/steel-featureblock.css`

- [ ] **Step 1: Create the sheet with the wrap/head/stats half**

```css
/* ============================================================
   steel-featureblock.css — Draw Steel FEATUREBLOCKS (malice blocks,
   named feature blocks, dynamic terrain), High-Fantasy Steel "Forged Band".
   Loads AFTER steel-statblock.css. Each feature is `article.sc-ability.fb__feat`,
   so it reuses steel-ability-cards.css internals (.sc-ability__kw / __rail /
   __pr / __tier / __section / __enh + DrawSteelGlyphs tier badges); this sheet
   styles the wrap/head/stats and the feature kill-block + preferences.

   Preferences (data-attr on <html>, independent of data-sb-*):
     data-fb-featstyle  card | flat    feature frame
     data-fb-stats      grid | ledger  loose header stat line
   Role accent: --role, from the single-source --sc-role-* tokens (palette.css).
   ============================================================ */

/* ── ROLE accent (single source: palette.css --sc-role-*) ── */
.fb-wrap[data-role="ambusher"]   { --role: var(--sc-role-ambusher); }
.fb-wrap[data-role="harrier"]    { --role: var(--sc-role-harrier); }
.fb-wrap[data-role="artillery"]  { --role: var(--sc-role-artillery); }
.fb-wrap[data-role="brute"]      { --role: var(--sc-role-brute); }
.fb-wrap[data-role="controller"] { --role: var(--sc-role-controller); }
.fb-wrap[data-role="leader"]     { --role: var(--sc-role-leader); }
.fb-wrap[data-role="solo"]       { --role: var(--sc-role-solo); }
.fb-wrap[data-role="hexer"]      { --role: var(--sc-role-hexer); }
.fb-wrap[data-role="mount"]      { --role: var(--sc-role-mount); }
.fb-wrap[data-role="support"]    { --role: var(--sc-role-support); }
.fb-wrap[data-role="defender"]   { --role: var(--sc-role-defender); }
.fb-wrap[data-role="minion"]     { --role: var(--sc-role-minion); }
.fb-wrap[data-role="malice"],
.fb-wrap[data-role="feature"]    { --role: var(--sc-role-malice); }

/* ── MkDocs H1 hide (the card carries its own name) ── */
.md-typeset:has(> .fb-wrap) > h1:first-child,
.md-typeset:has(> .fb-wrap) > h1:first-child + hr { display: none; }

/* ── PLATE ── */
.fb-wrap {
  --pad: 1.2rem;
  --fb-plate-solid: #1e2327;            /* solid mid-tone of the plate, for diamond halos */
  position: relative; max-width: 47rem; margin: 1.7rem auto;
}
[data-md-color-scheme="default"] .fb-wrap { --fb-plate-solid: #f4f6f6; }
.md-typeset.fb {
  position: relative; margin: 0; padding: 0 0 .35rem;
  border: 1px solid rgba(255,255,255,.06); border-radius: .65rem;
  background: var(--fx-card-bg);
  box-shadow: var(--fx-bevel), 0 10px 26px rgba(0,0,0,.36);
  overflow: clip; color: var(--md-default-fg-color);
}
[data-md-color-scheme="default"] .md-typeset.fb {
  border-color: var(--md-default-fg-color--lightest);
  box-shadow: var(--fx-bevel), 0 5px 14px rgba(0,0,0,.09);
}

/* ── FORGED BAND head: role gradient + centered diamond on the bottom border ── */
.fb__head {
  position: relative; padding: 1rem var(--pad) 1.05rem; margin-bottom: .55rem;
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--role) 40%, var(--fb-plate-solid)),
      color-mix(in srgb, var(--role) 9%, var(--fb-plate-solid)));
  border-bottom: 1px solid color-mix(in srgb, var(--role) 38%, transparent);
}
.fb__head::after {
  content: ""; position: absolute; left: 50%; bottom: 0; width: 9px; height: 9px;
  transform: translate(-50%, 50%) rotate(45deg); background: var(--role);
  box-shadow: 0 0 0 4px var(--fb-plate-solid), 0 0 0 5px color-mix(in srgb, var(--role) 40%, var(--fb-plate-solid));
}
.fb__eyebrow {
  font-family: var(--md-small-header-font); font-variant: small-caps; text-transform: uppercase;
  letter-spacing: .08em; font-size: .86rem; color: var(--role);
  filter: brightness(1.15) saturate(1.1); margin-bottom: .12rem;
}
.md-typeset .fb__name {
  margin: 0; font-family: var(--md-large-header-font); text-transform: uppercase;
  font-size: 2.1rem; line-height: .98; color: var(--sc-steel-lighter);
  text-shadow: var(--fx-emboss); letter-spacing: .01em; text-wrap: balance;
}

/* ── FLAVOR ── */
.fb__flavor {
  font-family: var(--md-small-header-font); font-style: italic;
  color: var(--md-default-fg-color--light); font-size: .94rem; line-height: 1.55;
  padding: 0 var(--pad); margin: 0 0 .6rem; text-wrap: pretty;
}
.fb__flavor a { color: inherit; }

/* ── LOOSE STATS (data-fb-stats: grid | ledger) ── */
.fb__stats { padding: 0 var(--pad) .7rem; }
.fb__stat-l { font-family: var(--md-small-header-font); font-variant: small-caps; letter-spacing: .05em; font-size: .74rem; color: var(--fx-metal); }
.fb__stat-v { color: var(--md-default-fg-color); font-size: .95rem; line-height: 1.3; text-wrap: pretty; }
.fb__stat-v b { color: var(--sc-steel-lighter); }
/* grid: boxed value-over-label cells, auto-fit so long values get their own row */
[data-fb-stats="grid"] .fb__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: .4rem; }
[data-fb-stats="grid"] .fb__stat {
  border: 1px solid var(--fx-metal-faint); border-radius: 8px; padding: .45rem .6rem; min-height: 3.1rem;
  background: rgba(0,0,0,.16); display: flex; flex-direction: column-reverse; align-items: center; justify-content: center; text-align: center; gap: .1rem;
}
/* scheme attr lives on <body>, data-fb-* on <html> — html-anchored attr FIRST */
[data-fb-stats="grid"] [data-md-color-scheme="default"] .fb__stat { background: rgba(0,0,0,.022); }
[data-fb-stats="grid"] .fb__stat-v { font-weight: 700; color: var(--sc-steel-lighter); }
/* ledger: hairline label/value rows */
[data-fb-stats="ledger"] .fb__stats { display: flex; flex-direction: column; }
[data-fb-stats="ledger"] .fb__stat { display: flex; align-items: baseline; justify-content: space-between; gap: .7rem; padding: .4rem .1rem; border-bottom: 1px solid var(--fx-metal-faint); }
[data-fb-stats="ledger"] .fb__stat-v { text-align: right; }
```

- [ ] **Step 2: Register the sheet in mkdocs.yml**

In `v2/mkdocs.yml`, in `extra_css`, add the line **immediately after** `- stylesheets/steel-statblock.css`:

```yaml
  - stylesheets/steel-statblock.css
  - stylesheets/steel-featureblock.css
```

- [ ] **Step 3: Commit (in v2/)**

```bash
cd v2
git add docs/stylesheets/steel-featureblock.css mkdocs.yml
git commit -m "feat: steel-featureblock.css plate/head/stats + register sheet"
cd ..
```

(Visual verification happens in Task 10 after the renderer output + the feature half land.)

---

### Task 7: steel-featureblock.css — features (kill-block, card/flat, accents)

**Files:**
- Modify: `v2/docs/stylesheets/steel-featureblock.css` (append)

- [ ] **Step 1: Append the feature half**

Append to `steel-featureblock.css`:

```css
/* ════════════════════════════════════════════════════════════
   FEATURES
   ════════════════════════════════════════════════════════════ */
.fb__feats { padding: .2rem var(--pad) var(--pad); display: flex; flex-direction: column; gap: .65rem; }

/* action accents. Each feature is article.sc-ability.fb__feat, so --act for
   main/maneuver/triggered/move/none/trait is already inherited from
   steel-ability-cards.css; add the featureblock-specific keys. */
.fb__feat[data-action="passive"] { --act: var(--sc-act-none); }
.fb__feat[data-action="villain"] { --act: #e0584b; }   /* red  */
.fb__feat[data-action="special"] { --act: #48c9b0; }   /* teal — terrain activate / deactivate */

/* ── KILL BLOCK — neutralize the steel-ability-cards.css plate chrome ──
   .fb__feat IS .sc-ability, so the kills select .fb__feat directly at the SAME
   specificity floors as the ability-card rules; this sheet loads after
   steel-ability-cards.css, so equal specificity wins by order:
     .md-typeset .sc-ability                                   (0,2,0) plate
     [data-md-color-scheme="default"] .md-typeset .sc-ability  (0,3,0) light plate
     .md-typeset .sc-ability::before                           (0,2,1) watermark
     .md-typeset .sc-ability:hover                             (0,3,0) hover lift
   Keep ALL featstyle mode rules AFTER this block (they re-declare the contested
   ::before — see the statblock flat-mode separator for the same footgun). */
.fb .fb__feat { margin: 0; border: none; background: none; box-shadow: none; overflow: visible; transition: none; padding: 0; }
[data-md-color-scheme="default"] .fb .fb__feat { background: none; }
.fb .fb__feat::before { display: none; }
.fb .fb__feat:hover { transform: none; box-shadow: none; }

/* ── FEATURE HEAD — one line: icon · name · cost ── */
.fb__feat-head { display: flex; align-items: baseline; gap: .55rem; }
.fb__feat-icon { align-self: center; font-size: 1.1rem; line-height: 1; }
.md-typeset .fb__feat-name { font-size: 1.25rem; margin: 0; flex: 1; min-width: 0; }
.fb__feat-corner { margin-left: auto; align-self: baseline; }
.fb__feat-corner .sc-ability__cost { white-space: nowrap; }

/* ── FEATURE FRAME — data-fb-featstyle: card | flat ── */
/* card = own container with an action-colored spine */
[data-fb-featstyle="card"] .fb__feat { background: rgba(0,0,0,.16); border-left: 3px solid var(--act); border-radius: 9px; padding: .7rem .85rem .78rem; }
[data-fb-featstyle="card"] [data-md-color-scheme="default"] .fb__feat { background: rgba(0,0,0,.022); }
/* flat = stylized-hr separators (line + dots + diamond), gap 0 */
[data-fb-featstyle="flat"] .fb__feats { gap: 0; }
[data-fb-featstyle="flat"] .fb__feat { padding: .9rem .2rem; }
/* separator pseudos sit at the border-box top edge: visual gap = margin-top
   (above the divider) + padding-top (below). Keep EQUAL or the diamond drifts. */
[data-fb-featstyle="flat"] .fb__feat + .fb__feat { position: relative; margin-top: calc(1.25rem + -16px); padding-top: 1.25rem; }
[data-fb-featstyle="flat"] .fb__feat + .fb__feat::before {
  /* this ::before doubles as the ability-card watermark (display:none'd by the
     kill block) — repurposing a contested pseudo must re-declare all three. */
  display: block; opacity: 1; mix-blend-mode: normal;
  content: ""; position: absolute; top: 2px; left: 5%; right: 5%; height: 4px;
  background:
    linear-gradient(to right, transparent, var(--fx-metal-line)) no-repeat left center,
    linear-gradient(to left,  transparent, var(--fx-metal-line)) no-repeat right center,
    radial-gradient(circle, var(--fx-metal) 1.4px, transparent 1.9px) no-repeat calc(50% - 24px) center,
    radial-gradient(circle, var(--fx-metal) 1.4px, transparent 1.9px) no-repeat calc(50% + 24px) center;
  background-size: calc(50% - 30px) 1px, calc(50% - 30px) 1px, 4px 4px, 4px 4px;
}
[data-fb-featstyle="flat"] .fb__feat + .fb__feat::after {
  content: ""; position: absolute; top: 4px; left: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px;
  background: var(--fx-metal); transform: rotate(45deg);
  box-shadow: 0 0 0 4px var(--fb-plate-solid), 0 0 0 5px var(--fx-metal-faint);
}

/* ── feature internals spacing (reused ability-card grammar) ── */
.fb__feat .sc-ability__kw { margin-top: .5rem; }
.fb__feat .sc-ability__rail { margin-top: .55rem; }
.fb__feat .sc-ability__pr { margin-top: .7rem; }
.fb__feat .sc-ability__section { margin-top: .65rem; }
.fb__feat .sc-ability__enh { margin-top: .85rem; }
.fb__feat-body, .fb__feat-trailing { font-size: .92rem; line-height: 1.5; color: var(--md-default-fg-color--light); text-wrap: pretty; margin: .5rem 0 0; }
.fb__feat-body a, .fb__feat-trailing a, .fb__feat .sc-ability__section-body a, .fb__feat .res a { color: inherit; }

/* ════════════════════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════════════════════ */
@media (max-width: 34em) {
  .fb-wrap { --pad: .85rem; }
  .md-typeset .fb__name { font-size: 1.7rem; }
  [data-fb-stats="grid"] .fb__stats { grid-template-columns: 1fr 1fr; }
}

/* ════════════════════════════════════════════════════════════
   PRINT
   ════════════════════════════════════════════════════════════ */
@media print {
  .md-typeset.fb { box-shadow: none; border: 1px solid #999; break-inside: avoid; }
  .fb__feat, .fb__stat, .fb__feat .sc-ability__pr, .fb__feat .sc-ability__section { background: none !important; }
}
```

- [ ] **Step 2: Commit (in v2/)**

```bash
cd v2
git add docs/stylesheets/steel-featureblock.css
git commit -m "feat: steel-featureblock.css features — kill-block, card/flat, accents"
cd ..
```

---

### Task 8: Featureblocks settings group

**Files:**
- Modify: `v2/docs/javascripts/settings-panel.js`
- Modify: `v2/overrides/main.html`

> Two controls, no presets (the spec: two prefs don't warrant one). Prefs persist under `prefs.featureblock.{featstyle,stats}` in the shared `mkdocs:fontPrefs` store. **Do not edit `v2/site/javascripts/settings-panel.js`** (build output).

- [ ] **Step 1: Add the FB constants + apply fn**

In `settings-panel.js`, after the `SB_PRESETS` block (~line 39), add:

```javascript
  // ---------- featureblock layout preferences (steel-featureblock.css) ----------
  // Independent <html data-fb-*> attributes; persisted under prefs.featureblock.
  // No presets (only two prefs). Defaults mirror the early-apply in main.html.
  var FB_KEYS = ["featstyle", "stats"];
  var FB_DEFAULTS = { featstyle: "card", stats: "grid" };
```

In `applyStatblocks`'s neighborhood, add an apply fn after the `applyStatblocks` function definition (after its closing `}` near line 122):

```javascript
  function applyFeatureblocks(prefs) {
    var fb = prefs.featureblock || {};
    var html = document.documentElement;
    FB_KEYS.forEach(function (k) {
      html.setAttribute("data-fb-" + k, fb[k] || FB_DEFAULTS[k]);
    });
  }
```

In `applyAll` (~line 136), add the call after `applyStatblocks(prefs);`:

```javascript
    applyStatblocks(prefs);
    applyFeatureblocks(prefs);
```

- [ ] **Step 2: Add the drawer markup**

In `buildDrawer`, immediately after the closing `'</details>'` of the Statblocks group (the `sc-set__group--sb` details, ~line 373) and before the Fonts `<details>`, insert:

```javascript
        '<details class="sc-set__group sc-set__group--fb"><summary>Featureblocks</summary>' +
          '<div class="sc-set__row">' +
            '<label class="sc-set__label" for="set-fb-featstyle">Feature style' +
              sbHelp("Each feature in its own card with a colored left border, or a flat list separated by diamond rules.") + '</label>' +
            '<select class="sc-set__select" id="set-fb-featstyle">' +
              '<option value="card">Cards</option>' +
              '<option value="flat">Flat + separators</option>' +
            '</select>' +
          '</div>' +
          '<div class="sc-set__row">' +
            '<label class="sc-set__label" for="set-fb-stats">Stat line' +
              sbHelp("Layout for the loose header stats (EV, Stamina, Size): boxed grid cells or hairline ledger rows.") + '</label>' +
            '<select class="sc-set__select" id="set-fb-stats">' +
              '<option value="grid">Grid cells</option>' +
              '<option value="ledger">Ledger rows</option>' +
            '</select>' +
          '</div>' +
        '</details>' +
```

- [ ] **Step 3: Bind the controls**

In `bindDrawer`, after `var syncSb = bindStatblocks(drawer);` (~line 558), add:

```javascript
    var syncFb = bindFeatureblocks(drawer);
```

In the Reset handler (`#set-reset` click, ~line 561), after `syncSb();`, add:

```javascript
      syncSb();
      syncFb();
```

Then add the `bindFeatureblocks` function after `bindStatblocks` (after its closing `}` ~line 631):

```javascript
  // ---------- bind featureblock controls ----------
  // Returns syncUI() the Reset handler calls to re-derive controls from prefs.
  function bindFeatureblocks(drawer) {
    function fb() { return prefs.featureblock || (prefs.featureblock = {}); }
    var ids = { featstyle: "set-fb-featstyle", stats: "set-fb-stats" };

    function syncUI() {
      var s = prefs.featureblock || {};
      FB_KEYS.forEach(function (k) {
        drawer.querySelector("#" + ids[k]).value = s[k] || FB_DEFAULTS[k];
      });
    }
    FB_KEYS.forEach(function (k) {
      drawer.querySelector("#" + ids[k]).addEventListener("change", function () {
        fb()[k] = this.value;
        applyFeatureblocks(prefs);
        persist();
        syncUI();
      });
    });
    syncUI();
    return syncUI;
  }
```

- [ ] **Step 4: Add the early-apply to main.html**

In `v2/overrides/main.html`, inside the `try` block, after the `for (var sk in sbD) …` line (~line 91) and before `} catch(e) {}`:

```javascript
            // Featureblock layout preferences (data-fb-*) — same always-set rule
            // as data-sb-*; an absent attribute is NOT the default.
            var fb = s.featureblock || {};
            var fbD = {featstyle:"card", stats:"grid"};
            for (var fk in fbD) document.documentElement.setAttribute("data-fb-"+fk, fb[fk] || fbD[fk]);
```

- [ ] **Step 5: Commit (in v2/)**

```bash
cd v2
git add docs/javascripts/settings-panel.js overrides/main.html
git commit -m "feat: Featureblocks settings group (data-fb-featstyle/stats)"
cd ..
```

---

### Task 9: e2e test

**Files:**
- Create: `v2/tests/e2e/featureblock.e2e.cjs`

> Harness identical to `statblock-featstyle.e2e.cjs` (Brave via playwright-core). Target pages confirmed present in the generated site: a malice featureblock and a dynamic-terrain page.

- [ ] **Step 1: Write the test**

```javascript
/*
 * featureblock.e2e.cjs — e2e for the .fb-wrap "Forged Band" card + the
 * data-fb-featstyle / data-fb-stats preferences. Asserts COMPUTED styles
 * (not just attributes) — the 2026-06-11 regression class.
 *
 *   cd v2
 *   devbox run -- mkdocs build
 *   devbox run -- python3 -m http.server 8124 --directory site &
 *   devbox run -- node tests/e2e/featureblock.e2e.cjs
 *
 * Env: E2E_BASE (default http://127.0.0.1:8124/), BRAVE_PATH (/opt/brave.com/brave/brave).
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
  throw new Error("playwright-core not found (install it, or `npx playwright` once)");
}

const BASE = process.env.E2E_BASE || "http://127.0.0.1:8124/";
const BRAVE = process.env.BRAVE_PATH || "/opt/brave.com/brave/brave";
const MALICE = BASE + "Browse/monster/elementals/elemental-malice/";
const TERRAIN = BASE + "Browse/dynamic-terrain/supernatural-objects/the-black-obelisk/";

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? "PASS" : "FAIL") + " - " + name + (detail ? "  (" + detail + ")" : ""));
  if (!cond) failures++;
}
function alphaNear(rgba, expected) {
  const m = /^rgba\(0, 0, 0, ([\d.]+)\)$/.exec(rgba || "");
  return !!m && Math.abs(parseFloat(m[1]) - expected) < 0.003;
}
const FEAT_PROBE = (idx) => {
  const f = document.querySelectorAll(".fb__feats > .fb__feat")[idx];
  if (!f) return { missing: true };
  const s = getComputedStyle(f);
  const b = getComputedStyle(f, "::before");
  return {
    borderLeftWidth: s.borderLeftWidth, borderLeftStyle: s.borderLeftStyle,
    background: s.backgroundColor,
    beforeDisplay: b.display, beforeOpacity: b.opacity, beforeBlend: b.mixBlendMode
  };
};

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // ---- malice featureblock renders ----
  await page.goto(MALICE, { waitUntil: "networkidle" });
  await page.waitForSelector(".fb-wrap");
  check("malice: data-role=malice", await page.evaluate(() =>
    document.querySelector(".fb-wrap").getAttribute("data-role") === "malice"));
  check("malice: card carries its own name (page H1 hidden)", await page.evaluate(() => {
    const h1 = document.querySelector(".md-typeset > h1:first-child");
    return !h1 || getComputedStyle(h1).display === "none";
  }));
  check("malice: head band tints toward the role color", await page.evaluate(() => {
    const bg = getComputedStyle(document.querySelector(".fb__head")).backgroundImage;
    return bg && bg.indexOf("gradient") !== -1;
  }));
  check("default: data-fb-featstyle=card", await page.evaluate(() =>
    document.documentElement.getAttribute("data-fb-featstyle") === "card"));

  // force dark (slate) for the dark-tint check
  await page.evaluate(() => document.body.setAttribute("data-md-color-scheme", "slate"));
  let f = await page.evaluate(FEAT_PROBE, 0);
  check("card: 3px solid action-colored left border", f.borderLeftWidth === "3px" && f.borderLeftStyle === "solid",
    f.borderLeftWidth + " " + f.borderLeftStyle);
  check("card: tinted bg (dark rgba(0,0,0,.16))", alphaNear(f.background, 0.16), f.background);
  check("card: no separator/watermark pseudo", f.beforeDisplay === "none", f.beforeDisplay);

  // light-scheme card tint (dead scheme-first selector regression)
  await page.evaluate(() => document.body.setAttribute("data-md-color-scheme", "default"));
  f = await page.evaluate(FEAT_PROBE, 0);
  check("card/light: light tint (rgba(0,0,0,.022))", alphaNear(f.background, 0.022), f.background);
  await page.evaluate(() => document.body.setAttribute("data-md-color-scheme", "slate"));

  // hover guard (kill rule floor)
  await page.hover(".fb__feats > .fb__feat:first-of-type");
  const hov = await page.evaluate(() => {
    const el = document.querySelector(".fb__feats > .fb__feat");
    const s = getComputedStyle(el);
    return { transform: s.transform, boxShadow: s.boxShadow };
  });
  check("card: no hover lift", hov.transform === "none" && hov.boxShadow === "none", hov.transform + " / " + hov.boxShadow);

  // ---- flip to flat via the drawer ----
  await page.click("#sc-settings-toggle");
  await page.evaluate(() => {
    const s = document.getElementById("set-fb-featstyle");
    s.value = "flat"; s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  check("flat: attribute flips", await page.evaluate(() =>
    document.documentElement.getAttribute("data-fb-featstyle") === "flat"));
  check("flat: stored in prefs.featureblock.featstyle", await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mkdocs:fontPrefs")).featureblock.featstyle === "flat"));
  // second feature carries the separator (has a `+` sibling)
  const second = await page.evaluate(FEAT_PROBE, 1);
  check("flat: separator pseudo visible (display/opacity/blend reclaimed)",
    second.beforeDisplay === "block" && second.beforeOpacity === "1" && second.beforeBlend === "normal",
    second.beforeDisplay + "/" + second.beforeOpacity + "/" + second.beforeBlend);
  check("flat: card chrome gone (no left border, no bg)",
    (second.borderLeftStyle === "none" || second.borderLeftWidth === "0px") && second.background === "rgba(0, 0, 0, 0)",
    second.borderLeftStyle + " " + second.borderLeftWidth + " " + second.background);
  const first = await page.evaluate(FEAT_PROBE, 0);
  check("flat: FIRST feature shows no watermark (kill rule intact)", first.beforeDisplay === "none", first.beforeDisplay);

  // ---- stat line pref on the terrain page ----
  await page.goto(TERRAIN, { waitUntil: "networkidle" });
  await page.waitForSelector(".fb-wrap");
  check("terrain: data-role is the combat role (not malice)", await page.evaluate(() => {
    const r = document.querySelector(".fb-wrap").getAttribute("data-role");
    return r && r !== "malice" && r !== "feature";
  }));
  check("terrain: stats block present", await page.evaluate(() => !!document.querySelector(".fb__stats .fb__stat")));
  const gridDisplay = await page.evaluate(() => getComputedStyle(document.querySelector(".fb__stats")).display);
  check("stats default grid → display:grid", gridDisplay === "grid", gridDisplay);
  await page.click("#sc-settings-toggle");
  await page.evaluate(() => {
    const s = document.getElementById("set-fb-stats");
    s.value = "ledger"; s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const ledgerDisplay = await page.evaluate(() => getComputedStyle(document.querySelector(".fb__stats")).display);
  check("stats ledger → display:flex (visible reflow)", ledgerDisplay === "flex", ledgerDisplay);

  await page.evaluate(() => localStorage.removeItem("mkdocs:fontPrefs"));
  await ctx.close();
  await browser.close();
  console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("SCRIPT ERROR:", e.stack || e.message); process.exit(2); });
```

- [ ] **Step 2: Commit (in v2/)**

```bash
cd v2
git add tests/e2e/featureblock.e2e.cjs
git commit -m "test: e2e for featureblock card + data-fb prefs"
cd ..
```

(The e2e is **run** in Task 10, after the site is regenerated with the new renderer.)

---

### Task 10: Build + verify end-to-end

> No commit. Regenerate the site with the new renderer, build mkdocs, run both e2e suites (the new one + the statblock one, to confirm the role-token refactor didn't regress).

- [ ] **Step 1: Regenerate ETL output with the new site renderer**

From the workspace root:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```
Expected: completes without error. (`gen --all` is required — a bare `gen` skips the monsters/beastheart books, so terrain/malice pages would go stale; see `steel-etl/CLAUDE.md`.)

- [ ] **Step 2: Confirm a generated page now carries the card**

Run:
```bash
grep -l 'class="fb-wrap"' v2/docs/Browse/monster/elementals/elemental-malice.md v2/docs/Browse/dynamic-terrain/supernatural-objects/the-black-obelisk.md
```
Expected: both paths printed. If a path is missing, the renderer/dispatch is wrong — fix before continuing.

- [ ] **Step 3: SCC stability (must stay green — no codes minted)**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --scc-stable --config pipeline.yaml'
```
Expected: PASS — Plan 2 is site-only; zero SCC churn.

- [ ] **Step 4: Build the mkdocs site**

```bash
cd v2 && devbox run -- mkdocs build && cd ..
```
Expected: build succeeds (~145s). The `.fb-wrap` raw HTML passes through `md_in_html`.

- [ ] **Step 5: Serve + run both e2e suites**

```bash
cd v2
devbox run -- python3 -m http.server 8124 --directory site &
SERVER_PID=$!
sleep 2
devbox run -- node tests/e2e/featureblock.e2e.cjs
devbox run -- node tests/e2e/statblock-featstyle.e2e.cjs   # role-token refactor regression guard
kill $SERVER_PID
cd ..
```
Expected: both print `ALL CHECKS PASSED`. If the statblock suite fails on a role color, the Task 5 token swap is wrong (a `--sc-role-*` token name mismatched a `data-role` value). If the featureblock suite fails, fix the renderer/CSS the failing check points at, re-run Step 1, rebuild, re-test.

- [ ] **Step 6: Spot-check visually (optional but recommended)**

Open `http://127.0.0.1:8124/Browse/monster/elementals/elemental-malice/` in a browser: the Forged Band head shows the grey malice gradient + centered diamond; features render as cards; the gear drawer's **Featureblocks** group flips card↔flat and grid↔ledger live. Open the Black Obelisk terrain page: the band is the role color, stats show EV/Stamina/Size, the power-roll panel shows tier badges.

---

### Task 11: Docs + bookkeeping

**Files:**
- Modify: `DESIGN.md` (workspace repo — current branch `feat/featureblock-cards-plan2`)
- Modify: `steel-etl/docs/statblocks.md`
- Modify: `steel-etl/CLAUDE.md` (only if a new pointer is warranted)
- Modify: the project memory file

- [ ] **Step 1: DESIGN.md**

Add a **Featureblocks** row to the component map (pointer: this spec + `steel-featureblock.css`); add the `data-fb-featstyle` / `data-fb-stats` prefs to the preference-system section alongside `data-sb-*`; update the role-hex note to say the hexes now live in `palette.css` as `--sc-role-*` (consumed by both `steel-statblock.css` and `steel-featureblock.css`); add the one-sentence Featureblock definition (a titled collection of Features under a loose-stat header). Commit:

```bash
git add DESIGN.md
git commit -m "docs: DESIGN.md featureblock cards + data-fb prefs + role-token source"
```

- [ ] **Step 2: steel-etl/docs/statblocks.md**

Add a short subsection: featureblock/dynamic-terrain pages now render to the `.fb-wrap` Forged Band card at build time via `internal/site/featureblock_page.go` (reads the Plan 1 frontmatter; reuses the ability-card grammar; routes on `type: featureblock|dynamic-terrain` in `buildSection`). Note Plan-2 scope and that fixtures/retainer/companion are Plans 3–5. Commit in steel-etl:

```bash
cd steel-etl
git add docs/statblocks.md
# (add CLAUDE.md too only if you added a pointer line)
git commit -m "docs: featureblock site rendering (Plan 2)"
cd ..
```

- [ ] **Step 3: Update the project memory**

Edit `/home/vexa/.claude/projects/-home-vexa-code-steel-compendium-workspace/memory/project_featureblock_cards.md`: mark Plan 2 (site rendering) shipped — `featureblock_page.go` renderer, `steel-featureblock.css`, `data-fb-*` settings group, role-token paydown to `palette.css`; note the renderer reads frontmatter (no body re-parse) and the statblock-island swap was **deferred** (behavior-change risk). Update the `description:` line and the "Still TODO" list to Plans 3–5 (fixture routing, retainer split, companion cards). Keep the `MEMORY.md` one-liner in sync if its hook changed.

- [ ] **Step 4: Final clean-tree check**

Run (in each repo): `git status` — only the intended files changed; nothing stray. The workspace `steel-etl` pointer bump and deploy are **out of scope** (deploy-time, user-driven).

---

## Self-Review notes (spec coverage)

- Spec §3 renderer (featureblock + dynamic-terrain → `.fb-wrap`; one-line feature heads; icon-emoji action fallback; reused pr/tier/section/enh grammar) → Tasks 1–4. **Fixture routing, retainer split, companion cards are explicitly Plans 3–5** and excluded here.
- Spec §4 CSS (Forged Band head; `data-fb-featstyle` card/flat; `data-fb-stats` grid/ledger; role-token paydown to `palette.css`; the watermark/`::before` specificity-floor kill-block; scheme-attribute order rule) → Tasks 5–7.
- Spec §5 settings (separate `data-fb-*` group, two prefs, no presets, early-apply, both schemes) → Task 8.
- Spec §6 testing (Go DOM tests; SCC stability; e2e asserting computed styles in both schemes; card vs flat; stat reflow) → Tasks 3, 9, 10.
- Spec §8 docs (DESIGN.md row + prefs + role-hex note; statblocks.md; memory) → Task 11.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-13-featureblock-site-rendering.md`.
