# SC-191 decisions ledger — montage element overhaul

Scott's rulings, verbatim and dated. Orchestrator-maintained; agents read this INSTEAD
of the Linear thread. Strikethrough = superseded.

## 2026-08-22 — ticket intent
Make the montage element "more specialized kinda like what we did for the `ds-stamina`
element." Four threads: a 2-axis tracker (rounds × success/failure), montage info /
description, rules progress made legible ("1 success away from Total Success"), and a
"total" column showing progress toward the goal. Everything in High-Fantasy Steel. He
asked explicitly for **ideas and screenshots before implementation**.

## 2026-08-25 — round-1 ruling: Option 3 (Muster Board) is the direction
> "after seeing option 1, i think its a bit clunky and wastes a lot of space.
>
> Option 2 certainly catches the eye the most and it was my immediate choice, but after
> looking at it, I think its actually a bit confusing to use - how does the Director
> enter info into this? I imagine its the bottom part which almost feels like a footer
> rather than the focal point.
>
> Option 3 on the other hand had the opposite reaction: i immediately thought it looked
> overwhelming, boring, and like its design was simplistic and an afterthought.  After
> looking at it more, I think the simple design is actually the biggest feature: its easy
> to figure out how to use this design and it merges the data and structure together.  I
> think this general approach is what I want to iterate on for a bit.  The biggest thing
> holding this back is that its super ugly and stale looking.  I think we can drop the
> last column: the "skills used" are already available to read in the other columns.
> Please make a bunch of screenshots of ways to make option 3 more visually appealing.  I
> also want you to consider where interaction buttons will go.  For example, if we need an
> "add" or "clear" button to actually make this thing functional, them make sure its
> included in the design - i dont want to need to hand-jam buttons in later after we
> realized we missed something"

~~Candidate A "Muster Rail" (the literal 2-axis sketch)~~ — superseded: clunky, wastes space.
~~Candidate B "Twin Channel" (was the round-1 recommendation)~~ — superseded: eye-catching
but the data-entry path is unclear; its input area reads as a footer, not the focal point.
~~Candidate C's "skills used" column~~ — superseded: drop it, the data is readable in the
other columns.

Standing constraints from this ruling (bind every later round):
- **Keep C's structural virtue**: simple, legible, data and structure merged, obvious how
  to use. Do not trade that away for visual richness.
- **The problem to solve is purely visual** — "super ugly and stale looking."
- **Interaction affordances are part of the design, not a later addition.** Wherever add /
  clear / edit controls need to live, they must appear in the mocks now.
- Deliver **multiple** visual treatments as screenshots, not one refinement.

## 2026-08-26 — round-2 ruling: `roster` is the base; iterate on named defects

> "Im not 100% sold on any of these. Here are my rambling thoughts
>
> The `tray` design is nice because it somehow feels that the focal point is balanced on
> what actually matters - that central table that draws the eye, for example. That said,
> there is a lot here that feels noisy and off.  There are lines everywhere, especially the
> dashed lines separating all the cells just feels like overkill.  The cells themselves
> looks nice with the dark background, but the borders look terrible: im not sure whats
> going on with the cut off corners of the cells, but its a bad choice.  The hero name
> cells look pretty good here: if we are having some kind of crest, I think these dark,
> simply crests are better than the loud crests of `roster`
>
> the `set` design isnt doing much for me - it feels like a ton of text and give
> spreadsheet vibes.  The hero name cells lacking a crest are nice though… Im on the fence
> about whether we keep the crests or not. They seem like noise
>
> The `roster` design has a lot going for it and I think is likely a solid base to iterate.
> The biggest offenders are the bright white elements: the crest for each hero draws the
> eye so much to something that doesnt provide any value.  The Test result circles are also
> super bright and draw the eye a lot.  Im not sure if these were intended to be for the
> light theme and there was a mix-up maybe?  Id be curious to see a dark-theme version of
> these circles.  Other than that, I think I want to see some spacing cleanup within the
> table: a lot of text components seem to be lacking some padding or maybe they should be
> centered aligned or something.  Just needs a bit of a refinement pass.  I think I want to
> see some variants of all the things ive brought up here so I can decide.
>
> In all cases, the "add a hero" row is a waste of space.  That button should be moved to
> the top-left "Heroes" header cell as a little "plus" button or something."

~~`tray` and `set` as whole compositions~~ — superseded: **`roster` is the base to iterate.**

