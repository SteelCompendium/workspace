# SC-121 sweep — merged defect catalog

Synthesized from `inventory-A.md` / `inventory-B.md` / `inventory-C.md` / `inventory-D.md`,
cross-checked against `nesting-verification.md` and `sc106-leads.md`. Routing decisions below
are final (already made upstream of this synthesis — not relitigated here).

## Routed out (not part of SC-121's own fix batches)

- **A-1 / D-1 — Native CSS nesting silently drops in real Obsidian** (Chromium 106 has zero
  CSS-nesting support; 231 nested rule-in-rule occurrences across 21 top-level selectors ship
  unflattened; collapses card chrome/grid/gap on initiative, negotiation, montage, hero,
  project, encounter, party, skills, conditions, counter, values-row, and more). **CONFIRMED**
  by the fifth verification pass — already live on the released plugin (6.0.1) since
  `styles-source.css`'s introduction, not a 7.0.0-dev-only regression. → **filed as SC-122,
  Urgent, fix in flight.** All SC-121 batches below sequence *after* SC-122 lands, since several
  SC-121 items (stepper/badge fixes, D-7's sidebar collapse) sit on top of the same components
  and re-verifying them against pre-SC-122 real-Obsidian shots would be wasted work.
- **C-1 — Every display family but kit lacks the kit's cardhead grammar** (class/career/
  ancestry worst; no crest/eyebrow/boxed sections — `layouts.ts` never gave the other 9
  `CardLayout`s a `.steel` composition). → **SC-120** (already filed for exactly this). Short
  comment posted there with evidence, not duplicated into SC-121's batches.

## Kept defects — High to Low

### High

