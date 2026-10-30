# SC-518 r1 brief — implement the focus handoff after a block edit form Save (implementer)

## 1. Context loading
- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/decisions.md` (current state, ticket text quoted verbatim).
- Background (read the executive summaries, then only the parts you need):
  - SC-509 (the change that caused this): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh-ledger.md` and `.../build-ledgers/sc509-form-save-refresh/sc509-r3-review-report.md` (LOW-1 at "### LOW-1"; the reviewer's real-Obsidian probe method in §0).
  - Focus-restore precedent: `.../build-ledgers/sc505-collapse-pin-focus-ledger.md` + `sc505-collapse-pin-focus/sc505-r1-impl-report.md` (focus moves to the replacement control after a re-render, keyboard ring shown, mouse unchanged), and `.../build-ledgers/sc465-heal-focus-ledger.md` + `sc465-heal-focus/sc465-r1-impl-report.md`. Reuse their helpers/patterns where they fit; do not invent a second mechanism if one exists.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the whole battery, command shapes, the CURRENT block) and the plugin's `AGENTS.md` at `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements/AGENTS.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus`, plugin `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements`, branch `sc518-form-save-focus`. First: `git -C <plugin abs path> fetch origin`, then `git -C <plugin abs path> rebase origin/develop`; expected base `c558759` (if origin/develop has moved, rebase onto it and record the new base sha). Verify `git -C <abs> log --oneline -1` and `git -C <abs> branch --show-current` before any write. If `package.json`'s obsidian version changed in the rebase, run `npm ci` first. A fresh worktree needs `npm ci` before any gate anyway if `node_modules` is absent.
- The workspace-level files (CHANGELOG.md etc.) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. The only thing you write under `workspace/` is your report and evidence in the ledger dir.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours.

## 2. The task
Ticket (verbatim): "Repro: Tab to a card's pencil, press Enter, change a field, press Save." "What happens: focus lands on `<body>`. Before SC-509 it went back to the pencil." "Why: SC-509 makes Save redraw the card, so the old root that held the pencil is detached. `FormModal`'s close returns focus to that detached opener (`src/authoring/FormModal.ts` ~464-465; the write is in `src/framework/host/ReadingModeBlockHost.ts` ~578)." "Expected: after Save, focus goes to the redrawn card's pencil (or the card), the same as SC-465/SC-495 do for disabled controls."

Reviewer's prescribed direction (SC-509 r3 LOW-1, a suggestion, not a contract): "after a non-view write's rebuild, put focus back on the re-mounted card. For example, FormModal records the block key and its opener before closing, and the pipeline's mount focuses that key's root or pencil once if a pending restore hint matches."

