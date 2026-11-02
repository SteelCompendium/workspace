# SC-546 r2 — independent adversarial review of the Xvfb ownership fix

You are the r2 reviewer for SC-546. You did not write this code. Your final text goes to the ticket-owner.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/decisions.md`.
- The implementer's brief and report (read the report's executive summary, then whatever you need):
  `.../sc546-e2e-xvfb-race/sc546-brief-r1-impl.md`, `.../sc546-e2e-xvfb-race/sc546-r1-impl-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race`, plugin dir
  `…/draw-steel-elements`, branch `sc546-e2e-xvfb-race`, HEAD `cfb16433` on `origin/develop` `dabfb518`.
  Diff: `git -C <plugin> diff dabfb518..HEAD`. Verify `pwd`/paths before any write; write nothing into the
  branch except an uncommitted probe edit you revert (and say so). Do not commit.
- Workers never call the tracker. Scott's main-checkout dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json`, `demo-vault/*.md`) is expected.
- `e2e/run.mjs` reads as BINARY to grep: use `grep -a`.

## 2. The task — execute and probe, don't just read

Owner rulings the fix must honour (verbatim):

> Scope: fix e2e (the ticket) AND lifecycle (same race, required gate, run concurrently by many owners) AND
> docs-shots (same pattern; folds in for free if all three share one helper). One small shared helper that
> proves ownership; each caller keeps its own range.

> Ownership proof: the display counts as ours only when OUR Xvfb process says so — use `-displayfd <fd>` on the
> explicit `:n` (Xvfb writes the number to the fd only once it is listening; a server that lost the lock exits
> without writing), with the lock-file PID check (`/tmp/.X<n>-lock` holds the server PID) as a belt if
> `-displayfd` misbehaves on this Xvfb build. Keep the explicit ranges (never let Xvfb pick a number itself: that
> would land on :0/:2 near :1).

Probe at least:
1. Re-run the implementer's two-runner barrier repro yourself (private range :5340-:5379 so you never meet the
   implementer's leftovers): base reproduces a shared display, head never does.
2. Failure paths: our Xvfb exits immediately (bad arg / missing binary), Xvfb hangs without writing the fd
   (timeout), every number in range taken, a stale lock from a dead PID, a socket with no lock, a lock with a live
   foreign PID. Each must give the right EnvError/exit 2 / envFail / null, never the wrong display, never a hang.
3. Leaks: after success, after each failure path, after SIGINT/SIGTERM of the runner mid-run — no Xvfb, lock,
   socket, or fd left; the pipe fd does not keep node alive or break `reapAll()`/`xvfbPid` accounting.
4. Callers: e2e `--headed` untouched; lifecycle keeps `liveXvfb` tracking and `:160-:199`; docs-shots keeps its
   preferred-display and `DSE_DOCS_NO_XVFB` behaviour; nothing can ever choose :1.
5. Re-run one full e2e (normal range) and lifecycle part 3 (`--only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S57,G-S56`,
   `DSE_LIFECYCLE_PORT` of your own, not 9262). Expected: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug,
   coverage: 87/87 pairs`; `9/9 ok, 0 failed`.
6. **Mixed fleet.** The implementer measured that an Xvfb started with `-displayfd` creates NO
   `/tmp/.X<n>-lock`. Until every worktree rebases, OLD runners (pre-check "socket or lock exists", then
   "socket exists = mine") run beside NEW ones. Probe on your private range: what actually excludes two servers
   on the same :n when one has no lock file (abstract-namespace socket? the filesystem socket?); can an old
   runner adopt a new runner's display or vice versa; does a SIGKILLed new-style Xvfb (stale socket file, no
   lock) make a later start of that number succeed, fail, or get skipped by the pre-check; does the helper's
   own pre-check still skip numbers held by an old-style Xvfb. Say whether anything here needs a fix or only a
   sentence in the docs.
7. **jest test `test/unit/build/xvfbOwned.test.ts`** runs in CI (no Xvfb there): confirm it never needs a real
   X server, never touches `/tmp/.X11-unix` numbers another run could be using, cleans its temp dir, and is not
   load-flaky (run it 5x under `npx jest test/unit/build/xvfbOwned.test.ts`). Also confirm it would FAIL against
   the old "socket exists = mine" logic (not vacuous).
8. Check the implementer's claims in its report against what you measure; flag any that don't hold.

Findings by severity (BLOCKER / IMPORTANT / LOW / INFO) with file:line, failure scenario, prescribed fix.

## 3. Footguns

(same as r1 brief §4 — read them there; they all apply. Your private scratch folder is
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc546-r2-review/`,
files prefixed `sc546-r2-`.) Never touch :1. Never pkill by pattern. No `rm` with a variable target or a glob.
One gate per foreground Bash call. `devbox run -c <abs plugin path> -- bash <script file>`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND / FIX FIRST). Logs copied to the ledger dir with the
`sc546-r2-` prefix. If the report-file write is blocked, return the report inline.

You cannot SendMessage me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you message
anyway, the first word must be `SC-546:`. Return raw facts, shas, numbers, and absolute paths of every artifact.
