# SC-675 r2 — independent reviewer brief

You are the independent, adversarial reviewer for SC-675 in the `draw-steel-elements` Obsidian plugin (DSE).
You did not write this code. **Execute and probe; do not only read.** Your final text goes to the
ticket-owner (an agent), not a human.

## 1. Context loading

- **Workers never call the tracker (Linear)** — not to read, not to post.
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/decisions.md` (read it; owner rulings O1-O5 are the spec's fixed points).
- The implementer's brief (the spec): `.../sc675-insert-nonempty-line/sc675-brief-r1-implementer.md` §2-§3. Read those two sections.
- The implementer's report: `.../sc675-insert-nonempty-line/sc675-r1-implementer-report.md`.
- Code under review: plugin repo `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements`, branch `sc675-insert-nonempty-line`, **sha `bb608f5b`**, base `129beb18` (= dse `origin/develop`). Diff: `git -C <plugin path> diff 129beb18..bb608f5b`. Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line` (a `CHANGELOG.md` bullet, sha `edb841fc`).
- **You do not edit the branch.** No commits in that worktree. All your probes live in scratch (below). If you add a probe test file inside the worktree to run it under jest, give it a unique name (`zzSc675RevProbe*.test.ts`), and delete it by its literal absolute path before you finish; `git -C <plugin path> status --short` must be empty at the end.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read **only lines 20-247** (495 KB file).
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: write nothing there except your report. Its dirty `draw-steel-elements/demo-vault` files are Scott's live vault, expected.

## 2. What to establish

The fix routes four block-insert paths (insert command `insertScaffold`, `/ds` pick `DsElementSuggest.selectSuggestion`, compendium reference `insertReferenceBlock`, compendium snapshot insert) through one helper. Required behaviour is brief §3 items 1-9. Verify each item, then try to break it.

**Known and ruled (ledger O6), not a finding by itself:** a block inserted inside a PLAIN list item is indented under the item, draws, but cannot save — the existing limit SC-461, documented in `docs/writing-blocks.md` "What doesn't work yet". So for a plain list item, the expected result of a + press is the existing "not saved" Notice with the note left byte-identical; verify exactly that (no partial write, no damage). Callout and list-inside-callout inserts must save. Because of the same limit, SC-443's jsdom list-case marker (`insertOutcomeProblem(…, {indented: true})`) is expected NOT to flip (its `scanFences` does not see a list-indented fence); the other five markers must flip. Do challenge the list SHAPE itself: does Obsidian (Reading view and Live Preview) draw the block inside the item for `- item|`, `- |`, ordered and task items? The implementer checked only with `marked`, not Obsidian.

A. **Read the diff** for correctness and for anything outside scope (`schemaSuggest.ts`, the `/ds` trigger guard, `insertInlineLink`, `copyCode` must be untouched).

