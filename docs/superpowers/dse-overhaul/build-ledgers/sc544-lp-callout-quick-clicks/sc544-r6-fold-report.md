# SC-544 r6 fold report

## Summary (5 lines)
1. DONE. Plugin `711f740d` on dse develop `f7c9c7ce` (SC-540 landed; one conflict in obsidian-lifecycle.mjs, kept both sides); superproject `e80e876a` on origin/main `a613ea25` (CHANGELOG: both bullets kept).
2. Folds: LOW-1 names assertion, LOW-2 two guard-reset cases, LOW-3 proposal CURRENT block, "mount order, writer last" wording (architecture.md + two code comments). Only comment text changed in `src`.
3. Jest 6307 passed / 1 skipped / 251 of 252 (6297 on the eafe76e1 base + 10 of ours). Red checks: MG1 (guard reset removed) turns both new cases red; the names assertion cannot go red under m1 (see below).
4. Battery on the final HEAD, port 9548: tsc/lint clean; lifecycle 48/48 as 21 + 16 + 7 + 4 (187 / 326 / 254 / 295 s); combined G-S57 + G-S62 + G-S61 ok (286 s); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0 / 0 / 24.
5. G-S61 FAILs on an `f7c9c7ce` bundle with the r1 numbers in (a)-(i), passes on HEAD.

## Folds
- **LOW-1** (`twin-reuse.test.ts`, guard case): `expect(t.names()).toEqual(['Twin','Edited','Twin'])`. Finding: it cannot be made red by jest mutant m1 (call removed). Under m1 the guard case goes red at its earlier `order` assertion, and even with the names assertion first it passes under m1 (the form write lands in the middle block whether or not the siblings are flushed; `sc544-r6-jest-names-first-under-m1.log`). It only guards a form write that lands in the wrong block or is dropped.
- **LOW-2** (`view-registry.test.ts`): `a second round on the same registry flushes again` and `a throw from a sibling does not leave the guard on` (from the reviewer's scratch, with a typed fake view). MG1 (the `finally` reset removed, so the guard sticks on) turns both red (`sc544-r6-jest-mutant-MG1.log`: 2 failed, 53 passed of 55).
- **m1 re-check** (`sc544-r6-jest-mutant-m1.log`): 5 failed (LP, RV, form Save, the guard case, ordering).
- **LOW-3**: proposal §2 now says "replace the `f7c9c7ce` CURRENT block written by SC-540" (was eaf64ba6).
- **Wording**: architecture.md and the comments in `ReadingModeBlockHost.replaceSource` and `ViewRegistry.flushPendingWrites` now say the siblings are written in the order their views were mounted, and the writer's own write comes last.
- Jest first full run had one timeout in an unrelated suite (SC-485 squad pool, load average 18-21); the re-run was green (`sc544-r6-gate-jest-load-timeout-run1.log` kept).

## Rebase (addendum)
- Plugin onto `f7c9c7ce`: conflict only in `visual-harness/obsidian-lifecycle.mjs` (header paragraph and the scenario list). Resolution: file order `… G-S52, G-S57, G-S62, G-S61, G-S56`; SC-540's header paragraph keeps its own count (47); only SC-544's says 48; G-S57 and G-S52 stay 46.
- Superproject onto origin/main `a613ea25`: CHANGELOG conflict, kept SC-544's bullet (with the reworded form clause) and SC-540's / SC-511's bullets.
- `git diff --stat f7c9c7ce..HEAD`: 7 files, 593 insertions, 2 deletions (src: ReadingModeBlockHost 8, viewRegistry 27, view 9; tests; harness 312; architecture.md).

## Battery on `711f740d` (logs `sc544-r6-gate-*.log`)
| Gate | Result | Time |
|---|---|---|
| tsc (+ `-p e2e`), lint | clean | 11 s, 14 s |
| jest | 6307 passed / 1 skipped / 251 of 252 | 53 s |
| lifecycle part 1 (21) | 21/21 | 187 s |
| part 2 (16) | 16/16 | 326 s |
| part 3 (7: G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52) | 7/7 | 254 s |
| part 4 (4: G-S57 G-S62 G-S61 G-S56) | 4/4 | 295 s |
| combined `--only=G-S57,G-S62,G-S61` | 3/3 | 286 s |
| e2e | 128/128 ok, 0 failed, 0 known-bug, coverage 89/89, pointer parked | 63 s |
| shots | 592 ok, 0 FAIL, host-leak 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] | 650 s (background + rc file) |
| freeze | 280/280 | |
| parity | 0 gaps / 0 undeclared / 24 declared | |
All parts are under 600 s; the four-part split is in the proposal.

## Red on f7c9c7ce
`sc544-r6-g61-red-base-f7c9c7ce.log`: bundle from a `git archive f7c9c7ce` build (main.js sha 730f051c…). FAIL (a)-(i) with the r1 numbers: (a) [6,5,6] with 8 pending-card frames, then [6,5,7]; (b) [6,5,7]; (c) [5,6,5,6]; (d) [6,3,5,3,5,4]; (e) [5,5,6]; (f), (g), (h), (i) [6,5,6]; (j) passes. So SC-540 does not fix this bug.

## Drive-by fixes
None.

## Follow-ups
None new.

## Artifacts (under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/)
`sc544-r6-fold-report.md`, `sc544-dse-verify-proposal.md`, `sc544-r6-jest-green-focused.log`, `sc544-r6-jest-mutant-MG1.log`, `sc544-r6-jest-mutant-m1.log`, `sc544-r6-jest-names-first-under-m1.log`, `sc544-r6-gate-tsc.log`, `-lint.log`, `-jest.log`, `-jest-load-timeout-run1.log`, `-lifecycle-part1.log` .. `-part4.log`, `-lifecycle-combined-G-S57-G-S62-G-S61.log`, `-e2e.log`, `-shots.log` (+ `.rc`), `-freeze.log`, `-parity.log`, `sc544-r6-g61-red-base-f7c9c7ce.log`. Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r6-impl-b1/
