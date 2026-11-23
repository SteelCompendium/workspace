# SC-641 r4 — scoped re-review of the r3 delta, then final gates (lifecycle + full e2e)

You are a fresh identity: first a scoped re-review of a small docs/comments delta, then the two
required landing gates for SC-641 on the final sha. You change NO source. This
brief is self-contained; a replacement worker must be able to start from it.

## 0. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/decisions.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Plugin clone: `/home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest/draw-steel-elements`,
  branch `sc641-negotiation-missing-interest`, expected HEAD **7ca7c140** (base `3b47e55b`).
  First: `git -C <plugin> rev-parse --short HEAD` must print that sha and
  `git -C <plugin> status --short` must be empty. If either is off, stop and report. Do not rebase.
  `node_modules` is installed.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — 480 KB,
  do NOT read it whole. Read the battery table rows 4 and 4b (lines 26-34; row 4 lists the SEVEN
  `--only` lifecycle parts — take the exact scenario ids for each part from it), "Devbox wrapping",
  "Lifecycle and e2e notes (SC-480…)", and "THE exit-code footgun".

## 1a. Scoped re-review of the r3 delta (do this FIRST; you did not write it)

Review ONLY `git -C <plugin> diff 227dfc3d..7ca7c140` and the superproject CHANGELOG diff
`git -C /home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest diff 35983b18..38eb1759 -- CHANGELOG.md`.
Not a fresh full pass: `227dfc3d` was independently reviewed and approved
(`sc641-r2-reviewer-report.md`; the owner's rulings on its findings are in the ledger).
Check, and report PASS/FAIL per line:

- The delta touches no runtime behaviour: in `src/` only comments changed (if any).
- LOW-1: `e2e/README.md` row for `Negotiation/minimal.md` says it opens live, not over, with no
  chips because it has no motivations or pitfalls.
- LOW-2 + INFO-1: the CHANGELOG bullet says "no `initial_interest` and no `current_interest`",
  carries "(SC-641)" once, and contains the sentence "a note saved before this change with no
  Interest key at all reads as Interest 2 now, even if that negotiation had been played down to
  Interest 0". It sits under `## Unreleased`.
- INFO-2: the header of `test/dom/elements/negotiation-bugs.test.ts` no longer points at
  `knownBug` twins for SC-641.
- INFO-4: `docs/negotiation-tracker.md` no longer claims Reset always clears the banner; it is true
  for a block whose own `initial_*` values are an ended state (Interest 0 or 5, or Patience 0).
- Any other change in the delta: list it and say whether it is correct.
- `npm run tsc`, `npm run lint` clean; `npx jest` = **13861 passed / 2 skipped / 0 failed**.

If any line FAILS on substance, still run the gates below (the delta is docs/comments) and report it.

## 1. Gates and expected numbers

1. `npm run build` (so real Obsidian loads this sha's `main.js`), if the skill's lifecycle/e2e
   notes say the gates do not build themselves.
2. **Lifecycle** — `npm run obsidian-lifecycle`, as the seven `--only` parts from the skill, one
   blocking foreground call per part. Expected union: `64/64 ok, 0 failed`. Known load flake:
   `G-S61` on its torn-read line (SC-668), red the same way on base — if it is the ONLY failure,
   re-run that part once, report both results, and do not investigate further.
3. **Full e2e** — `npm run e2e` (split per the skill if it will not fit one 600 s call; if split,
   the coverage gate needs the form the skill names for a full run). Expected:
   `OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`
   (base `658/667 … 9 known-bug`; SC-641 flips NEGO-W06 and NEGO-W07 from known-bug to ok and adds
   no e2e test or pair). Known flakes on base: INIT-W10, SET-X03, SET-X04 (SC-654 / SC-657) — if the
   only failures are among those, re-run once and report both runs.

Any other failure: do NOT fix anything. Report the failing id, its `FAIL:` line and the log path.

## 2. Footguns (all apply)

- Scratch: only `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc641-r4-gates/`
  (create it), uniquely named scripts and logs, written with the Write tool. No `rm` with a glob or
  shell variable; use fresh file names.
- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; record exit codes from a script
  FILE; read each gate's own summary line; never pipe a gate through `tail`.
- Each part is ONE blocking foreground call with output redirected to a log (the 600 s stream
  watchdog kills silent agents). No `run_in_background`, no Monitor, no waiting on a notice. Never
  key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own
  output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside this
  worktree. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or
  `.superpowers/`. Other efforts are running the same gates right now.
- Every git command is `git -C <absolute path> …`. The main checkout
  `/home/scott/code/steelCompendium/workspace` is shared state: write nothing there but your report.
- Leave the worktree clean: `git -C <plugin> status --short` empty at the end (report it).
- NEVER create a git tag or release. Do not push.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
  completion notification and will resume you with the answer. If you ever do send a message anyway,
  its FIRST WORD must be your ticket key (`SC-641:`).

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/sc641-r4-rereview-final-gates-report.md`,
opening with a <=10-line executive summary. If the report-file write is blocked by your harness,
return the report inline.

## 4. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS, sha tested,
lifecycle count per part and the union, the verbatim `OBSIDIAN-E2E done:` line(s) with rc, any
failing ids with their FAIL lines, re-run results, final `git status --short`, and the filesystem
path of every log.
