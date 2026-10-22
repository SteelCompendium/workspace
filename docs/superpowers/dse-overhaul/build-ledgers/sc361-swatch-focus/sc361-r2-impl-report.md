# SC-361 r2 implementation report

**Executive summary**
- STATUS: DONE_WITH_CONCERNS (concerns = the 3 deviations below; no gate failures).
- dse head `0daae2f` on `95981f1` (4 SC-361 commits, none pushed, no superproject commit). `origin/develop` has since moved to `8d890f9`; the battery was NOT re-run there (instructed to finish on 95981f1).
- Superproject worktree rebased onto origin/main `383ec3f` (no commits; the dse pointer shows modified, as expected).
- Gates at `0daae2f`: tsc/lint clean; jest 5588 passed / 1 skipped / 234 of 235 (develop 5582 + 6 new); lifecycle 31/31; e2e 96/99 ok, 0 failed, 3 known-bug, 66/66 pairs (develop 95/98 + COND-E07); shots 580, 0 FAIL, pressed parity line unchanged (96 comparisons); freeze 280/280; parity 0 / 0 / 24 DECLARED.
- Deviations: (1) swatch font pinned to `var(--dse-fs-control)`, so swatches are now 19.125px (was 19.5px presets / 22.5px pipette); (2) preset "pressed" compare is now case-insensitive; (3) no real-Obsidian crop (see Evidence).

## Commits (dse, branch `sc361-swatch-focus`)
- `e397105` swatch selection is a check inside; focus uses the shared kit ring (pipette too) (CSS + ConditionsModal + jest)
- `c681ce0` shots pressed-parity reads the swatch check; e2e COND-E07 ring + check; changelog
- `2474621` pin the swatch font to the control role token (font-size contract)
- `0daae2f` COND-E07 tabs up to 80 stops, as COND-E02 does

