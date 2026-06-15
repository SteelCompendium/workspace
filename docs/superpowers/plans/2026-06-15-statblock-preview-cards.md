# Statblock Preview Cards Implementation Plan

> **Status:** SHIPPED 2026-06-15. All 8 tasks implemented + reviewed via subagent-driven
> development; verified end-to-end against the real `steel-etl site` pipeline (a
> build-order bug — group landings read leaf pages *after* they're transformed to
> `.sb-wrap`, losing blockquote features — was found and fixed with a build-scoped
> `statblockFeatureCache` keyed by scc). Default-zone visibility is a placeholder pending
> a community poll ([`ROADMAP.md`](../../../ROADMAP.md) #11).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `.sc-card` statblock previews on index / group-landing pages with rich mini-statblocks that always show the full statblock header and offer toggleable stats / secondary-stats / characteristics / feature-preview zones (global default + per-page override bar).

**Architecture:** The preview card is a compact variant of the existing build-time `.sb-wrap` statblock card. It reuses the existing `.sb__head` / `.sb__defenses` / `.sb__meta` / `.sb__chars` zone markup and renderers (which already collapse well on the x-axis), adds a new compact feature-line list, and wraps everything in a whole-card stretched link to the full page. The four optional zones are shown/hidden by `data-sbprev-{stats,meta,chars,feats}` attributes **baked onto the grid container at build time** (the no-JS baseline). A new settings-drawer section seeds those from a global pref; a new per-page toggle bar (`statblock-preview.js`) overrides them per page in-session. Preview zone *styling* (ledger secondary stats, one-line + boxed characteristics) is hard-coded via `.sb-prev`-scoped CSS, deliberately decoupled from the global `data-sb-*` statblock-layout prefs.

**Tech Stack:** Go (steel-etl site builder, `internal/site/`), CSS (`v2/docs/stylesheets/steel-statblock.css`), vanilla JS (`v2/docs/javascripts/`, UMD-tested via `node:test`), MkDocs Material.

**Default-visibility note (deferred):** The community poll on which zones to show by default is pending. The build-time default lives in exactly ONE Go place (`sbPreviewDefaults`, Task 3) and the global JS default in ONE JS place (`SBPREV_DEFAULTS` in settings-core, Task 6). This plan ships `stats="on"`, everything else `"off"`. When the poll lands, change those two constants only.

**Conventions for every Go test command below:** run from the `steel-etl/` directory with devbox:
```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run <TestName> -v
```
**For every JS test command:** run from `v2/`:
```bash
cd v2 && devbox run -- node --test docs/javascripts/<file>.test.js
```

---

## File Structure

**New files:**
- `steel-etl/internal/site/statblock_preview.go` — `renderStatblockPreviewCard`, `renderStatblockFeatureLine`, `sbPreviewDefaults`, `sbCardsOpen`.
- `steel-etl/internal/site/statblock_preview_test.go` — unit tests for the above.
- `v2/docs/javascripts/statblock-preview.js` — per-page toggle bar; seeds grids from the global pref, builds the chip bar, wires live toggling. `document$`-safe + idempotent.
- `v2/docs/javascripts/statblock-preview.test.js` — node test for the pure resolver added to settings-core.

**Modified files:**
- `steel-etl/internal/site/statblock_card.go` — extract `renderStatblockHead` + `renderStatblockDefenses` (pure refactor; shared by full card and preview).
- `steel-etl/internal/site/bestiary_cards.go` — route statblock leaves to the preview card; emit the `.sb-cards` grid (with baked default attrs) instead of `.sc-cards`; drop now-dead `statblockCard` / `retainerCard`.
- `steel-etl/internal/site/bestiary_cards_test.go` — update the two tests that referenced `statblockCard`.
- `v2/docs/stylesheets/steel-statblock.css` — append a PREVIEW CARDS section (grid, compact zone styles, zone toggles, toggle bar).
- `v2/docs/javascripts/settings-core.js` — add `SBPREV_DEFAULTS` + `resolveSbPreview` (pure, tested).
- `v2/docs/javascripts/settings-core.test.js` — tests for `resolveSbPreview` (if the file exists; else create `statblock-preview.test.js` — see Task 6).
- `v2/docs/javascripts/settings-panel.js` — add the "Index previews" controls + apply + persist.
- `v2/overrides/main.html` — early-apply the `data-sbprev-*` global attrs (FOUC-free).
- `v2/mkdocs.yml` — register `statblock-preview.js`.

---

### Task 1: Extract shared header + defenses renderers (pure refactor)

This is a no-op refactor: `renderStatblockCard` must emit byte-identical output, so `TestStatblockCard_GoldenEquivalence` stays green. We extract the header and defenses markup so the preview card (Task 3) can reuse them.

**Files:**
- Modify: `steel-etl/internal/site/statblock_card.go`

- [ ] **Step 1: Confirm the golden test passes before touching anything**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestStatblockCard_GoldenEquivalence -v`
Expected: PASS (baseline — if it already fails, STOP and report).

- [ ] **Step 2: Add the two extraction helpers**

In `steel-etl/internal/site/statblock_card.go`, add these functions just above `renderStatblockCard` (before the `// renderStatblockCard ports render():` comment block):

```go
// renderStatblockHead emits the .sb__head identity band (ancestry/name on the
// left, level/role/EV on the right). Shared by the full card and the preview
// card (statblock_preview.go) so the header looks identical in both.
func renderStatblockHead(d sbIsland) string {
	return `<header class="sb__head"><div class="sb__head-row">` +
		`<div class="sb__identity"><div class="sb__kw">` + sbEsc(d.Ancestry) + `</div>` +
		`<h2 class="sb__name">` + sbEsc(d.Name) + `</h2></div>` +
		`<div class="sb__class"><div class="sb__level">Level ` + sbEsc(d.Level) + `</div>` +
		`<div class="sb__role" data-role="` + sbEsc(d.RoleKey) + `">` + sbEsc(d.Role) + `</div>` +
		`<div class="sb__ev">EV ` + sbEsc(d.EV) + `</div></div></div></header>`
}

// renderStatblockDefenses emits the .sb__defenses stat row (Size/Speed/Stamina/
// Stability/Free Strike). Shared by the full card and the preview card.
func renderStatblockDefenses(defenses []sbLV) string {
	var defs strings.Builder
	for _, x := range defenses {
		defs.WriteString(`<div class="sb__stat"><span class="v">` + sbEsc(x.V) +
			`</span><span class="l">` + sbEsc(x.L) + `</span></div>`)
	}
	return `<div class="sb__defenses">` + defs.String() + `</div>`
}
```

- [ ] **Step 3: Make `renderStatblockCard` call the helpers**

In `renderStatblockCard`, replace the local `defs` builder + the two inline writes for the header and defenses. The current block is:

```go
	var defs strings.Builder
	for _, x := range d.Defenses {
		defs.WriteString(`<div class="sb__stat"><span class="v">` + sbEsc(x.V) +
			`</span><span class="l">` + sbEsc(x.L) + `</span></div>`)
	}

	var feat, villain strings.Builder
```

Change it to (remove the `defs` builder loop — defenses now come from the helper):

```go
	var feat, villain strings.Builder
```

Then replace the header + defenses writes. The current lines are:

```go
	b.WriteString(`<header class="sb__head"><div class="sb__head-row">` +
		`<div class="sb__identity"><div class="sb__kw">` + sbEsc(d.Ancestry) + `</div>` +
		`<h2 class="sb__name">` + sbEsc(d.Name) + `</h2></div>` +
		`<div class="sb__class"><div class="sb__level">Level ` + sbEsc(d.Level) + `</div>` +
		`<div class="sb__role" data-role="` + sbEsc(d.RoleKey) + `">` + sbEsc(d.Role) + `</div>` +
		`<div class="sb__ev">EV ` + sbEsc(d.EV) + `</div></div></div></header>`)
	b.WriteString(`<div class="sb__defenses">` + defs.String() + `</div>`)
```

Replace with:

```go
	b.WriteString(renderStatblockHead(d))
	b.WriteString(renderStatblockDefenses(d.Defenses))
```

- [ ] **Step 4: Verify the golden test still passes (byte-identical output)**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestStatblockCard_GoldenEquivalence -v`
Expected: PASS. If it fails, the extracted strings drifted from the originals — diff them character-for-character (whitespace, attribute order).

- [ ] **Step 5: Commit**

```bash
git add steel-etl/internal/site/statblock_card.go
git commit -m "refactor: extract renderStatblockHead/Defenses from statblock card"
```

---

### Task 2: Compact feature-line renderer

A preview feature line is just: action glyph + name + usage eyebrow + cost. No keywords, distance/target, power roll, sections, or body. Links are stripped to plain text (via the existing `linkText`) so the whole preview card stays a single clean click target.

**Files:**
- Create: `steel-etl/internal/site/statblock_preview.go`
- Create: `steel-etl/internal/site/statblock_preview_test.go`

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/statblock_preview_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

func TestRenderStatblockFeatureLine_Ability(t *testing.T) {
	f := sbFeature{
		Kind: "ability", Action: "main",
		Name: "Cutting Strike", Usage: "Main Action", Cost: "Signature",
	}
	got := renderStatblockFeatureLine(f)
	for _, want := range []string{
		`class="sb-prev__feat"`,
		`data-action="main"`,
		`class="sb__feat-glyph"`,
		`class="sb-prev__feat-name">Cutting Strike<`,
		`class="sb-prev__feat-usage">Main Action<`,
		`class="sb-prev__feat-cost">Signature<`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("feature line missing %q in:\n%s", want, got)
		}
	}
}

func TestRenderStatblockFeatureLine_PassiveDefaultsTraitUsage(t *testing.T) {
	f := sbFeature{Kind: "passive", Action: "passive", Name: "Mob Tactics"}
	got := renderStatblockFeatureLine(f)
	if !strings.Contains(got, `class="sb-prev__feat-usage">Trait<`) {
		t.Errorf("passive feature should default usage to Trait:\n%s", got)
	}
}

func TestRenderStatblockFeatureLine_StripsLinks(t *testing.T) {
	// resolveSbLinks leaves [text](href) in fields; the preview shows plain text.
	f := sbFeature{Kind: "ability", Action: "triggered", Name: "Riposte",
		Cost: "2 [Malice](../malice/)"}
	got := renderStatblockFeatureLine(f)
	if strings.Contains(got, "](") || strings.Contains(got, "<a ") {
		t.Errorf("feature line must strip markdown links, got:\n%s", got)
	}
	if !strings.Contains(got, `class="sb-prev__feat-cost">2 Malice<`) {
		t.Errorf("link should reduce to its text:\n%s", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestRenderStatblockFeatureLine -v`
Expected: FAIL — `undefined: renderStatblockFeatureLine`.

- [ ] **Step 3: Write the renderer**

Create `steel-etl/internal/site/statblock_preview.go` with this initial content (the preview card itself is added in Task 3; for now just the package + feature line):

```go
package site

// High-Fantasy Steel STATBLOCK PREVIEW cards — a compact variant of the full
// .sb-wrap card (statblock_card.go) used on index / group-landing pages. It
// reuses the full card's header / defenses / meta / chars zone renderers and
// adds a one-line-per-feature preview. The four optional zones are gated by the
// grid-level data-sbprev-* attributes (sbCardsOpen + the per-page toggle bar in
// statblock-preview.js); the header is always shown. SITE-ONLY (like cards.go):
// all data comes from the page's frontmatter + body via buildStatblockIsland.

import (
	"html"
	"strings"
)

// renderStatblockFeatureLine emits one compact feature row: action glyph + name
// + usage eyebrow + cost. No body/keywords/power-roll (those belong on the full
// page). Links are stripped to plain text (linkText) so the line carries no
// nested anchors inside the whole-card stretched link.
func renderStatblockFeatureLine(f sbFeature) string {
	a, ok := sbACT[f.Action]
	if !ok {
		a = sbACT["passive"]
	}
	var b strings.Builder
	b.WriteString(`<li class="sb-prev__feat" data-action="` + sbEsc(f.Action) + `">`)
	b.WriteString(`<span class="sb-prev__feat-icon"><span class="sb__feat-glyph">` + a.glyph + `</span></span>`)
	b.WriteString(`<span class="sb-prev__feat-name">` + sbEsc(linkText(f.Name)) + `</span>`)
	usage := f.Usage
	if usage == "" && f.Kind == "passive" {
		usage = "Trait"
	}
	if usage != "" {
		b.WriteString(`<span class="sb-prev__feat-usage">` + sbEsc(linkText(usage)) + `</span>`)
	}
	if f.Cost != "" {
		b.WriteString(`<span class="sb-prev__feat-cost">` + sbEsc(linkText(f.Cost)) + `</span>`)
	}
	b.WriteString(`</li>`)
	return b.String()
}
```

Note: `html` is imported now because Task 3 (same file) uses `html.EscapeString`. If Task 3 is deferred, Go will complain about the unused import — so add Task 3's code in the same session, or temporarily drop the `html` import until Task 3. The plan adds Task 3 next, so keep the import.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestRenderStatblockFeatureLine -v`
Expected: PASS. (If the build fails on an unused `html` import, proceed straight to Task 3 which uses it, then re-run.)

- [ ] **Step 5: Commit**

```bash
git add steel-etl/internal/site/statblock_preview.go steel-etl/internal/site/statblock_preview_test.go
git commit -m "feat: compact statblock feature-line renderer for previews"
```

---

### Task 3: Preview card renderer + grid-open helper + defaults

**Files:**
- Modify: `steel-etl/internal/site/statblock_preview.go`
- Modify: `steel-etl/internal/site/statblock_preview_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `steel-etl/internal/site/statblock_preview_test.go`:

```go
func TestRenderStatblockPreviewCard(t *testing.T) {
	d := buildStatblockIsland(strings.TrimSpace(`
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
type: statblock`), "> ⭐️ **Mob Tactics**\n>\n> Deals 1 extra damage.")

	got := renderStatblockPreviewCard(d, "goblin-cutter.md", "")
	for _, want := range []string{
		`class="sb-wrap sb-prev"`,
		`data-role="harrier"`,
		`class="sb-prev__link" href="goblin-cutter/"`, // dirURL: .md -> dir
		`class="sb__head"`,                            // shared header
		`<h2 class="sb__name">Goblin Cutter</h2>`,
		`class="sb__defenses"`,
		`class="sb__meta"`,
		`class="sb__chars"`,
		`class="sb-prev__feats"`,
		`class="sb-prev__feat"`, // Mob Tactics line
	} {
		if !strings.Contains(got, want) {
			t.Errorf("preview card missing %q in:\n%s", want, got)
		}
	}
	// No raw markdown link should leak into the preview.
	if strings.Contains(got, "](") {
		t.Errorf("preview card leaked a markdown link:\n%s", got)
	}
}

func TestRenderStatblockPreviewCard_SourceChip(t *testing.T) {
	d := buildStatblockIsland("name: Bound Imp\nrole: Support\nlevel: 1\ntype: statblock", "")
	withSrc := renderStatblockPreviewCard(d, "bound-imp.md", "Summoner")
	if !strings.Contains(withSrc, `class="sb-prev__src">Summoner<`) {
		t.Errorf("expected Summoner source chip:\n%s", withSrc)
	}
	noSrc := renderStatblockPreviewCard(d, "bound-imp.md", "")
	if strings.Contains(noSrc, "sb-prev__src") {
		t.Errorf("empty source must emit no chip:\n%s", noSrc)
	}
}

func TestSbCardsOpen_DefaultAttrs(t *testing.T) {
	got := sbCardsOpen()
	for _, want := range []string{
		`class="sb-cards"`,
		`data-sbprev-stats="on"`,
		`data-sbprev-meta="off"`,
		`data-sbprev-chars="off"`,
		`data-sbprev-feats="off"`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("sbCardsOpen missing %q in: %s", want, got)
		}
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestRenderStatblockPreviewCard|TestSbCardsOpen' -v`
Expected: FAIL — `undefined: renderStatblockPreviewCard`, `undefined: sbCardsOpen`.

- [ ] **Step 3: Implement the preview card, grid-open helper, and defaults**

Append to `steel-etl/internal/site/statblock_preview.go`:

```go
// sbPreviewDefaults is the build-time baseline visibility for the four preview
// zones — the no-JS fallback. SINGLE SOURCE OF TRUTH for the default; the
// settings drawer (global pref) and per-page toggle bar refine it live. Mirror
// any change in v2 settings-core.js SBPREV_DEFAULTS and overrides/main.html.
// (Deferred: the community poll decides the long-term default — change here.)
var sbPreviewDefaults = [][2]string{
	{"stats", "on"}, {"meta", "off"}, {"chars", "off"}, {"feats", "off"},
}

// sbCardsOpen writes the opening tag of a statblock-preview grid, baking the
// default zone-visibility attributes onto the container. statblock-preview.js
// later overrides these from the global pref / per-page bar.
func sbCardsOpen() string {
	var b strings.Builder
	b.WriteString(`<div class="sb-cards"`)
	for _, kv := range sbPreviewDefaults {
		b.WriteString(` data-sbprev-` + kv[0] + `="` + kv[1] + `"`)
	}
	b.WriteString(">\n")
	return b.String()
}

// renderStatblockPreviewCard renders an sbIsland as a compact .sb-prev mini-card
// linking to the full statblock page (href, a relative ".md" path resolved by
// dirURL). source is an optional provenance label ("Summoner") shown as a chip;
// "" emits none. The header is always present; the four zones below it are
// gated by the grid's data-sbprev-* attributes (sbCardsOpen).
func renderStatblockPreviewCard(d sbIsland, href, source string) string {
	var b strings.Builder
	b.WriteString(`<div class="sb-wrap sb-prev" data-role="` + sbEsc(d.RoleKey) +
		`" data-creature="` + sbEsc(d.ID) + `">`)
	b.WriteString(`<a class="sb-prev__link" href="` + html.EscapeString(dirURL(href)) +
		`" aria-label="` + html.EscapeString(d.Name) + `"></a>`)
	b.WriteString(`<article class="sb sb-prev__body md-typeset" data-role="` + sbEsc(d.RoleKey) + `">`)
	if source != "" {
		b.WriteString(`<div class="sb-prev__src">` + sbEsc(source) + `</div>`)
	}
	b.WriteString(renderStatblockHead(d))
	b.WriteString(renderStatblockDefenses(d.Defenses))
	b.WriteString(renderStatblockMeta(d.Meta))
	b.WriteString(renderStatblockChars(d.Characteristics))
	if len(d.Features) > 0 {
		b.WriteString(`<ul class="sb-prev__feats">`)
		for _, f := range d.Features {
			b.WriteString(renderStatblockFeatureLine(f))
		}
		b.WriteString(`</ul>`)
	}
	b.WriteString(`</article></div>`)
	return b.String()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestRenderStatblockPreviewCard|TestSbCardsOpen|TestRenderStatblockFeatureLine' -v`
Expected: PASS (all five).

- [ ] **Step 5: Commit**

```bash
git add steel-etl/internal/site/statblock_preview.go steel-etl/internal/site/statblock_preview_test.go
git commit -m "feat: statblock preview card renderer + grid defaults"
```

---

### Task 4: Wire bestiary card routing to the preview card

Route every true statblock leaf (monster / minion / fixture / champion / rival / retainer) through the new preview card, emit the `.sb-cards` grid instead of `.sc-cards` for statblock listings, and remove the now-dead `statblockCard` / `retainerCard`. Dynamic terrain keeps its existing `.sc-card` (it is not a creature statblock and has a different model).

**Files:**
- Modify: `steel-etl/internal/site/bestiary_cards.go:124-348`
- Modify: `steel-etl/internal/site/bestiary_cards_test.go`

- [ ] **Step 1: Update the two failing tests first (they reference the removed `statblockCard`)**

In `steel-etl/internal/site/bestiary_cards_test.go`, replace `TestStatblockCard` and `TestBestiarySourceMarking` with previews-aware versions. The new card is built by `statblockPreviewCard(fm, body, href, name)`:

```go
func TestStatblockCard(t *testing.T) {
	got := statblockPreviewCard(goblinWarriorFM, "", "goblin-warrior.md", "Goblin Warrior")
	for _, want := range []string{
		`class="sb-wrap sb-prev"`,
		`class="sb-prev__link" href="goblin-warrior/"`,
		`<h2 class="sb__name">Goblin Warrior</h2>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("statblockPreviewCard missing %q in:\n%s", want, got)
		}
	}
}

