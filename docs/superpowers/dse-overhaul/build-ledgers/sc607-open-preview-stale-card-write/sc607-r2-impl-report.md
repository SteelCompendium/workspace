# SC-607 r2 implementation report

**Executive summary**
- Status DONE_WITH_CONCERNS (one deviation from ruling R-Q3, below). dse branch `sc607-open-preview-stale-card-write` head **1daa7d8a**, on origin/develop **622b0904** (rebased 3 times: 3ad68185 -> 231f2a3b -> 622b0904). Superproject head **b3b94384** on origin/main 38d8c695 (CHANGELOG commit only; the dse pointer is not committed).
- jest **11509 passed / 2 skipped** (base 10715 + 794 new); tsc (incl. e2e) and lint clean; e2e `280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; lifecycle **61/61** (21+16+9+4+7+4; 184/326/404/297/392/297 s; part 6 `G-S92 G-S96 G-S97 G-S99`).
- styles.css sha256 `5e5ff488...dc2b27` = clean 622b0904 build. Shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280 (parity carries, not re-run).
- Red on base (622b0904 host sources): new jest 188 failed (176 sweep cells + N1, N3, 3 R-Q2c controls, 1 R-Q3 + 6 mapLineStrict unit tests); G-S99 red on the 622b0904 bundle in 7 of 7 non-control cells (control green).
- Mutants: 28, 22 killed, 6 survived (M5, M7, M8, M18, M19, M22: equivalent or defence in depth).
- **Deviation (R-Q3):** the guard as ruled ("snapshot text must equal `embed.data`") refused G-S92 (e) in real Obsidian (a second + 450 ms after the first): `embed.data` is NOT refreshed when the preview is redrawn from a changed part. Final guard: checked only for a hover MOUNT snapshot (not re-bind, not own-write, not embed) and only while `embed.data` still contains the card's part. Owner should confirm.
- G-S91 (part 5) flaked 3 times on the branch and once in 4 runs on base (same message); reruns green.

## Commits (dse, on 622b0904)
530ff3ab tests (red on base) · 4b5e9f4d fix · 4fcc0d87 comment · 65726891 embed-in-hover control test · 306e3afa G-S99 · 9989ac32 tsc typing · 192cfdb1 hover guard fix (+ dse CHANGELOG) · 1daa7d8a test data. Superproject: b3b94384 CHANGELOG.

## What was built
- `lineMap.ts`: `mapLineStrict(before, after, line)` -> `{line}` | 'deleted' | 'disagree' | 'gave up'; `mapLineFromTail`; `mapLine` unchanged for its callers (give-up still null).
- `ReadingModeBlockHost.ts` (r1 probe rule, R-Q1/Q2a/b/d): `snapshotDrawn` (one `cachedRead` per mount / rebind), `strictPins`, `rebaseCardPin` partial branch, `pinnedTarget` strict check, `lastWrite.seq`. R-Q2c: on 'gave up' the link places the pin only if `countByBody(drawn-from text) === 1 && countByBody(note now) === 1`. R-Q6 kept (strict miss, no fallback).
- `hoverLinks.ts`: `hoverDrawnText(app, el)` (one helper, untyped-safe, try/catch, null when absent).
- Tests: `reading-mode-host-drawn-pin.test.ts` (768-cell test.each asserting outcome AND Notice kind; N1-N7; give-up pair + 3 controls; R-Q3 cases incl. absent / non-string / embed inside a hover / redraw with stale data / fresh mount after outside redraw), `lineMap.test.ts` +6, `reading-mode-host-pin.test.ts`: flip 1 split (non-adjacent saves, adjacent refused), flip 2 re-modelled with `host.rebind` (it still saves through the unique-body fallback).
- G-S99 (8 cells), CHANGELOGs (dse + superproject), proposal `sc607-dse-verify-proposal.md`.

## Measured
- Jest sweep alone ~53 s. Fresh-worktree full jest 71-123 s.
- G-S99 on the branch: 8/8 first run, 72 s alone; part 6 297 s.
- G-S99 on base: 6/8 red on 3ad68185 (run 1: (d) green, refused with the Notice), 7/8 red on the two later runs, 7/7 non-control red on 622b0904.

## Mutants (sc607-r2-mutants.log; sc607-r2-mutate.py.txt)
Killed: M1 no tail map in rebase (17 tests), M1b no strict check in pinnedTarget (50), M2 tail = head (67), M3 no link agreement (64), M4 metaMatchesText always true (1: N1), M6 own write always first (1), M9 rebind no snapshot (1), M10 own-write pins not strict (1), M11 drawn placement by current cache (10), M12 no own-write fallback (247), M13 no drawn position (25), M14 no uniqueness check (3), M15 only drawn text checked (1), M16 only note-now checked (1), M17 give-up always refuses (2), M20 guard refuses on absence (220), M21 guard never refuses (1), M23 guard applied to embeds (killed by the embed-in-hover test), M24 non-string data used (220), M25 guard off (1), M26 guard without the "data holds the part" test (1), M27 guard also on re-bind snapshots (53).
Survived: M5 (no whole-part branch: equivalent, whole === section returns earlier); M7 (snapshot always first: equivalent here, both positions are true); M8 (strict miss falls back: covered by SC-480 `twinned`/`landsOnOtherBlock`, defence in depth, R-Q6); M18 (`!== 1` -> `> 1`: equivalent, the known body is at least once in a text the link or own write confirmed); M19 (fallback also for 'deleted'/'disagree': differs only for a block moved with a unique body whose link places it, which writes that same unique counter; not constructible in jest); M22 (guard also on own-first: reachable only for a redraw with no rebind, which Obsidian does not do).

## Notes for the owner
- The R-Q3 refinement: new residual (2) a redraw from a changed part whose new text also occurs in the stale `embed.data` (identical counter) is refused (safe Notice).
- A debug trace in a scratch bundle showed at G-S92 (e) second +: drawn snapshot seq 3 (rebind), shown length equal, `eq:false`.
- G-S91 flake evidence: sc607-r2-gs91-flake-on-base-run4.log, sc607-r2-gs91-flake-on-branch-alone-run1.log, sc607-r2-gate-lifecycle-p5-run-G-S91-fail-3.log (earlier-base: -fail-2, run1-G-S91-fail).

## Drive-by fixes
None.

## Follow-ups
- G-S91 timing flake ("title rv ... the preview was gone", second click 35-53 ms after the opening click): reproduces on base (1 of 4 alone); worth a ticket.
- Jest models that redraw with `section.current = ...` without `host.rebind` remain in `reading-mode-host-form-pin.test.ts` (line ~170, "part redrawn after +") and `reading-mode-host-hover-card.test.ts` (lines ~193, 335, 557); not touched here.
- Embed race window (6.8-7.9 ms) is not closed (no popover data for embeds); 0/6 race trials hit it.
- G-S99 cell (d) was refused at base in one of three runs (base nondeterminism for block-hover swaps).

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/)
sc607-r2-impl-report.md, sc607-dse-verify-proposal.md, sc607-r2-jest-red-on-base.log, sc607-r2-lifecycle-gs99-on-base.log (+ -run2-records, -run3-records, superseded 3ad68185 log), sc607-r2-gate-{tsc,lint,jest-1,e2e,shots,freeze}.log, sc607-r2-gate-lifecycle-p1..p6.log (final, on 622b0904; *-on-231f2a3b / *-prefix-change are earlier-base runs), sc607-r2-mutants.log, sc607-r2-mutate.py.txt, sc607-r2-run-mutants.sh.txt, G-S91 flake logs.
