# SC-191 round 4 — dedupe, padding, rules guidance, per-test notes

**Status: design prototype only. Nothing here ships.** No production element code, no
`styles-source.css` edit, no new harness fixture, no new capture id. Battery green (§8).

```
Rebased onto   origin/develop c09cf6f (SC-205 round 5) — clean, no conflicts
Post-rebase    a855c67   (the round-3 design tip, replayed)
Round-4 commit 617a254   SC-191 round 4 — dedupe, padding, rules guidance, per-test notes
Not pushed.

Mock page   draw-steel-elements/visual-harness/sc191/{mock4.html,mock4.js,round4.css}
Camera      draw-steel-elements/visual-harness/sc191/shoot-sc191-r4.mjs  <outDir>
Regenerate  devbox run -- bash -c 'cd <repo>/draw-steel-elements && npm run harness:build \
              && node visual-harness/sc191/shoot-sc191-r4.mjs <outDir>'
```

`npm ci` was required in this worktree (`node_modules/` did not exist) — the rebase itself
did not move `package.json`.

Rounds 1–3's files are untouched. `round4.css` layers on `round3.css` on `round2.css`,
and **every round-4 change — CSS *and* DOM — is gated on `dedupe !== 'before'`.**

---

## 0. The control is provably honest

`?dedupe=before` is meant to reproduce round 3 exactly so the before/after pair is not
flattering. That is verified rather than asserted:

```
sc191-r4-before-mid-dark.png    20bc029e1eb43a83430984638d5a3d9b2351da83863c4aa5e28781542e16c99e
sc191-r3-recommended-mid-dark.png  (same hash)
sc191-r4-before-mid-light.png   2b1f0a88af033d0b36e48d6f9eda82732b893763033e036fe044fb4d12a7030c
sc191-r3-recommended-mid-light.png (same hash)
```

Byte-identical to the round-3 shots Scott reviewed. Getting there caught a real trap: the
edit affordance became a `<button>` in round 4, and a bare `<button>`'s UA padding made the
"before" board ~2.7% taller than round 3's. CSS scoping alone was not enough — the DOM
additions needed the same gate.

## 1. Base composition — the round-3 axes are frozen, and they stand

`crest = none` is Scott's ruling. `seal = ink` and `space = centre` were the round-3
working assumption; **I found no reason they should not stand and did not swap them.** One
piece of positive evidence: the ink seal is what made the greyscale shot survive the extra
marks this round adds (`sc191-r4-grey-dark.png`) — the hollow ring / hatched-press / dashed
ring trio reads cleanly beside a note glyph, where round 2's metal-filled seal would have
been the brightest object in a now-busier cell.

---

## 2. Work item 1 — the padding / alignment pass

