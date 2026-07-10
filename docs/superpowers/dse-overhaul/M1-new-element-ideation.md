# M1 — New Element & Feature Ideation Menu

A curated menu of candidate additions to DSE. **This is for you to curate**, not a
commitment — check the ones you want and they graduate into the **D5** spec (Fable will
design the chosen set against the Element Framework v2 / F1). Everything here assumes F1's
declaration model + injection seams exist, so items are cheap relative to today's
processor-per-element cost.

**Legend**
Type: 🧩 new element (code block) · ⚡ enhancement of an existing element · 🔧 cross-cutting
feature (not a code block) · 🖼️ dedicated sidebar/tab view.
Priority (my suggestion): **P1** high value + strong fit · **P2** valuable, more work ·
**P3** ambitious / long-horizon (see also M2).
Complexity: S / M / L / XL. Deps: F1 (framework), F2 (data/SCC), D3 (theming), D4 (prefs).

Existing elements for reference: Feature/ability, Featureblock, Statblock, Initiative
Tracker, Negotiation Tracker, Stamina Bar, Counter, Characteristics, Skills, Values Row,
Horizontal Rule.

---

## A. Rolling & interactivity (the biggest missing capability)

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Power Roll roller** — click a rendered ability/test to roll 2d10 + mod, resolve the tier (≤11 / 12–16 / 17+), apply edges/banes, flag nat crits | ⚡ Feature | **P1** | M | F1 | Top of the README "Future work" list. The single highest-impact interactivity add. |
| **Edge/Bane resolver** — UI to toggle edges/banes (incl. double) before a roll; folds into the roller | ⚡ | P1 | S | F1 | Core DS math; reused everywhere. |
| **`ds-roll` inline roller** — arbitrary DS-flavored rolls (tests, damage, power rolls) as a standalone block or inline | 🧩 | P2 | M | F1 | For homebrew/notes outside a full ability card. |
| **Dice-plugin bridge** — optionally delegate to the Dice Roller community plugin if present | 🔧 | P3 | M | F1 | README goal; keep DS-native roller as default. |

## B. Player / hero-facing

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Character/Hero Sheet** — full hero: characteristics, stamina/recoveries/winded, heroic resource, kit, abilities, skills, conditions, surges, victories | 🧩 `ds-hero` | **P1** | XL | F1,F2,D4 | There's already a `character-sheet-ele` branch + `canvas-character-sheet.md`. Flagship. Likely composes many smaller elements. |
| **Heroic Resource tracker** — class resource (Ferocity/Focus/Drama/Essence/…), per-turn gain + spend | 🧩 `ds-resource` | P1 | S | F1 | Distinct from generic Counter; class-aware. |
| **Recoveries + Winded** — recovery count/value, winded threshold, catch-breath | ⚡ Stamina | P1 | S | F1 | Fold into the Stamina element rather than a new block. |
| **Surge tracker** | ⚡/🧩 | P2 | S | F1 | Often lives on the hero sheet. |
| **Conditions strip (single-actor)** — a standalone conditions display/editor with save-ends (EoT/EoE) durations | 🧩 `ds-conditions` | P2 | M | F1 | Reuses the initiative tracker's condition engine, decoupled. |
| **Hero Tokens (party)** — shared party pool | 🧩 | P3 | S | F1 | Party-wide; pairs with a party tracker. |

## C. GM / encounter & subsystems

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Encounter Builder** — assemble monsters, compute budget/EV/victories, then hand off into the Initiative Tracker | 🧩 `ds-encounter` | **P1** | L | F1,F2 | README "encounter building." Big GM draw; leans on compendium data. |
| **Malice tracker** — per-encounter Malice pool + spendable monster malice features | ⚡/🧩 | P2 | M | F1,F2 | Initiative already tracks Malice; surface it + malice features. |
| **Montage Test tracker** — successes/failures, per-hero tests, outcome bands | 🧩 `ds-montage` | P2 | M | F1 | New subsystem tracker, sibling to Negotiation. |
| **Project / Downtime tracker** — project points/goals; respite activities | 🧩 `ds-project` | P2 | M | F1,F2 | `project` exists as a data-unified type. |
| **Party tracker** — XP/Victories/Renown, party members roster | 🧩 `ds-party` | P2 | M | F1 | README "Party tracker (XP, Victories)." |
| **Turn/round economy** — per-turn action checklist (main/maneuver/move/triggered) | ⚡ Initiative | P3 | S | F1 | Nice-to-have inside the tracker. |

