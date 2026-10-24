# SC-500 r1 implementer brief — initiative control ids

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc500-initiative-control-ids/sc500-decisions.md` (the ledger — current state; quote from it, never from memory).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc485-initiative-default-keys/sc485-r1-review-report.md` (lines ~60-75: why INIT-DEF-E01/E03/E04 press through wdio) and `sc485-r2-fix-rebase-report.md` (its `d99e54c` "e2e coverage-gate fix" commit shows how the coverage gate rejected `dse.click` on unmanifested controls).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids` (superproject branch `sc500-initiative-control-ids` @ `a094db3`); plugin at `/home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids/draw-steel-elements`, branch `sc500-initiative-control-ids` @ `054c9c5` (= origin/develop tip at dispatch). Run `git -C <plugin path> fetch origin` and confirm `origin/develop` is still `054c9c5`; if it moved, rebase onto it and say so.
- Verify `pwd`/paths before any write: every write goes under `/home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids/`. **Never** write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir. Workspace-level files (CHANGELOG.md, docs) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids/<file>`.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it, do not touch it.
- **You never call the tracker (Linear)** — not to read, not to post.
- Read the plugin's `AGENTS.md`/`CLAUDE.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` before starting.

## 2. Task

Ticket text, verbatim (from the ledger):

> **Expected:** give these controls ids (kit `control` option) and `e2e/manifest/` rows, then switch INIT-DEF-E01/E03/E04 to `dse.click`.

Controls: the Steel initiative **turn overlay**, the chrome **"Reset encounter"** item, and its **confirm button**.

Scope rule (dispatcher): **control ids + coverage only; no behaviour change.** Concretely:
1. Find how other controls get `data-dse-control` (the kit's `control` option) and give these three ids following the existing naming scheme. Read how ids are named/registered (any id registry, naming test, or manifest schema) and comply.
2. Add the matching `e2e/manifest/` rows (whatever shape existing initiative rows use).
3. Switch INIT-DEF-E01/E03/E04 in `e2e/specs/initiative/default-keys.e2e.ts` from raw wdio presses to `dse.click`. Their assertions (exact `toEqual` / `noteText` before-vs-after) stay exactly as strong — do not loosen anything.
4. If any jest test pins the DOM of these elements (snapshots, attribute lists), update it minimally and say which and why. If a unit test is the natural guard that the id is present, add one.
5. No lifecycle scenario is expected. If you find one is genuinely needed, it is G-S41 — but stop and report NEEDS_CONTEXT first.
6. CHANGELOG: this is test/coverage infra, no user-facing change — do NOT add a CHANGELOG bullet unless the plugin's conventions require one; say what you decided.
7. Commit in the plugin after each coherent step (conventional messages, `SC-500` in the subject). No co-author / AI attribution trailers in commits. Do not push. Do not touch the superproject pointer.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and cannot move a gate baseline — list them under `Drive-by fixes:`. Everything else goes under `Follow-ups:` untouched.

## 3. Gates (dse-verify skill owns the order and command shapes)

Full battery in dse-verify order: tsc (incl. `tsc -p e2e`), lint (incl. `e2e/`), jest, lifecycle, e2e, shots, freeze, parity.

Expected numbers (CURRENT @ 054c9c5):
- tsc/lint clean
- jest 6003 passed / 1 skipped / 242 of 243 suites (+ any new tests; on a fresh worktree one fewer passed and 2 skipped until `npm run shots` caches app.css — compare after shots)
- lifecycle 36/36
- e2e `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` — **coverage pairs must RISE** (Y/Y, all covered); report the new number and which new pairs.
- shots 592, 0 FAIL, `button host-leak OK (113 … 678 …)` (12-record boundary), modal host-leak (10 … 9 … 38 … 228 …), input 164, checkbox 60, expected `OBSIDIAN APP.CSS PIN DRIFT` warning. A host-leak sweep may enumerate controls by `data-dse-control`; if any of these counts moves, explain exactly why.
- freeze `freeze OK (280/280 …)` — an attribute must not move pixels; any freeze change = STOP, report.
- parity 0 GAPs / 0 undeclared / 24 DECLARED.

Also prove the switch is real: show that with one of the new ids removed (temporary mutant, reverted, not committed) the e2e coverage gate or the spec fails. Record that run's summary line.

## Footguns (all mandatory)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command; use `git -C <abs path>` for every git command.
- Record exit codes from a script FILE run through devbox (`... -- bash <script>` writing `echo rc=$? > <unique file>` inside the script). `bash -c '...; echo rc=$?'` always records 0.
- Run each gate as ONE blocking foreground Bash call (lifecycle, e2e, shots each in separate calls, under the 10-minute tool timeout; set timeout 600000). No `run_in_background`, no Monitor, no waiting for notifications.
- Redirect long output to files; read summary lines with grep/tail afterwards. Never pipe a gate into `tail` (eats failures).
- Scratch: a PRIVATE subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc500-impl-r1-<your agentId>/`, uniquely named scripts/logs inside. Create files with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` any shared `/tmp` glob or `.superpowers/`. Overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions. Read the process's own output or a per-run unique path.
- `npm ci` in the worktree first if `node_modules` is missing or stale.
- No tags, no releases, no `just deploy*`.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, the first word must be `SC-500:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc500-initiative-control-ids/sc500-r1-impl-report.md`. Open with a ≤10-line executive summary. If the write is blocked, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin commit shas (with base), the three ids chosen, manifest rows added, each gate's summary line + rc, the new coverage Y/Y, the mutant-proof line, any moved baseline with cause, `Drive-by fixes:`, `Follow-ups:`, and the absolute path of every evidence artifact (report, gate logs, e2e run dir).
