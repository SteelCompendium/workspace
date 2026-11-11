# SC-436 r2: independent adversarial review

**Executive summary**
- Verdict: **FIX-REQUIRED** (small). 0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW, 6 INFO. Separately, 1 new LOW product bug and 2 INFO product nits for the owner to file.
- Reviewed: dse branch `sc436-e2e-conditions-modal` head `c7489d2b`, base `10db67e3` (7 commits). The review worktree is unchanged: HEAD `c7489d2b`, `git status --porcelain` empty before and after. One side effect: `git fetch origin develop` moved the shared `origin/develop` ref to `f69b8fd6`.
- Gates (my runs): tsc rc 0 · lint rc 0 · jest **6874 passed / 1 skipped / 0 failed** (259 of 260 suites; load 3.2 to 18.1; no SC-568 timeouts) · lifecycle **52/52** (21 + 16 + 9 + 4 + 2; G-S59 green on its first run, load 4.2) · e2e run 1 **`212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`** · run 2 `211/216, 1 failed` (RECOV-R07, the known SC-517 load flake; load 13 to 28) · run 3 **`212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`** (load 6 to 12). I did not rerun shots, freeze or parity: the product diff only adds attributes (checked).
- MEDIUM-1: the SC-580 jsdom marker does not flip under an idiomatic fix. A catch-all key handler on the modal's Obsidian `Scope` fixes the bug in real Obsidian (probe PROBE-02 green, and the 10 neighbouring tests stay green), but jest stays 558/558 green, so the marker never reports that the bug is fixed.
- LOWs repeat SC-435's LOW-1 pattern: plain tests pin behaviour that a marked bug's fix will change. The SC-581 toggle fix turns 2 plain matrix rows red (LOW-1). The SC-582 fix turns 40 plain jest tests red, 36 of them new in this branch (LOW-2). Also, `cond.color-custom` is counted as covered, but no e2e test drives its write: deleting the change handler leaves every e2e test green (LOW-3).
- The rest holds up under probing. Deleting 6 handlers, adding 4 stray writes and 2 writer clobbers (neighbouring content) turned the relevant drivers red. All 5 `test.failing` markers fail at their stated assertion. SC-581 (both fix shapes), SC-582, SC-583, SC-257 and the DOM-listener SC-580 fix each flip their marker.
- SC-556 (`f69b8fd6`): no interaction. The branch cherry-picks cleanly onto `f69b8fd6`. On that rebase, the jsdom suites pass 558/558 and the full e2e reads `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`. SC-556 makes only the block edit form's Save pin-only; this window's writes go through the view's debounced `persist()`, which SC-556 does not change.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-rev-r2-a446e2e6/`)

| Gate | Result | Log |
|---|---|---|
| tsc (`npm run tsc`, incl. `-p e2e`) | rc 0, clean | `tsc.log` |
| lint | rc 0, clean (only the known `.eslintignore` warning) | `lint.log` |
| jest full | `Tests: 1 skipped, 6874 passed, 6875 total`; `Suites: 1 skipped, 259 passed, 259 of 260`; rc 0; loadavg 3.2 to 18.1 | `jest-full.log` |
| e2e full, run 1 | `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`, rc 0 (known-bugs SC-257 C04, SC-384 N04, SC-355 N05, SC-572 POOL-C04); load 7.4 to 15.1 | `e2e-full1.log` |
| e2e full, run 2 | `211/216 ok, 1 failed`, rc 1. Only RECOV-R07 (`w.count` 2 vs 1, stamina-recoveries spec, untouched by this branch) = SC-517 load flake; load 13.4 to 28.5 | `e2e-full2.log` |
| e2e full, run 3 | `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`, rc 0; load 6.2 to 12.0 | `e2e-full3.log` |
| lifecycle 1-5 | 21/21, 16/16, 9/9, 4/4, 2/2 = **52/52**, every part rc 0 (load 2.7 to 8.4) | `lc-p1.log` .. `lc-p5.log` |
| jsdom control (8 condition-related suites, unmutated) | 558/558 | `j-none.log` |
| SC-556 rebase (cherry-pick onto `f69b8fd6`, head `3c955fdd`) | jsdom 558/558 (`j-rebased.log`); full e2e `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs` rc 0 (`e2e-rebased.log`) | |

## Probes (scratch worktrees `.../mut` (detached `c7489d2b`) and `.../rb` (the rebase), both `git worktree remove`d at the end)