Scott named two things ("a few padding issues on some of the header/footer rows", "the
edit button in a cell needs some padding/margin") and both were plural and unlocated, so
this was measured rather than eyeballed. Live `getBoundingClientRect` at 820px on the
round-3 composite:

| header label | bottom (px) |
|---|---|
| `hero` | 256.80 |
| `tally` | 256.80 |
| `done` (round head sub) | 253.83 |
| the lane's `+` | 252.45 |

**Cause (a), the obvious one:** `.mt2-board__rhead` was `justify-content: center` while the
other three cells were `align-items: flex-end`. The round head is the two-line stack that
*sets* the row's height, so its content is centred in a box it defines itself.

**Cause (b), the real one:** round 3's shared gutter is `padding-bottom: 0.62em`, and `em`
resolves against **each cell's own font-size**. `hero` and `tally` are set at
`--dse-fs-micro` (11.2px) → a 6.94px gutter. The round head and the lane inherit the card's
16px → 9.92px. One declaration, three gutters; no amount of alignment fixes it, because the
boxes themselves end in different places. Fixed with a root-relative (`rem`) gutter — the
same unit this sheet already uses for band padding — plus `line-height: 1` on the micro
labels so a line box's bottom *is* its text's bottom. All four now land at **253.83px**.

**Everything else the sweep found:**

1. **The in-cell edit button** (the one he named). Was a bare 0.7em pencil glyph absolutely
   positioned 0.15em/0.2em from the corner: no padding, an ~11px tap target (under half the
   24px a coarse pointer needs), no ground saying it was a control, and it overlapped the
   focus outline drawn at `outline-offset: -1px`. Now a real chip — `--dse-chip-bg` +
   `--dse-metal-faint`, the same pair the quick-record buttons use so the two controls in a
   cell read as one class of thing — inset 0.34em, 1.35em square, 1.75em under
   `pointer: coarse`.
2. **The two tracker bars were drawn the same width.** `flex: 1 1 0` inside a `1fr` track
   meant the 6-slot success bar and the 3-slot failure bar filled identical space, so the
   failure slots came out ~2× wider than the success slots. That destroys the entire
   argument for a countable track — its *length* is supposed to state the Director's limit.
   Fixed-width slots restore it: the failure bar is now visibly half the success bar.
3. **The add-a-round lane's `+` read as belonging to the Tally column.** Round 3 gave the
   lane a left hairline only; a slim column is legible as a column only when both edges are
   drawn. Right hairline added.
4. **The last hero row's bottom hairline doubled the board's own frame** once the foot row
   was deleted (§5). Removed via a `data-lastrow` flag — there is no CSS selector for "the
   last N grid children of a row" that survives the optional lane.
5. **The sheet's placeholder attribute was never styled.** `round2.css` shipped
   `data-placeholder` and no rule for it, so an unfilled field looked filled. Faint +
   italic now.
6. **Footer band rhythm.** Everything below the verdict line now steps at a consistent
   0.5rem with a matched hairline, and the band's padding grew to match the board's gutter.

Evidence: `sc191-r4-before-mid-dark.png` vs `sc191-r4-merged-mid-dark.png` (the header row
is the fastest tell — in "before" the words `hero` / `tally` sit below `done` / `in play`).

---

## 3. Work items 2 & 3 — the rules guidance

**Collapsed by default, under the action bar.** Closed it is one 2.1em row —
*"› Running a montage test … test tiers · limits · outcomes"* — which is **less height than
the round-tally row §5 deletes**, so the recommended composition is shorter than round 3's
even with the panel added. Reference sits below the instrument, never between the
instrument and its controls. In production this is a real `<details>`/`<summary>`: native
disclosure semantics, keyboard and screen-reader behaviour for free, and it prints
*expanded*, which is the right behaviour for a rules panel on a printed card.

Shots: `sc191-r4-guide-closed-dark.png` · `sc191-r4-guide-open-{dark,light}.png` ·
`sc191-r4-narrow-guide-open-dark.png` · `sc191-r4-guide-open-grey-dark.png`.

### 3.1 The research, and the trap it disarms

**"Difficulty" means two different things in a montage test, and the book uses the same
three words for both.** This is the single most useful thing the research turned up, and
presenting either table without the other is how a Director sets a "hard montage" and then
reads tiers off the hard-*test* row. The panel therefore labels its blocks by **what they
set** — "Each test" and "The montage" — not by the word "difficulty".

I re-derived everything from the book rather than the condensed agent reference, because
this is rules text Scott reads at the table. Primary source:
`steel-etl/input/heroes/Draw Steel Heroes.md`.

**(a) The power-roll tiers — what Scott asked for by name.** §"Test Difficulty" (line
20463), table at line 20471, verbatim:

> | Power Roll | Easy Test Outcomes | Medium Test Outcomes | Hard Test Outcomes |
> |---|---|---|---|
> | ≤11 | Success with a consequence | Failure | Failure with a consequence |
> | 12-16 | Success | Success with a consequence | Failure |
> | 17+ | Success with a reward | Success | Success |
> | Natural 19 or 20 | Success with a reward | Success with a reward | Success with a reward |

and the sentence that makes it countable at all (line 20480):

> "Whenever the rules talk about obtaining a success on a test, that includes a straight
> success, a success with a consequence, or a success with a reward. Whenever the rules
> talk about a failure on a test, that includes a straight failure or a failure with a
> consequence."

The panel carries all four rows (the nat 19–20 row included) and that sentence as the
table's footnote. Note the book says **Medium** in this table and **moderate** in the
Director chapter's prose (§"Test Difficulty", line 28542); the panel uses the table's word.

**(b) That these tiers are per-test and Director-set.** §"Individual Tests in Montage
Tests" (line 21274):

> "The difficulty of each individual test in a montage test is set by the Director and can
> vary from test to test."

**(c) How to set the montage's limits — the "how to set difficulties" quick check.**
§"Montage Test Difficulty" (line 21306), table at 21312:

> | Difficulty | Success Limit | Failure Limit |
> |---|---|---|
> | Easy | 5 | 5 |
> | Moderate | 6 | 4 |
> | Hard | 7 | 3 |

plus the party-size adjustment (lines 21320–21323):

> "For four or fewer heroes, decrease the success limit and failure limits by 1 (to a
> minimum of 2) for every hero fewer than five… For six or more heroes, increase the
> success and failure limits by 1 for every hero more than five."

