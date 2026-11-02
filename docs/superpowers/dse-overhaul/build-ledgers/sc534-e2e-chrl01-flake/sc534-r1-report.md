# SC-534 r1: does CHR-L01 still flake after SC-539, and can its re-hover loop go?

**Executive summary** (dse `97284051`, worktree `sc534-e2e-chrl01-flake`; crossing counter on in every run)
- **Still flakes: no.** With 150 ms churn and park on, 20/20 ok with 0 leaves. With CPU x20 and park on, 10/10 ok with 0 leaves. In 2 full runs, `124/124 ok … 87/87 pairs` both times, with 0 foreign leaves on CHR-L01 and **0 on all 248 test executions**. Before the park, SC-539 r1 measured 11 per run.
- **Positive control (park disabled, 150 ms churn): 0/5 ok**, 53–54 leaves at 512,400 per run. The shipped re-hover loop does **not** mask the bug: it made 2–3 hovers and every run still failed at `:48` "…to be revealed by the hover".
- **B1** (one hover, keeps `waitStable`): churn 20/20, CPU x20 10/10. **B2** (one hover, no `waitStable`): churn 20/20, CPU x20 10/10, full run `124/124 ok … 87/87`. 0 leaves in every run. B2 with park disabled fails 0/3 at the same line as the shipped spec.
- **`waitStable` is not needed.** It was measured in 93 of the runs above that keep it, A1/A3 included. Every time it took the minimum 3 polls (about 104 ms, about 120 ms at CPU x20), and every time it saw **1 distinct rect** (`536,273.6 700x81.2`). The block never moves after `openNote` returns.
- **Anti-vacuity holds.** The SC-502 clip-lift rule was reverted, and separately all 3 SC-502 Live Preview rules. Shipped, B1 and B2 each fail 0/n, with either click path, always at **`:50`** "timed out waiting for the chrome panel to stay revealed with the pointer on Collapse". The panel is revealed by the root hover (`:48` passes). On the pinned 1.14.4 the clip applies only while hovered, so the move to Collapse's centre leaves the clipped widget and the panel hides.
- **D** (default `dse.click` instead of `{ cdp: true }`): churn 10/10, CPU x20 10/10. Combined with B2: churn 5/5, CPU x20 5/5. 0 leaves. Under the SC-502 revert it fails at the same `:50`, before any click.
- **Recommendation: drop the loop and `waitStable`, which is B2.** Delete the now-unused `waitStable` (`:19-34`), `panelRevealed` (`:16-17`) and the `browser` import, and rewrite the `:43-44` comment. For **D**: the default click is equally green and is the driver's normal path (with the hit-test), and the `:51-53` comment names the wrong cause. A change is worth it if the owner rules it in scope. If not, fix the comment.

## Setup

- Plugin `git log -1` = `97284051`, branch `sc534-e2e-chrl01-flake`. Status was clean before and after; the superproject worktree was clean before and after.
- `npm ci` was run first, because `node_modules` was absent.
- **Probe instrumentation** (temporary, all reverted; diff in `sc534-r1-probe-instrumentation.diff.txt`):
  - `e2e/driver/session.ts`: SC-539 r2's `SC539_CHURN_MS` churn generator, an `xlogo` 1600x1200+0+0 mapped and unmapped every n ms by xdotool. It runs on the shard's inherited `DISPLAY`. The first run's log shows `SC539-CHURN on: every 150 ms, window 12582915, DISPLAY :200`, which is the private display.
  - Also in `session.ts`: the `SC539-XING` counter of trusted `mouseleave`/`mouseenter` on `<html>`, per test.
  - Also in `session.ts`: `SC534_CPU=<rate>`, which sends `Emulation.setCPUThrottlingRate` in `beforeEach` and resets it to 1 in `afterEach`.
  - `e2e/run.mjs`: `SC534_NOPARK=1` throws inside the park `try`. The runner then prints `OBSIDIAN-E2E WARN pointer NOT parked: SC534-PROBE park disabled …` and continues, which is SC-539 r3's control.
  - `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`:
    - `SC534_VARIANT=shipped|B1|B2` and `SC534_CLICK=cdp|default` choose the variant.
    - The `SC534-STABLE` log records polls, distinct rects, ms and the rects.
    - The `SC534-LOOP` log records the hovers made and whether the panel was revealed afterwards.
