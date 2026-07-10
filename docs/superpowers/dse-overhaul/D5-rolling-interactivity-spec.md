# D5 — Rolling & Interactivity — Feature Spec

**Status:** proposed (planning only — no code changes)
**Date:** 2026-07-01
**Repo:** `draw-steel-elements/` (Obsidian plugin)
**Depends on:** F1 (Element Framework v2 — this spec imports its §3 interface names verbatim)
**Consumed by:** D7 (Hero sheet) and D8 (Encounter) call the roll engine as a shared service.
**Menu source:** M1 §A — Power Roll roller, Edge/Bane resolver, `ds-roll`, Dice-plugin bridge.

**One-line summary:** a pure, testable **roll engine** (2d10 + characteristic → tier / crit /
edge-bane resolution) exposed as a reusable framework service, driving three surfaces: a
**Power Roll roller** attached to rendered ability/test cards (click → roll → highlight the
resolved tier), an **Edge/Bane resolver** bar (toggle modifiers before rolling), and a new
**`ds-roll`** element for arbitrary DS rolls — with an **optional, feature-detected bridge**
to the community Dice Roller plugin (DS-native roller is the default, never a hard dependency).

This effort **owns the roll engine**. D7/D8 build their UIs on the API in §2; they do not
re-derive the math. The engine is a **pure module** (F3-testable, zero Obsidian/DOM imports).

---

## 1. Draw Steel power-roll rules model

Everything here is the *normative* math the engine implements. Citations are to the
`reference/` docs and the authoritative book text under `steel-etl/input/`.

### 1.1 The core roll

> "All rolls use 2d10 + characteristic. Three tier outcomes." — `reference/draw-steel-overview.md` §The Power Roll
> "All rolls: **2d10 + characteristic score**." — `reference/draw-steel-agent-reference.md` §Power Rolls

- Roll **2d10**. Call the two faces `d1`, `d2`; **`natural = d1 + d2`** (range 2–20).
- Add the acting **characteristic score** (−5..+5), an optional **skill bonus** (+2 if an
  applicable skill applies — "Having an applicable skill grants **+2** to a power roll" —
  `draw-steel-agent-reference.md` §Skills), plus any other flat bonuses.
- **`total = natural + characteristic + skillBonus + otherFlatMods (+ flat edge/bane, §1.3)`**.

### 1.2 Tier bands (applied to `total`)

| Tier | Total | Source |
|---|---|---|
| **Tier 1** | ≤ 11 | overview + agent-reference tables |
| **Tier 2** | 12–16 | " |
| **Tier 3** | ≥ 17 | " |

These bands are what the DSE `EffectView` already labels `≤11` / `12-16` / `17+`
(`src/drawSteelAdmonition/Features/EffectView.ts`, `tier1Key`/`tier2Key`/`tier3Key`).

### 1.3 Edges & banes

> "Edges (+2), Banes (−2). Double edge/bane shifts the tier result up/down by one instead of adding a flat bonus." — `draw-steel-overview.md`
> "Edge = +2, Bane = −2. Double edge (2+ edges, 0 banes) = auto-shift tier up by 1. Double bane (2+ banes, 0 edges) = auto-shift tier down by 1. Edges and banes cancel 1-for-1." — `draw-steel-agent-reference.md` §Power Rolls

Resolution algorithm (exact):

1. **Cancel 1-for-1:** `net = edges − banes` (each an integer count ≥ 0).
2. **Magnitude caps at 2** — DS has no "triple edge": `|net|` beyond 2 behaves as 2.
3. **Single (`|net| == 1`):** apply a **flat** `+2` (edge) or `−2` (bane) to `total`. No tier shift.
4. **Double (`|net| ≥ 2`):** apply **no flat bonus**; instead **shift the resolved tier** by
   `+1` (double edge) or `−1` (double bane), clamped to `[Tier 1, Tier 3]`.

The distinction is load-bearing: a single edge/bane changes the *number*, a double changes the
*tier band* directly. (Opposed rolls override this — §1.5.)

### 1.4 Natural 19–20 and critical hits

> "When the result of a power roll is 19 or 20 **before adding any modifiers**. A natural 19 or 20 always achieves a tier 3 outcome on a power roll. On an ability roll with an ability that uses a main action, it is also a critical hit." — `steel-etl/input/heroes/Draw Steel Heroes.md:383`
> "When a creature rolls a natural 19 or 20 on an ability roll made as part of a main action, that creature gains an additional main action … An ability roll made as part of a maneuver can't score a critical hit." — `Draw Steel Heroes.md:197`

Precise semantics the engine encodes:

