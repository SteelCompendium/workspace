# SC-639 decisions ledger — Negotiation: Reset drops keyboard focus to the page

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus
  (superproject at workspace origin/main f770cc3b; dse branch sc639-negotiation-reset-focus @ develop e1be1775)
Lifecycle id reserved if needed: G-S139

## Ticket requirement (from the SC-639 description, 2026-11-14 — no comments on the ticket)

> **What happens:** focus the negotiation's options button, open the menu and choose Reset. After the reset,
> keyboard focus is on the page, not on the card: the next Tab starts from the top of the note.
>
> Confirmed in real Obsidian in both Reading view and Live Preview.
>
> **Expected:** focus returns to the options button (or another control on the same card).
>
> Seal, chip and Spent clicks keep focus; only Reset loses it, because Reset rebuilds the whole card and destroys
> the focused button.

Agent notes (ticket): `src/elements/negotiation/view.ts` — `resetNegotiation` → `update()` rebuilds the view.
Reproduced in jsdom (`document.activeElement` is `<body>`).

Markers to flip to plain tests (left by SC-439): e2e `NEGO-F01` (`e2e/specs/negotiation/focus.e2e.ts`, Reading view),
`NEGO-L03` (`e2e/specs/negotiation/live-preview.e2e.ts`, Live Preview), jsdom `K05`
(`test/dom/elements/negotiation-bugs.test.ts`).

Baseline at dse develop e1be1775 (dispatcher, 2026-11-15): jest 13327 passed / 2 skipped fresh · lifecycle 64/64 ·
e2e `596/611 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak
40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Scott rulings

(none yet)

## Owner decisions

- 2026-11-15: No decision needed from Scott up front — the ticket names the landing spot: the options button (the
  ⋮ button) of the rebuilt card. Owner ruling: after Reset, focus goes to the NEW card's options button. Fallback
  only if that button is absent (SC-641 may hide Reset, not the button; still guard it): the card root / the first
  focusable control of the card, via the kit helper's fallback chain.
- 2026-11-15: Prior-art rule (SC-614 / SC-585 / SC-613 / SC-626 / SC-642): focus is moved only when it was inside
  the card before the action (here: on the options button when the menu opened, or inside the card). A Reset with
  focus elsewhere never pulls focus in. Mouse path: a mouse click on ⋮ moves no focus in real Obsidian (click
  shield); the implementer reports what a mouse-chosen Reset does and whether focus moves; owner rules after r1.
- 2026-11-15: Scope fence. Change WHERE focus goes after Reset, not WHAT Reset does (SC-641 parked on Scott will
  change Reset's defaults and may hide Reset). Do not touch `src/model/NegotiationData.ts`. Stay out of SC-649's
  files (power roll counts, chosen-motivation matching: `ArgumentView.ts` roll code, motivation matching). Reuse
  `src/framework/kit/controlFocus.ts` (SC-626 / SC-642).
- 2026-11-15: Live Preview: Reset writes the note, so LP remounts the block; SC-602's carry
  (`src/framework/host/livePreviewFocusCarry.ts`) records the focused control just before the old copy is removed.
  If focus is already on the new options button by then, the carry should hand it on. Implementer verifies in LP e2e.

## Rounds

- 2026-11-15: worktree created (`just wt-new`), dse at e1be1775, superproject at f770cc3b.
- 2026-11-15: ticket Backlog -> Awaiting (save_issue by state name "Awaiting" took; verified in response).
- r1 implementer (Sonnet, agent a3085b0ce0f8b9a8b): brief sc639-brief-r1-implementer.md. Dispatched 2026-11-15.
- r2 reviewer brief drafted (sc639-brief-r2-reviewer.md; placeholders filled after r1).
- 2026-11-15: Dispatcher: new baseline — SC-631 landed; dse develop 2777484c, workspace main 0a6aaebf. Numbers at 2777484c:
  jest 13334 passed / 2 skipped fresh · lifecycle 64/64 · e2e `597/612 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`
  · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Must rebase dse onto 2777484c and put the superproject branch on current workspace main (CHANGELOG commit + ONE pointer
  bump) before land-ready. Owner: SC-631's 5 files are all montage (LogActionModal, model, montage tests, log-modal e2e);
  no overlap with negotiation. r1 continues on e1be1775 undisturbed; the rebase goes into the fix/final round.
- 2026-11-15: r1 DONE on dse 8ef9b641 (fix 5d17cd17, tests 8ef9b641; on e1be1775). Mechanism: the menu moves no DOM
  focus (⋮ keeps it while open; Escape changes nothing); choosing Reset rebuilds the card via update(), the old button is
  detached, focus falls to BODY ~37 ms after the Enter; LP carry sees nothing to carry. Fix: capture "focus in card" at
  menu OPEN; after rebuild and BEFORE persist(), kit restoreControlFocus -> new `negotiation.menu` button; fallbacks
  `negotiation.tab.argument`, `negotiation.tab.learn-more`, card root (tabindex=-1). Gates: jest 13335/2 fresh; lifecycle
  64/64; e2e `603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; shots 592/163/978/40/240/147; freeze 280/280;
  parity 0/0/24. Flipped K05, NEGO-F01, NEGO-L03; new 8 jsdom, e2e F05 F06 F07 L07 L08. Mutants M1-M4 red.
  Owner rulings:
  - ACCEPT landing spot: the rebuilt card's options button (the ticket's stated expectation).
  - Mouse path ACCEPT as is: focus on the page + mouse Reset -> stays on page (no pull-in); focus on a card control
    (e.g. a seal) + mouse press on ⋮ + mouse Reset -> new ⋮ button (was BODY). Focus was inside the card, so keeping it
    in the card is the rule's intent; no isKeyboardClick special case. Reviewer to probe the visible focus ring there.
  - Follow-up "Space-opened menu ignores an ArrowDown sent ~9 ms after open" (driver race; r1's resetFromKeyboard waits
    300 ms): DROP — test-driver only, already handled in the helper; SC-659 (Space-opened menu, first Escape) is the
    filed product-side cousin.
  - Follow-up "dse-verify CURRENT numbers": DROP as worker work — owners don't edit SKILL.md; the dispatcher records
    CURRENT at landing from my land-ready numbers.
