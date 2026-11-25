**Ask: say if you want either message reworded, or the block moved below instead of refused. Otherwise nothing is needed; the fix is reviewed and ready to land.**

An insert command run with the cursor inside an existing block (or the note's properties) now writes nothing and shows a message. The existing block stays intact and keeps drawing.

**Before** (current `develop`): cursor on the empty line inside a stamina bar, then *Insert Draw Steel: Counter*. The stamina bar is an error card titled "Stamina bar: failed to render (parse)", and `after text` sits inside a grey code box.

{{IMG:sc687-before.png}}

**After**: same note, same command. The stamina bar still draws (5 / 20, "Winded"), `after text` is a normal paragraph, and the message is the dark box at the top right.

{{IMG:sc687-after.png}}

**The two messages**

- Inside a block: "The cursor is inside another block, so nothing was inserted. Move it to a line outside the block and run the command again."
- Inside the properties: "The cursor is inside the note's properties, so nothing was inserted. Move it below the properties and run the command again."

**What is covered**

- Every *Insert Draw Steel* element command, the compendium reference command, the compendium snapshot command, and a pick from the `/ds` list.
- Any code block, not only `ds-` ones: backtick or tilde fences, blocks in a callout or quote, blocks indented under a list item (spaces or tabs), and a block that was never closed.
- The two compendium commands refuse before the search opens, so you do not search first and get refused after.
- Nothing is written on a refusal: the cursor stays, and there is nothing to undo.
- With several cursors, one of them inside a block is enough to refuse.

**Calls I made (say so if you want any changed)**

1. **Refuse, not "move the new block below".** The ticket's Expected says the insert does not write there, as `/ds` does. Moving it below would also work, but from the properties it has nowhere obvious to go.
2. **The edges of a block count as outside.** Cursor at the very start of the opening fence line: the new block lands above. Cursor at the end of the closing fence line: it lands below. Both blocks stay intact.
3. **A note that starts with `---` and never closes it is not treated as properties.** Obsidian's editor styles the whole note as properties there, but Reading view draws blocks in it normally, and an insert there damages nothing.

**Not changed here**

- The `/ds` list still offers itself in three places it should not (SC-676). Picking from it there is now refused with the same message instead of breaking the note.
- An insert with several cursors that are all outside a block still lays the block out for the main cursor only. That is older behaviour, filed as SC-692.
- One known gap: a block under a list item whose lines are indented with a tab followed by spaces (typed by hand) is not recognised, so an insert inside it still writes. Only Reading view draws such a block at all. Noted on SC-676.

**Mechanics**

- dse branch `sc687-insert-inside-block` @ `bb3a3d10` (base `develop` @ `aee83dc1`, 17 commits). Superproject `754d46b0` (CHANGELOG bullet under Unreleased; pointer bump left for landing).
- The guard is in `src/authoring/blockInsert.ts` (`insertBlock`, the one place every insert writes). The position scan is new code in `src/authoring/fenceScan.ts` plus `src/authoring/listItem.ts`. `suggest.ts` only changes on the pick path: a refused pick closes the list.
- tsc and lint clean. jest 14674 passed / 2 skipped (236 new tests). e2e `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (15 new real-Obsidian tests, AUTH-I28 to AUTH-I42; the SC-687 marker AUTH-I27 is now a plain test). Lifecycle 64/64 on the final head. `styles.css` is byte-identical to base, so shots (592), freeze (280/280) and parity (0 / 0 / 24) carry.
- Three review rounds by an independent reviewer, each driving real Obsidian 1.14.4. Round 1 found that a block written directly under a list item made every later insert in the note refuse, and that some blocks under list items were missed. Round 2 found tab-indented blocks under nested list items were missed. Round 3 approved.
- User docs: `docs/writing-blocks.md` has a new section "Not inside another block or the properties". Both changelogs have a bullet.
- For SC-676: the new scan (`placeOfLine` in `fenceScan.ts`) already answers "in a block, in the properties, on a fence line" for indented and quoted blocks. The two suggesters still use the old `scanFenceState`, unchanged on purpose.
