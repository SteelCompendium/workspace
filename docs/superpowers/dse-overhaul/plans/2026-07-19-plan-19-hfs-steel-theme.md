# Plan 19 — High-Fantasy Steel: port the v2 site look into the DSE "Steel" theme (SC-10)

> **STATUS 2026-07-19: BUILT — SHIP (opus whole-branch verdict).** All 8 tasks landed
> (plugin `ffbfec7..40d341e`). Gates at tip: tsc · jest **1981** · shots **295** ·
> obsidian-shots **131** (8-family real-Obsidian visual audit clean). Legacy freeze proven
> empirically (only sanctioned hero-grid fix drifts, incl. its steel-print improvement).
> Steel now matches the site's HFS language: bundled Source Serif 4 (OFL), forged
> cards/chips/rails, crest badges, ◆ grammar, role-tinted statblock plate, featureblock
> band+glyphs, purple temp-stamina, teal links. Open for Scott: statblock-head crest
> deviation (1-line revert), spend-title paren nit. Records: Linear SC-10 + ledger.

> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement task-by-task. Steps use checkbox
> (`- [ ]`) syntax. Screenshot review is **load-bearing** at every step (the shots harness is a
> render-exception catcher, NOT a pixel-diff CI — §3 recon): every task ends by READING the
> re-shot PNGs and comparing against the named site reference.

**Program:** DSE Overhaul — plan **19** (SC-10 High-Fantasy Steel port). Spec of intent:
workspace `DESIGN.md` ("High-Fantasy Steel"). Recon: `hfs-recon.md`. Taste calls resolved:
`workspace/.superpowers/sdd/sc-10-decisions.md`.
**Written:** 2026-07-19, against the BUILT framework at worktree `f2`, plugin tip **`ffbfec7`**
(jest **1970** green). Exemplar structure: `2026-07-18-plan-18-d7-hero-suite.md` (same dir).

---

## Preamble — ground truth, and where the recon is WRONG

The recon (`hfs-recon.md` §0–§2) reads the plugin as a near-blank Steel slate — "6-slot card
header **not implemented**", "◆ diamond motif **absent entirely** in feature/featureblock
cards", crest "**MISSING**", meta "rendered as plain inline label:value lines with no
chip/eyebrow treatment." **That is materially wrong at tip `ffbfec7`** (verified by reading the
source, not just the shots). Corrections — the plan is scoped to them:

1. **The 6-slot head grammar is ALREADY PORTED and WIRED.** `src/framework/kit/cardHead.ts`
   builds the exact `.dse-head` 3-lane×2-column grammar (positional `dse-head__{lane}--{side}`
   + `--line`/`--chip` render styles — a faithful port of the site's `.sc-head` /
   `steel-cardhead.css`), and it is **already called** by `feature/renderFeature.ts:139`,
   `statblock/view.ts:132`, `featureblock/view.ts:78` (plus roll/negotiation/montage/project/
   encounter/party). The plugin ability shot (`02-ability-card--plugin-dark.png`) proves it:
   the right rail renders two real chips ("5 Malice", "Villain Action 1"). **We do NOT build a
   new head grammar — we PORT the remaining Steel *styling* and fill the empty slots.**
2. **The ◆ diamond rule is a shipped kit component and is wired.** `kit/divider.ts`
   `{ornament:true}` emits `.dse-hr__diamond`; `statblock/view.ts:207` and
   `featureblock/view.ts:133` already call it under the header. `feature` (ability) cards do
   **not** yet get one; the ◆-in-eyebrow and ◆-in-section markers are separate and unbuilt.
3. **`kit/crest.ts` exists (`.dse-crest`, `--dse-crest-shape` polygon in the Steel layer) but
   is consumed by NO element view** (`grep "crest:"` → none). Crest is a genuine wiring gap.
4. **The Distance/Target rail structure exists.** `feature/renderFeature.ts` emits
   `.dse-feature__meta` cells (`--keywords/--type/--distance/--target`) with `-key`/`-value`
   spans; the Legacy base **hides the keys** and the Steel reveal/boxing is the gap — not the
   DOM.
5. **`.dse-section` titled panels exist and Steel already embosses `.dse-section__title`**
   (styles-source ~3178). The colon is CSS-owned (`::after{content:": "}`) precisely so Steel
   can swap to a boxed "◆ EFFECT" header — that swap is the gap.
6. **The Steel token spine is DONE** (styles-source `[data-dse-element][data-dse-theme="steel"]`
   ~3053–3135 + light ~3207): surfaces, border, accent teal, role hues, action-type hues, tier
   colors, `--fx-*` analogs (`--dse-metal-grad/-bevel/-emboss/-card-bg/-crest-shape`), radius —
   all present and value-matched to `palette.css`/`steel-*.css`. **The single highest-leverage
   real gap is that `--dse-font-display: "Source Serif 4", …` is declared but NO `@font-face`
   ships the file** — so today every Steel title silently falls back to Obsidian's sans UI font
   (Steel ≈ Legacy typographically). Task 1 fixes exactly this.

