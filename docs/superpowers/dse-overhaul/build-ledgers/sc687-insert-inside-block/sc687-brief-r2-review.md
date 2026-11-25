# SC-687 r2 — independent review brief: insert refusal inside an existing block / the properties

You are the independent reviewer for ticket SC-687. You did not write this code. Your final text
goes to the ticket-owner (an agent), not a human. **You never call the tracker (Linear).**
**Execute and probe — do not just read.** Do not fix anything; report.

## 1. Context loading

1. The decisions ledger (the spec: Scott's ticket text verbatim + owner calls O1–O7):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-decisions.md`
2. The implementer's brief and report (read the report's executive summary and its verdict table;
   treat every claim in it as unverified):
   `…/sc687-insert-inside-block/sc687-brief-r1-impl.md`
   `…/sc687-insert-inside-block/sc687-r1-impl-report.md`
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block`, plugin repo
   `draw-steel-elements` inside it, branch `sc687-insert-inside-block`, base dse `develop` @ `aee83dc1`.
   The head sha to review is given in the dispatch message. Diff: `git -C <plugin repo> diff aee83dc1..HEAD`.
   **Do not commit, do not edit tracked files in the worktree.** Scratch probes (temporary jest
   files, a temporary e2e spec) are fine if you delete each one by its literal path afterwards and
   leave `git -C <plugin repo> status --short` clean. Every git command uses `git -C <absolute path>`.
   The main checkout `/home/scott/code/steelCompendium/workspace/` is shared: write only your
   report there. Its `draw-steel-elements` dirt is Scott's live vault — expected, not a finding.
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` —
   ~500 KB, do NOT read it whole: lines 1–30, 146–266, 1551–1554, and grep for the rest.
   Plugin `e2e/README.md` for the e2e conventions. `node_modules` is already installed in the worktree.

## 2. What to attack

The change guards a write into user notes. A missed case corrupts a note; an over-eager guard
blocks a legitimate insert with a confusing message. Hunt both, by running things.

A. **The position scan** (`src/authoring/fenceScan.ts` + wherever the guard is). Write your own
   table of inputs and run it against the pure function (scratch jest file), then confirm the
   surprising rows in real Obsidian (scratch e2e spec or `npm run e2e -- --only=<ids>`): what
   Obsidian actually draws is the ground truth, not CommonMark from memory. At least:
   - fences: backtick / tilde, 3 vs 4+ markers, a shorter or other-character marker inside (not a
     closer), a closer with trailing spaces, a "closer" with text after it (not a closer), an
     info string with a backtick (SC-476: not an opener), `~~~` holding ```` ``` ````;
   - unclosed fence at the end of the note; an empty note; cursor on the last line with no newline;
   - quote / callout prefixes: `> `, `>` without a space, nested `> > `, a fence that leaves the
     quote (a non-quoted line inside a quoted fence ends it in Obsidian — what does the scan say?);
   - list-indented fences: under `- `, `* `, `+ `, `1. `, `10. `, nested bullets (2 / 4 / 6 spaces,
     tabs), a list item inside a callout, a fence under a list item after a blank line, a fence
     indented LESS than the item's content column (it ends the item — top-level fence);
   - a 4-space-indented ```` ``` ```` at top level (indented code, literal) — does the guard then
     refuse everything below it to the end of the note? How narrow is the false refusal really?
   - the properties: `---` at line 0 closed / unclosed / with trailing spaces / empty; `---` at
     line 1 after a blank line (not properties); a `---` rule mid-note; a fence INSIDE the
     properties text; properties followed directly by a fence;
   - opening line: ch 0, inside the quote prefix, inside the indentation, mid-marker, end of line;
   - closing line: ch 0, mid-marker, end, end after trailing spaces;
   - selections: from outside / to inside, from inside / to outside, both inside different blocks,
     both outside around a whole block (must behave as on `aee83dc1`), a reversed selection
     (anchor after head), multiple cursors if the editor supports them (what happens?).
B. **Every insert path refuses, and only refuses when it should.** All element commands go
   through one function — confirm by grep that no caller writes to the editor around `insertBlock`
   (`replaceSelection` / `replaceRange` / `transaction` under `src/authoring/` and anything else
   that inserts a fenced block: grep `src/` for `wrapFence`, "```"). Compendium reference, Shift-pick
   variant, snapshot, the `/ds` pick, any ribbon / context-menu / modal "insert" entry.
C. **Refusal side effects**: exactly one Notice per refused action on every path (count them in
   real Obsidian for the compendium commands — early check + write-time check must not both
   fire); no editor change, no undo entry, cursor and selection unchanged, focus returns to the
   editor; the compendium search modal never opens on an early refusal; a refused `/ds` pick
   leaves the token and closes the list cleanly (no stuck suggest, no exception in the console).
