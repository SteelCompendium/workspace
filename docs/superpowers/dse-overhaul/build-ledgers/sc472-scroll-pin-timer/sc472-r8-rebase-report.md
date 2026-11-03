# SC-472 r8: rebase and re-gate report

## Executive summary
- dse `0698550f` on `sc472-scroll-pin-timer`, rebased onto develop `367a2f1d` (21 commits, clean). Superproject `351e3bb0`, rebased clean onto `origin/main`; the dse pointer bump is unstaged.
- Rebase: no conflict, and nothing beyond a textual merge. SC-551's start-up logic (`cdp-owned.mjs`, `--remote-debugging-port=0`) is untouched; G-S59 only calls `t.cdp.call(...)`, so it did not depend on the old port handling. SCENARIOS order ends `… G-S57 G-S62 G-S61 G-S59 G-S56` (checked by line number).
- Gates on `0698550f`: tsc + lint clean · jest **6378 passed / 1 skipped / 253 of 254 suites** (develop 6326 / 1 / 252 of 253, so +52) · lifecycle **49/49** in five parts with no `DSE_LIFECYCLE_PORT` set: 21/21 (183 s) + 16/16 (320 s) + 7/7 (241 s) + 4/4 (295 s) + G-S59 1/1 (156 s) · e2e `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL, button host-leak 161/966 (private `DSE_CAMERA_TMP`) · `freeze OK (280/280 …)` · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (run last).
- LOW-1 folded: `sc472-dse-verify-proposal.md` line 3 now reads "Base: dse `develop` `367a2f1d` + SC-472, final head `0698550f` (see `sc472-r6-fix-report.md` and `sc472-r8-rebase-report.md`)". Its part times, jest numbers and the SC-551 port note are updated.
- INFO folded: CHANGELOG now says the late redraw "no longer jumps, even if you scroll while you wait for it (a reader who scrolls to the very end of a long note can still settle up to about 500 px higher, as before)".
- No source change in this round; no reruns were needed (every part passed on the first run; the 429 cut-off came after the shots run, which had already finished with rc=0, and I read its log rather than re-running it).

## Gate detail
| gate | result | time / note |
|---|---|---|
| lifecycle part 1 (`G-S7a … G-S9a`) | 21/21 ok | 183 s, port 33435 (OS-assigned) |
| part 2 (`G-S9b … G-S40`) | 16/16 ok | 320 s, port 37819 |
| part 3 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52`) | 7/7 ok | 241 s, port 44273 |
| part 4 (`G-S57 G-S62 G-S61 G-S56`) | 4/4 ok | 295 s, port 45347 |
| part 5 (`G-S59`) | 1/1 ok | 156 s, port 44323: (a) 4.2-11.1 s, (b) 9.2 s x3, (c) pin on 2.42-2.44 s after the write in all three scrolls, scrollHeight held at the arm value, end positions 6944 / 5656 / 9599 |
| e2e | 128/128, 89/89 pairs | quiet machine |
Machine load 1-8 on 12 cores.

## Drive-by fixes:
- None.

## Follow-ups:
- None new.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
`sc472-r8-tsc.log`, `sc472-r8-lint.log`, `sc472-r8-jest.log`, `sc472-r8-lifecycle-part{1,2,3,4,5}.log`, `sc472-r8-e2e.log`, `sc472-r8-shots.log` / `.rc`, `sc472-r8-freeze.log`, `sc472-r8-parity.log`, `sc472-dse-verify-proposal.md`.
