# SC-598 r6 rebase report (identity I1)

## Executive summary
- STATUS DONE. dse head `8b84b6355f68744f3d1a3f63517100c48b719aaf` on `origin/develop` `b5d18f79` (SC-589). Range-diff of the five SC-598 commits onto it: all `=` (`sc598-r6-dse-range-diff.log`); one new test-only commit `8b84b635` (G-S91 harness code only).
- Superproject head `5453d331ba7084b9897499aa2a59fa47781937e4` on workspace `origin/main` `f1176824` (rebased; one CHANGELOG conflict resolved: SC-598 above SC-589 above SC-588 above SC-597, every other bullet kept). The dse pointer is not bumped (the tree pins `b5d18f79` = origin/main's). No `commit -am` used.
- Gates: tsc (incl. `-p e2e`) rc 0, lint rc 0 · jest **7341 passed / 2 skipped** (7328 + 13; 263 of 264 suites, 53 s) · lifecycle **57/57** = 21 + 16 + 9 + 4 + 7, wall 184 / 323 / 404 / 297 / **395 s** (part 5 under ~420 s) · e2e **`272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (139 s, RECOV-R07 passed).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = a `b5d18f79` archive build: shots, freeze, parity carry.
- G-S91: **red on the `b5d18f79` bundle in all 6 trials, green on head** (part 5 and three scratch runs B1-B3). Part-5 gaps: title rv 103, title lp 110, apply rv 110, reopen rv 67 ms (the gated ones; loadavg rose to 14 during the run), queued double-clicks 130 / 131 ms (not gated). Scratch runs: 33-107 ms.
- INFO-1 done (`reopen rv` asserts `.is-editing` after the first Escape). INFO-3 only partly achievable: see below. I cut one evaluation; cutting more produced real red flakes, so I stopped there and did not raise 140 ms. This needs the owner's read.

## O14 INFO-1
`st()` now returns `editing` (`.is-editing` on the popover); `reopen rv` fails with "the preview must be focused (.is-editing) before the second open, or this trial does not test a re-open" unless `afterFirstClose.editing` is true.

## O14 INFO-3: what I measured, and what I changed
The gap is the in-page time between the opening click and the second click. Before: after the opening press the harness ran two `Runtime.evaluate` calls (the point, then what it hits), `mouseMoved`, and a press with its own release. Change made (`8b84b635`): ONE evaluation returns the point and the hit; the awaited `mouseMoved` and the press stay.

Result: the gap is mostly the renderer still opening the modal, which grows with host load, so a script cannot cut it by much:

| Run (G-S91, same harness) | Title rv | Title lp | Apply rv | Reopen rv | Load |
|---|---|---|---|---|---|
| old flow, run 1 (`sc598-r6-experiment-old1-G-S91.log`) | 134 | 120 | 67 | 36 | 8 |
| old flow, run 2 | 38 | 91 | 39 | 35 | 5 |
| final flow B1 / B2 / B3 (scratch) | 69 / 40 / 107 | 79 / 93 / 104 | 48 / 37 / 33 | 63 / 70 / 37 | 2 / 4 / 6 |
| final flow, part 5 (`sc598-r6-gate-lifecycle-part5.log`) | 103 | 110 | 110 | 67 | 14 |
Idle: 33-79 ms. Loaded: up to 110 ms. The brief's target (about 90 ms or less) holds on an idle host and not at loadavg 6-14. The 140 ms gate was not hit in any run.

Why I did not cut further. Both variants below made `title` / `apply` trials go red on head with gaps of 41-75 ms, i.e. not the vacuity gate but the documented residual (input queued while the renderer is busy is handled before the helper's due 10 ms timer, so the preview is not yet focused at click 2):
- zero evaluations (title and Apply points cached from the `reopen` trial's first open, `reopen` run first): `sc598-r6-experiment-new1-G-S91.log`, `-new2-`; variant file `sc598-r6-experiment-cached-point-variant.mjs.txt`.
- the move pipelined with the press (and/or the release too), or no move before the press: `sc598-r6-experiment-zero-length-press-G-S91.log`, `sc598-r6-pipelined-release-experiment-G-S91-FAIL.png`.
So the evaluation round trip is protective, and a flake of that kind (red for the wrong reason) is worse than a gate near its limit. If the owner wants a smaller gap on a loaded host, the honest lever is the 140 ms threshold or serialising the host's load; neither is mine to change (O14 says do not raise it).

## Red on base, green on head
- Base bundle: `git archive b5d18f79`, built in scratch, `DSE_LIFECYCLE_BUNDLE`; `sc598-r6-red-on-base-G-S91.log`, shot `sc598-r6-red-on-base-G-S91-FAIL.png`. All 6 trials red: five "the preview was gone" (gaps 75 / 75 / 108 / 136 / 33 ms), `reopen rv`: "the preview turned into a source editor".
- Head: `sc598-r6-gate-lifecycle-part5.log` (G-S91 ok, six trials) and `sc598-r6-green-on-head-G-S91-scratch-B1.log`, `-B2`, `-B3`.

## Rebases
- dse: 5 commits replayed onto `b5d18f79`, no conflicts (SC-589 touches initiative view/specs, a sidebar vault note, dse CHANGELOG; no shared file). Range-diff all `=`.
- Superproject: `origin/main` had moved (`e9ff3635` -> `f1176824`); conflict in `CHANGELOG.md` `## Unreleased` (SC-589's bullet vs mine), resolved by keeping both. `sc598-r6-super-range-diff.log` (the first commit shows `!` for the surrounding bullets only, the second is the O13 wording edit).

## Gate logs (ledger dir, prefix `sc598-r6-`)
`sc598-r6-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..5.log`, `-e2e.log`, `-styles-sha.log`; `sc598-r6-dse-range-diff.log`, `sc598-r6-super-range-diff.log`; G-S91 logs and shot above; experiments: `sc598-r6-experiment-old1-G-S91.log`, `-old2-`, `-new1-`, `-new2-`, `-zero-length-press-`, `sc598-r6-experiment-cached-point-variant.mjs.txt`, `sc598-r6-pipelined-release-experiment-G-S91-FAIL.png`, `sc598-r6-gaps.sh.txt`.
Wall times: lifecycle 184 / 323 / 404 / 297 / 395 s; jest 53 s; e2e 139 s.

Drive-by fixes:
- none.

Follow-ups:
- none new beyond the INFO-3 trade-off above. Temp dirs: every kept FAIL dir that my runs printed was deleted by literal path. One of them (two at once, `EnYHWV`, `nrcboL`) I deleted before re-checking that my logs named them; they were mine (both printed in my try1/try2 logs). `7FmC2d`, `R3aFtV`, `1fAXLH` were not mine and were left.
