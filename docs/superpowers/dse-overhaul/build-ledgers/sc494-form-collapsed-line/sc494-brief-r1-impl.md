# SC-494 r1 — reproduce, then fix: block edit form Save drops the `collapsed:` line

## 1. Context

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/decisions.md` (the ledger — current-state rulings; it overrides anything else you read). Background, executive summaries only: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml-ledger.md` and `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml/sc493-r2-rereview-report.md` (the latest FormModal change, its test pattern: real FormModal + real pipeline + ReadingModeBlockHost), and `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-decisions.md` (the "write no byte the user never typed" rule).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line` — branch `sc494-form-collapsed-line` in every submodule. The plugin is `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements`. Verify paths before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir. The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/CHANGELOG.md`.
- First: `git -C <plugin> fetch origin` and confirm the branch is at `origin/develop` = `efc17de` (rebase onto newer `origin/develop` only if it moved; say so). Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line fetch origin` and rebase its branch onto `origin/main` before the CHANGELOG commit.
- Workers never call the tracker (Linear) — not to read, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. Task

### Step A — reproduce (stop if it does not)

Ticket claim (from an SC-482 jest probe): a `ds-stamina-bar` block with a `collapsed:` line; open the block edit form, press Save; the written block has no `collapsed:` line. Owner's reading of why (verify, don't trust): `FormModal.onOpen()` (`src/authoring/FormModal.ts` ~115–124) pops only `prefs:` from `working`; `currentBody()` (~276–289) writes `def.serialize(def.parse(working))`, and the stamina-bar model has no `collapsed` field, so serialize drops it. The pipeline instead pops the reserved collapse keys (`pipeline.ts` ~366–380, `extractCollapseKeys`) and wraps serialize with `withCollapseKeys` (~550–565). Second suspected symptom to check: an element whose schema is `additionalProperties: false` and that carries `collapsed:` may show a schema error in the form, because the form validates `working` with the key still in it.

Write a jest test that drives the REAL FormModal on a real `ds-stamina-bar` block with `collapsed: true`, presses Save through the real write path, and asserts on the written note bytes; then re-render the written note through the real pipeline/host and assert the block renders collapsed. If it does NOT reproduce, STOP: fix nothing, return STATUS: DONE_NOT_REPRODUCED with the written bytes. If it reproduces, commit the red test(s) first (message `test(SC-494): ...`). Include in the red commit the other D3 cases that are red at base (and say which D3 cases are already green at base).

### Step B — fix (ledger D1, quoted)

> D1 (2026-10-23). Fix shape: the form handles the three reserved collapse keys (`collapsed:`, `collapsible:`, `collapse_default:`) the SAME way the pipeline does, using the pipeline's own helpers (`src/framework/chrome/collapsedKey.ts`: `extractCollapseKeys(rawData, claimLegacyKeys)`, `withCollapseKeys`; claim rule `def.chrome !== undefined && def.collapseKeysOwnedByModel !== true`, pipeline.ts ~366–380 and ~550–565). At open: pop the claimed keys out of `working` (so schemas — six are `additionalProperties: false` — and `def.parse` never see them, as in the pipeline). At Save: re-emit only the keys actually popped, in the pipeline's order (`prefs:` … `collapsed:` … body), on BOTH the serialize path and the stringifyWorking path. A key the model owns (`ds-stamina` / `ds-skills` `collapse_default:` / `collapsible:`) is left in place and serialized by the model, never duplicated. Ideally one shared helper so form and pipeline cannot drift (SC-493 precedent: `src/framework/blockBody.ts`). Save with no edit on a block with `collapsed:` writes the block byte-identical (SC-483 rule: "write no byte the user never typed").

Points to settle and report:
1. Byte-identity: where the source has `collapsed:` somewhere other than the pipeline's emitted position (e.g. after the body keys, or before `prefs:`), what does a no-edit Save write? The SC-483/SC-489 key-order code (`sourceKeyOrder`) may already handle it on the stringifyWorking path; the serialize path re-orders by construction. Report what each path writes for: `collapsed:` first, `collapsed:` last, `prefs:` + `collapsed:` in both orders. Do not invent a new ordering scheme beyond what D1 says; if byte-identity for an odd source order costs a lot, report it as a follow-up instead.
2. Does the pipeline also do anything else to these keys (`withPeeledKeys` / `peelLeadingCollapseKeys` for non-mapping bodies) that matters to the form? Raw mode keeps raw text verbatim, so it should already keep the line — confirm with a test, and confirm SC-493's `readBlockBody` already peels for the raw check.
3. The preview inside the form: does it render with the collapse state, or expanded? Report; do not change the preview's collapse behaviour unless it is a one-line consequence of the fix.
4. List every element def the fix changes behaviour for (has chrome AND (serialize OR a schema)), so the reviewer can probe them.

Scope (D2, quoted): "src/authoring/FormModal.ts, plus a shared helper in src/framework/ (e.g. chrome/collapsedKey.ts) if one is extracted, plus tests. Off limits: src/framework/host/, element parse/serialize code. SC-509 (card doesn't refresh after a form Save in real Obsidian) is related but separate — do not touch it; tests assert the written note bytes and a fresh re-render, not live card refresh."

Tests (D3, quoted): "red commit first; jest through the real FormModal + the real write path, then re-render the written note through the real pipeline/host (ReadingModeBlockHost pattern from SC-482 r2 / SC-493) and check the collapsed state is kept. Cover: stamina bar with `collapsed: true` and with `collapsed: false`; Save with no edit (byte-identical) and Save after an edit (collapsed: line kept, edit applied); a block with both `prefs:` and `collapsed:` (order `prefs:` then `collapsed:`); a chrome element WITHOUT serialize (stringifyWorking path); a `collapseKeysOwnedByModel` element (`ds-stamina` or `ds-skills`) with `collapse_default: true` — no duplicate line; a schema'd element with `additionalProperties: false` carrying `collapsed:` — form opens with no schema error and Save works; raw-mode element with `collapsed:` (raw text verbatim — confirm). Lifecycle scenario only if jest cannot reach the real path; if one is added it is G-S37."

Docs: CHANGELOG bullet under `## Unreleased` in the worktree superproject (one user-facing sentence: what the user sees now). Update any stale doc comment in FormModal.ts you touch (e.g. the "Not mirrored: popping `prefs:` / the reserved collapse keys" comment near line 319). Commit the superproject CHANGELOG change alone (`git -C <superproject> add CHANGELOG.md`, never `-a` — it would bump the submodule pointer; leave the pointer unbumped).