- **`isNat = natural >= 19`** — computed from `d1 + d2` **before any characteristic, skill,
  edge, or bane** is applied. (Not "any die shows 19" — 2d10 can't; it is the *sum*.)
- **Nat 19–20 forces Tier 3** and this **overrides tier shifts**: a double bane on a natural
  19–20 stays Tier 3 (the rule says *always* tier 3). Resolution order: resolve the tier from
  bands + double-shift **first**, then if `isNat` force `tier = 3`.
- **Critical hit** (`isCritical`) is a *narrower* flag: `isNat && mode === "power-roll" &&
  isMainActionAbility === true`. Maneuver/triggered ability rolls and tests **do not** crit.
  The engine returns `isCritical` but never *acts* on the "extra main action" — that is the
  caller's/tracker's concern (D8).
- **DS has no "doubles" crit and no nat-20-only rule.** The crit condition is the natural
  *sum* being 19 or 20. (Answering the brief's `nat 10-10?` question: **no** — two 10s sum to
  20 and therefore crit, but only because 20 ≥ 19, not because they match. There is no
  matched-dice mechanic in Draw Steel.)
- **Tests** also key off nat 19–20: "A creature always gains a reward on a test that is a
  natural 19 or 20" (`Draw Steel Heroes.md:467`) — i.e. nat 19–20 forces the top outcome band
  but is not a combat "critical hit." The engine surfaces `isNat` so a test view can render
  the reward; `isCritical` stays false for `mode: "test"`.

### 1.5 Roll modes

The same dice drive several DS roll shapes; the engine takes a `mode` that changes only the
double-edge/bane behavior and which flags mean anything.

| Mode | Tiers? | Double edge/bane | Crit flag | Notes / source |
|---|---|---|---|---|
| `power-roll` (default) | yes | tier shift ±1 | yes (if main-action ability) | Abilities. |
| `test` | yes | tier shift ±1 | no (nat19–20 → `isNat` reward) | Tests share tier bands; difficulty banding is *interpretation* (§1.6), not engine math. |
| `opposed` | **no** | **flat ±4** | no | "Opposed Power Roll: highest total wins. No tiers. Double edges/banes become flat +/−4." — `draw-steel-agent-reference.md` §Test Types. Engine returns `total`, no `tier`. |
| `flat` | no | n/a (edges/banes ignored) | no | Arbitrary dice (damage, `1d6+level` bleeding, saving-throw `1d10`). Pure sum; no DS tier logic. Powers `ds-roll` "just roll dice." |

### 1.6 What the engine does **not** decide (caller responsibilities)

- **Difficulty banding for tests** (easy/medium/hard → success/consequence/failure text,
  `draw-steel-agent-reference.md` §Tests). The engine returns the tier; the *view* maps tier +
  difficulty → outcome copy. `ds-roll` carries an optional `difficulty` for this display only.
- **The characteristic *value*.** Ability YAML says *which* characteristic (`roll: Power Roll
  + Reason`) but a hero's Reason score lives on the hero, not the ability. The engine takes a
  number; sourcing it (manual input, or injected by a bound D7 hero) is the roller UX's job (§3).
- **Consuming a crit** (granting the extra main action) — D8's initiative tracker.
- **Skill applicability** — whether a +2 skill bonus is legal is the player's call; the UI
  offers the toggle.

---

## 2. Roll engine API (the reusable service D7/D8 consume)

Two layers, cleanly split so the math is pure and the I/O is injectable:

- **`framework/roll/engine.ts`** — a **pure function** `resolveRoll(input, dice) → RollResult`.
  No Obsidian, no DOM, no randomness of its own (RNG is injected). This is the unit-tested core
  and what D7/D8 import when they just need to compute a result.
- **`framework/roll/service.ts`** — `RollService`, a thin plugin-scoped object that owns the
  **RNG source** (real `Math.random`-based `d10`, or the Dice-plugin bridge §6, or a seeded
  test RNG), performs a roll end-to-end, and records it into per-block session history (§7).
  Views reach it via `RenderContext.roll` (§2.4).

### 2.1 Types (`framework/roll/types.ts`)

```ts
export type RollMode = "power-roll" | "test" | "opposed" | "flat";
export type RollTier = 1 | 2 | 3;
export type Characteristic = "might" | "agility" | "reason" | "intuition" | "presence";

/** Deterministic, injectable dice source. `sides` defaults per-call; returns 1..sides. */
export interface DiceSource {
  /** One die. Real impl: 1 + Math.floor(rng() * sides). */
  rollDie(sides: number): number;
}

/** Fully-specified, already-numeric roll request. Pure — no strings to parse, no UI. */
export interface RollInput {
  mode: RollMode;                    // §1.5
  /** Characteristic score already resolved to a number (−5..+5). Omit ⇒ 0. */
  characteristic?: number;
  /** +2 when an applicable skill is used. Omit ⇒ 0. */
  skillBonus?: number;
  /** Any other flat modifiers (feature bonuses, situational +/−). Omit ⇒ 0. */
  flatBonus?: number;
  /** Raw counts; engine cancels & caps (§1.3). Omit ⇒ 0. */
  edges?: number;
  banes?: number;
  /** Enables the critical-hit flag in power-roll mode (§1.4). Default false. */
  isMainActionAbility?: boolean;
  /** For mode "flat": dice expression, e.g. { count: 1, sides: 6, bonus: level }.
   *  Ignored by tiered modes (they are always 2d10). */
  flat?: { count: number; sides: number; bonus?: number };
}

export interface RollResult {
  input: RollInput;                  // echoed for history/re-roll
  dice: number[];                    // individual faces rolled (e.g. [d1, d2])
  natural: number;                   // sum before modifiers (2d10 modes) / raw sum (flat)
  /** net edges after cancel, clamped to −2..+2 (−2/+2 = double). */
  net: number;
  /** flat modifier actually applied from edges/banes (±2 single, 0 when double or opposed±4). */
  edgeBaneFlat: number;
  total: number;                     // final number (all modes)
  tier?: RollTier;                   // present for power-roll & test; absent for opposed/flat
  tierShifted: 0 | 1 | -1;           // whether a double shifted the band (audit/animation)
  isNat: boolean;                    // natural 19–20 (2d10 modes only)
  isCritical: boolean;               // isNat && power-roll && main-action ability
  breakdown: string;                 // human string: "d10[8]+d10[13? ] …" for the result card
}
```

### 2.2 Pure resolver (`framework/roll/engine.ts`)

```ts
export function resolveRoll(input: RollInput, dice: DiceSource): RollResult;
```

Algorithm (normative; mirrors §1):

```
1. Roll dice.
   - tiered modes (power-roll/test/opposed): d1 = dice.rollDie(10); d2 = dice.rollDie(10);
     faces = [d1, d2]; natural = d1 + d2.
   - flat: faces = flat.count × rollDie(sides); natural = sum(faces).
2. net = clamp(edges − banes, −2, +2).
3. edgeBaneFlat:
     opposed  → net === +2 ? +4 : net === −2 ? −4 : 2*net   // ±4 on double, ±2 on single
     flat     → 0                                            // edges/banes ignored
     else     → |net| >= 2 ? 0 : 2*net                       // double = no flat; single = ±2
4. total = natural + (characteristic ?? 0) + (skillBonus ?? 0)
                    + (flatBonus ?? 0) + edgeBaneFlat + (flat.bonus ?? 0 for flat mode).
5. tier / tierShifted (power-roll & test only; opposed/flat leave tier undefined):
     base = total <= 11 ? 1 : total <= 16 ? 2 : 3
     shift = (net === +2) ? +1 : (net === −2) ? −1 : 0
     tier = clamp(base + shift, 1, 3);  tierShifted = tier - base
     if natural >= 19: tier = 3; tierShifted = 3 - base   // nat 19–20 overrides (§1.4)
6. isNat = (tiered mode) && natural >= 19.
7. isCritical = isNat && mode === "power-roll" && !!isMainActionAbility.
8. breakdown = renderBreakdown(...).  return RollResult.
```

Properties that make it testable (F3): deterministic given `dice`; total function (no throws
for in-range input; clamps out-of-range edge/bane counts); no wall-clock, no `Math.random`, no
DOM. The seeded `DiceSource` in tests replays exact face sequences (§8).

### 2.3 `RollService` (`framework/roll/service.ts`)

```ts
export interface RollService {
  /** The pure math, re-exported for callers who bring their own dice. */
  resolve(input: RollInput, dice?: DiceSource): RollResult;   // dice defaults to this.dice
  /** Roll now using the active dice source (native RNG or dice-bridge §6). */
  roll(input: RollInput): Promise<RollResult>;
  /** The active source. Swapped by the bridge/prefs; a seeded source is injected in tests. */
  dice: DiceSource;
  /** True when a Dice Roller-plugin delegate is active (§6); else DS-native. */
  readonly delegate: "native" | "dice-roller";
  /** Parse an ability/`ds-roll` `roll:` string into a partial RollInput (§2.5). */
  parseRollExpression(expr: string): ParsedRollExpression;
}
```

`roll()` is async because the dice-bridge (§6) may await the Dice Roller plugin's animated
roll; the native source resolves synchronously but is wrapped in a resolved promise for a
single call shape. `RollService` is constructed once in `main.ts onload` and disposed on
unload (nothing to clean beyond dropping references; history lives in `SessionStore`).

**D7/D8 usage contract:** import `resolveRoll` for pure computation, or take `cx.roll` for a
live roll that respects the user's dice-source preference and lands in session history. Neither
D7 nor D8 reimplements tiers/edges/crits — a regression there is a bug against this module's
tests.

### 2.4 Reaching the service from views

The engine is pure and importable anywhere, but *interactive* rolling (RNG source + history +
bridge) needs the singleton. Add one **additive** field to F1's `RenderContext`:

```ts
// framework/context.ts (F1 §3.2) — additive, non-breaking
readonly roll: RollService;   // seam, constructed by the pipeline per block like the others
```

This follows F1 §2.1 principle 5 (seams registered at load, consumed via `RenderContext`) and
does not rename any existing member, so it honors "do not rename without updating F1." **F1
coordination note:** add `roll` to the `RenderContext` interface and construct it in the
service bag alongside `ThemeService`/`PreferenceStore`/`ReferenceService`. (Filed as OD-1.)

### 2.5 Roll-expression parser

Ability YAML stores a free-text `roll:` string: `"Power Roll + Reason"`, `"2d10 + 3"`,
`"Might test"`, `"2d10 + 5"` (real examples from `draw-steel-elements/docs/Features.md`). The
parser is lenient and pure:

```ts
export interface ParsedRollExpression {
  mode: RollMode;                 // "test" if the word "test" present; else "power-roll"
  characteristic?: Characteristic;// matched keyword (Might/Agility/Reason/Intuition/Presence)
  flatBonus?: number;             // numeric "+ N" when no characteristic keyword
  dice?: { count: number; sides: number }; // explicit "NdM" if present; default 2d10
  raw: string;
}
```

Rules: case-insensitive keyword match for the five characteristics; `"Power Roll"` / `"2d10"`
both mean the standard 2d10; a trailing `"+ N"` with no keyword becomes `flatBonus`; presence
of `"test"` sets `mode: "test"`. Unparseable → `{ mode: "power-roll", raw }` (roller still
works with a manual characteristic input). The characteristic *keyword* tells the roller which
input to label/bind; it never supplies a value.

---

## 3. Power Roll roller UX (attaches to Feature elements)

### 3.1 Where it attaches

The roller is a **sub-controller layered onto the migrated Feature/Ability element**
(`src/elements/feature/`, F1 step 5). D5 owns a `FeatureRollController` that the feature view
instantiates in `onMount` when the feature has at least one **rollable effect** — an effect
carrying a `roll` string and/or any of `tier1`/`tier2`/`tier3`/`crit` (the SDK `Effect` fields,
`data-sdk-npm/src/model/Effect.ts`). Non-rollable features (pure traits, flavor-only effects)
get no roller and render exactly as today.

One controller manages **each rollable effect independently** (a feature can have several —
e.g. an ability with two separate power-roll effects). Each rollable effect block gets its own
roll affordance and its own result.

### 3.2 The affordance (progressive, non-destructive)

- The effect's tier area (rendered by the existing `EffectView` structure: `ds-pr-tier-line`
  rows) gains a **Roll button** in/near the `roll:` line — a real `<button class="ds-roll-btn">`
  with a die icon, `aria-label="Roll <ability name>"`.
