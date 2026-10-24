# SC-510 r1 brief — implementer: the block edit form preview always shows the current box text

You are the implementer for SC-510, round 1. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-decisions.md`.
- Background (executive summaries; dive only as needed):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml/sc493-r1-review-report.md` — **LOW-3** is this ticket (jest probe: typing `@Ref.md` one char at a time).
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml-ledger.md` and `sc519-form-stale-open-ledger.md` (same dir) — the two most recent FormModal efforts.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gates, CURRENT numbers) and `draw-steel-elements/AGENTS.md` in your worktree.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error`. dse submodule on branch `sc510-form-preview-stale-error` at **253aa5f** (= `origin/develop`); superproject at **104dd85** (= `origin/main`). Check with `git -C <abs path> log -1` before any write. First `git -C /home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error/draw-steel-elements fetch origin` and confirm `origin/develop` is still 253aa5f; if it moved, rebase onto it and say so.
- **Never edit in the main checkout** `/home/scott/code/steelCompendium/workspace/`. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — do not touch or report it. The `CHANGELOG.md` you edit lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

Ticket facts (quoted from the ledger):
- Repro: "in the block edit form on a feature or statblock, type `@Ref.md` into the YAML box one character at a time (Ref.md exists)."
- What happens: "the preview ends showing \"Reference file (Ref.m) not found\". Saving still writes and renders the right block. A self-referencing `@Note.md` produces 12 unhandled promise rejections (YAMLParseError from RefUnwrapView.onMount)."
- Why: "every keystroke mounts the preview into the same element with `void view.mount(previewEl, model)` (`src/authoring/FormModal.ts` renderPreview). A mount still running from an earlier keystroke writes into the element after it was cleared. Mount rejections are not handled."
- Expected: "the preview always shows the current box text. Suggested fix: mount each preview into a fresh child element that is dropped on the next keystroke, and catch mount rejections."

Owner decision D1 (quoted): "each renderPreview mounts into a fresh child element of `.dse-form__preview` (the preview host's `containerEl` is that child too), the previous child is detached on the next render, and `view.mount` rejections are caught (no unhandled rejection). A stale mount that finishes late may write only into its own detached child."

D2 scope (quoted): "src/authoring/FormModal.ts + tests (+ CSS only if a `.dse-form__preview` child selector needs it). Off limits: element code, src/framework/host/, the save path. SC-523/SC-524 are separate tickets."

Do it test-first:

1. **Red jest** (real FormModal, real element defs, real ref resolution — the SC-493 review's probe pattern; make the ref lookup's timing controllable so the race is deterministic, not timing-luck). Cases:
   - feature AND statblock: type `@Ref.md` one character at a time (Ref.md exists) → after all mounts settle the preview shows Ref.md's content and contains no "not found" text; nothing from an earlier keystroke's mount is in the preview.
   - Out-of-order resolution: an earlier keystroke's mount resolves AFTER the latest one → preview still shows only the latest.
   - Self-referencing `@Note.md` → **0 unhandled rejections** (count them with a process `unhandledRejection` listener or jest's equivalent).
   - ds-scc bare SCC-code body, if the race reaches it (the SC-493 review said it does at base) — include it or say why not.
   - Clearing to an invalid box after a pending mount: the late mount must not resurrect a preview under the error.
   Commit the red test separately; it must FAIL on 253aa5f — record the failure lines.
2. **Fix** per D1. Also check and report: the "Read-only" badge (`data-dse-readonly` on `.dse-form__preview`, SC-493 r2) still appears on a valid preview and not on an emptied/invalid one; any CSS selector that assumed the view's root was a direct child of `.dse-form__preview` (grep `dse-form__preview` in styles); the previous view is still removed from `this.lifecycle` (no leak per keystroke); a caught mount rejection leaves the preview in what state (say what the user sees — do not invent new UI; I will rule).
3. **Integrity**: Save after the char-by-char typing still writes exactly the box text and renders the right block; note text above and below the block is untouched.
4. **Lifecycle scenario**: only if jest cannot reach the real path. If you add one, its id is **G-S46**, and the dse-verify rule applies: never a timed delay inside a lifecycle step to win a race against Obsidian — hold Obsidian at a hook instead.
5. **CHANGELOG**: one bullet under `## Unreleased` in your worktree superproject's `CHANGELOG.md`, plain user-facing words (the block edit form's preview no longer shows a stale error such as "Reference file … not found" while you type a reference). Commit in the superproject (only CHANGELOG — do not bump the dse pointer).
6. Commit after every coherent step (red, fix, CHANGELOG). No co-author/AI trailers in commit messages.

## 3. Gates (dse-verify, in order, on your final HEAD)

Expected at 253aa5f (yours adds tests):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6074 passed / 1 skipped / 245 of 246 suites** (after a shots run; on a fresh worktree jest reads one fewer passed and 2 skipped until shots has cached `visual-harness/dist/obsidian-app.css`) plus your new tests
- lifecycle **38/38** (39/39 if you add G-S46)
- e2e `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`
- shots **592**, 0 FAIL · freeze `freeze OK (280/280 …)` · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last)

If freeze moves any frozen byte, STOP and report (ship `rebaseline.txt` + before/after crops in the ledger dir per dse-verify; never touch the baseline).

## 4. Shell rules (each has cost real time — obey exactly)

- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error/draw-steel-elements -- <cmd>`; **never `cd` inside a compound command**; every git command as `git -C <absolute path>`.
- **One blocking foreground gate per Bash call** (lifecycle, e2e, shots, parity each separate; timeout 600000). No `run_in_background`, no Monitor, no background jobs. Redirect long output to a log file and read its summary line — do not stream it.
- **Exit codes from a script file**: write a script with the Write tool, run `devbox run -c <dse path> -- bash <script>`, and have the script write `rc` to a fresh uniquely named file. `bash -c '…; echo rc=$?'` under devbox always records 0.
- **Scratch**: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is shared by every agent. Use ONLY your private subfolder `.../scratchpad/sc510-r1-impl-<random suffix>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- **No `rm` with a shell-variable target, no glob `rm`**, never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*` — other efforts' vaults) or `.superpowers/`. Delete only literal paths you created and recorded. Overwrite with `>` or use fresh filenames.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, only a PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: set your own `DSE_LIFECYCLE_PORT` (e.g. 9293) in case another session is on 9262. Never `DISPLAY=:1` / `--headed`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never create a tag or release. Never run `just deploy*`, `just wt-finish`, or push.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, final dse sha + superproject sha, red→green facts, gate numbers). Then: design and why; the checks from step 2 (badge, CSS selectors, lifecycle leak, caught-rejection state); ds-scc reachability; diff stat; `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit shas (each), measured gate numbers, the red FAIL lines vs 253aa5f, and the absolute path of every evidence artifact (report, gate logs). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its first word must be `SC-510:`.
