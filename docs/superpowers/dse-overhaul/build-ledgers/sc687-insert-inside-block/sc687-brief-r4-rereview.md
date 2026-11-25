# SC-687 r4 — scoped re-review brief (delta `907d9c85..<r3 head>` only)

You are the independent reviewer for ticket SC-687, re-review round. You did not write this code.
Your final text goes to the ticket-owner (an agent). **You never call the tracker.** Execute and
probe; do not fix. This is a review of the DELTA, not a fresh full pass.

## 1. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-decisions.md`
   (O8, O9, "Owner rulings on r2 findings").
2. Your r2 report `…/sc687-r2-review-report.md`, the fix brief `…/sc687-brief-r3-fix.md`, the fix
   report `…/sc687-r3-fix-report.md` (executive summary + per-finding lines; every claim unverified).
3. Plugin repo `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements`,
   branch `sc687-insert-inside-block`. Delta: `git -C <plugin repo> diff 907d9c85..HEAD` (head sha
   in the dispatch message). Superproject delta: `git -C /home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block diff 9f79effa..HEAD`.
   No commits, no edits to tracked files; scratch probes deleted by literal path; leave
   `git status --short` as you found it. Your r2 probe sources are still in
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r2/`.

## 2. What to check

1. **Each r2 finding is closed, by running your own r2 scenario against the head** (pure scan and
   real Obsidian): HIGH-1 (the chain `- item⏎⏎tail` → insert → insert at `tail` is written; your 5
   other shapes), HIGH-2 (the bare block under `- other` is refused), MEDIUM-1 (any cursor inside
   → refused, nothing written anywhere, one Notice; all cursors outside → bytes as on `aee83dc1`),
   MEDIUM-2 (the unquoted line inside a quoted fence; check the implementer's measurement table of
   what ends a quoted fence against real Obsidian for at least the rows the scan's rule depends on),
   LOW-1 (refused `/ds` pick closes the list; one Notice; token stays).
2. **O8 revert**: an unclosed line-0 `---` refuses nothing; a closed one still refuses line 0
   through the closing line except its end; docs / comments / `.repo-docs/architecture.md` true.
3. **The fixes did not open new holes.** The list / quote rules in `fenceScan.ts` changed: re-run
   your whole r2 probe table (57 notes) on the new head and diff the verdicts against your r2 run —
   explain every changed row. Extra probes around the changed rules: a fence line that is itself a
   list item's first line (`- ```js`), nested lists with a fence at a shallower indent, a fence
   directly after a list item inside a callout, a quoted fence followed by a deeper / shallower
   quote, tabs.
4. **O5 still holds**: `scanFenceState` answers unchanged vs `aee83dc1` on the probe table; the
   three SC-676 markers untouched and failing-as-expected; `suggest.ts` change is on the pick
   path only (`onTrigger` byte-identical to base).
5. **SC-692 stayed out**: an insert with several cursors, all outside, writes the same bytes as base.
6. **Tests are real**: each new test fails with its fix reverted (the report's mutation list —
   spot-check two yourself). No test weakened or deleted in the delta.
7. Commits in the delta carry no co-author / AI attribution.

## 3. Gates you re-run

tsc (incl. `tsc -p e2e`), lint, full jest, FULL `npm run e2e` (expected per the fix report:
`0 failed`, 10 known-bug, `coverage: Y/Y pairs`), `styles.css` sha256 (must be
`18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`). Lifecycle only if the delta
touches anything outside `src/authoring/`, tests and docs — check with `git diff --stat`.
Known flakes (INIT-W09, NEGO-R05, NEGO-R08): re-run alone before believing a red; report either way.

## 4. Report + return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r4-rereview-report.md`,
opening with a **≤10-line executive summary**: VERDICT (LAND-READY / FIX-REQUIRED), per-finding
closed / not closed, new findings by severity, gate lines. New findings with `file:line`, exact
failing note text + cursor, real-Obsidian confirmation, prescribed fix. If the write is blocked,
return the report inline.

Final text, raw facts: VERDICT; head sha reviewed; each gate's measured summary line; per r2
finding closed / open; new findings one line each; `git status --short` of both repos; absolute
paths of the report and logs; `Follow-ups:`.

## 5. Footguns

- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input → end with
  STATUS: NEEDS_CONTEXT. Any message you do send starts `SC-687:`.
- Devbox via `devbox run -c /home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements -- bash <script file>`;
  exit codes recorded inside the script file; never pipe a gate; never `cd` in a compound command.
- New private scratch folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r4/`
  with unique names (Write tool). Never key a wait-loop on a scratch filename or its contents —
  your own r2 logs are stale now; read the process's own output or a per-run unique path.
- Each gate one blocking foreground call, output to a log file (600 s stream watchdog); no
  `run_in_background`, no Monitor; if the tool backgrounds a call, poll your own pid and read the log.
- No `rm` with a variable or glob; never `rm -rf` a shared `/tmp` glob; never `pkill` by pattern
  (kill only a PID whose `/proc/<pid>/cwd` is in this worktree); never touch `.superpowers/`
  outside `sc687-insert-inside-block/`.
