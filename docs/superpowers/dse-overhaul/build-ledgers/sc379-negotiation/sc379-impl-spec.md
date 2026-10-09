# SC-379 — negotiation tracker: implementation spec

**Executive summary.**
- **What changes:** the shipped `ds-negotiation` element (aliases `ds-nt`, `ds-negotiation-tracker`) is rebuilt on round 2's **A1 standing region** — Patience on a horizontal rail, Interest on a vertical rail, both made of the same round numbered seal. Round 1's **argument tab** (appeal and mention chips stay inside "Make an Argument") is kept. The Motivations/Pitfalls cards at the bottom carry only **Mark spent / ✓ Spent**. Round 1's approved **"negotiation over" band** is added. The two tabs stay.
- **One new kit part:** `track()` in `src/framework/kit/track.ts`. It is a 0–N radiogroup of seals, horizontal or vertical. Montage and the recoveries strip move onto it later in SC-380, not here.
- **No YAML shape change.** `NegotiationData` gains *methods* only, never fields.
- **Six fixes are folded in:**
  - clamp Interest and Patience to 0–5 on Complete Argument;
  - recompute the tier rows the moment a chip or modifier changes;
  - ring the chosen tier row and mark it "✓ CHOSEN";
  - change the tooltip "Easy" to "Medium";
  - add a "why" hint to greyed-out modifiers;
  - draw the vertical rail one row at a time.
- **Print:** all 6 existing negotiation print lines move, and need a sanctioned rebaseline. The new capture ids are a widening (additions only). No other element's print may move.
- **Two slices:** (1) the kit track, the model helpers, the standing region and the ended band; (2) the argument tab, the cards, docs, the changelog and the freeze package.

**Locked direction** (coordinator ruling, relaying Scott's "A1 gauges, buttons in the tab"):
> A1's standing region (same round numbered mark on a horizontal Patience rail and a vertical
> Interest rail) + the appeal/mention chips stay INSIDE the "Make an Argument" tab (A2/A3's
> argument section) + the bottom Motivations/Pitfalls cards carry only "Mark spent"/"Spent" +
> tabs kept + the "negotiation over" band (approved).

**Visual reference — port from these, do not import them.** The mocks live in `draw-steel-elements/visual-harness/sc379/` on this branch (commits `be4b734`, `cd8cddc`).
- Open `mock.html?cand=A1&state=default|ended&bg=dark|light&width=760|300` to see the target standing region.
- Open `mock.html?cand=A2` to see the target argument section and cards.

The mock code you will port:
- **Standing region:** `mock.js` → `buildA1`, `seal`, `patienceFill`; CSS in `round2.css` (`.n3s-seal`, `.n3a1-*`).
- **Argument section:** `argumentTabs(c, m)` without `merged`, `appealChips`, `modifiers`, `completeFooter`, `endBand`, `dossier(c, m)` without `appeal`; CSS in `sc379.css` (`.n3-chip*`, `.n3-mods`, `.n3-check*`, `.n3-roll`, `.n3-chosen`, `.n3-complete*`, `.n3-end*`, `.n3-dossier*`, `.n3-dos*`).
- **Ended logic:** `ending(m)` and `roll(m)`. `roll(m)` is `ArgumentPowerRoll.build`, ported for the mock.

Never copy a mock rgba literal or its `[data-n3]` scoping. The class mapping is in §1.

## 1. Target DOM (top to bottom)

The pipeline root, `[data-dse-element="negotiation"][data-dse-theme="steel"]`, already carries the Steel card plate. That plate comes from the shared tracker rule at `styles-source.css` ~7084. Remove the root's `letter-spacing: 0.03em` and its `::before`/`::after` corner hairlines (`styles-source.css:2494-2520`).

