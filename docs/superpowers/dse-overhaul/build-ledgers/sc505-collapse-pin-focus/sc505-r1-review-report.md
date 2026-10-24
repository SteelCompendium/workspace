# SC-505 r1 independent review (reviewer B)

## Executive summary
- **Verdict: APPROVE_WITH_FIXES.** The shared hand-off is right for Collapse and Expand: measured in real Obsidian on all 19 chrome elements, in Reading view, Live Preview and the sidebar copy. Pin is right for a single pane. It fails in one realistic setup, and a request that was armed but never answered can move focus later.
- Counts: CRITICAL 0 / HIGH 1 / MEDIUM 1 / LOW 2 / INFO 7.
- HIGH-1: the same note open in two Reading panes, keyboard Pin in the pane that is NOT rebuilt first → focus drops to `<body>`. The request is keyed only by blockKey. With the "disarm" removed, focus jumps into the twin pane instead (measured).
- MEDIUM-1: a Pin that writes nothing leaves the request armed for 3 s. That covers an already-anchored block (any second press), ds-scc (strict body) and the Notice paths. Inside that window, a Tab to another control followed by any rebuild of the block pulls focus back to Pin. Measured: Collapse → Pin 329 ms after an outside edit.
- Gates on dse 37da2f2 / superproject 248b3be (all match the implementer's numbers): tsc/lint rc 0; jest 5970 passed / 1 skipped, 242 of 243 suites; lifecycle 36/36; e2e 118/118 ok, 0 failed, 0 known-bug, coverage 84/84; shots 592 PNGs, 0 FAIL, rc 0; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- Red proofs: reverting the fix turns 8 of 12 jest tests red. Neutralising it (base behaviour) turns CHR-F01, F02 and F04 red. 10 mutations were run; one survived both layers (the adoptView claim, LOW-1).
- Tab order around the block is byte-identical between base and head. Scope fence is respected. The CHANGELOG bullet is accurate except for the two-pane Pin case.
- Rebase needed before landing: dse origin/develop is now efc17de (SC-493 touches pipeline.ts; merge-tree shows no textual conflict), and superproject origin/main is 7e45f8d.

## Findings

### HIGH-1: Pin focus is lost (or sent to the twin pane) when the same note is open in two panes
- Where: `src/framework/chrome/focusHandoff.ts:117-131` (`attempt`), keyed by `blockKey` alone (`:61`). Also `src/framework/pipeline.ts:752-757`.
- Scenario (measured, probe RV-P07B): open `Stamina/basic.md` in pane A, split it into pane B (Reading view), focus B's Pin button and press Enter. The note is written and both panes rebuild. Focus timeline: `chrome.pin (leaf B)` → `<body>` at 86 ms, and it stays on `<body>`. Pane A's copy has the same blockKey and its own Pin button. When A rebuilds first, B's old Pin button still holds focus, so `!focusIsFree(doc)` → `disarmChromeFocus(key)`. B's rebuild then has no request left. When the user presses in pane A (RV-P07), the order happens to work and focus lands on A's new Pin.
- Mechanism confirmed by mutation: with the disarm branch removed (only `return`), the same probe moves focus from B's Pin to **A's Pin, the twin pane** (43 ms). So the request is not scoped to the copy that was pressed. Today the code avoids the twin only by dropping focus to `<body>`. Both outcomes break the rule: "focus stays on (or returns to) the block's Pin button… never a control outside the block".
- Fix: (1) Record where the press happened in the request: the pressed button, plus its `closest('.workspace-leaf')` (or the view's `containerEl`, or the `ownerDocument` for a popout). (2) In `attempt`, ignore a copy whose leaf differs from the pressed one: no claim and no disarm. (3) Treat focus still on the old pressed button (`req.pressed`, connected or not) as "ours", not as "the user went elsewhere". Then a sibling copy that rebuilds first neither disarms nor steals. Add a jest test with two hosts that share a key, one per fake leaf, where the non-pressed copy rebuilds first. Add an e2e case for two panes, pressing in the later pane (RV-P07B's shape).

### MEDIUM-1: a request that is armed but never answered moves focus after the user has Tabbed elsewhere
- Where: `focusHandoff.ts:86-91` (`settleChromeFocus` only shortens the request to 3 s) and `:126-128` (the "user went elsewhere" check runs only when some later mount or mutation happens to call `attempt`). The no-write paths are in `src/framework/sidebar/registration.ts:271` (strictBody) and `:283` (already anchored), plus the Notice results.
- Probe of the armed-request case in real Obsidian, as the brief asked:
  - **No write happens** for a second Pin on an already-anchored block (RV-P10: `wrote? false`), for ds-scc (RV-P15: `wrote? false`), and for the unregistered, not-found and unreadable-anchor Notices. So this is not only the rare unregistered case: **every second press of Pin** arms a 3 s request with no rebuild and no observer.
  - **Blank click cannot steal.** After a click on blank note text, focus is on `div.markdown-preview-view`, not `<body>`. An outside edit 0-2.5 s later moved nothing (RV-P10).
  - **Tab out of the block cannot steal.** Focus on Obsidian's "More options" survived an outside edit (RV-P12).
  - **Tab to another control in the SAME block, then any rebuild of the block within the window, DOES steal (RV-P13).** Focus was on `chrome.collapse`; an outside edit 300 ms later took it to `chrome.pin` with a ring at 329 ms. Base and the user's expectation would both be `<body>`, or at least not a different control. The rebuild removes the user's control, focus falls to `<body>`, and the new mount's claim takes it. The same thing can happen inside the 1.5 s settle window after a real Pin. "From where": from whatever control in the same block the user moved to, whenever an outside edit, Sync, a second pane's write or a sidebar-panel write rebuilds the block.
- Fix: (a) Fold item 3 as ruled, but key it on "the pin WROTE the note", not on "unregistered". Have `requestPinToSidebar` / `bindBlockToSidebar` report whether a write happened (`anchoredBody !== body` and not strictBody). Disarm when nothing was written; `settleChromeFocus` already refocuses the pressed button. (b) While any request is live, add one document-level `focusin` listener (capture). Any focus landing outside the claimed button and outside the old pressed button disarms at once. This replaces the reliance on a later mutation noticing it. Add jest for the second press of Pin (no rebuild) followed by focus on Collapse and a rebuild → focus is not moved to Pin.

### LOW-1: the adoptView claim is untested at both layers
- Where: `src/framework/host/adoptView.ts:123-125`.
- Mutation ME (the call deleted): jest 12/12 green, e2e CHR-F01..F04 green. Nothing proves the case it is there for ("the move found focus already lost").
- Fix: add a jest test that adopts a view while a Pin request is armed and focus is on `<body>`, and expects the adopted root's Pin to be focused. Or remove the call if that case cannot happen (the pin write comes from the sidebar binder, so the report's own sequence says nothing adopts).

