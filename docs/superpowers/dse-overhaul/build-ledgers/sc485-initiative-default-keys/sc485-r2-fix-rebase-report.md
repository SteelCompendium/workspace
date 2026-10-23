# SC-485 r2 report: review folds, rebase, full battery

## Executive summary

- Verdict: DONE. No src change; no conflicts in the rebases; every gate on the rebased head is at its expected number, shots ran to the end rc 0.
- Plugin head `d0b0d08` on base `2c61511` (origin/develop, not newer). Superproject head `a895c02` on base `2ba04a6` (CHANGELOG only; the submodule pointer is untouched, `M draw-steel-elements` is the unstaged pointer).
- Added the reviewer's two tests; red under M11 and M20 (test 1) and M14 (test 2), green on the unmutated src, tree clean after each restore.
- LOW-2: `stamina-entry.e2e.ts` comment now says 22. LOW-3: CHANGELOG reworded (no "only what you touched").
- tsc / lint clean; jest 5825 passed / 1 skipped / 240 of 241; lifecycle 33/33; e2e 108/108, 69/69 pairs; shots 592, 0 FAIL, rc 0; freeze 280/280; parity 0 / 0 / 24.

## Commits

Plugin (after rebase): `9f87be8` test (red on base), `8f05121` fix, `1645a99` e2e + fixture + architecture note, `d99e54c` e2e coverage-gate fix, `d0b0d08` this round: two pool-unit/minion-instance tests + comment fix.
Superproject: `592cade` changelog (r1), `a895c02` changelog reword (r2).
Rebase conflicts: none (plugin 5 commits, superproject 2 commits, both clean).

## Tests adopted (both in the pool-unit describe of `test/dom/elements/initiative-default-keys.test.ts`)

1. "pool back at its parse value but the captain trio changed ..." (reviewer's `ATTACHED_ONLY` scenario: pool damage with one kill, then promote the attached Ogre; live readout contains `12/16 (6)` and a reload equals it).
2. "authored minion instances: a group toggle writes no `conditions: []` on them".
Both pass on the unmutated src (25/25 in the file).

## Mutant-red proofs (mutations from the reviewer's `sc485-r-mutate.py`, applied to the real tree, restored with `git checkout src`; `git status --porcelain` showed only the two intended test/comment files afterwards)

- M11 (`groupKeep` ignored in `groupDto`): red = test 1 (1 failed / 25).
- M20 (creature trio dropped from the unit check): red = test 1 (1 failed / 25).
- M14 (authored minion instance not recorded): red = test 2 (1 failed / 25).
Logs: `sc485-i-i2M11`, `sc485-i-i2M20`, `sc485-i-i2M14` (.log/.rc).

## Gates on the rebased head (logs in the scratchpad folder, prefix `sc485-i-i2`)

- npm ci rc 0. tsc (incl. `-p e2e`) rc 0. lint rc 0.
- jest rc 0: `Tests: 1 skipped, 5825 passed, 5826 total`, `Test Suites: 1 skipped, 240 passed, 240 of 241 total`.
- lifecycle (port 9347) rc 0: `OBSIDIAN-LIFECYCLE done: 33/33 ok, 0 failed`; G-S8 and G-S15 ok (sizer fell to 2446px under the pin, scrollTop held at 2779).
- e2e rc 0: `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`; run dir `e2e/.out/20261023-143658-0546`.
- shots rc 0: 592 PNGs, 0 FAIL; `host-copy pin OK (... verbatim Obsidian 1.15.0; 18 further rules ...)`, `button host-leak OK (113 button kinds ... 678 comparisons)`, `modal button host-leak OK (10 ... 228 comparisons)`, `text scale OK (1626 comparisons ...)`, `text scale once OK (107256 comparisons over 214 loads ...)`, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning. Run took over 10 minutes (it was moved to the background by the tool timeout and finished rc 0).
- freeze rc 0: `freeze OK (280/280 frozen print PNGs byte-identical ...)`. parity rc 0: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Drive-by fixes

None.

## Follow-ups

None new. Process note: `git commit -a` in the superproject worktree stages the submodule pointer; I caught it and re-made the commit with CHANGELOG.md only.

## r3 (rebase only, SC-488 landed)

- Plugin: `53e1e48` on base `0dff966` (origin/develop; was `2c61511`). Superproject: `6bacd4e` on base `3762276` (origin/main), CHANGELOG only, no conflicts, pointer not committed.
- range-diff `2c61511..d0b0d08` vs `0dff966..HEAD`: all five SC-485 commits `=`: `9f87be8`->`1602083`, `8f05121`->`ead7585`, `1645a99`->`465f77a`, `d99e54c`->`786b3b4`, `d0b0d08`->`53e1e48`.
- npm ci rc 0; tsc (incl. -p e2e) rc 0; lint rc 0.
- jest rc 0: `Tests: 1 skipped, 5840 passed, 5841 total`, `Test Suites: 1 skipped, 240 passed, 240 of 241 total`.
- e2e rc 0: `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`; run `e2e/.out/20261023-145848-6f24`.
- Lifecycle, shots, freeze, parity not re-run (stand from r2).
