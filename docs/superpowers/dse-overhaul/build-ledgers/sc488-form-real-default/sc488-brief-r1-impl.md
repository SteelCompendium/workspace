# SC-488 r1 — implementation (implementer A)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose — plus the absolute path of every artifact you produced. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (READ FIRST, the "Design" section is your spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-decisions.md`
- Survey report (file:line map of today's code, option analysis, test list): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r0-survey-report.md` — sections 1, 2 and 4.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-decisions.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc488-form-real-default`. Plugin repo: `.../draw-steel-elements`, branch `sc488-form-real-default`, cut at dse `develop` `424f47b`. Superproject on branch `sc488-form-real-default` at `89bd345`. Verify `pwd`-independent: every git command is `git -C <absolute path>`. First: `git -C <plugin> fetch origin` and confirm `origin/develop` is `424f47b`; if it moved, rebase onto it and report the new base.
- `node_modules` already exists in the plugin worktree (copied by the survey worker). Run `npm ci` only if `package.json`/lockfile differ from the main checkout's.
- Read `<plugin>/AGENTS.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery).
- **Workspace-level files live in YOUR worktree's superproject**: the CHANGELOG is `/home/scott/code/steelCompendium/worktrees/sc488-form-real-default/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.

## 2. The task

Ticket spec (verbatim): "**Expected:** an absent select shows the value the block will actually use, and the preview matches the saved result."

Implement the owner's design D1–D9 exactly as written in the ledger's "Design" section (quote, do not reinterpret). Summary of the shape — the ledger text governs if this summary and it disagree:
- Optional selects: leading sentinel option, no seed, sentinel = key absent everywhere; label `Default (<v>)` / `Default (none)` / `Default` from the generic parse-equality rule, recomputed in `revalidate()` (before the `saveDisabled` early return), try/catch per field.
- Key present with a value: selected + written; sentinel removes the line. Key present with null: treated as absent.
- Required selects: no sentinel; seed schema `default` if in enum else enum[0]; always written.
- Remove the dead SC-483 strip machinery with an SC-488 pointer comment.
- Files per survey §4: `src/authoring/FormModal.ts`, `src/authoring/formModel.ts`, `src/authoring/schemaShape.ts`, `test/mocks/obsidian-core.ts` (FakeDropdown gets a real `selectEl`, additive), `test/dom/authoring/formModal.test.ts`. No element schema/definition/model edits. If you find you need one, stop and report `STATUS: NEEDS_CONTEXT`.
- Tests (TDD — commit the red tests first, then the fix): the survey §4 test list plus the registry census test (D8). Re-assert ONLY the three SC-483 expectations the ledger names (D7); any other existing assertion that goes red is a finding — report it, do not edit it.
- CHANGELOG bullet under `## Unreleased` (user-facing, plain words; e.g. the block edit form's dropdowns now show the value the block actually uses, labelled "Default (…)", and the preview matches what Save writes — authoring controls, experimental).
- Commit after every coherent step (red tests, fix, CHANGELOG). Plugin commits on `sc488-form-real-default` in the plugin repo; the CHANGELOG commit in the superproject. Do NOT bump the superproject's submodule pointer and do not push — the dispatcher lands.

Out of scope (same file, other tickets — do not touch): SC-489 (validation transforms rewrite typed values), SC-493 (emptied raw-YAML box), SC-494 (stamina bar `collapsed:` dropped on Save), SC-492 (stamina-bar pencil). Report anything you notice in those areas as `Follow-ups:`.

Report extras in two lists: `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move a gate baseline) and `Follow-ups:` (left alone).

## 3. Gates — full dse-verify battery, in order, expected at 424f47b + this branch

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5703 passed + your new tests − 0 / 1 skipped / 238 of 239 suites** (+1 suite if you add a file; compare after a shots run — see dse-verify row 3; a fresh worktree reads 2 skipped before shots) · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, with `button host-leak OK (112 … 672 …)`, `modal button host-leak OK (10 … 9 … 38 … 228 …)`, no ALLOWLISTED line, `pipette selected look OK (…)`, `pressed toggle parity OK (96 …)` and both text-scale lines · freeze **`freeze OK (280/280 …)`** (any delta = STOP and report; never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Run rules (each has cost real time before):
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-impl-a-<6 random chars>/`. Uniquely named scripts and logs inside it only. The scratchpad is shared by every agent. Create files with the Write tool, not heredocs.
- Exit codes: write each gate as a script FILE that `cd`s to the plugin, runs the gate with output redirected to a log, and writes its own rc file; run it as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements -- bash <abs script path>`. `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line from its log.
- **One gate per Bash call, each a blocking foreground call** (split lifecycle / e2e / shots into separate calls to stay under the 10-minute tool timeout). No `run_in_background`, no Monitor, no background jobs. Never `cd` inside a compound Bash command.
- `rm -f` of `main.js` and `styles.css` in the plugin repo before jest, by explicit absolute path. **No glob `rm`, ever.** Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; delete only paths you created and recorded.
- Lifecycle: `DSE_LIFECYCLE_PORT=9311`.
- Kills: PID only, and only a PID you have proven is yours (`pgrep -af "worktrees/sc488-form-real-default/"`, or `readlink /proc/<pid>/cwd` inside this worktree for `node visual-harness/shoot.mjs`). Never `pkill`/`killall` by pattern.
- Never `--headed`, never `DISPLAY=:1`.
- Jest footgun (survey): `--selectProjects dom <path>` swallows the path; put the path first.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore it. You work only in the worktree.
- If a Bash call is refused or seems to hang on a prompt, do not retry the same shape — re-run the step another way (script file, Write tool).

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-impl-report.md`, opening with a **≤10-line executive summary** (shas, gate numbers, deviations). Then: commits (sha + subject, red commit marked), what changed per file, the test list with which went red pre-fix, the re-asserted SC-483 expectations (old -> new), the gate table with log paths, `Drive-by fixes:`, `Follow-ups:`. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, plugin tip sha + base, superproject sha, gate numbers, report path, every log path. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-488:`.

Redirect long-running output to files rather than streaming it — the 600 s stream watchdog kills silent agents.
