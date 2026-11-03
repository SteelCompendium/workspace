# SC-557 r1 implementer report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (concern: SC-552's source change on `31d8f779` makes three of the four SC-544 controls fail fewer phases than the dse-verify clause says; red is unaffected; see section 5).
- Branch `sc557-gs61-stale-frame-flake` head `f2f25f9f`, rebased onto dse `origin/develop` `31d8f779` (cut from `09ece2eb`; SC-552 landed meanwhile). 3 commits, `visual-harness/obsidian-lifecycle.mjs` only (+67/-15).
- Rule shipped: a stale card (nothing pending, value != its block in the editor document) that shows the block's DISK value while the document has not taken it is "catching up": not counted toward the 3-in-a-row run, bounded to 1000 ms of wall time (`CATCH_UP_CAP_MS`); every other stale frame counts as before; "pending on another block" unchanged.
- Measured (green, pre-fix recorder, 12 busy loops, loadavg to 27): every stale card in the failing runs was "doc behind disk, card == disk"; 0 with doc == disk; the flake reproduced in 3 of 8 loaded runs (phase (e), 3 stale frames in a row, 46 ms).
- Green after fix, rebased base: 10 runs under load (loadavg 0.8 -> 13.9 across the set) 0 FAIL, 3 quiet runs 0 FAIL; max catching-up run 4 frames / 83 ms (6 frames / 117 ms on the pre-rebase base), 0 counted stale frames. Cap 1000 ms = 8.5x the worst measured 117 ms.
- Red `f7c9c7ce` (main.js `730f051c...`) fails (a)-(i) (disk; (a)-(f) also pending) before and after. Controls on `09ece2eb` unchanged by the fix; on `31d8f779` identical before and after the fix (verified with the unmodified harness).
- Gates on `f2f25f9f`/`31d8f779`: tsc and lint clean; jest 6459 passed / 2 skipped / 256 of 257 (fresh worktree; expected 6460/1); lifecycle 51/51 (21+16+9+4+1); e2e 128/128 ok, 89/89 pairs; main.js `8e969de2...` and styles.css `93be34af...` byte-identical to a `31d8f779` build (shots/freeze/parity carry).
- Proposal: `sc557-dse-verify-proposal.md` (ledger dir). No SKILL.md edit. No tracker calls.

Ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/` (all logs below are copied there with the `sc557-r1-` prefix).

## 1. Step A: measurement (harness `09ece2eb` + instrumentation only, commit `a1449927`)

Instrumentation: every frame the recorder reads the note from disk synchronously (`fs.readFileSync` of the vault file, parsed like the document: `current_value: N` list) and classifies each stale card: `cu` (document value != disk value, card == disk), `dd` (document == disk, card differs), `x` (document != disk and card != disk). It records run lengths in frames and ms (rAF timestamps) and the ms since the file's mtime.

Load: 12 x `sh -c 'while :; do :; done'`, PIDs recorded in a file, stopped by literal PID only (see 7).

| phase | runs | loadavg (start of first -> end of last) | stale-frame max run | `cu` cards | `dd` | `x` | doc behind disk |
|---|---|---|---|---|---|---|---|
| green idle | 3 (`gs61-green-idle-rep1..3`) | 1.6-3.7 | 1 frame / 17 ms | 0+4+3 | 0 | 1 (torn read, see below) | <= 13 ms |
| green under load | 8 (`gs61-green-load-rep1..8`) | 4.8 -> 27.2 | 3 frames / 50 ms | 3,3,3,3,2,2,2,6 | 0 | 3 (torn reads) | <= 46 ms |

- Runs 2, 3 and 8 under load FAILED (e) with the old rule: `3 frame(s) (3 in a row) with a card that did not match its block (b1=6/doc5/disk6 +14ms | +26ms | +35ms)` (and `+22/27/45 ms`, `+23/25/46 ms`). That is the flake (the ticket's 4-frame sample was loadavg 2.14; here it needed load). Every counted-as-stale card in those runs was "doc behind disk, card == disk" (`cu`), never `dd`: the card is ahead of the editor document, as the SC-545 sample (`b1=6/doc5`) said.
- The `x` cards were all `disk undefined` 1-frame samples: the disk read landed inside Obsidian's write (the file momentarily holds fewer values than the document). The shipped recorder treats a read with fewer values than the document as "catching up" (kind `u`, bounded by the same cap).
- Preferred design fits the data: no stale frame with doc == disk on green, so no fallback to a frame/ms margin was needed.

Red/control attribution on the CURRENT recorder (`09ece2eb` harness+instrumentation; bundles: red = `git archive f7c9c7ce` + `esbuild.config.mjs production`; controls = `09ece2eb` src with one change in `ReadingModeBlockHost.ts`/`viewRegistry.ts`, scripts `sc557-r1-tool-s557-mut.py`):

| bundle | log | failing phases and checks |
|---|---|---|
| red `f7c9c7ce`, main.js `730f051cd1c0d6b2...` | `gs61-red-A-rep1` | (a)-(f) disk + pending; (g)-(i) disk |
| M1 no flush call, `d4f3e55b...` | `gs61-M1-A-rep1` | (a)-(f) disk + pending; (g)-(i) disk |
| M2 flush after `await Vault.process`, `17d3a1a3...` | `gs61-M2-A-rep1` | (a)-(f) pending only (disk right) |
| M3 flush only for `fromView`, `5f9f0940...` | `gs61-M3-A-rep1` | (e) disk + pending |
| M4 flush only for callouts: writer-based (`this.livePreviewCalloutWidget()` at the call), `ab2ff090...` | `gs61-M4-A-rep1` | (f) disk + pending, (g), (h) disk; (i) PASSES |
| M4b callouts, sibling-based (`flushPendingWrites` skips non-LP-callout siblings), `ed7f8f9b...` | `gs61-M4b-A-rep1` | (f) disk + pending; (g)-(i) disk = the clause's (f)-(i) |

The brief's "flush only for callouts" is ambiguous; the exact SC-544 patch is not in the reports. The writer-based reading passes (i) because in (i) the LP callout's debounce expires first and it is the writer. The sibling-based reading (M4b) reproduces the clause's (f)-(i), so that is the control I used for Step C. (No check other than disk and pending failed any phase; the stale-run check and the card-value check never failed a control phase.)

## 2. Step B: the fix (commits `bdc03bec`, `f2f25f9f` after rebase; originally `bc23a704`, `c3d14d26`)

Per frame, per stale card (nothing pending, value != the document's value for its block), against the disk read in the same frame:
- `cu`: document value != disk value and card == disk value: catching up.
- `u`: the disk read holds fewer values than the document (caught Obsidian mid-write): catching up (same bound).
- `dd` / `x`: counted.
A frame with any counted card adds to the run; a frame with only catching-up cards neither adds to nor ends it; a frame with no wrong card ends it. Run >= 3 fails (message now says "... and was not catching up"). A run of consecutive catching-up-only frames longer than `CATCH_UP_CAP_MS` = 1000 ms (rAF timestamps) fails with its own message: `the editor document did not catch up with the write within 1000 ms: a card showed the note's new value for N frame(s) / M ms ...`. Cap path verified by a temporary 5 ms cap (green idle run FAILed with that message; log `gs61-green-cap5-rep1`; the cap edit was reverted, not committed). "Pending on another block" is unchanged. Outcome lines keep the old counts (`stale S`, plus `counted`, `longest counted run`) and add `[catching up: longest N frame(s) / M ms, document behind the disk up to K ms after the write; stale cards: catching up A, document had the disk value B, neither C; odd samples]`. The recorder comment block and the G-S61 scenario header describe the rule; `.repo-docs/architecture.md` does not describe the 3-frame rule (only the SC-544 mechanism), so it is unchanged; the SC-544 header at the top of the file needs no change.

