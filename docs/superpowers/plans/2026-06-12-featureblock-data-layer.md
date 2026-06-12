# Featureblock Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract full field metadata for featureblocks, dynamic terrain, and summoner fixtures — scalars + a rich structured `features[]` — into frontmatter, JSON/YAML output, and a new `featureblock.schema.json` (both schema copies).

**Architecture:** Plan 1 of the featureblock-cards effort (spec: `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`, phases 1 of 7). A new shared rich feature parser lives in `internal/content/featureparse.go` (port of the statblock island parser's logic onto content-package primitives — site files are NOT touched in this plan; Plan 2 swaps `statblock_page.go` onto the shared parser). Parsers stamp the new fields into `ParsedContent.Frontmatter` (yaml.Marshal handles nesting); a new SDK transformer emits featureblock JSON/YAML. **No SCC codes are minted or changed** — `validate --scc-stable` must stay green.

**Tech Stack:** Go (devbox: `devbox run -- go test ./...` from the workspace root, or `cd steel-etl` inside `devbox shell`), JSON Schema draft 2019-09, table-driven Go tests.

**Repos & commits:** Tasks 1–8, 10–11 commit in `steel-etl/`. Task 9 commits in `steel-etl/` AND `data-sdk-npm/` (the schema's second copy — **verify `git rev-parse --abbrev-ref HEAD` says `v3`** before committing there). The workspace-repo `steel-etl` pointer bump happens at deploy time, not in this plan.

**Verbatim source fixtures used in tests** (from `steel-etl/input/monsters/Draw Steel Monsters.md` and `…/input/summoner/…`): Basilisk Malice (Walleye, Upchuck), Ajax's Malice (Reason), War Dog Malice (Level 4+), Tactical Stance (Ajax Feature), Angry Beehive, The Boil. Content is frozen — copy test fixture strings exactly as given below.

---

## File structure

| File | Responsibility |
|---|---|
| Create `steel-etl/internal/content/featureparse.go` | `RichFeature` types, `ParseRichFeatures`, `ToMap` — the shared non-lossy feature parser |
| Create `steel-etl/internal/content/featureparse_test.go` | Table-driven tests for the above |
| Modify `steel-etl/internal/content/monster.go` | `FeatureblockParser` (kind/level/flavor/features), `StatblockParser` (fixture grid/role/kind) |
| Modify `steel-etl/internal/content/monster_test.go` | New parser tests |
| Modify `steel-etl/internal/content/dynamic_terrain.go` | classifier → `terrain_type`/`role`; loose `stats[]`; `flavor`; `features[]` |
| Modify `steel-etl/internal/content/dynamic_terrain_test.go` | Updated + new tests |
| Create `steel-etl/schemas/featureblock.schema.json` | New schema (copy 1) |
| Create `data-sdk-npm/src/schema/featureblock.schema.json` | New schema (copy 2, `v3` branch) |
| Modify `steel-etl/schemas/statblock.schema.json` + `data-sdk-npm/src/schema/statblock.schema.json` | Additive `statblock_kind`/`terrain_type` |
| Create `steel-etl/internal/output/featureblock_transform.go` | `transformFeatureblock` |
| Modify `steel-etl/internal/output/sdk_transform.go` | Dispatch `featureblock`/`dynamic-terrain` |
| Modify `steel-etl/internal/output/schema_validation_test.go` | Allowlists + conformance tests |

All `go` commands below run from `steel-etl/` (inside `devbox shell`, or prefix `devbox run --` from the workspace root).

---

### Task 1: RichFeature types + passive-feature parsing

**Files:**
- Create: `steel-etl/internal/content/featureparse.go`
- Create: `steel-etl/internal/content/featureparse_test.go`

- [ ] **Step 1: Write the failing test**

```go
package content

import "testing"

func TestParseRichFeatures_Passive(t *testing.T) {
	body := "Intro prose line.\n\n" +
		"> 🔳 **Walleye (7 Malice)**\n" +
		">\n" +
		"> A basilisk spews reflective spittle across an adjacent vertical surface in a 3-square-by-3-square area. The basilisk can use their Petrifying Eye Beams ability to target a square in the area, causing the area and distance of that ability to become a 20 x 3 line within 1 square of the wall.\n"

	feats := ParseRichFeatures(body)
	if len(feats) != 1 {
		t.Fatalf("got %d features, want 1", len(feats))
	}
	f := feats[0]
	if f.Icon != "🔳" {
		t.Errorf("Icon = %q, want 🔳", f.Icon)
	}
	if f.Name != "Walleye" {
		t.Errorf("Name = %q, want Walleye", f.Name)
	}
	if f.Cost != "7 Malice" {
		t.Errorf("Cost = %q, want '7 Malice'", f.Cost)
	}
	if want := "A basilisk spews reflective spittle"; len(f.Body) == 0 || f.Body[:len(want)] != want {
		t.Errorf("Body = %q, want prefix %q", f.Body, want)
	}
	if f.PowerRoll != nil || f.Usage != "" || len(f.Sections) != 0 {
		t.Errorf("passive feature should have no PowerRoll/Usage/Sections: %+v", f)
	}
}

func TestParseRichFeatures_SignatureCost(t *testing.T) {
	body := "> 🗡 **Blade of the Gol King (Signature Ability)**\n>\n> Some text.\n"
	feats := ParseRichFeatures(body)
	if len(feats) != 1 || feats[0].Name != "Blade of the Gol King" || feats[0].Cost != "Signature" {
		t.Fatalf("got %+v, want name 'Blade of the Gol King' cost 'Signature'", feats)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/content/ -run TestParseRichFeatures -v`
Expected: FAIL — `undefined: ParseRichFeatures`

- [ ] **Step 3: Write the implementation**

`featureparse.go` (complete file; reuses `splitBlockquoteBlocks`, `sbTitleRe`, `sbParenRe`, `sbDiceRe`, `sbBareTierRe`, `sbTierRe`, `featureTableRows`, `stripBold`, `cleanIconCell`, `splitCommaList`, `linkDisplay` already in package `content`):

```go
package content

import (
	"regexp"
	"strconv"
	"strings"
)

// RichFeature is the non-lossy feature shape shared by featureblocks, dynamic
// terrain, and fixture statblocks (spec:
// docs/superpowers/specs/2026-06-12-featureblock-cards-design.md §2). Unlike
// the SDK statblock feature shape (ParseStatblockFeatures), it keeps labeled
// Effect/Trigger sections, cost enhancements, trailing notes, and the source
// emoji icon. Link markdown in text fields is kept verbatim (the data-field
// convention); only the power-roll formula is link-stripped (cosmetic).
type RichFeature struct {
	Icon         string
	Name         string
	Cost         string // "7 Malice", "Signature", "Villain Action 1", …
	Usage        string // "Main action", "Maneuver", … (from the spec table)
	Keywords     []string
	Distance     string
	Target       string
	PowerRoll    *RichPowerRoll
	Sections     []RichSection     // labeled paragraphs: Effect / Trigger / Special …
	Enhancements []RichEnhancement // cost-labeled paragraphs: "2 Malice:" / "Spend …:"
	Body         string            // prose of a table-less (passive) feature
	Trailing     string            // prose after the structured parts of an ability
	Level        int               // advancement group level ("Level 5 Fixture Advancement Feature")
}

// RichPowerRoll is a power roll: Formula "+ 2" (labeled form) or "2d10 + R"
// (dice-in-title form); "" means a bare test result (renderer omits the head).
type RichPowerRoll struct {
	Formula string
	Tiers   map[string]string // keys: low / mid / high
}

type RichSection struct{ Label, Text string }
type RichEnhancement struct{ Cost, Text string }

var (
	fbParaSplitRe = regexp.MustCompile(`\n[ \t]*\n`)
	// power-roll header, tolerant of a link-wrapped "Power Roll" label
	// (mirrors internal/site prHeadRe).
	fbPRHeadRe = regexp.MustCompile(`(?s)^\*\*(?:\[Power Roll\]\([^)]*\)|Power Roll)\s*\+\s*(.+?):\*\*\s*$`)
	// a labeled paragraph: "**Effect:** text…" (mirrors internal/site labelRe).
	fbLabelRe = regexp.MustCompile(`(?s)^\*\*([^*:]+):\*\*\s*(.+)$`)
	// a label that is a cost ("2 Malice", "5+ Malice", "Spend …").
	fbCostLabelRe = regexp.MustCompile(`(?i)^(?:\d+\+?\s+\S+.*|spend\b.*)$`)
	// a standalone bold level-group label inside a blockquote:
	// "**Level 5 Fixture Advancement Feature**".
	fbLevelLabelRe = regexp.MustCompile(`^\*\*Level\s+(\d+)\b[^*]*\*\*$`)
	fbCollapseRe   = regexp.MustCompile(`\s*\n\s*`)
)

// fbCollapse joins a multi-line paragraph into one line.
func fbCollapse(s string) string {
	return strings.TrimSpace(fbCollapseRe.ReplaceAllString(s, " "))
}

// ParseRichFeatures parses a body's feature blockquotes into RichFeatures.
// A standalone bold "Level N …" block sets the Level carried by all features
// that follow it (the fixture-advancement form).
func ParseRichFeatures(body string) []RichFeature {
	var out []RichFeature
	level := 0
	for _, block := range splitBlockquoteBlocks(body) {
		block = strings.TrimSpace(block)
		if block == "" {
			continue
		}
		if m := fbLevelLabelRe.FindStringSubmatch(block); m != nil {
			level, _ = strconv.Atoi(m[1])
			continue
		}
		if f, ok := parseRichFeature(block); ok {
			f.Level = level
			out = append(out, f)
		}
	}
	return out
}

// parseRichFeature parses one feature blockquote. Ported from the statblock
// island parser (internal/site/statblock_page.go parseStatblockIslandFeature);
// Plan 2 of the featureblock effort swaps the island onto this shared copy.
func parseRichFeature(block string) (RichFeature, bool) {
	paras := fbParaSplitRe.Split(block, -1)
	if len(paras) == 0 {
		return RichFeature{}, false
	}
	tm := sbTitleRe.FindStringSubmatch(strings.TrimSpace(paras[0]))
	if tm == nil {
		return RichFeature{}, false
	}
	f := RichFeature{Icon: strings.TrimSpace(tm[1]), Name: strings.TrimSpace(tm[2])}

	// Parenthetical → Signature / cost / Villain Action N.
	if pm := sbParenRe.FindStringSubmatch(f.Name); pm != nil {
		f.Name = strings.TrimSpace(pm[1])
		paren := strings.TrimSpace(pm[2])
		if strings.EqualFold(paren, "Signature Ability") {
			f.Cost = "Signature"
		} else {
			f.Cost = paren
		}
	}

	// Dice-in-title power roll (summoner signatures) → formula + clean name.
	diceFormula := ""
	if dm := sbDiceRe.FindStringSubmatch(f.Name); dm != nil {
		f.Name = strings.TrimSpace(dm[1])
		diceFormula = linkDisplay(strings.TrimSpace(dm[2]))
	}

	var (
		tableSeen bool
		formula   = diceFormula
		tiers     [3]string
		tiersSeen bool
		bareIdx   int
		prose     []string
	)

	for _, para := range paras[1:] {
		tp := strings.TrimSpace(para)
		if tp == "" {
			continue
		}

		// Spec table → keywords / usage (row 1), distance / target (row 2).
		if strings.HasPrefix(tp, "|") {
			rows := featureTableRows(strings.Split(para, "\n"))
			if len(rows) >= 1 {
				f.Keywords = splitCommaList(stripBold(rows[0][0]))
				f.Usage = stripBold(rows[0][1])
			}
			if len(rows) >= 2 {
				f.Distance = cleanIconCell(rows[1][0])
				f.Target = cleanIconCell(rows[1][1])
			}
			tableSeen = true
			continue
		}

		// Power-roll header → formula ("+ 2"); the next list holds the tiers.
		if m := fbPRHeadRe.FindStringSubmatch(tp); m != nil {
			formula = "+ " + linkDisplay(strings.TrimSpace(m[1]))
			continue
		}

		// Labeled tier list ("- **≤11:** …").
		if fbLooksLikeTiers(tp) {
			fbParseTiers(tp, &tiers)
			tiersSeen = true
			continue
		}

		// Dice-in-title abilities: bare digit-led lines are tiers by position.
		if diceFormula != "" && bareIdx < 3 && sbBareTierRe.MatchString(tp) {
			tiers[bareIdx] = fbCollapse(tp)
			bareIdx++
			tiersSeen = true
			continue
		}

		// Labeled paragraph → cost enhancement or titled section.
		if m := fbLabelRe.FindStringSubmatch(tp); m != nil {
			label := strings.TrimSpace(m[1])
			text := fbCollapse(m[2])
			if fbCostLabelRe.MatchString(label) {
				f.Enhancements = append(f.Enhancements, RichEnhancement{Cost: label, Text: text})
			} else {
				f.Sections = append(f.Sections, RichSection{Label: label, Text: text})
			}
			continue
		}

		prose = append(prose, fbCollapse(tp))
	}

	if tiersSeen {
		t := map[string]string{}
		for i, key := range []string{"low", "mid", "high"} {
			if tiers[i] != "" {
				t[key] = tiers[i]
			}
		}
		f.PowerRoll = &RichPowerRoll{Formula: formula, Tiers: t}
	}
	if tableSeen {
		f.Trailing = strings.Join(prose, " ")
	} else if len(prose) > 0 {
		f.Body = strings.Join(prose, "\n\n")
	}
	return f, true
}

// fbLooksLikeTiers reports whether a paragraph is a labeled tier list.
func fbLooksLikeTiers(para string) bool {
	return sbTierRe.MatchString(strings.TrimSpace(strings.Split(para, "\n")[0]))
}

// fbParseTiers fills tiers[0..2] (low/mid/high) from "- **≤11:** …" lines.
func fbParseTiers(para string, tiers *[3]string) {
	for _, line := range strings.Split(para, "\n") {
		m := sbTierRe.FindStringSubmatch(strings.TrimSpace(line))
		if m == nil {
			continue
		}
		switch {
		case strings.HasPrefix(m[1], "≤"):
			tiers[0] = strings.TrimSpace(m[2])
		case strings.Contains(m[1], "-"):
			tiers[1] = strings.TrimSpace(m[2])
		case strings.HasSuffix(m[1], "+"):
			tiers[2] = strings.TrimSpace(m[2])
		}
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/content/ -run TestParseRichFeatures -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the whole package + vet, then commit**

Run: `go test ./internal/content/ && go vet ./internal/content/`
Expected: ok

```bash
git add internal/content/featureparse.go internal/content/featureparse_test.go
git commit -m "feat: add shared RichFeature parser (non-lossy feature shape)"
```

---

### Task 2: Spec table, power roll, sections, enhancements, trailing

**Files:**
- Modify: `steel-etl/internal/content/featureparse_test.go`

(The Task 1 implementation already contains this logic; these tests prove it against verbatim book content. If any fail, fix `parseRichFeature` — do not weaken the assertions.)

- [ ] **Step 1: Write the failing/verifying tests**

Append to `featureparse_test.go`:

```go
func TestParseRichFeatures_AbilityWithTableAndTiers(t *testing.T) {
	body := "> 🔳 **Upchuck (5 Malice)**\n" +
		">\n" +
		">\n" +
		"> | **Area, Weapon**        |               **Main action** |\n" +
		"> |-------------------------|------------------------------:|\n" +
		"> | **📏 3 cube within 10** | **🎯 Each enemy in the area** |\n" +
		">\n" +
		"> **Effect:** The basilisk spits up a chunk of partly digested stone.\n" +
		">\n" +
		"> **Power Roll + 2:**\n" +
		">\n" +
		"> - **≤11:** 4 damage\n" +
		"> - **12-16:** 4 damage; A < 1 2 damage, prone\n" +
		"> - **17+:** 4 damage; A < 2 5 damage, prone and can't stand (save ends)\n"

	feats := ParseRichFeatures(body)
	if len(feats) != 1 {
		t.Fatalf("got %d features, want 1", len(feats))
	}
	f := feats[0]
	if f.Name != "Upchuck" || f.Cost != "5 Malice" {
		t.Errorf("name/cost = %q/%q", f.Name, f.Cost)
	}
	if got := strings.Join(f.Keywords, ","); got != "Area,Weapon" {
		t.Errorf("Keywords = %q, want Area,Weapon", got)
	}
	if f.Usage != "Main action" {
		t.Errorf("Usage = %q, want 'Main action'", f.Usage)
	}
	if f.Distance != "3 cube within 10" {
		t.Errorf("Distance = %q", f.Distance)
	}
	if f.Target != "Each enemy in the area" {
		t.Errorf("Target = %q", f.Target)
	}
	if len(f.Sections) != 1 || f.Sections[0].Label != "Effect" {
		t.Fatalf("Sections = %+v, want one Effect section", f.Sections)
	}
	if f.PowerRoll == nil || f.PowerRoll.Formula != "+ 2" {
		t.Fatalf("PowerRoll = %+v, want formula '+ 2'", f.PowerRoll)
	}
	if f.PowerRoll.Tiers["low"] != "4 damage" {
		t.Errorf("low tier = %q", f.PowerRoll.Tiers["low"])
	}
	if f.PowerRoll.Tiers["mid"] != "4 damage; A < 1 2 damage, prone" {
		t.Errorf("mid tier = %q", f.PowerRoll.Tiers["mid"])
	}
	if f.PowerRoll.Tiers["high"] != "4 damage; A < 2 5 damage, prone and can't stand (save ends)" {
		t.Errorf("high tier = %q", f.PowerRoll.Tiers["high"])
	}
	if f.Body != "" {
		t.Errorf("ability with table should use Trailing, not Body: %q", f.Body)
	}
}

func TestParseRichFeatures_Enhancement(t *testing.T) {
	body := "> 🗡 **Blade of the Gol King (Signature Ability)**\n" +
		">\n" +
		"> | **Charge, Magic, Melee, Strike, Weapon** |                 **Main Action** |\n" +
		"> |------------------------------------------|--------------------------------:|\n" +
		"> | **📏 Melee 1**                           | **🎯 Two creatures or objects** |\n" +
		">\n" +
		"> **Effect:** Ajax shifts up to 2 squares between striking each target.\n" +
		">\n" +
		"> **1+ Malice:** Ajax can strike one additional target for each Malice spent.\n"

	feats := ParseRichFeatures(body)
	if len(feats) != 1 {
		t.Fatalf("got %d features, want 1", len(feats))
	}
	f := feats[0]
	if len(f.Enhancements) != 1 {
		t.Fatalf("Enhancements = %+v, want 1", f.Enhancements)
	}
	if f.Enhancements[0].Cost != "1+ Malice" {
		t.Errorf("enhancement cost = %q", f.Enhancements[0].Cost)
	}
	if len(f.Sections) != 1 || f.Sections[0].Label != "Effect" {
		t.Errorf("Sections = %+v", f.Sections)
	}
}

func TestParseRichFeatures_MultipleBlocks(t *testing.T) {
	body := "Intro.\n\n" +
		"> 👤 **Reason (2 Malice)**\n>\n> Opposed Reason test text.\n" +
		"\n" +
		"> ☠️ **Solo Action (5 Malice)**\n>\n> Ajax takes an additional main action on his turn.\n"
	feats := ParseRichFeatures(body)
	if len(feats) != 2 {
		t.Fatalf("got %d features, want 2", len(feats))
	}
	if feats[0].Name != "Reason" || feats[1].Name != "Solo Action" {
		t.Errorf("names = %q, %q", feats[0].Name, feats[1].Name)
	}
}
```

Add `"strings"` to the test file's imports.

- [ ] **Step 2: Run the tests**

Run: `go test ./internal/content/ -run TestParseRichFeatures -v`
Expected: PASS (5 tests). If a test fails, fix `parseRichFeature` in `featureparse.go` (likely suspects: table-row handling, tier label matching).

- [ ] **Step 3: Commit**

```bash
git add internal/content/featureparse_test.go
git commit -m "test: cover spec tables, tiers, sections, enhancements in RichFeature parser"
```

---

### Task 3: Dice-in-title power rolls (summoner form)

**Files:**
- Modify: `steel-etl/internal/content/featureparse_test.go`

- [ ] **Step 1: Write the test**

```go
func TestParseRichFeatures_DiceInTitle(t *testing.T) {
	body := "> 🏹 **Hurl Bone 2d10 + [R](scc:mcdm.heroes.v1/rule.characteristic/reason)**\n" +
		">\n" +
		"> | **Ranged, Strike** |        **Main action** |\n" +
		"> |--------------------|------------------------:|\n" +
		"> | **📏 Ranged 5**    | **🎯 One creature** |\n" +
		">\n" +
		"> 2 damage\n" +
		">\n" +
		"> 4 damage\n" +
		">\n" +
		"> 6 damage\n"

	feats := ParseRichFeatures(body)
	if len(feats) != 1 {
		t.Fatalf("got %d features, want 1", len(feats))
	}
	f := feats[0]
	if f.Name != "Hurl Bone" {
		t.Errorf("Name = %q, want 'Hurl Bone'", f.Name)
	}
	if f.PowerRoll == nil || f.PowerRoll.Formula != "2d10 + R" {
		t.Fatalf("PowerRoll = %+v, want formula '2d10 + R' (link stripped)", f.PowerRoll)
	}
	if f.PowerRoll.Tiers["low"] != "2 damage" || f.PowerRoll.Tiers["mid"] != "4 damage" || f.PowerRoll.Tiers["high"] != "6 damage" {
		t.Errorf("tiers = %+v", f.PowerRoll.Tiers)
	}
}
```

- [ ] **Step 2: Run the test**

Run: `go test ./internal/content/ -run TestParseRichFeatures_DiceInTitle -v`
Expected: PASS (the Task 1 implementation handles this via `sbDiceRe` + `sbBareTierRe`). If FAIL, fix `parseRichFeature`'s bare-tier branch.

- [ ] **Step 3: Commit**

```bash
git add internal/content/featureparse_test.go
git commit -m "test: cover summoner dice-in-title power rolls in RichFeature parser"
```

---

### Task 4: Level-label grouping (fixture advancement form)

**Files:**
- Modify: `steel-etl/internal/content/featureparse_test.go`

- [ ] **Step 1: Write the test**

```go
func TestParseRichFeatures_LevelLabels(t *testing.T) {
	body := "> ⭐️ **Hunger Thrush**\n>\n> Base feature text.\n" +
		"\n" +
		"> **Level 5 Fixture Advancement Feature**\n" +
		">\n" +
		"> ⭐️ **Soul Rancor**\n" +
		">\n" +
		"> You gain a surge.\n" +
		"\n" +
		"> **Level 9 Fixture Advancement Feature**\n" +
		">\n" +
		"> ⭐️ **Size Increase**\n" +
		">\n" +
		"> The boil is now size 3.\n" +
		">\n" +
		"> ⭐️ **Fester Field**\n" +
		">\n" +
		"> Each non-abyssal enemy takes 5 corruption damage.\n"

	feats := ParseRichFeatures(body)
	if len(feats) != 4 {
		t.Fatalf("got %d features, want 4 (label blocks are not features)", len(feats))
	}
	wantLevels := map[string]int{
		"Hunger Thrush": 0, "Soul Rancor": 5, "Size Increase": 9, "Fester Field": 9,
	}
	for _, f := range feats {
		if f.Level != wantLevels[f.Name] {
			t.Errorf("%s: Level = %d, want %d", f.Name, f.Level, wantLevels[f.Name])
		}
	}
}
```

- [ ] **Step 2: Run the test**

Run: `go test ./internal/content/ -run TestParseRichFeatures_LevelLabels -v`
Expected: PASS (Task 1's `fbLevelLabelRe` branch). If FAIL: the label block must be matched after `splitBlockquoteBlocks` (it arrives as its own block because `splitOnTitles` splits before the next emoji title).

- [ ] **Step 3: Commit**

```bash
git add internal/content/featureparse_test.go
git commit -m "test: cover advancement level-label grouping in RichFeature parser"
```

---

### Task 5: RichFeature.ToMap (schema-shaped maps for frontmatter/SDK)

**Files:**
- Modify: `steel-etl/internal/content/featureparse.go`
- Modify: `steel-etl/internal/content/featureparse_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestRichFeature_ToMap(t *testing.T) {
	f := RichFeature{
		Icon: "🔳", Name: "Upchuck", Cost: "5 Malice", Usage: "Main action",
		Keywords: []string{"Area", "Weapon"},
		Distance: "3 cube within 10", Target: "Each enemy in the area",
		PowerRoll: &RichPowerRoll{Formula: "+ 2", Tiers: map[string]string{"low": "4 damage"}},
		Sections:  []RichSection{{Label: "Effect", Text: "Spits a stone."}},
		Enhancements: []RichEnhancement{{Cost: "2 Malice", Text: "More."}},
		Level: 5,
	}
	m := f.ToMap()
	if m["name"] != "Upchuck" || m["icon"] != "🔳" || m["cost"] != "5 Malice" {
		t.Errorf("scalars wrong: %+v", m)
	}
	pr, ok := m["power_roll"].(map[string]any)
	if !ok || pr["formula"] != "+ 2" {
		t.Fatalf("power_roll = %+v", m["power_roll"])
	}
	secs, ok := m["sections"].([]map[string]any)
	if !ok || len(secs) != 1 || secs[0]["label"] != "Effect" {
		t.Fatalf("sections = %+v", m["sections"])
	}
	if m["level"] != 5 {
		t.Errorf("level = %v, want 5", m["level"])
	}

	// Empty fields are omitted entirely.
	min := RichFeature{Name: "Walleye", Body: "Text."}
	mm := min.ToMap()
	for _, absent := range []string{"icon", "cost", "usage", "keywords", "distance",
		"target", "power_roll", "sections", "enhancements", "trailing", "level"} {
		if _, ok := mm[absent]; ok {
			t.Errorf("empty field %q should be omitted", absent)
		}
	}
	if mm["body"] != "Text." {
		t.Errorf("body = %v", mm["body"])
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/content/ -run TestRichFeature_ToMap -v`
Expected: FAIL — `f.ToMap undefined`

- [ ] **Step 3: Implement**

Append to `featureparse.go`:

```go
// ToMap converts a RichFeature to the featureblock.schema.json features[]
// shape (snake_case keys, empty fields omitted).
func (f RichFeature) ToMap() map[string]any {
	m := map[string]any{"name": f.Name}
	if f.Icon != "" {
		m["icon"] = f.Icon
	}
	if f.Cost != "" {
		m["cost"] = f.Cost
	}
	if f.Usage != "" {
		m["usage"] = f.Usage
	}
	if len(f.Keywords) > 0 {
		m["keywords"] = f.Keywords
	}
	if f.Distance != "" {
		m["distance"] = f.Distance
	}
	if f.Target != "" {
		m["target"] = f.Target
	}
	if f.PowerRoll != nil {
		pr := map[string]any{"tiers": f.PowerRoll.Tiers}
		if f.PowerRoll.Formula != "" {
			pr["formula"] = f.PowerRoll.Formula
		}
		m["power_roll"] = pr
	}
	if len(f.Sections) > 0 {
		ss := make([]map[string]any, 0, len(f.Sections))
		for _, s := range f.Sections {
			ss = append(ss, map[string]any{"label": s.Label, "text": s.Text})
		}
		m["sections"] = ss
	}
	if len(f.Enhancements) > 0 {
		es := make([]map[string]any, 0, len(f.Enhancements))
		for _, e := range f.Enhancements {
			es = append(es, map[string]any{"cost": e.Cost, "text": e.Text})
		}
		m["enhancements"] = es
	}
	if f.Body != "" {
		m["body"] = f.Body
	}
	if f.Trailing != "" {
		m["trailing"] = f.Trailing
	}
	if f.Level > 0 {
		m["level"] = f.Level
	}
	return m
}

// RichFeatureMaps converts a parsed feature list to schema-shaped maps.
func RichFeatureMaps(fs []RichFeature) []map[string]any {
	out := make([]map[string]any, 0, len(fs))
	for _, f := range fs {
		out = append(out, f.ToMap())
	}
	return out
}
```

- [ ] **Step 4: Run tests, vet, commit**

Run: `go test ./internal/content/ && go vet ./internal/content/`
Expected: ok

```bash
git add internal/content/featureparse.go internal/content/featureparse_test.go
git commit -m "feat: RichFeature.ToMap schema-shaped serialization"
```

---

### Task 6: FeatureblockParser — kind, level, flavor, features

**Files:**
- Modify: `steel-etl/internal/content/monster.go` (the `FeatureblockParser.Parse` method)
- Modify: `steel-etl/internal/content/monster_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `monster_test.go` (follow the file's existing context/section construction pattern — see the existing `FeatureblockParser` test there; if helper names differ, adapt the construction lines ONLY, never the assertions):

```go
func TestFeatureblockParser_Metadata(t *testing.T) {
	tests := []struct {
		heading   string
		wantKind  string
		wantLevel int // 0 = absent
		wantName  string
	}{
		{"Basilisk Malice (Malice Features)", "malice", 0, "Basilisk Malice"},
		{"War Dog Malice (Level 4+ Malice Features)", "malice", 4, "War Dog Malice (Level 4+ Malice Features)"},
		{"Tactical Stance (Ajax Feature)", "feature", 0, "Tactical Stance"},
		{"Basic Malice", "malice", 0, "Basic Malice"},
	}
	body := "At the start of any basilisk's turn, you can spend Malice to activate one of the following features.\n\n" +
		"> 🔳 **Walleye (7 Malice)**\n>\n> A basilisk spews reflective spittle.\n"

	for _, tt := range tests {
		t.Run(tt.heading, func(t *testing.T) {
			section := newTestSection(tt.heading, map[string]string{"type": "featureblock"}, body)
			ctx := context.NewContextStack()
			ctx.Push(2, map[string]string{"category": "basilisks"})

			p := &FeatureblockParser{}
			got, err := p.Parse(ctx, section)
			if err != nil {
				t.Fatal(err)
			}
			if got.Frontmatter["kind"] != tt.wantKind {
				t.Errorf("kind = %v, want %q", got.Frontmatter["kind"], tt.wantKind)
			}
			if tt.wantLevel > 0 {
				if got.Frontmatter["level"] != tt.wantLevel {
					t.Errorf("level = %v, want %d", got.Frontmatter["level"], tt.wantLevel)
				}
			} else if _, ok := got.Frontmatter["level"]; ok {
				t.Errorf("level should be absent, got %v", got.Frontmatter["level"])
			}
			if got.Frontmatter["name"] != tt.wantName {
				t.Errorf("name = %v, want %q", got.Frontmatter["name"], tt.wantName)
			}
			flavor, _ := got.Frontmatter["flavor"].(string)
			if !strings.HasPrefix(flavor, "At the start of any basilisk's turn") {
				t.Errorf("flavor = %q", flavor)
			}
			feats, ok := got.Frontmatter["features"].([]map[string]any)
			if !ok || len(feats) != 1 || feats[0]["name"] != "Walleye" {
				t.Errorf("features = %+v", got.Frontmatter["features"])
			}
		})
	}
}
```

NOTE on the test-fixture construction: `newTestSection` / `context.NewContextStack` stand in for whatever constructor the existing tests in `monster_test.go` and `dynamic_terrain_test.go` use (e.g. building a `parser.Section` directly with `Heading`/`Annotation`/body, and `ctx.Push(level, map…)`). Open `dynamic_terrain_test.go:10-30` and mirror its exact construction; keep every assertion above unchanged.

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/content/ -run TestFeatureblockParser_Metadata -v`
Expected: FAIL — kind/flavor/features missing from frontmatter

- [ ] **Step 3: Implement**

Replace the body of `FeatureblockParser.Parse` in `monster.go`:

```go
func (p *FeatureblockParser) Parse(ctx *context.ContextStack, section *parser.Section) (*ParsedContent, error) {
	name := featureblockName(section.Heading)

	id := section.ID()
	if id == "" {
		id = Slugify(name)
	}

	body := section.FullBodySource()
	heading := CleanHeading(section.Heading)

	fm := map[string]any{
		"name": name,
		"type": "featureblock",
	}

	// kind: any "malice" mention in the heading (name or parenthetical) marks a
	// malice block ("Basilisk Malice (Malice Features)", "Basic Malice");
	// everything else is a named feature block ("Tactical Stance (Ajax Feature)").
	if strings.Contains(strings.ToLower(heading), "malice") {
		fm["kind"] = "malice"
	} else {
		fm["kind"] = "feature"
	}

	// level: from level-qualified headings ("… (Level 4+ Malice Features)").
	if m := levelRe.FindStringSubmatch(heading); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			fm["level"] = n
		}
	}

	if flavor := firstFlavorParagraph(body); flavor != "" {
		fm["flavor"] = flavor
	}
	if feats := ParseRichFeatures(body); len(feats) > 0 {
		fm["features"] = RichFeatureMaps(feats)
	}

	domain, category, subcategory := statblockDomain(ctx, section.HeadingLevel)
	typePath := compactPath(domain, category, subcategory)

	return &ParsedContent{
		Frontmatter: fm,
		Body:        body,
		TypePath:    typePath,
		ItemID:      id,
	}, nil
}
```

(`levelRe` and `strconv` are already available in the package/file; `monster.go` already imports `strconv` and `strings`.)

- [ ] **Step 4: Run tests**

Run: `go test ./internal/content/ -v -run "TestFeatureblock"`
Expected: PASS — both the new test and any pre-existing featureblock tests. If a pre-existing test asserts the old minimal frontmatter (exact map equality), update it to assert the keys it cares about instead.

- [ ] **Step 5: Commit**

```bash
git add internal/content/monster.go internal/content/monster_test.go
git commit -m "feat: featureblock parser extracts kind, level, flavor, rich features"
```

---

### Task 7: DynamicTerrainParser — classifier, loose stats, flavor, features

**Files:**
- Modify: `steel-etl/internal/content/dynamic_terrain.go`
- Modify: `steel-etl/internal/content/dynamic_terrain_test.go`

- [ ] **Step 1: Write the failing test**

Append (mirroring the file's existing construction pattern):

```go
func TestDynamicTerrainParser_ClassifierStatsFeatures(t *testing.T) {
	heading := "Angry Beehive (Level 2 Hazard Hexer)"
	body := "This beehive is full of angry bees who swarm and attack with little provocation.\n\n" +
		"- **EV:** 2\n" +
		"- **Stamina:** 3\n" +
		"- **Size:** 1S\n\n" +
		"> 🌀 **Deactivate**\n>\n> The beehive can't be deactivated.\n" +
		"\n" +
		"> ❕ **Activate**\n>\n> A creature enters the hive's space.\n>\n> **Effect:** The hive is removed from the encounter map.\n"

	section := newTestSection(heading, map[string]string{"type": "dynamic-terrain"}, body)
	ctx := context.NewContextStack()
	ctx.Push(3, map[string]string{"domain": "dynamic-terrain", "category": "environmental-hazards"})

	p := &DynamicTerrainParser{}
	got, err := p.Parse(ctx, section)
	if err != nil {
		t.Fatal(err)
	}
	fm := got.Frontmatter
	if fm["level"] != "2" && fm["level"] != 2 {
		t.Errorf("level = %v, want 2", fm["level"])
	}
	if fm["terrain_type"] != "Hazard" {
		t.Errorf("terrain_type = %v, want Hazard", fm["terrain_type"])
	}
	if fm["role"] != "Hexer" {
		t.Errorf("role = %v, want Hexer", fm["role"])
	}
	flavor, _ := fm["flavor"].(string)
	if !strings.HasPrefix(flavor, "This beehive is full of angry bees") {
		t.Errorf("flavor = %q", flavor)
	}

	stats, ok := fm["stats"].([]map[string]any)
	if !ok || len(stats) != 3 {
		t.Fatalf("stats = %+v, want 3 ordered pairs", fm["stats"])
	}
	if stats[0]["name"] != "EV" || stats[0]["value"] != "2" {
		t.Errorf("stats[0] = %+v", stats[0])
	}
	if stats[2]["name"] != "Size" || stats[2]["value"] != "1S" {
		t.Errorf("stats[2] = %+v", stats[2])
	}
	// The old ad-hoc scalar emission is gone (never schema'd).
	for _, gone := range []string{"ev", "stamina", "size"} {
		if _, ok := fm[gone]; ok {
			t.Errorf("scalar %q should be replaced by stats[]", gone)
		}
	}

	feats, ok := fm["features"].([]map[string]any)
	if !ok || len(feats) != 2 {
		t.Fatalf("features = %+v, want 2", fm["features"])
	}
	if feats[0]["name"] != "Deactivate" || feats[0]["icon"] != "🌀" {
		t.Errorf("features[0] = %+v", feats[0])
	}
	if feats[1]["name"] != "Activate" {
		t.Errorf("features[1] = %+v", feats[1])
	}
	if secs, ok := feats[1]["sections"].([]map[string]any); !ok || len(secs) != 1 || secs[0]["label"] != "Effect" {
		t.Errorf("Activate sections = %+v", feats[1]["sections"])
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/content/ -run TestDynamicTerrainParser_ClassifierStatsFeatures -v`
Expected: FAIL — terrain_type/role/stats/flavor/features missing

- [ ] **Step 3: Implement**

Replace `dynamic_terrain.go`'s var block and `Parse`:

```go
var (
	// "- **EV:** 2" style list fields (ordered, loose).
	terrainFieldRe = regexp.MustCompile(`(?m)^-\s*\*\*([A-Za-z ]+):\*\*\s*(.+)$`)
	// "(Level 2 Hazard Hexer)" trailing classifier: level, terrain type
	// (may be multi-word: "Siege Engine"), role.
	terrainClassifierRe = regexp.MustCompile(`\(Level\s+(\d+)\s+(.+?)\s+(\w+)\)\s*$`)
	// fallback for headings without the full classifier.
	terrainLevelRe = regexp.MustCompile(`Level\s+(\d+)`)
)
```

```go
func (p *DynamicTerrainParser) Parse(ctx *context.ContextStack, section *parser.Section) (*ParsedContent, error) {
	name := CleanHeading(section.Heading)
	name = strings.TrimSpace(trailingParenRe.ReplaceAllString(name, ""))

	id := section.ID()
	if id == "" {
		id = Slugify(name)
	}

	body := section.FullBodySource()
	fm := map[string]any{
		"name": name,
		"type": "dynamic-terrain",
	}

	// "(Level 2 Hazard Hexer)" → level / terrain_type / role. The role word is
	// validated against the statblock role vocabulary; an unrecognized
	// classifier falls back to level-only extraction.
	if m := terrainClassifierRe.FindStringSubmatch(section.Heading); m != nil && knownRoles[m[3]] {
		if n, err := strconv.Atoi(m[1]); err == nil {
			fm["level"] = n
		}
		fm["terrain_type"] = strings.TrimSpace(m[2])
		fm["role"] = m[3]
	} else if m := terrainLevelRe.FindStringSubmatch(section.Heading); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			fm["level"] = n
		}
	}

	if flavor := firstFlavorParagraph(body); flavor != "" {
		fm["flavor"] = flavor
	}

	// Ordered loose stat pairs ("EV: 2", "Stamina: 3 per square", …).
	var stats []map[string]any
	for _, m := range terrainFieldRe.FindAllStringSubmatch(body, -1) {
		stats = append(stats, map[string]any{
			"name":  strings.TrimSpace(m[1]),
			"value": strings.TrimSpace(m[2]),
		})
	}
	if len(stats) > 0 {
		fm["stats"] = stats
	}

	if feats := ParseRichFeatures(body); len(feats) > 0 {
		fm["features"] = RichFeatureMaps(feats)
	}

	domain := "dynamic-terrain"
	if d, ok := ctx.Lookup(section.HeadingLevel, "domain"); ok && d != "" {
		domain = d
	}
	category, _ := ctx.Lookup(section.HeadingLevel, "category")

	return &ParsedContent{
		Frontmatter: fm,
		Body:        body,
		TypePath:    compactPath(domain, category),
		ItemID:      id,
	}, nil
}
```

Add `"strconv"` to the file's imports. Note `level` changes from string (`m[1]`) to **int** — intentional, matches the featureblock schema.

- [ ] **Step 4: Run package tests; update the pre-existing terrain test**

Run: `go test ./internal/content/ -v -run TestDynamicTerrain`
The pre-existing `TestDynamicTerrainParser` may assert the old string `level` or the removed `ev`/`stamina`/`size` scalars — update those assertions to the new shape (int level; `stats[]` pairs). Expected after updating: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/content/dynamic_terrain.go internal/content/dynamic_terrain_test.go
git commit -m "feat: terrain parser extracts classifier, loose stats, flavor, rich features"
```

---

### Task 8: StatblockParser fixture handling (resolves FOLLOWUPS #6)

**Files:**
- Modify: `steel-etl/internal/content/monster.go`
- Modify: `steel-etl/internal/content/monster_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestStatblockParser_Fixture(t *testing.T) {
	heading := "The Boil"
	body := "*Hazard Support*\n\n" +
		"| **Stamina:** 20 + your level | **Size:** 2 |\n" +
		"|------------------------------|------------:|\n\n" +
		"> ⭐️ **Hunger Thrush**\n>\n> Each enemy that starts their turn within 3 squares is taunted.\n"

	section := newTestSection(heading, map[string]string{"type": "statblock"}, body)
	ctx := context.NewContextStack()
	ctx.Push(5, map[string]string{"domain": "fixture", "category": "demon"})

	p := &StatblockParser{}
	got, err := p.Parse(ctx, section)
	if err != nil {
		t.Fatal(err)
	}
	fm := got.Frontmatter
	if fm["statblock_kind"] != "fixture" {
		t.Errorf("statblock_kind = %v, want fixture", fm["statblock_kind"])
	}
	if fm["stamina"] != "20 + your level" {
		t.Errorf("stamina = %v", fm["stamina"])
	}
	if fm["size"] != "2" {
		t.Errorf("size = %v", fm["size"])
	}
	if fm["terrain_type"] != "Hazard" {
		t.Errorf("terrain_type = %v", fm["terrain_type"])
	}
	if fm["role"] != "Support" {
		t.Errorf("role = %v", fm["role"])
	}
	// The 2-col grid header must NOT pollute keywords (today's #6 garbage).
	if kw, ok := fm["keywords"]; ok {
		t.Errorf("keywords should be absent for fixtures, got %v", kw)
	}
	if strings.Join(got.TypePath, "/") != "fixture/demon/statblock" {
		t.Errorf("TypePath = %v", got.TypePath)
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/content/ -run TestStatblockParser_Fixture -v`
Expected: FAIL — statblock_kind absent, stamina/size unparsed, keywords polluted

- [ ] **Step 3: Implement**

In `monster.go`, append to the bottom of the file:

```go
var (
	// fixture 2-col grid cell: "**Stamina:** 20 + your level"
	fixtureCellRe = regexp.MustCompile(`\*\*([A-Za-z ]+):\*\*\s*([^|]*)`)
	// the fixture's italic classifier line: "*Hazard Support*"
	fixtureRoleRe = regexp.MustCompile(`(?m)^\*([A-Za-z ]+)\*\s*$`)
)

// applyFixtureGrid parses the summoner-fixture statblock header — a 2-column
// "| **Stamina:** … | **Size:** … |" grid plus an italic "*Hazard Support*"
// role line — which the standard parseStatGrid does not understand
// (workspace FOLLOWUPS #6). It also removes the garbage keywords the standard
// header parse derives from the first grid cell.
func applyFixtureGrid(fm map[string]any, body string) {
	delete(fm, "keywords")

	for _, line := range strings.Split(body, "\n") {
		t := strings.TrimSpace(line)
		if !strings.HasPrefix(t, "|") || strings.Contains(t, "---") {
			continue
		}
		for _, m := range fixtureCellRe.FindAllStringSubmatch(t, -1) {
			key := strings.ToLower(strings.TrimSpace(m[1]))
			val := linkDisplay(strings.TrimSpace(m[2]))
			if (key == "stamina" || key == "size") && val != "" {
				fm[key] = val
			}
		}
	}

	if m := fixtureRoleRe.FindStringSubmatch(body); m != nil {
		words := strings.Fields(strings.TrimSpace(m[1]))
		if len(words) >= 2 {
			role := words[len(words)-1]
			if knownRoles[role] {
				fm["role"] = role
				fm["terrain_type"] = strings.Join(words[:len(words)-1], " ")
			}
		}
	}
}
```

In `StatblockParser.Parse`, after the existing `domain, category, subcategory := statblockDomain(…)` line (move that line up if it currently sits below the frontmatter assembly — it must run before this):

```go
	if domain == "fixture" {
		fm["statblock_kind"] = "fixture"
		applyFixtureGrid(fm, body)
	}
```

(`regexp` is already imported in `monster.go`.)

- [ ] **Step 4: Run the full package**

Run: `go test ./internal/content/`
Expected: ok — normal statblock tests unaffected (the fixture branch only fires for `domain == "fixture"`).

- [ ] **Step 5: Commit**

```bash
git add internal/content/monster.go internal/content/monster_test.go
git commit -m "feat: parse fixture statblock 2-col grid and role line (fixes FOLLOWUPS #6)"
```

---

### Task 9: featureblock.schema.json (both copies) + statblock schema additions

**Files:**
- Create: `steel-etl/schemas/featureblock.schema.json`
- Modify: `steel-etl/schemas/statblock.schema.json`
- Create: `data-sdk-npm/src/schema/featureblock.schema.json` (identical content)
- Modify: `data-sdk-npm/src/schema/statblock.schema.json` (same two properties)

- [ ] **Step 1: Write the new schema (steel-etl copy)**

`steel-etl/schemas/featureblock.schema.json`:

```json
{
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$id": "featureblock.schema.json-3.0.0",
    "title": "Draw Steel Featureblock",
    "description": "A titled collection of features under a loose-stat header: malice blocks, named feature blocks (e.g. Tactical Stance), and dynamic terrain. Unlike a statblock's fixed grid, featureblock stats are loose name/value pairs.",
    "type": "object",
    "required": ["name", "type", "features"],
    "unevaluatedProperties": false,
    "properties": {
        "name": {
            "type": "string",
            "description": "The featureblock's name (e.g. 'Basilisk Malice', 'Angry Beehive')."
        },
        "type": {
            "type": "string",
            "enum": ["featureblock", "dynamic-terrain"],
            "description": "Routing type. Dynamic terrain is a featureblock at the schema level; it keeps its own SCC hierarchy."
        },
        "kind": {
            "type": "string",
            "enum": ["malice", "feature"],
            "description": "Featureblock flavor (omitted for dynamic terrain): a malice block or a named feature block."
        },
        "level": {
            "type": "integer",
            "description": "Level qualifier ('Level 4+ Malice Features') or terrain level."
        },
        "flavor": {
            "type": "string",
            "description": "Intro/flavor prose (markdown-stripped first paragraph)."
        },
        "role": {
            "type": "string",
            "description": "Combat role for terrain (e.g. Hexer, Ambusher); drives the semantic accent color."
        },
        "terrain_type": {
            "type": "string",
            "description": "Terrain classifier (Hazard, Trap, Trigger, Siege Engine, Relic, Fortification)."
        },
        "stats": {
            "type": "array",
            "description": "Ordered loose header stats (e.g. EV / Stamina / Size). Values are free text ('1 per 10 x 10 thicket').",
            "items": {
                "type": "object",
                "required": ["name", "value"],
                "unevaluatedProperties": false,
                "properties": {
                    "name": { "type": "string" },
                    "value": { "type": "string" }
                }
            },
            "default": []
        },
        "features": {
            "type": "array",
            "description": "The block's features (non-lossy shape).",
            "items": { "$ref": "#/$defs/richFeature" },
            "default": []
        },
        "metadata": {
            "type": "object",
            "description": "Additional metadata (SCC, source, etc.).",
            "additionalProperties": true
        }
    },
    "$defs": {
        "richFeature": {
            "type": "object",
            "required": ["name"],
            "unevaluatedProperties": false,
            "properties": {
                "name": { "type": "string" },
                "icon": { "type": "string", "description": "Source emoji prefix (🗡 🏹 👤 ❗ ❇ ⭐ ☠ 🌀 …); drives the action accent for table-less features." },
                "cost": { "type": "string", "description": "'7 Malice', 'Signature', 'Villain Action 1', …" },
                "usage": { "type": "string", "description": "'Main action', 'Maneuver', 'Triggered action', …" },
                "keywords": { "type": "array", "items": { "type": "string" } },
                "distance": { "type": "string" },
                "target": { "type": "string" },
                "power_roll": {
                    "type": "object",
                    "required": ["tiers"],
                    "unevaluatedProperties": false,
                    "properties": {
                        "formula": { "type": "string", "description": "'+ 2' or '2d10 + R'; absent for a bare test result." },
                        "tiers": {
                            "type": "object",
                            "unevaluatedProperties": false,
                            "properties": {
                                "low": { "type": "string" },
                                "mid": { "type": "string" },
                                "high": { "type": "string" }
                            }
                        }
                    }
                },
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["label", "text"],
                        "unevaluatedProperties": false,
                        "properties": {
                            "label": { "type": "string" },
                            "text": { "type": "string" }
                        }
                    }
                },
                "enhancements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["cost", "text"],
                        "unevaluatedProperties": false,
                        "properties": {
                            "cost": { "type": "string" },
                            "text": { "type": "string" }
                        }
                    }
                },
                "body": { "type": "string", "description": "Prose of a table-less (passive) feature." },
                "trailing": { "type": "string", "description": "Prose after the structured parts of an ability." },
                "level": { "type": "integer", "description": "Advancement group level (fixture/retainer advancement)." }
            }
        }
    }
}
```

- [ ] **Step 2: Add the two statblock properties (steel-etl copy)**

In `steel-etl/schemas/statblock.schema.json`, after the `"with_captain"` property:

```json
        "statblock_kind": {
            "type": "string",
            "enum": ["fixture"],
            "description": "Marks non-creature statblock variants. Fixtures (Summoner book) use a loose 2-column stat header and render via the featureblock path."
        },
        "terrain_type": {
            "type": "string",
            "description": "Fixture classifier from the italic role line (e.g. 'Hazard' from 'Hazard Support')."
        },
```

(`role` already exists; fixtures reuse it.)

- [ ] **Step 3: Validate both JSON files parse**

Run: `python3 -m json.tool schemas/featureblock.schema.json > /dev/null && python3 -m json.tool schemas/statblock.schema.json > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit (steel-etl)**

```bash
git add schemas/featureblock.schema.json schemas/statblock.schema.json
git commit -m "feat: featureblock schema; statblock fixture fields (schema copy 1)"
```

- [ ] **Step 5: Mirror to the SDK copy (data-sdk-npm, v3 branch)**

```bash
cd ../data-sdk-npm
git rev-parse --abbrev-ref HEAD   # MUST print: v3 — stop and ask if not
cp ../steel-etl/schemas/featureblock.schema.json src/schema/featureblock.schema.json
```

Then apply the SAME two-property edit from Step 2 to `data-sdk-npm/src/schema/statblock.schema.json` (after its `with_captain` property — same JSON text).

```bash
python3 -m json.tool src/schema/featureblock.schema.json > /dev/null && python3 -m json.tool src/schema/statblock.schema.json > /dev/null && echo OK
git add src/schema/featureblock.schema.json src/schema/statblock.schema.json
git commit -m "feat: featureblock schema; statblock fixture fields (schema copy 2)"
cd ../steel-etl
```

Note: the schemas exist in two hand-synced copies BY DESIGN (`steel-etl/CLAUDE.md` → "Schemas live in two hand-synced copies"). Both commits must land.

---

### Task 10: SDK transformer + schema-validation allowlists

**Files:**
- Create: `steel-etl/internal/output/featureblock_transform.go`
- Modify: `steel-etl/internal/output/sdk_transform.go:26` (the `switch`)
- Modify: `steel-etl/internal/output/schema_validation_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `schema_validation_test.go`:

```go
func TestSchema_FeatureblockAllowedFields(t *testing.T) {
	cases := []struct {
		name string
		fm   map[string]any
	}{
		{"malice featureblock", map[string]any{
			"name": "Basilisk Malice", "type": "featureblock", "kind": "malice",
			"flavor": "At the start of any basilisk's turn…",
			"features": []map[string]any{
				{"name": "Walleye", "icon": "🔳", "cost": "7 Malice", "body": "Text."},
			},
		}},
		{"dynamic terrain", map[string]any{
			"name": "Angry Beehive", "type": "dynamic-terrain",
			"level": 2, "terrain_type": "Hazard", "role": "Hexer",
			"stats": []map[string]any{{"name": "EV", "value": "2"}},
			"features": []map[string]any{
				{"name": "Activate", "icon": "❕", "body": "Trigger text."},
			},
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			parsed := &content.ParsedContent{Frontmatter: tc.fm, Body: "raw body"}
			out := TransformToSDKFormat("mcdm.monsters.v1/monster.basilisks/x", parsed)
			for k := range out {
				if !schemaAllowedFields["featureblock"][k] {
					t.Errorf("field %q not in featureblock schema allowlist", k)
				}
			}
			if out["name"] == nil || out["type"] == nil || out["features"] == nil {
				t.Errorf("missing required featureblock fields: %+v", out)
			}
			if out["metadata"] == nil {
				t.Error("missing metadata")
			}
			if _, hasContent := out["content"]; hasContent {
				t.Error("featureblock must not fall through to passthrough (raw 'content' present)")
			}
		})
	}
}
```

And add to the `schemaAllowedFields` map (after the `"statblock"` entry):

```go
	"featureblock": {
		"name": true, "type": true, "kind": true, "level": true, "flavor": true,
		"role": true, "terrain_type": true, "stats": true, "features": true,
		"metadata": true,
	},
```

Also extend the existing `"statblock"` allowlist entry with the two new fields:

```go
		"statblock_kind": true, "terrain_type": true,
```

- [ ] **Step 2: Run to verify failure**

Run: `go test ./internal/output/ -run TestSchema_FeatureblockAllowedFields -v`
Expected: FAIL — passthrough emits `content`/unallowed keys

- [ ] **Step 3: Implement the transformer**

`steel-etl/internal/output/featureblock_transform.go` (complete file):

```go
package output

import (
	"github.com/SteelCompendium/steel-etl/internal/content"
)

// featureblockScalarKeys are frontmatter fields copied straight into SDK
// output. The parser builds features[]/stats[] at parse time (unlike
// statblocks, which re-parse the body here) — see featureblock.schema.json.
var featureblockScalarKeys = []string{
	"name", "type", "kind", "level", "flavor",
	"role", "terrain_type", "stats", "features",
}

// transformFeatureblock builds an SDK featureblock object (covers both
// `type: featureblock` and `type: dynamic-terrain`).
func transformFeatureblock(sccCode string, parsed *content.ParsedContent) map[string]any {
	out := map[string]any{}
	for _, key := range featureblockScalarKeys {
		if v, ok := parsed.Frontmatter[key]; ok {
			out[key] = v
		}
	}
	if _, ok := out["features"]; !ok {
		out["features"] = []map[string]any{}
	}
	out["metadata"] = map[string]any{"scc": sccCode, "source": extractSource(sccCode)}
	return out
}
```

In `sdk_transform.go`, add to the `switch contentType` (after the `"statblock"` case):

```go
	case "featureblock", "dynamic-terrain":
		return transformFeatureblock(sccCode, parsed)
```

- [ ] **Step 4: Run the output package**

Run: `go test ./internal/output/`
Expected: ok. If `conformance_test.go` or `dse` tests assert old passthrough output for featureblock/terrain samples, update those expectations to the new shape (the DSE path reads `ParsedContent` directly and is unaffected by design — only fix tests that asserted SDK JSON passthrough).

- [ ] **Step 5: Commit**

```bash
git add internal/output/featureblock_transform.go internal/output/sdk_transform.go internal/output/schema_validation_test.go
git commit -m "feat: SDK featureblock transformer for featureblock + dynamic-terrain"
```

---

### Task 11: Integration verification (full build, SCC stability, golden spot-checks)

**Files:** none modified — verification only. Run from the workspace root.

- [ ] **Step 1: Full test suite + vet**

Run: `devbox run -- bash -c "cd steel-etl && go test ./... && go vet ./..."`
Expected: all packages ok

- [ ] **Step 2: Full pipeline build**

Run: `devbox run -- bash -c "cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all"`
Expected: completes without new `WARN:` lines about featureblock/terrain (pre-existing warnings unrelated to this change are fine — compare against a pre-change run if unsure).

- [ ] **Step 3: SCC stability**

Run: `devbox run -- bash -c "cd steel-etl && go run ./cmd/steel-etl validate --config pipeline.yaml --scc-stable && go run ./cmd/steel-etl classify --config pipeline.yaml --diff"`
Expected: stable, empty diff — **zero SCC codes minted or changed**. If ANY code changed, stop: a TypePath was altered by mistake (Tasks 6–8 must not touch `TypePath` construction).

- [ ] **Step 4: Golden spot-checks of generated output**

```bash
# malice featureblock frontmatter gained kind/flavor/features:
devbox run -- yq '.kind, .flavor, (.features | length)' \
  data/data-rules/../data-bestiary/**/basilisk-malice.md 2>/dev/null \
  || grep -l "basilisk-malice" -r data/ | head -3
```

Locate the generated `basilisk-malice` markdown (path depends on output config — find it with the grep above), then verify with `yq --front-matter=extract`:
- `kind: malice`, `flavor:` starts with "At the start of any basilisk's turn", `features:` has 3 entries, `features[1].power_roll.tiers.low == "4 damage"`
- An `angry-beehive` file: `terrain_type: Hazard`, `role: Hexer`, `stats` has 3 ordered pairs
- A `the-boil` file: `statblock_kind: fixture`, `stamina: 20 + your level`, no `keywords` garbage
- The corresponding `.json` outputs contain the same fields and **no** raw `content` key for featureblocks

- [ ] **Step 5: Commit any test-data/golden updates and close out**

```bash
cd steel-etl && git status   # should be clean (data/ is gitignored build output)
```

Expected: clean tree. Plan 1 done — Plan 2 (site renderer + CSS + settings) builds on these fields.

---

## Self-review checklist (done at write time)

- **Spec coverage:** §1 parsers (Tasks 6–8), §2 schema both copies + transformer (Tasks 9–10), "no SCC mint" (Task 11 step 3), shared parser for later site use (Tasks 1–5). Site renderer / CSS / settings / retainer split / companion advancement are Plans 2–5 by design.
- **Known adaptation point:** test construction helpers (`newTestSection`, `context.NewContextStack`) must mirror the existing patterns in `dynamic_terrain_test.go` / `monster_test.go` — assertions are non-negotiable, construction lines adapt.
- **Type consistency:** `RichFeature`/`RichPowerRoll`/`RichSection`/`RichEnhancement` defined once (Task 1), consumed by Tasks 5–10; `stats[]` pairs use `{name, value}` everywhere (spec-aligned, matches the SDK's prior `FeatureStat` model).
