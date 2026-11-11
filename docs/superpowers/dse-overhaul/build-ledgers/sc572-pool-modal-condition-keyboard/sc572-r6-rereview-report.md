# SC-572 r6 scoped re-review report (rebase onto eeed5182 + INFO-1 fold a339e7b3)

## Executive summary
- Verdict: **LAND-READY**. Head `a339e7b3` on dse develop `eeed5182`; origin/develop has not moved. Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 1.
- (a) Rebase: `range-diff 97a9c93b..f62e1f5e eeed5182..5b599f70` gives 4/4 `=`. There were no conflict resolutions, so nothing else needed review.
- (b) Fold, measured in real Obsidian 1.14.4:
  - Setup: 1 damage staged, then both of Goblin #3's conditions removed by keyboard (Enter, then Space).
  - Focus lands on `pool.damage-amount` with a `:focus-visible` solid 2px outline in `rgb(77, 184, 199)`.
  - Two more Enters on the field make no write. Apply still reads "Deal 1 damage" and the modal stays open.
  - Mouse clicks still leave focus on `<body>`, as before.
- Mutant "fold reverted" (the source file restored to 5b599f70) is caught: jsdom 1 fail (the only-icon focus test) and e2e POOL-C06 fail.
- Gates (measured on a339e7b3):
  - tsc rc 0 · lint rc 0.
  - jest `1 failed, 1 skipped, 7081 passed` (twin-reuse load timeout; that suite + both pool suites alone 222/222, including 3 temporary probe tests) → **7082 / 1 skipped**.
  - e2e `OBSIDIAN-E2E done: 254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs` (rc 0).
  - lifecycle part 1 `21/21 ok` (G-S1 drives the pool icon) and part 5 `G-S59 G-S49 G-S73` `3/3 ok`.
  - shots and freeze skipped as briefed: the fold touches only the pool modal source, its jsdom test and its e2e spec (no CSS, no harness), and the rebase had no resolution.

## Findings
### INFO-1 — the fallback path can still land on "Decrease Stamina pool"; unreachable today
- `src/views/MinionStaminaPoolModal.ts:547-551`.
- Measured with a temporary jsdom probe (deleted after the run):
  - Damage field disabled, only icon in the last row: focus goes to `pool.stamina.dec` ("Decrease Stamina pool").
  - Damage field removed from the DOM, same row: also `pool.stamina.dec`.
  - Damage field disabled, a later row still has an icon: focus goes to that icon ("Remove Dazed").
  - Never `<body>`, never the footer.
- `pool.stamina.dec` is the control SC-429 moved initial focus away from, because Space or Enter there decrements the pool. A second Enter would therefore change the staged pool; it writes nothing until Apply.
- Not reachable today: nothing in the modal ever disables or removes `pool.damage-amount` (`:147-158` is its only construction, with no `disabled` writes).
- Optional hardening: drop the `focusable[0]` fallback in favour of `this.damageInput ?? <first non-footer input>`. Not needed to land.

## Probe results
Real Obsidian (`e2e-probe.log`, `probe-results.jsonl`, screenshot `p1-damage-focus.png`):

| Step | Result |
|---|---|
| Stage 1 damage | Apply reads "Deal 1 damage" |
| Enter on "Remove Grabbed", then Space on "Remove Dazed" | names `[]`; focus `pool.damage-amount` (INPUT, value "1"), `focusVisible`, `outline solid 2px rgb(77, 184, 199)`, `box-shadow none`, in modal |
| Enter, Enter | no write; Apply still "Deal 1 damage"; focus unchanged; modal open |
| Two mouse clicks on icons (fresh modal) | focus `BODY`, unchanged pointer behaviour |

jsdom fallback (`jest-alone.log`, `jest-fallback-values.log`): the three cases above, all inside the modal, none in the footer.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r6-rerev-be71a0a9/`)
- Rebase: `range-diff.log`.
- Gate logs, each with a `.rc` file: `tsc.log`, `lint.log`, `jest.log`, `jest-alone.log`, `e2e.log`, `lc1.log`, `lc5.log`.
- Probes: `e2e-probe.log`, `probe-results.jsonl`, `p1-damage-focus.png`, `jest-fallback-values.log`, `zz-rvw572r6-probe.e2e.ts.txt` and `zz-rvw572r6-probe.test.ts.txt` (both removed from the tree after their runs).
- Mutant: `mfold-jest.log`, `mfold-e2e.log`.
- Tree after: the plugin's `git status --porcelain` is empty at `a339e7b3`. The superproject shows only its pre-existing ` M draw-steel-elements`.
