# Beastheart Companion Statblock Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Beastheart companion base statblocks as the High-Fantasy Steel `.sb-wrap` card (embedded on the companion's own page, replacing the raw stat table) and as a `.sb-prev` preview on the `monster/companion/beastheart/` index — reusing the existing statblock renderers via a new `feature-group → sbIsland` adapter.

**Architecture:** Companion leaf pages are `type: feature-group` (SCC `monster.companion.beastheart.statblock/<species>`) whose stats live in a 4-row markdown body table (`**value**<br>Label` cells) and whose abilities are `##` sections — so nothing builds an `sbIsland` for them today. We add a site-only adapter (`companion_statblock.go`) that parses that table + the ability sections into the existing `sbIsland` model, then reuses `renderStatblockCard` (full card, embedded on the leaf) and `renderStatblockPreviewCard` (index preview). A build-scoped cache carries the parsed island from the leaf-transform pass to the later index-build pass (the leaf body is already rewritten to HTML by then — same ordering gotcha monster previews solve, but companions cache the **whole island** because their stats come from the body, not frontmatter). Ability parsing reuses `parseStatblockIslandFeature` via a synthesized title line (zero new feature-parse logic).

**Tech Stack:** Go 1.26 (steel-etl `internal/site`), run via `devbox run -- ...`; v2 MkDocs CSS for index layout. TDD with `go test`.

---

## Background facts (verified 2026-06-15)

- **12 companion species**, each with a base leaf `<species>.md` + an `<species>-advancement-features.md` sibling under `v2/docs/Browse/monster/companion/beastheart/`.
- **Base leaf body shape** (uniform across all 12), after `# Name` + `---`:
  - A 5-column stat table: header row = `keywords | - | Level N | - | -`; separator; then three data rows of `**value**<br>Label` cells: `Size/Speed/Stamina/Stability/Free Strike`, then `Immunity/Movement/Skills/(blank)/(blank)`, then `Might/Agility/Reason/Intuition/Presence`.
  - Then ability `##` sections (e.g. `## Pounce {data-scc="…feature.ability.companion.beastheart.<sp>.level-1/pounce"}`): optional italic flavor, an optional 2×2 spec table (`| **keywords** | **action** |` / `| **distance** | **target** |`), then `**Effect:**` / `**Spend N Ferocity:**` labeled paragraphs. Passive abilities (e.g. `## Mighty Spring`) have prose and no table.
  - Then a `## <Species> Advancement Features {data-scc="…monster.companion.beastheart.advancement-features/<sp>"}` section with `### …` children. **OUT OF SCOPE — left verbatim.**
