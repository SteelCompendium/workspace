# SC-279 r1 — roll UI survey + design spec (DSE @ f8693b5)

## Executive summary
- **Recommended design:** keep ONE shared kit `rollBar`, re-shaped as a **roll strip**: an always-visible one-line row `[🎲 Roll]  [▸ Modifiers · Reason 0, 1 edge]` (the summary is in words), plus a **collapsed-by-default** region holding the labeled controls: small-caps captions over each stepper (*Reason* / *Edges* / *Banes*), a worded net-effect line, two **native labeled checkboxes** (*Skill applies (+2)*, *Main action — natural 19–20 crits*) and a text **Reset** button. Expansion persists in SessionStore only, never in the note.
- **ds-roll:** the strip replaces today's bar, so the element shrinks to head + caption + tiers + one row. **Ability cards:** the head dice icon still rolls at once and reveals the strip, which also starts collapsed. Today a card shows nothing until that first click, so cards are already "icon by default".
- **Print:** the strip is hidden entirely. Today it prints an unlabeled box that reads "0 1 0 Edge +2".
- **Taste questions for Scott:** Q1 should ds-roll's collapsed state be the labeled one-liner (recommended) or icon-only `[🎲][▸]`? Q2 should the first click on a card's dice icon roll at once (recommended, today's behavior) or only open the modifiers? Q3 is it OK to amend DESIGN.md rule 9 ("adjusters are always visible") for the roller, where the steppers sit behind a click-disclosure?
- **Freeze impact:** exactly **2 frozen lines move** (`roll--steel-print.png`, `roll--steel-realprint.png`, baseline lines 163–164). This rebaseline needs Scott's sanction. It is unavoidable: any DOM change to ds-roll's bar changes its print. Every other frozen line stays put, because cards render zero roll DOM at harness defaults (`rollingEnabled` off). The new capture ids are additive widening only.
- Bugs found along the way, folded into the spec: Reset ignores authored seeds (F1); flat mode shows edge/bane controls the engine ignores (F2); the net line is not a live region (F3); unpressed toggles render as plain text (F4); the pressed Main-action fill is identical to the Roll CTA (F5).

Evidence: fresh probe renders of the current state, made from the worktree at f8693b5 (2× DPR, the harness page with the real pinned host sheet) and saved in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-shots-r1-1792194134/`. The DOM dump is `sc279-probe-report.json`, made by the probe script `../sc279-probe.mjs`.
- ds-roll block: `sc279-roll-block-dark.png`; narrow 300px: `sc279-roll-block-narrow300-dark.png`; print twin: `sc279-roll-block-print.png`
- card (rolling ON) after the first click: `sc279-card-rolling-on-clicked-dark.png`; narrow crop: `sc279-card-narrow-crop.png`; at rest: `sc279-card-rolling-on-rest-dark.png`
- (The main checkout's `visual-harness/shots/roll--*.png` date from 2026-08-20 and do not match the frozen hash, so they are stale. Don't use them.)

---

## 1. Inventory (today)

`src/framework/kit/rollBar.ts` renders one flex-wrap row, `.dse-rollbar`, in this DOM order:

| # | Control | Code | Game meaning | Visible label | aria / tooltip | Default |
|---|---|---|---|---|---|---|
| 1 | Characteristic stepper (− [input] +, editable, −5..+5) | rollBar.ts:71-81 | The hero's characteristic score, added to 2d10. It exists only when the roll names a keyword ("Power Roll + Reason"). | **none**: the input shows a bare `0` | group `aria-label="Reason"`; buttons "Decrease/Increase Reason" | session `lastInput` → else 0 |
| 1′ | Fixed characteristic chip | rollBar.ts:66-70 | Bound hero (feature card with a characteristics provider) or a numeric `characteristic:` in ds-roll | "Reason +2" | — | read-only |
| 2 | Skill toggle (ghost iconButton, aria-pressed) | rollBar.ts:84-94 | +2 when an applicable skill is used (tests mostly) | "Skill +2" with **no border when off**, so it reads as a label | "Skill (+2)" | off (ds-roll: `skill:`) |
| 3 | Edges stepper (0..9, shown capped "2+") | rollBar.ts:97-104 | Edge: 1 = +2, 2+ = tier up (opposed: +4). Cap each side at 2, then cancel | **none**: a bare `0` | "Edges" | 0 (ds-roll: `edges:`) |
| 4 | Banes stepper | rollBar.ts:105-112 | Mirror of edges | **none** | "Banes" | 0 (ds-roll: `banes:`) |
| 5 | Main-action toggle (power-roll mode only) | rollBar.ts:116-128 | Sets `isMainActionAbility`, i.e. **crit eligibility**: only a natural 19–20 on a *main-action* power roll is a crit (engine.ts:70). It changes nothing else (no damage, no tier). | "Main action" (no border off; **teal fill on, the same as the Roll button**) | "Main action (can crit)" | card: inferred `act==='main'` (renderFeature.ts:820); ds-roll: `main_action:` |
| 6 | Net-effect text | rollBar.ts:131-146 | Mirrors the engine: "Edge +2", "Double edge — tier ↑", "Edges & banes cancel" | text; **empty at 0/0** | not aria-live | — |
| 7 | Reset (icon-only `rotate-ccw`) | rollBar.ts:149-158 | Sets skill/edges/banes to **0** and main-action to its default. Keeps the characteristic. | **none** | "Reset modifiers" (tooltip = aria-label) | — |
| 8 | Roll (accent, dices icon + "Roll") | rollBar.ts:159-163 | Rolls with the current state | "Roll" | "Roll" | — |

Around the bar:
- **Card launcher** (`rollController.ts:83-94`): an icon-only ghost `dices` button in the power-roll head, aria "Roll <ability>". The first click mounts the bar (`ensureBar`, :104) **and** rolls (:90/:127). With `rollClickToRoll` on (default true), a tier-row click does the same (:96-102). Once mounted, the bar can't be dismissed. *Clear* removes only the result.
- **Result card** (`kit/rollResultCard.ts`): headline "Tier N · total" / "Critical! · N" + crit note, mono breakdown, *Reroll* + *Clear*. It's a `role=status` live region. After a card roll you have **three** roll buttons: the head dice, the bar's Roll, and Reroll. Reroll calls `doRoll()` with the current bar state, which is identical to the bar's Roll.
- **ds-roll** (`elements/roll/view.ts`): `.dse-roll` card: optional `cardHead` name, caption (`expressionText` · difficulty), optional `powerRollPanel` tiers, then the **always-visible** bar (:191-207, `showMainAction: true`), then the result card.

## 2. Where the bar appears

- **(a) Ability cards.** These are feature, featureblock and statblock (`featureRollHooks`: feature/view.ts:50, featureblock/view.ts:196, statblock/view.ts:456) plus hero-sheet ability rows (hero/view.ts:755, which uses a namespaced session per row). The bar is gated by `rollingEnabled` (default OFF, catalog.ts:620). The pref adds only the head dice icon. The bar appears **per rolling effect, on the first click**, below that effect's panel, and stays. Each effect has its own `roll.lastInput.<n>` / `roll.history.<n>` slot.
- **(b) ds-roll / ds-r / ds-power-roll** (`roll/definition.ts`): the bar is always visible on mount. `rollingEnabled` doesn't gate it (pinned by roll.test.ts:115). It is deferred to SC-402 behind `experimental` (audit §1, enforced by SC-406; no gating code at f8693b5).
- **Same component in both:** the kit `rollBar()`. Differences: initial state (card = last session input; ds-roll = last session input, else authored seeds), the main-action default source, and the card's lazy mount.
- **Persisted state:** none in the note (rolling never writes it; roll.test.ts:100). SessionStore only: `roll.lastInput.<n>` (the card drops `mainAction`, rollController.ts:128-135; ds-roll keeps it) and `roll.history.<n>` (cap 10). Prefs: `rollingEnabled`, `rollClickToRoll`, `rollerEngine`. ds-roll YAML seeds: `skill`, `edges`, `banes`, `main_action`, `characteristic`, `auto_roll` (schema.yaml). ds-roll is deliberately **outside** the chrome roster (chrome.test.ts:186-190 OUT list), so it has no element collapse.

## 3. Existing patterns to reuse (no new idioms)

| Need | Reuse | Where |
|---|---|---|
| Disclosure | **kit `collapsible()`**: real `<button aria-expanded aria-controls>`, region hidden via the `hidden` attribute, `chevron-right` rotated by CSS on `[data-open]`, `SessionPersist` round-trip that writes only on user toggles | kit/collapsible.ts:426-477 |
| Persistence semantics for "folded" | chrome collapse: session slot, never the note, print shows expanded/absent | chrome/mountChrome.ts:14-25 |
| Field caption over a value | small-caps caption: SC-377 Malice well (`.dse-init__malice-cap`: small-caps, `--dse-fs-caption`, `--dse-fg-muted`), stat-tile label (`.dse-tiles__label`), "label above a stepper" panels (`.dse-res__label`, `.dse-surge__label`) | styles-source.css:17341, ~6047-6140; resource/panel.ts:44, surges/panel.ts:40 |
| Labeled checkbox for "skill applies" | native `<label><input type=checkbox> Skill (+2)</label>`, already used by ds-project's roller row | project/view.ts:248-251 (and :212 Breakthrough) |
| Steppers / buttons | kit `stepper` (aria group name = label; `renderValue` for non-editable values), `iconButton` (text + icon; real `disabled`) | kit/stepper.ts, kit/iconButton.ts |
| Icons already in use | `dices`, `rotate-ccw`, `chevron-right`, `check`, `x` (Lucide via setIcon; plugin precedent, not the site's glyph-font rule) | — |
| Colorblind rule | state by shape or word, never hue (DESIGN.md rule 9; initiative pips, styles-source.css:13703-13708) | — |

There is no reusable "labeled field" kit primitive. I recommend not adding one to the kit for this ticket: wrap fields locally with `.dse-rollbar__field` + `.dse-rollbar__label`, styled with the Malice-cap tokens.

## 4. Design spec (recommended)

### 4.1 Structure (kit `rollBar`, both hosts)
```
.dse-rollbar                                  (flex-wrap row, existing sunken box)
  [Roll] .dse-btn--accent (dices + "Roll")    — FIRST in tab order, always visible
  .dse-collapse.dse-rollbar__mods             — kit collapsible(); root display:contents
     header button: ▸ "Modifiers" + .dse-rollbar__summary ("Reason 0 · 1 edge")
     region .dse-rollbar__panel (flex-basis 100%; wraps under the row)
        .dse-rollbar__field  caption "Reason"  + stepper            (absent ⇒ no field;
                                                                      fixed ⇒ caption + read-only value)
        .dse-rollbar__pair   [field "Edges" + stepper] [field "Banes" + stepper]   (never splits)
        .dse-rollbar__net    "1 edge: +2 to the total" (aria-live=polite; "No edges or banes" at 0/0)
        <label><input type=checkbox> Skill applies (+2)</label>
        <label><input type=checkbox> Main action — natural 19–20 is a critical hit</label>  (power-roll only)
        [Reset] iconButton rotate-ccw + text "Reset modifiers", disabled when state == defaults
```
- **Collapsed summary (words, never icons).** List the non-default facts, comma-joined: characteristic always (`Reason 0` / `Reason +2`), `skill +2`, `N edge(s)`, `N bane(s)`, `main action` only if it differs from the default. If nothing qualifies: "none". It updates live on every change (the same `render` path as the net line). The summary is the reason collapsed is safe: no modifier is ever hidden state.
- **Captions** use the game's words: the characteristic's own name (matches the "Reason +2" chip and ds-characteristics), *Edges*, *Banes*. Keep each stepper's `aria-label` equal to its visible caption (label-in-name). All existing test selectors (`aria-label="Reason"/"Edges"/"Banes"/"Roll"`) keep working.
- **Toggles → native checkboxes** (the ds-project precedent). The state is a check *shape* plus the word in the label, which fixes F4 (the toggle looked like a label) and F5 (the pressed fill equalled the Roll CTA). `RollBarState` is unchanged. **Test churn:** `button[aria-label="Skill (+2)"]` and `button[aria-label="Main action (can crit)"]` become `input[type=checkbox]` lookups in rollBar.test.ts:38,84,110,114.
- **Reset semantics (F1).** Add `defaults` to `RollBarOptions`, separate from `initial`. Reset returns to defaults: ds-roll uses the authored `skill/edges/banes/main_action`, cards use 0/0/off/inferred. The characteristic is kept (it's a fact, rollBar.test.ts:101). The visible text is "Reset modifiers", and it is disabled at defaults so it never looks like it did nothing. Today it zeroes ds-roll's authored `edges: 1` (rollBar.ts:154).
- **Flat mode (F2).** When `mode === 'flat'`, omit Edges/Banes/net (engine.ts:46 ignores them). Keep Skill only if the implementer confirms it intends a flat +2 (engine.ts:52 adds it).

### 4.2 Collapse-by-default per host
- **ds-roll:** the strip mounts with the panel **collapsed**, so the element is head + caption + tiers + one row. Clicking Roll uses the authored seeds shown in the summary. Q1 (alternative): icon-only `[🎲] [▸]` with the summary hidden. It is smaller, but it relies on aria/tooltip, which is exactly what the ticket objects to.
- **Ability cards:** unchanged launcher (head dice icon / tier-row click rolls immediately), and the strip it reveals is also **collapsed**. A card's footprint after a roll is result card + one row. Q2 (alternative): first click only reveals the strip, without rolling, so a player with an edge doesn't waste a roll. The cost is one extra click on every unmodified roll.
- **Persistence of expansion:** pass `persist: { session, blockKey, slot: 'roll.modsOpen.<n>' }` to `collapsible()` (ds-roll n=0; cards use effectIndex; hero rows are already namespaced). It survives the echo-rebuild and is forgotten on unload, and it never touches the note or any YAML key. No new authored key in SC-279; SC-402 can add `modifiers_open:` if wanted.

### 4.3 Narrow (sidebar ≈300px)
Measured today: the bar wraps to 3–4 ragged rows at 266px (`sc279-roll-block-narrow300-dark.png`). With the spec, the collapsed row is `[Roll] [▸ Modifiers · …]` and the summary text wraps under it. The expanded panel flows as fields: Reason (≈170px) / the Edges+Banes pair (≈240px, kept together by `.dse-rollbar__pair`) / net / checkbox / checkbox / Reset, each on its own line. Steel's 44px `--dse-control-min` holds. No container query is needed.

### 4.4 Keyboard / aria
Tab order: Roll → Modifiers toggle → (expanded) fields in DOM order → Reset. The toggle exposes `aria-expanded` + `aria-controls` (kit). Focus stays on the toggle when expanding. The net line gets `aria-live="polite"` (F3). The result card stays the `role=status` announcement. All controls are real buttons, inputs and checkboxes, and there are no hover-reveals.

### 4.5 Print
Hide `.dse-rollbar` (whole strip) in **both** surfaces: `@media print` and `[data-dse-print="on"]`. **Footgun:** print rule 3 (`[data-dse-print="on"] .dse-collapse__region[hidden] { display:block !important }`, styles-source.css:15624 + its @media print twin :15550) would otherwise force the collapsed panel open on paper. Hide the bar root, not just the buttons. Optionally fold authored ds-roll modifiers into the printed caption ("Power Roll + Reason · 1 edge") so paper keeps the fact (taste-neutral; the implementer's call). The result card is unchanged (its buttons are already print-hidden).

### 4.6 Colorblind
State lives in check shapes, chevron rotation, the worded summary and the worded net line. The teal fill now marks only the Roll action. The tier highlight (an existing panel channel) is out of scope.

### 4.7 DESIGN.md / docs touch
- DESIGN.md rule 9 says adjusters are "always visible" and resets belong in the chrome panel. The roller needs an explicit carve-out (Q3): a click-disclosure, not a hover-reveal; Reset is a form reset of ephemeral modifiers, not element state. Add a component-map row for the roll strip.
- Docs: `docs/settings.md` §Rolling, `docs/Roll.md` (deferred with SC-402 but still in tree), `docs/Media/roll.png` (docs-shots manifest:274), CHANGELOG `## Unreleased`.
- Trivial: the steelMaterial.test.ts:1541 comment says roll "renders an inner `.dse-card`"; it's `.dse-roll`.

### 4.8 Optional (owner's call, not required by the ticket)
Drop *Reroll* from the result card when a bar is present: it duplicates the bar's Roll, which would leave Clear only. That changes heroSheet/feature-roll Reroll tests (feature-roll.test.ts:109-119).

## 5. Test / gate impact (prediction)

- **jest suites that touch the roll UI:** `test/dom/kit/rollBar.test.ts` (12 tests; checkbox selector churn, new reset-to-defaults / summary / flat / collapsed tests), `test/dom/elements/roll.test.ts` (12; `.dse-rollbar` and `button[aria-label="Roll"]` survive; the :52 comment "no visible text" becomes false), `test/dom/elements/feature-roll.test.ts` (14; survives if the Roll aria and `.dse-rollbar` names are kept), `test/dom/elements/heroSheet.test.ts:274-325` (result headline only), `test/dom/kit/rollResultCard.test.ts` (only if 4.8 is taken), `test/dom/kit/kit-index.test.ts:168` (export), `test/dom/framework/chrome.test.ts:186-190` (keep roll OUT), `test/dom/theme/steelMaterial.test.ts:1549` (roll not plated). The kit literal-scan (`kit-index`/`rollBar.ts passes the kit style guard`, rollBar.test.ts:29) and `fontSizeContract` (use `--dse-fs-caption`, no literal sizes) also apply.
- **Lifecycle (25/25):** no scenario touches roll (grep of obsidian-lifecycle.mjs). Expect 0 impact.
- **Parity (0/0/24):** `selector-map.json` maps only `.dse-pr__head` in this area, with no `.dse-rollbar*` pair. Expect 0 impact, as long as no shared `.dse-btn`/`.dse-stepper`/`.dse-collapse` rule is edited. **Scope all CSS to `.dse-rollbar*`**: editing the shared kit rules would move dozens of frozen lines.
- **Frozen lines that move:** `roll--steel-print.png` and `roll--steel-realprint.png` (freeze-baseline.sha256 lines 163-164) → a 2-line sanctioned rebaseline. Card print lines can't move: harness defaults render zero roll DOM (feature-roll.test.ts:165 FIDELITY), and no existing capture sets `rollingEnabled`.
- **Shots today:** only the `roll` fixture (entry.ts:1021) × dark/light/print/realprint = 4 PNGs. Nothing shoots a card with rolling on.
- **Capture ids to add** (twin + realprint lines get appended = widening):
  - `roll-empty` (fixture: empty block; this is the ticket's own case, a bar-only element), collapsed.
  - `roll-narrow` (NARROW_SHOTS, width 300).
  - `feature-rolling` (PREF_SHOTS `rollingEnabled:true`, rest state; its print should equal `feature`'s).
  - Expanded and after-click states: `roll-expanded`, `roll-expanded-narrow`, `feature-rolled`, `feature-rolled-expanded`, `feature-rolled-narrow`. **Harness limitation:** INTERACTION_SHOTS support one `click` and no `prefs`/`width` (entry.ts:1348-1360, shoot.mjs:5466-5477). The click target is a `.dse-btn`, which is print-hidden, so Playwright's `.click()` throws "Element is not visible" under print/realprint (reproduced in this probe). Either extend INTERACTION_SHOTS with `prefs`, `width`, `clicks[]` and a screen-only flag (reusing the `fullPage` combo restriction at shoot.mjs:5473), or mark these entries dark/light-only. In both cases they add no frozen lines.
- **Expected battery after implementation:** tsc/lint clean; jest ≈ 4367 + new tests; lifecycle 25/25; shots 568 + new ids (×4 combos, minus print for screen-only); freeze `274/274` **after** applying the 2 sanctioned replacements (+ appended lines for the new print-producing ids); parity 0/0/24.

## 6. Current-state screenshots (fresh, f8693b5)
- Block: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-shots-r1-1792194134/sc279-roll-block-dark.png`
- Card, after the first click: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-shots-r1-1792194134/sc279-card-rolling-on-clicked-dark.png`
- What prints today: `…/sc279-roll-block-print.png` (unlabeled "0 1 0 Edge +2" box)
