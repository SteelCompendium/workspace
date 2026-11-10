# SC-561 decisions ledger — G-S59 lifecycle timeout ("pin or hold released and the tracker redrawn")

Ticket: SC-561 (DSE 7.0.0, Backlog; Scott activated the project's Backlog for work 2026-11-10).
Worktree: /home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout (branch sc561-gs59-timeout everywhere)
Base: dse develop 6270e84a · workspace main e1d3d1e0
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05

## Baseline at 6270e84a (from dispatcher)
jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 · e2e 128/128 ok, coverage 89/89 ·
shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

## Ticket text (verbatim, 2026-11-05)
**Problem:** lifecycle scenario G-S59 failed once with `timed out waiting for the pin or hold released and the tracker redrawn` (load average about 5), then passed on the immediate re-run.
**Expected:** G-S59 passes reliably, since lifecycle is required to land every DSE change.
Evidence: `.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r5-review-report.md` INFO-1; logs in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r5-review-h7c4/`
(`battery-lc5-run1.log` FAIL, `battery-lc5-r2.log` pass, `shots/gs59-head-run1-FAIL.png`).

## Dispatcher constraints (2026-11-10)
- If the ticket needs a decision from Scott, ask on the ticket and park.
- Owners do not edit dse-verify SKILL.md: any proposal goes as a file in this ledger.
- New lifecycle id available if needed: G-S67 (G-S60/65/66 and G-S16 taken by parked branches).
- Concurrent: SC-556 (outside edit vs open edit form), SC-486 (ds-encounter _computed write on render).
- Report land-ready to the dispatcher and stop; the dispatcher lands.

## Scott rulings
(none yet)

## Rounds
- 2026-11-10 r1 diagnosis dispatched: orchestration:reviewer (agent a07af60c557d13934, author-identity "R1"), brief sc561-r1-brief-diagnose.md, report -> sc561-r1-diagnosis-report.md. No code changes this round.
- 2026-11-10 r1 diagnosis returned (report sc561-r1-diagnosis-report.md; evidence scratchpad/sc561-r1-diag-q7m3/). Root cause class (a) harness only: G-S59's CDP 8x CPU throttle stretches ~2 s of real per-write main-thread work to 14-20 s at idle vs CAP_MS 30 s; load pushes it past. No plugin defect; no Scott decision needed. Repro: 5 valid runs, 2 FAIL at load 11-26.

## Owner rulings (not Scott's)
- 2026-11-10 OWNER-1: Adopt r1 Fix 1 — remove the CDP throttle from G-S59 (keep BUSY_MS 4000, CAP_MS 30000), update header/block comments and result string. This supersedes SC-472's owner ruling "Lifecycle: new G-S59 under CDP 8x throttle" (owner ruling, not Scott's). Justification: r1 measured that without the throttle the controls still discriminate (pre-SC-472 build 367a2f1d fails (a)+(b) 6/6, plain-2.5 s-timer build fails 6/6) and head passed 30/30 writes at load 6-35.
- 2026-11-10 OWNER-2: FOLD r1 Fix 2 (phase (c) environment precondition "scroll took N ms, past the 2400 ms" failed 6/12 runs at load >= 8) into SC-561 — same scenario, and the ticket's expectation is "G-S59 passes reliably". Implementer measures options (a) fewer/larger wheel steps and (b) wheel centre computed before the write first; (c) bounded env-only retry only as an addition. GO_AT stays (must stay below PIN_TTL_MS).
- 2026-11-10 OWNER-3: DROP the optional MutationObserver-based `ready` — reason: it only removes rAF frame lag, which is irrelevant once the throttle is gone (worst wait 9.4 s vs 30 s cap).
- 2026-11-10 OWNER-4: ~~file a Backlog perf ticket~~ superseded same day: SC-491 (Backlog, "Initiative tracker with 25–45 heroes takes 0.5–1 s of main thread to draw, on every redraw") is the same cost; post r1's attribution (style recalc + layout from the DSE stylesheet, DSE script only ~50-72 ms) as a comment on SC-491 instead of a new ticket. Out of scope for SC-561.
- 2026-11-10 r2 implement dispatched: orchestration:implementer (agent a78b2d4fed22db9ea, identity "I2"), brief sc561-r2-brief-implement.md, report -> sc561-r2-impl-report.md. Review must go to a fresh reviewer (not R1? R1 diagnosed but did not author code — R1 may review; prefer a fresh identity "R3").
- 2026-11-10 OWNER-4 done: attribution comment posted on SC-491.
- 2026-11-10 r2 returned DONE_WITH_CONCERNS: head d344e1e1 (commits 8b64eb02 434e68ef a24952a2 d344e1e1), only visual-harness/obsidian-lifecycle.mjs. Fix 2 adopted (a) bigger wheel steps + (c) env-only retry (ENV_RETRIES 2); (b) rejected (5-12 ms). Proof: head 8/8 ok (loadavg 4-34); controls 367a2f1d FAIL (a)+(b) 3/3, plain-timer FAIL 3/3, b8f7fcb2 (SC-472 r4 bundle) FAIL (c). main.js/styles.css byte-identical to 6270e84a. Battery: jest 6492/1/257 of 258, lifecycle 52/52, e2e 128/128 cov 89/89, shots 592 0 FAIL host-leak 163/978 clip OK 147, freeze 280/280, parity 0/0/24. First-run reds green on re-run: jest twin-reuse 5000 ms timeout (load 16-20), e2e RECOV-R07 w.count 2 vs 1.
- 2026-11-10 OWNER-5 follow-up rulings: previewScrollPin.ts:223 throttle comment -> DROP (accurate historical measurement; src out of scope). twin-reuse jest timeout -> DROP (5 s budget at load 16-20 is load-induced). RECOV-R07 count 2 vs 1 -> FILE Backlog ticket (could be a real double-fire, required gate). b8f7fcb2 only in a scratch bundle -> DROP (path recorded in r2 report; dse-verify proposal is the dispatcher's to apply). ENV_RETRIES above load 40 -> DROP (speculative). r2's literal-name rm loop: accepted (no glob, own dirs only).
- 2026-11-10 r3 review dispatched (fresh orchestration:reviewer, identity "R3"), brief sc561-r3-brief-review.md.
- 2026-11-10 OWNER-5: RECOV-R07 filed as SC-570 (Backlog, DSE 7.0.0, related SC-561/SC-526). Out of scope for SC-561.
- 2026-11-10 r3 review (R3, agent a1eeac6b9505a63ef) verdict FIX FIRST: HIGH-1 (phase (c) retry discard branch waits on `done`, which never comes when the pin already released before goAt -> 30 s timeout FAIL; retry only rescues 2.4-3.0 s scrolls), LOW-1 (proposal items 8/9 + controls/hashes + SKILL.md:1302 sentence), INFO-1..4. Controls all FAIL as targeted; 6/6 head runs ok (load 5-62); byte-identity confirmed.
- 2026-11-10 OWNER-6: HIGH-1 -> fix round (resume I2) using R3's prescribed fix, re-proved with a REAL >=3.5 s slow first attempt. LOW-1 -> fold (proposal file). INFO-1 drop (accurate as r1's number). INFO-2/3/4 no action (informational; INFO-2 noted for the dispatcher's SKILL.md wording, optional). b8f7fcb2 "second tracker" variant reporting a timeout instead of the product message under the fix -> accepted (still red). Scoped re-review of the delta -> R3 (did not author code).
- 2026-11-10 r4 fix round: resumed I2 (a78b2d4fed22db9ea) with HIGH-1 + LOW-1 verbatim; report -> sc561-r4-fix-report.md. Scoped re-review -> R3 (a1eeac6b9505a63ef).
- 2026-11-10 r4 returned DONE: head 6153acfe (on d344e1e1 / 6270e84a). HIGH-1 fixed per R3's prescription; real 3500 ms delay proof: attempt-1-only -> 3 discards (2 with pin already off) re-run and pass; all-3 -> FAIL with env message, 0 timeouts. Controls b8f7fcb2 FAIL (c) 3/3 product message, 367a2f1d FAIL (a)+(b) 3/3. Head G-S59 5/5 ok (load 4-43). Lifecycle 52/52; jest 6492/1/257 of 258 (run 1 had two 5 s timeouts at load 33). Bundle bytes unchanged. Proposal regenerated, 10 pairs.
- 2026-11-10 OWNER-7: jest 5000 ms timeouts at loadavg 33 (twin-reuse SC-547, initiative-default-keys SC-485) -> DROP (load-induced at an extreme loadavg; green on re-run; unrelated to the harness file).
- 2026-11-10 r5 scoped re-review of d344e1e1..6153acfe + proposal dispatched to R3 (SendMessage resume).
- 2026-11-10 r5 scoped re-review (R3) verdict LAND: 0 HIGH/MEDIUM/LOW, INFO-1 no action. Slow probe x1 -> 1/1 ok; x3 -> env FAIL, 0 timeouts; b8f7fcb2 FAIL (c) 3/3; proposal 10 pairs apply cleanly; bytes unchanged. Report sc561-r5-rereview-report.md.
- 2026-11-10 LAND-READY: dse branch sc561-gs59-timeout head 6153acfe on develop 6270e84a, harness-only (visual-harness/obsidian-lifecycle.mjs). Comment posted on SC-561. Reported to dispatcher; owner stops here. Dispatcher applies sc561-dse-verify-proposal.md at landing.
- 2026-11-10 DONE: landed by dispatcher — dse develop 6153acfe, workspace main e2ea8b70 (merge) + 122117dd (bookkeeping); dse-verify updated with all 10 proposal edits + new CURRENT block; ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc561-gs59-timeout/; worktree removed. SC-561 set to Done. Spun off: SC-570 (RECOV-R07 double write, Backlog); SC-491 comment (redraw cost attribution).
