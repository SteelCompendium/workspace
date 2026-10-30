# SC-518 r4 brief — scoped re-review of the r3 fix delta (reviewer C1, resumed)

## 1. Context
- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/decisions.md` ("owner rulings on r2" = what r3 had to do), the r3 brief `sc518-brief-r3-fix.md`, and the implementer's report `sc518-r3-fix-report.md`, same dir.
- Review tree `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements` — do not edit it; probe in your own scratch worktrees as in r2 (`.../scratchpad/sc518-r2-review-C1/` or a new `sc518-r4-rereview-<agentId>/`), removed with `git worktree remove` at the end.
- Workers never call the tracker.

## 2. Task — the delta only, not a fresh full pass
- The branch was rebased: plugin HEAD `9be397e` on base `71437da`. The r1 commits you reviewed (`958932e 88ced3f 6386a8f` on ed368f6) are now `4e8d1a4 49c7ccf ace522b`; run `git -C <plugin> range-diff ed368f6..6386a8f 71437da..ace522b` and confirm they are equivalent apart from the G-S42/G-S50 harness conflict resolution. The r3 delta to review is `ace522b..9be397e` (`61f0956` tests, `17553f7` fix MEDIUM-1 + LOW-1, `1260447` G-S50 twin + mouse phases, `9be397e` G-S50 tall-note phase), plus superproject CHANGELOG `259ff49`.
- Confirm each of MEDIUM-1, LOW-1, LOW-2, LOW-3 is fixed as ruled: re-run your `R2-TWIN` (edit the upper twin → focus in the edited card, ring) and `R2-MCLICK` (mouse open with focus on `<body>` → stays `<body>`, panel hides; same for Save and Cancel) probes on the new HEAD in real Obsidian; re-apply mutations M6 and M9 and confirm the new tests catch them; confirm keyboard opens (Reading, sidebar, Live Preview, hero, the pending-write path) still restore focus with the ring.
- The branch was rebased from ed368f6 onto 71437da (SC-479 changed the Reading-view scroll pin `previewScrollPin.ts` and added lifecycle G-S42). Re-run your tall-note scroll probe on the new HEAD: a keyboard Save must leave scrollTop and the card's top unchanged while focus lands on the new pencil. Expected lifecycle 41/41 (run as two `--only` halves; the full run is ~14 min).
- Check the delta introduces nothing new (new findings by severity with file:line).
- Spot-check the implementer's gate logs are from the final HEAD; re-run tsc, lint, jest and `--only=G-S50` yourself. The full battery need not be re-run unless the delta touches more than the focus hand-off, FormModal, pipeline opener plumbing, tests and the lifecycle harness.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/sc518-r4-rereview-report.md`, ≤10-line executive summary first (LAND-READY or not). Evidence `sc518-r4-*` in the same dir.

## 4. Return contract
Final text to the ticket-owner: verdict, reviewed sha + base, per-finding confirmation, new findings, gate lines, evidence paths. No prose.

## Footguns — identical to your r2 brief (`sc518-brief-r2-review.md` "Footguns"); all still apply.