- The whole tier group is **not** made click-to-roll by default (avoids fighting the reading-mode
  click shield and accidental rolls while reading). The button is the primary trigger; an
  opt-in pref (D4) `rollOnTierClick` can make the tier rows themselves clickable.
- Clicking Roll reveals the **Edge/Bane resolver bar** (§4) inline beneath the effect if it
  isn't already shown, *then* rolls with the current settings. (First click both reveals and
  rolls; the bar stays for adjust-and-reroll.) A pref can invert this to "reveal, then roll."

### 3.3 Resolving the characteristic value

The ability names the characteristic (`roll: Power Roll + Reason` → `Reason`); the roller needs
a number:

1. **Bound hero (D7):** if the feature element was rendered inside a hero context that injected
   a characteristic provider, the roller reads `Reason` from it and shows the value read-only
   with a "from hero" affordance. *(D5 defines the injection hook; D7 supplies the hero.)*
2. **Manual (default / standalone):** the resolver bar shows a small numeric stepper labelled
   with the characteristic name (`Reason −5..+5`), defaulting to the last value used **for this
   block** (from `SessionStore`, §7) or `0`. Keyboard: stepper is arrow-key + type-in.
3. **Flat-mod abilities** (`roll: 2d10 + 5`): no characteristic; the +5 is folded as `flatBonus`
   and no stepper is shown.

