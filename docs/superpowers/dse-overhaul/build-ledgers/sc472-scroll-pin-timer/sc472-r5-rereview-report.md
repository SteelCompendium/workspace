# SC-472 r5: scoped re-review of the r4 delta (dse `4a9e77fb` on develop `eafe76e1`, superproject `1db278aa`)

## Executive summary
- **Verdict: REQUEST_CHANGES.** HIGH 0 · MEDIUM 1 · LOW 3 · INFO 4.
- **MEDIUM-1 from r3 is fixed:**
  - My Risk 4 probes hold on r4: wheel to the end, pin on at the redraw, 7456 -> 6944. That is the same 512 px floor limit stock shows (7008), not the 3.5k collapse clamp. Down then up holds 5656.
  - The ebd81e5e-equivalent build `b8f7fcb2` FAILs G-S59 (c); r4 passes it.
- **The new MEDIUM is r4 follow-up item 7, now reproduced.** Evidence (b) counts a block Obsidian renders for the first time as a reader scrolls it into view as "redraw started".
  - Two trackers, reader scrolls the second into view during a late redraw: r4 releases the pin at +725/+836 ms, and the redraw at +1.34/+1.45 s clamps 10111 -> 6544.
  - Stock holds: pin on, 10111 -> 9663, which is the floor limit.
- **G-S59 (c) is weakened (item 8):** a control that releases 1 s after the root leaves passes "to the end" and is caught by "down then up" only because that scroll is slower. Item 9: the criterion is sound, the end bound is loose.
- **LOW-2 fixed:** navigating away releases 45 ms after the navigation (stock 2548 ms, ebd81e5e 3524 ms).
- **takeRecords:** closes the same-delivery re-pin (r4 held 2/2; the old head clamped 2/2).
- **Gates:**
  - tsc and lint clean.
  - jest 6338 passed / 1 skipped / 252 of 253 suites.
  - Lifecycle G-S8, G-S15, G-S18, G-S42, G-S52 5/5 ok (155 s).
  - G-S59 ok on the 2nd run; the 1st run was a false red on (a) write 3 (LOW-2 below).
  - All on my own port 9473.