- **Values may contain links** (Skills cell always; e.g. drake's Immunity). Generated-body links are already relative `.md` paths; `resolveSbLinks` → `cardHref` converts them to working directory URLs in the raw-HTML card (same path monster statblocks use — verified).
- **Companions have no EV** and `role` = "Companion" (not in `knownRoleKeys`, so `roleKey` falls back to grey "leader").
- **Frontmatter** has only `name`/`level`/`companion`/`type`/`scc`/`printing*` — **no stat scalars**. This is why we parse the body and cache the whole island.
- **Index routing:** `buildAdvancementPairContent` (`advancement_pairs.go`) claims `monster/companion/beastheart` FIRST in `buildIndexContent` (build.go) and pairs `<base>.md` + `<base>-advancement-features.md` into a `.sc-cards--pairs` grid. Fixtures use the same builder (eyebrow "Fixture") — they are NOT companions and must keep falling through to the generic card.
- **Preview-system wiring (hard constraint):** `statblock-preview.js` selects `document.querySelectorAll(".sb-cards")` and the zone CSS keys off `.sb-cards[data-sbprev-*] .sb-prev …`. So a `.sb-prev` card only gets its default zone visibility + toggle behavior when it sits inside a `.sb-cards`-classed grid that carries the `data-sbprev-*` attributes (`sbCardsOpen`).

## File structure

- **Create** `steel-etl/internal/site/companion_statblock.go` — grid parser, island builder, ability-section parser, base/advancement split, leaf-transform, preview helper, and the `companionStatblockCache`.
- **Create** `steel-etl/internal/site/companion_statblock_test.go` — unit tests.
- **Modify** `steel-etl/internal/site/statblock_card.go` — `renderStatblockHead` omits the EV div when `EV == ""`.
- **Modify** `steel-etl/internal/site/build.go` — add `buildCompanionStatblockPage` to the `buildSection` transform chain; reset `companionStatblockCache` in `Build()`.
- **Modify** `steel-etl/internal/site/advancement_pairs.go` — companion base slot renders `.sb-prev` from the cache; grid container gains `.sb-cards` + `data-sbprev-*` defaults when any companion preview is present.
- **Modify** `v2/docs/stylesheets/steel-statblock.css` (or `steel-redesign.css`) — lay out `.sc-cards--pairs.sb-cards` (base `.sb-prev` + adv `.sc-card`, top-aligned).

## Decision required at the verify-restate gate (index layout)

Two ways to host the `.sb-prev` base in the companion index. **Recommended: Option A.**

- **Option A (recommended):** Keep the existing 2-up pair grid, but add the `.sb-cards` class + `data-sbprev-*` defaults to the `.sc-cards--pairs` container so the preview JS/CSS apply. Base cell = `.sb-prev`, adv cell stays `.sc-card`, rows top-aligned. Preserves the base↔advancement pairing the user just built; one focused CSS rule (`.sc-cards--pairs.sb-cards`).
- **Option B:** Two separate grids — a `.sb-cards` grid of base previews, then the advancement `.sc-card`s below. Cleaner CSS (no grid-class overlap) but abandons the visual pairing.

This plan implements **Option A**. (Tasks 7–8 are the only ones that differ between A and B.)

---

### Task 1: Companion stat-grid parser

**Files:**
- Create: `steel-etl/internal/site/companion_statblock.go`
- Test: `steel-etl/internal/site/companion_statblock_test.go`

- [ ] **Step 1: Write the failing test**

```go
package site

import (
	"strings"
	"testing"
)

// pantherCompanionBody is the verbatim base region (table + abilities, no
// advancement section) of a generated companion leaf body.
const pantherCompanionBody = `| Animal, Companion |           -           |                        Level 1                        |          -          |            -             |
|:-----------------:|:---------------------:|:-----------------------------------------------------:|:-------------------:|:------------------------:|
|  **1M**<br>Size   |    **7**<br>Speed     |                **= yours**<br>Stamina                 | **1**<br>Stability  | **1 + M**<br>Free Strike |
| **—**<br>Immunity | **Climb**<br>Movement | **[Sneak](../../../skill/intrigue/sneak.md)**<br>Skills |                     |                          |
|  **+2**<br>Might  |   **+2**<br>Agility   |                   **−1**<br>Reason                    | **+2**<br>Intuition |    **+1**<br>Presence    |

## Pounce {data-scc="mcdm.beastheart.v1/feature.ability.companion.beastheart.panther.level-1/pounce"}

*The panther bunches up, then uncoils into a deadly leap.*

| **Companion, Melee, Weapon** |     **Maneuver** |
|------------------------------|-----------------:|
| **📏 Melee 1**               | **🎯 One enemy** |

**Effect:** The target takes damage equal to 3 + the panther's Might score.

**Spend 1 Ferocity:** The panther can jump up to a number of squares equal to their speed.

## Mighty Spring {data-scc="mcdm.beastheart.v1/feature.companion.beastheart.panther.level-1/mighty-spring"}

Whenever the panther takes the Advance move action, they can jump up to a number of squares equal to their speed.`

func TestParseCompanionGrid_Panther(t *testing.T) {
	g := parseCompanionGrid(pantherCompanionBody)
	if g.keywords != "Animal, Companion" {
		t.Errorf("keywords = %q", g.keywords)
	}
	if g.level != "1" {
		t.Errorf("level = %q, want 1", g.level)
	}
	want := map[string]string{
		"Size": "1M", "Speed": "7", "Stamina": "= yours", "Stability": "1",
		"Free Strike": "1 + M", "Immunity": "—", "Movement": "Climb",
		"Might": "+2", "Agility": "+2", "Reason": "−1", "Intuition": "+2", "Presence": "+1",
	}
	for k, v := range want {
		if g.cells[k] != v {
			t.Errorf("cell[%q] = %q, want %q", k, g.cells[k], v)
		}
	}
	// Skills keeps its markdown link (resolved later by resolveSbLinks).
	if !strings.Contains(g.cells["Skills"], "[Sneak](") {
		t.Errorf("skills cell = %q, want a Sneak link", g.cells["Skills"])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestParseCompanionGrid'`
Expected: FAIL — `undefined: parseCompanionGrid`.

- [ ] **Step 3: Write the parser**

Create `steel-etl/internal/site/companion_statblock.go`:

```go
package site

// High-Fantasy Steel COMPANION statblock adapter. Beastheart companion pages are
// type: feature-group (SCC monster.companion.beastheart.statblock/<species>), not
// type: statblock — their stats live in a body table and their abilities are ##
// sections. This file parses that shape into the shared sbIsland model
// (statblock_page.go) so the companion renders as the .sb-wrap card on its own
// page (replacing the raw table) and as the .sb-prev preview on the index. The
// advancement-features section (## … {data-scc=…advancement-features…}) is left
// verbatim — its card quality is a separate task. SITE-ONLY: shared data repos
// untouched. Reuses parseAbilityTable / parseStatblockIslandFeature / resolveSbLinks.

import (
	"regexp"
	"strings"
)

// companionGrid is the parsed companion stat table: header keywords + level, and
// a label→value map across the three data rows (Size…Presence; values keep any
// markdown link, resolved later by resolveSbLinks).
type companionGrid struct {
	keywords string
	level    string
	cells    map[string]string
}

var (
	// "Level 1" inside the header row.
	companionLevelRe = regexp.MustCompile(`(?i)\bLevel\s+(\S+)`)
	// strip an attr_list suffix from a heading: "Pounce {data-scc=…}" → "Pounce".
	companionAttrRe = regexp.MustCompile(`\s*\{[^}]*\}\s*$`)
)

// parseCompanionGrid reads the first markdown table in body. The first row
// (before the :---: separator) is the header (keywords in col 0, "Level N"
// somewhere); each later data-row cell is "**value**<br>Label" → cells[Label]=value.
func parseCompanionGrid(body string) companionGrid {
	g := companionGrid{cells: map[string]string{}}
	var rows [][]string
	for _, line := range strings.Split(body, "\n") {
		t := strings.TrimSpace(line)
		if !strings.HasPrefix(t, "|") {
			if len(rows) > 0 {
				break // table ended
			}
			continue
		}
		if strings.Contains(t, "---") {
			continue // separator row
		}
		rows = append(rows, splitRow(t))
	}
	if len(rows) == 0 {
		return g
	}
	// Header: keywords + level.
	header := strings.Join(rows[0], " ")
	if m := companionLevelRe.FindStringSubmatch(header); m != nil {
		g.level = strings.TrimSpace(m[1])
	}
	if len(rows[0]) > 0 {
		g.keywords = cellText(rows[0][0])
	}
	// Data rows: "**value**<br>Label".
	for _, row := range rows[1:] {
		for _, cell := range row {
			val, label, ok := splitCompanionCell(cell)
			if ok {
				g.cells[label] = val
			}
		}
	}
	return g
}

// splitCompanionCell splits "**value**<br>Label" → (value, label). value has its
// **bold** wrapper stripped but keeps any inner markdown link. ok=false for an
// empty/padding cell (no <br>).
func splitCompanionCell(cell string) (val, label string, ok bool) {
	parts := strings.SplitN(cell, "<br>", 2)
	if len(parts) != 2 {
		return "", "", false
	}
	label = strings.TrimSpace(parts[1])
	val = cellText(strings.TrimSpace(parts[0]))
	if label == "" {
		return "", "", false
	}
	return val, label, true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestParseCompanionGrid'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd steel-etl && git add internal/site/companion_statblock.go internal/site/companion_statblock_test.go
git commit -m "feat(site): parse beastheart companion stat grid"
```

