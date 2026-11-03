# SC-547 r1 brief — implement the per-pass callout fence list, measure before/after, run the battery

You are an implementer for ticket SC-547. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (read first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/decisions.md`
  (current rulings; read it in full).
- The finding you are fixing: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc537-lp-callout-twins/sc537-r5-rereview-report.md`
  — exec summary item 7, §3 "LOW-1 cost in real Obsidian", §5 LOW-1. Background on the SC-537 design:
  `sc537-r4-fix-report.md` in the same dir (exec summary only unless you need more).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf`; plugin at
  `/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements`, branch
  `sc547-lp-twin-check-perf`, cut from dse `develop` @ `367a2f1d`. Verify `pwd`/`git -C <path> branch --show-current`
  before any write. Before starting: `git -C <plugin path> fetch origin` and confirm `origin/develop` is still
  `367a2f1d`; if it moved, rebase onto it and say so in the report (with the new sha).
- Never work in `/home/scott/code/steelCompendium/workspace/` (the shared main checkout). Its dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
  Any workspace-level file you touch (e.g. `CHANGELOG.md`) is YOUR worktree's copy:
  `/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/CHANGELOG.md`, never under `workspace/`.

## 2. The task
Ticket text (verbatim): "SC-537 makes DSE check identical callouts after every edit, scroll and cursor move in Live
Preview. For each block, the check rescans every line of the callout the block sits in, so the cost grows with the
square of the number of blocks in one callout. … **Fix idea:** build each callout's list of fences once per pass, not
once per block (`src/framework/host/ReadingModeBlockHost.ts`, around `locateInSectionLines` / `fenceOnElement`)."

Where: `fenceOnElement` (`ReadingModeBlockHost.ts:332`, the quote/callout branch calls
`locateInSectionLines(lines, section, alias, null, quoteOrdinal(el, alias, blocksCache), null)` at :359 once per entry),
reached from `reusedBlockBody` (:618–640, `scope?.blocks`) and the pass scope built in `remountReused.ts:108`
(`blocks: new Map()`). Add a per-pass cache next to `scope.blocks` so each callout window's fence list is scanned once per
pass and each entry looks its fence up by ordinal. Make the cost per pass linear in blocks per callout.

Owner rulings (verbatim from the ledger):
- "INFO-1's optional extra (skip a selectionSet-only update whose selection did not enter or leave a callout) is OUT of
  scope: it changes which updates run the check, and SC-537 r5 showed G-S57 does not cover the selectionSet term
  (mutant 6 passed). Scope is the per-pass fence-list cache only; the set of updates that run a pass stays exactly as on
  develop."
- "no lifecycle perf scenario (timing in lifecycle is load-sensitive and would flake). Regression guard is a jest test
  that counts line scans per pass (linear, not quadratic)."

Requirements:
- Behaviour must be identical: same fence chosen for every entry, same ordinal semantics, same handling of an
  unterminated fence, no-section, alias filtering. The cache lives only for one pass (never across passes — the doc changes
  between passes). Calls of `fenceOnElement` without a pass scope (e.g. `remountReused.ts:78`, and the Reading-view paths)
  keep working uncached.
- Do not touch `replaceSource` (SC-552 is working there), the LP callout click path (SC-545), or the scroll pin (SC-472).
  If you find you must, stop and return STATUS: NEEDS_CONTEXT.
- Tests (TDD): (a) a jest test that a pass over one callout window holding N same-alias blocks scans that window's lines
  once (or a constant number of times), not N times — e.g. a counter/spy on the scan, checked at N=40; show it RED on
  `367a2f1d` source and GREEN after; (b) a behaviour test that with the cache every entry of a mixed callout (twins,
  several aliases, an unterminated last fence) resolves to the same fence as without it. The existing `twin-reuse` and
  `livePreviewScrollHold` suites must stay green. Run one mutant: drop the cache (fall back to per-entry scan) — test (a)
  must go red.
- Add a `## Unreleased` bullet to YOUR worktree's `CHANGELOG.md`, plain words, e.g. "Live Preview: scrolling and typing in
  a callout holding many blocks is no longer slowed by the identical-callout check." Update the ARCHITECTURE/docs comment
  where SC-537's twin check is described if it mentions per-entry rescans (grep the plugin's `docs/` and `ARCHITECTURE.md`).
- Commit after each coherent step (tests, fix, docs). Commit messages: no AI attribution / co-author trailers.

