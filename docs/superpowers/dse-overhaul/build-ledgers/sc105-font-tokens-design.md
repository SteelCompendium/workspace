# SC-105 — six-slot font token vocabulary design + slab brief (recon 2026-08-02)

# SC-105 Design: Six-Slot Font Token Vocabulary + OFL Slab Decision Brief

## Summary (5 lines)
The plugin today drives titles, body prose, card body, and label text through one token (`--dse-font-display`), which is why they're already pixel-identical — this makes introducing six independent slots ("title", "body", "card-body", "label", "controls", "mono") a genuinely safe no-op if Card-body/Label are wired as `var()` chains to Body/Title rather than duplicated literals. The work splits cleanly into three tasks: (1) add 5 tokens + guard/map coverage with zero consumers touched (pure no-op by construction), (2) re-point all 7 `--dse-font-display` consumers plus the stepper exclusion to their classified slot, retiring `--dse-font-display` from the union entirely, and (3) docs. The one live landmine is Controls: buttons/tabs/collapse-headers/`.dse-pr__row` currently use `font: inherit` and silently render **serif** under Steel (inherited from the Card-body/Body routing) — Scott's ruling says Controls should default to sans, but actually wiring that now would move real pixels and break the freeze, so SC-105 must NOT re-point them; that's SC-112's call. Source Serif 4 ships only 600/700 weights (~32KB woff2 each, base64-embedded, no 400) — swapping the default face later is one theme-block value change plus a bundle addition once the vocabulary exists.

**The var()-chaining risk is not real: token-coverage.test.ts's guard is a raw-text presence/equality check on whatever string follows `--dse-<name>:`, and it already treats existing tokens (e.g. `--dse-surface: var(--code-background)`) as ordinary values, so `--dse-font-card-body: var(--dse-font-body);` is accepted identically in the Legacy fidelity map, the Steel presence check, and the Print presence check — no new mechanism is needed, only updating the hardcoded counts/dictionaries.**

## Slab options table

