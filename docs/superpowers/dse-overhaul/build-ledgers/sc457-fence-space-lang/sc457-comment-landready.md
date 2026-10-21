Blocks written with a space before their name (```` ``` ds-counter ````) no longer lose a click made just before you leave the note. Ready to land; nothing needed from you.

Before this fix, if you clicked a control in such a block and then switched notes or closed the tab, the click was dropped with a "not saved" notice. It was also dropped after a hand edit inside the block.

What changed:

- DSE now reads a block's name the way Obsidian does: it skips spaces and tabs before the name, and the name ends at the next whitespace character. One shared rule is used by every save path, the sidebar, and autocomplete.
- Other invisible characters before the name (a non-breaking space, for example) are not skipped. Obsidian does not show those as a Draw Steel block, so DSE doesn't treat them as one either.
- The space before the name stays as you wrote it.
- "Pin to sidebar" now works on these blocks too. Before, it got an empty block name.
- Nothing changes for blocks without the space. Nothing you saved is affected: the block's internal ID changed, but it is only kept in memory.

How it was checked:

- A new real-Obsidian lifecycle check, **G-S14**, clicks a control in such a block and then leaves the note, and confirms the click was saved. (My first comment called it G-S13; that number went to SC-326.) It fails on the old code and passes on the new.
- An independent reviewer tested in real Obsidian over five rounds. It covered one space, several spaces, a tab, a block inside a callout, a note with Windows line endings, and "Pin to sidebar" in both views.
- Every click saved, and nothing outside the block changed. Every opening line that works today still works the same way.
- The review caught two problems in my own earlier fix rounds before landing. Both affected blocks with an invisible character after the name. Both are fixed and covered by tests.

Filed from this work (Backlog). All are existing behaviour, and none is made worse here:

- SC-477: saving a block that has no closing ``` at the end of the note deletes the note's final newline.
- SC-480: when two blocks have identical contents, a save made while the note is changing can land in the other block. Needs a decision.
- SC-481: after you save one of two identical blocks, the other disappears from Reading view until you reopen the note.
- SC-487: "Pin to sidebar" on a block whose name is followed by a zero-width space writes an anchor into the note, then shows "unavailable".

---

Mechanics: dse branch `sc457-fence-space-lang` @ `772c3cd` (11 commits on `develop` `bc4a0c5`); superproject @ `d3ddbf3` (CHANGELOG only, on `origin/main` `9f37173`). Gates at `772c3cd`:

- tsc and lint: clean.
- jest: 5536 passed / 1 skipped.
- lifecycle: 31/31.
- e2e: 89/93 ok, 0 failed, 4 known-bug, coverage 64/64.
- shots: 580, 0 FAIL.
- freeze: 280/280.
- parity: 0 gaps / 0 undeclared / 24 declared.
