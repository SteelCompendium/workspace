# SC-568 r3 report

## Executive summary
- DONE. dse branch `sc568-jest-load-timeouts` @ `2be69b95` (11 commits on dse develop `9b94baf2`, SC-613). Fix round for the r2b findings applied first, then rebased (14521bf0, then again onto 9b94baf2 per your second message).
- MEDIUM-1, MEDIUM-2: every reviewer mutant is now caught on the branch (chromeFocusHandoff FH1-FH11 11/11 red, windowHandoff WH1-WH6 6/6 red; FH4/5/6 and WH2/4 were green on the r2b branch). LOW-3: waits are now drain-based and bounded; the mock-hop mutants MV3/5/8/20 and the 30 ms burn all green. LOW-4, INFO-5, INFO-7, INFO-8 done; INFO-6 dropped as ruled.
- Quiet jest at 9b94baf2: 11857 passed / 2 skipped (11853 + 4 new tests), 276 suites passed. Contention `taskset -c 0 npx jest -w 11` x3: 0 failed each, 11857 / 2.
- tsc clean, lint clean. Bundle byte-identical to a clean 9b94baf2 build: `main.js` `81a67cb87b1240b3028c99d312c96a06af4f02a747be3c347ca679667e0a9219`, `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- `git diff --stat 9b94baf2..HEAD`: 12 files, `jest.config.ts` + `test/` only; nothing under `e2e/`, `visual-harness/`, `src/`, `main.ts`, `styles*`. So lifecycle/e2e/shots/freeze/parity were not run. `git status` clean. No `rm` used.
- SC-586 / SC-613 new tests (`conditions-modal-matrix.test.ts` is the only test file they touch): no timers, no `Date.now`, no sleeps, so nothing to change; green in all three contention runs.

## Fixes (commit shas are the rebased ones)
- `10c317a8`..`ce381e58` are the r1 commits (unchanged). r3 commits:
- `8f580e4b` MEDIUM-1 + INFO-7, `chromeFocusHandoff.test.ts`: realistic literal gaps on the fake clock: `advanceTimersByTimeAsync(2900)` after the pin returns (keyboard Pin, twice-in-a-row, both LOW-A tests), `1400` between successive rebuilds; new describe with a boundary test (rebuild at 2999 ms claims, at 3000 ms does not) and a SETTLE-lapse test (1400 ms claims again, then 1600 ms later nothing); the two redundant in-test `useFakeTimers` calls removed; comment in `beforeEach` says why. Suite 26 -> 28 tests.
- `6ebb773d` MEDIUM-2, `initiative-outside-edit.test.ts`: O02 and O16 `later(5)` -> `later(45)`; O22 `later(1400)` before every redraw of the burst; new O27 (widget arrives 2900 ms after the close: Notice + focus) and O28 (3100 ms: neither). Suite 26 -> 28 tests.
- `bc37d682` LOW-3: new helper `test/dom/_settleVaultReads.ts` (`settleVaultReads()`, `vaultReadsStarted()`): wraps `FakeVault.prototype.cachedRead` per test, counts reads in flight, waits until none is for two macrotask hops in a row, throws after 1000 hops. `reading-mode-host-pin` and `reading-mode-host-crlf-hover` use it instead of the 10-hop loop; the 687 site also asserts `vaultReadsStarted() > 0`. Honest limit: a no-op settle still passes all 169 tests on a quiet host (the scenarios pass either way; only the ordering that gets exercised differs), so the precondition cannot be proven by pass/fail; the drain wait just no longer depends on hop counts.
- `2be69b95` LOW-4 + INFO-5: `waitUntil` caps 5000 -> 25000 in `sidebarInitiative`, `formSaveRedraw`, `sidebarEncounterHandoff` (the inline loop at :502); `jest.config.ts` comment now says "~6x over alone, about 2x over the slowest async test under the 1-core repro (twin-reuse ~16 s)".
- INFO-8: `sc568-skill-proposal.md` revised: repro numbers (1-5 reds, 2 of 2 at both bases), observable wait instead of hop count, chained-vs-single-timer precision with the three remaining `setTimeout(25)` suites named, the two new rules (advance literal gaps on a frozen clock; `waitUntil` caps below 30 s), headroom wording.

## Mutant results (branch, this worktree; scripts `sc568-r3-mut.sh` / `sc568-r3-mutall.sh`, summary `mut-summary.txt`, per-mutant logs `mut-<ID>.log` / `.diff`)
Run on the pre-rebase head (the product files the mutants edit are unchanged by the rebase); each mutant is reverted by `git checkout -- <literal path>`, status clean after.
| mutant | r2b base | r2b branch | now |
|---|---|---|---|
| FH1 TTL never expires | 2 red | 2 red | 4 red |
| FH2 SETTLE ignored | 2 red | 2 red | 3 red |
| FH3 `<=` to `<` boundary | 0 | 0 | 1 red (new) |
| FH4 SETTLE_MS=1 | 2 red | 0 | 3 red |
| FH5 REQUEST_TTL_MS=1 | 11 red | 0 | 5 red |
| FH6 AFTER_RETURN_MS=1 | 9 red | 0 | 5 red |
| FH7 AFTER_RETURN shortening removed | 1 red | 1 red | 2 red |
| FH8 AFTER_RETURN_MS=4000 | 1 red | 1 red | 2 red |
| FH9 SETTLE_MS=50 | 0 | 0 | 3 red |
| FH10 AFTER_RETURN_MS=50 | 0 | 0 | 5 red |
| FH11 `expires + 1 <= now` | 0 | 0 | 1 red |
| WH1 SETTLE=1 | 1 red | 1 red | 1 red |
| WH2 SETTLE=40 | 1 red | 0 | 1 red |
| WH3 TTL=1 | 21 red | 3 red | 4 red |
| WH4 TTL=40 | 3 red | 0 | 3 red |
| WH5 settle timer 100 s | 1 red | 1 red | 1 red |
| WH6 SETTLE=200 | 0 | 0 | 1 red |
| MV3 / MV5 / MV8 / MV20 (mock read takes 3/5/8/20 hops) | green | MV8 red | all green, both suites (146 and 23 tests) |
| MVBURN (30 ms per hop) | 1 red | green | green, both suites |

## Gates at head `2be69b95` (on 9b94baf2)
- tsc rc 0, lint rc 0 (tsc.log, lint.log).
- Quiet jest (loadavg 6.27 at start, `git clean -fqX` first, no shots cache): `Test Suites: 1 skipped, 276 passed`, `Tests: 2 skipped, 11857 passed, 11859 total`, 86 s (quiet2.log). Delta vs the 11853 you gave: +4 (2 in chromeFocusHandoff, 2 in initiative-outside-edit; no test removed).
- Contention `taskset -c 0 npx jest -w 11`, full run, `Tests: 2 skipped, 11857 passed`, 0 failed: run 1 loadavg 7.06 (316 s), run 2 12.34 (414 s), run 3 14.42 (336 s). An earlier run on the 14521bf0 head (cont-run1: loadavg 25.76, 11837 passed, 0 failed, 395 s) is superseded.
- Bundle: `main.js` and `styles.css` from `npm run build` on the branch and on a clean detached worktree of 9b94baf2: identical (shas above; build-rcs.txt, build-shas.txt).
- Scope: `git diff --stat 9b94baf2..HEAD` = 12 files: jest.config.ts, test/dom/_settleVaultReads.ts (new helper), heroSheet, initiative-default-keys, initiative-outside-edit, chromeFocusHandoff, formSaveRedraw, reading-mode-host-crlf-hover, reading-mode-host-pin, sidebarEncounterHandoff, sidebarInitiative, settings-tab (+181 / -21).
- `git status` clean at the end.

## Commits (`git log --oneline 9b94baf2..HEAD`)
2be69b95, bc37d682, 6ebb773d, 8f580e4b, b09e73c3, 5ca4c519, d76c7de2, 91c87767, 10c317a8, ffc0e06e, ce381e58 (messages in the log; first 4 are r3, the rest r1).

## Drive-by fixes:
None.

## Follow-ups:
- `base-9b94` is a scratch git worktree (with a `node_modules` symlink) at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r3-impl/base-9b94`, left in place (no `rm` this round): `git -C <plugin> worktree remove --force` it when cleaning up; the r1 one was already removed. The reviewer's `br` / `base` scratch worktrees under `scratchpad/sc568-r2-rev/` are also still registered.
- INFO-6 remains dropped; the proposal names the three `setTimeout(25)` suites that would need `settleVaultReads()` if they ever add a second read.

