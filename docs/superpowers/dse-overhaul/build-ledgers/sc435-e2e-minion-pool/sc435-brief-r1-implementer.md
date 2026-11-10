# SC-435 round 1 — implementer brief

You implement SC-435: real-Obsidian e2e + jsdom functional coverage of the minion stamina
pool modal, plus one e2e driver fix. Your final text goes to the SC-435 ticket-owner, not a
human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc435-e2e-minion-pool/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is
  your only source of ticket history. **Workers never call the tracker** (Linear) — not to
  read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc435-e2e-minion-pool`, branch
  `sc435-e2e-minion-pool` in `draw-steel-elements/`. Verify with `pwd`/`git -C` before every
  write. Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared
  main checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc435-e2e-minion-pool/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `6270e84a`. If it moved, `git rebase origin/develop`
  and say so in the report (then `npm ci` if `package.json`'s obsidian version changed).
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the SC-408 stamina
  pilot it describes: `e2e/manifest/stamina-edit-modal.ts`, `e2e/manifest/surface.ts`, the
  stamina-bar specs under `e2e/specs/stamina-bar/`, `e2e/driver/dse.ts`,
  `test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`. Then
  `src/views/MinionStaminaPoolModal.ts` (578 lines) and how the initiative tracker opens it.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, command shapes, footguns). Read it from the main checkout path; don't edit it.

## 2. The task

Scope and Done-bar, quoted from the ledger (ticket description, verbatim):

> **Scope:** `MinionStaminaPoolModal` (`src/views/MinionStaminaPoolModal.ts`), opened from the
> initiative tracker's minion squads. That covers the pool stepper and typed value, the
> minion-count box, the kill checkboxes and auto-check, the death ladder, refused-heal text,
> condition removal, Apply / Reset / Cancel / Escape, and the detail-row rebuild.
>
> **Also in this ticket:** a test-driver fix carried from the SC-408 review (R2 LOW-1).
> `dse.block()` (`e2e/driver/dse.ts:179-183`) marks a block as "being edited" even when a test
> only reads it, which could hide a stray write to that block. Mark a block only on a click,
> type or press inside it, or add a read-only accessor.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
> * Every interactive node on the surface carries a `data-dse-control` id. Both censuses cover
>   the surface: jsdom `test/dom/e2eCensus.test.ts` and real-Obsidian `e2e/specs/_census.e2e.ts`.
> * A manifest in `e2e/manifest/` lists every (control, interaction) pair. A full `npm run e2e`
>   drives each pair at least once through real input, asserting the note file and the screen.
>   At least one driver per pair is a plain test, not a known-bug test.
> * The combinatorial logic (values × states × variants) lives in jsdom matrix tests.
> * Every bug found gets a Backlog ticket in the DSE 7.0.0 project, labelled Bug + DSE Plugin.
>   The ticket gets a `knownBug('SC-…')` (e2e) or `test.failing` (jest) marker citing it. No
>   product fixes in the test ticket.
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full
>   coverage.

Owner rulings (quoted from the ledger):

> **SC-429 is Done** (its four defects were fixed after this ticket was written). So the
> description's "become known-bug markers" is stale: SC-429's four defects become **plain
> regression tests** (they must pass). If any of them still reproduces, that is a regression —
> report it as a new bug (below), do not mark it SC-429.

SC-429's four defects, for your regression tests: (1) lower the pool to 0 (all minions
auto-checked + disabled), press + to raise to 1 — the excess must un-check and Apply must be
reachable; (2) initial focus must not be "Decrease Stamina pool" (Space/Enter right after
opening must not decrement); (3) the minion-count box's max must not count dead minions;
(4) at rest the info text must not read "0 damage will kill 0 minion(s). Select 0 minion(s)
to kill." Check the current source for what each fix actually does and assert that.

> **Bug flow.** A worker that finds a product bug commits its coherent work, stops, and returns
> `STATUS: NEEDS_CONTEXT` with each bug's title, repro, file:line and severity. The owner files
> the Backlog ticket and resumes the worker with the key, which the worker then cites in
> `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket.

