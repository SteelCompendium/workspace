# SC-570 decisions ledger — RECOV-R07 double write

Effort: `sc570-recov-r07-double-write`. Owner: ticket-owner (Opus 5.5). Lifecycle id reserved if needed: **G-S90**.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write` (dse branch `sc570-recov-r07-double-write` cut from dse develop `79da77f8`).
Related: SC-517 (same symptom, filed earlier from SC-500; Backlog) — this effort resolves both; rule on SC-517's state at land-ready.

## Ticket (SC-570, as filed; no Scott comments yet)

- Problem: e2e RECOV-R07 failed once — Catch breath press produced two writes (`w.count` 2, expected 1). Re-run passed. Load avg ~16-20.
- Unknown: real double write vs a late write from the earlier minus/plus presses landing in the Catch breath wait window.
- Why it matters: e2e gates every DSE landing; a real double write could spend two Recoveries per press.
- First step (ticket): "check whether the popover's minus/plus presses write on a delay. If they do, the test should wait for those writes to finish before it presses Catch breath. If they don't, reproduce under load and log each write."
- Spec: `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:355`. Popover last changed by SC-526.
- dse-verify SC-480 note: "its +/- clicks and Catch breath can straddle the 400 ms debounce when the host is at loadavg 20+".

## Scott rulings

(none yet)

## Owner rulings

- 2026-11-11: Investigate first (reviewer, Opus), then fix by implementer, then independent review. If the diagnosis shows a PRODUCT defect (one press can spend two Recoveries, or a pending stepper write is lost/duplicated), the fix goes in the product and gets a CHANGELOG bullet; if test-only, the fix is under `e2e/` only, no CHANGELOG entry.
- Owners don't edit dse-verify SKILL.md; SKILL proposals go in this dir as `sc570-skill-proposal.md`.

- 2026-11-11 (after r1): r1 verdict **TEST** accepted — product writes are correct (debounce supersedes, flush serializes live model, adapter.process serializes writes; content right in every forced run). Fix = r1's prescribed e2e change (`dse.settle()` + `expectNoteBlock(... {current_stamina: 12, recoveries: 4})` before the Catch breath `waitForWrite` in RECOV-R07).
- 2026-11-11: ~~"if test-only, the fix is under `e2e/` only"~~ amended: test-only fix may ALSO add jest cases to `test/dom/elements/staminaRecoveries.test.ts` pinning the one-window path the e2e now gives up — r1 probes P1 (dec, inc, inc, Catch breath within 399 ms → exactly one write, recoveries 3 / Stamina 22) P2 (Catch breath after the window → two writes, (4,12) then (3,22)) and P3 (as P2 with the stepper write held in flight across the Catch breath press and its write → (4,12) then (3,22), no stale re-write), asserting write CONTENT. No product change, no CHANGELOG entry.
- 2026-11-11: the implementer drafts `sc570-skill-proposal.md` (replace/remove the dse-verify SC-480 "RECOV-R07 is load-sensitive" bullet). Owner does not edit SKILL.md; dispatcher applies at landing.
- 2026-11-11: SC-517 (same symptom) — mark Duplicate of SC-570 at land-ready. DONE (status Duplicate, verified).
- 2026-11-11: land-ready comment posted on SC-570 (no Scott ask); SC-570 left on Awaiting for the dispatcher to land, then Done via `linear-post.py --state Done`.
- Gates for this test-only change: tsc (incl. e2e), lint, jest, lifecycle 5 parts, e2e full. `main.js` / `styles.css` must be byte-identical to a clean `79da77f8` build → shots / freeze / parity carry.

- 2026-11-11 (dispatcher): SC-597 landed; dse develop now **e5b6f9f2** (supersedes 79da77f8). Rebase onto it before land-ready. I2 told to rebase and gate on the rebased head; byte-identity reference = clean e5b6f9f2 build.

- 2026-11-11 (after r3, LAND-READY 0 HIGH / 0 MED / 1 LOW / 4 INFO): LOW-1 (skill proposal's repro sentence names no hook point; probe diff only in /tmp) — FOLDED by owner: proposal now names `e2e/driver/page.ts` / `e2e/driver/session.ts` hook points, and the r1 probe diff is copied into this dir as `sc570-r1-driver-probe.diff` (preserved with the ledger at landing). INFO-1 (waitForWrite can't see an unchanged-content write) — DROP: pre-existing, harmless, Obsidian skips identical writes. INFO-2 (one-window path moved e2e→jest P1) — DROP: intended per amendment. INFO-3 (`pressSteppers` duplicates `mountRecoveries`) — DROP: optional test-helper style, no gate impact. INFO-4 (reviewer's runs rotated r2's e2e/.out dirs) — DROP: r2 had copied its bundles to scratch.
- 2026-11-11: LAND-READY reported to dispatcher: dse `ce4937ef` on `e5b6f9f2`. Test code only, no CHANGELOG. Dispatcher applies `sc570-skill-proposal.md` at landing.

## Baselines at e5b6f9f2 (CURRENT)

jest 7283 passed / 2 skipped (fresh worktree) · lifecycle 56/56 (21 + 16 + 9 + 4 + 6; part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` ~347 s; G-S56 last in part 4) · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## ~~Baselines at 79da77f8~~ superseded by e5b6f9f2

jest 7262 passed / 1 skipped (css cached; ~7261 / 2 fresh) · lifecycle 55/55 (5 parts: 21+16+9+4+5) · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Rounds

| Round | Agent type | Report |
|---|---|---|
| r1 diagnosis | orchestration:reviewer (id a57a875bf0ba3e46b, "R1") | `sc570-r1-diagnosis.md` (brief `sc570-r1-brief-diagnosis.md`) — DONE: verdict TEST |
| r2 implement | orchestration:implementer (id a29a8fe53e0498b46, "I2") | `sc570-r2-impl-report.md` (brief `sc570-r2-brief-impl.md`) — DONE: head `ce4937ef` on `e5b6f9f2`; jest 7286/2 fresh; lifecycle 56/56; e2e 264/269 0 failed 164/164; main.js+styles.css byte-identical to e5b6f9f2 |
| r3 review | orchestration:reviewer, FRESH identity "R3" (not R1 — R1 prescribed the fix) | `sc570-r3-review.md` (brief `sc570-r3-brief-review.md`) — DONE: LAND-READY, 0 HIGH / 0 MED / 1 LOW (folded) / 4 INFO (dropped) |

## Done

- 2026-11-11: LANDED by dispatcher — dse develop `ce4937ef` (e5b6f9f2..ce4937ef), workspace main `ddee3b5f` (pointer bump `db920132`, bookkeeping `c0cf5cea`); worktree removed; ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc570-recov-r07-double-write/`; dse-verify proposal applied. Landed comment posted and SC-570 moved to **Done** via `linear-post.py --state Done`; state verified Done (completedAt 2026-11-11T21:25:08Z). SC-517 Duplicate of SC-570.
