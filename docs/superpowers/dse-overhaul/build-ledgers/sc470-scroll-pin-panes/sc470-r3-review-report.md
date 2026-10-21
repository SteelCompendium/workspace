# SC-470 r3: independent adversarial review of 03e589c (on aaa88b7)

## Executive summary
- **Verdict: REQUEST_CHANGES.** One HIGH, two MEDIUM, two LOW, four INFO findings. D2 itself is correct: G-S8 + G-S15 pass 2/2, the no-rule control FAILs both 2/2, and nothing leaks, ratchets or touches the wrong pane.
- **HIGH-1 (owner-flagged item c, confirmed):** the DESCENDANT pin selector also matches an embed's nested `.markdown-preview-sizer`. With an embed above the viewport, every pin grew the embed from 535 to 4024 px and pushed the visible text down by 3489 px for the whole pin (149/149 pinned frames, about 2.5 s), while scrollTop "held". The child combinator `>` fixes it: embed 535/535, text unmoved, and G-S8 + G-S15 ok 2/2. Fold it in, as the ledger ruled.
- **MEDIUM-1:** the Risk-4 "raise on growth" never fires live (0 raises in 40 re-pins). The pin's `!important` REPLACES Obsidian's own inline sizer min-height, so while pinned `scrollHeight - padding` always equals the pinned px. As a result, autosave keeps a Reading view's height frozen at the first px for the whole typing session, and appended content is unreachable until 2.5 s after the last write. The jest tests pass only because they mock scrollHeight.
- **MEDIUM-2:** if a popout is closed while it is pinned, the pin entry leaks (its TTL timer belongs to the dead window) until plugin unload. That holds the detached Reading-view DOM of the closed window. No error results, and `releaseAll` cleans it up.
- **Owner items:** (a) re-pins stay flat, px [5565] over 10 autosave-shaped writes (no 64 px ratchet), headroom at least 1829 px, release 2500-2507 ms after the last write, no phantom space after it. (b) The P470-REPRO 30 s timeouts did not reproduce in 3/3 runs at load 9-14. The cause is the probe's recorder (it waits on main-window rAF, which is throttled to about 2 fps while a popout has focus), not the diff. (c) See HIGH-1.
- **Gates measured:** tsc rc=0; lint rc=0; jest 5410 passed / 1 skipped / 231 of 232 (= r2); lifecycle `29/29 ok, 0 failed`; e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`; shots 572 PNGs, 0 FAIL; `freeze OK (276/276)`; parity 0 gaps / 0 undeclared / 24 declared. Every gate is green.
- **Cost (P470-COST):** old custom property 186-237 ms set / 186-262 ms clear; shipped rule 1.8-2.8 / 1.9-2.3 ms; the real code path (`vault.trigger('modify')`) 2.3-2.7 set / 2.3-3.5 clear, of which the listener itself takes 0.1-0.2 ms.
- **Tree:** dse `git status --porcelain` empty at 03e589c before and after. The superproject shows ` M draw-steel-elements` before and after (r2's unstaged pointer, untouched).


## Findings

### HIGH-1: the descendant pin selector inflates embeds; the visible text jumps by thousands of px for the whole pin
- **Where:** `src/framework/host/previewScrollPin.ts:122-123` (`pinRule`: `.markdown-preview-view[data-dse-scroll-pin="<id>"] .markdown-preview-sizer`).
- **Probe R3-EMBED** (`sc470-r3-probe.mjs.txt`): `SC470/emb-host.md` has 25 paragraphs, then `![[emb-inner]]`, a marker paragraph, 25 paragraphs, a ds-counter, and 40 paragraphs. The view is parked so the embed is above the viewport and the marker sits 150 px below the top. Then an external `vault.process` edits the counter.
  - DOM, measured: the embed is `span.internal-embed.markdown-embed > div.markdown-embed-content > div.markdown-preview-view > div.markdown-preview-sizer`, a nested sizer that the descendant rule matches.
  - **03e589c (2 runs, the one that pinned each time):** the embed's inner sizer took the computed min-height 4399px (the pin px) and the embed grew from **535 to 4024 px** (capped by the embed max-height). The marker went from **150 to 3639 px** below the viewport top on **149 of 149 pinned frames (15-2498 ms)**, then snapped back at release. scrollTop stayed at 1480, so G-S8/G-S15-style assertions stay green while the reader's text leaves the screen. Screenshot: `sc470-r3-EMBED-during-pin-mine.png` (a blank embed fills the pane).
  - **Child combinator (`> .markdown-preview-sizer`, bundle `child`):** the embed stayed at 535/535 and the marker at 150 on 150/150 and 148/148 pinned frames. Screenshot: `sc470-r3-EMBED-during-pin-child.png`.
- **Why it is HIGH now:** SC-198 already had this shape, but only for our own clicks. D2 pins on every write to the note: another pane, Sync, git, another plugin, and autosave while typing in a second pane. So any Reading view with an embed above the viewport and a rendered DSE block now jumps on writes the user did not make.
- **Fix (ledger: fold it):** use `> .markdown-preview-sizer` in `pinRule` and in the header comment at `:78`. Measured equal on the gates: `child` gives G-S8 + G-S15 ok **2/2** (`sc470-r3-child-disc2.log`, plus disc1 in `sc470-r3-disc-summary.log`). The style-append-disabled control for `>` is the same mechanism and still applies.
- Add a jest test: a nested `.markdown-preview-view > .markdown-preview-sizer` inside the pinned scroller must not match the rule. Test it with `element.matches(selectorFromRule)`, since jsdom has no layout.

### MEDIUM-1: the re-pin "raise on growth" (Risk 4) is dead live; autosave freezes the Reading view's height for the whole typing session
- **Where:** `previewScrollPin.ts:201-209` (`const content = scroller.scrollHeight - verticalPadding(...)`) and the header claim at `:65-71`.
- **Mechanism:** the pin's `min-height: <px>px !important` OVERRIDES Obsidian's own inline sizer min-height; it does not floor it. Obsidian's Reading view is virtualised, so the sizer's height is its min-height. While pinned, the sizer therefore stays at px, `scrollHeight` reads px + padding, and `content === px` on every re-pin. Growth can never be observed.
- **Probe R3-REPIN** (10 `vault.process` writes 300 ms apart on `tall.md`, scrollTop 2779; `sc470-r3-REPIN-mine-probe2.json`):
  - `grow` (+1 paragraph per write): Obsidian's inline min-height climbed 5501 → 5901, the computed value stayed **5565**, and scrollHeight stayed **5629** until the release.
  - `growbig` (+40 paragraphs, then 9 toggles): Obsidian wanted 7101, the pin held 5565 for **12 s** (the whole burst plus the TTL), and scrollHeight became 7165 only after the release.
  - px sequence `[5565]` in all 4 variants: **0 raises in 40 re-pins**.
- **Failure scenario:** typing in Live Preview, with a Reading pane of the same note scrolled down beside it (a common side-by-side preview). Autosave fires `modify` about every 2 s and keeps re-pinning, so the Reading pane cannot grow. New text at the end is unreachable until 2.5 s after the user stops typing. Before D2, only DSE writes pinned, so this is new with SC-470.
- **jest** (`test/dom/framework/previewScrollPin.test.ts:557`) passes only because it sets `scrollHeight` by hand. A real browser cannot produce that value while the rule is held.
- **Fix (pick one; owner's call):**
  - (a) Minimal: re-pin to `max(existing.px, parseFloat(sizer.style.minHeight) || 0, scrollHeight - padding)`, reading the CURRENT direct-child sizer's inline value, which is Obsidian's own estimate and is not overridden by our rule. Reading it at `modify` time is safe: r1 showed that `modify` fires before the rebuild, while the inline value is still full. A collapsed value (46 / 2446) is below px, so the "never lowers" guarantee holds.
  - (b) Structural, and it also removes HIGH-1's class of problem: make the pin a true floor rather than an override. For example, a per-pin rule on the scroller itself, such as an absolutely positioned `::after` spacer of height px. Obsidian's inline min-height then stays in force. This needs a live re-measure of G-S8/G-S15 and of the containing block (`position` on `.markdown-preview-view`).
  - Either way, add a lifecycle or probe check that a re-pin after real growth raises.
- **Severity:** MEDIUM, not HIGH. Nothing clamps and no scroll position is lost. Headroom was at least 1829 px throughout, and the release came 2500-2507 ms after the last write with no phantom space after it.

### MEDIUM-2: a popout closed while pinned leaks its pin entry until plugin unload
- **Where:** `previewScrollPin.ts:228` (the TTL on `scroller.ownerDocument.defaultView`) together with the `pins` Map (`:158`). This is pre-existing SC-198 shape, now reachable from any write while a popout shows the note.
- **Probe R3-POPOUT (d):** the popout was pinned (id 25), then the popout leaf was detached 150 ms later.
  - 4 s later the detached scroller still carried `data-dse-scroll-pin="25"`: the timer of the closed window never fired, so `release` never ran and the Map still holds the scroller, its subtree, its `<style>` and the dead `Window`.
  - `disablePlugin` → `releaseAll` cleaned it up with no error (attribute null, 0 styles, `errs: []`).
  - Nothing is visible; the cost is retained memory per closed-while-pinned popout.
- **Fix:** sweep `this.pins` for `!scroller.isConnected || held.win.closed` at the top of `pinReadingViewsOf` / `pinScroller` (cheap: a handful of entries). Or register `workspace.on('window-close', …)` to release pins whose `ownerDocument` belongs to the closing window. Add a jest test: a detached scroller is dropped on the next call.

### LOW-1: the id counter comment is wrong, because ids restart at 1 after a plugin reload
- **Where:** `previewScrollPin.ts:119-120`, "Unique across plugin instances".
- **Measured (R3-LEAK):** pins before the disable got ids 1-8. After enable, the first pin got **id "1"** again, because the module is re-evaluated.
- **Harmless today:** `releaseAll` removed every style (0 left after a disable mid-pin), and Obsidian's popout head mirroring removes copies when the original goes. So a stale rule cannot coexist with a reused id.
- **Fix:** correct the comment ("unique within one plugin load; releaseAll removes every rule before the next load"), or seed the id with a per-load random prefix (`Date.now().toString(36)`) to make it true.

### LOW-2: the test titled "keeps the original height (no ratchet)" was weakened, and the test meant to replace its guarantee is not one
- **Where:** `test/dom/framework/previewScrollPin.test.ts`. The SC-198 test now sets padding 32+32 and expects 4883 after `scrollHeight` 4947. That holds only because 4947 - 64 = 4883, so it really asserts the padding arithmetic.
- **Effect:** combined with MEDIUM-1, nothing pins the live behaviour of the re-pin.
- **Fix:** once MEDIUM-1 is fixed, keep one test where the raw `scrollHeight` is inflated by padding (no raise) and one where the sizer's inline min-height grows (raise). The second is the input a real browser can actually produce.

### INFO
- **I-1 (owner item a), autosave re-pins are flat:** toggle px `[5565]` over 10 writes (st0 2779, ch 1021, pad 64), the same in grow/shrink/growbig. Minimum headroom px + pad - ch - st0 = 1829 px, scrollTop 2779..2779, computed min-height == px at every collapsed frame. Release came 2507 / 2500 / 2503 / 2502 ms after the last write, and scrollHeight after release was natural (5565 / 5965 / 5317 / 7165). Nothing unbounded.
- **I-2 (owner item b), REPRO timeouts:**
  - r2's trace probe with `P470_CASES=b-process,popout-process` passed **3/3** at load 9-14 (`sc470-r3-repro-runs.log`).
  - The likely cause is the probe itself. Its recorder (`P.rec`, r1 probe) resolves only on MAIN-window rAF ticks and has no timer cap. While a popout has focus, the main window ran about 6 frames in 2.5 s in every popout series (r1, r2 and mine). Under heavier load or occlusion, the promise can outlast CDP's 30 s timeout.
  - My R3 recorder uses the scroller's own window rAF plus a `setTimeout` cap, and never hung.
  - Nothing in the diff awaits or blocks: the listener takes 0.1-0.2 ms.
  - One sparse r2 sample (`repro6`) read st 0 at 253 ms with the pin present and sh 6246 before any collapse, then 2432 again at 1545 ms. It was not reproduced in r1's 2, r2's other 10 or my 3 popout runs, and my R3-POPOUT (a) held st 2748 over 225 popout-rAF frames. I attribute it to unexplained sampling under load, not to the diff.
- **I-3, Obsidian mirrors main-head `<style>` into popouts.** A main-window pin's `<style>` appears in an open popout's head, and in a popout opened during the pin. It is removed from both when the pin releases (R3-POPOUT (b)/(c): during 1/1, after 0/0). No leak. Ids are distinct across documents (popout pin 18, main 20/22, simultaneous main + popout 24/25).
- **I-4, SC-326 interaction (0ce76dd) and rebase notes.**
  - No runtime interaction: the montage preserves the board's HORIZONTAL `scrollLeft` on `.dse-mt__board`, and its MutationObservers watch `data-dse-moving` on the root and `childList` of `body`. The pin adds an attribute to the Reading scroller and a `<style>` to `head`, neither of which those observers see.
  - Textual conflicts to expect on rebase: `visual-harness/obsidian-lifecycle.mjs`, where both append a header line and a scenario at the end of `SCENARIOS` (G-S13 vs G-S15); `styles-source.css` (different hunks: the top block deletion vs about line 4585); and the superproject `CHANGELOG.md`.

## Owner-item and probe results (no finding)
- **D2 correctness:**
  - `--only=G-S8,G-S15` on the 03e589c bundle passed **2/2**, all phases held at 2779 (`sc470-r3-disc-summary.log`).
  - Second pane, external `vault.process` and the disk write (watcher) are in G-S15. The popout held 2748 (R3-POPOUT a), and the rule went into the popout head, not the main one.
  - **Discrimination:** with `doc.head.appendChild(style)` removed (bundle `norule`), G-S8 FAIL + G-S15 FAIL (all 3 phases: `2779 -> min 2001, pin present true`) **2/2**. Screenshot `sc470-r3-disc-norule-G-S15-FAIL.png`.
- **Style leak (R3-LEAK):**
  - 6 spaced pins: 1 style + 1 attribute during each, 0/0 after each, ids 1-6.
  - A burst of 20 writes 100 ms apart: 1 style added, 1 removed, 0 after.
  - Disable 60 ms into a pin: 0 styles / 0 attributes after, no errors.
  - Modify listeners: 11 before, 9 after disable, 11 after enable (ours is unregistered). A write while disabled produced 0 pin events.
  - Re-enable: the pin works again and releases to 0.
- **`!important`:** the computed sizer min-height equalled px on every frame where Obsidian's inline value had collapsed (R3-REPIN `computed==px while collapsed true`, 4/4).
- **No leftovers:** `styles-source.css` and the built `styles.css` contain no `dse-scroll-pin` (`sc470-r3-build.log`: `css-mentions-pin=0`). The only remaining `--dse-scroll-pin` mention is the historical comment at `previewScrollPin.ts:85`. The SKILL.md G-S8 phrase "FAILs with the pin disabled" still needs the dispatcher's landing edit, as the ledger notes.
- **Blast radius (R3-BLAST), 0 pin events in every case:**
  - a non-DSE note scrolled to 3945;
  - a DSE note at scrollTop 0;
  - Live Preview scrolled to 2000;
  - Source mode;
  - a `modify` of `other.md` and of another DSE note `tall2.md` while `tall.md` was scrolled;
  - rename / delete / create of another file;
  - renaming the open note itself.
  - A write after the rename pinned correctly under the new path, and scrollTop held at 2779.
- **Cost (R3-COST, r1's P470-COST plus shipped kinds, 2473-descendant preview, set+clear first-layout ms):** varOnly 186-217 + 202-212; oldFull (old rule re-injected) 213-237 + 186-262; sheetChild 2.0-2.2 + 2.3-3.7; sheetDescShipped 1.8-2.8 + 1.9-2.3; realShipped (`vault.trigger('modify')`): listener 0.1-0.2, set 2.3-2.7, clear 2.3-3.5.
- **Scope:** the diff touches only `previewScrollPin.ts`, `registerFrameworkElements.ts`, `styles-source.css`, the test file and `obsidian-lifecycle.mjs` (header line + G-S15 only). `PIN_TTL_MS` is still 2500. `ReadingModeBlockHost.ts`, `fenceLine.ts`, `sidebar/registration.ts` and the G-S8 assertions are untouched. The CHANGELOG bullet (superproject `17064b0`) is accurate.

## Gates (03e589c, measured by me, foreground except shots, which the tool moved to the background at 600 s and I waited on by PID)
| gate | result | log |
|---|---|---|
| tsc | rc=0 | `sc470-r3-tsc.log` |
| lint | rc=0 | `sc470-r3-lint.log` |
| jest | 5410 passed / 1 skipped, 231 of 232 suites, rc=0 | `sc470-r3-jest.log` |
| lifecycle (port 9372) | `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed`, rc=0 | `sc470-r3-lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`, rc=0 | `sc470-r3-e2e.log` |
| shots | 572 PNGs, 0 FAIL, host-copy pin OK, button host-leak 672 comparisons, rc=0 | `sc470-r3-shots.log` |
| freeze | `freeze OK (276/276 …)` | `sc470-r3-freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc=0 | `sc470-r3-parity.log` |

## Method / hygiene
- **Bundles** were built from the worktree with temporary source mutations reverted by `git checkout` (`sc470-r3-build.sh`, `sc470-r3-build.log`): `mine` 1a6143cdb1d3, `norule` e2d78063f763, `child` 3612fadceb14.
- **Probes** were injected into the harness and restored from a saved copy after each run (`sc470-r3-run.sh`; harness sha 281a2c85d727 after every run).
- **Tree:** dse `git status --porcelain` empty and HEAD 03e589c, before and after. Superproject ` M draw-steel-elements`, before and after (r2's).
- **Cleanup:** I removed the `main.js`/`styles.css` my builds left (they were absent before) and 2 kept lifecycle temp dirs from my norule FAIL runs, all by exact path. No processes are left.
