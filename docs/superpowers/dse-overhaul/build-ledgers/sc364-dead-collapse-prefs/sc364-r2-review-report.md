# SC-364 round 2 — independent review report

**Executive summary**
- Verdict: **FIX-ROUND (LOW-only, comment-only)**. The deletion is behaviourally pure: nothing in src read the side channel or the helper at base, and the probe shows rendering is unchanged. One small comment fix is wanted before landing (L1). After it, tsc and lint are enough; no full re-battery is needed.
- Findings: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 2 / INFO 2.
- Reviewed dse `sc364-dead-collapse-prefs` @ `a22300d` against base `71ac43a` (6 files, +26/-110).
- Gates I measured myself: tsc (incl. `-p e2e`) clean, RC 0. lint clean, RC 0. jest 5257 passed / 1 skipped, 229 of 230 suites, RC 0. lifecycle 27/27 ok, 0 failed (port 9371). e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 pairs. shots 572 files, 0 FAIL; pressed-toggle parity 96, host-copy pin OK, button host-leak 112/672. freeze OK 276/276, no rebaseline. parity 0 gaps / 0 undeclared / 24 declared.
- Test inventory: base and head have the same 254 tests across the 10 collapse-related suites. The only change is the one renamed `describe` title. No tests were deleted, and no assertion changed.
- Behaviour probe (in scratch, not committed): a 180-case collapse-key matrix produced **byte-identical** output at base and head. It covers skills and stamina × `collapsible`/`collapse_default`/`collapsed` declared true/false/absent × both global prefs × prefs store described or not, and records the render plus the serialize bytes and model fields.
- Worktree `git status --porcelain` was empty before and after. I made no commits.

## 1. Premise: was the code really dead?

At **HEAD** (`git grep` on the tree, plus a filesystem grep that also covers ignored and untracked files, excluding node_modules and .git):
- `resolveCollapsePrefs|declaredCollapsePrefs|DeclaredCollapsePrefs` has one remaining hit: `test/dom/elements/skills.test.ts:77`. It is an accurate historical note ("SC-255 removed SkillsView's own resolveCollapsePrefs call"). Fine to keep.
- The built `main.js` (rebuilt by my e2e and parity runs) has 0 hits.

At **base 71ac43a**:
- The only src reader of `declaredCollapsePrefs` was `src/prefs/catalog.ts:779`, inside `resolveCollapsePrefs` itself. The only src import of the module's non-class exports was `catalog.ts:23`.
- `resolveCollapsePrefs` had no caller in src, test, e2e, scripts, visual-harness or main.ts.
- No importer of `prefs/catalog` named it. The importers are main.ts, prefOverrides.ts, SettingsTab.ts, ~30 tests and visual-harness/entry.ts, all with named imports of other symbols.
- No `import * as`, `export *`, `export {…} from`, `require(` or `import(` of `catalog` or `ComponentWrapper` exists anywhere, and there is no bracket-string access to either name. So there was no indirect path.
- The `WeakMap` instance `declaredCollapsePrefsByInstance` was private to the module (not exported) and was read only by the deleted accessor.
- `ds-skills` and `ds-stamina` both set `collapseKeysOwnedByModel: true` and declare `chrome`. The runtime decision comes only from `pipeline.ts:440` `extractCollapseKeys(rawData, claimLegacyKeys)` → `pipeline.ts:695` `resolveCollapseState(collapseKeys, readCollapsePref(...))`. No src code reads the model's `collapsible`/`collapse_default` fields at runtime: grep for `.collapse_default` and `.collapsible` finds only the constructor and the parse sites. Those fields exist only for serialize byte-compat, which this change keeps.

**Conclusion:** the claim of pure dead-code deletion is **proven**.

## 2. Collapse-pref behaviour unchanged

- Existing coverage is in `test/dom/framework/pref-overrides.test.ts:366-445`. It covers skills `collapsible` declared vs undeclared under `collapsibleDefault=false`, stamina `collapse_default` undeclared under `collapseDefault=true`, and declared-false beating the pref (render and bytes). `chrome.test.ts`, `chromeRound2.test.ts` and `chromeRerender.test.ts` cover the ladder and `collapsed:`. All are green at head.
- The existing tests are thin in places: they do not test skills `collapse_default`, stamina `collapsible`, the `collapsed:` vs `collapse_default:` precedence on these two model-owned elements, or the case where the prefs store is not described. My scratch probe fills those gaps:
  - Probe file: `sc364probe.test.ts`, copied into an extracted base tree and an extracted head tree inside the scratch dir.
  - It runs 180 cases through the real `ElementPipeline`. For each case it records whether the collapse control is present, the `data-dse-collapsed` value, any render error, the `def.serialize` bytes, and the model's collapse fields.
  - Result: `cmp` reports the base and head outputs IDENTICAL. All 180 cases rendered without error, and the outcomes vary across the matrix as expected (the probe is not vacuous).

## 3. Deleted or rewritten tests, item by item

| File | Change | Test lost? | Live assertion lost? |
|---|---|---|---|
| test/dom/framework/pref-overrides.test.ts:5-11 | header comment rewritten | no | no |
| pref-overrides.test.ts:366 | `describe` title renamed | no; same 4 tests, same bodies | no |
| pref-overrides.test.ts:426 | inline comment | no | no |
| test/dom/framework/kit-lifecycle.test.ts:58-61 | makeDeps comment | no | no |
| test/dom/elements/stamina-bar.test.ts:67-70 | makeDeps comment | no | no |

