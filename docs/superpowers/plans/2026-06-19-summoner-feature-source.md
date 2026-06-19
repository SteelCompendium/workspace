# Summoner `feature_source` (circle / summoner track) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `feature_source` frontmatter field (`summoner` | `circle`) to every Summoner-book feature/ability, surface it on the card eyebrow ("Summoner **Circle** Feature") and the feature-browser facet, carry it into the SDK data, and add a `validate` oracle that cross-checks it against the Summoner Advancement table.

**Architecture:** A book-gated helper `featureSource(ctx, headingLevel)` reads the field from the context stack (own `@feature_source` annotation or an inherited ancestor's, mirroring how `@level` propagates) and defaults Summoner-book features to `summoner`. Only `FeatureParser`/`AbilityParser` consume it, so `statblock`/`featureblock`/`monster-group` descendants (the fixtures under Summoner's Dominion) never inherit it. The field rides in frontmatter (md) and in SDK `metadata` — exactly like the existing `subclass` field. Source edits mark the 10 circle features/containers from the advancement table's "Circle Features" column; the 3 circle-lookup containers propagate `circle` to their pick-children automatically.

**Tech Stack:** Go 1.26 (steel-etl), `devbox` toolchain, the Summoner book Markdown source, the v2 MkDocs site (Go site-builder + a vanilla-JS data island), the `data-sdk-npm` `v3` branch (schemas only).

## Global Constraints

- All Go/CLI commands run under devbox: prefix with `devbox run --` from the workspace root (`/home/vexa/code/steel_compendium/workspace`). Go is **not** on the system PATH.
- This is a **steel-etl** change plus a **v2** hand-authored JS edit. Branch steel-etl from latest `origin/main`. Do **not** hand-edit generated output (`v2/docs/Browse`, `v2/docs/Read`, `v2/docs/scc`, `data/*`); build only to verify, then `git -C v2 restore docs/`. `just deploy-v2` ships generated output after the steel-etl PR merges.
- **`feature_source` is metadata, not identity:** frontmatter only, **no SCC code or path change**. Phase 1 implements only the `summoner` / `circle` tiers; `circle-of-<name>` (the ~24 named-circle picks) is **Phase 2, out of scope** — keep the value space and renderers forward-compatible but do not tag picks.
- **Scope guard:** emit `feature_source` **only** when the section's book key is `mcdm.summoner.*` (look it up from the context stack's document metadata). Non-Summoner books omit the field entirely.
- **⚠️ Schema/allowlist — deliberate deviation from the spec.** The spec's "Schema / SDK" section says to add `feature_source` to both `feature.schema.json` copies and the `schema_validation_test.go` allowlist. **Do NOT do that.** That checklist (from `docs/card-data-parity.md`) is for *passthrough* content types whose frontmatter maps to top-level schema properties. Features/abilities do **not** pass through: `TransformToSDKFormat` routes them via `transformAbility`/`transformTrait`, which place all metadata fields (`class`, `level`, `subclass`, `scc`, …) under the `metadata` object, which is `additionalProperties: true` in both schema copies. There is **no `feature`/`ability` entry** in `schemaAllowedFields` (adding a test case for one would `Fatalf`). The established precedent is `subclass`: carried in SDK `metadata` via `setIfPresent`, **not** declared in the schema. `feature_source` follows `subclass` exactly — Task 2 carries it into `metadata`; **no schema file or allowlist edit, no `data-sdk-npm` change in this plan.** (Mirrors the Spec A discovery that its `classify --all` command didn't exist — the spec was written against a generic template.)
- `feature_source` value space this phase: `summoner` (base class feature), `circle` (universal circle feature). The advancement table is the source of truth for which is which; the oracle validates, it does not generate.
- The Summoner book source: `steel-etl/input/summoner/Draw Steel Summoner.md`. The advancement table is the `###### Summoner Advancement` table (line ~372): columns `Level | Summoner Features | Circle Features | Minions | Abilities`, where every feature cell is a `[Name](scc.v1:mcdm.summoner.v1/feature.summoner.level-N/<id>)` link list and `—` marks an empty column.

---

### Task 1: Parser — emit `feature_source` (book-gated, context-propagated)

The data foundation: a shared helper plus two one-line emissions. After this, every Summoner-book feature/ability carries `feature_source` (defaulting to `summoner`; `circle` only once Task 3 adds the annotations).

**Files:**
- Modify: `steel-etl/internal/content/feature.go` (add `strings` import + `featureSource` helper + emit in `FeatureParser.Parse`)
- Modify: `steel-etl/internal/content/ability.go` (emit in `AbilityParser.Parse`)
- Test: `steel-etl/internal/content/feature_source_test.go` (create)

**Interfaces:**
- Produces: `func featureSource(ctx *context.ContextStack, headingLevel int) string` — returns `""` for non-Summoner books; otherwise the own/inherited `@feature_source` value, or `"summoner"` if none. Defined in `feature.go`, callable from `ability.go` (same package).

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/content/feature_source_test.go`:

```go
package content

import (
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/context"
	"github.com/SteelCompendium/steel-etl/internal/parser"
)

// summonerCtx builds a context stack rooted in the Summoner book with a
// level-N feature-group at H3, optionally carrying @feature_source on the group.
func summonerCtx(level, groupSource string) *context.ContextStack {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.summoner.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "summoner"})
	groupMeta := context.Metadata{"type": "feature-group", "level": level}
	if groupSource != "" {
		groupMeta["feature_source"] = groupSource
	}
	ctx.Push(3, groupMeta)
	return ctx
}

