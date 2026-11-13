# SC-612 r2 implementation report (impl-r2)

**Executive summary**
- STATUS DONE. Rule R implemented as ruled (Q1, Q2, Q3, Q5, Q7). dse branch `sc612-twin-deleted-wholenote-pin` 5 commits on top of origin/develop `c0995beb` (rebased from `63e00d7e` on the owner's message): tip `1a8f624c`. Superproject branch: 1 CHANGELOG commit `0097225a` on top of origin/main `a1d359f3` (a descendant of the `2329ba8f` the owner named). No pointer commit.
- Gates on the rebased branch: tsc + lint clean; jest 11744 passed / 2 skipped (base 11682 + 62); lifecycle 62/62 in seven parts (185 / 332 / 405 / 298 / 391 / 296 / 51 s); e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`; styles.css `5e5ff488…2b27` identical, so shots / freeze / parity carry (skipped).
- Red-on-base (63e00d7e source, run before the rebase; the source files are untouched by c0995beb): the new jest fails 21 of 76 in the three SC-612 files (T1/T2, T3, T4, T5b, T6, T6b, T13, the sweep, all 7 non-trivial lineMap greedy cases) and the strict-pin test in drawn-pin; T5 mirror is green at base as designed. Lifecycle G-S108 on a 63e00d7e bundle: (a)-(g) FAIL, (h)-(k) green.
- Mutants M1-M8 (r1's) against this implementation: 7 killed, M2 survives (accepted equivalent, Q7). Added M9 (greedy skipped for strictPins): survived all existing tests, so one jest test was added to drawn-pin; now killed.
- Sweep ported with a TS oracle: pinned totals reproduce r1 exactly (5771 cells, 5384 oracle-checked, 1376 ambiguous, saved 2977, refused 2326, other 468).

## Commits (dse, in order)
- `78b16d56` fix: lineMap.ts `mapLineGreedy` (+ `mapLineOf(..., trimTail = true)`), `ReadingModeBlockHost.pinnedTarget` + `greedyDissents`; doc comments of `pinnedTarget` ("Known limit (SC-556)" replaced) and `mapLine` updated. `mapLine` / `mapLineFromTail` / `mapLineStrict` results unchanged. Note without twins: no extra map (twin gate). Card fallback and `rebaseCardPin` untouched.
- `88f5d038` test: `test/dom/framework/reading-mode-host-whole-pin.test.ts` (T1-T13 plus T5b, T6b, T7b-shaped no-tie cases; 52 tests; asserts outcome, Notice list, note text).
- `d3f0a899` test: `reading-mode-host-whole-pin-sweep.test.ts` (1 test, ~2.7 s).
- `4f94a888` test: drawn-pin: a strict pin of a part that is the whole note, blank-line twins, upper deleted + last line edited, Save refused (kills M9).
- `1a8f624c` test: lifecycle G-S108 (part 7), fixtures `Lifecycle/gs108-*.md`, header comment, placed after G-S99 and before G-S56. (Hash after the rebase; `194bfbe8` before.)
- `lineMap.test.ts`: describe "SC-612: mapLineGreedy", 8 tests (inside `88f5d038`'s predecessor commit `78b16d56`).
- Superproject `0097225a`: CHANGELOG bullet under `## Unreleased`.

## Findings worth knowing
- A twin added ANYWHERE among interchangeable twins (even with prose between it and the run: `C '' prose '' C '' C`) is a real tie (equal-cost placements), so it is refused (T6b). Only a case where the surroundings differ saves (T7: twins separated by prose, the other deleted). This is inside Q4's accepted cost.
- Real Obsidian (G-S108) matches the r1 probe: RV and LP, form and card, all refuse with exactly one Notice, outside text kept, form open; the cost cell (g) saves on reopen.

## Gate numbers (rebased branch, base c0995beb)
| gate | result | log |
|---|---|---|
| tsc (incl. e2e) + lint | rc 0 / rc 0 | sc612-r2-gate-tsc-lint.log |
| jest | 11744 passed / 2 skipped, 273 suites + 1 skipped, 83 s, no timeouts (one run) | sc612-r2-gate-jest-1.log |
| lifecycle | 62/62: part 1 21/21 185 s; 2 16/16 332 s; 3 9/9 405 s; 4 4/4 298 s; 5 7/7 391 s (G-S91 green); 6 4/4 296 s; 7 1/1 51 s | sc612-r2-gate-lifecycle-part{1..7}.log |
| e2e | 328/331 ok, 0 failed, 3 known-bug, coverage 174/174 | sc612-r2-gate-e2e.log |
| styles.css | `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, identical | in the e2e log; sc612-r2-gate-styles-sha.log (pre-rebase) |
Pre-rebase run on 63e00d7e (kept as evidence): jest 11710 passed / 2 skipped, lifecycle parts 1-5 21+16+9+4+7 ok (186 / 323 / 416 / 297 / 390 s), tsc + lint clean: `sc612-r2-prerebase-gate-*.log`. Shots / freeze / parity not run (styles.css identical).

## Red-on-base (source of 63e00d7e; jest and the lifecycle bundle)
- `sc612-r2-red-on-base.log`: the three SC-612 jest files at base source: 21 failed / 55 passed of 76 (all 8 lineMap greedy tests fail: function absent; T1/T2, T3, T4, T5b, T6, T6b, T13 each form+card; the sweep fails with "written in an ambiguous cell: …" cells). Green at base: T5 (mirror), T7-T12 (controls).
- `sc612-r2-red-on-base-drawn-pin.log`: the drawn-pin test fails at base, 801 others pass.
- `sc612-r2-red-on-base-lifecycle-gs108.log`: bundle `main.js a68d3b6d…` (git archive of 63e00d7e, styles `5e5ff488…`) with the new harness file: (a)-(g) FAIL (form closed, survivor renamed / + written, no Notice), (h)-(k) passed.

## Mutants (`sc612-r2-mutants.log`, run on the branch before the rebase; host / lineMap files are unchanged by it)
M1 killed (T3, T4, sweep) · M2 SURVIVED (accepted equivalent) · M3 killed (T9, sweep) · M4 killed (T10, sweep) · M5 killed (T4, sweep) · M6 killed (T3, sweep) · M7 killed (3 lineMap tests, T3, T4, sweep) · M8 killed (T11 form, sweep) · M9 (greedy skipped for strictPins) killed only after the added drawn-pin test.

## Drive-by fixes
None.

## Follow-ups
- SC-621 (`rebaseCardPin` / `mapLineStrict` one-sided residual) untouched, as ordered.
- T11's card variant does not kill M8 (a card with a unique body falls back to `resolveWriteTarget`); the form variant and the sweep do.
- dse-verify proposal: `sc612-dse-verify-proposal.md` (section 7 points here).

## CURRENT block for dse-verify (proposal)
dse `develop` @ `c0995beb` + SC-612 (branch tip `1a8f624c`): tsc and lint clean · jest **11744 passed / 2 skipped** in a fresh worktree (11682 + 62) · lifecycle **62/62** (21 + 16 + 9 + 4 + 7 + 4 + 1; 185 / 332 / 405 / 298 / 391 / 296 / 51 s; G-S108 is part 7) · e2e **`328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · `styles.css` `5e5ff488…2b27` unchanged, so shots 592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze 280/280, parity 0 / 0 / 24 carry. Mutants M1-M9: 8 killed, M2 equivalent.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/)
sc612-r2-impl-report.md · sc612-dse-verify-proposal.md · sc612-r2-mutants.log · sc612-r2-red-on-base*.log · sc612-r2-gate-*.log · sc612-r2-prerebase-gate-*.log · sc612-r2-gate-lifecycle-gs108-try1.log (first G-S108 run on the branch, 51 s)
