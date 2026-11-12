# SC-609 r4 scoped re-review: r3 fix delta

## Executive summary
- VERDICT: **LAND.** All four r2 items the owner folded in are closed. There are no new findings, apart from one INFO note that needs no action.
- Delta reviewed: dse `e2537b21..622b0904` (3 commits) and superproject `1152d1ec..d1ef100f` (CHANGELOG.md only, +2/-2).
- Bases: dse `origin/develop` is still `231f2a3b` and workspace `origin/main` is still `bd10dc98` (fetched just now).
- **M-1 closed.** Under the no-`focusWasInside` mutant, INIT-F14 FAILS (received `["init.cell.stamina","0-3",true]`) and INIT-F13 passes. On the fix, both pass (2/2 ok, rc 0). The mutant was reverted with `git checkout -- src/elements/initiative/view.ts`.
- **L-1 / L-2 closed.** The `view.ts` comment and the F20 title now say what the code does: no forced `focusVisible`, and Chromium may still draw the ring. F21's `<body>` half and F22 each carry a line naming SC-458. No test title has a square-bracketed ticket id.
- **I-1 closed.** Both CHANGELOG entries now say "Reading view" and cite SC-602 for Live Preview. The dse entry's "Not covered" names SC-615 (quick-add box) and SC-614 (condition remove). All of this matches what I measured in r2.
- **Product code is comment-only.** In the `src/` diff, every changed line is a `//` comment, so `view.ts` has no behaviour change and the full battery is not needed.
- Gates: INIT-F13/F14 alone 2/2 ok, rc 0; jest `initiative-matrix.test.ts` 191 passed / 191, rc 0.
- The tree is byte-identical before and after (dse status empty; superproject ` M draw-steel-elements` only; HEADs `622b0904` / `d1ef100f`).

## Checks
1. **M-1.** `e2e/specs/initiative/focus-after-cell-press.e2e.ts:43-50`: INIT-F14 now blurs to `<body>`, asserts `document.activeElement === document.body`, then presses. Mutant run log: `mute2e-r4-noinside.log` (`done: 1/2 ok, 1 failed`, e2e_rc 1, `restored`). Fix run log: `r4-e2e-f13f14.log` (`done: 2/2 ok, 0 failed`). The comment above the test explains the start state accurately: after `openNote`, focus is on the note's scroller (I measured `DIV.markdown-preview-view` in r2), and `focusIsFree` refuses the hand-over.
2. **Titles and comments.**
   - `view.ts:1861-1863` is accurate (r2 probes ZZ-R04 and ZZ-R06 measured `ring:true`).
   - The F20 title (`initiative-matrix.test.ts:840`) is accurate: the spy asserts `{preventScroll:true}` and no `focusVisible`.
   - The SC-458 lines at `:859` (F21 `<body>` half) and `:867` (F22) are accurate.
   - No `[SC-…]` in any title.
3. **Changelogs.** dse `CHANGELOG.md:25-31` and workspace `CHANGELOG.md:11-14` both say Reading view and cite SC-602. "When the note saves a moment later" matches the measured loss about 435 ms after the press, on the persist debounce. SC-614 and SC-615 are correctly attributed.
4. **Comment-only.** `git diff e2537b21..622b0904 -- src` keeps only `//` lines after filtering out comment lines (`src: only comment lines changed`).

## INFO
- INIT-F14's title still ends "(SC-458 flips this)". That is a ticket id in parentheses, unchanged since r1. It is not the square-bracketed form the ruling bans, and it follows the repo's existing parenthesized style (CENSUS-04, POOL-A02, POOL-E01). No action.

## Artifacts
In `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc609-r2-review/`:
- logs: `mute2e-r4-noinside.log`, `r4-e2e-f13f14.log`, `r4-jest-matrix.log`
- status snapshots: `r4-status-before-dse.txt`, `r4-status-before-super.txt`
- scripts: `mutate-e2e.sh`, `run.sh`, `jest.sh`
