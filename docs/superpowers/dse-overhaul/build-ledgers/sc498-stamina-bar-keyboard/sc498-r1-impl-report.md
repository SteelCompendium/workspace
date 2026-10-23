# SC-498 r1 implementer report

## Executive summary
- Verdict: DONE. dse branch `sc498-stamina-bar-keyboard` tip `47449b6` (3 commits on `9f08f06`: tests `9aa8971`, fix `463f8cc`, lifecycle `a173cd7` + `47449b6`); superproject tip `874700a` (CHANGELOG + dse-verify row only; submodule pointer NOT bumped, nothing pushed). origin/develop was still `9f08f06`.
- Gates: tsc+lint clean; jest 5863 passed / 1 skipped / 241 of 242 suites (+16 vs 5847); lifecycle 35/35 (G-S36 new); e2e 108/108, 0 failed, 0 known-bug, 69/69 pairs; shots 592, 0 FAIL, all in-run lines as listed; freeze OK 280/280 (no rebaseline); parity 0 gaps / 0 undeclared / 24 declared.
- A11y structure: the `.dse-stamina` bar itself is the tab stop, `role="group"` + `aria-label="Edit Stamina: 15 of 20, 5 temporary"` (kept current by `updateStaminaBar`), because role=button would hide the chrome buttons inside it.
- Focus ring: reused the kit's one shared rule (`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`, `styles-source.css` ~:15573), joined by `.dse-stamina--clickable[tabindex]:focus-visible`; a later print rule removes it on paper. No design ask needed.
- Decision for owner: the initiative tracker's row bars opt OUT of the tab stop (`keyboard: false`), since each row already has a real numeric button to the same modal. Reversible in one line.

## Tests added (16 new jest tests)
- `test/dom/kit/staminaBarPanel.test.ts` (8): one tab stop named + focusable; Enter opens once and preventDefault; Space opens + preventDefault (no scroll); other keys / ctrl-meta Enter-Space / auto-repeat do nothing; Enter/Space from a chrome button inside the bar are neither acted on nor swallowed; mouse click elsewhere still opens; no tab stop when read-only / no handler / `keyboard:false`; accessible name follows `updateStaminaBar`.
- `test/dom/framework/chromeInsideStaminaBar.test.ts` (4, via the real pipeline with authoring on): `test.each` Edit pencil / collapse / Pin to sidebar: Enter+Space open no modal and are not swallowed; Enter and Space on the bar itself open the Stamina modal and not the edit form.
- `test/dom/elements/stamina-bar.test.ts` (2): tab stop + Enter opens the modal through the element; ring rule + print removal in `styles-source.css`. Also one added assertion in the existing read-only test (no tabindex).
- `test/dom/elements/initiative.test.ts` (1): row bar has no tabindex/role/keydown opening. `test/dom/elements/heroSheet.test.ts` (1): hero bar is a tab stop, Enter opens the modal.
- `test/dom/kit/kit-index.test.ts`: the shared-ring list now includes `.dse-stamina--clickable[tabindex]:focus-visible` (existing test extended, not a new one).
- Lifecycle `G-S36` in `visual-harness/obsidian-lifecycle.mjs` (header count + comment updated; own fixture note `Lifecycle/stamina-keyboard.md`, because G-S32 leaves the shared stamina block collapsed for the session and a collapsed bar is not a tab stop).

