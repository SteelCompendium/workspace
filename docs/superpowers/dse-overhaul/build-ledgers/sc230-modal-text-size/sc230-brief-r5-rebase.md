# SC-230 round 5 — rebase onto current origin/develop + full battery (no new features)

Context: ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/decisions.md`.
Scott ruled (verbatim, 2026-09-25): "option A is good." — the branch's current behavior (title scales) is approved.
**Change no behavior this round.** You never call the tracker. Worktree
/home/scott/code/steelCompendium/worktrees/sc230-modal-text-size/draw-steel-elements, branch sc230-modal-text-size,
head 0dbab59 on c524fd2. Verify `pwd` and branch before any write.

## Task
1. `git fetch origin`, then rebase onto the CURRENT origin/develop tip (e9bc15e at dispatch; it may move — use the tip
   you fetch and report it). Run `npm ci` if package.json / package-lock.json changed.
2. Expected overlaps with develop: `CHANGELOG.md` (keep BOTH develop's new entries and SC-230's `[FIX]` entry, in the
   repo's convention, SC-230's entry under the current unreleased section) and `test/dom/kit/managedModal.test.ts` (keep
   both sides' tests). Resolve conflicts preserving develop's content exactly; do not edit anything else. Report every
   conflict hunk and how you resolved it, and show `git range-diff c524fd2..0dbab59 <newbase>..HEAD` summary.
3. Full dse-verify battery (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), in order,
   each in the FOREGROUND with output to `sc230-r5-<gate>.log` in the ledger dir:
   tsc → lint → jest → obsidian-lifecycle → shots → freeze → parity (last).
   `rm -f main.js styles.css` in the plugin root before jest and before shots.
   Expected: tsc/lint clean; jest = base count at the new tip + 7 (the branch adds 7; base at 619c4bd was 4038 passed /
   1 skipped / 208 of 209 suites — measure the base at your new tip if unsure and report both), 0 failed;
   lifecycle `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 (exit 2 = environment, not code — if another run
   holds port 9262 use `DSE_LIFECYCLE_PORT=<free port>`; never use display :1 for it); shots all PNGs 0 FAIL and the line
   "modal text-scale anchoring OK" present (report the PNG count); freeze `freeze OK (260/260 …)`, exit 0;
   parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0.
   Use Bash timeouts up to 600000 ms. If a process must be killed, kill only by PID and only processes rooted in this worktree.
   On timeout-shaped jest reds in settings-tab / settings-preview, check /proc/loadavg and re-run.
4. Do not push, tag, or touch DSE main. No co-author trailers / AI attribution in any commit.

## Report
`sc230-r5-rebase-report.md` in the ledger dir, opening with a ≤10-line executive summary (new base sha, head sha, conflicts,
gate numbers). Final text to the ticket-owner: STATUS, base + head sha, conflict list, gate numbers, absolute paths of every
artifact. No prose.

Footguns: if the report write is blocked, return it inline. Never key a wait-loop on a scratch filename or contents
(stale logs from other branches match). Redirect long output to files; never background a gate and wait for a
notification. You cannot SendMessage me (`to: 'main'` reaches the dispatcher); to ask, end with STATUS: NEEDS_CONTEXT.
If you ever message anyway, the first word must be `SC-230:`. Delete nothing in `.superpowers/` outside `sc230-*` files.
