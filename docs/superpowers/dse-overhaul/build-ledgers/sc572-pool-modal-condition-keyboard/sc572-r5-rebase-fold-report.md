# SC-572 r5 rebase + fold report

## Executive summary
- STATUS DONE. Head `a339e7b3` on base `eeed5182` (SC-480 landed; I first rebased onto `fbaba3da`, then redid it onto `eeed5182` per the amendment). Not pushed, no tag, tree clean.
- Conflicts: none, both rebases clean. range-diff `97a9c93b..f62e1f5e eeed5182..HEAD`: 4 commits all `=` (cf34f3bd->2ef74511, 1305e0b4->06938c0a, 2581768f->976f5c63, f62e1f5e->5b599f70), plus one new commit `a339e7b3` (INFO-1).
- INFO-1 (`a339e7b3`): after the last icon of a row is removed by keyboard, focus goes to `pool.damage-amount` (if present and enabled); fallback is the next enabled control after the row that is not in `.dse-sedit__footer`, else the first such control. Never a footer button. POOL-C06 and the jsdom only-icon test assert the damage field.
- tsc (+e2e) rc 0; lint rc 0. jest 7082 passed / 1 skipped (full run 2 SC-568 load timeouts, both suites 78/78 alone).
- lifecycle 21/21 + 16/16 + 9/9 + 4/4 + 3/3 (`G-S59 G-S49 G-S73`) = 53/53.
- e2e `254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`.
- shots 592 rc 0; `button host-leak OK (163 … 978 …)`; `modal button host-leak OK (… 39 button kinds … 234 comparisons)`; `capture clip OK (147 …)`; all 592 PNG sha256 identical to the r3 render (which equalled the reviewer's clean-head set); freeze `280/280`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Rebase
- `git fetch origin`: first `fbaba3da`, then (mid-battery) `eeed5182`; `package.json` unchanged, no `npm ci` needed. The one gate call running against the fbaba3da base (lifecycle part 3, 9/9) finished before I rebased again; nothing was run under a moving tree. The whole battery below was run on the eeed5182-based head.
- eeed5182 touches CHANGELOG.md, `src/framework/host/*`, `reading-mode-host-pin.test.ts`, `visual-harness/obsidian-lifecycle.mjs` (G-S73): no overlap with this branch's files.
- range-diff logs: `r5-range-diff.log` (onto fbaba3da, all `=`), `r5-range-diff2.log` (onto eeed5182, all `=` plus the new commit).

## INFO-1 detail (`a339e7b3`, `src/views/MinionStaminaPoolModal.ts` `handOffConditionFocus`)
Icon slot rule unchanged (icon at `min(index, n-1)`). With none left: `[data-dse-control="pool.damage-amount"]` if not disabled and `focusControl` succeeds; else the filtered fallback above. Mouse-click path unchanged (`isKeyboardClick` still gates the whole hand-off). Tests: e2e POOL-C06 asserts `dse.focusedControl() === 'pool.damage-amount'` (kept the inside-modal check); jsdom `keyboard: removing the only icon focuses the damage field — not <body>, not a footer button` asserts `document.activeElement` is the damage field and not inside `.dse-sedit__footer`. The e2e does not press Enter on the damage field (that would record a new `press:Enter` pair for `pool.damage-amount`).

## Gate numbers vs expectation
- jest: 7080 + 2 (alone) = 7082 passed / 1 skipped (fresh worktree has the shots CSS cache now). Brief expected about 7076 + 5 new = 7081; one more than that estimate; no test fails.
- e2e 254/262, 8 known-bug, 163/163: as expected. Lifecycle 53/53: as expected. No RECOV-R07 / CENSUS-07 / montage-wheel flake fired this round.
- jest first run before the second rebase (fbaba3da base, 7061 passed / 1 skipped, 0 failures) and e2e 254/262 and shots were also green there (`r5-*` logs).

## Drive-by fixes
None.

## Follow-ups
None new.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r1-impl-a917bb127a70492b5/`)
Final (eeed5182 base): `r5b-jest-final.log`, `r5b-jest-alone.log`, `r5b-e2e.log`, `r5b-shots.log`, `r5b-shots.sha256`, `freeze.log`, `parity.log`, `r5b-lc1.log`..`r5b-lc5.log`, `r5-range-diff2.log`. Earlier (fbaba3da base, superseded): `r5-jest-final.log`, `r5-e2e.log`, `r5-shots.log`, `r5-lc1.log`..`r5-lc3.log`, `r5-range-diff.log`, `r5-jest1.log`, `r5-e2e-pool.log`.
