# SC-557 proposal for `.claude/skills/dse-verify/SKILL.md` (not applied; owner decides)

Updated in r5 (harness head `d689b719` on dse `31d8f779`).

## 1. Row 4, G-S61 clause: replace the recorder sentence

Current text (end of the "Per phase: ..." sentence):

> ... and in Live Preview a per-frame recorder (a card with a pending edit on a block other than the one it was clicked on in ANY frame, or a card that does not match its block for 3 frames in a row, fails; one frame of the second kind is the editor's document catching up).

Proposed:

> ... and in Live Preview a per-frame recorder. It fails a phase for (1) a card with a pending edit on a block other than the one it was clicked on, in ANY frame; (2) 3 counted frames in a row in which a card with nothing pending does not match its block in the editor's document (`cm.state.doc`); (3) a card that is AHEAD of the document for more than `CATCH_UP_CAP_MS` (1000 ms) of wall time; (4) any frame in which the recorder's own disk read threw, or a disk read that was torn in 3 frames in a row (green: at most 2; the stale-frame check would be off). SC-557: the recorder reads the note from disk synchronously every frame. A stale card that shows the block's DISK value while the document has not taken it yet is "catching up" (under load the redrawn card is up to 6 frames / 117 ms ahead of the document). Catching-up frames are not counted for (2) and neither add to the run nor end it (only a frame with no wrong card ends it). A card that differs while the document already holds the disk value, or that matches neither, is counted as before. A TORN disk read (the file holds fewer values than the document: Obsidian opens the file and writes it only when the main thread gets to it, so a read can land between the two; reading again in the same frame does not help) extends a counted run that is already going and is otherwise judged catching up (bounded by the cap). The ok line carries per phase `[catching up: longest N frame(s) / M ms, document behind the disk up to K ms after the write; stale cards: catching up A, on a torn disk read U, document had the disk value B, neither C; disk reads: torn in T frame(s) (longest run L), failed in E; counted: <samples>]`; a failure message lists the counted frames first.

Also replace "one frame of it is the editor's document catching up" wherever it appears (the harness header comment of G-S61 already says it in the new words).

## 2. Controls: numbers that changed on dse `31d8f779` (SC-552's position pins)

The red bundle and the controls were measured on both `09ece2eb` and `31d8f779` (the clause's sets hold on `09ece2eb`; after SC-552 the pins place the Reading view writes right without the flush, so some phases are failed by the recorder only). The same sets before and after SC-557 on each base, and with the unmodified `31d8f779` harness on `31d8f779`.

| bundle | on `09ece2eb` | on `31d8f779` (r2 reviewer, SC-544's exact M4 patch) |
|---|---|---|
| red `f7c9c7ce` (main.js 730f051c...) | (a)-(i): (a)-(f) disk + pending, (g)-(i) disk | same |
| no flush call | (a)-(i): (a)-(f) disk + pending, (g)-(i) disk | (a)-(f) only, by pending (b also disk) |
| flush after `await Vault.process` | (a)-(f), pending only | same |
| flush for the view's own write only (`fromView`) | (e): disk + pending | (e): pending only |
| flush of Live Preview callout views only (M4) | (f)-(i): (f) disk + pending, (g)-(i) disk (SC-544 r3's bundle; r1's `livePreviewCalloutWidget()` variant reproduced it) | (f): pending only (main.js `50dccc0a`; r1's variant `2d48e886` the same set) |

SC-544's exact M4 (sibling-based, one line): in `src/framework/host/viewRegistry.ts`, `ViewRegistry.flushPendingWrites`, directly after `if (entry === except || entry.released || entry.host.sourcePath !== sourcePath) continue;` insert `if (!entry.root.closest('.cm-callout')) continue; // MUTANT M4: only Live Preview callout views`. The writer always flushes; only siblings whose root sits in a `.cm-callout` are flushed. (A writer-based test, `this.livePreviewCalloutWidget()` at the call in `replaceSource`, is a different control: it fails (f)-(h) and PASSES (i).)

Suggested wording: keep "(a)-(i)" for the red bundle and "(a)-(f) through the recorder" for after-await; say that on `31d8f779` "no flush", "fromView" and "callout-only" fail (a)-(f), (e) and (f) respectively, all through the recorder (SC-552's pins already correct the disk). Nothing but red fails (g)-(i) any more.

## 3. Standing probe controls for the stale-frame check and the cap

None of the red bundle or the four SC-544 controls fails through the stale-frame check or the cap (stale frames are 0 in those runs). The checks SC-557 changes are exercised by four probes. They come from a scratch copy of the harness made by the probe patch, which injects faults into the OBSERVED system, never into the recorder's judgement.

- **Patch:** `sc557-r5-tool-probe-patch.py`, in `docs/superpowers/dse-overhaul/build-ledgers/sc557-gs61-stale-frame-flake/` (the ledger dir `.superpowers/sdd/sc557-gs61-stale-frame-flake/` until it is copied there at landing). It is the r2 reviewer's patch, re-anchored for the r3 recorder, with `SC557_BADREAD=torn` added in r5. Env: `SC557_DOC_DELAY_MS=D` holds every editor document change back D ms (the document lags the disk); `SC557_INJ=b:v:ms` makes block b's card show v for ms ms from the first write; `SC557_BADREAD=1` makes every disk read of the recorder fail; `SC557_BADREAD=torn` drops the last value from every read (a persistently torn read).
- **Where to run it:** the probe harness imports `../scripts/*.mjs`, so it must sit in `visual-harness/` of a tree. Writing it into the working tree dirties it; use a copy: `git archive HEAD | tar -x -C <scratch>` (plus `ln -s <plugin>/node_modules <scratch>/node_modules`), run the patch there (`python3 -I <patch> <scratch>/visual-harness/obsidian-lifecycle.mjs <scratch>/visual-harness/obsidian-lifecycle-probe.mjs`), and run it from the copy. In the working tree it is acceptable if you delete the file by its literal path afterwards.
- **Bundle:** `DSE_LIFECYCLE_BUNDLE=<dir with main.js, styles.css, manifest.json>` is the plugin under test. Left unset, the harness loads `main.js` / `styles.css` from the tree it runs from and does NOT build them (`npm run obsidian-lifecycle` builds first; running the harness file directly does not, and a `git archive` copy has no `main.js`), so run `node esbuild.config.mjs production` in that tree first. For a build of a given commit: `git archive <rev> | tar -x -C <dir>`, `ln -s <plugin>/node_modules <dir>/node_modules`, `node esbuild.config.mjs production` in `<dir>`, and pass `<dir>`.
- **Command** (like every lifecycle run, through devbox; each probe takes about 100 s):
```
devbox run -c <plugin> -- bash -c 'cd <scratch> && DSE_LIFECYCLE_BUNDLE=<bundle dir> SC557_DOC_DELAY_MS=1500 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 > <log> 2>&1'       # X2
devbox run -c <plugin> -- bash -c 'cd <scratch> && DSE_LIFECYCLE_BUNDLE=<bundle dir> SC557_INJ=2:7:400 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 > <log> 2>&1'               # X5
devbox run -c <plugin> -- bash -c 'cd <scratch> && DSE_LIFECYCLE_BUNDLE=<bundle dir> SC557_BADREAD=1 SC557_INJ=2:7:400 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 > <log> 2>&1'   # X6
devbox run -c <plugin> -- bash -c 'cd <scratch> && DSE_LIFECYCLE_BUNDLE=<bundle dir> SC557_BADREAD=torn SC557_INJ=2:7:400 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 > <log> 2>&1'  # T
```
Read the exit code from a script file, not from the `bash -c` line (devbox eats `$?`); the log's `OBSIDIAN-LIFECYCLE G-S61 FAIL: ...` line and the phase ids in it are the result. Delete the probe file when done; it is never committed.

Measured on the r5 head (green `31d8f779` bundle, main.js `8e969de2`; X2 and X6 on `41c03e60`, which has the same cap and read-failure code):

| probe | what it does | G-S61 result |
|---|---|---|
| X2 | document held back 1500 ms | FAIL in all 9 recorded LP phases, by the cap: 90-91 frames / 1500-1517 ms |
| X5 | the card of block 2 shows 7 for 400 ms while the document and disk hold block 2's own value (5; 6 in (c) and (j1)) | FAIL in 8 LP phases (a)-(f), (i), (j1), by the counted-stale check: 8-25 frames in a row |
| X6 | X5 and every disk read fails | FAIL in the same 8 phases plus (j3), by "could not read the note from disk" (147-178 failed frames); before r3 it PASSED (the check was silently off) |
| T | X5 and every disk read is torn (last value dropped) | FAIL in all 9 recorded phases, by "the recorder's disk read was torn in N frames in a row" (123-176 frames in a row); before r5 it PASSED |

(X1, document held back 600 ms, is meant to PASS: 36 frames / 600 ms catching up, 0 counted.)

## 4. Draft CURRENT block line (dse `develop` on top of `31d8f779`, SC-557)

> **CURRENT — dse `develop` @ `<sha>` (2026-11-03; SC-557 landed: G-S61's stale-frame check is load-aware)** tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6459 passed / 2 skipped / 256 of 257 suites** on a fresh worktree (6460 / 1 once a shots run has cached `visual-harness/dist/obsidian-app.css`) · lifecycle **51/51** (five `--only` parts 21 + 16 + 9 + 4 + 1; G-S61 alone about 100 s) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · G-S61 alone on the green build under 12 busy loops (12 cores): before SC-557 (e) failed in 3 of 8 runs (loadavg 4.8-27: 3 stale frames in a row, the document 46 ms behind the disk); after it, 0 FAIL in 26+ loaded runs: 10 on the pre-rebase base at loadavg 7-26 (max catching-up run 6 frames / 117 ms), 10 on `31d8f779` at 0.8-13.9 (4 frames / 83 ms, 71 ms behind), 6 by the r2 reviewer at 0.5-18.2 (4 frames / 67 ms), 3 more on the r3 head at 5.7-13.3 (3 frames / 67 ms), 2 on the r5 head at 0.5-12.5 (5 frames / 100 ms, at most 1 torn frame in a row); 0 counted stale frames in all of them. Harness-only change: `main.js` sha256 `8e969de2...`, `styles.css` `93be34af...` byte-identical to a `31d8f779` build, so shots / freeze / parity carry.
