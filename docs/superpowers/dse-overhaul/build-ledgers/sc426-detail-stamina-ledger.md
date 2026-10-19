# SC-426 decisions ledger

Ticket: SC-426 — Initiative: editing the selected creature's stamina from its grid cell leaves the
detail row showing the old value. Project DSE 7.0.0. Related: SC-408.
Worktree: /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina (branch sc426-detail-stamina
in every submodule). Base: dse origin/develop f8e050f.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Scott rulings (verbatim, dated)

(none yet — thread empty as of 2026-10-19)

## Ticket spec (verbatim from the description, 2026-10-19)

> **Repro:** initiative quick-start fixture, so Orc #1 is selected and shown in the detail row.
> Double-click Orc #1's grid cell, set Stamina to 10, Apply.
>
> **Expected:** the cell, the detail-row number and the detail-row bar all show 10/40. **Actual:** the
> cell shows 10/40 and the note gets `current_stamina: 10`, but the detail row still reads 40/40 with a
> full bar.
>
> **Cause:** `src/elements/initiative/view.ts:1665-1674` opens the modal with the cell span and
> `barEl=null, rowEl=null`; the Apply callback (~1852-1895) refreshes only the cell.
>
> **Fix direction:** in the callback, also refresh the detail row (number, bar, state chip) when
> `group.selectedInstanceKey === instanceKey`.

## Known-bug markers this ticket must remove (dse-verify known-bug rule)

- e2e/specs/initiative/stamina-entry.e2e.ts:148-153 — knownBug('SC-426', ...) (B2 / S1)
- test/dom/elements/stamina-entry-points-matrix.test.ts:188,193 — two test.failing [E12] markers

## Owner rulings

- 2026-10-19: well-specified bug; no design round. Pipeline: implementer -> independent reviewer ->
  fix rounds -> scoped re-review -> land-ready.

## Expected numbers at dispatch (dse-verify CURRENT, develop f8e050f)

jest 4767 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 61/72 ok, 0 failed,
11 known-bug, coverage 47/47 · shots 572, 0 FAIL · freeze OK (276/276) · parity 0 GAPs / 0 undeclared / 24 DECLARED.
After the fix: e2e expected 62/72 ok, 10 known-bug (marker removed -> plain test). jest: test.failing already counts as passed, so converting the two [E12] markers leaves the count at 4767; any NEW tests add to it.

## Round log

- 2026-10-19 r1 implementer: DONE, head 0d1c0cf on f8e050f (78debdc fix+jest, 93fb45c CHANGELOG,
  0d1c0cf e2e assertion fix). jest 4769/1/227of228 · lifecycle 25/25 · e2e 62/72 ok, 0 failed,
  10 known-bug, 47/47 · shots 572 0 FAIL · freeze 276/276 · parity 0/0/24.
  Deviation: guard uses a DOM stamp (`data-detail-key` + `detailHandlesFor`) instead of
  `group.selectedInstanceKey` — sent to reviewer to judge.

## Owner rulings on r1 follow-ups (2026-10-19)

- dse-verify e2e numbers -> 62/72, 10 known-bug: DROP as a ticket — dispatcher's landing bookkeeping;
  carried in the land-ready report.
- Second 0x0 initiative root outside `.markdown-reading-view` with old values after a write: HOLD —
  reviewer r2 probes whether it is pre-existing on develop f8e050f (not caused by this branch) and
  whether it is a leak; owner then files a Backlog ticket or drops.
- Apply callback calls `updateStaminaDisplay`/`refreshRowStamina` without `group`: reviewer judges;
  fold into fix round if it is wrong for any reachable case, else drop.
- 2026-10-19 r2 reviewer dispatched (orchestration:reviewer) on 0d1c0cf; author-independence: r1 implementer authored, reviewer did not.
- 2026-10-19 r2 reviewer: APPROVE on 0d1c0cf. 0 CRIT/HIGH/MED, 1 LOW, 6 INFO. Gates re-measured
  identical to r1. Mutation: base view.ts fails 4 jest E12 + e2e INIT-STAM-B2 ("60/60").

## Owner rulings on r2 findings (2026-10-19)

- LOW-1 (view.ts:1851-1854 `detailHandlesFor` doc comment overclaims "a row rebuilt while the modal
  was open is still found" — false for a whole-view update()): FOLD into r3, comment only, e.g. "a
  detail row re-drawn by a selection change while the modal was open is still found".
- INFO-1 DOM-stamp guard instead of selectedInstanceKey: ACCEPTED (quick-start fixture has no
  selectedInstanceKey; lookup scoped to the group element; probes pass).
- INFO-2 callback without `group`: DROP — group only read on squad-minion branches, which route to
  MinionStaminaPoolModal.
- INFO-3 0x0 root: DROP — pre-existing on f8e050f, hidden Live Preview widget, registry stays at 2, not a leak.
- INFO-6 CHANGELOG nit (last sentence "Editing a creature the detail row is not showing still leaves
  the detail row alone." describes a case a mouse user can't reach — the double-click selects first):
  FOLD into r3 — delete that sentence.
- INFO-6 main-checkout dirt (workspace/draw-steel-elements: M demo-vault/Welcome.md, untracked
  compendium-manifest.json, demo-vault/montage 1.md, mtime 10:35, not ours): report to dispatcher.
- 2026-10-19 r3 implementer: a89ffd9 (comment + CHANGELOG sentence only, 3+/3-); tsc+lint clean.
  Scoped re-review: owner checked the delta itself. It is non-executable (a doc comment and one
  deleted CHANGELOG sentence), so the r2 gate numbers stand. develop is still at f8e050f, so no
  rebase is needed.
- LAND-READY 2026-10-19: dse sc426-detail-stamina @ a89ffd9 on develop f8e050f.
