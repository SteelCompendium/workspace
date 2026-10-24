# SC-501 r1 brief — survey: identify and judge the 10 new gallery host-leak exemptions

You are an `orchestration:reviewer` worker (survey round). Your final text goes to the SC-501
ticket-owner, not a human.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-decisions.md`
  (the ledger — current state of this effort).
- Background (read only what you need): SC-356 ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc356-hostleak-modal-buttons-ledger.md`
  (and its dir `sc356-hostleak-modal-buttons/`), SC-497 ledger
  `.../build-ledgers/sc497-obsidian-115-pin-ledger.md`; the dse-verify skill
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — its
  "Button host-leak sweep" bullet (~line 197) and the CURRENT block (~line 1235+).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements`,
  branch `sc501-hostleak-exemptions`, at dse `develop` `c98bd82`. Verify with
  `git -C <that path> log --oneline -1` before anything. Run `git -C <that path> fetch origin`
  and report if `origin/develop` has moved past `c98bd82` (do not rebase; just report).
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state — never
  write there except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, not foreign changes; leave it alone.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

Ticket text (verbatim): "`dse-verify` says to treat a new unexplained exemption as a real red.
Each skipped record is a button the sweep does not check. **Task:** find which landing added
the 10 records, and decide for each one whether skipping it is correct (for example, a button
that is genuinely zero-sized) or hides a button that should be swept."

Dispatcher constraint (verbatim): "Harness-only: visual-harness/shoot.mjs. Expected outcome is
either a documented explanation of each of the 10 new exempt records … or a fix that removes
illegitimate exemptions — never widen exemptions silently."

Numbers to explain. The gallery pass of `assertBtnHostLeak` in `visual-harness/shoot.mjs`:
- dse `ea56712` (SC-356 land, 2026-10-22): 112 kinds / 672 comparisons, 10-record boundary —
  8× focus-visible disabled, 2× hover no hit point.
- dse `d152ea4` and later (current `c98bd82`): 113 kinds / 678 comparisons, 20-record boundary —
  10× focus-visible disabled, 6× hover "renders a zero-sized box", 2× hover no hit point,
  2× focus-visible "renders no box at all".
- Ticket suspects SC-279's roll strip. Bisect range: `ea56712..d152ea4` on develop.

Steps:
1. **Per-record identity.** The printed boundary aggregates by reason only
   (`btnExemptionBoundary`, shoot.mjs ~2715; accounting in `sweepTaggedButtons` ~2641).
   Produce a list of every exempt record — kind key / class list / fixture or section it lives
   in / state / scheme / reason — at `c98bd82`. You may add temporary instrumentation (e.g. an
   env-gated per-record dump) to the worktree's `shoot.mjs`, but **do not commit it**; revert
   it with `git -C <path> checkout -- visual-harness/shoot.mjs` before you finish, and say in
   your report whether a permanent per-record listing in the boundary print would be worth
   adding (that is a decision for me, not you).
2. **Attribution.** Identify which landing(s) in `ea56712..d152ea4` added each new record and
   the +1 kind. Prefer reasoning from `git log`/diffs of fixtures, `visual-harness/entry.ts`,
   gallery DOM and component source; run a second shots pass on an older commit only if that
   is the only way to be sure — if you do, use a separate `git worktree add` at an absolute
   path under your private scratch folder (never re-point or reset the sc501 worktree), and
   record that path. You may only remove that extra worktree with `git worktree remove <literal
   absolute path>`.
3. **Judgment per new record.** For each: is the exemption legitimate (e.g. a button that is
   genuinely zero-sized at rest in this fixture by design, genuinely `disabled`, genuinely in a
   `display:none` ancestor that the product never reveals in this gallery state), or does it
   hide a button that a user can reach in that state and the sweep should cover (e.g. the
   gallery mounts it collapsed/hidden but the product shows it; a hover-only reveal; a fixture
   gap)? For an illegitimate one, prescribe the fix in the harness (mount the revealing state
   / add a fixture variant / drive the reveal) — the SC-205 doctrine at shoot.mjs ~2253 is
   "MOUNT THE CHROME, don't exempt it". Do not implement the fix in this round.
   Also confirm the 8 → 10 focus-visible-disabled growth and say whether the 2 old hover
   no-hit-point records are the same 2 as at SC-356.
4. Also note anything you see about SC-498 (stamina-bar keyboard focus, landing soon) that
   would change these records.

## 3. Gates

This is a survey; no gate must pass. If you run shots, the expected in-run line at `c98bd82` is
`button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)` with the 20-record
boundary above, plus the expected `OBSIDIAN APP.CSS PIN DRIFT` warning (rc stays 0, SC-376).
Shots: 592 PNGs, 0 FAIL. Run shots via the dse-verify command shape.

Command-shape rules (each one has hung or broken a worker before):
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command. Use `git -C <absolute path>` for every git command.
- Run each gate as **one blocking foreground Bash call** (timeout 600000), output redirected to
  a log file, not streamed. **No `run_in_background`, no Monitor, no background jobs.**
- Record exit codes from a script file run through devbox
  (`devbox run -c <path> -- bash <script>`), never `bash -c '…; echo rc=$?'`.
- Scratch: make a private folder `<scratchpad>/sc501-r1-<your agentId>/` (scratchpad =
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`).
  Write scripts there with the Write tool, uniquely named. Never use a generic name like `gate.sh`.
- **No `rm` with a shell-variable target and no glob `rm`.** Overwrite with `>` or use fresh
  unique filenames. Never `rm -rf` anything under `/tmp` by pattern, never touch `.superpowers/`
  beyond your report file.
- Never `pkill`/`killall` by pattern. Kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is
  inside YOUR worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-r1-survey-report.md`.
It must open with a ≤10-line executive summary. Then: the full per-record table (all 20 records),
attribution per new record (landing sha + ticket), verdict per new record (LEGITIMATE / HIDES A
BUTTON) with the evidence (file:line, measured box sizes, DOM path), prescribed fixes for any
illegitimate one, and a proposed replacement for the dse-verify "Button host-leak sweep" boundary
sentence. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts — verdict counts, shas, measured numbers, no prose — plus the absolute path
of every evidence artifact you produced (report, logs, dumps, any extra worktree). Confirm the
sc501 worktree is back to clean (`git -C <path> status --short` output).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes
to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT
and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-501:`.
