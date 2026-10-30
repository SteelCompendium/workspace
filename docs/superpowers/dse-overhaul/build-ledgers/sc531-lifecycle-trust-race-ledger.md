# SC-531 decisions ledger — lifecycle trust-dialog start-up race

Effort: `sc531-lifecycle-trust-race`. Worktree `/home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race`
(every submodule on branch `sc531-lifecycle-trust-race`). dse base: `develop` @ `4f73043`.

## Scott rulings (verbatim, dated)

(none yet)

## Ticket text (filed by SC-479's owner, 2026-10-24) — the spec

> **What:** `npm run obsidian-lifecycle` exited 2 (environment) before any scenario ran:
> `page eval failed: TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'`
>
> It happened right after `waitFor('!!document.body')` passed, inside the harness's own trust-dialog auto-dismiss
> (`AUTO_DISMISS_TRUST_DIALOG` in `main()` of `visual-harness/obsidian-lifecycle.mjs`). A re-run was clean. It is
> harness code, not plugin code.
>
> **Fix direction:** make the observer start wait until its target is a Node, or retry the page eval once. Exit 2
> already marks it as an environment failure.

Evidence: `.superpowers/sdd/sc479-embed-scroll-pin/sc479-r7-evidence/gate-lc2-attempt1-env.log`.

## Owner decisions (2026-10-29)

- D1. Harness-only. No plugin source change, so shots / freeze / parity are not run; tsc, lint, jest,
  lifecycle (two `--only` halves, 20 + 21) and e2e are (adapter §4: lifecycle + e2e required for every dse change).
- D2. The e2e harness carries a near-copy of the same string (`e2e/driver/recorders.ts`, `AUTO_DISMISS_TRUST_DIALOG`,
  flag `__dseTrustObserver`) but installs it only after an in-page wait for `document.body && layoutReady`.
  It has the same unguarded `observe(document.body …)`; harden it the same way (tiny, gate runs anyway).
- D3. Fix shape: the install string waits IN-PAGE for `document.body instanceof Node` (bounded, clear error on
  timeout) before observing; it stays idempotent; lifecycle `main()` re-asserts the install after `layoutReady`
  (cheap, idempotent; covers an execution-context replacement between the two evals, which would drop the
  window flag and the observer with it).
- D4. Overlap: SC-522 adds lifecycle scenario G-S52 to the same file. Keep this change to the trust-dialog
  constant and the start-up block in `main()` so it rebases cleanly.

## Rounds

- r1 implementer (Sonnet): brief `sc531-r1-brief.md`, report `sc531-r1-report.md`.
- r1 DONE (2026-10-29): dse `4deb8cf` on `4f73043`, 2 files +25/-2. tsc/lint clean; jest 6152/2 skipped/248 of 249
  (fresh-worktree reading); lifecycle 20/20 + 21/21 = 41/41; e2e 124/124, 87/87 pairs. Root-cause probe: 0/5 repro,
  one execution context every launch (weak evidence: probe perturbs timing). Implementer note: the OLD string set the
  window flag BEFORE observe() threw, so a plain retry would have silently skipped observing — the in-page wait is required.
- r1 follow-up rulings (owner): PAGE_HELPERS' unguarded `observe(document.body …)` in both harnesses — DROP: both run
  after the layoutReady wait, never seen failing; if it ever does, the error is loud. Unconfirmed root cause — DROP:
  the fix makes the race self-healing and a recurrence would now surface as the named SC-531 timeout.
- r2 reviewer (Opus): brief `sc531-r2-review-brief.md`, report `sc531-r2-review-report.md`.
- r2 review APPROVE (2026-10-29, Opus): 0 HIGH / 0 MEDIUM / 0 LOW / 4 INFO on `4deb8cf`. Gates re-run: tsc/lint clean,
  jest 6152/2/248 of 249, lifecycle 20/20 + 21/21 = 41/41, e2e 124/124, 87/87 pairs. **Race reproduced in real
  Obsidian 1.15.0**: a document load between the passing body check and the install eval — OLD threw the exact
  TypeError 6/48, NEW 0/48. (Narrows the r1 "root cause unconfirmed" line; the launch-time trigger of that load is
  still unknown.) SC-522 merge simulation: SC-531 adds no conflicts.
- r2 INFO rulings (owner): INFO-1 (page swaps its <body> after a good install: observer watches a detached body) —
  DROP: pre-existing in the old code, never seen in Obsidian. INFO-2 (second load during the NEW wait surfaces as a
  CDP error, still exit 2) — DROP: still classified correctly. INFO-3 (named message only wins because 20 s < the
  30 s cdp.call timeout) — DROP: the inverse case still exits 2 as an environment failure; a comment-only round
  is not worth a re-review. INFO-4 — done (this entry).
- LAND-READY (2026-10-29): dse branch `sc531-lifecycle-trust-race` @ `4deb8cf` on develop `4f73043`; superproject
  pointer not bumped (the land-stack procedure does it).
- DONE (2026-10-29): landed by the dispatcher — dse develop fast-forwarded to `4deb8cf`; workspace main `584bf24d`
  (pointer bump `69a5d2e0`); docs `37201d48` (CURRENT entry at `4deb8cf`, numbers carried; ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc531-lifecycle-trust-race/`). Worktree removed. Ticket -> Done.
