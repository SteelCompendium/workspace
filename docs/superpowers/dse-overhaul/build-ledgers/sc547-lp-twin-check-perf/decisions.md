# SC-547 decisions ledger — LP twin check perf (callout with many blocks)

Effort: sc547-lp-twin-check-perf · worktree /home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf
(dse branch sc547-lp-twin-check-perf cut from develop 367a2f1d, 2026-11-02).
Owner: ticket-owner (Opus 5.5), posts with --model opus-5.5.

## Ticket (SC-547, Backlog at start)
SC-537 makes DSE check identical callouts after every edit, scroll and cursor move in Live Preview.
For each block, the check rescans every line of the callout the block sits in, so cost grows with
the square of the number of blocks in one callout. Measured (SC-537 r5, real Obsidian 1.15.0):
40-block callout 7.8 ms per keystroke for the check; scroll frame 24.7 ms avg / 41.7 ms p95 vs
19.7 / 29.6 before SC-537. Fix idea: build each callout's list of fences once per pass, not once
per block (ReadingModeBlockHost.ts, around locateInSectionLines / fenceOnElement).

## Dispatcher instructions (2026-11-02, verbatim excerpts)
- "Measure before and after in real Obsidian with the ticket's numbers (40-block callout: 7.8 ms/keystroke, scroll frame 24.7 ms avg / 41.7 ms p95 vs 19.7 / 29.6 before SC-537); SC-537's G-S57 and SC-544's G-S61 must stay green."
- "Overlap: SC-552 (running) works on twin form saves, likely in ReadingModeBlockHost.replaceSource — same file, different function; SC-545 (running) is in the LP callout click path after plugin off/on (may claim G-S63); SC-472 (running) is the scroll pin (adds G-S59 as a fifth part). Coordinate through me if you find you need to touch their functions."
- "If you add a lifecycle scenario it is G-S65, in part 3 or part 4 before G-S56 ("G-S56 must stay last")."
- "Do not edit .claude/skills/dse-verify/SKILL.md in your branch; put proposed text in a proposal file in the ledger dir."
- "Report land-ready to the dispatcher and stop; the dispatcher lands."

## Owner rulings
- 2026-11-02: INFO-1's optional extra (skip a selectionSet-only update whose selection did not
  enter or leave a callout) is OUT of scope: it changes which updates run the check, and SC-537 r5
  showed G-S57 does not cover the selectionSet term (mutant 6 passed). Scope is the per-pass
  fence-list cache only; the set of updates that run a pass stays exactly as on develop.
- 2026-11-02: no lifecycle perf scenario (timing in lifecycle is load-sensitive and would flake).
  Regression guard is a jest test that counts line scans per pass (linear, not quadratic).
- 2026-11-02: measurement = the SC-537 r5 reviewer's surviving probe harness
  (<scratchpad>/sc537-r5-review-a1c8475e199b5ef3f/, cases cost-big / cost-large / many-scroll),
  copied into the worker's private scratch, run on three bundles in one session: 88cb7db9
  (pre-SC-537), 367a2f1d (develop), branch HEAD.

## Authorship
- r1 implement + measure: implementer a3d8a4046e534bdbc (dispatched 2026-11-02). Reviewer must be a different identity.
- r1 DONE (relayed by dispatcher 2026-11-02): HEAD e33992aa on 367a2f1d; superproject CHANGELOG 96853b83. 40-block callout
  keystroke pass 6.57 -> 0.90 ms; scroll frame 21.3/32.8 -> 18.7/27.1 (pre-SC-537 19.2/28.1). Battery green (jest 6328/1).

