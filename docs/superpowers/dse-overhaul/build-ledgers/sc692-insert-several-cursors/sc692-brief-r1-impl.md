# SC-692 r1 — implementer brief: an insert with several cursors lays the block out for each cursor's own line

You are an implementer worker for ticket SC-692. Your final text goes to the ticket-owner (an agent), not a human.
**You never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (do this first)

1. Read the decisions ledger — it is the spec (ticket text verbatim + owner calls O1–O6):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/sc692-decisions.md`
   No prior-round reports. Background (read the exec summary + MEDIUM-1 only):
   `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc687-insert-inside-block/sc687-r2-review-report.md`
   (its scratch e2e probe spec `zz-r2-review.e2e.ts.keep`, if still present under
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-review-r2/`,
   shows how the reviewer set several cursors in real Obsidian — `setSelections`, `mainIndex`).
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors`
   Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors/draw-steel-elements`,
   branch `sc692-insert-several-cursors`, cut from `develop` @ `17187e4c`.
   **All implementation happens there. Verify the absolute path before every write.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report and evidence in the ledger dir
   (section 6) — the main checkout is shared global state. Its dirt in `draw-steel-elements` (`demo-vault/…`,
   `compendium-manifest.json`) is Scott's live vault: expected, not yours, do not report it.
3. Fetch and confirm the base first:
   `git -C /home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors/draw-steel-elements fetch origin`,
   check `origin/develop` is still `17187e4c`. If it moved, rebase onto the new sha and say so.
   **Every git command uses `git -C <absolute path>`, never `cd X; git …`.**
4. Read the plugin's `AGENTS.md`, `e2e/README.md` (ids, manifests, the coverage gate, `knownBug`, "The editor insert
   paths"), and the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   **That file is huge — do NOT read it whole.** Read lines 1–30 and 146–266 (battery, devbox wrapping, lifecycle/e2e
   notes, exit-code footgun) and lines 1551–1556 (CURRENT numbers); grep it for the lifecycle `--only=` part lists
   (line 32) rather than printing that line whole.
