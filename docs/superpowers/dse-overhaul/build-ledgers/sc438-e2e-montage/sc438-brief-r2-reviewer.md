# SC-438 round 2 — independent reviewer brief

You review SC-438's branch: real-Obsidian e2e + jsdom functional coverage of the montage tracker
(`ds-montage`) and its three modals (Log an action, Add a hero, Set limits). You did not write it.
Your final text goes to the SC-438 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc438-e2e-montage/decisions.md`
  (ticket scope verbatim, Scott's rulings verbatim, owner rulings, rounds). It is your only source
  of ticket history. **Workers never call the tracker** (Linear) — not to read, not to post.
- The implementer's report: `sc438-r1-implementer-report.md` in the same dir (read both executive
  summaries — phase A and `## Phase B` — then dive only where you need to).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc438-e2e-montage`, branch
  `sc438-e2e-montage` in `draw-steel-elements/`. Head sha and base are in the dispatch message. Do
  NOT commit to this branch. For mutation probes, make a scratch `git worktree add` at an absolute
  path inside your scratch folder (symlink or `npm ci` its `node_modules` through devbox), and
  remove it with `git -C <dse dir> worktree remove <literal abs path>` when done.
- Prior art for the shape: SC-437's landed ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc437-e2e-initiative-tracker/`
  (`sc437-r2-review-report.md` shows what a review of this kind found last time — read its summary).
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 450 KB with
  60 KB lines: never read it whole; grep and `cut -c1-1500`. Sections that matter: the battery table
  rows near line 20-80, "Jest timeouts under load", "Lifecycle and e2e notes", "Current expected
  numbers"). Don't edit it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar and the owner rulings (both in the ledger):

1. **Surface completeness — the big one.** The branch lists 54 new pairs (34 ids). Enumerate
   independently every interactive node `src/elements/montage/` (view, BoardView, HeadView,
   StripView, OutcomeBandView, GuideView, chrome-panel items) and the three modals
   (`LogActionModal.ts`, `ConfigModals.ts`) can render, across variants (no heroes, heroes with and
   without skills, mid / done / failed, past rounds, read-only host, logged actions edited /
   removed, the strip open / closed, the guide). List any node without an id and any real
   interaction (a handler that exists — click, key, input, blur) missing from the manifest. Out of
   scope: the generic block edit form, the sidebar host (ledger "Surface boundary").
2. **Censuses not vacuous.** Mutation-probe: add an un-id'd button to the board in a scratch
   worktree and one inside a montage modal; confirm BOTH the jsdom census and the real-Obsidian
   census (`_census.e2e.ts`) go red. Check no allowlist entry swallows ids it shouldn't (e.g. a
   blanket prefix).
3. **Manifest honesty.** Every pair driven by real input in a plain (non-known-bug) test that
   asserts BOTH the note file and the screen. Find drivers that assert nothing meaningful, only the
   screen, or would pass with the handler deleted. Mutation-probe at least six handlers of
   different kinds (quick-log success, End round, Undo, Add a hero submit, Set limits save, Log an
   action submit / remove, strip toggle) and confirm the relevant e2e test goes red.
4. **jsdom matrix** (`test/dom/elements/montage-matrix.test.ts`): values × states × variants really
   exercised; no tautological expectations computed from the code under test.
5. **Known-bug markers** — SC-625, SC-626, SC-627, SC-628, SC-629, SC-631 (rulings on what each
   marker may assert are in the ledger — check each marker obeys its ruling). Each marker fails
   today for the stated reason (not incidentally) and would pass under any reasonable fix (simulate
   one fix per marker in the scratch worktree and confirm the marker flips while plain tests stay
   green). Independently confirm each bug reproduces. Check the implementer's real-Obsidian finding
   on SC-626 (does focus really drop in Obsidian?) and on the Set limits unchanged-Save
   (`expectNoWrite`) — reproduce both yourself.
6. **Hunt for missed bugs** on the surface. Known open tickets to cite rather than re-report are in
   the ledger (plus the eight SC-438 filed: SC-625..SC-632).
7. **Product code changes** limited to `data-dse-control` attributes and census plumbing — no
   behaviour change. Diff `src/` against the base and check every hunk.
8. **Integrity probes** for the writes this surface makes: content above / below the block
   survives; a second montage block (and an identical twin) in the same note is untouched; say
   whether the e2e specs cover this (the per-fence check in the README does part of it).
9. **Scenario ids:** `[MONT-*]` and `[CENSUS-10..12]` unique across develop and the parallel
   branches (SC-614, SC-569 — read their worktrees under `/home/scott/code/steelCompendium/worktrees/`
   read-only); no bracketed ticket id in any test title.
10. **Re-run the gates yourself:** tsc, lint, jest (report loadavg), the full `npm run e2e` (twice —
    flake check), and lifecycle in the seven `--only` parts below. Shots/freeze/parity: re-run only
    if the implementer's numbers look off or the diff could move print bytes.

Baseline at `27120710`: jest 11892 passed / 2 skipped (fresh, without the shots cache) · lifecycle
64/64 · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. Expected after
this branch: coverage 230/230 (re-count yourself).

Lifecycle parts (each its own call, `npm run obsidian-lifecycle -- --only=<comma-separated ids>`):
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3, about 200 s)
A G-S91 FAIL is real unless it says the host was too slow after two re-runs. A G-S115 cell (g) red
that shows the "changed on disk first" Notice on a loaded host is a suspected flake (SC-633): re-run
part 7 once; a red on the re-run, on a quiet host, or in any other G-S115 cell is real. Restore
`demo-vault/.obsidian/appearance.json` if dirty before blaming a G-S97 FAIL (SC-622). Never set
`DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder. Jest's timeout is
30 s (SC-568): an "Exceeded timeout" is a real hang until the suite passes alone.

## 3. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. `git -C <abs path>` for every git command;
  `devbox run -c <abs path> -- bash <script-file>` for every devbox call, the script file `cd`ing in
  and running ONE gate with output to a unique log and the exit code to a unique rc file. Write
  scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc438-rev-r2/`
  — uniquely named scripts and logs. Never a generic `gate.sh`.
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
  by pattern — SC-614 and SC-569 run the same gates concurrently.
- On a fresh worktree jest reads 2 skipped until `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever do send a message anyway, its first word must be `SC-438:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc438-e2e-montage/sc438-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity,
gate numbers, new-bug count). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with file:line, the failure scenario, how you probed it, and a prescribed fix. Product bugs go in
their own section (title, repro, file:line, severity, known-ticket match). Then every gate's log path
and summary line.

## 5. Return contract

Final text: raw facts, no prose — verdict, counts by severity, each finding's one-line title with
file:line, product bugs (title + severity), gate numbers, report path, and the path of every evidence
artifact you produced.