| Option | What it costs | Visual effect |
|---|---|---|
| **A. Stay Source Serif 4 as-is** | Zero — no bundle change, no CSS change. | Body reads at 600-weight serif (semibold) mapped up from the site's actual ≈400 body weight — slightly heavier than the source site everywhere Card-body/Body are used. |
| **B. Add 400 weight of Source Serif 4** | +1 `@font-face` block, ≈30KB woff2 (approx., unverified) base64-embedded (~+40KB to the shipped CSS string), one line: `--dse-font-body`'s Steel value gains a `font-weight: 400` companion face or the body-consuming rules add `font-weight: 400`. Same OFL license file already on hand. | Body reads lighter/closer to the real site weight; Title/Label stay 600/700 (unchanged) — a single, low-risk incremental fidelity fix, decoupled from the token work itself. |
| **C. Bundle an OFL slab as the new default face (e.g. Zilla Slab or Bitter)** | New `@font-face` set: 400/600/700 weights × 1 family, Latin-subset woff2 ≈15–30KB **each** (approximate, no network access — flag for verification via a subsetting tool before committing bytes), so ≈45–90KB total added to `styles-source.css`; OFL.txt swap under `assets/fonts/`; **one theme-block value change** once the 6-slot vocabulary exists (`--dse-font-title`/`--dse-font-body`'s Steel value literal swaps to the new family, Card-body/Label ride the chain for free). | A different serif identity plugin-wide (titles + body + card-body + label all shift, since they chain/mirror by default) — a taste call, not a technical one, and reversible in one line once the tokens exist. |

Recommendation ordering is Scott's call; A is free, B is the cheapest real fidelity win, C is the only one that needs a swatch/taste review before committing bytes.

---

## 1. Inventory of current font plumbing

**`src/framework/tokens.ts`** — `DSE_TOKEN_NAMES` currently has **69** entries (not the stale "64" the doc comments still cite; Plan 20 added 5 material tokens on top of the original 64). Only two font tokens exist today: `font-display`, `font-mono`.

**`test/dom/framework/token-coverage.test.ts`** parsing mechanics (load-bearing for the design):
- `defsIn(body)` — regex `(?:^|[\s{;])--dse-([a-z0-9-]+)\s*:` — matches **presence of a definition** inside a block; it does not care what the value is, so a `var()` chain is invisible to it as anything other than "present."
- `valueIn(body, name)` — regex `--dse-${name}\s*:\s*([^;]+);` — captures the **literal value text** verbatim (including a `var()` chain if that's what's written), used only for the Legacy fidelity check against the hardcoded `LEGACY_MAP` dictionary.
- Guard blocks scanned: the concatenated `:root {}` bodies (Legacy base), `:is([data-dse-element], .dse-modal)[data-dse-theme="steel"]` (Steel dark), `.theme-light :is(...)[data-dse-theme="steel"]` (Steel light, only asserted where it differs), `[data-dse-element][data-dse-print="on"]` + the Steel print twin (Print).
- Hardcoded literal assertions that must be bumped: `expect(overridden.length).toBe(63)` (Steel), `expect(STEEL_INVARIANT.size).toBe(6)`, `expect(overridden.length).toBe(52)` (Print), `expect(PRINT_INVARIANT.size).toBe(17)`, and the `LEGACY_MAP` dictionary itself.
- **`test/dom/kit/tokens.test.ts:72`**: `expect(DSE_TOKEN_NAMES.length).toBe(69)` — a second hardcoded union-size pin, separate file.

**`docs/superpowers/dse-overhaul/D3-token-map.md`** row format: `| `--dse-<name>` | D3-spec concept | Legacy (verbatim) | Steel (dark) | Steel light | Print |`, one row per token, first-column-only matched by `token-coverage.test.ts`'s `mapTokenRows()`. Blank Steel-light/Print cells mean "same value, relies on CSS cascade" (confirmed: the Steel-light block at `styles-source.css:4522` does not redeclare `--dse-font-display`, and it still resolves via cascade because the dark block's selector isn't scoped away from light).

**`styles-source.css` font consumers** (grep-exhaustive):
- `--dse-font-display` definitions: base `:root` (`:2984`, `= var(--font-text)`), Steel dark (`:3140`, `= "Source Serif 4", var(--font-text)`) — Steel light and Print do not redefine it (cascade-inherited).
- `font-family: var(--dse-font-display)` consumers: **exactly 7** (`grep -c` confirmed), at lines 3404, 3442, 3572, 3729, 4300, 4319, 4464.
- `var(--dse-font-mono)` consumer: **1** (`:5014`, `.dse-rollcard__breakdown`).
- `font: inherit` (the "unscoped kit convention" — inherits whatever ambient font-family the container set): **5 sites** — `.dse-btn` (4603), `.dse-stepper__input` (4672), `.dse-collapse__header` (4735), `.dse-tabs__tab` (4774), `button.dse-pr__row` (4950).
- `font-variant: small-caps` (the Label-shaped small text): **8 sites** — `.dse-head__eyebrow--chip`/`--line` (chips/eyebrows), `.dse-section__title` (×3 occurrences: general section head 3691, featureblock head-strip reuse 3876, spend-section variant 4018), `.dse-sb__item-l`, `.dse-sb__kv-l` (statgrid field labels), and the roster table header row (~4474) — **none of these carry an explicit `font-family` rule today**; they all ride the Card-body/Body ambient by inheritance.
- Stepper exclusion: `.dse-stepper__input`, `.dse-stepper__value` explicitly reset to `font-family: var(--font-text)` at `:3514-3516` (Steel-scoped, screen-only) — this is the existing, deliberate "Controls stays sans" carve-out the mission asks to re-point.

### Classification table

**A. Explicit `font-family` rules today (7 `--dse-font-display` consumers + 1 stepper override + 1 mono)**

| Rule (selector) | Line | What it is | Slot | Notes |
|---|---|---|---|---|
| `.dse-head__primary--left` | 3404 | Card-head left title (feature/statblock/featureblock/etc.) | **Title** | canonical title |
| `[data-dse-theme='steel']…[data-dse-element]:not(error-stage), .dse-sb, .dse-card` | 3442 | The Plan-22 element-root body routing | **split**: card selectors (`.dse-sb`, `.dse-card`) → **Card-body**; bare `[data-dse-element]` roots → **Body** (see blast-radius split below) |
| `:is(.dse-sb, .dse-fb) > .dse-head > .dse-head__primary--chip` ("mini" role slot) | 3572 | Statblock/featureblock card-head right-primary (role-tinted name) | **Title** | it's a card head per Scott's "element titles, card heads" ruling, despite living in the "chip" selector family |
| `.dse-card__title` | 3729 | D6 generic reference-card title (kit/condition/treasure/…) | **Title** | |
| `.dse-hero__name` | 4300 | Hero-sheet flagship title | **Title** | |
| `.dse-hero__region-title` | 4319 | Hero-sheet region/panel header band | **Label** (recommended) | **Ambiguous — see below** |
| `h3–h6` for plugin-only families + `.dse-modal__title` | 4464 | Generic headings inside encounter/negotiation/montage/initiative/project/party/counter, and modal titles | **Title** | |
| `.dse-stepper__input`, `.dse-stepper__value` | 3516 | Numeric stepper controls | **Controls** | already sans today; pure rename to the new token |
| `.dse-rollcard__breakdown` | 5014 | Dice-notation breakdown | **Mono** (unchanged) | |

**Ambiguity — `.dse-hero__region-title` (Title vs. Label):** it functions as a section/panel header (uppercase, embossed, boxed strip) but shares the exact uppercase+bold+0.01em-tracking treatment of the primary titles rather than the small-caps treatment every other "section head" gets. Per Scott's ruling ("Label governs ... section heads"), I recommend classifying it **Label**. Because Label's default is "same as Title," this classification has **zero pixel effect either way** today — it only matters once SC-112 lets Title and Label diverge. Flagging the missing `font-variant: small-caps` as a separate, out-of-scope stylistic inconsistency (not something SC-105 should touch).

**B. Inherited (no explicit `font-family` rule) — the real ambiguity set the mission calls out**

These render correctly today purely because Card-body/Body/Label/Title all resolve to the same value. Once SC-112 lets a user diverge Body from Label, every one of these needs to *graduate* to an explicit `font-family: var(--dse-font-label)` pin or it will silently follow whatever the user set Body/Card-body to instead:

| Element | Slot (recommended) | Rationale |
|---|---|---|
| `.dse-head__eyebrow--chip`, `.dse-head__eyebrow--line` (eyebrows/chips) | **Label** | Scott's ruling: "chips/eyebrows... = Label" |
| `.dse-section__title` (×3), the featureblock head-strip reuse, `.dse-section--spend .dse-section__title` | **Label** | "static small-caps ... section heads" |
| `.dse-sb__item-l`, `.dse-sb__kv-l` (statgrid field labels) | **Label** | small-caps table/field labels |
| Roster table header row (~4474) | **Label** | "table headers" |
| `.dse-pr__head` (power-roll head strip) | **Label** | section-head-shaped chrome; currently unstyled font-wise |
| Power-roll tier badge text (`.dse-tier-*`) | **Label** | small, meaning-bearing chrome; matches EV/cost chip treatment |
| EV/cost chip (`.dse-head__deck--chip`, the "EV n / n" value) | **Label** | Scott's 2026-08-02 consistency ruling explicitly folded this into the uniform chip (Label) treatment, removing the numeric-content carve-out |
| `.dse-btn`, `button.dse-pr__row` | **Controls** (inherits Body/Card-body today) | interactive per ruling — **see decision below**, do not re-point in SC-105 |
| `.dse-tabs__tab` | **Controls** (inherits Body/Card-body today) | interactive — same deferral |
| `.dse-collapse__header` | **Controls** (inherits Body/Card-body today) | interactive — same deferral |

**The Controls decision (mission's core ambiguity):** today `.dse-btn`/`.dse-tabs__tab`/`.dse-collapse__header`/`button.dse-pr__row` use `font: inherit`, sitting inside Steel element/card roots that set `font-family: var(--dse-font-display)` — so **they already render serif under Steel today**, an unintentional side-effect of the Plan-22 broadening that "nobody objected to." Scott's slot-model ruling says Controls should default to the ambient sans (`var(--font-text)`). Two options:

- **Option 1 (recommended for SC-105): leave them on ambient inheritance.** They keep `font: inherit`, not repointed to `--dse-font-controls`. Consequence: zero pixel change, freeze/parity stay green, but the shipped vocabulary has an inconsistency where "Controls" is *defined* as sans but three of its five consumers don't actually consume the token yet. Defer the de-serifing to SC-112, which is exactly the kind of deliberate visual call ("do we want buttons/tabs sans now") that belongs in that ticket's brainstorm, not smuggled into a no-op token-plumbing change.
- **Option 2: re-point them to `--dse-font-controls` now.** Consequence: buttons/tabs/collapse-headers **visibly de-serif** under Steel — a real, deliberate pixel change that would need its own freeze-baseline regeneration and is exactly the kind of change SC-105's "visual NO-OP" constraint forbids. Only the stepper (already explicitly sans) is safe to re-point in SC-105.

Recommendation: **Option 1** for SC-105 — only the stepper re-points to `--dse-font-controls`; buttons/tabs/collapse-headers/`.dse-pr__row` stay on `font: inherit` (Body/Card-body inheritance) until SC-112 makes the deliberate call.

### Blast radius (rule count per slot after re-pointing)

| Slot | Rule count | Elements/selectors |
|---|---|---|
| Title | 6 explicit rules | `.dse-head__primary--left`, mini role slot, `.dse-card__title`, `.dse-hero__name`, `.dse-hero__region-title` (if reclassified Title instead), h3–h6 + `.dse-modal__title` |
| Body | 1 rule (17 element roots) | encounter, characteristics, horizontal-rule, skills, resource, counter, initiative, values-row, tokens, montage, project, party, conditions, stamina-bar, hero, surges, roll, negotiation |
| Card-body | 1 rule (4 host classes) | `.dse-sb` (statblock), `[data-dse-element='feature']`/`.dse-feature`, `[data-dse-element='featureblock']`/`.dse-fb`, `.dse-card` (11 D6 display-family elements: kit, condition, treasure, ancestry, culture, career, class, title, perk, complication, rule) |
| Label | 0 explicit today, ~9 candidates for future explicit pins | eyebrows/chips, section titles (×3), statgrid labels (×2), roster header, pr-head, tier badges |
| Controls | 1 rule re-pointed (stepper only); 4 left on inheritance | `.dse-stepper__input`/`__value` → `--dse-font-controls`; `.dse-btn`, `.dse-tabs__tab`, `.dse-collapse__header`, `button.dse-pr__row` deferred |
| Mono | 1 rule, unchanged | `.dse-rollcard__breakdown` |

---

## 2. Token introduction as a visual no-op

**Token names** (added to `DSE_TOKEN_NAMES`, `--dse-` prefix implicit): `font-title`, `font-body`, `font-card-body`, `font-label`, `font-controls`. `font-mono` unchanged.

**Fate of `--dse-font-display`: retire with a migration, staged across Tasks 1→2, not aliased indefinitely.**
- **Task 1** adds the 5 new tokens with full Legacy/Steel/Print coverage but touches **zero consumers** — `--dse-font-display` stays exactly as-is (still defined, still consumed by its 7 rules). This makes Task 1 trivially a no-op: nothing that renders today references any of the 5 new names yet.
- **Task 2** re-points every consumer (the 7 CSS rules + the stepper exclusion) to its classified slot token, then removes `--dse-font-display` from `DSE_TOKEN_NAMES`, the D3 map, `LEGACY_MAP`, and the theme tests — in the *same* task, since that's the task that changes what the name means to the codebase; leaving a zombie alias around after nothing consumes it would just be confusing. (If Scott wants an extra safety margin given "many consumers," the alternative is to keep `--dse-font-display: var(--dse-font-title)` defined-but-unconsumed for one more release before deleting it — flagging this as the conservative fallback, not the default recommendation.)

**Independent vs. chained defaults — the one design decision that matters most for SC-112:**
- `--dse-font-title`, `--dse-font-body`, `--dse-font-controls`, `--dse-font-mono` get **independent literal values** per theme block (they happen to be equal today, but must never `var()`-chain to each other — SC-112 needs to move Title without dragging Body, and vice versa).
- `--dse-font-card-body` and `--dse-font-label` get **`var()`-chained defaults**, exactly matching Scott's "same as Body"/"same as Title" rulings — this is what lets SC-112 offer just 3 user-facing controls (Title/Body/Controls) while Card-body/Label track Body/Title automatically unless a user later drills into an "advanced" override.

**Values, expressed as the three theme blocks:**

| Token | Legacy (`:root`) | Steel dark | Steel light / Print |
|---|---|---|---|
| `--dse-font-title` | `var(--font-text)` | `"Source Serif 4", var(--font-text)` | blank/no override (cascade-inherited); Print = active theme, no override |
| `--dse-font-body` | `var(--font-text)` | `"Source Serif 4", var(--font-text)` | same as above |
| `--dse-font-card-body` | `var(--dse-font-body)` | `var(--dse-font-body)` | no override (chain resolves through whatever Body resolved to) |
| `--dse-font-label` | `var(--dse-font-title)` | `var(--dse-font-title)` | no override |
| `--dse-font-controls` | `var(--font-text)` | `var(--font-text)` | no override — invariant across all 3, join `STEEL_INVARIANT`/`PRINT_INVARIANT` alongside `font-mono` |
| `--dse-font-mono` | unchanged | unchanged | unchanged |

This exactly reproduces `--dse-font-display`'s current per-theme resolution for every slot, so re-pointing any consumer in Task 2 is byte-identical by construction.

**Guard tolerance confirmed (see the bolded risk line above)** — `defsIn`'s regex requires a definition to be followed immediately by `:` (with optional whitespace), so `var(--dse-font-body)` appearing *inside* another token's value (preceded by `(`, followed by `)`) can never be mistaken for a definition of `font-body` itself. No parsing-logic changes are needed to support chained defaults — only the hardcoded counts and dictionaries.

**Worked guard numbers** (for whoever implements Task 1/2 — internally consistent, computed from the current baseline):

| Checkpoint | Union size | Steel overridden / invariant | Print overridden / invariant |
|---|---|---|---|
| Today | 69 | 63 / 6 | 52 / 17 |
| After Task 1 (+5 new tokens, `font-display` untouched) | 74 | 67 / 7 *(+4 title/body/card-body/label overridden, +1 controls invariant)* | 52 / 22 *(+5 all new tokens print-invariant)* |
| After Task 2 (`font-display` retired) | 73 | 66 / 7 | 52 / 21 |

`tokens.test.ts`'s `expect(DSE_TOKEN_NAMES.length).toBe(69)` → `74` after Task 1, `73` after Task 2. Same for `token-coverage.test.ts`'s four `.toBe(...)` literals and the `LEGACY_MAP` dictionary (add 5 keys in Task 1, remove `font-display` in Task 2).

---

## 3. Re-pointing plan

Per-rule slot assignment is the classification table above. The one structural nuance: **splitting the Task-1-era broad body-routing rule (`:3439-3444`) by mutual exclusion, not cascade override**, to avoid a CSS-specificity race between the card selectors (`.dse-sb`, `.dse-card`) and the generic `[data-dse-element]` attribute-presence selector (which today have *different* specificities that happen not to matter because their values are identical). Recommended shape:

```css
/* Body: every element root EXCEPT the card-shaped ones */
[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element]:not([data-dse-error-stage])
  :not(.dse-sb):not(.dse-card):not([data-dse-element='feature']):not([data-dse-element='featureblock']) { ... }
  /* or equivalently, keep the broad rule and let the more specific card rule below win by
     construction (values will match under the default chain regardless of which one wins,
     so this is a correctness nice-to-have for SC-112, not a pixel requirement for SC-105) */

[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-sb, .dse-card, [data-dse-element='feature'], [data-dse-element='featureblock']) {
  font-family: var(--dse-font-card-body);
  color: var(--dse-fg);
}
```
Because Body's and Card-body's default values are identical (`var(--dse-font-card-body)` chains to `var(--dse-font-body)`, and both equal `"Source Serif 4", var(--font-text)` under Steel today), **correctness of the split does not depend on winning any specificity race** — either selector "winning" the cascade renders the same pixel today. Getting the split textually right matters only for SC-112, at which point the CSS specificity should be re-verified explicitly (documented as a known, deferred implementation nuance rather than a Task-2 blocker).

---

## 4. Test/guard updates

- **`src/framework/tokens.ts`**: add 5 names (Task 1), remove `font-display` (Task 2).
- **`test/dom/kit/tokens.test.ts`**: bump `DSE_TOKEN_NAMES.length` (69→74→73); replace `rootValue('font-display')` assertion with `rootValue('font-title')`/`'font-body'`/`'font-card-body'`/`'font-label'`/`'font-controls'`.
- **`test/dom/framework/token-coverage.test.ts`**: add 5 keys to `LEGACY_MAP` (Task 1), remove `font-display` (Task 2); update `STEEL_INVARIANT` (+`font-controls`), `PRINT_INVARIANT` (+4 new title/body/card-body/label, -`font-display`, net +5 then -1); bump the 4 hardcoded `.toBe(...)` counts per the worked table above.
- **`test/dom/framework/theme-steel.test.ts`** (`:95,171,179,339-340`) and **`test/dom/framework/theme-print.test.ts`** (`:136`): each has a literal `'font-display'` entry pinning its Steel/Legacy/print value — replace with 5 entries mirroring the new tokens' values (Task 2, since these assert what actually renders, i.e. post-re-point state).
- **`test/dom/theme/steelTypography.test.ts`**: this file's whole framing comment ("there is deliberately no `--dse-font-body` token... C6") is now **stale** and must be rewritten to describe the real tokens. `BODY_FONT_HOST`'s assertion (`font-family: var(--dse-font-display)`) splits into two: a Card-body assertion (`.dse-sb`/`.dse-card`/feature/featureblock → `var(--dse-font-card-body)`) and a Body assertion (the remaining bare `[data-dse-element]` roots → `var(--dse-font-body)`). The `ELEMENT_ROOT_SELECTOR` contract test (guards against re-narrowing to an allow-list) should be duplicated for whichever selector ends up carrying the Body rule after the split.
- **New contract** (either extend `steelTypography.test.ts` or a new `test/dom/theme/steelFontSlots.test.ts`): assert the **chain shape** directly against the raw CSS text — e.g. `--dse-font-card-body: var(--dse-font-body);` appears in both the Legacy `:root` and the Steel block, and `--dse-font-label: var(--dse-font-title);` likewise — so a future edit that accidentally hardcodes Card-body/Label to a literal (breaking the "same as X" contract SC-112 depends on) fails loudly. This is the "asserting the slot chain" contract the mission asks for.

---

## 5. Slab decision brief

**How Source Serif 4 ships today:** two `@font-face` blocks (`styles-source.css:3089-3100`), family `"Source Serif 4"`, weights **600 (SemiBold) and 700 (Bold) only** — no 400/Regular is bundled. `font-display: swap`. Source is base64-encoded `woff2` embedded directly as the `src:` data URI, inside the Steel-scoped CSS (never resolved by Legacy, since Legacy's font token never references the family name). Raw files also committed at `assets/fonts/` as the license-compliance record:
- `SourceSerif4-SemiBold.woff2` — 32,372 bytes
- `SourceSerif4-Bold.woff2` — 32,592 bytes
- `OFL.txt` — 4,491 bytes (SIL OFL 1.1)

Because there's no 400 weight, body text (Steel-scoped, conceptually ≈400) currently maps up to the 600 face — heavier than the source site's actual body weight (documented in-code at `:3425-3426`).

**Zilla Slab / Bitter (both OFL) weights needed:** 400 (body), 600 (semibold, if the family has that step — Bitter does not natively ship 600, Zilla Slab does), 700 (bold, for Title/Card-head emphasis) — so realistically 400 + 700 minimum, +600 if available.

**Approximate woff2 sizes (flagged: no network access, unverified, use a subsetting tool to confirm before committing bytes):** Latin-subset static woff2 files for slab serif families in this class typically run **≈15–30KB per weight** — comparable to, or somewhat smaller than, Source Serif 4's own 32KB-per-weight subset here (Source Serif 4 is a fairly full-featured, optical-sized family; Zilla Slab/Bitter are lighter single-optical-size families, so likely at or below the low end of that range). For 3 weights that's roughly **45–90KB total** added to the shipped CSS (before base64 inflation, which adds ~33% again to the embedded string length).

**What swapping the default face entails once the vocabulary exists:** exactly what the mission specifies — **one theme-block value change** (`--dse-font-title`/`--dse-font-body`'s Steel-dark literal swaps from `"Source Serif 4", var(--font-text)` to `"Zilla Slab", var(--font-text)` or similar) **plus a bundle addition** (the new `@font-face` blocks + `OFL.txt` swap under `assets/fonts/`). Card-body and Label need no change at all — they chain to Body/Title.

**Fallback story for SC-112 user-picked faces:** the chain design already gives SC-112 a clean seam — a user-settable Title/Body/Controls preference just needs to write a `--dse-font-title`/`--dse-font-body`/`--dse-font-controls` override (inline style or a scoped rule keyed off a `data-dse-*` pref attribute, matching the existing `PrefDescriptor` pattern in `src/prefs/catalog.ts`) with a `, var(--font-text)` (or the bundled fallback family) trailing in the value, exactly the pattern `--dse-font-title`/`--dse-font-body` already use today. Card-body/Label automatically follow unless a future "advanced" pref breaks their chain explicitly.

---

## 6. Step-by-step implementation plan (SDD-sized, 3 tasks)

**Global Constraints (apply to every task):**
- Freeze must stay **101/101 byte-identical** after every task — run `npm run shots` then `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`, expect `freeze OK (101/101 ...)`, after Task 1 AND after Task 2 (Task 2 is the risky one — re-pointing consumers).
- Parity must stay **0 GAPs / 0 unexplained WARNs / exit 0** — `npm run parity` after any Steel CSS edit (Task 2).
- All commands run under devbox wrapping per repo convention (`devbox run -- npm test` / `devbox run -- npm run build`, matching how other SC-10x tasks in this worktree were executed — confirm the exact wrapper invocation from the current worktree's own `check-freeze.sh`/ledger before running).
- No `git push` at any point; work happens in a dedicated worktree per `superpowers:using-git-worktrees`.
- `npx tsc --noEmit` and the full `npx jest` suite must be green after every task, not just at the end.
- Never touch the `[data-dse-print="on"]`/`@media print` exclusion pattern (`:not([data-dse-print="on"])`) on any rule being re-pointed — that's the load-bearing SC-4 print-freeze guard.

**Task 1 — Tokens + guards, provably a no-op**
- Add `font-title`, `font-body`, `font-card-body`, `font-label`, `font-controls` to `DSE_TOKEN_NAMES`.
- Author their Legacy/Steel/Print values per §2's table (independent literals for title/body/controls, chains for card-body/label).
- Update `LEGACY_MAP`, `STEEL_INVARIANT`, `PRINT_INVARIANT`, and the 4 hardcoded counts in `token-coverage.test.ts`; bump `tokens.test.ts`'s union-size literal.
- Add 5 rows to `D3-token-map.md`'s Text table; add a "SC-105 amendment" section documenting the split from `font-display` and the chain design decision.
- **Do not touch any consumer** (`styles-source.css`'s 7 `--dse-font-display` rules, the stepper exclusion, or any kit CSS). DoD: `grep -c "var(--dse-font-display)"` unchanged at 7; freeze 101/101; parity 0/10/exit0; new tests green.

**Task 2 — Re-pointing + contracts, the pixel-preserving swap**
- Re-point the 7 `--dse-font-display` consumers to Title/Card-body per the classification table, including the mutual-exclusion split of the `:3439` body-routing rule into Body + Card-body rules.
- Re-point the stepper exclusion (`:3514-3516`) from `var(--font-text)` to `var(--dse-font-controls)`.
- Leave `.dse-btn`/`.dse-tabs__tab`/`.dse-collapse__header`/`button.dse-pr__row` untouched (`font: inherit`) per the Controls decision in §1 — do not introduce a visible de-serif.
- Remove `--dse-font-display` from `DSE_TOKEN_NAMES`, `LEGACY_MAP`, `STEEL_INVARIANT`/`PRINT_INVARIANT` (n/a, it's not invariant), and its 3 direct test pins (`theme-steel.test.ts`, `theme-print.test.ts`, `tokens.test.ts`).
- Rewrite `steelTypography.test.ts`'s stale framing comment and split its body-font-identity assertion into Body vs. Card-body; add the new slot-chain contract test (§4).
- DoD: `grep -c "var(--dse-font-display)"` = 0 across the whole repo; freeze 101/101 (this is the task where it's actually at risk — confirm before/after); parity 0/10/exit0; full jest green.

**Task 3 — Docs**
- `D3-token-map.md`: finalize the migration note (mirroring the existing "SC-10 amendments"/"Plan 20 amendments" style), cross-reference the retirement of `--dse-font-display`.
- Update any CLAUDE.md/README prose that still names `--dse-font-display` as the font seam (check `.repo-docs/` for hits).
- No CSS or TS changes in this task — pure documentation, so it carries zero freeze/parity risk by construction; still run the full gate once to confirm nothing regressed.

### Critical Files for Implementation
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/src/framework/tokens.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/styles-source.css
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/test/dom/framework/token-coverage.test.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/test/dom/theme/steelTypography.test.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/test/dom/framework/theme-steel.test.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/test/dom/framework/theme-print.test.ts
- /home/scott/code/steelCompendium/workspace/draw-steel-elements/test/dom/kit/tokens.test.ts
- /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md