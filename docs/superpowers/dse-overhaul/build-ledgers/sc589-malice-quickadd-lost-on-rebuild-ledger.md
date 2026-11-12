# SC-589 decisions ledger — initiative: a half-typed Malice quick-add is lost when you press Advance round

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild (every submodule on branch `sc589-malice-quickadd-lost-on-rebuild`)
Base: dse `develop` @ `e0e49d4d`

## Spec (ticket description, verbatim, 2026-11-11)

> Type an amount (and label) into the Malice quick-add boxes, then press Advance round before Add. The tracker rebuilds and both boxes come back empty; what was typed is gone.
>
> Found by the SC-437 review. Low.
>
> Agent notes: Same whole-tracker rebuild as the focus bug filed alongside this one (`src/elements/initiative/view.ts:163-170`); the quick-add inputs are not carried across it. SC-437 carries a marker citing this ticket.

The marker: `test/dom/elements/initiative-matrix.test.ts:1119-1129`, `test.failing('[M10] a half-typed quick-add survives Advance round [known bug SC-589]')`. No e2e known-bug marker cites SC-589 (e2e known bugs at base: SC-257, SC-355, SC-384, SC-580).

## Baseline at `e0e49d4d`

jest 7304 passed / 2 skipped (fresh worktree) · lifecycle 56/56 · e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Scott rulings

(none — the ticket is fully specified; no decision needed so far)

## Owner rulings