## Owner rulings on r1 follow-ups (2026-11-02)
- "remaining cost linear but nonzero (0.9 ms at 40, 2.8 ms at 160)": DROP — linear now, at the level of a normal 125 KB note; no user-visible cost.
- "many-scroll reports 2-3 scroll jumps per direction on all three bundles incl. pre-SC-537 88cb7db9": not caused here
  (present before SC-537). Reviewer re-runs many-scroll on the rebased branch AND on the new develop; if the jumps appear on
  develop too, DROP for this ticket (scroll pin is SC-472's area, now landed). Only a jump that appears on HEAD and not on develop is a finding.

## Rebase
- SC-472 landed (dse develop 0698550f, scroll pin rework; adds lifecycle G-S59 as a fifth part). Branch must rebase onto it; awaiting dispatcher's new baseline numbers.
- r1b rebase DONE: dse HEAD cb56f128 on 0698550f (range-diff identical), superproject 04aaaafd on origin/main f31c142a.
  jest 6380/1/253 of 254; lifecycle 49/49 (21+16+7+4+1); e2e 128/128 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24.
- r2 review: reviewer (independent of implementer a3d8a4046e534bdbc), brief sc547-brief-r2-review.md.
- r2 reviewer = a754c4d1799343192 (dispatched 2026-11-02 on cb56f128). Owner added probe: windowFences/windowEnds cache keys
  carry no text identity; a pass may mix getSectionInfo text and editor text — reviewer to rule reachable or not.
- r2 review (a754c4d1799343192) on cb56f128: FIX-NEEDED. MEDIUM-1 fence cache key lacks text identity (reachable: self-embedded
  callout section, getSectionInfo non-null with embed text; reproduced "failed to render (parse)" card). LOW-1 pre-existing SC-537
  `blocks` cache keyed by quote element only, not alias. INFO-1 no direct test for windowEnds lifetime / lineEnd in key.
  INFO-2 scope clean. INFO-3 reviewer's mutant-run temp dir left in /tmp. Cost re-measured: confirms r1.

## Owner rulings on r2 findings (2026-11-02)
- MEDIUM-1: FIX in r3 as prescribed (key hits by `lines` array identity; jest test with two section texts sharing window bounds in one memo).
- LOW-1: FOLD into r3 — it is one key change in the same PassMemo this branch restructures (`blocks` keyed by quote element AND
  alias), plus a test with 2+ blocks of each of two aliases in one callout (in a pass `[3,7,11,15]`, not `[3,7,null,null]`), and fix
  the r1 test whose 2-alias claim only held because its second alias had one block. CHANGELOG: extend the bullet (a second kind
  of block in the same callout is now also checked) only if it reads naturally; otherwise leave the bullet as is.
- INFO-1: FOLD — the MEDIUM-1 test also asserts a fresh memo per pass for windowEnds and that the fence key includes lineEnd (mutants hoist-ends and nokey-lineend go red on purpose).
- INFO-2: no action. INFO-3: DROP (one temp dir from the reviewer's own run; harmless, not a shared glob).
- r3 fix round: implementer a3d8a4046e534bdbc (author). r4 scoped re-review: reviewer a754c4d1799343192 (did not author fixes).
- r3 DONE (2026-11-03): dse HEAD ea78ebf8 (on cb56f128, develop still 0698550f), superproject 1a5386a3 (CHANGELOG clause added).
  jest 6383/1/253 of 254; lifecycle 49/49; e2e 128/128 89/89; styles.css byte-identical (93be34af…) so shots/freeze/parity carry.
  collide fixed in real Obsidian; cost-big typing pass 0.95 ms. Mixed-alias real-Obsidian check not run -> reviewer r4.
- r4 re-review (a754c4d1799343192) on ea78ebf8 / 1a5386a3: LAND-READY for code. LOW-1 superproject 1a5386a3 commits a stale
  submodule pointer (0698550f -> c5aca2b4, the pre-amend dse commit, on no branch). INFO-1 memo-freshness test is shallow (covered
  by 40-block test + G-S57). INFO-2 CHANGELOG clause vague.

## Owner rulings on r4 findings (2026-11-03)
- LOW-1: FIX now — rewrite the superproject branch so it carries only CHANGELOG.md, pointer left at 0698550f (as in 04aaaafd); landing bumps it.
- INFO-2: FOLD — owner's wording for the bullet's last sentences (below).
- INFO-1: DROP — the 40-block test's second pass and G-S57 already catch scope reuse across passes.
- r5: implementer a3d8a4046e534bdbc does the superproject-only rewrite; owner reviews it (docs/git-only diff, no runtime code).
- r5 DONE (2026-11-03): superproject squashed to 5a3b6572 on origin/main 3ba3f721, CHANGELOG.md only, gitlink 0698550f. Owner
  reviewed the diff (CHANGELOG bullet only). dse ea78ebf8 unchanged, develop still 0698550f.
- LAND-READY reported to dispatcher: dse sc547-lp-twin-check-perf @ ea78ebf8; superproject sc547-lp-twin-check-perf @ 5a3b6572.
