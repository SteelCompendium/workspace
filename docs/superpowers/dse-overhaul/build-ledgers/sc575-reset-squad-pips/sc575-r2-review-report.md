# SC-575 r2 independent review report

**Executive summary**
- Verdict: **LAND-READY**. Reviewed dse `bcb015de` (branch `sc575-reset-squad-pips`) against base `fbaba3da`. Findings: 0 HIGH, 0 MEDIUM, 2 LOW (a stale comment, a changelog word), 4 INFO.
- The fix is complete. `Creature.actions` on a `squad_role: minion` creature is the only place squad pips are stored, and the only writer is `view.ts:1018`. Reset now clears it for every squad in the group, including multi-squad groups and squads with a captain. Probes ran the UI path, the reload-then-reset path, two blocks in one note and a fresh reopen in real Obsidian.
- Tests are not vacuous. With only the `src` line reverted, jsdom X07 FAILS, 2 of the 3 new unit cases FAIL (the third is a deliberate control) and e2e INIT-X07 FAILS (`Expected: false / Received: true`).
- Heroes and non-squad groups behave as before. The YAML written by a reset differs from base only by the minion's `actions` lines.
- `resetRound`/`advanceRound` clear squad actions. Verified at runtime: Reset turns leaves an all-false checklist at both base and head, and the existing test turnEconomy.test.ts:562 covers Advance round.
- Gates at `bcb015de`: tsc rc 0, lint rc 0, jest 7058 passed / 1 failed / 1 skipped of 7060. The one failure is twin-reuse SC-547, the SC-568 timeout at load about 18; the suite passes 53/53 alone, so the effective count is 7059 passed / 1 skipped. e2e `252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs`. G-S59 alone ok at loadavg 15.9 -> 8.7; part 5 (G-S59 G-S49) 2/2 at 8.6 -> 4.2.
- G-S59 stayed green twice under load (loadavg 4-16), so r1's two reds were load, not this change. I did not re-run shots, freeze, parity or lifecycle parts 1-4: the diff touches no render, CSS, DOM or lifecycle path (grep: no lifecycle scenario drives reset-encounter or squad-action).
- `origin/develop` moved `fbaba3da` -> `eeed5182` (SC-480) during the review. The owner said not to rebase and not to report it, so it is noted only.

## Scope reviewed

`git diff fbaba3da..bcb015de`: 5 files, +80/-35.
- `src/drawSteelAdmonition/EncounterData.ts:649-654`: `creatureType.actions = undefined` inside the existing `is_squad` / `squad_role === "minion"` loop of `resetEncounter`.
- Tests: jsdom X07 changed from `test.failing` to `test` (initiative-matrix.test.ts:842); the e2e INIT-X07 `knownBug` changed to `it` (reset-encounter.e2e.ts:102); 3 unit cases added (encounter-data.test.ts:669-711).
- `CHANGELOG.md:30-32`: a `[FIX]` bullet.
- Commit author is Scott, with no co-author trailer. That is correct per the global CLAUDE.md.

## 1. Every persisted copy of squad pips is cleared

- Writers. `grep '\.actions'` over `src/` finds four. `view.ts:943-949` writes Hero and instance `ActorActions`. `view.ts:1018-1028` writes squad `SquadActions` on `creature.actions`, reached only for `group.is_squad && squad_role === 'minion'` (view.ts:1849). `model.ts:430-445` is clearTurnState. EncounterData.ts:627 and :654 are the reset itself.
- There is no group-level copy: `EnemyGroup` has no `actions` field. Instance-level `actions` on minions are legacy and inert, and they are dropped with `instances = undefined` (EncounterData.ts:662).
- The guard matches the writer's: `validateSquad` throws on a squad creature with no `squad_role` (EncounterData.ts:478), and `promoteCaptain` refuses a minion (EncounterData.ts:439), so a creature cannot stop being a minion while it holds pips.
- Probe P1 (jsdom, through the UI) used a group with two squads (Goblin, Archer), a captain (`captain_of: Archer`) and an attached Rider, plus a plain Ogres group. It pressed Goblin Move, then Archer Maneuver and Triggered, then reset. Result: no `actions` key on any creature; the screen rebuilt after the reset shows no pressed pip for either squad; a fresh mount of the written bytes shows no pressed pip either.

## 2. Integrity: authored fields survive and blocks do not cross-talk

