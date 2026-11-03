# SC-472 r3: adversarial review of dse `ebd81e5e` (develop `eaf64ba6`), superproject `276c3f71`

## Executive summary
- **Verdict: REQUEST_CHANGES**, for one MEDIUM: Risk 4 rests on a false premise. A reader who scrolls while a redraw is late, far enough that Obsidian's virtualisation removes the arm-time root, gets the pin released at once. The sizer is still at its arm-time height at that point, so the sizer check does not guard the release, and the late redraw's collapse then clamps. Head: 7456 -> 3889 and 5656 -> 4401. Stock holds the same two runs (its pin was still on).
- Counts: HIGH 0 · MEDIUM 1 · LOW 4 · INFO 6.
- Gates at `ebd81e5e`, loadavg 2-13 on 12 cores:
  - tsc clean; lint clean.
  - jest 6302 passed / 1 skipped / 250 of 251 suites, with the shots cache present.
  - Lifecycle, head: G-S8, G-S15, G-S18 3/3 (94 s); G-S42 1/1; G-S52 1/1; G-S59 1/1 (173 s).
- G-S59 discrimination:
  - Base `eaf64ba6` FAILs (a) 3/3 (2779 -> 2001) and (b) 3/3 (7486 -> 3745).
  - The plain-timer control FAILs (a) 3/3 and (b) 3/3: 2 writes clamped, 1 timed out with the clamp.
  - Anti-vacuity is real: at 1x throttle with no busy spin, both phases FAIL as vacuous (latencies [959,798,1190] and [107,58,52]).
- What the G-S59 controls show:
  - The 4 s spin alone separates the builds. At 1x throttle with the spin, base and the plain-timer control still FAIL 6/6 and head passes.
  - A control with every busy rule removed PASSES G-S59, so the busy rules are tested only by jest.
- Re-pin probes:
  - r2's deviation (i) is load-bearing and correct. A re-arm in its own task followed by a redraw 1.5 s later: head held 2/2; the control without deviation (i) clamped 2/2 (2779 -> 2001).
  - Deviation (ii) did not matter in any real-Obsidian case I could build. It never caused a stuck pin or a clamp.
- Measured head vs stock:
  - Risk 3 band +3.51 s vs +2.53 s (+0.98 s), settled scrollTop 3160 in both: ACCEPT.
  - 64 px: phantom 0 vs 64 px, snap-back 0 vs 64 px.
  - SC-478 pane B hold 3.1-4.1 s vs 3.3-4.0 s, 0 blank frames painted in either.
  - Cost: at most 61 DSE animation-frame callbacks and 2.8 ms per pin; after 10 writes nothing is left running.

## Environment
- dse `ebd81e5e`, superproject `276c3f71`; origin/develop at review start `eaf64ba6`.
  - The owner reports that develop has since moved to `423e798d` (SC-546, harness-only). I did not rebase.
  - None of my runs showed the SC-546 display-race symptom; every failure was an expected control.
