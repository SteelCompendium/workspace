# SC-539 r1: CHR-F02 e2e flake diagnosis

**Executive summary**
- **Verdict: a flake in the test environment, not a product race.** No src change is needed. A real user is not affected.
- **Mechanism:** every shard's Obsidian window shares one private Xvfb (1600x1200) and sits at the same place (+288+200, 1440x1100). There is no window manager. Xvfb's real X pointer stays at the screen centre (800,600), which is window (512,400) and inside every window. When another shard's Obsidian maps or unmaps a window over that point, X sends Leave/Enter to ours. Chromium then moves its hover to the real pointer and forgets the synthetic CDP pointer that `dse.hover` put on the bar. `:hover` drops, `.dse-chrome` goes back to opacity 0, nothing moves the pointer again, and `waitForDisplayed` times out after 8 s.
- **Repro rates:**
  - Hover-dependent tests with a foreign window flipping over the pointer every 150 ms: **8/8 fail** (2 runs x CHR-F02, CHR-F03, CHR-L01, INIT-DEF-E04). The messages and the screenshot match the field failures exactly.
  - Same tests with no foreign windows: **15/15 pass** (3 runs).
  - Window flips every 1000 ms: 4/4 pass.
  - Renderer CPU throttled x20: 6/6 pass. A re-render under a resting pointer keeps the hover.
  - Natural 4-shard full runs: 3/3 green, but **11 of 124 tests per run take a real foreign pointer-leave**. In all 3 runs one lands in CHR-F01, 0.37 to 0.58 s before CHR-F02's hover. That is why CHR-F02 is the hot spot.
- **SC-529 / SC-534 (CHR-L01): same cause.** The 150 ms flips reproduce CHR-L01 with both "…to be revealed by the hover" and "…to stay revealed with the pointer on Collapse".
- **Fix: environment, in `e2e/run.mjs`.** Park the real X pointer at (0,0), outside every Obsidian window, right after the private Xvfb starts. This needs no spec change. With the 150 ms flips running it gives **10/10 pass, 0 foreign leaves**. A driver-only re-hover is not enough: under the 150 ms flips it still failed 6/6.

## Q1: mechanism (how the panel is revealed, what the driver does)

- **The reveal is pure CSS, with no JS and no transition.**
  - `styles-source.css:16812-16813`: `.dse-chrome { opacity: 0; pointer-events: none }`.
  - `styles-source.css:16840-16844`: `[data-dse-chrome]:hover .dse-chrome, [data-dse-chrome]:focus-within .dse-chrome { opacity: 1; pointer-events: auto }`.
  - Live Preview adds `.cm-embed-block:hover … .dse-chrome` at `styles-source.css:16897-16901`.
  - The panel is painted **above** the root's box. It is reachable only while the root already has `:hover`: a pointer sent straight to the Collapse button while the panel is hidden hit-tests through to the page.
- **`dse.hover`** (`e2e/driver/dse.ts:358-361`) calls `el.waitForDisplayed()` and then `el.moveTo()`.
  - wdio 9.32 `moveTo` (`node_modules/webdriverio/build/node.js:8573-8593`) is a W3C `pointerMove` with the element as origin. chromedriver turns it into CDP `Input.dispatchMouseEvent mouseMoved` at the element's centre, (886,282).
  - This is a synthetic pointer. The X server's pointer is separate and does not move.
- **`dse.click`** (`dse.ts:320-321`) calls `el.waitForDisplayed({ timeout: 8000 })` first.
  - wdio `isDisplayed` (`node.js:8425-8478`) is `elem.checkVisibility({ opacityProperty: true, visibilityProperty: true, … })`. An ancestor with opacity 0 (`.dse-chrome`) therefore counts as **not displayed**.
  - Only after that does `el.click()` run: a hit test, then a pointer move and press.
