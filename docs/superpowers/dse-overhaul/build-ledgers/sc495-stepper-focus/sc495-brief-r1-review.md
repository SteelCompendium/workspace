# SC-495 r1 — independent review brief: kit stepper focus at its bounds

You are the independent reviewer. You did not write this code. Your final text goes to the SC-495 ticket-owner, not a human.

## 1. Context loading

- Ledger (current-state truth): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/decisions.md`.
- What was asked: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-brief-r1-impl.md`.
- What was done: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r1-impl-report.md` (read its executive summary, then whatever you need).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc495-stepper-focus`, branch `sc495-stepper-focus`. dse head to review: `247bd27` (commits c1f65e0, 247bd27) on base `9f08f06` (origin/develop). Superproject CHANGELOG commit: `64464bf` on origin/main `6a176e6`. Verify the shas with `git -C` before starting; if HEAD differs, stop and report.
- **You never call the tracker (Linear).**
- Do NOT commit to the branch. Probe edits (mutations, temporary bundle variants) must be reverted, and the tree must be clean when you finish (`git -C <dse path> status --porcelain` empty). Work on mutations in a scratch copy if easier (`git worktree add` into your private scratch subfolder, absolute path; remove it with `git worktree remove` when done).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected.

## 2. The task — execute and probe, do not just read

The rule the code must implement is the ledger's "FOCUS TARGET RULE" (2026-10-23); quote it back against the code. Probe at least:

1. **Correctness of the rule** in real Obsidian (write your own throwaway e2e or lifecycle probe if needed, do not commit it): "−" to min and "+" to max on an editable and a read-only stepper; keyboard (Enter, Space) and pointer; HELD Enter (auto-repeat) on "−" must not bounce the value; Shift+Tab and Tab from the new focus target; min===max.
2. **Redraw / adoption.** An in-note stepper whose press writes the note: after the write and redraw, is focus still inside the stepper? Also the non-adopted path (an external edit causes a fresh rebuild) — what happens, and is it worse than base?
3. **No spurious writes.** Focus landing in the editable input and leaving it again must not write the note. Check the note bytes.
4. **Tab order unchanged** on every surface that uses a read-only stepper: the value node must not become a tab stop. Spot-check 2-3 surfaces from the implementer's call-site list.
5. **Ring.** Keyboard → visible ring on the focus target; pointer → no ring. If CSS was added, view the relevant shot(s) yourself and check it uses an existing token; check a `renderValue` stepper.
6. **Tests are not vacuous.** Mutate the fix (e.g. drop the activeElement check, focus the opposite button, drop `tabindex="-1"`, drop `preventScroll`) and confirm the new jest/e2e tests go red. Report which mutation each test catches.
7. **Scope.** Diff touches only the kit stepper, its tests, e2e/lifecycle, manifest, CHANGELOG (and any minimal CSS). Nothing in SC-492 (stamina bar pencil) or SC-489 (FormModal) areas; SC-465's `focusNeighbourStop` untouched.
8. **Owner question — read-only path in real Obsidian.** The implementer's e2e covers editable steppers (Stamina modal, in-note ds-counter) but no bounded READ-ONLY stepper (Malice is unbounded; the roll element did not render in the e2e vault). Find a shipped surface with a bounded read-only stepper (check the implementer's call-site list), drive it to its bound with real keys in real Obsidian (throwaway probe), and report: (a) does it behave per the rule, (b) could the e2e harness drive it as a committed test (name the surface and what it needs). Also: the ds-counter e2e added a `control: 'counter'` stamp in `src/elements/counter/view.ts` and a manifest — confirm that changes no rendered DOM other than `data-dse-control` attributes and no frozen shot.
9. **Owner-verified numbers (implementer's, on 247bd27):** jest 5859/1/241 of 242; lifecycle 34/34; e2e 112/112 ok, 0 failed, 0 known-bug, 73/73 pairs; shots 592; freeze 280/280; parity 0/0/24. CSS added: `.dse-stepper__value:focus-visible` in `styles-source.css`.
10. Re-run the gates you need to trust the numbers: at least tsc, lint, jest, e2e (full run). Lifecycle too if G-S35 was added or redraw behaviour changed. Shots + freeze if CSS changed.

Expected numbers (CURRENT at dse develop `9f08f06`, after SC-492): jest 5847 passed / 1 skipped / 241 of 242 suites + new; lifecycle 34/34 (35/35 with G-S35); e2e 108/108 ok, 0 failed, 0 known-bug, coverage 69/69 pairs + new tests (coverage Y/Y); shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED. Gate command shapes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r1-review-report.md`. OPEN with a ≤10-line executive summary: verdict (APPROVE / APPROVE_WITH_FIXES / REQUEST_CHANGES), counts by severity, measured gate numbers. Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, a failure scenario, and a prescribed fix. Then the probe log and mutation table.

If the report-file write is blocked by your harness, return the report inline.

## 4. Return contract

Raw facts, no prose: verdict, severity counts, shas reviewed, measured gate numbers, absolute paths of every evidence artifact (report, logs, screenshots, failure bundles).

## 5. Footguns (mandatory)

- **Devbox.** `devbox run -c /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/draw-steel-elements -- bash <script-file>`. Never a compound `cd X && devbox run …`; never `cd` inside a compound command. `git -C <absolute path>` for every git command.
- **Exit codes.** Devbox's sh wrapper eats `$?`; `bash -c '…; echo rc=$?'` always records 0. Put each gate in a script FILE that redirects output to a log and writes its own exit code; read the gate's summary line from the log. Never pipe a gate into `tail`.
- **Scratch.** The session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Use a private subfolder `sc495-r1-review-<your agentId or a random suffix>/` with uniquely named scripts and logs. Create files with the Write tool, not heredocs.
- **No glob `rm`, ever.** Delete only paths you created and recorded. Never `rm -rf` anything under `.superpowers/`.
- **One blocking gate per Bash call, in the foreground.** No `run_in_background`, no `Monitor`. Lifecycle / e2e / shots in separate calls, `timeout: 600000`. Redirect output to a log.
- **Never key a wait-loop on a scratch filename or its contents.**
- **Killing processes:** never `pkill`/`killall` by pattern; kill only by PID whose command line contains `worktrees/sc495-stepper-focus/` (or your scratch worktree path) or whose `/proc/<pid>/cwd` is inside it.
- **Lifecycle port:** set your own `DSE_LIFECYCLE_PORT` (e.g. 9297).
- **You cannot `SendMessage` me.** If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the FIRST WORD must be `SC-495:`.
- Never push, tag, deploy, or run `just wt-finish`.