- **Anti-vacuity CSS** (temporary, reverted):
  - C1 removes the SC-502 clip-lift rule (`styles-source.css:16883-16888`: `contain: none !important; overflow: visible; display: flow-root; clip-path: inset(-96px …)`). Diff: `sc534-r1-anti-vacuity-C1-clip-lift-reverted.diff.txt`.
  - C2 also removes the Live Preview reveal rule (`:16897-16901`) and the one-liner padding rule (`:16910-16913`). Diff: `sc534-r1-anti-vacuity-C2-all-sc502-lp-rules-reverted.diff.txt`.
  - The e2e runner builds `main.js`/`styles.css` itself. After the C1 build, `styles.css` had 0 matches for `inset(-96px`.
- **Final state:**
  - Probes reverted with `git checkout --`.
  - `main.js`/`styles.css` rebuilt from the clean tree. sha256 `a37fbb6f…` and `ae45354b…` match SC-539 r4's `sc539-r4-sha256.txt`.
  - `git -C <plugin> status --short` is empty, and so is the superproject worktree's `status --porcelain`.
  - No Xvfb or xlogo left running.
  - Ignored leftovers: `node_modules/`, `e2e/.out/`, `main.js`, `main.css`, `styles.css`.

## Every batch

The "leaves" column is the CHR-L01 trusted `mouseleave` total over the batch, with the per-run maximum in brackets. Loadavg is the 1/5/15-minute value before → after the batch. No CPU-burn tools were used.

| Batch | Condition | Runs | ok | failed | leaves | loadavg |
|---|---|---|---|---|---|---|
| A1 | shipped, churn 150, park on | 20 | 20 | 0 | 0 | 4.08 4.71 6.01 → 3.90 4.24 5.63 |
| A2 | shipped, churn 150, **park off** | 5 | 0 | 5 | 266 (54) | 3.46 4.12 5.56 → 3.84 4.13 5.40 |
| A3 | shipped, CPU x20, park on | 10 | 10 | 0 | 0 | 3.94 4.13 5.38 → 3.61 4.09 5.20 |
| A4 | shipped, full `npm run e2e` (4 shards) | 2 | 2 (124/124, 87/87 each) | 0 | 0 (all 124 tests: 0) | 2.72 3.85 5.10 → 7.56 5.18 5.41 |
| B1 | single hover + waitStable, churn 150, park on | 20 | 20 | 0 | 0 | 6.71 5.07 5.37 → 2.71 4.06 4.96 |
| B1 | single hover + waitStable, CPU x20, park on | 10 | 10 | 0 | 0 | 2.68 4.01 4.93 → 1.97 3.39 4.59 |
| B2 | single hover, no waitStable, churn 150, park on | 20 | 20 | 0 | 0 | 1.97 3.39 4.59 → 2.93 3.35 4.42 |
| B2 | single hover, no waitStable, CPU x20, park on | 10 | 10 | 0 | 0 | 3.07 3.37 4.41 → 3.08 3.20 4.22 |
| B2 | full `npm run e2e` (4 shards) | 1 | 1 (124/124, 87/87) | 0 | 0 (all tests: 0) | 3.08 3.20 4.22 → 4.85 3.77 4.35 |
| X1 | B2, churn 150, **park off** | 3 | 0 | 3 | 156 (52) | 4.06 3.66 4.14 → 4.67 3.89 4.18 |
| D | shipped + default click, churn 150, park on | 10 | 10 | 0 | 0 | 3.86 3.60 4.29 → 2.40 3.23 4.11 |
| D | shipped + default click, CPU x20, park on | 10 | 10 | 0 | 0 | 2.40 3.23 4.11 → 4.53 3.73 4.17 |
| X2 | B2 + default click, churn 150, park on | 5 | 5 | 0 | 0 | 4.67 3.89 4.18 → 5.50 4.24 4.29 |
| X3 | B2 + default click, CPU x20, park on | 5 | 5 | 0 | 0 | 5.50 4.24 4.29 → 4.69 4.16 4.26 |
| C1 | shipped, clip-lift reverted | 2 | 0 | 2 | 0 | 3.50 3.92 4.17 → 2.60 3.61 4.05 |
| C1 | B1, clip-lift reverted | 2 | 0 | 2 | 0 | 2.60 3.61 4.05 → 2.38 3.43 3.97 |
| C1 | B2, clip-lift reverted | 2 | 0 | 2 | 0 | 2.38 3.43 3.97 → 2.62 3.32 3.91 |
| C1 | shipped + default click, clip-lift reverted | 1 | 0 | 1 | 0 | 2.62 3.32 3.91 → 3.27 3.43 3.93 |
| C1 | B2 + default click, clip-lift reverted | 1 | 0 | 1 | 0 | 3.27 3.43 3.93 → 2.98 3.34 3.89 |
| C2 | shipped, all 3 SC-502 LP rules reverted | 1 | 0 | 1 | 0 | 2.85 3.29 3.86 → 2.39 3.16 3.80 |
| C2 | B2, all 3 SC-502 LP rules reverted | 1 | 0 | 1 | 0 | 2.44 3.16 3.79 → 2.04 3.01 3.73 |

