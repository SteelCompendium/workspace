# SC-436 r1 implementer report

**Executive summary**
- STATUS: NEEDS_CONTEXT (two LOW product bugs to file, then I add their markers). Branch `sc436-e2e-conditions-modal` in `draw-steel-elements/`, head `cdd15469`, rebased onto origin/develop `10db67e3` (was cut at `2ee2e405`; SC-558 landed mid-task; clean rebase, no package.json change).
- All gates measured on the rebased head: tsc/lint clean; jest 6866 passed / 1 skipped / 259 suites, 0 failed (baseline 6591 + 275); lifecycle 52/52; e2e `212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs` (baseline 113); shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147); freeze 280/280; parity 0/0/24.
- Product source touched only to add 5 `data-dse-control` ids (attributes only; freeze unchanged).
- Manifest +19 pairs (113 -> 132). 52 new e2e tests incl. 3 known-bug (SC-257, SC-384, SC-355 all reproduce) and 1 census; jsdom matrix 271 tests (1 `test.failing` SC-257) + 4 census.
- 2 new bugs (below). SC-555 not reproduced (the window has a "Done" button).

## Commits (on 10db67e3)
- `ceb539b6` feat(SC-436): data-dse-control ids for the rest of the ConditionsModal (attributes only) and its full e2e manifest
- `2dfceabe` test(SC-436): e2e specs for the ConditionsModal (open/close paths, Add dropdown, custom conditions, row cog + remove, inline editor, note integrity), fixtures and driver helpers
- `b10eab1e` test(SC-436): jsdom and real-Obsidian censuses for the ConditionsModal
- `420988d8` test(SC-436): jsdom matrix for the ConditionsModal (...) with an SC-257 marker
- `293fca88` test(SC-436): round-trip scenario, README fixture rows for the two new notes
- `cdd15469` test(SC-436): real census asserts only the controls the browser sees listening

## Controls added
`cond.remove` (trash button), `cond.option` (dropdown options, repeated), `cond.icon` (icon choices incl. "Use default", repeated), `cond.color-custom` (the `input[type=color]`), `cond.done` (footer). Existing ids kept unchanged (`cond.add/input/edit/duration/swatch/effect/icon-search`, reach `init.cond.add`); no renames. Only file touched in `src/`: `src/views/ConditionsModal.ts` (5 attribute lines).

## Manifest pairs added (19; `e2e/manifest/conditions-modal.ts`)
`init.cond.add` press:Enter · `cond.add` press:Enter · `cond.input` press:ArrowDown, press:ArrowUp, blur · `cond.option` click · `cond.edit` press:Enter, press:Escape · `cond.remove` click, press:Enter · `cond.icon-search` type, press:Escape · `cond.icon` click, press:Enter · `cond.duration` click · `cond.color-custom` press:Enter · `cond.effect` click · `cond.done` click, press:Enter. (`modal.close`/`modal.backdrop` rows are listed too but dedupe against other manifests.) `cond.color-custom` can only be driven to "Enter opens the browser's colour chooser, nothing written": CDP cannot reach the native chooser, and the input is opacity 0 (wdio will not click it), so the `change` -> write path is jsdom only (matrix, "custom colour input" rows).

