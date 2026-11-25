# SC-687 r1 — implementer brief: an insert never writes inside an existing block or the properties

You are an implementer worker for ticket SC-687. Your final text goes to the ticket-owner (an
agent), not a human. **You never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (do this first)

1. Read the decisions ledger — it is the spec (Scott's ticket text verbatim + owner calls O1–O7):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-decisions.md`
   There are no prior-round reports.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block`
   Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements`,
   branch `sc687-insert-inside-block`, cut from `develop` @ `aee83dc1`.
   **All implementation happens there. Verify the absolute path before every write.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report and evidence
   in the ledger dir (section 6) — that main checkout is shared global state. Its dirt in
   `draw-steel-elements` (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault:
   expected, not yours, do not report it.
3. Fetch and confirm the base first:
   `git -C /home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements fetch origin`
   then check `origin/develop` is still `aee83dc1`. If it moved, rebase onto the new sha and say
   so in the report. **Every git command uses `git -C <absolute path>`, never `cd X; git …`.**
4. Read the plugin's `AGENTS.md`, `e2e/README.md` (ids, manifests, the coverage gate, `knownBug`,
   "The editor insert paths"), and the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   **That file is ~500 KB — do NOT read it whole.** Read lines 1–30 and 146–266 (battery, devbox
   wrapping, lifecycle/e2e notes, exit-code footgun) and lines 1551–1554 (CURRENT numbers); grep
   it for the lifecycle `--only=` part lists (line 32) rather than printing that line whole.
5. Fresh worktree has no `node_modules`: run `npm ci` in the plugin dir once before any gate
   (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).
6. Code to read before designing: `src/authoring/blockInsert.ts` (header comment + `insertBlock`),
   `src/authoring/fenceScan.ts`, `src/authoring/suggest.ts`, `src/authoring/insert.ts`,
   `src/authoring/compendiumInsert.ts` (`insertReferenceBlock`, `insertFullBlock`,
   `CLOSED_EDITOR_NOTICE` and the choose-time backstop, `dispatchBlockChoice`),
   `e2e/driver/authoringIntact.ts`, and the SC-687 markers:
   `test/dom/authoring/authoringKnownBugs.test.ts` (describe "SC-687: …", three `test.failing`)
   and `e2e/specs/authoring/insert-commands.e2e.ts` (`knownBug('SC-687', '[AUTH-I27] …')`).

## 2. The task

Scott's ruling, verbatim (the ticket, 2026-11-23; full text in the ledger):

> Expected: an insert command does not write inside an existing fenced block or the properties. `/ds` already refuses there.

> The compendium inserts (reference and snapshot) do the same. With the cursor in the note's properties (frontmatter), the insert writes a fence into the properties.

The owner calls O1–O7 in the ledger turn that into the behaviour below. Read them there; this
section only adds the engineering detail.

### 2.1 Behaviour

- `insertBlock` (the one write place) refuses when the write would land inside existing structure
  (O4): nothing is written, cursor / selection unchanged, no undo entry, and the user sees exactly
  one Notice (O2 texts, verbatim). It must tell its caller what happened (e.g. a boolean or a
  reason) so callers do not show a second Notice or run follow-up work on a refused insert.
- The two compendium commands also check at command start, before the search list opens (O3).
  Look at how `dispatchBlockChoice` / the SC-601 closed-editor backstop avoid a double Notice and
  mirror that.
- The `/ds` pick goes through the same `insertBlock`, so it is covered at write time. When it is
  refused the typed `/ds…` token stays as typed.

### 2.2 The position scan (O4, O5)

- Text-based and pure (lines in, verdict out), jest-testable, living in `src/authoring/fenceScan.ts`
  next to `scanFenceState`. Do NOT use `metadataCache` (it lags the editor: a block typed a second
  ago is not in it) and do not depend on CodeMirror parser node names.
- **`scanFenceState`'s results for its two existing consumers (`suggest.ts` onTrigger,
  `schemaSuggest.ts`) must not change**, and the three `test.failing` SC-676 markers in
  `authoringKnownBugs.test.ts` must stay failing-as-expected. SC-676 (Backlog) is out of scope; it
  will later switch the suggesters onto your scan, so shape the new function for that reuse (it
  should answer: in a fence? which language? on an opening / closing line and where the marker
  starts / ends? in the properties?). Share helpers with `scanFenceState`; do not copy the walker.
  If any SC-676 marker flips, STOP and report — do not flip it.
