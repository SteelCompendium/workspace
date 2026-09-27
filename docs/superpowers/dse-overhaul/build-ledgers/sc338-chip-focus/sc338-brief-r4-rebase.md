# SC-338 round 4 — rebase + full battery (no code change)

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/decisions.md`. Scott approved both
  asks on 2026-09-27 (verbatim in the ledger: "1.  yes / 2. yes"). That means the code does not change: keep the
  unqualified `box-shadow: none` entry, and do NOT narrow it to :focus-visible.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus`. dse branch `sc338-chip-focus` head `c3d36c5`
  (base `6c4f6aa`). Superproject worktree branch `sc338-chip-focus` head `28a155d`.
- You never call Linear. Verify `pwd` before writes; never write under `/home/scott/code/steelCompendium/workspace/`
  except reports in the ledger dir. Commit after every step. No AI attribution in commits.
- Kill only by PID, and only PIDs whose command line contains `worktrees/sc338-chip-focus/` (adapter footgun §8.9).
  Don't start background wait loops. Run every gate in the foreground with output redirected to per-run unique files.

## Task
1. In the dse worktree: `git fetch origin`, then `git rebase origin/develop`. Expect `825ea51`; if it has moved further,
   use the new tip and report it. Conflicts are most likely in `styles-source.css` comments and in the `~:NNNNN` line
   pointers inside the SC-338 comments. After the rebase, re-point those pointers to the real lines. Run `npm ci` if
   `package.json` or the lockfile changed (adapter footgun §8.2).
2. In the superproject worktree: `git fetch origin`, then rebase branch `sc338-chip-focus` onto `origin/main`.
   Resolve conflicts in `CHANGELOG.md` (keep every bullet, and put SC-338's in the right section under `## Unreleased`)
   and in `.claude/skills/dse-verify/SKILL.md`. Keep the SC-338 battery entry, update its numbers to this round's and its
   sha to the new dse head, and keep everyone else's edits. The draw-steel-elements pointer stays uncommitted, as before.
   This also refreshes the superproject docs that tests read (adapter footgun §8.4).
3. Full battery per `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus/.claude/skills/dse-verify/SKILL.md`,
   after your rebase. Run it against dse and record the BASE (`825ea51`) numbers where a count is in doubt. Expected now:
   - tsc and lint clean
   - jest: all green. Report exact counts. A single failure in `sidebarInitiative.test.ts:350` or
     `sidebarEncounterHandoff.test.ts:416` under load is known flake SC-360; re-run once and report both runs.
   - obsidian-lifecycle `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`
   - shots: 0 FAIL, host-copy pin OK/PARTIAL, button host-leak OK. Report the exact count lines.
   - freeze `freeze OK (260/260 …)`. The baseline was rebaselined by others' sanctioned landings, and SC-338 moves no
     print bytes. If ANY line fails, do NOT touch the baseline. Check whether the same line also fails on a clean
     `825ea51` build (i.e. it isn't SC-338's). Report it, and write `sc338-chip-focus/rebaseline.txt` with crops only if
     SC-338 itself moves it.
   - parity LAST: 0 gaps / 0 undeclared / 16 declared, exit 0
   - real-Obsidian camera (private Xvfb and port, never `:1`): `modal-montage-edit` ring-checked ok and
     `modal-montage-limits` ok.
4. Confirm that the chip change survived the rebase intact: `git diff origin/develop..HEAD` shows only the SC-338 hunks
   (styles-source.css, the two guard tests, obsidian-camera.mjs if touched). Also show that the modal chip pixels didn't
   move, with a focused-chip crop in dark and light compared against `evidence-r1` probe-after. Put the crops in
   `evidence-r4/`.

## Report & return
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r4-rebase-report.md`. Open it with an
executive summary of 10 lines or fewer. Your final turn text goes to the ticket-owner: the new dse sha and the new
superproject sha, the base shas, every gate line, and the absolute paths to your evidence. If writing the report is
blocked, return it inline. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you send must start with
`SC-338:`. Never rm anything in `.superpowers/` outside `sc338-chip-focus/`.