condensed in the panel to *"For five heroes. ±1 to both per hero over or under five,
minimum 2."*

**(d) The five at-the-table rules that earned a line.** Judged, not dumped — each is
something a Director gets asked mid-montage and cannot derive from the board:

- **Two rounds by default.** §"Limited Rounds" (21302, text at 21304): *"A montage test should last only
  2 montage test rounds… That said, the Director can increase the number of rounds a
  montage test lasts if they wish to create a particularly grueling challenge."*
- **One action each per round.** §"Montage Tests" (21262): *"Once a hero makes a test,
  assists with a test, or uses an ability or other option, they can't do anything else as
  part of the montage test until each other hero involved… does so as well."*
- **No skill twice.** §"Can't Use the Same Skill Twice" (21284, rule at 21286): *"An individual character
  can't use the same skill more than once in a montage test."* (And the skill bonus: an
  applicable skill grants +2 — `reference/draw-steel-agent-reference.md:66`.)
- **An assist is its own roll.** §"Assist a Test" (21190–21192): *"≤11: You get in the way
  or make things worse. The creature takes a bane… 12-16: … an edge… 17+: … a double
  edge."* This one earns its place because the card has an Assist button and nothing on it
  says an assist is *rolled*.
- **The three outcomes and the Victory awards.** §"Montage Test Outcomes" (21325); the two
  award sentences are at 21337 and 21343: *"The heroes earn 1 Victory when they achieve total success on
  an easy or moderate montage test, and 2 Victories on a hard montage test"*; *"The heroes
  earn 1 Victory when they achieve partial success on a hard or moderate montage test."*

**One correction the cross-check produced, worth carrying back.**
`reference/draw-steel-agent-reference.md:98` says *"Total success and hard partial success
award Victories."* That is wrong twice: partial success on a **moderate** montage also
awards 1 Victory, and total success on a **hard** montage awards **2**. The panel and the
outcome band both state the book's numbers. (`reference/draw-steel-reference.md:252-254`
omits Victories entirely, so it is not wrong, only silent.) Fixing the agent reference is
outside this ticket's scope — flagging it for whoever owns `reference/`.

### 3.2 What I deliberately left OUT

Scott said twice this must not eat real estate, so the judgement matters as much as the
inclusion. Rejected, with reasons:

- **"Preparing Montage Tests"** (29046) — write a challenge list at least as long as the
  success limit, pre-author the three outcomes. Genuinely useful, but it is *prep*, and
  this panel is open during play.
- **"Time and Stakes"** (21264) — when a montage is the right tool at all. Same reason.
- **"Montage Twist!"** (29066), **"Introducing More Challenges"** (21296),
  **"New Challenges for Each Test"** (21288) — good Director craft, none of it a rule you
  look up mid-roll.
- **The default consequence/reward** (Malice / hero tokens, 21282). This is the closest
  call in the list, and I left it out of the panel because round 4 gives it a better home:
  it is exactly what the new per-test **note** field is for, and the mock's own sample note
  uses it ("+1 Malice next encounter").
- **Hero-token rerolls** (20482) — a player-side rule, not a Director's.

If Scott wants one more block, the prep list is the one I would add, and it belongs at the
*top* of the panel rather than in the at-the-table column.

### 3.3 Known narrow behaviour

At 300px the four-column tier table cannot narrow legibly, so it scrolls inside its own
`overflow-x` box (visible in `sc191-r4-narrow-guide-open-dark.png` — the Hard column is
off the right edge). That is the standard answer for wide content, but in a *static
screenshot* it can read as clipped. The alternative, if it bothers him, is a column-major
re-lay at narrow (one stacked block per difficulty), which needs a DOM change, not a CSS
one.

---

## 4. Work item 4 — per-test quick notes

Scott: *"if a character makes a test and there is a consequence that the Director wants to
take note of, they should be able to hit the edit button in the cell and type in something
to remember later. The footer portion that shows the outcome should list out these notes."*

**Three surfaces, one flow:**

