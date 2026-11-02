# SC-525 round 3 - fix report (LOW-1, INFO-3)

## Executive summary
- Status: DONE (r3 + r3b + r5). r5 (test-only, commit `34f46cf`, `git diff b1d5fa9..HEAD -- src` empty): `holdLookups` releases its own holds (an SC-510 mid-hold failure no longer cascades: 12 -> 2 failed), and 4 tests (W1, W3, W4, W5) pin single `resolveGen` checks :220/:256/:304/:310; jest 6184 passed / 1 skipped / 248 of 249 (+4); see the r5 section at the end. Earlier: r3b head `b1d5fa9`. Branch `sc525-ref-nesting-retype`, base `develop` @ `4deb8cf` (not moved, no rebase). Head `b1d5fa9` (r3 head was `f6b5fee`; r3b adds `5bb5cd2` RED test + `b1d5fa9` fix: `this.resolveGen++` in `onMount`, so an inline or refused body also supersedes an in-flight resolution; 4 new tests, mutant M8 red; final gates: jest 6180 passed / 1 skipped / 248 of 249, lifecycle 41/41, e2e 124/124, shots 592 0 FAIL, freeze 280/280, parity 0/0/24 - see the r3b section at the end).
- Commits on `af09bf2`: `4016eee` RED tests, `1ab2bcf` fix, `6068ca0` SCC-ladder test, `f6b5fee` test that kills mutant M7.
- LOW-1 fix, as prescribed: `IN_FLIGHT_REFS: Map<string, { view }>` holds a per-resolution token; refuse when `current && current.view !== this && !current.view.isUnloaded()`; `finally` deletes only if the map entry is still this resolution's token; `private resolveGen`, `const gen = ++this.resolveGen` at the start of `resolveAndMount`, `if (gen !== this.resolveGen) return;` after every `await` before any errorCard/webCard/mountBase write (SCC ladder: after `getEntity`, `model()`, `body()`; legacy ladder: after `refs.resolve` (also in the catch), after `legacyRefRawText`).
- INFO-3: test-side only, no src export. Guard describe: unique blockKey per `setup()`. Form SC-525 describes: an `afterEach` releases whatever a test still holds.
- 10 new tests; 7 of the 65 tests in the three suites are red on `af09bf2` source, all green on head. Every mutant (M1, M2, M4, M5, M6, M6a, M6b, M7) turns at least one test red.
- Gates on `f6b5fee`: tsc and lint clean; jest 6176 passed / 1 skipped / 248 of 249 suites (+10 on 6166); lifecycle 20/20 + 21/21; e2e 124/124; shots 592, 0 FAIL; freeze 280/280; parity 0 / 0 / 24.

