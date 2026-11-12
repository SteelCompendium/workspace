# SC-603 r1 — implement: focus returns to the tracker after Apply in the minion pool modal or a roster cell Stamina edit

You are an implementer for ticket SC-603. You may be replaced mid-task by a fresh worker; everything you need is in files.

## 1. Context loading

- Read first: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/decisions.md`. It is the spec. The rulings below are quoted from it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply`. Every submodule is on branch `sc603-focus-after-pool-apply`. Plugin: `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply/draw-steel-elements`. Verify paths before any write. **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir. The workspace-level CHANGELOG you edit is the worktree superproject's: `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply/CHANGELOG.md` — never the one under `workspace/`.
- Base: dse `develop` @ `b5d18f79` (already checked out). First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `b5d18f79`; if it moved, rebase onto it and say so (run `npm ci` if `package.json`'s obsidian version changed).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for the battery (~330 KB: read "The battery, in order", the devbox / exit-code sections, "Lifecycle and e2e notes", "Hover preview modals (SC-595)" and the CURRENT entry under "Current expected numbers"; do not read it whole).
- Prior art: SC-588 (`src/framework/kit/controlFocus.ts`; its use in `src/elements/initiative/view.ts`: `captureControlFocus` / `restoreControlFocus`, `FOCUS_FAMILIES`, and the Reset encounter item ~line 364 which captures the token before its modal opens and restores after `rebuildFromWrittenReset`). SC-589 (quick-add draft, same file). Ledgers and reports: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc588-initiative-focus-after-rebuild/` (esp. `sc588-r2-review-report.md`, which found this bug) and `…/sc589-malice-quickadd-lost-on-rebuild/`. Pool modal: `src/views/MinionStaminaPoolModal.ts` (saves before close ~309-310). Openers in `view.ts`: grid cell `dblclick` ~1838, detail row `openDetailStamina` ~1956, `openCreatureStaminaModal`.
- Parallel owners: SC-598 owns `src/…/managedModal.ts` right now. Touch it only if there is no other way, and say so in the report.
- Scott's live vault dirt in the MAIN checkout's dse (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected; ignore it.

## 2. The task (owner rulings, verbatim from the ledger)

> - 2026-11-11 — Scope: every modal the initiative tracker opens whose save rebuilds the whole tracker (`rebuildAndPersist` or another full rebuild) — at least the minion pool modal from both openers (grid cell double-click and the detail row's Stamina control) and the creature Stamina modal opened from a grid cell double-click. The implementer surveys every `openModal(` / `new …Modal(` call site in `src/elements/initiative/view.ts` and reports, per site and per close route (Apply/Save/Done, Enter, Cancel, Escape), where focus lands today and after the fix. Fix every site where it drops to the page body or the note's container.
> - 2026-11-11 — Behaviour: when such a modal closes, focus goes where Obsidian itself would have put it had the opener survived the rebuild — the rebuilt replacement of the control that had focus when the modal opened (same control family and the same creature / instance), whether the modal was opened by keyboard or mouse. If that control no longer exists, the control that replaced it in the same place; failing that, the tracker's own focusable root — never the page body. If focus was not inside the tracker when the modal opened, restore nothing. Cancel and Escape (no save, no rebuild) must keep landing on the opener exactly as today.
> - 2026-11-11 — Fix shape (from the SC-588 review, quoted on the ticket): "capture the opener's focus token when the modal opens, as the Reset encounter item already does, and restore it after the rebuild." The restore must win over the modal's own close-time focus handling (it runs after the modal has closed). Reuse `controlFocus.ts`; no second focus mechanism.
> - 2026-11-11 — Views: Reading view and the pinned sidebar tracker. Live Preview losing focus on the tracker's own save is SC-602 — out of scope; the CHANGELOG says "Reading view and the pinned sidebar tracker" (SC-589 precedent).
> - 2026-11-11 — The roster cells open the Stamina edit only on double-click. That is not a keyboard-reachability gap IF the same edit is reachable from the keyboard by selecting the cell and using the detail row's Stamina control — the implementer confirms this in real Obsidian and reports; only if it is NOT reachable does it come back to the owner (a Backlog ticket, not a fix here).
> - 2026-11-11 — Tests: jest cases per fixed site (red on the base, shown). Real-Obsidian coverage goes in e2e (`e2e/specs/initiative/` or the pool-modal specs), not lifecycle: keyboard route into the pool modal from the detail row → Apply by Enter → focus is on the rebuilt detail-row Stamina control; grid double-click → Stamina modal → Enter → focus is on the same rebuilt cell. Never put a bracketed ticket id in an e2e test title. No new lifecycle scenario (G-S94 reserved only if e2e cannot express it; part 5 is ~347 s; never a new G-S64 phase).
> - 2026-11-11 — Docs: a bullet under `## Unreleased` in the worktree superproject's CHANGELOG and in the dse CHANGELOG, in SC-588 / SC-589 style.

Notes (your call, justify in the report):
- First confirm the bug in real Obsidian (e2e driver or a probe) and find out exactly what Obsidian's Modal does with focus on close (does it restore `document.activeElement` from open time? when — synchronously in `close()`, or later?). Your restore has to land after that, and must not fire if the user has already moved focus somewhere real.
- Some Stamina-modal paths may be partial repaints, not full rebuilds (SC-426: detail row vs grid). Test each site either way; a site where focus already survives needs no code, only a test if cheap.
- Check whether an e2e or jest known-bug marker for SC-603 already exists; if so it becomes a plain test.
- If the e2e manifest's coverage pairs change, say how.
- Write tests red-first.

Commit after every coherent step (fix, tests, e2e, docs) on branch `sc603-focus-after-pool-apply` in the dse submodule; the CHANGELOG commit goes in the worktree superproject on the same branch name. Never push.

## 3. Gates (dse-verify battery) and expected numbers at `b5d18f79`

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7328 passed / 2 skipped** in a fresh worktree — expect a higher count with your new tests · lifecycle **56/56**, run as five `--only` parts, each its own foreground call: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6) — read the exact part lists out of dse-verify · e2e baseline `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580); after your change expect **0 failed, 4 known-bug, coverage Y/Y** with ok/total up by your new test(s) · shots **592**, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze **280/280** · parity **0/0/24**. If `styles.css` is byte-identical to a clean `b5d18f79` build (sha256 compare), shots/freeze/parity carry and you may say so instead of re-running them; otherwise run them.

`rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows main.ts) — literal paths only. Load-sensitive suites: on a timeout-shaped red check `/proc/loadavg` and re-run that suite alone before believing it.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply/draw-steel-elements -- bash <script file>`. Never trust an echoed `$?` inside `bash -c` (any quoting); never pipe a gate (`| tail`). Capture exit codes inside a script file and also read each gate's own summary line.
- `git -C <absolute path>` for every git command — never `cd X; git …`, never `cd` in a compound command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r1-impl/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a glob, and never `rm` a `/tmp` glob** (today a worker ran one and wiped other efforts' kept lifecycle FAIL dirs). No `rm` with a shell-variable target either. Delete only literal paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc603-focus-after-pool-apply/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree.
- Run each gate as one blocking FOREGROUND call (lifecycle in its five parts, e2e its own call; stay under the 10-minute tool timeout). No `run_in_background`, no Monitor. Redirect long output to a file in your scratch folder, then read the file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions.
- Never put a bracketed ticket id (`[SC-603]`, `[known bug …]`) in an e2e test title.
- Never tag or release draw-steel-elements. Never push; never run `just wt-finish`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever message anyway, its first word must be `SC-603:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/sc603-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, final dse sha, superproject sha, gate numbers). Body: what Obsidian's Modal does with focus on close (measured); the per-site / per-close-route table (before and after); the design (where the token is captured, when and how it is restored, why it wins over the modal's close handling, how it stays out of the way when focus moved elsewhere); the roster double-click keyboard-reachability finding; files changed with line refs; tests added (red on the base); exact gate summary lines; `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch, shas, measured numbers per gate, no prose — plus the absolute path of every evidence artifact you produced (report, logs).