### LOW-2: CHR-F04 is not independent red evidence for Pin, and CHR-F02 places focus by script
- Where: `e2e/specs/stamina-bar/chrome-focus.e2e.ts:106-127` and `:66-79`.
- Scenario: with the hand-off neutralised (base), CHR-F04 fails in its Collapse/Expand preamble (`press(Enter, chrome.expand): the control does not have focus`), never reaching Pin. The Pin-only red comes from mutation MC (no arm), which fails as "Expected chrome.pin, Received body". CHR-F02 focuses Expand with `.focus()`, not Tab.
- Fix: add a Pin test that Tabs straight to Pin from a fresh note. Keep F04 as the "after Collapse + Expand, three rebuilds" variant. In F02, reach Expand with `dse.tabTo`.

### INFO
- INFO-1: Live Preview has no Pin item (`pipeline.ts:737`, `cx.mode === 'reading'`; RV-P04 items `["collapse","expand"]`), so "keyboard Pin in Live Preview" does not apply. LP keyboard Collapse → Expand → Collapse works, with a ring and visible, and no text goes into the editor.
- INFO-2: the hidden Live Preview copy in a Reading leaf has no Pin item either (same gate). The "hidden copy leaves the request" branch (`focusHandoff.ts:130-131`) is defensive only in real Obsidian. Mutation MH (disarm on refusal) is caught by jest only.
- INFO-3: dropping `focusVisible` (mutation MA) is caught by jest only. Chromium paints the ring after a keyboard event anyway, so e2e cannot tell the difference. This is expected, not a defect.
- INFO-4: keyboard Collapse followed by an outside edit while collapsed (RV-P08): the block stays collapsed, and focus goes from Expand to `<body>` at 218 ms because the fresh rebuild drops it. No stale deferred call moved focus later. This is the pre-existing "outside edits rebuild fresh" behaviour (G-S5) and is not caused by this branch. A possible follow-up if the owner wants focus kept across outside rebuilds.
- INFO-5: the survey, checked against the code and measured. Every chrome Collapse/Pin goes through `mountChrome` (one caller, `pipeline.ts:701`) plus the pipeline Pin item, and no element has its own chrome Collapse or Pin. The implementer did not measure the other elements; I did (RV-P11X, experimental on). Keyboard Collapse → Expand (ring) → Collapse (ring) passed on all 19 rendered chrome elements: counter, feature, values-row, characteristics, skills, conditions, heroic-resource, surges, hero-tokens, negotiation, featureblock, statblock, montage, party, hero, encounter, project, initiative, scc. The display family (`ds-kit`, `ds-treasure`) rendered as plain code in the e2e vault, so I did not measure it; it uses the same `mountChrome`. Look-alikes outside chrome: encounter's in-body "Open in sidebar" button (writes the tracker block) and the hero ability-row toggle (it stays visible, so no focus loss). Neither is in this ticket. Keyboard Pin was also verified on ds-counter (write: `pin → body 200 ms → new pin 212 ms`) and on ds-scc (no write: focus stays).
- INFO-6: rebase needed. dse origin/develop is a993a60..efc17de (SC-493: `FormModal.ts`, `blockBody.ts`, `pipeline.ts`); `git merge-tree` reports 0 conflicts. Superproject origin/main is 7e45f8d (SC-493 CHANGELOG bullet above this one). Re-run the battery after the rebase. I fetched dse `origin` (refs only).
- INFO-7: the superproject worktree shows ` M draw-steel-elements` (pointer not bumped, as the brief said). It was like that at start and is the same at the end.

