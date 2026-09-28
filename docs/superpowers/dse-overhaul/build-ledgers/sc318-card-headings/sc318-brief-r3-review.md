# SC-318 round 3 — independent adversarial review of the Option A branch

You are the independent reviewer for ticket SC-318. You did not write this code. Your final
text goes to the ticket-owner, not a human: findings by severity with file:line, raw numbers.

## 1. Context loading

- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/decisions.md`
  in full (the spec is "Owner rulings, round 1"). Then `sc318-r1-survey-report.md` (exec summary +
  Q1/Q5) and `sc318-r2-implement-report.md` in the same dir. Workers NEVER call the tracker.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc318-card-headings`, branch
  `sc318-card-headings`. DSE = `<wt>/draw-steel-elements`, head = `236d593` on origin/develop
  `5a20d5f`; superproject head `5478d94 (on origin/main 6b0f25c)`. Diff: `git -C <wt>/draw-steel-elements diff 5a20d5f..HEAD`.
  Do NOT commit to the branch. Scratch/probes go in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r3-review/`.

## 2. The task — execute and probe, don't just read

Verify against the round-1 owner rulings (quote them from the ledger; do not paraphrase them).
Probe at least:
1. **Screen == print invariant**: re-measure every heading level and plugin tag in the harness
   (screen twin vs print twin) at default size; independently, not by re-reading the
   implementer's table. Also at a non-default Obsidian text size and inside a `.dse-modal`
   (SC-230 scaling) — does the new scale scale the same way today's does?
2. **Print untouched**: rerun shots + freeze → `freeze OK (260/260 …)`. Confirm no rule in the
   diff lacks the screen-only scope.
3. **Cascade reach**: which elements do the new rules match that the old ones did not (or vice
   versa)? Any heading inside a plugin root that is NOT a markdown heading (e.g. tracker
   `:is(h3..h6)` with the Steel uppercase rule ~10715, montage guide title, skills group
   title, `.dse-hero__name`) must render as the ruling says. Check `.dse-hero__name` is
   byte-for-byte unchanged in its computed values.
4. **Adjacency margin rule** (`p + h*` etc. 2.5 body-em): matches Obsidian's rule, does not
   blow up heading-first bodies, does not double with classed tags' own margins.
5. **No collision** with SC-232 (`.dse-head*`) / SC-235 (`.dse-section__title`) selectors or
   the parity selector map; parity still 16 DECLARED.
6. **Tests**: do the new tests fail on base and pass on the branch (run them against a base
   checkout / reverted CSS)? Are the token/coverage count moves legitimate? Does
   `token-coverage.test.ts` read the worktree's edited D3 map?
7. **Evidence honesty**: open `r2-evidence/sc318-before-after.png` and `sc318-ladder.png`; are
   all columns the same CSS-px scale, do the captions' numbers match your measurements, is the
   Option C probe actually applied (visibly different from A)?
8. Narrow wraps; new fixture's print twins (widening candidates, not baselined). Re-verify the
   two `perk-headings--steel-{print,realprint}.png` hashes in
   `r2-evidence/sc318-widening-candidate.txt` across TWO clean shots runs; report match y/n.
9. **Owner eyeball concern:** in `r2-evidence/sc318-before-after.png` the ancestry "On Humans"
   h3's gap below the preceding paragraph looks about the same in Today and Option A, although
   the survey predicted margin-top 18.72px -> 40px (Obsidian's `p + h*` 2.5-body-em rule).
   Measure the actual margin-top and the rendered paragraph-to-heading gap (after margin
   collapse) on screen-today, screen-branch and print twin. Does the adjacency rule fire in
   card bodies? Does screen gap == print gap?

Full battery (dse-verify skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`),
expected: tsc/lint clean; jest per the implementer's report (0 failures); lifecycle 19/19;
shots 532 + new capture, 0 FAIL; freeze 260/260; parity 0/0/16 DECLARED.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/sc318-r3-review-report.md`
Opens with a <=10-line executive summary: verdict (LAND-READY-AS-PROPOSAL / FIX-FIRST), counts
by severity. Findings: severity, file:line, failure scenario, prescribed fix.

## 4. Return contract and footguns

- Final text: verdict, severity counts, gate numbers, and the path of every artifact.
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run every gate in the FOREGROUND; never background a job and wait for a
  notification (it never comes).
- Devbox wrapper eats `$?`; pipes hide failures — redirect to logs and read the summary line.
- Kill processes only by PID, and only a PID whose command line contains
  `worktrees/sc318-card-headings/`. NEVER `pkill`/`killall` by pattern.
- Never touch the freeze baseline. Never `rm -rf` under `.superpowers/` except your own
  `sc318-card-headings/r3-review/`. If you must revert CSS for a can-fail probe, do it in a
  scratch copy or restore it exactly and verify `git status` clean before you finish.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the
  question. If you ever send a message anyway, its first word must be `SC-318:`.
