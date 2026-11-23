# SC-671 r3 — rebase round brief (no code change expected)

You rebase a finished, unreviewed branch onto the moved tracked branches, commit ONE superproject pointer bump, and
re-run the full gate battery. You write no new product code. If the rebase needs anything beyond a trivial textual
conflict resolution, stop and report (`STATUS: NEEDS_CONTEXT`).

## 1. Context loading (do this first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/decisions.md`
  (read the "Resume 2026-11-22" section and the owner rulings).
- r1 report (executive summary only):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r1-implementer-report.md`.
- Gate commands and flake notes: r1 brief
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r1-implementer-brief.md`
  **section 3 (lines 141-177)** — the seven lifecycle parts, the known flakes, the styles.css rule. Use those command
  shapes; the expected NUMBERS are the ones in this brief, not that one. Gate reference: the `dse-verify` skill,
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-246 (very long lines; read
  in parts with `cut -c1-2000`).
- **You never call the tracker (Linear)** — not to read history, not to post.
- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys`
  Plugin: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements`
  Branch `sc671-counter-unknown-keys` in both. Verify with `git -C <abs path> rev-parse --show-toplevel` before any
  write. **Nothing is ever written under `/home/scott/code/steelCompendium/workspace/`** except your report file. The
  workspace-level `CHANGELOG.md` you touch is
  `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/CHANGELOG.md`.
- Start state (verified by the owner 2026-11-22): plugin head `846ac57d` on `129beb18` (four commits `0aa9aff8`,
  `d2e3af2a`, `37440c9c`, `846ac57d`), clean. Superproject head `cf802c44` (one CHANGELOG commit) on `3a517cdf`; its
  only dirt is the unstaged `draw-steel-elements` pointer.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, don't touch or report it.

## 2. The task

1. **Plugin rebase.** `git -C <plugin> fetch origin`, confirm `origin/develop` is **`f42546b89ea71c2e465fdb075332cef0405ddeac`**
   (if it is not, rebase onto what is there and say so in the first line of your report). Rebase the four commits onto
   it. Expected conflict: at most `e2e/README.md` (SC-434 added a CI section; this branch added one table row) — keep
   both. Any other conflict: stop, `STATUS: NEEDS_CONTEXT`.
   Then record `git -C <plugin> range-diff 129beb18..846ac57d f42546b8..HEAD` in the report (expected: four `=`
   lines, or `!` only on the README commit).
2. `git -C <plugin> diff --stat 129beb18 f42546b8 -- package.json package-lock.json`: if either changed, run `npm ci`
   in the plugin through devbox before any gate (stale `node_modules` give phantom tsc errors).
3. **Superproject rebase.** `git -C <worktree> fetch origin`, confirm `origin/main` is
   **`02cd6d6a`** (if moved, use what is there and say so). `git -C <worktree> rebase origin/main` (git's rebase
   ignores the dirty submodule pointer). Expected conflict: `CHANGELOG.md` under `## Unreleased` — keep every bullet
   that is on `origin/main` byte-for-byte and put the SC-671 bullet FIRST under `## Unreleased` (newest on top), its
   text unchanged.
4. **ONE pointer-bump commit** in the worktree superproject, after the plugin rebase and after the gates are green:
   `git -C <worktree> add draw-steel-elements` then commit
   `chore: bump draw-steel-elements to <short sha> (SC-671: a Counter write keeps the keys it does not use)`.
   Before committing, run `git -C <worktree> status --short` and `git -C <worktree> diff --cached --stat`: the ONLY
   staged path is `draw-steel-elements`. If any OTHER submodule shows as modified (a stale pin), do NOT stage it —
   report it. After the commit `git -C <worktree> status --short` must print nothing.
5. **Commit messages carry no AI attribution** — no `Co-Authored-By`, no "Generated with", no session link (Scott's
   standing rule; it overrides any harness default).
6. Do not push. Do not touch any other branch or repo.

