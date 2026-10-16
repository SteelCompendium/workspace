# SC-377 r0 — survey of the `ds-initiative` element

Base: worktree `sc377-initiative-tweaks`, dse `9ded832`. Read-only round. Source tree was clean before and after (`git status --porcelain` empty both times). `npm run shots`: 544 shots, 0 FAIL.

## Executive summary (one line per brief item)

1. **Resets → menu:** the two resets render in `view.ts:198-223` (top action bar: Reset Encounter State) and `view.ts:311-322` (command bar: Reset turns). The only framework menu is the SC-169 chrome panel. It sits **top-RIGHT**, not top-left. Items go in through `ElementView.chromeItems()` (`framework/view.ts:164`). **JUDGMENT CALL:** what does "top-left" mean here?
2. **Advance round:** `view.ts:324-338`, in the command bar (row 1, col 1) between the rosters. "Heroes" is a bare `<h3>` with nothing else on its line at any width (`view.ts:226-227`).
3. **"Amount" row (malice quick-add, `view.ts:403-442`): broken because the inputs cannot be focused by clicking.** The pipeline's click shield (`pipeline.ts:176-183`) calls `preventDefault()` on `mousedown`/`pointerdown` in the capture phase. The browser's default action is focus, so a click into Amount or Label does nothing and typed text goes nowhere. Reproduced in the harness and in real Obsidian with real CDP mouse events. CSS is not the cause: harness and Obsidian compute the same styles. Secondary problems: Enter does not submit, and Add with an empty label silently does nothing.
4. **Malice stepper:** a kit `stepper` with its Steel button material stripped (`styles-source.css:629-642`). The ± buttons are `visibility:hidden` until hover or focus-within (`:800-809`), so they still reserve 24px each side. Result: "Malice: 7" floats 28px in from the right edge on wide panes and is indented 28px when the bar stacks at narrow width.
5. **Turn markers:** the two sides share no channel. Heroes use a 76px full-portrait overlay button, show nothing while waiting, and get a steel "seal" ◆ disc when done. Enemy groups use a 24px checkbox with a dot while waiting and a green (`--dse-turn-done` #5cc98a) filled check when done. 12 differences are listed in §6.
6. **Encounter title:** there is no `name`/`title` field in the model (`EncounterData.ts:602-614`). `parse` returns the same object and `serialize` stringifies it whole, so an authored `name:` already round-trips today. Nothing renders it, and no element in the plugin has inline-editable persisted text. Any inline input would also hit the click-shield bug from item 3.
7. **Print freeze (38 initiative ids):** items 1, 3, 4 and 5 can be done with zero moved bytes using screen-scoped CSS or additive DOM hidden in the base layer. Removing the action-bar wrapper is predicted to move zero bytes (its margin collapses). Item 2 moves bytes if `<h3>` gets wrapped in a new row. Item 6 moves bytes only if the title renders when no name is set.

---

## 1. Map

| What | Where |
|---|---|
| Definition (aliases `ds-it`/`ds-init`/`ds-initiative`/`ds-initiative-tracker`, chrome slot with summary only, no `items`) | `src/elements/initiative/definition.ts:20-41` |
| View (all build methods) | `src/elements/initiative/view.ts` (1884 lines). `buildUI` :195-255, malice stepper :262-290, round controls :292-341, malice log :356-398, quick-add :403-442, command bar :459-472, turn checkbox :516-548, portrait turn overlay :575-604, repaint :553-564, hero row :1210-1274, enemy group :1313-1527, detail row :1531-1630 |
| Model: parse/serialize/advance/reset | `src/elements/initiative/model.ts` (parse :128-287 returns the input object; serialize :289-291 = `stringifyYaml(model)`; `clearTurnState` :300+) |
| Data types + `resetEncounter` | `src/drawSteelAdmonition/EncounterData.ts:602-614` (interface), :616+ (`resetEncounter`) |
| Statblock refs | `src/elements/initiative/resolveRefs.ts` |
| Example / palette | `src/elements/initiative/example.yaml` |
| Reset confirm modal | `src/views/ResetEncounterModal.ts:12-42` |
| Click shield (bug in item 4) | `src/framework/pipeline.ts:176-183`, armed at :460 unless `def.noClickShield` |
| CSS: base / print layer | `styles-source.css:608-1427`: compact buttons :629-668, turnbox :689-735, malice :792-828, round :841-856, quick-add :889-934, command bar :949-1053, group head :1090-1100, base-hidden SC-183 nodes :1395-1413 |
| CSS: Steel screen layer (SC-183 §1-12) | `styles-source.css:12560-13578`: spent row §11a :13246-13325, pips §11b :13327-13380, portrait turn control §12 :13383-13576 (seal §12b :13486-13524, portraits-off fallback :13531-13544) |
| CSS: input host re-grounding (quick-add pair) | `:7835-7874`, `:16150-16460` (GROUP 1-4) |
| CSS: sidebar narrow overrides | `.dse-sidebar … .dse-init` block ~`:15000-15050` |
| CSS: print rule 4 (`.dse-btn` display:none) | `:14875-14897` (`@media print`), twin `:14947-14954` |
| Harness fixtures | `visual-harness/entry.ts:448` no-images, :473 controls, :570 fight, :650 roster, :715 squads, :783 captain-bonus. Registered :994-1001; extra/narrow/interaction ids :1263-1301, :1362-1376, :1503-1508 |
| Tests | `test/dom/elements/initiative.test.ts` (2551 lines), `initiative-controls-layout.test.ts`, `initiative-portrait-missing.test.ts`, `malicePanel.test.ts`, `turnEconomy.test.ts`, `test/unit/model/initiative-serialize.test.ts`, `initiative-resolve-refs.test.ts`, `test/dom/views/reset-encounter-modal.test.ts`, `test/dom/framework/sidebarInitiative.test.ts`, `chromeRollout.test.ts` |
| Shot capture ids (×4 combos each) | `initiative`, `-controls`, `-controls-narrow`, `-fight`, `-fight-500`, `-fight-narrow`, `-roster`, `-roster-500`, `-roster-narrow`, `-squads`, `-squads-500`, `-captain-bonus`, `-no-images`, `-no-images-narrow`, `-narrow`, `-log-open`, `-cell-selected`, `-mark-seal`, `-portraits-off` (19 ids, 76 PNGs) |
| User docs | `docs/initiative-tracker.md`, `docs/running-an-encounter.md`, `docs/gm-trackers.md` |

## 2. Resets and the "top-left menu"

- **Reset Encounter State**: kit `buttonRow` with one button, the element's first child, alone on the top-left line (`view.ts:198-223`). It opens `ResetEncounterModal` (a confirm with a danger-variant "Yes, Reset" button) and then runs `resetEncounter` + `rebuildAndPersist`. Not built when read-only.
- **Reset turns (this round)**: kit `iconButton` in `.dse-init__round` (command bar, row 1, col 1), `view.ts:311-322`. Runs `resetRound()` (`view.ts:188-191`) with **no confirm**.
- **Framework menu = the SC-169 chrome panel.** `framework/chrome/mountChrome.ts`, `types.ts:39-47` (`ChromeMenuItem {id, icon, label, onClick}`). It is **top-right** and grows right to left: `styles-source.css:15356-15362` (`right: …`), DESIGN.md §"The element chrome panel" ("top-right … grows right-to-left"). It is hover-revealed on desktop (`:15467-15468`), always visible on mobile, and absent in print. DESIGN.md calls it "the **only** per-element affordance surface". There is **no top-left menu anywhere** in the plugin.
- **API an initiative item would use.** Override `chromeItems(): ChromeMenuItem[]` on `InitiativeView` (seam at `framework/view.ts:151-166`). The pipeline collects it fresh on every chrome (re)mount (`pipeline.ts:617-631`; order: edit pencil · view items · pin · collapse). Examples:
  - Montage: four items including "Reset progress" (`montage/view.ts:378-414`), gated `if (!this.model || !this.cx.host.canPersist) return []` (`:379`).
  - Skills: an eye toggle (`skills/view.ts:152-166`).
  - Negotiation still uses its own in-card `⋯` Obsidian `Menu` (`negotiation/view.ts:91-105`). That predates the chrome rule and is the only "menu" shaped like a dropdown.
  - Items are **icon-only**; the label is used as tooltip and aria-label (`mountChrome.ts:229-237`).
- **Confirm convention for destructive items.** No framework convention exists. The precedents disagree:
  - Initiative's Reset Encounter uses the `ResetEncounterModal` confirm.
  - Montage "Reset progress" uses no confirm, only a `Notice` (`montage/view.ts:403-411`).
  - Negotiation reset uses no confirm, only a `Notice` (`negotiation/view.ts:119`).

  An initiative chrome item can call `this.openModal(new ResetEncounterModal(...))` exactly as `view.ts:210-216` does today.
- **Judgment call for the owner.** Scott wrote "top-left", and the chrome panel is top-right. The Reset Encounter State button already sits top-left, so "top-left menu" could mean (a) the existing chrome panel with Scott misremembering its side, or (b) turning the top-left action bar into a `⋯` menu. (b) contradicts DESIGN.md's single-surface rule. Also note:
  - On desktop the panel is hover-only, so both resets become hidden until hover.
  - Two reset items would be icon-only with similar glyphs (`rotate-ccw` vs `refresh-cw`).

## 3. Advance round

- It renders as a kit `iconButton` (`skip-forward`, "Advance round"; the tooltip adds `(+N Malice)` when `round_gain` is set) in `.dse-init__round` (`view.ts:324-338`). Grid row 1, col 1 of `.dse-init__bar-grid`, after "Round N" and "Reset turns".
- The "Heroes" header is `heroesGroup.createEl('h3', {text: 'Heroes'})` (`view.ts:226-227`), the first child of `.dse-init__group--heroes`. Measured: 694×27.4px at main-pane width, 234px at 300px. **Nothing else sits on that line at either width.** The Reset Encounter State bar is on its own line above it.
- If Advance (and Reset turns) leave the bar, row 1 col 1 is left holding only "Round 3". That brings back the empty left half Scott complained about in SC-154 (`styles-source.css:939-946`). The round label probably needs to move with the button.
- At 300px the bar already stacks into one column (container query at `:1039`). Whether "HEROES" plus a ~117px Advance button fits the 234px h3 line has not been measured. It is borderline.

## 4. The "Amount" row: reproduced, root cause found

The row is the **malice quick-add**: `<input type=number placeholder="Amount">`, `<input type=text placeholder="E.g. Feytouched">` and an "Add" `iconButton` (`view.ts:403-442`).

**What is broken (reproduced in both environments):**

| Probe (real mouse click into the field, then type) | Browser harness | Real Obsidian (private Xvfb :177, CDP 9277) |
|---|---|---|
| `document.activeElement` after clicking Amount | `BODY.theme-dark` | `DIV.markdown-preview-view…` |
| value after typing "3" | `""` | `""` |
| activeElement after clicking Label | `BODY` | `DIV.markdown-preview-view…` |
| value after typing "Feytouched" | `""` | `""` |
| Control: same `<input>` placed outside any element root | focuses | n/a |
| Programmatic `.focus()` + type | works ("5") | n/a |

**Root cause.** `armClickShield` (`src/framework/pipeline.ts:176-183`):

```ts
const stop = (event: Event): void => { event.preventDefault(); event.stopPropagation(); };
root.addEventListener('mousedown', stop, { capture: true });
root.addEventListener('pointerdown', stop, { capture: true });
```

`preventDefault()` on mousedown cancels the browser's focus-on-click. The listener is on the capture phase at the element root, so the event never even reaches the input; a target listener we planted never ran. Buttons still work because `click` is not shielded. A user can only reach the field with Tab.

- **It is not CSS.** Computed styles of both inputs are identical in the harness (which loads the pinned real `app.css`) and in real Obsidian: border-box 81.6×27.8 / 129.2×27.8, padding 3.4/5.44px, 1px `rgba(220,226,230,.12)` border, bg `rgb(26,30,33)`, 13.6px font.
- **The only harness/Obsidian difference is cosmetic.** The Add button is 25.1px tall in the harness and 26.8px in Obsidian. Both are shorter than the 27.8px inputs, so the row's controls never share a height.
- **Why no gate caught it:** jsdom has no focus-on-mousedown default action, and `obsidian-lifecycle.mjs` G-S3 types after a programmatic `.focus()` (`:695`, `:727`).
- **Plugin-wide.** The same failure was reproduced on `ds-counter`'s editable stepper input and `ds-party`'s award input. Every shielded element with an in-card `<input>` is affected. This is a tangent for the owner to file; `ds-counter` typing is broken too.
- **Fix the brief asked for.** In `stop`, skip `preventDefault()` when `event.target` is (or is inside) an editable control (`input, textarea, select, [contenteditable]`). Keep `stopPropagation()`, which is what keeps Obsidian from opening the block for editing.
  - Verify in real Obsidian in both Reading and Live Preview with a real CDP click, not `.focus()`.
  - Add a lifecycle or camera check that clicks rather than calls `.focus()`.
- **Secondary defects in the same row (`view.ts:422-441`):**
  - Enter does not submit; there is no keydown handler. Measured: Malice unchanged after Enter.
  - Add with an amount but an empty label silently returns at `:431` with no feedback. Measured: Malice stayed 10 and the amount stayed "2".
  - Fields are flat `--dse-surface` boxes, while the kit stepper input uses `--dse-surface-sunken` (`:16191-16198` vs `:16203-16211`).
  - The control heights do not match (above).

## 5. Malice stepper

- **DOM.** A kit `stepper` (`src/framework/kit/stepper.ts:67-…`): `div.dse-stepper[role=group]` > `button.dse-stepper__btn(minus)` · `span.dse-stepper__value.dse-init__malice-value` ("Malice: 7", via `format`) · `button.dse-stepper__btn(plus)`, inside `.dse-init__malice` (`view.ts:262-290`). Read-only renders a static div.
- **What reveals it.** `:hover` or `:focus-within` on `.dse-init__malice` (`styles-source.css:800-809`). At rest the buttons are `visibility: hidden`, but they **keep their 24×24 boxes**.
  - Measured on wide panes: value text at x 673-731 inside a 114px group, with 28px of dead space on the right. "Malice: 7" therefore does not line up with the Add button's right edge.
  - At 300px the stacked bar indents "Malice: 7" by 28px.
- **Styling.** The compact reset strips the Steel kit button material: border, background and padding set to 0 (`:629-642`). The 24px glyph is set at `:815-819`, hover bg `--dse-surface` at `:811-813`, the ≥44px `::after` hit target at `:645-655`, and the red `--dse-malice` bold value at `:793-798`, `:822-824`. Revealed, it is two bare red −/+ glyphs on a faint plate (see the evidence crop). It shares no material with the plugin's other steppers.
- **Kit controls a redesign should reuse:**
  - kit `stepper` itself, in its default Steel material. Bevelled `.dse-btn` ±: `styles-source.css:11223-11230` (`:where(.dse-btn)` Steel layer). Sunken value well `.dse-stepper__input`: `:13829-13845`, `:16191-16198`.
  - The same stepper as already shipped un-stripped in `ds-surges` (`src/elements/surges/panel.ts:44`), `ds-counter` (`counter/view.ts:39`), `ds-resource` (`resource/panel.ts:48`), `ds-tokens` (`tokens/view.ts:26`), `ds-party` (`party/view.ts:119`, `:177`), `StaminaEditModal` (`:141`, `:423`), and the kit `rollBar` (`:72`, `:97`, `:105`).
  - The surges/counter shots are the reference look: always-visible bevelled ± framing a centred numeral, with a label.

## 6. Turn markers

| | Hero row | Enemy group |
|---|---|---|
| Control | `button.dse-init__portrait-toggle` overlay covering the whole portrait (`view.ts:575-604`; CSS `:13418-13433`). The checkbox stays in the DOM but is `display:none` on the Steel screen (`:13531-13533`) | kit `iconButton` `.dse-init__turn` inside `.dse-init__turnbox`, first child of `.dse-init__grouphead`, left of the `<h4>` (`view.ts:1337-1350`, `:516-548`) |
| Size / hit target | 76×76 (60×60 at ≤420px, `:13550-13556`) | 24×24 box (22×22 button, 20×20 svg) plus a 44px `::after` overlay (`:645-655`, `:689-695`) |
| Shape | the portrait's rounded square, plus a **circle** disc mark (28.5px, `2.1em`, `border-radius:50%`) | **rounded square**, radius 4px/3px |
| Position | on the portrait, lower-right corner (`right/bottom: 3px`) | inline, left of the group name |
| Not acted (rest) | **nothing visible**: the mark is `opacity:0` (`:13442-13447`) | box with a Lucide **`dot`** glyph, `--dse-fg` on `--dse-surface` (`:721-730`) |
| Acted | **struck steel seal**: radial metal gradient disc `#e9eef1→#939ea4→#4c555a` with an engraved ◆ (`::before`), plus a 2px `--dse-metal` inset ring and inner shadow on the portrait (`:13493-13524`) | Lucide **`check`** on a **green fill** `--dse-turn-done` = `#5cc98a`, svg colour `--dse-surface` (`:732-735`). Saturated fill, against DESIGN.md "saturated colour = semantics, never a fill" |
| Hover | teal wash `rgba(77,184,199,.16)` + 1px `--dse-accent` border + a **ghost Lucide check** at 45%, bottom-centre (`:13469-13480`). The ghost is a check, **not** the seal it promises | generic kit `.dse-btn` hover |
| Tooltip | "Click the portrait to mark this turn taken" | "Toggle to mark turn taken" |
| Spent-row treatment | §11a hatch ground (shared, `:13246-13260`). Dims **portrait + name** (`:13279-13285`) | same hatch. Dims the **h4 only** |
| Portraits-off pref | falls back to the checkbox (`:13537-13544`). **Only here do the two sides match** | unchanged |
| Print | checkbox (dot/check), same as the enemy side | checkbox |

**SC-183 history.** In round 3 the hero portrait became the turn control. Candidates `seal`, `shutter`, `sheathe` and `laurel` were built; Scott picked **`seal`** on 2026-08-23 ("Seal option looks good"). "Seal" is a milled steel disc bearing the brand ◆, pressed into the portrait's lower-right corner (`:13486-13524`; promotion note `:13408-13414`). **Only the hero side uses it.** The group header deliberately kept the checkbox because "a group has no portrait to click" (`:13527-13530`). Capture id `initiative-mark-seal` (roster fixture) still records it.

## 7. Encounter title

- **Model.** No `name`/`title` field (`EncounterData.ts:602-614`). `parse` validates and returns the **same object** (`model.ts:128-287`), and `serialize` is `stringifyYaml(model)` (`model.ts:289-291`). An authored `name: "Ambush at the ford"` therefore already survives parse → persist today; it is simply never rendered. `resetEncounter` does not touch it. The definition's chrome summary is `Initiative (round N · HvG)` with no `name` part (`definition.ts:20-25`).
- **Display pattern for a named tracker.** Negotiation renders `model.name` in the kit `cardHead` name slot with the kind-noun in the eyebrow (`negotiation/view.ts:72-80`). The chrome summary grammar has a `name` slot (`chrome/types.ts:25-36`; DESIGN.md "the collapsed one-liner").
- **Inline-editable persisted text: no precedent.** There is no `contenteditable` anywhere in `src/`. The two patterns closest to it:
  - (a) A chrome item opens a `DseModal` with a text field, then mutates and commits. Montage "Add a hero": `montage/view.ts:393-396`, `:416-423`; `montage/ConfigModals.ts:10`. Tracked-modal helper `:333`. This pattern avoids the click shield.
  - (b) An in-card input that commits on Enter or blur, with Escape reverting, plus the **mandatory SC-340 adoption-blur guard** (`closest('[data-dse-moving]')` / `!isConnected`). Kit `stepper` editable path: `stepper.ts:159-200`. Any in-card input is **unclickable until the §4 click-shield fix lands**.
- **Read-only (`cx.host.canPersist === false`, e.g. canvas).** The pipeline stamps `data-dse-readonly`. The view must build no write affordance (F1 §4.4; `view.ts:48-52`; `chromeItems` gating precedent `montage/view.ts:379`). The title renders as static text, and the rename item or input is omitted.

## 8. Frozen-print exposure

The freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`, 262 lines) holds **38** initiative ids: `initiative`, `initiative-captain-bonus`, `-cell-selected`, `-controls`, `-controls-narrow`, `-fight`, `-fight-500`, `-fight-narrow`, `-log-open`, `-mark-seal`, `-narrow`, `-no-images`, `-no-images-narrow`, `-portraits-off`, `-roster`, `-roster-500`, `-roster-narrow`, `-squads`, `-squads-500`, each as `--steel-print.png` and `--steel-realprint.png`.

Print renders the same DOM, and print rule 4 sets every `.dse-btn` to `display:none` (`styles-source.css:14888-14897`). Measured in print-twin and realprint (identical):

| Change | Moves frozen bytes? |
|---|---|
| 1. Resets → chrome | Chrome is absent in print, and the Reset turns button is already `display:none`, so neither moves bytes. **Removing the `.dse-init__actionbar` wrapper**: in print it is a 0-height flex box with `margin-bottom:10px` that collapses into the h3's `16px` top margin (actionbar y 38.4, h3 y 54.4 = 38.4 + 16). Removal is therefore predicted to move **0 bytes**; the freeze gate must confirm. Read-only renders already omit it. |
| 2. Advance round on the Heroes line | **Yes, if h3 is wrapped in a new flex row.** h3's margin currently collapses through `.dse-init__group--heroes` (both at y 54.4), and a flex wrapper stops that collapse, moving all 38. Zero bytes only if the h3 box is untouched in print: for example the button inside the h3 (`display:none` in print), or a screen-scoped `display:flex` on the h3. |
| 3. Amount row | Fixing the click shield is JS only: **0 bytes**. The inputs **do print** (two boxes beside the round label), so restyling must stay `:not([data-dse-print="on"])`-scoped. Re-parenting or wrapping the inputs moves all 38. |
| 4. Malice redesign | The value prints ("Malice: 7", red, top-right) and the ± are `display:none`. Screen-scoped CSS: **0 bytes**. Changing the `format` string or splitting label and numeral into new nodes moves all 38. |
| 5. Turn markers | Print uses the **checkbox on both sides** (hero turnbox at y 123.8 and group turnbox at y 485.8, both 24px). Screen-scoped CSS, or new base-hidden (`display:none`) nodes: **0 bytes**. Deleting or reshaping the turnbox, or changing its glyph, moves all 38. |
| 6. Encounter title | No fixture has `name:`. A title that renders **only when `name` is set**, with a placeholder hidden in the base layer and on screen only: **0 bytes**. A printed "Untitled encounter" placeholder moves all 38. New named fixtures create new, unfrozen ids. |

## 9. Recommendations

**Malice stepper (one design).** Stop hiding the control and stop stripping it.
- Render the Malice pool as the standard Steel kit stepper, as `ds-surges`/`ds-counter` ship it: two always-visible bevelled `.dse-btn` ± framing a sunken numeral well.
- Put the word "Malice" in a small-caps `--dse-fs-label` caption above or before it, and colour only the numeral in `--dse-malice` (the one semantic hue).
- Concretely: delete the `visibility:hidden` reveal (`:800-809`), take `.dse-init__malice .dse-stepper__btn` out of the compact reset (`:633`, `:647`), and drop the 24px glyph override (`:815-819`).
- Keep the value node and its text unchanged in print by scoping all of this under `[data-dse-theme='steel']:not([data-dse-print="on"])`, or by adding a separate base-hidden caption node.
- This also removes the 28px dead-space misalignment, because there are no more invisible reserved boxes. No new component and no new token.

**Turn markers (one design).** One mark, the seal, on both sides, with the same three states.
- Give the group header a **seal socket** in place of the visible checkbox: the existing `.dse-init__turn` button restyled screen-only into a 2.1em circle.
  - Not acted: an empty engraved steel ring (recessed `--dse-metal-faint` border, no glyph).
  - Acted: the §12b struck seal, with the same radial metal gradient and ◆ `::before`.
  - Hover: a ghost of the seal.
- Give the hero portrait the same empty ring in its corner while not acted, so "to go" is visible at rest on both sides, and change the hero hover ghost from the check glyph to the ghost seal.
- Factor §12b's disc rules onto a shared selector covering `.dse-init__portrait-toggle .dse-init__pt-mark` and `.dse-init__grouphead .dse-init__turn`. Remove the green `--dse-turn-done` fill from the screen.
- Print keeps both checkboxes untouched (screen-scoped CSS only → 0 frozen bytes). Portraits-off keeps its checkbox fallback, now styled as the same socket.

## Open questions for the owner (no blocker for this report)

- "Top-left menu": is it the SC-169 chrome panel (top-right) or a new top-left `⋯`? The second contradicts DESIGN.md's single-surface rule (see §2).
- Should "Reset turns" gain a confirm once it moves into an icon-only menu? There is no convention today (see §2).
- Tangent to file: the click shield blocks clicking into every in-card input plugin-wide (ds-counter editable stepper and ds-party award input confirmed).
