# SC-502 r3 scoped re-review report

## Executive summary
- VERDICT: **LAND**. Scope: the r3 delta and the rebase. dse `1da9486` on develop `f89f69f` (origin/develop still `f89f69f`), superproject `b3ce567` on `27f4c8c`. Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO.
- HIGH-1 is fixed: the widget rule has `display: flow-root`. The head bundle matches base `f89f69f` in 70/70 Live Preview + Reading geometry comparisons, including CodeMirror's block height. The 12-feature wheel sweep has 0 jumps, the `END LINE` click lands on `420:3`, and the emulated mobile widget is 114.8px on both. G-S44's new height check FAILs on the `84c903b` bundle (feature 222.6 vs 270.6, statblock 443.9 vs 459.9) and passes on head.
- MEDIUM-1 is fixed: full e2e passed 5 of 5 times (124/124, 0 failed, 0 known-bug, 87/87, load 7-20) and CHR-L01 alone passed 6 of 6 times. Switching the Collapse press to a CDP pointer press is acceptable (INFO-1).
- LOW-1 is fixed: the strip is `inset(-96px …)`. The tallest panel (Obsidian font 30, 140% text, touch-size buttons) is 73.4px. It is painted whole, and every button responds at its centre, its top edge and its top-left corner. With the panel hidden, presses at those points land on the text line above (6/6 per element, exactly where CodeMirror says).
- Rebase: G-S44 and G-S45 are both present and pass; the header says 39 scenarios and there are 39. `f89f69f..1da9486` touches only the 5 SC-502 files, with 0 deleted lines (419 added, 1 changed line in AGENTS.md), so no SC-519 code was lost.
- SC-523 part 1 on the rebased head: a real click on the `ds-counter` pencil opens the edit form and the cursor stays on `11:0`. On base `f89f69f` the press hits `div.cm-line`, the cursor goes 11→3 and no form opens.
- Battery on `1da9486`: tsc/lint clean; jest 6084 / 1 skipped / 246 of 247; lifecycle 39/39; e2e 124/124 x5; shots 592, 0 FAIL, button host-leak 114/684; freeze 280/280; parity 0/0/24. All on target.

Evidence folder `$R` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r3-rereview-7c7e/`.

## Method
- Scratch checkouts (`git worktree add --detach`, removed at the end) of `1da9486` (head), `f89f69f` (base) and `84c903b` (r2 head), each built with `esbuild.config.mjs production`.
- The r1 probe (`$R/rv-probe-extra.js`, plus `RV-TALL` for this round) is spliced into each checkout's own lifecycle harness copy by `$R/rv-run.sh`. It runs real Obsidian 1.15.0 on a private Xvfb, port 9295, with CDP mouse events.
- Hover crops come only from full-viewport captures (r1 INFO-4).

## Findings

### INFO-1 — CHR-L01 now presses Collapse through CDP (`e2e/specs/stamina-bar/chrome-live-preview.e2e.ts:45-54`)
- What changed:
  - The test waits for the block's rect to stop moving.
  - It hovers the root, up to 3 times, until the panel's `pointer-events` is `auto`.
  - It hovers Collapse and checks that the panel is still revealed.
  - It then calls `dse.click(collapse, { cdp: true })`: move, press and release at the button centre.
- Judgement: acceptable. It is still a real pointer press at the visible centre, the path a user takes and the one G-S44 uses.
  - What it gives up is WebDriver's "intercepted" pre-check. The test still tells broken from fixed builds: it asserts that the panel stays revealed with the pointer on Collapse, that the block collapses, and that the cursor stays on line 0. The implementer reports it times out on base CSS.
  - Expand stays a plain WebDriver click, so the intercept check still guards the `</>` overlap.
  - The drive is still recorded (coverage 87/87).
- The root cause of WebDriver's pre-check failing with a revealed panel is not proven. Not a blocker. If another Live Preview e2e test needs a hover-revealed control, follow the implementer's follow-up 1 and press it with `{ cdp: true }`.
- Evidence: `$R/e2e-full-loop.txt` (5/5 full runs), `$R/e2e-l01-loop.txt` (6/6 isolated runs).

### INFO-2 — probe note
- The single-block "margin click" sub-probe hit a probe bug in both base and head (`$R/r3-*-m.log`, `ERR margin click`). It is redundant: the 12-block wheel sweep and the `END LINE` click in the same scenario cover it, and both match base.

## Checks (brief items)
1. **HIGH-1.**
   - CSS: `styles-source.css:16883-16888` (rule; derivation comment 16860-16881) (`contain: none !important; overflow: visible; display: flow-root; clip-path: inset(-96px -1px -1px -1px)`). The comment is rewritten; jest pins `display: flow-root` and `top <= -86`.
   - Geometry, `$R/cmp-geo.txt`: 70/70 phases match base, with feature `[376, 208.6, 1020, 1262.1]` and `cmBlockH` 1262.1 as on base.
   - Margin sweep, `$R/r3-head-m.log`: spread 0 for all 12 markers, `wheelJumpCount 0`, `endClick 420:3`. Mobile emulation: widget 114.8, the same as base.
   - G-S44 on the `84c903b` bundle (`$R/r3-gs44-dse-old.log`, `$R/r3-gs44-old-FAIL.png`): `G-S44 FAIL: feature: CodeMirror's height for the widget is 222.578125px but the block takes 270.578125px on screen … | statblock: … 443.9375px but the block takes 459.9375px …`.
   - G-S44 on the `f89f69f` bundle (`$R/r3-gs44-dse-base.log`): `FAIL: line above active: elementFromPoint at the pencil button's centre is div.cm-line.cm-active`. Head passes in the full lifecycle run.
