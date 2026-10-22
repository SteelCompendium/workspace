# SC-279 r3 — independent adversarial review (DSE 24e5a1e, super 218031b)

## Executive summary
- **Verdict: FIX-REQUIRED.** 1 HIGH (pre-existing, but SC-279's new slot widens it), 1 MEDIUM, 5 LOW, 4 INFO. The design is sound, and every spec point probes correctly.
- **Battery, re-run by me at 24e5a1e:** tsc clean · lint clean (exit 0) · jest **4387 passed / 1 skipped / 215 of 216 suites** · lifecycle **25/25** · shots **580 ok, 0 FAIL** · freeze `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `roll--steel-print.png` / `roll--steel-realprint.png` · parity **0 gaps / 0 undeclared / 24 declared**. All match the implementer's claims.
- **Rebaseline:** `sc279-rebaseline.txt` matches my run's two hashes byte for byte. With those 2 lines substituted into a scratch copy of the baseline, the check reads `freeze OK (274/274 …)`. The 12 new screen-only PNGs are byte-identical to the implementer's run 2, so `fixedDice` is deterministic.
- **HIGH-1:** on a statblock or featureblock, every ability shares the `roll.*.0` session slots. Roll ability A with an edge, then click ability B's dice: B rolls **with A's edge** ("+2 edge" in B's breakdown), and B's strip opens already expanded.
- **MEDIUM-1:** pressing Reset from the keyboard disables the focused button, and focus falls to `<body>`.
- **Checkbox glyph:** NOT required for colorblind use. Checked vs unchecked differ by fill at **4.2:1 (light) / 8.0:1 (dark)** luminance contrast, which is ≥ 3:1 (WCAG 1.4.11), and the summary says the state in words. It is a taste call, arguably plugin-wide. A working prototype rule is below; it moves 0 frozen lines.
- **White band:** a pre-existing harness capture artifact, not a layout defect. It also blanks the *frozen* print twin below 1200 CSS px (INFO-2, worth a backlog ticket).

## Findings

### HIGH-1 — cross-ability roll-state collision on statblock/featureblock (pre-existing; SC-279's `roll.modsOpen.<n>` widens it)
- **Code path:**
  - `src/elements/feature/renderFeature.ts:563` restarts `rollableIndex` at 0 for every `renderFeature` call.
  - `src/elements/statblock/view.ts:456` and `src/elements/featureblock/view.ts:196` hand ONE `featureRollHooks(this.cx)` (one blockKey, one session) to `renderFeatureList`. That function calls `renderFeature` once per ability (`renderFeature.ts:539-541`).
  - So every ability's first rolling effect keys `roll.lastInput.0`, `roll.history.0` and, new in SC-279, `roll.modsOpen.0` (`rollController.ts:73`).
- **Reproduced** (statblock default fixture, rollingEnabled on; probe `sc279-r3-probe-1792197435/sc279-r3-probe.json` key `p6_second`):
  1. Roll "Whip and Magic Longsword": expand, +1 edge, Roll.
  2. Click the dice on "Kneel, Peasant!".
  3. Result: the second strip mounts with `aria-expanded="true"` and summary "1 edge". Its roll breakdown is `2d10 [1, 2] = 3, +2 bonus, +2 edge → 7`.
  - That is a wrong roll result: the first click rolls before the player can see the inherited edge.
- **Why it matters:** card rolling ships in 7.0.0, and statblocks are where Directors roll. The brief explicitly requires "no cross-talk".
- **Fix:**
  - In `renderFeatureList`, namespace the session per top-level feature, copying the hero sheet's per-row wrapper (`src/elements/hero/view.ts` `abilityRenderContext`, prefix `ability-<i>::`).
  - When `opts.roll` is set, give each config `{ ...opts.roll, session: <wrapper prefixing slots with f<i>::> }`.
  - Single `ds-feature` keys can stay as they are by applying the wrapper only when `configs.length > 1`. Alternatively apply it always; the key change only affects session state.
  - Add a feature-roll test: two abilities in one statblock; after A is rolled with an edge, B's first roll has no edge and B's strip is collapsed.
- **Owner's call (fold in vs. ticket):** I recommend folding it in. It is about 15 lines, the new slot should not ship with the collision, and it is a wrong-roll bug on a 7.0.0 surface.

### MEDIUM-1 — keyboard Reset drops focus to `<body>`
- **Code path:** `src/framework/kit/rollBar.ts:196` (Reset onClick → `setState(defaults)`) → `render()` → `resetButton.setDisabled(atDefaults())` (`rollBar.ts:244`). This disables the button that currently has focus.
- **Reproduced in both themes** (`sc279-r3-probe2-1792197487/sc279-r3-probe2.json`): `beforeReset` = `BUTTON[Reset modifiers]`; after Enter, `afterReset` = `BODY`. A keyboard or screen-reader user loses their place every time they use Reset.
- **Fix:**
  - In the Reset onClick, capture `const hadFocus = document.activeElement === resetButton.buttonEl` before `setState`.
  - Afterwards, `if (hadFocus) mods.headerEl.focus()`. The Modifiers toggle is the natural target; the Roll button is also acceptable.
  - Add a `rollBar.test.ts` assertion that, after Reset is clicked while focused, `document.activeElement` is the Modifiers header.

### LOW-1 — the characteristic stepper's ± sit 3px lower than Edges/Banes
- **Measured** (`p2_geom`): Reason buttons at top 365, Edges/Banes buttons at 362, all captions at 340. Visible in evidence b, d and f.
- **Cause:** the editable input is taller than the read-only value, and the panel uses `align-items: flex-start` (`styles-source.css`, `.dse-rollbar__panel:not([hidden])`).
- **Fix:** give `[data-dse-element] .dse-rollbar .dse-stepper` a `min-height` equal to the input's block size, scoped to `.dse-rollbar` only.

### LOW-2 — "Reset modifiers" is indented relative to the captions and checkboxes
- The ghost button's own inline padding starts its icon about 10px right of the checkbox column (evidence b, f; `sc279-r3-probe2-1792197487/sc279-r3-checked-light.png`).
- **Fix:** add `[data-dse-element] .dse-rollbar__reset { margin-inline-start: <minus the Steel .dse-btn inline padding> }`, or zero its inline-start padding. Keep it scoped to `.dse-rollbar__reset`; no shared `.dse-btn` change.

### LOW-3 — sidebar-width card strip wraps to 3 lines; an en-dash range breaks
Seen in `visual-harness/shots/feature-rolled-expanded-narrow--steel-light.png` (crop: `sc279-r3-logs/card-narrow-light-crop.png`).
- **Problems:**
  - On a card at 300px, Roll is alone on line 1, "▾ Modifiers" on line 2 and the summary on line 3. The ds-roll narrow shot keeps Roll and Modifiers on one row.
  - The Main-action label breaks inside the range: "19–" / "20 is a critical hit".
  - Its checkbox is vertically centred on the 2-line label rather than on the first line.
- **Fix:**
  - Lower the header basis: `.dse-rollbar__mods > .dse-collapse__header { flex: 1 1 7rem }`.
  - Write the range as `19⁠–⁠20` (word joiners) or wrap it in a nowrap span.
  - Use `.dse-rollbar__check { align-items: flex-start }`, with the box nudged to the first line's centre.

### LOW-4 — ds-roll's Main-action checkbox is not restored after an echo-rebuild (pre-existing; now visible)
- ds-roll's `doRoll` saves the full state, including `mainAction`, to `roll.lastInput.0`. But `rollBar.ts:82` prefers `opts.mainAction`, which the view always sets, over `initial.mainAction`.
- **Result:** a user ticks Main action, rolls, and the note re-renders. Main action comes back unticked while skill, edges and banes are restored. (Cards are intentionally non-persistent per OD-6, so this is ds-roll only.)
- **Fix:** in `src/elements/roll/view.ts`, pass `mainAction: last?.mainAction ?? model.mainAction`. Touches no card code.

### LOW-5 — the DESIGN.md carve-out overclaims
- The new rule-9 text says the header "always states every modifier in words". The implementation states every *non-default* fact; main action is omitted when it equals its default.
- **Fix:** reword to "states every modifier that differs from its default (always the characteristic)".

### INFO-1 — checkbox glyph assessment (the owner's question)
- **Measured** from screen pixels (`sc279-r3-probe2-1792197487/sc279-r3-checked-{dark,light}.png`), checked fill vs unchecked interior:
  - dark: rgb(77,184,199) vs (17,19,22) = **8.0:1**
  - light: (42,123,136) vs (236,238,238) = **4.2:1**
  - Both clear WCAG 1.4.11's 3:1, so the state is carried by fill and lightness, not hue. The worded summary ("skill +2", "main action") repeats it.
- **Verdict:** a glyph is NOT required for colorblind accessibility; the owner's "required" leaning is refuted on the evidence. A tick is still the more recognisable convention, so it is a reasonable taste ask for Scott's consolidated review.
- **Consistency trap:** the filled square is the plugin-wide Steel checkbox language. It comes from SC-121 GROUP 6 (`styles-source.css:11631-11652` and `:19480` `content: none`) and is shared with the negotiation and ds-project checkboxes.
  - A roll-only tick forks that language.
  - The consistent change is plugin-wide: turn GROUP 6's `:is(:checked, …)::after { content: none }` into the tick for `:checked`, keeping `none` for indeterminate.
- **Prototype, render verified:** `sc279-r3-glyph.css`, injected at runtime. Renders: `sc279-r3-logs/glyph-prototype-{dark,light}.png`, crop `glyph-prototype-crop.png`. The tick is clearly visible in both schemes.
  - Roll-scoped: the subject at (0,6,2) sets `position: relative` and beats GROUP 6's `position: static` (0,5,2).
  - `:checked::after` at (0,7,3) beats GROUP 6's `content: none` (0,6,3).
  - It paints `var(--dse-accent-fg)` through a mask of Obsidian's own tick SVG. That follows the external-link-icon precedent of drawing the host's shape ourselves.
  - **It must stay self-contained:** no `--checkbox-*` vars, and no re-enabling of Obsidian's own `::after`. Otherwise the checkbox host-leak gate's with-vs-without-app.css comparison would differ.
- **Frozen lines: 0 (predicted, not battery-run with the rule applied).**
  - Every Steel checkbox rule is scoped to `[data-dse-theme='steel']:not([data-dse-print="on"])`, so it is screen-only.
  - The strip itself is `display: none` in both print surfaces.
  - The same holds for the plugin-wide variant: screen shots are not frozen.

### INFO-2 — the "white band" is a pre-existing harness capture limit, and it also blanks the frozen print twin
- **Not a layout defect:** in the live page the card's bottom equals `#mount`'s bottom (probe `p5_band`: mountH = cardH = 1371.7).
- **The limit:** every `#mount` capture taller than the 1200-CSS-px viewport is blank below device row 2400 (DPR 2). This includes pre-SC-279 shots: `statblock--steel-dark.png` has 5080 white rows out of 7480.
- **The frozen twin is affected too:** `statblock--steel-print.png` is blank below row 2400, while `statblock--steel-realprint.png` is complete. Side by side: `sc279-r3-logs/statblock-print-twin-vs-realprint-2000-2900.png`.
- **Likely cause:** the `sheet=1` real-cascade chain. The screen and twin captures use it; realprint does not.
- **Consequence:** freeze has never guarded the lower part of tall elements in the twin class.
- **Action:** out of SC-279 scope; the owner should file a backlog ticket.
- **Effect on SC-279's evidence:** the narrow card's Reset button falls below the cut in `feature-rolled-expanded-narrow`.

### INFO-3 — the harness additions are safe
- **`fixedDice`:** pins `Math.random` with `page.evaluate` after `page.goto` (inside `snap`). Every `snap` starts with a fresh `goto`, so the pin cannot outlive its shot, and other gates load their own pages.
- **`screenOnly`:** these shots produce no print/realprint file, so they never enter freeze, which checks baseline names only. The print-twin coverage assertion is satisfied: `print-twin delta OK (141 capture ids …)`.
- **`ShotManifest` type nit:** harmless; drop it.

### INFO-4 — scope and regressions are clean
- **Scope:**
  - Reroll is kept.
  - There is no caption fold (the `roll/view.ts` caption is unchanged), and the ds-roll gating is untouched.
  - DESIGN.md is edited in the worktree superproject only; the main checkout shows no DESIGN.md or CHANGELOG change.
  - The main checkout's `draw-steel-elements` is dirty with someone else's unrelated `demo-vault/Welcome.md`, `justfile` and untracked files. Not SC-279.
  - The worktree superproject shows ` M draw-steel-elements` because the pointer is not yet bumped to 24e5a1e, which the implementer stated.
- **No regressions:**
  - `rollingEnabled` OFF: the card has 0 `.dse-roll-btn`, 0 `.dse-rollbar`, 0 `.dse-roll-area`.
  - ON, at rest: 1 launcher and no bar. The first click rolls and reveals the strip collapsed (`aria-expanded=false`, region `display: none`, result card present).
  - A tier-row click rolls (`rollClickToRoll`).
  - Reroll uses the current bar state: I lowered edges after the first roll, and the Reroll breakdown had no edge.
  - The Dice Roller path (`service.ts`, `diceBridge.ts`) is untouched by the diff.
  - Hero-sheet rows inherit the `ability-<i>::` namespaced session, so `modsOpen` is per row by construction.

### Verified OK (spec points)
- **Collapsed default:** on ds-roll and on a card after its first click.
- **Live summary:** updates for each fact: "Reason 0, 1 edge" → "+1 bane" → "skill +2" → "main action" → "Reason +3" → "3 edges".
- **Reset:**
  - Returns to the AUTHORED seeds: ds-roll's `edges: 1` comes back as "1 edge".
  - Keeps the characteristic (+3 survives).
  - Is disabled at the defaults.
- **Flat mode:** omits Edges, Banes and the net line. Covered by jsdom tests; there is no flat harness fixture.
- **`roll.modsOpen` persistence:** session only, never the note (`replaceSource` spy test), and restored on rebuild.
- **Print:** `.dse-rollbar` is `display: none` under both `[data-dse-print="on"]` and real `@media print`, including after expanding.
- **Tab order:** Roll → Modifiers → fields → checkboxes → Reset (when enabled).
- **Label-in-name** (ariaSnapshot):
  - The stepper groups and spinbutton are named exactly as their visible captions.
  - The checkboxes are named by their visible text.
  - The header is named "Modifiers Reason 0, 1 edge", correctly spaced.
- **Colour:** no state is carried by hue alone.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- **Battery logs:** `sc279-r3-logs/` — tsc, lint, jest, lifecycle, shots, freeze, parity (each `.log` + `.exit`), `hash.txt`, `new-ids.sha256`, `aria.log`, `glyph.log`.
- **Probe scripts:** `sc279-r3-probe.mjs`, `sc279-r3-probe2.mjs`, `sc279-r3-probe3.mjs`, `sc279-r3-probe4.mjs`, `sc279-r3-run.sh`.
- **Probe output:**
  - `sc279-r3-probe-1792197435/` (`sc279-r3-probe.json`, `sc279-r3-p1-after-reset.png`)
  - `sc279-r3-probe2-1792197487/` (`sc279-r3-probe2.json`, `sc279-r3-checked-{dark,light}.png`)
- **Glyph prototype:** `sc279-r3-glyph.css`, `sc279-r3-logs/glyph-prototype-{dark,light,crop}.png`.
- **Crops:** `sc279-r3-logs/card-narrow-light-crop.png`, `sc279-r3-logs/statblock-print-twin-vs-realprint-2000-2900.png`.
