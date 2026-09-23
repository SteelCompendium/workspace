# SC-334 review 1 — brief (independent reviewer, orchestration:reviewer)

You are reviewing SC-334 (DSE Montage Card cleanup). You never read or post to the
tracker (Linear) — everything you need is in files.

## 1. Context loading

- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc334-montage-cleanup/sc334-decisions.md`
  FIRST — Scott's ticket text verbatim, the measured root causes, and owner rulings R-1..R-7.
  Review against those; do not re-litigate a ruling unless it is a correctness defect.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc334-montage-cleanup` — the dse
  submodule is at `.../draw-steel-elements`, branch `sc334-montage-cleanup`, three commits
  on `origin/develop` `d124cc3`: `22aaae7` (harness camera), `99b1532` (fix), `e6c551c`
  (docs). Diff: `git -C <dse> diff d124cc3..HEAD`. **Verify `pwd` before any write.**
  Do NOT rebase or commit; this is a read/probe review. Scratch edits for can-fail probes
  must be reverted byte-clean (`git diff` empty) before you finish.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (the battery, devbox wrapping, the exit-code footgun, stale `main.js` shadowing jest).
- Workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc334-montage-cleanup/` — never under
  `/home/scott/code/steelCompendium/workspace/` (except this ledger dir).

## 2. The task

Execute and probe, not just read. Find correctness defects, regressions, and gaps in:

1. `LogActionModal.ts` — three fields only (Result/Skill/Note); hero/round fixed at open;
   M-1 guard 2 (round bound) still holds; edit mode never moves an entry; skill-reuse
   warning still correct; the new-mode sub-line (R-3) is true for every opener
   (bar, row +, empty current cell, quick trio does not open the sheet, past-empty cell).
2. `model.ts` `montagePreviousRound`/`backMontageRound` + `view.ts` `buildBackButton` —
   probe edge cases: round 1, rounds exhausted, a limit reached mid-round, hand-edited
   `current_round` > rounds+1, `rounds: 0`/1, read-only host (must render real-disabled,
   never omitted when applicable), interplay with Undo / End round / Reopen / quick trio /
   the row "+" button / R-2 past-cell logging after going back, `nextHeroToAct`, the outcome
   band's "hero actions left" figure after Back with entries in the round left behind.
   Does anything render wrongly for entries sitting in a now-"future" round?
3. CSS — `styles-source.css`: the failure-slot fill (R-5), goal-cap removal, the
   `.dse-modal__body` padding/negative-margin (R-6 — check EVERY DSE modal, not just
   montage: stamina, conditions, form editor, reset-encounter, legacy-compendium,
   compendium-migration, minion pool, add-hero, set-limits; look for any modal whose
   layout or scroll behaviour this changes), the SC-202 GROUP 1 / GROUP 2 move (R-7) and
   the `.dse-mt__sheet-rollchar` retirement (dangling selectors? comment counts accurate?).
   Light AND dark: the red fill's contrast against the empty slots and the track ground.
4. Harness — `obsidian-camera.mjs` modal overflow check: can-fail it (it already failed on
   the base tree; confirm the message names the right elements), and check it cannot
   false-positive on a modal whose body legitimately scrolls VERTICALLY.
5. Tests — are the new tests able to fail? Pick at least two and prove it by a temporary
   source revert.
6. Docs — `docs/gm-trackers.md`, `docs/migrating-to-7.md`, `CHANGELOG.md` (dse), and the
   workspace `CHANGELOG.md` in the worktree superproject: accurate to the shipped behaviour?

Real-Obsidian camera (only if you need it): it runs on a PRIVATE Xvfb — never display :1.
The owner's wrapper is
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/39e9758e-af5c-4490-a2ab-3a5ccb229f53/scratchpad/sc334-modalcam.sh <outdir> <modal-id>...`
(builds main.js — run `rm -f main.js styles.css` in the dse root before any later jest).
Use your own outdir under your own scratch path.

## 3. Gates (numbers at dispatch)

Battery on this branch (owner run r1, 2026-09-23): see
`.superpowers/sdd/sc334-montage-cleanup/sc334-battery-r1.md` for the measured numbers
(tsc/lint clean; jest / shots / freeze / parity as recorded there). Expected: freeze
0 FAILED (no print byte may move — R-5 left print untouched), parity 0 GAPs / 0
undeclared / 16 DECLARED / exit 0. Re-run whatever you need to confirm; report any
difference with its cause.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc334-montage-cleanup/sc334-review1-report.md`.
Open it with a ≤10-line executive summary (verdict + counts by severity). Then findings by
severity (HIGH/MED/LOW/INFO), each with file:line, a concrete failure scenario, and a
prescribed fix. If the report-file write is blocked by your harness, return the report
inline.

## 5. Return contract

Your final text goes to the owner, not a human: raw facts only — verdict, finding counts,
shas measured, gate numbers — plus the filesystem path of every evidence artifact you
produced.

Footguns:
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will
  match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream
  watchdog kills silent agents.
- Run gates in the FOREGROUND. Do not start a job in the background and wait for a
  notification — it will not come.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message
  anyway, its FIRST WORD must be `SC-334:`.
- Never `rm -rf` the shared `.superpowers/` dir — only files you created.
