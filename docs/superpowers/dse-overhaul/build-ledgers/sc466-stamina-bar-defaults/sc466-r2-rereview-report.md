# SC-466 r2 scoped re-review (reviewer B)

## Executive summary
- VERDICT on the delta: LAND-READY. Reviewed dse `0c5022e` (86e9cff tests, 0c5022e fix), delta `e0e2fdc..0c5022e`. dse develop has since moved to 1c271b5 (SC-470); the rebase and re-gate come after this review.
- Findings: BLOCKER 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 0.
- The delta is exactly the LOW-2 ruling: `model.ts:61` is now `declared[key] === undefined` and the header comment changed. It adds 3 jest tests. Only `src/elements/stamina-bar/model.ts` and `test/dom/elements/staminaBarDefaults.test.ts` changed; `FormModal.ts` is untouched (SC-483).
- Mutation: with only the one-line fix reverted, the 3 new tests fail (3 failed / 14 passed); restored, 17/17 pass.
- My saved r1 probe, run again on 0c5022e: 11/11 pass. That includes the 640-combination rule check and the fully-declared byte-identity check. B4 (`height: undefined`) now writes `max_stamina: 20\ncurrent_stamina: 15`, so LOW-2 is closed. D1 (FormModal `style: default`) is unchanged, as expected; that is SC-483.
- Targeted jest (7 stamina/FormModal suites): 162/162 pass.
- Gates finished before the owner's STOP (all exit codes from script files run through devbox): tsc and `tsc -p e2e` clean (rc 0) · lint clean (rc 0) · jest 5426 / 1 skipped / 232 of 233 (rc 0) · lifecycle 29/29 ok (port 9297, rc 0) · e2e `89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` run **20261021-132957-492d** (rc 0). Shots had already started when the STOP arrived and ran to completion on its own (572 PNGs, rc 0); I couldn't kill it under the PID rule because `node visual-harness/shoot.mjs` has no worktree path in its command line. Freeze and parity were never run.

## Delta check
- `src/elements/stamina-bar/model.ts`: the filter changed from `!Object.prototype.hasOwnProperty.call(declared, key)` to `declared[key] === undefined`, and the header comment now says a present-but-`undefined` key counts as absent.
  - A key the YAML wrote with no value (`height:`) parses to `null`, so it still counts as declared and is written, as in r1.
  - Input that is not an object behaves as before: `StaminaBar.parse` already throws on `null` before this line runs.
- The new tests cover three cases: `height: undefined` is not written back as `height: 1`; `style: undefined` is not written back as `style: default`; and in `{height: undefined, style: 'sheet'}` the key with a real value is still written. All three go red under the revert mutation.
- Nothing else is in the delta.

## Evidence (scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r2-rereview-a0851fcab83d49091/)
gate.sh, mutate-r2.sh, tsc.log/.rc, lint.log/.rc, jest.log/.rc, lifecycle.log/.rc, e2e.log/.rc, jest-probe.log/.rc, jest-targeted.log/.rc, mut-r2-revert.log/.rc, mut-r2-restored.log/.rc, shots.log/.rc (completed, 572, rc 0; started before the scope change). The probe source is r1's `…/sc466-r1-review-a0851fcab83d49091/zzSc466ReviewProbe.test.ts`. Its copy in the plugin was deleted by exact path; dse `git status --porcelain` is empty.
