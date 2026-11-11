# SC-577 R2 independent review brief — Malice never goes below 0

## 1. Context loading

- Ledger (current-state rulings O1-O5): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc577-malice-negative/decisions.md`.
- The implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc577-malice-negative/sc577-r1-impl-report.md`
  (read its summary; do not trust its claims — verify them).
- The implementer's brief (what they were asked to do): `.../sc577-malice-negative/sc577-brief-r1-implementer.md`
  — its Footguns section applies to you in full.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc577-malice-negative`, branch `sc577-malice-negative` in
  `draw-steel-elements`. The diff under review is `git -C <dse abs> diff b4e7b4f4..HEAD` (branch rebased onto dse develop b4e7b4f4 — SC-566 landed; e2e baseline there `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`, jest 7088/1) plus the worktree
  superproject's CHANGELOG commit. Do NOT commit to the branch; probes go in your scratch folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-rev-r2-<yourAgentId>/`
  (or a throwaway test file you delete by literal path before you finish; `git -C … status` must be clean when you end).
- Workers never call the tracker.

## 2. The task: execute and probe, not just read

Check the fix against O1-O5 and hunt for what the tests miss. At minimum:

1. Every Malice write path: stepper −/+ buttons, the stepper's typed entry (type `-5`, type `abc`, type `2.7`),
   keyboard on the buttons (held − at 1 → 0, focus does not drop when − disables), Advance round with
   gain -3 from 1, 3, 0; quick-add unchanged. Anything else that writes `malice.value`
   (grep the whole src tree: reset encounter SC-576, embeds, modals, any other view of the encounter).
2. Hand-edited `value: -2` in the file: what displays, what + and − do, what is written, no crash, no
   write on render (O2 says the file is not rewritten until the user changes Malice).
3. Label: `+3`, `-3`, `0` / absent gain (plain "Advance round"); the visible text vs aria-label/tooltip.
4. Log entry for a clamped round gain matches O3 (configured amount) — and SC-578's [M09] marker still fails as before.
5. The removed markers really pass for the right reason (not vacuous): temporarily revert one source hunk
   in a scratch copy or with a throwaway stash and confirm the converted tests go red. Restore exactly.
6. Re-run jest on the initiative suites and the full e2e (`npm run e2e`, foreground, output to a file);
   confirm `0 failed`, known-bug count dropped by exactly one, coverage Y/Y pairs. Lifecycle/shots only if
   the diff touches anything a shot or lifecycle scenario renders differently — say which you ran and why.
7. Freeze: if the implementer reports freeze movement, eyeball their before/after crops and confirm the
   only change is the − button's disabled state at Malice 0.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc577-malice-negative/sc577-r2-review-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / FIX-NEEDED), findings count by severity.
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 4. Return contract

Final text goes to the ticket-owner: raw facts (verdict, findings with severity and file:line, measured
gate numbers, the sha you reviewed), no prose, plus absolute paths of every artifact you produced.
If you need input mid-task: end with STATUS: NEEDS_CONTEXT and the question. You cannot SendMessage me;
if you ever do message, the first word must be `SC-577:`.

## Addendum (owner, after R1)

- Head under review: dse `56e79252` (3 commits on b4e7b4f4), superproject `dddf8cfe`.
- Already ruled, will be folded into the fix round (ledger O6, O7) — you need not re-report them, but DO
  probe around them: O6 (a stored negative value counts as 0 in advanceRound and quick-add; one shared floored
  helper), O7 (rename the jest "known bugs" describe).
- Check the new e2e manifest entry `click-disabled` for `init.malice.dec` in `e2e/manifest/initiative.ts`:
  is that a legitimate pair kind that other controls use, and does [INIT-M07] actually exercise it (the
  coverage went 163→164)?
- Note: e2e "ok" excludes known-bug tests; the expected count is 257/263 ok, 0 failed, 6 known-bug, 164/164.
- Host load is high (loadavg 14-27): RECOV-R07, CENSUS-07, twin-reuse, initiative-default-keys are known
  load flakes — re-run alone before counting one as a finding.
