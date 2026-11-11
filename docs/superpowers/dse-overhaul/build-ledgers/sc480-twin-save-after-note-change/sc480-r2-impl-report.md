# SC-480 r2 implementation report (option E)

## Executive summary
- STATUS DONE. Base ended on dse origin/develop 97a9c93b (rebased twice: f69b8fd6 -> 32441332 -> 97a9c93b; final gates all run on 97a9c93b).
- dse HEAD cb665989 (3 commits: fix+tests be575a52, lifecycle 45c136f2, CHANGELOG cb665989). Superproject branch HEAD 3efbbc13 (CHANGELOG only; draw-steel-elements pointer left dirty for the dispatcher).
- Code: `countByBody` beside `locateByBody`; `twinned()` evaluated only on a card-write pin miss (`!pinned && pin !== null && !pinOnly`); a twin in `pin.text` OR now -> 'miss' -> existing droppedWriteMessage. 1 src file +29/-1 plus a doc-comment line in BlockHost.ts.
- Gates: tsc/lint clean; jest 7060 passed / 2 skipped + 2 SC-568 timeouts (78/78 alone); lifecycle 53/53 (21+16+9+4+3); e2e 249/260 ok, 0 failed, 11 known-bug, 161/161 pairs; styles.css 4295ca33 == clean 97a9c93b build, so shots/freeze/parity carry (skipped).
- Red on base: 10 new/rewritten jest tests red on unpatched source; G-S73 FAILS on a pre-SC-480 bundle (6 of 12 trials), passes on mine (12/12).
- Mutations: m1 m2 m3a m3b m4 m5 each turn >=1 test red.
- Callout probe: the pin is NOT null (RV and LP). Deleted lower twin in one callout -> refused + 1 Notice (base: lands in the twin). Deleted UPPER twin (only a blank `>` line between) -> the pin PLACES on the survivor (line-diff ambiguity, SC-556 known limit), + lands in the survivor, no Notice, same on base.

## Commits (dse, branch sc480-twin-save-after-note-change, on 97a9c93b)
- be575a52 fix(SC-480): countByBody + the twin check in replaceSource; 13 jest tests (2 rewritten into refusals) in test/dom/framework/reading-mode-host-pin.test.ts; BlockHost.ts doc comment.
- 45c136f2 test(SC-480): lifecycle G-S73 (fixtures GS73_BUILD/GS73_TRIALS, scenario after G-S49 before G-S56, header comment 53 scenarios).
- cb665989 docs(SC-480): dse CHANGELOG.md bullet (under 7.0.0, first [FIX]).
Superproject: 3efbbc13 docs(SC-480): CHANGELOG.md `## Unreleased` bullet.
(SHAs before the second rebase: 84c7b8ca, 86604f4d, 75d393af on f69b8fd6.)

