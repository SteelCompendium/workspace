**Ask (nothing blocks landing):** with several cursors, an insert command now writes a correctly laid-out block at every cursor. The ticket offered "refuse with a message" as the other option. Say so if you would rather have the refusal.

An insert command run with several cursors (Alt-click) now lays out each block for the line it lands on. Each cursor gets its own line break, its own callout or list prefix, and text after a cursor moves below that cursor's block. Before this fix, every cursor got the main cursor's layout. A second cursor at the end of a line glued the block onto that line, and the text below could turn into code.

**Before** (the current plugin). Main cursor on an empty line, second cursor at the end of `after text`. The second counter is glued onto `after text` and shows as raw text, and `line below the text` has turned into a code block:

{{IMG:sc692-before.png}}

**After** (this branch, same note and same command). Both counters are drawn, and `after text` and `line below the text` are ordinary paragraphs:

{{IMG:sc692-after.png}}

What else holds:

- One Ctrl+Z removes every block the command wrote and restores the note exactly.
- With one cursor, the insert writes exactly what it wrote before.
- If any cursor is inside an existing block or the properties, nothing is written at any cursor and one message says why (SC-687's rule, unchanged).
- The same applies to the compendium reference and snapshot inserts.

An independent reviewer checked the result against running the command once per cursor, one cursor at a time from the bottom of the note up. It matched byte for byte in 270 test-harness cases and 22 real-Obsidian cases. Those cases covered callouts, list items, several cursors on one line, selections, and 10+ cursors. The review found no product bugs. It asked for three more tests, which were added.

Filed while reviewing: SC-711 (Backlog). A block inserted under a list item inside a plain quote (`> - item`) is not drawn in Live Preview. The current plugin does the same with one cursor, so SC-711 is not part of this fix.

+++ Agent notes

- dse `sc692-insert-several-cursors` @ `e38f7838` on `develop` @ `17187e4c`. Superproject `sc692-insert-several-cursors` @ `634cee2c` (CHANGELOG only).
- Change: `src/authoring/blockInsert.ts`. A new pure `planBlockInserts` plans each range bottom-up with the existing `planBlockInsert`. With more than one selection, `insertBlock` writes them in one `editor.transaction({ changes, selections })`. One cursor and the `/ds` range path are unchanged.
- Measured in Obsidian 1.14.4: one `transaction` with several changes is one undo step. The first range given to `selections` becomes the main cursor, and the `main` argument is ignored.
- Gates: tsc and lint clean · jest 15044 passed / 2 skipped (fresh) · lifecycle 64/64 · e2e `944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` (implementer and reviewer each ran it in full) · `styles.css` identical to a clean `17187e4c` build: shots 636, freeze 280/280, parity 0/0/24 carry.
- New tests: jest `test/dom/authoring/insertSeveralCursors.test.ts` (26). e2e AUTH-I43..I50 in `e2e/specs/authoring/insert-several-cursors.e2e.ts`. No new coverage pair, and the known-bug count stays at 20.

+++
