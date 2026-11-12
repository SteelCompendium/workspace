# SC-609 r3 fix report

## Executive summary
- STATUS: DONE. origin/develop still `231f2a3b` (no rebase).
- dse HEAD `622b090446e96809f9492e2561c663a4e7a3e6ae` (r3 commits `7b038f45` test, `c326834a` comments, `622b0904` changelog); superproject HEAD `d1ef100f178fe35bd1ef320af68e3aa9cb463a8a` (pointer not bumped).
- M-1: INIT-F14 now blurs to `<body>` and asserts that start state. Mutant (`focusWasInside` removed from the fix condition): F13 ok, F14 FAIL (received `["init.cell.stamina","0-3",true]`). Fix: F13 and F14 ok. Mutant reverted with `git checkout -- view.ts`.
- L-1: view.ts comment and jest F20 title reworded (no forced `focusVisible`; Chromium may still draw the ring after a keyboard session).
- L-2: SC-458 comment line on jest F21 (`<body>` half) and F22.
- I-1: both CHANGELOG entries say Reading view and cite SC-602; dse entry's "Not covered" names SC-615 and SC-614.
- Product code change: comment only (no behaviour change), so lifecycle/shots/freeze/parity not rerun.
- Gates: tsc rc 0, lint rc 0, jest 10716 passed / 1 skipped (shots cache present), INIT-F13/F14 alone 2/2 ok, full e2e 280/284 ok, 0 failed, 4 known-bug, coverage 171/171.

## Logs (dir /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc609-r1-impl/)
r3-e2e-mutant.log, r3-e2e-fix-f13f14.log, r3-tsc.log, r3-lint.log, r3-jest.log, r3-e2e-full.log
