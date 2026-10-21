# SC-422 r1 implement report

## Executive summary
- Verdict: DONE. All four surfaces (search modal rows + empty-index hint, settings preview caption, sidebar header, sidebar empty message) now follow the Small text size exactly once; nothing else outside a stamped root needed fixing.
- Base: dse origin/develop `ab34293` (rebased from 7817133 -> b6b08f3 -> ab34293). Head: dse branch `sc422-textscale-surfaces` `487b444` (4 commits). Superproject branch head `c44b5b2` (1 doc commit, on origin/main `b21e48b`). Nothing pushed.
- Gates at that head: tsc + lint clean · jest 5278 passed / 1 skipped / 231 of 232 suites (base 5262/1/230 of 231: +16 tests = 14 authored + 2 per-file kit hygiene cases, +1 suite) · lifecycle 27/27 · e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 (first run had one load-induced RECOV-R07 fail at load avg 25; rerun green) · shots 572 PNGs, 0 FAIL, `pressed toggle parity OK (96)`, `text scale OK (1626 comparisons ... 5 chrome surfaces)`, `text scale once OK (103821 comparisons over 204 loads ... 5 chrome surfaces included)` · freeze `OK (276/276)` · parity 0 gaps / 0 undeclared / 24 declared.
- Frozen bytes moved: NO. Default-pref sizes are identical before/after in real Obsidian.
- Non-vacuity: proven (stamping removed -> 116 gate lines fail, see below).
- Evidence: 4 before/after composites (real Obsidian) in `.../evidence/`.

## Survey (current develop, before the change)
Every fs-role consumer in `styles-source.css` was enumerated (all `var(--dse-fs-*)` declarations, comments excluded) and classified by where its DOM lives. Surfaces outside any stamped root (`[data-dse-element]`, `.dse-modal`):
- `.dse-compendium-suggest__type/__source` (caption) styles-source.css:2380, `__code` (label) :2407, `__hint` (secondary) :2421. Rendered by `CompendiumSearchModal` (SuggestModal, src/authoring/CompendiumSearchModal.ts). Confirmed ignoring the knob in real Obsidian: chips 12px at Small 120% (unchanged).
- `.dse-settings-preview__label` (label) :16449; `__label-hint` :16463 has no font-size of its own (inherits the label size, so it follows once the label does). Real Obsidian: 12.75px at Small 120% (unchanged).
- `.dse-sidebar__panel-header` (label) :16314 and `.dse-sidebar__empty-message` (label) :16390. Real Obsidian: 12.75px unchanged.
- No other consumer found outside a stamped root. Checked: every other `Modal` subclass extends `DseModal`; the notices (`new Notice`, undoNotice) and `EditorSuggest`s (`DsElementSuggest`, `DsSchemaSuggest`, classes `.dse-suggest__*`) use no fs role; `.dse-ref-notice__hint` :525, `.dse-chrome-summary__label`, `.dse-stamina-rec__pop-*`, `.dse-cond-*`, `.dse-form__*` render inside an element root or a DseModal; DseSettingTab's only role consumer is the preview caption.

## What was stamped, and its lifetime owner
Mechanism: new `src/framework/kit/textScaleRoot.ts` `stampTextScaleRoot(el, prefs, owner)` = add class `.dse-fs-root` + `prefs.reflectCss(el, owner)`. `.dse-fs-root` is the third member of the SC-372 token rule selector (`:root, :is([data-dse-element], .dse-modal, .dse-fs-root)`) and of the applies-once registry's nested-root clause (styles-source.css), so the exactly-once registry stays correct if a chrome root is ever nested in a registered consumer. No `.dse-modal` was added to a non-DseModal.
- Search modal: `modalEl ?? containerEl` (the box holding input + rows); owner = a private `Component` loaded in `onOpen`, unloaded in `onClose` (calls `super.onOpen/onClose`). Prefs found through `prefsForApp(this.app)` (same seam DseModal uses), so no constructor change at main.ts:585 / compendiumInsert.ts. SC-431's escapeConsumer registry only touches `DseModal`/steppers; onClose still runs on every Obsidian close path.
- Settings preview: the `.dse-settings-preview` wrapper (holds caption AND sample stage), via `buildPreviewPanel(containerEl, {prefs, owner})`; owner = the per-mount `Component` the settings row already creates and unloads on teardown (SettingsPreview.ts, `fw.services.prefs`).
- Sidebar: the `.dse-sidebar` container (covers header + empty message in one stamp; header and body are siblings so no nested same-knob consumer), created by new `DseSidebarView.createPanelsEl()`; owner = the view (`this`), `services.prefs`. Real Obsidian check: after detaching the sidebar leaf and setting the pref to 0.8, the detached root kept stamp `1.2` (released).

