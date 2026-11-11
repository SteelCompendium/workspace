# SC-584 r1 — make two embed shapes' form Save succeed when nothing is ambiguous (implementer)

You are the r1 implementer for ticket SC-584 (draw-steel-elements, "DSE"). Your final text goes to the
ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose. **Workers never call the
tracker** (Linear) — not to read history, not to post. This brief is self-contained and replacement-ready.

## 1. Context to load (files, not conversation)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/
- decisions.md — read all of it (Scott's governing ruling, the owner constraints, the invariant).

Prior art (tracked, read-only), under /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/:
- sc556-outside-edit-open-form/sc556-r9-rereview-report.md — FOUND both refusals; read its executive summary and the
  two findings that became this ticket (hover + then pencil; callout `^id`). Also skim sc556-.../decisions.md "Log"
  (r4-r8: open-time rebase of an embedded card's pin by the embed's link subpath, `rebasePin`, `partialPins`).
- sc480-twin-save-after-note-change/decisions.md + sc480-r6-fix-report.md summary — SC-480 just touched the same
  write path (`countByBody`, `landsOnOtherBlock`, card-write fallback); do not regress it.
- sc552-twin-form-after-click/ — `host/lineMap.ts`, form pins its block at open.
- Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md — battery, devbox
  wrapping, THE exit-code footgun, section "Block edit form Save and embeds (SC-556)" (incl. the 5 s card-Notice rate
  limit and the twin-separated-only-by-blank-lines footgun), "Current expected numbers" CURRENT.
- Repo rules: /home/scott/code/steelCompendium/workspace/AGENTS.md and draw-steel-elements/AGENTS.md.

Worktree: /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals (branch
sc584-embed-form-save-refusals in every submodule). DSE: .../sc584-embed-form-save-refusals/draw-steel-elements, HEAD
eeed5182. First: `git -C <dse path> fetch origin`; if origin/develop moved past eeed5182, rebase onto it and report
the new base. Run `npm ci` in the dse worktree (fresh worktree; `devbox run -c <abs dse path> -- npm ci`).
Verify every write is inside the worktree; never edit the main checkout /home/scott/code/steelCompendium/workspace
(except your report/log files in the ledger dir). The workspace-level CHANGELOG.md you edit lives in YOUR worktree's
superproject at /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals/CHANGELOG.md — never under
/home/scott/code/steelCompendium/workspace/. The main checkout's dse vault dirt (demo-vault/Welcome.md,
compendium-manifest.json, demo-vault/*.md) is Scott's and expected — ignore it.

## 2. The task
Governing ruling, quoted verbatim from the ledger (Scott, SC-556, 2026-11-10): "Save nothing with a notice is fine."
Invariant: a block edit form's Save never writes into a different identical block. When the plugin cannot be sure
which block the form belongs to, Save writes nothing, shows the existing "changed on disk first" Notice, and keeps
the form open (today's refusal path — no new strings). This ticket only removes FALSE refusals in two shapes.

Ticket text (verbatim):
1. "A hover preview, + then the pencil. Hover over a link to a note holding a counter, press + in the preview and
   then the Edit pencil right away. Save is refused even when the block is the only one in the note, in short notes
   too. Before SC-556 it saved."
   Agent notes: "the preview has no `src`, and the section text read at open is stale, so `rebasePin` cannot place
   the pin. It lands in `partialPins` and `pinnedTarget` refuses it. The reviewer's suggested fix was to place the pin
   when exactly one block of that type in the note holds the known body. Do NOT apply that as-is: if an outside edit
   changes the form's own block and leaves its twin as the only match, it writes into the twin, which is the SC-556
   bug. The count of matching blocks has to be taken when the form opens, and it must also hold at Save."
2. "A block embed of a callout `![[note#^cal]]` where the callout holds the counter with more text after it, and an
   identical callout sits elsewhere in the note. Save is refused. Before SC-556 it wrote into the wrong callout."
   Agent notes: "the `^id` marker check at `ReadingModeBlockHost.ts:870-876` looks for the marker right after the
   counter's closing fence. For a callout it should look after the end of the embedded section (resolveSubpath's
   `end`)." (Line numbers are from f69b8fd6; re-locate at eeed5182.) Expected after the fix: Save lands in the
   EMBEDDED callout's counter, never the other identical callout.

Owner direction for case 1 (a direction, not a ruling — if you find it unworkable, explain and propose; do not
silently pick something else):
- Preferred shape: at form open, when an embedded card's pin is still partial after `rebasePin`, read the note text
  (the same read the open-time rebase uses) and count blocks of that language whose body equals the body the form
  was opened with. If exactly one, convert the pin to an ordinary whole-note pin at that block's position, recorded
  against THAT open-time note text, so Save's existing pin rebasing (lineMap) handles every later outside edit — an
  outside edit to the form's own block then refuses exactly as today, and a twin added later is irrelevant because
  the pin is positional. Zero or two+ matches: leave the pin partial (today's refusal).
- Establish first, with a probe, which body is "known" at open in the + then pencil race (the pre-+ section text
  the preview holds, or the post-+ value the form shows), and whether the open-time note read can predate the +
  write landing. The match must be against text and a body that agree; if the + write can land after the open-time
  read, the resulting Save must refuse (not land on a guess). Report how often the race refuses in your probe runs.
- Same rule must not widen anything for non-embedded cards, card (+/-) writes, or the SC-480 fallback.

Deliverables:
1. Source fix in `src/framework/host/ReadingModeBlockHost.ts` (and helpers as needed), code comments citing SC-584
   with the rule in one sentence each.
2. Jest host tests: case 1 (hover/no-src partial pin, unique body -> lands; twin in note at open -> refused; outside
   edit to the form's own block after open with a twin left as the only match -> refused (the SC-556 hazard);
   identical block added after open -> lands in the original). Case 2 (callout `^id` with text after the counter and
   an identical callout elsewhere -> lands in the embedded callout; marker absent/mismatched -> refused; the plain
   non-callout `^id` case unchanged). Red on eeed5182 where they assert new behaviour (run once against the unpatched
   source, keep the log). Mutation sanity: at least (m1) skip the open-time uniqueness count (place on first match),
   (m2) take the count at Save time instead of open, (m3) revert the callout marker check to after-the-fence — each
   must turn a test red.
3. Lifecycle: new phases for both shapes, real Obsidian, RV and LP where the shape exists (hover preview; `^id`
   callout embed). Put them in G-S64 (the embed/hover phases live there) if part 3 stays under ~480 s; otherwise a
   new scenario G-S77 (reserved for this ticket) inserted before G-S56 in SCENARIOS order (G-S56 stays LAST), run in
   the fifth `--only` part. Must FAIL on an eeed5182 bundle (keep the log) and pass on yours. Include a control that
   must refuse (case 1 with an outside edit to the form's own block leaving a twin). Mind the 5 s card-Notice rate
   limit only for card writes; form Saves' Notices are forced.
4. CHANGELOG bullets (user-facing, plain words): dse CHANGELOG.md Unreleased in its existing format, and the
   superproject worktree CHANGELOG.md under `## Unreleased`. Do not over-claim (say what still refuses).
5. dse-verify proposal: sc584-dse-verify-proposal.md in the ledger dir — replacement text for the SC-556 section's
   "Known refusals (SC-584)" bullet, the CURRENT block with your numbers, any lifecycle part/count change. Do NOT
   edit dse-verify SKILL.md.

Commits: in the dse worktree on branch sc584-embed-form-save-refusals (red tests may be their own commit; code +
tests; lifecycle; docs). Commit after every coherent step. Superproject: commit only CHANGELOG.md on the worktree
branch (no dse pointer bump — the dispatcher does that at landing). No pushes. No tags, ever. No co-author or AI
attribution lines in commit messages.

## 3. Gates — full battery per dse-verify, in order. Expected (baseline eeed5182):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest 7076 non-skipped: 7074 passed / 2 skipped in a fresh worktree plus your new tests; the two SC-568 load
  timeouts may appear — re-run those suites alone and report.
- lifecycle 53/53 (54/54 if you add G-S77) in five `--only` parts, each its own foreground call:
  `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21);
  `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4);
  `G-S59 G-S49 G-S73` (3) (+ G-S77 in this part if you add it). Report each part's wall time.
- e2e `251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs`.
- styles.css: no CSS change expected — compare sha256 against the clean eeed5182 build (`4295ca33…`). If identical,
  shots 592 / host-leak 163/978 / capture clip 147, freeze 280/280 and parity 0/0/24 carry and you skip them (say
  so). If it differs, STOP and return NEEDS_CONTEXT.

## 4. Footguns (all binding)
- No compound `cd`. Use `git -C <abs path>` and `devbox run -c <abs dse path> -- …`. For multi-command shells, write a
  script file (Write tool) in your scratch folder and run `devbox run -c <abs dse path> -- bash <script>`; record exit
  codes inside the script (`bash -c '…; echo rc=$?'` under devbox always records 0).
- Never `rm` with a variable target; never a glob `rm` under /tmp. Overwrite with `>` or use fresh file names.
- One gate per Bash call, in the FOREGROUND. No background gates, no Monitor (a job you start does not wake you).
  Lifecycle runs as five separate calls. Redirect long output to a log file rather than streaming it (the 600 s
  stream watchdog kills silent agents).
- Never set DSE_LIFECYCLE_PORT. If you run shots or the camera at all, give the run a private DSE_CAMERA_TMP in your
  scratch folder.
- Kill scratch processes by literal PID only, and only a PID whose command line or `/proc/<pid>/cwd` is inside your
  worktree (no pkill/killall by name — SC-572 and SC-575 run Obsidian concurrently).
- Private scratch folder:
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc584-r1-implementer/
  (create it). Gate logs go in the ledger dir as sc584-r1-gate-<name>.log.
- Never `rm -rf` anything under the shared `.superpowers/` dir.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If
  you ever do send a message anyway, its FIRST WORD must be `SC-584:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/sc584-r1-impl-report.md,
opening with an executive summary of at most 10 lines. Sections: case-1 probe findings (known body, race), design as
built, commits (sha + one line each), gate numbers (each gate's own summary line + lifecycle part wall times),
red-on-base evidence, mutation results, `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, dse HEAD sha, superproject
branch HEAD sha, `git status --porcelain` for both, each gate's summary line, and the absolute path of every evidence
artifact (report, gate logs, red-on-base logs, proposal).