1. **The sheet gains a Note field** (`sc191-r4-sheet-edit-note-{dark,light}.png`). It is
   multi-line and it is last: last because it is the only optional free-text on a sheet
   where everything else is a tap; multi-line because the thing being typed is a *sentence
   about a consequence*, and a one-line box that scrolls sideways is where those get lost.
   The placeholder is the use case in the Director's own words — *"a consequence to
   remember later…"* — because an empty optional field labelled "Note…" is a field nobody
   fills in.
2. **A noted cell carries a dog-eared page mark**, permanent and never hover-revealed:
   "something is written here" must be true when nobody is pointing at the card, and it is
   the only thing that makes the footer's list findable back on the board. Not a speech
   bubble (reads as "comment from someone else") and not an asterisk (a footnote marker
   points *away*). It is drawn in `--dse-metal` and carries no colour at all — the meaning
   is entirely in the silhouette, so it survives greyscale untouched.
   - **One iteration worth recording.** The first cut put the mark in the cell's top-LEFT,
     the conventional flag corner. Wrong here: a round column is ~159px wide with its
     content centred, so a top-left mark lands ~60px clear of its own cell's content and a
     hair inside the column divider — in the first render, Osric's note mark read as
     belonging to the word "Osric" one column to the left. Both marks now sit at the cell's
     trailing edge, which makes them a rule: **the top-right corner of a cell is where that
     cell's record is annotated and amended.** The trade, stated: a permanent datum now
     shares a corner with a transient control.
3. **The outcome band lists them** (`sc191-r4-merged-mid-dark.png`, "NOTES"). Three
   columns: the result glyph (so the list is scannable for "what went wrong" before a word
   is read), the address back to the board (`Bram · round 2 · lift`), and the note. The
   address column is one line by contract — letting it wrap broke the baseline the whole
   list aligns on, which the first render showed.

**Two sheet bugs fixed on the way**, both the same mistake — a pre-filled dialog asserting
things it cannot know:

- The benign hint *"optional · +2 when applicable"* was painted in `.mt2-sheet__note`,
  which is the **warning** slot (`--dse-warn`, italic). An orange italic line under an
  empty optional field reads as "you did something wrong". Only the skill-reuse rule keeps
  the warning treatment.
- The reuse-guard demo showed *"Lift — already used by Bram"* on the edit of **Bram's
  Lift**, i.e. the guard firing against the record it is editing. Corrected to a skill he
  used in a *different* round, which is the case Draw Steel Heroes:21286 actually forbids.

---

## 5. Work item 5 — the de-duplication (recommendation)

### 5.1 Where the same two numbers were stated

