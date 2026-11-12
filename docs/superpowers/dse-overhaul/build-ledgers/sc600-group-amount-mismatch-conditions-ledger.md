# SC-600 decisions ledger — group amount/instances mismatch drops conditions

Effort: sc600-group-amount-mismatch-conditions · worktree (not yet created): `just wt-new sc600-group-amount-mismatch-conditions` from dse develop `79da77f8` · lifecycle id if needed: G-S89.

## Facts (owner, read from code at dse 79da77f8, 2026-11-11)
- `src/elements/initiative/model.ts:376-385` (squad minions) and `:414-423` (regular creatures/captains): when `creature.instances` is missing OR `instances.length !== amount`, the list is replaced by a fresh one (ids 1..amount, empty conditions; regulars get current_stamina = max_stamina, temp 0). Next save writes that.
- Nothing in `src/` writes `.amount` — a mismatch only comes from a hand edit of the block (or hand edit of instances).
- Legacy copy of the same logic: `src/drawSteelAdmonition/EncounterData.ts:~836,~880` (oracle; keep in step if behaviour changes — check how parity/oracle tests use it).
- Minion pool is not re-initialized when amount changes (only when the pool is null) — unchanged either way; out of scope unless Scott says otherwise.

## Rulings

### 2026-11-12 — Scott, SC-600 comment (verbatim): "A"

Option A as it was posted to him (2026-11-11 ask, verbatim):
> **A. Keep and adjust (recommended).** Keep the existing instances as they are. If `amount` goes up, add new instances at the end (full stamina, no conditions). If `amount` goes down, remove instances from the end of the list. Only the removed instances lose their state.

Also in that ask (scope statement Scott accepted with A):
> This applies the same way to squad minions (which only keep conditions per minion; their shared stamina pool is not touched by this change) and to regular creatures and captains.

Owner reading of the unanswered follow-up ("from the end" vs "defeated first"): Scott's reply "A" adopts option A's literal text, "remove instances from the end of the list" — which was also the recommendation. Trim from the END. No defeated-first logic.


## Rounds
- 2026-11-12: worktree created (`just wt-new`), dse reset to develop `dcc53f0f`, superproject at `f108e5e9`. Ticket -> Awaiting, Ready for Agent removed.
- r1 implementer (orchestration:implementer, agent a2d510e48f421ce0e) dispatched: brief `sc600-r1-impl-brief.md`, report `sc600-r1-impl-report.md`.
- Author-independence: reviewer must be a fresh orchestration:reviewer identity, not a2d510e48f421ce0e.
- r1 DONE: dse head `1116e06d` (fix 116fb6a7, jest eb2ae871, e2e 5743adc8 INIT-AMT-E01/E02, docs ad811f40, tsc 1116e06d); superproject changelog `e3a3a0f0`. Gates: jest 10802/2, lifecycle 60/60, e2e 306/309 0 failed 3 known-bug 174/174, shots 592 / 163/978 / 39/234 / 147, freeze 280/280, parity 0/0/24.
- Owner ruling on r1 follow-up "legacy parseEncounterData (EncounterData.ts:836/:882) keeps the old rebuild": DROP — it is a test-only oracle with no live caller, already drifted since SC-592, and no test feeds it a mismatch; no ticket.
- r2 reviewer (orchestration:reviewer) dispatched on 1116e06d: brief `sc600-r2-review-brief.md`.
- r2 review (reviewer a7ba9e8ccf3635bd9) on 1116e06d: LAND-READY, 0 HIGH / 0 MEDIUM / 2 LOW / 4 INFO; e2e 306/309 0 failed 174/174; new scenarios proven red on base. Report `sc600-r2-review-report.md`.
- Owner rulings on r2 findings:
  - LOW-1 (comment "an id is never reused" is false across trims): FOLD into r3 — reword.
  - LOW-2 (model.ts header says verbatim-from-legacy): FOLD into r3 — one header line naming the SC-600 deliberate divergence from EncounterData.ts:836/:882.
  - INFO-4 (`amount: .inf` hangs parse; pre-existing): FOLD into r3 — non-finite `amount` throws the existing invalid-amount error (error card instead of a frozen Obsidian). Same function, two-line change.
  - INFO-1/2/3: no action (confirmations / spec'd / improvements).
- r3: resume r1 implementer (a2d510e48f421ce0e) for the fold + superproject rebase onto workspace origin/main with ONE pointer bump. Scoped re-review of the delta -> r2 reviewer (a7ba9e8ccf3635bd9; not the author).
- 2026-11-12 dispatcher: dse develop now c329ff35 (SC-607). CURRENT: jest 11595/2 fresh · lifecycle 61/61 (part 6 = G-S92 G-S96 G-S97 G-S99) · e2e 304/307 0 failed 3 known-bug 174/174 · shots 592 / 163/978 / 39/234 / 147 · freeze 280/280 · parity 0/0/24. Relayed to r3 implementer: rebase onto c329ff35, full battery. SC-608 may need model.ts later (coordinates via dispatcher).
- r3 DONE (a2d510e48f421ce0e): dse head `d984b115` on develop `c329ff35`; superproject `0f01f93b` (changelog e226f763 + one pointer bump) on workspace origin/main `e188cee0`. Gates on d984b115: jest 11618/1 (cached CSS = 11595/2 fresh + 22), lifecycle 61/61, e2e 306/309 0 failed 3 known-bug 174/174, shots 592 / 163/978 / 39/234 / 147, freeze 280/280, parity 0/0/24.
- r4 scoped re-review of the delta -> r2 reviewer a7ba9e8ccf3635bd9 (not the author).
- r4 scoped re-review (a7ba9e8ccf3635bd9) on dse d984b115 / superproject 0f01f93b: LAND-READY, 0 HIGH/MEDIUM/LOW, 2 INFO. Report `sc600-r4-rereview-report.md`. Re-ran: jest 11618/1, e2e 306/309 0 failed 3 known-bug 174/174; spot-checked lifecycle 61/61, shots, freeze 280/280, parity 0/0/24.
- Owner rulings: INFO-1 (d984b115 not pushed yet): no action — landing (`wt-finish`) pushes the submodule with the pointer. INFO-2 (huge finite amount e.g. 1e9 builds that many instances; pre-existing): DROP — pathological hand edit, unchanged by SC-600, no ticket.
- 2026-11-12: LAND-READY reported to dispatcher. Ticket comment posted; state stays Awaiting until landed.
