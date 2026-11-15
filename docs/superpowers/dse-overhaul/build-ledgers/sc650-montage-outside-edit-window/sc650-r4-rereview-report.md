# SC-650 r4: scoped re-review of the r3 fix delta

## Executive summary
- **Verdict: LAND.** Reviewed dse `108d32c4` (delta `9a7eca00..108d32c4`). `git range-diff 5f962390..69ffe410 a9f0af1d..9a7eca00` shows all six r1 commits as `=`, so their content is identical to what r2 reviewed. Delta counts: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 2 INFO.
- (1) Fixed at normal speed. Delete-above plus change now shows exactly one Notice, and focus is not moved: MPRB-21 (RV), MPRC-04 (LP), MPRE-14 (LP, Notice at 417 ms), MPRC-05 (initiative).
- (2) Slow redraw, measured with scratch instrumentation that delays the montage root by 700 ms or 2500 ms. No double Notice, and focus still reaches the right control (MPRE-10, MPRE-11, MPRE-13, MPRE-15). But **LOW-A**: when the redraw takes more than 400 ms, the one-shot fallback (a) shows the Notice on the montage's OWN save in a note with two montages (MPRE-12), which breaks the "never on an own write" rule, and (b) misses the delete-above case it was added for, giving 0 Notices (MPRE-14 slow).
- (3) At normal speed the fallback never fires on an own write (MPRE-02, MPRB-16), on Escape (MPRE-01, MPRB-14, MPRB-15), on an edit elsewhere that leaves the window open (MPRE-03, MPRB-10..13), or on an own save that closes a window (MPRE-04).
- (4) No regressions: MPRB-20, 22, 23, 24, MPRC-06 and MPRD-01 behave as in r2. MPRB-08 now puts focus on `montage.bar.log` (LOW-3 fixed). An own Log that makes every hero act lands on End round (MPRE-02, the SC-626 rule).
- **LOW-B**: jest does not test the fallback's guards. Mutants F1 (fallback at 1 ms), F2 (no count check), F3 (no de-duplication) and F4 (no content check) each pass 62/62. Only F5 (no fallback at all) is killed.
- (5) The 400 ms timing works on a normal host, but it fails both ways once a redraw is slower (LOW-A). A cleaner signal than time exists: a root that was not in the pane when the window opened.
- Battery at `108d32c4`: tsc 0, lint 0, jest 13388/1 warm, e2e `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, lifecycle part 4 4/4, part 7 3/3. No CSS or DOM change, so shots, freeze and parity were not re-run.

## Findings (delta)

### LOW-A: a fixed 400 ms one-shot gives the wrong answer whenever the redraw is slower than that
- **Where:** `src/framework/chrome/windowHandoff.ts:90` (`HANDOFF_FALLBACK_MS = 400`), `:184-194` (`noSuccessorAtSlot`: any live root of the note in the pane, compared with the closing view's content), `:205` (a single `setTimeout`).
- **Failure 1, a false Notice on the montage's own save (breaks the SC-608 ruling "never on the element's own write"):** in a Live Preview note with two montages, the user logs on the second montage. Within the 400 ms write window they open Add a hero on it. That is SC-384: the own save rebuilds the widget and closes the window, so a hand-off starts with the same content. If the new widget takes more than 400 ms, the fallback finds the FIRST montage, which was never touched. Its content differs from the second's (it is a different block), so the Notice "The note changed outside..." appears for the user's own write.
  - **Measured:** MPRE-12 (redraw delayed 700 ms) gave `notices 1` at 874 ms. Control MPRE-04 (the same steps at normal speed) gave `notices 0`. The initiative tracker has the same exposure (shared code; its Live Preview windows can be closed by its own save, SC-384). Not probed.
- **Failure 2, the LOW-1 case missed when the redraw is slow:** two montages, one edit deletes the first and changes the second, and the redraw takes more than 400 ms. When the fallback runs, no root of the note is in the pane yet, so it does nothing, and it never runs again. The redrawn card then arrives at index 0, `find()` looks at index 1, and nothing is ever shown. This is the r2 behaviour again.
  - **Measured:** MPRE-14 slow (700 ms) gave `notices 0`. At normal speed it gave `notices 1` at 417 ms.
- **What holds:** no double Notice and focus is right when the real claim comes after the fallback (MPRE-10 LP: Notice at 452 ms from the fallback, focus on the second card's Log; MPRE-15, 2500 ms: Notice at 432 ms, focus on the second Log at 2.5 s, still inside the TTL). One montage: MPRE-13 gave one Notice at 785 ms and focus on Log. RV: MPRE-11 gave one Notice at 760 ms and focus on the second Log.
- **Why LOW:** it needs a Live Preview widget slower than 400 ms (10-45 ms measured normally; the root is created early in `pipeline.run`, and an unpublished root still counts) plus two or more blocks of the element in the pane. Nothing is lost.
- **Prescribed fix (drops the timer):** take a cleaner signal than time. Store the roots of the scope in `WindowSlot` when the window OPENS (`slotOf`: `before: Set<HTMLElement>`). In `attempt()`, when `find()` returns nothing and the count changed, look for a root of the same `sourcePath` that was **not** in `before` and whose content differs from `ownContent`. If one exists, show the Notice once (`noticed = true`) without claiming it, and keep watching the slot for the focus successor until the TTL.
  - The Live Preview transient never matches: the only root present then is the untouched sibling, which was in `before`.
  - The delete-above case matches whenever the redrawn card arrives, fast or slow.
  - An own save never matches: the sibling is old and the successor has the same content.
  - Side effect for the owner: the Notice for "the edit deleted the window's own block while another montage remains" goes away. Only untouched siblings remain, so that case returns to OW16's "nothing". The r2 ruling accepted that Notice; it did not require it.
  - If the owner keeps the timer instead: at minimum, re-run `noSuccessorAtSlot` on every mutation after the 400 ms mark (fixes failure 2), and require a root that is not in `before` (fixes failure 1).

### LOW-B: the fallback's guards are untested (four mutants survive)
- **Where:** `test/dom/elements/montage-outside-edit.test.ts` OW18b and OW18c, `initiative-outside-edit.test.ts` O20b.
- **Evidence:** jest `montage-outside-edit` + `initiative-outside-edit`, 62 tests:
  - Survive: F1 (`HANDOFF_FALLBACK_MS = 1`), F2 (the `roots.length === o.slot.count` return removed), F3 (`!noticed` removed in `act`, which allows a double Notice), F4 (the content check removed from the fallback).
  - Killed: F5 (no fallback), 2 red (OW18b, O20b).
  - OW18c, the test meant to pin the timing, uses two identical blocks (`BASE`, `BASE`). An early fallback finds a sibling with the SAME content and stays silent, so the test cannot tell 1 ms from 400 ms.
  - OW18b and O20b wait `later(HANDOFF_FALLBACK_MS + 100)`, which is the product's constant and against the dse-verify rule (literal gaps).
- **Prescribed fix (whichever design lands):**
  - (a) A Live Preview transient where the sibling's content DIFFERS and the slot's successor has the closing view's content (an own save): advance a literal 120 ms, then 0 Notices; after the successor lands, still 0. This kills F1 and F4.
  - (b) A redraw after the fallback window (successor at a literal 700 ms with changed content): exactly 1 Notice, and focus on the successor. This kills F3.
  - (c) The count unchanged and nothing at the slot (an unpublished root, as in OW08) past the fallback: 0 Notices. This kills F2.
  - Use literal times.

### INFO
- **I-1:** the LOW-3 fix works in real Obsidian: MPRB-08 now gives `montage.bar.log` (was the card root). LOW-2 is fixed: OW30 exists, and the implementer reports X4 red. MPRD-01 at head: the window stays open.
- **I-2:** the MPRD-01 run "failed" only on the driver's orphaned-modal invariant, because my probe left its window open. It is a probe artefact, not a product claim.

## Probe table (real Obsidian 1.14.4, e2e harness, scratch specs)

`dseQ` is head `108d32c4` as-is. `dseS` is head plus scratch instrumentation: `pipeline.run` waits `window.__dseDelayMount.montage` ms before it creates the root. That simulates a slow redraw, and the delay is armed only by the probe.

| Probe | Case | Measured | Verdict |
|---|---|---|---|
| MPRB-21 | RV, delete the first montage + change the second | Notice 1, focus `<body>` | fixed |
| MPRC-04 | LP, same | Notice 1 | fixed |
| MPRE-14 | LP, same (normal speed) | Notice 1 at 417 ms, focus `<body>` | fixed |
| MPRC-05 | initiative, two trackers, same | Notice 1 | fixed |
| MPRE-14 (dseS, 700 ms) | LP, same, slow redraw | **Notice 0** | LOW-A (2) |
| MPRE-10 (dseS, 700 ms) | LP, window on the second, edit changes it | Notice 1 at 452 ms (fallback), focus on the second's Log, ring | ok, no double |
| MPRE-11 (dseS, 700 ms) | RV, same | Notice 1 at 760 ms, focus on the second's Log | ok |
| MPRE-15 (dseS, 2500 ms) | LP, same | Notice 1 at 432 ms; focus on the second's Log after the claim | ok, no double |
| MPRE-13 (dseS, 700 ms) | LP, one montage | Notice 1 at 785 ms, focus on Log | ok |
| MPRE-12 (dseS, 700 ms) | LP, own Log on the second + Add a hero closed by the own save (SC-384) | **Notice 1 at 874 ms on an own write** | LOW-A (1) |
| MPRE-04 | the same at normal speed | Notice 0, focus on the opener (`montage.chrome.add-hero`) | ok |
| MPRE-01 | RV two montages, window on the second, Escape | Notice 0 after 1.2 s, focus on Log | ok |
| MPRE-02 | LP two montages, own Log on the second | Notice 0 after 1.5 s, focus `montage.bar.end-round` (Log disabled: every hero acted) | ok |
| MPRE-03 | LP two montages, edit BELOW | window stays, Notice 0 | ok |
| MPRB-10..13 | edit ABOVE / BELOW, RV and LP | window stays, Notice 0, Log writes, outside edit kept | ok |
| MPRB-14 / 15 / 16 | Escape RV / Escape LP / own Log LP | Notice 0; focus on the opener | ok |
| MPRB-20 | insert between + change the second | Notice 1, focus `<body>` | ok |
| MPRB-22 | window on the first, edit only the second | window stays, Notice 0 | ok |
| MPRB-23 / 24 | identical twins, RV / LP | Notice 1, focus on the second card's Log | ok |
| MPRC-06 | three montages, delete the first + change the second | Notice 1, focus `<body>` | ok |
| MPRB-08 | LP row button, its hero removed | Notice 1, focus `montage.bar.log`, ring | LOW-3 fixed |
| MPRD-01 | sidebar refresh, then a window, then an edit elsewhere | window stays, Notice 0 | ok |

## Battery (dse `108d32c4`, review worktree)
| Gate | Measured | Expected |
|---|---|---|
| tsc / lint | rc 0 / rc 0 | clean |
| jest | 13388 passed / 1 skipped, rc 0 | 13388/1 warm |
| e2e full | `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, rc 0 | `616/629 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` |
| lifecycle part 4 / part 7 | 4/4 rc 0 / 3/3 rc 0 | 4/4, 3/3 |
| shots / freeze / parity | not run (no CSS or DOM change in the delta) | n/a |

