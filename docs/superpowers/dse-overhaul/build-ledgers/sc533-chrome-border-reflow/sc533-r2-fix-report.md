# SC-533 r2: fix + measurement

## Executive summary
- **Verdict: MISS. STATUS: NEEDS_CONTEXT** (the brief says return before choosing when the fix misses the bar). A `deferred` scratch variant PASSES in both scenes.
- Branch `sc533-chrome-border-reflow`, dse commit `a94995e` (on `4deb8cf`; `origin/develop` had not moved, no rebase). Not pushed. `deferred` is NOT committed.
- tPost median (ms), n = 24 timed draws per variant per scene, Obsidian 1.15.0, profiler off:
  - **R**: stock 846.3, fix 703.2, stub 514.8, deferred 491.4. fix - stub = +188.4 (bar max(50, 10 %) = 51.5). deferred - stub = -23.4.
  - **LP**: stock 915.4, fix 750.5, stub 508.4, deferred 544.3. fix - stub = +242.1 (bar 50.8). deferred - stub = +35.9.
- Why fix misses: the one remaining read still costs ~189 ms (Top 188.6 / 190.6 ms median in R / LP); the second `usedBorderPx` call costs 0.0 ms. The fix removes the second recalc (stock - fix paired median 152.6 R / 133.0 LP) but not the first, which fires synchronously inside the mount, before the rest of the tracker's DOM work.
- Gates run so far on `a94995e`: tsc clean (incl. `-p e2e`), lint clean (incl. `e2e/`), jest 6153 passed / 2 skipped / 248 of 249 suites. Lifecycle, e2e, shots, freeze, parity NOT run (waiting on the owner's choice; the fix as committed is likely superseded).
- New test red on old code, green on new (both outputs saved).

## Pre-checks (brief section 2, item 2): both passed
- `--dse-chrome-frame-border-*` consumers: only `styles-source.css` lines 16735 and 16737, both in the `.dse-chrome` rule (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-chrome`). Other hits: comments (same CSS ~16713), `docs/superpowers/sc169-element-menu-panel-spec.md:168` (prose), `chromeRound2.test.ts` (assertions on the CSS text and the old anchor write). Nothing in `visual-harness/`, `e2e/`, `scripts/` or other `src/` files reads it.
- `.dse-chrome` panel creation: only `mountChrome.ts:186` in `src/` (other hits are test-built `dse-chrome` divs and `.closest('.dse-chrome')` lookups). Nothing rebuilds or replaces the panel after mount.

## What was committed (`a94995e`)
`/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements`: `src/framework/chrome/mountChrome.ts` (+16 -6) and `test/dom/framework/chromeRound2.test.ts` (+46 -6).
- Both `usedBorderPx(anchor, 'Top'|'Right')` values are read into a local `frameBorderPx` where the old loop was; the two `setProperty` calls go on `panelEl` right after its `aria-label` line. SC-520's anchor points (the line after the loop, the line after `aria-label`) are kept free of other changes; the panel `setProperty` loop sits right after the `aria-label` line, so expect a trivial textual conflict there.
- Comment above `FRAME_BORDER_VARS`: 4 lines added (SC-533).
- Test: the existing "republishes the anchor border widths" test now checks the panel (title gains `on the panel (SC-533)`); new test `SC-533: both border reads happen before the first var write, and the anchor carries no var` (spies `window.getComputedStyle` and `CSSStyleDeclaration.prototype.setProperty`, asserts 2 reads of the anchor, both before the first `--dse-chrome-frame-border-*` write, both writes land on the panel's style, anchor has neither var).
- Red on old code (`4deb8cf` mountChrome.ts, new tests): both tests FAIL (`Expected pattern: /^\d/ Received string: ""` for the panel check; `Expected: < 1  Received: 2` for the order check). Green on new: 2 passed. Logs: `sc533-r2-test-red-on-old.log`, `sc533-r2-test-green-on-new.log`.

## Method (same as r1)
- Harness: r1's P533 probe in a scratch copy of the lifecycle harness (`sc533-r2-probe-p533.mjs.txt`; only change from r1: output file names), `--only=P533`, own Xvfb (:161/:162 picked by the harness), CDP port 9541 (checked free before every session), Obsidian 1.15.0 (start line in every log), no Profiler/Tracing domain.
- Bundles built from a scratch export of 4deb8cf (r1's `src-4deb8cf` copied to the r2 scratch dir) with only `mountChrome.ts` swapped; the worktree was never used for bundles. `main.js` sha256 (with the one-statement variant suffix): stock `6ae2ec3d136b...` and stub `7e329e03382c...` (both identical to r1's), fix `c39fc5482231...`, deferred `630332b5982a...`, fixinstr `50d1dd4bce56...`. `styles.css` `ae45354b6369...` in all.
- Variants swapped inside one session with rotating order: 4 variants (stock, fix, stub, deferred), 4 rounds, 1 warm-up + 3 timed draws per visit, so 12 timed draws per variant per session; 2 sessions per scene (round offsets 0 and 2) = 24 per variant per scene. Before every swap the leaf is parked on `other.md` in Reading view (the SC-535 workaround); no hang occurred.
- Draw = `vault.process` bumping `malice: value`; `tRaf` = first rAF after the new initiative root has children; `tPost` = MessageChannel message posted from that rAF. Scenes R (Reading) and LP (Live Preview, cursor on line 0) on `Lifecycle/embtracker.md` (25 heroes). ELP not run.
- `stub` = r1's patch (read returns 0; writes still on the anchor). `deferred` (scratch only): both borders read inside one `requestAnimationFrame` queued after the panel is created, then the vars written on the panel. Patch: `sc533-r2-variant-deferred.patch` (diff against stock). `fixinstr` = fix + r1's `performance.now()` instrumentation of `usedBorderPx` (2 sessions of 3 rounds x 4 timed draws, run separately, R and LP).

## Results (timed draws only, ms from t0; n = 24 per cell)

### R
| variant | tRaf med / p90 / IQR | tPost med / p90 / IQR |
|---|---|---|
| stock | 841.7 / 1202.1 / 45.7 | 846.3 / 1210.1 / 48.8 |
| fix | 698.3 / 756.1 / 31.5 | 703.2 / 761.6 / 31.6 |
| stub | 509.4 / 956.7 / 47.7 | 514.8 / 966.1 / 47.6 |
| deferred | 484.3 / 567.5 / 79.0 | 491.4 / 577.4 / 80.6 |

### LP
| variant | tRaf med / p90 / IQR | tPost med / p90 / IQR |
|---|---|---|
| stock | 906.3 / 1681.8 / 315.5 | 915.4 / 1716.3 / 320.6 |
| fix | 740.2 / 1492.9 / 275.6 | 750.5 / 1509.4 / 284.8 |
| stub | 501.4 / 557.3 / 47.9 | 508.4 / 568.8 / 50.7 |
| deferred | 533.0 / 1008.5 / 187.2 | 544.3 / 1036.6 / 188.5 |

The p90s and the wide IQRs in some cells come from load spikes (LP session a ended at 1-minute load 11.6; it started the b session at 10.1). Stock's R p90 (1202) and stub's R p90 (957) are single slow visits in different sessions.

### Paired medians of `tPost` (per visit = one variant visit's 3 timed draws; n = 8 visits per pair per scene; list in visit order: a r0..r3, b r2,r3,r0,r1)
- R fix - stub: median **+187.2** (all: 199.0, 182.0, -397.4, 192.3, 224.0, 174.5, 181.2, 194.1; the -397.4 visit is a slow stub visit under a load spike)
- R stock - fix: median **+152.6** (146.2, 771.2, 115.0, 162.1, 111.2, 159.0, 196.2, 133.8)
- R stock - stub: median +340.2
- R deferred - stub: median **-20.8** (-17.6, -24.4, -149.2, -39.5, -24.0, 23.6, -7.6, -11.7)
- LP fix - stub: median **+252.0** (209.9, 916.9, 891.3, 1027.2, 264.0, 198.8, 240.0, 179.4)
- LP stock - fix: median **+133.0** (128.8, 288.6, 344.4, -481.0, 135.2, 118.2, 162.5, 130.8)
- LP stock - stub: median +400.9
- LP deferred - stub: median **+10.5** (528.1, 503.5, -28.4, 106.1, -16.9, -21.2, 36.9, -15.8; the 528 / 503 / 106 visits are the load-spike visits of LP session a)

### Pass bar (fix median within max(50 ms, 10 % of stub) of stub)
| scene | bar | fix - stub (unpaired medians) | fix | deferred - stub | deferred |
|---|---|---|---|---|---|
| R | 51.5 | +188.4 | MISS | -23.4 | PASS |
| LP | 50.8 | +242.1 | MISS | +35.9 | PASS |

### The remaining read in `fix` (fixinstr, per call, ms)
| scene | calls per draw | mounts per draw | Top call med / p90 / IQR | Right call med / p90 / IQR | tPost med (instr) |
|---|---|---|---|---|---|
| R | 2 | 1 | 188.6 / 203.9 / 8.4 | 0.0 / 0.1 / 0.0 | 712.1 |
| LP | 2 | 1 | 190.6 / 205.1 / 10.2 | 0.0 / 0.1 / 0.1 | 698.1 |

Border value read (Top): `1` px in all instrumented draws. The first call pays the whole recalc; the second is free, because nothing wrote between them.

### Load (`/proc/loadavg`, 1/5/15 min, start -> end of each session)
- a-R 2.10 4.41 2.40 -> 2.71 4.28 2.80; b-R 2.69 4.22 2.80 -> 2.18 2.86 2.53
- a-LP 2.01 2.81 2.51 -> 11.59 7.63 4.52; b-LP 10.12 7.44 4.50 -> 2.27 4.67 4.03
- i-R 2.32 4.60 4.02 -> 2.06 4.18 3.91; i-LP 2.22 4.18 3.91 -> 1.40 3.68 3.75
- Smoke session (9 draws, not in the stats): R: stock ~820, fix ~700, stub ~520.

## Reading
- The fix as committed buys 133-153 ms (paired medians) per draw but leaves ~190-250 ms above stub. The early read is a style recalc of the freshly drawn tracker that happens synchronously in `mountChrome`, before the rest of the mount's DOM work, so later DOM changes dirty the tree again; the frame's own recalc is then paid on top.
- Reading in the next rAF lands the read at the start of the frame the browser has to style anyway, so the recalc is not extra; the write then dirties only the panel. Medians within -23 / +36 ms of stub.
- Risks of `deferred` not measured here (owner decision): (1) for one task the panel has no `--dse-chrome-frame-border-*` vars (CSS falls back to `0px`), so anything that measures the panel's position in the same task as the mount (jsdom tests, `assertChromePlacement`/shots harness, e2e placement checks) could see the 0 fallback unless it waits a frame; (2) the rAF callback needs the view to still be alive (a disconnected anchor yields 0, like the detached-node rule today); (3) a background tab throttles rAF, so a panel mounted while hidden gets its offset when the tab is shown. None of these were run through the gates.

## Gates run on `a94995e`
| gate | result |
|---|---|
| tsc (`npm run tsc`, incl. `tsc -p e2e`) | clean, rc 0 (`sc533-r2-gate-tsc.log`) |
| lint (`npm run lint`, incl. `e2e/`) | clean, rc 0 (`sc533-r2-gate-lint.log`) |
| jest (`main.js styles.css` removed first) | `Tests: 2 skipped, 6153 passed, 6155 total`; `Test Suites: 1 skipped, 248 passed, 248 of 249 total`; rc 0. Baseline for a fresh worktree is 6152 passed / 2 skipped, so the delta is **+1 passed** (one new test; the existing one was edited in place). (`sc533-r2-gate-jest.log`) |
| lifecycle, e2e, shots, freeze, parity | not run (see summary) |

## Artifacts (all absolute)
- Report dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/`
  - `sc533-r2-fix-report.md` (this file), `sc533-r2-raw-draws.csv` (286 rows: every draw, warm-ups flagged), `sc533-r2-stats.json`
  - scripts: `sc533-r2-run.sh.txt`, `sc533-r2-build.sh.txt`, `sc533-r2-mkvariants.py.txt`, `sc533-r2-analyze.py.txt`, `sc533-r2-probe-p533.mjs.txt`, `sc533-r2-mkharness.cjs.txt`
  - variant patches (vs stock): `sc533-r2-variant-fix.patch`, `sc533-r2-variant-stub.patch`, `sc533-r2-variant-fixinstr.patch`, `sc533-r2-variant-deferred.patch`
  - session logs: `sc533-r2-run-{a-R,b-R,a-LP,b-LP,i-R,i-LP}.log`; gate logs `sc533-r2-gate-{tsc,lint,jest}.log`; test logs `sc533-r2-test-{red-on-old,green-on-new}.log`
- Private scratch (bundles, vault, harness copies, smoke log): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r2-7dca00e8/`
- Worktree state: `git -C .../draw-steel-elements status --porcelain` empty after every session and at the end; HEAD `a94995e`. `node_modules` was installed in the worktree dse dir (`npm ci`, gitignored).

## Drive-by fixes
None.

## Follow-ups
- `docs/superpowers/sc169-element-menu-panel-spec.md:168` still says the framework republishes the border widths on the anchor; if `fix` or `deferred` lands, that sentence is stale (historical spec; owner decides).
- The `-397` / `+528` paired values are load-spike visits; the harness has no per-visit load gate (r1 follow-up already covers load spread).
