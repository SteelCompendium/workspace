# SC-614 r2 independent review

## Executive summary
- Verdict: **LAND.** Reviewed dse `27120710..283cb2f5` (4 commits) and superproject `a7a989ef..c98a004d` (CHANGELOG only).
- Findings: 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO. None blocks the land.
- Gates on `283cb2f5`, run by me: tsc and lint clean · jest **11900 passed / 1 skipped** (shots cache present; 0 "Exceeded timeout") · lifecycle **64/64** (21+16+9+4+7+4+3, 7 parts, no G-S115 red) · e2e **`340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (SC-257, SC-384, SC-355) · shots **592**, button host-leak **163/978**, modal host-leak **40/240**, capture clip **147** · freeze **280/280, 0 FAILED** · parity **0/0/24**. All match r1's reported numbers. Shots and freeze are now measured on `283cb2f5`, not carried from `18c986c0`.
- Mutation testing: 9 jest mutants and 1 real-Obsidian mutant. Committed tests kill every mutant that changes behaviour: no capture, no inside-the-row guard (jest F27 and e2e INIT-F16), no index shift, no family merge, `>=` shift, no restore, and the kit not passing the button. Two mutants survive. One (ring forced off) is the LOW finding. The other (capture on the tracker root) behaves the same as the fix.
- Probes: 13 jest and 8 real-Obsidian, covering the sidebar, the hero row, the creature detail row, a squad-minion row, keyboard removal of the middle, last and only chip, two quick clicks, focus outside the row, focus outside the tracker, the ring, and Live Preview. All behave as the spec says, except one synthetic stale-click case (INFO-1).
- Base: dse `origin/develop` is still `27120710`. Workspace `origin/main` moved `a7a989ef -> 4c1a884a`: one docs commit, the sc621 ledger entry for SC-633. It does not touch `CHANGELOG.md`, so the pointer-bump rebase is trivial.
- The tree is as I found it: dse at `283cb2f5`, clean. The superproject is at `c98a004d` with only ` M draw-steel-elements` (the pending pointer bump), the same as at start.

## Findings

### LOW-1: no test checks the keyboard ring, and F29's title claims it
- `test/dom/elements/initiative-matrix.test.ts:956`. The F29 title says "(the successor control, with the keyboard ring)", but the test only checks `document.activeElement`. jsdom cannot evaluate `:focus-visible` (`showedRing` falls back to `true`). The e2e INIT-F15 does not check the ring either.
- Failure scenario: a change that hands focus back with `ring: false` passes every committed test. That is mutant M7 (`{ ...focus0, ring: false }` at `src/elements/initiative/view.ts:2394`), which stays green in jest. A keyboard user would then lose the visible focus indicator after a removal.
- The behaviour itself is correct today. My real-Obsidian probes PROBE-R2A/C/D/E/L all show `ring: true` on the control that gets focus.
- Fix (small, optional before land): add `ring: !!a && a.matches(':focus-visible')` to INIT-F15's `focusState` and expect `true`. Alternatively, drop "with the keyboard ring" from F29's title.

### INFO-1: a stale-generation click (a detached chip) does not shift the index
- `src/elements/initiative/view.ts:2393-2394`. When `pressed` is no longer in the row (`removedAt === -1`), the shift is skipped. Probe P06 sets this up: chips Grabbed, Slowed, Dazed, with focus on Dazed. A mouse click removes Grabbed, and focus correctly goes to the rebuilt Dazed. A dispatched click on the detached old Slowed node then removes Slowed, and focus goes to Add Condition instead of Dazed.
- This only happens with synthetic events. Browsers hit-test against the live DOM, so a real pointer or key press cannot reach a detached node. This is the same gap that SC-186 INFO-2 already notes. No fix is needed. If one is ever wanted: when `removedAt < 0`, find the removed entry's position in `character.conditions` before filtering.

### INFO-2: keyboard removal is covered in jest only
The manifest row `e2e/manifest/initiative.ts:54` lists `init.cond.remove` as `['click']` only. The ruling did not require an e2e test for keyboard removal. My real-Obsidian probe PROBE-R2D (Tab to the Ogre's Dazed chip, real Enter) put focus on the rebuilt detail-row Add Condition, with the ring. Adding a `press:Enter` pair would be a follow-up at most.

### INFO-3: the fix also holds in Live Preview
PROBE-R2L: with focus on the detail Add Condition by script, a mouse removal in Live Preview ended with focus on Add Condition in the Live Preview tracker (`ring: true`, not on the editor, not on `<body>`), 1 s after the write went idle. The SC-602 carry takes care of the own-save redraw. The CHANGELOG wording follows the owner's ruling ("Reading view and the pinned sidebar tracker"). That wording is accurate, just narrower than the behaviour. No change is needed.

### INFO-4: the workspace base moved
Workspace `origin/main` moved to `4c1a884a` (docs only, sc621 ledger files). Rebase the superproject branch onto it at the pointer bump. dse `origin/develop` is unchanged at `27120710`.

## Probe results

### Mutation (jest: matrix SC-614, SC-603 and probe blocks plus the kit conditionIcons suite; log `mutants-summary.txt`)
| Mutant | Committed tests that went red |
|---|---|
| M1 no capture | F23 F24 F25 F26 F29 |
| M2 no inside-the-row guard (default token) | F27; also real-Obsidian INIT-F16 FAIL (my probe PROBE-R2B also FAIL) |
| M3 no index shift | F24 |
| M4 no family merge (`{}`) | F26 |
| M5 `>=` shift | F26 F29 |
| M6 no restore | F23 F24 F25 F26 F29 |
| M7 ring forced false | **none** (LOW-1) |
| M9 capture on the tracker root | none. It behaves the same as the fix: a token taken outside the row is never used, because `focusIsFree` is false |
| M10 kit passes no button | F24 + 2 kit tests |
F28 (focus on Advance round) cannot catch M2, because `restoreControlFocus` does nothing while focus is held elsewhere. F27 and INIT-F16 cover that guard.

### Jest probes (temporarily appended to the matrix test, then reverted with git checkout; 12/13 green)
P01 keyboard, middle of 3 -> Dazed chip ✓ · P02 keyboard, last of 3 -> Add ✓ · P03 keyboard, only chip -> Add ✓ · P04 two quick mouse removes with focus on Add -> Add both times ✓ · P05 stale click with focus on Add -> Add ✓ · **P06 stale click with focus on a later chip -> Add, not Dazed (INFO-1)** · P07 squad-minion detail row -> Add ✓ · P08 another row's Add (Bruno) keeps the same node ✓ · P09 hero Stamina in the same row unchanged ✓ · P10 read-only host: no remove buttons, no Add, static `.dse-cond` glyphs ✓ · P11 mouse press on the focused chip itself -> next chip ✓ · P12 focus on a chip before the removed one -> same condition ✓ · P13 the written YAML drops exactly the removed entry ✓.

### Real-Obsidian probes (temporarily appended to the e2e spec, then reverted; 8/8 ok, plus INIT-F15/F16 ok)
- R2A, pinned sidebar: Add (ring), mouse remove -> new `init.cond.add` in `.dse-sidebar`, ring kept, old node gone.
- R2B, sidebar: focus on `<body>`, mouse remove -> still `<body>`.
- R2C, sidebar: focus on the Slowed chip, mouse remove Dazed -> the rebuilt Slowed chip.
- R2D, Reading view: Tab to the Ogre's Dazed chip, real Enter -> detail Add, ring.
- R2E, Reading view: Tab to Add, mouse remove -> detail Add, ring.
- R2F: focus on detail Stamina (outside the row), mouse remove -> the same Stamina node.
- R2G: focus on Alice's Add (another row), mouse remove the Ogre's Dazed -> the same Alice Add node.
- R2L, Live Preview: see INFO-3.

No probe stole focus: the restore runs synchronously right after `rerender()`, so the user has no chance to move focus in between, and `focusIsFree` stops it whenever focus is held. `:focus-visible` follows what the old node showed. I saw no ring after a mouse press when the old control had none.

### Survey checks
- (a) Keyboard removal: confirmed fixed by the same lines (F29, P01-P03, R2D). Focus goes to the next chip, or to Add Condition after the last or only chip.
- (b) Other `rerender` callers: the only other one is the ConditionsModal apply callback (`view.ts`, Add Condition `onClick`). It is unchanged. Jest F13 passes, and e2e INIT-F11/F13 pass in the full run. Only two callers reach `buildConditionRow` (`view.ts:1758` hero row, `:2098` creature/minion detail row). Nothing calls `buildConditionIcons` without a `rebuild`.
- Shared kit `conditionIcons.ts`: the only other consumer is `src/elements/conditions/panel.ts:90` (`canRemove: false`, no `onRemove`). It is unaffected. `MinionStaminaPoolModal` has its own private `buildConditionIcons` and does not use the kit. The change adds an argument and breaks no existing caller. Read-only mode renders static spans (P10).
- Scenario ids: INIT-F15/F16 appear nowhere else in the worktrees or on develop. The jest F23-F29 ids are unique in the file. (A pre-existing duplicate `[F05]`, unrelated, is at `:768`/`:782`.)
- CHANGELOGs (dse and workspace): accurate, and both qualified to Reading view and the pinned sidebar tracker. The drive-by edit to SC-609's "Not covered" clause is correct.

## Artifacts
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc614-r2-review/`:
`g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-lc1.log` … `g-lc7.log`, `g-e2e.log`, `g-shots.log`, `g-freeze.log`, `g-parity.log`, `mutants-summary.txt` + `mut-*.log`, `probe-jest.log`, `e2e-probe-fix.log`, `e2e-mut-M2.log`, `e2e-probe-lp.log`, `status-before.txt`; probe sources `probe-jest-block.ts`, `probe-e2e-block.ts`, `probe-e2e-lp.ts`, `mutate.py`.
