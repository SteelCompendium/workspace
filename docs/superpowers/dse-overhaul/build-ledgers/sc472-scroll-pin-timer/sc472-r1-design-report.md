# SC-472 r1: the scroll pin's timer under CPU load (repro and design)

## Executive summary
- **Reproduced on stock `ad018cd`.** SC-470's Live Preview sibling case: 3 of 4 writes clamped 2779 -> 2001 at 8x CDP throttle, and 3 of 4 under real load (24 busy loops, loadavg 22-27). SC-522's Live Preview embed case, with a second pane showing B: 2 of 3 redrawn writes clamped 7486 -> 3745 at 8x.
- **Not reproduced:** G-S8 adoption off (0/5 at 8x, 0/4 real), the SC-479 Reading host (0/8 at 8x, with and without a second pane), G-S52 (a) alone (0/4 at 8x), and the SC-478 Live Preview own pane (0/4 at 8x). They held only because of task ordering: the timer task ran after the long task that held both the collapse and the recovery.
- **Mechanism.** Another pane's redraw blocks the main thread for 3-10 s. The note's own redraw then starts late: 8.6-11.4 s after `modify` at 8x, 3.0-6.2 s under real load. The timer task runs right after the collapse task (Reading pin), or just before the redraw starts (SC-522 hold).
- **A longer timer is not the fix.** With a 10 s timer the LP sibling case still clamped 1 of 4 at 8x (collapse at +11.4 s). The latency has no bound.
- **Recommended design.** Every pin and hold releases on the redraw: the blocks are mounted again and the protected sizer heights are back. A backstop stays for writes that are never redrawn. The backstop counts the page's own progress: PIN_TTL_MS (2500 ms, unchanged), then 30 painted frames. It never fires while a block is still mounting, or while a redraw has started and not finished (60 quiet frames are allowed for a redraw that shrank the note). A hard cap of 20 s ends every hold.
- **Each part is needed.** Release-on-redraw with a plain 2.5 s timer still clamped the SC-522 two-pane case 3 of 4 at 8x. The full prototype held 4/4 there, 13/13 on the LP sibling case at 8x, and 4/4 under real load.
- **Unloaded side effects.** Redrawn writes release at +0.24-0.56 s, down from 2.5 s. Writes Obsidian never redraws release at +2.99 s, up from 2.5 s. The 64 px of phantom space on every pin is gone (the first pin included the scroller's padding).
- **Lifecycle on the prototype:** G-S8, G-S15, G-S18, G-S42 and G-S52 all pass unloaded.
- **Risks.**
  - 10 of 92 jest tests in the two scroll pin/hold files encode the timer-only release. They must be rewritten.
  - Every pin now runs an animation-frame loop for at least 30 frames.
  - In a hidden window no frames run, so a pin there lasts until the 20 s cap. The pin is invisible there.
  - The release check costs 0.34-0.36 ms per frame that has a mutation, during a redraw.

## Environment
- dse `ad018cd`. `origin/develop` moved during the round to `88cb7db9` (SC-539, e2e-only commits: `e2e/run.mjs`, `e2e/x11-pointer.mjs`, `e2e/README.md`). `src/` and `visual-harness/` are unchanged, so every result here holds for `88cb7db9`.
- Obsidian 1.15.0, Xvfb `:160`/`:161`, CDP port 9472.
- Nothing ran in the tree.
  - Bundles were built from `git archive` exports in scratch.
  - The lifecycle harness ran as a scratch copy, with a probe block injected. The block adds per-scenario CDP throttle, a page timeline recorder and the P472 scenarios (`sc472-r1-probe-block.mjs.txt`, built with `sc472-r1-mkharness.cjs.txt`).
  - `git status --porcelain` was empty in the worktree and in its dse submodule at the end.
- Bundles (main.js sha256 prefix):
  - stock `a37fbb6f2986`;
  - proto `539f1c63bc32` (final; the earlier proto `cb01d9cb6a04` has no busy-suspension);
  - proto-plain `35a1d1f11eae` (release-on-redraw with a plain 2.5 s timer);
  - longttl10 `470931305b4c` (stock with PIN_TTL_MS = 10000);
  - debug builds proto-dbg `54540102f6fa` and plain-dbg `670815bf4dc1`.
- The load average was recorded at the start and end of every run (`load0` / `load1` in each log). Other efforts ran lifecycle at the same time. The unthrottled runs saw loadavg 2-22.
- The real load came from 24 `bash` busy loops on 12 cores. They were started and killed by the PIDs recorded in the log. None was left running afterwards.

## A. Survey: what arms each pin, what releases it, and the timer

Line numbers are for stock `ad018cd`, under `src/framework/host/`.

| Pin / hold | Armed by | Releases on the redraw? | Timer |
|---|---|---|---|
| Reading-view note pin, SC-198/SC-470 floor rule. The sizer floor is a per-pin `<style>`. | <ul><li>Writer `pin()`: `previewScrollPin.ts:324-332`, called before a write.</li><li>`pinReadingViewsOf()` on vault `modify`: `:340-357`, wired at `registerFrameworkElements.ts:60`.</li><li>Re-pin: `:365-377`.</li></ul> | **No.** The MutationObserver (`:397-407`) only raises the floor. | <ul><li>`setTimeout(PIN_TTL_MS)`: `:395`; a re-pin restarts it at `:376`.</li><li>Other releases: `release` `:433-441`, `sweep` `:419-423`, `releaseWindow` `:426` (on `window-close`, `registerFrameworkElements.ts:62`), `releaseAll` `:444` (on unload, `registerFrameworkElements.ts:56`).</li></ul> |
| SC-479 host pins | <ul><li>`pinReadingViewsOf` with `own = false` (`:345-353`).</li><li>`pin()` takes the outermost scroller (`:329-331`).</li><li>The `overflow-anchor: none` rule (`:219`) is gated by `embedStopWanted` (`:276`, `:371`, `:387`) and lasts as long as the pin.</li></ul> | **No.** Same pin, same timer. | `:395` / `:376` |
| SC-478 Live Preview capture and restore | `captureViewsOf` -> `capture` on `modify` (`livePreviewScrollHold.ts:249`, `:352`; wired at `registerFrameworkElements.ts:68`). Re-captured on scroll (`:394`). | **Yes.** The restore runs on the `set` transaction (`:405-443`). The capture has no TTL. | <ul><li>The pending entry is dropped `PIN_TTL_MS` after the transaction (`:426-428`).</li><li>The ViewPlugin's `destroy` -> `forget` (`:488`).</li></ul> |
| SC-478 widget hold (an empty replacement widget kept at its old height) | `applyHolds` -> `hold` in `docViewUpdate` (`:446`, `:463`) | **Yes:** a MutationObserver releases it on mount (`:481-483`). | `setTimeout(release, PIN_TTL_MS)` from the hold (`:477`), as a backstop. |
| SC-522 Live Preview embed hold | `holdEmbedsOf` -> `holdEmbed` on `modify` (`:270`, `:278`) | **Yes.** <ul><li>A fresh root mounted, or a held root put back (`:325`, `:330-331`).</li><li>A redraw with no fresh view, one task later and re-checked (`:337-343`).</li></ul> | `setTimeout(release, PIN_TTL_MS)` from `modify` (`:313`), as a backstop. |

Which rely on the timer: both Reading pins rely on the timer alone. The SC-522 hold, the SC-478 widget hold and the SC-478 pending entry release on the redraw, with the timer as a backstop. The SC-522 backstop is the one that fails under load: it counts from `modify`, so a redraw that starts after 2.5 s is not protected.

Harness constants tied to the TTL, all in `visual-harness/obsidian-lifecycle.mjs`. Each one samples until the pin or hold is released, plus 10 frames, with a cap of **first sighting + 4500 ms, 12 s, or 5 s if the pin never appears**:
- G-S8: comment at `:1631`, the cap expression at `:1637`.
- G-S15: `:2217`.
- G-S18: comment at `:2391`, the cap at `:2392`.
- G-S42: comment at `:3190`, the cap at `:3191`, `:3294` and `:3330`.
- G-S52: comment at `:3970`, the cap at `:3973`.

The two `t.sleep(2500)` calls are not tied to the TTL. `:1318` is G-S4, which waits for a click's write and adoption. `:1465` is G-S6e, which waits after the plugin is enabled again. Neither checks the pin.

## B. Reproduction on stock `ad018cd`

Per case, in ms after `modify`. "Redraw" is the first DSE root removed. "Collapse" is the sizer's inline min-height falling (inner = an embed's sizer). "Recovery" is the sizer back at its height. "Timer" is when the pin or hold attribute was removed. Per-write timelines are in `sc472-r1-summ-<run>.txt`.