2. **MEDIUM-1.** See INFO-1. Full runs (`$R/battery-e2e-full-{1..5}.log`): `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` five times, at load 7.9 / 7.4 / 11.3 / 20.4 / 18.8. Isolated `--only=CHR-L01`: 6/6 ok (`$R/e2e-l01-loop-{1..6}.log`).
3. **LOW-1** (`$R/r3-head-tall.log`; full capture `$R/shots/head-tall-stamina-bar-full.png`, crop `$R/shots/head-tall-stamina-bar-crop.png`).
   - Stamina bar and counter: panel 73.4px tall and 73.4px above the widget, under a 96px clip. Hits at centre, top edge and top-left corner are `CTL` x3 for each.
   - With the panel hidden, presses at each button's top edge and centre land on the line above at exactly `posAtCoords` (`2:64, 2:93, 2:68, 2:93, 2:72, 2:93`). Nothing collapses and no modal opens.
   - At default size (`$R/r3-head-m.log`, RV-HIDDEN), presses and drags on the line above land exactly as on base.
4. **Rebase.**
   - 39 `id: 'G-S…'` entries; the header lines read "SC-519 appends G-S45 (38 scenarios in all…)" and "SC-502 appends G-S44 (39 scenarios in all…)".
   - `git diff --numstat f89f69f..1da9486`: AGENTS.md 4/1, e2e spec 62/0, styles-source.css 69/0, jest 74/0, lifecycle 210/0.
   - Full lifecycle run: `G-S45 ok (…)` and `G-S44 ok (…)`.
   - Superproject `27f4c8c..b3ce567` touches only CHANGELOG.md (+9) and DESIGN.md (+8). The DESIGN.md bullet now mentions flow-root and the 96px strip.
5. **SC-523 part 1** (`$R/r3-head-m.log`, `$R/r3-base-m.log`): head `{"pe":"auto/1","hit":"span.dse-btn__icon","before":"11:0","after":"11:0","modals":["form"]}`; base `{"pe":"none/0","hit":"div.cm-line","before":"11:0","after":"3:0","modals":[]}`.
6. **Regression spot-checks on head** (`$R/r3-head-tall.log`):
   - Stamina pencil (Live Preview and Reading view): only the edit form opens, cursor unmoved. Collapse and Expand work by real click.
   - All six layout cases pass.
   - Straight up from below across `</>` to Collapse works for stamina bar, statblock and counter.
   - Collapsed one-liner: Expand expands, `</>` enters the source (cursor `4:0`).
   - Reading view captures: 13/13 at rest and 3/3 collapsed are byte-identical to base.

## Battery (branch worktree, dse 1da9486; `$R/battery-*.log`)
- tsc `GATE tsc rc=0` (incl. `tsc -p e2e`); lint `GATE lint rc=0`.
- jest `Tests: 1 skipped, 6084 passed, 6085 total`; `Test Suites: 1 skipped, 246 passed, 246 of 247 total`.
- lifecycle `OBSIDIAN-LIFECYCLE done: 39/39 ok, 0 failed` (Obsidian 1.15.0, port 9295).
- e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` x5.
- shots: 592 PNGs, 0 FAIL, `GATE shots rc=0`. In-run lines:
  - chrome placement OK (7 families) and chrome host-leak OK (18)
  - host-copy pin OK
  - button host-leak OK (114 kinds, 684) and modal button host-leak OK (228)
  - text scale OK (1626) and print-twin delta OK (144)
  - the expected `OBSIDIAN APP.CSS PIN DRIFT` warning
  - The gate ran past the 10-minute tool timeout and was moved to the background. I polled its log for the GATE line.
- freeze `freeze OK (280/280 frozen print PNGs byte-identical …)`.
- parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, `GATE parity rc=0`.

## State left
- The dse branch is untouched at `1da9486` with a clean tree. The superproject shows ` M draw-steel-elements`, the same as at the start.
- The scratch checkouts are removed; the submodule's worktree list holds only the branch worktree.
- I deleted the two `/tmp/dse-obsidian-lifecycle-*` folders my FAIL runs kept, after copying their screenshots to `$R`.
- I ran `git fetch origin develop` in the submodule; it only updated the `origin/develop` ref.

## Artifacts (`$R`)
- Battery logs: `battery-{tsc,lint,jest,lifecycle,shots,freeze,parity}.log`, `battery-e2e-full-{1..5}.log`.
- e2e loop summaries and logs: `e2e-full-loop.txt`, `e2e-l01-loop.txt`, `e2e-l01-loop-{1..6}.log`.
- Probe logs (each with a `.jsonl`): `r3-{base,head}-geo.log`, `r3-{base,head}-m.log`, `r3-head-tall.log`; comparison `cmp-geo.txt`.
- G-S44 checks: `r3-gs44-dse-old.log`, `r3-gs44-dse-base.log`, `r3-gs44-old-FAIL.png`, `r3-gs44-base-FAIL.png`.
- Screenshots: `shots/`, incl. `head-tall-stamina-bar-full.png` and `head-tall-stamina-bar-crop.png`.
- Probe sources: `rv-probe-extra.js`, `rv-probe-tall.js`, `rv-run.sh`, `gs44-run.sh`, `gate.sh`, `e2e-full-loop.sh`, `e2e-loop.sh`, `build2.sh`, `cmp_geo.py`.
