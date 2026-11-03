# SC-557 r2 review: G-S61 load-aware stale-frame rule (dse `f2f25f9f` on `31d8f779`)

## Executive summary
- **Verdict: FIX (one small round, harness only).** HIGH 0 / MEDIUM 1 / LOW 3 / INFO 6. The rule is sound: it exempts only a card that shows its own block's current disk value while the editor document lags. It cannot hide a card that shows any other value (X4, X5, X7 below).
- **MEDIUM-1 (fail-open):** if the per-frame disk read throws, every stale card becomes "catching up" (`u`). The 3-in-a-row check then goes silently vacuous: a forced wrong card (7 for 24 frames / 417 ms, doc == disk == 5) PASSES (X6). The same card FAILs with reads working (X5: 23-24 counted in a row). The outcome line hides it, because `u` is summed into "catching up".
- **New mutants/probes** (all on the green bundle `8e969de2`, probe harness in scratch): X1, the editor document held back 600 ms: PASS by design (36 frames / 600 ms catching up, 0 counted). X2, held back 1500 ms: the **cap fires in all 9 recorded LP phases** (90 frames / 1500 ms). X4, held back 600 ms plus card b2 forced to 7 for 400 ms: FAIL in all 8 LP phases that have a block 2 (9-25 counted in a row). X5, card forced, no hold: FAIL in the same 8 (9-24). X6, card forced plus every disk read failing: **PASS (masked)**. X7, card forced plus every other read failing: FAIL in the same 8 (4-13 counted).
- **Red/controls on f2f25f9f's harness:** red `f7c9c7ce` (730f051c) fails (a)-(i), with (a)-(f) on disk + pending and (g)-(i) on disk. M2 (after-await, 74f81d6f) fails (a)-(f), pending only. M4 (SC-544's exact patch, 50dccc0a) fails (f), pending only. M3 (fromView, 94ee492f) fails (e), pending only. All four match r1.
- **r1 claim (i) confirmed:** M3 and M4 fail the same single phase, (e) and (f) respectively, on the unmodified `31d8f779` harness and on `f2f25f9f`. Every control still fails at least one phase, but nothing except red fails (g)-(i), and no control or red fails through the stale-frame check (the check SC-557 changes).
- **r1 claim (ii):** SC-544's M4 is sibling-based. In `ViewRegistry.flushPendingWrites`, after the `entry === except || …` skip line, it adds `if (!entry.root.closest('.cm-callout')) continue;`.
- **Green under load: 6/6 0 FAIL.** 12 loops for 3 runs, 16 loops for 3 runs, on 12 cores, loadavg 0.5 -> 18.2. Plus 1 idle run 0 FAIL and part 4 4/4. 0 counted stale frames, 0 pending; longest catching-up run 4 frames / 67 ms; document behind disk <= 71 ms. Phase (e) had 3-4 consecutive card-ahead frames in every loaded run, so **the old rule would have FAILed 6/6.**
- Diff is confined to the G-S61 block. Gate: lifecycle part 4 `G-S57,G-S62,G-S61,G-S56` **4/4 ok, 293 s**. Trees are unchanged before and after.

## Findings