B. **jsdom probes over a real CodeMirror 6 state** (`test/dom/authoring/_cmEditor.ts`). Write your own probes; do not trust the implementer's tests to be non-vacuous — check that each of their key tests fails on base (stash-free way: run their test file against a scratch checkout of `129beb18` plus the test file, or revert the `src/` change in a scratch worktree). Probe at least:
   - every path × {end of text line, mid-line, start of a non-empty line, non-empty selection mid-line, selection spanning two lines, cursor on the last line of a note with no trailing newline, cursor on line 0, empty note};
   - `/ds…` typed mid-line with text on both sides (`abc /dsct| tail`), and at the end of a list item / callout line;
   - list: continuation line, `- item|`, `- |`, `1. `, `10. `, `- [ ] `, `* ` and `+ ` bullets, nested two levels, tab-indented, a list inside a callout, a callout inside a list item;
   - callout / blockquote: `> text|`, `> |`, `>|` (no space), `> > `, `> [!note] Title|` (the callout's title line), a callout line with trailing text after the cursor;
   - a whitespace-only line, trailing spaces before the cursor, a line whose text ends in a backtick run, a tail that begins with spaces or a tab;
   - the unchanged case (cursor at the start of an empty line, no prefix): exact bytes and cursor equal to base behaviour — compare against a real base build, not against the implementer's expectation;
   - cursor position after each scaffold insert (is it inside the body, on the right line and column, with the prefix accounted for?);
   - one undo step restores the original text exactly.
   - **integrity (this writes into user files):** content above and below the insert is byte-identical; two inserts in one note do not cross-talk; an inserted counter inside a list item and inside a callout is found by the framework's block location / prefix code and a write to it (a + press through the real write path) lands correctly with the prefix kept.

C. **Real Obsidian, against SC-443's specs.** SC-443 (unlanded branch `sc443-e2e-editor-insert` @ `ae9025ea`, in `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements` — read-only for you) carries the markers this fix must flip: e2e `knownBug('SC-675')` AUTH-I21 and AUTH-S09, three jsdom `test.failing` under "SC-675" in `test/dom/authoring/authoringKnownBugs.test.ts`, and the SC-462 `test.failing` at `test/dom/authoring/compendiumInsertMatrix.test.ts:280`.
   - Make a scratch worktree: `git -C /home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements worktree add <your scratch dir>/merge bb608f5b --detach`, then in it `git fetch /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements sc443-e2e-editor-insert` and `git merge --no-edit FETCH_HEAD` (every git command as `git -C <absolute path>`). Report any conflict (it is a finding for SC-443's later rebase: say which files).
   - `npm ci` there, then run SC-443's authoring jest files and `npm run e2e -- --element=authoring` (check the exact flag in `package.json` / the e2e runner on that branch).
   - Expected: five of the six markers above (all but the jsdom list-item one, see "Known and ruled") now report as unexpectedly passing (a `test.failing` that passes fails the suite with "expected to fail"; a passing `knownBug` is reported by the e2e runner). Every OTHER authoring test must be unchanged from SC-443's own numbers on its branch: jest authoring files green, e2e authoring `65/67 ok, 0 failed, 2 known-bug` at `64d2d8fd` (the later commit `ae9025ea` added AUTH-G13, AUTH-G14, AUTH-K09 for SC-679 — establish the branch's own number first by reading its ledger line or running it). Any SC-443 test that now FAILS for a reason other than a flipped marker is a finding: say whether the fix or the test's expectation is wrong (SC-443's matrix tests may pin today's glued output as "current behaviour").
   - Also drive, in that real Obsidian (extend a scratch copy of a spec, do not commit): insert inside a list item and inside a callout, in Source mode and Live Preview; confirm the block renders as a working element in Reading view and Live Preview and that a + press on the inserted counter writes into the right place. Capture the resulting note text.
   - Remove the scratch worktree at the end with `git -C <plugin path> worktree remove --force <literal absolute path>` and confirm `git -C <plugin path> worktree list` shows only the original.

D. **Gates on `bb608f5b`** in the sc675 worktree (it already has `node_modules`): `npm run tsc`, `npm run lint`, `npx jest`. Expected: clean, clean, and jest `13816 passed / 2 skipped (300 suites + 1 skipped), i.e. base + the 114 tests of `test/dom/authoring/insertOwnLines.test.ts``. Base is 13702 passed / 2 skipped in a fresh worktree (13703 / 1 with the shots cache). Confirm `styles.css` is byte-identical to a base build (implementer's hashes: `both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9``). Do not run lifecycle, the full e2e, shots, freeze or parity — the owner runs those on the final sha.

E. **Docs.** The `CHANGELOG.md` bullet in the worktree superproject: accurate, plain user-facing words, no overclaim.

## 3. Footguns

- Go/Node are not on PATH. Run as `devbox run -c <absolute plugin dir> -- bash <script file>`. Never `cd X && …` in a compound command. Devbox eats `$?`: record exit codes inside a script FILE and read each gate's summary line. Never pipe a gate through `tail`.
- Your scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r2-rev/`. Unique file names; touch nothing else in the shared scratchpad. Create files with the Write tool, not heredocs.
- No `rm` with a variable or glob in the path. No `rm -rf` on any shared dir or `/tmp` glob (other efforts' e2e vaults match the same globs). Delete only literal paths you created.
- No `pkill` / `killall` by pattern: other efforts run the same gates right now. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside your own scratch or the sc675 worktree.
- Every git command is `git -C <absolute path> …`.
- No background jobs, no Monitor, no waiting on a completion notice. One blocking foreground call per gate (600 s tool limit; split e2e with its `--element` / `--only` filter if needed). Redirect long output to a file — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- e2e flakes under load exist (INIT-W09/W10, SET-X03/X04, NEGO-R05 are known): re-run a failed spec alone before calling it a finding, and report both runs.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-675:`.
- You cannot spawn agents. Never tag, never push.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/sc675-r2-reviewer-report.md`, opening with an executive summary of at most 10 lines (verdict first). Then findings **by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line**, each with a failure scenario (exact before text with `|` for the cursor, exact after text) and a prescribed fix. Then the probe table (case → before → after → ok?), the SC-443 merge result (conflicts, marker flips, any other change in its numbers), gate numbers with log paths, and `Follow-ups:` (things outside this ticket). If the report-file write is blocked, return the report inline.

## 5. Return contract

Final text = raw facts for the ticket-owner, no prose: VERDICT (APPROVE / APPROVE_WITH_FIXES / REJECT), count of findings per severity with one line each, the SC-443 merge facts, gate numbers, confirmation the worktree is clean and the scratch worktree removed, and the absolute path of the report and every evidence artifact (logs, captured note texts, screenshots).
