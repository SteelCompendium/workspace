# Featureblock Fixture Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route Summoner **fixture** statblocks (`type: statblock` + `statblock_kind: fixture`) through the Forged Band featureblock card renderer instead of the creature JSON island, with advancement-tier (`Level N`) grouping, so fixtures render as the loose-stat-header + feature-list cards they actually are.

**Architecture:** Plan 3 of the featureblock-cards effort (spec: `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, phase 3). Fixtures stay `type: statblock`; only their **site rendering** diverts. A new `internal/site/fixture_page.go` adapts the statblock frontmatter + body into the existing `fbDoc` shape and calls `renderFeatureblockCard` (Plan 2). The body's features are parsed by the **already-shared, already-tested** `content.ParseRichFeatures` (icon-keeping, raw `.md` links, advancement-level attachment via `fbLevelLabelRe`) — the same parser that builds featureblock/terrain `features[]`, so feature internals are identical across all three fb content types. The renderer gains leveled-group (`.fb__band--adv`) rendering (backward-compatible: existing fb pages have only `Level: 0` features). **No data-layer, schema, or SCC change** — the fixture grid parse (`applyFixtureGrid`), `statblock_kind`/`role`/`terrain_type` fields, and both schema copies already landed in Plan 1; `FOLLOWUPS.md` #6 is already archived.

**Tech Stack:** Go (steel-etl `internal/site` + `internal/content`), CSS (`v2/docs/stylesheets/steel-featureblock.css`), Playwright/Brave e2e (`v2/tests/e2e`). Toolchain via **devbox** (Go is not on PATH — prefix every Go/just command, e.g. `devbox run -- go test ./...`).

---

## Context: what already exists (do NOT rebuild)

- **Data layer (Plan 1):** `applyFixtureGrid` (`internal/content/monster.go`) already parses the fixture 2-col grid into `stamina`/`size`, lifts the italic role line into `role`/`terrain_type`, and stamps `statblock_kind: fixture`. Both `statblock.schema.json` copies declare these fields. `FOLLOWUPS.md` #6 is **already archived** (`docs/followups-archive/2026-06-12-completed.md`).
- **Shared feature parser (Plan 1):** `content.ParseRichFeatures(body) []RichFeature` (`internal/content/featureparse.go`) parses blockquote features keeping the **icon** and **raw `.md` links**, and attaches `Level` from standalone `**Level N … Advancement Feature**` labels (`fbLevelLabelRe`). `splitOnTitles` (inside `splitBlockquoteBlocks`) separates a bold-only level label from its emoji-titled features even inside one contiguous blockquote, so the label lands as its own block and matches. **Tested** by `TestParseRichFeatures_LevelLabels` (`featureparse_test.go`) with the exact `Level 5`/`Level 9 Fixture Advancement Feature` form.
- **Renderer (Plan 2):** `internal/site/featureblock_page.go` — `renderFeatureblockCard(fbDoc)`, `fbDoc`/`fbFeature`/`fbStat`/`fbSection`/`fbEnh`/`fbPowerRoll` structs, `fbDataRole`, `fbEyebrow`, `fbFeatureAction` (icon→accent fallback via `fbIconAction`), `renderFbStats`, `renderFbFeats`, `fbPowerRollHTML`. Handles `type: featureblock | dynamic-terrain` only.
- **CSS (Plan 2):** `steel-featureblock.css` maps `.fb-wrap[data-role="<role>"]` → `--role` for **every** combat role incl. `defender`/`support`/etc. (lines 16–28), and `--sc-role-*` live in `palette.css`. The advancement band (`.fb__band--adv`/`.fb__adv-head`) is **not yet styled**.
- **Dispatch:** `internal/site/build.go` `buildSection` runs (in order) `buildAbilityCardPage` → `buildStatblockIslandPage` → `buildFeatureblockPage` → `injectH1`. `buildStatblockIslandPage` currently returns `true` for **every** `type: statblock`, so fixtures get the creature island today.

Reference fixture (the canonical test case): `data/data-summoner/en/md-dse-linked/fixture/undead/statblock/barrow-gates.md` — `role: Defender`, `terrain_type: Fortification`, `stamina: 20 + your level`, `size: "2"`; body has 2 base features + a `Level 5` group (Memento Mori) + a `Level 9` group (Size Increase, Open the Gates).

## File structure

- **Create** `steel-etl/internal/site/fixture_page.go` — the statblock→`fbDoc` adapter: `buildFixturePage`, `fixtureStats`, `fbFeaturesFromRich`. One responsibility: adapt a fixture statblock into the shared `fbDoc` and render it. Imports `internal/content` (no cycle — content does not import site).
- **Create** `steel-etl/internal/site/fixture_page_test.go` — adapter + routing tests.
- **Modify** `steel-etl/internal/site/statblock_page.go` — guard `buildStatblockIslandPage` to skip fixtures (~3 lines).
- **Modify** `steel-etl/internal/site/build.go` — dispatch `buildFixturePage` after `buildStatblockIslandPage`.
- **Modify** `steel-etl/internal/site/featureblock_page.go` — `renderFbFeats` gains `.fb__band--adv` leveled grouping; extract per-feature rendering into `renderFbFeat`.
- **Modify** `steel-etl/internal/site/featureblock_page_test.go` (or the existing renderer test file) — leveled-grouping DOM test.
- **Modify** `v2/docs/stylesheets/steel-featureblock.css` — `.fb__band--adv` / `.fb__adv-head` styling (both schemes + print).
- **Modify** `v2/tests/e2e/…` — fixture page renders via fb path.
- **Docs:** `steel-etl/docs/statblocks.md`, `steel-etl/CLAUDE.md`, `DESIGN.md`, memory, `chore: bump steel-etl` + v2 content commit.

---

### Task 1: Fixture→`fbDoc` adapter

**Files:**
- Create: `steel-etl/internal/site/fixture_page.go`
- Test: `steel-etl/internal/site/fixture_page_test.go`

- [ ] **Step 1: Write the failing test**

```go
package site

import "strings"

const fixtureBarrowGates = `---
name: Barrow Gates
role: Defender
size: "2"
stamina: 20 + your level
statblock_kind: fixture
terrain_type: Fortification
type: statblock
---

*Fortification Defender*

| **Stamina:** 20 + your level | **Size:** 2 |
|------------------------------|------------:|

> ⭐️ **The Bell Tolls**
>
> Each enemy that starts their turn within 3 squares is frightened.

> ⭐️ **Undead Dominion**
>
> Each undead minion has damage immunity 2 within 3 squares.

> **Level 5 Fixture Advancement Feature**
>
> ⭐️ **Memento Mori**
>
> You gain a surge the first time a minion dies.

> **Level 9 Fixture Advancement Feature**
>
> ⭐️ **Size Increase**
>
> The gates are now size 3.
>
> ⭐️ **Open the Gates**
>
> You can use Rise! as a free triggered action.
`

func TestBuildFixturePage(t *testing.T) {
	out, ok := buildFixturePage([]byte(fixtureBarrowGates))
	if !ok {
		t.Fatal("buildFixturePage returned ok=false for a fixture")
	}
	got := string(out)
	// frontmatter preserved
	if !strings.Contains(got, "statblock_kind: fixture") {
		t.Error("frontmatter not preserved")
	}
	// Forged Band card, role-keyed
	for _, want := range []string{
		`<div class="fb-wrap" data-role="defender"`,
		"Fortification · Defender", // eyebrow: "Fortification · Defender"
		"Barrow Gates",
		// loose stats from the 2-col grid
		`<div class="fb__stat-l">Stamina</div>`,
		`<div class="fb__stat-l">Size</div>`,
		// base features
		"The Bell Tolls", "Undead Dominion",
		// advancement groups, leveled
		`data-level="5"`, "Memento Mori",
		`data-level="9"`, "Size Increase", "Open the Gates",
	} {
		if !strings.Contains(got, want) {
			t.Errorf("output missing %q", want)
		}
	}
	// the redundant raw italic role line and broken 2-col grid table are gone
	if strings.Contains(got, "*Fortification Defender*") {
		t.Error("raw italic role line leaked into the card body")
	}
}

func TestBuildFixturePage_NonFixturePassesThrough(t *testing.T) {
	// a normal creature statblock must NOT be handled here
	creature := "---\nname: Goblin\ntype: statblock\nrole: Minion\n---\n\nbody\n"
	if _, ok := buildFixturePage([]byte(creature)); ok {
		t.Error("buildFixturePage handled a non-fixture statblock")
	}
	// a featureblock must NOT be handled here
	fb := "---\nname: X\ntype: featureblock\n---\n\nbody\n"
	if _, ok := buildFixturePage([]byte(fb)); ok {
		t.Error("buildFixturePage handled a featureblock")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestBuildFixturePage -v`
Expected: FAIL — `undefined: buildFixturePage`.

- [ ] **Step 3: Write minimal implementation**

Create `steel-etl/internal/site/fixture_page.go`:

```go
package site

// High-Fantasy Steel FIXTURE pages for the Steel Compendium MkDocs site.
//
// Summoner fixtures (The Boil, Barrow Gates, …) are `type: statblock` +
// `statblock_kind: fixture` (stamped by applyFixtureGrid in the data layer,
// Plan 1). In ANATOMY they are featureblocks, not creature statblocks: a loose
// Stamina/Size header + a list of features, several gated behind "Level N
// Fixture Advancement Feature" tiers. So rather than the creature JSON island
// (steel-statblock.js), they route HERE and render as the same `.fb-wrap`
// Forged Band card that featureblocks/terrain use (renderFeatureblockCard),
// via a statblock→fbDoc adapter.
//
// SITE-ONLY: runs inside `steel-etl site` against the generated md-linked pages;
// the shared data repos are never touched. Feature blockquotes are parsed by the
// shared content.ParseRichFeatures (icon-keeping, raw .md links, advancement-
// level attachment) — the SAME parser that builds featureblock/terrain
// features[] frontmatter — so feature internals are identical across the three
// fb content types. The fixture's stamina/size frontmatter (Plan 1's grid parse)
// becomes the loose header stats.
//
// Plan 3 of the featureblock effort; spec
// docs/superpowers/specs/2026-06-12-featureblock-cards-design.md.

import (
	"strings"

	"github.com/SteelCompendium/steel-etl/internal/content"
)

// buildFixturePage rewrites a `type: statblock` + `statblock_kind: fixture` page
// body into the .fb-wrap card. Returns (newData, true) when handled; (data,
// false) otherwise so the caller writes the page unchanged. Frontmatter is
// preserved verbatim; injectH1 (next in buildSection) prepends the "# Name".
func buildFixturePage(data []byte) ([]byte, bool) {
	fm, body := splitFrontmatter(string(data))
	if strings.TrimSpace(parseFrontmatterField(fm, "type")) != "statblock" {
		return data, false
	}
	if strings.TrimSpace(parseFrontmatterField(fm, "statblock_kind")) != "fixture" {
		return data, false
	}
	doc := fbDoc{
		Name:        strings.TrimSpace(parseFrontmatterField(fm, "name")),
		Type:        "statblock",
		Role:        strings.TrimSpace(parseFrontmatterField(fm, "role")),
		TerrainType: strings.TrimSpace(parseFrontmatterField(fm, "terrain_type")),
		Stats:       fixtureStats(fm),
		Features:    fbFeaturesFromRich(content.ParseRichFeatures(body)),
	}
	card := renderFeatureblockCard(doc)
	return []byte("---\n" + fm + "\n---\n\n" + card), true
}

// fixtureStats builds the loose header from the fixture 2-col grid fields
// (Stamina, Size — the only stats applyFixtureGrid emits), in source order,
// omitting any that are empty.
func fixtureStats(fm string) []fbStat {
	var out []fbStat
	if v := strings.TrimSpace(parseFrontmatterField(fm, "stamina")); v != "" {
		out = append(out, fbStat{Name: "Stamina", Value: v})
	}
	if v := strings.TrimSpace(parseFrontmatterField(fm, "size")); v != "" {
		out = append(out, fbStat{Name: "Size", Value: v})
	}
	return out
}

// fbFeaturesFromRich maps the shared content.RichFeature shape onto the site
// renderer's fbFeature. The two are intentionally congruent (spec §2). The icon
// is preserved so a table-less fixture passive (⭐) gets its action accent from
// the emoji (fbFeatureAction) rather than flattening to "passive".
func fbFeaturesFromRich(rfs []content.RichFeature) []fbFeature {
	out := make([]fbFeature, 0, len(rfs))
	for _, r := range rfs {
		f := fbFeature{
			Icon:     r.Icon,
			Name:     r.Name,
			Cost:     r.Cost,
			Usage:    r.Usage,
			Keywords: r.Keywords,
			Distance: r.Distance,
			Target:   r.Target,
			Body:     r.Body,
			Trailing: r.Trailing,
			Level:    r.Level,
		}
		if r.PowerRoll != nil {
			f.PowerRoll = &fbPowerRoll{Formula: r.PowerRoll.Formula, Tiers: r.PowerRoll.Tiers}
		}
		for _, s := range r.Sections {
			f.Sections = append(f.Sections, fbSection{Label: s.Label, Text: s.Text})
		}
		for _, e := range r.Enhancements {
			f.Enhancements = append(f.Enhancements, fbEnh{Cost: e.Cost, Text: e.Text})
		}
		out = append(out, f)
	}
	return out
}
```

> NOTE: this test depends on the `.fb__band--adv data-level="N"` markup from Task 3. If running Task 1 in isolation before Task 3, the `data-level=` assertions will fail — that is expected; Task 3 makes them pass. Subagent-driven execution does Task 1→3 in order, so by Task 3's green step the full `TestBuildFixturePage` passes. (Until Task 3, the features still render — just flat, without the band wrapper.)

- [ ] **Step 4: Run test to verify the non-band assertions pass**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestBuildFixturePage_NonFixture -v`
Expected: PASS. (Full `TestBuildFixturePage` goes green after Task 3.)

- [ ] **Step 5: Commit**

```bash
cd steel-etl
git add internal/site/fixture_page.go internal/site/fixture_page_test.go
git commit -m "feat: fixture statblock → featureblock-card adapter"
```

---

### Task 2: Route fixtures away from the creature island

**Files:**
- Modify: `steel-etl/internal/site/statblock_page.go` (`buildStatblockIslandPage`, ~line 118)
- Modify: `steel-etl/internal/site/build.go` (`buildSection`, ~line 255)
- Test: `steel-etl/internal/site/fixture_page_test.go` (add)

- [ ] **Step 1: Write the failing test** (append to `fixture_page_test.go`)

```go
func TestStatblockIslandSkipsFixture(t *testing.T) {
	// fixtures must fall through the island path so buildFixturePage handles them
	if _, ok := buildStatblockIslandPage([]byte(fixtureBarrowGates)); ok {
		t.Error("buildStatblockIslandPage handled a fixture (should skip it)")
	}
	// a normal creature statblock is still handled by the island
	creature := "---\nname: Goblin\ntype: statblock\nrole: Minion\n---\n\n> ⭐️ **Bite**\n>\n> bites.\n"
	if _, ok := buildStatblockIslandPage([]byte(creature)); !ok {
		t.Error("buildStatblockIslandPage skipped a normal creature statblock")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestStatblockIslandSkipsFixture -v`
Expected: FAIL — the fixture is currently handled by the island (`ok=true`).

- [ ] **Step 3: Add the fixture guard to `buildStatblockIslandPage`**

In `statblock_page.go`, after the `type != "statblock"` early return:

```go
func buildStatblockIslandPage(data []byte) ([]byte, bool) {
	fm, body := splitFrontmatter(string(data))
	if strings.TrimSpace(parseFrontmatterField(fm, "type")) != "statblock" {
		return data, false
	}
	// Fixtures are statblocks in `type` only; they render as Forged Band
	// featureblock cards (buildFixturePage), not the creature JSON island.
	if strings.TrimSpace(parseFrontmatterField(fm, "statblock_kind")) == "fixture" {
		return data, false
	}
	js, err := json.Marshal(buildStatblockIsland(fm, body))
	// … unchanged …
```

- [ ] **Step 4: Dispatch `buildFixturePage` in `buildSection`**

In `build.go`, immediately after the `buildStatblockIslandPage` block (~line 255, before the featureblock block):

```go
		// Fixture statblocks → the Forged Band featureblock card (statblock→fbDoc
		// adapter), not the creature JSON island. Site-only; runs before injectH1
		// like the cards above. The island path above skips fixtures.
		if card, ok := buildFixturePage(data); ok {
			data = card
		}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestStatblockIslandSkipsFixture|TestBuildFixturePage_NonFixture' -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd steel-etl
git add internal/site/statblock_page.go internal/site/build.go internal/site/fixture_page_test.go
git commit -m "feat: dispatch fixture statblocks to the featureblock renderer"
```

---

### Task 3: Advancement-band (`.fb__band--adv`) rendering

**Files:**
- Modify: `steel-etl/internal/site/featureblock_page.go` (`renderFbFeats`, extract `renderFbFeat`)
- Test: `steel-etl/internal/site/featureblock_page_test.go` (add; create the file if the Plan-2 renderer test lives elsewhere — confirm with `ls internal/site/*_test.go`)

- [ ] **Step 1: Write the failing test**

```go
func TestRenderFbFeats_AdvancementBands(t *testing.T) {
	feats := []fbFeature{
		{Icon: "⭐️", Name: "Base One", Body: "always on"},
		{Icon: "⭐️", Name: "Base Two", Body: "also on"},
		{Icon: "⭐️", Name: "Tier Five", Body: "at L5", Level: 5},
		{Icon: "⭐️", Name: "Tier Nine A", Body: "at L9", Level: 9},
		{Icon: "⭐️", Name: "Tier Nine B", Body: "also L9", Level: 9},
	}
	got := renderFbFeats(feats)
	// base features are NOT in a band
	idxBase := strings.Index(got, "Base One")
	idxBand := strings.Index(got, `class="fb__band--adv"`)
	if idxBase == -1 || idxBand == -1 || idxBase > idxBand {
		t.Fatalf("base features must render before the first advancement band")
	}
	for _, want := range []string{
		`<div class="fb__band--adv" data-level="5">`,
		`<div class="fb__adv-head">Level 5 Advancement</div>`,
		"Tier Five",
		`<div class="fb__band--adv" data-level="9">`,
		`<div class="fb__adv-head">Level 9 Advancement</div>`,
		"Tier Nine A", "Tier Nine B",
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q", want)
		}
	}
	// exactly two bands (one per level)
	if n := strings.Count(got, `class="fb__band--adv"`); n != 2 {
		t.Errorf("band count = %d, want 2", n)
	}
}

func TestRenderFbFeats_NoLevelsNoBands(t *testing.T) {
	// backward-compat: existing featureblock/terrain features (Level 0) → no band
	got := renderFbFeats([]fbFeature{{Icon: "⭐️", Name: "Flat", Body: "x"}})
	if strings.Contains(got, "fb__band--adv") {
		t.Error("Level-0 features must not emit an advancement band")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run TestRenderFbFeats_Advancement -v`
Expected: FAIL — no `fb__band--adv` markup yet.

- [ ] **Step 3: Refactor `renderFbFeats` and extract `renderFbFeat`**

Replace the existing `renderFbFeats` in `featureblock_page.go` with a version that opens/closes a band when `Level` changes to a new `>0` value. Move the per-feature body (the whole inner loop) verbatim into `renderFbFeat(b *strings.Builder, f fbFeature)`.

```go
// renderFbFeats renders the feature list. Features with Level == 0 render in the
// main flow; a contiguous run sharing a Level > 0 wraps in a .fb__band--adv with
// a "Level N Advancement" sub-head (fixture/retainer advancement tiers, spec §3).
// Fixture/featureblock data is document-ordered (base features first, then
// ascending advancement groups), so a single-pass state machine groups them.
func renderFbFeats(feats []fbFeature) string {
	if len(feats) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString("<div class=\"fb__feats\">\n")
	curLevel, bandOpen := 0, false
	for _, f := range feats {
		if f.Level != curLevel {
			if bandOpen {
				b.WriteString("</div>\n") // close previous .fb__band--adv
				bandOpen = false
			}
			curLevel = f.Level
			if curLevel > 0 {
				fmt.Fprintf(&b, "<div class=\"fb__band--adv\" data-level=\"%d\">\n", curLevel)
				fmt.Fprintf(&b, "<div class=\"fb__adv-head\">Level %d Advancement</div>\n", curLevel)
				bandOpen = true
			}
		}
		renderFbFeat(&b, f)
	}
	if bandOpen {
		b.WriteString("</div>\n")
	}
	b.WriteString("</div>\n")
	return b.String()
}

// renderFbFeat writes one feature: article.sc-ability.fb__feat with the one-line
// head (icon · name · cost), reused ability-card internals (kw / rail / power
// roll / sections / enhancements), and the table-less body / trailing note.
func renderFbFeat(b *strings.Builder, f fbFeature) {
	fmt.Fprintf(b, "<article class=\"sc-ability fb__feat\" data-action=\"%s\">\n", fbFeatureAction(f))

	// head: icon · name · cost
	b.WriteString("<div class=\"fb__feat-head\">")
	if ic := strings.TrimSpace(f.Icon); ic != "" {
		fmt.Fprintf(b, "<span class=\"fb__feat-icon\">%s</span>", html.EscapeString(ic))
	}
	fmt.Fprintf(b, "<h3 class=\"fb__feat-name sc-ability__name\">%s</h3>", html.EscapeString(strings.TrimSpace(f.Name)))
	fmt.Fprintf(b, "<div class=\"fb__feat-corner\">%s</div>", costBadge(strings.TrimSpace(f.Cost)))
	b.WriteString("</div>\n")

	// keyword chips
	if len(f.Keywords) > 0 {
		b.WriteString("<div class=\"sc-ability__kw\">")
		for _, k := range f.Keywords {
			fmt.Fprintf(b, "<span class=\"sc-ability__chip\">%s</span>", richInline(strings.TrimSpace(k)))
		}
		b.WriteString("</div>\n")
	}

	// distance / target rail
	if strings.TrimSpace(f.Distance) != "" || strings.TrimSpace(f.Target) != "" {
		b.WriteString("<div class=\"sc-ability__rail\">")
		fmt.Fprintf(b, "<div class=\"sc-ability__cell\"><div class=\"l\">Distance</div><div class=\"v\">%s</div></div>", railValue(f.Distance))
		fmt.Fprintf(b, "<div class=\"sc-ability__cell\"><div class=\"l\">Targets</div><div class=\"v\">%s</div></div>", railValue(f.Target))
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
			fmt.Fprintf(b, "<div class=\"sc-ability__section-head\"><span class=\"sc-ability__dia\"></span><span class=\"tag\">%s</span></div>", html.EscapeString(l))
		}
		fmt.Fprintf(b, "<div class=\"sc-ability__section-body\">%s</div>", renderSectionBlock(strings.TrimSpace(s.Text)))
		b.WriteString("</div>\n")
	}

	// cost enhancements (2 Malice / Spend …)
	for _, e := range f.Enhancements {
		fmt.Fprintf(b, "<div class=\"sc-ability__enh\"><span class=\"cost\">%s</span><span class=\"txt\">%s</span></div>\n",
			html.EscapeString(strings.TrimSpace(e.Cost)), richInline(strings.TrimSpace(e.Text)))
	}

	// table-less prose body / post-table trailing note
	if body := strings.TrimSpace(f.Body); body != "" {
		fmt.Fprintf(b, "<div class=\"fb__feat-body\">%s</div>\n", richInline(body))
	}
	if tr := strings.TrimSpace(f.Trailing); tr != "" {
		fmt.Fprintf(b, "<div class=\"fb__feat-trailing\">%s</div>\n", richInline(tr))
	}

	b.WriteString("</article>\n")
}
```

> The `renderFbFeat` body is the existing `renderFbFeats` inner loop moved verbatim (only the receiver changed from the local `b` to the passed `*strings.Builder`). Do not change the markup — only relocate it, so featureblock/terrain output is byte-identical for `Level: 0` features.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestRenderFbFeats|TestBuildFixturePage' -v`
Expected: PASS (full `TestBuildFixturePage` now green, incl. `data-level=` assertions).

- [ ] **Step 5: Full package test (no regressions)**

Run: `cd steel-etl && devbox run -- go test ./internal/site/ -v`
Expected: PASS — existing featureblock/terrain renderer tests unchanged (Level-0 features emit no band).

- [ ] **Step 6: Commit**

```bash
cd steel-etl
git add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git commit -m "feat: featureblock renderer groups leveled features into advancement bands"
```

---

### Task 4: CSS — advancement band styling

**Files:**
- Modify: `v2/docs/stylesheets/steel-featureblock.css`

- [ ] **Step 1: Add the band styles**

Append (near the feature-style rules, after the `.fb__feats` block). The band is a flex column matching the `.fb__feats` gap; the sub-head is a small role-tinted uppercase label; a hairline top border separates it from the base features. Verify it works in **both** `data-fb-featstyle="card"` and `"flat"` and **both** color schemes when you build (Task 5/6).

```css
/* ── advancement bands: fixture / retainer "Level N" feature groups ──
   A contiguous run of features sharing a Level > 0, grouped under a small
   role-tinted sub-head. The band is a flex column so its features keep the
   same vertical rhythm as the main .fb__feats list. */
.fb__band--adv {
  display: flex;
  flex-direction: column;
  gap: var(--fb-feat-gap, .55rem);
  margin-top: .85rem;
  padding-top: .55rem;
  border-top: 1px solid color-mix(in srgb, var(--role) 30%, transparent);
}
.fb__adv-head {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  font-size: .72rem;
  color: var(--role);
  margin-bottom: .1rem;
}
@media print {
  .fb__band--adv { break-inside: avoid; border-top-color: rgba(0, 0, 0, .35); }
}
```

> If `--fb-feat-gap` is not the variable Plan 2 used for the `.fb__feats` gap, open `steel-featureblock.css`, find the `.fb__feats { … gap: … }` rule, and reuse that exact value/var so the band's internal spacing matches the main list. In `flat` mode (`gap: 0` + diamond separators), confirm the band's first feature reads correctly under the sub-head — the top border + sub-head already delimit the group, so the missing leading separator is fine.

- [ ] **Step 2: Commit** (deferred — committed with the rebuilt site in Task 5, since CSS lands in the v2 repo alongside regenerated content). Note the file for Task 5.

---

### Task 5: Build, regenerate site, SCC stability

**Files:** none (build + verification)

- [ ] **Step 1: Build steel-etl**

Run: `cd steel-etl && devbox run -- go build ./...`
Expected: clean build.

- [ ] **Step 2: Full Go test suite with race**

Run: `cd steel-etl && devbox run -- go test -race ./...`
Expected: PASS.

- [ ] **Step 3: SCC stability (no data/registry change expected)**

Run:
```bash
cd steel-etl
devbox run -- go run ./cmd/steel-etl validate --scc-stable --config pipeline.yaml
devbox run -- go run ./cmd/steel-etl classify --diff --config pipeline.yaml
```
Expected: `--scc-stable` green; `--diff` empty. (Plan 3 is site-rendering only — no codes minted or changed.)

- [ ] **Step 4: Regenerate the Summoner data + rebuild the site**

The fixtures live in the Summoner book. Use the deploy path that passes `--all` (a bare `gen` skips secondary books — see steel-etl `CLAUDE.md`). From the workspace root:
```bash
devbox run -- just deploy-v2
```
(or, lower-level: `devbox run -- go run ./cmd/steel-etl gen --all --config steel-etl/pipeline.yaml` then `devbox run -- go run ./cmd/steel-etl site --config v2/site.yaml`, then `devbox run -- mkdocs build` per the v2 build-command memory.)

- [ ] **Step 5: Verify a fixture page rendered as a card, not an island**

Run:
```bash
grep -l 'class="fb-wrap"' v2/docs/Browse/fixture/undead/barrow-gates.md
grep -c 'sc-statblock-data' v2/docs/Browse/fixture/undead/barrow-gates.md   # expect 0
grep -o 'data-level="[0-9]*"' v2/docs/Browse/fixture/undead/barrow-gates.md  # expect 5 and 9
```
Expected: the page contains `.fb-wrap` and `data-level="5"`/`"9"`, and **no** `sc-statblock-data` island. Spot-check 1–2 more fixtures (`the-boil.md`, `glade-pond.md`, `primordial-crystal.md`).

- [ ] **Step 6: Commit the CSS + regenerated site (v2 repo)**

```bash
cd v2
git add docs/stylesheets/steel-featureblock.css docs/Browse/fixture
git add -A docs   # pick up any other regenerated pages
git commit -m "feat: fixtures render as Forged Band cards; advancement-band CSS"
```

---

### Task 6: e2e — fixture renders via the fb path

**Files:**
- Modify: `v2/tests/e2e/…` (find the Plan-2 featureblock e2e spec: `ls v2/tests/e2e` and grep for `fb-wrap` / `data-fb`)

- [ ] **Step 1: Add a fixture assertion to the featureblock e2e**

Mirror the Plan-2 featureblock/terrain e2e (Brave via playwright-core — see the `reference_playwright_mcp_broken` memory: use `executablePath: /opt/brave.com/brave/brave`). Navigate to a built fixture page (e.g. `/Browse/fixture/undead/barrow-gates/`) and assert:
- `.fb-wrap[data-role="defender"]` exists; **no** `.sc-statblock-mount` island.
- the band: `.fb__band--adv[data-level="5"]` and `[data-level="9"]` exist, each with a `.fb__adv-head`.
- the band's `--role`-derived sub-head color resolves (assert a **computed** style, not just the attribute — the 2026-06-11 regression class: `getComputedStyle(advHead).color` is non-empty / not the default text color).
- flipping `data-fb-featstyle` / `data-fb-stats` via the drawer visibly reflows the fixture card (reuse the Plan-2 helper).

Follow the exact structure of the existing featureblock spec; do not invent a new harness.

- [ ] **Step 2: Run the e2e**

Run: `cd v2 && node --test tests/e2e/<fixture-or-featureblock-spec>.mjs` (match how Plan 2's e2e is invoked — check `v2/tests/e2e` for the runner/command).
Expected: PASS against the built site.

- [ ] **Step 3: Commit**

```bash
cd v2
git add tests/e2e
git commit -m "test: e2e fixture page renders via the featureblock card path"
```

---

### Task 7: Docs + bookkeeping

**Files:** `steel-etl/docs/statblocks.md`, `steel-etl/CLAUDE.md`, workspace `DESIGN.md`, memory file, submodule pointer.

- [ ] **Step 1: `steel-etl/docs/statblocks.md`** — add a short "Fixture routing" note: fixtures (`statblock_kind: fixture`) are diverted from the creature JSON island to the Forged Band featureblock card at build time via `internal/site/fixture_page.go`, which adapts the statblock frontmatter (stamina/size → loose stats; role/terrain_type → eyebrow) and parses body features with the shared `content.ParseRichFeatures` (advancement `Level N` tiers → `.fb__band--adv` groups). Cross-reference `internal/site/featureblock_page.go`.

- [ ] **Step 2: `steel-etl/CLAUDE.md`** — in the Statblocks section, update the Plan-2 pointer line: fixture routing (Plan 3) shipped; Plans 4–5 (retainer split, companion advancement) remain. Keep it to current-state + pointer (no dated history — that rule is in the file).

- [ ] **Step 3: workspace `DESIGN.md`** — if the Featureblock cards row documents the card internals, add the advancement band (`.fb__band--adv` / `.fb__adv-head`, role-tinted "Level N Advancement" sub-head) and note fixtures now render through the fb card. If DESIGN.md only points at the spec, no change needed — verify with `grep -n -i 'featureblock\|fb__band\|fixture' DESIGN.md`.

- [ ] **Step 4: `FOLLOWUPS.md` #6** — **no action**: already archived during Plan 1 (`docs/followups-archive/2026-06-12-completed.md`, "was FOLLOWUPS #6"). The spec's "archives #6" line was satisfied by the data-layer parse. Confirm with `grep -n 'was FOLLOWUPS #6' docs/followups-archive/2026-06-12-completed.md` and do not re-archive.

- [ ] **Step 5: Update memory** — edit `/home/vexa/.claude/projects/-home-vexa-code-steel-compendium-workspace/memory/project_featureblock_cards.md`: mark Plan 3 (fixture routing) shipped — `fixture_page.go` adapter, statblock-island fixture guard, `.fb__band--adv` advancement-band rendering + CSS, e2e; note Plan 3 reused `content.ParseRichFeatures` (no data/schema/SCC change; #6 already archived in Plan 1). Update the `description:` line and the "Still TODO" list to Plans 4–5 (retainer split, companion cards). Keep the `MEMORY.md` one-liner in sync if its hook changed.

- [ ] **Step 6: Bump the steel-etl submodule pointer + commit docs (workspace repo)**

```bash
cd /home/vexa/code/steel_compendium/workspace
git add steel-etl v2 DESIGN.md docs/superpowers/plans/2026-06-13-featureblock-fixture-routing.md
git commit -m "chore: bump steel-etl + v2 (featureblock fixture routing, Plan 3)"
```
> The steel-etl pointer is currently behind by the Plan-2 commits too; this bump moves it to the Plan-3 HEAD, which includes both. Commit the steel-etl doc edits (statblocks.md, CLAUDE.md) inside the submodule before bumping the pointer.

---

## Self-Review notes (spec coverage)

- **Spec §3 "type: statblock + statblock_kind: fixture → featureblock renderer instead of the statblock JSON island"** → Tasks 1 (adapter) + 2 (island guard + dispatch).
- **Spec §3 / §178–179 ".fb__band--adv (fixture/retainer advancement)" + "features with level group under small leveled sub-heads"** → Task 3 (renderer) + Task 4 (CSS). Reused by Plan 4 (retainers).
- **Spec §80–88 StatblockParser fixture handling (grid, role, terrain_type, statblock_kind) + §89 advancement level: 5** → **already shipped in Plan 1** (`applyFixtureGrid` + `content.ParseRichFeatures` `fbLevelLabelRe`); this plan consumes it, does not reimplement it.
- **Spec §6 testing (parser fixture grid / loose stats ordering / rich features; renderer DOM string-contains; SCC stable; e2e fixture page renders via fb path)** → parser already tested (`TestParseRichFeatures_LevelLabels`); renderer/adapter Tasks 1+3; SCC Task 5 step 3; e2e Task 6.
- **Spec §7 phase 3 "Fixture routing (archives FOLLOWUPS #6)"** → routing in Tasks 1–2; #6 archival already done (Plan 1), noted in Task 7 step 4.
- **Spec §8 docs** → Task 7 (statblocks.md, CLAUDE.md, DESIGN.md, memory). No `scc-log.md` entry (no SCC change), per §8.
- **Out of scope (correctly absent):** retainer split (Plan 4), companion advancement (Plan 5), statblock malice band (#7), schema edits (none needed — fixtures stay `type: statblock`, fields already in `statblock.schema.json`).

**Type consistency check:** `fbDoc`/`fbFeature`/`fbStat`/`fbSection`/`fbEnh`/`fbPowerRoll` are the Plan-2 struct names (verified in `featureblock_page.go`). `content.RichFeature`/`RichPowerRoll`/`RichSection`/`RichEnhancement` and `content.ParseRichFeatures` are the Plan-1 names (verified in `featureparse.go`). `splitFrontmatter`/`parseFrontmatterField`/`renderFeatureblockCard`/`fbFeatureAction`/`costBadge`/`richInline`/`railValue`/`renderSectionBlock`/`fbPowerRollHTML` all exist in `internal/site`. Import path `github.com/SteelCompendium/steel-etl/internal/content` (verified in go.mod + internal/pipeline).

## Execution Handoff

Subagent-driven (chosen): dispatch a fresh subagent per task, review between tasks. Tasks 1→2→3 are sequential (3 makes 1's full test green); 4 depends on 3's DOM; 5 depends on 1–4; 6 depends on 5's built site; 7 last.
