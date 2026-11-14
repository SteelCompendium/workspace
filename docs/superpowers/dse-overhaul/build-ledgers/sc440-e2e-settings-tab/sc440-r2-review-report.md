# SC-440 r2 review: e2e and jsdom coverage of the DSE plugin settings tab

## Executive summary
- **Verdict: NOT LAND-READY.** One short fix round is needed (tests and manifest only), plus a rebase: origin/develop moved to `11fbded6` (SC-626 landed, 4 commits, no file overlap with this branch). The product diff only adds attributes and census plumbing. In real Obsidian the page rows are the same on the base build, the head build, a build whose stamp throws, and a build with no `getElementForDefinition`.
- **Findings:** 0 CRITICAL / 0 HIGH / 2 MEDIUM / 9 LOW / 6 INFO. **New product bugs: 1 (Low):** a hand pick of "Custom" in the Preset dropdown keeps showing "Custom" though nothing changed.
- **M-1:** nothing checks that a reset redraws the tab. I removed the redraw after a reset (`SettingsTab.ts:427`). All 253 jsdom settings tests stayed green, and so did SET-R01 to SET-R08. Only the gate-on test SET-G05 went red.
- **M-2:** the keyboard reaches our handlers in ways the manifest does not list. Enter on the focused Check button starts a check, and Enter on a focused reset row resets the section (both shown in real Obsidian). The manifest lists only `click` for Sync, Check, the 9 reset rows and the 14 page links.
- **Gates at `4c430c1b`:** tsc rc 0 · lint rc 0 · jest `12325 passed / 1 skipped` (shots cache present), rc 0, load 1.2 to 7.2 · e2e run A and run B both `487/506 ok, 0 failed, 19 known-bug, coverage: 351/351 pairs`, rc 0, 270 s and 265 s (load 5.9 to 10.4), no flake · lifecycle 21 + 16 + 9 + 4 + 7 + 4 + 3 = **64/64** (see the gate list for each part). I did not re-run shots, freeze or parity: the implementer's numbers equal the baseline, and adding attributes cannot change print bytes. The pair count is 351 = 233 + 118, which I counted from the manifest.
- **Mutation probes:** I broke 13 handlers: toggle, select, slider, text field, font picker, Sync busy, gated toggle, a reset row, Preset, the reset redraw, a census button, and allowedErrors twice. All except the reset redraw (M-1) turned the relevant plain e2e test red. One jsdom case passes vacuously (L-2).
- **Markers:** all 6 fail today for the stated reason. I simulated one neutral fix per bug: all 6 markers flip to "appears fixed" and the 61 plain settings tests stay green. No test clicks the trash button. The gate-off spec files never see the gate on, because each spec file gets a fresh Obsidian session.
- **Network:** every Sync and Check drive installs the stub. The harness itself has no guard: with the stub removed, SET-C01 reached GitHub (a real `v4.20261018225007` "Update available" Notice) before it failed (L-1).

## Findings

### MEDIUM

**M-1. Nothing checks that a reset redraws the tab's own controls. jsdom does not check it at all, and the shipped e2e specs do not either.**
- Where: `e2e/specs/settings/resets.e2e.ts:30-42` (the `reset()` helper: after the click it checks data.json and the open note only). `test/dom/views/settings-matrix.test.ts:319-354` (store and data.json only). The code under test is `src/views/SettingsTab.ts:427`, `this.update()` in `resetDescriptors`. Its comment says this redraw "is what makes the reset visible in controls obsidian owns (a native control does not observe the store itself)".
- Failure scenario: if a regression drops or breaks that redraw, a user clicks "Reset appearance" and the Reduce motion toggle still shows ON while the value is false. The next click on it would then write the wrong value. All 8 shipped reset tests pass, and so does every jsdom test.
- Probe: mutant `if (Date.now() > 0) return;` placed just before `this.update()`. Results: jsdom `settings-matrix` + `settings-integrity` + `settings-tab` gave **253/253 passed** (`jestM10.log`). e2e `--element=settings` gave 60/67 ok, **1 failed, SET-G05 only** (the gate-on Reset authoring test reads the toggle), with R01 to R08 green (`e2eM10.log`). SET-D14 is not affected, because it navigates away and back, which redraws the page from the definitions.
- Fix: in each R test, after the click, assert one shown control per section on the page still on screen. Examples: R01 `toggleIsOn('settings.reduce-motion') === false`; R02 `shownValue('settings.text-scale') === '1'` and `shownValue('settings.font-title') === ''`; R03 `shownValue('settings.sb-density') === 'comfortable'` and `shownValue('settings.sb-preset') === 'steel'`; R04 to R07 likewise. For R08, open one page after Reset all and read a toggle. In jsdom, add a check to the reset `test.each`: after `reset.action`, every native control the mock drew for the section reads `getControlValue` = the default.