5. Fresh worktree has no `node_modules`: run `npm ci` in the plugin dir once before any gate (through
   `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).
6. Code to read: `src/authoring/blockInsert.ts` (whole file, 161 lines: header, `planBlockInsert`, `insertRefusalFor`,
   `insertBlock`), `src/authoring/insert.ts`, `src/authoring/compendiumInsert.ts` (`insertReferenceBlock`,
   `insertFullBlock`, the Shift inline link at ~line 38), `src/authoring/scaffold.ts` `advancePosition`,
   `test/dom/authoring/_cmEditor.ts` (real CM state; `listSelections` / `replaceSelection` over every range since SC-687),
   the existing SC-675 / SC-687 jest tests for `blockInsert`, and `e2e/specs/authoring/insert-commands.e2e.ts`.

## 2. The task

The ticket text (verbatim, in the ledger):

> Expected: either each cursor gets a block laid out for its own line (own line break, own callout or list prefix), or an
> insert with several cursors is refused with a message.

Owner calls, verbatim from the ledger:

> **O1 — Lay out per cursor; do not refuse.** Of the ticket's two Expected options, each cursor gets a block laid out for
> its own line. [...]
>
> **O2 — The rule, stated so it can be tested:** an insert with several cursors / selections writes exactly what
> single-cursor inserts would write if they were run one at a time **from the last range in the note to the first**
> (bottom-up; each sees the text the later writes left on its line). This covers two cursors on the same line (no blank
> or whitespace-only line appears between the two blocks) and cursors on adjacent lines.
>
> **O3 — One change, one undo.** All ranges are written in ONE editor change (`editor.transaction` with several changes,
> or equivalent); one Ctrl+Z restores the note. After the write every cursor is where a single-cursor insert would have
> put it for its block (the scaffold's first body character, or after the block); the main cursor stays the main.
>
> **O4 — SC-687's guard is unchanged:** if any range has an end inside a block or the properties, nothing is written
> at any cursor and one Notice shows (SC-687 behaviour, `insertRefusalFor`).
>
> **O5 — Scope.** [...] The `/ds` pick passes a range (one token) and stays single-range, unchanged. The compendium Shift
> inline link [...] stays as is. Single-cursor output must be byte-identical to `17187e4c` (the SC-675 / SC-687 tests pin it).

### 2.1 Engineering notes

- `insertBlock` without a range: read `editor.listSelections()`, normalise each to from/to, sort by position. Plan
  bottom-up: for the last range, `planBlockInsert(lineBefore, lineAfter, block)` on the original text; for each earlier
  range, the `after` text is what its line holds after the later ranges' writes (only matters when a later range is on
  the same line as this range's end). Since every later write sits at or after this range's end, each change's from/to
  stays valid in original-document coordinates, so all changes can go into one `editor.transaction({ changes, selections })`.
  Verify in real Obsidian that `editor.transaction` with several changes is ONE undo step; if it is not, find the API
  that is and say what you measured.
- Selections after the write: one per range, mapped into the final document (a later change shifts nothing above it;
  an earlier change on the same line shifts the columns of later ones — compute the final positions, don't guess).
  Keep the main selection's index as the main.
- The pure part (ranges + line texts in → changes + final cursors out) should be a pure, jest-tested function; the
  editor wrapper stays thin. Do not duplicate `planBlockInsert`.
- If you find a case where the bottom-up rule (O2) gives a broken block, STOP and report it as NEEDS_CONTEXT with the
  note text, what O2 writes, and what Obsidian draws — do not invent a different rule.

### 2.2 Required cases (each a jest case; the starred ones also in real Obsidian e2e)

1. * the ticket's example: main cursor on an empty line, second cursor at the end of `after text` — two counters drawn,
   `after text` a paragraph, no code lines below.
2. * main cursor at the end of `after text`, second on an empty line (main index 1) — same result.
3. three cursors: empty line, end of a text line, middle of a text line (text after the cursor moves below the block).
4. * one cursor in a callout line, one in a list item, one at top level — each block carries its own prefix
   (`> `, list continuation indentation, none) and draws (Reading view and Live Preview).
5. two cursors on the SAME line (`ab|  |cd`, and `ab|cd|ef`) — result equals the bottom-up single inserts; no blank or
   whitespace-only line between the blocks (assert the exact text).
6. cursors on two adjacent empty lines — exact text; both blocks draw.
7. a non-empty selection plus a cursor — the selection's text is replaced, the cursor gets its own block.
8. a compendium reference (and snapshot) insert with two cursors — each laid out for its own line (`endLine: true`).
9. one undo: * after case 1, one Ctrl+Z restores the note byte-for-byte.
10. cursors after the write: each where a single insert would leave it (scaffold `cursorOffset`), main index kept.
11. O4: one of two cursors inside a block → refused, nothing written at either (existing SC-687 test covers this; keep it).
12. single cursor: byte-identical to `17187e4c` — the existing SC-675 / SC-687 tests are the pin; do not edit them.
13. integrity: text above, between and below the cursors is byte-identical apart from the inserted blocks; an existing
    block between two cursors is intact (`existingBlocksIntactProblem`).

### 2.3 Tests (TDD: red first)

- jsdom: case 1 as a test that is red on `17187e4c`, green after. Add the rest. If `_cmEditor.ts` lacks `transaction`,
  teach it (a real CM transaction with several changes, so undo grouping is real where the harness supports it).
- e2e (real Obsidian 1.14.4): new `AUTH-*` ids per `e2e/README.md` for the starred cases. No new coverage pair unless a
  new control is driven (say which). Known-bug count stays 20 (no SC-692 marker exists; confirm with a grep).
- Do not weaken or delete an existing test. If an existing test pins the old multi-cursor gluing as current behaviour,
  rewrite it to the new rule and list it in the report.

### 2.4 Docs (part of done)

- `src/authoring/blockInsert.ts` header comment: keep it true (it currently says "ONE replaceSelection / replaceRange").
- Plugin `docs/writing-blocks.md` "Insert a block": one plain sentence that with several cursors each gets its own block.
- Plugin `AGENTS.md` authoring paragraph if it describes the insert write.
- Changelogs, each in its own convention (read the neighbouring bullets; plain words, what the user sees): plugin
  `CHANGELOG.md` under the `## 7.0.0 (unreleased; …)` heading, and the workspace `CHANGELOG.md` under `## Unreleased`.
  **The workspace-level file lives in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.** Commit it in the worktree's superproject (branch
  `sc692-insert-several-cursors`); do NOT commit a submodule pointer bump — landing does that.

**Commits**: inside the plugin repo after each coherent step (`fix(SC-692): …` / `test(SC-692): …` / `docs(SC-692): …`).
**No co-author trailers, no AI attribution of any kind in commit messages.** Never push. Never tag. Never create a release.

## 3. Evidence (Scott reviews from images; the owner eyeballs them first)

Real-Obsidian PNGs (Live Preview, default Steel theme) of case 1's note after the command, made with a scratch script or
a temporary e2e spec that is NOT committed:

