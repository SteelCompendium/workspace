# Fixture Advancement Coded Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 4 summoner fixtures' advancement members their own SCC codes (`feature.fixture.<category>.<base-id>.level-N/<member-id>`, ×12) and their own leaf pages, with the advancement card embedded on the base fixture page at build time — **without** changing any source heading levels.

**Architecture:** The advancement featureblock is a **sibling** of the base statblock (both children of the `@domain: fixture` monster-group), and the H1–H6 `ContextStack` cap means a member can never tree-nest under it. So instead of nesting, the advancement `FeatureblockParser` emits each member as a **parser-emitted coded child** (new `ParsedContent.CodedChildren` field), which a new pipeline pass classifies + writes as its own leaf page. Members stay as the existing `> ⭐️ **Name**` blockquotes, gaining only a per-member inline annotation. No `collectDeepHeadings` / `ContextStack` / heading-level change.

**Tech Stack:** Go (steel-etl pipeline), devbox toolchain, MkDocs/Material site builder. Spec: `docs/superpowers/specs/2026-06-19-fixture-advancement-coded-members-design.md` (read §2 — the decision record — first; it explains why the earlier "re-level to H3" approach was rejected).

## Global Constraints

- Run Go via devbox from the workspace root: `devbox run -- bash -c 'cd steel-etl && <cmd>'`. A bare `devbox run -- go …` fails.
- Branch is already `feat/fixture-advancement-coded-members` (off `origin/main`).
- **Never change fixture source heading levels** (faithful to the PDF outline): fixture group stays H5, base statblock + advancement block stay H7. Only add inline annotation comments + (Task 6) site rendering.
- Never hand-edit generated output (`data/*`, `v2/docs/Browse|Read|scc`). Source edits go in `steel-etl/input/...`.
- SCC scheme: members are `feature.fixture.<category>.<base-id>.level-<N>/<member-id>` under `mcdm.summoner.v1`. The 4 base `monster.fixture.<cat>.featureblock/<id>` and 4 container `monster.fixture.<cat>.advancement-features/<id>` codes must stay **unchanged**.
- Schemas live in two hand-synced copies (`steel-etl/schemas/` + `../data-sdk-npm/src/schema/`); any schema field change lands in BOTH.

---

### Task 1: `FeatureblockParser` fixture branch emits coded member children

Add a `CodedChildren` field to `ParsedContent` and have the fixture advancement-features branch populate it: one coded child per advancement member, code `feature.fixture.<category>.<base-id>.level-N/<member-id>`. Member id/level come from a per-member inline annotation when present, else derived (slug of name + the `> **Level N …**` band level).

**Files:**
- Modify: `steel-etl/internal/content/parser.go` (add `CodedChildren` field, ~line 36)
- Modify: `steel-etl/internal/content/monster.go` (fixture advancement branch, ~lines 233–243; add a member-annotation helper)
- Test: `steel-etl/internal/content/monster_test.go` (add a test)

**Interfaces:**
- Produces: `ParsedContent.CodedChildren []*ParsedContent` — extra coded entities (each with its own `Frontmatter`/`Body`/`TypePath`/`ItemID`) that the pipeline (Task 2) classifies + writes as leaf pages. Distinct from the existing embed-only `Children map[string]*ParsedContent`.
- Consumes: `ParseRichFeatures(body) []RichFeature` (each `RichFeature` has `.Name`, `.Level`, `.Body`), `parser.ExtractAnnotations(string) []parser.Annotation` (document-ordered; `.Fields["type"|"id"|"level"]`), `Slugify`, `compactPath`, `statblockDomain`.

- [ ] **Step 1: Add the `CodedChildren` field to `ParsedContent`**

In `steel-etl/internal/content/parser.go`, after the existing `Children` field (~line 36):

```go
	// Children holds parsed sub-content that should be embedded in the parent.
	// For example, a kit's signature ability is stored under "signature_ability".
	Children map[string]*ParsedContent

	// CodedChildren holds extra entities the parser mints from a container's body
	// (e.g. fixture advancement members parsed from blockquotes) that are NOT real
	// document sections but still get their own SCC code + leaf page. The pipeline
	// classifies and writes each one after the parent. Distinct from Children
	// (which is embed-only). See docs/superpowers/specs/2026-06-19-fixture-advancement-coded-members-design.md §5.
	CodedChildren []*ParsedContent
```

- [ ] **Step 2: Write the failing test**

Add to `steel-etl/internal/content/monster_test.go`:

