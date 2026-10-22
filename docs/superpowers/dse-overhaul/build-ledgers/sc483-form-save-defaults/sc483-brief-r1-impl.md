# SC-483 r1 implementation brief (implementer A)

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-decisions.md` (spec + owner rule). Background on the sister fix: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc466-stamina-bar-defaults-ledger.md` and the SC-466 test `test/dom/elements/staminaBarDefaults.test.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/draw-steel-elements`, branch `sc483-form-save-defaults`, cut at `08206e3` (= origin/develop). Superproject branch `sc483-form-save-defaults` at `5cc6196` (= origin/main). First: `git -C <plugin repo> fetch origin`; if `origin/develop` is newer than `08206e3`, rebase onto it and say so (the battery baselines below are for `08206e3`).
- Verify `pwd`/paths before every write: ALL edits happen under `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/`. The workspace-level `CHANGELOG.md` lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running gates.
- **Workers never call the tracker** (Linear) — not to read, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.
- CONCURRENT: SC-482 is changing per-block model serializers (ComponentWrapper elements) in another worktree. Do NOT edit any element model / serializer / `src/framework/` file. Scope: `src/authoring/FormModal.ts` (and a helper beside it if needed), tests, CHANGELOG.

## 2. The task

Owner rule (quoted verbatim from the ledger):

> Rule: a select field whose key was ABSENT from the source when the form opened, and which the user never changed (its dropdown onChange never fired), is not written by Save — it is stripped from the data before serialize/stringify. Validation and preview keep seeing the seeded value. A select the user changed is written, even if changed back to the first option (the first enum option is not always the parser's default, so "equals enum[0]" is not a safe omit test). Every key present in the source is written as today. Non-select widgets are unchanged (they do not seed).

> Out of scope: (a) a model's serializer re-adding the default from its own parse() — that is SC-482 (stamina-bar already omits it via SC-466); (b) the dropdown SHOWING enum[0] when the parser's default is a different option — report as a follow-up if found, do not fix.

Concretely:

1. TDD: write the failing jest test(s) first in `test/dom/authoring/formModal.test.ts` (or a new `formModalSeededSelect.test.ts` beside it), commit red, then fix.
   - The ticket repro: stamina bar source `max_stamina: 20\ncurrent_stamina: 15`, change Max stamina to 25, Save → written body has `max_stamina: 25`, `current_stamina: 15` and NO `style` key.
   - A schema'd element WITHOUT a `serialize` (the `stringifyWorking` path) with a select field absent from the source: untouched Save omits it.
   - Touched select: user picks a non-first option → written. User picks another option then back to the first → written.
   - Source that already declares the select key (even at its default value) → still written, byte-identical to today.
   - Validation and the preview still see the seeded value (no new validation error for an absent select; preview unchanged).
   - Whatever else `currentBody()` feeds besides Save (check: preview, any raw/copy path) — say in the report which callers get the stripped body and which keep the seeded one, and why.
2. Fix in `src/authoring/FormModal.ts`. Update the comment at the seed site (~line 153) so the next reader sees the seed is display/validation-only and Save strips it.
3. Survey (report, do not fix): which built-in elements have select (enum) fields in their schema, and for each one whether an untouched-select Save is now clean end to end, or still writes the default because its own serializer re-adds it (that is SC-482's territory — name the element and key). Also note any select whose enum[0] differs from its parser default (follow-up (b)).
4. Real-Obsidian check: optional. Do not add e2e manifest surfaces or control ids for this. If you add a lifecycle scenario, its id is `G-S20`; not required — the reviewer will probe in real Obsidian.
5. CHANGELOG: one bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`, user-facing wording ("With authoring controls on, saving the block edit form no longer adds fields you never touched, such as `style: default`" — your words, same idea). Commit it in the superproject branch; do NOT commit a submodule pointer bump (landing does that).
6. Commit after every coherent step. No pushes, no tags, no AI attribution / co-author trailers in commit messages.

## 3. Gates — full dse-verify battery, in order, expected at 08206e3 + this branch

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5446 passed + your new tests / 1 skipped / 232 of 233 suites** (+1 suite if you add a file; compare after a shots run — see dse-verify row 3) · lifecycle **30/30** (31/31 if you add G-S20) · e2e **`89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (any delta = STOP and report; never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Run rules (each has cost real time before):
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r1-impl-a/`. Uniquely named scripts and logs inside it only. The scratchpad is shared by every agent.
- Exit codes: write each gate as a script FILE (Write tool) that runs the gate with output redirected to a log and writes its own rc file; run it as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults/draw-steel-elements -- bash <abs script path>`. `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line from its log.
- One gate per Bash call. Never `cd` inside a compound command. `git -C <abs path>` for every git command.
- `rm -f main.js styles.css` in the plugin repo before jest (by explicit path). No glob `rm`, ever. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; delete only paths you created and recorded.
- Lifecycle: `DSE_LIFECYCLE_PORT=9297`.
- Kills: PID only, and only a PID you have proven is yours (`pgrep -af "worktrees/sc483-form-save-defaults/"`, or `readlink /proc/<pid>/cwd` inside this worktree for `node visual-harness/shoot.mjs`). Never `pkill`/`killall` by pattern.
- Never `--headed`, never `DISPLAY=:1`.
- Redirect long output to files; run gates in the foreground (the 600 s stream watchdog kills silent agents — keep each call under it or split it). Never background a gate and wait for a notification; it will not come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or a per-run unique path.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc483-form-save-defaults/sc483-r1-impl-report.md`, opening with a ≤10-line executive summary (verdict, plugin sha + commit list, superproject sha, gate numbers, e2e run id). Then: the fix and why, callers of the stripped body, the survey table (task 3), `Drive-by fixes:` and `Follow-ups:` sections. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), shas, measured numbers, and the absolute path of every artifact (report, logs). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you message anyway, its first word must be `SC-483:`.
