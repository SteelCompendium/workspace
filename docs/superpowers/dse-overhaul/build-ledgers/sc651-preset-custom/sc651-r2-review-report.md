# SC-651 r2 independent review report

## Executive summary
- **Verdict: LAND.** dse `884555a0` + `031f6ca0` on `cefa9ca8`, superproject CHANGELOG `e2014106`. The snap-back works in real Obsidian 1.14.4 for keyboard (End, ArrowDown) and mouse (`selectByVisibleText`). Nothing is written, no Notice, no page error, and focus stays on the select.
- Findings: **0 HIGH, 0 MEDIUM, 1 LOW** (CHANGELOG wording), **4 INFO**.
- Gates measured: `npm run tsc` RC 0; `npm run lint` RC 0; `npx jest` 13392 passed / 2 skipped / 0 failed (fresh tree, no shots cache) RC 0; e2e `--element=settings` 75/80 ok, 0 failed, 5 known-bug (SC-644 x2, SC-645, SC-646, SC-647), SET-D16 ok.
- Scratch probes SET-Z91..Z96 in real Obsidian: 7/7 ok, counting SET-D16. Red proof with the fix reverted: jest test 1 FAILS (`Expected "steel" / Received "custom"`). SET-D16 FAILS (`afterPick: "custom"`), and so do Z91, Z92 and Z93.
- Ledger ruling confirmed by measurement: with the Custom option *disabled*, End from Steel card lands on Index card and WRITES its bundle (SET-Z97). Leaving the option enabled is right.
- `DropdownComponent.setValue` does not fire `onChange` (Obsidian 1.14.4 bundle: `setValue=function(e){return this.selectEl.value=e,this.resizeToFit(),this}`), so there is no recursion and no double write.
- Scope is clean: `renderPresetControl`, 3 jsdom tests, the SET-D16 flip and the CHANGELOG. Plugin worktree status is clean after the review, and `styles.css` sha256 is `18730938…f1f9` (identical to r1).

## Findings

### LOW-1: the CHANGELOG says "Custom" only appears in some states, but the option is always listed
`/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/CHANGELOG.md:12`: "\"Custom\" is not a preset you can choose: it only appears when your statblock options match none of …".
The Custom entry is in the dropdown list at all times. That is how the user picks it, and the ledger keeps it enabled on purpose. What "only appears" when nothing matches is the dropdown *reading* Custom. A user who opens the list sees Custom right after reading that it only appears sometimes.
**Fix:** reword it to "\"Custom\" is not a preset you can choose: the dropdown only reads Custom when your statblock options match none of Steel card, Sourcebook or Index card."

### INFO-1: jsdom tests 2 and 3 pass on unfixed code
Only test 1 is red-proven, and the r1 report says so. Test 2 still guards the right thing: it fails if a future "fix" hard-codes `setValue('steel')` or writes on a derived-custom pick. Test 3 is a control. Nothing to change.

### INFO-2: SET-D16 asserts the shown value but not that nothing was written
`e2e/specs/settings/dropdowns.e2e.ts:147-163` compares `afterPick` with `afterReopen` only. The ticket's expectation is met. The no-write, focus and no-Notice properties are pinned in jsdom (test 1), and my probes measured them in real Obsidian. Optionally, add `const before = await rawData()` before End and `expect(await rawData()).toBe(before)` after it. Not required to land.

### INFO-3: the dse-verify CURRENT numbers move at landing
The flip moves the full e2e from `611/622 ok, 11 known-bug` (SKILL.md line 33, "today …") to `612/622 ok, 10 known-bug`, which matches r1's full-run number. The owner's landing step should update `.claude/skills/dse-verify/SKILL.md` line 33 and the CURRENT paragraph, along with any SC-440 known-bug list that names SC-651.

### INFO-4: the shared main checkout's dse submodule is dirty, and I did not cause it
`/home/scott/code/steelCompendium/workspace/draw-steel-elements` shows `M demo-vault/Welcome.md`, `?? compendium-manifest.json` and `?? "demo-vault/montage 1.md"`, all with mtime 2026-11-15 01:08:54. That is before this review started, and I wrote nothing there. A `just deploy*` would hard-abort on it. Another session probably left it.

## Probes and measured results

All real-Obsidian probes ran as temporary `it` blocks appended to `e2e/specs/settings/dropdowns.e2e.ts`. They were restored with `git checkout --` and never committed. Trace: `r2-probe-trace.jsonl`.

