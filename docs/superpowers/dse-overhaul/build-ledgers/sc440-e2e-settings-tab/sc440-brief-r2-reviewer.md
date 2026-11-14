# SC-440 round 2 — independent reviewer brief

You review SC-440's branch: real-Obsidian e2e + jsdom functional coverage of the DSE plugin settings
tab. You did not write it. Your final text goes to the SC-440 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc440-e2e-settings-tab/decisions.md`
  (ticket scope verbatim, Scott's rulings verbatim, owner rulings, rounds). It is your only source
  of ticket history. **Workers never call the tracker** (Linear) — not to read, not to post.
- The implementer's report: `sc440-r1-implementer-report.md` in the same dir (read both executive
  summaries — phase A and `## Phase B` — then dive only where you need to).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab`, branch
  `sc440-e2e-settings-tab` in `draw-steel-elements/`. Head sha and base are in the dispatch message.
  Do NOT commit to this branch. For mutation probes, make a scratch `git worktree add` at an absolute
  path inside your scratch folder (symlink or `npm ci` its `node_modules` through devbox), and remove
  it with `git -C <dse dir> worktree remove <literal abs path>` when done.
- Prior art for the shape: SC-438's landed ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc438-e2e-montage/`
  (`sc438-r2-review-report.md` shows what a review of this kind found last time — read its summary).
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 460 KB with
  60 KB lines: never read it whole; grep and `cut -c1-1500`. Sections that matter: the battery table
  rows near line 20-35, "Jest timeouts under load", "Lifecycle and e2e notes", the CURRENT paragraph
  of "Current expected numbers"). Don't edit it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar and the owner rulings (both in the ledger):

1. **Surface completeness — the big one.** Enumerate independently every interactive node the
   settings tab can render (`src/views/SettingsTab.ts`, `settingsDeclarative.ts`,
   `settingsControlIds.ts`, the descriptors in `src/prefs/catalog.ts`, Preset, fonts, sliders,
   reset rows, Advanced pages, page links, Sync / Check, the image-path combobox and its clear X),
   with the experimental gate OFF and ON. List any node without an id and any real interaction
   missing from the manifest. Out of scope: SC-441's sync / migration windows, the preview stage's
   inner element controls, Obsidian's own settings chrome (ledger "Surface boundary").
2. **The id-stamping design is behaviour-neutral** (ledger ruling: the `visible` predicate never
   throws and always returns true; a tab without `getElementForDefinition` still renders every
   row). Probe it: make the stamp throw in a scratch worktree, and remove `getElementForDefinition`;
   every row must still render (jsdom and, if cheap, real Obsidian). Diff `src/` against the base and
   check every hunk is attributes / census plumbing only.
3. **Censuses not vacuous.** Mutation-probe: add an un-id'd button inside the settings tab; confirm
   BOTH the jsdom census and the real-Obsidian census (`_census.e2e.ts`) go red. Check no allowlist
   entry swallows ids it shouldn't.
4. **Manifest honesty.** Every pair driven by real input in a plain (non-known-bug) test that
   asserts `data.json`, the live on-screen effect on an open element, and (batched) survival across
   a plugin reload. Find drivers that start at the default value (vacuous), assert only `data.json`,
   or would pass with the onChange handler deleted. Mutation-probe at least six handlers of
   different kinds (a toggle, a select, a font picker, a slider, a reset row, Preset, a text field,
   Sync / Check busy) and confirm the relevant e2e test goes red.
5. **Experimental gate.** OFF: the gated descriptors are absent (and the test would go red if one
   leaked in). ON: the separate scenario drives them, and the gate is restored to OFF afterwards so
   no later spec runs with it on (probe the restore: break it and see what goes red).
6. **No network.** Confirm no e2e test can reach the real release source (the `requestUrlFn` stub
   covers every Sync / Check drive; probe by making the stub absent and checking the drive fails
   loudly rather than reaching the network).
7. **jsdom matrix** (`test/dom/views/settings-matrix.test.ts`, `settings-integrity.test.ts`):
   values × states × variants really exercised; no tautological expectations computed from the code
   under test.
8. **Known-bug markers** — SC-643, SC-644, SC-645, SC-646, SC-647 (the ledger says what each marker
   may assert, and that Start collapsed gets NO marker — check each obeys its ruling). Each marker
   fails today for the stated reason (not incidentally) and would pass under any reasonable fix
   (simulate one fix per marker in the scratch worktree; confirm the marker flips while plain tests
   stay green). Confirm no test ever clicks SC-643's trash button. Independently confirm each bug
   reproduces.
9. **Hunt for missed bugs** on the surface. Known open tickets to cite rather than re-report are in
   the ledger (plus SC-643..SC-647).
9b. **Shared driver changes** (`e2e/driver/state.ts`, `invariants.ts` `allowedErrors`; `dse.ts`
    `is-disabled` → `click-disabled`; `settings.ts`, `settingsDrive.ts`, `cleanup.ts`): `allowedErrors`
    must be narrow (only the named error, only in the test that names it) and must not mask a page
    error in any other test — probe by injecting a different page error into a test that uses it.
    The `click-disabled` change must not turn an enabled control's click into a passing
    `click-disabled` drive elsewhere.
10. **Integrity**: `data.json` unknown keys survive; one setting doesn't move another; the tracked
    `e2e/vaults/plugin-data.shipped.json` is never written by a run (check `git status` after e2e).
11. **Scenario ids:** `[SET-*]` and `[CENSUS-16..17]` unique across develop and the parallel branches
    (SC-439 `/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation`, SC-626
    `/home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write` — read-only); literal
    ids in titles; no bracketed ticket id in any test title.
12. **Re-run the gates yourself:** tsc, lint, jest (report loadavg), the full `npm run e2e` (twice —
    flake check; report wall time), and lifecycle in the seven `--only` parts below. Shots / freeze /
    parity: re-run only if the implementer's numbers look off or the diff could move print bytes.

Branch under review: dse `sc440-e2e-settings-tab` @ `4c430c1b`, 5 commits on develop `a5313f9d`
(`git log --oneline a5313f9d..4c430c1b`). Baseline at `a5313f9d`: jest 12133 passed / 1 skipped with
the shots cache · lifecycle 64/64 · e2e `424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`
· shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity
0/0/24. Implementer's numbers at `4c430c1b`: jest 12325 / 1 skipped (cache) · lifecycle 64/64 · e2e
×2 `487/506 ok, 0 failed, 19 known-bug, coverage: 351/351 pairs` (247 s / 273 s at load 7-12) ·
shots 592 / 163/978 / 40/240 / 147 · freeze 280/280 · parity 0/0/24. Re-count the pairs yourself.

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
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-rev-r2/`
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
  by pattern — SC-439 and SC-626 run the same gates concurrently.
- On a fresh worktree jest reads 2 skipped until `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever do send a message anyway, its first word must be `SC-440:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc440-e2e-settings-tab/sc440-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity,
gate numbers, new-bug count). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with file:line, the failure scenario, how you probed it, and a prescribed fix. Product bugs go in
their own section (title, repro, file:line, severity, known-ticket match). Then every gate's log path
and summary line.

## 5. Return contract

Final text: raw facts, no prose — verdict, counts by severity, each finding's one-line title with
file:line, product bugs (title + severity), gate numbers, report path, and the path of every evidence
artifact you produced.
