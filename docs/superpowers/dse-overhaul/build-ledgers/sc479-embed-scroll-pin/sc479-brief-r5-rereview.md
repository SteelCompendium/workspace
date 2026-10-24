# SC-479 r5 brief — scoped re-review (r3 reviewer, resumed)

Final text goes to the ticket-owner. Workers never call the tracker.

Scope: the r4 delta only. Read `sc479-r4-fix-report.md` (executive summary) and the ledger's "Owner rulings on r3 findings" + "r4 DONE" + the r4 follow-up ruling, in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/`.

Worktree `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`: dse `e6b02ca` on develop `c558759` (was 84ba65a on 253aa5f when you reviewed; develop moved through SC-512, SC-510, SC-502 — SC-502 adds a styles-source.css rule for Live Preview code-block clipping + G-S44). Superproject `f6661ad` on origin/main `5902c18`. Do not commit; tree clean at e6b02ca at exit.

Check:
1. `git range-diff 253aa5f..84ba65a c558759..e6b02ca` — the four r2 commits carried unchanged except conflict context; the two r4 commits are the delta. Anything else in SC-479 files is a finding.
2. HIGH-1 fixed as ruled (`.internal-embed { overflow-anchor: none }` under the host pin attribute; scroller keeps anchoring; rule only on host pins; removed on release/TTL/`releaseAll`/unload). Re-run your HIGH-1 shift probes (remove/add a hero, embed above the viewport; 200 px padding above) on e6b02ca: text should move 0 px.
3. LOW-1 header, LOW-2 `waitFor`. G-S42 phase (e): no timed delay decides an outcome; it FAILs with the scroller rule (re-run that control once).
4. **Owner-flagged (r4 follow-up):** reader parked INSIDE a tall embed below the hero list; add a hero and remove a hero; compare on-screen text shift and scrollTop on base (c558759 build) vs head. Head shifting where base did not = finding; base also shifts/jumps = no regression.
5. Gates: tsc/lint, jest (expect 6115 / 1 / 247 of 248), `--only=G-S8,G-S15,G-S18,G-S42` 2x on head, one full lifecycle (expect 40/40 — G-S44 is new from SC-502). e2e/shots/freeze/parity are r4's (124/124 87/87; 592 / 0 FAIL with 114/684; 280/280; 0/0/24) — re-run only with a reason.

Footguns (unchanged): `devbox run -c <dse abs path> -- bash <script file>`; no `cd` in compound commands; `git -C` always; exit codes from inside script files; one blocking foreground gate per Bash call, no `run_in_background`/`Monitor`/detached subshells (a lifecycle over 600 s: split with `--only=` lists); no `rm` with a variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob; no pattern kills, PID-in-your-worktree only; scratch only in `…/scratchpad/sc479-r5-<agentId>/` via the Write tool; never key a wait-loop on a scratch filename or contents.

Report `.../sc479-r5-rereview-report.md`, ≤10-line executive summary first (verdict, findings by severity with file:line, gate numbers, item-4 numbers base vs head). Evidence under `.../sc479-r5-evidence/`. If the write is blocked, return it inline. Final text: raw facts + absolute paths. Need input → STATUS: NEEDS_CONTEXT.
