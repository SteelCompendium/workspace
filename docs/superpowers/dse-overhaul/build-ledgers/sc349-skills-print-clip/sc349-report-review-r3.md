# SC-349 scoped re-review, round 3 (rebase onto develop `248e202b`)

## Executive summary
- Verdict: **APPROVE**. Head `25abfce2`, base `origin/develop` `248e202b`. Findings: HIGH 0, MED 0, LOW 0, INFO 2.
- Hashes: my head run equals both implementer head runs (`r4chead1`/`r4chead2`, 592/592). The freeze FAILED set equals `rebaseline-r4.txt`: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`, head hashes match 40/40.
- `rebaseline-r4.txt` equals `rebaseline.txt` once both are sorted (same 40 names, same hashes), so the sanctioned set is unchanged and the ask needs no amendment.
- Base `248e202b` (my run, equal to the implementer's base 592/592, `freeze OK (280/280 …)`) vs head:
  - 449 PNGs are identical and 143 differ. All 143 are in `sc349-clipped-list-r4.txt`; nothing differs outside it.
  - Every differing PNG is taller than 2400 device px (taller than the viewport, so grown), and no PNG changes size.
- Rebase: the branch diff `248e202b...25abfce2` is identical, apart from hunk offsets, to the approved `bc4a0c5...e2b17f1` and to the r2-approved `0ce76dd...acbacbd`. `range-diff` shows all 4 commits as `=`. There were no conflicts, so there was nothing to resolve.
- Develop's new in-run gates read the same as on base. All 28 OK lines are byte-identical base vs head apart from one run time; that includes button host-leak 161/966, print-twin delta (max drift 2.00px) and the 4-context `montage board scroll OK`.
- SC-490 sticky column: in all 34 montage-family captures (22 of them grown) `data-overflow` is `off`, so the pinned column is never engaged in a sweep capture. Board and pinned-cell geometry is unchanged across growth.
- jest: 6479 passed / 1 skipped, 257 of 258 suites. Parity: 0 / 0 / 24. Lifecycle and e2e were not run: the branch diff touches only `visual-harness/` and `test/unit/build/`.

## 1. Conflict resolutions
- The implementer reports a clean rebase, and I confirmed it. `git range-diff bc4a0c5..e2b17f1 248e202b..25abfce2` gives `1: a6a9b08a = 1: 786597ca`, `2: b41b8408 = 2: 26184315`, `3: b09ff92d = 3: 78573b32`, `4: e2b17f1b = 4: 25abfce2`.
- `git diff 248e202b...25abfce2` (355 lines; 3 files, +311/−2) equals `git diff bc4a0c5...e2b17f1` and `git diff 0ce76dd...acbacbd` once `index`/`@@` lines are stripped (empty diff).
- No semantic change beyond the rebase, and no conflict hunks to check.

## 2. Coverage of new capture paths
Every `screenshot(` in `visual-harness/shoot.mjs` at head:
- `:690` `page.screenshot({fullPage:true})` and `:691` `page.locator('#mount').screenshot()` sit inside `snap()`, after the measure-and-grow step, and are followed by the shot-time rect check. The gallery is the named exemption.
- `:2366` `page.screenshot()` is the chrome-placement gate's in-memory pixel read. It writes no PNG.

There are no other `screenshot(` or `captureScreenshot` calls, and the only PNG path is `snap()`'s `file` (`:671`).
- The new contexts at `:971` (coarse containment) and `:1221` (SC-490 board-scroll, 4 contexts at 1000x2400) take no PNG.
- Every sweep loop still calls `snap` (`:7571`, `:7583`, `:7609`, `:7634`, `:7661`, `:7685`, `:7690`). The SC-279 interaction shots (`thenClicks`, `fixedDice`, `screenOnly`) go through the same `snap()`, and their clicks run before the measurement.
- The 8 new grown PNGs are the `feature-rolled*` dark/light shots (SC-279). Each is taller than 2400 device px, differs from base, and appears in `sc349-clipped-list-r4.txt`. None is frozen.

## 3. Interaction with develop's new in-run gates
- Growth happens only inside `snap()`'s `try` block and is restored in `finally` before any probe. That code is unchanged since r2, and r1 measured the viewport at 900x1200 before all 572 snaps.
- Gates that read data snap collects (nested corners, print-twin snapshots) read it after the restore. The other gates run after the sweep or in their own contexts.
- Empirically, all 28 in-run gate OK lines are byte-identical in my base and head logs, apart from the run time in `text scale once` (69 s vs 77 s). That covers `button host-leak OK (161 button kinds × 3 states … = 966 comparisons …)`, `print-twin delta OK (144 capture ids … max vertical drift 2.00px …)`, `montage board scroll OK (… fine/dark … coarse … light …)` and the others. Growth changes nothing they measure.
- No gate runs on a grown viewport, so none can pass because of one.

## 4. Hashes
- My head run (scratch clone at `25abfce2`, private `DSE_CAMERA_TMP`): rc 0, 592 PNGs, 0 FAIL. The gate line reads `capture clip OK (147 screen-media … 41 print-media … NOT covered — named exemption(s): gallery--steel-dark.png (…); gallery--steel-light.png (…))`; it names exactly those two files.
- That run equals `r4chead1.sha256` and `r4chead2.sha256` (592/592 each).
- Freeze against the 280-line shared baseline gives `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`. The failing names equal `rebaseline-r4.txt`, and the head hashes for those 40 equal `rebaseline-r4.txt`.
- The implementer's comparison holds: sorted, `rebaseline-r4.txt` is identical to `rebaseline.txt`.
- My base run (scratch clone at `248e202b`) equals `r4bbase.sha256` (592/592) and reads `freeze OK (280/280 …)`.
- Base vs head (`rv3-compare.json`): 449 same, 143 differ. 0 differ outside the r4 clipped list, 0 listed files stay the same, 0 size changes, and every differing PNG is taller than 2400 device px.
- The top 2400 rows are identical for 135 of the 143. The 8 exceptions are the same ones measured and explained in r1 (7 scroll-blanked tops plus `negotiation-checked--steel-dark`).
- Six PNGs differ between this head and my r2 `acbacbd` run: `montage-sheet-log--steel-{dark,light}` and `roll--steel-{dark,light,print,realprint}`. All six are identical base vs head here, so they moved on develop, not because of SC-349.

## 5. SC-490 sticky hero column and the grown viewport
- I instrumented a scratch clone to record `.dse-mt__board` `data-overflow`, the board-wrap `scrollLeft`, and every pinned cell's rect relative to `#mount` (with computed `position`), before growth and at shot time. I ran it with `--element=montage`: 34 captures, 22 grown, PNGs byte-equal to the head run.
- `data-overflow` is `off` in all 34, before and after growth. In the sweep's 900 px captures the board never overflows, so the sticky column never engages in a frozen or unfrozen capture; only the board-scroll gate's own contexts exercise it.
- For the 22 grown captures, board and pinned-cell geometry, overflow state and `scrollLeft` are identical before and after growth (0 changed).
- The pin is horizontal (`left: 0`). Growth changes only height, and `data-overflow` is an attribute inside `#mount`, so a flip would also trip the layout fingerprint (it hashes innerHTML).

## 6. jest and parity
- jest (after `rm -f` of the literal `main.js`/`styles.css` paths): `Test Suites: 1 skipped, 257 passed, 257 of 258 total`, `Tests: 1 skipped, 6479 passed, 6480 total`.
- Parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0.
- Lifecycle and e2e were not run (branch diff is limited to `visual-harness/` and `test/unit/build/`).

## Findings
- **INFO-1:** the sticky column is not engaged in any sweep capture (all `data-overflow=off`), so no PNG covers the pinned column in a grown capture. No action for SC-349. If pinned-column visuals are wanted in the frozen set, that is a fixture question for SC-490's owner.
- **INFO-2:** carried from r2 and still true. The clip gate runs after gates that exit the run on failure, so in a full sweep a clip that also moves print-twin geometry is reported by the print-twin gate. No action.

## Hygiene
- `git status --porcelain` is unchanged: the superproject worktree shows ` M draw-steel-elements`, and the plugin is clean at `25abfce2`.
- The worktree's `shots/` is byte-identical to before (my shots runs were in scratch clones). `main.js`, `styles.css` and `main.css` were restored byte-for-byte after jest and parity.
- The shared freeze baseline was only read by `check-freeze.sh`. Nothing was committed, and nothing was written under the shared main checkout.
- `git worktree list` shows only the effort worktree: my clones are separate `git clone`s, not worktrees.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-review-r3/`)
- `rv3-approved.diff`, `rv3-head.diff`, `rv3-r2approved.diff`.
- `rv3-shots.sh`, `rv3-shots-{head,base}.{log,rc,sha256}`, clones `rv3-head/` and `rv3-base/`, `camtmp-{head,base,probe}/`.
- `rv3-freeze.log`, `rv3-freeze-base.log`, `rv3-compare.py`, `rv3-compare.json`, `rv3-head-vs-acbacbd-differ.txt`.
- `rv3-gates-{base,head}.txt`.
- `rv3-instrument.py`, `rv3-probe-run.sh`, clone `rv3-probe/`, `rv3-probe.{log,rc,sha256}`, `rv3-probe-montage.jsonl`.
- `rv3-jest.{log,rc}`, `rv3-parity.{log,rc}`, `rv3-worktree-shots-pre.sha256`, `wt-backup/`.
