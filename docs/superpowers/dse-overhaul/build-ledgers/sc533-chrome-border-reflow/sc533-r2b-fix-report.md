# SC-533 r2b: batched rAF flush, re-measure, full battery

## Executive summary
- **STATUS: DONE.** dse branch `sc533-chrome-border-reflow`, final sha `98ca88e` (on `a94995e` on `4deb8cf`; `origin/develop` still `4deb8cf`). Not pushed.
- **Pass bar: PASS in R and LP.** `tPost` median (ms, n = 24 per cell, Obsidian 1.15.0, profiler off): R stock 863.1 / final 502.8 / stub 528.9 (final - stub = -26.1, bar 52.9); LP stock 891.3 / final 499.8 / stub 509.5 (final - stub = -9.7, bar 51.0). Paired stock - final: R +343.1, LP +365.0.
- **Battery all green on `98ca88e`:** tsc clean, lint clean, jest 6156 passed / 2 skipped / 248 of 249 suites (fresh worktree base 6152 / 2: delta +4), lifecycle 41/41 (20 + 21), e2e 124/124 ok / 0 failed / 0 known-bug / coverage 87/87, shots 592 PNGs / 0 FAIL / button host-leak 157/942 (34-record boundary), freeze 280/280, parity 0 gaps / 0 undeclared / 24 declared.
- **Shots byte diff vs a stock `4deb8cf` shots run: 0 of 592 PNGs differ** (so no crops to attach; chrome-placement trio and chrome-hover shots included).
- New tests: 5 SC-533 tests, all red on `4deb8cf`'s `mountChrome.ts` (5/5) and 4 red on `a94995e`'s; green on `98ca88e`.

## What changed (`98ca88e`, on top of `a94995e`)
`/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements`: `src/framework/chrome/mountChrome.ts` (+68 -6 vs `4deb8cf`), `test/dom/framework/chromeRound2.test.ts`, `docs/superpowers/sc169-element-menu-panel-spec.md`.
- No border read or var write happens in the mount task. `mountChrome` calls `queueFrameBorders(anchor, panelEl, owner)` right after the panel's `aria-label` line (one line there).
- Module-level `Map<Window, {entries, frame}>`: one `requestAnimationFrame` per window, on the anchor's own window (`anchor.ownerDocument.defaultView`), not the global. Entries added before the frame runs share it.
- `flushFrameBorders`: skips entries whose `panelEl.isConnected` is false (no read, no write); reads Top and Right for every live anchor first, then sets the two vars on every live panel.
- `owner.register(...)` drops the entry on unload and cancels the frame when the queue becomes empty.
- No window or no `requestAnimationFrame` on the window: nothing is queued (the 0px CSS fallback stays).
- The comment above `FRAME_BORDER_VARS` is rewritten in plain sentences: why the read is deferred and batched, vars on the panel, `0px` fallback for at most one frame because the panel is hidden unless hovered.
- Stale spec line `docs/superpowers/sc169-element-menu-panel-spec.md:168` rewritten (panel, next frame, batched, fallback).
- Behavioural note: a node that never reaches the document now keeps the CSS fallback instead of getting an inline `0px`; the geometry is the same (0).

