# SC-236 round 3 — independent review of DSE `a1c39fa` (base `6c4f6aa`)

## Executive summary

- **Verdict: CHANGES-REQUIRED.** The fixes are small: comments plus one docs image. The code, data fix, tests, guard and rebaseline are all correct and proven.
- Findings: 0 CRITICAL / 0 HIGH / **3 MEDIUM** / 2 LOW / 6 INFO.
- Battery at `a1c39fa` (load 0.6–5.8): tsc clean · lint clean, exit 0 · jest **3998 passed / 1 skipped / 3999**, 206 of 207 suites, 3 snapshots · lifecycle **6/6 ok**, exit 0 · shots **524 PNGs, 0 FAIL** · parity **0 gaps / 0 undeclared / 16 declared**, exit 0. All of these equal the r2 report's numbers.
- Freeze: `FREEZE VIOLATED (8 checksum mismatches, 0 missing)`. The mismatch set is exactly `feature`, `feature-collapsed`, `chrome-collapsed-rollout` and `feature-spend`, each × `--steel-print` and `--steel-realprint`.
- **rebaseline.txt verified: YES.** All 8 hashes equal this run's hashes. Applying the file to a scratch copy of the baseline gives `freeze OK (260/260 …)`, exit 0. The line count stays 260, and the real baseline is unchanged (sha `f746e373…` before and after).
- Mutation proofs all passed and were reverted:
  - Re-adding the `ability_type` line turns the content pin red.
  - Swapping `actionTypeOf`'s precedence turns the new inline precedence pin red.
  - The featureSpend guard throws in jest (3 suites) and in the esbuild bundle (a runtime pageerror).
- The three MEDIUM findings: two new comments make false factual claims (renderFeature.ts:126-128, entry.ts:267-273), and the user-facing `docs/Media/feature.png` still shows the "VILLAIN ACTION 1" chip. None of the fixes moves frozen bytes.

## What was verified (probes 1-7)

1. **The data fix.** `git diff 6c4f6aa..HEAD -- src/elements/feature/example.yaml` differs from base by exactly one removed line, `-ability_type: Villain Action 1`. Re-inserting that line reproduced the base blob hash, `ce702c4`.
   - A Playwright probe of the built harness shows `feature/default` as `data-dse-act="main"`, crest `sword`, no `.dse-head__primary--right` chip, and no "villain action" text anywhere in the card. `feature/spend` shows the same, plus `.dse-section--spend`, with "Special (Spend Heroic Resource)". Log: `sc236-r3-logs/probe-head.log`.
2. **The featureSpend derivation.**
   - The derived text byte-equals base's literal with the `ability_type` line removed (Python diff, True).
   - The base literal was also byte-equal to base example.yaml with the Spend substitution applied, so it was never actually out of sync (see LOW-1).
   - The replace target occurs exactly once in example.yaml.
   - **Guard proof:** I changed example.yaml's `    cost: 2 Malice` to `3 Malice`.
     - Jest: 3 suites fail at load (`fixtures.test.ts`, `chromeRollout.test.ts`, `feature-roll.test.ts`) with the guard's message, exit 1 (`mut-C-jest-full.log`).
     - Rebuilt harness bundle: every page throws `Uncaught Error: featureSpend: expected featureDefault …` and `__dseHarnessDone` is never set (`mut-C-probe.log`). The error string is present in `dist/harness.js`.
     - Then reverted.
   - No other harness fixture hand-copies example.yaml:
     - `featureEffectList` (entry.ts:780) and `FULL`/`HEADER` (feature.test.ts:43,70) are deliberately different shapes.
     - chromeRerender's `FEATURE_BODY` is only the name.
3. **The test pins.**
   - Content pin: I re-inserted `ability_type: Villain Action 1`. Result: 1 failed at feature.test.ts:548 `not.toMatch(/^ability_type:/m)` (`mut-B-readd-ability_type-jest.log`), then reverted.
   - Precedence pin: I swapped `actionTypeOf` to `(ability_type || realUsage)` and ran the full jest suite. Result: 5 failed, including `[data-dse-act]: SC-102/SC-236 — precedence unchanged …` at feature.test.ts:562 (`mut-A-precedence-swap-jest.log`), then reverted.
   - Neither pin is vacuous.