- In P1 these fields survive the reset unchanged: `name`, `max_stamina`, `amount`, `squad_role`, `captain_of`, `with_captain`, `is_squad`, the encounter title and `malice.round_gain`. See probe-out-head.txt, "P1 before/after reset".
- PRB-X01 (real Obsidian, scratch e2e spec plus fixture) put two `ds-initiative` blocks in one note: block 0 holds two squads and a captain, block 1 holds one squad. It pressed pips in both blocks, then reset block 0.
  - Block 0's squads were cleared and its authored fields kept.
  - Block 1's parsed YAML is JSON-identical to its state before the reset (no cross-talk).
  - The SC-576 rebuilt screen shows 0 pressed pips in block 0.
  - After the views were replaced by a fresh leaf (asserted: no old root left), block 0 shows 0 pressed pips and block 1 still shows its 1.
- P5, a base-vs-head differential: one fixture with a hero holding actions, conditions and a turn; a plain group with authored creature-level and instance-level `actions`; a squad with legacy instance actions; and a captain with a stray creature-level `actions`. `diff p5-base.yaml p5-head.yaml` shows only the 6 removed lines of the minion's `actions`. Heroes and the non-squad group are byte-identical to base.

## 3. Round-trip

- The written YAML parses in every probe. Each probe reads it back with `parseYaml`, and the fresh mount in P1 and P2 parses it again.
- P2 is the reload-then-reset path, which X07 does not cover: a note that already holds `actions: {move: true, second_move: true}` at load. The load shows both pressed. After the reset the note has no `actions`, the rebuilt screen shows none pressed, and a fresh mount shows none.
- P3: after a reset, the first toggle materializes the checklist again in the usual shape (`main: true`, the rest false).
- P4: Reset turns, then Reset encounter. The materialized all-false checklist is dropped as well.

## 4. Non-vacuity (fix reverted in a scratch copy)

`dse-revert` is `git archive bcb015de` plus `revert-fix.patch`, which removes the `src` line only.
- jsdom and unit (`jest-revert.log`): `[X07] after Reset a minion squad's shared action pips are cleared` FAILS with `Expected: false / Received: true`. Two unit cases fail with `Received: {"main": true, ... "move": true, ...}`: "a minion squad's shared `actions` is cleared…" and "every squad in a multi-squad group is cleared…". The third case (hero and plain creature) passes, as a control should. My probes P1-P4 fail too.
- e2e (`e2e-prb-revert.log`): `INIT-X07 FAIL: ... Expected: false | Received: true` and `PRB-X01 FAIL: expect(received).toBeUndefined() | Received: {"move": true, ...}`. With the fix (`e2e-prb-head2.log`) both are ok.

## 5. resetRound / advanceRound

- `clearTurnState` (model.ts:421-447) resets `creature.actions` to `EMPTY_SQUAD_ACTIONS()` for every creature whose checklist is materialized. Both `advanceRound` (model.ts:471) and `resetRound` (model.ts:491) call it.
- Runtime: in P4 the Reset turns step passes at base too; base fails only the final Reset encounter step (`jest-base.log`, `zz-sc575-probe.test.ts:241`).
- Advance round is covered by the existing test turnEconomy.test.ts:562, "Advance round resets a materialized squad checklist to all-false", which is green in the full jest run.
- This agrees with r1. There is no gap.

## Findings

### LOW-1: a stale header comment states the assumption that caused this bug
`src/elements/initiative/model.ts:27-28`: "taught resetEncounter to clear `Hero.actions` (enemy-side `actions` dies with the instances it lives on)".
- Since SC-278 that is false for a squad's shared `Creature.actions`, and it is the reasoning that let SC-575 through. A future reader who trusts the header could remove or skip the new line.
- Fix: append "— except a minion squad's shared `Creature.actions` (SC-278), which lives on the creature entry and is cleared explicitly (SC-575)". One comment line; nothing else moves.

### LOW-2: one CHANGELOG word does not match the UI label
`CHANGELOG.md:30-31`: "(or Main, Maneuver, second Move or Triggered)".
- The pip's label is "Second move" (view.ts:978). A reader looking for "second Move" in the UI will not find it.
- Fix: "Second move".
- The rest of the bullet is fine: it is in the right file (the plugin `CHANGELOG.md`) and section (`## 7.0.0 (unreleased…)`), next to SC-576. The wording is plain, and "Reset encounter -> Yes" follows the SC-576 bullet's phrasing.

