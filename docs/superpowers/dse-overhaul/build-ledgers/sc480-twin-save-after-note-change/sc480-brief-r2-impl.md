# SC-480 r2 — implement option E (implementer)

You are the r2 implementer for ticket SC-480 (draw-steel-elements, "DSE"). Your final text goes to the
ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose. **Workers never call the
tracker** (Linear) — not to read history, not to post. This brief is self-contained and replacement-ready.

## 1. Context to load (files, not conversation)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/
- decisions.md — read all of it. The "Owner rulings on r1" section is your spec.
- sc480-r1-survey-report.md — read the executive summary, Q2 (write-path map), Q3 E row + "E implementation notes",
  Q4. The prototype is sc480-r1-proto-E.patch (start from it; it is a prototype, not final code).
- The r1 probe harness (a ready template for your lifecycle scenario) is in
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r1-reviewer/
  (p480-fixtures.mjs, p480-scenarios.mjs, inject.mjs). Read-only; do not write there.
- Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md — the battery, devbox
  wrapping, THE exit-code footgun, "Block edit form Save and embeds (SC-556)", "Current expected numbers" CURRENT.
- Repo rules: /home/scott/code/steelCompendium/workspace/AGENTS.md and draw-steel-elements/AGENTS.md (tests ship with
  code; commit conventions).

Worktree: /home/scott/code/steelCompendium/worktrees/sc480-twin-save-after-note-change (branch
sc480-twin-save-after-note-change in every submodule). DSE: .../sc480-twin-save-after-note-change/draw-steel-elements,
HEAD f69b8fd6. First: `git -C <dse path> fetch origin`; if origin/develop moved past f69b8fd6, rebase onto it and
report the new base. Verify every write is inside the worktree; never edit the main checkout
/home/scott/code/steelCompendium/workspace (except your report files in the ledger dir). The main checkout's dse
vault dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's and expected — ignore it.
`node_modules/` already exists in the dse worktree (r1 ran `npm ci`).

## 2. The task
Binding rulings, quoted verbatim from the ledger:
- SC-556, Scott: "Save nothing with a notice is fine." — a block edit form's Save never writes into a different
  identical block. Must stay true (form Saves remain `pinOnly`).
- Owner ruling (2026-11-10): "take option E" — "a card write whose pin misses falls back to today's placement only
  when the body is unique in the note as clicked (pin.text) AND now; else 'miss' -> existing dropped-write Notice."
- "Notice: the existing text, no new string (`droppedWriteMessage`); card Notices keep the 5 s per-note rate limit
  (unchanged)."
- "Unpinned card writes (pinPosition null at the round's first click; 0/1041 observed): keep today's path (no E
  test) — cost unmeasured. r2 implementer PROBES one real case (two identical counters inside ONE callout, click one
  in RV and LP; is the pin null? where does the write land after a deletion of it?) and reports; owner then files or
  drops."
- "Fold S1's implementation notes: counts only when pinnedTarget returned null; rewrite the two reading-mode-host-pin
  tests that encode the twin fallback into refusal tests; add host tests (deleted twin above/below -> miss + Notice;
  twin-free long >400 edits -> lands; twin long -> refused; no-pin card write -> today's path; twin present in
  pin.text but not now (k=2 deletion) -> refused); G-S73 lifecycle scenario (deleted twin RV+LP, above+below; plus a
  race control that must land)."
- "CHANGELOGs: superproject CHANGELOG.md Unreleased bullet + dse CHANGELOG.md Unreleased bullet (SC-556 F4
  precedent). dse-verify text as a proposal file in the ledger."

Deliverables:
1. `src/framework/host/ReadingModeBlockHost.ts`: option E (a `countByBody` helper beside `locateByBody`, reusing the
   same fence scope; the twin check evaluated only on a pin miss for a card write). Code comment citing SC-480 and
   the rule in one sentence.
2. Jest: the tests listed above, red on f69b8fd6 where they assert new behaviour (show it: run the new tests against
   the unpatched source once and keep the log). Mutation sanity: at least (m1) drop the `pin.text` count, (m2) drop
   the `now` count, (m3) apply the check to form Saves too / to unpinned writes — each must turn a test red.
