# SC-682 r4 — scoped re-review of the r3 delta (rebase + three folds)

You are a re-reviewer for ticket SC-682. You did not write this code. **Review only; change
nothing, commit nothing.** Your final text goes to the ticket-owner (an agent), not a human.
**You never call the tracker (Linear).** This is a scoped check of a small delta, not a fresh
full review: the full review (r2) already passed the r1 head `8b32ac9b`.

## 1. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-decisions.md`
   (read "Base moved" and "r2 findings — owner rulings").
2. Same dir: `sc682-brief-r3-fix-rebase.md` (what r3 was told to do), `sc682-r3-fix-report.md`
   (executive summary; treat claims as unverified), `sc682-r2-review-report.md` (LOW-1, INFO-1,
   MEDIUM-2 only).
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row`; plugin repo
   `draw-steel-elements` inside it. The head shas to check are in the dispatch message.
   Every git command is `git -C <absolute path>`. The main checkout
   `/home/scott/code/steelCompendium/workspace/` is shared: write only your report there; its
   `draw-steel-elements` dirt is Scott's live vault, not a finding.

## 2. What to check

A. **The rebase carried the r1 work over unchanged.**
   `git -C <plugin repo> range-diff bb3a3d10..8b32ac9b a0e55f6b..HEAD` (the r1 commits must show
   as equal apart from CHANGELOG context; the r3 commits are new). The branch sits on `a0e55f6b`
   (`git merge-base`), the superproject branch on `0d6f4897`; no merge commits; no submodule
   pointer bump committed in the superproject (`git -C <worktree> diff origin/main..HEAD --stat`
   shows `CHANGELOG.md` only). Both CHANGELOG files still hold SC-690's bullets and every other
   pre-existing bullet (`git diff a0e55f6b..HEAD -- CHANGELOG.md` and
   `git -C <worktree> diff 0d6f4897..HEAD -- CHANGELOG.md` show additions only).
B. **The `finally` fold.** `src/authoring/suggest.ts` `selectSuggestion`: `close()` runs exactly
   once on the written path, the refused path and the throwing path; the error still propagates
   (not swallowed); `if (!this.context) return;` still comes first; nothing else changed in `src/`
   (`git diff 8b32ac9b..HEAD -- src` is this function only — note 8b32ac9b is the pre-rebase sha;
   if it is unreachable use `git diff a0e55f6b..HEAD -- src`). **No stale-range guard, no
   `onTrigger` re-run, no `schemaSuggest.ts` change** — that is SC-693 and must not be here.
   The new jsdom test: read it, and show it is red without the `finally` (revert that one hunk in
   a scratch copy of the file under your scratch folder or reason from a run; do not leave the
   worktree dirty).
C. **Wording (LOW-1).** Plugin `CHANGELOG.md`, the worktree superproject's
   `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/CHANGELOG.md`, and the
   `suggest.ts` comment: no sentence says or implies the row stayed up for Stamina bar and Skills
   ONLY; no "first few milliseconds"; every statement true against the r2 report's measurements;
   plain words.
D. **INFO-1.** AUTH-S03 (`e2e/specs/authoring/ds-suggest.e2e.ts`) and AUTH-I40
   (`e2e/specs/authoring/insert-commands.e2e.ts`) use `expectNoList()` after the pick; no other
   assertion in either test changed or went away; `expectNoList()` itself is unchanged since r1
   and sends no Escape.
E. **Commits.** `git log a0e55f6b..HEAD` (plugin) and `git log 0d6f4897..HEAD` (superproject):
   subjects sensible, no co-author / AI attribution lines.

## 3. Gates you re-run (bounded)

- tsc (`npm run tsc`, incl. `tsc -p e2e`) and lint.
- jest, full. Compare with the r3 report's number.
- e2e: only the authoring specs' ids that the delta touched plus the SC-682 set — `AUTH-S02,
  AUTH-S03, AUTH-S04, AUTH-S09, AUTH-S10..AUTH-S17, AUTH-G09, AUTH-I40` via `--only=` (see
  `e2e/README.md` for the flag). All green. Do NOT re-run the full e2e or lifecycle: the
  implementer's full runs on this head stand unless B–D turn something up.
- `styles.css` sha256 after a build equals the r3 report's hash.

Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/draw-steel-elements -- bash <script file>`;
record exit codes inside the script file; never pipe a gate; each gate one blocking foreground
call with output to a log file; no `run_in_background`, no Monitor. Scratch folder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-rereview-r4/`
(Write tool for files, unique names). No `rm` with a variable or glob target; no `pkill` by
pattern; never touch `.superpowers/` outside `sc682-ds-list-picked-row/`. Never key a wait-loop on
a scratch filename or its contents — read the process's own output.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r4-rereview-report.md`,
opening with a ≤10-line executive summary (if the write is blocked, return it inline).

Final text, raw facts only: VERDICT (LAND-READY / FIX-REQUIRED); shas checked; A–E one line each
(pass / finding with `file:line` and severity); each gate's measured summary line;
`git status --short` of both repos when you finish; absolute path of the report and logs;
`Follow-ups:`. You cannot `SendMessage` me — need input → end with STATUS: NEEDS_CONTEXT and the
question; any message you do send must start `SC-682:`.
