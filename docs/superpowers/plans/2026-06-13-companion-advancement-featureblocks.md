# Companion Advancement Featureblocks Implementation Plan (Featureblock Plan 5b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mint a per-companion **advancement-features** featureblock entity — `monster.companion.beastheart.advancement-features/<species>` — that groups the Level-3/6/10 advancement features (which keep their own `feature.companion.beastheart.<species>.level-N/<id>` codes from Plan 5a) and renders as a Forged Band card with leveled `.fb__band--adv` tiers on its own page.

**Architecture:** Plan 5b of the companion-restructure-advancement effort (spec: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`; builds on Plan 5a, landed). **Source restructure + classifier + render-verify.** Per companion (×14), the three `##### Level N <C> Advancement Feature` context-only separators are replaced by ONE `##### <C> Advancement Features` header annotated `@type: featureblock`, and each advancement feature's `@level: N` moves onto its own annotation (a feature reads its own `@level` — the pipeline pushes a section's annotation before its parser runs, and `Lookup` includes the section's level; verified). The `FeatureblockParser` gains a companion branch: when companion context is present it classifies as `monster.companion.<class>.advancement-features/<species>` and embeds the child `@type: feature` sections as `features[]` (they remain separately-coded entities — the embed is for the card, mirroring the kit `signature_ability` embedding pattern). The standalone entity page renders via the existing `buildFeatureblockPage` (Plan 2) + `renderFbFeats` leveled bands (Plan 3). **Registry is `freeze: false`** so codes rebuild clean; the only NEW codes are the 14 advancement-features containers — the advancement *feature* codes are unchanged from 5a (verify).

**Scope note (on-companion-page card deferred):** Phase 5b delivers the advancement-features **entity + its standalone Forged Band card page**. The advancement trio still renders inline on the companion page as a titled "<C> Advancement Features" markdown section (no regression — it was plain markdown before). Compositing the Forged Band card onto the *companion* page is the **entity-embedding effort** (ROADMAP, spec §8) — out of scope here.

**Tech Stack:** Go (steel-etl `internal/content`, `internal/site`), source markdown (`input/beastheart`), table-driven Go tests. Toolchain via **devbox** — prefix every Go command with `devbox run --` and target the module with `go -C steel-etl …` (devbox runs from the workspace root). You are on branch `steel-etl@feat/companion-scc-restructure` (continue on it).

---

## Context: what already exists (do NOT rebuild)

- **Plan 5a (landed):** companions are `monster.companion.beastheart.statblock/<species>`; members are `feature.companion.beastheart.<species>.level-N/<id>` and `feature.ability.companion.beastheart.<species>.level-1/<id>`. `classID` (= `beastheart`) and `companionID` (= species) both resolve from context at any companion descendant (`findAncestorID(ctx, level, "class")`, `ctx.Lookup(level, "companion")`).
- **`FeatureblockParser`** (`internal/content/monster.go:186`): malice/terrain blocks. Sets `fm["type"]="featureblock"`, `kind`, optional `level`/`flavor`, `features[]` from `ParseRichFeatures(body)` (blockquotes), and `typePath := compactPath(domain, category, subcategory)` via `statblockDomain(ctx)`. **Has no companion handling** — for a companion-context section it would wrongly produce `monster/<id>` (no category). This task adds a companion branch ABOVE the malice path.
- **`collectAbilityChildren(section)`** (`internal/content/feature.go:175`) — pattern for walking `section.Children` collecting annotated descendants through unannotated intermediaries. Model `collectChildFeatures` on it.
- **`RichFeature`** (`internal/content/featureparse.go`) + **`RichFeatureMaps([]RichFeature) []map[string]any`** — the `features[]` frontmatter shape. A plain prose advancement feature maps to `RichFeature{Name, Body, Level}`.
- **`buildFeatureblockPage`** (`internal/site/featureblock_page.go:84`): dispatches on `type: featureblock | dynamic-terrain`, `yaml.Unmarshal`s frontmatter into `fbDoc`, renders `renderFeatureblockCard`. `renderFbFeats` groups `Level>0` features into `.fb__band--adv` tiers (Plan 3, CSS already styled). **Already dispatched** in `internal/site/build.go buildSection`.
- **Wolf source shape** (`input/beastheart/Draw Steel Beastheart.md`, lines ~1051–1073) — the canonical example:
  ```
  <!-- @type: feature-group | @level: 3 -->
  ##### Level 3 Wolf Advancement Feature

  <!-- @type: feature | @id: my-what-big-teeth-you-have -->
  ###### My, What Big Teeth You Have
  <prose>

  <!-- @type: feature-group | @level: 6 -->
  ##### Level 6 Wolf Advancement Feature

  <!-- @type: feature | @id: call-of-the-wild -->
  ###### Call of the Wild
  <prose>

  <!-- @type: feature-group | @level: 10 -->
  ##### Level 10 Wolf Advancement Feature

  <!-- @type: feature | @id: dire-wolf -->
  ###### Dire Wolf
  <prose>
  ```
  All 14 companions follow this exact shape; every advancement feature is `@type: feature` (plain prose, no ability tables — verified). Levels are always 3/6/10.

### Target source shape (per companion)

```
<!-- @type: featureblock -->
##### Wolf Advancement Features

<!-- @type: feature | @id: my-what-big-teeth-you-have | @level: 3 -->
###### My, What Big Teeth You Have
<prose>

<!-- @type: feature | @id: call-of-the-wild | @level: 6 -->
###### Call of the Wild
<prose>

<!-- @type: feature | @id: dire-wolf | @level: 10 -->
###### Dire Wolf
<prose>
```

Resulting codes (Wolf): `monster.companion.beastheart.advancement-features/wolf` (NEW) + the three `feature.companion.beastheart.wolf.level-{3,6,10}/<id>` (unchanged from 5a — now parented by the featureblock instead of the separators, but the codes are identical because companion+class come from `#### Wolf`/`## Beastheart` ancestors and level from each feature's own `@level`).

---

## Task 1: Source restructure — inject featureblock headers, migrate `@level` (×14)

This is a surgical, regular source transform best done with a script + regeneration verification. **Files:** `input/beastheart/Draw Steel Beastheart.md`.

- [ ] **Step 1: Apply the transform**

Run this Python (it is deterministic and self-checks). It walks the file tracking the current `#### <Companion>` heading; for each `<!-- @type: feature-group | @level: N -->` + `##### Level N <C> Advancement Feature` separator it (a) deletes the separator, (b) appends ` | @level: N` to the very next `<!-- @type: feature | @id: X -->` annotation, and (c) before the FIRST advancement feature of each companion injects `<!-- @type: featureblock -->` + `##### <C> Advancement Features`.

```python
import re, sys
p = "steel-etl/input/beastheart/Draw Steel Beastheart.md"
lines = open(p, encoding="utf-8").read().split("\n")
out, i = [], 0
companion = None
pending_level = None          # level from the separator we just dropped
need_header_for = None        # companion name needing a featureblock header before its next feature
sep_re = re.compile(r'^<!-- @type: feature-group \| @level: (\d+) -->$')
head_re = re.compile(r'^##### Level \d+ (.+?) Advancement Feature$')
comp_re = re.compile(r'^#### (.+?)\s*$')
feat_re = re.compile(r'^(<!-- @type: feature \| @id: [\w-]+)( -->)$')
while i < len(lines):
    ln = lines[i]
    mc = comp_re.match(ln)
    if mc and 'Advancement' not in ln:
        companion = mc.group(1).strip()
    ms = sep_re.match(ln)
    if ms and i+1 < len(lines) and head_re.match(lines[i+1]):
        cname = head_re.match(lines[i+1]).group(1).strip()
        lvl = ms.group(1)
        # drop the separator's two lines (annotation + heading); remember the level
        pending_level = lvl
        if need_header_for is None and lvl == "3":
            need_header_for = cname
        i += 2
        # also drop a following blank line if present (keep spacing tidy)
        if i < len(lines) and lines[i].strip() == "":
            i += 1
        continue
    mf = feat_re.match(ln)
    if mf and pending_level is not None:
        if need_header_for is not None:
            out.append("<!-- @type: featureblock -->")
            out.append(f"##### {need_header_for} Advancement Features")
            out.append("")
            need_header_for = None
        out.append(f"{mf.group(1)} | @level: {pending_level}{mf.group(2)}")
        pending_level = None
        i += 1
        continue
    # leaving a companion's advancement run resets the header latch at the next companion
    if mc and 'Advancement' not in ln:
        need_header_for = None
    out.append(ln)
    i += 1
open(p, "w", encoding="utf-8").write("\n".join(out))
print("done")
```

Run: `cd /home/vexa/code/steel_compendium/workspace && python3 - <<'PY'` … (paste the script) … `PY`

- [ ] **Step 2: Verify the source shape**

```bash
cd /home/vexa/code/steel_compendium/workspace
echo "featureblock headers (expect 14):"; grep -c '^##### .* Advancement Features$' "steel-etl/input/beastheart/Draw Steel Beastheart.md"
echo "leftover separators (expect 0):"; grep -c 'Advancement Feature$' "steel-etl/input/beastheart/Draw Steel Beastheart.md"
echo "feature annotations with @level (expect ~42):"; grep -c '@type: feature | @id: .* | @level: ' "steel-etl/input/beastheart/Draw Steel Beastheart.md"
echo "--- Wolf block (eyeball) ---"; sed -n '/^#### Wolf$/,/^### Companion Rules$/p' "steel-etl/input/beastheart/Draw Steel Beastheart.md" | sed -n '/Advancement Features/,$p' | head -20
```
Expected: 14 headers, 0 leftover `Advancement Feature$` separators, ~42 leveled feature annotations; the Wolf block matches the target shape above.

- [ ] **Step 3: Regenerate and confirm codes (no new parser yet → advancement-features header still classifies as the malice fallback)**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- go -C steel-etl run ./cmd/steel-etl gen --all --config pipeline.yaml 2>&1 | tail -3
echo "--- advancement feature codes unchanged from 5a (expect the 3 wolf levels): ---"
grep -oE 'mcdm\.beastheart\.v1/feature\.companion\.beastheart\.wolf\.level-[0-9]+/[^"]*' steel-etl/classification.json | sort -u
```
Expected: the three `feature.companion.beastheart.wolf.level-{3,6,10}/<id>` codes are **unchanged** (their level now comes from their own `@level`, not the separators). The advancement-features header currently classifies via the malice fallback (`monster/<species>-advancement-features` or similar — wrong) — Task 2 fixes its code. Do NOT commit yet; commit after Task 2 so the source + classifier land together.

> NOTE: if the grep shows the three level codes changed or vanished, the `@level` migration failed — STOP and inspect the Wolf annotations before proceeding.

---

## Task 2: `FeatureblockParser` companion branch + child-feature collection

**Files:**
- Modify: `steel-etl/internal/content/monster.go` (`FeatureblockParser.Parse`, ~line 186; add `collectChildFeatures`)
- Test: `steel-etl/internal/content/content_test.go` (add)

- [ ] **Step 1: Write the failing test**

Add to `content_test.go`:

```go
func TestFeatureblockCompanionAdvancement(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.beastheart.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "beastheart"})
	ctx.Push(4, context.Metadata{"type": "feature-group", "companion": "wolf"})

	adv := &parser.Section{
		Heading:      "Wolf Advancement Features",
		HeadingLevel: 5,
		Annotation:   map[string]string{"type": "featureblock"},
		Children: []*parser.Section{
			{Heading: "My, What Big Teeth You Have", HeadingLevel: 6,
				Annotation: map[string]string{"type": "feature", "id": "my-what-big-teeth-you-have", "level": "3"},
				Body:       "Whenever the wolf makes a strike..."},
			{Heading: "Dire Wolf", HeadingLevel: 6,
				Annotation: map[string]string{"type": "feature", "id": "dire-wolf", "level": "10"},
				Body:       "While the wolf is rampaging..."},
		},
	}
	p := &FeatureblockParser{}
	got, err := p.Parse(ctx, adv)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	// container code: monster.companion.beastheart.advancement-features/wolf
	code := scc.Classify("mcdm.beastheart.v1", got.TypePath, got.ItemID)
	if want := "mcdm.beastheart.v1/monster.companion.beastheart.advancement-features/wolf"; code != want {
		t.Errorf("code = %q, want %q", code, want)
	}
	if got.Frontmatter["type"] != "featureblock" {
		t.Errorf("type = %v, want featureblock", got.Frontmatter["type"])
	}
	// embeds the child features (with level) as features[]
	feats, ok := got.Frontmatter["features"].([]map[string]any)
	if !ok || len(feats) != 2 {
		t.Fatalf("features = %v (len/ok mismatch)", got.Frontmatter["features"])
	}
	if feats[0]["name"] != "My, What Big Teeth You Have" || feats[0]["level"] != 3 {
		t.Errorf("feat[0] = %v, want name+level 3", feats[0])
	}
	if feats[1]["level"] != 10 {
		t.Errorf("feat[1] level = %v, want 10", feats[1]["level"])
	}
}
```

(Confirm the test file already imports `scc` — `grep -n '"github.com/SteelCompendium/steel-etl/internal/scc"' internal/content/content_test.go`; the 5a tests classified codes, so it should. If not, add it.)

- [ ] **Step 2: Run the test to verify it fails**

`devbox run -- go -C steel-etl test ./internal/content/ -run TestFeatureblockCompanionAdvancement -v`
Expected: FAIL — code is the malice-fallback path, and `features` is empty (no blockquotes in body).

- [ ] **Step 3: Implement the companion branch + collector**

In `monster.go`, add near the top of `FeatureblockParser.Parse` (right after `fm := map[string]any{... "type":"featureblock"}` is built, BEFORE the malice `kind`/`ParseRichFeatures`/`statblockDomain` logic):

```go
	// Companion advancement-features container (beastheart). When companion
	// context is present, this is the per-species "<C> Advancement Features"
	// block: classify as monster.companion.<class>.advancement-features/<species>
	// and embed the child @type:feature sections (the Level-3/6/10 advancement
	// features, which keep their own feature.* codes) as features[] for the card.
	if companionID, _ := ctx.Lookup(section.HeadingLevel, "companion"); companionID != "" {
		classID := findAncestorID(ctx, section.HeadingLevel, "class")
		if feats := collectChildFeatures(section); len(feats) > 0 {
			fm["features"] = RichFeatureMaps(feats)
		}
		return &ParsedContent{
			Frontmatter: fm,
			Body:        section.FullBodySource(),
			TypePath:    compactPath("monster", "companion", classID, "advancement-features"),
			ItemID:      companionID,
		}, nil
	}