**Churn exposure.** Park-on sessions saw 5–7 flips while CHR-L01 ran (the test takes about 0.9 s). That is enough to hit the bug: with park off, every run failed at the first hover, and the counter recorded 52–54 leaves over the 8 s timeout.

**CPU x20 was effective.** CHR-L01 took 6.3–10.8 s under it, against about 0.9 s unthrottled.

**Loop data.**

| Condition | `SC534-LOOP` result |
|---|---|
| All 56 park-on shipped runs | `hovers=1 revealed=true` |
| Park off (A2) | `hovers=2 revealed=false` x1, `hovers=2 revealed=true` x1, `hovers=3 revealed=false` x3 |

The `hovers=2 revealed=true` run means the loop briefly saw the panel, and the panel was lost again before `:48`. All 5 park-off runs failed at `:48`.

## Failure lines

Line numbers are those of the clean spec. The instrumented spec's `:61`/`:63` map to `:48`/`:50`.

- **A2 and X1, park off:** all 8 runs fail with `Error: timed out waiting for the chrome panel to be revealed by the hover` at `chrome-live-preview.e2e.ts:48` (`dse.waitFor(… 'the chrome panel to be revealed by the hover')`). The last crossing was at `512,400`, the unparked pointer at the screen centre.
- **C1 and C2, SC-502 reverted:** all 11 runs fail with `Error: timed out waiting for the chrome panel to stay revealed with the pointer on Collapse` at `chrome-live-preview.e2e.ts:50`. The shipped, B1, B2 and default-click variants all fail the same way. Stack from `bundles/C1-B2-run1/CHR-L01/error.txt`:
  ```
  at async Object.waitFor (e2e/driver/page.ts:22:2)
  at async Context.<anonymous> (e2e/specs/stamina-bar/chrome-live-preview.e2e.ts:63:3)   # instrumented; = clean :50
  ```
  Leaves were 0 in every one of these runs, so this is the product bug and not the harness flake. The screenshot shows the bar with no panel.
- **Which assertion catches SC-502 on 1.14.4:**
  - `:48` passes, because the computed `pointer-events: auto` after the root hover is unaffected by clipping.
  - `:49`'s hover moves the pointer to Collapse's centre. That point lies above the widget box, which `.cm-embed-block:hover { overflow: hidden }` clips. The hit test therefore lands on the editor line above. This is the "hover half of the clip": 1.14.4 lacks 1.15's `contain: paint`.
  - The root loses `:hover`, and **`:50` times out**.
  - The click and cursor asserts (`:54-56`) are never reached. Neither the loop nor `waitStable` takes part in catching SC-502, so B1/B2 keep the same anti-vacuity.

## Recommendation (for the owner's ruling)

- **Drop lines 43-48 in favour of B2:** `await dse.hover(root.root)` followed by the existing `:48` `waitFor`. The evidence:
  - The loop always made exactly 1 hover when parked.
  - It never rescued an unparked run.
  - `waitStable` never saw the rect move in 93 runs, including full runs and CPU x20.
  - B2 is green under churn, CPU x20 and a full run.
  - B2 fails in the same place as the shipped spec on both the SC-539 cause (park off, `:48`) and the SC-502 bug (`:50`).
