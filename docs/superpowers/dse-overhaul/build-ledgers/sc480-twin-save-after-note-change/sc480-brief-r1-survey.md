# SC-480 r1 — measure + design survey (reviewer). NO commits.

You are the r1 survey worker for ticket SC-480 (draw-steel-elements, "DSE"). Your final text goes to the
ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose. **Workers never call the
tracker** (Linear) — not to read history, not to post.

## 1. Context to load (files, not conversation)
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/decisions.md
  (read all of it — the ticket text, the binding SC-556 ruling, owner notes).
- Workspace rules: /home/scott/code/steelCompendium/workspace/AGENTS.md, and draw-steel-elements/AGENTS.md.
- Gate + harness skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md — read
  "The battery, in order", "Devbox wrapping", "THE exit-code footgun", and "Block edit form Save and embeds (SC-556)".
- Prior art on this exact write path (read the decisions + the named report summaries, not every log):
  - /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc457-fence-space-lang/sc457-review-r1-report.md
    INFO-2, INFO-3 (the origin of SC-480; measured BEFORE SC-552). Its probe scripts may still exist under
    /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r1-be71a0a9/
    (read-only reference; do not write there).
  - build-ledgers/sc552-twin-form-after-click/decisions.md + sc552-r1-diag-report.md (SC-552 B+K WIDE: forms pinned,
    each card's FIRST click pinned via pendingPin in notePersistIntent, host/lineMap.ts; unplaceable pin -> resolveWriteTarget).
  - build-ledgers/sc556-outside-edit-open-form/decisions.md (form Saves are now pin-only; Scott's ruling).
  - build-ledgers/sc343-stale-write-guard-ledger.md (the durable path design: locateByBody, droppedWriteNotice).
- Worktree: /home/scott/code/steelCompendium/worktrees/sc480-twin-save-after-note-change, branch
  sc480-twin-save-after-note-change in every submodule. DSE is at
  /home/scott/code/steelCompendium/worktrees/sc480-twin-save-after-note-change/draw-steel-elements, HEAD must be
  f69b8fd6 (= origin/develop at dispatch). Run `git -C <that path> fetch origin` and confirm origin/develop is still
  f69b8fd6; if it moved, report it and continue on f69b8fd6. Verify you are in the worktree before any write; never
  write in the main checkout /home/scott/code/steelCompendium/workspace (except your report files in the ledger dir).
  The main checkout's dse vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's
  and expected — ignore it.
- Baseline at f69b8fd6: jest 6634 passed / 2 skipped / 258 of 259 suites · lifecycle 52/52 · e2e
  163/164 ok, 0 failed, 1 known-bug (SC-572), coverage 113/113 pairs.

## 2. The task — measure, map, design. No commits; leave the worktree clean.

The ticket (filed 2026-10-21, before SC-552 and SC-556 landed) says a CARD write (a control click, e.g. a
ds-counter "+") can land in a different block with identical contents ("twin") when:
- **Race:** click a control, then edit the note so the clicked block moves, then leave the note within
  milliseconds (before the debounced write flushes);
- **Deleted block:** the clicked block is deleted before its save is written — the save lands in the twin
  instead of the "not saved" Notice.
Its question: "when more than one block matches, should DSE refuse the save and show the notice?"

Binding ruling to keep (SC-556, Scott, verbatim): "Save nothing with a notice is fine." — a block edit form's
Save never writes into a different identical block. Nothing you propose may weaken that.

Answer, with measurements in real Obsidian (lifecycle-harness style probes, like SC-457/SC-552 r1 did) at f69b8fd6:

Q1. Does each ticket case still misroute at f69b8fd6? Measure the race and the deleted-block case, each with the
    twin ABOVE and BELOW the clicked block, Reading view and Live Preview, 2 twins and 3 twins, N≥5 trials per cell.
    Report a small table: cell -> resulting values per block + Notice count. Include one control per case with no
    twin (expected: race lands correctly; deleted -> exactly one Notice, file untouched).
Q2. Map every write path that can reach a body search / twin fallback today for CARD writes (and confirm forms
    cannot): file:line for resolveWriteTarget, locateByBody, pinnedTarget, pendingPin / notePersistIntent, the
    flush on navigate-away / view unload. When is a card write pinned (first click only? every click? cleared
    when?) and when does it fall back? Is a SECOND click (after the pin is consumed) unpinned?
Q3. Design options, each with: the rule in one sentence, the code change size (files, ~lines), which Q1 cells
    it fixes, and — measured, not guessed — what it newly REFUSES that succeeds today (the cost). At least:
    - A (ticket's idea): body search refuses when more than one block of that language has the same body.
    - B (SC-556's rule extended to cards): a pinned card write goes to its pin or nowhere (Notice); unpinned
      writes as today. Note whether unpinned card writes remain exposed to the twin.
    - C: pin every card write (not just the first click) + B.
    - anything better you find.
    Cost probes must include: a long note with >400 changed lines on both sides (LINE_MAP_MAX_EDITS), a block in
    an embed (`![[note#Heading]]`), a callout block, an unterminated trailing fence (G-S6u/G-S28 shape), CRLF,
    and a twin-free note where the block moved (must still save). You may prototype in the worktree; save each
    prototype as a patch file in the ledger dir and `git -C <dse path> checkout -- .` afterwards (no commits;
    `git status --porcelain` empty at the end).
Q4. Recommendation (one option) and why, plus the exact text of any new Notice (prefer the existing
    "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first." wording
    if it fits; say if it does not fit the deleted-block case).

Bound: this is a measure-and-design round. Do not run the full battery. Do not write lifecycle scenarios into the
repo. Probe harness files live in your private scratch folder:
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r1-reviewer/
(create it; nothing else).

## 3. Footguns (all binding)
- No compound `cd`. Use `git -C <abs path>` and `devbox run -c <abs path> -- …` (for a multi-command shell, put it in
  a script file in your scratch folder and run `devbox run -c <abs dse path> -- bash <script>`). Record exit codes
  inside the script, not via `bash -c '…; echo rc=$?'` (always 0 under devbox).
- Never `rm` with a variable target; never a glob `rm` under /tmp. Overwrite with `>` or use fresh file names.
- One gate / probe batch per Bash call, in the FOREGROUND. No background jobs, no Monitor. Split long runs to stay
  under the 10-minute tool timeout. Redirect long output to a log file rather than streaming it (the 600 s stream
  watchdog kills silent agents).
- If you run lifecycle scenarios: never set DSE_LIFECYCLE_PORT. Lifecycle runs in FIVE `--only` parts
  (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9;
  `G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49` 2), G-S56 stays last in SCENARIOS order. If you run shots, give the
  run a private DSE_CAMERA_TMP inside your scratch folder.
- Kill scratch processes by literal PID only (no pkill / killall by name — other agents run Obsidian concurrently:
  SC-436 and SC-437).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If
  you ever do send a message anyway, its FIRST WORD must be `SC-480:`.
- If the report-file write is blocked by your harness, return the report inline.

## 4. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/sc480-r1-survey-report.md
It must OPEN with an executive summary of at most 10 lines (Q1 verdict per case, recommended option, its cost in one
line). Then Q1 table, Q2 map, Q3 options, Q4. Prototype patches: sc480-r1-proto-<letter>.patch in the same dir.
Logs: sc480-r1-*.log in the same dir (or your scratch folder — list every path).

## 5. Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), dse HEAD sha, `git status --porcelain`
result, the executive summary, and the absolute path of every evidence artifact (report, patches, logs, any PNGs).
