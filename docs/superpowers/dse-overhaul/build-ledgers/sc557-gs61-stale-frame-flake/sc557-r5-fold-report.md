# SC-557 r5 fold report

## Executive summary
- STATUS: DONE. Head `d689b719` (one commit on `41c03e60`), dse base `31d8f779` (origin/develop has not moved; no rebase). Harness only, G-S61 block.
- LOW-A fixed as ruled: `R.tornRun` counts consecutive torn disk-read frames; 3 or more in a row fails the phase with "the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run". The longest torn run is printed in the outcome line (`torn in T frame(s) (longest run L)`).
- Probe T (`SC557_BADREAD=torn` + `SC557_INJ=2:7:400`): FAIL in all 9 recorded phases by the new message (123-176 frames in a row); it passed on `41c03e60`.
- Probe X5: still FAIL in the 8 LP phases by the counted-stale check, 8-25 in a row.
- Green G-S61 alone, 2 runs under 12 loops (started and stopped inside the call; loadavg 0.45 -> 11.25 and 11.25 -> 12.47): 0 FAIL, longest torn run 1 frame, max catching-up run 5 frames / 100 ms, 0 counted, 0 pending.
- Lifecycle part 4 `G-S57,G-S62,G-S61,G-S56`: 4/4 ok (293 s). tsc, lint rc 0. main.js `8e969de2...` / styles.css `93be34af...` unchanged (byte-identical to the `31d8f779` build).
- LOW-B fixed in `sc557-dse-verify-proposal.md` §3: durable patch location, devbox command shape, bundle recipe (and "unset = the tree's own fresh build"), run from a copy of the tree, X5 wording ("block 2's own value, 6 in (c) and (j1)"), T added to the standing controls; patch supports `SC557_BADREAD=torn`.

## Details
- Code change (`visual-harness/obsidian-lifecycle.mjs`): `tornRun` / `tornLongest` in the recorder state, updated every frame (reset on a frame whose read was whole or threw), returned by `recStop`; `wrongCards` checks it after the pending / counted-run check and before the cap; the recorder comment says why (every frame would be judged catching up and the check would be off; green: at most 2).
- Order of messages: read error, then pending / counted run, then torn run, then cap. Probe T has no counted frames, so the torn-run message is the one it gets.
- Green evidence: at most 2 torn frames per phase in r3's and r4's runs; in r5's two runs the longest torn run was 1 (2 of 9 phases had one torn frame).
- Probe patch (`sc557-r5-tool-probe-patch.py`): r3 patch + `slice(0, PR.badread === 'torn' ? -1 : undefined)` on the recorder's parsed read. The temporary probe file was written into the worktree's `visual-harness/` and deleted by its literal path; `git status` is clean.
- The proposal's CURRENT line adds the r5 head's two loaded runs.

## Gates (logs `sc557-r5-gate-*`)
- `sc557-r5-gate-r5tsc.log` rc 0; `sc557-r5-gate-r5lint.log` rc 0.
- `sc557-r5-gate-r5lc4.log`: `OBSIDIAN-LIFECYCLE done: 4/4 ok, 0 failed`.
- Worktree build sha256: main.js `8e969de241ee12f45a7b49836eaf7d1ad6925af4ce8d5e69993232abb0730d49`, styles.css `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b`.
- jest and e2e not re-run (only the G-S61 recorder changed).

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/`)
- `sc557-r5-fold-report.md`, `sc557-dse-verify-proposal.md` (updated), logs `sc557-r5-gs61-r5-T.log`, `sc557-r5-gs61-r5-X5.log`, `sc557-r5-gs61-green2-r5-load-rep{1,2}.log`, `sc557-r5-gate-r5{tsc,lint,lc4}.log`, tools `sc557-r5-tool-probe-patch.py`, `sc557-r5-tool-patchF.py`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements` (clean).
