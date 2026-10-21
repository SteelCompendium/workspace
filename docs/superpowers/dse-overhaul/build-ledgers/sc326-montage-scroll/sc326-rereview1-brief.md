# SC-326 scoped re-review 1 — the round-3 delta only

You are the review-1 reviewer, resumed. Review ONLY the delta `44186fe..c27e5a0` (round 3) plus the round-4 rebase onto dse develop `e31e1a0` (head in `sc326-r4-report.md`; use `git range-diff` and `sc326-r4-range-diff.log` — our lifecycle scenario was renamed G-S12 → G-S13 because SC-460 owns G-S12 on develop; also check the superproject branch: rebased on origin/main, one workspace CHANGELOG bullet committed, pointer bump unstaged) on branch `sc326-montage-scroll` (worktree `/home/scott/code/steelCompendium/worktrees/sc326-montage-scroll/draw-steel-elements`), against your own review-1 findings and the owner's rulings in `sc326-decisions.md` → "Review 1 rulings". Implementer's report: `sc326-r3-report.md` (exec summary first).

1. Verify each FOLDED finding is fixed — MED-1, MED-2, LOW-2, LOW-3, LOW-4 — by re-running your own scratch probes (tally gap, Tab walk 0/75 clipped fine+coarse, G-RV1-shaped lifecycle check), not by reading.
2. Verify the new gate checks can fail: re-apply the pre-fix code for MED-1 and MED-2 separately and confirm the shots gate fails loudly each time; revert byte-clean.
3. Check the delta stayed in scope (no LOW-1 breakpoint change, no adoptView change — SC-467, no pinned column) and that freeze stays byte-identical.
4. Re-run the battery at the r4 head (tsc, lint, jest 5393 passed / 1 skipped / 231 of 232, lifecycle 29/29, e2e 88/92 ok 0 failed 4 known-bug 64/64 pairs, shots 572 0 FAIL, freeze 276/276, parity 0/0/24).
5. Regenerate the Scott-facing pair at the r4 head with the same genuine 12-round fixture: `sc326-rv2-scott-before.png` (base `e31e1a0`) and `sc326-rv2-scott-after-right.png` (r4 head, scrolled fully right; the tally chips must now clear the frame).

All footguns of `sc326-review1-brief.md` §3 apply (private scratch subfolder `sc326-rr1-<suffix>/`, foreground gates to files, PID-only kills, no /tmp-glob rm, no tracker, git -C, no commits). Report `sc326-rereview1-report.md` (≤10-line exec summary, verdict LAND-READY / FIX-ROUND), logs `sc326-rr1-<gate>.log`. Return raw facts + absolute paths of every artifact.
