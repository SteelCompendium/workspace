# SC-598 r2 implementation report (identity I1)

## Executive summary
- STATUS DONE. dse branch `sc598-hover-modal-fast-second-click`, head `47950f45`, rebased onto `origin/develop` `e0e49d4d` (SC-588; the owner moved the target twice, e5b6f9f2 -> ce4937ef -> e0e49d4d). Range-diff of my commits across both rebases: all `=` (`sc598-r2-range-diff.log`). Superproject `2a8b0b36` (CHANGELOG only; dse pointer NOT bumped, left as an unstaged change).
- Gates at head: tsc (incl. `-p e2e`) rc 0, lint rc 0 · jest **7317 passed / 2 skipped** (7304 + 13 new; 263 of 264 suites, 97 s, no SC-568 timeouts) · lifecycle **57/57** = 21 + 16 + 9 + 4 + 7, wall 185 / 324 / 404 / 299 / **384 s** (part 5 under the ~420 s ceiling; part 3 unchanged, no G-S64 change) · e2e **`270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (128 s, RECOV-R07 passed).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` on both the head build and an `e0e49d4d` archive build (identical): shots, freeze, parity carry, not re-run.
- G-S91 (part 5, after G-S87, before G-S56): **red on the `e0e49d4d` bundle, 5/5 trials** ("the preview was gone" at 700 ms), **green on the head** (alone 43 s; gaps 52-66 ms title/apply, 99-101 ms queued double-click). Base bundle used: `e0e49d4d` (plugin code identical to `e5b6f9f2`; styles sha equal).
- Mutants: **42/42 killed** (19 SC-598 mutants N1-N17 with a/b variants, plus the 23 SC-597 mutants against the UPDATED SC-597 tests). Two first-pass survivors (N16 not cancelable, N17 no `view`) led to two added assertions; N7 is equivalent for anchors outside a preview (see below).
- O8 survey: **no conflict** in either (i) or (ii); including SC-588's `controlFocus.ts` (no event listeners at all; called only from the onClick of the Reset-encounter item and from the rebuild paths, none is on the synthetic click's path). Tables below.
- Not touched: openers, `HOVER_HELPER_DELAYS_MS`, the document guard, SC-597's `el.click()`. Commits carry no Co-Authored-By trailer (the user's global CLAUDE.md forbids it and takes precedence over the attribution reminder).