### INFO-1: stray creature-level `actions` on a non-minion survives a reset but not Reset turns
- `resetEncounter` clears `Creature.actions` only for squad minions (EncounterData.ts:639). `clearTurnState` resets it for every creature (model.ts:439). P5 shows a hand-authored `actions` on a plain Ogre or a captain surviving a reset.
- No UI path writes that field and the view never reads it, so nothing visible changes.
- No action needed. If the owner wants symmetry, the reset could clear `creatureType.actions` in the all-creatures loop at :658, but that would turn the r1 unit assertion `'actions' in ogre === false` (encounter-data.test.ts:710) into a lie and would change bytes for hand-authored non-squad blocks. Not recommended in this ticket.

### INFO-2: INIT-X07 checks the note only, not the screen or a reload
- `reset-encounter.e2e.ts:102-112` reads only the note. My PRB-X01 and jsdom P1/P2 cover the screen and the reload, so I found no gap in the behaviour.
- Optional: add a `[aria-pressed="true"]` count of 0 on `init.detail.squad-action` after the write. It is cheap and pins the SC-576 rebuild path for squads.

### INFO-3: no workspace CHANGELOG bullet
- The workspace `CHANGELOG.md` `## Unreleased` has DSE bullets for SC-480, SC-556 and SC-558, but none for SC-575 (and none for SC-576 either).
- Adding one at landing is the owner's call; the routing table says user-facing DSE fixes get one.

### INFO-4: origin/develop moved
`origin/develop` moved `fbaba3da` -> `eeed5182` (SC-480). The owner asked for no rebase in this round.

## Gate numbers (worktree draw-steel-elements, HEAD `bcb015de`)

| Gate | Result | Load (start -> end) |
|---|---|---|
| tsc | rc 0, clean | low |
| lint | rc 0 (only the old `.eslintignore` warning) | low |
| jest full | `Tests: 1 failed, 1 skipped, 7058 passed, 7060 total`; the failure is twin-reuse "SC-547 … 40 same-alias blocks", a 5 s timeout (SC-568) | 3.1 -> 18.0 |
| jest twin-reuse alone | `Tests: 53 passed, 53 total` (effective full: 7059 passed / 1 skipped) | 14.7 -> 13.0 |
| e2e full | `OBSIDIAN-E2E done: 252/260 ok, 0 failed, 8 known-bug, coverage: 161/161 pairs`; known bugs SC-257, SC-355, SC-384, SC-572, SC-577, SC-578, SC-580, SC-588 | 14.4 -> 17.6 |
| lifecycle `--only=G-S59` | `1/1 ok, 0 failed` | 15.9 -> 8.7 |
| lifecycle `--only=G-S59,G-S49` | `2/2 ok, 0 failed` | 8.6 -> 4.2 |
| lifecycle parts 1-4, shots, freeze, parity | not re-run: the diff touches only `resetEncounter`'s data path, tests and the changelog. No lifecycle scenario drives reset or squad pips, and no CSS, render or DOM changed. r1's 52/52, 592/163/978/147, 280/280 and 0/0/24 stand | — |

Working tree: `git status --porcelain` was empty in the plugin before and after; HEAD is unchanged (`bcb015de`). The superproject shows ` M draw-steel-elements`, as it did at the start (the pointer is unbumped). Gates rewrote only git-ignored build output (`main.js`, `styles.css`, `e2e/.out/`). No process of mine was left running.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc575-r2-rev-a86fb519d4d8f1584/`)

- Probe sources: `probe-body.ts` (the jsdom probes P1-P5; the header is copied from initiative-matrix.test.ts), `zz-probe.e2e.ts`, `zz-probe-fixture.md`, `revert-fix.patch`.
- Scratch copies: `dse-copy/` (head), `dse-base/` (fbaba3da), `dse-revert/` (head minus the fix).
- jsdom and unit: `jest-head.log`, `jest-base.log`, `jest-revert.log`; written YAML in `probe-out-head.txt`, `probe-out-base.txt`, `probe-out-revert.txt`; P5 differential in `p5-base.yaml` and `p5-head.yaml`.
- e2e probes: `e2e-prb-head2.log` (ok), `e2e-prb-revert.log` (both FAIL; failure bundles under `dse-revert/e2e/.out/20261111-053557-d613/`).
- Gates: `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-jest-twin2.log`, `e2e-gate-e2e.log`, `gate-gs59a.log`, `gate-gs59b.log`, each with its `.rc` and `.meta` (the `.meta` records loadavg).
