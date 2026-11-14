# SC-569 r4: scoped re-review of the fix round

**Executive summary**
- **Verdict: FIX-REQUIRED.** Findings: 0 HIGH, 1 MEDIUM, 0 LOW, 2 INFO. Every r2 fold is in and correct.
- **MEDIUM-1, a regression introduced in r3:** `squadNameKey` calls `name.replace`. A creature named with a bare YAML number (`name: 300`) parses as a number. In a group with two or more squads that are drawn, every pool-modal open in that group then throws `name.replace is not a function`. Develop and r1 both handled this name. The fix is one token (`String(name)`) plus one jest case.
- **LOW-1:** amount 0, a negative amount, a fractional amount, an all-dead squad, and a stale `instances` list all count exactly as the tracker draws them. The title is the same before parse and after either parse path.
- **LOW-2:** the comparison folds case and spaces, and the title shows the raw name. Verified by tests and by mutants.
- **INFO-2:** the adopted tracker tests match the r2 probe and are not vacuous. Mutation: 16 of 17 mutants killed. The survivor (count by `amount` only) is equivalent after parse.
- **CHANGELOGs:** both bullets are plain, user-facing and accurate.
- **Superproject:** on `origin/main` `075b61e3`, with exactly one bump. `diff --stat` shows only `CHANGELOG.md` and `draw-steel-elements`. The pointer equals the dse head `c663a137`.
- **Gates I ran myself:** tsc 0, lint 0, jest `11916 passed, 1 skipped` (shots cache warm), the same as r3. I relied on r3's lifecycle, e2e, shots, freeze and parity numbers (reason in §Gates).

## State checked
- dse: `origin/develop` = `506786cb`; branch is `42bc5757`, `e4e9acb2`, `c663a137`.
  - `git range-diff 27120710..8dbd9698 506786cb..e4e9acb2` gives `=` for both r1 commits, so the rebase changed nothing.
  - None of the three commits has a trailer.
- Reviewed delta: `e4e9acb2..c663a137`. Four files changed: `CHANGELOG.md`, `src/views/MinionStaminaPoolModal.ts`, the new `test/dom/elements/initiative-sc569-pool-modal-title.test.ts`, and `test/dom/views/minion-stamina-pool-modal.test.ts`. Total +188/-6.
- The plugin working tree was clean before and after. The mutant script restored the helper from HEAD (0 dirty).

## Findings

### MEDIUM-1: a numeric creature name makes the pool modal throw in a group with two or more squads
- **Where:** `src/views/MinionStaminaPoolModal.ts:38`, `const squadNameKey = (name: string): string => name.replace(/\s+/g, ' ')…`. It is called from `:59-60`.
- **Why the name is a number:** YAML `name: 300` parses to the number 300.
  - The tracker parse coerces a number to a string only for the tracker's own top-level `name` (`src/elements/initiative/model.ts:330`). It never does this for a creature's `name`.
  - So `creature.name` is a number at runtime, even though its type says `string`, and tsc cannot catch it.
  - Everything else in the tracker only interpolates the name, so a numeric name works there.
- **Measured** with the probe, through the real tracker. The group was `[{name: 7, amount 2}, {name: "Flow", amount 2}]`:
  - The tracker renders.
  - Double-clicking any of the 4 cells raises `name.replace is not a function`, once per cell.
  - No title is ever set.
  - The jsdom mock attaches the modal container before `onOpen`, so an empty modal shell is left behind. Real Obsidian also attaches before calling `onOpen`, but I did not measure it there.
  - The detail-row route goes through the same helper.
- **Not a problem before r3:** r1 used `c.name === creature.name`, and develop used a fixed title. Both work with any name. Plausible names that trigger this: "300", "1984".
- **Fix:**
  - Change the helper to `const squadNameKey = (name: unknown): string => String(name).replace(/\s+/g, ' ').trim().toLocaleLowerCase();`. The displayed label already interpolates, so it needs no change.
  - Add one jest case through the tracker. The group is `[{name: 300}, {name: "Flow"}]` and the expected title is `River - 300 - Minion Stamina Pool`. A second, same-named `300` squad would check numbering.
  - Coercing creature names at parse time, as `model.ts:330` does for the top-level name, would be broader. It is out of scope; mention it only if you file a follow-up.

### INFO-1: one mutant survives, and it is equivalent
- Replacing the drawn-squad filter `(c.instances?.length ?? c.amount) > 0` with `c.amount > 0` passes all 16 SC-569 tests.
- That is correct. After parse, both paths set the instance count to `amount > 0 ? ceil(amount) : 0`:
  - sync path: `model.ts:287`;
  - async path: the `EncounterData` instance loop.
- Probe PREPOST measured instance counts `[0,1,2,0]` for amounts `[0, 0.5, 2, -3]` on both paths.
- The two forms differ only on an object that was never parsed and carries a stale `instances` list. The product never passes such an object to the modal. Nothing to do.

### INFO-2: the adopted probe tests are faithful and not vacuous
- `initiative-sc569-pool-modal-title.test.ts` keeps the r2 probe's `[Flow, Boss(captain), Flow]` grid sweep, now with an explicit cell-key list. It also keeps the detail-row test, opening from both the stamina readout and `init.detail.bar`, with a not-null check on the bar.
- It adds two tracker cases for amount 0. They kill M8 and M9 below.
- If the selection click fails, the detail test throws on a null readout, so it cannot pass vacuously.
- It does not adopt the captain_of and width probes. That is correct, since SC-634 and SC-635 cover them.

