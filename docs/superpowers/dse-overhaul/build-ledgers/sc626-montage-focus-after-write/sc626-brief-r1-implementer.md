# SC-626 r1 implementer brief — montage keeps keyboard focus after a write / strip toggle / window close

## 1. Context loading (read first)

- Ledger (current-state rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write`
  - dse submodule: `.../draw-steel-elements`, branch `sc626-montage-focus-after-write`, at dse `develop` `f6e504c7`.
  - Superproject at workspace `origin/main` `7aae3668`. Do NOT commit to the superproject (no pointer bump, no CHANGELOG edit) — the owner handles that.
  - Verify `pwd` / use absolute paths for every write. **Every git command is `git -C <absolute path>`**, never `cd X; git ...`.
  - First: `git -C <dse path> fetch origin` and confirm `origin/develop` is still `f6e504c7`; if it moved, rebase onto it and say so in the report.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is here and in the ledger.
- Required reading: workspace `AGENTS.md` (worktree rule), `.claude/orchestrate/PROJECT.md` §8 footguns,
  and the `dse-verify` skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (very long lines: read with `sed -n 'A,Bp' | cut -c1-600`, sections "The battery, in order", "Devbox wrapping",
  "Stale main.js", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", and the
  CURRENT block of "Current expected numbers").
- Prior art (landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`
  `sc614-conditions-mouse-remove-focus*`, `sc585-*`, `sc613-*` (focus kept after a write in other elements) and
  `sc438-e2e-montage*` (montage e2e; its r1 report and r2 review describe exactly how SC-626 reproduces).
  Closest code pattern: `src/elements/initiative/view.ts` with the shared kit helper
  `src/framework/kit/controlFocus.ts` (`captureControlFocus` / `restoreControlFocus` / `controlSuccessor`) and the
  Live Preview carry `src/framework/host/livePreviewFocusCarry.ts` (SC-602), which reads control ids.
- Scott's live vault dirt in the MAIN checkout (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is expected; ignore it. You do not work there anyway.

## 2. The task

The ticket requirement, verbatim (ledger):

> A keyboard user tabs to a montage button (for example End round) and presses Enter. The write lands,
> the card is redrawn, and keyboard focus is gone: it sits on the page, not on the button. The same
> happens when the round strip is opened or closed, and when a montage window closes after it wrote.
> The user has to tab back from the top of the note after every action.
>
> Expected: focus returns to the same control after the redraw (or to its nearest equivalent when the
> control no longer exists).

> A fix must cover Reading view AND Live Preview.

Owner rule (ledger, 2026-11-14), verbatim:

> Follow the prior-art rule from SC-614 / SC-585 / SC-613: focus is restored only when it
> was inside the card (or the window that wrote) before the action; a write with focus elsewhere
> (outside edit, file-change re-render, click while focus is outside the card) never pulls focus in.

Where it breaks (ticket agent notes): `src/elements/montage/view.ts` `commit()` (~:532) → `update()` empties and
rebuilds the root; the strip's `onToggle` (~:109) rebuilds too. The montage uses neither focus helper.

What to do:

1. **Survey every montage rebuild path first** (`src/elements/montage/*.ts`): every control that writes (head,
   board, outcome band, strip, guide, hero rows, …), every local-state rebuild (strip / guide open-close), and the
   three windows (Log an action `LogActionModal.ts`, Add a hero and Set limits in `ConfigModals.ts`) closing after a
   write. List them in the report as a table: path → control id before → where focus lands after.
2. **Fix it** with the shared kit helper (`controlFocus.ts`), not a montage-private copy. Extend the kit only if a
   montage need is genuinely general; keep any kit change small and keep initiative/conditions behaviour identical
   (their jest + e2e must stay green).
3. **Nearest equivalent** when the control no longer exists after the write (e.g. End round on the last round so
   the montage ends, a button that disables/hides, a hero row removed): choose a sensible successor, document each
   mapping in a code comment and in the report table. If any mapping feels like a real taste call, do not guess —
   implement the most conservative option and flag it under `Open questions:` in the report.
4. **Windows:** when a montage window closes after it wrote, focus lands on the rebuilt control that opened it (e.g.
   the Log button), not on `<body>` (Obsidian's modal-close restores focus to the old, now-detached element).
5. **Live Preview:** confirm the SC-602 carry handles the montage after the fix (the r2 review of SC-438 found it
   reads control ids, which the montage has since SC-438). `[MONT-F04]` is the Live Preview test.
6. **Tests:**
   - Flip the markers to plain tests: e2e `[MONT-F01]`..`[MONT-F04]` in `e2e/specs/montage/focus.e2e.ts` (remove the
     `knownBug('SC-626', …)` wrapper and its `failsWith`), jsdom `[K03]` in `test/dom/elements/montage-matrix.test.ts`
     (`test.failing` → `test`). Update the montage jsdom-marker line in dse-verify? **No** — you do not edit
     SKILL.md; list any SKILL text that goes stale in the report under `Skill notes:`.
   - Add jsdom tests for every path in your survey table (focus kept / successor), plus the negative rule: a write
     with focus outside the card (outside file edit, re-render with focus elsewhere) leaves focus where it was. Each new
     test must FAIL with your `src/` change reverted — check this and report the count.
   - Add e2e tests (real keys) for the window paths (Add a hero, Set limits close after a write) and at least one
     nearest-equivalent path, plus one negative (focus outside stays outside). New e2e ids continue the `MONT-F`
     series (`[MONT-F05]`, …). Scenario ids are global: grep `e2e/` for your id before using it. **Never put a
     bracketed ticket id in a test title** (the runner reads titles for scenario ids). Any new control needs its
     manifest row (coverage gate).
   - Lifecycle: add a scenario only if a path is untestable in e2e; id `G-S123` is reserved for this ticket.
7. Commit after each coherent step inside the dse submodule (conventional message, `fix(SC-626): …` /
   `test(SC-626): …`). No co-author or AI attribution lines in commits.

## 3. Gates (dse-verify, full battery, in order)

Baseline at `f6e504c7` (CURRENT): tsc + lint clean · jest **12125 passed / 1 skipped** with the shots cache
(fresh worktree: one fewer passed, 2 skipped — **measure and report your own fresh figure first, before changes**)
· lifecycle **64/64** · e2e `OBSIDIAN-E2E done: 415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` ·
shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Expected after your change: jest base + your new tests, 0 failed; e2e `(419 + new)/(428 + new) ok, 0 failed,
9 known-bug, coverage: Y/Y pairs` (the 4 SC-626 known-bugs become ok); lifecycle 64/64 (65 if you add G-S123); shots
592 with unchanged host-leak / modal host-leak / clip unless you add controls (explain any move); freeze 280/280
(a moved frozen hash = STOP and report, never touch the baseline); parity 0 / 0 / 24.

Lifecycle runs in SEVEN `--only` parts (`--only=` takes comma-separated ids), one part per Bash call, output to a
log in your private scratch folder, and poll the pid (part 7 takes ~200 s, over the 180 s foreground limit):

1. `G-S7a … G-S9a` (21) — take the exact id list from the SCENARIOS array in `visual-harness/obsidian-lifecycle.mjs`
2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3)

Known lifecycle signals: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g)
suspected flake (SC-633): a (g) red showing the "changed on disk first" Notice on a loaded host gets ONE re-run of
part 7; a red on the re-run, on a quiet host, or in any other G-S115 cell is real. SC-622: the Obsidian camera tool can
leave `demo-vault/.obsidian/appearance.json` dirty in your worktree, which made G-S97 fail — restore it
(`git -C <dse path> checkout -- demo-vault/.obsidian/appearance.json`) before blaming your change.
Jest timeout is 30 s since SC-568: an "Exceeded timeout" is a real hang until proven otherwise; time-dependent tests use
a fake clock with literal gaps. `rm -f main.js styles.css` in the plugin root before `npx jest` (literal path, no variables).

