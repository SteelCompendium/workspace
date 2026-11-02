# SC-533 r4: IntersectionObserver hand-off, G-S54, rebase onto 458abe3, full battery

## Executive summary
- **STATUS: DONE.** dse branch `sc533-chrome-border-reflow` HEAD `9c8cad5` (rebased onto `origin/develop` = `458abe3`; 4 commits: `acb9f6d`, `74a8e27`, `342a139`, `9c8cad5`). Worktree superproject `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow` branch HEAD `3af32d97` (rebased onto origin/main; only `CHANGELOG.md` and `.claude/skills/dse-verify/SKILL.md`; the dse pointer is left uncommitted). Nothing pushed.
- **HIGH-1 + MEDIUM-1 fixed:** a panel out of the document at the frame is parked in a per-window IntersectionObserver (on its anchor) and measured, reads then writes, when the anchor intersects. New lifecycle **G-S54**: passes on the shipped build, FAILs Live Preview AND Reading view on the previous version of this fix (`74a8e27`), FAILs Reading view only on stock `458abe3`.
- **Battery on `9c8cad5`, all green:** tsc, lint; jest 6208 passed / 1 skipped / 249 of 250 (CURRENT 6201: delta +7); lifecycle 43/43 (22 + 21); e2e 124/124, 87/87; shots 592 / 0 FAIL / 157/942 / 34-record boundary; freeze 280/280; parity 0 / 0 / 24.
- **Shots byte diff against a stock `458abe3` shots run: 0 of 592 differ.** No crops.
- **Perf PASS** (`tPost` median ms, n = 24): R stock 843.9 / final 513.5 / stub 488.9 (final - stub +24.6, bar 50.0); LP 832.2 / 496.8 / 490.4 (+6.4, bar 50.0).
- r3 HIGH-1 probe on final: 0 bad panels in Reading view and Live Preview, popout 7/7 correct.
- `--randomize` seeds 1, 2, 3, 4, 5, 6, 7, 8, 11, 42: all 49 tests pass in `chromeRound2.test.ts`.

