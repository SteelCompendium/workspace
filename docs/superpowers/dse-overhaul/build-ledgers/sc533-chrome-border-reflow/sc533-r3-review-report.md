# SC-533 r3: independent adversarial review of `sc533-chrome-border-reflow` @ 98ca88e

## Executive summary
- **Verdict: FIX-REQUIRED.** Findings: 1 HIGH, 1 MEDIUM (it was already in the code before this branch), 2 LOW, 4 INFO.
- **HIGH-1. Live Preview regression.** CodeMirror can take a chrome panel out of the document after it mounts and before the next frame, then put it back later. `flushFrameBorders` drops such an entry (`mountChrome.ts:150`), so the panel never gets its vars. It then sits **1 px into the card's top border and 1 px further left** (inset 11 / gap -1 instead of 10 / 0), and stays there until the block is redrawn. In 4 of 4 real-Obsidian sessions it hit the stamina bar, the tracker and a statblock that sit just below the first Live Preview screen. Stock was correct for the same blocks in all 3 sessions I ran on it. The browser shots cannot see this, which is why the pass bar's "geometry unchanged" condition is broken without any gate noticing.
- **Perf: PASS.** These are my own reruns: profiler off, variants interleaved, `tPost` medians. **R** (n=24/variant): stock 991.0 / final 525.5 / stub 517.2. Final minus stub is +8.3 against a bar of 51.7. **LP** (6 sessions, n=72/variant): stock 881.5 / final 520.1 / stub 507.8. Final minus stub is +12.3 against a bar of 50.8. On quiet visits only (load1 < 5) the gap is +3.7. Within a frame, final's `tPost - tRaf` is about +3 ms over stub, so the read did not just move to an equally expensive spot.
- **What held:** batching and order (7 entries in one flush, all reads before writes, 0 reads in the mount task), popouts, hide, held frames, unload-before-frame and close-before-frame (no leak, no errors). No flush was ever queued from inside a rAF callback, so no frame was ever painted with the fallback.
- **Gates:** jest `6157 passed / 1 skipped / 248 of 249`, rc 0. Freeze `280/280`, rc 0, on 592 freshly regenerated PNGs. All 592 are byte-identical to stock `4deb8cf`. The shots run itself hit my 575 s cap while running its later in-run sweeps.
- **Rebase needed:** `origin/develop` has moved from `4deb8cf` to `34f46cf` (SC-525). The two do not touch the same files.

## Findings

### HIGH-1: a panel that is out of the document at flush time is dropped for good. In Live Preview it then sits 1 px into the card's border.
- **Where:** `src/framework/chrome/mountChrome.ts:150` (`.filter((e) => e.panelEl.isConnected)`), together with `flushFrameBorders` deleting the whole queue at `:147-148`. Nothing ever re-queues a skipped entry.
- **How it happens:** Live Preview builds the widgets for the first blocks below the viewport while they are connected, and `mountChrome` queues them. Within 45-146 ms CodeMirror removes those widget DOMs from the document. When the user scrolls to them, CodeMirror re-attaches the same DOM and does not re-render it. Stock read the border at mount, while the panel was still connected, so its value was right. The deferred read finds the panel disconnected and skips it, so no var is ever written.
- **Mechanism evidence** (`finalx2` bundle, which logs every queued entry; `sc533-r3-probe-r3z-z1.json`):
  - LP stamina-bar, initiative and `SB Four`: `connAtQueue: true, connAtFlush: false`.
  - Each of these later shows up on screen with `ct ''`, `bt 1`, `inset 11`, `gap -1`.
- **Reproduced in 4 sessions:**
  - `y2` (finalx) and `z1` (finalx2).
  - `wfinal` and `wfinal2`, both on the committed `final` bundle with the panel hovered (opacity 1): `SB Four` and `Heroes` read `ct ''`, inset 11, gap -1.
  - Stock in `y3stock`, `wstock` and `wstock2`: every panel reads `1px`, inset 10, gap 0.
- **Visible failure:** hover a statblock or tracker in Live Preview after scrolling to it. The panel's bottom edge covers the card's top hairline, which is exactly the defect Scott's SC-169 round-2 ruling 2 removed ("the panel should not cover the Element's border"). The pass bar requires geometry identical to stock, and this breaks it. The shots harness has no CodeMirror, so freeze, shots and the "chrome placement OK" check are all blind to it.
- **Fix (prescribed):**
  - Do not drop an entry whose panel is disconnected at flush. Keep it pending until its panel is connected again.
  - Suggested mechanism: a per-window `IntersectionObserver` on such panels. IO callbacks run after layout, so the style read is cheap. In the callback, read every intersecting entry's anchor first, then write the vars, then `unobserve`. Also `unobserve` on owner unload, through the existing `owner.register`.
  - Do not use a rAF re-poll loop: it would keep the frame loop spinning while a cached widget stays detached.
  - Add a real-Obsidian regression check: a lifecycle scenario with a Live Preview note that has framed chrome blocks below the first viewport. Scroll to each one and assert, for every connected panel, `ar.right - pr.right == 10` and `ar.top - pr.bottom == 0`. It must FAIL on `98ca88e` and pass on stock. P533Y/P533Z in this directory are a working template.
  - Update jsdom test 3 (`chromeRound2.test.ts:200-214`). It currently locks in "skipped and never written". It should assert that the entry is not written while disconnected and IS written once the panel is reconnected.

