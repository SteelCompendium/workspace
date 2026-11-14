# SC-621 r4 report (implementer B, resumed): rebase onto b1e4f027 + doc/harness fold

**Executive summary**
- Status DONE. dse head `96955985` on origin/develop `b1e4f027` (SC-613 and SC-568 landed; first rebased on 9b94baf2, then re-rebased on b1e4f027 after the course correction). Rebases clean, no conflict.
- dse commits (8 over b1e4f027): `207b3984` r1 red tests, `23fb946b` fix, `ae9b51b9` M2 + persistence tests, `918b34f7` sweep + fuzz, `a68030f9` G-S115, then new `37c99b38` (rebaseCardPin comment: R3), `cd8342f7` (G-S115 dead code removed), `96955985` (twin + sweep suites use SC-568's `settleVaultReads`). Range-diff: commits 1-5 are `=` (code unchanged), 6-8 new.
- Superproject `ad3ae246` (ONE CHANGELOG commit, no pointer commit) on workspace origin/main `e7e34279` (origin/main moved twice during the round; rebased on the last fetch).
- Folded: LOW-1 (R3 in CHANGELOG, code comment, skill proposal), LOW-2 ("added or removed"), LOW-3 ("a note open in its own pane"), LOW-4 (dead code deleted), owner note ("often not redrawn").
- Battery on `96955985`: tsc, lint clean · jest 11892 passed / 2 skipped (11857 + 35) · lifecycle 64/64 (21/16/9/4/7/4/3; part 7 200 s) · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · styles.css sha256 `18730938...` identical to a clean b1e4f027 build, so shots/freeze/parity carry (not re-run).

## What changed (no rule or code-logic change)
- CHANGELOG (the single superproject commit; the one conflict was the adjacent SC-613 bullet, resolved by keeping both, SC-621 first): "added or removed"; "is often not redrawn by Obsidian"; "Three cases are still written ... and, in a note with identical counters, an outside change of more than about 400 lines in the same write"; "a note open in its own pane (SC-612)".
- `ReadingModeBlockHost.ts` comment (+3/-2 lines, comment only): "(b) three residuals ... R3, a change of more than LINE_MAP_MAX_EDITS lines around the block in the same write, which `placedUniquely` cannot price, so the agreed map stands (SC-612's accepted cap)".
- `visual-harness/obsidian-lifecycle.mjs` (3 insertions, 26 deletions): removed `GS115_C6`, `GS115_NOTE.twin`, the edits `del-first+end`, `del-first+top`, `del-low-keepmark+end`, the `if (plus)` block, and the now-unused `plus` parameter / `rec.plus` / `plus: false` at the call site. Still 9 cells (a)-(i), unchanged; (a)-(f) red on a base bundle is not re-proved (cells unchanged); all 9 ok on mine (part 7 3/3).
- Test suites on SC-568's helper: `reading-mode-host-part-pin-twin.test.ts` and `...-sweep.test.ts` now `const settle = () => settleVaultReads()` (was a fixed 25 ms / 2 ms timer). In the sweep, the per-cell `cleanup` now restores only its own `getFileCache` spy (`cacheSpy.mockRestore()`) instead of `jest.restoreAllMocks()`, which would have dropped the helper's read counter after cell 1 and made it vacuous. Pinned totals unchanged (35/35 green). Cost: sweep file alone 18.3 s jest wall (was 14.9-15.8 s with the 2 ms timer), still under the ~20 s budget.
- Skill proposal `sc621-skill-proposal.md` updated: R3 added to residuals (with r3's cap-variant numbers), r4 measured walls, the CURRENT block rebased to b1e4f027 numbers (11892 / 64 / 338/341).

## Battery (final dse head `96955985`; superproject `ad3ae246`)
| gate | result | log |
|---|---|---|
| tsc (+ e2e) | clean, 13 s | `sc621-r4-gate-tsc.log` |
| lint (+ e2e) | clean, 17 s | `sc621-r4-gate-lint.log` |
| jest fresh, no shots cache | 11892 passed / 2 skipped, 278 suites + 1 skipped, 92 s, no timeouts, `reading-mode-host-pin.test.ts` green (one run; no re-run needed) | `sc621-r4-gate-jest-full.log` |
| twin + sweep alone | 35 passed, 21 s together; sweep alone 18.3 s | `sc621-r4-gate-jest-settle.log`, `sc621-r4-gate-jest-sweep-alone.log` |
| lifecycle part 1 (21) | 21/21, 183 s | `sc621-r4-gate-lc-part1.log` |
| part 2 (16) | 16/16, 322 s | `...part2.log` |
| part 3 (9) | 9/9, 406 s | `...part3.log` |
| part 4 (4) | 4/4, 295 s | `...part4.log` |
| part 5 (7) | 7/7, 397 s | `...part5.log` |
| part 6 (4) | 4/4, 296 s | `...part6.log` |
| part 7 `G-S108,G-S112,G-S115` (3) | 3/3, 200 s | `...part7.log` |
| lifecycle total | 64/64 | |
| e2e | `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, 281 s | `sc621-r4-gate-e2e.log` |
| styles.css | `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on my build and on a clean b1e4f027 build: identical. main.js differs only by my 11-line fix (`a866bb27...` mine, `81a67cb8...` base) | `sc621-r4-gate-build-mine.log`, `sc621-r4-gate-build-base.log` |
| shots / host-leak / modal host-leak / clip / freeze / parity | not run: carry (592 / 163/978 / 40/240 / 147, 280/280, 0/0/24) | |

Superseded: a first battery on the 9b94baf2 head (before the b1e4f027 correction): tsc, lint, jest 11888/2, lifecycle parts 7, 1, 2, 3, 4, 5 all ok; part 6 and e2e were not run. It was stopped there and fully re-run on `96955985`. Its logs are in `sc621-r4-superseded-9b94baf2/` (not used for any number above).

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/)
- `sc621-r4-fix-report.md` (this), `sc621-skill-proposal.md` (updated), `sc621-r4-range-diff.txt` (`git range-diff 14521bf0..56ad4d1c b1e4f027..96955985`)
- Logs `sc621-r4-gate-*.log` as in the table; superseded set in `sc621-r4-superseded-9b94baf2/`.
- Scratch scripts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-r2-implB/`

dse worktree clean (built `main.js`/`styles.css` removed by literal path); superproject shows ` M draw-steel-elements` (pointer uncommitted by design). Scratch `git worktree` for the clean b1e4f027 build removed.

Drive-by fixes: none.

Follow-ups: none new. (The sweep's R3 cells are not in the committed subset; R3 is documented, not pinned, per the ruling.)
