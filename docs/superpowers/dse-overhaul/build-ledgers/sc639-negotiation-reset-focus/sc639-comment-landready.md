After you choose Reset in a negotiation's options menu, keyboard focus now stays on the card. It lands on the ⋮ button of the reset card, so the next Tab moves to the Patience seals instead of jumping to the top of the note. This works in Reading view and in Live Preview. The fix is ready to land and needs nothing from you.

![Reset card with focus on the ⋮ button]({{IMG:r2-ring-keyboard-card.png}})

*After a keyboard Reset in real Obsidian, the ⋮ button in the top-right corner of the card has a thin teal outline ring: that ring is the keyboard focus. Before the fix, focus was on the page and no control on the card had a ring. Ignore the "Patience 1" tooltip, which is left over from the test pointer.*

**When focus moves.** Focus moves only if it was already on the card when you opened the menu, whether you used the keyboard or the mouse. If you were working somewhere else (the editor, another block, or the second copy of the same negotiation in the note), Reset leaves focus where it was. A Reset of a negotiation you haven't touched also lands on the ⋮ button.

**Redirect if you prefer.** One case is a judgment call. If a Patience seal has focus and you then use the mouse to open the menu and choose Reset, focus lands on the ⋮ button with the ring showing. Before the fix it fell to the page. Say if you would rather a mouse Reset never move focus.

**Two older bugs found along the way.** Both happen on develop as well and are filed in Backlog:
- SC-660: in Live Preview, pressing Escape in the options menu puts focus in the note's text, not back on ⋮.
- SC-661: if the note changes while the options menu is open, choosing Reset shows "Negotiation reset to initial state" but resets nothing.

+++ Details

- **Cause.** Reset redraws the whole card, which removes the focused ⋮ button. Nothing put focus back, so it fell to the page about 40 ms after the key press. In Live Preview, the existing "carry focus across a redraw" code had nothing to carry. Obsidian's menu does not take focus while it is open.
- **Fix.** `src/elements/negotiation/view.ts` and `focusRules.ts`. When the menu opens, it records whether focus was on the card. After Reset redraws the card and before the save, it focuses the new ⋮ button using the shared `restoreControlFocus` helper. If the ⋮ button is missing, focus goes to the first available of: the Argument tab, the Learn tab, the card itself.
- **Scope.** What Reset resets is unchanged (SC-641 still owns that), and `NegotiationData.ts` is untouched.
- **Tests.**
  - The SC-439 markers K05, NEGO-F01 and NEGO-L03 are now plain tests.
  - New e2e tests: NEGO-F05 to F08 and NEGO-L07 to L09.
  - 9 new jsdom tests, including one that checks whether the focus ring is shown.
  - An independent review probed it in real Obsidian and found nothing blocking.
- **Gates** on dse `a9f0af1d` (on develop `5f962390`):
  - tsc and lint clean
  - jest 13354 passed / 1 skipped (13353 / 2 on a fresh worktree)
  - lifecycle 64/64
  - e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`
  - shots 592; freeze 280/280; parity 0/0/24
- **Commits.** Superproject `3814730a` (CHANGELOG) and `6f657662` (pointer bump), on workspace main `f97c41bc`.

+++