### MEDIUM-1 (already in stock, not caused by this branch): Reading-view blocks rendered off-document keep the wrong geometry
- **Where:** same code path, Reading view.
- **What happens:** Obsidian renders `SB Five`, `C2` and `SB Six` (below the fold of `Lifecycle/r3many.md`) while they are detached: `connAtQueue: false`, `connAtFlush: false`. When they are scrolled into view they show inset 11 / gap -1.
- **Stock behaves the same way.** It writes an inline `0px` because it read a detached node (`sc533-r3-probe-r3y-y3stock.json`, Y1: same three blocks, `ct '0px'`). So this is not a regression.
- **Owner decision:** the HIGH-1 fix (wait until the panel is connected) also fixes this. Fold it in, or file a follow-up.

### LOW-1: the SC-533 jsdom tests depend on test order
- **Where:** `test/dom/framework/chromeRound2.test.ts:183-219`.
- **What happens:** the queue is module-level. A previous test's pipeline mount (even a detached one: its `ownerDocument.defaultView` is still `window`) can leave a queue pending. The next test's mount then joins it, so `requestAnimationFrame` is called 0 times instead of 1, or unload does not cancel because the queue is not empty.
- **Evidence:** `npx jest chromeRound2 --randomize --seed=N`. Seeds 1, 2, 5 and 8 each fail 1 test ("two mounts in one task…" or "unloading the only pending owner…"). Seeds 3, 4, 6 and 7 pass. The default order passes. Log: `sc533-r3-test-final-rand1.log`.
- **Fix:** add `beforeEach(async () => { await nextFrame(); })` in that describe to drain any pending queue, or add a test-only reset export.

### LOW-2: comments and spec state things that are not true
- `mountChrome.ts:92-93` says "it is hidden unless hovered, so at most a 1px offset for one frame". That is false given HIGH-1, and the panel is always visible on mobile (`styles-source.css:17052`).
- The ledger's "display:none unless hovered" is also wrong: the panel is hidden with `opacity: 0` plus `pointer-events: none` (reveal rule at `styles-source.css:16840-16843`).
- `mountChrome.ts:81-85` still says "measures it ONCE at mount … a detached node … simply yields 0".
- `docs/superpowers/sc169-element-menu-panel-spec.md:170-173` says "a node that never reaches the document keeps the fallback". It leaves out the case of a node that leaves and comes back.
- **Fix:** reword all of these together with the HIGH-1 fix.

### INFO
1. **Branch base is out of date.** `origin/develop` is `34f46cf`, 10 SC-525 commits after `4deb8cf`. Neither side touches `mountChrome.ts`, `chromeRound2.test.ts` or the sc169 spec. After the rebase, expect jest at CURRENT 6184 + 4 = **6188 passed / 1 skipped**.
2. **LP perf noise.** A concurrent SC-522 Obsidian session pushed load1 up to 18.6.
   - My first 4 LP sessions, pooled, failed the bar: +61.2 against 51.3.
   - The slow visits (over 800 ms) were spread evenly between variants: final 10, stub 9 of 48.
   - Two more sessions brought the pooled result to +12.3 (pass), the quiet subset to +3.7 and the paired median to +13.1 (n=18).
   - I read this as a load artifact, not a cost of the fix.
3. **Probes that passed** (`sc533-r3-probe-r3x-x1.json`, `sc533-r3-probe-r3y-y2.json`):
   - **Batching and order:**
     - Reading view open: one flush with 7 entries, reads all before writes, 0 anchor reads outside rAF.
     - A same-task `rerender(true)` behaves the same: one flush, 7 entries.
     - Adoption after 8 in-card writes (registry claims 0 → 8): geometry correct.
   - **Fallback frames:** 0 flushes were queued inside a rAF callback in any scene (R, LP, scroll, adoption, popout), so no frame was ever painted with the fallback.
   - **Hovered tracker redraw:** at insertion the panel reads inset 11 / gap -1, but it is opacity 0 and not hovered yet. It is correct (10 / 0, opacity 1) at the first rAF, which runs before paint.
   - **Held plugin rAF** (simulates a hidden window): over 8 draws the queue stays at 1 entry (bounded). Releasing it writes only the live panel.
   - **Real `BrowserWindow.hide()`:** visibility goes to `hidden` and rAF stops. The queue stays 0 across 4 draws. After `show()` the geometry is correct.
   - **Unload before the frame:** switching the leaf away cancels 7 held requests, and the queue is empty afterwards.
   - **Popouts:**
     - The flush runs on the popout's own rAF.
     - Re-rendering both windows in one task gives one flush per window.
     - `moveLeafToPopout` right after a rerender: 7/7 panels correct.
     - Closing the popout right after a rerender: queue size 0, no page errors.
     - The direct cross-document `MarkdownRenderer` probe could not run, because `require('obsidian')` is not available in the page. `moveLeafToPopout` covers the same adoption.
