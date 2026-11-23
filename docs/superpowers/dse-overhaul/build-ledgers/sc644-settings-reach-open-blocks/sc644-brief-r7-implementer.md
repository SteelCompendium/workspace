# SC-644 r7 implementer brief — final rebase + full battery (no product change expected)

Your final text goes to the SC-644 ticket-owner, not a human. Raw facts only (verdict, shas, measured numbers), no prose.
**Workers never call the tracker** (Linear) — not to read history, not to post.

You are a FRESH worker replacing the earlier author (prior session). All context is in files.

## 0. Context loading

- Ledger (rulings, current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md`
  Read the tail: "PARKED on Scott (2026-11-14)" and "Scott's rulings (2026-11-22)".
- Scott's ruling, verbatim from the ledger: **S1 (2026-11-22): "Go with recommendation"** — the recommended
  "Start collapsed" behaviour already on the branch stands. `START_COLLAPSED_REACHES_OPEN_BLOCKS` stays `false`.
  So there is NO product change in this round. The work was reviewed twice (r4 LAND, r6 LAND). Only the bases moved.
- Mechanics that still govern (worktree rules, `git -C`, devbox shapes, gate battery mechanics, known flakes, the SC-622
  appearance.json restore, commit rules): `…/sc644-settings-reach-open-blocks/sc644-brief-r1-implementer.md` — read its
  mechanics/footgun/gate sections (skip its task section; that task is done). Where its numbers differ from this brief, this brief wins.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — "The battery, in order"
  (lines ~20-250) for command shapes. Do NOT read the whole 2400-line file. Its CURRENT numbers block is stale
  (`129beb18`); the numbers in §2 below are the ones to compare against.
- Last round's report (shape to follow): `…/sc644-settings-reach-open-blocks/sc644-r5-impl-report.md`.

Worktree (verify `pwd` / paths before any write; never write under `/home/scott/code/steelCompendium/workspace/` except
the ledger dir report):
- superproject: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks` (branch `sc644-settings-reach-open-blocks`)
- plugin: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/draw-steel-elements` (branch
  `sc644-settings-reach-open-blocks`, head `2762beb5`, 7 commits on old base `10c271fe`)
- The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault. Not yours, do not touch, do not report.

## 1. Task

1. **Plugin rebase.** `git -C <plugin> fetch origin`, then rebase the branch onto `origin/develop` = **`3b47e55b`**
   (92 commits ahead of the old base; if origin/develop has moved past 3b47e55b, use the newer sha and report it).
   Develop touched two of our nine files, in regions away from ours: `src/framework/pipeline.ts` (SC-652: the
   `emptyPrefPassthrough` import + `prepareModel` passthrough lines) and `src/elements/hero/view.ts` (SC-662: two
   `undoIsStale` guards in undo callbacks). Expect a clean rebase. If there IS a conflict, resolve it keeping BOTH sides'
   intent, and list each conflicted file + hunk in the report (the reviewer checks them). Keep the 7 commits as 7 commits
   (no squash) so the range-diff stays readable. Record `git -C <plugin> range-diff 10c271fe..2762beb5 3b47e55b..HEAD`
   output to a file in your scratch folder and report its path.
2. `npm ci` through devbox in the plugin if `package.json` / `package-lock.json` differ between `10c271fe` and the new base
   (check with `git diff --stat`); stale `node_modules` give phantom tsc errors.
3. **Semantic check after the rebase** (cheap, before gates): develop gained e2e specs and jsdom tests since `10c271fe`.
   `grep` the rebased tree for other `knownBug('SC-644'` markers (expect exactly ZERO after our commits apply — ours turned
   SET-L01 and SET-G06 into plain tests) and for any new caller of the e2e driver's `setPrefs` whose behaviour our LOW-6
   change (flush, then wait until data.json on disk equals memory) could alter. Report what you found; do not "fix" other
   tickets' specs — if something of theirs breaks because of our change, report it with the failing line.
4. **Superproject rebase.** `git -C <superproject> fetch origin`, rebase onto `origin/main` = **`1c877748`** (or newer —
   report the sha). End state: exactly TWO commits on top of origin/main — the CHANGELOG commit (`e0be5a87`'s content:
   our bullet under `## Unreleased`; resolve the CHANGELOG conflict by keeping every other bullet main has and adding
   ours), then exactly ONE pointer bump `chore: bump draw-steel-elements to <new head> (SC-644)`. Drop the old pointer
   commit `7d8ca778` and recreate it at the end; no interim pointer commits. Do not run `git submodule update` in the
   worktree (it would detach the plugin from its branch); the pointer bump is `git -C <superproject> add draw-steel-elements`
   + commit. Verify `git -C <superproject> diff --stat origin/main..HEAD` shows only `CHANGELOG.md` and `draw-steel-elements`.
5. **Full battery on the final rebased head** (§2). If a gate shows a real failure caused by the rebase, fix it minimally in
   a NEW commit (`fix(SC-644): r7: …`), describe it under "Changes this round", and re-run the affected gates. If the fix
   is more than a mechanical adaptation to a renamed/moved API, STOP and return `STATUS: NEEDS_CONTEXT` with the facts.
6. Push NOTHING. No tags. No `just wt-finish`. Commit messages carry no AI attribution / co-author trailers.

Out of scope (do not touch): SC-645, SC-647, SC-657 (SET-X03 flake), SC-668 (G-S61), SC-654 (INIT-W10) and their markers.

## 2. Gates — expected numbers

Baseline at dse develop `3b47e55b` (SC-675 owner's numbers): jest **13855 passed / 2 skipped fresh** (13856 / 1 with the
shots cache) · lifecycle **63/64 or 64/64** (the only tolerated red is G-S61 on its torn-read line = SC-668, red on base
too; if it is red, re-run that part once and report both results) · e2e
**`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** · shots **592**, host-leak **163/978**,
modal host-leak **40/240**, capture clip **147** · freeze **280/280** · parity **0 / 0 / 24**.

Expected on the rebased SC-644 head:
- tsc (incl. `tsc -p e2e`) and lint: clean.
- jest: **13897 passed / 1 skipped** with the shots cache (13896 / 2 before shots has run) = base + 41. Explain any difference.
- lifecycle: 64/64 (or 63/64 with G-S61 only, per above).
- e2e: **`662/669 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`** (two markers become plain tests: +2 ok, −2
  known-bug; SET-L05 / SET-L06 new: +2 ok, +2 total). Known flakes: SET-X03 + dependent SET-X04 (SC-657), INIT-W10
  (SC-654). If a full run fails ONLY those, re-run the full e2e once and report both summary lines. Any other failure:
  report the test id, its message, and whether it also fails on a clean `3b47e55b` (use `--only=<id>` with an equals sign
  on both).
- shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24 — unchanged (our diff has no CSS; run them anyway,
  this is the landing battery).

Gate mechanics (each cost real time once):
- Node/just are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …` in a compound command. `devbox run … bash -c '…; echo $?'` always records 0 — record exit
  codes from inside a script FILE, and read each gate's own summary line. Never pipe a gate into `tail`.
- Run every gate as ONE blocking foreground call with output redirected to a uniquely named log file (the 600 s stream
  watchdog kills silent agents; a 10-minute tool timeout applies — split lifecycle / e2e / shots into separate calls,
  and split e2e/lifecycle by part if one call would exceed it). No `run_in_background`, no Monitor, no waiting for a
  notification: a job you background never wakes you. If something must run in the background, poll its own log / pid.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Scratch: create and use ONLY
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc644-r7-impl/`
  with uniquely named scripts and logs. Write scratch files with the Write tool (no heredocs into scratch).
- No `rm` with a glob or a shell variable; never `rm -rf` anything under `/tmp` by pattern or under `.superpowers/`.
  Overwrite with `>` or use fresh names.
- Never `pkill` / `killall` by pattern. Kill only a PID you started, after checking `readlink /proc/<pid>/cwd` is inside
  your worktree. Other efforts run the same gates concurrently.
- Every git command is `git -C <absolute path> …`, never `cd X; git …`.
- The freeze baseline `.superpowers/sdd/freeze-baseline.sha256` is shared: read-only for you.
- Commit after every coherent step; nothing uncommitted sits through a gate.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/sc644-r7-impl-report.md`,
opening with a ≤10-line executive summary: verdict; dse head + base; superproject head + base; every gate's measured line
vs the expected line above; rebase conflicts (none / list); range-diff result (N commits identical / which differ).
Then: conflicts in detail, "Changes this round" (expected: none), `Drive-by fixes:`, `Follow-ups:`.

Final text to me: the executive summary plus the absolute path of every evidence artifact (logs, range-diff file, report).
If the report-file write is blocked by your harness, return the report inline.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and
the question in your report — I see your completion notification and will resume you with the answer. If you ever do send
a message anyway, its FIRST WORD must be `SC-644:`.
