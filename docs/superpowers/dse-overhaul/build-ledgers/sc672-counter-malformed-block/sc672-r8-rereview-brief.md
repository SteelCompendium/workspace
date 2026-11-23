# SC-672 r8 — scoped check of the rebase onto SC-671 + independent gates on the landing head

You are the independent reviewer again (you wrote r4 and r6). This is a **scoped re-review of the delta since
`52cc1b49`**, plus the independent gate measurement on the head that lands. **Execute and probe, do not just
read.** Your final text goes to the ticket-owner (an agent), not a human. You fix nothing.

## 1. Context loading

- Ledger — read from "Baseline move 2026-11-23 #2" to the end (what SC-671 changed, the four semantic points
  (a)-(d), the r7 result, the owner ruling on the red SC-671 test):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- The rebase round's brief and report (executive summary + the "r7b" section; body as needed), same dir:
  `sc672-r7-rebase-brief.md`, `sc672-r7-rebase-report.md`.
- Plugin repo `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements`, branch
  `sc672-counter-malformed-block`. Head to review: **`28402e57`** (8 commits) on dse `develop` **`d582e7ff`**
  (SC-671 landed: a Counter write keeps the YAML keys the counter does not use). The head you reviewed in r6,
  `52cc1b49`, was rebased; its six commits are the first six of `d582e7ff..28402e57`. **The delta is:** the rebase
  conflict resolutions (`test/dom/elements/wrapperDefaultKeys.test.ts`, `e2e/README.md`), the interaction-tests
  commit (9 jsdom tests, e2e CTR-W16 + fixture `Counter/only-unknown-keys.md`), and the rewritten SC-671 test
  (`test/unit/model/counter-serialize.test.ts`, last test). Use `git -C <plugin repo> range-diff
  fefd9029..52cc1b49 d582e7ff..28402e57` and `git -C <plugin repo> log --oneline d582e7ff..28402e57`.
- Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, head
  `0500eb78`: three CHANGELOG commits (`git -C <worktree> diff origin/main..HEAD`).
- Leave the plugin branch exactly at `28402e57` with a clean `git status` (the superproject legitimately shows
  ` M draw-steel-elements`). Throwaway probes are allowed; delete them, keep copies in your scratch folder. Do not
  rebase, do not push, never tag. Write nothing under `/home/scott/code/steelCompendium/workspace/` except your
  report file. **You never call the tracker (Linear).**

## 2. What to establish

The rulings, verbatim:

