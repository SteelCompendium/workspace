# SC-621 r2 implementation report (implementer B)

**Executive summary**
- Status DONE. dse head `56ad4d1c` on origin/develop `14521bf0` (branch sc621-part-pin-one-sided-edit): `dfaacd40` r1 red tests (rebased), `2f51c898` fix, `cc1b6c00` M2 + persistence tests, `260f73e3` sweep + fuzz, `56ad4d1c` G-S115. Superproject `0dcc3bb3` (one CHANGELOG commit) on workspace origin/main `f58d5f02`; no pointer commit.
- Rebase: no conflict. r1 test file at 14521bf0 + r1 commit only: 18 red / 9 green (same as r1). With the fix: 27/27 green (+ drawn-pin 802 = 829 green).
- Red on a scratch 14521bf0 tree with the final test files: 25 failed / 10 passed of 35 (twin file 22 red = 18 + M2 2 + persistence 2; sweep file 3 red = sweep + 2 fuzz seeds). M2 mutant (twin gate on drawn note only) on the fix: 2 named tests fail.
- Sweep 1170 cells + fuzz 312 + 264 cells: 0 bad. Sweep jest wall ~15 s for the whole file (3 s for the twin file).
- G-S115: (a)-(f) red / (g)-(i) green on a 14521bf0 bundle; 9/9 ok on mine.
- Battery: tsc, lint clean · jest 11868 passed / 2 skipped (11833 + 35) · lifecycle 64/64 (parts 21/16/9/4/7/4/3; part 7 195 s) · e2e `334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · styles.css sha256 `18730938...` identical to a clean 14521bf0 build, so shots/freeze/parity carry (not re-run).

## Commits
| repo | sha | what |
|---|---|---|
| dse | `dfaacd40` | r1 failing tests, rebased from `4ba95740` |
| dse | `2f51c898` | fix: `rebaseCardPin` rule P (r1 prototype as ruled) + comment with (a) repeat-until-reopen, (b) R1/R2 |
| dse | `cc1b6c00` | twin file +5 tests: M2 named (2), paste-above control (1), persistence (2) |
| dse | `260f73e3` | `reading-mode-host-part-pin-sweep.test.ts`: sweep + fuzz |
| dse | `56ad4d1c` | G-S115 in `visual-harness/obsidian-lifecycle.mjs` |
| superproject | `0dcc3bb3` | CHANGELOG `## Unreleased` bullet (base `f58d5f02`; the branch had no other commit, fast-forwarded) |

Source diff: `src/framework/host/ReadingModeBlockHost.ts` +11 (4 code lines, 7 comment lines). 14521bf0..HEAD: 4 files, +1122.

## Details
1. Rebase: `git fetch origin`, origin/develop = `14521bf0` (SC-586), rebase clean. A stale gitignored `main.js` / `styles.css` in the dse root was removed by literal path before jest. Log `sc621-r2-gate-red-rebased.log`: 18 failed, 9 passed, 27.
2. Fix: `git apply` of `sc621-r1-proto-ruleP-rebase.diff.txt` (as is: `twinned(whole, drawnPin) && !placedUniquely(whole, drawnPin, at.line)`), comment extended with the two accepted properties. `sc621-r2-gate-green-fix.log`: twin + drawn-pin = 829 passed.
3. Tests.
   - Twin file (now 32): M2 named test, 2 cells (block hover card, block embed RV form): `UNIQ = [..., CTR(9), '', CTR(5), '^p', '', 'END']`, an identical counter pasted above the `^p` one, TOP edited: refused, one Notice. Control (1): the same paste with nothing edited, refused on base and fix. Persistence (2): heading hover and block embed RV; click 1 refused with 1 Notice and nothing written, click 2 on the same un-redrawn card refused again, a preview reopened on the note now saves with no Notice. (The Notice is rate limited per note, so the test resets the limiter between clicks, as r1's measurement did.)
   - M2 mutant proof (`twinned(from.text, drawnPin)` on the fix, `sc621-r2-gate-mutant-M2.log`): the 2 named tests fail; the 1170-cell sweep subset does NOT kill it (its rotated combination for `blk-uniq ins-twin-above-adj+top` landed on `+ stale`, which both versions refuse). Only the named test kills M2.
   - Sweep (`reading-mode-host-part-pin-sweep.test.ts`, ported from `sc621-r1-part-sweep.test.ts.txt`, +1 oracle helper `namesOnly`, fuzz ops named, redrawn-check moved before mounting a cell so skipped cells are cheap). Per cell: nothing corrupt; one Notice per refusal, none per save; no write in an oracle-ambiguous twinned cell; no write into another counter outside R1/R2; no refusal where the one cheapest placement is the drawn-from block and the head map and the link both name it and the link names one block before and now. Checks are 0 bad.
   - Pinned totals: sweep `{cells 1170, saved 566, refused 550, ambiguousTwinned 418, other 54 (R1 36, R2 18)}`; fuzz seed 1 `{312, 228, 78, 42, other 6 (R1 2, R2 4)}`, seed 2 `{264, 204, 56, 30, other 4 (R1 2, R2 2)}`.
   - Cuts (budget ~20 s): r1's full sweep is 21,060 cells, ~518 s. Committed: T1 only (the second timing is refused by SC-612's write-time rule and covered in the twin file), 2 of the 18 click combinations per (layout, link, edit) (1170 cells), fuzz 2 seeds x 150 notes (r1: 6 seeds, 15,612 cells). Measured jest wall: sweep file 14.9-15.8 s (sweep ~7 s, each seed ~4 s), twin file 3.1 s. Fuzz residual class: a move is also "paste an identical copy + delete a counter" (documented in the test).
   - Red-on-base: scratch `git worktree add --detach` of 14521bf0 under the scratchpad (removed after), the two final files copied in: `sc621-r2-gate-red-on-base.log`, list `sc621-r2-red-on-base-list.txt`. 25 failed / 10 passed.
   - No bracketed id in any title.
