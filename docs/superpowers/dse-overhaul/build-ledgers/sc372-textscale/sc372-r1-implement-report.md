# SC-372 r1 implement report

## Executive summary
- Verdict: DONE_WITH_CONCERNS. All three knobs were inert (confirmed, root AND modal); fixed. Concern: nested same-knob roles now compound (value squared), visible at 120% (see Follow-ups F1).
- dse branch `sc372-textscale` @ **fcbcd09**, rebased onto origin/develop **a337460** (develop moved f8693b5 -> 05a6ff3 -> a337460 during the task). Superproject docs commit 1980c46 (D3-token-map) on branch `sc372-textscale`; submodule pointer NOT bumped (left for wt-finish).
- Gates on the rebased tree: tsc clean, lint clean, jest 4438 passed / 1 skipped / 220 of 221 suites (base 4432 + 6 new), lifecycle 25/25, shots 568 PNGs / 0 FAIL / `text scale OK (1104 comparisons ...)`, freeze `OK (274/274)`, parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Frozen bytes moved: NO (0). Default-pref computed sizes identical before/after (130+39+39 consumer comparisons, 0 diffs).
- Gate non-vacuous: against unfixed CSS the new gate prints TEXT SCALE BROKEN with 356 problem lines, exit 1.

## (a) Before/after measurement (real Chromium, harness, steel dark, sheet on)
Method: probe enumerates every CSS rule with `font-size: var(--dse-fs-X)`, takes the first matching element, reads computed font-size at 0.8/1.0/1.2; plus a synthetic span (`font-size: var(--dse-fs-X)` under a 16px parent) in the element root and in a real DseModal (montage "Log an action" sheet). Raw: `probe/` dir (before-screen.json, after-screen.json, tables).
BEFORE (f8693b5 build): every consumer INERT in all three knobs, element root and modal. The inline stamp was present (root style `--dse-fs-large-scale: 1.2`) but `getComputedStyle(root).getPropertyValue('--dse-fs-heading')` was `calc(1.25em * 1)`.
| knob | token / consumer | 0.8 | 1.0 | 1.2 (before) | 1.2 (after) |
|---|---|---|---|---|---|
| large | heading, synthetic (root and modal) | 20 | 20 | 20 | 24 |
| large | subheading synthetic | 18.4 | 18.4 | 18.4 | 22.08 |
| large | numeral synthetic / `.dse-sb__item-v` | 28 | 28 | 28 | 33.6 |
| large | h3 synthetic (21.088 base, ticket value) | 21.088 | 21.088 | 21.088 | 25.3056 |
| large | `.dse-head__primary` (real card name) | 41.4 | 41.4 | 41.4 | 49.68 |
| small | secondary / label / caption / micro synthetic | 14.4/13.6/12.8/11.2 | same | same | 17.28/16.32/15.36/13.44 |
| small | modal `.dse-mt__sheet-sub` (caption) | 12 | 12 | 12 | 14.4 |
| control | control synthetic (root and modal) | 13.6 | 13.6 | 13.6 | 16.32 |
| control | `button.dse-collapse__header` | 13.6 | 13.6 | 13.6 | 16.32 |
After: 0.8 columns scale to exactly 0.8x (e.g. heading 16, control 10.88). Full tables: `probe/sc372-before-screen-table.txt`, `probe/sc372-after-screen-table.txt`, `probe/before-twin.txt` / `after-twin.txt` / `before-realprint.txt` / `after-realprint.txt`.

## (b) Roots `reflect`/`reflectCss` stamp onto
Only two call sites in `src`:
1. `pipeline.ts:539` `cx.prefs.reflect(root, view)`: the `div[data-dse-element="<id>"]` created by the pipeline. This covers reading mode, live preview, canvas, sidebar panel bodies (SidebarPanel -> `pipeline.run`), the settings preview stage, and the FormModal preview. Error-card roots (prepareModel failure) are never stamped.
2. `managedModal.ts:123` `prefs.reflectCss(this.dialogEl(), lifecycle)`: the `.modal.dse-modal` dialog (every DseModal).
Not stamped (stay at defaults, before and after): `.dse-sidebar__panel-header` (sibling of the pipeline root, consumes `--dse-fs-label`), error cards, Obsidian settings-tab chrome. See F2.

## (c) Fix
`styles-source.css`: the 14 scale-dependent tokens (heading, subheading, numeral, h1-h6, control, secondary, label, caption, micro) moved out of the plain `:root` block into ONE rule `:root, :is([data-dse-element], .dse-modal) { ... }` right after it. One source of truth, no duplication. The three `*-scale` multipliers and `--dse-fs-body` stay on `:root`. Mechanism comments updated in the SC-185 block. Not stamped on `<html>`.
Because `test/...` helpers matched `/:root\s*\{/`, the 4 helpers (token-coverage, theme-steel, tokens, headingScaleTokens) now use a line-anchored `ROOT_BLOCK` regex that also accepts the selector list.