## Tests
`test/dom/framework/chromeRound2.test.ts`: the existing "republishes the border widths" test now attaches the host to the document, waits a frame, and checks the panel (title gains "on the panel, a frame later (SC-533)"); the a94995e order test is replaced by a new `describe('SC-533 — frame-border vars are published in one batched animation frame')` with 4 tests that call `mountChrome` directly on a connected anchor with a real inline border:
1. mounting reads and writes nothing; after a frame the panel has `3px`/`3px` and the anchor carries no var;
2. two mounts in one task: `requestAnimationFrame` called once; log is read, read, read, read, write, write, write, write; each panel gets its own anchor's width (`2px`, `5px`);
3. a panel removed from the document and a panel whose owner unloaded are skipped: no `getComputedStyle` on their anchors, no vars; the kept one is written;
4. unloading the only pending owner cancels the frame (`cancelAnimationFrame` once), nothing is read at all.
- Red on `4deb8cf` mountChrome.ts: 5 failed (all of the above). Red on `a94995e` mountChrome.ts: 4 failed, 1 passed (the pipeline test, which only checks the panel after a frame). Green on `98ca88e`: 5 passed. Logs: `sc533-r2b-test-red-on-4deb8cf.log`, `sc533-r2b-test-red-on-a94995e.log`, `sc533-r2b-test-green-on-98ca88e.log`.
- Existing mount-task measurers: the shots `chrome placement OK (7 element families: inset 10.00px from the card's right edge, 0 border overlap)`, e2e (124/124) and lifecycle (41/41) all pass, so none of them measures in the mount task.

## Re-measurement: `98ca88e` as committed ("final") vs stock vs stub
Same method as r2: P533 probe in a scratch copy of the lifecycle harness, own Xvfb (:160), CDP port 9541, Obsidian 1.15.0, variants swapped in one session (rotating order), leaf parked on a Reading note before each swap, 3 rounds x (1 warm-up + 4 timed) per session, 2 sessions per scene (round offsets 0, 1) = 24 timed draws per variant per scene. Bundles from the scratch export of `4deb8cf` with only `mountChrome.ts` swapped: `main.js` sha256 stock `6ae2ec3d136b...`, final `19f903914147...`, stub `7e329e03382c...`; `styles.css` `ae45354b6369...` in all.

| scene | variant | tRaf med / p90 / IQR | tPost med / p90 / IQR |
|---|---|---|---|
| R | stock | 858.0 / 993.8 / 76.4 | 863.1 / 1004.8 / 85.4 |
| R | final | 493.9 / 579.1 / 61.0 | 502.8 / 587.5 / 64.4 |
| R | stub | 523.8 / 644.9 / 87.7 | 528.9 / 651.0 / 88.8 |
| LP | stock | 885.1 / 1564.6 / 175.4 | 891.3 / 1578.7 / 169.4 |
| LP | final | 484.9 / 758.2 / 107.2 | 499.8 / 774.0 / 110.3 |
| LP | stub | 495.9 / 589.9 / 61.6 | 509.5 / 599.7 / 61.0 |

