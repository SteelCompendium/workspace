# SC-643 r1 — implementer brief

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/decisions.md`.
  It is the spec. You never call the tracker (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination`, plugin at
  `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/draw-steel-elements`, branch
  `sc643-sync-empty-destination`. Verify `pwd`/`git -C <abs> branch --show-current` before any write. NEVER
  write under `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (shared main checkout; its dirty
  `demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md` are Scott's live vault and expected).
- Base: dse `develop` @ `8a81c5a7`. `git -C <plugin abs> fetch origin` and confirm `origin/develop` is still
  `8a81c5a7`; if it moved, rebase onto it and say so.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 1-240 (battery,
  devbox shapes, exit-code footgun, jest timeouts, lifecycle part notes). It is ~460 KB: read only those parts.
- Plugin repo's own `AGENTS.md`/`CLAUDE.md` if present.

## 2. The task

Bug: if the Destination folder setting (`compendiumDestinationDirectory`) is empty, the plugin treats the
vault root as the compendium folder; `syncCompendium()` in `main.ts` (~line 703) finds a non-empty root
`TFolder`, and on a vault with no sync manifest opens `LegacyCompendiumModal` ("Existing compendium folder
found") whose "Move old compendium to trash" choice calls `this.app.fileManager.trashFile(root)` on the
VAULT ROOT. Also reproduces with `/`. Ticket "Expected", verbatim:

> an empty (or `/`, or whitespace-only) destination is refused or ignored, and Sync never offers to trash
> the vault root.

Implement the owner decisions D1-D4 in the ledger exactly (quote, from the ledger):

> - **D1. Empty or whitespace-only Destination folder = the default folder `DS Compendium`** (the value the
>   field's placeholder already shows, `DEFAULT_SETTINGS.compendiumDestinationDirectory`). Sync, the
>   migration offer, the "Migrate compendium" command and every link/reference resolver that reads the
>   setting use the SAME resolved folder, so links resolve where Sync wrote. The stored setting is not
>   rewritten.
> - **D2. A Destination that resolves to the vault root (`/`, `.`, `./`, `//`, ` / `, and anything else
>   that normalizes to the root) is refused:** Sync and Migrate do nothing to the vault (no lookup, no
>   window, no write, no trash) and show a Notice naming the setting.
> - **D3. Defence in depth:** the vault root is never handed to `trashFile`, never offered in the
>   "Existing compendium folder found" window, and never used as the migration root, whatever path reached
>   it (guard at the trash site and in the service, not only in `syncOptions`).
> - **D4. No Settings-tab UI change in this ticket** (no inline validation message): keeps shots/freeze
>   untouched and stays out of SC-440's spec files.

Guidance (not a straitjacket):
- One small pure resolver (e.g. in `src/model/` or next to the settings) that maps the raw setting to either a
  normalized folder path or a "vault root" refusal, used by `syncOptions()` / `syncCompendium()` /
  the Migrate command (`main.ts` ~796, `offerMigration`) AND by the readers of the setting:
  `src/framework/seams/refs.ts:106,138`, `src/utils/ReferenceResolver.ts:111,129`,
  `src/refs/SccResolver.ts:145`. Survey for any other reader (`grep -rn compendiumDestinationDirectory`,
  and `syncOptions().root` / `options.root` consumers in `src/data/`, incl. `CompendiumSyncService`,
  the migration service, `reconcile`, `detect`, `markSettled`).
