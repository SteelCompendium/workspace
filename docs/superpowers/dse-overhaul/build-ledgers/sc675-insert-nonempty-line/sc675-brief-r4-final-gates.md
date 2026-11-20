# SC-675 r4 — final gates brief (run the landing battery on the final sha; change no code)

Self-contained; a fresh worker can run it from the files. Your final text goes to the ticket-owner (an agent).

## 1. Context

- **Workers never call the tracker.** Never push, never tag, never spawn agents. **You change no code and make no commits in this round.**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements`, branch `sc675-insert-nonempty-line`, HEAD must be **`f94be393`** (verify with `git -C`; `git status --short` must be empty before you start and when you finish).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read **only lines 20-247** (495 KB file). It has the exact command shapes, the SEVEN `--only` lifecycle parts and their ids, and how to split e2e.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r4-gates/` (new dir; unique names per run, e.g. `lifecycle-p3-run1.log`).

## 2. Gates and expected numbers (base = dse `develop` @ `129beb18`)

1. **Lifecycle** — `npm run obsidian-lifecycle`, as the seven `--only` parts in the skill, one blocking foreground call each. Expected union: **`64/64 ok, 0 failed`**. (G-S61 has been seen red on base under load, SC-668: if it fails, re-run that id alone and report both.)
2. **e2e** — `npm run e2e`, full run. Expected final line: **`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** (this branch adds no e2e test and no control). If the full run does not fit one 600 s call, start it with output to a unique log plus an rc file written by the script, and poll THAT log / rc file in later calls — never wait on a background-completion notice. Known load flakes: INIT-W09 / W10, SET-X03 / X04, NEGO-R05. On a failure, re-run that spec alone, and report both runs; a full run must still end `0 failed` to count.
3. Shots / freeze / parity: do NOT run. `styles.css` is byte-identical to base (`18730938…f1f9`), so they carry. Re-confirm the hash from the build the gates produce and report it.

## 3. Footguns

- `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd X && …` in a compound command; exit codes recorded inside the script FILE; never pipe a gate through `tail`.
- No `pkill` / `killall` by pattern — three other efforts run the same gates right now. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside this worktree.
- No `rm` with a variable or glob; never `rm -rf` a `/tmp` glob such as `/tmp/dse-obsidian-lifecycle-*` (other efforts' vaults match it). Delete only literal paths you created, or leave them.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Every git command is `git -C <absolute path> …`.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me). If you need input, end with STATUS: NEEDS_CONTEXT and the question; any stray message must start with `SC-675:`.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/sc675-r4-final-gates-report.md` (executive summary of at most 10 lines first): sha, each lifecycle part's summary line, the union, the e2e final line verbatim, any re-runs, the `styles.css` hash, log paths. If the write is blocked, return it inline.

Final text: raw facts only — STATUS, sha, lifecycle union, e2e final line verbatim, flakes re-run (which, result), `styles.css` hash, `git status --short` result, absolute paths of the report and every log.