## D. Compendium-powered reference (unlocked by F2 / data-unified)

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Reference-by-SCC** — any element pulls content live from the downloaded compendium by SCC code instead of inline YAML (`ds-statblock: goblin`, `ds-feature: <code>`) | ⚡ all | **P1** | M | F1,F2 | The payoff of data-unified: author once, render anywhere. |
| **`ds-condition` / rule card** — render a condition or rule's card by name/code | 🧩 | P1 | S | F2 | `condition`/`rule` are data-unified types. |
| **Compendium search/insert** — search the downloaded data, insert a reference or full block | 🔧 | P2 | M | F2 | Pairs with the authoring tools (section E). |
| **SCC hover-preview** — `scc.v1:` links get a hover card (parity with the v2 site) | 🔧 | P2 | M | F1,F2 | Big polish; reuses F2's resolver. |
| **Kit / Ancestry / Culture / Career / Class / Title / Perk / Treasure display** | 🧩 family | P3 | M | F2 | All exist as data-unified types; one declaration pattern covers many. |

## E. Authoring & editing UX (addresses the "hand-write YAML" pain)

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Insert-Element commands + editor suggest** — command palette + `/` suggestions that scaffold a `ds-*` block | 🔧 | **P1** | M | F1 | Massive onboarding win; low risk. |
| **Form/GUI editor** — edit an element via a form instead of raw YAML (the "editing UX" half of the Elements rework) | 🔧 | P2 | L | F1 | Aligns with F1's mode-agnostic view work. |
| **Text importer / parser** — paste raw ability/statblock text → generate `ds-*` YAML | 🔧 | P2 | L | F2 | README "Text parser…"; pairs with the SDK. |
| **YAML schema hints** — autocomplete + inline validation squiggles for `ds-*` blocks | 🔧 | P3 | L | F1 | Uses the existing AJV schemas; CM6 integration. |

## F. Cross-cutting features (not code blocks)

| Item | Type | P | Cx | Deps | Notes |
|---|---|---|---|---|---|
| **Initiative Tracker as a sidebar view** — a persistent `ItemView` that survives note navigation | 🖼️ | P2 | L | F1 | Shifts trackers from per-note blocks to a running-session tool. |
| **Print/export mode** — clean print/PDF of statblocks & sheets | 🔧 | P2 | M | D3 | GMs print. Ties to theming. |
| **Tracker-state persistence model** — decide where interactive state lives (block source / frontmatter / sidecar) and make it robust | 🔧 | P1 | M | F1 | Really an F1 concern; flagged here so it isn't lost. |

## G. Stretch / long-horizon

Tactical grid/battle map, area-of-effect templates (burst/line/cube/wall), line-of-effect
& distance helpers, shared/multiplayer session state, full Live Preview build. **These live
in M2**, not here.

---

## Recommended first cut for D5

If you want a tight, high-leverage D5 batch rather than "all of it," I'd propose:

1. **Power Roll roller + edge/bane resolver** (A) — the marquee interactivity win.
2. **Reference-by-SCC** (D) — proves the F2/data-unified payoff across all elements.
3. **Heroic Resource + Recoveries/Winded** (B) — small, high daily-use value.
4. **Insert-Element commands + editor suggest** (E) — onboarding/authoring win, low risk.
5. **Encounter Builder** (C) — the big GM headline, if appetite allows (it's L).

The **Hero Sheet** (B) is the natural flagship but is XL and composes many of the above — I'd
sequence it *after* the framework + the smaller hero-facing pieces prove the seams.

**Your move:** check/annotate the items you want in D5 (and bump/lower any priorities), and
I'll fold the selection into the D5 brief for Fable.