| Probe | Scenario | Measured |
|---|---|---|
| SET-Z91 | Steel card, End | shown `steel`, focus `settings.sb-preset`, notices `[]`, data.json raw `{}` → `{}` (unchanged) |
| SET-Z91 walk | then ArrowDown, ArrowDown, End, ArrowUp, Home | `sourcebook` (written), `index` (written), End snaps to `index` with raw unchanged, ArrowUp → `sourcebook`, Home → `steel` (prefs `{}`). Focus stayed on the select through every step, including the `update()` re-render after an apply. **The user is not stuck:** every preset is reachable by arrow keys, and only End/ArrowDown onto Custom snaps back. |
| SET-Z92 | Index card seeded, ArrowDown onto Custom | shown `index`, focus kept, raw unchanged, reopened page reads `index` |
| SET-Z93 | mouse: `selectByVisibleText('Custom')` from Steel card | one `change` event fired; shown `steel`, focus kept, raw unchanged |
| SET-Z94 | derived custom (`sbDensity: compact`) | reads `custom`. End and `selectByVisibleText('Custom')` fire no change (same value) and write nothing. A synthetic `change` carrying `custom` (the handler's no-op branch) still reads `custom` and writes nothing. ArrowUp → `index`, and the bundle is written. |
| SET-Z95 | staleness: change Density on the same page, then change it back, then End | Preset follows `custom` → `steel` through `setControlValue`. End snaps to the *current* derived `steel`, and raw is unchanged. The closure reads the live `PreferenceStore`, so the value is never stale. |
| SET-Z96 | race: ArrowDown (apply Sourcebook) then End at once | immediately `sourcebook`, settled `sourcebook`, reopened `sourcebook`: consistent. Mid-apply, `deriveSbPreset` can read a partial state, but the `.then(() => this.update())` re-render corrects any transient value. |
| SET-Z97 | counterfactual: the Custom `<option>` disabled by script, End from Steel card | shown **`index`**, prefs written to the Index bundle. This confirms the ledger's reason for keeping the option enabled. |
| Red: jest | fix reverted to a bare `return` | `SC-651: picking "Custom" on the Steel card preset …`: `Expected: "steel" Received: "custom"`. 1 failed, 2 passed (tests 2 and 3 pass by design). |
| Red: e2e | same revert, `--only=SET-D16,Z91,Z92,Z93,Z97` | D16 FAIL `afterPick: "custom"` vs `"steel"`; Z91, Z92 and Z93 FAIL `Received: "custom"`; 1/5 ok (Z97, which is fix-independent) |
| `setValue` → `onChange`? | Obsidian 1.14.4 asar, `bT` (DropdownComponent) | `onChange` fires only from the `selectEl` `change` listener. `setValue` assigns `selectEl.value` and calls `resizeToFit`, so no event fires. The jsdom `FakeDropdown.setValue` (`test/mocks/obsidian-core.ts:976`) behaves the same way, so the tests model it correctly. |
| e2e convention | `dropdowns.e2e.ts:147` | plain `it('[SET-D16] …')`, the id is unchanged, the title has no bracketed ticket id, and the `knownBug` import was dropped (otherwise lint would fail). This matches the sibling SET-D14 and SET-D15. |
| Scope | `git diff cefa9ca8..HEAD --stat` | `src/views/SettingsTab.ts` (+9/-1, inside `renderPresetControl` and its comment), `test/dom/views/settings-matrix.test.ts` (+53), `e2e/specs/settings/dropdowns.e2e.ts` (+4/-4); superproject `CHANGELOG.md` +6. No `pipeline.ts`, `main.ts` or `setControlValue` change. No co-author trailers. |

## Cleanliness
- Plugin worktree: `git status --porcelain` was empty before and after, and HEAD is `031f6ca0`. The probe and red edits were reverted with `git checkout -- src/views/SettingsTab.ts e2e/specs/settings/dropdowns.e2e.ts`. The ignored `main.js` and `styles.css` were rebuilt from the clean HEAD (`npm run build-no-check`), and the `styles.css` sha256 is `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- Superproject worktree: ` M draw-steel-elements` (the unstaged pointer that r1 left on purpose) is unchanged.

## Artifacts
Folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r2-review/`
- `r2-tsc.log`, `r2-lint.log`, `r2-jest-full.log`, `r2-e2e-settings.log`
- `r2-probe-block.ts` (probe source), `r2-e2e-probes.log`, `r2-probe-trace.jsonl`
- `r2-jest-red.log`, `r2-e2e-red.log` (red failure bundles in `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/e2e/.out/20261115-070918-ad0c/`)
- `r2-rebuild.log`
