# SC-141 — scoped re-review of the fix round (delta `a3ad2a7`)

**Reviewer:** independent re-reviewer (no authorship of the fix or the fix round)
**Under review:** worktree `/home/scott/code/steelCompendium/worktrees/sc141-hero-abilities/draw-steel-elements`,
branch `sc141-hero-abilities`, delta commit `a3ad2a7` on top of `22188aa` (base `e141582`,
deliberately unrebased)
**Prior artifacts:** `sc141-review-report.md` (findings M1/M2/M3/L1) and `sc141-fix-report.md`
§7 (this fix round's own write-up)
**Date:** 2026-08-11

## Recommendation

**LAND.**

All four findings from the independent review (M1, M2, M3, L1) are closed by commit
`a3ad2a7`, verified here by execution and independent re-derivation, not by re-reading the
fix report's prose. The fix round additionally surfaced and shimmed a real, pre-existing,
unrelated SDK gap (`Featureblock.fromDTO` throwing on 100% of real corpus featureblock
content) and correctly filed it upstream as **SC-155** rather than absorbing it silently —
confirmed live in Linear, description matches the code exactly. The shim is narrow,
identity-gated, applied at the right seam, and does not perturb any authored/fixture path.
The battery reproduces exactly as claimed. No collateral: the diff is confined to the 15
files the fix round's own commit message describes, and nothing else moved.

---

## Per-finding verdicts

### M1 — slug ambiguity regression (tie-break) — **RESOLVED, independently re-derived**

`preferFullOverStubTwin` (`src/services/CompendiumIndex.ts`) fires only when the candidate
set holds exactly one `type: ability`/`trait` entry and every other candidate is a
`type: feature` sharing that entry's source *and* item id.

- **(a) twin pair resolves to the full ability** — probed live (jsdom, real corpus bytes for
  `feature/ability/summoner/level-1/shield.md` + its stub twin
  `feature/summoner/level-1/shield.md`, loaded from `data-unified` directly, not the repo's
  copied fixture): `resolveSlug('Shield!', FEATURE_TYPE_RE)` → exactly
  `['mcdm.summoner.v1/feature.ability.summoner.level-1/shield']`. Confirmed.
- **(b) the `feature.ability.common/grab` vs `feature.common.maneuvers/grab` subfamily** —
  probed live against both real corpus files: `resolveSlug('Grab', FEATURE_TYPE_RE)` →
  exactly `['mcdm.heroes.v1/feature.ability.common/grab']`. This is the case the review
  suggested a code-shape tie-break would have missed (`.common.maneuvers` isn't a
  `.ability`-insertion of `.common`); the shipped source+item-id rule handles it correctly.
  Confirmed.
- **(c) a genuine cross-type collision still errors** — probed live against real corpus
  `blessing-of-secrets` (2 files) and `lead-by-example` (2 files, cross-book): both return
  2+ candidates from `resolveSlug`, i.e. still ambiguous. Confirmed.
- **(d) own corpus census** — independently re-derived from scratch (own frontmatter
  regex-parse over all 3,078 corpus files, own reimplementation of `resolveSlug`'s key rule
  and of `preferFullOverStubTwin`'s logic — not a re-run of the shipped code): **98** keys
  newly ambiguous under the widened scope that previously resolved to exactly one
  `type: feature` candidate (matches the fix report's "98" and the original review's "122"
  once the review's looser "used to resolve to 0-or-1" definition is applied — I reproduced
  both numbers from the same underlying data, confirming they describe the same set two
  ways). Of those 98: **exactly 92 collapse** to the single full ability/trait; **exactly 6
  survive** ambiguous, and they are precisely `blessing-of-secrets` / `hit-and-run` /
  `lead-by-example` × their two slug spellings (space and hyphen) — the three genuine
  cross-book/cross-class collisions the fix report names, nothing else. **Zero collateral**:
  separately checked every key that was *already* ambiguous under the old (narrow) scope
  (`oldCount > 1`) and confirmed the tie-break never additionally collapses any of those —
  it only ever acts inside the newly-ambiguous set. All four sub-claims and the exact 92/6
  split reproduce byte-for-byte independently.

### M2 — `dynamic-terrain` unclaimed type + the SDK shim — **RESOLVED, independently re-derived**

- **Classification half**: `FEATUREBLOCK_TYPE_RE = /(^|\.)featureblock$|^dynamic-terrain($|\.)/`,
  exported from `typeAdapters.ts` and consumed by both `featureblock/definition.ts`
  (bare-slug scope) and `TYPE_ADAPTERS` (the `ds-featureblock` adapter) — same regex, one
  source, can't diverge.
- **A real corpus `type: featureblock` file renders via code** — probed live (jsdom): a
  real, un-modified corpus file with no `feature_type` anywhere
  (`monster/retainer/advancement-features/angulotl-hopper.md`) rendered through
  `featureblockElement` by SCC code, producing "Leaping Attack" in the DOM, no
  "not renderable", no `dse-error`, no `dto.isTrait` in the output. This is a file the fix
  round's own test suite does not directly render end-to-end (its own coverage targets
  dynamic-terrain specifically) — closing that gap here.
- **A real corpus `type: dynamic-terrain` file resolves and renders via code** — covered by
  the fix round's own `heroAbilitiesScc.test.ts` (M2 describe block: `getEntity().model()`
  parses it, a by-SCC `ds-featureblock` block renders *Toppling Pillar*, bare-slug resolution
  reaches it) — ran clean in the full jest pass.
