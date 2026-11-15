# SC-656 r1 — implement: outside edit redraws a negotiation card while one of its controls has keyboard focus → focus stays on that control

You are an implementer for ticket SC-656. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (read first)

- Ledger (current-state rulings; read it instead of any thread):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/decisions.md`
- Prior art (landed; read the ledgers, open reports only where needed), in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`:
  - `sc650-montage-outside-edit-window-ledger.md` + dir — the latest user of `src/framework/chrome/windowHandoff.ts`.
    Its reviewer's carry-over note for SC-656 is quoted in the ledger. The r2..r8 review reports
    (`sc650-r2-review-report.md`, `sc650-r4-rereview-report.md`, `sc650-r6-rereview-report.md`, `sc650-r8-rereview-report.md`)
    hold the traps already found in that code: two blocks of the same element in one note (slot index past the end),
    a slow redraw (700 ms) — own write must never be mistaken for an outside one, LP callout sibling rebuild, the
    pinned sidebar.
  - `sc608-outside-edit-tracker-window-ledger.md` + dir — origin of `windowHandoff.ts` (slot keyed by sourcePath +
    pane + element index; focus-is-free check incl. popouts; plugin-unload cancel).
  - `sc642-negotiation-complete-focus-ledger.md`, `sc639-negotiation-reset-focus-ledger.md` + dirs —
    `src/elements/negotiation/focusRules.ts`, `src/framework/kit/controlFocus.ts`. The SC-642 r2 review report
    (`sc642-negotiation-complete-focus/sc642-r2-review-report.md`, probe P12 / INFO-3) measured THIS bug.
  - `sc626-montage-focus-after-write-ledger.md` — the "never pull focus in" rule.
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~490 KB — read it in parts:
  "The battery, in order" (lines ~20-135), "Jest timeouts under load", "Lifecycle and e2e notes" (incl. the
  self-disabling-button / mouse-press note and the negotiation e2e notes), "THE exit-code footgun", "Current expected
  numbers" (line ~1532)).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus` (superproject and every
  submodule on branch `sc656-negotiation-outside-edit-focus`). Plugin dir:
  `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus/draw-steel-elements`.
  **Verify paths before every write. Never edit anything under `/home/scott/code/steelCompendium/workspace/`
  except your report file in the ledger dir.** Workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus/` — but you do not touch the
  superproject in this round at all.
- Base: dse branch is at origin/develop `42c26272`. First: `git -C <plugin dir> fetch origin` and confirm
  origin/develop is still `42c26272`; if it moved, rebase onto it and say so (report the new base).
- Fresh worktree has no `node_modules`: run `npm ci` once in the plugin dir (script file through
  `devbox run -c <abs plugin dir> -- bash <script>`, output to a log) before the first gate.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected, not yours; do not flag or touch it.

## 2. The task

Ticket (verbatim):

> **What happens:** Tab to a button on a negotiation card (for example Complete Argument), then let something else
> change the note: Sync, another pane, or another plugin. The card is redrawn, and keyboard focus goes to the page.
> The next Tab starts from the top of the note.
>
> **Expected:** focus stays on the same button in the redrawn card, as it does for other trackers after an outside edit.
>
> Agent notes: Reading view: an outside `vault.process` edit re-renders a fresh view with no adoption, so focus lands
> on `<body>`. [...] Live Preview not measured.

Owner rulings (verbatim from the ledger):

- "Behaviour: when an outside change redraws a `ds-negotiation` card while keyboard focus is on one of its controls,
  focus goes to the same control (same focus token) in the redrawn card. Only when focus was inside that card at the
  moment of the outside change; never pull focus in otherwise. No Notice (nothing was lost; no window closed)."
- "Fallbacks: (a) same control gone or disabled in the redrawn card → nearest equivalent per
  `src/elements/negotiation/focusRules.ts` style (SC-639/SC-642), else the card root; (b) the card's slot cannot be
  matched (negotiation count in scope changed) → no focus move (SC-608 L2 rule); (c) the user moved focus elsewhere
  before the redraw arrives → no focus move (windowHandoff's user-moved cancel)."
- "Mechanism: reuse `src/framework/chrome/windowHandoff.ts` (slot lookup, watch, cancels); add only the window-less
  trigger. No second hand-off mechanism. Keep the change as small as the reuse allows."
- "Surfaces: Reading view AND Live Preview (measure LP first; SC-602's `livePreviewFocusCarry` may already cover it —
  if LP already keeps focus, pin it with a test and change nothing there). Pinned sidebar if negotiation can be pinned
  (measure)."
- "Scope: negotiation only. Text inputs: carry focus like any token-bearing control, but preserving an unsaved draft
  across the outside redraw is OUT of scope — measure and report what happens to the draft; owner rules on a
  follow-up. Other elements with the same gap (window-less outside redraw): implementer reports which ones (cheap
  jsdom/e2e check), owner files one Backlog ticket; do not fix them here. SC-661 (menu left open across an outside
  edit) and SC-641 are not ours: an open options menu across an outside edit is out of scope."

SC-650 reviewer's design hint (from the ledger): record the focused control's token while focus is still inside the
card (a focusin/focusout tracker on the root), because in Reading view the old root is already detached at unload, so
`document.activeElement` is BODY by then.

Must stay intact: SC-642 (Complete Argument → first Motivation chip etc.), SC-639 (Reset → ⋮ button), SC-640, the
own-write paths (an own write must never trigger this hand-off in a way that changes where SC-639/SC-642 put focus),
initiative and montage window hand-off (SC-608/SC-650: jest `initiative-outside-edit*`, montage OW*, e2e INIT-W*,
MONT-OW*).

**Shared-file note:** another owner (SC-662, pinned sidebar loses pending saves on an outside change) is in flight
and may edit `windowHandoff.ts` and the sidebar files. Keep your `windowHandoff.ts` change minimal and additive
(a new exported entry point beats reshaping existing ones). List every shared file you touched in the report.

Tests:
- jsdom tests for: focus kept on the same control after an outside redraw (several control kinds: a button, a chip, a
  tab, the Lie box or a text field if token-bearing); fallback (a) — control gone/disabled; (b) — slot count changed;
  (c) — user moved focus; no hand-off when focus was outside the card; own write unchanged. Show they are RED on
  `42c26272` (revert the src change, run, restore) and record which.
- e2e in `e2e/specs/negotiation/`: Reading view and Live Preview, focus on a button (e.g. Complete Argument) and one
  other control, outside edit via `dse.externalEdit`, then assert `document.activeElement` is the same control in the
  redrawn card (by its label/control id) and the note keeps the outside edit. Also: focus outside the card → not
  pulled in. Test titles carry scenario ids only — **never put a bracketed ticket id in a test title**; scenario ids
  are global, pick unused ones (grep the whole `e2e/` tree). If the coverage map needs a pair, add it.
- A lifecycle scenario only if a behaviour can't be shown in e2e; if you add one it is `G-S147`, in part 7
  (`G-S108,G-S112,G-S115,G-S147`), keep `G-S56` LAST in SCENARIOS order.
- Run 2–4 mutants on the new logic (e.g. never hand off; always hand off even when focus was outside; skip the
  user-moved cancel; skip the count guard) and record red/green.
- Survey for the follow-up ticket: which other elements (initiative, montage, stamina bar, counter, …) drop focus to
  BODY on a window-less outside redraw while one of their controls has focus. A quick e2e/jsdom check per element is
  enough; do not fix them.

Commit after every coherent step in the dse branch (`git -C <abs path>` for every git command, never `cd X; git …`).
Do NOT push. Do NOT touch the superproject (no pointer bump, no CHANGELOG) — the owner does that later.
Update `draw-steel-elements/.repo-docs/architecture.md` (the windowHandoff row) if its description changes.

## 3. Gates (dse-verify battery, all in your worktree)

tsc clean · lint clean · jest (expect 13447 + your new tests passed / 2 skipped on a fresh worktree; 13448 + N / 1
skipped once shots has run) · lifecycle 64/64 (65/65 if you add G-S147) in SEVEN parts, `--only=` WITH the equals
sign (with a space the runner runs the whole suite), one part per Bash call:
  1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4) 7. `G-S108,G-S112,G-S115` (3) — take parts 1 and 2's exact id lists from dse-verify.
  Ids are comma-separated. Part 7 takes ~200 s, over the 180 s Bash auto-background limit: start it with output to a
  unique log + rc file and POLL that log/rc file (never wait for a background-completion notice).
· e2e `622+N/631+N ok, 0 failed, 9 known-bug, coverage: P/P pairs` (P = 417 + any new pairs) · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 (LAST).

Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) suspected flake
(SC-633): re-run part 7 once on a loaded host; any other failure is real. INIT-W10 (SC-654), SET-X03 / SET-X04
(SC-657) and NEGO-R05 (suspected) e2e flake under load; a re-run passes. SC-622: the Obsidian camera can leave
`demo-vault/.obsidian/appearance.json` dirty in YOUR worktree, which fails G-S97 —
`git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change. Jest default
timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise. Tests whose verdict depends on
time use fake timers and LITERAL gaps, never the product constant.