## (d) Consumer audit
- `styles-source.css` ~17429 `.dse-init__title[data-empty] .dse-init__title-text::before { font-size: calc(var(--dse-fs-label) / 1.462 / var(--dse-fs-large-scale)) }`: CORRECT AFTER FIX. It was wrong before at large != 1: the h2 did not scale but the divisor did (prompt 11.33px at 1.2, 17px at 0.8, label 13.6). After: prompt == label at every combination (13.6 / 13.6; small 1.2 -> 16.32 / 16.32; large 1.2 + small 0.8 -> 10.88 / 10.88). Pinned by the new gate. (`probe/sc372-prompt-and-nesting.txt`)
- `calc(var(--dse-fs-heading) * k)` (7614, 7649, 7655, 7661, 7672, 8312, 8420, 8529), `calc(var(--dse-fs-numeral) * ...)` (3346, 11902, 13529), `calc(var(--dse-fs-body) * 0.9375)` (8756): proportional derivations of a token; correct after fix (scale together). No change.
- `--dse-text-scale`/`--dse-card-scale` consumers: separate knobs, untouched.
- No other rule compensated for the inert behavior (grep for divisions/compensations: only the one above). `test/dom/elements/initiative.test.ts:1961` pins the rule text: unchanged and still green.

## (e) Print
Per catalog help text. Measured in both surfaces (screen-media twin `print=1`, and real `@media print`): small and large scale exactly (e.g. `.dse-head__primary` 20 -> 24, `.dse-sb__item-l` 14.4 -> 17.28); control consumer (`button.dse-collapse__header`) does not move on paper (its consumer rules are print-excluded; the `--dse-fs-control` token itself does scale, no print consumer reads it). Screen-only Steel consumers (e.g. GROUP 1 h1-h6 in cards) are not styled by roles on paper by design (SC-318). Matches help text. Pinned by the gate.

## (f) Gate
`visual-harness/shoot.mjs`: `assertTextScale` (+ `TEXT_SCALE_*` tables, hoisted above the top-level sweep after a TDZ crash in the first full run). Printed line, rebased tree:
`text scale OK (1104 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal and in both print surfaces; ...)`
Covers per-knob exact scaling, isolation (other knobs do not move), real consumers + synthetic probes for all 14 tokens, element root + DseModal + print twin + real print, control-not-on-paper, the divide-by-scale prompt. Ratios against a no-pref baseline of the same page, so a coefficient retune cannot false-red it.
Vacuity: against unfixed CSS (styles-source.css from f8693b5, rebuilt) the gate prints `TEXT SCALE BROKEN` with 356 problem lines and exits 1 (`logs/sc372-vacuity-unfixed-css.log`). The jest structure test `scaleTokenScope.test.ts` fails 4 of 6 against the old CSS.
Jest additions: 6 tests in `test/unit/build/scaleTokenScope.test.ts` (one rule / selector list; all 14 tokens over their own knob; no other declaration; multipliers stay on :root; catalog-stamped vars == referenced vars; the two root kinds still carry the attribute/class the selector keys on).

## Battery (rebased on a337460; logs in `logs/`)
| gate | result |
|---|---|
| tsc | clean |
| lint | clean (pre-existing .eslintignore warning) |
| jest | 4438 passed / 1 skipped / 220 of 221 suites (base a337460: 4432; +6 mine) |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (port 9291) |
| shots | 568 PNGs, 0 FAIL; all existing in-run gates OK (title line stable 52, turn mark parity 20, host-leak 112 kinds/672, input 14/164, print-twin delta 141 ids, modal anchoring) + `text scale OK (1104)` |
| freeze | `freeze OK (274/274 frozen print PNGs byte-identical ...)` |
| parity | 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s), exit 0 |
(Pre-rebase run on f8693b5 base: jest 4373 passed / 216 suites, gate 1104 OK.)

## (g) Docs
- CHANGELOG.md: `[FIX]` entry under 7.0.0 (unreleased), after the SC-406 entry.
- `.repo-docs/font-sizes.md`: new "Where the multiplier takes effect" paragraph; large-knob row now lists h1-h6.
- `src/prefs/catalog.ts`, `src/framework/tokens.ts`: comments updated.
- Superproject (worktree) `docs/superpowers/dse-overhaul/D3-token-map.md`: new point 4 under the SC-185 role-scale notes (commit 1980c46). Table rows unchanged.

## Evidence (labelled by text; BEFORE left, AFTER right)
`evidence/sc372-large-120.png`, `sc372-small-120.png`, `sc372-control-120.png`, `sc372-large-080.png`. BEFORE built from a337460 with the original styles-source.css.

## Drive-by fixes:
none.

## Follow-ups:
- F1 (concern, design decision): roles are em ratios, so a consumer nested inside another consumer of the SAME knob compounds the multiplier (value squared). Measured at 120% small: `.dse-pr__badge-text` inside `.dse-pr__badge` 12.96 -> 18.66px (1.44x, larger than its 17.28px parent); negotiation `.dse-track__n` in `.dse-track` 14.4 -> 17.28; montage `.dse-mt__rhead-w` 7.84 -> 11.29; initiative `.dse-btn` in `.dse-init__actions` (control) 11.56 -> 16.65. Visible in `evidence/sc372-small-120.png`: the "12-16" tier badge wraps to two lines at 120%. Presence-based scan found nested same-knob consumers in statblock (6), feature (4), initiative (14), negotiation (15), montage (10). Options: root-anchor the multiplier or cancel it on nested consumers; needs an owner decision and its own ticket.
- F2: `.dse-sidebar__panel-header` (label size) sits outside the stamped pipeline root, so the sidebar panel header ignores Small text size. Pre-existing, unchanged.
- F3: `scaleRules.test.ts:207` and `theme-steel.test.ts:208` still use the old `:root\s*\{` regex; harmless (they look for non-token declarations) but would silently not see tokens if retargeted.