Binding constraints (all later rounds):
- **UNIVERSAL, not a variant:** the "add a hero" ROW is deleted; the affordance becomes a
  small "+" in the top-left "Heroes" header cell.
- **Bright white must go.** Roster's per-hero crest and the test-result circles both draw
  the eye to low-value content. **Investigate whether the circles are a genuine light/dark
  mix-up (a bug) before treating it as taste** — Scott explicitly suspects one.
- **Carried from `tray` (adopt):** central table as the balanced focal point; the
  dark/simple crest treatment IF crests survive at all; its hero-name cells.
- **Rejected from `tray`:** lines everywhere, dashed cell separators (overkill), and the
  cut-off cell corners ("a bad choice").
- **Rejected from `set`:** the composition (text-heavy, "spreadsheet vibes"). **Adopted from
  `set`:** crest-less hero name cells read well.
- **OPEN — needs a variant set, not a guess:** keep crests at all? Scott is explicitly on
  the fence ("They seem like noise"). Show dark-simple crest vs no crest.
- Spacing/alignment refinement pass inside the table (padding, possible centre-alignment).
- **Deliver variants per axis** so he can decide axis-by-axis, not one blended proposal.

Still binding from 2026-08-25: keep option 3's structural virtue (simple, legible, obvious
how to use); the problem is visual; interaction affordances must appear in the mocks now.

## 2026-08-28 — round-3 ruling: no crests; round 4 = dedupe, padding, rules guidance, notes

> "* Overall looking good
> * I think I want hero name cells to not have any crests to save some space
> * Still looks like there are a few padding issues on some of the header/footer rows.  Also the edit button in a cell needs some padding/margin
> * I think it would be nice to have some guidance available for how to run the montage, specifically the rules for montage test power roll tiers for the difficulties.  This would likely take a bit of screen real-estate so maybe it should be collapable and collapsed by default.
> * There might be other information that would be useful to a Director to help them run the Montage Test.  Im not sure what that might be, so please just do a quick check.  Maybe guidance on how to set difficulties or something if thats in the rulebook.  Again, that shouldnt take up a bunch of screen real estate
> * Edit button should allow quick notes for a test. For example, if a character makes a test and there is a consequence that the Director wants to take note of, they should be able to hit the edit button in the cell and type in something to remember later.  The footer portion that shows the outcome should list out these notes
> * Under the table there is a progress tracker and under that is an overall result footer.  The card has so many places that show the same information (namely the success/failure/round tallies).  We dont need all these places showing that information. I like the footer showing the outcome information.  I also like the visual of the two tracker bars for success/failure, but they may not be necessary.  Lets clean up the UI to avoid all the duplication.
> * Can you also give me a summary of what the "record" button does (and let me see its UI if there is a dedicated modal or something)"

Resolved axes:
- **Crests: `none` — decided.** ("hero name cells to not have any crests to save some space")
- Seal (`ink`) and spacing (`centre`) were not explicitly picked, but every bullet responds
  to the recommended composite (no-crest + ink + centre) and the verdict is "Overall looking
  good" — **working assumption: ink seals + centre spacing stand.** Flag the assumption in
  the round-4 comment so Scott can correct it.

New round-4 scope (all bullets above, distilled):
1. Padding fixes: header/footer rows; the in-cell edit button needs padding/margin.
2. **Collapsible rules guidance, collapsed by default**: montage test power-roll tiers for
   the difficulties. Research the actual rulebook text.
3. Quick rulebook check for other Director-useful info (e.g. how to set difficulties) —
   minimal screen real estate.
4. **Edit button gains quick notes per test** (consequence the Director wants to remember);
   the outcome footer lists these notes.
5. **De-duplicate the tallies.** Keep the outcome footer. The two success/failure tracker
   bars are liked visually "but they may not be necessary" — remove duplication; footer is
   the survivor.
6. Deliver a **summary of what the "record" button does + screenshots of its UI**
   (modal/sheet) alongside the mocks.

Still binding: option-3 structural virtue (simple, legible, obvious); interaction
affordances appear in mocks now; add-a-hero row deleted, "+" in Heroes header cell;
no bright-white elements; polarity-correct seals; deliver variants where a call is open.

## 2026-08-29 — round-4 ruling: `merged` picked; equal-width tracks; tier cheat-sheet; rename Record; kill the "+" column

