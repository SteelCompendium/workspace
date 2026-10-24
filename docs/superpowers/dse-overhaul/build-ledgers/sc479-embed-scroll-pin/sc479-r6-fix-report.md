# SC-479 r6 fix report

## Executive summary
- **DONE. The combined geometry gate shipped; no fallback to `alt-geo` was needed** (it passed every measured geometry). dse head **71437da** on **origin/develop ed368f6** (rebased from c558759 over SC-513: no conflicts, no SC-479 file touched, plugin source identical). Superproject head **e30728a** on origin/main d8a109f; dse pointer unstaged.
- Gate (`embedStopWanted`, decided once at pin time, never downgrades an existing pin): stop ON when (i) a DSE root inside an embed intersects the viewport, or (ii) no DSE-bearing embed intersects it; OFF when the viewport meets a DSE-bearing embed but none of its roots (host still gets the sizer pin).
- Probe table (text shift px, base c558759 -> head 71437da, 2 reps each): r3host end x5 writers: base 2887 -> 0 (process/nodefs/own-off), pane 3574 -> 0, own-on adopted held; **head held 5/5**. INSIDE +150/+500 add/remove: base 0, **head 0** (r5 e6b02ca was +110/-109). BELOW+100 add/remove: base +110/-109, **head 0**. Information row (viewport inside the tracker, hero added ABOVE): base +110/-109, head +110/-109 (same, not worse).
- Gates on 71437da: tsc rc 0 / lint rc 0 · jest **6127 passed / 1 skipped / 247 of 248** (6112 + 15 SC-479 tests) · lifecycle **40/40** as 20/20 + 20/20 (`--only` halves, rc 0 both) · e2e **124/124 ok, 0 failed, 0 known-bug, coverage 87/87 pairs** · shots **592, 0 FAIL**, `button host-leak OK (145 kinds ... = 870 comparisons)`, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **280/280** · parity **0 gap(s), 0 undeclared, 24 declared**.
- `styles.css` byte-identical to a base build (sha `ae45354b6369`, all bundles). Plugin bundle for head `e487253342d0` and base `b5a41fccfff5` are the same bytes as on c558759, so the probe table ran on c558759-based bundles (same bytes as the ed368f6 ones: `bundles.sums` shows head `e487253342d0` / base `b5a41fccfff5` in both builds); the discrimination table ran on bundles built from ed368f6-based sources.
- Discrimination, 2 runs each, `--only=G-S8,G-S15,G-S18,G-S42`, bundles built from ed368f6-based sources: head ok 2/2 · base FAIL 2/2 · "host pins without the anchoring rule" FAIL 2/2 · "host pin disabled" FAIL 2/2 · "anchoring stop on the scroller" FAIL 2/2 (phase (e) only) · **new "embed stop with no geometry gate" FAIL 2/2 (phase (f) only)** · G-S8/G-S15/G-S18 ok in all 12 runs.
- Mutation check: 24 mutations, 24 killed, including the 3 gate branches (G1 drop (i): 2 tests fail; G2 drop (ii): 6; G3 drop (iii): 2) and the two application points (G4 upgrade path, G5 new pin).

