A Montage board no longer breaks when its hero list has an empty item or a hero with no name. The board skips the item and leaves it in the note as you typed it. This is ready to land; nothing here needs a decision from you.

**What you would have seen before**

- An empty item (`- `) in `participants` stopped the whole board drawing. The card showed "failed to render … Cannot read properties of null (reading 'name')".
- A hero with no name, a bare word or number (`- Kira`, `- 7`), or `name: 7` drew a row labelled `undefined`, `""` or `7`. The heading counted them as heroes, and the Log an action button could be left with nothing to open.

**What happens now**

- Only real heroes (an item with a text `name`) get a row, a tally and a turn. Each skipped item is reported once in the developer console.
- When you change the board (log, edit or remove an action, end a round, reset, add a hero), every skipped item that has something in it stays in the note exactly as typed, in its place. A typo such as `- nmae: Ash` is still there for you to fix. Once you fix it by hand, it becomes a normal hero.
- An item with nothing in it (`- `, `- {}`, or `- name:` with no value) is removed the next time the board saves the note, instead of being written back as `null`.
- A hero list typed as one value instead of a list (`participants: Kira`) is kept as typed. Add a hero turns it into a list with that value first.

I made the calls above myself, following the Montage element's existing rule for mistyped action results: anything that looks like a typo is kept, not deleted. Say so if you want any of them changed.

**Checks**

- 52 new jest tests. Most of them fail on the old code and pass on the fix.
- An independent review drove 25 cases across 9 bad shapes through the real board: 13 failed on the old code and all 25 passed on the fix. It found no blocking problems; its two low findings and the CHANGELOG wording were fixed in a second round and re-reviewed.
- A real Obsidian run in Reading view showed the old failure and the clean board on the fix, with the bad items unchanged in the note after a save.

+++ Agent notes

- dse branch `sc610-montage-nameless-hero` @ `3ad68185` on develop `c6077860`; superproject worktree @ `f18fad5a` (CHANGELOG bullet).
- Fix: raw `participants` kept (`unknown`), every read through `montageRoster(m)`; all-null items dropped on write; files `src/elements/montage/{model,BoardView,HeadView,OutcomeBandView}.ts` + tests in `test/unit/model/montage-tally.test.ts`, `test/dom/elements/montage.test.ts`.
- Gates at `3ad68185`: tsc/lint clean · jest 10676 passed / 2 skipped fresh (10624 + 52) · lifecycle 59/59 (six parts) · e2e 278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
- No lifecycle scenario added (crash is pure data, covered in jsdom); no dse-verify SKILL.md change beyond the jest count.

+++
