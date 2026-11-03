# SC-547 r3 fix report

## Executive summary
- Verdict: DONE. MEDIUM-1, LOW-1 and INFO-1 of the r2 review are fixed; `origin/develop` is still `0698550f`, so no rebase.
- dse HEAD **`ea78ebf8`** (on `cb56f128`); superproject HEAD **`1a5386a3`** (CHANGELOG bullet extended by one clause). Submodule pointer not bumped.
- MEDIUM-1: a cached fence list is reused only for the same `lines` array it was read from (`ReadingModeBlockHost.ts:238,256,263`). Real Obsidian `collide` case: cb56f128 shows `Mirror Section B Counter: failed to render (parse)…` with a `reused-by-twin` release; HEAD shows `Mirror Section B Beta`, no such release (2 runs).
- LOW-1: `blocks` is now keyed by quote element and alias (`:316,356-369`): a pass over 2+ blocks of each of two aliases gives `[3,7,11,15,19,null]`, not `[3,7,null,null,…]`.
- INFO-1: tests assert a fresh memo per pass and both window bounds in the key.
- Tests: 4 SC-547 unit tests now (was 1 in that describe; 2 red on cb56f128, the other 2 are guards that go red under mutants). Mutants noidentity, nokeylineend, hoistends, noalias each go red.
- cost-big on HEAD: typing pass 0.95 / 0.96 ms (dev 0698550f 7.43), frame mean/p95 19.3/28.6 (dev 21.7/33.7): no regression.
- Gates: tsc, lint clean; jest 6383 passed / 1 skipped / 253 of 254; lifecycle 49/49 (21+16+7+4+1, G-S57/G-S61/G-S59 ok); e2e 128/128, 89/89. `styles.css` sha256 `93be34af…1174b` is byte-identical to 0698550f's, so shots/freeze/parity carry.

## Fixes (file:line, `src/framework/host/ReadingModeBlockHost.ts`)
- MEDIUM-1: `type WindowFences = {lines, spans}` (:238); `windowFences` hit only when `cached.lines === lines` (:256), stores `{ lines, spans: fences }` (:263); `PassMemo.fences: Map<string, WindowFences>` (:318). `linesOf` returns one array per text, so every host of a normal pass still hits. A comment at the check names the self-embed case. `windowEnds` (:320) needs no key change (only filled from `scope.text`); the field comment says so.
- LOW-1: `quoteOrdinal` cache is `Map<Element, Map<string, readonly Element[]>>` (:356-369), `PassMemo.blocks` retyped (:316). One list read per quote and alias per pass (the existing 6-block `querySelectorAll`-once test still passes).
- Lint caught an untyped `new Map()` in the first version; typed (`Map<string, readonly Element[]>`) and amended into the fix commit.
- Commits: dse `ea78ebf8` (fix + tests); superproject `1a5386a3` ("docs: changelog bullet covers the second-alias check"): the bullet gained "...is unchanged, except that a callout holding two kinds of block (counters and another element, two or more of each) now has both kinds checked, not just the first."

## Tests (`test/dom/framework/twin-reuse.test.ts`, describe "SC-547: the pass cache changes no answer"; the r1 test was rewritten)
1. twins + two blocks of each of two aliases + unterminated last fence, memo vs none, with a once-per-text `linesOf` so the memo really hits: equal, `[3,7,11,15,19,null]`, `memo.fences.size === 2`. The r1 version's 2-alias claim only held because its second alias had one block. RED on cb56f128 (`sc547-r3-jest-red.log`).
2. one memo, two sections of different text with the same window bounds (self-embed vs editor): the second host equals its uncached answer (`name: B`), and differs from the first. RED on cb56f128.
3. memo keys by both bounds: long window then short window from the same first line gives the short window's own answer (3, not 7). Guard.
4. each `newPassMemo()` has its own `blocks`, `fences`, `windowEnds`. Guard.
Green on HEAD: `sc547-r3-jest-green.log` (37/37 in the file).

Mutants (each applied to `ReadingModeBlockHost.ts`, jest on the file, source restored after; `sc547-r3-jest-mut-*.log`):
| mutant | result |
|---|---|
| noidentity: `if (cached) return cached.spans` | 1 failed (test 2) |
| nokeylineend: key `lineStart:language` | 1 failed (test 3) |
| hoistends: module-level `windowEnds` map | 3 failed (test 4 and the two earlier scan-count tests) |
| noalias: block list not selected by alias | 1 failed (test 1) |

## Real Obsidian 1.15.0 (reviewer's harness copied to scratch: `sc547-r3-mk.py`, `sc547-r3-probe.sh`; bundles built from `git archive cb56f128`, `0698550f` and the working tree)
`collide` (fixture of the review; widget texts after the cursor walk and an edit):
- cb56f128: `['A Alpha','B Beta','Mirror Section B Counter: failed to render (parse) Not a YAML token: ```ds-counter at line 1, column 3: > ```ds-counter ^^^…']`, events include `release reused-by-twin Beta=3`.
- HEAD, run a and b: `['A Alpha','B Beta','Mirror Section B Beta']`; the only release is `render-child-unload Alpha=5`; no `reused-by-twin`.
cost-big (40 counters), typing dispatch mean; pass mean/p95; cursor pass mean; scroll pass mean; frame mean/p95; load 1/5/15:
| bundle | dispatch | pass | cursor | scroll | frame | load |
|---|---|---|---|---|---|---|
| 0698550f | 8.83 | 7.43/11.8 | 6.41 | 7.01 | 21.7/33.7 | 3.44,4.81,5.15 |
| HEAD a | 2.36 | 0.95/1.7 | 0.93 | 1.02 | 19.3/28.6 | 1.68,4.69,5.13 |
| HEAD b | 2.48 | 0.96/1.7 | 0.89 | 0.95 | 19.3/28.5 | 2.37,4.69,5.12 |
Mixed-alias callout in real Obsidian: not run; the jest test 1 covers it and no second simple DSE alias fixture was cheap to add.

## Gates on `ea78ebf8` (logs `sc547-r3-gate-*.log`)
- tsc (incl. `-p e2e`): clean, rc 0. lint: clean, rc 0 (after the typed-Map fix).
- jest: `Test Suites: 1 skipped, 253 passed, 253 of 254 total`; `Tests: 1 skipped, 6383 passed, 6384 total` (6380 + 3 net new tests).
- lifecycle: `done: 21/21 ok, 0 failed`; `16/16`; `7/7`; `4/4` (G-S57 ok, G-S62 ok, G-S61 ok, G-S56 ok); `1/1` (G-S59 ok) = 49/49.
- e2e: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- shots / freeze / parity: not re-run. `styles.css` sha256 `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b` equals the bundle built from 0698550f (no CSS or harness-bundle input changed; the diff is three files: `ReadingModeBlockHost.ts`, `remountReused.ts`, the test).
- Worktree clean.

## Drive-by fixes:
none.

## Follow-ups:
- none new. (The many-scroll scroll jumps stay dropped per the owner.)

## Artifacts
Ledger dir: `sc547-r3-gate-{tsc,lint,jest,lc1..lc5,e2e}.log`, `sc547-r3-jest-{red,green}.log`, `sc547-r3-jest-mut-{noidentity,nokeylineend,hoistends,noalias}.log`, `sc547-r3-runs/<run>/{r537.json,lifecycle.log,uptime-before.txt}`, `sc547-r3-mk.py`, `sc547-r3-probe.sh`, `sc547-r3-fix.patch` (cb56f128..HEAD). Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r3-impl-a2/`.
