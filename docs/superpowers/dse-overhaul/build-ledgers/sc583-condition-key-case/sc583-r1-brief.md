# SC-583 r1 brief — implementer: condition keys match regardless of case

You are the implementer for SC-583. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc583-condition-key-case/decisions.md`
  (the ledger — the ticket text and the design rules O1–O7 are there; follow them as written).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc583-condition-key-case`, branch `sc583-condition-key-case`
  in every submodule. You work in its `draw-steel-elements/`. Verify `pwd`/paths before any write. NEVER edit
  anything under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. The
  main checkout's `draw-steel-elements` shows a modified `demo-vault/Welcome.md` and untracked
  `compendium-manifest.json` / `demo-vault/*.md` — that is Scott's live vault, expected, not yours; ignore it.
- Base: dse `develop` at `93e8e48c`. First run `git -C <worktree>/draw-steel-elements fetch origin` and confirm
  `origin/develop` is still `93e8e48c`; if it moved, rebase onto it and say so in the report.
- Every git command as `git -C <absolute path> …` — never `cd X; git …` (a failed cd once put git commands into
  the shared main checkout).
- Prior art worth reading (landed): `src/elements/initiative/model.ts` (SC-592: plain-string conditions stay plain
  on write), the SC-580 ledger at `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/`
  (Conditions window type-to-search; its e2e spec additions in `e2e/specs/conditions-modal/cond-integrity.e2e.ts`),
  SC-574 (custom conditions in the minion pool modal). e2e conventions: `e2e/README.md`, `e2e/driver/`.

## 2. The task

Ticket (verbatim from the ledger):

> Condition keys are case-sensitive. If a note says `key: Dazed` instead of `key: dazed`, the tracker shows it as a
> custom condition. Picking Dazed from the Conditions window then adds a second, lowercase `dazed`, so the creature
> carries Dazed twice. … **Expected:** a standard condition key matches regardless of case, and picking it does not
> create a duplicate.

Implement per ledger rules O1–O7 (quote them to yourself from the ledger; do not reinterpret). Concretely:

1. **Survey first** (keep it short, put it in the report): list every site in `src/` that compares or looks up a
   condition key (standard-condition lookup, Add-menu "already present" filtering, add/remove/toggle/edit by key,
   minion pool modal, sidebar, tracker icons, any slug/dedupe of custom names). file:line each.
2. Add ONE case-insensitive key-equality / lookup helper and route every listed site through it (O4).
3. Keep the hand-written casing on write (O3): a block holding `{ key: Dazed }` keeps `Dazed` byte-for-byte after
   an unrelated write, and edits to that condition act on that entry.
4. Tests:
   - jest: unit tests for the helper and for the model (recognition, no duplicate on pick, casing preserved on
     write, edit/remove of a mixed-case entry, custom key case — O4, existing duplicate `Dazed`+`dazed` not merged
     or lost — O5). Show each new jest test fails on the base (`93e8e48c`) behaviour before your fix (red→green;
     say how you checked).
   - e2e: new plain tests with ids in the `[COND-K01]`, `[COND-K02]`, … family (O6), in a new fixture note
     (O7), covering at least: the window shows hand-written `Dazed` as the standard Dazed row (not custom);
     picking Dazed adds nothing (the written note holds exactly one dazed condition compared case-insensitively,
     and still spelled `Dazed`); the Add menu treats Dazed as already present. Show the core e2e test fails on
     the base behaviour (e.g. run it against a stash of the src fix) — record the red log path.
     **Never put a bracketed ticket id (e.g. `[SC-583]`) in a test title** — the runner reads title brackets as
     scenario ids. Ticket keys may go in comments.
5. Commit inside `draw-steel-elements` on branch `sc583-condition-key-case` after every coherent step (no
   superproject commits — the owner handles the pointer bump and CHANGELOG). Commit messages: no AI attribution,
   no Co-Authored-By trailers.

