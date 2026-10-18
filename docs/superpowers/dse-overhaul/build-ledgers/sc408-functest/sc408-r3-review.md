# SC-408 review R3: scoped re-review of fix round F2 and the rebase

**Executive summary**
1. Verdict: LAND-READY (no HIGH, no MEDIUM). HIGH 0 / MEDIUM 0 / LOW 4 / INFO 4. LOW items are optional hardening; none blocks.
2. Range-diff `be4f002..1a33560` vs `566888a..cc05e7d`: 21/21 pre-rebase commits present, order kept. 19 are `=`; the 2 `!` (commit 1 and commit 18) differ only in `package-lock.json` (and context lines in a `package.json` hunk). Whole-tree non-lock diff is byte-identical (md5 equal, 62 files, +4838/-9).
3. `package-lock.json` `566888a` vs `a066544`: 763 existing packages, 0 changed (version, integrity, flags, all fields), 0 removed; 385 added, all `dev:true`, all reachable only from the 11 e2e devDeps. Root devDeps diff = the 11 e2e deps (+ `@wdio/reporter` pin).
4. Simulated fix (a) (Spend Recovery disabled for `!isHero`): the 3 SC-432 markers flip (e2e INIT-STAM-Q13 "appears fixed"; jest Q13 `.each` x2 pass-while-failing). No-pool hero pins unchanged. 6 plain creature-with-pool matrix tests also go red (see LOW-1).
5. Simulated fix (b) (temp stepper a direct set): the 7 SC-433 markers flip (e2e T03, T04, T10; jest x4). Plain `[STAM-T11]` stays green. Nothing else moved.
6. Battery (DSE `a066544`, superproject `d72c46b`): tsc/lint clean; jest 4720 passed / 1 skipped / 226 of 227; lifecycle 25/25 (port 9308); e2e x3 at `--shards=4` all `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`; shots 572, 0 FAIL; freeze 276/276; parity 0/0/24. All match the author's numbers.
7. Baseline: jest at `566888a` (scratch worktree) = 4498 passed / 4 skipped / 222 of 223 (3 env skips from missing ignored files) = 4501 passed / 1 skipped in a real worktree. The author's "4718" is the rebased pre-F2 head `cc05e7d`, not `566888a` (measured 4715 + 3 env skips = 4718, + 2 F2 cases = 4720). Consistent.
8. `origin/develop` moved again to `e9502a8` (SC-390 pin bump, sdk 3.1.0; touches `package.json`, `package-lock.json`, `src/elements/statblock/*`, CHANGELOG): the branch needs one more rebase before landing (INFO-1).
9. Both worktrees left as found: DSE tree clean, `src/views/StaminaEditModal.ts` sha256 `75cb9385...` before and after every probe; superproject pointer diff identical to the start snapshot.

## 1. Rebase integrity

`git range-diff be4f002..1a33560 566888a..cc05e7d` (saved `.../scratchpad/rangediff.txt`):
- 19 of 21 `=`. Commit 1 (`8c4b37c` to `fca9641`, add devDeps) and commit 18 (`ca2a578` to `cff8255`, skip/only pre-scan etc.) are `!` for `package-lock.json` only. Compared with the lock excluded, both commits' diffs are identical; for commit 1 the only `package.json` difference is hunk context lines (new upstream `gifenc` line above).
- `git diff be4f002 1a33560` vs `git diff 566888a cc05e7d`, both with `:!package-lock.json`: same md5, same stat (62 files, 4838 insertions, 9 deletions).
- Lock check (python, all fields of all 763 pre-existing `packages` entries): 0 changed, 0 removed, 385 added, none non-dev, none unreachable from the e2e roots (`@types/mocha`, `@wdio/{cli,globals,local-runner,mocha-framework,reporter,spec-reporter}`, `expect-webdriverio`, `tsx`, `wdio-obsidian-service`, `webdriverio`). `lockfileVersion` 3 both. Root `devDependencies`: only these 11 added.
- `package.json` scripts: `tsc` adds `tsc --noEmit -p e2e`, `e2e`, `lint` adds `e2e` (as in F1).

## 2. F2 markers: what they assert, and the simulated fixes

All markers assert the ruled behaviour from the ledger ("disable Spend Recovery for creatures"; "make the temp field a direct edit ... Keep 'keep the higher' only for gaining temp from an effect"). Each is pinned by a unique `failsWith` message (e2e) and, in jest, `test.failing` (no message pin, a known jest limit already accepted as I-5).

