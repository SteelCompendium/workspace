# SC-602 r4 implementation report (implementer I1)

**Executive summary**
- STATUS: DONE. dse HEAD `711844f3` on origin/develop `d0561a68` (clean rebase). Commits: `344d2fb5` feat, `2a4b4c25` jest, `de34c37a` e2e, `bad99c46` docs (the four r2 commits, rebased) + three fold commits `774e7286` (INFO-4), `e8ac6d85` (LOW-3 + README row), `711844f3` (LOW-1/LOW-2 CHANGELOG).
- Superproject `0594056f` on workspace origin/main `5d4611a3` (fetched again at the end; unchanged). Two commits: `8d0d9b61` entry, `0594056f` fold. CHANGELOG conflict on the first commit resolved by keeping both entries (SC-602 on top). dse pointer bump left UNSTAGED.
- `git range-diff 93e8e48c..2848e7eb d0561a68..HEAD`: commits 1-4 all `=` (identical patches); the three fold commits are new. Output: `r4/range-diff-dse.txt`.
- Gates at d0561a68: tsc (incl. e2e) and lint rc 0 · jest 10784 passed / 2 skipped (10759 + 25; one run) · lifecycle 60/60: 21/21 184 s, 16/16 325 s, 9/9 406 s, 4/4 302 s, 7/7 390 s, 3/3 231 s (see the part-5 note) · e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (144 s) · styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = a clean d0561a68 build (built in a temp worktree, since removed) -> shots/freeze/parity carry (skipped).
- Part-5 note: the first run was 6/7. G-S91 FAILED ("title rv: 700 ms after the second press the preview was gone (second click 37 ms after the opening click)"): a Reading-view hover-preview timing case, no Live Preview root and no carry involved; passes alone (1/1, `...G-S91 ok`, second press 66 ms later) and in the full part-5 re-run (7/7). Both runs logged. The failed run kept `/tmp/dse-obsidian-lifecycle-IxT4w8` (FAIL screenshot); I left it.

## Folds
- LOW-1: the stale "In Live Preview focus is still lost ... (SC-602)" sentences are replaced in dse `CHANGELOG.md` (SC-609, SC-603, SC-588) and workspace `CHANGELOG.md` (same three). SC-609 and SC-588 now read "Since SC-602 this holds in Live Preview too." SC-603 claims only the pool window's Apply (per the owner ruling): "Since SC-602 the pool window's Apply keeps focus in Live Preview too (the Conditions window route there is not covered: it closes when the write lands, SC-384)." The SC-605 / SC-589 draft-loss sentences are untouched.
- LOW-2: SC-602 entry (both CHANGELOGs): "...or on the control that replaced it (else on the element itself), with the keyboard ring when you were using the keyboard. This is done once for every element, not per element." The SC-605 / SC-384 not-covered clause stays.
- LOW-3: `await browser.pause(1000);` after the `dse.settle()` at the listed lines: `focus-live-preview.e2e.ts` 7 sites (INIT-L01..L05, L07 and the L04 first check), `counter-focus-live-preview.e2e.ts` 3 sites (CTR-L01, L03, L05), `callout-writes.e2e.ts` 1 site (CALL-L04); `browser` added to each import. The guard tests (INIT-L06, L08, CTR-L02, L04) were not in the list and are unchanged.
- INFO-4: `claimChromeFocus` skips the `[data-dse-chrome-item]` query when `req.find` is set (`focusHandoff.ts`).
- r2 fold: `e2e/README.md` fixture table row for `Counter/counter.md`.
- Left alone as ruled: INFO-1, 2, 3, 5, 6. `ConditionsModal.ts` and SC-607's files untouched.

## Evidence (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r2-implementer/r4/`)
`tsc.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, `life1.log`..`life6.log` (part 5 = the passing re-run), `life5-run1-G-S91-FAIL.log`, `life5b-G-S91-alone.log`, `old/` (the 93e8e48c-base lifecycle logs), `styles-branch.sha`, `styles-clean.sha`, `clean-build.log`, `range-diff-dse.txt`.

Drive-by fixes: none.

Follow-ups: none new. (G-S91's "title rv" case is timing-sensitive on a 37 ms second click; one flake in two runs, not caused by this change.)
