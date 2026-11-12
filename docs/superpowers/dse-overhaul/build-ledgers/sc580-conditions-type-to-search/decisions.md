# SC-580 decisions ledger — Conditions window: "or just start typing" opens the Add search

Ticket: SC-580 (Linear). Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc580-conditions-type-to-search
(dse branch `sc580-conditions-type-to-search` cut from develop `3ad68185`; superproject cut from main `d0ca9bf0`).

## Scott rulings (verbatim, dated)

None yet. The ticket offers two fixes without a ruling: "either add the key handler, or correct the doc."

## Owner decisions

- 2026-11-12 (owner): **Add the key handler** — make the documented behaviour real, do not
  retract the doc. Reasons: the doc line (`docs/initiative-tracker.md:430`, "Click '+ Add
  condition' (or just start typing) to open the type-ahead search.") shipped with the SC-186
  Option D design Scott reviewed; the SC-436 e2e marker COND-N07 already encodes it; the change
  is small and reversible. Scott can veto on the land-ready comment, in which case the fallback
  is the doc correction plus deleting the COND-N07 marker (ticket's agent notes).
- Behaviour spec (owner, 2026-11-12): see `sc580-r1-implementer-brief.md` §Task.

## Out of scope (other tickets, same window — do not touch)

SC-581, SC-582, SC-583, SC-585, SC-586 (Backlog), SC-587 (decision for Scott).
Parallel owners elsewhere: SC-601, SC-607.

## Rounds

- r1 implementer: dispatched 2026-11-12.
- r1 implementer DONE 2026-11-12: plugin `7a88aa1d`, superproject `b51ddd17`. DOM keydown on modalEl via lifecycle. jest 10697/2 · lifecycle 59/59 · e2e 282/285 ok, 0 failed, 3 known-bug, 172/172 · shots 592 / 163/978 / 39/234 / 147 · freeze 280/280 · parity 0/0/24. Note: letter on a focused duration/effect chip (buttons) opens the Add search — per spec.
- r2 reviewer (Opus): dispatched 2026-11-12, brief `sc580-r2-reviewer-brief.md`.
- 2026-11-12 dispatcher: SC-601 landed; dse develop now `231f2a3b` (supersedes 3ad68185; new `src/framework/kit/hoverPreviewGuard.ts`, `DseModal.keepHoverPreviewAlive` calls it; lifecycle G-S97 added). New CURRENT: jest 10711/2 (fresh) · lifecycle 60/60 (21+16+9+4+7+3; part 6 = `G-S92,G-S96,G-S97`) · e2e 278/282 ok, 0 failed, 4 known-bug, 171/171 · shots 592, 163/978, 39/234, 147 · freeze 280/280 · parity 0/0/24. Plan: let r2 review finish on 7a88aa1d, then fix round + rebase onto 231f2a3b (and superproject onto current workspace main) in one implementer round, full battery, scoped re-review of the delta. Expected post-rebase: jest 10711+21 = ~10732/2, lifecycle 60/60, e2e 282/285 ok, 0 failed, 3 known-bug, 172/172.
- r2 review 2026-11-12: LAND, 0 HIGH / 0 MED / 2 LOW / 5 INFO (`sc580-r2-review-report.md`). Owner rulings:
  - LOW-1 (click on title/blank → focus on body → typing does nothing): **filed SC-613** (Backlog, related SC-580). Out of scope for r3.
  - LOW-2 (letter on an editor chip opens search; Escape refocuses "+ Add condition", not the chip): chip behaviour accepted; **fold** the focus fix: when the Add search was opened by a routed key and is closed without a pick (Escape), return focus to the control that had it if still connected, else "+ Add condition" as today.
  - INFO-1 (AltGr/Option not routed): drop — English catalogue, no practical effect.
  - INFO-2 (e2e misses text-entry-guard mutant): drop — jest kills it.
  - INFO-3 (hover/sidebar openers unmeasured): drop — same window class, same handler.
  - INFO-4, INFO-5: drop — base behaviour / brief wording only.
- r3 implementer (resume of r1 identity): fold LOW-2 + rebase plugin onto `231f2a3b` + superproject onto workspace origin/main `bd10dc98`; full battery. Scoped re-review r4 by the r2 reviewer identity.
- r3 implementer DONE 2026-11-12: plugin `eecd2ff6` on develop `231f2a3b` (commits b17044b0, eafa31c1, eecd2ff6 LOW-2); superproject `bbda9dd2` on main `bd10dc98` (CHANGELOG conflict: both bullets kept). jest 10741/1 (= 10740/2 fresh) · lifecycle 60/60 · e2e 283/286 ok, 0 failed, 3 known-bug, 172/172 · shots 592/163-978/39-234/147 · freeze 280/280 · parity 0/0/24. New COND-N11.
  - Owner ruling on the implementer's question (search opened by click, a routed key later, then Escape → "+ Add condition"): **accepted as built** — matches the r3 ruling "for a search opened by click, behaviour is unchanged".
- r4 scoped re-review (r2 reviewer identity): dispatched 2026-11-12, delta = LOW-2 commit eecd2ff6 + rebase conflict resolutions.
- 2026-11-12 dispatcher: SC-609 landed; dse develop now `622b0904` (supersedes 231f2a3b; roster cell click moves keyboard focus to the clicked cell, `controlFocus` / initiative view; e2e INIT-F13, INIT-F14). New CURRENT: jest 10715/2 (fresh) · lifecycle 60/60 · e2e 280/284 ok, 0 failed, 4 known-bug, 171/171 · shots 592, 163/978, 39/234, 147 · freeze 280/280 · parity 0/0/24. Plan: after r4 returns, r5 implementer rebases plugin onto 622b0904 + superproject onto current workspace main, full battery. Expected: jest 10715+29 = 10744/2 fresh · lifecycle 60/60 · e2e 285/288 ok, 0 failed, 3 known-bug, 172/172. If the rebase is clean and gates match, no further review; if it conflicts in focus code, scoped re-review of the resolution.
- r4 scoped re-review 2026-11-12: LAND, 2 LOW (test gaps) + 1 INFO (`sc580-r4-rereview-report.md`). Owner rulings:
  - LOW-1 (no test that only Escape hands focus back; mutant R1 survives): **fold** — one jest case (letter on chip, click title, focus on "+ Add condition").
  - LOW-2 (no test that a pick clears the remembered control; mutant R3 survives): **fold** — repeat the after-pick test starting from Done.
  - INFO (re-pick of an existing condition keeps the remembered control): drop — fits the ruling.
- r5 implementer: rebase onto 622b0904 + superproject onto workspace main + fold r4 LOW-1/LOW-2 tests; full battery. Then r6: r2/r4 reviewer re-runs mutants R1/R3 against the new tests + checks the rebase.
- r5 implementer DONE 2026-11-12: plugin `93e8e48c` on develop `622b0904` (clean rebase; range-diff: commits 1-3 identical to r3's, commit 4 = +25 lines in conditions-modal-matrix.test.ts only); superproject `e8417f8d` on `38d8c695`. Mutants R1 / R3 each 1 failed / 395 passed (logs sc580-r5-mutant-R*.log, owner-checked). jest 10747/1 (= 10746/2 fresh) · lifecycle 60/60 · e2e 285/288 ok, 0 failed, 3 known-bug, 172/172 · shots 592/163-978/39-234/147 · freeze 280/280 · parity 0/0/24.
  - Owner ruling: planned r6 reviewer pass **dropped** — delta is test-only, rebase clean and range-diff-identical, and the mutant kills are logged. The owner checked range-diff, the diffstat and the mutant logs directly.
- Workspace main moved to `02dbf30c` (handoff docs only); chore rebasing the superproject branch onto it. Then land-ready.
- Superproject rebased (chore) onto `02dbf30c`: head `6d68df08`, pointer `93e8e48c`, clean. LAND-READY 2026-11-12.
- DONE 2026-11-12: landed by dispatcher — dse develop `93e8e48c` (622b0904..93e8e48c), workspace main `27c0fff9` (CHANGELOG `0b6ab3da` + pointer `0891b815`); ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc580-conditions-type-to-search/`. SC-580 moved to Done via linear-post.py `--state Done`; verified status Done (completedAt 2026-11-12T11:32:56Z). Follow-up: SC-613 (Backlog).