## Mutation table (throwaway detached worktree at 37da2f2; jest = `test/dom/framework/chromeFocusHandoff.test.ts`, e2e = `--only=CHR-F01..F04`)
| id | mutation | jest | e2e | caught by |
|---|---|---|---|---|
| REVERT | mountChrome/pipeline/adoptView/types back to a993a60 | 8 red / 4 green | n/a (ids gone) | jest |
| MZ | `isKeyboardClick` → false (base behaviour, ids kept) | 8 red | F01, F02, F04 red (F04 in its preamble); F03 green | both |
| MA | drop `focusVisible` | 3 red | all green | jest only (INFO-3) |
| MB | drop the keyboard-only guard (`isKeyboardClick` → true) | 2 red | F03 red | both |
| MC | Pin: no arm (only the pre-redraw pressed button is refocused) | 4 red | F04 red (`Received: body`) | both |
| ME | drop the adoptView claim | 12 green | all green | **NONE (LOW-1)** |
| MF | drop the MutationObserver (claim at mount only) | 1 red | F04 red | both |
| MG | clear the request on first success (no settle extension) | 1 red | F04 red | both |
| MH | a hidden copy's refusal disarms | 1 red | all green | jest only (INFO-2) |
| MK | drop the Expand hand-off | 2 red | F01, F02 red | both |
| MI | the free-focus check never disarms (probe only) | n/a | RV-P07B: focus → twin pane's Pin | diagnostic for HIGH-1 |