| Case (scenario) | Load | Clamped | Timings |
|---|---|---|---|
| G-S8 note, adoption off (`P472-RDOFF`, and G-S8 itself) | 8x CDP | **0/4** + G-S8 0/1 | <ul><li>Collapse +233-309, recovery +2099-3627.</li><li>Timer +5314-6573: queued behind the mount's long task, so it ran after the recovery.</li><li>G-S8 at 8x FAILs on its own harness cap ("pin never seen released within 6175ms"), with scrollTop held. SC-459's single 2779 -> 2001 was not seen again.</li></ul> |
| same | real load, 24 loops (loadavg 22-27) | **0/4** | Collapse +69-238, recovery +550-1544, timer +2501-3060 |
| SC-470 LP sibling: `tall.md` in Reading pane A and LP pane B, both parked in the tracker, outside `vault.process`, A observed (`P472-LPSIB`) | none | 0/4 | Redraw +29-44, recovery +221-285, timer +2497 |
| same | 8x CDP | **3/4, 2779 -> 2001** | <ul><li>B's LP redraw runs first.</li><li>A's redraw: collapse +9177-10190 (after a 9 s main-thread gap).</li><li>Timer +9494-10600, right after the collapse task.</li><li>Drop +9684-10959; recovery +11.5-11.7 s.</li><li>In the one write that held, A redrew first (+298).</li></ul> |
| same | real load, 24 loops | **3/4, 2779 -> 2001** | Collapse +2994-6177, timer +3252-6480 (right after the collapse), drop +3367-6608 |
| SC-479 Reading host, G-S42 (a) geometry: `embhost.md` at its end, `vault.process` of `embtracker.md` (`P472-HOST`) | 8x CDP | **0/4** | Embed redraw +143-244, inner sizer 110 px until +2252-3154, timer +2505-3250 (after the recovery) |
| same, plus a second Reading pane showing B (G-S42 (d) load) | 8x CDP | **0/4** (+4 writes not redrawn in the window) | The embed redraw in A came at +420 to +5732. The timer ran at +4276-8948, always just after the recovery, in the same long task. No margin by design. |
| SC-522 LP host, G-S52 (a) geometry: `lpembhostend.md` at its end, `vault.process` of `lpembtracker.md` (`P472-LPEMB`) | 8x CDP | **0/4** | Embed redraw +150-332, hold released at mount +596-1463 |
| same, plus a second Reading pane showing B (G-S52 (c) load) | 8x CDP | **2/3 redrawn, 7486 -> 3745** | <ul><li>B's pane redraws first (+4.0-5.2 s).</li><li>The hold timer fires right after it: +4881, +5441.</li><li>A's embed redraw then comes unprotected at +5877 / +6359.</li><li>Drops at +11237 / +11788 (when CodeMirror next measures).</li></ul> |
| G-S52 itself | 8x CDP | FAIL, (c) anti-vacuity | (c): A's embed was not redrawn within the harness cap. The hold had already been released by its timer at +6413, after a 6.2 s long task. The harness cannot run at 8x. |
| SC-478 own LP pane, G-S18 (b1) geometry (`P472-LPOWN`) | 8x CDP | **0/4** | Hold -> mount 428-2818 ms. Released at mount. The worst mount came 2818 ms after the hold, past the nominal TTL. The timer task happened to be queued behind it. |

