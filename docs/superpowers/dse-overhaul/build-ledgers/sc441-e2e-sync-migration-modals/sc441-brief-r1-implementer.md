# SC-441 round 1 — implementer brief (phase A)

You implement SC-441: real-Obsidian e2e + jsdom functional coverage of the DSE compendium sync
and the two windows around it ("Existing compendium folder found" and the pre-7.0.0 migration
window). This is the only flow in the plugin that moves or trashes vault files. Your final text
goes to the SC-441 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings O1-O12. It
  is your only source of ticket history. **Workers never call the tracker** (Linear) — not to
  read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals`, branch
  `sc441-e2e-sync-migration-modals` in `draw-steel-elements/`. Verify with `git -C` before every
  write. Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main
  checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, not yours, don't flag it, and never run anything against it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `a0e55f6b`. If it moved, `git rebase origin/develop` and
  say so in the report (then `npm ci` if `package.json` changed). The worktree is fresh and has
  no `node_modules`: run `npm ci` once in its `draw-steel-elements/` (through devbox, script file,
  output to a log) before the first gate.
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art: the
  landed SC-440 settings-tab rollout and SC-443 editor-insert rollout, ledgers + briefs + reports
  at `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`
  and `.../sc443-e2e-editor-insert/` (read each `decisions.md`; each r1 report's executive
  summary; each review report's findings list — it shows what the reviewer will look for: vacuous
  drives that start at the expected end state, ids built from template strings the runner can't
  see, pairs driven but undeclared, assertions that only check a window closed, tests that pass
  only after an earlier test, a handler deletion that turns nothing red). Code prior art:
  `e2e/manifest/*.ts` (esp. `settings-tab.ts` group C and `reset-encounter-modal.ts`),
  `e2e/specs/settings/compendium.e2e.ts`, `e2e/driver/dse.ts`, `e2e/driver/settingsDrive.ts`
  (incl. the page-side `requestUrlFn` network guard), `e2e/driver/authoring.ts` (`openEditor`
  deletes a stale destination folder — read why), `e2e/driver/session.ts`, `e2e/driver/env.ts`,
  `e2e/driver/cleanup.ts`, `e2e/driver/invariants.ts`, `e2e/vaults/plugin-data.shipped.json`,
  `src/framework/kit/controlId.ts`, `src/framework/kit/managedModal.ts` (`DseModal`).
- Then the surface: `src/views/LegacyCompendiumModal.ts`, `src/views/CompendiumMigrationModal.ts`,
  `src/data/CompendiumSyncService.ts`, `src/data/CompendiumMigration.ts`, the wiring in `main.ts`
  (about lines 700-1000: `syncCompendium`, the destination guard, the busy guard, the migration
  offer) and the command registrations, the existing jest tests
  (`test/unit/data/compendium*.test.ts`, `migration*.test.ts`,
  `test/dom/views/legacy-compendium-modal.test.ts`, `compendium-migration-modal.test.ts`,
  `test/dom/framework/syncCompendium*.test.ts`), and the census files
  `test/dom/e2eCensus.test.ts` and `e2e/specs/_census.e2e.ts`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is
  very large with some very long lines: do NOT read it whole. Read the battery table rows (lines
  20-35, cut long lines with `cut -c1-1500`), "Devbox wrapping" (line 146), "Jest timeouts under
  load" (line 168), "Lifecycle and e2e notes" (line 207), "THE exit-code footgun" (line 231), and
  "Current expected numbers" (line 1551, the CURRENT paragraph only). Don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there. Every
owner ruling in the ledger (O1-O12) binds you; read them there in full. The two that are safety
rules, quoted:

> **O2. Disposable vault only, and prove it.** Every scenario runs in the e2e runner's disposable
> vault copy. The spec's `before` (or the driver helper every scenario goes through) must assert the
> open vault's base path is the runner's temp copy and throw otherwise, before any sync, trash or
> rename is triggered. Never open, read or point a test at Scott's live vault (the main checkout's
> `draw-steel-elements/demo-vault`) or any other real vault.

> **O3. Trash never leaves the vault.** Scenarios run with Obsidian's "Deleted files" setting on the
> vault's own `.trash` folder, so a trashed file can be found and asserted and nothing lands in the
> machine's system trash. The "Permanently delete" setting may be driven too (it only deletes inside
> the disposable vault) — report what the plugin does under it. Do NOT run any scenario with the
> "system trash" setting: if covering it seems necessary, return NEEDS_CONTEXT and ask.

Phase A runs no real-Obsidian sync at all (no e2e gate this round), so O2/O3 bite in phase B; in
phase A you design the guard and say how it works.

Ids must be literal strings in test titles (`[SYNC-M01]`, never `[SYNC-${x}]`): the runner reads
titles statically.

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the surface draws: both windows' footer buttons
   in every phase, the X if `DseModal` draws it (allowlist it with a reason if it is Obsidian's
   own), the summary's collapsible per-path list headers. Buttons whose label carries a number
   ("Move 23 file(s)", "Finish moving the remaining 7") get a stable id without the number. Use
   `controlId.ts` / the existing `DseModal` footer plumbing; ids prefixed `sync.` /
   `migration.` (refine if a better prefix exists, say why). Commands have no DOM of their own:
   list each sync / migration command as a manifest control the way SC-443 listed the insert
   commands (`e2e/manifest/authoring-commands.ts`).
2. Both censuses cover the surface by CONTAINER scoping (each window's modal root, in each
   phase), not by CSS class (the SC-437/SC-438/SC-440 census pattern): any eventful node inside
   must carry an id from the manifest or an allowlisted id (Obsidian's own chrome allowlisted
   with a reason). Prove it catches a regression: a jsdom test that injects an un-id'd button and
   expects a census finding. Census ids from `[CENSUS-35]`. Say how the real-Obsidian census will
   open each window and each phase (phase B builds it).
3. The manifest (`e2e/manifest/sync-*.ts`, split per window if it reads better): every (control,
   interaction) pair per ledger O5 — click and keyboard (Enter / Space on the focused button),
   Escape, the X, click-outside if it closes, per window and per phase; the commands; the entry
   points listed in O1. Same comment style as existing manifests. Where SC-440 / SC-443 already
   declare a control (`settings.compendium.sync`, the search window's Sync affordance), do not
   re-declare it: add the scenarios that drive it THROUGH the window and say in the manifest
   comment which manifest owns the control.
4. jsdom matrix tests for the combinatorial logic, under `test/dom/` / `test/unit/` next to the
   existing tests (extend, don't duplicate — read what is there first and say what was already
   covered): sync — per file state (absent / present unmodified / present user-modified / present
   but not in the manifest / removed upstream unmodified / removed upstream modified / unsafe
   relative path) × release (first sync / same tag again / newer tag) → created / updated / kept /
   conflict / trashed / rejected, and the manifest written; the destination guard — blank, vault
   root, `.`, `/`, `..`, a path outside the vault, a nested path, trailing slash, a path that is a
   FILE, `.obsidian`, `.trash`, unusual case; the busy guard across Sync / Check / migration; the
   migration — detection threshold (19 / 20 legacy paths), plan × (unmodified / modified /
   destination occupied / unmapped / source vanished between plan and run), Stop at each point,
   finish-remaining, a second run with nothing to move, persisted state (declined / settled /
   incomplete) × what the next Sync does; each window × each button / Escape / X / unload → which
   callback fires exactly once and that no path falls through into a sync (the header comment of
   `CompendiumMigrationModal.ts` states the rule).
5. The bug survey: probe the surface (jsdom probes with the existing vault fakes are cheap; read
   the code paths too) for real defects. Integrity probes are mandatory because these paths move
   and trash the user's files:
   - a user's own note inside the Destination folder (never installed by Sync) survives a sync, a
     newer-tag sync, and a migration, byte-for-byte;
   - a compendium file the user edited is never overwritten or trashed (it is kept / backed up);
   - a file the user deleted is handled as the code intends on the next sync (report what it does);
   - nothing outside the Destination folder is ever created, changed, moved or trashed, except the
     plugin's own state and the report note / backup folder (name where they go);
   - a zip entry with `..`, an absolute path, a backslash path, or a name colliding by case cannot
     write outside the Destination folder;
   - a Stop mid-migration leaves every file either at its old path or its new path, never both and
     never neither; the backup holds the pre-move bytes of each modified file;
   - a rename never lands on an occupied path;
   - Escape / X / unload at every phase changes no file;
   - a failed download or a broken zip leaves the tree untouched and the busy flag released;
   - two Syncs started together (button + command) do not both run;
   - the "Move old compendium to trash" path trashes exactly the folder named in the window and
     only after the destination is re-checked (the SC-643 guard: the Destination setting changed
     while the window was open).
   Batch the bugs per ledger O8/O9 (SC-653 is known and open — cite, don't re-report).
6. Answer, in the report, the open mechanics for phase B:
   (a) how the fixture release is wired with no network and no product change (where the zip
       comes from, how `requestUrlFn` is stubbed page-side, how tag A / tag B are served), per O6;
   (b) how the legacy fixture is built in the disposable vault and how "Stop" is reached mid-run
       through real input, per O7;
   (c) how the file-tree snapshot helper works (O4): how it reads the tree (Node `fs` on the
       vault copy's path vs the vault adapter), that it sees `.trash/` and `.obsidian/plugins/…`,
       and what the runner's existing between-test vault reset does with folders, `.trash/`, the
       compendium manifest and `data.json` (the SC-443 driver had to delete a stale destination
       folder by hand) — and what you will add so every `SYNC-*` test starts from a known tree;
   (d) how the O2 guard decides the vault is the disposable copy, and how the "Deleted files"
       setting is put on `.trash` for the run (O3) without a write into a tracked file under
       `e2e/vaults/`;
   (e) which existing `e2e/driver/*` files you need to edit, if any (O10);
   (f) the expected runtime the `SYNC-*` specs add to a full e2e run, roughly.
7. Commit inside `draw-steel-elements/` after every coherent step. Messages `test(SC-441): …` /
   `feat(SC-441): …`; no Claude/AI attribution or co-author trailers. Do not push. Do not touch
   the superproject pointer or commit anything in the superproject.
8. Gates for phase A only: tsc (incl. `tsc -p e2e` if the battery runs it), lint, jest (full
   run), and the jsdom census. No e2e / lifecycle / shots yet. Then write the report and return
   `STATUS: NEEDS_CONTEXT` — **even with zero bugs** — with the pair list, the bug list and the
   answers to item 6.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/sync/` driving every manifest pair through real input, each asserting
the file tree before and after (O4) and the screen (at least one plain driver per pair); the
real-Obsidian census extended; markers citing the keys the owner gives you; then the full battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `a0e55f6b`: jest **14716 passed / 1 skipped** WITH the shots cache (a fresh worktree
reads one fewer passed and 2 skipped until `npm run shots` has run — measure and report your own
fresh figure) · lifecycle 64/64 · e2e
`OBSIDIAN-E2E done: 833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs` · shots 592 ·
freeze 280/280 · parity 0 / 0 / 24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (every `test.failing`
counted as passing). Jest's default timeout is 30 s since SC-568: an "Exceeded timeout" is a real
hang until proven otherwise — re-run the suite alone first, don't blame load.

Phase B (later): lifecycle 64/64 in the seven `--only=` parts the skill lists; e2e
`N/M ok, 0 failed, K known-bug, coverage: Y/Y` with Y > 486; shots 0 FAIL, 592; freeze 280/280
(attribute-only changes must not move print bytes — if one moves, stop and report, never touch
the baseline); parity 0 / 0 / 24, run LAST.

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a unique
log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool,
  not heredocs.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-impl-r1/`
  (exists) — every script and log inside it uniquely named. Never a generic `gate.sh`. The
  scratchpad is shared by every agent in the session.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** — workers have
  hung on a permission prompt doing that. Leave throwaway files in place; use fresh names or
  overwrite with `>`. Never `rm` with a shell-variable target, never a glob `rm`
  (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort), never touch
  `.superpowers/` outside your report file in `sc441-e2e-sync-migration-modals/`.
- **Run each gate as one blocking foreground call** with output redirected to a log file. No
  `run_in_background`, no Monitor. The Bash tool moves any call over 180 s to the background: for
  long gates (full jest) start the gate with output to a log, then wait with
  `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pick the pid whose
  `readlink /proc/<pid>/cwd` is inside your worktree), repeating until it exits, then read the
  log's summary line and rc file. Never wait for a completion notice that may not come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog
  kills silent agents. `devbox`'s `sh` wrapper eats `$?` / `$PIPESTATUS` and `| tail` eats
  failures: capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose
  `readlink /proc/<pid>/cwd` is inside `worktrees/sc441-e2e-sync-migration-modals/`. Never
  `pkill` / `killall` by pattern — other efforts (SC-682) run the same gates concurrently.
- Stale `main.js` shadows `main.ts` for jest: see the skill, line 158.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare
  the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- `e2e/vaults/plugin-data.shipped.json` and `e2e/vaults/shipped/**` are tracked sources: never
  let a test write back into them.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent by any
  name, and `to: "main"` routes to the top-level session (the dispatcher), not to me. If you need
  input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report — I
  see your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-441:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/sc441-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs
baseline, control count, pair count, bug count with the highest severity, the six mechanics
answers in a few words each). Then: commits (sha + subject); controls added (id list, grouped by
window and phase); manifest pairs (count + full list); the census changes (what changed in each
census, the regression test); jsdom matrix tests added (file + what they cover, and what the
existing tests already covered); integrity probes (each one from item 5, result); bugs found
(title in plain user-facing words, exact repro, file:line, severity, what the user loses, and
whether it matches a known ticket from O9 — or "none"); `Drive-by fixes:` and `Follow-ups:`
sections; and every gate's log path and summary line. Phase B will append to this same file
under a `## Phase B` heading.

## 6. Return contract

Final text goes to the ticket-owner, not a human: raw facts, no prose —
`STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha, each gate's summary numbers, control
count, pair count, bug list (title + severity + file:line), the six mechanics answers, report
path, and the filesystem path of every evidence artifact you produced (logs, reports).
