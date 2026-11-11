# SC-578 r3 fix report

**Executive summary**
- Verdict: DONE. LOW-1, LOW-2 and INFO-2 fixed; INFO-4 dropped as ruled.
- dse branch `sc578-malice-clamped-log` @ `c3fd8323`, rebased onto `origin/develop` `6c7216e8` (SC-573 base; earlier r3 gating on `eaa8742a` was discarded). Superproject CHANGELOG commit `98e7cd14` (a new commit, not merged with main; not rebased onto anything).
- tsc clean, lint clean. jest 7200 passed / 1 skipped / 260 of 261 suites.
- lifecycle 54/54 (21 + 16 + 9 + 4 + 4, part 5 = `G-S59 G-S49 G-S73 G-S77`, all rc 0).
- e2e `OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`.
- shots 592 ok, 0 FAIL, host-leak 163 kinds / 978 comparisons, modal 39 / 234, clip 147; freeze `freeze OK (280/280 ...)`, 0 FAILED; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (last).

## Changes (dse, 3 commits; shas are post-rebase heads in the order fix, test, docs)
- fix: `model.ts` `applyMaliceChange` stores `requested` only when `before + requested < 0` (the pool really stopped at 0); `view.ts` shows the suffix only when `typeof requested === 'number' && requested < amount`; `EncounterData.ts` and `model.ts` comments say each logged entry records what the pool actually did and the -/+ stepper is not logged.
- test: two jsdom rows in `initiative-matrix.test.ts`: a hand-edited `{amount 1, requested 1}` renders `R1: +1 — Same` (and a real capped entry still renders its suffix); a fractional gain (value 0.2 + round_gain 0.1) writes no `requested` key and no "capped" text.
- docs: both CHANGELOGs' SC-577 bullet now says "see the SC-578 entry above"; `docs/initiative-tracker.md` says entries record what the pool really did and the stepper is not logged (log is not a running total). SKILL.md untouched.

Drive-by fixes: none. Follow-ups: none.

Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-impl-r3-a1/` (tsc2.log, lint2.log, jest-full2.log, lc-q1..q5.log, e2e2.log, shots2.log, freeze.log, parity.log).
