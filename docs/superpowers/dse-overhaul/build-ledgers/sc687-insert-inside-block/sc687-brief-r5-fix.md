# SC-687 r5 — second fix round brief (implementer)

You are the implementer for ticket SC-687, second fix round. Your final text goes to the
ticket-owner (an agent). **You never call the tracker.** Self-contained: a fresh worker can run it
from the files alone.

## 1. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-decisions.md`
   (read "Owner rulings on r4 findings").
2. The re-review report — **read NEW-HIGH-1 and NEW-LOW-1 in full, verbatim, with their failing
   notes, cursor positions and prescribed fixes**: `…/sc687-insert-inside-block/sc687-r4-rereview-report.md`.
   Prior rounds in the same folder: `sc687-brief-r1-impl.md` (rules, gate command shapes and
   footguns in sections 2, 4, 8 still apply), `sc687-brief-r3-fix.md`, `sc687-r3-fix-report.md`.
   Reviewer probe sources (read-only):
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r4/`
   (`zzR4Probe.test.ts`, `zz-r4-review.e2e.ts`).
3. Plugin repo `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements`,
   branch `sc687-insert-inside-block`, head `fe0b5bab`, base dse `develop` @ `aee83dc1`. Fetch
   first; if `origin/develop` moved, do NOT rebase — report it. `git -C <absolute path>` always.
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report.

## 2. Fixes (TDD: a failing test from the reviewer's scenario first)

1. **NEW-HIGH-1** (`src/authoring/fenceScan.ts:193`): the scan counts a tab as 4 columns on the
   fence line, `listItemOf` counts a tab as 2 under a bullet, so a tab-indented fence under a
   nested bullet (Obsidian's default list indentation) reads as indented code and the insert
   writes into the block. Reviewer's note: `- a⏎\t- b⏎\t\t```ds-ct⏎\t\tname: x⏎\t\t```⏎tail`, cursor
   (3,9), Insert Counter → must be refused, note unchanged. Measure the line's leading whitespace
   by the SAME rule as the item's lead (one helper, used by both — no second copy of the tab
   rule). Cover: 1, 2 and 3 tab levels under bullets; tabs under an ordered item (the rule there
   is CommonMark's 4, see the comment in `blockContextOf` / `listItem.ts`); mixed tabs and
   spaces; a tab-indented fence inside a callout list. Check each new row against what real
   Obsidian draws (Reading view and Live Preview); where they disagree choose the reading that
   refuses and say so. Scan rows + one e2e (new `AUTH-*` id) with the reviewer's note.
   Also re-check every other place the scan measures indentation (closer lines, body lines,
   lazy continuation, the "indented less than the item" pop) for the same 4-vs-2 mismatch.
2. **NEW-LOW-1** (`fenceScan.ts:175`): a line with fewer `>` than the open fence's quote prefix
   that is blank or a fence line ends the fence (a shallower fence line then opens its own).
   Reviewer's notes B2 and B2b: `> > ```js⏎> > a⏎> ```⏎> > b⏎> > ```⏎> c⏎⏎after`, insert at the
   end of `> c` (5,3) → must be refused. Scan rows for B2 and B2b; make sure the r3 MEDIUM-2 rows
   (unquoted text and shallower-quoted TEXT stay inside) still hold.

Nothing else. SC-676 (suggester triggers; `scanFenceState` answers unchanged; three markers stay
failing) and SC-692 (multi-cursor layout) stay out of scope. Other observations → `Follow-ups:`.

Commits inside the plugin repo, one per fix. **No co-author trailers, no AI attribution.** Never
push, tag or release. Docs: only if a statement became false (`.repo-docs/architecture.md`,
`fenceScan.ts` comments); the user docs and changelogs should not need a change — say so if true.

## 3. Gates (expected at `fe0b5bab`)

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: was **14643 passed / 2 skipped**; report new count + delta.
- e2e FULL: was `OBSIDIAN-E2E done: 809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`;
  expected `0 failed`, 10 known-bug, ok and total up by your new tests, `coverage: Y/Y pairs`.
  SET-X03 / SET-X04 (SC-657 flake, settings) went red once for the reviewer under load: if a red
  appears outside `specs/authoring/`, re-run it alone, then re-run the full suite, report both.
- lifecycle 64/64 carried if `git diff --stat fe0b5bab..HEAD` touches only `src/authoring/`,
  tests and docs (show the stat); otherwise run the seven parts.
- `styles.css` sha256 must still be `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- Mutation check: each of the two fixes reverted → at least one test red.

## 4. Report + return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r5-fix-report.md`,
opening with a **≤10-line executive summary**; per finding: commit sha, `file:line`, the test red
first, the real-Obsidian measurements (tab table per view). If the write is blocked, return inline.

Final text, raw facts: STATUS (DONE | NEEDS_CONTEXT | BLOCKED); plugin head sha; superproject head
sha; `origin/develop` sha seen; each gate's summary line + the styles.css hash; new e2e ids;
per-finding one line; `git status --short` of both repos; **absolute paths of the report and every
log**; `Drive-by fixes:`; `Follow-ups:`.

## 5. Footguns (r1 brief section 8 in full — re-read it)

- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input → end with
  STATUS: NEEDS_CONTEXT. Any message you do send starts `SC-687:`.
- Devbox via `devbox run -c <abs plugin dir> -- bash <script file>`; exit codes recorded inside the
  script file; never pipe a gate; never `cd` in a compound command.
- New private scratch folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r5/`
  (unique names, Write tool). Never key a wait-loop on a scratch filename or its contents — your
  r1 / r3 logs are stale; read the process's own output or a per-run unique path.
- Each gate one blocking foreground call with output to a log file (600 s stream watchdog); no
  `run_in_background`, no Monitor; if the tool backgrounds a call, poll your own pid and read the log.
- No `rm` with a variable or glob; never `rm -rf` a shared `/tmp` glob; never `pkill` by pattern;
  never touch `.superpowers/` outside `sc687-insert-inside-block/`. Commit after every step.