1. **Product change is attribute-only.** `git diff 10db67e3..c7489d2b -- src/` is 6 lines in `src/views/ConditionsModal.ts`: `control: 'cond.done'` (footer), `control: 'cond.remove'` (iconButton), and `stampControl` for `cond.icon`, `cond.color-custom` and `cond.option`. `stampControl` (`src/framework/kit/controlId.ts:14`) only calls `setAttribute`. Nothing in `src/` or the CSS reads `data-dse-control`. The pilot ids (`cond.add/input/edit/duration/swatch/effect/icon-search`, `init.cond.add`) are kept, and the pilot specs COND-E01..E07 pass in all three full runs.
2. **Census.** Every interactive node the window can render is stamped. The nodes are: the cog and trash on each row; `+ Add condition`; Done; the combobox input; each option, including "Add custom"; the icon search; each icon choice, including "Use default"; the 4 duration chips; the 5 swatches; the colour input; and the 6 effect chips. Obsidian's X and backdrop are host ids. The other states add no new kinds of node:
   - the empty list leaves only Add and Done;
   - a custom row and a creature row use the same builder;
   - a typed icon search rebuilds the same buttons.

   Neither census is vacuous. The jsdom census opens the editor and the dropdown and counts the ids. CENSUS-07 opens the window on the hero of `conditions.md` (it has a custom row), opens Dazed's editor, then opens the dropdown, and asserts 10 ids. The pipette `<label>` has no id, but it is not a listener: the opacity-0 input over it is the target.
