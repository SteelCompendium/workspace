# Fixture Advancement Coded Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 4 summoner fixtures' advancement-features members their own SCC codes (`feature.fixture.<category>.<base-id>.level-N/<member-id>`) by adopting the beastheart-companion model — real nested `@type: feature` child sections, embedded in the advancement card and transcluded onto the base fixture page.

**Architecture:** Reuse the proven companion machinery (`collectChildFeatures`, the `FeatureParser` companion branch, `embed_cards.go`). The fixtures move from the flat H7 statblock zone into shallow (≤H6) headings so the advancement featureblock nests under the base and its members nest under it — **no change** to `collectDeepHeadings` / `ContextStack`. Each advancement member becomes a coded `feature` section; the advancement featureblock keeps its existing `monster.fixture.<category>.advancement-features/<base-id>` code (only its tree position changes). Fixture *base* abilities stay inline/uncoded.

**Tech Stack:** Go (steel-etl pipeline), devbox toolchain, MkDocs/Material site builder. Spec: `docs/superpowers/specs/2026-06-19-fixture-advancement-coded-members-design.md`.

**Conventions for every task:**
- Run Go via devbox from the workspace root: `devbox run -- bash -c 'cd steel-etl && <cmd>'`.
- Branch is already `feat/fixture-advancement-coded-members` (off `origin/main`).
- Never hand-edit generated output (`data/*`, `v2/docs/Browse|Read|scc`). Source edits go in `steel-etl/input/...`.

---

### Task 1: `FeatureParser` fixture branch — code an advancement member

A `@type: feature` under fixture context (`@domain: fixture` group + a `@fixture: <base-id>` key on the enclosing advancement featureblock) must classify as `feature.fixture.<category>.<base-id>.level-<N>/<member-id>`, mirroring the companion branch.

