# SC-607 r4 fix report

**Executive summary**
- Status DONE. dse branch head **c329ff35** on origin/develop **dcc53f0f** (rebased onto d0561a68, then 711844f3, then dcc53f0f during the round, no conflicts). Superproject head **807cec69** on origin/main **f108e5e9** (two CHANGELOG commits; no dse pointer commit, ` M draw-steel-elements` left unstaged).
- F1 ACCEPTED+pinned (8 move cells, both CHANGELOGs, proposal). F2/F3/F4 documented in the proposal (residuals 3/4/5). F5 fixed (both CHANGELOGs: non-absolute headline, new refusals named, stale SC-594 sentence removed; proposal restated). F6: P19b kills N6, move cells kill M19, N10/N14/N7 tests added and kill their mutants; N11 equivalent; N1, N15 classified. F7 fixed + tested (also kills N2). Redraw tests re-modelled with `host.rebind` (hover-card J5, J17, J18; form-pin 12 cells): all pass; N18 recorded equivalent in Obsidian states.
- jest **11595 passed / 2 skipped** fresh (10787 base + 808; warm run 11596 / 1). tsc (incl. e2e) and lint clean. e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.
- Lifecycle 61/61 on dcc53f0f: 21 / 16 / 9 / 4 / 7 / 4 in 187 / 327 / 408 / 298 / 395 / 298 s (part 6 `G-S92 G-S96 G-S97 G-S99`). styles.css `5e5ff488...dc2b27` = clean dcc53f0f build, so shots/freeze/parity carry (not re-run).
- Red on base (dcc53f0f host sources): new jest 201 failed of 816 (includes the 8 move cells and the new tests); G-S99 on the dcc53f0f bundle 0/1 ok (red).
- Mutants (r2 M1-M27 + r3 N1-N18 that exist = 41): 32 killed, 9 survived (M5, M7, M18, M22, N11, N15 equivalent; N18 equivalent in Obsidian states; M8, N1 defence in depth).
- No product-code change beyond F7. No different-counter write exposed by the new tests. G-S91 (SC-616) flaked once on 711844f3 part 5 (rerun green); green on dcc53f0f.

## Commits (dse, over dcc53f0f)
17771c85 tests + F7 code + redraw re-models; c329ff35 CHANGELOG + N10 test fix. (Earlier r2 commits unchanged: 259f42f2 ... 7f8a0dc3.) Superproject: 424f0905 (r2 entry), 807cec69 (r4 entry).

## Findings
- **F1** moved section: no code change. `describe('a moved section whose preview stays open is refused...')`: hover and embed x heading and block link x "to the end" / "below another section", each: note unchanged, one "changed on disk first" Notice. Red on base (base saved). Kills M19 (6 tests).
- **F2/F3/F4:** proposal residuals 3, 4, 5 (F2, F3 refusal, F4); no code.
- **F5:** dse `CHANGELOG.md` and superproject `CHANGELOG.md`: headline "no longer writes into a different, identical counter in the shapes below", one sentence that rare timing races remain, refusals named (moved section, adjacent block, >400-line change with a twin, unrelated edit in the first ~0.1 s of a hover, could-not-be-placed); the SC-594 "Known limit (SC-607 ...)" sentence replaced by "placed the same way (SC-596; the preview-left-open case is fixed by SC-607)". Proposal restated (residuals, refusals, mutants, G-S91, CURRENT block).
- **F6:** P19b (hover and embed): block form on the upper of two adjacent identical blocks, upper deleted, Save: refused; kills N6 (2 tests). Whole-note strict pin (embed whose part is the whole note, form on the upper adjacent block, upper deleted): kills N7. Whole-note-as-drawn (part == note at mount, a paragraph appended, + saved): kills N14. End-of-text cache check (cache ends before the appended paragraph; first version through a hover was refused first by the popover data and did not kill N10; now through an embed): kills N10. N11 equivalent: trimming a common head or tail never changes the minimal edit distance and reversing both texts does not either, so head-first and tail-first give up on exactly the same pairs. N1 defence in depth (no re-bind lands between a pin and its rebase read). N15 equivalent (`?? ownFrom()` fallback).
- **F7:** `onRenderChildUnload` now also clears `drawnRead` and `drawnToken`; test `a card unloaded before its note read resolved holds no snapshot afterwards` (also kills N2).
- **Redraw tests:** `hovered()` in `reading-mode-host-hover-card.test.ts` returns `redraw(sec)` (sets the section, `host.rebind(host.containerEl, ctx)`, settle); J5, J17 (second), J18 use it. `reading-mode-host-form-pin.test.ts`: the 12 "+ (part redrawn after +)" cells (x constructs, via the sweep cell function) rebind. All 4047 tests of the three suites pass. **N18** survives now (the 14 tests that killed it reached own-write-first through a redraw with no re-bind, a state Obsidian does not produce; with the link placing, own-first differs from drawn-first only for such a state, since after a real redraw the re-bind snapshot is newer). Recorded equivalent.

## Mutants (sc607-r4-mutants.log; sc607-r4-mutate.py.txt; sc607-r4-run-mutants.sh.txt)
Killed (failing tests): M1 17, M1b 53, M2 70, M3 66, M4 2, M6 1, M9 1, M10 1, M11 10, M12 247, M13 26, M14 3, M15 1, M16 1, M17 2, M19 6, M20 172, M21 1, M23 1, M24 172, M25 1, M26 1, M27 53, N2 1, N4 247, N6 2, N7 1, N8 49, N9 1, N10 1, N14 1, N16 1.
Survived: M5, M7, M18, M22, N1, N11, N15, N18, M8 (reasons above; M5 whole === section returns earlier; M7 both positions are true positions; M18 the known body is at least once in a text the link or own write confirmed; M22 own-first only with no re-bind; M8 strict miss no-fallback, R-Q6, covered by SC-480 `twinned`).
M1-M17, N1-N2, N6-N11, N14-N16, N18 ran on d0561a68; M18, M20-M27, N4, N8, N9 on the branch rebased onto 711844f3; the host sources are identical in both (checked: no diff in ReadingModeBlockHost.ts, hoverLinks.ts, lineMap.ts).

## Gates (final, dcc53f0f; logs `sc607-r4-gate-*.log`)
tsc + lint clean; jest 11595 / 2 fresh; e2e 304/307; lifecycle p1..p6 as above; styles sha identical. Shots / freeze / parity: carried (r2 measured shots 592, host-leak 163/978, modal 39/234, clip 147, freeze 280/280 on the same styles.css).
Earlier-base logs: `sc607-r4-prev-base-711844f3/` (tsc, lint, jest, lifecycle p1-p5 incl. the G-S91 flake run `p5-run1-G-S91-fail`).

## Drive-by fixes
None.

## Follow-ups
- Whole-note / SC-612, SC-616 G-S91 flake, SC-619 CRLF: not touched (filed).
- `sc607-r4-gs99-on-base-dcc53f0f.log`: G-S99 red on the dcc53f0f bundle.

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/)
sc607-r4-fix-report.md, sc607-dse-verify-proposal.md (+ sc607-dse-verify-proposal-r2.md.txt), sc607-r4-gate-{tsc,lint,jest-1,e2e}.log, sc607-r4-gate-lifecycle-p1..p6.log, sc607-r4-jest-red-on-base.log, sc607-r4-gs99-on-base-dcc53f0f.log, sc607-r4-mutants.log, sc607-r4-mutate.py.txt, sc607-r4-run-mutants.sh.txt, sc607-r4-prev-base-711844f3/.
