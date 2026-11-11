# SC-572 r4 scoped re-review report (delta 1305e0b4..f62e1f5e)

## Executive summary
- Verdict: **LAND-READY**. Head `f62e1f5e` on base `97a9c93b`; origin/develop has not moved. Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 2.
- All five r2 folds are fixed and verified by running them: MEDIUM-1, LOW-1, LOW-2, LOW-3 (the Goblin #4 fixture) and INFO-2.
- MEDIUM-1 in real Obsidian 1.14.4:
  - Middle condition, Enter: focus goes to the next icon, "Remove Dazed".
  - Last condition in the list, Space: focus goes to the previous icon, "Remove Grabbed".
  - Only condition, Enter: focus goes to the footer Reset button.
  - Every target is inside the modal and shows a `:focus-visible` solid 2px ring.
  - A mouse click still leaves focus on `<body>`, the same as at 1305e0b4.
- Mutants, spot-run by me on r3 head: M5 (any key removes) caught (jsdom 1 fail, e2e C04+C05); no focus hand-off caught (jsdom 2 fail, e2e C04+C05+C06); hand-off on pointer clicks too caught (jsdom pointer test). M8 is caught by the swept fixture; I measured that in r2 with the identical fixture, and the modal sweep now counts 39 kinds. M9 is guarded by the C04/C05 `solid 2px` assertion (the fixer reports it caught).
- Scope: the delta touches only the pool modal, its tests, the e2e driver and manifest, the fixture and CHANGELOG. No other ticket's marker changed (SC-566/567/573/574), SC-591/592 were not started, and the wording is unchanged.
- Gates (measured):
  - tsc rc 0 · lint rc 0.
  - jest `1 failed, 1 skipped, 7054 passed` (twin-reuse load timeout; that suite + both pool suites alone 219/219) → **7055 / 1 skipped**.
  - lifecycle **all five parts** (the delta changes the path G-S1 drives): 21+16+9+4+2 = **52/52**.
  - e2e run 2 `252/262 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs`. Run 1 at loadavg ~27 had 2 failures: CENSUS-07 timed out at 45 s and RECOV-R07 failed (tracked SC-517/570). Both pass alone 2/2; neither is in the delta's area.
  - shots 592 rc 0 · `button host-leak OK (163 … 978 …)` · `modal button host-leak OK (… 39 button kinds … 234 comparisons)` · `capture clip OK (147 …)` · all 592 PNG hashes identical to the r2 clean-head set · freeze `280/280`.

## Delta reviewed
- `src/views/MinionStaminaPoolModal.ts`:
  - `:538-549` adds `handOffConditionFocus`.
  - `:591-600`: the click handler takes `evt`, reads the index before `container.empty()`, and runs the hand-off only when `isKeyboardClick(evt)`.
  - Uses `focusControl` and `isKeyboardClick` from `framework/chrome/focusHandoff` (SC-511/518 precedent).
- `visual-harness/entry.ts:595-598,658-660`: Goblin #4 gets `bleeding`/crimson, and a header comment explains why #4 and not #1.
- `e2e/specs/minion-pool/pool-conditions.e2e.ts`:
  - C04/C05 gain a ring assertion, an other-keys `expectNoWrite`, and a check that focus lands on "Remove Dazed".
  - New C06 removes the last condition and checks focus stays inside the modal.
  - C01 checks a mouse click leaves focus off the icons.
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:614-663`: a non-activation-keys test plus 4 focus tests (middle, last, only, pointer).
- `e2e/driver/pool.ts:65`: `conditionTitles` renamed `conditionNames`. Manifest `pool.condition` ids now C01/C04/C05/C06.
- `CHANGELOG.md:61`: the bullet now says focus moves to the next icon.

## Findings
### INFO-1 — when no icon is left, focus can land on the footer **Reset** button
- `MinionStaminaPoolModal.ts:544-548`.
- Measured in probes P1 and P3: when the row's last condition goes and later rows' kill boxes are disabled, the first enabled control after the row is the footer Reset. Reset clears staged damage and kill ticks; it writes nothing to the note.
- Failure scenario: a user stages damage, removes the minion's last condition with Enter, then presses Enter again (or holds Enter). The staged inputs reset silently. This is recoverable and the note is untouched.
- This is exactly the "next focusable after the row" rule I prescribed in r2, so the fixer complied.
- Optional tweak if the owner wants it: when no icon remains, prefer the next row's first condition icon, else the modal's initial-focus field (`pool.damage-amount`, `MinionStaminaPoolModal.ts:~87`) over the footer.
- Not blocking. ConditionsModal's analogue lands on a benign "+ Add condition".

### INFO-2 — e2e run 1 load failures
- Run 1 at loadavg 21-28 hit CENSUS-07 (a 45 s mocha timeout on the title editor / captained squad, a surface the delta does not touch) and RECOV-R07 (tracked SC-517/SC-570).
- Both pass alone (2/2), and full run 2 at loadavg ~3 is clean: `252/262 ok, 0 failed`.
- If CENSUS-07 recurs under load it may deserve a sibling flake note. Not caused by the delta.

## Probe results (real Obsidian; note seeded so Goblin #3 = Grabbed/Bleeding/Dazed and Goblin #4 = Slowed)
| Step | Conditions after | Focus |
|---|---|---|
| Tab to "Remove Bleeding" | — | `focusVisible`, `solid 2px` |
| Enter (middle) | Grabbed, Dazed, Slowed | "Remove Dazed", in modal, ring |
| Space (last in #3's list) | Grabbed, Slowed | "Remove Grabbed", in modal, ring |
| Enter on "Remove Slowed" (only one on #4) | Grabbed | `pool.reset`, in modal, ring |
| Mouse click (fresh modal) | — | `BODY` (as at 1305e0b4; r2 P5 also measured BODY) |
| Enter, then Enter again (HURT) | [] | `pool.reset` (one write each) |

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r4-rerev-be71a0a9/`)
- Gate logs, each with a `.rc` file: `tsc.log`, `lint.log`, `jest.log`, `jest-alone.log`, `lc1.log`..`lc5.log`, `e2e.log` (run 1), `e2e-rerun2.log` (CENSUS-07 + RECOV-R07 alone), `e2e-run2.log` (clean run).
- Shots and freeze: `shots-r4.log`, `shots-r4.sha256`, `freeze.log`.
- Probe: `e2e-probe.log`, `probe-results.jsonl`, `zz-rvw572r4-probe.e2e.ts.txt` (spec removed from the tree after the run), `p1-after-only.png`.
- Mutants: `m5-jest.log`, `m5-e2e.log`, `mh-jest.log`, `mh-e2e.log`, `ma-jest.log`.
- Tree after: the plugin's `git status --porcelain` is empty and HEAD is `f62e1f5e`. The superproject shows only its pre-existing ` M draw-steel-elements`.
