# SC-489 r1 — implementation (implementer A)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose — plus the absolute path of every artifact you produced. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (READ FIRST; the "Design" section is your spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-decisions.md`
- Survey report (file:line map of today's code, case table, test list, mutants): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-r0-survey-report.md` — sections 1, 4 and 5.
- Prior art in the same file: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc488-form-real-default-ledger.md` ("Design" D1–D9 = current select behaviour; keep it).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite`. Plugin repo `.../draw-steel-elements`, branch `sc489-form-transform-rewrite`, cut at dse `develop` `0dff966`. Superproject on branch `sc489-form-transform-rewrite` at `3762276`.
- **Rebase first, before any code:** `git -C <plugin> fetch origin` then `git -C <plugin> rebase origin/develop` — expected `origin/develop` = **`53e1e48`** (SC-485). If it is newer, rebase onto it and report the new base. Then `git -C /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite fetch origin` and `git -C /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite rebase origin/main` for the superproject (only the CHANGELOG commit will live there). Every git command is `git -C <absolute path>`, never `cd X; git …`.
- `node_modules`: the survey worker may have created it. Run `npm ci` (via devbox, below) if it is missing or if the rebase changed `package.json` / the lockfile.
- Read `<plugin>/AGENTS.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery).
- **Workspace-level files live in YOUR worktree's superproject**: the CHANGELOG is `/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. The task

Ticket spec (verbatim): "**Expected:** Save writes only what the user changed. Validation may normalise a copy for checking, but it must not rewrite the values that get saved."

Implement the owner's design (ledger "Design" section, items D1–D7) exactly as written there — quote, do not reinterpret. If this brief and the ledger disagree, the ledger governs.

- Files: `src/authoring/FormModal.ts` and `test/dom/authoring/formModal.test.ts` only. No schema / element definition / parser / serializer / pipeline edits. If you find you need one, stop and report `STATUS: NEEDS_CONTEXT`.
- Tests (TDD — commit the red tests first, then the fix): the survey §5 list (rows 1–11) in a new `describe('SC-489')`, real elements and a real ValidationService. Rows the survey says fail at base must be red in your red commit; report which went red. No existing assertion should change; any existing assertion that goes red is a finding — report it, do not edit it.
- CHANGELOG bullet under `## Unreleased` (user-facing, plain words; e.g. "The block edit form (experimental authoring controls) no longer rewrites what you wrote when you save: `Climb` stays `Climb`, `style: Sheet` stays `Sheet`. A dropdown whose value is written in a different case, like `style: Chips`, now opens on the matching option instead of blank.").
- Commit after every coherent step (red tests, fix, CHANGELOG). Plugin commits on `sc489-form-transform-rewrite`; CHANGELOG commit in the superproject. Do NOT bump the superproject's submodule pointer and do not push — the dispatcher lands.

Out of scope (same file, other tickets — do not touch): SC-493 (emptied raw-YAML box -> error card), SC-494 (stamina bar `collapsed:` dropped on Save), SC-404 (form redesign; Save re-stringifies untouched keys' formatting/comments), and the sidebar `_dse_anchor` shallow-clone tangent (`pipeline.ts`, filed as SC-504). Report anything you notice there as `Follow-ups:`.

Report extras in two lists: `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move a gate baseline) and `Follow-ups:` (left alone).

## 3. Gates — full dse-verify battery, in order, expected at 53e1e48 + this branch

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5840 passed + your new tests / 1 skipped / 240 of 241 suites** (compare after a shots run — a fresh worktree reads 1 fewer passed and 2 skipped before shots; dse-verify row 3) · lifecycle **33/33** · e2e **`OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, rc 0, with `host-copy pin OK (1.15.0 …)`, `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 228 …)`, no `ALLOWLISTED` line, `pressed toggle parity OK`, `pipette selected look OK`, both text-scale lines (`text scale once OK (107256 … 214 loads …)`), and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning · freeze **`freeze OK (280/280 …)`** (any delta = STOP and report; never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Run rules (each has cost real time before):
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-impl-a-<6 random chars>/`. Uniquely named scripts and logs inside it only. The scratchpad is shared by every agent. Create files with the Write tool, not heredocs.
- Exit codes: write each gate as a script FILE that `cd`s to the plugin, runs the gate with output redirected to a log, and writes its own rc file; run it as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/draw-steel-elements -- bash <abs script path>`. `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line from its log.
- **One gate per Bash call, each a blocking foreground call** (split lifecycle / e2e / shots into separate calls to stay under the 10-minute tool timeout). No `run_in_background`, no Monitor, no background jobs. Never `cd` inside a compound Bash command.
- `rm -f` of `main.js` and `styles.css` in the plugin repo before jest, by explicit absolute path. **No glob `rm`, ever.** Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; delete only paths you created and recorded.
- Lifecycle: `DSE_LIFECYCLE_PORT=9313`.
- Kills: PID only, and only a PID you have proven is yours (`pgrep -af "worktrees/sc489-form-transform-rewrite/"`, or `readlink /proc/<pid>/cwd` inside this worktree for `node visual-harness/shoot.mjs`). Never `pkill`/`killall` by pattern.
- Never `--headed`, never `DISPLAY=:1`.
- Jest footgun: `--selectProjects dom <path>` swallows the path; put the path first.
- `structuredClone` is undefined in the jest dom env (survey) — use the container-clone helper the design names.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore it. You work only in the worktree.
- If a Bash call is refused or seems to hang on a prompt, do not retry the same shape — re-run the step another way (script file, Write tool).

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-r1-impl-report.md`, opening with a **≤10-line executive summary** (shas, base, gate numbers, deviations). Then: commits (sha + subject, red commit marked), what changed per file, the test list with which went red pre-fix, the gate table with log paths, `Drive-by fixes:`, `Follow-ups:`. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, plugin tip sha + base, superproject sha + base, gate numbers, report path, every log path. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-489:`.

Redirect long-running output to files rather than streaming it — the 600 s stream watchdog kills silent agents.
