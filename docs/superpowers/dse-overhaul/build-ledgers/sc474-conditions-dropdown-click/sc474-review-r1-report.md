# SC-474 review r1 — independent reviewer (Opus), suffix x4vt

## Executive summary
- **Verdict: FIX-REQUIRED** (1 HIGH, 0 MED, 1 LOW, 3 INFO). Reviewed dse `8af4f9a` on `origin/develop` `3480231`; superproject `da932cd`.
- The fix works. A real mouse click on a cog, swatch, duration chip or effect chip with the dropdown open now lands. COND-E04/E05 and my raw-CDP probes P01–P03 fail on unfixed code and pass on the fix.
- **HIGH-1 (new regression):** the close now runs on the click, after the browser has already moved focus to the clicked element on mousedown, and `closeAdd()` then moves focus to "+ Add condition". Any focusable target whose own handler does not re-focus loses the focus it just got. Real Obsidian: click into the icon-search field with the dropdown open → focus ends on "+ Add", and typing "sk" is lost. Pre-fix, the same click focuses the field and "sk" lands. The custom-colour input loses focus the same way.
- SC-186 HIGH-2 guarantees hold in real Obsidian. Menu-item pick still adds. Header, row-name and backdrop click-away still close. A press inside the add control never closes it. Drag-out stays open, drag-in closes and adds nothing. A release outside the window closes at once, with no stuck arm. Right and middle press close at once. Escape still works. 3 document listeners while open, 0 left after close, checked twice.
- Battery at 8af4f9a: all gates green and at the expected numbers (table below).
- Vacuity (fix reverted, tests kept): jsdom 4 of 7 new tests FAIL. e2e COND-E04 and COND-E05 FAIL (and COND-E02/E03 too, since their workaround is gone).
- Scope: no CSS in the diff, no attribution trailers, both CHANGELOG bullets present and accurate.
- Prescribed fix for HIGH-1: on the click path, close without refocus when focus already sits outside the add control. Add one jsdom test and one e2e scenario for the icon-search click.

