# SC-349 implementer report, round 4 (rebase onto develop after the sanction)

## Executive summary
- Verdict: DONE. Rebased head `25abfce2` (4 commits: `786597ca`, `26184315`, `78573b32`, `25abfce2`) on base `origin/develop` `248e202b`. Conflicts resolved: 0 (clean rebase; SC-490's four-context `montage board scroll OK` gate is intact). Not pushed, tree clean. `package.json`/lockfile unchanged.
- Rebase target moved twice during the round (`d689b719` -> `248e202b`); everything below is from `248e202b`. The earlier `d689b719` base/head runs (same results) are not used.
- Moving frozen set: SAME as the sanctioned 40 (in both: 40; only in r4: none; only in old 40: none). `rebaseline-r4.txt` hashes are byte-identical to `rebaseline.txt` (sorted diff empty). Do not amend the ask.
- Base run at `248e202b`: 592 PNGs, 0 FAIL, `freeze OK (280/280 …)`. Two head runs: byte-identical (592/592), rc 0, 0 FAIL.
- 143 PNGs differ base -> head = the grown/clipped set: the 135 of r1 plus 8 new unfrozen `feature-rolled*` (dark/light) shots, all clipped at row 2400 on the base. Every other PNG (449) is byte-identical to base. No size changes. Of the 12 shots added since `bc4a0c5`, 8 were grown (the `feature-rolled*`), 0 frozen.
- Montage head PNGs vs the r3 head (`e2b17f1`): 32 of 34 byte-identical; `montage-sheet-log--steel-{dark,light}` differ but are identical base vs head here, so the difference comes from develop, not the un-clip (SC-490's sticky column does not change grown captures).
- Gates: tsc/lint clean; jest 6479 / 1 skipped / 257 of 258; lifecycle 51/51 (five parts); e2e 128/128, 89/89 pairs; shots 592, 0 FAIL; parity 0/0/24.

## Conflicts
None. `git rebase origin/develop` applied all 4 commits cleanly onto `248e202b` (upstream touched `visual-harness/shoot.mjs` only in the board-scroll gate, away from `snap()`/the clip gate).

## Screenshot call sites (`visual-harness/shoot.mjs`)
- `:690` `page.screenshot({ fullPage: true })` (gallery and `opts.fullPage` shots) — covered by `snap()` growth + shot-time check; the gallery is the named exemption `CLIP_EXEMPTIONS` (SC-484).
- `:691` `page.locator('#mount').screenshot` — covered (growth + shot-time rect check).
- `:2366` `page.screenshot()` inside the chrome-placement gate (pixel read for border occlusion, nothing written) — not applicable. No other `screenshot(` call site; other contexts (`:974`, `:1203`, 1000x2400 gate contexts) take no PNG.

## Frozen set and hashes
- FAILED at head vs the shared 280-line baseline: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`; names == the 40 of `rebaseline.txt`.
- `rebaseline-r4.txt` (40 lines, baseline format) written; scratch baseline copy with it applied: `sha256sum -c` rc 0 (280/280).
- Shots added since `bc4a0c5` (12): `feature-rolled*` x8 grown, unfrozen, 4 others short. No new frozen mover, so no `sc349-r4-*` crops were needed.

## Gate lines (literal, head run 2)
- `capture clip OK (147 screen-media capture(s) whose element reached below the viewport were shot with it grown to cover them and then restored; 41 print-media capture(s) were grown the same way as a precaution — print media is never clipped, their bytes do not move; … NOT covered — named exemption(s): gallery--steel-dark.png (…SC-484); gallery--steel-light.png (…))`
- `montage board scroll OK (14 rounds x 900px pane, genuine probe-rounds-14 source — fine/dark: 1359px grid in a 690px frame, 96 cells reachable, 6 pinned cells at the frame's left edge …`
- `button host-leak OK (161 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 966 comparisons …`; `print-twin delta OK (144 capture ids … max vertical drift 2.00px (< 24p…`; all other in-run gate lines present (log `r4chead2.log`).
- tsc rc 0; lint rc 0; jest `Test Suites: 1 skipped, 257 passed, 257 of 258 total` / `Tests: 1 skipped, 6479 passed, 6480 total`.
- Lifecycle parts: 21/21, 16/16, 9/9, 4/4 (G-S56 last), 1/1 (G-S59) = `OBSIDIAN-LIFECYCLE done: 51/51 ok, 0 failed` as the union.
- `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- Parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`

## Notes
- A first jest run at the earlier base failed 2 `fixtures.test.ts` gallery-roll tests while a stale `main.js` was on disk; after removing `main.js`/`styles.css` (dse-verify protocol) it passed. All reported jest numbers are from clean runs.
- The detached base worktrees were removed with `git worktree remove --force <literal path>`; `git worktree list` shows only the effort worktree.

## Artifacts
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`: this report, `rebaseline-r4.txt` (40), `sc349-clipped-list-r4.txt` (143); `rebaseline.txt` and `rebaseline-skills-only.txt` untouched.
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r4/`: `r4bbase.{log,sha256,rc}` + `r4bbase-shots/` (base 248e202b), `r4chead{1,2}.{log,sha256,rc}` + `r4chead{1,2}-shots/` (head), `r4c-baseline-applied.sha256`, `r4c-sets.json`, `r4c-analyze.py`, `r4c-jest.log`, `r4c-lc{1..5}.log`, `r4c-e2e.log`, `r4c-parity.log`, `r4b-tsc.log`, `r4b-lint.log`. (`r4base*`/`r4head*` files are the abandoned `d689b719` round.)

Drive-by fixes: none.
Follow-ups: none new.
