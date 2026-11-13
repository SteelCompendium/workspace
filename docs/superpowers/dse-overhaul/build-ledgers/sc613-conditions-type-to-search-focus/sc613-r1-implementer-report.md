# SC-613 r1 implementer report

**Executive summary**
- Verdict: DONE. Option (a) implemented as ruled; every gate green at the expected numbers.
- Plugin (dse, branch `sc613-conditions-type-to-search-focus`, base `14521bf0`, origin/develop unchanged): head `8978b6f0` (3 commits: `b18c2fb7` fix, `d2048470` jest, `8978b6f0` e2e). Superproject branch head `e534de69` (CHANGELOG bullet only; no pointer bump committed).
- Gates: tsc + lint clean · jest 11852 passed / 2 skipped (11833 + 19) · lifecycle 63/63 (21+16+9+4+7+4+2) · e2e `337/340 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (+3: COND-N12..N14) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Measured in real Obsidian: an open Obsidian menu does NOT cancel a letter (body keydown reaches the document, `defaultPrevented` false), so without a guard the search opens under the menu. A `.menu` guard is therefore in the fix. The `.suggestion-container` half of the guard is NOT measured (could not open one over the window); it is cheap defence, covered by jest only.
- Mutants: 6, all killed (details below). 8 of the 19 new jest tests are red on `14521bf0`; the other 11 are negative guards that cannot be red on a base with no listener (each is killed by a mutant instead). New e2e COND-N12/N13/N14 are all red on base.

## What changed (src/views/ConditionsModal.ts, +18 / -1)
- `onOpen`: a second `keydown` listener on `this.containerEl.ownerDocument`, registered with `this.lifecycle.registerDomEvent` (so it is removed on close; popout-safe).
- New private `typeToSearchFromPage(evt, doc)`: returns unless the event is not `defaultPrevented`, its target is `doc.body` or `doc.documentElement`, no `.menu, .suggestion-container` is in the document, and this window's `containerEl` is the LAST `.modal-container` of the document. Then it calls the EXISTING `typeToSearch(evt)` (not forked): same key filter (printable, no Ctrl/Meta/Alt, not Space, not IME composition, not text entry).
- `typeToSearch`: `returnFocusEl` is left null when the target is body / documentElement (no control to give focus back to), so Escape lands on "+ Add condition".

## Choices inside the ruling
- Menu / popover guard: measured, needed (see below); `.menu` + `.suggestion-container` presence in the document.
- Scope-already-handled guard: not needed. Obsidian's keymap returns false (preventDefault + stopPropagation) for keys its scopes take, and those never reach a bubble listener on the document (measured: ArrowDown with a menu open never arrived); the `defaultPrevented` check covers the rest.
- Top-most: last `.modal-container` in DOM order of the modal's own document.
- Escape: confirmed. A search opened by a routed body key returns focus to "+ Add condition" (jest + e2e COND-N12), `body` is never refocused.
- No double firing: the target filter (body/html) is disjoint from the in-modal listener's targets (inside `modalEl`), so the two never act on one key; jest asserts exactly one letter in the input and one `typeToSearch` call.
- Listener removal on close: jest spies `document.addEventListener/removeEventListener('keydown')`, asserts the same function is removed on close, and that a body key after close calls nothing (M6 mutant, a raw `addEventListener`, is killed by it).

## Real-Obsidian measurement (scratch spec, deleted, not committed)
Setup: Conditions window open, title clicked (focus on `<body>`), then the file explorer's context menu requested by dispatching `contextmenu` on `.nav-file-title, .tree-item-self` (a real right-click cannot reach the page behind the window); `Menu` is not a global in the page (`typeof Menu === 'undefined'`), so the explorer item was used.
- Menu open, real key `d`: document bubble listener saw `{key:'d', target: body, defaultPrevented:false}`. With the guard: no search. Without the guard (mutant M2, probe re-run): `.dse-condal__input` appeared and the event was `defaultPrevented:true`, i.e. the window stole the key from the menu.
- Menu open, ArrowDown: never reached the document (the menu's scope swallowed it). Escape closed just the menu, the window stayed.
- After the menu closed, `daz` opens the search with "daz" (COND-N14).
- Title click: `document.activeElement === document.body` afterwards (asserted in COND-N12). Footer-left click (24 px in from the left edge of `.dse-modal__footer`, whose only control "Done" is at the right): body too (COND-N13).

## Tests
jest, `test/dom/views/conditions-modal-matrix.test.ts` (+19; one existing test reworded):
- Title / empty-space click then a letter (2, test.each): input holds the letter, focused, key swallowed, Dazed offered.
- Through `<html>` and "daz" typed fast: exactly "daz", not routed twice.
- Search already open, focus on body: letter appended.
- Escape on a body-opened search: lands on "+ Add condition", window stays open (SC-431 order).
- Stacked modal above: nothing; one stacked below: still routed.
- Modifier / Space / Enter / Escape / arrow / IME on body (8, test.each): nothing, not preventDefault-ed.
- defaultPrevented before the document: nothing.
- A control outside the window (target neither body nor in the window): nothing.
- `.menu` / `.suggestion-container` present: nothing; removed: routed again.
- No double routing with focus inside the window.
- Listener on the document via lifecycle: added once, the same function removed on close, a body key after close routes nothing.
- Reworded existing SC-580 test (it asserted "nothing is on the document", which is no longer true by design): now "in-window listener dies with the window", the document-level listener has its own test above.

e2e, `e2e/specs/conditions-modal/cond-integrity.e2e.ts` (ids grepped across all specs first; N12-N14 were free; no bracketed ticket id in any title, SC-613 only in comments):
- COND-N12 real click on the window's title, real typing `daz`: search open with "daz", Dazed offered, no write; Escape closes just the search, focus on "+ Add condition".
- COND-N13 real click on empty space, `daz`, Enter adds Dazed (one write).
- COND-N14 menu open over the page, body focus: `d` opens nothing, menu stays; Escape closes the menu, window stays; `daz` then opens the search.
- Raw wdio `$` clicks on neutral chrome (no `data-dse-control`), so no new coverage pair: 176/176 unchanged. No lifecycle scenario added (G-S116 unused).

## Mutant check (revert only the code; tests kept). Logs: `sc613-r1-mutant-*.log` in this directory
| Mutant | jest (matrix file, 367 tests) | e2e (N07, N11-N14) |
|---|---|---|
| M1 fix reverted to `14521bf0` `ConditionsModal.ts` | 8 failed | N12, N13, N14 FAIL (N07, N11 ok) |
| M2 menu guard removed | 1 failed (menu test) | N14 FAIL |
| M3 top-most check removed | 8 failed (see note) | 5/5 ok (no stacked-modal e2e) |
| M4 target filter removed | 1 failed (control-outside test) | 5/5 ok |
| M5 `returnFocusEl` set for body | 1 failed (Escape test) | N12 FAIL |
| M6 raw `addEventListener` instead of lifecycle | 1 failed (listener lifecycle test) | 5/5 ok |
All restored (`git status` clean at HEAD).
Note on M3: the 8 failures include tests that fail because earlier tests in the file leave unclosed modals whose document listeners survive `document.body.innerHTML = ''`; with the top-most check removed those stale modals take the key first. The check is what filters them. This is harmless in production (a closed modal removes its listener) and is why the check is proven, but it means M3 is not killed by the stacked-modal test alone.
Note on an invalid first M3 attempt: removing the line left `modals` unused; I redid it as `void modals;` (same result).

## Gates (logs in this directory, `sc613-r1-gate-*.log`)
- tsc (`tsc --noEmit && tsc --noEmit -p e2e`) and lint: clean, rc 0 / 0 (`sc613-r1-gate-tsc-lint.log`).
- jest, fresh (`rm -f main.js styles.css`, no shots cache): 11852 passed, 2 skipped, 276 suites passed + 1 skipped (`sc613-r1-gate-jest.log`).
- lifecycle: part1 21/21, part2 16/16, part3 9/9, part4 4/4, part5 7/7 (G-S91 green first run), part6 4/4 (G-S97 green, no appearance.json dirt), part7 2/2 = 63/63.
- e2e: `OBSIDIAN-E2E done: 337/340 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`.
- shots: 592 files, 0 FAIL; `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 40 button kinds … = 240 comparisons …)`, `capture clip OK (147 …)`.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- Base verified: `git fetch origin` done, `origin/develop` = `14521bf0`, no rebase needed.

## Drive-by fixes
None.

## Follow-ups
- `.suggestion-container` in the guard is unmeasured in real Obsidian (no way found to open one over the Conditions window). Keep or drop at the owner's call; jest-only coverage.
- The jest matrix file never closes most of the modals it opens, so their document-level keydown listeners accumulate across tests (the top-most check hides it). A file-level `afterEach` that closes opened modals would remove the cross-test coupling; not done (out of scope, and it would touch every test's lifecycle).
- Real Obsidian's modal DOM order for "top-most" is assumed to be append order (a later `.modal-container` is on top); consistent with measurement (a single modal), not measured with two stacked modals in the app.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/sc613-r1-implementer-report.md`
- Gate logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/sc613-r1-gate-{tsc-lint,jest,e2e,shots,freeze,parity}.log`, `sc613-r1-gate-lifecycle-part{1..7}.log`
- Mutant logs: `…/sc613-r1-mutant-{M1-revert-fix,M2-no-menu-guard,M3-no-topmost,M4-any-target,M5-body-return-focus,M6-no-lifecycle}-{jest,e2e}.log`
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus/draw-steel-elements`; superproject: `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus`
- Scratch (private): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc613-r1-impl/`