func TestBestiarySourceMarking(t *testing.T) {
	card := statblockPreviewCard(summonerFM, "", "hulking-chimor.md", "Hulking Chimor")
	if !strings.Contains(card, `class="sb-prev__src">Summoner<`) {
		t.Errorf("summoner statblock should carry a Summoner source chip:\n%s", card)
	}
	if strings.Contains(statblockPreviewCard(goblinWarriorFM, "", "goblin-warrior.md", "Goblin Warrior"), "sb-prev__src") {
		t.Errorf("monster-book statblock must have no source chip")
	}
}
```

(Keep the existing `goblinWarriorFM` / `summonerFM` fixtures in that test file unchanged. If `summonerFM` lacks `role`/`level`, that is fine — `buildStatblockIsland` fills dashes.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestStatblockCard|TestBestiarySourceMarking' -v`
Expected: FAIL — `undefined: statblockPreviewCard`.

- [ ] **Step 3: Add `statblockPreviewCard` and re-route `bestiaryLeafCard`**

In `steel-etl/internal/site/bestiary_cards.go`, replace the `statblockCard`, `retainerCard`, and `bestiaryLeafCard` functions. Delete `statblockCard` (lines 123-136) and `retainerCard` (lines 103-121) entirely, and replace `bestiaryLeafCard` (lines 336-348) with:

```go
// statblockPreviewCard builds the sbIsland for a statblock leaf and renders the
// compact .sb-prev preview card (statblock_preview.go), linking to the leaf's
// full page. The Summoner-book provenance chip is added via bestiarySource.
func statblockPreviewCard(fm, body, href, name string) string {
	d := buildStatblockIsland(fm, body)
	if d.Name == "" {
		d.Name = name
	}
	return renderStatblockPreviewCard(d, href, bestiarySource(fm))
}

// bestiaryLeafCard picks the preview card for a statblock leaf by its type root:
// dynamic terrain keeps the generic .sc-card (different model); every creature
// statblock (monster/minion/fixture/champion/rival AND retainers) renders as a
// rich .sb-prev mini-statblock.
func bestiaryLeafCard(dir, fm, body, href, name string) string {
	if pathHasSegment(dir, "dynamic-terrain") {
		return terrainCard(fm, body, href, name)
	}
	return statblockPreviewCard(fm, body, href, name)
}
```

Note: `statblockTypeLabel`, `withSource`, `tagsBlock`, `lineBlock` may become unused if no other caller remains. Check with the build in Step 5; if `go vet` / compiler flags an unused function, and it has no other caller, delete it. `bestiarySource` is still used (by `statblockPreviewCard`); `statblockTypeLabel` is likely now dead — remove it and its now-unused helpers only if the compiler confirms they are unreferenced (do NOT remove `withSource`/`tagsBlock`/`lineBlock` if `terrainCard` or other cards still call them — `terrainCard` uses `statsBlock`/`flavorDiv`, not these; verify before deleting).

