# SC-477 implementer brief — keep the note's trailing newline(s) on a durable write to an unterminated trailing fence

## 1. Context loading
- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/decisions.md` (the ledger — current state; it overrides anything else).
- Background (read only the parts you need): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc343-stale-write-guard-ledger.md` (why the unterminated-at-EOF recovery exists) and `.../build-ledgers/sc457-fence-space-lang/sc457-impl-report.md` Follow-ups #3 (where this was found).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline`, branch `sc477-unterminated-newline`. Code lives in its `draw-steel-elements/` submodule (branch `sc477-unterminated-newline`, at `develop` 424f47b). Verify `pwd`/`git -C … branch --show-current` before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report in the ledger dir. Workspace-level files (e.g. `CHANGELOG.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/CHANGELOG.md`.
- Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/draw-steel-elements fetch origin` and confirm `origin/develop` is still `424f47b`; if it moved, rebase onto it and say so in the report.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task
Owner ruling (from the ledger, verbatim):
> **The trailing newline(s) are kept.** … Rule: **for the same note and the same new body, the durable (relocate-by-body) path must write byte-identical output to the in-place path** — the close fence is inserted after the last body line and the note's trailing newline(s)/blank lines that followed survive after it. Re-pin the SC-343 durable tests to the in-place outputs.
> Lifecycle: extend G-S6u's assertion (or add G-S28 if a separate real-Obsidian scenario is cleaner) so real Obsidian proves the trailing newline survives a durable write.

Where:
- `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts` — `locateUnterminatedTrailingFence` (~line 106; it sets `lineEnd: lines.length - 1`, i.e. the trailing blank lines become part of the block range that gets replaced) and the durable path in `resolveWriteTarget` / the splice (~lines 176–186, 620–680). The in-place path's `unterminatedAtEof` handling (~line 675) is the behaviour to match.
- Pins to change: `test/dom/framework/reading-mode-host-durable.test.ts` — the navigate-away tests at ~267–295 currently pin the trailing newline / blank lines being dropped. The in-place tests at ~239–265 show the target outputs. Check `reading-mode-host-spaced-fence.test.ts` (unterminated spaced fence at EOF) and any other test grep finds pinning the drop.
- Lifecycle: `draw-steel-elements/visual-harness/obsidian-lifecycle.mjs`, scenario G-S6u.

Required test coverage (jest, `test/dom/framework/`), each asserting the WHOLE note byte-for-byte:
1. Durable path, note ends `…body\n` → output ends `…body'\n```\n` (same as in-place).
2. Durable path, note ends `…body\n\n\n` → the blank lines survive after the close fence (same as in-place).
3. Durable path, note ends with no newline → unchanged behaviour (`…'\n```'`, no newline added).
4. CRLF note with trailing `\r\n` (and `\r\n\r\n`) → stays all-CRLF, trailing newline(s) kept.
5. A parity test: for each of the shapes above, in-place output === durable output (one table-driven test is fine).
6. Integrity: text above the block survives; the new body is what lands; exactly one close fence; no Notice.
7. Trailing whitespace-only lines (e.g. `"  \n"` or `"\t"` after the body) — decide by matching the in-place path and pin it.
Prove each new test FAILS on the base (commit the tests first, show the red, then the fix).

If the in-place path and the durable path cannot be made identical without changing in-place behaviour, or you find the in-place path ALSO drops bytes in some shape, STOP and return STATUS: NEEDS_CONTEXT with the shapes and outputs — do not change in-place behaviour on your own.

Also: one bullet under `## Unreleased` in the dse `CHANGELOG.md` and in the worktree superproject's `CHANGELOG.md` (plain user words: a block with no closing ``` at the end of a note no longer deletes the note's final newline when it saves after you switch away). Commit after every coherent step. Commit messages end with the trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and no other attribution.

## 3. Gates
Follow `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read it — it owns the commands, order, freeze/parity rules). Full battery in order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle, e2e, shots, freeze, parity.
Expected at base 424f47b: tsc+lint clean · jest **5703 passed / 1 skipped / 238 of 239 suites** (plus your new tests; a fresh worktree reads one fewer passed and 2 skipped until `npm run shots` has run — compare after shots) · lifecycle **31/31** (32/32 if you add G-S28) · e2e **`OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, no ALLOWLISTED line · freeze **`freeze OK (280/280 …)`** (this change must not move a frozen byte) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Run `npm ci` first if `node_modules` is missing or stale.

Gate mechanics (each of these cost real time once):
- Go/Node are only in devbox. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc477-unterminated-newline/draw-steel-elements -- bash <script file>`. **Never `cd` inside a compound command**; use `git -C <abs path>` for every git command.
- Devbox eats `$?`; piping a gate eats failures. Record exit codes from inside a script FILE (`cmd > log 2>&1; echo $? > rc-file` inside the script), and read each gate's own summary line.
- Write scratch scripts with the Write tool into a private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc477-impl-<your agent id or a random suffix>/`, uniquely named scripts and logs inside. The scratchpad is shared by every agent — no generic names like `gate.sh`.
- **One blocking foreground gate per Bash call** (split lifecycle / e2e / shots into separate calls, each under the 10-minute tool timeout; set `timeout: 600000`). No `run_in_background`, no Monitor, no waiting on notifications. Redirect long output to a log file rather than streaming it.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- **No glob `rm`** anywhere (`rm -rf /tmp/dse-obsidian-lifecycle-*` once deleted another effort's vault mid-gate). Delete only paths you created and recorded. Never touch `.superpowers/` outside `sc477-unterminated-newline/`.
- **Never `pkill`/`killall` by pattern.** Kill only a PID whose command line contains `worktrees/sc477-unterminated-newline/`, or whose `readlink /proc/<pid>/cwd` is inside it.
- Do not touch `.superpowers/sdd/freeze-baseline.sha256`.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/sc477-impl-report.md`. It must open with a ≤10-line executive summary (verdict, final dse sha, superproject sha, gate numbers). Then: root cause (file:line), the fix, the before/after table of shapes, tests added (and their red-on-base proof), lifecycle change, `Drive-by fixes:` and `Follow-ups:` sections, and the log path for each gate.
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — verdict (DONE / NEEDS_CONTEXT / BLOCKED), dse branch head sha, superproject branch head sha, each gate's measured number, plus the absolute path of every evidence artifact (report, each gate log). No prose.
You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-477:`.
