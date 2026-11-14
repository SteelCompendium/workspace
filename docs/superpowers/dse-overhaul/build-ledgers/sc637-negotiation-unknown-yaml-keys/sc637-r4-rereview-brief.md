# SC-637 r4 — scoped re-review of the r3 rebase (resume of the r2 reviewer)

You reviewed `4e30dcfb` (LAND-READY). r3 (the implementer) rebased it — read
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r3-rebase-report.md`
and the ledger's r2 rulings. Review only the rebase delta, not the whole change again.

1. `git -C <plugin> range-diff 7b9e82cf..4e30dcfb <new base>..<new head>`: the SC-637 commits must be unchanged
   except for conflict resolution. Check every conflict resolution (expected: `e2e/README.md`) keeps both sides.
2. Scenario ids: no `NEGO-*` collision with the new base's ids (SC-440 added `SET-*`); no bracketed ticket id in a title;
   no leftover SC-637 marker.
3. Superproject: `git -C <wt> log --oneline origin/main..HEAD` is exactly CHANGELOG commit + ONE pointer bump, on
   current workspace `origin/main` (fetch first); the gitlink equals the dse head; the CHANGELOG diff vs `origin/main`
   adds only the SC-637 bullet (no other bullet lost).
4. Re-run on the new head: jest (fresh) and full e2e. Expected (base `941b814f` + SC-637): jest fresh **12913 passed / 2 skipped**; e2e **`567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`**. Compare with r3's numbers. Lifecycle only if r3's lifecycle
   shows anything other than 64/64 or the range-diff shows a non-trivial change.
5. `styles.css`: confirm r3's hash claim.

Footguns: as your r2 brief (`sc637-r2-reviewer-brief.md` section 3). Do not commit. Never `rm` anything in /tmp or
the scratchpad. Your old probe worktree `<scratchpad>/sc637-r2-review/dse-probe` stays where it is.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r4-rereview-report.md`,
≤10-line summary first. Final text to the owner: verdict, findings, numbers, paths.