- [ ] **Step 4: Emit the `.sb-cards` grid for statblock listings**

In `statblockCards` (lines 313-334), change the grid wrapper from `.sc-cards` to the new `sbCardsOpen()` helper. Replace:

```go
	var sb strings.Builder
	sb.WriteString("<div class=\"sc-cards\">\n")
```

with:

```go
	var sb strings.Builder
	sb.WriteString(sbCardsOpen())
```

(The closing `</div>\n` at the end of `statblockCards` is unchanged — it closes `.sb-cards`.)

Leave `featureblockCards` on `.sc-cards` — featureblock previews are unchanged.

- [ ] **Step 5: Run the full site package tests + vet**

Run:
```bash
cd steel-etl && devbox run -- go vet ./internal/site/ && devbox run -- go test ./internal/site/ -v
```
Expected: PASS, no vet errors. Fix any "declared and not used" by deleting the confirmed-dead function (per Step 3 note).

- [ ] **Step 6: Commit**

```bash
git add steel-etl/internal/site/bestiary_cards.go steel-etl/internal/site/bestiary_cards_test.go
git commit -m "feat: render bestiary statblock previews as compact .sb-prev cards"
```

---

### Task 5: Preview-card CSS

Append a self-contained PREVIEW CARDS section to `steel-statblock.css`. Styling for the secondary-stats (ledger) and characteristics (one-line + boxed letter) zones is `.sb-prev`-scoped so it is FIXED for previews regardless of the global `data-sb-*` statblock-layout prefs.