```go
func TestFeatureblockParser_FixtureAdvancementCodedChildren(t *testing.T) {
	// The advancement featureblock body: two leveled bands, three members, each
	// member preceded by its inline annotation (the source form, Task 3).
	body := strings.Join([]string{
		"> **Level 5 Fixture Advancement Feature**",
		"",
		"<!-- @type: feature | @id: soul-rancor | @level: 5 -->",
		"> ⭐️ **Soul Rancor**",
		">",
		"> You gain a surge the first time your demon minions deal 3+ damage.",
		"",
		"> **Level 9 Fixture Advancement Feature**",
		"",
		"<!-- @type: feature | @id: size-increase | @level: 9 -->",
		"> ⭐️ **Size Increase**",
		">",
		"> The boil is now size 3.",
		"",
		"<!-- @type: feature | @id: fester-field | @level: 9 -->",
		"> ⭐️ **Fester Field**",
		">",
		"> Each non-abyssal enemy within 3 squares takes 5 corruption damage.",
	}, "\n")
	fb := newSection("The Boil Advancement Features", 6,
		map[string]string{"type": "featureblock", "id": "the-boil"}, body)

	ctx := context.NewContextStack(nil)
	ctx.Push(3, map[string]string{"domain": "fixture", "category": "demon"})

	p := &FeatureblockParser{}
	got, err := p.Parse(ctx, fb)
	if err != nil {
		t.Fatal(err)
	}
	// Container code unchanged (Plan 5c).
	if gotPath := strings.Join(got.TypePath, "/"); gotPath != "monster/fixture/demon/advancement-features" {
		t.Errorf("container TypePath = %q, want monster/fixture/demon/advancement-features", gotPath)
	}
	if got.ItemID != "the-boil" {
		t.Errorf("container ItemID = %q, want the-boil", got.ItemID)
	}
	// The card still gets its inline features[].
	if feats, ok := got.Frontmatter["features"].([]map[string]any); !ok || len(feats) != 3 {
		t.Fatalf("features = %v, want 3 inline members", got.Frontmatter["features"])
	}
	// And each member is now a coded child with a base-inclusive, leveled path.
	if len(got.CodedChildren) != 3 {
		t.Fatalf("CodedChildren = %d, want 3", len(got.CodedChildren))
	}
	want := []struct {
		path, id string
	}{
		{"feature/fixture/demon/the-boil/level-5", "soul-rancor"},
		{"feature/fixture/demon/the-boil/level-9", "size-increase"},
		{"feature/fixture/demon/the-boil/level-9", "fester-field"},
	}
	for i, w := range want {
		c := got.CodedChildren[i]
		if gotPath := strings.Join(c.TypePath, "/"); gotPath != w.path {
			t.Errorf("child[%d] TypePath = %q, want %q", i, gotPath, w.path)
		}
		if c.ItemID != w.id {
			t.Errorf("child[%d] ItemID = %q, want %q", i, c.ItemID, w.id)
		}
		if c.Frontmatter["type"] != "feature" {
			t.Errorf("child[%d] type = %v, want feature", i, c.Frontmatter["type"])
		}
		if strings.TrimSpace(c.Body) == "" {
			t.Errorf("child[%d] Body is empty, want the member prose", i)
		}
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_FixtureAdvancementCodedChildren -v'`
Expected: FAIL — `CodedChildren = 0, want 3` (the fixture branch doesn't emit children yet).

- [ ] **Step 4: Add the member-annotation helper**

In `steel-etl/internal/content/monster.go` (near `collectChildFeatures`, ~line 369), add a helper that reads the per-member inline annotations from a featureblock body in document order:

```go
// fixtureMemberAnn is one advancement member's explicit identity from its inline
// annotation (`<!-- @type: feature | @id: … | @level: … -->`), in document order.
type fixtureMemberAnn struct {
	id    string
	level int
}

// fixtureMemberAnnotations returns the per-member @type:feature annotations found
// in a fixture advancement-features body, in document order — one per `> ⭐️`
// member. ParseRichFeatures yields the members in the same order, so the two lists
// zip by index (see fixtureCodedChildren).
func fixtureMemberAnnotations(body string) []fixtureMemberAnn {
	var out []fixtureMemberAnn
	for _, a := range parser.ExtractAnnotations(body) {
		if a.Fields["type"] != "feature" {
			continue
		}
		m := fixtureMemberAnn{id: strings.TrimSpace(a.Fields["id"])}
		if lv := strings.TrimSpace(a.Fields["level"]); lv != "" {
			m.level, _ = strconv.Atoi(lv)
		}
		out = append(out, m)
	}
	return out
}

// fixtureCodedChildren builds one coded child per advancement member:
// feature.fixture.<category>.<baseID>.level-N/<memberID>. Member id/level come
// from the inline annotation when present, else derive (slug of name + band level).
func fixtureCodedChildren(feats []RichFeature, anns []fixtureMemberAnn, category, baseID string) []*ParsedContent {
	var children []*ParsedContent
	for i, f := range feats {
		memberID := Slugify(f.Name)
		level := f.Level
		if i < len(anns) {
			if anns[i].id != "" {
				memberID = anns[i].id
			}
			if anns[i].level != 0 {
				level = anns[i].level
			}
		}
		fm := map[string]any{"name": f.Name, "type": "feature"}
		typePath := []string{"feature", "fixture", category, baseID}
		if level != 0 {
			fm["level"] = level
			typePath = append(typePath, "level-"+strconv.Itoa(level))
		}
		children = append(children, &ParsedContent{
			Frontmatter: fm,
			Body:        strings.TrimSpace(f.Body),
			TypePath:    compactPath(typePath...),
			ItemID:      memberID,
		})
	}
	return children
}
```

- [ ] **Step 5: Emit the coded children from the fixture advancement branch**

In `steel-etl/internal/content/monster.go`, replace the fixture advancement branch (~lines 233–243):

```go
	if domain, category, _ := statblockDomain(ctx, section.HeadingLevel); domain == "fixture" {
		if feats := ParseRichFeatures(body); len(feats) > 0 {
			fm["features"] = RichFeatureMaps(feats)
		}
		return &ParsedContent{
			Frontmatter: fm,
			Body:        body,
			TypePath:    compactPath("monster", "fixture", category, "advancement-features"),
			ItemID:      id,
		}, nil
	}
```

with:

```go
	if domain, category, _ := statblockDomain(ctx, section.HeadingLevel); domain == "fixture" {
		// Members stay inline (the card's features[]) AND become coded children:
		// each mints feature.fixture.<category>.<base>.level-N/<id> + its own leaf
		// page (parser-emitted, not a tree section — the level-6 cap forbids
		// nesting them under this block). Spec §5; container code unchanged.
		feats := ParseRichFeatures(body)
		if len(feats) > 0 {
			fm["features"] = RichFeatureMaps(feats)
		}
		return &ParsedContent{
			Frontmatter:   fm,
			Body:          body,
			TypePath:      compactPath("monster", "fixture", category, "advancement-features"),
			ItemID:        id,
			CodedChildren: fixtureCodedChildren(feats, fixtureMemberAnnotations(body), category, id),
		}, nil
	}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_FixtureAdvancementCodedChildren -v'`
Expected: PASS

- [ ] **Step 7: Run the full content package to check for regressions**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/'`
Expected: PASS (no featureblock/companion/retainer regressions)

- [ ] **Step 8: Commit**

```bash
git add steel-etl/internal/content/parser.go steel-etl/internal/content/monster.go steel-etl/internal/content/monster_test.go
git commit -m "feat(scc): fixture advancement members become parser-emitted coded children"
```

---

### Task 2: Pipeline classifies + writes `CodedChildren` as leaf pages

The pipeline currently mints a code + leaf page only for real document sections. Teach the classification walk to also process `parsed.CodedChildren`, and guard the deferred PageBody render against the (section-less) children.

**Files:**
- Modify: `steel-etl/internal/pipeline/pipeline.go` (the `walk` classify block ~lines 173–202, and the deferred render loop ~lines 216–219)
- Test: `steel-etl/internal/pipeline/codedchildren_test.go` (create) + `steel-etl/testdata/fixtures/fixture_advancement.md` (create)

**Interfaces:**
- Consumes: `ParsedContent.CodedChildren` (Task 1).
- Produces: each coded child gets `scc` frontmatter, a registry entry, and a deferred `pendingWrite` (so every generator writes its leaf), exactly like a classified section.

- [ ] **Step 1: Create the test fixture**

Create `steel-etl/testdata/fixtures/fixture_advancement.md`:

```markdown
<!-- @type: monster-group | @domain: fixture | @category: demon -->
##### Demon Portfolio Fixture

Lore about the boil.

<!-- @type: statblock -->
####### The Boil

*Hazard Support*

| **Stamina:** 20 + your level | **Size:** 2 |
|------------------------------|------------:|

> ⭐️ **Hunger Thrush**
>
> Inline base ability, stays uncoded.

<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
<!-- @type: feature | @id: soul-rancor | @level: 5 -->
> ⭐️ **Soul Rancor**
>
> You gain a surge the first time your demon minions deal 3+ damage.

> **Level 9 Fixture Advancement Feature**
>
<!-- @type: feature | @id: fester-field | @level: 9 -->
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy within 3 squares takes 5 corruption damage.
```

- [ ] **Step 2: Write the failing test**

Create `steel-etl/internal/pipeline/codedchildren_test.go`:

```go
package pipeline

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// A fixture advancement-features block's members are parser-emitted coded children;
// the pipeline must register each one's SCC code (the registry file records it)
// while the base/container codes are untouched.
func TestPipeline_FixtureCodedChildrenRegistered(t *testing.T) {
	inputPath := "../../testdata/fixtures/fixture_advancement.md"
	baseDir := t.TempDir()
	registryPath := filepath.Join(t.TempDir(), "classification.json")

	cfg := &Config{
		Input:  inputPath,
		Locale: "en",
		Output: OutputConfig{
			BaseDir:  baseDir,
			Variants: VariantsConfig{Linked: true},
		},
		Classification: ClassificationConfig{Registry: registryPath},
	}
	if _, err := RunWithConfig(cfg, inputPath, "", registryPath); err != nil {
		t.Fatalf("pipeline run: %v", err)
	}

	data, err := os.ReadFile(registryPath)
	if err != nil {
		t.Fatalf("read registry: %v", err)
	}
	reg := string(data)
	for _, code := range []string{
		"feature.fixture.demon.the-boil.level-5/soul-rancor",
		"feature.fixture.demon.the-boil.level-9/fester-field",
		"monster.fixture.demon.advancement-features/the-boil", // container unchanged
		"monster.fixture.demon.featureblock/the-boil",         // base unchanged
	} {
		if !strings.Contains(reg, code) {
			t.Errorf("registry missing expected code %q", code)
		}
	}
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run TestPipeline_FixtureCodedChildrenRegistered -v'`
Expected: FAIL — the two `feature.fixture.*` member codes are missing (the pipeline ignores `CodedChildren`).

- [ ] **Step 4: Classify the coded children in the walk**

In `steel-etl/internal/pipeline/pipeline.go`, inside `walk`, immediately **after** the parent's `pending = append(...)` line (~line 199) and **before** `walk(section.Children)` (~line 202), add:

```go
			// Parser-emitted coded children (e.g. fixture advancement members):
			// classify + register + write each as its own leaf, like a section.
			for _, child := range parsed.CodedChildren {
				if child.TypePath == nil || child.ItemID == "" {
					continue
				}
				childCode := scc.Classify(bookSource, child.TypePath, child.ItemID)
				child.Frontmatter["scc"] = childCode
				sccRegistry.Add(childCode)
				result.ClassifiedSections++
				if prev, exists := seenSCC[childCode]; exists {
					result.Errors = append(result.Errors, fmt.Sprintf("duplicate SCC %s: %q overwrites %q", childCode, fmt.Sprint(child.Frontmatter["name"]), prev))
				}
				seenSCC[childCode] = fmt.Sprint(child.Frontmatter["name"])
				pending = append(pending, pendingWrite{section: nil, parsed: child, sccCode: childCode})
			}
```

- [ ] **Step 5: Guard the deferred PageBody render against section-less children**

In the deferred write loop (~lines 216–219), the `RenderSubtree(pw.section, …)` call must not run for coded children (whose `section` is nil). Change:

```go
	for _, pw := range pending {
		if t, _ := pw.parsed.Frontmatter["type"].(string); t != "monster" {
			pw.parsed.PageBody = content.RenderSubtree(pw.section, sccBySection)
		}
```

to:

```go
	for _, pw := range pending {
		if t, _ := pw.parsed.Frontmatter["type"].(string); pw.section != nil && t != "monster" {
			pw.parsed.PageBody = content.RenderSubtree(pw.section, sccBySection)
		}
```

(A coded child leaves `PageBody` empty, so reading-format generators fall back to its `Body` — the member prose — which is exactly the "page containing just the feature" we want.)

- [ ] **Step 6: Run the test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run TestPipeline_FixtureCodedChildrenRegistered -v'`
Expected: PASS

- [ ] **Step 7: Run the pipeline package**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/'`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add steel-etl/internal/pipeline/pipeline.go steel-etl/internal/pipeline/codedchildren_test.go steel-etl/testdata/fixtures/fixture_advancement.md
git commit -m "feat(scc): pipeline classifies + writes parser-emitted coded children as leaves"
```

---

### Task 3: Source — annotate The Boil's advancement members (the pilot)

Add a per-member inline annotation to the demon fixture's advancement block. **No heading levels change.** This is the model for the other 3 (Task 5).

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md` (~lines 1510–1527, the demon advancement block)

- [ ] **Step 1: Add the member annotations**

In `steel-etl/input/summoner/Draw Steel Summoner.md`, the demon advancement block currently reads:

```
<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
> ⭐️ **Soul Rancor**
>
> You gain a [surge](scc.v1:…) the first time in a round that your demon [minions](scc.v1:…)…

> **Level 9 Fixture Advancement Feature**
>
> ⭐️ **Size Increase**
>
> The boil is now size 3.
>
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy that starts their [turn](scc.v1:…) within 3 squares…
```

Insert one annotation comment immediately before each `> ⭐️ **Name**` member (heading levels, labels, blockquote prose, and every `scc.v1:` link stay **exactly** as-is):

```
<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
<!-- @type: feature | @id: soul-rancor | @level: 5 -->
> ⭐️ **Soul Rancor**
>
> You gain a [surge](scc.v1:…) the first time in a round that your demon [minions](scc.v1:…)…

> **Level 9 Fixture Advancement Feature**
>
<!-- @type: feature | @id: size-increase | @level: 9 -->
> ⭐️ **Size Increase**
>
> The boil is now size 3.
>
<!-- @type: feature | @id: fester-field | @level: 9 -->
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy that starts their [turn](scc.v1:…) within 3 squares…
```

(The `…` above stand for the existing link markup — do not alter it. The annotation goes at column 0, between the blockquote lines; it splits the blockquote harmlessly — `splitBlockquoteBlocks` already separates members by their `⭐️ **Title**` line and the band level persists.)

- [ ] **Step 2: Regenerate the Summoner book and confirm no errors/duplicates**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --book summoner --config pipeline.yaml 2>&1 | grep -iE "error|duplicate" | head'`
Expected: no error/duplicate lines.

- [ ] **Step 3: Confirm the 3 demon member codes minted**

Run: `devbox run -- bash -c 'cd steel-etl && grep -oE "feature\.fixture\.demon\.the-boil\.level-[0-9]+/[a-z-]+" classification.json | sort -u'`
Expected:
```
feature.fixture.demon.the-boil.level-5/soul-rancor
feature.fixture.demon.the-boil.level-9/fester-field
feature.fixture.demon.the-boil.level-9/size-increase
```

- [ ] **Step 4: Commit**

```bash
git add "steel-etl/input/summoner/Draw Steel Summoner.md"
git commit -m "feat(summoner): annotate The Boil advancement members for coding"
```

---

### Task 4: Integration test — source shape → codes via `ParseDocument`

Lock the source-shape→codes contract (annotated blockquote members under a `@domain: fixture` advancement block become coded children) so a future source edit can't silently drop the member codes.

**Files:**
- Test: `steel-etl/internal/content/monster_test.go` (add a `ParseDocument`-based test)

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/monster_test.go`:

```go
func TestFixtureAdvancementCodedChildren_ViaParseDocument(t *testing.T) {
	src := []byte(strings.Join([]string{
		"<!-- @type: monster-group | @domain: fixture | @category: demon -->",
		"##### Demon Portfolio Fixture", "", "Lore.", "",
		"<!-- @type: statblock -->",
		"####### The Boil", "", "*Hazard Support*", "",
		"| **Stamina:** 20 + your level | **Size:** 2 |",
		"|------------------------------|------------:|", "",
		"> ⭐️ **Hunger Thrush**", ">", "> Inline base ability.", "",
		"<!-- @type: featureblock | @id: the-boil -->",
		"####### The Boil Advancement Features", "",
		"> **Level 5 Fixture Advancement Feature**", ">",
		"<!-- @type: feature | @id: soul-rancor | @level: 5 -->",
		"> ⭐️ **Soul Rancor**", ">", "> Surge body.", "",
		"> **Level 9 Fixture Advancement Feature**", ">",
		"<!-- @type: feature | @id: fester-field | @level: 9 -->",
		"> ⭐️ **Fester Field**", ">", "> Corruption body.", "",
	}, "\n"))

	doc, err := parser.ParseDocument(src)
	if err != nil {
		t.Fatal(err)
	}
	// Find the advancement featureblock section in the parsed tree.
	var fb *parser.Section
	var walk func(ss []*parser.Section)
	walk = func(ss []*parser.Section) {
		for _, s := range ss {
			if s.Type() == "featureblock" && s.ID() == "the-boil" {
				fb = s
			}
			walk(s.Children)
		}
	}
	walk(doc.Sections)
	if fb == nil {
		t.Fatal("advancement featureblock @id:the-boil not found in parsed tree")
	}

	ctx := context.NewContextStack(nil)
	ctx.Push(3, map[string]string{"domain": "fixture", "category": "demon"})
	got, err := (&FeatureblockParser{}).Parse(ctx, fb)
	if err != nil {
		t.Fatal(err)
	}
	if len(got.CodedChildren) != 2 {
		t.Fatalf("CodedChildren = %d, want 2", len(got.CodedChildren))
	}
	if strings.Join(got.CodedChildren[0].TypePath, "/") != "feature/fixture/demon/the-boil/level-5" ||
		got.CodedChildren[0].ItemID != "soul-rancor" {
		t.Errorf("child[0] = %v/%q, want feature/fixture/demon/the-boil/level-5/soul-rancor",
			got.CodedChildren[0].TypePath, got.CodedChildren[0].ItemID)
	}
}
```

- [ ] **Step 2: Run it**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFixtureAdvancementCodedChildren_ViaParseDocument -v'`
Expected: PASS (Tasks 1–3 make this hold). If it FAILS at "featureblock not found", the deep-heading parse of the H7 advancement block changed — re-check the source heading convention.

- [ ] **Step 3: Commit**

```bash
git add steel-etl/internal/content/monster_test.go
git commit -m "test(scc): lock fixture advancement source-shape → coded members"
```

---

### Task 5: Source — annotate the remaining 3 fixtures

Apply the exact Task 3 annotation pass to elemental, fey, and undead. **No heading changes.**

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md` (elemental ~lines 1550–1567, fey ~lines 1590–1607, undead ~lines 1630–1647)

- [ ] **Step 1: Annotate each fixture's members**

Insert a `<!-- @type: feature | @id: <slug> | @level: <N> -->` comment immediately before each `> ⭐️ **Name**` member, exactly as Task 3. Members per fixture (`@id` = slug of the existing name; `@level` = the band it sits under):

- **Elemental** (`@id: primordial-crystal` block): `terra-resonance` (level 5), `size-increase` (level 9), `magnified-strike` (level 9).
- **Fey** (`@id: glade-pond` block): `garden-of-jest` (level 5), `size-increase` (level 9), `folly-field` (level 9).
- **Undead** (`@id: barrow-gates` block): `memento-mori` (level 5), `size-increase` (level 9), `open-the-gates` (level 9).

- [ ] **Step 2: Regenerate and confirm all 12 codes**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --book summoner --config pipeline.yaml >/dev/null 2>&1 && grep -oE "feature\.fixture\.[a-z-]+\.[a-z-]+\.level-[0-9]+/[a-z-]+" classification.json | sort -u'`
Expected: exactly 12 lines — 3 each for `demon.the-boil`, `elemental.primordial-crystal`, `fey.glade-pond`, `undead.barrow-gates`.

- [ ] **Step 3: Commit**

```bash
git add "steel-etl/input/summoner/Draw Steel Summoner.md"
git commit -m "feat(summoner): annotate elemental/fey/undead advancement members for coding"
```

---

### Task 6: Site — embed the advancement card on the base page; retire fixture pairing

With members coded and the advancement block still its own leaf, make the v2 site render the advancement card **on the base fixture's page** at build time, and stop the Plan-5c side-by-side *pairing* of fixtures on the group index. This task is **output-driven**: make the known edits, regenerate, diff the Browse tree, and adjust until the acceptance criteria hold.

**Files:**
- `steel-etl/internal/site/advancement_pairs.go` — `buildAdvancementPairContent` / `advancementPairNavOrder` fixture handling (`pathHasSegment(dir, "fixture")`, ~line 148)
- `steel-etl/internal/site/build.go` — where a fixture base leaf page body is finalized (the `buildSection` leaf-transform chain; `buildFeatureblockPage` for the base) and where a paired advancement code can be injected as a `{data-scc}` embed marker
- `steel-etl/internal/site/embed_cards.go` — the existing `{data-scc}` transclusion post-pass (no change expected; it must fire once the base page carries the advancement's marker)
- `steel-etl/internal/site/bestiary_search.go` — fixture facet (confirm member leaves excluded)

- [ ] **Step 1: Baseline — build the site and capture the fixture Browse tree**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml >/dev/null 2>&1 && go run ./cmd/steel-etl site --config ../v2/site.yaml >/dev/null 2>&1'
find v2/docs/Browse -path '*fixture*' -name '*.md' | sort
```
Expected: base fixture pages + advancement-features leaves under `Browse/monster/fixture/<category>/…`, plus new member leaves under `Browse/feature/fixture/<category>/<base>/level-N/…`. Note any double-listing or orphan folder cards.

- [ ] **Step 2: Retire the fixture branch of the pairing**

In `steel-etl/internal/site/advancement_pairs.go`, remove fixtures from the pairing path so they no longer render as side-by-side base+advancement cards on the group index (keep the **companion** and **retainer** branches intact). Concretely: make `buildAdvancementPairContent` / `advancementPairNavOrder` return `ok=false` for `pathHasSegment(dir, "fixture")` dirs (so fixtures fall through to the default index/leaf builders), or drop the `fixture` arm of the `baseEyebrow, icon` switch and the pairing it drives — whichever the regenerated tree shows is cleanest. Re-run Step 1's build and confirm the fixture group index no longer shows paired cards.

- [ ] **Step 3: Inject the advancement embed marker onto the base fixture page**

The advancement featureblock is a sibling of the base, so `RenderSubtree(base)` does not carry its `{data-scc}` marker and `embed_cards.go` won't transclude it. In `build.go`, when finalizing a fixture **base** leaf page (`type: featureblock` under `monster/fixture/<cat>/`), append a heading carrying the paired advancement code, e.g.:

```
## <Base Name> Advancement Features {data-scc="<adv-code>"}
```

where `<adv-code>` is the `scc` from the sibling `…advancement-features/<base-id>` leaf (discoverable via the same base↔advancement filename pairing `advancementPairs` already computes). The existing `embed_cards.go` post-pass then replaces that heading with the finished advancement card inline on the base page. Re-run Step 1's build.

- [ ] **Step 4: Confirm the advancement card embeds on the base page**

Run: `grep -l 'fb__band--adv' v2/docs/Browse/monster/fixture/demon/the-boil.md`
Expected: the base page (`the-boil.md`) body now contains the advancement Forged Band card with its Level-5/9 tiers and per-member `{data-scc}` permalink markers. If it does not embed, verify Step 3's marker code matches `dataSCCHeadingRe` in `embed_cards.go` and that the advancement leaf is `cardable`.

- [ ] **Step 5: Confirm bestiary facets + member leaves**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml >/dev/null 2>&1'; ls v2/docs/Browse/feature/fixture/demon/the-boil/level-5/`
Expected: each base fixture still indexed as a `"fixture"` bestiary facet (inspect `bestiary_search.go` output); the `feature.fixture.*` member leaf pages exist and are **excluded** from the bestiary index (they are `type: feature`, so already excluded — confirm no fixture-member rows appear in the bestiary mount data).

- [ ] **Step 6: Acceptance — rebuild and verify the four criteria**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'`
Then rebuild the site (Step 1 command) and verify, for The Boil:
1. Base fixture card renders (inline base abilities only), under `Browse/monster/fixture/demon/`.
2. The advancement Forged Band card (Level-5/9 tiers) is embedded on the base page, with per-member permalink icons.
3. Each member resolves to its own leaf page (`Browse/feature/fixture/demon/the-boil/level-5/soul-rancor/` etc.) containing just that feature.
4. No duplicate/orphan fixture folder cards; fixtures still appear in the Bestiary tab.

Expected: all four hold; `go test ./...` green.

- [ ] **Step 7: Commit**

```bash
git add steel-etl/internal/site/
git commit -m "feat(site): fixtures embed advancement card on base page; retire fixture pairing"
```

---

### Task 7: Full-pipeline verification — `classify --diff` is exactly +12

**Files:** none (verification only)

- [ ] **Step 1: Regenerate all books**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml'`
Expected: completes without errors.

- [ ] **Step 2: Confirm the container/base codes are unchanged**

Run: `devbox run -- bash -c 'cd steel-etl && grep -oE "monster\.fixture\.[a-z-]+\.(featureblock|advancement-features)/[a-z-]+" classification.json | sort -u'`
Expected: 8 lines — `featureblock/<base>` ×4 and `advancement-features/<base>` ×4 (the-boil, primordial-crystal, glade-pond, barrow-gates), **unchanged**.

- [ ] **Step 3: Confirm the SCC delta is only the 12 new member codes**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --diff 2>&1 | head -40'`
Expected: additions are only the 12 `feature.fixture.*.level-N/<member>` codes; no statblock/minion/champion/rival/retainer code changed; no removals beyond the (now-annotated) fixtures' prior state.

- [ ] **Step 4: Schema validation + full test suite**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/output/ ./internal/content/ ./internal/site/ ./internal/pipeline/'`
Expected: PASS. If `schema_validation_test.go` rejects the fixture advancement featureblock's embedded `features[]` or the new member-feature leaves, add the fixture variant to its allowlist exactly as the companion variant is allowed (and mirror any schema-field change in BOTH `steel-etl/schemas/` and `data-sdk-npm/src/schema/` — dual-schema-sync rule).

- [ ] **Step 5: Commit (if any allowlist/schema change was needed)**

```bash
git add steel-etl/internal/output/ steel-etl/schemas/ ../data-sdk-npm/src/schema/ 2>/dev/null
git commit -m "test(schema): accept fixture advancement coded members" || echo "no schema change needed"
```

---

### Task 8: Link validation + linking-reference (hand-curated)

⚠️ `summoner-linking-reference.md` is **manually curated and canonical** (the old generator was retired). Hand-add the 12 new codes; there is no regen command.

**Files:**
- Modify: `steel-etl/docs/summoner-linking-reference.md`

- [ ] **Step 1: Validate no dangling links and that the 12 codes resolve**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --scc-stable 2>&1 | tail -20'`
Expected: no new dangling `scc:` links (0 inbound links to these today, so nothing breaks); the 12 codes are registered.

- [ ] **Step 2: Hand-add the 12 fixture-member codes to the Summoner reference**

Edit `steel-etl/docs/summoner-linking-reference.md`: add the 12 `feature.fixture.<category>.<base>.level-N/<member>` codes as linkable targets (one row per member, with display name + variants), following the file's existing table format. If there's a fixtures section, extend it; else add a "Fixture Advancement Features" subsection. Match the curation style of neighboring entries.

- [ ] **Step 3: Commit**

```bash
git add steel-etl/docs/summoner-linking-reference.md
git commit -m "docs(linking): add fixture advancement member codes to summoner linking reference"
```

---

### Task 9: Docs & bookkeeping

**Files:**
- Modify: `docs/scc-log.md`, `docs/scc-reference.md`, workspace `CLAUDE.md`, `steel-etl/CLAUDE.md`, `steel-etl/docs/statblocks.md`, `DESIGN.md`, `ROADMAP.md`
- Modify: `/home/scott/.claude/projects/-home-scott-code-steelCompendium-workspace/memory/featureblock-refactor-in-flight.md`

- [ ] **Step 1: Append a dated `docs/scc-log.md` entry**

Dated 2026-06-19: fixtures' advancement members now coded `feature.fixture.<category>.<base>.level-N/<member>` (×12; enumerate or summarize); minted via a new **parser-emitted coded-children** pipeline capability (`ParsedContent.CodedChildren`) from annotated `> ⭐️` blockquotes — **no source re-leveling, no `ContextStack`/`collectDeepHeadings` change** (headers stay faithful to the PDF; advancement block remains a sibling of the base). Advancement card now **embedded on the base fixture page** at build time; Plan-5c fixture *pairing* retired. Base `monster.fixture.*.featureblock/*` + container `…advancement-features/*` codes **unchanged**; registry +12. Note this shipped ROADMAP #16 (split from #15).

- [ ] **Step 2: Update `docs/scc-reference.md` + workspace `CLAUDE.md` SCC summary**

`docs/scc-reference.md`: under the fixture/summoner section, document `feature.fixture.<category>.<base>.level-N/<member>` + the registry bump. Workspace `CLAUDE.md` SCC paragraph (the "~3,072 codes" line): bump the count by 12 and note fixtures' advancement members are coded.

- [ ] **Step 3: Update `steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md`**

In `statblocks.md` (Fixture rendering / Summoner book reuse) + the `steel-etl/CLAUDE.md` Statblocks bullets: fixture advancement members are coded via the **parser-emitted coded-children** mechanism (`FeatureblockParser` fixture branch → `ParsedContent.CodedChildren` → pipeline classify/write); the advancement block stays a *sibling* of the base (no nesting, no heading/cap change), and its card is embedded on the base page at build time; Plan-5c pairing retired; base abilities stay inline (intentional divergence from companions). Note the new `CodedChildren` capability generalizes to other blockquote members (ROADMAP #15).

- [ ] **Step 4: Update `DESIGN.md` + `ROADMAP.md`**

`DESIGN.md`: the fixture advancement card is now an embedded (companion-style placement) Forged Band instance on the base fixture page. `ROADMAP.md`: mark **#16** `**Status:** done`; confirm **#15**'s narrowed scope + framing-correction note (already added 2026-06-19) still reads correctly now that the mechanism shipped.

- [ ] **Step 5: Update the in-flight memory note**

In `featureblock-refactor-in-flight.md`: update the 2026-06-19 entry from "design redone / plan to follow" to "shipped" — fixture members coded via `CodedChildren`; mechanism available for reuse; statblock/retainer per-ability coding still deferred (#15). Update the `MEMORY.md` pointer line if its hook changed.

- [ ] **Step 6: Commit**

```bash
git add docs/ CLAUDE.md DESIGN.md ROADMAP.md steel-etl/CLAUDE.md "steel-etl/docs/statblocks.md"
git commit -m "docs: fixture advancement coded members (parser-emitted children) — scc-log, reference, statblocks, roadmap"
```

---

## Final verification (before declaring done)

Run from the workspace root:

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml >/dev/null && go run ./cmd/steel-etl classify --diff 2>&1 | head -40'
```

Expected: build/vet/test green; `classify --diff` shows **only** the +12 `feature.fixture.*.level-N/<member>` additions (base + container codes unchanged). Spot-check a rendered fixture page per Task 6 Step 6. **Do not deploy** — deploy is decided separately by Scott.
