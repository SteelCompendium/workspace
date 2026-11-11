## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r1-reviewer-<4 random chars>/` with uniquely named scripts and logs; the session scratchpad is shared by every agent — never a generic name like `gate.sh`. Create scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Run each gate as ONE blocking foreground call; no `run_in_background`, no Monitor, no waiting for a completion notice (it never comes).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write/draw-steel-elements -- bash <script-file>`; never `cd X && devbox …` compound commands. Devbox eats `$?` / `$PIPESTATUS` and `| tail` masks failures: record exit codes from inside a script file, read each gate's own summary line.
- Before `npx jest`: `rm -f main.js styles.css` in the plugin root (literal absolute paths). Jest timeouts under load (check `/proc/loadavg`) are not regressions — re-run the suite alone.
- **Never `rm -rf` a `/tmp` glob** (e.g. `/tmp/dse-obsidian-*`, `/tmp/dse-e2e-*`): a worker did this today and wiped other efforts' kept lifecycle FAIL dirs. Delete only literal paths you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same e2e/obsidian commands. Kill only a PID whose `readlink /proc/<pid>/cwd` or command line is inside YOUR worktree.
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Never put a bracketed ticket id (e.g. `[SC-570]`) in an e2e test title — the runner reads bracketed ids as scenario ids.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message, its FIRST WORD must be `SC-570:`.
