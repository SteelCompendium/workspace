# SC-191 review 1 — independent review of slices 1–2

## Executive summary

VERDICT: **FIX-ROUND** — 2 HIGH + 5 MEDIUM (plus 6 LOW / 8 INFO).
Battery reproduced exactly as claimed: tsc/lint clean, jest 3559 passed / 1 skipped / 191 of
192 suites, shots 498 PNGs 0 FAIL byte-identical across two runs, freeze exactly the 2
montage print lines (hashes match `rebaseline.txt`, twin == realprint), parity 0/0/16.
Model/serialization is sound: §B.5 key order, entry key order and omit-when-default are
literally correct, round-trip identity holds for all five probe shapes, and there is no
`successes = count(entries)` path anywhere. All eight §C integrity probes PASS or are
NOT-YET-POSSIBLE for a documented reason; three tests were proven capable of failing.
**HIGH-1:** the outcome band prints "If it ended now / **Total Failure**" directly above its
own rule line "…lead failures by 2 — currently **+3**" on the `mid` and `old-shape` fixtures;
the approved round-5 mock renders **Partial Success** for the same numbers.
**HIGH-2:** the board's cells override the plugin-wide "buttons never print" rule, so a
printed card carries 15 bordered white boxes at 50 % opacity and **two entirely blank limit
tracks** — that is what the sanctioned-rebaseline after-crop is asking Scott to approve.

---

## Findings

### HIGH

**H-1 — `montageOutcome` can never return `partial` while the montage is live, so the "if it
ended now" band contradicts the rule line printed under it, and diverges from the approved
mock.**
`src/elements/montage/model.ts:136-137`

```ts
const exhausted = (m.failure_limit > 0 && m.failures >= m.failure_limit) || m.current_round > m.rounds;
if (exhausted && m.successes - m.failures >= 2) return 'partial';
return 'failure';
```

*Failure scenario (shipped, reproduced live).* `visual-harness/shots/montage-mid--steel-dark.png`
(fixture `src/elements/montage/fixture-mid.yaml`: successes 5, failures 2, `success_limit: 6`,
`failure_limit: 3`, `rounds: 3`, `current_round: 3`). Measured DOM:

```
eyebrow "If it ended now"   word "Total Failure"   data-band "failure"
rule    "Partial Success needs successes to lead failures by 2 — currently +3."
```

`exhausted` is false (2 < 3 failures, round 3 is not > 3), so the `partial` branch is
unreachable and the function falls through to `'failure'`. By the rule the band itself
prints, +3 satisfies the partial-success condition — the headline and the rule line assert
opposite things about the same numbers. `montage-old-shape--steel-dark.png` shows the same
contradiction at +2 (`fixture-old-shape.yaml`, 4/2, `rounds: 2`, `current_round: 2`).

*The approved design says Partial Success.* `visual-harness/sc191/mock6.js:632-635` —
`derive()` has **no** `exhausted` gate:

```js
let band = 'failure';
if (m.entries.length === 0) band = 'pending';
else if (toTotal === 0) band = 'total';
else if (partialHeld) band = 'partial';      // partialHeld = (successes - failures) >= 2
```

and `.superpowers/sdd/sc191-montage-overhaul/sc191-r5-tracks-mid-dark.png` (the ledger's
approved round-5 capture, identical numbers) renders **"IF IT ENDED NOW / Partial Success"**
with a flag crest, over the same "+3" rule line. Spec §A freezes mock6 at `?state=mid` as
*the* design; the shipped element does not render it.

*Which is wrong.* The outcome function, not the copy and not the fixture. The rule text is
correct (book: success limit → Total Success; failure limit or out of rounds → Partial
Success if successes lead by 2, else Total Failure), and the "if it ended now" framing is
precisely the hypothetical in which the montage HAS ended — so `exhausted` must not gate the
comparison. Note the guard is **pre-existing** (`git show 69eb5f7:src/elements/montage/model.ts`
carries it verbatim); SC-191 only added the `pending` line. Slice 2 made it loud by printing
the contradicting rule line beside it.

*Boundary probe* (`scratchpad/sc191-review1/probe-model.log`, `sl 6 / fl 9 / rounds 3`):

| state | band today | band per mock6 / rule text |
|---|---|---|
| 3/3, cr 2 (live) | failure | failure |
| 4/3, cr 2 (live) | failure | failure |
| **5/3, cr 2 (live)** | **failure** | **partial** |
| **5/3, cr 3 = final round, actions left** | **failure** | **partial** |
| 5/3, cr 4 (rounds out) | partial | partial |
| 4/3, cr 4 (rounds out) | failure | failure |
| 3/3, cr 4 (rounds out) | failure | failure |
| 5/3, failures at limit 3 | partial | partial |
| 6/2 (success limit) | total | total |
| 0/0 | pending | pending |

*Prescribed fix.* `model.ts:136-137` → drop the `exhausted` requirement from the `partial`
branch (keep `exhausted` for nothing else — it is already re-derived by `isExhausted`):

```ts
if (m.successes - m.failures >= 2) return 'partial';
return 'failure';
```

