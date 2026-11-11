# SC-572 r1 implementer brief — minion pool modal condition icons become real buttons

You are the r1 implementer for SC-572. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/decisions.md`.
- Worktree (ALL edits here, verify `pwd`/paths before any write):
  `/home/scott/code/steelCompendium/worktrees/sc572-pool-modal-condition-keyboard`
  — plugin at `.../draw-steel-elements`, branch `sc572-pool-modal-condition-keyboard`, base dse
  `develop` @ `97a9c93b`. First: `git -C <plugin abs path> fetch origin` and confirm
  `origin/develop` is still `97a9c93b`; if it moved, `git -C <plugin> rebase origin/develop` and
  report the new base sha.
- Workspace-level files (docs, `.claude/skills/...`) for this effort live in YOUR worktree's
  superproject `/home/scott/code/steelCompendium/worktrees/sc572-pool-modal-condition-keyboard/`
  — never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir below). You
  should not need to edit any workspace-level file this round.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery,
  command shapes, freeze rules) before running any gate.
- Read the plugin's `AGENTS.md`/`CLAUDE.md` if present.
- **You never call the tracker (Linear)** — not to read, not to post.

## 2. Task

Ticket spec (quoted from the ledger):

> In the minion pool modal, each condition icon is a plain clickable element with no keyboard
> focus, no button role and no accessible name. Keyboard and screen-reader users cannot remove a
> condition from the modal. The initiative tracker's own condition icons are real buttons, so the
> modal is the odd one out.
>
> **Expected:** each condition icon is a focusable button named for its condition ("Remove
> Bleeding"), activated by Enter and Space.
>
> Agent notes: `src/views/MinionStaminaPoolModal.ts:556-579`, dse develop 6270e84a. SC-435 carries
> a `test.failing` marker citing this ticket; flip it to a plain test when fixing.

Owner ruling (quoted from the ledger):

> Match the initiative tracker's existing condition-icon button model (element, classes, focus
> ring, naming) rather than inventing a new look; that keeps this a bug fix with no new
> user-visible design choice, so no Scott ask is needed unless the freeze moves or the tracker's
> model cannot be reused.

Steps:
1. Find how the initiative tracker renders its condition icons as buttons (element, classes,
   `aria-label` wording, click handling, focus-visible styling). Reuse that model in
   `src/views/MinionStaminaPoolModal.ts` (~556-579). Prefer a native `<button type="button">`
   (Enter and Space come free) over a div with role/tabindex. The accessible name must be
   "Remove <Condition name>" (e.g. "Remove Bleeding") unless the tracker already uses a different
   wording — if so, report both and which you chose. Keep the existing `data-dse-control` id
   on the node. Mouse click behaviour must be unchanged.
2. Make sure the modal's visual look in its resting state does not change (a `<button>` brings UA /
   Obsidian button chrome — strip it the way the tracker does). If you cannot keep the resting
   look byte-identical, stop and report (see freeze below).
3. Tests:
   - e2e `e2e/specs/minion-pool/pool-conditions.e2e.ts:51-55`: the `knownBug('SC-572', '[POOL-C04] …')`
     marker becomes a plain test (keep the scenario id; drop the SC-572 comment block). Add Space
     coverage too (Enter and Space each remove the focused condition) — either within POOL-C04 or a
     new `[POOL-Cnn]` id that is unique repo-wide (grep first; duplicate ids make the runner exit 2).
   - jsdom `test/dom/views/minion-stamina-pool-modal-matrix.test.ts`: flip its SC-572 marker to a
     plain test; assert element is a button (or role=button + tabindex=0), accessible name
     "Remove <name>", and that Enter and Space activation removes the condition while a non-activation
     key does not.
   - Grep the whole plugin for any other `SC-572` reference and resolve it.
   - Do not touch markers for SC-566, SC-567, SC-573, SC-574 (same modal, out of scope) or any other
     ticket's marker.
4. Commit after every coherent step (inside the plugin, on the branch). Do not push. Do not tag
   (never create a tag or release on draw-steel-elements).

## 3. Gates (dse-verify battery, in order; expected numbers)

Baseline at 97a9c93b: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest 7050 passed /
1 skipped (worktree WITH the shots CSS cache — on a fresh worktree expect one fewer passed and 2
skipped until shots has run; SC-568 load timeouts possible, re-run that suite alone and report) ·
lifecycle 52/52 · e2e `OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`
· shots 592, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)` · freeze
`freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

Expected after the fix: e2e `250/260 ok` (or more if you add a scenario — then N/M both grow), `0 failed`,
**10 known-bug**, coverage Y/Y with Y ≥ 161; jest passes +any new tests, still 1 skipped. Shots count 592.
The `button host-leak` numbers MAY change if the pool modal is in the shots set and now contains
<button> elements — report the before/after line verbatim and explain the delta. **Freeze must stay
280/280.** If freeze moves: do NOT touch the shared baseline; write
`.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-rebaseline.txt` (ready-to-apply hash lines)
plus before/after crops in the ledger dir, and report it.

Lifecycle runs in FIVE separate `--only` calls, each its own foreground Bash call:
- `G-S7a … G-S9a` (21) ; `G-S9b … G-S40` (16) ; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9) ;
  `G-S57 G-S62 G-S61 G-S56` (4) ; `G-S59 G-S49` (2). Take the exact id lists for parts 1-2 from dse-verify.
  G-S56 stays LAST in SCENARIOS order. Never set DSE_LIFECYCLE_PORT. You likely do not need a new
  lifecycle scenario; if you do, your id is G-S75.

## 4. Footguns (all binding)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs plugin path> -- <cmd>` for every gate.
- Exit codes: devbox's sh wrapper eats `$?`; record codes via a script FILE run with
  `devbox run -c <path> -- bash <script>`, and read each gate's summary line. Never pipe a gate into `tail`.
- One gate per Bash call, in the foreground, no `run_in_background`, no Monitor — EXCEPT shots, which
  may run in the background with output redirected to a per-run unique log; then poll that log's own
  final summary line (never wait for a notification — it will not come).
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Give each lifecycle/e2e/shots run a private `DSE_CAMERA_TMP` under your scratch folder.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r1-impl-<yourAgentId>/`
  — uniquely named scripts and logs inside it. The scratchpad is shared by every agent.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output,
  or write to a per-run unique path.
- Never `rm` with a shell-variable target; never a glob `rm` under /tmp; never `rm -rf` `.superpowers/`.
  Delete only literal paths you created.
- Kill scratch processes by literal PID only, and only PIDs proven yours (`pgrep -af "worktrees/sc572-pool-modal-condition-keyboard/"`
  or `readlink /proc/<pid>/cwd` inside your worktree). Never pkill/killall by pattern — SC-480 and SC-576
  run the same gates concurrently.
- `npm ci` if `package.json`'s obsidian version changed after a rebase.
- The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`)
  is Scott's and expected — ignore it, never touch it.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the
  dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question.
  If you ever do send a message anyway, its FIRST WORD must be `SC-572:`.
- Report extras as `Drive-by fixes:` (made; obviously correct, local, gate-neutral) and `Follow-ups:` (left alone).

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-r1-implementer-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, branch head sha, base sha, every gate's measured
summary line). Body: what the tracker's model is (file:line), what you changed (file:line), the accessible
name wording, the host-leak delta explanation, freeze result, Drive-by fixes, Follow-ups.

## 6. Return contract

Final text: raw facts only — STATUS (DONE / BLOCKED / NEEDS_CONTEXT), branch head sha, base sha, each gate's
measured summary line, and the absolute path of every evidence artifact (report, logs, any crops/rebaseline).
No prose.
