# SC-492 r1 implementer report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (concern: `npm run shots` red on this machine from Obsidian 1.15.0 host drift, environmental; see Gates).
- dse branch `sc492-stamina-pencil` @ `d41d19d`, rebased onto origin/develop `d152ea4` (no conflicts; G-S28 and G-S32 coexist).
- Superproject branch `sc492-stamina-pencil` @ `f9d8f23` (two CHANGELOG commits on origin/main `00e2f37`). Submodule pointer NOT bumped, nothing pushed.
- Root cause confirmed: the chrome panel (`.dse-chrome`) is mounted inside the clickable `.dse-stamina` bar, so every chrome button click bubbles to the bar's click handler. Also affects the **collapse** button, and that one ships without the experimental switch.
- Fix: the bar's click handler ignores clicks whose target is inside `.dse-chrome` (`src/framework/kit/StaminaBarPanel.ts`).
- Tests: 5 jest (4 new file + 1 kit unit) and lifecycle G-S32. Both fail on base d152ea4 and pass on the fix.
- Gates at d41d19d: tsc/lint clean; jest 5774 passed / 1 skipped / 239 of 240 suites (base 5769, +5); lifecycle 33/33; e2e 104/104, 69/69 pairs; shots 592 / 0 FAIL only with the 1.14.4 asar visible (plain run blocked by host drift); freeze 280/280 OK; parity 0 / 0 / 24 DECLARED.

## Root cause (confirmed)
`StaminaBarPanel.ts` registered `click` on `bar` (`.dse-stamina`). `mountChrome` mounts `.dse-chrome` into `view.authoringAnchor()` = `.dse-stamina__cluster`, a descendant of `bar` (`stamina-bar/view.ts:132`). A click on any chrome button (Edit pencil, collapse, pin) bubbles to the bar handler, which opens the Stamina modal. Failing jest test on base shows `staminaModals()` Expected 0 / Received 1 for pencil, Enter/Space-style click (detail 0) and collapse. Confirmed with `authoringControls` OFF too (scratch test, not committed): the collapse button opens the Stamina modal in the shipped product.

## Survey
- `renderStaminaBar` has 3 callers: ds-stamina-bar (chrome inside the bar: the bug), hero (chrome anchor is root, outside the bar), initiative (chrome anchor is root, outside row bars). Only ds-stamina-bar is exposed.
- Other container-level click/keydown handlers (kit `collapsible` header, `rollController` panel rows via `closest('.dse-pr__row')`, tabs, track, powerRollPanel, montage cells, RecoveriesStrip pips) do not contain the chrome anchor. The risk is not general.
- Keyboard: the bar is a plain div with no tabindex/role and no keydown handler. Its only keyboard route is Enter/Space on a focused chrome button, which the browser turns into a click bubbling to the bar. So there is NO keyboard path that opens the Stamina modal from the bar (follow-up below). Lifecycle G-S32 drives real Enter and Space on the pencil.

