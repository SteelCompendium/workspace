# SC-510 r1 implementer report

## Executive summary
- Verdict: DONE. The block edit form preview now shows only the current box text; mount rejections are caught.
- dse branch `sc510-form-preview-stale-error`: red test 47892bb, fix be35c6a (base 253aa5f = origin/develop, unmoved after fetch). Superproject: CHANGELOG dca5433 (on 104dd85); dse pointer NOT bumped (`M draw-steel-elements` is left unstaged).
- Red on 253aa5f: 13 of 17 new tests fail (feature x4, statblock x4, ds-scc x1, mount-fails x4). Green on be35c6a: 17/17. Without the `.catch` only the 2 unreadable-block tests fail.
- Gates on final HEAD: tsc (incl. -p e2e) clean, lint clean; jest 6091 passed / 1 skipped / 246 of 247 suites after shots (6090 / 2 skipped on the fresh worktree before shots); lifecycle 38/38; e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87 pairs; shots 592, 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- No lifecycle scenario added (jest reaches the real path); no G-S46.
- Not reproduced as stated: the ticket's "self-referencing `@Note.md` -> 12 YAMLParseError rejections". Details below. The unhandled-rejection class IS reproduced and fixed through a referenced block the element cannot read.
- Residual found (element code, off limits): "Reference nesting too deep" can still show in the preview if the same reference is retyped while an earlier mount of it is pending. Follow-up 1.

## Design
`renderPreview` (src/authoring/FormModal.ts) now creates a fresh `div.dse-form__preview-slot` inside `.dse-form__preview` on every valid render, and passes it as BOTH `containerEl` of the preview host and the root of `view.mount(slot, model)`. The next render still calls `previewEl.empty()`, which detaches the previous slot; a stale mount that finishes late writes only into its own detached slot. `view.mount(...)` is `.catch(() => {})`-ed instead of `void`-ed.
`data-dse-readonly` stays on the outer `.dse-form__preview` (the box), so the badge CSS (`[data-dse-readonly]`, `position: relative`, `::after`) is unchanged. No CSS change, so no frozen byte moved.

