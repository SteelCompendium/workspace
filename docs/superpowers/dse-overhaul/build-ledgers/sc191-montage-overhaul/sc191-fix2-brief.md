# SC-191 fix round 2 — the mock's action bars: End round, Undo, Reopen/Clear all; ⋯ dedup

You are the `orchestration:implementer` that built slice 4 (or a fresh replacement). Final
text goes to the SC-191 ticket-owner (an agent): raw facts, no prose. **Never call the
tracker (Linear).** You cannot message the ticket-owner; if you need input, end with
`STATUS: NEEDS_CONTEXT` and the question at the top of your report. A stray message's FIRST
WORD must be `SC-191:`.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
  — read the LAST entry (2026-09-03 "slice-4 follow-ups … FOLDED into fix round 2"); it is
  this round's definition. Spec `sc191-impl-spec.md` §D/§F; your own `sc191-slice4-report.md`.
- The authority for behavior and placement is the settled mock:
  `visual-harness/sc191/mock6.js` — the bottom action bar (~lines 1440–1470: `Undo`,
  `End round N`, `Log an action…`) and the done-state bar (~lines 1415–1430: `Reopen`,
  `Clear all` danger). Read those functions in full and mirror them — DOM order, labels,
  icons, danger styling, disabled states.
- Worktree (verify `pwd`; write nothing under `workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `69eb93f`, base `origin/develop` `69eb5f7`. `git fetch
  origin develop` first; if it moved (SC-202 landed), rebase and say so.

## 2. Task (all four, one commit)

1. **`End round N`** in the bottom action bar: advances `current_round` by 1 (model
   function, delta-only write through the existing path). It is the ONLY way to advance a
   round; the model currently never advances (`model.ts` touches `current_round` only on
   parse/reset — confirm and cite). Label shows the round being ended (`End round 3`).
   Disabled/hidden when the montage is complete; `data-dse-readonly` → real-disabled. When
   ending the last round makes the montage exhausted, the outcome band resolves exactly as
   `montageOutcome` already defines. The sheet keeps logging into `current_round`.
2. **`Undo`** in the bar: removes the most recently logged entry (by log order — decide the
   tie-break from the model's entry order and say so) and restores tallies via the existing
   `removeMontageEntry`; disabled when there is nothing to undo; read-only disabled.
3. **Done-state bar**: when the montage is complete, the bar stands down to `Reopen` +
   `Clear all` (danger) per the mock and spec §F's `done` fixture. `Reopen` = whatever the
   mock defines; if the mock only draws it, implement: exhausted-by-rounds → `addMontageRound`
   (extends `rounds` by 1 and the montage is live again); ended by a limit → `Reopen` is not
   shown (limits are final; `Clear all`/`Reset progress` is the way back). Say which case
   you found in the mock.
4. **⋯ menu dedup**: remove `Clear all` from the chrome panel (`view.ts` ~line 210); the
   ⋯ carries exactly add a round / add a hero / set limits… / Reset progress. `Clear all`
   lives only in the done-state bar and calls the same `resetMontageProgress`.

Tests (red before green, say so): advance increments and stops at completion; undo removes
the last entry and restores tallies; done-state bar swaps in and Reopen behaves per (3);
⋯ item set is exactly four; read-only disables the new controls; a11y labels present.
Update the `done` fixture/capture if the bar changes its render; update
`docs/gm-trackers.md` (plain language: ending a round, undoing, reopening) and the dse
changelog line if it enumerates controls.

Out of scope: everything else. SC-294 (harness Modal shim) is filed — do not touch it.

## 3. Gates

Full `dse-verify` battery on the final tree, output to files, plain bash/node for exit-code-
sensitive steps (devbox swallows `$?`); host-copy pin abort is the known machine condition
(SC-202's fix not landed) — capture completes before it; list which in-run assertions
printed OK. Expected: tsc/lint clean; jest ≥ 3626/1 plus yours; shots 508 (+ any new
capture id) byte-identical ×2; freeze exactly the 2 montage print lines; parity 0/0/16.
Regenerate `rebaseline.txt`, `widening.txt`, and the crops from the final tree if any
montage print capture changed (the `done` print will, if the bar changed) and verify them
against both runs. Never edit the baseline; never touch the pin/listings/asar.

## 4. Commit + report

One commit: `SC-191 fix 2 — End round, Undo, Reopen/Clear all bars; ⋯ dedup`. No push, no
tags, no trailers, superproject pointer untouched. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix2-report.md`
(≤10-line executive summary first; per item what changed with file:line, the test and its
red-then-green; gate numbers; freeze package status; Drive-by fixes / Follow-ups; artifact
paths). Return per that structure: `STATUS`, base sha, commit sha, report path, executive
summary verbatim, gate numbers, package paths. If the report write is blocked, return it
inline. Footguns: never background a gate and wait; no scratch-filename wait loops;
redirect long output to files.
