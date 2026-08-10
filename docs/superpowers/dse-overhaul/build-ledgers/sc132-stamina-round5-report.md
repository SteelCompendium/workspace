# SC-132 round 5 — the G4×R6 confirm and the three ASSEMBLED layouts (2026-08-09)

Response to Scott's round-4 ruling (Linear comment `59638cd9`). He **locked the component
set** and left exactly two things open: one component confirm (G4 on the R6 cells) and the
layout pick he has deliberately deferred since round 2.

**Commit:** dse `0a11b77` on `sc132-stamina`, parent `85d9ab7` (the round-4 commit rebased
onto `origin/main` `74adb05` — SC-133/134/130/131 all landed). NOT pushed; no superproject
pointer bump.
**Linear:** one self-contained comment `e0d0068f` on SC-132 with 4 inlined boards. Status
In Progress, labels `["Needs Review"]`.

## The rebase (do this first if you pick the branch up)

`git rebase origin/main` hit **one conflict**, in `styles-source.css`: SC-131's settings
block and the SC-132 candidate region were both appended at the same place. Both sides
kept, blank line between them. Nothing semantic.

**Then `npm ci`.** The worktree's `node_modules` still had **obsidian 1.8.7** while SC-131
moved `package.json` to **1.13.1**, so `tsc` reported **19 phantom errors** in
`SettingsTab.ts` / `settingsDeclarative.ts` (`SettingControl`, `SettingDefinition*`,
`PluginSettingTab.display`) that have nothing to do with this ticket. After `npm ci`, clean.

**Also worth knowing: `echo $?` inside `devbox run -- bash -c '…'` is a LIE.** Devbox's `sh`
wrapper expands `$?` before bash sees it, so it always reports 0. (Same family as the
`$PIPESTATUS` caveat in the workspace CLAUDE.md.) Every gate in this round was run through a
tiny wrapper *script file* that captures `$?` itself — see the battery section.

## Scott's ruling, and what it did to the work

| Item | Ruling | Effect on the build |
|---|---|---|
| Temp treatment | **S0** — the shipped **violet/purple** plate is fine; he is colourblind and had not perceived it as purple | The blue question dissolves. `--dse-stamina-temp` **untouched**; SC-10 Task 6 / SC-106's "blue is reserved for `--sc-act-maneuver`" contract intact. Round 4's candidate-local `--sh` cyan is now dead code and appears in **no** assembly |
| Placement | **P1 appended** | Default geometry — no token needed |
| Marker | **R6** outlined fill-in cell | `r6` in every assembly |
| Grouping | **G4, soft** — wanted to see it on R6 | The `rec-g4r6` strip |
| Interaction | **Model M**, ALT kept as an **optional setting** | `im` in every assembly; the setting (`stamina.recoveryEditor: direct \| popover`) is implementation-round work |

## THE COLOURBLINDNESS RULE (now a repo doc, not a memory)

Scott disclosed it in passing. It is a standing design-process constraint, so it is written
into **`docs/working-preferences.md`** (new section, above the screenshots-are-the-review-
medium rule):

1. **Never let hue alone carry meaning** — pair every colour with a shape, a material, a
   border, a position or a word.
2. **Name the colour in prose** in every review comment that discusses one.

A whole round of this ticket was spent debating blue-vs-purple for the temp bar. He could
not perceive the difference the question was about, and nobody had said the word "purple".

## What was built

### 1. `rec-g4r6` — the confirmation strip

3 options × 6 states. Options: **G0 ungrouped (control)** · **G4 + LF1 hero-sheet eyebrow**
· **G4 + LF2 condensed, no label**. States: 8 and 12 recoveries × none/partly/all spent.

Two harness changes it forced, both generally useful:

- **`transpose`** on `StripDef` — options become the COLUMNS and states the ROWS. Six
  12-marker rows do not fit six columns at any sane page width, and the untransposed first
  cut **wrapped every 8-and-12 row onto two lines**, which would have misreported the exact
  thing the strip exists to confirm. (Caught by looking at the first shoot; now a probe
  assertion — `rowTops === 1` on all 18 cells.)
