# SC-690 r2 — independent review brief: "Remove a hero" on the montage test tracker

You are an independent adversarial reviewer for ticket SC-690. You did not write this code.
Your final text goes to the ticket-owner (an agent), not a human. **You never call the tracker
(Linear)** — not to read, not to post. You fix nothing: findings only.

## 1. Context loading

1. Decisions ledger (the whole spec: Scott's ticket text verbatim plus owner calls O1–O5):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-decisions.md`
2. The implementer's report — read its executive summary first, body where you need it:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r1-impl-report.md`
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero`; plugin repo
   `…/draw-steel-elements`, branch `sc690-montage-remove-hero`, head `43574bfe`, base
   `develop` @ `aee83dc1`. Superproject branch `sc690-montage-remove-hero`, head `0c6aec5f`.
   The diff under review:
   `git -C /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements diff aee83dc1..43574bfe`
   and the superproject's doc commit(s) on its branch vs `origin/main`.
   **Do not edit or commit in the worktree.** Probe scripts live in your private scratch folder.
   Every git command is `git -C <absolute path>`. The main checkout
   (`/home/scott/code/steelCompendium/workspace/`) is shared global state — never write there
   except your report file; its `draw-steel-elements` dirt is Scott's live vault, expected.
4. Gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` is
   very large — **do NOT read it whole**. Lines 1–266 (battery, devbox, exit codes) and 1551–1554
   (CURRENT numbers); grep for the rest.

## 2. The task

Scott's ticket, verbatim (2026-11-23):

Title: "to add a way to remove a Hero in montage test"

> request from an rc user.

The design is the ledger's owner calls O1–O5. Review the implementation against them; also say
plainly if you think one of the owner calls itself is wrong for a Director at the table (as an
INFO finding with your reasoning — the owner decides, and Scott is asked).

**Execute and probe — do not just read.** Questions to answer with evidence:

1. **This feature deletes from the user's note. File integrity first.** In real Obsidian (the e2e
   harness) and/or against serialized text, with your own notes, not only the implementer's:
   - text above and below the block survives byte-for-byte; a second montage block in the same
     note (and an identical twin block) is untouched;
   - unknown keys, comments, key order, quoting style and hand-written oddities in the block
     survive (`e2e/vaults/shipped/Montage/unknown-keys.md`, `hand-written.md`, `quoted-*.md`,
     `wrong-*.md`);
   - bare / malformed items in `participants:` and a non-list `participants:` value survive;
   - a hero whose name needs YAML quoting (`"Kira: the Bold"`, a name with `#`, leading/trailing
     spaces, a number-like name `7`, an emoji, a 60-character name);
   - hand-written duplicate names (ledger O3): remove one of two "Kira" rows;
   - entries whose `hero` differs from the roster name only by case or spaces — does the removal
     take exactly the entries the board showed in that row, no more and no fewer?
   - entries with an unknown `result` (a Director typo) — does the tally move correctly?
   - the old-shape fixture (`src/elements/montage/fixture-old-shape.yaml`: tallies with no
     `entries`) — removal must not invent or zero tallies;
   - a typed `successes: "1"` stays as typed when the removed hero contributed nothing (SC-628);
   - remove the last hero: the note's `participants:` shape, and the block still renders and can
     take "Add a hero" afterwards; remove then re-add the same name gives a clean hero;
   - remove a hero twice quickly / an outside edit removes or renames the picked hero while the
     window is open / the note is edited by another pane mid-window (SC-627, SC-650 patterns).
2. **Tally and state.** Totals drop by exactly the removed hero's contribution. A montage complete
   by success limit, by failure limit, and by rounds: what state is it in after the removal, and is
   every bar control (Log an action, End round, Undo, Back, Reopen, Clear all) right for that
   state? Does Undo afterwards remove a sensible entry? `current_round`, `rounds` and both limits
   do not move (limits by hero count is SC-691 — out of scope, must not have crept in).
