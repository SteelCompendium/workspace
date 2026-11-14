# SC-569 r5 fix report

**Executive summary**
- Verdict DONE. MEDIUM-1 (numeric creature name threw in `squadNameKey`) fixed with `String(name)`; docs sentence added. Not pushed.
- dse head `6785fa06` (one new commit on `c663a137`); origin/develop still `506786cb`, no rebase.
- Superproject head `03049d62`: `66f2f2c3` (CHANGELOG, kept) + `03049d62` (the ONE pointer bump, replaced, now to `6785fa06`) on origin/main `075b61e3` (unmoved). `diff origin/main --stat`: only `CHANGELOG.md` and `draw-steel-elements`.
- New jest +2 (both red on `c663a137` with `name.replace is not a function`, green after).
- Gates: tsc/lint 0, jest 11918 passed / 1 skipped (warm), e2e 342/345 + 176/176 pairs, lifecycle 64/64. shots/freeze/parity not re-run: `styles.css` sha256 identical to the `c663a137` build.

## Change
- dse commit `6785fa06` fix(minion-pool): numeric creature name no longer throws in the pool modal title; tracker docs sentence (SC-569).
- `src/views/MinionStaminaPoolModal.ts`: `const squadNameKey = (name: unknown): string => String(name).replace(/\s+/g, ' ').trim().toLocaleLowerCase();`. The displayed label interpolates `creature.name` in a template string, so a number reads as written (`300`); verified by the tests.
- `docs/initiative-tracker.md` ("Stamina Pool Modal for Minions"): one paragraph saying the window's title names the squad when a group holds several, with the "Wolves - Dire Wolf" example, and that same-named squads are numbered "(squad 1)", "(squad 2)" in tracker order.

## Tests (`test/dom/elements/initiative-sc569-pool-modal-title.test.ts`, through the real tracker)
- `name: 300` squad beside a "Flow" squad: titles "River - 300 - Minion Stamina Pool" and "River - Flow - Minion Stamina Pool".
- A numeric `300` and a quoted `"300"` squad: same creature, "(squad 1)" / "(squad 2)".
- Red on `c663a137` (same tests, old helper): 2 failed, `TypeError: name.replace is not a function` (`jest-red.log`). Green after: 18 passed of the SC-569 selection, 0 failed (`jest-green.log`).

## Gates on `6785fa06` (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r5/`)
- tsc exit 0 (`tsc-5.log`); lint exit 0 (`lint-5.log`).
- jest `--silent`: `Tests: 1 skipped, 11918 passed, 11919 total`; `Test Suites: 1 skipped, 279 passed` (`jest-full-5.log`). Warm shots cache. 11916 + 2 (two cases, not the one expected).
- e2e: `OBSIDIAN-E2E done: 342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (`e2e-full-5.log`).
- lifecycle, seven parts, union 64/64: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, part 7 (`G-S108,G-S112,G-S115`) 3/3 at loadavg 2.5 (`life-1.log` .. `life-7.log`). No G-S115 red.
- styles.css sha256 (build of `c663a137`, before): `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`; after the e2e and lifecycle builds of `6785fa06`: `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (identical; `styles-baseline.txt`). So r3's shots 592 / host-leak 163/978 / modal 40/240 / clip 147, freeze 280/280 and parity 0/0/24 carry.
- Working tree clean after gates.

## Superproject (`/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`)
Soft reset to `66f2f2c3` + mixed reset (submodule checkout stayed on `6785fa06`), then the bump re-committed: `03049d62`. `ls-tree HEAD draw-steel-elements` = `6785fa06cb91...`. `origin/main..HEAD` = exactly `66f2f2c3`, `03049d62`.

## Drive-by fixes
None.

## Follow-ups
- The reviewer's broader idea (coerce creature names to strings at parse time, as `model.ts:330` does for the tracker's top-level name) was left out of scope.