## Base-failure evidence
- jest on base src with the new tests (`/tmp/.../sc498-impl-r1/jest-base-fail.log`): 8 failed / 138 passed in the 4 touched suites: kit tab-stop, Enter, Space, accessible-name; chrome "Enter and Space on the bar itself"; stamina-bar Enter + ring; kit-index shared rule. (The chrome-guard "must not open" tests pass on base by construction; they are regression guards for the new handler.)
- G-S36 on a base-built bundle (`DSE_LIFECYCLE_BUNDLE=.../base-bundle`, `lc-gs36-base2.log`): `G-S36 FAIL: a real Tab never reached the stamina bar (focus went: {"tab1":"button.dse-btn.dse-btn--ghost.dse-btn--icon","tab2":"button.dse-btn.dse-btn--ghost.dse-btn--icon","tab3":"button.clickable-icon","tab4":"button.clickable-icon"})`, `done: 0/1 ok, 1 failed`. Fix bundle: `G-S36 ok (a real Tab reaches the bar after ["bar"] (ring 2px solid, offset 2px); Enter and Space each open only the Stamina modal; focus: in modal input.dse-sedit__apply-input, after close bar / bar; ring after round trip solid true; the note is untouched)`.
- Focus on modal close (recorded): Obsidian returns focus to the bar after both Enter-open and Space-open; the `:focus-visible` ring is still drawn afterwards. In the modal, focus is on `input.dse-sedit__apply-input` (the modal's own behaviour, untouched).

## A11y structure choice
The bar must be the stop: Legacy shows only `.dse-stamina__track` and hides the cluster, Steel does the reverse, so no child is visible under both themes; the chrome panel (real buttons) mounts inside the cluster, so `role="button"` on the bar would make AT flatten those buttons away (the montage board cells ruled the same way, `BoardView.ts`). So: `tabindex=0`, `role="group"`, name "Edit Stamina: {current} of {max}[, N temporary]" (action then value, like the montage cells' "... - edit" and initiative's "Rename encounter: name"). Key rule mirrors the SC-492 click guard: only a keydown whose target is the bar itself counts, so chrome-button keys are neither acted on nor `preventDefault`ed (the browser still turns them into the button's click). Ignores ctrl/meta/alt, auto-repeat. Code: `src/framework/kit/StaminaBarPanel.ts` (`makeKeyboardOperable`, `updateBarLabel`).

## Modes survey
Tab stop exists only when the click exists: `canPersist` true AND `owner` + `onClick` supplied AND `keyboard !== false`.
- No stop: read-only hosts (`canPersist` false: print/export, canvas `sourcePath === ''`, nested render, a sidebar block not yet located); `style: sheet` (no bar, notice only); hero `readOnly`; initiative `!canWrite`; a collapsed block (hidden, so skipped by the browser); initiative row/detail bars (opt-out, see below).
- Stop: stamina-bar element in Reading, Live Preview, embeds, hover popovers (all writable per BlockHost docs), sidebar pins, the hero sheet's stamina region (the sheet's only Stamina write path).
- Print / print twin: the bar stays a stop if the host persists (same as click) but draws no ring.

## Focus-ring survey
Existing convention: one shared rule, `styles-source.css:15504-15573` (`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`, at :15573), used by `.dse-btn`, tabs, `.dse-pr__row[aria-checked]`, `.dse-track__slot`, and the closest precedent, `.dse-stamina-rec__pips[tabindex]` (a tabindex'd div, same `[tabindex]` gating). `kit-index.test.ts` insists on exactly one `outline: 2px solid` ring, so I joined that rule instead of a second one. Print: a separate later `outline: none` under `@media print` and `[data-dse-print="on"]`. `:focus-visible` only; the lifecycle proves a Tab-focused bar computes `outline 2px solid / offset 2px / matches :focus-visible`.

## Gate lines
- tsc (`tsc --noEmit && tsc --noEmit -p e2e`): rc 0, no errors. lint (`eslint src main.ts e2e`): rc 0 (only the pre-existing `.eslintignore` deprecation warning).
- jest: `Tests: 1 skipped, 5863 passed, 5864 total; Test Suites: 1 skipped, 241 passed, 241 of 242 total` (after shots; before shots it read 2 skipped / 5862 passed, as dse-verify row 3 says). Delta +16.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 35/35 ok, 0 failed`, rc 0.
- e2e: `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0.
- shots: rc 0, 592 PNGs, 0 FAIL; `host-copy pin OK (... verbatim Obsidian 1.15.0; 18 further rules ... 0 unclassifiable ...)`, `button host-leak OK (113 button kinds x 3 states ... = 678 comparisons ...)`, `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds ... = 228 comparisons ...)`, `text scale OK (1626 ...)`, `text scale once OK (107256 comparisons over 214 loads ...)`, expected `OBSIDIAN APP.CSS PIN DRIFT` warning (installed 1.15.0 vs pinned 1.13.7).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`. parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc 0.

## Screenshots (real Obsidian 1.15.0, headless, CDP element crops at 2x with a 16 px margin; run from a scratch copy of the lifecycle harness, `sc498-shots-scratch.mjs`, not committed)
Dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-impl-r1/shots/`
- `stamina-bar-focused-dark.png`: dark scheme, bar focused by a real Tab; a solid 2 px outline with a 2 px gap runs around the whole plate on all four sides, fully inside the crop (not clipped); the pin and collapse menu buttons are revealed at the top right (focus-within) and overlap the ring's top edge.
- `stamina-bar-focused-light.png`: same in the light scheme; the outline is a solid line around the whole plate.
- `stamina-bar-unfocused-dark.png`, `stamina-bar-unfocused-light.png`: same bar, no outline, no menu buttons.
- Failure shots on base: `gs36-base-FAIL.png`, `gs36-base2-FAIL.png`; `gs36-fullrun-FAIL.png` is the earlier shared-note failure (block collapsed by G-S32).
Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-impl-r1/` (`jest-*.log`, `lifecycle-full.log`, `e2e-full.log`, `shots-full.log`, `freeze.log`, `parity.log`, `lc-gs36-*.log`).

## Drive-by fixes:
None.

## Follow-ups:
1. `renderStaminaBar` adds `dse-stamina--clickable` (cursor: pointer) whenever `canPersist`, even with no handler (e.g. initiative `canWrite` without an `onClick`), so a bar can look clickable and do nothing. Left alone.
2. In initiative Steel rows the numeric `button.dse-init__stamina` is "visually stood down" but stays in the DOM; I did not check whether it is still a (possibly invisible) tab stop. Not touched.
3. The bar's name is the same "Edit Stamina: ..." on every hero-sheet/standalone bar; a page with several stamina bars has no per-bar subject in the name. A `label` option could be added if wanted.
4. The ring is rectangular (the bar has no border-radius) around a rounded plate; the 2 px offset keeps it clear but the corners do not match the plate. Cosmetic; flag if Scott wants rounded.
5. Lifecycle note: a block collapsed in one scenario stays collapsed for the session (SessionPersist), so scenarios sharing `Lifecycle/stamina.md` after G-S32 inherit it.
