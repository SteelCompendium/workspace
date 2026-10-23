# SC-485 r1 implementation report

## Executive summary

- Verdict: DONE_WITH_CONCERNS. The only red is the known environment break (`HOST COPY DRIFTED` in `npm run shots`); nothing else failed.
- Plugin head `bf0e678` on base `d152ea4` (origin/develop, unchanged). Superproject head `3f1adc1` on base `00e2f37` (CHANGELOG only; the submodule pointer is untouched, `M draw-steel-elements` is the unstaged pointer).
- tsc (incl. `-p e2e`) clean rc 0; lint clean rc 0. jest 5794 passed / 2 skipped / 239 of 240 suites (fresh-worktree shots-cache effect: 5794 + 1 = 5795 against baseline 5769, so +26 new tests; suites +1).
- lifecycle 32/32 ok, G-S8 and G-S15 not vacuous (sizer fell to 2446px under the pin, scrollTop held). e2e `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`.
- shots 592 PNGs, 0 FAIL, then the run stops at `HOST COPY DRIFTED` (Obsidian 1.15.0 vs pinned 1.14.0), rc 1. freeze `OK (280/280)`. parity `0 gap(s), 0 undeclared warning(s), 24 declared`.
- Mutants proved red: drop the resolveRefs re-snapshot (4 red), drop the pool unit (3 red), record generated instances per key (13 red).

## Commits

Plugin (`/home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys/draw-steel-elements`):
- `205369f` test(SC-485): re-based oracle + pipeline write cases (red on base: 25 failed on stock src)
- `37c0108` fix(SC-485): ds-initiative stops writing default keys the user never wrote (model.ts, resolveRefs.ts, shared helper + its unit test)
- `c12635e` test(SC-485): e2e INIT-DEF-E01..E04 + `Initiative/full.md` fixture; INIT-STAM-E08 re-based; architecture note
- `bf0e678` test(SC-485): INIT-DEF e2e reaches its writes through wdio directly so the manifest coverage gate stays 69/69

Superproject: `3f1adc1` docs(SC-485): changelog bullet under `## Unreleased`.

## Design as built (report section 2, with deviations)

- `model.ts`: module-private `WeakMap` of absent keys per object; `noteAbsent` runs before each fill (top, hero, group, creature, authored instance). `snapshotFilledDefaults(model)` is exported, called at the end of `parse` and at the end of `resolveInitiativeRefs`. `serialize` is a nested DTO walk (instances, creatures, groups, heroes, top) using `omitUntouchedDefaults`, SC-377 name-first kept. Plugin-built models have no record and serialize whole (M03 pinned).
- Helper (additive): `isUntouchedDefault(owner, key)` (undefined counts as untouched) and an optional third parameter `keep: ReadonlySet<string>` on `omitUntouchedDefaults`. All SC-466/SC-482 tests pass unchanged.
- Pool unit: `poolUnitWritten(group, minion)`: any of {pool on live home (creature first, else group), the three trio keys} not untouched, so all four go out through the `keep` sets.
- Deviation from the prototype: no one-key DTO trick; the helper export replaces it. Authored instances record keys per branch (regular: current_stamina, temp_stamina, conditions; minion: conditions). Generated instances carry no record (the list is compared whole at the creature level).
- Header comment rewritten ("BYTE-COMPAT boundary" text); `.repo-docs/architecture.md` sentence "Initiative ... still write their parser defaults" replaced with the initiative mechanics (hero stays deliberate).

## Tests

- New `test/dom/elements/initiative-default-keys.test.ts`: 23 tests (C01-C09, C12-C17, C19-C25 subset, M03, M04, C22/C23 as one `test.each` of 2). Real ElementPipeline + DOM action + exact `replaceSource` bytes.
- Helper unit tests: +3 in `test/unit/elements/undeclaredDefaults.test.ts`. Total new jest: 26.
- Re-based (count unchanged): `test/unit/model/initiative-serialize.test.ts` (oracle split into fully-authored `serialize(parse(L)) === L` and minimal-untouched `parseYaml(serialize(parse(src)))` equals source modulo condition normalisation; SC-195 captained-squad test now asserts the pool unit after a pool write), `initiative.test.ts` M-1 captain_bonus_n (pool write then fixed point), `initiative-sc417-minion-squad.test.ts` HIGH-1 (`written()` reads through `parse`). 9 tests, as predicted.
- e2e: new `e2e/specs/initiative/default-keys.e2e.ts` INIT-DEF-E01..E04 (exact `toEqual` on the block; E03 raw-text one-line diff) + fixture `e2e/vaults/shipped/Initiative/full.md`. Existing `INIT-STAM-E08` (stamina-entry.e2e.ts, outside the listed fence) re-based: after damage then heal back to full it asserted `current_stamina: 30`; that key is now (correctly) not written. Changed to assert the hero is `{name, max_stamina}` with no `current_stamina`.
- Red first: with `src/` stashed, the 4 test files fail 25 tests on base (log below).

## Mutant-red proofs (each restored with `git checkout src`; tree clean afterwards)

1. Drop the `snapshotFilledDefaults` call in resolveRefs: red C12, C13, M04, C21.
2. `poolUnitWritten` always false: red C22, C23, and the SC-195 captained-squad serialize test.
3. Record generated instances per key (force `absentKeys` for each generated regular instance): 13 red incl. C01-C05, C24, T-1 quick-start/squad/shape pins.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-impl-x4k7qp/`, prefix `sc485-i-`)

- tsc: rc 0 (`sc485-i-tsc2.log`). lint: rc 0 (`sc485-i-lint2.log`).
- jest: rc 0 `Tests: 2 skipped, 5794 passed, 5796 total`, `Test Suites: 1 skipped, 239 passed, 239 of 240 total` (`sc485-i-jest.log`).
- lifecycle (port 9347): rc 0 `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` (`sc485-i-life.log`).
- e2e: rc 0 `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`; run dir `e2e/.out/20261023-130603-d731` (`sc485-i-e2e2.log`). A first full run had rc 1 on the coverage gate (3 css-driven pairs in no manifest); fixed in `bf0e678`.
- shots: rc 1, 592 PNGs, 0 FAIL lines, stopped at `HOST COPY DRIFTED` (known environment break, not edited) (`sc485-i-shots.log`).
- freeze: rc 0 `freeze OK (280/280 frozen print PNGs byte-identical ...)`. parity: rc 0 `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Shots-dependent checks after the drift stop (host-leak, text-scale) did not run; to be re-run after the pin-bump fix lands.

## Drive-by fixes

None.

## Follow-ups

1. Pool unit edge: a source that authors the captain trio (e.g. `captain_bonus_active: true`) but not the pool writes the pool on the first click of anything (authored key counts as "would be written", per the ruling). Rare; harmless on reload.
2. e2e: `dse.click` on any control with no `data-dse-control` id fails the coverage gate ("driven pair in no manifest"). INIT-DEF E01/E03/E04 therefore press the Steel turn overlay, the chrome Reset item and the confirm button through wdio directly. Giving them ids + manifest rows would be the cleaner fix (src change, out of fence).
3. `npm run shots` red on this machine: Obsidian 1.15.0 vs pinned 1.14.0 (rules #3, #5, #6 differ only in whitespace). Owner already knows.
4. Concern for the land-ready comment (D1 omit): a damaged `current_stamina` written for a statblock-only hero can exceed a later-lowered statblock max.
