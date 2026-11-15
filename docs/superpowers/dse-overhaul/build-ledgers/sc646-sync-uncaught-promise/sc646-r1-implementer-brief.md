# SC-646 r1 implementer brief: a failed Sync leaves "Uncaught (in promise)" in the console

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/decisions.md`.
  It is the current state; the tracker thread is not your source. **You never call the tracker
  (Linear)**: not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise`, branch
  `sc646-sync-uncaught-promise` in the superproject and every submodule. Plugin dir:
  `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise/draw-steel-elements`.
  Verify `pwd`/paths before every write. **Never edit anything under
  `/home/scott/code/steelCompendium/workspace/`** except writing your report into the ledger dir
  above. The workspace-level `CHANGELOG.md` you edit is YOUR worktree's copy:
  `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise/CHANGELOG.md`.
- First: `git -C <plugin dir> fetch origin` and confirm `origin/develop` is still `a9f0af1d`;
  if it moved, rebase onto it and say so in your report. Use `git -C <abs path>` for EVERY git
  command, never `cd X; git …`.
- Read the project skills: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (about 480 KB: read in parts: lines 1-247 are the battery and its notes; the "Settings e2e
  (SC-440)" note is near line 206; "Current expected numbers" starts near line 1532) and the
  plugin's own `AGENTS.md`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault and expected; ignore it.

## 2. The task

Ticket text (verbatim): "When Sync fails (for example, the GitHub release lookup returns 404),
the user correctly sees the "compendium sync failed" Notice. The console also gets an unhandled
`Uncaught (in promise) Error: GitHub release lookup failed (HTTP 404)`. The button drops the
promise it starts." Agent note: "`src/views/SettingsTab.ts:634`: `void this.plugin.syncCompendium()`.
`CompendiumSyncService.sync` rethrows by design (its doc says callers need no try/catch), so the
settings button needs a `.catch` (the Notice is already shown)."

No Scott rulings exist. Owner rulings are in the ledger; follow them exactly:

1. Fix the Sync button at `src/views/SettingsTab.ts:634`: handle the rejection so nothing is
   left unhandled. The Notice and the designed `console.error("compendium sync failed: …")`
   stay exactly as they are, one each. No second Notice, no second log line. Put a one-line
   comment at the catch saying why it is empty (the failure was already reported by …; name
   where).
2. Audit every other caller of `syncCompendium()` and the Check-for-updates path
   (`checkForCompendiumUpdates`, `syncService.checkForUpdates`), plus any command-palette
   command, the compendium search modal's sync request (`src/authoring/compendiumInsert.ts:402`,
   `CompendiumSearchModal.ts`), and anything else that starts a sync. For each, report: does a
   rejection reach the user as a Notice, and is it left unhandled? Fix every one that leaves a
   rejection unhandled, the same way. List every call site in the report with its verdict.
3. Do NOT change `CompendiumSyncService` (it keeps rethrowing). If a fix needs `main.ts`, you
   may make it, but name it in the report: the owner must tell the dispatcher (SC-653 may touch
   the sync path there later).
4. Tests:
   - jsdom: a test that clicking Sync in the settings tab with a rejecting `syncCompendium`
     leaves no unhandled rejection (e.g. a `process.on('unhandledRejection')` listener or the
     harness's equivalent; look at `test/dom/views/settings-matrix.test.ts`,
     `settings-integrity.test.ts`, `_settingsHarness.ts`). It must go red if the `.catch` is
     removed: prove it by a mutant run (remove the catch, run, see red, restore) and record the
     result. Same for any other call site you fixed, where a jsdom test is practical.
   - e2e: in `e2e/specs/settings/compendium.e2e.ts`, `knownBug('SC-646', '[SET-C04] …', fn, { failsWith })`
     becomes a plain `test('[SET-C04] …', fn)` (drop `failsWith`), and its `allowPageErrors`
     regex drops the `|rejection: Error: GitHub release lookup failed \(HTTP 404\)` alternative,
     so the per-test "no page errors" invariant also guards it. Never put a bracketed ticket id
     in a test title (the runner reads titles for scenario ids).
5. Commit inside the plugin after each coherent step (fix, tests). Conventional messages with
   `SC-646`, e.g. `fix(SC-646): …`. No AI attribution lines in commits.