- Work out empirically (unit test against Obsidian's `normalizePath` as the repo's jest mock implements it,
  and read what real Obsidian's `normalizePath` does with `''`, `'/'`, `'.'`, `'./'`, `'  '`, `' / '`) which
  inputs reach the root. Report the table you measured. Do not hard-code an assumption you didn't check.
- Notice wording for D2: plain, names the setting, e.g. "Draw Steel Elements: the Destination folder can't be
  the vault root. Choose a folder in Settings → Compendium." (adjust to the plugin's existing Notice style).
- D3 guard at the trash site: a folder that `isRoot()` (or path `'/'`/`''`) is never trashed; if it is ever
  reached, no trash, no modal, Notice instead.

Tests (jest, real-behaviour, red on `8a81c5a7` where a bug exists — prove it by running the new tests against
the pre-fix `src`/`main.ts` and reporting how many go red):
- Resolver unit table: `''`, `'   '`, `'/'`, `'.'`, `'./'`, `'//'`, `' / '`, `'DS Compendium'`,
  `' My Compendium '`, `'a/b/'`, `'DS Compendium/'`.
- `syncCompendium()` in the existing DOM harness (`test/dom/framework/syncCompendiumBusy.test.ts` shows how
  the plugin is constructed against the mock vault): with a non-empty mock vault and no manifest,
  destination `''` / whitespace → no "Existing compendium folder found" window for the root, `trashFile` never
  called with the root, sync targets `DS Compendium`; destination `/` (and the other root forms) → Notice,
  no sync call, no migration call, no window, no trash, no vault write. Integrity probe: every pre-existing
  vault file is still present and unchanged after each case.
- The Migrate command with the same inputs.
- Readers: a reference/SCC link resolves under `DS Compendium` when the setting is empty.
- Existing settings-tab / legacy-modal / sync tests stay green.
- No e2e change in this round (SC-440's spec files are not on develop; SC-441 owns sync-modal e2e).

SAFETY, non-negotiable: never run a real Sync, move or trash against any vault but a throwaway test vault —
jest mocks and the gate runners' own scratch vaults only; never against `demo-vault/` or Scott's vault; no
network calls in tests.

Commit after every coherent step (`fix(SC-643): …` / `test(SC-643): …`), on the worktree's plugin branch.
Do not push. No CHANGELOG edit (owner handles it). Never put a bracketed ticket id in a test title (the e2e
runner reads titles for scenario ids); jest `describe`/`test` titles may name SC-643 without brackets.

## 3. Gates (dse-verify battery) — expected numbers at dispatch

Baseline at `8a81c5a7`: tsc + lint clean · jest 12552 passed / 1 skipped WITH the shots cache (a fresh
worktree reads one fewer passed / 2 skipped — measure and report your fresh figure, then the delta your tests
add) · lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`
· shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Run: tsc, lint, jest (`rm -f main.js styles.css` in the plugin root first), lifecycle, full e2e.
Shots / freeze / parity: if `styles.css` built from your head is byte-identical (sha256) to one built from
`8a81c5a7`, they carry — report both hashes and skip them. Otherwise run them.

Lifecycle runs in SEVEN `--only` parts, one part per Bash call, output to a unique log, poll your own pid:
1. `G-S7a … G-S9a` (21) — take the exact id lists from SKILL.md's lifecycle row; the parts are
   `G-S7a…G-S9a` 21; `G-S9b…G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9;
   `G-S57,G-S62,G-S61,G-S56` 4 (G-S56 stays LAST); `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7;
   `G-S92,G-S96,G-S97,G-S99` 4; `G-S108,G-S112,G-S115` 3 (part 7 ~200 s).
- `--only=` takes comma-separated ids. A call over 180 s is backgrounded by the Bash tool: start each part
  with output to a unique log file, then wait with `timeout 175 tail --pid=<your node pid> -f /dev/null`
  (pick the pid whose `readlink /proc/<pid>/cwd` is YOUR worktree's `draw-steel-elements`), repeat until it
  exits, then read the log's `done` line.
- A G-S91 FAIL is a real signal unless it says the host was too slow after two re-runs.
- G-S115 (g) suspected flake (SC-633): a (g) red that shows the "changed on disk first" Notice on a loaded
  host gets one re-run of part 7; a red on the re-run, on a quiet host, or in any other G-S115 cell is real.
- SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty (in YOUR worktree),
  which makes G-S97 fail; `git -C <plugin abs> checkout -- demo-vault/.obsidian/appearance.json` before
  blaming the change.
- Jest's default timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise.

Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/draw-steel-elements -- bash <script file>`.
Record exit codes from inside a script FILE (never an echoed `$?` in a `bash -c` string, never a pipe on a
gate). Read each gate's own summary line as the truth.

## 4. Footguns (all apply)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r1-impl/`,
  uniquely named scripts and logs inside it. Write scratch files with the Write tool.
- NEVER `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and never `rm` with a
  shell-variable path: leave throwaway files in place; overwrite with `>` or use fresh names. (Exception:
  the literal `rm -f main.js styles.css` in YOUR plugin root before jest — write it with the absolute literal
  path inside your gate script file.) Never delete a shared `/tmp` glob or anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside your worktree.
- `git -C <absolute path>` for every git command; never `cd X; git …`; never `cd` inside a compound command.
- Never `--headed` e2e.
- Run each gate as one blocking foreground call where it fits; for longer ones, log to a file and poll your
  own pid/log as above. Never wait for a background-completion notice and never key a wait-loop on a scratch
  filename or contents from before your run — the scratch dir is pre-populated across sessions.
- Redirect long output to files rather than streaming it (600 s stream watchdog).
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question. If you ever do send a message, its FIRST WORD must be `SC-643:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-r1-implementer-report.md`,
opening with a ≤10-line executive summary.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Verdict; head sha and commit list;
files changed; the normalizePath table you measured; every gate's summary line and number (jest fresh figure +
delta; lifecycle per part; e2e done line; styles.css hashes or shots/freeze/parity lines); how many new tests
are red on the pre-fix code; `Drive-by fixes:` and `Follow-ups:` lists; and the absolute path of every evidence
artifact (logs, report).