- **Dropping `waitStable` cannot hide a regression.** Suppose a future layout shift moved the block after the hover. The pointer would then be off the root, `:48` would time out, and the test would fail. It could not pass by mistake.
- **Mechanical consequences for r2:**
  - `waitStable` (`:19-34`) and `panelRevealed` (`:16-17`) become unused, and `browser` (`:7`) is used only by `waitStable`. Lint and tsc would flag them, so delete them, or reuse `panelRevealed` in `:48`/`:50`.
  - The `:43-44` comment ("Live Preview may still be laying out…") names the wrong cause; SC-539 showed it was the foreign pointer crossing.
- **D (`{ cdp: true }` at `:54`):** the default `dse.click(collapse)` is 20/20 on the shipped spec and 10/10 with B2 under churn and CPU x20, with 0 leaves. Under the SC-502 revert it fails identically, at `:50`. The `:51-53` comment blames "full-run load" for the pre-hit-test interception. That symptom matches the SC-539 cause: the panel goes hidden when hover is lost. Two options:
  - Switching back adds the driver's hit-test, which turns a covered button into "element click intercepted", and removes a special case.
  - If D is out of scope, correct the comment.

## Commands

All commands ran as one foreground call each: `devbox run -c <plugin> -- [env …] bash <scratch>/batch.sh <label> <first> <last> [--only=CHR-L01]`. The script `cd`s into the plugin, checks the directory with `pwd`, and runs `npm run e2e -- <args>` once per run. Each run has its own log with `load-before`/`load-after` and `RC=`. The script then pulls the `done` line, the CHR-L01 result, the `SC539-XING`, `SC534-STABLE` and `SC534-LOOP` lines, and the all-test leave sum into `summary-<label>.txt`. It copies each failure bundle out of `e2e/.out/<run>/` right away.

| Batch | env |
|---|---|
| A1 | `SC539_CHURN_MS=150` |
| A2 | `SC539_CHURN_MS=150 SC534_NOPARK=1` |
| A3 | `SC534_CPU=20` |
| A4 | (none; full run) |
| B1 | `SC534_VARIANT=B1` plus the A1/A3 env |
| B2 | `SC534_VARIANT=B2` plus the A1/A3 env; full run with only `SC534_VARIANT=B2` |
| D | `SC534_CLICK=default` |
| X1–X3 | combinations of the above |
| C1/C2 | `revert502.py C1\|C2`, then `cbatch.sh C1` or `batch.sh` per variant |

Clean rebuild: `rebuild.sh`.

## Artifacts

Scratch directory: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r1-a1/`

- **Probe diffs:**
  - `sc534-r1-probe-instrumentation.diff.txt`
  - `sc534-r1-anti-vacuity-C1-clip-lift-reverted.diff.txt`
  - `sc534-r1-anti-vacuity-C2-all-sc502-lp-rules-reverted.diff.txt`
- **Per-batch summaries:** `summary-<label>.txt` (21 files).
- **Per-run logs:** `logs/<label>-run<i>.log` (141 logs).
- **Failure bundles:** `bundles/` holds A2 run1–5, X1 run1–3, C1-{shipped,B1,B2} run1–2, C1-{shippedD,B2D} run1 and C2-{shipped,B2} run1. Each has `CHR-L01/{error.txt,screenshot.png,dse-root.html,events.json,…}`.
- **Scripts:** `batch.sh`, `cbatch.sh`, `edit-spec.py`, `revert502.py`, `rebuild.sh`, `npmci.sh`.
- **Clean-rebuild proof:** `rebuild-clean.log`.

## Follow-ups (seen, left alone)

- `chrome-live-preview.e2e.ts:51-53` (the D comment) blames load, while SC-539 showed the cause is the pointer crossing. Correct the comment even if the cdp click stays.
- `e2e/driver/dse.ts:282-299` has a driver-level `waitStable(el)` behind `click({ stable: true })`, a separate helper from the spec's. It was not measured here, but it may have the same history.
