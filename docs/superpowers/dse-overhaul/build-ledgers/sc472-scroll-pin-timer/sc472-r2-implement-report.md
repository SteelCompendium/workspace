# SC-472 r2: implement report

## Executive summary
- dse `ebd81e5e` on branch `sc472-scroll-pin-timer`, rebased onto develop `eaf64ba6` (10 commits); superproject `276c3f71` (CHANGELOG), cut on `origin/main` `7f058b42`; the dse pointer bump is left unstaged.
- Gates at `ebd81e5e`: tsc + lint clean · jest **6302 passed / 1 skipped / 250 of 251 suites** (fresh run 6301 / 2; baseline 6262 / 1 / 249 of 250, so +40 tests, +1 suite) · lifecycle **47/47**: 21/21 + 16/16 + 9/9 + G-S59 1/1 · e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · shots 592, 0 FAIL, button host-leak 161/966 · freeze `280/280` · parity 0 GAPs / 0 undeclared / 24 DECLARED.
- G-S59 discrimination (2 runs each): head ok, ok · pre-SC-472 develop (`dabfb518`) FAIL (a)+(b), both runs, 6/6 writes clamped each · plain-timer backstop FAIL (b) 3/3 + FAIL (a), both runs.
- Risk 3 (block deleted at the note's end, Reading view): band ends at +3.62-3.84 s (head) vs +2.52-2.53 s (stock), +1.1-1.3 s; settled scrollTop 3160 both: ACCEPT.
- Mutation check: 53 mutations, all killed (survivors: none). New tests on stock `src/`: 33 of the rewritten/new pin and hold tests fail + the new `redrawBackstop` suite cannot load.
- Two deviations from the r1 prototype, both small: (1) a re-pin now cancels a check queued before it, (2) a re-pin never lowers the sizer heights the redraw waits for (details below). Findings to review: G-S59 needed a 4 s busy spin besides the 8x throttle.

## Commits (dse, oldest first)
| sha | what |
|---|---|
| f520f376 | fix: first pin = scrollHeight - padding (64 px phantom); test + 3 existing numbers moved |
| 986d065b | feat: `redrawBackstop.ts` (`Backstop`), 12 unit tests, `test/dom/framework/_frames.ts` |
| 9fd6dc6d | feat: Reading pins (own + SC-479 host) release on the redraw, with the backstop |
| be3b059a | feat: SC-522 embed hold, SC-478 widget hold + pending entry use the backstop |
| c4f88bd7 | fix: re-arm cancels the pending check; re-arm keeps the higher sizer heights (see deviations) |
| f47dcc96 | test: rewrite the 9 timer-only tests; new tests for every guard (previewScrollPin, livePreviewScrollHold) |
| 2ed2100a | test: tests that kill the 7 mutation survivors of the first mutation run |
| ba50ec47 | test: lifecycle G-S59 + harness comments (G-S8, G-S18, G-S42, G-S52 "TTL" wording) + file header |
| 00c0ff86 | test: G-S59 reports vacuity only when every write of the phase has a latency |
| ebd81e5e | docs: headers of `previewScrollPin.ts` and `livePreviewScrollHold.ts` |
Superproject: `276c3f71` CHANGELOG `## Unreleased` bullet (user-visible consequence first, the 64 px fix as a clause of it).

Note: the harness-comment rewording (suggested as a separate commit) is folded into the G-S59 commit.

## Jest
- 12 tests in new `test/dom/framework/redrawBackstop.test.ts`; 28 net new in `previewScrollPin.test.ts` / `livePreviewScrollHold.test.ts`; the 9 tests that advanced fake timers past `PIN_TTL_MS` plus the padded-height test (10 of the 92) rewritten. Fake timers + `_frames.ts`, a hand-driven animation-frame queue (jest's fake timers fake `requestAnimationFrame` too, so the queue is locked against the install). The SC-537 overlap: `livePreviewScrollHold.test.ts` already carried SC-537's change (rebase was mechanical); new LP tests sit in their own `describe` blocks / appended tests.
- On stock `src/` (`dabfb518`'s two files, no `redrawBackstop.ts`) the same three test files: **33 failed, 87 passed of 120**, plus the `redrawBackstop` suite fails to run (log `sc472-r2-jest-newtests-on-stock.log`).
- Mutation check, `sc472-r2-mutations-final.log` (final tests, 53 mutations, every one KILLED, number of red tests in brackets):
  - Backstop: B1 wall-clock deadline removed (7) · B2 30-frame count removed (11) · B3 quiet-frame rule removed (4) · B4 busy ignored (8) · B5 20 s cap removed (5) · B6 rAF-less fallback removed (2) · B7 rAF-less busy retry removed (1) · B8 `noteActivity` no-op (6) · B9 `arm()` does not restart (2) · B10 `cancel()` leaves the frame loop (3) · B11 frame count not reset at the deadline (1) · B12 `done()` does not cancel (2).
  - Reading pin: P1 padding fix reverted (4) · P2 busy empty-root rule removed (2) · P3 busy started-redraw rule removed (3) · P4 60-quiet-frame limit removed (2) · P5 busy `!redrawDone` term removed (1) · P6 start detection removed (3) · P7-P10 each `redrawStarted` signal: left the document, removed, added, ancestor of a root (1 each) · P11 empty-root check in `redrawDone` (1) · P12 tolerance 2->0 (2) · P13 tolerance 2->200 (4) · P14 viewport clause (1) · P15 embed inner sizers not tracked (1) · P16 DSE-less embeds tracked (1) · P17 `started` not reset on arm (1) · P18 `roots0` not refreshed (15) · P19 pending check not cancelled on arm (1) · P20 sizers not refreshed on re-pin (1) · P21 collapsed re-pin lowers sizers (1) · P22 no rAF-less check fallback (1) · P23 release does not cancel the check (1) · P24 observer `noteActivity` removed (2) · P25 check de-dup removed (1) · P26 disconnected embed not skipped (1) · P27 sizer-less key not skipped (1) · P28 no check scheduled (11) · P29 release without the done check (10).
  - Live Preview: L1 embed busy rule (1) · L2 embed `noteActivity` (1) · L3 widget busy rule (1) · L4 widget connected check (2) · L5 widget `noteActivity` (1) · L6 pending entry backstop not armed (2) · L7 previous pending entry not cancelled (1) · L8 `forget` does not cancel (1) · L9 embed release does not cancel (1) · L10 widget release does not cancel (1) · L11 embed hold backstop not armed (3) · L12 widget hold backstop not armed (3).
  - The first run (`sc472-r2-mutations-run1.log`) had 7 survivors (P5, P26, P27, L7-L10); tests were added for them (`...-run2.log`), and the final run is the whole set again.

## G-S59 (lifecycle), `visual-harness/obsidian-lifecycle.mjs`
- Own part, sits before G-S56 in SCENARIOS. Fixtures reused (`tall.md`, `lpembtracker.md`, `lpembhostend.md`); none added.
- Phases (a) Reading pane + Live Preview pane of `tall.md`, (b) Live Preview host embedding `lpembtracker.md` + a Reading pane of it; 3 outside writes each; CDP throttle 8x only around the write, reset in a `finally`; event-based wait (pin/hold seen on and gone AND the tracker replaced and mounted, 30 s cap, recorder state in the timeout text); per write scrollTop identical every frame, pin/hold on at the redraw, released, redrawn; latency per write printed; a phase FAILs as vacuous unless a write was redrawn later than `PIN_TTL_MS` (only when every write produced a latency).
- **Finding: throttle alone is not enough for phase (b).** Written as the ruling says (8x only), (b)'s embed redraw came 0.4-0.5 s after the write in some runs (all 3 writes in 2 of 7 early runs) and 5-12 s in others (the other pane's redraw is quick, the long task is its mount, and the order depends on Obsidian). Result: a head run FAILed as vacuous (head-4), and the plain-timer control PASSED (b) in one run (`sc472-r2-gs59-plain-2.log`). So the scenario also holds the main thread for 4 s (wall clock) right after each write with a `modify` listener (a slow handler of another plugin), added and removed per write. With it every measured write was redrawn 4.3-18.3 s after the write, and the controls are deterministic.
- Discrimination, runs against `DSE_LIFECYCLE_BUNDLE` bundles built from `git archive` exports in scratch (`bundles-summary`: head `d719e745`, base `aa4efdf6`, plain `f530e58c`):
  | bundle | run | result |
  |---|---|---|
  | head | final-1, final-2 (+ gate run, busy-head-1) | ok (all writes held); latencies (a) 4.3-15.4 s, (b) 4.8-18.3 s |
  | pre-SC-472 develop `dabfb518` | final-1, final-2 | FAIL (a) 3/3 and (b) 3/3 writes: scrollTop 2779->2001 and 7486->3745, pin/hold not on at the redraw |
  | plain 2.5 s backstop | final-1 | FAIL (a) 3/3 and (b) 3/3 |
  | plain 2.5 s backstop | final-2 | FAIL (b) 3/3 (7486->3745); (a) 3/3 timed out the 30 s wait (also red) |
  Logs `sc472-r2-gs59-final-{head,base,plain}-{1,2}.log`; earlier runs before the busy spin are `sc472-r2-gs59-{head,base,plain}-*.log` (kept as evidence of the vacuity finding); shots `sc472-r2-gs59-final-base-1-FAIL.png`, `...-final-plain-1-FAIL.png`.
- The 10 s-timer control is not used (as ruled).
- Time per lifecycle part (loadavg 2-10, 12 cores): part 1 185 s, part 2 332 s, part 3 356 s, G-S59 181 s: each fits a 600 s tool call.

## Risk 3: a block deleted at the note's end (Reading view)
Scratch probe (`risk3-block.mjs.txt`, not committed): `p472end.md` = 60 paragraphs, tracker, `END-MID`, tracker at the very end; reader at the end (scrollTop 5287 of 6308); `vault.modify` deletes the last tracker. Band = write -> pin attribute removed (the inline sizer min-height settles at its final 4117 at +41-69 ms).
| bundle | run | pin off at | scrollTop settled | scrollHeight in the band | loadavg |
|---|---|---|---|---|---|
| stock | 1 / 2 | +2516 / +2519 ms | 3160 / 3160 | 6372 (64 px phantom) | 8.7 / 9.2 |
| stock | 3 / 4 | +2525 / +2516 ms | 3160 / 3160 | 6372 | 6.6 / 5.8 |
| head | 1 / 2 | +3707 / +3837 ms | 3160 / 3160 | 6308 | 8.2 / 8.6 |
| head | 3 / 4 | +3621 / +3620 ms | 3160 / 3160 | 6308 | 5.2 / 4.6 |
Head is 1.10-1.32 s longer than stock (limit 1.5 s), settled position equal: **ACCEPT**. The machine was not idle (other efforts ran, loadavg 4.6-9.2 of 12 cores); the band is dominated by the 2.5 s deadline + 30 + 60 frames, so load can only lengthen it. Logs `sc472-r2-risk3-{base,head}-{1,2}.log`.

## Deviations from the r1 prototype (both in `previewScrollPin.ts`, commit c4f88bd7)
1. `arm()` cancels a check queued by the redraw before it. Without this, a re-pin during a redraw let the old check judge the new arm and release the pin (found while writing the re-arm test; P19 kills it).
2. `arm()` keeps the higher of the previous and the new sizer height per sizer. A re-pin that lands while the sizer is collapsed (46 px) otherwise lowered what the next redraw has to restore to 46 px, so the pin could release at an intermediate height (P21 kills it). The pin's own floor already works this way.

## Docs
- Headers of `previewScrollPin.ts` (RELEASE ON THE REDRAW, THE 64 PX PHANTOM, KNOWN LIMITS) and `livePreviewScrollHold.ts` (THE BACKSTOP, limits).
- CHANGELOG bullet in the worktree superproject (`276c3f71`).
- dse-verify text: `sc472-dse-verify-proposal.md` (47/47, four parts with measured times, G-S59 entry with controls, G-S52 "false red" sentence reworded, new expected numbers, the fake-timer rAF footgun). SKILL.md not touched.

## Drive-by fixes:
- None.

## Follow-ups:
- G-S59 depends on the 8x throttle plus a 4 s spin; under heavy machine load the 30 s event wait could time out (environment; the FAIL text carries the recorder state). Latencies seen were up to 18.3 s.
- The plain-timer control's phase (a) sometimes times out the 30 s wait rather than clamping (the recorder never reaches its 10 mounted frames after the clamp); both outcomes are red, so it only matters for reading the control's log.
- r3 probe list (from the ledger): Risk 4 (early release when virtualisation removes an arm-time root) and the SC-478 widget hold in sibling runs (released by the backstop, not on mount; the header says so). Not probed here.
- Baselines moved under me twice (develop `97284051` -> `dabfb518` -> `eaf64ba6`). Part 1 of the lifecycle ran before the last rebase; the rebase touched only `e2e/` (2 files), so part 1's inputs are identical. Everything else ran on `ebd81e5e`. The last rebase does not include anything newer than `eaf64ba6`.

## Evidence files (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
`sc472-r2-jest.log`, `sc472-r2-jest2.log` (final, with shots cache), `sc472-r2-jest-newtests-on-stock.log`, `sc472-r2-tsc.log`, `sc472-r2-tsc2.log`, `sc472-r2-lint.log`, `sc472-r2-lint2.log`, `sc472-r2-lifecycle-part{1,2,3,4}.log`, `sc472-r2-e2e.log`, `sc472-r2-shots.log` / `.rc`, `sc472-r2-freeze.log`, `sc472-r2-parity.log`, `sc472-r2-mutations-{run1,run2,final}.log`, `sc472-r2-gs59-*.log` / `*.png`, `sc472-r2-risk3-*.log`, `sc472-dse-verify-proposal.md`. Scratch tooling: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r2-a01ddb12d6e62735a/` (`mutate.py`, `mkbundle.sh`, `run59.sh`, `risk3-block.mjs.txt`, `ltpart.sh`).