## Real-Obsidian probes (1.14.4, e2e driver; spec `.../sc505-r1-review-k7q2/probe.e2e.ts`; activeElement polled every 5 ms)
| probe | result |
|---|---|
| P01 RV keyboard Collapse / Expand | collapse → `chrome.expand` fv at 8 ms; expand → `chrome.collapse` fv at 6 ms; no later moves within 2 s |
| P02 RV keyboard Pin | `pin` → body (198 ms) → new `pin` fv (209 ms); final is in a live registry entry, connected, visible, the current bar. Tab → Collapse, then an outside edit after the request lapsed → body (no claim) |
| P03 pointer Collapse / Expand / Pin | focus never left `.markdown-preview-view` over 1.5/1.5/3 s; no `:focus-visible` in the block |
| P04 Live Preview | items `[collapse, expand]` (no Pin); Collapse → Expand fv; Expand → Collapse fv; editor text unchanged |
| P05 sidebar copy | items `[unpin, collapse, expand]`; Collapse → Expand fv at 7 ms; Expand → Collapse fv at 6 ms |
| P06 two bars | bar 2 Collapse → bar 2 Expand; Expand → bar 2 Collapse; bar 2 Pin → bar 2's new Pin (anchor on bar 2 only); bar 1 Pin → bar 1 Pin; never the twin |
| P07 two panes, Pin in A | focus on A's new Pin; B rebuilt too |
| **P07B two panes, Pin in B** | **B's Pin → body at 86 ms, stays (HIGH-1)** |
| P08 keyboard Collapse, then an outside edit while collapsed | Expand → body at 218 ms (fresh rebuild), still collapsed, no later move (INFO-4) |
| P09 Tab order around the bar (14 fwd, 14 back) | base == head, byte-identical: bar → Collapse → Obsidian header controls |
| P10 second Pin (no write), blank click, outside edit | blank click → `.markdown-preview-view`; no steal |
| P11X 19 chrome elements | all Collapse → Expand fv and Expand → Collapse fv |
| P12 Pin, Shift+Tab out of the block, outside edit | stays on "More options"; no steal |
| **P13 second Pin (no write), Tab → Collapse, outside edit 300 ms later** | **Collapse → Pin (fv) at 329 ms (MEDIUM-1)** |
| P15 Pin on ds-counter / ds-scc | counter: new Pin fv at 212 ms; scc: no write, focus stays |

## Gate summary lines (dse 37da2f2, superproject 248b3be; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-review-k7q2/`)
- tsc `g-tsc.log`: rc=0 (`tsc --noEmit && tsc --noEmit -p e2e`, no output)
- lint `g-lint.log`: rc=0
- jest `g-jest.log`: `Test Suites: 1 skipped, 242 passed, 242 of 243 total` / `Tests: 1 skipped, 5970 passed, 5971 total`, rc=0
- lifecycle `g-lc.log` (port 9297): `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`, rc=0
- e2e `g-e2e.log`: `OBSIDIAN-E2E done: 118/118 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`, rc=0
- shots `g-shots.log`: rc=0, 592 PNGs, 0 FAIL; button host-leak OK (678), modal button host-leak OK, chrome host-leak OK (18), text scale OK (1626), text scale once OK (107256 / 214 loads), pressed toggle parity OK (96), host-copy pin OK; expected APP.CSS PIN DRIFT warning (installed 1.15.0)
- freeze `g-freeze.log`: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
- parity `g-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc=0

## Scope fence and CHANGELOG
- dse diff a993a60..37da2f2 touches none of `visual-harness/`, `src/framework/kit/stepper.ts`, `src/authoring/FormModal.ts`, `styles-source.css` or the stamina-bar element. SC-501 and SC-502 are untouched. Superproject: CHANGELOG.md only.
- CHANGELOG (`CHANGELOG.md:11-16`): accurate for Collapse and Expand ("every element with the hover menu" is confirmed by P11X). "Pin to sidebar leaves it on the Pin button" is false in the two-pane case until HIGH-1 is fixed.

Working tree: dse branch `sc505-collapse-pin-focus` still at 37da2f2, `git status --porcelain` clean. Superproject unchanged (` M draw-steel-elements`, as at start). The throwaway worktree has been removed.