Simulation (a), `src/views/StaminaEditModal.ts` refresh(): `setDisabled(noneLeft || noGain || !this.isHero)` and `setDisabled(noGain || !this.isHero)`:
- jest: 8 failed / 4712 passed. Markers flipped: `[Q13] ... creature 10/30, no pool` and `... with a tracked pool` (2). Plain tests that went red: 5 of the `[Q06][Q07][Q09][Q10][Q15] Spend Recovery across positions (tracked pool ...)` creature rows (mid one press, mid two presses, mid stops at last Recovery, one short of max, last Recovery that also reaches max) and `[Q16] ... max 3 (floor(3/3) = 1) is the smallest bar where it works`. No hero pin changed (`makeModal` no-pool hero tests, the legacy-block test, ds-hero Q14 all green).
- e2e: `INIT-STAM-Q13 FAIL: known bug SC-432 appears fixed - remove the marker`; `done: 59/71 ok, 1 failed, 11 known-bug, coverage 47/47`. Hero `[STAM-Q13]` (no-pool pin) and Q06/Q08 stayed green.

Simulation (b), `onChange`: `const granted = value;`:
- jest: 4 failed / 4716 passed; exactly the four `[known bug SC-433]` tests flipped (typed lower, minus at 5, 9-then-3, A2 minus after damage).
- e2e: `STAM-T03`, `STAM-T04`, `STAM-T10` each `FAIL: known bug SC-433 appears fixed`; `done: 59/71 ok, 3 failed, 9 known-bug, coverage 47/47`. `[STAM-T11]` stayed `ok`.

Logs: `.../scratchpad/logs/sim-a-jest.log`, `sim-a-e2e.log`, `sim-b-jest.log`, `sim-b-e2e.log`.

## 3. Coverage gate

Three full runs at `--shards=4`, each `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`, exit 0 (the "48 driven" line counts the `(page)` pseudo-control, not in a manifest). From `e2e/.out/coverage.json` and the 12 known-bug ids: 0 pairs are driven only by known-bug tests. Pairs with a known-bug driver and their plain drivers: `sedit.temp.dec x click` -> T11; `sedit.temp.input x type|blur` -> T02, T09; `init.detail.bar x click` -> E10, E21; `init.cell.stamina x dblclick` -> E20; `sedit.spend-recovery x click` has no known-bug driver at all.

## 4. Docs

- dse-verify skill: step 4b and the e2e paragraph say `npm run e2e` is REQUIRED to land ANY `draw-steel-elements` change, quote Scott verbatim ("make it required to land future changes"); CURRENT block numbers all equal the measured ones (jest 4720/1/226 of 227, lifecycle 25/25, e2e 59/71 + 12 known-bug, 47/47, shots 572, freeze 276/276, parity 0/0/24); the 12-ticket list adds up (1+3+2+1+1+1+3).
- PROJECT.md §4: battery order tsc, lint, jest, lifecycle, e2e, shots, freeze, parity last, optional obsidian-shots; "required to land every change" with the quote.
- DSE `AGENTS.md` bullet and `e2e/README.md` top paragraph: "required gate". 
- No contradiction found; the small gaps are LOW-3 and INFO-3.

## 5. Battery (numbers, with logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/logs/`)

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean | `tsc.log` |
| lint (incl. `e2e`) | clean | `lint.log` |
| jest | 4720 passed / 1 skipped / 226 of 227 suites, 3 snapshots | `jest.log` |
| lifecycle (`DSE_LIFECYCLE_PORT=9308`) | `25/25 ok, 0 failed` | `lifecycle.log` |
| e2e x3 `--shards=4` | `59/71 ok, 0 failed, 12 known-bug, coverage 47/47`, x3, exit 0 | `e2e-1.log`..`e2e-3.log` |
| shots | 572 PNGs, 0 FAIL | `shots.log` |
| freeze | `freeze OK (276/276 ...)` | `freeze.log` |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | `parity.log` |
| jest at `566888a` (scratch worktree, removed) | 4498 passed / 4 skipped / 222 of 223 | `jest-base.log` |
| jest at `cc05e7d` (scratch worktree, removed) | 4715 passed / 4 skipped / 226 of 227 | `jest-cc05e7d.log` |

The 4-vs-1 skipped difference in scratch worktrees is environmental (`printTwinDeltaAllowedSet` skips 3 tests without the cached `obsidian-app.css`; `token-coverage` / `migrationCensus` likewise): the same three files give `4 skipped / 32 passed` in the scratch worktree and `1 skipped / 35 passed` in the real one. So the real-tree baselines are `566888a` = 4501 passed / 1 skipped and `cc05e7d` = 4718 passed / 1 skipped.

