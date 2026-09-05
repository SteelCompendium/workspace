# SC-191 round 4 brief — montage overhaul: dedupe, padding, rules guidance, notes

You are the round-4 design worker on the montage element overhaul. Rounds 1–3 produced a
design direction Scott has now largely approved ("Overall looking good"); this round applies
his round-3 ruling and closes the remaining questions so the ticket can become an
implementation ticket.

**You never call the tracker (Linear)** — not to read history, not to post. Your context
comes from the files below; your output goes to the ticket-owner.

## Context to load, in order

1. **The decisions ledger** (Scott's rulings, verbatim — this REPLACES the ticket thread):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. Prior-round reports (what was built and why):
   - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191/sc191-report.md` (round 1)
   - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191/sc191-round2-report.md` (round 2)
   - Round 3 has no report file; its content is in commit `4ea585f`'s message and the mocks themselves.
3. The dse repo's own `CLAUDE.md` in your worktree.

## Worktree — verify `pwd` before ANY write

Your environment: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/`
The plugin repo: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
(branch `sc191-montage-overhaul`, currently at `4ea585f` = the round-3 design tip).

**NEVER touch `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) —
except for READING the two prior-round reports and WRITING your report/PNGs into
`.superpowers/sdd/sc191-montage-overhaul/` as specified below. Any workspace-level file you
need to read otherwise lives in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/`.

### First step: rebase

`origin/develop` has moved beneath the branch (now `c09cf6f`, SC-205 harness round 5).
Inside YOUR worktree's `draw-steel-elements` (fetch is already done):

```
git rebase origin/develop        # replays f39c064, b7bcfe9, 4ea585f (design commits, mocks only)
```

Conflicts should be nil-to-trivial (the design commits only touch `visual-harness/sc191/`).
Then `npm ci` if the rebase changed `package.json`'s obsidian version — stale `node_modules`
produce phantom tsc errors. Record the post-rebase sha in your report.

The mocks live at `draw-steel-elements/visual-harness/sc191/` (round 1: `mock.html`/`mock.js`/
`candidates.css`; round 2: `mock2.*`/`round2.css`; round 3 files per commit `4ea585f`).

## The task — Scott's round-3 ruling, verbatim

> "* Overall looking good
> * I think I want hero name cells to not have any crests to save some space
> * Still looks like there are a few padding issues on some of the header/footer rows.  Also the edit button in a cell needs some padding/margin
> * I think it would be nice to have some guidance available for how to run the montage, specifically the rules for montage test power roll tiers for the difficulties.  This would likely take a bit of screen real-estate so maybe it should be collapable and collapsed by default.
> * There might be other information that would be useful to a Director to help them run the Montage Test.  Im not sure what that might be, so please just do a quick check.  Maybe guidance on how to set difficulties or something if thats in the rulebook.  Again, that shouldnt take up a bunch of screen real estate
> * Edit button should allow quick notes for a test. For example, if a character makes a test and there is a consequence that the Director wants to take note of, they should be able to hit the edit button in the cell and type in something to remember later.  The footer portion that shows the outcome should list out these notes
> * Under the table there is a progress tracker and under that is an overall result footer.  The card has so many places that show the same information (namely the success/failure/round tallies).  We dont need all these places showing that information. I like the footer showing the outcome information.  I also like the visual of the two tracker bars for success/failure, but they may not be necessary.  Lets clean up the UI to avoid all the duplication.
> * Can you also give me a summary of what the "record" button does (and let me see its UI if there is a dedicated modal or something)"

### Base composition

Build on the round-3 **recommended composite: no crest + ink seals + centre spacing**.
Crests are DECIDED gone ("not have any crests to save some space"). Ink seals and centre
spacing were not explicitly picked but every bullet above responds to the recommended
image and the verdict is "Overall looking good" — treat them as standing. If you find a
reason they should NOT stand, say so in the report; do not silently swap them.

### Work items

1. **Padding/alignment pass** on header and footer rows, and give the in-cell edit button
   real padding/margin. Fix what a careful eye finds, not only what he named — he said
   "a few padding issues", plural and unlocated.
2. **Collapsible rules guidance, collapsed by default.** Content: the montage test power
   roll tiers for the difficulties. Research the REAL rules text:
   - Primary source: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/steel-etl/input/heroes/Draw Steel Heroes.md`,
     "### Montage Tests" section (~line 21253) and the general test difficulty/tier rules
     nearby (easy/medium/hard tier outcome tables).
   - Cross-check: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/reference/draw-steel-agent-reference.md`
     ("Montage Tests" section, ~line 89) and `reference/draw-steel-reference.md` (~line 252).
   Get the tier/difficulty semantics RIGHT — this is rules content Scott will read at the
   table. Quote your sources in the report.
3. **Quick check for other Director-useful info** in the same rules text: e.g. how to set
   difficulty, the success/failure limits, the skill-reuse restriction, assist rules,
   Victory awards for montage outcomes, what "total success / partial success / total
   failure" each mean narratively. Propose what earns a place in the collapsed guidance
   (minimal real estate — Scott said so twice). Judge; don't dump the whole chapter in.
4. **Per-test quick notes.** The edit affordance on a recorded cell gains a free-text note
   ("consequence the Director wants to remember"); the outcome footer lists these notes.
   Mock the flow: the edit UI with the note field, and the footer showing 2–3 notes.
5. **De-duplicate the tallies.** Success/failure/round counts currently show in multiple
   places (progress tracker bars under the table + outcome footer + wherever else). Scott:
   the footer outcome stays; the two tracker bars are liked visually "but they may not be
   necessary"; kill the duplication. Produce a recommended cleaned-up composition. If you
   are genuinely torn between "bars removed" and "bars kept, counts removed elsewhere",
   show both — but judge rather than pad the set: a well-argued single answer beats
   indifferent variants.
6. **The "record" button** (the persistent-bar `Record…` control): write a plain-language
   summary of what it does in the current mock design, and screenshot its UI (the
   modal/sheet, pre-filled correct state, etc.). Scott has never seen it open — assume
   nothing is obvious.

### Deliverables

- Updated mocks in `visual-harness/sc191/` (extend the round-3 files or add a `mock4`/
  `round4` set — your call, keep it discoverable), committed on the branch with an
  `SC-191 round 4 — …` message. Do NOT push.
- Screenshots into `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`,
  filenames prefixed `sc191-r4-` (the dir is shared global state; the prefix is mandatory).
  Cover at least: empty / mid-montage / finished states in dark; mid + finished in light;
  one 300px-narrow dark; guidance section collapsed AND expanded; the edit-with-note UI
  open; the footer listing notes; the record UI open; and a labelled "before" (round-3
  recommended) for comparison. Dark is the primary scheme.
- Report at `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-round4-report.md`:
  what changed per work item, the rules-research findings WITH source quotes, the
  record-button summary, your dedup recommendation and reasoning, post-rebase sha, final
  commit sha, gate numbers, and the full list of screenshot paths.

### Design constraints (binding, from the ledger — read it for the full set)

- High-Fantasy Steel design language: read `DESIGN.md` in YOUR worktree superproject root.
- Simple, legible, data and structure merged, obvious how to use — never trade this away.
- No bright-white elements; seals stay polarity-correct (success/failure distinguished by
  shape, not brightness).
- Interaction affordances appear IN the mocks — nothing gets hand-jammed later.
- Add-a-hero row stays deleted; the "+" lives in the Heroes header cell.
- Scott is colorblind: never let hue be the only channel for a state, and name colors in
  prose in every caption you write.

## Gates

Mocks live outside the plugin manifest, so shipped code should be untouched — run the full
battery anyway, exactly as prior rounds did. The battery, command shapes, and rules are in
`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — READ IT;
run through devbox. Expected numbers at dispatch (develop `c09cf6f`):

