# SC-536: proposed dse-verify SKILL.md row 4 edit (text only; the dispatcher applies it)

Written against row 4 of `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` on main `e0f5c76a` (row says `43/43`, halves `(22 + 21)`, ends with the G-S54 text then `; G-S16 reserved for SC-471)`).

## 1. Count and halves
- `OBSIDIAN-LIFECYCLE done: 43/43 ok, 0 failed`  ->  `OBSIDIAN-LIFECYCLE done: 44/44 ok, 0 failed`
- `run it as two `--only` halves (22 + 21)`  ->  `run it as two `--only` halves (22 + 22; G-S56 is the last scenario of the second half)`
- Measured at dse `fb24f8a2` on f81a277, load avg 8-9: first half (G-S7a ... G-S9b) 198 s, second half (G-S9d ... G-S54, G-S56) 542 s. The second half is the tight one; moving a few of its scenarios (for example G-S9d, G-S9e, G-S9f, G-S9c) into the first half would balance it.

## 2. Sentence to add (insert immediately before `; G-S16 reserved for SC-471)`, after the G-S54 text ending `the shipped build passes both`)
, SC-536 G-S56 — the reference guard follows the DOM, in real Obsidian with lookups and file reads held at hooks and released by hand: (a) a card whose effect markdown references the same note stops after 2 lookups at one `Reference loop: @… is already shown by a card this one is inside.` card nested one level inside it, (a') the same in Live Preview (own tab leaf), (cap) seven distinct references stop at 5 cards and the `Reference nesting too deep: more than 5 references inside one another.` card with only 5 lookups, (b) two panes (split plus a redraw), (c) a plugin off/on with two panes and (d) two redraws each hold two reads at once and draw one card per pane, released FIFO then LIFO, never a refusal; it runs last and first replaces every other markdown and sidebar leaf with one fresh Reading-view leaf, because a leaf that was in Live Preview keeps an editor that looks up the next note's blocks too (a scenario added after it must set up its own leaves); on `f81a277`'s `src/` it FAILs every phase (cycle: 8 released and still going; cap: 7 lookups; b/c/d: 1 read held, the other pane refused)

## 3. Optional CURRENT-block numbers for dse head `fb24f8a2` (f81a277 + SC-536)
tsc/lint clean · jest 6228 passed / 1 skipped / 249 of 250 suites (base 6208; +22 tests added, 2 deleted) · lifecycle 44/44 (22 + 22) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · shots 592, 0 FAIL, button host-leak 157/942 · freeze `280/280` · parity 0 GAPs / 0 undeclared / 24 DECLARED.
