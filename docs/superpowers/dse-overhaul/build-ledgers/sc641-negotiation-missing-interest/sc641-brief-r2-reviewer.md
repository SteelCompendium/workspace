# SC-641 r2 — independent reviewer brief

You are the independent, adversarial reviewer for SC-641 (draw-steel-elements plugin,
`ds-negotiation`). You did not write this code. **Execute and probe, do not just read.** This brief
is self-contained; a replacement worker must be able to start from it and the files it names.

## 0. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/decisions.md` (short; read fully).
- Implementer brief and report, same dir: `sc641-brief-r1-implementer.md`,
  `sc641-r1-implementer-report.md` (read the report's executive summary; body as needed).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest`;
  plugin clone `<worktree>/draw-steel-elements`, branch `sc641-negotiation-missing-interest`.
  Base = `3b47e55b` (`origin/develop`). Review head = **227dfc3d**. The diff is
  `git -C <plugin> diff 3b47e55b..227dfc3d`. `node_modules` is installed. Do not rebase.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — 480 KB,
  do NOT read it whole: lines 20-36 (battery table) and the headings "Devbox wrapping", "Stale
  `main.js` shadows", "Jest timeouts under load", "THE exit-code footgun".

## 1. What was ruled

Scott, verbatim (2026-11-22):

> * interest default: 2
> * Reset to the defaults

These answer the options as offered to him:

> **a. Interest 2 (my pick).** That is the rulebook's starting Interest for a Neutral NPC (Neutral is
> Interest 2, Patience 3). Patience left out stays at 5, as today.

> **a. Reset to the defaults from Q1 (my pick).** With Q1 a, that is Interest 2 / Patience 5, so Reset
> always lands on a live negotiation. Nothing new is written into the note. The cost: a block that
> started at Interest 3 / Patience 2 resets to 2 / 5, not to where it started.

Owner ruling: an AUTHORED `initial_interest: 0` / `current_interest: 0` stays honoured as written —
not a finding.

## 2. Review task

Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure
scenario, and a prescribed fix. Cover at least:

1. **Correctness of the default change.** Every consumer of the Interest default: model, card view,
   pinned sidebar, block edit form (SC-556), insert templates / `ds-suggest` hints, print, anything
   that restates "0". Any place that still treats a missing Interest as 0?
2. **Write integrity (this code writes into user notes) — probe at byte level, in jsdom and in real
   Obsidian (targeted e2e or your own probe spec):**
   - name-only block: opens at Interest 2 / Patience 5, live. First unrelated write (e.g. spend
     Patience, toggle a chip) writes no interest key.
   - name-only block driven to Interest 0: `current_interest: 0` IS written, and the reopened note
     reads 0 (ended), not 2. Same check for driving it 2 -> 3 -> 2 (reads 2 either way).
   - a note saved under the OLD default (e.g. `name: x` + `current_patience: 4`, interest key absent)
     now reads Interest 2: confirm, and report it as a fact, not a finding.
   - Reset on name-only and on current-only blocks: no `initial_*` key added; exact bytes after.
   - content above and below the block survives; two negotiation blocks in one note do not
     cross-talk on Reset; a hand-edited key order / comment / unknown key survives Reset; a block the
     user deleted and retyped renders cleanly.
   - mixed declarations: `initial_interest` only, `initial_patience` only, `current_*` + one
     `initial_*`; string/float/junk Interest values (SC-638 rules) still behave as on base.
3. **The flipped markers are not vacuous.** Run `[K08]`, `[K09]`, NEGO-W06, NEGO-W07 against BASE
   source (stash/scratch copy the test files onto a `3b47e55b` checkout made with
   `git worktree add <absolute scratch path> 3b47e55b` from the plugin clone, or revert only
   `NegotiationData.ts` in a scratch copy) and confirm they FAIL there; confirm the new tests fail
   there too. Never edit the review branch.
4. **Docs truth.** `docs/negotiation-tracker.md`, `e2e/README.md`, `focusRules.ts` comment,
   `.repo-docs/`, and the CHANGELOG bullet in
   `/home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest/CHANGELOG.md`
   say what the code does.
5. **Gates, re-measured by you:** tsc, lint, jest (base fresh 13855 passed / 2 skipped; expect the
   implementer's stated total), targeted negotiation e2e, `styles.css` sha256 vs a base build. Verify
   the implementer's visual-fixture claim (no `visual-harness/` negotiation fixture leaves Interest
   out) by your own grep; if `styles.css` moved or a fixture is affected, say so as HIGH.
   Do NOT run full lifecycle / full e2e / shots — those run once on the final sha.

Report extras as `Drive-by fixes:` (none expected — you change nothing on the branch) and
`Follow-ups:`.

## 3. Footguns (all apply)

- Read-only on the review branch. Probe specs and scratch copies live under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc641-r2-review/`
  (create it; uniquely named scripts and logs; Write tool, not heredocs). If a probe spec must sit
  inside the plugin tree to run, remove it afterwards by its literal absolute path and confirm
  `git -C <plugin> status --short` is empty before you finish.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared state: write nothing
  there except your report. Its dse dirt is Scott's live vault — not a finding.
- Every git command is `git -C <absolute path> …`. Never `cd X && git …`.
- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; record exit codes from a script
  FILE; read each gate's own summary line; never pipe a gate through `tail`.
- Each gate is ONE blocking foreground call with output redirected to a log. No `run_in_background`,
  no Monitor, no waiting on a notice. Never key a wait-loop on a scratch filename or its contents —
  the scratch dir is pre-populated across sessions and branches, and a stale log from another branch
  will match. Read the process's own output, or write to a per-run unique path.
- No `rm` with a glob or shell variable. Never `pkill`/`killall` by pattern (kill only a PID whose
  `/proc/<pid>/cwd` is inside this worktree). Never `rm -rf` a shared `/tmp` glob or `.superpowers/`.
- A red `token-coverage.test.ts` is the stale superproject pin: set
  `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
- NEVER create a git tag or release. Do not push.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
  completion notification and will resume you with the answer. If you ever do send a message anyway,
  its FIRST WORD must be your ticket key (`SC-641:`).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/sc641-r2-reviewer-report.md`,
opening with a <=10-line executive summary (verdict + count of findings per severity). If the
report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: VERDICT
(APPROVE / APPROVE_WITH_FIXES / REJECT), reviewed sha, findings list (severity, file:line, one line
each), measured gate numbers, base-fail confirmation for each flipped/new test, `Follow-ups:`, and
the filesystem path of every log, probe spec and artifact you produced.
