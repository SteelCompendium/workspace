# SC-646 r1 independent review brief

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/decisions.md`,
  the implementer brief `sc646-r1-implementer-brief.md` and report `sc646-r1-implementer-report.md`
  in the same dir. **You never call the tracker (Linear).**
- Worktree under review: `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise`,
  plugin dir `.../draw-steel-elements`, branch `sc646-sync-uncaught-promise`, base dse develop
  `a9f0af1d`. Review `git -C <plugin dir> diff a9f0af1d..HEAD` and the superproject's CHANGELOG
  commit (`git -C <worktree> log origin/main..HEAD`). Use `git -C <abs path>` always. Do NOT
  commit to the branch; probes go in uncommitted edits you revert (`git -C <plugin dir> checkout -- <file>`)
  or in your private scratch folder, and the tree must be clean when you finish.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (about 480 KB; lines 1-247 are the battery and notes; "Settings e2e (SC-440)" near line 206).

## 2. What to check (execute and probe, do not just read)

The ticket: a failed Sync from Settings -> Compendium showed the correct "compendium sync
failed" Notice but also left an unhandled `Uncaught (in promise) Error: GitHub release lookup
failed (HTTP 404)` in the console, because the button did `void this.plugin.syncCompendium()`.
Owner rulings are in the ledger; check the diff against each.

1. Every path that starts a sync or a check (settings Sync and Check buttons, command palette,
   compendium search modal, anything else you find with grep) leaves no rejection unhandled.
   Find any the implementer's audit missed.
2. Exactly one Notice and one designed `console.error` per failure; nothing swallowed that the
   user should have seen. Probe: failure before the Notice is shown (e.g. a throw from the
   destination guard, the busy lock, the "Existing compendium folder found" window being
   cancelled): is any failure now silent that was visible before?
3. The busy state releases after a failure (buttons return to idle).
4. The jsdom test(s) go red without the fix: run your own mutant (remove the catch) and confirm.
5. The e2e SET-C04 is a plain test and its `allowPageErrors` no longer allows `rejection:`;
   run it alone through the runner's filter (dse-verify says how) with the fix, then with the
   catch removed, and confirm red. Restore.
6. tsc, lint, and the jest suites the diff touches. You need not re-run the full lifecycle or
   full e2e unless you doubt the implementer's numbers; spot-check that the logs exist and end
   as reported.
7. The CHANGELOG bullet: plain words, under `## Unreleased`, user-facing.

## 3. Footguns

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output.
- Redirect long output to uniquely named logs; foreground calls only; poll your own pid if a
  call is moved to the background.
- Private scratch folder only:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r1-review/`.
  Write scratch files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and no `rm`
  with a variable path. Never `pkill`/`killall` by pattern; kill only PIDs whose
  `/proc/<pid>/cwd` is in this worktree.
- devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; exit codes only from inside a
  script file; read each gate's summary line.
- You cannot `SendMessage` me. Need input: end with `STATUS: NEEDS_CONTEXT` and the question.
  If you send a message anyway, its first word must be `SC-646:`.
- Never push. Never tag.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/sc646-r1-review-report.md`,
opening with an executive summary of 10 lines or fewer (verdict: LAND / FIX, finding counts by
severity). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario,
and prescribed fix. Final text to the ticket-owner: raw facts plus absolute artifact paths.

## 5. Added after the implementer's report (owner, 2026-11-15)

The implementer touched `main.ts` and reported two follow-ups. Rule on each with a prescribed fix:

- Follow-up 1: failures in `syncCompendium`'s prelude (`reconcile`, `manifestStore.load`,
  `isPending`, `offerMigration`) have no Notice or log; with the empty catch at the callers they
  are now fully silent, where before they were at least an uncaught console error. Owner ruling:
  a failure that was visible before must not become silent. Probe it (make each throw) and
  prescribe the smallest fix (e.g. the callers' catch logs once unless `sync` already reported
  it, like the `logUnlessSyncReported` helper).
- Follow-up 2: `markDeclined` (the `declined` callback) and `finishRemaining` (`offerMigration`)
  can still leave an unhandled rejection. Confirm and prescribe.
- Judge `logUnlessSyncReported` / the `syncStarted` flag: is it correct, is there a simpler form?
