# SC-651 r1 implementer report

## Executive summary
- Verdict: DONE. Preset dropdown now refuses a `custom` pick: it is set back to `deriveSbPreset(prefs)`, nothing is written. Option stays enabled.
- dse commits (branch `sc651-preset-custom`, base develop `cefa9ca8`, develop had not moved): `884555a0` (fix + 3 jsdom tests), `031f6ca0` (SET-D16 flipped to plain `it`).
- Superproject CHANGELOG commit: `e2014106` (branch `sc651-preset-custom`). No submodule pointer-bump commit made (pointer left unstaged-modified).
- tsc (incl. `-p e2e`) clean, lint clean. jest 13392 passed / 2 skipped / 0 failed (13389 + 3 new, fresh worktree). lifecycle 64/64 (7 parts). e2e `612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`.
- styles.css sha256 identical to a clean `cefa9ca8` build (`18730938...f1f9`); src diff confined to the Preset change handler, so shots/freeze/parity carry (skipped).
- Nothing pushed.

## Diff summary
- `src/views/SettingsTab.ts` (`renderPresetControl`, ~435-458): the `custom` branch now calls `dropdown.setValue(deriveSbPreset(prefs))` then returns (was a bare `return`). Design comment extended: a pick of "custom" snaps back, nothing written, option left enabled because a closed native select skips disabled options on End/ArrowDown.
- `test/dom/views/settings-matrix.test.ts` (in `describe('SC-440 matrix: the statblock presets (inPreset)')`, after the existing "changing the single member ..." test): 3 tests.
  1. `SC-651: picking "Custom" on the Steel card preset snaps the dropdown back to Steel card and writes nothing` (dropdown.value and selectEl.value read `steel`; `prefs.set` spy not called; flushed data.json prefs `{}`; no new saveData call; reopened tab reads `steel`).
  2. `SC-651: when the options already match no preset, picking "Custom" is a no-op that still reads Custom` (one member twiddled, derived `custom`, trigger `custom`: still `custom`, no `prefs.set`, data.json unchanged).
  3. `SC-651 control: a real pick (Index card) still applies its bundle after a refused "Custom" pick`.
- `e2e/specs/settings/dropdowns.e2e.ts`: line 8 import drops now-unused `knownBug`; line ~147 `knownBug('SC-651', '[SET-D16] ...', fn, {failsWith})` -> `it('[SET-D16] ...', fn)`, same title/id; leading comment updated (no ticket id in title). Form follows the sibling `it('[SET-D14] ...')` tests.
- `CHANGELOG.md` (worktree superproject, `## Unreleased`): one bullet "DSE plugin: in the plugin settings, picking Custom in the statblock Preset dropdown no longer leaves it reading Custom when nothing changed (SC-651)." in the neighbouring bullets' form.

## Red proof (test 1 vs unfixed handler)
Fix reverted locally (bare `return`), `npx jest test/dom/views/settings-matrix.test.ts -t SC-651`:
```
● SC-440 matrix: the statblock presets (inPreset) › SC-651: picking "Custom" on the Steel card preset snaps the dropdown back to Steel card and writes nothing
    Expected: "steel"
    Received: "custom"
Tests: 1 failed, 176 skipped, 2 passed, 179 total
```
Tests 2 and 3 pass on unfixed code by design (the derived-custom no-op and the control are unchanged behavior; the existing sibling test did not assert the post-pick value). Fix restored (verified `git diff`), then 3/3 green: log `sc651-jest-matrix-fixed.log`.

## Gates
- `npm run tsc` (tsc + `tsc -p e2e`): RC 0, clean. `npm run lint`: RC 0, clean (only the pre-existing `.eslintignore` warning).
- jest full (fresh worktree, no shots cache): `Test Suites: 1 skipped, 293 passed; Tests: 2 skipped, 13392 passed, 13394 total`, RC 0. (Stack traces from `findDriftedTokens` in the log are child-process negative tests, not failures.)
- Lifecycle, `--only=` in seven parts, all RC 0, no re-runs: part1 21/21, part2 16/16, part3 9/9, part4 4/4, part5 7/7, part6 4/4, part7 3/3 = 64/64 ok, 0 failed. (G-S91, G-S97, G-S115 all ok first time; worktree git status clean after.)
- e2e: `--only=SET-D16` alone: `1/1 ok` (green). Full: `OBSIDIAN-E2E done: 612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`, RC 0. Matches expectation exactly (ok +1, known-bug -1).
- styles.css sha256: base `cefa9ca8` export build and worktree build both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`. Shots/freeze/parity skipped per brief (carry).
- No re-runs needed anywhere; no flakes hit.

## Drive-by fixes
- Removed the now-unused `knownBug` import in `e2e/specs/settings/dropdowns.e2e.ts` (required for lint to stay clean after the flip; part of the flip).

## Follow-ups
- None new. (SC-664, website settings panel, already filed by owner.)

## Artifacts (logs, all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r1-impl/`)
`sc651-npmci.log`, `sc651-jest-matrix-red.log`, `sc651-jest-matrix-fixed.log`, `sc651-tsc.log`, `sc651-lint.log`, `sc651-jest-full.log`, `sc651-e2e-d16.log`, `sc651-e2e-full.log`, `sc651-base-build.log` (+ `sc651-base-export/styles.css`), `sc651-lc-part{1..7}-r1.log`.