The injection hook (so D7 stays in its lane):

```ts
// framework/roll/binding.ts
export interface CharacteristicProvider {
  /** Score for a characteristic, or undefined if unknown (roller falls back to manual). */
  get(ch: Characteristic): number | undefined;
  /** Optional: is an applicable skill available for a default +2? */
  skillBonus?(): number | undefined;
}
```

The feature element exposes an optional `setCharacteristicProvider(p)` on its view; D7 calls it
when composing a hero sheet. Absent a provider, the manual path runs. D5 ships only the manual
path + the hook; D7 wires the provider.

### 3.4 Rolling and highlighting the tier

On roll:

1. Build `RollInput` from: parsed expression (mode, characteristic keyword, flat/dice), the
   resolved characteristic value, the resolver-bar edge/bane counts + skill toggle,
   `isMainActionAbility` (true when the feature's `usage` is a main action — derived from the
   Feature's `usage`/`ability_type`; maneuver/triggered ⇒ false, matching §1.4's crit rule).
2. `const result = await cx.roll.roll(input)`.
3. **Highlight the resolved tier row.** The matching `ds-pr-tier-{n}-line` (or `ds-pr-crit-line`
   when `isCritical`) gets `data-dse-roll-result="active"`; siblings get
   `data-dse-roll-result="dimmed"`. Styling is D3's (tokens under `[data-dse-element]`); D5 only
   sets the attributes — no inline styles (F1 §1.2 correctness debt). `aria-live` announces
   e.g. "Tier 2. Total 14."
