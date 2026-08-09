# Steel Compendium Releases

This workspace has no version tags — a "release" here is a deploy of the live site
(steelcompendium.io/v2) and/or the SCC API, so entries are headed by **deploy date**
instead of a tag. New work lands under `## Unreleased` and is promoted to a dated
header when it goes live. One bullet per user-facing change; internal/process changes
go under an *Internal* sub-heading.

## Unreleased

- **Site: crest glyphs optically centered (SC-129)** — the shield-crest icons across
  browse cards, category headers, folder/kit tiles, ability/trait cards and preview lists
  sat 0.4-1.5px off the shield's optical center; nudges are now measured (polygon-erosion
  pixel audit), verified in both schemes and across card-scale/zoom settings.

### Added (pending plugin 7.0.0 release)

> The plugin major below was drafted as "6.0.0". That number is **retired** after the
> `6.0.0-rc1` incident (an RC published as a regular release; `6.0.1` was cut as a
> recovery re-release of 5.1.1). It ships as **7.0.0** — see the plugin CHANGELOG.

- **Encounter builder → initiative tracker fixed (SC-134)** — builder-generated tracker
  blocks (SCC-code statblock refs) render again instead of an error card; pre-existing
  generated encounters recover with no edits.
- **Draw Steel Elements plugin 7.0.0** — compendium sync now pulls from data-unified
  releases instead of the retired data-md-dse repo, is non-destructive and
  manifest-driven (only plugin-installed files are ever updated or trashed), and
  resolves `scc.v1:` links throughout compendium notes and element text. Statblock YAML
  adopts the SDK 3.x `role`/`organization`/`keywords` fields (legacy `roles`/`ancestry`
  keys still work through the 7.x cycle with a deprecation warning; support is removed
  in 8.0.0). Re-sync your compendium after updating.
- **DSE compendium reference family (D6)** — eleven new plugin elements (`ds-kit`,
  `ds-ancestry`, `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`,
  `ds-treasure`, `ds-complication`, `ds-condition`, `ds-rule`), reference-by-SCC for
  statblocks/features/featureblocks, compendium search/insert commands, and the
  `CompendiumIndex` typed-entity API.
- **GM subsystems (D8)** — a persistent Draw Steel sidebar panel; an Encounter Builder
  (`ds-encounter`) computing live EV/budget/difficulty from the synced compendium;
  `ds-montage`/`ds-project`/`ds-party` trackers; the initiative tracker's Malice pool
  as a first-class panel plus a per-turn action checklist.
- **Hero suite (D7)** — flagship hero sheet (`ds-hero`) plus standalone
  conditions/resource/surges/tokens trackers; stamina recoveries, winded/dying badge,
  Catch Breath.
- **Steel theme, High-Fantasy Steel port (SC-10)** — the plugin's Steel theme now
  matches the steelcompendium.io look (forged cards, embossed serif titles with bundled
  Source Serif 4, crest badges, role-tinted statblock plates, teal links); the original
  look remains available as the Legacy style.
