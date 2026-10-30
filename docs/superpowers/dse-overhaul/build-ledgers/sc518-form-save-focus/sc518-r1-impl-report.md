# SC-518 r1 implementation report (implementer B1)

## Executive summary
- STATUS: DONE. Base `ed368f6` (rebased from c558759 on the owner's request; red-proof ran against c558759 source, which ed368f6 does not touch).
- Commits (dse branch `sc518-form-save-focus`): red `958932e`, fix `88ced3f`, lifecycle `6386a8f`; superproject CHANGELOG `76d68d5` (pointer NOT bumped).
- Measured on c558759 in real Obsidian 1.15.0: focus lands on `<body>` after a form Save in Reading view (keyboard and mouse), the sidebar panel and Live Preview. All three surfaces fixed with ONE mechanism (the SC-505 focus hand-off, `chrome/focusHandoff.ts`); nothing deferred.
- Gates on final HEAD: tsc/lint clean; jest 6130 passed / 1 skipped / 248 of 249 suites; lifecycle 40/40; e2e 124/124 (one CHR-L01 flake on the first run, clean re-run); shots 592, 0 FAIL, host-leak 145/870; freeze 280/280; parity 0/0/24.
- G-S50 fails on the c558759 bundle (body on 5 of 6 phases) and passes on the fix.

## 1. Measurement (c558759 bundle, G-S50 as the probe, real Tab/Enter via CDP, run twice)
Focus after Save, 1.5 s after the card showed the new content (also `body` at the first read):
| Surface | Input | Focus after Save |
|---|---|---|
| Reading view, montage (Tab x5 to pencil) | keyboard | `<body>` |
| Reading view, stamina bar (Tab x2) | keyboard | `<body>` |
| Reading view, montage | real mouse (hover, click pencil, click Save) | `<body>` |
| Sidebar panel, montage (Tab x4) | keyboard | `<body>` (panel root is redrawn in place; only the chrome panel and its pencil are new; old pencil detached) |
| Live Preview, stamina bar (Tab x2) | keyboard | `<body>` |
| Reading view Cancel (keyboard) | keyboard | same pencil, same root, ring on (unchanged; pinned) |
Evidence: `sc518-r1-gs50-base-c558759-run1.log`, `sc518-r1-gs50-base-c558759-final.log`.

## 2. What changed
- `src/framework/chrome/focusHandoff.ts`: reused the SC-505 request table. Request gains `label` (accessible name of the opener) and `ring`. New `formOpenerOf(evt)` (reads `currentTarget` + `detail === 0` at click time) and `armFormFocus(blockKey, opener)`. Claim lookup order: control with the opener's `aria-label` owned by this element root (`closest('[data-dse-element]') === root`, so a nested card's same-named button is not taken), else the chrome `edit` item, else the card (`tabindex=-1` set only when it is actually focused). `focusControl(el, ring)`: keyboard open -> `{preventScroll, focusVisible:true}`; mouse open -> `{preventScroll}` (no ring forced).
- `src/authoring/FormModal.ts`: constructor/`openFormEditor` take an optional `opener`; `save()` arms before the write (only if the body differs from the source, so a no-op Save arms nothing) and `settleChromeFocus(key, null, ok)` after (a failed write disarms; success shortens the lapse).
- `src/framework/pipeline.ts`: `openForm(evt)` passes the opener; elements without a chrome panel (`ds-roll`, horizontal rule) call `claimChromeFocus` after `mountPipelineChrome` (chrome elements already claim in `mountChrome`).
- `src/elements/hero/view.ts`: "Edit definition" opens the SAME `openFormEditor`/schema; it now passes its opener, found again by name ("Edit definition"); hero has a chrome panel, so the claim runs in `mountChrome`.
- One-shot scoping: keyed by `host.blockKey()` (twin blocks differ by line), pane/embed scope from the pressed button, focusin guard cancels when the user moves focus, 5 s TTL shortened to 3 s once the write returned, 1.5 s settle after a claim; nothing is written to user files.

## 3. Tests
- Jest `test/dom/framework/formSaveFocus.test.ts` (17 tests, through the registered processor / real SidebarPanel, real pencil, real FormModal, real Save): montage, stamina-bar, roll (non-chrome pipeline branch; mutation-checked: disabling the pipeline claim fails exactly that case), section already in the document, mouse (no focusVisible), twin (twin rebuilt first; twin-only rebuild), sidebar, one-shot (user moved on; hint lapsed), Cancel, Save with no change, failed Save (block moved), note untouched, claim-by-name (non-chrome control, nested same-name button not taken, Edit-pencil fallback, card fallback). Plus 1 in `test/dom/elements/heroSheet.test.ts` (hero passes its opener, keyboard flag both ways).
- Red against c558759 source: 7 failed / 6 passed (the 6 are pin tests that must stay green: Cancel, no-op Save, twin-only, lapsed hint, failed Save, note untouched). `sc518-r1-jest-red.log`. Green after fix: `sc518-r1-jest-green.log`.
- Lifecycle G-S50 (39 -> 40): Reading view montage + stamina bar, mouse, Cancel, sidebar, Live Preview; asserts pencil focused with `:focus-visible` and outline for keyboard, none for mouse, old root/pencil detached, whole note = fixture with only the value changed, no Notice, no page error. FAIL on c558759 bundle, ok on fix (`sc518-r1-gs50-fix.log`).

## 4. Gates (final HEAD 6386a8f on ed368f6, logs in this dir)
- tsc (incl. e2e) rc 0; lint (incl. e2e) rc 0.
- jest (after shots): `Tests: 1 skipped, 6130 passed, 6131 total`, `248 passed, 248 of 249 total` (expected 6112 + 18 new). Pre-shots read the same.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed` (`sc518-r1-gate-lifecycle-r2.log`).
- e2e: final `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`. Earlier run on the pre-rebase tree (c558759) read 123/124: CHR-L01 timed out waiting for the panel to stay revealed with the pointer on Collapse (known SC-502-area flake under load, load avg ~9; Live Preview hover, unrelated to focus); re-run clean on that tree and again clean on the rebased HEAD. Failure bundle copied: `sc518-r1-e2e-run1-CHR-L01-failure-bundle`.
- shots: 592 PNGs, 0 FAIL; host-copy pin OK; button host-leak 145 kinds / 870; modal 228; input 15 kinds / 176; checkbox 7 / 116; prose 106 [212].
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)` (no rebaseline).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## 5. Docs
- `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/CHANGELOG.md`: one Unreleased bullet (commit 76d68d5). `DESIGN.md` documents no form/chrome focus behaviour (no SC-505 line either), so left untouched.
- Not done (owner/dispatcher): the dse-verify skill's CURRENT block (lifecycle 39 -> 40, G-S50 line) is not updated by me.

Drive-by fixes: none.

Follow-ups:
- Live Preview was fixable with the shared mechanism, so nothing is deferred. Note the mouse path relies on the pencil holding focus at click time; measured fine in Reading view (real mouse) but a mouse-opened form in Live Preview/sidebar is not exercised by G-S50 (keyboard only there).
- A form opened while a pending in-card write delays `openFormEditor` still has its opener captured at click time (good), but G-S45-style delay + Save focus is not covered by a test.
- `tests` for `hero` Save focus are unit-level (opener plumbing + claim by name); no real-Obsidian hero scenario.