## Tests (new: 16 counted by jest)
- `test/dom/kit/textScaleRoot.test.ts` (4): class, 3 stamps live + remove-on-default, release on owner unload, bare context.
- `compendiumSearchModal.test.ts` (+4): dialog root carries all three knobs after `prefs.set`; rows sit inside the stamped root; close releases; no-prefs App.
- `settings-preview.test.ts` (+2): panel is a chrome root following Small live (sample root re-stamps identically); close releases.
- `dseSidebarView.test.ts` (+3): container root + empty message + panel header inside it, live; view unload releases; no-prefs.
- `scaleTokenScope.test.ts`: selectors updated to the 3-member list; test on stampers extended (the §F2 "stampers list") + new test that each chrome surface stamps through the helper with the right owner.
- Gate: `visual-harness/chromeSurfaces.ts` + `entry.ts` `surface=` param mount the real search modal (rows + empty-index CTA), `mountSettingsPreview`, and `DseSidebarView` (empty / with a pinned counter) in the browser harness (no PNGs, not in the manifest). `shoot.mjs`: `TEXT_SCALE_CHROME_PAGES` (11 consumer rows incl. nested preview sample rows pinned at exactly S), chrome pages added to `assertTextScale` (stamp + 14 synthetic tokens + isolation) and to the `text scale once` sweep (roots selector extended; a chrome page that mounts no `.dse-fs-root` fails). Also fixed a crash in the gate when a root is missing.

## Non-vacuity
With `stampTextScaleRoot` body removed, full `npm run shots` exits 1 at the gate. Excerpt (saved log, synthetic-token lines filtered, 48 lines: `sc422-nonvacuity-gate-failure.log`):
`surface:search-modal [chrome root] smallTextScale=1.2: the pref was not stamped on the chrome root (.dse-fs-root) (inline --dse-fs-small-scale = null)`
`surface:search-modal [chrome root] smallTextScale=1.2: search modal .dse-compendium-suggest__type (caption) measures 12px, expected 14.4000px (baseline 12px x 1.2)`
(46 `surface:` lines in the saved log, 30 of them "not stamped"; the 116 earlier quoted counted the 70 synthetic-token lines that were filtered out of the saved log). Mutation reverted before the final battery.

## Evidence (real Obsidian 1.14.4, own Xvfb; sizes in px, never colour)
Dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/evidence/` (raw crops in `raw/`). Each image is a 2x2: top row before (develop), bottom row after (branch); left column default sizes, right column Small text size 120%.
1. `sc422-search-modal-before-after.png` — type/source chips 12 -> before 12 / after 14.4; code line 12.75 -> before 12.75 / after 15.3; result names stay 15 in all four.
2. `sc422-settings-caption-before-after.png` — "Preview" caption and hint 12.75 -> before 12.75 / after 15.3; sample statblock (already stamped) moves in both.
3. `sc422-sidebar-header-before-after.png` — panel header ("Counter", note name) 12.75 -> before 12.75 / after 15.3.
4. `sc422-sidebar-empty-before-after.png` — empty message 12.75 -> before 12.75 / after 15.3; title stays 15.
At default prefs all four are identical before vs after (same px). No Control-sized text exists on these surfaces, so no Control pair. Measurements: `raw/before-measure.json`, `raw/after-measure.json`. (After shots were taken on a b6b08f3 build; CSS/TS of this change is unchanged by the later rebase.) Evidence script (scratch, not committed): `/tmp/claude-1000/sc422/ev/sc422-evidence.mjs`, `composite.py`.

## Docs
`.repo-docs/font-sizes.md` ("Stamped roots (SC-422)" section + selector), superproject `docs/superpowers/dse-overhaul/D3-token-map.md` (point 4), `src/prefs/catalog.ts` comment, CSS comments on all four surfaces, one dse CHANGELOG bullet under the 7.0.0 (unreleased) section (the file has no `## Unreleased` header).

Drive-by fixes:
- `shoot.mjs` `assertTextScale` crashed (`undefined.toFixed`) when a root was missing; now skips after the already-reported "measured undefined" problem. Needed for the non-vacuity run to print a readable failure.