## 1. The fix (`342a139`, `src/framework/chrome/mountChrome.ts`)
- `flushFrameBorders(win)`: entries whose panel is connected are published exactly as before (all reads, then all writes, in the one frame). Entries whose panel is NOT connected go to `parkFrameBorders`.
- `parkFrameBorders`: a per-window `Map` holds one `IntersectionObserver` (constructed from the anchor's own window, `root` null, `rootMargin: '200px 0px'`) and a map anchor -> entries. It observes the ANCHOR. A window with no `IntersectionObserver` (jsdom) keeps the old fallback: no read, no write, no crash.
- The observer callback (`publishParkedFrameBorders`) takes every intersecting record's entries whose panel is connected, calls `publishFrameBorders(ready)` (every anchor's Top and Right read first, then every panel's two vars written), then unobserves them. The observer is disconnected when nothing is parked.
- `dropFrameBorders(win, entry)` is the single cleanup, called from `owner.register`: it removes the entry from the rAF queue (cancelling an empty frame) and from the observer (unobserve, disconnect when empty). An unloaded owner's entry leaves both.
- No rAF polling loop.
- **Observed element: the anchor, not the panel.** The panel is `opacity: 0` until revealed, which still intersects, but it is `display: none` in the print scheme (zero size) and sits outside the anchor's box (above the card's top edge), so its intersection depends on where the card edge is; the anchor is the framed card with a real box. An anchor with no box (`display: none`, e.g. collapsed hosts) reports not intersecting until it is shown, then fires, which is when a measurement is meaningful. Measured: G-S54 passes with the anchor in Live Preview and Reading view.
- **`rootMargin: 200px 0px`** (an addition to the ruling's "root null"): the panel hangs above the card's top edge, so on a downward scroll it is on screen before the card's first pixel; the margin makes the callback fire a little early so the vars are in before it can be hovered. Without the margin the worst case is one frame of the fallback (1 px) on a hovered panel.
- Comments rewritten (LOW-2): `FRAME_BORDER_VARS` block now says opacity: 0 until hovered or revealed (always visible on mobile), at most 1 px for one frame, and the detached-then-reattached path for Live Preview and Reading view; the false "measures it ONCE at mount ... detached node yields 0" sentences are gone. `docs/superpowers/sc169-element-menu-panel-spec.md` ~168-176 says the same.

## 2. jsdom tests (`test/dom/framework/chromeRound2.test.ts`)
The SC-533 describe now has 7 tests (the pipeline test above it is edited, not new): mount reads and writes nothing; two mounts share one rAF with RRRRWWWW order; a panel out of the document at the frame is not read then, is parked (observer constructed once with `root` null, observing exactly the two detached anchors), and when a mocked observer reports both intersecting after reconnection the order is RRRRWWWW and the observer ends empty and disconnected; a parked panel stays parked while its anchor is not intersecting or while the panel is still out of the document; unloading a parked owner unobserves it, a stale report reads and writes nothing, and the last unload disconnects; without an observer a detached panel and an unloaded owner get no read or write; unloading the only pending owner cancels the frame.
- **Order independence (LOW-1):** `beforeEach(async () => { await nextFrame(); })` drains any pending frame; every `mount()` loads its owner and `afterEach` unloads all of them (clearing observer state) and deletes the fake `IntersectionObserver`.
- Red on `74a8e27`'s mountChrome.ts (previous version of the fix): 3 failed (the three hand-off tests), 46 passed. Green on the new one: 49 passed. Logs: `sc533-r4-test-red-on-98ca88e-mountChrome.log`, `sc533-r4-test-green.log`.
- `--randomize` seeds run: 1, 2, 3, 4, 5, 6, 7, 8, 11, 42; each `Tests: 49 passed, 49 total` (`sc533-r4-test-randomize-seeds.txt`).

## 3. Lifecycle G-S54 (`9c8cad5`, `visual-harness/obsidian-lifecycle.mjs`)
- Fixture `Lifecycle/chrome-frame.md`: 6 statblocks, 2 stamina bars, 2 trackers; a long stretch of filler between the fourth block and the last three.
- Per phase (Live Preview, then Reading view, each opens the note fresh): scroll down half a screen at a time; for every on-screen panel wait in animation frames (not a timer) until its `--dse-chrome-frame-border-top` var is set (bounded at 40 frames so a build that never sets it reaches the assertion), then measure panel vs card: inset (anchor right - panel right) = 10 and gap (anchor top - panel bottom) = 0, tolerance 0.5 px (the shots numbers). All 10 blocks must be measured.
- Anti-vacuity per phase: a hook on `Node.prototype.createDiv` and `requestAnimationFrame` records, per panel, whether it was in the document at creation and at the first animation frame after; the phase FAILs unless some measured panel was out of the document at that frame, unless every anchor has a non-zero border, and unless every measured panel went through the hook. The hooks are removed in a `finally`.
- Final build, per phase: Live Preview: 10/10 blocks, 8 measurements of panels out of the document at their first frame (15/20, Init Ida, SB Four), inset/gap all 10 / 0. Reading view: 10/10 blocks, 11 such measurements (SB Five, Init Two, SB Six, 7/24), all 10 / 0.
- **Controls** (`DSE_LIFECYCLE_BUNDLE`, bundles from `git archive` exports in scratch; never committed):
  - `final` (`9c8cad5`): `OBSIDIAN-LIFECYCLE G-S54 ok`, both phases above. Log `sc533-r4-lc-gs54-control-final.log`.
  - `prev` (`74a8e27`, the batched frame that drops disconnected panels): `G-S54 FAIL`; Live Preview: `15/20`, `Init Ida`, `SB Four` each `inset 11 (want 10), gap -1 (want 0), no frame-border var on the panel`; Reading view: `SB Five`, `Init Two`, `SB Six`, `7/24` same numbers. Summary: `Live Preview ... inset/gap WRONG; Reading view ... inset/gap WRONG`. Screenshot `sc533-r4-gs54-fail-prev-74a8e27.png`.
  - `stock` (`458abe3`): `G-S54 FAIL`; Reading view only (`SB Five`, `Init Two`, `SB Six`, `7/24`: inset 11, gap -1); `Live Preview: ... inset/gap all 10 / 0`. Screenshot `sc533-r4-gs54-fail-stock-458abe3.png`.
- The id list: `visual-harness/obsidian-lifecycle.mjs` now has 43 scenarios (SC-481's G-S53 plus G-S54); header comment updated.
- Worktree superproject skill `.claude/skills/dse-verify/SKILL.md`: one entry added to the lifecycle row (what it checks, phases, anti-vacuity, controls), count `43/43`, halves `22 + 21`. CURRENT/PREVIOUS records untouched. CHANGELOG bullet added verbatim at the top of `## Unreleased` in the worktree superproject `CHANGELOG.md`. Both in superproject commit `3af32d97` (after `git fetch origin` and `git rebase origin/main`; two textual conflicts, resolved by keeping both bullets and re-applying the G-S54 edit onto SC-481's version of the row).

## 4. Measurement (rebased base; stock = `458abe3`, final = `9c8cad5`, stub = stock with the border read returning 0)
Same harness as r2 (P533 probe, own Xvfb, CDP port 9547, Obsidian 1.15.0, profiler off, leaf parked on a Reading note before each swap), 3 rounds x (1 warm-up + 4 timed) per session, 2 sessions per scene (offsets 0, 1) = 24 timed draws per variant per scene. Page errors: none. Bundle `main.js` sha256 (with the variant suffix): stock `8a62b4d8ca3e...`, final `0206df070895...`, stub `419b2c5f8e42...`; `styles.css` `ae45354b6369...` in all.

| scene | variant | tRaf med / p90 / IQR | tPost med / p90 / IQR |
|---|---|---|---|
| R | stock | 837.6 / 906.3 / 49.7 | 843.9 / 917.0 / 49.5 |
| R | final | 505.4 / 1045.4 / 103.4 | 513.5 / 1061.8 / 105.1 |
| R | stub | 483.8 / 532.8 / 39.7 | 488.9 / 538.1 / 37.5 |
| LP | stock | 822.8 / 856.8 / 33.5 | 832.2 / 863.8 / 32.1 |
| LP | final | 488.1 / 505.0 / 21.2 | 496.8 / 516.4 / 21.2 |
| LP | stub | 484.6 / 527.1 / 33.5 | 490.4 / 537.3 / 35.7 |

- Bar (final within max(50 ms, 10 % of stub)): R final - stub = +24.6 (bar 50.0) PASS; LP +6.4 (bar 50.0) PASS.
- Paired medians of `tPost` over 6 visits per scene: R final - stub +30.8 (45.6, 16.0, 95.2, 403.3, -10.6, 11.5; the 403.3 visit is a slow final visit under a load spike), R stock - final +332.1; LP final - stub +3.4, LP stock - final +331.2.
- Load (`/proc/loadavg` 1-minute, start -> end): a-R 10.02 -> 3.92 (the session started under a spike left by the previous gate), b-R 4.78 -> 2.06, a-LP 2.29 -> 1.24, b-LP 1.30 -> 0.96.
- The IntersectionObserver path adds nothing to these: the perf scenes' panels are connected at the frame (R and LP open a note whose first blocks are on screen), so only the rAF path runs.
- **r3 HIGH-1 probe on final** (P533Y: slow scroll through `r3many.md` in Reading view and in Live Preview, every connected panel's vars + geometry, plus a move to a popout): Reading view 65 steps, 10 blocks, `bad []`, `everBadVisible 0`, first visible reading OK for every block; Live Preview 76 steps, 10 blocks, `bad []`, `everBadVisible 0`; popout 7 panels, 7 framed, `varBad []`, `geoBad []`, `insets [10]`, no anchor inline var; no page errors. (`sc533-r4-probe-r3y-final.json`.)

## 5. Gates on `9c8cad5` (each its own foreground call; summary lines are the truth)
| gate | result |
|---|---|
| tsc (`npm run tsc`, incl. `tsc -p e2e`) | clean, rc 0 |
| lint (`npm run lint`, incl. `e2e/`) | clean, rc 0 |
| jest (`main.js styles.css` removed first) | `Tests: 1 skipped, 6208 passed, 6209 total`; `Test Suites: 1 skipped, 249 passed, 249 of 250 total`. CURRENT at `458abe3` 6201 / 1 / 249 of 250, so delta +7 (the 7 tests of the SC-533 describe; the edited pipeline test replaces nothing) |
| lifecycle half 1 (22 ids: G-S7a ... G-S9b) | `OBSIDIAN-LIFECYCLE done: 22/22 ok, 0 failed` (port 9543) |
| lifecycle half 2 (21 ids: G-S9d ... G-S54, incl. G-S53, G-S54) | `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`; union 43/43 |
| e2e | `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0 |
| shots | 592 PNGs; 0 FAIL; `host-copy pin OK`; `button host-leak OK (157 button kinds x 3 states x dark/light = 942 comparisons ...)` with the 34-record boundary line; `modal button host-leak OK (... 228 comparisons ...)`; `chrome placement OK (7 element families: inset 10.00px ..., 0 border overlap)`; `shots rc=0`. The run exceeded 600 s and the tool moved it to the background; I waited on its own log and PID. |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)`, rc 0 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0 |

## 6. Shots byte diff against stock `458abe3`
`npm run shots` in a scratch `git archive` export of `458abe3` (`visual-harness/dist` copied from the worktree): 592 PNGs, `shots-stock rc=0`, same 157/942 and 228 lines. sha256 of all 592 PNGs compared with the 592 from `9c8cad5`: **0 differences.** No `sc533-r4-crop-*` files.

## 7. Notes
- I killed my own first shots run (PID tree rooted at my script, all under the worktree/scratch) when the owner's course correction (rebase onto `458abe3`) arrived mid-run, then redid every gate on the rebased sha; nothing above is from the pre-rebase tree except the jest-file red/green and randomize runs, whose source is unchanged by the rebase (the full jest on the rebased sha is green).
- The four kept lifecycle temp dirs holding FAIL screenshots (mine) were copied to the ledger dir and deleted by literal path.
- A panel whose anchor never intersects the viewport stays parked until its owner unloads (bounded by the owner's lifetime, no timers).
- A window closed while entries are parked: the entries drop when the owner unloads.

## Artifacts
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`:
- `sc533-r4-fix-report.md` (this file); `sc533-r4-raw-draws.csv` (180 rows), `sc533-r4-stats.json`, `sc533-r4-probe-r3y-final.json`
- scripts: `sc533-r4-run.sh.txt`, `sc533-r4-mkbundle.sh.txt`, `sc533-r4-mkstub.sh.txt`, `sc533-r4-lc-run.sh.txt`, `sc533-r4-run-probe.sh.txt`, `sc533-r4-analyze.py.txt`
- controls: `sc533-r4-lc-gs54-control-{final,prev,stock}.log`, `sc533-r4-gs54-fail-prev-74a8e27.png`, `sc533-r4-gs54-fail-stock-458abe3.png`
- perf sessions: `sc533-r4-run-{a-R,b-R,a-LP,b-LP}.log`
- gates: `sc533-r4-gate-{tsc,lint,jest,lc1,lc2,e2e,shots,shots-stock,freeze,parity}.log`; shots hashes `sc533-r4-shots-final.sha256`, `sc533-r4-shots-stock458abe3.sha256`
- tests: `sc533-r4-test-red-on-98ca88e-mountChrome.log`, `sc533-r4-test-green.log`, `sc533-r4-test-randomize-seeds.txt`
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r4-08f91447/` (bundles, exports, raw `out/`; `old34/` holds the pre-rebase measurement runs).

## Drive-by fixes
None.

## Follow-ups
- Obsidian-camera shots (`obsidian-shots`) were not run (needs `:1`); the lifecycle, e2e and probes ran in real Obsidian.
- The SC-520 branch will conflict textually next to the `queueFrameBorders(...)` call after the panel's `aria-label` line, as expected.
- G-S54's wait bound (40 frames per panel) means a build that never sets a var costs about 40 frames per sampled panel before it asserts; acceptable for a failing run.
