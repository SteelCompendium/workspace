# SC-120 §D2 — Steel compositions for the remaining ten display families

**Round 1 design (survey + design; no repo source changed).**
Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions`
(dse base `16e25ff` = `origin/develop` tip). Effort ledger: `decisions.md` (same dir).

---

## 0. What this round established (read this first)

Three facts reframe the ticket, and every verdict below rests on them.

**(a) Only ONE of the ten families has a site composition to port.** `steel-etl`'s leaf-page
transform table (`steel-etl/internal/site/build.go:356-410`) runs a page builder for exactly
five types: ability/trait, statblock, featureblock, **kit**, **class**. `buildClassLandingPage`
(`class_page.go:48`) is the only one in our ten. `buildTitleEchelonPage` (`title_page.go:18`)
exists but emits **zero HTML** — it inserts the markdown line `**Echelon:** 3rd`
(`title_page.go:27`). Every other family's leaf page is plain MkDocs prose: no wrapper, no
class, no CSS. Verified from both sides — the emitter (grep of every type dispatch:
`kit_page.go:19`, `title_page.go:20`, `class_page.go:50`, `chapter_page.go:38`,
`ability_cards.go:41`, `featureblock_page.go:88`, `statblock_page.go:126`,
`companion_statblock.go:226`) and the generated output in this worktree
(`v2/docs/Browse/{career,ancestry,culture,perk,complication,condition}/*.md` contain no `<div`
at all).

**(b) The site's real per-family composition is the INDEX TILE, `.sc-card`.** That is the
correct port target, not the leaf page — and it is the closest structural analogue to the
plugin's `.dse-card` (they are already a declared parity pair). Every family in scope has one,
built by a named function in `steel-etl/internal/site/cards.go`. This is where the eyebrow, the
crest, the stat boxes, the `__line` label/value rows and the flavor clamp actually live.

**(c) The plugin is allowed to beat the site here, and in four families it should.** Workspace
rule: *the v2 site is a reference, not gospel.* The site's tile is a **grid cell** — it must fit
a 15rem column next to 50 siblings, so it truncates flavor at 96–480 chars and drops fields it
has room for nowhere. The plugin's card is a **full-width card inside a note**, with no such
budget. Divergences are called out explicitly per family below and marked **[DIVERGENCE]**.

Two structural gaps the site has that the plugin must NOT copy:

- **No single dash convention.** `career` + `kit` dash-fill absent stat slots (`orDash`,
  `cards.go:892-897` → `—`); `class` + `treasure` **omit** the cell entirely
  (`class_page.go:153-164`, `cards.go:698-700`). SC-100 ruling 2 already settled this for the
  plugin: *a fixed grid reading uniformly is itself information*. **Rule adopted here:**
  dash-fill when the slot is live-but-sparse in the corpus (career: `project_points` 7/18,
  `language` 16/18, `renown` 6/18, `wealth` 2/18 — dash-fill is right); omit the whole band when
  the field is **dead** corpus-wide (culture's `environment`/`organization`/`upbringing` 0/13 —
  never render a row of four dashes for fields nothing populates).
- **Two crest keys disagree with the site's own Browse landing** — `culture` is `map`
  (`cards.go:1270`) vs `:material-earth:` (`v2/docs/Browse/index.md:20`), `condition` is
  `lightning-bolt` (`cards.go:1271`) vs `:material-heart-broken:` (`index.md:60`). Flagged for
  the ticket-owner's judgment (§7).

---

## 1. Evidence base

### 1.1 Plugin "before" shots (this worktree, `npm run shots`, 2026-08-28)

Live: `draw-steel-elements/visual-harness/shots/<family>--steel-{dark,light,print,realprint}.png`
Frozen copies of the dark shots preserved in the ledger dir:

| family | ledger copy (before) |
|---|---|
| kit *(target quality bar)* | `.superpowers/sdd/sc120-d2-steel-compositions/sc120-before-kit--steel-dark.png` |
| class | `…/sc120-before-class--steel-dark.png` |
| career | `…/sc120-before-career--steel-dark.png` |
| ancestry | `…/sc120-before-ancestry--steel-dark.png` |
| culture | `…/sc120-before-culture--steel-dark.png` |
| title | `…/sc120-before-title--steel-dark.png` |
| perk | `…/sc120-before-perk--steel-dark.png` |
| complication | `…/sc120-before-complication--steel-dark.png` |
| treasure | `…/sc120-before-treasure--steel-dark.png` |
| condition | `…/sc120-before-condition--steel-dark.png` |
| rule | `…/sc120-before-rule--steel-dark.png` |

Confirms SC-121 C-1 verbatim: every family but kit renders `renderBase()` — bold title, pill
badges, a loose `max-content 1fr` label/value grid, then a wall of body prose. Ancestry is
indeed the worst (bare title + one row + 3882px of prose). **Two additional defects the shots
surface that the ticket did not name:**

- **treasure double-renders its own data.** `sc120-before-treasure--steel-dark.png` shows the
  `Project:` row AND, 200px lower, the body's `**Project Source:**` / `**Project Roll
  Characteristic:**` / `**Project Goal:**` / `**Effect:**` lines. The `renderBase()` duplicate
  guard (`CardLayout.ts:304-307`) misses them because it compares the *joined* row value
  ("Reason or Intuition · 150") against the body, which contains the parts separately.
- **title renders NOTHING structural.** Its Prerequisite/Effect rows are correctly suppressed by
  that same guard, so the card is a title, one badge, and prose — the guard is working as
  designed and the result is still the emptiest card of the ten.

### 1.2 Site reference shots (live `steelcompendium.io`, playwright/chromium, dark + light, 2× DPR)

All in the ledger dir. **Dark is the design reference** (Scott's rule); light captured for the
scheme-twin values.

| id | dark | light | what it is |
|---|---|---|---|
| class page head | `sc120-ref-class-page--dark.png` | `…--light.png` | `.sc-classhead` — the one real page composition |
| class tile | `sc120-ref-class-tile--dark.png` | `…--light.png` | `.sc-card` classCard |
| career tile | `sc120-ref-career-tile--dark.png` | `…--light.png` | `.sc-card` + 4-up dash-filled `__stats` |
| ancestry tile | `sc120-ref-ancestry-tile--dark.png` | `…--light.png` | `.sc-card` + `__line` "Signature Trait" |
| culture tile | `sc120-ref-culture-tile--dark.png` | `…--light.png` | `.sc-card` + `__line` "Skill Options" |
| title tile | `sc120-ref-title-tile--dark.png` | `…--light.png` | `.sc-card`, type label = "Echelon N" |
| perk tile | `sc120-ref-perk-tile--dark.png` | `…--light.png` | `.sc-card--wide`, head-only |
| complication tile | `sc120-ref-complication-tile--dark.png` | `…--light.png` | `.sc-card--wide`, head-only |
| treasure tile | `sc120-ref-treasure-tile--dark.png` | `…--light.png` | `.sc-card` + tags + clamp + 2-up `__stats` |
| condition tile | `sc120-ref-condition-tile--dark.png` | `…--light.png` | `.sc-card`, blurb only (barest in the system) |
| rule tile | `sc120-ref-rule-tile--dark.png` | `…--light.png` | `.sc-card`, blurb only, type = group dir |
| kit tile | `sc120-ref-kit-tile--dark.png` | `…--light.png` | the SC-100 source of truth, for calibration |
| treasure page | `sc120-ref-treasure-page--dark.png` | `…--light.png` | proof the leaf page is plain prose |

Capture script (throwaway, scratch space, not committed):
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/site-ref.mjs`

### 1.3 Corpus population (counts from `v2/docs/Browse/**` frontmatter in this worktree)

Decides dash-fill vs. omit, and which bands are worth building at all.

| field | populated | verdict |
|---|---|---|
| `career.language` | 16/18 | live → tile slot |
| `career.project_points` | 7/18 | live-sparse → tile slot, dash |
| `career.renown` | 6/18 | live-sparse → tile slot, dash |
| `career.wealth` | 2/18 | live-sparse → tile slot, dash |
| `treasure.level_effects` | **47/127** | live → a real band the site never renders structurally |
| `class.heroic_resource` | 0/13 | dead → drop the subtitle slot |
| `ancestry.signature_trait_description` | 0/12 | dead → band shows the NAME only |
| `ancestry.ancestry_points`, `purchased_traits` | 0/12 | dead → no band |
| `culture.{environment,organization,upbringing,culture_benefit_type}` | 0/13 | dead → **no tag row, no tile row** |
| `perk.perk_group`, `perk.prerequisites` | 0/55 | dead → eyebrow is the literal "Perk" |
| `title.benefits` | 0/66 | dead → no band |
| `career.inciting_incidents`, `career.skill_group` | 0/18 | dead as frontmatter (the d6 table lives in the body) |

---

## 2. Verdicts (one line each, then the rationale)

| family | verdict | bands | new CSS |
|---|---|---|---|
| **class** | **FULL composition** | head + flavor + 2 tile rows + Skills + body | shared only |
| **career** | **FULL composition** | head + flavor + 1 tile row + Skills + Perk + body | shared only |
| **treasure** | **FULL composition** | head + tags + flavor + tile row + Prereq + Source + Effect + Leveled + body | shared only |
| **complication** | **MEDIUM composition** | head + flavor + Benefit + Drawback + body | none |
| **title** | **MEDIUM composition** | head + flavor + Prerequisite + Effect + body | none |
| **culture** | **LIGHT composition** | head + flavor + Skill Options + body | none |
| **ancestry** | **LIGHT composition** | head + Signature Trait + flavor + body | none |
| **perk** | **LIGHT (head only)** | head + body | none |
| **condition** | **LIGHT (head only)** | head + body | none |
| **rule** | **LIGHT (head only)** | head + body | none |

**No family stays a pure prose card.** That is a deliberate finding, not a default: the
`cardHead` crest+eyebrow is the single change that fixes SC-121 C-1's complaint ("plain bold
title, pill badges") for all ten at once, costs nothing per family beyond two closure lines, and
introduces **zero new CSS** (`.dse-card > .dse-head` already ships, `styles-source.css:6293`).
The four "head only" families genuinely have nothing else structured to show — perk/condition/
rule carry only `{name, content}`, and their site tiles are equally bare — so a head-only
composition is the honest ceiling, not a shortcut.

---

## 3. Per-family design

Conventions used throughout:

- **Head** = `SteelCardComposition.{eyebrow, crestIcon, crestSize}` → `cardHead()`
  (`src/framework/kit/cardHead.ts`). `crestSize` defaults to `'lg'` (`CardLayout.ts:368`) —
  matches the site's `.sc-crest` 38×43 / `.lg` 50×56 (`steel-redesign.css:40-69`). Keep the
  default everywhere.
- **Tiles** = `statTiles(container, StatTile[])` (`src/framework/kit/statTiles.ts`). Dash
  semantics are the primitive's own: `value: ''` renders `—` (`statTiles.ts:39,54`), never an
  omitted cell.
- **Prose band** = `{ head: 'X', render: (c, md) => md(text, c.createDiv({cls:'dse-card__body'})) }`.
  `.dse-card__band-head` already carries the small-caps + hairline recipe
  (`styles-source.css:6325`).
- **Body policy** — three options, chosen per family:
  **(A) keep whole** · **(B) strip the labeled lines the composition now renders structurally**
  (a generalization of `stripKitBodySections`, `layouts.ts:96-118` — see §5.2)
  · **(C) body is the card**.

---

### 3.1 class — FULL composition

**Verdict.** The strongest case of the ten and the ticket's own headline example. It is the only
family where the site itself built a bespoke composition (`.sc-classhead`,
`class_page.go:77-83`), the model carries six structured numeric/short-string fields
(`starting_stamina`, `stamina_per_level`, `recoveries`, three potencies), and the current plugin
card renders all of them as a four-row label/value grid under a bare bold title
(`sc120-before-class--steel-dark.png`) — the exact shot Scott attached to the ticket. Porting the
site's two 3-up cell strips is a direct, high-confidence win.

**Shots.** before `…/sc120-before-class--steel-dark.png` · site `…/sc120-ref-class-page--dark.png`
(page head — the composition) + `…/sc120-ref-class-tile--dark.png` (crest + tags).

**Head**
- `eyebrow`: `'Class'` — the site's literal (`class_page.go:63`, `hLine("Class")`).
- `crestIcon`: `'shield'` — Lucide twin of the site's MDI `shield-sword` (`cards.go:1263`);
  `shield` is already a known-good name in this plugin (`statblock/view.ts` defender role).
  **[DIVERGENCE]** the site's *page* head is crestless (`class_page.go:62-73` sets no `Crest`)
  because it sits under a page `<h1>`; the site's own class *tile* does carry the crest
  (`cards.go:347` → `card()` → `.sc-crest`). A plugin card has no H1 above it, so the crest is
  what carries family identity. Follow the tile.
- `rightPrimary`: `(m.primary_characteristics ?? []).join(' · ')` — the site's
  `hMini(strings.Join(primaries, " · "))` (`class_page.go:68`).
- `rightDeck`: `'primary characteristics'` — the site's literal lowercase label
  (`class_page.go:70`).
- **Drop `subtitle: m.heroic_resource`** — 0/13 in the corpus.
- **`badges` are replaced by the head** — the two `keyword`-tone pills in the before-shot become
  the right-rail primary. `renderSteel()` never calls `layout.badges` (`CardLayout.ts:360-386`),
  so this is automatic.

**Bands, in order**

| # | head | content | source |
|---|---|---|---|
| 1 | *(none)* | `.dse-card__flavor` ← `m.flavor`, with the SAME duplicate-vs-body guard kit uses (`layouts.ts:176-185`) | `.sc-classhead__flavor`, `steel-class.css:27-31` |
| 2 | `Basics` | `statTiles()` ×1 row, **3 slots** | `.sc-classhead__stats`, `class_page.go:151-166` |
| 3 | `Potency` | `statTiles()` ×1 row, **3 slots** | `.sc-classhead__pot`, `class_page.go:170-185` |
| 4 | `Skills` | markdown band ← `[skills.join(', '), skill_group]` | `.sc-classhead__skills`, `class_page.go:188` |
| 5 | *(none)* | body ← `m.content` | — |

Tile slots, exact (labels are the site's own strings, `class_page.go:153-161` / `:172-179`):

- Row 2: `{ value: String(starting_stamina), label: 'Starting stamina' }`,
  `{ value: '+' + stamina_per_level, label: 'Stamina per level' }` (the site prefixes `+`,
  `class_page.go:157`), `{ value: String(recoveries), label: 'Recoveries' }`.
- Row 3: `{ value: plainText(weak_potency), label: 'Weak potency' }`, `…'Average potency'`,
  `…'Strong potency'`.
  **`plainText()` is required** — every real potency value is `"[Reason](scc.v1:…) − 2"` and
  `statTiles()` writes with `setText` (`statTiles.ts:54`). The site strips the link too
  (rendered value reads `Reason − 2`, see `sc120-ref-class-page--dark.png`). See §5.1.
- **Dash semantics:** dash-fill (the primitive's default). The site *omits* absent class cells
  (`class_page.go:162-164`, for beastheart which carries none), but SC-100 ruling 2 governs the
  plugin — a fixed 3-slot strip reading uniformly is information. **[DIVERGENCE, deliberate.]**

**Body policy: (A) keep whole.** The site's own class page repeats every Basics value below the
head (`v2/docs/Browse/class/tactician.md`, `## Basics`), so keeping the body is site parity AND
the lower-risk choice. The `### Tactician Advancement Table` in the body is a real asset the
composition must not eat.

**Note on the head's right rail.** `cardHead()` renders right-column slots with the `chip` style
(`cardHead.ts:117-119`); the site uses `mini` (right-primary) + `line` (right-deck). A small
Steel-scoped override on `.dse-card > .dse-head .dse-head__deck--right` porting
`steel-class.css:21-24` (`font-size` via a `--dse-fs-*` role token, `letter-spacing:.07em`,
`--dse-fg-faint`) makes the deck read as a caption rather than a second chip. Counted as shared
work in Batch A (§6), because career reuses it.

---

### 3.2 career — FULL composition

**Verdict.** The site's `careerCard` (`cards.go:382-414`) is a complete, already-designed
composition with a **dash-filled 4-up tile row** — the exact grammar `statTiles()` was built for
(`statTiles.ts:14-25` explicitly names "a future §D2 adopter (class/career stat boxes)" as the
reason the primitive is generic). Three of the four stat fields are sparse-but-live in the corpus
(§1.3), which is precisely the case the fixed-slot dash exists to serve. Today the plugin shows
`Renown +1` / `Wealth +1` as two type-tone pills and `Language: One language` as one grid row
(`sc120-before-career--steel-dark.png`) — strictly less information, worse laid out.

**Shots.** before `…/sc120-before-career--steel-dark.png` · site `…/sc120-ref-career-tile--dark.png`.

**Head**
- `eyebrow`: `'Career'` (`cards.go:413`, `card(file,"career","Career",…)`).
- `crestIcon`: `'briefcase'` — Lucide twin of MDI `briefcase-variant` (`cards.go:1265`).

**Bands, in order**

| # | head | content | source |
|---|---|---|---|
| 1 | *(none)* | flavor, with the dedup guard | `flavorDiv(…,200)`, `cards.go:385-389` |
| 2 | `Career Benefits` | `statTiles()` ×1 row, **4 slots** | `.sc-card__stats`, `cards.go:400-405` |
| 3 | `Skills` | markdown ← `[skills.join(', '), skill_group]` | `lineBlock("Skills",…)`, `cards.go:407-409` |
| 4 | `Perk` | markdown ← `[perk, perk_group]` | `lineBlock("Perk",…)`, `cards.go:410-412` |
| 5 | *(none)* | body, **policy (B)** | — |

Tile slots, exact (`cards.go:401-404`):
`{ value: languageCount(m.language), label: 'Languages' }`,
`{ value: m.project_points, label: 'Project Pts' }`,
`{ value: m.renown, label: 'Renown' }`,
`{ value: m.wealth, label: 'Wealth' }` — all four dash-filled by `statTiles()`.

`languageCount` ports the site's `careerLanguageCount` (`cards.go:395-399`): the model's
`language` is the sentence `"One language"`; the site's tile shows the count word `Two`. Port the
first-word extraction — a 3-line helper next to `kitBonusValue` in `layouts.ts`.
**Site parity is right here**: `"One language"` at 12 characters would force the site's own
`font-size:.72rem` shrink hack (`cards.go:709`), which the plugin must not reproduce (never
hardcode a font-size — plugin `CLAUDE.md`).

**Band 2 head text.** The site tile has no band heads at all. `Career Benefits` is the phrase the
career body itself uses ("You gain the following career benefits:"), so it is source-faithful.
**[DIVERGENCE]** — a plugin-only label; flag for Scott if he'd rather the tile row be headless.

**Body policy: (B).** Strip the bold-labeled lines the composition now owns —
`**Skills:**`, `**Languages:**`, `**[Renown](…):**`, `**[Wealth](…):**`, `**Perk:**` — leaving the
"think about the following questions" prose and, load-bearing, the **d6 Inciting Incident table**.
**[DIVERGENCE — plugin richer]** the site's tile drops the table entirely; the plugin card keeps
it, because it has the room.

---

### 3.3 treasure — FULL composition

**Verdict.** Two independent reasons. (1) The site's `treasureCard` (`cards.go:416-453`) is the
richest of the prose families — tags, clamped flavor, a variable-length `__stats` grid, and two
`__line` rows — so there is a real composition to port. (2) The plugin's current treasure card is
**actively broken by duplication**: `sc120-before-treasure--steel-dark.png` shows the Project row
and then the same five values again as body prose (§1.1). A composition plus body policy (B) is
the fix, not a nicety. Third: `level_effects` is populated on 47/127 treasures and the plugin can
render it structurally where the site cannot.

**Shots.** before `…/sc120-before-treasure--steel-dark.png` · site tile
`…/sc120-ref-treasure-tile--dark.png` · site page (proof it's plain prose)
`…/sc120-ref-treasure-page--dark.png`.

**Head**
- `eyebrow`: `titleCase(m.treasure_type)` (→ `Trinket`, `Armor`, `Implement`) falling back to
  `'Treasure'` — the site's own type label (`cards.go:417-420`). Where `m.level`/`m.echelon`
  exist, append: `` `${type} · Level ${level}` ``. *(Today's `subtitle` does this;
  `renderSteel()` ignores `subtitle`, so it must move into the eyebrow or it is lost.)*
- `crestIcon`: **needs a ruling.** The site uses MDI `treasure-chest` (`cards.go:1266`); Lucide
  has no `treasure-chest`. Candidates: `package`, `box`, `archive`, `gem`. Recommend **`package`**
  (`gem` is taken by perk below). See §7.
- `rightEyebrow`: `m.rarity` when present (chip style suits it).

**Bands, in order**

| # | head | content | source |
|---|---|---|---|
| 1 | *(none)* | keyword chips — reuse the existing `.dse-card__badges` / `.dse-card__badge--keyword` DOM inside a headless band | `.sc-card__tags`/`.sc-tag`, `cards.go:423-425` |
| 2 | *(none)* | flavor + dedup guard | `.sc-card__flavor--clamp`, `cards.go:430` — **do NOT port the clamp** (`min-height:4.5em`, `steel-redesign.css:254`): it exists to align a grid of tiles |
| 3 | `Project` | `statTiles()` ×1 row, **2 slots** | `.sc-card__stats`, `cards.go:435-443` |
| 4 | `Prerequisite` | markdown ← `m.item_prerequisite` | `lineBlock("Prerequisite",…)`, `cards.go:446-448` |
| 5 | `Source` | markdown ← `m.project_source` | `lineBlock("Source",…)`, `cards.go:449-451` |
| 6 | `Effect` | markdown ← `m.effect` | *(plugin-only; the tile has no room)* |
| 7 | `1st Level` / `5th Level` / `9th Level` — **one band per key** | markdown ← `m.level_effects[k]` | **[DIVERGENCE — plugin richer]** |
| 8 | *(none)* | body, **policy (B)** | — |

Tile slots (`cards.go:437-443`):
`{ value: String(m.project_goal), label: 'Project Goal' }`,
`{ value: plainText(m.project_roll_characteristic), label: 'Roll Characteristic' }`.
The site **omits** an absent cell here; the plugin **dash-fills** both (SC-100 ruling 2) — and
suppresses the whole band only when both are absent, the same "knowingly-empty band" rule kit's
flavor band already applies (`layouts.ts:172-175`).
`plainText()` is required again — `project_roll_characteristic` is
`"[Reason](scc.v1:…) or [Intuition](scc.v1:…)"` in every real treasure (SC-121 C-5).

Band 7 uses **no new CSS** — one `.dse-card__band` per tier, head = the map key
(`1st`/`5th`/`9th` → `"1st Level"`). Ordering: sort by leading integer, not lexically.

**Body policy: (B), and it is the point of the ticket for this family.** Strip
`**Keywords:**`, `**[Item Prerequisite](…):**`, `**[Project Source](…):**`,
`**[Project Roll](…) [Characteristic](…):**`, `**Project Goal:**`, `**Effect:**` — note the
labels are themselves markdown-linked, so the strip must match on the **link text**, not the raw
line. Everything after `**Effect:**`'s own paragraph (the "Additionally, …" rider) must survive.

---

### 3.4 complication — MEDIUM composition

**Verdict.** The clearest "plugin beats the site" case of the ten. The site's
`complicationCard` (`cards.go:488-502`) is head + flavor and nothing else — but **every**
complication in the corpus carries structured `benefit` and `drawback` strings, and the site's own
leaf page renders them as `**Benefit:** …` / `**Drawback:** …` prose. Two labeled bands is a
strictly better read than either, costs no CSS, and turns the emptiest-but-one card
(`sc120-before-complication--steel-dark.png`: title, prose, two bold-labeled paragraphs) into a
scannable card.

**Shots.** before `…/sc120-before-complication--steel-dark.png` · site
`…/sc120-ref-complication-tile--dark.png`.

**Head**: `eyebrow: 'Complication'` (`cards.go:501`); `crestIcon: 'octagon-alert'` — Lucide twin
of MDI `alert-decagram` (`cards.go:1269`). *(Verify the id against the bundled Obsidian Lucide
version — older releases name it `alert-octagon`; §7.)*

**Bands**: 1 flavor (headless, dedup guard) · 2 `Benefit` (markdown ← `m.benefit`) ·
3 `Drawback` (markdown ← `m.drawback`) · 4 body, **policy (B)** (strip `**Benefit:**` /
`**Drawback:**`).

**[DIVERGENCE — plugin richer]**: bands 2 and 3 have no site counterpart at all.

---

### 3.5 title — MEDIUM composition

**Verdict.** The site's `titleCard` (`cards.go:472-486`) supplies a real and slightly unusual
composition: the crest is a crown and **the type label is `"Echelon N"`, not `"Title"`**
(`cards.go:473-476`) — the echelon becomes the eyebrow, which is a genuinely better use of the
slot than the plugin's current `Echelon 3` badge pill. The model also carries `prerequisite` and
`effect` on essentially every title, and today both are *correctly suppressed* by the base
duplicate-row guard, leaving the barest card of the ten
(`sc120-before-title--steel-dark.png`: name, one pill, prose). Inverting that — structure wins,
the body loses those lines — is the whole improvement.

**Shots.** before `…/sc120-before-title--steel-dark.png` · site `…/sc120-ref-title-tile--dark.png`.

**Head**: `eyebrow: m.echelon ? `Echelon ${m.echelon}` : 'Title'` (`cards.go:473-476`);
`crestIcon: 'crown'` — exact Lucide match for MDI `crown` (`cards.go:1268`), already used in this
plugin (`statblock/view.ts` leader role).

**Bands**: 1 flavor (headless) · 2 `Prerequisite` (markdown ← `m.prerequisite`, links live) ·
3 `Effect` (markdown ← `m.effect`) · 4 body, **policy (B)** (strip `**Echelon:**` — injected by
`title_page.go:27` — plus `**Prerequisite:**` and `**Effect:**`).

`benefits` is dead (0/66) — no band.
**[DIVERGENCE — plugin richer]**: the site tile shows Prerequisite only; the plugin shows Effect too.

---

### 3.6 culture — LIGHT composition

**Verdict.** Light, and deliberately so. The site's `cultureCard` (`cards.go:504-529`) is head +
tags + flavor + one `Skill Options` line — but **every one of culture's tag/row fields is dead in
the corpus** (`environment`/`organization`/`upbringing`/`culture_benefit_type`: 0/13, §1.3), and
`skill_options`/`quick_build_skill` are frontmatter-empty too: the real Skill Options sentence
lives in the body (`**Skill Options:** One skill from the [interpersonal]…`), which is why the
site falls back to `bodyLabeledLine(body,"Skill Options")` (`cards.go:518-523`). So the honest
composition is head + flavor + one band sourced with the same fallback. A four-dash tile row here
would be a lie about the data (§0's dash rule).

**Shots.** before `…/sc120-before-culture--steel-dark.png` · site `…/sc120-ref-culture-tile--dark.png`.

**Head**: `eyebrow: 'Culture'` (`cards.go:528`); `crestIcon: 'map'` — Lucide twin of MDI `map`
(`cards.go:1270`). *(Site self-inconsistency flagged in §7.)*

**Bands**: 1 flavor (headless, dedup) · 2 `Skill Options` — markdown from
`m.skill_options?.join(', ')` ?? `m.quick_build_skill` ?? `bodyLabeledLine(m.content,'Skill
Options')`; band omitted entirely when all three are empty · 3 body, **policy (B)** (strip
`**Skill Options:**`).

Drop the dead `Environment`/`Organization`/`Upbringing`/`Language`/`Quick-build skill` rows the
current `cultureLayout` declares (`layouts.ts:319-329`) from the composition — they stay in the
legacy `rows` for the base branch, which is byte-frozen and untouched.

---

### 3.7 ancestry — LIGHT composition

**Verdict.** Light in band count, but the single biggest visual delta of the ten: SC-121 named it
"the worst case (bare title, no chip/box at all)", and
`sc120-before-ancestry--steel-dark.png` bears that out — a bold `HUMAN`, one `Signature trait:`
row, and 3800px of lore. The site's `ancestryCard` (`cards.go:367-391`) has no stat grid either —
crest, type, one `__line "Signature Trait"` with a `.hl` highlight, flavor. So the correct
composition is exactly that: head + one band + flavor. The crest and eyebrow do the heavy lifting.

**Shots.** before `…/sc120-before-ancestry--steel-dark.png` · site `…/sc120-ref-ancestry-tile--dark.png`.

**Head**: `eyebrow: 'Ancestry'` (`cards.go:379`); `crestIcon: 'users'` — Lucide twin of MDI
`account-group` (`cards.go:1264`), already used in this plugin (minion role crest).

**Bands**: 1 `Signature Trait` — markdown ← `m.signature_trait_name` alone today (description is
0/12; keep the existing `**name.** description` composition for the day it populates,
`layouts.ts:299-303`) · 2 flavor (headless, dedup) · 3 body, **policy (C) keep whole** — an
ancestry's content is pure lore with no labeled lines to strip.

Band order deliberately puts Signature Trait **above** flavor, matching the site tile
(`cards.go:369-378`), because the trait is the mechanical hook and the flavor is 5 lines long.

`ancestry_points` / `purchased_traits` are dead (0/12) — no band.

---

### 3.8 perk — LIGHT (head only)

**Verdict.** Head-only is the honest ceiling. `Perk` carries `{name, flavor, perk_group,
prerequisites, content}` and **both structured fields are 0/55** — there is literally nothing to
band. The site agrees emphatically: `perkCard` (`cards.go:455-470`) is the `--wide` variant —
crest `lg`, a namecol, and flavor — with the prerequisite line present in code but never
populated. `sc120-ref-perk-tile--dark.png` is one line tall. Meanwhile the perk body is where all
the content is (the Familiar example carries an entire statblock table). Head + body is right.

**Shots.** before `…/sc120-before-perk--steel-dark.png` · site `…/sc120-ref-perk-tile--dark.png`.

**Head**: `eyebrow: m.perk_group ? `${titleCase(m.perk_group)} Perk` : 'Perk'`
(`cards.go:456-459` — keep the group form for when data populates); `crestIcon: 'gem'` — Lucide
twin of MDI `diamond-stone` (`cards.go:1267`).

**Bands**: 1 flavor (headless, dedup — suppressed against the body in practice, since perk flavor
is the body's lead sentence) · 2 body, **policy (C)**.

`prerequisites` band: declare it, gated on non-empty (0/55 today, so inert) — the same
"prophylactic but harmless" pattern `layouts.ts` already uses for dead fields.

---

### 3.9 condition — LIGHT (head only)

**Verdict.** `Condition` is the thinnest model in the SDK — `{name, scc, content}` and nothing
else. The site's condition card is *the barest in the system*: it falls to `cardFor`'s `default:`
arm (`cards.go:285-292`) and emits a 96-char blurb. There is nothing to compose. What the head
DOES fix is real though: today the family identity is a `type`-tone pill reading `Condition`
below the title (`sc120-before-condition--steel-dark.png`); a crest + eyebrow says the same thing
in the grammar every other Steel card uses.

**Shots.** before `…/sc120-before-condition--steel-dark.png` · site `…/sc120-ref-condition-tile--dark.png`.

**Head**: `eyebrow: 'Condition'`; `crestIcon: 'zap'` — Lucide twin of MDI `lightning-bolt`
(`cards.go:1271`), already in this plugin's vocabulary (triggered-action crest). **Site
self-inconsistency: the Browse landing uses `:material-heart-broken:` (`Browse/index.md:60`)** —
§7.

**Bands**: 1 body, **policy (C)**. The existing `badges: () => [{text:'Condition',tone:'type'}]`
(`layouts.ts:248`) is superseded by the eyebrow and simply not read on the steel branch.

---

### 3.10 rule — LIGHT (head only), and it is the odd one out

**Verdict.** Head-only, lowest value of the ten, **and it touches a different file**. `ds-rule` is
the sole `genericCard()` instance (`displayFamily.ts`), not a `displayFamily()` — its layout is
the module-private `genericLayout` in `src/elements/display/displayFamily.ts`, over
`GenericNote = {name, type, body}`, with `useSourceBody: false`. In **inline** mode `type` is `""`
and `name` is the literal descriptor name, which is why `sc120-before-rule--steel-dark.png` reads
a bare `RULE` (the `chrome.summary` guard at `displayFamily.ts` calls this out as the "degenerate
RULE: Rule" case). So the eyebrow only carries real information in by-SCC hybrid mode.

The site's `ruleCard` (`cards.go:594-599`) types the card by its **group directory** (`Combat`,
`Dice`) rather than a fixed word — `sc120-ref-rule-tile--dark.png` shows `COMBAT / ADJACENT`.
That is the right eyebrow to port when the SCC type is known.

**Shots.** before `…/sc120-before-rule--steel-dark.png` · site `…/sc120-ref-rule-tile--dark.png`.

**Head**: `eyebrow: m.type ? humanizeType(m.type) : 'Rule'` — `humanizeType` already exists
(`displayFamily.ts`), and for `rule.combat` it yields `Rule Combat`; prefer the **last** segment
(`Combat`) to match the site. `crestIcon: 'book-open'` — Lucide twin of MDI `book-open-variant`
(`cards.go:1287`).

**Bands**: 1 body, **policy (C)**.

**Implementation note for the owner:** adding `steel` to `genericLayout` gives the composition to
`ds-rule` *and* to any future `genericCard()` adopter. That is desirable, but it means the change
lands in `displayFamily.ts`, not `layouts.ts` — a different review surface. Schedule it last
(Batch C tail) so it cannot block the nine `layouts.ts` families.

---

## 4. Steel-scoped CSS surfaces

**Headline: nine of the ten families need ZERO new CSS.** Everything the compositions mount is
already styled by SC-100's block (`styles-source.css:6270-6460`), which was written generically
(its own comment at `:6320-6329`: *"Shared rule (CardLayout's generic SteelBand machinery, not a
kit-only selector) — any future `bands()` consumer inherits the fix for free"*).

Surfaces reused as-is:

| plugin selector | file:line | ported from (site) |
|---|---|---|
| `.dse-card > .dse-head` (head separator) | `styles-source.css:6293` | `.sc-kit__head`, `steel-kit.css:36-39` |
| `.dse-card__band` | `styles-source.css:6309` | `.sc-kit__band`, `steel-kit.css:50` |
| `.dse-card__band-head` | `styles-source.css:6325` | `.sc-kit__band-head`, `steel-kit.css:52` |
| `.dse-tiles`, `__cell`, `__value`, `__label`, `__cell--dmg` | `styles-source.css:6423-6450` + base geometry `:11878-11902` | `.sc-card__stats`/`.sc-card__stat`, `steel-redesign.css:196-215` |
| `.dse-card__flavor` | `styles-source.css:284` | `.sc-card__flavor`, `steel-redesign.css` |
| `.dse-card__badges`/`__badge--keyword` | `styles-source.css:252-282`, Steel fill `:6559` | `.sc-card__tags`/`.sc-tag` |
| `.dse-crest`, `.dse-crest--lg` | `styles-source.css:~11860` | `.sc-crest`, `steel-redesign.css:40-69` |

### 4.1 The two genuinely new CSS items (both shared, both in Batch A)

**(1) Variable column count on `.dse-tiles`.** Today the base geometry hardcodes
`grid-template-columns: repeat(4, 1fr)` (`styles-source.css:11878-11881`). Kit's two rows are
4-up so it never mattered; **class needs 3-up ×2 and treasure needs 2-up**. The site solves this
by emitting an inline `style="grid-template-columns:repeat(N,1fr)"` per grid (`cards.go:700`).
Plugin port: `repeat(var(--dse-tiles-n, 4), 1fr)`, with `statTiles()` setting
`row.style.setProperty('--dse-tiles-n', String(tiles.length))`. Default `4` keeps kit's frozen
bytes untouched by construction (the custom property is only written when it differs — or, more
simply, always written as `4` for kit, which computes identically). **This is a prerequisite for
class, career and treasure and must land before them.**

**(2) The right-deck caption line.** `cardHead()` renders right-column slots as `chip`
(`cardHead.ts:117-119`); class's `primary characteristics` deck wants the site's quiet caption
(`steel-class.css:21-24`: small `font-size`, `letter-spacing:.07em`, `--md-default-fg-color--lighter`).
One Steel-scoped rule on `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head
.dse-head__deck--right`, `font-size` from a `--dse-fs-*` role token (never a literal — plugin
`CLAUDE.md`; gated by `test/unit/build/fontSizeContract.test.ts`).

### 4.2 The dark-mode material rule (mandatory, from the ledger)

Any sunken surface these compositions add must use the site's **translucent black**, never
`--dse-surface-sunken`'s old white wash. Since SC-117 the token itself resolves correctly
(`rgba(0,0,0,.18)` dark / `rgba(0,0,0,.02)` light) — so: **reach for the token; hardcode a
literal only where the site measurably uses a different step.** The only step these compositions
touch is `.dse-tiles__cell`, which already carries the site's literal `rgba(0,0,0,.25)` /
`rgba(0,0,0,.04)` (`styles-source.css:6426-6435`) — no change needed.

**One deliberate non-port:** the site's class strip fills its cells with the OPAQUE page
background (`--md-default-bg-color`, `steel-class.css:51`), because the `.sc-classhead` plate
under it is `--fx-metal-faint` and a translucent fill would vanish. The plugin's `.dse-card` is
the normal gradient plate, not a metal-faint plate, so the **translucent** `.dse-tiles__cell`
value is correct there and the site's opaque exception must NOT be copied.

---

## 5. Shared helpers the compositions need

### 5.1 `plainText(md: string): string`

Strips markdown links to their text and drops emphasis markers, **preserving case** — required by
`statTiles()` values, which are `setText`-only (`statTiles.ts:54`). Needed by class (3 potency
tiles) and treasure (Roll Characteristic). `normalizeForDuplicateCheck` (`CardLayout.ts:187-194`)
does the same transform but also lowercases and collapses whitespace, so it cannot be reused
as-is. Recommended shape: extract the link/emphasis half of `normalizeForDuplicateCheck` into a
`stripInlineMarkdown()` and have both call it — one regex pair, not two that can drift. Mirrors
the site's own `stripMD`/`inlineMD` split (`cards.go`).

### 5.2 `stripLabeledLines(md: string, labels: string[]): string`

Generalizes `stripKitBodySections` (`layouts.ts:96-118`) from *headed sections* to *bold-labeled
lines*, which is the shape every non-kit family's duplication takes. Must match on the label's
**link text** — the labels themselves are markdown links in real data
(`**[Item Prerequisite](…):** …`, `**[Renown](…):** +1`). Consumers: career, treasure, title,
complication, culture (policy (B)). Non-consumers: class (policy (A)), ancestry/perk/condition/rule
(policy (C)).

**Risk to flag:** over-stripping. Mitigation — match only a whole line that (i) begins with `**`,
(ii) whose bold run's plain text equals one of `labels` (case-insensitive, trailing `:` allowed
inside or outside the bold run), and (iii) strip that line and any immediately following blank
line, **never** a following paragraph. Verified against every fixture in
`src/elements/display/*/example.yaml` plus the real `v2/docs/Browse/**` files as part of
implementation.

### 5.3 The empty-band-head guard (Scott's ledger comment 1)

See §8.

---

## 6. Proposed implementation batching

Three batches, ordered so each unblocks the next and the riskiest shared work lands with the
smallest family set.

### Batch C — head-only families *(land FIRST)*
**ancestry, perk, condition, rule** + Scott's empty-band-head guard (§8).

- **Zero new CSS.** Every surface already exists. This is pure `layouts.ts` band data
  (+ `displayFamily.ts` for rule).
- Proves the seam end-to-end on four families with no primitive changes, and gets four sanction
  asks moving while Batch A's shared work is written.
- **Freeze: 8 lines** — `{ancestry,perk,condition,rule}--steel-{print,realprint}.png`.
  `kit--steel-{print,realprint}.png` must stay **byte-identical**: the harness kit fixture is
  inline-mode with a signature ability, so the guarded branch is not exercised — kit staying green
  is itself the guard's regression check.

### Batch A — tile-grid families
**class, career** + the two shared CSS items (§4.1) + `plainText()` (§5.1).

- Contains all the primitive risk: `--dse-tiles-n`, the right-deck caption rule, the link
  stripper, and `languageCount`.
- `kit--steel-{print,realprint}.png` must again stay byte-identical after the `.dse-tiles` change —
  the strongest available proof that the generalization is behaviour-preserving.
- **Freeze: 4 lines** — `{class,career}--steel-{print,realprint}.png`.

### Batch B — labeled-line families
**treasure, title, complication, culture** + `stripLabeledLines()` (§5.2).

- Depends on Batch A only for treasure's 2-up tile row.
- Carries the body-policy risk (over-stripping), isolated to one helper with one test surface.
- **Freeze: 8 lines** — `{treasure,title,complication,culture}--steel-{print,realprint}.png`.

**Total across the effort: 20 frozen lines, 10 independent sanction asks.** Baseline stays at 210
lines (hashes only — 0 added, 0 removed), since every family already has a frozen pair (verified
against `.superpowers/sdd/freeze-baseline.sha256`, which lists all 11 families in both
`--steel-print.png` and `--steel-realprint.png` form, with identical hashes per pair — the
print-twin invariant).

**Per the `dse-verify` skill's freeze section, each batch's deliverable is:** a ready-to-apply
`.superpowers/sdd/sc120-d2-steel-compositions/rebaseline.txt` (`<sha256>  <filename>` lines,
verified deterministic across two clean `npm run shots` runs) plus before/after crops per family.
The worktree agent never edits the shared baseline; the ticket-owner gets Scott's per-family
sanction; the dispatcher applies at landing.

---

## 7. Open questions for the ticket-owner's judgment

1. **`treasure` crest icon.** Lucide has no `treasure-chest` (the site's MDI key,
   `cards.go:1266`). Recommend `package`; alternatives `box`, `archive`, `gem`.
2. **`complication` crest icon name.** Recommend Lucide `octagon-alert` (MDI `alert-decagram`),
   but the id was renamed from `alert-octagon` — must be verified against the Lucide version
   Obsidian bundles before it ships, or the crest silently renders empty (`crest.ts` degrades to
   nothing).
3. **Site self-inconsistency on two crests** — `culture` is `map` in `cards.go:1270` but
   `:material-earth:` on the Browse landing (`v2/docs/Browse/index.md:20`); `condition` is
   `lightning-bolt` in `cards.go:1271` but `:material-heart-broken:` on the landing
   (`index.md:60`). This design follows `cards.go` (the tile the plugin is porting). Worth a
   separate v2 ticket to reconcile the site with itself.
4. **Crest-name collisions with the statblock role vocabulary** — `users` (ancestry) is the minion
   role crest, `crown` (title) is the leader role crest, `zap` (condition) is the triggered-action
   crest (`statblock/view.ts:90-115`, `renderFeature.ts:163-183`). Different contexts, no
   selector overlap, but Scott may prefer distinct glyphs.
5. **Band-head labels with no site counterpart** — career's `Career Benefits`, class's `Basics` /
   `Potency`, treasure's `Project`. The site tile has no band heads at all. Alternative: headless
   tile rows (matching the site exactly, one less label per card).
6. **class body policy.** §3.1 recommends (A) keep whole, on site-parity grounds (the site's class
   page also repeats Basics below the head). If Scott would rather the composition win, class
   moves to policy (B) and the label list grows by six entries.
7. **`ds-rule`'s composition lives in `displayFamily.ts`, not `layouts.ts`** — it changes
   `genericCard()`'s shared layout, so any future model-less family inherits it. Confirm that is
   wanted before Batch C's tail.

---

## 8. Scott's ledger comment 1 — the kit hybrid-mode empty-band-head guard

**The defect.** In by-SCC hybrid mode, `kitLayout.steel.bands()` pushes the Signature Ability band
whenever `hybrid` is true, and only *inside* the band's `render()` discovers there is nothing to
show. By then `renderSteel()` has already created the band wrapper and painted its small-caps
head — so a hand-authored note whose body carries no signature-ability content renders a
"SIGNATURE ABILITY" label over empty space.

**Exact code sites.**

- `src/elements/display/layouts.ts:226` — `if (hybrid || m.signature_ability) {`
  — the unconditional-on-hybrid push.
- `src/elements/display/layouts.ts:227-228` — `bands.push({ head: 'Signature Ability', render: … })`
- `src/elements/display/layouts.ts:231-232` —
  ```ts
  const stripped = stripKitBodySections(source.body);
  if (!stripped.trim()) return undefined;
  ```
  — the emptiness is discovered here, **inside** `render()`, which is too late.
- `src/elements/shared/CardLayout.ts:379-383` — why it is too late:
  ```ts
  for (const band of composition.bands(model, this.source)) {
      const bandEl = card.createDiv({ cls: 'dse-card__band' });
      if (band.head) bandEl.createDiv({ cls: 'dse-card__band-head', text: band.head });
      await band.render(bandEl, (markdown, el) => this.renderMarkdown(markdown, el), this);
  }
  ```
  The wrapper and the head are created **before** `render()` runs, and a band's `render()` has no
  way to un-create them.

**Guard shape — hoist the emptiness test into `bands()`, do not add DOM surgery to
`renderSteel()`.** The precedent already exists three properties up in the same file: kit's flavor
band decides emptiness in the closure and simply does not push, with an explicit rationale at
`layouts.ts:172-175` — *"Suppressing a knowingly-empty band here (rather than pushing one that
renders nothing) keeps `renderSteel()`'s generic `.dse-card__band` wrapper from ever leaving a
stray empty div in the DOM."* The signature band should follow the same rule it states.

```ts
// layouts.ts, replacing :226-239
const hybridSig = hybrid ? stripKitBodySections(source.body) : undefined;
if (hybrid ? !!hybridSig?.trim() : !!m.signature_ability) {
    bands.push({
        head: 'Signature Ability',
        render: (container, renderMarkdown, owner) => {
            if (hybrid) {
                return renderMarkdown(hybridSig!, container.createDiv({ cls: 'dse-card__body' }));
            }
            renderFeatureList(container, FeatureConfig.allFrom([m.signature_ability!]), owner, renderMarkdown);
            return undefined;
        },
    });
}
```

Three properties of this shape worth stating explicitly:

- `stripKitBodySections` runs **once**, not once per branch — the current code recomputes it
  inside `render()`, so hoisting removes a duplicate call rather than adding one.
- The `render()` closure's `if (!stripped.trim()) return undefined` early-out becomes dead and is
  deleted; the guard now lives where it can actually prevent the head.
- **`renderSteel()` is not touched.** A generic "remove the band if it ended up empty" pass there
  was considered and rejected: `render()` is `async` and free to mount asynchronously, so
  post-hoc emptiness is not reliably observable, and the layout already owns band-existence policy
  by design (`CardLayout.ts:88-91`: *"The band's actual CONTENT is a per-card-type concern"*).

**Verification.** Corpus-safe today (no tooling produces a kit note with no signature ability), so
the regression evidence is negative: `kit--steel-print.png` and `kit--steel-realprint.png` must
come back **byte-identical** after the change. A DOM test asserting "hybrid + empty stripped body
⇒ no `.dse-card__band-head` in the card" is the positive check; the existing by-SCC kit DOM
suite is the right home.

---

## 9. What round 1 did NOT change

No file under any repo was modified. The only writes are this document and the PNGs in
`.superpowers/sdd/sc120-d2-steel-compositions/`. `npm i` + `npm run shots` ran in the worktree's
`draw-steel-elements/` and produced `visual-harness/shots/` (git-ignored build output) — all 118
print-twin capture ids reported parity OK, and the nested-corner-radius assertion passed.
