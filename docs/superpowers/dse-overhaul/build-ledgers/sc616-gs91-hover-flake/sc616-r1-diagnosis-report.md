# SC-616 r1: diagnosis of the G-S91 hover-preview flake (reviewer add63411)

## Executive summary
- **Reproduced on c0995beb.** G-S91 alone, current harness: **2 of 17 runs** failed, both `title rv: … preview was gone` (gaps 75, 77 ms). There were 0 of 24 failures with the probe on, and **1 of 52** failures in-session `title` repeats (`title lp`, gap 83). The `155 ms` form (d) was 0 of 17 at load 1-2. It was 2 of 2 title trials at 4x CPU and 4 of 42 title trials at load 8 (harness fix applied, old gate).
- **Cause: mix of (a) and (c).** It is SC-598's documented residual: a click inside the modal is handled before Obsidian's helper timer focuses the preview, so `T3` hides the preview 5 ms later.
  - The trial creates that race itself: the second press is zero-length (down, then up at once) and lands 10-25 ms after the opening click's dispatch ends.
  - The helper's 10 ms timer is only armed at that point, and queued input runs before a timer that is already due.
  - Failing timeline: the timer was due at +72.2 ms, ran at +83.0, and the click was handled at +82.8. Passing margins are 1.7-29 ms, so every trial straddles the race.
- **(d) is a gate artifact.** The 140 ms validity gate is measured from the START of the opening click. That includes the dispatch itself (20-62 ms idle, ~110 ms at 4x CPU), which has no bearing on validity.
- **Recommended fix (harness only, about 10 lines, prototype `sc616-r1-proto-harness-fix.diff.txt`).**
  - Release the second press only after an in-page 11 ms timer has run. DOM timers run in due order, so the helper's timer has run by then.
  - Measure the gate from the END of the opening dispatch.
  - Measured: **12 of 12** green on head (clean diff) and 28 of 28 counting the env-gated probe runs. 20 of 20 green in the worst-case straddle (16 of 20 red without the fix). Green at 4x CPU, where the old gate failed every trial.
  - **Still red on base:** the SC-598-reverted bundle failed 6 of 6 trials in every run (4 of 4 runs), including 4x CPU.
- **Needs Scott: no.** The residual stays accepted (SC-598 O9), and the trial now tests what SC-598 promises. Only closing the residual for real users on slow machines needs Scott, because it needs Obsidian's private API (`setIsFocused`; prototype 20 of 20). That is optional.

## 0. Setup
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`, dse branch `sc616-gs91-hover-flake`.
  - After `git fetch origin`, `origin/develop` = HEAD = `c0995beb`. No rebase was needed.
  - `npm ci` and `npm run build-no-check` were run in the dse worktree (both gitignored).
  - `git status --porcelain` was empty in dse and the superproject, before and after.
  - The final dse HEAD is `c0995beb`, with a clean tree.
- Runs:
  - `node visual-harness/obsidian-lifecycle.mjs --only=G-S91` through devbox, one log per run.
  - "Concurrent" means 3-4 runs started 2 s apart, each with its own Xvfb and port. Other agents were also running lifecycle part 5 at the time.
  - Load average was 1-8.
  - Obsidian 1.15.1.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r1-add63411/`. All logs are there; the deciding ones are copied here.
- Probes and prototypes were env-gated edits to `obsidian-lifecycle.mjs`, uncommitted and reverted. Diffs:
  - `sc616-r1-probe-harness.diff.txt` (instrumentation plus switches).
  - `sc616-r1-proto-harness-fix.diff.txt` (the clean fix).
  - `sc616-r1-proto-product-bp-private-setIsFocused.diff.txt` (product prototype, built in scratch only).
- Base bundle: `git archive c0995beb`, with SC-598's product diff (`b5d18f79..8b84b635 -- src/framework/kit/managedModal.ts`) reverse-applied, built with esbuild (`sc616-r1-build-base.sh.txt`). It is passed with `DSE_LIFECYCLE_BUNDLE`.

