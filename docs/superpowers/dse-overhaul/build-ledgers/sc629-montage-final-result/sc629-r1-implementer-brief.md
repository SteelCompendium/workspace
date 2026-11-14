# SC-629 r1 — implementer brief: a montage that ran out of rounds with nothing logged says "Total Failure"

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose,
plus the absolute path of every evidence artifact you produced. You never call the tracker (Linear) — not to
read history, not to post. Everything you need is in this brief and the ledger.

## 1. Context loading

- Ledger (read first, it is the current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc629-montage-final-result/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc629-montage-final-result` — branch
  `sc629-montage-final-result` in the superproject and every submodule. The plugin is
  `<worktree>/draw-steel-elements`, currently at dse `develop` `10c271fe`. Superproject at workspace main `20004425`.
- First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `10c271fe`;
  if it moved, `git -C <worktree>/draw-steel-elements rebase origin/develop` and say so in the report.
- Verify `pwd`/paths before any write. **Never edit anything under `/home/scott/code/steelCompendium/workspace/`**
  except your report in the ledger dir. The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's
  superproject: `/home/scott/code/steelCompendium/worktrees/sc629-montage-final-result/CHANGELOG.md`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections "The battery, in
  order", "Devbox wrapping", "Stale main.js", "Jest timeouts under load", "Lifecycle and e2e notes" (esp. the
  montage notes: SC-625 own properties, SC-628 typed values / `setNumber`), "THE exit-code footgun", and
  "Freeze semantics" as needed. The file is ~370 KB: read it by line range (`grep -n '^##'` for headings).
- Prior art, landed: SC-438 (montage e2e), SC-625, SC-626, SC-627, SC-628. Ledgers in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`.

## 2. The task

Bug (ticket, verbatim): "A montage with `rounds: 2`, `current_round: 3` and no logged actions (the Director
pressed End round twice) shows, in its result band: the heading "Final result", the verdict word "Not started",
the rule line "Total Failure — no Victories awarded." and "2 rounds used". The verdict and the rule line
contradict each other."

Ruling (owner D1, from the ledger, verbatim): "fix in the model — `pending` only while the montage is NOT
complete; a complete montage at 0/0 is `failure` (verdict word "Total Failure", heading "Final result", skull
crest, matching the rule line). The SC-629 e2e marker MONT-W03 becomes a plain test. User-facing: one CHANGELOG
bullet under `## Unreleased`."

Basis (book, ledger): "If the heroes hit the failure limit or time runs out, and if they don't have at least two
more successes than failures, they suffer total failure."

Where: `src/elements/montage/model.ts` `montageOutcome` (~:466) returns `pending` at 0/0 before anything else;
`montageTallies(m).complete` is the completeness notion the band already uses. Update the doc comment above
`montageOutcome` (it argues "a montage that has not started is not a Total Failure" — still true for a LIVE one).
Check every reader of `montageOutcome` / `BAND_WORD` / `BAND_ICON` / `data-band` (OutcomeBandView, HeadView, any
chrome/sidebar summary, CSS keyed on `data-band="pending"`) and say in the report what each now shows for the
complete-0/0 case. Do not change the live (not complete) 0/0 case: it stays "Not started" / "This montage".

Tests:
- e2e: `e2e/specs/montage/wrong-values.e2e.ts:118` `knownBug('SC-629', '[MONT-W03] …')` → plain test, and
  tighten it to assert the verdict word is "Total Failure" and the heading "Final result" (not just "agree").
  Never put a bracketed ticket id in a test title (the runner reads titles for scenario ids).
- jest: unit tests for `montageOutcome` at 0/0 complete (out of rounds) → `failure`, 0/0 live → `pending`, and
  the edge cases you find (e.g. `rounds: 0`; unset limits 0; 1 success / 0 failures out of rounds → `failure`;
  2/0 out of rounds → `partial`). A jsdom test of the drawn band (word, heading, crest, `data-band`, rule line)
  for the complete-0/0 board. Check that a reopen (Add a round) from that state goes back to "Not started".
  If an existing test pinned the old behaviour, change it and name it in the report.
- CHANGELOG bullet under `## Unreleased` in the worktree's superproject `CHANGELOG.md`, plain words, matching
  the style of the SC-628 bullet already there.