4. **Render the result card** (§3.5) beneath the resolver bar.
5. A **Clear** control removes the highlight/attributes and card, returning the effect to its
   neutral rendering. Re-rolling replaces the previous result (history retains both, §7).

Nat 19–20 both forces the Tier 3 row active *and* (main-action ability) flags the crit line;
if the ability has a `crit:` effect line, that line is highlighted in addition to Tier 3.

### 3.5 Result card

A compact card (`framework/kit/roll-result-card.ts`, reused by `ds-roll`) showing:

- **Headline:** the tier (or "Opposed — 14", or the flat total) + a die glyph; crit gets a
  distinct treatment (label "Critical!" + the extra-main-action reminder text).
- **Breakdown:** `natural` dice faces, characteristic (+skill) added, edge/bane applied
  (showing "double edge → tier ↑" when a shift happened), and the final `total`. Built from
  `RollResult.breakdown` + fields; every number traceable.
- **Actions:** *Reroll* (same input), *Clear*, and *Pin* (§7). Keyboard-focusable buttons.
- Small, inline, below the effect — not a modal (modals are for editing, not results).

### 3.6 Keyboard & mobile

- All controls are real `<button>`/stepper elements: Tab-navigable, Enter/Space activate,
  `aria-pressed` on the edge/bane toggles, `aria-live="polite"` region announces the result.
- Touch: buttons meet a comfortable tap target; no hover-only affordances; the resolver bar is
  tap-to-toggle. Rolling never requires a right-click/long-press.
- Listeners via `this.registerDomEvent` (F1 §4.5); popout-safe timers via the view's `win`
  getter (F1 §3.3) for any result animation.

---

## 4. Edge/Bane resolver UX

A small reusable widget (`framework/kit/roll-bar.ts`) shared by the Power Roll roller and
`ds-roll`. It is the pre-roll modifier surface.

Controls (left→right):

- **Characteristic stepper** (only when the roll names a characteristic and no hero is bound):
  `−5..+5`, labelled with the characteristic name.
- **Skill toggle** — "Skill (+2)"; `aria-pressed`; adds `skillBonus: 2`.
- **Edge / Bane steppers** — two counters, each `0,1,2+`. The bar shows the **net effect live**:
  - net +1 → "Edge +2", net −1 → "Bane −2",
  - net +2 → "**Double edge** — tier ↑", net −2 → "**Double bane** — tier ↓",
  - net 0 with both > 0 → "Edges & banes cancel".
  This directly mirrors §1.3 so the user sees flat-vs-shift before rolling. In `opposed` mode
  the label instead reads "Double edge → +4" / "Double bane → −4" (§1.5).
- **Main-action toggle** (power-roll mode, advanced/optional): defaults from the ability's
  `usage`; lets a homebrew user assert crit eligibility. Hidden for tests/opposed/flat.
- **Roll button.**

Behavior:

- The bar holds **UI state only** (counts, toggles) — ephemeral/session, never written to the
  note (§7). Its values seed the next `RollInput`.
