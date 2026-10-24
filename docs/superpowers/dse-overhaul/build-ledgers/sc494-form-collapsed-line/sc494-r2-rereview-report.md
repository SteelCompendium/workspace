# SC-494 r2 scoped re-review (reviewer B, agent a4210f3cbe3031b53)

## Executive summary
- VERDICT: LAND-READY. Reviewed dse `7046eb0` on origin/develop `054c9c5` and superproject `827954d` on origin/main `83b800f`.
- No BLOCKER / HIGH / MEDIUM / LOW. Two INFO items, neither needing action.
- Rebase: dse `git range-diff efc17de..13b5df6 054c9c5..48422d9` shows `=` for both r1 commits (`7560ce5`=`ff9316f`, `13b5df6`=`48422d9`). The superproject CHANGELOG commit changed only by the INFO-5 reword.
- LOW-1 closed: the r1 mutant (claim keys the model owns, `FormModal.ts:133`) now fails 2 of 23, exactly the two new `fe34bba` tests. HEAD passes 23/23.
- INFO-6 refactor: one `withReservedKeys` in `src/framework/chrome/collapsedKey.ts:293-306`, called by `pipeline.ts:557-559` and `FormModal.ts:306-308`. It is behaviour-preserving by reading and by measurement. My r1 differential re-run at `7046eb0` covers 388 cases (384 differential + 2 integrity + 2 owned-toggle). It shows 0 field differences from r1 HEAD across 312 pipeline write-back outputs, 384 form outputs, render states and errors.
- Mutant "swap the order inside the shared helper": 3 tests fail (all in formModalCollapseKeys).
- Gates at `7046eb0`, run by me: tsc/lint rc 0 · jest 6026 / 1 / 243 of 244 · e2e 114/114, 0 failed, 0 known-bug, 79/79 · freeze 280/280 (on shots A produced at this tip). Accepted from A on the same tip: lifecycle 36/36 · shots 592, 0 FAIL · parity 0/0/24.

## Findings
- INFO-r2-1, the CHANGELOG (`CHANGELOG.md`, SC-494 bullet, superproject `827954d`): the new sentence is accurate for collapse lines below the body. One rarer case is not described: `collapsed:` written ABOVE `prefs:` moves to just below `prefs:` on a no-edit Save (r1 owner-accepted normalisation). Optional wording: "…except that collapse lines go to the top of the block, just under any `prefs:`." This does not block landing.
- INFO-r2-2, test coverage of the shared order: the helper-swap mutant is caught only by the form tests (`test/dom/authoring/formModalCollapseKeys.test.ts`). No pipeline-side test pins `prefs:` before `collapsed:` on a write-back, and none did before SC-494 either. The form and the pipeline now share one code path, so the form tests guard the pipeline's order too. The 384-case differential also confirms the pipeline output is unchanged. No action needed.

## 1. Rebase
- dse range-diff: `1: 7560ce5 = 1: ff9316f`, `2: 13b5df6 = 2: 48422d9`. New on top: `fe34bba` (test only, +17 lines) and `7046eb0` (refactor of three src files).
- Superproject: `827954d` sits on `83b800f`, and `merge-base --is-ancestor origin/main HEAD` is true. Range-diff vs `0eb4ac5` shows only the two CHANGELOG lines (INFO-5). The pointer is unbumped (` M draw-steel-elements`, which shows `054c9c5..7046eb0`), as at r1.

## 2. LOW-1
New test `fe34bba` (`formModalCollapseKeys.test.ts:208-223`): a `test.each` over stamina-bar and skills. The "Collapse default" toggle opens on; flipping it off and saving writes exactly `['collapse_default: false']`, and the block re-renders expanded. This matches the ruling's wording.
- HEAD: 23 passed / 23.
- Mutant M4c (`extractCollapseKeys(rawData, this.def.chrome !== undefined || claimsLegacyCollapseKeys(this.def))`): 2 failed / 21 passed. The failing tests are the stamina-bar and skills cases of the new test.

## 3. INFO-6 refactor
- Code read: in `withReservedKeys`, the collapse keys wrap innermost and only when something was popped; `prefs:` wraps outermost when `prefOverrides || prefPassthrough`. This is identical to the old pipeline branch, including `prefPassthrough`. The form's old branch was `prefOverrides ? …`; the form never passes `prefPassthrough`, so it is the same. With nothing popped and no prefs, the helper returns `def.serialize` itself, as before. Import direction is unchanged (collapsedKey → prefOverrides already existed), so there is no new import cycle.
- Differential re-run with the r1 probe source (unchanged) at `7046eb0`: `compared 388 cases; with pipelineOut 312; with formOut 384; field differences 0` against r1's `probe-head4.jsonl` + `probe-owned-head.jsonl`. Per-def counts (`analyze-r2head.txt`) are identical to r1. Integrity (two blocks) and the owned-toggle probes pass.
- Helper-swap mutant (prefs innermost, collapse outermost, in `collapsedKey.ts`), run against formModalCollapseKeys + `test/dom/framework` + `test/unit/framework`: 3 failed / 1487 passed. The failing tests are: "prefs: then collapsed: keeps both, in that order"; "`collapsed:` before `prefs:`"; "ds-skills: prefs: then collapsed: then the body, after an edit".

## 4. Gates at 7046eb0
| Gate | Result | Who |
|---|---|---|
| tsc (incl. e2e) | rc 0 | me |
| lint | rc 0 | me |
| jest | rc 0 · `Tests: 1 skipped, 6026 passed, 6027 total` · `243 of 244` suites | me |
| e2e | rc 0 · `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` | me |
| freeze | rc 0 · `freeze OK (280/280 …)`, on the 592 shots written 23:12 local, after the 21:30 `7046eb0` commit | me |
| lifecycle | `36/36 ok, 0 failed` (log 21:38, after the tip commit) | A |
| shots | 592, 0 FAIL (log 23:26) | A |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (log 23:27) | A |

## Tree state
Same as at start: the plugin `git status --porcelain` is empty, and the superproject shows only ` M draw-steel-elements`. The probe test was copied in and deleted by its exact path inside the script. Mutants were reverted with `git checkout --`.

## Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r2-rereview-a4210f3cbe3031b53/`
- mutants: `mutants.log`, `mutant-HEAD.*`, `mutant-M4c-claim-owned.{log,json,diff}`, `mutant-M5-helper-swap.{log,json,diff}`
- differential: `probe-r2head.jsonl`, `probe-r2head.log`, `compare.txt`, `analyze-r2head.txt`, `r1-combined.jsonl`, `compare.py`, `probe.sh`
- gates: `gate-{tsc,lint,jest,e2e,freeze}.{log,rc}`
- r1 baseline used for the comparison: `…/sc494-r1-review-a4210f3cbe3031b53/probe-head4.jsonl`, `probe-owned-head.jsonl`, `zzSc494ReviewProbe.test.ts.txt`
