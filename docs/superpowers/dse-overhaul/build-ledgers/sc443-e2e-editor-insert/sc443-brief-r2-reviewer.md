# SC-443 round 2 — independent reviewer brief

You review SC-443's branch: real-Obsidian e2e + jsdom functional coverage of the DSE editor insert
paths (insert commands, `/ds` suggest, in-fence schema autocomplete, compendium search + insert).
You did not write it. Your final text goes to the SC-443 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/decisions.md`
  (ticket scope verbatim, Scott's rulings verbatim, owner rulings, rounds). It is your only source
  of ticket history. **Workers never call the tracker** (Linear) — not to read, not to post.
- The implementer's report: `sc443-r1-implementer-report.md` in the same dir (read both executive
  summaries — phase A at the top and `## Phase B` — then dive only where you need to).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert`, branch
  `sc443-e2e-editor-insert` in `draw-steel-elements/`. Head sha and base are in the dispatch
  message. Do NOT commit to this branch. For mutation probes, make a scratch `git worktree add` at
  an absolute path inside your scratch folder (symlink the branch worktree's `node_modules` or
  `npm ci` through devbox), and remove it with `git -C <dse dir> worktree remove <literal abs path>`
  when done.
- Prior art for the shape: SC-440's landed ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`
  (`sc440-r2-review-report.md` shows what a review of this kind found last time — read its summary
  and findings list).
- `draw-steel-elements/e2e/README.md`, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 495 KB with
  60 KB lines: never read it whole; grep and `cut -c1-1500`. Sections that matter: the battery table
  rows near line 20-35, "Jest timeouts under load" (~158), "Lifecycle and e2e notes" (~197), the
  CURRENT paragraph of "Current expected numbers" (~1532)). Don't edit it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; ignore it.

## 2. What to review — execute and probe, don't just read

Judge the branch against the ticket's Done bar and the owner rulings (both in the ledger):

1. **Surface completeness.** Enumerate independently every interactive node and every real
   interaction on the four paths (`src/authoring/insert.ts`, `scaffold.ts`, `suggest.ts`,
   `schemaSuggest.ts`, `fenceScan.ts`, `compendiumInsert.ts`, `CompendiumSearchModal.ts`, the
   registration in `main.ts`), gate OFF and ON. List any node without an id, any command missing
   from the manifest, any real interaction missing (e.g. a key the suggesters or the search window
   register that the manifest lacks). Out of scope: `FormModal.ts` / `formModel.ts`, the sidebar,
   sync / migration windows (ledger "Surface boundary").
2. **Behaviour-neutral src diff.** Diff `src/` against the base: every hunk is `data-dse-control`
   attributes / census plumbing only.
3. **Round trip in both modes — the ticket's core ask.** For each of the four paths, confirm a plain
   e2e test in Live Preview AND one in Source mode that (a) triggers through real input, (b)
   asserts the exact inserted text, (c) its position (cursor line/column, or only the `/ds…` token
   replaced), (d) the cursor after insert where the code sets one, (e) the whole rest of the note
   byte-identical, (f) the block renders as a DSE element, not an error card. Find drives that
   assert only that a window closed or that "something" was inserted.
4. **Censuses not vacuous.** Mutation-probe: an un-id'd button inside a `/ds` row, a schema row and
   the search window; confirm BOTH the jsdom census and the real-Obsidian census (`_census.e2e.ts`,
   `[CENSUS-30]`+) go red. Check no host-chrome allowlist rule swallows a node that is ours.
5. **Manifest honesty.** Every pair has at least one plain (non-known-bug) driver through real
   input; `executeCommandById` never credits a pair (ledger ruling); key presses credit only the
   row actually selected. Mutation-probe at least six handlers of different kinds (an insert
   command's scaffold text, the `/ds` token range, the `/ds` fence guard, the schema key accept,
   reference vs snapshot routing on Shift-click, the snapshot family filter (SC-149), the search
   `type:` filter, the empty-state Sync) and confirm the relevant e2e test goes red.
6. **Experimental gate.** OFF: `insert-hero` and the 8 deferred commands are absent from the palette
   and `/ds` (a test goes red if one leaks in). ON: the gate-ON scenario drives a deferred insert,
   a `/ds` pick and the enum value list, and the gate is restored to OFF afterwards (probe the
   restore: break it and see what goes red).
