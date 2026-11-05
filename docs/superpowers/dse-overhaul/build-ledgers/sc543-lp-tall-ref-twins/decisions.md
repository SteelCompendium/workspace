# SC-543 decisions ledger — LP: two identical tall reference blocks draw only one card

Ticket: SC-543 (Linear). Owner: ticket-owner (Opus 5.5). Worktree: `sc543-lp-tall-ref-twins`
at `/home/scott/code/steelCompendium/worktrees/sc543-lp-tall-ref-twins` (every submodule on
branch `sc543-lp-tall-ref-twins`). dse base: `develop` @ `fb24f8a2`.

## Scott rulings (verbatim, dated)
- 2026-11-05T00:21Z (Linear comment ee7e9f7e, then label Ready for Agent): "If this is not a bug, then we can close this"

## Dispatcher constraints (2026-11-02, from the dispatch message — not Scott rulings)
- "Diagnose in real Obsidian first (it may be Obsidian reusing one widget for identical text,
  possibly unfixable — say so on the ticket if it is)."
- "Overlap: SC-537 (running, near land-ready) adds a Live Preview editor update listener for
  identical callout twins in the twin-reuse code, and SC-522 (running) is in
  livePreviewScrollHold.ts — do not change either area until they land; tell the dispatcher if
  your fix needs them."
- "Lifecycle id G-S58 if you need one; G-S56 runs last, so a new scenario goes before it."
- "At land-ready put proposed dse-verify text in a proposal file (don't edit SKILL.md in the
  branch)."

## CURRENT baselines at dispatch (dse-verify SKILL.md, develop @ fb24f8a2)
tsc + lint clean · jest 6228 passed / 1 skipped / 249 of 250 suites (fresh worktree before a
shots run: one fewer passed, 2 skipped) · lifecycle 44/44 (halves 22 + 22, G-S56 last) · e2e
124/124 ok, 0 failed, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL, button host-leak
157/942 · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## Owner rulings
- 2026-11-02, on r1 (`sc543-r1-diag-report.md`): **not a bug.** Both identical tall `@Outer.md`
  blocks draw their card in Live Preview; CodeMirror 6 keeps only blocks near the visible area
  in the DOM, so a `.cm-embed-block` count at the top or bottom of a note with two ~1529 px
  cards reads 1. Plugin-free control (throwaway plugin, 1800 px div) behaves the same. Owner
  eyeballed `sc543-r1-shot-a-block2.png`: the full Outer card (with nested Ref) is drawn under
  "Middle." No code change, no G-S58, nothing to land. Ask Scott to confirm closing as Canceled.
- 2026-11-02, r1 INFO-2 (cursor inside block 1 hands block 1's live view to block 2, @2656822):
  **dropped** — same Obsidian `R1` hand-off SC-481 diagnosed for plain Live Preview twins; its
  reconcile path resolves via `getSectionInfo` (reads `lineStart`, updated by the rebuild
  @2656948) and G-S53 gates plain LP twin writes. Not SC-543's display question.
- 2026-11-02, r1 INFO (ResizeObserver disconnected on widget destroy, @1764871, read not
  measured): **dropped** — no observed effect; no symptom to chase.
- 2026-11-02: probe lesson ("in Live Preview, scroll each block into view; never count
  `.cm-embed-block`") → proposal for dse-verify in `sc543-dse-verify-proposal.md`, handed to the
  dispatcher (owner does not edit SKILL.md).

## Rounds
- r1 — diagnosis in real Obsidian (orchestration:reviewer, agent a2b4a54291fac85c8, dispatched 2026-11-02). Brief: `sc543-brief-r1-diagnose.md`. Report: `sc543-r1-diag-report.md`.
- r1 done 2026-11-02: verdict NOT A BUG (CM6 viewport). Tree clean, HEAD fb24f8a2, nothing committed.
- 2026-11-02: result comment posted (`sc543-comment-result.md`, one image); ticket In Progress +
  Needs Review asking Scott to confirm close as Canceled. Worktree kept until he answers; on a
  yes: Canceled, then `just wt-rm sc543-lp-tall-ref-twins` (clean) and copy this ledger to
  `docs/superpowers/dse-overhaul/build-ledgers/sc543-lp-tall-ref-twins/` if the dispatcher wants it.
- 2026-11-05: Scott confirmed close. Ticket -> Canceled, labels Needs Review / Ready for Agent
  removed, closing comment posted; worktree removed with `just wt-rm sc543-lp-tall-ref-twins`.
  dse develop at close: d689b719 (no SC-543 code). dse-verify proposal still pending with the
  dispatcher (`sc543-dse-verify-proposal.md`).