- **`PAGE_WIDTH`** in `strips.mjs` — a per-strip viewport override (this one needs 1620).
- **`notip`** — suppresses `decorateStripCell`'s posed LF2 tooltip where LF2 is only along
  for the ride (six posed tooltips would bury the grouping).

### 2. The assembled layouts — `?asm=la|lc|ld` + `board=` (+ optional `width=`)

The round's thesis: **an assembly is not a new design, it is the approved tokens composed.**
Each one is a single `data-dse-stamina-var` list stamped on every board row, so it is
matched by *the very CSS the approved strips were shot under* and cannot have drifted:

| id | Layout | Base cand | Tokens |
|---|---|---|---|
| `la` | A "Forged Gauge" — bar-first, no crest | `a` | `e1 m1 h2 forged r6 g4 im lf1 y3 foot` |
| `lc` | C "Banner & Crest" × the forged channel | `c` | `e1 m1 h2 forged r6 g4 im lf1` |
| `ld` | D "Sheet Rail" — the density variant | `d` | `e1 m1 h2 r6 g4 im lf2 notip rail` |

Boards: standalone (8 rows: healthy · temp · winded · dying · the **three SC-133 cases** ·
read-only) and hero-sheet context (3 rows: healthy · 8/30 +40 · dying), both schemes, plus
the rail at **300px** (Obsidian's default sidebar leaf). New camera
`visual-harness/assemblies.mjs`, same quarantine as the other two (separate camera,
`shots-candidates/`, off-manifest fixtures).

New hero fixtures: `temp-full` / `temp-over` / `temp-dying` — **the first time SC-133's
geometry has been shown inside the sheet**; rounds 1–4 only ever proved it standalone.
New bar fixture: `rec-12-none` (0 of 12).

### 3. Three round-5 CSS tokens — JOINERY, not new options

- **`forged`** — A's milled channel treatment made candidate-agnostic, so the C hybrid can
  finally take A's channel. C's marks were the site's **rule** grammar (a ◆ threaded on a
  5px hairline), correct at C's original 0.30rem gauge and wrong at the locked H2, where the
  gauge is a real 10px machined slot and a ◆ floating mid-slot is the same "mark that missed
  its track" defect round 2 fixed. Every property C set is restated, so the reset is total.
- **`foot`** — the recoveries strip as the plate's lower register (C always had one; a
  bar-first layout had a loose row under a closed block).
- **`rail`** — stud-scale R6 (0.72 × 0.56em) with the grouping gap scaled to keep the 3:1
  punctuation ratio, and **dying as a border only** (Scott's round-3 ruling: Y1 for the
  rail, Y3 for the sheet).

## Two defects the ASSEMBLY exposed that no component strip could

Both were found by looking at the first assembled boards, and both are structurally
invisible to a per-component strip. This is the argument for assembling at all.

**1. The foot did not follow the plate into dying.** A dying hero rendered as a flooded red
banner sitting on an untouched grey drawer — two objects. A strip never shows a plate and
its foot in a non-resting state together, so nothing before this round could have caught it.

The fix needs `:has()` and `~`, and the reason is worth keeping:
`[data-state]` lives on `.dse-stamina__cand`, **three levels inside the PRECEDING sibling**
of `.dse-stamina-rec`, so no plain combinator can see it at all; and on the **hero sheet the
stamina stepper sits between the bar and the strip**, so `+` fails where `~` works. Applied
to both the `foot` token and candidate C's own foot. (`:has()` is already load-bearing in
candidate D, and the plugin's Chromium 106 support floor clears it.)

**2. The rail's plate was on the BAR, not on the ROW.** `.dse-stamina__cand` holds only
crest + numerals + gauge; the recovery studs and Catch Breath are SIBLINGS of the bar. So
the instrument's border ran between the gauge and the markers and the rail read as "a bar,
plus some loose studs". The plate now goes on the enclosing row
(`:has(> .dse-stamina[data-cand='d'])`) and the inner plate stands down.

