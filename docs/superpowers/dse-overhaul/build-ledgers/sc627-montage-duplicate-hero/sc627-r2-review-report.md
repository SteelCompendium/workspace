# SC-627 r2 review report — independent adversarial review of `da3c8009`

**Executive summary**
- Verdict: **LAND-READY.** 0 HIGH, 0 MEDIUM, 3 LOW (two are test gaps shown by surviving mutants, one is a wrong manifest comment), 5 INFO.
- Spec: all five owner rulings are met in the code. No deviation found.
- Mutation probes: 13 mutants, 11 caught by a test. 2 survive: dropping the trim on the board's side of the match (M2b), and taking a snapshot of the model *reference* when the window opens (M4b). Both are behaviourally safe today, so they are LOW test gaps, not bugs.
- Integrity (jsdom + real Obsidian): a refusal writes nothing (note byte-identical, Enter and a forced click included). A fresh add after a refusal writes one `- name:` line and keeps `table_notes`, `player` and `dc`. Two boards in one note don't affect each other. SC-610 items neither crash nor count. A board hand-written with two Kiras renders byte-identical to `7b9e82cf`.
- Race: in real Obsidian, an outside edit that adds the typed hero closes the window (0 modals open), and no second Osric is written.
- Gates (my runs): tsc/lint clean · jest 12690 passed / 1 skipped (shots cache present) · lifecycle p2 16/16, p3 9/9, p4 4/4, p5 7/7 · e2e `487/506 ok, 0 failed, 19 known-bug, coverage: 287/287 pairs` · shots 592 · freeze 280/280 · parity 0/0/24 (run last) · styles.css sha256 `18730938…f7a7f1f9`, same as the base build.
- The implementer's numbers all match mine. The only difference is jest 12689/2 (fresh) against my 12690/1 (cache present). That is expected.
- Plugin tree is clean before and after (`git status --porcelain` empty). Head `da3c8009`; origin/develop is still `7b9e82cf`.

## Spec conformance (rulings 1–5)

| Ruling | Where | Verdict |
|---|---|---|
| 1 trimmed, case-insensitive | `src/elements/montage/model.ts:589-593` (`montageHeroNamed`) | conforms. Both sides are trimmed and lower-cased; an empty key gives `undefined` |
| 2 Add disabled + warn (`.dse-mt__sheet-warn`, role=alert, `hidden`), text `<board spelling> is already on the board`, no CSS | `src/elements/montage/ConfigModals.ts:29-32, 53-58` | conforms. Real Obsidian: role=alert, `hidden` → `display:none`, colour `rgb(232,149,74)` (`--dse-warn` resolves inside the modal), 12px italic. styles.css is byte-identical |
| 3 onClick re-check + view `onAdd` re-check on LIVE model, no write on duplicate | `ConfigModals.ts:44-47`, `view.ts:482-483, 487` | conforms (both read `this.model` lazily). `addMontageHero` stays a plain append (allowed) |
| 4 hero entries only (SC-610 shapes ignored) | `montageRoster` → `isHero` (`model.ts:51-55, 76-79`) | conforms. `- Ash`, `- 7`, `nmae:`, `name: 7`, `participants: Kira` (a scalar) and `participants: {Kira: 1}` (a mapping) do not crash and do not count |
| 5 out of scope untouched | diff touches only the modal, `onAdd` and one new helper | conforms. The two-Kira board renders byte-identical (`r2-dump-base.html` = `r2-dump-head2.html`, 23794 B) |

## Findings

### LOW-1 — the trim on the board's side of the match is untested (mutant M2b survives)
- `src/elements/montage/model.ts:592` (`h.name.trim().toLowerCase()`); tests in `test/dom/elements/montage.test.ts:2642-2780`.
- Mutant: `h.name.trim().toLowerCase()` → `h.name.toLowerCase()`. All 641 montage-scoped tests stay green (`r2-mut-M2b.log`).
- Failure scenario: a later refactor drops the trim. A hand-written `- name: "  Kira "` then no longer blocks "Kira". Ruling 1 asks for that block explicitly (`name.trim().toLowerCase()`). My probe shows the current code gets it right: the "R2PROBE padded hero name" test passes.
- Fix: one jsdom case. Board `participants:\n  - name: "  Kira "`, type `kira` → Add disabled, warn visible.