- Required verdicts (each one a jest case; the starred ones also in real Obsidian, section 3):
  1. * body line of a top-level block, backtick fence — refuse. Same for a tilde fence, a 4-backtick
     fence holding a 3-backtick line, a non-`ds` language (` ```js `), a fence with no language.
  2. * body line of a callout / quote-prefixed block (`> ```ds-…`) — refuse.
  3. * body line of a block indented under a list item, in every shape `planBlockInsert` itself
     writes (under `- item`: 2 spaces; `1. `: 3; `10. `: 4; a nested bullet: 4 / 6; a list item
     inside a callout) — refuse. This is what a user hits by running an insert command twice in a
     row under a list item: the first insert leaves the cursor in the new block's body.
     `scanFenceState` cannot see fences indented 4 or more (`LEADING_WS = '[ ]{0,3}'`); your scan
     must. A line indented 4+ that is NOT under a list item is an indented code block in CommonMark,
     and a ` ``` ` inside it is literal text: say in the report what your scan answers for
     `    ```\n    text` at top level, and what real Obsidian draws for it. A false refusal there
     is acceptable if it is narrow and stated; a missed real fence is not.
  4. * the properties: any line from line 0 `---` to the closing `---` — refuse; cursor at the end of
     the closing `---` line — allowed (block lands below; the properties stay byte-identical at
     the start of the note). Measure in real Obsidian what counts as properties (unclosed `---`,
     `---` with trailing spaces, an empty `---\n---`) and match it; a `---` rule lower in the note
     is not properties.
  5. opening fence line: cursor after the marker start — refuse; cursor before it (ch 0 or inside
     the line's own quote / indentation prefix) — allowed, the block lands above and the existing
     block is intact. Verify that "allowed" claim with `existingBlocksIntactProblem`, for a
     top-level, a quoted and a list-indented fence; if the write there damages anything, refuse
     there too and say so.
  6. * closing fence line: cursor at the end of the line (after marker + trailing whitespace) —
     allowed, the block lands below and BOTH blocks are intact; anywhere else on that line — refuse.
  7. an unclosed fence — every line after it is inside, to the end of the note — refuse.
  8. a selection: either end inside — refuse; both ends outside — written as today (do not change it).
  9. everything `blockInsert` handled before (SC-675: empty line, mid-line, callout, list item,
     text after the cursor) — unchanged, byte for byte. The existing SC-675 tests are the pin.
- Two blocks in one note must not cross-talk: between two closed blocks is outside; inside the
  second is inside.

### 2.3 Tests (TDD: red first)

- jsdom: turn the three `test.failing` SC-687 markers into plain tests (they must go red as
  "unexpectedly passing" once the guard exists — that is your red→green signal), and update the
  file's header comment that lists open tickets. Add a pure-scan test file for 2.2 (table-driven),
  and command-level tests: the Notice text for each reason, exactly one Notice, the editor value,
  cursor and selection unchanged, the snapshot insert (`insertFullBlock`) refused too, the
  compendium command refusing BEFORE the search modal opens, the `/ds` pick refused in a blind
  spot with the token left as typed.
- e2e (real Obsidian 1.14.4): `AUTH-I27` becomes a plain `it` (the known-bug count drops 11 → 10).
  Add tests with new `AUTH-*` ids, following `e2e/README.md` for ids, the manifest and coverage
  pairs (add a pair only if a new control is driven; say which):
  - the ticket's repro in Live Preview: note file byte-identical, the Notice text on screen, the
    stamina bar still drawn (no error card), `after text` still a paragraph;
  - the same in Source mode;
  - compendium reference command and compendium snapshot command with the cursor in the block:
    Notice, no search modal opened, note unchanged;
  - the properties (Source mode): refused, note unchanged, properties Notice;
  - insert twice in a row under a list item (2.2 case 3): second run refused, first block intact;
  - end of the closing fence line: the new block lands below and both blocks draw in Reading view;
  - one undo-history check: after a refusal, Ctrl+Z does not change the note the refusal left
    (or state why that cannot be driven).
- Do not weaken or delete an existing test. If an existing test pins today's corruption as
  current behaviour, rewrite it to the refusal and list it in the report.

### 2.4 Docs (part of done)

- Plugin `docs/writing-blocks.md`, "Insert a block": say in plain words that with the cursor inside
  an existing block or the note's properties, nothing is inserted and a message says so (applies
  to the commands, the compendium inserts and a `/ds` pick). Do not claim `/ds` never offers
  itself there — SC-676 is still open.
- `src/authoring/blockInsert.ts` header comment and `fenceScan.ts` header: keep them true. Plugin
  `AGENTS.md` authoring paragraph if it describes the insert rules.
- Changelogs, each in its own convention (read the neighbouring bullets; plain words, what the
  user sees): plugin `CHANGELOG.md` under `## 7.0.0 (unreleased; …)`, and the workspace
  `CHANGELOG.md` under `## Unreleased`. **The workspace-level file lives in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/CHANGELOG.md`
  — never under `/home/scott/code/steelCompendium/workspace/`.** Commit it in the worktree's
  superproject (branch `sc687-insert-inside-block`); do NOT commit a submodule pointer bump —
  landing does that.

**Commits**: inside the plugin repo after each coherent step (`fix(SC-687): …` / `test(SC-687): …`
/ `docs(SC-687): …`). **No co-author trailers, no AI attribution of any kind in commit messages.**
Never push. Never tag. Never create a release.

## 3. Evidence (Scott reviews from images; the owner eyeballs them first)

Two real-Obsidian PNGs of the ticket's repro note (Live Preview, default Steel theme), made with a
scratch script or a temporary e2e spec that is NOT committed:

- `sc687-before.png` — on a clean `aee83dc1` build after the command: the error card and
  `after text` shown as code.
- `sc687-after.png` — on your build after the command: the stamina bar still drawn, `after text`
  a paragraph, the Notice visible on screen with its full text readable.

Time-box the before-shot to about 20 minutes; if it does not come easily, skip it and say so. The
after-shot is required. Copy both to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/evidence/`.