| ID | Title | Family | Structural? |
|---|---|---|---|
| A-2 | Stepper/icon buttons ~4:1 oversized for their glyph (seed #1) | hero, heroic-resource, hero-tokens, surges, counter, roll, initiative, montage, party, conditions | no |
| B-1 | Ability/feature meta block (Keywords+Type / Distance+Target) misaligned & invented layout (seed #3) | feature, statblock, by-scc-kit nested features | maybe — DOM/grammar question flagged for fix phase |
| SEED2 | Power-roll tier badge/row padding oversized & inconsistent (seed #2) — merges B-2 + C-4 + D-4 | feature, statblock, featureblock, by-scc-kit, kit signature ability, negotiation power-roll panel | no |
| B-3 | Obsidian's font stack has no glyph for "≤" — tier-1 badge reads "²11" | feature, statblock, featureblock, by-scc-kit — `.dse-pr__badge--t1` | no (Obsidian-only, content-breaking) |
| B-4 | Villain Action features render with no crest icon or spine, unlike every other ability in the same card | statblock — top-level villain-action `[data-dse-element='feature']` mounts | **yes** — flagged; may belong to SC-101/102/103 structural family, Scott decides at review |
| C-5 | Treasure "Project" row leaks raw `[label](scc.v1:...)` markdown link syntax | treasure — `treasureLayout` Project row | no (missing `markdown: true`) |
| D-3 | Negotiation checkboxes unstyled, zero gap to label text | negotiation — motivation/pitfall checklists | no |
| D-5 | Coverage gap: zero shot coverage for any interactive modal (stamina edit, spend recovery, condition picker, form editor) | plugin-wide | n/a — coverage gap, not a rendering defect; risk flagged High because these are core, frequent, unaudited surfaces |

### Medium-High

| ID | Title | Family |
|---|---|---|
| C-6 | Perk's embedded "Familiar Statblock" markdown table has zero table styling (no borders/cell grouping) | perk — nested markdown table |
| D-6 | Coverage gap: zero shot coverage for Canvas read-only rendering | plugin-wide (canvas host) |

### Medium

| ID | Title | Family |
|---|---|---|
| A-3 | Stamina winded/dying status badge renders as a visible empty pill on a healthy character (missing `[hidden]` guard) | hero sheet, Stamina card |
| C-2 | Kit Equipment band has ~2x the vertical padding of the site's equivalent panel | kit — `.dse-kit__equip` |
| C-3 | Kit crest icon oversized (~1.9x) relative to its own eyebrow/title block | kit — card-head crest |
| D-2 | Negotiation Interest/Patience ladder row pitch ~2.5–3x taller than content needs | negotiation — Interest ladder |
| D-7 | Coverage gap (partial) + real defect: sidebar Characteristics row collapses to concatenated, unlabeled text at narrow width | hero sheet in sidebar |

### Low

| ID | Title | Family |
|---|---|---|
| B-5 | `.dse-section` head-strip text sits ~10px right of the section body text below it | feature, statblock, by-scc-kit — `.dse-section__title` vs `__body` |
| D-8 | Coverage gap: settings tab / typography preview has no standard harness fixture (ad hoc evidence reviewed, no defect found — recommend adding a fixture) | plugin settings tab |

**Kept total: 17** (High: 8 incl. 1 coverage gap · Medium-High: 2, both coverage gaps ·
Medium: 5, incl. 1 partial coverage gap · Low: 2, incl. 1 pure coverage gap).
Routed out: 2 (A-1/D-1 → SC-122, C-1 → SC-120).

---

## Full entries

### A-2: Stepper +/- buttons and other icon buttons massively oversized for their glyphs (seed #1)
- **Severity:** High
- **What's wrong:** `.dse-btn`'s base rule applies `min-width/height: var(--dse-touch-min)`
  (44px) + `padding: 0.25em 0.6em` uniformly to every icon button, with no compact variant.
  Measured on `counter--steel-dark.png` (native 1520×212, no upscaling): the "−" button box is
  ≈88×86px around a ≈21×4px glyph — a ~4:1 linear / ~19:1 area oversize. Repeats identically on
  heroic-resource, hero-tokens, surges, roll, montage, party, conditions.
- **Evidence:** `counter--steel-dark.png` (cleanest isolated repro), `heroic-resource--steel-dark.png`,
  `hero-tokens--steel-dark.png`, `surges--steel-dark.png`, `roll--steel-dark.png`,
  `montage--steel-dark.png`, `party--steel-dark.png`, `hero--steel-dark.png`.
- **Suspected CSS:** `.dse-btn` (~5097), `--dse-touch-min: 44px` (~2995). Precedent fix already
  exists: `[data-dse-element="initiative"] .dse-init` overrides these buttons to `min-width:0;
  padding:0` and re-adds the 44px hit target as an invisible `::after` overlay — the pattern the
  other surfaces lack.
- **Browser-verifiable:** yes — reproduces identically in browser harness and Obsidian.

### B-1: Ability/feature meta block (Keywords+Type/Distance+Target) misaligned — invented layout vs. site (seed #3)
- **Severity:** High
- **What's wrong:** Plugin forces Keywords+Type into one 2-col grid row with Distance+Target as
  a second row below; the Keywords cell is `width:fit-content` inside a `1fr` track sized to the
  wider Distance box, leaving a large dead gap between the Keywords chip and Type chip. The site
  never pairs Type with Keywords at all — Keywords render as discrete wrapping pill chips with no
  "KEYWORDS:" label, and Type is a separate top-right corner chip beside the cost/level chip.
  Only Distance/Target form a true site-side 2-col grid. This is closer to an invented layout
  than a padding tweak.
- **Evidence:** `feature--steel-dark.png` (meta block below flavor text), `statblock--steel-dark.png`
  "Whip and Magic Longsword".
- **Suspected CSS:** `.dse-feature__meta` grid-template (~121–138); `--meta-cell--keywords/--type`
  (~4276–4292). Flagged: may need DOM/grammar changes (renderFeature.ts), not CSS-only —
  fix-phase should confirm scope before committing to a CSS-only pass.
- **Browser-verifiable:** yes — reproduces in browser harness and Obsidian identically.

### SEED2: Power-roll tier badge/row padding oversized & inconsistent (seed #2) — merged B-2 + C-4 + D-4
- **Severity:** High
- **Element/family:** shared `.dse-pr__row` / `.dse-pr__badge` component — appears in feature/
  statblock/featureblock/by-scc-kit ability cards (B-2), kit's embedded Signature Ability
  (C-4), and negotiation's Power Roll panel (D-4). Same component, three fixture contexts —
  merged to one canonical entry per the synthesis brief.
- **What's wrong:** Two related symptoms of the same badge/row: (1) the t1 badge ("≤11") has
  almost no vertical padding vs. t2/t3/crit, which sit comfortably — all four share the same
  `width:3em` box but the four clip-path polygon shapes (copied from legacy) don't give t1
  consistent breathing room. (2) Each tier *row* is disproportionately tall vs. its badge: on
  `kit--steel-dark.png` a row is ~100px for a ~21px badge (badge = 21% of row height vs. the
  site's ~30%); on `negotiation--steel-dark.png` rows run ~80–90px for a single line of text.
  `.dse-pr__row`'s own padding (~0.6875rem / ~0.1em depending on context) doesn't account for
  this — the likely cause is `.dse-card`'s inherited `line-height: 1.7` cascading into the row's
  text, uncompensated (the badge itself already got a `line-height: 1` reset for an unrelated
  strikethrough fix; the row's surrounding text didn't).
- **Evidence:** `feature--steel-dark.png` (Power Roll + Might block), `kit--steel-dark.png`
  (tier rows ~y1563–1930), `negotiation--steel-dark.png` ("Power Roll + Reason, Intuition, or
  Presence" box), `statblock--steel-dark.png`, `featureblock--steel-dark.png`.
- **Suspected CSS:** `.dse-pr__badge` (~5566–5575) + t1–t3/crit `::before` clip-paths
  (~5581–5595); `.dse-pr__row` (~4472, and a second declaration ~5445); `.dse-card` line-height
  1.7 (~3438–3443) cascading in uncompensated.
- **Browser-verifiable:** yes — all three contexts reproduce in browser harness.

### B-3: Obsidian font stack has no glyph for "≤" (U+2264) — tier-1 badge reads "²11"
- **Severity:** High (content-breaking, not cosmetic)
- **What's wrong:** In every real-Obsidian shot, the t1 badge's "≤11" renders as "²11" —
  Obsidian's font stack substitutes a superscript-2-like fallback for U+2264. Does **not**
  reproduce in the browser harness (different font stack) — Obsidian-only.
- **Evidence:** `feature--obsidian-steel-dark.png`, `statblock--obsidian-steel-dark.png`,
  `featureblock--obsidian-steel-dark.png`.
- **Suspected CSS:** not padding/sizing — needs a `font-family` fallback on
  `.dse-pr__badge-text` that includes a glyph for U+2264, or replace the literal "≤" character
  with an SVG/icon glyph.
- **Browser-verifiable:** **no — needs real-Obsidian evidence** (invisible in the browser
  harness's font stack).

### B-4: Villain Action features render with no crest/spine, unlike every other ability in the same card
- **Severity:** High — **structural: true**
- **What's wrong:** Nested statblock abilities ("Whip and Magic Longsword" etc.) get a full
  shield crest + colored `[data-dse-act]` spine inset ~24px from the card edge. Villain Action
  entries later in the same card ("Shoot!", "Form Up!") render completely bare — no crest, no
  spine, flush to the card edge — a visible style break partway through one card.
- **Evidence:** `statblock--steel-dark.png` (scroll ~3/4 down to "SHOOT!"/"FORM UP!"/"LEAD FROM
  THE FRONT", compare against "Whip and Magic Longsword" near the top).
- **Suspected cause:** likely not CSS-only — villain-action entries are probably standalone
  `[data-dse-element='feature']` mounts rather than children of `.dse-feature__nested`, so they
  never pick up the crest/spine rule. **Flag per routing brief: may belong to the SC-101/102/103
  structural family — Scott decides at review whether this stays in SC-121 or moves.**
- **Browser-verifiable:** yes — reproduces in browser harness and Obsidian, both schemes.

### C-5: Treasure "Project" row leaks raw markdown link syntax
- **Severity:** High
- **What's wrong:** The Project row joins `project_source` + `project_roll_characteristic` +
  `project_goal`; `project_roll_characteristic`'s data contains an inline markdown link, but the
  row definition omits `markdown: true`, so `renderLegacy()` calls `setText()` instead of
  routing through markdown rendering. Literal `[Reason](scc.v1:mcdm.heroes.v1/rule.character/reason)`
  prints verbatim, brackets/parens/URI and all.
- **Evidence:** `treasure--steel-dark.png`, "Project:" row.
- **Suspected fix:** `layouts.ts` `treasureLayout.rows` (~259–271) — add `markdown: true` to the
  Project row (or split `project_roll_characteristic` into its own markdown row).
- **Browser-verifiable:** yes — data/rendering bug, reproduces everywhere, not scheme-dependent.

### D-3: Negotiation checkboxes unstyled, zero gap to label
- **Severity:** High
- **What's wrong:** Every checkbox in the negotiation card is a bare native square (no accent
  color, no rounded border) with zero gap to its label — the glyph touches the first letter
  ("☐Higher Authority"). Stands out against the plugin's crafted pill/chip/button language used
  everywhere else in the same card.
- **Evidence:** `negotiation--steel-dark.png`, "Appeals to Motivation"/"Mentions Pitfall" row and
  the "Motivations"/"Pitfalls" lists.
- **Suspected CSS:** no rule styles `.dse-nt__argument-item input[type=checkbox]` /
  `.dse-nt__details-item input[type=checkbox]` at all — needs a themed checkbox rule
  (accent-color + margin-right).
- **Browser-verifiable:** yes.

### D-5: Coverage gap — zero shot coverage for any interactive modal
- **Severity:** High (risk of shipping unaudited — frequently-used interactive surfaces)
- **What's wrong:** No fixture/alias/shot anywhere opens the stamina edit modal, Spend Recovery
  modal, condition picker modal, or form editor modal. Given the confirmed SC-122 nesting bug,
  modals are exactly the kind of surface most likely hiding an unaudited layout break, since
  they're never rendered in the harness at all.
- **Evidence:** none exists — that is the finding (exhaustive listing of `shots/` + grep of
  `entry.ts`/`aliases.json` for "modal").
- **Proposed fix:** extend the harness with modal-opening fixtures (own batch — see Batch 4).

### C-6: Perk's embedded "Familiar Statblock" markdown table has no table styling
- **Severity:** Medium-High
- **What's wrong:** The perk's source content includes a real 5-column markdown pipe-table
  (the book's inline mini-statblock convention). The plugin has no generic `table`/`th`/`td` CSS
  at all (only `.dse-enc__table` exists), so it renders as bare flowing text — no borders, no
  cell grouping, an empty cell collapsing row rhythm into a run-on line.
- **Evidence:** `perk--steel-dark.png`, "Familiar Statblock" section (~y750–1350).
- **Suspected fix:** new baseline `table`/`th`/`td` styling under `[data-dse-theme='steel']`,
  possibly reusing the existing value-over-label tile recipe for `<br>`-split cells. Not a
  one-line tweak — new CSS needed.
- **Browser-verifiable:** yes.

### D-6: Coverage gap — zero shot coverage for Canvas read-only states
- **Severity:** Medium-High
- **What's wrong:** No fixture/shot anywhere references Canvas. The only trace is one code
  comment (`entry.ts:205`) confirming a read-only "canvas quarantine" affordance exists and is
  never screenshotted.
- **Evidence:** none exists — that is the finding.
- **Proposed fix:** own batch (Batch 4) — Canvas rendering is real-Obsidian-only, cannot be
  verified via browser harness.

### A-3: Stamina winded/dying status badge renders as a visible empty pill on a healthy character
- **Severity:** Medium
- **What's wrong:** `.dse-stamina-rec__status` sets `display: inline-flex` unconditionally with
  no `[hidden]` guard. Since `[hidden]` and the class selector tie in specificity, the
  later-loaded class rule wins and the badge stays visible (empty, just padding/border-radius
  showing) even on a healthy character (31/48, no Winded/Dying state). The codebase already
  guards this pattern elsewhere (`.dse-sedit__warn[hidden]`, `.dse-collapse__region[hidden]`) —
  this one spot was missed.
- **Evidence:** `hero--steel-dark.png`, Stamina card, just below the stepper, left of the
  recovery-pip row (small, ~20×10px at native 1520px width).
- **Suspected CSS:** add `.dse-stamina-rec__status[hidden] { display: none; }` (~1176).
- **Browser-verifiable:** yes.

### C-2: Kit Equipment band has ~2x the vertical padding of the site's equivalent panel
- **Severity:** Medium
- **What's wrong:** Measured on `kit--steel-dark.png`: ~59px top / ~51px bottom padding around a
  single text line whose own cap-height span is only ~29px (ratio ≈1.8–2.1×) vs. the site's
  ~1.0× ratio.
- **Evidence:** `kit--steel-dark.png`, Equipment box (~y430–630).
- **Suspected CSS:** `.dse-kit__equip` (~4193) `padding: 0.65em 0.8em` compounding against
  `.dse-card`'s inherited `line-height: 1.7` — try re-basing to a fixed `rem` figure.
- **Browser-verifiable:** yes.

### C-3: Kit crest icon oversized relative to its eyebrow/title block
- **Severity:** Medium
- **What's wrong:** Crest shield spans ~84×124px next to a ~64px-tall eyebrow+title block
  (ratio ≈1.9×) vs. the site's crest, which reads clearly smaller than its own title's cap-height
  run. (Separate low-priority contrast issue on the same crest — the glyph is nearly invisible
  against the shield's own fill — already routed as a one-line sc106 lead, not duplicated here.)
- **Evidence:** `kit--steel-dark.png` (top ~y0–180).
- **Suspected CSS:** `crest.ts`'s `CrestSize` (`'lg'` may be oversized for a single short
  eyebrow+title pairing) — compare against site's `.sc-crest.lg` (`50×56px`).
- **Browser-verifiable:** yes.

### D-2: Negotiation Interest/Patience ladder — excessive row pitch
- **Severity:** Medium
- **What's wrong:** Each Interest rung is a 44px bubble with ~26–28px text, but row-to-row pitch
  measures ~120px — ~2.5–3x the content's natural height. Six rungs stack into ~720px of mostly
  dead vertical space.
- **Evidence:** `negotiation--steel-dark.png`, "Interest" section.
- **Suspected CSS:** `.dse-nt__interest-row .dse-nt__bubble { margin: 0.5em }` combined with the
  44px touch-min bubble — check whether the touch-min floor is being applied in a desktop-only
  reading context where it isn't needed.
- **Browser-verifiable:** yes.

### D-7: Coverage gap (partial) + real defect — sidebar Characteristics row collapses at narrow width
- **Severity:** Medium
- **What's wrong:** Sidebar coverage is thin (2 of ~30 elements captured, one missing its light
  counterpart). Where it does exist, it reveals a real defect: in
  `hero--obsidian-sidebar-steel-dark.png`, the Characteristics row — correct as 5 columns at
  full width — collapses into concatenated, truncated text ("MightAgilityReasonIntuitionPr")
  with numbers on a separate unaligned line. Width-triggered, so likely a *separate* failure from
  SC-122's nesting bug (possibly a container-query breakpoint that itself uses unflattened
  nesting and never activates the compact variant) — **worth re-checking after SC-122 lands**,
  since it may resolve as a side effect or may need its own fix.
- **Evidence:** `hero--obsidian-sidebar-steel-dark.png` vs. `hero--obsidian-steel-dark.png`.
- **Suspected CSS:** `.dse-sb__chars` or equivalent — check for a nested narrow-width variant.
- **Browser-verifiable: no — needs real-Obsidian evidence**, and specifically needs re-verification
  post-SC-122 to confirm whether it's the same root cause or independent.

### B-5: `.dse-section` head-strip text sits ~10px right of the body text below it
- **Severity:** Low
- **What's wrong:** Pixel-measured on `feature--steel-dark.png`: "◆ TRIGGER" header starts at
  x≈110 vs. the body paragraph at x≈100 below it — the site's equivalent header/body share a
  flush left edge.
- **Evidence:** `feature--steel-dark.png`, TRIGGER/EFFECT section boundary.
- **Suspected CSS:** `.dse-section__title` padding (`0.625rem 1.125rem`) vs.
  `.dse-section__body` padding (`0.6em 0.75em`) authored independently, don't reconcile to a
  shared left edge.
- **Browser-verifiable:** yes.

### D-8: Coverage gap — settings tab has no standard harness fixture
- **Severity:** Low-Medium
- **What's wrong:** No `visual-harness/shots/` fixture opens the settings tab; only ad hoc
  leftover evidence from the SC-112/plan-23 font-settings work exists. Reviewed it for density
  defects: none found (standard Obsidian `.setting-item` chrome, consistent with typical plugin
  settings density; live statblock preview well-proportioned). The one known issue (double
  text-size label) is already tracked as FOLLOWUPS #42, out of scope here.
- **Evidence:** `.superpowers/sdd/2026-08-02-plan-23-sc112-font-settings/evidence/
  typography-settings--obsidian-steel-dark.png`.
- **Proposed fix:** add a settings-tab fixture to the standard harness sweep (Batch 4) so this
  surface gets regular coverage rather than relying on leftover evidence.

---

## Proposed fix batches

**Precondition — sequence after SC-122:** SC-122 (native CSS nesting flattening) must land
before any of these batches are verified against real-Obsidian shots. Several items here sit on
components SC-122 also touches (steppers/badges inherit from the same tracker CSS families, and
D-7's sidebar collapse may share root cause with the nesting bug) — fixing and re-shooting before
SC-122 lands risks re-doing the visual review once SC-122's flattening changes the baseline.

### Batch 1 — Control density
Stepper/button compact variants, checkbox styling, empty-badge/hidden guard, tracker row pitch.
- A-2 (stepper/icon buttons ~4:1 oversized) — apply initiative's existing compact-button pattern
  (`::after` hit-target overlay) to the other stepper surfaces.
- D-3 (negotiation checkboxes unstyled, no label gap)
- A-3 (stamina winded/dying empty-pill `[hidden]` guard — one-line CSS fix, trivial to bundle here)
- D-2 (negotiation ladder row pitch — same "control density" root cause as A-2's touch-min
  over-application; reasonable to fix in the same visual pass)
- **Browser-verifiable:** all of it — no Obsidian-only evidence in this batch.

### Batch 2 — Ability-card anatomy
Meta block, tier badges + ≤ glyph, section-edge alignment — the core "ability/feature card"
grammar.
- B-1 (Keywords+Type/Distance+Target meta block — seed #3; flag DOM-vs-CSS-only question for
  fix-phase scoping before starting)
- SEED2 (power-roll tier badge/row padding — seed #2, merged B-2/C-4/D-4)
- B-3 (Obsidian ≤ glyph substitution — bundle here since it's the same badge component, even
  though it's a font-stack fix rather than padding)
- B-5 (section head-strip left-edge misalignment)
- **Browser-verifiable:** all except B-3, which needs real-Obsidian confirmation (invisible in
  the browser harness's font stack) — verify B-3 specifically against Obsidian shots, not just
  the browser harness.

### Batch 3 — Cross-family card consistency + quick content bugs
Kit-specific card padding/crest sizing, perk table styling, treasure content bug, villain-action
structural break (flagged for Scott's call).
- C-2 (kit Equipment band ~2x padding)
- C-3 (kit crest oversized relative to title block — sizing only; contrast concern already
  routed to SC-106 as a one-liner)
- C-6 (perk Familiar table — needs new baseline table CSS, not a one-line tweak)
- C-5 (treasure Project row markdown leak — one-line `markdown: true` fix, low risk, good filler
  in this batch)
- B-4 (Villain Action crest/spine dropout — **Scott decides**: fix here as CSS-only if scoped
  narrowly, or split to SC-101/102/103 if it needs the nested-feature DOM path)
- **Browser-verifiable:** all of it.

### Batch 4 — Harness coverage (extend fixtures, not a visual fix)
- D-5 (add modal fixtures — stamina edit, Spend Recovery, condition picker, form editor)
- D-6 (add Canvas read-only fixtures)
- D-7 (add broader sidebar coverage across families; also re-verify the Characteristics-collapse
  defect once SC-122 lands, to confirm whether it's the same root cause or independent — do not
  fix blind before that check)
- D-8 (add a settings-tab fixture to the standard sweep)
- **Browser-verifiable:** modal/settings fixtures can extend the browser harness; Canvas and the
  D-7 re-verification specifically require real-Obsidian capture — this batch is the one most
  dependent on real-Obsidian evidence overall.

**Suggested order:** SC-122 lands first (precondition, not a batch) → Batch 1 → Batch 2 →
Batch 3 → Batch 4. Batches 1–3 are independent of each other in principle and could be
reordered on Scott's preference; Batch 4 is sequenced last because two of its four items
(Canvas, D-7 re-check) are only meaningful once SC-122's real-Obsidian baseline has shifted.
