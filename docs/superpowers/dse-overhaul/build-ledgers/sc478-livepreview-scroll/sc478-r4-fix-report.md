# SC-478 r4 fix report (r3 review findings folded)

## Executive summary
- **dse head `24e9179`** on base `e4c5cf6` (origin/develop; rebased 54f8f88 -> 3973b56 -> 424f47b -> e4c5cf6). **Superproject head `e9d2e24`** on origin/main `acaa6f4`. Nothing pushed; ` M draw-steel-elements` left unstaged. dse porcelain empty.
- Final battery on e4c5cf6: tsc (+e2e) rc 0; lint rc 0; jest **5738 passed / 1 skipped / 239 of 240** (5711 + 27 SC-478 tests; the suite grew 16 -> 27); lifecycle **32/32 ok**; e2e **101/101 ok, 0 failed, 0 known-bug, coverage 66/66**; shots 580, 0 FAIL, no ALLOWLISTED line, `modal button host-leak OK (10 … 228 …)`, `text scale OK (1626 …)`, `text scale once OK (104184 comparisons over 208 loads …)`; freeze **280/280**; parity **0 / 0 / 24**.
- Discrimination, `--only=G-S8,G-S15,G-S18`, 2 runs each, base e4c5cf6 (G-S8 and G-S15 ok in all 12 runs): base G-S18 FAIL 2/2; head 3/3 ok 2/2; "restore never dispatched" FAIL 2/2; "no hold" FAIL 2/2; **M1 control "scroll refresh disabled" FAIL 2/2, only phase (d) fails**; **M2 control "old equality match" FAIL 2/2, only phase (e) fails**.
- **M1 fixed:** `eventObservers: { scroll }` refreshes an un-consumed capture. Live (forced gap, real wheel -400): head before 3020 -> 2556 line 160 (2/2); now 2620 held, line 63+1100 (2/2). Natural second-pane flow: before line 255/257, now line 63+843/852.
- **M2 fixed (hold + position):** insert-above-fence + tracker change: before 3020 -> 5592 line 162, no hold (2/2); now 3020 held, tracker 3039 px, hold seen (2/2). The insert-only 48 px offset is NOT resolved by this change (see below).
- **L1 fixed:** callout in a deleted tracker's slot: before held 3039 px for 2500 ms / 151 frames, then a jump to 2631; now no hold, one jump at ~37 ms to 2631 (same as base).
- **L2:** 25 mutations, every one red (one new test for the last survivor); list below. **INFO-1..4** folded (header wording x3, stale lifecycle note).

## Findings, what changed, numbers
Code: `src/framework/host/livePreviewScrollHold.ts`; tests `test/dom/framework/livePreviewScrollHold.test.ts`; gate `visual-harness/obsidian-lifecycle.mjs`. Live probe: r3's `R3-PROBE` (copied, output prefix `sc478-r4-`), bundles `pre` (af28d59 = the r2 head) and `post`, both with the hold instance exposed.

**M1 (user scroll before a late `set`).** `ViewPlugin.define(create, { eventObservers: { scroll: (_e, v) => hold.refresh(v) } })`. `refresh` re-runs `capture(view, cap.owner)` only while an un-consumed capture exists; `capture` already drops it at scrollTop 0 or when no DSE widget is drawn. After the `set` transaction consumes the capture there is nothing to refresh, so the restore's and the clamp's scroll events never re-capture; the 1 px check stays as the fallback.
| case | before (pre) | after |
|---|---|---|
| `u1-wheel-before-set` (800 ms forced gap, real wheel -400), 2 runs | 3020 -> min 2556, line 160+2, tracker not drawn, no hold | 2620 held, line 63+1100, tracker 3039 px, hold on/off seen |
| `u1-second-pane-wheel` (natural), 2 runs | end 1896 / 1838, line 257 / 255, tracker not drawn | end 2363 / 2372, line 63+843 / 63+852, tracker 3725 px |
Jest: scroll moves the capture; top/out-of-reach drops it; consumed capture not refreshed; observer wiring through `extension().domEventObservers.scroll`.
G-S18 phase (d): Reading pane A writes, LP pane B parked +1500; B's `setViewData` is held back until released (not a timed gap: a first version with an 800 ms timer was measured to lose the race, because the main thread is busy with A's remount and the CDP wheel lands after the timer; the harness now waits for B to reach `setViewData`, sends the real wheel, waits for B's scrollTop to move, then releases). Asserts B ends where the wheel left it (scrollTop min == max == 2620, line 63+1100), tracker redrawn at old height, hold seen and released.