## 4. Footguns (each cost real time once)

- Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; never `cd` inside a compound command; devbox eats
  `$?`/`$PIPESTATUS` and `| tail` hides failures — record exit codes inside the script file and read each gate's
  summary line.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r1-<your agent id>/`
  with uniquely named scripts and logs. Use the Write tool for scratch files (no heredocs).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and no `rm` with a variable target
  anywhere** — it hangs on a permission prompt nobody answers. Leave throwaway files in place; overwrite with `>`.
  Never glob-delete `/tmp/dse-obsidian-lifecycle-*` or similar. Never `rm -rf` `.superpowers/`.
  (The dse-verify `rm -f main.js styles.css` before jest: use the literal absolute paths in your plugin dir.)
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.
- Run each gate as one blocking foreground call where it fits under ~170 s; for longer ones, log to a unique file
  and poll the log/rc file. Never key a wait-loop on a scratch filename or its contents from another run — write to a
  per-run unique path. Redirect long output to files rather than streaming it (the 600 s stream watchdog kills silent
  agents).
- Never push anything to origin, not even the feature branch.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot reach its parent, and `to: "main"` goes to the dispatcher. If
  you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume
  you. If you ever send a message anyway, its FIRST WORD must be `SC-656:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/sc656-r1-impl-report.md`.
Open with a ≤10-line executive summary. Then: commits (sha + one line each), design (what you reused/added in
windowHandoff.ts; how the window-less trigger records the token; RV vs LP vs sidebar findings incl. what LP did before
your change), fallback table, text-input draft finding, other-elements survey table, red-on-base list, mutants, each
gate's measured summary line, shared files touched, `Drive-by fixes:` and `Follow-ups:` lists, and the path of every
log.

## 6. Return contract

Final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch head sha, base sha, measured gate
numbers, red-on-base counts, follow-ups, and the absolute path of the report and every evidence log. No prose.