### LOW-2 — the jsdom "outside edit" test mutates the model in place, so it does not pin "live model" (mutant M4b survives)
- `test/dom/elements/montage.test.ts:2730-2741` (`addMontageHero(view.currentModel(), 'osric')`).
- A real outside edit does not mutate the model object. It arrives as `update(newModel)`, which replaces `this.model` (`src/framework/view.ts:239-240`), or as a full redraw. The test mutates the same object instead. So a mutant that captures the model *reference* when the window opens (`const snapM = this.model`, then uses `snapM` in both checks) passes all 641 tests (`r2-mut-M4b.log`). The array-snapshot mutant M4 is caught.
- Safe today: in real Obsidian, `update()` → `unloadOwnedChildren()` → the modal owner unloads → the window closes. E2e probe MONT-R2P03 measured 0 modals open after an outside `vault.process` that added Osric, and Osric was on the board once. The jsdom probe with the view force-loaded also saw the window close and no write.
- jsdom side note: views mounted by the pipeline are not loaded there (`_loaded=false`, `r2-dump-head2.html.loaded.txt`). Without that forced load, `update()` does NOT close the modal in jsdom.
- Fix (test only): replace the model rather than mutate it, e.g. `(view as any).model = parse(parseYaml(<board + Osric>), '')`, then click Add and expect no write and the warn shown. Optionally add a test that a loaded view's `update(newModel)` closes the Add window.

### LOW-3 — the manifest comment says `rows` cite H07-H09, but no row does
- `e2e/manifest/montage-add-hero-modal.ts:4` says "`rows` cite … H07-H09 a name already on the board (SC-627)". The `rows` arrays (lines 13-15) still list only H01-H05.
- `rows` are annotation only, so no gate is affected. The comment is still wrong.
- Fix: add the ids to the rows (`montage.add-hero.name` +H07,H08,H09; `montage.add-hero.submit` +H07,H08 for click-disabled, +H09 for click), or reword the comment.

### INFO
1. A refusal from the view's re-check is silent. If `onAdd` refuses (`view.ts:483`), the modal's onClick still calls `this.close()` (`ConfigModals.ts:48-49`), so the window closes with no write and no message. This is only reachable when the modal's own check is bypassed: both checks call the same function on the same model in the same task. It is acceptable under ruling 3 ("writes nothing").
2. Mutant M8 (dropping `if (key === '') return undefined`) survives. It only makes a difference on a board with a whitespace-only hero name, and the guard does work there (probe "R2PROBE whitespace-only hero name"). It is a near-equivalent mutant, so no action.
3. Layout, measured in real Obsidian (MONT-R2P04): the modal measures 560×129.36 at open and 560×129.36 after typing a fresh name, so it does not move when no duplicate is typed. When the warn shows, it grows to 144.95 (+15.6 px) and its top moves by 7.8 px, because the modal is centred vertically. LogActionModal's warn does the same, and ruling 2 accepts it.
4. Clicking the disabled Add moves focus off the name field to `null`/body. This is native disabled-button behaviour and was already true for the empty name. My first R2P02 attempt tripped on it (`press(Enter…): the control does not have focus`). Not a regression.
5. Unknown keys after an add: the top-level `table_notes` is written after `current_round` (`r2-dump-head2.html.unk.yaml`). That is SC-625's existing placement and was not changed by this diff.

## Mutation probes (montage-scoped jest set: `test/dom/elements/montage*`, `test/unit/model/montage*`, `e2eCensus`, `inputHostCoverage`; baseline M0 641/641)