- `sc692-before.png` — on a clean `17187e4c` build: the second copy glued onto `after text` (not drawn / code below).
- `sc692-after.png` — on your build: two counters drawn, `after text` a normal paragraph.

Time-box the before-shot to about 20 minutes; skip it and say so if it does not come easily. The after-shot is required.
Copy both to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/evidence/`.

## 4. Gates — `dse-verify`, in order

Expected (CURRENT at dispatch, dse `develop` @ `17187e4c`):

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: fresh worktree baseline **15018 passed / 2 skipped** (one more passed / 1 skipped once `npm run shots` has cached
  `visual-harness/dist/obsidian-app.css`). Before jest, `rm -f main.js styles.css` in the plugin root (literal path).
  Report baseline + your delta.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed`, run as the seven `--only=` parts in the skill (equals sign;
  check each log starts with only its own ids), report the union. Run it once, on your final head.
- e2e, full run: baseline `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`.
  Expected after: `0 failed`, **20 known-bug**, ok and total up by your new tests, `coverage: Y/Y pairs`.
- shots / freeze / parity (O6): build `styles.css` on your head and on a clean `17187e4c` (a `git worktree add` scratch
  checkout at an absolute path under your scratch folder) and compare sha256. Identical and no CSS / rendering file
  touched → report "carry: shots 636, freeze 280/280, parity 0/0/24" with the two hashes. Not identical → run shots, the
  freeze check and parity (last) per the skill. Never touch `.superpowers/sdd/freeze-baseline.sha256`.

Known flakes under load are named in the skill (incl. SET-X03 / SET-X04, the SC-657 settings flake in `e2e/README.md`):
a red there is re-run alone before it is believed, and reported either way. Other efforts (e.g. SC-693) may run gates
concurrently in other worktrees: expect load, and never touch their processes.

## 5. Integrity self-check before you report

This change writes into user notes. Show, with tests, that: text above, between and below the cursors is byte-identical
apart from the new blocks; two same-kind blocks inserted at once do not cross-talk (each draws with its own values); an
existing block between two cursors is intact; one undo restores the note.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/sc692-r1-impl-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers, evidence paths). Then: the
implementation, the case table for 2.2 (case → result → test id), the undo measurement, blind spots left.
If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:

- STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- plugin branch + head sha; superproject branch + head sha; base sha
- every gate's measured summary line (and the two `styles.css` hashes)
- files changed (list); new e2e ids; coverage pairs added (or none)
- blind spots left, one line each
- **the absolute filesystem path of every evidence artifact** (PNGs, logs, report)
- `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move a gate baseline) and
  `Follow-ups:` (left alone). Workers never file tickets.

## 8. Footguns (each has cost real time here)

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
  TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and
  the question in your report — I see your completion notification and will resume you with the answer. If you ever do
  send a message anyway, its FIRST WORD must be `SC-692:`.
- **Devbox**: node/npm are not on PATH.
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 — record exit codes inside a
  script FILE, and read each gate's own summary line. Never pipe a gate (`| tail` eats the failure).
- **Scratch**: the session scratchpad is shared by every agent. Use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-impl-r1/`
  with uniquely named scripts and logs. Create scratch files with the Write tool, not heredocs.
- **Run each gate as one blocking foreground call** with output redirected to a log file (the 600 s stream watchdog kills
  silent agents; lifecycle parts and e2e are split per the skill to fit the tool timeout). No `run_in_background`, no
  Monitor. If the Bash tool moves a call to the background by itself, poll YOUR OWN pid
  (`timeout 100 tail --pid=<pid> -f /dev/null`, pid chosen by `readlink /proc/<pid>/cwd` inside your worktree) and read
  the gate's own log — never wait for a completion notice.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- **No `rm` with a shell-variable or glob target** (it prompts and hangs a background worker). Overwrite with `>`, or use
  fresh unique filenames. Never `rm -rf` a shared `/tmp` glob (`/tmp/dse-obsidian-lifecycle-*` belongs to every
  concurrent effort) and never touch `.superpowers/` outside `sc692-insert-several-cursors/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose `readlink /proc/<pid>/cwd` is inside your
  worktree.
- **Stale superproject pin**: if `token-coverage.test.ts` goes red on a token-map row you did not touch, compare the
  worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's copy before believing it; clear
  with the test's `DSE_TOKEN_MAP_PATH` override.
- Commit after every coherent step so nothing sits uncommitted through a gate. `npm ci` again after any rebase that
  changed `package.json`.
