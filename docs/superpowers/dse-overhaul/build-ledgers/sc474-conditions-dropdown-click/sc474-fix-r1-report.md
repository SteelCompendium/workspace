# SC-474 fix-r1 report

## Executive summary
- STATUS: DONE. Rebased onto dse origin/develop c03db7a; HIGH-1 and LOW-1 folded; no CSS.
- Rebase: clean (3 commits). Built main.js + styles.css at the rebased pre-fix head are byte-identical to the 8af4f9a build (main.js f79c40f9..., styles.css 9d88edb6...).
- HIGH-1: closeAdd(refocus = true); the click-time close (closeIfArmed) refocuses "+ Add" only when focus is on nothing/body or still inside the add control. A focused target (icon search, custom colour) keeps focus; click-away on empty space still lands on "+ Add" (INFO-2 kept).
- LOW-1: const doc = activeDocument once in onOpen; all three listeners and the timer use doc.
- New control id cond.icon-search (attribute only) + manifest row; e2e COND-E06 FAILS on the 8af4f9a behaviour (focus not on the field) and passes on the fix.
- Gates: jest 5384/1/231 of 232 (exp 5374+7+3); lifecycle 28/28; e2e 88/92 0 failed 4 known-bug 64/64 pairs; shots 572 0 FAIL; freeze 276/276; parity 0/0/24; tsc, lint clean.
- dse head e31e1a0; superproject head da932cd (unchanged, pointer not bumped).

## Commits (dse, on c03db7a)
- 1d39689, 4cf7e6c, 349d115: round-1 commits rebased (were cedd6b6, ab701ff, 8af4f9a)
- ec53f17 fix(conditions): SC-474 r1 focus-keeping click-time close; one doc for all listeners; cond.icon-search id (src/views/ConditionsModal.ts, test/dom/views/conditions-modal.test.ts, e2e/manifest/conditions-modal.ts)
- e31e1a0 fix(conditions): SC-474 r1 e2e COND-E06
Superproject: da932cd (CHANGELOG, unchanged; both bullets stay accurate).

## Rebase and byte-identity
- c03db7a rebase clean. Built at 8af4f9a in a private detached worktree (removed after) and at the rebased head: main.js sha256 f79c40f913b4a52c9a09c7a3733a87d0eae7dd24696a89d7581daafab5a9628c and styles.css 9d88edb642d97604e9d3dcdce396221b3e1a7680221388a2be7cd439e65aa091 for BOTH (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-fix-r1-m3d8/m3d8-sha-old-build.txt, m3d8-sha-rebased-build.txt). So SC-456's test-only changes do not touch the bundle.
- Final head main.js b087ac38...cb3d (changed by the fix, as expected); styles.css unchanged 9d88edb6....

## Tests added
- test/dom/views/conditions-modal.test.ts (+3, in the SC-474 describe): icon search click keeps focus + closes; custom colour input click keeps focus + closes; click-away with focus on <body> lands focus on "+ Add condition" (pins INFO-2). Two of the three fail with the refocus made unconditional (log /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-fix-r1-m3d8/m3d8-jest-red.log); the third is the INFO-2 pin.
- e2e/specs/initiative/conditions-dropdown-click.e2e.ts: COND-E06 (editor open, dropdown reopened, real click on the icon search, dropdown closed and the field focused).
- Red evidence: with closeIfArmed's refocus forced unconditional (the 8af4f9a behaviour), COND-E06 FAILS: "the close must not pull focus off the field the user clicked ... Expected: focused, Received: not focused" (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-fix-r1-m3d8/m3d8-e2e-red.log, bundle e2e/.out/20261021-074158-58e6/COND-E06). Green on the fix (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-fix-r1-m3d8/m3d8-e2e-green.log). Temporary revert restored byte-for-byte before commit (copy /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-fix-r1-m3d8/m3d8-ConditionsModal.fixed.ts).
- Manifest: cond.icon-search click (SC-474) -> coverage 64/64.

## Gates
- tsc (+ -p e2e) and lint (+ e2e): clean (m3d8-tsc.log, m3d8-lint.log), run after the last source edit.
- jest (fresh worktree): 5384 passed / 1 skipped / 231 of 232 (m3d8-jest-full.log); expected 5374 + 7 + 3.
- lifecycle: 28/28 ok, 0 failed on DSE_LIFECYCLE_PORT=9297 (m3d8-lifecycle2.log). First attempt on 9291 exited 2 (environment): the port is held by another session's Obsidian (sc471 worktree, pid 1316197); not touched.
- e2e: OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs (m3d8-e2e-full.log); COND-E04/E05 pass SC-456's stricter integrity check.
- shots 572, 0 FAIL; freeze OK (276/276); parity 0 gap(s), 0 undeclared, 24 declared.

## Drive-by fixes
none.

## Follow-ups
none.
