# Follow-ups

<!-- next-id: 51 -->

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below — **take N from the `next-id` counter
above, then bump it** — instead of chasing them now, and **clear these before starting
a new feature.** New features and larger efforts go in `ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line; on a
periodic cleanup pass, completed items are moved to `docs/followups-archive/` keeping
their original number as a `(was FOLLOWUPS #N)` handle. **Numbers are permanent — never
reused, never renumbered**, so gaps in the live list (there's no #6) are expected and
there is no grep-and-fix step: a `#N` reference resolves forever. **Referenced `#N` not
in this file? It's completed — `grep -rn 'was FOLLOWUPS #N' docs/followups-archive/`.**
Most recent archive:
[`docs/followups-archive/2026-06-18-completed.md`](docs/followups-archive/2026-06-18-completed.md).

<!-- Template — copy for each item; take N from next-id above, then bump next-id:
## N. Short title
**Status:** open
- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description
- **Why:** motivation / value
- **Context:** file paths, gotchas, anything that saves grep time
- **Effort:** XS (<1 h) / S (1–4 h) / M (1 day) / L (multi-day) -->

*(Items 32–35 below were all identified during Plan 20 — Steel material parity — Task 8
final visual verification, `draw-steel-elements` worktree `steel-material`: documented in
the session report but not filed as durable follow-ups, caught by review before the plan
closed. Evidence for all four: `.superpowers/sdd/task-8-report.md` §2 (per-family visual
verdicts) and the contact-sheet image pairs in `.superpowers/sdd/shots-parity/`
(`0N-<family>--site.png` / `--plugin.png`), both session scratch in the `steel-material`
worktree. All four are DOM/markup changes — Plan 20 was CSS-only (material properties:
sheen/bevel/hairline/gradients) and the plugin's card DOM is pinned by the jest suite (143
suites / 2000 tests) and the golden-PNG baseline (LEGACY-FREEZE byte-identity check), so
none could be fixed inside that plan. None trips the automated parity gate
(`draw-steel-elements/visual-harness/parity`): the gate diffs material properties
(background-image/box-shadow/border) on mapped selectors, not layout/structure, so a
structural divergence like these is invisible to it by design.)*

## 48. Hero sheet still overflows a 300px sidebar leaf after the container-query fix
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 4 (catalog D-7 re-verification) — dse `a420ef3`
- **What:** `.dse-hero__grid`'s `@container (max-width: 480px)` fold was dead (containment
  declared on the grid itself, so it queried an ancestor that did not exist); Batch 4 moved
  the containment up to `.dse-hero` and the fold now works. The sheet nonetheless still runs
  off the right edge of a real 300px Obsidian sidebar leaf: after the fold its min-content
  is ~370px against ~266px of usable width, so Presence is still clipped out of the
  Characteristics row and the panel frames still extend past the leaf.
- **Why:** the sidebar is a first-class mount for `ds-hero` ("Send block to sidebar" is
  universal, plan-18 spec §5). Half-fixed is better than dead, but the sheet is still not
  usable at sidebar width.
- **Context:** the residual comes from two rows that do not shrink — the 5-column
  Characteristics grid and the stamina row (stepper + pips + Catch Breath). Evidence:
  `hero--obsidian-sidebar-steel-dark.png` (post-fix) and the before/after composite in
  `.superpowers/sdd/sc121-audit/batch4-evidence/hero-sidebar-before-after.png`. Reproduce in
  the browser harness with `?element=hero&width=300` (the Batch 4 narrow axis) — no Obsidian
  needed to iterate. Deliberately not fixed in Batch 4: choosing between wrapping the
  characteristics row, giving it its own scroll frame, or scaling the type is a design
  decision, not a dead-rule repair.
- **Effort:** S (1–4 h)

## 49. Legacy theme has no markdown-table styling at all, including the new scroll frame
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 4 (batch-3 review L-5 fix) — dse `d94e025`
- **What:** Batch 3's C-6 table baseline and Batch 4's `.dse-md-table` scroll frame are both
  Steel-only + print-excluded, so under the Legacy theme (and in print/PDF export) a book
  pipe-table is still unstyled AND still overflows its card at narrow width — measured
  380px of table in a 300px leaf.
- **Why:** Legacy is still a shipping theme and the compendium's mini-statblocks are common.
  The overflow half of this is arguably a bug rather than a styling choice.
- **Context:** `styles-source.css` §7, `table:not([class])` + `.dse-md-table` rules. The
  wrapper ELEMENT is emitted in every theme (`src/framework/mdTableWrap.ts` runs from
  `ElementView.renderMarkdown`), so a Legacy fix is CSS-only — but any Legacy-scoped rule
  changes the frozen `*--legacy-*` bytes and needs a sanctioned rebaseline (see the
  `dse-verify` skill's freeze section). `perk-narrow--legacy-dark.png` is now a pinned
  fixture showing exactly this state.
- **Effort:** S (1–4 h)

## 50. Stamina-edit modal's "Dying" zone label is near-invisible, and no "Winded" zone renders at all
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 4 review (finding L-5), surfaced by the new
  `modal-stamina*` Obsidian-camera coverage — `modal-stamina--obsidian-steel-dark.png`
- **What:** two related gaps in `staminaPreviewBar()`
  (`src/views/StaminaEditModal.ts`): (1) `.dse-stamina--modal .dse-stamina__threshold--dying`
  sets `color: var(--dse-stamina-track)` on the "Dying" label, which renders grey-on-green
  at roughly 1.1:1 contrast against the healthy fill behind it — effectively unreadable;
  (2) the modal only ever renders a `dyingZone`, never a "Winded" threshold, so that zone
  has no label at all in the modal, unlike the card/canvas stamina bar
  (`canvas--obsidian-readonly-steel-dark.png`) where both zone labels
  (`.dse-stamina__pill`) render legibly in white over a hatched fill.
- **Why:** the coverage batch's job was to surface exactly this kind of never-looked-at
  defect rather than leave it sitting unnoticed in a PNG.
- **Context:** compare `.dse-stamina__threshold--dying`'s color rule (styles-source.css,
  the "hero Dying zone" block) against `.dse-stamina__pill`'s (`color: var(--dse-fg)` on an
  opaque `--background-primary-alt` chip) for the contrast fix; adding a "Winded" zone to
  the modal preview bar is a second, separate design call (`StaminaPreviewBarOptions` would
  need a `windedZone` fraction, and dying/winded modal semantics differ from the card's
  live-model zones).
- **Effort:** S (1–4 h)