| Statement | Where | Verdict |
|---|---|---|
| `5 / 6 successes`, `2 / 3 failures` | head chips, top right | **deleted** |
| `✓5 ✕2` | the board's bottom-right grand cell | **deleted** |
| `5/6`, `2/3` | the progress band's numeric readout | **deleted** |
| the two tracks | the progress band | **kept, moved into the footer** |
| `1 success from Total`, `1 failure to spare` | verdict stats | **deleted** (the tracks' tails say it) |
| `Total Success at 6 successes.` / `Ends at 3 failures…` | verdict rule lines | **deleted** (a track's length *is* the limit) |
| per-round `✓4 ✕1` | the round-tally foot row | **deleted** |

### 5.2 The recommendation: `merged` — one outcome band, bars kept

`sc191-r4-merged-mid-dark.png` · `-light.png` · `sc191-r4-empty-dark.png` ·
`sc191-r4-done-{dark,light}.png` · `sc191-r4-narrow-mid-dark.png`

Read literally, Scott's bullet is a contradiction: he likes the footer, he likes the bars,
and the bars and the footer are two bands saying one thing. **The resolution is that the
bars were never a second *statement* — they were the footer's missing *instrument*, parked
in a band of its own.** So the two bands become one:

```
row 1   the verdict: crest, "if it ended now", the band word, and the ONE stat that is
        not a tally — hero actions left (or rounds used, when complete)
row 2   successes — label, track, and the distance IN WORDS
row 3   failures  — same
row 4   the one rule the band's own word depends on
row 5   the Director's notes
row 6   the brink alert
```

Each fact is now stated exactly once: successes so far = the track's **fill**; the success
limit = the track's **length**; the distance = the track's **tail sentence**. The `5/6`
numeral goes with the rest, because a track whose length is the limit and whose fill is
progress *already is* the fraction, drawn — keeping the numeral beside it is the same
duplication one scale smaller.

**Two things kept that look like duplicates and are not**, stated so Scott can overrule:

- **The `Round 3 / 3` head chip.** Not a tally. At sidebar width the board's whole round
  header row stands down (`round2.css` @media 420px), so this is the only place the
  montage's length is written.
- **The per-hero Tally column.** Who is carrying the montage and who has burned a failure
  appears nowhere else on the card, and unlike the round columns it is what a Director
  scans when deciding who acts next. The round-tally *foot row* fails the same test twice
  over: its per-round cells restate a five-cell column directly above them, and its grand
  cell was a literal duplicate of the footer set in a **larger type than anything else on
  the board** — so the loudest number on the working surface was the one number the footer
  exists to state.

**A bug the merge exposed, which is a small argument for the merge on its own:** round 3
printed *"1 more ends it"* under a **finished** montage. Nobody caught it because the tail
lived in a band nobody read as part of the result. The tails are now tensed (see
`sc191-r4-done-light.png`: *"the success limit, reached"* / *"1 under the failure limit"*).

### 5.3 The alternative, rendered: `bars-off`

`sc191-r4-barsoff-mid-dark.png`. Scott raised it himself ("they may not be necessary"), so
it is photographed rather than argued about. With the tracks gone the two distances have
nowhere to be *drawn*, so they come back as numerals (`5/6 1 from Total Success` /
`2/3 1 more ends it`) — that is the honest cost of removing the bars, not a punishment. It
is ~1.4em shorter.

**I am not torn, so I am not padding the set: `merged` is the recommendation.** The bars
are the only thing on the card that answers "how close are we?" without arithmetic, which
is one of the four threads the ticket opened with ("rules progress made legible — *1 success
away from Total Success*"). `bars-off` answers it with a subtraction the reader performs.
Take `bars-off` only if the merged band still feels tall.

---

## 6. Work item 6 — what the `Record…` button does

`sc191-r4-sheet-record-dark.png`. Scott has never seen this: the `?sheet=` parameter has
existed since round 2 and no round ever shot it.

**In one sentence: `Record…` opens the same sheet a cell opens, pre-filled with the next
thing that is almost certainly about to happen — so the Director can log an action without
first finding the right cell.**

- **What it is for.** The board's empty sockets are the fast path: three persistent
  ✓ / ✕ / ⊕ buttons in every cell of the round in play, one tap records the common case
  whole. `Record…` is the path for the cases the socket cannot cover — you want to name the
  skill, you want to attach a note, the current round's column is off-screen on a phone, or
  you are recording for a hero out of board order.
- **What it opens.** A modal sheet (a kit `managedModal` in production, the SC-186
  `ConditionsModal` precedent; drawn in place in the mock so it is photographable). Five
  fields: **Hero** (one chip per participant), **Round** (one chip per round), **Result**
  (Success / Failure / Assist, each with its own glyph), **Skill** (optional text), **Note**
  (optional multi-line — new this round). Foot: `Cancel` and `Record`.
- **What it arrives pre-filled with.** The current round, and **the next hero who has not
  yet acted in it** — Kira, in the shot. The title states that choice in words
  (*"Kira · round 3"*, sub-line *"next hero yet to act in the round in play"*), which is
  what makes a pre-filled dialog safe: you can see what it will change before you change
  anything. Result defaults to Success; **Skill and Note arrive empty** (round 3 pre-filled
  a skill — that is the Director's call, not the card's, and it is fixed here).
- **The same sheet in edit mode** is what a cell's pencil chip opens
  (`sc191-r4-sheet-edit-note-dark.png`): identical fields, pre-filled from the existing
  record, plus a danger-styled **Remove**, and the skill-reuse rule firing live as a
  warning under the Skill field. That is Scott's original ticket case ("that 13 was really
  a 17") and now also the note-editing path.
- **What it does NOT do.** It does not roll, it does not advance the round, and it never
  writes anything until `Record` is pressed. `Undo` in the action bar is the escape hatch
  behind it.

---

## 7. Screenshots

All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`.
Dark is primary. Colour names are given in prose because Scott is colourblind; nothing in
these mocks uses hue as the only channel for a state.

| Path | What it shows |
|---|---|
| `sc191-r4-before-mid-dark.png` | **BEFORE** — round 3 verbatim, byte-identical to `sc191-r3-recommended-mid-dark.png`. Both count chips top right, both bands, the round-tally foot row. |
| `sc191-r4-before-mid-light.png` | the same control, light scheme |
| `sc191-r4-merged-mid-dark.png` | **THE RECOMMENDATION**, mid-montage. One outcome band; tracks inside it; notes listed; guidance row collapsed at the foot. Green rings = success, red hatched discs = failure, grey dashed rings = assist, gold band = the brink alert. |
| `sc191-r4-merged-mid-light.png` | the same, light scheme |
| `sc191-r4-empty-dark.png` | **empty** — nothing recorded. Both tracks are empty outlines (6 and 3 sockets), the band says *Not started* with a neutral steel hourglass. |
| `sc191-r4-done-dark.png` / `-light.png` | **finished** — gold trophy, *Total Success*, tensed tails, controls stood down to Reopen + a red Clear all. |
| `sc191-r4-narrow-mid-dark.png` | 300px sidebar leaf. Board re-lays to one band per hero; edit chips and note marks centre on each row's right edge. |
| `sc191-r4-narrow-guide-open-dark.png` | 300px with the guidance expanded — the tier table scrolls in its own box (§3.3). |
| `sc191-r4-guide-closed-dark.png` | the guidance **collapsed by default** — one row, *"› Running a montage test · test tiers · limits · outcomes"*. |
| `sc191-r4-guide-open-dark.png` / `-light.png` | the guidance **expanded**: tier table full width, then the limits table beside the five at-the-table rules. |
| `sc191-r4-sheet-record-dark.png` | **the `Record…` UI**, pre-filled at Kira · round 3 with empty Skill and Note. |
| `sc191-r4-sheet-edit-note-dark.png` / `-light.png` | **the edit-with-note UI** — Bram's round-2 failure, the note filled in, the reuse warning firing in orange under Skill, Remove in red. |
| `sc191-r4-barsoff-mid-dark.png` | the `bars-off` alternative (§5.3). |
| `sc191-r4-menu-dark.png` | the ⋯ overflow open — add a round / add a hero / set limits / Clear all (red, ruled off). |
| `sc191-r4-grey-dark.png` | the recommendation with every hue removed. |
| `sc191-r4-guide-open-grey-dark.png` | the guidance expanded, greyscale. |

Report: `.superpowers/sdd/sc191-montage-overhaul/sc191-round4-report.md` (this file).

---

## 8. Verification

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 185 suites**, 3 snapshots — matches the dispatch expectation exactly |
| `npm run shots` ×2 | **474 PNGs, 0 FAIL**, the two runs **byte-identical** (474/474 sha256 match). In-run gates: chrome placement OK (7 families, 10.00px inset, 0 overlap); chrome host-leak OK (18 combos); **`host-copy pin OK`** (this machine has Obsidian 1.13.7, so not PARTIAL); button host-leak OK (111 kinds × 3 states × dark/light = 666); print-twin parity OK (118 ids); nested corner-radius OK |
| `check-freeze.sh` | **freeze OK — 210/210**, 0 mismatches, exit 0 |
| `npm run parity` (last) | **0 gaps / 0 undeclared warnings / 16 declared deferrals**, exit 0 |

Freeze did not move. Nothing under `visual-harness/sc191/` is in `entry.ts`'s manifest, so
no capture id, no fixture and no `styles-source.css` reach exists by construction. No
display used, no `obsidian-shots`, no shared-baseline edit, no push, no Linear.

---

## 9. Open questions and follow-ups

1. **Confirm `seal = ink` and `space = centre`.** They were never explicitly picked — the
   ledger records them as a working assumption. Everything in round 4 is built on them.
2. **`bars-off` or `merged`?** §5.3. My answer is `merged`; the alternative is rendered.
3. **The note mark now shares the cell's top-right corner with the edit chip** (§4). It
   solves a real orphaning problem, at the cost of putting a permanent datum next to a
   transient control.
4. **The tier table at 300px scrolls sideways** (§3.3). Fixable with a column-major re-lay
   if it bothers him.
5. **`reference/draw-steel-agent-reference.md:98` misstates the Victory awards** (§3.1).
   Not this ticket's file; worth a Backlog item for whoever owns `reference/`.
6. **Still open from round 2, unchanged:** `.dse-head` has no narrow form in this plugin;
   `montageOutcome` returns `'failure'` for an un-started montage (the mock answers it with
   a `pending` band, the fix has to land in `model.ts`); five hardcoded `0.85em` font sizes
   in the `.dse-mt` block are on the SC-185 allowlist and should die with whatever ships;
   production must use `@container` on the element root, not the viewport query the mock
   uses because the page pins `#mount` to a fixed width.