## Gate numbers (all on 97a9c93b + commits; logs in the ledger dir)
- tsc: `npm run tsc` rc=0 (sc480-r2-gate-tsc.log). lint: rc=0 (sc480-r2-gate-lint.log).
- jest: `Test Suites: 2 failed, 1 skipped, 258 passed, 260 of 261 total` / `Tests: 2 failed, 2 skipped, 7060 passed, 7064 total` (sc480-r2-gate-jest.log); the 2 failures are SC-568 timeouts (initiative-default-keys, twin-reuse), alone: `Tests: 78 passed, 78 total` (sc480-r2-gate-jest-sc568-alone.log). Baseline 7049 + 13 new = 7062 non-skipped. Fresh worktree reads 2 skipped (owner's 1 skipped is a cached-css count).
- lifecycle (loadavg 3-19): part1 `done: 21/21 ok` 205 s; part2 `16/16` 356 s; part3 `9/9` 401 s; part4 `4/4` 306 s; part5 `G-S59 G-S49 G-S73` `3/3` 209 s (well under 9 min; G-S73 is in part 5 as briefed). Union 53/53. Logs sc480-r2-gate-lifecycle-part{1..5}.log. Earlier full runs on f69b8fd6 (jest, 5 parts all green) kept as *-onf69b8fd6.log; partial on 32441332 in old-base-32441332/.
- e2e: `OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`, rc=0, 363 s (sc480-r2-gate-e2e.log).
- styles.css sha256 4295ca33cd77... mine == clean 97a9c93b build (and == clean f69b8fd6 build). shots/host-leak/clip/freeze/parity: not run, carried.

## Red-on-base evidence
- Jest: sc480-r2-red-on-base-pure.log: unpatched f69b8fd6 source (src stashed) with the new test file: 10 failed / 56 passed. Red: deleted-twin above, below, no-section (body search), k=2 deletion, body-twinned-now, twin-long, the 2 rewritten refusal tests, 2 countByBody (helper absent). Controls pass on base by design (twin-free deletion, twin-free long, no-pin card write, race).
- Lifecycle: sc480-r2-red-on-base-lifecycle-G-S73.log, a pre-SC-480 bundle (f69b8fd6 src for the two host files; the write path is unchanged on 97a9c93b, so the log was not re-run there): `G-S73 FAIL` on the 6 deleted-twin trials (del-above leave, del-below leave, del-below stay, each RV + LP): "a + was written into a block that was never clicked"; the 6 controls pass. Mine: sc480-r2-gate-lifecycle-G-S73-mine.log and part 5: `G-S73 ok (12 trials ...)`.

## Mutation results (pin suite, 66 tests; logs in scratch mut-*.log)
- m1 drop the pin.text count: 1 red (k=2 deletion, twin only in the clicked-note).
- m2 drop the `now` count: 1 red (body appears twice now).
- m3a apply to unpinned writes (twin check with no pin): 4 red (no-pin card write + 3 pin tests that write with no click).
- m3b evaluate the twin check even when the pin places (form Saves / pinned writes with twins refused): 16 red.
- m4 B-style (refuse every pin miss): 2 red (twin-free stale pin, twin-free long).
- m5 never refuse (twinned=false): 8 red.

## Callout probe (ruling: two identical counters inside ONE callout)
Probe harness (scratch, not committed): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r2-implementer/probe/ (out-mine.json/log, out-base.json/log). Fixture: callout with 2 identical counters separated only by a blank `>` line; click one (button.click()); delete it from outside at once; leave or stay.
- Pin at the round's first click: NOT null in Reading view and Live Preview (pendingPin line 5 for the upper, 12 for the lower; ordinal in the callout tells the twins apart).
- Lower block clicked and deleted (x1), RV+LP, leave+stay: base: pin misses, `resolveWriteTarget` lands in the surviving upper block (values [6], no Notice). Mine: refused, note untouched, exactly 1 Notice.
- Upper block clicked and deleted (x0), RV+LP, leave+stay: the pin PLACES on the survivor (the line diff reads the LOWER of two blank-separated twins as deleted, SC-556 known limit), so the + lands in the surviving block with no Notice, on base and on mine. Not an unpinned path; E cannot see it (the pin did not miss). Needs different prose between the twins to be distinguishable.
- So no unpinned case was found for callout twins: the unpinned-card-write path stays unreproduced (0/1041 r1, 0/8 here).

## Drive-by fixes:
- None.

## Follow-ups:
1. Embed with a still-partial pin: a card write flushed before the embed's async `rebasePin` finished has a partial pin (`pinnedTarget` -> null); its `pin.text` is only the embedded part, so E's `now` count still sees an identical block OUTSIDE the section and refuses the write (before E it landed through the section). Window is the rebase latency; r1's emb-twin probes (3 trials x 4) all landed. Not measured under load; owner may want a probe or to treat partial pins as unpinned.
2. Blank-line-only twins (callout probe x0): deleting the upper of two twins separated only by blank lines still writes into the survivor (placed pin). Same known limit as SC-556; inherent to a line diff.
3. dse-verify proposal: sc480-dse-verify-proposal.md (CURRENT block, lifecycle row/part, one footgun). SKILL.md not edited.
4. The r1 survey's "cost" statement (only twin + >400 changed lines refused) also covers my twin-long test; CHANGELOG states it as a limit.
