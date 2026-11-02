# SC-546 r1 — reproduce the Xvfb display race, then fix it (e2e + lifecycle + docs-shots)

You are the r1 implementer for SC-546. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/decisions.md`
  (the ledger: the owner's findings with file:line, and the owner rulings you must follow).
- Background (optional, skim the summary only): SC-539's review finding INFO 4 in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc539-e2e-chrf02-flake/sc539-r3-review-report.md`
  line 38. SC-539 added `e2e/x11-pointer.mjs` (parks the pointer on the private display) and `-noreset`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race`. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements`, on branch
  `sc546-e2e-xvfb-race` at `97284051` (= `origin/develop`). First: `git -C <plugin> fetch origin` and confirm
  `origin/develop` is still `97284051`; if it moved, `git -C <plugin> rebase origin/develop` and say so.
  Verify every write lands under `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/`.
  NEVER write into `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir.
- **Workers never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault and expected — not foreign changes, don't touch or flag it.
- `e2e/run.mjs` reads as a BINARY file to grep (the default grep prints nothing). Use `grep -a`.

## 2. The task

Ticket problem: `startXvfb` treats "the socket file for display :n exists" as "my Xvfb is up". Two runners that
pick the same n at the same moment: the second Xvfb loses the lock and exits, but the second runner still sees
the first's socket and runs on the first runner's display; when the first run tears down, the second loses its
screen. Ticket expected (verbatim): "a runner only uses a display whose Xvfb it started itself (for example,
check its own Xvfb process is still alive after the socket appears, or use Xvfb's `-displayfd` to get the number
from the server)."

Owner rulings (verbatim from the ledger):

> Scope: fix e2e (the ticket) AND lifecycle (same race, required gate, run concurrently by many owners) AND
> docs-shots (same pattern; folds in for free if all three share one helper). One small shared helper that
> proves ownership; each caller keeps its own range.

> Ownership proof: the display counts as ours only when OUR Xvfb process says so — use `-displayfd <fd>` on the
> explicit `:n` (Xvfb writes the number to the fd only once it is listening; a server that lost the lock exits
> without writing), with the lock-file PID check (`/tmp/.X<n>-lock` holds the server PID) as a belt if
> `-displayfd` misbehaves on this Xvfb build. Keep the explicit ranges (never let Xvfb pick a number itself: that
> would land on :0/:2 near :1). Implementer measures `-displayfd` on devbox Xvfb 21.1.24 before relying on it.

> Repro needs no exclusive :200-:239: the base repro runs with a TEMPORARY, uncommitted range constant in a
> private range (:5300-:5339), plus a start barrier, then is reverted.

Steps, in order:

**A. Measure Xvfb behaviour** (throwaway Xvfb on :5300-:5339 only): does `-displayfd 3` with an explicit `:n`
write `n\n` to fd 3 once listening? What happens when :n is already held by another live Xvfb (exit code, does it
write anything, how fast does it exit)? What does `/tmp/.X<n>-lock` contain (PID text, padding)? Does SIGTERM
remove the lock + socket, does SIGKILL leave them behind?

**B. Reproduce on base code.** Temporary, uncommitted edit: e2e `XVFB_RANGE` -> `[5300, 5339]`, plus a barrier
right before the display loop (e.g. sleep until a wall-clock instant passed in an env var) so two runners enter
`startXvfb` within a millisecond. Start TWO real e2e runners (`npm run e2e -- --only=<one cheap spec id>
--shards=1`, each from... the same worktree is fine if their run dirs are distinct; check how run.mjs isolates
runs — if two runs from one tree collide on build output or run dirs, use a second throwaway `git worktree add`
of the same sha at an absolute path under your scratch folder) together. Record both `display :N` start lines.
Base is reproduced when both runners report the SAME display. Repeat enough times to give a hit rate (e.g. 10
pairs). Also show the downstream symptom once if cheap (the second run fails when the first tears down) — not
required. Then the same race at function level for lifecycle and docs-shots (a small node script that runs their
current `startXvfb` logic in two processes with the barrier, private range) — this is evidence for the ledger
note "lifecycle has the same race". Revert every temporary edit (`git -C <plugin> diff` must be empty before C).

**C. Fix.** One shared helper module (pick the location; e2e and visual-harness are separate dirs — say why you
chose it) that takes a range, and for each free-looking n spawns `Xvfb :n ... -displayfd <fd>` (plus each
caller's existing args: e2e keeps `-noreset`; lifecycle and docs-shots keep theirs) and resolves only when OUR
child writes the number; if our child exits first, try the next n; bounded overall timeout; lock-PID check as a
belt if A shows it is needed. Callers: `e2e/run.mjs` (keep `xvfbPid`, `spawned`, the EnvError messages and
exit-2 semantics), `visual-harness/obsidian-lifecycle.mjs` (keep `liveXvfb` tracking and `envFail`; it gains
the try-next-number loop), `visual-harness/docs-shots.mjs` (keep its preferred-display behaviour and its
return-null contract). No behaviour change for `--headed` e2e or when `DSE_DOCS_NO_XVFB`/display :1 opt-ins are
used. Code comment at the helper saying WHY (the socket belongs to whoever won the lock). Commit in small
coherent commits on the branch (commit after each step — nothing uncommitted through a gate).

**D. Prove the fix** with the same two-runner barrier repro from B (temporary range + barrier again, on top of
the fix, uncommitted, reverted after): both runners must report DIFFERENT displays and both finish 0 failed, same
number of pairs as B or more. Plus a helper-level stress: 4 processes x 25 rounds racing for the same range —
zero shared displays, zero leaked Xvfb/lock/socket afterwards.

## 3. Gates (the `dse-verify` skill at `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, rows 1-4b)