## Fix choice
Guard in the bar handler (`closest('.dse-chrome')` -> return). Justification: stopping propagation at the chrome panel would also hide the click from document-level listeners that rely on it (RecoveriesStrip's activeDocument click-outside popover close, ConditionsModal's doc click, Obsidian's own handlers); the survey shows only this one handler is exposed. A click anywhere else on the bar still opens the modal.

## Tests added
- `test/dom/framework/chromeInsideStaminaBar.test.ts` (new, 4 tests): pencil opens only the form; keyboard-activated click (detail 0) on the pencil opens only the form; collapse button opens no modal (and collapses); click on the track still opens the Stamina modal and not the form.
- `test/dom/kit/staminaBarPanel.test.ts`: new test "a click that comes from inside .dse-chrome is not the bar's click"; existing "registers the click listener" test updated (the handler is now a wrapper, was pinned as identical to `onClick`): asserts a function is registered and a track click calls `onClick` once.
- `visual-harness/obsidian-lifecycle.mjs`: scenario **G-S32** + fixture `Lifecycle/stamina.md`. Real Obsidian: pointer moves onto the bar then up to the pencil in steps (panel is click-through until hover), real click -> only `["form"]`; Enter and Space on the focused pencil -> only `["form"]`; real click on the bar -> only `["stamina"]`; real click on collapse -> collapsed, no modal; note byte-identical; no page errors. Hides Obsidian's Notice stack (`display:none`, scenario only) because an "Update Available" Notice covers the pencil's top-right position.
- e2e not used: shipped e2e specs run with experimental OFF, so the authoring pencil does not exist there. The collapse-button half would fit e2e; not added (jest + G-S32 cover it). Owner's call.

## Base-failure evidence (against d152ea4; src file reverted to d152ea4 version temporarily, restored)
- jest: `Tests: 4 failed, 18 passed` in the two files; failing = pencil, Enter/Space click, collapse, kit chrome-click. Log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-impl-r1/jest-new-base-d152ea4.log`.
- lifecycle (Obsidian 1.15.0): `OBSIDIAN-LIFECYCLE G-S32 FAIL: mouse click on the Edit pencil: expected only the edit form, got ["form","stamina"]`. Log `.../lc-gs32-base.log`, screenshot `.../G-S32-base-d152ea4-FAIL.png`. Same failure seen earlier at e8f6a14 on 1.14.4 (`.../G-S32-base-FAIL.png`).
- Fix: `OBSIDIAN-LIFECYCLE G-S32 ok (...)`.

## Gates (all on rebased head d41d19d, scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-impl-r1/`)
- tsc (incl. `tsc -p e2e`) clean, rc 0 (`tsc.log`); lint clean, rc 0 (`lint.log`).
- jest: `Tests: 1 skipped, 5774 passed, 5775 total`, `Test Suites: 1 skipped, 239 passed, 239 of 240 total` (`jest-full-pre2.log`). Base d152ea4 5769 -> +5.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 33/33 ok, 0 failed`, rc 0 (`lc-full.log`; ran on Obsidian 1.15.0).
- e2e: `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0 (`e2e.log`).
- shots, plain run (`shots.log`): `HOST COPY DRIFTED — the host model in visual-harness/shoot.mjs no longer matches the app.css of the Obsidian installed here (/home/scott/.config/obsidian/obsidian-1.15.0.asar, version 1.15.0):` (rules #3, #5, #6 differ in spacing/quoting), run stops before host-leak/text-scale; 592 PNGs on disk. Environmental (Obsidian self-update 2026-10-22 18:09); I did not patch shoot.mjs.
- shots, measurement-only re-run with `HOME` pointed at a dir holding only the 1.14.4 asar (`shots2.log`, `g-shots2.sh`): green; 592 PNGs, `host-copy pin OK`, `button host-leak OK (113 kinds ... 678 comparisons)`, `modal button host-leak OK (... 228 ...)`, `text scale OK (1626 ...)`, `text scale once OK (107256 comparisons over 214 loads ...)`, nested corner-radius OK, 0 FAIL. (Kind count 113/678 vs the 112/672 in CURRENT: the G-S32/other fixtures are not in the harness, so this is drift from landed work, not mine; shots content is unchanged by my change.)
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`, rc 0 (`freeze.log`). No rebaseline.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc 0 (`parity.log`).

## Commits
- dse: `d25e43b` test (failing on base) / `5f1626b` fix / `a69dbc4` G-S32 / `d41d19d` G-S32 collapse step. All on d152ea4.
- superproject: `9152067` + `f9d8f23` CHANGELOG (one bullet under Unreleased; the collapse button part ships without the experimental switch, the pencil part is behind authoring controls).

Drive-by fixes: none.

Follow-ups:
1. The Stamina bar has no keyboard path at all (div, no tabindex/role/keydown); only the mouse opens the Stamina modal. Accessibility gap, own ticket.
2. `dse-verify` skill CURRENT block needs the new numbers at landing (jest +5, lifecycle 33/33 incl. G-S32); the lifecycle description should mention G-S32.
3. Shots host-copy pin needs a bump for Obsidian 1.15.0 (dispatcher says it is being handled). Re-run shots after rebasing onto that.
4. Optional: an e2e scenario for the collapse button (shipped surface, experimental OFF) would need a `data-dse-control` id + manifest row.