3. **Handler deletions** (`e-handlers.log`; mutations `no-emit-remove`, `icon-no-emit`, `pick-no-emit`, `effect-no-migrate`, `dur-wrong-row`, `no-color-change`). 19 of 21 drivers went red: R03-R06, D02-D05, D07, D08, D14, A03, A04, A07, C01, C02, N01, N03, X08. D15 stays green legitimately: under `dur-wrong-row` its row is row 0. **D11 stays green with the colour input's change handler deleted** (LOW-3).
4. **Stray writes** (each in its own run). A cog toggle that writes turns R01, R02, D01 and X05 red (`e-stray-toggle.log`). A dropdown close that writes turns A05 and E01 red (`e-stray-closeadd.log`). A Done that writes turns X01 and X02 red; X08 stays green, see INFO-1 (`e-stray-done.log`). An icon-search keystroke that writes turns D02 and X07 red (`e-stray-iconsearch.log`).
5. **Note-integrity probes against a clobbering writer** (`src/framework/host/ReadingModeBlockHost.ts`, the `replaceFenceBlock` call). With `clobber-eof` (strips the note's trailing newline), N01, N02 and N03 go red on their own byte checks, and A03, D05 and R03 go red through the driver's invariant (`e-clobber-eof.log`). With `clobber-after` (also eats the blank line after the fence), all 6 go red (`e-clobber-after.log`). N01 and N02 compare the sibling block and the prose byte for byte (`HEAD + FIRST_BLOCK + BETWEEN`, `BETWEEN + SECOND_BLOCK + TAIL`), so a write into the wrong block is caught too.
6. **Markers.** First, all 5 `test.failing` markers turned into plain tests (`j-markers-plain.log`). Each fails at its stated assertion:

   | Marker | Fails at |
   |---|---|
   | SC-257 | `:386`, onChange 0 calls |
   | SC-580 | `:558`, `Received: null` |
   | SC-581 | `:578`, cleared false |
   | SC-582 | `:589`, `"Color #c0392b"` lacks "Red" |
   | SC-583 | `:597`, `["dazed","dazed"]` |

   Second, scratch fixes, each run over the 8 condition-related suites (558 tests):

   | Fix | Marker flips? | Other plain tests red |
   |---|---|---|
   | `fix583` (case-insensitive dedupe) | yes | none (`j-fix583.log`) |
   | `fix257` (Unicode slug) | yes | none (`j-fix257.log`) |
   | `fix580-dom` (keydown on `modalEl`) | yes | none (`j-fix580-dom.log`) |
   | **`fix580-scope`** (a catch-all `this.scope.register(null, null, …)`) | **no** (558/558 green) | none, so nothing signals the fix (`j-fix580-scope.log`); MEDIUM-1 |
   | `fix581-none` (a "No color" button in the group) | yes | 3, all structural (counts, plus "no colour presses []") (`j-fix581-none.log`) |
   | **`fix581-toggle`** (re-pressing the selected swatch clears it) | yes | **2 plain matrix rows** (`j-fix581-toggle.log`); LOW-1 |
   | **`fix582`** (aria-label = the name) | yes | **40 plain tests** (36 new matrix rows + 4 pre-existing in `conditions-modal.test.ts`) (`j-fix582.log`); LOW-2 |

   **e2e checks.** SC-257, SC-384 and SC-355 report `known-bug` with their `failsWith` matched in all 3 full runs. SC-580 reproduces in real Obsidian: PROBE-02 has focus on "+ Add condition" and presses a real `d`, and no input appears (`e-probe-head.log`). With `fix580-scope`, PROBE-02 passes, and so do O03, O04, A01, A02, A03, A06, E01, X05 and X07 (10/10, `e-fix580-scope.log`).
7. **`cond.color-custom` real-input alternatives** (`e-probe-head.log`, `e-probe-head2.log`):
   - wdio `setValue('#123456')` reaches the real change handler and writes once, but through WebDriver Element Clear: the note gets `#000000`, not the value sent.
   - `addValue` (Element Send Keys alone) writes nothing. A colour input is not typeable in Chromium/Electron.
8. **jsdom survey** (`jprobe.log`, P1-P7). P1 found the product bug below; e2e PROBE-03 confirms it in real Obsidian (`e-probe03.log`). P3 and P6 are INFO nits. P2, P4, P5 and P7 behave correctly.

## Findings

### MEDIUM-1: the SC-580 marker stays failing under an idiomatic Obsidian fix, so it would never report "fixed"
`test/dom/views/conditions-modal-matrix.test.ts:553-559`.

The marker dispatches a DOM `keydown` on the `+ Add condition` button. The jsdom `Modal` mock never routes DOM key events into `Scope.handleKey` (`test/mocks/obsidian-core.ts:617-640`, `:642ff`). Obsidian's own way to take keys in a modal is its keymap Scope (`this.scope.register(...)`).

Probe `fix580-scope` registers a catch-all on the modal's scope:
- In real Obsidian it fixes the bug: PROBE-02 green, and nothing nearby breaks (`e-fix580-scope.log`).
- In jest everything stays green, 558/558, and the `test.failing` marker is still "passing" (`j-fix580-scope.log`).

So the fixer gets no "marker now passes" signal. The marker keeps claiming the bug is open, and a fixer who removes `.failing` to check their work sees red and concludes the fix does not work. This fails the brief's bar that a marker passes under any reasonable fix. A DOM-listener fix (`fix580-dom`) does flip it.

**Fix:** move the SC-580 marker to e2e, where the real keymap runs. Use the shape of my scratch PROBE-02: open the window from the tracker on `Initiative/tracker.md`, assert focus is on `cond.add`, `dse.press('d', modal.control('cond.add'))`, then expect `cond.input` to exist. Add `failsWith: /cond\.input.*to be existing/` or the message the run prints. Wrap it in `knownBug('SC-580', ...)` and delete the jsdom `test.failing`. If the marker must stay in jsdom, also feed the event to `(modal as any).scope.handleKey(evt, { modifiers: '', key: 'd', vkey: 'D' })` after the DOM dispatch, so both fix shapes flip it.

### LOW-1: two plain matrix rows pin re-clicking the selected swatch as "writes the same colour", which SC-581's sanctioned toggle fix changes
`test/dom/views/conditions-modal-matrix.test.ts:189-199`. The affected rows are COLOR_STARTS "a preset" and "a preset spelled in upper case", each × SWATCHES Red.

The ledger ruled that the SC-581 marker must pass under either fix shape, one of which is "re-activating the selected swatch". Under that fix (`fix581-toggle`) the marker flips, but these 2 plain rows also go red (`j-fix581-toggle.log`). They assert `{ color: '#c0392b' }` and a pressed Red after clicking the already-pressed Red, and they do not cite SC-581. This is the same as SC-435 r2 LOW-1, which the brief asked to check for.

**Fix:** leave the already-selected swatch out of the plain colour table (`SWATCHES.filter(([, hex]) => !sameColor(color, hex))` per start state), and give that case its own plain row titled `… [current behaviour — SC-581 may change this]`.

### LOW-2: the matrix and the e2e helpers identify swatches by the hex aria-label that SC-582 will rename
SC-582 is the ruled a11y bug: the aria-label should carry the colour's name.

**jsdom.** In `test/dom/views/conditions-modal-matrix.test.ts`, the `SWATCHES` labels (`:163-169`), the `pick(…, 'Color', 'Color #…')` calls, and `pressedIn(…, 'Color')` expectations (`:172-176`, `:204`, `:376`, `:470`) all use `Color #hex`. Under `fix582` (aria-label = name, plus the matching `focusPickedOption` re-find), 40 plain jest tests go red (`j-fix582.log`):
- 33 in the colour matrix, 2 custom-session rows and 1 emit row, all new in this branch;
- 4 pre-existing ones in `conditions-modal.test.ts`.

**e2e** (by inspection; not run under the fix). `pressedIn('Color')` equals `['Color #…']` in COND-D01 (`cond-editor.e2e.ts:37`), D09 (`:148`, `:151`) and N06 (`cond-integrity.e2e.ts:90`).

The fixer of a one-attribute a11y bug would have to rewrite ~40 tests that this branch added.

**Fix:** find swatches by their hex through an attribute the fix will not touch. Either read the hex from the `title` (`Red (#c0392b)`), or select `[style*="--dse-swatch: #c0392b"]`. Use that in the matrix's `pick` / `pressedIn` for the Color group and in an e2e `pressedSwatch()` helper. Then only the SC-582 marker and the one row that asserts the label's text depend on the bug.

### LOW-3: `cond.color-custom` counts as covered, but no e2e test drives its write; deleting the change handler leaves all e2e green
The pair is `e2e/manifest/conditions-modal.ts:31`, driven by COND-D11 (`e2e/specs/conditions-modal/cond-editor.e2e.ts:163-171`).

D11 is honest about what it asserts: real Tab + Enter, nothing written, the window stays up. But the pair's real effect, a colour written to the note, exists only in jsdom. Under `no-color-change` (the `change` listener at `ConditionsModal.ts:487` deleted), D11 stays green and so does every other e2e test (`e-handlers.log`).

Judgement on the brief's question (6b):
- WebDriver offers no faithful real-input path. `setValue` reaches the handler only through Element Clear (writes `#000000`), and `addValue` writes nothing (probe 7).
- The best approximation in real Obsidian is the chooser's own commit, dispatched page-side. It runs the real bundle's handler, the rebuild, the focus hand-off and the live write.

**Fix:** keep D11 as the real-input driver of `press:Enter`. Add one plain e2e test that is NOT credited as a manifest drive (do not use `dse.press` / `dse.click` on the input, so nothing is recorded):
- Tab to `cond.color-custom` on Hexed.
- Run `dse.page` with `el.value = '#123456'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }))`. This is what Chromium fires when the chooser commits.
- Assert one write, `{ key: 'hexed', color: '#123456' }` in the note, `data-selected` on `.dse-swatch--custom`, the input's aria-label `Custom condition color #123456, selected`, and focus still on the input.
- Its title should say the chooser itself is out of CDP's reach.

### INFO
- **INFO-1:** COND-X08 (`cond-open.e2e.ts:139-151`) is titled "Done closes without a second write", but it cannot see a redundant emit. After the Dazed add, a Done that calls `emitChange()` writes the same block body, and the host writes nothing for an identical body (`stray-done`: X08 green). X01 and X02 do catch it, because their fixture's string `bleeding` changes form on the first write. No change needed. Optionally retitle X08 "… the tracker row shows the new condition".
- **INFO-2:** the manifest's row citations `E01`..`E08` (`e2e/manifest/conditions-modal.ts:22-28`) name the NEW editor scenarios. The specs number those COND-D01..D16, and COND-E01..E07 are the pilot tests. For example, `cond.icon-search` cites `E01`, but COND-E01 is the pilot's Escape-in-dropdown test; the real drivers are D02 and X07. Fix: cite D02/D04 (icon), D05/D08 (duration), D09/D10 (swatch), D11 (colour), D12/D16 (effect).
- **INFO-3:** e2e run 2 hit RECOV-R07 (SC-517) at load 13 to 28. Runs 1 and 3 were green. This branch does not touch that spec.
- **INFO-4:** SC-556 (`f69b8fd6`) does not interact with this branch (see the summary). The fix round's rebase should cherry-pick cleanly; mine did, onto `3c955fdd`.
- **INFO-5:** reuse caveats for SC-437 in `e2e/driver/conditions.ts`:
  - `ROW_NTH` (hero = the 1st `init.cond.add`, creature = the 2nd, `:16`) assumes exactly one hero row.
  - `noteCondition` (`:85-92`) hard-codes `heroes[0]` and `enemy_groups[0].creatures[0].instances[0]`.
  - `trackerIcons` reads Reading view only.

  SC-437 should generalise these (row by name, instance by id) rather than copy them.
- **INFO-6:** Escape inside the icon search closes the whole window, and COND-X07 pins that as intended. Escape inside the Add dropdown closes only the dropdown (SC-431). Nothing is lost, because writes are live, but the two search fields behave differently. There is no ruling on this; the owner may want to ask Scott.

### Checked and fine
- **Manifest honesty.** Every listed pair other than `cond.color-custom` has a plain driver that uses real input. Each one asserts the note and the screen when it writes, or the screen inside a whole-action `expectNoWrite` when it does not. The no-write tests wrap open + act + close in one `expectNoWrite`, which avoids SC-435's LOW-2 shape.
- **Reach paths.** Both are driven, and the specs tell them apart: hero in O01, O03 and the A/D series; creature in O02, A07, C02, R04, D08 and N06. The coverage gate cannot tell them apart, since `init.cond.add` is stamped on both, as the implementer notes.
- **jsdom matrix.** Expectations are literals, not computed by the code under test. The duration × start-shape table includes the dead-legacy-effect and real-effect shapes. The effect table includes both legacy spellings and an explicit duration that wins. The emit/no-emit table holds the holder unchanged on every no-write row. `DURATION_PRESSED` is an identity map, harmless.
- **Shared helpers.** `e2e/driver/conditions.ts` is 92 lines of page-side reads plus `openFrom` / `openConditionsModal` / `addByKeyboard`. It is small and generic, with the INFO-5 caveats. No driver core (`dse.ts`) change.
- **Fixtures and docs.** `Initiative/conditions.md` and `two-trackers.md` are listed in the README. The docs fix at `docs/initiative-tracker.md:441` is correct.

## Product bugs (for the owner to file; none of these are fixed or marked in this branch)

1. **Removing the last condition with the keyboard while the Add dropdown is open drops focus to `<body>`.** LOW (a11y; the SC-186 MED-3 contract is "never `<body>`").
   - **Repro (real Obsidian, e2e PROBE-03, `e-probe03.log`):** open `Initiative/conditions.md` and open Conditions from the creature row. Remove Prone. Click "+ Add condition", press Shift+Tab (focus lands on "Remove Grabbed"; the dropdown stays open, because nothing closes it on focus-out), then press Enter. Grabbed is removed and focus goes to `<body>`. The dropdown is still open, with its input unfocused.
   - **Cause:** `removeAt` (`src/views/ConditionsModal.ts:349-350`) focuses `.dse-condal__add`, which does not exist while the combobox is open. Keyboard activation sends no `mousedown`, so the outside-close (`:188-210`) never arms.
   - **Fix direction:** when the list empties with the combobox open, focus its input.
   - Also in jsdom: P1 in `jprobe.log` shows `focus: "<body>", dropdownOpen: true`.
2. **The custom colour chooser opens at white for a CSS-named colour.** INFO. With `color: teal` the pipette is marked selected and the input's aria-label says "teal, selected", but `input.value` is `#ffffff` (`ConditionsModal.ts:486` accepts only `#rrggbb`). The chooser does not start at the current colour. jsdom P3.
3. **`icon: ""` in the YAML presses no icon choice.** INFO. The row shows the default glyph (`entry.icon?.trim() ||` default, `:282`), but "Use default" is not pressed (`value === entry.icon`, `:386`). Cosmetic, from hand-edited YAML only. jsdom P6.

## Artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-rev-r2-a446e2e6/`:
- **Gate logs** (each with a matching `.rc`): `tsc.log`, `lint.log`, `jest-full.log`, `e2e-full1.log`, `e2e-full2.log`, `e2e-full3.log`, `lc-p1.log`..`lc-p5.log`.
- **Rebase logs:** `j-rebased.log`, `e2e-rebased.log`.
- **jsdom probe logs:** `j-none.log`, `j-markers-plain.log`, `j-fix581-toggle.log`, `j-fix581-none.log`, `j-fix582.log`, `j-fix583.log`, `j-fix580-dom.log`, `j-fix580-scope.log`, `j-fix257.log`, `jprobe.log`.
- **e2e probe logs:** `e-probe-head.log`, `e-probe-head2.log`, `e-probe03.log`, `e-fix580-scope.log`, `e-handlers.log`, `e-stray-toggle.log`, `e-stray-closeadd.log`, `e-stray-done.log`, `e-stray-iconsearch.log`, `e-clobber-eof.log`, `e-clobber-after.log`.
- **Probe sources:** `probe-src-_probe.e2e.ts`, `probe-src-zz-reviewer-probe.test.ts`.
- **Scripts:** `run.sh`, `jfix.sh`, `emut.sh`, `mutate.py` (every mutation and scratch fix, verbatim).
- **e2e bundles:** the failure bundles of the mutation runs were in the scratch worktree's `e2e/.out` and were removed with it. Run 2's RECOV-R07 bundle is in the review worktree's ignored `e2e/.out/20261110-212145-3c49/`.

Both scratch worktrees (`mut`, `rb`) were removed by literal path. The review worktree is unchanged: HEAD `c7489d2b`, and `git status --porcelain` is empty in `draw-steel-elements/`.

---

# r4: scoped re-review of the r3 fix round (`253ffa3d` on `f69b8fd6`)

**Summary**
- Verdict: **LAND-READY.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 2 INFO (all new). Every r2 finding is fixed as ruled (MEDIUM-1, LOW-1..3, INFO-1, INFO-2, plus INFO-6 → SC-587). The new LOW is the owner's call to fold or defer.
- The rebase carried r1 unchanged: `range-diff 10db67e3..c7489d2b f69b8fd6..253ffa3d` shows commits 1-7 as `=`. The delta is `48290138` + `253ffa3d`, 6 files, tests only (no `src/`).
- Gates: tsc rc 0 · lint rc 0 · matrix + census 298/298 · the 8 condition suites 560/560 · full e2e **`213/218 ok, 0 failed, 5 known-bug, coverage: 132/132 pairs`**, rc 0, on the first run at load 16.7 → 10.9 (known-bugs SC-257, SC-384, SC-580, SC-355, SC-572). I did not rerun lifecycle, shots, freeze or parity: there is no `src/` change and nothing looked off.
- MEDIUM-1 is closed. COND-N07 reports `known bug SC-580 appears fixed - remove the marker` under BOTH the Scope fix and the DOM-listener fix, and O03 and A01 stay green.
- LOW-1, LOW-2 and LOW-3 are closed, and SC-585 and SC-586b are fix-agnostic.
- LOW-r4-1: the SC-586a marker has MEDIUM-1's defect, in a smaller form. Normalising the colour through a canvas fixes the bug in real Obsidian, but jsdom has no canvas, so the marker stays failing.

## Checks (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-rev-r4-a446e2e6/`; scratch worktree `mut` detached at `253ffa3d`, removed)

1. **MEDIUM-1 / COND-N07** (`cond-integrity.e2e.ts:106-112`).
   - Unmutated: `known-bug SC-580` in the full run.
   - `fix580-scope`: N07 FAILs with "known bug SC-580 appears fixed - remove the marker"; O03 and A01 stay green (`r4-e-fix580-scope.log`).
   - `fix580-dom`: the same (`r4-e-fix580-dom.log`).
   - `dse.press('d')` has no target, so it records `(page)`, not a manifest pair. Coverage stays 132/132.
2. **LOW-1.** Under `fix581-toggle` exactly 3 tests go red: the SC-581 marker and the two `[current behaviour — SC-581 may change this]` rows (`r4-j-fix581-toggle.log`).
3. **LOW-2.** Under `fix582` this branch's only red test is the SC-582 marker (`r4-j-fix582.log`). The other 4 red jest tests are pre-existing ones in `conditions-modal.test.ts`. In e2e under `fix582`, D01, D09, D10, D17, N06, E05 and E07 are green (`r4-e-fix582.log`). The pilot's COND-E02 and E03 (`e2e/specs/initiative/conditions-pick-focus.e2e.ts:56,73`, not this branch) go red because they assert `label: 'Color #1e8449'`; see INFO-r4-2.
4. **LOW-3 / COND-D17.** With the change listener deleted (`no-color-change`), D17 FAILs with "no write" and D11 stays green, as designed (`r4-e-nocolor.log`). D17 gets to the input with `tabTo` and fires the events through `dse.page`, so nothing is recorded as a drive. It asserts one write, the note, `data-selected`, the aria-label, focus, and that no preset swatch is pressed.
5. **New markers.** First, all 7 `test.failing` markers run as plain tests (`r4-j-markers-plain.log`). SC-585 fails at `:619` (activeElement is `<body>`), SC-586a at `:628` (`#ffffff` instead of `#008080`), SC-586b at `:636` (no choice pressed). Then each new marker under scratch fixes:

   | Fix | Marker | Result |
   |---|---|---|
   | `fix585` (focus the combobox input when the list empties) | SC-585 | flips; nothing else breaks (`r4-j-fix585.log`) |
   | `fix585-close` (close the dropdown, then focus Add) | SC-585 | flips; nothing else breaks (`r4-j-fix585-close.log`) |
   | `fix586b` (`value === (entry.icon?.trim() \|\| undefined)`) | SC-586b | flips; nothing else breaks (`r4-j-fix586b.log`) |
   | `fix586a-table` (a named-colour lookup) | SC-586a | flips. The other red test is the source-hygiene guard, which rejects my scratch fix's hex literals; it is not marker-related (`r4-j-fix586a-table.log`) |
   | **`fix586a-canvas`** (a 2D canvas `fillStyle` normalisation) | SC-586a | **560/560 green: the marker stays failing** (`r4-j-fix586a-canvas.log`). In real Obsidian the same fix works: PROBE-04 reads `value "#008080"` with the fix and `"#ffffff"` without it (`r4-e-probe04-canvas.log`, `r4-e-probe04-head.log`). LOW-r4-1 |

6. **Retitles and citations.**
   - X07 now ends `[current behaviour — SC-587 may change this]`.
   - X08 is retitled.
   - The manifest rows cite the real drivers: D02/D04 icon, D05/D08 duration, D09/D10 swatch, D11 colour, D12/D16 effect, A04 option. The header explains the D/E numbering.
7. **Control run.** The unmutated 8 condition suites pass 560/560 (`r4-j-none.log`).

## New findings

### LOW-r4-1: the SC-586a marker stays failing under the usual browser fix (canvas normalisation)
The marker is at `test/dom/views/conditions-modal-matrix.test.ts:623-629`.

The standard way to turn a CSS colour name into `#rrggbb` in a browser is a 2D canvas: set `fillStyle = 'teal'` and read it back. jsdom has no canvas: `getContext` returns null without the `canvas` package. So the probe's fix (`fix586a-canvas`) works in real Obsidian (PROBE-04) while jest stays 560/560 and the marker never flips. This is the same class as r2 MEDIUM-1. It rates LOW only because SC-586 is a cosmetic nit and a lookup-table fix does flip the marker.

Fix (either):
- (a) Move SC-586a to e2e as `knownBug('SC-586', …)`. Use the PROBE-04 shape: `dse.externalEdit` adds `color: teal` to Hexed in `Initiative/conditions.md`, `previewMode.rerender(true)`, open the editor, then expect the `cond.color-custom` value `#008080`. Probe source: `probe-src-_probe.e2e.ts` in the r4 scratch dir.
- (b) Keep it in jsdom and stub the canvas for that one test: `jest.spyOn(HTMLCanvasElement.prototype, 'getContext')` returning an object whose `fillStyle` setter maps `teal` → `#008080`. Then both fix shapes flip it.

### INFO-r4-1
The manifest comment at `e2e/manifest/conditions-modal.ts:30-31` still says the colour input's "change -> write path is a jsdom test". COND-D17 now covers it in real Obsidian, and the comment should say so. Separately, the section comment `-- E. The inline editor` at `:25` still uses E; the header now says D.

### INFO-r4-2
SC-582's fixer will also have to update the pilot's COND-E02/E03 (`conditions-pick-focus.e2e.ts:56,73`, the `label: 'Color #1e8449'` checks) and 4 pre-existing `conditions-modal.test.ts` tests. These predate SC-436 and are outside this ticket; tell SC-582.

## r4 logs
- **Gates:** `r4-tsc.log`, `r4-lint.log`, `r4-matrix.log`, `r4-e2e-full.log`.
- **jsdom probes:** `r4-j-none.log`, `r4-j-markers-plain.log`, `r4-j-fix581-toggle.log`, `r4-j-fix582.log`, `r4-j-fix585.log`, `r4-j-fix585-close.log`, `r4-j-fix586a-table.log`, `r4-j-fix586a-canvas.log`, `r4-j-fix586b.log`.
- **e2e probes:** `r4-e-fix580-scope.log`, `r4-e-fix580-dom.log`, `r4-e-nocolor.log`, `r4-e-fix582.log`, `r4-e-probe04-head.log`, `r4-e-probe04-canvas.log`.
- **Scripts and sources:** `run.sh`, `jfix.sh`, `emut.sh`, `mutate.py`, `probe-src-_probe.e2e.ts`.

The scratch worktree `mut` was removed by literal path. The review worktree is unchanged: HEAD `253ffa3d`, `git status --porcelain` empty.

---

# r6: delta check (`97a9c93b` on `32441332`, SC-437 landed)

**Summary**
- Verdict: **LAND-READY.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 0 INFO new. LOW-r4-1 and INFO-r4-1 are both fixed.
- Rebase: the range-diff shows commits 1-4 and 6-9 as `=`. Commit 5 differs only in the README table context (SC-437's `rich.md` and `captain.md` rows sit above this branch's two rows). Two new commits: `cbd5759f` (r5 folds) and `97a9c93b` (CENSUS-07 → CENSUS-09). The `src/` diff against `32441332` is still the 6 ConditionsModal attribute lines.
- Gates: tsc rc 0 · lint rc 0 · matrix + census 307/307 · full e2e **`249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`**, rc 0, first run, load 4.4 → 12.4. I did not run lifecycle, shots, freeze or parity: there is no `src/` change beyond the attributes.
- SC-586a: `fix586a-canvas` and `fix586a-table` each flip the marker, and each is the only red test (`r6-j-canvas.log`, `r6-j-table.log`). The stub is restored in `finally`. With every marker running as a plain test, so the SC-586a assertion throws inside the `try`, a test placed after it still sees an unmocked `getContext` (`r6-j-leak.log`).
- Manifests: nothing is counted twice or dropped. `init.cond.add` is defined only in `manifest/conditions-modal.ts`; `initiative.ts` points to it and adds only `init.cond.remove`. The pair arithmetic is exact (below).

## Checks (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-rev-r6-a446e2e6/`; scratch worktree `mut` detached at `97a9c93b`, removed)

1. **LOW-r4-1** (`conditions-modal-matrix.test.ts:623-644`). The stub `jest.spyOn(HTMLCanvasElement.prototype, 'getContext')` returns a context whose `fillStyle` setter maps `teal` → `#008080`, and `mockRestore()` runs in `finally`.
   - Under the canvas fix: 1 failed / 280 passed of 281. The only red test is the SC-586a marker, now passing.
   - Under the lookup-table fix: the same.
   - Leak probe: all 7 markers run as plain tests, and an extra test placed after SC-586a asserts `jest.isMockFunction(HTMLCanvasElement.prototype.getContext) === false`. Result: 7 failed (the markers), and the extra test passes.
2. **INFO-r4-1.** `e2e/manifest/conditions-modal.ts:25` now reads `-- D. The inline editor`. `:30-32` say D11 drives the Enter, D17 dispatches the chooser's commit (with no pair credited), and jsdom holds the value matrix.
3. **Rebase and manifests.**
   - `range-diff f69b8fd6..253ffa3d 32441332..97a9c93b`: only commit 5 shows `!`, and its hunk is README context only.
   - `init.cond.add` appears once across `e2e/manifest/`, in the `conditions-modal.ts` reach row with `click` and `press:Enter`. `initiative.ts:9` and `:53` point to it in comments, and `:54` adds `init.cond.remove` (`click`, SC-437's).
   - Pair arithmetic. Base `32441332` reads 142/142 in the SC-437 ledger; this branch adds the same +19 pairs it added at r2 (113 → 132); 142 + 19 = **161**, which matches. Tests 206 → 260 = +54 and known-bugs 7 → 11 = +4 (SC-257, SC-384, SC-580, SC-355), both the same deltas as before the rebase.
4. **Censuses under SC-437's scoping.** CENSUS-09's body is byte-identical to the old CENSUS-07: it opens a row editor, then the dropdown, and asserts 10 ids. It still scopes `.modal-container .dse-modal .modal-content *`, and it passes in the full run. SC-437 changed `eventfulNodes` so that `excludeInside` may be `null` (default unchanged) and gave `censusFindings` an optional `inert` set; neither changes this test's call. SC-437's new tracker-root census (CENSUS-04) and the jsdom tracker census accept `init.cond.add`, which ALL_IDS still carries. The jsdom `SC-436 census: the ConditionsModal` block (`test/dom/e2eCensus.test.ts:381ff`) is unchanged and green.
5. **SC-437's `dse.blur(el, awayTarget?)`.** The default is still the modal title, so COND-A05's click-away is unchanged. It passes in the full run.

## r6 logs
- **Gates:** `r6-tsc.log`, `r6-lint.log`, `r6-matrix.log`, `r6-e2e-full.log`.
- **Probes:** `r6-j-canvas.log`, `r6-j-table.log`, `r6-j-leak.log`.
- **Range-diff:** saved as `r6-rangediff.txt`.
- **Scripts:** `run.sh`, `jfix.sh`, `mutate.py` (includes `leak-check`).

The scratch worktree `mut` was removed by literal path. The review worktree is unchanged: HEAD `97a9c93b`, `git status --porcelain` empty.
