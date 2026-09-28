# SC-235 round 4 — scoped re-review of the round-3 delta (reviewer, round-2 identity)

Your final text goes to the ticket-owner. **Workers never call the tracker.**

Branch now: dse head `35d3b46` on develop `5a20d5f` (round-1 commits rebased to c4237f5/b73fac0/2b2d3dc; the round-3 delta is `2b2d3dc..35d3b46`); superproject `f0e566a`.

Scope: ONLY the round-6 delta (option B) — `845a491..<r6 head>` range-diff style after any rebase — plus the superproject CHANGELOG commit and `r6/` evidence.
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

## Round 7 override (supersedes the round-4 checklist above where they differ)

Scott chose option B (ledger "Scott rulings"; "Owner rulings, round 6" is the spec). Check:
1. Section title computed 15px / 0.12em (1.8px) / 25.5px line-height on every family; spend
   chip unchanged from base (16px / 1.12px, box 333.03px); only `.dse-section__title` nodes
   change across the census. Exact x0.9375 at text sizes 12–24 and modal text-scale 1.4.
2. Rendered letter height 8px (your round-2 pixel-scan method), matching site.
3. Parity: N DECLARED as reported; each new `section-tag` declaration cites SC-235 with an
   accurate reason; no dead declaration; can-fail proven; compare.test.ts guard + README moved.
4. Wording: no leftover A text (18px / 1.125 / 0.1em / "25% taller") anywhere in the diff or
   touched comments/CHANGELOGs; no "matches the site's size" claim.
5. Narrow: 0 new wraps at 300/240px vs base.
6. Full battery at the final head, as in the brief's gate list (freeze 260/260, lifecycle 19/19,
   shots 532/0, jest base+N).
Report `sc235-r7-rereview-report.md`, scratch `r7-rereview/`.
