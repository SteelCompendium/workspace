# SC-584 r2 — independent adversarial review (reviewer). Execute and probe, do not just read.

You are the r2 reviewer for ticket SC-584 (draw-steel-elements, "DSE"). You did NOT write or design this code.
Your final text goes to the ticket-owner, not a human: raw facts, no prose. **Workers never call the tracker**
(Linear) — not to read history, not to post.

## 1. Context to load
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/
- decisions.md (all; the invariant, the owner constraints, "Owner rulings on r1").
- sc584-brief-r1-impl.md (what was asked) and sc584-r1-impl-report.md (the implementer's claims — verify, do not
  trust).
- Prior art: /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/
  sc556-outside-edit-open-form/ (sc556-r9-rereview-report.md found these two refusals; decisions.md),
  sc480-twin-save-after-note-change/ (card-write fallback, G-S73), sc552-twin-form-after-click/ (lineMap, pins).
- dse-verify: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (battery, devbox wrapping,
  exit-code footgun, "Block edit form Save and embeds (SC-556)").
Worktree: /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals, branch
sc584-embed-form-save-refusals. Range to review: dse `eeed5182..525115b0`; superproject `0c430d0d` (CHANGELOG only).
Do not commit to the branch. Probe edits must be reverted (`git -C <dse> status --porcelain` empty at the end); keep
mutants and probe harness in your scratch folder. The main checkout's dse vault dirt (demo-vault/Welcome.md,
compendium-manifest.json, demo-vault/*.md) is Scott's and expected.

## 2. The task
Governing ruling, verbatim (Scott, SC-556): "Save nothing with a notice is fine." Invariant: a block edit form's
Save never writes into a different identical block; when unsure, it writes nothing, shows the existing Notice, and
the form stays open. This ticket removes two FALSE refusals: (1) hover preview, + then the Edit pencil; (2) a
`![[note#^cal]]` block embed of a callout with text after the counter and an identical callout elsewhere.

Find what is wrong. At minimum, probe in real Obsidian (not only jest):
- The SC-556 hazard via the new open-time rule (`openTimeBodyLine` in `rebasePin`): can ANY sequence make a form Save
  land in a block other than the one the form was opened on? Try: outside edit of the form's own block before open
  and after open, with a twin holding the old/new body; a twin added after open; the block moved; the note edited
  around the block between + and pencil; CRLF; quoted fences / callouts / spaced language; unterminated trailing
  fence; three identical blocks; LP and RV; the + write racing the open-time read (force it if you can — delay the
  vault write; does Save then refuse?).
- Attack the implementer's "agreement" check (decisions.md, "Deviation … ACCEPTED"): can it match at the wrong place
  (repeated prose, short parts, empty context lines, trailing-blank trimming)? Is it ever vacuous?
- The changed existing test ("a cache that lags AND a section text that is stale, a long note" now lands): confirm it
  is the + then pencil shape, not a hazard the old assertion was guarding.
- Case 2 `^id` change (`verifiedPinLine`): the marker searched after max(closing fence, part's last non-blank line).
  Can the marker be found for the WRONG callout (both callouts carry `^id`s, nested callouts, a `^id` inside the
  counter's body, a list item `^id`, plain fenced `^id` unchanged)? Does it lands in the embedded callout in RV+LP?
- Neighbours: non-embedded cards, card (+/-) writes, the SC-480 fallback (`twinned`, `landsOnOtherBlock`; G-S73), SC-552
  (G-S64), SC-556 (G-S64 (v)-(z)), heading embeds of long notes, kept-open forms.
- Owner-requested measurement (r1 F2): with a REAL mouse path (CDP Input.dispatchMouseEvent, not a synthetic
  trigger): hover the link, move into the popover, click + then the pencil, move the pointer into the modal, type,
  Save. Does the hover popover close and take the form with it? On base eeed5182 and on HEAD. Report cells (closed /
  survived / saved), ms timings, RV and LP. This decides whether case 1's fix is reachable in real use.
- Owner-requested probe (r1 F3, cheap only): whole long-note hover `[[long note]]` — does a card draw if the preview
  scrolls to it? Report; do not sink time.
- Are the jest tests and G-S64 phases (zk)(zl)(zm)(zn)(xc)(yc)(zc) real? Run your own mutants beyond the
  implementer's m1-m6 (e.g. agreement check compares only the before-lines; count done on the part instead of the
  whole note; `^id` search unbounded).
- CHANGELOG accuracy (dse CHANGELOG.md and the superproject worktree CHANGELOG.md): no over-claim; it should say
  what still refuses.
- dse-verify proposal sc584-dse-verify-proposal.md: accurate to the code and numbers?
- Re-run: tsc, lint, jest, lifecycle part 3 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`, report wall
  time) and part 5 (`G-S59 G-S49 G-S73`), e2e. Confirm styles.css sha equals the clean eeed5182 build (`4295ca33…`).
  Expected on HEAD: jest 7089 passed / 2 skipped (fresh worktree; SC-568 load timeouts possible — re-run alone);
  lifecycle part 3 9/9, part 5 3/3; e2e `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`.

Severity scale: CRITICAL (writes into the wrong block / loses data), HIGH (regression of a shipped guarantee), MEDIUM,
LOW, INFO. Each finding: file:line, failure scenario with exact steps and observed bytes/cells, prescribed fix.

## 3. Footguns (binding)
- No compound `cd`. Use `git -C <abs path>` and `devbox run -c <abs dse path> -- …`. Multi-command shells as a script
  file (Write tool) in your scratch folder, run via `devbox run -c <abs dse path> -- bash <script>`; exit codes
  recorded inside the script (`bash -c '…; echo rc=$?'` under devbox always records 0).
- Never `rm` with a variable target; never a glob `rm` under /tmp. Overwrite with `>` or use fresh file names.
- One gate per Bash call, in the FOREGROUND; no background jobs or Monitor (a job you start does not wake you). If
  the harness moves a long call to the background, poll that process's own log file until it ends. Long output to a
  log file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Never set DSE_LIFECYCLE_PORT. Lifecycle parts each in their own call; G-S56 stays last in SCENARIOS order. If you
  run shots or the camera, a private DSE_CAMERA_TMP in your scratch folder.
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside this worktree
  or your scratch folder (no pkill/killall by name — SC-572 and SC-575 run Obsidian concurrently).
- Never `rm -rf` anything under the shared `.superpowers/` dir.
- Private scratch folder:
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc584-r2-reviewer/
  (create it). Gate logs go in the ledger dir as sc584-r2-gate-<name>.log.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If
  you ever do send a message anyway, its FIRST WORD must be `SC-584:`.
- If the report-file write is blocked by your harness, return the report inline.

## 4. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/sc584-r2-review-report.md,
opening with an executive summary of at most 10 lines (verdict SHIP / FIX FIRST, counts by severity, the F2
real-mouse answer in one line). Then findings by severity, the probe matrix, mutants, gate lines.

## 5. Return contract
Final text: verdict, counts by severity, one line per finding (severity, file:line, one-sentence scenario), the F2 and
F3 answers, each gate's summary line, `git status --porcelain` of the dse worktree, and the absolute path of every
evidence artifact (report, gate logs, probe logs, mutant logs).