## The r2 folds, verified
- **LOW-1, drawn squads only.** Probed through the real tracker:

  | Case | What the tracker draws | Titles |
  |---|---|---|
  | `amount: 0.5` + `Flow x2` | 1 cell + 2 cells | "(squad 1)", then "(squad 2)" |
  | `amount: -1` + two `Flow x2` | no cells, then 2 + 2 | "(squad 1)" and "(squad 2)" (the negative squad is not counted) |
  | All-dead squad (pool 0, both `isDead`) + live squad | cells `DEAD, DEAD, 8/8 (4), 8/8 (4)` | "(squad 1)" for the dead squad's cells, "(squad 2)" for the live one (dead cells are drawn, so they count) |
  | `amount: 0` with a stale two-item `instances` list + `Flow x2` | only `1-1`, `1-2` | plain title |

  Before and after parse: the helper gives the same four titles on the raw YAML object (amount fallback), after the sync tracker parse, and after the async `parseEncounterData`.
- **LOW-2.** The key is `replace(/\s+/g,' ').trim().toLocaleLowerCase()`, and the label uses `creature.name` (`:62`).
  - The new tests check two pairs. "Wolf" / "wolf" gives "(squad 1)" / "(squad 2)", and "  Dire  Wolf " / "Dire Wolf" are numbered too, each shown as written.
  - Folding does not merge "Wolf" with "Dire Wolf".
  - Mutants M10 to M14 are each killed.
- **LOW-3 and ruling (c), the CHANGELOGs:**
  - dse `CHANGELOG.md`:
    - It is the first bullet under `## 7.0.0`, tagged `[FEATURE]`.
    - Its examples match the e2e fixture ("Wolves - Wolf", "Wolves - Dire Wolf", "River - Flow of the River (squad 1)").
    - It explains the case/space rule and the amount-0 rule in plain words. It is accurate.
  - Workspace `CHANGELOG.md`, in the worktree's superproject (`66f2f2c3`):
    - It is the first bullet under `## Unreleased` and has the same examples.
    - It leaves out the case and amount-0 detail, which is fine for this changelog.
    - It is accurate. Its two long lines match the style of the SC-621 bullet next to it.
- **Still open per the ledger, not a finding:** the one-sentence `docs/initiative-tracker.md:309` fold that you scheduled for the final round.

## Mutation table (r3 helper; runs the 16 SC-569 tests in both files)
Unmutated: 16/16 pass. Each row gives the number of tests that turned red.

| Mutant | Red | Mutant | Red |
|---|---|---|---|
| M1 drop the suffix | 10 | M9 filter `>= 0` | 5 |
| M2 index among all squads | 3 | M10 exact names | 2 |
| M3 count captains | 2 | M11 case fold only | 1 |
| M3b count every creature | 2 | M12 space fold only | 2 |
| M4 0-based N | 10 | M13 trim only, no collapse | 1 |
| M5 threshold 3 | 7 | M14 show the normalised name | 10 |
| M6 find by name, not identity | 10 | M15 `amount` only | **0** (equivalent, INFO-1) |
| M7 old title | 11 | M16 `instances` only, no `amount` fallback | 7 |
| M8 drop the drawn filter | 5 | | |

## Superproject shape (worktree `/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`)
- After `git fetch origin`, `origin/main` is `075b61e3` and `merge-base --is-ancestor origin/main HEAD` is true. `origin/main..HEAD` holds exactly two commits:
  - `66f2f2c3` docs: the CHANGELOG bullet;
  - `e490a9ae` chore: the one pointer bump to `c663a137`.
- `git diff origin/main --stat` shows only `CHANGELOG.md | 4 ++++` and `draw-steel-elements | 2 +-`.
- `ls-tree HEAD draw-steel-elements` is `c663a137d06a…`, which equals the dse HEAD.
- `submodule status` shows no `+`, so no checkout drifts from its pin. Neither commit has a trailer.
- The superproject working tree is clean.

## Gates (at `c663a137`)
- tsc rc 0 and lint rc 0. The only lint output is the usual `.eslintignore` warning.
- jest `--silent` after `rm -f main.js styles.css`: `Test Suites: 1 skipped, 279 passed, 279 of 280 total`, `Tests: 1 skipped, 11916 passed, 11917 total`, rc 0. This matches r3's 11916/1 with the cache warm.
- **Relied on r3** for lifecycle 64/64, e2e 342/345 with 176/176 pairs, shots 592, freeze 280/280, and parity 0/0/24. The reasons:
  - The delta has no CSS, print path, fixture, e2e spec or lifecycle change.
  - The helper change cannot alter the POOL-E06/E07 strings. Their fixture has amounts of 2 and names that already differ, or are already identical.
  - The rebase onto `506786cb` was conflict-free and r3 re-ran every gate after it.
- The MEDIUM-1 fix will not change any of those gates.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-review-r4/`:
- Gate logs:
  - `r4-tsc.log`, `r4-lint.log`, `r4-tsc-lint.rc`
  - `r4-jest-full.log`, `r4-jest-full.rc`
- Mutation: `r4-mutants.sh`, `r4-mutants.log`, and one `r4-mutant-M*.log` per mutant.
- Tracker probe:
  - `probe/sc569-r4-probe.test.ts` with `probe/jest.probe.config.json`, run by `r4-probe.sh`; output in `r4-probe.log` and `r4-probe.rc`.
  - Read the `R4 ` lines. The single "failed" test is the probe's own misplaced `afterAll`; its measurements were all logged before that.
