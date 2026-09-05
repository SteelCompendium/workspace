# SC-191 round 6 — the tier strip flipped to Power Roll orientation; the rider marks

**Status: design prototype only. Nothing here ships.** No production element code, no
`styles-source.css` edit, no new harness fixture, no new capture id. Battery green (§8).

```
Rebased onto   origin/develop 778a341 (SC-195 squad captain minion pool) — clean, no conflicts
Post-rebase    9f01036   (the round-5 design tip, replayed)
Round-6 commit 951d679   SC-191 round 6 — the tier strip flipped to Power Roll orientation, and the rider marks
Not pushed.

Mock page   draw-steel-elements/visual-harness/sc191/{mock6.html,mock6.js,round6.css}
Camera      draw-steel-elements/visual-harness/sc191/shoot-sc191-r6.mjs  <outDir>
Regenerate  devbox run -- bash -c 'cd <repo>/draw-steel-elements && npm run harness:build \
              && node visual-harness/sc191/shoot-sc191-r6.mjs <outDir>'
```

**Executive summary.** The `chip` toggle is retired; `handle` is the only design in the
round-6 mock set. The strip is flipped to bands-as-rows × difficulty-as-columns — and not
merely transposed: it **adopts** the Power Roll component (the shipped `.dse-pr__badge`
clip-path key boxes as row labels, the shipped `.dse-pr__row` tier edge + wash as the rows,
`.dse-pr`'s well as the container). The flip earns back the book's fourth row (the crit
tier), so the strip now carries the whole table. **Recommended rider treatment: `pip`** — the
seal is untouched and a solid ▲/▼ rides its bottom-right corner; the rider is *orthogonal* to
the outcome in the book, so it must be a second channel and not a glyph substitution, which is
exactly why the double-check has no "failure with a consequence" equivalent. **Gradient call:
`edge`** — the shipped 60% fade tints Easy and not Hard, which reads as a column difference
that means nothing (visible in the light pair); `edge` keeps hue, edge and direction and dies
in the badge gutter. **Foot-panel-flip call: nothing to flip** — the book's table is already
bands-rows × difficulty-columns and the panel has transcribed it that way since round 4; the
strip was the transposed one, so one change puts strip, panel, book and sheet-hint on one
grammar. Post-rebase `9f01036`, final `951d679`. Gates: tsc/lint clean, jest 3491 passed / 1
skipped / 189 suites (brief expected "all green"; +97 vs round 5, from SC-195), shots **478**
PNGs 0 FAIL twice byte-identical (brief expected 474 — SC-195 added 4), freeze **210/210** OK,
parity **0 gaps / 0 undeclared / 16 declared** OK. 30 screenshots + this report, paths in §7.

---

## 0. The control is provably honest, and the rebase moved nothing

`?r6=off` is meant to reproduce round 5's `handle` strip exactly. Verified rather than
asserted, against the PNGs Scott actually reviewed:

```
sc191-r6-before-open-dark.png    1e92b08cc6a0f005218dabed8617b4c0fa03225085cada7ebbfd9a0d9d4b7f5e
sc191-r5-cheat-open-dark.png       (same hash)
sc191-r6-before-open-light.png   862d285a4c0df6908842bc003782639174d1357d566adaaecf17a6773867a449
sc191-r5-cheat-open-light.png      (same hash)
```

That pair does double duty. It proves the before/after comparison is not flattered, **and** it
proves SC-195 moved **zero pixels** in the montage's rendering — the hashes were produced on
the rebased tree against a freshly built `dist/harness.css`, and re-shooting round 5's own
camera there reproduced the archived round-5 shots byte-for-byte too.

**It also caught a real bug, which is the reason to keep doing it.** `buildCard` writes
`data-treat='roster'` on the card root — round 2's composition axis, the selector for a
~1,500-line block in `round2.css`. My first cut wrote the rider treatment into that same
attribute, silently overwriting it: the roster block stopped matching, the card lost 55px of
height and the board lost its frame, its in-play column wash and its round seals — on
**every** round-6 shot including the `?r6=off` control. Nothing errored; both cards looked
plausible in isolation. The hash check against round 5 is what surfaced it. The attribute is
now `data-r6treat`, with the near-miss written into the mock beside it. All 30 shots below are
post-fix, and both camera runs are byte-identical (30/30).

---

## 1. Task 1 — `chip` is retired

> "The `handle` design is great, lets go with that"

`mock6.js` has no `?cheat=` axis, no `chip` branch in `head()` or the strip renderer, and
never emits `.mt5-headtoggle`; `round6.css` has no head-toggle rules. The round-6 mock set
shows one design.

**One deliberate exception, flagged rather than smuggled:** `mock5.js` / `round5.css` still
contain the `chip` code. Rounds 1–5's files have never been edited in place — that invariant
is precisely what lets `?r6=off` produce the round-5 card from round 5's own code path (§0),
and editing them would make the round-5 shot set unreproducible. If you want the dead code
physically gone rather than merely unreachable, it is a one-commit follow-up; it costs the
byte-identical control.

---

## 2. Task 2 — the flip, and what it turned out to be

> "I think its worth flipping the 'test tiers' table so that tiers are on the rows and
> difficulty is on the columns. That way it matches the Power Roll UI elements. Maybe we can
> even bring in the colored gradient background of the Power Roll tier element into the
> table?"

### 2.1 Scott is right, and he is overturning round 5's stated argument

Worth recording, because round 5 argued the opposite in writing. Round 5 transposed the book's
table on the reasoning that "a lookup is indexed by the thing you already know, and at the
table the Director knows the difficulty first." That is true about the *order of knowing* and
irrelevant to the *layout*: row heads and column heads cost the same to find. What round 5
traded away for that non-gain is the one thing this card cannot buy anywhere else — the
Director's **already-learned** reading of the Power Roll element. Every ability, every
negotiation and every test in this plugin draws ≤11 / 12-16 / 17+ / crit as four stacked tier
rows with a clip-path key box on the left. A cheat sheet that draws the same three numbers the
other way round makes the reader re-derive a table they can already read.

### 2.2 So the flip is not a transpose — it is an **adoption**

I went further than a gradient, because the rhyme gets stronger the more of the real component
the strip uses. Three things are now the shipped article, not a lookalike:

| Strip part | What it actually is |
|---|---|
| the well | `.dse-pr`'s treatment (`styles-source.css:7116`) — sunken, hairline, radius, `overflow: hidden`. The clip is load-bearing: it is what cuts the tier edges and washes square at the corners. |
| each row | `.dse-pr__row`'s recipe (`:7206`) quoted verbatim — `--t` per tier, `border-left: 3px solid var(--t)`, hairline top rule, `background-image: linear-gradient(90deg, var(--tw), transparent …)`, with the same per-tier `--tw` static values and the same light twins (`:7247`, `:7265`). |
| each row's label | the **shipped `.dse-pr__badge .dse-pr__badge--tN`** — real clip-path polygon, real `--dse-tier-*` fill, and the exact strings `powerRollPanel.ts` writes (`≤11`, `12-16`, `17+`, `crit`). |

Compare `sc191-r6-powerroll-dark.png` (the real Power Roll element, hand-built to
`powerRollPanel.ts`'s DOM under the same element/theme root) with `sc191-r6-strip-pip-dark.png`.
They are the same instrument.

Two mechanical notes on the badge reuse:

- **The one local override is `width`, and it is safe.** The shipped badge is `3em`, sized for
  an ability card's full-width row; the strip's key column is narrower and its four labels must
  align in one column. Every term in those four clip-path polygons is either a `0.2em`/`0.4em`
  corner inset, a `1px`/`0.41px` hairline, or a `100%`/`50%` edge — so a width change stretches
  only the straight runs and leaves every notch, bevel and chevron point at its authored size.
  Nothing else is touched: not the fill, not `line-height: 1` (SC-10's strikethrough fix), not
  the t1 `::first-letter` mono re-home (SC-121 B-3).
- **`color-mix()` is deliberately NOT used.** The wash is the static `--tw` rgba twin, because
  the plugin's floor is Chromium 106 and a `var()`-bearing `color-mix()` computes to nothing
  there (SC-160 / SC-171). A prototype of a rule that cannot ship is not a prototype.

### 2.3 The fourth row comes back, and the flip is what earns it

Round 5 dropped the book's "Natural 19–20" row: as a fourth *difficulty* row it was three
identical cells bolted onto a three-row table. Flipped, it is the **crit tier** — and the Power
Roll element always draws four tiers, so omitting it would break the very rhyme this round
exists to build. Its three identical cells now say something: *at a natural 19–20 the
difficulty stops mattering.*

The strip therefore carries the **whole** book table for the first time. That is what lets the
pinned foot-panel block stop being "a pointer plus an orphan line" and become a pointer (§4).

The badge reads `crit` rather than `nat 19–20` — the string `powerRollPanel.ts` writes, so the
two components spell the tier identically — and the strip's footnote spells it out once:
*"…A crit is a natural 19 or 20."*

### 2.4 The gradient call: **`edge`**, and the reason is measurable

Both are mocked. The difference is one number.

| | `pr` — the Power Roll's recipe verbatim | `edge` — **recommended** |
|---|---|---|
| wash | `linear-gradient(90deg, var(--tw), transparent 60%)` | `…, transparent 12%` |
| edge | 3px `--t` | identical |
| hue / token / direction | identical | identical |
| shots | `sc191-r6-pip-wash-pr-{dark,light}.png` | `sc191-r6-pip-wash-edge-{dark,light}.png` |

**The 60% fade is calibrated for a row that is one continuous text block.** In a Power Roll row
the wash runs under the badge and the first half of a sentence, and nothing in the row is being
compared to anything else in it. The strip's row is a **lattice of three cells that exist to be
compared to each other**, and a 60% fade lands the wash on Easy, half of Medium, and none of
Hard. The eye reads that as a difference between the columns. There is no difference between
the columns.

**Look at the light pair, not the dark one** — that is where the effect is visible: in
`sc191-r6-pip-wash-pr-light.png` the Easy column sits on pink under the ≤11 row and on green
under the 17+ row while Medium and Hard sit on white; in `-edge-light.png` all three columns
share one ground. In dark at 8% alpha the two are nearly indistinguishable, so `edge` costs
essentially nothing and buys the light scheme a clean lattice. `edge` keeps every channel of
the rhyme — same hue, same 3px edge, same direction, same token — and simply ends the fade
inside the badge gutter, which is the part of the row the hue actually names.

If you prefer the literal recipe, `?tier=pr` is one query parameter and the mocks are shot both
ways.

### 2.5 Colour is still the last channel — and the flip is what makes that safe

The tier hue now identifies the **row**, and the row already spells its band in the badge's own
text. So the hue reinforces a label; it never carries one.

It emphatically does **not** encode outcome, and that mismatch is the single strongest argument
on this card for keeping outcome in glyphs: **the ≤11 row is RED and its Easy cell is a
SUCCESS.** The 17+ row is GREEN and its Hard cell is a success only because the difficulty was
set that way. A reader who took the row colour as the answer would be wrong in two of twelve
cells.

Colour names for the record: bands — ≤11 **red** (`--dse-tier-low`), 12-16 **amber**
(`--dse-tier-mid`), 17+ **green** (`--dse-tier-high`), crit **gold** (`--dse-tier-crit`).
Outcomes — success is a **green** ring with a check, failure a **red** ring over a dark hatched
press with an X. Riders are **steel grey**, never a hue.
Greyscale proof: `sc191-r6-pip-grey-dark.png` (strip) and `sc191-r6-card-grey-dark.png` (whole
card) — every cell still reads: outcome from ring-vs-press + check-vs-X, rider from ▲-vs-▼,
band from the badge's text.

---

## 3. Task 3 — the rider marks. **Recommendation: `pip`**

> "Each cell in the 'test tiers' table should additionally reflect 'with consequence' and 'with
> reward'. Not sure the best way to handle this. Immediate thought for 'success with reward'
> was to use the double-check icon. Not sure if there is an equivalent for 'success with
> consequence' and 'failure with consequence'. Maybe going with an approach of having a
> picture-in-picture (pip) approach by adding a small icon in the bottom corner could work.
> What ideas do you have?"

### 3.1 The structural answer first, because it decides everything else

**In the book the rider is orthogonal to the outcome.** "Success with a consequence" and
"failure with a consequence" carry the *same* rider on two different outcomes (Draw Steel
Heroes:20471). So the vocabulary has to be **two independent channels — outcome, rider — not
five bespoke glyphs.**

That is exactly why you could not find an equivalent for the double-check. **The double-check
is a substitution, and a substitution cannot express "the same thing, plus a rider" twice
over.** There is no "double X" that means "a failure with a consequence" — a double X means a
*worse failure*, which is a different and false claim. Your instinct that something was missing
was correct, and the missing thing is structural rather than a glyph nobody has thought of yet.

### 3.2 The full vocabulary, defined once

Identical in all three treatments — only the mark changes.

| outcome | seal | rider mark |
|---|---|---|
| success | green ring, check | — |
| success with a **reward** | green ring, check | reward mark |
| success with a **consequence** | green ring, check | consequence mark |
| failure | red pressed disc, X | — |
| failure with a **consequence** | red pressed disc, X | consequence mark |
| nat 19–20 (the crit row) | green ring, check | reward mark |

Six cells of meaning; four of them are two axes multiplied. Every treatment gets a
`?only=vocab` key sheet so this is checkable at a glance rather than counted out of a
twelve-cell strip.

### 3.3 The three treatments

| | `pip` — **RECOMMENDED** | `ring` | `double` |
|---|---|---|---|
| reward | solid **▲** on the seal's bottom-right corner | the ring is **double-struck** (a second, outer ring) | the glyph becomes **✓✓** (your double-check) |
| consequence | solid **▼**, same corner | the ring is **notched** (a bite at the same corner) | a **†** set after the seal |
| seal glyph | unchanged | unchanged | substituted for reward |
| objects added | one | zero | one, and only on one polarity |
| key sheet | `sc191-r6-vocab-pip-dark.png` | `sc191-r6-vocab-ring-dark.png` | `sc191-r6-vocab-double-dark.png` |
| strip | `sc191-r6-strip-pip-{dark,light}.png` | `sc191-r6-strip-ring-dark.png` | `sc191-r6-strip-double-dark.png` |
| whole card | `sc191-r6-pip-open-{dark,light}.png` | `sc191-r6-ring-open-{dark,light}.png` | `sc191-r6-double-open-{dark,light}.png` |

### 3.4 Why `pip` wins

1. **It is the only one that leaves the seal identical to the board's own cell glyph.** The
   strip's premise since round 5 is that it is drawn in the board's language, so a Director who
   has learned to read a cell has already learned to read the strip. `ring` and `double` both
   make the strip's success seal stop being the board's success seal — in
   `sc191-r6-card-dark.png` you can see the strip's seals and the board's seals are the same
   mark, which is a claim the other two spend.
2. **It factors, and `double` structurally cannot.** §3.1. `ring` factors too — it is the
   runner-up on this axis, not on the others.
3. **It survives 300px.** `sc191-r6-pip-narrow-dark.png`: at sidebar width the rider words drop
   and the mark is the *only* carrier, so it has to hold. A solid triangle still reads at ~6px;
   a 1px notch in a 1.35em ring is a ring; a four-stroke double-check is a smudge. The pip is
   also the one mark that deliberately does **not** shrink with the seal at that width.
4. **It is your idea, executed.** "A small icon in the bottom corner" — with one refinement: it
   rides **the seal**, not the cell's corner. At 300px the cells are ~60px and a mark in the
   cell's corner would sit closer to its neighbour's seal than to its own; welded to the seal
   it cannot be misattributed at any width.

Three smaller decisions inside `pip`, each of which had a wrong answer available:

- **Solid triangles, not chevrons.** The strip's own disclosure twisty is an outlined chevron.
  One glyph doing two jobs inside one component is how a vocabulary starts lying.
- **▲ / ▼, not + / −.** "+" is already spoken for three times on this card (add a hero, add a
  round, the bar button's glyph) and round 2 has a recorded bug from exactly that collision;
  "−" is the `dash` glyph the board already uses for "no action".
- **Steel grey, not a hue, and not white.** The seal owns the card's two semantic colours; a
  coloured pip would imply the rider has a polarity of its own, and it does not — a reward on a
  success and a consequence on a success are both still successes (Draw Steel Heroes:20480).
  Grey also keeps your round-2 standing objection to bright-white elements intact: this is the
  smallest mark on the card and it must not pull the eye.

### 3.5 The words did not go away

You asked for the cells to "**additionally** reflect" the riders, so the mark is the addition,
not the replacement. At 820px every cell says it twice — *success / with a consequence* beside
the seal, and the pip on it — and the second saying is the one that needs no legend at all. At
300px the words drop and the legend line carries the mark. Which is the other change worth
noting: **round 5 showed the rider legend only at sidebar width; round 6 shows it at every
width**, because from now on the mark is the primary carrier and a mark whose key is only
visible in a sidebar is a mark nobody ever learns.

---

## 4. Task 4 — the consistency sweep, and its one useful finding

**There is nothing to flip in the foot panel: it is already in the target orientation.** The
book's Test Difficulty Outcomes table is power-roll-rows × difficulty-columns, and the panel has
transcribed it that way since round 4 (`GUIDE.tiers.head = ['Power roll', 'Easy', 'Medium',
'Hard']`). **It was the strip that was transposed.** So flipping the strip to match the Power
Roll element also makes it match the panel, the book, and the sheet's tier hint — one grammar
across four surfaces, bought by changing exactly one of them. The owner's lean was right and it
costs nothing. `sc191-r6-guide-open-dark.png` (panel open, strip closed).

The sweep's two actual edits:

- **The pinned stub is now a pure pointer.** Round 5's stub had to keep one orphan line (*"A
  natural 19 or 20 is always a success with a reward, at every difficulty"*) because the strip
  could not carry the crit row. It can now (§2.3), so the block is its title plus *"The full
  tier table is pinned above the board."* Twelve cells, stated once.
  `sc191-r6-guide-open-pinned-dark.png`. The dedup behaviour itself is unchanged — pinned strip
  stands the "Each test" block down, and the panel's summary hint still drops *test tiers*.
- **The legend text is the new vocabulary** at every width (§3.5), and the strip's footnote
  gained the crit clause.

**The sheet's tier hint is unchanged and still correct** — *"success starts at easy ≤11 · medium
12–16 · hard 17+"*. It is the adjudication line (which of the three chips do I press) and the
riders deliberately stay upstairs on the strip, because they do not change which chip you
press. Nothing in the flip touches it.

---

## 5. What did NOT change

Per the brief: `merged` outcome band with equal-width tracks; `Log an action…` everywhere; the
"+" lane still gone; ink seals; centre spacing; crest-less hero cells; "+" add-hero in the
Heroes header cell; note mark top-right; foot panel collapsed by default; strip pinned once
opened (`sc191-r6-closed-dark.png` is the first-run closed row, unchanged from round 5).

---

## 6. Observations (not fixed, not in scope)

1. **The shipped crit badge renders as `cr it`.** Visible in `sc191-r6-powerroll-dark.png` (the
   real Power Roll element) as well as in the strip — so it is pre-existing and not introduced
   here. It reproduces identically in both, which is what the rhyme needs, but it is a small
   legibility nit in a shipped component and a candidate follow-up.
2. **The strip is taller than round 5's** (four rows instead of three, plus a legend line that
   is now always on). It is a pinned reference and I think it earns the height, but if you want
   it back, dropping the crit row is the lever — at the cost of §2.3 and of the pure-pointer
   stub.
3. **Carried from round 5, untouched:** the foot panel's four-column tier table still
   side-scrolls at 300px (the strip's degrade is the proof the column-major pattern works); the
   note mark shares the cell's top-right with the edit chip; the bar button keeps the "+" glyph
   under the "Log" verb; `reference/draw-steel-agent-reference.md:98` still misstates the
   montage Victory awards.
4. **Carried from round 2, unchanged:** `.dse-head` has no narrow form in this plugin;
   `montageOutcome` returns `'failure'` for an un-started montage; five hardcoded `0.85em` font
   sizes in the `.dse-mt` block are on the SC-185 allowlist; production must use `@container` on
   the element root, not the viewport query the mock uses.

---

## 7. Screenshots

All 30 in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`.
Dark is primary. Colour names are given in prose because Scott is colourblind; nothing in these
mocks uses hue as the only channel for a state.

| Path | What it shows |
|---|---|
| `sc191-r6-before-open-dark.png` / `-light.png` | **BEFORE** — round 5's `handle` strip open, byte-identical to `sc191-r5-cheat-open-{dark,light}.png` (§0) |
| `sc191-r6-strip-before-dark.png` | the same, cropped to the strip, for the side-by-side |
| `sc191-r6-powerroll-dark.png` / `-light.png` | **the thing it rhymes with** — the real Power Roll element, kit DOM, same element/theme root |
| `sc191-r6-strip-pip-dark.png` / `-light.png` | **the recommendation**, cropped: flipped strip, `pip` riders |
| `sc191-r6-strip-ring-dark.png` | the `ring` treatment, cropped |
| `sc191-r6-strip-double-dark.png` | the `double` treatment (your double-check + the dagger), cropped |
| `sc191-r6-vocab-pip-dark.png` | **the `pip` vocabulary** — all six marks at reading size |
| `sc191-r6-vocab-ring-dark.png` / `-double-dark.png` | the other two vocabularies, same layout |
| `sc191-r6-pip-open-dark.png` / `-light.png` | the whole card, `pip`, `pr` wash |
| `sc191-r6-ring-open-dark.png` / `-light.png` | the whole card, `ring` |
| `sc191-r6-double-open-dark.png` / `-light.png` | the whole card, `double` |
| `sc191-r6-pip-wash-pr-dark.png` / `-light.png` | **the gradient call, half A** — the Power Roll's 60% fade. The LIGHT one is the evidence. |
| `sc191-r6-pip-wash-edge-dark.png` / `-light.png` | **the gradient call, half B** — the restrained 12% fade (recommended) |
| `sc191-r6-card-dark.png` / `-light.png` | **the recommended composite** — whole card, `pip` + `edge` |
| `sc191-r6-pip-narrow-dark.png` | 300px sidebar — words drop, marks hold, legend line, no side-scroll |
| `sc191-r6-closed-dark.png` | the strip **closed** (first-run) — unchanged from round 5 |
| `sc191-r6-guide-open-dark.png` | foot panel open, strip closed — the full book table, orientation unchanged (§4) |
| `sc191-r6-guide-open-pinned-dark.png` | foot panel open **with the strip pinned** — the stub is now a pure pointer |
| `sc191-r6-pip-grey-dark.png` | **the greyscale proof** — the recommended strip with every hue removed |
| `sc191-r6-card-grey-dark.png` | the whole recommended card, greyscale |

Report: `.superpowers/sdd/sc191-montage-overhaul/sc191-round6-report.md` (this file).

---

## 8. Verification

Full battery in order, per `.claude/skills/dse-verify/SKILL.md`, against `draw-steel-elements`
at `951d679` (base `origin/develop 778a341`).

| Gate | Expected (brief) | Measured |
|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** |
| `npm run lint` | clean | **clean, exit 0** |
| `npx jest` (after `rm -f main.js styles.css`) | all green | **3491 passed / 1 skipped / 3492 total, 189 suites passed + 1 skipped, 3 snapshots, exit 0** |
| `npm run shots` ×2 | 474 PNGs, 0 FAIL, deterministic | **478 PNGs, 0 FAIL; the two runs byte-identical (478/478 sha256 match)** |
| `check-freeze.sh` | 210/210, 0 mismatches | **`freeze OK (210/210 …)`, exit 0** |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED | **0 gaps / 0 undeclared warnings / 16 declared deferrals, exit 0** |

**Two numbers differ from the brief's, and both are SC-195's, not mine.** The brief's 474 shots
/ 118 print-twin ids were recorded at `1619396`, before SC-195 landed; this branch's diff
against `origin/develop` touches **only** `visual-harness/sc191/`, which is outside `entry.ts`'s
manifest and therefore structurally incapable of adding a capture. Measured here: **478 PNGs**
and **print-twin parity OK (119 capture ids)**. Freeze is unmoved at 210/210, and jest is +97
tests over round 5's 3394 — consistent with a feature landing that added fixtures and tests.
**Nothing needs a baseline edit and none was made.**

In-run gates inside `npm run shots`, all OK: chrome placement (7 families, 10.00px inset, 0
overlap); chrome host-leak (18 combos); **`host-copy pin OK`** (Obsidian 1.13.7 — not PARTIAL);
button host-leak (111 kinds × 3 states × dark/light = 666); print-twin parity (119 ids); nested
corner-radius OK.

jest, freeze, tsc and lint were re-run after the `data-treat` fix (§0) and are the numbers
above; `shots`/`parity` were not re-run because the fix is confined to `visual-harness/sc191/`,
which no shipped-code gate reads.

`npm ci` was NOT needed — `git diff 1619396 778a341 -- package.json package-lock.json` is empty
and `node_modules/` survived from round 5. `npm run obsidian-shots` not run (needs a real
display).

**Freeze did not move, and could not:** nothing under `visual-harness/sc191/` is in `entry.ts`'s
manifest, so no capture id, no fixture and no `styles-source.css` reach exists by construction.
No display used, no shared-baseline edit, no push, no tracker.

---

## 9. Open questions for Scott

1. **`pip`, `ring` or `double`?** §3.3–3.4. My answer is `pip`; all three are rendered as strips
   *and* as key sheets so it is a look, not an argument.
2. **`edge` or `pr` for the tier wash?** §2.4. My answer is `edge`; the light pair is the
   evidence.
3. **The crit row.** It is the reason the strip is now complete and the reason the pinned stub
   is a pure pointer — and it is three identical cells and ~2em of height. Keep or cut.
4. **The dead `chip` code in `mock5.js` / `round5.css`.** Left in place to keep the round-5
   control byte-identical (§1). Say the word if you want it deleted anyway.
