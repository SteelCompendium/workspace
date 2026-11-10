# SC-437 round 2 — independent reviewer brief

You review SC-437's branch: real-Obsidian e2e + jsdom functional coverage of the initiative
tracker (`ds-initiative`), plus a census-scope fix. You did not write it. Your final text goes
to the SC-437 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc437-e2e-initiative-tracker/decisions.md`
  (ticket scope verbatim, Scott's rulings verbatim, owner rulings, rounds). It is your only
  source of ticket history. **Workers never call the tracker** (Linear) — not to read, not to
  post.
- The implementer's report: `sc437-r1-implementer-report.md` in the same dir (read both
  executive summaries — phase A and `## Phase B` — then dive only where you need to).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc437-e2e-initiative-tracker`, branch
  `sc437-e2e-initiative-tracker` in `draw-steel-elements/`. The head sha and the base are in the
  dispatch message. Do NOT commit to this branch. For mutation probes, make a scratch
  `git worktree add` at an absolute path inside your scratch folder, and remove it with
  `git -C <dse dir> worktree remove <literal abs path>` when done.
- Prior art for the shape: SC-435's landed ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool/`
  (`sc435-r2-review-report.md` shows what a review of this kind found last time).
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read from the
  main checkout path; don't edit it).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar and the owner rulings (both in the ledger). In
particular:

1. **Surface completeness — the big one.** The ticket says "about 60 interactions"; the branch
   lists 29 new pairs on top of the pilot's. Enumerate independently every interactive node
   `src/elements/initiative/view.ts` (and what it mounts, plus `ResetEncounterModal`) can render,
   across variants: hero rows (portraits on and off), single creatures, minion squads with and
   without a captain, groups, turn pips / action pips, malice (stepper, quick-add, log), round
   advance, reset turns, title edit, chrome-panel items, selection, keyboard paths (Enter /
   Space / arrows / Escape where handlers exist). List any node without an id and any real
   interaction (a handler that exists) missing from the manifest. Out of scope (ledger
   "Surface boundary"): StaminaEditModal, MinionStaminaPoolModal internals, ConditionsModal
   internals (SC-436).
2. **Census fix (R1 L-4).** Both censuses now scope by the tracker root/rows/grid. Prove they
   are not vacuous: mutation-probe by adding an un-id'd button to a row in `view.ts` (scratch
   worktree) and confirm BOTH the jsdom census and the real-Obsidian census (`_census.e2e.ts`)
   go red. Check the allowlist does not swallow ids it shouldn't (e.g. a blanket prefix).
3. **Manifest honesty.** Every pair driven by real input in a plain (non-known-bug) test that
   asserts BOTH the note file and the screen. Find drivers that assert nothing meaningful,
   only the screen, or would pass with the handler deleted. Mutation-probe at least four
   handlers of different kinds (malice stepper, round advance, captain make/relieve, title
   commit, reset confirm) and confirm the relevant e2e/jsdom test goes red.
4. **jsdom matrix.** Values × states × variants really exercised; no tautological expectations
   computed from the code under test.
5. **Known-bug markers** — SC-575, SC-576, SC-577, SC-578 (SC-579 was canceled: not reproducible
   in real Obsidian; it is now a plain e2e test `[INIT-M08]` — confirm that) and any later key in
   the ledger. Each marker fails today for the stated reason (not incidentally) and would pass
   under any reasonable fix. SC-578's marker must assert ONLY the ledger's invariant (log entry
   and pool change agree, OR the entry shows the clamp). The implementer read "shows the clamp"
   as "the entry label no longer reads 'Spend'" — judge whether that clause would pass
   vacuously under an unrelated relabel, and prescribe a tighter assertion if so. Independently confirm each bug
   reproduces. Check the implementer's real-Obsidian finding on SC-576 (do enemy rows vanish
   after Reset → Yes in real Obsidian?) and on candidate 6 (identical-bytes write) — reproduce
   both yourself.
6. **Hunt for missed bugs** on the surface (jsdom probes are cheap; real-Obsidian where the
   echo re-render matters). Known open tickets to cite rather than re-report are listed in the
   ledger.
7. **Product code changes** limited to `data-dse-control` attributes and census plumbing — no
   behavior change. Diff `src/` against the base and check every hunk.
8. **Integrity probes** for the writes this surface makes (title, malice, actions, captain,
   reset): content above/below the block survives; a second initiative block in the same note
   is untouched. Say whether the specs cover this; if not, probe it yourself.
9. **Re-run the gates yourself:** tsc, lint, jest (gate rule in the ledger — report loadavg),
   the full `npm run e2e` (twice — flake check), and lifecycle in the five `--only` parts
   below. Shots/freeze/parity: re-run only if the implementer's numbers look off or the diff
   touches rendered DOM in a way that could move print bytes.

Baseline at `f69b8fd6` (SC-556 landed; the branch must be rebased onto it): jest 6634 passed / 2 skipped / 258 of 259 on a fresh worktree · lifecycle 52/52 · e2e
`163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` · shots 592, 0 FAIL,
host-leak 163/978 · freeze 280/280 · parity 0/0/24. The implementer's expected coverage after
this branch: 142/142 (re-count yourself).

Lifecycle parts (each its own foreground call, `npm run obsidian-lifecycle -- --only=<ids>`):
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST
5. `G-S59 G-S49` (2)
Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder.

## 3. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. `git -C <abs path>` for every git command;
  `devbox run -c <abs path> -- bash <script-file>` for every devbox call, the script file
  `cd`ing in and running ONE gate with output to a unique log and the exit code to a unique rc
  file. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-rev-r2-<yourAgentId>/`
  — uniquely named scripts and logs. Never a generic `gate.sh`.
- Never `rm` with a shell-variable target; never a glob `rm`; never `rm -rf` under `/tmp` by
  pattern; never `rm -rf` `.superpowers/`.
- One gate per Bash call, in the FOREGROUND. No `run_in_background`, no Monitor — except shots
  past 600 s: then background it with output to a unique log + rc file and poll those files;
  never wait for a completion notice, it never comes.
- Never key a wait-loop on a scratch filename or its contents from before your run.
- Redirect long output to files (the 600 s stream watchdog kills silent agents). devbox's `sh`
  wrapper eats `$?`/`$PIPESTATUS`; `| tail` eats failures.
- Kill scratch processes only by literal PID whose command line contains your worktree or
  scratch path (or whose `readlink /proc/<pid>/cwd` is inside it). Never `pkill`/`killall` by
  pattern — SC-436 and SC-556 run the same gates concurrently.
- On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its first
  word must be `SC-437:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc437-e2e-initiative-tracker/sc437-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by
severity, gate numbers, new-bug count). Then findings by severity (CRITICAL / HIGH / MEDIUM /
LOW / INFO), each with file:line, the failure scenario, how you probed it, and a prescribed
fix. Product bugs go in their own section (title, repro, file:line, severity, known-ticket
match). Then every gate's log path and summary line.

## 5. Return contract

Final text: raw facts, no prose — verdict, counts by severity, each finding's one-line title
with file:line, product bugs (title + severity), gate numbers, report path, and the path of
every evidence artifact you produced.