Commit after every coherent step.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for the command shapes and order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle, e2e, shots, freeze, parity last. Expected at base `efc17de` (CURRENT block): tsc + lint clean · jest **6003 passed / 1 skipped / 242 of 243 suites** (yours = 6003 + your new tests; on a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — run the final jest after shots) · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Known load flake: `test/dom/elements/initiative-default-keys.test.ts` timeout (SC-506) — re-run once, report it. Fresh worktree: run `npm ci` in the plugin first. The freeze check script is `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <plugin>/visual-harness/shots` — read-only; never touch the baseline.

## 4. Command rules (each of these has hung or broken a worker before)

- Run every command with absolute paths. Use `git -C <abs path>` for every git command. Never `cd X && …` in a compound command.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements -- <cmd>`. Devbox eats `$?` — record exit codes by running a script FILE: `devbox run -c <plugin> -- bash <abs path to script>` where the script runs the gate with output redirected to a log and writes `echo rc=$? > <rcfile>`. Read each gate's own summary line from its log.
- One blocking gate per Bash call, foreground, with `timeout` 600000. No `run_in_background`, no Monitor, no background jobs. Split lifecycle / e2e / shots into separate calls. Redirect long output to a file; do not stream it.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r1-impl-<your agent id>/` — create it; put every script, log and rc file there with unique names. Write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable or glob target, ever (it blocks on a prompt nobody answers). Overwrite files with `>` or use fresh names. Never `rm -rf` under `/tmp` by pattern (other efforts' lifecycle/e2e vaults match `/tmp/dse-obsidian-lifecycle-*`) or anything under `.superpowers/` except your own files.
- Never `pkill`/`killall` by pattern. Kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: set your own port, e.g. `DSE_LIFECYCLE_PORT=9294`.
- Never key a wait on a scratch filename or its contents — scratch is pre-populated across sessions. Read the process's own output or a per-run unique path.
- Never create a git tag. Never run `just deploy*`, `just wt-finish`, or push.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/sc494-r1-impl-report.md`. It must open with a ≤10-line executive summary. If the write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. STATUS (DONE / DONE_NOT_REPRODUCED / NEEDS_CONTEXT / BLOCKED); reproduction result (base written bytes; which D3 cases red/green at base); commit shas (red, fix, superproject CHANGELOG); answers to points 1–4; gate numbers measured; `Drive-by fixes:` and `Follow-ups:` lists; the filesystem path of every evidence artifact (report, logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever send a message anyway, its first word must be `SC-494:`.