## Gates (shared worktree, dse-verify order, exit codes recorded by script file)
| Gate | Measured | Expected |
|---|---|---|
| tsc (+ `-p e2e`) | clean, RC=0 | clean |
| lint (+ e2e) | clean, RC=0 | clean |
| jest | 5343 passed / 1 skipped / 230 of 231 suites, RC=0 | 5336 + 7 / 1 / 230 of 231 |
| lifecycle (port 9293) | `28/28 ok, 0 failed`, RC=0 | 28/28 |
| e2e | `87/91 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`, RC=0 | 85/89 + 2 |
| shots | 572 PNGs, 0 FAIL, RC=0 (host-copy pin OK, button host-leak 112 kinds / 672) | 572 |
| freeze | `freeze OK (276/276 …)`, RC=0 | 276/276 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, RC=0 | 0/0/24 |

Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-review-r1-x4vt/`:
`x4vt-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`.

## Findings

### HIGH-1 — the click-time close takes focus away from a focusable target the user just clicked (regression)
- Where: `src/views/ConditionsModal.ts:170-174` (`closeIfArmed` → `closeAdd()`), `:198` (capture `click`), `:540-544` (`closeAdd` always focuses `.dse-condal__add`). The comment at `:152-156` claims "exactly the order the old mousedown-close produced". That claim is wrong.
- Old order: document mousedown → `closeAdd()` focuses "+ Add" → the mousedown's default action then focuses the pressed element, so the target won. New order: the mousedown's default action focuses the target → the click's capture listener calls `closeAdd()` and focus moves to "+ Add". Then the target's own click handler runs. Cog, remove, swatch, duration and effect handlers re-focus, which hides the problem; an input does not.
- Real-Obsidian evidence (probe X4-P16, same steps on both builds: editor open, dropdown open, one mouse click into `.dse-cond-icons__search`, then type "sk"):
  - unfixed `3480231` source: focus `dse-cond-icons__search`, field value `"sk"` (`x4vt-vac-e2e2.log`)
  - fix `8af4f9a`: focus `dse-btn dse-condal__add`, field value `""` (`x4vt-probe-fixed4.log`; also X4-P15 in `x4vt-probe-fixed3.log`)
  - custom colour (X4-P17): unfixed → focus on `<input type="color">`; fixed → focus on "+ Add". Choosing a colour re-focuses through `change`, but a cancelled chooser leaves focus on "+ Add".
- Failure scenario: the GM has a row's editor open and the Add dropdown open, then clicks the icon search to look for an icon. The dropdown closes, the field shows no caret, and what they type goes nowhere. Space or Enter at that point lands on "+ Add condition" and reopens the dropdown. A second click works, because the dropdown is already closed.
- Prescribed fix: let the click-path close skip the refocus when focus has already left the add control. For example, `closeAdd(refocus = true)`, and in `closeIfArmed` pass `refocus` only when `activeDocument.activeElement` is null or `body`, or is still inside `addWrapEl`. That restores the old net result: the clicked control keeps focus, and a click on non-focusable space still lands on "+ Add" (this is better than pre-fix, which left `body`; see INFO-2). Fix the `:152-156` comment to match.
- Tests: add a jsdom test (focus the icon search between mousedown and click, then assert it still has focus after the click and the dropdown is closed). Add an e2e scenario like X4-P16 (`.dse-cond-icons__search` would need a control id and manifest row, or read it by `{ css }` and drive the click with `cond.edit`-style ids). Re-run the battery.

### LOW-1 — the mouseup fallback timer reads `activeDocument` at event time, not the document it was registered on
- Where: `ConditionsModal.ts:195`. The three listeners bind to `activeDocument` at `onOpen`, but the mouseup handler re-reads `activeDocument.defaultView` when it fires. If the user focuses a different window (popout) in between, the timer is set on that window. It still fires and is still cleared through the stored `win`, so I found no failure; this is fragility, not a bug.
- Fix: `const doc = activeDocument;` once in `onOpen`, then use `doc` for all three listeners and `doc.defaultView` for the timer.

### INFO-1 — an armed close survives a keyboard click while the mouse button is still held
- X4-P10: hold a press on the header, then press Enter on a focused cog → the dropdown closes. Control X4-P13: no press held, same Enter → the dropdown stays open.
- The pre-fix code had already closed the dropdown at that press, so the end state is no worse than before. A release outside the window does deliver mouseup and closes at once (X4-P09), so I could not produce an arm that outlives its gesture.
- Optional hardening: ignore `evt.detail === 0` clicks in `closeIfArmed`, or disarm on `keydown`.

### INFO-2 — click-away on non-focusable space now leaves focus on "+ Add" instead of `body`
- X4-P05: unfixed → `focusCtl: null` (body); fixed → `cond.add`. This is an improvement. Keep it when fixing HIGH-1 (the prescribed condition keeps it).

### INFO-3 — vacuity detail for the jsdom tests
- With the fix reverted, 4 of the 7 new tests fail: mousedown-does-not-collapse, cog full gesture, drag with no click, stale arm dropped by an inside press. 3 pass: the swatch test, mousedown inside, right-click. The implementer says the swatch test passes pre-fix because jsdom has no layout. The other two are non-regression pins and are expected to pass. Fine as shipped.

## Guarantee checks (real Obsidian 1.14.4, raw CDP `Input.dispatchMouseEvent`, fix build)
Log: `x4vt-probe-fixed.log`, `x4vt-probe-fixed2.log`
- P01 duration chip clicked with the dropdown open: writes `save-ends`, closes, focus on "Save Ends", no ring. P02 effect chip: writes `glow`, focus on "glow". P03 swatch: focus on "Color #1e8449", no ring. These cover the brief's chip case, and SC-468 holds.
- P04 real mouse pick on a menu item: adds, the dropdown stays open, focus in the input.
- P05 a click on the header, and a click on a row name: each closes the dropdown, and the modal stays open.
- P06 a backdrop click closes the modal. Document listeners: before `{click(cap):1}`; while open +`mousedown`, +`mouseup`, +`click(cap)`; after close back to `{click(cap):1}`, twice. No leak.
- P07 drag-out (press in the input, release on the header) stays open. A later inside click does not close it; a header click does.
- P08 drag-in (press on the header, release on a menu item): open while pressed, closed after release, no row added.
- P09 release outside the window: closed right away; no stale arm left for a later keyboard click.
- P11 a right press closes before the release, and the modal stays open. A middle press closes the same way.
- P12 Escape while an outside press is held closes only the dropdown; the release does nothing more.
- Unfixed build (`x4vt-vac-e2e.log`): COND-E02/E03/E04/E05 and P01/P02/P03/P14/P15 all fail at the cog click with the dropdown open. My raw CDP click reproduces the bug 100%.

## Scope checks
- `git diff 3480231..8af4f9a --stat`: CHANGELOG.md, the new e2e spec, the SC-468 spec (workaround removed), ConditionsModal.ts, the jsdom test. No CSS, so nothing on `.dse-swatch` / `.dse-optchip`.
- No commit body (cedd6b6, ab701ff, 8af4f9a, da932cd) has an attribution trailer.
- Both CHANGELOG bullets (dse 7.0.0 list, superproject Unreleased) are present and accurate for users.

## Hygiene
- Status of the shared dse worktree, the superproject worktree and the main checkout matches before and after (`x4vt-status-{before,after}-{dse,super,main}.txt`). Heads are still 8af4f9a / da932cd.
- The private worktree at `…/sc474-review-r1-x4vt/wt` is removed (`git worktree remove`). No stray processes.

## Evidence
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-review-r1-x4vt/`:
- `x4vt-probe.e2e.ts`: the probe spec (X4-P01…P17), not committed anywhere
- `x4vt-probe-fixed.log`, `x4vt-probe-fixed2.log`, `x4vt-probe-fixed3.log`, `x4vt-probe-fixed4.log`: probes on the fix
- `x4vt-vac-jest.log`, `x4vt-vac-e2e.log`, `x4vt-vac-e2e2.log`: vacuity and pre-fix comparison
- `x4vt-vac-bundles/COND-E04/`, `x4vt-vac-bundles/COND-E05/`: failure bundles on unfixed code
- the gate logs listed in the Gates section
