# SC-534 r3: independent review of the CHR-L01 simplification (dse `fe44be1d` on `dabfb518`)

**Executive summary**
- **Verdict: LAND.** Findings: 0 HIGH, 0 MEDIUM, 3 LOW (two comment wordings, one driver option nothing uses any more), 3 INFO.
- **Assertion map:** all 9 checks in the old spec are still there. The only things dropped are the re-hover loop, `waitStable()` and `{ cdp: true }`, the three the ruling allows.
- **Anti-vacuity (SC-502 clip-lift rule reverted, built `styles.css` has 0 `inset(-96px`):** CHR-L01 **0/2 ok**. Both runs fail at **`chrome-live-preview.e2e.ts:29`**: "timed out waiting for the chrome panel to stay revealed with the pointer on Collapse". This is the same check that failed at `:50` before the change.
- **Click probe (ruling D):** with the panel hit-test-transparent, or Collapse covered by an element that keeps the hover, the default click **throws "element click intercepted" at `:31`**. The old `{ cdp: true }` click went through to the editor (cursor moved 0 to 3) and failed later at `:32`. A hidden panel, or a cover that takes the hover, fails at `:31` on both paths, with "still not displayed after 8000ms". The CDP fallback in `dse.ts:334` never picks up an intercepted click: 0 fallbacks in 7 instrumented runs.
- **Flake resistance (HEAD spec + r1 session.ts/run.mjs probes):** churn 150 ms with the pointer parked **10/10 ok**, 0 leaves. CPU x20 with the pointer parked **5/5 ok**, 0 leaves. Positive control (park disabled + churn 150): **0/2**, 52–53 leaves.
- **Full `npm run e2e` (clean tree):** `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0. The parking line is `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`, and CHR-L01 passed in 935 ms.
- Final state: `git status --short` is empty and HEAD is `fe44be1d`. `main.js`/`styles.css` sha256 match the values before the review (`aa4efdf6…`, `ae45354b…`).

## Setup and final state

- Plugin worktree `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements`, branch `sc534-e2e-chrl01-flake`, HEAD `fe44be1d`. Its merge-base with `dabfb518` is `dabfb518`, and it has one commit on top.
- `git diff --stat dabfb518..HEAD`: only `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`, +6/−29.
- Status before: dse clean. The superproject worktree shows ` M draw-steel-elements`, which is the unbumped submodule pointer; it was there before I started and is still there.
- Every probe was applied with `git apply` or Edit and reverted with `git checkout --`. dse `status --short` is empty at the end.
- No xlogo or Xvfb process of mine is left. The other Xvfb processes on the machine belong to `sc546`/`sc472` worktrees and were not touched.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r3-a4d7580444f87a38b/`.
  - The batch runner is `r3-batch.sh`.
  - Per-run logs are in `logs/` and per-batch summaries are `summary-*.txt`.
  - Failure bundles are in `bundles/`.
  - Applied-probe diffs: `r3-C1-applied.diff.txt`, `r3-clickprobe*.diff.txt`, `r3-stress-instr-applied.diff.txt`.

## 1. Assertion map (old `dabfb518` line to new `fe44be1d` line)

| Old | Check | New |
|---|---|---|
| :38-41 | openNote live-preview, start expanded | :18-21 |
| :42 | `cursorLine() == 0` | :22 |
| :45 | `waitStable()` | **dropped (allowed)** |
| :47 | ≤3 re-hover loop | **dropped (allowed)**, now a single `dse.hover(root.root)` at :26 |
| :48 | waitFor "the chrome panel to be revealed by the hover" | :27 |
| :49-50 | hover Collapse, then waitFor "…to stay revealed with the pointer on Collapse" | :28-29 |
| :54 | `dse.click(collapse, { cdp: true })` | :31 `dse.click(collapse)` (**ruling D**) |
| :55 | waitFor "the block to collapse after a real click on Collapse" | :32 |
| :56 | `cursorLine() == 0` (a fall-through would put it on line 3) | :33 |
| :58-59 | default click on Expand, then waitFor expand | :35-36 |
| :60 | `cursorLine() == 0` | :37 |

- Nothing else was dropped.
- `panelRevealed` and `waitStable` were local and had no other users. `browser` is gone from the import. `expect`, `dse`, `NOTE`, `BAR`, `BLOCK` and `cursorLine` are all still used. The spec has no dead code and no unused import.