func TestFeatureSource_UnmarkedSummonerFeature(t *testing.T) {
	sec := &parser.Section{Heading: "Perk", HeadingLevel: 4, Annotation: map[string]string{"type": "feature"}}
	res, _ := (&FeatureParser{}).Parse(summonerCtx("2", ""), sec)
	if res.Frontmatter["feature_source"] != "summoner" {
		t.Errorf("feature_source = %v, want summoner", res.Frontmatter["feature_source"])
	}
}

func TestFeatureSource_ExplicitCircleFeature(t *testing.T) {
	sec := &parser.Section{Heading: "Summoner's Dominion", HeadingLevel: 4,
		Annotation: map[string]string{"type": "feature", "feature_source": "circle"}}
	res, _ := (&FeatureParser{}).Parse(summonerCtx("2", ""), sec)
	if res.Frontmatter["feature_source"] != "circle" {
		t.Errorf("feature_source = %v, want circle", res.Frontmatter["feature_source"])
	}
}

func TestFeatureSource_InheritedFromContainer(t *testing.T) {
	// A pick-child under a @feature_source: circle container (e.g. the
	// 1st-level-circle-features container) inherits circle.
	sec := &parser.Section{Heading: "Channel", HeadingLevel: 4, Annotation: map[string]string{"type": "feature"}}
	res, _ := (&FeatureParser{}).Parse(summonerCtx("1", "circle"), sec)
	if res.Frontmatter["feature_source"] != "circle" {
		t.Errorf("inherited feature_source = %v, want circle", res.Frontmatter["feature_source"])
	}
}

func TestFeatureSource_AbilityInherits(t *testing.T) {
	sec := &parser.Section{Heading: "Some Circle Ability", HeadingLevel: 4, Annotation: map[string]string{"type": "ability"}}
	res, _ := (&AbilityParser{}).Parse(summonerCtx("2", "circle"), sec)
	if res.Frontmatter["feature_source"] != "circle" {
		t.Errorf("ability feature_source = %v, want circle", res.Frontmatter["feature_source"])
	}
}

