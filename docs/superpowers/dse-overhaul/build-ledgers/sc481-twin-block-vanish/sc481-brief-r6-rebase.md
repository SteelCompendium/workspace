# SC-481 r6 — rebase onto dse develop 34f46cf + full battery

Implementer for SC-481. Final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md` (bottom entries: r5 result, the 34f46cf move).
- Your r4 report `sc481-r4-fix-report.md` and R3's r5 report `sc481-r5-rereview-report.md` (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin branch `sc481-twin-block-vanish` at `2c5887f` on `4deb8cf`; superproject `3e74be1c`.

## Task
1. `git -C <plugin abs path> fetch origin`; confirm `origin/develop` = `34f46cf` (if it moved further, use the new tip and report it). Rebase the branch onto it. SC-525 touched `src/elements/shared/RefUnwrapView.ts` and `src/framework/view.ts` (adds `ElementView.isUnloaded()`); the SC-481 branch does not touch those files, so no conflict is expected. `npm ci` if `package.json` changed.
2. Superproject: `git -C <worktree> fetch origin`; if `origin/main` moved past the branch's base, rebase the superproject's CHANGELOG commit(s) onto `origin/main`, keeping every other bullet. Do NOT bump the submodule pointer.
2b. Two test-only additions, owner rulings verbatim (ledger 2026-11-01, from R3's `sc481-r5-rereview-report.md`):
   - "LOW-1 (no test pins the callout block-ordinal lookup, ReadingModeBlockHost.ts:325; mutant `ord` passes jest + G-S53 but breaks two-block callout twins in real Obsidian, [6,3,5,3] vs wanted [6,3,6,2]): FOLD into r6 — the jest case R3 prescribes (two identical callouts each holding counters X and Y, adoption on and off); must be red under mutant `ord`."
   - "LOW-2 (jest does not take the adoption path for quote/callout twins, remountReused.ts:77; mutant `vac` caught only by G-S53): FOLD into r6 — assert `claims === 1` in the r4 callout/quote "UPPER one clicked" jest case; must be red under mutant `vac`."
   R3's mutant definitions are in its report and scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r5-review-ab18c95bec20e977d/`. Prove each new assertion red under its mutant (logs `sc481-r6-mut-ord-jest.log`, `sc481-r6-mut-vac-jest.log`), then revert the mutant. Commit the tests. Expected jest then rises above 6199 by however many cases you add — report the exact count.
3. Run the FULL dse-verify battery on the rebased HEAD (src moved underneath, so nothing carries over). Expected: tsc/lint clean · jest **6199 passed (6184 + 15) / 1 skipped / 249 of 250** · lifecycle **42/42** (halves 21+21) · e2e **124/124, 0 known-bug, 87/87** · shots **592, 0 FAIL, host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]** · freeze **280/280** · parity **0/0/24**. Known flakes: SC-506, SC-529, SC-521, the one-off CHR-F02 — re-run once and keep both logs.
4. One probe: SC-525 guards an in-flight reference by its owning view. With twin `ds-` blocks that unwrap a reference (pick one RefUnwrapView-backed block type), click the upper twin while a reference load is in flight if feasible, and confirm the reconcile release (`reused-by-twin`) of a stale view throws no error and the remounted card draws. If no block type makes this practical, say so in one line.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r6-rebase-report.md`, ≤10-line executive summary first (new plugin sha, superproject sha, base shas, gate numbers). Logs `sc481-r6-gate-*.log`.

## Return contract
Raw facts: verdict, shas, gate numbers, probe result, absolute path of every artifact.

## Footguns
Same as `sc481-brief-r4-fix.md` "Footguns" — all apply (foreground gates under 600 s, lifecycle halves, shots may run in background ONLY polling its own unique log/exit file; `devbox run -c <abs>`; `git -C`; no `cd &&`; Write tool for scratch; no variable/glob `rm`; kill only own PIDs; never `rm -rf` shared `/tmp` globs; private scratch `sc481-r6-impl-b2/`; unique `DSE_LIFECYCLE_PORT`; never tag/push; NEEDS_CONTEXT instead of messaging; any message starts `SC-481:`).