I confirmed this with `jest --json` inventories on the 10 suites. Base and head both have 254 tests, all passing, and the only diff is the describe-title rename (`sc364-r2-inv-{base,head}.names`). No test ever called the helper or the accessor directly.

## 4. Docs

- `.repo-docs/architecture.md:398-400` is accurate: it says the chrome reads the raw keys through `chrome/collapsedKey.ts` `extractCollapseKeys`.
- No other `.repo-docs`, AGENTS.md or README text mentions the channel. `docs/superpowers/*` hits are dated plans and specs (historical), so they are left alone correctly.
- The new `ComponentWrapper.ts` docblock (lines 11-18) is accurate. stamina-bar `serialize` is `stringifyYaml(model).trim()` (`src/elements/stamina-bar/model.ts:29-30`), and the path `framework/chrome/collapsedKey.ts` resolves.
- Two stale pointers remain, and the diff missed them: see L1.

## Findings

### LOW

**L1. Two comments still name the deleted WeakMap as a "precedent".**
- Where: `src/framework/seams/theme.ts:145` ("WeakMap precedent: src/model/ComponentWrapper.ts:47") and `src/framework/seams/prefs.ts:300-301` ("WeakMap precedent: src/model/ComponentWrapper.ts:47, and theme.ts's themeServiceByApp").
- Failure scenario: a reader who follows the pointer finds `ComponentWrapper.ts:47`, which is now inside the constructor and has no WeakMap. The ticket's purpose was to remove stale references to this channel, and these two were left behind.
- Fix: change theme.ts:145 to cite a live precedent, for example `src/framework/view.ts`'s `AFTER_RENDER` WeakMap or `framework/kit/escapeConsumer.ts`'s `consumers`. In prefs.ts:300-301, drop the ComponentWrapper clause and keep "theme.ts's themeServiceByApp". This is comment-only; re-run tsc and lint.

**L2. The rewritten makeDeps comments overstate why the descriptors must be registered.**
- Where: `test/dom/framework/kit-lifecycle.test.ts:58-61` and `test/dom/elements/stamina-bar.test.ts:67-70`.
- Problem: the new text says the chrome "reads the collapsibleDefault/collapseDefault descriptors via prefs.get() … (collapsedKey.ts extractCollapseKeys) — they must be registered". In fact:
  - The read is `pipeline.ts:95-101` `readCollapsePref`, which explicitly returns the built-in fallback when a descriptor is not registered. It never throws.
  - `extractCollapseKeys` does not touch prefs at all.
- My probe confirms this. With `prefs.describe(DSE_PREF_DESCRIPTORS)` omitted, both elements render without error and with the same collapse state as the described default case. Only unrelated theme attributes differ (the HTML length differs).
- The wording mirrors `test/dom/elements/skills.test.ts:75-78`, an earlier comment from SC-255, so this is an inherited inaccuracy that the new text now repeats.
- Failure scenario: a future maintainer believes removing the describe would break collapse, or goes looking for a prefs read in `extractCollapseKeys`.
- Fix (optional, comment-only): change the text to "registered so prefs.set()/get() on the full catalog works (the chrome's collapse read, pipeline.ts readCollapsePref, falls back to the built-in default when unregistered); same convention as statblock.test.ts's makeDeps()". The same fix may optionally go into skills.test.ts:75-78.

### INFO

**I1.** The test titles `pref-overrides.test.ts:409-411,434` ("Amendment pins (task-5-report-d4.md "Continuation")", "AMENDMENT: …") still name the D4 amendment that created the side channel. The behaviour they pin is still live, so the titles are acceptable as provenance. Renaming them is optional, and renaming changes test names (inventory churn).

**I2.** The `collapsedKey.ts` header (lines 39-41, "zero blast radius … `ds-skills` included") and the `pipeline.ts:434-436` comment ("`ds-skills` keeps parsing … exactly as before"; "A definition without the slot…") date from before SC-255. `ds-skills` now declares `chrome` and sets `collapseKeysOwnedByModel: true` (`src/elements/skills/definition.ts:36,46`). This is outside SC-364's diff. The owner may file a backlog ticket for stale comments in the collapse-key headers.

## Evidence (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r2-review-q8k2/`)
- Gate logs: `sc364-r2-tsc.log`, `sc364-r2-lint.log`, `sc364-r2-jest.log`, `sc364-r2-lifecycle.log`, `sc364-r2-e2e.log`, `sc364-r2-shots.log`, `sc364-r2-freeze.log`, `sc364-r2-parity.log`. Each ends in `RC=` captured by the wrapper script `sc364-r2-gate.sh`.
- Inventory: `sc364-r2-inv-base.json`, `sc364-r2-inv-head.json`, `sc364-r2-inv-base.names`, `sc364-r2-inv-head.names`.
- Probe: `sc364probe.test.ts`, `sc364-r2-probe-base.out`, `sc364-r2-probe-head.out` (identical), `sc364-r2-probe-{base,head}.log`.
- Extracted trees used for the comparison: `base/` (git archive 71ac43a) and `head/` (git archive a22300d), with node_modules symlinked.
- Run order: tsc, lint, jest (after `rm -f main.js styles.css`, which are ignored build outputs rebuilt by later gates), lifecycle, inventories and probe, e2e, shots, freeze, parity last. Load was low (1-min load 1.3-7).