---

### Task 2: Companion island builder

**Files:**
- Modify: `steel-etl/internal/site/companion_statblock.go`
- Test: `steel-etl/internal/site/companion_statblock_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestBuildCompanionStatblockIsland_Panther(t *testing.T) {
	fm := "name: Panther\nlevel: \"1\"\ncompanion: panther\ntype: feature-group\nscc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther"
	d := buildCompanionStatblockIsland(fm, pantherCompanionBody)
	if d.Name != "Panther" || d.ID != "panther" {
		t.Errorf("name/id = %q/%q", d.Name, d.ID)
	}
	if d.Ancestry != "Animal, Companion" || d.Level != "1" {
		t.Errorf("ancestry/level = %q/%q", d.Ancestry, d.Level)
	}
	if d.Role != "Companion" || d.RoleKey != "leader" {
		t.Errorf("role/roleKey = %q/%q, want Companion/leader", d.Role, d.RoleKey)
	}
	if d.EV != "" {
		t.Errorf("ev = %q, want empty", d.EV)
	}
	if len(d.Defenses) != 5 || d.Defenses[0].V != "1M" || d.Defenses[2].V != "= yours" {
		t.Fatalf("defenses = %+v", d.Defenses)
	}
	if d.Meta.Movement != "Climb" || d.Meta.Captain.Label != "Skills" {
		t.Errorf("meta = %+v", d.Meta)
	}
	if !strings.Contains(d.Meta.Captain.Value, "[Sneak](") {
		t.Errorf("skills value = %q", d.Meta.Captain.Value)
	}
	wantChars := map[string]string{"Might": "+2", "Reason": "−1", "Presence": "+1"}
	for _, c := range d.Characteristics {
		if w, ok := wantChars[c.L]; ok && c.V != w {
			t.Errorf("char %s = %q, want %q", c.L, c.V, w)
		}
	}
	// Two abilities parsed (Pounce + Mighty Spring); flavor-only text is no feature.
	if len(d.Features) != 2 {
		t.Fatalf("features = %d, want 2", len(d.Features))
	}
	if d.Features[0].Name != "Pounce" || d.Features[1].Name != "Mighty Spring" {
		t.Errorf("feature names = %q / %q", d.Features[0].Name, d.Features[1].Name)
	}
}
```

