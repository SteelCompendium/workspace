# SC-588 r1 — implementer brief: restore keyboard focus after a whole-tracker initiative rebuild

## 1. Context loading (do this first)

- Ledger (current-state rulings; read it, it overrides anything else):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild`
  — plugin at `.../draw-steel-elements`, branch `sc588-initiative-focus-after-rebuild`, base dse `develop` @ `4f0c87f2`.
  Run `git -C /home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `4f0c87f2`; if it moved, rebase onto it and say so in the report.
  Verify `pwd`/paths before every write: NEVER write under `/home/scott/code/steelCompendium/workspace/` except
  your report file in the ledger dir. Workspace-level files (CHANGELOG.md, docs) you need live in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild/…`.
- Prior art (read the executive summaries, then the parts you need):
  - SC-518 (same fix shape — remember focused `data-dse-control` id + instance key before rebuild, refocus the successor after):
    `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc518-form-save-focus-ledger.md` (+ dir `sc518-form-save-focus/`)
  - SC-505 / SC-511 (focus handoff, `chrome/focusHandoff.ts`): `.../build-ledgers/sc505-collapse-pin-focus-ledger.md`, `sc511-sidebar-unpin-focus-ledger.md`
  - SC-437 (initiative e2e rollout; its review r2 ZZ-F1..F3 are the real-Obsidian repro probes; the e2e suite carries a known-bug marker citing SC-588):
    `.../build-ledgers/sc437-e2e-initiative-tracker-ledger.md` (+ dir)
  - SC-578 (precedent for turning a known-bug e2e marker into a plain test — INIT-M09): `.../build-ledgers/sc578-malice-clamped-log-ledger.md`
- The `dse-verify` skill owns the gate battery: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~320 KB — read "The battery, in order" through "THE exit-code footgun" (lines ~20-217) and the top
  CURRENT entry of "Current expected numbers"; grep for anything else you need).
- **You never call the tracker (Linear)** — not to read history, not to post. The ledger is your context.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault and expected — do not flag or touch it.

## 2. The task

Spec, verbatim from the ledger:

> Any initiative action that rebuilds the whole tracker leaves keyboard focus on the page body. A keyboard user who presses Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, or Enter in the Malice quick-add box has to Tab back in from the top of the note.
>
> Cause: the tracker's actions call a full rebuild (`src/elements/initiative/view.ts:163-170` → `src/framework/view.ts:217-226`), which replaces the focused node without restoring focus. Fix shape from SC-518: remember the focused control's `data-dse-control` id (and instance key) before the rebuild and refocus its successor after.

Owner rulings, verbatim from the ledger:

> - Scope is the five actions named in the spec. SC-589 (a whole-tracker rebuild loses a HALF-TYPED Malice quick-add value) is OUT of scope — do not fix it here; it is its own Backlog ticket.
> - The SC-588 known-bug marker in the e2e suite (from SC-437) must become a plain passing e2e test, and SC-588 comes off the e2e known-bug list (the SC-578 precedent: INIT-M09). Expected e2e after the fix: 0 failed, known-bug count 4 (SC-257, SC-355, SC-384, SC-580), coverage Y/Y pairs.
> - Real-Obsidian coverage goes in e2e, not lifecycle. Add a lifecycle scenario only if e2e cannot express it; if one is needed it is G-S88 in part 5 (never a new G-S64 phase — part 3 sits at the ~480 s line).
> - Where the focused control no longer exists after the rebuild (e.g. Make captain → the button becomes Relieve captain; Reset encounter → Yes from a confirm modal), focus goes to the control that replaced it in the same place; if nothing sensible exists, the tracker's own focusable root — never the page body. Implementer documents the mapping per action in its report.

Notes:
- Reset encounter → Yes goes through a confirm modal: the modal's own focus-return (DseModal) and the
  rebuild race each other. Make sure the final resting place is the tracker control, not body, in real Obsidian.
- Prefer fixing it once at the rebuild site (framework or initiative view) over per-action patches, but
  don't widen behavior for other elements unless it is clearly the same code path and safe; say what you chose and why.
- Only restore focus when focus was inside the tracker before the rebuild (a mouse click / a rebuild
  triggered from elsewhere — another pane, a file-change re-render — must NOT steal focus). Test that.
- Ship jest tests per the repo's conventions (red before the fix, green after), plus the e2e conversion.
- CHANGELOG: one user-facing bullet under `## Unreleased` in the dse `CHANGELOG.md` (check where the
  repo keeps it and follow the SC-578 / SC-595 entries' style).
- Commit after every coherent step. **Never put a bracketed ticket id in an e2e test title** — the e2e
  runner reads test titles for scenario ids.

## 3. Gates (dse-verify battery) and expected numbers at `4f0c87f2`

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7238 passed / 2 skipped** in a fresh
worktree (7239/1 once shots has cached the css) — expect a higher count with your new tests · lifecycle
**55/55**, run as five `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST);
`G-S59 G-S49 G-S73 G-S77 G-S83` (5) — read the exact part lists out of dse-verify · e2e baseline
`262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`; after the fix expect 0 failed, **4 known-bug**,
coverage Y/Y · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280**
· parity **0/0/24**. If `styles.css` is byte-identical to a clean `4f0c87f2` build (sha256 compare), shots/freeze/parity
carry and you may say so instead of re-running them (the SC-595 precedent); otherwise run them.

`rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows main.ts).
Load-sensitive suites: on a timeout-shaped red check `/proc/loadavg` and re-run that suite alone before believing it.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild/draw-steel-elements -- bash <script file>`.
  Never trust an echoed `$?` inside `bash -c` (any quoting); never pipe a gate (`| tail`). Capture exit
  codes inside a script file and also read each gate's own summary line.
- `git -C <absolute path>` for every git command — never `cd X; git …`, never `cd` in a compound command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc588-r1-impl/`
  with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a glob, and never `rm` a `/tmp` glob** (today a worker ran one and wiped other efforts' kept
  lifecycle FAIL dirs). No `rm` with a shell-variable target either. Delete only literal paths you created.
  Never touch `.superpowers/` outside `.superpowers/sdd/sc588-initiative-focus-after-rebuild/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree.
- Run each gate as one blocking FOREGROUND call (split lifecycle into its five parts and e2e into its own call to
  stay under the 10-minute tool timeout). No `run_in_background`, no Monitor. Redirect long output to a file in
  your scratch folder, then read the file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions.
- Never tag or release draw-steel-elements. Never push; never run `just wt-finish`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher,
  not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you.
  If you ever message anyway, its first word must be `SC-588:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/sc588-r1-impl-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, final dse sha, gate numbers).
Body: the focus mapping per action (all five), the design choice (where the save/restore lives and why),
files changed with line refs, tests added (and that they were red before the fix), exact gate summary lines,
`Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch, shas, measured numbers per gate,
no prose — plus the absolute path of every evidence artifact you produced (report, logs).
