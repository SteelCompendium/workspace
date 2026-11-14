# SC-643 r2 — independent adversarial review brief

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/decisions.md`
  (D1-D5 are the spec), then the r1 report `sc643-r1-implementer-report.md` in the same dir — its executive
  summary first; the body only where you need it. Form your own view from the code, not from the report.
- You never call the tracker (Linear).
- Code under review: `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/draw-steel-elements`,
  branch `sc643-sync-empty-destination`, head `9724c190` on dse develop `8a81c5a7`
  (`git -C <abs> diff 8a81c5a7..HEAD`). `git -C <abs> fetch origin`; if `origin/develop` moved past
  `8a81c5a7`, say so (do not rebase).
- Do NOT edit the branch. Probes and scratch code go in a SEPARATE scratch clone/worktree you create at an
  absolute path under your private scratch folder (below), e.g.
  `git -C <plugin abs> worktree add <scratch>/probe-wt HEAD` (then `npm ci` there via devbox, or symlink
  nothing — measure what you need).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 1-240 only.

## 2. The task — execute and probe, not just read

The bug: an empty Destination folder (and `/`) made Sync treat the vault root as an old compendium folder and
offer "Move old compendium to trash" for it (`trashFile(root)` on the vault root). Ticket Expected, verbatim:

> an empty (or `/`, or whitespace-only) destination is refused or ignored, and Sync never offers to trash
> the vault root.

Judge the change against D1-D4 (quote them from the ledger in your report where a finding cites them).
Probe at least:
1. **Every path to `trashFile` / migration / sync with a root:** command palette Sync, the Settings Sync
   button, the Migrate command, `offerMigration` and its callbacks (`syncAnyway`, `syncAfter`,
   `finishRemaining`), `LegacyCompendiumModal`'s choice callback (it re-reads `this.syncOptions()`),
   `CompendiumSyncService` itself (`applySync`'s own `trashFile` at ~line 239), `reconcile`, `detect`,
   `markSettled`. Can the vault root still reach any of them? Can the setting change between the modal opening
   and the click (user edits the field while the window is open) and slip past the guard?
2. **Inputs:** `''`, spaces, tabs, newline, ` ` and other Unicode whitespace, `/`, `//`, `.`, `./`, `..`,
   `../x`, `DS Compendium/..`, `./.`, `\`, a trailing slash, a leading slash (`/DS Compendium`). For each,
   what folder results, in Obsidian's REAL `normalizePath` (decompile/read it from the cached Obsidian
   `app.js` under `${XDG_CACHE_HOME:-~/.cache}/dse-e2e-obsidian`, or run it), not only the jest mock. Does the
   jest mock's `normalizePath` match the real one on these inputs? A guard that only works against the mock
   is a HIGH.
3. **D1 consistency:** with an empty setting, do Sync's write folder and every reader
   (`refs.ts`, `ReferenceResolver.ts`, `SccResolver.ts`, anything else reading the setting) agree on
   `DS Compendium`? Is the stored setting left untouched?
4. **Integrity probes** (file-writing code): in a mock vault with user notes at the root and in folders, every
   refused case leaves every file present and byte-identical; the D1 case writes only under `DS Compendium`.
5. **Tests:** are the new tests real (revert the fix in your scratch worktree and confirm they go red; mutate
   the guard — e.g. drop the `isRoot()` check, or the whitespace trim — and confirm a test catches it)?
6. **Real Obsidian, if feasible within about 45 minutes:** in your scratch worktree only (never committed),
   drive the real plugin in an e2e scratch vault with destination `''`, `'/'`, `'   '` and click Sync, with
   the release lookup stubbed (no network). SC-440's in-flight spec
   `/home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab/draw-steel-elements/e2e/specs/settings/compendium.e2e.ts`
   (`[SET-C03]`, ~line 98) and its driver's `releaseStub` show how; you may copy what you need into your scratch
   worktree. NEVER click "Move old compendium to trash"; close any such window through its X. Report which
   inputs open the window, which Notice shows, whether a lookup happened. If it is not feasible, say why.
7. **Gates:** re-run tsc, lint, full jest and full e2e on the head (not lifecycle; the implementer ran it).
   Expected at `8a81c5a7`: jest 12552 passed / 1 skipped WITH the shots cache (fresh: one fewer / 2 skipped) plus
   the branch's new tests; e2e `OBSIDIAN-E2E done: 478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`.
9. **r1 follow-up 3:** a vault that already synced with an empty setting has a manifest with `root: ""`. With D1 the next Sync targets `DS Compendium`. What does `applySync` (and any root-change handling) do with the old manifest root `""`: can it trash, move or overwrite anything outside compendium-tracked files, at the vault root? Probe it in a mock vault.
8. **Scope:** anything else the change broke (settings tab, the status row, Check for updates, first-run
   install with no folder). And one judgment question: the same "Existing compendium folder found / Move old
   compendium to trash" offer appears for ANY non-empty folder the user names (e.g. Destination `Notes`, their
   own notes folder). Is that a real data-loss risk worth its own ticket? Give evidence (what the window says,
   what the default button is) — do not fix it.

SAFETY, non-negotiable: never run a real Sync, move or trash against any vault but a throwaway test vault; no
network; never against `demo-vault/`, the main checkout, or Scott's vault.

## 3. Footguns (all apply)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r2-review/`,
  uniquely named scripts and logs inside it; write scratch files with the Write tool.
- NEVER `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, never `rm` with a shell-variable
  path, never a glob delete; leave throwaway files in place. (Exception: the literal
  `rm -f main.js styles.css` in a plugin root before jest, written as an absolute literal path in a script file.)
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd is inside your own worktree/scratch paths.
- `git -C <absolute path>` for every git command; never `cd` inside a compound command.
- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; record exit codes inside the script file;
  read each gate's own summary line. Never `--headed`.
- A call over 180 s is backgrounded by the Bash tool: log to a unique file, wait with
  `timeout 175 tail --pid=<your own pid> -f /dev/null`, then read the log. Never wait for a background-completion
  notice; never key a wait on a scratch file that may pre-date your run.
- Jest timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise.
- The main checkout's dirty `demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md` are Scott's
  live vault and expected — not foreign changes.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever
  do send a message, its FIRST WORD must be `SC-643:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX). Findings by severity (HIGH / MEDIUM / LOW /
INFO) with file:line, a failure scenario, and a prescribed fix.

## 5. Return contract

Your final text goes to the ticket-owner: raw facts, no prose. Verdict; findings list (severity, file:line,
one line each); measured gate lines; the input table (input → resulting folder / refusal, real vs mock);
mutation results; real-Obsidian probe result; the judgment on the "any non-empty folder" question; and the
absolute path of every artifact.