**M2 (insert + change in one write).** Measured the actual diff first: ONE replacement `[478,1538] -> [478,1554]` starting at the old fence start, new widget at 494. `mapPos(start, 1)` cannot reach it (a position at the start of a replaced range maps to the start whatever the assoc), so assoc +1 alone would not fix it. Chosen: an interval `[from, to]` per captured widget; `from = mapPos(start, -1)`, `to` widened to the end of every changed range that touches the old start (`iterChanges`); a replacement widget is held if its start is inside the interval and its `cm-lang-*` matches. This also covers an insertion at the start and a replacement that contains it. The jest `change()` fake now honours assoc and `iterChanges` with CodeMirror's semantics (replacement start stays, pure-insertion assoc decides).
| case | before | after |
|---|---|---|
| `h-insert-before-and-change`, 2 runs | 3020 -> 5592, line 162+1, tracker not drawn, no hold | 3020 held, line 65+1452, tracker 3039 px, hold on/off seen |
| `h-insert-before-only`, 2 runs | 3020, line 65+1452, no hold (tracker not redrawn) | identical |
The 48 px offset (65+1452 instead of 65+1500) remains: CodeMirror maps its own snapshot anchor with assoc -1, so the view starts at the insertion. The hold interval does not touch that mapping, so it is not resolved by this change; reported, not fixed. G-S18 phase (e) accepts it explicitly (top line 2 lines down, offset up to 60 px higher; the inserted paragraph is 48 px) and fails on anything else (base/old-match: scrollTop 3020 -> 5592, line 162).

**L1 (non-DSE embed in the slot).** Each captured widget records its sorted `cm-lang-*` classes; only a replacement with equal classes is held. `n4-delete-tracker-callout-next`, 2 runs: before `holdOn@48 3039` / `holdOff@2548`, 151 held frames, then jump to 2631 (line 107); now no hold, scrollTop 2631 from the first frame (base: the same single jump). Jest: callout / mermaid at the position never held, the tracker is.

**INFO.** I1: header now says the path check fires today (measured: a `modify` listener opening another note, 2/2 restore+hold without the check, 0/2 with it). I2: header documents that a second pane's typing arrives as `doc:set` (no-op restore, 0.4-0.5 ms). I3: header says the hold drops at the first child appended to the root (3-224 ms, 0 painted frames), not at full mount. I4: `obsidian-lifecycle.mjs:45` now reads "G-S14 is SC-457's".
Gate robustness: `record()` now counts any attribute mutation record for `data-dse-lp-hold` as "hold seen" (with `attributeOldValue`), because a hold set and released inside one task is gone before a callback can look for it.

## L2: mutation check (script `mutate2.py`, `mutate3.py`; log `sc478-r4-mutation-check.log`; every file restored from git after each run, tree clean)
One line per mutation: mutation -> test(s) that went red.
1. user-scroll 1 px fallback removed -> "the user wins: a scroll between the capture and the transaction drops the restore"
2. only-`set` check removed -> "never engages on the user's own edit…", "one update that carries a set AND a user transaction…"
3. capture not consumed by the first doc change -> "never engages on the user's own edit…", "nothing is refreshed once the transaction consumed the capture…", "a capture belongs to one note…"
4. path filter -> "captureViewsOf captures only Live Preview/Source views of that path"
5. mode filter -> same test
6. no-DSE skip -> "does not capture at the top, or a view without a drawn DSE widget", "a scroll to the very top, or away from every DSE block…"
7. at-top skip -> same two tests
8. hold release on mount -> "holds the replacement widget … released on mount"
9. per-hold TTL timer -> "a hold that never sees a mount is released after PIN_TTL_MS; releaseAll() drops the rest"
10. pending-entry expiry -> "a block drawn after PIN_TTL_MS is not held"
11. `releaseAll` body -> the TTL/releaseAll test (9)
12. destroy releases holds -> "destroy drops a pending restore and releases a live hold"
13. destroy drops the capture -> "destroy (… setState …) drops the capture"
14. file-identity guard -> "a capture belongs to one note…", "a leaf that shows no file…"
15. capture needs a file -> "a leaf that shows no file…"
16. **[r3 M1 survivor]** `plugin.register(() => lpHold.releaseAll())` removed (`registerFrameworkElements.ts`) -> "registerFrameworkElements releases every hold when the plugin unloads"
17. **[r3 M2 survivor]** pending entry's positions not remapped on a later doc change -> "a later doc change before the replacement is drawn moves the positions to hold along with it"
18. **[r3 M4 survivor, assoc]** `from` mapped with +1 instead of -1 -> "a replacement that starts inside the range the write rewrote is held; one past … is not"
19. **[r3 M4 survivor, equivalent here]** interval not widened to the changed range (the old equality match) -> "insert above the fence AND change the tracker…", "a write that inserts text right at the fence start…", "a replacement that starts inside the range…"
20. **[r3 M3 survivor]** already-held check removed -> was RED (0); new test "a widget that is already held is not held a second time (one release, one requestMeasure)" is red
21. [r3 M5] stale-entry check in the restore microtask -> "destroy drops a pending restore and releases a live hold"
22. [r3 M7] `requestMeasure` on release removed -> "holds the replacement widget … released on mount"
23. [L1] language filter dropped -> "only a replacement of the same language is held…"
24. [M1] scroll observer made a no-op -> "a `scroll` event observer on the plugin refreshes the capture"
25. [M1] `refresh` does not re-capture -> "a scroll event moves the capture along…", "a `scroll` event observer…"

