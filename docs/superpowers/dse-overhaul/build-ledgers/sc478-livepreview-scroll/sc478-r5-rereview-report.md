# SC-478 r5 scoped re-review: fix round a57cfb5..24e9179 (dse 24e9179 on e4c5cf6)

## Executive summary
- **Verdict: REQUEST_CHANGES.** New findings: 0 HIGH, 1 MEDIUM, 2 LOW, 1 INFO.
- **r3 fixes, proved live (head vs base e4c5cf6):**
  - **M1 fixed.** Second-pane wheel ends at line 63+780 / 63+802 (base line 255 / 255). Forced gap: 2620 held at line 63+1100, 2/2 (base 2556, line 160).
  - **M2 fixed.** 3020 held, hold at line 65 (3039 px), 2/2 (base 2604, line 162).
  - **L1 fixed.** No hold; one jump at about 62 ms, 2/2.
  - **Mutations.** My three r3-LOW-2 survivors now fail (red). r4's #23 and #24 fail. My new r5a and r5c fail. **r5b ("widen to every change") survives.**
- **Discrimination, six bundles, 2/2 each.** Head ok. Base FAILs all 6 phases. norestore and nohold FAIL all 6. norefresh FAILs (d) only. oldmatch FAILs (e) only. G-S8 and G-S15 ok in 12/12.
- **Phase (d) and the hold sighting are realistic and non-vacuous.** In nohold and norestore, "hold seen false" appears in every phase.
- **N-M1 (MEDIUM).** One write that changes the tracker and anything above it is one `set` replacement starting at the first change. The restored snapshot anchor collapses to that start, so the pane lands at "first change + old offset":
  - title edit plus tracker change: 1515 px off;
  - paragraph edit plus tracker change: 240 px off;
  - insert above a preceding tracker plus tracker change: about 1468 px off.
- **N-L1 (LOW).** The widened interval holds the wrong block: two same-language trackers share one interval, so T2 was held at T1's 1396 px, 2/2.
- **N-L2 (LOW).** Over-widening is untested (mutation r5b survives).
- **Gates on 24e9179:** tsc rc 0, lint rc 0, jest `5738 passed / 1 skipped / 239 of 240`, lifecycle `32/32 ok, 0 failed`, e2e `101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`. Shots/freeze/parity are carried from r4 (580 / 280/280 / 0/0/24), because the delta touches only the LP module, its jest suite and the lifecycle harness: no CSS, no render code.

## State
- dse HEAD is 24e9179; porcelain was empty before and after.
- The superproject shows ` M draw-steel-elements` before and after.
- Nothing was committed.
- My local `origin/develop` ref reads e4c5cf6. Per the owner, develop has moved to d152ea4; this review stays on 24e9179 / e4c5cf6 and does not report the move.
- A weekly-limit 429 interrupted the session. Every r5 run log that predates the stop carries its own `rc=` line or rc file, so all runs were complete. After the resume I ran only e2e and the cleanup.
- Bundles (`sc478-r5-build.log`): r5-head, r5-base (the 3 wiring lines removed), r5-norestore, r5-nohold, r5-norefresh (`refresh` returns at once), r5-oldmatch (the `iterChanges` widening is a no-op), and r5-expose (head plus `window.__sc478r3`). Every temporary edit was reverted with `git checkout --`.

## 1. r3 findings, live (`sc478-r5-PROBE-r5-r5-{expose,base}-fix.json`)

| case | head 24e9179 | base e4c5cf6 |
|---|---|---|
| M1 natural: two LP panes, real click in A, 12 × -60 wheel on B (2 runs) | end 2300 / 2322, **line 63+780 / 63+802**, tracker 3725 px, restore + hold at line 63; 1 refresh at st 2960 before B's set | 1836 / 1839, line 255+2 / 255+5, tracker not drawn |
| M1 forced: `setViewData` deferred 800 ms, real wheel -400 (2 runs) | **2620, line 63+1100**; 6-7 refreshes (0.1-0.3 ms each) only before the set; restore + hold at line 63 | 2556, line 160+2 |
| M2: insert at the fence and change the tracker (2 runs) | **3020, line 65+1452** (the dropped 48 px CM offset), hold 3039 px at line 65 | 2604, line 162+2 |
| L1: callout slides into the deleted tracker's slot (2 runs) | **no hold**, one jump at 62-64 ms to 2631, line 107 | 2578, line 107, one jump |

Mutation re-check (`sc478-r5-mutation-check.log`, one suite run each, every file restored):

