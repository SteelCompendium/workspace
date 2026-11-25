# SC-682 r1 — implementer brief: after a `/ds` pick the list is closed and the next Enter is a new line

You are an implementer worker for ticket SC-682. Your final text goes to the ticket-owner (an
agent), not a human. **You never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (do this first)

1. Read the decisions ledger — it is the spec (Scott's ticket text verbatim as R1 + owner calls O1–O7):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-decisions.md`
   There are no prior-round reports.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row`
   Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/draw-steel-elements`,
   branch `sc682-ds-list-picked-row`, cut from `develop` @ `bb3a3d10`.
   **All implementation happens there. Verify the absolute path before every write.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report and evidence
   in the ledger dir (section 6) — that main checkout is shared global state. Its dirt in
   `draw-steel-elements` (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault:
   expected, not yours, do not report it.
3. Fetch and confirm the base first:
   `git -C /home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/draw-steel-elements fetch origin`
   then check `origin/develop` is still `bb3a3d10`. If it moved, rebase onto the new sha and say
   so in the report. **Every git command uses `git -C <absolute path>`, never `cd X; git …`.**
4. Read the plugin's `AGENTS.md`, `e2e/README.md` (ids, manifests, the coverage gate, `knownBug`,
   "The editor insert paths"), and the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   **That file is ~500 KB — do NOT read it whole.** Read lines 1–30 and 146–266 (battery, devbox
   wrapping, lifecycle/e2e notes, exit-code footgun) and lines 1551–1554 (CURRENT numbers); grep
   it for the lifecycle `--only=` part lists (line 32) rather than printing that line whole.
5. Fresh worktree has no `node_modules`: run `npm ci` in the plugin dir once before any gate
   (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).
6. Code to read before changing anything:
   - `src/authoring/suggest.ts` (`DsElementSuggest.selectSuggestion`, lines 65–72: today it calls
     `this.close()` only when `insertBlock` refuses);
   - `src/authoring/schemaSuggest.ts` `selectSuggestion` (the SC-679 fix and its comment: the
     precedent);
   - `src/authoring/blockInsert.ts` `insertBlock` (what it returns, where it leaves the cursor);
   - `e2e/driver/authoring.ts` (`closeList`, `waitList`, `waitNoList`, `pressList`, `clickRow`,
     `listRows`) and `e2e/specs/authoring/ds-suggest.e2e.ts` (AUTH-S01..S09; note the `closeList()`
     calls after each accept — that is a workaround for this bug);
   - the SC-679 real-Obsidian tests as the pattern: `e2e/specs/authoring/gate-on.e2e.ts`
     AUTH-G13 / AUTH-G14 and `schema-suggest.e2e.ts` AUTH-K09;
   - jsdom: `test/dom/authoring/dsSuggestMatrix.test.ts`, `suggest.test.ts`, `insertRefusal.test.ts`.

## 2. The task

Scott's ruling, verbatim (the ticket; full text in the ledger as R1):

> Typing `/ds…` in a note and picking a block with Enter inserts the block, but the picked row stays on screen. The next Enter does nothing: no new line, no second insert. Escape clears it.
>
> Picking the row with a mouse click closes the list as it should.

> Expected: after any pick the list is closed, so the next Enter is a new line at the cursor.

The owner calls O1–O7 in the ledger turn that into the work below. Read them there.

### 2.1 Measure first (red before green; O4)

Before touching `src/`, on the unfixed `bb3a3d10` build in real Obsidian 1.14.4 (the e2e harness):

1. Write the new e2e tests of 2.3 and run them: they must FAIL on the unfixed build. Keep the
   failure output (log path in the report). A new test that passes before the fix proves nothing —
   rework it until it is red for the right reason, or say plainly why it cannot be made red.
2. Record what is on screen 1.5 s after a pick, without sending Escape: which list (rows' texts and
   their `data-dse-control` ids — `authoring.ds.item` vs `authoring.schema.key` / `.value`), for
   - `/dsstam` + Enter (the ticket's repro), `/dsstam` + click,
   - one element WITHOUT a schema key list + Enter (see `closeList`'s comment; name the element),
   - Live Preview and Source mode for the Enter cases.
   And what the second Enter does in each case (note text before / after it; a Notice? — since
   SC-687 a second pick inside the fresh block may be refused with a Notice instead of "nothing").
   Report this as a small table. The ticket's "does nothing" was measured before SC-687 landed;
   say what it is at `bb3a3d10`.
3. Record the O2 oracle: the saved note text after "accept, Escape, Enter" on the unfixed build,
   for each shape you test in 2.3.

### 2.2 The fix (O3)

`DsElementSuggest.selectSuggestion` closes the list on every path that had a context — after a
successful insert as well as after a refused one. Keep the SC-687 refusal behaviour exactly: one
Notice, the typed token stays, the list is closed. Do not change `insertBlock`, `fenceScan.ts` or
`schemaSuggest.ts` behaviour (O7). Update the code comment in `selectSuggestion` so it says why
the close is unconditional (short; cite SC-682 and what was measured).

If `this.close()` alone does not give O1 in real Obsidian (for example the in-block key list
still opens by itself after the pick, or a list survives in one mode), do NOT stack workarounds:
report what you measured, try at most one further minimal change, and say exactly what it is. If
that is not enough either, end with STATUS: NEEDS_CONTEXT and the measurements.

### 2.3 Tests (TDD: red first)

- **e2e, real Obsidian** (new `AUTH-*` ids following `e2e/README.md`; add a coverage pair only if
  a new control or key is driven, and say which). Minimum set:
  1. The ticket's repro, Live Preview: `/dsstam`, Enter, **Enter again with no wait between the
     two keys**; the saved note equals the O2 oracle text (the block plus ONE new line at the
     cursor, nothing else), no Notice shown, no list on screen, the block draws with no error card.
     "No wait" means the second Enter is sent in the same `browser.keys` sequence or the very next
     command with no `waitList` / `waitNoList` / `closeList` / pause between — a test that first
     waits for the list to go away passes even without the fix (ticket agent note).
  2. The same in Source mode.
  3. The settled case: `/dsstam`, Enter, wait 1.5 s, assert no list of any kind is on screen
     (`listRows()` empty; no Escape sent), then Enter adds one line. This is the ticket's
     step 2 as a human sees it.
  4. A pick by mouse click still leaves no list and the next Enter is a new line (pins the path
     the ticket says already works).
  5. An element with a schema whose key list could open over the fresh block, and one without
     (from your 2.1 table): after the pick no list opens by itself; then typing a letter on a body
     line of the new block opens the in-block key list as before (the schema suggester still
     works after a `/ds` pick).
  6. After a pick, typing `/ds` on a new line outside the block opens the `/ds` list again and a
     second pick inserts a second block; both blocks intact (`existingBlocksIntactProblem` or the
     driver's equivalent), byte-exact note text.
  7. A pick under a list item and a pick in a callout (the SC-675 shapes), then Enter with no wait:
     note equals the O2 oracle for that shape.
  8. A refused pick (SC-687: find its existing e2e test) still shows exactly one Notice and leaves
     no list — existing test must stay green; add nothing if it already asserts both.
- **O5:** in the specs, every `closeList()` that directly follows a `/ds` pick becomes an assertion
  that no list is on screen, with no Escape sent (use or add a driver helper that asserts
  immediately / within a short settle, and does not dismiss). List each replaced call in the
  report. `closeList()` after anything else stays. Update `closeList`'s doc comment so it no longer
  names the `/ds` pick as a reason, if that is now untrue.
- **jsdom:** a test that `selectSuggestion` calls `close()` exactly once after a successful insert
  and exactly once after a refused one, and that the written text is unchanged by this fix (the
  existing "touches no other byte" matrix in `dsSuggestMatrix.test.ts` is the pin — it must pass
  unmodified).
- Do not weaken or delete an existing test. If an existing test pins the bug (a list expected
  after a pick), rewrite it to the fixed behaviour and list it in the report.

### 2.4 Docs (part of done)

- Plugin `CHANGELOG.md` under `## 7.0.0 (unreleased; previously numbered 6.0.0)` and the workspace
  `CHANGELOG.md` under `## Unreleased`, each in its own convention (read the neighbouring SC-679 /
  SC-687 bullets; plain words, what the user sees). **The workspace-level file lives in YOUR
  worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/CHANGELOG.md`
  — never under `/home/scott/code/steelCompendium/workspace/`.** Commit it in the worktree's
  superproject (branch `sc682-ds-list-picked-row`); do NOT commit a submodule pointer bump —
  landing does that.
- `e2e/README.md` "The editor insert paths" and `docs/writing-blocks.md`: change them only if a
  sentence there is made false by this fix.

**Commits**: inside the plugin repo after each coherent step (`test(SC-682): …` / `fix(SC-682): …`
/ `docs(SC-682): …`). **No co-author trailers, no AI attribution of any kind in commit messages.**
Never push. Never tag. Never create a release.

## 3. Evidence (the owner eyeballs these, then Scott)

Two real-Obsidian PNGs of the ticket's repro (Live Preview, default Steel theme, an otherwise empty
note), taken about 1.5 s after the Enter pick with no Escape sent, made with a scratch script or a
temporary e2e spec that is NOT committed:

- `sc682-before.png` — clean `bb3a3d10` build: the picked row still on screen over the new block.
- `sc682-after.png` — your build: the block inserted, no list on screen.

Time-box the pair to about 20 minutes; the after-shot matters more. If neither comes easily, skip
and say so. Copy them to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/evidence/`.

## 4. Gates — `dse-verify`, in order

Expected (CURRENT at dispatch, dse `develop` @ `bb3a3d10`):

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: baseline in a fresh worktree **14674 passed / 2 skipped** (one more passed / 1 skipped once
  `npm run shots` has cached `visual-harness/dist/obsidian-app.css`). Report baseline + your delta.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed`, run as the seven `--only=` parts in
  the skill (equals sign; check each log starts with only its own ids), report the union.
- e2e, full run: baseline `OBSIDIAN-E2E done: 810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`.
  Expected after: `0 failed`, **10 known-bug** (unchanged — SC-682 has no marker in the tree), ok
  and total up by exactly your new tests, `coverage: Y/Y pairs`.
- shots / freeze / parity (O6): build `styles.css` on your head and on a clean `bb3a3d10` (e.g.
  a `git worktree add` scratch checkout at an absolute path under your scratch folder) and compare
  sha256. Identical and no CSS / rendering file touched → report "carry: shots 592, freeze
  280/280, parity 0/0/24" with the two hashes. Not identical → run shots, the freeze check and
  parity (last) per the skill. Never touch `.superpowers/sdd/freeze-baseline.sha256`.

Known flakes under load are named in the skill's CURRENT/PREVIOUS notes (INIT-W09, NEGO-R05,
NEGO-R08, G-S63): a red there is re-run alone before it is believed, and reported either way.
Another effort may run its gates concurrently in another worktree: expect load, and never touch
its processes.

## 5. Integrity self-check before you report

The pick writes into the user's note and the next Enter writes again. Show, with the tests above,
that after "pick, Enter": text above and below the block is byte-identical to before; a second
block in the same note is untouched; no second scaffold, no doubled word, no stray `/ds` token.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/sc682-r1-impl-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers, evidence paths).
Then: the 2.1 measurement table (before / after), the O2 oracle texts, the red-run proof (log
path + the failing assertion lines), the `closeList()` calls replaced, anything `close()` alone did
not fix. If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:

- STATUS: DONE | NEEDS_CONTEXT | BLOCKED
- plugin branch + head sha; superproject branch + head sha; base sha
- every gate's measured summary line (and the two `styles.css` hashes)
- files changed (list); new e2e ids; coverage pairs added (or none)
- the 2.1 table in five lines or fewer (what was on screen before the fix, per case)
- **the absolute filesystem path of every evidence artifact** (PNGs, logs, report)
- `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move
  a gate baseline) and `Follow-ups:` (left alone). Workers never file tickets.

## 8. Footguns (each has cost real time here)

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-682:`.
- **Devbox**: node/npm are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 —
  record exit codes inside a script FILE, and read each gate's own summary line. Never pipe a
  gate (`| tail` eats the failure).
- **Scratch**: the session scratchpad is shared by every agent. Use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc682-impl-r1/`
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
  `.superpowers/` outside `sc682-ds-list-picked-row/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose
  `readlink /proc/<pid>/cwd` is inside your worktree.
- **Stale superproject pin**: if `token-coverage.test.ts` goes red on a token-map row you did
  not touch, compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the
  main checkout's copy before believing it; clear with the test's `DSE_TOKEN_MAP_PATH` override.
- Commit after every coherent step so nothing sits uncommitted through a gate. `npm ci` again
  after any rebase that changed `package.json`.
