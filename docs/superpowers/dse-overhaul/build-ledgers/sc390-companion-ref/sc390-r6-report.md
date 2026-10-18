# SC-390 R6 report: DSE pin bump to steel-compendium-sdk 3.1.0

Executive summary
- Verdict: DONE. One commit on dse branch `sc390-pin-bump`: **e9502a8** (base 566888a = origin/develop). Not pushed.
- npm `steel-compendium-sdk@3.1.0`, dist.shasum `58247a44f5e9f59aa8da19277a1a7540600b1009`; installed `node_modules` reads 3.1.0. Lock moved only that one entry (version/resolved/integrity + the root devDependency line); nothing else.
- `companionFields.ts` REMOVED: 3.1.0's `Statblock` has `skills?: string[]` and `freeStrike: number | string` (DTO: `skills?: string[]`, `free_strike: number | string`), identical to the local mirror; `view.ts` now uses the SDK `Statblock` (5 signatures, 1 import). No test referenced the removed type, so no test edits.
- Gates base (566888a) -> after (e9502a8): tsc clean -> clean; lint clean -> clean; jest 4500 passed / 2 skipped / 222 of 223 suites -> 4501 passed / 1 skipped / 222 of 223 (delta = environmental, below; total 4502 both); shots 572 files, 0 FAIL -> 572, 0 FAIL (all in-run OK gates identical); freeze `OK (276/276)` -> `OK (276/276)`; parity 0 gap / 0 undeclared / 24 declared -> same.
- Runtime probe green under 3.1.0: sccElement.test.ts 48/48; SC-390/companion/panther tests across sccElement + statblock 9 passed; statblock-area suites 139/139.
- Lifecycle (obsidian-lifecycle) not run: brief did not call for it; the change is a type-only import swap plus a dependency bump, and shots/freeze moved zero bytes.
- Drive-by fixes: none. Follow-ups: none new.

## Files changed (e9502a8, 5 files, +13/-36)
- package.json, package-lock.json (3.0.1 -> 3.1.0)
- src/elements/statblock/companionFields.ts (deleted)
- src/elements/statblock/view.ts (import + `CompanionStatblock` -> `Statblock` in 5 signatures; Skills cell, scalar-skills coercion, empty-EV omit untouched)
- CHANGELOG.md: SC-390 bullet under 7.0.0 (unreleased) gains "Updates `steel-compendium-sdk` to 3.1.0, which carries a companion's `skills` and its text `free_strike` ("1 + M") itself." (0ecb90e itself did not touch the changelog; this follows the file's existing "Updates `steel-compendium-sdk`" wording.)
- Commit message has no attribution trailers.

## Jest skip delta (4500/2 -> 4501/1), explained
The one skipped test is `printTwinDeltaAllowedSet.test.ts:374`, an `it.skip` whenever `visual-harness/dist/obsidian-app.css` is absent. The base jest ran before any `npm run shots` in the fresh worktree (file absent -> skipped); the base shots run then cached the sheet (mtime 15:52), so the after-run jest executed that test (passed). Not related to the SDK change. Total tests 4502 in both runs.

## Notes
- The worktree had no node_modules; base used `npm ci` at the 3.0.1 lock (log `sc390-r6-base-npmci.txt`).
- Node stack traces in jest output (`findDriftedTokens` TypeErrors) are from child-process negative tests, present in base and after; tests pass.
- Freeze baseline file untouched. Nothing pushed, tagged, landed or deployed. The main checkout was not touched.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/)
sc390-r6-report.md, sc390-r6-run.sh (battery driver), sc390-r6-{base,after}-{tsc,lint,jest,shots,freeze,parity}.txt, sc390-r6-base-npmci.txt, sc390-r6-after-npminstall.txt, sc390-r6-after-probe.txt, sc390-r6-after-probe-scc.txt, sc390-r6-after-probe-sc390.txt.
Worktree: /home/scott/code/steelCompendium/worktrees/sc390-pin-bump (dse repo draw-steel-elements, HEAD e9502a8, clean).
