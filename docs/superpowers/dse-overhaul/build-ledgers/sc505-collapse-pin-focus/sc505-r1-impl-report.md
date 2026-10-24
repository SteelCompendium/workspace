# SC-505 r1 implementer report

## Executive summary
- STATUS: DONE. dse `37da2f2` (5f9f3af fix + jest, 37da2f2 e2e) on origin/develop `a993a60`; superproject `248b3be` (CHANGELOG only, no pointer bump) on origin/main `84b3712`. Nothing pushed.
- Gates on 37da2f2: tsc/lint clean; jest 5970 passed / 1 skipped / 242 of 243 suites (+12 tests, +1 suite; 5969/2 on the fresh tree before shots); lifecycle 36/36 (no G-S39); e2e 118/118 ok, 0 failed, 0 known-bug, coverage 84/84 pairs (+4 tests, +5 pairs); shots 592, 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- Fix lives in the SHARED chrome code: `src/framework/chrome/focusHandoff.ts` (new) + `mountChrome.ts` (Collapse/Expand) + `pipeline.ts` Pin item + `host/adoptView.ts` (claim after adoption). Every element with a chrome panel is covered.
- Survey: on base, keyboard Collapse, Expand and Pin all leave focus on `<body>` on all 4 elements measured (stamina-bar, counter, feature, initiative); with the fix all land on the right button. The code is shared, so the other chrome elements follow (not each measured). No element-specific code was needed.
- Collapse/Expand write NOTHING to the note (session store only). Pin writes the note (`_dse_anchor`) and the block is then rebuilt/adopted/re-inserted up to 3 times within ~200 ms.
- Expand: the restored Collapse button does show a ring (`:focus-within` reveals the panel; measured opacity 1), so the "focus the bar instead" fallback is coded and jest-tested but never needed in e2e.

## Survey table (measured in real Obsidian 1.14.4 via e2e driver; base = fix with `isKeyboardClick` forced false, i.e. base behaviour with the new attribute-only ids; re-measured on a993a60)
| element | has Collapse/Pin | base: kbd Collapse -> | kbd Expand -> | kbd Pin -> | after fix | shared fix |
|---|---|---|---|---|---|---|
| ds-stamina-bar | both (Pin needs experimental) | body | body | body | expand / collapse / pin (ring shown) | yes |
| ds-counter | both | body | body | body | same | yes |
| ds-feature | both | body | body | body | same | yes |
| ds-initiative | both | body | body | body | same | yes |
| every other element with a `chrome` slot (statblock, montage, encounter, scc, values-row, party, hero, display family, tokens, resource, skills, featureblock, surges, negotiation, conditions, project, characteristics) | both (same `mountChrome` + pipeline item) | not measured; same mechanism | | | | yes (shared code; jsdom-tested via the stamina bar pipeline) |
Evidence: `.../scratchpad/sc505-r1-impl-q7x2/survey-base-a993.log`, `survey-fix-a993.log` (survey spec kept as `zz-survey.e2e.ts.txt`, not committed). Earlier b624eef runs: `base-measure4.log`.

Mechanism notes:
- Collapse hides `.dse-chrome` (display none) -> button lost focus. Expand hides `.dse-chrome-summary`. Both fixed synchronously in `mountChrome.apply` when the click has `detail === 0`.
- Pin: the write comes from the sidebar binder, not the view, so nothing adopts the old view. Measured sequence (stamina bar): adopt (focus restored by adoptView) -> fresh render -> Obsidian re-inserting the existing section (no plugin hook runs). A request armed at click time (keyed by `host.blockKey()`, matched lazily because a fresh render mounts before the block position is known) is claimed by every mount/adoption and by a MutationObserver that stays alive while the request lives (extended 1.5 s per success, 3 s after the call returns, 5 s cap). It is dropped as soon as anything else holds focus; a copy that cannot take focus (the hidden Live Preview widget of the same block) leaves it for the visible copy.
- After SC-487 (`a993a60`) an unregistered type writes nothing and shows a Notice: no rebuild, so the pressed button keeps focus; `settleChromeFocus` refocuses it if focus fell to body, and the request lapses in 3 s.