(This test also exercises Task 3's `companionFeatures`; both land before it goes green.)

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildCompanionStatblockIsland'`
Expected: FAIL — `undefined: buildCompanionStatblockIsland`.

- [ ] **Step 3: Add the island builder**

Append to `companion_statblock.go`:

```go
// buildCompanionStatblockIsland maps a companion feature-group page (frontmatter +
// base-region body) onto the shared sbIsland. Stats come from the body grid
// (companions carry no stat frontmatter); abilities from the ## sections. Role is
// the literal "Companion" (grey "leader" accent — not a knownRoleKey); EV is empty
// (omitted by renderStatblockHead). The Skills grid cell rides in the meta block's
// Captain slot, relabeled "Skills"; Weakness is "—".
func buildCompanionStatblockIsland(fm, baseBody string) sbIsland {
	g := parseCompanionGrid(baseBody)
	name := strings.TrimSpace(parseFrontmatterField(fm, "name"))
	level := g.level
	if level == "" {
		level = strings.TrimSpace(parseFrontmatterField(fm, "level"))
	}
	metaVal := func(label string) string {
		if v := strings.TrimSpace(g.cells[label]); v != "" {
			return resolveSbLinks(v)
		}
		return "—"
	}
	return sbIsland{
		ID:       slugify(name),
		Name:     name,
		Ancestry: g.keywords,
		Level:    level,
		Role:     "Companion",
		RoleKey:  "leader",
		EV:       "",
		Defenses: []sbLV{
			{L: "Size", V: orDash(g.cells["Size"])},
			{L: "Speed", V: orDash(g.cells["Speed"])},
			{L: "Stamina", V: orDash(g.cells["Stamina"])},
			{L: "Stability", V: orDash(g.cells["Stability"])},
			{L: "Free Strike", V: orDash(g.cells["Free Strike"])},
		},
		Meta: sbMeta{
			Immunity: metaVal("Immunity"),
			Weakness: "—",
			Movement: metaVal("Movement"),
			Captain:  sbCaptain{Label: "Skills", Value: metaVal("Skills")},
		},
		Characteristics: []sbChar{
			{L: "Might", K: "M", V: signValue(g.cells["Might"])},
			{L: "Agility", K: "A", V: signValue(g.cells["Agility"])},
			{L: "Reason", K: "R", V: signValue(g.cells["Reason"])},
			{L: "Intuition", K: "I", V: signValue(g.cells["Intuition"])},
			{L: "Presence", K: "P", V: signValue(g.cells["Presence"])},
		},
		Features: companionFeatures(baseBody),
	}
}
```

- [ ] **Step 4: Run test to verify it fails on `companionFeatures`**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildCompanionStatblockIsland'`
Expected: FAIL — `undefined: companionFeatures` (implemented in Task 3).

- [ ] **Step 5: Commit (after Task 3 makes this green — do not commit a broken build)**

Deferred to Task 3's commit.

---

### Task 3: Companion ability-section parser

**Files:**
- Modify: `steel-etl/internal/site/companion_statblock.go`
- Test: `steel-etl/internal/site/companion_statblock_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestCompanionFeatures_Panther(t *testing.T) {
	feats := companionFeatures(pantherCompanionBody)
	if len(feats) != 2 {
		t.Fatalf("features = %d, want 2", len(feats))
	}
	pounce := feats[0]
	if pounce.Name != "Pounce" || pounce.Action != "maneuver" || pounce.Kind != "ability" {
		t.Errorf("pounce name/action/kind = %q/%q/%q", pounce.Name, pounce.Action, pounce.Kind)
	}
	if strings.Join(pounce.Keywords, ",") != "Companion,Melee,Weapon" {
		t.Errorf("pounce keywords = %v", pounce.Keywords)
	}
	if pounce.Distance != "Melee 1" || pounce.Target != "One enemy" {
		t.Errorf("pounce dist/target = %q/%q", pounce.Distance, pounce.Target)
	}
	if len(pounce.Sections) == 0 || pounce.Sections[0].Label != "Effect" {
		t.Errorf("pounce sections = %+v", pounce.Sections)
	}
	if len(pounce.Enhancements) == 0 || !strings.Contains(pounce.Enhancements[0].Cost, "Spend 1 Ferocity") {
		t.Errorf("pounce enhancements = %+v", pounce.Enhancements)
	}
	// Mighty Spring is a passive trait (no spec table).
	spring := feats[1]
	if spring.Name != "Mighty Spring" || spring.Kind != "passive" || spring.Body == "" {
		t.Errorf("mighty spring = %+v", spring)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestCompanionFeatures'`
Expected: FAIL — `undefined: companionFeatures`.

- [ ] **Step 3: Implement the section splitter + per-feature reuse**

Append to `companion_statblock.go`:

```go
// companionFeatures splits the base region into its ability ## sections (up to,
// but excluding, the advancement-features section — callers pass a body already
// trimmed at that boundary by splitCompanionAdvancement) and parses each into an
// sbFeature. It reuses parseStatblockIslandFeature by synthesizing the title line
// it expects ("• **Name**"), so all the spec-table / Effect / Spend / passive
// logic is shared with monster statblocks — no duplicate feature parsing.
func companionFeatures(baseBody string) []sbFeature {
	var out []sbFeature
	for _, sec := range companionAbilitySections(baseBody) {
		block := "• **" + sec.name + "**\n\n" + sec.body
		if f, ok := parseStatblockIslandFeature(block); ok {
			out = append(out, f)
		}
	}
	return out
}

type companionSection struct {
	name string
	body string
}

// companionAbilitySections returns each "## Heading … body" section in document
// order, heading text stripped of any {attr_list} suffix. Content before the
// first ## (the stat table) is ignored.
func companionAbilitySections(body string) []companionSection {
	var secs []companionSection
	var cur *companionSection
	var buf []string
	flush := func() {
		if cur != nil {
			cur.body = strings.TrimSpace(strings.Join(buf, "\n"))
			secs = append(secs, *cur)
		}
		buf = nil
	}
	for _, line := range strings.Split(body, "\n") {
		if h, ok := strings.CutPrefix(strings.TrimSpace(line), "## "); ok {
			flush()
			name := strings.TrimSpace(companionAttrRe.ReplaceAllString(h, ""))
			cur = &companionSection{name: name}
			continue
		}
		if cur != nil {
			buf = append(buf, line)
		}
	}
	flush()
	return secs
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run "TestCompanionFeatures|TestBuildCompanionStatblockIsland|TestParseCompanionGrid"'`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
cd steel-etl && git add internal/site/companion_statblock.go internal/site/companion_statblock_test.go
git commit -m "feat(site): build companion sbIsland from grid + ## ability sections"
```

---

### Task 4: Base/advancement split + leaf-page transform + cache

**Files:**
- Modify: `steel-etl/internal/site/companion_statblock.go`
- Test: `steel-etl/internal/site/companion_statblock_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestBuildCompanionStatblockPage_Panther(t *testing.T) {
	page := `---
companion: panther
level: "1"
name: Panther
scc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther
type: feature-group
---

# Panther

---

` + pantherCompanionBody + `

## Panther Advancement Features {data-scc="mcdm.beastheart.v1/monster.companion.beastheart.advancement-features/panther"}

### Cat and Mouse {data-scc="mcdm.beastheart.v1/feature.companion.beastheart.panther.level-3/cat-and-mouse"}

Whenever the panther makes a strike while rampaging, the panther can knock the target prone.`

	statblockFeatureCache = map[string][]sbFeature{}
	companionStatblockCache = map[string]sbIsland{}

	out, ok := buildCompanionStatblockPage([]byte(page))
	if !ok {
		t.Fatal("buildCompanionStatblockPage returned ok=false for a companion page")
	}
	s := string(out)
	// The .sb-wrap card replaced the raw stat table.
	if !strings.Contains(s, `class="sb-wrap"`) || strings.Contains(s, "<br>Size") {
		t.Errorf("expected .sb-wrap card and no raw stat table; got:\n%s", s)
	}
	// Frontmatter preserved.
	if !strings.HasPrefix(s, "---\n") || !strings.Contains(s, "type: feature-group") {
		t.Error("frontmatter not preserved verbatim")
	}
	// Advancement-features section kept verbatim after the card.
	if !strings.Contains(s, "## Panther Advancement Features") || !strings.Contains(s, "### Cat and Mouse") {
		t.Error("advancement-features section was dropped")
	}
	// Island cached by scc for the index pass.
	if _, hit := companionStatblockCache["mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther"]; !hit {
		t.Error("companion island not cached by scc")
	}
}

func TestBuildCompanionStatblockPage_NonCompanion(t *testing.T) {
	page := "---\ntype: statblock\nscc: mcdm.monsters.v1/monster.devils.statblock/x\n---\n\nbody"
	if _, ok := buildCompanionStatblockPage([]byte(page)); ok {
		t.Error("non-companion page must return ok=false")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildCompanionStatblockPage'`
Expected: FAIL — `undefined: companionStatblockCache` / `buildCompanionStatblockPage`.

- [ ] **Step 3: Implement the cache, split, and transform**

Append to `companion_statblock.go`:

```go
// companionStatblockCache maps a companion's scc → its parsed sbIsland, populated
// at leaf-transform time (buildCompanionStatblockPage). The index pass
// (buildAdvancementPairContent) reads the leaf AFTER buildSection has rewritten its
// body to .sb-wrap HTML — both the stat grid and the ## ability sections are gone
// by then — so unlike monster previews (stats live in frontmatter; only features
// are cached) companions must cache the WHOLE island. Build-scoped: reset in Build().
var companionStatblockCache = map[string]sbIsland{}

// companionMarker identifies a companion BASE statblock page by its scc segment.
const companionMarker = "monster.companion.beastheart.statblock"

// splitCompanionAdvancement splits a companion body into (baseRegion, advancement).
// The advancement region starts at the first "## …" heading whose attr_list carries
// an "advancement-features" scc; advancement is "" when there is none.
func splitCompanionAdvancement(body string) (base, advancement string) {
	lines := strings.Split(body, "\n")
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "## ") && strings.Contains(t, "advancement-features") {
			return strings.Join(lines[:i], "\n"), strings.Join(lines[i:], "\n")
		}
	}
	return body, ""
}

// buildCompanionStatblockPage rewrites a companion feature-group page body into the
// build-time .sb-wrap card (replacing the raw stat table + ability sections),
// keeping the advancement-features section verbatim below it. Returns (data, false)
// for any non-companion page so the caller writes it unchanged. Caches the island
// by scc for the index pass. injectH1 (next in buildSection) prepends "# Name".
func buildCompanionStatblockPage(data []byte) ([]byte, bool) {
	fm, body := splitFrontmatter(string(data))
	if strings.TrimSpace(parseFrontmatterField(fm, "type")) != "feature-group" {
		return data, false
	}
	scc := strings.TrimSpace(parseFrontmatterField(fm, "scc"))
	if !strings.Contains(scc, companionMarker) {
		return data, false
	}
	base, advancement := splitCompanionAdvancement(body)
	island := buildCompanionStatblockIsland(fm, base)
	if scc != "" {
		companionStatblockCache[scc] = island
	}
	card := renderStatblockCard(island)
	out := "---\n" + fm + "\n---\n\n" + card
	if strings.TrimSpace(advancement) != "" {
		out += "\n\n" + strings.TrimSpace(advancement) + "\n"
	}
	return []byte(out), true
}
```

Note: `splitFrontmatter`, `parseFrontmatterField`, `orDash`, `slugify`, `signValue`, `resolveSbLinks`, `cellText`, `splitRow` all already exist in the package (statblock_page.go / cards.go / ability_cards.go).

- [ ] **Step 4: Run tests to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildCompanionStatblockPage'`
Expected: PASS (both).

- [ ] **Step 5: Commit**

```bash
cd steel-etl && git add internal/site/companion_statblock.go internal/site/companion_statblock_test.go
git commit -m "feat(site): companion leaf transform → embedded .sb-wrap card + island cache"
```

---

### Task 5: Wire the transform into buildSection + reset the cache

**Files:**
- Modify: `steel-etl/internal/site/build.go:41` (cache reset) and `:270-272` (transform chain)

- [ ] **Step 1: Add the cache reset**

In `Build()`, beside the existing `statblockFeatureCache` reset (build.go:41):

```go
	statblockFeatureCache = map[string][]sbFeature{}
	companionStatblockCache = map[string]sbIsland{}
```

- [ ] **Step 2: Add the transform to the buildSection chain**

Immediately AFTER the `buildFeatureblockPage` block (build.go ~:270-272), before `injectH1`:

```go
		// Beastheart companion feature-group pages → the .sb-wrap statblock card
		// (replacing the raw stat table), keeping the advancement-features section.
		// Site-only; runs before injectH1 like the cards above.
		if card, ok := buildCompanionStatblockPage(data); ok {
			data = card
		}
```

- [ ] **Step 3: Verify the whole package still builds + vets**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./internal/site/ && go test ./internal/site/'`
Expected: PASS, no vet warnings.

- [ ] **Step 4: Commit**

```bash
cd steel-etl && git add internal/site/build.go
git commit -m "feat(site): hook companion statblock transform into buildSection"
```

---

### Task 6: `renderStatblockHead` omits empty EV

**Files:**
- Modify: `steel-etl/internal/site/statblock_card.go:271-278`
- Test: `steel-etl/internal/site/statblock_card_test.go` (add a case)

- [ ] **Step 1: Write the failing test**

Add to `statblock_card_test.go`:

```go
func TestRenderStatblockHead_OmitsEmptyEV(t *testing.T) {
	withEV := renderStatblockHead(sbIsland{Name: "X", Level: "1", Role: "Brute", RoleKey: "brute", EV: "32"})
	if !strings.Contains(withEV, "EV 32") {
		t.Errorf("expected EV when present: %s", withEV)
	}
	noEV := renderStatblockHead(sbIsland{Name: "Panther", Level: "1", Role: "Companion", RoleKey: "leader", EV: ""})
	if strings.Contains(noEV, `class="sb__ev"`) {
		t.Errorf("expected no EV div when EV empty: %s", noEV)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestRenderStatblockHead_OmitsEmptyEV'`
Expected: FAIL — the empty-EV case still emits `<div class="sb__ev">EV </div>`.

- [ ] **Step 3: Make the EV div conditional**

Replace `renderStatblockHead` (statblock_card.go:271-278):

```go
func renderStatblockHead(d sbIsland) string {
	ev := ""
	if strings.TrimSpace(d.EV) != "" {
		ev = `<div class="sb__ev">EV ` + sbEsc(d.EV) + `</div>`
	}
	return `<header class="sb__head"><div class="sb__head-row">` +
		`<div class="sb__identity"><div class="sb__kw">` + sbEsc(d.Ancestry) + `</div>` +
		`<h2 class="sb__name">` + sbEsc(d.Name) + `</h2></div>` +
		`<div class="sb__class"><div class="sb__level">Level ` + sbEsc(d.Level) + `</div>` +
		`<div class="sb__role" data-role="` + sbEsc(d.RoleKey) + `">` + sbEsc(d.Role) + `</div>` +
		ev + `</div></div></header>`
}
```

- [ ] **Step 4: Run the full site test suite (guards the shared renderer)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`
Expected: PASS — existing monster/summoner statblock tests (all have EV) still emit `EV …`.

- [ ] **Step 5: Commit**

```bash
cd steel-etl && git add internal/site/statblock_card.go internal/site/statblock_card_test.go
git commit -m "feat(site): omit EV field in statblock head when empty (companions)"
```

---

### Task 7: Index — companion base renders as `.sb-prev` in the pair grid

**Files:**
- Modify: `steel-etl/internal/site/advancement_pairs.go`
- Test: `steel-etl/internal/site/advancement_pairs_test.go`

- [ ] **Step 1: Write the failing test**

Add to `advancement_pairs_test.go` (mirror the temp-dir style of `TestBuildAdvancementPairContent`):

```go
func TestBuildAdvancementPairContent_CompanionPreview(t *testing.T) {
	dir := t.TempDir()
	// A transformed companion base leaf: frontmatter intact, body already .sb-wrap.
	base := "---\nname: Panther\nscc: mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther\ntype: feature-group\n---\n\n# Panther\n\n<div class=\"sb-wrap\">…</div>\n"
	adv := "---\nname: Panther\ntype: featureblock\n---\n\n# Panther\n"
	if err := os.WriteFile(filepath.Join(dir, "panther.md"), []byte(base), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "panther-advancement-features.md"), []byte(adv), 0644); err != nil {
		t.Fatal(err)
	}
	// Seed the cache as the leaf-transform pass would.
	companionStatblockCache = map[string]sbIsland{
		"mcdm.beastheart.v1/monster.companion.beastheart.statblock/panther": {
			Name: "Panther", ID: "panther", Role: "Companion", RoleKey: "leader", Level: "1",
		},
	}

	out, ok := buildAdvancementPairContent(filepath.Join("monster", "companion", "beastheart"), "beastheart",
		[]string{"panther.md", "panther-advancement-features.md"}, nil)
	if !ok {
		t.Fatal("ok=false")
	}
	if !strings.Contains(out, "sb-prev") {
		t.Errorf("expected a .sb-prev companion preview, got:\n%s", out)
	}
	// Grid carries the .sb-cards class + zone defaults so the preview JS/CSS apply.
	if !strings.Contains(out, "sb-cards") || !strings.Contains(out, `data-sbprev-stats="on"`) {
		t.Errorf("expected sb-cards grid with zone defaults, got:\n%s", out)
	}
	// The advancement card stays a generic .sc-card.
	if !strings.Contains(out, "Advancement Features") {
		t.Errorf("advancement card missing:\n%s", out)
	}
}
```

(`os`, `filepath`, `strings` are already imported in this test file — confirm and add any missing.)

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildAdvancementPairContent_CompanionPreview'`
Expected: FAIL — output still uses a generic base `.sc-card`, no `sb-prev`/`sb-cards`.

- [ ] **Step 3: Render the companion base as a preview**

In `advancement_pairs.go`, add a helper and a grid-open variant, and use them in `buildAdvancementPairContent`:

```go
// companionPreviewCard renders a companion base leaf as a .sb-prev preview from
// the cached island (companion_statblock.go). ok=false when the file isn't a
// cached companion (e.g. fixtures) — caller falls back to the generic card.
func companionPreviewCard(dir, baseFile string) (string, bool) {
	fm, _ := splitFrontmatter(readFile(filepath.Join(dir, baseFile)))
	scc := strings.TrimSpace(parseFrontmatterField(fm, "scc"))
	island, hit := companionStatblockCache[scc]
	if !hit {
		return "", false
	}
	return renderStatblockPreviewCard(island, baseFile, ""), true
}
```

`readFile` — if the package has no plain whole-file reader, use the same helper `readFrontmatterName`/`readFrontmatter` uses. Grep first: `grep -n 'os.ReadFile\|func read' internal/site/*.go`; reuse the existing reader (likely an `os.ReadFile` wrapper). If none, inline `b, _ := os.ReadFile(path); ...` and add `"os"` to imports.

Then in `buildAdvancementPairContent`, detect whether any companion preview exists, open the grid accordingly, and render each base via the preview when available:

```go
	// Decide the grid container: when any base is a cached companion, the grid
	// doubles as a .sb-cards preview grid (so statblock-preview.js + the zone CSS
	// apply) and carries the build-time zone defaults.
	previews := map[string]string{}
	for _, p := range pairs {
		if p.base == "" {
			continue
		}
		if cardHTML, ok := companionPreviewCard(dir, p.base); ok {
			previews[p.base] = cardHTML
		}
	}

	var sb strings.Builder
	sb.WriteString("# " + dirToTitle(dirName) + "\n\n---\n\n")
	if len(previews) > 0 {
		sb.WriteString(`<div class="sc-cards sc-cards--pairs sb-cards"`)
		for _, kv := range sbPreviewDefaults {
			sb.WriteString(` data-sbprev-` + kv[0] + `="` + kv[1] + `"`)
		}
		sb.WriteString(">\n")
	} else {
		sb.WriteString("<div class=\"sc-cards sc-cards--pairs\">\n")
	}
	for _, p := range pairs {
		if p.base != "" {
			if cardHTML, ok := previews[p.base]; ok {
				sb.WriteString(cardHTML + "\n")
			} else {
				sb.WriteString(card(p.base, icon, baseEyebrow, cardName(p.base), ""))
			}
		}
		if p.adv != "" {
			name := cardName(p.adv)
			if p.base != "" {
				name = cardName(p.base)
			}
			sb.WriteString(card(p.adv, icon, "Advancement Features", name, ""))
		}
	}
	sb.WriteString("</div>\n")
	return sb.String(), true
```

Remove the old single grid-open + loop these lines replace. `sbPreviewDefaults` is defined in `statblock_preview.go` (same package). Keep `baseEyebrow, icon := …` as-is above (still used by the fallback + fixtures).

- [ ] **Step 4: Run tests to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestBuildAdvancementPairContent'`
Expected: PASS — companion case shows `.sb-prev` + `sb-cards`; the existing `_Fixture` and `_NoPairs` cases still pass (fixtures aren't cached → generic card, no `sb-cards` class).

- [ ] **Step 5: Commit**

```bash
cd steel-etl && git add internal/site/advancement_pairs.go internal/site/advancement_pairs_test.go
git commit -m "feat(site): companion index bases render as .sb-prev previews"
```

---

### Task 8: v2 CSS — lay out `.sc-cards--pairs.sb-cards`

**Files:**
- Modify: `v2/docs/stylesheets/steel-statblock.css` (zone toggles live here; keep companion layout beside them)

- [ ] **Step 1: Add the layout rule**

After the existing `.md-typeset .sb-cards` block (~line 527) add:

```css
/* ── Companion index: pair grid that doubles as a .sb-prev preview grid ── */
/* The companion group landing keeps the base↔advancement pairing (.sc-cards--pairs)
   but the base cell is a .sb-prev preview, so the grid also carries .sb-cards for
   the zone toggles. Override .md-typeset .sb-cards' auto-fill columns with the
   2-up pair template and top-align the (tall preview / short advancement) cells. */
.md-typeset .sc-cards--pairs.sb-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}
.md-typeset .sc-cards--pairs.sb-cards .sb-prev { height: auto; }
@media (max-width: 44.9375em) {
  .md-typeset .sc-cards--pairs.sb-cards { grid-template-columns: 1fr; }
}
```

(Confirm the exact pair-grid template/breakpoint against the existing `.sc-cards--pairs` rule in `steel-redesign.css` and match it; adjust `minmax`/columns to whatever that rule uses so the pairing visually matches the other landings.)

- [ ] **Step 2: Commit (v2 repo)**

```bash
cd v2 && git add docs/stylesheets/steel-statblock.css
git commit -m "style: lay out companion pair grid as a .sb-prev preview grid"
```

(Do not push yet — pushed with Task 10.)

---

### Task 9: Full regen + visual verification

**Files:** none (build + screenshots)

- [ ] **Step 1: Regenerate the beastheart book + build the site**

Run from the workspace root:

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book beastheart && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```

(Or `just deploy-v2` minus the push — see ARCHITECTURE.md. `gen` needs `--book beastheart`/`--all` or the beastheart output goes stale.)

- [ ] **Step 2: Verify the generated output**

```bash
cd /home/vexa/code/steel_compendium/workspace
grep -c 'class="sb-wrap"' v2/docs/Browse/monster/companion/beastheart/panther.md   # want: 1 (was 0)
grep -c '<br>Size' v2/docs/Browse/monster/companion/beastheart/panther.md          # want: 0 (raw table gone)
grep -c '## Panther Advancement Features' v2/docs/Browse/monster/companion/beastheart/panther.md  # want: 1 (kept)
grep -o 'sb-prev\|sb-cards' v2/docs/Browse/monster/companion/beastheart/index.md | sort | uniq -c # want: sb-prev ×12, sb-cards ≥1
```

Expected: card embedded on leaf, table gone, advancement kept, 12 `.sb-prev` previews on the index.

- [ ] **Step 3: Screenshot the index + a leaf (Playwright MCP is broken — use headless Brave)**

```bash
devbox run -- bash -c 'cd v2 && mkdocs build' 2>/dev/null
/opt/brave.com/brave/brave --headless --screenshot=/tmp/companion-index.png --window-size=1400,2200 "file://$PWD/v2/site/Browse/monster/companion/beastheart/index.html"
/opt/brave.com/brave/brave --headless --screenshot=/tmp/companion-panther.png --window-size=1400,2400 "file://$PWD/v2/site/Browse/monster/companion/beastheart/panther/index.html"
```

Read both screenshots. Check: previews render with the High-Fantasy Steel frame; the base preview + advancement card sit as a tidy pair (top-aligned, no overflow); the leaf shows the full `.sb-wrap` card then the advancement section; no broken Skills/Immunity links; the role accent reads as the grey "leader" neutral. Iterate on Task 8 CSS if the pairing looks unbalanced. (Default zones are stats-on/rest-off per `sbPreviewDefaults`; to inspect all zones, force the grid attrs — `statblock-preview.js` reseeds from `<html data-sbprev-*>`.)

- [ ] **Step 4: Run the full steel-etl test suite + vet once more**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./... && go vet ./internal/site/'`
Expected: GREEN.

---

### Task 10: Deploy + docs + memory

**Files:** `ROADMAP.md`, `DESIGN.md`, `docs/handoffs/HANDOFF.md`, this plan's `## Status`, memory `project_statblock_preview_cards`, `MEMORY.md`

- [ ] **Step 1: Push steel-etl, bump the workspace submodule**

```bash
cd /home/vexa/code/steel_compendium/workspace
git -C steel-etl push origin main
git add steel-etl && git commit -m "chore: bump steel-etl to <sha> (companion statblock adapter)"
```

- [ ] **Step 2: Deploy the site (regenerates v2 content + pushes)**

```bash
just deploy-v2     # full pipeline + v2 site
cd v2 && git push origin main   # CI gh-deploy publishes on push (push steel-etl CSS commit too if not already)
```

(Confirm against ARCHITECTURE.md whether `just deploy-v2` pushes v2; the handoff notes `just deploy` pushes API + v2 but NOT steel-etl/workspace — push those yourself.)

- [ ] **Step 3: Update docs**

- `ROADMAP.md` #12 → `**Status:** shipped <date>` with a one-line outcome; if pruning, move to the roadmap archive keeping `(was #12)`.
- `DESIGN.md` — add companions to the statblock preview-card coverage note (now: monsters, summoner, **beastheart companions**).
- This plan's `## Status` → shipped.
- No `docs/scc-log.md` entry — this is **site-only rendering**, no SCC scheme/registry change.
- `docs/handoffs/HANDOFF.md` — via the `creating-handoffs` skill: mark #12 shipped, note the advancement-features card-quality task + the #11 default-zone poll remain.

- [ ] **Step 4: Update memory**

Append to `project_statblock_preview_cards.md`: companions now render via `companion_statblock.go` (feature-group→sbIsland adapter; whole-island cache `companionStatblockCache`; leaf embeds `.sb-wrap`, index shows `.sb-prev` in a `.sc-cards--pairs.sb-cards` grid). Update the `MEMORY.md` one-liner.

- [ ] **Step 5: Commit the workspace docs**

```bash
cd /home/vexa/code/steel_compendium/workspace
git add ROADMAP.md DESIGN.md docs/handoffs/HANDOFF.md docs/superpowers/plans/2026-06-15-companion-statblock-adapter.md
git commit -m "docs: companion statblock adapter shipped (ROADMAP #12)"
git push origin main
```

---

## Status

**Shipped 2026-06-15.** Executed via subagent-driven-development (Option A — kept the base↔advancement pairing). All 12 companions render the full `.sb-wrap` card on their leaf page (raw table replaced, advancement section kept) and a `.sb-prev` preview on the index. Final go-reviewer: no blocking issues; the one MEDIUM (duplicated `data-sbprev-*` attr loop) was fixed by extracting `sbPreviewDefaultAttrs`. Full `steel-etl` suite + `go vet` green; verified end-to-end with headless-Brave screenshots of the index + the panther leaf.

## Self-review notes

- **Spec coverage:** ROADMAP #12 goal halves both covered — embed full card on leaf (Task 4) + `.sb-prev` on index (Task 7); grid parse → defenses/meta/chars/ancestry/level (Tasks 1–2); `##` sections → features (Task 3); build-order/cache gotcha handled by `companionStatblockCache` (Task 4, reset Task 5); index hook in `buildAdvancementPairContent`, advancement cards untouched (Task 7); fixtures unaffected (not cached → fallback). Out-of-scope advancement-features card quality left verbatim.
- **Type consistency:** `parseCompanionGrid`→`companionGrid{keywords,level,cells}`; `buildCompanionStatblockIsland(fm,base)`→`sbIsland`; `companionFeatures(base)`→`[]sbFeature` via `companionAbilitySections`→`companionFeatures`→`parseStatblockIslandFeature`; `splitCompanionAdvancement(body)`→`(base,advancement)`; `buildCompanionStatblockPage(data)`→`([]byte,bool)`; `companionStatblockCache map[string]sbIsland`; `companionPreviewCard(dir,base)`→`(string,bool)`. Reused names verified present: `splitFrontmatter`, `parseFrontmatterField`, `cellText`, `splitRow`, `orDash`, `slugify`, `signValue`, `resolveSbLinks`, `renderStatblockCard`, `renderStatblockPreviewCard`, `sbPreviewDefaults`, `readFrontmatterName`.
- **Open verification for the implementer:** (a) confirm the whole-file reader used by `companionPreviewCard` (grep `internal/site` for the existing reader before adding `os`); (b) match the `.sc-cards--pairs` grid template/breakpoint in `steel-redesign.css` when writing Task 8 CSS; (c) confirm `companionAbilitySections` does not capture the advancement `##` (it won't — `buildCompanionStatblockPage` passes the base region already split at the advancement boundary, but `buildCompanionStatblockIsland` is also called directly in tests on `pantherCompanionBody`, which has no advancement section).
