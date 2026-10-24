# SC-505 r2 fix-round brief (implementer A, resumed)

## 1. Context

- Re-read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/decisions.md` (r1 rulings) and the review report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r1-review-report.md`.
- Same worktree, branch and rules as `sc505-brief-r1-impl.md` sections 1, 4, 5, 6 (scratch folder: reuse your private `sc505-r1-impl-q7x2/` or make `sc505-r2-fix-<4 chars>/`). Head at start: dse `37da2f2`, superproject `248b3be`.
- **First, rebase:** `git -C /home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/draw-steel-elements fetch origin`, rebase the dse branch onto `efc17de` (SC-493 landed: FormModal empty-box guard + new shared `src/framework/blockBody.ts`) or newer `origin/develop`, `npm ci` if package.json changed, and rebase the superproject branch onto origin/main. Report every conflict and how you resolved it, plus `git range-diff` of a993a60..37da2f2 vs <new base>..<new head>.
- You never call the tracker.

## 2. Task — fold these, nothing else

Owner rulings from the ledger (verbatim):

> - 3 (Notice-only Pin for an unregistered type leaves the focus request armed up to 3 s; a rebuild in that window could pull focus to Pin) -> FOLD into fix round: disarm when the pin is not bound/written, with a jest test.
(Item 3's "not bound/written" trigger is SUPERSEDED by the MEDIUM-1 ruling below: disarm whenever the pin wrote nothing.)

> - 5 (e2e selectors must scope to `.markdown-reading-view` because of the hidden LP copy) -> FOLD into fix round: one line in draw-steel-elements/e2e/README.md (footgun captured where it lives).

Review findings to fix (verbatim from the review report):

> ### HIGH-1: Pin focus is lost (or sent to the twin pane) when the same note is open in two panes
> - Where: `src/framework/chrome/focusHandoff.ts:117-131` (`attempt`), keyed by `blockKey` alone (`:61`). Also `src/framework/pipeline.ts:752-757`.
> - Scenario (measured, probe RV-P07B): open `Stamina/basic.md` in pane A, split it into pane B (Reading view), focus B's Pin button and press Enter. The note is written and both panes rebuild. Focus timeline: `chrome.pin (leaf B)` → `<body>` at 86 ms, and it stays on `<body>`. Pane A's copy has the same blockKey and its own Pin button. When A rebuilds first, B's old Pin button still holds focus, so `!focusIsFree(doc)` → `disarmChromeFocus(key)`. B's rebuild then has no request left. When the user presses in pane A (RV-P07), the order happens to work and focus lands on A's new Pin.
> - Mechanism confirmed by mutation: with the disarm branch removed (only `return`), the same probe moves focus from B's Pin to **A's Pin, the twin pane** (43 ms). So the request is not scoped to the copy that was pressed. Today the code avoids the twin only by dropping focus to `<body>`. Both outcomes break the rule: "focus stays on (or returns to) the block's Pin button… never a control outside the block".
> - Fix: (1) Record where the press happened in the request: the pressed button, plus its `closest('.workspace-leaf')` (or the view's `containerEl`, or the `ownerDocument` for a popout). (2) In `attempt`, ignore a copy whose leaf differs from the pressed one: no claim and no disarm. (3) Treat focus still on the old pressed button (`req.pressed`, connected or not) as "ours", not as "the user went elsewhere". Then a sibling copy that rebuilds first neither disarms nor steals. Add a jest test with two hosts that share a key, one per fake leaf, where the non-pressed copy rebuilds first. Add an e2e case for two panes, pressing in the later pane (RV-P07B's shape).
>
> ### MEDIUM-1: a request that is armed but never answered moves focus after the user has Tabbed elsewhere
> - Where: `focusHandoff.ts:86-91` (`settleChromeFocus` only shortens the request to 3 s) and `:126-128` (the "user went elsewhere" check runs only when some later mount or mutation happens to call `attempt`). The no-write paths are in `src/framework/sidebar/registration.ts:271` (strictBody) and `:283` (already anchored), plus the Notice results.
> - Probe of the armed-request case in real Obsidian, as the brief asked:
>   - **No write happens** for a second Pin on an already-anchored block (RV-P10: `wrote? false`), for ds-scc (RV-P15: `wrote? false`), and for the unregistered, not-found and unreadable-anchor Notices. So this is not only the rare unregistered case: **every second press of Pin** arms a 3 s request with no rebuild and no observer.
>   - **Blank click cannot steal.** After a click on blank note text, focus is on `div.markdown-preview-view`, not `<body>`. An outside edit 0-2.5 s later moved nothing (RV-P10).
>   - **Tab out of the block cannot steal.** Focus on Obsidian's "More options" survived an outside edit (RV-P12).
>   - **Tab to another control in the SAME block, then any rebuild of the block within the window, DOES steal (RV-P13).** Focus was on `chrome.collapse`; an outside edit 300 ms later took it to `chrome.pin` with a ring at 329 ms. Base and the user's expectation would both be `<body>`, or at least not a different control. The rebuild removes the user's control, focus falls to `<body>`, and the new mount's claim takes it. The same thing can happen inside the 1.5 s settle window after a real Pin. "From where": from whatever control in the same block the user moved to, whenever an outside edit, Sync, a second pane's write or a sidebar-panel write rebuilds the block.
> - Fix: (a) Fold item 3 as ruled, but key it on "the pin WROTE the note", not on "unregistered". Have `requestPinToSidebar` / `bindBlockToSidebar` report whether a write happened (`anchoredBody !== body` and not strictBody). Disarm when nothing was written; `settleChromeFocus` already refocuses the pressed button. (b) While any request is live, add one document-level `focusin` listener (capture). Any focus landing outside the claimed button and outside the old pressed button disarms at once. This replaces the reliance on a later mutation noticing it. Add jest for the second press of Pin (no rebuild) followed by focus on Collapse and a rebuild → focus is not moved to Pin.
>
> ### LOW-1: the adoptView claim is untested at both layers
> - Where: `src/framework/host/adoptView.ts:123-125`.
> - Mutation ME (the call deleted): jest 12/12 green, e2e CHR-F01..F04 green. Nothing proves the case it is there for ("the move found focus already lost").
> - Fix: add a jest test that adopts a view while a Pin request is armed and focus is on `<body>`, and expects the adopted root's Pin to be focused. Or remove the call if that case cannot happen (the pin write comes from the sidebar binder, so the report's own sequence says nothing adopts).
>
> ### LOW-2: CHR-F04 is not independent red evidence for Pin, and CHR-F02 places focus by script
> - Where: `e2e/specs/stamina-bar/chrome-focus.e2e.ts:106-127` and `:66-79`.
> - Scenario: with the hand-off neutralised (base), CHR-F04 fails in its Collapse/Expand preamble (`press(Enter, chrome.expand): the control does not have focus`), never reaching Pin. The Pin-only red comes from mutation MC (no arm), which fails as "Expected chrome.pin, Received body". CHR-F02 focuses Expand with `.focus()`, not Tab.
> - Fix: add a Pin test that Tabs straight to Pin from a fresh note. Keep F04 as the "after Collapse + Expand, three rebuilds" variant. In F02, reach Expand with `dse.tabTo`.

