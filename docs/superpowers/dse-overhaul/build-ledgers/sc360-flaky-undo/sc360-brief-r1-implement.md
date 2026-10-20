# SC-360 r1 brief — implementer: make two load-flaky sidebar jest tests deterministic

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/decisions.md` (the ledger — current-state scope; it beats anything else).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc360-flaky-undo`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc360-flaky-undo/draw-steel-elements`, branch `sc360-flaky-undo`, currently at `c616e22` == `origin/develop`. Run `git -C <plugin path> fetch origin` and confirm `origin/develop` is still `c616e22`; if it moved, `git -C <plugin path> rebase origin/develop` and note the new base in your report.
- Verify `pwd`/paths before every write. NEVER edit anything under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.
- Use `git -C <absolute path>` for every git command — never `cd X; git …`.
- Read the plugin's own `AGENTS.md`/`CLAUDE.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, exit-code footgun, the `rm -f main.js styles.css` before `npx jest` protocol, "Load-sensitive jest suites").
- You never call Linear/the tracker — not to read history, not to post.

## 2. The task
Two jest tests fail intermittently only when the host is loaded (other agents' batteries running, load average ~8-13), and pass on re-run:
- `test/dom/framework/sidebarInitiative.test.ts` ~line 350 — the SC-288 r2 "undo" case; on failure it received `"true"`.
- `test/dom/framework/sidebarEncounterHandoff.test.ts` ~line 416.
(Line numbers from 2026-09-24; they may have drifted — find the cases by content.)

Ticket text, verbatim from the ledger:
> This is probably a timing assumption in the test that breaks when the machine is busy. A flaky gate costs every agent a re-run and can hide a real failure. The fix is to find the timing dependency and make the test deterministic, for example with fake timers or by awaiting the real event.
> Look at both tests together; they may share a timing helper.

Owner hint (not a conclusion — verify): both files use real-time waits, e.g. `await new Promise((resolve) => setTimeout(resolve, 10))` (sidebarInitiative ~153, sidebarEncounterHandoff ~417) and a `PERSIST_DEBOUNCE_MS + 50` real wait (~246), plus `flushAsync` from `test/mocks/obsidian`. Check which production timers/debounces (`PERSIST_DEBOUNCE_MS`, any other setTimeout/requestAnimationFrame/debounce in the sidebar/ElementView path) these cases implicitly race against.

Method (use `superpowers:systematic-debugging`):
1. **Reproduce first.** Make the flake happen on demand at base `c616e22` before changing anything — e.g. run only those two files repeatedly under synthetic CPU load (spin N busy-loop processes you start yourself and record their PIDs, e.g. `for i in $(seq 1 $(nproc)); do (while :; do :; done) & echo $! >> <your-per-run-pidfile>; done`), and/or throttle with `--maxWorkers`, or temporarily inflate a delay locally to expose the race. Record the failure rate (e.g. "k fails / N runs"). If you cannot reproduce at all, say so and still identify the timing dependency by reading — then prove the fix by an injected-delay probe (temporarily make the competing timer slower/faster and show the old test breaks while the new one does not).
2. **Name the root cause** precisely: which wait races which timer/promise, with file:line on both sides.
3. **Fix in the tests** (fake timers, awaiting the real event/promise, or a deterministic flush helper). If both tests share the pattern, fix both, and if a shared helper is warranted put it in the test mocks/helpers — not in `src/`. Do not weaken assertions or delete cases; each test must still fail if the behaviour it guards regresses (show this: temporarily break the guarded behaviour and confirm the fixed test goes red, then revert).
4. **Owner ruling (from the ledger):** test-only fix preferred. If the root cause is a real production race (not a test timing assumption), STOP before changing `src/` and return STATUS: NEEDS_CONTEXT with the evidence.
5. Sweep the same two files for any other real-time waits of the same shape and fix those too (same files only); list anything similar you see in OTHER test files under `Follow-ups:` — do not edit them.
6. **Prove it:** run the two files repeatedly under the same synthetic load as step 1, after the fix — target ≥ 30 runs each, 0 failures — and report the numbers alongside the pre-fix failure rate. Kill your load processes by the PIDs you recorded (never `pkill`/`killall` by pattern).

Commit after each coherent step (message prefix `test(SC-360): `). No co-author trailers or AI attribution in commit messages.

## 3. Gates (dse-verify battery, against the worktree's `draw-steel-elements/`)
Expected at base `c616e22`: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **4849 passed / 1 skipped / 228 of 229 suites** (your change may move the passed count only if you add/split tests — explain any delta) · lifecycle **`OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`** · e2e **`OBSIDIAN-E2E done: 68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Lifecycle and e2e are required to land every dse change. Set your own port for lifecycle: `DSE_LIFECYCLE_PORT=9287 npm run obsidian-lifecycle`.
Check `/proc/loadavg` and note it next to each jest run. If jest shows a timeout-shaped red in `settings-tab`/`settings-preview`, that is the known load issue — re-run, do not "fix" it.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/sc360-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (root cause in one line, fix in one line, pre/post flake rates, head sha, battery numbers). Below: reproduction method + numbers, root cause with file:line, diff summary, mutation proof, gate lines verbatim, `Drive-by fixes:`, `Follow-ups:`.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), head sha, pre-fix and post-fix flake rates, battery numbers, and the absolute path of every evidence artifact (report, logs).

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; do not background a gate and wait for a notification that will never come.
- Devbox: Go/Node not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc360-flaky-undo/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc360-flaky-undo/draw-steel-elements && <cmd> > <logfile> 2>&1; echo exit=$? >> <logfile>'` — devbox eats `$?`/`$PIPESTATUS`, and piping a gate (`| tail`) eats failures. Read the gate's own summary line.
- Never `pkill`/`killall` by a command pattern — other agents run the same gates concurrently. Kill only by PID, and only PIDs you started or whose command line contains `worktrees/sc360-flaky-undo/`.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only paths you created and recorded. Never `rm -rf` anything under `.superpowers/` except your own `sc360-*` files.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-360:`.
