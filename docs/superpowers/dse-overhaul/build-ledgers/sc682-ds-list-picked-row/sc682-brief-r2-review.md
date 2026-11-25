# SC-682 r2 — independent review brief: the `/ds` list closes after a pick

You are the independent reviewer for ticket SC-682. You did not write this code. Your final text
goes to the ticket-owner (an agent), not a human. **You never call the tracker (Linear).**
**Execute and probe — do not just read.** Do not fix anything; report.

## 1. Context loading

1. The decisions ledger (the spec: Scott's ticket text verbatim as R1 + owner calls O1–O7):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-decisions.md`
2. The implementer's brief and report (read the report's executive summary and its measurement
   table; treat every claim in it as unverified):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-brief-r1-impl.md`
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r1-impl-report.md`
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row`, plugin repo
   `draw-steel-elements` inside it, branch `sc682-ds-list-picked-row`, base dse `develop` @ `bb3a3d10`.
   The head sha to review is given in the dispatch message. Diff: `git -C <plugin repo> diff bb3a3d10..HEAD`.
   **Do not commit, do not edit tracked files in the worktree.** Scratch probes (temporary jest
   files, a temporary e2e spec) are fine if you delete each one by its literal path afterwards and
   leave `git -C <plugin repo> status --short` clean. Every git command uses `git -C <absolute path>`.
   The main checkout `/home/scott/code/steelCompendium/workspace/` is shared: write only your
   report there. Its `draw-steel-elements` dirt is Scott's live vault — expected, not a finding.
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` —
   ~500 KB, do NOT read it whole: lines 1–30, 146–266, 1551–1554, and grep for the rest.
   Plugin `e2e/README.md` for the e2e conventions. `node_modules` is already installed in the worktree.

## 2. What to attack

Scott's expected behaviour, verbatim (R1): "after any pick the list is closed, so the next Enter
is a new line at the cursor." The fix is small; the risk is in what a closed list changes in real
Obsidian and in tests that look green but do not test it. Hunt by running things in real
Obsidian 1.14.4 (a scratch e2e spec, or `npm run e2e -- --only=<ids>`).

A. **The new tests are real.** For each new e2e and jsdom test: does it fail on `bb3a3d10`'s
   `src/`? Check out the base `src/authoring/suggest.ts` in a scratch `git worktree add` checkout
   (under your scratch folder) carrying the branch's tests, build, and run the new ids there.
   Every one that passes on the base is vacuous — a finding. In particular the "no wait" tests:
   read them and confirm there is truly no `waitList` / `waitNoList` / `closeList` / pause between
   the accept key and the second Enter (the ticket: "A test that first waits for the list to go
   away passes even without the fix").
B. **O1 across the matrix**, by your own probes, not the implementer's tests: all thirteen
   advertised elements (`/ds` + arrows, or each alias) × Enter pick; a sample × click pick; Live
   Preview and Source mode; token on an empty line, mid-line with text before, with text after the
   cursor, under `- item`, under `1. `, in a callout (`> `), at the very first and very last line
   of a note, in a note with properties. For each: after the pick, with no wait, press Enter —
   the note text equals what "pick, Escape, Enter" writes on the base build (O2); then 1.5 s later
   no list of any kind is on screen and no Notice was shown.
C. **What the close changes.** After a pick: (1) typing on a body line of the fresh block still
   opens the in-block key list, and a key accept there still works (SC-679 behaviour intact:
   cursor after the key, list closed); (2) typing `/ds` on a later empty line opens the `/ds` list
   again; pick a second block; both intact; (3) pick, then Ctrl+Z: one undo removes the block and
   restores the typed token (compare with the base build — the undo steps must be the same);
   (4) pick, then arrow keys / typing text immediately (no wait): keys reach the editor, none is
   swallowed by a list scope; (5) Escape after a pick does nothing harmful; (6) two picks in quick
   succession in two different notes / panes; a pick in a second pane while a list is open in the
   first, if you can drive it; (7) console: no exception from `close()` being called when the list
   is already closed (the click path — Obsidian may close it itself first).
D. **SC-687 behaviour intact.** A refused pick (token typed where `/ds` is still offered inside a
   blind-spot block, SC-676) shows exactly ONE Notice, leaves the token as typed, leaves no list;
   a second Enter after it is a plain new line, no second Notice.
E. **Integrity probes** (anything that writes into user files): text above and below the picked
   block byte-identical; a second same-kind block in the note untouched; no doubled scaffold, no
   stray `/ds` token, no doubled word after "pick, Enter, Enter, Enter"; the written scaffold is
   byte-identical to the base build's for every element (`git diff bb3a3d10..HEAD -- src` should
   show no change to what is written — confirm).
