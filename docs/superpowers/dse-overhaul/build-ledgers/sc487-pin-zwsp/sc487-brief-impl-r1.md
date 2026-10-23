# SC-487 implementer brief — round 1

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/decisions.md` (owner rulings O1–O6 are your task; quote them, do not reinterpret). Read the SC-457 r4 report for the prior measurements and probe method: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/sc457-rereview-r4-report.md` (R4-BREAK probe; INFO-1).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gates, command shapes) and `draw-steel-elements/AGENTS.md` in your worktree.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp`; dse repo `/home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp/draw-steel-elements`, branch `sc487-pin-zwsp`, at `d152ea4` (= `origin/develop`). Run `git -C <dse path> fetch origin` and confirm `origin/develop` is still `d152ea4`; if it moved, rebase onto it and say so in the report.
- Verify `pwd`/paths before every write: all edits go in the worktree, NEVER under `/home/scott/code/steelCompendium/workspace/` (that is the shared main checkout). The workspace-level CHANGELOG lives in YOUR worktree superproject at `/home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp/CHANGELOG.md`. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task (rulings from the ledger, verbatim)

> - O1. **Part 1 — no anchor for an unregistered type.** The pin path must check, BEFORE any vault write, that the alias is one the sidebar can actually mount. If it is not: write nothing into the note (file bytes identical) and show one Notice. Put the check in the shared bind path (`bindBlockToSidebar` or wherever `_dse_anchor` is stamped) so every entry point that stamps an anchor refuses the same way, and `requestPinToSidebar` maps that result to the Notice. Use the same "can the sidebar mount this alias" definition SC-471 settled (its branch gates on `services.registry.get(alias)` with a fix so element ids such as `statblock` do not count — read `/home/scott/code/steelCompendium/worktrees/sc471-sidebar-hotkey-fence/draw-steel-elements/src/framework/sidebar/registration.ts` read-only; do not import from or merge that unlanded branch). Keep the registration.ts change small: SC-471 also edits that file and whoever lands second rebases.
> - O2. **Part 2 — the name rule follows what Live Preview renders.** Measure first in real Obsidian 1.14.4 (Reading view and Live Preview) for: trailing U+200B, U+200B inside the name (`ds-co​unter`), U+200B right after the backticks; the same three for U+FEFF; trailing U+200C, U+200D, U+2060. Then: if Live Preview renders the opener as a DSE block, `fenceLanguage` must return that block's registered name; if neither mode renders it, DSE must not claim it. Expected outcome: the name ends at the first whitespace (JS `\s`) or zero-width character Live Preview treats as a terminator. Leading skip stays `[ \t]` only (SC-457 LOW-1). **If the inside-the-name case shows Obsidian STRIPS the character rather than ending the name there, or a leading zero-width character renders, stop and return NEEDS_CONTEXT with the table** — the owner rules before that is implemented.
> - O3. One shared rule: `fenceLanguage` in `src/framework/host/blockPrefix.ts` stays the single definition; e2e `typeOf` follows the same rule; the expected-language table in `test/unit/e2eIntegrity.test.ts` gains a row per measured opener.
> - O4. Integrity probes (writes into user files): after the fix, pinning the trailing-U+200B block in Live Preview stamps the anchor, mounts the panel, a panel write lands; bytes above and below the block and the opening line (including the U+200B) survive byte-for-byte; an unregistered alias leaves the note byte-identical and shows the Notice exactly once.
> - O5. Tests: jest for the parse table and the O1 guard (every entry point that stamps). One real-Obsidian lifecycle scenario **G-S33**: Live Preview "Pin to sidebar" on a trailing-U+200B block → anchored, panel mounted (not `data-dse-sidebar-unavailable`), panel write lands. It must FAIL on `d152ea4`. No edits to existing e2e specs; e2e driver `typeOf` only.
> - O6. CHANGELOG `## Unreleased` bullet in the WORKTREE superproject.

Order: (1) measurement table (O2) — write it into your report before changing code; (2) O1 guard + jest; (3) O2/O3 parse change + table rows; (4) G-S33 — prove it fails on `d152ea4` (e.g. by stashing/reverting only the src change, or running it against a `d152ea4` build) and passes on HEAD; (5) CHANGELOG; (6) full battery. Commit after every coherent step (dse commits in the dse repo, CHANGELOG commit in the worktree superproject; do NOT bump the superproject's submodule pointer — landing does that). No push.

Probe notes in Obsidian: put a ZWSP etc. into fixture text with explicit escapes (`​`) in JS, never by pasting — and confirm the byte sequence on disk (`od -c` / `xxd`) for each probe note.

## 3. Gates (dse-verify battery, in order) — expected numbers

tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5769 + your new tests passed / 1 skipped / 238(+new suites) of 239(+new)** · lifecycle **`OBSIDIAN-LIFECYCLE done: 33/33 ok, 0 failed`** (32 + G-S33) · e2e **`OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (run parity LAST). Any deviation: explain it, don't paper over it.

Command rules (each of these has stalled or broken a worker before):
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp/draw-steel-elements -- bash <script file>`. **Never `cd` inside a compound command**; every git command is `git -C <absolute path>`.
- Record exit codes from a script FILE run through devbox (the `bash -c '…; echo rc=$?'` form always records 0). Read each gate's own summary line.
- Write scripts and logs ONLY in your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r1/` with uniquely named files (e.g. `sc487-r1-jest.sh`, `sc487-r1-jest.log`). The scratchpad is shared by every agent. Create scratch files with the Write tool, not heredocs.
- **No glob `rm`** (never `rm -f $S/*.rc`, never `rm -rf /tmp/dse-*`). Delete only a path you created and recorded. Never touch `.superpowers/` outside `sc487-pin-zwsp/`.
- **Run each gate as ONE blocking foreground Bash call** (split lifecycle / e2e / shots / parity into separate calls to stay under the 10-minute tool timeout). No `run_in_background`, no Monitor, no waiting for a notification. Redirect gate output to a log file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9287) for lifecycle; other sessions may be running it.
- Never `pkill`/`killall` by pattern. Kill only a PID you verified is yours (`readlink /proc/<pid>/cwd` inside your worktree).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output or a per-run unique path.
- `npm ci` first if `node_modules` is missing or stale.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-impl-r1-report.md`. It must open with a ≤10-line executive summary (verdict, dse head sha, superproject sha, gate numbers). Then: the O2 measurement table (opener × Reading view rendered × Live Preview rendered × DSE language before × after); the diff summary by file; G-S33 fail-on-base evidence; integrity probe results; `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict (DONE / NEEDS_CONTEXT / BLOCKED), shas, measured numbers, no prose — plus the absolute path of every evidence artifact (report, logs, screenshots, probe notes).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-487:`.
