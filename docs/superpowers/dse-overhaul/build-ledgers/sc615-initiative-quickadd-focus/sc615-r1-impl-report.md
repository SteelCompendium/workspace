# SC-615 r1 implementer report

## Executive summary
- STATUS: DONE. dse final sha `8be8ec1d` (branch `sc615-initiative-quickadd-focus`, base `506786cb` = origin/develop, unmoved). Superproject sha `c44158f8` (CHANGELOG only; dse pointer NOT bumped).
- Fix: a read-only document-level capture `pointerdown` listener in the initiative view records, per press, whether focus was inside the tracker; the roster cell's click ORs that into SC-609's check. The shield is untouched.
- Tests: jest F30-F36 (8 tests; 4 red on base: F30 x2, F31, F32); e2e INIT-F17..F23 (7 scenarios; red on base: F17, F18, F20, F22, F23; F19, F21 are the negatives and pass on both).
- Gates on `8be8ec1d`: tsc + lint clean; jest 11907 passed / 2 skipped fresh, 11908 / 1 with the shots cache; lifecycle 64/64 (21+16+9+4+7+4+3); e2e 347/350 ok, 0 failed, 3 known-bug, coverage 176/176 pairs; shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0 GAP / 0 undeclared / 24 declared.
- Live Preview: works (INIT-F22 green on the fix, red on base). Sidebar: works (INIT-F20).
- No drive-by fixes. Follow-ups: none required (one note below).

## Diagnosis (confirmed at `506786cb`)
`armClickShield` (`src/framework/pipeline.ts:196`) runs on the root in the capture phase for `pointerdown`/`mousedown`. For a target that is not an editable control it calls `preventDefault()` and, when the focused element is an editable control inside a DSE root, `active.blur()`. So with focus in the Malice quick-add amount/label (or the title textarea), the pointerdown blurs the box and focus is on `<body>` before the cell's `click`. SC-609's `captureControlFocus(this.rootEl, ...) !== null` (view.ts, cell `onClick`) then sees nothing and hands focus nowhere. Reproduced by jest F30/F31/F32 and e2e F17/F18/F20/F22/F23 red on base (focus state `{ctl:null, cell:null, surface:'body'}`).

## Fix
`draw-steel-elements/src/elements/initiative/view.ts` (commit `79b2606c`):
- field `cellPress` (l.~169): `{ cell, focusInside } | null`, on the view.
- `recordCellPress(root, owner)` (l.~340), called from `onMount` before `buildUI`: `owner.registerDomEvent(root.ownerDocument, 'pointerdown', ..., { capture: true })`. The document is above the root in the capture path, so it runs before the shield's blur. It only reads (`captureControlFocus`), never blurs or focuses. Sets `cellPress` when the target is inside a `.dse-init__cell` of THIS root, else `null`. `owner` is the per-mount Component, so the listener is released with each rebuild (nothing accumulates). `root.ownerDocument` covers popout windows.
- Cell `onClick` (l.~1983): `focusWasInside = captureControlFocus(...) !== null || (!isKeyboardClick(evt) && press?.cell === handle.buttonEl && press.focusInside)`; the record is consumed (`this.cellPress = null`) on every cell click.
- No framework file touched; the shield's blur is unchanged (jest F32 asserts the box still blurs on the press and focus lands on the cell only after the click). SC-458 not touched.

## Tests
Jest, `test/dom/elements/initiative-matrix.test.ts`, describe "a mouse press on a roster cell while a text box of the tracker has focus (the click shield blurs it first)" inside `[F]`. The helper `press` dispatches pointerdown + mousedown + click(detail 1) through the real pipeline root, so the shield's blur runs.
- F30 (x2: amount, label): focus in the box, press selects Ogre #3, cell holds focus, typed text kept. RED on base.
- F31: title textarea open, press commits "Ambush" by the blur and cell holds focus. RED on base.
- F32: shield blur unchanged (blur fires once on pointerdown, focus on body until click, then the cell). RED on base.
- F33: focus on body / in an outside field is not pulled in. Green both (negative).
- F34 (per press): pointerdown on cell with focus in box, no click; then box gone from focus, fresh press from body: focus stays on body. Green both.
- F35: a detail-0 click after such a stale pointerdown never reads the record. Green both.
- F36: pointerdown on cell A, click on cell B: record ignored. Green both.
Base run: 4 failed / 211 passed in the file at `506786cb` src + new tests (log `jest-base-matrix.log`); fix: 215 passed.

