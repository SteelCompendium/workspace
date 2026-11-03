# SC-557 r3 fix report

## Executive summary
- STATUS: DONE. Head `41c03e60` on dse `31d8f779` (origin/develop has not moved; fetched at the end). Three r3 commits on top of r1's `f2f25f9f`, harness only (`visual-harness/obsidian-lifecycle.mjs`, G-S61 block).
- MEDIUM-1 fixed: a throwing disk read now counts a failed-read frame (`readErr`) and FAILS the phase; its stale cards are counted (never exempt). X6 (X5 + every disk read fails) now FAILs in all 9 recorded phases; before it passed.
- LOW-1 covered, but NOT by the prescribed "judge a torn read against the last whole read": that rule counted cards that are merely ahead of the document (measured: 2 `dd` frames in a row in one loaded run, a 1-frame margin from a false FAIL). Shipped instead: a torn frame extends a counted run that is already going (so it can never lower the count) and is otherwise judged catching up (cap-bounded). A re-read inside the frame does not help (tried; the write needs the main thread).
- LOW-2 fixed (counted samples lead the message), LOW-3 fixed (each measurement set has its own loadavg range and maximum, in the code comment and the proposal).
- INFO-1/INFO-2 folded into `sc557-dse-verify-proposal.md` (SC-544's exact M4 line; X2/X5/X6 as standing probe controls with reproduction commands); the mislabel in `sc557-r1-tool-s557-mut.py` corrected.
- Probes on the final head: X2 FAIL by the cap (90-91 frames / 1500-1517 ms, 9 phases); X5 FAIL by the counted-stale check (8-24 in a row, 8 phases); X6 FAIL by read-failed (+ stale run), 9 phases.
- Green: 3 loaded runs (12 loops, started and stopped inside the call, loadavg 5.7 -> 13.3) 0 FAIL, max catching-up 3 frames / 67 ms, 0 counted; 1 run with no loops (1-min loadavg decaying 12.2 -> 2.9) 0 FAIL. Red `f7c9c7ce`: (a)-(i) as before.
- Gates: tsc + lint clean; lifecycle part 4 `G-S57,G-S62,G-S61,G-S56` 4/4 (293 s); main.js `8e969de2...` / styles.css `93be34af...` byte-identical to the `31d8f779` build.

## Dispositions
| finding | disposition |
|---|---|
| MEDIUM-1 | Fixed. `R.readErr` counts frames whose read threw; `wrongCards` returns "the recorder could not read the note from disk in N frame(s), so its stale-frame check did not run (...)" first; the stale cards of such a frame are `x` (counted). The outcome line prints `torn` and `failed` reads separately from `catching up`. |
| LOW-1 | Covered, differently (see summary). A torn frame (`read.length !== doc.length`): `x` (counted, adds to the run) if a counted run is going (`R.run > 0`), else `u` (catching-up-like, cap-bounded, printed as "on a torn disk read"). Measured with the prescribed fallback first (commit `e777937c`, logs `r3-load-rep1..3`): torn reads happened in all 3 loaded runs and 2 of them became counted `dd` frames ("b1=6/doc5/disk5", +11 ms and +29 ms: consecutive frames). A same-frame re-read (commit `00b7e804`, logs `r3b-load`) still found 2 of 2 torn frames torn, because the file is emptied by `open` and written only when the main thread runs the callback. Final design in `41c03e60`. Residual exposure: a wrong card whose first frames are non-torn and then a torn frame comes first in a run (run = 0) is exempt for that one frame; it cannot lower a running count. |
| LOW-2 | Fixed: `seen` lists `rec.odd` (counted frames) before `rec.samples`. Visible in X5/X6 logs: "(dd b2=7/doc5/disk5 +45ms ..." first. |
| LOW-3 | Fixed in the code comment (`CATCH_UP_CAP_MS` block) and in the proposal: pre-rebase 10 runs loadavg 7-26 -> 6 frames / 117 ms; rebased 10 runs 0.8-13.9 -> 4 frames / 83 ms (71 ms behind); r2's 6 runs 0.5-18.2 -> 4 frames / 67 ms; r3's 3 loaded runs 5.7-13.3 -> 3 frames / 67 ms; quiet 1 frame / 17 ms. |
| INFO-1 | Folded: proposal §2 names SC-544's exact one-line M4; `sc557-r1-tool-s557-mut.py` M4 comment corrected (sibling-based; r1 used `host.livePreviewCalloutWidget()` as the sibling test). |
| INFO-2 | Folded: proposal §3, X2/X5/X6 with commands. The probe patch `sc557-r3-tool-probe-patch.py` is the r2 patch re-anchored for the r3 recorder (two anchor strings; the logic is the reviewer's). Probe hooks are NOT in the branch; the temporary probe harness file was deleted by literal path after each use. |
| INFO-3..6 | No action. |

## Measurements on the final head `41c03e60` (bundle: `git archive 31d8f779` build, main.js `8e969de241ee12f45a7b49836eaf7d1ad6925af4ce8d5e69993232abb0730d49`)
Probes (logs `sc557-r3-gs61-r3f-X{2,5,6}.log`; reproduce with the proposal §3 commands):
- X2 (`SC557_DOC_DELAY_MS=1500`): FAIL, all 9 recorded phases by the cap: 7 x 90 frames / 1500 ms, 2 x 91 frames / 1517 ms.
- X5 (`SC557_INJ=2:7:400`): FAIL, (a) 24, (b) 8, (c) 24, (d) 23, (e) 23, (f) 24, (i) 24, (j1) 24 counted in a row; checks: stale-run only.
- X6 (`SC557_BADREAD=1 SC557_INJ=2:7:400`): FAIL, (a)-(f), (i), (j1) read-failed + stale-run (24, 9, 24, 22, 23, 24, 25, 25 in a row), (j3) read-failed only; 147-178 failed-read frames per phase set. (Before: PASS, masked.)
Green G-S61 alone (`sc557-r3-gs61-green2-r3c-*`): loaded rep1-3: OK, 107-108 s, loadavg 5.68 -> 12.57, 12.57 -> 13.18, 13.18 -> 13.31; stale frames 8/6/9, all catching up (cards cu 9; cu 5 + torn 1; cu 11 + torn 1), counted 0, pending 0, max catching-up run 3 frames / 67 ms, doc behind disk <= 70 ms; torn read frames 1/2/3, failed reads 0. Idle (no loops running; 1-min loadavg at start still 12.2 from the preceding loaded run, 2.9 at the end): OK, 97 s, 1 catching-up frame.
Red `f7c9c7ce` (`sc557-r3-gs61-red-r3c-rep1.log`): FAIL (a)-(f) disk + pending, (g)-(i) disk. Same as r1.
Intermediate runs on `e777937c` and `00b7e804` (`sc557-r3-gs61-green2-r3-*`, `r3b-*`, `r3-X*`) are kept as evidence for the LOW-1 design decision, not as final numbers.

## Gates
- `sc557-r3-gate-r3tsc.log`: tsc (incl. `-p e2e`) rc 0. `sc557-r3-gate-r3lint.log`: lint rc 0.
- `sc557-r3-gate-r3lc4.log`: `OBSIDIAN-LIFECYCLE done: 4/4 ok, 0 failed` (`G-S57,G-S62,G-S61,G-S56`), 293 s.
- Worktree build after the gates: main.js sha256 `8e969de241ee12f45a7b49836eaf7d1ad6925af4ce8d5e69993232abb0730d49`, styles.css `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b` (equal to the `31d8f779` export build). jest/e2e not re-run (no source or test file outside the harness changed; r1's runs on `f2f25f9f` stand, the diff since is the G-S61 recorder only).
- origin/develop is still `31d8f779`; no rebase needed.
- Load loops: started and stopped inside each loaded call (`s557-loadreps.sh`, trap on exit); pid file empty after each; none left.

## Follow-ups
- Torn reads happen in every loaded run (1-3 frames per run). They are exempt from the counted run unless one is already going. If a stricter check is wanted, the harness could record the content Obsidian is about to write (wrap `vault.process`) instead of reading the file; not done (out of scope, and it changes the observed system).
- History: r3 is three commits because the first two designs were measured and replaced; the owner may squash.

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/`)
- This report; `sc557-dse-verify-proposal.md` (updated).
- Logs `sc557-r3-gs61-*.log`, `sc557-r3-gate-*.log`; tools `sc557-r3-tool-*` (probe patch, patch scripts, summarizers).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements` (clean).
