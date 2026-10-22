# SC-279 r8 — rebase onto develop bc4a0c5, CHANGELOG/docs reconcile, regenerated rebaseline, full battery incl. e2e

> **RETARGET (2026-10-21, owner): immediately before the battery, fetch and rebase onto the latest origin/develop (minimum `54f8f88`, SC-483), not bc4a0c5; report that base. Expected (at 54f8f88) jest = 5601 / 1 skipped / 234 of 235 suites + ours; lifecycle 31/31; e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`; shots text-scale lines OK (develop: `text scale OK (1626 …)`, `text scale once OK (104184 / 208 loads …)`). Everything else unchanged. This overrides the bc4a0c5 / 5457 / 232-of-233 / 30-30 figures below.**

You are an implementer for SC-279 (DSE roll strip UI/UX). Your final text goes to the
ticket-owner, not a human.

## 1. Context loading (read first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/decisions.md`
  — read it all; the last two sections ("2026-10-17 — Scott's answer…" and "2026-10-21 — resume
  round") define this round. Prior-round reports in the same dir: `sc279-r6-rebase.md` (last
  rebase, how the CHANGELOG conflict was resolved), `sc279-r7-rebase-review.md` (INFO-2 below).
- Worktree (ALREADY EXISTS, do not `wt-new`): `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux`.
  DSE branch `sc279-roll-ux` @ `ae0efd8` (9 commits on `05a6ff3`); superproject branch
  `sc279-roll-ux` @ `41d9a0f` (4 DESIGN.md commits on an old main). Both unpushed — do NOT push.
- Verify `pwd`/paths before every write. **Workspace-level files (DESIGN.md) live in YOUR
  worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/DESIGN.md`
  — never under `/home/scott/code/steelCompendium/workspace/`.** The main checkout is shared state;
  never write there except your report into the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, ignore it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. Task

Scott's ruling (2026-10-17, verbatim, in reply to an ask that said 'Reply "all recommended" if the
defaults are fine.'):
> approved

Owner reading (from the ledger): no design change. Q1/Q2/Q3 keep what is built; Q4 no checkbox
tick; A1 sanctions the 2-line print rebaseline (`roll--steel-print.png`, `roll--steel-realprint.png`)
— the sanction covers those 2 lines, not specific hashes.

Do, in order, committing after each coherent step:

1. **Rebase DSE** onto `origin/develop` = **`bc4a0c5`** (`git -C <worktree>/draw-steel-elements
   fetch origin` first; confirm the sha; if develop has moved past bc4a0c5, rebase onto bc4a0c5
   anyway and say so). 225 commits landed since our base — expect conflicts in
   `CHANGELOG.md`, `docs/Roll.md`, `docs/settings.md`, `src/elements/statblock/view.ts`,
   `styles-source.css`, `visual-harness/entry.ts`, `visual-harness/shoot.mjs`. Resolve keeping
   develop's work plus ours. Run `npm ci` if `package.json`/lockfile changed (footgun: stale
   node_modules gives phantom tsc errors).
2. **SC-407 docs prune — follow develop, do not resurrect.** Develop DELETED `docs/Roll.md` and
   `docs/Media/roll.png` (SC-407 `454ce58`, "prune user docs to the 7.0.0 shipped set"; ds-roll
   is deferred to SC-402). Drop our edits to both (resolve the conflict as deleted). Keep our
   `docs/settings.md` wording only where it describes the ability-card roller under develop's
   `## Rolling` section, and only if it is still accurate. Check SC-407's docs-shots guard
   (grep for it in the repo: jest test or script) passes with the result.
3. **CHANGELOG reword (r7 INFO-2, owner ruling "FOLD"):** "CHANGELOG [FIX] bullet describes
   ds-roll, which SC-406 gates off in 7.0.0 → reword the bullet to the ability-card roller
   (ds-roll inherits it via SC-402)." Put it under develop's `## 7.0.0 (unreleased…)` section,
   consistent with SC-407's 7.0.0-scope prune. Keep the statblock/featureblock per-ability
   roll-settings fix as user-facing if a bullet for it exists.
4. **Text scale (SC-372):** our strip's captions use `--dse-fs-caption`; after rebase confirm it
   honors SC-372's per-root `--dse-fs-*` declaration and the text-scale prefs (shots lines
   "text scale OK", "text scale once OK" must stay OK). Fix in our CSS if not.
5. **Superproject:** rebase the superproject branch onto `origin/main` (`git -C
   /home/scott/code/steelCompendium/worktrees/sc279-roll-ux fetch origin`; currently `9f37173`).
   Resolve any DESIGN.md conflict keeping both. Then commit a pointer bump of
   `draw-steel-elements` to your rebased DSE head (message: `chore: bump draw-steel-elements to
   <sha> (SC-279 rebase)`). After the superproject rebase, run `git -C <worktree> submodule
   status` and make sure every OTHER submodule is at the pin origin/main expects (do not revert
   anything main moved on).
