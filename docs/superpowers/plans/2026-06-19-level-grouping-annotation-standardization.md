# Level-Grouping Annotation Standardization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Nth-Level Features" section headers a structural `feature-group` (no page, no SCC code) across the Summoner and Beastheart books — matching Heroes — and add a `validate` guard so the `@type: feature` mis-annotation can't recur.

**Architecture:** Pure source-annotation edits in two book `.md` files plus one small `validate` check in steel-etl. `FeatureGroupParser` already produces no standalone output and pushes `level-N` context to children, so converting a grouping header from `feature` (or bare) to `feature-group` deletes only the header's own (unlinked) phantom code; child codes are untouched. Correctness is gated by an SCC registry diff (`classify --diff`).

**Tech Stack:** Go 1.26 (steel-etl), `devbox` toolchain, `cobra` CLI, the book Markdown sources under `steel-etl/input/`.

## Global Constraints

- All Go/CLI commands run under devbox: prefix with `devbox run --` from the workspace root (`/home/vexa/code/steel_compendium/workspace`). Go is **not** on the system PATH.
- This is a **steel-etl** change (single PR to `SteelCompendium/steel-etl`). Branch from latest `origin/main`. Do **not** hand-edit generated output (`v2/docs`, `data/*`); the build is for verification only.
- `feature-group` annotation format is exactly `<!-- @type: feature-group | @level: N -->` (no `@id`), matching Heroes.
- **Keep as `feature` — do NOT touch:** `1st-level-circle-features`, `5th-level-circle-feature`, `8th-level-circle-feature` (referenceable lookup-table containers, linked from the advancement table).
- SCC identity must not change for any child: a child feature's code stays `feature.<class>.level-N/<id>`. The registry diff is the authoritative gate — it must show **only** the removed phantom grouping codes and **zero** child-code changes.
- Spec: `docs/superpowers/specs/2026-06-18-level-grouping-annotation-standardization-design.md`.

---

### Task 1: Add the `validate` grouping-shape guard

A pure predicate plus one wire-in. Run first so it flags every existing mis-annotation (proving it works); Tasks 2–3 then clear those warnings.

**Files:**
- Modify: `steel-etl/internal/cli/validate.go` (add predicate + emit a warning in `walkSections`)
- Test: `steel-etl/internal/cli/validate_test.go` (create if absent)

**Interfaces:**
- Produces: `func isLevelGroupingFeatureID(id string) bool` — true when `id` matches `^\d+(st|nd|rd|th)-level-features$` (the plural "Nth-Level Features" grouping shape; the singular/`circle` lookup ids do not match).

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/cli/validate_test.go` (or append the function if the file exists):

```go
package cli

import "testing"