## 2. Anti-vacuity: SC-502 Live Preview clip-lift reverted

- r1's C1 diff applied cleanly at `dabfb518`; the rule is at `styles-source.css:16883-16888`. The e2e runner rebuilt `styles.css`, which then had **0** matches for `inset(-96px`.
- `--only=CHR-L01` x2 gave **0/2 ok**:
  - run1 `20261102-140159-d47d` and run2 `20261102-140221-f71e` both failed with `Error: timed out waiting for the chrome panel to stay revealed with the pointer on Collapse`.
  - Stack frame `chrome-live-preview.e2e.ts:29:3`.
  - Bundles: `bundles/C1-head-run1/CHR-L01/`, `bundles/C1-head-run2/CHR-L01/`.
- After the change, the spec still fails the SC-502 regression at the same assertion (old `:50`, new `:29`).

## 2b. Click probe for ruling D

**Method.**
- A temporary block before `:31` forced one state at click time, selected by `SC534R3_PROBE`. `SC534R3_CDP=1` switched to the old `{ cdp: true }` click.
- For each run the block logged `elementFromPoint` at Collapse's centre, the panel's computed `pointer-events` and `opacity`, and the click's outcome.
- A log-only line in `dse.ts`'s catch logged any CDP fallback. It was present in K2/K3 and in the stress batches.

| Probe (state at click) | Top element at centre | Default click (HEAD) | Old `{ cdp: true }` |
|---|---|---|---|
| `pe-none`: panel painted (`opacity 1`) but `pointer-events: none !important` (click-through) | `DIV.cm-line` | **throws at :31** `element click intercepted: Element <button … data-dse-control="chrome.collapse" …> is not clickable at point (1211, 260). Other element would receive the click: <div class="cm-line">` (2/2: K, K2) | click **returns**: `collapsed=false cursor=3`. The press reached the editor line, and the test failed later at :32 "the block to collapse…". `recordDrive` still counted the pair (coverage 1/87). |
| `overlay-panel`: an absolutely positioned div inside `.dse-chrome` over Collapse, so the hover is kept | `DIV#r3overlay` | **throws at :31** `element click intercepted … Other element would receive the click: <div id="r3overlay" …>` | returns `collapsed=false cursor=0` and fails at :32 |
| `hidden`: real hidden state (`opacity 0; pointer-events none`) | `DIV.cm-line` | throws at :31 `element ("[data-dse-control="chrome.collapse"]") still not displayed after 8000ms` (from `waitForDisplayed` in `dse.click`) | the same, at :31 |
| `overlay`: fixed div on `<body>` over Collapse | `DIV#r3overlay` | throws at :31 `still not displayed after 8000ms`. The overlay takes the hover from the block and the panel hides (screenshot `bundles/K2-overlay-default-run1/CHR-L01/screenshot.png`) | the same, at :31 |
| no probe (instrumented driver) | n/a | ok (848 ms), 0 fallbacks | n/a |

(An `overlay-in` variant, a fixed div inside the block, did not end up on top of the button. Its top element was `SPAN.dse-btn__icon`, both paths passed, and it proves nothing.)

**Fallback analysis (`e2e/driver/dse.ts:333-335`).**
- The code is `if (/intercepted/i.test(msg) || !/not interactable|out of bounds/i.test(msg)) throw e; await cdpClick(el, opts);`.
- Only errors whose message contains "not interactable" or "out of bounds", and not "intercepted", take the CDP path. "out of bounds" is the inset/actions path's "move target out of bounds".
- An intercepted click is always rethrown. Empirically, 0 `SC534R3-FALLBACK` lines appeared in the 7 K2/K3 runs and in all 15 stress runs.
- The new comment at `:30` can therefore not be falsified by the fallback.
- Ruling D's claim holds: the default click fails at the click line with the cause, where the CDP click passed silently and failed one step later.

## 3. Flake resistance (HEAD spec, r1 instrumentation: `session.ts` + `run.mjs` hunks only)

- The probe patch was split from r1's diff (`r3-probe-instr.patch`) and applied cleanly at `fe44be1d`.
- Every churn run logged `SC539-CHURN on: every 150 ms, window 12582915, DISPLAY :200`, which is the private display.

