# SC-527 r1 brief — survey + prototype (orchestration:reviewer)

You are the r1 survey/prototype worker for Linear ticket SC-527. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history,
not to post.

## 1. Context loading (read first, in order)
1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/decisions.md` — the ledger. It is current state; it quotes the task and the owner rulings verbatim. Obey every ruling.
2. SC-513's tracked ledger, which built the mechanism you will reuse: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc513-hostleak-click-revealed/` — `decisions.md`, then the executive summaries + sections 1/3 of `sc513-r1-survey-report.md` and the summary of `sc513-r2-impl-report.md`.
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the battery, the "Button host-leak sweep" bullet (~line 197-222) and the CURRENT block (~line 1231).
4. `draw-steel-elements/AGENTS.md` in your worktree.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds` (branch `sc527-hostleak-state-kinds` in every submodule). dse is at `ed368f6` = origin/develop. First: `git -C /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements fetch origin` and confirm origin/develop is still `ed368f6`; if it moved, rebase onto it and say so. Verify `pwd`/paths before any write — NEVER write in `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir. The worktree has no node_modules: run `npm ci` in the worktree's dse first.

Baselines at ed368f6: shots 592, 0 FAIL; `button host-leak OK (145 … 870 …)`, 28-record boundary (26 focus-visible disabled, 2 hover no-hit `initiative|dse-btn.dse-init__stamina`); modal 228; input 15 kinds / 176; checkbox 7 kinds / 116; prose 106 [212]; freeze 280/280.

## 2. The task
Ticket task, verbatim: "decide per kind whether the sweep should reach the state by a real click in its own load (no capture change), and add it with a named failure if the state is not reached."

The kinds (ticket, verbatim):
- `initiative|…dse-init__turn|pressed|aria-pressed:true`, `…portrait-toggle|pressed|…`, `…action-toggle|pressed|…`, `…dse-init__cell|pressed|…`
- `negotiation|dse-nt__chip.dse-optchip|pressed|aria-pressed:true`, `…is-spent|aria-pressed:false`, `negotiation|dse-btn.dse-btn--accent` (Complete Argument enabled)
- `montage|dse-btn.dse-btn--accent|disabled`, `hero|dse-btn|disabled`, `hero|…stepper__btn|disabled` (after Respite, or with Surges at 0)

Do this:
1. **Confirm the gap** at ed368f6: dump the sweep's kind keys (button, input, checkbox; dark and light) with the SC-513 mounts on, and show which of the ticket's kinds are absent. Also sweep the gallery for any OTHER state-only kind the ticket missed (same method as SC-513 r1: click each candidate in fresh loads, diff kind keys) — but bounded: only stateful elements (initiative, negotiation, montage, hero, party, project, counter, conditions, skills, roll); report new ones, do not chase modals (the modal pass covers them).
2. **Per kind, decide and justify** (a table): (a) real click in an appended `galleryExtra` section in the sweep's own load (preferred — the user path); (b) gate-only `probeSource` fixture with the state authored (e.g. Surges 0) where no click reaches it or a click would need a modal/confirm; (c) not worth adding (say why — e.g. SC-450's pressed-parity gate already compares exactly that state's computed style with and without host CSS; check what SC-450's gate really measures before claiming coverage). Name the exact click sequence and the assertion that proves the state was reached (aria-pressed value, disabled attribute, class).
3. **Prototype** on a local branch `sc527-r1-proto` in the worktree's dse (do not push): reuse SC-513's seams (`galleryExtra`, `probeSource`, `withSc513Mounts`, the sweep's mount helper). Keep SC-527's additions in their own constants/helper (`SC527_*`, one call site per sweep) so SC-526 (which will later add the Recoveries popover to the same code) rebases cleanly. Ruling: do NOT mount the Recoveries popover, add `staminaRecoveryPopover`, or click the pips. Click ONLY in appended extra sections — never in the gallery's own sections (SC-513 measured that this moves existing kinds' first nodes). Each state change gets a named FAIL if it is not reached.
4. **Measure** on the prototype: one full `npm run shots` (rc, 592 PNGs, all sha256 vs a base list you take on ed368f6 — or reuse `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/shots-final.sha256` if you confirm ed368f6 produces the same list), freeze, every host-leak line (button kinds/comparisons/boundary with kinds listed, modal, input, checkbox, prose). First nodes: 0 existing kinds lost and 0 first nodes moved (section, label, w, h) — measure it, as SC-513 r3 did. If a new kind LEAKS (sweep goes red), that is a product finding: do not exempt, do not fix product CSS; report the kind, the properties and the values, and stop with STATUS: NEEDS_CONTEXT so the owner can rule (SC-513 handled its leak by filing SC-526).
5. **Can-fail probe**: break one state change (e.g. click the wrong target) and show rc 1 with the named line. Revert.

Scope fence: harness-only (`visual-harness/shoot.mjs`, `visual-harness/entry.ts`, tests under `test/dom/visual-harness/`). No `src/` change, no capture change, no freeze baseline touch, no dse-verify / CHANGELOG / workspace doc edit.

## 3. Gates
The `dse-verify` skill owns command shapes. For the survey you need `npm run shots` (+ freeze check `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements/visual-harness/shots`), plus tsc/lint on the prototype. Expected: shots rc 0, 592 PNGs all byte-identical to base, freeze 280/280, button kinds > 145 with only legitimate new boundary records (`focus-visible: disabled` on disabled kinds is legitimate; anything else needs a reason).

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/sc527-r1-survey-report.md` — opens with a ≤10-line executive summary. Then: gap confirmation, the per-kind decision table, the recipe, prototype shas, the measurement table, first-node result, can-fail probe, and the paths of every log.

## 5. Return contract
Final text: raw facts, no prose — verdict, prototype shas, measured numbers, the per-kind decisions in one line each, any leak found, and the filesystem path of every evidence artifact (logs, sha lists, dumps). Every report file opens with a ≤10-line executive summary.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run each gate as ONE blocking foreground Bash call (timeout 600000). No `run_in_background`, no Monitor, no background jobs. One gate per Bash call. If shots exceeds 600 s and gets backgrounded by the harness, wait on its PID with `tail --pid=<pid> -f /dev/null` in a foreground call, never on a scratch file.
- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements -- bash <script-file>` with the script written by the Write tool; record exit codes inside the script file (`npm run shots > log 2>&1; echo $? > rc`); never `echo rc=$?` inside `bash -c` (devbox eats it). Never a compound `cd X && …`; use `git -C <abs path>` for every git command.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r1-<yourAgentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` anything under `.superpowers/` or a `/tmp` glob. Overwrite logs with `>` or use fresh names.
- Never `pkill`/`killall` by pattern. Kill only by PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; do not touch it.
- Commit after every coherent step on `sc527-r1-proto`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever message anyway, the FIRST WORD must be `SC-527:`.
