# SC-706 r1 — implementer brief

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc706-destination-change-overwrites/decisions.md`
  (the ledger — it is the spec; rulings D1–D4 are binding and quoted below).
- SC-441's notes on the marker you flip:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc441-e2e-sync-migration-modals/sc441-r5-rereview-report.md` §2.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites`
  — plugin at `<worktree>/draw-steel-elements`, branch `sc706-destination-change-overwrites`, at
  dse develop `e783b068`. Run `git -C <plugin dir> fetch origin` and confirm `origin/develop` is
  still `e783b068`; if it moved, `git -C <plugin dir> rebase origin/develop` and say so.
- Verify `pwd`/paths before every write: all edits go under
  `/home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites/`. NEVER write
  under `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.
  Workspace-level files (e.g. `CHANGELOG.md`) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites/CHANGELOG.md`.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours,
  do not touch or report it.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

Fix SC-706. Ticket's expected behaviour, quoted: "a Sync into a changed Destination never
overwrites a file the plugin did not install there, and asks first if the folder already holds
files."

Rulings, quoted verbatim from the ledger:

> **D1. Two halves, both required.**
> (a) `CompendiumSyncService.applySync` Phase 1: a differing file at `<options.root>/<rel>` counts as
> "we installed it" only when the old manifest's root IS `options.root` (normalized compare). When
> the root changed, it is user content: `skippedConflicts`, never `modifyBinary`. Identical-hash
> files stay `unchanged` (adopted, no write) as today.
> (b) `main.ts` `syncCompendium`: a manifest whose root differs from the current Destination is
> treated exactly like "no manifest" for the first-sync check of the NEW folder — vault-root refusal,
> the migration-offer detection, and the "Existing compendium folder found" window
> (`LegacyCompendiumModal`) when the new folder has children. Empty or absent new folder: sync runs
> with no window, as a first sync would.

> **D2. Reuse the existing window unchanged; do not touch `LegacyCompendiumModal` or its wording.**

> **D3. Out of scope (other tickets queued in the same code — do not fix):** SC-694 (edited managed
> note overwritten in place — the `modifyBinary` arm's "spec-sanctioned" overwrite stays as is for
> same-root syncs), SC-695, SC-698, SC-702, SC-653 (the window itself). The fate of the OLD folder's
> compendium files on a Destination change (left in place, untracked) is not this ticket; if the
> implementer finds it is a real gap with no ticket, report it as a Follow-up and the owner files it.

> **D4. Markers.** Flip SC-441's `knownBug('SC-706')` [SYNC-K12] in `e2e/specs/sync/` to a plain test
> and the jest twin in `syncCompendiumBugs.test.ts` (describe `SC-706`: `test.failing` → plain; the
> plain current-behaviour test is rewritten or removed). No other ticket's marker moves.

Cause sites (from the ticket): `src/data/CompendiumSyncService.ts` ~line 214
(`oldManifest?.files[relativePath] !== undefined`), and `main.ts` ~line 765 / ~790 (the check block
only runs when `manifest === null || migrationPending`; inside it, `if (manifest !== null) sync()`
skips the window). Keep the diff minimal and local — SC-694 will edit the same Phase-1 arm next.

Tests to add (jest, following existing patterns near the sync service and main.ts sync tests):
- service: root changed + differing file at new root → skipped, bytes untouched; root unchanged →
  still updated in place (regression guard); root changed + identical file → unchanged; path
  normalization (e.g. trailing slash or `./`-free forms that `normalizePath` equates) treated as
  same root.
- main.ts routing: manifest root differs + new folder non-empty → the window opens and no write
  happens before a choice; manifest root differs + new folder empty/absent → syncs with no window;
  manifest root same → unchanged behaviour (no window); "Keep everything" on the changed-root
  window → the user's colliding note keeps its bytes.
- e2e: K12 flips to plain. If an e2e scenario for "changed Destination into an EMPTY folder syncs
  with no window" does not already exist, add one; any new e2e control must keep coverage at Y/Y
  pairs (read the coverage rules in the e2e README / `dse-verify`).
- If any existing test encoded the old overwrite-on-changed-root behaviour, rewrite it and list it
  in your report.

CHANGELOG: user-facing fix. Look at how recent fix commits on dse develop recorded changelog
entries (`git -C <plugin dir> log -5 --stat -- CHANGELOG.md`, and the workspace
`CHANGELOG.md` `## Unreleased` in your worktree superproject) and follow that convention. Plain
words: "Sync no longer overwrites your own notes after you change the Destination folder; it asks
first, like a first sync."

Commit after every coherent step (product fix, tests, marker flips, changelog), message prefix
`fix(SC-706):` / `test(SC-706):`. No co-author trailers or AI attribution in commit messages.
Do NOT push, do NOT tag (never create a tag on draw-steel-elements).

## 3. Gates

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the battery
table at the top and "Current expected numbers"). A fresh worktree has no `node_modules`:
run `npm ci` first.

Baseline CURRENT at `e783b068`: tsc (incl. `tsc -p e2e`) and lint clean · jest **14991 passed /
1 skipped** (with the shots cache; 14990 / 2 fresh) · lifecycle **64/64** · e2e
**`OBSIDIAN-E2E done: 929/950 ok, 0 failed, 21 known-bug, coverage: 540/540 pairs`** · shots
**636**, freeze **280/280**, parity **0 / 0 / 24**.

Expected after your change: tsc/lint clean; jest green (baseline + your new tests; state the
delta); lifecycle **64/64** (run as the seven `--only` parts the skill lists, report the union);
e2e **0 failed, 20 known-bug** (21 minus SC-706), ok = 930 + any new e2e tests, coverage Y/Y with
Y ≥ 540. `styles.css` must be byte-identical to a clean `e783b068` build — if so, shots / freeze /
parity carry and you do not need to run them; say which you ran. If `styles.css` differs, stop and
report (it should not).

Run every gate as one blocking foreground call (split lifecycle parts and e2e into separate calls
under the 10-minute tool limit), output redirected to a log file, exit codes recorded by a script
FILE run via `devbox run -c <abs plugin dir> -- bash <script>`. No background jobs, no monitors.
Read each gate's own summary line.

## 4. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites/draw-steel-elements -- bash <script>`.
  Never `cd` inside a compound command; never pipe a gate into `tail`; `$?`/`$PIPESTATUS` are eaten
  by devbox's wrapper — record exit codes inside the script file.
- Use `git -C <absolute path>` for every git command, never `cd X; git …`.
- Scratch: a private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc706-r1-impl/`
  with uniquely named scripts and logs. Write scratch files with the Write tool.
- No `rm` with a shell-variable path, no glob `rm`, never `rm -rf` any shared dir
  (`.superpowers/`, `/tmp/dse-obsidian-*`). Delete only literal paths you created.
- Never `pkill`/`killall` by pattern. Kill only by PID whose `readlink /proc/<pid>/cwd` is inside
  your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog
  kills silent agents.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes
  to the dispatcher, not me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send
  a message anyway, its FIRST WORD must be `SC-706:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc706-destination-change-overwrites/sc706-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (verdict, head sha, gate numbers). Then: files
changed (file:line), tests added/rewritten, marker flips, any existing test whose expectation
changed and why, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every log.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE /
NEEDS_CONTEXT / BLOCKED), branch head sha, each gate's summary line, the report path, and the
filesystem path of every evidence artifact (logs). No prose.