**Files:**
- Modify: `v2/docs/stylesheets/steel-statblock.css` (append at end)

- [ ] **Step 1: Append the preview styles**

Add to the end of `v2/docs/stylesheets/steel-statblock.css`:

```css
/* ════════════════════════════════════════════════════════════
   PREVIEW CARDS — compact .sb-prev mini-statblocks on index /
   group-landing pages (steel-etl statblock_preview.go). The zone
   styling here is FIXED (decoupled from the global data-sb-* prefs);
   .sb-cards[data-sbprev-*] gates which zones show.
   ════════════════════════════════════════════════════════════ */
.md-typeset .sb-cards {
  display: grid; gap: 1rem; margin: 1rem 0; padding: 0;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  align-items: start; list-style: none;
}

.sb-wrap.sb-prev { max-width: none; margin: 0; --pad: .9rem; isolation: isolate; }
.sb-prev .sb { box-shadow: var(--fx-bevel), 0 4px 12px rgba(0,0,0,.28); transition: border-color .15s ease; }
.sb-prev:hover .sb,
.sb-prev:focus-within .sb { border-color: color-mix(in srgb, var(--role) 55%, transparent); }

/* whole-card click target — mirrors .sc-card__link (steel-redesign.css). The
   preview emits no inner anchors (links are stripped), so a flat overlay is safe. */
.sb-prev__link { position: absolute; inset: 0; z-index: 2; border-radius: .65rem; }

/* source provenance chip (e.g. "Summoner"), top-right of the card */
.sb-prev__src {
  position: absolute; top: .5rem; right: .6rem; z-index: 1;
  font-family: var(--md-small-header-font); font-variant: small-caps;
  letter-spacing: .06em; font-size: .64rem; color: var(--md-default-fg-color--light);
}

/* header — tighter than the full card; collapses on the x-axis as-is */
.sb-prev .sb__head { padding: .7rem var(--pad) .75rem; margin-bottom: .4rem; }
.sb-prev.sb-wrap .md-typeset .sb__name { font-size: 1.4rem; }
.sb-prev .sb__role { font-size: 1.05rem; }
.sb-prev .sb__level, .sb-prev .sb__ev { font-size: .76rem; }

/* defenses — same 5-up grid, smaller faces */
.sb-prev .sb__defenses { padding: .25rem var(--pad) .5rem; gap: .3rem; }
.sb-prev .sb__stat { padding: .3rem .15rem; }
.sb-prev .sb__stat .v { font-size: 1.1rem; }
.sb-prev .sb__stat .l { font-size: .62rem; }

/* secondary stats — FIXED ledger layout */
.sb-prev .sb__meta { grid-template-columns: 1fr 1fr; gap: 0 1.2rem; padding: 0 var(--pad) .5rem; }
.sb-prev .sb__meta .sb__field {
  display: flex; align-items: baseline; justify-content: space-between; gap: .5rem;
  padding: .26rem .05rem; border-bottom: 1px solid var(--fx-metal-faint);
}
.sb-prev .sb__meta .sb__field-v { text-align: right; }

/* characteristics — FIXED one-line, boxed first letter */
.sb-prev .sb__chars { margin: 0 var(--pad) .4rem; padding: .4rem .3rem; gap: .3rem; }
.sb-prev .sb__char { grid-auto-flow: column; justify-content: center; align-items: baseline; gap: .25rem; }
.sb-prev .sb__char-box { display: grid; width: 1.15rem; height: 1.15rem; font-size: .7rem; }
.sb-prev .sb__char-v { font-size: 1.05rem; }
.sb-prev .sb__char-l { display: none; } /* boxed letter already labels it on one line */

/* feature preview list — icon · name · usage · cost */
.sb-prev__feats {
  list-style: none; margin: .2rem var(--pad) .7rem; padding: .45rem 0 0;
  border-top: 1px solid var(--fx-metal-faint);
  display: flex; flex-direction: column; gap: .2rem;
}
.sb-prev__feat[data-action="passive"]   { --act: var(--sc-act-none); }
.sb-prev__feat[data-action="villain"]    { --act: #e0584b; }
.sb-prev__feat[data-action="main"]       { --act: var(--sc-act-main); }
.sb-prev__feat[data-action="maneuver"]   { --act: var(--sc-act-maneuver); }
.sb-prev__feat[data-action="triggered"]  { --act: var(--sc-act-triggered); }
.sb-prev__feat[data-action="move"]       { --act: var(--sc-act-main); }
.sb-prev__feat { display: flex; align-items: baseline; gap: .5rem; font-size: .84rem; line-height: 1.25; }
.sb-prev__feat-icon .sb__feat-glyph { font-size: .95rem; color: var(--act); }
.sb-prev__feat-name { font-family: var(--md-small-header-font); color: var(--sc-steel-lighter); }
.sb-prev__feat-usage { font-size: .7rem; font-variant: small-caps; letter-spacing: .04em; color: var(--md-default-fg-color--light); }
.sb-prev__feat-cost { margin-left: auto; font-family: var(--md-code-font, monospace); font-size: .76rem; color: var(--fx-metal-bright); flex: 0 0 auto; }

/* ── ZONE TOGGLES — grid-level data-sbprev-* (build-time baseline + JS) ── */
.sb-cards[data-sbprev-stats="off"] .sb-prev .sb__defenses,
.sb-cards[data-sbprev-meta="off"]  .sb-prev .sb__meta,
.sb-cards[data-sbprev-chars="off"] .sb-prev .sb__chars,
.sb-cards[data-sbprev-feats="off"] .sb-prev .sb-prev__feats { display: none; }

/* ── per-page toggle bar (statblock-preview.js) ── */
.sb-prev-bar { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; margin: .2rem 0 .9rem; }
.sb-prev-bar__label {
  font-family: var(--md-small-header-font); font-variant: small-caps;
  letter-spacing: .06em; font-size: .78rem; color: var(--md-default-fg-color--light); margin-right: .15rem;
}
.sb-prev-bar__chip {
  cursor: pointer; user-select: none; font: inherit; font-size: .78rem;
  border: 1px solid var(--fx-metal-line); border-radius: 999px; padding: .18rem .7rem;
  color: var(--md-default-fg-color--light); background: transparent; transition: background .12s, color .12s, border-color .12s;
}
.sb-prev-bar__chip[aria-pressed="true"] {
  color: var(--sc-steel-lighter);
  border-color: color-mix(in srgb, var(--md-accent-fg-color) 60%, transparent);
  background: color-mix(in srgb, var(--md-accent-fg-color) 12%, transparent);
}

@media (max-width: 30em) {
  .md-typeset .sb-cards { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Build the site and confirm it compiles cleanly**

Run: `cd v2 && devbox run -- mkdocs build 2>&1 | tail -20`
Expected: build succeeds, no CSS-related warnings. (This step only confirms the build runs; visual verification is Task 8.)

- [ ] **Step 3: Commit**

```bash
git add v2/docs/stylesheets/steel-statblock.css
git commit -m "feat: preview-card CSS (compact zones, grid, toggle bar)"
```

---

### Task 6: Global settings — "Index previews" controls

Add the pure default + resolver to settings-core (tested), then the four checkboxes + apply + persist to the settings drawer, plus the FOUC-free early-apply.

**Files:**
- Modify: `v2/docs/javascripts/settings-core.js`
- Modify: `v2/docs/javascripts/settings-core.test.js` (create if absent)
- Modify: `v2/docs/javascripts/settings-panel.js`
- Modify: `v2/overrides/main.html`

- [ ] **Step 1: Write the failing test for the pure resolver**

If `v2/docs/javascripts/settings-core.test.js` exists, append; otherwise create it with this content (adjust the `require` path/name if the existing test file uses a different harness):

```js
const test = require("node:test");
const assert = require("node:assert");
const C = require("./settings-core.js");

