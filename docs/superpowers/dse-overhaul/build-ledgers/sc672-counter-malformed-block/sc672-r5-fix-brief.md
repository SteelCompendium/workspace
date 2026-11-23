# SC-672 r5 — fix round after the r4 review (counter: a block that is empty or is not a map of keys)

You are the implementer for one fix round. Your final text goes to the ticket-owner (an agent), not a human. You
may be replaced by a fresh worker at any time, so commit after every coherent step.

## 1. Context loading

- Decisions ledger (the spec: R1, R2, scope, and "Owner rulings on the r4 findings (2026-11-23)" at the end):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- The r4 review report; read `## Findings` (lines 18-99) only:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r4-review-report.md`
- Earlier reports (executive summaries only): `sc672-r1-implementer-report.md`, `sc672-r3-rebase-report.md`, same dir.
- The reviewer's probe spec and fixtures, to borrow from (read-only):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r4-rev/probe/zz-r4-probe.e2e.ts`
  and `…/sc672-r4-rev/probe/vault/R4Probe/`.
- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, head
  `4765ecf2` on workspace main `565a35c1`. Plugin repo: `…/sc672-counter-malformed-block/draw-steel-elements`,
  branch `sc672-counter-malformed-block`, head **`ccacc3cc`** on dse `develop` **`bdf0255e`**.
  `git -C <plugin repo> fetch origin` first: if `origin/develop` is still `bdf0255e`, do not rebase. If it has
  moved, do NOT rebase on your own; finish the round on `bdf0255e` and say so in the report.
- Verify paths before any write. **Nothing is written under `/home/scott/code/steelCompendium/workspace/`** except
  your report file. `CHANGELOG.md` is the one in YOUR worktree's superproject:
  `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md`.
