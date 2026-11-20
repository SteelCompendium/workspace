SC-675 makes this limit easier to reach: inserting a block with the cursor in a list item now indents the whole block under the item, so it draws there and then hits this ticket's "not saved" Notice on the first press.

Two list shapes are left over from SC-675 for whoever picks this up. Both only show with tab-indented nesting, and neither loses text:

- A bullet under a numbered item, nested with a tab (`1. a`, then a tab and `- b`): Reading view draws the inserted block one level up, inside `a`. Live Preview draws it inside `b`.
- The cursor on an empty line indented with two or more tabs, under a nested bullet: Live Preview draws the block, Reading view shows a parse-error card.

Obsidian's Reading view counts a tab as 2 columns under a bullet and 4 under a numbered item, and the insert does not look at the parent line. The measurements are in `.superpowers/sdd/sc675-insert-nonempty-line/sc675-r6-rereview-report.md` (preserved under `docs/superpowers/dse-overhaul/build-ledgers/` at landing). The code is `src/authoring/blockInsert.ts` (`blockContextOf`).