**M-2. Keyboard activation that reaches our handlers is real but not in the manifest: Enter on Sync and Check, and Enter on the reset rows (the page links too, but those reach only Obsidian).**
- Where: `e2e/manifest/settings-tab.ts:129-130` (`settings.compendium.sync` / `.check`: `click`, `click-disabled`), `:55-63` (9 reset rows: `click`), `:39-52` (page and Advanced links: `click`).
- Failure scenario: Sync and Check are real `<button>`s that Tab reaches and Enter or Space activates, and that goes into our `onClick`. The reset rows are focusable (`tabindex="-1"`), and Enter runs the `action`, which is our `onReset`. A regression in the keyboard path, such as a handler moved to a pointer-only event, would not show in coverage. The other manifests declare `press:Enter` on their buttons (`stamina-edit-modal` `sedit.apply` and others; SC-437 `init.round.advance`; the SC-438 r2 M-1 precedent). The owner ruled to "keep the keyboard pairs (they reach our onChange)", and these keys reach our handlers too.
- Probe (real Obsidian, `probeKbd.log`, scratch spec REVBUG-06): seeded `reduceMotion: true`, focused `settings.reset.appearance` and pressed Enter, and prefs became `{}`. Focused `settings.page.compendium` and pressed Enter, and the Compendium page opened. Focused `settings.compendium.check` and pressed Enter: the label changed to "Checking…" and the stub received the lookup. Focus stays on the control after these repaints (REVBUG-07), so it is not a focus bug.
- Fix: add `press:Enter` to `settings.compendium.sync`, `settings.compendium.check` and the 9 reset rows, each with one plain driver. For example, C05: Enter on the focused Check, held in flight, then answered. R09: Enter on a focused reset row, with the same assertions as R01. Whether to add Enter to the 14 page links (host navigation only) is the owner's call. The reset Enter driver needs a stubbed lookup only for Check.

### LOW