- **Probe SC539-X1** (log `probe1.log`): a window from another X client maps over the X pointer.
  - Our page receives a trusted `pointerleave` at **(512,400)**, the real X pointer, with `relatedTarget` null.
  - After it: `rootHover: false`, `opacity: "0"`, `deepest: none`.
  - After the window unmaps, hover sits on `markdown-preview-view` (empty note area). The panel stays hidden and `displayed(2s)` is false.
  - One more `dse.hover` brings it back (`opacity 1`, displayed true).
- **Probe SC539-X2:** a small window that maps **away** from the pointer changes nothing (displayed true).
- The geometry comes from the probe:
  - Electron `getBounds()` gives `{x:288, y:200, width:1440, height:1100}`.
  - `xdotool getmouselocation` gives `x:800 y:600`.
  - Xvfb is started as `-screen 0 1600x1200x24` (`e2e/run.mjs:349`). There is one display for all shards (`wdio.conf.mts:22` `maxInstances: shards`).
  - `setWindowSize` (`e2e/driver/recorders.ts:105-107`, called at `session.ts:23`) resizes the window and keeps its top-left corner.

## Q2: why the panel can stay hidden for 8 s (each candidate)

| Candidate | Verdict | Evidence |
|---|---|---|
| (a) re-render under a resting pointer, `:hover` not re-applied | **Ruled out** | Probe SC539-R1: `previewMode.rerender(true)` replaced the root (tag `orig` became `new`). Chromium re-hit-tested at (886,282) with trusted pointerenter events on the new nodes. Result `rootHover:true, opacity 1, displayed true`. |
| (b) hover lands on a position that is stale after a layout shift | **Ruled out** | Every probe hover landed at (886,282), the bar's centre in the failure screenshot. Throttling the renderer CPU x20 (`Emulation.setCPUThrottlingRate`) over the full CHR-F02 setup, 6 times: 6/6 displayed (probe SC539-C1). |
| (c) focus-out, keyboard mode, or focus left by CHR-F01 | **Ruled out** | The reveal is `:hover` OR `:focus-within`, so focus can only add to the reveal, never remove it. `openNote` detaches every leaf (`cleanup.ts:51-56`). In the control runs, CHR-F01 then CHR-F02 in the same order passed 3/3. |
| (d) a real product race | **Ruled out** | There is no reveal logic in JS to race. CSS `:hover` follows the pointer the browser believes in. |
| **(e) a foreign X crossing event replaces the synthetic pointer** (new) | **Confirmed** | See Q1 probes. The unchanged specs fail 8/8 under the 150 ms flips and pass 15/15 without them. The failure bundle screenshot (`bundles-churn150-run1/CHR-F02/screenshot.png`) matches the sc525-r4 one pixel for pixel in layout: bar expanded, no panel. |

**Why CHR-F02 specifically.** Temporary instrumentation counted trusted `mouseleave`/`mouseenter` events on `<html>` per test. A synthetic pointer never leaves the window, so every leave comes from a foreign X window. The counts over three natural 4-shard full runs (`full-xing-{1,2,3}.log`):

- **11 of 124 tests per run** received a real leave at `512,400`.
- In **every** run CHR-F01 took one, at +579, +455 and +366 ms into the test. That is when another shard's Obsidian (the chrome-live-preview spec, started in parallel) maps its window.
- CHR-F01 lasts about 600 ms, and CHR-F02's hover comes about 1 s after CHR-F01 starts. So the leave lands about 0.5 to 1 s before CHR-F02's hover-to-click gap.
- Load or a slower sibling startup shifts the leave into that gap. That matches both field failures: both were 4-shard full runs, one at load average about 6.5.
- CHR-F07 also takes a leave at about 6 s in every run, but it is keyboard-only and does not care.

## Q3: verdict

This is a flake in the test environment. A real user's pointer *is* the X pointer, so a crossing event moves hover to where the mouse really is: on the bar if the mouse rests on the bar.

