# SC-326 r4 report — rebase onto dse develop e31e1a0 + full battery

## Executive summary
- STATUS: DONE. dse branch `sc326-montage-scroll` head **`c8880db`**, rebased onto `origin/develop` **`e31e1a0`** (fetched immediately before the battery; the base moved 3480231 -> c03db7a -> e31e1a0 during the round, the battery ran once, on e31e1a0).
- Conflicts: only `CHANGELOG.md` (both bullets kept) and `visual-harness/obsidian-lifecycle.mjs` (SC-460's `G-S12` kept verbatim; ours renamed `G-S13`). `styles-source.css`, package files: no conflict, `package.json` unchanged (no `npm ci`).
- Remaining `G-S12` hits in the plugin: only SC-460's two (`obsidian-lifecycle.mjs:38` header line, `:1607` `id: 'G-S12'`). Our scenario is `G-S13` (id, header, `view.ts` comment, `montage.test.ts` comment). `git diff origin/develop HEAD -- obsidian-lifecycle.mjs` has 0 removed lines, so every develop scenario (G-S8 incl.) is untouched.
- Battery at `c8880db`: tsc/lint clean; jest 5393 passed / 1 skipped / 231 of 232; lifecycle 29/29; e2e 88/92 ok, 0 failed, 4 known-bug, 64/64; shots 572, 0 FAIL, `montage board scroll OK`; freeze 276/276; parity 0/0/24. All 572 shot PNGs are still sha256-identical to the original base `188755b` run.
- Superproject branch head **`139cfd8`** (on `origin/main` `2d4ece3`): one commit, `CHANGELOG.md` only (SC-326 bullet added at the top of `## Unreleased`, the SC-474 / SC-468 / SC-460 bullets kept). `git status --short`: ` M draw-steel-elements` (pointer bump left unstaged for landing).
- Range-diff (`188755b..c27e5a0` vs `origin/develop..HEAD`): commits 1-2 `=`; 3-5 `!` with nothing but context shifts from the merged CHANGELOG / lifecycle header, plus the `G-S12` -> `G-S13` rename. No content change otherwise.

## Rebase details
- The first rebase (onto 3480231) stopped on the CHANGELOG (commit 3) and on `obsidian-lifecycle.mjs` (commits 4 and 5, where develop's G-S12 sat next to ours); resolved as above. The later rebases (onto c03db7a, then e31e1a0) were clean.
- Foreign processes: the dispatcher's earlier message said the reviewer had been resumed; I saw two `tsc` processes that were not mine (PIDs 1275835, then 1275834 `tsc --noEmit -p e2e`) before the rebase finished, stopped there and reported it; after the go-ahead `pgrep -af "worktrees/sc326-montage-scroll/"` was empty before every gate and nothing foreign appeared during the battery. One earlier shots run of mine (devbox 1297422 / node 1297562) was started on the 3480231 base and stopped by me (own PIDs only) when the base moved again; its output was discarded.
- Commit messages of the r2/r3 commits still say "G-S12" in their text (history was not reworded; the content says G-S13).

## Battery at `c8880db` (logs `sc326-r4-<gate>.log`)
| gate | result |
|---|---|
| tsc (incl. `-p e2e`) / lint | clean / clean |
| jest (`rm -f main.js styles.css` first) | `Tests: 1 skipped, 5393 passed, 5394 total`; `Test Suites: 1 skipped, 231 passed, 231 of 232 total` |
| lifecycle (port 9286) | `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed` (G-S12 SC-460's and G-S13 ours both ok) |
| e2e | `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` |
| shots | 572 PNGs, 0 FAIL; `montage board scroll OK (14 rounds x 900px pane, genuine probe-rounds-14 source — fine: 1359px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; coarse: 2255px grid in a 690px frame, 96 cells reachable, 85 Tab stops all fully visible; …)` |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |
Gates were run as separate calls with `devbox run -c <plugin> -- …` (no `cd`, logs to a fresh scratch folder, no glob deletes); shots in the background, polled by file content.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/`)
`sc326-r4-report.md`, `sc326-r4-range-diff.log`, `sc326-r4-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`.
