# SC-442 r6 — implementer brief: rebase onto develop `8c08bce2`, CTR-U01 becomes a plain test, full battery

You are a fresh worker on an effort that is nearly finished. Everything you need is in files.
Your final text goes to the SC-442 ticket-owner, not a human. **You never call the tracker
(Linear) — not to read, not to post. You never push anything to origin.**

## 1. Context loading (read first, in this order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`
   — read ALL of it; the section "Resume 2026-11-23" at the end is the current state and wins
   over anything earlier that it strikes through.
2. Prior reports in the same dir — read the ≤10-line executive summaries only, dive in where you
   need a detail: `sc442-r1-implementer-report.md`, `sc442-r2-review-report.md`.
3. The gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (the battery order, the devbox command shapes, the lifecycle `--only=` parts, the flake notes).
   Read its command-shape sections and the "CURRENT" numbers block; you do not need the history.
4. `draw-steel-elements/e2e/README.md` in your worktree (how markers, the manifest and coverage work).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`
dse submodule (where all your edits go): `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements`
Branch (in the submodule): `sc442-e2e-counter-topup`, head `ed7130d9`, currently based on develop `129beb18`.

**Verify `pwd` / the absolute path before any write. Never write under
`/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir.** The
main checkout's dse has a modified `demo-vault/Welcome.md` and untracked vault files — that is
Scott's live vault, expected, not yours, do not touch or report it.

## 2. The task

### 2a. Rebase

- `git -C <dse> fetch origin`, confirm `git -C <dse> rev-parse origin/develop` is
  `8c08bce201ef23c32fa1bec7a28fea219c3151cb`. If it is not, STOP and report both shas
  (NEEDS_CONTEXT) — do not rebase onto "latest".
- `git -C <dse> rebase 8c08bce2`. One conflict is expected, a table row in `e2e/README.md`.
  Relay from the SC-671 owner, verbatim: "SC-442: if it lands after this, its `CTR-U01` known-bug
  marker for SC-671 must become a plain test. It has one conflict with this branch, a table row in
  `e2e/README.md`; keep both rows."
  Any OTHER conflict: resolve it only if it is plainly additive on both sides (two lists that both
  grew); otherwise STOP, NEEDS_CONTEXT, with the conflicting hunks.
- After the rebase: if `git -C <dse> diff 129beb18 8c08bce2 --stat -- package.json package-lock.json`
  shows a change, run `npm ci` (through devbox) before any gate — stale `node_modules` give
  phantom `tsc` errors.
- Scenario ids are global. Re-check after the rebase that no id on this branch (`CTR-E/N/Q/S/T/U/V/W/X…`,
  `[CENSUS-18]`, `[CENSUS-19]`, the jsdom matrix ids) now exists twice (`git -C <dse> grep`). At
  resume the owner found none; develop added `CTR-O01..O04` (SC-671).

### 2b. CTR-U01 becomes a plain test (owner ruling 2026-11-23, quoted from the ledger)

> **CTR-U01 → plain test.** Remove its `knownBug('SC-671')` / `failsWith`; keep the assertion
> (after +, the note has the new value AND `note_to_self: keep me` and `extra: {a: 1}`, parsed
> values not key order). Update every comment / manifest note / README row that still calls it a
> known bug. Do not delete it as a duplicate of CTR-O01..O04 (the SC-671 owner asked for a plain
> test; the two were written independently).

It must pass as a plain test against the fixed product. If it does NOT pass, do not weaken the
assertion: STOP, NEEDS_CONTEXT, with the actual note text after the press.

Also sweep the branch's own files (`e2e/specs/counter/*`, `e2e/manifest/counter.ts`,
`test/dom/elements/counter-matrix.test.ts`, `test/dom/e2eCensus.test.ts`, the Counter fixtures,
`e2e/README.md`) for text that still describes SC-671 as an open bug, and correct it. SC-671 is
fixed on develop at `d582e7ff`.

### 2c. Matrix after SC-671 (owner ruling 2026-11-23, quoted)

> **Matrix after SC-671:** if a `counter-matrix` test now fails because SC-671 changed what a
> write keeps, the test changes to match the fixed product ONLY where it had been written around
> B1 (unknown keys dropped). Anything else red is a finding — STOP, NEEDS_CONTEXT.

### 2d. What stays exactly as it is

- The other markers stay known-bug: SC-672 (CTR-W01 / CTR-W02 — SC-672 is in flight in another
  effort and is NOT on develop), SC-673 (CTR-V… + the jsdom `test.failing`), SC-674 (CTR-Q01),
  SC-680 (the wheel marker). If any of them now passes unexpectedly on the new base, that is a
  finding: STOP, NEEDS_CONTEXT — do not flip it yourself.
