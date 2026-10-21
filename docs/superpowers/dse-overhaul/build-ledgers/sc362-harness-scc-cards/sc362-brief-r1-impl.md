# SC-362 round 1 — implementation (implementer)

Your final text goes to the ticket-owner, not a human. **You never call the tracker
(Linear)** — not to read history, not to post. This brief is self-contained; a replacement
worker must be able to pick it up from the files alone.

## Context loading

1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/decisions.md`
   — the ledger. Its rulings are binding.
2. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-r0-survey-report.md`
   — the round-0 design survey. Its implementation plan is your spec, as amended by the
   "Owner amendments" section below (the amendments win).
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the
   battery, command shapes, freeze rules, the "Widening the baseline is additions-only"
   bullet, and the CURRENT block.
4. The dse repo's `AGENTS.md`/`CLAUDE.md` and `visual-harness/README.md`.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards`. The dse
clone is `.../sc362-harness-scc-cards/draw-steel-elements`, branch `sc362-harness-scc-cards`.
Verify with `git -C <dse> rev-parse --abbrev-ref HEAD` before your first write. First:
`git -C <dse> fetch origin` and `git -C <dse> rebase origin/develop` — expected base
`0ce76dd` (if origin/develop has moved, rebase onto it and report the new base sha).

**Never write in the main checkout** `/home/scott/code/steelCompendium/workspace/` — it is
shared state. The only exception: your report file in the ledger dir. Any workspace-level
doc you are told to edit lives in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/<file>`. The main
checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
`compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## The task

Scott's fix direction (ticket description, verbatim):

> Fix direction: give the harness a small fixture compendium (a handful of real `md-dse`
> files) and add by-SCC captures for at least the rule card, so these paths get shots and
> become eligible for the freeze set.

Ledger rulings (verbatim):

> **SC-469 stays out of scope.** It is a separate ticket outside this project. But it needs
> the same seam (a stub compendium plus an SCC resolver in `visual-harness/entry.ts`), so
> build that seam so SC-469 can reuse it — e.g. a resolver that could later be told to
> return "web"/not-installed — without adding the degrade-card fixtures here.

> **The freeze change is a widening (additions-only).** Per dse-verify, a widening needs no
> Scott sanction. Zero existing frozen lines may move: all 572 existing PNGs must stay
> byte-identical, and `freeze OK (276/276 …)` must hold before widening.

> **Edits to `shoot.mjs` are kept to additive registrations** (new capture entries / new
> fixture ids), no changes to sizing, timing or existing entries — SC-349 owns capture
> sizing.

### Owner amendments to the survey plan

Quoted from the ledger section "Owner rulings after round-0 survey (2026-10-21)" — read it
there in full; summary of what binds you:

1. Implement the survey's plan: real `SccResolver` + `createCompendiumIndex` over the harness
   mock vault, seeded from `test/fixtures/md-dse` via the existing `.md` text loader. Wiring is
   **per fixture** (mode `none | fixtures | anchors-only`, default `none`). Every existing
   fixture stays on `none` — the 18 fixtures whose DOM would change under global wiring must
   not change.
2. New fixtures: **`rule/by-scc` (opportunity-attack) and `condition/by-scc` (Bleeding)** only.
3. Freeze widening: **2 lines per capture id** (`--steel-print` + `--steel-realprint`) → 4
   lines, 276 → 280. (This corrects the 1-line statement in the Gates section below.)
4. `shoot.mjs`: the survey found zero edits are needed (its sweep picks up new fixtures). Keep
   it at zero. If you find you need one, stop and return `STATUS: NEEDS_CONTEXT`.
5. Fold in: fix the three stale comments (`entry.ts:1925-1928`, `fixtures.test.ts:24-27`,
   `entry.ts:362-366` — line numbers at `0ce76dd`). Add a guard so a by-SCC fixture that fails
   to resolve (renders `.dse-ref-notice`, `.dse-ref-web-card` or `.dse-error-card` instead of
   the resolved card) fails a gate. A jest test asserting each by-SCC fixture renders the
   resolved card (rule: eyebrow group "Combat" and title "Opportunity Attacks"; condition:
   Bleeding) is the minimum; a shot-time check is welcome if it is additive and outside
   `shoot.mjs`'s sizing code.
6. Leave a short comment at the seed list saying the seeded md-dse set is part of the frozen
   contract (it decides whether in-body links render as vault or web links).
7. Do NOT add SC-469's degrade-card fixtures.

## Gates (dse-verify battery, in order; numbers at dispatch, base `0ce76dd`)

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: base **5408 passed / 1 skipped / 231 of 232 suites**, plus your new tests (report the
  delta). Note: on a fresh worktree jest reads one fewer passed and 2 skipped until
  `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — compare only after a
  shots run.
- lifecycle `npm run obsidian-lifecycle`: **29/29 ok, 0 failed**. Set your own
  `DSE_LIFECYCLE_PORT` (e.g. 9363).
- e2e `npm run e2e`: **`OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**
  (coverage count may rise only if your change adds pairs — explain any change).
- shots `npm run shots`: base **572 PNGs, 0 FAIL**, plus your new captures (report the exact
  new count and list the new filenames). The in-run `montage board scroll OK (…)` line must
  still print.
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <dse>/visual-harness/shots`
  → **`freeze OK (276/276 …)`**, 0 FAILED. You do NOT edit the shared baseline. Instead
  write the widening lines (two hash lines per new capture id, `--steel-print.png` and
  `--steel-realprint.png`, same format as the baseline; expect 4 lines) to
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-widening.txt`,
  after a scripted collision check against the baseline (zero existing names), and prove
  determinism: two clean shots sweeps produce identical hashes for the new files.
- parity `npm run parity` (LAST): base **0 GAPs / 0 undeclared / 24 DECLARED**, exit 0.
  Explain any change in the DECLARED count.

Run each gate as its own Bash call, output redirected to a uniquely named log in your scratch
folder; read the log for the result line. Commit after every coherent step (nothing sits
uncommitted through a gate). Commit messages: no AI attribution / co-author trailers.

## Rules / footguns

- Scratch: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r1-impl-<random suffix>/`,
  uniquely named scripts and logs inside it. Never a generic name like `gate.sh`. Create
  files with the Write tool, not heredocs.
- Run node/npm via `devbox run -c /home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements -- <cmd>`.
  If a command needs to run inside the repo dir, put it in a script file in your scratch
  folder (which `cd`s itself) and run that script — never `cd X && …` in a compound command.
  devbox's sh wrapper eats `$?` / `$PIPESTATUS`: capture exit codes inside the script file.
  Never pipe a gate into `tail`.
- `git -C <abs path>` for every git command; never `cd X; git …`.
- No glob `rm` (e.g. never `rm -rf /tmp/dse-obsidian-lifecycle-*`); delete only a path you
  created and recorded. Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc362-harness-scc-cards/` (`pgrep -af "worktrees/sc362-harness-scc-cards/"`).
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run gates in the foreground (timeout up to 600000 ms); don't background
  a gate and wait for a notification that will never come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared and
  pre-populated; a stale log from another branch will match.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its first word
  must be `SC-362:`.
- Report extras in two lists: `Drive-by fixes:` (already made, obviously correct, local) and
  `Follow-ups:` (left alone).

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc362-harness-scc-cards/sc362-r1-impl-report.md`,
opening with a ≤10-line executive summary (verdict, branch sha, every gate number).

## Return contract

Final text: raw facts, no prose — STATUS, dse branch sha, each gate's result line, new shot
filenames, widening file path, report path, and the filesystem path of every evidence
artifact (new PNGs, logs).
