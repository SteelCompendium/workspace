# SC-609 decisions ledger — roster-cell click drops keyboard focus to the page

Ticket: SC-609 (Linear). Owner: ticket-owner (Opus 5.5).
Worktree: /home/scott/code/steelCompendium/worktrees/sc609-roster-click-focus (every submodule on branch `sc609-roster-click-focus`); superproject cut at `bd10dc98` (workspace origin/main at creation); dse cut at develop `231f2a3b`.
Lifecycle id reserved if needed: G-S102 (prefer e2e coverage; see rulings).

## Ticket text (verbatim)

> With keyboard focus on the detail row's Stamina control, a mouse press on another roster cell selects that creature, the tracker rebuilds, and focus falls to the page body instead of staying in the tracker.
>
> Found in the SC-603 review. Already the case before SC-603; no window is involved. Possibly the same family as SC-458 (a click on a roving-tabindex control does not move focus to it). Low (accessibility).
>
> Agent notes: SC-603 r2 review INFO-4 (report preserved to `docs/superpowers/dse-overhaul/build-ledgers/sc603-focus-after-pool-apply/`). SC-588's rule is that a mouse click never pulls focus INTO the tracker; here focus was already in the tracker and is lost.

## Prior art (landed; ledgers in docs/superpowers/dse-overhaul/build-ledgers/)

- SC-588: `controlFocus.ts` — focus goes to the rebuilt control after a whole-tracker rebuild; "A mouse click never pulls focus into the tracker".
- SC-603: focus hand-back after the pool window's Apply and the Conditions window (`openModal` in `view.ts` captures a focus token before a tracker modal opens; restores after close). Its ruling: focus goes where Obsidian itself would have put it had the opener survived the rebuild; if focus was not inside the tracker, restore nothing.
- SC-589.

## Out of scope (parallel owners / other tickets)

