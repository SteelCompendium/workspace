# SC-361 r1 design report: Conditions colour swatch focus indicator

**Executive summary**
1. **Recommendation: Option B.** Mark the selected swatch with a check glyph inside it: a white check with a dark outline. Focus then uses the standard kit ring, the solid teal-cyan 2px ring at a 2px offset. That ring is exactly what selection uses today.
2. Why: B is the only option where all four states differ by shape, not by hue or radius. Focus means "ring around"; selection means "check inside". It never draws two rings in one gap, and it removes the shared-ring exclusion instead of adding a second focus style.
3. Contrast, focus ring vs modal ground: 7.75:1 in dark (teal-cyan #4db8c7), 4.69:1 in light (dark teal #2a7b88).
4. Contrast, check: the white stroke alone is ≥3.68:1 on every swatch fill (amber #b9770e is the floor). Every fill has one glyph edge ≥4.01:1. White against the dark outline is ≥14.8:1.
5. Collision case (selected swatch next to a focused neighbour): B leaves 7.75px of clearance at base size and 5.5px at the small size. Today the marks are 0.25px apart, so they effectively touch. A overlaps at base size, and C has 0.25px at the small size.
6. Today fails twice. Obsidian's grey focus halo is only 2.43:1 in dark and 1.80:1 in light, and the custom (pipette) swatch shows no focus indicator at all. All three options fix the pipette with `:has(> input:focus-visible)`.
7. Deciding images: `evidence-r1/sc361-r1-grid.png` and `evidence-r1/sc361-r1-grid-gray.png`. Size probe: `evidence-r1/sc361-r1-sizes.png`.
8. Judgment call for the owner: the check's shape. DESIGN.md's iconography rule says "never hand-draw new SVG icons". The prototype uses Lucide's `check` path, the icon set Obsidian already ships. The alternative is the house ◆ mark (DESIGN.md rule 9). See §5.

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r1-design-1792550042879830531/`. It holds the capture script `sc361-capture.cjs`, the analysis and composition script `sc361-analyse.py`, the final run in `run4/` (cells, `metrics.json`, `analysis.md`), and the earlier runs `run2/` and `run3/`.

---

## 1. Method

- Worktree dse `sc361-swatch-focus` at `188755b`, which is also `origin/develop` (fetched; it has not moved). I ran `npm ci`, `npm run harness:build` and `npm run host-css` in the worktree. Their outputs are gitignored, so `git status --short` stays empty in both dse and the superproject.
- The pages are rendered in real Chromium through Playwright and load `visual-harness/index.html?element=conditions&fixture=default&theme=steel&bg=<dark|light>&sheet=1`. That stack is the built plugin CSS (`dist/harness.css`) on top of Obsidian's pinned 1.13.7 `app.css`, the same stack the shots camera uses for screen captures. The modal is opened with real clicks: `+ add condition`, then `Customize Bleeding`.
- Prototype CSS was injected with `addStyleTag` (appended last). I did not edit `styles-source.css` and committed nothing.
- **Real keyboard focus.** For every focused cell the script pressed `Tab` until `document.activeElement` was the target. That took 26 Tabs to reach the green swatch and 1 to reach its right neighbour. It then asserted `matches(':focus-visible')`. For the pipette it asserted on the `<input type=color>` and on the label's `:has(> input:focus-visible)`. Every assertion passed in every cell.
- Captures use device scale factor 4. Two complete runs were byte-identical (md5 of all 136 shared cells).
- Which swatch is which:
  - Every grid cell centres on the **green** swatch (#1e8449). Its neighbours are **amber** (#b9770e) on the left and **blue** (#2874a6) on the right.
  - "Selected, neighbour focused" means green is selected and blue has keyboard focus. This is the worst-case adjacency.
  - The custom cells centre on the pipette swatch, with **purple** (#7d3c98) to its left.
- Ground under the swatches, sampled from pixels: dark rgb(22,22,22) and light rgb(250,250,250). In a real vault the modal background (`--color-base-00`) under the editor's 18% / 2% black wash computes to rgb(25,25,25) and rgb(250,250,250), and both are reported.

## 2. The options prototyped (3 + today)

All three options model adding `.dse-swatch` to the SC-203 host re-grounding block B (`box-shadow: none`). Otherwise Obsidian's grey `button:focus-visible` halo (`0 0 0 3px` light grey) stacks under any new indicator. That halo is today's focus indicator.

| | Selected | Focused | Selected + focused |
|---|---|---|---|
| **today** | solid teal-cyan ring, 2px wide, 2px out (outline) | Obsidian's grey halo, 3px, touching the swatch; **pipette: nothing** | teal-cyan ring plus a grey halo inside it |
| **A: dashed focus ring** | solid teal-cyan ring (unchanged) | **dashed** teal-cyan ring in the same place | dashed ring pushed to 3px out, plus a thin solid teal-cyan band (1.5px) hugging the swatch |
| **B: check glyph + kit ring** | **white check with a dark outline**, inside the swatch, no ring | the standard kit ring: solid teal-cyan, 2px wide, 2px out | check plus ring |
| **C: wider gap + concentric ring** | solid teal-cyan ring (unchanged); row gap 0.45em → 0.9em | a second solid teal-cyan ring further out (6–8px) | both rings, concentric |

I chose the ticket's three options as written: dashed ring, moving selection to a check, and wider spacing with an outer ring. The ticket also lists an "inset ring" as an alternative selection mark, which I did not build. It is the same idea as B but ring-shaped, so it brings back ring-against-ring as the distinction. It would also need a two-tone white-and-dark band to clear 3:1 on all five fills: white passes on all of them (≥3.68), but a dark band alone fails on purple.

## 3. Measurements

### 3.1 Non-text contrast (WCAG 1.4.11, ≥3:1)

| theme | indicator | vs ground (harness / real modal) | vs swatch fills: min (which) / max |
|---|---|---|---|
| dark | teal-cyan ring #4db8c7 (selection in today/A/C; focus in A/B/C) | **7.75 / 7.53** | 1.58 (amber) / 3.03 |
| dark | Obsidian grey halo #555555 (today's focus) | **2.43 / 2.36: FAIL** | 1.05 (purple) / 2.03 |
| light | dark-teal ring #2a7b88 | **4.69 / 4.69** | 1.04 (blue) / 1.44 |
| light | Obsidian grey halo #bdbdbd (today's focus) | **1.80 / 1.80: FAIL** | 1.96 (amber) / 3.76 |
| both | B white check stroke | n/a | **3.68 (amber) / 7.07** |
| both | B check dark outline (black at 70% over the fill) | n/a | 2.46 (purple) / 4.01 |
| both | B white stroke vs its own dark outline | n/a | 14.77 / 17.38 |

How to read the table:

- Every ring in every option sits off the swatch, at 2px or more. Its adjacent colours are therefore the ground on both sides, so the "vs ground" column is the 1.4.11 number. Ring-against-fill only matters where rings run into each other (§3.2) or a band touches the swatch.
- A's "selected + focused" inner band touches the swatch edge. Against the fills it measures 1.04–1.58 in both themes. It is visible only through the ground gap on its outer edge, which gives 7.75 in dark and 4.69 in light.
- B's check, edge by edge:
  - The best edge per fill is 5.44 on red (white), 4.01 on amber (outline), 4.72 on green (white), 5.07 on blue (white) and 7.07 on purple (white).
  - The white stroke alone clears 3:1 on every preset.
  - Because the check is white with a dark outline, it would still clear 3:1 on a custom colour of any lightness, if custom colours ever gain a selected state.
- Swatch fill luminance runs from 0.099 (purple, the darkest) to 0.235 (amber, the lightest).

### 3.2 Collision with the neighbouring swatch

The probe takes the ink of the selected green swatch's mark and the ink of the focused blue neighbour's ring. Each is captured separately and diffed against the resting state. The number reported is the minimum 2-D distance between the two inks, in CSS px; 0 means they touch or overlap. The table covers both themes; the per-size figures are from dark.

| | small (row 12px, swatch 15.6px, gap 5.4px) | **base** (row 15px, swatch 19.5px, gap 6.75px) | large (row 20px, swatch 26px, gap 9px) |
|---|---|---|---|
| today | **TOUCH** | 0.25 (light: 0.25) | 2.25 |
| A | **TOUCH** | **TOUCH** (light: TOUCH) | 1.25 |
| B | 5.5 | **7.75** (light: 7.75) | 10.89 |
| C | 0.25 (gap 10.8px) | 3.25 (gap 13.5px) | 7.25 |

The geometry behind these numbers:

- Outline widths and offsets are fixed px, but the gap is in em, so the gap gets tighter as the UI text shrinks.
- In A, two 4px footprints sit in a 6.75px gap: 8 > 6.75, so they overlap at base size.
- In C, the 4px selection ring and the 8px focus ring sit in a 13.5px gap: 12px leaves a 1.5px analytic margin. At the small size it is 12 against 10.8 by the same arithmetic, yet the pixel probe still finds 0.25px of clearance between the inks.
- In B only one ring can exist at a time, because there is only one focus. The check sits inside its own swatch. Its 4px ring footprint fits even the small gap.

The "small" and "large" sizes are modelled by setting the row font to 12px / 20px and the swatch font to 10.4px / 17.33px, keeping today's ratio. Obsidian has no UI font-size setting, so this stands in for the plugin's control text-scale (SC-372/SC-422) and for host font changes. Zoom scales px and em together and does not change the ratios.

Vertically, the row sits 9.75px from the Duration chips above and the Effect chips below. B's ring reaches 4px, leaving 5.75px clear. C's outer ring reaches 8px, leaving only **1.75px** (1.45px at the small size).

### 3.3 Grayscale (Scott is colourblind)

WCAG ratios are luminance-based, so the numbers above hold in grayscale. What grayscale tests is whether the states differ by something other than hue. See `sc361-r1-grid-gray.png`:

- **today:** in grayscale, focus is a soft grey blob hugging the swatch and selection is a light ring with a gap. They can be told apart, but the focus mark is below 3:1. The pipette shows no focus change at all.
- **A:** focused versus selected comes down to dashed versus solid on the **same** ring at the same radius, which is a fine texture difference on a ring about 27px across. Selected + focused (dashed ring plus inner band) reads as a busier version of focused. The two are told apart only by the thin inner band.
- **B:** a ring alone, a check alone, and a check plus ring are three different shapes. Selected + focused is unambiguous because it adds the ring and keeps the check.
- **C:** focused unselected and selected are both a single grey ring of the same tone. They differ only in radius (6–8px against 2–4px), with no shared reference in view when a single swatch is focused. **This fails "a focused unselected swatch must not look like a selected one" in practice.** Selected + focused, a double ring, is distinct.

### 3.4 Requirements check

| requirement | today | A | B | C |
|---|---|---|---|---|
| focused unselected ≠ selected | yes, but focus is <3:1 and the pipette shows nothing | yes (dashed vs solid, weak) | **yes (ring vs check)** | **no in practice** (same ring, different radius) |
| selected+focused ≠ selected | weak (grey halo inside the ring, <3:1) | yes | **yes** | yes |
| not colour alone | partly | yes (texture) | **yes (shape)** | yes (radius only) |
| no run-in at the 0.45em gap | touches (0.25px) | **overlaps** | **7.75px clear** | needs the gap doubled; 1.75px vertical margin |
| pipette (input focus) covered | **no** | yes | yes | yes |

## 4. Recommendation: Option B

- **Meets all four requirements by shape.** "Ring = I am here, check = this is chosen" is also the convention every OS colour picker uses.
- **Contrast.** The ring gives 7.75:1 in dark and 4.69:1 in light against the ground. The check's white stroke gives ≥3.68:1 on every fill.
- **Geometry.** B has the smallest footprint, because one ring never shares a gap with another. It keeps today's 0.45em rhythm and has 5.5px of clearance at the small size. C costs a doubled gap and leaves under 2px of vertical margin. A collides at the stock size.
- **Fit with the design language and the codebase:**
  - It removes the documented exception at `styles-source.css:15407`: swatches join the "one rule" kit ring, which is the contract that comment describes. The shared ring is the teal-cyan accent DESIGN.md assigns to "every … focus ring".
  - `kit-index.test.ts` has a test that requires exactly one `outline: 2px solid var(--dse-focus-ring)` in the sheet (lines 270–272). B extends that one rule. A would add a second, dashed ring style, and C a `border`-drawn ring, both outside the contract.
  - DESIGN.md rule 9 already sets the precedent "ring vs seal is a shape difference, never a hue one (Scott is colourblind)". B applies that same grammar here.
- **Cost of B:**
  - Swatch selection no longer matches the chips' "accent border all around". The chip grammar cannot work here, because the border all around is the very thing that collides with the focus ring.
  - The check is a new mark, which raises the iconography question in §5.

## 5. Open judgment calls for the owner

1. **The glyph's shape and source.**
   - The prototype draws Lucide's `check` path (`M20 6 9 17l-5-5`) twice in one inline SVG data-URI: a dark under-stroke at width 6 and opacity 0.7, then a white stroke at width 2.75.
   - Obsidian bundles Lucide, and the plugin already uses Lucide shapes (`setIcon(custom, 'pipette')`; the external-link arrow is a mask of Obsidian's own shape).
   - DESIGN.md §Iconography and rule 5 say "never hand-draw new SVG icons". On my reading, reusing the Lucide path is not hand-drawing, but the two-tone outline is a custom treatment.
   - The alternative is the house ◆ (DESIGN.md rule 9's "struck … disc bearing the ◆"). It would tie selection to the tracker's "acted" mark, which may or may not be the meaning wanted. Worth asking Scott with both rendered.
2. **Should the check also mark the pipette when a custom colour is active?** Today the custom swatch never shows a selected state at all (`ConditionsModal.ts:376–390` calls `setPressedState` only for the presets). This is a pre-existing gap and out of SC-361's stated scope; possible Backlog ticket.

## 6. Tangents found (for the owner to file; workers don't touch the tracker)

- **Choosing a swatch by keyboard moves focus away from the swatch.** `setColor` ends with `this.focusRowCog(index)` (`src/views/ConditionsModal.ts:397–402`). Pressing Space or Enter on a swatch sends focus to the row's cog, so "selected + focused" is reached only by tabbing back. This is a usability and focus-management gap, not a styling one.
- **The pipette swatch is larger than the presets.** It renders at 22.5px against 19.5px. `width: 1.5em` resolves against the label's inherited 15px, while the `<button>` swatches get Obsidian's 13px `--font-ui-small`. This is visible in every row capture and is a pre-existing inconsistency.
- **No "selected" state exists for a custom colour** (see §5.2).
- **The SC-338 prior-attempt evidence is gone.** `.superpowers/sdd/sc338-chip-focus/evidence-r2/sc338-grid-swatch.png` no longer exists, and nor does the `sc338-chip-focus` directory, so I could not view it.

## 7. What the implementation round would touch (Option B)

**Files (dse only):**

- `styles-source.css`:
  - ~L2192, `.dse-swatch[aria-pressed='true']`: replace the outline with the check, either a `::after` with the inline SVG as the prototype does, or a mask of two layers if the owner wants token-coloured ink. Keep it keyed on `aria-pressed` alone; SC-450's rule is that pressed state is keyed on `aria-pressed` only.
  - ~L15407, the kit ring selector list: add `.dse-swatch:focus-visible` and `.dse-swatch--custom:has(> input:focus-visible)`, and rewrite the "deliberately NOT here … see SC-361" comment.
  - ~L17105, SC-203 block B (`box-shadow: none`): add `.dse-swatch`, so Obsidian's grey focus halo and its rest/hover `--input-shadow` no longer apply. This changes the swatches' resting look slightly: the soft drop shadow in dark and the 12% inset ring in light both go away.
  - The prototype used `.dse-modal .dse-swatches .dse-swatch …` for specificity. In the sheet, the kit ring rule (0,2,0) sits after the pressed rule (0,2,0), so it wins on order. The pressed rule must then **not** set an outline.
- `src/views/ConditionsModal.ts`: no change is needed for B. Optional, if the owner wants it: the pipette pressed state and the focus-after-select fix are separate tickets.
- `visual-harness/shoot.mjs` ~L3106 (`pressed toggle parity`, swatch site): it keeps passing, because rendered-pressed and toggled-pressed match. But its `PRESSED_PARITY_KEYS` do not read pseudo-elements, so it is **blind to the check**. Recommend extending the swatch site to compare `getComputedStyle(el, '::after').backgroundImage` / `content`, and can-fail proving it.
- `visual-harness/mocks/sc186-*`: a static mock with its own swatch row. It does not import the real CSS and needs no change; optionally restyle it for consistency.
- `test/dom/kit/kit-index.test.ts`: B passes as is, because the "exactly one ring" guard (L270–272) still sees one ring. Add `'.dse-swatch:focus-visible'` and the custom `:has()` arm to `FOCUSABLE_KIT_CONTROLS` (L211) to lock SC-361 in.
  - Note for comparison: `focusRule()` (L230) returns the **first** rule in the sheet that has `:focus-visible` with `--dse-focus-ring` in its body. A's dashed rule and C's `::before` ring would both live near L2192, before the kit rule at ~L15409. Either one would therefore be found first and fail "one rule covers every focusable kit control" (L239). This is a concrete implementation cost of A and C that B does not have.
- `CHANGELOG.md` `## Unreleased` (workspace): a user-facing bullet.

**Gates the change may move:**

- **freeze:** expected **276/276 unchanged**. Swatches render only inside the ConditionsModal, and the frozen `conditions--steel-*` prints are the strip, not the modal. Verify by running it.
- **parity:** expected **0 / 0 / 24 DECLARED unchanged**. No swatch pair exists in `selector-map.json`.
- **shots:** count is 572. Expect `pressed toggle parity OK (96 comparisons …)`, with the same count unless the site is extended. If the `::after` keys are added, the count grows. The button host-leak sweep covers gallery buttons, and the modal is not in it. Expect 112 kinds / 672 unchanged, but verify.
- **obsidian-camera `modal-conditions`:** its auto-focused-field "focus ring inside the body" check is unaffected, since the auto-focused field is not a swatch. Worth eyeballing the PNG.
- **e2e / lifecycle:** no swatch scenarios exist. e2e is required to land any dse change regardless.
- **Scope fence:** every selector above stays inside `.dse-swatch` / `.dse-swatches`, with no `--dse-fs-*` or montage selectors, so there is no overlap with SC-422 or SC-326.

## 8. Evidence index

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r1/sc361-r1-grid.png`: **the deciding grid.** Rows: today, A, B, C. Columns: unselected, unselected + focused, selected, selected + focused, selected with neighbour focused, custom pipette, custom + focused. Dark on the left, light on the right, 4x, every cell labelled.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r1/sc361-r1-grid-gray.png`: the same grid in grayscale.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r1/sc361-r1-opt-today.png`, `…/sc361-r1-opt-A.png`, `…/sc361-r1-opt-B.png`, `…/sc361-r1-opt-C.png`: per-option whole-row close-ups, all scenarios, both themes, 4x.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r1/sc361-r1-sizes.png`: the worst-adjacency probe at small, base and large sizes (dark), labelled with gap and clearance.
- Raw data: `<scratch>/run4/metrics.json` and `<scratch>/run4/analysis.md`.
