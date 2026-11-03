# SC-547 r1 implementation report

## Executive summary
- Verdict: DONE. A pass of the Live Preview twin check now reads each callout window's fences once (per window + alias) and each window's last line once; cost per pass is linear in blocks per callout.
- dse branch `sc547-lp-twin-check-perf`, HEAD `e33992aa` (on develop `367a2f1d`, confirmed unmoved). Superproject branch commit `96853b83` (CHANGELOG bullet); submodule pointer not bumped (landing is the dispatcher's).
- Real Obsidian 1.15.0, 40-counter callout, per editor pass per keystroke (mean of 2 runs): 367a2f1d **6.57 ms** -> HEAD **0.90 ms**; keystroke dispatch 7.79 -> 2.25 ms (pre-SC-537 88cb7db9: 1.20); scroll frame mean/p95 21.3/32.8 -> 18.7/27.1 (pre-SC-537 19.2/28.1).
- Scaling sweep (typing pass mean, ms) 10/20/40/80/160 blocks: 367a2f1d 0.75/2.03/6.57/25.6/timeout(>30 s run); HEAD 0.30/0.50/0.90/1.5/2.8 (quadratic -> linear).
- Tests: +2 (red on 367a2f1d: 80 scans vs 2; mutant "drop the cache" red). Gates: tsc/lint clean; jest 6328 passed / 1 skipped / 252 of 253 (fresh 6327/2); lifecycle 48/48 (21+16+7+4, G-S57 and G-S61 green); e2e 128/128; shots 592, 0 FAIL, button host-leak 161/966; freeze 280/280; parity 0 GAP / 0 undeclared / 24 DECLARED.
- Drive-by fixes: none. Follow-ups: see end.

## Diff summary (dse `367a2f1d..e33992aa`)
`src/framework/host/ReadingModeBlockHost.ts`:
- `windowFences()` (new, ~:248-273): the old body of `locateInSectionLines` (slice window, `listFences`, offset to document lines), memoised in `cache` keyed `lineStart:lineEnd:language`. `locateInSectionLines` takes an optional `fenceCache` and otherwise is unchanged (same `matches`/ordinal/near/'ambiguous' logic over the same, identity-stable, fence objects).
- `PassMemo` + `newPassMemo()` (~:313-328): `{blocks, fences, windowEnds}`. `LivePreviewScope extends PassMemo` (so `scope.blocks` is still there).
- `calloutWindow(..., windowEnds?)` (~:336): the "run of quote lines" end scan (also O(callout lines) per block) is done once per callout start line per pass.
- `fenceOnElement(..., memo?: PassMemo)` (:385/:406, last param was `blocksCache`): passes `memo?.blocks` to `quoteOrdinal` and `memo?.fences` to `locateInSectionLines`. Without a memo, nothing is cached (`remountReused.ts:78`, Reading view paths unchanged).
- `livePreviewCalloutSection` passes `scope.windowEnds`; `reusedBlockBody` passes `scope` as the memo (:687).
`src/framework/host/remountReused.ts`: import `newPassMemo`; the per-pass scope literal uses `...newPassMemo()` (:108) — a fresh memo for every `reconcile`, dropped with the pass. Set of updates that run a pass: untouched. `replaceSource`, LP click path, scroll pin: untouched.
Workspace: `CHANGELOG.md` (worktree root) `## Unreleased` bullet. No ARCHITECTURE/docs text describes per-entry rescans (grepped plugin `docs/`, `AGENTS.md`, root `ARCHITECTURE.md`/`docs/`), so no doc edit. No dse-verify proposal needed (no gate number changed).

## Tests (both in `test/dom/framework/twin-reuse.test.ts`)
1. `SC-547: a pass over a callout of 40 same-alias blocks scans the callout's lines for fences once, not once per block` (in the SC-537 LP describe): two callouts x 40 blocks, `jest.spyOn(anchor, 'listFences')`, one `t.update()` -> exactly 2 scans (2 windows x 1 alias); a second `update()` -> 4 (nothing kept between passes); no card redrawn.
   - RED on 367a2f1d source (`git stash -- src`): `Expected: 2, Received: 80` (`sc547-r1-jest-red1.log`; the behaviour test also fails there because `newPassMemo` does not exist).
   - Mutant (cache lookup in `windowFences` replaced by `undefined`): test 1 red, `Received: 80`; the other 33 tests green (`sc547-r1-jest-mutant1.log`). Source restored afterwards.
   - GREEN on HEAD: `sc547-r1-jest-green2.log` (34/34 in the file).
2. `SC-547: the pass cache changes no answer`: one callout window with identical twins, a second alias and a never-closed last fence; `fenceOnElement` for all 5 DOM blocks with and without a memo gives deep-equal results ([3,7,11,15,null] fence lines; unterminated block null both ways); `memo.fences.size` is 2 (one per alias).
Existing `twin-reuse` (incl. the 6-block `querySelectorAll` once-per-pass test) and `livePreviewScrollHold` suites green.

## Measurement (real Obsidian 1.15.0, scratch copy of the 367a2f1d `visual-harness/obsidian-lifecycle.mjs` + the SC-537 r5 cost probe; OS-assigned CDP port; scripts `sc547-r1-mk547.py`, `sc547-r1-probe547.sh`; load average is the 1/5/15-min `uptime` before each run)
Bundles: 88cb7db9 (pre-SC-537, from r5), 367a2f1d (built from `git archive`), HEAD e33992aa. Each ran twice (a, b), one Obsidian per run. "pass" = time inside `reusedBlockBody` summed per editor pass (probe patch; n/a on 88cb7db9 which has no pass).

cost-big (40-counter callout) — typing: dispatch mean; pass mean/p95/max. cursor: passes, per-pass mean. scroll: passes, per-pass mean; frame mean/p95/max. (a | b)
| bundle | typing dispatch | typing pass mean/p95/max | cursor n / mean | scroll n / mean | scroll frame mean/p95/max | load |
|---|---|---|---|---|---|---|
| 88cb7db9 | 1.13 \| 1.27 | n/a | n/a | n/a | 18.9/26.8/132.5 \| 19.4/29.3/135.1 | 1.50,2.26,3.93 \| 1.25,1.96,3.61 |
| 367a2f1d | 7.77 \| 7.81 | 6.55/7.50/9.50 \| 6.58/7.80/12.80 | 42 / 6.40 \| 42 / 6.62 | 66 / 6.82 \| 66 / 6.70 | 21.6/33.2/141.4 \| 21.0/32.4/138.9 | 1.84,2.24,3.86 \| 1.06,1.82,3.50 |
| HEAD | 2.25 \| 2.24 | 0.91/1.50/2.40 \| 0.88/1.60/1.80 | 42 / 0.84 \| 42 / 0.84 | 66 / 0.97 \| 66 / 0.99 | 18.6/25.7/133.9 \| 18.8/28.4/134.2 | 1.55,2.10,3.73 \| 1.07,1.72,3.39 |

cost-large (125 KB note, block 75 in view): unchanged by the fix, as expected (367a2f1d vs HEAD): typing pass 1.11/0.92 vs 1.04/1.08; cursor 1.77/1.77 vs 1.84/1.91; scroll 1.16/1.24 vs 1.23/1.22; frame mean 22.8/23.1 vs 22.9/25.2 (88cb7db9: 22.7/23.2). So the 40-block callout pass (0.9 ms) is now at the 125 KB note's level (~1 ms).

many-scroll (30 small callouts, 1080 passes): 367a2f1d per-pass mean 2.39/2.37 (p95 6.9, max 32/12.8); HEAD 0.76/0.77 (p95 1.8, max 8.1/24.8). No false remounts (`reused` empty) on any bundle. The harness's scroll-jump "problems" for this case (2-3 jumps per direction, e.g. `[3,800,773]`) appear identically on 88cb7db9, 367a2f1d and HEAD, i.e. pre-existing and unrelated.

Scaling sweep, one callout of N counters, per-pass mean ms (typing / cursor / scroll), frame mean, 2 runs (a | b); the 40 row is cost-big above:
| N | 367a2f1d typing | cursor | scroll | frame mean | HEAD typing | cursor | scroll | frame mean |
|---|---|---|---|---|---|---|---|---|
| 10 | 0.82 \| 0.69 | 0.57 \| 0.57 | 0.62 \| 0.82 | 16.9 \| 17.0 | 0.33 \| 0.27 | 0.37 \| 0.20 | 0.25 \| 0.35 | 16.9 \| 16.9 |
| 20 | 1.94 \| 2.12 | 2.03 \| 1.96 | 1.85 \| 2.36 | 17.9 \| 18.6 | 0.49 \| 0.50 | 0.47 \| 0.41 | 0.55 \| 0.58 | 17.9 \| 17.8 |
| 40 | 6.55 \| 6.58 | 6.40 \| 6.62 | 6.82 \| 6.70 | 21.6 \| 21.0 | 0.91 \| 0.88 | 0.84 \| 0.84 | 0.97 \| 0.99 | 18.6 \| 18.8 |
| 80 | 24.4 \| 26.9 | 23.8 \| 26.2 | 27.2 \| 44.6 | 31.4 \| 51.2 | 1.54 \| 1.47 | 1.92 \| 1.89 | 2.06 \| 1.90 | 21.2 \| 21.1 |
| 160 | run exceeded the harness's 30 s evaluate limit (both runs) | | | | 2.96 \| 2.69 | 4.42 \| 4.42 | 4.76 \| 4.80 | 28.3 \| 27.9 |
Doubling N on 367a2f1d multiplies the pass ~3.3-3.9x (quadratic); on HEAD ~1.7-2x (linear). Load at the sweep runs 1.2-1.4 (1-min), except HEAD run b started at 8.66 (another effort) with no visible effect on its numbers. Raw: `sc547-r1-runs/<run>/r537.json`, `sc547-r1-measurement-summary.txt`.

Interpretation: the ticket's numbers reproduce on 367a2f1d (7.8 ms/keystroke; frames 21-22/33 here vs the ticket's 24.7/41.7 — the ticket figure came from a different session/load). Scroll frames on HEAD are within noise of pre-SC-537 (18.7/27.1 vs 19.2/28.1).

