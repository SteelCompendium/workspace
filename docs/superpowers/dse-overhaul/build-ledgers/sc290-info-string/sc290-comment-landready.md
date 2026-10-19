Fixed: clicking a control on a DSE block no longer strips the extra words after the block type on its opening line. A block opened with ```` ```ds-counter extra ```` keeps ```` ```ds-counter extra ```` after every write, in Reading mode, Live Preview and the sidebar. Nothing for you to review — this is land-ready and waits on the dispatcher's landing.

**What changed**

- Both write paths (the Reading-mode host and the sidebar host) now rebuild the opening fence line through one shared helper, `src/framework/host/fenceLine.ts`. The helper keeps the fence characters plus the whole info string.
- Fences that carry only the block type come out byte-for-byte as before.
- Side effect, also a fix: a fence typed with a space before the block type (```` ``` ds-counter ````) used to lose its block type on the first click and turn into a plain code block. It now stays as written.
- No pixels moved: the frozen screenshot set is unchanged (276 of 276 identical).

**Tests**

- 18 new unit tests across the two hosts. 12 of them fail on the old code; the rest guard behaviour that was already right (block-type-only fences, trailing spaces).
- One new end-to-end test in real Obsidian (`RECOV-I01`): it clicks Catch Breath on a stamina bar opened with ```` ```ds-stamina-bar  extra words ```` and checks the note text. It fails on the old code and passes now.
- An independent review approved it after probing two blocks with different info strings in one note, identical twin blocks, hand-edited fences, tilde fences, 5-backtick fences and Live Preview in real Obsidian.

**Filed while doing this (all Backlog, all older than this fix)**

- SC-453: the sidebar can't find a block in a note with Windows line endings, and writes leave such notes with mixed line endings.
- SC-454: delete the unused `src/utils/CodeBlocks.ts`, which still has the old bug.
- SC-455: clicking a control on a block inside a callout or blockquote does nothing and shows no message.
- SC-456: the end-to-end suite's note-integrity check only looks at the first word of each fence line.
- SC-457: a fence with a space before the block type can lose writes after the note is edited around it.

**Gates** (draw-steel-elements, branch `sc290-info-string` @ `c78a06b`, rebased on `develop` a89ffd9)

- tsc and lint: clean
- jest: 4787 passed, 1 skipped (develop's 4769 plus 18 new)
- lifecycle (real Obsidian): 25/25 ok
- e2e (real Obsidian): 63/73 ok, 0 failed, 10 known-bug, coverage 47/47 pairs (develop's 62/72 plus the new test)
- shots: 572, 0 failed; freeze: 276/276 identical
- parity: 0 gaps, 0 undeclared, 24 declared