## 4. Footguns (every one has cost real time)

- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers this wave hung on a
  permission prompt doing that). Leave throwaway files in place. No `rm` with a shell-variable target anywhere.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc626-r1-impl/`
  (create it with the Write tool or `mkdir -p`); uniquely named scripts and logs inside it. Use the Write tool for scratch files, not heredocs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write/draw-steel-elements -- bash <script file>`;
  never `cd` inside a compound command. Exit codes: read each gate's own summary line; record rc only from inside a
  script file. Never pipe a gate into `tail`.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- The Bash tool backgrounds any call over 180 s and notifies on completion. Prefer: start the gate with output to a
  unique log + rc file, then poll with `timeout 175 tail --pid=<your pid> -f /dev/null` on YOUR OWN pid
  (pick it by `/proc/<pid>/cwd` inside your worktree). Never wait on a monitor or a background notice you started.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches. Read the process's own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` or command line is in YOUR worktree.
- Never `rm -rf` a shared `/tmp` glob (`/tmp/dse-obsidian-lifecycle-*` etc.).
- e2e: never `--headed` on `:1`. `grep` is ugrep and treats `e2e/run.mjs` as binary: use `command grep -a`.
- Workspace-level files live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write/` —
  never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir for reports). You should not need to edit any.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report;
  I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-626:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/sc626-r1-implementer-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, final dse sha, gate numbers). Then: survey table, nearest-
equivalent mappings, files changed, reverted-src red count for new tests, `Drive-by fixes:`, `Follow-ups:`,
`Open questions:`, `Skill notes:`, and the absolute path of every evidence artifact (logs, failure bundles).

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS /
NEEDS_CONTEXT / BLOCKED), final dse sha, each gate's measured summary line, report path, evidence paths. No prose.
