# SC-511 r1 independent review brief — keyboard Unpin from sidebar focus hand-off

You are SC-511 reviewer B. You did not write this code. Your final text goes to the SC-511 ticket-owner, not a human.

## 1. Context loading

- Ledger (source of truth): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/decisions.md`.
- The implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/sc511-r1-impl-report.md` (read its summary; verify its claims yourself — do not trust them).
- Precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc505-collapse-pin-focus-ledger.md`; `src/framework/chrome/focusHandoff.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus` (branch `sc511-sidebar-unpin-focus` in every submodule). Plugin: `.../draw-steel-elements`. Diff: `git -C <plugin> log --oneline origin/develop..HEAD` and `git -C <plugin> diff origin/develop...HEAD`; superproject CHANGELOG commit likewise against `origin/main`. `git fetch origin` in each first; report the shas you reviewed.
- Do not commit to the branch. Probes you write live in your private scratch folder (below) or in a throwaway copy; if you must add a temporary test inside the worktree to probe, revert it before you finish and confirm `git status` is clean.
- **Workers never call the tracker** (Linear).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore it. Never write under `/home/scott/code/steelCompendium/workspace/` except the ledger dir.

## 2. The task — execute and probe, not just read

The rule under review, verbatim from the ledger:

> - 2026-11-02: FOCUS RULE (SC-505's rule, applied to removal):
>   - Applies only to a KEYBOARD activation (`isKeyboardClick(evt)`, i.e. the click has `MouseEvent.detail === 0`). A pointer click keeps today's behaviour (move nothing).
>   - After a keyboard **Unpin from sidebar**, focus goes to the **panel that now sits in the removed panel's place** (the next panel below it); if the removed panel was the last one, to the **panel above it**; if no panel is left, to the sidebar's **"No pinned blocks" empty-state message** (made focusable with `tabindex="-1"` only, so it is not a Tab stop).
>   - Inside the chosen panel, focus its **header note link** (`.dse-sidebar__panel-note`, the panel's first, always-visible control). If that link is missing, the panel's first focusable control; never a hover-hidden control that cannot show a ring.
>   - Every move uses `HANDOFF_FOCUS` (`{ preventScroll: true, focusVisible: true }`). Never `<body>`, never a control outside the sidebar leaf the press came from.
>   - Only move focus when it was inside the removed panel at the press (or has fallen to body/null) — never steal focus the user has already moved elsewhere.
>   - FOLDED in: the degrade card's **"Remove panel"** button uses the same removal path (`onRemoveRequested`) and gets the same keyboard rule.

Probe at least:
1. Real Obsidian, real keys: 3 pinned panels; keyboard Unpin on middle / bottom / only panel; where does `document.activeElement` land, does it show a focus ring, and does it STAY there for ~2 s (a later re-render, layout save, or anchor re-check discarding the focused link = finding).
2. Pointer Unpin (real click, `detail >= 1`): focus identical to base `origin/develop`.
3. Focus already elsewhere at removal (e.g. a programmatic/anchor-lost removal via `removePanel` from the vault-delete or stale-anchor path, not a user press): must not steal focus. Check every `removePanel` caller.
4. Two sidebar leaves / the same panel state in two places (if possible): focus never leaves the leaf the press came from.
5. Degrade card "Remove panel" with the keyboard.
6. The empty-state message: `tabindex="-1"`, not a Tab stop, no visible style change in any gate screenshot; is it re-created on every `updateEmptyState` and does the attribute survive?
7. Tests: are the new tests real? Neutralise the hand-off and confirm they fail. Is the e2e/G-S63 choice justified, and does the coverage gate count the new pairs?
7b. The focus ring (owner ruling 2026-11-02, ledger last r1 entry, read it verbatim): `.dse-sidebar__panel-note:focus-visible` and `.dse-sidebar__empty:focus-visible` must JOIN the kit's one shared `:focus-visible` rule as extra arms — no new tokens/colours/rule of their own. Verify: the ring is really visible (computed style + a look at the implementer's crop) in light and dark; the arm does not widen the shared rule to anything else; a mouse click on the note link shows no forced ring; shots/freeze/parity unchanged.
8. Scope: the pipeline.ts change is minimal (SC-540 is editing that file concurrently); mountChrome.ts untouched or justified (parked SC-520 owns it); no styling change.

Re-run the battery yourself (the `dse-verify` skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`). Expected at base `423e798d` plus this branch: tsc + lint clean; jest **6272 + new / 1 / 250 (or 251 with a new suite) of 251(+1)** (after a shots run); lifecycle **46/46** (47/47 with G-S63) as THREE `--only` parts, one per tool call, G-S56 last; e2e **124+new / …, 0 failed, 0 known-bug, coverage 87+new / 87+new pairs**; shots **592** 0 FAIL, button host-leak 161/966; freeze **280/280**; parity **0 GAPs / 0 undeclared / 24 DECLARED**, last. Compare against the implementer's claimed numbers.

Command footguns (project adapter §8 — obey all):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `git -C <abs path>` for every git command.
- Exit codes from a script FILE run through devbox; `bash -c '…; echo rc=$?'` under devbox always records 0. Read each gate's summary line; never pipe a gate into `tail`.
- One gate per tool call, foreground and blocking — no `run_in_background`, no Monitor. Exception: shots under load may pass 600 s — then start it writing to a unique log + rc file and poll THAT log/rc file.
- Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-review-<your agentId>/`, uniquely named scripts/logs, written with the Write tool.
- No `rm` with a shell-variable target, no glob `rm` (never `rm -rf /tmp/dse-obsidian-lifecycle-*`), never `rm -rf` the shared `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc511-sidebar-unpin-focus/sc511-r1-review-report.md`. If the report-file write is blocked by your harness, return the report inline.

Open with a ≤10-line executive summary: verdict (LAND-READY / FIX-ROUND), shas reviewed, finding counts by severity, your measured gate numbers.

Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, failure scenario, and prescribed fix. Then the probe results table.

## 4. Return contract

Final text: raw facts only — verdict, shas, finding counts, measured gate numbers, absolute paths of every evidence artifact. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-511:`.