- 2026-11-11 — Behaviour: what is typed in the two quick-add boxes (amount and label) is a per-view DRAFT. It survives EVERY whole-tracker rebuild of the same tracker view — Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, the - / + Malice stepper, any other `rebuildAndPersist`/full rebuild path, and collapsing/expanding the Malice section. It is cleared only by a successful Add (button or Enter), exactly as today. It is never written to the note. It does not need to survive a remount (closing and reopening the note, a new view instance).
- 2026-11-11 — Everything derived from the boxes (the hint text, the Add button's enabled state, any validation styling) is recomputed from the restored draft, so the restored boxes look exactly as if the user had just typed into them.
- 2026-11-11 — If keyboard focus was inside one of the quick-add boxes when the rebuild happened, SC-588's focus restore already returns focus there; the caret position / selection is restored too.
- 2026-11-11 — The jest marker `[M10] … [known bug SC-589]` becomes a plain passing test (drop `test.failing` and the `[known bug SC-589]` suffix). Add jest cases for the other rebuild paths named above and for "Add clears the draft".
- 2026-11-11 — Real-Obsidian coverage goes in e2e (`e2e/specs/initiative/`), not lifecycle: type amount + label, press Advance round, both boxes still hold the values; then Add commits it and the boxes are empty. Never put a bracketed ticket id in an e2e test title (the runner reads titles for scenario ids). No new lifecycle scenario (G-S93 reserved only if e2e cannot express it; never a new G-S64 phase).
- 2026-11-11 — Docs: a bullet under `## Unreleased` in the workspace CHANGELOG (in the worktree superproject) and the dse CHANGELOG, matching SC-588's style.

## Rounds

- r1 (2026-11-11) — implementer (orchestration:implementer, identity A) dispatched on `sc589-brief-r1-implement.md`; report → `sc589-r1-impl-report.md`.
- r1 DONE (2026-11-11) — dse HEAD `d12e4675` (fix `d2885e05`, jest `ecc3deb8`, e2e/manifest/dse CHANGELOG `d12e4675`) on `e0e49d4d`; superproject `f8418870` (CHANGELOG). Gates: tsc/lint clean · jest 7323 / 2 skipped fresh (+19) · lifecycle 56/56 · e2e `271/275 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · styles.css sha256 identical to base → shots/freeze/parity carry. Draft on the view (`quickAddDraft`), captured in `update()`, restored in `buildMaliceQuickAdd`; stepper and log disclosure are partial updates. New e2e INIT-M10.
  - Follow-up "an unparseable `type=number` entry (e.g. `1e`) reads as `''` and is lost on rebuild" → DROP: the browser exposes no raw text for an invalid number input; nothing to restore, and Add rejects it anyway.
- r2 (2026-11-11) — independent reviewer (orchestration:reviewer, identity B) dispatched on `sc589-brief-r2-review.md`; report → `sc589-r2-review-report.md`.
- r2 DONE (2026-11-11) — reviewer verdict FIX (wording) / no code defect; 0 HIGH / 1 MEDIUM / 2 LOW / 4 INFO; reviewer gates at `d12e4675` match r1 (jest 7323/2, lifecycle 56/56, e2e 271/275 · 0 failed · 4 known-bug · 169/169, styles.css identical).
- Owner rulings on r2 (2026-11-11):
  - MEDIUM-1 (Live Preview: draft restored, then lost ~0.4 s later when the tracker's own write redraws the widget as a new view) → option (a), the SC-588 precedent: qualify both CHANGELOG entries to Reading view (and the pinned sidebar tracker) and add one sentence that in Live Preview the boxes are still emptied when the note saves a moment later (SC-605). FILED **SC-605** (Backlog, related SC-589 + SC-602). Not widened here: the cause is the host's Live Preview redraw, same family as SC-602.
  - LOW-1 (sidebar outside-write refresh via `SidebarPanel.ts:321` `previous.update(model)` keeps the draft but drops focus + caret to `<body>`) → FOLD, reviewer's prescribed fix: in the `update()` override wrap `super.update(model)` with `captureControlFocus(this.rootEl, FOCUS_FAMILIES)` before and `restoreControlFocus(...)` after, only when `model !== this.model` (the outside path); restore is a no-op when focus was outside the tracker (SC-588's never-pull-focus rule holds). Caret restore must work on this path too. jest case required; e2e case if the sidebar is reachable in e2e cheaply, otherwise say so.
  - LOW-2 (real Chromium restores selection start/end but not direction; jest Q12 asserts a jsdom-only result) → FOLD: drop `direction` from the stored caret and from Q12 (restore start/end only).
  - INFO Q07 title overstates "a note change" → FOLD: retitle to what it tests.
  - INFO dse-verify CURRENT needs 271/275 (or the new number) at land → dispatcher's landing bookkeeping; relay in land-ready.
  - INFO view replaced on outside write in Reading view / another pane / hover preview loses the draft → no action (remount ruling; base identical; nothing corrupted).
- r3 (2026-11-11) — implementer identity A resumed with the r2 fold list; report → `sc589-r3-impl-report.md`.
- r3 DONE (2026-11-11) — dse HEAD `853f3f18` (LOW-1/LOW-2 fix `97f20b77`, jest `a3ee43d4`, e2e INIT-M11 `c0cedef0`, dse CHANGELOG `853f3f18`); superproject `f8796a1f`. LOW-1 wrapper skips Reset encounter's re-parse via a private `resetRebuild` flag (that path restores focus itself after `inert` lifts). Gates: tsc/lint clean · jest 7326/2 fresh · lifecycle 56/56 · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · styles.css sha256 unchanged → shots/freeze/parity carry. Red-first: Q15 x2 and e2e INIT-M11 red on r1 code.
- r4 (2026-11-11) — scoped re-review of `d12e4675..853f3f18` by reviewer identity B (did not author the fix); report → `sc589-r4-rereview-report.md`.
- r4 DONE (2026-11-11) — re-reviewer verdict LAND; 0 HIGH / 0 MEDIUM / 1 LOW / 3 INFO; gates at `853f3f18` match r3 (jest 7326/2, lifecycle 56/56, e2e 272/276 · 0 failed · 4 known-bug · 169/169, styles.css unchanged). No double restore; never pulls focus in (PRB589-21).
- Owner rulings on r4 (2026-11-11):
  - LOW-1 (`resetRebuild` flag untested: removing it, or deleting its clear in `finally`, both survive the 171 matrix tests) → FOLD as a test-only r5: one Q case (Reset encounter → Yes, then an outside `update()`/`refresh()` with the label focused at (2, 5) → focus on the label and selection [2, 5]); plus whatever case kills the "flag removed" mutation. Must kill both mutations (show it). src unchanged → only jest re-runs; lifecycle/e2e/shots/freeze/parity carry from r3/r4. Owner reviews the test-only diff (no runtime code).
  - INFO-1/INFO-2 → no action. INFO-3 (dse-verify CURRENT 272/276) → dispatcher's landing bookkeeping.
- r5 (2026-11-11) — implementer identity A resumed, test-only; report → `sc589-r5-impl-report.md`.
- r5 DONE (2026-11-11) — dse HEAD `b5d18f79` (test-only, +29 lines in `initiative-matrix.test.ts`: Q17, Q18); mutations a1/a2 (flag read/set removed) fail Q18, b (finally clear deleted) fails Q17; HEAD matrix 173/173. jest 7328/2 fresh, tsc/lint rc 0. Owner reviewed the test diff: OK. `origin/develop` still `e0e49d4d`.
- LAND-READY (2026-11-11) — dse `b5d18f79`, superproject `f8796a1f` (dse pointer bump unstaged, for the land step). Gates: jest 7328/2 fresh · lifecycle 56/56 · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` · shots 592 / host-leak 163/978 / modal 39/234 / clip 147 / freeze 280/280 / parity 0/0/24 carried (styles.css sha256 5e5ff488…2b27 identical to base). Landing bookkeeping for the dispatcher: dse-verify CURRENT → 7328/2, 272/276 · 169/169; preserve this ledger dir to build-ledgers.
