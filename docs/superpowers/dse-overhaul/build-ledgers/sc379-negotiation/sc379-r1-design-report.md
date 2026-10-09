# SC-379 r1 — negotiation tracker: Steel design candidates (report)

**Executive summary**
- **A, "Offer Ladder":** keeps today's order, but every part is rebuilt in Steel. Patience becomes a pip meter in the band under the head. Interest becomes a framed six-rung ladder: the current rung is outlined with a teal ring, carries a solid teal numeral seal and is tagged "now". The kit tabs stay. A Motivations/Pitfalls dossier sits at the foot.
- **B, "Console":** two panes side by side. On the left, a "standing" panel shows Interest and Patience as two identical notch gauges, a "current offer" card and the six outcomes. On the right, the argument tabs. Each tier row also shows where that result would leave both values (for example "→ I4 · P2").
- **C, "Standing Board":** one board with rows 5 to 0. The Interest column holds the six outcomes. The Patience column is a steel "thermometer" that rises from a floor bulb at 0. Both values read as positions on one scale. The appeal and mention toggles move onto the dossier rows, so the duplicate second checkbox list goes away. The Learn test folds into a collapsible panel under the argument, closed by default.
- **Recommendation: C.** It is the only candidate that fixes all three structural faults at once:
  - two different visual idioms for the same 0–5 kind of value;
  - two motivation checkbox lists with different meanings;
  - nothing showing how close the negotiation is to its end.
- C also repeats the montage choices Scott accepted: structure and data merged, and reference rules in a collapsible panel that starts closed. A is the low-risk fallback. B is the densest, but it hides the outcomes at sidebar width.
- None of the three needs a YAML or model change. Every one of them moves all 6 of negotiation's frozen print lines and nothing else's.

