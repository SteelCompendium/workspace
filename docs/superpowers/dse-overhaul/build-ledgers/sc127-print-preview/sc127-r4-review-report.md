# SC-127 round 4: independent review of dse 6186261 / superproject d768ccf

**Executive summary**
1. Verdict: **FIX ROUND (small).** The paper fix works: every sampled dark-vault preview is a white page with black ink, and its contrast failures now equal the light twin's and realprint's node for node. Two Medium findings remain, plus four Low and some Info.
2. Findings: 0 Critical, 0 High, **2 Medium**, **4 Low**, 5 Info.
3. Battery (mine): tsc clean; lint clean; jest **3935 passed / 1 skipped / 202 of 203 suites / 3 snapshots**; shots **524, 0 FAIL**, all in-run gates OK, both times; freeze **130 FAILED twin / 0 realprint / 0 missing**; parity **0 / 0 / 16 DECLARED**, exit 0. These equal the r3 report's numbers exactly.
4. Realprint moved: **0 / 130**, measured on both of my clean sweeps and on my base sweep at 0c132d8, which reproduces the frozen baseline byte for byte.
5. Rebaseline: **verified (y).** 130 lines, all `*--steel-print.png`, no realprint lines, same order as the baseline. It equals my sweep 1 and my sweep 2, and the two sweeps are identical across all 524 PNGs. Applied to a scratch copy of the baseline, it gives `freeze OK (260/260)`.
6. Screen combos: `steel-dark` moved 0 / 132 and `steel-light` moved 0 / 132 vs base 0c132d8 (gallery included).
7. M1: in a dark vault, hovering or focusing a preview number field (Ferocity, Surges, party, project roll, initiative quick-add) turns it charcoal `rgb(46,46,46)` with ink `rgb(34,34,34)`, about 1.3:1. The host block misses the hover and focus tokens.
8. M2: guard (c), the paper-exemption self-test, only mirrors the loop's condition. If the real exemption is widened, jest (34/34), the self-test and a real run all stay green.
9. The fix for M1 plus Low-1 moves about 8 twin captures (the `th` borders), so the rebaseline has to be regenerated after the fix round. It also has to be regenerated after rebasing onto develop `f6fb208`, which touches initiative's view.

## Findings

### MEDIUM-1: native inputs go charcoal on hover and focus in the dark-vault preview
- **Where:** `styles-source.css:14461-14509`, the `.theme-dark [data-dse-element][data-dse-print="on"]…` host block. It re-declares `--background-modifier-form-field` (`:14486`). It does not re-declare `--background-modifier-form-field-hover`, `--background-modifier-border-hover` or `--background-modifier-border-focus`. Pinned app.css consumes them at 8251-8252 (`input:hover`), 8289 (`input:focus`) and 7235 (`button:focus-visible`). Those values are resolved on `body`, so they stay dark.
- **Failure (measured, `r4/sc127-r4-hover-probe.log`):**
  - Dark vault, preview on, Ferocity stepper:
    - At rest: background `rgb(255,255,255)`, ink `rgb(34,34,34)`, border `#e4e4e4`.
    - On hover: background **`rgb(46,46,46)`**, ink `rgb(34,34,34)`, border `#3f3f3f`.
    - On focus: focus ring `rgb(85,85,85)`.
  - Light vault control: the field stays white on hover, with border `#dadada` and ring `#bdbdbd`.
  - Crop: `r4/sc127-r4-hover-hero-dark-print1-x4.png`. The digit "4" is dark grey on charcoal and all but gone.
  - The same happens on hero, party, project, initiative, counter, hero-tokens and surges.
  - It is not a regression, because at base these fields were already charcoal at rest. But the preview becomes unreadable exactly while the user is typing, and the fix's stated purpose is that native controls go light.
