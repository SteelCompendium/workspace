# SC-557 r4 scoped re-review: `f2f25f9f..41c03e60` (dse, base `31d8f779`)

## Executive summary
- **Verdict: LAND.** HIGH 0 / MEDIUM 0 / LOW 2 / INFO 3. The r2 MEDIUM-1 is fixed, and so are LOW-2 and LOW-3. The LOW-1 deviation is confirmed: a torn read can only delay the count by one frame, and only at the start of a run.
- **(1) X5 and X6 on `41c03e60`**, using the ledger's `sc557-r3-tool-probe-patch.py` and the green bundle `8e969de2`:
  - X5 FAILs in 8 LP phases on the counted-stale check (8-25 frames in a row).
  - X6 now FAILs in all 9 recorded phases with "the recorder could not read the note from disk in 144-177 frame(s)". In r2 it passed.
- **(2) LOW-1 residual**, probed with a wrong card that lasts exactly 3 frames. These probes are frame-precise and start 300 ms after the first write:

  | torn read on the card's... | result |
  |---|---|
  | no frame (control, R0) | FAIL in 7 phases, 3 in a row |
  | **first frame (R1)** | **PASS**: 2 counted, the torn frame is `u` |
  | middle frame (R2) | FAIL in 7 phases, 3 in a row (the torn frame is `x`) |
  | last frame (R3) | FAIL in 7 phases, 3 in a row |

  So the residual is exactly what the implementer described. A 4-frame wrong card fails whichever frame is torn. I accept the deviation.
- **New LOW-A:** a read that is torn in EVERY frame turns the stale check off, just as a throwing read did before the r3 fix. Probe T (card b2 forced to 7 for 400 ms, every read torn) PASSES in all phases. It is visible only as `torn in 148 frame(s)` on the ok line. A realistic trigger is unlikely (it needs the disk read to differ persistently from the document, e.g. the wrong file). The fix is 2 lines (below), optional before landing.
- **(3) Green under 12 loops:** 2/2 ok, loadavg 0.27 -> 13.26, 0 counted, 0 pending, catching up at most 3 frames / 67 ms, at most 2 torn frames per phase. **Red `f7c9c7ce`** (730f051c) FAILs (a)-(i), with (a)-(f) on disk + pending and (g)-(i) on disk, unchanged.
- **(4)** All 5 hunks are inside the G-S61 block (`:5600`-`:5970`). The failure messages read plainly. The proposal's X2/X5/X6 commands are correct but leave out the devbox/Xvfb wrapper and how to get the green bundle (LOW-B). The plugin tree is clean before and after; the superproject shows ` M draw-steel-elements` both times.

## Findings

### LOW-A: a persistently torn read silently disables the stale check (the same class as r2 MEDIUM-1)
- Where: `visual-harness/obsidian-lifecycle.mjs:5711-5716` (`read.length !== dv.length` makes the frame torn) and `:5730` (`torn ? (R.run > 0 ? 'x' : 'u')`). With nothing counted, `R.run` stays 0, so every frame is `u`, which counts as catching up.
- Scenario, measured as probe T (`SC557_BADREAD=torn`: last value dropped from every read, plus `SC557_INJ=2:7:400`): the card shows 7 for 23-25 frames / 417 ms while the document and disk say 5. All 9 phases PASS, with `u 24`, `torn 148`, `failed 0`. The equivalent card with reads working fails (X5).
- Green measures 0-2 torn frames per phase: in r4's 2 loaded runs, and r3's 3 loaded runs (21 phases with 0, 6 with 1).
- Fix: in `wrongCards`, fail when `rec.torn` exceeds a small bound. Two possible bounds:
  - more than 5 torn frames in a phase; or
  - better, track `R.tornRun` (consecutive torn frames) and fail on 3 or more in a row, with a message like "the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run".
- Optional. No realistic trigger in this harness today, and it is visible in the outcome line.

### LOW-B: the proposal's §3 reproduction steps are correct but incomplete
- The commands do work: I ran the same patch and the same envs and got the documented results. Missing pieces:
  - The patch is named by a bare relative path (`sc557-r3-tool-probe-patch.py`). Give its durable location (the ledger dir, or `docs/superpowers/dse-overhaul/build-ledgers/…` after landing).
  - The run needs `devbox run -c <plugin> -- bash -c '…'` (or `XVFB_BIN`), like every other lifecycle command in dse-verify.
  - `<green bundle dir>` is unexplained. Say that leaving `DSE_LIFECYCLE_BUNDLE` unset uses the plugin's own fresh build, or give the `git archive` + `node esbuild.config.mjs production` recipe.
  - The probe file is written into the working tree's `visual-harness/`, which dirties the tree. Suggest writing it outside the repo; it imports `../scripts/*.mjs`, so it must sit in a copy of the tree, as mine did in a `git archive` export.