```

Add the collector (next to `collectAbilityChildren` in `feature.go`, or in `monster.go` — same package):

```go
// collectChildFeatures returns the @type:feature descendants of a section as
// RichFeatures (name + prose body + level), in document order, for embedding in a
// featureblock's features[]. Used by the companion advancement-features block,
// whose Level-3/6/10 members are plain prose features (no blockquote/ability
// table). Each member keeps its own SCC code; this embed is render-only.
func collectChildFeatures(section *parser.Section) []RichFeature {
	var out []RichFeature
	for _, child := range section.Children {
		switch child.Type() {
		case "feature":
			rf := RichFeature{
				Name: CleanHeading(child.Heading),
				Body: strings.TrimSpace(child.FullBodySource()),
			}
			if lv, ok := child.Annotation["level"]; ok {
				if n, err := strconv.Atoi(lv); err == nil {
					rf.Level = n
				}
			}
			out = append(out, rf)
		case "":
			out = append(out, collectChildFeatures(child)...)
		}
	}
	return out
}
```

> Confirm `RichFeature` has `Name`, `Body`, `Level` fields (`grep -n 'type RichFeature' -A15 internal/content/featureparse.go`). If `Body` is named differently (e.g. `Text`), use the actual field. Confirm `RichFeatureMaps` emits `level` only when `>0` (so non-leveled callers are unaffected) — if it always emits `level`, that is fine for this entity. `strings`/`strconv` are already imported in `monster.go`.

- [ ] **Step 4: Run the test to verify it passes**

`devbox run -- go -C steel-etl test ./internal/content/ -run TestFeatureblockCompanionAdvancement -v`
Expected: PASS.

- [ ] **Step 5: Full content package (no regressions)**

`devbox run -- go -C steel-etl test ./internal/content/...`
Expected: PASS — malice/terrain featureblocks are unaffected (they have no companion context, so they skip the new branch).

- [ ] **Step 6: Commit (source + classifier together)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add input/ internal/content/monster.go internal/content/feature.go internal/content/content_test.go
git commit -m "feat: companion advancement-features featureblock entity (source + parser)"
```