### MEDIUM-1: a failed disk read turns the stale check off silently
- Where: `visual-harness/obsidian-lifecycle.mjs:5697-5702` (`try { dk = …readFileSync… } catch (e) {}` leaves `dk = []`). Then `:5702` (`diskWhole = dk.length === dv.length` is false) and `:5714` (`kind = !diskWhole ? 'u' : …`). `u` counts as catching up, and `:5615` prints `catching up ${rec.k.cu + rec.k.u}`.
- Scenario, measured as X6: the disk path does not resolve (a future Obsidian or harness change to `getFullPath`, or `window.require` missing). Every stale card is then `u`, so no frame is counted and `longest` stays 0. Only the 1000 ms cap is left. A card that shows a wrong value for under 1 s passes. In X6, card b2 showed 7 for 22-25 frames / 417 ms, the document and disk both said 5, and 8 LP phases passed. The outcome lines read `catching up 24, document had the disk value 0, neither 0`, which a reader takes for a healthy run. With reads working (X5) the same card fails all 8 phases.
- Fix (a few lines, inside the recorder):
  1. Keep the last whole disk read (`R.lastDisk`, the values from a read where `dk.length === dv.length`).
  2. On a torn read (`0 < dk.length < dv.length`), judge against `R.lastDisk`.
  3. On a read that throws, or one with no earlier whole read, count the card as before (`x`). Also count `R.readErr++`.
  4. Fail the phase if `readErr` is more than 0, or more than 1-2 frames (a broken recorder must not pass).
  5. Print `u` and `readErr` apart from `cu` in the outcome line.

  This also closes LOW-1. Re-check with one green G-S61 run plus the X6 probe (`SC557_BADREAD=1 SC557_INJ=2:7:400`), which must then FAIL.

### LOW-1: a torn read inside a short wrong-card run removes a frame from the count
- `:5714` and `:5725-5726`. A `u` frame neither adds to the run nor ends it. A wrong card that lasts exactly 3 frames, with one torn read among them (torn reads happen at write time, which is also when wrong cards appear), is counted as 2 and passes.
- X7 shows that alternate failed reads do not mask a longer wrong card (4-13 counted, FAIL). The exposure is the one-frame margin.
- Fix: the `R.lastDisk` fallback from MEDIUM-1.

### LOW-2: the failure message for counted frames can show only catching-up samples
- `:5618`. `seen` cites `rec.samples`, which holds the first 4 frames with any wrong or pending card. Under load these are usually catching-up frames (`b1=6/doc5/disk6`), so the frames that were actually counted show up only in `rec.odd`, in the outcome line after `-- outcomes:`.
- X5 (a) is an example: the first sample is the catching-up `b1=6/doc5/disk6`.
- Fix: put `rec.odd` (the counted samples) into `seen`, first.

### LOW-3: measurement wording mixes the two r1 sets
- The proposal's §3 CURRENT line says `10 runs under 12 busy loops (loadavg 11-27 on 12 cores) 0 FAIL, max catching-up run 4 frames / 83 ms`. Per r1's own report, the 4 f / 83 ms set is the rebased set, which ran at loadavg 0.83 -> 13.9. The 11-27 range belongs to the pre-rebase set, whose maximum was 6 f / 117 ms.
- The code comment at `:5611-5613` says "10 runs at a loadavg of 14-26". r1's report gives 7 -> 26 for that set.
- Fix: state each set with its own loadavg range and maximum. Optionally add r2's 6 loaded runs: loadavg up to 18.2 under 16 loops, maximum 4 f / 67 ms, 0 FAIL, and the old rule would have failed 6/6 at (e).

### INFO-1: SC-544's M4, stated precisely (for the proposal and the dse-verify clause)
- Source: SC-544 r3 reviewer's `mut.py` `m4`, at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r3-review-af6d13a061fdaf760/mut.py`. `diff src-head src-m4` is exactly one line.
- In `src/framework/host/viewRegistry.ts` `ViewRegistry.flushPendingWrites`, directly after `if (entry === except || entry.released || entry.host.sourcePath !== sourcePath) continue;` insert:
  `if (!entry.root.closest('.cm-callout')) continue; // MUTANT M4: only Live Preview callout views`
- So it is sibling-based: the writer always flushes, but only siblings whose root sits inside a `.cm-callout` element get flushed. It is a DOM test on the sibling's root, not on `host.livePreviewCalloutWidget()`.
- SC-544 r3's bundle `bundle-m4` main.js `56ce8296…` failed (f)-(i). Re-anchored on `31d8f779` (one tab deeper inside the try/finally), my build `50dccc0a…` fails (f) only, pending only, with both harnesses. r1's `livePreviewCalloutWidget()` sibling variant (M4r `2d48e886…`) gives the same set.
- The proposal's §2 M4 row should name this exact line rather than the `livePreviewCalloutWidget` description.
- Minor: the ledger copy `sc557-r1-tool-s557-mut.py` labels its M4 "writer is a Live Preview callout widget", but its patch is the sibling-based `viewRegistry` one.

