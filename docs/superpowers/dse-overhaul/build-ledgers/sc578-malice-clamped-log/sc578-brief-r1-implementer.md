# SC-578 r1 implementer brief — the Malice log records what the pool actually did

Your final text goes to the SC-578 ticket-owner, not a human. **Workers never call the
tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc578-malice-clamped-log/decisions.md`
  (the ledger — decision D1 is your spec; quote it, do not reinterpret it).
- Prior art (read the executive summaries only):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc577-malice-negative/`
  (`sc577-r1-impl-report.md`, `sc577-r3-fix-report.md`) — SC-577 just made Malice floor at 0
  through one shared helper `addToMalicePool` in `src/elements/initiative/model.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log`, branch
  `sc578-malice-clamped-log` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log/draw-steel-elements`
  (call it `$DSE` below; spell the absolute path out in commands). Verify with
  `git -C $DSE rev-parse --abbrev-ref HEAD` and `git -C $DSE log -1 --format=%h` before any
  write: expect `sc578-malice-clamped-log` @ `93b3a382`. First `git -C $DSE fetch origin`; if
  `origin/develop` has moved past `93b3a382`, rebase onto it and report the new base.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery order, command shapes, freeze/parity rules). Read it before running gates.

## 2. The task (decision D1, verbatim from the ledger)

> 1. `amount` in a log entry is the change actually applied to the pool (value after − value
>    before, both via `maliceValueOf`). The log always adds up to the pool's movement.
> 2. When the applied change differs from what was asked (the typed quick-add amount, or the
>    configured `round_gain`), the entry also stores the asked-for amount in a NEW optional
>    field `requested: number`. Entries that were not capped carry NO `requested` key (byte
>    shape of existing and unclamped entries is unchanged).
> 3. The log line for a capped entry reads `R<round>: <amount> — <label> (<requested>, capped at 0)`,
>    e.g. `R2: -2 — Spend (-5, capped at 0)`. Unclamped lines are unchanged
>    (`R2: -2 — Spend`).
> 4. A zero amount renders as `0`, not `+0`.
> 5. Advance round from 0 with a negative `round_gain` STILL logs its entry (amount 0,
>    requested = the gain): `R3: 0 — Round gain (-3, capped at 0)`. Reason: the round gain
>    happened; the log should say why the pool did not move. (Quick-add of a non-zero amount
>    that applies 0, e.g. −5 from 0, logs the same way.)
> 6. One code path: both Advance round and the quick-add go through one shared helper
>    (adding to the pool, computing the applied change, and building/appending the entry), so
>    the two paths cannot drift again.
> 7. The stale doc comment on `MaliceLogEntry` (`EncounterData.ts`, "`amount` is always the
>    event's magnitude (never signed to mean "spend")") is corrected to describe the signed,
>    applied amount and `requested`.

Where the code is:
- `src/elements/initiative/model.ts` ~465-500: `advanceRound`'s round-gain block,
  `maliceValueOf`, `addToMalicePool` (its comment at ~495 says logging a clamped change "is the
  caller's (and SC-578's) concern" — update it).
- `src/elements/initiative/view.ts` ~596-603 (log line rendering) and ~680-681 (quick-add
  submit: `addToMalicePool` then `appendMaliceLogEntry`).
- `src/drawSteelAdmonition/EncounterData.ts` ~525-570: `MaliceLogEntry`, `appendMaliceLogEntry`.
- Check `parse` / `serialize` in `model.ts` (the SC-466/SC-482 key-order rules) and any
  validator: the new `requested` key must round-trip, sit after `label` in key order, and be
  absent on unclamped entries. Grep `round_gain` / `log` across `src/`, `test/`, `e2e/`,
  `docs/`, `.repo-docs/` for every other reader of the log shape.

Tests (ship with the fix, per the repo's conventions):
- jsdom `test/dom/elements/initiative-matrix.test.ts`: the `test.failing('[M09] …[known bug SC-578]')`
  at ~914 becomes a normal passing test (drop the known-bug wording, keep `[M09]`); the comment
  in the `[M03-M05]` title at ~426 that defers wording to SC-578 is updated. Add rows for:
  quick-add −5 from 2 (amount −2, requested −5, rendered text); quick-add −5 from 0 (amount 0,
  rendered `0`, not `+0`); an unclamped spend and gain carry no `requested` key; Advance round
  `round_gain: -3` from 0 (amount 0, requested −3) and from 1 (amount −1, requested −3);
  positive round gain unchanged; parse→serialize round-trip keeps `requested` and its key order.
- e2e `e2e/specs/initiative/malice.e2e.ts` ~112: the `knownBug('SC-578', '[INIT-M09] …')`
  becomes a plain test with the same scenario id. **The e2e runner reads test titles for
  scenario ids — never put a bracketed ticket id (e.g. `[SC-578]`) in any test title.**
  Consider tightening it to assert D1 exactly (amount −3 and requested −5 for Malice 3, −5).
  Optional: an e2e for the Advance-round path if the runner's coverage manifest makes it
  cheap; if you add a new scenario id, declare it the way the e2e README says, and scenario
  ids are global (a duplicate exits 2).
- No new lifecycle scenario is expected. If you find you need one, the id is `G-S82`.

Docs (part of done):
- Plugin `$DSE/CHANGELOG.md`: a `[FIX]` bullet under the unreleased section (follow SC-577's
  bullet as the pattern).
- `$DSE/docs/initiative-tracker.md` (and `$DSE/.repo-docs/integration.md` if it describes the
  log entry shape): describe the applied amount and the `requested` field / capped wording.
- Workspace `CHANGELOG.md` `## Unreleased` bullet. **The workspace-level files live in YOUR
  worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log/CHANGELOG.md`
  — never under `/home/scott/code/steelCompendium/workspace/`.** Commit it in the worktree
  superproject (`git -C /home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log …`),
  doc file only — do NOT commit a submodule pointer bump there (landing does that).

Commit inside `$DSE` after each coherent step (fix, tests, docs), messages prefixed
`fix(SC-578):` / `test(SC-578):` / `docs(SC-578):`. Do not push.

## 3. Gates (dse-verify, full battery, in order) and expected numbers

Baseline at `93b3a382`: tsc clean · lint clean · jest **7107 passed / 1 skipped** (more after
your new rows; SC-568 load timeouts are possible — re-run that suite alone, green alone is
fine) · lifecycle **53/53** · e2e **258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs**
→ expected after: SC-578 leaves the known-bug set, so **5 known-bug**, ok count +1 (plus any
tests you add), still **0 failed** and `coverage: Y/Y` (RECOV-R07 is a documented load flake —
re-run once if it alone fails) · shots **592**, host-leak **163 kinds / 978 comparisons**,
modal host-leak **39 kinds / 234 comparisons**, capture clip **147** · freeze **280/280**
(expected unchanged: no fixture holds a capped entry; if any frozen byte moves, STOP and
report — do not touch the baseline) · parity **0 / 0 / 24** (0 GAPs, 0 undeclared, 24
declared), run LAST.

Lifecycle runs in FIVE `--only` parts, each its own foreground Bash call, in this order
(G-S56 stays LAST in SCENARIOS order):
1. `G-S7a … G-S9a` (21 scenarios) 2. `G-S9b … G-S40` (16) 3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4) 5. `G-S59 G-S49 G-S73` (3). Take the exact id lists for
parts 1 and 2 from the SCENARIOS order in dse-verify / the lifecycle script. Total 53/53.

## 4. Footguns (every one has cost real time)

- **Never a compound `cd`.** Use `git -C <abs path>` for every git command and
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log/draw-steel-elements -- <cmd>`
  (or `-- bash <script file>`) for node/npm. Verify `pwd`/branch before any write.
