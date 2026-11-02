# SC-533 r1: border-width read, measured with the profiler off

## Executive summary
- **Verdict: REAL.** The brief's rule passes in R, LP and ELP. E passes in every paired visit, but fails the pooled rule: host load spikes (1-minute load up to 11) widened stock's IQR to 626 ms.
- **Median draw time, stock vs stub** (to the end of the first frame (`tPost`); the time at the first rAF (`tRaf`) is within 1-7 ms of it):
  - **R** 834 vs 501 ms (−333 ms, −40 %)
  - **LP** 933 vs 554 ms (−379 ms, −41 %)
  - **E** 973 vs 596 ms (−377 ms, −39 %)
  - **ELP** 873 vs 531 ms (−342 ms, −39 %)
- **Per draw, in every scene:** 1 `mountChrome` call and 2 `usedBorderPx` calls (Top, then Right). Both calls are expensive: Top's median is 189-205 ms, Right's is 176-191 ms, and the in-call total is 365-398 ms.
- **This is the thrash signature, not the "frame's recalc paid early" one.** Right / Top = 0.92-0.94. The `setProperty` of an inherited custom property on the anchor, made between the two reads, makes the whole tracker subtree's style dirty again. Stock pays about 2 extra full recalcs per draw. The stub saves about the summed in-call time.
- **`batched`** (both reads, then both writes) saves only about half: 160-196 ms vs stock. It leaves 159-220 ms above stub.
- **Untested idea for the owner:** the only consumer of the vars is `.dse-chrome` (`styles-source.css:16735-16737`). Writing them on the panel element instead of the anchor should limit what each write makes dirty to the small panel subtree.

## Environment
- dse: `origin/develop` = HEAD = `4deb8cfd725cd372c5dd1ba361617c12b06ba5dd` (fetched; it had not moved, so no rebase). The worktree was not edited. `git -C <dse> status --porcelain` was empty before, after every session, and at the end; HEAD is still `4deb8cf`.
- The bundles were built from a `git archive 4deb8cf` export in my scratch dir (with its own `npm ci`), using `node esbuild.config.mjs production`. The scratch copy of `mountChrome.ts` was swapped for each variant and put back afterwards.
- Every `main.js` gets the same one-statement suffix, `;globalThis.__sc533variant="<v>";`, so the in-session swap can be checked.
  - `main.js` sha256: stock `6ae2ec3d136b…`, instr `02c7389be70b…`, stub `7e329e03382c…`, batched `1021f09b746a…`.
  - `styles.css` is `ae45354b6369…` in all four (the same CSS SC-522 used).