## C. Prototype: release on the redraw, with a load-aware backstop

The patch is `sc472-r1-prototype.patch`: 3 files, +198/-25. `git apply --check` is clean on `ad018cd`.

- **`redrawBackstop.ts` (new): the `Backstop`.**
  - It fires once PIN_TTL_MS (2500 ms) of wall clock have passed, then PIN_BACKSTOP_FRAMES (30) animation frames have been painted.
  - The last 2 of those frames must have no owner activity, and `busy(quiet)` must be false.
  - PIN_HARD_CAP_MS (20 s) fires whatever `busy` says.
  - A busy main thread paints no frames, so the backstop waits for it.
- **`previewScrollPin.ts`, both Reading pins.** The "redraw" starts when the arm-time roots are disconnected, removed or re-inserted (adoption re-inserts one). It ends when:
  - no root of ours in the scroller is empty, and
  - every protected sizer is back. The scroller's own sizer must reach at least min(its arm-time value, scrollTop + clientHeight - padding), so releasing cannot clamp. Each DSE-bearing embed's inner sizer, keyed by its `.internal-embed`, must reach its arm-time value. Each comparison allows 2 px.
  - The check runs once per animation frame after a watched mutation.
  - A re-pin re-arms, so a redraw that began before the latest write does not count.
  - The backstop's busy rule: a root still mounting, or a redraw started and not finished with fewer than 60 quiet frames.
  - Also: the first pin's height is now `scrollHeight - padding`. It used to be `scrollHeight`, a 64 px phantom on every pin that re-pins already corrected.