- **Private scratch:** create
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-impl-r1-<yourAgentId>/`
  and keep every script, log and rc file there with unique names. Write scratch files with the
  Write tool, not heredocs.
- **Never `rm` with a variable target**, and **never a glob `rm` under /tmp** (other efforts'
  lifecycle/e2e vaults match the same globs). Overwrite with `>` or use fresh unique names.
- **One gate per Bash call, in the foreground.** No background gates, no Monitor — except
  shots, which may run in the background; then poll ITS OWN log/rc file in your private
  subfolder, never wait for a notification.
- Redirect long gate output to a file (the 600 s stream watchdog kills silent agents), and
  record exit codes from a script file run through devbox — `bash -c '…; echo $?'` under
  devbox always records 0. Read each gate's own summary line.
- **Never set `DSE_LIFECYCLE_PORT`.** Give each lifecycle/e2e/shots run its own
  `DSE_CAMERA_TMP` inside your private subfolder.
- **Kill scratch processes by literal PID only**, and only one whose `readlink /proc/<pid>/cwd`
  or command line is inside your worktree. Never `pkill`/`killall` by pattern.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output or a per-run
  unique path.
- `npm ci` if `node_modules` is missing or stale in the worktree (phantom tsc errors).
- If `token-coverage.test.ts` reports a phantom red about `D3-token-map.md`, compare the
  worktree copy against the main checkout's before believing it (stale superproject pin);
  `DSE_TOKEN_MAP_PATH` override clears it.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked
  `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — it is
  not yours, don't touch it, don't report it.
- If the report-file write is blocked by your harness, return the report inline.
- **You cannot `SendMessage` me** — `to: 'main'` reaches the dispatcher, not me. If you need
  input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume
  you. If you ever do send a message anyway, its FIRST WORD must be `SC-578:`.
- Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to
  move a gate baseline — list them under `Drive-by fixes:`. Anything else goes under
  `Follow-ups:` untouched.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc578-malice-clamped-log/sc578-r1-impl-report.md`.
It opens with a ≤10-line executive summary (verdict, final dse sha, superproject doc-commit
sha, every gate's measured number). Then: files changed, the helper's signature, test rows
added, `Drive-by fixes:`, `Follow-ups:`.

## 6. Return contract

Final text: raw facts, no prose — verdict (DONE / BLOCKED / NEEDS_CONTEXT), dse branch sha
and base, superproject commit sha, measured numbers per gate (tsc, lint, jest passed/skipped,
lifecycle per part and total, e2e summary line verbatim, shots count + host-leak + modal +
clip, freeze line verbatim, parity counts), and the absolute path of every evidence artifact
(report, gate logs).
