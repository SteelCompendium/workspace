# SC-493 r1 — reproduce, then fix: emptied raw-YAML box in the block edit form

## 1. Context

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/decisions.md` (the ledger — current-state rulings; it overrides anything else you read). Background only, read the executive summaries: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc482-wrapper-default-keys/sc482-r2-rereview-report.md` (MEDIUM-1: its jest empty-body re-render probe through the real pipeline + ReadingModeBlockHost is the pattern to copy) and `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc489-form-transform-rewrite-ledger.md` (the latest FormModal change).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml` — branch `sc493-form-empty-yaml` in every submodule. The plugin is `/home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml/draw-steel-elements`. Verify `pwd`/paths before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir. The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml/CHANGELOG.md`.
- First: `git -C <plugin> fetch origin` and confirm the branch is at `origin/develop` = `66f474b` (rebase onto newer `origin/develop` only if it moved; say so). Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml fetch origin` and rebase its branch onto `origin/main` before the CHANGELOG commit.
- Workers never call the tracker (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. Task

### Step A — reproduce (stop if it does not)

Ticket claim (filed from code reading only): in the block edit form, `ds-counter` / negotiation / party / encounter open the raw-YAML textarea. Clearing the box and pressing Save is allowed (validation runs `def.parse(parseYaml(rawText) ?? {}, rawText)` at `src/authoring/FormModal.ts:314`), the block is written with an empty body, the pipeline (`src/framework/pipeline.ts:363`, `parseYaml(source)`, no `?? {}`) hands the element null, and the block re-renders as an error card.

Write a jest test that drives the REAL FormModal on each of counter, negotiation, party, encounter, plus montage and project as controls: open on a real source block (e.g. counter `current_value: 3`), set the textarea to `''`, check Save is enabled, press Save through the real write path, then re-render the written note through the real pipeline/host and assert no error card. Also check: does the jest `parseYaml` mock return what Obsidian's returns for `''` (null)? Find out how the mock is defined; if it differs from Obsidian on empty / whitespace-only / comment-only (`# note`) input, say so — a test against a wrong mock proves nothing.

If the four elements do NOT end as an error card (Save disabled already, or the body renders), STOP: do not fix anything, delete nothing you need as evidence, and return STATUS: DONE_NOT_REPRODUCED with the observed output per element.

If it reproduces: commit the red test(s) first (one commit, message `test(SC-493): ...`).

### Step B — fix (ledger D1, quoted)

> D1 (2026-10-23). Fix shape: the raw-YAML editor checks and previews the SAME data the pipeline will hand the element after Save. Today `FormModal.revalidate()` (src/authoring/FormModal.ts:314) and `renderPreview()` (:366) feed `parseYaml(this.rawText) ?? {}` to `def.parse`, while the pipeline (src/framework/pipeline.ts:363) feeds `parseYaml(source)` with no `?? {}`. So an empty box passes the form's check as `{}` but renders as null. Fix: drop the `{}` substitution so the form's check and preview see what the pipeline sees (ideally one shared helper, so they cannot drift again). Consequence: for counter / negotiation / party / encounter an emptied box shows the element's own error and Save is disabled; for montage / project (which accept an empty body) Save of an empty box stays allowed and writes an empty body, which renders.

Points to settle and report:
1. Read what the pipeline does between the fence body and `def.parse` (pipeline.ts ~355–400: the `peel` / block-reference rescue, prefs extraction via `extractPrefOverrides`, anything else). The form's raw check should match that path for the raw text — e.g. a box containing only `prefs: {...}` or only a `^block-ref` line. Mirror what matters; if a full shared helper is too invasive, say exactly which pipeline steps the form still does not mirror.
2. The error text the user sees for an emptied counter. If it is an internal message (e.g. "expected an object, got null"), report the exact string; do NOT add per-element messages (element code is off limits, D2). Report it so the owner can judge.
3. The preview (:366) uses the same data as the check.
4. Schema'd (non-raw) elements are untouched by this change — confirm with the existing suite.

Scope (D2, quoted): "src/authoring/FormModal.ts (and a shared helper if one is extracted) + tests. Off limits: src/framework/host/, element parse/serialize code. SC-494 (stamina bar Save drops `collapsed:`) is a separate ticket and waits — do not touch it."

Tests (D3, quoted): "red commit first; jest through the real pipeline + host (the SC-482 r2 re-review probe pattern: ReadingModeBlockHost). Lifecycle scenario only if jest cannot reach the real path; if one is added it is G-S37." Also cover: whitespace-only box, comment-only box, montage/project empty Save writes an empty body and renders, an ordinary edit on counter still saves.

Docs: CHANGELOG bullet under `## Unreleased` in the worktree superproject (one user-facing sentence: what the user sees now). Update any stale doc comment in FormModal.ts you touch. Commit the superproject CHANGELOG change alone (`git -C <superproject> add CHANGELOG.md`, never `-a` — it would bump the submodule pointer; leave the pointer unbumped).

Commit after every coherent step.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for the command shapes and order: tsc (incl. `tsc -p e2e`), lint, jest, lifecycle, e2e, shots, freeze, parity last. Expected at base `66f474b` (CURRENT block): tsc + lint clean · jest **5859 passed / 1 skipped / 241 of 242 suites** (yours = 5859 + your new tests; on a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — run the final jest after shots) · lifecycle **34/34** · e2e **`OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Known load flake: `test/dom/elements/initiative-default-keys.test.ts:459` timeout (SC-506) — re-run once, report it. Fresh worktree: run `npm ci` in the plugin first.

## 4. Command rules (each of these has hung or broken a worker before)

- Run every command with absolute paths. Use `git -C <abs path>` for every git command. Never `cd X && …` in a compound command.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml/draw-steel-elements -- <cmd>`. Devbox eats `$?` — record exit codes by running a script FILE: `devbox run -c <plugin> -- bash <abs path to script>` where the script runs the gate with output redirected to a log and writes `echo rc=$? > <rcfile>`. Read each gate's own summary line from its log.
- One blocking gate per Bash call, foreground, with `timeout` 600000. No `run_in_background`, no Monitor, no background jobs. Split lifecycle / e2e / shots into separate calls. Redirect long output to a file; do not stream it.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-impl-<your agent id>/` — create it; put every script, log and rc file there with unique names. Write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable or glob target, ever (it blocks on a prompt nobody answers). Overwrite files with `>` or use fresh names. Never `rm -rf` under `/tmp` by pattern or anything under `.superpowers/` except your own files.
- Never `pkill`/`killall` by pattern. Kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: set your own port, e.g. `DSE_LIFECYCLE_PORT=9293`.
- Never key a wait on a scratch filename or its contents — scratch is pre-populated across sessions. Read the process's own output or a per-run unique path.
- Never create a git tag. Never run `just deploy*`, `just wt-finish`, or push.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/sc493-r1-impl-report.md`. It must open with a ≤10-line executive summary. If the write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. STATUS (DONE / DONE_NOT_REPRODUCED / NEEDS_CONTEXT / BLOCKED); reproduction result per element (base behaviour); commit shas (red, fix, superproject CHANGELOG); the exact error string an emptied counter shows; which pipeline steps the form mirrors and which not; gate numbers measured; `Drive-by fixes:` and `Follow-ups:` lists; the filesystem path of every evidence artifact (report, logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever send a message anyway, its first word must be `SC-493:`.