- SC-608 (outside edit while a tracker window is open), SC-602 / SC-605 (Live Preview loses focus / draft on an element's own save), SC-458 (click on a roving-tabindex control in a DSE card does not move focus when focus was NOT already there — the general click-shield issue; only touch it if the same one-line mechanism fixes it, and report).
- Parallel owners: SC-607 (hover preview +/- pin code), SC-580 (Conditions window type-to-search; same initiative element, different file). Do not edit their files.

## Scott rulings

(none yet)

## Owner rulings

- 2026-11-12 — Behaviour: when keyboard focus is inside the initiative tracker and a mouse press on a roster cell selects a creature and the tracker rebuilds, focus lands on the REBUILT replacement of the cell that was pressed (the newly selected creature's cell) — where the browser itself would have put focus had the click shield not stopped it and the rebuild not detached it. If focus was NOT inside the tracker before the press, nothing changes (SC-588: "A mouse click never pulls focus into the tracker").
- 2026-11-12 — Scope: the roster-cell press is the ticket. The implementer surveys the other mouse-press paths in the tracker that trigger a whole-tracker rebuild while focus is inside it (the same family: focus inside the tracker, a mouse press, a rebuild, focus on body). If they share the mechanism the roster fix uses, fix them with the same rule (focus on the rebuilt replacement of the pressed control); if they need a different mechanism, report them as follow-ups and leave them.
- 2026-11-12 — Tests: jest case(s) red on the base (shown red), plus real-Obsidian e2e coverage in `e2e/specs/initiative/` (not lifecycle): Tab to the detail row Stamina control, mouse press on another roster cell, assert `document.activeElement` is the rebuilt pressed cell; plus the negative: focus on the note body, mouse press on a roster cell, focus behaves exactly as on the base (today: not pulled into the tracker). SC-458 (Backlog) may later make a click focus its roving target from anywhere; do not pre-empt it, and word the negative test's comment so SC-458 knows it is the one to flip. No bracketed ticket id in test titles.

## Rounds

- r1 (2026-11-12) — implementer dispatched (agent ab1b94912ada4a6ac; brief `sc609-r1-brief.md`): diagnose + fix + tests + full battery. Report: `sc609-r1-impl-report.md`. Review must go to a different identity (orchestration:reviewer).
- r1 DONE (2026-11-12) — dse HEAD `e2537b21` (fix+jest `00ab6d5d`, e2e `02d65c0e`, CHANGELOG `e2537b21`) on `231f2a3b`; superproject `1152d1ec` (CHANGELOG). Fix in the roster cell `onClick` (`view.ts`): `captureControlFocus` before the detail-row swap; after it, if focus is free, `focusControl` the pressed cell. A selection repaints the grid in place (not a whole-tracker rebuild), so the pressed cell survives and gets focus itself. Gates: jest 10715/2 · lifecycle 60/60 · e2e 280/284 ok, 0 failed, 4 known-bug, 171/171 (+INIT-F13, INIT-F14) · shots 592 · freeze 280/280 · parity 0/0/24.
- Owner rulings on r1 follow-ups (2026-11-12):
  - A (condition remove with focus on Add condition → body; `conditionsEl.empty()`, needs SC-603-style restore) → FILED **SC-614** (Backlog, related SC-609 / SC-603). Out of scope.
  - B (focus in a quick-add text box, roster press → body; the shield blurs editables at pointerdown) → FILED **SC-615** (Backlog, related SC-609 / SC-458). Out of scope: it needs an earlier capture or a shield change, which is SC-458 territory.
  - Nuance (focus on a surviving control such as Advance round, roster press → focus stays on Advance round; pinned by jest F22) → DROP: "a click moves focus to its target" is SC-458's general fix; this ticket fixes focus being LOST.
  - "Whole-tracker rebuilds restore the previously focused control, not the pressed one" → DROP: SC-588 behaviour, correct today.
- r2 (2026-11-12) — independent review dispatched (orchestration:reviewer, agent a2d61f9419ca01632; brief `sc609-r2-review-brief.md`).
- r2 DONE (2026-11-12) — review of `e2537b21`: verdict land after one test fix. HIGH 0 · MEDIUM 1 · LOW 2 · INFO 5. Report `sc609-r2-review-report.md`. Reviewer measured jest 10716/1 (shots cache present), e2e 280/284 0 failed 171/171, lifecycle 60/60. jest mutants all caught; product code correct.
- Owner rulings on r2 (2026-11-12):
  - MEDIUM M-1 (e2e INIT-F14 cannot catch focus being pulled in: after `openNote` focus sits on `DIV.markdown-preview-view`, so `focusIsFree` blocks the move regardless of `focusWasInside`; with `focusWasInside` removed F13 and F14 both stay green) → FOLD: INIT-F14 blurs to `<body>` and asserts that start state before the press; show it red with `focusWasInside` removed, green on the fix.
  - LOW L-1 (`view.ts:1861-1862` comment and the F20 title say a mouse press gives "no ring"; real Obsidian shows `:focus-visible` on the pressed cell because Chromium keeps the keyboard ring on a script focus) → FOLD: reword the comment and the F20 title to say what the code does (no forced `focusVisible`), and note that Chromium may still show the ring after a keyboard session. Behaviour accepted as harmless.
  - LOW L-2 (F22 and the `<body>` half of F21 pin behaviour SC-458 will flip, no pointer) → FOLD: one comment line each naming SC-458.
  - INFO I-1 (Live Preview: focus on the cell, then lost ~435 ms later on the tracker's own write; SC-602/SC-605) → FOLD into changelog wording only: qualify both CHANGELOG entries (dse and workspace) to Reading view and cite SC-602, as SC-588 did. Also name SC-614 / SC-615 in the dse entry's "Not covered" sentence.
  - INFO I-2 (mouse Collapse / Pin with focus in the detail row drops focus to body; SC-505 already ruled these) → DROP: SC-505's ruling stands; not a regression.
  - INFO I-3 (focus in the other pane: Obsidian's leaf switch drops focus before DSE runs) → DROP: host behaviour, outside the ruling.
  - INFO I-4, I-5 → no action (passing edge cases; mutants caught).
- r3 (2026-11-12) — fix round: resume implementer ab1b94912ada4a6ac with M-1, L-1, L-2, I-1 changelog wording. Then scoped re-review of the delta by the r2 reviewer (a2d61f9419ca01632; it did not author the fix).
- r3 DONE (2026-11-12) — dse HEAD `622b0904` (INIT-F14 fix `7b038f45`, comments/titles `c326834a`, CHANGELOG `622b0904`); superproject `d1ef100f`. M-1: F14 red under the no-`focusWasInside` mutant, green on fix. jest 10716/1 (shots cache present) · e2e 280/284 ok, 0 failed, 4 known-bug, 171/171. Product code: comment only. Report `sc609-r3-fix-report.md`.
- r4 (2026-11-12) — scoped re-review of the r3 delta (`e2537b21..622b0904` + superproject `1152d1ec..d1ef100f`) by the r2 reviewer.
- r4 DONE (2026-11-12) — scoped re-review: VERDICT LAND, no new findings. M-1 / L-1 / L-2 / I-1 closed; product code comment-only. Report `sc609-r4-rereview-report.md`.
- LAND-READY (2026-11-12) — dse `sc609-roster-click-focus` @ `622b0904` on develop `231f2a3b` (verified ancestor, origin unmoved); superproject @ `d1ef100f` on origin/main `bd10dc98` (verified). Reported to dispatcher.
- DONE (2026-11-12) — LANDED by dispatcher: dse develop `622b0904` (231f2a3b..622b0904); workspace main `b84f0159` (pointer bump `1c27633f`, bookkeeping `5d8681c4`). Ledger preserved to `docs/superpowers/dse-overhaul/build-ledgers/sc609-roster-click-focus/`. Landed comment posted; SC-609 state Done (verified, completedAt 2026-11-12T10:32:26Z). Follow-ups SC-614, SC-615 in Backlog.
