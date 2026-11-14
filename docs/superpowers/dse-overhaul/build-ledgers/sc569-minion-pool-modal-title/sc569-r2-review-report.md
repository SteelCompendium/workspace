# SC-569 r2: independent review report

**Executive summary**
- Verdict: **FIX-REQUIRED (LOW only)**. The code implements OD-1 exactly. No HIGH or MEDIUM findings. Findings: 0 HIGH, 0 MEDIUM, 3 LOW, 4 INFO.
- Reviewed dse `27120710..8dbd9698` (branch `sc569-minion-pool-modal-title`). `origin/develop` is still `27120710`, so no rebase is needed.
- Gates I re-ran myself: tsc 0, lint 0. jest `11900 passed, 1 skipped` (the shots cache is present, so this equals 11899/2 fresh). e2e `340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0.
- Lifecycle, shots, freeze, parity: not re-run; r1's numbers at the same head `8dbd9698` stand (reason in §Gates). Mutation: 8 of 8 helper mutants turn the SC-569 jest block red.
- Probes (real tracker in jsdom, and real Obsidian): grid and detail-row routes give the right "(squad N)", also with a captain listed between the squads; `aria-labelledby` points at the title; at 420/760/1440 px the title wraps, is never cut off, and never runs under the X.
- LOW-1: a hand-edited `amount: 0` squad still counts, so the only squad on screen can be titled "(squad 2)".
- LOW-2: names that differ only by case or surrounding spaces get titles that look the same on screen. The Steel theme upper-cases the title, and HTML collapses whitespace.
- LOW-3: the dse `CHANGELOG.md` has no bullet. Earlier pool-modal changes (SC-566/573/574/429) each got one.
- INFO-1 (pre-existing, outside scope): `captain_of` works by name. With two same-named squads, a captain promoted onto squad 2 also counts as squad 1's captain. Worth a Backlog ticket.

## Scope and state

- Diff: 6 files, +177/-4 (`src/views/MinionStaminaPoolModal.ts`, its jest file, `e2e/specs/minion-pool/pool-open.e2e.ts`,
  `e2e/driver/pool.ts`, the new fixture `e2e/vaults/shipped/Initiative/two-squads.md`, and a row in `e2e/README.md`).
- Working tree before and after: plugin clean (only ignored build output). The superproject shows ` M draw-steel-elements`
  (the pointer, untouched by me). The plugin HEAD is still `8dbd9698`.
- Two probes touched the worktree temporarily: the helper mutants, and a geometry probe in `pool-open.e2e.ts`. Both were
  restored with `git checkout -- <file>` inside their scripts, and the restore was checked (0 dirty).

## Spec conformance (OD-1)

- One minion squad gives the old title. Two or more give `<group> - <name> - Minion Stamina Pool`. A repeated name gives
  `(squad N)`, where N is the 1-based position among the same-named squads, found by identity. This matches the
  helper at `src/views/MinionStaminaPoolModal.ts:49-56`.
- **The order on screen is `group.creatures` order.** The roster loops `group.creatures.forEach` (`view.ts:1928`), and
  `minionCreatures` filters in the same order. The tracker probe confirmed it with a group of
  `[Flow, Boss(captain), Flow]`:
  - every cell of the first squad gives "(squad 1)";
  - the captain's cell gives "Boss Stamina";
  - every cell of the second squad gives "(squad 2)".
- **Identity:** both open sites (`view.ts:2003` dblclick, `view.ts:2124` detail row) pass the closure's `creature`
  object, which comes from `group.creatures`. The detail route reaches it through `selectedInstanceKey`, which is
  `<creatureIndex>-<id>`.
  - Probe: select squad 2's cell, then open from the detail stamina readout and from `init.detail.bar`. Both give
    "(squad 2)".
- **Reorder and outside edit:** an outside edit closes the open modal (`closeForOutsideEdit`, `view.ts:237-241`). The
  next open re-renders from the new order, so a stale title is not possible.
- **Squad removed mid-fight:** a squad whose minions are all dead is still a creature entry and still shows its DEAD cells,
  so it still counts. That is consistent with what is on screen. Removing the creature entry is an outside edit, which
  re-renders the tracker.
- **Captain promoted or relieved:** `promoteCaptain` refuses a minion (`EncounterData.ts:439`), so the number of squads
  never changes. The probe confirmed the titles are unchanged after a promotion.
- **`is_squad: false`:** `minionCreatures` returns `[]`, and the tracker never opens the pool modal for such a group
  (`view.ts:1998` dblclick, `view.ts:2094` `isSquadMinion` for the detail row).
- **Old YAML:** a one-squad group with a group-level pool keeps the old title. Two-squad YAML did not exist before #67.
- **Pinned sidebar:** it is the same initiative view and code path. No third route opens this modal (grep finds only
  `view.ts:2003` and `2124`).
- **Accessible name:** `setDseTitle` (`managedModal.ts:101-106`) is the only source of the title. In real Obsidian
  `aria-labelledby` = `dse-modal-title-N` = the title's id at all three widths. Screen readers get the source text,
  not the upper-cased text.
- **Narrow widths** (real Obsidian, Steel theme, `.modal-title` has `white-space: normal` and no overflow or ellipsis):
  - At 1440 and 760 px the title fits on one line.
  - At 420 px it wraps onto two lines: "RIVER - FLOW OF THE RIVER (SQUAD 2) -" / "MINION STAMINA POOL". Nothing is cut off,
    and the first line stops just short of the X.
  - Screenshots: see §Artifacts.

## Findings

### LOW-1: a squad with `amount: 0` still counts, so the only squad on screen can be titled "(squad 2)"
- Where: `src/views/MinionStaminaPoolModal.ts:50-53` (`minionCreatures(group)` counts every minion entry).
- Scenario, measured by the tracker probe:
  - `River` holds `Flow {amount: 0}` then `Flow {amount: 2}`.
  - The roster renders cells only for the second (keys `1-1`, `1-2`), so the user sees one squad.
  - Its pool modal is titled `River - Flow (squad 2) - Minion Stamina Pool`.
  - With different names, the single visible squad would get `River - <name> - …` instead of the plain title.
  - The brief lists "`amount` hand-edited" as an edge case, and hand-editing `amount` is a supported flow
    (fixture `Initiative/amount-edit.md`, SC-600).
- Fix (owner's call, because it sharpens "the order the tracker lists them"): count only squads the roster draws.
  - Use `const squads = minionCreatures(group).filter((c) => (c.instances?.length ?? c.amount) > 0);` for both the
    `< 2` check and the same-name numbering.
  - Add a jest case `[Flow x0, Flow x2]`, expecting the plain title.

### LOW-2: names that differ only by case or surrounding spaces get titles that look the same
- Where: `src/views/MinionStaminaPoolModal.ts:51` (`c.name === creature.name`), together with the Steel rule
  `text-transform: uppercase` on `.dse-modal__title` (`styles-source.css:11541-11546`).
- Measured by the tracker probe:
  - `["Wolf","wolf"]` gives `River - Wolf - …` and `River - wolf - …`. In Steel both show as
    `RIVER - WOLF - MINION STAMINA POOL`.
  - `["Wolf","Wolf "]` and `["  Wolf","Wolf"]` (quoted YAML) differ only in whitespace that HTML collapses, so they look the same in any theme.
  - Note: the tracker's own detail row shows `Wolf #1` / `wolf #1`, so case is distinct there. Whitespace variants
    look the same on the roster too.
  - These come from hand-written YAML. Plain YAML scalars are trimmed, so only quoted names hit this.
