# SC-572 r2 independent reviewer report

## Executive summary
- Verdict: **FIX-NEEDED** (one MEDIUM; the spec's literal asks are met and every gate is green). Head reviewed `1305e0b4` on base `97a9c93b`; origin/develop has not moved.
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 3 · INFO 5.
- MEDIUM-1: after a keyboard Enter or Space removes a condition, focus falls to `<body>`, outside the open modal (measured in real Obsidian). The repo's own ConditionsModal rule is "never <body>".
- Gates, measured by me: tsc rc 0 · lint rc 0 · jest `1 failed, 1 skipped, 7049 passed` (the one failure is a twin-reuse SC-547 load timeout; that suite plus both pool suites pass alone, 214/214) → 7050/1 · lifecycle 21+16+9+4+2 = **52/52** · e2e `251/261 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs` · shots 592, rc 0, `button host-leak OK (163 … 978 …)`, `modal button host-leak OK (… 38 button kinds … 228 comparisons)`, `capture clip OK (147 …)` · freeze `280/280` · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Mutants: the 3 the brief names (div, no aria-label, no Space) are all caught. Over all 10 I tried, 7 are caught and 3 survive: "any key removes", "no CSS reset" and "no focus ring".
- Q(d): the fixture change below is proven safe. With it, all 592 PNGs (frozen and unfrozen) stay byte-identical, freeze stays 280/280, shots stay 592, the element host-leak line stays 163/978 and clip stays 147. Only the modal line moves: 38→39 kinds, 228→234 comparisons. The mutant with no CSS reset is then caught (see Q(d)).

## Findings

### MEDIUM-1 — keyboard removal drops focus to `<body>`, outside the modal
- `src/views/MinionStaminaPoolModal.ts:577-585` (click handler: `container.empty()` + rebuild destroys the focused button; no focus is placed afterwards).
- Measured in real Obsidian 1.14.4 (probe `[RVW572-P1..P3]`). After Enter on "Remove Grabbed" the active element is `BODY` (`inModal:false`, modal still open). The same happens after removing the last condition with Space, after Space with staged damage, and after a mouse click. A repeat Enter then does nothing (no write), so nothing breaks. A sighted keyboard user can recover: the next Tab lands on "Remove Dazed", because Chromium keeps its focus-navigation starting point. A screen-reader user, the user this ticket is for, hears nothing after the press and their focus has left the dialog.
- Precedent in the same plugin: `src/views/ConditionsModal.ts:347-353` (`removeAt`, MED-3: "focus the row that shifted into this slot; the previous row if this was the last one; the add button if the list is now empty — never <body>"). Also SC-511 (`src/framework/chrome/focusHandoff.ts:40-51`, `isKeyboardClick` / `focusControl`).
- The tracker (`src/elements/initiative/view.ts:2064-2088`) also re-renders without placing focus. So "match the tracker" does not settle this; the modal precedent is the closer analogue.
- Fix:
  1. In the click handler take `(evt: MouseEvent)` and record `const idx` (the icon's index among `container`'s `.condition-icon`s) before `container.empty()`.
  2. After the rebuild, if `isKeyboardClick(evt)`, call `focusControl(container.querySelectorAll<HTMLElement>('.condition-icon')[Math.min(idx, n - 1)])`.
  3. If no icon remains, hand focus to the next focusable control in the modal after the row (the row's kill checkbox is often disabled, so not that), else to the modal's first control. Never `<body>`.
  4. Pointer clicks keep today's behaviour, per the SC-518 rule.
- Tests:
  - e2e: in POOL-C04/C05, assert `await dse.focusedControl()` is `'pool.condition'` with aria-label "Remove Dazed" after the press.
  - e2e: add a last-condition case that asserts focus is inside `.modal-container .dse-modal` and not on the body.
  - jsdom: dispatch a `click` with `detail: 0` and assert `document.activeElement`.
- Owner's call whether to fold this into the fix round or file it. It is an a11y correctness gap of the fix itself, not a new design choice, so I recommend folding it in.

### LOW-1 — no test pins "a non-activation key does nothing" (r1 brief §2 step 3 asked for it)
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:600-612` and `e2e/specs/minion-pool/pool-conditions.e2e.ts:53-69`.
- Mutant M5 adds a keydown listener that removes the condition on any key other than Tab, Enter, Space or Shift. It survives jsdom (187/187) and the pool e2e (34/34).
- My probe `[RVW572-P4]` shows the real code is correct: a, ArrowRight, ArrowDown, Delete and Backspace cause no write and leave focus on the icon. Only the guard is missing.
- Fix: in POOL-C04, before the press, `await dse.expectNoWrite(HURT, () => browser.keys('a'))` on the focused icon. Or in jsdom, dispatch `keydown` `a`/`Delete` and assert no removal and `persist` not called.

### LOW-2 — nothing guards the focus ring (the colourblind-relevant property)
- `styles-source.css:15581` (`.condition-icon:focus-visible,` joining the shared ring).
- Mutant M9 deletes that line. The icon then has NO focus indicator at all. The host sets `outline: none` on `button:focus-visible` (SC-526 note, `styles-source.css:~15551`), and its own rule at `styles-source.css:1996` has `box-shadow: none` at (0,2,0), which removes Obsidian's host ring too. M9 survives all 69 stylesheet-reading jest suites (2368/2368). The e2e has no ring assertion either.
- The host-leak sweep cannot catch it even with the Q(d) fixture: a missing ring is the same with and without the host sheet.
- Fix: in POOL-C04, after `tabTo`, assert `getComputedStyle(icon).outlineStyle === 'solid'` and `outlineWidth === '2px'`. The measured state in real Obsidian is `outline: solid 2px rgb(77, 184, 199)`, offset 2px.

### LOW-3 — the resting-look CSS reset is unguarded until the Q(d) fixture lands
- `styles-source.css:1984-1998`. Mutant M8 removes the whole reset. It survives jest (2368/2368) and, on HEAD, the shots host-leak sweep, because the pool-modal shot fixture has no conditions.
- With the Q(d) fixture it is caught (see Q(d)). Fix = the Q(d) change.

### INFO
1. The SC-574(b) `test.failing` setup line (`matrix.test.ts:712`) now reads the aria-label through `conditionName`. It still fails at its intended assertion today. But a broken setup would leave that marker silently green, as before with `title`, so nothing new. With M2, SC-574(b) stayed "passing" while 4 plain tests went red.
2. The driver helper `conditionTitles` (`e2e/driver/pool.ts:65`) now reads aria-labels. The name is stale (a rename to `conditionNames` would be a nit). Behaviour is correct.
3. Pre-existing and unchanged:
   - The icon is 20×20 with no ≥44px hit-target overlay. The tracker's `.dse-cond` has one (`styles-source.css:668-676`).
   - The muted row colour `rgba(220,226,230,0.38)` is inherited, so the icon's non-text contrast is low.
   - Neither is in scope; possible Backlog items.
4. Pre-existing (SC-435 path, same for click): a removal re-serialises the whole block. In the probe, quotes were dropped from names and the string `- grabbed` became `- key: dazed` objects. This is the documented tracker write form; integrity checks pass.
5. The CHANGELOG bullet (`CHANGELOG.md:59-62`) is accurate.

## Spec conformance (probe 1)
- Element: native `<button type="button" class="condition-icon">` (`MinionStaminaPoolModal.ts:561-563`). The tracker uses `<button type="button" class="dse-btn dse-btn--icon dse-cond">` via `iconButton` (`src/framework/kit/conditionIcons.ts:126-136`, `src/framework/kit/iconButton.ts:100-141`).
- Name: "Remove <displayName>". The tracker uses "Remove condition: <displayName>" (`conditionIcons.ts:129`); the ConditionsModal uses "Remove <displayName>" (`ConditionsModal.ts:324`).
- `data-dse-control="pool.condition"` is kept. The click wiring is unchanged (`registerDomEvent` click).
- Focus ring: the shared kit outline (`styles-source.css:15581`, `outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`). The modal is Steel-stamped (`managedModal.ts:136`), so the token resolves to `#4db8c7` dark / `#2a7b88` light.
- Enter, Space and click each remove exactly one condition with one write; the modal stays open (e2e POOL-C01/C04/C05 plus my P1-P3).
- Non-activation keys do nothing (P4). Space does not scroll anything: page, `.modal` and `.dse-modal__body` scrollTop stay 0/0/0 (P3).
- Enter on the icon does not trigger Apply. With 1 damage staged: one write (the condition), the pool line stays at `minion_stamina_pool: 10`, and Apply still reads "Deal 1 damage" (P3).
- Integrity: the note diff is confined to the block; `dse` integrity checks pass.

## Visual (probe 3)
Screenshots from real Obsidian 1.14.4 (dark):

| State | What it shows |
|---|---|
| Resting (`p5-hover.png`) | Unchanged: no plate, no border, no shadow, padding 0, transparent background, 20×20, margin `0 5px 0 0`. |
| Hover (`p5-hover.png`) | One tooltip, "Remove Grabbed", and no native `title` tooltip. The row's own hover plate is pre-existing. |
| Keyboard focus (`p1-focused.png`) | A thin teal square outline drawn 2px outside the hand glyph. |

The focus indicator is a shape cue: a box appears around the icon where there was none. It does not depend on hue, so it passes Scott's colourblind rule. A mouse click shows no ring (`:focus-visible` false).

## Owner questions
**a. Bare button vs kit `iconButton`.**
- Justified. `.dse-cond`'s compact neutraliser (min-size 0, padding 0, transparent, border none) is scoped under `[data-dse-element="initiative"] .dse-init` (`styles-source.css:640-652`). The modal mounts in `document.body`, outside that scope. Reusing `iconButton` there would bring the kit `.dse-btn` look and need a parallel override block.
- The bare button keeps the model's semantics (native button, `type=button`, aria-label as name and tooltip, click wiring) and follows the `.dse-optchip` / `.dse-swatch` precedent.
- The ring is the shared kit ring (one rule, `outline` 2px solid + 2px offset), not hue-only.
- Not carried over: the tracker's vertical 44px hit overlay (INFO 3, pre-existing).

**b. Wording.** The two names differ: the pool modal says "Remove Bleeding" and the tracker says "Remove condition: Bleeding". The pool wording matches the ticket's literal expectation and the ConditionsModal, a modal like this one. Not worth blocking. If unification is wanted, change the tracker in its own ticket, since `e2e/specs/initiative/actions-conditions.e2e.ts:69,79,85` pin its wording. I would not flip the pool modal to the tracker's form against the ticket text.

**c. `title` dropped.**
- One tooltip only, confirmed in real Obsidian: the `.tooltip` nodes read `["Remove Grabbed"]` and the icon's `title` is `null` (P5).
- I found no regression from removing `title`. Every former `title` reader was switched to the aria-label: the 4 jsdom reads, `e2e/driver/pool.ts:65` and the SC-574(b) setup.
- `visual-harness/obsidian-lifecycle.mjs:1408` only `.click()`s, and `_census`/`e2eCensus` only count controls.
- The full e2e and lifecycle runs are green.

**d. Pool-modal shot fixture: add a condition.**
- Proven safe. The exact change is one edit to the shared `fight` fixture in `visual-harness/entry.ts`: give **Goblin #4** (not #1) a coloured condition.
  ```diff
  @@ -651,6 +651,9 @@ enemy_groups:
               isDead: true
             - id: 3
             - id: 4
  +            conditions:
  +              - key: "bleeding"
  +                color: "crimson"
             - id: 5
  ```
- Why Goblin #4: the tracker's detail row shows the default-selected first instance (#1), and the `initiative-cell-selected` shot clicks Orc #3. So #4's condition renders only in the pool modal, which the `MinionStaminaPoolModal` host-leak scenario opens from Goblin #1's cell.
- Measured with this change (E1):
  - All 592 PNG hashes are identical to clean HEAD, including the unfrozen dark/light shots and `initiative-fight*`/`initiative-named*`.
  - freeze `280/280`; shots 592, rc 0; `button host-leak OK (163 … 978 …)` and `capture clip OK (147 …)` unchanged.
  - `modal button host-leak OK (10 modal scenarios over 9 modal classes, 39 button kinds … = 234 comparisons …)` (was 38/228).
  - `test/dom/visual-harness` + `e2eCensus`: 164/164.
- With the same change plus mutant M8 (reset removed; E2), shots exits rc 1 with `MODAL BUTTON HOST-LEAK VIOLATED`. The violations are `dark|MinionStaminaPoolModal|rest|modal:(none)|condition-icon` (w 20→24, boxShadow, padding `1px 6px`→`4px 12px`, border, radius, background, font, `white-space: nowrap`) and the hover state. So the fold also closes LOW-3. E2's PNGs are byte-identical to clean HEAD as well.
- Do NOT add the condition to Goblin #1. It is the default-selected instance, so it would draw in the tracker's detail row and move the frozen `initiative-fight*--steel-print/realprint` PNGs. Avoid a new fixture key too: it adds 4 combo shots, moving 592, and two unbaselined print PNGs.
- Update the fixture's header comment (`entry.ts:~585-594`) with one line saying that Goblin #4 carries a condition so the pool modal's host-leak sweep mounts `.condition-icon` (SC-572).
- The dse-verify CURRENT modal host-leak numbers then become 39 kinds / 234 comparisons. Those go to the dispatcher at landing, together with the e2e 251/261 · 10 known-bug · 163/163 update.

## Mutants (all applied in place and reverted with `git checkout -- <file>`; tree verified clean after)
| # | Mutant | jsdom | e2e (`--element=minion-pool`) | Result |
|---|---|---|---|---|
| M1 | `createDiv` instead of `<button>` | caught (SC-572 test) | caught (C04, C05) | caught |
| M2 | aria-label dropped | caught (4 tests) | caught (C01, C04, C05) | caught |
| M3 | Space suppressed (keydown/keyup preventDefault) | missed (187/187) | caught (C05) | caught |
| M4 | Enter suppressed (keydown preventDefault) | missed (187/187) | caught (C04) | caught |
| M5 | any non-Tab/Enter/Space key removes | missed | missed (34/34) | **survived** (LOW-1) |
| M6 | `title` kept (double tooltip) | caught (1) | not run | caught |
| M7 | name "Remove condition: X" | caught (4) | not run | caught |
| M8 | CSS reset block removed | missed (2368/2368 css suites) | not run | **survived on HEAD** (LOW-3); with the Q(d) fixture: caught (`MODAL BUTTON HOST-LEAK VIOLATED`, rc 1) |
| M9 | `.condition-icon:focus-visible` ring join removed | missed (2368/2368) | no ring assertion | **survived** (LOW-2) |
| M10 | `type=button` dropped | caught (1) | not run | caught |

Brief's named set (div / aria-label / Space): **3/3 caught**. Overall: **7/10 caught on HEAD**.

## Markers
- SC-572: the e2e `knownBug` became POOL-C04 (Enter) plus new POOL-C05 (Space); the jsdom `test.failing` became a plain test. No `SC-572` known-bug reference remains, only explanatory comments: `MinionStaminaPoolModal.ts:556`, `styles-source.css:1984,15578`, the specs, `CHANGELOG.md:59`.
- SC-566/567/573/574 markers: none touched. The only edit near them is the SC-574(b) setup line (`.title` → `conditionName`), with the marker itself unchanged. e2e reports 10 known-bug, down from 11.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r2-rev-be71a0a9/`)
- Logs:
  - Gates: `tsc.log` · `lint.log` · `jest.log` · `jest-twin.log` · `lc1.log`..`lc5.log` · `e2e.log` · `shots-clean-r2rev-1.log` · `freeze-clean.log` · `parity.log`, each with a matching `.rc` file.
  - Probe run: `e2e-probe1.log`.
  - Mutants: `m1..m10-*.log`.
  - Fixture experiments: `shots-E1-fixture.log` · `freeze-E1.log` · `E1-jest.log` · `shots-E2-fixture-m8.log`.
- Probe spec (deleted from the tree after the run): `zz-rvw572-probe.e2e.ts.txt`. Results: `probe-results-clean.jsonl`.
- Screenshots: `p1-focused.png` (keyboard focus ring) · `p5-hover.png` (hover tooltip).
- Fixture diff: `fixture-d-actual.diff`. PNG hash lists: `shots-clean.sha256`, `shots-E1.sha256`.
- The working tree is restored: plugin `git status --porcelain` is empty, and the superproject shows only its pre-existing ` M draw-steel-elements`. `visual-harness/shots/` was last written by E2, but `shots-E2.sha256` is identical to `shots-clean.sha256` (all 592 PNGs). `visual-harness/dist/harness.*`, `main.js` and `styles.css` were rebuilt from HEAD after the experiments (`rebuild-harness.log`, `rebuild-main.log`).
