# SC-551 r1 — measure, reproduce, then fix the lifecycle CDP port race

You are the r1 implementer for SC-551. Your final text goes to the ticket-owner, not a human: raw facts
(verdict, shas, measured numbers), no prose, plus the absolute path of every evidence artifact you produced.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/decisions.md`
  — the ledger: owner findings with file:line and rulings R1–R4 you must follow. Quote them, don't reinterpret.
- Worked example of the same race class (display, not port): `scripts/xvfb-owned.mjs` and its jest test in the
  plugin (SC-546). Mirror its style: header comment that says WHY + HOW + what was measured, injectable seams
  for tests.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race`. Plugin:
  `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements`, branch
  `sc551-lifecycle-cdp-port-race` at `eafe76e1` (= `origin/develop`). First:
  `git -C <plugin> fetch origin` and confirm `origin/develop` is still `eafe76e1`; if it moved,
  `git -C <plugin> rebase origin/develop` and say so. The worktree has NO node_modules yet: run `npm ci` via
  `devbox run -c <plugin abs path> -- npm ci` (redirect output to a file).
- Every write lands under `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/` — verify
  with `pwd`/absolute paths. NEVER write into `/home/scott/code/steelCompendium/workspace/` except your report
  and evidence under the ledger dir. Use `git -C <abs path>` for every git command.
- **Workers never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault and expected — don't touch or flag it.
- `e2e/run.mjs` reads as BINARY to the agent shell's grep: use `grep -a`.
- Other sessions (SC-472, SC-540, SC-544) are running lifecycle/e2e on this machine RIGHT NOW. Never connect
  to, evaluate in, or kill another session's Obsidian/Xvfb.

## 2. The task

Ticket expected (verbatim): "each run uses a CDP port that only its own Obsidian is listening on (for example,
pick a free port per run, or confirm the CDP target's process is the one we spawned). If the port is taken
anyway, the run should exit 2 with the environment message."

Implement ledger rulings **R1 (a)–(e), R2, R4** exactly as written in `decisions.md`. Steps in order:

**A. Measure** (a throwaway Obsidian on a private Xvfb display in `:5400–:5439` and private ports `47000–47999`;
copy how lifecycle builds its scratch `udd` + vault, or use a minimal udd): with `--remote-debugging-port=0`,
does Obsidian 1.15.0 write `DevToolsActivePort` into the `--user-data-dir` (content, how fast after spawn)? Does
it print `DevTools listening on ws://…` on stderr? With a fixed port n that is ALREADY bound by another listener
(use a plain `node -e` TCP listener you start on a private port, not someone's Obsidian): does Obsidian keep
running, does it write the file / the stderr line, what does it print? Record the numbers in the report.

**B. Reproduce on base** (R2): temporary, uncommitted edits only (private Xvfb range `:5400–:5439` in place of
`:160–:199`, plus a wall-clock barrier env var right before the `portBusy` check). Two real lifecycle runs
started together on the SAME private port (e.g. `DSE_LIFECYCLE_PORT=47262`), `--only=` one cheap scenario
(pick the fastest; say which). Isolation: if two runs from one tree collide on build output or scratch dirs,
use a second throwaway `git worktree add` of the same sha at an absolute path under your private scratch
folder. Base is reproduced when one run attaches to the other run's Obsidian — make it visible (log each run's
spawned Obsidian PID and the `app.vault.adapter.basePath` it ends up talking to, or the mass FAIL). Give a hit
rate over N tries (e.g. 5–10).

**C. Fix** per R1: new helper (e.g. `scripts/cdp-owned.mjs`) + jest unit tests for it (fake child stderr /
fake DevToolsActivePort file / fake HTTP `/json/version`, timeouts, GUID mismatch → env failure, child exit →
env failure); wire it into `visual-harness/obsidian-lifecycle.mjs` around `:4626–:4677` ONLY. The ownership
proof (our process reports port + GUID, GUID equals `/json/version` on that port) must be complete BEFORE
`Cdp.connect`. Default with no env var = port 0. Explicit `DSE_LIFECYCLE_PORT` keeps its pre-check and gets
the same proof. Update the `// Env:` header comment at `:118`. Do NOT touch any scenario code, `src/`, styles,
or e2e/docs-shots/obsidian-camera (a separate survey decides those).