## 4. Gates — `dse-verify`, in order

Expected (CURRENT at dispatch, dse `develop` @ `aee83dc1`):

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: baseline in a fresh worktree **14438 passed / 2 skipped** (14439 / 1 once `npm run shots`
  has cached `visual-harness/dist/obsidian-app.css`). A `test.failing` that fails counts as
  passed, so flipping the three markers moves nothing; report baseline + your delta (new tests).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed`, run as the seven `--only=` parts in
  the skill (equals sign; check each log starts with only its own ids), report the union.
- e2e, full run: baseline `OBSIDIAN-E2E done: 794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs`.
  Expected after: `0 failed`, **10 known-bug**, ok and total up by your new tests (+1 ok for
  AUTH-I27), `coverage: Y/Y pairs`.
- shots / freeze / parity (O7): build `styles.css` on your head and on a clean `aee83dc1` (e.g.
  a `git worktree add` scratch checkout at an absolute path under your scratch folder) and compare
  sha256. Identical and no CSS / rendering file touched → report "carry: shots 592, freeze
  280/280, parity 0/0/24" with the two hashes. Not identical → run shots, the freeze check and
  parity (last) per the skill. Never touch `.superpowers/sdd/freeze-baseline.sha256`.

Known flakes under load are named in the skill's CURRENT/PREVIOUS notes (INIT-W09, NEGO-R05,
NEGO-R08, G-S63): a red there is re-run alone before it is believed, and reported either way.
SC-690 (montage) runs concurrently in another worktree: expect load, and never touch its processes.

## 5. Integrity self-check before you report

This change guards writes into user notes. Show, with tests, that: text above and below the
refused position is byte-identical; two same-kind blocks do not cross-talk; a hand-edited block
(odd spacing, tabs, CRLF if the editor can hold it) is still recognised; a refusal followed by a
valid insert elsewhere in the same note works.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc687-insert-inside-block/sc687-r1-impl-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers, evidence paths).
Then: the scan's rules as implemented, the verdict table for 2.2 (case → answer → test id), what
real Obsidian treats as properties and as a list-indented fence (measured), blind spots you leave.
If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:

- STATUS: DONE | NEEDS_CONTEXT | BLOCKED
- plugin branch + head sha; superproject branch + head sha; base sha
- every gate's measured summary line (and the two `styles.css` hashes)
- files changed (list); new e2e ids; coverage pairs added (or none)
- blind spots left, one line each
- **the absolute filesystem path of every evidence artifact** (PNGs, logs, report)
- `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move
  a gate baseline) and `Follow-ups:` (left alone). Workers never file tickets.

## 8. Footguns (each has cost real time here)

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-687:`.
- **Devbox**: node/npm are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 —
  record exit codes inside a script FILE, and read each gate's own summary line. Never pipe a
  gate (`| tail` eats the failure).
- **Scratch**: the session scratchpad is shared by every agent. Use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r1/`
  with uniquely named scripts and logs. Create scratch files with the Write tool, not heredocs.
- **Run each gate as one blocking foreground call** with output redirected to a log file (the
  600 s stream watchdog kills silent agents; lifecycle parts and e2e are split per the skill to
  fit the tool timeout). No `run_in_background`, no Monitor. The Bash tool may move a call to
  the background by itself after 120–180 s: then poll YOUR OWN pid
  (`timeout 100 tail --pid=<pid> -f /dev/null`, pid chosen by `readlink /proc/<pid>/cwd` inside
  your worktree) and read the gate's own log — never wait for a completion notice.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- **No `rm` with a shell-variable or glob target** (it prompts and hangs a background worker).
  Overwrite with `>`, or use fresh unique filenames. Never `rm -rf` a shared `/tmp` glob
  (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort) and never touch
  `.superpowers/` outside `sc687-insert-inside-block/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose
  `readlink /proc/<pid>/cwd` is inside your worktree.
- **Stale superproject pin**: if `token-coverage.test.ts` goes red on a token-map row you did
  not touch, compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the
  main checkout's copy before believing it; clear with the test's `DSE_TOKEN_MAP_PATH` override.
- Commit after every coherent step so nothing sits uncommitted through a gate. `npm ci` again
  after any rebase that changed `package.json`.