## Checks asked for in step 2
- Read-only badge: still `data-dse-readonly="true"` on `.dse-form__preview` for a valid preview and removed on an emptied/invalid one (pinned in my tests: `expectOnlyRef` and the clearing test; SC-493 r2's existing test also still passes).
- CSS selectors assuming the view root is a direct child of `.dse-form__preview`: grep of `dse-form__preview` across src/, styles-source.css, visual-harness: no CSS rule references it at all (only FormModal.ts, tests, and 3 lifecycle `querySelector('.dse-form__preview')` presence checks). Nothing to adjust.
- Lifecycle leak: the previous view is still `lifecycle.removeChild`-ed on each render. Pinned by a test: after 7 keystrokes only the last preview view is `_loaded`.
- Caught mount rejection, what the user sees: the slot keeps whatever the mount drew before it failed (for a failed `@path` mount, nothing), so the preview box is blank with the "Read-only" badge. No error text, no new UI. Owner may want a message here (Follow-up 2).
- Integrity: after char-by-char `@Ref.md`, Save writes exactly `@Ref.md` in the fence (feature and statblock); the lines above ("Above.") and below ("After.") the block are untouched; re-rendering the written body shows Ref.md's content with no error card. Save path untouched.

## Red evidence on 253aa5f
Full log: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r1-red-jest.log (`Tests: 13 failed, 4 passed, 17 total`). Typical lines:
- natural timing, feature: `Expected pattern: not /not found|Reference file/` / `Received string: "Feature: failed to render (render)Reference file (Ref.m) not found in root, DS Compendium, or when searching the cache" + Ref Strike card + Ref Strike card again`
- earlier lookups land after the latest: `Expected substring: "Ref Strike"` / `Received string: "Feature: failed to render (render)Reference file () not found ..."` (same for statblock with "Ref Bandit")
- clearing to invalid box while pending: `Expected: 0 / Received: 2` (`.dse-form__preview` children)
- ds-scc: `Expected pattern: not /Panther/i` / `Received string: "Not installed locally.View on steelcompendium.ioRun "Sync compendium"... Martial KitPantherEquipment..."` (kit card resurrected under the notice)
- unreadable referenced block: jest-circus reports unhandled `TypeError: Cannot read properties of null (reading 'effects')` (feature, `FeatureConfig.readYaml` via `RefUnwrapView.resolveLegacyRef`) and `_a.map is not a function` (statblock): 5 rejections per test.
Tests that pass on base (guards kept): Save integrity (x2), no-leak of earlier preview views (x2).

## Tests (test/dom/authoring/formModalStalePreview.test.ts, 17 tests, real pencil -> real FormModal -> real feature/statblock/ds-scc, real ReferenceService and compendium index)
Per feature and statblock: natural timing; lookups released in typing order after the last keystroke; earlier lookups released after the latest (reverse); clearing to invalid (`name: [unclosed`) with a lookup pending; Save integrity; no leaked views; unreadable referenced block; self-referencing `@Note.md`. Plus one ds-scc test. Race control: `holdLookups` wraps `deps.refs.resolve` so each keystroke's lookup finishes only when the test releases it (deterministic); ds-scc wraps `compendium.getEntity`.
Unhandled rejections are counted by jest-circus itself (a process-level `unhandledRejection` listener in the jest sandbox does not fire; circus fails the running test with the rejection instead). I verified the mechanism: removing only the `.catch` fails exactly the 2 unreadable-block tests.

## Not reproduced as written (self-referencing @Note.md)
I tried a note whose first ds block is `@Note.md` (the lookup throws "Failed to parse YAML in Note.md", which RefUnwrapView catches), and variants of other first blocks. None gave a YAMLParseError rejection from `RefUnwrapView.onMount` on 253aa5f. The rejection class is real but needs a lookup that succeeds while `base.parse` then throws (a referenced block that is valid YAML but unreadable by the element: feature `# only a comment`, statblock `features: {a: 1}`). The self-referencing test is kept; it passes only after the fix (its reverse-order release hit the stale `@` error at base).

## ds-scc reachability
Reached. At base a valid code's slow `getEntity` mount that lands after the box became an uninstalled code resurrects the kit card under the notice (red above). Char-by-char typing of a code alone does not race, because each partial code answers synchronously; the race needs a valid code followed by an edit.

## Lifecycle scenario
None added. Jest reaches the real FormModal, real elements and real reference service; the race is about promise ordering, which the held lookups control. No G-S46.

## Diff stat (dse, 253aa5f..be35c6a)
src/authoring/FormModal.ts +10/-2; test/dom/authoring/formModalStalePreview.test.ts +289 (new). Superproject: CHANGELOG.md +7.

## Gates (logs in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/: tsc.log, lint.log, jestfull1.log (before shots), jestfull2.log (after shots), lifecycle.log, e2e.log, shots.log, freeze.log, parity.log)
- tsc: rc 0. lint: rc 0 (only the existing `.eslintignore` warning).
- jest before shots: 6090 passed / 2 skipped / 246 of 247 suites; after shots: 6091 passed / 1 skipped / 246 of 247 (base 6074 + 17).
- lifecycle (port 9293): `OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: 592 files, 0 FAIL; host-copy pin OK; button host-leak 113 kinds / 678; modal host-leak OK (10 scenarios, 228).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
Note: the shots gate exceeded the 600 s tool timeout and the harness moved it to the background; I waited on its PID (`tail --pid`), no polling, and it finished rc 0.

## Setup note
The fresh worktree had no `node_modules`; I ran `npm ci --prefer-offline` inside the dse worktree (lockfile identical to the main checkout's). Nothing outside the worktree was touched.

Drive-by fixes: none.

Follow-ups:
1. `RefUnwrapView`'s module-level `IN_FLIGHT_REFS` guard is keyed by `blockKey|ref`, and the preview's blockKey is constant (`...::form-preview`). A stale (already unloaded) mount of `@Ref.md` that is still waiting counts as in flight, so retyping the same reference before it finishes shows "Reference nesting too deep" in the preview (reproduced in a scratch test; not committed). Fix belongs in element code (release the guard when the view unloads) or a unique preview blockKey per render (which would reset session UI state such as tab choice between keystrokes). Off limits here (D2).
2. A rejected preview mount leaves a blank preview with the Read-only badge and no message. If a message is wanted (for example the error text from the failed read), that is a small UI addition for the owner to rule on.
3. SC-493 review's "12 unhandled YAMLParseError rejections for a self-referencing @Note.md" does not reproduce on 253aa5f (see above); the ticket text may want that example corrected.