6. Superproject, YOUR worktree: add ONE bullet under `## Unreleased` in
   `/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise/CHANGELOG.md`
   (user-facing, plain words, match neighbours' style, e.g. "A failed compendium Sync from the
   settings tab no longer leaves an "Uncaught (in promise)" error in the developer console; the
   failure Notice is unchanged."), and commit it in the superproject (`docs(changelog): SC-646 …`).
   **Do NOT commit a submodule pointer bump**; the owner does that once, after review.
7. **Never push anything to origin**, not even the feature branch.

## 3. Gates (dse-verify battery; run all in the plugin dir of your worktree)

Run `npm ci` once first (fresh worktree has no `node_modules`). Command shapes: devbox
`devbox run -c <abs plugin dir> -- bash <your script file>`; record exit codes from inside a
script FILE (an echoed `$?` inside `bash -c` always reads 0); read each gate's own summary line.

Expected numbers at `a9f0af1d` (yours should match plus your new tests):
- tsc (incl. `tsc -p e2e` if the battery says so) and lint: clean.
- jest: **13353 passed / 2 skipped** fresh (13354 / 1 with the shots cache) + your new tests.
  Jest timeout is 30 s: an "Exceeded timeout" is a real hang until proven otherwise.
- lifecycle: **64/64**, in SEVEN parts with `--only=` (EQUALS sign; with a space the runner
  silently runs the whole suite: check the log's first lines list only that part's ids).
  Comma-separated ids, one part per Bash call, output to a log:
  1. `G-S7a … G-S9a` (21; take the exact ids from the SCENARIOS list in order)
  2. `G-S9b … G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
  4. `G-S57,G-S62,G-S61,G-S56`
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
  6. `G-S92,G-S96,G-S97,G-S99`
  7. `G-S108,G-S112,G-S115` (about 200 s: over the 180 s point where the Bash tool moves a call
     to the background. Start it with output to a uniquely named log, then poll YOUR OWN node
     pid with `timeout 175 tail --pid=<pid> -f /dev/null` in repeated foreground calls until it
     exits, then read the log. Pick the pid whose `/proc/<pid>/cwd` is your plugin dir.)
  Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs.
  G-S115 (g) is a suspected flake (SC-633): re-run part 7 once; any other failure is real.
  If G-S97 fails, check `demo-vault/.obsidian/appearance.json` is not dirty (SC-622); restore it
  with `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` and re-run.
- e2e: full run, expected **`OBSIDIAN-E2E done: 608/620 ok, 0 failed, 12 known-bug, coverage: 417/417 pairs`**
  (baseline `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`, SET-C04 moves from
  known-bug to ok; more if you add e2e tests). Known flakes: INIT-W10 under heavy load
  (SC-654), SET-X03 / SET-X04 now and then (SC-657); re-run just those with the runner's
  filter and report both runs. The full run must end `0 failed` with full coverage.
- shots / freeze / parity: if your diff touches no CSS and `styles.css` built in your worktree
  is byte-identical (sha256) to a clean `a9f0af1d` build, they carry (shots 592, host-leak
  163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24): report both
  hashes. If `styles.css` differs, STOP and report (STATUS: NEEDS_CONTEXT).

## 4. Footguns (each cost real time once)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; the scratch dir is pre-populated
  across sessions and a stale log matches. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog
  kills silent agents). Run each gate as a foreground call; no `run_in_background`, no Monitor.
  If a call goes to the background anyway, poll the gate's own log / pid, never wait for a
  notification.
- Private scratch folder only:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc646-r1-impl/`
  with uniquely named scripts and logs (`sc646-r1-jest.log`, …). Write scratch files with the
  Write tool, not heredocs.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and no `rm`
  with a variable path anywhere (a held permission prompt hangs you forever). Overwrite with `>`
  or use new unique filenames. The one sanctioned delete is the battery's own `rm -f main.js
  styles.css` in YOUR plugin dir, written as a literal absolute path, if the skill requires it.
- Never `pkill`/`killall` by pattern: other efforts run the same gates. Kill only a PID whose
  `/proc/<pid>/cwd` is in your worktree.
- No `cd` inside compound commands; use `devbox run -c <abs path>` and `git -C <abs path>`.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message
  anyway, its first word must be `SC-646:`.
- Never push to origin. Never tag.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc646-sync-uncaught-promise/sc646-r1-implementer-report.md`.
It opens with an executive summary of 10 lines or fewer: verdict, plugin branch head sha,
superproject CHANGELOG commit sha, every gate's measured number, call sites fixed.
Body: the call-site audit table, the mutant result, the diff summary (files, lines), any
`Drive-by fixes:` (made) and `Follow-ups:` (left alone) as separate lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (STATUS, shas, measured
numbers, call sites), no prose, plus the absolute path of every artifact you produced (report,
gate logs).