Files: `styles-source.css`, `src/views/ConditionsModal.ts`, `test/dom/views/conditions-modal.test.ts`, `test/dom/kit/kit-index.test.ts`, `visual-harness/shoot.mjs`, `e2e/specs/initiative/conditions-pick-focus.e2e.ts`, `CHANGELOG.md` (dse's own changelog, 7.0.0 unreleased list; the superproject CHANGELOG was not touched).

## What changed
1. **Selection mark.** `.dse-swatch[aria-pressed='true']` lost its outline; `::after` draws Lucide `check` (`M20 6 9 17l-5-5`) as a data-URI SVG: black 70% under-stroke (6) + white stroke (2.75), `inset: 15%`. No outline/box-shadow remains on the pressed state.
2. **Focus.** `.dse-swatch:focus-visible` and `.dse-swatch--custom:has(> input:focus-visible)` joined the single shared kit ring rule; the exclusion comment was rewritten. No second ring rule (kit-index `focusRule()` and the one-ring guard pass).
3. **Pipette.** `ConditionsModal.renderSwatches`: when `entry.color` is set and not a preset (case-insensitive), the label gets `data-selected`, `applyConditionColor(label, color)` (the validated `--dse-condition-color` write; unparseable colours clear it), CSS fills the label with it (fallback `--dse-fg-muted`) and hides the pipette svg behind the check. **Accessibility choice:** no `aria-pressed` on the label; the focusable input's `aria-label` becomes `Custom condition color #rrggbb, selected` when selected (`Custom condition color` otherwise).
4. **Size.** All six swatches now render 19.125 x 19.125 (measured, dark + light).
5. **Host pins** (SC-203 shape): `.dse-swatch` added to block B (`box-shadow: none`); new block E `:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(.dse-swatch) { font-size: var(--dse-fs-control); font-family: inherit; white-space: inherit; color: inherit; }`. width/height are em-based and follow the font pin; outline needs no pin (host `outline: none` and UA ring both lose to the kit ring).
   Scratch check (not committed) `sc361-r2-hostleak.cjs`: 24 cells (preset idle, preset pressed, pipette idle, pipette selected x rest/hover/focus-visible x dark/light), 18 properties + `::after` content/background, with vs without the shoot.mjs host button model: **0 diffs**. Can-fail: with the pins removed, **92 diffs**.
6. **Shots parity.** The swatch site in `assertPressedToggleParity` now also reads `::after` content/backgroundImage (`pseudo`), and `pseudoMark` requires the check on the pressed swatch only, none on the idle one, and `outlineStyle: none` on the pressed one at rest. Summary line unchanged: `pressed toggle parity OK (toggled vs rendered, both directions: 96 comparisons across 8 sites x dark/light x rest/hover/focus-visible on the computed cascade, 9 paint properties each)`.
7. **e2e.** New `[COND-E07]` (in `conditions-pick-focus.e2e.ts`, no new manifest pair, no new lifecycle scenario): focused-unselected swatch has outline `solid 2px` and no check; after Enter it is `aria-pressed=true`, still `solid 2px`, and `::after` has content + `url(`. Can-fail proven: removing `.dse-swatch:focus-visible` from the ring rule fails it (`Received "none 3px"`). The native colour picker cannot be keyboard-driven, so the pipette is covered by jest + the harness capture, not e2e.

## Tests added (+6 jest, +1 e2e)
jest `describe('SC-361 ...')` in conditions-modal.test.ts: pressed rule has check, no ring (1); host pins (1); preset pressed behaviour incl. uppercase hex (1); pipette unmarked for no colour / preset colour (1); pipette marked + filled + named for a custom colour (1); pick custom then preset toggles the mark (1). kit-index `FOCUSABLE_KIT_CONTROLS` gained the two selectors (no new test).

## Gate summary lines (final head `0daae2f` on `95981f1`; logs in `<scratch>/final/`, exit codes from `battery.sh` rc.txt)
- tsc (incl. e2e) rc=0, lint rc=0
- jest: `Test Suites: 1 skipped, 234 passed, 234 of 235 total` / `Tests: 1 skipped, 5588 passed, 5589 total` rc=0
- `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` rc=0 (own port 9461: other efforts hold 9262/9287/9291/9343/9379/9387; a first attempt on 9262 exited 2 = environment)
- `OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` rc=0
- shots 580 PNGs, 0 FAIL, rc=0; `host-copy pin OK`, `button host-leak OK (112 button kinds x 3 states ... = 672 comparisons ...)`, `text scale OK (1626 comparisons ...)`, `text scale once OK (104184 comparisons over 208 loads ...; 110s)`: the SC-422 counts are unchanged by the swatch CSS (also unchanged at 8d075db).
- `freeze OK (280/280 frozen print PNGs byte-identical ...)` rc=0
- parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc=0
- Earlier on 8d075db (before develop moved): e2e failed once at 78/92 with WebDriver session timeouts under load average ~18 (`did not run` for 10 tests, headers timeouts), re-run green with no change; not a code failure.

## Evidence
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r2/sc361-r2-after.png` (9 labelled states x dark/light, real Tab focus, 4x: unselected, unselected+focused, selected, selected+focused, selected with neighbour focused, pipette idle/focused/selected(custom orange)/selected+focused)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r2/sc361-r2-after-gray.png` (same, grayscale)
- Real-Obsidian crop (`sc361-r2-obsidian.png`): **not produced**. `obsidian-shots` does not reach a selected+focused swatch and the machine's only display `:1` is the person's; real Obsidian is covered numerically by COND-E07 instead.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-1792606885888966588/` (`sc361-r2-capture.cjs`, `sc361-r2-compose.py`, `sc361-r2-hostleak.cjs`, `final/*.log`, `cap2/`, `hostleak*.log`).

## Deviations from the brief
1. **Font pin is `var(--dse-fs-control)`, not a Obsidian-token literal.** `fontSizeContract.test.ts` rejects `var(--font-ui-small, 13px)` as hardcoded type. Consequence: swatches track the control-text scale and render 19.125px at the harness (0.85 x 15px x 1.5); previously presets were 19.5px and the pipette 22.5px. In a real vault the figure follows the modal body font.
2. **Preset pressed comparison is case-insensitive** (`sameColor`), so a note with `color: '#C0392B'` presses the Red preset instead of being neither preset nor custom. Same helper decides the pipette's "not a preset".
3. No real-Obsidian crop (above).

## Drive-by fixes
None.

## Follow-ups
- Obsidian host `outline` is irrelevant now, but `.dse-optchip` and swatches both rely on block B `box-shadow: none`; SC-356's `HOSTLEAK_KNOWN_LEAKS` `.dse-swatch` entry (10 props) should be deleted when SC-356 lands (it will fail "once a listed prop stops leaking").
- An unparseable `color:` YAML string on a condition still counts as "custom selected" (pipette shows the check on the muted fallback). Arguably it should read as unselected; left as is (owner call).
- `visual-harness/mocks/sc186-entry.mjs` has its own static swatch row that still shows the old ring; it does not import the real CSS (unchanged).
- Close SC-473 when SC-361 lands (folded in).

## r4 fix round

**Summary**
- STATUS: DONE. Final dse head `d7e83e2` on `origin/develop` `54f8f88` (7 SC-361 commits); superproject `fa16842` on origin/main `fc3bd71` (one commit, CHANGELOG.md only; the dse pointer is not staged).
- r4 commits: `95884b7` (LOW-1), `383423c` (INFO-4), `d7e83e2` (LOW-2), superproject `fa16842` (INFO-3).
- Gates at `d7e83e2`: tsc/lint clean; jest 5608 passed / 1 skipped / 234 of 235 (develop 5601 + 6 earlier + 1 LOW-1); lifecycle 31/31; e2e 96/99 ok, 0 failed, 3 known-bug, 66/66; shots 580, 0 FAIL; freeze 280/280; parity 0 / 0 / 24. All exit codes 0.
- New shots line: `pipette selected look OK (a custom colour fills the pipette, hides its glyph and draws the check; the kit ring shows on keyboard focus: idle/picked/focused x dark/light on the computed cascade)`. Text-scale lines unchanged (1626 / 104184 over 208 loads); pressed parity still 96 comparisons.

**LOW-1** `isConditionColor` is exported from `src/elements/conditionColor.ts` and `applyConditionColor` uses it. `renderSwatches` marks the pipette only when the colour parses and is not a preset; jest case `an unparseable YAML colour marks nothing` added. The CSS comment no longer claims an unparseable clause.

**LOW-2** `assertPipetteSelectedLook` in `visual-harness/shoot.mjs`, called right after `assertPressedToggleParity`. It picks `#e67e22` through the input's change event and asserts in dark and light: idle plain; picked has `::after` content and a `url(` image, svg glyph `visibility: hidden`, fill `rgb(230, 126, 34)`, no outline at rest; after Tab the label draws `solid 2px`. Mutation proof (scratch harness `sc361-r4-pipette-gate.cjs` running the committed function text against a rebuilt harness; mutations not committed, styles-source.css restored byte-clean):
- `content: none` on the check -> `no check is drawn on the pipette (::after content "none" ...)`, dark + light, exit 1
- glyph `visibility: visible` -> `the pipette glyph is visible, not hidden`, exit 1
- fill `var(--dse-surface)` -> `the pipette fill is rgb(26, 30, 33), not the picked colour rgb(230, 126, 34)`, exit 1
- ring selector removed -> `the focused pipette draws "none 3px", not the shared 2px solid ring`, exit 1
- unmutated: `GATE PASSED`.

**INFO-4** The two stale `~:NNNN` pointers now name the rules (the shared kit `:focus-visible` rule; `.dse-swatch[aria-pressed='true']::after`).

**INFO-3** Workspace CHANGELOG bullet under `## Unreleased` in the worktree superproject (no conflict on rebase; main's bullets kept).

Gate logs: `<scratch>/final5/` (`rc.txt`, `jest.log`, `lifecycle.log` on private port 9461, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`); scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-1792606885888966588/`. No new evidence images (CSS unchanged since r2).

## r6 reconcile round

**Summary**
- STATUS: DONE. Final dse head `134c0de` on `origin/develop` `ea56712` (8 SC-361 commits); superproject `c9bd011` on origin/main `e5f329a` (CHANGELOG.md only; dse pointer unstaged).
- One conflict, in `styles-source.css` (commit 1 of the rebase): SC-356's "E." option-chip block and my "E." swatch block at the same spot. Kept both: SC-356's stays `E.` (`styles-source.css:17221`), mine is now `F.` (`:17264`). SC-356 pins only `.dse-optchip` (its block B entry was already there); no overlap or contradiction with my `.dse-swatch` pins. No comment referred to my block by letter except the shoot.mjs allowlist comment, which now says "block F".
- r6 commit: `134c0de` drops the swatch entry; `HOSTLEAK_KNOWN_LEAKS` is now `[]` with the mechanism kept, and the modal summary prints the ALLOWLISTED line only when the array is non-empty (otherwise it would print a bogus empty "ALLOWLISTED ()" line).
- Gates at `134c0de`: tsc/lint clean; jest 5614 / 1 skipped / 234 of 235 (5607 + my 7); lifecycle 31/31; e2e 96/99 ok, 0 failed, 3 known-bug, 66/66; shots 580 / 0 FAIL; freeze 280/280; parity 0/0/24. All exit 0.
- Modal host-leak line: `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`, with no ALLOWLISTED line (grep count 0). 228 is the same as SC-356's.
- Also confirmed in shots: `pipette selected look OK (…)`, `pressed toggle parity OK (… 96 comparisons …)`, `button host-leak OK (112 button kinds … = 672 comparisons …)`, `text scale OK (1626 …)`, `text scale once OK (104184 comparisons over 208 loads …)`.

Notes: the docs `dse-7.0.0-release-audit.md` mentions of SC-361 are historical scope notes and were left. Gate logs: `<scratch>/final6/` (lifecycle on private port 9461). Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-1792606885888966588/`.

## r8 rebase

**Summary**
- STATUS: DONE. Final dse head `424f47b` on `origin/develop` `3973b56` (8 SC-361 commits); superproject `e8cde22` on origin/main `262dad6` (CHANGELOG.md only, no conflict; dse pointer unstaged).
- `git range-diff ea56712..134c0de 3973b56..HEAD`: all 8 commits "=" (identical patches), saved at `<scratch>/r8-range-diff.txt`.
- Gates at `424f47b`, all exit 0: tsc/lint clean; jest 5703 passed / 1 skipped / 238 of 239 (5696 + 7); lifecycle 31/31; e2e 96/99 ok, 0 failed, 3 known-bug, 66/66; shots 580 / 0 FAIL; freeze 280/280; parity 0 / 0 / 24.
- Shots lines confirmed: `modal button host-leak OK (… 228 comparisons …)` with 0 ALLOWLISTED, `pipette selected look OK`, pressed parity 96, `button host-leak OK (112 … 672)`, `text scale OK (1626 …)`, `text scale once OK (104184 … 208 loads …)`.
- Logs: `<scratch>/final7/`; scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-1792606885888966588/`.
