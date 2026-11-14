# SC-569 r1 implementer report

**Executive summary**
- Verdict DONE. dse branch `sc569-minion-pool-modal-title`, rebased onto `origin/develop` @ `27120710`; head `8dbd9698`.
- Commits (rebased shas): `f956e306` code + jest, `8dbd9698` e2e + fixture. Pre-rebase: `ed126b99`, `b7e9679f`. Not pushed, superproject untouched.
- OD-1 implemented as the exported pure helper `minionPoolModalTitle(group, creature)` in `src/views/MinionStaminaPoolModal.ts`; `onOpen()` passes it to `setDseTitle`.
- Jest +7 (5 red without the fix); e2e +2 (POOL-E06, POOL-E07; both red without the fix, 0/2).
- All gates re-run on the rebased head: tsc/lint clean, jest 11899/2 skipped, lifecycle 64/64 (one transient G-S115 fail, passed on re-run), e2e 340/343 + 176/176 pairs, shots 592, freeze 280/280, parity 0/0/24.

## Commits (dse, branch sc569-minion-pool-modal-title)
- `f956e306` feat(minion-pool): title the pool modal with the squad when a group holds several (SC-569) — src + jest
- `8dbd9698` test(minion-pool): e2e for squad-named pool modal titles, two-squads fixture (SC-569)
- Base moved mid-task (ledger "Baseline moves", owner message): rebased cleanly from `b1e4f027` to `27120710`; I stopped a running lifecycle part (my own pid only) before rebasing and re-ran every gate after.

## Helper
`export function minionPoolModalTitle(group: EnemyGroup, creature: Creature): string`
- `minionCreatures(group)` (existing helper, `squad_role === 'minion'` only; captains and `attached` not counted). Fewer than 2 squads: `"<group> - Minion Stamina Pool"`.
- Otherwise `"<group> - <name> - Minion Stamina Pool"`; if another squad has the same `creature.name`, `"<name> (squad N)"`, N = 1-based identity position (`indexOf(creature)`) among the same-named squads. If the creature is not found by identity (cannot happen from the tracker), no suffix.
- Names compared exactly (`===`): the tracker shows `creature.name` untrimmed and un-case-folded (`view.ts` 1940, 2083), so I match it.

## Tracker-order finding
The tracker renders squads in `group.creatures` order: roster cells via `group.creatures.forEach((creature, creatureIndex) => ...)` (`src/elements/initiative/view.ts` ~1928); `minionCreatures` filters in the same order. No other ordering; "top to bottom" = `group.creatures` order.
Title wiring: `setDseTitle` (`src/framework/kit/managedModal.ts:101`) is the single source for the `.dse-modal__title-text` span and `aria-labelledby`; nothing else shows the title. Both open sites (`view.ts` 2003 dblclick, 2124 detail row) pass `creature` by identity, unchanged.

## Tests, red without the fix
- Jest, `test/dom/views/minion-stamina-pool-modal.test.ts`, new `describe('SC-569: ...')`, 7 tests: one squad; one squad + captain + attached; two differently named; two same-named (squad 1/2); three squads with two same-named; captain between squads does not shift numbering; DOM test opening the modal for each squad of a 3-squad group (title text and `aria-labelledby` -> title id). With a stub returning the old title: **5 failed, 2 passed** (the two unchanged-title tests); with the fix 7/7.
- e2e, `e2e/specs/minion-pool/pool-open.e2e.ts`: **POOL-E06** (two differently named squads, "Wolves - Wolf" vs "Wolves - Dire Wolf") and **POOL-E07** (two same-named squads, "River - Flow of the River (squad 1)" / "(squad 2)"). Fix temporarily disabled: **0/2 ok, 2 failed** (E07 received "River - Minion Stamina Pool"); with the fix 2/2.
- New fixture `e2e/vaults/shipped/Initiative/two-squads.md` (groups "Wolves" and "River"), README fixture row, `TWO_SQUADS` const in `e2e/driver/pool.ts`. No SC-435 two-squad fixture existed. No bracketed ticket id in test titles; the titles are asserted via `textContent` (the theme upper-cases on screen). No manifest change needed (same pairs).

## Gates (rebased head 8dbd9698, base 27120710), logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r1/`
- tsc exit 0 (`tsc-3.log`); lint exit 0 (`lint-3.log`).
- jest `--silent`: `Tests: 2 skipped, 11899 passed, 11901 total`; `Test Suites: 1 skipped, 278 passed` (expected 11892 + 7 = 11899) (`jest-full-3.log`).
- lifecycle, seven parts (union 64/64): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, and part 7 (`G-S108,G-S112,G-S115`) — first run `2/3 ok, 1 failed`: `G-S115 FAIL: (g) hover rv card top: values [5,5], want [6,5]; ... "changed on disk first"` at loadavg 17 (`lifeR-7.log`); immediate re-run alone `3/3 ok, 0 failed` (`lifeR-7b.log`). The pool modal is not on that path (SC-621 `rebaseCardPin` scenario); reported as a transient, not re-investigated. Logs `lifeR-1.log` .. `lifeR-6.log`.
- e2e: `OBSIDIAN-E2E done: 340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (`e2e-full-r.log`; expected 338/341 + 2).
- shots: 592 written (`ok` lines 592, `visual-harness/shots` 592 files); button host-leak 163 kinds / 978 comparisons OK; modal button host-leak 40 kinds / 240 comparisons OK; capture clip 147 OK; exit 0 (`shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`freeze.log`).
- parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 (`parity.log`).
- Pre-rebase run (base `b1e4f027`) for reference: jest 11864, e2e 340/343 + 176/176, lifecycle parts 1-2 green; superseded.
- Working tree clean after gates (no dirty `appearance.json`). `npm ci` was needed once: the fresh worktree had no `node_modules`.

## Drive-by fixes
None.

## Follow-ups
- Other modals with the same ambiguity (two modals opened from one group/row sharing a title) were not examined or changed, per brief.
- Parity-neutral note: the pool modal's creature name is shown raw in the title; a very long creature name plus group name lengthens the title (no truncation exists); not addressed.
- G-S115 can fail once at high load (loadavg ~17) with a "changed on disk first" Notice; passed on immediate re-run. Possible timing flake worth a ticket if it recurs.
- Workspace-level doc/CHANGELOG entry for the user-facing title change (`CHANGELOG.md` `## Unreleased`) was not made (superproject untouched per brief); the owner should add it at land.
