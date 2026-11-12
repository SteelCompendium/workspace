After Apply in the minion Stamina pool window, keyboard focus now goes back into the initiative tracker instead of to the top of the page. This holds in Reading view and in the pinned sidebar tracker. The fix is reviewed and ready to land; nothing is needed from you.

**What you will see.** Select a minion, Tab to the detail row's Stamina control, press Enter, type damage, press Enter. Focus is back on the Stamina control, with its focus ring. If you opened the window by double-clicking a roster cell that had keyboard focus, focus returns to that minion's cell.

**Also fixed by the same change.**
- Closing the Conditions window after an edit puts focus on the Add Condition button. Before, it went to the top of the page.
- A captain's Stamina edit that turns the squad bonus on or off rebuilds the whole tracker. Focus now returns to the Stamina control there too.
- Removing a condition inside the pool window, then closing it with X or Escape, returns focus to the Stamina control.

**Unchanged.** Cancel and Escape still return focus to the button you pressed. A window opened while focus was outside the tracker (for example, a pure mouse double-click) does not pull focus into the tracker when it closes.

**Roster cells open the Stamina edit only on double-click. That is not a keyboard gap.** From the keyboard: Tab to the cell, Enter selects it, Tab to the detail row's Stamina control, Enter opens the same window. A new e2e test covers this route.

**Not fixed here.**
- Live Preview: focus comes back, then is lost about half a second later when the note saves. That is SC-602.
- SC-608 (new, Backlog): if the note changes from somewhere else while one of these windows is open, the window closes and focus goes to the page. This happened before this change too.
- SC-609 (new, Backlog): with focus on the detail row's Stamina control, a mouse click on another roster cell drops focus to the page. No window is involved, and this also happened before this change.

---

Mechanics:
- dse branch `sc603-focus-after-pool-apply` @ `5f7c5336` on `develop` `da2bdbc6`; superproject CHANGELOG @ `9d1568ec`.
- Fix: `src/elements/initiative/view.ts` `openModal` captures the focus token (`controlFocus.ts`) before any tracker window opens and restores it one microtask after the window closes. Obsidian's `Modal.close()` refocuses the opener synchronously, and does nothing when the opener was replaced by the rebuild. Reset encounter keeps its own SC-588 path. `managedModal.ts` untouched; no interaction with SC-598 (checked on its base).
- Tests: 14 jest cases (initiative matrix group F; F08, F09, F13, F16, F17 red on the base; F18 red with the "focus not in the tracker" guard removed); e2e INIT-F07..F12 (F07, F08, F11 red on the base). Coverage pairs 169 → 171 (`press:Enter` on `sedit.apply` and `init.cell.stamina`).
- Gates at `5f7c5336`: tsc / lint clean · jest 7685 passed / 2 skipped · lifecycle 58/58 (six parts) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (known bugs SC-257, SC-355, SC-384, SC-580) · `styles.css` byte-identical to the base, so shots 592, freeze 280/280 and parity 0/0/24 carry.
- Pipeline: implementer → independent review (LAND; 0 high, 0 medium, 2 low test gaps folded, 2 pre-existing gaps filed as SC-608 / SC-609) → fix round with two rebases (SC-598, SC-594) → scoped re-review LAND (no new findings; range-diff identical; both new cases red under the mutations).