- **You never call the tracker (Linear).** Never push. **Never create a tag.**
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (do not read "Current
  expected numbers"; the numbers are in §3).

## 2. The task — five items, nothing else

The ruling this round enforces, verbatim from the ledger:

> **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
> (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
> and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.`

**Item 1 (review M1) — `src/model/Counter.ts:45`: refuse an object that is not a plain map.** Today the check
`typeof data !== "object" || Array.isArray(data)` lets through what Obsidian's YAML parser returns for explicit
type tags: `!!timestamp 2024-01-01` (a Date), `!!binary aGVsbG8=` (a Uint8Array), `!!set` with `? a` / `? b` (a
Set), `!!omap` with `- a: 1` (a Map). Each draws a counter at 0 and + replaces the text with `current_value: 1`.
Fix: the block is accepted only when the parsed value is null / undefined (R2) or a plain object; everything else
throws the same exact message. Prefer a test that does not depend on which window's `Object` made the value, e.g.
`Object.prototype.toString.call(data) === "[object Object]"` (the reviewer's alternative was a prototype check
against `Object.prototype` / `null`; either is fine if it holds in real Obsidian AND in jest). `{}`, `!!map {}`,
and every normal counter block must still be accepted. Counter only: **do not touch** montage
(`src/elements/montage/model.ts`) or negotiation (`src/model/NegotiationData.ts`), which share the loose check
(ruled DROP).
Tests: unit cases for the four tagged sources through the real `yaml` parse (error with the exact message) plus
`!!map {}` (accepted); jsdom: at least one tagged shape draws the error card with no control and writes nothing;
e2e in real Obsidian: one new fixture + one test (next free id, CTR-W13 onward) proving a tagged block (use `!!set`
and, if cheap, the other three in the same note) is the plain error card and the note is byte-identical after a
click on the card.

**Item 2 (review L1 + L2 + the H1 wording) — docs and CHANGELOG wording only.**
- `docs/counter.md` Notes, the two bullets r1 added: − is disabled on a fresh counter at 0, so say "the first click
  on + (or a number typed into the box) fills in the block". Replace "The block has to be a list of keys like the
  example above" with wording that does not use the word "list" for the accepted shape, e.g. "The block has to be
  `key: value` lines like the example above." Keep the rest of that sentence.
- `docs/counter.md` field table: `name` is not required (`{}` and an empty block are valid counters with no name).
  Change its Required cell to `No` and its default to "no name shown". Touch no other row.
- Worktree `CHANGELOG.md`, the SC-672 bullet (top of `## Unreleased`): three fixes, everything else unchanged.
  (a) "the first click on - or + replaced your text" → "the first click on + replaced your text";
  (b) "with no buttons, and the note is never written" → "with no buttons, so the card can't change your note"
      (a sidebar command can still add a line to such a block; that is SC-686, out of scope);
  (c) "the first click on - or + fills the block in" → "the first click on + (or a number typed into the box)
      fills the block in".
  No ticket id other than SC-672 in the bullet.

**Item 3 (review L3) — one e2e that pins the + then − cycle on an empty block.** No code change. Measured by the
reviewer: after + then −, an empty block ends as a blank body in Reading view (a block with nothing between the
fences gains one blank line inside the fence) and as `current_value: 0` in Live Preview; both are accepted. Pin
the user-facing contract, in Reading view and in Live Preview: after + then −, the card is a counter at 0 with no
error card; the text above and below the fence is byte-identical to the original; a SECOND + then − cycle leaves
the note byte-identical to what it was after the first cycle. Pin the exact fence body per view too if it is
deterministic across three runs; if it is not, say so and pin only the contract above.

**Item 4 (review L4) — one e2e in the natural order, as a known-bug.** Two empty counter blocks (`two-empty.md`):
+ on the 2nd, then + on the 1st. Today this trips the view-registry collision (SC-685, Backlog, pre-existing on
base, out of scope to fix): bytes and numbers are right, but with the keyboard, Enter on the 1st block's + writes
once, focus falls to `<body>`, and the next Enter writes nothing. Add a test marked `knownBug('SC-685')` whose body
asserts what the user should get (bytes right after each press; after Enter on the 1st block's + the focus is
still on that + and a second Enter writes again). The bytes assertions must not be inside the part that is allowed
to fail if the harness lets you separate them. Keep CTR-W11 as it is. If the harness cannot hold this as a
known-bug without failing the run (for example the collision is caught by an after-each invariant the marker does
not cover), do NOT weaken any invariant: skip Item 4 and report exactly why.

**Item 5 — README rows** for any new fixture in `e2e/README.md`, same style as r1's rows.

Out of scope, do not touch: SC-686 (the sidebar command writing into a `hello` block), SC-685 (the collision
itself), SC-671, SC-673, SC-674, SC-680, SC-599, SC-670, SC-461, montage, negotiation, `src/framework/**`. No commit
subject rewording, no history rewrite: add new commits on top of `ccacc3cc`. The superproject gets ONE new commit
for the CHANGELOG wording; do not stage the ` M draw-steel-elements` pointer.

## 3. Gates (all required, on the new head)

Base at `bdf0255e`: jest 13861 / 2 skipped · e2e `660/667 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` ·
lifecycle 64/64. At `ccacc3cc`: jest 13911 / 2 skipped · e2e `670/677 ok, 0 failed, 7 known-bug, 418/418`.

Expected on your head, with N = the jest tests you add and M = the e2e tests you add (Item 4 included):

- `tsc` (incl. `tsc -p e2e`) and lint: clean.
- jest: **13911 + N passed / 2 skipped, 0 failed**. State N and list the new test titles.
- e2e, ONE full run: **`OBSIDIAN-E2E done: (670 + M − 1)/(677 + M) ok, 0 failed, 8 known-bug, coverage: 418/418
  pairs`** if Item 4 is in (7 known-bug and `(670 + M)/(677 + M)` if it was skipped). No new control, so the pair
  count stays 418/418. Also `counter-wrong-block.e2e.ts` alone.
- lifecycle: the `src/` diff is still `src/model/Counter.ts` + a comment in `undeclaredDefaults.ts`. Run all seven
  `--only` parts once: **64/64** (G-S61 alone red with "disk read was torn" is the known SC-668 busy-host red:
  re-run it alone once, report both and the loadavg).
- `npm run build`, `sha256sum styles.css` = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` →
  shots / freeze / parity carry, not run. Different → stop and report.
- Prove Item 1's tests can fail: with the old predicate restored locally (stash or a scratch edit, then restore),
  the new unit / jsdom / e2e tagged-block tests go red. Report the red lines.
- Known e2e flakes under load: INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04. If ONLY those fail, re-run the
  full suite once and report both lines.

Command-shape rules (unchanged from r3; each has hung or misled a worker before):

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …`. Devbox eats `$?`: record exit codes inside a script FILE and read each gate's own
  summary line. Never pipe a gate into `tail` / `grep`.
- Scratch folder (create it; yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r5-fix/`.
  Scripts via the Write tool (no heredocs). Unique log / rc names per run; overwrite with `>`; **no `rm` with a
  variable or a glob**.
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

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r5-fix-report.md`.
Open with a **≤10-line executive summary**: STATUS, the new plugin head and superproject head, each gate's measured
summary line (with N and M), the `styles.css` hash. Then per item: what changed (file:line), the exact new wording
for Item 2 (quote the final CHANGELOG bullet and the two docs bullets in full), the predicate chosen for Item 1 and
why, what Item 3 pins per view, whether Item 4 is in and how the marker holds it. Then `Drive-by fixes:` and
`Follow-ups:` (either may be "none"). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — STATUS, shas, N and M, measured gate lines, Item 4 in or skipped,
`git status` state of both repos — no prose, **plus the absolute path of every evidence artifact**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
