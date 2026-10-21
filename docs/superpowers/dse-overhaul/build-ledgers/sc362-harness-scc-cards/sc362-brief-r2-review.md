# SC-362 round 2 — independent adversarial review (reviewer)

Your final text goes to the ticket-owner, not a human. **You never call the tracker
(Linear).** You did not write this code; review it independently. Execute and probe — do not
just read.

## Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/decisions.md` (binding rulings).
2. Spec: `.../sc362-harness-scc-cards/sc362-r0-survey-report.md` and the implementation brief
   `.../sc362-harness-scc-cards/sc362-brief-r1-impl.md` (its "Owner amendments" and Gates).
3. The implementer's report: `.../sc362-harness-scc-cards/sc362-r1-impl-report.md` (read its
   summary; verify its claims rather than trusting them).
4. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery,
   command shapes, freeze rules, CURRENT block.

Worktree dse clone: `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements`,
branch `sc362-harness-scc-cards`. Review the diff `git -C <dse> diff origin/develop...HEAD`.
Do not commit to the branch. If you need to probe by editing (e.g. break the resolver to prove
the guard fires), revert byte-clean afterwards (`git -C <dse> diff` empty) and say so.

## What to probe

1. **Existing shots untouched.** Run `npm run shots` and the freeze check — `freeze OK
   (276/276 …)` must hold; confirm every pre-existing PNG is byte-identical to a base run (the
   freeze check covers the frozen set only; spot-check that the 18 fixtures the survey flagged
   as DOM-changing under global wiring still render with no compendium).
2. **New shots are what they claim.** Eyeball the 4 new `rule/by-scc` and `condition/by-scc`
   PNGs (print + realprint): the rule card shows the eyebrow group "Combat" and title
   "Opportunity Attacks"; the condition card shows Bleeding. Compare against the inline twins.
   Report what you see in words (Scott is colorblind; name colors, never rely on them).
3. **Widening file.** `.../sc362-widening.txt`: 4 lines, format matches the baseline, no name
   collides with the baseline, hashes match a fresh sweep, and two sweeps are identical.
4. **The resolve guard really fails.** Temporarily break resolution for a by-SCC fixture (e.g.
   a typo in its `scc:` code, or seed mode `none`) and show the guard turns jest (and/or the
   shot run) red; then revert.
5. **Seam reuse for SC-469.** Is the `anchors-only` (or equivalent) mode real and usable to
   produce the web / not-installed card later without further plumbing? Don't add fixtures.
6. **Scope.** `shoot.mjs` has zero edits (ruling). No change outside the harness/tests except
   what the plan named. Stale comments fixed.
7. **Full battery** per dse-verify, expected: tsc/lint clean; jest 5408 + new tests passed /
   1 skipped / 231 of 232 suites (or +N suites if new suites were added — check the report);
   lifecycle 29/29 (own `DSE_LIFECYCLE_PORT`, e.g. 9364); e2e `88/92 ok, 0 failed, 4
   known-bug, coverage: 64/64 pairs`; shots 580, 0 FAIL, `montage board scroll OK` printed;
   freeze 276/276; parity LAST 0 GAPs / 0 undeclared / 24 DECLARED.

## Rules / footguns

- Scratch: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r2-rev-<random suffix>/`,
  uniquely named scripts/logs. Never generic names like `gate.sh`. Write files with the Write
  tool, not heredocs.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements -- <cmd>`;
  if a command must run inside the repo dir, put it in a script in your scratch folder. Never
  `cd X && …` in a compound command. devbox eats `$?` — capture exit codes in the script. Never
  pipe a gate into `tail`. One gate per Bash call, output redirected to a log.
- `git -C <abs path>` for every git command.
- No glob `rm`; never `rm -rf` anything under `.superpowers/`; never `rm -rf
  /tmp/dse-obsidian-lifecycle-*`.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains
  `worktrees/sc362-harness-scc-cards/`.
- Run gates in the foreground (timeout up to 600000 ms); never background a gate and wait.
- Never key a wait-loop on a scratch filename or its contents.
- Main checkout `/home/scott/code/steelCompendium/workspace` is shared: read only (except your
  report). Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — expected.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; for input end with `STATUS: NEEDS_CONTEXT` + question. If you
  ever send a message anyway, first word `SC-362:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, measured gate
numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario,
prescribed fix.

## Return contract

Raw facts: verdict, branch sha reviewed, each gate result line, findings list (severity +
one line each), report path, and paths of every evidence artifact (PNGs you eyeballed, logs).