## 3. Measurement in real Obsidian (the deciding evidence)
The SC-537 r5 reviewer's probe harness survives at
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r5-review-a1c8475e199b5ef3f/`
(`harness-r537.mjs`, `mkharness.py`, `probe.sh`, `build.sh`, `bundle-*`, `runs/*/r537.json`; cases `cost-big`
= the 40-counter callout `bigcallout.md`, `cost-large` = the 125 KB note, `many-scroll` = 30 small callouts). It is READ-ONLY
to you: copy what you need into your private folder (below). Its harness was a copy of the `aca83702` lifecycle harness that
pinned port 9539; since SC-551 the real harness picks an OS-assigned CDP port and checks ownership — prefer porting the
R537 cost cases onto a scratch copy of the `367a2f1d` `scripts/obsidian-lifecycle.mjs` (never edit the tracked one for
this), so runs cannot collide with other efforts.

Run the three cost cases in one session on three bundles, each in its own Obsidian:
`88cb7db9` (pre-SC-537 — the r5 copy `bundle-88cb7db9` is fine), `367a2f1d` (develop, before), and your HEAD (after).
Report for each: editor pass per keystroke mean/p95/max, full keystroke dispatch mean, cursor-move passes and per-pass
mean, scroll passes and per-pass mean, scroll frame mean/p95. Note the load average (`uptime`) at each run. Expected
"before" ≈ the ticket's numbers (7.8 ms per keystroke pass, 24.7 / 41.7 ms frames; pre-SC-537 19.7 / 29.6). Target
"after": per-pass cost for the 40-block callout down to about the 125 KB note's level (≈1–2 ms) and scroll frames within
noise of pre-SC-537. Also run a scaling sweep on HEAD and on `367a2f1d`: one callout with 10 / 20 / 40 / 80 counters,
per-pass mean — the point is to show quadratic before, linear after. If a number is noisy, run it twice and report both.

## 4. Gates — the `dse-verify` skill
Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery table + the CURRENT block
at ~line 1282). Do NOT edit that file; if a number changes and the CURRENT text needs an update, write proposed text to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/sc547-dse-verify-proposal.md`.
Expected at `367a2f1d` (CURRENT): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6326 passed / 1
skipped / 252 of 253 suites** (fresh worktree 6325 / 2 until a shots run caches `obsidian-app.css`; yours adds your new
tests) · lifecycle **48/48** in FOUR `--only` parts: part 1 `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3
G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21), part 2 `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11
G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16), part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52` (7),
part 4 `G-S57 G-S62 G-S61 G-S56` (4) — no private `DSE_LIFECYCLE_PORT` needed since SC-551; **G-S57 and G-S61 must be
green** · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL,
button host-leak 161/966 (use a private `DSE_CAMERA_TMP` under your scratch folder for anything camera-based) · freeze
**`freeze OK (280/280 …)`** (no CSS change expected, so no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Run in the skill's order, parity last.

## 5. Harness footguns (each cost real time once)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements -- bash <script file>`.
  Never a compound `cd X && …`; never `cd` inside `bash -c`. Record exit codes from inside a script file (devbox eats `$?`),
  and read each gate's own summary line. Never pipe a gate into `tail`.
- **One gate per Bash call, in the foreground, blocking.** Each lifecycle part is its own call; e2e and shots are their
  own calls; stay under the 600 s tool timeout. No `run_in_background`, no `Monitor`, no waiting for a notification —
  a job you start does not wake you. If something must run in the background, poll its own log/exit-code file.
- Redirect long output to a log file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r1-impl-<your agentId>/`
  — every script and log you write goes there with a unique name. The scratchpad is shared by every agent. Write scratch
  files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir holds stale logs from other sessions and
  branches. Read the process's own output or a per-run unique path.
- `rm`: never with a shell-variable target (`rm $X/...` hangs on a prompt), never a glob, never under a shared `/tmp`
  pattern (e.g. `/tmp/dse-obsidian-lifecycle-*`). Delete only paths you created, by literal absolute path — or just leave them.
  Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern — other efforts run the same commands. Kill only a PID whose `readlink /proc/<pid>/cwd`
  or command line is inside your worktree / your scratch folder.
- Every git command as `git -C <absolute path> …`.
- `npm ci` if `node_modules` is missing or stale in the fresh worktree.

## 6. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/sc547-r1-impl-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, HEAD sha, the before/after table's two key numbers, gate
numbers). Then: diff summary with file:line, tests added with red/green proof and the mutant result, the full
measurement table (three bundles × three cases + scaling sweep, load averages), every gate's summary line,
`Drive-by fixes:` and `Follow-ups:` lists. Copy gate logs and the measurement JSON into the ledger dir with the
`sc547-r1-` prefix. If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract
Final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch + HEAD sha, the measured numbers, gate
summary lines, and the absolute filesystem path of every evidence artifact you produced (report, logs, JSON).
You cannot `SendMessage` me — a depth-2 agent cannot reach its parent, and `to: 'main'` goes to the dispatcher, not me.
If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever
send a message anyway, its first word must be `SC-547:`.
