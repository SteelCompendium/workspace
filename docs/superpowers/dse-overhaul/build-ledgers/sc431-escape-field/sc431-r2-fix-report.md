# SC-431 r2 fix report

## Executive summary
- STATUS: DONE. Rebased onto dse origin/develop `7817133` (package.json unchanged, no npm ci needed). New dse head `73e6a80`; superproject CHANGELOG commit `b67a07c`. Nothing pushed or tagged.
- All five findings folded: Conditions add-dropdown now consumes Escape (+ jest on the stand-in keymap + e2e COND-E01), registry renamed `escapeConsumer`, CHANGELOG reworded, stand-in keymap auto-detaches after every test, vacuous teardown test replaced and proven non-vacuous.
- ConditionsModal already `extends DseModal`; no wiring change needed.
- Gates green: tsc/lint clean; jest 5033 passed/1 skipped/229 of 230; lifecycle 26/26; e2e 74/78 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572 0 FAIL; freeze 276/276; parity 0/0/24.

## Commits since 7817133 (dse)
- 9741e41 fix(modal): SC-431 (r1, rebased); 1df0aa6 test(e2e): SC-431 (r1, rebased)
- 8bd55e5 fix(modal): SC-431 r2 - Conditions add dropdown consumes Escape; rename registry; test fixes (LOW-2/3)
- 1121bc6 test(e2e): SC-431 r2 - COND-E01 + control ids/manifest
- 73e6a80 test(e2e): SC-431 r2 - censuses accept the conditions-modal manifest ids
- superproject b67a07c docs(changelog): SC-431 r2 (pointer bump left unstaged)

## Per item
1. ConditionsModal: `registerEscapeConsumer(input, () => { if (!this.addOpen) return false; this.closeAdd(); return true; }, this.lifecycle)` in `renderCombobox`. Jest: the old bubble-phase LOW-4 test replaced by 4 tests on the stand-in keymap (first Escape closes only the dropdown + Add refocused + key swallowed; second closes modal; dropdown-closed Escape closes modal unchanged; stale input not a consumer after close). e2e COND-E01 (`e2e/specs/initiative/conditions-escape.e2e.ts`): open dropdown, type, Escape -> modal stays, dropdown gone, no write; Escape from Add button -> closes. New ids `init.cond.add` (initiative button), `cond.add`, `cond.input`; manifest `e2e/manifest/conditions-modal.ts`; `conditions` modal kind in `driver/dse.ts`; both censuses (`test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`) accept the new manifest. ConditionsModal was already a DseModal. Negative control: with the registration neutralised, COND-E01 FAILS ("the first Escape should close only the dropdown...") and 2 jest tests fail.
2. Rename: `draftCancel.ts` -> `escapeConsumer.ts`; `registerEscapeConsumer`, `consumeEscapeAt`; comments and test titles updated; semantics unchanged.
3. CHANGELOG bullet reworded ("the pool Stamina field in the initiative minion Stamina window") and extended with the Conditions "Add condition" dropdown.
4. `test/dom/_obsidianKeymap.ts` tracks every attached stand-in keymap and detaches all in an `afterEach` it registers on the importing file; all explicit end-of-test `detach()` calls removed (managedModal, stamina-edit-modal, minion pool, conditions tests).
5. The teardown test now asserts `consumeEscapeAt(inputEl) === false` after close. MUTATION RESULT: with the `owner.register(...)` teardown deleted from `escapeConsumer.ts`, 3 tests went RED (this test, the stepper "consumer is dropped when the owner unloads", and the Conditions stale-input test) - log `sc431-r2-mut-teardown.log`; restored, not committed.

## Gates (final head 73e6a80)
- tsc: rc=0 clean. lint: rc=0 clean.
- jest: `Test Suites: 1 skipped, 229 passed, 229 of 230 total` / `Tests: 1 skipped, 5033 passed, 5034 total`, rc=0 (baseline 5013). First run failed e2eCensus (the new `init.cond.add` id was not in the census's manifest set); fixed in 73e6a80.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`, rc=0.
- e2e: `OBSIDIAN-E2E done: 74/78 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, rc=0.
- shots: 572 PNGs, 0 FAIL, `pressed toggle parity OK (... 96 comparisons ...)`, rc=0.
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`, rc=0.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc=0.

## Drive-by fixes
None.

## Follow-ups
- Workspace `dse-verify` skill figures need updating to 74/78, 57/57 pairs (not touched; outside the worktree).
- `sc431-r2-shots` takes >600 s: the harness moved it to the background; I polled the log for its own `rc=` line.

## Artifacts (dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/)
sc431-r2-fix-report.md, sc431-r2-tsc.log, sc431-r2-lint.log, sc431-r2-jest.log, sc431-r2-jest-focus.log, sc431-r2-jest-census.log, sc431-r2-mut-teardown.log, sc431-r2-mut-conditions.log, sc431-r2-e2e-focus.log, sc431-r2-e2e-negcontrol.log, sc431-r2-e2e-full.log, sc431-r2-lifecycle.log, sc431-r2-shots.log, sc431-r2-freeze.log, sc431-r2-parity.log
