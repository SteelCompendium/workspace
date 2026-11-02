# SC-544 r4 fix report

## Executive summary
1. Verdict: DONE. Rebased, all r3 folds done, full battery green on the final HEAD.
2. Plugin `af73981b` on dse develop `eafe76e1` (rebase clean): `f7b8626e` tests, `09680191` fix, `9e6940c9` G-S61, `ee1a01ea` docs, then r4: `d4bb21dd` guard test (red), `0dd2f657` guard, `567301f6` docs + header counts, `af73981b` spy typing. Superproject `edba2fb5` on origin/main `55588e9a` (CHANGELOG only; pointer not bumped).
3. Folds: MEDIUM-1 docs (CHANGELOG reworded; architecture not-covered list gains the form-open case, SC-552); LOW-1 (undo sentence); LOW-2 (46 restored at the G-S57 and G-S52 header lines); INFO-1 (re-entrancy guard in `finally` + jest case); INFO-3 (order documented in the code comment and architecture.md); INFO-9 (proposal: M4 control, red bundle = 423e798d bytes).
4. Guard jest case is red without the guard (`order` = upper, middle, upper, lower, upper, middle, lower, lower) and green with it (`['upper','lower']`, writer's view still pending, disk [6,5,6]).
5. Re-confirmed red: jest mutant 1 (call removed) turns 5 tests red (4 earlier + the new guard case); G-S61 M1 fails (a)-(i).
6. Gates (port 9548): tsc/lint clean; jest 6295 passed / 1 skipped / 251 of 252; lifecycle 47/47 (21 in 188 s, 16 in 329 s, 10 in 449 s); e2e 128/128, 0 known-bug, 89/89; shots 592 0 FAIL, 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] (681 s); freeze 280/280; parity 0 / 0 / 24.

## Details
- **Guard** (`src/framework/host/viewRegistry.ts`): `private flushingPendingWrites`; a nested `flushPendingWrites` returns at once; the flag is reset in a `finally`. Effect: the writes are enqueued in registry order, once each, and a sibling's nested call can no longer flush the writer's own waiting view. The call-site comment in `ReadingModeBlockHost.replaceSource` says so.
- **Jest case** (`test/dom/framework/twin-reuse.test.ts`, SC-544 describe): three views waiting, the middle's form Save as the writer. Expects the flush calls `['upper','lower']`, the middle still pending, disk [6,5,6]. The first version failed tsc (`Component` has no `flushPendingWrite`); fixed by a typed spy in `af73981b`.
- **CHANGELOG conflict**: origin/main added the SC-511 bullet; both kept, SC-544's first, with the new wording "when a block edit form on one block is saved right after a click on another block". The reword is inside the rebased commit `edba2fb5`.
- **architecture.md**: one paragraph extended (order, undo as one step in LP, not-covered list incl. the form-open case, SC-552).
- **Proposal** `sc544-dse-verify-proposal.md`: M4 control (callout-only flush fails (f)-(i)), red bundle bytes (`423e798d` src, same as `eaf64ba6`/`dabfb518`, `main.js` sha aa4efdf6…), new CURRENT line with the eafe76e1-based numbers.
- G-S61 on HEAD after the guard: ok in the part 3 run (it is in the part) and the guard did not change any G-S61 result.

## Drive-by fixes
None.

## Follow-ups
None new (SC-552, SC-549, SC-550 are already filed and out of scope).

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/)
- `sc544-r4-fix-report.md`, `sc544-dse-verify-proposal.md`
- `sc544-r4-jest-guard-red.log`, `sc544-r4-jest-guard-green.log`, `sc544-r4-jest-mutant1.log`, `sc544-r4-g61-mutant-M1.log`
- `sc544-r4-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1.log`, `-part2.log`, `-part3.log`, `-e2e.log`, `-shots.log` (+ `-shots.rc`), `-freeze.log`, `-parity.log`
- Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r4-impl-b1/