Scoped to **standalone surfaces only** via `:not(:has(> .dse-hero__region-title))` — on the
hero sheet the rail's parent is the stamina REGION, which already has its own card chrome
and heading, so a second border would be a box inside a box.

This is also what rescues the sidebar: at 300px the row wraps, and with the plate on the row
it is **one instrument on two lines** instead of a plate with an orphan row underneath.

## The measurement that bears on the pick

The hero sheet's stamina region is **240px in a 760px note and 340px at ≥1000px**. A/C's
full-size R6 cells (20.9px) fit one line at 340px but **wrap at 240px**; the rail's studs
(15.8px) never wrap at 760/1000/1400. Implementation consequence: the in-sheet cluster
should take stud scale below ~280px of column. Not a reason to pick a layout, but Scott
should know it before picking rather than after.

## Recommendation posted

**C for the full form + D as the density variant; drop A.** Three reasons, weighted:

1. **C's state signal is not a colour.** The crest changes *silhouette* — shield →
   shield-with-alert → **skull** — on top of the amber/red. Given the colourblindness
   disclosure this stops being a tie-breaker and becomes the argument. (I would not have
   ranked it first two rounds ago.)
2. **A's full-bleed is a liability where the cluster actually lives.** 240–340px on the
   sheet, so full width buys nothing; and in a wide note A stretches to a metre of channel
   with the numerals flung to the far edge — number and bar stop being one readout. C's
   26rem cap is the deliberate answer.
3. **Scott already said it.** Round 1: *"Candidate C is very strong overall… left a bit
   wanting. Maybe its too short?"* — that was the 0.30rem hairline, now H2 + A's channel.
   A was only *"fine for the bars"*, and its "terrible" tier separators are what E1 replaced.

The honest counter-argument for A (a big horizontal bar is the more universal HP grammar) is
stated in the comment so he can take it.

## Verification

**Round-5 probe** — `round5-probe.mjs` in this directory, both schemes. It does not resolve
`playwright` from here; copy it into the (gitignored)
`draw-steel-elements/visual-harness/shots-candidates/` and run from the repo root:

```bash
cp round5-probe.mjs <dse>/visual-harness/shots-candidates/
devbox run -- bash -c 'cd <dse> && node visual-harness/shots-candidates/round5-probe.mjs'
```

```
[dark]  rec-g4r6  R6 box 20.94x13.83 identical spent/available · G4 gaps @[4,8] on 12 ·
                  no fraction anywhere · 18 rows all single-line
[dark]  la  foot rest rgba(176,183,187,.16) → dying rgb(231,76,60)
[dark]  lc  zero seam 9.906px tall, transform none · foot → rgb(231,76,60)
[dark]  ld  rail 33.2px tall · marker 15.84x10.95 · label hidden
[dark]  ld@300  plate 300x65.2px, gauge 194.5px, markers enclosed
[light] …identical readings…
all round-5 checks PASSED in both schemes
```

Asserted rather than eyeballed, per scheme: every assembly still carries `r6 g4 e1 m1`
(**the composition claim, token by token** — an assembly is ten specificity contests against
rules written for another context); the base-max mark is `display: none` everywhere (M1);
the channel is **11.92px border-box** everywhere (H2); Catch Breath is icon-only everywhere
(Model M); the shield's `clip-path` is `none` everywhere (E1); the G4 gap is **drawn**, not
merely stamped; the marker row never wraps at board width; **P1** — the temp plate starts
within 0.6px of the pour's right edge in all three SC-133 states and never leaves the
channel; no temp plate at all at temp 0; A hides the crest and C shows it; C's zero mark has
`transform: none` and spans the channel interior (**forged**); the foot's border differs
between resting and dying (the defect above, as a test); the rail's enclosing plate exists
and the inner plate has stood down; the rail is ≤34px; and at 300px the plate is ≤302px wide
with the gauge still >40px and every marker inside the border.

