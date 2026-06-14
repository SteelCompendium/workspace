# Companion SCC Restructure Implementation Plan (Featureblock Plan 5a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-home the beastheart companions and their member features/abilities from `feature-group.companion/<id>` + `feature[.ability].companion.<id>.level-N/<x>` into the `monster.companion.beastheart.*` namespace (a `beastheart` subgroup segment inserted throughout), mirroring the Monsters-book Rivals — then re-sweep the 13 inbound `scc:` links so nothing dangles.

**Architecture:** Plan 5a of the companion-restructure-advancement effort (spec: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`). **Classifier-only + link re-sweep — no source *structural* change** (the `@class: beastheart` context already reaches companions from the `## Beastheart` class section; the existing `@level` separators still feed advancement levels). Three `internal/content` path-branches change: the companion **container** (`FeatureGroupParser`) gets `TypePath = monster.companion.beastheart.statblock` / `ItemID = <species>`; the companion **feature** (`FeatureParser`) and **ability** (`AbilityParser`) branches insert the `beastheart` class segment. The registry is **`freeze: false`** (`pipeline.yaml:25`) so `gen --all` rebuilds it clean — this is a deliberate re-mint, recorded in `docs/scc-log.md`; `--scc-stable` reports the delta informationally (it is not a hard gate when freeze is off). The advancement-features entity, the source header injection, and site rendering are **Plan 5b** (not here).

**Tech Stack:** Go (steel-etl `internal/content`, `internal/scc`), table-driven Go tests. Toolchain via **devbox** — Go is not on PATH, so prefix every command, e.g. `devbox run -- go test ./...`. Run from `steel-etl/` (the Go module root).

---

## Context: what already exists (do NOT rebuild)

- **Code assembly:** `scc.Classify(source, typePath, itemID)` (`internal/scc/classifier.go:14`) = `source + "/" + strings.Join(typePath, ".") + "/" + itemID`. Restructuring = changing the `TypePath []string` a parser returns.
- **`FeatureGroupParser`** (`internal/content/feature.go:14`): the companion container. Today its companion branch (lines 31–35) sets `TypePath = []string{"feature-group", "companion"}`, `ItemID = companion` → `feature-group.companion/wolf`. It also pushes `companion` context to descendants (via the pipeline's `contextStack.Push` of each section's annotation, `pipeline.go:142`).
- **`FeatureParser`** (`internal/content/feature.go:46`): companion features. `classID := findAncestorID(ctx, level, "class")` (line 55) — **resolves to `beastheart`** in production because `## Beastheart` carries `<!-- @type: class | @id: beastheart -->` (source line 270) and the companions are inside that class scope (the generated pages already carry `class: beastheart`). The companion path branch (lines 115–116) appends `"companion", companionID` → `feature.companion.wolf.level-N/<id>`.
- **`AbilityParser`** (`internal/content/ability.go:46`): companion abilities. Companion branch (lines 107–108) appends `"companion", companionID` → `feature.ability.companion.wolf.level-N/<id>`. Confirm it computes a class id the same way (`findAncestorID(ctx, section.HeadingLevel, "class")`); if it does not yet, add that lookup (the pattern is identical to FeatureParser line 55).
- **`compactPath(parts...)`** (`internal/content/monster.go:41`) drops empty segments — use it for the container path so a missing class id can't emit `monster.companion..statblock`.
- **`findAncestorID`** (`internal/content/helpers.go:18`), **`Slugify`** (`helpers.go:41`) — same package, reuse directly.
- **Tests** live in `internal/content/content_test.go`: `TestFeatureParser_TaxonomyPaths` (line 151, companion case line 161), `TestAbilityCompanionTypePath` (line 540, want line 555), the advancement-feature path test (want line 580: `feature.companion.wolf.level-3/my-what-big-teeth-you-have`), `TestFeatureGroupParser` companion case (want line 600: `feature-group.companion/wolf`). **These tests do NOT push a `class` context today**, so they assert the *old* paths — they must be updated to push `class: beastheart` and assert the new paths (Tasks 1–3).

### Target transform (the contract)

| Entity | Today | Target |
|---|---|---|
| container | `feature-group.companion/wolf` | `monster.companion.beastheart.statblock/wolf` |
| feature | `feature.companion.wolf.level-1/retriever` | `feature.companion.beastheart.wolf.level-1/retriever` |
| ability | `feature.ability.companion.wolf.level-1/clamping-jaws` | `feature.ability.companion.beastheart.wolf.level-1/clamping-jaws` |
| adv. feature | `feature.companion.wolf.level-6/call-of-the-wild` | `feature.companion.beastheart.wolf.level-6/call-of-the-wild` |

**Design rule (the empty-class guard):** insert the class segment **only when non-empty**, so a context without `class` (e.g. a future non-class companion, or a bare unit test) yields `…companion.<species>…` rather than a double-dot `…companion..<species>…`. In production the class is always `beastheart`.

---

## Task 1: `FeatureParser` — insert the class segment in companion feature paths

**Files:**
- Modify: `steel-etl/internal/content/feature.go` (companion branch, ~lines 115–116)
- Test: `steel-etl/internal/content/content_test.go` (`TestFeatureParser_TaxonomyPaths`, ~line 151)

- [ ] **Step 1: Update the failing test**

In `TestFeatureParser_TaxonomyPaths`, change the companion case to push a class ancestor and expect the `beastheart` segment. Replace the companion case row (line 161) and the companion-context push (lines 166–167):

```go
		{"companion feature carries class segment", "companion", "wolf", "feature", []string{"feature", "companion", "beastheart", "wolf"}},
```

and in the `t.Run` body, where `tc.homeType == "companion"`:

```go
			if tc.homeType == "companion" {
				ctx.Push(1, context.Metadata{"type": "class", "id": "beastheart"})
				ctx.Push(2, context.Metadata{"type": "feature-group", "companion": tc.homeID})
			} else {
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/content/ -run TestFeatureParser_TaxonomyPaths -v`
Expected: FAIL on the companion case — got `[feature companion wolf]`, want `[feature companion beastheart wolf]`.

- [ ] **Step 3: Write the minimal implementation**

In `feature.go`, the companion branch (currently `if companionID != "" { typePath = append(typePath, "companion", companionID) }`) becomes:

```go
	if companionID != "" {
		// Companion features carry the owning class as a subgroup segment
		// (feature.companion.beastheart.wolf.level-N/<id>), mirroring the
		// monster.companion.beastheart.* container. classID is computed above
		// (findAncestorID … "class"); guard against empty so we never emit a
		// double-dot path.
		typePath = append(typePath, "companion")
		if classID != "" {
			typePath = append(typePath, classID)
		}
		typePath = append(typePath, companionID)
	} else if classID != "" {
```

(`classID` is already declared at line 55. Leave the `fm["class"] = classID` assignment at lines 90–91 unchanged — it already stamps `class: beastheart`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/content/ -run TestFeatureParser_TaxonomyPaths -v`
Expected: PASS (all three cases).

- [ ] **Step 5: Update the advancement-feature path test**

The existing test asserting `feature.companion.wolf.level-3/my-what-big-teeth-you-have` (content_test.go ~line 567–580) pushes only `{"type":"feature-group","companion":"wolf","level":"1"}`. Add a class ancestor and update the want. Change its context push to:

```go
	ctx.Push(1, context.Metadata{"type": "class", "id": "beastheart"})
	ctx.Push(3, context.Metadata{"type": "feature-group", "companion": "wolf", "level": "1"})
```

and the expectation to:

```go
	want := "mcdm.beastheart.v1/feature.companion.beastheart.wolf.level-3/my-what-big-teeth-you-have"
```

Run: `devbox run -- go test ./internal/content/ -run TestFeature -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/content/feature.go internal/content/content_test.go
git commit -m "feat(scc): companion features carry beastheart class segment"
```

---

## Task 2: `AbilityParser` — insert the class segment in companion ability paths

**Files:**
- Modify: `steel-etl/internal/content/ability.go` (companion branch, ~lines 107–108)
- Test: `steel-etl/internal/content/content_test.go` (`TestAbilityCompanionTypePath`, ~line 540)

- [ ] **Step 1: Update the failing test**

In `TestAbilityCompanionTypePath` (~line 540), push a class ancestor before the feature-group push and update the want. Change the push (line 543) to:

```go
	ctx.Push(1, context.Metadata{"type": "class", "id": "beastheart"})
	ctx.Push(3, context.Metadata{"type": "feature-group", "companion": "wolf", "level": "1"})
```

and the want (line 555) to:

```go
	want := "mcdm.beastheart.v1/feature.ability.companion.beastheart.wolf.level-1/clamping-jaws"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/content/ -run TestAbilityCompanionTypePath -v`
Expected: FAIL — got `…feature.ability.companion.wolf.level-1/…`, want `…companion.beastheart.wolf…`.

- [ ] **Step 3: Write the minimal implementation**

First confirm AbilityParser computes a class id. Run `grep -n 'classID\|findAncestorID\|parentID\|"class"' internal/content/ability.go`. If a `classID` (or class-typed `parentID`) is not already available in the companion branch's scope, add right above the `typePath := []string{"feature", "ability"}` line:

```go
	classID := findAncestorID(ctx, section.HeadingLevel, "class")
```

Then change the companion branch (currently `typePath = append(typePath, "companion", companionID)`):

```go
	if companionID != "" {
		// feature.ability.companion.beastheart.wolf.level-N/<id> — mirror the
		// FeatureParser companion path (empty-class guard).
		typePath = append(typePath, "companion")
		if classID != "" {
			typePath = append(typePath, classID)
		}
		typePath = append(typePath, companionID)
	} else if parentID != "" {
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/content/ -run TestAbilityCompanionTypePath -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/content/ability.go internal/content/content_test.go
git commit -m "feat(scc): companion abilities carry beastheart class segment"
```

---

## Task 3: `FeatureGroupParser` — companion container → `monster.companion.beastheart.statblock`

**Files:**
- Modify: `steel-etl/internal/content/feature.go` (companion branch, ~lines 31–35)
- Test: `steel-etl/internal/content/content_test.go` (`TestFeatureGroupParser`, ~line 86 / want ~line 600)

- [ ] **Step 1: Update the failing test**

Find the companion `TestFeatureGroupParser` assertion (the block whose `want` is `mcdm.beastheart.v1/feature-group.companion/wolf`, ~line 593–601). Push a class ancestor and update the want:

```go
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.beastheart.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "beastheart"})
	section := &parser.Section{
		Heading:      "Wolf",
		HeadingLevel: 4,
		Annotation:   map[string]string{"type": "feature-group", "companion": "wolf", "level": "1"},
	}
	// … parse …
	want := "mcdm.beastheart.v1/monster.companion.beastheart.statblock/wolf"
```

(Keep the rest of the assertion shape; only the context push, heading level, and `want` change. If the test currently uses heading level 3, use 4 here so the class at level 2 is an ancestor — any child level > 2 works.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- go test ./internal/content/ -run TestFeatureGroupParser -v`
Expected: FAIL — got `feature-group.companion/wolf`, want `monster.companion.beastheart.statblock/wolf`.

- [ ] **Step 3: Write the minimal implementation**

In `feature.go`, the companion branch of `FeatureGroupParser.Parse` (lines 31–35) becomes:

```go
	// Companion species containers (beastheart) are first-class. They are
	// statblock-IDENTITY entities in the monster.companion.<class>.* namespace
	// (mirroring monster.rivals.<echelon>.statblock), but keep rendering as a
	// feature-group page (spec 2026-06-13 §5) and still push `companion`
	// context to their member features/abilities.
	if companion, ok := section.Annotation["companion"]; ok && companion != "" {
		fm["companion"] = companion
		classID := findAncestorID(ctx, section.HeadingLevel, "class")
		result.TypePath = compactPath("monster", "companion", classID, "statblock")
		result.ItemID = companion
	}
```

(`compactPath` and `findAncestorID` are both in package `content` — no import change. The `fm["type"]` stays `"feature-group"` so the page still renders as markdown, per spec §5.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- go test ./internal/content/ -run TestFeatureGroupParser -v`
Expected: PASS.

- [ ] **Step 5: Full content-package tests (no regressions)**

Run: `devbox run -- go test ./internal/content/...`
Expected: PASS. Non-companion feature-groups are unaffected (they never entered the companion branch); non-companion features/abilities keep their paths (the new segment is inside the `companionID != ""` branch only).

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/content/feature.go internal/content/content_test.go
git commit -m "feat(scc): companion container -> monster.companion.beastheart.statblock"
```

---

## Task 4: Regenerate, confirm the SCC delta, build green

**Files:** none (build + verification)

- [ ] **Step 1: Build + vet + full test**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
devbox run -- go build ./... && devbox run -- go vet ./... && devbox run -- go test ./...
```
Expected: clean.

- [ ] **Step 2: Regenerate the beastheart book and inspect the new codes**

`gen --all` rebuilds the registry clean (freeze is off). From the workspace root, regenerate (consult `steel-etl/CLAUDE.md` for the exact `gen --all`/`--book` invocation; beastheart is `mcdm.beastheart.v1`):

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- go -C steel-etl run ./cmd/steel-etl gen --all --config steel-etl/pipeline.yaml
grep -oE 'mcdm\.beastheart\.v1/[^"]*wolf[^"]*' steel-etl/classification.json | sort -u
```
Expected — the wolf codes are now:
```
mcdm.beastheart.v1/feature.ability.companion.beastheart.wolf.level-1/clamping-jaws
mcdm.beastheart.v1/feature.companion.beastheart.wolf.level-1/retriever
mcdm.beastheart.v1/feature.companion.beastheart.wolf.level-3/my-what-big-teeth-you-have
mcdm.beastheart.v1/feature.companion.beastheart.wolf.level-6/call-of-the-wild
mcdm.beastheart.v1/feature.companion.beastheart.wolf.level-10/dire-wolf
mcdm.beastheart.v1/monster.companion.beastheart.statblock/wolf
```
and **no** `feature-group.companion/*` or `feature.companion.<species>.*` (classless) companion codes remain. Spot-check 2–3 other companions (basilisk, drake, panther).

- [ ] **Step 3: Record the intended delta (this is expected, not a regression)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
devbox run -- go run ./cmd/steel-etl classify --diff --config pipeline.yaml | grep -i companion | head -40
```
Expected: every companion container/feature/ability code shows old (removed) → new (added) with the `beastheart` segment. **This is the deliberate restructure** — capture this output for the `scc-log.md` entry (Task 6). (`--scc-stable` is informational here because `freeze: false`; do not treat the delta as a failure.)

---

## Task 5: Re-sweep the 13 inbound `scc:` links

**Files:** `steel-etl/input/**` (the source `.md` books — heroes/monsters/summoner/beastheart)

- [ ] **Step 1: Enumerate the live inbound links**

```bash
cd /home/vexa/code/steel_compendium/workspace
grep -rn 'scc:mcdm\.beastheart\.v1/feature-group\.companion/\|scc:mcdm\.beastheart\.v1/feature\.companion\.\|scc:mcdm\.beastheart\.v1/feature\.ability\.companion\.' steel-etl/input/
```
Expected: ~13 hits (verified 2026-06-13). They split into three shapes:
- `feature-group.companion/<species>` → `monster.companion.beastheart.statblock/<species>`
- `feature.companion.<species>.level-N/<id>` → `feature.companion.beastheart.<species>.level-N/<id>`
- `feature.ability.companion.<species>.level-N/<id>` → `feature.ability.companion.beastheart.<species>.level-N/<id>`

- [ ] **Step 2: Apply the three transforms**

Run these three `perl` in-place edits across the input tree (order matters — the container rule is distinct; the two `feature` rules insert `beastheart.` after `companion.`):

```bash
cd /home/vexa/code/steel_compendium/workspace
# container: feature-group.companion/<sp> -> monster.companion.beastheart.statblock/<sp>
grep -rl 'scc:mcdm\.beastheart\.v1/feature-group\.companion/' steel-etl/input \
  | xargs perl -pi -e 's{scc:mcdm\.beastheart\.v1/feature-group\.companion/}{scc:mcdm.beastheart.v1/monster.companion.beastheart.statblock/}g'
# ability: feature.ability.companion.<sp>. -> feature.ability.companion.beastheart.<sp>.
grep -rl 'scc:mcdm\.beastheart\.v1/feature\.ability\.companion\.' steel-etl/input \
  | xargs perl -pi -e 's{scc:mcdm\.beastheart\.v1/feature\.ability\.companion\.}{scc:mcdm.beastheart.v1/feature.ability.companion.beastheart.}g'
# feature: feature.companion.<sp>. -> feature.companion.beastheart.<sp>.  (NOT the ability form, already done)
grep -rl 'scc:mcdm\.beastheart\.v1/feature\.companion\.' steel-etl/input \
  | xargs perl -pi -e 's{scc:mcdm\.beastheart\.v1/feature\.companion\.}{scc:mcdm.beastheart.v1/feature.companion.beastheart.}g'
```

- [ ] **Step 3: Verify no stale links remain and the new ones resolve**

```bash
cd /home/vexa/code/steel_compendium/workspace
# stale (should be 0):
grep -rn 'scc:mcdm\.beastheart\.v1/feature-group\.companion/\|scc:mcdm\.beastheart\.v1/feature\.companion\.[a-z]' steel-etl/input \
  | grep -v 'companion\.beastheart' || echo "no stale companion links"
# regenerate and confirm the resolver binds the new links (no WARN: unresolvable for companion codes)
devbox run -- go -C steel-etl run ./cmd/steel-etl gen --all --config steel-etl/pipeline.yaml 2>&1 \
  | grep -i 'WARN.*companion' || echo "no unresolved companion links"
```
Expected: "no stale companion links" and "no unresolved companion links". (The `[a-z]` after `feature.companion.` in the stale check, minus `companion.beastheart`, catches any species that wasn't rewritten.)

- [ ] **Step 4: Commit the source re-sweep**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add input/
git commit -m "fix(scc): re-sweep 13 inbound links to restructured companion codes"
```

---

## Task 6: scc-log + docs

**Files:** `docs/scc-log.md` (workspace), workspace `CLAUDE.md`, `steel-etl/CLAUDE.md`

- [ ] **Step 1: Append a dated `docs/scc-log.md` entry**

Add a `## 2026-06-13 — Companion SCC restructure (Plan 5a)` entry: companions moved `feature-group.companion/<sp>` → `monster.companion.beastheart.statblock/<sp>`; member features/abilities gained a `beastheart` subgroup segment (`feature[.ability].companion.beastheart.<sp>.level-N/<id>`); mirrors monster Rivals; 13 inbound links re-swept; `freeze: false` so the registry rebuilt clean. Link the spec (`docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`). Paste the registry delta count from Task 4 Step 3.

- [ ] **Step 2: Update the current-state SCC bullets**

In workspace `CLAUDE.md` (SCC section) and `steel-etl/CLAUDE.md`, update the companion mentions to the new namespace and note Plan 5a shipped, Plan 5b (advancement featureblocks) next. Current-state + pointer only (no dated history — that lives in `scc-log.md`).

- [ ] **Step 3: Commit docs**

```bash
cd /home/vexa/code/steel_compendium/workspace
git add docs/scc-log.md CLAUDE.md
git commit -m "docs: companion SCC restructure log + state (Plan 5a)"
cd steel-etl && git add CLAUDE.md && git commit -m "docs: companion namespace state (Plan 5a)"
```

(The workspace `steel-etl` submodule pointer bump + v2 rebuild happen at the end of the full Plan 5, not here — 5a is data-layer only and the site rebuild rides with 5b.)

---

## Self-Review notes (spec coverage)

- **Spec §2 transform table** → Tasks 1 (feature), 2 (ability), 3 (container). Every row has a task + a test asserting the exact target code.
- **Spec §2 "all child codes gain `beastheart`; 13 inbound links re-swept; freeze:false rebuild"** → Task 4 (regen/delta), Task 5 (re-sweep).
- **Spec §5 "companion keeps current render path"** → Task 3 keeps `fm["type"]="feature-group"`; no site change in 5a.
- **Spec §10 docs (`scc-log`, CLAUDE state)** → Task 6.
- **Out of scope (correctly absent, → Plan 5b/5c/5d):** the advancement-features entity + source H5 header injection + `@level` migration (5b); fixture restructure (5c); ROADMAP/Phase-6/deploy bump (5d).
- **Empty-class guard** (Tasks 1–3): the class segment is appended only when non-empty, so non-class contexts/unit-bare cases never emit a double-dot path; production always has `class: beastheart`.
- **Type/name consistency:** `compactPath`, `findAncestorID`, `Slugify` are package-`content` helpers (verified). `scc.Classify` dot-joins `TypePath` (verified `classifier.go:14`). Test helper `context.Metadata{...}` + `ctx.Push(level, …)` matches the existing companion tests (verified content_test.go:167/543).

## Execution Handoff

Subagent-driven (recommended): one fresh subagent per task, review between. Tasks 1→2→3 are independent classifier edits (can run sequentially with review); 4 depends on 1–3; 5 depends on 4 (codes must exist to re-sweep toward); 6 last. After 5a lands and the delta looks right, write Plan 5b (companion advancement featureblocks).
