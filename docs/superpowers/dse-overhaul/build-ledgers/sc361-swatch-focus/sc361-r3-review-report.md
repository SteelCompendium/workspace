# SC-361 r3: independent adversarial review (dse `sc361-swatch-focus` @ `0daae2f` on `95981f1`)

**Executive summary**
- **Verdict: LAND.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 3 LOW, 5 INFO. No finding blocks landing. The LOWs can be fixed in this ticket or filed as follow-ups (owner's call).
- I re-ran every gate myself at `0daae2f`, and each one matches the implementer: tsc/lint rc=0. Jest **5588 / 1 skipped / 234 of 235**. Lifecycle **31/31**. e2e **96/99 ok, 0 failed, 3 known-bug, 66/66**. Shots **580 / 0 FAIL**, with both text-scale lines unchanged (1626 / 104184 over 208 loads). Freeze **280/280**. Parity **0 / 0 / 24 DECLARED**.
- All four ticket requirements hold in real Chromium with real Tab focus, in both themes and in grayscale. The real-Obsidian e2e reads the same values: a teal-cyan `solid 2px rgb(77,184,199)` ring with no host box-shadow, and the check is 12px.
- **Gap clearance:** the focus ring sits 2.75px clear of the neighbouring swatch at default size. That is the same geometry as the old selection ring, so the ring never reaches the next swatch.
- **Check contrast:** on every preset fill and on the custom extremes (white, black, yellow), either the white stroke or the dark under-stroke reaches at least 3:1 against the fill. The worst case is still 8.35:1.
- **Mouse vs keyboard:** a mouse click shows no ring, for a preset swatch and for the pipette. A keyboard pick (Enter, Space, or a custom colour picked while using the keyboard) leaves the ring and the check on the picked option.
- **SC-356 probe:** with the entry KEPT, the pass fails with "no longer leaks — remove it" for **all 10** pinned properties. With the entry DELETED, **0 `.dse-swatch` lines** remain. At the three brief commits, the pass still fails on 216 `.dse-optchip` lines that belong to SC-356's own scope (its later CSS commits fix them). On SC-356's current tip `2796ab8` plus SC-361 with the entry deleted, the pass reads **`modal button host-leak OK (… 228 comparisons …) 0 … ALLOWLISTED`**.
- **Mutation tests:** 13 mutations, and all but one fail at least one gate. Jest kills 12 of 13, and shots pressed-parity kills all 4 CSS mutations it was run against. The one survivor, M4 (check present but invisible), slips past jest and is caught by shots.
- **Ruling on the follow-up:** an unparseable YAML colour shown as "custom selected" is a minor inconsistency, not a correctness bug. It is filed as LOW-1, with the fix prescribed.

## Gates (mine, at `0daae2f`, worktree `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/draw-steel-elements`)
Each gate ran through `devbox run -c <dse> -- bash r3-gate.sh <dse> <gate> <logdir>`, with rc captured inside the script (`r3-rc.txt`).

| gate | rc | summary line |
|---|---|---|
| tsc | 0 | clean |
| lint | 0 | clean |
| jest | 0 | `Test Suites: 1 skipped, 234 passed, 234 of 235 total` / `Tests: 1 skipped, 5588 passed, 5589 total` |
| lifecycle (port 9473) | 0 | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | 0 | `OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` (COND-E01..E07 all ok) |
| shots | 0 | 580 `ok` PNGs, 0 FAIL; `pressed toggle parity OK (… 96 comparisons …)`; `button host-leak OK (112 … = 672 …)`; `text scale OK (1626 …)`; `text scale once OK (104184 comparisons over 208 loads …; 149s)`; host-copy pin OK |
| freeze | 0 | `freeze OK (280/280 frozen print PNGs byte-identical …)` |
| parity | 0 | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` |

`git status --porcelain` matched before and after: the dse worktree was clean, and the superproject worktree showed only ` M draw-steel-elements`, which is expected. HEAD is still `0daae2f`.

## Requirements check (real Chromium, plugin CSS plus pinned Obsidian app.css, real Tab/Enter/Space/mouse, 4x)
Evidence: `evidence-r3/sc361-r3-states.png`, `evidence-r3/sc361-r3-states-gray.png`, `evidence-r3/sc361-r3-metrics.json`.

| requirement | measured |
|---|---|
| A focused unselected swatch does not look selected | Focused: `outline solid 2px` teal-cyan (dark `rgb(77,184,199)`, light `rgb(42,123,136)`), `::after` = none. Selected: check, `outline-style none`. Different shapes, and grayscale keeps them apart. |
| A focused selected swatch differs from an unfocused selected one | Selected+focused = check plus ring. Selected only = check with no ring. |
| The difference does not rely on colour | The ring is outside the swatch and the check is inside it. The grayscale sheet keeps every state distinct. |
| The ring does not run into the neighbouring swatch | Gap 6.75px (0.45em of 15px). The ring reaches 4px (2px offset + 2px width), leaving 2.75px clear. In the dark-theme pixel scan, the clean run between the focused swatch and its neighbour is 2–3px. Light-theme pixel sampling was unreliable because the ground probe landed on another element, so the geometry is the evidence there; it is identical in both themes. |
| Pipette | Idle: glyph. Focused: ring (closes SC-473). Selected custom: filled with the colour, glyph hidden, check shown. Selected+focused: both marks. Input name: `Custom condition color #e67e22, selected`. |
| Mouse click does not show the ring | A real `page.mouse.click` on Blue gives active = Blue, `:focus-visible` false, outline none, check present. A mouse click on the pipette input gives `:focus-visible` false. A change event arriving after a mouse open leaves the refocused input with no ring. |
| Keyboard pick shows ring and check (SC-468) | Tab+Enter on Green: focus stays on Green, `:focus-visible` true, ring and check, `aria-pressed=true`. Tab+Space on Blue gives the same, and Green clears. A custom pick made while using the keyboard: the refocused input matches `:focus-visible`, and the pipette shows ring and check. |
| Real Obsidian (scratch COND-E07 variant, scratch clone only) | Focused unselected: `solid 2px rgb(77, 184, 199) \| after:none \| box-shadow none`. After Enter: `solid 2px rgb(77, 184, 199) \| after:"" 12px \| none \| fv:true`. Crops: `sc361-r3-obsidian-focused-unselected.png`, `sc361-r3-obsidian-selected-focused.png`. |

Check contrast (computed). Each pair is white stroke vs fill / dark under-stroke vs fill:
- Red 5.44 / 3.05
- Amber 3.68 / 4.01
- Green 4.72 / 3.36
- Blue 5.07 / 3.18
- Purple 7.07 / 2.46
- custom white 1.00 / 8.59
- custom yellow 1.07 / 8.35
- custom black 21 / 1.0
- custom orange #e67e22 2.85 / 4.80

On every fill, at least one stroke clears 3:1, and the white stroke is ≥13.7:1 against its own under-stroke. The CSS comment's "white alone ≥ 3.68:1, floor = amber" is correct.

Ring contrast: dark 7.9:1 against the modal ground, light 4.2:1.

Sizes (dark, Green selected, Blue focused):

| modal font / control scale | swatch | check | gap | ring clearance |
|---|---|---|---|---|
| 12px / 80% | 12.2px | 7.2px | 5.4px | 1.4px |
| 12px / 120% | 18.4px | — | — | 1.4px |
| 15px / 100% (default) | 19.125px | 12px | 6.75px | 2.75px |
| 20px / 80% | 20.4px | — | — | 5px |
| 20px / 120% | 30.6px | 20px | — | 5px |

The check scales with the swatch at every size. The ring clearance follows only the row font (the gap), not the control scale, which is the same behaviour as before. All six swatches are one size at every setting.

## SC-356 coordination probe
Scratch clone `wt-356`: `0daae2f` plus cherry-picks `f4deeff c331f78 0c8fae4` (clean, as `dad55a4 9fd0f12 c2555b7`). The modal pass ran alone through a probe copy of `shoot.mjs` (`shoot-r3probe.mjs`, which runs the named in-run pass and prints the full problem list).
- **Entry KEPT** (`r3-356-kept2.log`): the pass fails. The tail is exactly 10 lines of `HOSTLEAK_KNOWN_LEAKS (SC-361, .dse-swatch) lists \`<p>\` but it no longer leaks — remove it from the entry`, one each for w, h, height, boxShadow, color, fontSize, fontFamily, whiteSpace, outlineStyle and outlineWidth. **No pinned property still leaks.**
- **Entry DELETED** (`r3-356-deleted.log`): **0** lines mention `swatch`. The pass still fails, with 216 `.dse-optchip` lines (`dse-optchip` 72, `dse-cond-icons__choice.dse-optchip` 48, `dse-mt__sheet-resultchip.dse-optchip` 96). Those are SC-356's own scope. The three brief commits are SC-356's harness-only first half, and its later commits `23b280e`/`e572c67` add the chip CSS.
- **Fuller check** (`wt-356tip`, SC-356's current tip `2796ab8` on `8d890f9`, plus SC-361's 4 commits cherry-picked):
  - With the entry kept: the same 10 "no longer leaks" lines and nothing else.
  - With the entry deleted: `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states … = 228 comparisons …)` with `0 property difference(s) ALLOWLISTED`, rc=0 (`r3-356tip-deleted.log`).
  - Jest `test/dom/theme` + conditions-modal + kit-index on that combination: 15 suites / 483 tests green.
  - That cherry-pick **conflicts** in `styles-source.css` (see LOW-3).

## Mutation testing (scratch clone `wt-mut`, restored with `git checkout` after each run; results in `r3-mutation-results.json` and `r3-mut-*.log`)

| id | mutation | jest | shots pressed-parity |
|---|---|---|---|
| M1 | preset `::after` check removed | FAIL (CSS check test) | FAIL: "rendered pressed and idle controls paint identically" plus "pressed control draws no ::after mark" ×dark/light |
| M2 | old `outline: 2px solid accent` back on pressed (check kept) | FAIL | FAIL: "pressed control still draws an outline ring at rest (solid 2px)" |
| M3 | check on every swatch, idle included | FAIL | FAIL: "idle control draws a ::after mark" |
| M4 | `::after` present but `background: none` (url kept as a custom prop) | **pass (survives)** | FAIL: "pressed control draws no ::after mark" |
| J1 | swatch arms removed from the kit ring rule | FAIL (kit-index "one rule covers…") | — |
| S1 | only the pipette `:has()` arm removed | FAIL (kit-index) | — |
| J2 | `sameColor` back to strict `===` | FAIL (uppercase preset test) | — |
| J3 | pipette never selected | FAIL (2 tests) | — |
| J8 | pipette selected even for a preset colour | FAIL (3 tests) | — |
| J4 | `applyConditionColor(custom, …)` dropped | FAIL | — |
| J5 | aria-label does not announce "selected" | FAIL | — |
| J6 | font pin dropped | FAIL (host-pin test) | — |
| J7 | `.dse-swatch` dropped from block B | FAIL (host-pin test) | — |

The extended pressed-toggle parity is not vacuous: it fails on removal (M1), on a ring regression (M2), on a check drawn on idle swatches (M3), and on an invisible check (M4).

Edge-case logic, run as a jest probe in scratch only (`r3-edge-jest.log`):

| YAML `color:` | result |
|---|---|
| `#C0392B` | Red pressed, pipette unmarked, input `#c0392b` |
| `''` | nothing marked |
| `orange` / `rgb(1,2,3)` / `#C0392B80` | pipette selected and filled |
| `notacolor` | pipette selected, no fill, label `… notacolor, selected` (LOW-1) |
| `'#c0392b '` (quoted, trailing space) | custom, not Red (negligible) |

Sequence preset Red → custom `#123456` → preset Blue → custom equal to Green: each step leaves exactly one mark, and focus is on the picked option each time. The last step lands on the Green swatch, `aria-pressed=true`.

## Findings

### LOW-1: an unparseable YAML colour reads as "custom colour selected" (implementer follow-up, ruled)
- **Where:** `src/views/ConditionsModal.ts:478` (`customHex = entry.color && !SWATCHES.some(...) ? entry.color : undefined`) together with `styles-source.css:2199-2201` (fallback `var(--dse-fg-muted)`).
- **Scenario:** the note says `color: blurple`. Everywhere else the condition renders with **no** colour, because `applyConditionColor` rejects it. The modal, however, shows the pipette filled with muted grey plus the check (evidence row "unparseable"), and its input announces "Custom condition color blurple, selected". The grey fill reads as "grey is the chosen colour". The picker also opens at `#ffffff`. The modal and the tracker disagree about whether a colour is in effect.
- **Ruling:** not a correctness bug, since the stored value is non-preset and nothing is written. It is a display inconsistency, so LOW.
- **Fix:**
  1. Export the validity test from `src/elements/conditionColor.ts`, for example `export function isConditionColor(c?: string): c is string { return !!c && typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', c); }`, and have `applyConditionColor` use it.
  2. In `renderSwatches`, set `customHex` only when `isConditionColor(entry.color)` and the colour is not a preset.
  3. Delete the `var(--dse-fg-muted)` fallback comment's "unparseable" clause.
  4. Add a jest case: `color: 'notacolor'` leaves the pipette unmarked, the label is plain and no preset is pressed.
- If the owner prefers to keep today's behaviour, document it in the CSS comment and the changelog and drop this finding.

### LOW-2: the pipette's selected look has no computed-style gate
- **Where:** `visual-harness/shoot.mjs:3418` (the swatch site covers `button.dse-swatch` only); e2e COND-E07 covers presets only.
- **Scenario:** a later edit breaks `.dse-swatch--custom[data-selected]::after`. Examples: a specificity loss, `content: none` from a new rule, or the `> svg { visibility:hidden }` rule losing out so the pipette glyph draws under the check. Jest checks only the selector text and the attribute, so it stays green, and shots does not look at the pipette.
- **Fix:** add a small in-run check in `assertPressedToggleParity`, or a sibling of it. Drive the pipette the way my probe does (`input.value = '#e67e22'; input.dispatchEvent(new Event('change'))`). Then assert, in dark and light:
  - when selected: `::after` content is not none and the background is `url(`; the svg is `visibility: hidden`; the background-color equals the custom colour; `outline-style none` at rest;
  - when not selected: `::after` is none;
  - the custom `:has(> input:focus-visible)` ring appears after Tab.
- Probe code to crib from: `r3-visual-probe.cjs`.

### LOW-3: SC-356 and SC-361 both add a host re-grounding block labelled "E." at the same spot, and the second lander gets a conflict
- **Where:** `styles-source.css:17221-17237` (SC-361 block E) vs SC-356 `23b280e`/`e572c67` (its own "-- E. SC-356 — the option chips" block, same anchor).
- **Scenario:** a cherry-pick of `e397105` onto SC-356's tip `2796ab8` stops with `CONFLICT (content): Merge conflict in styles-source.css`. The resolution is mechanical: keep both blocks and relabel the second one "F.". After that, the 4 SC-361 commits apply cleanly. The combination is green on the modal pass (entry deleted) and on the theme/conditions/kit jest suites.
- **Fix (whoever lands second):**
  1. Keep both blocks and relabel the later one `F.`.
  2. Delete the `HOSTLEAK_KNOWN_LEAKS` SC-361 entry; the pass forces this anyway.
  3. If the array is now empty, keep `[]` and update its doc comment.
  4. Re-run shots.

### INFO
1. **Jest's CSS assertions are string-level.** M4 (`background: none` with the url text still in the rule) passes jest and is caught only by shots. This is acceptable, since shots is a required gate. No action.
2. **Control-text scale of 80% shrinks the swatches** to 15.3px at a 15px modal font. The pitch is then about 22px, under the 24px spacing exception of WCAG 2.5.8. At 100% the pitch is 25.9px. Before this change the presets stayed at 19.5px whatever the scale, because they were pinned to Obsidian's 13px. This follows from deviation (1), and I accept it: it matches every other control the user scaled down. Mention it only if Scott asks about touch targets.
3. **The workspace `CHANGELOG.md` `## Unreleased` has no SC-361 bullet**; only dse's own `CHANGELOG.md` was edited. The owner should add one at landing, per the AGENTS.md routing table.
4. **Comment line references drift.** `styles-source.css:2174` says the ring rule is at "~:15409"; it is now at `:15443`. Cosmetic.
5. **The `aria-label` on the `<label>` ("Custom color") is pre-existing.** The selected state is announced through the focusable input's own name (`…, selected`). That is valid, because `aria-pressed` is not allowed on a `<label>` or on `input[type=color]`. No `aria-pressed` appears on the label (verified in the DOM and in jest).

### Deviations (§7), judged
1. **Font pinned to `var(--dse-fs-control)`** (19.125px; tracks the control scale): **accepted.** The font-size contract rejects a literal. All six swatches are one size, which fixes the 22.5px pipette. The size tracks the scale like the chips beside it (see INFO-2).
2. **Case-insensitive hex compare:** **accepted, and correct.** `#C0392B` now presses Red instead of showing neither preset nor custom. Focus-after-pick also uses `sameColor`. Covered by jest (J2 kills it).
3. **No real-Obsidian crop:** **covered here.** The two scratch COND-E07 variants failed on purpose to produce real-Obsidian crops and to print the ring colour and check size: `sc361-r3-obsidian-*.png`.

### Scope and hygiene
- **Files touched:** `styles-source.css` (swatch block :2160-2210, kit ring list :15436-15444, block B list :17166, new block E :17221-17237), `ConditionsModal.ts` colour row and setColor, their tests, `shoot.mjs` pressed-parity, `e2e/.../conditions-pick-focus.e2e.ts`, and dse `CHANGELOG.md`.
- **Untouched:** SC-422 text-scale rules (only consumes `--dse-fs-control`), SC-326 montage rules, and SC-356 option-chip rules (only appended `.dse-swatch` to the shared block-B list).
- **Kit ring rule:** still the first `:focus-visible` + `--dse-focus-ring` rule. `focusRule()` finds it, and J1/S1 prove the test reads it.
- **Commit messages:** all 4 have no AI attribution. Author is Scott Tomaszewski.

## r5 scoped re-review (dse `d7e83e2` on `54f8f88`; superproject `fa16842`)

**Summary**
- **Verdict: LAND.** Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 3 INFO. All three r3 LOWs and the two r3 INFOs that were folded in are resolved as prescribed.
- **Rebase:** `git range-diff 95981f1..0daae2f 54f8f88..d7e83e2` shows all four r2 commits as `=` (e397105=f56fcc5, c681ce0=46d7d7b, 2474621=49ce0bc, 0daae2f=dc74354). The whole r2 patch is byte-identical apart from hunk offsets. The r4 delta is three new commits: `95884b7`, `383423c`, `d7e83e2`.
- **Battery at `d7e83e2`, all rc=0, all matching expected:**
  - tsc/lint clean
  - jest 5608 / 1 skipped / 234 of 235
  - lifecycle 31/31
  - e2e 96/99 ok, 0 failed, 3 known-bug, 66/66
  - shots 580 / 0 FAIL: pressed parity 96, the new `pipette selected look OK (…)` line, text scale 1626 / 104184 over 208 loads
  - freeze 280/280
  - parity 0/0/24
- **LOW-1:** fixed. The new jest case is killed by reverting the fix and by forcing `isConditionColor` true or false. The edge cases behave correctly.
- **LOW-2:** the new shots gate is real. 7 of 7 mutations fail it, including one that never sets `data-selected`.
- **INFO-3:** the changelog commit touches `CHANGELOG.md` only; the dse pointer is not staged and still sits at `54f8f88` in both `fa16842` and its parent. The bullet is accurate and plainly worded.
- **INFO-4:** both comments now name rules that exist.
- Trees: the dse worktree is clean at `d7e83e2`. The superproject shows only ` M draw-steel-elements` at `fa16842`, the same as before the review.

### 1. LOW-1 (`src/elements/conditionColor.ts:31`, `src/views/ConditionsModal.ts:479`)
`isConditionColor` uses exactly the predicate `applyConditionColor` already used. Every existing applyConditionColor test still passes, and they are also the ones that kill `L1-valid-always`.

Edge cases (scratch jest probe, `r5-edge-jest.log`):

| YAML `color:` | result |
|---|---|
| `notacolor`, `expression(alert(1))`, `' '`, `''`, undefined | pipette unmarked, no fill, plain label, no preset pressed |
| `orange`, `#e67e22`, `rgb(1,2,3)` | pipette selected, filled, `…, selected` |
| `#C0392B` | Red pressed, pipette unmarked |
| `#1E8449` | Green pressed, pipette unmarked |

Mutation results (`r5-mutation-results.json`):

| mutation | result |
|---|---|
| revert to `entry.color && …` | 1 fail: the new test "an unparseable YAML colour marks nothing" |
| `isConditionColor` always true | 7 fails: new test + 6 applyConditionColor tests |
| `isConditionColor` always false | 7 fails |

### 2. LOW-2 (`visual-harness/shoot.mjs:3540`, called at `:6375`)
Run in isolation in the scratch clone `wt-r5` through the r3 probe harness. Unmutated: `pipette selected look OK`. Every mutation exits 1:

| mutation | message |
|---|---|
| P1: pipette `::after` arm removed | `no check is drawn on the pipette (::after content "none" …)`, dark + light |
| P2: later rule `content: none` | same, with `url(` still present |
| P3: glyph `visibility: visible` | `the pipette glyph is visible, not hidden` |
| P4: fill → `--dse-surface` | `the pipette fill is rgb(26, 30, 33), not the picked colour rgb(230, 126, 34)` (light: `rgb(246, 248, 248)`) |
| P5: `:has()` arm removed from the ring rule | `the focused pipette draws "none 3px", not the shared 2px solid ring` |
| P6: outline on the selected pipette at rest | `the pipette draws an outline at rest (solid 2px)` |
| P7: `data-selected` never set | `TimeoutError: page.waitForSelector: Timeout 30000ms exceeded` (see INFO-a) |

### 3. INFO-4 (`styles-source.css:2174`, `:15440`)
Both pointers are accurate: "the shared kit `:focus-visible` rule" is the ONE-rule block at `:15406`, and "the `.dse-swatch[aria-pressed='true']::after` rule" exists at `:2183`.

### 4. INFO-3 (superproject `fa16842`)
One file, +7 lines under `## Unreleased`, parent `fc3bd71`; `git diff --cached` is empty. The bullet:
- names colours (white check, thin dark outline, teal focus ring, grey button shadow) and shapes (check mark, ring);
- describes the eyedropper's fill and check, and that a swatch can show both marks;
- correctly says all swatches draw at one size.

Nothing in it is untrue. "Teal" vs dse's "teal-cyan" is fine.

### INFO (non-blocking)
- **a.** `shoot.mjs:3576` `waitForSelector('… [data-selected]')` has no timeout of its own. If the TS ever stops setting `data-selected` (P7), the gate dies after 30 s on Playwright's default with a generic `FAIL sweep (exception)`, and the in-run gates after it never run. It still exits 1, so this is not a false green. Optional polish: `{ timeout: 5000 }` in a try/catch that pushes a named problem, e.g. `picked: the pipette never took [data-selected]`.
- **b.** Two re-wrapped comment lines are long (`styles-source.css:2175` 129 chars, `:15440` 137 chars). Cosmetic; re-wrap if touched again.
- **c.** Superproject `origin/main` has moved `fc3bd71` → `46ae296` (a docs/handoff commit), so `fa16842` needs a rebase at landing. That is the owner's job and no conflict is expected. dse `origin/develop` is still `54f8f88`.

### Gates at `d7e83e2` (logs in the r5 scratch folder; rc from `r5-gate.sh` → `r5-rc.txt`)

| gate | rc | summary |
|---|---|---|
| tsc | 0 | clean |
| lint | 0 | clean |
| jest | 0 | `Tests: 1 skipped, 5608 passed, 5609 total` / `Test Suites: 1 skipped, 234 passed, 234 of 235 total` |
| lifecycle (port 9473) | 0 | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | 0 | `OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots | 0 | 580 `ok` / 0 FAIL; `pressed toggle parity OK (… 96 comparisons …)`; `pipette selected look OK (… idle/picked/focused x dark/light …)`; `button host-leak OK (112 … = 672 …)`; `text scale OK (1626 …)`; `text scale once OK (104184 comparisons over 208 loads …)`; host-copy pin OK |
| freeze | 0 | `freeze OK (280/280 frozen print PNGs byte-identical …)` |
| parity | 0 | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` |

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r5-rereview-1792639375581854416/`. It holds `r5-*.log`, `r5-rc.txt`, `r5-range-diff.txt`, `r5-mutation-results.json`, `r5-mutate.py` and the scratch clone `wt-r5` (no git worktree registered; copied node_modules removed). No new evidence images, because the CSS look is unchanged since r3 (`evidence-r3/` still applies).

## r7 scoped re-review (reconcile after SC-356 landed: dse `134c0de` on `ea56712`; superproject `c9bd011` on `e5f329a`)

**Summary**
- **Verdict: LAND.** Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 1 INFO.
- **range-diff:** five SC-361 commits are `=`. Two show `!`, and both differences are the expected reconcile: commit 1 has new context (SC-356's E. block now ends in `color: var(--dse-fg-muted);`) and the label `E.` → `F.`; commit 3 has the same `E.` → `F.`. `134c0de` is the only new commit.
- **CSS:** `ea56712..134c0de` removes only SC-361's own old lines: the old pressed outline rule, the "deliberately NOT here" comment, and the bare `.dse-optchip` list end. SC-356's "E." block (`styles-source.css:17221`) is intact; SC-361's "F." block is at `:17264`. Neither block pins a property for the other's selector.
- **Cascade:** every swatch state (idle, pressed, focused, pressed+focused, pipette idle and focused, custom-selected, custom-selected+focused), in dark and light, computes the intended values (details below).
- **Allowlist:** shots prints `modal button host-leak OK (10 … 9 … 38 … 228 …)` with 0 ALLOWLISTED lines. Re-adding the SC-361 entry fails with exactly 10 "no longer leaks" lines. Removing any one swatch pin fails on the swatch.
- **Battery at `134c0de`, all rc=0, all matching expected:**
  - tsc/lint clean
  - jest 5614 / 1 skipped / 234 of 235
  - lifecycle 31/31
  - e2e 96/99 ok, 0 failed, 3 known-bug, 66/66
  - shots 580 / 0 FAIL, including pipette selected look OK, pressed parity 96, button host-leak 112/672, both text-scale lines
  - freeze 280/280
  - parity 0/0/24
- **Superproject `c9bd011`:** touches `CHANGELOG.md` only (+7/−0, pure addition on `e5f329a`), so every main bullet, SC-356's included, is kept. The dse pointer is unstaged (`ea56712` in both commits).
- **Implementer deviation (ALLOWLISTED line only when the array is non-empty):** accepted. It is gated on `HOSTLEAK_KNOWN_LEAKS.length`, so any non-empty allowlist still prints, and the stale-entry check is untouched.

### 1. range-diff hunks explained
- **Commit 1 (`f56fcc5` → `3b60700`):**
  - The context line before the new block changed from `color: inherit;` to `color: var(--dse-fg-muted);`. That is SC-356's E. block, which now sits just before ours.
  - Our block's header changed from `-- E. SC-361` to `-- F. SC-361`.
  - No added or removed line of the SC-361 patch changed otherwise.
- **Commit 3 (`49ce0bc` → `6463b68`):** only `E.` → `F.` in the context of the font-pin edit.
- **Commits 2 and 4–7:** `=`.
- **Commit 8 (`134c0de`, new):**
  - `HOSTLEAK_KNOWN_LEAKS = []`, with the doc comment rewritten to "Empty since SC-361 … pinned in … block B list and block F".
  - The ALLOWLISTED summary text is now conditional.

### 2. E./F. and cascade
- `git diff ea56712..134c0de -- styles-source.css`: the six removed lines are all SC-361's own. Nothing of SC-356 is dropped.
- Block B now lists `.dse-optchip, .dse-swatch` (`box-shadow: none`).
- E. pins `:where(.dse-optchip…)` only. F. pins `:where(.dse-swatch)` with `font-size`, `font-family`, `white-space`, `color`.
- The selectors do not overlap: swatches never carry `.dse-optchip`. No property is pinned twice on `.dse-swatch`.

Computed-style probe (`r7-cascade-probe.cjs` → `r7-cascade.json`): same DOM, states re-driven with real Tab, the pinned app.css enabled and then disabled in place.

| state | computed values with the host sheet |
|---|---|
| all states, both themes | 19.125px square, font 12.75px, `box-shadow: none`, `white-space: normal` |
| idle / pipette idle at rest | `outline-style: none` |
| any focused state | `outline: solid 2px` dark `rgb(77, 184, 199)` / light `rgb(42, 123, 136)`, offset 2px |
| pressed | Green fill, `::after` check 12×12 |
| custom-selected | fill `rgb(230, 126, 34)`, check 12×12, glyph `visibility: hidden` |
| pipette idle / focused | glyph visible, no check |

With the whole sheet disabled, only `width`/`height`/`font-size` (20.39 / 13.6px) and `font-family` change. Those follow the modal's inherited ambient font, which the full sheet sets (15 vs 16px base). That is by design: the pins are `inherit` / role-relative. They are not button-rule leaks; the dedicated modal host-leak pass, which removes only Obsidian's `button` rules, is the authoritative check and is green. Shadow, outline, ring colour, fills, check and glyph are identical with and without the sheet.

### 3. Allowlist removal (scratch clone `wt-r7`, the modal pass alone via the r3 probe harness; `r7-mutation-results.json`)

| mutation | result |
|---|---|
| baseline | rc 0, `modal button host-leak OK (… 228 comparisons …)`, no ALLOWLISTED line |
| A1: SC-361 entry re-added | rc 1, exactly 10 × `HOSTLEAK_KNOWN_LEAKS (SC-361, .dse-swatch) lists \`<p>\` but it no longer leaks` (w, h, height, boxShadow, color, fontSize, fontFamily, whiteSpace, outlineStyle, outlineWidth) |
| A2: F. `font-size` pin removed | rc 1, 48 swatch lines (fontSize, w, h, height: `"20.00" without the host, "19.50" with it`) |
| A3: `.dse-swatch` removed from block B | rc 1, 12 boxShadow lines |
| A4: `color` pin removed | rc 1, 12 color lines |
| A5: `font-family` pin removed | rc 1, 12 fontFamily lines |
| A6: `white-space` pin removed | rc 1, 12 whiteSpace lines |

The pass still checks the swatch, and every F. pin is load-bearing.

### Findings
- **LOW-1:** workspace `.claude/skills/dse-verify/SKILL.md` (in the superproject worktree at `c9bd011`) is stale once SC-361 lands. It still documents SC-356's interim state:
  - `:213-214` tells the next verifier to expect `100 property difference(s) ALLOWLISTED … (SC-361: .dse-swatch, 10 properties)`;
  - `:221-226` calls the SC-361 allowlist "the boundary to watch";
  - `:1205` (CURRENT) repeats the ALLOWLISTED line.

  After landing, shots prints no such line. A future verifier reading the skill would see a missing expected line and either chase it or, worse, learn to ignore a changed modal line.
  - **Fix (at landing, with the CURRENT bump):** say the modal pass prints no ALLOWLISTED line; say `HOSTLEAK_KNOWN_LEAKS` is empty since SC-361 (mechanism kept; a non-empty entry prints its own line and fails when stale); add `pipette selected look OK (…)` to the in-run gate list and CURRENT.
- **INFO-1:** in the bare page with no app.css at all, the `<label>` pipette is `content-box` while the preset `<button>`s are `border-box`. The pipette's `::after` then measures 14.3px vs 12.9px. Real Obsidian always loads app.css (`* { box-sizing: border-box }`), so this never ships; with the sheet, all checks are 12×12. No action.

### Gates at `134c0de` (rc from `r7-gate.sh` → `r7-rc.txt`)

| gate | rc | summary |
|---|---|---|
| tsc | 0 | clean |
| lint | 0 | clean |
| jest | 0 | `Tests: 1 skipped, 5614 passed, 5615 total` / `Test Suites: 1 skipped, 234 passed, 234 of 235 total` |
| lifecycle (port 9473) | 0 | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | 0 | `OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots (detached, waited on PID) | 0 | 580 `ok` / 0 FAIL / 0 `ALLOWLISTED`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states … = 228 comparisons …)`; `pipette selected look OK (…)`; `pressed toggle parity OK (… 96 comparisons …)`; `button host-leak OK (112 … = 672 …)`; `text scale OK (1626 …)`; `text scale once OK (104184 comparisons over 208 loads …)`; host-copy pin OK |
| freeze | 0 | `freeze OK (280/280 frozen print PNGs byte-identical …)` |
| parity | 0 | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` |

Trees are unchanged: the dse worktree is clean at `134c0de`, and the superproject is at `c9bd011` showing only ` M draw-steel-elements`.

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r7-rereview-1792642322122085924/`. It holds `r7-*.log`, `r7-rc.txt`, `r7-range-diff.txt`, `r7-mutation-results.json`, `r7-mut-*.log`, `r7-cascade.json`, the probe scripts, and the scratch clone `wt-r7` (no git worktree registered; copied node_modules removed).