Batch bugs: finish the whole survey of the surface first (jsdom probes are cheap), then return
NEEDS_CONTEXT once with every bug found, not one at a time. Product source changes are
allowed ONLY to add `data-dse-control` attributes (and the census plumbing the pilot used) —
no behavior change.

> **Overlap with SC-436 (conditions modal) and SC-437 (initiative tracker).** They follow this
> ticket and touch the same e2e suite and coverage count. Keep new shared e2e helpers small and
> generic; the final report must list what SC-436/437 should reuse (helper names + paths).
> Don't pre-build their surfaces.

Commit inside `draw-steel-elements/` after every coherent step (attributes, census, driver
fix, jsdom matrix, manifest + specs). Never leave work uncommitted through a gate. Commit
messages: `test(SC-435): …` / `feat(SC-435): …`; no Claude/AI attribution or co-author
trailers. Do not push. Do not touch the superproject pointer.

## 3. Gates (dse-verify battery, in order, against the worktree)

Baseline at `6270e84a`: jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 ·
e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL,
host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

Expected after your work: tsc and lint clean; jest higher pass count, 0 failed (any
`test.failing` counted); lifecycle 52/52; e2e `N/N ok, 0 failed, K known-bug, coverage: Y/Y`
with Y > 89; shots 0 FAIL; freeze 280/280 (attribute-only changes must not move print bytes —
if one moves, stop and report, never touch the baseline); parity 0/0/24 (report any move in
host-leak or DOM numbers). Parity runs LAST.

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc435-e2e-minion-pool/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs one gate with output redirected to a
unique log and the exit code written to a unique rc file. Read each gate's summary line.

Lifecycle runs in FIVE `--only` parts, each its own foreground call
(`npm run obsidian-lifecycle -- --only=<ids>`), and you report the union:
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59 G-S49` (2)
Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private
`DSE_CAMERA_TMP` under your scratch folder.

## 4. Footguns (each cost real time once)

- No compound `cd X && …`. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write
  tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc435-impl-r1-<yourAgentId>/`
  — every script and log inside it uniquely named. Never a generic `gate.sh`.
- Never `rm` with a shell-variable target; never a glob `rm`; never `rm -rf` under `/tmp` by
  pattern; never `rm -rf` `.superpowers/`. Overwrite logs with `>` or use fresh names.
- One gate per Bash call, in the FOREGROUND. No `run_in_background`, no Monitor, for any gate
  except shots: if shots must go past 600 s, start it in the background with output to a
  unique log + rc file and **poll that log/rc file** — never wait for a completion notice; it
  never comes.
- Never key a wait-loop on a scratch filename or its contents from before your run — the
  scratch dir is pre-populated across sessions. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog
  kills silent agents). `devbox`'s `sh` wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats
  failures: capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose command line contains
  `worktrees/sc435-e2e-minion-pool/` (or whose `readlink /proc/<pid>/cwd` is inside it).
  Never `pkill`/`killall` by pattern — SC-561 and SC-563 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare
  the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's
  before believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has
  cached `visual-harness/dist/obsidian-app.css` — compare jest to baseline after a shots run.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do
  send a message anyway, its first word must be `SC-435:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc435-e2e-minion-pool/sc435-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, battery numbers vs
baseline, bug count). Then: commits (sha + subject); controls added (id list); manifest pairs
added (count + list); jsdom matrix tests added (file + what they cover); the `dse.block()`
fix (what changed, which call sites); bugs found (title, repro, file:line, severity — or
"none"); `Drive-by fixes:` and `Follow-ups:` sections; **"Reuse for SC-436/437"** (helper
names + paths); and every gate's log path and summary line.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha,
each gate's summary numbers, bug list (if NEEDS_CONTEXT), report path, and the filesystem path
of every evidence artifact you produced (logs, reports).
