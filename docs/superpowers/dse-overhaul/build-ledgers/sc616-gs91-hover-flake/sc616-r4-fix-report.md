# SC-616 r4b report (rebase onto 3a5986d3, proposal refresh, battery)

## Executive summary
- STATUS: DONE. Final dse head `1cc54eac` on `3a5986d3` (origin/develop, unchanged after fetch); exactly three commits `54b08986`, `a2797330`, `1cc54eac`; `git range-diff` against the old `87092b17/dad054fc/de60b4c9` shows all three identical; no conflict; the only file changed is `visual-harness/obsidian-lifecycle.mjs`. dse tree clean; superproject only ` M draw-steel-elements` (unstaged pointer).
- tsc + lint clean (rc 0, no output) · jest `Tests: 2 skipped, 11794 passed` (275 suites passed, 1 skipped; no shots cache) · lifecycle 62/62 in 7 parts: 21/21 184 s, 16/16 324 s, 9/9 408 s, 4/4 295 s, 7/7 393 s, 4/4 296 s, 1/1 67 s (G-S97 ok).
- e2e `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (161 s).
- Byte identity: head `main.js` `825bd341adceb4607e96d0ec8a5bdd7b907158d51f8b04d3e5c96e3db3b4fbd7`, `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; build of `git archive 3a5986d3`: identical pair.
- G-S91 alone x3: 3/3 pass (50-51 s); gapEnd (title rv, title lp, apply rv, reopen rv): run1 29/50/24/24, run2 24/45/24/24, run3 25/51/25/25 ms; retries fired: 0 (also 0 in part 5, gapEnd 45/39/24/23).
- Proposal `sc616-dse-verify-proposal.md`: LOW-1 and INFO-6 were already present in the wording r3 asked for (verified); refreshed shas, SKILL line anchors (workspace `b31eb542`: 182 / 493 / 495 / 30), counts, and the CURRENT block draft. SKILL.md not touched.

## Details
- Rebase: `npm ci` not needed (`package.json`/lockfile unchanged between `de60b4c9`'s base and `3a5986d3`).
- Build note: I first ran lifecycle part 1 straight with `node visual-harness/obsidian-lifecycle.mjs` (no explicit build step); `main.js` had been rebuilt at 13:17 (after the rebase) and a later explicit `npm run build-no-check` produced the identical sha256, so every part ran against the correct bundle.
- Devbox auto-backgrounds a foreground call after 180 s; I waited by looping on the run's own fresh `<label>.rc` file (written by the run script after the command, label never reused) in calls under 180 s.
- Proposal edits: header line (workspace sha, branch shas with earlier twins), section anchors (475 -> 493, 477 -> 495), the §1 "Measured" count (0 of 19 natural runs: 15 earlier + 3 alone + 1 part-5 on the final head; 16 alone + 3 part-5), §4 timing data point (all seven parts at r4b), §5 CURRENT block (jest 11794, lifecycle 62/62 seven parts with times, e2e 331/334, hashes, G-S111 free, G-S91 numbers).

## Evidence (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/)
sc616-r4b-tsc.log, sc616-r4b-lint.log, sc616-r4b-jest.log, sc616-r4b-lc1.log ... sc616-r4b-lc7.log, sc616-r4b-e2e.log, sc616-r4b-build.log, sc616-r4b-basebuild.log, sc616-r4b-gs91-1.log, -2.log, -3.log, sc616-r4b-run.sh.txt. Originals and rc/secs files: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r4b-w1/
