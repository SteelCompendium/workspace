# SC-518 r3 fix report — COMPLETE (resumed after pause)

## Executive summary
- STATUS: DONE. Base `71437da` (SC-479), HEAD `9be397e`, tree clean. Superproject CHANGELOG `259ff49` (pointer not bumped).
- All four r2 findings fixed with tests; each test fails under its mutation (MEDIUM-1, LOW-1, LOW-2/M9, LOW-3/M6 all caught).
- Full battery on `9be397e`: tsc/lint clean; jest 6148 passed / 1 skipped / 248 of 249 (same before and after shots); lifecycle 20/20 + 21/21 = 41/41; e2e 124/124; shots 592, 0 FAIL, host-leak 145/870; freeze 280/280; parity 0/0/24.
- SC-479 scroll check (G-S50 tall-note phase): scrollTop 2794 -> 2794, card top 163.7 -> 163.7, focus on the new pencil with the ring.
- G-S50 fails on the ed368f6 and 6386a8f bundles (details below).

## Commits (dse branch `sc518-form-save-focus`, on 71437da)
- r1 (rebased): red `4e8d1a4`, fix `49c7ccf`, G-S50 `ace522b`.
- r3: tests `61f0956` (red: MEDIUM-1, LOW-1, hero hadFocus; LOW-2/LOW-3 cases added and caught by mutation), fix `17553f7` (MEDIUM-1 + LOW-1), G-S50 twin/mouse phases `1260447`, G-S50 tall-note phase `9be397e`.
- Superproject: `76d68d5` (r1 CHANGELOG), `259ff49` (CHANGELOG wording: mouse leaves focus alone; identical twins). Pointer not bumped.
- No WIP commit; the tree is clean.

## Fixes
- MEDIUM-1: `Request.opener` records the form's opener; the claim may take focus when `doc.activeElement === req.opener && !root.contains(req.opener)` (the old upper section reused at the twin's place).
- LOW-1: `formOpenerOf` records `hadFocus` (activeElement === pressed at press time, read in the click handler, so the SC-519 pending-write path and the hero "Edit definition" carry it); `armFormFocus` arms only when `hadFocus`. A mouse press leaves focus where it was, as before SC-509.
- LOW-2: jest case (in-card Increase in its debounce, keyboard pencil press, edit, Save, new pencil focused).
- LOW-3: failed-Save test now changes the block body on disk (same fence line, so same block key), Saves (dropped), closes, redraws the block, asserts focus stays on `<body>`. The earlier test removed the fence, which changed the key and so could not see a leftover request.
- CHANGELOG bullet reworded (it promised mouse behaviour).

## Mutation checks (jest formSaveFocus + heroSheet, 41 tests; each caught by exactly 1 case)
- MA remove the stale-opener clause: 1 failed (MEDIUM-1 twin case).
- MB remove the `hadFocus` gate: 1 failed (LOW-1 mouse case).
- M9 read the opener inside the `openAfterPendingWrite` callback: 1 failed (LOW-2 case).
- M6 `settleChromeFocus(key, null, true)`: 1 failed (LOW-3 case).
- Logs: `sc518-r3-mutation-MA-no-stale-opener.log`, `sc518-r3-mutation-MB-no-hadFocus-gate.log`, `sc518-r3-mutation-M9-opener-after-flush.log`, `sc518-r3-mutation-M6-failed-not-disarmed.log`. Red run: `sc518-r3-jest-red.log` (3 failed, 38 passed). Green: `sc518-r3-jest-green.log`.

## G-S50 against older bundles (before the rebase onto 71437da; product source identical to ed368f6)
- ed368f6 bundle: FAIL (body on Reading montage + stamina, sidebar, Live Preview; focus on the twin's pencil, per-card focus `[false,true]`). `sc518-r3-gs50-ed368f6-bundle.log`.
- 6386a8f bundle (r2 HEAD): FAIL (mouse Save pulled focus onto the pencil and left the hover panel `auto/1`; twin focus on the lower card). `sc518-r3-gs50-6386a8f-bundle.log`.
- HEAD: ok. `sc518-r3-gs50-head.log`; after the rebase with the tall phase: `sc518-r3-gs50-head-rebased-71437da.log` (line includes `scrollTop 2794->2794, card top 163.7->163.7`).
- Not run: the G-S50 tall phase against a base bundle (it would fail on focus; the scroll half is not proven able to fail).

## Gates on 9be397e (logs in this dir, `sc518-r3-gate-*`)
- tsc (incl. e2e) rc 0; lint (incl. e2e) rc 0.
- jest pre-shots: `Tests: 1 skipped, 6148 passed, 6149 total`; `248 passed, 248 of 249` (expected 6127 + 21 new).
- lifecycle part 1 (20 ids): `OBSIDIAN-LIFECYCLE done: 20/20 ok, 0 failed`; part 2 (21 ids incl. G-S42, G-S50): `done: 21/21 ok, 0 failed`. Total 41/41.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 PNGs, 0 FAIL; host-copy pin OK; button host-leak 145 kinds / 870; modal 228; input 15 kinds / 176; checkbox 7 / 116; prose 106 [212] (`sc518-r3-gate-shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`, no rebaseline (`sc518-r3-gate-freeze.log`).
- jest after shots: `Tests: 1 skipped, 6148 passed, 6149 total`, `248 passed, 248 of 249` (`sc518-r3-gate-jest-post-shots.log`).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 (`sc518-r3-gate-parity.log`).

## Process notes
- An earlier lifecycle run on the pre-rebase HEAD was killed by me (by PID in this worktree) when the 71437da rebase request arrived; its `G-S50 FAIL: CDP socket closed` line is from that kill, not a product result.
- Other agents' Obsidian lifecycle processes (other worktrees) were running; I did not touch them.

Drive-by fixes: none.

Follow-ups:
- The tall-note scroll check has no negative control (no mutation that moves scroll); it records numbers and asserts equality within 1 px.
- dse-verify CURRENT block (lifecycle 41, G-S50 and its phases) is landing bookkeeping for the dispatcher.
