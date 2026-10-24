# SC-509 r2 implementation report (implementer B)

## Executive summary
- STATUS: DONE. Option A implemented exactly as ruled: `replaceSource(newSource, { fromView? })`; only `ElementView.flushPersist` passes `{ fromView: true }`. FormModal.ts and pipeline.ts untouched.
- Rebased onto dse `origin/develop` 7046eb0 (SC-494) and superproject `origin/main` f007a2a, as the owner asked. Original base was 054c9c5.
- dse commits (branch `sc509-form-save-refresh`): red tests `dac643f`, fix `731f3e1`, lifecycle G-S40 `a426882`. Superproject: CHANGELOG `d93f8d3` (on f007a2a). No push, no pointer bump.
- Red verified on 7046eb0 source: 5 of the new tests fail (montage, counter, stamina-bar redraw; the sidebar panel; the sidebar host unit test); the in-card adoption control passes before and after.
- G-S40 fails against a 054c9c5 bundle (montage still reads "The Heist") and against a Reading-fix-only bundle (sidebar panel still stale); passes on the fix.
- Full battery on the final HEAD, all green: tsc, lint, jest 6031/2 skipped before shots and 6032/1 skipped after, lifecycle 37/37, e2e 114/114 with 79/79 pairs, shots 592 with 0 FAIL, freeze 280/280, parity 0/0/24.

## Changes
- `src/framework/host/BlockHost.ts`: `replaceSource(newSource, options?: { fromView?: boolean })`, documented (SC-509: a non-view write must re-render like an external edit; default is the safe one).
- `src/framework/view.ts`: `flushPersist` passes `{ fromView: true }`.
- `ReadingModeBlockHost.replaceSource`: the claim ticket (`registry.noteWrite`) is created only when `fromView === true`. The write, `knownBody` upkeep and the SC-478/SC-470 scroll pin are unchanged for both kinds.
- `SidebarBlockHost.replaceSource`: `lastWritten` is cleared (null) unless `fromView === true`, so a form save reaches `SidebarPanel.handleExternalChange`.
- `LivePreviewBlockHost.replaceSource`: signature only.
- Comments at each site name SC-509 and the reason.

## Tests
- New `test/dom/framework/formSaveRedraw.test.ts` (5 tests): registered processor + real pencil + real FormModal + real Save + rebuild, for montage (raw box), counter (raw box), stamina-bar (typed field "Current stamina"). Asserts new text, old text gone, fresh root, `claims === 0`, no ticket left after Save. Control: counter Increase then rebuild adopts the same root with `claims === 1` and one ticket. Sidebar: real SidebarPanel pencil, Save, panel shows the new content; then an in-card click is swallowed as the view's own echo (same root, no external-change redraw).
- `test/dom/framework/sidebarBlockHost.test.ts`: +1 test (a write without `fromView` fires `onExternalChange`; `{ fromView: true }` does not).
- Existing tests updated mechanically (13, none weakened): 7 in sidebarBlockHost, 2+2 in view-registry (4 call sites: ticket-before-process, no-ticket-for-no-op write, real write leaves one ticket, rejecting write), 3 in element-view, 1 in pipeline.
- Lifecycle `G-S40` in `visual-harness/obsidian-lifecycle.mjs` (header comment, 4 fixtures, scenario): real hover and click on the pencil and on Save in Reading view for montage, counter, stamina bar; claim count must not move; the old tagged root must be gone; waits on the card text with a deadline; no Notice; no page error. Control: counter Increase keeps the root, exactly one claim. Sidebar phase: pin, Save from the panel's pencil, panel and the note card both show the new text, the anchor survives.
- Note for reviewers: the lifecycle hover goes inside the card to its top edge below the pencil, then straight up (the chrome panel is painted outside the card and a diagonal path loses the hover). A failing hover prints the geometry.

## Gate numbers (final HEAD a426882 in dse; superproject d93f8d3)
- tsc (incl. `tsc -p e2e`): rc 0, clean. lint (src main.ts e2e): rc 0, clean.
- jest before shots: `Tests: 2 skipped, 6031 passed, 6033 total`, `Test Suites: 1 skipped, 244 passed, 244 of 245`. After shots: `Tests: 1 skipped, 6032 passed, 6033 total`. (Owner baseline 6026 / 1 skipped / 243 of 244 plus 6 new tests = 6032.)
- lifecycle: `OBSIDIAN-LIFECYCLE done: 37/37 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`.
- shots: 592 PNGs, 0 FAIL; `button host-leak OK (113 button kinds ... 678 comparisons`, `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds ... 228 comparisons`, `host-copy pin OK`, expected `OBSIDIAN APP.CSS PIN DRIFT` warning, rc 0. (This call ran past the 600 s foreground limit and was moved to the background by the harness; I waited for its exit and read its own log.)
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`; no rebaseline.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Discrimination (G-S40)
- Against a 054c9c5 bundle (built from `git archive`): `G-S40 FAIL: montage: the card still reads "Montage TestThe Heist0 heroes ...", not "Other Job"`.
- Against 054c9c5 + the Reading-view half of the fix only: `G-S40 FAIL: sidebar panel: the card still reads "Montage TestThe Heist ...", not "Other Job"`.
- On the fix: `G-S40 ok`.
- The jest red run was repeated on the 7046eb0 base (the real FormModal Save is still driven; SC-494's FormModal change did not alter the flow).

## Drive-by fixes
None.

## Follow-ups
1. Hero "Edit definition" (`src/elements/hero/view.ts:257`) takes the same `openFormEditor(this, this.cx, ...)` path and so is fixed by construction (the host write is no longer marked `fromView`), but no test drives it; the hero view needs a heavy harness and was not worth the cost here.
2. The SC-340 docs: `.claude/skills/dse-verify/SKILL.md` (lifecycle step text and CURRENT numbers: 37/37, G-S40) and any dse-verify CURRENT line need the owner's/dispatcher's update at landing; I touched only CHANGELOG in the superproject.
3. `npm run lint` covers `src main.ts e2e` only, so `visual-harness/obsidian-lifecycle.mjs` was checked with `node --check` plus the real run.
4. Live Preview was not affected before the fix (claim misses there); I did not trace why. No Live Preview phase in G-S40.
5. G-S40's sidebar phase uses a raw-box montage, not a typed-field form; typed-field form saves in the sidebar are covered only by the shared host change.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/)
- sc509-r2-impl-report.md (this file)
- sc509-r2-red-jest.log (red at 054c9c5), sc509-r2-red-jest-on-7046eb0.log (red at 7046eb0)
- sc509-r2-jest-after-fix-1.log (13 mechanical failures), sc509-r2-jest-after-fix-2.log (green), sc509-r2-tsc.log
- sc509-r2-lifecycle-gs40-fixed.log, sc509-r2-lifecycle-gs40-base054c9c5.log, sc509-r2-lifecycle-gs40-readingfix-only.log
- sc509-r2-final-{tsc,lint,jest1,lifecycle,e2e,shots,freeze,parity,jest2}.log
- Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc509-r2-impl-B/ (gate scripts, base-src, readingonly-src)