E2E (real Obsidian 1.14.4), new file `e2e/specs/initiative/focus-after-cell-press-textbox.e2e.ts` plus one in `focus-live-preview.e2e.ts`; manifest rows updated (`e2e/manifest/initiative.ts`). Ids INIT-F17..F23 checked free on develop (F15/F16 taken; no F17+ anywhere).
- INIT-F17 Reading: click into amount, type 7, real press on cell nth 2 -> detail row "Edit Stamina: Ogre #3", `document.activeElement` is cell `0-3`, amount still 7. Red on base.
- INIT-F18 Reading: amount 2 + label "Feyt", press -> cell holds focus, both boxes kept. Red on base.
- INIT-F19 Reading negative: amount typed, focus moved to `<body>` (start state asserted first), press: focus stays on body, amount kept. Passes on base and fix.
- INIT-F20 sidebar (pinned `Sidebar/initiative-pinned.md`, unrelated note open in the main pane): same as F17. Red on base.
- INIT-F21 sidebar negative: as F19. Passes on both.
- INIT-F22 Live Preview: same as F17 with a 1000 ms hold after write-idle. Red on base (focus `tracker -1`, body), green on fix.
- INIT-F23 Reading, title: click title, type "Night Watch", press cell -> name written, editor gone, cell holds focus. Red on base.
Logs: `e2e-only2.log`, `e2e-base.log`, `e2e-lp.log`, `e2e-lp-base.log`, `e2e-title.log`, `e2e-title-base.log` (all under the scratchpad dir below).

## Text-box survey (editable controls inside the tracker that the shield blurs)
| Text box | Roster press now lands on the cell? | Measured |
|---|---|---|
| Malice quick-add amount (`init.malice.quickadd.amount`) | Yes; typed text kept | Reading F17, sidebar F20, Live Preview F22, jsdom F30 |
| Malice quick-add label (`init.malice.quickadd.label`) | Yes; text kept | Reading F18, jsdom F30 (sidebar/LP not separately run; same code path) |
| Encounter title textarea (`init.title.input`, while editing) | Yes; the blur commits the title, then the cell holds focus | Reading F23, jsdom F31 (sidebar/LP not measured) |
| Malice stepper value | not a text box (`editable` is not set for it: read-only value node) | n/a |
| Modal inputs (stamina, pool, conditions) | outside the tracker root and its click shield; not in scope | n/a |
No other `input`/`textarea`/`select`/`contenteditable` is created in `initiative/view.ts` (grep: l.663 title textarea, l.865/872 quick-add inputs).

## Live Preview
Works: INIT-F22 is green on the fix (cell `0-3` holds focus in the Live Preview tracker, amount stays 7, a second after write-idle) and red on base. SC-602's carry lands on the cell. Only the amount box was measured in Live Preview. The dse CHANGELOG bullet therefore says "Reading view, Live Preview and the pinned sidebar tracker" for the amount/label, and qualifies the title to "in Reading view".

## Per-press (stale record) check
The record is replaced by EVERY document-level pointerdown (a press outside a cell sets it to null), is consumed by the cell click, is ignored for a keyboard/script click (`detail === 0`), and is only honoured when the pressed cell is the clicked cell. Pinned by F34 (down on cell with focus in box, no click, later fresh press from body: stays on body), F35 (stale down + detail-0 click: stays on body), F36 (down on A, click on B: not read). A rebuild between down and click leaves a record naming a detached cell, which cannot equal the new cell (no leak).

## Gate numbers (all on `8be8ec1d`; product code identical to `79b2606c`)
- `npm run tsc` (incl. `tsc -p e2e`): clean. `npm run lint`: clean (only the known `.eslintignore` warning).
- jest (after `rm -f main.js styles.css`): fresh worktree (no shots cache) `11907 passed / 2 skipped` (278 suites passed, 1 skipped); after `npm run shots` cached the css: `11908 passed / 1 skipped`. Base figures 11899/2 fresh and 11900/1 cached, +8 new tests = as measured.
- lifecycle 64/64 in seven parts: p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7 (G-S91 ok), p6 4/4 (G-S97 ok), p7 3/3 (G-S115 ok). No re-runs.
- e2e `OBSIDIAN-E2E done: 347/350 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (+7 scenarios: INIT-F17..F23; no new pairs).
- shots: 592 ok, host-leak 163 button kinds/978, modal host-leak 40/240, capture clip 147. freeze: `freeze OK (280/280 ...)`. parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Artifacts
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc615-r1-impl/` : `gate-tsc.log`, `gate-lint.log`, `gate-jest-fresh.log`, `gate-jest-cached.log`, `lc-part1.log` .. `lc-part7.log`, `gate-e2e.log`, `gate-shots.log`, `gate-freeze.log`, `gate-parity.log`, `jest-base-matrix.log`, `jest-fix-matrix.log`, `e2e-*.log`.
- Commits: dse `79b2606c` (fix + jest F30-F36), `06648f77` (e2e INIT-F17..F22 + manifest), `8be8ec1d` (INIT-F23 + dse CHANGELOG, also deletes SC-609 bullet's "Not covered: ... (SC-615)" line). Superproject `c44158f8` (workspace CHANGELOG bullet).
- `npm ci` was needed in the fresh worktree (no `node_modules`); nothing tracked changed.

Drive-by fixes: none (the removal of the SC-609 CHANGELOG "Not covered ... (SC-615)" line is part of this ticket's CHANGELOG work, since this ticket closes that gap).

Follow-ups: none required. Notes: (1) the quick-add label/title were not separately measured in Live Preview or the sidebar (same code path as the amount, which was); (2) the existing comment in `focus-after-cell-press.e2e.ts` (INIT-F14) and jest F21/F22 still say SC-458 flips them; unchanged and still true.