---

## Task 3: Regenerate, verify the new codes + the standalone card renders

**Files:** none (verification) — plus a site test if `buildFeatureblockPage` needs a companion fixture.

- [ ] **Step 1: Build + full test**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- go -C steel-etl build ./... && devbox run -- go -C steel-etl test ./...
```
Expected: clean.

- [ ] **Step 2: Regenerate and confirm the 14 new container codes + unchanged feature codes**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- go -C steel-etl run ./cmd/steel-etl gen --all --config pipeline.yaml 2>&1 | tail -3
echo "advancement-features containers (expect 14):"
grep -coE 'mcdm\.beastheart\.v1/monster\.companion\.beastheart\.advancement-features/[^"]*' steel-etl/classification.json
echo "wolf advancement features (expect 3, unchanged):"
grep -oE 'mcdm\.beastheart\.v1/feature\.companion\.beastheart\.wolf\.level-[0-9]+/[^"]*' steel-etl/classification.json | sort -u
echo "no stray malice-fallback companion code (expect none):"
grep -oE 'mcdm\.beastheart\.v1/monster/[^"]*' steel-etl/classification.json | head
```
Expected: 14 `…advancement-features/<species>` codes; the 3 wolf feature codes unchanged; no `monster/<x>` fallback codes.

- [ ] **Step 3: Confirm the standalone advancement-features page renders as a Forged Band card**