```
div.dse-nt                                   container-type:inline-size; container-name:dse-nt
                                             [data-ended="final"|"deal"|"hostile"]  (absent while live)
├─ div.dse-nt__head                          KEEP (flex row)
│  ├─ cardHead(head, { crest:{icon:'handshake', size:'lg'}, leftEyebrow:'Negotiation'|undefined,
│  │            name, level:2 })             kit cardHead + crest (montage HeadView.ts precedent)
│  └─ iconButton ghost 'more-vertical' .dse-nt__menu   KEEP (canPersist only) — menu = Reset negotiation
├─ section.dse-nt__patience                  sunken strip; grid areas 'label track readout'
│  ├─ div.dse-nt__patience-label             <span data-icon=hourglass> + span.dse-nt__label "Patience"
│  ├─ div.dse-nt__readout                    span.dse-nt__readout-value "3" + span.dse-nt__readout-of "/ 5"
│  │                                         (aria-hidden="true": the track carries the value to AT)
│  └─ track(…horizontal…)                    NEW KIT PART → div.dse-track.dse-track--horizontal
├─ section.dse-nt__interest                  framed board (metal-line border, radius, overflow hidden)
│  ├─ div.dse-nt__interest-head              span.dse-nt__label "Interest" + span.dse-nt__interest-hint
│  │                                         "what the NPC will agree to"
│  └─ track(…vertical, descending…)          NEW KIT PART → div.dse-track.dse-track--vertical
│        current slot additionally holds span.dse-nt__now  ("now" | flag icon + "final offer" | "outcome")
├─ div.dse-nt__end[data-kind]                ONLY when ended (§3): flag icon, div.dse-nt__end-label,
│                                            div.dse-nt__end-text (… + <strong>offer text</strong>)
├─ tabs(…) .dse-tabs.dse-nt__actions         KEEP kit tabs: ids 'argument'/'learn-more', labels, icons,
│                                            session slot 'tab' — all unchanged
│  ├─ panel argument → div.dse-nt__argument
│  │  ├─ div.dse-nt__appeals                 grid repeat(auto-fit, minmax(min(13em,100%),1fr))
│  │  │  ├─ div.dse-nt__appeals-group  head: span.dse-nt__glyph--mot "◆" + .dse-nt__label
│  │  │  │     "Appeals to Motivation" (tooltip kept); .dse-nt__chiprow of
│  │  │  │     button.dse-optchip.dse-nt__chip[data-kind="motivation"][aria-pressed]
│  │  │  │       → span.dse-nt__chip-glyph ◆|◇, (pressed) check icon, span.dse-nt__chip-text name,
│  │  │  │         (spent) span.dse-nt__chip-note "spent"; .is-spent strikes the text
│  │  │  └─ div.dse-nt__appeals-group  triangle-alert icon + "Mentions Pitfall" (tooltip kept);
│  │  │        button.dse-optchip.dse-nt__chip[data-kind="pitfall"][aria-pressed] (icon + name)
│  │  ├─ div.dse-nt__mods                    .dse-nt__label "Modifiers" + 3 × label.dse-nt__check
│  │  │     (input[type=checkbox] — the existing themed Steel checkbox, styles-source.css ~11266 —
│  │  │      + span text + span.dse-nt__why when disabled); .is-disabled on the label
│  │  ├─ div.dse-nt__roll-slot               owns ONE powerRollPanel({selectable:canPersist, …})
│  │  │     chosen row additionally holds span.dse-nt__chosen (check icon + "chosen")
│  │  └─ div.dse-nt__complete                span.dse-nt__complete-hint + iconButton 'messages-square'
│  │        "Complete Argument" (variant 'accent' while armed, default while disabled)
│  └─ panel learn-more → div.dse-nt__learn-more   KEEP verbatim (intro <p> + static 3-tier panel)
└─ div.dse-nt__dossier                       grid repeat(auto-fit, minmax(min(15em,100%),1fr))
   ├─ section.dse-nt__dossier-col[data-kind="motivation"]  head: ◆ + .dse-nt__label "Motivations" +
   │     span.dse-nt__dossier-count "1 of 2 open"; rows div.dse-nt__dos(.is-spent):
   │     span.dse-nt__dos-glyph ◆|◇, div.dse-nt__dos-text (span name, span reason),
   │     button.dse-optchip.dse-nt__chip[data-kind="spent"][aria-pressed] "Mark spent" | ✓ "Spent"
   └─ section.dse-nt__dossier-col[data-kind="pitfall"]     head: triangle-alert + "Pitfalls" +
         "1 known"; rows: icon, name, reason — NO controls
```

