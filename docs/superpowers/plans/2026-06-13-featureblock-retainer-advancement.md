# Featureblock Retainer Advancement Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split retainer statblock bodies at their `Level N Retainer Advancement Ability` headings so the advancement abilities are **excluded** from the creature JSON island (today they pollute its feature list) and re-emitted as a single Forged Band advancement card — with leveled `.fb__band--adv` tiers — appended below the statblock.

**Architecture:** Plan 4 of the featureblock-cards effort (spec: `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, phase 4). **Site-side only** — no parser, schema, or SCC change (the spec marks retainer advancement "explicitly untouched" at the data layer). A new `internal/site/retainer_page.go` splits the body, parses each advancement group's blockquote(s) with the already-shared, already-tested `content.ParseRichFeatures` (same parser used by featureblock/terrain/fixture cards), stamps the heading's level onto each feature, and renders one `fbDoc` through the existing `renderFeatureblockCard` (Plan 2) — whose `renderFbFeats` already groups `Level > 0` features into `.fb__band--adv` tiers (Plan 3, already CSS-styled). `buildStatblockIslandPage` is changed in ~4 lines: build the island from the pre-advancement base body, then append the advancement card. The split is **self-gating** — only the 21 retainer statblocks carry `Level N Retainer Advancement Ability` headings, so every other `type: statblock` page is a no-op.

**Tech Stack:** Go (steel-etl `internal/site` + `internal/content`), table-driven Go tests. Toolchain via **devbox** — Go is not on PATH, so prefix every Go command, e.g. `devbox run -- go test ./...`. Run from `steel-etl/` (the Go module root).

---

## Context: what already exists (do NOT rebuild)

- **Shared feature parser (Plan 1):** `content.ParseRichFeatures(body string) []content.RichFeature` (`internal/content/featureparse.go`) parses blockquote features keeping the **icon** and **raw `.md` links**, with full `Sections`/`Enhancements`/`PowerRoll`/`Body`/`Trailing`. It attaches `Level` only from a standalone **bold** `**Level N … Advancement Feature**` label (`fbLevelLabelRe`) — retainer advancement uses H6 **headings** instead, so this plan stamps the level itself after parsing (see Task 3).
- **Renderer (Plan 2):** `internal/site/featureblock_page.go` — `renderFeatureblockCard(doc fbDoc) string`, structs `fbDoc`/`fbFeature`/`fbStat`/`fbSection`/`fbEnh`/`fbPowerRoll`, `fbDataRole`, `fbEyebrow`. The head is eyebrow + name; `fbDataRole(doc)` lowercases `doc.Role` for the `data-role` accent.
- **Leveled grouping (Plan 3):** `renderFbFeats` wraps each contiguous run of features sharing a `Level > 0` in `<div class="fb__band--adv" data-level="N"><div class="fb__adv-head">Level N Advancement</div>…</div>`. `Level == 0` features render in the main flow. **Already CSS-styled** (`v2/docs/stylesheets/steel-featureblock.css` lines 181–198) — no CSS work in this plan.
- **rich→site adapter (Plan 3):** `fbFeaturesFromRich(rfs []content.RichFeature) []fbFeature` (`internal/site/fixture_page.go`) maps `RichFeature` onto `fbFeature` field-for-field, **including `Level`**. Reuse it verbatim.
- **Statblock island (today):** `buildStatblockIslandPage(data []byte) ([]byte, bool)` (`internal/site/statblock_page.go:118`) → `buildStatblockIsland(fm, body)` → `parseStatblockIslandFeatures(body)` → `sbBlocks(body)`, which slurps **every** blockquote in the body into the island feature list. For retainers that includes the advancement abilities — the "pollution" this plan removes. The island reads all stats/characteristics from **frontmatter**, never the body table, so feeding it a truncated body is safe.
- **`knownRoleKeys`** (`internal/site/statblock_page.go`) — the set of `data-role` values the CSS colors (`ambusher`, `harrier`, `artillery`, `brute`, `controller`, `leader`, `solo`, `hexer`, `mount`, `support`, `defender`, `minion`). Same package — reuse directly.
- **Dispatch:** `internal/site/build.go` `buildSection` runs `buildAbilityCardPage` → `buildStatblockIslandPage` → `buildFixturePage` → `buildFeatureblockPage` → `injectH1`. **No dispatch change** — the retainer card is emitted from *inside* `buildStatblockIslandPage`, so it appears after the island mount with no new dispatch hook. `injectH1` then prepends the `# Name` H1 above both (CSS hides it once `.sb-wrap` mounts).

### Ground truth — the retainer body shape (verbatim, Goblin Guide)

Generated page `data/data-md-dse-linked/Bestiary/Retainers/Statblocks/Goblin Guide.md` (frontmatter omitted):

```markdown
###### Goblin Guide

|  Goblin, Humanoid   | ... stat table ... |

> 🗡 **Stabbity Stab (Signature Ability)**
> ...

> ⭐️ **Crafty**
>
> The guide doesn't provoke opportunity attacks by moving.

###### Level 4 Retainer Advancement Ability

> 🗡 **Weaving Knives (Encounter)**
> ...

###### Level 7 Retainer Advancement Ability

> 🗡 **Sneak and Stab (Encounter)**
> ...

###### Level 10 Retainer Advancement Ability

> 🗡 **...**
> ...
```

Facts that pin the design (confirmed against generated output, 2026-06-13):
- The advancement separator is an **H6 markdown heading** `###### Level N Retainer Advancement Ability` — 112 occurrences across exactly **21** retainer statblock pages, and **no non-retainer statblock** carries it (self-gating). Match `#{1,6}` defensively in case a future demotion changes the depth.
- Retainers carry `roles:` (a YAML **list**, e.g. `roles: [Harrier Retainer]`), not a singular `role:`. The role key for the accent is the first word of the first list entry (`Harrier Retainer` → `harrier`), snapped against `knownRoleKeys`.
- The chapter's separate **"Role Advancement Abilities"** pages use `Level N Role Advancement Ability` (note: *Role*, not *Retainer*) and are **not** `type: statblock`. The regex matches `Retainer` specifically, so they are doubly unaffected.

## File structure

- **Create** `steel-etl/internal/site/retainer_page.go` — the retainer advancement split + card renderer. Responsibilities: `splitRetainerAdvancement` (body → base + ordered groups), `retainerRoleKey` (frontmatter `roles[0]` → snapped accent key), `renderRetainerAdvancement` (groups → one Forged Band card, or `""`). Imports `internal/content` (no cycle — content does not import site, same as `fixture_page.go`).
- **Create** `steel-etl/internal/site/retainer_page_test.go` — split + role-key + renderer + empty-case + integration tests.
- **Modify** `steel-etl/internal/site/featureblock_page.go` — add an `Eyebrow string` override field to `fbDoc` and an early return in `fbEyebrow`; one new struct field + two lines. Backward compatible (existing callers leave it empty).
- **Modify** `steel-etl/internal/site/featureblock_page_test.go` — one test for the eyebrow override.
- **Modify** `steel-etl/internal/site/statblock_page.go` — `buildStatblockIslandPage` splits the body, builds the island from the base, and appends the advancement card (~4 lines).

**Repo & branch:** All changes are in `steel-etl/`. Before Task 1:

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git checkout -b feat/featureblock-retainer-advancement
```

The workspace-repo `steel-etl` pointer bump happens at deploy time, not in this plan.

---

## Task 1: Split the retainer body at advancement headings

**Files:**
- Create: `steel-etl/internal/site/retainer_page.go`
- Test: `steel-etl/internal/site/retainer_page_test.go`

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/retainer_page_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

// A trimmed but verbatim slice of the generated Goblin Guide body: two base
// features (one tabled ability, one passive) then two advancement tiers.
const goblinGuideBody = `###### Goblin Guide

| Goblin, Humanoid | Level 1 | Harrier Retainer |

> 🗡 **Stabbity Stab (Signature Ability)**
>
> **Effect:** The target can't make opportunity attacks until the end of the guide's turn.

> ⭐️ **Crafty**
>
> The guide doesn't provoke opportunity attacks by moving.

###### Level 4 Retainer Advancement Ability

> 🗡 **Weaving Knives (Encounter)**
>
> **Effect:** The guide shifts up to their speed before and after the strike.

###### Level 7 Retainer Advancement Ability

> 🗡 **Sneak and Stab (Encounter)**
>
> **Effect:** If the guide is hidden from the target, this ability has a double edge.`

func TestSplitRetainerAdvancement(t *testing.T) {
	base, groups := splitRetainerAdvancement(goblinGuideBody)

	if want := "⭐️ **Crafty**"; !strings.Contains(base, want) {
		t.Errorf("base should keep the base passive %q", want)
	}
	if dont := "Weaving Knives"; strings.Contains(base, dont) {
		t.Errorf("base must NOT contain advancement ability %q", dont)
	}
	if len(groups) != 2 {
		t.Fatalf("want 2 advancement groups, got %d", len(groups))
	}
	if groups[0].Level != 4 || groups[1].Level != 7 {
		t.Errorf("want levels [4 7], got [%d %d]", groups[0].Level, groups[1].Level)
	}
	if !strings.Contains(groups[0].Body, "Weaving Knives") {
		t.Errorf("group 0 body missing its ability: %q", groups[0].Body)
	}
	if strings.Contains(groups[0].Body, "Sneak and Stab") {
		t.Errorf("group 0 body leaked the level-7 ability")
	}
	// The heading itself must not survive into the group body.
	if strings.Contains(groups[0].Body, "Retainer Advancement Ability") {
		t.Errorf("group body should not include the heading line")
	}
}

func TestSplitRetainerAdvancement_NoHeadings(t *testing.T) {
	body := "> 🗡 **Just A Monster**\n>\n> **Effect:** nothing special."
	base, groups := splitRetainerAdvancement(body)
	if base != body {
		t.Errorf("base should be the whole body unchanged, got %q", base)
	}
	if groups != nil {
		t.Errorf("non-retainer statblock should yield no groups, got %v", groups)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/site/ -run TestSplitRetainerAdvancement -v`
Expected: FAIL — `undefined: splitRetainerAdvancement`.

- [ ] **Step 3: Write the minimal implementation**

Create `steel-etl/internal/site/retainer_page.go`. Confirm the `content` import path first: copy the exact `internal/content` import line from `steel-etl/internal/site/fixture_page.go` (run `grep -n 'internal/content' internal/site/fixture_page.go`) and use it verbatim below in place of the placeholder path. `content` is unused until Task 3 — if `go build` flags it as unused at this step, omit the `content` import line now and add it in Task 3.

```go
package site

// High-Fantasy Steel RETAINER advancement cards for the Steel Compendium site.
//
// Retainer statblocks (Goblin Guide, Minotaur Gorer, …) are `type: statblock`,
// but their bodies append advancement abilities under H6 headings
// "###### Level N Retainer Advancement Ability". Those blockquotes used to be
// slurped into the creature JSON island's flat feature list (polluting it). We
// split them out here: the island is built from the pre-advancement BASE body,
// and the advancement abilities re-emit as one Forged Band card with leveled
// .fb__band--adv tiers below the statblock (spec §3, Plan 4). Site-side only —
// no parser/schema/SCC change.

import (
	"regexp"
	"strconv"
	"strings"

	"github.com/steel-compendium/steel-etl/internal/content" // ← replace with the exact path from fixture_page.go
)

// retainerAdvHeadingRe matches the advancement separator headings. #{1,6} is
// defensive against a future heading-depth change; "Retainer" (not "Role")
// keeps the chapter's separate Role Advancement pages untouched.
var retainerAdvHeadingRe = regexp.MustCompile(
	`(?im)^#{1,6}[ \t]+Level[ \t]+(\d+)[ \t]+Retainer[ \t]+Advancement[ \t]+Ability[ \t]*$`)

// retainerAdvGroup is one advancement tier: its level plus the blockquote body
// that follows its heading (up to the next heading or end of body).
type retainerAdvGroup struct {
	Level int
	Body  string
}

// splitRetainerAdvancement splits a statblock body into the pre-advancement
// base (fed to the island unchanged) and the ordered advancement groups.
// Returns (body, nil) when there are no advancement headings, so every
// non-retainer statblock is a no-op.
func splitRetainerAdvancement(body string) (string, []retainerAdvGroup) {
	locs := retainerAdvHeadingRe.FindAllStringSubmatchIndex(body, -1)
	if len(locs) == 0 {
		return body, nil
	}
	base := strings.TrimRight(body[:locs[0][0]], "\n")
	groups := make([]retainerAdvGroup, 0, len(locs))
	for i, loc := range locs {
		level, _ := strconv.Atoi(body[loc[2]:loc[3]]) // capture group 1 = the number
		start := loc[1]                               // end of the heading match
		end := len(body)
		if i+1 < len(locs) {
			end = locs[i+1][0]
		}
		groups = append(groups, retainerAdvGroup{
			Level: level,
			Body:  strings.TrimSpace(body[start:end]),
		})
	}
	return base, groups
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/site/ -run TestSplitRetainerAdvancement -v`
Expected: PASS (both `TestSplitRetainerAdvancement` and `_NoHeadings`).

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/retainer_page.go internal/site/retainer_page_test.go
git commit -m "feat(site): split retainer body at advancement headings"
```

---

## Task 2: Add the `fbDoc.Eyebrow` override

The retainer advancement card needs the eyebrow to read its role line ("Harrier Retainer"), but `fbEyebrow` only composes eyebrows for terrain/fixtures/malice. Add a synthetic override field.

**Files:**
- Modify: `steel-etl/internal/site/featureblock_page.go` (the `fbDoc` struct + `fbEyebrow`)
- Test: `steel-etl/internal/site/featureblock_page_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/site/featureblock_page_test.go`:

```go
func TestFbEyebrow_Override(t *testing.T) {
	// An explicit Eyebrow wins over the terrain/kind/default composition.
	if got := fbEyebrow(fbDoc{Eyebrow: "Harrier Retainer", Kind: "malice"}); got != "Harrier Retainer" {
		t.Errorf("override should win, got %q", got)
	}
	// Empty Eyebrow falls through to existing behavior (malice → "Malice Features").
	if got := fbEyebrow(fbDoc{Kind: "malice"}); got != "Malice Features" {
		t.Errorf("empty override should fall through, got %q", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/site/ -run TestFbEyebrow_Override -v`
Expected: FAIL — `unknown field 'Eyebrow' in struct literal of type fbDoc`.

- [ ] **Step 3: Write the minimal implementation**

In `steel-etl/internal/site/featureblock_page.go`, add the `Eyebrow` field to the `fbDoc` struct (tag it `yaml:"-"` so the Plan 2 `yaml.Unmarshal` in `buildFeatureblockPage` never populates it from frontmatter):

```go
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
	Eyebrow     string      `yaml:"-"` // synthetic override (retainer advancement); not from frontmatter
}
```

Add the early return at the top of `fbEyebrow`:

```go
func fbEyebrow(doc fbDoc) string {
	if e := strings.TrimSpace(doc.Eyebrow); e != "" {
		return e
	}
	if doc.TerrainType != "" {
		// ... existing body unchanged ...
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/site/ -run TestFbEyebrow_Override -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git commit -m "feat(site): add fbDoc.Eyebrow override for fbEyebrow"
```

---

## Task 3: Render the advancement groups as a Forged Band card

**Files:**
- Modify: `steel-etl/internal/site/retainer_page.go` (add `retainerRoleKey` + `renderRetainerAdvancement`; ensure `content` is imported)
- Test: `steel-etl/internal/site/retainer_page_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/site/retainer_page_test.go`:

```go
func TestRetainerRoleKey(t *testing.T) {
	fm := "roles:\n  - Harrier Retainer\n"
	if got := retainerRoleKey(fm); got != "harrier" {
		t.Errorf("want harrier, got %q", got)
	}
	if got := retainerRoleKey("roles:\n  - Bogus Retainer\n"); got != "" {
		t.Errorf("unknown role should snap to empty, got %q", got)
	}
	if got := retainerRoleKey("name: x\n"); got != "" {
		t.Errorf("no roles should yield empty, got %q", got)
	}
}

func TestRenderRetainerAdvancement(t *testing.T) {
	fm := "name: Goblin Guide\nroles:\n  - Harrier Retainer\n"
	_, groups := splitRetainerAdvancement(goblinGuideBody)
	out := renderRetainerAdvancement(fm, groups)

	for _, want := range []string{
		`class="fb-wrap"`, `data-role="harrier"`,
		"Advancement Abilities", // card name
		"Harrier Retainer",      // eyebrow
		`class="fb__band--adv" data-level="4"`,
		"Level 4 Advancement", // adv sub-head
		"Weaving Knives",      // the level-4 ability
		`data-level="7"`, "Sneak and Stab",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("advancement card missing %q\n---\n%s", want, out)
		}
	}
	// The card must NOT contain the base features (those stay in the island).
	if strings.Contains(out, "Stabbity Stab") {
		t.Errorf("advancement card leaked a base feature")
	}
}

func TestRenderRetainerAdvancement_Empty(t *testing.T) {
	if out := renderRetainerAdvancement("name: x\n", nil); out != "" {
		t.Errorf("no groups should render nothing, got %q", out)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/site/ -run 'TestRetainerRoleKey|TestRenderRetainerAdvancement' -v`
Expected: FAIL — `undefined: retainerRoleKey`, `undefined: renderRetainerAdvancement`.

- [ ] **Step 3: Write the minimal implementation**

Append to `steel-etl/internal/site/retainer_page.go` (add the `content` import now if it was deferred from Task 1):

```go
// retainerRoleKey snaps the first word of the first `roles` entry
// ("Harrier Retainer" → "harrier") to a CSS-colored role key, so the Forged
// Band head accents in the retainer's role color. Unknown/absent → "" (the
// card renders in the neutral fallback).
func retainerRoleKey(fm string) string {
	roles := parseFrontmatterList(fm, "roles")
	if len(roles) == 0 {
		return ""
	}
	fields := strings.Fields(roles[0])
	if len(fields) == 0 {
		return ""
	}
	key := strings.ToLower(fields[0])
	if knownRoleKeys[key] {
		return key
	}
	return ""
}

// renderRetainerAdvancement renders the advancement groups as ONE Forged Band
// card (leveled .fb__band--adv tiers via renderFbFeats), to sit below the
// statblock island. Returns "" when there are no groups, so non-retainer
// statblocks add nothing. The leading "\n" separates it from the island div.
func renderRetainerAdvancement(fm string, groups []retainerAdvGroup) string {
	if len(groups) == 0 {
		return ""
	}
	var feats []fbFeature
	for _, g := range groups {
		rfs := content.ParseRichFeatures(g.Body)
		for i := range rfs {
			rfs[i].Level = g.Level // stamp the heading's level (no bold label to detect)
		}
		feats = append(feats, fbFeaturesFromRich(rfs)...)
	}
	if len(feats) == 0 {
		return ""
	}
	eyebrow := ""
	if roles := parseFrontmatterList(fm, "roles"); len(roles) > 0 {
		eyebrow = strings.TrimSpace(roles[0])
	}
	doc := fbDoc{
		Name:     "Advancement Abilities",
		Eyebrow:  eyebrow,
		Role:     retainerRoleKey(fm),
		Features: feats,
	}
	return "\n" + renderFeatureblockCard(doc)
}
```

NOTE: confirm `parseFrontmatterList` is the exact helper name used elsewhere in the package (it is used by `buildStatblockIsland` for `keywords`/`immunities`). Verify with `grep -n 'func parseFrontmatterList' internal/site/`. If the helper has a different name/signature, use the one the package already provides.

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/site/ -run 'TestRetainerRoleKey|TestRenderRetainerAdvancement' -v`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/retainer_page.go internal/site/retainer_page_test.go
git commit -m "feat(site): render retainer advancement as a Forged Band card"
```

---

## Task 4: Wire the split into `buildStatblockIslandPage`

**Files:**
- Modify: `steel-etl/internal/site/statblock_page.go` (`buildStatblockIslandPage`, ~118)
- Test: `steel-etl/internal/site/retainer_page_test.go`

- [ ] **Step 1: Write the failing test**

First confirm the island feature struct's JSON tag for the feature name: `grep -n 'type sbFeature' internal/site/statblock_page.go` then read its fields. The test below assumes the name field serializes as `"name"`; if it is e.g. `json:"title"`, change the test's struct tag and field accordingly.

Add to `steel-etl/internal/site/retainer_page_test.go` (merge `encoding/json` into the file's existing import block):

```go
func TestBuildStatblockIslandPage_RetainerSplit(t *testing.T) {
	page := "---\nname: Goblin Guide\ntype: statblock\nroles:\n  - Harrier Retainer\n---\n\n" + goblinGuideBody
	out, ok := buildStatblockIslandPage([]byte(page))
	if !ok {
		t.Fatal("retainer statblock should be handled")
	}
	s := string(out)

	// 1. The advancement card is appended.
	if !strings.Contains(s, `class="fb-wrap"`) || !strings.Contains(s, "Weaving Knives") {
		t.Errorf("page should contain the advancement card")
	}
	// 2. The island JSON must NOT include the advancement abilities.
	marker := `class="sc-statblock-data">`
	start := strings.Index(s, marker)
	if start < 0 {
		t.Fatal("island script not found")
	}
	jsonStart := start + len(marker)
	jsonEnd := strings.Index(s[jsonStart:], "</script>")
	islandJSON := strings.TrimSpace(s[jsonStart : jsonStart+jsonEnd])
	var island struct {
		Features []struct {
			Name string `json:"name"`
		} `json:"features"`
	}
	if err := json.Unmarshal([]byte(islandJSON), &island); err != nil {
		t.Fatalf("island JSON parse: %v\n%s", err, islandJSON)
	}
	names := map[string]bool{}
	for _, f := range island.Features {
		names[f.Name] = true
	}
	if !names["Crafty"] {
		t.Errorf("island should keep base feature Crafty; got %v", names)
	}
	if names["Weaving Knives"] || names["Sneak and Stab"] {
		t.Errorf("island must NOT include advancement abilities; got %v", names)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/site/ -run TestBuildStatblockIslandPage_RetainerSplit -v`
Expected: FAIL — the advancement card is absent and `Weaving Knives` is still an island feature.

- [ ] **Step 3: Write the minimal implementation**

In `steel-etl/internal/site/statblock_page.go`, edit the tail of `buildStatblockIslandPage`. The current code (after the two early-return guards) is:

```go
	js, err := json.Marshal(buildStatblockIsland(fm, body))
	if err != nil {
		return data, false
	}
	// ... island construction comment block (leave unchanged) ...
	island := "<div class=\"sc-statblock-mount\">" +
		"<script type=\"application/json\" class=\"sc-statblock-data\">\n" + string(js) + "\n</script>" +
		"</div>\n"
	return []byte("---\n" + fm + "\n---\n\n" + island), true
```

Change exactly three things — the marshal arg, two new lines, and the return concat:

```go
	// Retainer advancement abilities (H6 "Level N Retainer Advancement Ability"
	// headings) are split out: the island is built from the pre-advancement base
	// so they no longer pollute the feature list, and they re-emit as a Forged
	// Band card below the statblock (Plan 4). Non-retainer statblocks: base ==
	// body, no groups, no-op.
	base, advGroups := splitRetainerAdvancement(body)
	js, err := json.Marshal(buildStatblockIsland(fm, base))
	if err != nil {
		return data, false
	}
	// ... island construction comment block (leave unchanged) ...
	island := "<div class=\"sc-statblock-mount\">" +
		"<script type=\"application/json\" class=\"sc-statblock-data\">\n" + string(js) + "\n</script>" +
		"</div>\n"
	adv := renderRetainerAdvancement(fm, advGroups)
	return []byte("---\n" + fm + "\n---\n\n" + island + adv), true
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/site/ -run TestBuildStatblockIslandPage_RetainerSplit -v`
Expected: PASS.

- [ ] **Step 5: Run the full site package to confirm no regressions**

Run: `devbox run -- go test ./internal/site/...`
Expected: PASS — existing statblock/fixture/featureblock tests stay green (base == body for every non-retainer keeps them unchanged).

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/statblock_page.go internal/site/retainer_page_test.go
git commit -m "feat(site): exclude retainer advancement from island, append fb card"
```

---

## Task 5: Full build + regeneration + SCC stability

**Files:** none (verification only)

- [ ] **Step 1: Whole-module build + vet + tests**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
devbox run -- go build ./... && devbox run -- go vet ./... && devbox run -- go test ./...
```
Expected: build clean, vet clean, all tests PASS.

- [ ] **Step 2: Regenerate the monsters book (retainers live there) and confirm SCC stability**

This split is **site-render-only** and mints/changes **no SCC codes**, so `validate --scc-stable` must stay green. Regenerate and validate using the documented path (consult `steel-etl/CLAUDE.md` for the exact `gen`/`validate` invocation and the `--all`/`--book` multi-book gotcha; retainers are in the `mcdm.monsters.v1` book):

```bash
cd /home/vexa/code/steel_compendium/workspace
just deploy-v2   # or the steel-etl gen+site path documented in steel-etl/CLAUDE.md
```
Expected: build succeeds; `validate --scc-stable` reports no added/changed/removed codes.

- [ ] **Step 3: Confirm a regenerated retainer page carries the card and a clean island**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
RET=$(find data -ipath '*Retainers*Goblin Guide*' -name '*.md' | grep -i dse-linked | head -1)
echo "checking: $RET"
grep -c 'class="fb-wrap"' "$RET"            # expect >= 1 (advancement card present)
grep -o 'Weaving Knives' "$RET" | head      # appears (in the card) — see note
```
NOTE: "Weaving Knives" will still appear in the page (inside the new card). The real check is that it is **not an island feature** — confirm by inspecting the `sc-statblock-data` JSON in `$RET` and verifying the advancement ability names are absent from its `features` array (the Task 4 integration test already asserts this on synthetic input; this step confirms it on the real regenerated page).
Expected: `fb-wrap` count ≥ 1; advancement ability names absent from the island JSON's feature list. If the island still lists them, the wiring regressed — stop and debug.

- [ ] **Step 4: Commit (only if regeneration changed tracked files)**

`data/` is gitignored build output, so there is usually nothing to commit. If anything tracked changed, commit with a `chore:` message; otherwise skip.

---

## Task 6: Visual check + docs & bookkeeping

**Files:**
- Modify: `DESIGN.md` (workspace root)
- Modify (via Write tool, not git): the featureblock-cards memory note

- [ ] **Step 1: Visual spot-check (Brave, recommended)**

Per memory `reference_playwright_mcp_broken`, drive Brave via playwright-core (executablePath `/opt/brave.com/brave/brave`). Build/serve the v2 site and open a retainer page (e.g. Goblin Guide). Confirm:
  - The statblock island renders as before (base features only — no advancement abilities inside it).
  - One Forged Band "Advancement Abilities" card sits below it, accented in the retainer's role color, with "Level 4 / 7 / 10 Advancement" sub-head bands.
  - The Featureblocks settings (`data-fb-featstyle`, `data-fb-stats`) reflow the card's features like other fb cards.

If serving is impractical in this session, record it as a manual follow-up rather than blocking the commit.

- [ ] **Step 2: Update `DESIGN.md`**

In the featureblock cards section of `DESIGN.md`, add retainer advancement as a shipped instance of the Forged Band card (alongside featureblocks/terrain/fixtures): retainer advancement abilities now render as a single Forged Band "Advancement Abilities" card with leveled `.fb__band--adv` tiers below the statblock island, split site-side from the body's `Level N Retainer Advancement Ability` headings (no data/schema/SCC change). Keep it to current-state + pointer; the dated detail lives in this plan.

- [ ] **Step 3: Update the featureblock-cards memory note**

Edit `/home/vexa/.claude/projects/-home-vexa-code-steel-compendium-workspace/memory/project_featureblock_cards.md` to record Plan 4 (retainer advancement split) shipped 2026-06-13; only Plan 5 (companion advancement) remains. Update its one-line pointer in `MEMORY.md` if the hook text changes.

  - **No `scc-log.md` entry** — this plan mints/changes no SCC codes.
  - **No `FOLLOWUPS.md`/`ROADMAP.md` change** — FOLLOWUPS #7 ("With Captain" relabel / shared Malice band) is a separate, still-open item; do not close it.

- [ ] **Step 4: Commit docs**

```bash
cd /home/vexa/code/steel_compendium/workspace
git add DESIGN.md
git commit -m "docs: retainer advancement Forged Band card (featureblock Plan 4)"
```
(The memory files live outside the repo; they are saved via the Write tool, not committed here.)

---

## Self-review notes

- **Spec coverage (§3 "Retainer pages"):** "splits the body at the demoted `Level N … Advancement Ability` … excluded from the island features … emitted as Forged Band advancement card(s) after the island mount." Tasks 1+4 do the split/exclude; Task 3 builds the card; Task 4 appends it after the island. The spec guessed "bold labels"; ground truth is H6 headings — the regex handles the real form. ✓
- **"Explicitly untouched" data layer:** no parser/schema/SCC change; Task 5 Step 2 guards `--scc-stable`. ✓
- **Type consistency:** `splitRetainerAdvancement` → `[]retainerAdvGroup{Level,Body}`; `renderRetainerAdvancement` stamps `RichFeature.Level` then `fbFeaturesFromRich` (Plan 3, maps `Level`) → `fbFeature.Level` → `renderFbFeats` `.fb__band--adv`. `fbDoc.Eyebrow` (Task 2) consumed by `fbEyebrow` (Task 3 card). All names align. ✓
- **No placeholders:** every code step is complete; the three NOTE callouts are pre-flight verifications (module import path, `parseFrontmatterList` name, island json tag), not deferred work. ✓