> **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
> (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
> and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.`

> **R2. An empty block → a fresh counter at 0 (no error).** "Empty" = whatever parses to null /
> undefined: nothing inside the fence, blank lines / whitespace only, only comments, a bare `null` or `~`.

> **Owner ruling on the red SC-671 test (2026-11-23).** […] **REWRITE the test in place to pin the ruled
> behaviour** (keeping its purpose: a non-map carries nothing): `hello` and `- a\n- b` throw exactly `Invalid
> data: the block must be a map of keys.` through the element `parse`; a `null` / empty source does not throw, is
> a fresh counter, and serializes with no carried key (pin the measured string). No `src/` change.

1. **The rebase kept both tickets whole.** `git -C <plugin repo> diff d582e7ff..28402e57 --stat -- src/` is exactly
   `src/model/Counter.ts` + `src/elements/shared/undeclaredDefaults.ts`. In the two conflicted files no SC-671 test
   or README row was dropped or altered (compare with `d582e7ff`) and no SC-672 test or row was lost (compare with
   `52cc1b49`).
2. **SC-671 × SC-672 in REAL Obsidian** (your own probe, Reading view and Live Preview): (a) `hello`, `- a`, `5`,
   `!!set` are still the plain error card, nothing written; (b) an empty block: + writes exactly
   `current_value: 1`; (c) a block holding only `note_to_self: x` draws a counter at 0, + writes `current_value: 1`
   and keeps `note_to_self: x`, + then − leaves `note_to_self: x` (never a blank body, never `{}`), and a second
   cycle changes nothing; (d) an empty block, + then −: as CTR-W14 / W15 pin. Also: a block with unknown keys AND
   a comment-only / blank-looking remainder; an unknown key whose value is a tagged collection (`extra: !!set
   {a}`) inside an otherwise normal map (must stay a counter; say what is written); two blocks, one empty and one
   with only unknown keys, do not cross-talk. A way to lose the user's text or keys through the card that is not
   on base `d582e7ff` is HIGH.
3. **The tests.** The 9 new jsdom tests and CTR-W16 assert what (a)-(d) say and can fail (spot-check: restore the
   old `Counter.parse` predicate in a scratch edit → (a) goes red; restore). The rewritten SC-671 test matches the
   ruling above, matches the exact message, and nothing else in `counter-serialize.test.ts` changed.
4. **CHANGELOG.** The SC-672 bullet in `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md`
   now ends its fourth sentence "…the first click on + fills the block in (`current_value: 1`); a number typed into
   the box fills it in with that number." True as measured? The SC-671 / SC-644 / SC-675 bullets from main intact
   and unaltered?

Out of scope, do not re-report: SC-686, SC-685, SC-673, SC-674, SC-680, SC-599, SC-670, SC-461, the loose check in
montage / negotiation, commit subjects, your r6 INFO items.

## 3. Gates to re-measure (this is the head that lands)

Base at `d582e7ff`: jest 13936 / 2 skipped fresh · e2e `668/673 ok, 0 failed, 5 known-bug, 418/418` · lifecycle
64/64. Expected on `28402e57`:

- tsc (incl. `tsc -p e2e`) + lint: clean.
- jest (full): **`14005 passed / 2 skipped`, 0 failed** (fresh worktree, no shots cache; 13936 + 60 + 9).
- e2e, ONE full run: **`OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**. Also
  `counter-wrong-block.e2e.ts` alone 14/14 and `own-keys.e2e.ts` alone 4/4.
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` after `npm run build`.
- Lifecycle: the implementer ran all seven parts on the rebased head (64/64); the `src/` diff is counter-local, so
  you need not. If the machine is quiet (loadavg under about 3) one `--only=G-S61` run is welcome.
- Known flakes under load (INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04): if only those fail, re-run the full
  suite once and report both lines.

Command-shape rules (unchanged; each has hung or misled a worker before):

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …`. Devbox eats `$?`: record exit codes inside a script FILE; read each gate's own summary
  line. Never pipe a gate into `tail` / `grep`.
- Scratch folder (new, yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r8-rerev/`.
  Scripts via the Write tool (no heredocs). Unique log / rc names per run; overwrite with `>`; **no `rm` with a
  variable or a glob**. Logs in your `sc672-r4-rev/` and `sc672-r6-rerev/` folders are from other heads: never read
  them as results.
- Each gate is ONE blocking foreground call with output redirected to a log file; split to fit the 10-minute tool
  limit. **No `run_in_background`, no Monitor, no waiting for a notification.** For anything longer, `nohup … > log
  2>&1 &` with an rc file written by the script, then poll with short blocking calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches, and a stale log from another branch will match. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Git: always `git -C <absolute path> …`. A base comparison uses `git -C <plugin repo> worktree add <your scratch
  folder>/base d582e7ff` (remove it by its literal path with `git worktree remove` when done).
- Never `pkill` / `killall` by pattern; never `rm -rf` a `/tmp` glob. Kill only a PID whose `readlink
  /proc/<pid>/cwd` is inside your own paths; delete only a path you created and recorded.
- A usage limit interrupted this session once already. If you find a gate process of YOURS still alive from before
  an interruption, read its own log rather than starting a second run on top of it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r8-rereview-report.md`.
Open with a **≤10-line executive summary**: verdict (LAND / FIX-THEN-LAND / DO-NOT-LAND), counts by severity, the
measured gate lines. Then findings by severity with file:line, a concrete failure scenario (exact block text,
presses, bytes before and after) and a prescribed fix; then what you probed for points 1-4 and saw. If the
report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — verdict, severity counts, one line per finding, measured gate
lines, the head sha and confirmation the worktree is clean at it — no prose, **plus the absolute path of every
evidence artifact**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
