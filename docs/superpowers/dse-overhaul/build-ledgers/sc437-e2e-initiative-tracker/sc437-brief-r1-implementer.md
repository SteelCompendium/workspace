# SC-437 round 1 — implementer brief

You implement SC-437: real-Obsidian e2e + jsdom functional coverage of the initiative tracker
(`ds-initiative`), plus a census-scope fix. Your final text goes to the SC-437 ticket-owner,
not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc437-e2e-initiative-tracker/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is
  your only source of ticket history. **Workers never call the tracker** (Linear) — not to
  read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc437-e2e-initiative-tracker`, branch
  `sc437-e2e-initiative-tracker` in `draw-steel-elements/`. Verify with `git -C` before every
  write. Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared
  main checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc437-e2e-initiative-tracker/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `10db67e3`. If it moved, `git rebase origin/develop`
  and say so in the report (then `npm ci` if `package.json`'s obsidian version changed).
  Run `npm ci` once in the worktree's `draw-steel-elements/` if `node_modules` is missing.
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art:
  the SC-408 stamina pilot (`e2e/manifest/stamina-edit-modal.ts`, `e2e/manifest/surface.ts`,
  `e2e/specs/stamina-bar/`, `e2e/driver/dse.ts`), and SC-435's minion pool rollout, which landed
  the same shape you are building: `e2e/manifest/minion-pool-modal.ts`, `e2e/specs/minion-pool/`,
  `e2e/driver/pool.ts`, `test/dom/views/minion-stamina-pool-modal-matrix.test.ts`. Its reuse
  notes, from its report:
  - `e2e/driver/dse.ts`: `dse.editedFences(rel)` (read-only accessor); `MODAL_KINDS` entry
    pattern (add one key per new modal, matched by one of its own control ids); `dse.modal(kind)`.
  - `e2e/driver/pool.ts` (copy the shape, do not extend it): `openPoolModal`, `poolBoxes()` /
    `poolInfo()` (page-side reads of repeated nodes, because `expect($$()[n]).not.toBeExisting()`
    throws "Index out of bounds" instead of passing), `cellText(root, key)` (roster cell text by
    `data-instance-key`).
  - Fixtures: `Initiative/squad.md`, `Initiative/squad-hurt.md`; the tracker rewrites a string
    condition (`- grabbed`) as `{ key: grabbed }` on its first write.
  - Gotchas: after a roster-cell dblclick, `dse.settle()` before an `expectNoWrite` (the
    selection write lands late); `dse.press(' ')`-style page presses (no target) are recorded
    as `(page)` and are exempt from the manifest check; a driven pair on a control not in any
    manifest fails the gate; the coverage gate keys (control, kind) across manifests, so a
    `reach` row another manifest already lists costs no extra pair.
  - The full prior ledger is `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool/`
    (read its r1 report's executive summary only if you need more).
- Then the surface: `src/elements/initiative/view.ts` (~2100 lines), `model.ts`,
  `src/views/ResetEncounterModal.ts`, the existing `e2e/manifest/initiative.ts` and
  `e2e/specs/initiative/*.e2e.ts`, and the initiative parts of `test/dom/e2eCensus.test.ts`
  and `e2e/specs/_census.e2e.ts` (CENSUS-04).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, command shapes, footguns). Read it from the main checkout path; don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there.
The owner rulings in the ledger bind you; the ones that shape the work, quoted:

> **Surface boundary.** In scope: every interactive node the tracker itself renders
> (`src/elements/initiative/view.ts` and what it mounts: header/title, round and turn controls,
> turn pips, malice, hero and creature rows, the roster grid, selection, captain, minion-squad
> and group controls, the chrome-panel items) plus ResetEncounterModal in full (confirm,
> cancel, Escape / close). NOT in scope (owned elsewhere — only `reach` rows, which already
> exist or cost no extra pair): the StaminaEditModal and the tracker's stamina entry points
> (SC-408 pilot, landed); the MinionStaminaPoolModal internals (SC-435, landed — reuse its
> `pool.ts` driver); the ConditionsModal internals and its tracker reach rows (`init.cond.add`,
> hero AND creature) — **SC-436, running in parallel** (worktree `sc436-e2e-conditions-modal`).
> Do not add or change ids inside the conditions modal or edit
> `e2e/manifest/conditions-modal.ts`. If the census scope fix needs the conditions reach ids
> allowlisted, allowlist them by the ids that exist on develop today.

> **Census fix (R1 L-4).** Replace the CSS-class lookup with container scoping (the tracker
> root / each row / the grid) in BOTH censuses, so any eventful node anywhere in the tracker
> must carry an id from the initiative manifest or an allowlisted other-surface id (stamina,
> pool, conditions reach rows). Prove it catches a regression: a jsdom test that injects an
> un-id'd button into a row and expects a census finding.

> **Existing pilot manifest.** `e2e/manifest/initiative.ts` already exists (SC-485 pilot:
> `init.hero.turn`, `init.reset-encounter`, `init.reset-encounter.confirm`). EXTEND it to the
> whole tracker; keep the existing ids and specs green. Rename an existing id only if it is
> genuinely wrong, and say why in the report.

> **Bug flow.** A worker that finds a product bug commits its coherent work, finishes the
> survey, and returns `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line
> and severity. The owner files the Backlog ticket and resumes the worker with the key, which
> the worker then cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this
> ticket; product source may change ONLY to add `data-dse-control` attributes (and census
> plumbing) — no behavior change.

Known open tickets on this surface (cite, don't report as new): SC-291, SC-292, SC-270, SC-250,
SC-384, SC-393, SC-506/SC-568, SC-569, SC-572/573/574 — one-line descriptions in the ledger.
SC-556 (outside edit vs an open edit form) is in flight; if a title-edit bug looks like it,
report it and say so.

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the tracker renders (use `controlId.ts` /
   the kit helpers the pilot used). Ids prefixed `init.` (ResetEncounterModal: `init.reset-encounter.*`).
   Hero rows and creature rows, single creatures, minion squads (incl. captain), groups,
   turn pips, malice, round/turn controls, title edit, chrome-panel items. Use fixtures that
   reach every variant; add new ones under the e2e vault's `Initiative/` if needed.
2. The census fix above, in both censuses, plus the injected-button regression test.
3. The manifest: every (control, interaction) pair (click, dblclick, key presses, type, hover
   where it is functional, etc.), with the same comment style as the existing manifests.
4. jsdom matrix tests for the combinatorial logic (e.g. turn order × round advance × acted
   state; malice values; captain/squad/group variants; selection across row kinds; reset
   confirm vs cancel; title edit commit/cancel/empty). Put them under `test/dom/` next to the
   existing initiative tests.
5. The bug survey: probe the surface (jsdom probes are cheap) for real defects. Batch them.
6. Commit inside `draw-steel-elements/` after every coherent step. Messages
   `test(SC-437): …` / `feat(SC-437): …`; no Claude/AI attribution or co-author trailers. Do
   not push. Do not touch the superproject pointer.
7. Gates for phase A only: tsc, lint, jest (full run, per the jest gate rule), and the jsdom
   census. No e2e/lifecycle/shots yet. Then write the report and return
   `STATUS: NEEDS_CONTEXT` — **even with zero bugs** — with the pair list and the bug list.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/initiative/` driving every manifest pair through real input,
asserting the note file and the screen (at least one plain driver per pair); the real-Obsidian
census extended; markers citing the keys the owner gives you; then the full battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `10db67e3`: jest 6591 passed / 1 skipped / 258 of 259 suites (SC-568 load
timeouts possible; green alone) · lifecycle 52/52 · e2e `163/164 ok, 0 failed, 1 known-bug
(SC-572), coverage: 113/113 pairs` · shots 592, 0 FAIL, host-leak 163/978, capture clip OK
(147 …) · freeze 280/280 · parity 0/0/24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (any `test.failing`
counted; SC-568-class timeouts allowed only if each failing suite is green alone).
On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached
`visual-harness/dist/obsidian-app.css` — that is expected in phase A; say so.

Phase B (later): lifecycle 52/52; e2e `N/N+K ok, 0 failed, K known-bug, coverage: Y/Y` with
Y > 113; shots 0 FAIL; freeze 280/280 (attribute-only changes must not move print bytes — if
one moves, stop and report, never touch the baseline); parity 0/0/24 (report any move in
host-leak or DOM numbers). Parity runs LAST. Lifecycle runs in FIVE `--only` parts, each its
own foreground call (`npm run obsidian-lifecycle -- --only=<ids>`):
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59 G-S49` (2)

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc437-e2e-initiative-tracker/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a
unique log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-<yourAgentId>/`
  — every script and log inside it uniquely named. Never a generic `gate.sh`.
- Never `rm` with a shell-variable target; never a glob `rm`; never `rm -rf` under `/tmp` by
  pattern (other efforts' lifecycle vaults match those globs); never `rm -rf` `.superpowers/`.
  Overwrite logs with `>` or use fresh names.
- One gate per Bash call, in the FOREGROUND. No `run_in_background`, no Monitor, for any gate
  except shots: if shots must go past 600 s, start it in the background with output to a
  unique log + rc file and **poll that log/rc file** — never wait for a completion notice; it
  never comes.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private
  `DSE_CAMERA_TMP` under your scratch folder.
- Never key a wait-loop on a scratch filename or its contents from before your run — the
  scratch dir is pre-populated across sessions and branches. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog
  kills silent agents). `devbox`'s `sh` wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats
  failures: capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose command line contains
  `worktrees/sc437-e2e-initiative-tracker/` (or whose `readlink /proc/<pid>/cwd` is inside
  it). Never `pkill`/`killall` by pattern — SC-436 and SC-556 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare
  the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's
  before believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: "main"` reaches the dispatcher, not me). If
  you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your
  report; I will resume you. If you ever do send a message anyway, its first word must be
  `SC-437:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc437-e2e-initiative-tracker/sc437-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs
baseline, control count, pair count, bug count). Then: commits (sha + subject); controls added
(id list, grouped by area); manifest pairs (count + full list); the census fix (what changed in
each census, the regression test); jsdom matrix tests added (file + what they cover); fixtures
added; bugs found (title, repro, file:line, severity, and whether it matches a known open
ticket — or "none"); `Drive-by fixes:` and `Follow-ups:` sections; and every gate's log path
and summary line. Phase B will append to this same file under a `## Phase B` heading.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha,
each gate's summary numbers, control count, pair count, bug list (title + severity + file:line),
report path, and the filesystem path of every evidence artifact you produced (logs, reports).