## Tests (RED on `af09bf2` source, then green)
Red log `sc525-r3-red-jest.log` (first RED commit: 4 failed of 57) and the base-of-r3 block in `sc525-r3-mutants.log` (all r3 tests against `af09bf2`'s source: 7 failed of 65). In `test/dom/elements/refUnwrapView.test.ts`, describe `in-flight depth guard (SC-525)`:
- `a view updated while its own lookup is running (the earlier / the later lookup finishes first)` x2 orders:
  - `same reference: one card, no nesting error, no orphan child`: hold, `run('@A')`, `views[0].update(currentModel())`, release in the order, exactly one `.test-base-view` and no nesting card; after a later `update` still one card and `ownedChildren` equals the count of an uninterrupted control view after one `update`. RED on `af09bf2` (two cards).
  - `a different reference (A then B): only B is drawn, nothing of A is left`: RED on `af09bf2` (`["B","A"]`).
  - `a superseded resolution leaves no entry behind: a fresh view of the same reference resolves`: no map entry left behind. Green on `af09bf2` (pins behaviour); red under mutant M4.
- `an SCC code, view updated while its entity read is running (...)` x2 orders: one card (`getEntity` held). RED on `af09bf2`.
- `the earlier resolution of an updated view settling leaves the later one's entry: another live view is still refused`: kills M7 (entry deleted by view instead of by token). Green on `af09bf2` (pins behaviour).
- `a self-reference (A -> A) still stops when its view was updated while its lookup ran`: at most 6 views, at least 1 nesting card. Green on `af09bf2` and head (R3 stays bounded).
- A superseded resolution that returns early leaves nothing behind: asserted by "no orphan child" (ownedChildren back to the control count; one `.test-base-view`) and by the fresh-view test (no map entry).

## Mutation (`sc525-r3-mutants.log`, script `sc525-r3-mutants.sh.txt`; 3 suites, 65 tests; working tree restored: 0 changed files)
| Mutant | Tests red |
|---|---|
| base-of-r3 (`af09bf2` source) | 7 |
| M1 drop `!current.view.isUnloaded()` | 9 (7 form tests + 2 guard tests) |
| M2 unconditional delete in `finally` | 2 |
| M4 drop `current.view !== this &&` (same view refused again) | 7 |
| M5 no takeover (set only when no entry) | 2 |
| M6 all resolveGen checks dropped | 7 |
| M6a only the legacy-ladder checks dropped | 5 |
| M6b only the SCC-ladder checks dropped | 2 |
| M7 delete by `entry.view === this` instead of token | 1 (before the last test existed it survived with 0 red; the test was added for it) |
M3 (`_loaded`) not re-run: r2 showed it runs out of memory (INFO-1, dropped by the owner).

## Gates (head `f6b5fee`; one foreground call each)
- tsc incl. `tsc -p e2e`: clean, rc 0 (`sc525-r3-tsc.log`). lint incl. `e2e/`: clean, rc 0 (`sc525-r3-lint.log`).
- jest (`sc525-r3-jest-full.log`): `Tests: 1 skipped, 6176 passed, 6177 total`; `248 passed, 1 skipped, 248 of 249` suites. Delta +10 on 6166 (shots cache present).
- lifecycle (port 9298): `sc525-r3-lifecycle-a.log` `done: 20/20 ok, 0 failed`; `sc525-r3-lifecycle-b.log` `done: 21/21 ok, 0 failed` = 41/41.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (`sc525-r3-e2e.log`).
- shots (`sc525-r3-shots.log`, own `npm rc=0` line; the call moved to the background past 600 s, polled the log until that line): 592 PNGs, 0 FAIL, host-copy pin OK, button host-leak 157 kinds / 942 with the 34-record boundary, modal 10 scenarios / 38 kinds / 228, input 15 / 176, checkbox 7 / 116, prose 106 bare `<p>` [212] + 9 `<img>` [18].
- freeze: `freeze OK (280/280 ...)`, rc 0 (`sc525-r3-freeze.log`). Baseline untouched.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 (`sc525-r3-parity.log`).
- Plugin `git status` clean; no pointer bump; no tags. Not touched: SC-536 (MEDIUM-1/2), SC-481, SC-522, `RenderContext`.

## Behaviour notes
- Src delta vs `af09bf2`: `src/elements/shared/RefUnwrapView.ts` only (+30/-9). Tests: `refUnwrapView.test.ts`, `formModalStalePreview.test.ts`.
- A view is never refused by its own entry; a newer resolution on the same view takes the entry over, and an older one's `finally` leaves it alone.
- Unchanged and out of scope: `onMount` for `inline` / `invalid` models does not bump `resolveGen`. An `update()` from a pending reference to an inline body therefore still lets the old resolution draw late. Pre-existing, not part of LOW-1 as prescribed.

Drive-by fixes: none.

Follow-ups: the inline/invalid-update-while-ref-pending case above (bump `resolveGen` in `onUpdate` or `onMount` if the owner wants it covered).

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/`)
`sc525-r3-fix-report.md`, `sc525-r3-red-jest.log`, `sc525-r3-green-jest-targeted.log` (from `1ab2bcf`), `sc525-r3-mutants.log`, `sc525-r3-mutants.sh.txt`, `sc525-r3-tsc.log`, `sc525-r3-lint.log`, `sc525-r3-jest-full.log`, `sc525-r3-lifecycle-a.log`, `sc525-r3-lifecycle-b.log`, `sc525-r3-e2e.log`, `sc525-r3-shots.log`, `sc525-r3-freeze.log`, `sc525-r3-parity.log`.

## r3b (ledger: every path that replaces the view's content supersedes an in-flight resolution)
Commits: `5bb5cd2` RED test, `b1d5fa9` fix. Src delta (+4 lines, `src/elements/shared/RefUnwrapView.ts`): `this.resolveGen++` at the top of `onMount` (which `onUpdate` calls), so an `inline` or `invalid` body bumps the generation like a reference does; doc comment on `resolveGen` updated.

Tests (`test/dom/elements/refUnwrapView.test.ts`, describe `in-flight depth guard (SC-525)`, describe.each over inline body / refused body x two orders = 4 tests): `a view updated from a pending reference to: inline body | refused body` -> `the stale lookup is released after the update has drawn` / `the stale lookup is released while the update is still settling: only the new content, no card for A`. Pending `@A` held, `views[0].update(<inline or invalid model>)`, release the stale lookup (after `await update`, or straight after starting it, before awaiting); assert inline: exactly the inline card and no `A`; refused: no `.test-base-view` and the refused message, never a nesting error. RED on the r3 source (4 failed of 69, `sc525-r3b-red-jest.log`), green on `b1d5fa9` (`sc525-r3b-green-jest-targeted.log`: 69 passed of 69 in the three suites).

Mutant (`sc525-r3b-mutants.log`, `sc525-r3b-mutants.sh.txt`): M8 = drop the `onMount` bump -> the same 4 tests red (4 failed of 69); base-of-r3b = 4 red; tree restored (0 changed files).

Gates on `b1d5fa9`: tsc incl. `-p e2e` clean (`sc525-r3b-tsc.log`); lint clean (`sc525-r3b-lint.log`); jest `Tests: 1 skipped, 6180 passed, 6181 total`, 248 of 249 suites, +4 on 6176 (`sc525-r3b-jest-full.log`); lifecycle port 9299 `done: 20/20 ok, 0 failed` + `done: 21/21 ok, 0 failed` (`sc525-r3b-lifecycle-a.log`, `-b.log`); e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (`sc525-r3b-e2e.log`); shots 592 PNGs, 0 FAIL, button host-leak 157/942 with the 34-record boundary, modal 228, input 15/176, checkbox 7/116, prose 106 [212] (`sc525-r3b-shots.log`, own `npm rc=0` line, polled past the 600 s tool limit); freeze `freeze OK (280/280 ...)` (`sc525-r3b-freeze.log`); parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (`sc525-r3b-parity.log`). Plugin tree clean, no pointer bump, no tags.

Drive-by fixes: none. Follow-ups: none (the r3 follow-up is closed by r3b).

## r5 (test-only; ledger "Owner rulings on r4 findings")
Commit `34f46cf` on `b1d5fa9`. `git -C <plugin> diff b1d5fa9..HEAD -- src` is empty (0 lines), so `main.js` is unchanged and lifecycle / e2e / shots / freeze / parity carry from `b1d5fa9`.

r4 LOW-1 (`test/dom/authoring/formModalStalePreview.test.ts`): `releasers` and its `afterEach` moved above `holdLookups`; `holdLookups` pushes its own releaser (`stopHolding`, then `releaseAll`); the duplicate push in `withRef` is gone. Each held entry's `release` is now idempotent (the first r5 attempt failed 12 SC-510 tests because a repeat `release` called the real lookup again and it threw; fixed by a `released` flag). The ds-scc test keeps its own push.

r4 LOW-2 (`test/dom/elements/refUnwrapView.test.ts`, describe `in-flight depth guard (SC-525)` > `each await window of a resolution is guarded on its own`; W1/W3/W4/W5 from `sc525-r4-probe-windows.ts.txt`): `SCC: the stale entity read returns null after the view was updated: one card, no stale "not renderable" error` (W1), `SCC: the view is updated while entity.body() is being read: one card` (W3), `legacy: a stale lookup that REJECTS after the view was updated to an inline body: only the inline card, no error` (W4), `legacy: the view is updated while the referenced file's block text is being read: one card` (W5). All green on head.

Single-check mutants (`sc525-r5-mutants.log`, `sc525-r5-mutants.sh.txt`, with r4's `sc525-r4-mutate.py.txt`; 3 suites, 73 tests; src restored, 0 changed src files):

| Mutant (check dropped) | Failed |
|---|---|
| M9-0 `RefUnwrapView.ts:220` (after `getEntity`) | 1 (W1) |
| M9-1 `:243` (after `model()`) | 0 (accepted, unpinned) |
| M9-2 `:256` (after `body()`) | 1 (W3) |
| M9-3 `:304` (legacy catch) | 1 (W4) |
| M9-4 `:308` (after `refs.resolve`) | 0 (accepted, redundant with :310) |
| M9-5 `:310` (after `legacyRefRawText`) | 1 (W5) |
| M4 / M6 (all gen checks) / M7 / M8 (onMount bump) | 10 / 15 / 1 / 5 |
| M10 (`resolveAndMount` without `++`) | 0 (accepted, r4 INFO-2) |

Cascade (`sc525-r5-cascade.log`, `sc525-r5-cascade.sh.txt`; deliberate throw mid-hold in the SC-510 test "every keystroke's lookup finishes after the last one"): the b1d5fa9 test file = 12 failed of 28 (2 injected + 4 SC-510 + all 6 SC-525 `@Ref.md` tests); head test file = 2 failed of 28 (only the 2 injected: feature and statblock). Scratch test file removed, tree clean (0 status lines).

Gates on `34f46cf`: tsc incl. `-p e2e` clean (`sc525-r5-tsc.log`); lint clean (`sc525-r5-lint.log`); jest `Tests: 1 skipped, 6184 passed, 6185 total`, `248 passed, 1 skipped, 248 of 249` suites (`sc525-r5-jest-full.log`): +4 on 6180. Targeted: `sc525-r5-green-jest-targeted.log` (73 of 73 in the three suites).

Drive-by fixes: none. Follow-ups: none.