## Mutants (jest `montage-outside-edit` + `initiative-outside-edit`, 62 tests, worktree `dseN`)
F1 fallback 1 ms: 62/62 pass (survives). F2 no count check: survives. F3 `act` ignores `noticed`: survives. F4 fallback without the content check: survives. F5 fallback never armed: 2 red (OW18b, O20b), killed.

## (5) Is the 400 ms timing sound?
On a normal host, yes: every probe at normal speed is right. As a design it is a guess with a cliff on both sides. Before 400 ms it cannot help a slow delete-above redraw, because it is one-shot. After 400 ms it treats any untouched sibling as evidence of an outside edit. The position-based slot cannot tell "count low because a widget is still coming" from "count low because a block was deleted". A set of roots taken at window open can: a deletion's redrawn card is a NEW root, and a transient only ever shows OLD ones. That signal needs no timer and is right at any redraw speed (see LOW-A's fix). If the owner prefers to land the timer as is, LOW-A should be a follow-up together with initiative, since the code is shared.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/`)
- Battery: `r4-head.txt`, `r4-tsc.log`, `r4-lint.log`, `r4-jest.log`, `r4-e2e.log`, `r4-life-part4.log`, `r4-life-part7.log` (each with `.rc`), `r4-battery.sh`.
- Probes: spec `zz-r4-probes.e2e.ts` (plus `zz-r2-probes*.e2e.ts`); results `probe-results-r4q.jsonl` (head), `probe-results-r4s.jsonl` (slow redraw); runs `probe-run-r4q.log`, `probe-run-r4s.log`.
- Mutants: `r4-mutants.py`, `r4-mutants.out`, `r4-mut-F1-fallback-1ms.log` .. `r4-mut-F5-fallback-never.log`.
- Scratch worktrees at `108d32c4` (detached, registered in the dse git dir; `git worktree prune` once the scratchpad goes): `dseQ` (head plus probe specs), `dseS` (plus the delay instrumentation in `src/framework/pipeline.ts:468`, uncommitted), `dseN` (mutants, restored). The review worktree was left as found.