- Obsidian 1.15.0 (every session's start line confirms it), under the harness's own Xvfb (`:160`-`:163`, never `:1`), on CDP port 9537. No Profiler or Tracing domain was enabled. The harness only uses `Runtime.evaluate`, plus one `Page.captureScreenshot` on the failed sessions.
- The harness is a scratch copy of the 4deb8cf `obsidian-lifecycle.mjs` with one scenario injected (`P533`), run with `--only=P533`. It uses the lifecycle fixtures `Lifecycle/embtracker.md` (25 heroes) and `Lifecycle/embhost.md`.

## Method
- **A draw:** `app.vault.process(embtracker.md)` bumps `malice: value` by 1. That is one value; the size is unchanged.
- **Timing, all done in the page (`performance.now()`):**
  - `t0` is taken just before the `process` call.
  - A MutationObserver on the visible mode's container (`.markdown-reading-view` or `.markdown-source-view`) records `tFound`: the first time a connected `[data-dse-element="initiative"]` root that was not there before has children.
  - `tRaf` is the first rAF after that. This is the brief's `T_total`.
  - `tPost` is a MessageChannel message posted from inside that rAF. It runs after that frame's rendering.
  - `tRaf2` is the second rAF.
  - After that, a 1500 ms settle, so that late mounts and calls are still counted.
- **Scenes:**
  - R: `embtracker` in Reading view.
  - LP: the same note in Live Preview, cursor on line 0.
  - E: `embhost` in Reading view, which embeds `embtracker`.
  - ELP: `embhost` in Live Preview.
- **Interleaving inside one Obsidian session:**
  - Each round visits all 4 variants. Round r starts at variant (r + offset) mod 4, so the order rotates.
  - A visit is: park the leaf on `other.md` (Reading view), disable the plugin, copy the variant bundle, enable the plugin, wait for the variant marker, open the scene fresh, then 1 warm-up draw and 3 timed draws.
  - Each session runs 2 rounds; sessions a and b use offsets 0 and 2. This gives 12 timed draws per variant per scene (24 for E, which had two extra sessions, c and d, with offsets 1 and 3).
  - Warm-ups are kept in the CSV and left out of the stats.
- **`instr`:**
  - Wraps `usedBorderPx` with `performance.now()` and records `[t, dt, side, el.isConnected, value, el]`.
  - Records each `mountChrome` call as `[t, data-dse-element, root.isConnected, root]`.
  - It reads no style or layout: `isConnected` and `getAttribute` do not force a style or layout pass.
  - Its `T_total` is close to stock in every scene: the `tPost` median minus stock's is +6 (R), −18 (LP), −45 (E) and −14 (ELP) ms. The instrumentation adds no measurable cost.
- **`stub`:** `usedBorderPx` returns 0 without reading. Both `setProperty` writes still happen, with `0px`.
- **`batched`:** reads Top and Right, then sets both.
- **Verdict rule (from the brief):** REAL if (stock median − stub median) > max(IQR_stock, IQR_stub), AND the difference is ≥ 50 ms or ≥ 10 %. It is applied to both `tRaf` and `tPost`, and the result is the same for both.

## Results (timed draws only; ms from t0)

### `T_total`: `tRaf` / `tPost`

**R** (n = 12 per variant)

| variant | med | p90 | IQR |
|---|---|---|---|
| stock | 827 / 834 | 860 / 865 | 47 / 47 |
| instr | 835 / 840 | 912 / 918 | 55 / 55 |
| stub | 496 / 501 | 523 / 528 | 33 / 33 |
| batched | 654 / 660 | 751 / 757 | 70 / 71 |

**LP** (n = 12 per variant)

| variant | med | p90 | IQR |
|---|---|---|---|
| stock | 926 / 933 | 1220 / 1230 | 196 / 205 |
| instr | 908 / 915 | 975 / 992 | 106 / 110 |
| stub | 547 / 554 | 671 / 677 | 93 / 93 |
| batched | 763 / 773 | 857 / 874 | 132 / 136 |

**E** (n = 24 per variant)

| variant | med | p90 | IQR |
|---|---|---|---|
| stock | 967 / 973 | 1690 / 1701 | 624 / 626 |
| instr | 916 / 928 | 1546 / 1556 | 116 / 114 |
| stub | 591 / 596 | 1018 / 1027 | 195 / 196 |
| batched | 772 / 777 | 1234 / 1266 | 399 / 403 |

**ELP** (n = 12 per variant)

| variant | med | p90 | IQR |
|---|---|---|---|
| stock | 866 / 873 | 893 / 898 | 38 / 38 |
| instr | 850 / 859 | 899 / 905 | 40 / 42 |
| stub | 526 / 531 | 554 / 562 | 36 / 35 |
| batched | 701 / 707 | 740 / 745 | 46 / 51 |

### Verdict per scene (`tPost`)

| scene | stock − stub | % | max IQR | rule | paired visits (stock visit med − stub visit med, same session and round) |
|---|---|---|---|---|---|
| R | 333 | 39.9 | 47 | **REAL** | n=4, med 342, min 312, max 354 |
| LP | 379 | 40.7 | 205 | **REAL** | n=4, med 346, min 235, max 694 |
| E | 377 | 38.8 | 626 | **NOT REAL by the pooled rule** | n=8, med 368, min 228, max 1121 (every visit stock > stub) |
| ELP | 342 | 39.2 | 38 | **REAL** | n=4, med 349, min 323, max 361 |

Why E fails the pooled rule: the spread comes from load drift between sessions, not from scatter within a session.
- In a-E, the 1-minute load went from 2.4 to 11.1 during the session. In c-E, stock drew in a 4.2-4.3 load window.
- Within a session, b-E and d-E pass the rule on their own: stock 852 vs stub 544 (IQR 63/136), and 944 vs 568 (IQR 49/19).
- The details per session are in `sc533-r1-raw-draws.csv` (column `load` = `/proc/loadavg` at each visit).

### `instr`: calls per draw and time per call

| scene | mountChrome / draw | usedBorderPx / draw | Top med (p90) | Right med (p90) | in-call sum med (p90) | Right/Top med |
|---|---|---|---|---|---|---|
| R | 1 (every draw) | 2 (every draw) | 193.0 (204.0) | 177.7 (192.5) | 369.1 (396.3) | 0.930 |
| LP | 1 | 2 | 204.7 (227.9) | 188.9 (222.2) | 398.4 (449.9) | 0.942 |
| E | 1 | 2 | 203.7 (355.0) | 190.6 (310.3) | 390.6 (671.3) | 0.920 |
| ELP | 1 | 2 | 189.3 (205.9) | 175.7 (182.7) | 364.6 (390.3) | 0.926 |

- **Every call:**
  - The anchor is connected (`conn = 1`) and inside the new root.
  - The value read is `1` px.
  - The single mount is the top-level `initiative` root, 33-53 ms after `t0` (median).
- **The signature is "every call is expensive" (thrash):**
  - The second read costs 92-94 % of the first.
  - stock − stub (333-379 ms) ≈ the in-call sum (365-398 ms). So both forced recalcs are pure extra: neither one is a recalc the frame would have paid anyway.
  - In stub, the work after the rAF is only `tPost` − `tRaf` ≈ 5 ms, so the one recalc that remains is paid inside the draw task anyway, by someone else's later read.
- **`batched`:** stock − batched = 174 (R), 160 (LP), 196 (E), 167 (ELP) ms, which is about one call's cost. batched − stub = 159 / 220 / 181 / 175 ms, which is the one forced recalc that remains.
- **Inference (not traced):**
  - The write `anchor.style.setProperty('--dse-chrome-frame-border-*')` changes an inherited custom property on the tracker frame, so the frame's whole subtree needs its style recomputed.
  - The interleaved read pays for that at once. The second write makes the subtree dirty again for the next reader.
  - The profiled "450-520 ms, one forced recalc" in SC-522 matches these numbers: profiler-off it is two recalcs of about 180-200 ms each, about 370-400 ms per tracker draw.

### Warm-ups (first draw after each swap and fresh open; left out of the stats above)
These are in the CSV with `warmup=1`. They are in the same range as the timed draws: the warm-up `tPost` median minus the timed median is between −83 and +79 ms across all variants and scenes, and in ELP it is within ±11 ms. There is no consistent first-draw penalty (`sc533-r1-stats.json` → `warmup_tPost`).

## Sessions and load (`uptime` 1/5/15-minute averages, start → end)

| session | load start → end | rc | notes |
|---|---|---|---|
| smoke-R | 3.52 → 2.74 | 0 | 1 round, stock/instr/stub × 2 reps; in the raw JSON, not in the stats |
| a-R | 1.69 → 1.07 | 0 | |
| b-R | 0.99 → 0.97 | 0 | |
| a-LP | 0.89 → 2.93 | 1 | **aborted**: `enablePlugin` hung on the round-1 swap (see below) |
| a2-LP | 4.10 → 18.51 | 1 | **aborted**, same hang |
| a3-LP | 12.88 → 7.69 | 1 | **aborted**, same hang (diagnosis: `en: pending`, plugin loaded, marker set, no modal) |
| a4-LP | 6.24 → 4.28 | 0 | first run with the park-on-`other.md`-before-swap step |
| b-LP | 4.59 → 2.38 | 0 | |
| a-E | 2.43 → 10.64 | 0 | a load spike from another agent during the session |
| b-E | 11.07 → 3.25 | 0 | |
| c-E | 1.34 → 4.14 | 0 | an extra E session, because a-E was noisy |
| d-E | 4.05 → 4.70 | 0 | an extra E session |
| a-ELP | 3.07 → 1.36 | 0 | |
| b-ELP | 1.36 → 0.96 | 0 | |

- **Aborted LP rows:** 36 rows, warm-ups included. They come from the console logs and are in the CSV with `status=aborted`.
- **Effect on the verdict:** with them included, LP stock − stub is 338 ms (n = 21 vs 18) instead of 379 ms, and LP stays REAL. They do not change any other scene.
- **Probe versions:**
  - The measurement eval (`P533_DRAW`) is the same in every session.
  - The park-before-swap step was added from a4-LP on. R had no swap hang without it.
  - The incremental `.partial.json` dump was added from b-LP on.

## Side finding (not SC-533; for the owner to judge)
- **What happened:** in Live Preview, `app.plugins.disablePlugin` + `enablePlugin('draw-steel-elements')` was run while the leaf showed the 25-hero tracker. `enablePlugin`'s promise did not settle within 20 s: the plugin was loaded and its marker was set, but the promise stayed `en: pending`. Then a later, synchronous `Runtime.evaluate` timed out after 30 s.
- **How often:** 3 of 3 sessions that swapped while the LP editor was showing the tracker, on the 2nd or 5th swap. It never happened when the leaf was first parked on a plain Reading view note, and never in R.
- **Evidence:** screenshot `sc533-r1-shot-a3-LP-enable-hang.png`.
- **Not diagnosed:** this could be a renderer stall when the plugin re-enables under Live Preview, such as a CodeMirror reconfigure that redraws the widget in a loop.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`)
- **Report:** `sc533-r1-measure-report.md` (this file).
- **Raw data:**
  - `sc533-r1-raw-draws.csv`: every draw, including warm-ups, aborted-session rows and per-call times.
  - `sc533-r1-raw-sessions.json`: the complete per-session JSON, with per-mount and per-call detail.
  - `sc533-r1-stats.json`: the aggregates, the verdict calculations and the paired differences.
- **Variant patches** (stock = 4deb8cf unmodified): `sc533-r1-variant-instr.patch`, `sc533-r1-variant-stub.patch`, `sc533-r1-variant-batched.patch`.
- **Scripts** (`.txt`): `sc533-r1-run.sh.txt` (runner), `sc533-r1-probe-p533.mjs.txt` (the injected scenario), `sc533-r1-mkharness.cjs.txt`, `sc533-r1-mkvariants.py.txt`, `sc533-r1-build.sh.txt`, `sc533-r1-setup.sh.txt`, `sc533-r1-analyze.py.txt`.
- **Logs:** `sc533-r1-run-<session>.log`, and `sc533-r1-run-<a|a2|a3>-LP-aborted.log` for the aborted sessions.
- **Screenshot:** `sc533-r1-shot-a3-LP-enable-hang.png`.
- **Scratch dir** (bundles, harness copies, src export): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r1-6813ca20/`.
- **Left behind:** the harness kept 3 temp dirs because they hold FAIL screenshots: `/tmp/dse-obsidian-lifecycle-3xv1xN`, `/tmp/dse-obsidian-lifecycle-L11ejy`, `/tmp/dse-obsidian-lifecycle-hxXak2`. They belong to this round's aborted LP sessions. They were not deleted, per the brief's no-delete rule.
