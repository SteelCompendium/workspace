# SC-279 r7 — scoped re-review of the rebase onto SC-406 (DSE ae0efd8 on 05a6ff3; super 41d9a0f)

## Executive summary
- **Verdict: APPROVE.** 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW. 2 INFO, and INFO-1 is a landing must-do.
- **Range-diff** (old `f8693b5..12aad64` vs new `05a6ff3..ae0efd8`):
  - 8 of 9 commits are `=` (patch-identical).
  - The one `!` is the CHANGELOG conflict resolution: both bullets are kept under `## 7.0.0 (unreleased…)`, SC-406 [BREAKING] first, then SC-279 [FIX].
  - The extra commit is the villain-band test.
- **Auto-merged files:** our added/removed lines in `styles-source.css`, `visual-harness/entry.ts`, `shoot.mjs`, `src/` and `docs/` are byte-identical to the old series. Every line SC-406 added survives (styles 13/13, entry.ts 4/4, CHANGELOG 4/4).
- **Gating:**
  - experimental OFF: `ds-roll` renders SC-406's inert card ("ds-roll is not available in this release.", no `.dse-rollbar`), while the ability-card roller still works and opens collapsed.
  - experimental ON: `ds-roll` renders the strip collapsed. The harness renders the strip (`setExperimental(true)`, entry.ts:103).
  - `roll/definition.ts` keeps `deferred: true`; the branch does not touch it.
- **Battery at ae0efd8:**

  | Check | Result |
  |---|---|
  | tsc | clean |
  | lint | clean (exit 0) |
  | jest | **4455 passed / 1 skipped / 218 of 219 suites** |
  | lifecycle | **25/25** |
  | shots | **580 ok, 0 FAIL** |
  | freeze | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `roll--steel-print.png` + `roll--steel-realprint.png` |
  | parity | **0 gaps / 0 undeclared / 24 declared** |

  These match r6's numbers.
- **Rebaseline:** `sc279-rebaseline.txt` matches byte for byte. With those 2 lines substituted into a scratch copy of the baseline, freeze reads `freeze OK (274/274 …)`. The 12 screen-only ids are byte-identical to r4.
- **Villain-band test, revert-probed:** with `statblock/view.ts` = 05a6ff3's version, it fails `Expected "false" / Received "true"` (1 failed / 19 passed). It passes on ae0efd8.
- **DESIGN.md at 41d9a0f:** the wrapped carve-out still says the header states "every modifier that differs from its default, plus the characteristic".

## Detail

### 1. Range-diff (`sc279-r7-logs/range-diff.txt`)
`3ecd9d7=44fd81c`, `8b398a0=5ff1315`, `f550721!7e94726`, `254b991=a0d3fa6`, `24e5a1e=fe3b453`, `aa51688=4daf6ab`, `8d806c6=3fc59be`, `12aad64=cef769f`, and new `ae0efd8`.

The only `!` is CHANGELOG hunk context. The SC-279 bullet text is unchanged, and it now follows SC-406's legacy-alias bullet in the same 7.0.0 section.

Lost-hunk check, done line by line:
- Our `-U0` changed lines per path (old vs new series) differ only in `test/`, by the 34 lines of the new villain test.
- Every non-blank line SC-406 added to the three overlapping files (`f8693b5..05a6ff3`) is present at `ae0efd8`.

### 2. Gating
Checked with a scratch jsdom test, deleted afterwards (`sc279-r7-logs/gating-scratch.log`, 2/2 pass):
- `setExperimental(false)`:
  - `ds-roll` renders `<div data-dse-element="deferred" data-dse-deferred="roll"><div class="dse-deferred-card">ds-roll is not available in this release.</div></div>`.
  - A feature with `rollingEnabled` still mounts 1 launcher. The first click mounts the strip with Modifiers `aria-expanded="false"`, so card rolling still ships.
- `setExperimental(true)`: `ds-roll` mounts the strip collapsed.

The SC-279 diff touches no gating code. `src/framework/` changes are `kit/rollBar.ts` only.

### 3–5. Covered in the summary
Logs are in `sc279-r7-logs/`.

## Findings

### INFO-1 — at landing the superproject pointer must be re-bumped; it currently names an orphaned pre-rebase commit
- Superproject `41d9a0f` (inherited from `a2740db`) pins `draw-steel-elements` at `12aad64`, the pre-rebase head.
- After the rebase, `git branch -a --contains 12aad64` returns nothing: 12aad64 survives only in the object store and will never be pushed.
- If the superproject were pushed as is, the pointer would reference a commit that does not exist on the remote.
- `just wt-finish` (or land-stack) re-commits the pointer to the landed DSE sha, so this is a landing-step note for the dispatcher, not a code finding. The worktree superproject correctly shows ` M draw-steel-elements` until then.

### INFO-2 — the CHANGELOG [FIX] bullet describes `ds-roll`, which SC-406 now gates OFF in 7.0.0
- The bullet ("The roller on ability cards and the `ds-roll` block…", "Reset now returns to what a `ds-roll` block wrote…") tells release-note readers about a block they cannot use without the undocumented `experimental` switch.
- Optional owner call: trim it to the ability-card wording, or leave it for SC-402. Docs `Roll.md` is already deferred with SC-402 per the audit. No gate is affected.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- `sc279-r7-logs/`:
  - range-diff: `range-diff.txt`
  - battery: `tsc`, `lint`, `jest`, `lifecycle`, `shots`, `freeze`, `parity` (each `.log` + `.exit`)
  - hashes: `hash.txt`, `new-ids.sha256`
  - probes: `gating-scratch.log`, `neg-villain.log` (+ `.exit` files)
- `sc279-r7-rebase-review.md` (this report)
- The worktree is left clean: DSE tree clean at `ae0efd8`, scratch test deleted, no commits.
