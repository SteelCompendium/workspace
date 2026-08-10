# SC-132 round 7 — Scott's own layout, the stable crest, the rail (2026-08-10)

Response to Scott's round-6 review (Linear comment `67763d6d`). He locked **N1**, ruled
**K3 out**, proposed a **layout in his own words**, and named two rail defects.

**Commit:** dse `e199798` on `sc132-stamina`, parent `88c4d48`. `origin/main` is still
`74adb05` — **no rebase needed**, verified by `git merge-base`. NOT pushed; no superproject
pointer bump; dse tree clean (`shots-candidates/` is gitignored).

## What he ruled, and what shipped against it

| His ruling | Round 7 |
|---|---|
| "Separator — N1 for sure" | `n1` is in every round-7 assembly's token list. Nothing else changed about it. |
| "do not do K3" — the bar already reports quantity; a crest must provide EMOTION | `crestfill` is not used anywhere in round 7. It stays in the stylesheet only until the losers are deleted. |
| "the crest itself is stable (un-animated) and the icon itself gets the animation" | New `livei` token. The frame is pinned (`animation: none`, stated as a rule so composing it with round 6's `live` cannot resurrect the noisy version); the glyph gets `dse-crest-icon-breathe` 2.6s at winded and `dse-crest-icon-fail` 4.4s at dying. |
| "I am okay with no crest if its causing issues for a balanced and clean layout" | Both variants built and shot as equals: `lsc` (crest) and `lscn` (no crest). |
| The two-row split layout | `split` / `splitn`. |
| "the recovery UI doesnt compress" | `rcomp` + `rnarrow`. |
| "the 'catch breath' button is *very* close to the edge of the card" | `railpad`; `railtight` shoots the before. |
| "collapse into a fraction form ('5/8')… I dont love it" | `rfrac`, one labelled row. |

## The layout (`split`)

His geometry, verbatim:

```
┌──────┬────────────────┬──────────────┐
│      │ winded         │      11 / 30 │   row 1  (baseline-aligned)
│crest ├────────────────┴──────────────┤
│      │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ │   row 2  (the gauge)
└──────┴───────────────────────────────┘
```

Implementation notes worth keeping:

- The head's three children are promoted into the PLATE's grid with
  `display: contents` on `.dse-stamina__chead`, because the GAUGE is the head's SIBLING
  and has to share a column with the numerals while the crest spans both rows. A nested
  head grid cannot express that.
- Column 2 is `minmax(0, 1fr)`, not `1fr` — a bare `1fr` has an `auto` minimum, so a long
  state word pushes the readout off the plate instead of being the thing that gives.
- `split` is composed **on top of** round 6's `aplus` and must stay after it in source
  order: the two collide on `.dse-stamina__chead`'s display and the plate's padding, at
  equal specificity. Composing rather than forking means the only thing that changed
  between the board Scott reviewed and this one is the grid.
- **The "Stamina" label is dropped by the presence of `.dse-hero__region-title`,** not by
  surface name — his own parenthesis was "(at least on the Hero Sheet)". A bare
  `ds-stamina` block in a note has no title above it and keeps the word.

### Spacing decisions (his "make sure there is proper padding")

| | value | why |
|---|---|---|
| plate padding | `0.7rem 0.85rem 0.75rem` | A-plus was 0.6/0.8/0.65 around THREE bands; this has two, so the same plate affords a squarer inset without growing. |
| crest column gap | `0.75rem` (12px) | shield reads as a separate object, still one instrument. |
| row gap (numerals → gauge) | `0.45rem` (7.2px) | ≈ half the plate's block padding, so the two rows group INSIDE the plate rather than float in it. |
| foot padding | `0.45rem 0.85rem` | **the alignment fault this pass found:** A-plus's plate was inset 0.8rem and its foot 0.7rem, so the crest and the word RECOVERIES under it were 1.6px out of line. |
| Catch Breath | `margin-left: auto` | mirrors the numerals above it; otherwise the foot left-packs into a short row with a hole on the right — the same fault he named in C's top-right. |
| crest | 2.8 × 3.15em standalone, **2.2 × 2.5em on the hero** | measured, not preference — see below. |
| crest glyph | `--dse-crest-nudge: -0.3em` / `-0.24em` | SC-130's optical centring re-derived for these boxes (9.56% of box height; the token is only declared on `.dse-crest--lg`, which this crest is not, so the glyph was sitting visibly low). |

## Three defects found by measuring

1. **The foot's left margin did not match the plate's** (0.7 vs 0.8rem). Fixed.
2. **`.dse-stamina-rec`'s `min-width: auto`.** A flex item's automatic minimum is its
   max-content size, so a nowrap strip refused to be narrower than its contents and
   OVERFLOWED the rail plate — 241.7px of strip inside a 234px content box at a 260px
   leaf with 12 recoveries. Nothing downstream can compress until that box is allowed to.
3. **`.dse-hero__region` has the same automatic minimum.** Unwrappable content pushed the
   stamina region ~34px past the sheet's own border (`grid-template-columns: 370px
   363.688px` inside a 626px grid). Fixed with `min-width: 0` — **narrowed with `:has()`
   to the stamina region only**, because zeroing it on every region made the columns
   305/305 and clipped "Presence" off the characteristics row. A fix for one region paid
   for out of another's content is not a fix. Latent hero-grid bug, not something round 7
   introduced; the production round should decide it on `.dse-hero__region` proper.

## The narrow hero, and why a container query

The sheet's grid gives characteristics its 370px max-content and stamina the remainder,
so the narrowest real stamina region is **240px** (at a 660px sheet). At that width, with
the crest at 2.8em, the state word and the readout came within **1.45px** of touching.
Two answers, both applied:

- the crest steps down to 2.2 × 2.5em on the hero — ~10px back to the gap (now 11.06px),
  and it costs nothing informational, since on the sheet the crest is the one member
  carrying nothing the border/word/numeral do not;
- `.dse-stamina__cstate` gets `min-width: 0` + ellipsis as the last-resort degradation.
  Measured, it does not engage at any width this repo can produce.

The recovery strip needed more. Measured at 240px:

```
strip content box  178.8px
RECOVERIES eyebrow  70.9
two strip gaps      16.0
Catch Breath        28.0
left for 8 markers  63.9   — they want 169.6
```

Even at the 0.42em floor the markers need ~95px, so compression alone cannot close it —
the row ran ~2px long and the last markers slid UNDER the Catch Breath button. **Flexbox
has no answer:** line-breaking happens before flex-shrink, so a container that wraps never
shrinks and one that shrinks never wraps. The "cells wrap instead" branch was built and
measured too and produced FOUR marker rows, which is worse than what it replaced.

So the eyebrow stands down, which is Scott's own round-4 ruling ("on more condensed views
I think we can drop it (still need a tooltip)") applied **by measurement rather than by
surface name** — a 240px column IS a condensed view, a 405px one is not. The only CSS that
can ask "is the box I am in narrow" is a **container query** (a media query asks about the
window; the same 240px column exists in a 1400px window). `container-type: inline-size` is
Chromium **105**, under the plugin's 106 floor — and the support-floor deny-list bans
`@container style(` (STYLE queries, 111), not size queries. Containment sits on
`.dse-stamina-rec`, whose width comes from its parent regardless.

Result at 240px: eyebrow gone, markers compress to 10.41px, one countable line, button
clear. At 405px: eyebrow present, markers at full 16px, one line.

## The rail (`ld3`)

Two lines is the form. Measured, both schemes:

| leaf | plate | gauge | 12 recoveries | Catch Breath right gap |
|---|---|---|---|---|
| 260 | 260×71.4 | 176.9 | 1 row, cells 10.88px (compressed) | **9 → 13px** |
| 300 | 300×71.4 | 216.9 | 1 row, cells 11.52px | 9 → 13px |
| 360 | 360×71.4 | 276.9 | 1 row, cells 11.52px | 9 → 13px |

Plus, under real pressure (a 170px plate, 12 recoveries): cells compress to the 6.72px
floor and the strip is **still one row** — round 6's would have wrapped.

The board carries a before/after padding pair (`railtight` / default), the one-line
comparison row (`oneline` — real only from 360px up, and it costs the gauge 277 → 101px),
and one `rfrac` row labelled as the option he does not love.

## Probe (`round7-probe.mjs`, in this directory; output in `round7-probe-output.txt`)

Copy into the gitignored `draw-steel-elements/visual-harness/shots-candidates/` and run
from the repo root. Two new calibration traps on top of round 6's four:

1. **`getBoundingClientRect().width` on a skewed element reports the TRANSFORMED bbox.**
   R6 cells are `skewX(-12deg)`, so an 11.52px cell measured 15.84px and "did the cells
   compress" was unanswerable. Layout width is `getComputedStyle(el).width`.
2. **`display: none` children still return a (zero) rect,** so `new Set(tops).size` is
   **1**, not 0, for a hidden marker row. Test the CONTAINER's computed display.
3. (worth restating) The camera's unpinned hero board measures the PAGE, so reproducing it
   needs `page.setViewportSize`, not `?width=`. Picking
   `.dse-hero__region-title.parentElement` also silently measures the CHARACTERISTICS
   region — the wide one — and hides the narrow case entirely. Scope by
   `.dse-stamina.closest('.dse-hero__region')`.

## Battery (real exit codes via a wrapper SCRIPT — `echo $?` under devbox lies)

```
npx tsc --noEmit   exit 0
npx jest           exit 0   155 suites, 2356 tests, 3 snapshots
npm run shots      exit 0   204 ok, 0 FAIL
check-freeze.sh    exit 0   freeze OK (119/119)
npm run parity     exit 0   0 gap(s), 0 undeclared, 16 declared deferrals
round7-probe.mjs   exit 0   both schemes
```

Identical to round 6 in every number, which is the correct answer and worth stating:
`src/` is untouched again, so jest, the swept shots and the freeze surface cannot move by
construction. `obsidian-shots` NOT run (Scott's live vault owns the display).

## Files changed (dse `e199798`)

| File | Change |
|---|---|
| `styles-source.css` | the round-7 block: `split`/`splitn`, `livei` + two keyframes + `posei-*`, `rcomp`, `rnarrow` (+ the container query), `railpad`/`railtight`, `oneline`, `rfrac` |
| `visual-harness/entry.ts` | `crest-icon` strip · `lsc`/`lscn`/`ld3` assemblies · the split/rail row sets |
| `visual-harness/assemblies.mjs` | the three new ids · ld3 at 260/300/360 · lsc/lscn hero @860 |
| `visual-harness/strips.mjs` | `crest-icon` |

## Boards on disk (this directory)

`round7-scott-crest.png` · `round7-scott-nocrest.png` · `round7-crest-icon.png` ·
`round7-hero-wide.png` · `round7-hero-narrow.png` · `round7-rail.png`.
Per-scheme originals in `draw-steel-elements/visual-harness/shots-candidates/`
(`asm--lsc*`, `asm--lscn*`, `asm--ld3*`, `strip--crest-icon--*`).

## Open — the three asks

1. crest: the animated-icon crest (`lsc`) or no crest (`lscn`)
2. his layout: confirm, or name the adjustments
3. rail: confirm two lines as the form (+ fraction-collapse yes/no)

After those confirms, round 8 is **production implementation**: the winner re-authored in
the Steel layer; the whole `[data-dse-stamina-cand]` region + `staminaCandidate.ts` + all
three cameras deleted; Model M wired for real incl. the `stamina.recoveryEditor` setting
and the Undo notice; the hero sheet's `.dse-hero__stamina-stepper` removed and its bar
made `canPersist: true`; SC-133's modal half; print handling with the frozen-line impact
mapped first; tests. **SC-97 closes with it.** Still deferred and unrelated: the duplicated
Winded/Dying wound badge (`.dse-stamina-rec__status` vs `.dse-hero__wound-badge`).
