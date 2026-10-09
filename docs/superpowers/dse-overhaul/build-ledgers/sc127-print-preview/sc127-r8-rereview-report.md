# SC-127 round 8: scoped re-review of the r7 delta (dse 4c05379 on 619c4bd, superproject 795c2ae)

**Executive summary**
1. **Verdict: FIX ROUND (small).** Every r6 finding is closed, and the island is complete and correct against the pinned sheet. The island does add one new MEDIUM (a regression): it bakes Obsidian's default accent colour into the preview.
2. **r6 findings closed:** HIGH-A y · MED-A y · LOW-A y · LOW-B y.
3. **Battery** (mine, at 4c05379; every row matches the r7 report and the brief's expectation):

   | Gate | Result |
   |---|---|
   | tsc, lint | clean |
   | jest | 4060 passed / 1 skipped / 208 of 209, no flake this run |
   | shots | 524, 0 FAIL, on both sweeps; every in-run gate OK, including `SC-127 light island OK (1096 … 295 …)` |
   | freeze | 130 twin FAILED / 0 realprint / 0 missing, both sweeps |
   | parity | 0 / 0 / 16, exit 0 |

4. **Realprint moved:** 0 of 130 (confirmed by the base sweep at 619c4bd, which reproduces the frozen baseline exactly).
5. **Screen combos vs base 619c4bd:** `steel-dark` 0 of 132 moved, `steel-light` 0 of 132 moved.
6. **Rebaseline verified: y.** Both clean sweeps reproduce `sc127-rebaseline.txt` byte for byte (`cmp`). The two sweeps are identical across all 524 PNGs. Applied to a scratch copy of the baseline, it gives `freeze OK (260/260)`.
7. **The island is complete in practice:**
   - Dark twin vs light twin, all 130 captures, 34,697 nodes inside roots, every computed property including every custom property, `::placeholder` and `::marker`: **0 value differences**. The 44 textual differences are whitespace-only formatting of the same custom-property values.
   - Dark twin vs realprint: no colour differences, only the known print-media differences.
8. **NEW MED-B (regression):**
   - The generator bakes the pinned default accent (`258 / 88% / 66%`) into 34 tokens.
   - A vault with a custom accent colour gets purple accents in the dark preview, where the light vault and the real export use the user's own accent.
   - Measured on a checked checkbox with accent set to red (`0/80%/45%`): `rgb(152,115,247)` in the dark twin vs `rgb(223,24,27)` in the light twin and in realprint.
   - r3 and r5 kept `var(--accent-h)` formulas, so this is new in r7.
9. **Also:**
   - LOW-C: the jest "block equals generator output" test is presence-only and skips mapping-only tokens, and it always skips in CI.
   - LOW-D: the three stale submodule checkouts are still stale.

## Findings

### MEDIUM-B (new, a regression vs r3/r5): the island freezes Obsidian's default accent colour
- **Where:** `visual-harness/obsidian-light-island.mjs`, `generateLightIsland` → `resolveAll`. `getComputedStyle` substitutes `var(--accent-h/s/l)` with the pinned sheet's defaults: `--accent-h: 258; --accent-s: 88%; --accent-l: 66%`, declared on body at app.css:2864.
- **Resulting block:** 34 tokens are written with literal `258 / 88% / 66%`, for example `--color-accent-1: hsl(calc(258 - 1), calc(88% * 1.01), calc(66% * 1.075))`, `--interactive-accent`, `--checkbox-color`, `--text-accent`, `--link-color(-hover)`, `--tag-*`, `--text-selection`, `--blockquote-border-color`. Full list: `grep 258` on the island block, between `styles-source.css:14474` and `:14779`.
- **Failure (measured, `r8/sc127-r8-accent-probe.log`):** Obsidian's Appearance → Accent color writes `--accent-h/s/l` onto `<body>`. With red (`0 / 80% / 45%`) set there:

  | | dark preview | light twin | realprint |
  |---|---|---|---|
  | negotiation checked checkbox | `rgb(152,115,247)` (purple) | `rgb(223,24,27)` (red) | `rgb(223,24,27)` (red) |
  | `--text-accent` | `hsl(258, 88%, 66%)` | `hsl(0, 80%, 45%)` | `hsl(0, 80%, 45%)` |

  So the preview no longer proves the export for any user with a non-default accent: checkboxes, blockquote bars, tags, link hover and selection all come out wrong. This differs from the accepted custom-theme trade-off, because the accent colour is a core Obsidian setting.
- **Why no gate sees it:** every gate runs with the default accent. The island correctness check compares against the pinned `.theme-light` under the same default.
- **Fix:** keep the user inputs symbolic.
  - Resolve both passes with sentinel values on body (e.g. `--accent-h: 1234; --accent-s: 56%; --accent-l: 78%`) and rewrite the sentinels back to `var(--accent-h)` / `var(--accent-s)` / `var(--accent-l)`. Alternatively, emit the pinned sheet's declared formula for any token whose chain reads `--accent-*`.
  - Add a second correctness pass to `assertSc127LightIslandPinned` under a non-default accent on body, compared against `.theme-light` under the same accent. Can-fail: today's block must go DRIFTED on 34 tokens.
  - Regenerating changes no default-accent bytes, so it should move no frozen bytes. Verify that with a sweep.

### LOW-C: the jest island test is weaker than the sheet comment says, and it never runs in CI
- **Where:**
  - `test/unit/build/printTwinDeltaAllowedSet.test.ts:271-345` (the "amendment (3)" test).
  - `styles-source.css` comment above the block: "A jest pin … separately asserts the committed block equals what regenerating right now would produce".
- **Measured** (`r8/sc127-r8-canfail-jest-*.log`):
  - Deleting `--color-base-30` → red (1 of 21). Non-vacuous for tokens that `.theme-dark` / `.theme-light` redeclare directly.
  - Deleting `--text-normal` → **green 21/21**. Mapping-only tokens hit `undefined === undefined` and are skipped as "provably identical", the opposite of the test comment's "assumed differing, must be present".
  - Editing a value (`--color-base-30: #123456`) → **green 21/21**. Values are never compared.
  - Deleting `--hr-color` → red, but only through the hand-named regression-floor test, not this one.
  - Without `dist/obsidian-app.css` → skips gracefully (1 skipped, 20 passed).
  - `visual-harness/dist` is gitignored and CI's `npm test` runs before any harness fetch (`.github/workflows/plugin-ci.yml:38-39`), so in CI this test always skips.
- **Real protection:** the in-run guard, which does work (see below).
- **Fix:** either correct the two comments to say what the test does (presence of directly-declared theme tokens, local only), or make it exact. For example, have the generator also write a small committed manifest (token → light value) and have jest compare the block against it.

### LOW-D: item 7's "stale submodule checkouts now synced" is not true
- `git status` in the worktree superproject still shows ` M steel-etl`, ` M steelCompendium.github.io`, ` M v2`, identical to r6. `git submodule status` shows `+c4e0526… steel-etl`, `+9ea0b33… steelCompendium.github.io`, `+cde9138… v2`.
- **Fix:** `git submodule update steel-etl steelCompendium.github.io v2` in the worktree before `wt-finish`. This is a landing chore, not a code change.

### INFO
- **I-A: HIGH-A is retired.**
  - `grep '[^}]'` over `shoot.mjs` and `obsidian-light-island.mjs` returns nothing. `extractSc127HostBlockBody`, `SC127_PALETTE_LITERALS` and the census are gone.
  - The island is located by `indexOf` on two unique markers, and the correctness probe injects the whole block into a real `<style>`, so a brace in a comment cannot truncate anything.
  - A commented-out declaration containing `{ }` still fails loudly: `--hr-color` resolves `#333333` → DRIFTED.
- **I-B: 5 generator values hand-checked against app.css text. All are correct for the pinned defaults:**
  - `--color-accent-1`: `.theme-light` :2934 formula with 258/88%/66% substituted.
  - `--input-shadow`: :2939, verbatim.
  - `--text-normal` → `--color-base-100` → `#222222` (:2886, :2932).
  - `--hr-color` → `--background-modifier-border` → `#e4e4e4` (:2346).
  - `--list-marker-color` → `--text-faint` → `--color-base-50` → `#ababab` (:2445, :2888, :2929).
- **I-C: no layout token is in the set.** All 295 values are colours, shadows, gradients, `*-rgb` triplets or blend modes (`--callout-blend-mode`, `--highlight-mix-blend-mode`, `--table-selection-blend-mode`). No spacing, radius, font size, line height or weight.
- **I-D: the in-run guard can fail.** Runner built from the real `shoot.mjs` text, reading a mutated copy of the sheet (`r8/sc127-r8-canfail-island-*.log`):
  - Clean → OK.
  - Each of these, deleted → DRIFTED "MISSING", naming the token: `--hr-color`, `--link-external-color-hover`, `--input-placeholder-color`, `--color-accent-1`.
  - `--text-normal: #123456` → DRIFTED "WRONG value … #123456 vs #222222".
  - `--hr-color` commented out → DRIFTED `#333333` vs `#e4e4e4`.
- **I-E: LOW-A is non-vacuous.** Deleting the four `border*Color` entries → 1 of 21 red (`r8/sc127-r8-canfail-jest-lowA-noborder.log`).
- **I-F: other regression-risk checks hold.**
  - Light vault vs base 619c4bd, 125 captures, 33,102 nodes, full non-custom computed style: the only differences are ink `#222` → `#000` (with its `currentColor` followers: borders, outline, stroke, text-decoration and so on) plus 132 root backgrounds transparent → `#fff`. Same as r4 (`r8/sc127-r8-lightvault-base-vs-branch.txt`).
  - Per-block override and nested roots behave exactly as in r4 (`r8/sc127-r8-perblock-nested-scope.log`). The island does not match in a light vault or in real print (`hostBlockMatches: false`).
  - Hover and focus on preview number fields: white field, ink `#222`, border `#dadada`, ring `#bdbdbd`, caret `#222`; the same in dark and light.
- **I-G: hygiene.**
  - No AI trailers in `4ab8fc8`, `be45cbe`, `4c05379` or `795c2ae`.
  - `795c2ae` points at `4c05379` and carries the CHANGELOG bullet and the SKILL.md supersession sentence.
  - `visual-harness/README.md` step 5 and the sheet comment describe the island and the pin-bump procedure. The comment's claim about the jest test is wrong (LOW-C), and the trade-off paragraph does not mention the accent colour (MED-B).
  - Base checks: `origin/develop` = `619c4bd` (the branch base); superproject `origin/main` = `4e4c61b` (the base of `795c2ae`).
  - The dse and superproject status are identical before and after (`--ignored`).

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r8/`)
Logs:
- `sc127-r8-{tsc,lint,jest,parity}.log`
- `sc127-r8-shots-sweep{1,2}.log`, `sc127-r8-freeze-sweep{1,2}.log`
- `sc127-r8-base-619c4bd-shots.log`

Hashes:
- `sc127-r8-sweep{1,2}-all.sha256`, `sc127-r8-base-619c4bd-all.sha256`
- `sc127-r8-rebaseline-from-sweep{1,2}.txt`

Can-fail logs:
- `sc127-r8-canfail-island-*.log`
- `sc127-r8-canfail-jest-{del--color-base-30,del--hr-color,edit--color-base-30,del--text-normal,lowA-noborder}.log`
- `sc127-r8-jest-no-pinned-sheet.log`

Probe logs:
- `sc127-r8-leak-darktwin-vs-{lighttwin,realprint}.txt`
- `sc127-r8-lightvault-base-vs-branch.txt`
- `sc127-r8-accent-probe.log`, `sc127-r8-accent-red-perk-links-{darkTwin,lightTwin,realprint}.png`; r4-style per-block/nested/hover PNGs in `png/`
- `sc127-r8-perblock-nested-scope.log`, `sc127-r8-hover-probe.log`

Scripts:
- `sc127-r8-island-gate-runner.mjs`
- `leak.mjs`, `grab.mjs`, `cmpgrab.js`, `accent.mjs`, `mkisland.py`, `mutisland.py`, `runisl.sh`, `runjest8.sh`, `runbase8.sh`