### INFO-2: discrimination on `31d8f779`: adequate for the stated constraint, with gaps worth recording
- Red fails (a)-(i) and each control fails at least one phase, so the dispatcher's constraint holds.
- But on `31d8f779`:
  - (g)-(i) (Reading view and two panes) are failed by no control, only by red.
  - No control and not red fails through the stale-frame check (kind 2) or the cap. In every red/control run, stale frames are 0, apart from 1 `dd` frame in M2 (f).
- So the check SC-557 changes has no standing control in the dse-verify clause. Suggestion for the proposal: register the r2 probes as its controls. X2 (document held back 1500 ms) fails every LP phase via the cap. X5 (a card forced to a wrong value for 400 ms) fails every LP phase with a block 2, with 9-24 counted. The probe harness generator is `sc557-r2-tool-probe-patch.py`; it is env-driven and not for the branch.

### INFO-3: disk tracking is race-free as built
- The read is synchronous (`readFileSync` in the rAF tick), so no read can resolve out of order or come back stale relative to the disk.
- Two quick writes: the disk shows the latest write that has landed.
- A write still in flight is a different case. The view's pending flag is cleared by the flush, but `vault.process` has not written yet, so the card is ahead of both the document and the disk. That classifies as `dd`, counted, not exempt, which is the safe direction. Seen once (1 frame) in M2 (f). 0 times on green in my 8 runs and r1's 26.
- Residual flake source under I/O stalls: if 3 or more frames ever pass between the flush and the write, the flake returns as `document had the disk value B>0`. The diagnostics would show it. No change needed now.

### INFO-4: what the exemption admits, by construction
- A `cu` card equals its own block's current disk value, so it can only be "early and right".
- The only wrong card it could hide is one whose disk value is itself transiently wrong (a misroute that later self-corrects). Neither the old nor the new rule catches that robustly, because a card that follows the document is never stale.
- Since the recorder now reads the disk every frame, a cheap future check would be "each block's disk value is only ever its old or its final value". That is out of scope here.

### INFO-5: the new rule tolerates up to 1000 ms of a lagging document (X1: 36 frames / 600 ms, PASS)
- This is the intended trade, and the cap is verified (X2).
- The cap measures consecutive catching-only frames. Any frame with no wrong card, or with a counted card, resets it.

### INFO-6: code quality and scope
- All 5 hunks fall inside the G-S61 block (`:5586-5935`): the header (+2), constants/helpers (+12), the recorder (`:5673-5745`) and the two outcome/problem pairs.
- The SC-544 file header (`:137`) and SC-552's G-S64 are untouched.
- The comments state the rule plainly: what catching up means, why, the bound, and that a catching frame neither adds to a run nor ends it.
- Outcome lines are readable: `stale S (counted C, longest counted run L) of F [catching up: longest N frame(s) / M ms, document behind the disk up to K ms after the write; stale cards: catching up A, document had the disk value B, neither C]`.
- The proposal's §1 quote of the current clause matches SKILL.md verbatim. §1's new wording is accurate, except that it omits the failed-read case (MEDIUM-1). Its §2 table matches my re-runs.

## Measurements

