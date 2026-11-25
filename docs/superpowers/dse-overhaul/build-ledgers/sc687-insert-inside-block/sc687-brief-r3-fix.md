# SC-687 r3 — fix round brief (implementer)

You are the implementer for ticket SC-687, fix round. Your final text goes to the ticket-owner (an
agent), not a human. **You never call the tracker.** This brief is self-contained: a fresh worker
can run it from the files alone.

## 1. Context loading

1. Ledger (spec + rulings; read O8, O9 and "Owner rulings on r2 findings"):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-decisions.md`
2. The review report — **the findings are the task; read HIGH-1, HIGH-2, MEDIUM-1, MEDIUM-2, LOW-1
   and INFO-1 in full, verbatim, including each prescribed fix and failing scenario**:
   `…/sc687-insert-inside-block/sc687-r2-review-report.md`
   Prior rounds: `sc687-brief-r1-impl.md` (all of its rules and footguns in sections 2, 4, 8 still
   apply), `sc687-r1-impl-report.md`.
   The reviewer's probe sources are kept at
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r2/`
   (`zzR2ReviewProbe.test.ts.keep`, `zz-r2-review.e2e.ts.keep`, `probe-head.txt`): read-only, reuse
   their cases.
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block`, plugin repo
   `draw-steel-elements` inside it, branch `sc687-insert-inside-block`, head `907d9c85`, base dse
   `develop` @ `aee83dc1`. Fetch first
   (`git -C <plugin repo> fetch origin`); if `origin/develop` is no longer `aee83dc1`, do NOT
   rebase — say so in the report (the owner orders rebases). `git -C <absolute path>` always.
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report.

## 2. Fixes (TDD: each starts with a failing test taken from the reviewer's scenario)

1. **HIGH-1 + HIGH-2** (`src/authoring/fenceScan.ts:174`, one cause): the lazy-continuation rule
   keeps a list item open across a fence line. Apply the prescribed fix (a fence line ends the lazy
   continuation / pops the item) and verify it against BOTH scenarios in real Obsidian:
   - HIGH-1: `- item⏎⏎tail`, insert on the empty line, then a second insert at `tail` must be
     written (not refused), as on `aee83dc1`; plus the reviewer's 5 other false-refusal shapes;
   - HIGH-2: `- item⏎```js⏎x⏎```⏎- other⏎  ```⏎  a: 1⏎  ```⏎tail`, cursor at (6,6): must be refused,
     note unchanged.
   Add the scan rows the suite lacked (a fence directly under a list item with no blank line, in
   each list shape), a jest chain test and an e2e chain test (new `AUTH-*` id).
2. **MEDIUM-2** (`fenceScan.ts:158`, and the wrong comment at `:119`): a non-blank unquoted line
   inside a quoted fence stays in the code block. First MEASURE in real Obsidian 1.14.4 (Live
   Preview, Source, Reading view; plain quote and callout) what ends a quoted fence: a blank line,
   an unquoted ```` ``` ```` line, a shallower `>` depth, a non-blank unquoted text line. Make the
   scan match; where the views disagree, choose the reading that refuses (state it). Scan rows +
   one e2e test.
3. **MEDIUM-1** (`src/authoring/blockInsert.ts:124`): when no `range` is passed, refuse if ANY
   range of `editor.listSelections()` has an end (anchor or head) inside. Teach
   `test/dom/authoring/_cmEditor.ts` `listSelections`; jest tests: two cursors with the main one
   outside and the other inside (refused, one Notice, nothing written at either), both outside
   (written exactly as on `aee83dc1`). Check in real Obsidian that `listSelections` is what the
   command sees.
   **Out of scope — SC-692 (Backlog):** with several cursors the SC-675 plan is computed for the
   main cursor's line and written at every cursor. Do not change how a multi-cursor insert with
   every cursor outside is written.