**Net:** the color spine + head/◆/section/meta DOM are in place; what's missing is (a) the
FONT, (b) the Steel *typographic* treatment (uppercase display, stronger emboss, small-caps
◆-eyebrow), (c) crest wiring + empty-slot fills, (d) boxed Distance/Target rail, (e) boxed
"◆ EFFECT" section headers + dashed keyword-spend box, (f) role-tinted statblock/featureblock
header bands + glyphs, (g) the teal link-color retarget, (h) tracker palette harmonization.

### Standing decisions folded in

- **JetBrains Mono bundling is DEFERRED to Scott** (recon §3 flag). This plan leaves
  `--dse-font-mono: var(--font-monospace)` (Obsidian's configured mono) untouched — an
  accepted Obsidian norm; no code/ID face is bundled.
- **Print / Legacy-print tokens are UNTOUCHED** (SC-4 parked; recon §4 / `sc-10-decisions.md`
  §4). No task edits the print layer (`styles-source.css` "Print / export layer") or any
  `[data-dse-print="on"]` rule. `<id>--steel-print.png` shots must stay byte-identical.
- **The four "Scott review" taste calls are RESOLVED by "match the site"** — what the site
  actually does, verified from `v2/docs/stylesheets/` + `DESIGN.md`:

  | # (`sc-10-decisions.md`) | What the SITE does | Encoded value | Where |
  |---|---|---|---|
  | 1 — stamina **temp** color | Site has **no temp-stamina bar** (trackers are plugin-only), but `--sc-act-maneuver` **blue** is a reserved site action-type hue; DESIGN.md: "saturated color = one signal per color." Using blue for temp would collide with Maneuver. | **purple `#7c5cd6`** (flip from shipped `#5dade2`) — frees blue for Maneuver, sits outside the HP ramp | Task 6 |
  | 2 — crit / VP color | Site reserves teal accent for links/tabs/focus/badges **only**; it paints crit/VP in **no** shared color and has no `--sc-tier-crit`. Accent-reuse would violate "one signal per color." | **keep gold `#e3c14a`** (a free hue) — already shipped; no change | (already correct) |
  | 3 — act-spine hues | Site ships `--sc-act-*` canonically (Main red / Maneuver blue / Triggered green / Move orange / None / Trait purple) per DESIGN.md + `steel-ability-cards.css`. | **keep `--sc-act-*` chaining** — already shipped; no change | (already correct) |
  | 4 — Legacy print mono vs color | Print layer deliberately keeps meaning-bearing color. **PARKED (SC-4)** — out of scope. | **untouched** | — |

  So of the four, only **#1 (temp → purple)** is a live change (one token, Task 6); #2/#3 are
  already site-correct; #4 is parked.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Worktree only.** All work in `/home/scott/code/steelCompendium/worktrees/f2` — never the
  shared main checkout. Every command runs from the worktree root as
  `devbox run -- bash -c 'cd draw-steel-elements && <cmd>'` (node/npm/just are NOT on the
  system PATH; the workspace `v2/docs/stylesheets/` is **READ-ONLY** reference).
- **Steel-scoped only; Legacy is the base and is FROZEN.** Every CSS rule this plan adds is
  scoped under `[data-dse-theme="steel"]` (dark) / `.theme-light [data-dse-theme="steel"]`
  (light), following the existing isolation (recon §Legacy-isolation). **Never edit the
  unscoped `:root` Legacy block, and never add a `data-dse-theme="legacy"` scope** (Legacy IS
  the base).
- **DOM changes are THEME-AGNOSTIC — same DOM, CSS decides.** When a task must add DOM (a
  crest span, a filled eyebrow slot, a ◆ marker), it emits that DOM in **both** themes and the
  **Legacy base neutralizes it** (`display:none` / unstyled), exactly like the shipped pattern
  (`.dse-crest{display:none}` in Legacy; `.dse-feature__meta-key` hidden in Legacy). Each task
  that touches a view calls this out explicitly and proves it with the Legacy-freeze gate. No
  per-theme DOM branching in view code.
- **LEGACY-FREEZE gate (the "original theme untouched" proof).** Every task re-shoots and
  confirms the touched element's **`<id>--legacy-dark.png` AND `<id>--legacy-light.png` are
  pixel-identical to their pre-task baseline** (byte-identical is the expectation — Legacy
  tokens + Legacy DOM styling are untouched; the harness re-renders deterministically). Any
  Legacy drift means a rule leaked out of the Steel scope → fix the scope, do not accept the
  drift. `<id>--steel-print.png` is likewise frozen (SC-4 parked).
- **Screenshot verification is load-bearing (recon §3).** The shots harness only flags render
  exceptions, not visual drift. Each task: (1) shoot the element BASELINE first; (2) implement;
  (3) re-shoot; (4) **READ** the new `<id>--steel-{dark,light}.png` PNGs and compare against the
  **named** `shots-hfs-recon/NN-*--site-{dark,light}.png` reference; (5) run the Legacy-freeze
  gate. `npm run obsidian-shots` (real Obsidian) is the sign-off gate in Task 8.
- **Gates per task:** `npm run tsc` clean **and** full `npx jest` green (**1970 baseline** at
  `ffbfec7`; CSS-only tasks add 0 tests, view-touching tasks may add a small DOM assertion).
  A task that adds/removes no test keeps the count at 1970.
- **No new runtime dependencies; no new game rules; content frozen.** The only new files are
  the bundled OFL font woff2(s) + their `OFL.txt` license. No wording/values change (DESIGN.md
  non-negotiable #1). `isDesktopOnly:false` stays — fonts are bundled (offline/mobile), never
  fetched (obsidianmd network-call norms; recon §3).
- **Persisted serialize paths are UNTOUCHED — byte-stability.** This is a look-only plan; no
  `model.ts`/`serialize`/`parse` edits, no schema edits. Every persisted round-trip test stays
  green UNMODIFIED. If a change would touch a serialize path, it is out of scope.
- **Commits:** conventional-commit style inside `draw-steel-elements`, one commit per task.
  **No AI/co-author attribution trailers** (global preference).
- **Assumed landed (verify in preflight):** the `--dse-*` Steel token layer (D3/Plan 10), the
  kit `cardHead`/`crest`/`divider`/`powerRollPanel`, the migrated `feature`/`statblock`/
  `featureblock`/`stamina-bar`/`initiative` views, and the D7 hero suite (`hero`/`conditions`/
  `resource`/`surges`/`tokens` — jest 1970, elements 32).

---

## File Structure

```
draw-steel-elements/
  styles-source.css                    MODIFY  every task — the single CSS source (→ main.css → styles.css)
  assets/fonts/                         NEW     Task 1 — SourceSerif4-*.woff2 (OFL) + OFL.txt license
  src/framework/kit/
    crest.ts                            (reuse) Task 2/3 — already exists; wired by views, not changed
    cardHead.ts                         (reuse) Task 2 — already the 6-slot grammar; may gain a leftEyebrow fill helper
  src/elements/
    feature/renderFeature.ts            MODIFY  Task 2/3 — pass crest + leftEyebrow kind-noun (theme-agnostic DOM)
    statblock/view.ts                   MODIFY  Task 4 — pass crest (theme-agnostic); header-band hook
    featureblock/view.ts                MODIFY  Task 5 — per-option glyph hook (theme-agnostic)
    stamina-bar/view.ts                 MODIFY  Task 6 — retarget raw color literals → --dse-stamina-* tokens
    initiative/view.ts                  MODIFY  Task 6 — retarget raw color literals → tokens (if any hardcoded)
  visual-harness/shots/                 (output) re-shot each task; site refs in workspace .superpowers/sdd/shots-hfs-recon/
  docs/superpowers/dse-overhaul/D3-token-map.md   MODIFY  Task 8 — record the temp-color flip + font row
  CHANGELOG.md (plugin)                 MODIFY  Task 8 — 6.x SC-10 Steel look
  workspace CHANGELOG.md / DESIGN.md    MODIFY  Task 8 — Unreleased bullet + DESIGN.md pointer note
```

**Dependency order:** Task 1 (typography + link color — unblocks every card's look) → Task 2
(shared head grammar completion: ◆ + crest wiring + slot fills) → Task 3 (ability/feature card
treatment) → Task 4 (statblock plate) → Task 5 (featureblock band) → Task 6 (trackers + hero
harmonization) → Task 7 (reference-card polish) → Task 8 (final sweep + docs). Tasks 3–7 all
build on the Task 1 font + Task 2 head grammar.

---

### Task 1: Typography foundation — bundle Source Serif 4 (OFL), wire `@font-face` into the Steel layer, uppercase/emboss display + small-caps eyebrow, link-color accent fix

The single highest-leverage gap (recon §0/§3, breakdown #1–#2). Ship the actual font so
`--dse-font-display` resolves; add the Steel typographic treatment (uppercase display + emboss +
small-caps ◆-eyebrow) the tokens were declared for; retarget in-card links to the teal accent.
**CSS + assets only — no view/DOM change**, so every element's Legacy PNG is trivially frozen.

**Why bundle, not fetch (recon §3):** the site hotlinks commercial faces from a CDN — forbidden
for a shipped, mobile-capable plugin. DESIGN.md names **Source Serif 4** as the graceful OFL
fallback; bundle it as woff2 in the package (a few KB, offline, no network).

**Files:** create `assets/fonts/SourceSerif4-SemiBold.woff2`, `SourceSerif4-Bold.woff2` (Latin
subset), `assets/fonts/OFL.txt` (the SIL Open Font License text that ships with Source Serif 4);
modify `styles-source.css`.

**Bundling mechanism (single-file safe):** Obsidian loads only `styles.css` (esbuild copies the
bundled `main.css` → `styles.css`; `main.ts` imports `styles-source.css`). Embed each woff2 as a
**base64 `data:` URI directly in the `@font-face src`** in `styles-source.css` — zero build-config
change, guaranteed to travel in the one CSS file, no `app://` path resolution. (Alternative, if a
data-URI bloats review: add a `.woff2 → 'dataurl'` esbuild loader and `url(./assets/fonts/…woff2)`;
default to inline base64.) The raw woff2 + `OFL.txt` are still committed under `assets/fonts/` as
the license-compliance record even though the CSS carries the base64 copy.

**CSS (all Steel-scoped — Legacy never sees the face):**
- `@font-face { font-family:"Source Serif 4"; font-weight:600; src:url("data:font/woff2;base64,…") format("woff2"); font-display:swap; }` (+ a `700` face). `@font-face` is global by nature, but it only takes effect where `--dse-font-display` names "Source Serif 4" — i.e. the Steel layer (`--dse-font-display:"Source Serif 4",var(--font-text)` at ~3070). Legacy's `--dse-font-display:var(--font-text)` never references it.
- **Display treatment** (extend the existing `[data-dse-theme='steel'] .dse-head__primary--left` rule ~3183): add `text-transform:uppercase; font-weight:700;` so the primary title reads as the site's UPPERCASE display line (`02-ability-card--site-dark.png` — "BLACK ASH TELEPORT"). Keep the shipped `text-shadow:var(--dse-emboss)` + `font-family:var(--dse-font-display)`.
- **Small-caps eyebrow** (Steel-scoped, new rule on `.dse-head__eyebrow--line`): `font-variant:small-caps; letter-spacing:.07em; text-transform:lowercase;` + a leading ◆ via `::before` (`content:""; width:.36rem; height:.36rem; transform:rotate(45deg); background:var(--dse-metal-line);`) — the site's `steel-cardhead.css` eyebrow. (The eyebrow *content* fill is Task 2; this styles it when present.)
- **Link color fix** (recon breakdown #2, highest cross-family value): Steel-scoped
  `[data-dse-theme='steel'] .dse-feature a, … .dse-sb a, … .dse-fb a, … .dse-section__body a { color:var(--dse-accent); }` (+ hover). Retargets in-card markdown links off Obsidian's violet `--link-color` onto steel-teal — visible in `02/03/04/05-*--site` (teal `teleport`/`concealment`).

- [ ] **Step 1: Baseline shots.** `devbox run -- bash -c 'cd draw-steel-elements && npm run shots'` — capture the current `feature--steel-dark.png`, `statblock--steel-dark.png`, `conditions--steel-dark.png` (sans-serif titles, violet links) and the Legacy baselines `feature--legacy-{dark,light}.png` etc. READ `feature--steel-dark.png` and confirm the title is the sans UI font (the bug).
- [ ] **Step 2: Obtain + commit the OFL font.** Place `SourceSerif4-SemiBold.woff2`, `SourceSerif4-Bold.woff2` (Latin subset, from the official OFL Source Serif 4 release) + `OFL.txt` under `assets/fonts/`. Document the license addition in the commit body (SIL OFL 1.1, redistributable). **No CDN reference anywhere.**
- [ ] **Step 3: Wire `@font-face` (base64) + display/eyebrow/link CSS into the Steel scope** of `styles-source.css`. Build: `devbox run -- bash -c 'cd draw-steel-elements && npm run build'` (or the harness build) so `styles.css` picks up the face.
- [ ] **Step 4: Re-shoot + READ + compare.** `npm run shots`. READ `feature--steel-dark.png` / `--steel-light.png` and `conditions--steel-dark.png`; compare titles against `shots-hfs-recon/02-ability-card--site-dark.png` (uppercase serif display) and links against `04-kit-card--site-dark.png` (teal). Titles must now be UPPERCASE Source Serif; in-card links teal.
- [ ] **Step 5: LEGACY-FREEZE gate + full gates.** READ `feature--legacy-dark.png`/`-light.png`, `statblock--legacy-dark.png`, `conditions--legacy-dark.png` — **pixel-identical to Step 1** (Legacy never names the serif; links untouched). Confirm `<id>--steel-print.png` unchanged (SC-4).
```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npx jest'
git -C draw-steel-elements add assets/fonts styles-source.css
git -C draw-steel-elements commit -m "feat(steel): bundle Source Serif 4 (OFL) @font-face + uppercase/emboss display + small-caps ◆ eyebrow + teal in-card links (SC-10 typography)"
```

---

### Task 2: Complete the shared ◆ diamond-rule + 6-slot head grammar in Steel (crest wiring + eyebrow slot fills + section/eyebrow ◆ markers)

The grammar is already ported (`kit/cardHead.ts`) and wired (feature/statblock/featureblock).
This task **completes** it for Steel: wire the existing `kit/crest.ts` into the card heads, fill
the empty `leftEyebrow` kind-noun slots, and add the ◆ marker on eyebrows + a boxed-header hook
on `.dse-section`. **No new grammar is invented — we port the site's `.sc-head`/`.sc-crest`/◆
behavior onto the DOM that already exists.**

**THEME-AGNOSTIC DOM constraint (explicit):** the crest `<span>` and the filled `leftEyebrow`
slot are emitted in **both** themes. The Legacy base already ships `.dse-crest{display:none}`; add
a Legacy neutralization for any newly-filled eyebrow (`:root … .dse-feature .dse-head__eyebrow{display:none}` — i.e. feature cards show no eyebrow in Legacy, exactly as today). Steel reveals both. View code never checks the theme.

**Files:** modify `src/elements/feature/renderFeature.ts` (pass `crest:{icon,size:'lg'}` +
`leftEyebrow` kind-noun to `cardHead`), `styles-source.css`. (`statblock`/`featureblock` crest
wiring lands in Tasks 4/5 with their header bands; this task does feature + the shared CSS.)

**Interfaces / wiring:**
- `renderFeature.ts`: at the `cardHead(...)` call (~139), add `leftEyebrow: feature.ability_type ? 'Ability' : (kind-noun)` — the site's "◆ ABILITY" eyebrow (`02-ability-card--site-dark.png`) — and `crest: { icon: <lucide-for-action-type>, size:'lg' }` keyed to the action type (person/shield/etc; icon map is a small pure helper, glyph-font-parity not required — Lucide thin-line per DESIGN.md iconography "Material thin-line second"). The crest degrades to nothing without an icon and is `display:none` in Legacy.
- Steel CSS: the `.dse-crest` shield already consumes `--dse-metal-grad/-line/-bevel/-crest-shape` (~3783). Confirm the `--lg` card-header size matches the site crest scale in `02-ability-card--site-dark.png`. Add the ◆ eyebrow `::before` (Task 1 shipped the eyebrow style; ensure the marker renders for the newly-filled slot).
- Boxed section header hook: Steel-scope `.dse-section__title` → drop the CSS colon (`::after{content:""}` under Steel) and render a boxed "◆ EFFECT" band (`text-transform:uppercase; small-caps; a leading ◆`); the `.dse-section__body` moves to `display:block`. (Full section boxing detail is Task 3; here we establish the shared Steel `.dse-section` header treatment.)

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `feature--steel-dark.png` (no crest, empty eyebrow) + `feature--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Wire crest + leftEyebrow in `renderFeature.ts`** (theme-agnostic; add the Legacy eyebrow-hide rule in the base block). Add the Steel `.dse-crest--lg` + ◆ eyebrow + `.dse-section` boxed-header CSS.
- [ ] **Step 3: tsc + jest.** `devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npx jest'` — add/adjust the feature DOM test only if a crest/eyebrow assertion is warranted (DOM present in both themes; no serialize touch). Baseline stays 1970 unless a DOM assertion is added.
- [ ] **Step 4: Re-shoot + READ + compare.** `npm run shots`. READ `feature--steel-dark.png`/`--steel-light.png`; compare crest + "◆ ABILITY" eyebrow + boxed section header against `shots-hfs-recon/02-ability-card--site-dark.png`.
- [ ] **Step 5: LEGACY-FREEZE gate.** READ `feature--legacy-dark.png`/`-light.png` — **pixel-identical to Step 1** (crest hidden, eyebrow hidden, section colon intact in Legacy). Commit.
```bash
git -C draw-steel-elements add src/elements/feature/renderFeature.ts styles-source.css test
git -C draw-steel-elements commit -m "feat(steel): wire crest + ◆ eyebrow kind-noun + boxed section header into the shared card head (Legacy frozen) (SC-10 head grammar)"
```

---

### Task 3: Ability / feature card treatment — crest badge, embossed title, chips, boxed Distance/Target rail, ◆ EFFECT sections, dashed keyword-spend box

Close the ability-card family to `02-ability-card--site-dark.png` (recon breakdown #2). The
head/crest/eyebrow (Task 2), font (Task 1), and `.dse-feature__meta` cells + `.dse-section`
panels already exist — this task is the Steel **boxing/reveal** of the rail + sections + the
dashed spend clause. **Almost entirely CSS**; any DOM addition (a spend-clause wrapper class) is
theme-agnostic + Legacy-neutralized.

**Files:** modify `styles-source.css`; possibly a class hook in `renderFeature.ts` for the
keyword-spend clause (only if not already class-tagged — verify first; the SDK spend clause may
already be a `.dse-section--special`).

**Steel CSS (scoped):**
- **Distance/Target rail:** reveal `.dse-feature__meta-cell--distance/--target` as the two boxed chips of `02-ability-card--site-dark.png` — surface-raised box, `--dse-border`, radius, centered value over a small-caps `-key` label (un-hide `.dse-feature__meta-key` in Steel). Keywords/Type stay their small-caps eyebrow chips.
- **Chips:** the right-rail `--chip` slots already get `--dse-metal-faint` (~3190); confirm they match the site's forged pill (`LEVEL 1`, `MANEUVER`).
- **◆ EFFECT sections:** finish the Task-2 `.dse-section` Steel header into the site's boxed panel — a raised inset (`--dse-surface-sunken`), a ◆ + uppercase small-caps title, block body.
- **Dashed keyword-spend box:** the "SPEND 1+ INSIGHT" clause (`02-ability-card--site-dark.png` bottom) → a dashed `--dse-border` box with the spend label as a forged chip. Scope to the special/spend section modifier.
- **Act spine reserve:** the `[data-dse-theme='steel'] .dse-feature[data-dse-act]{padding-left:…}` reserve (~3143) already exists; confirm the crest doesn't double the left inset.

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `feature--steel-dark.png` + Legacy baselines.
- [ ] **Step 2: Implement the Steel rail/section/spend CSS** (+ verify/add the spend-clause class hook, theme-agnostic, Legacy-neutralized).
- [ ] **Step 3: tsc + jest** (1970 baseline; DOM assertion only if a class was added).
- [ ] **Step 4: Re-shoot + READ + compare** `feature--steel-dark.png`/`--steel-light.png` against `shots-hfs-recon/02-ability-card--site-dark.png` (+`--site-light.png`): boxed Distance/Target rail, ◆ EFFECT panels, dashed spend box, crest, uppercase title.
- [ ] **Step 5: LEGACY-FREEZE gate.** `feature--legacy-{dark,light}.png` pixel-identical to Step 1. Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/feature/renderFeature.ts test
git -C draw-steel-elements commit -m "feat(steel): ability card — boxed distance/target rail + ◆ EFFECT panels + dashed spend box (match site) (SC-10)"
```

---

### Task 4: Statblock plate — outer forged card, role-tinted header band, boxed stat rows, crest

The largest before/after (recon breakdown #1, `01-statblock--site-dark.png`). The Steel token
`--dse-card-bg`/`-bevel` rule already grounds `.dse-sb` (~3152) and `data-dse-role` role tokens
exist; this task adds the **role-tinted gradient header band**, **boxed stat/characteristics
rows**, wires the **crest** into the statblock head, and confirms the ◆ rule under the header
(already emitted by `statblock/view.ts:207`). Statblock body typography (small-caps labels, big
numerals) rides the Task-1 font + emboss.

**Files:** modify `styles-source.css`; `src/elements/statblock/view.ts` (pass `crest:` to the
head — theme-agnostic, Legacy-neutralized; the header-band is CSS keyed off the existing
`data-dse-role` attribute, no new DOM needed).

**Steel CSS (scoped):**
- **Header band:** a role-tinted gradient strip behind `.dse-head` using `var(--dse-role-<role>)` (set via the shipped `data-dse-role`) — the pink "Horde Harrier" band of `01-statblock--site-dark.png`. Steel-only; Legacy header stays flat.
- **Boxed stat rows:** the 5-stat row + immunity/weakness/movement + characteristics rows (`.dse-statgrid`, `.dse-sb__*` stat cells) → boxed grid cells (`--dse-surface-sunken`, hairline), small-caps `-key` labels, embossed big `.dse-statgrid__value` (emboss already at ~3180).
- **Single-plate hygiene:** the shipped rule zeroing the statblock root background (~3166) already prevents double plates — confirm the band + outer `.dse-sb` border read as one forged plate, not nested boxes.

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `statblock--steel-dark.png` (flat stack today) + `statblock--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Wire crest into the statblock head + implement the Steel band/boxed-row CSS.**
- [ ] **Step 3: tsc + jest** (1970; DOM assertion only if crest wiring warrants).
- [ ] **Step 4: Re-shoot + READ + compare** `statblock--steel-dark.png`/`--steel-light.png` against `shots-hfs-recon/01-statblock--site-dark.png` (+`--site-light.png`): one continuous forged plate, role-tinted band, boxed stat rows, ◆ rule, embossed numerals.
- [ ] **Step 5: LEGACY-FREEZE gate.** `statblock--legacy-{dark,light}.png` pixel-identical to Step 1 (band/boxing Steel-scoped; role tokens are leader-grey in Legacy). `statblock--steel-print.png` unchanged (SC-4). Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/statblock/view.ts test
git -C draw-steel-elements commit -m "feat(steel): statblock forged plate — role-tinted header band + boxed stat rows + crest (match site) (SC-10)"
```

---

### Task 5: Featureblock band + per-option glyphs + ◆ rule

The closest family already (recon breakdown #3, `03-featureblock--site-dark.png`): colored left
border + boxed malice-cost chip already correct; the ◆ rule is already emitted
(`featureblock/view.ts:133`). This task adds the **grey gradient header band** and the
**per-option glyph icon** (star/skull/square), keyed to the SDK's option type.

**Files:** modify `styles-source.css`; `src/elements/featureblock/view.ts` (add a
theme-agnostic per-option glyph span — `.dse-fb__feat-icon` twin already referenced in the
site's `steel-cardhead.css`; Legacy-neutralize with `display:none` in the base).

**Steel CSS (scoped):** grey (`--dse-role-*` grey / `--dse-metal-grad`) header band behind the
featureblock `.dse-head`; the per-option glyph styled as the site's star/skull/square (glyph
font or Lucide thin-line per DESIGN.md); confirm the colored left border + malice chip are
unchanged (already correct).

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `featureblock--steel-dark.png` + `featureblock--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Add the theme-agnostic glyph span (Legacy-hidden) + Steel band/glyph CSS.**
- [ ] **Step 3: tsc + jest** (1970; DOM assertion for the glyph span if added).
- [ ] **Step 4: Re-shoot + READ + compare** `featureblock--steel-dark.png`/`--steel-light.png` against `shots-hfs-recon/03-featureblock--site-dark.png` (+`--site-light.png`): header band + glyphs + ◆ rule; left border/malice chip preserved.
- [ ] **Step 5: LEGACY-FREEZE gate.** `featureblock--legacy-{dark,light}.png` pixel-identical to Step 1. Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/featureblock/view.ts test
git -C draw-steel-elements commit -m "feat(steel): featureblock forged band — grey header + per-option glyphs (match site) (SC-10)"
```

---

### Task 6: Trackers + hero-sheet harmonization (stamina/initiative palette → tokens; temp-color purple; hero-sheet Steel chrome)

Lowest structural gap (recon breakdown #5) — no 1:1 site component, so this is **palette
harmonization + the one live taste flip**, not a structural port. The Steel `--dse-stamina-*`/
`--dse-turn-done`/`--dse-malice` tokens already carry harmonized values; retarget the view CSS's
raw color literals (`limegreen`/`yellow`/`red`) onto them, and flip the temp color to **purple**
(taste pick #1). Harmonize the D7 hero sheet (`ds-hero`) to the shared head/panel Steel chrome.

**Files:** modify `styles-source.css` (temp token flip + any raw literals in the trackers'
scoped CSS); `src/elements/stamina-bar/view.ts` / `initiative/view.ts` **only if** a color is
hardcoded in JS/inline-style rather than a token (verify first — prefer moving literals into
`--dse-*` tokens, keeping DOM/serialize untouched).

**Changes:**
- **Temp-stamina purple (taste #1):** `--dse-stamina-temp: #7c5cd6;` in the Steel block (~3099, currently `#5dade2`). Frees blue for Maneuver; sits outside the HP ramp. (Legacy base `deepskyblue` untouched.)
- **Raw-literal retarget:** any `limegreen`/`yellow`/`red`/`orange` in a stamina/initiative Steel-scoped rule → the matching `--dse-stamina-*`/`--dse-tier-*`/`--dse-turn-done`/`--dse-malice` token. **Legacy keeps its raw literals** (the tokens resolve to them in the Legacy base) — verify no Legacy drift.
- **Hero sheet (`ds-hero`):** confirm its regions (characteristics grid, stamina+recoveries, resource/surges/conditions panels) inherit the shared Steel head/section/chip chrome from Tasks 1–3; add any Steel-scoped hero-specific polish (e.g. `.dse-hero__*` embossed section titles) — theme-agnostic DOM, Legacy frozen.

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `stamina-bar--steel-dark.png`, `initiative--steel-dark.png`, `hero--steel-dark.png` + their `--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Flip temp token + retarget literals to tokens + hero Steel polish** (all Steel-scoped; verify no view serialize/DOM change).
- [ ] **Step 3: tsc + jest** (1970 baseline; no serialize tests touched).
- [ ] **Step 4: Re-shoot + READ + compare.** READ `stamina-bar--steel-dark.png` (temp band now purple, HP ramp on tokens), `initiative--steel-dark.png`, `hero--steel-dark.png`/`--steel-light.png`. No like-for-like site ref — compare temp/HP against `shots-hfs-recon/07-stamina-bar--plugin-dark.png` (before) and confirm the DESIGN.md palette intent (semantic-only color); hero sheet reads as a cohesive Steel plate.
- [ ] **Step 5: LEGACY-FREEZE gate.** `stamina-bar--legacy-{dark,light}.png`, `initiative--legacy-{dark,light}.png`, `hero--legacy-{dark,light}.png` pixel-identical to Step 1 (tokens resolve to the same Legacy literals). Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/stamina-bar/view.ts src/elements/initiative/view.ts test
git -C draw-steel-elements commit -m "feat(steel): harmonize tracker palette onto --dse-* tokens + temp-stamina purple (taste #1) + hero-sheet Steel chrome (SC-10)"
```

---

### Task 7: Reference-card polish — `ds-conditions` / generic reference cards (body typography + link color)

No like-for-like site component (recon breakdown #6 — conditions live as plain H2 glossary
sections on-site, no boxed per-term card). Per the recon recommendation, style the plugin's
`ds-condition`/generic reference cards with the **body typography + teal link tokens** (Task 1)
so a term reads as "a clipping of the site's prose in a small frame," rather than inventing new
chrome. The violet-link bug is already fixed by Task 1's blanket in-card link rule — verify it
reaches these cards. **CSS only.**

**Files:** modify `styles-source.css` (Steel-scoped `.dse-conditions`/generic-card body + link
inheritance).

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `conditions--steel-dark.png` + `conditions--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Steel-scope the reference-card body typography + confirm teal links** (small frame, serif/emboss title, prose body).
- [ ] **Step 3: tsc + jest** (1970).
- [ ] **Step 4: Re-shoot + READ + compare** `conditions--steel-dark.png`/`--steel-light.png` against `shots-hfs-recon/05-condition-rule--site-dark.png` (tone parity — teal links, serif heading) AND re-read the site Conditions glossary tone note in the recon (no boxed chrome to mirror structurally).
- [ ] **Step 5: LEGACY-FREEZE gate.** `conditions--legacy-{dark,light}.png` pixel-identical to Step 1. Commit.
```bash
git -C draw-steel-elements add styles-source.css
git -C draw-steel-elements commit -m "feat(steel): reference-card polish — body typography + teal links (site prose parity) (SC-10)"
```

---

### Task 8: Final sweep — full batteries (shots + obsidian-shots), docs, CHANGELOG

Finalize: run both camera batteries at their counts, READ the real-Obsidian sign-off shots
(the repo's stated fidelity gate, recon §3b), refresh docs, and land the changelog.

**Files:** modify `docs/superpowers/dse-overhaul/D3-token-map.md` (record the temp-color flip
`#5dade2 → #7c5cd6` + a Source Serif 4 `@font-face` row / note), plugin `CHANGELOG.md`,
workspace `CHANGELOG.md`, workspace `DESIGN.md` (a pointer note: "The DSE plugin's Steel theme
now ports this look — see `dse-overhaul/plans/2026-07-19-plan-19-hfs-steel-theme.md`").

- [ ] **Step 1: Full jest + tsc.** `devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npx jest'` — **1970 green** (+ any small DOM assertions added).
- [ ] **Step 2: Shots battery.** `devbox run -- bash -c 'cd draw-steel-elements && npm run shots'` — **295 PNGs** (no new fixtures; look-only). READ the full Steel set (`feature`/`statblock`/`featureblock`/`stamina-bar`/`initiative`/`hero`/`conditions` `--steel-{dark,light}`) side-by-side with the `shots-hfs-recon/*--site-*` refs for whole-family parity; READ `04-kit-card--site-dark.png` vs the plugin kit render for the composite (kit = header + equipment grid + spliced signature ability). Confirm **every `<id>--legacy-*` and `<id>--steel-print` PNG is unchanged across the whole sweep** (the branch-level Legacy-freeze + SC-4 proof).
- [ ] **Step 3: obsidian-shots (real-Obsidian sign-off).** `devbox run -- bash -c 'cd draw-steel-elements && npm run obsidian-shots'` — **131** (unchanged count; look-only). READ the ability/statblock/featureblock/hero Steel ground-truth shots — the final fidelity gate.
- [ ] **Step 4: Docs-as-done.**
  - `D3-token-map.md`: update the `--dse-stamina-temp` row to `#7c5cd6` (resolve the "Scott review" flag → taste #1 RESOLVED), add a Source Serif 4 `@font-face` note (the font is now shipped, not just declared).
  - plugin `CHANGELOG.md`: an SC-10 entry (Steel theme now ports the site's High-Fantasy Steel look — bundled Source Serif 4, crest/embossed heads, boxed rails, role-tinted statblock plate, featureblock band, teal links; Legacy unchanged).
  - workspace `CHANGELOG.md`: one `## Unreleased` bullet.
  - workspace `DESIGN.md`: the pointer note (no design-language change — the site is unchanged; the plugin now matches it).
- [ ] **Step 5: Commit + record counts.**
```bash
git -C draw-steel-elements add CHANGELOG.md docs/superpowers/dse-overhaul/D3-token-map.md
git -C draw-steel-elements commit -m "docs(steel): SC-10 CHANGELOG + D3-token-map (temp #7c5cd6, Source Serif 4 shipped)"
git add CHANGELOG.md DESIGN.md && git commit -m "docs: DSE Steel theme ports High-Fantasy Steel (SC-10, Unreleased)"
```
Record the final `shots` (295) / `obsidian-shots` (131) counts in the commit body.

---

## Self-review (coverage sweep)

- **Recon order honored, grouped to 8 tasks:** typography+links (1) → head grammar completion
  (2) → ability card (3) → statblock (4) → featureblock (5) → trackers+hero (6) → reference
  cards (7) → sweep+docs (8). The recon's 9 steps map on: recon 1→T1, 2→T1, 3/4→T2+T3, 5→T4,
  6→T5, 7(◆ rule)→already-shipped/T2, 8→T6, 9→T7.
- **Recon corrections applied** (preamble): head grammar / ◆ rule / `.dse-section` / meta rail
  ALREADY exist and (except crest) are wired — the plan ports STYLING + fills slots, does not
  rebuild the grammar. Crest is the one true wiring gap.
- **Every task:** baseline shot → implement → re-shoot → READ vs the **named** site reference →
  LEGACY-FREEZE gate (`<id>--legacy-{dark,light}` pixel-identical; `<id>--steel-print` frozen)
  → full `tsc`+`jest`. Theme-agnostic-DOM called out per view-touching task (2,4,5,6).
- **Constraints honored:** no serialize/schema/game-rule edits; no new runtime deps (only
  bundled OFL font + OFL.txt); JetBrains Mono deferred; print/Legacy-print (SC-4) untouched;
  taste picks resolved by "match the site" (temp→purple #7c5cd6 the one live flip; gold + act
  already site-correct; #4 parked).
- **Baselines:** jest 1970, shots 164 fixtures/295 PNGs, obsidian-shots 131, tip `ffbfec7`.