- Edge/bane counts are capped for display at `2+` (further clicks stay at "double", matching the
  engine's clamp). A one-tap **reset** clears modifiers.
- Emits a `RollInput` (minus the RNG) to whichever host invoked it (feature roller or `ds-roll`).
- The bar itself carries no DS math — it composes counts and defers to `resolveRoll`. This keeps
  the "core DS math, reused everywhere" (M1) in exactly one place.

---

## 5. `ds-roll` element

A standalone block for arbitrary DS rolls outside a full ability card — homebrew, GM notes,
quick tests, damage rolls. Built as a first-class F1 element.

### 5.1 Aliases

Canonical + shorthands, following the existing `ds-xx`/`ds-full` convention:

```
["ds-roll", "ds-r", "ds-power-roll"]
```

(`ds-roll` canonical; `ds-r` fast to type; `ds-power-roll` discoverable. Kept forever per F1
OD-6 alias hygiene.)

### 5.2 YAML schema

```yaml
# All fields optional; an empty `ds-roll` block rolls a bare 2d10 power roll.
name: "Fireball"            # optional label shown on the card
roll: "2d10 + Reason"       # free-text expression (parsed §2.5). Alternatively use the
                            # structured fields below; `roll` wins if both present.
mode: power-roll            # power-roll | test | opposed | flat  (default: power-roll)
characteristic: 3           # numeric score, OR a keyword ("Reason") to label a stepper.
                            #   number ⇒ used directly; keyword ⇒ manual stepper (no value).
skill: true                 # true ⇒ +2; or a skill name (display only) ⇒ +2
edges: 0                    # default modifier counts (user can still adjust in the bar)
banes: 0
bonus: 0                    # arbitrary flat modifier
difficulty: medium          # test mode only: easy|medium|hard → outcome banding text
main_action: false          # power-roll mode: mark crit-eligible (usage is a main action)
dice: "1d6+2"               # flat mode only: arbitrary dice (damage, saving throws, bleeding)
tiers:                      # optional inline outcome text to display & highlight on roll
  t1: "5 fire damage"
  t2: "9 fire damage"
  t3: "13 fire damage"
crit: "Target is burning (save ends)"   # optional crit outcome text
auto_roll: false            # if true, roll once on render; else show a Roll button first
```

The schema is authored as `src/elements/roll/schema.yaml` (AJV YAML-text, per F1 §5 / OD-4:
schema for every non-SDK element, hard-fail on invalid).

### 5.3 Behavior

- Renders a card: optional `name`, the resolved expression, the **Edge/Bane resolver bar** (§4),
  a **Roll** button, and (after rolling) the **result card** (§3.5). If `tiers`/`crit` text is
  supplied, those rows render and highlight exactly like the feature roller; if not, the card
  shows just the numeric result (great for `flat` damage rolls).
- `mode: flat` + `dice: "1d6+2"` → pure sum, no tiers (e.g. bleeding `1d6 + level`, saving
  throw `1d10` where `6+` ends — the view can annotate the `≥6` threshold as display text).
- `mode: opposed` → shows two roll slots ("You" / "Opponent") or a single roll with a
  compare-total affordance; both use `resolveRoll(opposed)` and the card reports the higher
  total. *(Minimal v1: single roll + total; two-sided compare is an OD.)*
- `auto_roll: true` rolls once on mount (convenience for notes); otherwise the block is inert
  until the user rolls (respects the reading-mode click shield — the Roll button opts through it).

### 5.4 ElementDefinition sketch

```ts
// src/elements/roll/definition.ts
export const rollElement: ElementDefinition<RollModel> = {
  id: "roll",
  name: "Roll",
  aliases: ["ds-roll", "ds-r", "ds-power-roll"],
  shape: "interactive",            // results are session/ephemeral (F1 §4.1); pin ⇒ §7 / OD-4
  schema: rollSchema,              // esbuild yaml-loader import of schema.yaml
  parse(data, _raw): RollModel {   // plain model; folds `roll` string via parseRollExpression
    return parseRollModel(data);
  },
  // no serialize by default (interactive). If pin-to-note ships (OD-4), add serialize + shape
  // becomes "persisted"; until then pinned results live in SessionStore.
  createView(cx) { return new RollView(cx); },
  autoResolveRefs: false,          // no @path/scc refs in a roll block
};
```

`RollView extends ElementView<RollModel>` (F1 §3.3): `onMount` builds the card + resolver bar,
wires the Roll button via `registerDomEvent`, calls `cx.roll.roll(input)`, renders the result
card, writes last-used modifiers + history to `cx.session` (§7). No `container.empty()` rebuild
on roll — the result card is a targeted DOM update (F1 §2.1 principle 4).

---

## 6. Dice-plugin bridge (feature-detected, optional)

**Stance:** the DS-native roller is the default and the only thing that must exist. The bridge
is a *delegation of the RNG* to the community **Dice Roller** plugin when the user has it
installed and enabled and opts in — so its dice graphics/settings apply — while **DSE always
keeps ownership of tier/crit/edge-bane resolution**. No hard dependency, no bundled import, no
`package.json` entry: everything is behind runtime feature detection.

### 6.1 Detection

```ts
// framework/roll/dice-bridge.ts  (no import of the other plugin; all access is dynamic)
export function detectDiceRoller(app: App): DiceSource | null {
  const id = "obsidian-dice-roller";                 // community plugin id
  const plugins = (app as any).plugins;
  if (!plugins?.enabledPlugins?.has(id)) return null;
  const api = plugins.plugins?.[id]?.api;            // Dice Roller exposes an `api`
  if (!api || typeof api.roll !== "function") return null;
  return new DiceRollerBridgeSource(api);
}
```

- Detection is **capability-based** (checks the method exists), not version-based, so a future
  API shift degrades to `null` (→ native) instead of throwing.
- Wrapped in try/catch; any failure ⇒ `null` ⇒ native source. The bridge can never break rolling.

### 6.2 What the bridge delegates

- **Only the raw dice** (`rollDie(10)` ×2, or the `flat` dice expression) are asked of the Dice
  Roller API; DSE feeds the resulting faces into `resolveRoll`. This preserves DS math exactly
  while letting Dice Roller render its 3D/inline dice and honor the user's dice settings.
- If the API only returns a *total* (not individual faces), the bridge requests two separate
  `1d10` rolls so `natural` and nat-19–20 detection stay correct.

### 6.3 Selection & prefs

- `RollService.dice` defaults to the native source. On load (and on Dice Roller enable/disable
  events, if observable) the service re-runs detection.
- A **preference** (D4) `diceSource: "native" | "dice-roller"` gates whether a detected bridge
  is actually used; default `native`. `RollService.delegate` reflects the live choice; the
  result card can show a subtle "rolled with Dice Roller" marker.
- **No behavioral coupling:** if Dice Roller is uninstalled mid-session, the next `roll()`
  falls back to native transparently.

This is written up as an **optional integration** (OD-3): the target plugin id and API surface
should be confirmed against the current Dice Roller release at implementation time.

---

## 7. State (session vs pinned results)

Mapped onto F1's three tiers (F1 §4.1):

| Datum | Tier | Where | Survives re-render | Survives reload |
|---|---|---|---|---|
| In-flight resolver-bar counts/toggles, characteristic-in-progress | **Ephemeral** | view instance | no | no |
| Last-used modifiers per block (char value, last edge/bane) | **Session** | `SessionStore[blockKey]["roll.lastInput"]` | best-effort | no |
| Roll history (recent results per block) | **Session** | `SessionStore[blockKey]["roll.history"]` | best-effort | no |
| **Pinned** result | **Document** (opt-in) | block YAML (or note), see OD-4 | yes | yes |

- **Default: results are session/ephemeral** (F1 §4: roll results are not persisted unless the
  user pins them). Rolling never mutates the note; it never triggers a `Vault.process` write.
  This keeps rolling cheap, git-quiet, and free of the echo-rebuild cycle that persisted
  elements incur.
- **History**: `RollService.roll()` appends each `RollResult` to `SessionStore` keyed by
  `host.blockKey()` (F1 §4.3), capped (e.g. last 10). The result card can expose a small history
  popover ("last rolls"). Because `SessionStore` is a plugin-scoped `Map` cleared on unload,
  history is per-session only — matching player expectations for dice.
- **Pinning** (the "unless the user pins them" path): the result card's **Pin** action promotes
  a single result to persistence so it survives reload/sync (e.g. a GM records a decisive roll
  in the note). Two options in OD-4; default is **session-pin** (a `pinned` slot in
  `SessionStore`, no note write) to keep D5 free of the persisted write path, with **note-pin**
  (serialize the pinned result into the block YAML, making `ds-roll` `shape: "persisted"`) as
  the follow-on if users want durable records.
- **`SessionStore` key drift** is documented best-effort (F1 §4.3): moving a block loses its
  history/last-input. Acceptable for dice; never used for anything a user would mourn.

---

## 8. Test plan (engine matrix)

The engine is pure ⇒ table-driven Jest unit tests with a **seeded `DiceSource`** that replays
exact faces. This is the first real test suite the repo grows (F1 §6 notes Jest is configured,
zero tests). No DOM needed for engine tests; the roller/`ds-roll` get golden-render snapshots
(the F1 per-element harness).

### 8.1 Core tier bands (power-roll, no modifiers)

| dice | natural | +char | total | expect tier | isNat | crit |
|---|---|---|---|---|---|---|
| [1,1] | 2 | 0 | 2 | 1 | no | no |
| [5,6] | 11 | 0 | 11 | 1 (boundary) | no | no |
| [5,6] | 11 | +1 | 12 | 2 (boundary) | no | no |
| [8,8] | 16 | 0 | 16 | 2 (boundary) | no | no |
| [8,9] | 17 | 0 | 17 | 3 (boundary) | no | no |
| [9,10] | 19 | 0 | 19 | 3 | **yes** | no (not main-action) |
| [9,10] | 19 | 0 | 19 | 3 | yes | **yes** (main-action ability) |
| [10,10] | 20 | −5 | 15 | **3** (nat overrides band) | yes | yes (main-action) |

The last row is the key nat-19–20 assertion: total 15 would be Tier 2, but nat 20 forces Tier 3.

### 8.2 Edge/bane (single = flat, double = shift, cancel)

| char | edges | banes | dice | natural | net | flat | total | tier | note |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 0 | [5,6] | 11 | +1 | +2 | 13 | 2 | single edge = +2 |
| 0 | 0 | 1 | [5,6] | 11 | −1 | −2 | 9 | 1 | single bane = −2 |
| 0 | 2 | 0 | [5,6] | 11 | +2 | 0 | 11 | **2** | double edge: no flat, band(1)→shift→2 |
| 0 | 0 | 2 | [8,8] | 16 | −2 | 0 | 16 | **1** | double bane: band(2)→shift→1 |
| 0 | 3 | 1 | [5,6] | 11 | +2 (cap) | 0 | 11 | 2 | 3 edges −1 bane = net +2 (double) |
| 0 | 2 | 2 | [5,6] | 11 | 0 | 0 | 11 | 1 | full cancel |
| 0 | 1 | 2 | [8,9] | 17 | −1 | −2 | 15 | 2 | net −1 single bane; not a shift |
| 0 | 2 | 0 | [10,9] | 19 | +2 | 0 | 19 | 3 | double edge on nat19: stays 3 (clamp) |
| 0 | 0 | 2 | [10,10] | 20 | −2 | 0 | 20 | **3** | double bane on nat20: nat overrides → 3 |

### 8.3 Modes

- **test:** same bands as power-roll; `isCritical` always false; `isNat` true on 19–20; a
  nat-19–20 test row asserts `isNat` for reward rendering.
- **opposed:** `tier` undefined; single edge/bane ±2, **double ±4** (assert net+2 ⇒
  `edgeBaneFlat === +4`); higher `total` comparison tested at the view layer.
- **flat:** `dice: 1d6+2` sums faces + bonus; edges/banes ignored (`edgeBaneFlat === 0`); no
  tier, no crit; e.g. seeded `[4]` ⇒ total 6.

### 8.4 Parser

- `"Power Roll + Reason"` → `{ mode: "power-roll", characteristic: "reason" }`
- `"2d10 + 5"` → `{ mode: "power-roll", flatBonus: 5, dice: {2,10} }`
- `"Might test"` → `{ mode: "test", characteristic: "might" }`
- `"1d6 + 3"` (in `dice:` field) → `{ dice: {1,6}, bonus: 3 }`
- garbage → `{ mode: "power-roll", raw }` (no throw)

### 8.5 Property / fuzz

- For random `d1,d2 ∈ 1..10`, `char ∈ −5..5`, `edges,banes ∈ 0..3`: assert `tier ∈ {1,2,3}`,
  `tier` monotonic in `total` within a fixed net, nat-19–20 ⇒ `tier === 3`, and `resolveRoll`
  never throws.

### 8.6 View/integration (snapshot + jsdom)

- Feature roller: rollable-effect detection (has tier/roll ⇒ roller; trait ⇒ none); tier-row
  `data-dse-roll-result` attribute flips to the seeded tier; crit line highlights on nat-main-
  action; Clear resets attributes.
- `ds-roll`: schema-invalid block → F1 error card; `auto_roll` rolls on mount; `flat` shows a
  number-only card; history entry appended to a stubbed `SessionStore`.
- Dice-bridge: with a stub `app.plugins` exposing/omitting the api, `detectDiceRoller` returns a
  source/`null`; a throwing api ⇒ `null` (native fallback).

---

## 9. Open Decisions — needs Scott

- **OD-1 — `RollService` on `RenderContext`.** D5 adds `readonly roll: RollService` to F1's
  `RenderContext` (additive seam, §2.4). *Recommendation:* **yes** — it matches F1's seam
  pattern and keeps views decoupled from the plugin; coordinate the one-line F1 interface add.
  Alternative: pure-engine-only, views reach the singleton via `cx.plugin` cast (rejected —
  the coupling F1 warns against).
- **OD-2 — Characteristic sourcing for the standalone roller.** Manual stepper (default, D5-only)
  vs. requiring a hero binding. *Recommendation:* **manual by default**, with the
  `CharacteristicProvider` hook (§3.3) that D7 fills — so `ds-feature`/`ds-roll` are useful
  immediately and get richer under D7. No blocking dependency on D7.
- **OD-3 — Dice Roller bridge target.** Confirm the community plugin id (`obsidian-dice-roller`)
  and API surface (`api.roll` / face access) against the current release; decide whether to also
  support other dice plugins. *Recommendation:* ship native-only first, land the bridge behind
  the `diceSource` pref as a **P3 optional** integration (M1 priority), feature-detected, never a
  dependency. Off by default.
- **OD-4 — Pinned-result persistence.** Session-pin (in-memory, default; keeps `ds-roll`
  `interactive`, no note writes) vs. note-pin (serialize into block YAML → `ds-roll` becomes
  `persisted`, survives reload/sync). *Recommendation:* **session-pin for v1**; add note-pin as a
  follow-up if GMs want durable records (it reuses F1's persisted write path cleanly).
- **OD-5 — Roll-on-tier-click vs button-only.** Whole tier group clickable (fast, but risks
  accidental rolls while reading and interacts with the click shield) vs. an explicit Roll
  button. *Recommendation:* **button by default**, `rollOnTierClick` as a D4 pref (off).
- **OD-6 — `main_action` / crit eligibility inference.** Infer from the Feature's `usage`
  ("Main action" ⇒ crit-eligible; maneuver/triggered ⇒ not, per §1.4) vs. always require the
  author/user to assert it. *Recommendation:* **infer from `usage`**, expose an override toggle
  in the resolver bar for homebrew edge cases.
- **OD-7 — Opposed roll UX in `ds-roll`.** Single roll + total (minimal) vs. built-in two-sided
  "you vs. opponent" compare. *Recommendation:* **single-roll v1**; two-sided compare is a small
  follow-up once the marquee power-roll flow ships.
- **OD-8 — Reroll semantics & history cap.** Does *Reroll* replace or stack in history, and how
  many entries per block? *Recommendation:* reroll **appends** (both visible in history) but the
  card shows the latest; cap history at 10 per `blockKey`.

---

*Cross-references: F1 §3 (`ElementView`, `RenderContext`, `BlockHost`, `SessionStore`),
F1 §4 (state tiers), F1 §6 step 5 (Feature migration this layers on); DS math from
`reference/draw-steel-overview.md`, `reference/draw-steel-agent-reference.md`, and the book
source `steel-etl/input/heroes/Draw Steel Heroes.md` (natural-19–20 / critical-hit rule text);
SDK `Effect`/`Feature` fields from `data-sdk-npm/src/model/{Effect,Feature}.ts`; today's tier
rendering in `draw-steel-elements/src/drawSteelAdmonition/Features/EffectView.ts`.*