func TestFeatureSource_NonSummonerBookOmitted(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.heroes.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "fury"})
	ctx.Push(3, context.Metadata{"type": "feature-group", "level": "1"})
	sec := &parser.Section{Heading: "Growing Ferocity", HeadingLevel: 4, Annotation: map[string]string{"type": "feature"}}
	res, _ := (&FeatureParser{}).Parse(ctx, sec)
	if _, ok := res.Frontmatter["feature_source"]; ok {
		t.Errorf("non-Summoner feature must omit feature_source, got %v", res.Frontmatter["feature_source"])
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureSource'`
Expected: FAIL — `undefined: featureSource` is not it (the helper is internal); the assertions fail because `feature_source` is never set (the key is absent / not "summoner").

- [ ] **Step 3: Add the helper to `feature.go`**

In `steel-etl/internal/content/feature.go`, change the import block to add `strings`:

```go
import (
	"strings"

	"github.com/SteelCompendium/steel-etl/internal/context"
	"github.com/SteelCompendium/steel-etl/internal/parser"
)
```

Then add the helper after the imports (above `FeatureGroupParser`):

```go
// featureSource returns the feature_source frontmatter value for a feature or
// ability. It is Summoner-book-only: non-Summoner books get "" (field omitted).
// Within the Summoner book the value comes from the section's own
// @feature_source annotation or an inherited ancestor's (via the context stack,
// mirroring @level propagation); unmarked Summoner features default to
// "summoner". Only FeatureParser/AbilityParser call this, so statblock/
// featureblock/monster-group descendants never inherit it. The value space is
// forward-compatible with Phase-2 "circle-of-<name>" slugs. See
// docs/superpowers/specs/2026-06-18-summoner-feature-source-design.md.
func featureSource(ctx *context.ContextStack, headingLevel int) string {
	book, _ := ctx.Lookup(headingLevel, "book")
	if !strings.HasPrefix(book, "mcdm.summoner.") {
		return ""
	}
	if v, ok := ctx.Lookup(headingLevel, "feature_source"); ok && v != "" {
		return v
	}
	return "summoner"
}
```

- [ ] **Step 4: Emit in `FeatureParser.Parse`**

In `feature.go`, in `FeatureParser.Parse`, immediately after the `subclass` block (the `if v, ok := section.Annotation["subclass"]; ...` that ends `fm["subclass"] = parseSubclass(v)`), add:

```go
	if fs := featureSource(ctx, section.HeadingLevel); fs != "" {
		fm["feature_source"] = fs
	}
```

- [ ] **Step 5: Emit in `AbilityParser.Parse`**

In `steel-etl/internal/content/ability.go`, in `AbilityParser.Parse`, right after the companion lookup block (the `companionID, _ := ctx.Lookup(...)` / `if companionID != "" { fm["companion"] = companionID }`) and before the `// Build type path` comment, add:

```go
	if fs := featureSource(ctx, section.HeadingLevel); fs != "" {
		fm["feature_source"] = fs
	}
```

(`ability.go` already imports `strings` and `context`; no import change.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureSource'`
Expected: PASS (all 5 sub-tests).

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/content/feature.go internal/content/ability.go internal/content/feature_source_test.go
git commit -m "feat(content): emit feature_source (summoner|circle) for Summoner-book features"
```

---

### Task 2: SDK transform — carry `feature_source` into `metadata`

So the field reaches the JSON/YAML data, exactly like `subclass`. Two `setIfPresent` lines + one assertion.

**Files:**
- Modify: `steel-etl/internal/output/sdk_transform.go` (`buildAbilityMetadata` + `buildTraitMetadata`)
- Test: `steel-etl/internal/output/sdk_transform_feature_source_test.go` (create)

**Interfaces:**
- Consumes: `feature_source` in `parsed.Frontmatter` (from Task 1).
- Produces: `out["metadata"]["feature_source"]` in the transformed SDK map.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/output/sdk_transform_feature_source_test.go`:

```go
package output

import (
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/content"
)

func metaFromTransform(t *testing.T, fm map[string]any) map[string]any {
	t.Helper()
	out := TransformToSDKFormat("mcdm.summoner.v1/feature.summoner.level-2/x", &content.ParsedContent{Frontmatter: fm, Body: "Body."})
	meta, _ := out["metadata"].(map[string]any)
	if meta == nil {
		t.Fatalf("no metadata in transform output: %v", out)
	}
	return meta
}

func TestSDKMetadata_FeatureSource_Trait(t *testing.T) {
	meta := metaFromTransform(t, map[string]any{"name": "Summoner's Dominion", "type": "feature", "feature_source": "circle"})
	if meta["feature_source"] != "circle" {
		t.Errorf("trait metadata feature_source = %v, want circle", meta["feature_source"])
	}
}

func TestSDKMetadata_FeatureSource_Ability(t *testing.T) {
	meta := metaFromTransform(t, map[string]any{"name": "X", "type": "ability", "feature_source": "summoner"})
	if meta["feature_source"] != "summoner" {
		t.Errorf("ability metadata feature_source = %v, want summoner", meta["feature_source"])
	}
}

func TestSDKMetadata_FeatureSource_AbsentWhenUnset(t *testing.T) {
	meta := metaFromTransform(t, map[string]any{"name": "Growing Ferocity", "type": "feature"})
	if _, ok := meta["feature_source"]; ok {
		t.Errorf("feature_source must be absent when unset, got %v", meta["feature_source"])
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/output/ -run TestSDKMetadata_FeatureSource'`
Expected: FAIL — `feature_source` absent from metadata.

- [ ] **Step 3: Carry the field in both metadata builders**

In `steel-etl/internal/output/sdk_transform.go`, in `buildAbilityMetadata`, after the `setIfPresent(meta, "subclass", fm, "subclass")` line, add:

```go
	setIfPresent(meta, "feature_source", fm, "feature_source")
```

In the same file, in `buildTraitMetadata`, after its `setIfPresent(meta, "subclass", fm, "subclass")` line, add the identical line:

```go
	setIfPresent(meta, "feature_source", fm, "feature_source")
```

- [ ] **Step 4: Run to verify pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/output/ -run TestSDKMetadata_FeatureSource'`
Expected: PASS (3 sub-tests).

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/output/sdk_transform.go internal/output/sdk_transform_feature_source_test.go
git commit -m "feat(output): carry feature_source into SDK feature/ability metadata"
```

---

### Task 3: Source — mark the 10 circle features/containers

Transcribe the advancement table's "Circle Features" column into `@feature_source: circle` annotations. The 3 lookup containers propagate `circle` to their pick-children; the other 7 are direct circle features. Each target section is already `@type: feature | @id: <id> | @level: N`; this **inserts** ` | @feature_source: circle` into the existing annotation comment.

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md`

The 10 explicit-mark sections (current annotation → new annotation). Each `old_string` is unique in the file.

- [ ] **Step 1: Mark `summoner-circle` (L1)**

old_string: `<!-- @type: feature | @id: summoner-circle | @level: 1 -->`
new_string: `<!-- @type: feature | @id: summoner-circle | @level: 1 | @feature_source: circle -->`

- [ ] **Step 2: Mark `1st-level-circle-features` container (L1)**

old_string: `<!-- @type: feature | @id: 1st-level-circle-features | @level: 1 -->`
new_string: `<!-- @type: feature | @id: 1st-level-circle-features | @level: 1 | @feature_source: circle -->`

- [ ] **Step 3: Mark `portfolio` (L1)**

old_string: `<!-- @type: feature | @id: portfolio | @level: 1 -->`
new_string: `<!-- @type: feature | @id: portfolio | @level: 1 | @feature_source: circle -->`

- [ ] **Step 4: Mark `summoners-dominion` (L2)**

old_string: `<!-- @type: feature | @id: summoners-dominion | @level: 2 -->`
new_string: `<!-- @type: feature | @id: summoners-dominion | @level: 2 | @feature_source: circle -->`

- [ ] **Step 5: Mark `new-portfolio-minion` (L2)**

old_string: `<!-- @type: feature | @id: new-portfolio-minion | @level: 2 -->`
new_string: `<!-- @type: feature | @id: new-portfolio-minion | @level: 2 | @feature_source: circle -->`

- [ ] **Step 6: Mark `5th-level-circle-feature` container (L5)**

old_string: `<!-- @type: feature | @id: 5th-level-circle-feature | @level: 5 -->`
new_string: `<!-- @type: feature | @id: 5th-level-circle-feature | @level: 5 | @feature_source: circle -->`

- [ ] **Step 7: Mark `new-portfolio-minion` (L5)**

old_string: `<!-- @type: feature | @id: new-portfolio-minion | @level: 5 -->`
new_string: `<!-- @type: feature | @id: new-portfolio-minion | @level: 5 | @feature_source: circle -->`

- [ ] **Step 8: Mark `return-to-the-source` (L6)**

old_string: `<!-- @type: feature | @id: return-to-the-source | @level: 6 -->`
new_string: `<!-- @type: feature | @id: return-to-the-source | @level: 6 | @feature_source: circle -->`

- [ ] **Step 9: Mark `8th-level-circle-feature` container (L8)**

old_string: `<!-- @type: feature | @id: 8th-level-circle-feature | @level: 8 -->`
new_string: `<!-- @type: feature | @id: 8th-level-circle-feature | @level: 8 | @feature_source: circle -->`

- [ ] **Step 10: Mark `portfolio-champion` (L8)**

old_string: `<!-- @type: feature | @id: portfolio-champion | @level: 8 -->`
new_string: `<!-- @type: feature | @id: portfolio-champion | @level: 8 | @feature_source: circle -->`

- [ ] **Step 11: Verify the SCC registry is unchanged (feature_source is frontmatter only)**

`feature_source` must not touch any SCC code. Diff the Summoner book's codes pristine-vs-edited (the reliable per-book gate — `classify` has no `--all` flag; per-file `classify --diff` floods with cross-book noise):

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify "input/summoner/Draw Steel Summoner.md" 2>&1' \
  | grep -oE "mcdm\.summoner\.v1/[^ ]+" | LC_ALL=C sort -u > /tmp/fs_current.txt
git stash push -- "input/summoner/Draw Steel Summoner.md" >/dev/null
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify "input/summoner/Draw Steel Summoner.md" 2>&1' \
  | grep -oE "mcdm\.summoner\.v1/[^ ]+" | LC_ALL=C sort -u > /tmp/fs_pristine.txt
git stash pop >/dev/null
diff /tmp/fs_pristine.txt /tmp/fs_current.txt && echo "ZERO CODE CHANGE (expected)"
```
Expected: `ZERO CODE CHANGE (expected)` (no diff). If any code changes → STOP; `feature_source` must never affect identity.

- [ ] **Step 12: Verify circle features now emit `feature_source: circle` in frontmatter**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --book mcdm.summoner.v1 --config pipeline.yaml' 2>&1 | tail -2
grep -l "feature_source: circle" data/data-unified/**/feature/summoner/**/*.md 2>/dev/null | head
grep -H "feature_source:" data/data-unified/mcdm.summoner.v1/feature/summoner/level-2/summoners-dominion.md 2>/dev/null \
  || find data -path "*summoner*level-2*summoners-dominion*" -name "*.md" -exec grep -H feature_source {} \;
```
Expected: Summoner's Dominion shows `feature_source: circle`; a base feature like `perk` shows `feature_source: summoner`. (If the `data/` path differs, the same `feature_source:` lines appear in whatever output dir `gen` reports — the assertion is that circle features say `circle` and base features say `summoner`.)

- [ ] **Step 13: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/summoner/Draw Steel Summoner.md"
git commit -m "feat(summoner): annotate circle features with @feature_source: circle"
```

---

### Task 4: Validate oracle — cross-check against the Summoner Advancement table

A non-fatal `WARN` when an emitted `feature_source` disagrees with the advancement table (a circle-column feature not effectively `circle`, a summoner-column feature marked `circle`, or a table feature with no matching emitted feature at that level/id). Isolated in its own file; the existing table is the source of truth.

**Files:**
- Create: `steel-etl/internal/cli/feature_source_check.go`
- Modify: `steel-etl/internal/cli/validate.go` (call the check inside `runValidate`, append its issues)
- Test: `steel-etl/internal/cli/feature_source_check_test.go` (create)

**Interfaces:**
- Produces: `func checkSummonerFeatureSource(source []byte, doc *parser.Document) []validationIssue` — returns `[]` when the source has no `Summoner Advancement` table (non-Summoner books → no-op); otherwise one `warn`-level `validationIssue` per mismatch. Reuses `validationIssue` (defined in `validate.go`, same package).

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/cli/feature_source_check_test.go`:

```go
package cli

import (
	"strings"
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/parser"
)

// A minimal Summoner-shaped document: an advancement table that puts `perk`
// in the Summoner column and `summoners-dominion` in the Circle column at L2,
// plus the two feature sections under a level-2 feature-group.
const fsDoc = "---\nbook: mcdm.summoner.v1\n---\n\n" +
	"###### Summoner Advancement\n\n" +
	"| Level | Summoner Features | Circle Features | Minions | Abilities |\n" +
	"|---|---|---|---|---|\n" +
	"| 2nd | [Perk](scc.v1:mcdm.summoner.v1/feature.summoner.level-2/perk) | [Summoner's Dominion](scc.v1:mcdm.summoner.v1/feature.summoner.level-2/summoners-dominion) | 1 | 5 |\n\n" +
	"## Summoner\n<!-- @type: class | @id: summoner -->\n\n" +
	"<!-- @type: feature-group | @level: 2 -->\n### 2nd-Level Features\n\n" +
	"<!-- @type: feature | @id: perk | @level: 2%s -->\n#### Perk\n\nText.\n\n" +
	"<!-- @type: feature | @id: summoners-dominion | @level: 2%s -->\n#### Summoner's Dominion\n\nText.\n"

func parseFS(t *testing.T, perkExtra, domExtra string) ([]byte, *parser.Document) {
	t.Helper()
	src := []byte(strings.Replace(strings.Replace(fsDoc, "level-2%s", "level-2"+perkExtra, 1), "level-2%s", "level-2"+domExtra, 1))
	// NOTE: the %s placeholders are on the annotation lines, not the codes; see fsDoc.
	doc, err := parser.ParseDocument(src)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	return src, doc
}

func TestFeatureSourceCheck_Aligned(t *testing.T) {
	// perk → summoner (unmarked, default), dominion → circle (marked): no warnings.
	src, doc := parseFS(t, "", " | @feature_source: circle")
	if issues := checkSummonerFeatureSource(src, doc); len(issues) != 0 {
		t.Errorf("aligned table should yield no warnings, got %d: %+v", len(issues), issues)
	}
}

func TestFeatureSourceCheck_CircleColumnNotMarked(t *testing.T) {
	// dominion is in the Circle column but left unmarked (defaults summoner): WARN.
	src, doc := parseFS(t, "", "")
	issues := checkSummonerFeatureSource(src, doc)
	if len(issues) != 1 {
		t.Fatalf("want 1 warning, got %d: %+v", len(issues), issues)
	}
	if !strings.Contains(issues[0].msg, "summoners-dominion") {
		t.Errorf("warning should name summoners-dominion, got %q", issues[0].msg)
	}
}

func TestFeatureSourceCheck_SummonerColumnMarkedCircle(t *testing.T) {
	// perk is in the Summoner column but wrongly marked circle: WARN.
	src, doc := parseFS(t, " | @feature_source: circle", " | @feature_source: circle")
	issues := checkSummonerFeatureSource(src, doc)
	if len(issues) != 1 {
		t.Fatalf("want 1 warning, got %d: %+v", len(issues), issues)
	}
	if !strings.Contains(issues[0].msg, "perk") {
		t.Errorf("warning should name perk, got %q", issues[0].msg)
	}
}

func TestFeatureSourceCheck_NoTableNoOp(t *testing.T) {
	doc, _ := parser.ParseDocument([]byte("## Heroes\n<!-- @type: class | @id: fury -->\n\nNo table here.\n"))
	if issues := checkSummonerFeatureSource([]byte("no table"), doc); len(issues) != 0 {
		t.Errorf("no advancement table should be a no-op, got %+v", issues)
	}
}
```

Note: `fsDoc` uses two `level-2%s` placeholders on the **annotation** lines; `parseFS` replaces them left-to-right (perk first, dominion second) so each test sets each feature's `@feature_source` independently.

- [ ] **Step 2: Run to verify failure**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/cli/ -run TestFeatureSourceCheck'`
Expected: FAIL — `undefined: checkSummonerFeatureSource`.

- [ ] **Step 3: Implement the oracle**

Create `steel-etl/internal/cli/feature_source_check.go`:

```go
package cli

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/SteelCompendium/steel-etl/internal/content"
	"github.com/SteelCompendium/steel-etl/internal/parser"
)

var (
	// Captures an SCC link target inside (...) — optional scc.vN: prefix, stop at ) or #.
	fsSccLinkRe = regexp.MustCompile(`\(scc(?:\.v\d+)?:([^)#]+)`)
	// Reduces a full code to its "level-N/<id>" tail (the comparison key).
	fsCodeTailRe = regexp.MustCompile(`feature\.summoner\.level-(\d+)/([a-z0-9-]+)$`)
)

// checkSummonerFeatureSource cross-checks each feature listed in the Summoner
// Advancement table against the feature_source the parser would emit. It is a
// no-op for documents without that table. Mismatches are non-fatal warnings.
func checkSummonerFeatureSource(source []byte, doc *parser.Document) []validationIssue {
	expected := parseAdvancementExpectations(string(source)) // key "level-N/<id>" -> "summoner"|"circle"
	if len(expected) == 0 {
		return nil
	}
	actual := map[string]string{} // key "level-N/<id>" -> effective feature_source
	collectFeatureSources(doc.Sections, "", "", actual)

	// Stable output order.
	keys := make([]string, 0, len(expected))
	for k := range expected {
		keys = append(keys, k)
	}
	sortStrings(keys)

	var issues []validationIssue
	for _, key := range keys {
		want := expected[key]
		got, ok := actual[key]
		if !ok {
			issues = append(issues, validationIssue{
				level: "warn",
				msg:   fmt.Sprintf("advancement table lists %q (%s) but no feature with that level/id was emitted", key, want),
			})
			continue
		}
		if got != want {
			issues = append(issues, validationIssue{
				level: "warn",
				msg:   fmt.Sprintf("feature_source mismatch for %q: advancement table column says %q, emitted %q", key, want, got),
			})
		}
	}
	return issues
}

// parseAdvancementExpectations finds the Summoner Advancement table and maps each
// linked feature (by its level-N/<id> tail) to the column it sits in.
func parseAdvancementExpectations(source string) map[string]string {
	lines := strings.Split(source, "\n")
	out := map[string]string{}
	sumCol, circleCol := -1, -1
	inTable := false
	for _, line := range lines {
		t := strings.TrimSpace(line)
		if !strings.HasPrefix(t, "|") {
			if inTable {
				break // table ended
			}
			continue
		}
		cells := splitPipeRow(t)
		if sumCol < 0 {
			// Header row: locate the two feature columns.
			for i, c := range cells {
				switch strings.TrimSpace(c) {
				case "Summoner Features":
					sumCol = i
				case "Circle Features":
					circleCol = i
				}
			}
			if sumCol >= 0 && circleCol >= 0 {
				inTable = true
			}
			continue
		}
		if strings.Contains(t, "---") {
			continue // separator row
		}
		addColumnCodes(cells, sumCol, "summoner", out)
		addColumnCodes(cells, circleCol, "circle", out)
	}
	return out
}

func addColumnCodes(cells []string, col int, source string, out map[string]string) {
	if col < 0 || col >= len(cells) {
		return
	}
	for _, m := range fsSccLinkRe.FindAllStringSubmatch(cells[col], -1) {
		if tail := fsCodeTailRe.FindStringSubmatch(strings.TrimSpace(m[1])); tail != nil {
			out["level-"+tail[1]+"/"+tail[2]] = source
		}
	}
}

// collectFeatureSources threads level + feature_source down the section tree and
// records the effective feature_source for every feature/ability, keyed by
// "level-N/<id>" — mirroring FeatureParser/AbilityParser (own annotation wins,
// else inherited, else "summoner").
func collectFeatureSources(sections []*parser.Section, inheritedLevel, inheritedSource string, out map[string]string) {
	for _, sec := range sections {
		level, source := inheritedLevel, inheritedSource
		if sec.Annotation != nil {
			if v, ok := sec.Annotation["level"]; ok && v != "" {
				level = v
			}
			if v, ok := sec.Annotation["feature_source"]; ok && v != "" {
				source = v
			}
		}
		if t := sec.Type(); (t == "feature" || t == "ability") && level != "" {
			id := sec.ID()
			if id == "" {
				id = content.Slugify(content.CleanHeading(sec.Heading))
			}
			eff := source
			if eff == "" {
				eff = "summoner"
			}
			out["level-"+level+"/"+id] = eff
		}
		collectFeatureSources(sec.Children, level, source, out)
	}
}

// splitPipeRow splits a markdown table row on unescaped pipes, trimming the
// leading/trailing border pipes. (Local helper; the ability table splitter lives
// in another package.)
func splitPipeRow(row string) []string {
	row = strings.Trim(strings.TrimSpace(row), "|")
	parts := strings.Split(row, "|")
	cells := make([]string, len(parts))
	for i, p := range parts {
		cells[i] = strings.TrimSpace(p)
	}
	return cells
}

func sortStrings(s []string) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1] > s[j]; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}
```

- [ ] **Step 4: Run to verify pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/cli/ -run TestFeatureSourceCheck'`
Expected: PASS (4 sub-tests). If `sec.ID()` does not exist on `*parser.Section`, check `internal/content/feature.go` (it calls `section.ID()`), so the method exists; if the package path for `Slugify`/`CleanHeading` differs, they are exported from `internal/content` (used unqualified there).

- [ ] **Step 5: Wire the oracle into `runValidate`**

In `steel-etl/internal/cli/validate.go`, after the `walkSections(doc.Sections, 0)` call (around line 134) and before the `// --- 3. Run the pipeline to check SCC stability ---` block, add:

```go
	// Summoner-only: cross-check feature_source against the advancement table.
	// No-op for books without a "Summoner Advancement" table.
	issues = append(issues, checkSummonerFeatureSource(source, doc)...)
```

(`source` is the `[]byte` read at the top of `runValidate`; `doc` is the parsed document; `issues` is the existing slice.)

- [ ] **Step 6: Verify the oracle is clean on the real Summoner book**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate "input/summoner/Draw Steel Summoner.md" 2>&1 | grep -iE "feature_source|advancement table"'`
Expected: **no output** (Task 3 aligned every advancement-table feature). If a `WARN` appears, a circle feature is unmarked (or a summoner feature is mismarked) — fix the annotation in Task 3's source edits, not the oracle.

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/cli/feature_source_check.go internal/cli/validate.go internal/cli/feature_source_check_test.go
git commit -m "feat(validate): warn on feature_source drift vs the Summoner advancement table"
```

---

### Task 5: Card eyebrow — "Summoner Circle Feature"

Insert the `feature_source` qualifier between the class name and the feature noun in the recessed feature/trait card eyebrow. `circle` → "Summoner Circle Feature"; `summoner`/absent → today's "Summoner Feature".

**Files:**
- Modify: `steel-etl/internal/site/trait_cards.go` (`traitEyebrow`)
- Test: `steel-etl/internal/site/trait_cards_test.go` (create)

**Interfaces:**
- Consumes: the `feature_source` frontmatter field via `parseFrontmatterField(fm, "feature_source")`.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/trait_cards_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

func TestTraitEyebrow_CircleFeature(t *testing.T) {
	fm := "class: summoner\ntype: feature\nfeature_source: circle\n"
	if got := traitEyebrow(fm); got != "Summoner Circle Feature" {
		t.Errorf("traitEyebrow = %q, want %q", got, "Summoner Circle Feature")
	}
}

func TestTraitEyebrow_SummonerFeatureUnchanged(t *testing.T) {
	for _, fm := range []string{
		"class: summoner\ntype: feature\nfeature_source: summoner\n",
		"class: summoner\ntype: feature\n", // absent
	} {
		if got := traitEyebrow(fm); got != "Summoner Feature" {
			t.Errorf("traitEyebrow(%q) = %q, want %q", fm, got, "Summoner Feature")
		}
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestTraitEyebrow'`
Expected: FAIL — the circle case returns "Summoner Feature" (qualifier not inserted yet).

- [ ] **Step 3: Insert the qualifier in `traitEyebrow`**

In `steel-etl/internal/site/trait_cards.go`, replace the body of `traitEyebrow` with:

```go
func traitEyebrow(fm string) string {
	source := ""
	for _, key := range []string{"class", "ancestry", "kit"} {
		if v := strings.TrimSpace(parseFrontmatterField(fm, key)); v != "" {
			source = titleCase(strings.ReplaceAll(v, "-", " "))
			break
		}
	}
	// feature_source qualifier: "circle" → "<Class> Circle Feature". The "summoner"
	// base track (and absence) keeps the bare "<Class> Feature". Forward-compatible
	// with Phase-2 "circle-of-<name>" slugs (title-cased the same way).
	if fs := strings.TrimSpace(parseFrontmatterField(fm, "feature_source")); fs != "" && fs != "summoner" && source != "" {
		source = strings.TrimSpace(source + " " + titleCase(strings.ReplaceAll(fs, "-", " ")))
	}
	label := strings.TrimSpace(source + " " + featureNoun(parseFrontmatterField(fm, "type")))
	if sub := strings.TrimSpace(parseFrontmatterField(fm, "subclass")); sub != "" {
		label += " · " + titleCase(strings.ReplaceAll(sub, "-", " "))
	}
	return label
}
```

- [ ] **Step 4: Run to verify pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestTraitEyebrow'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/trait_cards.go internal/site/trait_cards_test.go
git commit -m "feat(site): card eyebrow shows 'Summoner Circle Feature' for circle features"
```

---

### Task 6: Browse facet — `feature_source` in the data island + Track facet

Add `feature_source` to each `browseItem` JSON, and a circle/summoner facet to the feature browser. The facet auto-appears only where both values exist (the JS filters facets with ≤1 value), so it shows on Summoner indexes and nowhere else.

**Files:**
- Modify: `steel-etl/internal/site/feature_index.go` (`browseItem` struct + `extractPreviewItem`)
- Modify: `v2/docs/javascripts/steel-feature-browser.js` (facet definition)
- Test: `steel-etl/internal/site/feature_index_feature_source_test.go` (create)

**Interfaces:**
- Consumes: `feature_source` frontmatter (Task 1) via `parseFrontmatterField`.
- Produces: `browseItem.FeatureSource` (JSON key `feature_source`), consumed by the JS facet `{ key: "feature_source", ... }`.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/feature_index_feature_source_test.go`:

```go
package site

import "testing"

func TestExtractPreviewItem_FeatureSource(t *testing.T) {
	fm := "name: Summoner's Dominion\ntype: feature\nclass: summoner\nlevel: 2\nfeature_source: circle\n"
	it := extractPreviewItem(fm, "", "feature", "summoner")
	if it.FeatureSource != "circle" {
		t.Errorf("FeatureSource = %q, want circle", it.FeatureSource)
	}
}

func TestExtractPreviewItem_FeatureSourceAbsent(t *testing.T) {
	fm := "name: Growing Ferocity\ntype: feature\nclass: fury\nlevel: 1\n"
	it := extractPreviewItem(fm, "", "feature", "fury")
	if it.FeatureSource != "" {
		t.Errorf("FeatureSource = %q, want empty", it.FeatureSource)
	}
}
```

- [ ] **Step 2: Run to verify failure**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestExtractPreviewItem_FeatureSource'`
Expected: FAIL — `it.FeatureSource undefined` (field not on the struct yet).

- [ ] **Step 3: Add the struct field**

In `steel-etl/internal/site/feature_index.go`, in the `browseItem` struct, add the field after `Subclass`:

```go
	FeatureSource string `json:"feature_source,omitempty"`
```

- [ ] **Step 4: Populate it in `extractPreviewItem`**

In `extractPreviewItem`, in the `it := browseItem{ ... }` literal (alongside `Klass`, `Source`, `Subclass`), add:

```go
		FeatureSource: strings.TrimSpace(parseFrontmatterField(fm, "feature_source")),
```

- [ ] **Step 5: Run to verify pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestExtractPreviewItem_FeatureSource'`
Expected: PASS.

- [ ] **Step 6: Add the Track facet to the browser JS**

In `v2/docs/javascripts/steel-feature-browser.js`, in the `facets` array (the `var facets = [ ... ].filter(...)` block), add this entry after the `keywords` facet line:

```javascript
      { key: "feature_source", label: "Track", values: uniqueSorted(null, items, "feature_source"), display: cap }
```

So the array becomes:

```javascript
    var facets = [
      { key: "kind",     label: "Type",    values: ["feature", "ability", "trait"], display: cap },
      { key: "klass",    label: "Source",  values: srcValues, dot: function (v) { return srcColor(klassSrc[v]); } },
      { key: "level",    label: "Level",   values: uniqueSorted(null, items, "level", true), display: function (v) { return "Lv " + v; } },
      { key: "action",   label: "Action",  values: uniqueSorted(null, items, "action"), display: function (v) { return (ACTIONS[v] || {}).label || cap(v); }, dot: actionColor },
      { key: "keywords", label: "Keyword", values: uniqueSorted(null, items, "keywords") },
      { key: "feature_source", label: "Track", values: uniqueSorted(null, items, "feature_source"), display: cap }
    ].filter(function (f) { return f.values.length > 1; });
```

(`cap` is the existing title-case helper; `matches()` reads `it[f.key]` generically, so no other JS change is needed. The `.filter(... length > 1)` hides the facet on non-Summoner indexes.)

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/feature_index.go internal/site/feature_index_feature_source_test.go
git commit -m "feat(site): emit feature_source in browse data island"
cd /home/vexa/code/steel_compendium/workspace/v2
git add docs/javascripts/steel-feature-browser.js
git commit -m "feat(v2): add circle/summoner Track facet to the feature browser"
```

(Two repos → two commits. The v2 commit is hand-authored JS source, not generated output.)

---

### Task 7: Full build + integration verification

Confirm the whole chain end-to-end: circle features carry the field, the eyebrow reads right, the fixtures under Summoner's Dominion stay clean (containment), the facet data is present, and the full suite is green. Verification only — no source commits; deploy owns the generated output.

**Files:** none modified (build + assertions).

- [ ] **Step 1: Full pipeline + site build**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml && go run ./cmd/steel-etl site --config ../v2/site.yaml' 2>&1 | grep -v "^Info:\|^\[notice\]\|^To update\|pip install" | tail -5
```
Expected: completes; "Sections built: 2".

- [ ] **Step 2: Circle feature eyebrow renders "Summoner Circle Feature"**

```bash
grep -o "Summoner Circle Feature" /home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/summoners-dominion.md | head -1
```
Expected: `Summoner Circle Feature`.

- [ ] **Step 3: Base feature eyebrow unchanged ("Summoner Feature", no "Circle")**

```bash
f=/home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/perk.md
echo "summoner-feature:$(grep -c 'Summoner Feature' $f) stray-circle:$(grep -c 'Summoner Circle' $f)"
```
Expected: `summoner-feature:` ≥ 1, `stray-circle:0`.

- [ ] **Step 4: Containment — fixtures under Summoner's Dominion carry NO feature_source**

The fixtures are `featureblock`/`statblock` descendants and must stay clean (they are not class features). Check the generated fixture pages:

```bash
cd /home/vexa/code/steel_compendium/workspace
find v2/docs/Browse -path "*summoner*" -name "*.md" -exec grep -l "feature_source" {} \; \
  | xargs -r grep -L "type: feature\|type: ability" 2>/dev/null \
  && echo "LEAK: a non-feature page carries feature_source" || echo "clean: feature_source only on features/abilities"
```
Expected: `clean: feature_source only on features/abilities`. (Cross-check the data side too:)
```bash
grep -rl "feature_source" data 2>/dev/null | grep -iE "statblock|featureblock|fixture|minion/" | head || echo "no feature_source on statblock/featureblock data"
```
Expected: `no feature_source on statblock/featureblock data`.

- [ ] **Step 5: Browse data island carries feature_source on Summoner indexes**

```bash
grep -o '"feature_source":"circle"' /home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/index.md | head -1
```
Expected: `"feature_source":"circle"` (the data island JSON includes the field).

- [ ] **Step 6: Restore generated output (deploy owns it)**

```bash
cd /home/vexa/code/steel_compendium/workspace
git -C v2 restore docs/
git -C v2 clean -fd docs/   # drop any untracked generated dirs the build emitted
git -C v2 status --porcelain | wc -l
```
Expected: `0`.

- [ ] **Step 7: Full steel-etl test suite**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./...'`
Expected: all packages `ok`.

This task has no commit — it is the integration gate before opening the PR. After it passes, push the steel-etl branch and open a PR to `SteelCompendium/steel-etl`; the v2 JS commit ships from the `v2` repo; `just deploy-v2` regenerates + ships the site after the steel-etl merge + submodule bump (per `docs/git-workflow.md`).

---

## Self-Review

- **Spec coverage:**
  - *New `feature_source` field, summoner/circle tiers, Summoner-book only* → Task 1 (helper + emission, book-gated) + Global Constraints. ✓
  - *Annotation + propagation (explicit-mark set; descendant feature/ability inherit; statblock/featureblock/monster-group never inherit; default summoner)* → Task 1 (propagation via context stack; containment by consumer) + Task 3 (the 10 marks) + Task 7 Step 4 (containment verified). ✓
  - *Validation oracle (parse advancement table, cross-check column+level, non-fatal WARN)* → Task 4. ✓
  - *Card eyebrow "Summoner Circle Feature"; ability eyebrow unchanged* → Task 5 (feature/trait eyebrow; ability cards use the action-typed eyebrow, untouched — `feature_source` still emits in ability frontmatter/data per Task 1/2). ✓
  - *Filter facet on `.sc-browse-mount`, `feature_source` in each browseItem, instant-nav-safe* → Task 6 (the JS already uses the `*-mount` + `document$` pattern; we only add a facet entry + JSON field). ✓
  - *Schema / SDK (field promoted into data)* → Task 2 carries it into SDK `metadata`; the spec's schema-file/allowlist edits are **deliberately skipped** (Global Constraints — `feature`/`ability` route through metadata like `subclass`, which is not schema-declared; the TS-SDK consumer side is a separate tracked effort per `card-data-parity.md` step 5). ✓
  - *Testing (content/validate/eyebrow unit tests; build/visual)* → Tasks 1, 4, 5, 6 unit tests + Task 7 integration. ✓
  - *Out of scope: Phase-2 circle-of-<name>, other classes, removing subclass, generating the table* → not touched; renderers/value space left forward-compatible. ✓
- **Placeholder scan:** none — every code step has complete code; the 10 source edits are exact old/new strings; the oracle and tests are full implementations.
- **Type consistency:** `featureSource(ctx, headingLevel) string` used identically in Tasks 1 (feature.go/ability.go). `checkSummonerFeatureSource(source []byte, doc *parser.Document) []validationIssue` defined (Task 4 Step 3) and called (Task 4 Step 5) with the same signature; reuses the existing `validationIssue` struct. `browseItem.FeatureSource` (json `feature_source`) defined (Task 6 Step 3), populated (Step 4), and consumed by the JS facet `key: "feature_source"` (Step 6). Eyebrow reads `feature_source` via `parseFrontmatterField` (Task 5), the same value Task 1 emits.
- **Known adaptation risks for the executor:** (1) `sec.ID()` is assumed on `*parser.Section` (it is — `feature.go` calls `section.ID()`); if absent, fall back to `content.Slugify(content.CleanHeading(sec.Heading))` only. (2) The `data/` output paths in Task 3 Step 12 / Task 7 may vary by config; the assertion is the field *value*, not the exact path — adjust the glob to whatever dir `gen` reports. (3) If `cap` is not in scope in the JS file under that name, use the file's existing title-case helper (grep for `function cap`).
