# SC-675 r1 — implementer brief

You are the implementer for SC-675 in the `draw-steel-elements` Obsidian plugin (DSE). This brief is
self-contained. Your final text goes to the ticket-owner (an agent), not a human.

## 1. Context loading (do this first)

- **Workers never call the tracker (Linear)** — not to read, not to post. Everything you need is here and in the files below.
- Ledger (current decisions): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/decisions.md`. Read it.
- **Worktree (the only place you write code):** `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line`
  - plugin repo: `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements`, branch `sc675-insert-nonempty-line`, at `129beb18` (= `origin/develop` today).
  - Verify with `git -C <that path> status -sb` and `git -C <that path> rev-parse HEAD` before any write. `git -C <plugin path> fetch origin` and confirm `origin/develop` is still `129beb18`; if it moved, rebase onto it and say so in the report.
  - **Never write under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir. That checkout is shared; its dirty `draw-steel-elements/demo-vault` files are Scott's live vault, expected, not yours.
  - Workspace-level files (`CHANGELOG.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- Read the plugin's `AGENTS.md` in the worktree, and the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — **only lines 20-247** ("The battery, in order" through "THE exit-code footgun"). The file is 495 KB; do not read the rest.
- A fresh worktree has no `node_modules`: run `npm ci` in the plugin dir first (through devbox, see §5).

## 2. The bug (ticket text, verbatim)

> The insert commands, the `/ds` pick and the compendium inserts drop the block at the cursor as-is. If the cursor is not at the start of an empty line, the result is not a working block.
>
> * Cursor after text (`abc|`), run **Insert Draw Steel: Counter**: the note gets ```` abc```ds-ct … ````. The opening fence is not at the start of a line, so no block renders.
> * Type `/dsct` before existing text on the line (`/dsct| tail`) and pick Counter: the closing line becomes ```` ``` tail ````. A closing fence with words after it does not close the block, so the block runs on and swallows the rest of the note.
> * Inside a list item (`- item` then an indented new line): the opening fence is indented, but lines 2 onward land at column 0, outside the list.
> * The compendium reference and snapshot inserts glue onto the line the same way.
>
> Expected: the inserted block always starts on its own line and ends on its own line, with any text before or after the cursor kept on separate lines (or the insert is refused with a Notice). Inside a list item, every inserted line gets the item's indentation.

Related SC-462 (verbatim): "The authoring inserts (`/ds` suggest, the Insert commands, compendium insert) put multi-line text in with `editor.replaceSelection`, without the blockquote prefix. With the cursor inside a callout, only the first line stays in the callout; the rest of the block lands outside it, so the callout breaks. Fix idea: when the cursor's line carries a blockquote prefix, re-emit it on every inserted line using `src/framework/host/blockPrefix.ts` (added by SC-455)."

Owner rulings (ledger O1, O2, O4): **split, do not refuse**; **SC-462 is folded into this fix**; **no blank lines are added around the block**.

Call sites today:
- `src/authoring/insert.ts` `insertScaffold` (`replaceSelection(scaffold.text)` + `setCursor(advancePosition(...))`)
- `src/authoring/suggest.ts` `DsElementSuggest.selectSuggestion` (`replaceRange(scaffold.text, start, end)` + `setCursor`)
- `src/authoring/compendiumInsert.ts` `insertReferenceBlock` (`replaceSelection(wrapFence(alias, entry.scc) + '\n')`) and the snapshot insert near line 280 (`replaceSelection(wrapFence(alias, body) + '\n')`)
- `insertInlineLink` and `copyCode` are inline by design: **do not touch them.**

## 3. The task

Route all four block-insert paths through ONE shared helper in `src/authoring/` (name it as you see fit). Required behaviour, for every path:

