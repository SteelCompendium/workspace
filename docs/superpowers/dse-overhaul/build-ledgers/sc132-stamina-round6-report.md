# SC-132 round 6 — separators, the spine ban, A-plus, the living crest, the rail (2026-08-09/10)

Response to Scott's round-5 review (Linear comment `39f3d812`). He confirmed **G4**, closing
the component set, then opened five new things — four CSS, one factual.

**Commit:** dse `88c4d48` on `sc132-stamina`, parent `0a11b77`. `origin/main` is still
`74adb05`, so **no rebase was needed**. NOT pushed; no superproject pointer bump; no
untracked scratch (`shots-candidates/` is gitignored).
**Linear:** one self-contained comment `5f508542` with 6 inlined boards. In Progress,
labels `["Needs Review"]`.

## The five items and what shipped

### 1. The separator family (`sep` strip, tokens `n0`–`n4` + `mshow`)

He disliked the milled notch pairs ("little triangles… look out of place"). Rather than
restyle them the round re-asked the whole question: there are **four** marks that had
always been designed one at a time — zero bulkhead, winded threshold, base-max mark, temp
edge — and each option answers all four in one vocabulary.

| | idea |
|---|---|
| **N0** | control: the milled notch pairs |
| **N1** | one vertical hairline at three weights — 2px two-tone for a real EDGE (bulkhead, temp seam), 1px solid for a GRADUATION. The locked E1 seam already IS that 2px two-tone seam |
| **N2** | `skewX(-12deg)` — the R6 cells' own angle — on every mark, **and the pour's leading edge clipped on the same diagonal** (temp-off only; a diagonal cut under a square temp plate opens the triangular hole E1 exists to kill, so at temp-on the seam widens to 3px and leans instead) |
| **N3** | capsule channel + capsule fills; the bulkhead and the temp seam become 4px of bare channel. Graduations become rounded ticks |
| **N4** | brand ◆ seeds half-sunk into the channel's top rail; nothing crosses the pour. The two real edges keep their seams |

Recommended **N1**, N4 as the character option, **not N3** (a dying hero's channel ends up
with nothing marking zero — visible in the strip's dying column).

`mshow` un-hides the base-max mark for the strip's last column only; M1 (locked) hides it
everywhere else, and a family cannot be judged with a quarter of it invisible.

### 2. The spine ban (DESIGN.md rule 7)

Rule 7 was already in `DESIGN.md` (committed, dated 2026-08-10) when this round started —
confirmed, not re-added. In the ticket:

- candidate C's **two 3px `border-left`** declarations (banner + foot) deleted;
- C's `border-left-color: var(--st)` winded/dying rule → `border-color` (whole frame);
- the `foot` block's C-winded `border-left-color` → `border-color`;
- new `nospine` token pins the left edge's **width/style only**, never its colour — a rule
  that also reset the colour would give a dying plate three red edges and one grey one.
- `aplus` adds winded on the whole frame (plate + foot), so the state is said four ways:
  amber border, `shield-alert` crest, the word, the amber pour.

### 3. The counter editor — the factual answer

`src/elements/hero/view.ts` → `renderStaminaRegion()` renders **three** things in order:
`renderStaminaBar(region, …, { canPersist: false })` (display only), then
`.dse-hero__stamina-stepper` + `stepper({ label: 'Stamina', onChange })` — **that is the
`− 24 +` row** — then `renderRecoveries()`.

So it is a **pre-existing hero-sheet control**, not part of the assembly and not injected by
the harness, and today it is the **only** way to change Stamina on the sheet. (It is also
why round 5's `foot` rule needed `~` not `+`: the stepper sits physically between the bar
and the recoveries strip.)

Proposed de-duplication: **delete the stepper row; mount the hero bar with
`canPersist: true`** and let Model M + the modal + the optional popover do the editing.
Implementation-round work — `src/` stayed untouched this round.

### 4. The living crest (`crest-live` strip, `crest` / `live` / `pose-*` / `crestfill`)

Silhouette ladder is already real in `StaminaBarPanel.STATE_ICON`: `shield` →
`shield-alert` → `skull`. Added:

- **`live`** — two animations, not one at two speeds. Winded = exertion
  (`dse-crest-breathe`, scale 1 → 0.90 / opacity 1 → 0.68, 2.6s ease-in-out); dying =
  failing (`dse-crest-fail`, 1 → 0.96 / 1 → 0.45, 4.4s). **Healthy does not move.**
  The `0%/100%` keyframe is the IDENTITY frame on purpose, so "motion off" and "motion at
  rest" are the same picture.
- Accessibility, both switches, **verified by probe**: `prefers-reduced-motion: reduce`
  pins it; the plugin's own pref needs **no new CSS** (the D4 rule
  `[data-dse-element][data-dse-reduce-motion='true'] * { animation: none !important }`
  already reaches it). The probe stamps the attribute and re-reads `animation-name`.