| mutation | result |
|---|---|
| r3 M1: `plugin.register(() => lpHold.releaseAll())` removed | **red**: "registerFrameworkElements releases every hold when the plugin unloads" |
| r3 M2: `open.widgets` remap removed | **red**: "a later doc change before the replacement is drawn moves the positions…" |
| r3 M3: already-held check removed | **red**: "a widget that is already held is not held a second time…" |
| r3 M4: `from` mapped with +1 | **red**: "a replacement that starts inside the range the write rewrote is held…" |
| r4 #23: language filter removed | **red**: "only a replacement of the same language is held…" |
| r4 #24: scroll observer made a no-op | **red**: "a `scroll` event observer on the plugin refreshes the capture…" |
| r5a: widening made strict (`fromA < w.to`) | **red** (2 tests: insert-at-start, insert + change) |
| r5b: widen `to` over **every** change (condition removed) | **GREEN 27/27: survives** (see N-L2) |
| r5c: `refresh` re-captures a view with no capture | **red**: "nothing is refreshed once the transaction consumed the capture…" |

## 2. New G-S18 phases and the hold sighting
Six-bundle discrimination (`sc478-r5-disc-summary.log`, `--only=G-S8,G-S15,G-S18`, 2 runs each):

| bundle | G-S18 result |
|---|---|
| head | ok 2/2. (a)-(c) 3020 held at line 63+1500. (d) 2620 held over 11 frames, line 63+1100, tracker 3725 px. (e) 3020, line 65+1452. |
| base | FAIL 2/2, all 6 phases. (a)/(c) line 285; (b1)/(b2) line 160; (d) 2620 → 2556, line 285; (e) 3020 → 2604, line 162. Hold seen false. |
| norestore | FAIL 2/2, all 6 phases, the same lines as base. Hold seen false. |
| nohold | FAIL 2/2, all 6 phases. Max 6231/5544/5592, hold seen false. |
| norefresh | FAIL 2/2, **(d) only**: 2620 → 2556, line 285+2. |
| oldmatch | FAIL 2/2, **(e) only**: 3020 → max 5592, line 162+1. |