- **Fix:** add these to the host block, using the pinned `.theme-light` values I measured:
  - `--background-modifier-form-field-hover: var(--color-base-00);` (#fff)
  - `--background-modifier-border-hover: var(--color-base-35);` (#dadada)
  - `--background-modifier-border-focus: var(--color-base-40);` (#bdbdbd)
  - Fold in Low-1 and Low-2 at the same time.
  - Better still, make guard (b) compare the RESOLVED value of every Obsidian `--*` token that app.css consumes on `input`, `button`, `table`, `th`, `li`, `a` and `body` (including `:hover` and `:focus`). The preview root under `.theme-dark` plus the block should match `body.theme-light`, with irrelevant families on an explicit allowlist.
  - My census found **255** tokens that still resolve to dark values on a preview root: `r4/sc127-r4-residual-dark-token-census.txt`, script `r4/tokcensus.mjs`.

### MEDIUM-2: guard (c) cannot fail on a regression of the code it guards
- **Where:** `visual-harness/shoot.mjs:5317-5341` (`selfTestPrintPaperExemption` re-implements the condition in `isBgFlagged`) vs `shoot.mjs:5487-5494` (the real exemption in `assertPrintTwinDelta`). No jest test pins the exemption's text.
- **Failure (proven):** I dropped `a.style[p] === 'rgb(255, 255, 255)' &&` from the real branch, so any root background vs transparent is excused.
  - The self-test still printed OK.
  - `npm run shots -- --element=hero` still printed `print-twin delta OK`, exit 0 (`r4/sc127-r4-canfail-widenpaper.log`).
  - `printTwinDeltaAllowedSet` + `theme-print` still passed 34/34 (`r4/sc127-r4-canfail-jest-widenpaper.log`).
  - So a Steel rule that leaks any root paint into the twin would pass. The r3 can-fail for guard (c) only forced the self-test's own boolean false, which proves the self-test can print FAILED. It does not prove that the self-test guards the loop.
- **Contrast:** the colour-narrowing tightening IS pinned. Removing it fails jest 1/34 (`r4/sc127-r4-canfail-jest-nocolornarrow.log`).
- **Fix:** move the decision into one function, e.g. `paperExemptionExcuses(a, b, p)`, and call it from both the loop and the self-test. Alternatively, add a jest `toMatch` on the exact four-clause condition, like the `insideElementRoot` pin.

### LOW-1: `th` header borders stay dark in the dark-vault preview, and the gate cannot see it
- **Where:** `styles-source.css:14504` re-declares `--table-border-color` but not `--table-header-border-color`. Pinned app.css:2768 declares `--table-header-border-color: var(--table-border-color)` on body, and :13846 consumes it. The gate is blind because `PRINT_DELTA_STYLE_PROPS` (`shoot.mjs:278-299`) has no `border*Color`.
- **Failure:** 37 `th` nodes have border `rgb(51,51,51)` in the dark twin, vs `rgb(228,228,228)` in the light twin and in realprint. They are in career, class, encounter, encounter-collapsed, encounter-narrow, perk, perk-narrow and chrome-collapsed-rollout. The header row is boxed in a dark charcoal line while the body rows have pale-grey lines (`r4/sc127-r4-th-border-career-dark-light-realprint.png`, top strip = dark twin). The page is still readable, but the preview is no longer a faithful proof of paper.
- **Fix:** add `--table-header-border-color: var(--table-border-color);` to the host block. Add `borderTopColor`/`borderRightColor`/`borderBottomColor`/`borderLeftColor` to `PRINT_DELTA_STYLE_PROPS`, measure the full-sweep residual, and pin it in `printTwinDeltaAllowedSet.test.ts`. The shift moves these 8 twin PNGs, so the rebaseline must be regenerated.

### LOW-2: caret and scrollbar colours stay dark-theme inside every preview root
- **Where:** pinned app.css:3238 has `body { caret-color: var(--caret-color) }`, with `--caret-color: var(--text-normal)` (:2154) resolved on body. Scrollbar colour is resolved the same way.
- **Failure:** 35,193 descendant nodes and 139 roots have `caret-color: rgb(218,218,218)` in the dark twin, vs `rgb(34,34,34)` in light and realprint. That is a pale caret on the white input fields that remain visible in print preview (hero, party, project, initiative, negotiation and others). `scrollbar-color` is a 10%-white thumb, which cannot be seen on the white paper.
- **Fix:** add these to the host block:
  - `--caret-color: var(--text-normal); caret-color: var(--caret-color);`
  - `--scrollbar-thumb-bg: color-mix(in oklch, var(--mono-100) 10%, transparent);`
  - `--scrollbar-active-thumb-bg: color-mix(in oklch, var(--mono-100) 20%, transparent);`
  - a `scrollbar-color` re-statement.

### LOW-3: a stale comment contradicts the new guard
- **Where:** `styles-source.css:14455-14456` says "a pin bump must re-copy them (nothing checks them against the sheet automatically yet)". `assertSc127HostBlockPinned` (`shoot.mjs:1342`) now does that check.
- **Fix:** replace the parenthetical with a pointer to `assertSc127HostBlockPinned`, and say that it covers the 18 literals only.

### LOW-4: guard (b) pins the literals, not the mappings
- **Where:** `shoot.mjs:1292` (`SC127_PALETTE_LITERALS`, 18 names). The 31 re-declared mapping lines (`--text-muted: var(--color-base-70)` and so on) are never compared with what the pinned `.theme-light` resolves them to.
- **Failure:** if Obsidian re-maps a token in a later release, for example `--text-muted` onto a different base step, the check still prints OK. That is also how M1 and Low-1 slipped past the r2 census.
- **Fix:** the resolved-value comparison described under M1 fixes this as well.

### INFO
- **I-1: 198 link nodes fail by a hair.** They render in Obsidian's stock light accent `rgb(138,92,245)` on white, which is **4.26:1**. The same happens in the light twin and in realprint. This is the host palette, not SC-127, and the remaining failures are exactly the 124 SC-348 role-chip nodes plus these 198 links.
  - Branch, dark twin = light twin = realprint: 322 text nodes below 4.5:1, across 43 captures.
  - Base, dark twin: 1858 text nodes below 4.5:1, across 114 captures. The worst are black `rgb(0,0,0)` on `rgb(28,28,28)` at 1.23:1, and `rgb(218,218,218)` initiative names on white at 1.40:1.
  - Owner's call whether the links deserve a ticket.
- **I-2: light vault.** The computed-style diff vs base (all 130 ids, light twin) is:
  - `color` `#222` → `#000`, plus the props that follow `currentColor`: border colours on the zero-width borders, `stroke` on 810 SVG nodes, `outline-color`, `text-decoration-color`.
  - The root `backgroundColor`, transparent → `#fff`, on 136 roots.
  - Nothing else: 0 full-style hash diffs outside those props.
  - The white root cannot be seen on stock light (the page is `#fff`). On a tinted custom light theme it shows as a white sheet, which is intended. The brief's claim that ink is the only difference is true visually, not literally.
- **I-3: nested roots.**
  - Both roots with print on (the global preview): the nested root is also white, black ink, and the host block re-applies identical values. Harmless.
  - A print-off card nested inside a per-block print-on root: it stays a readable dark Steel card, but it inherits `color-scheme: light` and `--text-normal: #222` (`r4/sc127-r4-nested-off-in-printon.png`).
  - A print-on card nested inside a screen root: it renders as a hybrid, with Steel tier gradients and grey tiles on white (`r4/sc127-r4-nested-on-in-screen.png`).
  - Both are reachable only when the nested card and its parent carry different overrides, so this is an edge case and not in scope.
  - `color-scheme` does not leak upward: `#mount` and the harness wrappers stay `dark`.
- **I-4: branch drift.** `origin/develop` is now `f6fb208` (SC-240 and SC-241: `src/elements/initiative/{view,resolveRefs}.ts`, `MinionStaminaPoolModal.ts`), and superproject `origin/main` is `d892b7a`. None of the files overlap the branch, but the initiative twin and realprint bytes may move. Re-sweep after rebasing and regenerate `sc127-rebaseline.txt` before landing.
- **I-5: installed Obsidian is now 1.14.2** (the harness pin is 1.13.7). The 18 palette literals are identical in 1.14.2's `.theme-light`, so the host block holds for current Obsidian.

## Probe results by brief item
1. **Dark-vault readability.** 130 ids × {dark twin, light twin, realprint}, text-node contrast measured in each (`r4/sc127-r4-contrast-branch.txt`, base: `…-base-0c132d8.txt`). Every failure in the dark twin is either the SC-348 grey (`rgb(154,162,168)`, 124 nodes) or an Obsidian accent link (198 nodes). I looked at the PNGs myself (`r4/sc127-r4-branch-*-dark.png`, contact sheets `r4/sc127-r4-darktwin-contact-{1..5}.png`):
   - Every page is white with black ink and pale-grey hairline cards.
   - Stepper fields are white with a light-grey outline and dark digits.
   - Negotiation checkboxes are violet when checked and white-grey when not.
   - Minion cells have a light-grey fill; stamina bars are green hatched.
   - Montage outcome icons are green, amber and red.
2. **Realprint.** 0 / 130 moved in sweep 1, sweep 2 and the base sweep, all against `freeze-baseline.sha256`.
3. **Rebaseline.** See the summary: verified from two clean sweeps.
4. **Light vault.** See I-2.
5. **Gate can-fail matrix** (`--element=hero`; logs `r4/sc127-r4-canfail-*.log`):
   - Root exemption removed → `PRINT-TWIN DELTA VIOLATED` (4 problems), exit 1.
   - Root exemption removed + old walk → still VIOLATED, exit 1. The deleted widening closes the hole on its own.
   - Root exemption removed + old walk + widening restored → `print-twin delta OK`, exit 0. The hole re-opens.
   - Root exemption removed + widening restored (new walk) → VIOLATED, exit 1. The walk fix closes the hole on its own.
   - So the paint hole has two independent closures.
   - Guard (b), full run with the `--color-accent-1` multiplier mutated → `SC-127 HOST BLOCK DRIFTED`, exit 1 (the hsl path, not tested in r3).
   - Guard (a), jest with the `@media screen` wrapper removed → 1 failed of 25.
   - Guard (c): see M2.
   - The `printTwinDeltaAllowedSet` floor has only additions (0 lines removed), and the four-name `MEASURED_REACHABLE_PRINT_PROPS` assertion is untouched. It was tightened, not loosened.
6. **Scope.** The host block does not match in a light vault or in realprint (`body.theme-light`), measured by `matches()` against the live rule (`r4/sc127-r4-perblock-nested-scope.log`). For nested roots see I-3.
7. **Per-block override.** Dark vault with the preview off, and `data-dse-print="on"` set on the middle root, which is what `applyPrefOverrides` does for `prefs: { printPreview: on }`. The middle statblock gets white paper, `rgb(0,0,0)` ink, `color-scheme: light` and `--text-normal #222`. Its two neighbours stay dark Steel with `#dadada` host tokens (`r4/sc127-r4-perblock-override-dark.png`).
8. **Screen combos.** 0 / 132 dark and 0 / 132 light moved vs base.
9. **Docs.**
   - `docs/settings.md`, `styling-statblocks.md` and `advanced-usage.md` are plain-language and accurate.
   - The CHANGELOG `## Unreleased` bullet is present in the worktree superproject.
   - The dse-verify SKILL.md plan-25 entry carries the "Superseded 2026-09-23, SC-127" sentence.
   - `docs/Media/tutorial-print-preview.png` is regenerated: a white statblock page on the dark note, with a red "Horde Controller" chip.
   - Nothing was written in the main checkout.
10. **Battery.** See the summary.
11. **Hygiene.**
    - No co-author or AI trailers in the 4 dse commits or the superproject commit.
    - The two-commit rule holds: dse `e421a3b`, `4eda5d9`, `8f5a05b`, `6186261`, then superproject `d768ccf` with the pointer bump + CHANGELOG + SKILL.md.
    - Both trees were clean at the start and are clean at the end. My jest run planted `main.js` and `styles.css`, which I removed. `git status --porcelain --ignored` is identical before and after.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r4/`)
Logs:
- `sc127-r4-{tsc,lint,jest,parity}.log`
- `sc127-r4-shots-sweep{1,2}.log`, `sc127-r4-freeze-sweep{1,2}.log`
- `sc127-r4-base-0c132d8-shots.log`

Hashes:
- `sc127-r4-sweep{1,2}-all.sha256`, `sc127-r4-base-0c132d8-all.sha256`

Can-fail logs:
- `sc127-r4-canfail-{noexempt,noexempt-oldwalk,noexempt-oldwalk-widening,noexempt-widening,widenpaper,hostpin-accent}.log`
- `sc127-r4-canfail-jest-{widenpaper,nocolornarrow,paper-unwrapped}.log`

Probes:
- `sc127-r4-hover-probe.log`, `sc127-r4-perblock-nested-scope.log`
- `sc127-r4-residual-dark-token-census.txt`
- `sc127-r4-contrast-{branch,base-0c132d8}.txt`
- `sc127-r4-styles-*.txt`, `sc127-r4-fullstyle-darktwin-vs-lighttwin.txt`

PNGs:
- `sc127-r4-branch-*-{dark,light,realprint}.png`, `sc127-r4-darktwin-contact-{1..5}.png`
- `sc127-r4-th-border-career-dark-light-realprint.png`
- `sc127-r4-hover-hero-*-print1*.png`
- `sc127-r4-perblock-override-dark.png`, `sc127-r4-nested-*.png`

Scripts: `probe4.mjs`, `perblock.mjs`, `nest2.mjs`, `hover.mjs`, `tokcensus.mjs`, `mut.py`