Cap choice: worst measured catching-up run 117 ms / 6 frames (document up to 117 ms behind the disk) over 16 loaded and 6+ quiet green runs; 1000 ms is ~8.5x that and still far below an editor that never catches up.

## 3. Step C: after the fix

Green G-S61 alone, rebased base `31d8f779` (bundle `bundle-green2`, main.js `8e969de2...`), `gs61-green2-rb-*` logs:
- Under load (12 loops started and stopped inside each call): 10 runs, 0 FAIL, loadavg per run start->end: 0.83->11.08, 11.08->12.83, 12.83->13.50, 13.50->13.25, 13.25->13.42, 12.47->13.20, 13.20->13.59, 13.59->13.86, 13.86->13.75, 13.75->12.95. Max catching-up run 4 frames / 83 ms (per-run maxima 1f/17, 3f/67, 4f/67, 3f/83, 4f/83, 2f/83, 4f/67, 3f/67, 3f/67, 3f/67 ms); doc behind disk <= 71 ms; counted stale frames 0 in every run; 3-8 stale frames per run all catching-up.
- Idle: 3 runs 0 FAIL (loadavg 0.7-1.1), max 1 frame / 17 ms, doc behind <= 3 ms.
Pre-rebase base `09ece2eb` (the same harness code; logs `gs61-green-postload-rep1..10`, `gs61-green-postidle-rep1..3`): 10 under load (loadavg 7 -> 26, to 25.9 at a run end) 0 FAIL, max catching-up 6 frames / 117 ms, doc behind <= 117 ms, 0 counted; 3 idle 0 FAIL, max 1f/17 ms (<= 16 ms).

