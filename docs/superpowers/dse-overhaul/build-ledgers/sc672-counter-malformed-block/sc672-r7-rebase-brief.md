# SC-672 r7 — rebase onto SC-671 + full battery (counter: a block that is empty or is not a map of keys)

You are the implementer for one round. No behaviour change is wanted: rebase the finished work onto the current
tracked branches, resolve conflicts faithfully, add the few interaction tests in §2.3, run the whole battery on the
rebased head, report raw facts. Your final text goes to the ticket-owner (an agent), not a human. You may be
replaced by a fresh worker at any time, so commit after every coherent step.

## 1. Context loading

- Decisions ledger — rulings R1, R2, scope, and the section "Baseline move 2026-11-23 #2" at the end (what SC-671
  changed and the four semantic points):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- Earlier reports (executive summaries only), same dir: `sc672-r5-fix-report.md`, `sc672-r6-rereview-report.md`
  (the scoped re-review of the head you are about to rebase; if it lists findings, the owner's message that
  dispatched you says which of them are in this round — otherwise fix none).
- Worktree (superproject) `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, head `1bb51fab`
  (2 CHANGELOG commits) on workspace main `334058e2`. Plugin repo `…/sc672-counter-malformed-block/draw-steel-elements`,
  branch `sc672-counter-malformed-block`, head **`52cc1b49`** (6 commits) on dse `develop` `fefd9029`.
- Verify paths before any write. **Nothing is written under `/home/scott/code/steelCompendium/workspace/`** except
  your report file. `CHANGELOG.md` is the one in YOUR worktree's superproject.
- **You never call the tracker (Linear).** Never push. **Never create a tag.**
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (do not read "Current
  expected numbers"; the numbers are in §3).

## 2. The task

### 2.1 Plugin repo

`git -C <plugin repo> fetch origin`; `origin/develop` must be **`d582e7ff`** (past it → rebase onto what you
fetched and say so). `git -C <plugin repo> rebase d582e7ff`.

What landed between `fefd9029` and `d582e7ff` (SC-671: a Counter write keeps the YAML keys the counter does not
use): `src/elements/counter/model.ts` (`parse` now calls `Counter.parse(data)` first and then remembers the unknown
top-level keys per instance; `serialize` writes them back), `test/dom/elements/wrapperDefaultKeys.test.ts`,
`e2e/README.md`, and new files `e2e/specs/counter/own-keys.e2e.ts`, `e2e/vaults/shipped/Counter/own-keys.md`,
`test/dom/elements/counter-own-keys.test.ts`, `test/unit/model/counter-serialize.test.ts`. It did NOT touch
`src/model/Counter.ts`.

- Likely textual conflicts: `test/dom/elements/wrapperDefaultKeys.test.ts` (this branch added a counter case to the
  "a null (blank) source body is written back as an empty body" `test.each` and 6 tests, and corrected a comment)
  and `e2e/README.md` (fixture-table rows). Keep BOTH sides' tests and rows; never drop a develop-side line.
- If a develop-side test now fails because of this branch's behaviour (e.g. an SC-671 test that feeds
  `Counter.parse` / the element `parse` a non-map or a `null` and expected the old leniency), do NOT edit it on
  your own judgment: finish the rebase, run the gates, and report the failing test with its assertion under
  `Follow-ups:` with STATUS: NEEDS_CONTEXT.
- After the rebase `git -C <plugin repo> diff d582e7ff..HEAD --stat -- src/` must list exactly
  `src/model/Counter.ts` and `src/elements/shared/undeclaredDefaults.ts`. Save `git range-diff fefd9029..52cc1b49
  d582e7ff..HEAD`.
- `package.json` / `package-lock.json` differ between `fefd9029` and `d582e7ff` → `npm ci` before any gate.

### 2.2 Superproject

`git -C <worktree> fetch origin`, `git -C <worktree> rebase origin/main` (expected `c5d38e9b` or later; its
CHANGELOG gained SC-671 bullets). Keep every bullet from main; the SC-672 bullet stays at the top of
`## Unreleased`, wording unchanged. Do not stage the ` M draw-steel-elements` pointer; no `just sync`, no
`git submodule update`.

### 2.3 Interaction tests (new, small, one commit on top)

The two tickets meet in the counter element's `parse` / `serialize`. Add jsdom tests (through the element's real
`parse` / `serialize` / write path, in `test/dom/elements/counter-wrong-block.test.ts` or next to it) that pin:

(a) a non-map block (`hello`, `- a`, `5`, a `!!set`) still throws `Invalid data: the block must be a map of keys.`
    through the ELEMENT `parse` (the error comes before any unknown-key handling) and nothing is written;
(b) an empty block (blank, comment-only, `null`) is a fresh counter; + writes exactly `current_value: 1`; no stray
    key is carried;
(c) a block that holds ONLY keys the counter does not read (`note_to_self: x`): draws a counter at 0, + writes
    `current_value: 1` AND keeps `note_to_self: x`; + then − ends with `note_to_self: x` still in the block (it is
    never written back as a blank body);
(d) an empty block, + then −, in the jsdom write path: the result is what CTR-W14 pins for Reading view (a blank
    body) — unchanged by SC-671.

If any of (a)-(d) does not hold on the rebased head, do NOT change `src/`: report it with the measured bytes and
STATUS: NEEDS_CONTEXT. One e2e is welcome if cheap (next free id after CTR-W15, check SC-671's `own-keys.e2e.ts` ids
so nothing collides): case (c) in real Obsidian, Reading view, with a new fixture and its README row.

### 2.4 Nothing else

No refactors, no rewording, no history rewrite beyond the rebase. Out of scope: SC-686, SC-685, SC-673, SC-674,
SC-680, SC-599, SC-670, SC-461, montage, negotiation, `src/framework/**`, `src/elements/counter/model.ts`.

## 3. Gates (all required, on the final head)

Base at dse `develop` `d582e7ff` (dse-verify CURRENT): tsc and lint clean · jest 13936 passed / 2 skipped fresh ·
lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`.

Expected on your head, with N = jest tests added in §2.3 and M = e2e tests added in §2.3 (0 or 1):

- `tsc` (incl. `tsc -p e2e`) and lint: clean.
- jest: **13996 + N passed / 2 skipped, 0 failed** (13936 + this branch's 60). State N and the new titles.
- e2e, ONE full run: **`OBSIDIAN-E2E done: (681 + M)/(686 + M) ok, 0 failed, 5 known-bug, coverage: 418/418
  pairs`**. Also `counter-wrong-block.e2e.ts` and `own-keys.e2e.ts` alone.
- lifecycle, all seven `--only` parts: **64/64** (G-S61 alone red with "disk read was torn" = the known SC-668
  busy-host red: re-run it alone once, report both and the loadavg).
- `npm run build`; `sha256sum styles.css` must equal a clean `d582e7ff` build's (scratch `git -C <plugin repo>
  worktree add <your scratch folder>/base d582e7ff` with `node_modules` symlinked, as in r5; remove it by its
  literal path with `git worktree remove` when done). Report both hashes. Equal → shots / freeze / parity carry
  and are NOT run. Not equal → stop and report.
- Known e2e flakes under load: INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04. If ONLY those fail, re-run the
  full suite once and report both lines. Any other failure: report with the log excerpt; do not edit a test to
  make it pass.

Command-shape rules (each has hung or misled a worker before):

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …`. Devbox eats `$?`: record exit codes inside a script FILE and read each gate's own
  summary line. Never pipe a gate into `tail` / `grep`.
- Scratch folder (create it; yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r7-rebase/`.
  Scripts via the Write tool (no heredocs). Unique log / rc names per run; overwrite with `>`; **no `rm` with a
  variable or a glob**. Logs in `sc672-r3-rebase/` and `sc672-r5-fix/` are from other heads: never read them as
  results.
- Each gate is ONE blocking foreground call with output redirected to a log file; split e2e / lifecycle to fit the
  10-minute tool limit. **No `run_in_background`, no Monitor, no waiting for a notification.** For anything longer,
  `nohup … > log 2>&1 &` with an rc file written by the script, then poll the log / rc with short blocking calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches, and a stale log from another branch will match. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Git: always `git -C <absolute path> …`.
- Never `pkill` / `killall` by pattern; never `rm -rf` a `/tmp` glob. Kill only a PID whose `readlink
  /proc/<pid>/cwd` is inside your own worktree; delete only a path you created and recorded.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r7-rebase-report.md`.
Open with a **≤10-line executive summary**: STATUS, new plugin head + base, new superproject head + base, each
gate's measured summary line (with N and M), both `styles.css` hashes. Then: every conflict (file, both sides,
result); the range-diff; what (a)-(d) measured (bytes); `Drive-by fixes:` and `Follow-ups:` (either may be
"none"). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — STATUS, shas, N and M, measured gate lines, conflict list, (a)-(d)
results, `git status` of both repos — no prose, **plus the absolute path of every evidence artifact**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