## Commits (dse, base ed368f6)
`4cdb306` host pins · `6680934` nested links · `c5c1506` header · `a73ed68` G-S42 count · `7d4bd23` r4 embed stop · `ed9a632` r4 phase (e) + waitFor · **`aabb828` r6 gate** (source + 5 jest tests + header rewrite, replacing the "nothing measured shows it" risk paragraph with the gate's reasons and the measured numbers) · **`71437da` r6 phase (f)** (fixtures `Lifecycle/embtrackerlong.md` = 20-hero tracker + 25 `I-POST` paragraphs, `Lifecycle/embhostinside.md` = 30 paragraphs, the embed, 80 paragraphs; header + scenario comment updated). Superproject `e30728a` CHANGELOG (unchanged text, rebased). Patches in `sc479-r6-evidence/patches/`.

## Jest (5 new tests, `previewScrollPin.test.ts`, 51 in the file)
(i) root on screen -> stop; (ii) no DSE-bearing embed on screen (embed ends 100 px above the viewport) -> stop; (iii) viewport inside the embed off its roots -> sizer pin only, `scrollerAnchorOff` false; re-pin where the gate says no never drops an earlier stop; an own pin that meets a refused host pin does not gain the stop. jsdom has no layout, so tests give elements `getBoundingClientRect` boxes; with the default 0x0 boxes every older test lands in branch (ii) (stop on) and is unchanged.
Mutations (`mutations.txt`, all KILLED): M01-M17, M19, M18 as in r4 (M19 = anchor rule back on the scroller, killed by 8) + **G1** branch (i) removed (2 failures) · **G2** branch (ii) removed (6) · **G3** branch (iii) removed (2) · **G4** gate skipped when upgrading an own pin (1) · **G5** gate skipped on a new host pin (1).

## Probe table detail (Obsidian 1.15.0; probes `R3-END`, `R5-INSIDE`, new `R6-ABOVE`; logs `probe-*.log` in the evidence dir)
Text shift = the tracked reference's on-screen top, start -> end, constant in every frame on head.
| case | base c558759 | head 71437da |
|---|---|---|
| r3host end: process / nodefs / own-off | scrollTop 2887 -> 0 (text 438 -> 3325) | held 2887, text 438 -> 438 |
| r3host end: pane | 3574 -> 0 (text 438 -> 4012) | held 3574 |
| r3host end: own-on (adopted, nothing redrawn) | held | held |
| INSIDE +150 add / remove (reader below the tracker, in the embed) | 0 / 0 (scrollTop 4031 -> 4141 / 3922) | 0 / 0 (scrollTop 4031 -> 4141 / 3922: compensated) |
| INSIDE +500 add / remove | 0 / 0 | 0 / 0 |
| BELOW +100 add / remove (embed 100 px above the viewport) | **+110 / -109** | **0 / 0** (scrollTop 4981 -> 5091 / 4872) |
| INSIDE / BELOW process (no height change) | 0 | 0 |
| info: viewport inside the tracker, hero added/removed ABOVE (R6-ABOVE, 2 reps) | +110 / -109 | +110 / -109 (identical: the pin holds scrollTop, as SC-198/SC-470's own-view pin) |
INSIDE +150, BELOW +100 and the info row had 2 reps in each of two probe runs (4 for INSIDE +150 and BELOW +100); INSIDE +500 and process had 2 (one per run).
Head e6b02ca (r4, no gate) for comparison (r5 measurement): INSIDE +110 / -109.

## G-S42 phase (f)
Reader inside a tall embed below its tracker (viewport top 150 px under the tracker root's bottom; embed 3602 px, tracker above the viewport), `vault.process` adding a hero (embed 3602 -> 3712), the first fully visible `I-POST` paragraph tracked BY TEXT every frame from before the write (the embed's paragraphs can be rebuilt). Assertions: write landed; tracker drawn; anti-vacuity (tagged root replaced; `embTop < 0 < embBottom` and tracker bottom above the viewport; embed grew >= 50 px; reference found); pin on the host at the redraw; text identical in every frame, never lost; pin released. No timed delay decides an outcome. Head: text held at 26 px, scrollTop 4031 -> 4141 (compensated), pinned ~107 frames. Controls:
| bundle | (a) | (b) | (c) | (d) | (e) | (f) |
|---|---|---|---|---|---|---|
| head | held | held | held | held | held 36 px | held 26 px |
| base | no pin | no pin | no pin | no pin | no pin | no pin |
| host pins, no anchoring rule | 2887 -> 0 | 2887 -> 0 | 2887 -> 0 | 3574 -> 0 | 36 -> 146 | held |
| host pin disabled | no pin | no pin | no pin | no pin | no pin | no pin |
| anchoring stop on the scroller | held | held | held | held | **36 -> 146** | held |
| embed stop with no geometry gate (= e6b02ca) | held | held | held | held | held | **26 -> 136** (min 26 max 136, scrollTop 4031 held) |

## Proposed dse-verify SKILL.md text (for the dispatcher; not applied)
1. Battery row 4: `OBSIDIAN-LIFECYCLE done: 40/40 ok, 0 failed` (about 14 min; run as two `--only` halves of 20 to stay under a 600 s tool timeout and report the union); append `SC-479 G-S42 - a Reading-view note that embeds a tracker keeps its scroll position (reader at the end), its on-screen text (reader below the embed) and its on-screen text (reader inside a tall embed) when the tracker's note is written`.
2. Entry after G-S15:
   > `G-S42` (SC-479: a Reading-view HOST note keeps its scroll position and its on-screen text when a tracker in a note it embeds is written. Fixtures: `Lifecycle/embhost.md` (`C-TOP`, `![[embtracker]]`, `C-BOTTOM`; `embtracker.md` = the 25-hero tracker), `embhosttall.md` (30 paragraphs, the embed, 150 paragraphs), `embhostinside.md` + `embtrackerlong.md` (20-hero tracker + 25 paragraphs, 3602 px, in a host of 30 + 80 paragraphs). Phases (a) in-app `vault.process` of B, (b) a write on disk via the watcher, (c) the embed's own click with view adoption OFF, (d) a second Reading pane showing B makes the click, all with the host parked at its END (stock: scrollTop 2887 -> 0), (e) the tall host parked just BELOW the embed and a hero added (the embed grows 3190 -> 3299): the first visible paragraph's on-screen top must not move (stock Chrome does not compensate there: +110 px; the pin plus the embed stop gives 0), and (f) the reader parked INSIDE the tall embed 150 px below its tracker and a hero added (3602 -> 3712): the first visible embed paragraph, tracked by text, must not move (stock compensates; an embed stop that excludes the whole embed moved it 110 px). Per phase: write landed; tracker drawn; anti-vacuity (tagged root replaced, parking geometry as stated, embed grew); `data-dse-scroll-pin` on the host when the root left the document; scrollTop ((a)-(d)) or text top ((e), (f)) identical every frame until the pin is released + 10 frames; pin released. Every phase runs even after one fails. The pin = sizer floor + `overflow-anchor: none` on the host's `.internal-embed` elements, decided at pin time by where the reader is (a DSE root on screen, or no DSE-bearing embed on screen; not when the viewport meets a DSE-bearing embed off its roots). Controls (temporary bundle variants via `DSE_LIFECYCLE_BUNDLE`): **"host pins without the anchoring rule"** FAILs (a)-(e) ((a)-(d) 2887/3574 -> 0 with the pin present, (e) +110 px); **"host pin disabled"** FAILs every phase (no pin at the redraw); **"anchoring stop on the scroller"** (`.markdown-preview-view[...] { overflow-anchor: none }`) holds (a)-(d), (f) and FAILs (e) only (36 -> 146); **"embed stop with no geometry gate"** (the gate always says yes) holds (a)-(e) and FAILs (f) only (26 -> 136). Base bundle FAILs every phase.)
3. Numbers on ed368f6+: jest 6127 passed / 1 skipped / 247 of 248 (fresh worktree without a shots cache: one fewer / 2 skipped); lifecycle 40/40; e2e 124/124, 87/87; shots button host-leak 145 kinds / 870.

## Drive-by fixes
None.

## Follow-ups
- G-S42 now runs ~1.5 min of its own; the lifecycle gate as a whole is ~14 min and no longer fits one 600 s tool call (the halves above).
- With the gate OFF (viewport inside a DSE-bearing embed off its roots) the host gets the sizer pin and Chrome anchoring; I measured the collapse-and-clamp only in the end/in/below geometries, so a write that redraws the tracker while the reader is inside the embed AND the sizer estimate under-runs the real height is not separately measured (the INSIDE rows held with no clamp). Candidate for r7 if wanted.
- Own pins keep today's behaviour; the information row shows a hero added above the viewport inside the tracker shifts the text by the row height with or without this change.

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r6-evidence/`)
`tsc.log lint.log jest-final.log e2e-final.log shots-final.log freeze.log parity-final.log lc-only-half1.log lc-only-half2.log` (all on 71437da) · `disc-{head,base,nogate,ctl-noanchor,ctl-nohost,ctl-scroller}-run{1,2}.log`, `disc-summary.log`, `bundles.sums`, `build-scratch.sh`, `build-all.sh`, `disc2.sh`, `mut-*.py` · `mutations.txt`, `mut.py` · probe logs `probe-{h1,h2,e1,e3}-head.log`, `probe-{b1,b2}-base.log`, `probe-e2-base.log`, `r3-probe.sh`, `r6-above.mjs.txt` (the new R6-ABOVE probe; R3-END/R5-INSIDE are r5's) · `pre-sc513/` (jest + both lifecycle halves on c558759-based 8ccf9ce) · `patches/`. Bundle sums: head `e487253342d0`, base `b5a41fccfff5`, nogate `3ded236760b2`, ctl-noanchor `1f8c903ead0b`, ctl-nohost `04415c06c553`, ctl-scroller `dbc53f0ab61c`; styles.css `ae45354b6369`.