Out of scope (do not touch): SC-631, SC-650, SC-655, SC-630, SC-632. Report anything else you notice as
`Follow-ups:`; obviously-correct local fixes in files you touch as `Drive-by fixes:`.

## 3. Gates (dse-verify, full battery, in order) and the numbers to expect

Fresh worktree: run `npm ci` in `<worktree>/draw-steel-elements` once first (through
`devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

Baseline at `10c271fe`: tsc (incl. `tsc -p e2e`) and lint clean · jest **13307 passed / 2 skipped** fresh ·
lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`** ·
shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity
**0 / 0 / 24**.

Expected after the fix: jest 13307 + your new tests, 0 failed · lifecycle 64/64 · e2e `586/604 ok, 0 failed,
18 known-bug, coverage: 416/416 pairs` (plus any new e2e tests you add, which add to both ok and total; no new
pair expected) · shots 592 · freeze 280/280 unless a frozen shot draws a complete-0/0 montage — if any frozen
hash moves, do NOT touch the baseline: write
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc629-montage-final-result/rebaseline.txt`
(ready-to-apply hash lines) plus before/after crops and say so · parity 0 / 0 / 24.

Lifecycle runs in SEVEN parts with `--only=` (EQUALS SIGN; with a space the runner silently runs the whole
suite — check the first lines of each log print only that part's ids). One part per Bash call:
- `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16) — take the exact id lists from dse-verify's lifecycle row
- `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
- `G-S57,G-S62,G-S61,G-S56` (4)
- `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
- `G-S92,G-S96,G-S97,G-S99` (4)
- `G-S108,G-S112,G-S115` (3)
A part over 180 s is moved to the background by the Bash tool: start it with output to a unique log, then wait
with `timeout 175 tail --pid=<your node pid> -f /dev/null` in repeated calls and read the log. Your pid is the
one whose `readlink /proc/<pid>/cwd` is your worktree's `draw-steel-elements`.

Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) is a
suspected flake (SC-633): re-run part 7 once; any other failure is real. INIT-W10 e2e flaked once under heavy
load (SC-654). SC-622: the Obsidian camera can leave `demo-vault/.obsidian/appearance.json` dirty, which fails
G-S97 — `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` before blaming the change. Jest
timeout is 30 s: an "Exceeded timeout" is a real hang until proven otherwise (re-run the suite alone).

## 4. Footguns (each cost real time once)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc629-montage-final-result/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c`; no `| tail` on a gate.
  Record exit codes from a script file; read each gate's own summary line.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (literal paths only).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and never `rm` with a shell
  variable or a glob: it hangs on a permission prompt. Leave throwaway files in place; write new uniquely named ones.
- Your scratch: a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r1-impl/`
  with uniquely named scripts and logs. Create files with the Write tool.
- `git -C <absolute path>` for every git command, never `cd X; git …`.
- Kill only by PID, only a PID inside your worktree (`readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern.
- Run each gate as a blocking foreground call; no `run_in_background`, no Monitor. Never key a wait-loop on a
  scratch filename or its contents — read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`)
  is Scott's live vault — expected, not yours, do not touch or report it.
- Commit after every coherent step. In dse: commits on branch `sc629-montage-final-result`, messages like
  `fix(SC-629): …` / `test(SC-629): …`. In the superproject: ONE commit for the CHANGELOG bullet, then at the very
  end ONE `chore: bump draw-steel-elements to <sha> (SC-629: …)` pointer commit. No interim pointer commits. Do
  not push anything. Do not tag. Git commit messages: no Claude/AI attribution or Co-Authored-By trailers.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question; I will resume you. If you ever send a message anyway, its first word must be `SC-629:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc629-montage-final-result/sc629-r1-implementer-report.md`.
Open it with a ≤10-line executive summary (verdict, dse head sha, superproject head sha, every gate's measured
number). Then: the diff summary by file, what each `montageOutcome` reader shows for complete-0/0, tests
added/changed, `Drive-by fixes:`, `Follow-ups:`, and evidence paths. If the report-file write is blocked by your
harness, return the report inline.

Return contract: final text = verdict, shas, measured numbers, report path, evidence paths. No prose.