- **Pre-fix throw claim (117/152), reproduced independently on `main`'s code, not trusted
  from the report**: wrote a standalone probe calling the raw SDK
  (`Featureblock.read(new YamlReader(Featureblock.modelDTOAdapter), text)`, i.e. exactly what
  `FeatureblockConfig.readYaml` did *before* `a3ad2a7`, no shim) against every real
  `ds-fb` block in the corpus. Result: **117/117 `type: featureblock`** and
  **35/35 `type: dynamic-terrain`** threw `TypeError: dto.isTrait is not a function` —
  152/152, exactly the fix report's number, reproduced with the un-shimmed SDK call path
  directly (not the report's own count).
- **Post-fix, same 152 files, through the shipped `FeatureblockConfig.readYaml`**: **0/152**
  throw. Independently confirmed.
- **Shim inspection**:
  - **Identity-gated on the SDK's own public static.** `Feature.isTrait(data)` in
    `steel-compendium-sdk/dist/model/Feature.js` is exactly the static
    `Feature.fromDTO` would have called via `dto.isTrait()` (`!keywords.length && !usage &&
    !distance && !target`) — read directly from the installed SDK source, not assumed. The
    shim's `applyFeatureTypeDefaults` calls this exact function on plain data. Not a
    reimplementation; by-construction identical to what the SDK would have derived.
  - **Applied at the config seam only.** `normalizeFeatureblockYaml` sits inside
    `FeatureblockConfig.readYaml`, the same model-layer seam `applyLegacyStatblockKeys`
    already occupies in `StatblockConfig.ts` — not reached into `typeAdapters.ts` or any
    view.
  - **Documented removal condition**, present verbatim in the doc comment: "Remove once the
    SDK wraps `FeatureblockDTO.features` in `FeatureDTO`s (or steel-etl emits `feature_type`
    per entry)." Matches SC-155's own "whichever lands, remove the plugin shim per its
    comment."
  - **A fixture that already declares `feature_type` is untouched — verified two ways.**
    (1) The shipped unit test (`featureblockConfig.test.ts`) asserts
    `applyFeatureTypeDefaults(input) === input` (same object reference) for an already-typed
    entry. (2) I independently re-ran the identical assertion from a fresh probe file — same
    result, reference equality holds. Because `normalizeFeatureblockYaml` short-circuits on
    `normalized === parsed`, the **original text string** (not a `stringifyYaml` round-trip)
    reaches the SDK reader whenever nothing needs defaulting — so no re-derivation drift is
    possible on the authored path, confirmed by the freeze check's 0 mismatches (below).
- **SC-155 filed and accurate** — confirmed live via Linear (`mcp__linear__get_issue`):
  status Todo, description matches the code precisely (117 featureblock + 35 dynamic-terrain,
  `Feature.isTrait`, "identical by construction," the two upstream fix options, the removal
  condition). Not a phantom reference — this is a real, correctly-scoped ticket.

**Shim verdict: sound.** It is the textbook shape for this situation — a narrow,
identity-gated, doc-commented compatibility shim at the model seam, backed by a filed
upstream ticket naming its own removal condition. Nothing here should block landing.

### M3 — action-type chip reads wrong field — **RESOLVED**

`abilityActionLabel` now calls `actionTypeOf(config)` (the same spine the tabs filter and the
full card use) and maps the token through `ACTION_TYPE_LABELS`, falling back to the raw
`ability_type` only when `actionTypeOf` declines to classify. Verified via the full jest run
(both pinned tests green): a corpus-shaped ability (`usage: '[Maneuver](...)'`, no
`ability_type`) shows a "Maneuver" chip; an authored `ability_type: Main action` renders
byte-identically. Traced the label map by hand: `actionTypeOf` lowercases
`"Main action"` → `"main action"`, matches none of villain/maneuver/trigger/move/"no action",
falls to the generic `"action"` check → returns `'main'` → `ACTION_TYPE_LABELS['main']` =
`'Main action'` — the exact original string. **The pinned test would catch drift**: if
`ACTION_TYPE_LABELS['main']` were edited to anything but `'Main action'`, the "renders exactly
as authored" assertion fails immediately, since that test's expected value is the literal
authored string, not a derived one.

### L1 — hand-copied type regexes — **RESOLVED**

`grep -n "sccType" src/elements/*/definition.ts` returns three lines, all reading imported
constants (`FEATURE_TYPE_RE`, `STATBLOCK_TYPE_RE`, `FEATUREBLOCK_TYPE_RE`) — no inline regex
literal remains. Directly verified the looseness claim: `/(^|\.)statblock$/` (the exported
constant now in use) rejects `"notastatblock"`; the old local `/statblock$/` accepted it.

---

## Battery — reproduced independently at `a3ad2a7`

| Gate | Result | Claimed | Match |
|---|---|---|---|
| `npm run tsc` | exit 0, no diagnostics | exit 0 | ✓ |
| `npm run lint` | exit 0, no output | exit 0 | ✓ |
| `npx jest` | **1 skipped, 161 passed / 162 suites; 1 skipped, 2568 passed / 2569 tests; 3 snapshots**, exit 0 | 2568+1skip/161 | ✓ |
| `npm run shots` | **314 ok, 0 FAIL**, exit 0 | 314 | ✓ |
| `check-freeze.sh` | `freeze OK (188/200 producible OK, 12 missing (not producible on this branch), 0 checksum mismatches)`, exit 0 | 188/200, 0 mismatches | ✓ |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | 0/0/16 | ✓ |

`obsidian-shots` not run (no display) — correct per the skill. The 12 missing freeze lines
are SC-145's `*-edit-btn--*` fixtures, confirmed absent on this branch (unrelated sibling
work) — 0 checksum mismatches is the gate, and it is clean.

