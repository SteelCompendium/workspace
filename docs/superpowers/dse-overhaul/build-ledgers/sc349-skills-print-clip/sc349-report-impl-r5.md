# SC-349 implementer report, round 5 (rebase onto 7bd8040b)

## Executive summary
- Verdict: DONE. Rebased head `69b5c0d4` (4 commits: `970e3ec9`, `b3cd8dd3`, `cf1c207c`, `69b5c0d4`) on base `origin/develop` `7bd8040b` (still the tip when re-fetched at the end). Conflicts: 0. No package/lockfile change. Not pushed, tree clean.
- Base run (detached scratch worktree at `7bd8040b`, removed afterwards): 592 PNGs, 0 FAIL, `freeze OK (280/280 …)`. Two head runs (both rc 0, 0 FAIL, made at `69b5c0d4` after the rebase): byte-identical (592/592).
- Moving frozen set: exactly the 40 (in both: 40; only r5: none; only old: none). `rebaseline-r5.txt` equals `rebaseline.txt` once both are sorted (true).
- 143 PNGs differ base -> head, the same set as r4 (135 + 8 `feature-rolled*`), none changes size; every other PNG is byte-identical to base.
- All 592 head hashes equal the r4 head (`25abfce2` on `248e202b`) and the r4 base equals the r5 base: SC-520's callout CSS moved no PNG, and its interaction with the un-clip is nil. None of the 40 changed hash, so no crops.
- Gates: tsc/lint clean; jest 6483 / 1 skipped / 257 of 258; lifecycle 52/52 (21+16+9+4+2); e2e 128/128, 89/89; shots 592, 0 FAIL, 161/966; parity 0/0/24.

## Resume note
The round was interrupted by a session limit after the base and both head runs had finished. I verified before reusing them: `r5base.rc`, `r5head1.rc`, `r5head2.rc` all `rc=0`, 592 sha lines each, 0 `FAIL` lines, HEAD `69b5c0d4` (rebase done before the runs, unchanged since), tree clean, no live sc349 process, scratch base worktree gone (`git worktree list` shows one entry). Nothing was re-run for shots. The full battery below was run after the resume, at the same head.

## Gate lines (literal)
- tsc rc 0, lint rc 0 (run earlier in the round at the same head).
- jest: `Test Suites: 1 skipped, 257 passed, 257 of 258 total` / `Tests: 1 skipped, 6483 passed, 6484 total` (after removing `main.js`/`styles.css`).
- Lifecycle `--only` parts: `21/21 ok`, `16/16 ok`, `9/9 ok`, `4/4 ok` (G-S56 last), `2/2 ok` (`G-S59,G-S49`), 0 failed each = union `OBSIDIAN-LIFECYCLE done: 52/52 ok, 0 failed`.
- `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- Shots (head run 2): `capture clip OK (147 screen-media capture(s) whose element reached below the viewport were shot with it grown … 41 print-media capture(s) … NOT covered — named exemption(s): gallery--steel-dark.png (…SC-484); gallery--steel-light.png (…))`; `button host-leak OK (161 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 966 comparisons …`; `montage board scroll OK (14 rounds x 900px pane, … fine/dark: …)`.
- Freeze at head: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`; scratch baseline copy with `rebaseline-r5.txt` applied: `sha256sum -c` rc 0 (280/280).
- Parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`

## Artifacts
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`: this report, `rebaseline-r5.txt` (40; same hashes as `rebaseline.txt`). `rebaseline.txt`, `rebaseline-r4.txt`, `sc349-clipped-list-r4.txt` unchanged and still valid.
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r5/`: `r5base.{log,sha256,rc}`, `r5base-shots/`, `r5head{1,2}.{log,sha256,rc}`, `r5head{1,2}-shots/`, `r5-baseline-applied.sha256`, `r5-analyze.py`, `r5-jest.log`, `r5-lc{1..5}.log`, `r5-e2e.log`, `r5-parity.log`, `r5-tsc.log`, `r5-lint.log`.

Drive-by fixes: none.
Follow-ups: none new.
