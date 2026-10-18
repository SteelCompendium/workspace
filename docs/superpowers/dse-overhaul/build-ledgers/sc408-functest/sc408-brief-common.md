# SC-408 — common brief preamble (every worker reads this first)

## Context loading

1. Read the decisions ledger:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/decisions.md`
   It is the distilled current state. Quote rulings from it; never paraphrase them.
2. Read any prior-round reports named in your brief (same dir, `sc408-*` files).
3. Your worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest`
   DSE plugin: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`
   (branch `sc408-functest`, cut at `be4f002` = `origin/develop` tip on 2026-10-17;
   `node_modules` already installed — do NOT run `npm ci` again).
   **Verify `pwd` / use absolute paths before any write. Never write anything under
   `/home/scott/code/steelCompendium/workspace/` except your own report file in the ledger
   dir above** — the main checkout is shared global state. Use `git -C <absolute path>` for
   every git command, never `cd X; git …`.
4. Read `draw-steel-elements/AGENTS.md` and `.repo-docs/index.md` in the worktree for
   orientation, and the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (command shapes, devbox wrapping, exit-code footguns, the lifecycle gate).
5. **Workers never call the tracker (Linear)** — not to read history, not to post.

## Environment rules

- Node/npm are only available through devbox, and devbox ignores your shell's `cd`:
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements && <cmd>'`
- The gate command must be LAST in the `bash -c '…'` string (no `| tail`, no `; echo`).
  Redirect long output to a log file and read the file afterwards.
- **Redirect long-running output to a file rather than streaming it — the 600s stream
  watchdog kills silent agents.** Run long jobs in the FOREGROUND with output redirected
  (Bash timeout up to 600000 ms). Never background a job and "wait for a notification" —
  a job you started does not wake you.
- Before `npx jest`: `rm -f main.js styles.css` in the plugin root (stale bundle shadows
  `main.ts`). A timeout-shaped red in `settings-tab`/`settings-preview` under load is noise:
  check `/proc/loadavg` and re-run.
- Other agents are running `npm run shots` and `npm run obsidian-lifecycle` RIGHT NOW in
  other worktrees. If you run the lifecycle gate, use `DSE_LIFECYCLE_PORT=9308` (SC-408's
  reserved port; 9262 and 9291 are taken).
- **Never `pkill`/`killall` by a bare command pattern.** Kill only by PID, and only a PID
  whose command line contains `worktrees/sc408-functest/`.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will
  match. Read the process's own output, or write to a per-run unique path.
- Never `rm -rf` the shared `.superpowers/` dir or anything in it except files you created.
- Never create a git tag or release on `draw-steel-elements`.

## Reporting

- Write your report to the path your brief names (always `sc408-` prefixed, in the ledger
  dir). **If the report-file write is blocked by your harness, return the report inline.**
- **The report file must OPEN with a ≤10-line executive summary.** The owner reads that
  summary, not the whole report.
- **Your final text goes to the ticket-owner, not a human** — raw facts (verdict, shas,
  measured numbers), no prose, **plus the absolute filesystem path of every evidence
  artifact you produced** (reports, logs, screenshots).
- **You cannot `SendMessage` the ticket-owner** — a depth-2 agent cannot address its parent,
  and `to: 'main'` routes to the top-level session, not the owner. If you need input
  mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; the
  owner will resume you. If you ever do send a message anyway, its FIRST WORD must be
  `SC-408:`.
- Report extras in two buckets: `Drive-by fixes:` (only if your brief allows edits) and
  `Follow-ups:` (left alone).