**Files:**
- Modify: `steel-etl/internal/content/feature.go` (the type-path build, ~lines 119–140)
- Test: `steel-etl/internal/content/feature_test.go` (add a test; file already exists)

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/feature_test.go`:

```go
func TestFeatureParser_FixtureAdvancementMember(t *testing.T) {
	// Simulate the context a Level-5 fixture advancement feature sees:
	//   monster-group  @domain: fixture | @category: demon   (pushed at H3)
	//   featureblock   @id: the-boil   | @fixture: the-boil   (pushed at H5)
	//   feature        @id: soul-rancor | @level: 5           (pushed at H6, its own level)
	ctx := context.NewContextStack(nil)
	ctx.Push(3, map[string]string{"domain": "fixture", "category": "demon"})
	ctx.Push(5, map[string]string{"type": "featureblock", "id": "the-boil", "fixture": "the-boil"})
	ctx.Push(6, map[string]string{"type": "feature", "id": "soul-rancor", "level": "5"})

	sec := newSection("Soul Rancor", 6,
		map[string]string{"type": "feature", "id": "soul-rancor", "level": "5"},
		"You gain a surge the first time your demon minions deal 3+ damage.")

	p := &FeatureParser{}
	got, err := p.Parse(ctx, sec)
	if err != nil {
		t.Fatal(err)
	}
	if got.Frontmatter["type"] != "feature" {
		t.Errorf("type = %v, want feature (not trait/ability)", got.Frontmatter["type"])
	}
	if gotPath := strings.Join(got.TypePath, "/"); gotPath != "feature/fixture/demon/the-boil/level-5" {
		t.Errorf("TypePath = %q, want feature/fixture/demon/the-boil/level-5", gotPath)
	}
	if got.ItemID != "soul-rancor" {
		t.Errorf("ItemID = %q, want soul-rancor", got.ItemID)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureParser_FixtureAdvancementMember -v'`
Expected: FAIL — `TypePath = "feature/level-5"` (or similar) because no fixture branch exists yet.

- [ ] **Step 3: Implement the fixture branch**

In `steel-etl/internal/content/feature.go`, find the companion species lookup (currently ~line 68):

```go
	// Companion species (beastheart book) takes precedence over class in the path.
	companionID, _ := ctx.Lookup(section.HeadingLevel, "companion")
```

Immediately after it, add the fixture lookups:

```go
	// Fixture base-id (summoner book): the enclosing advancement featureblock
	// pushes @fixture: <base-id> so its child @type:feature members can resolve
	// the owning fixture without colliding with their own @id. Category comes
	// from the @domain: fixture monster-group ancestor.
	fixtureID, _ := ctx.Lookup(section.HeadingLevel, "fixture")
	_, fixtureCategory, _ := statblockDomain(ctx, section.HeadingLevel)
```

Then, in the hub-and-spoke type-path build (the `if companionID != "" { ... } else if classID != "" { ... }` chain, ~lines 119–140), insert a fixture arm immediately **after** the companion arm and **before** `else if classID != ""`:

```go
	if companionID != "" {
		// ... existing companion arm unchanged ...
	} else if fixtureID != "" {
		// Fixture advancement features: feature.fixture.<category>.<base-id>.level-N/<id>,
		// mirroring the monster.fixture.<category>.advancement-features/<base-id> container.
		typePath = append(typePath, "fixture")
		if fixtureCategory != "" {
			typePath = append(typePath, fixtureCategory)
		}
		typePath = append(typePath, fixtureID)
	} else if classID != "" {
		typePath = append(typePath, classID)
	} else if ancestryID != "" {
```

(The trailing `level-<N>` segment is appended by the existing `if levelStr != "" { typePath = append(typePath, "level-"+levelStr) }` block, since `@level: 5` is pushed at the feature's own level and read via `ctx.Lookup(section.HeadingLevel, "level")`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureParser_FixtureAdvancementMember -v'`
Expected: PASS

- [ ] **Step 5: Run the full content package to check for regressions**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/'`
Expected: PASS (no companion/feature regressions)

- [ ] **Step 6: Commit**

```bash
git add steel-etl/internal/content/feature.go steel-etl/internal/content/feature_test.go
git commit -m "feat(scc): code fixture advancement members as feature.fixture.<cat>.<base>.level-N"
```

---

### Task 2: `FeatureblockParser` fixture branch — embed coded child features

The fixture advancement featureblock must embed its child `@type: feature` sections via `collectChildFeatures` (like companions) instead of parsing inline blockquote members from its body. Its container code is unchanged.

**Files:**
- Modify: `steel-etl/internal/content/monster.go` (fixture advancement branch, ~lines 230–243)
- Test: `steel-etl/internal/content/monster_test.go` (add a test)

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/monster_test.go`:

```go
func TestFeatureblockParser_FixtureAdvancementChildFeatures(t *testing.T) {
	// The advancement featureblock with two @type:feature children (Level 5 + Level 9).
	fb := newSection("The Boil Advancement Features", 5,
		map[string]string{"type": "featureblock", "id": "the-boil", "fixture": "the-boil"}, "")
	fb.Children = []*parser.Section{
		newSection("Soul Rancor", 6,
			map[string]string{"type": "feature", "id": "soul-rancor", "level": "5"},
			"You gain a surge the first time your demon minions deal 3+ damage."),
		newSection("Fester Field", 6,
			map[string]string{"type": "feature", "id": "fester-field", "level": "9"},
			"Each non-abyssal enemy within 3 squares takes 5 corruption damage."),
	}

	ctx := context.NewContextStack(nil)
	ctx.Push(3, map[string]string{"domain": "fixture", "category": "demon"})

	p := &FeatureblockParser{}
	got, err := p.Parse(ctx, fb)
	if err != nil {
		t.Fatal(err)
	}
	// Container code unchanged (Plan 5c).
	if gotPath := strings.Join(got.TypePath, "/"); gotPath != "monster/fixture/demon/advancement-features" {
		t.Errorf("TypePath = %q, want monster/fixture/demon/advancement-features", gotPath)
	}
	if got.ItemID != "the-boil" {
		t.Errorf("ItemID = %q, want the-boil", got.ItemID)
	}
	// Members come from the child @type:feature sections, with their levels.
	feats, ok := got.Frontmatter["features"].([]map[string]any)
	if !ok || len(feats) != 2 {
		t.Fatalf("features = %v, want 2 child features", got.Frontmatter["features"])
	}
	if feats[0]["name"] != "Soul Rancor" || feats[0]["level"] != 5 {
		t.Errorf("features[0] = %v, want Soul Rancor/level 5", feats[0])
	}
	if feats[1]["name"] != "Fester Field" || feats[1]["level"] != 9 {
		t.Errorf("features[1] = %v, want Fester Field/level 9", feats[1])
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_FixtureAdvancementChildFeatures -v'`
Expected: FAIL — `features` is empty/nil because the branch reads `ParseRichFeatures(body)` (the body has no inline members now).

- [ ] **Step 3: Swap inline parsing for child-feature collection**

In `steel-etl/internal/content/monster.go`, the fixture advancement branch currently reads (~lines 233–243):

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

Replace the inner feature collection so it uses the child `@type:feature` sections (the companion pattern):

```go
	if domain, category, _ := statblockDomain(ctx, section.HeadingLevel); domain == "fixture" {
		// Members are now real @type:feature child sections (each carrying its own
		// feature.fixture.<category>.<base>.level-N/<id> code), embedded render-only
		// — exactly like the companion advancement-features branch above.
		if feats := collectChildFeatures(section); len(feats) > 0 {
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_FixtureAdvancementChildFeatures -v'`
Expected: PASS

- [ ] **Step 5: Run the full content package**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/'`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add steel-etl/internal/content/monster.go steel-etl/internal/content/monster_test.go
git commit -m "feat(scc): embed fixture advancement child features via collectChildFeatures"
```

---

### Task 3: Source restructure — The Boil (demon fixture, the pilot)

Restructure the demon fixture in the book source: shift its subtree into shallow headings and convert its inline advancement members into `@type: feature` child sections. This is the model for the other 3 (Task 5).

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md` (~lines 1489–1528, the demon fixture)

- [ ] **Step 1: Apply the restructure**

Replace the demon fixture block. The base statblock body (grid + `> ⭐️ Hunger Thrush` / `> ⭐️ Oh, It Pops` inline abilities) is unchanged in content — only heading levels change. The advancement members lose their `> **Level N …**` labels (now `@level:`) and `> ⭐️` blockquote wrappers (now H6 headings + un-blockquoted body).

**Before** (current source):

```
<!-- @type: monster-group | @domain: fixture | @category: demon -->
##### Demon Portfolio Fixture

The boil arises from the chaotic depths…

<!-- @type: statblock -->
####### The Boil

*Hazard Support*

| **Stamina:** 20 + your level | **Size:** 2 |
|------------------------------|------------:|

> ⭐️ **Hunger Thrush**
>
> Each enemy that starts their turn within 3 squares…

> ⭐️ **Oh, It Pops**
>
> When the boil is destroyed, each enemy within 3 squares…

<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
> ⭐️ **Soul Rancor**
>
> You gain a surge the first time in a round that your demon minions…

> **Level 9 Fixture Advancement Feature**
>
> ⭐️ **Size Increase**
>
> The boil is now size 3.
>
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy that starts their turn within 3 squares…
```

**After** (note: group `#####`→`###`, base `#######`→`####`, advancement `#######`→`#####`, members become `######` `@type: feature` sections; `@fixture: the-boil` added to the featureblock):

```
<!-- @type: monster-group | @domain: fixture | @category: demon -->
### Demon Portfolio Fixture

The boil arises from the chaotic depths…

<!-- @type: statblock -->
#### The Boil

*Hazard Support*

| **Stamina:** 20 + your level | **Size:** 2 |
|------------------------------|------------:|

> ⭐️ **Hunger Thrush**
>
> Each enemy that starts their turn within 3 squares…

> ⭐️ **Oh, It Pops**
>
> When the boil is destroyed, each enemy within 3 squares…

<!-- @type: featureblock | @id: the-boil | @fixture: the-boil -->
##### The Boil Advancement Features

<!-- @type: feature | @id: soul-rancor | @level: 5 -->
###### Soul Rancor

You gain a surge the first time in a round that your demon minions…

<!-- @type: feature | @id: size-increase | @level: 9 -->
###### Size Increase

The boil is now size 3.

<!-- @type: feature | @id: fester-field | @level: 9 -->
###### Fester Field

Each non-abyssal enemy that starts their turn within 3 squares…
```

Preserve every inline `scc.v1:` link in the member bodies verbatim (un-blockquote the prose but keep link markup). Keep the base abilities (`Hunger Thrush`, `Oh, It Pops`) exactly as blockquotes — they stay inline/uncoded.

- [ ] **Step 2: Verify the tree nests correctly (build + targeted parse)**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --book summoner --config pipeline.yaml 2>&1 | grep -iE "error|duplicate|the-boil|soul-rancor" | head'`
Expected: no errors/duplicates; (the grep may print nothing — that's fine, errors are what matter).

- [ ] **Step 3: Confirm the new demon codes minted**

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
git commit -m "feat(summoner): restructure The Boil fixture for coded advancement members"
```

---

### Task 4: Integration test — fixture nesting + codes via ParseDocument

Lock the structural assumption (advancement featureblock is a child of the base; members are children of the featureblock) so a future source edit can't silently flatten it.

**Files:**
- Test: `steel-etl/internal/content/monster_test.go` (add a ParseDocument-based test)

- [ ] **Step 1: Write the failing test**

```go
func TestFixtureSubtreeNesting(t *testing.T) {
	src := []byte(strings.Join([]string{
		"<!-- @type: monster-group | @domain: fixture | @category: demon -->",
		"### Demon Portfolio Fixture", "", "Lore.", "",
		"<!-- @type: statblock -->",
		"#### The Boil", "", "*Hazard Support*", "",
		"| **Stamina:** 20 + your level | **Size:** 2 |",
		"|------------------------------|------------:|", "",
		"> ⭐️ **Hunger Thrush**", ">", "> Inline base ability.", "",
		"<!-- @type: featureblock | @id: the-boil | @fixture: the-boil -->",
		"##### The Boil Advancement Features", "",
		"<!-- @type: feature | @id: soul-rancor | @level: 5 -->",
		"###### Soul Rancor", "", "Surge body.", "",
		"<!-- @type: feature | @id: fester-field | @level: 9 -->",
		"###### Fester Field", "", "Corruption body.", "",
	}, "\n"))

	doc, err := parser.ParseDocument(src)
	if err != nil {
		t.Fatal(err)
	}
	// group -> statblock -> featureblock -> [feature, feature]
	group := doc.Sections[0]
	if group.Type() != "monster-group" || len(group.Children) != 1 {
		t.Fatalf("group children = %d, want 1 (the base)", len(group.Children))
	}
	base := group.Children[0]
	if base.Type() != "statblock" {
		t.Fatalf("base type = %q, want statblock", base.Type())
	}
	// The advancement featureblock must be a CHILD of the base (companion model),
	// not a sibling — this is what makes on-page embedding + member coding work.
	var fb *parser.Section
	for _, c := range base.Children {
		if c.Type() == "featureblock" {
			fb = c
		}
	}
	if fb == nil {
		t.Fatalf("base has no featureblock child; advancement did not nest under base")
	}
	if len(fb.Children) != 2 {
		t.Fatalf("featureblock children = %d, want 2 (the members)", len(fb.Children))
	}
	if fb.Children[0].Type() != "feature" || fb.Children[0].ID() != "soul-rancor" {
		t.Errorf("member[0] = %q/%q, want feature/soul-rancor", fb.Children[0].Type(), fb.Children[0].ID())
	}
}
```

Add `"github.com/SteelCompendium/steel-etl/internal/parser"` to the imports if not already present (it is, per existing tests).

- [ ] **Step 2: Run it**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFixtureSubtreeNesting -v'`
Expected: PASS (Tasks 1–2 made the parsers handle this; this test confirms the tree shape the source restructure relies on). If it FAILS at "advancement did not nest under base", the heading levels in the test string (or real source) are wrong — fix the levels so base=H4, featureblock=H5, members=H6.

- [ ] **Step 3: Commit**

```bash
git add steel-etl/internal/content/monster_test.go
git commit -m "test(scc): lock fixture advancement nesting (base > featureblock > members)"
```

---

### Task 5: Source restructure — the remaining 3 fixtures

Apply the exact Task 3 transformation to elemental, fey, and undead fixtures.

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md` (~lines 1529–1568 elemental, 1569–1608 fey, 1609–1653 undead)

- [ ] **Step 1: Restructure each fixture (same shape as Task 3)**

For each, apply: group `#####`→`###`, base `#######`→`####`, advancement `#######`→`#####` + add `@fixture: <base-id>`, members → `######` `@type: feature` sections with `@id`/`@level`. The base abilities stay inline blockquotes. Members per fixture:

- **Elemental** — `@fixture: primordial-crystal`: `terra-resonance` (level 5), `size-increase` (level 9), `magnified-strike` (level 9).
- **Fey** — `@fixture: glade-pond`: `garden-of-jest` (level 5), `size-increase` (level 9), `folly-field` (level 9).
- **Undead** — `@fixture: barrow-gates`: `memento-mori` (level 5), `size-increase` (level 9), `open-the-gates` (level 9).

(Use the exact member names/bodies from the current source; slugify names for `@id`, e.g. "Garden of Jest" → `garden-of-jest`.)

- [ ] **Step 2: Regenerate and confirm all 12 codes**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --book summoner --config pipeline.yaml >/dev/null 2>&1 && grep -oE "feature\.fixture\.[a-z-]+\.[a-z-]+\.level-[0-9]+/[a-z-]+" classification.json | sort -u'`
Expected: exactly 12 lines — 3 each for demon/the-boil, elemental/primordial-crystal, fey/glade-pond, undead/barrow-gates.

- [ ] **Step 3: Commit**

```bash
git add "steel-etl/input/summoner/Draw Steel Summoner.md"
git commit -m "feat(summoner): restructure elemental/fey/undead fixtures for coded advancement members"
```

---

### Task 6: Site routing & rendering — companion-style embed, retire fixture pairing

With the advancement featureblock now a child of the base, fixtures should render like companions: the advancement card embeds on the base fixture's page (via `embed_cards.go`) and keeps its own leaf page. Retire the Plan-5c fixture-specific *pairing* path. The exact edits are output-driven — regenerate, diff the Browse tree, and adjust the named functions until the acceptance criteria hold.

**Files (the fixture-specific site logic to reconcile):**
- `steel-etl/internal/site/advancement_pairs.go` — `buildAdvancementPairContent`, fixture branch at the `pathHasSegment(dir, "fixture")` guard (~line 148)
- `steel-etl/internal/site/build.go` — `hoistStatblockPath` / `flattenAdvancementFeaturesPath` calls (~lines 275–277)
- `steel-etl/internal/site/bestiary_search.go` — fixture facet (~lines 51–61)
- `steel-etl/internal/site/embed_cards.go` — already handles nested advancement-under-base for companions (no change expected; confirm it now fires for fixtures)

- [ ] **Step 1: Build the site and capture the fixture Browse tree (baseline of new behavior)**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml >/dev/null 2>&1 && go run ./cmd/steel-etl site --config ../v2/site.yaml >/dev/null 2>&1'
find v2/docs/Browse -path '*fixture*' -name '*.md' | sort
```
Expected: base fixture pages under `Browse/monster/fixture/<category>/…` and advancement-features leaves still present. Note any double-listing, broken folder index, or 404-prone paths.

- [ ] **Step 2: Confirm the advancement card embeds on the base fixture page**

Run: `grep -l 'fb__band--adv' v2/docs/Browse/monster/fixture/*/the-boil*.md` (and check the base page contains the advancement card inline).
Expected: the base fixture page body now contains the advancement Forged Band card (transcluded by `embed_cards.go`), because the advancement featureblock is a `{data-scc}` descendant of the base. If it does **not** embed, verify `RenderSubtree` stamps the advancement heading inside the base page (the base must be the parent in the tree — confirmed by Task 4).

- [ ] **Step 3: Reconcile the pairing/flatten logic**

The fixture advancement is no longer a flat sibling, so the Plan-5c pairing should no longer apply to fixtures. Remove the fixture branch from `buildAdvancementPairContent` (the `pathHasSegment(dir, "fixture")` handling) so fixtures fall through to the companion-style rendering (embedded card + own leaf). Keep the beastheart-companion behavior intact. Adjust `flattenAdvancementFeaturesPath` only if the regenerated tree shows fixture advancement leaves landing in the wrong place. Do the change that makes fixtures genuinely consistent with the companion path — keep the edit scoped so the companion and retainer branches are untouched, but do not stop short of full companion parity for fixtures.

- [ ] **Step 4: Confirm bestiary facets unchanged**

Run: `grep -c '"type": *"fixture"' v2/docs/Browse/**/*bestiary* 2>/dev/null || true` and inspect `bestiary_search.go` output.
Expected: each base fixture still indexed as a `"fixture"` facet; advancement-features + member-feature pages excluded from the bestiary index (extend the `/advancement-features/` exclusion to also skip the new `feature.fixture.*` member leaves if they appear).

- [ ] **Step 5: Acceptance — rebuild and verify the four criteria**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'`
Then rebuild the site (Step 1 command) and verify, for The Boil:
1. Base fixture card renders (inline base abilities only), under `Browse/monster/fixture/demon/`.
2. The advancement Forged Band card (Level-5/9 tiers) is embedded on the base page, with per-member permalink icons (`{data-scc}` headings).
3. The advancement-features leaf page still exists and renders.
4. No duplicate/orphan fixture folder cards; fixtures still appear in the Bestiary tab.

Expected: all four hold; `go test ./...` green.

- [ ] **Step 6: Commit**

```bash
git add steel-etl/internal/site/
git commit -m "feat(site): fixtures render companion-style (embedded advancement); retire fixture pairing"
```

---

### Task 7: Full-pipeline verification — `classify --diff` is exactly +12

**Files:** none (verification only)

- [ ] **Step 1: Regenerate all books**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml'`
Expected: completes without errors.

- [ ] **Step 2: Confirm the SCC delta is only the 12 new feature codes + unchanged containers**

Run: `devbox run -- bash -c 'cd steel-etl && grep -oE "monster\.fixture\.[a-z-]+\.(featureblock|advancement-features)/[a-z-]+" classification.json | sort -u'`
Expected: 8 lines — `featureblock/<base>` ×4 and `advancement-features/<base>` ×4, **unchanged** from before (the 4 fixtures: the-boil, primordial-crystal, glade-pond, barrow-gates).

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --diff 2>&1 | head -40'`
Expected: additions are only the 12 `feature.fixture.*.level-N/<member>` codes; **no** statblock/minion/champion/rival/retainer code changed, no removals beyond the (now-restructured) fixtures' prior state.

- [ ] **Step 3: Schema validation + full test suite**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/output/ ./internal/content/ ./internal/site/'`
Expected: PASS. If `schema_validation_test.go` rejects the fixture advancement featureblock's embedded `features[]`, add the fixture variant to its allowlist exactly as the companion variant is allowed (and mirror the change in `data-sdk-npm/src/schema/featureblock.schema.json` if a schema field is touched — dual-schema-sync rule).

- [ ] **Step 4: Commit (if any allowlist/schema change was needed)**

```bash
git add steel-etl/internal/output/ steel-etl/schemas/ ../data-sdk-npm/src/schema/ 2>/dev/null
git commit -m "test(schema): accept fixture advancement embedded child features" || echo "no schema change needed"
```

---

### Task 8: Link validation + linking-reference (hand-curated)

⚠️ `linking-reference.md` is **manually curated and canonical** — the old `gen_linking_reference.py` generator was retired (it can't reproduce the curated file). The Summoner book's own terms live in `steel-etl/docs/summoner-linking-reference.md`. So this task **hand-adds** the 12 new codes to the Summoner reference file; there is no regen command.

**Files:**
- Modify: `steel-etl/docs/summoner-linking-reference.md`

- [ ] **Step 1: Validate no dangling links and that the 12 codes resolve**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --scc-stable 2>&1 | tail -20'`
Expected: no new dangling `scc:` links (0 inbound links to these today, so nothing breaks); the 12 codes are registered.

- [ ] **Step 2: Hand-add the 12 fixture-feature codes to the Summoner reference table**

Edit `steel-etl/docs/summoner-linking-reference.md`: add the 12 `feature.fixture.<category>.<base>.level-N/<member>` codes as linkable targets (one row per member, with display name + variants), following the file's existing table format and the fixture section if one exists (else add a "Fixture Advancement Features" subsection). Match the curation style of the neighboring entries.

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

Content: dated 2026-06-19 — fixtures' advancement members now coded `feature.fixture.<category>.<base>.level-N/<member>` (×12, enumerate or summarize); fixtures adopt the companion nested+embedded model; Plan-5c fixture *pairing* retired (codes for base `monster.fixture.*.featureblock/*` + container `…advancement-features/*` unchanged); registry +12. Note this is the narrowed first slice of ROADMAP #15 (statblock/retainer per-ability coding declined).

- [ ] **Step 2: Update `docs/scc-reference.md` + the workspace `CLAUDE.md` SCC summary**

In `docs/scc-reference.md`: under the fixture/summoner section, document `feature.fixture.<category>.<base>.level-N/<member>` and the registry count bump. In workspace `CLAUDE.md` SCC paragraph (the "~3,072 codes" line), bump the count by 12 and note fixtures' advancement members are coded.

- [ ] **Step 3: Update `steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md`**

In `statblocks.md` "Fixture rendering" + "Summoner book reuse" sections: fixtures now use the companion model — advancement parsed via `collectChildFeatures` (coded child `@type:feature` members), nested under the base, embedded on the base page; Plan-5c pairing retired; base abilities stay inline (the one intentional divergence from companions). Mirror the one-line summary in `steel-etl/CLAUDE.md` "Statblocks" bullets.

- [ ] **Step 4: Update `DESIGN.md` + `ROADMAP.md`**

`DESIGN.md`: the fixture advancement card is now an embedded (companion-style) Forged Band instance. `ROADMAP.md`: record #15 narrowed — statblock/summoner-statblock/retainer per-ability coding **declined**; this fixture slice shipped. Keep #15's number (permanent-id rule); move to archive with `(was #15)` only if you consider it fully closed, else leave it live with the narrowed scope noted.

- [ ] **Step 5: Update the in-flight memory note**

In `featureblock-refactor-in-flight.md`: note fixture advancement members are now coded (companion model); statblock/retainer per-ability coding declined. Add a one-line pointer update in `MEMORY.md` if the description changes.

- [ ] **Step 6: Commit**

```bash
git add docs/ CLAUDE.md DESIGN.md ROADMAP.md steel-etl/CLAUDE.md "steel-etl/docs/statblocks.md"
git commit -m "docs: fixture advancement coded members (companion model) — scc-log, reference, statblocks, roadmap"
```

---

## Final verification (before declaring done)

Run from the workspace root:

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml >/dev/null && go run ./cmd/steel-etl classify --diff 2>&1 | head -40'
```

Expected: build/vet/test green; `classify --diff` shows **only** the +12 `feature.fixture.*.level-N/<member>` additions. Spot-check a rendered fixture page per Task 6 Step 5. **Do not deploy** — deploy is decided separately by Scott.