1. **Own lines.** The opening fence starts its line (after the container prefix, item 3) and nothing follows the closing fence on its line.
2. **No user text lost or reordered.** Text before the cursor on its line stays on the line above the block. Text after the cursor (or after the selection end) moves to a line below the block. The only characters removed are the ones the path removes today: the selection (insert command, compendium inserts) or the typed `/ds…` token (suggest).
3. **Container prefix on every inserted line**, and on the moved tail line:
   - list item: the item's continuation indentation. Cover the cursor on an indented continuation line (`- item⏎␣␣|`, the ticket's case), on the item's own line after text (`- item|`), an empty item (`- |`), ordered (`1. `, `10. `), task items (`- [ ] `), nested items, and tab indentation (keep the exact whitespace characters).
   - blockquote / callout: the `> ` markers (SC-462), including nested `> > ` and a list inside a callout (`> - item`).
   - Use `src/framework/host/blockPrefix.ts` (`addBlockPrefix` and friends, SC-455) rather than a second prefix implementation. The inserted block must be one the SC-455 write path reads back with the same prefix: a later press of + on an inserted counter inside a callout or list must write correctly. Extend `blockPrefix.ts` only if you must, and say so.
   - For `- item|` and `- |` the exact shape is your call, on one condition: the result is a working DSE block **inside the item** under CommonMark and in Obsidian. State the shape you chose and why.
4. **The working case is byte-identical.** Cursor at the start of an empty line with no prefix: the note text and the cursor position after the insert are exactly what they are today. Existing tests for this case must pass unchanged.
5. **Cursor.** After a scaffold insert the cursor lands at the same logical spot as today (`scaffold.cursorOffset`, the first body character), corrected for any added line break and prefix.
6. **One undo step.** The insert is a single editor change (one `replaceSelection` / one `replaceRange`), so one Ctrl+Z restores the note exactly.
7. **Insert-only safety.** `insert.ts` documents: "INSERT ONLY (replaceSelection) — never a range-replace over existing content (editor-mutation safety, Global Constraints / OD-D9-12)". Keep it: the helper never replaces existing text beyond the selection / the `/ds…` token. Moving the tail down is an inserted line break, not a rewrite of the tail.
8. **No blank lines added** before or after the block (ledger O4). A whitespace-only cursor line counts as an empty line carrying that prefix: no extra empty line appears.
9. Out of scope, do not touch: the `/ds` trigger guard (SC-676), `schemaSuggest.ts` (SC-678, SC-679 — another agent is editing that file right now), clipboard copy (SC-677), a cursor inside an existing code fence, multiple cursors.

Tests (jest, jsdom), TDD — write the failing test first:
- Use a real CodeMirror 6 editor state, not a hand-rolled fake. The SC-443 branch has the helper: copy it **byte-identical** with
  `git -C /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements show ae9025ea:test/dom/authoring/_cmEditor.ts`
  into `test/dom/authoring/_cmEditor.ts` of YOUR worktree (redirect the output to the file). **Do not edit that copy** — SC-443 lands the same file later and an identical add merges clean. If you need more, put it in a new file of your own (e.g. `test/dom/authoring/_sc675Editor.ts`). That other worktree is read-only for you: `git show` only, never write or check out there.
- Put your tests in NEW files with names SC-443 does not use. SC-443 already owns: `authoringKnownBugs.test.ts`, `compendiumInsertMatrix.test.ts`, `dsSuggestMatrix.test.ts`, `insertMatrix.test.ts`, `schemaSuggestMatrix.test.ts` under `test/dom/authoring/`, and `test/dom/e2eCensus.test.ts`. Suggested: `test/dom/authoring/insertOwnLines.test.ts`.
- Cover, for each of the four paths: end of a text line (`abc|`), mid-line (`abc|def`), start of a non-empty line (`|tail`), `/ds… tail` for the suggest path, a non-empty selection mid-line, the list cases in item 3, the callout cases in item 3, the unchanged empty-line case (exact bytes + cursor), cursor position after scaffold inserts, and one-change undo (assert a single editor transaction / one undo restores the original text).
- Assert exact resulting note text, not only "a fence exists". Add a round-trip check for a list-indented and a callout-prefixed inserted block: the framework's own block location / prefix code reads the inserted block back as a `ds-…` block with the expected prefix.
- SC-443's markers that must flip with your fix, for reference (read them with `git show ae9025ea:<path>` from that worktree): `test/dom/authoring/authoringKnownBugs.test.ts` (three `test.failing` under "SC-675", built on `insertOutcomeProblem` from `e2e/driver/authoringAssert.ts`) and `test/dom/authoring/compendiumInsertMatrix.test.ts:280` (SC-462). Your behaviour must satisfy what they assert. Do not copy those test files.

