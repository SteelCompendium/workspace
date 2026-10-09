# SC-127 round 10: scoped re-review of the r9 + r9b delta (dse 5329c56 on 9ded832, superproject 17e1291)

**Executive summary**
1. **Verdict: APPROVE.** Every r8 finding is closed and the product behaviour is correct. Three LOW notes remain, all about test and guard plumbing; none blocks the sanction ask or landing.
2. **r8 findings closed:** MED-B y · LOW-C y · LOW-D y.
3. **Battery** (mine, at 5329c56; every row matches the brief's expectation):

   | Gate | Result |
   |---|---|
   | tsc, lint | clean |
   | jest | 4252 passed / 1 skipped / 214 of 215 |
   | shots | 544, 0 FAIL on both sweeps; `SC-127 light island OK (… correct at the default accent AND under a non-default accent …)`, `print-twin delta OK (135 capture ids …)` |
   | freeze | exactly 131 twin FAILED / 0 realprint / 0 missing, against the 262-line baseline |
   | parity | 0 / 0 / 24 DECLARED, exit 0 |

4. **Realprint moved:** 0 of 135 vs base 9ded832, including the 4 ids that are not in the baseline. The base sweep reproduces the baseline: `freeze OK (262/262)`.
5. **Screen combos:** `steel-dark` 0 of 137 moved, `steel-light` 0 of 137 moved.
6. **Rebaseline verified: y.** Both clean sweeps reproduce the 131-line `sc127-rebaseline.txt` byte for byte (`cmp`). The two sweeps are identical across all 544 PNGs. The FAILED set equals the rebaseline's name set, in baseline order. Applied to a scratch copy of the baseline, it gives `freeze OK (262/262)`.
7. **MED-B is fixed in behaviour as well as in text.** Under a red accent (`0 / 80% / 45%`), dark twin vs light twin over 135 captures and 36,159 nodes (every computed and custom property, `::placeholder` and `::marker`) shows 0 value differences; all residual differences are whitespace formatting. The negotiation checked checkbox is `rgb(223,24,27)` in the dark twin, the light twin and realprint.
8. **LOW notes (none blocking):**
   - L1: a guard exception still surfaces as `FAIL sweep (exception)` and skips the gates after it.
   - L2: dropping `lightDefault` from the generator's return again (r9 bug 2) leaves jest green.
   - L3: the "extra, local-only" manifest-vs-sheet test is a tautology.
   - I-1: 4 unbaselined ids' twins also move with SC-127.

## Per item
1. **MED-B**
   - The 34 accent-derived tokens are formulas over `var(--accent-h/s/l)`, e.g. `--color-accent-1: hsl(calc(var(--accent-h) - 1), …)`. That is exactly the set r8 found baked (set-equal).
   - 0 manifest values still contain `258`, `88%` or `66%`.
   - Rendered under the red accent: `--text-accent` = `hsl(0, 80%, 45%)` and the checkbox is red in all three modes (`r10/sc127-r10-accent-probe.log`, PNGs `r10/sc127-r10-accent-red-perk-links-*.png`). The full-property comparison is in `r10/sc127-r10-leak-redaccent-darktwin-vs-lighttwin.txt`.
   - In-run guard can-fails, using a runner built from the real `shoot.mjs` text (`r10/sc127-r10-canfail-island-*.log`):
     - Baking `--color-accent-1` → `DRIFTED (non-default accent)` 1 of 295 (`…258… vs …0…`).
     - Baking `--checkbox-color` → the same.
     - In both cases the default-accent pass stayed clean; it runs first and passed. This is exactly the way the regression hid.
     - Deleting `--text-normal` → MISSING.
     - Editing `--hr-color` → WRONG value.
     - Clean → OK.
2. **The two guard bugs**
   - The default-accent pass compares `findDriftedTokens(differing, ours, lightDefault, …)`, a resolved value against a resolved value. Like with like is confirmed by a clean pass at the default accent and by the can-fails above.
   - Helper can-fail: making `findDriftedTokens` return `[]` on a missing map → 2 of 33 red (`r10/sc127-r10-canfail-jest-helper-silentpass.log`).
   - **L1, not fixed:** a guard exception can still surface as a generic sweep exception. `findDriftedTokens` now throws a named `TypeError` ("findDriftedTokens: … missing from targetMap"), but `shoot.mjs:5382-5386` catches it as `failures.push({outName:'sweep', …})` → `FAIL sweep (exception)`. Every gate after the island check (button/input/table/list/inline/link/checkbox/prose host-leak, modal anchoring) is skipped for that run.
     - Fix (optional): wrap `assertSc127LightIslandPinned` in its own try/catch that prints `SC-127 LIGHT ISLAND CHECK CRASHED — <e>` and exits 1.
   - **L2:** removing `lightDefault` from `generateLightIsland`'s return (bug 2 re-introduced) → jest 33/33 green (`…-gen-noreturn-lightDefault.log`). The jest tests cover the helpers, not the generator's return shape. Only a full sweep would catch it, and through L1's generic path.
     - Fix (optional): a jest test that asserts `generateLightIsland`'s return contains `lightDefault`, textually or via a subprocess with a stubbed page.
3. **LOW-C**
   - The manifest test compares names and values, including mapping-only tokens: deleting `--text-normal` from the block → red; editing its value → red. Clean: 33/33.
   - It never skips in CI because it reads the committed `visual-harness/obsidian-light-island.manifest.json`, not the gitignored `dist/`.
   - The sheet comment and the README now say the in-run guard is the enforced check; that is true.
   - **L3:** the "extra, local-only" test (`printTwinDeltaAllowedSet.test.ts`, describe `LOW-C (extra, local-only)`, its final loop) iterates `Object.keys(manifest)` and pushes when `!(t in manifest)`. That is a tautology and can never fail.
     - Proof: delete `--color-base-30` from both the block and the manifest → jest 33/33 green (`…-both-del-color-base-30.log`). Only the in-run guard catches it.
     - Fix: compare against the sheet-derived name set (the r7 logic), or delete the test and its claim.
   - `obsidian-light-island.mjs --check` → `light island up to date (295 of 1096 …; 34 … accent-derived)`.
4. **LOW-D:** superproject `git status --short` is empty. `steel-etl` (`88aec3b`), `steelCompendium.github.io` (`2c939ef`) and `v2` (`3bfe2ce`) are at their pins, with no `+` in `git submodule status`.
5. **Rebase integrity**
   - `git diff 9ded832..5329c56` touches only the 13 SC-127 files (`styles-source.css`, `shoot.mjs`, the generator, the manifest, 3 tests, README, 3 docs, the docs PNG, `package.json`).
   - Every deleted line in `shoot.mjs` and `styles-source.css` is an intentional SC-127 removal (`NATIVE_CONTROL_PAINT_PROPS`, the old walk, the old self-test, the old prop comment).
   - The dse rebase had 0 conflicts. The neighbouring tickets' develop content is untouched by the diff.
6. **Battery:** see the summary.
7. **Hygiene**
   - No AI trailers in the 13 dse commits or in `17e1291`.
   - `17e1291` points at `5329c56`, sits on `origin/main` `49d6aef`, and carries the CHANGELOG bullet and the SKILL.md supersession sentence. SKILL.md's newer records (SC-338, SC-232 and others) are intact.
   - Trees: identical `--ignored` status before and after. All mutations were restored and checked with `cmp`.
   - Note: `visual-harness/shots/` now holds my base-9ded832 sweep. It is gitignored, but re-run `npm run shots` before using its PNGs.

## INFO
- **I-1:** 4 capture ids on the tree have no baseline lines yet: `feature-ability-provenance`, `feature-trait-provenance`, `featureblock-narrow`, `statblock-narrow`. Their twins also move with SC-127 (base vs branch: 4 of 4 print MOVED, 4 of 4 realprint SAME). If their pending widenings are applied with pre-SC-127 twin hashes after SC-127's rebaseline, freeze goes red on those 4. Hand the landing dispatcher the post-SC-127 twin hashes from `r10/sc127-r10-sweep1-all.sha256`, or apply the widenings first and re-sweep.
- **I-2:** installed Obsidian is now **1.14.3**. Generating the island from 1.14.3's app.css gives 320 differing tokens vs the committed 295: +25 (e.g. `--highlight-background*`, `--bases-kanban-*`, `--setting-item-name-color`, `--tooltip-shadow`), 0 removed, 3 changed (`--modal-border-color`, `--prompt-border-color`, `--titlebar-background-focused`) (`r10/sc127-r10-island-vs-obsidian-1.14.3.log`). This is expected under the pin model: the next pin bump regenerates per README step 5. Until then a 1.14.x user's dark preview can show those 25 tokens in dark values (e.g. a `==highlight==` mark background).

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r10/`)
Logs:
- `sc127-r10-{tsc,lint,jest,parity}.log`
- `sc127-r10-shots-sweep{1,2}.log`, `sc127-r10-freeze-sweep{1,2}.log`
- `sc127-r10-base-9ded832-shots.log`
- `sc127-r10-genisland-check.log`

Hashes:
- `sc127-r10-sweep{1,2}-all.sha256`, `sc127-r10-base-9ded832-all.sha256`
- `sc127-r10-rebaseline-from-sweep{1,2}.txt`

Can-fail logs:
- `sc127-r10-canfail-island-*.log`
- `sc127-r10-canfail-jest-*.log`

Probe logs:
- `sc127-r10-leak-redaccent-darktwin-vs-lighttwin.txt`
- `sc127-r10-accent-probe.log`, `sc127-r10-accent-red-perk-links-*.png`
- `sc127-r10-island-vs-obsidian-1.14.3.log`

Scripts:
- `sc127-r10-island-gate-runner.mjs`
- `mkisland.py`, `mutisland.py`, `mutgen.py`, `runisl.sh`, `runjest10.sh`, `drift143.mjs`, `accent.mjs`
