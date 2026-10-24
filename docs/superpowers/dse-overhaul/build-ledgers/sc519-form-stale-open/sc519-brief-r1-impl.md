# SC-519 r1 brief — implementer: the block edit form starts from what the card shows

You are the implementer for SC-519, round 1. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc519-form-stale-open/sc519-decisions.md`.
- Background (read the executive summaries, dive only as needed):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh-ledger.md`
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh/sc509-r3-review-report.md` — **INFO-1** is this ticket (jest probe P5c); INFO-2 is related but ruled no-action.
  - `sc509-r2-impl-report.md` in the same dir: how SC-509 built G-S40 (the form-Save lifecycle scenario) — reuse its scaffolding.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gates, lifecycle authoring rule, CURRENT numbers) and `draw-steel-elements/AGENTS.md` in your worktree.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc519-form-stale-open`. dse submodule on branch `sc519-form-stale-open` at **c2758a2** (= `origin/develop`); superproject at **2bfd07d**. Verify with `pwd`-free checks: `git -C <abs path> log -1` before any write. Before starting, `git -C /home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/draw-steel-elements fetch origin` and confirm `origin/develop` is still c2758a2; if it moved, rebase onto it and say so.
- **Never edit in the main checkout** `/home/scott/code/steelCompendium/workspace/`. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — do not touch or report it. The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

Ticket facts (quoted from the ledger):
- Repro: "on a counter, click Increase, then within about 400 ms click the pencil (authoring controls on). Press Save without changing anything."
- What happens: "the form opened with the body from before the click. Save writes that body, so the Increase is lost without any message."
- Why: "a card's in-card writes wait out a ~400 ms debounce before `replaceSource`. `openFormEditor` reads the block body (`src/framework/pipeline.ts` ~577-578) without flushing the view's pending write first."
- Expected: "opening the form flushes, or waits for, the view's pending write, so the form starts from what the card shows."

Do it test-first:

1. **Red jest** reproducing INFO-1/P5c (Increase, open the form inside the debounce, Save unchanged → the note must keep the increment). Commit the red test separately (it must FAIL on c2758a2; record the failure line).
2. **Fix.** Preferred shape: when the form editor opens, flush the owner view's pending persist (`view.ts` `flushPersist` / the debounced `persist()` at ~:249-320), **await the write**, then read the body (`currentBody()` / `lastKnownBody`) and open the form. If you choose seeding from the view's model instead, justify it in the report. Requirements:
   - Covers every opener of the form: the pipeline pencil and ds-hero's "Edit definition" (same `openFormEditor`), in Reading view, Live Preview and the sidebar host. Say for each which code path it takes and whether it was stale before.
   - No pending write → no behavior change (no extra write, no delay).
   - The flushed write is the view's own write, so it keeps the SC-509 `fromView` semantics (adopted, card kept); the later form Save still redraws (SC-509, G-S40 must stay green).
   - If the flush write fails/is dropped: report what happens (the existing dropped-write Notice? does the form open, and from what body?). Do not invent new UI; I will rule.
   - A second pencil click while the flush is in flight must not open two forms — check and report (fix if it is a one-liner).
   - Keep the change out of `FormModal.ts` unless unavoidable.
3. **Integrity probes (jest)**: note text above and below the block survives; two counters in one note — a pending write on counter A, form opened on counter B — no cross-talk; a hand edit elsewhere in the note while the write is pending survives.
4. **Real-Obsidian lifecycle scenario `G-S45`** in `visual-harness/obsidian-lifecycle.mjs`: Reading view counter, authoring controls on; real click on Increase, then open the pencil while the write is still pending; **anti-vacuity**: assert the note file still holds the OLD value at the moment the form opens is requested (proves you were inside the debounce); Save unchanged; assert the note holds the incremented value and the card shows it, and the note outside the block is byte-identical. **Authoring rule (dse-verify, mandatory): never a timed delay inside a lifecycle step to win a race against Obsidian — hold Obsidian at a hook instead.** Acting synchronously in the same evaluate right after the click is fine; a `sleep` to "land inside the window" is not. Fixed waits used only as windows for negative checks must be noted. G-S45 must FAIL against a c2758a2 bundle (build one via `DSE_LIFECYCLE_BUNDLE`, as G-S18/G-S40 did) — record the FAIL line.
5. **CHANGELOG**: one bullet under `## Unreleased` in your worktree superproject's `CHANGELOG.md`, plain user-facing words (the pencil form opened just after a click now includes that click; Save no longer undoes it). Commit in the superproject (only CHANGELOG — do not bump the dse pointer).
6. Commit after every coherent step (red, fix, probes, G-S45, CHANGELOG). No co-author/AI trailers in commit messages.

## 3. Gates (dse-verify, in order, on your final HEAD)

Expected at c2758a2 (yours will add tests/1 scenario):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6058 passed / 1 skipped / 245 of 246 suites** (after a shots run; plus your new tests)
- lifecycle **37/37** → expect **38/38** with G-S45
- e2e `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`
- shots **592**, 0 FAIL · freeze `freeze OK (280/280 …)` · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last)

## 4. Shell rules (each has cost real time — obey exactly)

- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/draw-steel-elements -- <cmd>`; **never `cd` inside a compound command**; every git command as `git -C <absolute path>`.
- **One blocking foreground gate per Bash call** (lifecycle, e2e, shots, parity each separate; set timeout 600000). No `run_in_background`, no Monitor, no background jobs. Redirect long output to a log file and read its summary line.
- **Exit codes from a script file**: write a script with the Write tool, run `devbox run -c <dse path> -- bash <script>`, and have the script write `rc` to a fresh uniquely named file. `bash -c '…; echo rc=$?'` under devbox always records 0.
- **Scratch**: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is shared by every agent. Use ONLY your private subfolder `.../scratchpad/sc519-r1-impl-<your agentId or a random suffix>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- **No `rm` with a shell-variable target, no glob `rm`**, never `rm -rf` a `/tmp` glob or `.superpowers/`. Overwrite with `>` or use fresh filenames.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, only a PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: set your own `DSE_LIFECYCLE_PORT` (e.g. 9291) in case another session is on 9262. Never use `DISPLAY=:1` / `--headed`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never create a tag or release. Never run `just deploy*`, `just wt-finish`, or push.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc519-form-stale-open/sc519-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, final dse sha + superproject sha, red→green facts, gate numbers). Then: design and why; per-opener table (pencil/Edit definition × Reading/LP/sidebar: path taken, stale before?, fixed?); flush-failure behavior; double-click behavior; diff stat; `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit shas (each), measured gate numbers, the red FAIL lines (jest and G-S45 vs c2758a2), and the absolute path of every evidence artifact (report, gate logs, lifecycle shots). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its first word must be `SC-519:`.
