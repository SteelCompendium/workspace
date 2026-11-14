# SC-569 r6: scoped re-review of r5's delta

**Executive summary**
- **Verdict: LAND-READY.** No findings: 0 HIGH, 0 MEDIUM, 0 LOW, 0 INFO.
- **MEDIUM-1 is fixed through the real tracker.** I re-ran the r4 probe with `[{name: 7}, {name: "Flow"}]`. All 4 cells now open, with titles "River - 7 - Minion Stamina Pool" and "River - Flow - Minion Stamina Pool", and there are 0 errors. In r4 the same probe gave 4 × `name.replace is not a function`.
- **The rest of the r4 probe still passes:** fractional, negative, all-dead, stale-instances, and before/after-parse.
- **The new tests are red without the fix.** With the `c663a137` helper they give 2 failed, 4 passed, both failures `TypeError: name.replace is not a function`. With the fix they give 6/6.
- **The docs paragraph is accurate.**
- **Superproject shape is correct:**
  - It is on `origin/main` `075b61e3`, which was re-fetched and has not moved.
  - It has two commits, `66f2f2c3` (CHANGELOG) and `03049d62`, the only pointer bump.
  - The pointer equals the dse HEAD `6785fa06`.
  - `diff origin/main --stat` shows only `CHANGELOG.md` and `draw-steel-elements`.
- **Gates I ran myself:** tsc 0, lint 0, jest `11918 passed, 1 skipped` (warm), as expected. My jest run rebuilt `styles.css` at `6785fa06`, and its sha256 `18730938…f1f9` equals r5's. So I relied on r5's numbers for e2e (342/345, 176/176), lifecycle 64/64, and shots/freeze/parity.

## Delta (`c663a137..6785fa06`, one commit, no trailer; `origin/develop` still `506786cb`)
- `src/views/MinionStaminaPoolModal.ts:38`: `squadNameKey = (name: unknown): string => String(name).replace(...)…`. This is exactly the fix r4 prescribed.
  - The displayed label still interpolates `creature.name`, so a number reads as written.
  - Other non-string names cannot throw: `String()` handles booleans, arrays and objects, and the parse already rejects a null or empty name.
- `test/dom/elements/initiative-sc569-pool-modal-title.test.ts`: two new tracker cases.
  - `name: 300` beside "Flow" gives "River - 300 - …" and "River - Flow - …".
  - Bare `300` beside quoted `"300"` gives "(squad 1)" and "(squad 2)". Folding treats them as the same creature, which matches what is on screen.
- `docs/initiative-tracker.md:319`: one paragraph in the minion pool section.
  - Its example "Wolves - Dire Wolf - Minion Stamina Pool" and the same-creature numbering ("(squad 1)", "(squad 2)", top to bottom) match the code and the e2e fixture.
  - It says "more than one minion squad", without the drawn-squads or case/space detail. That is fine for user docs and contradicts nothing.

## Checks
- **Red/green:** `r6-red.sh` checks out the `c663a137` helper (`git show`) into the file and runs the tracker file. Result: `Tests: 2 failed, 4 passed, 6 total`, with both failures at `:38 name.replace is not a function`. It then restores the file from HEAD and re-runs: `6 passed`. The tree is restored (0 dirty).
- **Probe at `6785fa06`:** `r6-probe.log`, 6/6. It is the r4 probe minus the misplaced `afterAll`.
  - `NUMERIC`: titles `0-1`/`0-2` "River - 7 - Minion Stamina Pool", `1-1`/`1-2` "River - Flow - Minion Stamina Pool", `errors: []`.
  - `NUMERIC-direct`: "River - 7 - Minion Stamina Pool".
  - FRACTIONAL, NEGATIVE, ALLDEAD, STALE-INSTANCES and PREPOST give the same values as in r4.
- **Superproject** (`/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`):
  - After `git fetch origin`, `origin/main` is `075b61e3`, and `merge-base --is-ancestor origin/main HEAD` is true.
  - `origin/main..HEAD` holds `66f2f2c3` and `03049d62`, neither with a trailer.
  - `ls-tree HEAD draw-steel-elements` is `6785fa06cb91…`, the same as the dse `rev-parse HEAD`.
  - `submodule status` shows no drift (no `+`, `-` or `U`).
  - Both working trees are clean.

## Gates (at `6785fa06`)
- tsc rc 0. lint rc 0; its only output is the usual `.eslintignore` warning.
- jest `--silent` after `rm -f main.js styles.css`: `Test Suites: 1 skipped, 279 passed, 279 of 280 total` and `Tests: 1 skipped, 11918 passed, 11919 total`, rc 0.
- I relied on r5 for e2e `342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, lifecycle 64/64, and the shots/freeze/parity numbers carried from r3. The reasons:
  - The delta is a one-token runtime change in the title helper, plus tests and docs.
  - The e2e fixture's names are strings, so its titles are unchanged.
  - The `styles.css` my jest run rebuilt hashes to r5's value, `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-review-r6/`:
- Gate logs:
  - `r6-tsc.log`, `r6-lint.log`, `r6-tsc-lint.rc`
  - `r6-jest-full.log`, `r6-jest-full.rc`
- Red/green: `r6-red.sh`, `r6-red.log`, `r6-red-jest.log`, `r6-green-jest.log`, `r6-helper-c663a137.ts`
- Probe: `probe/sc569-r6-probe.test.ts` with `probe/jest.probe.config.json`, run by `r6-probe.sh`; output in `r6-probe.log` and `r6-probe.rc`.
