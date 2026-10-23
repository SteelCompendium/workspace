# SC-478 r3 review report: Live Preview scroll hold (dse b17b3cd on 54f8f88)

## Executive summary
- **Verdict: REQUEST_CHANGES.** Findings: 0 HIGH, 2 MEDIUM, 2 LOW, 4 INFO.
- **M1:** a user scroll in the gap before a slow pane's `set` transaction makes the fix drop out completely, so the original jump comes back. With two LP panes, a real click in A and a real wheel in B, the head bundle ends at line 255-260 in 3/3 runs, the same as base (255-257).
- **M2:** a write that inserts text right at the fence start and also changes the tracker never matches the hold, because positions map with `assoc -1`. Head goes 3020 → 5592 (line 63 → 162) in 2/2 runs, the same loss as base. The jest mutation `mapPos(.., 1)` survives.
- **L1:** when a write deletes the tracker and a callout follows it, the callout is held at 3039px for 2500 ms (150 painted frames) and then jumps. Base jumps once at 37 ms. This is a regression in an edge case.
- **L2:** 3 of my 7 guard mutations survive jest: the `releaseAll` registration, the pending-entry remap, and the `assoc` direction.
- **The fix holds in the gate.** G-S8/G-S15/G-S18: head ok 2/2. Base FAIL 2/2 (3020 → 2556, line 63 → 285/160; the anti-vacuity tripwire passed, so the tracker really was redrawn). Control "restore never dispatched" FAIL 2/2. Control "no hold" FAIL 2/2 (3020 → max 5544/6231).
- **Gates at b17b3cd:** tsc rc 0, lint rc 0, jest **5617 passed / 1 skipped / 235 of 236**, lifecycle **32/32 ok, 0 failed**, e2e **95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs**. Shots/freeze/parity are carried from r2 (580 / 280/280 / 0/0/24) because the diff touches no CSS or render code.
- **Clean probes:** identity, popout and leaf close, disable during a hold, typing, undo/redo, plain notes, raw Source, bad YAML and cost (capture 0.1-0.3 ms, restore 0.4-1.0 ms, typing hooks 0.2-0.6 ms per 31 keystrokes).
- dse porcelain is empty before and after; the superproject shows ` M draw-steel-elements` before and after; nothing committed.

