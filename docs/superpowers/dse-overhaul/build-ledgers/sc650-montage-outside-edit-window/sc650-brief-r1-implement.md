# SC-650 r1 — implement: montage window closed by an outside edit → Notice + focus back to the opener

You are an implementer for ticket SC-650. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (read first)

- Ledger (current-state rulings; read it instead of any thread):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc650-montage-outside-edit-window/decisions.md`
- Prior art (landed; read the ledgers, open reports only where needed), in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`:
  - `sc608-outside-edit-tracker-window-ledger.md` + dir — the initiative version of this exact fix. Its r3/r5 review
    findings L1–L5, I7 are the traps to avoid repeating (sidebar compare against last loaded/written content; slot
    count change → Notice, no focus move; Sync burst settle; model-dropped bytes still count as an outside edit;
    focus-is-free check; cancel registered for plugin unload).
  - `sc626-montage-focus-after-write-ledger.md` + `sc626-montage-focus-after-write/sc626-r2-review-report.md` LOW-1
    (the measured bug and the prescribed fix: "Publish a `WindowRootRecord`, call `handOffAfterOutsideClose` from the
    view's unload while a window is open, and show the Notice when the content differs.").
  - `sc642-*` (`src/framework/kit/controlFocus.ts`), `sc627-*`/`sc631-*` (Add a hero / Log an action windows),
    `sc628-*`, `sc629-*`.
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~480 KB — read it in parts:
  "The battery, in order", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", "Current
  expected numbers"; grep it for "self-disabling", "mouse press", "SC-556", "SC-607", "SC-612", "drawn-from",
  "stale-section" for how an outside edit reaches an open view).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window` (superproject branch and
  every submodule on branch `sc650-montage-outside-edit-window`). Plugin dir:
  `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window/draw-steel-elements`.
  **Verify `pwd`/paths before every write. Never edit anything under `/home/scott/code/steelCompendium/workspace/`
  except your report file in the ledger dir.** The workspace-level files (CHANGELOG.md etc.) live in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window/` — never under
  `/home/scott/code/steelCompendium/workspace/`.
- Base: dse branch is at origin/develop `2777484c`. First: `git -C <plugin dir> fetch origin` and confirm
  origin/develop is still `2777484c`; if it moved, rebase onto it and say so. Superproject is at workspace
  origin/main `fded411f`.
- Fresh worktree has no `node_modules`: run `npm ci` once in the plugin dir (via a script file through
  `devbox run -c <abs plugin dir> -- bash <script>`, output to a log) before the first gate.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not flag or touch it.

## 2. The task

Ticket requirement (verbatim):

> Open a montage window (Log an action, Add a hero, Set limits, or the edit sheet of a logged action). While it is
> open, the note changes from outside (another pane, Sync, another app). The window closes with the old card, nothing
> tells the user why, and keyboard focus ends on the page.
>
> Nothing is lost: the outside edit survives and the window saves nothing. The user just loses what they were typing
> in the window and has to tab back from the top of the note.
>
> Expected: the same handling initiative got in SC-608, at least focus handed back to the rebuilt card's control that
> opened the window.

Inherited Scott ruling (SC-608, verbatim): "Option 1" — "Focus goes to the same control in the reloaded tracker, the
one you opened the window from. Anything typed or staged in the window is dropped [...] It cannot overwrite the
outside change." Plus the SC-608 Notice `OUTSIDE_CLOSE_NOTICE` ("The note changed outside, so this window closed
without saving"), shown only when the window closed BECAUSE of an outside edit, never on the montage's own write.

Owner rulings (see ledger): reuse `src/framework/chrome/windowHandoff.ts` — no second mechanism (if it needs a small
generalisation, make it and keep initiative green). Cover all four windows: Log an action, Add a hero (chrome and
board-corner openers), Set limits, edit sheet of a recorded cell. Reading view AND Live Preview. Check whether a
montage can be pinned in the sidebar (SidebarPanel / SidebarBlockHost); if so, give it SC-608's sidebar treatment
(close only when the montage's block content actually changed; a window left open must never write to stale model
objects — SC-608 found a silent write-loss there; also note `correctMontageEntry` / `removeMontageEntry` apply deltas
to an entry from the old model, model.ts ~497-524). When the opener control no longer exists, use the nearest
equivalent consistent with SC-626's `focusRules.ts`; when the slot can't be matched (montage count in scope changed),
Notice + no focus move. Out of scope: carrying focus inside the card across an outside rebuild with no window open
(SC-626 P14) — report as a follow-up only.

