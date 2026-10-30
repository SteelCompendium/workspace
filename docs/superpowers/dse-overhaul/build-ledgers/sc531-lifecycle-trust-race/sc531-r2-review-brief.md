# SC-531 r2 independent review brief

## 1. Context loading

- Ledger (current state, read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc531-lifecycle-trust-race/decisions.md`.
- The implementer's brief and report: `sc531-r1-brief.md`, `sc531-r1-report.md` in the same dir. Treat the
  report's claims as claims to verify, not facts.
- Failure evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r7-evidence/gate-lc2-attempt1-env.log`.
- Worktree dse repo: `/home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race/draw-steel-elements`,
  branch `sc531-lifecycle-trust-race`, head `4deb8cf` on base `develop 4f73043`. `git -C <dse path> fetch origin`; if
  `origin/develop` moved past the base, say so (do not rebase).
- **Do not edit the branch.** Probes go in scratch copies. Never edit anything under
  `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir. The main checkout's dse
  dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live
  vault — expected.
- **Workers never call the tracker** (Linear).
- Gate command shapes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. The task — adversarial review: execute and probe, not just read

Ticket fix direction (ledger): "make the observer start wait until its target is a Node, or retry the page eval
once." Owner decisions D1–D4 in the ledger define scope.

Check, with runtime probes:
1. The diff touches only the trust-dialog constants (`visual-harness/obsidian-lifecycle.mjs`,
   `e2e/driver/recorders.ts`) and the lifecycle start-up block; nothing that would conflict with SC-522's
   scenario work beyond that.
2. The in-page wait really defeats the race: re-run (or write your own) old-vs-new probe with `document.body`
   absent at install time. OLD must throw the exact TypeError; NEW must install exactly one observer and still
   dismiss a trust dialog that appears afterwards. Idempotency (two evals, one observer). Timeout path gives a
   clear message and the harness exits 2 (environment), not 1.
3. `ev` awaits the promise the new IIFE returns (`awaitPromise` or equivalent) at both call sites; a rejected
   promise surfaces as the harness's env failure rather than being swallowed.
4. The post-`layoutReady` re-assert is harmless when the observer is live and re-installs when the window flag
   is gone (probe: delete `window.__lcTrustObserver` after disconnecting it, re-eval, confirm a fresh observer
   dismisses a synthetic dialog).
5. Any new way to hang start-up (unbounded wait, a poll that never clears, a dismissal that now fires on DSE
   modals).
6. Re-run the gates on the head: tsc + lint, jest, lifecycle as two `--only` halves (20 + 21) — each its own
   blocking foreground Bash call with timeout 600000 — and e2e. Expected: tsc/lint clean; jest 6153 passed /
   1 skipped / 248 of 249 suites (fresh worktree without shots cache: one fewer / 2 skipped); lifecycle
   41/41; e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`. Use your own
   `DSE_LIFECYCLE_PORT` (e.g. 9293).

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Footguns (all binding)

- `git -C <absolute path>` for every git command; never `cd X && git …`.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race/draw-steel-elements -- bash <script file>`;
  no compound `cd … &&`. Devbox eats `$?`: record exit codes inside a script FILE and read each gate's
  summary line.
- One gate per Bash call, foreground, blocking; no `run_in_background`, no Monitor. Redirect gate output to a
  log file, do not stream it (600 s stream watchdog).
- Scratch: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc531-r2-review/`,
  uniquely named files, created with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob
  (`/tmp/dse-obsidian-lifecycle-*` is every effort's vault). Delete only literal paths you created. Never
  touch `.superpowers/` beyond your own `sc531-*` files.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains
  `worktrees/sc531-lifecycle-trust-race/` (or whose `/proc/<pid>/cwd` is inside it).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. Any message you do send must start with `SC-531:`.

## 4. Report & return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc531-lifecycle-trust-race/sc531-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / CHANGES, finding counts by severity, head sha,
gate numbers). Final text to me (the ticket-owner, not a human): raw facts — verdict, sha, findings one line
each with severity and file:line, measured gate numbers — plus the absolute path of every evidence artifact.