## Findings

**HIGH:** none. **MEDIUM:** none.

**LOW-1: six plain jest tests assert the behaviour SC-432 rules wrong, with nothing in their titles saying so.**
`test/dom/views/stamina-edit-modal-matrix.test.ts:433-445` (the creature rows of the `[Q06][Q07][Q09][Q10][Q15]` table) and `:490-505` (`[Q16] ... max 3 ... smallest bar where it works`, `isHero: false`). They assert a creature's Spend Recovery is enabled/works. The F2 comment at `:461-464` explains this, but the test titles do not, so a fixer who lands SC-432 sees 6 red plain tests with no ticket in the name. Scenario: simulation (a) above turns exactly these 6 red. Fix: retitle with the same suffix the hero pins got ("[current behaviour — SC-432 will rewrite: a creature cannot spend a Recovery]") or flip the creature rows to `isHero: true`, which keeps their pool/position logic and takes them out of the SC-432 blast radius.

**LOW-2: nothing guards the temp "-" against raising temp until SC-433 lands.**
`e2e/specs/stamina-bar/stamina-modal.e2e.ts:200-211` (`[STAM-T11]`) and the jest SC-433 markers. T11 only asserts "label agrees with the field and nothing is written", and `test.failing` passes on ANY failure. Probe: `onChange` changed to `granted = value < running ? running + 1 : value` (the "-" raises temp by 1; a typed lower value also raises it). Result: T11 `ok`, T04/T03 still `known-bug` (their messages still match), and `npx jest test/dom/views test/dom/elements` 1719/1719 green (60 suites). Fix: in T11 add `expect(shown).toBeLessThanOrEqual(5)` and `toBeGreaterThanOrEqual(0)` (true today and after SC-433); add one plain jest test "temp minus never raises the pending temp" (`pendingTempStaminaChange <= 0` after a minus click at temp 5). Both hold before and after the fix.