6. **Battery** — the `dse-verify` skill
   (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) owns the
   order and command shapes; read it. Expected numbers on THIS branch:
   - tsc (incl. `tsc -p e2e`) + lint clean
   - jest: develop is **5457 passed / 1 skipped / 232 of 233 suites**; ours = 5457 + our added
     tests (count them from our test diffs and state the arithmetic). Compare only after a
     shots run (fresh worktree reads 1 fewer passed / 2 skipped until shots caches the CSS).
   - lifecycle **30/30** (`OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed`). If you judge a
     lifecycle scenario is warranted, its id is **G-S22** — but do not add one unless asked;
     report the idea instead.
   - e2e **REQUIRED**: `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
   - shots: develop 580 + our 12 screen-only = **592, 0 FAIL**, text-scale lines OK.
   - freeze: baseline is **280** lines. Expected: exactly 2 mismatches — `roll--steel-print.png`
     and `roll--steel-realprint.png` — and nothing else. Any other mismatch is a regression: stop
     and report it (SC-349, parked, may later re-hash 40 print lines; none are roll and none
     should move on this branch).
   - parity LAST: **0 GAPs / 0 undeclared WARNs / 24 declared**.
7. **Regenerate the rebaseline:** two deterministic full shots runs; the two roll print hashes
   must match across both. Write them (sha256sum format, same as today) to
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-rebaseline.txt`
   — first copy the current file to `sc279-rebaseline.pre-r8.txt` in the same dir. Say whether
   the hashes changed vs the old file (old: `84eaaf74…` print, `16d5edbd…` realprint). Also
   prove: baseline with those 2 lines substituted → freeze 280/280 OK (do it on a COPY of the
   baseline in your private scratch folder; NEVER edit
   `.superpowers/sdd/freeze-baseline.sha256`). If hashes changed, save before/after crops of the
   two print shots (PNG) to `sc279-r8-evidence/`.
8. Shoot fresh evidence for the owner: copy the post-rebase roll shots matching the r4 evidence
   set (ds-roll collapsed, expanded, card after first click; dark) into
   `.../sc279-roll-ux/sc279-r8-evidence/` and say whether each is byte-identical to its
   counterpart in `sc279-r4-evidence/`.

## 3. Rules / footguns (each cost real time once)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command. Every git command as `git -C <absolute path>`.
- **Exit codes come from a script FILE**: write a per-gate script (Write tool) in your private
  scratch folder and run `devbox run -c <dse path> -- bash <script>`; the script runs one gate,
  redirects output to a log, and writes `$?` to `<log>.exit`. `bash -c '…; echo $?'` under devbox
  always records 0. **One gate per call.** Read each gate's summary line, not just the code.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r8-impl/`
  — uniquely named scripts/logs inside it; never a generic `gate.sh` at the scratchpad root.
  Gate logs that are evidence go to the ledger dir prefixed `sc279-r8-`.
- Use the Write tool for scratch files (not heredocs). **No glob `rm`**, ever; delete only paths
  you created and recorded. Never `rm -rf` `/tmp/dse-obsidian-lifecycle-*` or any shared glob,
  and never touch the shared `.superpowers/` dir beyond your own `sc279-` files.
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose command line contains
  `worktrees/sc279-roll-ux/`, or (for `node visual-harness/shoot.mjs`, which has no path in its
  command line) whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms); lifecycle takes
  ~4.5 min, shots several minutes. Never park waiting on a background job's notification — a
  job you start does not wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output, or a per-run
  unique path.
- If a doc-reading jest test (e.g. `token-coverage.test.ts`) fails on a token the main checkout's
  `docs/superpowers/dse-overhaul/D3-token-map.md` has, compare the two copies first; it may be the
  stale-superproject footgun (fixed by your superproject rebase in step 5, or by
  `DSE_TOKEN_MAP_PATH` pointing at the main checkout's copy).
- Never create a tag or release on draw-steel-elements. Never push.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input
  mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll resume you. If you
  ever message anyway, the first word must be `SC-279:`.
- `Drive-by fixes:` (obviously correct, local to a file you touched, cannot move a gate) are
  allowed — list them. Anything else goes under `Follow-ups:`; do not expand scope.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r8-rebase.md`,
opening with a ≤10-line executive summary.

## 5. Return contract
Final text: raw facts, no prose — STATUS (DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT),
DSE head sha + base sha, superproject head sha + base sha, each conflict and how it was resolved
(one line each), every gate's measured summary line vs expected, rebaseline hashes (changed or
not), Drive-by fixes, Follow-ups, and the absolute path of every evidence artifact (report, logs,
rebaseline, crops, shots).