## Evidence
Dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r3-impl/`: `quiet2.log/.json`, `cont2-run1..3.log/.json`, `cont-run1.log` (superseded), `tsc.log`, `lint.log`, `build-rcs.txt`, `build-shas.txt`, `mut-summary.txt`, `mut-<ID>.log/.diff`, `settle-noop.log`, scripts `sc568-r3-*.sh`.
Skill proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-skill-proposal.md`

## r5 (fold round for the r4 re-review)
- Head `b1e4f027` on `9b94baf2` (origin/develop had not moved; no rebase).
- `reading-mode-host-pin.test.ts` (was :680): the vacuous `vaultReadsStarted() > 0` is replaced by the reviewer's two lines (`expect(pin.text).toBe(full)`; `expect(full.split('\n')[pin.lineStart]).toBe('```ds-counter')`). `vaultReadsStarted` and its `started` counter had no other user and are removed from `_settleVaultReads.ts`; the helper's header now says REAL TIMERS ONLY (hangs to the 30 s timeout under fake timers; use `pump()`), and to assert an observable end state after the wait.
- `sc568-skill-proposal.md`: added "a drain wait is only the floor: assert the end state when observable" and the real-timers-only note.
- Verification: reading-mode-host-pin + -crlf-hover with the real helper 169/169 (r5-real.log); with the helper a no-op (restored from a byte-identical copy, never committed; `git status` shows only the intended edits) the assertion test goes red, 1 failed / 168 passed, "an outside edit elsewhere in the source note ... Save still lands in the embedded block", `expect(pin.text).toBe(full)` received the 7-line section (r5-noop.log). tsc rc 0, lint rc 0. Quiet full jest (loadavg 3.88): 276 suites passed, `Tests: 2 skipped, 11857 passed, 11859 total`, 87 s (r5-quiet.log). Net test count unchanged (+0).
- Scope unchanged: still only `jest.config.ts` and `test/` (12 files vs 9b94baf2), so the bundle-identity result of r3 stands (no `src/`, `e2e/`, `visual-harness/`, `main.ts`, `styles*` change). No `rm`.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r3-impl/` (`r5-real.log`, `r5-noop.log`, `r5-quiet.log/.json`, `tsc.log`, `lint.log`).
