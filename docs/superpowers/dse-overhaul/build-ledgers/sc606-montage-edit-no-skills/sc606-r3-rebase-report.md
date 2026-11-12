# SC-606 r3 report (rebase onto dse develop 5f7c5336 + review fixes + full battery)

## Executive summary
- Verdict: DONE. Rebased twice (da2bdbc6, then per the course correction onto 5f7c5336); no conflicts, no package.json change. Battery run only on the final head.
- Heads: dse 7866426e (tests d924594c, r1 fix 00a990b5, r3 fix 7866426e) on base 5f7c5336; superproject worktree bf06aa8b (bump commit on top of CHANGELOG d12a014d). Not pushed.
- Fix round: MEDIUM-1 (correctMontageEntry skips remove/add when hero and skill unchanged), LOW-1 (scalar `skills_used: Climb` reads as a one-item list; add/remove/reset handle it, normalizing only when the hero's skills change), LOW-2 (useRealTimers moved to afterEach). 7 new tests (6 model, 1 DOM), all red against the r1 model (7 failed of 197 in the two files).
- tsc 0, lint 0. jest 7708 passed / 1 skipped (= 7685 + 15 + 7 + 1 for the cached obsidian-app.css; fresh-tree form would be 7707 / 2, not measurable here because this worktree's css cache exists from the r1 shots run); after shots 7708 / 1.
- lifecycle 58/58 ok, 0 failed (parts 21/16/9/4/7/1: 185 s, 325 s, 404 s, 301 s, 393 s, 105 s).
- e2e 278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs. shots 592; host-leak 163/978; modal host-leak 39/234; capture clip 147. freeze 280/280, 0 FAILED. parity 0 gaps / 0 undeclared / 24 declared.
- CHANGELOG bullet re-read: its last clause ("your note only gains a skills_used list for a hero once a skill is logged for them") is now true; wording unchanged.

## Notes
- Edge in MEDIUM-1 fix: an edit that keeps hero and skill now never touches the list, so an entry whose skill was never in the hero's list (hand-edited note) is no longer added to it on a note-only edit.
- Reset on a scalar `skills_used` writes [] (same as for a list).
- An earlier full run on da2bdbc6 (all parts green, 58/58 minus part 6 not run, jest 7694/1, no e2e/shots) is kept in on-da2bdbc6/ for reference only; the numbers above are all from the final head.
- A glob mv of my own scratch logs briefly moved a script file; restored, no effect on results.

Drive-by fixes: none.
Follow-ups: none new (SC-610 and addMontageHero stay out of scope).

## Logs (S = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r3-impl)
gate-tsc.log gate-lint.log gate-jest.log gate-lifecycle-part1..6.log gate-e2e.log gate-shots.log gate-freeze.log gate-jest-postshots.log gate-parity.log; fix-round checks: fix-tsc.log fix-lint.log fix-jest.log red-r3.log; da2bdbc6 run: on-da2bdbc6/