## 45. `--dse-font-mono` never resolves — the mono slot is dead everywhere
**Status:** done (2026-08-04, SC-121 Batch 3 — dse `5df83f4`)
- **Resolution:** re-homed the declaration to the element roots
  (`:is([data-dse-element], .dse-modal)`), which sit below `body` and can therefore see
  Obsidian's `--font-monospace`. Deliberately NOT copied into the per-theme Steel blocks
  the way SC-112 did for `--dse-font-controls`: mono is theme-INVARIANT in the token map
  (`STEEL_INVARIANT` in `token-coverage.test.ts`) and one of its consumers
  (`.dse-rollcard__breakdown`) is theme-agnostic, so a Steel-only re-declaration would
  have left the Legacy path just as dead. The `:root` entry stays as the vocabulary
  contract (`LEGACY_MAP` pins it). Verified by real-browser computed-style probe in both
  themes: token `''` → the full monospace stack; `.dse-tiles__value` serif → monospace;
  `.dse-rollcard__breakdown` inherited → monospace; the tier-1 badge's `::first-letter`
  now takes the real slot (B-3's literal fallback stack kept as belt-and-braces).
  Confirmed in real Obsidian (`kit--obsidian-steel-dark.png`). freeze 101/101.
- **Identified:** 2026-08-04, SC-121 Batch 2 (B-3, the tier-1 "≤" glyph fix) — found by
  reading computed styles off a running Obsidian, not from the stylesheet.
- **What:** `styles-source.css` declares `--dse-font-mono: var(--font-monospace)` in the
  `:root` token block (~3009). Obsidian declares `--font-monospace` on **`body`**, one
  level DOWN from `:root` — and the browser harness's `visual-harness/vars.css` does the
  same. So at `:root` the `var()` is unresolvable, `--dse-font-mono` computes to the
  guaranteed-invalid value, and it inherits as invalid to every descendant: any
  `font-family: var(--dse-font-mono)` declaration is dropped at computed-value time.
  Confirmed in the app: `getComputedStyle(elementRoot).getPropertyValue('--dse-font-mono')`
  returns the empty string while `--font-monospace` right beside it returns the full stack.
- **Why:** Two consumers are silently not getting the face they ask for — SC-100's kit
  stat-tile **value** (`.dse-tiles__value`, whose whole design point is the site's
  monospace readout) and `.dse-rollcard__breakdown`. Neither has ever rendered monospace in
  Obsidian OR in the harness, so no shot or gate has ever shown the difference. SC-121 B-3
  worked around it locally with a `var(--dse-font-mono, <literal monospace stack>)`
  fallback; that rule picks the real slot back up for free once this is fixed.
- **Context:** Fix is to re-home the declaration to a scope that can see Obsidian's vars
  (`body`, or the element-root selector the other slots already use) rather than adding a
  literal fallback at `:root`, which would permanently ignore the user's configured
  monospace font. Note it lands a **visible** change on the kit steel shots (tile values
  become monospace) — expected, and the frozen print shot is unaffected (`.dse-tiles__value`
  is already print-excluded). `test/dom/theme/steelTypography.test.ts`'s mono gate and its
  `SC100_STEEL_CONSUMERS` allowlist are the tests to update alongside.
- **Effort:** S

## 46. Keywords chip is one chip for all keywords, not one chip per keyword like the site
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 2 review fix round (B-1 meta block
  recomposition).
- **What:** The site renders each keyword as its own `.sc-ability__chip`
  (`steel-ability-cards.css`); the plugin renders the whole Keywords value as ONE
  chip, since `renderFeature.ts` produces it as a single markdown-rendered,
  comma-joined text node rather than a list of discrete keyword strings.
- **Why:** Deferred rather than fixed in Batch 2 because splitting the value into
  N chips would restructure the DOM feeding the Legacy inline "Label: value" text
  run, and that run's bytes are pinned by the LEGACY-FREEZE PNG baseline — a real
  risk for no alignment benefit, since the alignment defect Batch 2 fixed was the
  band structure (Keywords/Type vs. Distance/Target), not the chip count within
  the Keywords band.
- **Context:** `.dse-feature__meta-cell--keywords` (`styles-source.css` ~4333,
  scoped under `[data-dse-theme='steel']:not([data-dse-print="on"])`);
  `renderFeature.ts` (chip-band DOM emission). Would need the keywords value
  split into a list before render, theme-agnostically, without touching the
  Legacy text-run path.
- **Effort:** S

## 47. Steel card-head NAME is 83% of the site's — the crest only *looks* oversized
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 3, investigating catalog item C-3 ("kit crest
  icon oversized ~1.9x relative to its eyebrow/title block"). **C-3 as written did not
  reproduce** — the crest is already at site parity; measuring it turned up this instead.
- **What:** Measured in the harness (900px viewport, Steel dark, `getBoundingClientRect`
  + `getComputedStyle`, not pixel-counting a 2x PNG):
  - `.dse-crest--lg` box **48 x 54.39px**, glyph svg **24 x 24px** — against the site's
    `.sc-crest.lg { width: 50px; height: 56px }` and `.sc-crest.lg svg { 24px }`
    (`v2/docs/stylesheets/steel-redesign.css:55-56`). That is **96% / 100%** of the site.
    The catalog's "~84px wide" figure is explained exactly by the shield's own clip-path
    (`polygon(6% 0, 94% 0, …)` = 88% of 48px = 42.2 CSS px = 84.5 device px at the shot's
    2x scale), which confirms the 48px box rather than contradicting it.
  - `.dse-head__primary--left` (the card NAME) is **20px / 23px line-height** against the
    site's `.sc-head__left-primary { font-size: 1.5rem; line-height: 1.04 }` = **24px /
    24.96px** — the plugin's name is **83%** of the site's. The eyebrow is 13.6px vs the
    site's `.9rem` = 14.4px (94%).
  So the crest reads large *relative to* its title because the title is small, not
  because the crest is big. Same 20px name on feature, statblock and kit — it is one
  shared Steel rule, not a kit quirk.
- **Why:** Real, measurable site-parity gap on the single most prominent piece of type in
  every card. Invisible to the parity gate: the `head` pair maps `.sc-head` ↔ `.dse-head`
  (the wrapper), so the name slot's font-size is never compared.
- **Context:** `draw-steel-elements/styles-source.css` — the Steel head-primary rules
  around `~3520` (`[data-dse-theme='steel'] .dse-head__primary--left`). Deliberately NOT
  fixed in SC-121 Batch 3: bumping it is a cross-family Steel type-scale change (every
  card head in every family moves, and it interacts with the head's row-gap and the right
  rail's optical centering), which belongs with SC-120's card-head composition work, not
  a "kit crest sizing" item. Whoever takes it should re-check the crest/name ratio
  afterwards (site 56/24.96 = 2.24; plugin today 54.39/23 = 2.37).
- **Effort:** S

## 44. Text-size scale doesn't reach modal content while card zoom does
**Status:** open
- **Identified:** 2026-08-03, SC-112 final whole-branch review (end-to-end walk of the
  Typography preferences), recorded during the review-I1 fix round.
- **What:** Of the two Task 7 scale prefs, card zoom applies inside DSE modals (the
  `.dse-modal` root is a Steel token-scope member and gets css-bearing prefs stamped
  via `reflectCss()` in `DseModal.open()`), but the text-size scale does not reach
  modal content — an asymmetry: the same modal honors one scale pref and ignores the
  other.
- **Why:** User-visible inconsistency: bumping text size scales rendered blocks in
  notes but leaves modal text at 100%, while card zoom tracks in both places.
- **Context:** `draw-steel-elements/src/views/DseModal.ts` (reflectCss stamping),
  `styles-source.css` scale consumer rules (SC-112 Task 7) — likely the text-scale
  consumer selectors don't include the `.dse-modal` scope the card-zoom rules do.
  Decide whether modals SHOULD track text size (probably yes, for consistency) and
  widen the consumer scope accordingly; mind FOLLOWUPS #43's print-anchor shape
  concerns when touching those rules.
- **Effort:** S

## 42. Typography sliders show a double value label ("100%" ours + "1.00" Obsidian's)
**Status:** open
- **Identified:** 2026-08-03, SC-112 Task 8 (Typography settings UI) — flagged in the
  Task 8 review as deferred-minor; Scott to rule after seeing the Typography screenshot
  (attached to the SC-112 Linear comment).
- **What:** The Text size / Card size slider rows render our formatted percent label
  ("100%") next to Obsidian's own native slider value readout ("1.00") — two value
  displays for one control.
- **Why:** Cosmetic clutter in the settings tab; the native "1.00" duplicates (in less
  useful units) what our "100%" already says.
- **Context:** `draw-steel-elements/src/views/SettingsTab.ts` slider rendering.
  Suppressing Obsidian's native readout needs a version-fragile selector against
  Obsidian's internal Setting DOM (it isn't exposed as an API knob) — which is exactly
  why it was deferred rather than done inline. Alternative: drop our label and reformat
  around the native one. Decision is Scott's.
- **Effort:** XS-S

## 43. Print-anchor shape guard doesn't scan the SC-112 scale consumer rules
**Status:** open
- **Identified:** 2026-08-03, SC-112 Task 7 review (deferred-minor findings 1+2),
  recorded at Task 9.
- **What:** `findUnanchoredPrintExclusions()` (Task 5's guard in
  `draw-steel-elements/test/dom/theme/steelTypography.test.ts`) scans only the five
  font-slot consumer rules, not Task 7's text/card scale rules — its pass over the
  scale rules is vacuous. Related: the zoom nested-reset arm anchors a bare
  `[data-dse-element]` compound (safe in context, but it would trip a generalized
  guard as written).
- **Why:** The footgun the guard exists for — a bare `:not([data-dse-print="on"])`
  *descendant* selector is trivially satisfied by any unstamped ancestor, silently
  un-excluding print — applies just as much to the scale rules; today only the
  exact-selector pins (and the freeze) compensate.
- **Context:** Candidate fix is a generalized shape guard: walk EVERY rule in
  `styles-source.css` that both consumes a `--dse-*` font/scale token and carries a
  `:not([data-dse-print="on"])`, and assert the exclusion is compounded onto the
  stamped node (`:is([data-dse-element], .dse-modal)` idiom) rather than free-floating.
  Expect to have to classify the safe root-compound arms (Task 5 counted 15 anchored +
  3 root-compound; Task 7 added the scale arms).
- **Effort:** S

## 41. Parity pair for featureblock advancement bands + stale "PLUGIN-ONLY" CSS comment

**Status:** open

- **Identified:** 2026-08-02, SC-108 design recon (read-only Plan agent), main checkout.
- **What:** Two coupled items. (1) `styles-source.css`'s comment on `.dse-fb__adv-head`
  (~:3877-3880) claims the surface is "PLUGIN-ONLY, no site counterpart" — **factually wrong**:
  `v2/docs/stylesheets/steel-featureblock.css:202-217` has real `.fb__band--adv` and
  `.fb__adv-head` rules, and ~70 live Browse pages carry the DOM (e.g.
  `/v2/Browse/monster/fixture/demon/the-boil-advancement-features/`). Fix the comment.
  (2) A parity pair for `.dse-fb__adv-head`/`.dse-fb__band--adv` is therefore possible and
  would close a real, currently-uncaught material gap.
- **Why not done with SC-108:** the pair needs `plugin-capture.mjs` fixture-selection support
  (its `ELEMENTS` list is flat ids hardcoded to `fixture=default`), a new `urls.json` entry,
  two `selector-map.json` pairs, and a human-reviewed `npm run parity:site` baseline regen —
  a deliberate act per the parity README, not CI-adjacent. Different discipline, own change.
- **Effort:** S-M (the parity:site regen review is the care-heavy part).

## 40. Parity `section-head`/`pr-head` pairs compare the site's text-less flex wrapper against the plugin's title/header content node

**Status:** open

- **Identified:** 2026-07-24, Plan 21 (Steel typography & spacing) Task 3,
  `draw-steel-elements` worktree `steel-type`, closing the body-font/ink/letter-spacing GAPs.
- **What:** Task 1's new `ink` and `letter-spacing` rules report three (pair, rule) misses that
  the gate demands be "matched" but where matching the site node the pair names would make the
  plugin **less** faithful to the site's *visible* text, not more:
  - `section-head:ink` — the pair maps the plugin's `.dse-section__title` to the site's
    `.sc-ability__section-head` (a flex WRAPPER with no text of its own; it computes the
    inherited body ink `rgba(220,226,230,0.88)` dark / `rgb(44,46,48)` light). The site's actual
    visible title text lives in that wrapper's child `.tag`
    (`v2/docs/stylesheets/steel-ability-cards.css:186`), which is
    `color: var(--fx-metal-bright)` = `#d9dee1` dark / `#2c3338` light. The plugin emits no
    separate wrapper+tag (renderFeature.ts writes only `__title` + `__body`), so
    `.dse-section__title` IS the tag and is coloured `var(--dse-metal-bright)` — which computes
    `rgb(217,222,225)` dark / `rgb(44,51,56)` light, i.e. **exactly** the site's `--fx-metal-bright`
    (`steel-redesign.css:16,26`). The plugin already matches the site's real title; the GAP is
    the pair comparing against the wrong (text-less) site node.
  - `section-head:letter-spacing` — same wrapper-vs-tag split. Site wrapper computes `normal`;
    the site's `.tag` is `letter-spacing: .1em` small-caps (…:186); the plugin's title tracks
    `0.07em` (`styles-source.css` small-caps section-title rule). Stripping the plugin to
    `normal` would delete a deliberate small-caps treatment the brief explicitly says not to
    touch (same class as the chip/eyebrow tracking).
  - `pr-head:ink` — the pair maps the plugin's `.dse-pr__head` to the site's
    `.sc-ability__pr-head` wrapper (again body ink). The site's visible pr-head text is `.pre`
    (`--fx-metal`) + `.chars` (`--sc-steel-lighter`, "the FOCUS — read every play",
    steel-ability-cards.css:164) — both *emphasis* inks, neither the wrapper's body-ink default.
    The plugin deliberately renders the power-roll header with heading emphasis
    (`.dse-pr__head { font-weight: bold; color: var(--dse-heading) }`, styles-source.css:~4852),
    computing `rgba(220,226,230,0.95)` dark (RGB identical to the wrapper, alpha .95 vs .88) /
    `rgb(26,29,32)` light. Routing it to body ink `--dse-fg` would make the gate green but
    **de-emphasise** the header the site itself emphasises.
- **Why:** Fixing any of the three to the pair's named site node is the exact anti-pattern
  Plan 21 exists to prevent (a value chosen to make the number vanish). They are deferred as
  deliberate, correct treatments, not silenced defects.
- **Context:** Deferred in `visual-harness/parity/selector-map.json` as
  `"section-head:ink"` / `"section-head:letter-spacing"` / `"pr-head:ink"` (per-(pair, rule)
  form, p21 constraint C3), cited from `expectedGapsNote`; `diff.mjs` enforces the citation.
  The clean fix is to split the two pairs so the gate compares like-for-like: add a
  `section-tag` pair (site `.sc-ability__section-head .tag` → plugin `.dse-section__title`) and
  a `pr-chars` pair (site `.sc-ability__pr-head .chars` → the plugin node carrying the roll
  focus), then drop these deferrals. That needs a `npm run parity:site` baseline regeneration
  (live-site capture), which is why it was not done inside Task 3.
- **Effort:** S (two pairs + one baseline regeneration + triage of whatever the new nodes report)

## 39. Parity gate cannot see the statblock/featureblock block margin — the site's lives on the `*-wrap` node, outside every pair

**Status:** open

- **Identified:** 2026-07-23, Plan 21 (Steel typography & spacing) Task 1 review fix round,
  `draw-steel-elements` worktree `steel-type`, while adding the `margin-top`/`margin-bottom`
  rule to `visual-harness/parity/diff.mjs`.
- **What:** The new margin rule reports `featureblock` `margin-top`/`margin-bottom` as
  "site 0px, plugin 8px" in both schemes, and the fix it demands (shrink the plugin to 0) is
  **wrong**. The `featureblock` pair maps the site's *inner plate*
  (`.md-typeset.fb`, which is deliberately `margin: 0`) to the plugin's *host* node
  (`[data-dse-element='featureblock']`, the outermost node). The site's block rhythm lives one
  level up, on `.fb-wrap` — `margin: 1.7rem auto`
  (`v2/docs/stylesheets/steel-featureblock.css:41`), i.e. **34px** at the site's 20px rem base.
  So the real, unmeasured finding is the opposite of what the gate prints: the plugin's
  featureblock separates from surrounding prose by 8px where the site uses 34px. The same
  latent hole exists for `statblock` (site `.sb-wrap` `margin: 1.7rem auto`,
  `steel-statblock.css:68`; plugin host `margin: 0.5em`) — there it is fully invisible, because
  `.md-typeset.sb` and `.dse-sb` both compute 0 and the pair reads clean.
- **Why:** This is the plan's own failure mode — a real difference that the ruler cannot
  express — so it must not be closed by "fixing" the plugin to the number the gate prints.
  Until it is resolved, the two heaviest card families have **no** block-rhythm coverage, while
  the `card` pair (`.sc-ability`, which carries its own `margin: 1.2rem 0` = 24px) does.
- **Context:** Deferred in `visual-harness/parity/selector-map.json` as
  `"featureblock:margin-top"` / `"featureblock:margin-bottom"` (the per-(pair, rule) form,
  p21 constraint C3), cited from `expectedGapsNote`; `diff.mjs` enforces the citation. The
  clean fix is to add `sb-wrap` / `fb-wrap` pairs (site `.sb-wrap` / `.fb-wrap` → plugin
  `[data-dse-element='statblock']` / `[data-dse-element='featureblock']`) so the outermost
  nodes are compared like-for-like, then drop the deferral — that needs a
  `npm run parity:site` baseline regeneration (live-site capture), which is why it was not
  done inside a review fix round. Note the new pairs would also start reporting the other
  rules on those wrapper nodes; expect to triage that list once.
- **Effort:** S (two pairs + one baseline regeneration + triage of whatever the wrappers
  newly report)

## 37. No fixture exercises three Steel featureblock/sidebar rules

**Status:** done — fixed in worktree steel-body (SC-108, dse `eda8eec`, 2026-08-02,
reviewed/approved; LANDED 2026-08-02, superproject eb346a3). Featureblock `advancement` fixture (shots
164→169; shoot.mjs now fixture-aware with collision-safe naming) + sidebar light shot
(obsidian-shots 131→132). Freeze widened 98→101 additions-only. Parity-pair half spun off as #41.

- **Identified:** 2026-07-22, Plan 20 (Steel material parity) final whole-branch review
  fix round, `draw-steel-elements` worktree `steel-material`.
- **What:** Three shipped Steel rules are rendered by no harness fixture, so nothing —
  neither the golden PNGs nor `npm run parity` — has ever *seen* them: (a)
  `.dse-fb__adv-head`, (b) the Steel `.dse-fb__band--adv` override
  (`styles-source.css:3930`, the malice-rail correction), and (c) the sidebar initiative
  plate override (`styles-source.css` §5 "Sidebar leaf", now a dark rule plus a
  `body.theme-light` twin).
- **Why:** The malice-rail correction is the visually load-bearing one and is currently
  *unproven*: it is asserted only in CSS text. The whole point of this branch is that
  "looks right in a screenshot" is not verification; a rule no fixture renders is worse —
  it isn't even in a screenshot.
- **Context:** The default featureblock fixture emits no Level>0 advancement run
  (`featureblock/view.ts:145-149`), which is what gates the `--adv` band and the adv head.
  Adding a featureblock fixture with a Level>0 advancement run would light up (a) and (b)
  and give both a golden PNG. For (c), the sidebar mount is only shot via
  `obsidian-camera.mjs` (`*--obsidian-sidebar-steel-dark.png`, dark only) — the light
  twin's effect was verified for this fix by injecting a `.dse-sidebar` wrapper in the
  harness and reading `getComputedStyle().boxShadow`, which is a manual, unretained check;
  a light sidebar shot would retain it.
- **Effort:** S (new fixture + regenerate/approve its shots; the sidebar light shot is
  the fiddlier half since it needs the Obsidian camera path)

## 36. `npm run parity` is not wired into CI

**Status:** open

- **Identified:** 2026-07-22, Plan 20 (Steel material parity) final whole-branch review
  fix round, `draw-steel-elements` worktree `steel-material`.
- **What:** `.github/workflows/plugin-ci.yml` runs `npm run tsc`, `npm test -- --ci` and
  `npm run build-no-check` — not `npm run parity`. So half of plan 20's anti-drift
  mechanism (the jest material contract) is enforced and the other half (the computed-style
  site-vs-plugin diff) runs only when a human remembers to.
- **Why:** Human discipline is precisely what failed before: plan 19 shipped a wholly flat
  Steel theme and *passed human review*. A gate that only fires when someone chooses to run
  it does not close that hole.
- **Context:** `npm run parity` needs **no network** — it builds the harness, samples it
  with Playwright locally, and diffs against the committed
  `visual-harness/parity/baseline/site-inventory.json`. Only `npm run parity:site` (the
  deliberate baseline refresh) touches the live site, and that must stay out of CI. The one
  CI prerequisite is a browser: `npx playwright install chromium` (plus `--with-deps` on a
  bare runner) before the step. Also decide the failure policy for a genuine site
  redesign — a stale baseline should fail loudly, not be auto-refreshed.
- **Effort:** XS (one install step + one run step in `plugin-ci.yml`)

## 35. Statblock diamond notch sits under the characteristics strip, not the head band like the site

**Status:** open

- **Identified:** 2026-07-21, Plan 20 (Steel material parity) Task 8 final visual
  verification.
- **What:** On the site's statblock card (e.g. Browse → Monsters → Ashen Hoarder), the
  diamond rule/notch sits directly beneath the head band — right after the
  name/level/role/EV row and the "Construct, Undead" subtitle, before the five stat tiles.
  On the plugin's statblock card, the same diamond notch sits much further down, beneath
  the characteristics strip (the Might/Agility/Reason/Intuition/Presence row) — after the
  stat tiles and the Immunity/Weakness/Movement panels.
- **Why:** Smallest/most cosmetic of the four residual divergences, but still an
  unintended structural difference from the parity target — worth a one-line entry so it
  isn't silently lost the way this whole batch almost was.
- **Context:** Moving the notch requires relocating a DOM element within the statblock
  card markup (`draw-steel-elements` statblock element renderer), which is a structural
  change, not a CSS reorder — out of scope for a CSS-only material plan. Evidence:
  contact-sheet pair `02-statblock--site.png` / `02-statblock--plugin.png`;
  `task-8-report.md` §2 item 2.
- **Effort:** XS–S (relocate the notch element in the statblock card DOM + update the
  jest DOM assertions and golden PNG that pin its current position)

## 34. Feature card carries a left action-type spine the site card does not have

**Status:** open

- **Identified:** 2026-07-21, Plan 20 (Steel material parity) Task 8 final visual
  verification.
- **What:** The plugin's ability/feature card renders a coloured vertical bar down the
  left edge of the whole card (e.g. red for a Main Action strike), visible on both the
  feature and featureblock contact sheets (e.g. "Devastating Rush", "Whip and Magic
  Longsword"). The site's equivalent ability card has no such spine — only the
  outcome-tier rows inside the power-roll table carry a left colour bar.
- **Why:** This is a plugin-only *addition*, not something missing, so filing it is about
  flagging an unintended divergence from a parity-target theme rather than a gap to
  close. The right resolution may legitimately be "keep it" — it could be a deliberate
  plugin affordance (at-a-glance action-type identification in Obsidian, which has no
  site-style page chrome around the card) rather than a mistake to remove. Whoever picks
  this up should make that call explicitly rather than reflexively stripping it.
- **Context:** Removing (or conditionally keeping) the spine is a DOM/markup change in the
  ability/feature card renderer, not a CSS-only tweak, so it was out of scope for the
  CSS-only Plan 20; the card DOM is pinned by the jest suite and the golden-PNG baseline.
  Evidence: contact-sheet pair `01-feature--site.png` / `01-feature--plugin.png` (also
  visible in the `04-kit--plugin.png` and `03-featureblock--plugin.png` shots, since
  nested ability cards carry it too); `task-8-report.md` §2 item 1.
- **Effort:** S (once a keep/remove decision is made) — removal means deleting the spine
  element and its DOM hook plus updating the pinned tests/baseline; "keep" just needs this
  entry closed as a documented, intentional divergence.

## 33. Featureblock option cost renders as an outlined chip, not the site's plain display text; one continuous accent rail instead of a bar per option

**Status:** open

- **Identified:** 2026-07-21, Plan 20 (Steel material parity) Task 8 final visual
  verification.
- **What:** On the site's featureblock option panels (e.g. Devil Malice's "Bureaucratic
  Tape" / "Underhanded Tactics" / "Read the Small Print"), each option's cost renders as
  large plain display text at the right of the option title ("3 MALICE", "5+ MALICE", "7
  MALICE"), and each option panel gets its own short coloured left accent bar (a
  different colour per option — blue, gold, teal). The plugin renders the cost as a small
  outlined/bordered chip instead of plain display text, and draws a single continuous
  accent rail down the entire block rather than a distinct bar per option panel.
- **Why:** Second-highest-priority residual divergence after the kit grid — both pieces
  (cost styling and the per-option vs. continuous bar) are visible on every featureblock
  with priced options, a common surface (malice features, etc.).
- **Context:** Both parts are DOM/markup changes in the featureblock option renderer (a
  plain-text cost slot vs. a chip wrapper; a bar-per-option-panel element vs. a single
  rail spanning the block are different DOM shapes, not restyleable in place), so neither
  fit inside the CSS-only Plan 20; the featureblock DOM is pinned by the jest suite and
  the golden-PNG baseline. Evidence: contact-sheet pair `03-featureblock--site.png` /
  `03-featureblock--plugin.png`; `task-8-report.md` §2 item 3.
- **Effort:** M (restructure the option-panel DOM to give each option its own accent-bar
  wrapper and swap the cost chip for plain display text, plus updated jest assertions and
  a re-baselined golden PNG)

## 32. Kit card renders a label-value stat list instead of the site's stat-tile grid

**Status:** done — rebuilt in worktree kit-tiles (SC-100 / plan 24, dse `db98e13..11e6741`,
2026-08-03, reviewed; Scott's visual gate approved after three rounds). The plan-21 deferral's
freeze/architecture question is resolved by a theme-conditional composition seam
(`CardLayout.steel` slot + `DisplayCardView` branch-at-mount; legacy DOM moved verbatim as
the canonical fallback for every non-steel theme) plus the Steel kit composition: cardHead
crest/eyebrow, boxed Equipment band, fixed 2×4 stat-tile grid with dash tiles (new generic
`statTiles` primitive, own `.dse-tiles*` grammar), signature-ability sub-render kept. Legacy
kit shots byte-identical; the one sanctioned freeze change is the `kit--steel-print.png`
single-hash rebaseline at landing (dse-verify skill documents the exception). §D2's remaining
display families (class/career/…) are deliberately NOT done here — sequenced as **SC-120**
(each needs its own sanctioned `*--steel-print` sign-off; the seam/primitive make each one
layout-data + CSS). Site-side kit gaps filed as SC-115/SC-116/SC-119.

- **Identified:** 2026-07-21, Plan 20 (Steel material parity) Task 8 final visual
  verification.
- **What:** The site's kit tiles (Browse → Kits, e.g. "Arcane Archer", "Battlemind") lead
  with a crest/shield glyph, a small-caps "MARTIAL KIT" eyebrow above the name, an
  equipment summary line, and then a grid of stat tiles — a large value over a
  small-caps label (Stamina per Echelon, Speed, Stability, Disengage, Melee Dmg, Ranged
  Dmg, etc.). The plugin's kit card instead renders a plain label-value list — `Stamina:
  +6 per echelon`, `Speed: +1`, `Stability: +1`, `Melee damage: +0/+0/+4`, `Equipment:
  …` — with no crest glyph and no eyebrow at all.
- **Why:** Highest-priority of the four — the most visible surface and the one most
  obviously mismatched at a glance against the site. Kit is one of the five card families
  the parity gate samples, but the gate only checks material properties, so this
  structural gap sails through it untouched.
- **Context:** Requires new stat-tile-grid markup plus crest/eyebrow slots in the kit
  card renderer (`draw-steel-elements` kit element), a DOM change out of scope for the
  CSS-only Plan 20; the kit card DOM is pinned by the jest suite and the golden-PNG
  baseline. Evidence: contact-sheet pair `04-kit--site.png` / `04-kit--plugin.png`;
  `task-8-report.md` §2 item 4 (also notes the site's kit *detail* page has no `.sc-card`
  at all, so the index tiles are the only valid site counterpart for this comparison).
- **Plan 21 (2026-07-24):** scoped into plan 21 as its Task 4 (kit DOM rebuild) and then
  **DEFERRED, not done.** The rebuild conflicts with LEGACY-FREEZE — a Steel-only DOM
  restructure changes the frozen `kit--steel-print.png`, and the codebase builds one
  theme-agnostic DOM themed purely in CSS, so theme-conditional kit markup would be a new
  architectural pattern. It needs its own design plan to resolve the freeze/architecture
  question first. Plan 21 only gave the kit's existing label-value layout the §A
  type/space/ink treatment (serif body/labels, open line-height, cool ink); the stat-tile
  grid + crest + eyebrow are still absent (see the plan-21 contact sheet
  `.superpowers/sdd/shots-parity-type/04-kit--{site,plugin}.png`).
- **Effort:** M (new stat-tile-grid + crest/eyebrow markup in the kit card DOM, updated
  jest DOM assertions, and a re-baselined golden PNG) — plus, first, a design plan for the
  theme-conditional-DOM vs print-freeze question (plan 21 deferral).

## 31. DSE modals are untouchable by the Steel theme (no `data-dse-theme` on the modal root)

**Status:** done — fixed in worktree steel-body (SC-104, dse `29b1f92`+`95958ab`, 2026-08-02,
reviewed/approved; LANDED 2026-08-02, superproject eb346a3). Two-gap fix: a `WeakMap<App, ThemeService>`
registry + stamp in `DseModal.open()` (per-modal-element; `document.body` still never touched),
AND widening the 4 Steel token-value gates to `:is([data-dse-element], .dse-modal)` — the recon
found the original entry's "no CSS edit needed" claim was wrong. 4 contract tests added
(stamp / live re-stamp / unload teardown / no-op).

- **Identified:** 2026-07-21, SC-10 / Plan 20 Task 6 fix round (`draw-steel-elements`,
  worktree `steel-material`).
- **What:** Nothing under a `.dse-modal` can be themed from CSS today, because
  `data-dse-theme` never appears anywhere in a modal's ancestry. `ThemeService.apply()`
  (`src/framework/seams/theme.ts:80`) is the **single writer** of that attribute and it
  stamps only the per-element render root it is handed — called once, from
  `src/framework/pipeline.ts:380`, for an in-note element mount. `theme.ts:16-17` states
  the rule explicitly: state is per-root, "document.body is never touched" (popout safety,
  D3 §2.5). Obsidian `Modal`s, however, mount into `.modal-container` on `document.body`;
  `src/framework/kit/managedModal.ts:45-47` puts `.dse-modal` on `modalEl` and
  `.dse-modal__title` on `titleEl` there, and `:74-78` builds the footer's kit `.dse-btn`s
  under `contentEl`. All of that is outside every `[data-dse-theme]` subtree, so any
  selector of the form `[data-dse-theme='steel'] .dse-modal…` is dead CSS.
- **Why:** Task 6 wrote exactly such selectors, believing modals were covered, and they
  had to be removed as dead CSS in the fix round. Until this is resolved the plugin's
  modals stay on flat Obsidian chrome while every in-note surface is a forged Steel plate —
  a visible seam — and, worse, the seam is invisible to review: a `[data-dse-theme='steel']`
  modal rule *looks* correct in `styles-source.css`. The affected selectors, all removed
  from `draw-steel-elements/styles-source.css` in the fix round, were:
  - `.dse-modal__section` — was a member of the Steel sunken-cell `:is(…)` list (would have
    given the modal's side-by-side panels the statblock's boxed-cell grammar);
  - `[data-dse-theme='steel'] .dse-modal__title` (emboss) and
    `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-modal__title`
    (display face / uppercase / letter-spacing).
  Also still unreached, though the rule itself is correct and live for trackers, the hero
  sheet and the sidebar leaf: the Steel forged-controls rule
  (`[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-btn, .dse-tabs__tab)…`)
  never reaches modal **footer** buttons.
- **Context:** The fix is a **DOM/TS** change, which is why it could not be done inside
  Plan 20 (that plan forbids touching `src/`). Sketch: have `ManagedModal` stamp the theme
  on its own `dialogEl()` — e.g. call `themeService.apply(this.dialogEl(), this.lifecycle)`
  in `open()`, which also gets the live re-stamp on theme change for free via the existing
  `onChange` subscription. Two things to get right: (a) a modal has no `RenderContext`, so
  the `ThemeService` has to be reachable from the plugin instance rather than from `cx`
  (check how `ManagedModal`'s `App` is threaded); (b) popout safety — stamp the modal's own
  root in whatever window it opened in, never `document.body`, preserving the `theme.ts`
  contract. Once stamped, the three removed selectors can be restored verbatim, and the
  forged-controls rule reaches footer buttons with no edit at all. Cross-refs: the
  scope-limit comments left in `styles-source.css` on the forged-controls rule and on the
  tracker-headings rule both point at this item. Note there is no parity pair for modals
  (they are a plugin-only surface with no site counterpart), so
  `visual-harness/parity/selector-map.json`'s `expectedGaps` stays empty — this deferral is
  **not** a silenced gate finding.
- **Effort:** S (1–4 h), mostly wiring the `ThemeService` handle + a `managedModal` test
  asserting `data-dse-theme` lands on `modalEl`.

## 30. Facet-mode (any/all) toggle a11y polish: fixed aria-label
**Status:** open
- **Identified:** 2026-07-21, SC-88 final review (facet match-mode toggle)
- **What:** The `.sc-facet-mode` toggle uses `aria-pressed` plus a flipping visible
  label (`any`/`all`). Convention for `aria-pressed` is a *fixed* accessible name with
  changing state — add `aria-label="Require all selected values"` (kept constant) so
  screen readers announce "Require all selected values, pressed/not pressed", while
  the visible text keeps flipping.
- **Why:** Current form is interpretable but a mild toggle anti-pattern; two-line fix.
- **Context:** `v2/docs/javascripts/steel-feature-browser.js` + `steel-bestiary-browser.js`
  (`modeBtn` markup string in `facetRow` + the `.sc-facet-mode` click wiring). Keep both
  files byte-identical — the two browsers share the markup/CSS contract.
- **Effort:** XS

## 29. steel-etl gen/site output not fully deterministic run-to-run

**Status:** done (with caveat) — 2026-07-18, `steel-etl` `ff85a10` (landed to main): the
observed troubadour flake did NOT reproduce (16 consecutive full builds byte-identical),
but a static sweep found exactly one structural hazard of the suspected shape —
`fbFeatureAction` ranged a map with first-match-wins semantics — fixed as a
priority-ordered slice with a red/green determinism test. Every other map-range in
internal/* either sorts before emission or marshals through key-sorting yaml/json. If
the flake ever recurs, reopen WITH the captured diff of the flapping file.

- **Identified:** 2026-07-18, FOLLOWUPS #15 verification (A/B diffing full site builds); confirmed unrelated to the #15 change (reproduced with it reverted).
- **What:** Back-to-back `gen --all` + site builds occasionally produce a transient diff on unrelated pages (observed: troubadour feature pages). The #15 implementer worked around it by re-baselining; the #15 reviewer flagged that a non-deterministic build deserves its own tracked item.
- **Why:** Deterministic output is what makes A/B diff verification (and clean deploy commits) trustworthy; a flaky page diff can mask or fake regressions.
- **Context:** Detail in the session report `.superpowers/sdd/followups-15-report.md` (scratch; capture what's needed before archiving). Suspects: map-iteration order somewhere in the troubadour/feature aggregation path.
- **Effort:** S (reproduce, find the unordered iteration, sort it)

## 28. D7 hero-suite final-review tail (MED-1 + six LOWs)

**Status:** done — items 1–2 and 4–7 fixed in worktree f2 (`draw-steel-elements` `80abd63`,
2026-07-18, reviewed/approved; jest 1946). Item 3 (`onUpdate` full-remount collapses
expanded ability cards) deliberately NOT fixed — differential-update architecture change,
cosmetic-only; revisit only if it annoys in real use.

- **Identified:** 2026-07-18, D7 whole-branch opus final review (verdict SHIP; plan 18, worktree `f2`, plugin range `5c6e33d..903fe4a`). Full detail: the ledger `worktrees/f2/.superpowers/sdd/progress.md` + the final-review report (session scratch).
- **What:** Deferred non-blocking findings in `draw-steel-elements`:
  1. **MED-1** — `findStateSpan`/`splitDefnRaw` (`src/elements/hero/model.ts:393-452`) absorb trailing comments/blank lines *after* a state-last `state:` block into the removed span, so a `# comment` below `state:` is dropped on first persist (comment/whitespace only; no data loss).
  2. LOW — full-degrade stamina bar renders NaN width when every ref fails and no authored max (cosmetic).
  3. LOW — `ds-hero` `onUpdate` full-remount collapses expanded ability cards (tab state survives).
  4. LOW — missing test: authored `resource` override + resolved class simultaneously (gainHint source).
  5. LOW — missing test: sheet-level roll-disabled static fallback path.
  6. LOW — conditions chip text runs together (cosmetic, pre-existing pattern).
  7. LOW — mixed-EOL-after-anchor edge in the sidebar anchor stamper.
- **Why:** Keeps the SHIP verdict honest — none block merge, but MED-1 is a real (if tiny) authored-bytes fidelity gap in the flagship element's persist path.
- **Context:** Byte-stability tests in `test/unit/elements/hero/` show the pattern to extend; Task 8/9 reviews name the exact missing assertions.
- **Effort:** S (MED-1 + the two tests) / XS each for the cosmetic ones

## 23. Statblock sticky mini-header too bulky at phone widths

**Status:** done (pending Scott's taste check on deploy) — 2026-07-18 in worktree
site-followups (`v2` `75b4320259`, CSS-only compact phone variant): single-line truncating
name, second meta row hidden, tighter pills; sticky 22.5% → 9.3% of a 390×844 viewport,
desktop screenshots byte-identical. Before/after evidence: `.superpowers/sdd/shots-23/`
(main checkout scratch). Punt: hover `title` on truncated names needs a build-time markup
change (statblock_card.go) — do with the next statblock Go touch.

- **Identified:** 2026-07-01, P1 bug batch visual QA (`docs/superpowers/plans/2026-07-01-p1-v2-bugfix-batch.md` Task 3).
- **What:** On a 390px viewport, the statblock sticky mini-header (`.sb__sticky`, CSS scroll-driven reveal in `steel-statblock.css`) occupies ~40% of the screen while scrolled: large name + role wrap to multiple lines, then the stats row, then the movement/captain/immunity/weakness row. Pre-existing — NOT caused by the 2026-07-01 `.sc-head` mobile stacking (the sticky uses its own `sb__sticky-*` classes).
- **Why:** The sticky exists to keep core stats in view at the table; at phone widths it crowds out the content it's meant to annotate.
- **Fix options:** A compact phone variant — single-line name (smaller, truncate-with-title), drop row 2 (movement/captain/immunity/weakness), tighter stat pills; or suppress the sticky below a width breakpoint entirely (readers can re-scroll).
- **Context:** `v2/docs/stylesheets/steel-statblock.css` (`.sb__sticky*`); screenshot evidence in the 2026-07-01 session (`53-sb-mobile-feat`).
- **Effort:** S

## 2. Settings panel: card-style toggle still triggers a full page reload

**Status:** dormant — control hidden 2026-06-09 (see #3); revisit when re-enabling.

- **Identified:** 2026-06-07, while building the live settings drawer (`v2/.repo-docs/plans/2026-06-07-live-settings-panel.md`).
- **What:** The "Ability card style" control in the new live settings drawer (`v2/docs/javascripts/settings-panel.js`) calls `location.reload()` on change, carried over from the old preferences page. Every other control in the drawer applies instantly via a `<html>` attribute / CSS variable with no reload.
- **Why it matters:** It conflicts with the drawer's "change settings without navigating away / see it live" goal for that one control — the reload closes the drawer and flashes the page.
- **Fix options:** Investigate whether classic↔modern can be a pure CSS/attribute swap (it already toggles `data-card-style` on `<html>`). If some ability-card markup is build-time only (the classic glyph badges vs. modern colored borders may be emitted by `steel-etl`, not pure CSS), document why the reload is required, or do a lighter in-place re-render of just the affected cards instead of a full reload.
- **Effort:** S (investigate + likely small JS/CSS change)

## 3. Settings panel: re-enable "Color theme" and "Ability card style" once fully supported

**Status:** open

- **Identified:** 2026-06-09, cleaning up the settings drawer.
- **What:** The "Color theme" select (Steel / Parchment / Obsidian → `data-sc-theme`) and the "Ability card style" select (Classic / Modern → `data-card-style`) were **hidden** from the drawer markup in `v2/docs/javascripts/settings-panel.js` because the alternate palettes/styles aren't fully baked. Only the markup was removed — the apply functions (`applySiteTheme`, `applyCardStyle`), their bindings (now null-guarded), `palette.css` `[data-sc-theme]` blocks, and `ability-cards.js` modern handling all remain in place.
- **Why it matters:** Half-finished controls were exposed to users. They're parked, not deleted, so re-enabling is just re-adding the two markup blocks (commented anchors mark both spots).
- **Fix options:** Finish the alternate palettes (most `--sc-*` brand tokens aren't overridden by `[data-sc-theme]`, so themes barely change the page today) and the Modern card style, then restore the markup. Fold #2 (card-style reload) into that work.
- **Effort:** M (design + CSS to make the themes/styles actually comprehensive)

## 4. Restamp bare `scc:` links to explicit `scc.v1:` across all inputs

**Status:** done 2026-06-18 — all 25,328 in-prose `scc:` links across the four book sources (heroes 17,528, monsters 5,948, summoner 1,542, beastheart 310) restamped `](scc:` → `](scc.v1:`. Every occurrence was in markdown-link form (zero non-link uses, zero already-prefixed), so it was a pure balanced restamp. `gen --all` after the sweep resolved cleanly (3,012 codes, 0 resolver WARNs, no raw `scc.v1:` leaked into linked output). Registry already recorded `scheme_version: 1` and the resolver already normalized both forms (shipped 2026-06-09). See `docs/scc-log.md` 2026-06-18.

- **Identified:** 2026-06-09, during the SCC scheme-versioning design (`steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md`).
- **What:** The SCC scheme now carries an explicit scheme-version prefix (`scc.v1`), with bare `scc:` defined as a permanent implicit-v1 alias. The canonical form is explicit, but the ~17,527 existing in-prose `scc:…` links and the registry were left bare to avoid a high-churn sweep. This follow-up restamps bare `scc:` → `scc.v1:` across all source inputs (heroes, beastheart, monsters, and the in-flight new sourcebook) and emits explicit going forward.
- **Why it matters:** Cosmetic/consistency only — bare and explicit are equivalent by definition, so nothing is broken meanwhile. Worth doing in one pass once the new sourcebook lands, rather than piecemeal.
- **Fix options:** Mechanical `scc:` → `scc.v1:` replace across `steel-etl/input/**/*.md` (guard against already-prefixed `scc.vN:` and against non-link `scc` text); update the registry to record `scheme_version`; confirm the resolver normalizes both forms. Coordinate timing with the new-sourcebook agent so it's a single sweep over all inputs.
- **Effort:** M (broad but mechanical; one sweep across all input docs + registry + regen)

## 5. Link the bestiary pages into the SCC cross-reference sweep

**Status:** **direction 1 (links out of / within Monsters) done 2026-06-12** — direction 2 still open. The Monsters source is fully link-swept: 5,948 `scc:` links (4,759 cross-book to Heroes, 1,189 internal), a new `rule.{monster,role,organization,keyword}` glossary minted from Monster Basics (591 → 632 codes), and full statblock-parser hardening against link-wrapping (every structured field). Plan: `steel-etl/docs/superpowers/plans/2026-06-12-monsters-content-linking.md`; scc-log 2026-06-12. **Remaining (direction 2 only):** links *into* monster/terrain/retainer pages from the *other* books' sources (heroes/beastheart/summoner referencing a monster by SCC) — see "What" item (2) below.

<em>Original (2026-06-11) context, now mostly addressed by direction 1:</em> the **Summoner book** statblocks were a working model (`steel-etl/docs/superpowers/plans/2026-06-10-summoner-content-linking.md`): link trait/ability effect prose + tier lines; leave dice-title lines, keyword rows, stat-grid labels, and creature keywords plain; link relational nouns `enemy`/`ally`/`creature` only at defining anchors but `adjacent`/`strike` freely.

- **Identified:** 2026-06-10, the bestiary restructure (Plan A: moved monster / dynamic-terrain / retainer trees from the Bestiary tab into Browse, `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-restructure.md`).
- **What:** The Monsters-book pages (statblocks, malice/Tactical Stance featureblocks, dynamic terrain, retainers) are now first-class Browse pages with their own SCC codes, but they are **not yet wired into the in-prose `scc:` cross-reference sweep** the heroes doc uses. Two directions are missing: (1) links *out of* the Monsters source — statblock keywords, inflicted conditions, abilities, movement types, etc. should link to their SCC pages; (2) links *into* monster pages — other books should be able to reference a monster/terrain/retainer by SCC.
- **Why:** Comprehensive linking is part of "done" for this project (see memory `comprehensive-linking-density`); the bestiary is currently an island.
- **Context:** Source is `steel-etl/input/monsters/Draw Steel Monsters.md` (hand-maintained; H7=statblock, H9=featureblock/terrain — see `steel-etl/CLAUDE.md` "Monsters book"). Follow `steel-etl/docs/linking-guide.md` + `docs/linking-reference.md`. Conditions/skills/movement terms are already linkable targets. Mind the one-heading-one-code gotcha (memory `rule-scc-type`). This is a sizable sweep, akin to the heroes-doc passes.
- **Effort:** L (multi-day sweep across the whole Monsters source)

## 7. Statblock island: shared family Malice band not embedded; retainer/fixture "With Captain" label

**Status:** done — 2026-07-18, site-followups wave (`steel-etl` `68887ab`+`ace9bc8`+`36818f2`,
reviewed/approved, LANDED to main): (1) every monster statblock leaf page embeds its family's
shared Malice featureblock as a band (381 pages; open-by-default per the Villain-band
precedent; embedded compact cards correctly suppress it; standalone malice pages remain);
(2) the meta cell is context-driven — real "With Captain" values restored (a parsed-but-
never-read `with_captain` field was silently dropping them; 116 leaf pages), summoner
minions show "Free Strike Damage Type" (75 leaf pages), others drop the blank cell.
Not yet deployed — lands on the next `just deploy-v2`.

- **Identified:** 2026-06-11, building the High-Fantasy Steel statblock client renderer. The design handoff is now archived at `reference/design-system/handoff/redesign/statblocks/README.md` (imported 2026-06-11; the malice band + captain label are its "Notes / nice-to-haves").
- **What:** Two deferred pieces of the statblock island (`steel-etl/internal/site/statblock_page.go` → `v2/docs/javascripts/steel-statblock.js`):
  1. **Malice band** — the design embeds the family's shared Malice featureblock into each statblock as a collapsible band (`renderStatblock` `data.malice`). The island currently omits it (the README marks it a non-blocking nice-to-have, and the family's `…-malice.md` featureblock still renders as its own Browse page). To wire it, associate each statblock with its group's malice featureblock at site-build time (the malice `.md` is a sibling in the group dir, e.g. `monster/devils/devil-malice.md`), parse its features the same way, and emit `island.malice = {name, sourceName, intro, features[]}`.
  2. **2×2 "With Captain" cell** — the island always labels the 4th meta cell "With Captain". Minions use it (captain bonus), but retainers/fixtures/solos have no captain; the design notes summoner statblocks replace it with "Free Strike Damage Type". Make the label/value context-driven (skip or relabel when there's no captain line in the body).
- **Why:** Full fidelity to the approved design (malice is a prominent part of monster statblocks) and correct secondary-stat labeling across creature types.
- **Context:** Island shape + parser in `statblock_page.go` (`buildStatblockIsland`, `sbMeta.Captain`); renderer band logic already present in `steel-statblock.js` (`band()` + `data.malice`) and CSS (`.sb__band--malice`), so this is a Go/data-association task, not a front-end one. Group-dir sibling lookup precedent: `bestiary_cards.go` (`splitByType` finds the featureblock vs. statblock split).
- **Effort:** M (malice association) + XS (captain label)

## 8. Link the remaining statblock usage-cell action terms to the rule glossary

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `c34a8fd` + review
fix `0190eaf`): 1,685 usage cells linked across all four books (monsters 1,152, heroes
496+13, summoner 41, beastheart 2), reviewed/approved; 0 resolver WARNs, registry count
unchanged at 3,080. Left unlinked by design: 156× `-` (passive) and 4× `1 Eidos`
(resource cost, no glossary heading). Action-type terms map to `rule.combat/turn` per the
glossary's own pre-existing convention (no per-action-type headings exist).

- **Identified:** 2026-06-13, fixing the statblock usage-cell link rendering (linked usage cells were stored/rendered link-free; now `statblock_page.go` resolves usage links like distance/target and `steel-statblock.js` renders usage via `rich()`).
- **What:** Only **17** of ~1,000 ability usage cells in the Monsters source are actually linked (`**[Triggered Action](scc:…/rule.combat/triggered-action)**`); the other ~960 are plain text — `Main action`, `Maneuver`, `Triggered action`, `Free triggered action`, `Free maneuver`, `Move action`, `1 Eidos`, etc. Sweep the source so every action-type usage cell links to its rule-glossary term, the way the 17 already do.
- **Why:** Comprehensive linking is part of "done" (memory `comprehensive-linking-density`); the renderer now surfaces these links, so the inconsistency (a handful clickable, the rest not) is visible to users. This is the natural completion of FOLLOWUPS #5 direction 1.
- **Context:** Source `steel-etl/input/monsters/Draw Steel Monsters.md` (usage = 2nd cell of the 2×2 ability spec table, `> | **<keywords>** | **<usage>** |`). Confirm each phrase has a `rule.combat/*` target before linking (`triggered-action` exists; verify `main-action`/`maneuver`/`move-action`/free-action variants in `steel-etl/docs/linking-reference.md` — mint any missing glossary codes per the one-heading-one-code gotcha, memory `rule-scc-type`). The parser already strips the surrounding `**bold**` and resolves links in the usage cell, so no parser change is needed — purely a source-annotation sweep. Heroes/summoner sources likely have the same gap in their ability tables — check and fold in if cheap.
- **Effort:** S–M (mechanical sweep, but verify/mint the action-term glossary targets first)

## 15. Back-link class-owned statblocks/featureblocks to their owning class

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `c3714a6`,
reviewed/approved): `augmentClassOwnedBackLinks` (rival back-link pattern reused verbatim,
`.sb-backlink`), 36 pages gain the link (14 beastheart companion species ×2 pages, 4
summoner fixtures ×2), zero leaks into class landings/rival pages. Runs after
`embedItemCards` (ordering bug caught+fixed+documented in build.go). Devil Detective
retainer deferred by scope (structurally excluded).

- **Identified:** 2026-06-15, while adding the Rival Summoner summons cards + summon→summoner back-links (`docs/superpowers/specs/2026-06-15-rival-summoner-summons-design.md`).
- **What:** Bestiary entities that belong to a hero **class** — beastheart companions (`monster.companion.beastheart.<species>` + their `…-advancement-features`) and summoner fixtures (`monster.fixture.<element>.<id>` + their `…-advancement-features`) — should carry an on-page back-link to their owning class page (`class/beastheart`, `class/summoner`). This is the class-owned analog of the rival summon→summoner back-link being built now; the rival back-link mechanism is the model to reuse.
- **Why:** These entities live deep under `monster/*` with no on-page pointer to the class that conjures/bonds them, so a reader landing on `monster/fixture/demon/the-boil` (or a companion species page) has no path back to the Summoner/Beastheart class that owns it. Provenance + navigation.
- **Context:** companion pages `v2/docs/Browse/monster/companion/beastheart/<species>(-advancement-features)`, fixture pages `v2/docs/Browse/monster/fixture/<element>/<id>(-advancement-features)`; class targets `class/beastheart.md`, `class/summoner.md`. Rendering lives in `steel-etl/internal/site/` (statblock + featureblock page builders); the relationship is derivable from the SCC type path's class segment (`companion.beastheart`, `fixture` under the summoner book). Keep separate from the rival effort — rivals are NPC statblocks, not class-owned.
- **Effort:** S–M (a shared "owning-class back-link" helper in the site page builders).

## 18. Stale "client-side statblock island" docs — statblocks already render build-time

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `fabbd70`, superproject
`3e3678b`): reality verified (migration fully shipped; `steel-statblock.js` already deleted
in v2 `7fca6cc1d0`; statblocks.md/site-builder.md already accurate). Fixed the two genuinely
stale spots: ROADMAP #7 re-scoped to its one remaining piece (malice-band embedding ≡
FOLLOWUPS #7 item 1, effort M) and a misleading phrase in steel-etl/CLAUDE.md.

- **Identified:** 2026-06-18, investigating Plan 6 (retainer rework) rendering.
- **What:** Several docs still describe monster/retainer statblocks as **client-side JSON islands** awaiting a build-time-HTML migration, but that migration already shipped: `buildStatblockIslandPage` (`steel-etl/internal/site/statblock_page.go`) renders the build-time `.sb-wrap` card via `renderStatblockCard` (its own comment: "it no longer emits a JSON island"), **0** built pages contain `sc-statblock-mount`, and `v2/site/javascripts/steel-statblock.js` is dead code. Stale references: `ROADMAP.md` #7 (lists "move statblocks from client-side JSON island to build-time HTML" as open), `steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md` (describe the island as live).
- **Why:** The docs actively mislead — an agent reading them will believe statblocks need a migration that's done, and may mis-plan around a JSON island that no longer exists (it nearly derailed Plan 6's scoping).
- **Context:** Correct the three doc locations; **re-assess what genuinely remains of ROADMAP #7** — part (a) (island → build-time HTML) appears complete; part (b) (entity-embedding, `embed_cards.go`) partly shipped for Browse. Decide whether #7 is done, partly-done, or should be re-scoped, and delete the dead `steel-statblock.js` if nothing references it.
- **Effort:** S (doc correction + a grep to confirm `steel-statblock.js` is unreferenced before deleting).

## 19. Stale summoner statblock codes in `summoner-linking-reference.md`

**Status:** open

- **Identified:** 2026-06-19, hand-adding the fixture advancement member codes (ROADMAP #16) to the linking reference.
- **What:** The **Statblocks** section of `steel-etl/docs/summoner-linking-reference.md` lists summoner minions/fixtures/champions/rivals under their **pre-`monster.*`-rehoming** codes (e.g. `mcdm.summoner.v1/minion.demon.statblock/…`, `fixture.demon.statblock/the-boil`, `champion.demon.statblock/…`). The actual registry (Plan 5c/6) homes them under `monster.*`: `monster.minion.summoner.<portfolio>.statblock/<id>`, `monster.fixture.<element>.featureblock/<id>` (+ the new `feature.fixture.*` members), `monster.champion.summoner.<portfolio>.statblock/<id>`, `monster.rival.<echelon>.statblock/<id>`. (Summoner **retainers** re-minted to `monster.retainer.statblock/<id>` on 2026-06-21 — their four rows in the reference were corrected in that same change; the minion/fixture/champion/rival rows below remain the stale ones.)
- **Why:** Anyone authoring `scc.v1:` links from these curated codes will write dangling links; the reference is supposed to be the canonical linkable-target list.
- **Context:** Refresh the section against `classification.json` (`grep -oE "mcdm.summoner.v1/monster\.[a-z.]+statblock/[a-z-]+"` etc.). Pre-existing drift, not introduced by #16 — the #16 fixture-member subsection added 2026-06-19 is already correct. Likely the Monsters-book linking reference has similar drift worth a glance.
- **Effort:** S (mechanical code refresh in one curated table).

## 20. Strip the genuinely-dead per-card head CSS selectors superseded by `.sc-head`

**Status:** open — **scope narrowed 2026-06-24 (chrome-restore, steel-etl 754c31e / v2 da9641d); read this before deleting anything.**

- **Identified:** 2026-06-24, landing the unified 6-slot card header (`docs/superpowers/specs/2026-06-23-unified-card-header-design.md`).
- **⚠️ NOT dead — load-bearing:** `.sb__head` and `.fb__head` are **re-attached to the main head** by `renderCardHead`'s `Class` field (`statblock_card.go` sets `Class:"sb__head"`, `featureblock_page.go` `Class:"fb__head"`) and **carry the role-gradient band, centered diamond, role border, and the statblock sticky-reveal `view-timeline`**. Deleting them re-flattens the cards (the original regression this follow-up almost caused). Likewise the typography rules now re-pointed onto the new slots — `.sb__head .sc-head__left-primary`/`__right-primary`, `.fb__head .sc-head__*`, `.sc-trait > .sc-head*` (underline + name + eyebrow), `.sc-ability > .sc-head .sc-head__left-primary` — are **live**, not dead.
- **What's actually safe to strip:** only the selectors no Go renderer emits anymore — the inner head pieces of the OLD DOM: `.sb__head-row`, `.sb__kw`, `.sb__class`, `.sb__level`, `.sb__role`, `.sb__ev`, `.md-typeset .sb__name` (statblock); `.fb__eyebrow`, `.md-typeset .fb__name` (featureblock); `.sc-ability__head`/`__titles`/`__eyebrow`/`__corner`/`.sc-ability__name` (ability); `.sc-trait__head`/`__titles`/`__eyebrow`/`__tag`/`.sc-trait__name` (traits); `.sc-prev__head`/`__titles`/`__eyebrow`/`__tag`/`__name` (indexes). Keep `.sb__head`/`.fb__head` and the sub-feature wrappers `.sb__feat-head`/`.fb__feat-head`.
- **Why:** Dead inner selectors mislead the next agent and bloat the sheets — but the head-element + re-pointed-slot selectors are the chrome and must stay.
- **Context:** Confirm each candidate is unemitted before deleting: `grep -rn '<selector>' steel-etl/internal/site/*.go` returns nothing. Do NOT grep-and-delete by the `.X__head` prefix blindly — that catches the load-bearing `.sb__head`/`.fb__head`.
- **Effort:** S (mechanical, per-sheet — but verify against the live class list above first).

## 21. Verify the summoner-fixture `left-deck` provenance renders on live pages

**Status:** open

- **Identified:** 2026-06-24, landing the unified card header (the fixture `left-deck` path was the one slot with no unit-test fixture exercising the real page round-trip).
- **What:** A summoner fixture's `left-deck` provenance ("Summoner · ‹Element›") is derived by `fbOrigin(scc)` in `buildFeatureblockPage` (`steel-etl/internal/site/featureblock_page.go`), keyed off the SCC type-path `monster.fixture.<element>.featureblock`. `TestFbOrigin_Fixture` covers the helper, but no test renders a real fixture page end-to-end, so confirm on the deployed site that e.g. `Browse/monster/fixture/demon/the-boil` actually shows "Summoner · Demon" in the deck (and that the element segment title-cases correctly for multi-word elements, if any).
- **Why:** It's the only header slot whose data plumbing (SCC → deck) wasn't validated against a real generated page; a wrong/empty deck would silently drop fixture provenance.
- **Context:** Live page under `v2` (Brave per memory `reference_playwright_mcp_broken`), or grep the generated leaf: `grep -o 'sc-head__left-deck[^<]*</div>' v2/docs/Browse/monster/fixture/*/*.md`. If empty, the fixture frontmatter `scc` may not match the `monster.fixture.<element>.featureblock` shape `fbOrigin` expects — adjust the matcher.
- **Effort:** XS (verify; small matcher tweak only if it's wrong).

## 22. v2 deploy is racy — `mkdocs gh-deploy --force` with no concurrency guard

**Status:** done 2026-06-24 — added a workflow-level `concurrency: { group: pages-deploy, cancel-in-progress: false }` to `v2/.github/workflows/ci.yml`, so `ci` runs queue instead of racing: two pushes close together now deploy in order and `gh-pages` ends at the later commit (no force-push-clobber by an earlier build). Chose queue (not cancel) so a superseding run can't skip the final deploy. The optional `just deploy-v2` single-commit cleanup was **not** done — with the guard it's an efficiency nicety (avoids a redundant queued run), not a correctness fix; left for later if the extra run proves annoying.

- **Identified:** 2026-06-24, debugging "still no gradient" after the card-head chrome deploy.
- **What:** `v2/.github/workflows/ci.yml` runs `mkdocs gh-deploy --force` on **every** push to `main`, with **no `concurrency:` block**. Two pushes close together (here: the CSS chrome commit, then the deploy's `chore: update v2 site content` commit ~30s later) each spawn a `ci` run; both force-push `gh-pages`, and whichever finishes last wins. The earlier-content (CSS-only) run won, force-pushing `gh-pages` back to HTML that predated the content regen — so the live site served stale HTML (`class="sc-head"` without `sb__head`) even though both the CSS and the regenerated HTML were correct on `main`. Manual fix that worked: `gh run rerun <content-commit-run-id>` once nothing else was pushing.
- **Why:** Any normal deploy that also bumps another commit (e.g. a code change + its `chore: update v2 site content` pair — the standard `just deploy-v2` shape!) can silently publish the wrong build. This will recur.
- **Fix:** Add a concurrency guard to `ci.yml` so deploys serialize instead of racing, e.g. `concurrency: { group: pages-deploy, cancel-in-progress: false }` (queue — don't cancel, or a superseding run could skip the final deploy). Consider also having `just deploy-v2` make a **single** commit (or push superproject + v2 in an order that triggers one CI run), so there's only one deploy per logical deploy. Re-check after: two rapid pushes should end with `gh-pages` at the LATER commit.
- **Effort:** XS (add `concurrency:` to `ci.yml`) + S (optional deploy-recipe single-commit cleanup).

## 24. D6: vault-classification vs compendium-index timing mismatch

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `0fe7c6b`, 2026-07-18,
reviewed/approved): `CompendiumIndex.getEntry` gained the same path-derivation fallback as
`SccResolver.resolve` (opportunistic index-seeding, generation-guard preserved; getEntity/
getStatblock route through getEntry). `query()`/`resolveSlug()` stay index-only by scope.

`SccResolver.resolve` (used for `cx.sccAnchors` classification) tries path-derivation
against the managed compendium root first, falling back to the lazily-seeded frontmatter
index; `CompendiumIndex.getEntity`/`getEntry` (RefUnwrapView's typed-model lookup) is
index-only. A freshly-synced compendium file can classify `vault` via `sccAnchors.resolve`
before `CompendiumIndex` sees it, producing a transiently-misleading "found but not
renderable — re-sync" card where re-syncing won't help. Confirmed real (D6 Task 3 review,
2026-07-17), pinned by test, scoped out of the D6 build. Fix by waiting for
`metadataCache` to settle after sync, or giving `CompendiumIndex.getEntry` the same
path-derivation fallback `SccResolver.resolve` has.

## 25. steel-etl: DSELinkedGenerator drops Children — md-dse-linked kits never emit ds-feature fences

**Status:** done — fixed in worktree f2 (`steel-etl` `310ecef`, 2026-07-18): `WriteSection`
now recursively resolves+copies `Children`; verified red→green, full pipeline regen shows
exactly the expected 25 heroes kit files (+25 unified mirrors) gaining their fence. Lands
with the f2 worktree.

Found during the D6 MUST-FIX (2026-07-17, stash-diff-confirmed pre-existing):
`DSELinkedGenerator` never copies `Children` when deriving md-dse-linked from md-dse,
so md-dse-linked kit files have NEVER contained their ` ```ds-feature ` fence. Harmless
today (DSE consumes md-dse, not md-dse-linked, per F2 OD-3), but the format is
advertised as "identical except link encoding" — either fix the Children copy or
document the divergence in ARCHITECTURE's format table.

## 26. DSE: anchor passthrough for counter/negotiation/stamina-bar persisted models

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `d1d01d0`, 2026-07-18,
reviewed/approved): optional `_dse_anchor` passthrough on all three models, round-trip
byte-stable, D8 emission-order convention.

The sidebar host's `_dse_anchor` key survives parse/serialize for initiative and the four
D8 trackers, but counter, negotiation, and stamina-bar build fixed-field model instances
that drop unknown keys — if one of those is ever sent to the sidebar, its first persist
drops the anchor (the visible read-only degrade net catches it; no silent no-save). Root
fix: an optional passthrough field on those three models, per D8 spec §1.5. Low priority —
none has a sidebar mount today. (D8 final review, 2026-07-18.)

## 27. DSE stamina: winded boundary off-by-one in kit core + modal Spend Recovery unsynced

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `a165341` + fix-round
`e8b19e8`, 2026-07-18, reviewed/approved): kit bar winded boundary now `<=` (RR "half or
below"); Spend Recovery gates on `recoveries_max`, decrements the counter, disables with
visible reason at zero, heals from the model's recoveryValue; recovery-spend math
consolidated into one shared helper; jest setTooltip mock now mirrors production
aria-label behavior (a mock/production divergence had hidden a stale-tooltip bug).

Two related items from D7 Task 4 review (2026-07-18): (a) the shared
`framework/kit/StaminaBarPanel.ts` bar-fill color uses `current < floor(max/2)` but the
rule is winded at half **or below** (`reference/draw-steel-reference.md:274-278`) — the
new winded badge is correct (`<=`), so the two indicators disagree at exactly half
stamina; fix the kit core with boundary-case golden updates as its own scoped change.
(b) `StaminaEditModal`'s pre-existing "Spend Recovery" quick button heals `floor(max/3)`
but never decrements the new `recoveries` counter and has no zero-remaining gate — sync
it with the D7 recoveries model.

## 38. Dragon's Fire ability body mis-nests eight 9th-level armor enhancements

**Status:** done — fixed 2026-07-23 in worktree `fix-dragons-fire` by reordering the source
(chosen over minting codes): the `Dragon Soul II` blurb + `Dragon's Fire` statblock now sit
at the **end** of the 9th-Level Armor Enhancement list (right before the table), so nothing
but the table follows the ability and it absorbs no enhancement prose. Verified: Dragon's
Fire `effects[]` is the power roll only, zero odd effect names corpus-wide, all 8
enhancements + Dragon Soul II still render as prose (and inline the ability after "you have
the following ability") on the Imbue Armor page, SCC registry unchanged (1950→1950). The
general "declare a section boundary without moving content" mechanism this case motivates is
**ROADMAP #18**.

**Identified:** 2026-07-23, while fixing the ability named-effects parser (three-example
bug report: Minor Telekinesis / Conflagration / Hoarfrost).

**What:** In `steel-etl/input/heroes/Draw Steel Heroes.md` (~line 23153-23169), the
descriptions of eight 9th-level armor enhancements — Invulnerable, Leyline Walker, Life,
Magic Resistance III, Phasing III, Psionic Resistance III, Temporal Flux, Unbending — sit
as bare `**Name:** …` paragraphs *inside* the `@type: ability` **Dragon's Fire** section
(no heading separates them from the ability until the "9th-Level Armor Enhancements Table"
at ~23171). The new general named-effect parser (`extractNamedEffects` in
`internal/content/ability.go`) therefore captures all eight as `effects[]` entries on
Dragon's Fire, where they don't belong.

**Why:** They're peers of "Dragon Soul II" (the enhancement that *grants* Dragon's Fire),
not riders of the ability. There is no syntactic way to distinguish `**Invulnerable:**`
(an enhancement) from `**Strained:**` (a real rider), and a keyword whitelist is exactly
the fragility the bug report called out — so the parser is correct in general; the source
structure is the anomaly. This is the **only** such false positive across all 522 ability
JSONs (corpus swept 2026-07-23).

**Context:** Fix belongs in the source: restructure the eight enhancements as their own
sections/entries (like other treasure enhancements) so they stop being Dragon's Fire body
text. Note this will **mint new SCC codes** for them (they currently produce none), so it
needs classification/registry consideration — hence out of scope for the parser bugfix.
Site cards render from the body (unaffected); only the JSON/YAML/DSE `effects[]` array
mis-attributes them today.

**Effort:** S-M (source edit + decide enhancement modeling/SCC placement + regen).
