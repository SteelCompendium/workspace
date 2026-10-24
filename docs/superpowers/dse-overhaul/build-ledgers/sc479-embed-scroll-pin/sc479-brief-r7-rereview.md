# SC-479 r7 brief — scoped re-review (r3/r5 reviewer, resumed)

Final text goes to the ticket-owner. Workers never call the tracker.

Scope: the r6 delta only. Read the ledger's "Owner rulings on r5", "r6 DONE" and the r6 follow-up rulings, and `sc479-r6-fix-report.md` (executive summary), in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/`.

Worktree `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`: dse `71437da` on develop `ed368f6` (SC-513 harness-only landed since your r5; plugin bundles byte-identical across it per r6). Superproject `e30728a` on origin/main `d8a109f`. Do not commit; tree clean at 71437da at exit.

Check:
1. `git range-diff c558759..e6b02ca ed368f6..71437da` — earlier commits unchanged; `aabb828` + `71437da` are the delta.
2. MEDIUM-1 fixed as ruled (quote): "apply the embed anchoring stop when (i) a DSE root inside an embed intersects the viewport, OR (ii) no DSE-bearing embed intersects the viewport (reader wholly outside the embeds, e.g. below them); do NOT apply it when the viewport intersects a DSE-bearing embed but none of its DSE roots". Re-run your R5-INSIDE (+150/+500 add/remove), BELOW+100, R3-END ×5 probes on head: INSIDE 0 px, BELOW 0 px, END held. Spot-check the "never downgrades an existing pin" behaviour (a re-pin while one is live).
3. G-S42 phase (f): no timed delay decides an outcome; anti-vacuity; re-run the "embed stop with no geometry gate" control once (must FAIL (f) only).
4. Owner-flagged probe (r6 follow-up): INSIDE geometry on a host whose Obsidian sizer estimate runs under the real height; `vault.process` with no height change and with an added hero; head vs base. Finding only if head is worse than base.
5. Jest: spot-check 2 of the gate-branch mutations (G1-G5 in `sc479-r6-evidence/mutations.txt`).
6. Gates: tsc/lint, jest (expect 6127 / 1 / 247 of 248), `--only=G-S8,G-S15,G-S18,G-S42` 2x on head, full lifecycle once as two `--only` halves (expect 40/40 union). e2e/shots/freeze/parity are r6's — re-run only with a reason.

Footguns (unchanged): `devbox run -c <dse abs path> -- bash <script file>`; no `cd` in compound commands; `git -C` always; exit codes from inside script files; one blocking foreground gate per Bash call, no `run_in_background`/`Monitor`/detached subshells; no `rm` with a variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob; no pattern kills, PID in your worktree only; scratch only in `…/scratchpad/sc479-r7-<agentId>/` via the Write tool; never key a wait-loop on a scratch filename or contents.

Report `.../sc479-r7-rereview-report.md`, ≤10-line executive summary first (verdict, findings by severity with file:line, probe table head vs base, gates). Evidence under `.../sc479-r7-evidence/`. If the write is blocked, return it inline. Final text: raw facts + absolute paths. Need input → STATUS: NEEDS_CONTEXT.
