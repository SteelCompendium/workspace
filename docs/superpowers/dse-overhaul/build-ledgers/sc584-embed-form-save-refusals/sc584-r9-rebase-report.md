# SC-584 r9 rebase report

**Executive summary**
- STATUS DONE. Rebased onto dse develop **93b3a382** (SC-577). dse HEAD `eaa8742a` (14 commits over 93b3a382), superproject `2e571b09` (unchanged; origin/main moved to `3f91de37`, not rebased: the dispatcher lands).
- One conflict, mechanical: dse `CHANGELOG.md` (SC-577's bullet and SC-584's both sit at the top of Unreleased). Resolved by keeping both, SC-577 first; the later SC-584 CHANGELOG commits applied cleanly. No package or CSS change.
- Range-diff `f2889351..0c7eb1ed` vs `93b3a382..HEAD`: 12 of 14 `=`; the two docs commits (5 and 8, `docs(SC-584)` and `docs(SC-584 r3)`) show `!` only because SC-577's bullet is now context above them. Every code, test and lifecycle commit is `=`. Final CHANGELOG diff vs develop is just the SC-584 bullet.
- Gates on 93b3a382: tsc/lint clean; jest 7177 non-skipped green (full runs hit the SC-568 load timeouts at loadavg 18-32; those suites 78/78 green alone); lifecycle 54/54 (21/16/9/4/4); e2e 258/264 ok, 0 failed, 6 known-bug, 164/164 on the second full run (first run RECOV-R07, load flake); styles.css `5e5ff488…` = clean 93b3a382 build, so shots/freeze/parity carry.
- Proposal refreshed to the final base and numbers.

## Gate lines (93b3a382)
- tsc `TSC_RC=0`; lint `LINT_RC=0`.
- jest run 1: `Test Suites: 1 failed, 1 skipped, 259 passed` · `Tests: 1 failed, 2 skipped, 7176 passed, 7179 total` (initiative-default-keys, SC-568, 59 s at loadavg 18); run 2: `2 failed` (initiative-default-keys, twin-reuse; loadavg 18-32); alone: `initiative-default-keys` 25/25, both suites `Tests: 78 passed, 78 total`. So 7177 non-skipped passed, +71 over the 7106 fresh develop figure (the pin suite is 145, 74 on develop's base; the expected ~7178 was not hit by one test: develop's 7107/1 figure includes the CSS cache).
- lifecycle: p1 `21/21 ok` 187 s · p2 `16/16 ok` 341 s · p3 `9/9 ok` 444 s · p4 `4/4 ok` 313 s · p5 `4/4 ok` 272 s (`G-S59 G-S49 G-S73 G-S77`) = 54/54. Part 5 stays under 480 s.
- e2e run 1: `OBSIDIAN-E2E done: 257/264 ok, 1 failed, 6 known-bug, coverage: 164/164 pairs` (RECOV-R07, SC-517 / SC-570; `--only=RECOV-R07` alone at loadavg 21 also failed: load); run 2: `OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (346 s).
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = clean 93b3a382 build: shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24 carry, not re-run.

## Drive-by fixes:
None.

## Follow-ups:
None new.

## Artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/)
sc584-r9-rebase-report.md, sc584-dse-verify-proposal.md (r9), sc584-r9-gate-{tsc,lint,jest,e2e,styles-sha}.log, sc584-r9-gate-jest-run1-SC568-timeout.log, sc584-r9-gate-jest-run2-SC568-timeouts.log, sc584-r9-gate-jest-initiative-default-keys-alone.log, sc584-r9-gate-jest-SC568-suites-alone.log, sc584-r9-gate-lifecycle-p1..p5.log, sc584-r9-gate-e2e-run1-RECOV-R07.log, sc584-r9-gate-e2e-only.log.
