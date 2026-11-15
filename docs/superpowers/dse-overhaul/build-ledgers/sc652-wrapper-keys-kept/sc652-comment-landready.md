A click that saves a block now keeps a `prefs:` line or a `collapsed:` line the plugin cannot use. Before, both were deleted without a warning. The fix is ready to land.

**What is kept**

Every write keeps these lines with the same values. That covers a button in the block, the block edit form's Save, and a write from the sidebar.

- A whole `prefs:` map in its original order, including names the plugin does not know, misspelled names, and names that only work in Settings. A `prefs:` value that is not a map is kept too.
- `collapsed: yes`, `collapsed: 1` and other values that are not `true` / `false`. The same goes for `collapsible:` and `collapse_default:`.

**What does not change**

Nothing changes on screen. These lines still do nothing, and the console warning is the same as before. `collapsed: yes` still leaves the collapse state to the global setting.

Formatting can still change on a write: a `{…}` map may come back as indented lines. That is SC-599's question, which is parked.

**ds-hero**

The independent review found that on a `ds-hero` block, a quoted `"prefs":` line could be written twice, which broke the block. That is fixed. The original SC-514 case (`"prefs": {reduceMotion: true}` written twice) now writes one line.

**Sidebar windows**

The re-review found a side effect in the pinned sidebar, on montage and initiative blocks that have a `prefs:` or `collapsed:` line. If you edited the block in the note in a way the card does not show, its open window (for example Set limits) closed. Adding a comment or changing the `prefs:` value both did it. A "changed outside" notice appeared, and anything typed in the window was lost.

That is fixed: the window now stays open. A real change to what the window shows still closes it with the notice. The same problem already happened before this change for `collapsed: true`, and that is fixed too.

**A `prefs:` map with only Settings-only names**

The SC-662 review found that `prefs: {staminaRecoveryPopover: false}` and `prefs: {collapsibleDefault: false}` were deleted by the first write. That is covered here. Measured in real Obsidian, Reading view and the sidebar: the map is kept, once, after two writes. Before this change it was gone after the first.

**Filed along the way (Backlog)**

- SC-665: the open sidebar card does not pick up an outside edit to `prefs:` / `collapsed:`.
- SC-668: lifecycle gate G-S61 fails on a busy machine, on clean develop too.
- SC-669: a `ds-hero` block whose lines are all indented breaks on any write. This was already broken before this change.

+++ Agent notes

dse `sc652-wrapper-keys-kept` head `bab0dbb2` on develop `42c26272`. Superproject `a5aa9700` on workspace main `2945c3ea` (CHANGELOG `7f7f3eeb`, one pointer bump `a5aa9700`).

Gates at `bab0dbb2`: tsc + lint clean · jest 13607 passed / 1 skipped (shots cache) · e2e `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (new MONT-X15..X18, CTR-K01) · lifecycle 63/64. The one lifecycle failure is G-S61 on its torn-read check only, and it fails the same way on clean `42c26272` on this machine (SC-668), most recently at load 2.55 → 1.25. `styles.css` unchanged, so shots 592, freeze 280/280 and parity 0/0/24 carry.

Changes: `prefOverrides.ts` (the whole `prefs:` value is passed through; a shared `bodyDeclaresTopLevel` guard), `chrome/collapsedKey.ts` (`popped` records every removed key whatever its value), `pipeline.ts` (~3 lines, overlaps the parked SC-644), `FormModal.ts`, `sidebar/SidebarPanel.ts` (rebuilds the reserved-key wrapper on an outside-edit refresh), `elements/montage/view.ts` + `elements/initiative/view.ts` (the outside-edit check compares model serializations, not the full written text). Pipeline: Sonnet implementer → Opus review (1 MEDIUM, fixed) → scoped re-review (1 MEDIUM from SC-650's sidebar window check, fixed) → scoped re-review.

+++
