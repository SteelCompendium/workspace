# SC-650 r6: scoped re-review of the r5 fix delta

## Executive summary
- **Verdict: LAND.** Reviewed dse `1bceaabf` (delta `108d32c4..1bceaabf`: `a616b1a9` fix + tests, `1bceaabf` docs; base `a9f0af1d`). Delta counts: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 1 INFO.
- (1) Slow redraw (scratch build, root held back 700 ms or 2500 ms) and normal speed:
  - The own save gives no Notice: MPRE-12 (700 ms), MPRF-01 (2500 ms) and MPRE-12/MPRE-04 at normal speed.
  - Delete-above plus change gives exactly one Notice: MPRE-14 (755 ms with a 700 ms delay; 109 ms at normal speed) and MPRF-02 (2649 ms with a 2500 ms delay).
  - MPRE-10, 11, 13 and 15 each give one Notice and focus on the right Log. Both r4 LOW-A failures are fixed.
- (2) **LOW-C:** the montage's OWN save does redraw a sibling. Two montages, or two trackers, in one Live Preview callout are rebuilt together: the root identity check reads `NEW, NEW` (MPRG-10; MPRG-14 four times out of four). At normal speed this gives no false Notice (MPRG-10, MPRG-14 four times, MPRF-10, MPRF-14). When the redraw is held back (700 ms per root), the own write does show the Notice: MPRG-11 (montage, SC-384 path) and MPRG-15 (initiative, a plain Conditions add, a common path). So "never on an own write" holds only while the roots of a callout are created in the same turn. Plain fences keep the sibling (`old0`, MPRG-16 and MPRG-17), and so do embeds and Reading view (the window stays open, MPRF-11..13, 16).
- (3) No leak. `before` is reachable only from `windowOpener.slot` / `activeWindow.slot` (cleared at window close) and from the hand-off closure, which `finish()` drops at the TTL or settle (observer, timers and listener removed, holder unloaded).
- (4) Normal speed, no regressions: MPRB-20/21/22/23/24, MPRC-04/05/06, MPRB-08 (`montage.bar.log`), MPRD-01, MPRE-01..04, and all 13 INIT-W in the full e2e.
- (5) **LOW-D:** mutant H3 (no `!noticed` in `act`, `windowHandoff.ts:165`) survives 66/66. A sibling's fallback Notice followed by the slot's own claim would give two Notices. MPRG-20/21 show the real code gives one. The other six mutants are killed.
- Battery at `1bceaabf`: tsc 0, lint 0, jest 13392/1, e2e `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, lifecycle part 4 4/4, part 7 3/3.

## Findings (delta)

### LOW-C: in a Live Preview callout an own save redraws the sibling, so a slow redraw shows the Notice on an own write
- **Where:** `src/framework/chrome/windowHandoff.ts:181-190` (`noticeForNewRoot`: "new since open" plus "content differs from the closing view's").
- **Scenario:** a Live Preview callout holds two trackers. The user adds a condition in the second tracker's Conditions window. The write rebuilds the whole callout widget (SC-545: a callout widget is reused only while its text is unchanged), so BOTH trackers are drawn fresh, and the window closes (SC-384), which starts a hand-off. If the first tracker's root is published before the second's root exists, then at that moment nothing sits at slot 1 and the count is one low. The first tracker's root is new since open, and its content (a different block) differs from the closing view's, so the Notice "The note changed outside..." appears for the user's own write. The same holds for the montage when a window is closed by its own save (the SC-384 path: Log, then a window opened inside 400 ms).
- **Evidence:**
  - Root identity across the own save: `survived: ["NEW","NEW"]` in a callout (MPRG-10; MPRG-14 four times), `["old0","NEW"]` with plain fences (MPRG-16, MPRG-17).
  - Normal speed: 0 Notices (MPRG-14 four times, MPRG-10, MPRF-10, MPRF-14).
  - Roots held back 700 ms each (`dseU` instrumentation): MPRG-11 gave Notice 1 at 1608 ms (montage) and MPRG-15 gave Notice 1 at 1546 ms (initiative).
  - The instrumentation creates the two roots in two separate timer tasks, so it can open a gap between them that may not happen in real use. It shows the rule depends on ordering, not that a real host hits it.
  - Briefed callout montages (MPRG-12/13) were inconclusive: after the Log the callout showed as source, so the second window never opened.
- **Why LOW:** it needs a callout (or any widget that rebuilds several blocks together) holding two or more blocks of the same element, a window closed by the element's own save, and a root ordering that normal speed did not produce. It does mean the owner's "hard" rule is conditional.
- **Prescribed fix (timing-free; cheap):** a new root is news only if its content matches NO root that was there when the window opened. Record `beforeContent` at open (`new Set([...before].map((r) => mounted.get(r)?.content()))`), or read the old roots' records at hand-off time (their views keep their disk content). Then require `!beforeContent.has(content(fresh))` alongside `content(fresh) !== ownContent`.
  - A sibling redrawn by the own save has its old content, so it is silent.
  - Delete-above plus change: the redrawn card's content is new, so the Notice shows.
  - A Sync that changed the sibling: its content is new, so the Notice shows. That is true, since an outside edit happened.
  - Edge case: an outside edit that makes the open block identical to a sibling's old content would be silent. That is acceptable.
  - Add a jest case: callout-style rebuild, sibling republished first with unchanged content, then the own root with the closing content; expect 0 Notices.

### LOW-D: mutant H3 survives. The `!noticed` guard in `act` is untested
- **Where:** `src/framework/chrome/windowHandoff.ts:165`.
- **Scenario if it regresses:** one outside edit changes both montages, and the sibling's redrawn root arrives before the window's own. The sibling's root gives the fallback Notice; then the own root lands at the slot with different content, and `act` gives a second Notice. MPRG-20 (normal speed) and MPRG-21 (700 ms) both show exactly 1 Notice and focus on the second card's Log at head.
- **Evidence:** H3 passes 66/66. The implementer's G3 mutated the fallback's own guard, not `act`'s.
- **Prescribed fix:** jest OW18h. Two montages, window on the second, both changed; republish the first, then (literal 120 ms later) the second. Expect exactly one Notice, and focus on the second's Log.

### INFO
- **I-1 (the leak question):** retention is bounded by the window's life plus the TTL. While a window stays open, `before` holds the roots of siblings that were redrawn in that time (detached nodes), until the window closes. This is fine.

## Probe table (real Obsidian 1.14.4; `dseT` = `1bceaabf` as-is, `dseU` = plus the scratch delay at `pipeline.ts:468`)
| Probe | Build | Case | Measured | Verdict |
|---|---|---|---|---|
| MPRE-12 | U 700 | LP two montages, own save closes a window | Notice 0 | fixed |
| MPRF-01 | U 2500 | same | Notice 0 | fixed |
| MPRE-04 / MPRE-12 | T | same, normal speed | 0 / 0 | ok |
| MPRE-14 | U 700 / T | LP delete-above + change | 1 at 755 ms / 1 at 109 ms, focus `<body>` | fixed |
| MPRF-02 | U 2500 | same | 1 at 2649 ms | fixed |
| MPRE-10 / 11 / 13 / 15 | U | change of the second, LP / RV / one montage / 2500 ms | 1 Notice each (916 / 884 / 944 / 2602 ms), focus on the right Log | ok |
| MPRG-10 | T | LP callout, two montages, own save | sibling `NEW`; Notice 0 | sibling redrawn |
| MPRG-11 | U 700 | same | **Notice 1 at 1608 ms (own write)** | LOW-C |
| MPRG-14 (x4) | T | LP callout, two trackers, Conditions add | sibling `NEW`; Notice 0, window closed (SC-384) | sibling redrawn |
| MPRG-15 | U 700 | same | **Notice 1 at 1546 ms (own write)** | LOW-C |
| MPRG-16 / 17 | U 700 / T | LP plain trackers, same | sibling `old0`; Notice 0 | ok |
| MPRF-11 / 12 / 13 / 16 | T | RV callout / LP embed / RV embed / RV callout initiative | window stays open, no hand-off, Notice 0 | ok |
| MPRF-17 | T | LP identical twins, own save | Notice 0 | ok |
| MPRG-20 / 21 | T / U 700 | LP, one edit changes both montages | Notice 1 (120 / 741 ms), focus on the second's Log | ok (LOW-D guard) |
| MPRB-20/21/22/23/24, MPRC-04/05/06, MPRB-08, MPRD-01, MPRE-01..03 | T | r2/r4 regression set | as in r4 (MPRB-08 Log; MPRB-21, MPRC-04, MPRC-05 Notice 1) | ok |

Harness noise in these runs: the MPRD-01 and MPRF-11/12/13/16 "FAIL" lines are the driver's orphaned-modal invariant, because my probes left a window open. They are not product claims.

## Battery (dse `1bceaabf`, review worktree)
| Gate | Measured | Expected |
|---|---|---|
| tsc / lint | rc 0 / rc 0 | clean |
| jest | 13392 passed / 1 skipped, rc 0 | 13392/1 |
| e2e full | `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, rc 0; INIT-W 13/13 | same |
| lifecycle part 4 / 7 | 4/4 rc 0 / 3/3 rc 0 | 4/4, 3/3 |