| run | bundle (main.js) | harness | result | failing phases, check |
|---|---|---|---|---|
| red | `f7c9c7ce` 730f051c | f2f25f9f | FAIL | (a)-(f) disk+pending, (g)-(i) disk, follows disk |
| M2 after-await | 31d8f779+M2 74f81d6f | f2f25f9f | FAIL | (a)-(f) pending only |
| M3 fromView | 31d8f779+M3 94ee492f | f2f25f9f | FAIL | (e) pending only |
| M3 fromView | same | **31d8f779** | FAIL | (e) pending only |
| M4 SC-544 exact | 31d8f779+M4 50dccc0a | f2f25f9f | FAIL | (f) pending only |
| M4 SC-544 exact | same | **31d8f779** | FAIL | (f) pending only |
| X1 doc held back 600 ms | green 8e969de2 | probe | ok | 36 f / 600 ms catching up per LP phase, 0 counted |
| X2 doc held back 1500 ms | green | probe | FAIL | CAP in all 9 recorded LP phases (90 f / 1500 ms) |
| X4 held back 600 + b2:=7 for 400 ms | green | probe | FAIL | (a)-(f),(i),(j1) counted run 9-25 (`dd`/`x`) |
| X5 b2:=7 for 400 ms | green | probe | FAIL | same 8 phases, counted run 9-24 |
| X6 X5 + every disk read fails | green | probe | **ok (masked)** | 0 counted; "catching up" 8-25 per phase |
| X7 X5 + every other read fails | green | probe | FAIL | same 8 phases, counted run 4-13 |
| green, 12 loops x3 | green | f2f25f9f | 3/3 ok | loadavg 0.53 -> 13.11; max catch-up 3 f / 67 ms |
| green, 16 loops x3 | green | f2f25f9f | 3/3 ok | loadavg 10.21 -> 18.23; max 4 f / 67 ms; doc behind <= 71 ms |
| green idle | green | f2f25f9f | ok | 1-min loadavg 10.8 decaying (no loops) -> 2.4; 0 stale frames |
| lifecycle part 4 | worktree (= green) | f2f25f9f | 4/4 ok, 293 s | loadavg 2.4 -> 0.5 |

- Total over the 6 loaded green runs: 0 counted stale frames and 0 pending. All stale cards were `cu`/`u` (1-4 per phase). (e) reached 3-4 consecutive card-ahead frames every time.
- Elapsed time: 106-110 s loaded, 97 s idle.
- Load loops: started and stopped inside each call, by recorded PID with a cmdline-marker check. 0 left running. The pid file is empty.

## Artifacts
- Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/`:
  - Logs: `sc557-r2-red-rep1.log`, `sc557-r2-M2-rep1.log`, `sc557-r2-M3-rep1.log`, `sc557-r2-M3-baseharness-rep1.log`, `sc557-r2-M4-rep1.log`, `sc557-r2-M4-baseharness-rep1.log`, `sc557-r2-X{1-delay600,2-delay1500,4-delay600-inj2v7-400,5-inj2v7-400,6-badread-inj2v7-400,7-altread-inj2v7-400}-rep1.log`, `sc557-r2-green-load12-rep{1,2,3}.log`, `sc557-r2-green-load16-rep{4,5,6}.log`, `sc557-r2-green-idle-rep1.log`, `sc557-r2-gate-lc4-rep1.log`.
  - Per-run digest: `sc557-r2-summary.log`. Bundle shas: `sc557-r2-bundles.log`.
  - Tools: `sc557-r2-tool-{mk.sh,mut.py,run.sh,sum.py,probe-patch.py}`.
- Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-r2k7vx/`: bundles `bundle-{green,red,M2,M3,M4}`, sources `src-*`, probe harness `src-green/visual-harness/obsidian-lifecycle-r2probe.mjs`, `status-start.txt`.
- The harness kept temp dirs from the FAIL runs (not deleted): `/tmp/dse-obsidian-lifecycle-{2ONA9S,9Gsb40,iwkhye,JLsr6p,pMYMZ0,qCARfo,qglSN7,sBENI5,tclvkA,Zkqiv3}`.
- Tree: plugin `git status --porcelain` is empty before and after (HEAD f2f25f9f). The worktree superproject shows ` M draw-steel-elements` before and after (pointer not bumped, unchanged). Nothing committed. No tracker calls.