> "* the `merged` design looks great.  I want to tweak the two tracks so they are the same horizontal width: even if there are 5 cells in "success" and 3 in "failure", either one reaching max results in the end of the montage so they should be the same width.  That means the cells for failure are going to be wider
> * The collapsed rules guidance looks good.  I have the feeling the "Each test" section will want to be seen all the time by a lot of Directors while the other rule information is a "check it once at the beginning and then close it" situation.  Im debating how I want to handle this.  My leading though is to additionally have a button that will open (expand) a stylized version of the test-outcome-per-difficulty information above the table that isnt super obtuse (like a cheat sheet).  Seems a little clunky, but I really think we need to do something. What do you think?
> * "record" button functionality is fine, although it feels a bit out of place at the bottom… not sure there is a better home for it.  The "record" label on the button is really confusing though.  Lets change that to something else.
> * Some of the screenshots from this round had a "+" column to the left of the "tally" column - what is that, why do we need it, can we remove it?"

Resolved:
- **Outcome band: `merged` — decided** ("looks great"). ~~`bars-off`~~ superseded.
- **Tracks must be the SAME horizontal width** — either limit ending the montage makes them
  equivalent scales, so failure cells get wider when the failure limit is lower.
- **Ink seals + centre spacing now implicitly confirmed twice** (no objection in two rounds
  of "looks great"); treat as settled.
- The two round-4 judgment calls (note mark in the cell's top-right; tier table
  side-scrolling at 300px) drew no objection — they stand as-is unless reopened.

Open / new round-5 scope:
- **Tier cheat-sheet:** Scott's leading thought is an additional button that expands "a
  stylized version of the test-outcome-per-difficulty information above the table … (like a
  cheat sheet)"; he called it possibly clunky and asked for our opinion ("What do you
  think?"). Deliver a position + mocks, not just compliance.
- **Rename the `Record…` button** — "the 'record' label … is really confusing." Placement
  at the bottom is accepted for lack of a better home ("not sure there is a better home").
- **The "+" column left of Tally** (the add-a-round ghost lane from round 2): explain what
  it is, and remove it if it doesn't earn its place — the ⋯ menu already carries
  "add a round".

## 2026-08-29 (19:46) — round-5 ruling: `handle` picked; round 6 = flip tier table to Power Roll orientation; consequence/reward marks

> "We are getting closer!
>
> * The `handle` design is great, lets go with that
> * I think its worth flipping the "test tiers" table so that tiers are on the rows and
>   difficulty is on the columns.  That way it matches the Power Roll UI elements.  Maybe we
>   can even bring in the colored gradient background of the Power Roll tier element into the
>   table?
> * Each cell in the "test tiers" table should additionally reflect "with consequence" and
>   "with reward".  Not sure the best way to handle this.  Immediate thought for "success
>   with reward" was to use the double-check icon.  Not sure if there is an equivalent for
>   "success with consequence" and "failure with consequence".  Maybe going with an approach
>   of having a picture-in-picture (pip) approach by adding a small icon in the bottom corner
>   could work.  What ideas do you have?
> *"

Resolved:
- **Cheat-sheet toggle: `handle` — decided** ("is great, lets go with that").
  ~~`chip`~~ superseded.
- The round-5 dedup behavior (foot panel's "Each test" block stands down while strip is
  pinned), the `Log an action…` rename, equal-width tracks, and the "+"-lane removal drew
  no objection — they stand.

Round-6 scope (cheat-sheet strip refinement):
1. **Flip the tier-table orientation**: tiers on ROWS, difficulty on COLUMNS — to match the
   Power Roll UI elements. "Maybe we can even bring in the colored gradient background of
   the Power Roll tier element into the table?" — explore that.
2. **Every cell reflects "with consequence" / "with reward".** Scott's immediate thought:
   double-check icon for "success with reward"; unsure of equivalents for "success with
   consequence" / "failure with consequence"; floated a picture-in-picture (pip) small icon
   in the bottom corner. He asked "What ideas do you have?" — deliver a position + variant
   mocks, not just compliance. (Colorblind rule: shape must carry every distinction; color
   may reinforce but never solo.)

## 2026-08-30 (01:24 UTC) — round-6 ruling: `pip` wins; design is SETTLED; implement

> "* Power roll tiers look great.  The actual chips (or whatever you call them) for the
>   `12-16`, `17+`, etc are a bit stretched horizontally.  Please make their padding similar
>   to actual power rolls.  I dont need to approve this change - just make it so.
> * I think the triangles are the strongest, but I dont love how basic they are.  Maybe some
>   color?  Maybe a gradient? maybe a border?  Idk, pick a solid option.  i dont really want
>   to go back-and-forth again.  Im ready  to get this ticket finished"

