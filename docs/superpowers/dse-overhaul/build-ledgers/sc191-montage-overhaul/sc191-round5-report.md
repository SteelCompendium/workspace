# SC-191 round 5 — equal-width tracks, tier cheat sheet, the rename, no ghost lane

**Status: design prototype only. Nothing here ships.** No production element code, no
`styles-source.css` edit, no new harness fixture, no new capture id. Battery green (§7).

```
Rebased onto   origin/develop 1619396 (SC-190, then SC-120 §D2) — clean, no conflicts
Post-rebase    ea97089   (the round-4 design tip, replayed)
Round-5 commit 6991108   SC-191 round 5 — equal-width tracks, tier cheat sheet, the rename, no ghost lane
Not pushed.

Mock page   draw-steel-elements/visual-harness/sc191/{mock5.html,mock5.js,round5.css}
Camera      draw-steel-elements/visual-harness/sc191/shoot-sc191-r5.mjs  <outDir>
Regenerate  devbox run -- bash -c 'cd <repo>/draw-steel-elements && npm run harness:build \
              && node visual-harness/sc191/shoot-sc191-r5.mjs <outDir>'
```

`npm ci` was NOT needed — `git diff c09cf6f 1619396 -- package.json package-lock.json` is
empty, and `node_modules/` survived from round 4.

Rounds 1–4's files are untouched. `round5.css` layers on `round4.css` on `round3.css` on
`round2.css`, and **every round-5 change — CSS *and* DOM — is gated on `data-r5='on'` /
`opts.r5`.**

---

## 0. The control is provably honest, and the rebase moved nothing

`?r5=off` is meant to reproduce round 4's `merged` card exactly. Verified rather than
asserted, against the PNGs Scott actually reviewed:

```
sc191-r5-before-mid-dark.png   23c337306673c891a1ef14ed374cfa1fbbeb3a44c3805d8e7d24e9ed14d19a6c
sc191-r4-merged-mid-dark.png     (same hash)
sc191-r5-before-mid-light.png  77112a6c4de5414054ca8cfbf53c0ce53923e481097cb9621d21327dedbfc3e6
sc191-r4-merged-mid-light.png    (same hash)
sc191-r5-before-done-dark.png  3e96bb7e32f0d8617dcbe8cf12b9c247b1257ee9cb55aaf75d5325c26be6f678
sc191-r4-done-dark.png           (same hash)
```

That triple does double duty. It proves the before/after pair is not flattered, **and** it
proves that SC-190 + SC-120 §D2 (twelve display families rebuilt in Steel, a sanctioned
24-line rebaseline) moved **zero pixels** in the montage's rendering — the hashes were
produced on the rebased tree against a freshly built `dist/harness.css`. Re-confirmed a
third time after `npm run parity` rebuilt the harness bundle: all 25 round-5 PNGs
byte-identical across the two runs.

---

## 1. Task 1 — equal-width tracks

> "I want to tweak the two tracks so they are the same horizontal width: even if there are
> 5 cells in 'success' and 3 in 'failure', either one reaching max results in the end of the
> montage so they should be the same width. That means the cells for failure are going to be
> wider"

**Scott is correcting a category error, and it inverts round 4's stated reasoning** — worth
recording, because round 4 argued the opposite in writing. Round 4 gave the slots a **fixed
width** (`flex: 0 0 1.55em`) precisely so the 3-slot failure bar would be drawn half the
6-slot success bar, on the argument that "a track's LENGTH states the Director's limit".
That argument only holds if the two limits are two quantities on **one** scale. They are
not: they are two independent gauges that share one meaning — filling either one ends the
montage. Drawing them at different lengths says *failure is a smaller thing than success*,
which is backwards; three failures end the montage every bit as completely as six successes
end it. Equal width says the true thing, and makes the only comparison that means anything
here — **fill fraction** — a direct visual one.

The mechanism inverts with the meaning: **round 5 fixes the TRACK and lets the slots divide
it.**

- `--mt5-trackw: 10.7em` — deliberately round 4's *success* track width to the pixel
  (6 × 1.55em slots + 5 × 0.28em gaps). The success reading Scott approved does not move;
  only failure grows to meet it.