D. **Integrity probes** (required for anything that writes into user files): content above and
   below survives byte for byte; two same-kind blocks do not cross-talk; a hand-edited block
   (odd spacing, tabs) is still recognised; refuse, then a valid insert elsewhere in the same note
   works; refuse, undo — nothing changes; the allowed edge positions (before an opening marker,
   end of a closing line, end of the properties' closing line) leave every existing block and the
   properties intact AND the new block draws in Reading view.
E. **Scope (O5).** `scanFenceState`'s answers for `suggest.ts` and `schemaSuggest.ts` are unchanged
   (diff its behaviour on your table against `aee83dc1`), the three SC-676 `test.failing` markers
   are untouched and still failing-as-expected, no suggester trigger changed. Nothing from
   SC-676 / SC-682 / SC-688 was pulled in.
F. **SC-675 regression.** Every pre-existing insert shape (empty line, mid-line, callout, list
   item, text after the cursor, `endLine`) writes the same bytes as on `aee83dc1`.
G. **Tests are real.** For each new test, ask whether it would fail on `aee83dc1` (stash the
   `src/` change in a scratch `git worktree add` checkout, or reason from a run): a test that
   passes on base is vacuous. The three former `test.failing` markers and `AUTH-I27` are plain
   tests now. No existing test weakened or deleted (`git diff aee83dc1..HEAD -- test e2e`, read
   every removed line). New e2e ids and coverage pairs follow `e2e/README.md`.
H. **Docs and strings.** The two Notice texts match O2 verbatim. `docs/writing-blocks.md`, both
   changelogs (plugin `CHANGELOG.md`; superproject
   `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/CHANGELOG.md`), code
   comments: every statement true, plain words, no claim that `/ds` never offers itself there.
   No co-author / AI attribution in any commit message (`git log aee83dc1..HEAD`).

## 3. Gates you re-run

- tsc (incl. `tsc -p e2e`), lint, jest — full. Jest baseline in this worktree before the change:
  14438 passed / 2 skipped without the shots cache (14439 / 1 with it); compare with the report's delta.
- e2e: the full `npm run e2e`. Expected `0 failed`, **10 known-bug**, `coverage: Y/Y pairs`, ok and
  total as the report states (baseline `794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs`).
- Lifecycle: not re-run by you unless your findings touch it (the implementer's 64/64 stands).
- `styles.css`: rebuild and compare its sha256 with the report's two hashes (the carry claim for
  shots 592 / freeze 280/280 / parity 0/0/24 rests on it).

Known flakes under load (INIT-W09, NEGO-R05, NEGO-R08, G-S63): re-run alone before believing a
red, report either way. Other efforts (SC-690) run gates concurrently.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r2-review-report.md`.
**It must open with a ≤10-line executive summary**: verdict (LAND-READY / FIX-REQUIRED), counts
by severity, gate lines. Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each
with `file:line`, the failing scenario as exact note text + cursor position + what was written,
real-Obsidian confirmation or "jsdom only", and a prescribed fix. Then your probe table (input →
verdict → what Obsidian draws). If the report-file write is blocked, return the report inline.

## 5. Return contract

Raw facts, no prose: VERDICT; head sha reviewed; each gate's measured summary line; findings as
one line each (severity, file:line, scenario); `git status --short` of the plugin repo and of the
worktree superproject after your cleanup; **the absolute path of every artifact** (report, logs,
any PNG). `Follow-ups:` for anything out of scope you noticed. Workers never file tickets.

## 6. Footguns

- **You cannot `SendMessage` me**; `to: 'main'` reaches the dispatcher, not me. Need input → end
  your turn with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start `SC-687:`.
- **Devbox**: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 — record
  exit codes inside a script FILE and read each gate's own summary line. Never pipe a gate.
- **Scratch**: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r2/`,
  uniquely named scripts and logs, created with the Write tool (no heredocs).
- **Each gate is one blocking foreground call**, output to a log file (the 600 s stream watchdog
  kills silent agents). No `run_in_background`, no Monitor. If the Bash tool backgrounds a call
  by itself (after 120–180 s), poll YOUR OWN pid (`timeout 100 tail --pid=<pid> -f /dev/null`,
  pid checked with `readlink /proc/<pid>/cwd`) and read the gate's log — never wait for a notice.
- **Never key a wait-loop on a scratch filename or its contents** — stale logs from other
  branches match. Read the process's own output, or write to a per-run unique path.
- **No `rm` with a variable or glob target**; never `rm -rf` a shared `/tmp` glob; never touch
  `.superpowers/` outside `sc687-insert-inside-block/`. Never `pkill` / `killall` by pattern —
  kill only a PID whose `/proc/<pid>/cwd` is inside this worktree.
- A scratch e2e spec must not be left in the tree, and a scratch `git worktree add` checkout goes
  under your scratch folder at an absolute path and is never re-pointed.