## Commits
dse (`/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click/draw-steel-elements`), over `e0e49d4d`:
- `3befe3ff` fix(SC-598): `managedModal.ts` `focusHoverPreviewNow` (called from the opening click's window-bubble listener before `arm()`); the 6 SC-597 assertions updated; the preview stand-in `test/dom/_hoverPreviewStandIn.ts`; 10 tests in `managedModal.test.ts`, 3 in `stamina-bar.test.ts`.
- `fb1761ba` test: the synthetic click is cancelable and carries the window as `view` (kills N16, N17).
- `47950f45` test: lifecycle G-S91 (header paragraph, `gs91Trial`, scenario).
Superproject (`/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click`): `2a8b0b36` docs(SC-598) CHANGELOG bullet under `## Unreleased` (O11 text verbatim in the body).

## Product change
`src/framework/kit/managedModal.ts` only (+38/-2): in `onWindowBubble`, `if (evt !== opening) return; this.focusHoverPreviewNow(opening, win); arm();`. New private method `focusHoverPreviewNow(opening, win)`: for an anchor inside a `.hover-popover` without `.is-editing`: `opening.preventDefault()`; add `interactive-child` to the anchor only if absent; dispatch one `click` (`bubbles`, `cancelable`, `view`, built with the anchor's window's `MouseEvent`) on the anchor; remove the class from a 10 ms `win.setTimeout` armed after the dispatch. Doc comment (r1 §4) on the method; one pointer sentence added to `keepHoverPreviewAlive`'s scope-order paragraph. The non-click branch (`else arm()`) is unchanged. tsc forced `win: typeof window` (not `Window`, and eslint `no-global-this` forbids `Window & typeof globalThis`).

Notes found while implementing:
- Outside a preview `keepHoverPreviewAlive` is not reached at all (`open()` calls it only when the anchor is inside `.hover-popover`), so the method's own `!pop` guard is defence in depth.
- A modal opened by a click INSIDE another modal (the free-heal confirmation, nested forms) never reaches `onWindowBubble`: the parent's document guard stops the click before the window. So (b) is a no-op there, as `arm()` already was. Not a regression; no behaviour change.

## O8 (i): every preview opener element, and whether the opening click's default action matters
`preventDefault()` on the opening click cancels only that click's default action. Checked by reading each opener's element and handler.

| Opener (file:line) | Element the click lands on | Default action of a click | Verdict |
|---|---|---|---|
| Stamina bar, text and elsewhere (`StaminaBarPanel.ts:116,147`) | `div.dse-stamina` (target may be its `span.dse-stamina__ccur`, `.dse-stamina__cnums`) | none (div/span; no `<a>`, `<label>`, form ancestor) | safe |
| Stamina bar keyboard (`StaminaBarPanel.ts:196-201`, SC-597 `bar.click()`) | same `div` | none | safe |
| Hero sheet stamina bar (`hero/view.ts:331-335`, same `renderStaminaBar`) | same `div.dse-stamina` | none | safe |
| Initiative hero / detail numeric stamina control (`initiative/view.ts:1073-1087`, `:1565`, `:1920`) | `iconButton` -> `button.dse-btn type="button"` (`iconButton.ts:96-97`) | explicit `type="button"`: no submit; no `<form>` in any card | safe |
| Initiative row bars (`buildRowStamina`, `:1552`, `:1901`) | the kit stamina bar `div` | none | safe |
| Initiative grid cell (`:1775`, `dblclick`) | `div` cell | not a `click`: `window.event.type` is `dblclick`, the non-click branch runs, (b) is not entered | n/a, unchanged |
| Initiative "Add Condition" (`:2176-2186`), Reset encounter / Reset turns chrome items (`:300-325`) | `iconButton` `button type="button"` | none | safe |
| Montage board cell, logged or past-empty (`BoardView.ts:360-377`) | `div[role=button][tabindex=0].dse-mt__cell` (children `span`/`div`, `aria-hidden` glyphs) | none | safe |
| Montage empty current cell (`BoardView.ts:398`) | `div.dse-mt__cell` | none | safe |
| Montage "Log an action…", Undo, Back, config buttons (`montage/view.ts:255` ff.) | `iconButton` `button type="button"` | none | safe |
| Conditions panel "+" (`conditions/panel.ts:168`) | `iconButton` | none | safe |
| Block edit form pencil (`pipeline.ts:561-563` `openForm(evt)` -> `openFormEditor`) | chrome `iconButton` `button type="button"` | none. `formOpenerOf(evt)` reads the opening click synchronously inside the handler, which runs before (b) | safe |
| Nested modals (free-heal Confirm, etc.) | buttons inside a modal | n/a: the click never reaches the window listener | n/a |

Elements in the codebase that DO have a default action (`<a>`: `SidebarPanel.ts:224`, `RefUnwrapView.ts:415`; `<label>` / checkbox: `rollBar.ts:179`, `ArgumentView.ts:265`, `project/view.ts:212,248`, modal-internal checkboxes and swatches) are not openers of an anchored modal. Also unaffected: focus and text selection (decided by `mousedown`, not `click`), and keyboard activation (a `button` activated by Enter/Space fires a click; its default-prevention changes nothing).

## O8 (ii): every DSE click listener on the anchor (`cx.host.containerEl`) or an ancestor (up to `window`)
The synthetic click is dispatched ON the anchor and bubbles anchor -> ancestors -> document -> window; it never enters descendants. Exhaustive grep of every `'click'` / `'auxclick'` listener in `src` and `main.ts`.

| Listener | Where it sits | On the synthetic click's path? | What it does with `target === anchor` |
|---|---|---|---|
| `pipeline.ts:221-222` `armClickShield` (capture + bubble on `root`) | `root` = `containerEl.createDiv()` (`pipeline.ts:467`): a CHILD of the anchor | no | n/a |
| `sccLinkClickHandler.ts:109` (document capture) | document | yes | `target.closest('a')` is null for the anchor div, returns false, event untouched |
| `RecoveriesStrip.ts:308` (activeDocument click-outside) | document | yes | `if (!popover) return`; with the popover open it would close it, but the opening click did that first; harmless second call |
| `ConditionsModal.ts:210` `closeIfArmed` (document capture, registered by an OPEN ConditionsModal) | document | yes, only while a ConditionsModal is already open (not possible behind a modal) and its own `addOpen`/`outsideDown` state is off at open | no-op |
| `managedModal.ts` document guard (bubble) | document | yes | `composedPath().includes(this.containerEl)` is false for the anchor: not stopped |
| `managedModal.ts` `onWindowBubble` (window bubble, one per preview-opened modal) | window | yes | `evt !== opening` returns at once: no recursion, no second `focusHoverPreviewNow`, no second `arm()` |
| `collapsible.ts:93`, `iconButton.ts:129`, `StaminaBarPanel.ts:147`, `BoardView.ts:377,398`, `track.ts`, `tabs.ts`, `rollController.ts:102`, `powerRollPanel.ts`, `CharacteristicsGrid.ts`, `RecoveriesStrip.ts:212-243`, `undoNotice.ts`, `initiative/view.ts:475`, `SidebarPanel.ts:231`, negotiation chips, modal-internal listeners (`ConditionsModal`, `MinionStaminaPoolModal`, `LogActionModal`) | all on DESCENDANTS of the anchor (cards, controls) or inside modals | no (an event dispatched on the anchor never visits descendants) | n/a |
| `focusHandoff.ts:149` (`focusin`, capture) and SC-588's `controlFocus.ts` | not click listeners; `controlFocus.ts` has no listeners, `capture/restoreControlFocus` run from the Reset-encounter item's onClick and from `rebuildAndPersist` / `rebuildFromWrittenReset` only | no | a `dispatchEvent(click)` moves no focus; nothing in the initiative view's new focus code is reachable from a click on the anchor |

No listener on the anchor or above acts on the synthetic click, and none can open a modal (every modal opener is a listener on a descendant, as in the O8 (i) table). No host class (`ReadingModeBlockHost`, Live Preview, sidebar) registers a click listener on `containerEl`. Obsidian's own listeners on the anchor's ancestors (the helper, `T3`, Live Preview widget handlers) are what (b) is for; `T3` treats the synthetic click as inside the preview (target in `hoverEl`); r3 probes the rest in real Obsidian. No conflict, so no NEEDS_CONTEXT.

## jest
Added (13; titles carry no bracketed ticket id; Obsidian's delays are the literals 10 / 150 in `test/dom/_hoverPreviewStandIn.ts`, which never reads `HOVER_HELPER_DELAYS_MS`):
- `managedModal.test.ts`, describe "SC-598: a click inside a modal opened from a hover preview, right after the click that opened it" (10): title click at 20 and 100 ms closes neither modal nor preview (2); a focus move at 5 ms leaves no source editor; scope order at 20 / 200 ms and after close; exactly two clicks reach the preview (opening click default-prevented, target text; synthetic one: target anchor, bubbles, cancelable, `view` window, no coordinates, `interactive-child` present only during it; one modal); `.is-editing` preview gets one click, not default-prevented; control outside a preview; a delayed (non-click) open sends no click; `interactive-child` class present at 9 ms and gone at 20 ms, with and without a pre-existing class (2).
- `stamina-bar.test.ts`, describe "SC-598: the Stamina modal opened by a click on the bar's numbers in a hover preview" (3): title and Apply input at 20 ms (the view's unload closes the modal when the stand-in hides the preview), and the editor guard. The r1 plan said 1 test here; three keep each assertion focused.
- The stand-in `T3` collects the preview synchronously and hides it 5 ms later even if it becomes focused meanwhile (as Obsidian's).
Updated (O7, 6): `stamina-bar.test.ts` "Enter" / " " and the four `montage.test.ts` "sends one click through the preview to the cell" cases now assert `clicks` has length 2, exactly one with the opener as target (the key's click) and exactly one with the anchor as target (the synthetic one), plus the old assertions. Measured earlier on the unmodified prototype: those 6 failed, the other 488 hover-suite tests passed.

## Mutants (`sc598-r2-mutants.log`, runner `sc598-r2-mutate.py.txt`)
| Id | Mutant | Killed by |
|---|---|---|
| N1 | `managedModal.ts` back to `e5b6f9f2` | 14 tests (title at 20 / 100, editor, scope, two clicks, stamina trio, SC-597 updated tests) |
| N2 | no `preventDefault` | 3 (editor guard in both suites, two-clicks test) |
| N3a / N3b | synthetic click not bubbling / dispatched on the anchor's first child (the opener) | 8 / 15 (title tests never reach the helper; N3b opens a second modal) |
| N4a | no `interactive-child` | 4 (editor guard, two-clicks `classAtEachClick`, class test) |
| N4b | class removal timer armed before the dispatch | 2 (editor guard in both suites) |
| N5 | `focusHoverPreviewNow` after `arm()` | 5 (scope order and the SC-595 ordering tests) |
| N6 | no `.is-editing` check | 1 (the `.is-editing` test) |
| N7 | `preventDefault` above the preview guard | 1 (the `.is-editing` test); equivalent for an anchor outside a preview, where `keepHoverPreviewAlive` is never reached |
| N8 | class never removed | 1 (class removal) |
| N9 | synthetic click carries the opening coordinates | 8 |
| N10 | `HOVER_HELPER_DELAYS_MS = [10]` | 2 (SC-595 literal-delay tests) |
| N11 | synthetic click also in the non-click branch | 9 |
| N12 / N15 | removal not guarded by `added` / `added = true` (a pre-existing class stripped) | 1 / 1 |
| N13 / N14 | class removal at 50 ms / 0 ms | 1 / 3 |
| N16 | synthetic click not cancelable | 1 (added `cancelable` assertion; first pass SURVIVED) |
| N17 | synthetic click without `view` | suite crash (jsdom `_location` of null) and the added `view` assertion (checked by hand: 1 failed, 61 passed); the runner first labelled the crash SURVIVED, fixed to count any non-zero rc |
| K1s-K5m, K6, G1-G6 (x2) | the 23 SC-597 mutants | 23/23 killed against the updated tests |
Total 42/42 killed. Each restored with `git checkout HEAD -- file`, `git diff --stat` verified empty each time.

## Lifecycle G-S91
Part 5, after G-S87, before G-S56. Fixtures `gs83-stam*` (shared); no new fixture. Trials (5): RV title, LP title, RV dblq, LP dblq, RV apply. Real CDP presses on the bar's "15" (assert `elementFromPoint` is the number's own element, as G-S83 `stamtext`: outcome shows `"15" on dse-stamina__ccur`); second press within the helper's 150 ms (title / apply in-page gap 52-66 ms; the title / apply gap gate fails the trial at 140 ms or more as vacuous; the queued double-click is red on base at any gap because its second mousedown clears the helper's timer, so no gap gate there, gaps 99-101 ms); assert preview shown and no visible `.cm-editor` at +700 ms; title: modal open and Escape closes only the modal; dblq: the backdrop press closes the modal and the preview stays; apply: Healing 3 + Apply writes `current_stamina: 18`, no Notice, modal closed, preview shown; then pointer away 1.2 s keeps the preview and a real click outside closes it; no page error. Titles carry no bracketed ticket id. Header comment (57 scenarios) added.
- Red on `e0e49d4d` bundle (built from `git archive`, `DSE_LIFECYCLE_BUNDLE`): `sc598-r2-red-on-base-G-S91.log` (all 5 trials "the preview was gone"), screenshot `sc598-r2-red-on-base-G-S91-FAIL.png`; 34 s.
- Green on head: part 5 (`sc598-r2-gate-lifecycle-part5.log`) and a scratch run `sc598-r2-green-on-head-G-S91-scratch.log` (43 s with build).

## dse-verify proposal
`sc598-dse-verify-proposal.md`: the new bullet (with "a test counting clicks through the preview now sees two"), the jest paragraph text (13 tests, 19 + 23 mutants), battery row (57/57, part 5 list, walls), footgun (12), CURRENT draft with `<landing sha>`.

## Gate logs (all in the ledger dir, prefixed `sc598-r2-`)
`sc598-r2-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..5.log`, `-e2e.log`, `-styles-sha.log`; mutants `sc598-r2-mutants.log`; range-diff `sc598-r2-range-diff.log`; scratch scripts `sc598-r2-mutate.py.txt`, `-run-mutants.sh.txt`, `-run-lifecycle.sh.txt`, `-patch-gs91.py.txt`, `-build-base.log.txt`.
Wall times: part 1 185 s, part 2 324 s, part 3 404 s, part 4 299 s, part 5 384 s; jest 97 s; e2e 128 s.

Drive-by fixes:
- none.

Follow-ups:
- The dse repo's own `CHANGELOG.md` has an entry for SC-588 but none for SC-595 / SC-597; I added nothing there (the brief names only the superproject CHANGELOG). Owner decides whether SC-598 belongs in the dse changelog.
- Nested modals opened by a click inside a modal never arm the keymap re-pushes (the parent's document guard stops that click before `onWindowBubble`). Pre-existing, no observed symptom (the parent's re-pushes skip when a newer preview modal is open); noted only because it makes (b) a no-op there.
- Residual (r1, unchanged): a double-click whose second press is queued in full while the modal opens on a slow renderer still closes both (O9 declined `setIsFocused`). SC-604 for the window itself.
- Cleaned up: the one kept lifecycle FAIL temp dir from my red-on-base run (`/tmp/dse-obsidian-lifecycle-9zq177`) deleted by literal path. Two other `/tmp/dse-obsidian-lifecycle-*` dirs belong to other efforts and were left.
