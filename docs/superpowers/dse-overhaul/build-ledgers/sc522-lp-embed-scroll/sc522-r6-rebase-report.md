# SC-522 r6 rebase report

## Executive summary
- **dse** `sc522-lp-embed-scroll` @ **`ad018cd`** on `origin/develop` **`fb24f8a`** (SC-536; the brief said 458abe3, develop moved twice mid-round: 458abe3 -> f81a277 (SC-533) -> fb24f8a, I rebased each time and re-ran the whole battery on the final base). **superproject** @ **`974b567d`** on `origin/main` **`3ccab070`**. Porcelain: dse clean; superproject ` M draw-steel-elements` only.
- **Conflicts:** only `visual-harness/obsidian-lifecycle.mjs`, each time at the end of SCENARIOS (G-S53 / G-S54 / G-S56 vs G-S52); kept every other scenario whole. **G-S52 is placed before G-S56** (G-S56 must run LAST: it detaches every other markdown/sidebar leaf); order now `… G-S50 G-S53 G-S54 G-S52 G-S56`. Superproject: one CHANGELOG conflict on the 458abe3 rebase, kept every bullet; clean on the last. No `package*.json` change (no `npm ci`).
- **range-diff** (`34f46cf..64e176f` vs `fb24f8a..HEAD`): 1 `=` (fix 3a8a084), 2 `!` (test df25c24: context only - the G-S52 hunk sits between G-S54 and G-S56 now, the header block moved, no content change), 3 `=`, 4 `=`, 5 `=` (fix/test 511f71b, 4b380d5, 5d4bcf3), 6 new docs commit `ad018cd`. **No SC-522 src hunk changed in the rebases.**
- **Gates (fb24f8a-based head):** tsc / lint rc 0 · jest **6245 passed / 1 skipped / 249 of 250** (fb24f8a 6228 + 17 SC-522) · lifecycle **45/45** in three `--only` parts (21 + 16 + 8; two halves exceed the 590 s guard, G-S53/G-S54/G-S56 are slow) · e2e **`124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (157 … 942 …)` · freeze **`freeze OK (280/280 …)`** · parity **0 gaps / 0 undeclared / 24 declared** (last). `styles.css` `ae45354b6369` in the fb24f8a build, the head build and in-tree.
- **Discrimination (G-S52, 2 runs each, bundles from the rebased sources):** head ok; base FAIL (a)-(f); ctl-nohold FAIL (a)-(d),(f); ctl-norelease FAIL (a)-(d),(f); ctl-noclick FAIL (e) only; ctl-fresh FAIL (f) only. `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S53,G-S54,G-S52,G-S56` ok 9/9 twice.
- **SC-481 / SC-533 / SC-536 did not change the embed's redraw shape** (below), and no case is worse than base: STATUS: DONE.
- Mutation check not re-run (src is byte-for-byte the r4 head apart from two comments; r4: 29 / 30 killed, 1 equivalent); the 6 SC-522 jest suites pass in the full run (+17 tests).

## (i)-(v) base vs head on fb24f8a, 2 reps (R3-R5 probe; host parked at end; scrollTop start -> end; hold times in ms after the write)
| case | base (fb24f8a) | head (ad018cd) |
|---|---|---|
| (i) delete one of two blocks | 7047 -> 5416 at once | 7047 -> 5416 at once; hold on 3-4 ms, off 18-37 ms |
| (ii) prose-only shrink (12 paragraphs) | 6317 -> 5837 at once | 6317 -> 5837 at once; off 37-72 ms |
| (iii) write to tracker 1 of two | 7047 -> **5416** | **held 0 px (min = max = 7047)**; off 45-71 ms, after the mount |
| (iv) three prose shrinks 1 s apart | 6317 -> 5837 | each hold off 29-31 ms after its write; last off at 2030 ms (write at ~2010) |
| (v) two embeds of B | 10062 -> 7007 | held 0 px (10062); off 61-70 ms |
| edit prose in B | held | held; off 24-29 ms |
`leftover` (inline min-height / attribute) empty in every run. Same shapes were measured on 458abe3 and f81a277 (logs in `/tmp/.../sc522-r6-impl1/logs_f81` / `logs458`): same results within 20-40 ms of hold timing noise.

## Headline probes (r1 `P522-REPRO`, 2 reps)
- (a) `vault.process`, embed near the end, host at end: base 6800 -> **3745** (top line 163 -> 155); head **held 6800** (top 163+2880 unchanged).
- own click in the tracker (`own:in:S`): base 5420 -> **3916**; head **held 5420**.

## Did SC-481 / SC-533 change whether the embed's root is fresh / re-added / kept? No.
Mutation sequences on the host's embed (R4-MUT probe, `sc522-r6-probe-mutation-sequences.log`): a rewritten tracker (single, or tracker 1 / 2 of two) is `el-pre` removed + `el-pre` with a NEW EMPTY root added in one batch (n2, `roots 1/0full` or `2/1full`), then our view mounts; a deleted block is one batch with a removal only (`1/1full`); a prose shrink is one batch of `el-p` removals. Identical to r4's table on 4deb8cf. So the rule keys on the same shapes.

