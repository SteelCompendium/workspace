# SC-512 r1 brief — implementer

You are the implementer for SC-512. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (read first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc512-roll-reset-hostleak/decisions.md` — the task, dispatcher instructions and owner rulings, verbatim. Follow them.
- Precedent (SC-501, same sweep, same file): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc501-hostleak-exemptions-ledger.md` and `.../build-ledgers/sc501-hostleak-exemptions/sc501-r2-impl-report.md` (exec summaries are enough unless you need detail).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery order, command shapes, freeze/widening rules, the CURRENT block and the "Button host-leak sweep" bullet (~line 197).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc512-roll-reset-hostleak`, branch `sc512-roll-reset-hostleak` in every submodule. The plugin is at `/home/scott/code/steelCompendium/worktrees/sc512-roll-reset-hostleak/draw-steel-elements`. Verify `pwd`/paths before any write. **Never write anything under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir** — workspace-level files for this effort live in your worktree's superproject.
- Rebase first: `git -C <plugin path> fetch origin && git -C <plugin path> rebase origin/develop`. Expected tracked sha: dse `develop` = `38f94f4`. If it has moved, rebase onto it and say so.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. The task
Ticket (verbatim): "add a gallery state where a roll strip has a changed modifier, so Reset is enabled, and confirm the sweep picks up an enabled `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` kind. This needs a gallery fixture change (`visual-harness/entry.ts`), which is why it was kept out of SC-501's `shoot.mjs`-only fix."

Dispatcher (verbatim): "harness-only, visual-harness/shoot.mjs and gallery fixtures; adding a new gallery state may add frozen print lines — if so produce a widening file per dse-verify … Never widen exemptions silently. If you add a lifecycle scenario, use G-S43."

Owner rulings (verbatim from ledger):
- "The disabled Reset (and the other disabled roll kinds) must STAY compared — the enabled kind is added, not swapped in."
- "Prefer a state reached by a REAL user interaction (click a modifier stepper), mirroring SC-501. Prefer zero new photographed shots / zero frozen-byte movement; if a new photographed state is unavoidable, ship a widening file per dse-verify (owner asks Scott)."

Notes:
- The sweep's kind key appends `|disabled` (`shoot.mjs` ~2322), so the enabled Reset will be a new key. The enabled stepper(s) you click may also produce new enabled kinds — report every new kind key.
- One way that satisfies all of the above: a second roll strip in the gallery (entry.ts fixture), with the sweep clicking a modifier stepper on THAT strip only (real click, like `openRollModifiersForSweep`, every dark/light load, never from a capture), and a loud assertion that its Reset is enabled before tagging (push a problem / FAIL, never skip). Before choosing, find out whether a new gallery fixture adds a photographed shot or changes an existing shot's bytes; if a fixture would change an existing frozen shot, find a way that does not (e.g. a fixture used only by the sweep). You choose the mechanism; justify it in the report in two or three lines.
- Keep the change to `visual-harness/` (entry.ts, shoot.mjs, fixtures). No product `src/` change. If you find you need one, stop and return STATUS: NEEDS_CONTEXT.
- Comments in code: say what and why, citing SC-512, matching the file's style.
- Commit after each coherent step in the plugin submodule (branch `sc512-roll-reset-hostleak`). Do not push. Do not touch the superproject pointer.

## 3. Gates — full dse-verify battery, in order
Run every step from dse-verify in order; expected numbers at `38f94f4` (CURRENT):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6027 passed / 1 skipped / 243 of 244 suites** (more if you add tests; say how many). Concurrent-load timeouts in settings-tab / settings-preview are a known false red — see dse-verify.
- lifecycle **36/36 ok, 0 failed**
- e2e **`OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 82/82 pairs`** (known load flake RECOV-R07, SC-517 — no retries; report it if seen)
- shots **592** PNGs, 0 FAIL (more if you add a photographed state — say which). Expected lines to change: `button host-leak OK (113 … 678 …)` → higher kind count / comparisons by exactly the new enabled kinds × 3 states × 2 schemes. The 12-record boundary must stay 12 with the same kinds (10 focus-visible disabled, 2 hover no hit point) — any new exemption record is a red unless you prove it legitimate and list it. Modal line `10 … 9 … 38 … 228` and input `164` / checkbox `60` comparison counts: report them; if they change, explain each delta. The `OBSIDIAN APP.CSS PIN DRIFT` warning is expected.
- freeze **`freeze OK (280/280 …)`**, 0 FAILED. If a new photographed capture appears, produce `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc512-roll-reset-hostleak/sc512-widening.txt` per dse-verify's widening rule (additions only) and never touch the shared baseline.
- parity LAST: **0 GAPs / 0 undeclared / 24 DECLARED**, exit 0.
- Anti-vacuity: show the new kind is real — e.g. temporarily break the click (no stepper click) and show the assertion FAILs the sweep; revert; report the failing line.

## 4. Footguns (mandatory)
- Use a private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r1-impl/` with uniquely named scripts/logs. Write scratch files with the Write tool.
- Run devbox as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc512-roll-reset-hostleak/draw-steel-elements -- bash <script file>`. Never `cd X && …` in a compound command. Use `git -C <abs path>` for every git command.
- Record exit codes from inside a script file (`echo rc=$? > <unique file>`), never from `bash -c '…; echo rc=$?'` (always 0 under devbox). Read each gate's summary line.
- **One blocking gate per Bash call, foreground, no `run_in_background`, no Monitor.** Split lifecycle / e2e / shots / parity into separate calls to stay under the 10-minute tool timeout; redirect output to a log file rather than streaming it (the 600s watchdog kills silent agents).
- **No `rm` with a shell-variable target** (`rm -f $X/...` hangs on a permission prompt). Overwrite with `>` or use fresh unique filenames. No glob `rm`. Never `rm -rf` anything under `.superpowers/` or any `/tmp/dse-obsidian-lifecycle-*` / e2e glob — delete only a literal path you created.
- **Never `pkill`/`killall` by pattern.** Kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree (shoot.mjs has no worktree path in its command line).
- Never key a wait-loop on a scratch filename or its contents — stale files from other sessions match.
- `npm ci` if `package.json`'s obsidian version changed on rebase.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, its first word must be `SC-512:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc512-roll-reset-hostleak/sc512-r1-impl-report.md`. It must open with a ≤10-line executive summary. Then: mechanism chosen and why; files changed; each new kind key; every battery step's summary line and exit code; the exact new `button host-leak OK (…)` line and the full printed boundary; anti-vacuity evidence; any widening file; `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract
Final text: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse branch head sha and base sha, measured numbers per gate, new kind keys, and the absolute path of every evidence artifact (report, logs, widening file).