Then update the two tests that pin the old behaviour —
`test/dom/elements/montage.test.ts:284-289` ("the live band on the mid fixture … Total
Failure (margin +3, not yet exhausted)") and
`test/unit/model/montage-serialize.test.ts:138` (`{rounds:3, successes:3, failures:1,
current_round:1}` → `'failure'`; that one is margin +2 and must become `'partial'`) — and add
a can-fail test that asserts the band word and the rule line never disagree.
**Freeze impact: none.** The `default` fixture is 0/0 → `pending`, so `montage--steel-{print,
realprint}.png` do not move; `rebaseline.txt`'s two hashes stay valid. The screen captures for
`montage-mid`, `montage-narrow` and `montage-old-shape` change (unfrozen).

---

**H-2 — the board defeats the plugin-wide "buttons never print" rule; a printed montage
carries 16 button boxes at 50 % opacity and two completely blank limit tracks.**
`styles-source.css:3615` and `styles-source.css:3633` (structural tier) vs
`styles-source.css:13105`; `styles-source.css:3847` + `:4309` (track slot).

```css
/* :13105 — plugin-wide, specificity (0,2,0) */
[data-dse-print="on"] .dse-btn { display: none; }

/* :3615 — montage structural tier, specificity (0,3,0) — WINS */
[data-dse-element="montage"] .dse-mt { .dse-mt__board > * { display: flex; … } }
/* :3633 — same, on the add-hero button */
[data-dse-element="montage"] .dse-mt { .dse-mt__board-addhero { display: inline-flex; … } }
```

*Failure scenario (measured under `emulateMedia({media:'print'})`, both `print=1` and real
print — `scratchpad/sc191-review1/measure4.log`, `measure2.log`):*

```
.dse-mt__cell            display flex   opacity 0.5  border 1px solid rgb(204,204,204)  background rgb(255,255,255)
.dse-mt__board-addhero   display flex   opacity 0.5  44 × 44 px          (the Steel density rule that shrinks it is print-excluded)
.dse-mt__board-rowact    display none   ← the print rule wins here (not a grid item)
.dse-mt__menu            display none   ← ditto
.dse-mt__track-slot      border 0px none   background transparent   box-shadow none   ← 9 slots, zero ink
```

Consequences on a real Ctrl-P / PDF export: (a) an **authoring control** (`+ Add a hero`) is
printed as a 44 px box — the exact thing `:13105` exists to prevent; (b) every recorded
cell is a 1 px grey box and its contents (the ✓/✗ glyph, the skill word, the note mark) are
rendered at half strength, because `.dse-btn[disabled] { opacity: .5 }` (`:12078`) is base
tier; (c) the two limit tracks — the band's primary instrument — print as empty gaps beside
their labels and tails, because every visible property on `.dse-mt__track-slot` lives in the
print-excluded Steel tier (`:4309`) while the structural tier (`:3847`) gives it geometry
only. All three are visible in the sanctioned after-crop
`.superpowers/sdd/sc191-montage-overhaul/sc191-freeze-montage--steel-print-after.png` (the
two grey blocks; "Successes / 5 from Total Success" with nothing between them).

*Prescribed fix.* Do **not** simply let `:13105` win — `display:none` on a grid item removes
it from auto-placement and shears the row (spec §D's own warning). Add an explicit
print-scoped block to the montage's structural tier:

```css
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__cell {
	border: none; background: none; box-shadow: none; opacity: 1;
}
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__board-addhero { display: none; }
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__track-slot {
	border: 1px solid #333;
}
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__track-slot[data-filled='on'] {
	background: #333;
}
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__track[data-kind='failure'] .dse-mt__track-slot[data-filled='on'] {
	background: repeating-linear-gradient(135deg, #333 0 1px, transparent 1px 5px);  /* hatch keeps the colourblind channel */
}
```

(`--dse-metal-line` resolves to `none` under print — measured — so a print rule must name its
own ink.) Re-generate `rebaseline.txt` and the four crops afterwards; the two frozen hashes
**will** change from `0ba0ceb9…`, so the sanction ask must not go to Scott before this fix.

### MEDIUM

**M-1 — every board cell wears full `.dse-btn` chrome on screen and renders its data at 50 %
opacity; the approved design has neither.**
`src/elements/montage/BoardView.ts:166-168` (and `:87-92`, `:126-131`).

The cell is built as `iconButton(...)` with `disabled: true`, then `.dse-mt__cell` is layered
on. Measured on `montage-mid`, steel dark (`measure.log`):

```
tag BUTTON  class "dse-btn dse-mt__cell"  disabled true
border 1px solid rgba(176,183,187,0.5)   border-radius 5.44px
background-image linear-gradient(rgba(255,255,255,.07), rgba(0,0,0,.14))
box-shadow rgba(255,255,255,.08) 0 1px 0 inset, rgba(0,0,0,.3) 0 1px 3px
opacity 0.5
```

*Failure scenario.* Compare `visual-harness/shots/montage-mid--steel-light.png` with the
ledger's approved `sc191-r6-card-light.png`: the mock's board is flat — row separators and a
column tint, no per-cell outline — while the shipped board is a 5 × 3 grid of raised, rounded,
bordered white buttons. That is the "lines everywhere … the borders look terrible" the
2026-08-26 ledger ruling struck from `tray`, re-introduced. Separately, `opacity: 0.5`
(`styles-source.css:12078`, `.dse-btn[disabled]`) dims **the montage's own recorded data** —
the ✓/✗ rings, the skill captions, the note marks — by half in dark, light, narrow and print;
the greyscale proof (`scratchpad/sc191-review1/review-mid-grey-dark.png`) shows the shapes
surviving but faint, which is the worst case for a colourblind reader relying on shape.

Spec §D does not ask for this: it maps the **cell** to `role="button" tabindex="0"` and "a
real `<button>` per socket" (the quick-record trio), not to a `.dse-btn`. The slice-2 report
justifies the change by the button host-leak gate, but that gate sweeps real `<button>`s — a
`div[role=button]`, which is what §D specifies, is not a button kind.

*Prescribed fix (either).* (a) Follow §D: `.dse-mt__cell` is a `div` with
`role="button" tabindex="0"` (and `aria-disabled` while stubbed), and the sockets inside it
are the `iconButton`s. (b) Keep the `<button>` but neutralise the kit chrome and stop using
`disabled` for "not wired yet": add to the Steel tier
`border: none; border-radius: 0; background-image: none; box-shadow: none;` on
`.dse-mt__cell`, and swap `disabled: true` for `aria-disabled="true"` + a no-op handler so
the content is not dimmed. Either way the same repair is owed to `.dse-mt__board-addhero`
(`:4064`), whose 45 % opacity is a deliberate Steel choice and can stay.

---

**M-2 — the light scheme silently loses the current-round column wash: a `body.theme-light`
twin out-specifies the state rule.**
`styles-source.css:4076-4085` vs `styles-source.css:4187-4189`.

```css
.dse-mt__board-name, .dse-mt__cell, .dse-mt__board-total {   /* :4076 */
	background: var(--dse-sheen-soft), rgba(255, 255, 255, 0.015);
	body.theme-light & { background: rgba(0, 0, 0, 0.012); }   /* :4082 — (0,3,1) + class on body */
}
…
.dse-mt__cell[data-state='current'] { background: rgba(77, 184, 199, 0.07); }  /* :4187 — (0,2,0) */
```

The `body.theme-light &` twin adds a class and an element to the selector, so it beats the
attribute-qualified state rule regardless of source order.

*Failure scenario, measured (`measure2.log`, "CURRENT-COLUMN WASH"):*

```
bg=dark   current rgba(77,184,199,0.07)   past rgba(255,255,255,0.016)   distinguishable: true
bg=light  current rgba(0,0,0,0.01)        past rgba(0,0,0,0.01)          distinguishable: FALSE
```

Visible in `visual-harness/shots/montage-mid--steel-light.png`: the round-3 column is
indistinguishable from rounds 1–2 except for the header underline. The approved
`sc191-r6-card-light.png` tints it.

*Prescribed fix.* Give the state rule its own light twin at the same specificity, inside the
`[data-state='current']` block:

```css
.dse-mt__cell[data-state='current'] {
	background: <accent wash token/twin — see M-3>;
	body.theme-light & { background: <light accent wash>; }
}
```

---

**M-3 — a hard-coded accent-hue literal with no token and no light twin.**
`styles-source.css:4188` — `background: rgba(77, 184, 199, 0.07);`

`77,184,199` is `#4db8c7`, the value of `--dse-accent` in **Steel dark only**
(`styles-source.css:5450`); Steel light defines `--dse-accent: #2a7b88` (`:12000`) and
`--dse-hover: rgba(42,123,136,0.10)` (`:11990`). Spec §E: "Every colour is a `--dse-*` token;
compose, never invent" and "Every translucent wash states its light twin (SC-117/SC-126
bg-polarity)". The one sanctioned literal-wash precedent in this sheet — the Power Roll tier
rows at `:8005-8017` — carries a `/* #f0b429 */`-style citation **and** an explicitly reasoned
light-twin block; this one carries neither. (`styles-source.css:11858` in `initiative` has the
same lapse; it is pre-existing and out of scope here.)

*Failure scenario.* Once M-2 is fixed, Steel light paints the current-round column in the
dark-mode teal at 7 % rather than the light accent, so the wash is off-hue against every other
accent surface on the card (the "in play" header text and its 2 px underline, which DO use
`var(--dse-accent)` at `:4049-4058`).

*Prescribed fix.* Use `--dse-hover` (already an accent-derived wash with a correct light twin
at `:11990`), or state both washes explicitly with a citation comment in the Power Roll
`--tw` style. The gold literal at `:4393` (`rgba(224,176,80,…)` = `--dse-vp` `#e0b050`) is
**correct** — `--dse-vp` is light/dark stable and is not overridden in the light block
(verified: measured `#e0b050` in both) — but it should carry the same `/* #e0b050 */` citation
comment the `--tw` precedent uses.

---

**M-4 — `role="table"` on a node with no rows or cells; the Tally cell reads as one number.**
`src/elements/montage/BoardView.ts:60` (`board.setAttribute('role', 'table')`) and
`:201-206` (`tallyPart`).

*Failure scenario, measured (`measure2.log`, "A11Y / DOM SEMANTICS"):*

```
boardRole "table"     boardHasRowChildren false
childRoleHistogram { "<div>": 15, "<button>": 15 }     (0 role="row", 0 role="cell"/gridcell)
tallyAccessible "20"      ← <span>2</span><span>0</span> for "2 successes, 0 failures"
```

`role="table"` requires owned `role="row"` (directly or via `rowgroup`); with none, the
mapping is invalid and AT announces a table with no rows — worse than no role at all, because
the flat DOM would otherwise read in visual order. Independently, a screen-reader user hears
Kira's tally as "twenty".

*Prescribed fix.* Either drop `role="table"` (the grid is visual; the per-cell `aria-label`s
already carry hero + round + result) or build real `role="row"` wrappers — which is
incompatible with the single-grid layout unless the rows use `display: contents`, the gesture
`.dse-mt__prog` already uses at `:3816`. Whichever is chosen, give
`.dse-mt__board-total` an `aria-label` of the form `"Kira: 2 successes, 0 failures"` and mark
the two numeric spans `aria-hidden`.

---

**M-5 — the equal-width-track ruling (ledger 2026-08-29) has no regression gate.**
`test/dom/elements/montage.test.ts:308-320`.

The test is named "equal-width tracks … the same rendered width at ANY pair of limits" but
asserts only `trackSlots(root,'success')).toHaveLength(6)` / `…failure…toHaveLength(3)` and
the `data-goal` marker. It runs in jsdom, which has no layout engine, so
`getBoundingClientRect()` would return zeros — spec §G's `getBoundingClientRect().width`
assertion is not implementable there and was silently dropped.

*Failure scenario.* Any future change to `.dse-mt__outcome-tracks`'s grid or to
`.dse-mt__prog { display: contents }` (`:3810-3817`) — e.g. someone "fixing" a narrow-width
wrap by giving `.dse-mt__prog` its own grid — restores two independently-sized tracks with the
full battery green, silently reverting Scott's explicit ruling.

*Verified good today* (Playwright, 900 px viewport, `measure.log`): `mid` (6/3) success track
413.13 px, failure track 413.13 px, identical `left`/`right`; slots 68.78 px vs 138.37 px
(**2.01×**, not spec §G's estimated 2.2×). `failed` (6/3): 371.86 / 371.86.
`old-shape` (5/3): 413.13 / 413.13, slots 82.70 vs 138.37. Narrow 300 px: 202.81 / 202.81.

*Prescribed fix.* Add the assertion where layout exists — an in-run gate in
`visual-harness/shoot.mjs` on the `montage-mid` capture, the same shape as the existing
`chrome placement OK` / `nested corner-radius OK` sweeps: read both tracks'
`getBoundingClientRect().width` and fail loudly if they differ by more than 0.5 px. Rename the
jest test to say what it actually proves (slot counts).

### LOW

**L-1 — vacuous-limit copy contradicts the band word.** `src/elements/montage/model.ts:205-229`
+ `OutcomeBandView.ts:107-111`. With `success_limit`/`failure_limit` left unset (both default
to 0), `montageBandCopy` takes the `toTotal === 0` / `failuresSpare === 0` branches and the
band renders **zero** track slots beside the tails "Total Success reached" and "the limit is
reached", under the word "Not started" (probe: `sl 0 / fl 0 / 0 successes / 0 failures` →
`band=pending, sTail="Total Success reached", fTail="the limit is reached"`). No shipped
fixture hits it (`example.yaml` sets both limits), but any Director who omits a limit does.
*Fix:* in `montageBandCopy`, return an explicit "no limit set" tail when the corresponding
limit is `0`, and in `buildTrackRow` render a "no limit set" caption instead of an empty flex
row when `limit === 0`.

**L-2 — a malformed `entries[]` item is dropped silently and then erased from the user's
file.** `src/elements/montage/model.ts:72-90`. A Director typo (`result: sucess`) makes
`sanitizeEntry` return `undefined` and the whole entry — including its `note` — vanishes from
the model with no console warning and no `Notice`. Verified through the real pipeline: a block
whose only noted entry carries that typo renders **0** notes
(`scratchpad/sc191-review1/probe-integrity.log`, "probeX"). Once slice 4 lands a board write,
the next debounced `replaceSource()` writes the sanitized model back and the entry is gone
from disk. §G asks for "dropped, never crashes", so the drop is sanctioned — the silence is
not. *Fix:* `console.warn` the dropped raw entry in `sanitizeEntries`, and (slice 4) surface
one `Notice` on the first write that would discard entries.

**L-3 — `participants: []` serialises as `[]`.** `src/elements/montage/model.ts:102`. §B.5
lists `participants` among the omit-when-absent keys and says "Never emit `null`, `''` or `[]`
for these"; `entries: []` correctly omits (`:103-104`) but `participants: []` round-trips
verbatim (probe B, "EMPTY-ISH serialize output"). This is pre-existing behaviour that §B.2
("nothing is renamed, retyped, removed or reordered") arguably protects, so the two clauses
are in tension. *Fix (or ruling):* either treat §B.5's `[]` clause as scoped to the new keys
and say so in the model comment, or drop the empty array — the board already has the
`No heroes yet` fallback (`BoardView.ts:110-114`).

**L-4 — the notes list tie-breaks alphabetically where the mock demands roster order.**
`src/elements/montage/OutcomeBandView.ts:129` — `.sort((a,b) => a.round - b.round ||
a.hero.localeCompare(b.hero))`. `mock6.js:639-643` sorts the same first key then by
`participants.findIndex(...)`, with the comment "the ordering has to be the reading order of
the board". *Failure scenario:* two notes in the same round from `Yenna` and `Bram` list
Bram first, while the board lists Yenna above Bram (roster order). Invisible on `mid`
(one note per round). *Fix:* sort the second key by `participants.findIndex(p => p.name === e.hero)`,
falling back to the array index for an orphan hero.

**L-5 — an entry whose hero is not in `participants` is invisible on the board but its note
still lists in the band.** `src/elements/montage/BoardView.ts:214-216` filters cells by hero
name; `OutcomeBandView.ts:125-131` filters nothing. Round-trip is clean (probe A case (c):
byte-identical), so no data is lost — but a Director who renames a hero in `participants`
without touching `entries` gets an empty board row plus orphan notes with no address back to
any row. *Fix:* render an "unassigned" row for orphan heroes, or drop their notes from the
band with a count ("1 note from a hero no longer on the roster").

**L-6 — a duplicate `hero`+`round` entry is invisible on the board but counted in the Tally
column.** `src/elements/montage/BoardView.ts:219` uses `.find`, while `:140-141` counts all of
a hero's entries. Two entries for `Kira, round 1` render one cell and a tally of 2. *Fix:*
either render the last-wins entry with a marker, or reject duplicates in `sanitizeEntries`
(first-wins) so the two layers agree.

### INFO

- **I-1** A hand-authored escaped multi-line note (`note: "a\nb"`) is re-emitted as a YAML
  block scalar (`note: |-`) on the first write, and a quoted hero name loses its quotes.
  `parse(serialize(parse(x))) ≡ parse(x)` and `serialize` idempotence both hold (probe A case
  (d)); §B.5's `serialize(parse(x)) === x` clause is scoped to inputs already in canonical
  form, so this is representation, not data loss.
- **I-2** Spec §J/§G's estimate "the failure slot ≈ 2.2× the success slot at 6/3" measures
  **2.01×** (68.78 px vs 138.37 px). The gap arithmetic (5 gaps vs 2) accounts for it; the
  spec estimate was the loose number, not the code.
- **I-3** The shipped tracks stretch to the full `minmax(0, 1fr)` column (413 px at 900 px)
  where the mock pins ~10.7em. The ledger ruled only on *equality*, which holds; the
  proportion change is a visible but unsanctioned-either-way difference from
  `sc191-r5-tracks-mid-dark.png`.
- **I-4** Spec §E calls the greyscale capture "a required capture (§F)", but §F's capture-id
  table contains none and slice 2 ships none. I ran it manually
  (`scratchpad/sc191-review1/review-mid-grey-dark.png`): **PASS** — check / ✗ / ringed-plus
  glyphs, solid-vs-hatched track fills, solid-vs-pressed-vs-dashed rings and the written words
  all survive `grayscale(1)`. Colour is never the only channel. Worth resolving the spec's own
  contradiction before land-ready.
- **I-5** The 10 new frozen-class lines (5 capture ids × twin + realprint) are a widening and
  no widening file was produced; verified additions-only (zero name collisions against the
  210-line baseline). Slice 4's acceptance regenerates the package, so this is a note, not a
  gap.
- **I-6** Read-only renders 21 disabled write affordances (add-hero, five row-act, fifteen
  cells) rather than spec §C-7's "zero write affordances". Zero writes is satisfied
  (`replaceSource` never called; 0 enabled buttons; no ⋯ menu). Everything is disabled this
  slice regardless of `canPersist`, so read-only is currently indistinguishable from
  read-write — slice 4 must make the distinction real, and the M-1 fix must not lose it.
- **I-7** Print body ink measures `rgb(218,218,218)` on the montage — and identically on
  `negotiation`, `initiative` and `counter` (`measure3.log`). It is the documented harness
  capture artifact (print tokens over the dark canvas), inherited from the page, not a montage
  regression. `--dse-fg` under print is `#000` as expected.
- **I-8** On a complete montage the rule line switches to "Total Success awards 1 Victory…"
  even when the verdict is Total Failure (`montage-failed` fixture, measured). The mock does
  the same (`mock6.js:1011`), so it is faithful — but it explains nothing about the verdict
  the reader is looking at.

---

## Must-cover checklist results

### Model + serialization (slice 1)

| Item | Result |
|---|---|
| Round-trip (a) old-shape, exactly the pre-slice `example.yaml` shape | **PASS** — `serialize(parse(x)) === x` byte-identical |
| Round-trip (b) new-shape, every optional field set | **PASS** — byte-identical |
| Round-trip (c) `entries` for a hero not in `participants` | **PASS** — byte-identical; see L-5 for the render side |
| Round-trip (d) unicode / multiline note | **PASS on identity** (`parse∘serialize∘parse ≡ parse`, serialize idempotent); representation normalises — I-1 |
| Round-trip (e) `_dse_anchor` present | **PASS** — byte-identical, anchor passes through |
| §B.5 key order (top level) | **PASS** — probe authored the keys in *reverse* order; output was `title, description, rounds, success_limit, failure_limit, successes, failures, participants, entries, current_round, _dse_anchor`, literally §B.5 |
| §B.5 entry key order | **PASS** — `hero, round, result, skill, note` from reverse-authored input |
| §B.5 omit-when-default | **PASS for** `title`/`description`/`entries`/`_dse_anchor`/`skill`/`note` (`description: ""` and `entries: []` both omitted). **FAIL for** `participants: []` — L-3 |
| §B.3 tallies stored, never recomputed | **PASS** — the only tally readers are `montageTallies` (scalars only, `model.ts:169-179`) and the per-hero Tally column (`BoardView.ts:140-141`, the detail layer §B.2 assigns to `entries`). No `successes = count(entries)` path exists in `src/`. |
| Double-count when `entries` and scalars disagree | **None.** Probed live: `successes: 5` + one success entry renders band tracks 5/6 filled and a hero Tally of 1 — two truthful readings of two different sources, exactly §B.3. Nothing sums them. The card does not explain the divergence to the reader; §B.3 sanctions the behaviour, §H should document it. |
| Three tests proven capable of failing | **PASS** — see below |

**Can-fail proofs** (each break reverted; `model.ts` restored byte-identical, verified by `diff`):

1. `montageTallies` returns `entries.filter(e => e.result==='success').length` instead of
   `m.successes` → `montage-tally.test.ts` **3 failed / 12 passed** — "reads
   successes/failures straight off the model scalars, never from entries.length", "a block
   whose entries disagree with its scalars renders the scalars truthfully", "delta-only write
   … not successes: 1". (`canfail-1.log`)
2. `parse` assigns `entries` before `participants` → `montage-serialize.test.ts` **3 failed /
   23 passed** — round-trip identity, top-level key order, entry key order. (`canfail-2.log`)
3. the `pending` line deleted from `montageOutcome` → `test/dom/elements/montage.test.ts`
   **2 failed / 34 passed** — the `pending` band test and the Reset-menu test.
   (`canfail-3.log`)

### Persistence (§C)

Confirmed the slice-2 views write **only** through the framework: the sole mutation is
`MontageView.resetProgress()` (`view.ts:48-63`), which calls `this.update()` + `this.persist()`
(the debounced `ElementView.persist()` → injected serializer → `host.replaceSource()`); nothing
in `HeadView`/`BoardView`/`OutcomeBandView` touches the model or the host. Rendering never
writes (probed: 0 vault writes after two full renders + 2× the debounce).

| # | Probe | Result |
|---|---|---|
| 1 | Content above/below survives a write | **PASS** — my own probe through a real `ReadingModeBlockHost` + FakeVault: `## Above` / `## Below` byte-intact, 1 write |
| 2 | Two blocks in one note don't cross-talk | **PASS** — existing test at `montage.test.ts:447` uses two real hosts on one note; block B's YAML asserted `toBe(montageDoneYaml.trimEnd())`. Session-state independence is NOT-YET-POSSIBLE (no session state until slice 3) |
| 3 | A hand-edited YAML value survives a re-trigger and the next write | **PASS** — independently probed, not "by construction": `success_limit: 9`, `rounds: 4`, `title` all survive a re-render + Reset; only `successes`/`failures`/`current_round`/`entries`/`skills_used` move |
| 4 | A deleted block regenerates from a fresh paste of the example | **PASS** — `example.yaml` untouched; the end-to-end "renders through the wired processor" test still pastes and renders it |
| 5 | An old-shape block upgraded on write loses nothing | **PARTIAL / NOT-YET-POSSIBLE.** Read side **PASS** (the `old-shape` fixture renders an empty board with tracks filled 4/5 and 2/3 from the scalars). Write side has no surface in slice 2 — the board logs nothing; slice 1's model-level delta test is the only proof and it is unit-level. Re-run at slice 4. |
| 6 | Stale scalars kept, no silent recount | **PASS** — probed live: band 5/6 from the scalar, board 1 recorded cell, 0 writes from rendering |
| 7 | Read-only renders zero write affordances, zero writes | **PASS on writes** (`canPersist:false` → no ⋯ menu, `replaceSource` never called, 0 enabled buttons under `data-dse-readonly="true"`). **Partial on affordances** — see I-6 |
| 8 | Rapid clicks coalesce into one write | **PASS** — three Reset clicks 20 ms apart → **1** vault write |

### Board + outcome band (slice 2)

| Item | Result |
|---|---|
| `montageOutcome` 0/0 `pending` band fixed | **PASS** — the `default` fixture renders `data-band="pending"` / "This montage" / "Not started" with the neutral hourglass crest; slice 1's documentation test was flipped red→green |
| Equal-width tracks at 6/3 | **PASS, measured** — 413.13 px vs 413.13 px, identical left/right; failure slots 138.37 px vs success 68.78 px (2.01×). Also verified at 5/3 and at 300 px. **But ungated** — M-5 |
| Limits: `successes == success_limit` | **PASS** — `done` fixture (6/6): "Final result / Total Success", tails "the success limit, reached" / "1 under the failure limit" |
| Limits: `failures == failure_limit` | **PASS** — `failed` fixture (3/3): "Final result / Total Failure", tail "the failure limit, reached" |
| One short of each | **PASS on copy** — "1 from Total Success" / "1 more ends it" on `mid`. **FAIL on the band word** — H-1 |
| `rounds` exhaustion | **PASS** — `current_round > rounds` sets `complete`, tails go tensed, eyebrow → "Final result" |
| No add-a-hero ROW; `+` in the Heroes header cell | **PASS** — `BoardView.ts:82-92`, `+` inside `.dse-mt__board-corner`; no row exists in DOM or CSS |
| No "+" ghost lane left of Tally | **PASS** — the grid is `minmax(6.2em,auto) + rounds×minmax(5.2em,1fr) + minmax(4.4em,auto)`; no extra track |
| No crests on hero name cells | **PASS** — `.dse-mt__board-name` holds only `.dse-mt__board-who` + the (hidden) row-act |
| No bright-white element | **PASS** — `--dse-metal-bright` appears only as header text colour and the 2 px goal-slot marker, matching the approved mock; no white crest, no white result circle |
| Read-only: every new control disabled/badged | **PASS on behaviour**, see I-6 on affordance presence |
| CSS: every colour a D3-map token | **FAIL** — M-3 (`rgba(77,184,199,.07)`). Every other token used by the block is in `docs/superpowers/dse-overhaul/D3-token-map.md`; verified the worktree copy is **byte-identical** to the main checkout's, so the stale-pin footgun does not apply, and no new token was added (`token-coverage.test.ts` inert as spec §E predicted) |
| Dark, light AND print rules exist | **Dark PASS. Light PARTIAL** (M-2 — the current-round wash is lost). **Print PARTIAL** (H-2 — the structural tier reaches print but leaves the tracks inkless and lets button chrome through) |
| Steel scoping rule respected | **PASS** — the decoration tier carries `[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"])`; the structural tier is deliberately unscoped, which is the sanctioned reason the two print lines move |
| No rule reaches into another element's class list | **PASS** — the only cross-class reach is `.dse-mt__head .dse-crest { display: none }` at narrow (`:4418`), a **kit** class the montage itself mounts via `cardHead`, with the recoveries precedent cited in-comment. No `.dse-pr__*`, `.dse-init__*`, `.dse-nt__*` selector appears in the block |
| `fontSizeContract` ALLOWLIST | **PASS** — no `.dse-mt` entry added (grep clean); every font-size is a `--dse-fs-*` role token |
| Colourblind: shape carries every state | **PASS** — greyscale render verified (I-4). Weakened only by M-1's 50 % opacity |

**Capture comparison vs the approved PNGs.** Compared `montage-mid--steel-{dark,light}.png`,
`montage-narrow--steel-dark.png`, `montage--steel-print.png` and my greyscale render against
`sc191-r5-tracks-mid-dark.png`, `sc191-r6-card-light.png`, `sc191-r6-card-grey-dark.png`.
Visible differences, with sanction status:

1. Band headline **"Total Failure" (red word, skull crest)** where the mock renders **"Partial
   Success" (teal word, flag crest)**, same numbers, same "+3" rule line — **NOT sanctioned**;
   spec §A freezes mock6's default state. H-1.
2. Every cell drawn as a **raised, rounded, 1 px-bordered box** with a top-lit sheen, where
   the mock's cells are **flat** with only row separators — **NOT sanctioned**; contradicts
   ledger 2026-08-26. M-1.
3. Cell contents at **50 % opacity** (pale green rings, pale red crosses, grey skill captions)
   where the mock is at full strength — **NOT sanctioned**. M-1.
4. Light scheme: the round-3 column carries **no tint** where the mock tints it — **NOT
   sanctioned**. M-2.
5. Tracks stretch across the full band width instead of the mock's compact block — **not
   ruled on**; the ledger's ruling (equal width) is satisfied. I-3.
6. Per-hero Tally values are **bordered chips** (`--dse-chip-bg`, `--dse-metal-faint`) where
   the mock draws plain `✓2 ✕0` text — **not ruled on**, an authored refinement.
7. Two notes instead of the mock's three, and no per-cell quick-record trio (`✓ ✕ ⊕`), no
   edit chip, no bottom bar (`Log an action… / Undo / End round 3`), no tier strip, no foot
   guide — **sanctioned**: spec §F fixes `mid` at 2 notes, and §I assigns the trio/sheet/chip
   to slice 4 and the strip/guide to slice 3.

**Colour named in prose** (Scott is colourblind): the band word is **red** (`--dse-danger`
`#e74c3c`) on Total Failure, **teal** (`--dse-accent`) on Partial Success, **warm gold**
(`--dse-vp` `#e0b050`) on Total Success, **steel grey** (`--dse-metal`) on Not started. Success
rings/tallies are **green** (`--dse-turn-done` `#5cc98a`), failures **red**, assists **steel
grey**. The current-round column is a **7 % teal wash** in dark, **absent** in light (M-2).
The brink alert is a **gold** left-to-right gradient with a gold top rule. In every case the
glyph (check / ✗ / ringed plus / skull / flag / trophy / hourglass), the ring style (solid /
pressed-and-hatched / dashed / none), the track fill (solid metal / diagonal hatch / outline)
and the written word carry the state without the hue — confirmed on the greyscale render.

### Freeze package (§F)

- `npm run shots` run **twice**; `sha256sum` over all 498 PNGs identical across the two runs
  (0-line diff: `shots-diff.txt`). In-run gates all OK both runs: host-copy pin OK, button
  host-leak OK (111 kinds × 3 states × 2 schemes = 666), print-twin parity OK (124 ids),
  nested corner-radius OK, chrome placement OK, chrome host-leak OK.
- `check-freeze.sh` → `FREEZE VIOLATED: montage--steel-print.png: FAILED /
  montage--steel-realprint.png: FAILED` — **exactly those two lines, no others**, exit 1
  (the expected slice-2 state). 0 missing.
- Live hashes both `0ba0ceb991790209a7e2f2ae93cfa7b367e078e8cdbe76661108e282a8757104`;
  `rebaseline.txt` carries exactly those two lines with that hash; twin == realprint (SC-170's
  invariant); baseline's "before" lines are both `8e5cc6ae…`, count still 210.
- The four before/after crops exist and show the intended change (the whole element is
  replaced). **The "after" crop shows the H-2 defects** — two grey button blocks and two blank
  limit tracks — so it should not go to Scott as the sanction ask until H-2 is fixed and the
  hashes regenerated.
- Baseline NOT edited (verified: `freeze-baseline.sha256` still 210 lines, montage lines still
  `8e5cc6ae…`). No tag, no release.

### Battery — measured on `b2f696e`, base `origin/develop` `69eb5f7`

| Gate | Expected | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** | `1-tsc.log` |
| `npm run lint` | clean | **clean, exit 0** | `2-lint.log` |
| `rm -f main.js styles.css && npx jest` | 3559 passed / 1 skipped | **3559 passed / 1 skipped / 3560 total; 191 passed + 1 skipped of 192 suites; 3 snapshots**, exit 0 | `3-jest.log` |
| `npm run shots` ×2 | 498 PNGs, 0 FAIL, byte-identical | **498 PNGs both runs, 0 FAIL, all 498 hashes identical across runs**, exit 0 | `4-shots-run1.log`, `5-shots-run2.log`, `shots-run{1,2}.sha256`, `shots-diff.txt` (empty) |
| `check-freeze.sh` | exactly the 2 montage lines | **exactly 2 (`montage--steel-print`, `montage--steel-realprint`), 0 others, 0 missing**, exit 1 | `6-freeze.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `7-parity.log` |

Machine load at jest time: `2.21 3.87 3.75` (the load-sensitive-suite footgun does not apply).

---

## Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-review1-report.md`

All under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-review1/`:

- Gate logs: `1-tsc.log`, `2-lint.log`, `3-jest.log`, `4-shots-run1.log`, `5-shots-run2.log`,
  `6-freeze.log`, `7-parity.log`, `shots-run1.sha256`, `shots-run2.sha256`,
  `shots-diff.txt` (empty)
- Can-fail proofs: `canfail-1.log`, `canfail-2.log`, `canfail-3.log`, `model.ts.orig`
  (restore oracle; `diff` against the live file is empty)
- Probe scripts + logs: `zz-review1-probe.test.ts` + `probe-model.log` (round-trip, §B.5 key
  order, tallies, outcome boundary table); `zz-review1-integrity.test.ts` +
  `probe-integrity.log` (§C probes 1/3/6/8 + the malformed-entry probe);
  `measure.mjs` + `measure.log` (track widths, cell chrome, schemes, read-only, narrow,
  pending); `measure2.mjs` + `measure2.log` (print tier, specificity, a11y, old-shape);
  `measure3.mjs` + `measure3.log` (print-ink comparison across four elements);
  `measure4.mjs` + `measure4.log` (print `display`/`opacity`); `grey.mjs`
- Evidence render: `review-mid-grey-dark.png` (the colourblind proof)
- `mt-css.txt` (the montage CSS block, lines 3546-4440), `mt-tokens.txt` (tokens consumed),
  `git-status-before.txt`

Both probe test files were copied here and **deleted** from the worktree.
`git status --porcelain` in
`/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements` is
**empty** — no tracked and no untracked changes. Nothing was fixed; every temporary break was
reverted and verified.