Resolved:
- **Rider mark: `pip` (triangle) — decided.** ~~`ring`~~ ~~`double`~~ superseded.
- **The pip gets a richer treatment (color / gradient / border) chosen by US, one option,
  no further approval round.** Colorblind rule still binds: the ▲/▼ shape and the written
  words carry the meaning; color/gradient/border only decorate.
- **Tier-band badges (`≤11`, `12–16`, `17+`, crit) in the strip are stretched horizontally
  — match their padding to the shipped Power Roll badge.** Explicitly no approval needed.
- No veto on: the flipped strip, the `edge` wash (~~`pr` wash~~ superseded), the crit row
  staying, the round-5/6 dedup behavior. All stand.
- **DESIGN IS SETTLED. No more mock rounds.** The remaining work is implementation of the
  settled design in the shipped montage element, reviewed and gated, then land-ready.
  Scott: "i dont really want to go back-and-forth again. Im ready to get this ticket
  finished." Any genuinely open question during implementation gets answered by the
  mocks + ledger first; only a real product/data-model decision goes back to Scott, and
  batched.

## Owner rulings on deferred findings (ticket-owner, not Scott — recorded per pipeline §5)

- 2026-09-02, slice-2 follow-up "user-docs scope tension between the brief and the
  working-preferences deferral rule": **dropped** — no deferral ships; slice 4 writes the
  user docs before land-ready, so nothing reaches users undocumented.
- 2026-09-02, slice-2 follow-up "temporary test-coverage gap for cx.roll / chrome-menu
  until slice 4": **dropped** — by design of the slice plan (spec §I); slice 4's acceptance
  includes those tests.
- 2026-09-02, review-1 findings (report sc191-review1-report.md). **Fix round 1 folds:**
  H-1, H-2, M-1, M-2, M-3, M-4, M-5, L-1, L-2, L-3, L-4, L-6, I-5 (widening file for the
  10 new montage print lines), I-8 (complete-band rule line must match the outcome; the
  mock's copy was wrong). **Dropped:** L-5 (orphan-hero entries: entries are created
  through the slice-4 UI where the hero always exists; hand-authored orphans still show
  their notes in the band, the more valuable surface); I-1 (YAML block-scalar
  normalisation is semantically identical); I-2 (2.01x vs a 2.2x estimate); I-3 (track
  proportion nuance vs mock, not visible at review); I-4 (greyscale is verified manually
  at review, no capture-id churn); I-6 (read-only renders disabled+badged affordances —
  that IS Scott's "explicit read-only states" rule, which overrides spec §C-7's "zero");
  I-7 (shared harness print-ink artifact, identical on other elements). No Backlog
  tickets earned.
- 2026-09-02, fix-1 follow-ups: L-3 lacks a dedicated `participants: []` omission test;
  L-4's note-sort fix has no fixture distinguishing roster from alphabetical order.
  **Folded into slice 3** as two one-test additions (same area, trivial). No ticket.
- 2026-09-02, slice-3 follow-ups: (1) spec §G says "six" rider cells, book/mock say seven
  and StripView transcribes the book — **dropped**, spec-text nit, code is right; (2)
  host-copy pin stale vs Obsidian 1.14.0 — **dropped here**, owned by SC-202 (pin bump
  landing on develop first; SC-191 rebases after); (3) devbox swallows `$?` inside
  `bash -c` — **dropped**, already the adapter's documented footgun §8.1 (workers run
  exit-code-sensitive gates via plain bash/node with output to files). No tickets.
- 2026-09-03, slice-4 extras: Drive-by (BoardView: an entry with an unrecognised
  `result` is now editable via the cell click) — **accepted**, in-scope, reviewer sees it
  in the diff. Follow-up (harness `Modal` shim has no positioning/backdrop chrome) —
  **Backlog ticket filed, linked to SC-191** (shared harness infra; costs someone time
  later). Out of scope for review 2 / any fix round.