## Gates (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/`, prefix `sc547-r1-gate-`)
- tsc (incl. `-p e2e`): clean, rc 0. lint (incl. `e2e/`): clean, rc 0 (only the known `.eslintignore` warning).
- jest: fresh `Test Suites: 1 skipped, 252 passed, 252 of 253 total; Tests: 2 skipped, 6327 passed, 6329 total`; after the shots run cached `obsidian-app.css`: `Tests: 1 skipped, 6328 passed, 6329 total` (CURRENT 6326 + 2 new).
- lifecycle (four `--only` parts, no private port): `done: 21/21 ok, 0 failed` / `16/16` / `7/7` / `4/4` = 48/48; `G-S57 ok`, `G-S61 ok`.
- e2e: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- shots: 592 files, no FAIL lines, `button host-leak OK (161 button kinds × 3 states ... = 966 comparisons`, `all shots written`. (The tool call hit the 598 s limit and was moved to the background, but the run completed with rc 0; log is complete.)
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0.
Worktree is clean after the gates (no stray files).

## Drive-by fixes:
none.

## Follow-ups:
- The remaining per-pass cost is linear but still nonzero (0.9 ms at 40 blocks, ~2.8 ms at 160): per-entry `getSectionInfo`, `livePreviewCalloutWidget`, `domOrdinal` etc. Not worth a ticket unless callouts of 100+ blocks matter.
- The scratch probe harness (`sc547-r1-mk547.py` + r5's scenario) could become a tracked, opt-in perf probe; the owner ruled no lifecycle perf scenario, so not done.
- `many-scroll` shows 2-3 scroll jumps per direction in the probe on every bundle including pre-SC-537 88cb7db9; looks like a harness/pin artefact (SC-472's area), not caused here.
- The 367a2f1d n=160 case runs past the harness's 30 s evaluate limit, a rough illustration of the quadratic cost (not a regression test).

## Artifacts
Ledger dir (above): `sc547-r1-gate-*.log`, `sc547-r1-jest-{red1,mutant1,green2}.log`, `sc547-r1-measurement-summary.txt`, `sc547-r1-measurement-sweep.txt`, `sc547-r1-runs/<run>/{r537.json,lifecycle.log,uptime-before.txt}`, `sc547-r1-mk547.py`, `sc547-r1-probe547.sh`, `sc547-r1-fix.patch`. Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r1-impl-a1/`.

## r1b rebase
- dse develop moved `367a2f1d` -> `0698550f` (SC-472); `sc547-lp-twin-check-perf` rebased onto it, no conflicts, no package change (no `npm ci`). New dse HEAD **`cb56f128`** (was `e33992aa`).
- Superproject branch rebased onto origin/main `f31c142a`, no CHANGELOG conflict; new superproject HEAD **`04aaaafd`** (was `96853b83`). Submodule pointer not bumped.
- `git range-diff 367a2f1d..e33992aa 0698550f..HEAD`: `1: e33992aa = 1: cb56f128` (identical patch; `sc547-r1b-range-diff.txt`). `git diff 0698550f HEAD`: the same 3 files, +126/-18.
- Gates on `cb56f128` (logs `sc547-r1b-gate-*.log` in the ledger dir):
  - tsc (incl. `-p e2e`) clean, rc 0; lint clean, rc 0.
  - jest: `Test Suites: 1 skipped, 253 passed, 253 of 254 total`, `Tests: 1 skipped, 6380 passed, 6381 total`.
  - lifecycle (five `--only` parts): `done: 21/21 ok` / `16/16 ok` / `7/7 ok` / `4/4 ok` (G-S57 ok, G-S62 ok, G-S61 ok, G-S56 ok) / `1/1 ok` (G-S59 ok) = 49/49, 0 failed.
  - e2e: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
  - shots: 592 files, 0 FAIL, `button host-leak OK (161 button kinds × 3 states ...` (966 comparisons), `all shots written`.
  - freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
  - parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`
- Worktree clean after the gates. No re-measurement (per instruction).
