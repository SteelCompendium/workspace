# SC-290 implementer brief — preserve a fence's full info string on write-back

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/decisions.md`
  (the ledger — the spec is quoted there verbatim) and the original finding,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rereview-report.md` § N-6.
- Also read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery) and
  `/home/scott/code/steelCompendium/worktrees/sc290-info-string/draw-steel-elements/AGENTS.md` if present.
- Your worktree: `/home/scott/code/steelCompendium/worktrees/sc290-info-string/draw-steel-elements`, branch
  `sc290-info-string`, cut at `origin/develop` **0d69ec9**. Before anything:
  `git -C <that path> fetch origin && git -C <that path> rebase origin/develop` and confirm the base is still 0d69ec9
  (if develop moved, rebase onto it and report the new base sha). Run `npm ci` there if `node_modules` is missing or
  `package.json` changed.
- **Verify `pwd` / use absolute paths before every write. Never write anything under
  `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.** The main checkout is
  shared global state.
- **Every git command uses `git -C <absolute path>`** — never `cd X; git …` (a failed cd once ran a reset in the main
  checkout).
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

Spec (ticket, verbatim):

> Both `SidebarBlockHost.replaceSource` and `ReadingModeBlockHost.replaceSource` re-emit the fence line as
> `${fence}${language}` from an `OPEN_FENCE = /^([`~]{3,})(\S*)/` first-token parse, so any interactive write to a
> block whose fence carries an info string past the language token (e.g. ```` ```ds-counter extra ````) rewrites the
> fence line and silently drops the extra tokens.
>
> Fix: preserve the full info string in both `replaceSource` re-emits.

Code: `src/framework/host/SidebarBlockHost.ts` (OPEN_FENCE re-declared at ~line 54, `replaceSource` ~line 310) and
`src/framework/host/ReadingModeBlockHost.ts`. Also check `LivePreviewBlockHost.ts` and any other writer that
re-emits an opening fence line (grep for the fence/language reassembly) — fix every one that drops the info string,
and report which you checked.

Requirements:
1. After any interactive write, the opening fence line keeps everything past the fence characters exactly as it was
   (language token plus the rest of the info string, including the original spacing between tokens). Language-only
   fences (```` ```ds-counter ````) and tilde fences must be byte-identical to today's output.
2. If the code deliberately LENGTHENS or otherwise changes the fence run (e.g. to accommodate backticks in the new
   body), keep that behaviour and still carry the info string. Do not change how the closing fence is emitted.
3. Prefer one shared helper over two diverging copies, if that is a small, local change (SidebarBlockHost's comment
   says it re-declares OPEN_FENCE because ReadingModeBlockHost doesn't export it — exporting a shared helper is fine).
   Do not refactor anything else.
4. Tests (jest, per the repo's conventions): regression tests for each fixed host covering at least:
   multi-token info string (```` ```ds-counter extra ````), multiple spaces / extra tokens
   (```` ```ds-counter  foo bar ````), tilde fence with info string, language-only fence unchanged, a 4+ backtick
   fence with info string, and (if the code lengthens fences) the lengthened case. Each test must FAIL on 0d69ec9 —
   prove it by running the new tests against the unfixed code (stash the fix, or run before committing it) and
   record the failing count.
5. A real-Obsidian check: if the e2e suite (`e2e/`, guide `e2e/README.md`) has an existing pattern for "interact
   with a block, then assert the note's file text", add one e2e test proving a `ds-counter extra` fence survives a
   click write; if the coverage-pairs manifest requires a manifest entry for it, follow the README. If no such
   pattern exists, say so and skip — do not build e2e infrastructure for this.
6. CHANGELOG: if `draw-steel-elements` has its own `CHANGELOG.md` with an Unreleased section, add one bullet there
   (user-facing: "Clicking a control no longer strips extra words after the block type on the opening fence line").
   Do NOT touch the workspace-level CHANGELOG.
7. Commit after every coherent step, on branch `sc290-info-string`, in the DSE repo only. Do not push. Commit
   messages: no AI attribution trailers.

## 3. Gates — full dse-verify battery, in order

Expected numbers at dispatch (dse develop 1a4c6d3 lineage; your base 0d69ec9 is a justfile-only follow-up):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **4732 passed / 1 skipped / 227 of 228 suites** + your new tests (report the exact new total)
- lifecycle **`OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`** — set your own port, e.g. `DSE_LIFECYCLE_PORT=9291`
- e2e **`OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`** (counts move by exactly what
  you add)
- shots **572**, 0 FAIL; freeze **`freeze OK (276/276 …)`** (this change should move no pixels)
- parity **0 GAPs / 0 undeclared / 24 DECLARED**, run LAST

Command shapes: devbox, per dse-verify. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc290-info-string/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc290-info-string/draw-steel-elements && <cmd>'`.
Devbox eats exit codes and piping eats failures — run each gate via a small wrapper script file that captures the
exit code into a per-run unique log path, or redirect bare output to a file; read the gate's own summary line.

## 4. Footguns (read every one)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- **Run every gate in the FOREGROUND** and wait for it in the same tool call (timeout up to 600000 ms). Do not
  background a gate and end your turn "waiting for the notification" — it never comes.
- **Never `pkill`/`killall` by a command pattern** — other worktrees run the same gates concurrently. Kill only by
  PID, and only a PID whose command line contains `worktrees/sc290-info-string/` (`pgrep -af "worktrees/sc290-info-string/"`).
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`. If freeze is not `276/276 OK`,
  STOP and report — do not rebaseline.
- Never `rm -rf` anything under `/home/scott/code/steelCompendium/workspace/.superpowers/`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level
  dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your
  report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-290:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-impl-report.md`. It must
open with a ≤10-line executive summary (verdict, head sha, base sha, every gate's summary line).
Body: root cause in 2-3 lines, files changed, which writers you checked, the new tests and their measured FAIL count on
the unfixed code, e2e test added or why not, `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`,
branch, base sha, head sha, each gate's summary line verbatim, new-test count and the FAIL-on-base count, and the
absolute path of every evidence artifact (report, gate logs).