4. **Freeze.** Covered in the summary. Logs: `freeze-run1.log`, `my-8-hashes.txt` and `freeze-applied-copy.log`. The scratch copy is at `/tmp/claude-1000/…/scratchpad/freezecopy/`, and the real baseline was never written.
5. **Battery.** Covered in the summary. `rm -f main.js styles.css` was run before each jest run.
6. **Comments and docs.** Two new false claims and one stale docs image (MEDIUM-1..3), plus minor stale references (LOW-2). No "its frozen shots never move" or "example.yaml is a villain" claim survives anywhere in the repo.
   - The CHANGELOG bullet is accurate: `scaffold.ts:119` inserts `def.authoring.example`. It is in the right file, DSE `CHANGELOG.md` under the "7.0.0 (unreleased)" heading.
7. **Evidence images.**
   - Labels are plain black "BEFORE"/"AFTER" text on white bands. They do not rely on color.
   - The order is correct: the chip is present in BEFORE and absent in AFTER in all three crops.
   - The chip removal is legible in `feature-dark.png`, `feature-spend-dark.png` and `feature-print.png`. See INFO-4 for a print-crop legibility caveat.

## Findings

### MEDIUM-1 — a new comment makes a false corpus claim: `src/elements/feature/renderFeature.ts:126-128`

- **Text:** "`ability_type` (hand-authored notes — no real corpus ability carries `ability_type` at all, so this rung only ever fires for fixtures/hand-authored blocks …".
- **Why it is false:** data-unified `en/unified/json` carries `ability_type` on 831 occurrences: 461 `Signature Ability`, 260 `Signature`, 106 `Triggered`, 4 `Free-strike`. A walk of unique feature objects finds 646 of them, and every one also has a real `usage` line, so the conclusion ("this rung never decides for corpus content") holds. The premise does not.
- **Failure scenario:** the next maintainer reads this doc comment on the precedence function as licence to treat `ability_type` as fixture-only. For example, they drop the right-primary chip, or they reorder the ladder believing no shipped data reaches it. That would hit the ~650 Signature/Triggered corpus cards that render this field as a chip.
- **Prescribed fix (comment only):** replace the clause with: "no real corpus ability carries a villain-shaped `ability_type` (corpus values are Signature / Signature Ability / Triggered / Free-strike), and every corpus feature that carries one also has a real usage line — so this rung never decides for shipped content, only for fixtures/hand-authored blocks".

### MEDIUM-2 — a new comment makes a false fixture claim and misdirects: `visual-harness/entry.ts:267-273`

- **Text:** "no fixture anywhere else exercises `actionTypeOf`'s `ability_type` ladder rung (real corpus villain actions signal via `cost`, not `ability_type` — see `feature-villain`'s own shape below), so this harness-local literal … stays as the only way to golden-shot that fallback path".
- **Why it is false:** `src/elements/statblock/example.yaml:97,110,125` has three features with `ability_type: Villain Action N` + `usage: "-"`. `test/fixtures/statblock/human-bandit-chief.yaml` and `src/views/SettingsPreview.ts:114` have the same shape. All of them resolve to `villain` through exactly this rung:
  - They are rendered in the `statblock` default shots.
  - `test/dom/elements/statblock.test.ts:514` pins them.
  - entry.ts:79 itself says "the hand-authored `ability_type: Villain Action N` every other villain fixture here carries".
  - The precedence-swap mutation also turned the statblock villain-band tests red.
- **Misdirection:** "see `feature-villain`'s own shape" points at a fixture that uses the ability_type shape, not the cost shape. The cost-shaped fixture is `statblockVillainCorpus` (entry.ts:77-88).
- **Failure scenario:** someone deletes the statblock fixtures' `ability_type` lines, believing the rung's only coverage is featureVillain, or the reverse. The r2 report's justification for keeping featureVillain rests on this false premise.
- **Prescribed fix (comment only):** restore the base's accurate reason. featureVillain is the only **standalone** villain feature card (spine-less crest + eyebrow tint, per D3); the statblock fixtures exercise the same rung only inside a statblock. Point "real corpus villain actions signal via `cost`" at `statblockVillainCorpus` (entry.ts:77), not at featureVillain.

### MEDIUM-3 — the user-facing docs image still shows the false chip: `docs/Media/feature.png`

- **What:** the image is embedded at `docs/Features.md:82` and `docs/index.md:61`, and generated from `docs-manifest.mjs:272` (`element: 'feature'`, default fixture = example.yaml). The committed PNG, last regenerated in `b8373c4` (SC-152), still renders the "VILLAIN ACTION 1" chip under "5 MALICE". I viewed it.
- **Failure scenario:** the plugin's own docs index and Features page show the exact contradiction this ticket removes, while inserting a new `ds-feature` no longer produces it.
- **Prescribed fix:** run `npm run docs-shots -- --only=feature.png`, eyeball the result, and commit it on this branch. The image is not freeze-pinned, so the freeze cost is zero. If the regeneration pulls in unrelated design drift since SC-152, the owner can instead file a Backlog ticket and mention it in the Needs Review ask. It should not be left silent.