- Wording nit: the X5 row says "(document and disk say 5)". In (c) and (j1), block 2 is 6.

### INFO-1: the LOW-1 deviation is accepted
- Rule `:5730`: a torn frame is `x` when a counted run is already going, otherwise `u`.
- R0-R3 above show the only exposure is one torn frame at a run's START (2 counted instead of 3). A torn frame in the middle or at the end still completes the run.
- The implementer's measurement, that judging against the last whole read counted merely-ahead cards, is consistent with r2's write-in-flight analysis (INFO-3 there).

### INFO-2: on torn frames, "document behind the disk up to K ms" reports the file's age, not the document's lag
- `:5734`: `since` from `u` frames feeds `cuSinceMax`. In the probes this shows up as 330-413 ms. On real torn reads the file is fresh, so the effect is tiny. The fix would be to update `cuSinceMax` only for `cu`. Cosmetic.

### INFO-3: messages and scope
- The read-failure message is plain. Example: `the recorder could not read the note from disk in 149 frame(s), so its stale-frame check did not run (… x b2=7/doc5/diskunread +nullms …)`. `+nullms` is the only rough edge.
- Counted samples now lead the message (`dd b2=7/doc5/disk5 +43ms …`). The ok line reads `stale cards: catching up A, on a torn disk read U, document had the disk value B, neither C; disk reads: torn in T frame(s), failed in E; counted: …`.
- The comment block at `:5685-5693` explains torn reads and the throwing-read rule in plain words.
- The loadavg ranges in the comment at `:5612-5614` now match each measurement set.
- Hunks: `:5609`, `:5682`, `:5702`, `:5727`, `:5752`. All are inside G-S61, which runs from `id: 'G-S61'` at `:5600` to `id: 'G-S59'` at `:5971`.

## Measurements (green bundle `8e969de2`, red `730f051c`; idle unless noted)

| run | harness | result | detail |
|---|---|---|---|
| X5 | r3 probe | FAIL, 8 phases | counted-stale, 8-25 in a row |
| X6 | r3 probe | FAIL, 9 phases | read error, 144-177 failed frames |
| R0, 3-frame wrong card, no torn read | r4 probe | FAIL, 7 phases | 3 in a row (`dd dd dd`) |
| R1, torn read at frame 1 | r4 probe | **ok** | 2 counted, 1 `u` |
| R2, torn read at frame 2 | r4 probe | FAIL, 7 phases | `dd x dd` |
| R3, torn read at frame 3 | r4 probe | FAIL, 7 phases | `dd dd x` |
| T, every read torn + X5's card | r4 probe | **ok (masked)** | `u` 23-25, torn = every frame |
| green, 12 loops, run 1 | 41c03e60 | ok | loadavg 0.27 -> 11.03; catching up at most 3 f / 67 ms; torn at most 2 |
| green, 12 loops, run 2 | 41c03e60 | ok | loadavg 11.03 -> 13.26; catching up at most 3 f / 67 ms; torn at most 1 |
| red `f7c9c7ce` | 41c03e60 | FAIL (a)-(i) | (a)-(f) disk + pending, (g)-(i) disk |

- R0-R3 show 7 failing phases, not 8, because (b)'s third click lands in the injection window and (j3) has no block 2. The (b) result is the same for R0 and R1-R3, so it is not caused by the rule.
- Load loops: started and stopped inside the same call, by recorded PID with a cmdline-marker check. 0 left running; the pid file is empty.

## Artifacts
- Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/`:
  - Logs: `sc557-r4-X5-rep1.log`, `sc557-r4-X6-rep1.log`, `sc557-r4-R0-inj3f-rep1.log`, `sc557-r4-R1-inj3f-torn1-rep1.log`, `sc557-r4-R2-inj3f-torn2-rep1.log`, `sc557-r4-R3-inj3f-torn3-rep1.log`, `sc557-r4-T-alltorn-inj2v7-400-rep1.log`, `sc557-r4-green-load12-rep{1,2}.log`, `sc557-r4-red-rep1.log`.
  - `sc557-r4-summary.log`.
  - Tools: `sc557-r4-tool-probe-addon.py` (frame-precise injection `SC557_INJF`, `SC557_TORNAT`, `SC557_BADREAD=torn`, applied on top of the r3 probe) and `sc557-r4-tool-sum.py`.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-r2k7vx/src-head4/` (export of `41c03e60`, with `visual-harness/obsidian-lifecycle-r3probe.mjs` and `-r4probe.mjs`).
- Harness FAIL dirs that were kept (not deleted): `/tmp/dse-obsidian-lifecycle-{DPOw0j,DtSHLU,Gw9g6L,OEcWHo,seqAd1,WQgymW}`.
