# SC-531 r1 implementer brief — lifecycle trust-dialog start-up race

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc531-lifecycle-trust-race/decisions.md`
  (the ledger — current state; it outranks anything else you read).
- Failure evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r7-evidence/gate-lc2-attempt1-env.log`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race`; dse repo at
  `/home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race/draw-steel-elements`, branch
  `sc531-lifecycle-trust-race`, cut at `develop` @ `4f73043`. Verify `pwd`/branch before any write.
  First: `git -C <dse path> fetch origin` and confirm `origin/develop` is still `4f73043`; if it moved,
  `git -C <dse path> rebase origin/develop` and note the new base in your report.
- **Never edit anything under `/home/scott/code/steelCompendium/workspace/`** except writing your report
  and scratch into the ledger dir named below. The main checkout's dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault —
  expected, not yours, do not touch or report it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for gate command
  shapes (lifecycle and e2e sections, and "Current expected numbers").

## 2. The task

The lifecycle harness once died at start-up (exit 2) with
`page eval failed: TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'`,
right after `await t.waitFor('!!document.body', …)` passed, inside `await t.ev(AUTO_DISMISS_TRUST_DIALOG)`
(`visual-harness/obsidian-lifecycle.mjs`, constant at ~line 477, call site in `main()` ~line 3501).
Two separate CDP evals, so `document.body` can be null again by the second one (most likely the page's
document/execution context was replaced between them).

Ticket fix direction (quoted from the ledger): "make the observer start wait until its target is a Node, or
retry the page eval once."

Do (ledger D2–D4):

1. **Lifecycle constant** `AUTO_DISMISS_TRUST_DIALOG` (`obsidian-lifecycle.mjs`): make it wait in-page until
   `document.body instanceof Node` before calling `observe` — an async IIFE that polls (e.g. every 25 ms) with
   a bound (e.g. 20 s) and throws a clear message on timeout (so the harness reports it as before, exit 2).
   Keep the `window.__lcTrustObserver` idempotency guard and the one-shot scan of already-open
   `.modal-container`s. Confirm `t.ev` awaits a returned promise (check how `ev` calls `Runtime.evaluate` —
   `awaitPromise`); if it does not, make this call site await correctly without changing `ev` for other callers.
   Keep the existing explanatory comment block; add a short note that names SC-531 and why.
2. **Lifecycle `main()` start-up block**: after `waitFor('window.app?.workspace?.layoutReady === true' …)`,
   evaluate `AUTO_DISMISS_TRUST_DIALOG` once more (idempotent: a no-op when the observer is still there; a
   re-install if the page's context was replaced and the flag went with it). Short comment, SC-531.
3. **e2e copy** (`e2e/driver/recorders.ts`, `AUTO_DISMISS_TRUST_DIALOG`, flag `__dseTrustObserver`): same
   in-page body wait. Its call site already waits for body + layoutReady in a prior eval; do not restructure
   `installRecorders` beyond what the change needs.
4. **Root-cause probe (bounded, scratch only, not committed):** do 3–5 bare start-ups of the lifecycle
   harness's Obsidian launch path (or a scratch copy of `obsidian-lifecycle.mjs` that exits after the
   start-up block), logging CDP `Runtime.executionContextCreated/Destroyed` / `Page.frameNavigated` events
   and `document.body` presence from first CDP attach until `layoutReady`. Report what you saw (did a context
   replacement or navigation happen after body first appeared?). Do NOT spend more than ~5 launches; a
   non-reproduction is an acceptable answer.
5. **Anti-vacuity probe (scratch only):** with jsdom (it is in `node_modules` for jest) or a scratch CDP page,
   evaluate the OLD and NEW strings (both lifecycle and e2e copies) against a document whose `body` is
   absent at install time and appears ~200 ms later. Expected: OLD throws the exact TypeError; NEW resolves
   true, installs exactly one observer, and then clicks a synthetic
   `.modal-container > .modal.mod-trust-folder .modal-header-button` added after install. Also: NEW evaluated
   twice installs one observer (idempotent); NEW with body never appearing throws your timeout message (use a
   short bound in the probe if the bound is parameterisable, otherwise just state it).

Out of scope: anything else in `obsidian-lifecycle.mjs` (SC-522 is concurrently adding scenario G-S52 to that
file — keep your diff to the constant and the start-up block so it rebases cleanly), plugin source, shots.
If you spot something worth doing elsewhere, list it under `Follow-ups:` — do not do it.

Commit in the dse repo on branch `sc531-lifecycle-trust-race` after each coherent step (e.g. one commit for
the fix, conventional message `fix(harness): …` naming SC-531). No AI attribution / co-author trailers in
commits. Do not push. Do not touch the superproject pointer.

## 3. Gates (in order, on your final commit) — see dse-verify for command shapes

Expected (CURRENT, dse `develop` @ `4f73043`):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest **6153 passed / 1 skipped / 248 of 249 suites** — on a fresh worktree without a shots cache it reads
  one fewer passed and 2 skipped; that is expected (dse-verify row 3). Report what you get.
- lifecycle **41/41 ok, 0 failed** as TWO `--only` halves (20 + 21), each its own blocking foreground Bash
  call (timeout 600000). Derive the 41 scenario ids from the harness; report the union. Set your own
  `DSE_LIFECYCLE_PORT` (e.g. 9291) to avoid colliding with concurrent efforts.
- e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**, exit 0.
- Not needed: shots, freeze, parity (harness-only; no plugin byte change — confirm `git diff --stat
  4f73043..HEAD` touches only `visual-harness/obsidian-lifecycle.mjs` and `e2e/driver/recorders.ts`).

## 4. Footguns (all binding)

- Run every git command as `git -C <absolute path>`; never `cd X && git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc531-lifecycle-trust-race/draw-steel-elements -- bash <script file>`.
  Never a compound `cd … &&` around devbox. Devbox's wrapper eats `$?`: record exit codes inside a script
  FILE that you run through devbox, and read each gate's own summary line.
- **One gate per Bash call, foreground, blocking.** No `run_in_background`, no Monitor, no background jobs.
  Redirect each gate's output to its own log file (do not stream it); the 600 s stream watchdog kills silent
  agents.
- Scratch: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc531-r1-impl/`
  with uniquely named scripts/logs (`sc531-gate-tsc.sh`, …). Create files with the Write tool.
- **No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob** (e.g.
  `/tmp/dse-obsidian-lifecycle-*` is every effort's vault). Delete only a literal path you created and
  recorded. Never touch the shared `.superpowers/` dir beyond your own `sc531-*` files.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc531-lifecycle-trust-race/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- Never create a tag or release on draw-steel-elements.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'`
  routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report — I will resume you with the answer. If you ever do
  send a message anyway, its FIRST WORD must be `SC-531:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc531-lifecycle-trust-race/sc531-r1-report.md`.
Open it with a ≤10-line executive summary (verdict, final sha, gate numbers, root-cause probe result in one
line). Then: diff summary with file:line, probe results (old vs new), gate logs, `Drive-by fixes:` and
`Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED),
final dse sha and branch, gate numbers as measured, probe outcomes — no prose. Plus the absolute filesystem
path of every evidence artifact you produced (report, gate logs, probe scripts and their outputs).