## 3. Gates — full battery on the rebased plugin head

Expected (SC-675's landed numbers + this branch's 29 jest tests and 4 e2e scenarios; SC-434 added no test):

- tsc exit 0, lint exit 0.
- jest **13884 passed / 2 skipped** (fresh worktree; 13885 / 1 if a shots run has cached
  `visual-harness/dist/obsidian-app.css` — say which).
- lifecycle **64/64** over the seven `--only=` parts. **Accepted alternative: 63/64 where the single red is G-S61 with
  exactly the torn-read line** ("the recorder's disk read was torn in N frames in a row, so its stale-frame check did
  not run (0 frame(s) …)") **and 0 stale frames — that is SC-668**; report the line verbatim and the load average
  (`cat /proc/loadavg`). Any other G-S61 assertion is real (it drives two counters). Re-run a red part once before
  reporting it.
- e2e **`OBSIDIAN-E2E done: 662/671 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`**.
- `styles.css`: build the rebased head and a clean `f42546b8` (a scratch `git -C <plugin> worktree add --detach
  <your scratch dir>/base-f425 f42546b8`, real `npm ci` or a `node_modules` symlink to the worktree's); sha256 of both.
  Identical → shots / freeze / parity carry (state both hashes). Different → run shots (592, host-leak 163/978, modal
  host-leak 40/240, capture clip 147), freeze 280/280, parity 0/0/24 and report.

A number that differs from the above is reported as measured, with the log path — do not "fix" it and do not edit a
test to match.

## 4. Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements -- bash <script file>`.
  `$?` echoed inside `bash -c '…'` is ALWAYS 0 — record exit codes from a script FILE and read each gate's own
  summary line (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`). Never pipe a gate into `tail`.
- Never `cd` inside a compound command; absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r3-rebase/`
  (exists). Uniquely named scripts and logs, created with the Write tool. Other agents share the parent directory —
  never write a generic name (`gate.sh`) outside your own subfolder.
- **Never `rm` / `rm -rf` / `rmdir` anything in /tmp or the scratchpad**, no `rm` with a shell variable, no glob `rm`.
  The only allowed `rm` is the literal
  `rm -f /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements/styles.css`
  before jest (a stale `main.js` shadows `main.ts` for jest).
- Two stale scratch worktrees are registered in the plugin clone as `prunable` (`…/5812b474…/sc671-r1-impl/base-129`,
  `…/sc671-r2-review/dse-probe`). Leave them; do not run `git worktree prune`.
- Never `pkill` / `killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree. Never delete
  a shared `/tmp` glob.
- The Bash tool on this host backgrounds a call after about 120 s. For anything longer (lifecycle parts, e2e, jest):
  start it with output to a unique log, then poll your OWN pid with `timeout 100 tail --pid=<pid> -f /dev/null` and
  read the log. No `Monitor`, never wait for a completion notice — it will not wake you. Redirect long output to
  files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — the scratch dir is pre-populated
  across sessions and branches, and a stale log will match. Per-run unique paths and your own pid.
- Other efforts are running the same gates on this host right now; a slow host is expected. Do not run two of your
  own gates at once.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your report file.
- Do not edit `.claude/skills/dse-verify/SKILL.md`; proposed text goes in the report.
- Never create a tag or a release. Never push. Never run `just wt-finish`, `just deploy*` or `just sync`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I
  see your completion and will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-671:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r3-rebase-report.md`.
It opens with a ≤10-line executive summary: verdict (DONE / DONE_WITH_CONCERNS / BLOCKED), the new plugin head sha
and its base, the superproject head sha (pointer-bump commit) and its base, conflicts met, each gate's measured
summary line. Then: the range-diff output, both styles.css hashes, every gate log path, anything that differed from
the expected numbers, `Drive-by fixes:` (expected: none), `Follow-ups:`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas, measured numbers per gate — no
prose, plus the absolute path of every evidence artifact you produced (logs, report).