Owner rulings on these (ledger, 2026-10-23):
- HIGH-1 -> FOLD exactly as prescribed: (1) (2) (3), jest two-hosts-one-key test where the non-pressed copy rebuilds first, e2e two-pane case pressing in the later pane (RV-P07B shape). Must be red on 37da2f2.
- MEDIUM-1 -> FOLD (a) and (b) as prescribed. (a) supersedes follow-up 3's "unregistered type" wording: disarm whenever the pin WROTE nothing (already-anchored second press, ds-scc strictBody, every Notice path). (b) the capture-phase document `focusin` disarm while a request is live. jest: second Pin press (no rebuild) -> focus to Collapse -> rebuild -> focus NOT moved to Pin. Must be red on 37da2f2.
- LOW-1 -> FOLD: decide whether the adoptView claim's case can really happen. If yes, add the jest test prescribed (it must go red when the call is deleted). If no, remove the call and state the reasoning (which sequence would need it, and why none exists). Either way say which in the report.
- LOW-2 -> FOLD as prescribed (new Pin-only e2e test reached by Tab from a fresh note; F02 reaches Expand with `dse.tabTo`). Show the new Pin test red on base with only the hand-off neutralised.
- CHANGELOG: after HIGH-1, re-check that the bullet is true as written; adjust if not.
- INFO-1..7 -> DROP (confirmations / informational; INFO-4's focus loss on an outside-edit rebuild is the existing G-S5 always-rebuild-fresh behaviour and affects every focused control, not this branch; INFO-6 is the rebase above).

Out of scope: **SC-511** (keyboard Unpin from sidebar) — do not touch it.

Each fix: failing test first where testable, then the fix; commit per finding with the finding id in the message.

## 3. Gates — full dse-verify battery

Expected (base efc17de 6003/1/242 of 243 + branch): tsc/lint clean; jest 6015+r2 new / 1 / 243 of 244; lifecycle 36/36 (37/37 only if G-S39 added); e2e 118+r2 new ok, 0 failed, 0 known-bug, coverage 84/84+r2 new; shots 592 0 FAIL; freeze 280/280; parity 0/0/24.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r2-fix-report.md`, ≤10-line executive summary first; per finding: commit sha, test that proves it (red before / green after), file:line. Return contract as r1.