func TestIsLevelGroupingFeatureID(t *testing.T) {
	grouping := []string{"1st-level-features", "2nd-level-features", "10th-level-features"}
	for _, id := range grouping {
		if !isLevelGroupingFeatureID(id) {
			t.Errorf("%q should be detected as a level-grouping feature id", id)
		}
	}
	// Intentional features (lookup containers) and normal features must NOT match.
	keep := []string{
		"1st-level-circle-features", // has "circle"
		"5th-level-circle-feature",  // singular, has "circle"
		"summoners-dominion",
		"perk",
		"basics",
	}
	for _, id := range keep {
		if isLevelGroupingFeatureID(id) {
			t.Errorf("%q must NOT be flagged as a level-grouping feature id", id)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/cli/ -run TestIsLevelGroupingFeatureID'`
Expected: FAIL — `undefined: isLevelGroupingFeatureID`.

- [ ] **Step 3: Add the predicate**

In `steel-etl/internal/cli/validate.go`, add near the top of the file (after the imports), and make sure `regexp` is imported:

```go
// levelGroupingFeatureIDRe matches the "Nth-Level Features" grouping-header id
// shape (plural "features"). A section annotated @type: feature with such an id is
// almost certainly a structural grouping that should be @type: feature-group (no
// page/SCC code) — the Heroes convention. The singular / circle lookup ids
// (5th-level-circle-feature, 1st-level-circle-features) deliberately do not match.
var levelGroupingFeatureIDRe = regexp.MustCompile(`^\d+(?:st|nd|rd|th)-level-features$`)

// isLevelGroupingFeatureID reports whether a feature @id is grouping-shaped.
func isLevelGroupingFeatureID(id string) bool {
	return levelGroupingFeatureIDRe.MatchString(id)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/cli/ -run TestIsLevelGroupingFeatureID'`
Expected: PASS.

- [ ] **Step 5: Wire the guard into `walkSections`**

In `validate.go`, inside `walkSections`, in the branch where `typeName` is known and registered (the `else { parsedOK++ }` arm around line 108–110), add the grouping check. Replace:

```go
				} else {
					parsedOK++
				}
```

with:

```go
				} else {
					parsedOK++
					if typeName == "feature" {
						if id, ok := sec.Annotation["id"]; ok && isLevelGroupingFeatureID(id) {
							issues = append(issues, validationIssue{
								level:   "warn",
								heading: sec.Heading,
								hlevel:  sec.HeadingLevel,
								msg:     fmt.Sprintf("feature @id %q is a level grouping; use @type: feature-group (no page/SCC code)", id),
							})
						}
					}
				}
```

- [ ] **Step 6: Verify the guard fires on the current Summoner book**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate "input/summoner/Draw Steel Summoner.md" 2>&1 | grep "level grouping"'`
Expected: several `WARN:` lines, one per `2nd-level-features` … `10th-level-features` (the circle ids must NOT appear).

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/cli/validate.go internal/cli/validate_test.go
git commit -m "feat(validate): warn when a level-grouping header is annotated @type: feature"
```

---

### Task 2: Convert Summoner level-grouping headers to `feature-group`

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md`

Apply these exact edits. The first is an **insert** (the bare 1st-Level header gets a new annotation line); the rest **replace** the annotation comment. Each heading text is unique within the file.

- [ ] **Step 1: 1st-Level Features (bare → explicit feature-group)**

old_string:
```
### 1st-Level Features
```
new_string:
```
<!-- @type: feature-group | @level: 1 -->
### 1st-Level Features
```

- [ ] **Step 2: 2nd → 10th-Level Features (`feature` → `feature-group`, drop `@id`)**

Apply each replacement (old_string → new_string):

| old_string | new_string |
|---|---|
| `<!-- @type: feature \| @id: 2nd-level-features \| @level: 2 -->` | `<!-- @type: feature-group \| @level: 2 -->` |
| `<!-- @type: feature \| @id: 3rd-level-features \| @level: 3 -->` | `<!-- @type: feature-group \| @level: 3 -->` |
| `<!-- @type: feature \| @id: 4th-level-features \| @level: 4 -->` | `<!-- @type: feature-group \| @level: 4 -->` |
| `<!-- @type: feature \| @id: 5th-level-features \| @level: 5 -->` | `<!-- @type: feature-group \| @level: 5 -->` |
| `<!-- @type: feature \| @id: 6th-level-features \| @level: 6 -->` | `<!-- @type: feature-group \| @level: 6 -->` |
| `<!-- @type: feature \| @id: 7th-level-features \| @level: 7 -->` | `<!-- @type: feature-group \| @level: 7 -->` |
| `<!-- @type: feature \| @id: 8th-level-features \| @level: 8 -->` | `<!-- @type: feature-group \| @level: 8 -->` |
| `<!-- @type: feature \| @id: 9th-level-features \| @level: 9 -->` | `<!-- @type: feature-group \| @level: 9 -->` |
| `<!-- @type: feature \| @id: 10th-level-features \| @level: 10 -->` | `<!-- @type: feature-group \| @level: 10 -->` |

(The `\|` above is a Markdown-table escape; the real annotation uses a plain `|`.)

- [ ] **Step 3: Verify the guard is now clean for Summoner**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate "input/summoner/Draw Steel Summoner.md" 2>&1 | grep -c "level grouping"'`
Expected: `0`.

- [ ] **Step 4: Verify the SCC registry diff — only phantom codes removed, no child changes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --all --diff 2>&1 | grep -iE "summoner.*(level-features|summoners-dominion|new-portfolio-minion|perk|portfolio)"'
```
Expected: only **removals** of `feature.summoner.level-N/<N>-level-features` codes (the phantoms). **No** line touching `summoners-dominion`, `new-portfolio-minion`, `perk`, `portfolio`, or any other child. If any child code changes → STOP; the conversion changed identity (investigate before continuing).

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/summoner/Draw Steel Summoner.md"
git commit -m "fix(summoner): level-grouping headers -> feature-group (drop phantom feature pages)"
```

---

### Task 3: Convert Beastheart bare level headers to explicit `feature-group`

Beastheart's "Nth-Level Features" headers (levels 1–10) are bare; make them explicit `feature-group` for cross-book consistency. This must be **output-neutral** (children already carry their own `@level`), gated by the registry diff.

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Insert a `feature-group` annotation above each bare header**

For each level N in 1..10, apply this insert (each heading text is unique in the file):

old_string:
```
### Nth-Level Features
```
new_string:
```
<!-- @type: feature-group | @level: N -->
### Nth-Level Features
```

Concretely, the 10 edits are (ordinal → level): `1st`→1, `2nd`→2, `3rd`→3, `4th`→4, `5th`→5, `6th`→6, `7th`→7, `8th`→8, `9th`→9, `10th`→10. Example for level 3:

old_string:
```
### 3rd-Level Features
```
new_string:
```
<!-- @type: feature-group | @level: 3 -->
### 3rd-Level Features
```

- [ ] **Step 2: Verify the registry diff shows ZERO Beastheart changes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --all --diff 2>&1 | grep -i "beastheart"'
```
Expected: **no output** (no added, removed, or changed beastheart codes — the bare→feature-group conversion is purely structural). If any beastheart code is added/removed/changed → STOP and revert this file (`git checkout -- "input/beastheart/Draw Steel Beastheart.md"`); the bare headers were carrying context the conversion altered (record the finding; Beastheart can stay bare).

- [ ] **Step 3: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "chore(beastheart): make bare level-feature headers explicit feature-group (consistency)"
```

---

### Task 4: Full build verification

Confirm the phantom pages are gone, the parent index is correct, and the genuine fixture rendering still works end-to-end. (Verification only — do not commit generated output.)

**Files:** none modified (build + assertions).

- [ ] **Step 1: Run the full pipeline + site build**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml && go run ./cmd/steel-etl site --config ../v2/site.yaml' 2>&1 | tail -5
```
Expected: completes; "Sections built: 2".

- [ ] **Step 2: Assert the phantom feature-group leaf pages are gone**

Run:
```bash
ls /home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/2nd-level-features.md 2>&1
```
Expected: `No such file or directory`.

- [ ] **Step 3: Assert the parent index lists the real features (not the grouping)**

Run:
```bash
grep -oE 'sc-prev__name">[^<]+' /home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/index.md
```
Expected: includes `Perk`, `Summoner&#39;s Dominion`, `New Portfolio Minion`; does **not** include `2nd-Level Features`.

- [ ] **Step 4: Assert Summoner's Dominion still renders its fixture cards (the genuine embed case)**

Run:
```bash
f=/home/vexa/code/steel_compendium/workspace/v2/docs/Browse/feature/summoner/level-2/summoners-dominion.md
echo "fb-wrap:$(grep -c fb-wrap $f) sb-wrap:$(grep -c sb-wrap $f) leak:$(grep -c '&gt; ⭐' $f)"
```
Expected: `fb-wrap` ≥ 4, `sb-wrap` ≥ 0, `leak:0`.

- [ ] **Step 5: Restore generated output (deploy owns it)**

Run:
```bash
git -C /home/vexa/code/steel_compendium/workspace/v2 restore docs/
```
Expected: clean v2 working tree (`git -C ../v2 status --porcelain | wc -l` → small/0).

- [ ] **Step 6: Run the full steel-etl test suite**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./...'`
Expected: all packages `ok`.

This task has no commit — it is the integration gate before opening the PR. After it passes, push the branch and open a PR to `SteelCompendium/steel-etl`; `just deploy-v2` regenerates + ships the site after merge + submodule bump (per `docs/git-workflow.md`).

---

## Self-Review

- **Spec coverage:** Canonical convention → Tasks 2–3 (feature-group). Summoner migration (keep 3 circle headers) → Task 2 + Global Constraints. Beastheart consistency → Task 3. Validate guard → Task 1. SCC/registry validation (only phantoms removed, zero child changes) → Task 2 Step 4 + Task 3 Step 2. Build assertion (no phantom leaf, index correct, fixtures intact) → Task 4. Heroes/Monsters unchanged → not touched. ✓
- **Placeholder scan:** none — every edit has exact old/new strings; `N`/`Nth` in Task 3 are explicitly enumerated (1–10) with a worked example.
- **Type consistency:** `isLevelGroupingFeatureID` defined and used consistently (Task 1 Steps 3/5, test Step 1). Annotation format `<!-- @type: feature-group | @level: N -->` identical everywhere.

## Status

**SHIPPED + LIVE 2026-06-19.** All 4 tasks executed via `executing-plans`; merged + deployed.

- **Task 1** — `validate` grouping-shape guard (`isLevelGroupingFeatureID` + `walkSections`
  wire-in + test) → steel-etl `2a03210`.
- **Task 2** — Summoner level headers → `feature-group` (1st bare→explicit, 2nd–10th drop
  `@id`) → `70f011e`. Isolated code diff confirmed: removed **exactly** the 9 phantom
  `feature.summoner.level-{2..10}/<N>-level-features` codes, **zero** child changes.
- **Task 3** — Beastheart bare level headers → explicit `feature-group` → `3328469`.
  Isolated diff confirmed **zero** beastheart code change (242 = 242, purely structural).
- **Task 4** — full `gen --all` + site build: phantom leaf gone, parent index lists the real
  features (Perk / Summoner's Dominion / New Portfolio Minion), Summoner's Dominion still
  renders its fixture cards (`fb-wrap` = 8, no leak); full `go test ./...` green.

**Verification deviation worth noting:** the plan's `classify --all --diff` command is wrong —
`--all` is a `gen`/`validate` flag, not a `classify` flag, and per-file `classify --diff`
diffs against the *whole* registry (floods with cross-book "removals"). The authoritative
gate was instead done by **set-diffing the book's codes pristine-vs-edited**
(`classify <book.md>` with edits stashed vs applied), which isolates the change exactly. A
pre-existing source-vs-registry drift (`monster.statblock/pixie-bellringer-converted`) surfaced
during this and was confirmed unrelated (present in the pristine source); absorbed by the
`gen --all` registry rebuild.

Integrated: steel-etl merged to `main` @ `3328469` (pushed); workspace pointer bump `8ef0430`;
v2 site deploy `10771af` (registry **3,072 → 3,063**). The shipped **embed-deferral** fix
(`bodyHasStandaloneDescendant`, steel-etl `71def61`) is complementary and verified intact by
Task 4 Step 4. Spec `## Status` updated alongside.
