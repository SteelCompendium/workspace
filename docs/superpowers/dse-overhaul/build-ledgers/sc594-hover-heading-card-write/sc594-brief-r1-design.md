# SC-594 r1 — measure and design: a card + / - write from a hover preview (design/survey round, no product commits)

You are the r1 design worker for ticket SC-594 (draw-steel-elements, "DSE"). Your final text goes to the ticket-owner, not a
human: raw facts (verdict, measured numbers, paths), no prose. **Workers never call the tracker** (Linear) — not to read
history, not to post. This brief is self-contained and replacement-ready. You produce MEASUREMENTS and a DESIGN; a separate
implementer builds it and a different reviewer reviews it, so do not commit product code.

## 1. Context to load (files, not conversation)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/
- decisions.md — read all of it (governing ruling, owner constraints, the invariant, P14, the SC-584 lesson).

Prior art (tracked, read-only), under /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/:
- sc584-embed-form-save-refusals/decisions.md — the whole Log (9 rounds; the same twin class bit three times: a body search
  in a stale multi-block window picks the twin).
- sc584-embed-form-save-refusals/sc584-r2-review-report.md — exec summary + INFO-2 (P14) + F1 (this ticket).
- sc584-embed-form-save-refusals/sc584-r2-probe.test.ts.txt — jest probe incl. P14 (line ~250); reuse its helpers.
- sc584-embed-form-save-refusals/sc584-r7-sweep-table.txt — the construct sweep format to copy.
- sc480-twin-save-after-note-change/decisions.md — the card-write twin rule (`twinned`, `countByBody`, `landsOnOtherBlock`), G-S73.
- Gate skill /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (~330 KB — read in parts with
  offset/limit): lines 1-218 (battery, devbox wrapping, lifecycle notes, THE exit-code footgun), "Block edit form Save and
  embeds (SC-556)" (~line 335; esp. the 5 s card-Notice rate limit, the authoring footguns (2)-(4), and footgun (3): "A hover
  over `[[long note#Heading]]` is given a section chunk, not the heading's lines"), "Hover preview modals (SC-595)" (~line 396;
  G-S83 real-mouse hover footguns: how to drive a real hover, where the popover instance lives, DSE_CAMERA_TMP).
- Repo rules: /home/scott/code/steelCompendium/workspace/AGENTS.md and draw-steel-elements/AGENTS.md.

Source: draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts at ce4937ef — `takePin` (~810-850), `pinFromLastWrite`,
`rebasePin` (~875), `verifiedPinLine`, `searchedPinLine`, `pinnedTarget` (~1011), `twinned` (~1021), `landsOnOtherBlock`
(~1033), `replaceSource` (~1100-1145), `countByBody` (~220), `partialPins` (~400). Lifecycle scenarios G-S64 / G-S77 / G-S83
(find them with grep in the dse tree) for real-Obsidian hover/embed driving.

Worktree: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write (branch sc594-hover-heading-card-write in
every submodule). DSE: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write/draw-steel-elements, HEAD
ce4937ef (= origin/develop at dispatch). First `git -C <dse path> fetch origin` and report if origin/develop moved (do not
rebase — no product commits this round). Run `devbox run -c <abs dse path> -- npm ci` (fresh worktree). Never edit the main
checkout /home/scott/code/steelCompendium/workspace except your report files in the ledger dir. The main checkout's dse vault
dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected — ignore it.

Probes: put probe tests / probe lifecycle code in the worktree but DO NOT COMMIT them; when done, save each probe as a `.txt`
copy in the ledger dir (sc594-r1-probe-*.txt) and revert the worktree to a clean `git status` (literal paths, `git -C … checkout
-- <file>` / delete only files you created, by literal path).

## 2. The task — measure, then design

Ticket (verbatim): "Hover over a link to a heading of a long note (`[[long note#Tracker]]`) whose section holds a counter, and
press + or - in the preview. If an identical counter sits elsewhere in that note, the click is not saved: nothing changes and the
\"changed on disk first\" Notice shows. Nothing changed on disk and the preview only shows one counter, so the click could have
been saved."
Agent notes (verbatim): "A card write could use the same rule at click time; it must keep SC-480's guarantees (never a write into a
twin; G-S73)." … "a card write from a BLOCK-link hover (`[[note#^a]]`) writes the identical twin when the block was edited from
outside before the click — `twinned` counts the known body in `pin.text` (the stale part, so 0) and `landsOnOtherBlock` is skipped
for a partial pin. … A fix here must refuse that shape too."
Governing ruling (Scott, verbatim from the ledger): "Save nothing with a notice is fine." — a refusal (Notice, nothing written) is
always acceptable; a write into the wrong block never is.
Note: `openTimeBodyLine`, which the ticket names, was REMOVED in SC-584 r3 (its agreement check was vacuous for block-only parts).
Do not resurrect it without answering r2 HIGH-1 (sc584-r2-review-report.md).

### A. Measure (real Obsidian, lifecycle harness; jest only where stated)
1. Reproduce the ticket in real Obsidian, RV and LP: a long note (long enough that the hover gives a section chunk), heading
   `## Tracker` holding counter A, an identical counter B elsewhere (with different prose between them). Real hover over
   `[[long note#Tracker]]`, press + in the preview. Record: written or refused, Notice, the note after.
   Also a SHORT note with the same layout (does the short-note hover refuse too?), and a whole-note hover `[[long note]]`.