- **Phase (d) is realistic.** The phase patches B's own `setViewData` once, keeps the original's `this`, `data` and `clear`, and calls it after the wheel. Real Obsidian takes exactly this path, only later, by 1.2-1.9 s (measured r3 / r5 natural flow).
  - Order: `modify`, then capture (DSE's listener), then `setViewData`, which the phase is waiting for, then the real CDP wheel, a real `scroll` event and `refresh`, then the original `setViewData` and the `set` transaction.
  - No code path is synthesized: the refresh comes from a real scroll event.
  - The natural, unforced flow above reproduces the same outcome on head (line 63+780 / 802) and the same loss on base (line 255).
  - The phase asserts the wheel moved B by more than 100 px before releasing, so it cannot pass without the gap scroll.
- **The mutation-record hold sighting is non-vacuous.**
  - It counts only `attributes` records with `attributeFilter: ['data-dse-lp-hold']` under the observed scroller, and only `hold()` writes that attribute.
  - In nohold (2 × 6 phases) and norestore (2 × 6 phases), every phase reports "hold seen false".
  - It therefore cannot pass without a real `hold()` on that pane. It does not check which block was held (see N-L1), but each phase also asserts position and height.

## 3. Regression probes (`sc478-r5-PROBE-r5-r5-expose-reg.json` and others)
- **Refresh never fires from the restore's or the clamp's scroll, and never on a consumed entry** (`refresh` instrumented on the instance; counted only when a capture existed).
  - `r5-gap-noscroll` (800 ms forced gap, no user scroll): 0 refreshes before the set, 0 after; scrollTop 3020 in every frame after the set.
  - `r5-gap-wheel` (-400): 8 refreshes, all before the set, 0 after; after the set, min = max = 2620.
  - `r5-gap-wheel-down` (+400): 7 refreshes before the set, 0 after; 3420 held, line 63+1900.
  - No snap-back: `u2-wheel-asap` 3020 → 3420, kept; `u3-wheel-after-restore` 2620, kept to 4.5 s.
- **Scrolling to the top drops the capture.**
  - `r5-gap-top0` (scrollTop = 0 in the gap): one refresh with `keep=false`; no restore, no hold; 0 in every frame.
  - `r5-gap-top` (a real wheel of -6000) stopped at 26, not 0, so the capture was kept and the pane restored to 26. That is correct, as nothing moved.
- **Language filter.**
  - `r5-twolang` (a counter, then the tracker; insert at the counter's fence plus tracker change): hold at the tracker (line 72, 3039 px); the counter was not held.
  - `r5-twolang-change-both`: tracker hold at line 70, 3039 px.
  - `r5-between-callout`: the callout (line 92, 101 px) was not held; T2 was held (line 95, 3039 px).
  - The legitimate holds were not broken.
- **Cost of the scroll observer** (`r5-cost-scroll`; 20 real wheel steps, 35 ms apart):

  | | refresh calls | refresh time | frame dt median / p95 / max |
  |---|---|---|---|
  | no capture | 106 | 0.3 ms total | 16.7 / 18.4 / 19.4 ms |
  | lingering capture | 107 | **12 ms total, max 1.2 ms** | 16.8 / 18.8 / 20.7 ms |
  | base | – | – | 16.7 / 19.3-20 / 26-29 ms |

  Not measurable in frame times. See I-1 for the lingering capture.
- **Widened interval and adjacent blocks:** see N-M1 and N-L1. `r5-adj-insert-T1-only-change-T2-none` (T2 untouched): line 90 → 92+1499, correct.

## Findings

### MEDIUM N-M1: a write that changes the tracker and anything above it restores to "first change + old offset"
- **Where:** `src/framework/host/livePreviewScrollHold.ts:211` (`snapshot: view.scrollSnapshot()`) and `:271` (`restore: cap.snapshot.map(u.changes)`). This is pre-existing r2 code, newly exposed by r5's neighbour probes.
- **Mechanism, measured:**
  - Obsidian's `set` diff is a single replacement from the first to the last changed character: `[0-1538>0-1547]`, `[398-1538>398-1545]`, `[477-1968>477-1984]`.
  - The snapshot anchor is the start of the block at the viewport top, which is the parked tracker. It lies strictly inside that replacement.
  - `ChangeSet.mapPos(pos, -1)` maps an inside position to the replacement start (`@codemirror/state` index.js:736-752, `assoc < 0 ? posB`).
  - So the restore lands at the first changed line plus the old offset. The hold itself is correct in every case.

| case (`*-title.json`, `*-adj.json`) | before | head | base |
|---|---|---|---|
| `r5-title-and-change`: `# tall` → `# tall (synced)` plus tracker value (2/2) | 3020, line 63+1500 | **1505, line 62+9 (1515 px off)** | 2556, line 160 |
| `r5-para-above-and-change`: "PRE filler 25" edited plus tracker value (2/2) | 3020, line 63+1500 | **2780, line 63+1260 (240 px off)** | 2556, line 160 |
| `r5-adj-insert-T1-change-T2`: insert at T1's fence plus T2 change; parked in T2 (2/2) | 4439, line 90+1499 | **3019, line 92+31 (about 1468 px off: the top of T2)** | 5666, line 189 |
| `r5-between-callout`: same, with a callout between (1/1) | 4564, line 93+1500 | **3019, line 92+31 (lands in the callout)** | 5738, line 192 |
| `r5-twolang`: insert at the counter's fence plus tracker change (1/1) | 3125, line 70+1499 | 3019, line 72+1345 (154 px off) | 2678, line 169 |

- **When the error is small:** if the first change lies inside a block, the error stays at 24 px. Measured for `r5-adj-span-both` (line 90+1475) and `r5-twolang-change-both` (line 70+1475).
- **Why this is not the dropped 48 px:** the owner's DROP rationale, "the shift is exactly the inserted paragraph", does not hold for this shape. The error is the whole distance from the first changed character to the tracker's top. That distance is unbounded: a title or frontmatter edit in the same Sync / git / plugin write is about 1500 px here, and grows with the note.
- Head is still much better than base in every row, so this is not a regression. It is a residual gap in the "keeps its reading position" promise for multi-change outside writes.
- **Prescribed fix:**
  - At capture, record whether the viewport-top block is a captured DSE widget: from `lineBlockAtHeight(scrollDOM.top − documentTop)`, take `b.from === widget start`, plus `offset = y − b.top`.
  - In `applyHolds`, when that widget's replacement is matched, store its `posAtDOM` on the pending entry. This runs in `docViewUpdate`, before the restore microtask.
  - In the microtask, if that anchor is set, dispatch `EditorView.scrollIntoView(anchorPos, { y: 'start', yMargin: -offset })` (verify the sign live). Otherwise keep the mapped snapshot.
  - The same change also removes the dropped 48 px case.
- **Tests:**
  - jest: the anchor widget's matched start is used and the mapped snapshot is not.
  - Lifecycle: a G-S18 phase (f), "edit the title and change the tracker in one write". On base it lands at line 160; on head today at line 62+9; it expects line 63+1500.
- If the owner keeps this out of SC-478, it needs a follow-up ticket, and the header (:24-41) should state the limit.

### LOW N-L1: two same-language blocks inside one replacement get the first entry's height
- **Where:** `livePreviewScrollHold.ts:305` (`entry.widgets.find(…)` returns the first match), together with the `mapWidget` widening at `:162-168`.
- **Measured (`r5-adj-both-drawn`, 2/2):**
  - Setup: T1 (10 heroes, 1396 px) directly above T2 (25 heroes, 3039 px). Parked 300 px into T2, so both are drawn and captured. One write inserts at T1's fence and changes T2: `[477-1968>477-1984]`.
  - Both entries' intervals become `[477, 1984]`, so T2's replacement (line 92) was held at **1396 px** (T1's height) instead of 3039.
  - The final position (1819, line 65+251) is fully explained by N-M1, because the hold is sub-frame (0 painted frames). So the wrong height is not visible today.
  - It becomes load-bearing once N-M1's fix anchors on the matched widget.
- **Prescribed fix:** use each entry at most once, and assign the replacements found inside a shared interval to entries in document order (both lists are already in document order). Add a jest test with two same-language blocks in one replacement.

### LOW N-L2: over-widening the interval is untested
- **Where:** `livePreviewScrollHold.ts:165`.
- **Measured:** mutation r5b (`to = Math.max(to, toB)` for every change, the touch condition removed) leaves 27/27 green. It would widen every interval to the end of any later change in the same update.
- **Prescribed fix:** a jest case with two changes in one update, where the second is far after the block and a same-language widget starts inside it. Assert that widget is not held.

### INFO I-1: a lingering capture is refreshed on every scroll event until the next doc change
- A pane's own autosave `modify`, or a `modify` with no `set` after it, leaves a capture in every LP pane of the note that shows a DSE widget.
- While it lives, each user scroll event re-captures it: 107 calls, 12 ms total, max 1.2 ms per call, over 20 wheel steps. Frame times are unchanged (p95 18.8 vs 18.4 ms).
- It is consumed by the next doc change. A later `doc:set` (for example a second pane's typing) restores to the current position, which is a no-op.
- Acceptable. Optionally bound it by dropping the capture after PIN_TTL_MS with no doc change. That is a decision, not a requirement.

## Gates (24e9179, my runs)

| gate | result |
|---|---|
| tsc (+e2e) | rc 0 |
| lint | rc 0 |
| jest | `Tests: 1 skipped, 5738 passed, 5739 total`; `Test Suites: 1 skipped, 239 passed, 239 of 240 total` |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` (port 9380) |
| e2e | `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` |
| shots / freeze / parity | carried from r4 (580 incl. modal host-leak and text-scale lines / 280/280 / 0/0/24). The delta touches `livePreviewScrollHold.ts`, its jest suite and `obsidian-lifecycle.mjs` only. |

## Artifacts
All of these are in the ledger dir, `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`:
- **Report:** `sc478-r5-rereview-report.md`.
- **Discrimination:**
  - `sc478-r5-disc-summary.log`;
  - `sc478-r5-disc{1,2}-r5-{head,base,norestore,nohold,norefresh,oldmatch}.log`;
  - `sc478-r5-disc-{base,norestore,nohold,norefresh,oldmatch}-G-S18-FAIL.png`.
- **Probes:** `sc478-r5-PROBE-r5-r5-{expose,base}-{fix,adj,title,both,cost}.json`, `sc478-r5-PROBE-r5-r5-expose-reg.json`, and the matching `sc478-r5-{fix,adj,title,both,cost,reg}-r5-*.log`.
- **Mutation:** `sc478-r5-mutation-check.log`, `sc478-r5-mut-*.log`.
- **Gates:** `sc478-r5-gate-{tsc,lint,jest,lifecycle,e2e}.log`, `sc478-r5-gate-rc.log`.
- **Build:** `sc478-r5-build.log`.
- **Tooling:** `sc478-r5-probe-r5.mjs.txt`, `sc478-r5-r5-cases.txt`, `sc478-r5-{variants-r5,run-r5,probe-r5,disc-r5,mutate-r5,gate-r5}.sh`, `sc478-r5-summ.py`.
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r3-a486fa043b5abce34/` (`bundles/r5-*`, the working copies of the scripts).
- The 10 kept harness FAIL temp dirs were removed by exact path after their PNGs were copied.