---

## Collateral check

`git diff 22188aa a3ad2a7 --stat`: exactly 15 files — the 7 source files the commit message
describes (`CompendiumIndex.ts`, `typeAdapters.ts`, `hero/view.ts`,
`featureblock/definition.ts`, `statblock/definition.ts`, `FeatureblockConfig.ts`,
`CHANGELOG.md`), 3 test files, and 5 new corpus-verbatim fixtures. Nothing else moved. All
probe/scratch files created during this re-review were deleted; `git status --porcelain` in
the worktree is empty and `git diff a3ad2a7` is empty.

---

## New findings

None. No new defects surfaced during execution or probing.

---

## What I ran

- Read the delta commit (`git show a3ad2a7`) file-by-file against both prior reports' claims.
- Full battery, reproduced from scratch, each gate last in its `bash -c`, freeze run with the
  mandatory shots-dir argument, parity run last (post-freeze, since it rebuilds the harness).
- 5 independent jsdom/unit probes over **real corpus bytes loaded from `data-unified`
  directly** (not the repo's copied fixtures): M1 twin-pair resolution, M1 subfamily case
  (`grab`), M1 genuine-collision cases (×2), and a from-scratch corpus census (own
  frontmatter parse + own reimplementation of `resolveSlug`'s key rule and the tie-break
  logic) asserting the exact 98/92/6 split and zero collateral outside the newly-ambiguous
  set.
- A standalone pre-fix probe calling the raw SDK path directly (bypassing the shim entirely)
  against all 152 real corpus featureblock/dynamic-terrain files — reproduced 152/152 throws.
- A standalone post-fix probe calling the shipped `FeatureblockConfig.readYaml` against the
  same 152 files — reproduced 0/152 throws.
- A jsdom render probe for a real corpus `type: featureblock` file end-to-end through
  `featureblockElement` (the fix round's own tests only directly render dynamic-terrain).
- Read `Feature.js` in the installed SDK to verify `Feature.isTrait`'s exact semantics against
  the shim's doc-comment claim.
- Verified SC-155 live via Linear MCP (`get_issue`) — description checked against the code.
- Diffstat/collateral check; probe file cleanup; final `git status`/`git diff` verification.

No code changes made. No Linear issues created or modified.
