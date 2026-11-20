Inserting a block no longer breaks it when the cursor is not on an empty line: the block always gets lines of its own, and the text around the cursor is kept. The fix is reviewed and ready to land. Nothing is needed from you unless you want one of the four calls below changed.

**What a user sees now**

- `abc|` then **Insert Draw Steel: Counter**: `abc` stays on its line and the counter block starts on the next line. Before, the opening fence stuck to `abc` and nothing drew.
- `/dsct| tail`, pick Counter: the block closes properly and `tail` moves to the line below it. Before, the closing fence had ` tail` after it, so the block never closed and swallowed the rest of the note.
- Cursor inside a list item: every line of the block is indented under the item. Before, only the first line was.
- Cursor inside a callout: every line keeps the `>`. Before, only the first line did and the callout broke. This is SC-462, fixed by the same change.
- The compendium reference and full-block inserts behave the same way.
- The cursor on an empty line (the case that already worked) gives exactly the same text as before. One Ctrl+Z undoes the whole insert.

**Four calls I made (say so if you want any changed)**

1. **Split instead of refuse.** The ticket allowed either. A refusal would make `/ds` typed mid-line a dead end.
2. **SC-462 fixed here too.** It is the same code. SC-462 can close when this lands.
3. **A block inserted inside a list item is indented under the item even though it then can't save.** It draws, and the first press shows the existing "not saved" Notice. That limit is SC-461 and is already in the plugin docs under "What doesn't work yet". The alternative is to refuse the insert inside a list item. A block inserted in a callout does save.
4. **Inserted list indentation is always spaces, never tabs.** Obsidian's Live Preview shows a parse-error card when a block's lines start with a tab. A tab you typed yourself is never rewritten.

**Known leftovers (all inside tab-indented lists, none loses text)**

- A bullet under a numbered item, nested with a tab: Reading view draws the block one level up. Live Preview draws it in the right item.
- The cursor on an empty line indented with two or more tabs: Live Preview draws the block, Reading view shows an error card.

Both are noted on SC-461, which will rework how blocks in lists are read.

**How it was checked**

An independent reviewer ran 375 insert cases over a real editor state: every one is a single edit, one undo restores the note, the text above and below is byte-identical, and the cursor lands on the first line of the block's body. The reviewer also drove the inserts in real Obsidian (Live Preview and Reading view) for callouts, nested callouts, lists, and tab-nested lists, and pressed + on the inserted counters.

**Mechanics**

- dse branch `sc675-insert-nonempty-line` @ `3b47e55b` (base `develop` @ `129beb18`); superproject `7df5aae8` (CHANGELOG bullet under Unreleased).
- New helper `src/authoring/blockInsert.ts`; `insert.ts`, `suggest.ts` and `compendiumInsert.ts` call it. One new export in `blockPrefix.ts`.
- tsc and lint clean. jest 13855 passed / 2 skipped (153 new tests). e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`. Lifecycle 63/64: the one failure is G-S61 on its torn-read line, which fails the same way on a clean `129beb18` build (SC-668). `styles.css` is byte-identical to base, so shots, freeze and parity carry.
- Three review rounds. Round 1 found the tab error card in Live Preview. Round 2 found that Reading view missed blocks in bullets nested three deep. Round 3 approved.
- For SC-443 (not landed yet): its markers AUTH-I21, AUTH-S09, two jsdom SC-675 markers and the SC-462 marker become plain tests at its rebase. Its list-item marker needs a list-aware check. Three of its tests pin the old output and need rewriting (`dsSuggestMatrix.test.ts:133` and `:143`, AUTH-S04). The merge itself has no conflicts.
