The fix is ready to land. When an outside change closes a Montage window, a Notice now says why, and keyboard focus goes back to the button that opened the window.

This is the same behaviour initiative got in SC-608:

- The windows covered are Log an action, the edit sheet of a logged action, Add a hero (from the toolbar or the board corner) and Set limits. It works in Reading view, Live Preview and the pinned sidebar.
- The Notice reads "The note changed outside, so this window closed without saving". What you typed is dropped, so it can never overwrite the outside change.
- If the opening button is gone after the redraw (for example, the outside change removed that hero), focus goes to Log an action, or to End round when Log is not available. It never drops to the page.
- A window opened with the mouse shows the Notice but leaves focus where it was, as in SC-608.
- No Notice appears for the Montage's own saves, for Escape, or for a change elsewhere in the note. In those cases the window stays open and its save still writes.

Two things changed beyond the ticket. You may want to veto them:

1. **Pinned sidebar data loss, fixed here.** In the pinned sidebar (experimental), a Montage window stayed open after an outside change, and its save then wrote nothing to the note, silently. SC-608 found and fixed the same bug for initiative. The window now closes with the Notice when the Montage changed. When the change was elsewhere in the note, it stays open and saves.
2. **Initiative gets one extra Notice.** Take a note with two trackers, where one outside change deletes the tracker above the open one and also changes the open one. That case used to close the window silently. It now shows the Notice. The code is shared, so the fix covers both.

One deliberate gap: if an outside change deletes the window's own Montage while another Montage stays in the note, there is no Notice. The Montage disappearing is the visible signal, as ruled for SC-608.

Filed from the review (all Backlog, none block this):

- SC-662: in the pinned sidebar, an outside change can lose a pending save in Conditions, the stamina bar and the Montage. Medium priority; this predates SC-650.
- SC-663: in the pinned sidebar, the board-corner Add a hero button is 0 px wide, so Tab cannot reach it.
- SC-666: with two Montages or trackers inside one callout, an outside change to the first closes the second's window with no Notice.
- SC-667: in Live Preview, after a Montage save inside a callout, the editor sometimes takes focus and shows the callout as raw markdown. This predates SC-650.
- Not filed: in Live Preview, a window opened during the 400 ms after a save is closed by that save. That is the known bug SC-384. Focus now returns to the opener there instead of dropping to the page.

For SC-656 (the negotiation version, with no window): the review says the SC-650 hand-off code carries over. Negotiation would also need to record which button had focus while focus is still in the card, because in Reading view the old card has already left the page by the time it unloads.

+++ Agent notes

* dse branch `sc650-montage-outside-edit-window` @ `42c26272` on develop `fcc7278e` (15 commits). Superproject branch: CHANGELOG commit + ONE pointer bump on workspace origin/main.
* Gates at `42c26272` (independent reviewer, r8): tsc/lint clean · jest 13448 passed / 1 skipped · e2e `622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (MONT-OW01..09 new, INIT-W 13/13) · lifecycle 64/64 (7 parts) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
* Red on base: jest 23/29 of the first set, e2e MONT-OW 8/9 (OW06 own-write guard green). Every mutant killed across 4 review rounds (X4/X5/X12, G2-G7, H1/H3/H8).
* Mechanism: `src/framework/chrome/windowHandoff.ts` reused (SC-608). The montage publishes a window root and hands off at unload. `WindowSlot.before`/`beforeContents` (roots and their content at window open) replace a timing guess for the "the card's position changed" case. Sidebar: close only when the block changed.
* Ledger: `.superpowers/sdd/sc650-montage-outside-edit-window/decisions.md` (preserved at landing).

+++
