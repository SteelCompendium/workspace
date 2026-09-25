# SC-288 r1 independent review brief

## 1. Context loading
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/decisions.md
- Implementer brief: sc288-brief-r1-impl.md; implementer report: sc288-r1-impl-report.md (same dir). Read the exec summary; verify every claim yourself.
- Original finding: /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc184-sidebar-investigation/sc184-rereview-report.md (search "N-1").
- Worktree: /home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements, branch `sc288-sidebar-stuck`. Review `git diff <base>..HEAD` where base = the origin/develop sha the implementer rebased onto (verify with `git merge-base HEAD origin/develop` after `git fetch origin`). Do not commit fixes — you are reviewing. Scratch probes go in the ledger dir with an `sc288-` prefix, never committed.
- You never call the tracker.

## 2. The task
Adversarial review of the SC-288 fix. Ticket text (verbatim):
> `handleExternalChange`'s fast path (`if (previous instanceof ElementView) { … await previous.update(model); return; }`) returns before both the pipeline remount and the attribute clear. `handleAnchorLost` calls `removeChild(previous)` but never clears `host.lastMountedChild`, so after a degrade, a valid external change takes the fast path on a stale view and the panel never recovers (verified under production-shaped services by the re-review).

Execute and probe, don't just read:
- Revert the fix (keep the tests) in a scratch copy/stash and confirm the new regression test fails on the old code — i.e. the test is not vacuous and runs with refs+validation+prefs all present (fast path live).
- Probe every path that removes or replaces the mounted child (anchor lost, remount branch, prepareModel throw fallback, panel unload/close, mount() failure-then-success, repeated degrade→recover→degrade cycles, two panels on the same note not cross-talking). Is `lastMountedChild` ever stale afterwards? Is the fast path still used for the normal non-degraded case?
- Any write-into-user-file consequence: after recovery, does a persist() write land in the right block and leave surrounding note content intact?
- Check the doc comments stay true and the CHANGELOG bullet is accurate and user-facing.
- Re-run the dse-verify battery yourself (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md): tsc, lint, jest (`rm -f main.js styles.css` first), shots, freeze, parity LAST. Expected: clean/clean; jest = implementer's reported head count, all green; shots 0 FAIL; `freeze OK (260/260 …)`; parity 0 gap / 0 undeclared / 16 declared, exit 0.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-review-report.md, logs as sc288-r1-review-<gate>.log. Open with a ≤10-line executive summary: verdict (LAND-READY / FIX-ROUND), counts per severity. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 4. Return contract
Final text goes to the ticket-owner: raw facts — verdict, sha reviewed, measured gate numbers, findings list by severity, absolute paths of every artifact.

Footguns:
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match). Per-run unique paths.
- Redirect long output to files; run every gate in the FOREGROUND — never background and wait.
- devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`, gate command LAST, nothing piped after it.
- Restore the worktree to the implementer's HEAD exactly (clean `git status`) when done with revert probes.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never rm -rf under `.superpowers/` beyond your own sc288- files.
- You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT. If you message anyway, first word `SC-288:`.