## e2e specs (`e2e/specs/conditions-modal/`, driver `e2e/driver/conditions.ts`)
- `cond-open` (COND-O01-O04, X01-X08): reach from hero row and creature row (pointer, and Tab + Enter); initial focus; every close path (Done click and Tab+Enter, X, Escape on Done, Escape on an open row's cog, backdrop, Escape inside the icon search); each wraps open + leave in one `expectNoWrite`.
- `cond-add` (A01-A07, C01-C03, C04 known-bug): dropdown open/filter/arrows/Enter/click-pick/click-away/duplicate/creature-row; custom conditions by Enter and by clicking the "Add custom" row; punctuation no-op.
- `cond-rows` (R01-R06): cog toggling (pointer + keyboard), trash by click and Tab+Enter, focus after removal, editor index shifts.
- `cond-editor` (D01-D16): current-settings display, icon search/pick/default/keyboard, each duration chip, colour swatches, custom colour Enter, effect chips, legacy effect text migration, string -> object on first edit, creature row.
- `cond-integrity` (N01-N06): edits via the SECOND tracker leave the first byte-identical; edits via the FIRST leave the second byte-identical; prose above/between/below survives; a full session keeps the fence lines; round trip (set icon/duration/colour/effect, re-render from the note, reopen, all settings shown); N04 SC-384 and N05 SC-355 known-bug.
- `_census.e2e.ts` CENSUS-07 (rows + open editor + open dropdown).
- Existing COND-E01..E07 untouched and green.

## Fixtures (README table updated)
- `Initiative/conditions.md`: hero Alice Alpha with `bleeding` (string), Dazed (eot, `#c0392b`, glow), Hexed (custom), Slowed (legacy `effect: save ends`); Ogre #1 `grabbed` + Prone (save-ends); Ogre #2 none.
- `Initiative/two-trackers.md`: two `ds-initiative` blocks with prose above, between, below (second hero has a string and an object condition).

## jsdom
- `test/dom/views/conditions-modal-matrix.test.ts` (271 tests, one `test.failing`): duration (5 start shapes x 4 presets x hero/creature), effect (7 start shapes x 6 effects x host, incl. legacy migration), colour (6 start colours x 5 swatches, custom input, pressed + pipette state), icon picker, adding every catalogue condition (24) x host x string/object existing entries (+ duplicate no-op, fresh-copy emission, holder not mutated), custom-name slugs (9 values, 3 no-op punctuation rows, duplicate, slug to catalogue key, full custom session), removal (9 rows x open editor x removed row + focus), emit/no-emit table for every interaction (11 no-write, 10 write). SC-257 `test.failing` (reason verified: `onChange` called 0 times).
- `test/dom/e2eCensus.test.ts`: +4 tests (rest, editor open, dropdown open, the tracker's two `init.cond.add` buttons).

## Note-integrity probes
`Initiative/two-trackers.md` (COND-N01/N02: sibling block + prose asserted byte-exact in addition to the driver's automatic fence check), `tracker.md` full session (N03: fence lines and ABOVE/BELOW stay), N06 round trip.

## Bugs found (file in DSE 7.0.0, Bug + DSE Plugin, related SC-436)
1. **"Or just start typing" does not open the Add search** — LOW (docs vs behaviour). `docs/initiative-tracker.md:430` ("Click '+ Add condition' (or just start typing) to open the type-ahead search"). Repro: open the Conditions window from a tracker row (focus lands on "+ Add condition" / the first cog), type `daz`: nothing happens, no input appears (e2e probe, real Obsidian). `src/views/ConditionsModal.ts` `onOpen` (l.135-216) has no window-level key handler. Resolution is the owner's call (implement, or fix the doc); the marker will encode the documented behaviour.
2. **A condition's colour cannot be cleared from the window** — LOW (gap). `renderSwatches` (`src/views/ConditionsModal.ts` l.457-485) and `setColor` (l.487-495) only ever set a colour (5 swatches + custom input); Icon has "Use default", Duration "Until removed", Effect "static", Colour has nothing. A colour once set stays until the YAML is hand-edited. Repro: open editor, pick a swatch, look for a way back to no colour.

Known tickets reproduced (marked, not refiled): SC-257 (COND-C04 `knownBug` + matrix `test.failing`), SC-384 (COND-N04, Live Preview: the window closes when its own write lands; failsWith "closed when its own write landed"), SC-355 (COND-N05, `getComputedRole()` is "generic", not "dialog"). SC-555: not reproduced (a "Done" button exists, label "Done").

## What the resume will do
Add `knownBug('SC-<b1>')` in `cond-add.e2e.ts` (type with focus on "+ Add condition" opens the dropdown) and `test.failing('SC-<b2>')` in the matrix (a control in the Color group clears `color`), re-run tsc/lint/jest and a full e2e. No lifecycle/shots/freeze/parity impact (tests only).

## Drive-by fixes
None.

## Follow-ups
- `docs/initiative-tracker.md:441` says "an outline marks the selected preset"; SC-361 changed it to a check mark (docs drift).
- Double-clicking "Add Condition" opens the window and the second click lands on the backdrop, closing it (probe: 0 windows after `dblclick`); same Obsidian modal behaviour as other DSE modals, not filed.
- Swatch `aria-label` is the hex ("Color #c0392b") while the `title` has the name; an AT user hears hex codes (a11y nit).
- Hand-authored `key: Dazed` (capital) is a custom condition (keys are case-sensitive); picking Dazed then adds a second, lowercase one.
- The mock `getIconIds` has 6 icons, so the 24-icon cap of the picker is not jsdom-covered.

## Reuse for SC-437
- `e2e/driver/conditions.ts`: `openFrom(root, row)`, `openConditionsModal(note, row, block)`, `addByKeyboard`, `modalRows/modalNames`, `menuOptions`, `pressedIn(group)`, `iconChoices`, `focusedOption`, `noteCondition`, and `trackerIcons(row, block)` (reads the tracker row's condition icons, `.dse-init__conditions .dse-cond`; the tracker's own condition icons and its "Remove condition" buttons carry NO control id yet: SC-437 territory). `ROW_NTH`: hero = first `init.cond.add`, creature = second.
- Fixtures `Initiative/conditions.md` (conditions in every form), `Initiative/two-trackers.md` (two blocks). `Initiative/tracker.md` rewrites hero conditions as `{ key }` objects; instances 2/3 get `conditions: []` on the first creature write.
- Gotchas: Steel theme upper-cases titles (read `textContent`); a list rebuilt after a pick makes a held `modal.control(...)` stale (re-resolve it); `expect($$()[n]).not.toBeExisting()` throws "Index out of bounds" (read page-side); `openNote` resets fixtures, so wrap the click and leave, not `openNote`, in `expectNoWrite`; backdrop clicks need `{ inset: 5 }`; `input[type=color]` is opacity 0 (keyboard only); re-render from the note with `previewMode.rerender(true)` plus a `__old` marker on the old roots (N06).
- ConditionsPanel host (`src/elements/conditions/panel.ts`, hero sheet / ds-conditions) opens the same modal; no reach rows here, it is another host (its Done/defer-persist wiring is separate: SC-186 HIGH-4).
- Reach row dedupe: `init.cond.add` is stamped on both rows; the gate cannot tell hero from creature, the specs do (O01/O02, A07, C02).

## Gate logs (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-impl-r1-a1/`)
Rebased head `cdd15469` (base `10db67e3`):
- tsc `tsc-b.log` rc 0; lint `lint-b.log` rc 0.
- jest `jest-full2.log`: Tests 1 skipped, 6866 passed, 6867 total; Suites 259 passed (1 skipped). Census file alone `jest-census.log` 17/17; matrix `jest-m2.log` 271/271.
- lifecycle `lcb-p1.log` 21/21, `lcb-p2.log` 16/16, `lcb-p3.log` 9/9, `lcb-p4.log` 4/4, `lcb-p5.log` 2/2 = 52/52.
- e2e `e2e-full2.log`: `OBSIDIAN-E2E done: 212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`, rc 0 (known-bugs: SC-257, SC-384, SC-355, SC-572).
- shots `shots-b.log` rc 0, 592 PNGs, 0 FAIL, `button host-leak OK (163 button kinds ... = 978 comparisons`, `capture clip OK (147`.
- freeze `freeze-b.log`: `freeze OK (280/280 frozen print PNGs byte-identical`.
- parity `parity-b.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 (ran last).
Pre-rebase runs on `2ee2e405` (superseded): `jest-full1.log` (6859 passed, only the SC-568 twin-reuse timeout; `jest-two.log` both suites alone 71/71), `lc-p1..p5b.log` (52/52; the first G-S59 run `lc-p5.log` failed with its "environment" wording at load 22-26, passed at load 5 in `lc-p5b.log`), `e2e-full1.log` (one failure, CENSUS-07 asserting `cond.icon-search`, fixed in `cdd15469`). A shots run started before the rebase was killed by literal PID (it read the old base).
e2e probe runs `e2e-probe1..6.log`, `e2e-open1/add1/ed1/int1/int2.log`.

---

# r1b (2026-11-10): markers for SC-580..583, the two folds, closing gates

Head `c7489d2b` (on origin/develop `10db67e3`, fetched again: unchanged, no rebase). One commit: `test(SC-436): markers for SC-580, SC-581, SC-582, SC-583 and jsdom coverage of the icon picker's 24-match cap` (its body also carries the `docs(SC-436)` line). Only `test/dom/views/conditions-modal-matrix.test.ts` and `docs/initiative-tracker.md` changed; no `src/`, no e2e. Shots/freeze/parity not rerun (nothing that renders changed).

**Markers** (all jsdom `test.failing`, in the matrix file's "known bugs" describe; each run as a plain test first, failing at the stated assertion)
| Ticket | Test | Fails today at |
|---|---|---|
| SC-580 | typing a letter (keydown `d` at "+ Add condition") opens the dropdown. jsdom reproduces it: no window-level key handler, so no e2e marker is needed | `.dse-condal__input` Received: null (setup asserts it is null first) |
| SC-581 | fix-agnostic: clicks every button of the Color group in turn (including the pressed swatch); passes if any emission drops `color` | `cleared` Expected: true, Received: false (setup: at least 5 buttons) |
| SC-582 | each preset swatch's `aria-label` contains the name in its `title` (setup asserts the titles are Red/Amber/Green/Blue/Purple) | Expected substring "Red", Received "Color #c0392b" |
| SC-583 | with `key: Dazed` present, picking Dazed leaves exactly one dazed (case-insensitive) | Expected length 1, Received length 2 (`["dazed","dazed"]`) |
The SC-583 marker reads the window's emitted list (the jsdom stand-in for the written note).

**Folds**
- `docs/initiative-tracker.md:441`: "an outline marks the selected preset" -> "a check mark marks the selected swatch".
- 24-icon cap: a describe with `getIconIds` spied (30 icons) in the matrix: 30 matches show 24 + "Use default" + the "Showing the first 24 matches" note; fewer than 24 show no note and broadening re-caps; "No matching icons."; a pick among capped matches keeps the query and the note. Matrix file now 279 tests (271 + 4 caps + 4 markers).

**Gates** (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-impl-r1-a1/`)
- tsc `tsc-c.log` rc 0; lint `lint-c.log` rc 0.
- jest `jest-full3.log`: Tests 1 skipped, 6874 passed, 6875 total; Suites 259 passed (1 skipped); 0 failed. Plain-run of the markers: `jest-scratchb.log`.
- e2e `e2e-full3.log`: `OBSIDIAN-E2E done: 212/216 ok, 0 failed, 4 known-bug, coverage: 132/132 pairs`, rc 0 (run on a loaded host, 20-31; no flake).
- Lifecycle, shots, freeze, parity: unchanged from r1 on the same base (`lcb-p1..p5.log` 52/52, `shots-b.log`, `freeze-b.log` 280/280, `parity-b.log` 0/0/24).

---

# r3 (2026-11-10): fix round from the r2 review

Rebased onto origin/develop `f69b8fd6` (SC-556; clean, no package.json change). Head `253ffa3d`. Commits: `48290138` test(SC-436): r3 fold of review MEDIUM-1, LOW-1..3, INFO-1/2, SC-587 title; markers for SC-585 and SC-586; SC-580 moves to an e2e knownBug, and `253ffa3d` (the SC-580 marker presses the key page-level; the first full e2e run failed the coverage gate on `cond.add x press:d`, fixed). No `src/` change.

**Folded**
- MEDIUM-1: the jsdom SC-580 `test.failing` is deleted; `knownBug('SC-580', '[COND-N07] …')` in `cond-integrity.e2e.ts` (real Obsidian: focus asserted on `cond.add`, a page-level `d`, expects `cond.input` to exist; `failsWith: /cond\.input.*to be existing/s`). It presses page-level (`dse.press('d')`), so no pair is credited.
- LOW-1: the already-selected swatch is filtered out of the plain colour table (`others`); its own two plain rows (preset, upper-case preset) are titled `… [current behaviour — SC-581 may change this]`.
- LOW-2: swatches are found by hex from the `title` (`Red (#c0392b)`): matrix `swatch/pickSwatch/pressedSwatches`, e2e `pressedSwatches()` in `driver/conditions.ts` (used by D01, D09, N06, D17). Only the SC-582 marker reads the aria-label.
- LOW-3: `[COND-D17]` plain e2e, no `dse.press`/`dse.click` on the input (nothing recorded for `cond.color-custom`): Tab to it, page-side `input` + `change` with `#123456`; asserts one write, `{ key: 'hexed', color: '#123456' }`, `data-selected` on the pipette, aria-label `Custom condition color #123456, selected`, focus on the input, no preset swatch pressed. D11 kept.
- INFO-1: X08 retitled "… with no further write …". INFO-2: manifest row citations now name the real scenarios (D02/D04 icon, D05/D08 duration, D09/D10 swatch, D11 colour, D12/D16 effect, A04 option, header explains D vs the pilot's COND-E01..E07). SC-587: X07 title ends `[current behaviour — SC-587 may change this]`.
- New jsdom `test.failing` markers, each run as a plain test first and failing at the stated assertion (`jest-scratchc.log`): SC-585 (keyboard-removing the last condition with the Add dropdown open: `document.activeElement` is `<body>`), SC-586 (a) `color: teal` (input value Received `#ffffff`, Expected `#008080`), SC-586 (b) `icon: ""` ("Use default" not pressed). Matrix file now 281 tests.

**INFO-5: reuse caveats for SC-437** (`e2e/driver/conditions.ts`): `ROW_NTH` (hero = 1st `init.cond.add`, creature = 2nd) assumes exactly one hero row; `noteCondition` hard-codes `heroes[0]` and `enemy_groups[0].creatures[0].instances[0]`; `trackerIcons` reads Reading view only. SC-437 should generalise them (row by name, instance by id) rather than copy them.

**Gates on the rebased head** (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-impl-r1-a1/`)
- tsc `tsc-e.log` rc 0; lint `lint-e.log` rc 0.
- jest `jest-full4.log` (run at `48290138`; the last commit is e2e-only): `Tests: 1 skipped, 6920 passed, 6921 total`; `Suites: 1 skipped, 259 passed`; 0 failed. (Baseline 6634 on a fresh worktree; mine has the css cached from shots.) Matrix alone `jest-m3.log` 281/281.
- lifecycle `lcc-p1.log` 21/21, `lcc-p2.log` 16/16, `lcc-p3.log` 9/9, `lcc-p4.log` 4/4, `lcc-p5.log` 2/2 = 52/52.
- e2e `e2e-full5.log`: `OBSIDIAN-E2E done: 213/218 ok, 0 failed, 5 known-bug, coverage: 132/132 pairs`, rc 0 (known-bugs SC-257, SC-384, SC-580, SC-355, SC-572). `e2e-full4.log` = the run that failed the coverage gate on `cond.add x press:d` (213/218, 0 failed), fixed in `253ffa3d`. Element run `e2e-el4.log` 49/53, 4 known-bug.
- shots `shots-c.log` rc 0, 592 PNGs, 0 FAIL, `button host-leak OK (163 button kinds × 3 states … = 978 comparisons`, `capture clip OK (147`.
- freeze `freeze-c.log`: `freeze OK (280/280 frozen print PNGs byte-identical`.
- parity `parity-c.log` (ran last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

---

# r5 (2026-11-10): LOW-r4-1 / INFO-r4-1 folds, then the rebase onto SC-437

**Folds** (commit `test(SC-436): r5 the SC-586a marker stubs a canvas …`; no `src/` change)
- LOW-r4-1: the SC-586a jsdom `test.failing` stubs `HTMLCanvasElement.prototype.getContext` (`jest.spyOn`, `mockRestore` in `finally`) with a 2D context whose `fillStyle` setter resolves `teal` to `#008080`. Still fails today for the stated reason (plain run `jest-scratchd.log`: Expected "#008080", Received "#ffffff"). Sanity: with a scratch canvas-based fix in `ConditionsModal.ts` (reverted with `git checkout`, never committed) the marker reports "Failing test passed even though it was supposed to fail" (`jest-canvasfix.log`), so a canvas fix flips it as well as a lookup-table fix.
- INFO-r4-1: `e2e/manifest/conditions-modal.ts` section comment says D (not E); the colour-input comment now says D11 drives the Enter and D17 dispatches the chooser's commit page-side in real Obsidian.
- On `f69b8fd6` before the rebase: tsc/lint rc 0; jest 1 failed (the SC-568 `twin-reuse` timeout at load 25) with the two suites alone 78/78 (`jest-two2.log`); e2e `213/218 ok, 0 failed, 5 known-bug, coverage: 132/132 pairs` (`e2e-full6.log`).

**Rebase onto origin/develop `32441332` (SC-437)**, head `HEAD` below. Conflicts and resolutions:
1. `e2e/README.md` fixture table (textual): SC-437's `Initiative/rich.md` and `captain.md` rows vs my `conditions.md` and `two-trackers.md` rows. Kept all four.
2. `init.cond.add`: SC-437 did NOT redefine it (its manifest comment says the reach row stays in `manifest/conditions-modal.ts`), so there is one definition, mine; it also stamps the new `init.cond.remove` on the tracker's condition icons. No manifest edit needed.
3. `[CENSUS-07]` (semantic, found by the runner's duplicate-id check, exit 2): SC-437 also named a census test CENSUS-07 (title editor + captain squad). Mine renamed to `[CENSUS-09]` (commit `test(SC-436): rename the Conditions census to CENSUS-09 …`). My census body is unchanged and passes alongside SC-437's tracker-root scoping.
4. `e2e/driver/conditions.ts`: SC-437 added no duplicate helper (no tracker-row condition read in `driver/`), so `trackerIcons` stays. `src/`: auto-merged cleanly (SC-437's `view.ts` ids plus my five `ConditionsModal.ts` attribute lines); no src conflict, so shots/freeze/parity/lifecycle were not rerun.

**Gates on the rebased head** (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-impl-r1-a1/`)
- tsc `tsc-h.log` rc 0; lint `lint-g.log` rc 0 (run before the CENSUS-09 rename, which is a title-only edit; tsc re-run after it).
- Census suites + matrix alone `jest-cens2.log`: 307/307 (`test/dom/e2eCensus.test.ts` + `conditions-modal-matrix.test.ts`).
- jest full `jest-full6.log`: `Tests: 1 skipped, 7050 passed, 7051 total`; `Suites: 1 skipped, 260 passed`; 0 failed (baseline 6765 + 285).
- e2e full `e2e-full9.log`: `OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`, rc 0 (known-bugs: SC-257, SC-384, SC-580, SC-355 from this ticket; SC-577, SC-578, SC-588, SC-576 x2, SC-575, SC-572 from the others). Coverage 142 + 19 = 161, no dedupe. Earlier runs: `e2e-full7.log` exit 2 on the duplicate CENSUS-07 id (fixed); `e2e-full8.log` `248/260 ok, 1 failed, 11 known-bug, coverage: 161/161 pairs`, the one failure RECOV-R07 (the SC-517 load flake, load 27-29), green on the rerun at load 11 (`e2e-full9.log`).
