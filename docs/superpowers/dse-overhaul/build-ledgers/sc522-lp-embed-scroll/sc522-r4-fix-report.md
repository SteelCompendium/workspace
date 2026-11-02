# SC-522 r4 fix report (LOW-1, LOW-2, INFO-6)

## Executive summary
- **Release rule shipped (no fallback):** the embed hold is also released when Obsidian redraws the embed without bringing a fresh view of ours. Evidence = a childList removal whose target is outside every DSE root; condition = every root now in the embed is mounted (has children); the release runs one task later and re-checks then. A redraw that replaces a root (also one of two) adds the new root EMPTY in the same batch as the removal (measured), so `mounted` is false and the hold stays until our view is in. Re-hold keeps the larger floor only when a held root was removed. (a) and (b) of r3's direction both done; (iii) the owner caution holds, measured.
- **dse** `sc522-lp-embed-scroll` @ **`64e176f`** on `origin/develop` **`34f46cf`** (SC-525; was 4deb8cf; rebased, no conflict). Commits: `61a2423` fix (was b813edd), `257ec42` test (was 86ab9a2), then new `7612b48` fix(LOW-1/LOW-2), `3a8429c` test (G-S52 (f) + fixtures), `64e176f` fix (drop a redundant cancel; test fix). Porcelain clean.
- **superproject** @ **`d82709b7`** on `origin/main` **`8174d816`** (was 49fc600; one CHANGELOG conflict with SC-525's bullet, kept both). Porcelain: ` M draw-steel-elements` only.
- **Gates:** tsc / lint rc 0 · jest **6201 passed / 1 skipped / 248 of 249** (34f46cf base 6184 + 11 earlier + 6 new) · lifecycle **42/42** (21 + 21, G-S52 now has (a)-(f)) · e2e **124/124 ok, 0 failed, 0 known-bug, 87/87 pairs** · shots **592**, 0 FAIL, `button host-leak OK (157 … 942 …)` (32 + 2 = 34-record boundary) · freeze **`freeze OK (280/280 …)`** · parity **0 gaps / 0 undeclared / 24 declared** (last). `styles.css` byte-identical: `ae45354b6369` in the 34f46cf build, the head build, all controls and in-tree.
- **Discrimination** (G-S52, 2 runs each, bundles from the final sources): head ok 2/2; base FAIL (a)-(f); ctl-nohold FAIL (a)-(d),(f); ctl-norelease FAIL (a)-(d),(f); ctl-noclick FAIL (e) only; **new ctl "release only on a fresh root" FAIL (f) only** ("hold stayed on for 149 frames after the redraw"). `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52` ok 6/6 twice.
- **Mutation check:** 29 / 30 killed; the one survivor is equivalent (see below). 3 of the 6 new jest tests FAIL on the previous source; the other 3 are must-not-release guards that the previous source also satisfies.
- STATUS: DONE.

## LOW-1: what the DOM does (measured, `sc522-r4-probe-mutation-sequences.log`)
Obsidian 1.15.0, mutation batches on the host's embed during a write to B (host parked at end):
| write | first batch (26-29 ms after the write) | roots after it |
|---|---|---|
| tracker rewritten (single, or tracker 1 / 2 of two) | `el-pre` removed and `el-pre` with a NEW EMPTY root added, same batch (n2) | new root empty (`0full`); our view mounts at 45-58 ms |
| a block deleted from B | ONE batch, `el-pre` removed, nothing added | the other root, mounted, still connected |
| prose paragraphs removed | ONE batch, `el-p` x12 removed, nothing added | the root, mounted |
So "a root is momentarily missing" does not happen at a batch boundary for a rewrite: the replacement is already there, empty. The rule keys on that.

## Measurements base vs head, 2 reps (R3-R5 probe; host parked at end; scrollTop start -> end; hold times in ms after the write)
Base = 34f46cf (`sc522-r4-probe-r5-base.log`), head = 64e176f (`...-head.log`); 86ab9a2 (the r3 head, on 4deb8cf) for comparison in `...-86ab9a2.log`.
| case | base | 86ab9a2 | head (64e176f) |
|---|---|---|---|
| (i) delete one of two blocks | 7047 -> 5416 at once | 7047 -> 5416 after a 2504 ms blank band | **7047 -> 5416 at once; hold on 4 ms, off 17-22 ms** (G-S52 (f): 0 frames held after the redraw) |
| (ii) prose-only shrink (12 paragraphs) | 6317 -> 5837 at once | blank band 2505 ms | **6317 -> 5837 at once; off 23-46 ms** |
| (iii) write to tracker 1 of a two-tracker B | **7047 -> 5416** | held 0 px, off 36-41 ms | **held 0 px (min = max = 7047); off 49-72 ms, after the mount** (no premature release) |
| (iv) three prose shrinks 1 s apart | 6317 -> 5837 | floor re-armed, off at 4510 ms | each hold off 18-31 ms after its write; last off at 2029-2030 ms (the last write at ~2010) |
| (v) two embeds of B in the host | 10062 -> 7007 | held | held 0 px; each embed 3190, off 57-61 ms |
| edit prose in B (W-TOP) | held | blank 2504 ms | held; off 22-33 ms |
Settled positions equal stock's wherever stock clamps (5416 / 5837), never worse. `leftover` (inline min-height / attribute) empty in every run. G-S52 (a)-(e) re-run in the lifecycle halves: ok.

## G-S52 phase (f)
Fixtures `Lifecycle/lpembtwo.md` (W-TOP, tracker, W-MID, tracker, W-BOTTOM; 12 heroes each) and `lpembhosttwo.md` (80 paragraphs, `![[lpembtwo]]`, 3 end lines). Host parked at its end, second tracker tagged, an in-app `vault.modify` deletes that block. Asserts: exactly one tracker remains; tagged root removed (anti-vacuity); host parked at its end; embed shrank >= 50 px (3437 -> 1806); `data-dse-lp-embed-hold` on the embed when the block was removed; hold seen released; **held for <= 5 frames after the redraw** (a frame count, never a timer; the TTL is ~150 frames away; head reads 0); host ends at its new end (== stock's clamp, 5416); selection unmoved. `record` gained `tagIdx` and `heldAfterRedraw`. No outcome is decided by a timed delay.

## LOW-2, INFO-1, INFO-6
- LOW-2: header text now says "one PAINTED frame of +110 / -110 px before CodeMirror's next measure (rAF and post-paint samplers and trace screenshots see it; settled 0)".
- INFO-1: header lines now cite r3's Part 2 probe (double-click, Mod+A, click outside the card, open-link icon: as on stock minus the jump / focus steal).
- INFO-6: one sentence in the proposed dse-verify G-S52 entry below.
- KNOWN LIMITS (3) rewritten for the shipped rule, including that an early release (a redraw split across tasks) degrades to stock's clamp, never worse.

## Mutation check (`sc522-r4-mutation-summary.txt`, `sc522-r4-mutate.py.txt`)
**29 / 30 killed** over the whole hold/pin/wiring/click set (the 22 of r2 plus 8 new for this round). New: redraw evidence counting removals inside our own roots; no redraw evidence required; deferred release never fires; released at once with no deferral; deferral not re-checked; re-hold always keeps the larger floor; re-hold never keeps it. **Survivor (equivalent):** removing `if (settle !== null) win.clearTimeout(settle)` in `release` - a stray timer fires, finds `embedHolds.get(embed)?.release !== release` and returns; the cleanup is hygiene. Two guards that looked redundant were mutated singly: the deferral's cancel-on-empty-root was equivalent to its re-check on firing (both mutants survived), so I removed the cancel (`64e176f`) and the re-check is killed by the split-task test. One earlier test (`PIN_TTL_MS backstop, a re-hold never lowers the floor`) was vacuous after the rule change (a removed root made `holdEmbedsOf` skip the embed); it now replaces the root with an empty one, as Obsidian does, and kills both re-hold mutations.
New tests on the previous source (`61a2423` src, `sc522-r4-jest-new-tests-on-prev-src.log`): FAIL: block deleted, paragraph removed, re-hold lowers the floor. PASS by design (guards that must not release, true before and after): write to one of two blocks, removal-then-replacement in one task, mutations inside our own roots.

## How the rule composes with what was already there
Fresh-root / adopted-root release is unchanged and still immediate. The new branch only runs when that one did not release. TTL backstop unchanged. SC-525 (`RefUnwrapView`, `ElementView.isUnloaded()`) touches neither file; the rebase was clean for dse.

## Drive-by fixes:
None new this round (r2's two stand).

## Follow-ups:
1. A re-hold while the previous redraw is mid-flight uses the new embed's current (empty) root set as `roots0`; our view then mounts INTO the empty root, which counts neither as fresh nor as put back, so that second hold waits for its TTL (only rapid double writes before the first mount, < ~50 ms apart). Not measured, not changed; settled position is stock's. Could treat "a root empty at hold time is now mounted" as back.
2. ctl-norelease now also FAILs (f) (it has no release rule at all, as it should); the r2 expectation "(a)-(d) only" no longer holds and the dse-verify control line says so.
3. The release is one task after the redraw (`setTimeout 0`); on a machine where Obsidian redraws an embed across two tasks the early release degrades to stock's clamp (documented). No such split was observed in 40+ writes.

## Proposed dse-verify SKILL.md text
**Battery row 4 (lifecycle):** `OBSIDIAN-LIFECYCLE done: 42/42 ok, 0 failed` (halves 21 + 21: `G-S7a … G-S9a`, then `G-S9b … G-S52`). **G-S52 entry (after SC-518's G-S50):**

> SC-522 G-S52 — a LIVE PREVIEW host note that embeds a tracker note keeps its scroll position and its on-screen text when the tracker's note is written, a click in the embedded card does not scroll the host, and a block deleted from the tracker's note does not keep a blank band up. Fixtures `Lifecycle/lpembtracker.md` (25-hero tracker), `lpembhostend.md` (80 paragraphs, `![[lpembtracker]]`, 3 end lines), `lpembhosttall.md` (80 paragraphs, the embed, 80 paragraphs), `lpembtwo.md` (two 12-hero trackers) and `lpembhosttwo.md`. Phases (a) in-app `vault.process` of B, host parked at its end (stock scrollTop 6800 -> 3745), (b) a write on disk via the watcher, (c) a second Reading pane showing B makes the click (7486 -> 3745), (d) tall host parked below the embed, a hero added (the text must settle where it started; stock +69 px), (e) a REAL mouse click on a toggle in the embedded card, adoption on, host parked in the tracker (stock 5420 -> 3916, text +1528 px), (f) B holds two trackers, host at its end, the second block is DELETED: the embed shrinks 3437 -> 1806 px, the hold must be on at the redraw, released within 5 frames of it (head: 0; a release only on a fresh root keeps it ~150 frames until its timer), the host ends at its new end 5416 as on stock. Per phase: write landed; tagged root tagged and removed (anti-vacuity); hold on at the redraw; scrollTop and text identical every frame ((d): settled position); hold released and, for (a)-(d), never while the new tracker is already mounted; selection unmoved. Every phase runs even after one fails. Controls (temporary bundle variants via `DSE_LIFECYCLE_BUNDLE`): **"host embed hold disabled"** FAILs (a)-(d) and (f); **"hold released only by its timer"** (no MutationObserver) FAILs (a)-(d) ("the hold outlived the remount by N frames") and (f); **"no `interactive-child` mark"** FAILs (e) only; **"release only on a fresh root"** (the redraw-without-a-fresh-view release disabled, `if (false && redrawn …)`) FAILs (f) only. Base bundle FAILs (a)-(f). A FAIL of (a)-(d) under heavy load where Obsidian's redraw of the embed came after `PIN_TTL_MS` (2.5 s) is a false red (the timer released first), not a regression: check `/proc/loadavg` and re-run. Part 2 note: a click inside a DSE card in an LP embed no longer selects the embed.

**New CURRENT line** (dse `develop` @ `<landing sha>`; SC-522 landed — a Live Preview note that embeds a tracker note keeps its scroll position and its text when that tracker's note is written, and a click on a control in the embedded tracker no longer scrolls the note or selects the embed; new lifecycle G-S52):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6201 passed / 1 skipped / 248 of 249 suites** (fresh worktree: 6200 / 2) · lifecycle **42/42** (halves 21 + 21) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **`freeze OK (280/280 …)`** (no rebaseline; `styles.css` byte-identical to `34f46cf`, sha `ae45354b6369`) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as measured by the SC-522 r4 implementer on `64e176f` (on `34f46cf`).

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/`, prefix `sc522-r4-`)
`tsc.log`, `lint.log`, `jest1.log`, `lc-half1.log`, `lc-half2.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`, `lc-six-{1,2}.log`, `lc-x-{head,base,nohold,norelease,noclick,fresh}-{1,2}.log` (discrimination), `bundles-summary.log` (bundle shas), `probe-mutation-sequences.log`, `probe-r5-{base,head,86ab9a2}.log`, `mutation-summary.txt`, `mutate.py.txt`, `jest-new-tests-on-prev-src.{log,json}`, scripts `probe-r4mut.mjs.txt`, `buildfinal.sh.txt`. Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r4-impl1/`. Note: shots (> 600 s wall) was auto-backgrounded by the tool at its timeout, as in r2; I started it foreground and only polled its rc file afterwards.
