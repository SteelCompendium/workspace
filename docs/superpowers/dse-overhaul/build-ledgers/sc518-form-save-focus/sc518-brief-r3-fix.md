# SC-518 r3 brief — fix round (implementer B1, resumed)

## 1. Context loading
- Re-read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/decisions.md` (the "owner rulings on r2" entry is your task) and the review report `sc518-r2-review-report.md` in the same dir (§3 findings, verbatim prescribed fixes; §0 and the evidence logs show how C1 probed, incl. the spliced probe harness `sc518-r2-probe-harness-spliced.mjs.txt` with its `R2-TWIN` and `R2-MCLICK` scenarios).
- Same worktree and branch as r1: `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements`, branch `sc518-form-save-focus`, HEAD `6386a8f` on base `ed368f6`. First `git -C <plugin abs path> fetch origin`; if `origin/develop` has moved past `ed368f6`, rebase onto it and record the new base. Verify `git -C <abs> log --oneline -1` and branch before any write.
- Workers never call the tracker. The main checkout's dse dirt is Scott's live vault — expected.
- Reviewer C1 may still be running its battery in its OWN scratch worktrees under the scratchpad; do not touch those, and never kill its processes.

## 2. The task — the owner's rulings on r2 (quoted from the ledger)
- **MEDIUM-1** "FOLD into r3. Implement C1's prescribed fix (record `opener` in the request; the claim may take focus from its own stale opener when `doc.activeElement === req.opener && !root.contains(req.opener)`), plus a jest case that keeps the old upper root connected in the twin's place, plus a G-S50 twin phase (identical twins, edit the upper one; assert focus is in the edited card, not the twin)."
- **LOW-1** "FOLD into r3. Implement C1's prescribed fix: `formOpenerOf` records `hadFocus` (activeElement === pressed at press time); `armFormFocus` arms only when `hadFocus`. G-S50 phase 2 then asserts focus is where it was before the open and the panel hides when the mouse leaves. Rationale: match pre-SC-509 mouse behaviour (owner spec said "Mouse: match what base did before SC-509")."
  - Check that the hero "Edit definition" opener and the SC-519 pending-write path (`pipeline.ts:527-530`, where the opener is read before the flush) also carry `hadFocus` correctly, so a keyboard open still arms. Update the existing jest mouse case accordingly (mouse open with focus on `<body>` → focus stays on `<body>`, no ring).
- **LOW-2** "FOLD into r3 as a jest case (in-card Increase still in its debounce, keyboard pencil press, field edit, Save, new pencil focused). G-S50 phase for it: not required." The case must fail under C1's mutation M9 (read the opener inside the `openAfterPendingWrite` callback) — verify that.
- **LOW-3** "FOLD into r3 (failed-Save test rebuilds the block afterwards with focus on <body>; assert focus does not move)." The case must fail under mutation M6 (`settleChromeFocus(key, null, true)` always) — verify that.
- Also verify the MEDIUM-1 jest case fails without the stale-opener clause, and the LOW-1 case fails without the `hadFocus` gate.
- Commit each fix with its test (or a red-then-fix pair), messages naming SC-518 r3 and the finding id. Update SC-518 comments at changed sites. Update the CHANGELOG bullet in `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/CHANGELOG.md` only if its wording is now wrong (e.g. it promises mouse behaviour).

Out of scope: INFO-1..4 (dropped), SC-529 (CHR-L01 flake), SC-519/SC-523, Save serialization.

## 3. Gates — full `dse-verify` battery, in its order, on your final HEAD
Expected at dse develop ed368f6: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6130 + your new cases passed / 1 skipped / 248 of 249 suites** (compare after shots) · lifecycle **40/40** (G-S50 with the new twin phase and the revised mouse phase) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 145/870, modal 228, input 15 kinds/176, checkbox 7 kinds/116, prose 106 [212] · freeze **280/280** (no rebaseline — if it moves, STOP) · parity **0/0/24**. Known load flakes: SC-529 (e2e CHR-L01), SC-517 (RECOV-R07), SC-521 (shots montage wheel) — re-run once and report both runs if one fires. Also run `--only=G-S50` against the ed368f6 bundle once and confirm it still fails.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/sc518-r3-fix-report.md`, opening with a ≤10-line executive summary. Evidence files `sc518-r3-*` in the same dir.

## 5. Return contract
Final text to the ticket-owner: STATUS, base sha, every new commit sha (with the finding it addresses), the mutation checks (each must be caught), each gate's measured summary line, `Drive-by fixes:` / `Follow-ups:` — no prose, plus the absolute path of every evidence artifact.

Commit after every coherent step. Do not push. Do not bump the superproject's submodule pointer.

## Footguns (all mandatory — same as r1)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: only your private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc518-r3-fix-<your agentId>/`, uniquely named scripts and logs, written with the Write tool.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to files.
- Every gate is ONE blocking foreground Bash call (timeout up to 600000 ms); lifecycle, e2e and shots are separate calls. No `run_in_background`, no Monitor.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. Record exit codes from a script file run through devbox; read each gate's summary line.
- Every git command: `git -C <absolute path>`.
- No `rm` with a shell-variable or glob target. Never `rm -rf` a shared `/tmp/*` glob or anything under `.superpowers/` except your own `sc518-*` files.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc518-form-save-focus/` or whose `readlink /proc/<pid>/cwd` is inside it.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-518:`.