**LOW-3: new fixture `Initiative/hurt.md` is missing from the README fixture table.**
`e2e/README.md:94` lists `Initiative/tracker.md` only; F2 added `e2e/vaults/shipped/Initiative/hurt.md` (Ogre #1 20/60, #2 60/60) used by INIT-STAM-Q13. F1's I-3 asked for a fixture-contents table. Fix: add a row.

**LOW-4: the skill's Overview paragraph still lists the battery without e2e.**
`.claude/skills/dse-verify/SKILL.md:10-13` ("type-check, lint, unit tests, the real-Obsidian lifecycle gate, visual shots, a byte-level freeze check, and a CSS/DOM parity check") omits the e2e gate that F2 made required. Fix: add "the real-Obsidian e2e functional gate" after the lifecycle gate. (`DSE .repo-docs/development.md:79` also describes `npm run e2e` without saying "required"; add the same words.)

**INFO-1: `origin/develop` moved again.** `git ls-remote origin develop` = `e9502a8` (SC-390 pin bump: steel-compendium-sdk 3.1.0, `companionFields.ts` shim dropped; touches `package.json`, `package-lock.json`, `src/elements/statblock/{companionFields,view}.ts`, CHANGELOG). The branch is based on `566888a`, so landing needs another rebase. Expect a `package.json`/lock hunk near the sdk line; use the same "take upstream's lock, re-run npm install, confirm 0 changed" check as this round. The skill's CURRENT block says "rebased onto `566888a`"; the landing step must re-point it.

**INFO-2: the author's "4718 = baseline inferred" is the rebased pre-F2 head, not `566888a`.** True `566888a` baseline is 4501 passed / 1 skipped (4498 + 3 env skips). No action; the report text is slightly loose.

**INFO-3: convention text in the skill and `e2e/README.md:105` still says open design questions use `[current behaviour — ruling pending ...]`.** After F2 no test uses that wording; the no-pool hero pins use "[current behaviour — SC-432 will relabel + confirm]". Optional: name that second form in both places.

**INFO-4: the SC-432 markers assume the fix DISABLES the button.** e2e `toBeDisabled` and jest `spendRecoveryBtn(content)!.disabled` match the ruling's "disable". If the fixer instead removes the button, the e2e marker stays "known-bug" (element missing) and the jest `test.failing` stays "passing" via a TypeError, so neither would announce the fix. Acceptable (the ruling says disable); worth one line in SC-432's text.

## Probes reverted

All `src/` probes were applied with a script and reverted with `git checkout -- src/views/StaminaEditModal.ts`; sha256 `75cb938595940bd83b9bd19844a31d8d0c115b30a70f46efa3e8ca90059acc4c` before the first probe and after the last; `git status --short` empty in the DSE worktree at the end. The scratch jest worktree (`/tmp/sc408-r3-base-*`) was removed and pruned (`git worktree list` shows only `sc408-functest`). The superproject pointer diff (`be4f002 -> a066544`, uncommitted) is byte-identical to the snapshot taken at the start. Ignored build output only: `main.js`/`styles.css` rebuilt by the gates, and new run directories under `e2e/.out/` (12-run retention). No Obsidian/chromedriver/Xvfb process of mine remains; no `/tmp/dse-e2e-*` left. Never ran `--headed`.

## Drive-by fixes:
None (review only).

## Follow-ups:
LOW-1 to LOW-4 and INFO-1 (rebase on `e9502a8` before landing) above; the owner decides whether to fold LOW-1/2/3/4 into a short F3 or ship as is.

---

# R3b: scoped re-check of fix round F3 and the rebase onto `e9502a8`

**Summary**
1. Verdict: LAND-READY. HIGH 0 / MEDIUM 0 / LOW 0 / INFO 1.
2. Range-diff `566888a..a066544` vs `e9502a8..7cef081`: 24/24 present; 23 `=`, 1 `!` (commit 1, `package-lock.json` only). Non-lock/non-upstream tree diff md5 identical; `package.json` delta identical (the 11 e2e devDeps + scripts).
3. Lock `e9502a8` vs `713b992`: 763 existing packages, 0 changed, 0 removed; 385 added, all `dev:true`, the identical set to the previous round's additions; sdk `3.1.0`.
4. LOW-1 to LOW-4 and INFO-3 confirmed done. "−"-raises-temp mutation: new jest test FAILS (1 failed / 1719 passed in `test/dom/views` + `test/dom/elements`) and `[STAM-T11]` FAILS (`Expected: <= 5, Received: 6`); T03/T04 stay known-bug. SC-432 simulation re-run: the 8 reds are exactly the 6 retitled tests + the 2 `[Q13]` markers.
5. Gates: tsc clean, lint clean, jest 4721 passed / 1 skipped / 226 of 227, e2e once at `--shards=4`: `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`, exit 0. Worktrees byte-clean.

## Details
- Range-diff output: `.../scratchpad/rangediff2.txt`. Commit 1's lock differs because the lock was regenerated against `e9502a8`; the non-lock content of all 24 is unchanged.
- LOW-1 (`stamina-edit-modal-matrix.test.ts:433-440`, `~495`): suffix `[current behaviour — SC-432 changes this]` is on exactly 5 creature rows + `[Q16] max 3`; the two rows that stay green under the fix (`full: starts disabled`, `zero Recoveries`) are untouched. Simulation (a) re-run on `test/dom`: `8 failed / 3402 passed`, the 8 names = those 6 + `creature 10/30, no pool` + `creature 10/30, with a tracked pool` (the Q13 markers).
- LOW-2: new jest test `the minus button never raises the pending temp, and never takes it below 0` (`stamina-edit-modal.test.ts:~543`), and bounds in T11 (`stamina-modal.e2e.ts:~210`). Both hold today and after SC-433 (a "−" lowering temp by one satisfies `<= 0` / `<= 5` / `>= 0`). Mutation `granted = value < run ? run + 1 : value` fails both; reverted, `StaminaEditModal.ts` sha256 `75cb9385...` unchanged, `git status` empty.
- LOW-3: README row for `Initiative/hurt.md` present. LOW-4: skill Overview lists the e2e gate; `.repo-docs/development.md:79` says "Required to land any change (Scott, SC-408)". INFO-3: README and skill describe `[current behaviour — SC-nnn will ...]` and say the `ruling pending` wording is retired; the only remaining "ruling pending" text is those two retirement sentences. CURRENT block: jest 4721, base `e9502a8`.
- Logs: `.../scratchpad/logs3/{tsc,lint,jest,e2e,mut-jest,mut-e2e,sim-a-jest}.log`.

**INFO-1 (new):** the skill's CURRENT block header (`SKILL.md:~1133`) still reads "after review fix rounds F1 and F2"; it is now F3 as well. Cosmetic; the landing step re-points that block anyway.

State left as found: DSE worktree clean; superproject diff identical to the snapshot taken at the start of R3b (pointer at `713b992`, uncommitted); no processes of mine, no `/tmp/dse-e2e-*`. No `--headed`. Lifecycle, shots, freeze, parity not re-run, per the brief.