## Gates (e4c5cf6 + head; logs in scratch)
Final-run logs: `gate-{tsc9,lint9,jest9,lifecycle9,e2e9,shots9,parity9}.log` (+ `.rc`) in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`. Freeze read directly: `freeze OK (280/280 frozen print PNGs byte-identical …)`.
Earlier runs on 54f8f88 / 3973b56 / 424f47b were green with the corresponding expected numbers; only the last base is reported as final.

## Proposed `dse-verify/SKILL.md` text (not edited)
Step 4 expect cell: `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed`, id list ends `…, SC-470 G-S15, SC-478 G-S18 (Live Preview keeps its reading position when a tracker is redrawn); G-S16 reserved for SC-471`; G-S18 adds about 1 minute.
Lifecycle paragraph, after the G-S14 entry:
> `G-S18` (SC-478: Live Preview scroll hold — `Lifecycle/tall.md`, a Live Preview pane parked 1500 px into the tracker. Phases: (a) another pane's DSE write, (b1) in-app `vault.process`, (b2) a write on disk via the file watcher, (c) the pane's own write, (d) a second pane whose `setViewData` is held back while a real wheel -400 lands on it, released afterwards (the pane must end where the wheel left it: 2620, line 63+1100), (e) one outside write that inserts a paragraph at the fence AND changes the tracker (top line 2 lines down, offset up to 60 px higher; CodeMirror maps its own snapshot anchor before the insertion). Per phase: write landed; anti-vacuity (the parked tracker root left the document); scrollTop identical in every frame and the expected top line + offset; tracker drawn again at its old height; `data-dse-lp-hold` seen (mutation records) and released; selection unmoved. Controls, built as temporary bundle variants run with `DSE_LIFECYCLE_BUNDLE`: **"restore never dispatched"** (`view.dispatch({ effects: restore })` -> no-op) and "no hold" (`applyHolds` returns at once) FAIL every phase; **"scroll refresh disabled"** (`refresh` returns at once) FAILs phase (d) only; **"old equality match"** (the `iterChanges` widening removed) FAILs phase (e) only. Base bundle FAILs (3020 -> 2556, line 63 -> 160/285; (e) 3020 -> 5592.)
CURRENT numbers at this head: jest 5738 / 1 / 239 of 240, lifecycle 32/32, e2e 101/101 0 known-bug 66/66, shots 580, freeze 280/280, parity 0/0/24.

## Drive-by fixes
None beyond the INFO-4 note the ledger asked for.

## Follow-ups
- The insert-only 48 px offset (CodeMirror's snapshot anchor maps with assoc -1) is not resolved; fixing it would mean building the restore ourselves (`EditorView.scrollIntoView` from a `lineBlockAtHeight` capture), a larger change than this round's scope.
- A timed gap in a lifecycle phase is unsafe whenever another pane's remount keeps the main thread busy (the CDP wheel waits behind it); use a held-back `setViewData` as phase (d) does.
- Kept FAIL temp dirs from my runs were removed by exact path after copying their PNGs; 14 other `/tmp/dse-obsidian-lifecycle-*` dirs belong to other sessions and were left.

## Artifacts (absolute paths)
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`: this report; `sc478-r4-mutation-check.log`; `sc478-r4-disc-summary.log`; `sc478-r4-disc{1,2}-{base,head,norestore,nohold,norefresh,oldmatch}.log`; `sc478-r4-disc-{base,norestore,nohold,norefresh,oldmatch}-G-S18-FAIL.png`; live reproduction `sc478-r4-live-pre.log`, `sc478-r4-live-post.log`, `sc478-r4-live2-post.log`, `sc478-r4-PROBE-pre-live.json`, `sc478-r4-PROBE-post-live.json`, `sc478-r4-PROBE-post-live2.json` (final M2 numbers); diff traces `sc478-r4-DBG-ins-post-dbg.json` (the measured replacement `[478,1538] -> [478,1554]`), `sc478-r4-DBGD-post-dbgd.json` (why the timed gap lost the race); `sc478-r4-build.log`.
Scratch (same dir as before, `.../scratchpad/sc478-r2-a8b4aaae43f31a06f/`): `mutate2.py`, `mutate3.py`, `build-variants2.sh`, `run3.sh`, `r3probe.mjs.txt`, `dbg-ins.mjs.txt`, `dbg-d.mjs.txt`, `bundles/{base,head,norestore,nohold,norefresh,oldmatch,pre,post}`, final gate logs.
