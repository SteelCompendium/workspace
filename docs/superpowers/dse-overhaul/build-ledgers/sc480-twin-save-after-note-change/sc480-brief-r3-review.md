# SC-480 r3 — independent adversarial review (reviewer). Execute and probe, do not just read.

You are the r3 reviewer for ticket SC-480 (draw-steel-elements, "DSE"). You did NOT write or design this code.
Your final text goes to the ticket-owner, not a human: raw facts, no prose. **Workers never call the tracker.**

## 1. Context to load
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/
- decisions.md (all; "Owner rulings on r1" is the spec).
- sc480-r1-survey-report.md (executive summary, Q2 map, Q3/Q4) — the design's evidence.
- sc480-r2-impl-report.md — the implementer's claims (verify, do not trust).
- dse-verify: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (battery, devbox wrapping,
  exit-code footgun, "Block edit form Save and embeds (SC-556)").
Worktree: /home/scott/code/steelCompendium/worktrees/sc480-twin-save-after-note-change, branch
sc480-twin-save-after-note-change. Range to review: dse `97a9c93b..cb665989`; superproject `3efbbc13` (CHANGELOG only).
Do not commit to the branch. Probe edits must be reverted (`git status --porcelain` empty at the end); save mutants
and probe harness in your scratch folder. The main checkout's dse vault dirt is Scott's and expected.

## 2. The task
Binding rulings (verbatim from the ledger):
- SC-556, Scott: "Save nothing with a notice is fine." — a form Save never writes into a different identical block.
- Owner ruling: "take option E" — "a card write whose pin misses falls back to today's placement only when the body is
  unique in the note as clicked (pin.text) AND now; else 'miss' -> existing dropped-write Notice."
- "Notice: the existing text, no new string (`droppedWriteMessage`); card Notices keep the 5 s per-note rate limit
  (unchanged)."
- "Unpinned card writes ... keep today's path (no E test)."

Find what is wrong. At minimum, probe in real Obsidian (not just jest):
- Every SC-480 deleted-twin cell (twin above/below, RV/LP, 2 and 3 identical blocks, leave and stay, callout twins):
  nothing written, exactly one Notice. The race cells still land in the clicked block.
- Integrity: content above and below the clicked block survives byte-for-byte; two same-kind blocks do not cross-talk;
  a hand edit survives; a twin-free block that moved, a long twin-free note (>400 edits), an embed, CRLF, an
  unterminated trailing fence still save.
- Regressions in neighbours: SC-552 (G-S64), SC-549, SC-556 form Saves (still pin-only), SC-544 sibling flush,
  SC-457 spaced-fence twins, SC-455 unplaceable Notice, multi-click rounds within 400 ms, a second round after a
  refused write (does the next click save correctly once the twin note settles?).
- Does `countByBody` agree with `locateByBody`'s fence scope (quoted fences, callouts, unterminated trailing fence,
  spaced language)? Can it count a block inside another language's fence?
- Is G-S73 real (fails on a base bundle (f69b8fd6 or 97a9c93b); would catch a mutant that drops either count)? Are the jest tests
  vacuous? Run your own mutants.
- Owner-requested probe (r2 follow-up F1): a card click inside a heading embed `![[note#H]]` whose write flushes BEFORE the
  embed's async pin rebase finishes (partial pin), with an identical block OUTSIDE that section. Where does base 97a9c93b
  write (the clicked block, the outside twin, nowhere)? Where does HEAD? How wide is the window (ms)? Report the cells.
- CHANGELOG accuracy (no over-claim, e.g. the unpinned path or the long-twin cost).
- Re-run: tsc, lint, jest, lifecycle part 5 (`G-S59 G-S49 G-S73`) and part 3, e2e. Confirm styles.css sha equals a
  clean 97a9c93b build. Expected on base 97a9c93b: jest 7050 passed / 1 skipped + new tests; lifecycle 53/53;
  e2e `OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`.

## 3. Footguns (binding)
- No compound `cd`; `git -C <abs>`, `devbox run -c <abs dse path> -- …`; multi-command shells as a script file run via
  `devbox run -c <abs dse path> -- bash <script>`, exit codes recorded inside the script.
- Never `rm` with a variable target; never a glob `rm` under /tmp.
- One gate per Bash call, foreground; no background jobs or Monitor; long output to a log file.
- Never set DSE_LIFECYCLE_PORT. Lifecycle in its five `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4); `G-S59 G-S49 G-S73` (3)
  — or wherever the r2 report says G-S73 went. Private DSE_CAMERA_TMP if you run shots.
- Kill processes by literal PID only (SC-436/SC-437 run Obsidian concurrently).
- Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r3-reviewer/
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input -> end with STATUS: NEEDS_CONTEXT. Any
  message you do send starts with `SC-480:`.
- If the report-file write is blocked, return the report inline.

## 4. Report
sc480-r3-review-report.md in the ledger dir; ≤10-line executive summary first (verdict LAND / FIX FIRST, counts by
severity). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, measured evidence,
prescribed fix.

## 5. Return contract
STATUS, verdict, dse HEAD reviewed, gate summary lines you re-ran, finding counts, absolute paths of every artifact.
