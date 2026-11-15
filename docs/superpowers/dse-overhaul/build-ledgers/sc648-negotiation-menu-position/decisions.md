# SC-648 decisions ledger — Negotiation: opening the options menu with Enter shows it at the top-left corner of the window, not beside the button

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position
  (superproject at workspace origin/main 7219b96d; dse branch sc648-negotiation-menu-position @ develop 09c879f2)
Lifecycle id reserved if needed: G-S137

## Ticket requirement (from the SC-648 description, 2026-11-14 — no comments on the ticket)

> **What happens:** Tab to a negotiation card's ⋮ options button and press Enter. The menu (with "Reset
> negotiation") opens in the top-left corner of the Obsidian window, far from the card. A mouse click opens it
> beside the button, as expected.
>
> **Expected:** the menu opens beside the button however it was opened.

Agent notes (ticket):

> Measured (Reading view, `Negotiation/basic.md`): keyboard menu rect x 2, y 2; button at x 1179, y 275; mouse
> click opens at x 1193, y 288.
>
> Cause: `src/elements/negotiation/view.ts:152` calls `m.showAtMouseEvent(event)`; a click synthesised from the
> keyboard has `clientX` / `clientY` 0. Fix shape: when `event.detail === 0`, `showAtPosition({ x: rect.left,
> y: rect.bottom })` from the button's rect. Only call site of `showAtMouseEvent` in `src/`.
>
> Marker (SC-439): e2e `knownBug` on the Enter path asserting the menu opens near the button.

Marker to flip to a plain test: e2e `[NEGO-R06]` in `e2e/specs/negotiation/reset.e2e.ts` (line ~92 at 09c879f2).

## Scott rulings

(none)

## Owner decisions

- 2026-11-14: No decision needed from Scott — the ticket states the expected behaviour and the fix shape.
- 2026-11-14: Scope is the menu's POSITION only. SC-641 (parked on Scott) may hide the Reset item in this same
  menu; do not touch the menu's items. SC-639 (Reset drops focus) and SC-640 are queued — do not fix them here.
  SC-649 (parallel owner) works on the negotiation power roll: stay out of its files (anything under the roll /
  `NegotiationData` standing math); `view.ts` is ours only around the options-menu block.
- 2026-11-14: Mouse path stays exactly as it is (`showAtMouseEvent`) — the ticket calls it correct. The keyboard
  path (`event.detail === 0`, Enter or Space) anchors to the button's rect, in the button's own document
  (sidebar / popout windows: pass `buttonEl.ownerDocument` / its window to `showAtPosition` if the API takes it).
- 2026-11-14: Shared-chrome survey (owner, grep at 09c879f2): `new Menu(` and `showAtMouseEvent` each have
  exactly one call site in `draw-steel-elements/src` — this negotiation button. No other element opens an
  Obsidian Menu, so no sibling element has this bug. The only other pointer-coordinate use in `src/` is
  `src/refs/sccLinkCm6.ts:38` (`posAtCoords` from a CM6 link click), which is not a menu. Reviewer to confirm.
- 2026-11-14: Gates — full dse-verify battery. `styles.css` is not expected to change; if it is byte-identical to
  a clean 09c879f2 build, shots / freeze / parity carry (same rule prior owners used), else run them.

- 2026-11-14: r1 fix form: `showAtPosition({ x: rect.left, y: rect.bottom }, button.ownerDocument)` on
  `isKeyboardClick(event)`; `width` dropped (it shifted the menu right off the button). New e2e NEGO-R07 (Space),
  NEGO-R08 (mouse regression), NEGO-L06 (Live Preview Enter); NEGO-R06 flipped; new pair negotiation.menu x press:Space.
- 2026-11-14: r1 follow-up (Space-opened menu ignores the first Escape ~4/10, pre-existing on 09c879f2) -> filed
  **SC-659** (Backlog, Low, related to SC-648). Out of scope here; NEGO-R07's multi-Escape close is the accepted
  workaround until SC-659.

- 2026-11-14 (dispatcher relay): SC-629 landed; dse develop is now **3e88b3f5**, workspace main **dc16b57d**.
  Before land-ready: rebase dse onto 3e88b3f5; superproject branch on current workspace main with the CHANGELOG
  commit and ONE pointer bump. New baseline at 3e88b3f5: jest 13325 passed / 2 skipped fresh (13326 / 1 with the
  shots cache) · lifecycle 64/64 · e2e `592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs` · shots 592,
  host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  Owner plan: let r2 finish on 544fd4e0 (same worktree; rebasing mid-battery would corrupt it), then fold the
  rebase into the fix round (r3), re-run the battery on the rebased head, scoped re-review (r4). Expected after
  rebase: jest 13327 / 2, e2e 596/611 ok, 0 failed, 15 known-bug, coverage 417/417.
- 2026-11-14: r2 rulings — LOW-1 FOLD (e2e helper bottom-edge check); INFO-2 FOLD as a comment correction only
  (keep the call); INFO-1 DROP (matches Obsidian's own menus and the mouse path); INFO-3 DROP (unreachable from the
  keyboard); INFO-4 = the rebase. Shared-chrome survey confirmed by r2: no other element has the bug.

## Rounds

| Round | Role | Agent | Result |
|---|---|---|---|
| r1 | implementer | a9a066df2cd4108b6 (Sonnet) | DONE: dse 544fd4e0 (8f1efdf5 fix, 544fd4e0 tests), CHANGELOG 64b43026; jest 13319/2, lifecycle 64/64, e2e 595/611 ok 0 failed 16 known-bug 417/417; styles.css 18730938…f1f9 identical |
| r2 | reviewer | a2acbcbee7ee296e0 (Opus) | LAND-READY on 544fd4e0: 0H 0M 1L 4I; re-ran battery = r1 numbers; revert probe red; sidebar + popout probes OK; shared-chrome survey confirmed |
| r3 | implementer (resume a9a066df2cd4108b6) | DONE: dse e1be1775 on 3e88b3f5; super 116ee03b (f4c4a81a CHANGELOG, 116ee03b bump) on origin/main 7cea83eb; jest 13327/2, lifecycle 64/64, e2e 596/611 ok 0 failed 15 known-bug 417/417; styles.css = clean 3e88b3f5 build | fold LOW-1 + INFO-2 comment, rebase 3e88b3f5 / dc16b57d, one pointer bump — brief sc648-brief-r3-implementer.md |
| r4 | reviewer (resume a2acbcbee7ee296e0) | LAND-READY on e1be1775 / super 116ee03b: 0H 0M 0L 1I (blank line in CHANGELOG, harmless — drop); nego e2e 61/67 ok 0 failed 6 known-bug | scoped re-review — brief sc648-brief-r4-rereview.md |

## Land-ready (2026-11-14)

dse branch sc648-negotiation-menu-position @ e1be1775 on develop 3e88b3f5; superproject branch @ 116ee03b on workspace origin/main 7cea83eb (f4c4a81a CHANGELOG, 116ee03b one pointer bump). jest 13327/2 · lifecycle 64/64 · e2e 596/611 ok, 0 failed, 15 known-bug, 417/417 pairs · styles.css = clean 3e88b3f5 build, so shots 592 / host-leak 163/978 / modal host-leak 40/240 / capture clip 147 / freeze 280/280 / parity 0/0/24 carry. No lifecycle id used (G-S137 free). Follow-up filed: SC-659.
