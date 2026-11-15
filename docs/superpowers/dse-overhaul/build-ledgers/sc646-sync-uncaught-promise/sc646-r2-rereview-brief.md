# SC-646 r2 scoped re-review brief (delta only)

## Context

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/decisions.md`,
  the r1 review `sc646-r1-review-report.md` (its findings are what r2 had to fix) and the r2
  implementer report `sc646-r2-implementer-report.md`, same dir. **Never call the tracker.**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise`, plugin dir
  `.../draw-steel-elements`. Review ONLY the r2 delta in the plugin (the branch was rebased onto dse develop `cefa9ca8`; compare with `git range-diff a9f0af1d..281f1f43 cefa9ca8..HEAD` and review the commits after the r1 pair), plus the
  superproject's commits on top of `origin/main` (`git -C <worktree> log --oneline origin/main..HEAD`
  must show exactly the CHANGELOG commit and ONE `chore: bump draw-steel-elements` pointer commit,
  whose pointer equals the plugin HEAD). Use `git -C <abs path>`. Do not commit; revert probe
  edits; leave the tree clean.

## Check (execute and probe)

1. HIGH fixed: make each prelude step of `syncCompendium` throw (`reconcile`,
   `manifestStore.load`, `isPending`, `markSettled`, `markSettled` inside `offerMigration`):
   exactly one log line, no Notice duplication, nothing unhandled, nothing silent. A real sync
   failure still gives exactly one Notice and one `compendium sync failed` console.error (no
   second log from the new catch).
2. MEDIUM fixed: `declined` (`markDeclined` fails, from "Not now" and from closing the window),
   `finishRemaining`, and the `migrate-compendium-layout` command: each logs once, nothing
   unhandled, no double log.
3. LOW: the dead `unhandledRejection` listeners are gone or their comments are correct.
4. The new tests go red by mutant (remove each new catch in turn).
5. Spot-check the implementer's gate logs end as reported (jest, lifecycle 64/64, e2e
   `0 failed`, `coverage: 417/417 pairs`). Re-run tsc, lint and the touched jest suites yourself.

## Footguns

Same as the r1 review brief (`sc646-r1-reviewer-brief.md` section 3): no `rm` of anything in
/tmp or the scratchpad, no `pkill` by pattern, foreground calls with logs, private scratch
folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r2-rereview/`,
devbox via script files, never push. Need input: end with `STATUS: NEEDS_CONTEXT`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/sc646-r2-rereview-report.md`,
executive summary of 10 lines or fewer first (verdict LAND / FIX). Final text: verdict, findings
by severity with file:line, absolute artifact paths.