7. **No network; fixture hygiene.** No e2e test can reach the real release source (the throwing
   `requestUrlFn` stub covers the empty-state Sync; probe by removing the stub). The fixture
   compendium is copied at run time and absent by default — confirm no other spec's vault changes
   and that tracked `e2e/vaults/**` and `e2e/vaults/plugin-data.shipped.json` are never written
   (`git status` after a run).
8. **jsdom matrix** (`test/dom/authoring/*Matrix.test.ts`, `_cmEditor.ts`): values × states ×
   variants really exercised; no tautological expectations computed from the code under test; the
   CM6 helper behaves like Obsidian's `Editor` for the calls the product makes.
9. **Known-bug markers** — SC-675, SC-676, SC-677, SC-678 and the existing SC-462 (the ledger says
   what each marker may assert). Each fails today for the stated reason (not incidentally) and
   would pass under any reasonable fix: simulate each fix in the scratch worktree (for SC-675 BOTH
   fixes: split onto own lines, and refuse with a Notice leaving the note unchanged) and confirm the
   marker flips while plain tests stay green. Independently confirm each bug reproduces.
10. **Hunt for missed bugs** on the surface — integrity especially: text above / below survives, a
    selection is replaced and nothing else, undo, two blocks in one note, the SC-476 / SC-601 /
    SC-159 / SC-148 / SC-147 / SC-390 / SC-149 / SC-190 / SC-406 / SC-422 regressions. Known open
    tickets to cite rather than re-report are in the ledger (plus SC-675..678).
11. **Shared files.** Any edit to an existing `e2e/driver/*` file, `_census.e2e.ts`,
    `e2eCensus.test.ts`, `e2e/README.md` or `host/`: small, additive, and harmless to other specs.
    `allowedErrors`, if used, narrow (only the named error, only in the test that names it).
12. **Scenario ids:** `[AUTH-*]` and `[CENSUS-30]`+ unique across develop and the parallel SC-442
    worktree `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup` (read-only);
    literal ids in titles; no bracketed ticket id in any test title; every `AUTH` test passes alone
    under `--only=` (sample at least six across files).
13. **Re-run the gates yourself:** tsc (incl. `tsc -p e2e`), lint, jest (report loadavg), the full
    `npm run e2e` (twice — flake check; report wall time), and lifecycle in the seven `--only=` parts
    (ledger; equals sign). Shots / freeze / parity: re-run only if the implementer's numbers look
    off or the diff could move print bytes.

Branch under review, baseline and implementer numbers: in the dispatch message.

## 3. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. `git -C <abs path>` for every git command;
  `devbox run -c <abs path> -- bash <script-file>` for every devbox call, the script file `cd`ing in
  and running ONE gate with output to a unique log and the exit code to a unique rc file. Write
  scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc443-rev-r2/`
  (exists) — uniquely named scripts and logs. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** (workers hung on
  the permission prompt). Leave throwaway files in place. Never `rm` with a shell-variable target.
  The scratch git worktree is removed only with `git worktree remove <literal path>`.
- The Bash tool moves any call over 180 s to the background. For long gates: output to a log, then
  wait with `timeout 175 tail --pid=<your own pid> -f /dev/null` (pid whose `readlink /proc/<pid>/cwd`
  is inside your worktree), repeated until it exits; then read the log and rc file. Never wait for a
  completion notice; never a Monitor.
- Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run under your scratch folder.
- Never key a wait-loop on a scratch filename or its contents from before your run.
- Redirect long output to files (the 600 s stream watchdog kills silent agents). devbox's `sh`
  wrapper eats `$?`/`$PIPESTATUS`; `| tail` eats failures.
- Kill processes only by literal PID inside your worktree or scratch path. Never `pkill`/`killall`
  by pattern — other efforts run the same gates concurrently.
- Jest's timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until the suite passes
  alone. On a fresh worktree jest reads 2 skipped until `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`.
- Known flakes (ledger): G-S61 torn-read (SC-668), G-S115 (g) (SC-633), G-S91 rule, INIT-W09/W10
  (SC-654), SET-X03/X04 (SC-657), NEGO-R05; restore `demo-vault/.obsidian/appearance.json` before
  blaming G-S97 (SC-622).
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever do send a message anyway, its first word must be `SC-443:`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity,
gate numbers, new-bug count). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with file:line, the failure scenario, how you probed it, and a prescribed fix. Product bugs go in
their own section (title, repro, file:line, severity, known-ticket match). Then every gate's log path
and summary line.

## 5. Return contract

Final text: raw facts, no prose — verdict, counts by severity, each finding's one-line title with
file:line, product bugs (title + severity), gate numbers, report path, and the path of every evidence
artifact you produced.