- The `.mt2-prog` grid's middle column changes from `auto` to that fixed track, which is
  what puts **both tail sentences on one common x**. Under `auto` each tail started wherever
  its own track happened to end — the ragged edge visible in the round-4 shots.
- Failure tiles land at ~3.4em each, ~2.2× a success tile. "One failure costs twice what one
  success buys" is now a statement the drawing makes.

Evidence: `sc191-r5-before-mid-dark.png` vs `sc191-r5-tracks-mid-dark.png` (and the same
pair at `-done-`). Fastest tell: in "before" the failure bar stops halfway and its tail
sentence starts ~185px left of the success tail; after, both tails start at the same x.

**One bug this exposed and fixed.** §1's three-column rule lives outside the 420px media
query and in a *later* sheet than round 4's narrow re-lay, so at equal specificity it won
the cascade and the 10.7em fixed column ran straight off the right edge of a 300px leaf. The
narrow re-lay is now restated in round 5's own sheet (`round5.css` §5), and the slots are
`flex-wrap: nowrap` there so a 3-slot track cannot fold into two rows and stop being one
gauge. `sc191-r5-narrow-mid-dark.png`.

---

## 2. Task 2 — the tier cheat-sheet strip

> "I have the feeling the 'Each test' section will want to be seen all the time by a lot of
> Directors while the other rule information is a 'check it once at the beginning and then
> close it' situation. Im debating how I want to handle this. My leading though is to
> additionally have a button that will open (expand) a stylized version of the
> test-outcome-per-difficulty information above the table that isnt super obtuse (like a
> cheat sheet). Seems a little clunky, but I really think we need to do something. What do
> you think?"

**My answer to "what do you think": you are right, and it is not clunky if the strip is a
different instrument rather than the same table drawn twice.** The foot panel's version is
the book's table *transcribed*. The strip is a **lookup**, and the two differ in three ways
that each earn their keep:

1. **It is transposed.** The book runs power-roll rows × difficulty columns. A lookup is
   indexed by the thing you already know, and at the table the Director knows the difficulty
   **first** — they set it when they framed the test — and learns the roll second. So the
   strip is one row per difficulty, read across to the band the roll landed in. Two
   orientations would be a genuine hazard if both were visible at once; §2.2 is why they
   never are.
2. **It is drawn, not written.** Every cell is the board's own **ink seal** — a green ring
   with a check for a success, a red hatched press with an X for a failure — so a Director
   who has learned to read a cell has already learned to read the cheat sheet. That is the
   "stylized … not super obtuse" ask, answered by reusing a vocabulary rather than inventing
   one.
3. **It drops the book's fourth row.** "Natural 19 or 20" gives the same answer in all three
   columns, so as a row of the strip it is three identical cells stating one sentence. It
   stays in the foot panel (§2.2).

**Colour is the third channel, never the first.** Ring style (solid vs. pressed/hatched) +
glyph shape (check vs. X) + the rider **word** carry every cell before hue does anything.
Colour names for the record: success = a **green** ring with a green check; failure = a
**red** ring over a dark hatched press with a red X; riders and difficulty labels are
**grey/steel**; nothing else in the strip is coloured at all.
Greyscale proof: `sc191-r5-cheat-open-grey-dark.png` — every cell still reads.

Shots: `sc191-r5-cheat-closed-{dark,light}.png` · `sc191-r5-cheat-open-{dark,light}.png` ·
`sc191-r5-cheat-narrow-dark.png` · `sc191-r5-cheat-open-grey-dark.png`.

### 2.1 Where the toggle lives — both rendered, and the argument

The owner's lean was "the board's header row". I built and shot **two** candidates, because
the choice has a real cost either way:

| | `handle` — **recommended** | `chip` — the alternative |
|---|---|---|
| Closed | one 1.9em disclosure row above the board: *"› Test tiers … easy · medium · hard"* | nothing at all; a small `Test tiers ›` chip in the card head's right stack, under the round chip |
| Open | the strip drops out of the row that opened it | the strip appears above the board, three bands from the control |
| Shots | `sc191-r5-cheat-{closed,open}-dark.png` | `sc191-r5-cheat-chip-{closed,open}-dark.png` |