| Mutant | Change | Result |
|---|---|---|
| M1 | drop case-folding (both sides) | 4 red |
| M2 | drop trim (both sides) | 1 red (padded) |
| M2b | drop the trim on the board's side only | **survives** (LOW-1) |
| M2c | drop the trim on the typed side only | 1 red |
| M3 | drop the view `onAdd` re-check | 1 red (bypass test) |
| M4 | snapshot of names (deep copy) at open | 1 red (outside-hero test) |
| M4b | snapshot of the model reference at open | **survives** (LOW-2) |
| M5 | drop the modal onClick re-check | 1 red |
| M6 | message uses the typed spelling | 2 red |
| M7 | drop role=alert | 1 red |
| M8 | drop the empty-key guard | survives (near-equivalent, INFO 2) |
| M9 | raw `participants` with String coercion (no `isHero`) | 1 red (non-hero test) |
| M10 | refused onClick does not refresh | 1 red |
| M11 | warn not hidden at open | 1 red |

Each mutant was applied with perl, run, then reverted with `git -C <plugin> checkout -- src`. The tree was confirmed clean after each one.

## Integrity and race probes (throwaway; reverted with `git checkout -- <file>`)
- jsdom (`r2-probe-jsdom-applied.diff`, logs `r2-probe-head2.log` 7/7, `r2-probe-base.log`):
  - `' kIRA'` refused, and a forced click with the `disabled` attribute removed still writes nothing. Then `Osric` → one `replaceSource`: `- name:` count 2, `table_notes`/`player: Sam`/`dc: 12` kept.
  - two-Kira board: `kira` refused, message "Kira is already on the board".
  - padded hero name on the board refused.
  - whitespace-only hero name with an empty or blank field shows no warn.
  - scalar or mapping `participants` don't throw.
  - `update(newModel)` on a loaded view closes the window and writes nothing.
  - two-Kira render is byte-identical to the base.
- e2e (`r2-probe-e2e-applied.diff`, `r2-e2e-probe.log`, `r2-e2e-probe2.log`, `r2-e2e-probe4.log`, all ok):
  - MONT-R2P01: two-blocks.md, board B (Bram): `kira` allowed and lands on B only; A is unchanged and refuses `KIRA`.
  - MONT-R2P02: unknown-keys.md: Enter and click on ` KIRA ` → `expectNoWrite`, and the note text is byte-identical. Then `Osric` → 1 write, 2 `- name:` lines, unknown keys kept, prose above and below intact.
  - MONT-R2P03: an outside `vault.process` adds Osric while the window holds `Osric` → 0 modals open, Osric on the board once.
  - MONT-R2P04: warn styling and geometry (INFO 3).

