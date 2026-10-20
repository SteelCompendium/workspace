# SC-454 implementer brief, round 1 — delete dead src/utils/CodeBlocks.ts

## 1. Context loading
- Read the ledger first: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc454-dead-codeblocks/decisions.md
- Background (Follow-ups section only): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-impl-report.md
- Worktree: /home/scott/code/steelCompendium/worktrees/sc454-dead-codeblocks — the plugin is its
  `draw-steel-elements/` submodule, on branch `sc454-dead-codeblocks`.
  ALL edits happen there. Never write under /home/scott/code/steelCompendium/workspace/ except the
  report file in the ledger dir. Verify `pwd` before any write.
- Use `git -C <absolute path>` for every git command; never `cd X; git ...` (a failed cd once ran
  git in the shared main checkout).
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc454-dead-codeblocks/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `ab34293`; if it moved, rebase onto it and record the new sha.
- Read the plugin's AGENTS.md/CLAUDE.md, and the `dse-verify` skill at
  /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (whole battery, command
  shapes, freeze/parity rules).
- You never call the tracker (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. Task
The ticket text, verbatim:

> Delete it and its unit tests, after confirming it is unused (including from `e2e/` and
> `visual-harness/`). If something does still use it, switch that caller to the shared helper
> `src/framework/host/fenceLine.ts` that SC-290 added.

Steps:
1. Confirm unused: grep the whole plugin (src/, test/, e2e/, visual-harness/, scripts, build config,
   esbuild entry points, jest config, any dynamic `require`/`import()` strings) for `CodeBlocks` and
   `utils/CodeBlocks`. The owner's pre-grep found only comments/docs (listed in the ledger). If you
   find a real caller, STOP and return STATUS: NEEDS_CONTEXT with the caller — do not switch it yet.
2. `git rm` src/utils/CodeBlocks.ts and its unit tests (expect test/unit/utils/code-blocks.test.ts;
   find any others). Note how many tests/suites that removes, including any `test.failing` cases.
3. Comments/docs, per the owner ruling in the ledger: comments that describe CodeBlocks as live code
   get reworded to past tense ("the former src/utils/CodeBlocks.ts, deleted in SC-454"), keeping
   their byte-compat reasoning intact; `.repo-docs/architecture.md` row for `CodeBlocks.ts` (~line
   524) is removed and the rows around lines 117/151 are made past tense. Check
   test/dom/framework/reading-mode-host.test.ts line ~5, which points at code-blocks.test.ts as an
   oracle — reword it so it does not cite a deleted file as current. No behavior change anywhere.
4. Extra evidence: build `main.js` at ab34293 and at your head and compare sha256 (esbuild should
   tree-shake an unimported file, so expect identical). Report both hashes.
5. Commit in the submodule (conventional message, e.g. `refactor: SC-454 — delete dead
   src/utils/CodeBlocks.ts and its tests`). No co-author trailers or AI attribution in the message.
   Do NOT touch the superproject pointer, CHANGELOG, tags, or releases. Never create a tag.

## 3. Gates — the full dse-verify battery, in its order
Expected at base ab34293 (from the skill's CURRENT block):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest 5262 passed / 1 skipped / 230 of 231 suites — your count drops by exactly the deleted tests;
  report the exact new numbers and the arithmetic (5262 - N).
- lifecycle 27/27
- e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`
- shots 572, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)`
- freeze `freeze OK (276/276 …)` (no rebaseline expected)
- parity 0 GAPs / 0 undeclared / 24 DECLARED

## 4. Footguns
- Devbox: tools are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc454-dead-codeblocks/draw-steel-elements -- bash -c 'cd ... && ...'`.
  Devbox's sh wrapper eats `$?` and pipes eat failures: run gates via wrapper script FILES that
  capture the exit code, with output redirected to log files — never `| tail` a gate.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents. Run gates in the FOREGROUND; never background a gate and wait for a notification
  that will not come.
- Scratch: the session scratchpad
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad
  is shared by every agent. Use ONLY your private subfolder `<scratchpad>/sc454-impl-r1/`, with
  uniquely named scripts and logs inside it (e.g. `sc454-impl-r1-jest.log`).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc454-dead-codeblocks/` (check with `pgrep -af`).
- Never `rm -rf` a shared glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/`
  dir. Delete only paths you created and recorded.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale main.js shadows main.ts),
  per dse-verify.
- `npm ci` if node_modules is missing or stale in the worktree.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot SendMessage me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the
  question. If you ever do send a message anyway, its FIRST WORD must be `SC-454:`.

## 5. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc454-dead-codeblocks/sc454-impl-r1-report.md
It must open with a ≤10-line executive summary.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts, no prose. Include: STATUS
(DONE / NEEDS_CONTEXT / BLOCKED), branch + head sha, files deleted/changed, tests removed (count),
every gate's measured line, the two main.js hashes, `Drive-by fixes:` and `Follow-ups:` lists, and
the absolute path of every evidence artifact (report, gate logs).