3. Lifecycle G-S73 in `visual-harness/obsidian-lifecycle.mjs`: deleted twin (twin above and below, RV and LP,
   2 identical blocks) -> nothing written, exactly one Notice per trial (mind the 5 s per-note card Notice rate
   limit: separate notes or >5 s apart, see dse-verify SC-556 footguns); a twin-free deletion -> one Notice; a race
   control (block moves, then leave) -> lands in the clicked block. Must FAIL on an f69b8fd6 bundle (show the log)
   and pass on yours. Placement: G-S56 stays LAST in the SCENARIOS list; insert G-S73 before it. Run it in the FIFTH
   `--only` part (`G-S59 G-S49 G-S73`) unless that part would exceed ~9 minutes — then say where you put it. The
   lifecycle header / scenario count goes 52 -> 53.
4. CHANGELOG bullets (user-facing, plain words: deleting one of two identical blocks right after clicking it no
   longer sends the click into the other one; a Notice shows instead). dse CHANGELOG in its existing format;
   superproject /…/worktrees/sc480-twin-save-after-note-change/CHANGELOG.md under `## Unreleased`. Do not claim the
   unpinned path.
5. dse-verify proposal: sc480-dse-verify-proposal.md in the ledger dir — the CURRENT block text with your numbers,
   the lifecycle row/part change for G-S73, and a one-line footgun if you hit one. Do NOT edit dse-verify SKILL.md.
6. The callout probe (ruling above): report pin null or not, RV and LP, and where a deleted-callout-twin write lands
   with your build. No code change for it.

Commits: in the dse worktree on branch sc480-twin-save-after-note-change (red tests may be their own commit; code +
tests; lifecycle; docs). Superproject: commit only CHANGELOG.md on the worktree branch (do not commit a dse pointer
bump — the dispatcher does that at landing). No pushes. No tags, ever.

## 3. Gates — full battery per dse-verify, in order. Expected (baseline f69b8fd6):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest 6634 passed / 2 skipped / 258 of 259 suites + your new tests (fresh worktree; SC-568 load timeouts possible —
  re-run those suites alone and report).
- lifecycle 53/53 in five `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4);
  `G-S59 G-S49 G-S73` (3).
- e2e `OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs`.
- styles.css: no CSS change expected — compare `styles.css` sha256 against a clean f69b8fd6 build (`4295ca33…`). If
  identical, shots 592 / host-leak 163/978 / capture clip 147, freeze 280/280 and parity 0/0/24 carry and you skip
  them (say so). If it differs, STOP and return NEEDS_CONTEXT.

## 4. Footguns (all binding)
- No compound `cd`. Use `git -C <abs path>` and `devbox run -c <abs dse path> -- …`. For multi-command shells, write a
  script file in your scratch folder and run `devbox run -c <abs dse path> -- bash <script>`; record exit codes
  inside the script (`bash -c '…; echo rc=$?'` under devbox always records 0).
- Never `rm` with a variable target; never a glob `rm` under /tmp. Overwrite with `>` or use fresh file names.
- One gate per Bash call, in the FOREGROUND. No background gates, no Monitor (a job you start does not wake you).
  Lifecycle runs as five separate calls (one per `--only` part). Redirect long output to a log file rather than
  streaming it (the 600 s stream watchdog kills silent agents).
- Never set DSE_LIFECYCLE_PORT. If you run shots at all, give the run a private DSE_CAMERA_TMP in your scratch folder.
- Kill scratch processes by literal PID only (no pkill/killall by name — SC-436 and SC-437 run Obsidian concurrently).
- Private scratch folder:
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r2-implementer/
  (create it). Gate logs go in the ledger dir as sc480-r2-gate-<name>.log.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If
  you ever do send a message anyway, its FIRST WORD must be `SC-480:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc480-twin-save-after-note-change/sc480-r2-impl-report.md,
opening with an executive summary of at most 10 lines. Sections: commits (sha + one line each), gate numbers
(each gate's own summary line), red-on-base evidence, mutation results, callout probe, `Drive-by fixes:` and
`Follow-ups:` lists.

## 6. Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, dse HEAD sha, superproject
branch HEAD sha, `git status --porcelain` for both, each gate's summary line, and the absolute path of every evidence
artifact (report, gate logs, red-on-base logs, proposal).
