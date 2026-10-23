# SC-478 r6 rebase + regate report

## Executive summary
- **dse head `b869ce2`** on `d152ea4` (origin/develop, unchanged during the round). **Superproject head `92d1c2e`** on origin/main `21455cc` (CHANGELOG rebased clean). Nothing pushed; ` M draw-steel-elements` unstaged; dse porcelain empty.
- **One conflict, one hunk:** `visual-harness/obsidian-lifecycle.mjs`, header comment block (old lines 51-57, first commit `5815380` -> `7ef645f`). Kept SC-477's two lines ("SC-477 appends G-S28 and widens G-S6u …") and re-added SC-478's two G-S18 lines after them. G-S28 (SC-477) sits mid-file at line ~747 and merged untouched; the G-S18 block merged cleanly after G-S14. `git range-diff e4c5cf6..24e9179 d152ea4..HEAD` shows commits 2-9 "=" (identical) and only commit 1 changed, by exactly that header context. No SC-478 runtime/source file conflicted (`livePreviewScrollHold.ts`, `previewScrollPin.ts`, `registerFrameworkElements.ts`, jest file: no hunks).
- **N-L2 folded:** one jest case, "a second change far after the block does not widen the interval", with a multi-change ChangeSet fake (`changes([600,700,30],[5000,5000,20])`); mutation r5b (widen over every change) goes **red 1/1** on it (was 27/27 green). Suite 27 -> 28 tests; commit `b869ce2` `test(SC-478 r5)`. N-M1 / N-L1 not implemented (SC-496).
- **Gates on d152ea4 + SC-478:** tsc (+e2e) rc 0; lint rc 0; jest **5797 passed / 1 skipped / 239 of 240** (5769 + 28); lifecycle **33/33 ok, 0 failed**; e2e **104/104 ok, 0 failed, 0 known-bug, coverage 69/69**; parity **0 / 0 / 24** (rc 0); freeze **280/280**.
- **Shots (pin drift, as the dispatcher described):** `npm run shots` rc **1**, **592 PNGs written**, 0 FAIL lines, stops at `HOST COPY DRIFTED — the host model in visual-harness/shoot.mjs no longer matches the app.css of the Obsidian installed here (/home/scott/.config/obsidian/obsidian-1.15.0.asar, version 1.15.0)` (rules #3, #5, #6 differ only in whitespace/quoting of the selectors). So the host-leak and both text-scale checks did **not** run; `host-copy pin`, `button host-leak`, `modal button host-leak`, `text scale`, `text scale once` lines are absent. Not patched, per instruction.
- **Obsidian versions actually run:** lifecycle **1.15.0** (log: `OBSIDIAN-LIFECYCLE start: obsidian 1.15.0`; the harness copies the newest `obsidian-*.asar` from `~/.config/obsidian`, now 1.15.0, installed 2026-10-22 18:09). e2e **1.14.4** (log: `OBSIDIAN-E2E start: pinned app 1.14.4 + installer …`; `session: obsidian app 1.14.4`). All earlier SC-478 measurements were 1.14.4.
- **G-S18 and discrimination on 1.15.0 behave identically to 1.14.4; no scenario adjustment:** head ok 2/2 (all three of G-S8, G-S15, G-S18; (a)-(c) 3020 held at line 63+1500, (d) 2620 held at 63+1100, (e) 3020 at 65+1452, trackers 3725/3039 px, holds seen); base G-S18 FAIL 2/2 (3020 -> min 2556, line 63 -> 285 (a) / 160 (b1), tracker not drawn, hold false); "restore never dispatched" FAIL 2/2 (same numbers as base); "no hold" FAIL 2/2 (3020 -> max 6231 (a) / 5544 (b1), lines 285 / 160). G-S8 and G-S15 ok in all 8 runs. norefresh / oldmatch not re-run (the rebase touched none of their code: only the lifecycle header and tests changed).

## Conflict, file by file
| file | hunks | resolution |
|---|---|---|
| `visual-harness/obsidian-lifecycle.mjs` | 1 (header comment, `<<<<<<< HEAD` SC-477 lines vs SC-478 lines, directly before `// Usage:`) | both kept: SC-477's G-S28 lines first, SC-478's G-S18 lines after |
| everything else (`livePreviewScrollHold.ts`, `previewScrollPin.ts`, `registerFrameworkElements.ts`, jest file, CHANGELOG) | none | auto-merged / clean |
`package.json` / lockfile unchanged (`npm ci` not needed).

## Mutation (N-L2), script `mutate4.py`, log `sc478-r6-mutation-check.log`
- r5b: `if (fromA <= w.to && w.to <= toA) to = Math.max(to, toB);` -> `to = Math.max(to, toB);` -> RED (1): "a second change far after the block does not widen the interval: a same-language widget down there is not held".
- Re-check: interval not widened at all (remove the `iterChanges` call) -> RED (4), including the new test.
Source restored from git after each run (tree clean).

## Gate evidence
Final-run logs in scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`: `gate-{tsc10,lint10,jest10,lifecycle10,e2e10,shots10,parity10}.log` (+ `.rc`). Shots: rc file reads 1; shots dir 592 PNGs; `check-freeze.sh` -> `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.

## Follow-ups
- After the pin-bump (SC-497) lands: rebase, then re-run shots (expect 592, 0 FAIL, host-copy pin / host-leak / modal host-leak / both text-scale lines), freeze and parity. G-S18 needs nothing else.
- The e2e harness pins 1.14.4 while the lifecycle harness follows the newest asar (1.15.0): the two gates now run different Obsidian versions.

## Artifacts (absolute paths)
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`: this report; `sc478-r6-mutation-check.log`; `sc478-r6-disc-summary.log`; `sc478-r6-disc{1,2}-{base,head,norestore,nohold}.log`; `sc478-r6-disc-{base,norestore,nohold}-G-S18-FAIL.png`; `sc478-r6-build.log`.