- **`livePreviewScrollHold.ts`.** The SC-522 embed hold, the SC-478 widget hold and the SC-478 pending entry use `Backstop`. Their busy rules are "a root in the embed is empty" and "the connected widget is not mounted". Their release-on-redraw rules are unchanged.

### C1. B's cases at the same load

| Case | Stock | Longer timer (10 s) | Release-on-redraw + plain 2.5 s timer | **Prototype** |
|---|---|---|---|---|
| LP sibling, 8x | 3/4 clamped | **1/4 clamped** (collapse +11395, timer +11721) | 0/4 (luck: the timer's release waits for the next frame, which came after the recovery; plain-dbg trace) | **0/4** final; 13/13 over all proto builds |
| LP sibling, real load (24 loops) | 3/4 | not run | not run | **0/4** |
| G-S8 adoption off, real load | 0/4 | not run | not run | 0/4 |
| SC-522 LP embed + second pane, 8x | 2/3 clamped | not run | **3/4 clamped** (hold gone +6536/+7239/+7348, A's redraw +6720/+7477/+7504) | **0/4** (e.g. A's redraw +6841 under the hold, released at mount +7244) |
| SC-479 host + second pane, 8x | 0/4 | not run | not run | not run (no stock failure to compare against) |

The plain-timer column is what separates the designs. Releasing on the redraw is not enough, because the SC-522 hold expires before the redraw starts. The frame gate is load-bearing.

In the LP sibling runs, the prototype releases at the first painted frame after the recovery. Under load that is +0.3-3 s after it; the proto-dbg trace shows the check passing at that frame.

### C2. Unloaded checks (final prototype, `P472-READC` / `P472-HOSTC`, loadavg 2-5)
- **Adopted own write (Reading, adoption on):** pin off at +493 ms (stock 2500).
  - Reading host, adopted: +240.
  - LP embed, adopted: +228 (stock already released here).
- **Redrawn writes:**
  - Reading pin off at +484-555, about one frame after the recovery (+219-266).
  - G-S8's adoption-off phase was pinned 36 frames (stock 154).
  - G-S42's phases were pinned 3-4 frames (stock about 150).
  - LP embed: +59 / +81 (unchanged).
- **A write that is never redrawn** (a paragraph far below the tracker changed): the backstop fired at **+2991 ms** (stock 2500). In the host the same case fired at +2995 and +2996. The phantom space in that window is now 0 px; the stock pin added 64 px.
- **Two writes 1 s apart:** each pin was released by its own redraw (+517 / +521; host +310 / +346; LP +81 / +59). The re-arm worked: the second write started a fresh wait.
- **A redraw that never comes:** the backstop fires (the cases above).
  - In a hidden window only the 20 s hard cap runs, because animation frames do not.
  - Not exercised: a redraw that started and then shrank the note at its end. By the rule it is released after 60 quiet frames, so a blank band lasts about 2.5 s + 1 s (stock 2.5 s).
- **Cost** (SC-470 Risk 1 is unchanged: no custom property, the same per-pin `<style>`):
  - Pin set: 1.9 ms on the prototype, 2.8 ms on stock (first set of a fresh pin on a 2439-node view).
  - The arm-time scan: 0.09-0.11 ms.
  - The end-of-redraw check: 0.34-0.36 ms per frame that has a mutation during a redraw. Measured in-page on `tall.md` and `embhost.md`, 2000 iterations, each after an invalidated style.
- **Lifecycle on the prototype, unloaded:** G-S8, G-S15, G-S18 3/3 ok (`e-lc1`); G-S42, G-S52 2/2 ok (`e-lc2`). G-S52 (f), the deleted block, released 0 frames after the redraw.
- **Lifecycle at 8x:** G-S8 and G-S15 FAIL on both stock and the prototype, with scrollTop held. The cause is the harness's wall-clock caps: "pin never seen released within 5-8 s", and one "not on the scroller when the sizer collapsed to nullpx" anti-vacuity.
- **Jest** on the two files (`test/dom/framework/previewScrollPin.test.ts`, `livePreviewScrollHold.test.ts`): stock 92/92, prototype 82/92. The 10 failures are tests that release by advancing fake timers past PIN_TTL_MS, plus the test of the first pin's height. The patch does not rewrite them.

## D. Recommendation

**Release every pin and hold on the redraw, and keep a load-aware backstop. Do not lengthen the timer.**

- **Release rules, per pin:**
  - **Reading pins, own and host:** release when the redraw that started after the latest arm is over: every DSE root mounted and every protected sizer back, as in the prototype.
  - **SC-522 embed hold:** release rule unchanged.
  - **SC-478:** restore, widget hold and pending entry unchanged.
- **Backstop:** PIN_TTL_MS = 2500 ms wall clock, then 30 painted frames, then 2 quiet frames.
  - It never fires while a root of ours is mounting.
  - On Reading pins it also never fires while a started redraw is unfinished, unless 60 frames pass with no mutation.
  - A hard cap of 20 s ends every hold.
  - Why not a longer timer: 10 s still failed at 8x (redraw start +11.4 s), and the real-load start reached +6.2 s. The latency has no bound under load; painted frames measure what matters.
  - What it costs: the backstop matters only for writes that are never redrawn. With the padding fix their phantom space is 0 px; the only phantom left is a shrink that Obsidian does not redraw. Measured cost: +0.49 s of pin life on those writes, unloaded.
- **Separate the 64 px padding fix** as its own bullet: it is a pre-existing bug, and its exposure grows with any longer pin.
- **Harness constants.**
  - No unloaded constant must change: every cap still fits, and every pin is now shorter or about 0.5 s longer.
  - Update the comments that say "TTL 2500 ms" (G-S8 `:1631`, G-S18 `:2391`, G-S42 `:3190`, G-S52 `:3970`). They would read "backstop 2500 ms + 30 frames".
- **G-S59, a new lifecycle scenario under CDP 8x throttle, is worth adding instead of throttled phases in G-S8/G-S42/G-S52.** Their wall-clock caps and anti-vacuity checks cannot run at 8x; both bundles FAIL there.
  - **G-S59's phases** use an event-based wait: until the pin or hold attribute is gone and the tracker is mounted, with a 30 s cap.
    - (a) The LP sibling: `tall.md` in Reading A and LP B, both parked in the tracker, an outside `vault.process`, A observed.
    - (b) The SC-522 two-pane case: an LP host at its end, a Reading pane showing B, an outside write.
    - Assert per write: scrollTop identical in every frame, the release seen, the tracker redrawn.
    - Throttle only around the writes, and reset the throttle in a `finally`.
  - **How it discriminates (measured clamp rate per write):**
    - Stock FAILs: (a) 3/4, (b) 2/3.
    - The "plain-timer backstop" control FAILs (b): 3/4.
    - The "10 s timer" control FAILs (a): 1/4.
    - The prototype holds both: (a) 4/4 final (13/13 all proto builds), (b) 4/4.
    - With 3 writes per phase, stock and the plain-timer control fail almost every run. The 10 s control escapes about (3/4)^3 = 42% of runs, so do not cite it as a gate control.
  - **Cost:** about 2.5-3.5 min at 8x for 3 + 3 writes. It needs its own `--only` part, and G-S56 must stay last.

### Risks, with numbers
1. **Jest:** 10 of 92 tests in the two files assume the timer-only release and the padded first height. They must be rewritten with fake timers and stubbed animation frames (jsdom has no `requestAnimationFrame` unless configured; the prototype then falls back to retrying every 100 ms until not busy).
2. **Hidden or occluded windows:** no frames run, so a pin lasts until the 20 s hard cap. It is invisible there. When frames resume, it fires after 30 frames.
3. **A shrink at the note's end** (a block deleted): released only after the 2.5 s deadline, 30 frames and 60 quiet frames, about 3.5 s unloaded (stock 2.5 s). The blank band lasts about 1 s longer. Phantom space never clamps; the clamp then lands where stock's does.
4. **An early release** if the reader scrolls during a delayed redraw, and Obsidian's virtualisation removes or re-inserts one of the arm-time roots: that counts as "redraw started". After that the sizer check still guards the release. Not observed.
5. **Dependence on Obsidian internals:** the release keys on DSE roots and on Obsidian's inline `min-height` writes to the sizer. If Obsidian stops writing it, `redrawDone` never passes and the backstop releases, as today plus about 0.5 s. That fails safe.
6. **Per-frame work:** about 0.35 ms per frame that has a mutation, only between a write and its redraw.

## Follow-ups (noticed, left alone)
- **The 64 px phantom on every stock pin.** `previewScrollPin.ts:388` uses `scrollHeight` with the scroller's padding. Measured in every stock run: sh 5565 -> 5629, 3908 -> 3972, 6251 -> 6315 for the pin's life. A reader parked at the end who scrolls into it is snapped back 64 px at release (`P472-HOST` resets: 2887 -> 2951 -> 2887). The prototype fixes it. It can be shipped on its own.
- **SC-478 widget holds in the LP sibling runs were released by the timer, not on mount.** For example, on stock at 8x (`b-lpsib-thr8-1`) the hold was set at +384, the mount was seen at +2112, and the hold was released at +4441. The held widget is probably one that CodeMirror replaced. Pane B was not sampled.
- **G-S52 cannot run under heavy load.** Its (c) anti-vacuity times out first. dse-verify's "false red" sentence for G-S52 covers it, and the recommended design would remove the false red.
- **A Live Preview leaf keeps a hidden Reading view that also re-renders embeds** (the `mh3rd` events in G-S52 timelines). That is extra main-thread work on every write to an embedded note. Out of scope.
  - **Correction (2026-11-02, SC-548 r1):** this does not reproduce. Obsidian 1.15.0 skips rendering a hidden Reading view (`MarkdownPreviewRenderer.onRender` returns while the preview element has no `offsetParent`), so DSE runs 0 renders there. The `mh3rd` events here were visible Reading renders: G-S52's `openHost` opens each host in Reading first, and those renders fell into the previous write's timeline window. SC-548 was closed as Canceled. Evidence: `../sc548-lp-hidden-reading-redraw/sc548-r1-measure-report.md`.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
- **Prototype:** `sc472-r1-prototype.patch`.
- **Tooling:**
  - `sc472-r1-probe-block.mjs.txt` (the P472 scenarios and the timeline recorder) and `sc472-r1-mkharness.cjs.txt`;
  - `sc472-r1-run.sh`, `sc472-r1-realload.sh`, `sc472-r1-mkbundle.sh`, `sc472-r1-variant.sh`, `sc472-r1-build-all.sh`, `sc472-r1-build-dbg.sh`, `sc472-r1-build-plaindbg.sh`, `sc472-r1-summ.py.txt`;
  - `sc472-r1-bundles-summary.log`.
- **Logs:** `sc472-r1-log-<run>.log` (raw, including the `P472-TL` timeline JSON) and `sc472-r1-summ-<run>.txt` (per-write timelines).
  - **Stock:** `b-gs8-thr8-1`, `b-rdoff-thr8-1`, `b-lpsib-thr1-1`, `b-lpsib-thr8-1`, `b-real24-1`, `b-host-thr8-1`, `b-host2-thr8-1`, `b-lpemb-thr8-1`, `b-lpemb2-thr8-1`, `b-gs52-thr8-1`, `b-lpown-thr8-1`, `f-cost-1`.
  - **Prototype:** `c-lpsib-thr8-2` (earlier proto), `d-lpsib-thr8-dbg-proto-dbg`, `c-lpsib-thr8-5`, `c-real24-1`, `c-lpemb2-thr8-1`, `c-gs8-thr8-1`, `e-lc1`, `e-lc2`, `f-c-1`, `d-c1-1` (earlier proto).
  - **Alternatives:** `c-lpsib-thr8-3-proto-plain`, `d-lpsib-thr8-plaindbg-plain-dbg`, `c-lpemb2-thr8-plain-proto-plain`, `c-lpsib-thr8-4-longttl10`.
  - **Jest:** `sc472-r1-jest-stock.log`, `sc472-r1-jest-proto.log`.