- Pass bar: fix median within max(50 ms, 10 % of stub) of stub. R: final - stub = -26.1 ms (bar 52.9) PASS. LP: final - stub = -9.7 ms (bar 51.0) PASS.
- Paired medians of `tPost` (per visit = one variant visit's 4 timed draws; 6 visits per scene): R final - stub -23.6 (3.2, 27.4, -3.2, -76.5, -78.3, -44.0); R stock - final +343.1; LP final - stub -5.5 (-59.0, 28.2, 440.7, -17.8, -16.5, 5.5; the 440.7 visit is a load-spike visit); LP stock - final +365.0.
- Load (`/proc/loadavg` 1-minute, start -> end): c-R 2.96 -> 1.67; d-R 1.62 -> 3.45; c-LP 3.23 -> 9.52; d-LP 9.00 -> 1.41. The LP spike explains LP's wide p90/IQR for stock and final.
- No page errors in any session; worktree `git status --porcelain` empty after every session.

## Gates on `98ca88e` (each its own foreground call, summary lines are the truth)
| gate | result |
|---|---|
| tsc (`npm run tsc`, incl. `tsc -p e2e`) | clean, rc 0 |
| lint (`npm run lint`, incl. `e2e/`) | clean, rc 0 |
| jest (`main.js styles.css` removed first) | `Tests: 2 skipped, 6156 passed, 6158 total`; `Test Suites: 1 skipped, 248 passed, 248 of 249 total`. Fresh-worktree base is 6152 / 2 skipped, so delta +4 passed (4 new tests; the one edited test replaced nothing; the a94995e order test was replaced by the new describe) |
| lifecycle half 1 (20 ids: G-S7a ... G-S8) | `OBSIDIAN-LIFECYCLE done: 20/20 ok, 0 failed` (port 9543) |
| lifecycle half 2 (21 ids: G-S9a ... G-S50) | `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`; union 41/41 |
| e2e | `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0 |
| shots | 592 PNGs; 0 FAIL (the only "fail" matches are the `montage-failed` capture names and a montage-width line); `host-copy pin OK (... Obsidian 1.15.0 ...)`; `button host-leak OK (157 button kinds x 3 states x dark/light = 942 comparisons ...)` with the 34-record boundary; `modal button host-leak OK (... 228 comparisons ...)`; `chrome placement OK (7 element families: inset 10.00px ..., 0 border overlap)`; rc 0. (The shots call ran past 600 s and was moved to the background by the tool; I waited on its PID and read its own log, `shots rc=0`.) |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical - steel-print twin + steel-realprint since SC-170)`, rc 0 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` rc 0 |

## Shots byte diff against stock `4deb8cf`
- The stock run is `npm run shots` in the scratch export of `4deb8cf` (`.../sc533-r2-7dca00e8/src`, mountChrome restored to stock, `visual-harness/dist` copied from the worktree): 592 PNGs, `shots-stock rc=0`, same 157/942 and 228 host-leak lines.
- sha256 of every PNG in both dirs compared (`sc533-r2b-shots-final.sha256` vs `sc533-r2b-shots-stock4deb8cf.sha256`): **0 differences in 592 files.** No `sc533-r2b-crop-*` files were produced because there is nothing to show.
- Not covered: Obsidian-camera shots (`npm run obsidian-shots`) are not part of the battery and need `:1`; in real Obsidian, the lifecycle, e2e and the r2 measurement runs exercised the deferred path and showed no errors.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`)
- `sc533-r2b-fix-report.md` (this file), `sc533-r2b-raw-draws.csv` (180 rows), `sc533-r2b-stats.json`
- `sc533-r2b-build.sh.txt`, `sc533-r2b-analyze.py.txt`, `sc533-r2b-g-lc1.sh.txt`, `sc533-r2b-g-lc2.sh.txt`; r2 scripts still apply for the runner (`sc533-r2-run.sh.txt`, `sc533-r2-probe-p533.mjs.txt`, `sc533-r2-mkharness.cjs.txt`)
- `sc533-r2b-variant-final.patch` (stock to final), `sc533-r2b-run-{c-R,d-R,c-LP,d-LP}.log`
- `sc533-r2b-gate-{tsc,lint,jest,lc1,lc2,e2e,shots,shots-stock,freeze,parity}.log`
- `sc533-r2b-test-red-on-4deb8cf.log`, `sc533-r2b-test-red-on-a94995e.log`, `sc533-r2b-test-green-on-98ca88e.log`
- `sc533-r2b-shots-final.sha256`, `sc533-r2b-shots-stock4deb8cf.sha256`
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r2-7dca00e8/` (bundles, stock shots tree `src/visual-harness/shots`, raw JSON under `out/`).
- `git -C .../draw-steel-elements status --porcelain` is empty; HEAD `98ca88e`.

## Drive-by fixes
- The stale `sc169-element-menu-panel-spec.md:168` sentence (requested by the owner, in the same commit).

## Follow-ups
- Obsidian-camera (`obsidian-shots`) and a human look at Live Preview were not run; the `0px` fallback frame is only visible if a panel is revealed in the same frame as its mount.
- A mount whose anchor was off-document at mount time but is connected by the next frame now gets its real border (previously 0). All 592 browser shots are byte-identical, so no gate sees this; it is the correct geometry.
- The SC-520 branch will conflict textually next to the `queueFrameBorders(...)` line after `aria-label` (it inserts its click handler there).