The bug needs the browser's idea of the pointer (a CDP-injected position) to disagree with the X server's (the Xvfb screen centre). That disagreement exists only in the harness. A user who rests the mouse on the bar while a window appears and disappears gets the panel back when the window goes away, because the Enter carries their real position. **Not a user-visible bug. No src change.**

## Q4: SC-529 / SC-534 (CHR-L01): same cause, yes

- CHR-L01 (`chrome-live-preview.e2e.ts:45-54`) hovers the root, waits for `pointer-events: auto`, hovers Collapse, waits again, then calls `dse.click(collapse, { cdp: true })`, which also starts with `waitForDisplayed(8000)`. Every one of those waits is exposed in the same way.
- Under the 150 ms flips, CHR-L01 failed 2/2:
  - `churn150-run1`: "timed out waiting for the chrome panel to stay revealed with the pointer on Collapse".
  - `churn150-run2`: "timed out waiting for the chrome panel to be revealed by the hover".
- Neither is an exact match for "…to stay revealed before pressing Collapse", the wording quoted for SC-529/534. That is presumably an earlier revision of line 50; the current spec says "…with the pointer on Collapse". The mechanism is the same.
- The spec's comment at lines 43-44 blames "Live Preview may still be laying out" for an earlier 1-in-2 flake. That is probably this same cause, misattributed.
- In the natural runs CHR-L01 starts in parallel with chrome-focus on another shard, so it sits in the same window-mapping hot spot.
- **One environment fix covers all of them.** A driver-only fix would not cover CHR-L01's own `dse.waitFor` reveal waits at lines 48 and 50.

## Q5: prescribed fix (plan only, not implemented)

**Where:** `e2e/run.mjs`, the headless branch only. Never touch the pointer in `--headed`, where it is a person's real pointer.

**What:**
1. After `startXvfb()` returns (around `run.mjs:493`) and before wdio starts, run `xdotool mousemove 0 0` with `DISPLAY=<private display>`.
2. Optionally verify with `xdotool getmouselocation`.
3. (0,0) is outside every Obsidian window: they sit at +288+200 and the helper window at +10+10. So no later window map or unmap anywhere on the display sends Enter/Leave to a window under test.

**Tool dependency:** `xdotool` is currently `/usr/bin/xdotool` on this host and is not in `draw-steel-elements/devbox.json`.
- Add `xdotool@latest` to devbox packages.
- Resolve it the way `resolveXvfb()` is resolved (`run.mjs:332-341`).
- If it is missing, fail with an `EnvError` (exit 2) rather than skip silently.

**Alternative without the new tool** (not validated): raise the screen to e.g. `3000x2400`, which puts the centre at (1500,1200), and also `setPosition(0,0)` in `setWindowSize`, so no window contains the centre.

**Optional diagnostic belt** in `driver/session.ts`: a page-side counter of trusted `mouseleave` on `document.documentElement` with `relatedTarget === null`, reported in the failure bundle. A future regression of the cause would then say "foreign X pointer crossing" instead of an 8 s display timeout. This is not needed for the fix.

**Validation done (temporary):** the pointer was parked in each session's `before` hook (`SC539_PARK`). With the 150 ms flips running, `churn150-park-run{1,2}` passed 10/10 with `leave=0` for every test. Without parking, the same flips failed 8/8.

**Why it does not weaken CHR-F02:**
- No spec line changes.
- The input is still real: CDP pointer and keys, Tab to Expand, Enter.
- The asserts are untouched: `where()==='chrome.collapse'`, ring `{visible:true, outline:'solid'}`, `.dse-chrome` opacity `'1'`.
- Only the stray X pointer, which the tests never meant to use, is moved off the windows.

**Rejected as the primary fix: a driver re-hover loop in `dse.click`.** Tested as `SC539_REHOVER`: re-`moveTo` the last hovered element until the target is displayed. Under the 150 ms flips it still failed 6/6.
- Run 1: a leave arrived between the displayed check and the click ("still not displayed").
- Run 2: "element click intercepted … Other element would receive the click: `div.markdown-preview-sizer`".
- There are always several CDP round trips between the check and the press, so it narrows the race but cannot close it. It also misses CHR-L01's own waits.

