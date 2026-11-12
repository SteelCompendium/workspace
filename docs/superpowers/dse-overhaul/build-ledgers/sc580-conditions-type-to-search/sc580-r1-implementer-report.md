# SC-580 r1 implementer report

**Executive summary**
- STATUS: DONE. `origin/develop` still `3ad68185` (no rebase). Plugin branch `sc580-conditions-type-to-search` head `7a88aa1d` (2 commits: `7a6fbf7e`, `7a88aa1d`); superproject head `b51ddd17` (CHANGELOG + pointer). Nothing pushed.
- Mechanism: a DOM `keydown` listener on the modal's dialog element, registered through `this.lifecycle.registerDomEvent` (no scope, no document listener). Real Obsidian 1.14.4 delivers the key: COND-N07 and COND-N10 are red on the base source and green on the fix.
- tsc and lint clean · jest **10697 passed / 2 skipped** (base 10676 / 2, +21 new) · lifecycle **59/59** (21+16+9+4+7+2) · e2e **`282/285 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** · shots **592**, button host-leak 163 / 978, modal host-leak 39 kinds / 234, capture clip 147 · freeze **280/280** · parity **0 gaps / 0 undeclared / 24 declared**.

## Change
- `src/views/ConditionsModal.ts`: `onOpen` registers `keydown` on `this.modalEl ?? this.containerEl` -> private `typeToSearch(evt)`. Skips: `defaultPrevented`, `isComposing`, ctrl/meta/alt, `key.length !== 1`, space, and a target inside `input, textarea, select, [contenteditable]:not([contenteditable="false"])`. Otherwise: open the Add search by the click path (`addOpen = true; renderAdd()`), or reuse the open one; `preventDefault()`, focus the input, append the key, caret to the end, dispatch `input` (from the input's own window) so the dropdown filters. The 2nd and 3rd keys of `daz` then target the input, so the listener ignores them and the browser types them.
- Modal-above rule: the listener sits on this modal's own dialog element, so a key from a stacked modal (a sibling container) never reaches it.
- Escape (SC-431) untouched: `key.length` 6, never routed; the escape consumer path is not edited.
- `docs/initiative-tracker.md:440` -> "(or just start typing a condition's name)". `CHANGELOG.md` Unreleased bullet (superproject).

## Tests
- jest (`test/dom/views/conditions-modal-matrix.test.ts`, new `SC-580` describe, +21): opens on a letter by the click path (value, focus, filter, key swallowed, no emit); fast `daz` (2nd/3rd keys not routed, Dazed offered, pick emits); Shift letter; digit/punctuation; from other controls (remove, Done); already-open appends to the end and focus moves; 10 `test.each` negatives (Space, Enter, Tab, arrow, Escape, Backspace, Ctrl, Meta, Alt, IME); defaultPrevented; text-entry controls (icon search input, select, textarea, contenteditable and its child); `contenteditable="false"` routes; key from a modal stacked above; listener removed on close and none on `document`. Old line-569 comment replaced by the describe. 7 of the 21 fail on the base source (the opening ones); the negatives are regression guards.
- e2e (`e2e/specs/conditions-modal/cond-integrity.e2e.ts`): COND-N07 is now a regular test (marker and "no control is meant to handle it yet" comment dropped; types `daz`, asserts focus, value `daz`, options `['Dazed','Add custom: "daz"']`, no write, then Enter adds Dazed). New COND-N08 (Space on focused + Add condition: opens empty; asserts the raw `input.value` is `""` because `toHaveValue` trims), COND-N09 (Control+d and Meta+d: no input, focus stays, no write), COND-N10 (open, type `da`, Tab out, `z`: value `daz`, focus back). ids N08-N10 were unused (grep). Manifest: `cond.add` gains `press:Space` (172 pairs); the Tab / letter / chord presses are page-level, so no other pair.
- Mutation checks (real Obsidian, logs below): base source -> N07 and N10 FAIL, N08/N09 pass; source with the modifier and space guards removed -> N08 FAIL (value `" "`) and N09 FAIL, N07/N10 pass.

## Gate numbers (all measured here)
| gate | result |
|---|---|
| tsc (incl. `-p e2e`) / lint | clean / clean (rc 0 / 0) |
| jest | 10697 passed, 2 skipped, 265 of 266 suites (fresh worktree; 78 s) |
| lifecycle | 21/21 + 16/16 + 9/9 + 4/4 + 7/7 + 2/2 = 59/59, 0 failed |
| e2e | `OBSIDIAN-E2E done: 282/285 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (known: SC-257, SC-355, SC-384) |
| shots | 592 ok; button host-leak OK (163 ... 978); modal button host-leak 39 kinds / 234; capture clip OK (147), rc 0 |
| freeze | `freeze OK (280/280 ...)` |
| parity | 0 gaps, 0 undeclared warnings, 24 declared, rc 0 |

## Notes
- The first lifecycle part-1 run was killed by my own `timeout 170` wrapper (19/21 + SIGTERM, log `sc580-r1-gate-lifecycle-part1-killed` not kept; the rerun without the wrapper is the part-1 log).
- The e2e lint fix to `ConditionsModal.ts` (avoid `globalThis` cast) landed in commit 2 rather than commit 1, so commit 1 alone fails lint; the head is clean.

Drive-by fixes: none.
Follow-ups: none new. (`Space` on the focused + Add condition button and keys from the row editor's select-less chips behave as before; the chips are buttons, not selects, so a letter pressed on a focused duration/effect chip now opens the Add search, which follows the stated rule.)

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/sc580-r1-implementer-report.md`
- Logs (same dir): `sc580-r1-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..6.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`, `sc580-r1-e2e-base-red.log`, `sc580-r1-e2e-mutant-no-modifier-no-space.log`