**I recommend `handle`, and the argument is Scott's own word "clunky".** A disclosure whose
content appears somewhere other than at its handle is exactly what feels clunky — you press
a chip in the header and something happens two bands away. `handle` also:

- **reuses the foot panel's idiom exactly** — same twisty (one glyph rotated, never two
  swapped), same small-caps hint on the right, same hairline. The card ends up with **one**
  disclosure grammar used twice, bracketing the instrument: a rule + handle above the board,
  a rule + handle below the controls. Two different mechanisms would have been the clunky
  outcome;
- **is a legend even when closed** — the hint reads *easy · medium · hard*, so the closed row
  says what is inside rather than only that something is;
- **survives 300px**, where the head's right lane is already a stack of chips and a control
  in it collides with the round chip.

`chip`'s one real advantage is that it costs zero height closed. That is worth ~1.9em, and
the strip is a pin — a Director who wants it will open it once and never see the closed
state again, so the height it saves is height nobody is paying.

I did **not** put the toggle inside the board's own column-header row. Those four cells are
column labels (`Hero` + a "+", three round heads, `Tally`); the corner is 6.2em wide and
already carries two things, and a control in a label cell is what made round 4 have to draw
the ghost lane a second hairline just to stop it reading as part of the Tally column.

### 2.2 The strip is a PIN, and it makes the foot panel stand down