4. **LOW-1** (`src/authoring/suggest.ts:69`): a refused `/ds` pick closes the list
   (`if (!insertBlock(...)) this.close();`), so a second Enter does not show a second Notice. The
   token stays as typed. Touch only the pick path: `onTrigger` and the three SC-676 `test.failing`
   markers stay exactly as they are (O5). jest test; e2e if the suggest specs can drive it cheaply.
5. **O8 revert**: only a CLOSED line-0 `---` … `---` is properties for the guard. An unclosed
   line-0 `---` refuses nothing. One line in `propertiesOf` + its test rows; fix every statement
   this makes false: the `propertiesOf` comment, `.repo-docs/architecture.md` ("unclosed = to the
   end of the note"), `docs/writing-blocks.md`, both changelogs if they say otherwise. If an r1
   e2e test pins the unclosed refusal, rewrite it to the new rule.
6. Docs truth pass after the fixes: `docs/writing-blocks.md`, plugin `CHANGELOG.md`, the worktree
   superproject's `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/CHANGELOG.md`
   ("covers … under a list item" must now be true; add several cursors only if a user would care —
   one short clause at most). Commit superproject doc changes on its branch; no pointer bump.

Do not widen scope beyond these six. Anything else you notice goes under `Follow-ups:`.

Commits inside the plugin repo, one per fix (`fix(SC-687): …` / `test(SC-687): …` /
`docs(SC-687): …`). **No co-author trailers, no AI attribution.** Never push, tag or release.

## 3. Gates (all in the r1 brief's command shapes; expected numbers at r1 head `907d9c85`)

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: was **14604 passed / 2 skipped**; report the new count and delta.
- e2e FULL: was `OBSIDIAN-E2E done: 803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`.
  Expected: `0 failed`, **10 known-bug**, ok and total up by your new tests, `coverage: Y/Y pairs`.
- lifecycle: no `src/` path it exercises changes (authoring only). Run the seven `--only=` parts
  again only if you touch anything outside `src/authoring/`; otherwise state "lifecycle 64/64
  carried from `907d9c85`; diff `907d9c85..HEAD` touches only src/authoring, tests, docs" with
  the `git diff --stat` to prove it.
- `styles.css` sha256 on head must still be
  `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (carry shots 592 / freeze
  280/280 / parity 0/0/24).
- Mutation check for the new rules, as in r1 (each fix reverted → at least one test red).

## 4. Report + return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r3-fix-report.md`,
opening with a **≤10-line executive summary**. Per finding: commit sha, what changed
(`file:line`), the test that was red first, the real-Obsidian measurement (MEDIUM-2 table: what
ends a quoted fence, per view). If the report-file write is blocked, return it inline.

Final text, raw facts only: STATUS (DONE | NEEDS_CONTEXT | BLOCKED); plugin head sha; superproject
head sha; `origin/develop` sha seen; each gate's measured summary line + the styles.css hash; new
e2e ids; per-finding one line (fixed at `<sha>` / not fixed + why); `git status --short` of both
repos; **absolute paths of the report and every log**; `Drive-by fixes:`; `Follow-ups:`.

## 5. Footguns (same as r1 section 8 — re-read it)

- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input → end with
  STATUS: NEEDS_CONTEXT. Any message you do send starts `SC-687:`.
- Devbox via `devbox run -c <abs plugin dir> -- bash <script file>`; exit codes recorded inside
  the script file; never pipe a gate; never `cd` in a compound command.
- Private scratch folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r3/`
  (new, unique names, Write tool). Never key a wait-loop on a scratch filename or its contents —
  stale logs from other rounds and branches match; read the process's own output.
- Each gate one blocking foreground call with output to a log file (600 s stream watchdog); no
  `run_in_background`, no Monitor; if the tool backgrounds a call, poll your own pid and read the log.
- No `rm` with a variable or glob; never `rm -rf` a shared `/tmp` glob; never `pkill` by pattern;
  never touch `.superpowers/` outside `sc687-insert-inside-block/`.
- Commit after every coherent step.
