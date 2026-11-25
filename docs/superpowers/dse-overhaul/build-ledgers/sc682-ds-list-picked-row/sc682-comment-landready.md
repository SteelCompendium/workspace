**Ask: after this lands, try `/dsstam`, Enter, Enter in your vault and close the ticket if it behaves. Nothing else is needed from you; the fix is reviewed and ready to land.**

After a pick from the `/ds` list the list now closes, so the next Enter adds a new line at the cursor.

**Before** (current `develop`): `/dsstam`, Enter, then 1.5 seconds of waiting. The block is inserted, and the picked row (the small box reading "Stamina bar / ds-stam") is still drawn over it.

{{IMG:sc682-before.png}}

**After**: same keys, same wait. The block is there, no list is on screen, and the cursor is on the first line inside the block.

{{IMG:sc682-after.png}}

**The bug was wider than the ticket said**

- A mouse click did not always close the list. Clicking the Stamina bar row or the Skills row left it on screen, the same as Enter.
- Which blocks stuck depended on the block and on where the token was. Stamina bar and Skills stuck on an empty line. Featureblock stuck when there was text after the cursor.
- "Not data loss" was only true if you waited. A second Enter pressed right after the pick (within about 80 ms) picked a second time. Under a list item that wrote a second block into the first one, and a held Enter wrote six copies. Anywhere else it showed the "cursor is inside another block" message instead of adding a line.

The one change fixes all three.

**What is covered**

- Every pick: Enter or a click, all thirteen blocks, Live Preview and Source mode, at the top level, under a list item and in a callout.
- Enter straight after the pick, five Enters in a row, and a held Enter all give one block and plain new lines.
- Typing inside the new block still opens the field-name list. Typing `/ds` again on a later line opens the `/ds` list again.
- A pick that is refused inside another block (SC-687) still shows its message once.
- If a pick ever fails with an error, the list still closes.

**Not changed here: filed as SC-693**

The reviewer found a separate, older fault. If you type the last letter of the token and press Enter less than about 50 ms later, the pick uses the token as it was one letter earlier. `/dssta`, then `m` and Enter in one burst, inserts the Stamina bar and leaves a line holding only `m` below it. `/ds`, then `stam` and Enter in one burst, inserts the Horizontal rule. It behaves the same before and after this fix. SC-693 has the repro and one decision for you when it is picked up.

**Mechanics**

- dse branch `sc682-ds-list-picked-row` @ `23f3e61b`, rebased onto `develop` @ `a0e55f6b` (8 commits). Superproject branch @ `bc01449e` on `0d6f4897` (CHANGELOG bullet under Unreleased; pointer bump left for landing). Workspace `origin/main` has since moved one handoff-doc commit to `2ebbdb1f`; no conflict.
- The change is in `src/authoring/suggest.ts`, `selectSuggestion`: the list is closed after every pick, in a `finally`. What a pick writes into the note is byte-identical to before for all thirteen blocks.
- tsc and lint clean. jest 14724 passed / 2 skipped in a fresh worktree (9 new tests). e2e `841/851 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs` (8 new real-Obsidian tests, AUTH-S10 to AUTH-S17). Lifecycle 64/64. `styles.css` is byte-identical to base, so shots (592), freeze (280/280) and parity (0 / 0 / 24) carry.
- The existing `/ds` tests used to press Escape, or wait for the list to go away, after a pick. That hid this bug. Six of them (AUTH-S02, S03, S04, S09, G09, I40) now assert at once that no list is on screen, with no Escape.
- An independent reviewer drove real Obsidian 1.14.4: all 12 new or changed e2e tests fail on the unfixed build, and "pick, Enter at once" on the fixed build matches "pick, Escape, Enter" on the old build byte for byte in 72 of 72 cases. A second worker re-checked the rebase and the last three small changes.
- Both changelogs have a bullet.