| Batch | Runs | ok | CHR-L01 leaves | ms | loadavg before → after |
|---|---|---|---|---|---|
| churn 150 ms, park on | 10 | **10** | 0 every run (enter=1, the hover itself) | 816–1335 | 2.26 → 3.86 |
| CPU x20, park on | 5 | **5** | 0 every run | 10900–14668 | 5.31 → 10.19 |
| control: NOPARK + churn 150 | 2 | **0** | 53 / 52 | fail at ~15.8 s | 9.40 → 6.26 |

- The control's run1 failed at `:29` ("…stay revealed with the pointer on Collapse") and run2 at `:27` ("…revealed by the hover"). These are the same two messages as SC-539 r1. They show that the stress condition still bites on HEAD's spec when the park is off.
- 0 CDP fallbacks in any stress run.
- Summaries: `summary-S-churn150-park.txt`, `summary-S-cpu20-park.txt`, `summary-S-nopark-churn150-control.txt`. Control bundles: `bundles/S-nopark-churn150-control-run{1,2}/`.

## 4. Full `npm run e2e` (clean tree)

- Run `20261102-141303-d2bd`, rc 0, loadavg 5.92 → 5.87.
- The pointer was parked: `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`.
- Summary line: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- CHR-L01 ok in 935 ms, with 0 WARN lines.
- Log: `logs/F-full-clean-run1-1793628783032277035.log`.

## Findings

**LOW-1: the root-cause comment is slightly loose. `chrome-live-preview.e2e.ts:23-24`**
- The comment says "the pointer of the shared Xvfb crossing the window while other shards opened theirs".
- What actually happens (`e2e/x11-pointer.mjs:5-10`, dse-verify): the X pointer does not move. It sits at the screen centre, inside every window, and other shards' windows **mapping or unmapping** over it send this window a real Leave/Enter, which drops the synthetic CDP hover. Closing or unmapping a window counts, not only opening one.
- Not false in X11 terms ("crossing" events), but not literal.
- Fix (optional, not blocking): "Earlier flakes here were the shared Xvfb's real pointer, which sat at the screen centre inside every window: another shard mapping or unmapping its window there sent this one a Leave/Enter that dropped the hover (fixed by parking the pointer at 0,0, SC-539), not Live Preview layout or load."

**LOW-2: the click comment names only one failure mode. `chrome-live-preview.e2e.ts:30`**
- It is true when the cover keeps the hover, or the panel is hit-test-transparent: measured "element click intercepted" at :31.
- When the panel is actually hidden, or the cover takes the hover, the same line fails with "still not displayed after 8000ms" from `waitForDisplayed`. Separately, wdio 9.32's `elementClick` retries an intercepted click once after `scrollIntoView({block:'center'})` (`node_modules/webdriverio/build/index.js:7961-7975`), so a cover that is gone by the retry passes.
- Fix (optional): "The driver's default click: it waits for Collapse to be displayed and hit-tests it before pressing, so a hidden or covered Collapse fails here (not displayed / "element click intercepted") instead of the press landing on the editor line."

**LOW-3: `ClickOptions.cdp` has no users any more. `e2e/driver/dse.ts:276`, `:318`, `:325`**
- CHR-L01 was the only `{ cdp: true }` caller in `e2e/` at `dabfb518` (`git grep "cdp: true" dabfb518 -- e2e`). After this change, no spec uses the option.
- `cdpClick` itself is still used by the fallback.
- This file is outside the "spec only" diff, so it is not a blocker for this ticket. Owner's call: delete the option, its branch and its doc line in a follow-up, or keep it as a documented escape hatch.

**INFO-1:** the CDP fallback cannot turn an intercepted click into a CDP click. `/intercepted/` is tested first, and 0 fallbacks were seen in 22 instrumented runs (§2b).

**INFO-2:** with the old `{ cdp: true }`, a click that went through to the editor still called `recordDrive` (`dse.ts:338-339`, "a click that throws drives nothing"). A CDP click never throws, so a pair could be counted as covered by a press that missed. HEAD's default click removes this for CHR-L01.

**INFO-3:** the intercepted throw took about 11.7 s. Part of that is wdio's scroll-and-retry; the rest is driver/chromedriver time. It is well inside the test timeout and the message is precise.

## Verdict

**LAND.** The change proves everything the old spec proved. It fails the SC-502 regression at the same assertion. It tightens the click check exactly as ruling D claims. It held 15/15 under churn and CPU x20 with the pointer parked, and the full run was 124/124 87/87. LOW-1 and LOW-2 are optional comment rewordings. LOW-3 is a follow-up outside this diff.
