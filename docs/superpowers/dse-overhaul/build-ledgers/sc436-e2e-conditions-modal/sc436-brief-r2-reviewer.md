# SC-436 round 2 — independent adversarial review brief

You review the SC-436 implementer's branch. You did not write it. Your final text goes to the
SC-436 ticket-owner, not a human.

## 1. Context loading

- Ledger (ticket scope + rulings, verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc436-e2e-conditions-modal/decisions.md`
  — read ALL of it, including the "Rounds" entries (they record which bugs were filed and
  which markers cite them). Implementer brief: `sc436-brief-r1-implementer.md`; implementer
  report: `sc436-r1-implementer-report.md` (same dir; read its executive summary and every
  later round section). **Workers never call the tracker.**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc436-e2e-conditions-modal`, branch
  `sc436-e2e-conditions-modal` in `draw-steel-elements/`, base dse develop `10db67e3` (rebased; was cut from 2ee2e405)
  (`git -C <dse dir> log --oneline 10db67e3..HEAD` is the diff under review). Do NOT commit to
  this branch. If you need to edit code for a probe, do it in a scratch `git worktree add` at
  an absolute path under your scratch folder, never re-pointed, and remove it by literal path
  when done.
- Prior art the reviewer of SC-435 found (do not re-find these as new; check this branch does
  not repeat their pattern): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool/sc435-r2-review-report.md`.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery,
  command shapes. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar (in the ledger) and the owner rulings. In
particular:

1. **Census completeness.** Enumerate every interactive node `ConditionsModal`
   (`src/views/ConditionsModal.ts`) can render, across states: no conditions, several
   conditions, a custom condition, the Add dropdown open, a row editor open (duration / colour
   swatches incl. custom colour / icon search + picks / effect), hero vs creature row. Does
   each carry a `data-dse-control` id, and do both censuses (`test/dom/e2eCensus.test.ts`,
   `e2e/specs/_census.e2e.ts`) actually cover those states — or pass vacuously because a state
   is never opened?
2. **Manifest honesty.** Every (control, interaction) pair listed and driven by real input in a
   plain (non-known-bug) test that asserts BOTH the note file and the screen. Find any pair
   whose driver asserts nothing meaningful, asserts only the screen, or would pass if the
   handler were deleted. Non-writing actions must be wrapped whole in `expectNoWrite`.
   Mutation-probe: break a handler (scratch worktree) and confirm the relevant e2e/jsdom test
   goes red. Both reach paths (hero row and creature row) must really be driven.
3. **Note-integrity probes** (ticket text): prose above/below the block byte-identical; a
   second initiative block in the same note untouched. Probe that they would catch a write
   that clobbers neighbouring content (e.g. mutate the writer in a scratch worktree).
4. **jsdom matrix.** Values × states × variants really exercised; no tautological
   expectations computed from the code under test.
5. **Product code changes** limited to `data-dse-control` attributes — no behavior change.
   The existing pilot ids (`cond.add`, `cond.input`, `cond.edit`, `cond.duration`,
   `cond.swatch`, `cond.effect`, `cond.icon-search`) kept, and the pilot specs still green.
6. **Known-bug markers** (see the ledger Rounds entries): each `knownBug` / `test.failing`
   fails today for the stated reason (not incidentally), and would pass under any reasonable
   fix. Independently confirm each bug reproduces. Also hunt for bugs the implementer missed
   (survey the surface yourself with jsdom probes). Known open tickets to cite rather than
   refile: SC-257, SC-355, SC-384, SC-555. Markers filed in r1: SC-580 (typing doesn't open
   the Add search), SC-581 (colour can't be cleared — marker must pass under EITHER a
   default/none option OR re-activating the selected swatch; probe both in a scratch
   worktree), SC-582 (swatch aria-label is hex), SC-583 (`key: Dazed` duplicates); plus e2e
   `knownBug` for SC-257, SC-384, SC-355.
6b. **`cond.color-custom`.** The implementer could drive it only to "Enter opens the native
   colour chooser, nothing written" (CDP can't reach the chooser), so the colour-change write
   path is jsdom only. Judge whether that pair's e2e driver is honest, and whether a real
   `input`/`change` event dispatch in Obsidian would be a better real-input approximation.
7. **Shared helpers** small and generic enough for SC-437.
8. Re-run the gates yourself: tsc, lint, jest, the full `npm run e2e` (twice — flake check),
   and lifecycle in the five `--only` parts below. Shots/freeze/parity: re-run only if the
   implementer's numbers look off or the diff touches rendered DOM in a way that could move
   print bytes. Jest gate rule (ledger): green, or only the two SC-568 load timeouts with both
   suites green alone — report loadavg.

Baseline at `10db67e3` (SC-558 landed; freeze baseline carries its sanctioned 78-line rebaseline): jest 6591 passed / 1 skipped / 258 of 259 · lifecycle 52/52 ·
e2e `163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` · shots 592, 0 FAIL,
host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

Lifecycle parts (each its own foreground call, `npm run obsidian-lifecycle -- --only=<ids>`):
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a`
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40`
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`
4. `G-S57 G-S62 G-S61 G-S56` (G-S56 stays last)
5. `G-S59 G-S49`
Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder.
Load: SC-556 and SC-558 run the same batteries concurrently; check `/proc/loadavg`, and give a
timeout/"environment" red at load > 15 one re-run at lower load (SC-517 RECOV-R07 is a known
load flake).

## 3. Footguns

- No compound `cd X && …`: `git -C <abs path>`, `devbox run -c <abs path> -- bash <script-file>`;
  the script file `cd`s and writes output to a unique log + exit code to a unique rc file.
  Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-rev-r2-<yourAgentId>/`; unique names inside.
- Never `rm` with a variable target, never a glob `rm`, never `rm -rf` under `/tmp` by pattern,
  never touch `.superpowers/` beyond your report file.
- One gate per Bash call, foreground. No background gates or Monitors (except shots past 600 s:
  then background with unique log + rc file and poll them — never wait for a notice).
- Never key a wait on a pre-existing scratch filename/contents. Redirect long output to files.
- Kill only by literal PID whose command line contains a path inside your own worktree (or
  `readlink /proc/<pid>/cwd` inside it). Never `pkill`/`killall` — SC-556 and SC-558 run the
  same gates concurrently.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. Need input → end with `STATUS: NEEDS_CONTEXT` + the question.
  Any stray message starts with `SC-436:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc436-e2e-conditions-modal/sc436-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, counts by
severity, your measured gate numbers). Then findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO),
each with file:line, the failure scenario, the probe that showed it, and a prescribed fix. Any
new product bug you find goes in a separate "Product bugs" section (title, repro, file:line,
severity) — the owner files those.

## 5. Return contract

Raw facts: verdict, severity counts, branch sha reviewed, measured gate numbers, report path,
paths of every probe log/artifact.
