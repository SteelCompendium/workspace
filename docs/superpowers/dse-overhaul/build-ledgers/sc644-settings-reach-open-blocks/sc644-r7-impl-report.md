# SC-644 r7 implementer report

## Executive summary
- r9 (final; supersedes the r7/r7b heads below): dse `fefd9029` (8 commits) on origin/develop `bdf0255e`; superproject `a8f93953` (CHANGELOG `2f6df5b4` + ONE pointer bump) on origin/main `565a35c1`. Range-diff 8/8 `=`, no conflicts. tsc/lint clean; jest 13903 / 1 skipped; lifecycle 64/64; e2e `664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`; styles.css sha256 identical to a clean bdf0255e build -> shots/freeze/parity CARRIED from base (not re-run). Neither origin moved after the work. See the r9 section.
- r7b (comment-only fold, see the r7b section): FINAL heads are dse `76644e80` (8 commits) and superproject `e10f4e5c` (CHANGELOG `76eb31a4` + ONE pointer bump); built main.js sha256 identical before/after; origin/develop `3b47e55b` and origin/main `1c877748` did not move. The r7 gate battery below ran on `2302b561` (the r7b commit changes comments only).
- Verdict: DONE. Rebase only, no product change, no conflicts, nothing pushed. S1 ruling stands (`START_COLLAPSED_REACHES_OPEN_BLOCKS` stays `false`).
- dse head `2302b561` (7 commits, branch `sc644-settings-reach-open-blocks`) on origin/develop `3b47e55b` (unchanged after fetch). Superproject head `427eed31` on origin/main `1c877748`: `76eb31a4` CHANGELOG + ONE pointer bump `427eed31`; `diff --stat origin/main..HEAD` = CHANGELOG.md + draw-steel-elements only.
- Range-diff `10c271fe..2762beb5` vs `3b47e55b..HEAD`: 7/7 commits `=` (identical).
- tsc (incl. `-p e2e`) clean; lint clean. jest 13897 passed / 1 skipped (expected 13897 / 1; the shots cache was already present in the worktree).
- lifecycle 64/64: 21 + 16 + 9 + 4 + 7 + 4 + 3, 0 failed (G-S61 green, no re-run needed).
- e2e `OBSIDIAN-E2E done: 662/669 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` (= expected), first run, no flake.
- shots 592; host-leak 163/978; modal host-leak 40/240; capture clip 147; freeze 280/280; parity 0 GAP / 0 WARN / 24 DECLARED, rc 0 (all = expected).
- Conflicts: none (plugin); superproject: the old pointer commit `7d8ca778` conflicted (submodule) as expected and was skipped, recreated at the end. CHANGELOG commit applied clean.

## Rebase details
- Plugin: `git rebase 3b47e55b`, clean, no conflicted files. Develop's changes to `pipeline.ts` (SC-652) and `hero/view.ts` (SC-662) merged without conflict.
- `package.json` / `package-lock.json` identical between `10c271fe` and `3b47e55b` -> no `npm ci` needed (node_modules reused).
- Superproject: `git rebase --onto origin/main 20004425`; `e0be5a87` became `76eb31a4` (clean; our bullet sits after the SC-643-era bullets, no other bullet changed). `7d8ca778` hit "Failed to merge submodule", skipped; new pointer commit `427eed31` made after the gates, with the final plugin head.
- Old -> new plugin shas: 16e60bc3->0188ef1f, 7f665c74->9a14fa3b, c2448a37->7d2bddb9, f319c409->c74ac553, 8a9a301e->ff33da9c, 59cef7c2->e02a37d5, 2762beb5->2302b561.

## Semantic check
- `knownBug('SC-644'` markers in the rebased tree: ZERO (also no `SC-644` near any knownBug / known-bug in `e2e/`, `src/`, `test/`; the only `SC-644` mentions in e2e are two comments in `settings/live-behavioural.e2e.ts`, lines 29 and 58; the line-58 comment still says "pending Scott's answer", now stale after S1 — see Follow-ups).
- New `dse.setPrefs` callers since `10c271fe` (develop): `e2e/specs/sidebar/pending-saves.e2e.ts` (SC-662; before/after hooks with `{experimental:true}` / `{}` / `{authoringControls:true}`), `e2e/specs/negotiation/outside-edit.e2e.ts` (`before` `setPrefs({}, {experimental:true})`, after `setPrefs({})`), plus the `dropdowns` / `compendium` edits from SC-652-ish work. All ran green in the full e2e under our flush-then-wait-for-disk `setPrefs` (0 failed); none of their behaviour was altered.

