# SC-672 r6 — scoped re-review of the r5 fix delta (counter: a block that is empty or is not a map of keys)

You are the independent reviewer again, for a **scoped re-review of the delta only** — not a fresh full pass. You
wrote the r4 review; the r5 implementer acted on it. **Execute and probe, do not just read.** Your final text goes
to the ticket-owner (an agent), not a human. You fix nothing.

## 1. Context loading

- Ledger — read "Owner rulings on the r4 findings (2026-11-23)" and everything after it (which findings were
  folded, filed or dropped, and why; the baseline move; the r5 result):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- The fix brief the implementer worked from (§2, the five items) and its report (executive summary; body as needed):
  `…/sc672-counter-malformed-block/sc672-r5-fix-brief.md`, `…/sc672-counter-malformed-block/sc672-r5-fix-report.md`
- Your own r4 report: `…/sc672-counter-malformed-block/sc672-r4-review-report.md`.
- Plugin repo `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements`, branch
  `sc672-counter-malformed-block`. Head to review: **`52cc1b49`**, now on dse `develop` **`fefd9029`** (the branch
  was rebased from `bdf0255e` across SC-644, 8 framework commits; `ccacc3cc`, which you reviewed, became `c203beef`).
  **The delta is the two commits `0098eb44` and `52cc1b49`**: `git -C <plugin repo> diff c203beef..52cc1b49`.
  Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, head `1bb51fab`:
  its newest commit is the CHANGELOG wording fix (`git -C <worktree> show HEAD`).
- Leave the plugin branch exactly at `52cc1b49` with a clean `git status` (the superproject legitimately shows
  ` M draw-steel-elements`). Throwaway probes are allowed; delete them and keep copies in your scratch folder.
  Do not rebase, do not push, never tag. Write nothing under `/home/scott/code/steelCompendium/workspace/` except
  your report file. **You never call the tracker (Linear).**

## 2. What to establish

The ruling, verbatim:

> **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
> (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
> and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.`

1. **M1 is closed.** `src/model/Counter.ts:47` now refuses any value whose `Object.prototype.toString` tag is not
   `[object Object]`. In REAL Obsidian, with your own probe (not only the implementer's CTR-W13): `!!timestamp`,
   `!!binary`, `!!set`, `!!omap` blocks each show the plain error card, have no control, and the note is
   byte-identical after mouse and keyboard on the card, in Reading view and Live Preview. Still accepted and
   byte-identical to before on a press: `{}`, `!!map {}`, a normal counter, the shipped example, an empty block in
   each form (R2). Hunt for a shape that now gets through or is now wrongly refused: other YAML tags or constructs
   that Obsidian's parser turns into something whose tag is `[object Object]` but is not a plain map, or a plain
   map the new test refuses (anchors / aliases, merge keys `<<:`, a map with a `toString` / `constructor` /
   `__proto__` key, a null-prototype result, a popout window if you can reach one). A way to still lose the user's
   text through the card is HIGH; a new false refusal of a valid counter is HIGH.
2. **The new tests can fail and test the right thing.** The implementer reports red with the old predicate (jest
   `9 failed`, CTR-W13 `0/1`). Spot-check one unit case and CTR-W13 yourself (scratch edit, then restore). Read
   CTR-W14 / CTR-W15 (the + then − cycle, Reading view / Live Preview): do they assert the contract in the brief
   (counter at 0, no error card, text outside the fence byte-identical, a second cycle changes nothing) and would
   they fail if the cycle ate or added a line outside the fence? Is the exact fence body they pin stable (run the
   spec alone three times)?
3. **Wording (L1, L2, H1 sentence).** Read the final `docs/counter.md` bullets and `name` row, and the SC-672 bullet
   in `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md`. Each sentence true
   as measured? Plain wording? Nothing else in either file changed by this delta, and the SC-644 / SC-675 bullets
   from main are intact?
4. **Item 4 was skipped.** The implementer says a `knownBug('SC-685')` test cannot hold the collision because the
   after-test invariant (`e2e/driver/invariants.ts:38-43`) fires outside the marker. Confirm from its log
   (`…/scratchpad/sc672-r5-fix/e2e-new1.log`) and the driver that this is so, and that no invariant, driver file or
   existing test was weakened in the delta (the delta must not touch `e2e/driver/**`).
5. **The rebase did not change behaviour.** `git -C <plugin repo> diff fefd9029..52cc1b49 --stat -- src/` lists
   exactly `src/model/Counter.ts` and `src/elements/shared/undeclaredDefaults.ts`. SC-644 changed how settings reach
   open blocks (framework / pipeline): one probe that an error-card counter and an empty counter survive a settings
   change that re-draws open blocks ("Collapsible by default", "Show edit button") with the note byte-identical and
   the card still what it was (an error card stays an error card with no controls; an empty counter stays at 0).

Out of scope, do not re-report: SC-686 (sidebar command writes into a `hello` block), SC-685 (twin collision),
SC-671, SC-673, SC-674, SC-680, SC-599, SC-670, SC-461; the loose check in montage / negotiation (ruled DROP); the
commit subjects that say "list of keys" (ruled DROP).

## 3. Gates to re-measure

Expected on `52cc1b49` (base at `fefd9029`: jest 13902 / 2 skipped, e2e `664/669 ok, 0 failed, 5 known-bug,
418/418`): tsc (incl. `-p e2e`) + lint clean · jest **`13962 passed / 2 skipped`, 0 failed** (fresh worktree, no
shots cache) · e2e **`OBSIDIAN-E2E done: 677/682 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`** ·
`counter-wrong-block.e2e.ts` alone 13/13 · lifecycle 64/64 (implementer ran all seven parts; you need not, the
`src/` diff is counter-local) · `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.

Re-run yourself: tsc, lint, jest (full), the counter spec alone, and ONE full e2e run (this is the head that
lands, and it crossed a framework rebase). Known flakes under load (INIT-W09 / INIT-W10, NEGO-R05, SET-X03 /
SET-X04): if only those fail, re-run the full suite once and report both lines.

Command-shape rules (unchanged; each has hung or misled a worker before):

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …`. Devbox eats `$?`: record exit codes inside a script FILE; read each gate's own summary
  line. Never pipe a gate into `tail` / `grep`.
- Scratch folder (new, yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r6-rerev/`.
  Scripts via the Write tool (no heredocs). Unique log / rc names per run; overwrite with `>`; **no `rm` with a
  variable or a glob**. Your old `sc672-r4-rev/` logs are from another head: do not read them as results.
- Each gate is ONE blocking foreground call with output redirected to a log file; split to fit the 10-minute tool
  limit. **No `run_in_background`, no Monitor, no waiting for a notification.** For anything longer, `nohup … > log
  2>&1 &` with an rc file written by the script, then poll with short blocking calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches, and a stale log from another branch will match. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Git: always `git -C <absolute path> …`. A base comparison uses `git -C <plugin repo> worktree add <your scratch
  folder>/base fefd9029` (remove it by its literal path with `git worktree remove` when done).
- Never `pkill` / `killall` by pattern; never `rm -rf` a `/tmp` glob. Kill only a PID whose `readlink
  /proc/<pid>/cwd` is inside your own paths; delete only a path you created and recorded.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r6-rereview-report.md`.
Open with a **≤10-line executive summary**: verdict (LAND / FIX-THEN-LAND / DO-NOT-LAND), counts by severity, the
measured gate lines, M1 closed or not. Then findings by severity with file:line, a concrete failure scenario (exact
block text, presses, bytes before and after) and a prescribed fix; then what you probed for points 1-5 and saw. If
the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — verdict, severity counts, one line per HIGH / MEDIUM / LOW
finding, measured gate lines, the head sha and confirmation the worktree is clean at it — no prose, **plus the
absolute path of every evidence artifact**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