- **Steel material parity (plan 20)** — the plugin's Steel theme now carries the site's
  actual material treatment (sheen/bevel/hairline on card plates, section heads and the
  ability cost chip; tier-coloured power-roll washes; role and malice header bands; crest
  accent) rather than an approximation of it. It also adds a developer-run site-vs-plugin
  parity check (`npm run parity` in `draw-steel-elements`): it diffs the plugin's computed
  styles, in both colour schemes, against a committed capture of the live site's, over 12
  mapped selector pairs, and fails when a surface the site forges renders flat. It is a
  narrow instrument on purpose — **not wired into CI** (see FOLLOWUPS #36), covering 5 of
  the 32 element families, asserting flat-vs-forged only and never exact colour,
  typography or pseudo-elements. The jest material contract
  (`test/dom/theme/steelMaterial.test.ts`) pins the same declarations offline and does run
  in CI. The pair makes a wholesale flattening loud; it does not make the plugin
  pixel-identical to the site, and drift within those blind spots can still pass.
- **Steel typography, spacing & ink parity (plan 21)** — the plugin's Steel theme now also
  matches the site's body **type, spacing and ink** on the same card families (feature/
  ability, statblock, featureblock, card-ref/condition, and the shared head/row/band
  primitives): body and label text is routed to a serif face, opened to the site's
  line-height and card/head/row/band spacing, and given the site's cooler ink. The parity
  check was widened to measure type, spacing, ink and letter-spacing alongside material
  across the same 12 selector pairs (~5 of 32 element families), both schemes — still
  **not wired into CI** (FOLLOWUPS #36) — and a second offline jest contract
  (`test/dom/theme/steelTypography.test.ts`) pins the serif route, the ≥1.6 body
  line-height and the ~24px card inset. Two deliberate limits: the site's licensed slab
  (BerlingskeSlab) can't be bundled, so the plugin uses a free serif (Source Serif 4) — a
  serif, not that exact slab, and only its 600/700 weights ship, so body copy reads a
  touch heavier than the site's; and this is **only** the shared card families. It does
  **not** cover the plugin-only families, nor the deferred structural rebuilds — the kit
  stat-tile grid (FOLLOWUPS #32, needs its own plan against the print/legacy freeze), the
  featureblock option layout (#33), the feature action spine (#34) and the statblock notch
  (#35) all remain as they were. Bundling the slab is a possible future upgrade.
- **Steel body-text coherence (plan 22)** — plan 21's body-type routing above reached only
  the shared card families; every plugin-only family (hero sheet, encounter, negotiation,
  montage, initiative, project, party, and the rest) still rendered a serif card head next
  to a sans body/label/control, reading as two different type systems in the same note.
  The routing now lives on a single Steel-theme-root selector (every `[data-dse-element]`
  host) instead of a four-family allow-list, so body text, labels, table cells, sub-headers
  and chips are serif and open-line-height everywhere Steel is active. One exclusion was
  written to keep numeric stepper/counter values (hero stamina/ferocity/surges steppers,
  montage/initiative trackers, the standalone counter) in their prior, non-serif
  rendering. [Correction, SC-112: that exclusion quietly died during SC-105's font-slot
  rename — its token chain went invalid at the root and steppers silently rendered serif
  under Steel, unseen by the freeze (which covers legacy+print shots only). Scott's
  SC-112 ruling makes the serif deliberate: Controls default to "same as Body" — see the
  SC-112 bullet below.] The encounter head's numeric `EV n / n` chip now
  takes the exact same serif small-caps treatment as every other chip — a fully uniform
  chip family, with no numeric-content exemption — so its digits render at small-caps cap
  height, a Source Serif 4 `smcp` behavior; this is accepted as the correct look, and the
  old sans rendering's big-digit emphasis is gone by design. `steelTypography.test.ts`
  gained a dedicated contract test that locks the *shape* of the selector (every element
  root, not a named list) independently of the existing font-value assertion, so a future
  edit can't quietly re-narrow the routing without failing the suite. Same honest limits as
  plan 21: screen-only (print/export and Legacy are untouched), serif-not-slab, and only the
  600/700 weights ship. No parity-gate coverage exists for the plugin-only families (they
  have no site counterpart in the 12 mapped pairs), so a shot-read remains the primary
  visual guard for this surface.
- **Steel modal theming (SC-104)** — DSE's modals (stamina edit / Spend Recovery,
  condition pickers, the form editor, and others) now follow the active theme too:
  Steel renders the forged treatment (title emboss, sunken sections, forged footer
  buttons) instead of unstyled defaults, and Legacy modals are unchanged.
- **Steel body-text true weight (SC-105 face decision)** — the Steel theme now bundles
  Source Serif 4's Regular (400) weight alongside the existing 600/700, so body and
  label prose render at their real book weight instead of being mapped up to the
  bundled 600 (SemiBold) face for lack of a 400 — the "reads slightly heavier than the
  site's" gap called out in plan 21/22 above is closed. Titles are unaffected (they set
  600/700 explicitly). Screen-only, same scoping as the rest of the Steel typography
  work: Legacy and print/export are untouched. Adds ~20KB to the bundled font payload.
- **Steel kit card stat-tile rebuild (SC-100 / plan 24)** — the plugin's Steel kit card
  (`ds-kit`) now renders the site's composition instead of a label-value list: a crest and
  kind eyebrow head ("Martial/Magic/Psionic Kit"), a boxed Equipment panel, and Kit
  Bonuses as the fixed two-row stat-tile grid with "—" dash tiles for absent bonuses; the
  signature ability keeps the plugin's richer full inline ability card (site convergence
  filed as SC-115). Structurally this is the plugin's first theme-conditional DOM: an
  optional `CardLayout.steel` composition slot, branched once at mount and re-rendered on
  a live theme switch, while the Legacy theme keeps the old DOM verbatim (all frozen shots
  byte-identical; the single sanctioned freeze change is the `kit--steel-print.png`
  one-hash rebaseline, approved by Scott's visual gate 2026-08-03 and applied at landing).
  A gate-round finding worth keeping: the site's dark-mode tile richness is the card's own
  gradient bleeding through **translucent-black** fills — the plugin's
  `--dse-surface-sunken` 6%-white wash was occluding it (two selectors fixed; the pattern
  seeds SC-117's dark-mode audit). Remaining display families (class/career/…) are
  sequenced as SC-120; site-side kit gaps filed as SC-115/SC-116/SC-119.
- **Plugin typography settings (SC-112 / plan 23)** — the plugin settings gain a
  Typography section: six font pickers (Title/Body/Controls primary, Card
  body/Label/Monospace behind an Advanced fold; curated list + "Custom…" free text +
  a feature-detected "List installed fonts" affordance) and two size sliders (Text
  60%–140%, Card 80%–120%, 5% steps — the site's exact slider ranges and snap
  semantics). Every picker defaults to "Default (Obsidian vault fonts)" — the
  plugin's only-ever prior behavior — and choices apply under both Steel and Legacy
  (the Legacy support gate's verdict was SHIP; at defaults Legacy stays
  byte-identical, freeze-verified). Controls (steppers/buttons/tabs) now default to
  "same as Body" per Scott's ruling — ratifying the serif rendering steppers already
  had (see the plan-22 correction above) rather than changing pixels; print pins
  controls sans and always renders text/cards at 100%.
- **Steel UI refinement pass (SC-121)** — a systematic four-batch polish sweep across
  every element family, both color schemes, driven by a screenshot-audited defect
  catalog. Highlights: compact stepper/icon-button density (28px on desktop pointers,
  full 44px touch targets on mobile); the ability-card keyword/type/distance/target
  region rebuilt to the site's two-band grammar with the type chip right-aligned;
  power-roll tier badges at site proportions and the "≤" glyph rendering correctly in
  real Obsidian; crest faces corrected per scheme (a hairline token had inverted them);
  statblock stat-row gaps; themed negotiation checkboxes; markdown tables scroll
  instead of clipping; the treasure card's Project row renders its markdown (was a raw
  literal — a content fix reaching all themes, with a Scott-sanctioned 5-shot freeze
  rebaseline). The pass also unearthed and fixed silent capability-floor failures:
  CSS nesting dropped wholesale on older-Electron Obsidian installs (SC-122 — trackers
  rendered unstyled there for ~a year), the monospace font token never resolving,
  and color-mix()/text-wrap uses above the supported floor — each now regression-
  guarded, with harness coverage extended to modals, the sidebar, canvas read-only
  states and the settings tab (freeze pins 101 → 107).
- **Steel structural trio — action spine, villain actions, statblock notch (SC-101/
  SC-102/SC-103, plan 25)** — the plugin's Steel theme closes its last three DOM-level
  divergences from the site. The action-spine and statblock-notch fixes are Steel-scoped
  CSS only (no DOM restructuring); villain-action classification needed a real TypeScript
  rendering fix instead. Villain actions (Shoot!, Form Up!, and every "Villain Action N" ability
  in your synced compendium) now render with their own red accent and a skull crest,
  instead of no decoration at all — a mapping bug had them falling through unclassified
  in every theme. A card's coloured action-type bar now appears only where the site
  draws one: inside a statblock or featureblock's nested feature list, never on a
  standalone ability card. Those nested lists — a malice featureblock's options, a
  statblock's abilities — now render each entry as its own bordered, filled card
  (matching the site) instead of one continuous accent line, and a featureblock
  option's cost renders as plain large display text next to its name instead of a
  small outlined chip (statblock/standalone costs keep the existing forged pill, same
  as the site). The statblock and featureblock's diamond notch moves from a generic
  divider between the characteristics strip and the feature list to the site's actual
  position, straddling the bottom edge of the head band, tinted to the block's role.
  **Known limits:** compendium content synced before 2026-07-16 carries villain actions
  as plain body-markdown prose (how they were written at the time) rather than the
  structured card — re-sync your compendium to get the new rendering. Printed/exported
  output follows the same structural change as the screen; Scott signed off on the five
  moved print goldens on 2026-08-08 (the ask and its before/after pairs are on SC-102),
  and the rebaseline was applied at landing.
- **Steel horizontal rules — both of the site's variants (SC-128)** — the site draws two
  distinct diamond rules and the plugin now carries both. The standalone `ds-hr` /
  `ds-horizontal-rule` element gets the **ornate** one: a small haloed diamond flanked by
  two seed dots, with hairlines fading outward to nothing, replacing the old heavy look (a
  large solid diamond on two thick full-width lines). The **plain** variant — the same
  diamond seated on a solid line, no dots, no fade — is the statblock header's bottom edge
  and was already shipped verbatim by SC-103's notch, so nothing was rebuilt for it. Where
  the site draws no rule at all (between a statblock's characteristics and its features)
  the plugin still draws none. Screen only; printed output is unchanged.

### Fixed

- **Steel dark mode reads flat — the sunken-surface polarity (SC-117)** — every recessed
  panel inside a Steel card (ability sections, power-roll frames, Distance/Targets cells,
  statblock stat and field boxes, hero regions, initiative cells, the encounter summary)
  was painted with a 6%-**white** wash in dark mode and an opaque grey in light. Both
  occluded the card plate's own diagonal gradient, which is exactly where
  steelcompendium.io's dark-mode richness comes from — so every panel landed on the same
  flat tone regardless of where it sat on the plate. They now carry the site's measured
  translucent-**black** fills, per surface, in both schemes, and section header strips
  drop the opaque plate they painted under their sheen (the site paints none).
- **A roleless statblock lost its section break under Steel (FOLLOWUPS #56, with SC-128)** —
  a statblock whose role maps to nothing (a summoner Champion, a Noncombatant — 5 of the
  512 statblocks the pipeline emits) was left with no head band, no diamond notch and no
  divider, so its characteristics strip butted straight into its feature list. It keeps the
  diamond divider again. Role-mapped statblocks are unchanged.

### Internal

- **Draw Steel Elements visual-harness coverage** — featureblock advancement bands
  and the sidebar panel now have dedicated fixtures with golden-PNG shots: the
  featureblock fixture's legacy/print renders joined the frozen set (98 → 101),
  while its Steel-scheme shots and both new sidebar shots are regenerated
  (unfrozen) goldens verified by eye.
- **Draw Steel Elements font token vocabulary (SC-105)** — the plugin's single
  `--dse-font-display` token is retired, replaced by six semantic slots
  (title/body/card-body/label/controls/mono), each independently themeable.
  Every consumer was re-pointed to its classified slot with zero rendering
  change — freeze and parity gates stayed green throughout. Groundwork only,
  for user-customizable fonts (SC-112).

## 2026-08-03 — site deploy (SC-118 downtime table placement)

### Fixed

- **Downtime project tables now sit in their owning projects** — the Heroes book
  transcription carried two page-layout artifacts where a table trailed the previous
  project: the Hone Career Skills Events Table rendered on the Go Undercover page
  instead of Hone Career Skills, and the Build or Repair Road Renown Table rendered
  on the Build Airship page instead of Build or Repair Road. Both moved to their
  correct projects. The shared Crafting and Research Events Table (the d100 fallback
  for all crafting/research projects) was likewise hoisted out of Discover Lore's
  Forbidden Knowledge subsection onto its own downtime-rule page. (SC-118)

## 2026-08-02 — site deploy (SC-113/SC-114 rules-content fixes)

### Fixed

- **Wall rule page no longer carries the "Straight Lines" sidebar** — the printed
  sidebar sits inside the Wall section in the Heroes book, so the ETL folded it into
  the wall rule's Browse page. It is now tagged as a loose callout, so the narrow wall
  page drops it while book-faithful pages (Area of Effect, the Read chapter) keep it
  in its printed position. (SC-114)
- **Table-reference combat modifiers: corrected opportunity-attack trigger** — the
  summary said "leaving a creature's reach without shifting"; the trigger is
  adjacency-based, so it now reads "willingly moving out of a square adjacent to a
  creature without shifting". (SC-113)

## 2026-07-29 — site deploy (SC-95 statblock action labels)

### Fixed

- **Monster statblock abilities name their action type in the default "Crest" keyword
  display** — the "Crest (decorated)" keyword-display setting hid each feature's Action
  field (it assumed the since-retired head eyebrow carried it), so the default view
  never said whether an ability was a main action, maneuver, or triggered action. The
  action type now renders as a right-aligned chip on the keyword line in crest mode —
  the inline-text option's placement, pill-styled to match the head's cost chip. The
  other keyword-display modes (Inline text / Grid / Ledger) already showed it and are
  unchanged. (An intermediate take that stamped the label into every feature header
  regardless of display mode shipped briefly earlier today and was reverted — it
  doubled the label everywhere except crest.) (SC-95)
- **Settings rebuilt as native Obsidian pages with global search (SC-131)** — the 6,850px
  single-scroll settings tab became native per-section pages rendered from declarative
  definitions; every setting is findable from Obsidian's built-in settings search; the live
  preview docks to the viewport bottom so it stays visible while toggling. [BREAKING for
  pre-1.13 Obsidian clients: minAppVersion raised to 1.13.0; versions.json pins them to
  6.0.1.]
- **Plugin crest glyphs optically centered (SC-130)** — the plugin twin of the site's
  SC-129 fix; one measured em-based nudge across all crest surfaces, scale-proof at the
  text-size extremes.
- **Stamina edit modal math fixed (SC-133)** — negative Apply inputs no longer invert
  operations, Spend Recovery never burns a Recovery for zero gain (honest preview + real
  disabled state with reason), and temp grants follow RAW take-higher against live
  session temp.
- **Encounter builder no longer charges 4× EV for minions** — a minion statblock's EV
  buys *four* minions ("The EV for minions represents four minions together"), and the
  builder adds them four at a time, but two paths priced that group per-creature: the
  qualifier match only accepted the word spelling `for four minions`, so the 12
  statblocks the book spells `for 4 minions` (angulotl, dwarf, radenwight) were billed
  4× — four 1st-level minions cost 12 EV instead of 3; and the statblock-page **+**
  button captured only the first token of the `EV 3 for four minions` head chip,
  dropping the qualifier and mispricing *every* minion added from its own page. Both
  now price per group of four, so eight 1st-level minions total 6 EV — exactly one
  1st-level hero slot, matching the quick-build rule "eight minions fill one hero slot".
- **Ability `effects[]` no longer drops named effects** — the parser previously
  recognized only `Effect`, the *first* `Spend X`, and `Trigger`, so any other named
  rider (`Persistent N`, `Strained`, `Special`, `Mark Benefit`, class-specific labels)
  and every second `Spend X` were dropped from the structured `effects[]` array in the
  JSON/YAML/DSE data (they still showed in the rendered body). Effects are now captured
  generally, in document order, across all formats. Fixes the reported gaps on Minor
  Telekinesis (missing "Spend 3 Clarity"), Conflagration (missing "Persistent 2"), and
  Hoarfrost (missing "Strained"). The array now mirrors source document order, including
  where the power roll sits (e.g. an Effect stated before the power roll stays before it).
  No schema change (the existing `{name, cost, effect}` entry already covered it).
- **Dragon's Fire no longer lists eight armor enhancements as its effects** — the
  9th-level armor-enhancement descriptions (Invulnerable, Leyline Walker, Life, …) were
  printed after the Dragon's Fire statblock in the source and got absorbed into its
  `effects[]`. The source now places the ability at the end of the enhancement list, so
  its `effects[]` is just the power roll; the enhancements render as prose on the Imbue
  Armor page as before. (The general "end a section's scope without moving content"
  annotation this motivates is roadmapped.)

## 2026-07-21 — any/all keyword filters (SC-88)

### Added

- **Keyword filters can now require ALL selected keywords** (SC-88) — the Features and
  Bestiary browsers' Keyword facet gained an `any`/`all` toggle pill: `any` keeps the
  match-any behavior, `all` narrows to entries carrying every selected keyword
  (e.g. Area **and** Fire). Single-valued facets (Type, Role, Level…) are unchanged.

## 2026-07-21 — site fix (SC-89)

### Fixed

- **Green Animal Forms table no longer shows literal `<br>` text** (SC-89) — the
  elementalist Disciple of the Green forms table carried mid-sentence `<br>`
  PDF-extraction artifacts, and the feature-card table renderer escaped them into
  visible text. Artifacts removed from the source, and card prose now renders a
  deliberate `<br>` (e.g. the Summon Source of Earth stat grid) as a real line break.

## 2026-07-20 — data + site deploy (DSE 6.0.0 wave)

### Added

- **Monster statblocks now carry their family's Malice features** — every monster
  statblock page embeds the group's shared Malice featureblock as a band (381 Browse
  statblock pages; the standalone Malice pages remain).
- **Statblock secondary-stat cell is now context-driven** — minions show their real
  "With Captain" bonus (a parser field that was silently dropped is now rendered),
  summoner minions show "Free Strike Damage Type", and creatures with neither drop the
  blank cell instead of showing a dash.
- **All statblock action-type usage cells link to the rules glossary** — 1,685 cells
  swept across all four books (Main action, Maneuver, Triggered action, …), completing
  the linking pass the first 19 exemplar cells started.
- **Class-owned bestiary pages back-link their class** — beastheart companions and
  summoner fixtures (36 pages) now point back to `class/beastheart` / `class/summoner`.
- **Statblock sticky mini-header gets a compact phone variant** — one-line truncating
  name + single stat row (~9% of a 390px viewport, was ~23%); desktop unchanged.
- **Treasure data is now structurally complete** (SC-13) — `item_prerequisite`,
  `project_source`, and per-level `level_effects` populate in the JSON/YAML formats,
  and every entity's JSON declares its `scc` key so strict schema validation passes.
- **`steel-compendium-sdk` 3.0.0 published to npm** — the first 3.x release: single
  `role` + `organization` + `keywords` statblock fields, ten new typed model families,
  2019-09 schemas. Existing 2.x version-range consumers are unaffected until they
  upgrade.

### Fixed

- **Idiomatic false-positive links removed** (SC-86, SC-87) — 23 prose words that were
  wrongly linked as game terms ("guidelines", "edge case", "in turn", "misguided", …)
  are plain text again; genuinely mechanical uses keep their links.
- **Companion/fixture/rival pages no longer show a duplicate page title** — the
  class-owned back-link line now sits inside the statblock card, preserving the
  title-suppression the other statblock pages get.

### Internal

- **data-unified publishes pinnable releases** — `just deploy` (and standalone
  `just release-data`) cuts a GitHub Release on data-unified (tag `v4.<timestamp>`)
  carrying `md-dse-unified-en.zip`, the DSE-format Browse tree the Draw Steel Elements
  plugin syncs from (F2 OD-2). Today's release: `v4.20260720213840` (first:
  `v4.20260717013458`).
- Deploy recipe fix: `release-data` is now invoked against the workspace justfile
  (sub-repo justfiles shadowed it, aborting the first full `just deploy`).

## 2026-07-15 — site fixes (SC-84)

### Fixed

- **Stray purple line beside ancestry/class content** — every ancestry page (and the
  class pages' big ability collections) wrapped its whole trait tree in one card
  whose panel spanned thousands of pixels, invisible except its 3px purple act
  spine running down the page gutter. Section-scale wrappers are now frameless
  (the crested header stays; nested sections carry the framing), and their content
  aligns with the rest of the page. Leaf trait cards are unchanged. (SC-84)

## 2026-07-14 — site fixes (SC-66, SC-81)

### Fixed

- **Statblock "Villain Actions" band lost its stray admonition chrome** — Material
  styles every `details`/`summary` in page content as a collapsible "note"
  admonition, which painted a pencil icon, a blue border, a second chevron, and a
  cramped block header over the band's own design; the band now neutralizes that
  chrome (crest · title · one chevron on the rail, correct spacing). Head chips
  mixing a link and a value ("Villain Action 1", "2 Malice") also regained the
  space that inline-flex was dropping — all ~350 such chips site-wide. (SC-66)

- **Beastheart Companion Rules match the sourcebook** — the "Ranged Free Strikes"
  and "Shared Maneuvers" entries were merged into one bullet, the two "You and your
  companion…" action-economy paragraphs floated as unlabeled bullets instead of
  sitting inside the "Companion Actions" entry, and the list split in two at a PDF
  column break. The input transcription now matches the book, and the trait-card
  renderer learned proper markdown list semantics (loose lists stay one list;
  indented continuation paragraphs stay inside their item). (SC-81)

## 2026-07-12 — title pages show echelon (SC-83 follow-up)

### Fixed

- **Title pages show their echelon** — each Browse title leaf page now carries an
  "**Echelon:** 1st" line above its Prerequisite (the flat page had lost the book's
  echelon group header; follow-up to the grouped Titles index). (SC-83)

## 2026-07-12 — site fixes (SC-79, SC-80)

### Fixed

- **Summoner and Beastheart Basics match the base classes** — both class pages
  rendered their Basics section as a "Level 1 Feature" trait card (with a nested
  advancement-table card) instead of the plain prose every Heroes-book class uses,
  and their class landing cards were missing the stats strip (starting stamina,
  stamina per level, recoveries, potencies, skills) and primary-characteristic
  tags. The Basics sections were annotated as features against the annotation
  guide, hiding their prose from the class parser; they now render and carry
  class data exactly like the base classes. (SC-79)
- **Beastheart's Ride Along and Wild Rumpus perks render as proper ability blocks** —
  both perk pages showed raw PDF-extraction artifacts: keywords and action type mashed
  into one bold line, a garbled "o Melee 1 x Companion" distance/target line, a stray
  "Main action" line, and a mid-sentence line break in Wild Rumpus's effect text. The
  book source now carries the standard blockquoted ability shape (keywords/action +
  📏/🎯 tables, verified against the printed book), so they render like the heroes
  book's ability-granting perks. (SC-80)

## 2026-07-12 — site fixes (SC-82, SC-83) + card polish

### Fixed

- **Polder traits render as proper trait cards** — the Polder ancestry page showed
  "Signature Trait: Small!" and all six purchased traits as plain text without their
  point costs (the signature-trait heading sat at the wrong level, outside the
  "Polder Traits" section every other ancestry nests under). They now render as
  nested trait cards with cost chips, matching the other ancestries, and
  "Signature Trait: Shadowmeld" gained its own trait page/code
  (`feature.trait.polder/shadowmeld`) embedding the Shadowmeld ability, like
  Wode Elf's The Wode Defends. (SC-82)
- **Titles show their echelon again** — the Browse Titles index is grouped under
  "1st Echelon" … "4th Echelon" sub-headers (as the book and the v1 site grouped
  them), each title card's type label reads "Echelon N", and the `echelon` field
  now flows into title frontmatter/JSON/YAML for both the Heroes and Summoner
  books. (The `N-echelon-titles` groups in the book sources never carried the
  `@echelon` annotation, so no title ever got the field.) (SC-83)
- **Card-preview names no longer break mid-word** — long ability names on index
  cards (e.g. "Unearthly Reflexes", "To the Uttermost End") wrapped as
  "UNEARTH / LY / REFLEXES"; they now wrap on whole words. (Material's prose-link
  `word-break` was being inherited into the card `<a>`, and the compact preview
  name/rail sizing was starving the title track.)
- **Card titles & stat readouts are legible in light mode** — the "steel" ink
  used for ability/statblock/featureblock titles, stat values, and card footer
  figures was a washed-out ~1.9:1 grey on light backgrounds; it now uses a
  readable steel. (Dark mode is unchanged.)
- **No more stray "-" keyword chip** — abilities with no keywords (Furious Change,
  Unearthly Reflexes, …) rendered a lone "-" chip on their preview and full cards;
  the "none" placeholder is now dropped.
- **Chip text is vertically centered** — keyword chips, folder-count pills, and the
  class-page "Level 1–10" rail no longer ride high/low in their pills; the rail
  figures also sit flat on the baseline (lining numerals).
- **Settings sliders line up** — Text size and Card size both show 100% with their
  thumbs at the same (centered) track position instead of at 33% vs 60%.

## 2026-07-02 — round-2 review fixes (SOT-3847)

Fixes from the round-2 review (SOT-3847 comment feedback).

### Changed

- **Card control strip is one aligned row** — the copy-permalink button now
  mounts inside the card head with the pin / encounter-add / MD/PNG buttons
  (same top, matching gaps); it no longer straddles the card border, where it
  had ended up overlapping the scaler's "≈ scaled from level…" note.
- **Empty encounter tray still expands** — the heroes/level/victories party
  inputs (and difficulty bands) are reachable before any monster is added;
  the share/markdown actions stay hidden until there is something to share.
- **Class card rail reads as one field** — the deck line under the
  "Might · Presence" mini is now its caption ("primary characteristics")
  instead of the second data point "start at 2".

### Removed

- **"In this chapter" mini-TOC** on Read chapters — redundant with the
  built-in right-sidebar table of contents, and it sat off-center under the
  new centered chapter titles.

## 2026-07-02 — UX-wave feedback round 2 (SOT-3850…3854)

Second feedback round on the UX wave (SOT-3847 subtasks SOT-3850…3854).

### Changed

- **Statblock scaler lives in the Level chip** — hover the card and −/+ steppers
  appear flanking the chip (the same reveal as the copy-link/pin/encounter
  controls); while scaled the chip turns amber, the steppers stay visible, and
  the approximation note above the card gains a Reset button. The separate
  "Scale to level" input row above the card is gone. (SOT-3850)
- **Page actions moved to a top-right strip** — on plain (non-card) pages the
  page permalink and pin are now always-visible card-style buttons in the
  top-right of the content pane, replacing the hover-revealed inline icons
  beside the H1. Read chapters — whose pin previously mounted on the first
  *embedded* card — now pin correctly as pages, under the chapter's own title.
  (SOT-3851)
- **Encounter tray: the whole header row collapses/expands** — the chevron
  alone was too small a target; the ⋯ menu button hides while collapsed (its
  dropdown opened below the bottom-fixed tray, off-screen) and an empty tray's
  menu now opens upward. (SOT-3852)
- **Class card header balanced** — the head's right rail now carries the book
  chip and the primary characteristics ("Might · Agility" + "start at 2"),
  mirroring the statblock's Level/role/EV rail; the stat and potency strips
  became two matched 3-column rows of centered value-over-label cells (the
  statblock defense-grid pattern). (SOT-3853)
- **Chapter pages open book-style** — centered title with a small-caps
  "book · Chapter N" eyebrow above it, symmetric over the ◆ divider, instead
  of a full-width display H1 jammed left. (SOT-3854)

### Fixed

- **Duplicate page title over statblock cards (live regression)** — the
  scaler's control row sat between the page's `hr` and the card, breaking the
  strict h1+hr+card adjacency that hides the duplicate H1; the scaler UI (now
  the note) lives inside the card wrap instead. (found while testing SOT-3850)

## 2026-07-02 — UX-wave feedback round (SOT-3847)

Feedback round on the UX wave — the SOT-3847 subtasks (SOT-3839…3845).

### Fixed

- **Pinboard removal works** — the × on `/pins/` used a toggle that could re-add the
  item with no title (rendering "undefined"); removal is now a pure remove, the
  delegated listener survives instant-nav script re-execution, and removing the last
  pin restores the empty-state prose. (SOT-3840)
- **"Copy as Markdown" no longer truncates** — python-markdown's link pattern outranks
  its raw-HTML pattern and rewrote `[text](url)` *inside* the card's `data-src`
  attribute into an `<a href>` whose quote terminated the attribute mid-statblock.
  Trigger characters (`[`, backtick, backslash) are now entity-encoded; the copied
  markdown also converts file-relative links to absolute site URLs. (SOT-3843)
- **Statblock scaler potencies actually scale** — the potency rewrite matched a
  literal `<` but tier rows arrive as innerHTML where it's `&lt;`; the pattern is now
  entity-aware. (SOT-3844)

### Changed

- **Pin control is a pushpin and auto-hides** — the ★ became the Material pushpin
  (outline → filled when pinned) and the inline button beside prose H1s is
  hover-revealed like the ¶ permalink. (SOT-3841)
- **Encounter tray got a ⋯ menu** — Clear encounter / Reset builder / Close (close is
  session-scoped and re-opens when something is added). The footer Clear button moved
  into the menu. (SOT-3842)
- **Statblock scaler is comprehensive** — "Scale to level" now also shifts the five
  characteristics (clamped ±5), every "Power Roll +N" bonus (the dice roller follows),
  and potencies inside ability effect prose, all as deltas from the printed values
  per the book's *Adjusting Monster Levels* formulas. (SOT-3844)
- **Class landing card carries the class's numbers** — starting characteristics,
  starting stamina, stamina per level, recoveries, and the skills line, plus the
  flavor text styled inside the card (its duplicate opening paragraph is dropped from
  the body). The ten "Nth-Level Features" jump pills collapsed into one "Level
  1 2 … 10" group. Parser now emits `starting_stamina` / `stamina_per_level` /
  `recoveries` / `primary_characteristics` frontmatter (schema fields already
  existed). (SOT-3845)
- **Table Reference covers the official Rules Reference** — added common main/move
  actions, hero token spends, surges, saving throws / EoT / potency notation, size,
  areas of effect, forced-movement specifics (stability, slams, breaking objects),
  edge+bane mixing, and the skill +2 — paraphrased and cross-checked against the
  book text (which supersedes the PDF where they differ, e.g. surge damage).
  (SOT-3839)

## 2026-07-02 — the UX wave (P1–P11)

Eleven efforts from the 2026-07-01 UX review
(`docs/superpowers/specs/2026-07-01-v2-ux-analysis.md`), all shipped to the live v2
site across a series of deploys on 2026-07-02. Per-effort detail:
`docs/superpowers/plans/2026-07-01-p1…p11-*.md`.

### Fixed

- **Mobile statblock names no longer collapse letter-per-line** — at phone widths the
  card header's right rail (role/Level/EV) now stacks *under* the name instead of
  starving its grid column. Applies to every card type (statblock, ability, kit,
  featureblock). (P1)
- **Class pages and Read chapters got their titles back** — the CSS that hides the
  duplicate `# Name` heading on single-card leaf pages over-matched any page
  *containing* a card; it is now keyed on strict `h1 + hr + card` adjacency. (P1)
- **Custom 404 page** — search hint, links to Browse/Books/Bestiary, and a
  report-a-broken-link action, replacing the bare "404 - Not found". (P1)
- **Leftover `/Browse/index_old/` page removed** — it was live, search-indexed, and
  the source of the phantom duplicate "Browse Rules" sidebar entry. (P1)
- **Browse landing "View Retainers" card** pointed at the retired `retainer/` path;
  now links `monster/retainer/`. (P1)
- **Search ranking favors canonical pages** — per-type `search.boost` frontmatter
  (classes 4×, rules/conditions/ancestries/movement 3×, statblocks 0.6×): searching
  "fury" now returns the Fury class before the four Rival Fury statblocks, "jump" the
  movement rule before War Dog Blood Jumper. (P2)
- **Bestiary Size filter is a closed vocabulary** — dynamic-terrain free-text area
  descriptions ("any area; the area can't be moved through", …) bucket as a single
  "Area" chip instead of appearing verbatim. (P2)
- **Home page polish** — brand line unified ("Steel Compendium" + curated-by byline),
  the 12-repo legacy data list collapsed behind a disclosure. (P1)

### Added — navigation

- **Class landing headers** — every Browse class page opens with a card (Class
  eyebrow, name, Weak/Average/Strong potency strip) and a jump bar over its ~12
  sections, instead of untitled prose 82,000px tall. (P3)
- **Read-chapter reading aids** — prev/next chapter links (book order), a collapsible
  "In this chapter" mini-TOC at the top of each chapter, and a "Resume reading (N%)"
  chip that restores your last position per chapter. (P4)
- **Per-class ability tables** — each `Browse → Features → Abilities → <class>` index
  now carries a sortable Name · Lv · Cost · Action · Distance · Target table of the
  class's complete ability list (tablesort column sorting; responsive column-dropping
  on phones). (P5)

### Added — at-the-table tools

- **Table Reference tab** — a one-page GM screen: turn structure, the power roll with
  edge/bane/crit rules, condition one-liners (verified against the rule text), common
  maneuvers, movement, dying/recovery, combat modifiers, and director quick numbers.
  Print-optimized. (P6)
- **"My Table" pinboard** — a ★ control on every entity page pins it to `/pins/`,
  grouped by kind (localStorage, this-browser-only). (P7)
- **Encounter builder** — a "+" on every Bestiary row (and on statblock pages) feeds a
  budget tray: party inputs (heroes/level/victories), the book's encounter-strength
  math and Trivial→Extreme difficulty bands, minions priced four-at-a-time, over-level
  ⚠ warnings, shareable `?enc=` links, and copy-as-markdown. (P8)
- **Click-to-roll power rolls** — click any power-roll header for a 2d10 popover with
  edge/bane steppers (single = ±2, double = tier shift, natural 19–20 crits) and a
  highlight on the matching tier row. (P9)
- **Card exports** — hover any entity card for MD (copies the original source
  markdown) and PNG (2× card render) export chips, joining copy-link / pin /
  add-to-encounter in the top-center control strip. (P10)
- **Statblock level scaler** — a "Scale to level" stepper applies the Monsters book's
  *Adjusting Monster Levels* formulas as deltas from the printed values (EV, Stamina,
  free strike, damage tiers, potencies — the formulas reproduce printed blocks
  exactly at their own level), with a dashed outline + "approximation, not a published
  statblock" banner and exact restore. Session-only by design. (P11)

### Internal

- **Test infrastructure**: two e2e regression suites (`page-titles`, `cardhead-mobile`;
  playwright-core driving Brave, runnable against local builds or production) and six
  new node:test unit suites (~35 tests) over the new `*-core.js` logic modules; five
  new Go test files in steel-etl's site builder.
- **steel-etl site builder**: new leaf transforms `class_page.go` (landing header),
  `ability_table.go`, `search_boost.go`, `export_src.go` (single-line `sc-src`
  source-template island; the embed pass strips it from transclusions), and
  `sizeFacet` normalization in `bestiary_search.go`.
- **Shared UI contract**: per-card page actions live in the hover-revealed top-center
  control strip (documented in `DESIGN.md` → "Card header system") — the head grid's
  right column is off-limits.
- **Bestiary data seam**: `steel-bestiary-browser.js` republishes its parsed records
  as `window.SC_BESTIARY_ITEMS` (its mount destroys the JSON island).
- **Vendored**: `html-to-image` 1.11.13 (MIT) for the PNG export.
- **Docs**: v2 `.repo-docs` + `README`/`CLAUDE.md` refreshed and cold-start-tested;
  steel-etl `docs/site-builder.md` extended; DESIGN.md component rows; FOLLOWUPS #23
  (mobile sticky mini-header bulk) recorded; all 11 plans + the analysis stamped
  executed.
