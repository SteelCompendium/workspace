# SC-364 round 1 — implementer brief

## 1. Context loading
- Read the ledger FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc364-dead-collapse-prefs/sc364-decisions.md (scope = the ticket description quoted there, verbatim).
- Worktree: /home/scott/code/steelCompendium/worktrees/sc364-dead-collapse-prefs ; the plugin is at
  /home/scott/code/steelCompendium/worktrees/sc364-dead-collapse-prefs/draw-steel-elements on branch `sc364-dead-collapse-prefs`.
  Verify `pwd`/paths before every write. NEVER write under /home/scott/code/steelCompendium/workspace/ except your report file in the ledger dir.
  Workspace-level files (if any) live in YOUR worktree's superproject at /home/scott/code/steelCompendium/worktrees/sc364-dead-collapse-prefs/ — never the main checkout.
- Read draw-steel-elements/AGENTS.md (or CLAUDE.md) in the worktree before editing.
- Base: dse `develop` @ `71ac43a`. First: `git -C <plugin path> fetch origin` and confirm `origin/develop` is still 71ac43a; if it moved, `git -C <plugin path> rebase origin/develop` and say so in the report (run `npm ci` if package.json's obsidian version changed).
- Use `git -C <absolute path>` for EVERY git command, never `cd X; git …`.
- You never call the tracker (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified demo-vault/Welcome.md, untracked compendium-manifest.json / demo-vault/*.md) is Scott's live vault: expected, not yours, do not touch or report it.

## 2. Task
Ticket scope, verbatim from the ledger:
> **Work:** delete the helper and the side channel. Then update the stale references: `.repo-docs/architecture.md` (~line 396), `test/dom/framework/kit-lifecycle.test.ts:58-61`, `test/dom/elements/stamina-bar.test.ts:67-70` and `test/dom/framework/pref-overrides.test.ts:7,428`.

Where "the helper" = `resolveCollapsePrefs` (`src/prefs/catalog.ts` ~line 740) and "the side channel" = the `declaredCollapsePrefs` WeakMap in `src/model/ComponentWrapper.ts` (~lines 47-59 and 92). Line numbers are from 2026-09-25 and may have drifted.

Steps:
1. FIRST verify the premise before deleting anything: grep the whole plugin (src/, test/, e2e/, scripts/, .repo-docs/, docs) for `resolveCollapsePrefs`, `declaredCollapsePrefs`, and any getter/setter/export that wraps the WeakMap. List every hit in the report. If ANY production (src/) code still reads either one, STOP and return STATUS: NEEDS_CONTEXT with the hits.
2. Delete the helper, the WeakMap, its write site(s), any accessor exported only for it, and any imports/types left orphaned. Do not refactor anything else.
3. Tests: tests that exercised ONLY the deleted helper/channel are deleted; tests that merely mention it in a comment or a stale assertion are updated to describe the real mechanism (`collapsedKey.ts` `extractCollapseKeys` reads the raw keys). Itemise every deleted test (file + test name) in the report — the jest count may only drop by those.
4. Update `.repo-docs/architecture.md` and any other doc that describes the deleted channel so it describes current behaviour.
5. CHANGELOG: this is not user-facing; follow the plugin repo's own convention (check AGENTS.md / CHANGELOG.md). If the repo expects no entry for internal refactors, add none.
6. Commit in the submodule with a message like `refactor: SC-364 — delete dead resolveCollapsePrefs and the declaredCollapsePrefs side channel`. Commit after each coherent step. Do NOT push. Do NOT touch the superproject pointer.

Drive-by fixes: only obviously-correct, local to a file you touched, cannot move a gate baseline — list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` untouched.

## 3. Gates — the `dse-verify` skill
Read /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (read-only; it is a workspace file you READ from the main checkout, never edit) and run the FULL battery in its order against your worktree: tsc (incl. `tsc -p e2e`), lint (incl. e2e/), jest, lifecycle (`npm run obsidian-lifecycle`), e2e (`npm run e2e`), shots, freeze check, parity last.

Expected at base 71ac43a (CURRENT block):
- tsc + lint clean
- jest **5257 passed / 1 skipped / 229 of 230 suites** — minus exactly the tests you itemise as deleted (and minus a suite only if a whole suite is deleted)
- lifecycle **27/27**
- e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`
- shots **572**, 0 FAIL, with `pressed toggle parity OK (96 comparisons …)`
- freeze `freeze OK (276/276 …)` — this is dead-code deletion, so NO rebaseline is acceptable; any freeze delta is a defect, stop and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**
Also record the built `main.js` sha256 at base and at your head (it is expected to differ — code was removed — just report both).

Devbox rules (adapter footgun 1): `devbox run -c <dir> -- bash -c 'cd <dir> && <cmd>'`; devbox's sh wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures — run each gate via a wrapper script FILE that captures the exit code, output redirected to a log file.

## Footguns (all apply)
- Private scratch: make `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r1-impl-<yourAgentId or a random suffix>/` and put every script and log in it with unique names (e.g. `sc364-r1-gate-jest.sh`). Never a generic name like `gate.sh` at the scratchpad root — the scratchpad is shared by every concurrent agent.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run gates in the FOREGROUND (Bash timeout up to 600000 ms; split if needed). Do not background a gate and "wait for a notification" — it never arrives.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc364-dead-collapse-prefs/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*` etc.) or the shared `.superpowers/` dir. Delete only paths you created and recorded.
- Never create tags or releases on draw-steel-elements.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever send a message anyway, its FIRST WORD must be `SC-364:`.

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc364-dead-collapse-prefs/sc364-r1-impl-report.md
It must OPEN with a ≤10-line executive summary (verdict, head sha, gate numbers line). Then: premise grep hits; files changed; deleted tests itemised; gate logs' paths; Drive-by fixes; Follow-ups.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), head sha, every gate number measured, main.js sha256 base/head, deleted-test list, and the absolute path of every evidence artifact (report, gate logs). No prose.