## Tests added
jest `test/dom/framework/chromeFocusHandoff.test.ts` (12, new suite): keyboard Collapse -> Expand with `{preventScroll, focusVisible}`; pointer Collapse+Expand move nothing; keyboard Expand -> Collapse; Expand falls back to the bar when Collapse cannot take focus; keyboard Pin -> rebuilt Pin button; rebuilt twice; pointer Pin moves nothing; Pin that rebuilds nothing refocuses; rebuilt block attached later; hidden copy leaves request for visible copy; user focus elsewhere left alone; unanswered request lapses. `test/dom/e2eCensus.test.ts` and `e2e/specs/_census.e2e.ts` allow the `chrome.*` ids.
e2e `e2e/specs/stamina-bar/chrome-focus.e2e.ts` (4): CHR-F01 Tab+Enter Collapse -> Expand (ring), Enter -> Collapse (ring, panel opacity 1); CHR-F02 Enter on Expand reached by keyboard -> Collapse; CHR-F03 mouse Collapse/Expand moves nothing; CHR-F04 keyboard Collapse+Expand then Tab+Enter Pin (writes once) -> focus on the new Pin button with ring after the DOM goes quiet. New `e2e/manifest/chrome.ts` (5 pairs: collapse press/click, expand press/click, pin press). Driver: `dse.setPrefs(prefs, { experimental: true })` so the Pin item exists (reset by `after`).
Attribute-only ids `chrome.collapse` / `chrome.expand` / `chrome.pin` stamped in mountChrome / pipeline; `ChromeMenuItem` gained optional `control` and `onClick(evt?)`.

## Base-failure evidence
- jest: with mountChrome/pipeline reverted to base, 8 of 12 red (the 4 "moves nothing / lapses / user elsewhere / pointer" tests are guards and pass on base by design; mutations prove them: `isKeyboardClick` always true -> 2 red; expiry check removed -> 1 red; free-focus check removed -> 1 red). Logs `jest-base-red.log`, `mut-A/B/C.log`.
- e2e: with the handoff neutralised (base behaviour): CHR-F01, F02, F04 red (body), F03 green (`e2e-base-red.log`); Pin alone (arm request disabled): CHR-F04 red, "Expected chrome.pin, Received body" (`e2e-pin-red.log`). Green on fix: `g-e2e2.log`.
- G-S39: NOT added. Collapse writes no note; Pin's write + rebuild + adoption + re-insertion is driven in real Obsidian by CHR-F04, and the shared fix is unit-tested; no non-e2e element needs a separate proof.

## Gate summary lines (final head 37da2f2; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-impl-q7x2/`)
- tsc `g-tsc.log` rc 0; lint `g-lint.log` rc 0.
- jest `g-jest2.log` (fresh): `Tests: 2 skipped, 5969 passed`; `g-jest3.log` (after shots): `Test Suites: 1 skipped, 242 passed, 242 of 243 total; Tests: 1 skipped, 5970 passed`. Base a993a60 = 5958 (per owner) -> +12.
- lifecycle `g-lifecycle2.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed` (port 9291).
- e2e `g-e2e2.log`: `OBSIDIAN-E2E done: 118/118 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`.
- shots `g-shots.log` rc 0, 592 PNGs, 0 FAIL; host-copy pin OK (1.15.0), button host-leak OK (113 kinds, 678), modal button host-leak OK (228), text scale OK (1626), text scale once OK (107256 over 214 loads), pressed toggle parity OK (96), pipette OK, chrome host-leak OK (18), expected APP.CSS PIN DRIFT warning.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- parity `g-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Scope fence
Not touched: visual-harness sweep, stepper.ts, Stamina modal focus, FormModal.ts, Live Preview chrome overhang. `adoptView.ts` was touched (one added call) because an adopted view never remounts its chrome.

Drive-by fixes: none.

Follow-ups:
1. "Unpin from sidebar" (sidebar mode `requestRemoval`) destroys the block's panel and its button; keyboard focus then drops to body. Not in the ticket; the element is gone, so a destination (the sidebar's next panel / its header) needs a design call.
2. Obsidian keeps a hidden Live Preview copy of the same block in a Reading-view leaf (`display: none`, same blockKey). Harmless here (the claim skips copies that cannot take focus) but it also shares the collapse session state and may surprise other focus work.
3. A pin that only shows a Notice (unregistered type) leaves the request armed for up to 3 s (a rebuild in that window with focus on body would refocus Pin). Negligible; could disarm when `requestPinToSidebar` reports not-bound.
4. Chrome item ids exist only for collapse/expand/pin; the other items (edit, view items, unpin) still carry none.
5. The e2e vault's "second root in the same leaf" (hidden LP copy) makes `document.querySelector('[data-dse-element=...]')` ambiguous; specs must scope to `.markdown-reading-view` (done here).
6. `app.css`-pinned shots gate prints the expected APP.CSS PIN DRIFT warning (not caused by this change).