**D. Prove the fix** with the B harness (same temporary edits, then revert): (i) two runs together on the
DEFAULT (port 0): both pass, distinct ports, N tries; (ii) two runs together on the same explicit private port:
one passes, the other exits 2 with the env message naming the port, and its log shows no evaluation in the
winner's Obsidian; N tries. (iii) a single run with an explicit private port that a plain node TCP listener
already holds → exit 2 (pre-check). (iv) a fake CDP server (node http on a private port answering
`/json/version` and `/json/list` with a page target) that starts listening AFTER the pre-check but before
Obsidian spawns (use the barrier/delay seam) → exit 2, ownership mismatch, never `Cdp.connect`ed.
Commit after each coherent step; final tree has no temporary edits (`git -C <plugin> diff eafe76e1 --stat`
must show only the helper, its test, the lifecycle start-up block and any doc text).

## 3. Gates (dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)

Read its rows 1–4b and the CURRENT block. Run each gate as ONE blocking foreground Bash call, output
redirected to a uniquely named file in your private scratch folder; record exit codes from a script FILE run
through `devbox run -c <plugin abs path> -- bash <script>` (never `bash -c '…; echo rc=$?'`, which always says 0).

Expected (CURRENT @ eafe76e1):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: base `6287 passed / 1 skipped / 251 of 252 suites` after a shots run; on a fresh worktree WITHOUT a
  shots run `6286 / 2`. Yours = that + your new tests, +1 suite. Report the exact line.
- lifecycle `46/46`, as THREE `--only` parts (21 + 16 + 9, ids in skill row 4; G-S56 last), EACH with its own
  explicit private `DSE_LIFECYCLE_PORT` (e.g. 47301, 47302, 47303 — dispatcher rule: set your own port for every
  gate run). Each part must print `OBSIDIAN-LIFECYCLE done: <n>/<n> ok, 0 failed`.
- e2e full run (`npm run e2e`, no `--only`): `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage:
  89/89 pairs`, exit 0.
- `main.js` and `styles.css` byte-identical to a build at `eafe76e1` (sha256 both) — then shots/freeze/parity
  carry; do not run them.
Load: check `/proc/loadavg` before each real-Obsidian gate and note it. A lifecycle FAIL under very high load
in a scroll scenario: re-run that part once before believing it, and report both runs.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-impl-report.md`
— it must OPEN with a ≤10-line executive summary (verdict, final sha, gate lines, repro hit rates). Evidence
(logs) under `.../sc551-lifecycle-cdp-port-race/sc551-r1-evidence/`. Then: measurements (A), repro (B) with
hit rate and the evidence log paths, design (C) with file:line, proofs (D), gate lines verbatim, and the two
lists `Drive-by fixes:` / `Follow-ups:`. Also write proposed dse-verify text (row 4 port sentence + the
`DSE_LIFECYCLE_PORT` paragraph at SKILL.md lines ~61-64) to
`.../sc551-lifecycle-cdp-port-race/sc551-r1-dse-verify-proposal.md` — do NOT edit SKILL.md itself.

## 5. Footguns (each cost real time once)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent
  agents. Lifecycle parts are ~6–8 min each: one part per Bash call, timeout 600000.
- No background gates and no Monitor waits: a job you start in the background does not wake you. The repro's
  two simultaneous runs may be started as two background processes FROM ONE foreground script that then
  `wait`s for both and prints both exit codes — that is one blocking call, which is fine.
- Private scratch folder only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r1-impl/`,
  uniquely named scripts/logs inside it. Write scratch files with the Write tool, not heredocs.
- `devbox run -c <abs path> -- …`; never `cd X && …` in a compound command.
- Never `pkill`/`killall` by pattern. Kill only a PID you spawned and recorded (check
  `readlink /proc/<pid>/cwd` or its command line contains your worktree / scratch path).
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob or `.superpowers/`.
  Delete only literal absolute paths you created.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the
  dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question;
  I will resume you. If you ever message anyway, the FIRST WORD must be `SC-551:`.