Owner's spec:
1. **Measure first, on c558759, in real Obsidian** (lifecycle harness or a scratch scenario, real keyboard): where does focus land after a keyboard Save in (a) Reading view, (b) the sidebar panel, (c) Live Preview? Also record the mouse Save outcome in Reading view. Record the numbers in the report before changing code.
2. **Fix wherever focus is lost** among those three surfaces: after a form Save that redraws the card, focus goes to the **redrawn card's control that opened the form** (the pencil; for the hero "Edit definition" path at `src/elements/hero/view.ts` ~257, the matching control if it opens the same form — say what you found), falling back to the redrawn card's pencil, then the card. One mechanism for every surface and element, not per-element code.
   - Keyboard-opened form: the focus ring must show on the restored control (as SC-505 did). Mouse: match what base did before SC-509 (focus returned to the pencil via Obsidian's modal close) — no new ring forced on a mouse user.
   - The hint is one-shot and scoped to that block: a later redraw (outside edit, another block, another note, a re-open of the note) must never steal focus. If the redraw does not happen (e.g. the note closed, the write failed), the hint must expire harmlessly. Two same-kind blocks in one note: focus goes to the edited one, never its twin.
   - Cancel / Escape / Save with no write: behaviour unchanged (focus returns to the pencil as today) — pin with a test.
   - The block's content and the rest of the note are untouched (this is a focus-only change; nothing new writes into user files).
   - `FormModal.ts` and `pipeline.ts` may change if needed (SC-494 has landed). Keep the diff small. Comments at each changed site name SC-518 and say why.
   - If a surface cannot be fixed with the shared mechanism at reasonable cost (likely candidate: Live Preview, where CodeMirror owns the rebuild), fix the others and list it under Follow-ups with the measured behaviour — do not build a second mechanism without asking (STATUS: NEEDS_CONTEXT).
3. **Tests**, red commit FIRST (verify red against c558759 source), then the fix:
   - Jest: through the registered processor with the real pencil, real FormModal and real Save, then the rebuild: `document.activeElement` is the new root's pencil (inside the fresh root, not the detached one). Cases: at least montage and stamina-bar in Reading view, the sidebar panel, the twin case (two same-kind blocks), the one-shot case (a second unrelated redraw does not move focus), and Cancel unchanged.
   - Lifecycle **G-S50** (id fixed by the dispatcher): in real Obsidian, real keyboard — focus the pencil, Enter, change a field, activate Save by keyboard — wait for the redraw, assert `document.activeElement` is the redrawn card's pencil and that the old root is detached; check `:focus-visible` on it; a Cancel control; the sidebar phase (and Live Preview if fixed); the whole note equals the fixture with only the edited value changed (`t.read(rel) === FIXTURES[rel].replace(old, new)` or `t.integrity(rel).ok`); no Notice, no console errors. Prove it FAILS against a c558759 bundle (`DSE_LIFECYCLE_BUNDLE`) and passes on yours (record both). Lifecycle 39 → 40.
4. **Docs**: one bullet under `## Unreleased` in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/CHANGELOG.md`, user-facing, e.g. "Block edit form (experimental authoring controls): after Save, keyboard focus returns to the card's Edit button instead of jumping to the top of the page." Commit in the superproject branch; do not bump the submodule pointer. If `DESIGN.md` (worktree superproject copy) documents focus behaviour for the form or the chrome, add one line; otherwise leave it.

Out of scope: SC-523 (Live Preview pending card write), SC-404 (form redesign), anything about form content or Save semantics.

## 3. Gates — full `dse-verify` battery, in its order, on your final HEAD
Expected (CURRENT at dse develop c558759): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6105 passed / 1 skipped / 247 of 248 suites** plus your new tests · lifecycle **39/39** → **40/40** with new G-S50 · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, button host-leak 114/684 · freeze **`freeze OK (280/280 …)`** (no rebaseline expected — if it moves, STOP and report, never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run (dse-verify note) — compare jest after shots. A known flake under load: the montage board mouse-wheel shots check (SC-521) and e2e RECOV-R07 (SC-517) — re-run once and report both runs if either fires.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/sc518-r1-impl-report.md`, opening with a ≤10-line executive summary. Evidence files `sc518-r1-*` in the same dir.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — STATUS, base sha, every commit sha (red test commit, fix commit, lifecycle commit, CHANGELOG commit), the measured before-fix focus outcomes per surface, each gate's measured summary line, `Drive-by fixes:` and `Follow-ups:` lists — no prose, **plus the absolute path of every evidence artifact**.

Commit after every coherent step (red test, fix, lifecycle, docs). Do not push. Do not bump the superproject's submodule pointer (landing does that).

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Use only a private subfolder `.../scratchpad/sc518-r1-impl-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate as ONE blocking foreground Bash call (timeout up to 600000 ms); lifecycle, e2e and shots are separate calls. No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc518-form-save-focus/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `$?` is eaten by devbox's wrapper: record exit codes from a script file (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Every git command: `git -C <absolute path>`. Never `cd X; git …`.
- No `rm` whose target is a shell variable or a glob (it hangs on an unanswered prompt). Use fresh uniquely named files, overwrite with `>`, or literal absolute paths. Never `rm -rf` any shared `/tmp/*` glob (other efforts' lifecycle vaults live there) or anything under `.superpowers/` except your own `sc518-*` files.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc518-form-save-focus/` or whose `readlink /proc/<pid>/cwd` is inside that worktree.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-518:`.