F. **The O5 test edits.** `git diff bb3a3d10..HEAD -- e2e test`: read every removed or changed
   line. Each replaced `closeList()` now asserts "no list" WITHOUT dismissing one (a helper that
   sends Escape, or that waits long enough for a late list and then passes, hides the bug). No
   existing assertion weakened or deleted. Remaining `closeList()` calls are not after a `/ds` pick.
   New e2e ids, manifest entries and coverage pairs follow `e2e/README.md`.
G. **Scope (O7).** No behaviour change in `blockInsert.ts`, `fenceScan.ts`, `schemaSuggest.ts`; the
   three SC-676 `test.failing` markers untouched and still failing-as-expected; nothing from
   SC-676 / SC-688 / SC-692 pulled in.
H. **Docs and strings.** Plugin `CHANGELOG.md` and the superproject
   `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/CHANGELOG.md`: each bullet
   true, plain words, in the file's convention. Code comments true (including `closeList`'s doc
   comment). No co-author / AI attribution in any commit message (`git log bb3a3d10..HEAD` in the
   plugin repo and `git log origin/main..HEAD` in the superproject).

## 3. Gates you re-run

- tsc (incl. `tsc -p e2e`), lint, jest — full. Jest baseline in this worktree before the change:
  14674 passed / 2 skipped without the shots cache (one more passed / 1 skipped with it); compare
  with the report's delta.
- e2e: the full `npm run e2e`. Expected `0 failed`, **10 known-bug**, `coverage: Y/Y pairs`, ok and
  total as the report states (baseline `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`).
- Lifecycle: not re-run by you unless your findings touch it (the implementer's 64/64 stands).
- `styles.css`: rebuild and compare its sha256 with the report's two hashes (the carry claim for
  shots 592 / freeze 280/280 / parity 0/0/24 rests on it).

Known flakes under load (INIT-W09, NEGO-R05, NEGO-R08, G-S63): re-run alone before believing a
red, report either way. Other efforts may run gates concurrently in other worktrees.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r2-review-report.md`.
**It must open with a ≤10-line executive summary**: verdict (LAND-READY / FIX-REQUIRED), counts
by severity, gate lines. Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with `file:line`, the failing scenario as exact note text + keys sent + what was written or shown,
real-Obsidian confirmation or "jsdom only", and a prescribed fix. Then your probe table (case →
base build result → branch result). If the report-file write is blocked, return the report inline.

## 5. Return contract

Raw facts, no prose: VERDICT; head sha reviewed; each gate's measured summary line; findings as
one line each (severity, file:line, scenario); the vacuity result per new test id (red on base:
yes / no); `git status --short` of the plugin repo and of the worktree superproject after your
cleanup; **the absolute path of every artifact** (report, logs, any PNG). `Follow-ups:` for
anything out of scope you noticed. Workers never file tickets.

## 6. Footguns

- **You cannot `SendMessage` me**; `to: 'main'` reaches the dispatcher, not me. Need input → end
  your turn with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start `SC-682:`.
- **Devbox**: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 — record
  exit codes inside a script FILE and read each gate's own summary line. Never pipe a gate.
- **Scratch**: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-review-r2/`,
  uniquely named scripts and logs, created with the Write tool (no heredocs).
- **Each gate is one blocking foreground call**, output to a log file (the 600 s stream watchdog
  kills silent agents). No `run_in_background`, no Monitor. If the Bash tool backgrounds a call
  by itself (after 120–180 s), poll YOUR OWN pid (`timeout 100 tail --pid=<pid> -f /dev/null`,
  pid checked with `readlink /proc/<pid>/cwd`) and read the gate's log — never wait for a notice.
- **Never key a wait-loop on a scratch filename or its contents** — stale logs from other
  branches match. Read the process's own output, or write to a per-run unique path.
- **No `rm` with a variable or glob target**; never `rm -rf` a shared `/tmp` glob; never touch
  `.superpowers/` outside `sc682-ds-list-picked-row/`. Never `pkill` / `killall` by pattern —
  kill only a PID whose `/proc/<pid>/cwd` is inside this worktree.
- A scratch e2e spec must not be left in the tree, and a scratch `git worktree add` checkout goes
  under your scratch folder at an absolute path and is never re-pointed.
