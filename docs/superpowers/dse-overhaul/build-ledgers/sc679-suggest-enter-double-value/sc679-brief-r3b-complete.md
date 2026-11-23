# SC-679 r3b brief: finish the r3 fix round (fresh implementer)

You are a fresh implementer for ticket SC-679 in the `draw-steel-elements` Obsidian plugin. The r3
implementer was cut off by a usage limit after committing; it left no report and no recorded gate result.
You finish its round. This brief plus the files it names are enough. Your final text goes to the
ticket-owner (an agent), not a human. **Workers never call the tracker (Linear): not to read, not to post.**

## 1. Context loading (in this order)

1. Ledger (current state; the last three entries describe exactly what is on disk):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/decisions.md`
2. The r3 fix brief (F1-F5, the task you are finishing):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-brief-r3-fix.md`
3. The review findings VERBATIM (lines 16-100 only):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r2-reviewer-report.md`
4. The r1 brief, section 1 item 3 (which line ranges of the 480 KB `dse-verify` skill to read; never read
   it whole) and section 4 (footguns: ALL apply unchanged, except the scratch folder, see below):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-brief-r1-implementer.md`
   The r1 report's executive summary, for how the scratch tree and e2e were run:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r1-implementer-report.md`

Paths (the ONLY places you edit):

- superproject worktree: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value`
- plugin clone (land branch): `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`
- branch `sc679-suggest-enter-double-value` in both.
- YOUR scratch folder (scripts, logs, the scratch git worktree; unique names):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc679-r3b-impl/`
  The old scratch folder under session `5812b474-…` no longer exists. Do not recreate that path.
- The SC-443 worktree (`/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert`) is READ-ONLY.
- Never write under `/home/scott/code/steelCompendium/workspace/` except your report file (section 5).
  The workspace-level `CHANGELOG.md` you may touch is
  `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/CHANGELOG.md`.

State on disk at dispatch (verify, then proceed):

- plugin clone clean at `6a3cf95c` = 6 commits on `3b47e55b`; F1 = `63cb6e8c`, F2 = `6a3cf95c`.
- scratch branch `sc679-on-sc443` @ `ed71aeff` exists in the plugin clone's refs: SC-443 tip `ae9025ea` + six
  cherry-picks of the land commits + ONE top commit with the marker flips and AUTH-G15..G20 / AUTH-K10..K16.
  Its worktree directory is gone (`git worktree list` shows five `prunable` entries under the dead session
  path).
- `…/sc679-on-sc443.patch` in the ledger dir was generated from `ed71aeff`.
- superproject worktree at `ffa0feb9` (one CHANGELOG commit) on `3a517cdf`; ` M draw-steel-elements` is the
  unstaged pointer and stays unstaged.

## 2. The task, in order