- **`crestfill` (K3) — the crest as a VESSEL.** Fills bottom-up at current/max with a
  bright waterline. `--crest-fill` is computed by `decorateStripCell` because the panel
  publishes CHANNEL geometry (percentages of a temp-widened denominator) and **CSS calc
  cannot divide a percentage by a percentage** to recover current/max. In production it is
  one more `setProperty('--dse-*')` in `updateCandidateLayer`.
- `pose-ebb` / `pose-peak` are harness-only: the harness kills animation, so the strip
  poses the two extremes by restating the keyframes verbatim.

Recommended **K3**, full-width form only, never on the rail.

### 5. A-plus (`lap` / `lapn`) + `softsep`

A's full-width bar-first plate & foot + C's big current numeral, with C's three balance
faults fixed: **no 26rem cap** (660 of 660px measured), **no dead upper-right lane** (the
head is a two-lane grid that ends where its content ends), and the **temp chip on the
numeral's baseline** rather than hung off its cap height. Numerals 32.8px vs 15.1px = 2.2×.

**`softsep`** — the "bold red horizontal line" Scott disliked is the **foot's
`border-top`**; the dying rule painted all four foot edges. Softened to the plate's own grey
steel hairline (`--dse-metal-faint`) while the outer border keeps the red. Chosen over a
thinner/desaturated red because those keep TWO reds on one object, and a second weaker red
is exactly the distinction Scott's colourblindness makes unreliable. `nosoft` restores the
reviewed form so the board shoots a real before/after (rows 4 and 5).

### 6. The rail — diagnosis and two forms

Round 5's `flex: 1 1 15rem` (240px basis) is the cause. Measured: the recovery strip's
natural width is **169.5px** (135.9 studs + 5.6 gap + 28 button) and a 300px leaf has
**284px** of content box. The dead bottom-right corner was never about wrapping — it was
the strip being `flex: 0 0 auto` on a line it did not fill.