## Comment folds (commit `ad018cd`)
- INFO-2: `livePreviewScrollHold.ts` re-hold comment rewritten: the height read includes the previous hold's min-height, so a re-hold does not lower it before the redraw; the larger-floor condition is explicit when a held root was removed; a shrink is handled by the redraw-time release, not here. No behaviour change.
- INFO-3: one added KNOWN LIMITS line: any removal outside our roots in the ~20-30 ms between the write and the redraw releases early, so that write behaves as on stock (never worse).
- The same commit sets the G-S52 header count in `obsidian-lifecycle.mjs` to 45.

## Drive-by fixes:
None.

## Follow-ups:
1. The full lifecycle no longer fits two halves under the 590 s guard (`lc.sh` `timeout 590`): at 45 scenarios the second half of 22-24 hit rc 124 once at 458abe3 (all scenarios printed ok, exit killed by the timeout). dse-verify should say three parts.
2. `G-S52` relies on being before `G-S56` in SCENARIOS; if a later ticket appends another scenario after G-S56 the "G-S56 last" rule needs restating in dse-verify.

## Proposed dse-verify SKILL.md text
**Battery row 4 (lifecycle):** `OBSIDIAN-LIFECYCLE done: 45/45 ok, 0 failed`; run it as THREE `--only` parts to stay under 600 s: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S56` (8); G-S56 must stay last. **G-S52 entry** (after SC-518's G-S50, unchanged from the r4 text except the counts):

> SC-522 G-S52 — a LIVE PREVIEW host note that embeds a tracker note keeps its scroll position and its on-screen text when the tracker's note is written, a click in the embedded card does not scroll the host, and a block deleted from the tracker's note does not keep a blank band up. Fixtures `Lifecycle/lpembtracker.md` (25-hero tracker), `lpembhostend.md` (80 paragraphs, `![[lpembtracker]]`, 3 end lines), `lpembhosttall.md` (80 paragraphs, the embed, 80 paragraphs), `lpembtwo.md` (two 12-hero trackers) and `lpembhosttwo.md`. Phases (a) in-app `vault.process` of B, host parked at its end (stock scrollTop 6800 -> 3745), (b) a write on disk via the watcher, (c) a second Reading pane showing B makes the click (7486 -> 3745), (d) tall host parked below the embed, a hero added (the text must settle where it started; stock +69 px), (e) a REAL mouse click on a toggle in the embedded card, adoption on, host parked in the tracker (stock 5420 -> 3916, text +1528 px), (f) B holds two trackers, host at its end, the second block is DELETED: the embed shrinks 3437 -> 1806 px, the hold must be on at the redraw, released within 5 frames of it (head: 0; a release only on a fresh root keeps it ~150 frames until its timer), the host ends at its new end 5416 as on stock. Per phase: write landed; tagged root tagged and removed (anti-vacuity); hold on at the redraw; scrollTop and text identical every frame ((d): settled position); hold released and, for (a)-(d), never while the new tracker is already mounted; selection unmoved. Every phase runs even after one fails. Controls (temporary bundle variants via `DSE_LIFECYCLE_BUNDLE`): **"host embed hold disabled"** FAILs (a)-(d) and (f); **"hold released only by its timer"** (no MutationObserver) FAILs (a)-(d) and (f); **"no `interactive-child` mark"** FAILs (e) only; **"release only on a fresh root"** (the redraw-without-a-fresh-view release disabled) FAILs (f) only. Base bundle FAILs (a)-(f). A FAIL of (a)-(d) under heavy load where Obsidian's redraw of the embed came after `PIN_TTL_MS` (2.5 s) is a false red (the timer released first), not a regression: check `/proc/loadavg` and re-run. A click inside a DSE card in an LP embed no longer selects the embed.

**New CURRENT line** (dse `develop` @ `<landing sha>`; SC-522 landed — a Live Preview note that embeds a tracker note keeps its scroll position and its text when that tracker's note is written, and a click on a control in the embedded tracker no longer scrolls the note or selects the embed; new lifecycle G-S52):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6245 passed / 1 skipped / 249 of 250 suites** (fresh worktree: 6244 / 2) · lifecycle **45/45** (three `--only` parts 21 + 16 + 8) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary) · freeze **`freeze OK (280/280 …)`** (no rebaseline; `styles.css` byte-identical to `fb24f8a`, sha `ae45354b6369`) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-522 r6 implementer on `ad018cd` (on `fb24f8a`).

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/`, prefix `sc522-r6-`)
`tsc.log`, `lint.log`, `jest1.log`, `lc-h1.log`, `lc-h2.log`, `lc-h3.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`, `lc-nine-{1,2}.log`, `lc-x-{head,base,nohold,norelease,noclick,fresh}-{1,2}.log`, `probe-r5-{base,head}.log`, `probe-headline-{base,head}.log`, `probe-mutation-sequences.log`, `range-diff.txt` (against the f81a277-based previous head), `range-diff-r4.txt` (against 34f46cf..64e176f as asked), `bundles-summary.log`. Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r6-impl1/` (`logs_f81`, `logs458` = the earlier partial batteries). Shots took > 600 s and was auto-backgrounded by the tool (script writes its own log + rc file; I polled the rc file).
