# SC-527 r2 brief — productionize + full battery (orchestration:implementer)

You are the r2 implementer for Linear ticket SC-527. Your final text goes to the ticket-owner,
not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (read first, in order)
1. Ledger (current state, rulings verbatim — obey every one): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/decisions.md`
2. r1 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/sc527-r1-survey-report.md` — read the executive summary and sections 3, 4, 5, 7 in full (the recipe you are productionizing).
3. Prior art you are extending: SC-513's tracked ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc513-hostleak-click-revealed/` (decisions.md; summary of sc513-r2-impl-report.md). Its tests: the describe "click-mount seams for the host-leak sweeps (SC-513)" in `test/dom/visual-harness/fixtures.test.ts`.
4. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery order, command shapes, CURRENT block (~line 1231), "Button host-leak sweep" bullet (~line 197).
5. `draw-steel-elements/AGENTS.md` in your worktree.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds` (branch `sc527-hostleak-state-kinds` in every submodule). The prototype is on the LOCAL dse branch `sc527-r1-proto` @ `b33616d` (one commit on `ed368f6`). First: `git -C /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements fetch origin`; confirm origin/develop (expected `ed368f6`; if it moved, rebase onto the new head and report it). Then bring b33616d onto branch `sc527-hostleak-state-kinds` (cherry-pick or ff) — work and commit on `sc527-hostleak-state-kinds`, never on `sc527-r1-proto` (leave that branch untouched). node_modules already exists from r1 (run `npm ci` only if package.json changed after a rebase).

Verify paths before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir. You make no workspace-level doc edit (no DESIGN.md, CHANGELOG.md, dse-verify) — the owner drafts those.

## 2. The task
Ticket task, verbatim: "decide per kind whether the sweep should reach the state by a real click in its own load (no capture change), and add it with a named failure if the state is not reached."

Owner rulings (verbatim from the ledger):
- "Beyond-ticket kinds (3): FOLD as prototyped. Same class, same ticket (\"decide per kind\"); they cost 2 sections and stay green. Expected: button 157 / 942, boundary 34."
- "`hero|…stepper__btn|disabled`: ACCEPT \"compared since SC-513 via another node\" (one node per kind, as SC-513 INFO-1). No SC-527 assertion; a comment at the hero entry says so."
- "`aria-checked` key gap (selected negotiation tier row shares the idle row's key): FILED SC-530 (Backlog, related SC-527). OUT of scope; the SC-527 comment block may cite SC-530."
- "r2 = fresh orchestration:implementer productionizes from b33616d + r1 §4 \"For r2\" items: entry.ts galleryExtra comment names the SC-527 sections; jest seam test(s) like SC-513's (withSc527States appends last; reach-assertion selectors match the default fixtures); full battery."
- Inherited: "Do NOT mount the Recoveries popover, do not add `staminaRecoveryPopover`, do not click the pips (SC-526). Keep SC-527's additions in their own helper/constants (e.g. `SC527_*`, one call site per sweep) so SC-526 rebases cleanly." and "Every state change asserts it reached the expected state (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared; no existing kind's first node may move."

Concretely:
1. Productionize b33616d: review it for clarity; keep the ordering (`reachStateKindsForSweep` before `mountClickRevealedForSweep`, `assertSc527Tagged` after `assertSc513Tagged`). Comment block at the SC-527 constants: what it does, why button-sweep only (no state-only input/checkbox kind exists — r1 measured), why the parity gates (SC-450/423/377) do not cover it (host sheet in on both sides), the hero stepper note, and SC-530 for aria-checked.
2. `visual-harness/entry.ts` `galleryExtra` comment (~:1110): name the SC-527 sections alongside SC-512 and SC-513. No behaviour change in entry.ts unless the tests need an exported seam.
3. Jest: add tests in `test/dom/visual-harness/fixtures.test.ts` (or a sibling under `test/dom/visual-harness/`), mirroring SC-513's describe: e.g. `withSc527States` appends the SC-527 sections LAST after SC-513's; the reach-assertion selectors match nodes in the rendered default fixtures (before the click where relevant, i.e. the click targets exist and the target state is not already present at load). Each test must be able to fail — prove it with at least two deliberate breaks (rc 1, reverted).
4. Re-measure the can-fail case once (wrong target -> rc 1 with the named lines), reverted.

Scope fence: `visual-harness/shoot.mjs`, `visual-harness/entry.ts` (comment), tests under `test/dom/visual-harness/`. No `src/`, no capture change, no freeze baseline touch.

## 3. Gates — full dse-verify battery, in order, on your final head
Expected numbers (CURRENT at ed368f6 + SC-527):
- tsc (incl. `tsc -p e2e`) clean; lint (incl. `e2e/`) clean.
- jest: base 6112 passed / 1 skipped / 247 of 248 suites + your new tests (state the delta). Run jest after shots has cached `visual-harness/dist/obsidian-app.css` or expect 2 skipped (dse-verify row 3).
- lifecycle `npm run obsidian-lifecycle`: `39/39 ok, 0 failed` (G-S14 has flaked once under load; a single flake re-run is acceptable, report both).
- e2e `npm run e2e`: `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots: rc 0, 592 PNGs, ALL sha256 identical to `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r1-abb0c6465158755e8/shots-base.sha256`; `button host-leak OK (157 … 942 …)` with a 34-record boundary (28 base + 6 focus-visible disabled on `hero|dse-btn|disabled`, `montage|dse-btn.dse-btn--accent|disabled`, `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled`, x2); modal 228; input 15 / 176; checkbox 7 / 116; prose 106 [212]. Any other number: explain or stop.
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements/visual-harness/shots` -> `freeze OK (280/280 …)`.
- parity LAST: `0 GAPs / 0 undeclared / 24 DECLARED`.
Superproject worktree: ff to origin/main (`git -C /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds fetch origin` then merge --ff-only origin/main); at the end its only dirt must be ` M draw-steel-elements`. Do not commit the superproject.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc527-hostleak-state-kinds/sc527-r2-impl-report.md` — opens with a ≤10-line executive summary. Then commits, files changed, gate results with exact summary lines, boundary record list, jest break proofs, can-fail lines, evidence paths, then `Drive-by fixes:` and `Follow-ups:` sections.

## 5. Return contract
Final text: raw facts, no prose — verdict, dse head sha (and base sha), every gate's measured number, superproject status, and the filesystem path of every evidence artifact. Every report file opens with a ≤10-line executive summary.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run each gate as ONE blocking foreground Bash call (timeout 600000), ONE gate per call; lifecycle, e2e and shots in separate calls. No `run_in_background`, no Monitor, no background jobs. If the harness backgrounds a call that passed 600 s, wait on the gate's PID with `tail --pid=<pid> -f /dev/null` in a foreground call, then read the gate's own log/rc file.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds/draw-steel-elements -- bash <script-file>`, script written with the Write tool, exit code recorded inside the script (`npm run shots > log 2>&1; echo $? > rc`). Never `echo rc=$?` inside `bash -c` (devbox eats it). Never a compound `cd X && …`; `git -C <abs path>` for every git command.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r2-<yourAgentId>/`, uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable target, no glob `rm`; never `rm -rf` anything under `.superpowers/` or a `/tmp` glob (lifecycle/e2e vaults of other efforts match those globs). Delete only a literal path you created.
- Never `pkill`/`killall` by pattern. Kill only by PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected; do not touch it.
- Commit after every coherent step.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever message anyway, the FIRST WORD must be `SC-527:`.
