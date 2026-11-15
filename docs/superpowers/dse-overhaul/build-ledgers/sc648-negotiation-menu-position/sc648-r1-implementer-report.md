# SC-648 r1 implementer report

## Executive summary
- STATUS: DONE. plugin branch `sc648-negotiation-menu-position` head **544fd4e0** (on develop 09c879f2); superproject CHANGELOG commit **64b43026** (no submodule pointer bump committed).
- Fix: `src/elements/negotiation/view.ts` options-button onClick: `isKeyboardClick(event)` (reused from `framework/chrome/focusHandoff.ts`) -> `m.showAtPosition({ x: rect.left, y: rect.bottom }, button.ownerDocument)`; mouse path unchanged (`showAtMouseEvent(event)`).
- Form chosen: no `width` (adding `width: rect.width` made Obsidian shift the menu right by that width, off the button; measured). No `overlap`/`left`.
- Tests: jest +2 (13319 passed / 2 skipped); e2e flipped NEGO-R06 to a plain test and added NEGO-R07 (Space), NEGO-R08 (mouse click regression), NEGO-L06 (Live Preview Enter); manifest gained `press:Space` on `negotiation.menu`.
- Gates: tsc + lint clean; jest 13319/2; lifecycle 64/64 (7 parts); e2e `595/611 ok, 0 failed, 16 known-bug, coverage: 417/417 pairs`; styles.css sha identical to baseline, so shots / freeze / parity carry.
- Follow-up found (not fixed): a menu opened with Space ignores its FIRST Escape about 4 times in 10 (same on the base 09c879f2).

## Fix
`view.ts` (inside the `iconButton(... control: 'negotiation.menu' ...)` onClick). Button is `event.currentTarget` (cast, not `instanceof`, because a popout window has its own `HTMLElement`). Items of the menu untouched.

Measured placement (Reading view, 1440x1100, button left 1179 / right 1203 / bottom 299): menu left 1181, top 301 (Obsidian adds ~2 px). With `width: 24` the menu was at left 1203 (= button right), so `width` was dropped.
Edge case probed with a throwaway spec (button forced past the window's right edge): Obsidian flips the menu to end at x-2 (left of the anchor), still on screen; also clamps at the bottom. So no extra handling needed. Window resize is not possible in the e2e session (`Browser.getWindowForTarget` unsupported), so this was done by moving the button with CSS; not committed.

## Tests
- jest `test/dom/elements/negotiation.test.ts`, new describe "SC-648": `detail: 0` click -> `showAtPosition({x:1179,y:289}, button.ownerDocument)` and no `showAtMouseEvent`; `detail: 1` click -> `showAtMouseEvent(click)` and no `showAtPosition`. Spies on `Menu.prototype` (no mock change). Verified red on base (keyboard test fails, mouse test passes).
- e2e `reset.e2e.ts`: NEGO-R06 plain (Enter, tightened: menu left/top within 6 px of the button's left/bottom, or flipped; inside the window); NEGO-R07 (Space, same); NEGO-R08 (mouse click: menu corner at the click point, button centre). `live-preview.e2e.ts`: NEGO-L06 (Live Preview Enter). Driver helpers `menuPlacement` / `expectMenuAtButton` in `e2e/driver/negotiation.ts`. Manifest: `negotiation.menu` = click, press:Enter, press:Space; rows R01 R02 R06 R07 R08.
- No bracketed ticket id in any test title; ids NEGO-R07, NEGO-R08, NEGO-L06 grep-unique in `e2e/`.
- R07 closes its menu with up to three Escapes (see follow-up). R05/R06/R07/R08/L06 passed 3/3 repeated runs after that.

## Gates (worktree `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position/draw-steel-elements`)
- tsc, lint: clean, exit 0.
- jest (fresh, `main.js`/`styles.css` removed first): `Test Suites: 1 skipped, 291 passed, 291 of 292 total; Tests: 2 skipped, 13319 passed, 13321 total` (baseline 13317/2; +2).
- lifecycle: p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7, p6 4/4, p7 3/3 = 64/64, 0 failed, all rc 0.
- e2e: `OBSIDIAN-E2E done: 595/611 ok, 0 failed, 16 known-bug, coverage: 417/417 pairs` (baseline 591/608, 17 known-bug, 416/416; +4 ok, +3 total, NEGO-R06 flipped, one new pair negotiation.menu x press:Space).
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` = the recorded 09c879f2 baseline; no CSS/token file in the diff -> shots / freeze / parity carry, not re-run.

## Drive-by fixes
None.

## Follow-ups
- A native menu opened with Space on the options button ignores its first Escape about 4 times in 10 (probe: 4/10 Space, 0/10 Enter, on 09c879f2 base too, so unrelated to position). Second Escape closes it. Worth a ticket (keyboard user has to press Escape twice).
- Not touched per scope: SC-639 (Reset focus), SC-640, SC-641 (menu items), SC-649 files. Survey confirmed `new Menu(` / `showAtMouseEvent` had a single call site.

## Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r1-impl/`)
- sc648-r1-jest.log, sc648-r1-lifecycle-p1..p7.log (+ .rc), sc648-r1-e2e-full.log (+ .rc), sc648-r1-tsc3.log, sc648-r1-lint3.log, sc648-r1-npmci.log
- probes: sc648-r1-e2e-probe7.log (Space/Enter Escape 10x each, fixed code), sc648-r1-e2e-probe8.log (Space on base), sc648-r1-e2e-probe10.log (edge placement), sc648-r1-e2e-probe2.log / probe.log (width vs no width)
- e2e failure bundle from the width variant: `.../draw-steel-elements/e2e/.out/20261114-221345-c84e/`