**T1. Rebase the land branch.** `git -C <plugin clone> fetch origin`; `origin/develop` must be
`fefd902922c42f2e93fc8756d26be6549463f294` (if it is not, rebase onto what it is and report the sha).
`git -C <plugin clone> rebase fefd902922c42f2e93fc8756d26be6549463f294`. Expected conflict: the plugin's
`CHANGELOG.md` only (keep every other ticket's bullet and ours). `3b47e55b..fefd9029` does not touch
`src/authoring/`, `test/dom/authoring/`, `test/mocks/` or `package.json` / `package-lock.json`; confirm with
`git diff --stat`, and run `npm ci` only if a package file did change. Then
`git -C <plugin clone> range-diff 3b47e55b..6a3cf95c fefd9029..HEAD` and put its output in the report.

**T2. Rebase the superproject branch.** `git -C <superproject worktree> fetch origin`;
`git -C <superproject worktree> rebase b79eef2ba67a6cf8cc808ba7bae339ddf0fcc831`. Expected conflict:
`CHANGELOG.md` under `## Unreleased` (keep every other bullet and ours). Do NOT `git add` any submodule
path, do NOT run `git submodule update` or `just sync`: after the rebase other submodules may show as
modified, that is expected and is the dispatcher's to handle. If the rebase refuses to start, STOP and
report the message; do not stash or force.

**T3. Verify F1-F5 are complete, and finish what is not.** Read `git -C <plugin clone> diff fefd9029..HEAD`
and `git -C <plugin clone> show ed71aeff` against the r3 brief section 2, item by item (F1, F2 on the land
branch; F3, F4, F5 in the scratch branch's top commit). Check the docs line (`docs/writing-blocks.md`) and
both CHANGELOG bullets still read true. Anything missing or wrong: fix it with a NEW commit
(`fix(SC-679): …` / `test(SC-679): …`; no amend, no force-push, no push at all). The r3 brief's "Out of
scope" list holds: SC-682, SC-681, SC-678; do not edit `src/authoring/suggest.ts`.

**T4. Recreate the scratch tree.** `git -C <plugin clone> worktree prune`, then
`git -C <plugin clone> worktree add <your scratch folder>/on-sc443 sc679-on-sc443`, `npm ci` there (script
file, output to a log). The scratch branch stays on SC-443 tip `ae9025ea` (do NOT rebase it onto develop:
SC-443 is another owner's unlanded branch). Confirm
`git -C <plugin clone> diff sc679-on-sc443 HEAD -- src/authoring/schemaSuggest.ts` shows only SC-443's own
`stampControl` lines in `renderSuggestion`, i.e. `selectSuggestion` is identical in both. If T3 changed a
land commit's `src/` or test content, bring the scratch branch level (cherry-pick below the top commit, or
rebuild it as the r3 brief's "Mechanics" paragraph says) and regenerate the patch (overwrite) from the one
top commit. If nothing changed, leave the branch and the patch as they are and say so.

**T5. Prove the burst e2e tests are not vacuous (r3 brief F3).** In the scratch tree only: remove the
`this.close();` line from `selectSuggestion` (uncommitted), build, run the authoring e2e, record the summary
line and the ids that fail (the burst tests must be among them). Restore the file
(`git -C <scratch tree> checkout -- src/authoring/schemaSuggest.ts`), rebuild, run again, record the
summary line. Name the burst test ids in the report.

**T6. Gates** (section 3), at the final land head.

## 3. Gates, expected numbers at base `fefd9029`

One blocking foreground call per gate; script files through `devbox run -c <abs plugin dir> -- bash <script>`;
logs uniquely named in your scratch folder; read each gate's own summary line.

| Gate | Where | Expect |
|---|---|---|
| `npm run tsc`, `npm run lint` | land | clean |
| `npx jest` | land | 0 failed. Base is **13902 passed / 2 skipped** fresh (**13903 / 1** when `visual-harness/dist/obsidian-app.css` is cached). State the net number of tests the land diff adds (count them in `git diff fefd9029..HEAD -- test/`) and show measured = base + that number |
| lifecycle, all seven `--only=` parts | land | union **64/64**. If only G-S61 is red, on its torn-read line, that is SC-668 (a listed host-load flake): re-run that one part once and report both lines |
| full `npm run e2e` | land | `OBSIDIAN-E2E done: 664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`. A listed flake (INIT-W10, SET-X03, SET-X04, INIT-W09, NEGO-R05) may be re-run alone once |
| built `styles.css` sha256 | land | report it. The land diff touches no CSS source (confirm with `git diff --stat fefd9029..HEAD`), so shots 592, freeze 280/280 and parity 0 / 0 / 24 carry; do not run them |
| `npm run e2e -- --element=authoring` | scratch | 0 failed, 2 known-bug (SC-675's two markers, unfixed on that base); r1's count was 79, report the new total and which ids are new since r1 |
| jest `test/dom/authoring`, `npm run tsc`, `npm run lint` | scratch | green / clean |
| patch check | scratch | `git apply --check` of `sc679-on-sc443.patch` succeeds on a tree = `ae9025ea` + the six land commits (state exactly what the patch applies on top of) |

A stale superproject pin can make doc-reading jest tests fail falsely (`token-coverage.test.ts` reads
`docs/superpowers/dse-overhaul/D3-token-map.md` from the superproject). T2 should prevent it. If it still
fails, compare the worktree's copy with `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`
and use the test's `DSE_TOKEN_MAP_PATH` override pointed at the main checkout's copy; it is not a code
defect and not a reason to edit the branch.

## 4. Footguns

Section 4 of the r1 brief applies in full (devbox script files, `git -C`, no pattern kills, no variable or
glob `rm`, no heredocs, no background jobs or monitors, Scott's vault dirt in the main checkout is
expected). Restated because they bite most:

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents: the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it: the 600 s stream watchdog kills silent
  agents. Lifecycle parts and e2e each go in their own call; if one would pass the 10-minute tool limit,
  start it with output to a log and poll the node PID with `tail --pid=<pid> -f /dev/null` in blocking
  calls. Never end your turn "waiting for a notification": nothing wakes you.
- You cannot `SendMessage` me: a depth-2 agent cannot address its parent by any name, and `to: 'main'`
  routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn
  with STATUS: NEEDS_CONTEXT and the question in your report: I see your completion notification and will
  resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-679:`.
- Commit after every coherent step. No Co-Authored-By, no AI attribution, in any commit. Never push. Never
  create a tag or release. Never run `just deploy*`, `just wt-finish`, `just wt-rm` or `just sync`.
- Delete only literal paths you created under your own scratch folder. Never touch `/tmp/dse-obsidian-*`
  by pattern.

## 5. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r3-fix-report.md`,
opening with an executive summary of at most 10 lines: STATUS (DONE / DONE_WITH_CONCERNS / BLOCKED /
NEEDS_CONTEXT), land head sha and its base sha, superproject head sha and its base sha, scratch branch sha,
each gate's measured summary line, the with / without `close()` result for the burst tests. Then: the
range-diff, per F1-F5 "complete as found" or what you changed (file:line), the e2e ids new since r1, whether
the patch was regenerated and what it applies on top of, `Drive-by fixes:` and `Follow-ups:` lists.

Final text to me: raw facts only (STATUS, shas, measured numbers), no prose, plus the absolute path of
every artifact you produced (report, patch, every gate log, the scratch tree).