**Mock-class → production-class mapping**

| Mock class | Production class |
|---|---|
| `n3-headrow` | `dse-nt__head` |
| `n3a1-pat` | `dse-nt__patience` |
| `n3a1-xrail` / `.n3s-seal` | `dse-track--horizontal` / `dse-track__mark` |
| `n3a-ladder` | `dse-nt__interest` |
| `n3a1-yrail` / `n3a1-rung` | `dse-track--vertical` / `dse-track__slot` |
| `n3a-now` | `dse-nt__now` |
| `n3-end*` | `dse-nt__end*` |
| `n3-appeals*` | `dse-nt__appeals*` |
| `n3-chip*` | `dse-nt__chip*` |
| `n3-mods` / `n3-check*` | `dse-nt__mods` / `dse-nt__check*` |
| `n3-chosen` | `dse-nt__chosen` |
| `n3-complete*` | `dse-nt__complete*` |
| `n3-dossier*` / `n3-dos*` | `dse-nt__dossier*` / `dse-nt__dos*` |

### The new kit part: `track()` (`src/framework/kit/track.ts`, exported from `kit/index.ts`)

```ts
export interface TrackOptions {
  orientation: 'horizontal' | 'vertical';
  max: number;                 // slots are 0..max (min is always 0)
  value: number;               // clamped to 0..max for display
  label: string;               // radiogroup aria-label ("Patience" / "Interest")
  order?: 'ascending' | 'descending';   // DOM order; default ascending. Interest = descending (5 at top)
  fill?: 'remaining' | 'none'; // 'remaining' (Patience): 1..value = on, >value = spent, 0 = floor
                               // 'none' (Interest): every slot plain
  slotText?: (n: number) => string;     // vertical only: the row text (Interest outcome)
  slotLabel?: (n: number) => string;    // aria-label; default `${label} ${n}`
  disabled?: boolean;          // read-only hosts: REAL disabled buttons, no listeners
  onChange?: (n: number) => void;
}
export interface TrackHandle {
  readonly rootEl: HTMLElement;
  readonly slotEls: Readonly<Record<number, HTMLButtonElement>>;
  setValue(n: number): void;   // in place: aria-checked, tabindex, data-fill, data-current; no onChange
  getValue(): number;
}
```