Keep the existing SC-626 behaviour (own write → focus to opener, no Notice) intact.

Tests:
- jsdom tests for the hand-off and Notice per window type; show they are RED on `2777484c` (revert the src change,
  run, restore) and record which.
- e2e in `e2e/specs/montage/` covering at least: one window per type in Reading view, at least two in Live Preview,
  Notice present on outside close, no Notice on own write, focus on the opener (by its label). Test titles carry
  scenario ids only — **never put a bracketed ticket id in a test title**; scenario ids are global, pick unused ones
  (grep the whole `e2e/` tree). If the e2e coverage map needs a pair, add it.
- A lifecycle scenario only if a behaviour can't be shown in e2e; if you add one it is `G-S140`, put it in part 7
  (`G-S108,G-S112,G-S115,G-S140`) and keep `G-S56` LAST in SCENARIOS order; note part 7 then takes longer.
- Run 2–3 mutants on the new logic (e.g. drop the Notice, skip the hand-off, always hand off) and record red/green.

Commit after every coherent step in the dse branch (`git -C <abs path>` for every git command, never `cd X; git …`).
Do NOT push. Do NOT touch the superproject (no pointer bump, no CHANGELOG) — the owner does that in a later round.
Update `draw-steel-elements/.repo-docs/architecture.md` (the windowHandoff row) if its description changes.

## 3. Gates (dse-verify battery, all in your worktree)

tsc clean · lint clean · jest (expect 13334 + your new tests passed / 2 skipped on a fresh worktree; 1 skipped once
shots has run) · lifecycle 64/64 (65/65 if you add G-S140) in SEVEN parts, `--only=` WITH the equals sign
(with a space the runner runs the whole suite), one part per Bash call:
  1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4) 7. `G-S108,G-S112,G-S115` (3) — take parts 1 and 2's exact id lists from dse-verify.
  Part 7 takes ~200 s, over the 180 s Bash auto-background limit: start it with output to a unique log + rc file and
  POLL that log/rc file (never wait for a background-completion notice).
· e2e `597+N/612+N ok, 0 failed, 15 known-bug, coverage: P/P pairs` (P = 417 + any new pairs) · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (LAST).

Known flakes: G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) suspected flake
(SC-633): re-run part 7 once on a loaded host; any other failure is real. INIT-W10 e2e flaked once under load
(SC-654). SET-X03 / SET-X04 e2e flaked once (SC-657). SC-622: the Obsidian camera can leave
`demo-vault/.obsidian/appearance.json` dirty in YOUR worktree, which fails G-S97 — `git -C <plugin dir> checkout --
demo-vault/.obsidian/appearance.json` before blaming your change. Jest default timeout is 30 s (SC-568): an
"Exceeded timeout" is a real hang until proven otherwise.

## 4. Footguns (each cost real time once)

- Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; never `cd` inside a compound command; devbox eats
  `$?`/`$PIPESTATUS` and `| tail` hides failures — record exit codes inside the script file and read each gate's
  summary line.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r1-<your agent id>/`
  with uniquely named scripts and logs. Use the Write tool for scratch files (no heredocs).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and no `rm` with a variable target
  anywhere** — it hangs on a permission prompt nobody answers. Leave throwaway files in place; overwrite with `>`.
  Never glob-delete `/tmp/dse-obsidian-lifecycle-*` or similar. Never `rm -rf` `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.
- Run each gate as one blocking foreground call where it fits under ~170 s; for longer ones, log to a unique file
  and poll the log/rc file. Never key a wait-loop on a scratch filename or its contents from another run — write
  to a per-run unique path. Redirect long output to files rather than streaming it.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the
  question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-650:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc650-montage-outside-edit-window/sc650-r1-impl-report.md`.
Open with a ≤10-line executive summary. Then: commits (sha + one line each), design (what you reused/changed in
windowHandoff.ts, opener mapping table per window and fallbacks, sidebar finding), red-on-base list, mutants,
each gate's measured summary line, `Drive-by fixes:` and `Follow-ups:` lists, and the path of every log.

## 6. Return contract

Final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch head sha, base sha, measured gate
numbers, red-on-base counts, follow-ups, and the absolute path of the report and every evidence log. No prose.