Docs (part of done):
- One bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/CHANGELOG.md`, plain user-facing words (what a user sees), mentioning the callout case too. Commit it in the worktree superproject (`git -C /home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line …`).
- If the plugin's own docs (`draw-steel-elements/docs/`, `README`) describe where an insert lands, update them. Update the stale "INSERT ONLY" header comment in `insert.ts` only as far as it becomes inaccurate.

Commits: commit in the plugin repo after every coherent step, messages `fix(SC-675): …` / `test(SC-675): …` / `docs(SC-675): …`. **No co-author trailers and no AI attribution of any kind.** Do not push. Never create a tag.

## 4. Gates for this round (expected numbers)

Base is dse `develop` @ `129beb18`: tsc and lint clean; jest **13703 passed / 1 skipped** with the shots cache, **13702 passed / 2 skipped** in a fresh worktree.

Run, each as one blocking foreground call with output redirected to a log:
1. `npm run tsc` — clean. Also `npx tsc -p e2e` if the skill lists it — clean.
2. `npm run lint` — clean, exit 0.
3. `npx jest` — 0 failed; report `passed / skipped / suites` and the delta against 13702 / 2 (must equal exactly the tests you added).
4. `styles.css` identity: build (`npm run build` or the skill's command) and report `sha256sum styles.css` on your sha and on a clean `129beb18` build. They must be identical (you change no CSS); that lets shots / freeze / parity carry.

Do NOT run lifecycle, e2e, shots, freeze or parity this round — the owner runs them on the final sha after review.

## 5. Footguns (each one has cost real time here)

- Go/Node are not on PATH. Run everything as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc675-insert-nonempty-line/draw-steel-elements -- bash <script file>`. Never `cd X && …` inside a compound command. Devbox's wrapper eats `$?`: record exit codes inside a script FILE (`npx jest > log 2>&1; echo $? > rcfile`), and read each gate's own summary line. Never pipe a gate through `tail`.
- Your scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r1-impl/` — create it, keep every script and log there with unique names. The scratchpad parent is shared by other agents: touch nothing else in it. Create scratch files with the Write tool, not heredocs.
- No `rm` with a shell variable or glob in the path; no `rm -rf` of any shared dir or `/tmp` glob. Overwrite with `>` or use fresh file names.
- No `pkill` / `killall` by pattern. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Every git command is `git -C <absolute path> …`. Never `cd X; git …`.
- No background jobs, no Monitor, no waiting for a completion notice. Each gate is one blocking foreground call (max 600 s tool timeout; jest fits). Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- If jest shows a failure in a test you did not touch, re-run that one file alone before believing it (load flakes exist), and report both results. `token-coverage.test.ts` red in a worktree is the stale-superproject-pin footgun: compare with the main checkout's `docs/superpowers/dse-overhaul/D3-token-map.md` and use `DSE_TOKEN_MAP_PATH`; never edit the branch for it.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-675:`).
- You cannot spawn agents.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc675-insert-nonempty-line/sc675-r1-implementer-report.md`. It must open with an executive summary of at most 10 lines. Then: the helper's rules as built (a table: cursor context → resulting text, with `|` for the cursor), every design choice you made under "your call" items, files changed, commits, gate numbers with log paths, `Drive-by fixes:` (already made: obviously correct, local to a file you touched) and `Follow-ups:` (left alone; anything out of scope you noticed). If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin sha, superproject sha, jest numbers and delta, tsc / lint result, the two `styles.css` hashes, the list shape you chose for `- item|` and `- |` in one line each, and the absolute path of the report and of every log you produced.