test("resolveSbPreview falls back to defaults when pref is empty", () => {
  const r = C.resolveSbPreview({});
  assert.deepStrictEqual(r, { stats: "on", meta: "off", chars: "off", feats: "off" });
});

test("resolveSbPreview applies explicit overrides", () => {
  const r = C.resolveSbPreview({ meta: "on", feats: "on" });
  assert.strictEqual(r.meta, "on");
  assert.strictEqual(r.feats, "on");
  assert.strictEqual(r.stats, "on"); // default preserved
});

test("resolveSbPreview ignores junk values, keeping default", () => {
  const r = C.resolveSbPreview({ stats: "maybe" });
  assert.strictEqual(r.stats, "on");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd v2 && devbox run -- node --test docs/javascripts/settings-core.test.js`
Expected: FAIL — `C.resolveSbPreview is not a function`.

- [ ] **Step 3: Add `SBPREV_DEFAULTS` + `resolveSbPreview` to settings-core**

In `v2/docs/javascripts/settings-core.js`, inside the factory (before the `return {` block), add:

```js
  // Statblock-preview zone visibility. SINGLE SOURCE OF TRUTH for the global
  // default (mirror steel-etl sbPreviewDefaults + overrides/main.html).
  var SBPREV_DEFAULTS = { stats: "on", meta: "off", chars: "off", feats: "off" };
  var SBPREV_KEYS = ["stats", "meta", "chars", "feats"];

  // resolveSbPreview merges a saved {stats,meta,chars,feats} pref over the
  // defaults, coercing anything that is not exactly "on"/"off" to the default.
  function resolveSbPreview(pref) {
    pref = pref || {};
    var out = {};
    SBPREV_KEYS.forEach(function (k) {
      out[k] = (pref[k] === "on" || pref[k] === "off") ? pref[k] : SBPREV_DEFAULTS[k];
    });
    return out;
  }
```

Then add all three to the returned object (extend the existing `return { ... }`):

```js
    SBPREV_DEFAULTS: SBPREV_DEFAULTS,
    SBPREV_KEYS: SBPREV_KEYS,
    resolveSbPreview: resolveSbPreview,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd v2 && devbox run -- node --test docs/javascripts/settings-core.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the apply fn + controls to settings-panel.js**

In `v2/docs/javascripts/settings-panel.js`:

(a) Add the apply function near the other `applyX` functions (after `applyFeatureblocks`):

```js
  function applyStatblockPreview(prefs) {
    var r = C.resolveSbPreview(prefs.statblockPreview);
    var html = document.documentElement;
    C.SBPREV_KEYS.forEach(function (k) {
      html.setAttribute("data-sbprev-" + k, r[k]);
    });
  }
```

(b) Call it from `applyAll` (add the line after `applyFeatureblocks(prefs);`):

```js
    applyStatblockPreview(prefs);
```

(c) Add the controls markup inside the Statblocks `<details>`, as a new fieldset after the "Web extras" fieldset (before the closing `</details>` of `sc-set__group--sb`):

```js
          '<fieldset class="sc-set__sub"><legend>Index previews</legend>' +
            '<div class="sc-set__row sc-set__row--help">' +
              '<label class="sc-set__toggle"><input id="set-sbprev-stats" type="checkbox"><span>Show stats</span></label>' +
              sbHelp("Show the defenses row (Size, Speed, Stamina, Stability, Free Strike) on statblock preview cards.") +
            '</div>' +
            '<div class="sc-set__row sc-set__row--help">' +
              '<label class="sc-set__toggle"><input id="set-sbprev-meta" type="checkbox"><span>Show secondary stats</span></label>' +
              sbHelp("Show Immunity, Weakness, Movement, and Captain on preview cards.") +
            '</div>' +
            '<div class="sc-set__row sc-set__row--help">' +
              '<label class="sc-set__toggle"><input id="set-sbprev-chars" type="checkbox"><span>Show characteristics</span></label>' +
              sbHelp("Show the Might / Agility / Reason / Intuition / Presence line on preview cards.") +
            '</div>' +
            '<div class="sc-set__row sc-set__row--help">' +
              '<label class="sc-set__toggle"><input id="set-sbprev-feats" type="checkbox"><span>Show feature previews</span></label>' +
              sbHelp("List each feature (icon, name, usage, cost) on preview cards. Off by default — turns long statblocks into tall cards.") +
            '</div>' +
          '</fieldset>' +
```

(d) Bind the controls. Add a `bindStatblockPreview(drawer)` function next to `bindFeatureblocks`:

```js
  function bindStatblockPreview(drawer) {
    function sp() { return prefs.statblockPreview || (prefs.statblockPreview = {}); }
    var ids = { stats: "set-sbprev-stats", meta: "set-sbprev-meta", chars: "set-sbprev-chars", feats: "set-sbprev-feats" };

    function syncUI() {
      var r = C.resolveSbPreview(prefs.statblockPreview);
      C.SBPREV_KEYS.forEach(function (k) {
        drawer.querySelector("#" + ids[k]).checked = r[k] === "on";
      });
    }
    C.SBPREV_KEYS.forEach(function (k) {
      drawer.querySelector("#" + ids[k]).addEventListener("change", function () {
        sp()[k] = this.checked ? "on" : "off";
        applyStatblockPreview(prefs);
        persist();
        syncUI();
        // Re-seed any preview grids on the current page that the user has not
        // overridden via the per-page bar (statblock-preview.js owns the flag).
        if (window.SteelStatblockPreview && window.SteelStatblockPreview.reseed) {
          window.SteelStatblockPreview.reseed();
        }
      });
    });
    syncUI();
    return syncUI;
  }
```

Then call it in `bindDrawer` next to the others:

```js
    var syncSbPrev = bindStatblockPreview(drawer);
```

And add `syncSbPrev();` to the Reset-all handler (alongside `syncSb(); syncFb();`).

- [ ] **Step 6: Add the FOUC-free early-apply in main.html**

In `v2/overrides/main.html`, inside the early-apply IIFE (after the featureblock `data-fb-*` loop, before the closing `} catch(e) {}`), add:

```js
            // Statblock-preview zone visibility (data-sbprev-*) — global default
            // seed read by statblock-preview.js; SINGLE SOURCE mirrors
            // settings-core SBPREV_DEFAULTS + steel-etl sbPreviewDefaults.
            var sp = s.statblockPreview || {};
            var spD = {stats:"on", meta:"off", chars:"off", feats:"off"};
            for (var spk in spD) {
              var spv = (sp[spk] === "on" || sp[spk] === "off") ? sp[spk] : spD[spk];
              document.documentElement.setAttribute("data-sbprev-"+spk, spv);
            }
```

- [ ] **Step 7: Re-run JS tests + build**

Run:
```bash
cd v2 && devbox run -- node --test docs/javascripts/settings-core.test.js && devbox run -- mkdocs build 2>&1 | tail -5
```
Expected: tests PASS, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add v2/docs/javascripts/settings-core.js v2/docs/javascripts/settings-core.test.js v2/docs/javascripts/settings-panel.js v2/overrides/main.html
git commit -m "feat: global 'Index previews' statblock toggles in settings drawer"
```

---

### Task 7: Per-page toggle bar (`statblock-preview.js`)

For each `.sb-cards` grid that contains `.sb-prev` cards: seed the grid's `data-sbprev-*` from the global `<html>` attrs, inject a compact chip bar above it, and wire live per-page toggling. Must be `document$`-safe and idempotent (Material instant-nav).

**Files:**
- Create: `v2/docs/javascripts/statblock-preview.js`
- Modify: `v2/mkdocs.yml`

- [ ] **Step 1: Write `statblock-preview.js`**

Create `v2/docs/javascripts/statblock-preview.js`:

```js
/*
 * statblock-preview.js — per-page show/hide bar for statblock preview grids.
 * Each .sb-cards grid carries build-time default data-sbprev-* attributes
 * (steel-etl sbCardsOpen). On init we (a) seed the grid from the GLOBAL pref
 * (the <html data-sbprev-*> attrs the settings drawer/early-apply set), unless
 * the user already overrode this grid in-session; (b) render a chip bar that
 * flips the grid's attributes live. CSS (steel-statblock.css) does the hiding.
 *
 * navigation.instant-safe: registers via document$, idempotent, adds no global
 * listeners. Exposes window.SteelStatblockPreview.reseed() so the settings
 * drawer can re-apply a changed global default to non-overridden grids.
 */
(function () {
  "use strict";

  var ZONES = [
    { key: "stats", label: "Stats" },
    { key: "meta", label: "Secondary" },
    { key: "chars", label: "Characteristics" },
    { key: "feats", label: "Features" }
  ];

  function globalAttr(key) {
    return document.documentElement.getAttribute("data-sbprev-" + key);
  }

  // Seed a grid's attrs from the global pref unless the user overrode it here.
  function seedGrid(grid) {
    if (grid.dataset.sbprevUser === "1") return;
    ZONES.forEach(function (z) {
      var g = globalAttr(z.key);
      if (g === "on" || g === "off") grid.setAttribute("data-sbprev-" + z.key, g);
    });
  }

  function buildBar(grid) {
    var bar = document.createElement("div");
    bar.className = "sb-prev-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Show or hide statblock preview details");

    var lbl = document.createElement("span");
    lbl.className = "sb-prev-bar__label";
    lbl.textContent = "Show:";
    bar.appendChild(lbl);

    ZONES.forEach(function (z) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sb-prev-bar__chip";
      chip.textContent = z.label;
      function sync() {
        var on = grid.getAttribute("data-sbprev-" + z.key) !== "off";
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      }
      chip.addEventListener("click", function () {
        var on = grid.getAttribute("data-sbprev-" + z.key) !== "off";
        grid.setAttribute("data-sbprev-" + z.key, on ? "off" : "on");
        grid.dataset.sbprevUser = "1"; // this grid is now user-controlled
        sync();
      });
      sync();
      bar.appendChild(chip);
    });
    return bar;
  }

  function enhance(grid) {
    if (grid.dataset.sbprevReady === "1") {
      seedGrid(grid); // re-seed on instant-nav re-init (global may have changed)
      return;
    }
    seedGrid(grid);
    var bar = buildBar(grid);
    grid.parentNode.insertBefore(bar, grid);
    grid.dataset.sbprevReady = "1";
  }

  function init() {
    var grids = document.querySelectorAll(".sb-cards");
    for (var i = 0; i < grids.length; i++) {
      if (grids[i].querySelector(".sb-prev")) enhance(grids[i]);
    }
  }

  // Public hook: settings drawer calls this after a global change.
  window.SteelStatblockPreview = {
    reseed: function () {
      var grids = document.querySelectorAll(".sb-cards");
      for (var i = 0; i < grids.length; i++) seedGrid(grids[i]);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  }
})();
```

- [ ] **Step 2: Register the script in mkdocs.yml**

In `v2/mkdocs.yml`, add to `extra_javascript` (after `javascripts/steel-statblock.js` at line 141):

```yaml
  - javascripts/statblock-preview.js
```

- [ ] **Step 3: Build and confirm the asset is wired**

Run: `cd v2 && devbox run -- mkdocs build 2>&1 | tail -5 && ls site/javascripts/statblock-preview.js`
Expected: build succeeds and the file exists in `site/javascripts/`.

- [ ] **Step 4: Commit**

```bash
git add v2/docs/javascripts/statblock-preview.js v2/mkdocs.yml
git commit -m "feat: per-page statblock-preview toggle bar"
```

---

### Task 8: Full pipeline build + visual verification

The earlier `mkdocs build` steps only confirm the static `docs/` compiles — the actual statblock preview pages are generated by `steel-etl site`. This task runs the real pipeline and verifies the previews render on both a large and a small statblock group.

**Files:** none (verification only).

- [ ] **Step 1: Run the v2 deploy pipeline (gen + site)**

Run from the workspace root:
```bash
devbox run -- just deploy-v2 2>&1 | tail -30
```
Expected: pipeline completes; no Go panics; `steel-etl site` reports pages written.

- [ ] **Step 2: Confirm preview cards are in the generated HTML**

Run (a monster group landing — large statblocks):
```bash
grep -rl 'class="sb-cards"' v2/docs/Browse/ | head
grep -c 'class="sb-wrap sb-prev"' "$(grep -rl 'class="sb-cards"' v2/docs/Browse/ | head -1)"
```
Expected: at least one group-landing index page lists multiple `.sb-prev` cards, and the grid carries `data-sbprev-stats="on" data-sbprev-meta="off" data-sbprev-chars="off" data-sbprev-feats="off"`.

- [ ] **Step 3: Serve and visually verify (large + small statblocks)**

Run: `cd v2 && devbox run -- mkdocs serve` and open a monster group landing (e.g. a goblins group) and a small one (e.g. a single-creature group or a minion portfolio). Verify per the screenshot tool / browser per memory `reference_playwright_mcp_broken` (Brave executablePath). Confirm:
  - The header (ancestry / name / level / role / EV) shows on every preview, role-colored, and collapses cleanly at narrow widths.
  - Default: defenses row shows; secondary/characteristics/features hidden.
  - The "Show:" chip bar toggles each zone live; feature previews list icon · name · usage · cost.
  - Opening the gear drawer → Statblocks → "Index previews" flips the global default and the grids on the page follow (reseed) when not locally overridden.
  - Cards link to the full statblock page on click.

- [ ] **Step 4: Verify nothing else regressed**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ && cd ../v2 && devbox run -- node --test docs/javascripts/*.test.js`
Expected: all PASS.

- [ ] **Step 5: Update docs (part of "done")**

Per the workspace router rules, add a brief pointer for this feature. Append a short note to `steel-etl/docs/site-builder.md` (statblock preview cards: `statblock_preview.go`, `sb-prev`/`sb-cards`, `data-sbprev-*` zone toggles seeded from the global pref + per-page bar) and update `steel-etl/docs/statblocks.md` if it lists preview-card behavior. No CLAUDE.md detail (router only).

- [ ] **Step 6: Commit**

```bash
git add steel-etl/docs/
git commit -m "docs: statblock preview cards (sb-prev / data-sbprev-* zones)"
```

---

## Self-Review

**Spec coverage:**
- "Header always shown (name, ancestry, role, organization, level, EV)" → `renderStatblockHead` reused verbatim; `Role` is `org + " " + role` (built in `buildStatblockIsland`), `Ancestry` is keywords. ✓ (Task 1, 3)
- "Reuse the existing full-statblock header styling" → `.sb__head` markup reused; `.sb-prev`-scoped CSS only tightens spacing/sizes. ✓ (Task 5)
- "Stats / secondary stats / characteristics each toggleable" → `data-sbprev-stats/meta/chars` zone gates. ✓ (Task 3, 5)
- "Secondary = ledger, characteristics = one line, boxed = boxed letter (no customization)" → fixed `.sb-prev`-scoped CSS, decoupled from `data-sb-*`. ✓ (Task 5)
- "Optional basic feature preview: icon, name, cost, usage; compact" → `renderStatblockFeatureLine` + `.sb-prev__feats`; off by default. ✓ (Task 2, 5)
- "Toggles like the statblock settings categories" → settings-drawer "Index previews" fieldset mirrors Stats/Secondary/Characteristics + Features. ✓ (Task 6)
- "Both global default AND per-index page toggles" → global pref seeds grids; per-page chip bar overrides in-session. ✓ (Task 6, 7)
- "Show all features uncapped" → `renderStatblockPreviewCard` lists every feature; no cap. ✓ (Task 3)
- "Defer the default-visibility decision" → single config point `sbPreviewDefaults` (Go) + `SBPREV_DEFAULTS` (JS) + `spD` (main.html); plan ships `stats=on` only. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows assertions; commands include expected output.

**Type consistency:** `renderStatblockPreviewCard(d sbIsland, href, source string)` — three args used consistently in Tasks 3 & 4. `statblockPreviewCard(fm, body, href, name string)` — consistent in Task 4 + tests. Zone keys `stats/meta/chars/feats` identical across Go (`sbPreviewDefaults`), CSS selectors, settings-core (`SBPREV_KEYS`), main.html, and `statblock-preview.js` (`ZONES`). Attribute name `data-sbprev-<key>` identical in Go output, CSS, JS, and early-apply. `linkText` (existing, statblock_page.go) reused for link-stripping. `sbACT`/`sbEsc`/`dirURL`/`bestiarySource`/`renderStatblockMeta`/`renderStatblockChars` all pre-existing and referenced correctly.

**One risk to watch:** removing `statblockCard`/`retainerCard`/`statblockTypeLabel` may strand helper functions (`withSource`, `tagsBlock`, `lineBlock`) — Task 4 Step 3/5 explicitly gates deletion on the compiler/`go vet` confirming each is unreferenced, so this is caught, not assumed.