### Probe (SC616_TL)
An in-page timeline, installed in `gs91Trial` before the opening press. It records:
- `mousedown`/`mouseup`/`click`/`pointer*` at the window, in both capture and bubble, with `event.timeStamp` (the input's arrival time) and the target;
- every 5/10/150 ms `window.setTimeout` armed and fired, with its arming frame;
- the popover instance's `hide()` (with its caller frames) and `setIsFocused()`;
- `.is-editing`;
- the modal container added and removed;
- long tasks and Event Timing entries;
- `rAF`;
- the harness's point evaluation (`p2eval`).

`SC616_TL=lite` drops the setTimeout wrapper and the observers.

Other probe switches:
- `SC616_REPEAT=N`: N title trials (rv/lp alternating) in one session.
- `SC616_CPU=N`: `Emulation.setCPUThrottlingRate`.
- `SC616_BUSY=ms`: a busy frame after the opening click.
- `SC616_NOLEAD=x,y`: the second press at a cached title point, with no evaluation (the worst-case straddle).
- `SC616_FIX=1`: the fix.

## 1. Reproduction: rates

| Condition | Runs / trials | `preview gone` (title/apply/reopen) | `N ms` gate (d) | Notes |
|---|---|---|---|---|
| Current harness, G-S91 alone or 3-4 concurrent, no probe (plainA/B, plainP3a, plainP4a/b) | 17 runs | **2 of 17 runs**: `title rv` both times (gaps 75, 77; the first trial of the session) | 0 of 17 | Title rv gaps 37-83, title lp gaps 49-118 |
| Same, probe on (tlA/B, tlP3a, tlP4a/b, liteP4a/b) | 24 runs | 0 of 24 | 0 | Margins below |
| In-session repeats, probe on (rep16a: 16 trials; par3a: 3 sessions × 12) | 52 title trials | **1 of 52** (`title lp`, gap 83, trial 12 of par3a-3) | 0 | Natural failing timeline, §2 |
| CPU throttle 2x / 4x (cpu2, cpu4), one run each | 2 runs | 0 | **4x: title rv 171, title lp 160** | Preview stayed in every trial |
| 30 ms busy frame after the opening click (busy30) | 2 runs | 0 | 0 | The harness's evaluation waits behind the frame too |
| Historical (ledger) | base 1 of 4, branch 3 of 6, r3 0 of 12, r4 1 of 2 part-5 runs | always `title rv` | r4: `title lp 155` | |

Per failure form, current harness, natural conditions:
- `title rv` preview gone: 2 of 41 full runs (17 plain plus 24 probe-on);
- `title lp` preview gone: 0 of 41 full runs, plus 1 of 26 in-session repeats;
- `apply`, `reopen`, `dblq`: 0 of 41;
- (d): 0 of 41 at load 1-2, and 2 of 2 title trials at 4x CPU.

Each trial's gap, the at700 state and pass/fail are in the `SC616REC` lines of every log, tabulated in `sc616-r1-margins-all.txt` (probe runs) and `sc616-r1-run-index.txt`.

Not established: why the plain failures were both `title rv`, the first trial of a fresh session. 2 of 17 against 0 of 24 with the probe is not significant (Fisher p≈0.17). A cold first open (a longer dispatch and a longer timer backlog) fits, but it is not proven. The one natural timeline captured is from an in-session `title lp`.

## 2. What hides the preview: timelines

### Failing (natural)
`sc616-r1-timeline-fail.txt`; raw: `sc616-r1-raw-fail-timeline-par3a-3.log`. Trial 12 is `title lp`. Times are in ms from the opening click's window-capture.

| t | event |
|---|---|
| 0.0 | opening click (trusted) capture, on `dse-stamina__ccur`; one long task of 63 ms follows |
| 62.0 | modal container added |
| 62.1 | helper arms 150 ms for the opening click; window bubble |
| 62.1 | **SC-598 synthetic click** |
| 62.2 | **helper arms 10 ms (due 72.2)**; DSE re-pushes 10/150; class removal at 10 |
| 63.3 / 69.5 | frames (rAF) |
| 69.9 / 70.3 | older due timers: T3 (5 ms) and Obsidian's LP `gj` (10 ms) |
| 70.0 | harness point evaluation (`p2eval`) |
| 71.0 | mousemove arrives (dispatched 72.3) |
| **72.9** | **second mousedown arrives**, 0.7 ms after the helper's timer became due; dispatched at 79.1 (main thread busy, un-instrumented) |
| 79.9 | Obsidian's `$oe` 10 ms timer, due since 49 |
| **80.7 → 82.8** | **second mouseup + click arrive and are dispatched**; `T3` collects the preview (not focused) and arms its 5 ms hide |
| **83.0** | **helper's 10 ms timer fires, 10.8 ms late**; `setIsFocused(true)` at 83.1; `.is-editing` at 83.2 |
| 88.1 | `hide()` from `app.js:509:105839` (T3's timer; `foc=true`: T3 collected the preview before it was focused) |
| 133.7 | modal removed (the preview's unload closes it) |

The second press arrived after the helper's timer was due. Both its mousedown and its mouseup/click were still dispatched before it, because queued input runs ahead of due timers.

### Passing (contrast)
`sc616-r1-timeline-pass.txt` (tlA-1, `title rv`):
- synthetic click at 38.8;
- the helper's 10 ms timer, armed at 38.9, fires at 52.4 → focused at 52.6;
- the second mousedown arrives at 63.4 and the click at 66.8;
- margin 14.8 ms, no hide.

The tightest pass (tlB-2, `title lp`) had the helper fire at 42.7, 1.5 ms after the harness's evaluation, with the second mousedown at 46.2. Its margin was 6.4 ms.

### Margins
Margin = second click dispatched − preview focused, from `sc616-r1-margins-all.txt`.
- Current harness, in the 24 probe-on runs and the 52 repeats: title, apply 1.7-29 ms. The one failure was −0.3 ms.
- The race is structural. After the opening click, the harness lead is one evaluation, an awaited `mouseMoved`, then press and release with no hold. That comes to about 8-25 ms after the dispatch ends.
- The helper fires 10 ms after the dispatch ends, plus the timer backlog: 10-37 ms measured.

### Deterministic straddle
E1, `SC616_NOLEAD`: the title point is cached, so there is no evaluation before the second press. Result: **16 of 20 trials red**, all hidden by T3 (`105839`), margins −0.2 to −6.8 ms. This is the shape the SKILL G-S83 footgun (12) already records ("a zero evaluation variant … went red at 41-75 ms gaps").

### Ruled out
- **The hover timer:** every hide is T3's; none came from the hover transition.
- **A leftover from the previous trial:** the failing trial's hide is on its own popover instance.
- **Pointer position:** the second press hit `dse-modal__title-text` in every trial.
- **The 700 ms sampling:** the preview is already gone at +88 ms.
- **A different product bug:** the SC-598 code ran exactly as designed (preventDefault, synthetic click, helper armed, class, re-pushes).

## 3. Classification
**A mix of (a) and (c).**
- **(a):** the mechanism is SC-598's documented residual. A second click handled before Obsidian's helper timer focuses the preview is hidden by `T3`.
  - SC-598 described the residual as "a second press queued in FULL while the modal is still opening". It is wider than that.
  - It covers any click dispatched before a helper timer that becomes due only 10 ms after the opening click's dispatch ENDS, and that can run late behind queued input.
  - A human press holds down for about 60 ms or more. The timer runs during the hold unless the renderer stays busy for the whole press, which is SC-598's slow-machine case.
- **(c):** G-S91's `title` / `apply` / `reopen` trials send a zero-length scripted press 8-25 ms after the dispatch ends. So they sit on the edge of that residual by construction, and the outcome depends on the CDP round-trip against the renderer's timer backlog.
- **(d):** separately, the validity gate counts the opening dispatch's own duration. That is test validity, not product.

## 4. Fixes

### H1: recommended, harness only
Diff: `sc616-r1-proto-harness-fix.diff.txt`, 16+/6−, `gs91Trial` and the G-S91 judge only.

1. **Release ordering.** For title / apply / reopen, send `mousePressed`, then `await t.ev('new Promise(r => setTimeout(() => r(true), 11))')`, then `mouseReleased`.
   - The 11 ms timer is armed after the mousedown has been handled. The helper's 10 ms timer was armed before that, in the opening dispatch. Both are delayed DOM timers on the same frame and run in due order.
   - So the helper has run before the release is sent. This is an ordering, not a margin. It has the same shape as SC-595's re-push argument.
   - It models a press that lasts at least 11 ms. The release still comes long before the base's 150 ms helper.
2. **Gate from the dispatch end.**
   - A window-bubble `click` listener records the end of the opening click's dispatch. The helper arms its timer at the embed container just before, measured at the same 0.1 ms.
   - `gapEnd` = second click capture − that end.
   - The gate becomes `gapEnd < 140`. On the base, the helper's 150 ms timer is armed at that end, so `gapEnd < 140` keeps 10 ms of margin for "the second click came before the base would focus".
   - The FAIL and ok lines print both values. dblq is unchanged (no gate; it is red on base at any gap).

**Measured (H1).**

| Run | Bundle | Result | Gaps (ms) |
|---|---|---|---|
| Clean diff, cleanfixA/B/C (12 concurrent runs) | head | 12 of 12 ok | (A/B ranges) title rv 50-101 (gapEnd 26-66), title lp 62-118 (41-60), apply 45-79 (25-48), reopen 44-58 (23-32) |
| Probe-gated FIX, E4/E5 (16 runs) | head | 16 of 16 ok | title/apply/reopen gapEnd 24-55 (E5) |
| E6 (3 sessions × 14 title trials, load up to 8) | head | 42 of 42 preview kept | old gate: 4 of 42 ≥140 (140/153/159/186); gapEnd max 134 |
| E2, worst-case straddle + FIX | head | **20 of 20 ok** | without the fix 16 of 20 red (E1) |
| E7, 4x CPU + FIX | head | 12 of 12 trials preview kept | old gate failed every non-dblq trial (gaps 142-205); gapEnd 55-114 |
| **Red on base**, clean diff (2 runs) | base | 6 of 6 trials red both runs: title, apply, dblq "preview gone"; reopen "source editor" + "focus in the preview" | gaps 53-123 |
| Red on base, probe-gated FIX (E3, 2 runs) | base | same 6 of 6 | |
| Red on base at 4x CPU (E8, 2 runs) | base | same 6 of 6 | gapEnd 58-108: conclusive, not vacuous |

**Why it is not vacuous.** The release waits only for timers due within about 11 ms of the second mousedown. On the base the helper is due 150 ms after the dispatch end, and `gapEnd < 140` makes sure the release came before it. SC-598 mutants are affected as follows:
- the synthetic click carrying coordinates (150 ms path) is still red;
- no synthetic click (= base) is still red;
- no preventDefault: the 150 ms editor switch is still caught by the `editor` assertion.

**Cost.** About 15-25 ms per trial; negligible for part 5 (~395 s, ceiling ~420 s).

**Doc follow-up (owner, not edited here).**
- dse-verify "Hover preview modals", G-S83 footgun (12): "cutting it further makes the trial red for the wrong reason" no longer applies to the release. The gap gate is now `gapEnd`.
- The G-S91 bullet in "Lifecycle and e2e notes" (SKILL line ~182).
- The G-S91 scenario comment.

**Risk.** It relies on Chromium running same-queue DOM timers in due order. Measured 20 of 20 in the worst case; a failure would show as "preview gone" with a margin under 0 in the probe.

### H1b: optional, bounded retry
Retry an INCONCLUSIVE trial (`gapEnd ≥ 140`) up to 2 more times; never retry a conclusive red. It keeps red-on-base, since base reds are conclusive (gapEnd 58-123). It is not needed on the data: gapEnd max 134 at load 8 (E6). That is close to 140, so it is a belt for heavy hosts. It goes against the "no retries" spirit of the e2e rule; this is a validity retry, so the owner decides.

### P1: product, private API ("bp", SC-598 Q1)
`DseModal.focusHoverPreviewNow` calls the popover's private `setIsFocused(true)` synchronously. The instance is found on the leaves' `view` / `previewMode` / `editMode` / `currentMode` `.hoverPopover` by `hoverEl`. Diff: `sc616-r1-proto-product-bp-private-setIsFocused.diff.txt`.
- **Measured:**
  - E9, worst-case straddle with the current harness: **20 of 20 green** (head: 16 of 20 red). Focus was set at the synthetic click.
  - E10, full scenario: 4 of 4 green, including "a click outside closed it".
- **Public API?** No. `HoverPopover` in `obsidian.d.ts` (1.13.1 typings in node_modules) exposes only `hoverEl`, `state` and the constructor. `isFocused` / `setIsFocused` are private. There is no public synchronous focus.
- **Rejected public-API alternatives:**
  - A DSE window-capture listener that stops and re-dispatches clicks during the 10-30 ms window: synthetic clicks are untrusted and the default actions are fragile.
  - Overriding `targetNode` on the event: monkeypatches an Obsidian extension property.
- **Cost:** SC-598 O2/O9 stand (private API, instance hunt, nested previews not covered; it degrades to today's behaviour when the hunt fails).
- **Benefit:** it closes the real-user residual (a fast double-press while the renderer is busy for its whole length). It does not fix (d), so H1's gate change is still needed.

## 5. Decision for Scott?
- **H1 (recommended): no Scott decision.** It changes only how G-S91 presses and measures. The product claim it checks is exactly SC-598's: a click handled after the preview's 10 ms. The documented residual stays accepted under SC-598 O9.
- **Scott would be needed only to close the residual itself** (P1, private Obsidian API, which SC-598 O9 declined). Suggest a Backlog question to Scott, not part of SC-616.

## 6. Artifacts (this dir)
- `sc616-r1-diagnosis-report.md`: this report.
- `sc616-r1-timeline-fail.txt`, `sc616-r1-timeline-pass.txt`: readable timelines.
- `sc616-r1-raw-fail-timeline-par3a-3.log`: raw log with every `SC616REC` record for the natural failure's session.
- `sc616-r1-raw-plain-fail-title-rv-plainB-1.log`, `sc616-r1-raw-plain-fail-title-rv-plainP3a-2.log`, `sc616-r1-plain-fail-plainB-1-FAIL.png`: plain failures.
- `sc616-r1-raw-harness-fix-green-on-head.log`, `sc616-r1-raw-harness-fix-red-on-base.log`, `sc616-r1-raw-probe-fix-cpu4-head.log`.
- `sc616-r1-margins-all.txt`: per-trial margins, every probe experiment. `sc616-r1-run-index.txt`: every run, with rc, env and load.
- `sc616-r1-probe-harness.diff.txt`, `sc616-r1-proto-harness-fix.diff.txt`, `sc616-r1-proto-product-bp-private-setIsFocused.diff.txt`.
- Scripts: `sc616-r1-runpar.sh.txt`, `sc616-r1-runbatch-env.sh.txt`, `sc616-r1-tl.py.txt`, `sc616-r1-margins.py.txt`, `sc616-r1-build-base.sh.txt`.

Lifecycle FAIL temp dirs kept by these runs (17, literal paths) were deleted, after one screenshot was copied.