Follow-ups:
- None needing a ticket. Note for owner: the search modal's empty-index hint is covered by the browser gate and jsdom, not by a real-Obsidian image (the scratch vault has a compendium).
- Environment note: one e2e run failed RECOV-R07 (stamina-bar, unrelated) at 1-min load 25; green on rerun at the same head.

## Artifacts
- Report: this file. Non-vacuity log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc422-textscale-surfaces/sc422-nonvacuity-gate-failure.log`
- Evidence: the four PNGs above + `evidence/raw/`.
- Gate logs (scratch): `/tmp/claude-1000/sc422/{jest-g,lifecycle-g,e2e-h,shots-g,freeze2,parity-g}.log`


## r3 fix round
- Head `82ca38b` on base `ab34293` (unchanged). LOW-1 fixed: the jsdom mock `SuggestModal` now builds `modalEl` (`.modal.prompt`) holding `inputEl` and `resultContainerEl`; jsdom and the harness stamp `.prompt` like production. LOW-2: non-vacuity counts corrected above (46 `surface:` lines, 30 "not stamped"). INFO-2: one-line comment in `textScaleRoot.ts`.
- Test: the search modal test now asserts the stamp lands on `.prompt` and NOT on `.modal-container`; rows are rendered under `resultContainerEl`; harness no longer re-parents the result list. No assertion weakened; no test added or removed.
- Gates: tsc/lint clean · jest 5278 passed / 1 skipped / 231 of 232 (unchanged) · lifecycle 27/27 · e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 · shots 572, 0 FAIL, pressed-toggle parity OK (96) · `text scale OK` 1626 -> 1626 comparisons · `text scale once OK` 103821 -> 103815 comparisons over 204 loads · freeze OK (276/276) · parity 0/0/24.
- Gate logs: `/tmp/claude-1000/sc422/{jest-r3,lifecycle-r3,e2e-r3,shots-r3,freeze3,parity-r3}.log`

## r5 rebase + full battery
- Rebased onto dse `origin/develop` `188755b` (no conflicts, package.json unchanged). dse head `bf8b99c`; superproject rebased onto `origin/main` `2d4dfeb`, head `3e344b3`. No code changed. Nothing pushed.
- Help text in `src/prefs/catalog.ts` (smallTextScale, largeTextScale "Applies everywhere...", controlTextScale "text on buttons...") unchanged; the only diff vs develop in that file is my SC-422 comment.
- Gates: tsc/lint clean · jest 5273 passed / 1 skipped / 230 of 231 · lifecycle 27/27 · e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 · shots 572, 0 FAIL, `pressed toggle parity OK (96)`, `text scale OK (1626)`, `text scale once OK (103815 / 204 loads)` · freeze OK (276/276) · parity 0/0/24.
- Logs: `/tmp/claude-1000/sc422/{jest-r5,lifecycle-r5,e2e-r5,shots-r5,freeze5,parity-r5}.log`

## r6 rebase onto 772c3cd + full battery
- dse base `772c3cd` (SC-457; first rebased on bc4a0c5, those numbers discarded). Rebase conflicts: `visual-harness/entry.ts` (SC-362 moved the `targets` declaration up; kept it there and kept only my `surface=` early return) and `CHANGELOG.md` (kept both bullets). dse head `8d075db`. Superproject head `ae088de` on origin/main `8f914ec`. package.json unchanged. Nothing pushed.
- Gates: tsc/lint clean · jest 5552 passed / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 · shots 580 PNGs, 0 FAIL · freeze OK (280/280), 0 frozen bytes moved · parity 0/0/24.
- Exact lines for dse-verify:
```
pressed toggle parity OK (toggled vs rendered, both directions: 96 comparisons across 8 sites x dark/light x rest/hover/focus-visible on the computed cascade, 9 paint properties each)
text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (search modal rows + empty-index hint, settings preview caption, sidebar header + empty message) and in both print surfaces; a knob scales its own tokens exactly and moves no other knob's; control text does not move on paper; the "Untitled encounter" prompt stays on the label size)
text scale once OK (104184 comparisons over 208 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 138s)
```
- Logs: `/tmp/claude-1000/sc422/{tsc-r6b,lint-r6b,jest-r6b,lifecycle-r6b,e2e-r6b,shots-r6b,freeze6,parity-r6b}.log`