## Mutants (jest `montage-outside-edit` + `initiative-outside-edit`, 66 tests, worktree `dseV`)
| Mutant | Result |
|---|---|
| H1 ignore `before` | killed (OW18c, OW18e) |
| H2 no count check | killed (OW18g) |
| H3 `act` ignores `noticed` | **survives** (LOW-D) |
| H4 no content check | killed (OW18f) |
| H5 no new-root Notice | killed (O20b, OW18b, OW18d) |
| H6 "new" means "not the old root" | killed (OW18c, OW18e) |
| H7 no once guard in the fallback | killed (O20b, OW18b, OW18d) |

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/`)
- Battery: `r6-head.txt`, `r6-tsc.log`, `r6-lint.log`, `r6-jest.log`, `r6-e2e.log`, `r6-life-part4.log`, `r6-life-part7.log` (each with `.rc`).
- Probe specs: `zz-r6-probes.e2e.ts`, `zz-r6b-probes.e2e.ts` (plus `zz-r4-probes.e2e.ts`, `zz-r2-probes*.e2e.ts`).
- Probe results: `probe-results-r6t.jsonl`, `probe-results-r6u.jsonl`, `probe-results-r6g.jsonl`, `probe-results-r6h2.jsonl`, `probe-results-r6rep1..3.jsonl`, `probe-results-r6dbg.jsonl`.
- Probe runs: `probe-run-r6*.log`.
- Mutants: `r6-mutants.py`, `r6-mutants.out`, `r6-mut-H1..H7-*.log`.
- Scratch worktrees at `1bceaabf` (detached, registered in the dse git dir; `git worktree prune` once the scratchpad goes): `dseT`, `dseU` (uncommitted delay instrumentation), `dseV` (mutants, restored). The review worktree was left as found.
