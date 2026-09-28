# SC-235 round 4 — scoped re-review of the round-3 delta (reviewer, round-2 identity)

Your final text goes to the ticket-owner. **Workers never call the tracker.**

Branch now: dse head `35d3b46` on develop `5a20d5f` (round-1 commits rebased to c4237f5/b73fac0/2b2d3dc; the round-3 delta is `2b2d3dc..35d3b46`); superproject `f0e566a`.

Scope: ONLY the round-3 delta — `git log 43b76cc..<r3 head>` in the DSE clone (after any
rebase, diff the SC-235 commits range-diff style) plus the superproject CHANGELOG commit —
and the rebuilt evidence in `r3-evidence/`. Read `decisions.md` ("Owner rulings, round 2") and
`sc235-r3-fix-report.md` (exec summary first).

Check:
1. HIGH-1: no remaining claim that the plugin "matches the site's size" anywhere in the diff
   (grep both repos' changed files); wording says computed values match and letters render
   ~2px/25% taller because the site fakes small caps.
2. MED-1: spend chip computed font-size / letter-spacing / box width equal base (the develop sha the branch sits on)
   (re-measure; base width 333px).
3. MED-2: open every composite; verify 1 image px = 1 CSS px per cell, that each column's
   claimed size is real (re-measure at least one cell per column, especially the B probe),
   and that the letter-height captions match your round-2 pixel scans (site 8 / today 9 / A 10
   / B 8). Labels are text, not colour.
4. LOW-1 comment present and accurate.
5. Narrow table incl. the B column: re-run the wrap reconstruction for A and B at 300/240px.
6. Gates at the final head (foreground, files): tsc/lint clean; jest = base at afd6ae3 + added (re-measure base); lifecycle
   19/19; shots 532/0; freeze 260/260; parity 0/0/10 DECLARED.

Process: devbox `bash -c` wrappers with output to files, never pipe gates into tail; never
background/Monitor-wait; never key waits on scratch filenames; never pkill/killall by pattern
(kill only PIDs whose command line contains `worktrees/sc235-section-title-scale/`); you do not
commit; scratch only in `r4-rereview/`. You cannot SendMessage me — end with STATUS:
NEEDS_CONTEXT if needed (first word `SC-235:` if you ever message). If the report write is
blocked, return it inline.

Report `sc235-r4-rereview-report.md`, ≤10-line executive summary (verdict LAND-READY-AS-PROPOSAL
/ FIX-FIRST, counts by severity), findings with file:line + prescribed fix. Final text: raw
facts + absolute artifact paths.
