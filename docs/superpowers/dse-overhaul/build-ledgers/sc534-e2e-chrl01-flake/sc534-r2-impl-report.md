# SC-534 r2 implementer report

**Executive summary**
- HEAD `fe44be1d` on branch `sc534-e2e-chrl01-flake`, parent `dabfb518` (= origin/develop; rebase clean; package.json/lock unchanged so no `npm ci`). One commit, one file: `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`, 6 insertions / 29 deletions. Not pushed.
- Proof (probe instrumentation re-applied, session.ts + run.mjs only, reverted; status empty): churn 150 + park 10/10 ok, 0 leaves; CPU x20 + park 5/5, 0 leaves; control NOPARK + churn 150 0/2 (both "timed out waiting for the chrome panel to be revealed by the hover", 52 leaves each).
- tsc (incl. `-p e2e`) rc 0; lint rc 0.
- jest: `Tests: 2 skipped, 6261 passed, 6263 total`, `Test Suites: 1 skipped, 249 passed, 249 of 250` (fresh worktree, no shots cache: equals 6262/1).
- lifecycle: 21/21 + 16/16 + 9/9 = 46/46, 0 failed (port 9297).
- e2e full x2: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` both runs, each preceded by `pointer parked at 0,0 on :200 (outside every window)`. CHR-L01 ok 898 ms / 906 ms.
- sha256 HEAD build == dabfb518 build: yes. main.js `aa4efdf671c9292c01f7f217b66b66447a3ce1b23a0ade217843dce014662fda`, styles.css `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0` (both builds). Shots 592 / freeze 280/280 / parity 0/0/24 carry from dabfb518 (not run, per brief).

## What changed in the spec
- Deleted `waitStable` and `panelRevealed` (the two reveal `waitFor`s keep their inline expression, so deleting was plainer than reusing), and `browser` from the `@wdio/globals` import.
- The :43-48 loop is now `await dse.hover(root.root)` then the existing reveal `waitFor`.
- Comment: one hover must reveal the panel on the first try, no retry; earlier flakes were the shared-Xvfb pointer crossing (SC-539 park), not Live Preview layout. No round references.
- `await dse.click(collapse, { cdp: true })` -> `await dse.click(collapse)`; comment says the default click hit-tests first, so a covered Collapse fails as "element click intercepted".
- All assertions kept: reveal on hover, stays revealed with the pointer on Collapse, collapses after click, cursor line 0 three times, expand after click.
- Diff: `sc534-r2-spec.diff.txt`. Commit message ends without any attribution trailer (user's global CLAUDE.md forbids it).

## Proof batches (CHR-L01 only, `--only=CHR-L01`, HEAD `fe44be1d`)
| Condition | Runs | ok | leaves | per-run ms |
|---|---|---|---|---|
| SC539_CHURN_MS=150, park on | 10 | 10 | 0 | 769-884 |
| SC534_CPU=20, park on | 5 | 5 | 0 | 7275-9584 |
| SC534_NOPARK=1, churn 150 | 2 | 0 | 52 / 52 | fail at 15.6 s |
Churn generator confirmed running on the private display (`SC539-CHURN on: every 150 ms … DISPLAY :200`). Failure bundles for the control copied to `sc534-r2-nopark-bundles/`.

## Scratch
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r2-impl/` (scripts, per-run logs `logs/`, `export-dabfb518/` the dabfb518 export used for the sha build).

## Notes
- Jest log contains several `TypeError: findDriftedTokens ...` stack traces; these are subprocess output of tests that assert on the throw, all suites pass.
- Worktree left with `main.js`/`styles.css` built from HEAD (gitignored); `git status --short` empty.

Drive-by fixes: none.
Follow-ups: none new.