- Fix (owner's call; OD-1 says "same creature name"):
  - Compare `name.replace(/\s+/g, ' ').trim().toLocaleLowerCase()` for the same-name check, and keep showing the raw name.
  - Add a jest case `["Wolf","wolf"]`, expecting `(squad 1)` / `(squad 2)`.
  - Alternatively, accept and document it.

### LOW-3: no bullet in the dse CHANGELOG
- Where: `draw-steel-elements/CHANGELOG.md`, `## 7.0.0 (unreleased…)`. The plugin changelog carries bullets for
  user-facing pool-modal changes: SC-566 (line ~205), SC-573, SC-574, SC-429. Ruling (c) in the ledger covers only the
  workspace `CHANGELOG.md`.
- Fix: in the fix round, add a `- [FEATURE]` bullet to the dse CHANGELOG, for example:
  "**Minion pool window names the squad when a group holds several**" (SC-569). Give the three title forms.
  Optionally add a sentence to `docs/initiative-tracker.md:309`.

### INFO-1: `captain_of` works by name, so same-named squads share a captain (pre-existing, outside SC-569)
- `promoteCaptain` writes `captain_of = minion.name` (`EncounterData.ts:450`), and `captainOfSquad` matches by name
  (`EncounterData.ts:226`).
- Probe: with `[Flow, Flow, Boss]`, `promoteCaptain(group, boss, flow2)` gives `captain_of: "Flow"`, and
  `captainOfSquad` returns Boss for BOTH squads (`squad1Captained: true, squad2Captained: true`).
- This hits the real Delian Tomb W1 group 3 shape. The captain bonus and the badge would apply to both squads.
- Recommend a Backlog ticket linked to SC-569. Not for this change.

### INFO-2: the detail-row route is not covered by SC-569's tests
- The jest DOM test builds the modal directly, and POOL-E06/E07 open only from the roster cell (`'cell'`). The detail
  route passes the same arguments, and my probe shows it gives "(squad 2)".
- Worth keeping: a tracker-level jest test that selects squad 2's cell and opens the modal from
  `.dse-init__detail .dse-init__stamina`, asserting "(squad 2)". It runs through the real pipeline; the code is in the
  probe file's `detail-row route` test (§Artifacts). The `[Flow, Boss(captain), Flow]` grid sweep from the same file is
  also worth keeping.

### INFO-3: a pre-existing layout issue at 420 px (not SC-569)
- In `r2-pool-title-w420.png` the pool modal's apply row overflows: "Apply Damage" is clipped and "damage to" wraps.
- The title is not involved. I could not check the tracker for an existing ticket; the owner may want to.

### INFO-4: tests are not vacuous; test titles are clean
- Mutants of the helper, each run against the SC-569 jest describe (7 tests). Unmutated: 7/7 pass. Each row below is
  the number of tests that turned red:

  | Mutant | Red |
  |---|---|
  | M1 drop the "(squad N)" suffix | 4 |
  | M2 number by position among all squads | 2 |
  | M3 count captains | 2 |
  | M3b count every creature | 2 |
  | M4 0-based N | 4 |
  | M5 threshold 3 | 2 |
  | M6 find the squad by name, not identity | 4 |
  | M7 old title | 5 |

  Every mutant was killed.
- The e2e tests read `textContent` in real Obsidian and assert both exact strings plus that they differ.
- No bracketed ticket id appears in an e2e title. `visual-harness/shoot.mjs:3750` matches `/ - Minion Stamina Pool$/`,
  which still holds for the new forms.

## Gates (measured at `8dbd9698`)
- `npm run tsc`: rc 0, no output (`r2-tsc.log`).
- `npm run lint`: rc 0. The only output is the usual `.eslintignore` warning (`r2-lint.log`).
- jest `--silent` after `rm -f main.js styles.css`: `Test Suites: 1 skipped, 278 passed, 278 of 279 total`,
  `Tests: 1 skipped, 11900 passed, 11901 total`, rc 0 (`r2-jest-full.log`). The shots cache
  (`visual-harness/dist/obsidian-app.css`) is present from r1's shots run, so the `printTwinDeltaAllowedSet` test runs.
  This equals the expected `11892 + 7 = 11899 passed / 2 skipped` on a fresh worktree.
- e2e: `OBSIDIAN-E2E done: 340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0 (`r2-e2e-full.log`).
  POOL-E06 ok (2052 ms), POOL-E07 ok (1961 ms).
- **Lifecycle, shots, freeze and parity were not re-run.** I relied on r1's numbers, measured at the same head
  `8dbd9698`: lifecycle 64/64 (G-S115 transient once, then 3/3), shots 592, freeze 280/280, parity 0/0/24. The reasons:
  - The diff touches only the title string, its pure helper, the jest/e2e tests, an e2e-only fixture, a driver
    constant and a README row.
  - It has no CSS, no print path, no lifecycle scenario, and no shots fixture or regex change.

## §7 survey: modals opened from the tracker whose titles can repeat within one group

Grep of every `setDseTitle` / `setTitle` in `src/`. Only the pool modal built its title from `group.name`. Two others
can show the same title for different things in one group:

| Modal | Title template | Open site | Same title for two different things in one group? |
|---|---|---|---|
| `StaminaEditModal` (creature) | `` `${name} Stamina` `` (`src/views/StaminaEditModal.ts:326`), `name = creature.name` | `view.ts:2220` (grid dblclick `view.ts:2007`, detail row `view.ts:~2130`) | **Yes.** Every instance of a creature (Ogre #1, Ogre #2) gets "Ogre Stamina". Two same-named creature entries, or captains of two same-named squads, do too. No instance id is shown. |
| `ConditionsModal` | `'Conditions'` constant (`src/views/ConditionsModal.ts:141`) | `view.ts:2417` (every hero and creature instance) | **Yes.** It is the same for every subject in the tracker, and the body does not name the subject. |
| `StaminaEditModal` (hero) | `` `${character.name} Stamina` `` | `view.ts:1765` | No. One modal per hero, and heroes are not group members. |
| `FreeHealConfirmModal` | constant `FREE_HEAL_CONFIRM_TITLE` (`FreeHealConfirmModal.ts:21`) | child of `StaminaEditModal.ts:634` | Not applicable: it is a confirm step inside its parent's window. |
| `ResetEncounterModal` | `'Confirm Encounter Reset'` | `view.ts:513` | Not applicable: there is one per tracker. |

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-review-r2/`:
- Gate logs:
  - `r2-tsc.log`, `r2-lint.log`, `r2-tsc-lint.rc`
  - `r2-jest-full.log`, `r2-jest-full.rc`
  - `r2-e2e-full.log`, `r2-e2e-full.rc`
- Mutation probe: `r2-mutants.sh`, `r2-mutants.log`, and per-mutant `r2-mutant-M*.log`.
- Tracker probe:
  - `probe/sc569-r2-probe.test.ts`, run with `probe/jest.probe.config.json` (outside the worktree).
  - `r2-probe.sh`, `r2-probe.log`, `r2-probe.rc`.
- Real-Obsidian geometry probe:
  - `r2-e2e-probe.sh`, `r2-e2e-probe.log` (`R2PROBE-GEO` lines), `r2-e2e-probe.rc`.
  - Screenshots `r2-pool-title-w1440.png`, `r2-pool-title-w760.png`, `r2-pool-title-w420.png`.