4. **Var consumers and scope:**
   - The only consumer of the vars is the `.dse-chrome` panel rule (`styles-source.css:16735`, `:16737`; the built `styles.css` and `visual-harness/dist/harness.css` match).
   - Nothing reads the vars back from the anchor: no test, e2e, harness or parity code.
   - No code re-parents the panel.
   - The diff touches only `mountChrome.ts`, `chromeRound2.test.ts` and the sc169 spec.

## Measurements
- **Harness:** a copy of r2's P533 probe in my own scratch, with bundles built from my own export of `98ca88e`. The `main.js` sha256 values are identical to r2b's: stock `6ae2ec3d…`, final `19f90391…`, stub `7e329e03…`. Obsidian 1.15.0, profiler off, 3 rounds × (1 warm-up + 4 timed) per session, variant order rotated.
- **Sessions:** R e/f (n=24); LP e/f/g/h/i/j (n=72).

| scene | variant | tPost med / p90 / IQR | tPost-tRaf med |
|---|---|---|---|
| R | stock | 991.0 / 1831.2 / 476.3 | 6.6 |
| R | final | 525.5 / 611.5 / 48.2 | 9.0 |
| R | stub | 517.2 / 1100.4 / 548.5 | 6.0 |
| LP | stock | 881.5 / 1737.1 / 157.0 | 9.8 |
| LP | final | 520.1 / 994.1 / 194.2 | 9.9 |
| LP | stub | 507.8 / 873.4 / 77.3 | 6.7 |

- **Paired medians (final minus stub):** R -10.6 (n=6), LP +13.1 (n=18).
- **Paired medians (stock minus final):** R +618.5, LP +352.9.

## Gates I re-ran
| gate | result |
|---|---|
| jest, worktree at `98ca88e` (`main.js`/`styles.css` removed first) | `Tests: 1 skipped, 6157 passed, 6158 total`; `Test Suites: 1 skipped, 248 passed, 248 of 249 total`; rc 0. This is CURRENT-at-base 6153/1 plus the 4 new tests. |
| SC-533 tests, red/green (scratch copy) | 46/46 green on final. 5 fail on stock `4deb8cf`. 4 fail on `a94995e`. The tests are not vacuous: the anchor is connected and the spy observes the reads. |
| shots | 592 PNGs regenerated. In-run gates passed: `chrome placement OK (7 element families: inset 10.00px …, 0 border overlap)`, host-copy pin OK, button host-leak 157/942, modal 228, input 176. The run hit my `timeout 575` while running the later in-run sweeps (rc 124), so I did not re-verify shots rc. r2b reported rc 0. |
| freeze, on those fresh shots | `freeze OK (280/280 …)`, rc 0. The 592 PNG hashes match r2b's stock-`4deb8cf` list: 0 differ. |
| not re-run (r2b's lines match CURRENT-at-base) | tsc, lint, lifecycle 41/41, e2e 124/124 cov 87/87, parity 0/0/24 |

The worktree's `git status --porcelain` was empty before and after; HEAD is `98ca88e`. Only ignored artifacts changed: `main.js`/`styles.css` were removed by the jest protocol, and `visual-harness/shots` was regenerated. I removed one temp dir that my own failed probe left behind (`/tmp/dse-obsidian-lifecycle-qyMiGo`).

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`)
- **Perf:** `sc533-r3-stats.json`, `sc533-r3-raw-draws.csv`, `sc533-r3-run.sh.txt`, `sc533-r3-build.sh.txt`, `sc533-r3-analyze2.py.txt`.
- **Probes:**
  - Scripts: `sc533-r3-probe-r3x.mjs.txt`, `-r3y`, `-r3z`, `-r3w`, plus `sc533-r3-build-x2.sh.txt`.
  - Results: `sc533-r3-probe-r3x-x1.json`, `-r3y-y2.json`, `-r3y-y3stock.json`, `-r3z-z1.json`, `-r3w-wfinal2.json`, `-r3w-wstock2.json`.
- **Gates:** `sc533-r3-gate-jest.log`, `sc533-r3-gate-shots.log`, `sc533-r3-gate-freeze.log`, `sc533-r3-shots-98ca88e.sha256`.
- **Tests:** `sc533-r3-t-red.sh.txt`, `sc533-r3-test-{final,stock,a94995e,final-isolated,final-rand1}.log`.
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r3-2128bb62/` holds the bundles (stock/final/stub/finalx/finalx2) and the raw `out/`.
- **Crops:** I tried CDP crops of the hovered LP panel (`out/sc533-r3-crop-*.png` in scratch). The panel is not painted in the clip for stock either, so the crops are inconclusive and are not used as evidence. The geometry numbers above are the evidence.