3. **Focus and keyboard.** Open the item by mouse and by keyboard; where is focus when the window
   opens, after Cancel, after Escape, after Remove (the removed row's controls are gone)? Is it a
   defined, visible control every time, never `document.body`? Enter inside the window with nothing
   picked does nothing; Enter cannot remove a hero the user did not pick.
4. **Read-only and edge hosts.** The item is absent on a read-only host; an empty roster; an embed;
   the pinned sidebar panel copy of a montage; two panes on the same note.
5. **The window.** A 40+ character name, 12 heroes (scrolling, footer reachable), the picked state
   readable without colour (Scott is colorblind — hue must not be the only signal), the consequence
   line right for 0, 1 and several logged actions (singular/plural), screen-reader names on every
   control.
6. **Tests.** Honest or vacuous? Mutate in a scratch clone (`git worktree add` into your scratch
   folder — never mutate the branch): make the removal skip the entries, skip the tally delta,
   remove the wrong roster index, drop the duplicate-name guard — does a test fail each time? Do the
   e2e specs read the note ON DISK? Is the coverage manifest complete for every new control x
   gesture, with no pair claimed by a scenario that does not perform it?
7. **Docs and comments** say what the code does (`docs/gm-trackers.md`, both changelogs, focus-rule
   comments, the ⋯ menu comment in `view.ts`); nothing historical rewritten into a falsehood.
8. **Evidence audit.** Open the implementer's PNGs in
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/evidence/`.
   Do they show what their names claim? Regenerate the picked-hero window capture yourself and
   compare. Report anything a human reviewer would stumble on (clipping, odd wording, alignment).

## 3. Gates to re-run yourself

tsc + lint + full jest (expected: the implementer's reported total; baseline before this ticket
was **14439 passed / 1 skipped**), the montage e2e specs, and a full e2e run (expected: the
implementer's reported line; baseline `OBSIDIAN-E2E done: 794/805 ok, 0 failed, 11 known-bug,
coverage: 476/476 pairs`). Freeze: the diff touches a view and possibly CSS, so confirm
`280/280, 0 FAILED` yourself (shots + freeze) unless the diff has no CSS and no board/print DOM
change — say which. Lifecycle and parity: confirm from the implementer's logs; re-run only if the
diff gives a reason.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r2-review-report.md`,
opening with a **≤10-line executive summary** (verdict: LAND-READY / FIX-REQUIRED, finding
counts by severity, gate numbers). Findings by severity (CRITICAL/HIGH/MED/LOW/INFO), each with
file:line, a concrete failure scenario, and a prescribed fix. If the report-file write is
blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: verdict, findings
list (severity, file:line, one line each), measured gate summary lines, probe results,
and **the absolute path of every artifact you produced** (report, logs, PNGs).

## 6. Footguns

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-690:`.
- **Devbox**: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 —
  record exit codes inside a script FILE and read each gate's own summary line. Never pipe a gate.
- **Scratch**: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-review-r2/`,
  uniquely named scripts and logs, created with the Write tool (no heredocs).
- **Run each gate as one blocking foreground call**, output redirected to a log file (the 600 s
  stream watchdog kills silent agents; split e2e per the skill to fit the tool timeout). No
  `run_in_background`, no Monitor; if something must run in the background, poll its own log /
  exit-code file, never wait for a notice.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- **No `rm` with a variable or glob target.** Never `rm -rf` a shared `/tmp` glob
  (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort); never touch
  `.superpowers/` outside `sc690-montage-remove-hero/`.
- **Never `pkill`/`killall` by pattern** — only a PID whose `readlink /proc/<pid>/cwd` is inside
  your worktree (concurrent efforts run the same gates in other worktrees).
- The worktree already has `node_modules` (the implementer ran `npm ci`). Gate runs rebuild
  `main.js`/`styles.css`/harness `dist` in the worktree — that is expected build output, not a
  code edit; leave `git status` as you found it (report any tracked-file dirt you caused).