- Lifecycle and probes ran on my own CDP port 9473 (other sessions were using 9262), Xvfb `:160–:162`, Obsidian 1.15.0.
- Bundles were built from `git archive` exports in scratch (`sc472-r3-bundles-summary.log`). main.js sha256 prefix:
  - head `d719e7458267` (identical to the tree build and to r2's);
  - base `aa4efdf671c9`;
  - plain `f530e58c9de0`;
  - nobusy `ba5284368013`;
  - nodev1 `656f1279179a`;
  - nodev2 `5bb5bfbee209`.
- Probes ran as scenarios in a scratch copy of the harness (`sc472-r3-probe-block.mjs.txt`, injected by `sc472-r3-mkvariant.py.txt`).
- The page-side accounting wraps `requestAnimationFrame`, `setTimeout` and `MutationObserver` and attributes a call to DSE when its stack contains `plugin:draw-steel-elements`. It also captures the `pins` and `holds` Maps through a `Map.prototype.set` hook.
- `git status --porcelain` was the same before and after: superproject ` M draw-steel-elements`, which is the unstaged pointer bump r2 left; dse clean.
- The six `/tmp/dse-obsidian-lifecycle-*` dirs my FAIL runs kept were deleted by literal path. Two FAIL screenshots were kept as evidence.
- A 429 session cut-off interrupted the round. Every result in this report was read from a completed run.

## Findings

### MEDIUM-1: Risk 4 is real; the "sizer check still guards the release" premise is false
**Where**
- `src/framework/host/previewScrollPin.ts:518`: `if (roots.some((r) => !r.isConnected)) return true;`. The record check at :519-520 has the same flaw.
- `:528`: the check releases on `redrawDone`.
- Header KNOWN LIMITS (3) at `:228-229`.

**Mechanism.** A root removed or put back by Obsidian's scroll virtualisation counts as "redraw started". `redrawDone` then passes at the next frame, because no root is empty and the sizer's inline min-height is still the arm-time value: the real redraw has not collapsed it yet. The pin is released before the redraw it was meant to protect.

**Probe `P3R-RISK4`.**
- Fixture: 10 paragraphs, a 25-hero tracker, 110 paragraphs. The reader is parked 1500 px into the tracker.
- An outside `vault.process` is made, and A's `setViewData` is held back, as in G-S18 (d), so the redraw is late in a controlled way.
- The reader then scrolls with real CDP wheel events. The held redraw is released 1.3-2.4 s after the write, inside stock's 2.5 s.

| variant | head | stock |
|---|---|---|
| no scroll | pin on at release, held 1979 | held |
| wheel +300 x3 (100 px steps) | held 2279 | held |
| wheel to the end (root virtualised out at +1128 ms) | **pin released at +1156 ms, before the redraw; 7456 -> 3889** | pin on at the redraw; 7456 -> 7008 (-448: the content re-measuring, not the collapse) |
| down, then back up | **released at +974 ms; 5656 -> 4401** | held 5656 |

Logs: `sc472-r3-risk4-head-2.log`, `sc472-r3-risk4-base-1.log`. `-head-1` used a longer note, where the collapse could not reach the reader, so it did not clamp.

**Scenario.** A reader scrolls a long note with a tracker while Sync or another pane writes the note. The window is about 30-400 ms unloaded and seconds under load, which is SC-472's own condition. The reader lands up to the tracker's height (about 3 k px) higher. Stock protected this case for 2.5 s; head does not. The ruling that accepted Risk 4 relied on "still sizer-guarded", which this probe disproves.

**Prescribed fix.** Do not treat a disconnect or re-insert alone as "the redraw started". Require evidence that Obsidian re-rendered, at any of these:
- (a) the scroller's sizer inline min-height, or a protected embed sizer, fell below its arm-time value since the arm (a collapse was seen);
- (b) a root that was not in `roots0` was added (a fresh render);
- (c) an arm-time root was re-inserted under a section element that did not exist at arm time (adoption). Virtualisation re-inserts the same cached section.

Without that evidence the pin waits for the backstop, at about 3 s.
- Add a jest test: a root disconnected with no collapse must not release.
- Add a lifecycle phase. Either a G-S59 phase (c), or reuse `P3R-RISK4` "far": held `setViewData` plus a real wheel scroll to the end. Head today FAILs it and stock passes.
- Re-run G-S8: its adoption-on phase must still release early through (c), or through (a) if Obsidian collapses there.
- Fix the header's KNOWN LIMIT (3).

### LOW-1: G-S59 does not discriminate the busy rules, and its 8x throttle is not what discriminates
**Where:** `visual-harness/obsidian-lifecycle.mjs` G-S59 (`RATE = 8`, `BUSY_MS = 4000`); proposal §1.

**Measured.**
- With every busy rule removed (`sc472-r3-patch_nobusy.py.txt`: Reading pin, embed hold and widget hold busy -> false), G-S59 is **ok**: (a) 11.7-14.1 s and (b) 4.5-10.5 s, all held (`sc472-r3-gs59-nobusy-1.log`).
- At 1x throttle with the spin: base FAILs 6/6 (`-r1b4-base`), plain FAILs 6/6 (`-r1b4-plain`), head ok in 86 s vs 173 s at 8x (`-r1b4-head`).

**So:**
- What is under test is "the deadline expires inside a long task right after `modify`": the 30-frame count.
- The rules "never while mounting" and "never while a started redraw is unfinished (60 quiet frames)" have no real-Obsidian evidence. r1's 13/13 also included a build without busy suspension.
- The anti-vacuity holds by construction: `BUSY_MS` (4000) > `PIN_TTL_MS` (2500). It only catches a spin that did not run.

**Fix.** In the proposal's G-S59 entry, say that the spin is what discriminates and that the busy rules are covered by jest only (mutations B4, P2, P3, P4, L1, L3). Either drop the 8x throttle (half the runtime, and the 30 s cap is less exposed to load) or say why it stays. A busy-rule phase is optional; on its own this is not blocking.

### LOW-2: a leaf navigated to another note keeps the old note's floor for about 3.5 s (stock 2.5 s)
**Where:** `previewScrollPin.ts:540-545`.
- `need = scrollTop + clientHeight - padding`. After navigation, `scrollTop` is 0, so `need` is about the viewport height.
- A short note's inline min-height (86 px) never reaches `need`, so `redrawDone` never passes. Release waits for the backstop plus 60 quiet frames.

**Probe `P3R-LIFE` nav-before-redraw.**
- Head: the pin lasted 3524 ms on `other.md`, with scrollHeight 5565 (4544 px of phantom scroll space).
- Stock: 2548 ms with 5629.
- A navigation at the collapse is better on head: 587 ms vs 2546 ms.

**Fix (optional).**
- Release when the scroller's leaf now shows a file other than the one pinned: store the path at pin time.
- Or cap `need` at the current content height when no arm-time root remains connected.

### LOW-3: stale TTL wording in `previewScrollPin.ts`
These lines still describe the fixed timer:
- `:180` "a pin lives 2.5 s";
- `:311` "TTL-bounded";
- `:393-394` "for PIN_TTL_MS";
- `:411` "the TTL restarts a few ms later";
- `:440` "restarts the TTL";
- `:557` "a closed window's TTL never fires".

Also KNOWN LIMIT (1) at `:225` says "1.2-1.3 s longer". The measurements are 0.98-1.13 s here and 1.10-1.32 s in r2; "about 1-1.3 s" is accurate.

**Fix:** reword each to "the backstop".

### LOW-4: the `livePreviewScrollHold.ts` header still says "(r3 probes it)"
**Where:** `livePreviewScrollHold.ts:156-158`, the KNOWN LIMIT line ending "(r3 probes it)".

**Fix:** replace it with the measurement, in substance: "pane B, LP sibling, 8x: hold 3.1-4.1 s (head) vs 3.3-4.0 s (stock), 0 painted blank frames either way".

### INFO
1. **Deviation (i): CONFIRMED load-bearing** (`P3R-REPIN` recovered-rearm-redraw).
   - The probe: the sizer is back, then in a separate task a `modify` re-pins, then the redraw comes 1.5 s later.
   - Head held 2/2 and released at +2344/+2486 ms after the second redraw (`sc472-r3-rearmtask1500-head.log`).
   - The nodev1 control clamped 2779 -> 2001 in 2/2 (`-nodev1`).
   - Hardening, not required: when the re-pin is dispatched inside the same mutation delivery, before DSE's own callback (only possible synchronously from a MutationObserver), DSE's queued records of the previous redraw set `started` again and the pin is released early. Head, nodev1 and nodev2 all clamp in that case (`-repin2-*`, `-rearm300-*`, `-rearm1500-head`); stock holds (`-rearm*-base`). A real vault `modify` is always a later task, so this is not reachable through vault events. `held.observer?.takeRecords()` in `arm()` closes it for free.
2. **Deviation (ii): no stuck pin and no clamp found.**
   - A re-pin during the collapse, in its own task, released 36 ms after the recovery, with or without the deviation (`-collapsetask-*`).
   - A re-pin after a fresh mount while the sizer was still collapsed went to the backstop at +3.04 s.
   - Jest P21 is its only discriminating test.
3. **Other item-2 cases, head, all held, none stuck** (`sc472-r3-repin-head-1.log`, `-life-head.log`):
   - Re-pin at the collapse via `modify`: released 49 ms after the recovery.
   - Two writes 50 ms or 400 ms apart: each redraw released its own pin, about 0.7 s after the last `modify`.
   - Three writes to `other.md` while A's redraw was held: pin on at the redraw, held.
   - Plugin disabled mid-pin: attribute 0, style 0, pins Map 0, 0 DSE frame callbacks in the next 4 s.
   - Popout closed mid-pin: pins Map 1 -> 0.
   - Hidden window (Electron `hide()`, `visibilityState` hidden): head pin 20.0 s (the cap; documented Risk 2) vs stock 3.4 s.
4. **Census.** 36 Reading and Live Preview views: every DSE alias with an empty and a one-line body, the demo vault, G-S56's reference chains, `chrome-frame.md`. None had a permanently empty root, so no note keeps every pin busy until the 20 s cap (`sc472-r3-empty-head.log`).
5. **Cost and leaks** (`P3R-COST`, a Reading pane and a Live Preview pane of `tall.md`, 10 writes, `sc472-r3-cost-head.log` / `-base.log`):

| write kind | head pin life | head DSE frame callbacks / total ms | stock pin life |
|---|---|---|---|
| redrawn (outside write) | 581-680 ms | 34 / 1.1-2.0 ms | 1305-3040 ms |
| never redrawn | 2996-3023 ms | 30 / 1.1-1.5 ms | 2510-2543 ms |
| another section changed | 3002-3022 ms | 61 / 2.0-2.8 ms | 2530-2555 ms |

   - The longest single DSE frame callback was 0.6 ms.
   - Stock ran 0-2 DSE frame callbacks per pin.
   - After the 10th write: 0 DSE frame callbacks and 0 DSE timers in 2 s; nothing active; pins Map 0, holds Map 0; DSE MutationObservers net 0 (15/15).
6. **Docs.**
   - CHANGELOG (`276c3f71`) is plain and accurate. "about 1.2 seconds" fits the measured 1.0-1.3 s.
   - The superproject branch is cut on `7f058b42`, and main has moved since, so expect a CHANGELOG conflict at landing.
   - The proposal's part layout matches my G-S59-alone time: 173 s here, 181 s in r2. I re-ran only my own subsets of parts 1-3, not the full parts.
   - The proposal's controls match my measurements, and its 30 s-timeout environment note is present.
   - It should add LOW-1's two facts: the spin is what discriminates, and G-S59 does not discriminate the busy rules.

## Brief items, answered
1. Gates: see the executive summary. G-S59 head ok, base FAIL (a)+(b), plain FAIL (a)+(b). Anti-vacuity: at 1x **with** the spin, G-S59 does not go vacuous (redraws 4.1-6.0 s); at 1x without the spin it FAILs as vacuous. The gate's anti-vacuity only detects a spin that did not run.
2. Release rule:
   - A clamp is possible: MEDIUM-1, and the same-delivery re-arm in INFO-1.
   - A stuck pin beyond the cap: none found. The hidden window releases at 20 s; the census found no permanently empty root.
   - The remaining cases are in INFO-3.
3. SC-478 pane B (`P3R-LPB`, LP sibling at 8x, no spin, 3 writes each; `sc472-r3-lpb-*.log`):

| | hold (MutationObserver timestamps) | blank-widget frames painted | B scrollTop |
|---|---|---|---|
| head | 3127 / 4134 / 3265 ms | 0 | 3020 held |
| stock | 4047 / 3764 / 3283 ms | 0 | 3020 held |

   The whole hold sits inside long tasks in both builds. No regression; no ticket.
4. Risk 3 (`P3R-RISK3`, two runs each, loadavg 3.4-4.3):
   - Head: pin off +3624/+3657 ms, band to +3514/+3511 ms.
   - Stock: +2530/+2529 ms.
   - +0.98 s, at most stock + 1.5 s. Settled scrollTop 5287 -> 3160 in both, and scrollHeight 6308 -> 4693 in both: **ACCEPT**.
5. 64 px (`P3R-PAD`: reader at the very end, a write the tracker section is not redrawn for, then a scroll to the bottom while pinned):
   - Head: scrollHeight 3275 -> 3275, snap 0, released at +3.0 s.
   - Stock: 3275 -> 3339 (64 px phantom), snap 2318 -> 2254 (64 px), released at +2.5 s.
   - Nothing else depends on the padded height: re-pin and the observer use the max of their inputs; G-S8, G-S15 and G-S42 pass; the 3 jest numbers r2 moved are the only ones.
6. Mutation spot-check (`sc472-r3-mutations.log`, each in its own export; baseline 132/132):
   - m1 (re-arm does not cancel the check) -> 1 red: "re-pin re-arm: a redraw that began before the latest write does not count".
   - m2 (60-quiet-frame limit removed) -> 2 red: "a redraw that started and did not finish holds the backstop until 60 frames…", "…a mutation during that wait restarts the 60".
   - m3 (2-quiet-frame rule removed) -> 4 red, including "Backstop › the last BACKSTOP_QUIET_FRAMES frames must have no activity".
   - All killed by the named tests. Gap: no test covers MEDIUM-1, a disconnect without a collapse.
7. Cost: INFO-5.
8. Docs: LOW-3, LOW-4, INFO-6.
9. G-S59's spin (addendum 9):
   - Faithful for the failure class "the deadline expires inside a long task before the redraw": stock fails it at 1x and 8x alike.
   - Listener order does not matter. DSE's `modify` listener arms synchronously, and the spin is a separate `setTimeout(0)` task registered later. A slow handler that spins synchronously before DSE's would delay the arm, so stock would pass too; nothing is masked.
   - It manufactures nothing seen to be false. It does bunch every redraw after one long task, so the busy-rule orderings are not reached (LOW-1).
   - Environment: the spin is wall-clock. With 8x the scenario ran 155-194 s, with latencies up to 15.3 s inside the 30 s cap at loadavg up to 13.
10. r2's two deviations from the prototype (addendum 10): INFO-1 and INFO-2.
11. Head counts confirmed: jest 6302 / 1 / 250 of 251, and G-S59 runs alone. I did not re-run the full 47-scenario lifecycle, e2e, shots, freeze or parity (not on the brief's list).

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
- **Gates:** `sc472-r3-tsc.log`, `sc472-r3-lint.log`, `sc472-r3-jest.log`, `sc472-r3-lc-a.log` (G-S8/15/18), `sc472-r3-lc-gs42.log`, `sc472-r3-lc-gs52.log`.
- **G-S59 and its controls:**
  - `sc472-r3-gs59-head-1.log`, `-base-1.log`, `-plain-1.log`;
  - `-r1b0-head.log` (vacuity), `-r1b4-{head,base,plain}.log` (1x with the spin), `-nobusy-1.log`;
  - `sc472-r3-gs59-base-1-FAIL.png`, `sc472-r3-gs59-plain-1-FAIL.png`.
- **Probes:**
  - `sc472-r3-risk4-head-1.log`, `-head-2.log`, `-base-1.log`;
  - `sc472-r3-repin-head-1.log`, `sc472-r3-repin2-{head,nodev1,nodev2}.log`, `sc472-r3-rearm300-{head,base}.log`, `sc472-r3-rearm1500-{head,base}.log`, `sc472-r3-rearmtask1500-{head,nodev1}.log`, `sc472-r3-collapsetask-{head,nodev2}.log`;
  - `sc472-r3-life-{head,base}.log`, `sc472-r3-hidden-{head,base}.log`, `sc472-r3-empty-head.log`, `sc472-r3-cost-{head,base}.log`, `sc472-r3-lpb-{head,base}.log`, `sc472-r3-padr3-{head,base}.log` (64 px and Risk 3);
  - `sc472-r3-mutations.log`.
- **Tooling:** `sc472-r3-probe-block.mjs.txt`, `sc472-r3-mkvariant.py.txt`, `sc472-r3-patch_{plain,nobusy,nodev,mut}.py.txt`, `sc472-r3-bundles-summary.log`.
