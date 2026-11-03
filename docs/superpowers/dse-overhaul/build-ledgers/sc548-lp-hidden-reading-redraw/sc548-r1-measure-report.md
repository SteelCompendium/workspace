# SC-548 r1: does a Live Preview leaf's hidden Reading view redraw DSE blocks? (measurement)

## Executive summary
- **Recommendation: close SC-548 as not worth it.** Its premise does not reproduce. On Obsidian 1.15.0 a hidden Reading view never redraws a DSE block. The same visibility gate is in 1.14.4 and 1.13.7.
- **DSE work in hidden Reading views:** 0 processor calls, 0 pipeline runs, 0 pins, 0 holds. That covers 72 Live Preview writes in 6 shapes (at 1x and 8x CDP) and every write in G-S8, G-S52 and G-S59. Each write ran exactly one DSE render per visible block of the note, and none in a hidden view.
- **Obsidian's own work in a hidden view, per write:** 0.0-0.5 ms unthrottled and 1.2-7.4 ms at 8x. It is the embed's `loadContents`, then `renderer.set`, then an `onRender` that returns at once. When the written note itself is open in Live Preview, the hidden view gets no call at all (0 ms).
- **Share of write-to-visible-paint latency: under 0.1%.** The G-S52 shape paints at 354-800 ms (1x) and 6330-7769 ms (8x). The SC-470 Live Preview sibling paints at 937-2508 ms (1x) and 12050-29710 ms (8x). In both, the hidden view's share is 0.3 ms or less of a 354 ms floor.
- **The skip prototype (scratch only) fired 0 times.** G-S8, G-S52 and G-S59 passed 3/3 on it. Latency differences between bundles follow the load average, not the bundle.
- **The SC-472 r1 evidence was misattributed.** G-S52's `openHost` opens every host in Reading first. Those 6 visible Reading renders per run (`done L1:RDE` x6) fell into the previous write's 12 s timeline window and were read as hidden-view `mh3rd` events.
- **Side finding (stock, Obsidian's own behavior; a skip would not change it).** After outside writes, switching a Live Preview leaf to Reading first paints the old hidden DOM.
  - A note's own card shows a stale value for 0.7-1.45 s before Obsidian re-renders.
  - An embed is blank for 0.45-0.9 s.
- **Nothing to land.** There is no G-S66, and SC-547 and SC-552 are untouched.

## Environment
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw`, superproject `d83602fd`, dse `0698550f`.
  - `git fetch origin` was run. **`origin/develop` = `0698550f`, so it has not moved**, and `src/framework/host/` is unchanged.
  - `git status --porcelain` was empty before and after the round, in the worktree and in its dse submodule.
- **Obsidian 1.15.0**, the newest asar in `~/.config/obsidian`, as the harness picks it. Headless, with an OS-assigned CDP port (SC-551).
- **Nothing ran in the tree.**
  - Bundles were built from `git archive 0698550f` exports in scratch (`sc548-r1-mkbundle.sh`). `node_modules` is symlinked from the main checkout; its lock file is identical to `0698550f`'s.
  - The lifecycle harness ran as a scratch copy with the probe block injected (`sc548-r1-mkharness.cjs.txt`). The copy sits in the stock export's `visual-harness/`, so `../scripts/*.mjs` resolve.
- **Bundles** (main.js sha256; `styles.css` is `93be34afd907` in all three):
  - `stock` `2ca030840e3a380b…`, built and not run. The CURRENT numbers at `0698550f` stand for it.
  - `instr` `02b312fada6d96b3…`: stock plus a page hook, `globalThis.__sc548hook`, at processor entry and around `ElementPipeline.run`. It does nothing unless the probe installs it. This is the baseline. Patch: `sc548-r1-instr.patch`.
  - `skip` `0c89b98437dc8ad7…`: instr plus the prototype guard (`sc548-r1-prototype-skip.patch`). `tsc --noEmit` is clean on that tree (`sc548-r1-skip-tsc.log`, empty).
- **8 harness runs.** The load average was recorded at the start and end of every run and of every scenario (`P548-LOAD` lines). Other efforts ran lifecycle at the same time (G-S63 and G-S64 were seen).

| Run | Bundle | What | loadavg start -> end |
|---|---|---|---|
| `mech-1` | instr | P548-MECH, all 6 phases, 1x | 1.07 -> 1.63 |
| `mech-thr8-instr` | instr | p1 + p6, 8x | 0.96 -> 1.93 |
| `mech-skip-1` | skip | all 6 phases, 1x | 1.42 -> 3.27 |
| `mech-instr-2` | instr | all 6 phases, 1x (variance pair for `mech-skip-1`) | 3.14 -> 4.64 |
| `mech-thr8-skip` | skip | p1 + p6, 8x | 5.42 -> 4.18 |
| `life-instr` | instr | G-S8, G-S52, G-S59, whole-scenario recording | 3.02 -> 4.24 |
| `life-skip` | skip | G-S8, G-S52, G-S59, whole-scenario recording | 3.79 -> 3.20 |
| `mech-thr8-instr-2` | instr | p1 + p6, 8x (pair for `mech-thr8-skip`) | 1.70 -> 9.70 |

**How the probe classifies an element.** Every DSE entry, pin and hold is classified by where its element sits:
- the leaf object (a stable id);
- whether it is inside the leaf's `view.previewMode.containerEl` or `view.editor.cm.dom`;
- the leaf's `getMode()`;
- whether it is inside an embed.

`RDHIDDEN` means the leaf's Reading view while that leaf is in source or Live Preview mode. The probe also wraps, per instance, the hidden views' renderers (`set`, `onRender`) and the embed components under them (`loadContents`), and times each call.

## Q1. Mechanism
**The path, read from Obsidian 1.15.0's `app.js`** (excerpts with offsets are in `sc548-r1-obsidian-excerpts.txt`):
1. **The written note is embedded in a note open in Live Preview.**
   - Every markdown embed component, including the one inside the leaf's hidden `previewMode`, listens to **`metadataCache.on('changed')`** for its file.
   - The chain is `onFileChanged` -> `loadFileInternal` -> `loadContents` -> `set` -> `previewMode.set` -> `renderer.set(text)`, which runs `this.text = t; queueRender()`.
   - The queued **`onRender` returns on its first line** while the preview is not shown: `if(!(!!t.offsetParent&&t.offsetWidth>0))return;`.
   - So nothing is parsed, no section is rendered, and no post-processor runs. **No DSE code-block processor is called.** DSE does nothing: no `ReadingModeBlockHost`, no `pipeline.run`, no tracker mount, no pin or hold.
2. **The written note itself is open in Live Preview.**
   - `MarkdownView.onModify` -> `loadFileInternal` -> `setData` -> `setViewData(data, false)`, which sets **only `currentMode`** (the editor).
   - The hidden `previewMode` is not even told until the leaf switches mode.
3. **The SC-481 reconcile cannot reach a hidden view either.** `ReusedElementRemounter.reconcile`, called after each visible processor call, reads `getSectionInfo`. That returns the renderer's `lastText`, the text of the last parse. A hidden renderer has not parsed, so the body equals the host's `knownBody` and `reusedBlockBody` returns null. Measured: the tagged hidden roots survived every write.

**Counts per write, measured.** 3 writes per phase per run, the same in `mech-1`, `mech-instr-2` and `mech-skip-1`, and the same at 8x for p1 and p6. "DSE in hidden" counts processor calls, runs, pins and holds on an `RDHIDDEN` element.

| Phase | Shape | DSE renders per write (where) | DSE in hidden | Obsidian in hidden view |
|---|---|---|---|---|
| p1 | **G-S52 shape**: LP host `lpembhostend.md` (opened in Reading first, as G-S52 does), parked at its end, outside `vault.process` of `lpembtracker.md` | 1 (visible LP embed `LPE`, under the SC-522 hold) | **0** | 1 embed: `loadContents` + `set` + early-return `onRender`, 0.0-0.3 ms |
| p2 | same, host opened straight in LP (its Reading view never rendered) | 1 (LPE) | **0** | same, 0.0-0.3 ms |
| p3 | **(b)** the note itself open in LP, no embed | 1 (visible LP, under the SC-478 hold) | **0** | none for its own view. The old hidden root (tagged) survives and still shows "Malice: 1" while disk says 12. |
| p4 | **(c)** p1 plus a second pane: Reading view of the written note (the G-S52 (c) load) | 2: Reading pane B (`L2:RD`, 221-298 ms), then the LP embed | **0** | 0.0-0.2 ms |
| p5 | **(c)** p1 plus a second LP pane of the host | 1 (pane A's LPE; pane B's embed is off-viewport in CodeMirror) | **0** | both leaves' hidden embeds early-return, 0.1-0.5 ms |
| p6 | **SC-470 LP sibling**: `tall.md` in Reading pane A and LP pane B (B opened in Reading first) | 2: LP B and Reading A | **0** | none. B's hidden root survives, stale. |

- **(a) An LP leaf showing the embedded note's host note** is p1 and p2. "The note itself in LP" is p3, and "a second pane" is p4 and p5.
- **Whole lifecycle scenarios** (`P548_GLOBALREC=1`; identical on instr and skip):
  - G-S8: 5 processor calls, 0 hidden.
  - G-S52: 18 calls; done in `L1:LPE` x9, `L1:RDE` x6, `L2:RD` x1; 0 hidden.
  - G-S59: 36 calls; 0 in a hidden Reading view.
- **Does `pinReadingViewsOf()` pin the hidden Reading view? No.**
  - In the code, it skips any leaf whose `view.getMode?.() !== 'preview'` (`previewScrollPin.ts:438`).
  - Measured: `data-dse-scroll-pin` was only ever set on visible Reading scrollers (`L1:RD`, `L2:RD`, `L4:RD`), never on an `RDHIDDEN` element, in any run.
  - The SC-522 and SC-478 holds were only ever on visible LP elements.
- **Why SC-472 r1 saw `mh3rd` / `mnt3rdE`:**
  - G-S52's `openHost` runs `t.open(host)`, which uses mode `'preview'`, then switches the leaf to LP after 1.5 s. Each of the 6 phases does this.
  - That is a visible Reading render of the embed, measured here as `done L1:RDE` x6 per G-S52 run.
  - SC-472's summariser attributed every event up to the next `mod` (or +12 s) to the previous write. Those renders were the next phase's setup.
  - For example, the `mod lpembtwo @180642` window begins with `st 3rd 0->3288` (Obsidian restoring the Reading scroll), then `mnt3rdE@2027`.
- **Version check:** 1.14.4 and 1.13.7 have the same gate: `var n=this.previewEl;if(!!n.offsetParent&&n.offsetWidth>0){…}` (excerpt 10). This was read in the code, not run.

## Q2. Cost
Ms after the write starts (`vault.process` called in-page):
- `done` is the visible LP block's `pipeline.run` settling.
- `paint` is the first task after the next animation frame after that.
- "hidden" is the timed Obsidian work in hidden views. The DSE hidden share is 0 ms in every row, because no run happened.

| Shape | Throttle | Run (load) | write -> LP done | write -> LP paint | hidden, Obsidian | hidden share of paint |
|---|---|---|---|---|---|---|
| G-S52 (p1) | 1x | mech-1 (1.1-1.6) | 198 / 255 / 279 | 354 / 493 / 522 | 0.1 / 0.1 / 0.3 ms | ≤0.08% |
| G-S52 (p1) | 1x | instr-2 (3.1-4.6) | 430 / 509 / 449 | 690 / 800 / 710 | 0.2 / 0.1 / 0.0 ms | ≤0.03% |
| G-S52 (p1) | 8x | thr8-instr (1.0-1.9) | 4058 / 4286 / 4384 | 6330 / 6381 / 6661 | 2.4 / 1.6 / 2.2 ms | ≤0.04% |
| G-S52 (p1) | 8x | thr8-instr-2 (1.7-9.7) | 4088 / 4584 / 4891 | 6602 / 7769 / 7280 | 2.3 / 1.6 / 1.2 ms | ≤0.04% |
| LP sibling (p6) | 1x | mech-1 | 286 / 264 / 275 | 1103 / 985 / 937 | 0 | 0 |
| LP sibling (p6) | 1x | instr-2 | 569 / 892 / 867 | 1450 / 2193 / 2508 | 0 | 0 |
| LP sibling (p6) | 8x | thr8-instr | 4849 / 5302 / 5127 | 12050 / 12422 / 16747 | 0 | 0 |
| LP sibling (p6) | 8x | thr8-instr-2 | 4865 / 22591 / 14525 | 12242 / 29710 / 23049 | 0 | 0 |

**What the latency is instead:**
- **The visible tracker's own mount:** `pipeline.run` takes 183-298 ms unthrottled in p1, and up to 558 ms while a second pane renders (p4) (`runsDone`).
- **Other visible panes:**
  - In p6, Reading pane A's DSE render (215-350 ms) runs after the LP block is done and before its paint. The paint comes 660-1640 ms after `done`.
  - In p4, the Reading pane of B renders first and delays the LP embed to 709-1077 ms.
- **CDP `TaskDuration` per write window:** 392-948 ms in p1 at 1x, and 7270-9307 ms at 8x. The hidden view is 0.3 ms or less of that at 1x.
- **At 8x the spread follows machine load.** In `thr8-instr-2`, p6's LP done went 4865 -> 22591 ms while the load rose 1.7 -> 9.7.

## Q3. The skip prototype
**Patch:** `sc548-r1-prototype-skip.patch`, +28 lines in `src/framework/registerFrameworkElements.ts` on top of the instr hook.
- `hiddenReadingViewOf(plugin, el, ctx)` finds `ctx.containerEl ?? el` -> `closest('.markdown-reading-view')`.
- The guard applies only when that Reading view is not shown (`offsetParent === null`) and is a markdown leaf's `previewMode.containerEl` whose `getMode()` is `'source'`.
- In that case the processor call draws nothing and returns. A `ResizeObserver` on the Reading view runs the normal fresh render once the view is shown.

**Results:**
- **Guard hits: 0.** None in the 24 Live Preview writes on skip (18 at 1x, 6 at 8x), and none in the 59 processor calls of G-S8, G-S52 and G-S59. The deferred-render path was never reached, because Obsidian never calls a post-processor for a hidden preview (Q1).
- **Latency delta: 0 by construction.**
  - Paired at similar load (`mech-skip-1` at 1.4-3.3 against `mech-instr-2` at 3.1-4.6): G-S52 shape done median 436 vs 449 ms, paint 725 vs 710 ms; LP sibling done 705 vs 867 ms, paint 1773 vs 2193 ms.
  - At 8x the skip run is slower (p1 done median 8009 ms against 4286 / 4584 ms), but it ran at load 4.2-5.4. The instr runs also ranged 4865-22591 ms on p6, so this is load, not the guard.
  - The guard's per-call cost is two `closest()` calls (on LP elements they return null on the first test). Not measured separately.

**Correctness probes.** The guard never fired, so stock and the prototype behave identically in every probe here. Each was run on both bundles, with the same states.
- **LP -> Reading after writes the hidden view did not show** (`P548-SWITCH`; per painted frame: roots, mounted, malice text, old tagged roots):
  - **Obsidian re-renders on the switch; it does not reuse a hidden render.** One DSE processor call comes 62-84 ms after `setViewState` for the embed, and 265-505 ms for a note's own block. The run takes 213-471 ms.
  - **Embed (p1):** the first painted frames (+51 to +71 ms) show no tracker. The fresh value appears at +513 to +987 ms.
  - **The note's own block (p3) and the LP sibling's B (p6):** the first painted frame (+258 to +484 ms) shows the old hidden root with the stale value ("Malice: 1", disk 12). The fresh card appears at +1141 to +1925 ms.
  - Obsidian shows the hidden DOM until its queued `onRender` parses and re-renders the changed section. This is stock and not caused by DSE. A skip or a defer cannot change it, because the processor runs after the switch either way.
- **Back to LP:** the LP embed shows the fresh value ("Malice: 30" = disk).
- **A write while in Reading:** 1 run in the visible Reading embed, with the SC-472 pin on and off on `L1:RD`. Unchanged on the prototype.
- **Export to PDF:** `printToPdfDesktop` renders a fresh copy into `div.print` in a hidden popup window, not the leaf's `previewMode`, so the guard cannot match it. Not exercised; the headless harness has no save dialog.
- **Hover popover:** a fresh embed inside `.hover-popover`, visible, not a `previewMode`, so the guard cannot match it. Not exercised. No other consumer of the hidden preview's DOM was found.
- **SC-472 pin, hold and backstop:** G-S8, G-S52 and G-S59 passed 3/3 on the prototype (`life-skip`, 0 failed), and 3/3 on instr (`life-instr`).
- **Where the guard would live, and collisions:**
  - It would go in the processor callback in `registerFrameworkElements.ts`, before claim and adoption.
  - It does not touch `ReadingModeBlockHost.ts`, so there is no textual collision with SC-547 (the LP twin check) or SC-552 (`replaceSource` twin saves). There is no logical one either: the guard never fires.

## Q4. Recommendation: close as not worth it
**Deciding numbers:**
- 0 DSE renders, pins or holds in hidden Reading views, across 72 Live Preview writes and 3 lifecycle scenarios.
- Obsidian's hidden-view cost: 0.5 ms or less per write at 1x and 7.4 ms or less at 8x.
- That is under 0.1% of a write-to-paint latency of 354-800 ms (1x) or 6330-29710 ms (8x).
- A skip has nothing to skip: it fired 0 times.

**Risks of shipping a skip or defer anyway:**
- It is dead code on Obsidian 1.13.7 to 1.15.0.
- Its defer path (a `ResizeObserver` render on show) cannot be reached by any test, because no real Obsidian path calls a processor for a hidden preview. A G-S66 would have no anti-vacuity.

**Risk of closing:** a future Obsidian could drop the `offsetParent` gate in `onRender`, and then hidden renders would start. The cost would show up in latency first. A lifecycle anti-regression check for that is not worth a scenario today.

No change sketch, no jest tests and no G-S66 are proposed. The dse-verify proposal file is not needed.

## Noticed, left alone
- **The SC-472 r1 report's last follow-up** ("A Live Preview leaf keeps a hidden Reading view that also re-renders embeds", the `mh3rd` events) is wrong as worded; see Q1. It is a doc correction only.
- **The stale or blank frame on an LP -> Reading switch after outside writes:** 0.45-1.45 s, on stock. It is Obsidian's renderer behavior, not DSE's. It could be a separate low-priority ticket if Scott sees it; this round cannot tell whether DSE could do anything about it.
- **G-S59 has 2 DSE runs that finished inside a hidden Live Preview editor** of a leaf in Reading mode (`done L1:LPHIDDEN-noshow` x2, the same on instr and skip). This is the reverse direction. Most likely a render started just before a mode switch. Not investigated.
- **After a leaf switches from the host to another note, the host's old embed component still receives `metadataCache 'changed'`** and runs `loadContents` (0-0.3 ms, an early return). This is Obsidian-internal.

## Evidence
All files are in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc548-lp-hidden-reading-redraw/`.
- **Report:** `sc548-r1-measure-report.md` (this file).
- **Raw run logs:** `sc548-r1-mech-1.log`, `sc548-r1-mech-thr8-instr.log`, `sc548-r1-mech-skip-1.log`, `sc548-r1-mech-instr-2.log`, `sc548-r1-mech-thr8-skip.log`, `sc548-r1-mech-thr8-instr-2.log`, `sc548-r1-life-instr.log`, `sc548-r1-life-skip.log`. Each contains `P548-W`, `P548-SWITCH`, `P548-RAW`, `P548-GLOBAL`, `P548-LOAD`, the lifecycle verdicts, rc and `porcelain-after`.
- **Summaries:**
  - per-write summaries: `sc548-r1-*.summ.txt` (one per mech run);
  - the per-phase table: `sc548-r1-table.txt`;
  - the Obsidian code excerpts: `sc548-r1-obsidian-excerpts.txt`.
- **Patches:** `sc548-r1-instr.patch` (the measurement hook) and `sc548-r1-prototype-skip.patch` (the prototype guard).
- **Bundle build records:** `sc548-r1-bundles-summary.log` and `sc548-r1-skip-tsc.log`.
- **Tooling:**
  - `sc548-r1-mkbundle.sh`, `sc548-r1-run.sh`;
  - `sc548-r1-probe-block.mjs.txt` (the P548-MECH scenario, recorder and switch probe);
  - `sc548-r1-mkharness.cjs.txt`, `sc548-r1-patch-instr.py.txt`, `sc548-r1-patch-skip.py.txt`;
  - `sc548-r1-summ.py.txt`, `sc548-r1-table.py.txt`, `sc548-r1-excerpts.py.txt`, `sc548-r1-asarget.cjs.txt`.
