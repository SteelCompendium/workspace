# SC-589 r1 — implement: a half-typed Malice quick-add survives a whole-tracker rebuild

You are an implementer for ticket SC-589. You may be replaced mid-task by a fresh worker; everything you need is in files.

## 1. Context loading

- Read first: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/decisions.md`. It is the spec. The rulings below are quoted from it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild`. Every submodule is on branch `sc589-malice-quickadd-lost-on-rebuild`. Plugin: `…/draw-steel-elements`. Verify `pwd`/paths before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir. The workspace-level CHANGELOG you edit is the worktree superproject's: `/home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild/CHANGELOG.md`.
- Base: dse `develop` @ `e0e49d4d` (already checked out). First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `e0e49d4d`; if it moved, rebase onto it and say so (run `npm ci` if `package.json`'s obsidian version changed).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for the battery (it is ~300 KB: read the "The battery, in order" section, the devbox/exit-code sections, "Lifecycle and e2e notes", and the CURRENT entry under "Current expected numbers"; do not read it whole).
- Prior art on the same rebuild path (SC-588, landed): `src/framework/kit/controlFocus.ts` and its use in `src/elements/initiative/view.ts` (`captureControlFocus` / `restoreControlFocus`, `FOCUS_FAMILIES`). Its ledger and reports: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc588-initiative-focus-after-rebuild/`. Quick-add code: `src/elements/initiative/view.ts` ~line 630-725 (`init.malice.quickadd.amount` / `.label` / `.add`). Malice prior art: SC-577, SC-578 ledgers in the same build-ledgers dir.
- Scott's live vault dirt in the MAIN checkout's dse (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected; ignore it.

## 2. The task (owner rulings, verbatim from the ledger)

> - 2026-11-11 — Behaviour: what is typed in the two quick-add boxes (amount and label) is a per-view DRAFT. It survives EVERY whole-tracker rebuild of the same tracker view — Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, the - / + Malice stepper, any other `rebuildAndPersist`/full rebuild path, and collapsing/expanding the Malice section. It is cleared only by a successful Add (button or Enter), exactly as today. It is never written to the note. It does not need to survive a remount (closing and reopening the note, a new view instance).
> - 2026-11-11 — Everything derived from the boxes (the hint text, the Add button's enabled state, any validation styling) is recomputed from the restored draft, so the restored boxes look exactly as if the user had just typed into them.
> - 2026-11-11 — If keyboard focus was inside one of the quick-add boxes when the rebuild happened, SC-588's focus restore already returns focus there; the caret position / selection is restored too.
> - 2026-11-11 — The jest marker `[M10] … [known bug SC-589]` becomes a plain passing test (drop `test.failing` and the `[known bug SC-589]` suffix). Add jest cases for the other rebuild paths named above and for "Add clears the draft".
> - 2026-11-11 — Real-Obsidian coverage goes in e2e (`e2e/specs/initiative/`), not lifecycle: type amount + label, press Advance round, both boxes still hold the values; then Add commits it and the boxes are empty. Never put a bracketed ticket id in an e2e test title (the runner reads titles for scenario ids). No new lifecycle scenario (G-S93 reserved only if e2e cannot express it; never a new G-S64 phase).
> - 2026-11-11 — Docs: a bullet under `## Unreleased` in the workspace CHANGELOG (in the worktree superproject) and the dse CHANGELOG, matching SC-588's style.

The jest marker: `test/dom/elements/initiative-matrix.test.ts:1119-1129`; also update the comment block above it (~line 1110-1117) that lists the remaining known bugs.

Design notes (your call, justify in the report): keep the draft on the view instance (it outlives `update()` rebuilds; SC-588's comment at view.ts ~153 says listener owners are released per rebuild, so do not store it on the per-mount `owner`). Capture from the live inputs at rebuild time or keep it current on `input` events — whichever is robust when a rebuild is triggered by a click elsewhere and by an external note write. Check whether the stepper / collapse paths are partial updates rather than full rebuilds; test them either way. Write tests red-first (show they fail on the base).

Commit after every coherent step (fix, tests, e2e, docs) on branch `sc589-malice-quickadd-lost-on-rebuild` in the dse submodule; the CHANGELOG commit goes in the worktree superproject on the same branch name. Never push.

## 3. Gates (dse-verify battery) and expected numbers at `e0e49d4d`

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7304 passed / 2 skipped** in a fresh worktree — expect a higher count with your new tests (the M10 test flips from `failing` to passing) · lifecycle **56/56**, run as five `--only` parts, each its own foreground call: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6) — read the exact part lists out of dse-verify · e2e baseline `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580); after your change expect **0 failed, 4 known-bug, coverage Y/Y** with ok/total up by your new test(s) · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** · parity **0/0/24**. If `styles.css` is byte-identical to a clean `e0e49d4d` build (sha256 compare), shots/freeze/parity carry and you may say so instead of re-running them; otherwise run them.

`rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows main.ts). Load-sensitive suites: on a timeout-shaped red check `/proc/loadavg` and re-run that suite alone before believing it.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild/draw-steel-elements -- bash <script file>`. Never trust an echoed `$?` inside `bash -c` (any quoting); never pipe a gate (`| tail`). Capture exit codes inside a script file and also read each gate's own summary line.
- `git -C <absolute path>` for every git command — never `cd X; git …`, never `cd` in a compound command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r1-impl/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a glob, and never `rm` a `/tmp` glob** (today a worker ran one and wiped other efforts' kept lifecycle FAIL dirs). No `rm` with a shell-variable target either. Delete only literal paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree.
- Run each gate as one blocking FOREGROUND call (lifecycle in its five parts, e2e its own call; stay under the 10-minute tool timeout). No `run_in_background`, no Monitor. Redirect long output to a file in your scratch folder, then read the file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions.
- Never put a bracketed ticket id (`[SC-589]`, `[known bug …]`) in an e2e test title.
- Never tag or release draw-steel-elements. Never push; never run `just wt-finish`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever message anyway, its first word must be `SC-589:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/sc589-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, final dse sha, superproject sha, gate numbers). Body: the design choice (where the draft lives, how it is captured/restored, why), the behaviour per rebuild path named in the ruling (incl. which are full rebuilds vs partial updates), caret restore, files changed with line refs, tests added (and that they were red on the base), exact gate summary lines, `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch, shas, measured numbers per gate, no prose — plus the absolute path of every evidence artifact you produced (report, logs).
