# SC-672 r3 — rebase-only round + full battery (counter: a block that is empty or is not a map of keys)

You are the implementer for one round. No behaviour change is wanted: rebase the finished r1 work onto the current
tracked branches, resolve conflicts faithfully, run the whole battery on the rebased head, report raw facts. Your
final text goes to the ticket-owner (an agent), not a human. You may be replaced by a fresh worker at any time, so
commit after every coherent step.

## 1. Context loading

- Decisions ledger (the spec; rulings R1, R2, scope, and the "Resume 2026-11-22" section at the end):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- r1 report (what was built; read the executive summary and "Existing tests changed"):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r1-implementer-report.md`
- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, branch
  `sc672-counter-malformed-block`, head `c7c04a7b` (one CHANGELOG commit) on workspace main `3a517cdf`.
- Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements`,
  branch `sc672-counter-malformed-block`, head `86397967` (4 commits) on dse `develop` `129beb18`.
- Verify `pwd` / paths before any write. **Nothing is ever written under
  `/home/scott/code/steelCompendium/workspace/`** except your report file (§4). The workspace-level files
  (`CHANGELOG.md`) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md`. The main checkout's dirt
  (a modified `demo-vault/Welcome.md`, untracked vault files) is Scott's live vault; ignore it.
- **You never call the tracker (Linear)** — not to read, not to post.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. It is very long:
  read only "The battery, in order", "Devbox wrapping", "Jest timeouts under load", "Lifecycle and e2e notes" and
  "THE exit-code footgun". Do NOT read "Current expected numbers" (huge); the numbers you need are in §3 here.

## 2. The task

1. **Plugin repo.** `git -C <plugin repo> fetch origin`, confirm `origin/develop` is **`bdf0255e`** (if it has
   moved past that, stop and return STATUS: NEEDS_CONTEXT with the new sha). `git -C <plugin repo> rebase bdf0255e`.
   - Between `129beb18` and `bdf0255e` develop gained: SC-675 (block inserts, `src/authoring/blockInsert.ts`),
     SC-434 (CI e2e job, `e2e/README.md` CI section), SC-641 (a negotiation block without Interest opens at
     Interest 2; `e2e/README.md` fixture rows, negotiation tests). Likely touch points with r1: `e2e/README.md`
     (r1 added 7 fixture-table rows) and `test/dom/authoring/formModalEmptyYaml.test.ts` (r1 moved two tests from
     the counter case to the negotiation case, retyping `name: Duke`).
   - Resolve conflicts by keeping BOTH sides' intent. Never drop a develop-side line to make a conflict go away.
   - If a test that r1 pointed at negotiation now fails because SC-641 changed what a negotiation block draws,
     fix the TEST so it still tests what its title says (an element that refuses an empty box), and say exactly
     what you changed. Do not weaken an assertion and do not touch `src/`.
   - If `git -C <plugin repo> diff 129beb18 bdf0255e --stat -- package.json package-lock.json` is non-empty, run
     `npm ci` (through devbox) before any gate — stale `node_modules` give phantom tsc errors.
   - After the rebase `git -C <plugin repo> diff bdf0255e..HEAD --stat -- src/` must list exactly two files:
     `src/model/Counter.ts` and `src/elements/shared/undeclaredDefaults.ts`. Report `git range-diff
     129beb18..86397967 bdf0255e..HEAD` output (it should be all `=` apart from the files you had to resolve).
2. **Superproject.** `git -C <worktree> fetch origin`, confirm `origin/main` is **`8e7a7bbe`** (moved → say so in
   the report and rebase onto what you fetched; that is fine for the superproject). `git -C <worktree> rebase
   origin/main`. The only commit is the CHANGELOG bullet; on conflict keep every bullet from main and put the
   SC-672 bullet at the top of `## Unreleased`, wording unchanged. **Do not stage or commit the
   `draw-steel-elements` submodule pointer** (it shows as ` M draw-steel-elements`; the landing does that). Do not
   run `just sync` or `git submodule update` (it would move your plugin checkout off the branch).
