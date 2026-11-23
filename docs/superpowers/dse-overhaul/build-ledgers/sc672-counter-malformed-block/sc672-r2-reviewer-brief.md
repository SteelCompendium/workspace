# SC-672 r2 — independent reviewer brief (counter: a block that is empty or is not a map of keys)

You are the independent, adversarial reviewer for one round. You did not write this code. **Execute and probe, do
not just read.** Your final text goes to the ticket-owner (an agent), not a human.

## 1. Context loading

- Decisions ledger (the spec — rulings R1, R2, scope):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- The implementer's report (read its executive summary; the body where you need it):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r1-implementer-report.md`
- Worktree `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`; plugin repo
  `…/draw-steel-elements`, branch `sc672-counter-malformed-block`. Head to review: **`86397967`** on base dse
  `develop` `129beb18`. Verify with `git -C <plugin repo> rev-parse --short HEAD`. The diff is
  `git -C <plugin repo> diff 129beb18..86397967`. Do not rebase, do not push.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (very long; read "The
  battery, in order" and the e2e / lifecycle command shapes only).
- **You never call the tracker (Linear).**
- You may add throwaway probe tests / fixtures in the worktree to run them, but leave the branch exactly at
  `86397967` with a clean `git status` when you finish (delete your probes; keep copies under your scratch folder and
  list their paths). You fix nothing.
- The main checkout `/home/scott/code/steelCompendium/workspace/` is shared; its dirt is someone else's and
  expected. Write nothing there except your report file (§4).

## 2. What to establish

The rulings, verbatim:

> **R1. A block that is not a map of keys → a plain error card; the card writes nothing.** Text
> (`hello`), a list (`- a`), a number (`5`), a boolean (`true`) — anything `parseYaml` returns that is not a plain map
> and not null / undefined — throws exactly `Invalid data: the block must be a map of keys.` […] An error card has
> no − / + / number box, so nothing can replace the user's text. No raw JavaScript message (`Cannot read
> properties`, `is not a function`, `TypeError`, `undefined`) reaches the card. The YAML-parse error path
> (`Invalid YAML format: …`) is unchanged.

> **R2. An empty block → a fresh counter at 0 (no error).** "Empty" = whatever parses to null /
> undefined: nothing inside the fence, blank lines / whitespace only, only comments, a bare `null` or `~`. It draws
> exactly the counter a `{}` block draws today (no name, current 0, min 0, no max). […] The first − / + / typed value
> on an empty block WRITES into it (e.g. `current_value: 1`). That is a write into a user file, so it gets integrity
> tests (text above and below the block survives; two empty counter blocks in one note do not cross-talk; Reading
> view and Live Preview).

Probe in REAL Obsidian (the e2e harness; write throwaway specs / fixtures) and in jsdom. At minimum:

**A. R1 holds for every non-map shape and every surface.** `hello`, a multi-line paragraph, `- a`, `[1, 2]`, `5`,
`0`, `-3`, `1.5`, `true`, `false`, a quoted string `"x"`, a date-looking scalar, a block scalar (`|` text). For each:
plain message, no counter control, note byte-identical after trying keyboard and mouse on the card. Surfaces:
Reading view, Live Preview, the `ds-ct` alias, a block inside a callout / list (indented or `>`-prefixed fence), an
embed (`![[note]]`), and the pinned sidebar if an error card can be pinned at all. Does any other path write to an
error-card block (collapse toggle, settings change that re-draws open blocks, the block edit form, a pin action
that stamps `_dse_anchor`)? If something can still write into a `hello` block, that is HIGH.

**B. R2 integrity (this writes into user files).** For an empty block in each form — one blank line, several blank
lines, whitespace-only lines, NO line between the fences, comment-only, `null`, `~`:
- it draws the same counter as `{}` (compare DOM), no error, in Reading view and Live Preview;
- + / − / a typed value + Enter writes the expected body; text ABOVE and BELOW the block, and every other block in
  the note, is byte-identical; the closing fence stays on its own line; no blank line is added or eaten outside the
  fence;
- two (and three) empty counter blocks in one note: a press on the 2nd changes only the 2nd; then a press on the
  1st changes only the 1st; also an empty counter next to an empty `ds-montage` block and next to a `{}` counter;
- the empty block as the LAST thing in the note with no trailing newline, and as the first thing;
- inside a callout / list item (prefixed fence lines);
- + then − back to 0: what is written (the ledger expects the existing generic `undeclaredDefaults` rule: a blank
  source goes back to a blank body, a `{}` source stays `{}`); the result must re-parse and re-draw as a counter,
  and repeated cycles must not grow or shrink the note;
- a user who deletes the written `current_value: 1` by hand gets a fresh counter again; a hand edit to the block
  while the card is open is picked up;
- pinning an empty counter to the sidebar (it stamps `_dse_anchor`), pressing there, unpinning;
- the block edit form on an empty counter: opens, Save with an empty box and with one key, result on disk;
- rapid presses (5 quick +) on an empty block land 5 and write once or coherently;
- min/− behaviour on a fresh counter at 0 is whatever `{}` does on base (compare with base, not with your taste).

**C. Regressions.** A normal counter block, a `{}` block and the shipped example behave and serialize
byte-identically to base `129beb18` (compare written bytes for the same presses on both). `Counter.parseYaml` callers
(grep for every use of `Counter.parse` / `parseYaml` on Counter) all get the check and none depended on the old
leniency. Other elements that share `undeclaredDefaults.ts` (negotiation, party, encounter, montage) are untouched
in behaviour.

**D. Out-of-scope probe (report as INFO, do not grade the branch on it).** Wrong-typed VALUES inside a map:
`max_value: banana`, `max_value: [1]`, `current_value: {a: 1}`, `name: [a]`, `name: 2024`, `min_value: true`,
`value_height: x`. For each say: raw JS error on the card? data lost on a press? same on base `129beb18`? Open
tickets SC-671, SC-673, SC-674, SC-680, SC-599 already cover: unknown keys deleted on write; number-box rewrites and
out-of-range values; quoted `current_value`; wheel scroll; comments / quotes / flow lists. Do not re-report those.

**E. The tests themselves.** Are the new unit / jsdom / e2e tests able to fail? Revert the fix locally (stash or a
scratch copy) and confirm the new tests go red for the right reason, then restore. Any test that asserts only that
"something rendered", or that passes on a raw JS error card, is a finding. Check the e2e ids (CTR-W03 onward, no
bracketed ticket id in titles), that `wrong-block.md` / `empty-block.md` are byte-identical to
`/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements/e2e/vaults/shipped/Counter/`
(read-only: `cmp` only, touch nothing there), and that every existing test the implementer changed was changed
correctly (list in its report). Read the CHANGELOG bullet
(`/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/CHANGELOG.md`) and `docs/counter.md`
change for accuracy and plain wording.

## 3. Gates to re-measure independently

Expected on `86397967` (base numbers at `129beb18` in the ledger): tsc + lint clean · jest `13752 passed / 2 skipped (fresh worktree, no shots cache), 0 failed` · e2e
`OBSIDIAN-E2E done: 668/677 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · lifecycle 64/64 · `styles.css` sha256 identical to a clean `129beb18` build (then shots / freeze /
parity carry and are not run).

Re-run yourself: tsc, lint, jest, the counter e2e specs, and ONE full e2e run. Lifecycle: re-run only if the diff
touches anything under `src/framework/` or a host; otherwise say "not re-run, diff is counter-local" and cite the
file list. Known flakes under load (INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04, lifecycle G-S61): if only
those fail, re-run them alone and report both results.

Command-shape rules (each has hung or misled a worker before):

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block/draw-steel-elements -- bash <script file>`.
  Never `cd X && devbox …` compounds. Devbox eats `$?`: record exit codes inside a script FILE and read each gate's
  own summary line. Never pipe a gate into `tail` / `grep`.
- Scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc672-r2-rev/`
  (create it; never a generic name outside it). Create scripts with the Write tool (no heredocs). Unique log / rc
  names per run; overwrite with `>`; **no `rm` with a variable or a glob**.
- Each gate is ONE blocking foreground call with output redirected to a log file. Split e2e / lifecycle to fit the
  10-minute tool limit as dse-verify describes. **No `run_in_background`, no Monitor, no waiting for a
  notification** — a job you started will not wake you. For anything longer, `nohup … > log 2>&1 &` with an rc file,
  then poll the log / rc with short blocking calls.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Git: always `git -C <absolute path> …`. For a base comparison use
  `git -C <plugin repo> worktree add <your scratch folder>/base 129beb18` (a path you created; remove it with
  `git worktree remove` by its literal path when done) — never check out another sha in the effort's worktree.
- Never `pkill` / `killall` by pattern; never `rm -rf` a `/tmp` glob. Kill only a PID whose `readlink /proc/<pid>/cwd`
  is inside your own paths; delete only a path you created and recorded.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r2-review-report.md`.
Open with a **≤10-line executive summary**: verdict (LAND / FIX-THEN-LAND / DO-NOT-LAND), counts by severity, the
measured gate lines. Then findings **by severity (HIGH / MEDIUM / LOW / INFO) with file:line**, each with a concrete
failure scenario (the exact block text and presses, what is on disk before and after) and a prescribed fix. Then the
probe matrix (A–E) with what you ran and what you saw, and the section D table. If the report-file write is blocked
by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — verdict, severity counts, one line per HIGH / MEDIUM finding, the
measured gate summary lines, the head sha you reviewed and confirmation the worktree is clean at it — no prose,
**plus the absolute path of every evidence artifact** (report, logs, probe specs, screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.

## 6. Addendum (owner, after r1) — two things to settle

**F. The implementer's follow-up 1 (view-registry collision).** Its claim: in Reading view, on the EXISTING
`e2e/vaults/shipped/Counter/twins.md` (two identical non-empty counters), + on the SECOND block and then + on the
FIRST leaves both bodies equal again and the e2e invariant fails with `view registry collisions=1 ambiguous=0`;
the note bytes are right; the same happens on the new `two-empty.md`. CTR-W11 avoids it by pressing + twice on the
second block first. Establish, in real Obsidian:
1. Does it reproduce on a clean base `129beb18` build with `twins.md` (so it is not this branch)?
2. What does the USER see when it happens — anything at all (a flicker, lost keyboard focus, a stale number, a
   press that does nothing, a console error)? State the bytes on disk after each press.
3. On this branch with `two-empty.md`, press + on the 2nd then + on the 1st (the order CTR-W11 avoids): are the
   bytes right, and is what the user sees right? If the bytes or the screen are wrong on this branch only, that is a
   finding against the branch; if it is the same as base, report it as INFO with the base evidence — the owner files
   it separately.
4. Is CTR-W11's ordering an honest test of "two empty blocks do not cross-talk", or does avoiding the collision
   hide a real cross-talk case?

**G. Lifecycle.** The implementer measured 63/64: only G-S61 red ("recorder's disk read was torn"), twice on the head
and once on a clean `129beb18` build — the known SC-668 red on a busy host. You need not re-run lifecycle (the diff
is `src/model/Counter.ts` + a comment in `src/elements/shared/undeclaredDefaults.ts`); if you have a quiet moment
(loadavg under about 3), ONE run of `--only=G-S61` on the head is welcome, reported either way.