**Specs that share the fix (all of them, with no edits):**
- The ones that hover: CHR-F02, CHR-F03 (`chrome-focus.e2e.ts:68,84`), CHR-L01 (`chrome-live-preview.e2e.ts:47,49`), INIT-DEF-E04 (`initiative/default-keys.e2e.ts:68`). All four failed under the flips.
- Any other real-pointer step whose effect depends on hover state between the move and the press.

## Commands run

All runs were through `devbox run -c <plugin> -- [env …] bash <scratch>/run-e2e.sh <log> <args>`, one foreground call each. The private Xvfb was `:200` every time.

1. `npm ci`.
2. `probe1`: temporary spec `e2e/specs/stamina-bar/zz-sc539-probe.e2e.ts`, `--only=SC539-X0,X1,X2,R1,C1 --shards=1`. Result 5/5 ok; the state values are in the `SC539-PROBE` lines.
3. `full-xing-{1,2,3}`: full 4-shard runs with the crossing counter, each `124/124 ok`, coverage 87/87. Load at the start was 2.4, 3.2 and 4.5.
4. `churn150-run{1,2}`: `SC539_CHURN_MS=150`, `--only=CHR-F01,CHR-F02,CHR-F03,CHR-L01,INIT-DEF-E04 --shards=1`. Each 1/5 ok; only CHR-F01, which is keyboard-only, passed.
5. `control-run{1,2,3}`: same `--only`, no flips. Each 5/5 ok.
6. `churn1000-run1`: 5/5 ok.
7. `churn150-park-run{1,2}`: each 5/5 ok.
8. `churn150-rehover-run{1,2}`: `--only=CHR-F02,CHR-F03,INIT-DEF-E04`. Each 0/3 ok.

All instrumentation was reverted. `git -C <plugin> status --porcelain` is empty at `fb24f8a2`. `node_modules/` (from `npm ci`) and `e2e/.out/` are left behind; both are gitignored.

## Artifacts

Scratch directory: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r1-a3360303193e5c4ae/`

- Logs: `probe1.log`, `full-xing-1.log`, `full-xing-2.log`, `full-xing-3.log`, `churn150-run1.log`, `churn150-run2.log`, `control-run1.log`, `control-run2.log`, `control-run3.log`, `churn1000-run1.log`, `churn150-park-run1.log`, `churn150-park-run2.log`, `churn150-rehover-run1.log`, `churn150-rehover-run2.log`.
- Probe source: `zz-sc539-probe.e2e.ts.txt`, and `probe-instrumentation.diff.txt` (crossing counter, flip driver, park, re-hover: the temporary `session.ts`/`dse.ts` diff).
- Failure bundles: `bundles-churn150-run1/CHR-F02/` (screenshot.png, error.txt, …), `bundles-churn150-run1/CHR-L01/`, `bundles-churn150-run2/CHR-L01/`.
- Runner script: `run-e2e.sh`.

## Follow-ups (seen, left alone)

- `chrome-live-preview.e2e.ts:43-48`: the comment blames Live Preview layout for the old flake, and the 3-try re-hover loop was added for it. Both should be revisited once the pointer is parked, because the loop papers over this cause.
- The e2e README section "Headless vs headed" and the dse-verify e2e row should say that the private Xvfb parks its pointer at (0,0) and that all shards share one display. Put this in a proposal file, per the dispatcher.
- The lifecycle gate (`:160-:199`) and obsidian-shots run a single Obsidian window per display, so they are probably not exposed. Not verified.
- `grep` in agent shells is aliased to ugrep with `-I` (skip binary files). `e2e/run.mjs` reads as binary (`file` says "binary data"), so `grep` on it silently returns nothing. Use `command grep -a`.