Closed is the first-run state; once opened it stays open (in production, a persisted
per-element preference, the same shape as the chrome panel's collapse state, SC-169).

**With the strip pinned, the foot panel's "Each test" block collapses** — dedup is round 4's
standing principle and it does not stop applying because the duplicate is a rules table.
Pinned, that block becomes three lines: its title, *"The tier table is pinned above the
board."*, and the one fact the strip deliberately omits — *"A natural 19 or 20 is always a
success with a reward, at every difficulty."* The panel's own summary hint also drops the
words it no longer delivers: *test tiers · limits · outcomes* → *limits · outcomes · at the
table*.

Net effect: the nine cells are stated **once**, at full size, in whichever surface is open —
and the two orientations (§2, point 1) are never both on screen.
Pair: `sc191-r5-guide-open-dark.png` (strip closed, full book table) vs
`sc191-r5-guide-open-pinned-dark.png` (strip pinned, block stood down).

### 2.3 Narrow: it degrades, it does not side-scroll

At 300px the rider words cannot share a ~60px cell with a seal. Instead of scrolling, the
strip **hands off to a second channel already in the DOM**: a one-letter mark riding the
seal (`c` = with a consequence, `r` = with a reward, both in steel grey, mono, bold) plus a
legend line under the grid — `c with a consequence · r with a reward`. Exactly one of the
two mechanisms is visible at any width, so nothing is ever ambiguous and nothing moves
sideways. `sc191-r5-cheat-narrow-dark.png`.

This is a deliberate contrast with the foot panel's four-column tier table, which still
side-scrolls at 300px (round 4 §3.3, settled, not reworked). If Scott ever wants that fixed,
the strip is the proof that a column-major degrade is the answer.

### 2.4 Rules provenance

Unchanged from round 4's research, re-derived from the book, not the agent reference.
Primary source `steel-etl/input/heroes/Draw Steel Heroes.md`:

- **:20471** the Test Difficulty Outcomes table — the three rows the strip draws, transposed.
- **:20480** *"Whenever the rules talk about obtaining a success on a test, that includes a
  straight success, a success with a consequence, or a success with a reward…"* — the strip's
  footnote, and the reason a "success with a consequence" cell is not a half-success.
- **:20471** row 4 (nat 19–20) — the row the strip omits and the panel keeps.
- **:21190** the assist is its own roll — why the rename's noun is "action", not "test" (§4).

Still open from round 4 and not this ticket's file:
`reference/draw-steel-agent-reference.md:98` misstates the Victory awards.

---

## 3. Task 3 — the sheet's tier hint

The sheet is the **adjudication moment**: the Director has a number and a difficulty and has
to decide which of three chips to press. So the Result field carries the one line that
decision needs — where each difficulty's success *starts*:

> success starts at   easy ≤11   medium 12–16   hard 17+

The riders (consequence, reward) are deliberately **not** here: they do not change which chip
you press, so they stay upstairs on the strip.

**It cannot regress into a warning.** Round 4 had to un-paint a benign hint out of
`.mt2-sheet__note` (the warn slot: `--dse-warn`, italic) because *"optional · +2 when
applicable"* under an empty field read as "you did something wrong". Round 5 does not reuse
that class at all — `.mt5-sheet__tierhint` is its own element with its own quiet treatment
(faint, upright, a hairline above it, the lead in steel small-caps), so the bug has no route
back. The three tiers are also one `nowrap` group, so if the line ever wraps it wraps after
the lead, never between "medium" and "hard".

Shots: `sc191-r5-sheet-log-{dark,light}.png` (the log sheet) ·
`sc191-r5-sheet-edit-dark.png` (the correct sheet, hint present, reuse warning still
correctly orange under Skill — the one thing that *is* a warning).

---

## 4. Task 4 — the rename: `Record…` → **`Log an action…`**

> "'record' button functionality is fine, although it feels a bit out of place at the
> bottom… not sure there is a better home for it. The 'record' label on the button is really
> confusing though. Lets change that to something else."

Placement unchanged (Scott accepted the bottom bar). The label is now **`Log an action…`**.

**Why "record" is confusing — two faults at once, which is why it reads as *confusing*
rather than merely wrong.**

1. **Verb/noun double duty on a card made of records.** "Record" beside a board full of
   recorded results parses as a *label for them* before it parses as an instruction. The
   button appears to name the table.
2. **The audio connotation arrives before the word is read.** A button called Record, with a
   round glyph on it, is the universal control for starting a recording.

**Why the noun is "action", not "test".** The owner floated *"Log a test…"* / *"Add a
test…"*. Both are wrong on the same fact: **the sheet writes successes, failures AND
assists, and an assist is not a test** — the book gives it its own roll and it produces no
tally (`Draw Steel Heroes:21190`). "A test" would mislabel a third of what the button does.
The card already has the right noun and has been using it all along: the head's deck line
says *"one action each per round"*, and the per-row control's label has always been *"…an
action for <hero>"*. So the rename **reconciles four surfaces onto one existing noun** rather
than inventing a fifth.

**Why the verb is "log", not "add".** "Add" is already spoken for three times on this card —
*add a round*, *add a hero*, and the bare "+" glyph they share — and round 2 has a recorded
bug from exactly that collision (an assist cell read as an empty slot with an add button in
it). "Log" collides with nothing here, has no noun sense on this card, and is precisely what
the Director is doing: writing down what just happened. The ellipsis stays: it is the
convention for "this opens a dialog", and it is what separates this control from the cell
sockets, which record in one tap with no dialog.

**Every surface reconciled** (all gated on `r5`, so the "before" still says Record):

| Surface | Before | After |
|---|---|---|
| action-bar primary button | `Record…` | **`Log an action…`** |
| sheet `aria-label` (new) | `Record an action` | `Log an action` |
| sheet `aria-label` (edit) | `Correct a recorded action` | `Correct a logged action` |
| sheet eyebrow | `Record an action` | `Log an action` |
| sheet commit button | `Record` | **`Log`** |
| per-row control aria / title | `Record an action for Kira` / `Record for Kira` | `Log an action for Kira` / `Log for Kira` |
| the three cell sockets' aria | `Record a success/failure/assist…` | `Log a success/failure/assist…` |
| empty cell aria | `…: not recorded — record` | `…: nothing logged — log an action` |

**Edit mode keeps "Correct" / "Save"** — correcting a logged action is a different act from
logging one, and it is the act Scott's original ticket case names ("that 13 was really a
17").

**The "+" glyph stays on the bar button and the row control.** It is still an addition (an
entry joining a log), and swapping it for the pencil would collide with the cell's
correct-affordance. Flagging it because round 2's collision note is the reason to look
twice; if Scott wants the bar button's glyph changed, that is a one-line follow-up.

Shots: `sc191-r5-bar-renamed-dark.png` (the bar) · `sc191-r5-sheet-log-dark.png` (the
sheet's eyebrow and its `Log` commit button) · every `tracks-*` shot carries the bar too.

---

## 5. Task 5 — the "+" ghost lane is gone

> "Some of the screenshots from this round had a '+' column to the left of the 'tally' column
> - what is that, why do we need it, can we remove it?"

**What it was:** a 1.9em ghost column sitting past the last round with a "+" in its head —
the add-a-round affordance, introduced in round 2 on the theory that a Director extending the
montage looks for the control *where the next round would physically go* rather than in a
menu.

**Why it goes.** The fact that Scott had to ask is most of the answer, and it failed on its
own terms three more times:

- **It never read as a column.** Round 4 had to give it a second hairline just to stop the
  header reading as "+ tally", i.e. as an add button belonging to the Tally column.
- **It stands down entirely at sidebar width** (`round2.css` @media 420px), so the ⋯ menu
  was already the real path on the surface where controls are scarcest.
- **It spent a permanent column of the board's width on the rarest control on the card.**

Removed **from the DOM**, not hidden — a `display: none` grid item still consumes a slot in
`--mt2-cols` and shears every later row by a column, the same footgun the round-tally row's
deletion documented. The track list and the cells now agree at three sites (header, body,
foot). Nothing structural broke: the board is one column narrower and the remaining columns
absorb the space.

"Add a round" now lives in the ⋯ overflow alone, beside "add a hero" and "set limits", which
is where the other once-a-session controls already are: `sc191-r5-menu-dark.png`.

---

## 6. Screenshots

All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`.
Dark is primary. Colour names are given in prose because Scott is colourblind; nothing in
these mocks uses hue as the only channel for a state.

| Path | What it shows |
|---|---|
| `sc191-r5-before-mid-dark.png` | **BEFORE** — round 4's `merged`, byte-identical to `sc191-r4-merged-mid-dark.png`. Failure track half the success track; ragged tails; the "+" ghost lane left of Tally; `Record…` in the bar. |
| `sc191-r5-before-mid-light.png` | the same control, light scheme |
| `sc191-r5-before-done-dark.png` | the same control, finished montage (the equal-width pair's other half) |
| `sc191-r5-tracks-mid-dark.png` | **AFTER** — equal-width tracks, tails on one x, no ghost lane, `Log an action…`. Green rings = success, red hatched discs = failure, grey dashed rings = assist, gold band = the brink alert. |
| `sc191-r5-tracks-mid-light.png` | the same, light scheme |
| `sc191-r5-tracks-done-dark.png` / `-light.png` | finished — gold trophy, *Total Success*, tensed tails, equal-width tracks, controls stood down to Reopen + a red Clear all |
| `sc191-r5-empty-dark.png` | nothing recorded — both tracks empty outlines at equal width (6 and 3 sockets), neutral steel hourglass, *Not started* |
| `sc191-r5-cheat-closed-dark.png` / `-light.png` | the strip **closed** (first-run) — one row, *"› Test tiers … easy · medium · hard"* |
| `sc191-r5-cheat-open-dark.png` / `-light.png` | the strip **pinned** — three difficulty rows × three roll bands in the board's seal language, with the counting footnote |
| `sc191-r5-cheat-narrow-dark.png` | 300px — the strip degrades to seals + `c`/`r` marks + a legend; no side-scroll; tracks fit the leaf |
| `sc191-r5-cheat-open-grey-dark.png` | **the greyscale proof** — the strip with every hue removed |
| `sc191-r5-cheat-chip-closed-dark.png` / `-open-dark.png` | the **alternative** toggle home: a `Test tiers ›` chip in the card head (§2.1) |
| `sc191-r5-guide-open-dark.png` | the foot panel open, strip closed — the full four-row book table |
| `sc191-r5-guide-open-pinned-dark.png` | the foot panel open **with the strip pinned** — "Each test" stood down to a pointer + the nat 19–20 line; the summary hint drops "test tiers" |
| `sc191-r5-bar-renamed-dark.png` | the renamed primary control in the action bar |
| `sc191-r5-sheet-log-dark.png` / `-light.png` | the **log** sheet — `Log an action` eyebrow, the quiet tier hint under Result, `Log` as the commit button |
| `sc191-r5-sheet-edit-dark.png` | the **correct** sheet — same tier hint, plus the skill-reuse rule firing as a real warning (orange) under Skill and Remove in red |
| `sc191-r5-narrow-mid-dark.png` | 300px sidebar leaf without the strip — tracks fit, lane gone |
| `sc191-r5-menu-dark.png` | the ⋯ overflow open — "Add a round" in its only remaining home |
| `sc191-r5-grey-dark.png` | the whole recommended card with every hue removed |

Report: `.superpowers/sdd/sc191-montage-overhaul/sc191-round5-report.md` (this file).

---

## 7. Verification

Expected numbers read from `.claude/skills/dse-verify/SKILL.md` at the SC-120 §D2 landing
entry (2026-08-29), which is the newest entry and matches this branch's base
`origin/develop 1619396`. Round 4's numbers (jest 3257 / 185 suites) are stale and were not
used.

| Gate | Expected (skill, SC-120 landing) | Measured |
|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** |
| `npm run lint` | clean | **clean, exit 0** |
| `npx jest` (after `rm -f main.js styles.css`) | 3394 passed / 1 skipped / 3395 | **3394 passed / 1 skipped / 3395 total, 189 suites passed + 1 skipped, 3 snapshots, exit 0** |
| `npm run shots` ×2 | 0 FAIL, deterministic | **474 PNGs, 474 `ok`, 0 FAIL; the two runs byte-identical (474/474 sha256 match)** |
| `check-freeze.sh` | 210/210, 0 mismatches | **`freeze OK (210/210 …)`, 0 mismatches, exit 0** |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED | **0 gaps / 0 undeclared warnings / 16 declared deferrals, exit 0** |

In-run gates inside `npm run shots`, all OK: chrome placement (7 families, 10.00px inset, 0
overlap); chrome host-leak (18 combos); **`host-copy pin OK`** (this machine has Obsidian
1.13.7 — not PARTIAL); button host-leak (111 kinds × 3 states × dark/light = 666);
print-twin parity (118 ids); nested corner-radius OK.

**Freeze did not move**, and could not: nothing under `visual-harness/sc191/` is in
`entry.ts`'s manifest, so no capture id, no fixture and no `styles-source.css` reach exists
by construction. No display used, no `obsidian-shots`, no shared-baseline edit, no push, no
tracker.

---

## 8. Open questions and follow-ups

1. **`handle` or `chip` for the cheat sheet's toggle?** §2.1. My answer is `handle`; both are
   rendered so it is a look, not an argument.
2. **The dedup direction, if Scott disagrees.** Round 5 makes the *foot panel* yield when the
   strip is pinned. The opposite policy — leave the panel whole and let the strip be a pure
   duplicate — is one boolean away, but it restates nine cells twice and puts the book's two
   orientations on screen together.
3. **The bar button keeps the "+" glyph** under the new "Log" verb (§4). Defensible, but it
   is the one surface the rename did not fully re-derive.
4. **Carried from round 4, untouched by design:** the foot panel's tier table still
   side-scrolls at 300px (§2.3 shows the alternative pattern working); the note mark shares
   the cell's top-right corner with the edit chip; `reference/draw-steel-agent-reference.md:98`
   misstates the montage Victory awards.
5. **Carried from round 2, unchanged:** `.dse-head` has no narrow form in this plugin;
   `montageOutcome` returns `'failure'` for an un-started montage (the mock answers it with a
   `pending` band; the fix has to land in `model.ts`); five hardcoded `0.85em` font sizes in
   the `.dse-mt` block are on the SC-185 allowlist and should die with whatever ships;
   production must use `@container` on the element root, not the viewport query the mock uses
   because the page pins `#mount` to a fixed width.
