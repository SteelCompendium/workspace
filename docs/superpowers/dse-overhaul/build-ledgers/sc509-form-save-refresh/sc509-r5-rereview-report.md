# SC-509 r5: scoped re-review of round 4 (reviewer C)

## Executive summary
- **Verdict: LAND-READY.** dse HEAD 85119e8 on 38f94f4; superproject a32bfa8 on 2bb85df. No new findings.
- (1) The range-diff `7046eb0..a426882` vs `38f94f4..HEAD` shows the first 3 commits as `=` (c3cac7d, 80cd647, 4832950); 85119e8 is the only new commit (test-only, `obsidian-lifecycle.mjs`, +8/-1).
- (2) The new assertions catch real damage. Mutant mutR makes a form Save also drop the `BELOW` line: G-S40 now FAILs with "the note differs from the fixture beyond the edited value". Mutant mutS makes a sidebar form Save also add a line outside the block: G-S40 FAILs with "the note differs from the pinned note beyond the edited value". The pre-LOW-2 harness (4832950) **passes** both mutants, which proves the new lines do the catching.
- (3) G-S40 on HEAD in the review worktree: `ok`, 3 runs out of 3 (`npm run obsidian-lifecycle -- --only=G-S40`, then 2 repeats). I did not run the full 37 scenarios (it takes about 540 s); B's log reads 37/37.
- (4) dse `git status --porcelain` is empty, and the full status including ignored files matches what it was before. The superproject shows only ` M draw-steel-elements`, the same before and after: that is the submodule pointer, which landing bumps.
- B's logs spot-checked: tsc/lint clean (I re-ran both on 85119e8: rc 0) · jest `6033 passed / 1 skipped / 244 of 245` ×2 · lifecycle `37/37` · e2e `114/114 … coverage: 82/82 pairs` · shots rc 0, 592 PNGs, 0 FAIL lines, 113/678 and the modal host-leak lines · freeze `280/280` · parity `0/0/24`. Every log is timestamped after the rebase finished (01:08:25).

## (1) Range-diff
```
1:  dac643f = 1:  c3cac7d test(SC-509): red tests …
2:  731f3e1 = 2:  80cd647 fix(SC-509): …
3:  a426882 = 3:  4832950 test(SC-509): lifecycle G-S40 …
-:  ------- > 4:  85119e8 test(SC-509): G-S40 asserts the whole note outside the edited value …
```
Superproject: a32bfa8 (CHANGELOG, +6) on origin/main 2bb85df.

## (2) The 85119e8 assertions
- Reading phase (`obsidian-lifecycle.mjs:2510`, `:2520`): `t.read(rel) === FIXTURES[rel].replace(swap[0], swap[1])`. `swap` is the raw-box pair, or `current_stamina: 15` → `7` for the typed field. Each `swap[0]` occurs exactly once in its fixture. Could it pass vacuously? No. If `swap[0]` were missing, `replace` would change nothing and the check would demand an unchanged note, which the `waitDisk(swap[1])` just before it rules out. So a broken check fails instead of passing.
- Sidebar phase: `:2561-2562` checks that the pin changed only the anchor line (the note minus `_dse_anchor:` equals the fixture). `:2575` checks that after Save the note equals the pinned note with only `title:` changed, so the anchor line, ABOVE/BELOW and the fences must all survive.
- Mutants were built in a scratch worktree at 85119e8, which has since been removed. Patches are in `sc509-r5-build-mutants.sh.txt`. Each changes only writes that are not from the view, so the redraw, claims and root assertions still pass, and only the note-content check can catch them:

| Bundle | HEAD harness (85119e8) | Pre-LOW-2 harness (4832950) |
|---|---|---|
| mutR: `ReadingModeBlockHost` drops `\nBELOW\n` | **FAIL** `montage: the note differs from the fixture beyond the edited value: "# form save montage\n\nABOVE\n\n```ds-montage\ntitle: Other Job\n```\n\n"` | ok (blind) |
| mutS: `SidebarBlockHost` appends `STRAY R5MUT` after the block | **FAIL** `sidebar: the note differs from the pinned note beyond the edited value: "…BELOW\nSTRAY R5MUT\n"` (the Reading phase passed first) | ok (blind) |

## (3) G-S40 on HEAD (review worktree, port 9354)
`OBSIDIAN-LIFECYCLE G-S40 ok (… montage …; counter …; stamina bar …; control: in-card Increase adopted the same root, one claim; sidebar …; claims did not move for a form write; no Notice, no page error)`, 3 runs out of 3.

## (4) Tree state
- dse: porcelain is empty before and after; the `--ignored` listing is identical.
- Superproject: ` M draw-steel-elements` before and after (the unbumped pointer).
- Scratch worktree removed; `worktree list` shows only the review worktree.
- Both FAIL temp dirs were removed by their literal paths after their screenshots were copied.

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/)
- `sc509-r5-rereview-report.md`
- Mutants: `sc509-r5-build-mutants.sh.txt`, `sc509-r5-gs40-new-mutR.log`, `sc509-r5-gs40-old-mutR.log`, `sc509-r5-gs40-new-mutS.log`, `sc509-r5-gs40-old-mutS.log`, `sc509-r5-gs40-mutR-FAIL.png`, `sc509-r5-gs40-mutS-FAIL.png`
- HEAD: `sc509-r5-gs40-head.log`, `sc509-r5-gs40-head-rep2.log`, `sc509-r5-gs40-head-rep3.log`, `sc509-r5-tsc.log`, `sc509-r5-lint.log`