## Method
- Bundles were built from the worktree into my scratch folder, with every temporary edit undone by `git checkout --`:
  - `head` (b17b3cd);
  - `base` (the 3 wiring lines removed, which gives develop behaviour);
  - `norestore` (r1's control);
  - `nohold` (r1's control);
  - `expose` (head plus `window.__sc478r3 = lpHold`, used to read `captures`/`pending`/`holds`);
  - `nopath` (expose without the path check at :192).
- Hashes are in `sc478-r3-build.log`.
- Probes were injected into the lifecycle harness (Obsidian 1.14.4, Xvfb, port 9380) as scenario `R3-PROBE`, with real CDP `Input.dispatchMouseEvent` mouseWheel/clicks and `Input.insertText`/keys.
- Each probe records per frame: scrollTop, scrollHeight, `[data-dse-lp-hold]` count, and the visible row at the viewport top.
- It also records:
  - every CM `update` (userEvent);
  - every DSE-origin `cm.dispatch` (the restore) with its ms;
  - hold on/off;
  - `modify`;
  - errors (`__lc.errs` plus window error/unhandledrejection, including popouts).

## Findings

### MEDIUM M1: a user scroll before a late `set` transaction disables the fix, and Obsidian's jump returns
- **Where:** `src/framework/host/livePreviewScrollHold.ts:194` (`if (Math.abs(view.scrollDOM.scrollTop - cap.scrollTop) > 1) return; // the user wins`), header :44-46.
- **Scenario, natural (`u1-second-pane-wheel`, 3 runs per bundle):**
  - Setup: two LP panes on `Lifecycle/tall.md`, both parked 1500px into the tracker (3020, line 63+1500). A real click on a portrait toggle in pane A, then 12 real wheel steps of -60 on pane B, 40 ms apart.
  - Pane B's `set` transaction arrived 1166 / 1794 / 1886 ms after `modify` (the SC-472 gap).
  - By then B's scrollTop had moved (3020 → 3007/2960), so the guard dropped the restore. Obsidian's clamp then threw B to 2556 (line ~160), and the remaining wheel steps continued from there.
  - **Head: line 255 / 257 / 260 (wh null, tracker gone). Base: line 257 / 257 / 255.**
  - The user expected about line 63 + 780. The fix gives nothing in this flow.
- **Scenario, forced gap (`u1-wheel-before-set`):**
  - `setViewData` was deferred 800 ms and a real wheel of -400 sent in the gap: 3020 → 2620 (line 63+1100) → 2556, line 160+2. Head and base are identical, 2/2.
  - A `scrollTop -= 400` inside a `modify` listener (`u1-scroll-in-modify`) gives the same result: 2620 → 2556, line 160.
- **Single-pane outside write while the user is scrolling (`u1-write-during-scroll`, 2/2): the fix works.** The main thread is busy across the 1-13 ms gap, so the wheel lands after the transaction. The user ends at 2420 (line 63+900), exactly 3020 − 600 for 10 × 60 of wheel. Base: line 141. So the loss is confined to the late-transaction path (a second pane, a loaded machine).
- The plugin never moves a scroll the user made, and never snaps back after it (see `u2-wheel-asap` and `u3-*` below). But "the user wins" currently means "the plugin steps aside and Obsidian destroys the user's scroll", by about 100 lines.
- **Prescribed fix:**
  - Keep the capture current instead of dropping it. Add `eventObservers: { scroll: () => hold.refresh(view) }` to the ViewPlugin spec at :172-176 (CM runs `scroll` observers from its DOMObserver, `@codemirror/view` index.js:6883).
  - `refresh(view)`: if `captures.get(view)` exists, re-run `capture(view, cap.owner)`. That costs 0.1-0.3 ms, and it drops the capture by itself once the tracker has scrolled out of the drawn range.
  - Keep the 1px check as a fallback for a scroll whose event has not fired yet.
- **Tests:**
  - jest: a scroll event after the capture re-snapshots, and the `set` update restores the new snapshot.
  - Lifecycle: a G-S18 phase (a′), "pane B wheels in the gap", shaped like `u1-second-pane-wheel`: B's top line stays at the line the wheel reached, and `data-dse-lp-hold` is seen.

### MEDIUM M2: an insertion at the fence start plus a tracker change in one write never matches the hold, so the position is lost
- **Where:** `livePreviewScrollHold.ts:187` and `:200` (`u.changes.mapPos(w.pos, -1)`), matched by equality at `:232`.
- **Scenario (`h-insert-before-and-change`, 2/2):**
  - One outside `vault.process` does `c.replace('```ds-initiative\n', 'INSERTED LINE.\n\n```ds-initiative\n').replace('  value: 1', '  value: 2')`. This is the shape of a Sync bundle in which another device added a paragraph above the tracker and clicked in it.
  - The diff inserts at the widget's start position. `mapPos(start, -1)` stays before the inserted text, while the replacement widget starts after it, so `x.pos === pos` misses. There is no hold (`holds []`); the restore is dispatched against the 50px estimate.
  - **Head: 3020 / line 63+1500 → 5592 / line 162, tracker not drawn. Base: → 2604 / line 162.** Same loss.
- **Related, smaller:** an insertion alone with no tracker change (`h-insert-before-only`, 2/2) restores to line 65+1452 instead of 65+1500. CM's snapshot cursor also maps with `assoc -1` (`@codemirror/state` `SelectionRange.map`), so the visible content shifts 48px, which is the inserted paragraph's height. Base loses about 100 lines here.
- **Prescribed fix:**
  - At :187/:200 map the widget positions with `assoc 1`. Or, more robust, in `applyHolds` accept the widget whose `posAtDOM` lies in `[mapPos(p, -1), mapPos(p, 1)]`.
  - Optional: build the restore as `EditorView.scrollIntoView(EditorSelection.cursor(changes.mapPos(ref.from, 1)), { y: 'start', yMargin: ref.top - scrollTop })` from a `lineBlockAtHeight` taken at capture, so that an insertion at the anchor does not shift the view.
- **Tests:**
  - jest: the `shift()` fake ignores `assoc`, which is why mutation M4 survives. Make the fake honour `assoc` and add "an insertion at the block start in the same write still holds the replacement".
  - Lifecycle: a G-S18 phase "insert above the fence and change the tracker in one write".

### LOW L1: a non-DSE embed that lands at a captured position is held at the old tracker height for PIN_TTL_MS
- **Where:** `livePreviewScrollHold.ts:224-233` with `unmounted()` at :117-120. `!root` returns true, so any `.cm-embed-block` with no `[data-dse-element]` counts as "drawn empty".
- **Scenario (`n4-delete-tracker-callout-next`, 2/2):**
  - The note is `…PRE…`, then the 25-hero tracker, then directly a `> [!note]` callout. The pane is parked 1500px into the tracker, and an outside write deletes the tracker fence.
  - The callout now starts at the mapped position, so it gets `min-height: 3039px`.
  - Our MutationObserver never sees a DSE mount, so the hold lasts **2500 ms (150 painted frames)**. During that time the viewport shows the inside of an empty 3039px callout box (top row "Callout right after" at -1500px). It then collapses and the pane jumps to 2631 (POST filler 20).
  - **Base: one jump at 37 ms to 2578, the same place, with no phantom.**
  - The same applies to a table, image embed, math block or another code block in that slot, or a fence whose language changes from `ds-*` to something else.
- **Prescribed fix:**
  - Record the widget's `cm-lang-*` class at capture, for example `cm-lang-ds-initiative`.
  - In `applyHolds`, hold only a replacement that carries the same class (or at least a `cm-lang-ds-` class).
  - jest: "a non-DSE embed at a captured position is never held". The existing test only covers another position.

### LOW L2: three guard mutations survive the jest suite
`sc478-r3-mutation-check.log`; one suite run each, restored with `git checkout --`.

| mutation | result | note |
|---|---|---|
| M1: remove `plugin.register(() => lpHold.releaseAll())` (`registerFrameworkElements.ts:63`) | **16/16 green** | The wiring test checks `modify` and `registerEditorExtension` only. At runtime the extension removal also destroys ViewPlugins (`forget`). `i5` showed holds going 1 → 0 on disable, so the impact is small. |
| M2: remove the `open.widgets` remap (:187) | **16/16 green** | A doc change between the `set` and a late draw inside the pending window would hold the wrong position, or miss. |
| M3: remove `w.hasAttribute(HOLD_ATTR) \|\|` (:225) | 16/16 green | Harmless: a double hold. Listed for completeness. |
| M4: `mapPos(w.pos, -1)` → `mapPos(w.pos, 1)` | **16/16 green** | This is M2's root cause: the fake ignores `assoc`. |
| M5: drop `this.pending.get(view) !== entry` in the microtask | red (1) | caught |
| M6: hold the first captured px for any empty widget | red (1) | caught |
| M7: drop `view.requestMeasure()` on release | red (1) | caught |

- **Prescribed fix:**
  - The wiring test asserts `plugin.unload()` releases a live hold, or that `releaseAll` was registered.
  - Add a test for a doc change between the `set` and a late draw (the shift moves positions).
  - Make the `shift()` fake honour `assoc` (see M2).

### INFO
- **I1:**
  - The header at :60-61 says the explicit path check "covers any navigation that would arrive as a `set` transaction". It is reachable today.
  - In `i1-open-in-modify`, a `leaf.openFile(dst)` from a `modify` listener makes Obsidian apply src's `set` transaction to the view whose `file` is already dst. With the `nopath` bundle, a restore and a hold fire on it (2/2). With head, 0/2.
  - Reword it as measured.
- **I2:**
  - The header at :63-66 says the `set` annotation is `setViewData`. Obsidian also mirrors a second pane's typing into this pane as `doc:set`.
  - In `t3-two-panes-typing`, 15 keystrokes in pane B produced 15 `doc:set` updates in pane A. After each of B's autosaves (a capture in A), A dispatched a restore: 2 restores, 0.4-0.5 ms each. scrollTop stayed at 3020 and there were no holds, so this is harmless today.
  - Document it.
- **I3:**
  - "The hold drops as soon as our view has mounted" (:38): it releases at the first child appended to the root (`childElementCount > 0`).
  - Measured hold lifetimes are 3-224 ms and always 0 painted frames.
  - Doc wording only.
- **I4:** the stale `obsidian-lifecycle.mjs:45` "G-S14 is reserved for SC-457" (owner ruling: fold into the fix round).

## Probe results
- **Fix holds and controls discriminate (item 1).** Summary: `sc478-r3-disc-summary.log`.
  - G-S18 head ok 2/2: (a) 3020 held over 34-35 frames with the tracker at 3725px; (b1)/(b2)/(c) 3020 with the tracker at 3039px; holds 0 frames.
  - Base FAIL 2/2: 3020 → min 2556, line 63 → 285 (a, c) / 160 (b1, b2), tracker not drawn.
  - norestore FAIL 2/2: identical to base, hold never seen.
  - nohold FAIL 2/2: 3020 → max 6231 (a) / 5544, line 285/160.
  - G-S8 and G-S15 were ok in all 8 runs.
  - Anti-vacuity passed on base (the tag left the DOM), so the jump is real and the widget really is rebuilt.
- **The user wins (item 2).**
  - (i) M1 above.
  - (ii) The hold window is never reachable by real input. Everything from `modify` to release happens in one task (frame f1905: modify @2, `set` @22, restore @53, holdOn @54, holdOff @109), and the first frame after the write paints 0.9-1.7 s later (the mount).
    - A synthetic `scrollTop += 400` inside the hold-MutationObserver callback (`u2-scroll-in-hold`) is overridden by the restore's measure (2956 → 3020). No frame was painted in between, so this is not user-visible.
    - A real wheel of +400 sent right after the write (`u2-wheel-asap`) landed at 1136 ms and was kept: 3020 → 3420, no snap back.
  - (iii) A wheel of -400 after the restore and release (`u3-wheel-after-restore`): 3020 → 2620, held to the end (4.5 s, past PIN_TTL).
    - Away and back (`u3-away-and-back`, 2 × 1200 down, then up): 3020 → 5420 → 3020, line 63+1500, no re-hold, no snap.
- **Identity (item 3).** No errors in any case.
  - A real link click inside the pending window (`i1-link-in-pending`) loads dst, which has the same tracker offset. It is the same `cm`, but pending, capture and holds all read false after the load, and dst got no restore and no hold.
  - A stale capture (`modify` triggered without a `set`) followed by the link: capture false after the load. dst's own later write restored correctly (2491px hold, line 63+1500).
  - Quick switcher (`switcher:open` + `r3-dst` + Enter) within the pending window, and with a stale capture: no leak; dst at 0.
  - Leaf closed inside the hold and inside `modify`: holds 0, 0 hold attributes, no errors.
  - Popout `window.close()` inside the hold and inside `modify`: holds 0 after 3 s, no errors (popout window listener attached).
  - `disablePlugin` inside the hold: holds 1 → 0, attribute and min-height removed, no errors.
- **Typing (item 4).**
  - Prose above the tracker (real click, 15 keystrokes, 3 autosaves): 0 restores, 0 holds, scrollTop 1120 constant. A capture lingers after each autosave and is consumed by the next keystroke (`input.type`).
  - Inside the fence (as source): 9 keystrokes, 3 autosaves, 0 restores, 0 holds, 1815 constant.
  - Undo/redo after an outside write: no movement. The `set` is not in history; the disk keeps `value: 2`.
  - Two-pane typing: see I2.
- **Non-DSE and Source (item 5).**
  - Plain 220-paragraph note: no capture, 5140 held.
  - Raw Source: no embeds, no capture, 1702 held.
  - Bad YAML: hold 3039 released after 23 ms (the error card mounts). The user lands at line 160+2, because the block is now short, and stock does the same. Fixing the YAML back while the error card is off-screen: no capture, stock 2696 → 2556.
- **Height (item 6).** No phantom frames in any case: hold frames 0, and the first painted frame shows the final height.
  - Grow by a row with the viewport inside the tracker: the pixel offset is kept (3020, line 63+1500, tracker 3039 → 3148), so the visible rows shift by one row ("Hero 12" at the top).
  - Shrink: 2929px, "Hero 14".
  - Viewport below the tracker: content kept exactly. Grow: 4858 → 4967, line 131 → 133 (2 lines inserted above). Shrink: 4858 → 4748, line 131 → 129.
  - Base: lines 162 / 162 / 158.
- **Cost (item 7), expose bundle with each method wrapped.**
  - 6 trackers, 2 drawn: capture 0.1-0.3 ms, restore dispatch 0.9-1.0 ms, `onUpdate` ≤ 0.2 ms, `applyHolds` 0.1-0.3 ms. Long tasks 193/132 and 250/142 ms vs base 167/129/155 and 166/145/140.
  - 8 trackers, 5 drawn: capture 0.1-0.3 ms, restore 0.4-0.9 ms, `applyHolds` 0.2 ms, long task 106/103 ms (base 106/103).
  - Typing 31 keystrokes: all hooks together 0.2-0.6 ms.
  - The hold MutationObserver lives only 3-224 ms per hold, one per held widget.
- **Code review (item 8).**
  - Unload: `modify` via `registerEvent`, the extension via `registerEditorExtension`, `releaseAll` via `plugin.register`; each MutationObserver is disconnected in `release`; timers come from the widget's window.
  - Pending-entry timers are not cleared by `releaseAll`. That is harmless (2.5 s, they only delete a WeakMap entry).
  - No global `document`/`window` in the module.
  - The dispatch runs in a microtask after the update (measured `set` @22 → restore @53, same task).
  - Mutations: see L2.

## Follow-ups (data points; not findings)
- **SC-491:** with the viewport inside the `tall.md` tracker (25 heroes), the first painted frame after a write is 925-1709 ms on head vs 27-59 ms on base, because the restore makes CM draw and mount the tracker; base never draws it. With the viewport below the tracker, base also mounts it (1046-1106 ms). This is the accepted cost.
- **SC-491:** `r3-small.md` (8 one-hero trackers) replaced 2 of 5 drawn roots on a one-tracker write, on head and base alike.
- **SC-472:** the second LP pane's `set` transaction arrived 1166-1886 ms after `modify` after a real click in the other LP pane (3/3).

## Gates (b17b3cd, my runs)
| gate | result |
|---|---|
| tsc (+ e2e) | rc 0 |
| lint | rc 0 |
| jest | `Tests: 1 skipped, 5617 passed, 5618 total`; `Test Suites: 1 skipped, 235 passed, 235 of 236 total` |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` (port 9380) |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots / freeze / parity | carried from r2: 580 incl. both text-scale lines / 280/280 / 0/0/24. The diff touches no CSS and no element render code; the only non-test changes are the LP module, a 7-line wiring hunk and an `export`. |

## Artifacts
All of these are in the ledger dir, `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`:
- **Report:** `sc478-r3-review-report.md`.
- **Discrimination:**
  - `sc478-r3-disc-summary.log`;
  - `sc478-r3-disc{1,2}-{head,base,norestore,nohold}.log`;
  - `sc478-r3-disc-{base,norestore,nohold}-G-S18-FAIL.png`.
- **Probe JSON (`sc478-r3-PROBE-<bundle>-<tag>.json`):**
  - expose: `user`, `user2`, `user3`, `ident`, `ident2`, `openmod`, `type`, `misc`, `hgt`, `cost`, `cost2`, `del`, `ins`;
  - base: `user2`, `user3`, `hgt`, `cost`, `cost2`, `del`, `ins`;
  - nopath: `openmod`.
- **Probe logs:** `sc478-r3-<tag>-<bundle>.log`.
- **Mutation:** `sc478-r3-mutation-check.log`, `sc478-r3-mut-M{0..7}-*.log`.
- **Gates:** `sc478-r3-gate-{tsc,lint,jest,lifecycle,e2e}.log`, `sc478-r3-gate-rc.log`.
- **Build:** `sc478-r3-build.log`.
- **Tooling (reusable for the re-review):**
  - `sc478-r3-probe.mjs.txt` (the injected `R3-PROBE` scenario);
  - `sc478-r3-{run,probe,disc,build,variants,variant-nopath,mutate,gate}.sh`.
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r3-a486fa043b5abce34/` (`bundles/{head,base,norestore,nohold,expose,nopath}`, the working copies of the scripts).
- The 6 kept harness FAIL temp dirs were removed by exact path after their PNGs were copied.