3. **Nothing else.** No new tests, no refactors, no doc rewording. Scope and out-of-scope tickets are in the
   ledger (SC-671, SC-673, SC-674, SC-680, SC-599, SC-670 are out of scope). Nothing is pushed. **Never create a
   tag.**

## 3. Gates (all required, on the rebased head)

Base numbers at dse `develop` `bdf0255e` (dse-verify CURRENT, 2026-11-22): tsc and lint clean · jest 13861 passed /
2 skipped in a fresh worktree · lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug,
coverage: 418/418 pairs` · shots 592, freeze 280/280, parity 0 / 0 / 24.

Expected on your rebased head:

- `tsc` (incl. `tsc -p e2e`) and lint: clean.
- jest: **13911 passed / 2 skipped, 0 failed** (13861 + r1's 50). If this worktree has a shots cache
  (`visual-harness/dist/obsidian-app.css`), it reads 13912 / 1 — say which.
- e2e, ONE full run: **`OBSIDIAN-E2E done: 670/677 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`**. Also the
  new spec alone (`e2e/specs/counter/counter-wrong-block.e2e.ts`): 10/10.
- lifecycle, all seven `--only` parts: **64/64**. G-S61 alone red with the "disk read was torn" line is the known
  busy-host red (SC-668): re-run `--only=G-S61` once alone, report both results and the loadavg.
- `npm run build`, then `sha256sum styles.css`: must equal a clean `bdf0255e` build's
  (r1 measured `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` at `129beb18`; SC-641 reported
  `styles.css` byte-identical, so the same hash is expected). Equal → shots / freeze / parity carry and are NOT
  run. Not equal → stop and report (do not run shots, do not touch the freeze baseline).
- Known e2e flakes under load: INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04. If ONLY those fail, re-run the
  full suite once and report both summary lines. Any other failure: report it with the log excerpt, do not "fix"
  it by editing a test.

Command-shape rules (each has hung or misled a worker before):

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …` compounds. Devbox eats `$?`: record exit codes inside a script FILE (`cmd > log 2>&1;
  echo $? > rcfile` inside the script) and read each gate's own summary line. Never pipe a gate into `tail` / `grep`.
- Scratch folder (create it; yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r3-rebase/`.
  Create scripts with the Write tool (no heredocs). Unique log / rc names per run; overwrite with `>`;
  **no `rm` with a variable or a glob**.
- Each gate is ONE blocking foreground call with output redirected to a log file. Split e2e / lifecycle to fit the
  10-minute tool limit as dse-verify describes. **No `run_in_background`, no Monitor, no waiting for a
  notification** — a job you started will not wake you. For anything longer than the tool limit, `nohup … > log
  2>&1 &` with an rc file written by the script, then poll the log / rc with short blocking calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches, and a stale log from another branch will match. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Git: always `git -C <absolute path> …`, never `cd X; git …`.
- Never `pkill` / `killall` by pattern; never `rm -rf` a `/tmp` glob (other efforts' lifecycle / e2e vaults match
  it). Kill only a PID whose `readlink /proc/<pid>/cwd` is inside your own worktree; delete only a path you
  created and recorded.
- Other efforts are running gates on this machine at the same time (load is often high). Jest timeouts under load:
  follow the dse-verify section; a timeout-only failure is re-run, not edited.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r3-rebase-report.md`.
Open with a **≤10-line executive summary**: STATUS (DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT), the new
plugin head sha and its base, the new superproject head sha and its base, each gate's measured summary line, the
`styles.css` hash and whether it matches. Then: conflicts hit and how each was resolved (file, both sides, result);
the range-diff; any test you had to change and why; `Drive-by fixes:` and `Follow-ups:` (either may be "none").
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — STATUS, shas, measured gate lines, conflict list, confirmation
that `git status` is clean in the plugin repo and shows only ` M draw-steel-elements` in the superproject — no
prose, **plus the absolute path of every evidence artifact** (report, logs, rc files).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
