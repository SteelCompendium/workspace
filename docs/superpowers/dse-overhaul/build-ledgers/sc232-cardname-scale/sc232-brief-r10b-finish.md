# SC-232 round 10b — finish round 10 (replacement worker)

You replace a worker that repeatedly parked on background jobs. Your final text goes to the
ticket-owner: raw facts. Workers never call Linear.

## HARD RULE: FOREGROUND ONLY

Every command runs in the foreground: `run_in_background` false, no `Monitor`, no `&`, no
`nohup`. Redirect long output to a per-run unique log file and read that log after the
command returns. A job you background NEVER wakes you. If you end your turn saying you are
"waiting for" anything, the round has failed. Long gates (shots ~10 min, lifecycle ~5 min) fit
within the Bash tool's 600000 ms timeout, so pass `timeout: 600000`. If a single command would
exceed that, split it. Never stream.

## Context

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`.
  Read "Owner rulings, round 9" and "Round 10 progress".
- Round-10 brief: `.../sc232-brief-r10-fix.md`. The fixes are DONE and committed: dse
  `6f19b8b`, `31f54d8`, `e1705ba`, `f3085d5` on top of `fa9addc`. Read the commit messages and
  diffs (`git log -p fa9addc..HEAD`), but do NOT redo them.
- Review findings: `sc232-r9-review-report.md`. Round-8b method for the rebaseline map:
  `sc232-r8b-report.md` plus the current (STALE, 8b-era) `rebaseline-map.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, dse branch
  `sc232-cardname-scale`. `pwd`-check before every write. `git fetch origin`. If
  `origin/develop` moved from `5a20d5f`, rebase and say so; after a rebase, everything below is
  measured at the rebased head.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## What remains

1. **Freeze, final head.** Run `npm run shots` twice (two separate foreground runs), with
   output going to unique logs. Hash the frozen set after each run and confirm the two runs are
   byte-identical. Then run `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots`.
   The FAILED set must equal `rebaseline.txt`'s filenames exactly, and every hash in
   `rebaseline.txt` must equal the head's PNG hash. If `rebaseline.txt` (written 20:18) doesn't
   match, regenerate it from the final head. Then substitute it into a SCRATCH copy of the
   shared baseline (your own path; never edit the shared file), run a scratch copy of the
   script against it, and expect clean 260/260. State the old (8b: 78 lines) vs new line
   count, and list the ids that dropped out.
2. **`rebaseline-map.md`, regenerated.** For every id in the new `rebaseline.txt`, name which
   item(s) move it: W3 (cost/Signature to the name row), W2 (level), W7 (usage on standalone
   and kit signature only), W4 (statblock kind-noun + keywords), W1b (kit parent name),
   "Signature" wording, and the r10 fixes. Use a cheap, deterministic method you can run in
   the foreground, such as a DOM text diff of the print twins between develop and head per
   capture, and state it. Every id must be explained, and nothing may be unexplained.
3. **Evidence refresh** in `.../sc232-cardname-scale/r8-evidence/`, per the r10 brief's
   "Evidence" section. Rules: 1 image px = 1 CSS px, head crops only, text labels, Site in the
   DARK scheme, tile text DOM-verified. Files:
   - `sc232-slots-neutral.png`
   - `sc232-slots-print-screen.png`, with the new "Statblock ability (no usage chip)" row, and
     the same entity on both sides where the harness can render it
   - `sc232-print-before-after.png`, rebuilt from the new set

   If the existing evidence scripts are in `r8-evidence/` or a scratch path named in
   `sc232-r8b-report.md`, reuse them.
4. **Gates at the final head:**
   - tsc and lint clean
   - jest: run `rm -f main.js styles.css` first; state the count vs 4170, and why
   - `obsidian-lifecycle` 19/19 on your own `DSE_LIFECYCLE_PORT`
   - shots: 0 FAIL
   - parity: 0 GAPs / 0 undeclared / 26 DECLARED; explain any change
5. **Cleanup.** Remove the scratch worktree
   `/home/scott/code/steelCompendium/worktrees/sc232-r10-scratch-fa9addc`. It is a detached
   git worktree of the dse clone. First check that no process is using it
   (`pgrep -af sc232-r10-scratch`). Then run `git -C
   /home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements
   worktree list` to find its owning repo, and remove it with `git worktree remove --force
   <path>` from that repo. Remove any scratch worktree YOU create the same way. Never `rm -rf`
   anything under `.superpowers/` except your own `sc232-r10b-*` scratch.

## Rules

- **Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/` or `worktrees/sc232-r10-scratch`.** Check each with
  `pgrep -af`. Never use `pkill` or `killall` by pattern. One narrow exception: the direct
  children of YOUR OWN hung wrapper PID, after verifying their parent PID and that
  `/proc/<pid>/cwd` is inside your worktree.
- Commit after each coherent step. Never push, never tag, never touch dse `main`. Never edit
  the shared `freeze-baseline.sha256`. Never touch the shared main checkout's working tree.
  Do not bump the superproject pointer.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`, with the gate command LAST and output
  redirected. Read the tool's own summary line, never an echoed `$?`.
- If the report write is blocked, return the report inline. You cannot `SendMessage` the
  owner. If you are blocked, end with `STATUS: NEEDS_CONTEXT` and the question. If you message
  anyway, the first word is `SC-232:`.

## Report

Write `.../sc232-cardname-scale/sc232-r10-fix-report.md`, opening with an executive summary of
10 lines or fewer:
- head sha and base sha
- per-finding status: the fixes were already done, so cite their shas
- MEDIUM-2 outcome: comments corrected; the data fix is filed as SC-375
- rebaseline line count, old → new
- determinism result
- gate numbers
- scratch worktree removed: yes/no

Final text: the same, plus every artifact path.