- r2 reviewer (Opus): brief sc639-brief-r2-reviewer.md, head 8ef9b641, base e1be1775.
- r2 reviewer agent a4a46cd240c97ef4f dispatched 2026-11-15. r3 (fix + rebase + superproject) brief drafted: sc639-brief-r3-implementer.md.
- 2026-11-15: r2 DONE (agent a4a46cd240c97ef4f) on 8ef9b641: verdict LAND, 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 5 INFO. Real
  Obsidian RV+LP: keyboard Reset lands on the new ⋮ button with the focus ring (2 px solid outline), stable to 2.5 s; no
  pull-in, no twin cross-talk; revert probe red as expected. Gates match r1 (jest 13335/2; e2e 603/616, 13 known-bug, 417/417).
  Owner rulings:
  - LOW-1 (mouse-from-seal path has jsdom-only coverage): FOLD into r3 — add e2e NEGO-F08 (RV) and NEGO-L09 (LP).
  - LOW-2 (no test checks the focus ring; `ring: focusAtOpen.ring` at view.ts:204 survives a mutant): FOLD into r3 —
    `ring` in `focusState`/`focusAnywhere` (`:focus-visible`), assert ring true in F01, L03, F08, L09.
  - INFO-1 (LP Escape from the options menu sends focus to the editor; pre-existing): FILED SC-660 (Backlog, Low,
    related SC-639, SC-659). Out of scope for r3.
  - INFO-2 (Reset from a menu left open across an outside edit shows the Notice but resets nothing; pre-existing):
    FILED SC-661 (Backlog, Low, related SC-639, SC-656). Out of scope for r3.
  - INFO-3/4/5: no action (INFO-5 numbers carried into the r3 brief as expectations, to be re-measured).
- r3 = resume r1 implementer (a3085b0ce0f8b9a8b; author of r1, fixing review findings — not a review). Brief
  sc639-brief-r3-implementer.md. Scoped re-review of the r3 delta goes to the r2 reviewer identity (a4a46cd240c97ef4f)
  — it did not author anything.
- 2026-11-15: Dispatcher: new baseline — SC-649 landed; dse develop 5f962390, workspace main ae594671. Numbers at 5f962390:
  jest 13345 passed / 1 skipped with shots cache (fresh 13344 / 2, derived) · lifecycle 64/64 · e2e `598/613 ok, 0 failed,
  15 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
  280/280 · parity 0/0/24. SC-649 overlaps SC-639 in e2e/driver/negotiation.ts and test/dom/elements/negotiation-bugs.test.ts
  (conflicts possible; keep both). Course correction sent to r3 (mid-round; it had rebased to 2777484c, head d81fa753):
  rebase onto 5f962390, superproject on current origin/main, full battery on the final head.
- 2026-11-15: r3 DONE (a3085b0ce0f8b9a8b). dse a9f0af1d on 5f962390 (pushed): 9ff629eb fix, cf40dd36 tests, a9f0af1d
  LOW-1/LOW-2 tests. No rebase conflicts. Superproject on origin/main f97c41bc: 3814730a CHANGELOG, 6f657662 ONE pointer
  bump to a9f0af1d (not pushed). LOW-1: e2e NEGO-F08, NEGO-L09 added. LOW-2: ring asserted in F01/L03/F08/L09, but the
  `ring: false` mutant survives in real Obsidian (script focus after any earlier key press shows the ring anyway); pinned
  by a new jsdom test spying `focus()` options (red on mutant). Owner: ACCEPT — the jsdom pin closes the mutant; the e2e
  ring assertions still guard the user-visible ring. Gates on a9f0af1d: tsc/lint clean; jest 13354/1 with shots cache
  (13353/2 fresh); lifecycle 64/64; e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; shots 592,
  163/978, 40/240, 147; freeze 280/280; parity 0/0/24.
- r4 scoped re-review: resume r2 reviewer a4a46cd240c97ef4f, brief sc639-brief-r4-rereview.md.
- 2026-11-15: r4 scoped re-review DONE (a4a46cd240c97ef4f): LAND, 0 BLOCKER/HIGH/MEDIUM/LOW, 2 INFO (keep e2e ring
  assertions; L09 script-focuses the seal per LP convention) — no action. Rebase patch-identical; superproject exactly 2
  commits on f97c41bc, gitlink a9f0af1d. Re-measured: jest fresh 13353/2; e2e `607/620 ok, 0 failed, 13 known-bug,
  coverage: 417/417 pairs`. Verified by owner: origin/develop 5f962390, origin branch = a9f0af1d, origin/main f97c41bc.
- LAND-READY: dse branch sc639-negotiation-reset-focus @ a9f0af1d (pushed) on develop 5f962390; superproject branch
  sc639-negotiation-reset-focus 3814730a (CHANGELOG) + 6f657662 (pointer bump) on workspace main f97c41bc (not pushed).
- 2026-11-15: land-ready comment posted on SC-639 (1 image: r2-ring-keyboard-card.png). State left Awaiting; dispatcher lands, then Done via linear-post.py --state Done. Mouse-from-seal ruling offered to Scott for redirect (no ask; no Needs Review).