- tsc + lint: clean
- jest: **3257 passed / 1 skipped / 185 suites**
- shots: **474 PNGs, 0 FAIL** (run twice, byte-identical)
- freeze: **210/210, 0 mismatches** (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements/visual-harness/shots`)
- parity (run LAST): **0 GAPs / 0 undeclared WARNs / 16 DECLARED deferrals**
- `host-copy pin PARTIAL` from the harness is **expected, not a failure**.

If freeze moves: STOP — do not edit the shared baseline, ever. Report the delta.

## Footguns — every one has bitten a prior agent

- Devbox: Go/Node/just are NOT on the system PATH. `devbox run --` executes from the devbox
  project root and ignores your `cd` — always wrap: `devbox run -- bash -c 'cd <repo> && <cmd>'`.
  Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`, and piping a gate (`| tail`) eats failures —
  run gates via wrapper script FILES that capture the exit code, or redirect output to files.
- **Never background a gate or park on a Monitor** — a job you start does not wake you.
  Run gates in the foreground with output redirected to a file (the 600s stream watchdog
  kills silent agents, so redirect rather than stream).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches; a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report — I will resume you with the
  answer. If you ever do send a message anyway, its FIRST WORD must be `SC-191:`.

## Return contract

Your final text goes to the ticket-owner, not a human. Raw facts only: verdict, post-rebase
sha, final commit sha, measured gate numbers, rules-research one-liners, and the FILESYSTEM
PATH of every evidence artifact you produced (every screenshot, the report). No prose
narrative.