## Battery (real exit codes — captured by a wrapper SCRIPT, since `echo $?` under devbox lies)

```
npx tsc --noEmit   exit 0   (no output; needed `npm ci` first — see the rebase note)
npx jest           exit 0   Test Suites: 155 passed, 155 total
                            Tests:       2356 passed, 2356 total
                            Snapshots:   3 passed, 3 total
npm run shots      exit 0   204 ok, 0 FAIL
check-freeze.sh    exit 0   freeze OK (119/119 legacy+print PNGs byte-identical)
npm run parity     exit 0   0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).
round5-probe.mjs   exit 0   all checks PASSED in both schemes
```

**Jest count explained:** main baseline is **2354**; the branch is **2356**, +2. Not new test
files — `test/dom/kit/kit-index.test.ts` has two `test.each(kitFiles)` blocks enumerating
`src/framework/kit/*.ts`, and the branch adds one module there (`staminaCandidate.ts`).
2 blocks × 1 file = 2. Unchanged since round 4; the absolute number moved 2337 → 2356 only
because main did (SC-131 landed).

`check-freeze.sh` needs its SHOTS_DIR argument here — the script's default still points at
the `steel-type` worktree.

`obsidian-shots` was NOT run: `pgrep -af obsidian` shows Scott's live vault owning the
display.

## Files changed (all inside the harness-gated candidate region)

| File | Change |
|---|---|
| `visual-harness/entry.ts` | the `rec-g4r6` strip · `ASSEMBLIES` + `AssemblyDef` + `mountAsmBoard` + the `?asm=` param · `transpose` in `mountStrip` · 4 new fixtures · the `notip` opt-out |
| `visual-harness/assemblies.mjs` | **new** camera → `shots-candidates/asm--<layout>--<surface>[--w<px>]--<scheme>.png` |
| `visual-harness/strips.mjs` | `rec-g4r6` in `ALL`; per-strip `PAGE_WIDTH` |
| `visual-harness/index.html` | strip chrome for the transposed layout |
| `styles-source.css` | the round-5 joinery block (`forged` / `foot` / `rail`), inside the existing candidate region |
| `docs/working-preferences.md` *(workspace)* | the colourblindness rule |

`src/` is **untouched** in round 5 (as in rounds 3 and 4), so jest, the swept shots and the
freeze surface cannot move by construction.

## Boards on disk

`round5-rec-g4r6.png` · `round5-layouts-standalone.png` (3 layouts across, dark row over
light row) · `round5-layouts-hero.png` (same treatment, hero context) ·
`round5-rail-sidebar.png` (the 300px leaf, dark | light). All stitched with `magick` and
resized 50% (they are `deviceScaleFactor: 2` captures, so 50% is 1× CSS px and stays
readable in Linear). Per-scheme originals:
`draw-steel-elements/visual-harness/shots-candidates/asm--*.png` and `strip--rec-g4r6--*.png`.

## Open for round 6

**Nothing design-side except the two asks.** Once Scott confirms G4 and names a layout, the
next round is **production implementation**:

1. the winner re-authored as real code in the Steel layer (full states, both surfaces);
2. the entire `[data-dse-stamina-cand]` region, `src/framework/kit/staminaCandidate.ts`,
   `visual-harness/candidates.mjs` / `strips.mjs` / `assemblies.mjs` and the losing layouts
   **deleted**;
3. Model M wired for real (markers as a value control, the Undo Notice, the ALT stepper as
   the `stamina.recoveryEditor` setting);
4. **the modal half of SC-133's RC-1** (untouched since round 1);
5. print handling, and the frozen-line impact mapped before the first byte moves;
6. tests.

**SC-97 closes when that lands.** Still deferred and unrelated: the duplicated Winded/Dying
wound badge (`.dse-stamina-rec__status` vs `.dse-hero__wound-badge`), its own ticket.
