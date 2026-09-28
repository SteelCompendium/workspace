# SC-318 round 7 — final rebase + full battery + widening re-verify

You are the implementer for SC-318's final round. Your final text goes to the ticket-owner, not
a human: raw facts only. Workers NEVER call the tracker (Linear).

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/decisions.md`
  (read "Scott ruling 1" and "Owner rulings, post-Scott" at the end; skim the rest).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc318-card-headings`, branch
  `sc318-card-headings` in every submodule. DSE = `<wt>/draw-steel-elements`, head `2c55304`
  (10 commits on `5a20d5f`). Superproject worktree head `af2f90a` (on origin/main `4ca84a8`).
  Verify `pwd`/branch before any write. Never write under
  `/home/scott/code/steelCompendium/workspace/` except this ledger dir. The workspace-level
  files (CHANGELOG.md, docs/…/D3-token-map.md) live in YOUR worktree's superproject.
- origin/develop has moved to `6dca388` (SC-235 landed: Steel section titles 15px / 0.12em,
  parity declared set changed — expected 14 DECLARED on develop now; measure it).

## 2. Task

1. `git -C <wt>/draw-steel-elements fetch origin && git -C <wt>/draw-steel-elements rebase origin/develop`
   (fetch again right before; use whatever the tip is and report it). Resolve conflicts keeping
   BOTH sides' intent (SC-235's section-title rules and SC-318's heading rules are disjoint;
   likely conflicts: dse CHANGELOG, test counts). If `package.json` obsidian version changed,
   `npm ci`. Superproject: `git -C <wt> fetch origin && git -C <wt> rebase origin/main`
   (CHANGELOG `## Unreleased` conflicts: keep every bullet). After rebasing dse, commit the
   superproject pointer bump to the new dse head. Commit after each step.
2. Measure develop's own base numbers at the new tip (jest total, parity declared count) so the
   branch numbers can be compared.
3. Full battery (dse-verify skill,
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), in order:
   tsc, lint, jest (`rm -f main.js styles.css` in the plugin root first), obsidian-lifecycle
   (19/19), shots (expect develop's PNG count + 4 `perk-headings--steel-*`, 0 FAIL), freeze
   (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots`
   → 260/260 against the current baseline; report the baseline's line count), parity LAST
   (0 GAPs / 0 undeclared / develop's declared count — SC-318 adds none).
4. Re-verify the widening: run `npm run shots` a SECOND time; compute sha256 of
   `visual-harness/shots/perk-headings--steel-print.png` and `--steel-realprint.png` after each
   run; they must match each other across both runs. Compare with
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/widening.txt`
   (`30c1a61b…` print, `007c2747…` realprint). If they differ (e.g. SC-235 changed something
   the ladder shows), write the new two lines in the same `<sha256>  <filename>` format to
   `.../sc318-card-headings/widening-final.txt` and say why; if identical, write
   `widening-final.txt` anyway with the verified lines. Never touch the freeze baseline itself.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/sc318-r7-final-report.md`,
<=10-line executive summary first: final dse sha + develop tip, superproject sha + main tip,
every gate number, develop base numbers, widening hashes (match y/n), conflicts resolved.

## 4. Footguns (obey)

- Run EVERY command in the FOREGROUND as a plain Bash call (timeout 600000) with output
  redirected to a per-run log under `.../sc318-card-headings/r7-logs/` (prefix `sc318-r7-`).
  NEVER use run_in_background or Monitor, and never end your turn waiting on a job — no
  notification ever arrives for a job you started. Redirect long output to files (the 600s
  stream watchdog kills silent agents).
- Devbox: `devbox run -- bash -c 'cd <abs> && <cmd> > <log> 2>&1'`; the wrapper eats `$?` and a
  pipe hides failures — read the log's own summary line.
- Kill processes only by PID, only a PID whose command line contains
  `worktrees/sc318-card-headings/` (`pgrep -af "worktrees/sc318-card-headings/"`). NEVER
  `pkill`/`killall` by pattern.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches.
- Token-map test footgun: `token-coverage.test.ts` must read YOUR worktree's D3-token-map.md
  (it has the 6 `--dse-fs-h*` rows); if it finds a stale copy, use `DSE_TOKEN_MAP_PATH`.
- No tags, releases, pushes. Never touch DSE `main`. Never edit the freeze baseline. Never
  `rm -rf` under `.superpowers/` except your own `sc318-card-headings/r7-*`.
- If the report-file write is blocked, return the report inline.
- You cannot SendMessage me. If you need input, end with STATUS: NEEDS_CONTEXT and the question;
  any message you do send must start with `SC-318:`.
- Final text: shas, gate numbers, widening result, and the path of every artifact.