**L-1. The no-network rule rests on each spec remembering `releaseStub.install()`. The harness has no guard of its own.**
- Where: `e2e/driver/settingsDrive.ts:94-113`; `e2e/driver/session.ts` (no default stub); `src/data/CompendiumSyncService.ts:92` (the default `requestUrlFn` is Obsidian's real `requestUrl`). The stub also disappears on every plugin reload (`dse.setPrefs`, `reloadPlugin`).
- Probe: removed `releaseStub.install()` from SET-C01 (`e2eNet.log`). The in-flight assertions passed. The real GitHub API answered, and two Notices "Update available: v4.20261018225007 (installed: none)." appeared. Only then did the test fail, with `Cannot read properties of undefined (reading 'length')`. So the drive reaches the network first and fails loudly second. The host can reach the network (`curl` returned 200).
- Fix: in the session `before`, and again after every plugin reload in `dse.setPrefs` / `reloadPlugin`, install a default `requestUrlFn` that throws `e2e: network disabled (install releaseStub)`. `releaseStub.install()` then overrides it. A forgotten stub then fails before any request.

**L-2. The jsdom "picking steel" preset case passes with the Preset handler deleted.**
- Where: `test/dom/views/settings-matrix.test.ts:238-261`. The test starts from the defaults, and steel equals the defaults member for member.
- Probe: mutant M9 (the Preset `onChange` returns at once, `jestM2.log`). Sourcebook, index and "replaces wholesale" went red; steel stayed green. (In e2e, D14 picks Sourcebook and goes red.)
- Fix: seed the nine members off their defaults (apply `index` first) before picking steel, and assert that the sparse slice holds only the four unrelated keys.

**L-3. `diskData()` waits for "disk equals memory", so it times out before the session's first write. SET-D13 fails when run alone, and many scenarios depend on the tests before them.**
- Where: `e2e/driver/settings.ts:108-115`; `e2e/specs/settings/dropdowns.e2e.ts:84` (`const before = JSON.stringify(await diskData())`). The shipped data.json is `{}`, while the plugin holds its defaults in memory.
- Probe: `--only=SET-D13` failed with "data.json on disk never caught up with the plugin's settings" (`probeBugs2.log`). The full run passes only because earlier dropdown tests wrote first. Other scenarios also need their predecessors: T04 (T03 left the parent off), T09 (T08), T11, D15, F02 to F07, Z06, X04, G04 and G05. The README says "Do per-test setup inside the test", and `--only` is advertised for single ids.
- Fix: for "nothing written" checks, compare the raw file bytes before and after (adapter read, no equality wait), or let `diskData` accept "no write yet" when the file equals the shipped seed. Either seed each dependent test with `dse.setPrefs({...})`, or say in each file header that its ids are sequential and cannot be run one at a time with `--only`.

**L-4. The C04 allowance accepts every sync failure's console.error, not only the 404.**
- Where: `e2e/specs/settings/compendium.e2e.ts:87`, `/compendium sync failed|rejection: Error: GitHub release lookup failed/`. The product logs `"Draw Steel Elements: compendium sync failed:", error` for any cause (`CompendiumSyncService.ts:320`).
- Scenario: once SC-646 is fixed, a different failure inside sync (for example a TypeError) logged on the same line would pass the invariants unnoticed in this test.
- Probe: a different page error (`console.error('unrelated boom')`) inside C04 did fail it, so the allowance is narrow by pattern. A new test that emitted the allowed text without calling `allowPageErrors` also failed, so the allowance resets per test (`e2eM2.log`). Only the pattern is too wide.
- Fix: `/compendium sync failed: Error: GitHub release lookup failed \(HTTP 404\)|rejection: Error: GitHub release lookup failed \(HTTP 404\)/`.

**L-5. In SET-L03, the precondition and the bug assertion produce the same failure message, so a broken precondition would read as the known bug.**
- Where: `e2e/specs/settings/live-behavioural.e2e.ts:54` (`.ds-scc-unresolved` count `toBe(1)`, the precondition) and `:58` (`a.ds-scc-web` `toBe(1)`, the bug), with `failsWith: /Expected: 1/` at `:62`.
- Fix: give the bug assertion its own shape, for example `expect({ webLinks: n }).toEqual({ webLinks: 1 })`, and set `failsWith: /webLinks/`.

**L-6. SET-R06 asserts no on-screen effect, and SET-R08's title promises something it does not check.**
- Where: `e2e/specs/settings/resets.e2e.ts:68-70` (R06 `async () => undefined`) and `:74-85` (R08's title says "the Compendium, Links and Initiative fields ... stay", but nothing asserts it, and `dse.setPrefs` writes no operational fields, so the seed has none).
- Fix: R06, open a stamina bar after the reset and assert a Collapse button is present and the bar is not collapsed (the T05 / T06 pattern). R08, seed `compendiumReleaseTag` and `sccWebFallback: false` through the data.json seed, then assert they survive Reset all on disk.

**L-7. SET-X03 asserts only data.json and the shown path, though the Default creature image path has an on-screen effect.**
- Where: `e2e/specs/settings/fields.e2e.ts:45-67`. The effect is `src/elements/initiative/view.ts:1707`: a creature without an image falls back to `settings.defaultImagePath`.
- Fix: as in T05, open `Initiative/tracker.md` (or a fixture with a creature without an image) after the pick, and assert that the creature's image source resolves to the picked path.

**L-8. A manifest comment is stale in two places.**
- Where: `e2e/manifest/settings-tab.ts:122`. "each keystroke is a write" is wrong: data.json is written on blur (X01, and the ledger's phase B correction). "click or Enter opens Obsidian's file picker" is also wrong: X03 pins that Enter opens nothing.
- Fix: correct both phrases.

**L-9. The three new README fixture rows are not indented, so they break the fixture table.**
- Where: `e2e/README.md:149-151`. The existing rows of that table start with two spaces, because the table sits inside a list item.
- Fix: indent them two spaces.

### INFO

- **I-1. A rebase is needed.** origin/develop = `11fbded6` (SC-626: `48eff2d6`, `16b7389b`, `88699684`, `11fbded6`). The changed files do not overlap with this branch, so the rebase is mechanical. SC-626 adds montage manifest pairs, so after the rebase coverage is more than 351. Re-run e2e and lifecycle on the rebased head. The SC-626 worktree no longer exists, and its ids are MONT-F05 to F13. SC-439 (`1615843e`) uses CENSUS-13 to 15 and no SET ids. `[SET-*]` and `[CENSUS-16..17]` are unique, titles hold literal ids, and no title has a bracketed ticket id (the `[known bug SC-…]` suffix comes from the `knownBug` wrapper).
- **I-2. Breaking the gate restore turns nothing red, and nothing can leak.** I removed `after(() => dse.setPrefs({}))` (`gate-on.e2e.ts:17`), and the whole settings run stayed green apart from my other probes (`e2eM2.log`). Each spec file runs in its own wdio worker, with a fresh Obsidian session and a fresh copy of the vault, and `session.ts:20-22` refuses a session that starts with the gate on. So the `after` only matters inside `gate-on.e2e.ts`, where every test expects the gate on anyway. Nothing to fix.
- **I-3. The id stamping does not change behaviour.** The `src/` diff is attributes, `NavRow.id`, the `visible` predicate and one chained return turned into a block (same value). In real Obsidian, a scratch spec read every row (name, visibility, classes) of the index, 10 pages and 3 Advanced pages: 177 rows, identical on base `a5313f9d`, head, a stamp that throws, and an absent `getElementForDefinition` (`probe-*.json`). No page error appeared in either mutant. The jsdom twin tests exist (`settings-matrix.test.ts:605-632`). Not probed: the global settings search, because the harness could not drive Obsidian's search field.
- **I-4. The `click-disabled` driver change is safe on develop, but SC-439 should know about it.** On develop, only the negotiation modifier labels carry `is-disabled` (`ArgumentView.ts:306`, a truly disabled state). The two full runs keep all 233 earlier pairs. After SC-439 rebases, a click on a greyed `negotiation.mod.*.label` is recorded as `click-disabled`. Its manifest declares those labels as `click` only, and its A13 clicks them only while they are enabled, so nothing changes today.
- **I-5. More evidence for SC-643.** A Destination folder of `/` opens the same "Existing compendium folder found ... Move old compendium to trash" window (REVBUG-03; closed through its X). Three spaces go straight to the lookup with no window (REVBUG-04).
- **I-6. Some jsdom matrix expectations are computed from the code under test.** `d.css.toCss(value)` at `settings-matrix.test.ts:107` and `:581`, and `SB_PRESETS[preset]` at `:249`. A wrong `toCss` or preset table would pass these. The e2e specs pin literal values for the scales, fonts and Sourcebook members, so this is partly covered. Optional fix: a literal table for a few values.

## Product bugs

**PB-1 (Low). The Preset dropdown can be set to "Custom" by hand and keeps showing it, although nothing changed.**
- Repro (real Obsidian 1.14.4, scratch REVBUG-01, `probeBugs2.log`): shipped data.json, Settings > Statblock display; the Preset reads "Steel card". Focus it and press End (the "Custom" option). It now shows `custom`, prefs stay `{}`, and every member still matches Steel card. Go back and reopen the page, and it shows "Steel card" again.
- Cause: `src/views/SettingsTab.ts:444`, `if (value === 'custom') return;` returns without `dropdown.setValue(deriveSbPreset(prefs))`, so the label is left on a state the user cannot choose. The jsdom test `settings-matrix.test.ts:263-278` covers "Custom" only when the derived value is already Custom.
- Known-ticket match: none among SC-217 / SC-218 / SC-405 / SC-161 / SC-359 / SC-458 / SC-626 / SC-615 / SC-614 / SC-643 to SC-647.
- Marker for the owner to decide once it is filed: a jsdom `test.failing` (pick "custom" from Steel card and expect the dropdown to read `steel`), or an e2e `knownBug` matching REVBUG-01.

No other new bug. These checks were clean:
- Space or Enter on the greyed dependent toggle does nothing (REVBUG-02).
- Keyboard focus stays on the Preset select and on a reset row after their repaints (REVBUG-07).
- None of SC-228, SC-243, SC-372/422, SC-140 or SC-187 has regressed. The rows are identical to the base build, and C01 / C02 pin the SC-243 busy state.

## Probe ledger (scratch worktrees, removed at the end)
| Probe | Change | Result |
|---|---|---|
| batch 1 (`mut-batch1.diff`) | `setControlValue` skips reduceMotion, sbDensity, cardScale, printPreview and compendiumReleaseTag; fontBody dropdown does not save; Sync never disabled | e2e red: T01, T11, D02, F02 (F03 to F07 cascade), Z02, Z06, X02, X04, G02, G04, G05, C01, C02; markers unchanged. jsdom 47 red (`jestM1.log`, `e2eM1.log`) |
| batch 2 (`mut-batch2.diff`) | Featureblock reset no-op; Preset no-op; un-id'd "Rogue" button in the Sync row; unrelated console.error in C04; allowed pattern in a new test without the allowance; gate restore removed | R04, D14, D15 red; CENSUS-16 red ("no data-dse-control: <button> "Rogue" listens for click"), jsdom census 2 red; C04 red (invariant), new test red; nothing red for the gate restore. N01 also failed once ("previous settings page to show"), not reproduced in runs A and B (`e2eM2.log`, `e2eM2c.log`, `jestM2.log`) |
| M10 | no redraw after a reset | only G05 red; jsdom 253/253 green (M-1) |
| fix simulations (`fixsim.diff`) | SC-643 empty destination falls back to the default; SC-646 `.catch` on Sync; SC-644 chrome subscribes to collapsibleDefault / authoringControls; SC-645 stamina view rebuilds on the popover pref; SC-647 an unresolved span keeps its href and turning the fallback on rewrites it | C03, C04, G06, L01, L02, L03 each "appears fixed - remove the marker"; 61 plain green (`e2eFix.log`) |
| no stub | C01 without `releaseStub.install()` | real GitHub answer, then a red (L-1, `e2eNet.log`) |
| rows | base / head / stamp throws / method absent | 177 rows identical (I-3) |
| bugs | REVBUG-01 to 07 | PB-1; I-5; M-2 evidence; clean dependent-toggle keys and focus |

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-rev-r2/`)
- tsc `tsc.log` rc 0 (no output).
- lint `lint.log` rc 0 (only the known `.eslintignore` warning).
- jest `jest.log` rc 0: `Tests: 1 skipped, 12325 passed, 12326 total`; Suites 282 passed / 1 skipped; 86 s; load 1.23 to 7.23 (`jest.time`).
- e2e run A `e2eA.log` rc 0: `OBSIDIAN-E2E done: 487/506 ok, 0 failed, 19 known-bug, coverage: 351/351 pairs`, 270 s, load 5.9 to 10.4.
- e2e run B `e2eB.log` rc 0: the same line, 265 s, load 1.3 to 5.9. After both runs, `git status --porcelain` in dse was empty and `e2e/vaults/plugin-data.shipped.json` was not written.
- lifecycle part 1 `life1.log` rc 0: `21/21 ok`; part 2 `life2.log` rc 0: `16/16 ok`; part 3 `life3.log` rc 0: `9/9 ok`; part 4 `life4.log` rc 0: `4/4 ok`; part 5 `life5.log` rc 0: `7/7 ok` (G-S91 passed on the first run); part 6 `life6.log` rc 0: `4/4 ok` (`appearance.json` clean); part 7 `life7.log` rc 0: `3/3 ok`, 195 s (G-S115 passed on the first run). Total **64/64**.
- shots / freeze / parity: not re-run (the implementer's 592, 163/978, 40/240, 147, 280/280 and 0/0/24 equal the baseline; the diff only adds attributes).
- Working tree: the reviewed worktree (dse and superproject) has the same `git status --porcelain` before and after (`M draw-steel-elements` pointer in the superproject only). The scratch worktrees `.../sc440-rev-r2/mut` and `.../sc440-rev-r2/probe` were removed with `git worktree remove`.

## r4

### Executive summary
- **Verdict: NOT LAND-READY.** The r3 delta fixes every r2 finding the owner ruled "fold", and each fix bites. But **SET-X03 is a flake in the required e2e gate**: it failed in 3 of 7 runs here, each time with "stale element reference" on the picker item click, under load and parallel e2e runs. Run alone or on a quieter host it passed 4 of 4.
- **Findings:** 0 CRITICAL / 0 HIGH / 1 MEDIUM / 1 LOW / 3 INFO. **New product bugs: 0.** The cited open tickets were not refiled.
- **R4-M1:** `e2e/specs/settings/fields.e2e.ts:53-54`. The test marks the picker item page-side, then `$('[data-picked="1"]').click()`. The picker redraws in between, so the element goes stale.
- **R4-L1:** the reload tests no longer reload the file the drives wrote. They seed it themselves, and four of the seeds are versionless, so they load through the v0 migration path rather than the one a real reload takes.
- **Gates at dse `e4e2be2f`:**
  - full e2e run A: `551/581 ok, 1 failed (SET-X03), 29 known-bug, coverage: 414/416`, rc 1, 385 s, load 12-13, with my mutant runs going alongside;
  - full e2e run B, nothing else of mine running: `552/581 ok, 0 failed, 29 known-bug, coverage: 416/416 pairs`, rc 0, 370 s, load 9-12;
  - pairs re-counted: 287 + 129 settings (118 + 11 new `press:Enter`) = 416.
- **Superproject:** `b1c3c8af` has one parent, `c3f9b129`, and one gitlink line (8a81c5a7 to e4e2be2f); `git status` is clean. **The baseline has moved again:** workspace origin/main is now `18f8043f` and dse develop is `76520b1f` (SC-625). No file overlaps with this branch and no ids collide, so the rebase is mechanical, but the numbers will change.
- **Mutants:**
  - Reset redraw removed: 9 jsdom tests red; e2e R01-R07, R09-R15, G05 and G07 red. R08 and R16 stay green, because a page opened after Reset all always redraws.
  - Network stub removed: SET-C01 fails, and the Notice says "Update check failed — e2e: network disabled, install releaseStub…". GitHub was never asked.
  - Preset handler deleted: 4 jsdom tests red, including steel; SET-D14 red.
  - Neutral SC-651 fix: SET-D16 flips to "appears fixed"; the other 71 plain settings tests stay green (SET-X03 apart: the R4-M1 flake).
- **Running alone:** 10 SET tests, one per spec file, passed alone (`--only=SET-D13,T04,F05,Z06,X04,G05,R06,C06,N02,L03`): 9 ok and 1 known-bug, 0 failed.

### Checks
1. **Rebase content.** `git range-diff a5313f9d..4c430c1b 8a81c5a7..1c659fcc` (`r4-range-diff.txt`) shows 3 commits with changed context and 2 that are identical (`=`). The only content change is L-9: the README rows are now indented. The `_census.e2e.ts`, `e2eCensus.test.ts` and `e2e/README.md` resolutions only add lines: `git diff 8a81c5a7..e4e2be2f` removes no line from `_census.e2e.ts` or the README. The only lines removed in `e2eCensus.test.ts` are the two import lines it extends, the same as in r2. The NEGO (SC-439) and MONT blocks are intact.
2. **The r2 folds.**
   - M-1 bites (see the redraw mutant above).
   - M-2: there are 11 `press:Enter` pairs: Sync C06, Check C05, R09-R16 and G07, each driven by a plain test.
   - L-1: the guard is installed in `openSettings()` (`e2e/driver/settings.ts:40-42`) and fails loudly.
   - L-2 bites.
   - L-3: `diskData()` copes with an unwritten file; SET-D13 passes alone.
   - L-4: the regex is narrowed to the 404.
   - L-5: the two checks are now `{ unresolvedSpans }` and `{ webLinks }`, with `failsWith: /webLinks/`.
   - L-6: SET-R06 opens a bar afterwards; R08 and R16 seed the operational fields and assert they are kept.
   - L-7: SET-X03 waits for `img[src*="token.svg"]` on a portrait. It is also the flake (R4-M1).
   - L-8: the manifest comments are correct.
   - L-9: the README rows are indented.
   - I-6: literal `expectCss` and `PRESETS` tables replace the computed expectations.
3. **SET-D16 / SC-651** (`dropdowns.e2e.ts:147`). It asserts only `{ afterPick } == { afterPick: afterReopen }` (`failsWith: /afterPick/`), plus a setup check with a different message. It fails today. Under the neutral fix `if (value === 'custom') { dropdown.setValue(deriveSbPreset(prefs)); return; }` it flips to "appears fixed"; the other plain settings tests stay green except SET-X03 (R4-M1). With the Preset handler deleted it stays a known-bug, as it should.
4. **`dse.ts` scoping** (`e2e/driver/dse.ts:362-366`). The greyed-row rule now applies only when the control's label starts with `settings.`. That is minimal and correct. Every NEGO test was green in both full runs, and the 287 develop pairs are all covered.
5. **Page-slide wait** (`e2e/driver/settings.ts:72-75`). `pageSettled` is a bounded `waitFor` on a DOM condition: the container holds exactly one child page, within 5 s, with its own message. It is not a sleep, so it fails loudly. `back()` still waits for the title to change, now within 8 s.
6. **Known tickets:** none refiled. The only new item, R4-M1, is a test-harness flake, not a product bug.

### Findings

**R4-M1 (MEDIUM). SET-X03's picker pick goes stale under load, so the required full e2e gate fails intermittently.**
- Where: `e2e/specs/settings/fields.e2e.ts:53-54`. The page-side code finds the item whose text is `Settings/token.svg` and sets `data-picked`. Then `await $('[data-picked="1"]').click()` runs as a separate WebDriver round trip.
- Failure: Obsidian's file suggester draws its list again after it opens. If that second draw lands between the find and the click, the click fails with `WebDriverError: stale element reference: stale element not found in the current frame` (`r4-e2eA.log`, `r4-e2e-redraw.log`, `r4-e2e-sc651.log`).
  - Failed 3 of 7 runs: the full run at load 12-13, and two `--element=settings` runs, each started alongside another e2e run.
  - Passed 4 of 4: full run B, `--only=SET-X03` twice, and X01-X04 in file order (`r4-x03-1.log`, `r4-x03-2.log`, `r4-x03-file.log`).
  - Commit `1c659fcc` narrowed this race but did not close it. The new L-7 target (an svg) may make it more likely. The implementer's two runs and mine in r2 passed.
- Fix (any one of these):
  - (a) Pick with the keyboard. Type the file name into the suggester's own input (`.prompt-input`) so the list holds only that file, then press Enter. These are real keys, with no element handle held across a redraw.
  - (b) Before marking, wait until the list is stable: the same item count and the target present on two consecutive animation frames.
  - (c) Wrap the mark and click in a short retry on `stale element` only (at most 3 tries), and record the drive once.
- After the fix, prove it: run the full e2e twice under concurrent load (for example with an `--element=settings` run started alongside).

**R4-L1 (LOW). The reload tests now load a file they seeded, not the one the drives wrote, and four of the seeds take the versionless (v0) migration path.**
- Where:
  - `toggles.e2e.ts:195` (SET-T11, `seedData` with `settingsVersion: 3`);
  - `fields.e2e.ts:81` (SET-X04, `seedData`);
  - `dropdowns.e2e.ts:125` (SET-D15), `fonts.e2e.ts:75` (SET-F07), `sliders.e2e.ts:54` (SET-Z06) and `gate-on.e2e.ts:74` (SET-G04), all `dse.setPrefs`, which writes no `settingsVersion`.
  - `src/model/Settings.ts:86` treats a missing version as 0 and runs every migration.
- Scenario: the owner ruled that reload survival is checked for "every setting that file changed". The chain is still covered by composition: each drive's `diskData()` asserts that disk equals memory, and the reload tests then prove that such a file loads. Two gaps remain:
  - a defect in what the plugin itself writes, such as a missing `settingsVersion` or a key the migration rewrites, is no longer reloaded in a full run;
  - four of the reload tests exercise the v0 migration rather than a real user's v3 reload.
- Fix: seed only when the expected state is not already on disk, for example `if (!sameJson(await diskPrefs(), expected)) await seedData({ settingsVersion: 3, prefs: expected })`. A full run then reloads the file the drives wrote, and `--only` still works. Alternatively, at least seed every reload test through `seedData({ settingsVersion: 3, … })`.

### INFO
- **R4-I1. The baseline moved again.** dse develop is now `76520b1f` (SC-625: `c272d209`, `31b58f94`, `52889820`, `020d92b4`, `76520b1f`), and workspace origin/main is `18f8043f`. No changed file overlaps with this branch, and no `[SET-*]` or `[CENSUS-*]` id collides. The rebase is mechanical, but the e2e and jest numbers will rise, and the superproject must sit on `18f8043f` with one pointer bump.
- **R4-I2. `diskData()`'s "never written" rule** (`e2e/driver/settings.ts:132-143`) answers from disk after 800 ms when the file lacks a key the plugin holds. A write slower than 800 ms before the session's first write would be read as "nothing written". That would make a positive assertion go red (noisy but not hidden); only a negative check like D13's could miss such a late first write. Acceptable as it stands.
- **R4-I3. The implementer under-reported the redraw mutant.** They reported R01, R03, R07, R09 and R12 red. I measured all 14 section-reset tests plus G05 and G07 red. Only R08 and R16 stay green, and that is inherent to Reset all.

### Gates (r4 logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-rev-r2/`)
- full e2e A `r4-e2eA.log`: rc 1, `551/581 ok, 1 failed, 29 known-bug, coverage: 414/416 pairs`, 385 s.
- full e2e B `r4-e2eB.log`: rc 0, `552/581 ok, 0 failed, 29 known-bug, coverage: 416/416 pairs`, 370 s.
- Running alone, `r4-alone.log`: `9/10 ok, 0 failed, 1 known-bug`.
- Mutant and fix runs:
  - reset redraw removed: jsdom `r4-jest-redraw.log` (9 red), e2e `r4-e2e-redraw.log`;
  - Preset handler deleted: jsdom `r4-jest-preset.log` (4 red), e2e `r4-e2e-preset.log` (D14 red, D16 still known-bug);
  - SC-651 fix: `r4-e2e-sc651.log` (D16 flips);
  - network stub removed: `r4-e2e-nostub.log`.
- Diffs: `r4-mut-redraw.diff`, `r4-mut-preset.diff`, `r4-fixsim-sc651.diff`, `r4-mut-nostub.diff`. Range-diff: `r4-range-diff.txt`. SET-X03 runs: `r4-x03-1.log`, `r4-x03-2.log`, `r4-x03-file.log`.
- Not re-run: tsc, lint, jest, lifecycle, shots, freeze and parity. Only tests and the e2e driver changed in the delta; the product source is the same as at `4c430c1b` apart from rebase context.
- Working tree: the reviewed dse tree and the superproject both have an empty `git status --porcelain`. The scratch worktree `.../sc440-rev-r2/r4-mut` was removed with `git worktree remove`.

## r6

### Executive summary
- **Verdict: LAND-READY**, with two LOW findings for the owner (both optional, tests only). R4-M1 and R4-L1 are fixed, the SC-643 integration matches SC-643's rulings, and the gate is green.
- **Findings:** 0 CRITICAL / 0 HIGH / 0 MEDIUM / 2 LOW / 1 INFO. **New product bugs: 0.**
- **R6-L1:** in a full run, `ensureState` reseeds without saying so whenever the disk does not match (`e2e/driver/settingsDrive.ts:163-172`). So a reload test cannot go red for an earlier drive's bad write. The drive's own test still goes red: I broke the Card size write, and SET-Z02 failed while SET-Z06 passed on a seed.
- **R6-L2:** a stale header comment in `e2e/specs/settings/fields.e2e.ts:3` still says the picker item is picked "with a real click on it".
- **Gate:** full e2e `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`, rc 0, 376 s at load 15-20 (my probes ran alongside). Pairs re-counted: 287 develop + 129 settings = 416.
- **Superproject:** `c84b1e12` has one parent, `c588bbaa`, and one gitlink line (`7b9e82cf` to `2207c45b`); `git status` is clean. Workspace origin/main is still `c588bbaa` and dse develop is still `7b9e82cf`, so the base is current.
- **Under load (15-21):** `--only=SET-X03` passed 3 of 3; `--element=settings` passed 2 of 2 (`74/80 ok, 0 failed, 6 known-bug`). A picker that never opens fails after about 24 s ("timed out waiting for the file picker"); a wrong file typed fails ("timed out waiting for the picker to filter to Settings/token.svg").
- **SC-643:** I reverted SC-643's guard (its 7 product source files back to `76520b1f`). SET-C03 then fails ("the release lookup was never asked") and SET-C07 fails ("timed out waiting for the refusal Notice"). Neither test can click a trash button: the only close path is the window's own X (`compendium.e2e.ts:16-18`).

### Checks
1. **Range-diff and src.** `git range-diff 8a81c5a7..e4e2be2f 7b9e82cf..84fed964` reports all 7 rebased commits identical (`=`, `r6-range-diff.txt`). The r5 commits are `3a3510bc`, `f0abb055` and `2207c45b`, and they touch tests and the e2e driver only. The `src/`+`main.ts` diff against `7b9e82cf` is identical line for line to r2's diff against `a5313f9d`: 3 files, +215 / -23, attribute stamping only.
2. **R4-M1 is fixed, not masked.**
   - The pick is now by keyboard (`fields.e2e.ts:50-65`): type `token`, wait until the list holds exactly one item whose text is `Settings/token.svg`, press Enter, then check that the disk holds `Settings/token.svg`.
   - The re-click retry covers only a picker that did not open. It makes at most 3 clicks, waiting 4 s, 4 s, then 15 s, and the third failure throws.
   - The probes confirm both edges:
     - a page-side capture listener that swallows clicks on `.combobox-button`: red after 24.4 s (`r6-x03-noopen.log`);
     - `recov` typed instead of `token`: red at the exact-one-item wait (`r6-x03-wrong.log`).
   - A second picker opened by a re-click would show two items, so that wait would also fail rather than pass.
3. **R4-L1.** The six reload tests (T11 `toggles.e2e.ts:195`, X04 `fields.e2e.ts:92`, D15 `dropdowns.e2e.ts:125`, F07 `fonts.e2e.ts:75`, Z06 `sliders.e2e.ts:54`, G04 `gate-on.e2e.ts:76`) now reload the file the drives wrote when it holds the expected state. Otherwise they seed a `settingsVersion: 3` file. T04 and T09 use `withPrefs` patches.
   - Probe 1, the reload drops a value: a load-time mutant deletes `cardScale` when it is 1.2. SET-Z06 goes red (`r6-l1-reload.log`), so the reload assertion bites.
   - Probe 2, a drive never writes: SET-Z02 goes red, but SET-Z06 passes because it reseeded (`r6-l1-drive.log`). See R6-L1.
4. **SC-643.**
   - SET-C03 (`compendium.e2e.ts:102-121`): with the Destination folder emptied, the setting stays `''`, the stubbed lookup is asked (the default `DS Compendium` folder is used), no trash offer appears, and Sync goes in flight. That matches SC-643 D1.
   - SET-C07 (`:123-139`): `/` gives the refusal Notice, no lookup, no "Existing compendium folder found" window, and the busy state is released. That matches D2.
   - Neither test clicks a trash button, and no spec or driver file contains a trash click outside the conditions modal.
   - With the guard reverted, both go red (`r6-sc643-revert.log`, `r6-revert-sc643.diff`).
5. **Gates:** see the gate list below. I did not re-run tsc, lint, jest, lifecycle, shots, freeze or parity: the delta changes tests and the e2e driver only, and src is identical.

### Findings

**R6-L1 (LOW). In a full run, `ensureState` reseeds without telling anyone, so a reload test cannot catch a divergence that the drive tests before it miss.**
- Where: `e2e/driver/settingsDrive.ts:163-172`. If the disk does not hold `expected`, it calls `seedData(...)`, in every run mode.
- Scenario: a later drive moves an earlier key (cross-talk). Most drive tests check only their own key, for example `dropdowns.e2e.ts` `pick()`. The file-final reload test used to compare the whole slice and would have gone red. Now it reseeds and passes. Probe: the Card size write broken; SET-Z02 red, SET-Z06 green on a seed. The gate stays red in this case only because of Z02.
- Fix: seed only when the run is an `--only` run (`process.env.DSE_E2E_GREP` is set; `run.mjs` sets it for `--only`). In a file or full run, `expect(disk).toEqual(expected)` instead, so the chain is asserted. Alternatively, have `ensureState` throw "the scenarios above left …" whenever it would seed without a grep.

**R6-L2 (LOW). A stale comment.**
- Where: `e2e/specs/settings/fields.e2e.ts:3`, "an item is picked with a real click on it". X03 now picks by keyboard.
- Fix: one-line comment edit.

### INFO
- **R6-I1.** The X03 re-click retry also records extra `click` drives on `settings.initiative.default-image` when it fires. This is harmless: the pair is declared, and a failing test credits nothing toward the gate.

### Gates (r6 logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-rev-r2/`)
- Full e2e `r6-e2eA.log`: rc 0, `OBSIDIAN-E2E done: 560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`, 376 s.
- `--only=SET-X03`: `r6-x03-1.log`, `r6-x03-2.log`, `r6-x03-3.log`, each `1/1 ok`.
- `--element=settings`: `r6-set-1.log` and `r6-set-2.log`, each `74/80 ok, 0 failed, 6 known-bug`, 84 s at load 12-21.
- Probes:
  - SC-643 guard reverted: `r6-sc643-revert.log` + `r6-revert-sc643.diff`;
  - picker never opens: `r6-x03-noopen.log` + `r6-mut-x03-noopen.diff`;
  - wrong file typed: `r6-x03-wrong.log` + `r6-mut-x03-wrongfile.diff`;
  - reload drops a value: `r6-l1-reload.log` + `r6-mut-reload-loses.diff`;
  - drive never writes: `r6-l1-drive.log` + `r6-mut-drive-write.diff`.
- Range-diff: `r6-range-diff.txt`.
- Working tree: the reviewed dse tree and the superproject both have an empty `git status --porcelain`. The scratch worktree `.../sc440-rev-r2/r6-mut` was removed with `git worktree remove`.

## r8

### Executive summary
- **Verdict: LAND-READY** at dse `941b814f` (r7 delta: 1 commit, 2 files). **Findings: 0.** R6-L1 and R6-L2 are folded exactly as I prescribed them.
- **R6-L1** (`e2e/driver/settingsDrive.ts:164-177`):
  - `ensureState` now reloads on disk when disk equals expected.
  - It seeds only when `DSE_E2E_GREP` is set. Only `e2e/run.mjs:532` sets it, and only when `--only` ids are given, so `--element` and full runs never set it. `wdio.conf.mts:48` reads it as mocha's grep.
  - Otherwise it throws `the scenarios before this reload test left data.json differing from what it expects (<key>: on disk …, expected …)`.
- **R6-L2:** `e2e/specs/settings/fields.e2e.ts:3` now says the file is picked with the keyboard.
- **Runs on `941b814f`:**
  - `--element=settings`: `74/80 ok, 0 failed, 6 known-bug`, rc 0.
  - `--only=SET-Z06`: `1/1 ok`, rc 0 (the seed path).
- **Card size drive-write mutant, `--element=settings`:** `72/80 ok, 2 failed`. SET-Z02 fails ("Expected: 1.05, Received: 1"). SET-Z06 now fails too, with the new message naming `cardScale` as missing on disk. This is the reload test catching what r6 showed it missed.
- **Full e2e** (implementer, `sc440-impl-r1/r5-e2e-r7A.log` and `r5-e2e-r7B.log`, checked): both `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`.
- **Superproject:** `e8cfac1e` has one parent, `c588bbaa`, and one gitlink line (`7b9e82cf` to `941b814f`); `git status` is clean. origin/main is `c588bbaa` and develop is `7b9e82cf`, so the base is current.
- **Logs** (in `sc440-rev-r2/`): `r8-set.log`, `r8-z06-alone.log`, `r8-mut-set.log`, `r8-mut-drive-write.diff`. The scratch worktree `r8-mut` was removed with `git worktree remove`. The reviewed trees are clean.
