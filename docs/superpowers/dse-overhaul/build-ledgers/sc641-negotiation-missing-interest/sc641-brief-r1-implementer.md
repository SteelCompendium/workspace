# SC-641 r1 — implementer brief

You are the implementer for SC-641 (draw-steel-elements plugin, `ds-negotiation`). This brief is
self-contained; a replacement worker must be able to start from it and the files it names.

## 0. Context loading (do this first)

- Ledger (read fully, it is short): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/decisions.md`.
  Its "Facts" line numbers are STALE (develop moved 99 commits) — find everything by symbol.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest`.
  Plugin clone: `<worktree>/draw-steel-elements`, branch `sc641-negotiation-missing-interest`
  (currently at `12aaf5b5`, zero commits of its own).
- **Rebase first:** `git -C <plugin> fetch origin`, then
  `git -C <plugin> rebase 3b47e55b710c1bbf7afe9f245c4c1b99e0ea8672` (= `origin/develop` today; a
  fast-forward). Then `npm ci` in the plugin dir — the worktree has no `node_modules`.
- Gate skill (the authority for command shapes): `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
  It is 480 KB — do NOT read it whole. Read lines 20-36 (battery table), "Devbox wrapping",
  "Stale `main.js` shadows", "Jest timeouts under load", "THE exit-code footgun" (grep the headings).
- Plugin `AGENTS.md` / `.repo-docs/` as needed for conventions.

## 1. The task

Scott's ruling, verbatim (2026-11-22):

> * interest default: 2
> * Reset to the defaults

It answers these two options exactly as they were offered to him:

> **a. Interest 2 (my pick).** That is the rulebook's starting Interest for a Neutral NPC (Neutral is
> Interest 2, Patience 3). Patience left out stays at 5, as today.

> **a. Reset to the defaults from Q1 (my pick).** With Q1 a, that is Interest 2 / Patience 5, so Reset
> always lands on a live negotiation. Nothing new is written into the note. The cost: a block that
> started at Interest 3 / Patience 2 resets to 2 / 5, not to where it started.

And the ask promised him: "the docs page will say what a block that leaves these out starts at, and
the 4 tests that currently mark this bug become ordinary passing tests (2 jsdom, 2 real-Obsidian e2e)."

So:

1. `src/model/NegotiationData.ts`: `default_interest` 0 -> 2. `default_patience` stays 5. The
   per-field fallback order (`current ?? initial ?? default`; Reset = `initial ?? default`) does not
   change. An AUTHORED `initial_interest: 0` or `current_interest: 0` is still honoured as written
   (owner ruling: out of scope, do not "fix").
2. Check every other consumer of the Interest default — grep for places that assume a missing
   Interest is 0 or that restate the default: `src/elements/negotiation/**`, the pinned sidebar path,
   the block edit form (SC-556) and its placeholders/defaults, insert templates / `ds-suggest` schema
   hints, print, `src/elements/shared/undeclaredDefaults.ts` and whatever feeds it the negotiation
   defaults. The "undeclared default is omitted while unchanged" write rule must stay correct under the
   new default: a name-only block driven to Interest 0 must WRITE `current_interest: 0` (0 no longer
   equals the default), and a name-only block still at 2 must write no interest key. Add tests for both.
3. Reset writes nothing new: Reset on a name-only block adds no key; Reset on a current-only block
   (`current_interest: 3`, `current_patience: 2`) must not add `initial_*` keys. Report the exact
   bytes the block has after Reset in both cases (and add a test pinning each).
4. Flip the 4 markers to ordinary passing tests, and strengthen them to assert the ruled VALUES
   (opens at Interest 2 / Patience 5; Reset of the current-only block lands on Interest 2 / Patience 5,
   not ended): jsdom `[K08]`, `[K09]` in `test/dom/elements/negotiation-bugs.test.ts`; e2e
   `knownBug('SC-641', '[NEGO-W06]…')`, `'[NEGO-W07]…'` in `e2e/specs/negotiation/wrong-values.e2e.ts`
   (become plain tests; drop the `failsWith`). Update the file-header comment that lists SC-641.
5. Docs, in the plugin repo:
   - `docs/negotiation-tracker.md`: `initial_interest` / `initial_patience` are not "required". Say
     plainly what a block that leaves them out starts at (Interest 2, Patience 5) and what Reset
     returns to (the `initial_*` values when written, otherwise Interest 2 / Patience 5).
   - `e2e/README.md` fixture table rows for `Negotiation/minimal.md` and `Negotiation/current-only.md`.
   - `src/elements/negotiation/focusRules.ts` comment "(SC-641 may hide the Reset item, not the
     button)": that option was not chosen — correct the comment.
   - Any `.repo-docs/` line that states the old default.
6. Workspace changelog: one bullet under `## Unreleased` in
   `/home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest/CHANGELOG.md`
   (the workspace-level files live in YOUR worktree's superproject — never under
   `/home/scott/code/steelCompendium/workspace/`). Plain words, user-visible result, ends "(SC-641)".
   Commit it in the worktree superproject (do NOT stage the submodule pointer; landing does that).
7. Visual fixtures: grep `visual-harness/` and `demo-vault/`-style fixtures for `ds-negotiation`
   blocks that write neither `initial_interest` nor `current_interest`. Report the list (file paths).
   If the list is empty and built `styles.css` is byte-identical to a base build, shots/freeze/parity
   carry and you do not run them. If the list is NOT empty, stop after the jest gate and report it —
   a frozen screenshot would move, which needs the owner.

Commit style: follow the repo's (`fix(negotiation): … (SC-641)`). **No co-author trailers and no AI
attribution of any kind in commit messages.** Commit after every coherent step. Do not push.

## 2. Gates for this round (expected numbers on base `3b47e55b`)

- `npm run tsc` (and `tsc -p e2e` if the repo's script has it): clean. `npm run lint`: clean, exit 0.
- `npx jest` (remove stale `main.js` / `styles.css` in the plugin root first, per the skill): base
  on a fresh worktree is **13855 passed / 2 skipped**. `test.failing` counts as passed, so yours =
  13855 + the tests you add, 2 skipped, 0 failed. State the delta and what makes it up.
- Targeted e2e only: the negotiation specs (see the skill / `e2e/README.md` for the `--only`/spec
  filter form). Report the summary line; NEGO-W06 / NEGO-W07 must be `ok`, not known-bug.
- `styles.css` sha256 after `npm run build` vs the same on a clean base build (expected identical;
  base at `3b47e55b` starts `18730938…`).
- NOT this round: full lifecycle and full e2e run once on the final sha after review (full-run
  target then: `OBSIDIAN-E2E done: 660/667 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`,
  plus any e2e tests you add; lifecycle 64/64, G-S61 torn-read is a known load flake, SC-668).

## 3. Footguns (all apply)

- Verify `pwd`/paths before any write. The main checkout
  `/home/scott/code/steelCompendium/workspace` is shared state: never write there except your report
  file in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`) is
  Scott's live vault — not yours, do not flag it.
- Every git command is `git -C <absolute path> …`, never `cd X && git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc641-negotiation-missing-interest/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. Devbox eats `$?` in `bash -c '…'`: record exit codes from a
  script FILE, and read each gate's own summary line. Never pipe a gate through `tail`.
- Scratch: use only `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc641-r1-impl/`
  (create it), with uniquely named scripts and logs. Write scratch files with the Write tool, not
  heredocs. No `rm` with a glob or a shell variable; overwrite with `>` or use fresh names.
- Run each gate as ONE blocking foreground call with output redirected to a log file (the 600 s
  stream watchdog kills silent agents). No `run_in_background`, no Monitor, no waiting on a notice.
  Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your
  worktree. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-*`) or `.superpowers/`.
- If a doc-reading jest test (`token-coverage.test.ts`) goes red, it is the stale superproject pin:
  set `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
  Not a code defect.
- NEVER create a git tag or release.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
  completion notification and will resume you with the answer. If you ever do send a message anyway,
  its FIRST WORD must be your ticket key (`SC-641:`).

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc641-negotiation-missing-interest/sc641-r1-implementer-report.md`,
opening with a <=10-line executive summary. If the report-file write is blocked by your harness,
return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS
(DONE / NEEDS_CONTEXT / BLOCKED), plugin branch sha, superproject sha, files changed, measured gate
numbers (jest passed/skipped/failed + delta, e2e summary line, styles.css sha vs base), the bytes
after Reset in the two cases, the visual-fixture list from task 7, `Drive-by fixes:` (made),
`Follow-ups:` (left alone), and the filesystem path of every log and artifact you produced.
