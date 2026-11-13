# SC-608 r1 — survey (reviewer, NO commits)

Your final text goes to the ticket-owner, not a human: raw facts, no prose padding.

## Context loading

- Ledger (read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/decisions.md`
- Prior-art ledgers: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc603-focus-after-pool-apply-ledger.md` (and its dir `sc603-focus-after-pool-apply/`, esp. `sc603-r2-review-report.md` INFO-3), `sc552-twin-form-after-click-ledger.md` (the "K" keep-open mechanism for block edit forms).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window`, dse at `draw-steel-elements/` on branch `sc608-outside-edit-tracker-window` @ `622b0904` (= origin/develop). Verify with `git -C <abs path> rev-parse HEAD` before anything. Do NOT commit; this round changes no tracked file. Throwaway probes go in your private scratch dir (below) or are reverted before you finish (`git -C <abs> status` clean at the end).
- **You never call the tracker (Linear)** — not to read, not to post.
- Gates/harness reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈340 KB — read only the parts you need: "The battery, in order", "Lifecycle and e2e notes (SC-480)", "THE exit-code footgun", devbox wrapping). Adapter footguns: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8.

## The question this round answers

Ticket SC-608: when the note is changed from outside (another pane, a sync, a hand edit) while a window opened from the initiative tracker is open (minion Stamina pool, creature Stamina, Conditions, and any other tracker window you find), the tracker reloads, the window closes, and keyboard focus falls to the page body. SC-603's `openModal` (`src/elements/initiative/view.ts` ~231) restore skips because the view is unloading.

The ticket leaves the behaviour open: "Decide whether the modal should survive the reload, or the new view should take focus." Scott will decide. Your job is to give the owner the measured facts for that ask. Options to cost:

- **Option A — close + hand focus to the new view**: the window still closes on the reload; focus lands on the rebuilt tracker's replacement of the control that opened the window (same creature/instance; else the tracker's focusable root; never the body). Any half-typed input in the window is lost.
- **Option B — keep the window open across the reload**: the window stays open; its Apply/Save writes against the reloaded tracker (by creature/instance identity). Cover: what happens if the outside edit changed the same creature's value the window is editing (does Apply write an absolute value that clobbers it, or a delta?), if the creature was removed, if the note was closed/navigated away (SC-552's K closes the form then), and focus after Apply/Cancel (goes to the rebuilt opener).
- Any option C you find clearly better (e.g. keep open but show a "changed outside" notice).

## Tasks

1. Inventory every window the initiative tracker opens (`openModal(` / `new …Modal(` in `src/elements/initiative/`, and sidebar tracker paths). Per window: what state it captures at open (a snapshot of the creature? a reference to the live state object?), what its Apply/Save writes and how (absolute set, delta, full rebuild via `rebuildAndPersist`?), and whether any input is typed (lost on close) vs. toggled.
2. Reproduce today's behaviour on `622b0904` in real Obsidian for at least the pool window and the Conditions window, in Reading view and the pinned sidebar tracker: open window → outside edit (`app.vault.process`/`modify` on the note, as the e2e/lifecycle harness does) → record: does the window close? where is `document.activeElement`? Use the e2e harness (`npm run e2e` with a spec filter, or a throwaway spec in scratch not committed) or the lifecycle harness — whichever is cheaper; say which. Also record what happens in Live Preview (for the record only; LP focus is SC-602's).
3. Find the mechanism that closes the window (view unload → modal close). Is the closing tied to `Component` lifecycle (child of the view) or explicit? Can SC-552's K mechanism (block edit form kept open while the note is still shown in some markdown pane) be reused, and how much code does B need? Rough line counts per option, files touched.
4. Option A feasibility: after the reload, can the new view find the replacement control (via `controlFocus.ts` tokens) — does the SC-589 sidebar outside-refresh hand-back already do this for the sidebar? Which view (old or new) would run the restore, and when?
5. Risks per option, in one line each (data loss, clobbering an outside change, focus stealing when focus was elsewhere — e.g. the user is typing in another pane when the sync lands: Option A must NOT pull focus into the tracker then).
6. Note whether the Conditions window file overlaps SC-580's area (Conditions window type-to-search, parallel owner) — name the file(s) each option would touch.

Bound: this is a survey, not an implementation. Target ≤ ~90 min. Do not build Option B.

## Rules (footguns — obey all)

- Every git command as `git -C <absolute path> …`; never `cd X; git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window/draw-steel-elements -- <cmd>`; never `cd` inside a compound command. Devbox eats `$?`: record exit codes from a script file run through devbox, and read each run's summary line.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r1-survey/` — create it; uniquely named scripts/logs inside. Write scratch files with the Write tool, not heredocs.
- Never `rm -rf` a `/tmp` glob or any glob; no `rm` with a shell-variable target. Delete only literal paths you created, or don't delete.
- Never `pkill`/`killall` by pattern; kill only a PID you verified is yours (`readlink /proc/<pid>/cwd` inside your worktree).
- Never touch the shared `.superpowers/` dir beyond writing your report file below; never the freeze baseline.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not foreign.
- Run every harness call as ONE blocking foreground call (no `run_in_background`, no Monitor), output redirected to a log file in your scratch dir, not streamed (the 600 s stream watchdog kills silent agents). Never key a wait-loop on a scratch filename or its contents — the scratch dir has stale files from other sessions/branches.
- Never put a bracketed ticket id in a test title (the e2e runner parses titles for scenario ids).
- You cannot `SendMessage` the owner. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-608:`.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r1-survey-report.md`. It MUST open with a ≤10-line executive summary: per-window today's behaviour (closes? focus where?), cost of A and B (lines, files), the top risk of each, and your recommendation with one-line reason. Then the detail, with file:line refs. If the report-file write is blocked by your harness, return the report inline.

Final text: `STATUS: DONE|NEEDS_CONTEXT|BLOCKED`, the executive summary, and the absolute path of every artifact (report, logs, any probe spec).