## Environment
- Worktree superproject `1db278aa` (` M draw-steel-elements` = r4's unstaged pointer bump, the same before and after). dse `4a9e77fb`, clean before and after. origin/develop `eafe76e1`.
- Bundles are `git archive` builds in scratch (`sc472-r5-bundles-summary.log`). main.js sha256 prefix:
  - r4 `d496299b8fd7` (= the tree build);
  - old `b8f7fcb2` = `d719e7458267` (identical to ebd81e5e);
  - base `eafe76e1` = `ed4295870076`;
  - prevdelay `791aa7fbc9c3`: old head with the end-of-redraw check run 1000 ms after the mutation (`sc472-r5-patch_delay.py.txt`).
- Probes run in a scratch harness copy (`sc472-r5-probe-block.mjs.txt`, injected by `sc472-r5-mkvariant.py.txt`). The variant script now also rewrites the SC-546 `../scripts/xvfb-owned.mjs` import to an absolute path.
- loadavg 1.0-12.4 on 12 cores. The 3 `/tmp/dse-obsidian-lifecycle-*` dirs my FAIL runs kept were deleted by literal path. No SC-546 or SC-551 display/port symptom was seen.

## Findings

### MEDIUM-1: evidence (b) starts the redraw early when the reader scrolls a block in for the first time (r4 item 7; reproduced; regression vs stock)
**Where**
- `src/framework/host/previewScrollPin.ts:564`: `// (b)`, any added root not in `roots0`.
- The header's KNOWN LIMIT (3) at `:237-241` says "Not observed".

**Mechanism.** Obsidian's Reading view renders a section the first time the reader scrolls near it. That runs our processor, which adds a fresh root, which is evidence (b). `redrawDone` then passes once that root mounts: the sizer was never collapsed, so it is still at its arm-time value. The pin is released, and the late redraw collapses the sizer unprotected.

**Probe** (`P3R-RISK4` with `P3R_REL=Lifecycle/p3r-two.md`):
- Fixture: 10 paragraphs, tracker T1 (25 heroes), 80 paragraphs, tracker T2 (25 heroes), 20 paragraphs.
- The reader is parked in T1 and T1's malice is written from outside. A's `setViewData` is held back, then 4 real wheel events of 3000 px reach the end and bring T2 in. The held redraw is released at +1.3-1.5 s, inside stock's 2.5 s.

| | pin released | redraw let go | scrollTop |
|---|---|---|---|
| r4 run 1 | +836 ms | +1448 ms | **10111 -> 6544** |
| r4 run 2 | +725 ms | +1338 ms | **10111 -> 6544** |
| stock run 1 | on at the redraw | +1481 ms | 9947 -> 9663 |
| stock run 2 | on at the redraw | +1409 ms | 10111 -> 9663 |

Logs: `sc472-r5-two3-r4.log`, `sc472-r5-two3-base5.log`.

In the slower-scroll runs (`-two2-*`, `-two-*`) the redraw was let go after 2.5 s, so stock clamped too. Those runs are not a fair comparison, but r4 already released at +840-875 ms and +1421-1461 ms there.

**Scenario.** The geometry is a long session note with several trackers or statblocks, under SC-472's own late-redraw condition. The KNOWN LIMIT text says the first tracker must be virtualised out as well. That second condition is not needed: what triggers the early release is the first render of a block that was not in the DOM at the arm.

**Prescribed fix.**
- Drop (b) as standalone evidence. Count a fresh root only when its arrival is part of a replacement: in the same records batch an arm-time root was removed, or the section that holds the fresh root replaced a section that held an arm-time root.
- Or simply rely on (a) collapse and (c) adoption. A redraw with neither leaves the sizer uncollapsed, so waiting for the backstop (about 3 s) cannot clamp.
- Then re-run G-S8 (adoption on and off), G-S15, G-S42, G-S52 and G-S59 (a)(b).
- Add a G-S59 (c) variant with this two-tracker geometry. Today r4 FAILs it and stock passes.
- Rewrite KNOWN LIMIT (3).
- The CHANGELOG clause "even if you scroll while you wait for it" is false until this is fixed.

### LOW-1: G-S59 (c)'s fixed 300 ms wait lets a late early-release pass (r4 item 8; weakens (c))
**Where:** `visual-harness/obsidian-lifecycle.mjs:4664` (`await t.sleep(300)`), followed at once by the redraw being let go.

**Measured** (`sc472-r5-gs59c-prevdelay.log`). The prevdelay control is the ebd81e5e logic with its release 1 s after the root leaves:
- (c) "to the end" **passed**: the pin was still on at the redraw, scrollHeight stayed 7965 and the reader ended at 6944.
- (c) "down then up" FAILed only because its 26 wheel steps take more than 1 s.
- A 2 s delay would pass both variants.

**Prescribed fix.**
- Let the held redraw go late in the window where a correct build must still be pinned: when page time since the write reaches about `PIN_TTL_MS - 300` (2.2 s), asserting that the scroll ended before then.
- Assert the pin is on at that moment.
- This is the test's own construction (the redraw is held by the test), not a race against Obsidian. Any release during the evidence-free window is then caught, whatever its delay.

### LOW-2: G-S59 robustness: an (a) false red from frame starvation, and (c) cannot run its second variant after the first fails
1. **The (a) false red** (`sc472-r5-gs59-r4.log`, r4 bundle, loadavg 2.9-5.2).
   - Write 3 "timed out waiting for the pin or hold released and the tracker redrawn". The recorder state: scrollTop held 2779, pin on at the redraw (+4650 ms), released, redrawn, but `afterDone` 4 of 10. Only 15 frames were painted in 38.7 s under the 8x throttle.
   - The re-run passed (`-gs59-r4-2.log`).
   - Fix: the throttle is still on while the 10 mounted frames are awaited (`:4470` waits for `done`, which needs `afterDone >= 10`). Wait for `released && redrawAt !== null && mounted()` instead, reset the throttle, then sample the 10 frames unthrottled.
2. **The (c) second variant** (`sc472-r5-gs59-old.log`, old bundle).
   - After "to the end" FAILed, "down then up" died with `page eval failed: TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')`. `parkReading` (`:4448`) runs right after `scrollTop = 0`, before the tracker is drawn again.
   - r4's own control run got both verdicts.
   - Fix: `await t.waitFor(\`!!(${t.root(TRACKER, A)})\`, …)` before `parkReading` in (c).

### LOW-3: G-S59 (c)'s end-position bound is loose (r4 item 9)
**Where:** `obsidian-lifecycle.mjs:4679-4680`.

**The criterion is sound** for the bug under test.
- If the pin is missing during the collapse, scrollHeight falls below its arm value. Old head: pin off before the redraw, so the sizer collapse shrinks the scroller and the test FAILs.
- `shMin` is sampled in the MutationObserver callback at the collapse and on every frame until the recovery.
- One real loss does pass by design: the reader scrolls into content Obsidian measured during the hold, beyond the pinned floor. The floor is the arm-time inline min-height, which the observer never raises to measured content. Measured loss: head -512 px, stock -448 px. The 64 px difference is the padding fix.

**The end bound** (`stEnd >= min(mid.st, endMax) - 1000`) would also accept a 1000 px clamp of another kind.

**Prescribed fix.**
- Bound it exactly: `stEnd >= min(mid.st, sh0 - clientHeight) - 2`. That is the most the floor permits, and head ends at exactly 6944 = 7965 - 1021.
- Optional product improvement: in the observer, raise the floor to `scrollHeight - padding` when the content outgrows it. It never lowers and would remove the 512 px loss. Not blocking.

### INFO
1. **MEDIUM-1 (r3) verified** (`sc472-r5-risk4-r4.log` / `-base5.log`):

| variant | r4 | stock |
|---|---|---|
| no scroll | pin on at the redraw | pin on |
| small scroll | pin on | pin on |
| wheel to the end | pin on at the redraw (+2417 ms), 7456 -> 6944 | 7456 -> 7008 |
| down then up | 5656 held | 5656 held |

   - G-S59 (c): r4 ok in 2 of 2 runs ("scrollHeight stayed 7965 through the collapse", pin released 309-352 ms after the redraw). Old head FAILs (c) "to the end" (`sc472-r5-gs59-old-FAIL.png`).
   - Real redraws are not missed:
     - G-S8 adoption on: 38 frames (stock 154); adoption off: 1115 ms.
     - G-S15, G-S42, G-S52 ok.
     - G-S59 (a)(b) held in every write of both runs.
   - Pin lifetimes, 10 writes (`sc472-r5-cost-r4.log`): redrawn 550-702 ms, never redrawn 2999-3001 ms, another section changed 3000-3002 ms. No pin reached the 20 s cap.
   - Nothing left running afterwards: 0 frame callbacks and 0 DSE timers in 2 s, pins and holds Maps empty, DSE MutationObservers net 0.
2. **LOW-2 from r3 verified** (`sc472-r5-life-r4.log`).
   - Navigating before the redraw: pin off at +51 ms, 45 ms after the navigation (stock 2548 ms, ebd81e5e 3524 ms). The 4544 px of empty scroll space is gone.
   - Navigating at the collapse: off at +488 ms (stock 2546, ebd81e5e 587).
   - Unload and popout close are still clean (attribute, style, pins Map 0).
3. **takeRecords verified.**
   - Same-delivery re-pin, then a redraw 1.5 s later: r4 held 2/2 (pin off at +2302/+2304 ms, after the second redraw). Old head moved 2779 -> 2001 in 2/2 (`sc472-r5-samedeliv-{r4,old}.log`).
   - Re-pin in its own task: held (`-taskrepin-r4.log`).
4. **Mutation spot-check** (`sc472-r5-mutations.log`, baseline 143/143), matching r4's claims:
   - n5, evidence (c) removed: 2 red;
   - n9, `takeRecords` removed: 1 red ("a re-pin drops the records still queued…");
   - n12, `releaseNavigated` releases nothing: 2 red.

**Docs.**
- `livePreviewScrollHold.ts` pane B numbers: correct (LOW-4 done).
- Stale TTL wording: fixed at all six places (LOW-3 done).
- KNOWN LIMIT (1) "about 1 s", with the range +0.98 to +1.32: accurate.
- KNOWN LIMIT (3): wrong, see MEDIUM-1.
- Proposal: the LOW-1 statements (spin, by-construction anti-vacuity, busy rules in jest only) are present and accurate.
- CHANGELOG: units and "about 1 second longer" are correct. "even if you scroll while you wait for it" needs MEDIUM-1 fixed, or a qualifier.

## r4 follow-ups judged
- 7: reproduced, now MEDIUM-1. Fix it; do not accept it as a known limit.
- 8: (c) is weakened in a way that matters (LOW-1). Prescribed fix: let the redraw go at write + about 2.2 s and assert the pin is on.
- 9: the criterion is sound. Tighten the end bound to the floor (LOW-3).

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
- **Gates:** `sc472-r5-tsc.log`, `sc472-r5-lint.log`, `sc472-r5-jest.log`, `sc472-r5-lc-5.log`.
- **G-S59:**
  - `sc472-r5-gs59-r4.log` (the false red), `sc472-r5-gs59-r4-2.log`;
  - `sc472-r5-gs59-old.log`, `sc472-r5-gs59-old-FAIL.png`;
  - `sc472-r5-gs59c-prevdelay.log`.
- **Probes:**
  - `sc472-r5-risk4-r4.log`, `sc472-r5-risk4-base5.log`;
  - `sc472-r5-two-{r4,base5}.log`, `sc472-r5-two2-{r4,base5}.log`, `sc472-r5-two3-{r4,base5}.log`;
  - `sc472-r5-life-r4.log`, `sc472-r5-samedeliv-{r4,old}.log`, `sc472-r5-taskrepin-r4.log`, `sc472-r5-cost-r4.log`;
  - `sc472-r5-mutations.log`.
- **Tooling:** `sc472-r5-probe-block.mjs.txt`, `sc472-r5-mkvariant.py.txt`, `sc472-r5-patch_delay.py.txt`, `sc472-r5-patch_mut5.py.txt`, `sc472-r5-bundles-summary.log`.