Shots: steel-dark and steel-light, wide = 760px (the harness's own `#mount` width), narrow = 300px. All are in this directory as
`sc379-r1-<before|A|B|C>-<default|learn|ended>-<dark|light>[-narrow].png`.
- **Default state:** Interest 3, Patience 3. Peace has already been appealed to (spent). Higher Authority is ticked for this argument. The 12–16 tier is chosen.
- **Ended state:** Patience 0 at Interest 3, so the final offer stands. Both motivations are spent.
- **Before shots:** the real element in the real harness, driven into the default state by real clicks.
- **Mocks:** `draw-steel-elements/visual-harness/sc379/` (`mock.html?cand=A|B|C&state=…&bg=…&width=…`). The camera is `node visual-harness/sc379/shoot-sc379.mjs <outDir>`, with `dist/` built by `npm run shots -- --element=negotiation`.

## Shared vocabulary (all three candidates)

All three candidates share this vocabulary, so a pick between them is about structure only.

**Shell**
- **Plate:** the shipped Steel card plate on the element root.
- **Retired from the root:** the 0.03em letter-spacing on every glyph, and the corner hairline pair left over from before the plate.
- **Head:** the kit cardHead with the montage-style heraldic crest (a Lucide handshake in a steel shield). The crest drops at sidebar width, the same way montage drops it. The ⋮ menu sits top right, unchanged.

**State colors, each paired with a non-color channel**
- **Current value:** a teal ring (`--dse-accent`, bright teal #4db8c7 in dark, deep teal #2a7b88 in light). Every time, it is paired with a second channel:
  - a solid teal seal holding the numeral, or
  - the word "now" in a small outlined tag, or
  - a change from hollow to filled.
- **Remaining vs. spent:**
  - Remaining patience: steel-grey metal-gradient fill (light silver in dark mode, gunmetal in light mode).
  - Spent or empty slots: a hollow dashed grey outline.
  - So the fill carries the state, not the hue.
- **Ended:**
  - A gold flag icon and a 2px gold top rule (`--dse-vp`, warm gold #e0b050 in dark, dark bronze #66450a in light).
  - The words "Final offer" / "Negotiation over".
  - One sentence quoting the outcome.

**Motivations vs. pitfalls: a shape pair, not a hue pair**
- A motivation is a solid diamond ◆ in near-white steel. A spent motivation becomes a hollow diamond ◇, its name is struck through, and it gets the word "spent".
- A pitfall is a warning-triangle icon in orange (`--dse-warn` #e8954a). The orange only reinforces the triangle.
- Each group also has its own labelled column.

**Chosen tier row**
- The shipped selected state is a sunken wash that is nearly invisible (see `sc379-r1-before-default-dark.png`, the 12–16 row).
- The candidates draw a teal ring all round the row, a check mark, and the word "chosen". At 300px only the ring and the check remain.
- The tier rows themselves are the unchanged kit power-roll grammar:
  - ≤11: red, notched-left badge;
  - 12–16: amber, plain badge;
  - 17+: green, arrow-right badge;
  - crit: gold, arrow-and-bar badge.
- The badge shapes and the printed ranges carry the tier, so the hue is never needed.

**Controls**
- Appeal, mention and spent are the shipped `.dse-optchip` pressed-chip grammar: when pressed, a teal border all round, a check icon and bold text. The same chip is used in the montage form and the Conditions modal.
- The three modifiers keep the themed Steel checkbox. A greyed-out modifier now says why in an italic hint: "only when a spent Motivation is appealed to" or "not while a Motivation is appealed to".
- **Complete Argument:**
  - Becomes the kit accent (teal-filled) button once a tier is chosen; it stays a ghost button until then.
  - A hint beside it says what it does: "Applies the chosen tier to Interest and Patience" / "Choose the test result to complete the argument".

**Keyboard**
- Every new clickable value (pip, rung, notch, board cell) is a real `<button role="radio">` inside a `role="radiogroup"` with roving `tabindex`, the same contract the kit's selectable power roll already meets.

**Model**
- No YAML change in any candidate. The ended band and B's projections are both derived from `current_interest` / `current_patience` and the existing `ArgumentPowerRoll`.

## A — "Offer Ladder"

`sc379-r1-A-default-dark.png` · `-learn-dark` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What it is.** Today's top-to-bottom order, rebuilt in Steel:
1. **Head.**
2. **Patience band:** a sunken strip with an hourglass glyph and the label "PATIENCE". Then a round "0" floor stop and five pips: filled steel-grey up to the current value, dashed hollow above it, with a teal ring on the current pip. Then a large "3 / 5" readout.
3. **Interest ladder:** a framed board in montage-board materials (a dark header band, steel hairlines between rows). The header reads "INTEREST" and "what the NPC will agree to". There are six rungs from 5 down to 0, each with a round numeral seal and the outcome line. The current rung is raised and teal-ringed, its seal is filled solid teal, and it is tagged "now". The tag becomes "⚑ final offer" when the negotiation has ended.
4. **The kit tabs.** Inside "Make an Argument", top to bottom:
   - "APPEALS TO MOTIVATION" chips (◆/◇) and "MENTIONS PITFALL" chips (triangle);
   - the MODIFIERS block;
   - the power roll;
   - the Complete footer.

   Learn is the intro text plus the static 3-tier roll, unchanged.
5. **The dossier:** two cards. MOTIVATIONS shows "1 of 2 open", and each row has a "Mark spent" / "✓ Spent" chip. PITFALLS shows "1 known".
6. **Ended:** a gold-ruled "FINAL OFFER" band sits between the ladder and the tabs.

**At a glance.** The current outcome, worded, outlined in teal on the ladder. Patience as a pip count with a numeral.

**Kit reused:** cardHead + crest, iconButton, tabs, powerRollPanel (selectable and static), `.dse-optchip`, the Steel checkbox.

**New parts:**
- a pip-meter radiogroup;
- the ladder rung (a button row with a seal);
- the dossier row;
- the end band;
- a stronger selected state for the power roll's checked row. This one is kit-level, but selectable mode has exactly one consumer, so in practice it is negotiation-only.

**Size:** medium.
- Rewrite `PatienceInterestView` and `MotivationsPitfallsView`. Change the chip markup in `ArgumentView`.
- Replace the roughly 230-line negotiation CSS block (styles-source.css:2485–2712 and :11235–11265) with about 350 lines.
- Update the negotiation DOM tests.
- About one implementation slice, plus review.

**At 300px** (`-narrow`): holds.
- The crest drops and the name wraps cleanly.
- The pips move to their own full-width line under the label and readout.
- The current rung stacks its "now" tag under the text.
- The tab labels wrap to two lines (they also do today).
- The dossier cards stack.

**Weakness:**
- It is still two idioms for two 0–5 values: a horizontal meter and a vertical ladder. It is the most conservative candidate.
- It is the longest card. The duplicate "appeal" and "spent" motivation controls remain: they are clearer now, but there are still two of them.

## B — "Console"

`sc379-r1-B-default-dark.png` · `-learn-dark` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What it is.** Two panes at wide widths, stacked below a 560px container width.

**Left pane: a sunken STANDING panel**
- Interest and Patience as two identical six-notch gauges, numbered 0–5:
  - 0 is a solid floor stop;
  - notches up to the value are filled steel-grey;
  - notches above it are dashed and hollow;
  - the current notch has a teal ring.

  Each gauge has a large numeral readout ("3 / 5").
- Between the gauges, a teal-bordered "CURRENT OFFER · Interest 3" card quoting the outcome. It becomes a gold-ruled "⚑ FINAL OFFER" card when the negotiation has ended.
- An "All six outcomes" collapsible, open at wide widths and closed at sidebar width.

**Right pane: the kit tabs** (same contents as A)
- Each tier row of the power roll also carries a boxed projection, for example "→ I4 · P2": the resulting Interest and Patience, clamped to 0–5.

**Below:** the dossier, as in A.

**At a glance.** Two equal gauges, so the two values read as the same kind of thing. The current offer, quoted. And for each possible roll, where the negotiation would land, before Complete is clicked.

**Kit reused:** as in A, plus the kit collapsible.

**New parts:**
- the notch gauge (one part used twice);
- the offer card;
- **a new kit option on powerRollPanel, a per-row trailing "projection" slot.** It is off by default, so no other consumer moves.
- the two-pane grid with its container query.

**Size:** medium-large. A's work, plus the kit option and its tests, plus the two-pane layout.

**At 300px:** holds.
- The panes stack, so Standing comes first, then the tabs.
- The outcomes list collapses, leaving only the current offer visible.
- On a crowded tier row, the projection chip wraps under the text.

**Weakness:**
- At sidebar width, five of the six outcomes are behind a click. That cuts against "predictable lookup".
- The projection chip is new information on screen, though not a new function. It is the one place a candidate says something today's tracker doesn't, so Scott may count it as scope.
- Interest appears twice at wide widths (the gauge and the outcome list).

## C — "Standing Board" (recommended)

`sc379-r1-C-default-dark.png` · `-learn-dark` · `-ended-dark` · `-default-light` · `-default-dark-narrow`

**What it is.**
1. **One board, three columns, six rows** (values 5 to 0, top to bottom):
   - **Key column:** monospace numerals on a dim header-band ground.
   - **Interest column:** the six outcomes. Each cell is a radio button. The current cell is teal-ringed, bold, and tagged "now" ("⚑ final offer" when ended).
   - **Patience column:** a steel thermometer. A silver bulb sits in the 0 row. A continuous steel-grey bar rises from it to the current value, with a rounded, teal-ringed top. Above that is a dashed empty channel. Each cell is a radio button. When Patience reaches 0, the bulb goes hollow and wears the ring.
   - **Header row:** "INTEREST 3" and "PATIENCE 3".
2. **End band:** in the ended state, the gold-ruled band sits under the board.
3. **One "Make an Argument" section on a raised panel. No tabs.**
   - The dossier's MOTIVATIONS rows carry **Appeal / ✓ Appealed** and **Mark spent / ✓ Spent** chips side by side, so each motivation's two states sit on one line. The PITFALLS rows carry **Mention / ✓ Mentioned**.
   - Then MODIFIERS, the power roll, and Complete.
4. **"Learn Motivation/Pitfall":** a kit collapsible under the section, closed by default, with a right-hand hint "test · reveals one on 17+". Open, it shows the identical intro and static 3-tier roll.

**At a glance.** One scale with two markers on it. The Director sees "Interest at 3, Patience at 3, three arguments of patience left before the final offer", and what each Interest step means, without reading two different widgets. Each motivation's status (open, appealed now, spent) is one line in one place.

**Kit reused:** cardHead + crest, iconButton, powerRollPanel, `.dse-optchip`, the Steel checkbox, collapsible.

**New parts:**
- the board grid: two radiogroup columns, plus a key column;
- the thermometer cell;
- dossier rows with action chips;
- the end band;
- the selected-row emphasis (as in A).

**Size:** large. The largest of the three, mostly the restructure, not the CSS.
- Merge `PatienceInterestView` into one board view, with two radiogroups whose arrow keys run *down* each column.
- Move the appeal and mention toggles out of `ArgumentView` into the dossier, and delete the second motivations list.
- `NegotiationView` swaps `tabs()` for `collapsible()`. The session slot `tab` becomes the collapsible's open-state slot (still session-only, never written to the note).
- Rewrite the DOM tests.
- About 2 slices, plus review.

**At 300px** (`-narrow`): holds.
- The key column shrinks to 1.9em and the Patience column to 3.4em (the thermometer narrows; the header reads "PATIENCE 3").
- The outcome text wraps to 2–4 lines per row, so the board is taller but nothing clips.
- The "now" tag stacks under the current outcome.
- The dossier cards stack, and the chips wrap inside them.

**Weakness:**
- Putting Patience on the same rows as the outcomes *could* be misread as tying a patience level to that row's outcome. The column header and the thermometer form are meant to break that reading, but it is the bet this candidate makes.
- The tabs are gone: Learn becomes a collapsible panel. Content and reachability are unchanged, but it is a structural change Scott should approve explicitly. If he wants the tabs back, C works with the tabs restored around the argument section.
- Highest implementation cost.

## Print impact (all candidates)

**Negotiation's own lines:** every candidate replaces negotiation's DOM, so all 6 of its frozen print lines move. Those are `negotiation`, `negotiation-checked` and `negotiation-pr-checked`, each in `--steel-print` and `--steel-realprint`. This calls for a sanctioned rebaseline at implementation time.

**No other element's print should move:**
- The candidates' rules are negotiation-scoped.
- The reused shared rules (`.dse-optchip`, the Steel checkbox, `.dse-collapse`, `.dse-tabs`, `.dse-pr`) are consumed, not edited.
- The two kit-level touches are safe:
  - The selected-row emphasis keys on `button.dse-pr__row[aria-checked]`, and negotiation is the selectable mode's only consumer.
  - B's projection is an opt-in option.

**Unknown, decided in the implementation spec:** whether each candidate's ended band and teal states print. The montage precedent prints its outcome band.

## Critique of today's tracker (vs DESIGN.md and the landed montage, initiative and project trackers)

Evidence: `sc379-r1-before-default-{dark,light}.png`, `…-dark-narrow.png`.

**Head and frame**
- **Not a designed composition.** The montage has a crest, a board in metal-line materials and small-caps metal headers. Negotiation has none of those. "Patience" and "Interest" are bold body text, and the root still carries the pre-plate corner hairlines plus a 0.03em tracking on every glyph, which makes the body text look spaced out next to every sibling.

**Patience and Interest**
- **Patience reads inverted.** Bubbles at or below the value render as dark-filled discs with near-invisible numerals, and the two above it are the bright ones. At Patience 3, the eye lands on 4 and 5 (dark mode and light mode alike).
- **Interest marks the current rung with a 20px teal blur.** It is a glow (styles-source.css:2625), and DESIGN.md reserves glow for the logo. It is also hue plus blur only, and blurry for a colourblind reader.
- **Interest fades the rungs *below* the current one** (`data-reached`, :2634). Faded reads as "gone or irrelevant", but those are the still-possible worse outcomes.
- **Two idioms for one kind of 0–5 value:** a horizontal connector track running 0→5 left to right, and a vertical ladder running 5→0 top to bottom. They also run in opposite directions.
- **Hard to read mid-session:** nothing says which outcome is current except the blur. Nothing says how many arguments are left, and nothing signals the end (Patience 0, or Interest 0 or 5).

**Motivations and pitfalls**
- **The two motivation checkbox lists mean different things, and nothing labels the difference.** "Appeals to Motivation" means *in this argument*; "Motivations" at the foot means *already appealed to*. Ticking the wrong one silently changes which tier table applies.
- **Motivations and pitfalls differ only by their header text.** The identical layout means the warning ("this auto-fails") has no visual weight.

**Argument tab**
- **Weak selected state:** the chosen tier row is a barely darker wash (the before shot's 12–16 row). The Complete button stays a quiet ghost button far below the rows.
- **Greyed-out modifiers don't say why.** "Reuses a Motivation…" sits faint with no explanation.
- **Tier rows are about 60px tall for a five-word result.** The Learn tab's long intro has the same visual weight as the live tool.

**At 300px**
- The six Patience bubbles overlap each other.
- The motivation checkboxes sit on their own line above the names, and "Higher Authorit / y" breaks mid-word.
- The ladder connector misaligns with the wrapped rungs.

## Follow-ups

Not built; for the owner to triage.

1. **No clamp on Complete Argument.** `ArgumentView.ts:266-267` adds the tier deltas straight to `current_interest` / `current_patience`.
   - Failure: Patience 0 plus any −1 tier gives −1. Interest 5 plus a crit gives 6. Interest 0 plus a pitfall gives −1.
   - Result: no bubble renders as pressed, and the out-of-range value is written to the note.
   - Fix: clamp to 0..5 in `completeArgument`.
2. **No end-of-negotiation signal.** The tracker never says that Interest 0 or 5, or Patience 0, ends the negotiation, and Complete stays armed afterwards. All three candidates show a derived end band. The owner should rule whether that is in scope for the overhaul or a separate ticket.
3. **The tier rows only recompute when the note write echoes back and the block re-renders.** In the browser harness, ticking "Higher Authority" leaves the shown tiers at the plain-argument table (−1/−1, −1 P, +1/−1, +1 I; the before shots show this). The view's own comment says it relies on that echo.
   - In Obsidian the note write normally re-renders the block, but nothing visible updates without it.
   - Verify in the D8 sidebar host and in canvas. If the echo can be missing, recompute in place.
4. **Possible rules mismatch in the tooltip.** The "Appeals to Motivation" tooltip says the test becomes **Easy** (`ArgumentView.ts:78`). `reference/draw-steel-agent-reference.md:858` says an argument that matches an unused motivation gets **medium** difficulty. Check the book; this is rules text the Director trusts.
5. **The harness's main sweep viewport is 900×1200** (`shoot.mjs:4941`), while element screenshots run taller than that. `montage-narrow--steel-dark.png` (600×4226 px at DPR 2, 2113 CSS px) ends mid-card at "Talin", with the lower part blank. This round's camera hit the same failure until its viewport was raised.
   - Any capture over 1200 CSS px tall is suspect, including frozen print lines.
   - Fix: size the viewport to the element, or use a clip-based full-page capture.
6. **Kit gap: the selectable powerRollPanel's checked state is near-invisible** (`.dse-pr__row[aria-checked='true']` at styles-source.css:14247 is a sunken wash with a 1px border). It needs a ring-plus-mark checked state. Negotiation is the only consumer today; D5's roll-result highlight is a separate channel.
7. **Kit gap: no shared pip/notch track.** The montage success/failure tracks, the recoveries strip and all three candidates each hand-roll a "filled metal / hollow dashed / current ring" row of slots. A kit `trackSlots()` part would make them consistent and keyboard-uniform.
8. **Mock-only literal:** the board key column's dim ground in C uses two new rgba washes (sc379.css, `.n3c-key`), next to the montage header-band literals. Implementation should take a token for it, not copy the literal.