2. For the hover card at click time, dump everything the host can see: `getSectionInfo` (text, lineStart, lineEnd — how many
   lines, does it include the heading?), the card's DOM ancestors (classes; any `src` / data attrs), whether the hover popover
   instance / the embed component reachable from the card's DOM or from `app.workspace` exposes the link's file and subpath
   (e.g. a `subpath` / `file` / `linktext` field on the popover or its embed child — inspect the real objects), and the rendered
   preview's DOM around the card (does it hold the heading element?). Say for each fact HOW the plugin could reach it (public
   API, `ctx`, DOM, or a private field) and whether it is stable across RV / LP.
3. Reproduce P14 in real Obsidian: `[[note#^a]]` hover, block A edited from outside (vault.process / modify) before the click, so
   its twin B now holds the card's known body; press + in the preview. Does it write B? (Jest P14 says yes on 525115b0;
   confirm at ce4937ef in jest and, if the hover survives the outside edit's redraw, in real Obsidian — if the redraw makes it
   unreachable, measure and say so, as SC-584 r2 did for forms.)
4. Run the same probe for a heading hover with block A edited from outside before the click (is there a P14 twin for heading
   hovers, under the current code and under your proposed rule?).

### B. Design
Propose the click-time rule for a card (+ / -, fromView) write whose pin is partial (hover / embed part). Requirements:
- It saves the ticket's shape (heading hover, unique position) into the hovered counter, RV and LP.
- It never writes a twin. It refuses P14 and every edited-before-click twin shape. If the position is not determinate, it refuses
  (today's Notice path; no new strings).
- Form pins (SC-584's `lastWrite` record, the structural guard in `takePin`) and non-embedded cards are unchanged. Say whether a
  card write should use the host's own `lastWrite` record for a SECOND + in the same preview (does a second click today refuse
  or land? measure) and whether that is safe.
- Run your rule (as a probe patch, uncommitted) through a construct sweep BEFORE proposing it: plain fence, callout, header-less
  quote, quote whose first line is a fence, nested quote/callout, list item (expect the SC-461 list refusal), footnote — x link
  shape (heading hover, block hover `[[note#^id]]`, heading embed `![[note#H]]`, block embed `![[note#^id]]`, whole-note hover)
  x RV/LP-style host x {no outside edit, own block edited before click, twin edited before click, identical block added before
  click}. Jest for every cell; real Obsidian for the ticket shape, P14, and the two shapes your rule is least sure of. Table
  format: copy sc584-r7-sweep-table.txt; columns base (ce4937ef) vs your probe.
- Name exactly what still refuses after the rule (with a Notice) so the CHANGELOG cannot over-claim.
- Test plan for the implementer: jest tests (red on base where behaviour changes), mutants that must die, and lifecycle phases in
  a NEW scenario G-S92 for part 5 (part 5 is ~347 s today; estimate G-S92's wall time; if part 5 would pass ~480 s, propose a
  sixth part instead). No new phases in G-S64 (part 3 is at ~480 s).
- If the only reliable signal is a private Obsidian field, say so plainly and give the fallback (refuse) when it is absent — the
  owner will judge whether that needs Scott.

## 3. Gates
No product commits this round, so no battery. Your probes must run green/red as stated in your report. Leave the worktree's
`git status --porcelain` empty in every submodule at the end and report it.

## 4. Footguns (all binding)
- No compound `cd`. Use `git -C <abs path>` and `devbox run -c <abs dse path> -- …`. For multi-command shells, write a script
  file (Write tool) in your scratch folder and run `devbox run -c <abs dse path> -- bash <script>`; record exit codes inside the
  script (`bash -c '…; echo rc=$?'` under devbox always records 0).
- Never `rm` with a variable target; NEVER `rm -rf` a /tmp glob (a worker did this today and wiped other efforts' kept
  lifecycle FAIL dirs); delete only literal paths you created. Never `rm -rf` anything under the shared `.superpowers/` dir.
- One gate/probe run per Bash call, in the FOREGROUND, output redirected to a log file (the 600 s stream watchdog kills silent
  agents). No background jobs, no Monitor (a job you start does not wake you).
- Never set DSE_LIFECYCLE_PORT. Give any camera/lifecycle run you start with custom scratch a private DSE_CAMERA_TMP in your
  scratch folder; never a long TMPDIR (Obsidian exits at start-up).
- Kill processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your worktree (no
  pkill/killall by name — SC-588 and SC-598 run Obsidian concurrently).
- Private scratch folder (create it):
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc594-r1-design/
  Logs you want kept go in the ledger dir as sc594-r1-*.log.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches,
  and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- The e2e runner reads test titles for scenario ids: never put a bracketed ticket id in a test title.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not to me.
  If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a
  message anyway, its FIRST WORD must be `SC-594:`.
- If the report-file write is blocked by your harness, return the report inline.
- Scope: stay on this question. Measurements A1-A4 and design B; no general survey of the host.

## 5. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/sc594-r1-design-report.md, opening
with an executive summary of at most 10 lines (the rule in one sentence; does it need a private Obsidian field; P14 reachable in
real Obsidian yes/no; what still refuses). Sections: A1-A4 measurements (with the log path per measurement), the rule, the sweep
table (or a path to it), the test plan, open questions for the owner.

## 6. Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, origin/develop sha, `git status --porcelain`
of the dse worktree, the 10-line summary, and the absolute path of every artifact (report, probe .txt files, logs).