- No product (`src/`) changes. This ticket is test-only.
- SC-685 (Backlog, already filed): "two identical counters that become identical again after a +
  trip the e2e `view registry collisions` check". If a twin test on this branch meets it, cite it
  in your report — do not work around it silently, do not ask for a new ticket.
- Known open tickets and flakes: the ledger's "Known open tickets touching this surface" and the
  flake list. An e2e red on SET-X03 / SET-X04 (SC-657), INIT-W10 (SC-654), NEGO-R05 / NEGO-R08 under
  load: re-run once; a red that repeats is real.

### 2e. Commits

Small, coherent commits inside the dse submodule, message prefix `test(SC-442): …`, plain words.
**No co-author trailers, no AI attribution of any kind in commit messages.** Commit before every
gate run so nothing sits uncommitted. Do not commit in the superproject (the pointer bump is a
later round).

## 3. Gates — the full dse-verify battery on the final rebased head

Follow the skill for order and command shapes. Numbers at develop `8c08bce2` (baseline):

- tsc and lint clean
- jest **13944 passed / 2 skipped** in a fresh worktree (one more passed / 1 skipped once
  `npm run shots` has cached the app css)
- lifecycle **64/64** (seven `--only=` parts, listed in the ledger and the skill)
- e2e **`OBSIDIAN-E2E done: 668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**
- shots **592** · freeze **280/280** · parity **0 / 0 / 24**

Expected on this branch: tsc/lint clean; jest higher than baseline (report the exact count and
the delta; the branch added about 150 jsdom tests at phase A plus r3's); lifecycle 64/64; e2e
`0 failed`, coverage **428/428 pairs** (418 + the 10 new counter pairs — re-count, and explain
any other number), known-bug count = 5 + this branch's remaining markers (list each marker id and
its ticket; CTR-U01 must NOT be among them); shots / freeze / parity unchanged (test-only branch —
any move is a finding). Run e2e **twice** and report both summary lines.

Gate-running rules (each cost real time once):

- Node/npm are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements -- …`
  (or the shape the skill gives). Never `cd X && devbox …` compound commands.
- Devbox eats exit codes and a `| tail` eats failures. Run each gate from a **script file** that
  redirects output to a log and writes the exit code to a file; then read the gate's own summary
  line from the log. Create scripts with the Write tool, not heredocs.
- Your private scratch folder (create it; use nothing else in the scratchpad):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc442-r6-impl/`
  with uniquely named scripts and logs. **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in
  /tmp or the scratchpad — leave throwaway files in place; overwrite with `>`.** No `rm` with a
  shell variable anywhere.
- Each gate is ONE blocking foreground call with output redirected to a log (the 600 s stream
  watchdog kills silent agents; a full e2e run is about 350 s; lifecycle is seven separate
  calls). **No `run_in_background`, no Monitor, no "I'll wait for the notification"** — a
  background job never wakes you. If something must run longer than a tool call allows, poll its
  own log / exit-code file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Never `pkill` / `killall` by pattern. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside
  your worktree. Never delete a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`).
- Every git command as `git -C <absolute path> …` — never `cd X; git …`.
- Worktree superproject docs are stale (cut 2026-11-15). If `token-coverage.test.ts` (or another
  doc-reading test) goes red, compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md`
  with the main checkout's copy and use the test's `DSE_TOKEN_MAP_PATH` override pointed at
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`. That
  is not a code defect and never a reason to edit the branch; say so in the report.
- SC-622: restore `demo-vault/.obsidian/appearance.json` if a run left it dirty before blaming a
  change for a G-S97 FAIL. The dse tree must be clean (`git status --porcelain` empty) at the end.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r6-implementer-report.md`.
It must open with a **≤10-line executive summary** (status, final sha, base sha, each gate's
summary line). Then: the conflict(s) and how each was resolved; the CTR-U01 diff in a few lines;
any matrix test changed and why; the marker list (id → ticket); every gate's exact summary line
with the log path; Drive-by fixes; Follow-ups.
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text is for the ticket-owner: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT |
BLOCKED`, final dse head sha, base sha, the commit list (`git log --oneline 8c08bce2..HEAD`), each
gate's measured summary line, the marker list, and **the filesystem path of every artifact you
produced** (report, logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
`to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
completion notification and will resume you with the answer. If you ever do send a message
anyway, its FIRST WORD must be your ticket key (`SC-442:`) — the dispatcher routes strays by
that key and cannot judge content to guess.