### LOW-1 — the comment records a drift that never happened: `visual-harness/entry.ts:238-240`

- **Text:** "a hand-copy silently drifted out of sync with example.yaml once (this fixture kept `ability_type: Villain Action 1` after SC-236 round 2 deleted that line …)".
- **Why it is wrong:** at base `6c4f6aa` the literal was byte-equal to example.yaml with the Spend substitution applied (verified). The "drift" existed only inside r2's own uncommitted working state.
- **Fix:** reword to "a hand-copy would have silently kept the `ability_type: Villain Action 1` line SC-236 deleted from the real file".

### LOW-2 — featureSpend is still called a "harness-local literal/variant": `visual-harness/entry.ts:294`, `:779`

- **What:** both comments cite "same convention as featureSpend/featureVillain" for hand-written harness-local literals. featureSpend is now derived, not a literal.
- **Fix:** cite featureVillain only, or `featureblockAdvancement`, as the literal convention.

### INFO

1. **Guard blast radius.** The guard throws at module load:
   - In jest, 3 suites fail with the guard's message, which is loud and clear.
   - In the harness bundle, every page errors, so `npm run shots` would spend its 15 s `waitForFunction` timeout on every capture before failing.
   - Jest (battery step 3) catches it first, so this is acceptable. No action needed.
2. **CRLF sensitivity.** `.gitattributes` has `* text=auto`, so a Windows checkout with autocrlf yields `\r\n` in example.yaml. The guard's literal `'    cost: 2 Malice\n'` would then not match and throw. CI is `ubuntu-latest` and no Windows developer is known, so there is no current impact. An optional hardening is `replace(/^    cost: 2 Malice(?=\r?$)/m, '    cost: Spend Heroic Resource')`.
3. **First-occurrence replace only.** `String.replace` changes only the first match. The target occurs exactly once today. If a second `    cost: 2 Malice` were added (for example a nested effect), only the first would change, silently. This is acceptable given the guard's purpose.
4. **Print crop legibility.** `sc236-r2-evidence/feature-print.png` faithfully crops `feature--steel-print.png`, the in-app print twin. That shot renders dark ink on a #1c1c1c ground ("Coverage Strike" and "5 Malice" are near-invisible), in both BEFORE and AFTER, so this predates SC-236. For Scott's ask, a `--steel-realprint` crop (black on white) would read far better and avoids a "is print broken?" detour.
5. **The precedence case is pinned more than once.** The precedence-swap mutation also reddened 4 other tests: the feature cardHead eyebrow test, the statblock villain band ×2, and the SC-102 corpus-shape test. The new inline test is still the only one naming the exact "real usage + villain ability_type → main" case, as r2 claims.
6. **The main workspace checkout's `draw-steel-elements` is dirty** (`demo-vault/Welcome.md`, `justfile`, 2 untracked files). The files date from 2026-09-24 17:08 (a sync), which predates this review; not caused by this review. It is a shared-checkout hazard for the next `just deploy*`, which hard-aborts on a dirty tree.

## Working-tree hygiene

- DSE clone `/home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements`: `git status --porcelain` was empty before and after. HEAD is `a1c39fabdebd22cddc3c3a9ab0b0d84a284b56c8`, branch `sc236-feature-example`, not moved.
  - All three mutations were reverted with `git checkout --`.
  - My temporary probe `visual-harness/.sc236-r3-probe.mjs` was deleted; a copy is kept at `sc236-r3-logs/probe-script.mjs.txt`.
  - The gitignored `main.js`/`styles.css`/`dist`/`shots` were rebuilt by the gates. `dist` was rebuilt clean by parity after the mutated-harness probe.
- The worktree superproject shows only the pre-existing ` M draw-steel-elements` pointer, as it did at start.
- `freeze-baseline.sha256` is untouched (sha `f746e373…` before and after).
- No processes were killed.

## Logs

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r3-logs/`:

| Group | Files |
|---|---|
| Battery | `tsc.log`, `lint.log`, `jest.log`, `obsidian-lifecycle.log`, `shots-run1.log`, `parity.log` |
| Freeze and rebaseline | `freeze-run1.log`, `my-8-hashes.txt`, `freeze-applied-copy.log`, `real-baseline-sha-before.txt` |
| Mutations | `mut-A-precedence-swap-jest.log`, `mut-B-readd-ability_type-jest.log`, `mut-C-harness-build.log`, `mut-C-probe.log`, `mut-C-jest-full.log` |
| Harness probe | `probe-head.log`, `probe-script.mjs.txt` |