Out of scope: SC-581, SC-582, SC-585, SC-586, SC-613, SC-614, SC-607, SC-602 (other Conditions-window / focus
tickets owned elsewhere). Anything else you notice: report under `Follow-ups:` — don't fix it.
`Drive-by fixes:` only if obviously correct, local to a file you touched, and cannot move a gate baseline.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈340 KB: read in parts —
"The battery, in order", "Devbox wrapping", "Stale main.js", "Load-sensitive jest suites", "Lifecycle and e2e
notes", "THE exit-code footgun", "Current expected numbers"). Run the full battery against your worktree's
`draw-steel-elements`. Baselines at `93e8e48c`:

- tsc clean, lint clean.
- jest: `rm -f main.js styles.css` first. Fresh worktree base: 10746 passed / 2 skipped (after a shots run the
  skipped one passes). Expect base + your new tests, 0 failed. Timeout-shaped reds in the load-sensitive suites:
  check `/proc/loadavg`, re-run those suites alone before believing them.
- lifecycle: 60/60 in SIX `--only=` parts (comma-separated ids), each its own Bash call, output to a log:
  1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) 6. `G-S92,G-S96,G-S97` (3).
  Take the exact id lists for parts 1 and 2 from the skill. Report the union (expect 60/60 ok, 0 failed).
- e2e: base `285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (known bugs SC-257, SC-355, SC-384).
  Expect more ok tests from your additions, still 0 failed, 3 known-bug, coverage Y/Y (Y may grow).
- shots 592; in-run gates host-leak 163/978, modal host-leak 39/234, capture clip 147.
- freeze 280/280 (0 FAILED) via `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`.
- parity LAST: 0 GAPs / 0 undeclared WARNs / 24 declared deferrals.

## 4. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc583-condition-key-case/draw-steel-elements -- bash <script-file>`
  or `devbox run -- bash -c 'cd <abs> && <gate>'` with the gate LAST. Never trust an echoed `$?` inside `bash -c`;
  record exit codes from a script FILE, and read each gate's own summary line. Never pipe a gate (`| tail`).
- Scratch: use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc583-r1-impl/`
  with uniquely named scripts and logs (`sc583-r1-gate-<name>.log`). Create files with the Write tool, not heredocs.
- Never `rm -rf` a `/tmp` glob or any shared dir; never `rm` with a shell-variable path; delete only literal paths
  you created. Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` outside
  `sc583-condition-key-case/`.
- Never `pkill`/`killall` by pattern — other efforts run the same gates concurrently. Kill only a PID whose
  `/proc/<pid>/cwd` is inside your worktree.
- Run each gate as one blocking foreground call with output redirected to a log — no `run_in_background`, no
  Monitor. Note: the Bash tool moves a call longer than 180 s to the background itself and notifies on completion;
  if that happens, wait with `timeout 175 tail --pid=<your node pid> -f /dev/null` (repeat) and then read the log —
  do not end your turn "waiting for a notification". Never key a wait on a scratch filename or its contents from
  before your run — the scratch dir is pre-populated across sessions.
- Redirect long-running output to files — a silent agent is killed by the 600 s stream watchdog.
- `npm ci` if `package.json`'s obsidian version changed after a rebase.
- No `cd` inside compound commands; use absolute paths.
- You cannot SendMessage me (`to: 'main'` reaches the dispatcher, not me). If you need input, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its first word must be `SC-583:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc583-condition-key-case/sc583-r1-report.md`,
opening with a ≤10-line executive summary (verdict, dse branch head sha, each gate's number). Then: the survey
(file:line), the helper and every rerouted site, the O5 behaviour you observed, red→green evidence for jest and
e2e (log paths), the commit list, `Drive-by fixes:`, `Follow-ups:`.

## 6. Return contract

Final text: raw facts only — verdict (DONE / BLOCKED / NEEDS_CONTEXT), dse head sha, gate numbers (tsc, lint,
jest passed/skipped/failed, lifecycle union, e2e summary line verbatim, shots + in-run gate numbers, freeze,
parity), new e2e ids, and the absolute path of every evidence artifact (report, gate logs, red logs). No prose.
