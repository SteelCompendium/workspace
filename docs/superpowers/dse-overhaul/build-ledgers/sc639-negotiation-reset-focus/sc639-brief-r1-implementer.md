# SC-639 r1 implementer brief — Negotiation: Reset drops keyboard focus to the page

## 1. Context loading (read first)

- Ledger (current state, rulings, scope fence): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/decisions.md`. Read it whole.
- Closest precedent, SC-642 (Complete Argument keeps focus), landed: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc642-negotiation-complete-focus-ledger.md` and its dir `.../build-ledgers/sc642-negotiation-complete-focus/` (read the report executive summaries: `sc642-r1-implementer-report.md`, `sc642-r3-implementer-report.md`). Also SC-626 (montage) and SC-648 (menu placement) ledgers in the same dir, summaries only.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus`. Plugin: `/home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus/draw-steel-elements`, branch `sc639-negotiation-reset-focus`, at dse develop `e1be1775`. Verify `pwd`/branch before any write. Use `git -C <absolute path>` for every git command; never `cd X; git ...`.
- Fetch first: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `e1be1775`. If it moved, do NOT rebase; note it in your report.
- **You never call the tracker (Linear)** — not to read, not to post. The ledger is your context.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 480 KB: read in parts — "The battery, in order", "Devbox wrapping", "Stale main.js", "Jest timeouts", "Lifecycle and e2e notes", and the CURRENT entry under "Current expected numbers"). Note especially the bullet about self-disabling buttons / mouse presses moving no focus / negotiation LP tab memory.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: expected, not yours, ignore it. You never write in `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.

## 2. The task

Ticket requirement, verbatim from the ledger:

> **What happens:** focus the negotiation's options button, open the menu and choose Reset. After the reset,
> keyboard focus is on the page, not on the card: the next Tab starts from the top of the note.
>
> Confirmed in real Obsidian in both Reading view and Live Preview.
>
> **Expected:** focus returns to the options button (or another control on the same card).

Owner rulings (verbatim from the ledger):

> after Reset, focus goes to the NEW card's options button. Fallback only if that button is absent (SC-641 may hide
> Reset, not the button; still guard it): the card root / the first focusable control of the card, via the kit
> helper's fallback chain.

> focus is moved only when it was inside the card before the action (here: on the options button when the menu
> opened, or inside the card). A Reset with focus elsewhere never pulls focus in.

> Change WHERE focus goes after Reset, not WHAT Reset does ... Do not touch `src/model/NegotiationData.ts`. Stay out
> of SC-649's files (power roll counts, chosen-motivation matching ...). Reuse `src/framework/kit/controlFocus.ts`.

Surface: `src/elements/negotiation/view.ts` (menu built around line 150-165, `resetNegotiation` at ~189, which
calls `update()` and rebuilds the card). Note: when the menu opens, Obsidian's `Menu` takes focus; by the time the
Reset item's onClick runs, `document.activeElement` is likely the menu item, not ⋮. So "focus was inside the card"
must be captured when the menu OPENS (was ⋮ / the card focused at open time?), not at Reset time. Decide and document.

Do:
1. Reproduce first (jsdom `K05` in `test/dom/elements/negotiation-bugs.test.ts` is `test.failing`; e2e `NEGO-F01` in
   `e2e/specs/negotiation/focus.e2e.ts` and `NEGO-L03` in `e2e/specs/negotiation/live-preview.e2e.ts` are
   `knownBug('SC-639')`). Record the mechanism in real Obsidian (RV and LP): when exactly focus leaves, where it goes.
2. Fix so focus lands on the rebuilt card's options button in Reading view AND Live Preview (in LP, the SC-602 carry
   `src/framework/host/livePreviewFocusCarry.ts` should hand it on once focus is on the new button before the old copy
   is removed — verify, don't assume). Reset on an untouched negotiation writes nothing (NEGO-R04 stays green):
   check focus there too.
3. Flip K05, NEGO-F01, NEGO-L03 to plain tests (remove `test.failing` / `knownBug`). Add tests: Enter-opened and
   Space-opened Reset (RV), LP Reset, focus-outside-the-card case (no focus pulled in), untouched-Reset case. Never put
   a bracketed ticket id in a test title (the e2e runner reads titles for scenario ids; scenario ids are global —
   grep before choosing a new NEGO-* id).
