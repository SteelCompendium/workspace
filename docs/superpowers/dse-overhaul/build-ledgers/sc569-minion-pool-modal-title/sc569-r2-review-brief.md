# SC-569 r2 — independent review brief (replacement-ready)

You are the independent reviewer for SC-569. You did not write this code. Your final text goes to the ticket-owner.

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/decisions.md`
  (OD-1 is the spec), the implementer's brief `sc569-r1-impl-brief.md` and report `sc569-r1-impl-report.md` in the same dir.
- **Workers never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`, plugin in `draw-steel-elements/`,
  branch `sc569-minion-pool-modal-title`, base dse `b1e4f027`; head = `8dbd9698` (rebased onto `27120710`); base is now dse `27120710` (SC-621 landed; see ledger "Baseline moves") — diff against `27120710` after r1 rebases. Review `git -C <plugin> diff 27120710..HEAD`.
  `git -C <plugin> fetch origin` first; if `origin/develop` moved past `b1e4f027`, say so (do not rebase).
- Read the adapter footguns (`/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8) and the
  `dse-verify` skill sections the r1 brief lists (the skill is ~450 KB; read in parts).
- Do not commit to the branch. Probe tests you write go in your scratch folder or are reverted; report them, and if one
  is worth keeping, say so (the fix round will add it).

## 2. The spec (OD-1, quoted from the ledger)

> - Group with ONE minion squad (`squad_role === 'minion'`): title unchanged, `"<group> - Minion Stamina Pool"`.
> - Group with TWO OR MORE minion squads: `"<group> - <creature name> - Minion Stamina Pool"`.
> - If another minion squad in the same group has the same creature name: `"<group> - <creature name> (squad N) - Minion
>   Stamina Pool"`, N = 1-based position of this squad among the same-named minion squads, in the order the tracker
>   lists them (top to bottom).

## 3. What to do — execute and probe, not just read

- Check the rule against the tracker's ACTUAL render order and identity (two same-named squads: does each modal get the
  N that matches its position on screen? after a reorder / an outside edit / a squad removed mid-fight?).
- Probe edge cases: a group whose squads are reached through every open route (grid cell double-click, detail-row
  stamina control, pinned sidebar if it opens this modal); a captain promoted/relieved; `amount` hand-edited; a squad
  creature name with surrounding spaces or case differences; a group with `is_squad` false; old encounter YAML.
- Is the title also the modal's accessible name (aria-labelledby)? Does it truncate badly at narrow modal widths (look
  at the DOM / CSS; a screenshot via the e2e or obsidian-shots tooling if cheap)?
- Are the new jest tests non-vacuous (mutate the helper: drop the same-name suffix, use the wrong index, count captains;
  each must turn a test red)? Are the e2e tests asserting the real Obsidian title text?
- Re-run: tsc, lint, jest (expect 11892 + the new count passed / 2 skipped quiet), and the full e2e
  (expect `OBSIDIAN-E2E done: <338+new>/<341+new> ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`). Lifecycle,
  shots, freeze and parity: re-run only if the diff touches anything beyond the modal title, its helper and tests;
  otherwise state that you relied on r1's numbers and why.

## 4. Footguns

Same as the r1 brief §3 gate notes and §4 — read them there. Highlights: devbox `-c <abs path>` with a script file;
`git -C <abs path>`; private scratch folder
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-review-r2/`;
**never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**; no pattern kills; no background jobs or
Monitor; calls over 180 s get backgrounded — wait with `timeout 175 tail --pid=<your pid> -f /dev/null` and read the log;
never put a bracketed ticket id in a test title; if the report write is blocked, return it inline; you cannot
SendMessage me — end with `STATUS: NEEDS_CONTEXT` if you need input (any message you do send starts `SC-569:`).

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/sc569-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED). Findings by severity
(HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. Measured gate lines.

## 6. Return contract

Raw facts: verdict, findings count by severity, gate numbers, absolute paths of the report and every log/probe artifact.

## 7. Extra survey item (bounded, report only)

r1 follow-up: "Other modals may have the same duplicate-title ambiguity." Spend at most a short grep pass: list every
modal opened from the initiative tracker whose title is built from `group.name` (or another group-level name) only, so
two squads / two creatures in one group would get the same title. For each: file:line, the title template, and whether
it can be opened for two different things in one group. Do not fix anything.