**DOM:** `div.dse-track.dse-track--{orientation}[role=radiogroup][aria-label]`, with the custom property `--dse-track-fill` = value/max (the sanctioned TS→CSS seam, like montage's `--dse-mt-cols`).
- **Horizontal:** a `span.dse-track__rail` (dashed base) and a `span.dse-track__rail-fill` (solid steel, width = fill), then the slots.
- **Each slot:** `button.dse-track__slot[type=button][role=radio][aria-checked][tabindex][data-value=n][data-fill="on|spent|plain|floor"]`, plus `[data-current]` on the checked slot.
  - It contains `span.dse-track__mark` > `span.dse-track__n` (the numeral). Vertical slots add `span.dse-track__text`.
  - Horizontal: the slot *is* the mark. Vertical: the whole row is the radio and the mark sits inside it.
- **Vertical rail, drawn one row at a time:** `.dse-track__mark::before` paints the half-segment above the mark and `::after` the half below. The first slot omits `::before` and the last omits `::after`, so the rail runs mark centre to mark centre and can never overshoot at 300px.

**Keyboard:** one Tab stop (roving `tabindex`: 0 on the checked slot, -1 on the rest).
- **Arrows:** Left/Up go to the previous slot in DOM order; Right/Down go to the next, wrapping at both ends. Home and End go to the first and last.
- **Selection follows focus** (same contract as `powerRollPanel` and `tabs`). Each move calls `onChange` once.
- **Click** sets the value. Clicking the current slot is a no-op: no `onChange`, no write.

**Visual (Steel), ported from `round2.css` `.n3s-seal`:**
- **Mark:** round, `1.9em`, 1px `--dse-metal-line`, numeral in `--dse-font-mono` at `--dse-fs-secondary`, weight 700.
  - `on`: `--dse-metal-grad` fill, numeral in `--dse-surface`.
  - `spent`: 1px dashed `--dse-border-strong`, numeral in `--dse-fg-faint`.
  - Current: `--dse-accent` fill, numeral in `--dse-accent-fg`, plus a 2px `--dse-accent` outline at offset 2px.
  - In words: silver or gunmetal for remaining, dashed grey for spent, solid teal ringed in teal for current. Fill, outline and ring always carry the state; colour never carries it alone.
- **Background must be opaque:** composite `--dse-surface-sunken` over `--dse-surface` (two background layers, no literal), so the rail never shows through a mark.
- **Vertical current row:** `--dse-surface-raised` background, `inset 0 0 0 2px var(--dse-accent)`, text in `--dse-heading`, weight 700.

**Print/base layer:** keep the base (unscoped) rules structural only: layout, mark geometry, a 1px border, and a bold current numeral with a 2px solid border. Put every colour, gradient, ring and shadow under `[data-dse-theme='steel']:not([data-dse-print="on"])` (dse-verify "Steel scoping rule"). The track has exactly one consumer in this ticket, so only negotiation's print lines can move.

## 2. Source changes

- **`src/framework/kit/track.ts`** (new), plus its export from `kit/index.ts` and the completeness list in `test/dom/kit/kit-index.test.ts`.
- **`src/model/NegotiationData.ts`:** add **methods only**. `serialize` is `stringifyYaml(instance)`, and prototype methods are never own keys, so they never serialize. Do not add a field.
  - `ending(): 'deal' | 'hostile' | 'final' | null`. Precedence: `current_interest >= 5` → `'deal'`; `<= 0` → `'hostile'`; else `current_patience <= 0` → `'final'`; else `null`.
  - `static clampStanding(n: number): number` → `Math.max(0, Math.min(5, n))`.
- **`src/elements/negotiation/view.ts`:**
  - Add the crest to `buildHead`.
  - Stamp `data-ended` on `.dse-nt`. Mount the end band between the Interest board and the tabs.
  - Expose a `refreshStanding()` callback to the sub-views. It repaints both tracks, both readouts, the now-tag and the end band, and sets `data-ended`, all in place with no rebuild.
  - Reset is unchanged: `resetData()`, then `update()`, then `persist()`.
- **`PatienceInterestView.ts`:** rewrite onto two `track()` calls. Patience: horizontal, `fill:'remaining'`. Interest: vertical, descending, `fill:'none'`, `slotText` = `i5..i0`.
  - The now-tag moves to the new current slot on change.
  - `onChange` mutates the model, calls `refreshStanding`, then calls `persist()`. Render never writes.
  - Delete the bubble, `data-reached` and `interestOffers` code.
- **`ArgumentView.ts`:**
  - **Chips:** replace the modifier `checkboxLine`s for motivations and pitfalls with `.dse-optchip` chips. They write the same `currentArgument.motivationsUsed` / `pitfallsUsed` and keep the existing reuse logic in `onMotivationToggled` (`:97-115`).
  - **Modifiers:** keep the three as checkboxes and add the `why` hints (§4).
  - **Roll:** the tier panel lives in `.dse-nt__roll-slot`, under its own child `Component`. On any chip or modifier change, `removeChild` the old one and rebuild (§4). Chips and checkboxes update **in place**, so keyboard focus is never lost.
  - Move the chosen mark when `onSelect` fires.
  - The Complete footer gets the hint and variant logic (§3).
- **`MotivationsPitfallsView.ts`:** rewrite into the two dossier columns. The motivation row's only control is the **Spent** chip; it still routes through `setMotivationUsed`. Pitfall rows have no control.
- **`LearnMoreView.ts`:** unchanged.
- **`styles-source.css`:**
  - Replace the negotiation block (`:2485-2712`) and the D-2 Steel override block (`:11235-11265`) with one new block: structure under `[data-dse-element="negotiation"] .dse-nt`, Steel material under `[data-dse-theme='steel'][data-dse-element='negotiation']:not([data-dse-print="on"]) .dse-nt`.
  - Add the kit `.dse-track` rules beside the other kit grammars (near `.dse-pr`, ~:14220).
  - Keep the shared themed-checkbox rule (`:11266+`) untouched: project uses it.
  - Narrow behaviour uses `@container dse-nt (max-width: 420px)`, never a viewport media query.
  - **Sizes:** every `font-size` is a `--dse-fs-*` role, or a `calc()` of one. `fontSizeContract.test.ts` must stay green with the allowlist not grown.

  | Role | Text |
  |---|---|
  | `label` | the small-caps labels |
  | `subheading` | the readout value, and the Make-an-Argument heading if one is used |
  | `secondary` | marks, reasons, modifier text |
  | `caption` | hints, counts, the chip size of the spent toggle |
  | `micro` | the now tag, chip note, chosen word |
  | `control` | chips |

  - **Colours:** `--dse-*` tokens only. The mock's header-band and key-ground rgba washes are **not** ported. Use `--dse-surface-sunken` layered over `--dse-surface` instead.
  - Glyph colour pair: motivation diamond = `--dse-metal-bright` (near-white steel); pitfall triangle = `--dse-warn` (orange). Shape carries the meaning; colour only reinforces it.
- **`src/elements/negotiation/definition.ts`:** the chrome `summary` is unchanged ("Interest N · Patience N").

## 3. The ended state

**When `model.ending() !== null`:**
- **`.dse-nt__end` renders** with a gold flag icon (Lucide `flag`), a 2px gold top rule, and a 1px `--dse-metal-line` border on a sunken ground (`--dse-vp`, warm gold dark / dark bronze light). The label is in gold small caps; the text is in `--dse-fg`.
  - `final`: label **"Final offer"**, text "Patience is spent — the NPC makes a final offer at Interest {n}: **{offer}**".
  - `deal`: label **"Negotiation over"**, text "Interest reached 5 — the NPC agrees: **{i5}**".
  - `hostile`: label **"Negotiation over"**, text "Interest fell to 0 — the NPC ends it: **{i0}**".
- **The Interest now-tag** reads `⚑ final offer` (final) or `⚑ outcome` (deal / hostile). The flag icon is `--dse-vp`; the tag frame stays teal.
- **Complete Argument:** real `disabled`, default variant. Hint text: **"The negotiation is over — use ⋮ → Reset negotiation to start again."** This replaces the mock's leftover "Choose the test result…".
- **The tier panel renders static** (`selectable: false`), the same as the read-only path, so no radio leads nowhere. Chips and modifiers stay operable: they are harmless, and the next Reset clears them.
- **The tracks stay operable,** so the Director can correct a mis-set value. Moving off an ending condition removes the band, `data-ended` and the static roll in place (`refreshStanding()` re-arms the roll slot).
- **⋮ → Reset negotiation:** unchanged semantics (`resetData()`: current := initial, all motivations unspent, `currentArgument` reset), then a rebuild, then one write. The band disappears unless the authored initial values themselves meet an ending condition, in which case it reappears: that is correct.

**Read-only hosts:** the band still renders. That is information, not a control.

## 4. Folded fixes

1. **Clamp** (`ArgumentView.ts:266-267`): `current_interest` and `current_patience` := `NegotiationData.clampStanding(old + delta)`. The tracks also clamp *display* of an out-of-range authored value, but the YAML is not rewritten on render.
2. **Immediate recompute** (`ArgumentView.ts` `buildPowerRoll`, called once at mount today). Every chip or modifier change runs this sequence:
   1. mutate `currentArgument`;
   2. re-evaluate the modifiers' `disabled`/`checked` state in place (reuse is enabled only when a spent motivation is appealed; same-argument is disabled while a motivation is appealed);
   3. rebuild the roll under its child Component, keeping the selected **tier id** and recomputing `selectedTier` from the new table;
   4. `persist()`.

   Today the tiers update only when the note write re-renders the block; the browser harness shows them stale.
3. **Chosen row:** the selected `button.dse-pr__row[aria-checked="true"]` inside `.dse-nt__roll-slot` gets `background --dse-surface-raised` and `box-shadow: inset 0 0 0 2px var(--dse-accent)`, plus `span.dse-nt__chosen` (check icon + the word "chosen", small caps, `--dse-fs-micro`, teal).
   - At ≤420px container width, hide the word and keep the ring and the check.
   - Scope it to negotiation. **Do not** restyle the kit's `.dse-pr__row[aria-checked]` base (`:14247`); that is SC-380 / kit territory.
4. **Tooltip** (`ArgumentView.ts:78`): "…Difficulty of the Argument Test is Easy." → "…is Medium." (see Open questions).
5. **Why-hints** (`ArgumentView.ts` `buildOtherMods`):
   - "Reuses a Motivation…", when disabled: *"only when a spent Motivation is appealed to"*.
   - "Argument has already been made…", when disabled: *"not while a Motivation is appealed to"*.
   - Render it as `span.dse-nt__why` (caption, italic, `--dse-fg-faint`), on its own line under the label text.
6. **Rail never overshoots:** see §1. `track()` draws vertical rail segments per slot.

## 5. Fixtures and captures (`visual-harness/entry.ts`)

**Existing captures:** `negotiation`, `negotiation-checked` and `negotiation-pr-checked` all change in every combo. **All 6 frozen print lines move** (`--steel-print` + `--steel-realprint` × 3), which needs a sanctioned rebaseline.

**New fixture:** `src/elements/negotiation/fixture-ended.yaml` (montage's `fixture-*.yaml` convention). Contents:
- example.yaml's name, offers and motivations;
- `current_interest: 3`, `current_patience: 0`;
- both motivations `hasBeenAppealedTo: true`.

Register it in the fixtures map at `entry.ts:1011` as `ended`. That creates capture id **`negotiation-ended`**.

**New captures:**
- `NARROW_SHOTS` (`entry.ts:1234`): **`{ id: 'negotiation-narrow', element: 'negotiation', fixture: 'checked', width: 300 }`**.
- `INTERACTION_SHOTS` (`entry.ts:1332`): **`{ id: 'negotiation-appeal', element: 'negotiation', fixture: 'default', click: "button.dse-nt__chip[data-kind='motivation']" }`**. It proves the immediate recompute: the tiers must show the motivation table. Pick the first chip with `:first-of-type`, or add the name as a `data-name` attribute and select by it.

The new ids add **6 print lines** (3 ids × print/realprint). That is an additions-only **widening** and needs no sanction. The ticket-owner verifies it by sorted diff.

**Blocker to resolve first — see Open questions:** the sweep's page viewport is 900×1200 (`shoot.mjs:4941`), and element screenshots taller than 1200 CSS px are cut off. Measured: `montage-narrow--steel-print.png` is 6860 px tall, but its content stops at row 2374 (1187 CSS px). `negotiation-narrow` will be about 2100 CSS px tall, so it would be captured truncated too.

## 6. Tests

**`test/dom/elements/negotiation.test.ts` — existing tests to rewrite:**

| Line | Test | Rewrite |
|---|---|---|
| :205 | patience bubbles | → horizontal track: 6 `role=radio` slots, `aria-checked` only on 3, `data-fill` on/spent/floor, one Tab stop |
| :223 | interest ladder `[data-current]` / `[data-reached]` | → vertical track, descending order 5..0, slot text = offers, now-tag on 3, no `data-reached` anywhere |
| :317 | details checkboxes | → dossier: a motivation row has exactly one Spent chip; a pitfall row has no button/input |
| :357 | CSS contract | → new block selectors, `.dse-track` kit rules present, legacy bubble/ladder rules gone, Steel rules carry `:not([data-dse-print="on"])` |
| :431 / :449 | click patience / interest | → click track slots; same "repaint in place + exactly one write + legacy bytes" assertions |
| :490 | details checkbox → `setMotivationUsed` | → Spent chip; identical bytes |
| :510 | argument-tab motivation checkbox | → appeal chip `aria-pressed`; identical bytes |
| :687 | read-only | → track slots and all chips REAL-disabled, roll static, no Complete, no menu, the band still shows when ended |

The tab tests (:247, :377-:409), the tier radiogroup tests (:272, :530, :547), Complete (:559, :581), Reset (:616, :649) and the registry/vault tests stay. Adjust selectors only.

**New tests:**
- **`test/dom/kit/track.test.ts`:**
  - DOM and ARIA for both orientations;
  - roving tabindex;
  - arrows, Home and End, with wrap and selection following focus (one `onChange` per move);
  - clicking the current slot is a no-op;
  - `setValue` repaints without `onChange`;
  - `fill` modes;
  - `disabled` means no listeners;
  - value clamping;
  - the vertical first and last slots carry no outer rail segment (class or attribute hook, e.g. `[data-edge="first|last"]`);
  - `styleGuard` clean.
- **Keyboard on negotiation:** ArrowRight on Patience 3 → 4, with one debounced write. ArrowDown on Interest 3 → 2.
- **Clamp:** Patience 0 + a −1 tier → 0. Interest 5 + crit → 5. Interest 0 + pitfall → 0. Bytes written are in range.
- **Immediate recompute:**
  - toggling the Higher Authority chip changes the tier text to the motivation table **before** any host echo;
  - modifiers' `disabled` flips in place, and focus stays on the chip;
  - a previously chosen tier id stays checked.
- **Ended:**
  - for each of `final`, `deal` and `hostile`: `data-ended`, the band label and text, now-tag text, Complete disabled with the over-hint, the roll static;
  - setting Patience back to 1 removes all of it in place;
  - Reset clears it.
- **Chips in the tab, cards only spent:**
  - chips exist only inside the argument tabpanel;
  - the dossier holds zero appeal or mention controls;
  - the chosen tier row holds `.dse-nt__chosen`;
  - the `why` hints appear only when disabled;
  - the tooltip text says "Medium".
- **YAML no-regression:**
  - `test/unit/model/negotiation-serialize.test.ts` stays green unchanged;
  - new: after a full UI session (appeal, spend, choose, complete, reset), the written YAML has exactly the legacy key set and order (`name, initial_patience, current_patience, initial_interest, current_interest, motivations, pitfalls, currentArgument, i5..i0`), with no new keys;
  - `ending`/`clampStanding` are not own keys.
- **Guards that must stay green:** `fontSizeContract.test.ts`, `sccStyleParity`, `test/dom/visual-harness/fixtures.test.ts` (it validates the new fixture), `kit-index.test.ts`.

## 7. Docs

**`draw-steel-elements/docs/negotiation-tracker.md`:**
- **§"Negotiation Name and Menu"** (:124): mention the crest. Reset also clears the ended band.
- **§"Patience and Interest Tracker" / "Adjusting Levels"** (:132-143): rewrite for the two tracks. Patience runs across: filled seals are patience left, dashed are spent. Interest runs down the outcome list. The current value is the solid teal seal. Click or use the arrow keys.
- **New §"When the negotiation ends":** the three conditions, the band, Complete disabled, Reset.
- **§"Motivations and Pitfalls View" / "Managing Motivations"** (:157-172): the cards now use a **Mark spent / Spent** button, not a checkbox. Pitfalls are reference only.
- **§"Argument Modifiers"** (:178-194): Appeals and Mentions are buttons inside the Make an Argument tab (unchanged location). Explain the greyed-out hints. The tiers update immediately.
- **§"Power Roll" / "Completing an Argument"** (:196-215): the chosen row is ringed and marked CHOSEN. Results are kept within 0–5. Complete is unavailable once the negotiation is over.
- Regenerate `docs/Media/negotiation.png` with `npm run docs-shots` (manifest entry `docs-manifest.mjs:283`). The `.gif` (:488) is regenerated only if the manifest can; otherwise record a follow-up.

**CHANGELOG:** in the worktree superproject only, at `/home/scott/code/steelCompendium/worktrees/sc379-negotiation/CHANGELOG.md` under `## Unreleased`. Never touch the main checkout's copy:
> - **DSE plugin: the negotiation tracker is redesigned in the Steel style (SC-379).** Patience
>   runs across and Interest runs down, both as numbered seals with the current value in solid
>   teal; the tracker now says when the negotiation is over (final offer, deal, or hostile) and
>   stops offering Complete Argument; tier results update the moment you pick a motivation or
>   modifier; Motivations are marked spent from their card; argument results can no longer push
>   Interest or Patience outside 0–5.

## 8. Slices (each lands its own commit and must pass the full dse-verify battery)

**Slice 1 — kit track + standing region + ended band.**
- **Build:**
  - `track.ts`, its export and its tests;
  - the `NegotiationData` methods;
  - the clamp (fix 1);
  - `PatienceInterestView` rewritten;
  - the head crest;
  - `view.ts` `refreshStanding`, `data-ended` and the band;
  - Complete disabled with the over-hint, and the static roll when ended;
  - CSS for the root, head, patience, interest, track and band;
  - `fixture-ended.yaml` and its capture;
  - the `negotiation-narrow` entry;
  - updated and new tests for everything above.
- **Gate:**
  - tsc, lint and jest green;
  - shots produce the new ids;
  - freeze: the **only** mismatches are the 6 negotiation lines, and the new ids are additions;
  - parity: 0 GAPs, 0 undeclared, 24 DECLARED, unchanged.
- **Commit, plus a report listing the moved lines.**

**Slice 2 — argument tab, cards, docs, changelog, freeze package.**
- **Build:**
  - chips styled in the tab;
  - modifiers with the why-hints (fix 5);
  - the tooltip change (fix 4);
  - immediate recompute (fix 2);
  - the chosen mark (fix 3);
  - Complete's accent variant and hint;
  - `MotivationsPitfallsView` turned into the dossier with Spent chips only;
  - the `negotiation-appeal` interaction capture;
  - the remaining tests;
  - docs, docs-shots and the CHANGELOG bullet.
- **Deliver:** `.superpowers/sdd/sc379-negotiation/rebaseline.txt` (6 lines) and `widening.txt` (6 lines). Both must be identical across 2 clean runs. Also before/after crops of the 3 existing print ids for the sanction ask.
- **Gate:** the same battery. Freeze mismatches are exactly the 6 rebaseline lines.

## Open questions (for the owner)

1. **Narrow capture truncation.** `negotiation-narrow` (~2100 CSS px) will be captured truncated by the 1200px sweep viewport (`shoot.mjs:4941`), as `montage-narrow` already is. Options:
   - (a) fold a `shoot.mjs` fix (grow the viewport to the mount's height before the element screenshot) into slice 1 as its own commit. This *will* move `montage-narrow`'s frozen print lines, which are currently truncated, and any other over-1200px capture, so they need their own sanctioned rebaseline;
   - (b) leave the harness alone, accept a truncated `negotiation-narrow`, and file the fix separately;
   - (c) shoot the narrow capture with the standing region only. That is not supported by `NARROW_SHOTS` today.

   Recommend (a), as a separate commit with its own rebaseline lines.
2. **"Easy" → "Medium" is sourced from `reference/draw-steel-agent-reference.md:858`**, a summary, not the book. Confirm against the Heroes book text before shipping fix 4. The tooltip is rules text the Director trusts.
3. **Ended-state tier panel:** this spec renders it static, so there are no live radios when Complete can't fire. If you prefer it stay selectable (only Complete disabled), §3 and one test flip. There is no other impact.
4. **The 0-floor seal on Patience** reads hollow when patience is spent and is never "filled" (the mock's convention). Confirm that is wanted rather than painting 0 as a red or gold "empty" state. The mock deliberately avoids hue-only meaning here.