Red/controls after the fix (same checks as Step A on `09ece2eb`: logs `gs61-red-C-rep1`, `gs61-M1-C`, `-M2-C`, `-M3-C`, `-M4b-C`): red (a)-(i) disk, (a)-(f) also pending; M1 (a)-(i); M2 (a)-(f) pending only; M3 (e) disk + pending; M4b (f)-(i). Identical to Step A.

On the rebased `31d8f779` (SC-552 landed) with the shipped harness (bundles `bundle-M1r..M4r` = `31d8f779` src + the same control patches; logs `gs61-red-rb-rep1`, `gs61-M1r-rb`, ... `M4r-rb`):

| bundle | failing phases | checks |
|---|---|---|
| red `f7c9c7ce` | (a)-(i) | (a)-(f) disk + pending, (g)-(i) disk |
| M1 no flush, `27f6a851...` | (a)-(f) | pending (b: also disk) |
| M2 after await, `74f81d6f...` | (a)-(f) | pending only |
| M3 fromView only, `94ee492f...` | (e) | pending only |
| M4 callouts (sibling-based), `2d48e886...` | (f) | pending only |

I re-ran M1r and M4r with the UNMODIFIED `31d8f779` harness (a temporary copy of `31d8f779:visual-harness/obsidian-lifecycle.mjs`, deleted): the same sets (`gs61-M1r-origbase-rep1`, `gs61-M4r-origbase-rep1`). So the shrunken control sets come from SC-552's source change (position pins placed at the first click: `notePersistIntent` -> `pendingPin`, which now puts the Reading-view/plain writes in the right block even without the flush), not from this change.

