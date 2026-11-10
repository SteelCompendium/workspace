# SC-435 round 2 — independent adversarial review brief

You review the SC-435 implementer's branch. You did not write it. Your final text goes to the
SC-435 ticket-owner, not a human.

## 1. Context loading

- Ledger (ticket scope + rulings, verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc435-e2e-minion-pool/decisions.md`.
  Implementer brief: `sc435-brief-r1-implementer.md`; implementer report:
  `sc435-r1-implementer-report.md` (same dir; read its executive summary, r1b section, and
  "Reuse for SC-436/437"). **Workers never call the tracker.**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc435-e2e-minion-pool`, branch
  `sc435-e2e-minion-pool` in `draw-steel-elements/`, base dse develop `6270e84a`
  (`git -C <dse dir> log --oneline 6270e84a..HEAD` is the diff under review). Do NOT commit to
  this branch. If you need to edit code for a probe, do it in a scratch `git worktree add` at
  an absolute path under your scratch folder, never re-pointed, and remove it by literal path
  when done.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery,
  command shapes. The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar (in the ledger) and the owner rulings. In
particular:

1. **Census completeness.** Enumerate every interactive node `MinionStaminaPoolModal` can
   render, across states (pool 0, all dead, heal refused, conditions present/absent, detail
   rows rebuilt). Does each carry a `data-dse-control` id, and do both censuses
   (`test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`) actually cover the modal — or
   do they pass vacuously because the modal is never opened?
2. **Manifest honesty.** Every (control, interaction) pair listed and driven by real input in
   a plain (non-known-bug) test that asserts BOTH the note file and the screen. Find any pair
   whose driver asserts nothing meaningful, asserts only the screen, or would pass if the
   handler were deleted. Mutation-probe: break a handler (scratch worktree) and confirm the
   relevant e2e/jsdom test goes red.
3. **jsdom matrix.** Values × states × variants really exercised; no tautological
   expectations computed from the code under test.
4. **SC-429 regressions** — plain, passing, and each would fail if its fix were reverted
   (probe by reverting the fix in a scratch worktree).
5. **`dse.block()` fix** (SC-408 R2 LOW-1): a read-only use no longer marks the block as
   edited; a stray write to a read-only block would now be caught. Probe it.
6. **Product code changes** limited to `data-dse-control` attributes — no behavior change.
7. **Shared helpers** small and generic enough for SC-436/437.
7b. **Known-bug markers** for SC-566 and SC-567 (see the ledger's "Owner rulings on r1
   findings"): each `test.failing` fails today for the stated reason (not incidentally), and
   would pass under any reasonable fix — for SC-567 under BOTH trimming the surplus ticks and
   rewording the tooltip. Independently confirm both bugs reproduce. Also hunt for bugs the
   implementer missed (survey the surface yourself with jsdom probes).
   Jest gate rule (ledger): green, or only the two SC-568 load timeouts with both suites green
   alone — report loadavg.
8. Re-run the gates yourself: tsc, lint, jest, the full `npm run e2e` (twice — flake check),
   and lifecycle in the five `--only` parts below. Shots/freeze/parity: re-run only if the
   implementer's numbers look off or the diff touches rendered DOM in a way that could move
   print bytes.

Baseline at `6270e84a`: jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 ·
e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL,
host-leak 163/978 · freeze 280/280 · parity 0/0/24.

Lifecycle parts (each its own foreground call, `npm run obsidian-lifecycle -- --only=<ids>`):
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a`
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40`
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`
4. `G-S57 G-S62 G-S61 G-S56` (G-S56 stays last)
5. `G-S59 G-S49`
Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder.

## 3. Footguns

- No compound `cd X && …`: `git -C <abs path>`, `devbox run -c <abs path> -- bash <script-file>`;
  the script file `cd`s and writes output to a unique log + exit code to a unique rc file.
  Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc435-rev-r2-<yourAgentId>/`; unique names inside.
- Never `rm` with a variable target, never a glob `rm`, never `rm -rf` under `/tmp` by pattern,
  never touch `.superpowers/` beyond your report file.
- One gate per Bash call, foreground. No background gates or Monitors (except shots past 600 s:
  then background with unique log + rc file and poll them — never wait for a notice).
- Never key a wait on a pre-existing scratch filename/contents. Redirect long output to files.
- Kill only by literal PID whose command line contains a path inside your own worktree (or
  `readlink /proc/<pid>/cwd` inside it). Never `pkill`/`killall` — SC-561 and SC-563 run the
  same gates concurrently.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. Need input → end with `STATUS: NEEDS_CONTEXT` + the question.
  Any stray message starts with `SC-435:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc435-e2e-minion-pool/sc435-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED, counts by
severity, your measured gate numbers). Then findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO),
each with file:line, the failure scenario, the probe that showed it, and a prescribed fix. Any
new product bug you find goes in a separate "Product bugs" section (title, repro, file:line,
severity) — the owner files those.

## 5. Return contract

Raw facts: verdict, severity counts, branch sha reviewed, measured gate numbers, report path,
paths of every probe log/artifact.