```bash
cd /home/vexa/code/steel_compendium/workspace
ADV=$(find data/data-beastheart -ipath '*advancement-features*wolf.md' | head -1); echo "$ADV"
grep -c 'class="fb-wrap"' "$ADV"                 # expect >= 1 (card present)
grep -oE 'data-level="[0-9]+"' "$ADV" | sort -u  # expect 3, 6, 10
grep -oE 'Wolf Advancement Features' "$ADV" | head -1
```
Expected: the page (built by `buildFeatureblockPage`, already dispatched) contains `.fb-wrap`, `data-level="3"/"6"/"10"` bands, and the title. If `.fb-wrap` is absent, the page wasn't dispatched to `buildFeatureblockPage` — check that the generated page's frontmatter `type:` is `featureblock` (it should be, from the parser). If the eyebrow/role accent needs adjustment for companions (no combat role), note it but it is non-blocking (neutral accent is acceptable).

- [ ] **Step 4: SCC stability for the rest of the registry**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
devbox run -- go run ./cmd/steel-etl classify --diff --config pipeline.yaml 2>&1 | grep -iv 'advancement-features' | grep -i 'companion' | head
```
Expected: empty — the only companion delta vs the just-written registry is the 14 added advancement-features containers (additions, not changes to existing codes).

---

## Task 4: Schema validation + SDK

**Files:** `steel-etl/internal/output/schema_validation_test.go` (allowlist, if needed); both `featureblock.schema.json` copies (only if a field is missing).

- [ ] **Step 1: Run the schema validation test**

`devbox run -- go -C steel-etl test ./internal/output/ -run Schema -v`
Expected: PASS. The advancement-features entity is `type: featureblock` with `features[]` of `{name, body, level}` — a subset of the existing `featureblock.schema.json` shape, so it should validate with no schema change.

- [ ] **Step 2: If it fails on the advancement-features entity**

Read the failure. If `features[]` `{name, body, level}` is rejected, confirm `featureblock.schema.json` (BOTH copies — `steel-etl/schemas/` and `../data-sdk-npm/src/schema/`, the latter on the `v3` branch) permits `body` + `level` on a feature with no power-roll/sections. If a copy is stricter, relax it in BOTH copies identically (the dual-schema-sync rule) and update the `schema_validation_test.go` allowlist. Re-run until green. If it passes, do nothing.

- [ ] **Step 3: Commit (only if schema/allowlist changed)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/output/ schemas/ && git commit -m "test: allow companion advancement-features featureblock shape"
# and, if the SDK copy changed, commit it on the data-sdk-npm v3 branch separately
```
(Skip if nothing changed.)