## Gates (measured)
- tsc rc=0; lint rc=0 (only the `.eslintignore` deprecation notice). Logs: `r2-tsc.log`, `r2-lint.log`.
- jest: `Test Suites: 1 skipped, 285 passed, 285 of 286 total` / `Tests: 1 skipped, 12690 passed, 12691 total`, rc=0 (`r2-jest-full.log`). The obsidian-app.css cache was present, so this is 12689 + 1 against the implementer's fresh 12689/2.
- lifecycle: p2 `16/16 ok, 0 failed`, p3 `9/9`, p4 `4/4` (G-S56 last), p5 `7/7` (G-S91 first try). These are the parts holding the montage scenarios G-S12, G-S13, G-S40, G-S50, G-S53, G-S83 and G-S87. Each log's first line shows only that part's ids. Parts 1, 6 and 7 hold no montage scenarios and were not re-run.
- e2e: `OBSIDIAN-E2E done: 487/506 ok, 0 failed, 19 known-bug, coverage: 287/287 pairs` rc=0 (`r2-e2e-full.log`). That is N=2 new tests and Y=287, unchanged.
- shots: rc=0, 592 PNGs; button host-leak 163/978, modal button host-leak 40/240, capture clip 147 (`r2-shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`, 0 FAILED (`r2-freeze.log`).
- parity (LAST): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc=0 (`r2-parity.log`).
- styles.css sha256 after the HEAD build is `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (`r2-styles-after-e2e.sha`). That equals the implementer's base-build sha, and the diff has 0 lines in any CSS file.

Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc627-r2-rev/`

---

# r4 — scoped re-review of `afd1436c` (rebased onto dse develop `620d5774`)

**Executive summary**
- Verdict: **LAND-READY.** 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO.
- Rebase: `git range-diff 7b9e82cf..da3c8009 620d5774..d4b0c580` shows all three reviewed commits as `=` (27f97176=de3e6339, 82e43b33=b620d697, da3c8009=d4b0c580). The rebase changed nothing.
- `d4b0c580..afd1436c` closes LOW-1, LOW-2 and LOW-3 as prescribed. That delta is test and manifest only.
- Mutants re-applied: M2b goes red (1 failed, the new padded-board test). M4b goes red (1 failed, the outside-edit test). M4c, a reference snapshot in the window check only, also goes red.
- Montage jest set: 648/648. Montage e2e (`--element=montage`): `92/95 ok, 0 failed, 3 known-bug` (partial run). tsc/lint rc=0.
- Screenshot: `sc627-r4-duplicate-refused.png`, cropped to the window, real Obsidian 1.14.4, dark theme, board `Montage/fresh.md`, typed `kira`.
- Colours: the message text is orange (`rgb(232,149,74)` = `#e8954a`, `--dse-warn`), italic, 12px, on a near-black window (`rgb(28,28,28)`). The disabled Add is a teal fill (`rgb(77,184,199)`) with light-grey text, drawn at opacity 0.5. It therefore reads as a dim, muted dark teal next to the full-strength light-grey "Cancel". Disabled is shown by dimming and a default cursor, not by a hue change.
- No full-battery re-run: the delta touches no `src`. The implementer's r3 numbers are in line with the base-moved expectations.

## Delta review against the r2 prescriptions
- LOW-1 → `test/dom/elements/montage.test.ts:2756-2762`, new test "a hero stored with padding on the board still matches the typed name" (`name: "  Kira "`, typed `kira` → Add disabled, warn shown). Matches the prescription.
- LOW-2 → `test/dom/elements/montage.test.ts:2734-2736`. The test now *replaces* `view.model` with `parse(parseYaml(BOARD + osric))` instead of mutating it, and the unused `addMontageHero` import was removed. Matches the prescription.
- LOW-3 → `e2e/manifest/montage-add-hero-modal.ts:13,15`. The rows now cite H07, H08 and H09; the kinds are unchanged, so no new pair. Matches.

## Mutants (r4 runs; montage-scoped jest set; baseline `sc627-r4-M0` 648/648)
| Mutant | Result |
|---|---|
| M2b (drop the trim on the board's side) | 1 red: "a hero stored with padding on the board…" |
| M4b (`const snapM = this.model` used in both checks) | 1 red: "a hero added from outside…" |
| M4c (reference snapshot in the window's check only) | 1 red: same test |
| M4d (reference snapshot in the view's `onAdd` re-check only) | survives (INFO 1) |
After each one: `git -C <plugin> checkout -- src`, and `git status --porcelain` came back empty.

## INFO
1. M4d survives. Catching it would need the window's check bypassed *and* the model replaced while the window is open. In real Obsidian a model replacement closes the window (r2 probe MONT-R2P03), so this third layer cannot be reached. No action.
2. Implementer follow-up, which I agree with: the message uses the board's spelling verbatim. A hand-written `"  Kira "` therefore shows "  Kira  is already on the board". The extra spaces are mostly hidden by HTML whitespace collapsing. This is cosmetic, hand-written-YAML only, and consistent with ruling 2 ("the board's spelling").

## Measured
- jest montage set: `Tests: 648 passed, 648 total` rc=0 (`r2-mut-sc627-r4-M0.log`).
- e2e montage: `OBSIDIAN-E2E done: 92/95 ok, 0 failed, 3 known-bug, coverage: 62/416 pairs (partial run: gate skipped)` rc=0 (`r2-sc627-r4-e2e-montage.log`).
- Screenshot probe: `OBSIDIAN-E2E done: 1/1 ok` (`r2-sc627-r4-e2e-shot.log`; the computed styles are on its `R4P01` line). The throwaway spec edit was reverted (`sc627-r4-probe-shot-applied.diff`).
- tsc rc=0, lint rc=0 (`sc627-r4-tsc.log`, `sc627-r4-lint.log`; the r2-named `r2-tsc.log`/`r2-lint.log` were overwritten by this run).
- Branch: clean, HEAD `afd1436c`, origin/develop `620d5774`.