Expected at `97284051`:
- `npm run tsc` clean (incl. `tsc -p e2e`); `npm run lint` clean (incl. `e2e/`).
- jest **6252 passed / 1 skipped / 249 of 250 suites** (a fresh worktree without a shots cache reads one fewer
  passed and 2 skipped — 6251/2 is fine; say which). `rm -f main.js styles.css` in the plugin root before jest.
- lifecycle as THREE separate `--only` calls, each one blocking foreground Bash call, union **45/45**:
  - `--only=G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  - `--only=G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  - `--only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S56` (8)
  Use `DSE_LIFECYCLE_PORT=<a port of your own choice, not 9262>` so you never collide with another owner. The
  start line must show a display in :160-:199.
- e2e full run (no `--only`, normal range, fix committed, no temporary edits): **`OBSIDIAN-E2E done: 124/124 ok,
  0 failed, 0 known-bug, coverage: 87/87 pairs`**, display in :200-:239, plus the `pointer parked at 0,0` line.
  Run it twice.
- Shots/freeze/parity are carried (harness-only): prove `main.js` and `styles.css` built on your HEAD are
  byte-identical to a build of `97284051` (sha256 both).
- docs-shots: no full run required; prove its `startXvfb` path at function level (D's stress covers the helper;
  one call through docs-shots' own wrapper on a private display is enough).

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race/draw-steel-elements -- bash <script file>`.
  Never a compound `cd X && …`. Gate scripts are FILES you write with the Write tool into your private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r1-impl/`
  (the scratchpad is shared by every agent — never a generic name like `gate.sh`; prefix `sc546-r1-`). Inside a
  script, record the exit code in the script (`npm run e2e > log 2>&1; echo "rc=$?" > rcfile`), never via
  `bash -c '…; echo rc=$?'` (always 0 under devbox). Never pipe a gate into `tail`.
- ONE gate per Bash call, blocking foreground, no `run_in_background`, no Monitor. Lifecycle is three calls.
  Redirect long output to a file (the 600 s stream watchdog kills silent agents); set the Bash timeout to 600000.
- **Never touch display :1** (Scott's real display). Never set DISPLAY=:1 for a probe. Probes use :5300-:5339 only.
- **Never `pkill`/`killall` by pattern** — SC-534 runs many concurrent e2e runs right now; a pattern kills
  theirs. Kill only by PID you recorded, after checking `readlink /proc/<pid>/cwd` is in your worktree or the
  PID is an Xvfb you spawned yourself on :53xx. Clean up throwaway Xvfb with SIGTERM (SIGKILL may leave
  `/tmp/.X53xx-lock` + socket behind; if so, remove them by LITERAL absolute path, one per command).
- **Never `rm` with a shell-variable target** (`rm -f $D/x` hangs on a permission prompt nobody answers). Never
  `rm` a glob, never `rm -rf /tmp/dse-*` or any shared `/tmp` pattern, never touch `.superpowers/` outside
  `.superpowers/sdd/sc546-e2e-xvfb-race/`. Overwrite logs with `>` or use fresh unique names instead.
- Every git command is `git -C <absolute path>`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- No tags, no pushes, no landing. Commit on the branch only.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes
  to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
  STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume
  you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-546:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r1-impl-report.md`,
opening with a ≤10-line executive summary. Copy every gate log and probe log you cite into the ledger dir with
the `sc546-r1-` prefix. Include: A's measured facts; B's hit rate (pairs, how many shared a display) for e2e and
for lifecycle/docs-shots at function level; the commits (sha + one line each); D's numbers; every gate's summary
line; the sha256 lines; `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts (verdict, shas, measured numbers), no prose,
plus the absolute filesystem path of every evidence artifact you produced (report, logs, probe scripts).
