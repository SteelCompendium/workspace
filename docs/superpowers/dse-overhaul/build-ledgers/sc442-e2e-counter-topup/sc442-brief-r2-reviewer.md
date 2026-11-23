# SC-442 round 2 — independent reviewer brief

You review SC-442's branch: real-Obsidian e2e + jsdom functional coverage of `ds-counter` (a
top-up of the pilot). You did not write it. Your final text goes to the SC-442 ticket-owner, not a
human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`
  (ticket scope verbatim, Scott's rulings verbatim, owner rulings incl. the per-marker assertion
  rules for SC-671..674, rounds). It is your only source of ticket history. **Workers never call the
  tracker** (Linear) — not to read, not to post.
- The implementer's report: `sc442-r1-implementer-report.md` in the same dir (read both executive
  summaries — phase A and `## Phase B` — then dive only where you need to).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`, branch
  `sc442-e2e-counter-topup` in `draw-steel-elements/`. Head sha and base are in the dispatch
  message. Do NOT commit to this branch. For mutation probes, make a scratch `git worktree add` at an
  absolute path inside your scratch folder (symlink or `npm ci` its `node_modules` through devbox),
  and remove it with `git -C <dse dir> worktree remove <literal abs path>` when done.
- Prior art for the shape: the SC-440 landed ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`
  (`sc440-r2-review-report.md` shows what a review of this kind found last time — read its summary).
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 490 KB with
  very long lines: never read it whole; grep and `cut -c1-1500`. Sections that matter: the battery
  table near lines 20-135, "Jest timeouts under load" (~158), "Lifecycle and e2e notes" (~197), the
  CURRENT paragraph of "Current expected numbers"). Don't edit it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar and the owner rulings (both in the ledger):

1. **Surface completeness.** Enumerate independently every interactive node a counter can render
   (`src/elements/counter/view.ts`, the kit `stepper` in `src/framework/kit/stepper.ts`, editable
   and read-only, at a limit and not, collapsed and expanded) and every real interaction on it
   (mouse, Enter, Space, Escape, arrows, typing, blur, paste or wheel if they reach a handler). List
   any node without an id and any real interaction missing from the manifest. Shared chrome
   (`chrome.ts`) and the Edit chrome item are out of scope (ledger).
2. **No behavior change in `src/`.** Diff `src/` against the base; every hunk must be ids / census
   plumbing only (phase A reported zero `src/` changes — confirm).
3. **Censuses not vacuous.** Mutation-probe: add an un-id'd button inside a counter; confirm BOTH
   the jsdom census and the real-Obsidian census (`[CENSUS-18]` Reading, `[CENSUS-19]` Live Preview)
   go red. Check no allowlist entry swallows ids it shouldn't.
4. **Manifest honesty.** Every pair driven by real input in a plain (non-known-bug) test that
   asserts the note's values AND the screen. Find drivers that start at a value the action would
   not change (vacuous), assert only the screen, or would pass with the handler deleted.
   Mutation-probe at least six handlers of different kinds (dec click, inc Space, typed Enter
   commit, blur commit, Escape revert, ArrowUp, the at-limit disable) in the scratch worktree and
   confirm the relevant e2e test goes red.
5. **jsdom matrix** (`test/dom/elements/counter-matrix.test.ts`): values × min/max × at-limit ×
   editable/read-only × typed shapes really exercised; no tautological expectations computed from the
   code under test; no test pins a B1..B6 behavior as correct.
6. **Known-bug markers** — SC-671, SC-672 (two), SC-673 (e2e + jsdom), SC-674. The ledger says what
   each marker may assert — check each obeys its ruling. Each marker fails today for the stated
   reason (not incidentally) and would pass under any reasonable fix (simulate one fix per marker in
   the scratch worktree; for SC-672 simulate BOTH an error-card fix and a fresh-counter fix; confirm
   the marker flips while plain tests stay green). Independently confirm each bug reproduces.
7. **Hunt for missed bugs** on the surface. Known open tickets to cite rather than re-report are in
   the ledger (plus SC-671..674).
8. **Shared driver / census changes** (`e2e/driver/*`, `_census.e2e.ts`, `e2eCensus.test.ts`):
   additive, and they must not loosen any other surface's check.
9. **Integrity:** content above/below the block survives; two counters don't cross-talk; the
   tracked `e2e/vaults/plugin-data.shipped.json` is never written by a run (`git status` after e2e).
10. **Scenario ids:** new `[CTR-*]` and `[CENSUS-18..19]` unique across develop and the parallel
    branches (read-only) `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves` and
    `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus`; literal ids in
    titles; no bracketed ticket id in any test title.
11. **Re-run the gates yourself:** tsc, lint, jest (report loadavg), the full `npm run e2e` (twice —
    flake check; report wall time), and lifecycle in the seven `--only=` parts (ledger battery
    section; EQUALS sign; check each log's first lines show only that part's ids). Shots / freeze /
    parity: re-run only if the implementer's numbers look off or the diff could move print bytes.

Branch under review, baseline and the implementer's numbers: in the dispatch message.

Flakes (ledger): G-S61 torn-read line red on a loaded host, base too (SC-668); a G-S91 FAIL is real
unless it says the host was too slow after two re-runs; G-S115 (g) suspected flake (SC-633) — one
re-run of part 7; INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05 flake under load — a re-run
passes. Restore `demo-vault/.obsidian/appearance.json` if dirty before blaming a G-S97 FAIL
(SC-622). Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder.
Jest's timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until the suite passes alone.

## 3. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. `git -C <abs path>` for every git command;
  `devbox run -c <abs path> -- bash <script-file>` for every devbox call, the script file `cd`ing in
  and running ONE gate with output to a unique log and the exit code to a unique rc file. Write
  scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc442-rev-r2/`
  (exists) — uniquely named scripts and logs. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** (workers hung on
  the permission prompt). Leave throwaway files in place. The scratch git worktree is removed only
  with `git worktree remove <literal path>`.
- The Bash tool moves any call over 180 s to the background. For long gates: output to a log, then
  wait with `timeout 175 tail --pid=<your own pid> -f /dev/null` (pid whose `readlink /proc/<pid>/cwd`
  is inside your worktree), repeated until it exits; then read the log and rc file. Never wait for a
  completion notice; never a Monitor.
- Never key a wait-loop on a scratch filename or its contents from before your run.
- Redirect long output to files (the 600 s stream watchdog kills silent agents). devbox's `sh`
  wrapper eats `$?`/`$PIPESTATUS`; `| tail` eats failures.
- Kill processes only by literal PID inside your worktree or scratch path. Never `pkill`/`killall`
  by pattern — SC-662 and SC-656 run the same gates concurrently.
- On a fresh worktree jest reads 2 skipped until `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`.
- Never push anything.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever do send a message anyway, its first word must be `SC-442:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity,
gate numbers, new-bug count). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with file:line, the failure scenario, how you probed it, and a prescribed fix. Product bugs go in
their own section (title, repro, file:line, severity, known-ticket match). Then every gate's log path
and summary line.

## 5. Return contract

Final text: raw facts, no prose — verdict, counts by severity, each finding's one-line title with
file:line, product bugs (title + severity), gate numbers, report path, and the path of every evidence
artifact you produced.