4. Mouse path: report what a mouse-chosen Reset does to focus before and after your change (focus on body before is
   expected; the click shield means a mouse press on ⋮ moves no focus). Do not add special mouse handling beyond the
   "only when focus was inside the card" rule; the owner rules after r1.
5. Commit after each coherent step in the plugin repo (conventional commits, `fix(SC-639): ...`, `test(SC-639): ...`).
   Commit messages: NO co-author trailers, NO Claude/AI attribution. **Do not commit anything in the superproject in
   this round** (no pointer bump, no CHANGELOG) — that happens once in the final round.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and unable to move a gate baseline;
list them under `Drive-by fixes:`. Everything else under `Follow-ups:` (left alone).

## 3. Gates (full battery, per dse-verify, in order)

Fresh worktree: run `npm ci` once first (`devbox run -c <plugin abs path> -- bash <script>` with output to a log).
`rm -f main.js styles.css` in the plugin root before `npx jest`.

Expected at baseline e1be1775 (your deltas must be explained test-by-test):
- tsc (incl. `tsc -p e2e`) and lint clean
- jest **13327 passed / 2 skipped** fresh (+ your new tests; K05 flips from failing-expected to pass)
- lifecycle **64/64**, run in SEVEN parts with `--only=` (EQUALS SIGN — with a space the runner runs the whole suite;
  check the log's first lines print only that part's ids). Comma-separated ids:
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4)
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3)
  One part per Bash call, output to a log. Part 7 takes ~200 s, over the 180 s tool limit: the tool backgrounds it;
  poll YOUR node pid (`/proc/<pid>/cwd` must be your worktree) with `timeout 175 tail --pid=<pid> -f /dev/null`, then
  read the log. G-S56 stays LAST in SCENARIOS order. You should not need a new lifecycle scenario; if you do, use
  G-S139.
- e2e: **`OBSIDIAN-E2E done: 596/611 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`** at baseline. Expect
  known-bug 15 → 13 (F01, L03 flip) and ok/total up by your new tests; coverage must end Y/Y.
- shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze **280/280**; parity **0/0/24**.
  If `styles.css` is byte-identical to a clean e1be1775 build, say so (shots/freeze/parity carry) — but still run
  shots + freeze if you changed any rendering code.

Known flakes (re-run once before calling them real):
- G-S91 FAIL is real unless it says the host was too slow after two re-runs.
- G-S115 (g) suspected flake (SC-633): re-run part 7 once on a loaded host; any other failure is real.
- e2e INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657) each flaked once under load.
- SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty, which made G-S97 fail —
  `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change.
- Jest default timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise.

## 4. Operational footguns (each cost real time once)

- Devbox: `devbox run -c <plugin abs path> -- bash <script-file>`; never `cd` inside a compound command; devbox eats
  `$?`/`$PIPESTATUS` and piping a gate (`| tail`) eats failures — record exit codes inside a script file and read
  each gate's summary line.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r1-<yourAgentId>/`
  with uniquely named scripts and logs. Write scratch files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers hung on a permission
  prompt doing that). Leave throwaway files in place. Overwrite with `>` instead. No `rm` with a variable target
  anywhere. (`rm -f main.js styles.css` in the plugin root with literal names, via a script file, is fine.)
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree. Other efforts
  (SC-649, SC-631) run the same gates concurrently.
- Never `rm -rf` a shared `/tmp` glob (e.g. lifecycle vaults) or the shared `.superpowers/` dir.
- Run each gate as one blocking foreground call (split to stay under the tool timeout). No background jobs or
  Monitors you then wait on for a notification — it never comes. If a call is moved to the background by the tool,
  poll the gate's own process/log.
- Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question in your report. If you ever send a message anyway, its FIRST WORD must be `SC-639:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/sc639-r1-implementer-report.md`.
If the write is blocked by your harness, return the report inline. It must OPEN with a ≤10-line executive summary.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Include: STATUS (DONE / NEEDS_CONTEXT /
BLOCKED); plugin branch head sha and the commit list; the mechanism (RV + LP, measured); where focus lands and the
fallback chain; mouse-path finding; every gate's measured number vs expected, with flake re-runs noted; marker delta;
`Drive-by fixes:`; `Follow-ups:`; and the absolute filesystem path of every evidence artifact (report, gate logs).