## Gates (measured)
| Gate | Result | Expected |
|---|---|---|
| tsc (`tsc --noEmit && tsc --noEmit -p e2e`) | clean, rc 0 | clean |
| lint | clean, rc 0 | clean |
| jest | `Tests: 1 skipped, 13897 passed, 13898 total`; `Test Suites: 1 skipped, 301 passed` | 13897 / 1 |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed | 64/64 |
| e2e | `662/669 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` | same |
| shots | rc 0; 592 PNGs; host-leak 163/978; modal 40/240; clip 147 | same |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` | 280/280 |
| parity | 0 GAP / 0 WARN / 24 DECLARED, rc 0 | 0/0/24 |

Worktree status clean before every gate (`git -C <plugin> status --short` empty; SC-622 appearance.json restore not needed).

## Changes this round
None. No fix commit.

Drive-by fixes: none.

Follow-ups:
- `e2e/specs/settings/live-behavioural.e2e.ts` line 58 comment says "SC-644, pending Scott's answer: ..."; S1 answered it. Stale comment wording only; left alone (rebase-only round, would change a reviewed commit and the range-diff). Owner decides whether to reword.

## Evidence (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc644-r7-impl/)
range-diff.txt, tsc.log, lint.log, jest-fresh.log, lc-{1..7}-a.log (+ .rc), e2e-a.log, shots-a.log, freeze-a.log, parity-a.log (+ .rc files); scripts g-*.sh.

## r7b (comment-only fold; owner ruling on the stale-comment follow-up)
- New dse commit `76644e80` `docs(SC-644): r7b: Start collapsed comments record Scott's ruling; the alternative path is marked untested` (2 files, +7/-4): `src/framework/pipeline.ts` doc comment above `START_COLLAPSED_REACHES_OPEN_BLOCKS` now cites Scott's 2026-11-22 "Go with recommendation", marks `false` as decided and `true` as not chosen and UNTESTED (jsdom and e2e must be added before anyone flips it); `e2e/specs/settings/live-behavioural.e2e.ts:58` reads "SC-644 (Scott, 2026-11-22):". Constant, type and code untouched. Grep of the 9 changed files found no other pending/awaiting-Scott wording.
- `main.js` sha256 (`npm run build` = tsc + esbuild production) before at `2302b561` and after at `76644e80`, both `5d77d566c175c407bbda77c8b914a52c3e424fe82f818c4b584838fd8220e1c3` (identical).
- tsc (incl. `-p e2e`) clean; lint clean; jest `chromeLivePrefs.test.ts` + `heroSheet.test.ts`: 2 suites, 62 tests passed.
- Range-diff `3b47e55b..2302b561` vs `3b47e55b..HEAD`: commits 1-7 identical, 8 new.
- Superproject: pointer commit replaced (soft reset + recommit): `e10f4e5c chore: bump draw-steel-elements to 76644e80 (SC-644)` on `76eb31a4` on origin/main `1c877748`. `diff --stat origin/main..HEAD` = CHANGELOG.md + draw-steel-elements. Both worktrees clean.
- Fetch: origin/develop still `3b47e55b`, workspace origin/main still `1c877748` (neither moved).
- Evidence (same scratch folder): build-before.log/.rc, build-after.log/.rc, mainjs-before.sha, mainjs-after.sha, r7b-tsc.log, r7b-lint.log, r7b-jest.log (+ .rc), g-build-hash.sh, g-r7b-checks.sh.

## r9 (rebase onto bdf0255e / 565a35c1 + re-gate)
- Plugin: `git rebase bdf0255e`, clean, no conflicts; 8 commits kept (1adb54d3, 557c0046, f7301556, 3868994f, e59a11ba, 9a199cc4, 80015f4f, fefd9029). `r9-range-diff.txt` (`3b47e55b..76644e80` vs `bdf0255e..HEAD`): 8/8 `=`. package.json / package-lock.json unchanged 3b47e55b -> bdf0255e: no `npm ci`.
- Superproject: `git rebase --onto origin/main 1c877748`; CHANGELOG commit clean (main's SC-641 bullet kept, ours added; `2f6df5b4`); old pointer commit skipped (submodule conflict) and recreated: `a8f93953 chore: bump draw-steel-elements to fefd9029 (SC-644)`. `diff --stat origin/main..HEAD` = CHANGELOG.md + draw-steel-elements. Both worktrees clean.
- Gates on `fefd9029`: tsc (incl. -p e2e) clean; lint clean; jest `Test Suites: 1 skipped, 301 passed`, `Tests: 1 skipped, 13903 passed, 13904 total` (expected 13903 / 1); lifecycle 21+16+9+4+7+4+3 = 64/64, 0 failed (G-S61 green, no re-run); e2e `OBSIDIAN-E2E done: 664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` (expected; first run, no flake).
- shots / freeze / parity: CARRIED per owner ruling (styles.css identical + range-diff all `=`). styles.css sha256 on rebased head `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; clean bdf0255e build (detached worktree in scratch, `npm ci` + `npm run build`) `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (identical). main.js differs as expected (head `287d5df0526b97820b31ff457dd8b17a6bce2dc84a532e52dd40397bca23236e`, base `93bc0a94521752ffcc37d264ca14473f11939c0de11049451d66b19a06321c9d`). Base worktree removed with `git worktree remove`.
- Final fetch: origin/develop still `bdf0255e`, origin/main still `565a35c1`.
- Evidence (scratch folder): r9-range-diff.txt, r9-tsc.log, r9-lint.log, r9-jest.log, r9-lc-{1..7}-a.log (+ .rc), r9-e2e-a.log, r9-styles-head.sha, r9-styles-base.sha, r9-mainjs-head.sha, r9-base-build.log, r9-base-npmci.log, r9-*.sh.
