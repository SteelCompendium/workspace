# SC-588 r2 — independent adversarial review brief

You are an independent reviewer. You did not write this code. Execute and probe — do not just read.

## 1. Context loading

- Ledger (current-state rulings, overrides everything): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/decisions.md`
- Implementer's report (read its executive summary, then what you need): `.../sc588-initiative-focus-after-rebuild/sc588-r1-impl-report.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc588-initiative-focus-after-rebuild`, plugin at `.../draw-steel-elements`,
  branch `sc588-initiative-focus-after-rebuild`, base dse `develop` @ `79da77f8` (SC-592 landed; supersedes `4f0c87f2`). Diff: `git -C <plugin> diff 79da77f8..HEAD`.
  `git -C <plugin> fetch origin` and confirm `origin/develop`; report if it moved.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~320 KB; read lines ~20-217 and the top CURRENT entry; grep the rest).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/` — sc518 (same fix shape), sc505/sc511 (focus handoff), sc437 (initiative e2e; ZZ-F1..F3 real-Obsidian repro probes), sc578 (known-bug → plain e2e precedent).
- **You never call the tracker (Linear).** You do not edit the branch — you review it. Scratch probes go in your private scratch folder only.

## 2. What to review (spec and rulings, verbatim from the ledger)

> Any initiative action that rebuilds the whole tracker leaves keyboard focus on the page body. A keyboard user who presses Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, or Enter in the Malice quick-add box has to Tab back in from the top of the note.
>
> Cause: the tracker's actions call a full rebuild (`src/elements/initiative/view.ts:163-170` → `src/framework/view.ts:217-226`), which replaces the focused node without restoring focus. Fix shape from SC-518: remember the focused control's `data-dse-control` id (and instance key) before the rebuild and refocus its successor after.

> - Scope is the five actions named in the spec. SC-589 (a whole-tracker rebuild loses a HALF-TYPED Malice quick-add value) is OUT of scope — do not fix it here; it is its own Backlog ticket.
> - The SC-588 known-bug marker in the e2e suite (from SC-437) must become a plain passing e2e test, and SC-588 comes off the e2e known-bug list (the SC-578 precedent: INIT-M09). Expected e2e after the fix: 0 failed, known-bug count 4 (SC-257, SC-355, SC-384, SC-580), coverage Y/Y pairs.
> - Real-Obsidian coverage goes in e2e, not lifecycle. Add a lifecycle scenario only if e2e cannot express it; if one is needed it is G-S88 in part 5 (never a new G-S64 phase — part 3 sits at the ~480 s line).
> - Where the focused control no longer exists after the rebuild (e.g. Make captain → the button becomes Relieve captain; Reset encounter → Yes from a confirm modal), focus goes to the control that replaced it in the same place; if nothing sensible exists, the tracker's own focusable root — never the page body. Implementer documents the mapping per action in its report.

Probe at least:
- All five actions in real Obsidian (e2e), focus lands on the documented successor — not body, not a detached node.
- Focus theft: a rebuild NOT started from inside the tracker (mouse click elsewhere, a file-change re-render, the
  same tracker open in the sidebar AND the note, two trackers in one note, a second pane) must not move focus.
- Two trackers / sidebar twin: the restore targets the right instance (instance key), not the first match.
- Reset encounter → Yes: the DseModal's own focus return vs the rebuild — final resting place, and Cancel/Escape still return focus as before.
- Hover-preview (`.hover-popover`) and reading vs live-preview mode: no regression (SC-595 territory).
- Tests are not vacuous: revert the src change locally (in a scratch copy or `git stash` that you restore) and confirm the new jest tests and the converted e2e test go red; restore and confirm green. Leave the branch exactly as you found it — check `git status` and HEAD at the end.
- The implementer's claim that a mouse click moves no focus in real Obsidian reading view (so nothing is handed back). Check live preview too, and a click while focus was already inside the tracker from an earlier keyboard press.
- The new tracker-root fallback (`tabindex=-1` on the root): confirm it does not add a Tab stop, does not change screenshots (styles.css is byte-identical, but DOM attributes can move parity/host-leak), and does not get a visible focus ring in a way that changes frozen captures.
- Implementer follow-up to CONFIRM OR REFUTE (do not fix): "Other `rebuildAndPersist` callers that go through modals (squad-pool and grid edits) are not handled if the modal returns focus to a detached node." Probe one squad-pool edit and one grid edit by keyboard in real Obsidian (or the e2e harness) and say where focus lands. I will rule on a Backlog ticket from your answer.
- Branch state: dse HEAD `d62803db` on top of `79da77f8` (fix `40f760f9`); superproject commit `9dd7cbf8` (CHANGELOG only). Check both changelog entries read as user-facing and match the SC-592/SC-595 style.
- Re-run the battery yourself: tsc, lint, jest, e2e, and lifecycle (five parts). Shots/freeze/parity only if `styles.css` differs from a clean `79da77f8` build.

Expected numbers at base `79da77f8`: jest about 7261 passed / 2 skipped (fresh worktree; 7262/1 with css cached) plus the
new tests · lifecycle 55/55 in five `--only` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16;
`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4, G-S56 LAST;
`G-S59 G-S49 G-S73 G-S77 G-S83` 5) · e2e base `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, expected after
the fix 0 failed / 4 known-bug / Y/Y · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## 3. Footguns

- Devbox: `devbox run -c <abs plugin path> -- bash <script file>`; never trust echoed `$?` in `bash -c`; never pipe a gate.
- `git -C <absolute path>` for every git command; never `cd` in a compound command.
- `rm -f main.js styles.css` in the plugin root before `npx jest`. On a timeout-shaped jest red, check `/proc/loadavg` and re-run the suite alone.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc588-r2-review/`, uniquely named files, written with the Write tool.
- **Never `rm -rf` a glob, never `rm` a `/tmp` glob** (a worker did this today and wiped other efforts' lifecycle FAIL dirs), no `rm` with a shell-variable target. Delete only literal paths you created.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd/cmdline is inside this worktree.
- Each gate is one blocking FOREGROUND call; no `run_in_background`, no Monitor. Redirect output to a file and read the file.
- Never key a wait-loop on a scratch filename or its contents.
- Never put a bracketed ticket id in an e2e test title.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its first word must be `SC-588:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc588-initiative-focus-after-rebuild/sc588-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX, finding counts by severity, measured gate numbers).
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, and a prescribed fix.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: verdict, sha reviewed, findings list (severity, file:line, one line each),
measured gate numbers, and the absolute path of every artifact.