Fixes: crest **dropped**; bar basis 15rem → 7rem with `flex-grow: 100` (so on a shared line
essentially all slack still goes to the gauge, and only a wrapped strip's own grow has
anything to take); strip `flex: 1 1 auto` with Catch Breath `margin-left: auto`; container
gap 0.6 → 0.35rem. Dead-right is now 9px (the plate's own padding + border) at every width.

| | 260 | 300 | 360 |
|---|---|---|---|
| `rail` one-line | 2 lines, 185px gauge | 2 lines, 225px | **1 line, 33px tall, 109px gauge** |
| `rail2` two-line | 2 lines, 185px | 2 lines, 225px | 2 lines, 63px tall, **285px gauge** |

One line at 300 IS reachable (basis 6rem) and costs the gauge **52px** — reported rather
than shipped. Recommended **`rail2` as the default**.

## Harness changes worth knowing

- **`StripState.vars`** — per-COLUMN token overrides, appended to each option's list.
- **`AsmRow.vars`** — per-ROW token overrides on an assembly board (the softsep A/B).
- **`focus: 'head'`** — trims to the head lane and re-closes the plate the `foot` token
  opened.
- **`#mount { max-width: none }` on board pages.** `vars.css` caps `#mount` at 760px, which
  **silently clamped `?width=`** — the first "wide hero" board came out 760px and would have
  reported the narrow case twice. Real bug; found by probing, not by looking.
- assemblies camera: `--asm=` now takes a comma list; NARROW covers ld/ld2 × 260/300/360;
  new WIDE covers lap/lapn hero @860 with the viewport widened to match.
- strips camera: `sep` at PAGE_WIDTH 1500 and `zoom: 1.8` (a separator is 1–2px of a 10px
  slot; at 1× the strip only reports that the marks exist).

## Probe (`round6-probe.mjs`, in this directory)

Copy into the gitignored `draw-steel-elements/visual-harness/shots-candidates/` and run
from the repo root (playwright does not resolve from the workspace scratch dir).

**Four calibration traps it hit, all worth remembering:**

1. **`zoom` scales `getBoundingClientRect`** — every length in the `sep` strip is ×1.8.
   Borders are the exception: Chromium does not scale a 1px border, which is why the H2
   channel reads `9.92×1.8 + 2 = 19.86` and not `11.92×1.8`.
2. **`cssRules` throws on a file:// `<link>`** in Chromium. `harness.css` is unreadable from
   the page, so "assert the declared animation" had to become "delete the harness's
   animation killer from the INLINE stylesheet, then read the computed value".
3. **That killer does not match on its selector text.** Chromium serialises
   `*, *::before, *::after` as `*, ::before, ::after`, and `animation: none !important` as
   `auto ease 0s 1 normal none running none`. Match on
   `r.style.animationName === 'none' && getPropertyPriority('animation-name') === 'important'`.
4. **Board queries must be scoped to one `.dse-cand-row`.** The hero board holds four whole
   sheets, so an unscoped `querySelectorAll('.dse-stamina-rec__pip')` reported a four-line
   wrap that was not there. Likewise "the button wrapped" must be
   `btn.top >= pips[0].bottom`, not `top !== top` — the strip is `align-items: center`, so a
   28px button never shares a top edge with a 13.8px cell.

Final run, both schemes:

```
[dark] sep      20 cells · N1 1px/2px · N2 skew+clip · N3 capsule gap 7.2px(1.8x) ·
                N4 rim seed top -2.56px · H2 19.84px
[dark] crest    shield→shield-alert→skull · anim none/dse-crest-breathe 2.6s/dse-crest-fail ·
                reduce-motion → none · K3 fills 80%/36.7%/0%
[dark] A-plus   plate 660px = full mount · numeral 32.8 vs max 15.088 · marker 20.94x13.83 ·
                gaps [1.9,1.9,1.9,9.9,1.9,1.9,1.9] · divider rgb(231,76,60) → rgba(176,183,187,.16)
[dark] hero@760 sheet 760 · region 340 · bar 306 · stepper present ("24") BEFORE the strip ·
                marker rows 1 · CB wrapped true
[dark] hero@860 sheet 860 · region 405 · bar 371 · CB wrapped false
[dark] ld@360   plate 360x33.2 · one line true · gauge 109px · dead-right 9px · crest none
[dark] ld2@360  plate 360x63.4 · one line false · gauge 285px · dead-right 9px
…light identical…
all round-6 checks PASSED in both schemes
```

## Battery (real exit codes via a wrapper SCRIPT — `echo $?` under devbox lies)

```
npx tsc --noEmit   exit 0
npx jest           exit 0   155 suites, 2356 tests, 3 snapshots
npm run shots      exit 0   204 ok, 0 FAIL
check-freeze.sh    exit 0   freeze OK (119/119)   [needs the SHOTS_DIR argument here]
npm run parity     exit 0   0 gap(s), 0 undeclared, 16 declared deferrals
round6-probe.mjs   exit 0
```

Jest 2356 = main's 2354 + 2 (`kit-index.test.ts`'s two `test.each(kitFiles)` blocks × the
branch's one added kit module). `src/` untouched, so jest / swept shots / freeze cannot move
by construction. `obsidian-shots` NOT run (Scott's live vault owns the display).

## Files changed (dse `88c4d48`)

| File | Change |
|---|---|
| `styles-source.css` | the round-6 block (`mshow`, `n1`–`n4`, `nospine`, `aplus`, `crest`, `crestfill`, `live`, `pose-*`, `softsep`/`nosoft`, the `rail` revision, `rail2`); **C's two spines and both spine state rules deleted** |
| `visual-harness/entry.ts` | `sep` + `crest-live` strips · `lap`/`lapn`/`ld2` assemblies · `StripState.vars` · `AsmRow.vars` · `focus: 'head'` · the `crestfill` fraction · ld's caption corrected |
| `visual-harness/index.html` | `head` focus chrome · `sep` grid · `#mount { max-width: none }` |
| `visual-harness/strips.mjs` | `sep`, `crest-live`; `sep` at 1500 |
| `visual-harness/assemblies.mjs` | comma-list `--asm`; ld/ld2 at 260/300/360; lap/lapn hero @860 with a matching viewport |

## Boards on disk (this directory)

`round6-separators.png` · `round6-crest.png` · `round6-aplus-crest.png` ·
`round6-aplus-nocrest.png` · `round6-hero-wide.png` · `round6-rail.png`.
Per-scheme originals in `draw-steel-elements/visual-harness/shots-candidates/`
(`strip--sep--*`, `strip--crest-live--*`, `asm--lap*`, `asm--ld*`).

## Open — the four asks

1. separator: N1 / N2 / N3 / N4
2. crest: K3 vessel / K2 breath / K1 silhouette / drop
3. A-plus: confirm, with or without the crest; confirm the softened divider
4. rail: two-line default or one-line

Once answered, round 7 is **production implementation** (unchanged from round 5's list, plus
the stepper-row removal): the winner re-authored in the Steel layer; the whole
`[data-dse-stamina-cand]` region + `staminaCandidate.ts` + all three cameras deleted; Model M
wired for real incl. the `stamina.recoveryEditor` setting and the Undo notice; **the hero
sheet's `.dse-hero__stamina-stepper` removed and its bar made `canPersist: true`**; SC-133's
modal half; print handling with the frozen-line impact mapped first; tests. SC-97 closes with
it. Still deferred and unrelated: the duplicated Winded/Dying wound badge
(`.dse-stamina-rec__status` vs `.dse-hero__wound-badge`).
