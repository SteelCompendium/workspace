# SC-594 r6 final report (implementer aef741ab, resumed)

**Executive summary**
- STATUS: DONE. Rebased onto `origin/develop` = `8b84b635` (SC-598). dse HEAD `da2bdbc6` (15 commits on the base), superproject branch HEAD `6b07b11c` (CHANGELOG only, no pointer bump).
- Rebase: one conflict, `visual-harness/obsidian-lifecycle.mjs` (G-S91 vs G-S92, four hunks). Resolved by taking upstream and re-inserting G-S92's pieces. G-S91 then G-S92 both sit before G-S56, which stays LAST (`grep id:` order: G-S87, G-S91, G-S92, G-S56). The old (j)/(k) commit became empty and was dropped by git; (j) and (k) now live in the first lifecycle commit.
- `git range-diff b5d18f79..c36973e5 8b84b635..HEAD`: every fix and test commit is `=`; the lifecycle commit is `!` (the G-S91 merge plus (j)/(k) folded in); `3105038f` `<` (dropped, folded); two new commits `>` (tag-line test, CHANGELOG). The tree differs from c36973e5 only by upstream's 6 SC-598 files plus the G-S91 harness hunk.
- Docs fixed (MEDIUM-1, LOW-1): both CHANGELOG bullets and the proposal no longer claim the delete / swap shapes with a fresh cache are refused; SC-607 named as a known limit; the "17-44 ms window" framing limited to edits that change the preview's text; the DOM cross-check is stated for heading links only.
- Test (LOW-2): `#Tracker` and `#tag more` lines added to the `atxHeadings` unit test; mZ6 now dies (1 failed). Logged in `sc594-r6-mutants.log`.
- Gates on the rebased HEAD: tsc / lint clean; jest 7671 passed / 2 skipped (7341 + 330, delta +330); lifecycle 58/58 in SIX parts; e2e `272/276 ok, 0 failed, 4 known-bug, 169/169 pairs`; styles.css identical to a clean 8b84b635 build.

## Base and rebase
`git fetch origin`: develop at `8b84b635`; no `package.json` change (`git diff b5d18f79 8b84b635 --stat`: managedModal.ts, three test files, a test helper, the harness), so no `npm ci`. Conflict only in the harness: upstream added G-S91 (header paragraph, `gs91Trial`, scenario) in the same four places my G-S92 added its pieces. Resolution: `git checkout --ours` (upstream), then python inserted my final G-S92 header paragraph, fixture block (incl. j, k), `gs92Trial` (incl. `x-then-y` and `swap`) and scenario (a)-(k) after G-S91 and before G-S56. `node --check` ok; the tree equals c36973e5 plus upstream (`git diff c36973e5 HEAD --stat`: exactly the 6 SC-598 files before my last three commits).
A later comment-only commit fixes the G-S92 header (58 scenarios, its own sixth part); no re-run needed (`node --check`).

## Docs
- dse `CHANGELOG.md` and superproject worktree `CHANGELOG.md`: bullet reworded. Refused: list item / footnote; a counter edited from outside just before the click; a hovered section moved, pasted over or removed from outside just before the click, before Obsidian has re-read the note; a preview not opened from a link hover, already open at load, or (heading links) showing another heading than its link names; two places with a twin body; setext / formatted / colon heading names; whole-note hover edited from outside. Known limit (SC-607, as before): a preview left open after the section it shows was deleted or renamed from outside follows what its link names now, so with two same-named sections and identical counters the click can be saved in the other one. The SC-595 clause was already gone (r4).
- `sc594-dse-verify-proposal.md`: DOM-check bullet (heading links only; two block previews cannot be told apart, a real pointer cannot reach it), 17-44 ms bullet (only for edits that change the part's text; edits that leave it unchanged never redraw, r5), exact refused list, a "Known limit (SC-607)" bullet naming both shapes, G-S92 as its own part 6, CURRENT block with these numbers, the six-part list with measured walls, the own-pid wait recipe.

## Test and mutant
`atxHeadings` unit test input gains `'#Tracker'` and `'#tag more'`; expected line of `### Three` moves 15 -> 17; test title notes "a #tag line is none". mZ6 (`#{1,6}[ \t]*`): `rc=1 Tests: 1 failed, 495 passed, 496 total`. Everything else unchanged: r4's 33 mutants were reproduced by r5 with identical counts and the code is unchanged (all `=` in the range-diff).

## Gates (logs `sc594-r6-gate-*.log` in the ledger dir)
- tsc incl. `tsc -p e2e`: `rc=0`. lint: `rc=0`.
- jest: `Test Suites: 1 skipped, 264 passed, 264 of 265 total` / `Tests: 2 skipped, 7671 passed, 7673 total`. Delta over 8b84b635 (7341): +330 (the new test edits an existing test, no new test).
- lifecycle, six foreground calls (each moved to the background by the tool at 180 s and completed with its notification): part 1 `done: 21/21 ok, 0 failed` 183 s; part 2 `16/16` 322 s; part 3 `9/9` 423 s; part 4 `4/4` 299 s; part 5 `7/7` (G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91) 393 s; part 6 `1/1` (G-S92, 11 trials) 103 s. Union 58/58. G-S91 passed; G-S92's real-mouse hover trials pass with SC-598's modal change.
- e2e: `OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, rc=0, 126 s.
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for my build and for a build with the 8b84b635 versions of the changed `src` files (main.js `2a528ffc…` vs `07bb7ea2…`): identical, so shots / host-leak / freeze / parity carry (not re-run).
- Range-diff: `sc594-r6-range-diff.txt`.

## Commits (dse, on 8b84b635)
`3354263c` fix, `4bbccc52` / `53b47846` / `296b1959` tests, `c849e09c` G-S92 (with (j)/(k)), `f63ac509` CHANGELOG, `1d2ac56c` fix (text placement + DOM), `55e3ddf3` / `124fd418` / `9ddf9a6d` tests, `929898cf` CHANGELOG + setext test, `0e27b1b5` lint fix, `ed247b38` tag-line test, `f21c0da3` CHANGELOG (r6 wording), `da2bdbc6` G-S92 header. Superproject branch: `088a24fb`, `bcdb8848`, `6b07b11c`.

Drive-by fixes: none.

Follow-ups: none new. SC-607 stays the home of the delete / swap limit.