## 4. Gates (rebased head `f2f25f9f`; logs `sc557-r1-gate-*`; the un-suffixed lc1/lc2/jest/tsc/lint logs are the pre-rebase `09ece2eb` runs)
- tsc (incl. `-p e2e`): rc 0. lint (incl. `e2e/`): rc 0 (`gate-tsc2`, `gate-lint2`).
- jest (`gate-jest2`): Test Suites 1 skipped, 256 passed, 256 of 257; Tests 2 skipped, 6459 passed, 6461 total. Expected 6460 / 1; the fresh worktree reads one skip more until a shots run caches `visual-harness/dist/obsidian-app.css` (same pattern as the 6414 / 2 vs 6415 / 1 at `09ece2eb`, which I also measured: `gate-jest`). No jest test touches this harness file.
- Lifecycle, five `--only` parts (`gate-lc1b` 21/21 182 s, `lc2b` 16/16 319 s, `lc3b` 9/9 337 s, `lc4b` `G-S57,G-S62,G-S61,G-S56` 4/4 293 s, `lc5b` `G-S59` 1/1 154 s): 51/51, 0 failed. (Pre-rebase: 21/21, 16/16 on `09ece2eb`.)
- e2e (`gate-e2e`): `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`, 62 s.
- Bundle identity: worktree `main.js` sha256 `8e969de241ee12f45a7b49836eaf7d1ad6925af4ce8d5e69993232abb0730d49`, `styles.css` `93be34afd907377071ec75801119dfe38e894c3c6ae774687712a526eaf1174b` == the `git archive 31d8f779` build (`bundle-green2`). On `09ece2eb`: `fe88efc5e83622c26cd25012558044e3a30242875314bc9666c0fb1c729eead3` / the same styles.css. The branch changes only the harness file, so shots/freeze/parity carry (not run).

## 5. Concerns and follow-ups
Follow-ups:
- SC-552 (landed `31d8f779`) weakened G-S61's control sensitivity: "no flush" no longer fails (g)-(i); "fromView only" and "callouts only" fail through the pending recorder only ((e), (f)). Red still fails (a)-(i). The dse-verify row 4 clause lists the old sets; the proposal file has the new table. Whether G-S61 should get extra discrimination (for the Reading view paths) is the owner's call.
- The clause's "flush only for callouts (M4)" needs a precise definition (writer-based vs sibling-based give different phase sets); I used sibling-based.
- The recorder's disk read uses `window.require('fs')` and `adapter.getFullPath` (works in the headless Obsidian of the harness).
Drive-by fixes: none.

## 6. Artifacts
- Branch worktree: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements` (only change: `visual-harness/obsidian-lifecycle.mjs`).
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/sc557-r1-impl-report.md`; proposal: `.../sc557-dse-verify-proposal.md`.
- Logs (ledger dir, all `sc557-r1-*`): `gs61-green-idle-rep{1,2,3}`, `gs61-green-load-rep{1..8}` (pre-fix recorder), `gs61-red-A`, `gs61-M{1,2,3,4,4b}-A`, `gs61-green-postidle-rep{1..3}`, `gs61-green-postload-rep{1..10}`, `gs61-red-C`, `gs61-M{1,2,3}-C`, `gs61-M4b-C`, `gs61-green-cap5-rep1`, `gs61-green2-rb-idle-rep{1..3}`, `gs61-green2-rb-load-rep{1..10}`, `gs61-red-rb`, `gs61-M{1,2,3,4}r-rb`, `gs61-M{1,4}r-origbase`, `gate-{tsc,lint,jest,lc1,lc2}` (pre-rebase), `gate-{tsc2,lint2,jest2,lc1b,lc2b,lc3b,lc4b,lc5b,e2e}`; helper scripts `sc557-r1-tool-*` (log summarizers `s557-sum2.py`, `s557-attr.py`, mutant patcher, load scripts).
- Scratch (private): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-a7k2q9/` (bundles `bundle-{green,green2,red,M1..M4,M4b,M1r..M4r}`, sources `src-*`, logs).

## 7. Process notes
- My 12 busy loops (PIDs 3022692..3022703) ran about 89 minutes unattended across the 429 gap; I stopped them by literal PID on the dispatcher's order (all 12 confirmed gone), and from then on every load measurement started and stopped its own loops inside one call (`s557-loadreps.sh`, trap on exit; pid file empty afterwards). Loaded runs therefore overlapped SC-490/SC-552's gates for those ~89 minutes.
- Under load no run hit an environment timeout (G-S61 elapsed 102-118 s vs ~97 s idle).
- No pkill, no glob rm, no `/tmp/dse-obsidian-lifecycle-*` deletion; one temporary harness copy removed by literal path.