- 2026-09-03, slice-4 follow-ups (relayed): **FOLDED into fix round 2** — the settled mock's
  bottom bar and done-state bar were dropped by a spec omission, not by any Scott ruling
  (he approved rounds 4–6 screenshots showing them), and the shipped model NEVER advances
  `current_round` (only parse/reset touch it), so the Director cannot leave round 1:
  (1) "End round N" bar button = the round-advance control (mock6.js:1460);
  (2) "Undo" bar button = remove the most recently logged entry (mock6.js:1459);
  (3) done-state bar "Reopen" + danger "Clear all" (mock6.js:1424-1425; spec §F `done`
  fixture "bar stood down to Reopen + Clear all");
  (4) "Clear all" is REMOVED from the ⋯ menu (4 items: add a round / add a hero / set
  limits… / Reset progress) and lives only in the done-state bar, sharing the reset
  implementation — two ⋯ labels for one action was the confusion. Spec §D's five-item
  list is corrected by this ruling. The harness Modal-shim follow-up is SC-294 (filed).
- 2026-09-03, review-2 findings (report sc191-review2-report.md). **Fix round 3 folds:** H-1
  (strip has no print layout), M-1 (per-row chip live on a complete montage; writes at
  round = rounds+1), M-2 (entries serialise out of §B.5 key order on fresh/old-shape path),
  M-3/M-4 (sheet: difficulty words on the tier hint; subject-line title instead of a
  repeated eyebrow), L-1 (sheet CSS comment claims a Steel scoping gate it lacks), L-2
  (strip's screen-state hint prints), L-3 (done-state bar keeps Undo — a mis-logged
  winning action must stay undoable), L-4 (sheet skill hint from the mock), L-5 (docs YAML
  example shape), L-6 (user docs say tallies are stored, never recomputed), I-3 (sheet open
  leaks a permanent closer). **I-1** (YAML comments in the block don't survive the first
  write): fixer confirms on 69eb5f7 whether pre-existing framework behaviour — if yes,
  dropped as pre-existing (stringifyYaml drops comments plugin-wide); if new, folded.
  **Dropped:** I-2 (SC-294), I-4 (brightest light values are kit chrome, not montage
  CSS), I-5 (host-leak sweep — the re-gate runs it), I-6 (spec §G text, already ruled).
  Fix 3 is COMBINED with the SC-202 re-gate (rebase onto 9227dd9 first).
- 2026-09-04, fix-3 extras: I-1 confirmed pre-existing plugin-wide (parse/stringify drop
  YAML comments) — **dropped** as ruled. Follow-up "dark print ground on every
  *--steel-print.png" — **dropped**, pre-existing and documented in dse-verify. The
  implementer's refusal of a harness reminder to add AI-attribution trailers is correct
  (Scott's global CLAUDE.md forbids them) — no action.
- 2026-09-04, re-review-2 findings (report sc191-rereview2-report.md, reviewer-L, verdict
  FIX-ROUND-4). **Fix round 4 folds both:** M-A (MEDIUM — print pip paints nothing: the
  print `::after` rule at styles-source.css:5081-5085 supplies geometry only; the fill lives
  in the Steel tier opened at :4078 with `:not([data-dse-print="on"])`; fix = add
  `background: var(--dse-vp)` to the print `::after` rule, proven live -> rgb(138,106,0);
  the strip test must assert the print pip HAS a fill, not only that it lacks
  `--dse-metal-line`), and 2c (LOW — round header "IN PLAY" on a limit-ended montage:
  BoardView.ts:316-320 keys off current_round alone while the cell path and the settled
  mock mock6.js:1703-1706 both gate on complete; fix = `if (montageTallies(this.model)
  .complete) return 'past';` at BoardView.ts:316). Both move print bytes -> freeze package
  (rebaseline.txt, widening.txt, 3 after-crops) regenerated from the fix-4 tree. Nothing
  dropped, no tickets earned. Fix-3 report correction noted (a new GROUP-2 plain-field
  rule at styles-source.css:15234-15241, not a pure rename) — correct as shipped, no action.

## 2026-09-04 (13:55 UTC) — implementation-review ruling: SANCTIONED + APPROVED TO LAND

> "Approved, lets land it"

Resolved:
- **Freeze-baseline change SANCTIONED**: the 2 montage print lines (`rebaseline.txt`, both
  `c8493be6b39a3fc6df213ae659c37733a945e1c1ac06184b5bbdfb93ac9085d7`) and the 14 new
  montage print lines (`widening.txt`). The dispatcher applies them at landing with the
  dated backup + dated record in dse-verify's SKILL.md.
- **Shipped element approved for landing as-is** at `c2a5cec` on `origin/develop`
  `9227dd9`. No change requests. Ticket is LAND-READY; landing is the dispatcher's move.