---

## Task 5: Docs + bookkeeping

**Files:** `docs/scc-log.md`, `steel-etl/docs/statblocks.md`, workspace `CLAUDE.md` + `steel-etl/CLAUDE.md`, `DESIGN.md`, memory.

- [ ] **Step 1: Append to `docs/scc-log.md`**

Under the 2026-06-13 Plan 5a entry, add a 5b note: 14 `monster.companion.beastheart.advancement-features/<species>` container codes minted; the Level-3/6/10 advancement features keep their `feature.companion.beastheart.<species>.level-N/<id>` codes (re-parented from the dropped `Level N` separators to the new `@type: featureblock` header, levels migrated onto each feature's own annotation); the entity embeds them as `features[]` and renders as a Forged Band card on its standalone page. On-companion-page card compositing deferred to the embedding effort.

- [ ] **Step 2: Update current-state pointers**

`steel-etl/CLAUDE.md` (the Plan-5 line from 5a) + `steel-etl/docs/statblocks.md`: note the companion advancement-features featureblock (parser companion branch in `monster.go`, child-feature embedding, standalone Forged Band card). Workspace `CLAUDE.md` SCC companion bullet: 5b shipped (advancement-features entities). Current-state + pointer only.

- [ ] **Step 3: Update `DESIGN.md`**

Add companion advancement-features as a Forged Band card instance (standalone page; on-companion-page embed pending). Keep to current-state + pointer.

- [ ] **Step 4: Update memory** — `/home/vexa/.claude/projects/-home-vexa-code-steel-compendium-workspace/memory/project_featureblock_cards.md`: Plan 5a (restructure) + 5b (companion advancement-features entities) shipped 2026-06-13; remaining 5c (fixtures), 5d (deploy), Plan 6 (retainers). Update the `MEMORY.md` one-liner if its hook changed.

- [ ] **Step 5: Commit docs**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add CLAUDE.md docs/statblocks.md && git commit -m "docs: companion advancement-features featureblock (Plan 5b)"
cd /home/vexa/code/steel_compendium/workspace
git add docs/scc-log.md CLAUDE.md DESIGN.md && git commit -m "docs: companion advancement-features (Plan 5b)"
```
(Memory files are saved via the Write tool, not committed. The steel-etl pointer bump + v2 rebuild remain deferred to Plan 5d.)

---

## Self-Review notes (spec coverage)

- **Spec §2/§4 "advancement featureblock = monster.companion.beastheart.advancement-features/<species>, members keep feature.* codes, type: featureblock"** → Task 1 (source) + Task 2 (classifier + child embed) + Task 3 (verify codes). The members' codes are unchanged from 5a (Task 1 Step 3, Task 3 Step 2 assert this).
- **Spec §3 "inject H5 <C> Advancement Features header, move @level onto each feature"** → Task 1 transform; verified by the own-`@level` Lookup mechanism (pipeline pushes section annotation before parse; Lookup includes own level).
- **Spec §5 "renders as a Forged Band card via renderFeatureblockCard/renderFbFeats leveled bands"** → Task 3 Step 3 (standalone page). On-companion-page card explicitly deferred (scope note + §8 embedding effort) — NOT a gap.
- **Spec §7 schema (featureblock.schema.json both copies)** → Task 4.
- **Spec §4 "type: featureblock"** → Task 2 sets it; Task 3/4 verify render + validate.
- **Out of scope (correctly absent → 5c/5d/embedding):** fixtures (5c), deploy/pointer-bump/v2 (5d), on-companion-page embedding (ROADMAP).
- **Type/name consistency:** `FeatureblockParser`, `collectAbilityChildren`, `RichFeature`/`RichFeatureMaps`, `compactPath`, `findAncestorID`, `ctx.Lookup`, `buildFeatureblockPage`/`renderFbFeats` all verified in the named files. `collectChildFeatures` is new (Task 2). The companion branch returns early, before the malice `statblockDomain` path, so malice/terrain are untouched.

## Execution Handoff

Subagent-driven: Task 1 (source transform) is controller-run (surgical, regen-verified) or a careful implementer; Task 2 (classifier) is the core implementer task; Tasks 3–5 are verify/docs. Order 1→2→3→4→5. After 5b lands, write Plan 5c (fixtures).