4. G-S115: harness spliced from `sc621-r1-gs115-proposal.mjs.txt` (header, fixtures + cell before `const SCENARIOS`, scenario after G-S112 and before G-S56; order G-S108, G-S112, G-S115, G-S56). Base bundle (scratch export, main.js sha `e303ca6d...`): `sc621-r2-gate-lc-base-G-S115.log` (a)-(f) wrote a counter with no Notice, (g)-(i) ok, 71 s. Mine (main.js `954ebe64...`): 9/9 ok, 73 s.
5. CHANGELOG bullet written, plain words, includes the repeat-until-reopen property and the two residuals.
6. Skill proposal: `sc621-skill-proposal.md`.

## Battery (final head `56ad4d1c`)
| gate | result | log |
|---|---|---|
| tsc (+ e2e) | clean, 12 s | `sc621-r2-gate-tsc.log` |
| lint (+ e2e) | clean, 16 s | `sc621-r2-gate-lint.log` |
| jest, fresh, no shots cache | 11868 passed / 2 skipped, 278 suites passed + 1 skipped, 84.5 s; delta +35 = twin file +32 (27 r1 + 5), sweep file +3; one run, no timeouts | `sc621-r2-gate-jest-full.log` |
| lifecycle part 1 (21) | 21/21, 183 s | `sc621-r2-gate-lc-part1.log` |
| part 2 (16) | 16/16, 336 s | `...part2.log` |
| part 3 (9) | 9/9, 414 s | `...part3.log` |
| part 4 (4) | 4/4, 300 s | `...part4.log` |
| part 5 (7) | 7/7, 392 s (G-S91 ok) | `...part5.log` |
| part 6 (4) | 4/4, 292 s (appearance.json not dirty) | `...part6.log` |
| part 7 `G-S108,G-S112,G-S115` (3) | 3/3, 195 s (over 180 s, polled by pid; not over 300 s) | `...part7.log` |
| lifecycle total | 64/64 | |
| e2e | `334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, 193 s | `sc621-r2-gate-e2e.log` |
| styles.css | sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on a clean 14521bf0 build and on mine, identical | `sc621-r2-gate-build-base.log`, `sc621-r2-gate-build-mine.log` |
| shots / host-leak / modal host-leak / clip / freeze / parity | not run: carry from 14521bf0 (592 / 163/978 / 40/240 / 147, 280/280, 0/0/24) | |

main.js `954ebe64...` (mine) vs `e303ca6d...` (base): differs by the 11-line fix only; no CSS change.

The dse worktree is clean (`git status` empty; built `main.js` / `styles.css` removed by literal path at the end). The superproject worktree shows ` M draw-steel-elements` (the submodule pointer is uncommitted by design).

## Artifacts (absolute paths, all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/)
- `sc621-r2-impl-report.md` (this), `sc621-skill-proposal.md`, `sc621-r2-red-on-base-list.txt`
- Logs: `sc621-r2-gate-red-rebased.log`, `sc621-r2-gate-green-fix.log`, `sc621-r2-gate-red-on-base.log`, `sc621-r2-gate-mutant-M2.log`, `sc621-r2-gate-build-{base,mine,final}.log`, `sc621-r2-gate-lc-base-G-S115.log`, `sc621-r2-gate-lc-mine-G-S115.log`, `sc621-r2-gate-tsc.log`, `sc621-r2-gate-lint.log`, `sc621-r2-gate-jest-full.log`, `sc621-r2-gate-lc-part{1..7}.log`, `sc621-r2-gate-e2e.log`
- Scratch scripts (not evidence): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-r2-implB/`

Drive-by fixes: none.

Follow-ups:
- The committed sweep subset (2 of 18 click combinations per cell) does not itself kill the M2 mutant; only the named twin tests do. If the owner wants the sweep to carry it, add a third combination for `+top/+end/+afterH` edits at a cost of ~5 s of jest wall. Not done (budget).
- The fuzz classifies R1 loosely (any `paste` + a delete op), so a real different-counter write in such a cell would be absorbed as R1; the sweep's R1/R2 classes are exact (by edit name). Pinned counts would still move.
- `git worktree add` of the dse submodule for the red-on-base tree left no residue (`git worktree list` shows only the branch).
