# SC-408 pilot round P2a: report

**Executive summary**
1. Verdict DONE. DSE branch `sc408-functest` head `07d9f4a` (6 commits on P1's `4464180`; `origin/develop` still `be4f002`, no rebase). Superproject docs commit `85216b6` (dse-verify skill, in `worktrees/sc408-functest/.claude/skills/`; submodule pointer NOT committed). Nothing pushed.
2. `npm run e2e` full run: **67 scenarios = 60 ok + 7 known-bug, 0 failed, coverage 47/47 pairs**, exit 0. Wall **32.3 / 32.4 / 32.8 / 32.4 s** on 4 shards (4 identical runs, 0 flakes); **90.8 s** with `--shards=1`.
3. Known bugs reproduced in real Obsidian (7 markers): SC-426 B2 (initiative detail row stale after a cell edit, confirmed under adoption), SC-427 x3 (B3 label, B9 `1e3`, B10 Reset keeps the box), SC-428 x2 (B4 Catch Breath at full, B15 popover Catch breath), SC-430 B7. B5 and B6 pinned as current behaviour.
4. Escape findings: **a dirty-draft Escape closes the WHOLE modal** and discards the edit (the stepper's swallow-the-key intent does not hold in Obsidian); clean Escape, X and backdrop all close without writing; Escape closes only the top of two stacked modals; an external edit closes an open modal and is never overwritten.
5. Gates: tsc clean (incl. `e2e/`), lint clean, jest **4461 passed / 2 skipped / 221 of 222 suites** (P1 4451 + 8 census + 2 kit-hygiene cases for the new kit file, 0 failures), lifecycle **25/25** (254.5 s), shots **568 PNGs, 0 FAIL**, freeze **274/274 OK**, parity **0 GAPs / 0 undeclared / 24 declared**. Control ids moved no frozen shot by a byte.
6. The three coverage checks each bite (proofs below): jsdom census (un-id'd button -> 2 red), real-Obsidian census (un-id'd button and an un-id'd div listener -> red), exercised-set gate (a removed click -> exit 1 listing `sedit.temp.dec x click-disabled`).
7. New suspected bugs: N1 dirty-draft Escape closes the modal (LOW-MED), N2 a Recoveries marker click leaves keyboard focus off the marker row (LOW). Details below.

## Commits
DSE (`draw-steel-elements`, branch `sc408-functest`):
- `9cffc66` control ids on kit factories + the pilot surfaces (attributes only)
- `9da48d9` manifests, driver additions, fixture notes, stamina-modal scenarios
- `7a22a48` Recoveries strip / Catch Breath / popover / Spend Recovery scenarios
- `05374c7` initiative stamina entry-point scenarios
- `1d5bdb8` census (jsdom + real) and the exercised-set gate
- `07d9f4a` docs: `e2e/README.md`, `AGENTS.md` bullet, `.repo-docs/{development,index}.md`
Superproject worktree: `85216b6` `docs(SC-408): dse-verify battery step 4b ...` (`.claude/skills/dse-verify/SKILL.md` only).

## Control ids (all `data-dse-control`, attribute only)
Kit option `control?: string` on `iconButton`, `stepper` (stamps `<id>.dec|.input|.inc`, or `.value` when not editable), `renderStaminaBar`; `stampControl()` in new `src/framework/kit/controlId.ts` for raw nodes.
- Modal `sedit.*`: `apply-amount`, `damage`, `healing`, `stamina.dec|input|inc`, `temp.dec|input|inc`, `kill`, `full-heal`, `spend-recovery`, `reset`, `apply`. Host (driver-resolved from Obsidian's selectors, not stamped): `modal.close` (X), `modal.backdrop`.
- Bar: `stamina.bar`, `recov.markers` (the slider row), `recov.marker` (each pip, click target), `recov.catch-breath`, `recov.pop.dec|inc|catch-breath`, `undo.action` (toast).
- Initiative: `init.hero.stamina`, `init.hero.bar`, `init.detail.stamina`, `init.detail.bar`, `init.cell.stamina` (the roster cell button: click selects, dblclick edits).
Changed files: `iconButton.ts`, `stepper.ts`, `StaminaBarPanel.ts`, `RecoveriesStrip.ts`, `undoNotice.ts`, `kit/index.ts`, `StaminaEditModal.ts`, `stamina-bar/view.ts`, `initiative/view.ts` (+ `controlId.ts`). Kit files shared with ds-hero / the pool modal get the ids too (same widgets); no pixel, class or text changed (shots and freeze prove it).

## Manifests (`e2e/manifest/`)
`surface.ts` (pure data + helpers, read by run.mjs through tsx's `tsImport`, by jest, and by the real census), `stamina-edit-modal.ts` (16 controls + 5 initiative `reach` entries), `stamina-bar.ts` (8 controls). **47 (control, kind) pairs.** Kinds: `click`, `click-disabled`, `dblclick`, `type`, `blur`, `press:<Key>`. Each control is annotated with the S1 inventory rows it covers (E07-E11/E20/E21, M02/M07, A01-A18, S01-S14, T01-T10, Q01-Q13, F01-F07, R01-R09, W01/W03/W08, K03).

## Scenarios (67 in 5 spec files + census)
- `specs/stamina-bar/stamina-modal.e2e.ts` (22): STAM-E01 D01 D02 D03 D07 D08 D09* H01 A16 A18 Q01 Q04 T01-T05 T09 T10 F03 F05 F06*
- `specs/stamina-bar/stamina-modal-stepper.e2e.ts` (16): S01 S02 S03 S04 S05 S08* S13* S13b S14, S06 S07 F07a/b/c, W08, K03
- `specs/stamina-bar/stamina-recoveries.e2e.ts` (16): RECOV-R01 R02a R02b R03* R06 W03 R04 R05, STAM-Q06 Q08 Q09 Q10 Q13, popover pref on: RECOV-R07 R09 R08*
- `specs/initiative/stamina-entry.e2e.ts` (8): INIT-STAM-E07 E08 E09 E10 E21 E11 E20 B2*
- `specs/_census.e2e.ts` (5): CENSUS-01..05 (67 = 22 + 16 + 16 + 8 + 5)
(* = known-bug.) Per-test setup inside each test (`openBarModal`, `openNote`); no `beforeEach` anywhere.
S1 section 4 list: B7 (SC-430, S13/S13b); Escape semantics (S06 S07 F07a/b/c); end-to-end edit per host (D01.. for the bar, E07-E10 for initiative, each asserted against the note); B2 under adoption (INIT-STAM-B2: the write is right, the cell repaints, the detail readout stays stale after write-idle); real double-click with a selection write between (E20: modal opens for the dblclicked instance, stays open across the selection write, edits that instance only); steel bar hit-testing (E21: `elementFromPoint` at the bar centre is `init.detail.bar`, then a real press opens the modal); external edit while open (W08); stacking (K03).
Not covered by e2e (left to jsdom / out of the pilot): W02 two Applies inside one 400 ms debounce (two full modal round trips cannot fit in the window reliably; jsdom P43 pins coalescing), E02/E17 read-only contexts, M08 layout (camera), PM* pool modal, ds-hero rows (SC-425).

## The three checks bite
- (a) jsdom census (`test/dom/e2eCensus.test.ts`, 8 tests incl. a self-test): temporarily added an un-id'd `iconButton` to the modal -> **2 failed** (`no data-dse-control: <button class="dse-btn"> Rogue`), reverted. Evidence `/tmp/claude-1000/sc408-p2a/evidence/bite-jsdom-census.log`.
- (b) real census (`e2e/specs/_census.e2e.ts` + `driver/census.ts`, CDP `DOMDebugger.getEventListeners`): the same un-id'd button -> CENSUS-02 red (`no data-dse-control: <button class="dse-btn"> "Rogue" listens for click`); an un-id'd `div` with a click listener (invisible to the jsdom census by design) -> CENSUS-01/04/05 red (`<div class="dse-stamina__num"> ... listens for click`). Both reverted. Evidence `evidence/bite-real-census-CENSUS-02/`, `evidence/bite-real-census-div-CENSUS-01/`.
- (c) exercised-set gate (`run.mjs`): commented out the single click that covers `sedit.temp.dec x click-disabled` -> full run **exit 1**, `done: 60/67 ok, 0 failed, 7 known-bug, coverage: 46/47 pairs`, `coverage gate FAILED: 1 manifest pair(s) were exercised by zero tests: sedit.temp.dec x click-disabled`. Reverted. Evidence `evidence/bite-gate-exercised-set.log`. The gate also fails on a driven pair in no manifest (it caught a missing `sedit.stamina.input x click` while I built it). `--only` / `--element` print `coverage: X/Y pairs (partial run: gate skipped)`.

## Escape / close semantics, as recorded in real Obsidian (app 1.14.4, Chrome 150)
- Escape with a dirty Stamina draft (typed, not committed): the modal closes immediately, draft discarded, no write (S06). `stepper.ts` swallows the key "so a containing modal doesn't close on the SAME press" and a jsdom test pins that; Obsidian's modal Scope closes it anyway. **N1.**
- Escape with a clean draft, with a pending Damage edit, the X button, and a click on the backdrop: each closes the modal and writes nothing; note unchanged (S07, F07a-c).
- Two stacked modals (second opened by a synthetic click, since the first's backdrop covers the bar): Escape closes only the top; the second Escape closes the other; no write (K03).
- External edit while a modal with a pending edit is open (W08): the modal closes by itself when the view is rebuilt, the bar shows the external value, and nothing from the modal is written.
- Initiative numeric stamina controls are not pointer-clickable under the Steel theme (stood down visually, "did not become interactable"): keyboard (Tab + Enter) or the row bar only. By design per `buildRowStamina` comments; scenarios use that path.

## Findings on the pinned open questions
- B5 (STAM-Q13): on a bar without recoveries fields (2/30) three Spend Recovery presses show "Gain 28 Stamina"; Apply writes 30 and no `recoveries` key. Pinned `[current behaviour — ruling pending SC-408]`.
- B6 (STAM-T04): the temp "-" at temp 5 is enabled and does nothing. Pinned with the same suffix.
- Also pinned as current behaviour (no ruling needed, S1 "observations"): Enter in the Apply box does nothing (A16); Full Heal discards temp (Q04).

## NEW suspected bugs (not in S1)
- **N1 LOW-MED: Escape on a dirty draft closes the whole modal and loses the pending edit.** Steps: open the stamina modal, type `12` in the Stamina field, press Escape. Expected (per `stepper.ts` comment and jsdom test): the draft reverts and the modal stays open (a clean Escape closes it). Actual: the modal closes, everything pending is lost. Test: `[STAM-S06]` pins current behaviour. Fix direction: handle Escape at the modal's own Scope, not only on the input.
- **N2 LOW: clicking a Recoveries marker does not focus the marker row.** Steps: click any marker, press ArrowRight / Home / End (or Escape with the popover open). Expected: the slider row is focused and responds (SC-132 "ONE keyboard value control"). Actual: focus stays on the note (`document.activeElement` is `.markdown-preview-view`), keys do nothing until the user Tabs to the row (Tab after the click lands on the chrome button first). RECOV-R05 / R09 Tab to the row first and say so.
- Observation (not filed): the stamina and temp numeric controls in initiative are keyboard-only under Steel (above).

## Deviations from the brief
- Initiative numeric controls are reached by keyboard, so their manifest kind is `press:Enter` (not `click`); the row bars carry the pointer path (`init.hero.bar`, `init.detail.bar` click).
- `recov.marker` ids are stamped on each pip (they are the click targets, but plain non-interactive divs; the row has the role/tabindex). Adds one manifest row.
- Popover scenarios need a preference: `dse.setPrefs` writes `data.json` and reloads the plugin (`disablePlugin`/`enablePlugin`); a spec-level `before`/`after` sets and restores it. (Prefs are not reachable from the page otherwise.)
- Ticket keys used: SC-426, SC-427 (B3, B9, B10), SC-428 (B4, B15), SC-430. B8 (hand-edited out-of-range YAML) and B16 not encoded (no shipped-UI path / low value).
- Test ids with two hyphens (`INIT-STAM-E07`) required widening the id regex in `driver/state.ts` and `run.mjs`.
- Fixture notes added under `vaults/shipped/`: `Stamina/{recoveries,recoveries-full,recoveries-zero,dying,legacy-low}.md`, `Initiative/tracker.md`.
- `--element` also accepts a top-level spec file (`--element=_census`).

## Gates, raw numbers (logs in `/tmp/claude-1000/sc408-p2a/`)
- tsc `gate-tsc.log` clean; lint `gate-lint.log` clean.
- jest `gate-jest.log`: 221 of 222 suites passed (1 skipped), **4461 passed / 2 skipped / 4463 total**; load 2.9 at start; 42 s.
- lifecycle `gate-lifecycle.log`: `done: 25/25 ok, 0 failed`, 4m14.5s.
- e2e `gate-e2e-1..4.log`: all `done: 60/67 ok, 0 failed, 7 known-bug, coverage: 47/47 pairs`, rc 0, 32.3 / 32.4 / 32.8 / 32.4 s; `gate-e2e-shards1.log`: same line, 90.8 s serial (5 sessions). Run from the workspace-root devbox shape (Node 24.4.1); P1 already proved Node 20.11.1.
- shots `gate-shots.log`: 7m31s, 568 PNGs, no FAIL lines (button host-leak 112 kinds / 672, input 14 kinds / 164, print-twin delta OK across 141 ids).
- freeze `gate-freeze.log`: `freeze OK (274/274 frozen print PNGs byte-identical ...)`.
- parity `gate-parity.log` (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Evidence
- `/tmp/claude-1000/sc408-p2a/evidence/`: `known-bug-{STAM-S13,STAM-S08,STAM-D09,STAM-F06,RECOV-R03,RECOV-R08,INIT-STAM-B2}/` (full failure bundles: screenshot, DOM, note diff, events; `known-bug-INIT-STAM-B2/screenshot.png` shows cell 50/60 beside a stale 60/60 detail row), `bite-*` (census / gate bite proofs), `coverage.json`, `manifest/`.
- Exploration traces for the Escape findings: `explore.log` in the same dir (`[EXP-1..6]`).

## Drive-by fixes:
- `.repo-docs/development.md` Testing section said "Jest is configured but no test files exist yet" (there are 4400+); replaced with accurate Jest / `npm run e2e` / lifecycle lines. File already touched for the e2e pointer; obviously correct; baseline-neutral.

## Follow-ups:
- File N1 and N2 above (steps, expected vs actual given).
- Pool modal (PM rows), ds-hero rows (SC-425) and read-only contexts are rollout; the control-id kit option already covers the shared widgets.
- `e2e/.out` retention (12 runs) prunes bundles quickly in heavy sessions; evidence was copied out.
- Two small things noticed, left alone: the framework chrome toolbar (`[data-dse-chrome-item]`) is excluded from both censuses as a separate surface; it needs its own manifest if chrome gets e2e coverage.
