# SC-441 round 3 — independent reviewer brief

You review SC-441: real-Obsidian e2e + jsdom coverage of the DSE compendium sync and its two
windows ("Existing compendium folder found", the pre-7.0.0 migration window). This is the only
flow in the plugin that moves or trashes vault files. You did not write any of it. **Execute and
probe, do not just read.** Your final text goes to the SC-441 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/decisions.md`
  (ticket scope verbatim, Scott's rulings, owner rulings O1-O20, ticket keys in O13 and O18). It is your
  only source of ticket history. **Workers never call the tracker.**
- Implementer report (phase A, then `## Phase B`): `…/sc441-r1-implementer-report.md`. Read both
  executive summaries, the scenario list, the manifest sections and the gates; dive further only
  where a probe needs it.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals`, dse branch
  `sc441-e2e-sync-migration-modals`, head `88ea9c87` on `develop` @ `4b233886`. Review the diff
  `4b233886..88ea9c87` in `draw-steel-elements/`. **Do not commit, do not edit tracked files** —
  probes that mutate code are made in the working tree and reverted with
  `git -C <abs> checkout -- <file>` (name the file; never `checkout -- .`), and the tree must be
  clean (`git -C <abs> status --short` empty) when you finish. Say so in the report.
- Never touch the shared main checkout (`/home/scott/code/steelCompendium/workspace/`) except your
  report file. Its dse dirt is Scott's live vault: never run anything against it.
- The model and prior art: `draw-steel-elements/e2e/README.md`; the review reports of the earlier
  rollouts for the defect classes to hunt:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc443-e2e-editor-insert/sc443-r4a-review-report.md`
  and `…/sc440-e2e-settings-tab/sc440-r2-review-report.md` (findings lists only).
- dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`:
  very large, do not read it whole. Battery table lines 20-35 (`cut -c1-6000`), "Lifecycle and e2e
  notes" line 207, "Current expected numbers" line 1551 (CURRENT only).

## 2. What to establish

**A. Safety of the suite itself (first, before running any `SYNC-*` spec).** Read
`e2e/driver/sync.ts` and prove from the code, then by probe:

1. The O2 guard cannot pass for a vault that is not the runner's disposable copy. Probe: make the
   guard see a path outside the run's temp dir (edit the guard's input in the working tree, or
   point `TMPDIR` so the comparison fails) and confirm every `SYNC-*` scenario refuses to run
   BEFORE any sync, trash or rename. Confirm no scenario bypasses `startSyncTest()`.
2. The trash setting is `'local'` (or `'none'` only in the named scenarios) and asserted, the
   trash canary runs in every spec session before any trash scenario, and nothing can reach the
   machine's system trash. After a full `SYNC-*` run, check the machine's trash
   (`~/.local/share/Trash/files`, listing only — do not delete anything) holds nothing from the
   run, and that nothing was written outside the run's temp dir (the repo's tracked
   `e2e/vaults/**` unchanged: `git status --short` empty after the run).
3. No test reaches the network (the fixture release stub; a request that falls through throws).

**B. The tests are real.** For each defect class below, probe at least the highest-consequence
scenarios (trash, move, overwrite), and sample the rest:

- **Mutation probes.** Break the product in the working tree and confirm a plain `SYNC-*` test
  goes red, then revert: (i) "Keep everything" also trashes the folder; (ii) "Move old compendium
  to trash" trashes a sibling folder too / trashes nothing; (iii) "Not now" / Escape at the
  preview falls through into a sync; (iv) the migration moves an unmapped user note; (v) the
  migration overwrites an occupied destination; (vi) the migration skips the backup of a modified
  file; (vii) Stop is ignored; (viii) sync trashes a user-modified file removed upstream; (ix)
  sync writes a file outside the Destination; (x) sync touches the user's own note inside the
  Destination; (xi) a footer button's handler is deleted (does a test fail, or only a
  "window closed" assertion that still passes?). Report each as CAUGHT (which test id) or MISSED.
- **Vacuous drives.** A scenario whose start state already equals its expected end state; a
  tree-diff assertion that would pass on an empty diff when a non-empty one is expected, or the
  reverse; a "nothing else changed" check whose volatile-file allowlist is wide enough to hide a
  real change (read the allowlist; is `data.json` or the compendium manifest in it?).
- **The tree snapshot.** Does it see `.trash/`, `.obsidian/plugins/draw-steel-elements/`, the
  backup folder, the report note? Does the move inference (same hash at a removed and a created
  path) mis-attribute when two fixture files share bytes? Does the "after" snapshot wait for the
  run to finish (no fixed sleeps)?
- **Order dependence.** Run single scenarios alone (`--only` / grep, as the README says) and in a
  different order: each must pass alone. Does `resetSyncTree()` really return to the pristine tree
  after a knownBug scenario that writes into `.obsidian` or `.trash`?
- **Coverage honesty.** Every manifest pair has at least one PLAIN driver that uses real input on
  that control and asserts the file tree and the screen; pairs credited by a helper that does not
  touch the control; ids built from template strings; pairs driven but undeclared; a
  `modal.close` / `modal.backdrop` drive credited to the wrong phase. Compare against ledger O5
  (confirm, cancel, close on every window and phase; the nothing-to-do re-runs) and O14 Q3 / Q6.
- **Known-bug markers.** Each `knownBug('SC-…')` and jest `test.failing` asserts the CORRECT
  behaviour named by its ticket (ledger O13 and O18: SC-702, SC-703), would turn green on a real fix and not on an
  unrelated change, and fails today for the reason the ticket states (not for a typo or a
  timeout). The SC-653 scenario must hold under BOTH options Scott is choosing between (ledger
  O9). No bracketed ticket id in an e2e test title.
- **Both censuses.** Inject an un-id'd button into each window (each phase) in the working tree:
  the jsdom census and the real-Obsidian census must each report it.
- **Product diff.** `git diff 4b233886..88ea9c87 -- src main.ts styles.css`: attributes and census
  plumbing ONLY. Any behaviour change is a HIGH finding.
- **Bugs the implementer missed.** Probe the surface yourself for defects, the file-losing kind
  first: anything the survey's 11 integrity probes (report, phase A) did not try. Report each
  with an exact repro, file:line and what the user loses. Do not fix.
- **Flake.** Run the `SYNC-*` specs alone at least twice; report any test that does not pass
  every time, with its failure line.

**C. Gates.** Re-run tsc (incl. `tsc -p e2e`), lint, full jest, and a FULL `npm run e2e`.
Expected at `88ea9c87`: tsc + lint rc 0; jest `14913 passed / 2 skipped` fresh (no shots cache); e2e `OBSIDIAN-E2E done: 927/947 ok, 0 failed, 20 known-bug, coverage: 539/539 pairs` (baseline at 4b233886: 843/852, 9 known-bug, 486/486). Implementer also reported lifecycle 64/64, shots 592, freeze 280/280, parity 0 / 0 / 24. Lifecycle, shots, freeze and parity were run by the
implementer; re-run them only if the product diff is more than attributes.

## 3. Footguns

- `git -C <abs path>` for every git command; `devbox run -c <abs worktree>/draw-steel-elements -- bash <script file>`
  for every gate, the script capturing the exit code to a file (devbox eats `$?`; `| tail` eats
  failures). No compound `cd X && …`. Scratch files with the Write tool, not heredocs.
- Private scratch folder (exists):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`
  — uniquely named scripts and logs (`sc441r3-…`). The scratchpad is shared by every agent.
- One blocking foreground call per gate, output to a log. No `run_in_background`, no Monitor.
  The Bash tool backgrounds calls over 180 s: start the gate with output to a log, then wait with
  `timeout 175 tail --pid=<your node pid> -f /dev/null` (check `readlink /proc/<pid>/cwd` is in
  your worktree), repeat until it exits, then read the log's summary line and the rc file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog
  kills silent agents.
- A private `DSE_CAMERA_TMP` under your scratch folder for each e2e run; never set
  `DSE_LIFECYCLE_PORT`.
- No `rm` / `rmdir` in `/tmp` or the scratchpad, no glob or shell-variable `rm`, never touch
  `.superpowers/` outside your report file. Never `pkill` / `killall` by pattern: kill only a
  literal PID whose cwd is inside `worktrees/sc441-e2e-sync-migration-modals/` (SC-682 runs the
  same gates in another worktree).
- The implementer is idle while you review, but do not assume the working tree is yours alone:
  check `git status --short` before each mutation probe and after each revert.
- Known e2e flakes under load, not this surface: INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04
  (SC-657), NEGO-R05 / NEGO-R08 — re-run alone before believing, report either way.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent, and
  `to: "main"` routes to the dispatcher. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send
  a message anyway, its FIRST WORD must be `SC-441:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/sc441-r3-review-report.md`,
opening with a ≤10-line executive summary: verdict (`LAND-READY` / `FIX REQUIRED`), finding counts
by severity, mutation probes caught / missed, safety checks A1-A3 pass / fail, gate numbers, new
product bugs found (count, highest severity), working tree clean yes / no.

Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, the
failure scenario (what could go wrong and how you showed it), and a prescribed fix. Then the
mutation-probe table, the safety section, new product bugs (plain-words title, exact repro,
file:line, severity, what the user loses), and every gate's log path and summary line.

## 5. Return contract

Final text to the ticket-owner — raw facts, no prose: verdict, finding counts by severity with
one line each for HIGH and above, mutation probes caught / missed, safety A1-A3, gate numbers,
new product bugs, working tree clean, the report path and the path of every evidence artifact.
