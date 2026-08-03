# Steel plugin ↔ live-site UI gap inventory (post-plan-20)

**Companion spec for plan 21.** Plan 20 fixed the *material* layer (sheen/bevel/hairline/
washes/bands/crest) and it's landed. This is a full accounting of what still differs. It
exists because the parity gate is blind to every category below — it only tests
flat-vs-non-flat on 3 material properties, never font, size, whitespace, hue, or layout. That
blindness is why these survived a green gate.

**Method.** Computed-style diff of the two captured inventories (font/colour, both schemes) +
a fresh computed-style capture of padding/margin/line-height (site live vs plugin harness,
2026-07-23) + first-hand visual read of the ability, kit, and statblock pairs (site full-page
vs plugin harness shot, dark). Numbers are real computed px, not eyeballed.

**Font licensing caveat.** The site's body/label face is `BerlingskeSlab-DBd` and its chips are
`Newzald` — both licensed, un-bundleable. The plugin already routes **display titles** to a
serif token (`--dse-font-display` → "Source Serif 4") and those match the site by feel. The gap
is **body copy + labels**, which have no token and fall back to the app's `-apple-system` sans.
So A1's low-risk core is *routing body/label text to the existing serif token* (the site uses a
single face for titles and body); bundling a true slab (Zilla Slab / Bitter, OFL) to remap
`--dse-font-display` is an optional fidelity upgrade, not required.

---

## Status — after plan 21 (2026-07-24)

- **§A (cross-cutting type/space/ink) — CLOSED and GUARDED.** A1–A7 are all fixed in
  `styles-source.css` (Steel-scoped, screen-only; the print/legacy freeze is intact) and locked
  by two offline jest contracts + the extended parity gate: `steelMaterial.test.ts` (material)
  and the new `steelTypography.test.ts` (serif route, ≥1.6 body line-height, ~24px card inset,
  `letter-spacing: normal`). The gate now measures type/space/ink/letter-spacing/material across
  the 12 pairs, both schemes, at `0 GAPs / 10 documented-deferral WARNs / exit 0`. **A1 note:**
  there is still **no `--dse-font-body` token** — registering a `--dse-*` token needs a
  `src/framework/tokens.ts` edit the plan forbade, so body text routes directly to the existing
  `--dse-font-display` (Source Serif 4). It is a serif, **not** the site's slab, and only its
  600/700 weights ship (body reads slightly heavy). The 10 WARNs are the documented per-(pair,
  rule) deferrals: 4× FOLLOWUPS #39 (block-margin lives on the un-paired `*-wrap` node) + 6×
  FOLLOWUPS #40 (`section-head`/`pr-head` pairs compare the plugin's content node to the site's
  text-less wrapper).
- **§B (structural / layout) — still OPEN; #32 now deferred to its own plan.** None of the §B
  rebuilds were done in plan 21 (it was CSS-only). **#32 (kit stat-tile grid) was pulled from
  plan 21's Task 4 and DEFERRED:** a Steel-only DOM restructure would change the frozen
  `kit--steel-print.png`, and the codebase builds one theme-agnostic DOM themed purely in CSS —
  theme-conditional rendering would be a new architectural pattern. It needs its own design plan
  to resolve the freeze/architecture question before the rebuild. #33 (featureblock option
  layout), #34 (feature action spine) and #35 (statblock notch) remain open as filed.
- **§B #32 (kit) CLOSED 2026-08-03 — SC-100 / plan 24 executed; Scott's visual gate
  approved.** The freeze/architecture question is resolved: `CardLayout` gained an optional
  `steel` composition slot and `DisplayCardView` branches once at mount (legacy DOM moved
  verbatim, the canonical fallback under every non-steel theme; live theme switches
  re-render). The Steel kit card now renders the crest/eyebrow head, boxed Equipment band
  and fixed 2×4 dash-tile grid (new generic `statTiles` primitive), keeping the richer
  signature-ability sub-render. One sanctioned freeze change: the `kit--steel-print.png`
  single-hash rebaseline at landing (exception documented in the dse-verify skill). #33/
  #34/#35 remain open. §D2's remaining families are filed as **SC-120** — the seam +
  primitive make each one layout-data + CSS + its own sanctioned `*--steel-print` sign-off.
  Site-side kit gaps: SC-115 (Browse-tile sig ability), SC-116 (kit-kind frontmatter),
  SC-119 (orZero/orDash dash unification). Dark-mode material lead for SC-117: the site's
  tile richness is the card gradient through translucent-black fills; the plugin's
  `--dse-surface-sunken` white wash occluded it on two selectors.
- **§C1 DIRECTION DECIDED 2026-08-01 (Scott): serif everywhere — option (a).** The A/B was
  regenerated (`.superpowers/sdd/shots-c1-ab/{before,after}/`, 6 families, steel-dark; freeze
  verified 98/98 with the change applied). Plan 22 executes as drafted — a Steel-theme-root
  selector, **not** an allow-list. Density on dense trackers is answered by **size controls**
  (site-style Text/Card scales → SC-112), not by keeping those surfaces sans. Scott also asked
  for **user-customisable fonts**: semantic font slots + scales, driven from preferences → its
  own effort, **SC-112** (needs tokens + prefs + settings UI, all forbidden inside plan 22), with
  **SC-105** defining the token vocabulary it consumes. One carry-forward into plan 22 Task 1
  Step 3: the encounter `EV 0 / 40` chip loses its numeric emphasis under the broadened rule —
  fix with a targeted chip-value rule, never by narrowing the selector.
- **§C1/§C2 CLOSED 2026-08-02 (plan 22 executed).** The decision above is landed: the body-font/
  ink rule now sits on a single Steel-theme-root selector (`[data-dse-element]`, every element
  root) instead of the four-family allow-list, so every plugin-only family reads the same serif/
  open-line-height/cool-ink type system as the card families (C2's line-height folded into the
  same rule, as anticipated). One exclusion guards a Global Constraint: numeric stepper/
  counter values keep their prior non-serif rendering (Task 1 fix-round, Finding 2). Task 1
  Step 3's encounter-chip carve-out (the `EV n / n` chip kept solid, natural-size caps instead
  of collapsing under Source Serif 4's `smcp` digit-shrink) was removed same-day per Scott's
  consistency ruling (2026-08-02): no sibling chip gets a numeric-content exemption, so the EV
  chip now takes the same small-caps treatment as every other chip, digit-shrink included.
  `test/dom/theme/steelTypography.test.ts` gained a dedicated contract test locking the
  selector's shape (element-root, not an allow-list) so a future edit can't quietly re-narrow it
  without failing the suite. Gates: tsc clean, jest 2011/144, shots 164/164, parity 0 GAP/10
  WARN/exit 0 (unchanged from plan 21's baseline), freeze 98/98. No parity-gate coverage exists
  for the plugin-only families — the shot-read remains the primary visual guard there, called out
  honestly rather than implied by the gate.
- **§C (plugin-only families) — AUDITED 2026-07-27; ONE headline gap (C1).** Their material is
  coherent (shared `cardHead`/`powerRollPanel`/plates all render right), but their **body text is
  still sans** because plan 21's serif/spacing routing landed only on the card families, not a
  Steel-theme-root selector. One CSS-only routing change fixes every family at once — cheaper and
  safer than the kit rebuild. See §C/§E. **Recommended as the next plan.**
- **§D (prose/reference families) — AUDITED 2026-07-27.** Typography fix landed well; in good
  shape. The card-vs-page framing is a defensible plugin choice (§D1). class/kit stats-as-list
  folds into #32 (§D2).

---

## A. Cross-cutting — fix once on shared primitives, cascades to every card family (CSS, no DOM)

| # | Category | Finding (site → plugin) | Impact | Effort |
|---|---|---|---|---|
| A1 | **type** | Body copy + labels are `-apple-system` sans; site is `BerlingskeSlab` slab. Titles already match. No `--dse-font-body` token exists. | **HIGH** | S–M |
| A2 | **space** | `line-height` 24px (1.5) everywhere; site 27.2px (1.7). | **HIGH** | S |
| A3 | **space** | Card padding `--dse-pad` 16px; site 23–25px. | **HIGH** | S |
| A4 | **space** | Card-to-card `margin` 0.5em (8px); site 24px. | MED-HIGH | S |
| A5 | **space** | Head-strip / pr-head / tier-row / role-band padding ~30% tight (section-head 7.2×12 vs 10×18; tier-row 8.8×14.4 vs 11×18; band 12×16 vs 20×24). | MED | S |
| A6 | **colour** | Body ink dark `rgb(218,218,218)` flat vs site `rgba(220,226,230,.88)` cooler; light `rgb(34,34,34)` vs site `rgb(44,46,48)` (plugin too black). | MED | S |
| A7 | **type** | Body text has `letter-spacing: .03em`; site is `normal`. | LOW | S |

*Rem-base mismatch:* the site's rem base is 20px (Material 125%), the plugin's is 16px — so
match the **px/em target**, not the site's rem literal (same lesson as plan 20's `--mini` sizing).

## B. Structural / layout (need DOM — mostly filed)

- **kit (FOLLOWUPS #32, most visible):** ~~no crest, no "◆ MARTIAL KIT" eyebrow; bonuses render
  as a `Stamina: +6` label-value list, not the site's stat-tile grid; equipment is a list row,
  not a boxed panel~~ — **CLOSED 2026-08-03, SC-100 / plan 24** (see Status above). (Rendered
  by the generic `display` element — `src/elements/display/` — via the new `CardLayout.steel`
  composition slot.) The signature-ability sub-render is richer than the site's; kept.
- **feature/ability (FOLLOWUPS #34):** standalone ability card has a full-height coloured left
  action spine the site's standalone card lacks. Nuance: the site's *statblock* abilities DO
  carry a red left rail, so the plugin matches inside statblocks — divergence is standalone-only.
- **featureblock (FOLLOWUPS #33):** option cost as a chip vs site's large display text; one
  continuous rail vs the site's per-option bars.
- **statblock (FOLLOWUPS #35):** diamond notch under the characteristics strip vs under the head
  band. Otherwise the strongest structural match.

## C. Plugin-only families — AUDITED 2026-07-27 (post-plan-21 landing)

Read the landed steel-dark shots for **hero** (hero sheet), **encounter** + **negotiation**
(trackers), against the now-serif card families. Representative; the finding is structural
(single root cause) so it generalizes to all ~20 plugin-only families.

- **C1 [type] — the headline finding. Plugin-only body/label/control/sub-header text is still
  sans, against the now-serif card families.** Every plugin-only family correctly reuses the
  shared `cardHead` (crest + serif title + flat chips) and `powerRollPanel` (sheen head + tier
  washes) — so its *head* is serif and material-correct — but its *body* (panel labels like
  "Ferocity"/"Surges", table cells, summary strips, buttons, checkboxes, sub-headers like
  "Motivations"/"Interest", ladder descriptions) renders `-apple-system` sans at the old 1.5
  line-height. Root cause: plan 21 Task 3 scoped the serif/line-height/ink routing to the
  **card-family body containers**, not a Steel-theme-root selector. Result: serif head + sans
  body *inside the same element*, and a note card (serif) next to a hero sheet (sans body) reads
  as two different type systems. **Impact: HIGH** (it's the bulk of the plugin's surface).
  **Effort: S–M, CSS-only, no DOM** — route body text at the Steel theme root
  (`[data-dse-theme='steel']`) with careful exclusions (numeric `<input>`s, monospace SCC codes,
  the small-caps chip/eyebrow rules) so it inherits everywhere. This is **cheaper and safer than
  the kit DOM rebuild and touches every family at once** — strong candidate for the next plan.
- **C2 [space]** — same root cause: plugin-only body inherits the old 1.5 line-height; folds
  into C1's root-level routing.
- **Material/structure IS coherent** — verified in negotiation's power-roll panel: tier washes
  bleed full-width, sheen head, flat chips, plates all render correctly. The shared-primitive
  strategy paid off; only the type routing didn't reach these families.
- **C3 [space] Minor** — hero-sheet grid panels (CHARACTERISTICS/CONDITIONS/SKILLS) show large
  empty vertical space below sparse content (grid row-height matches the tallest neighbour).
  Low priority.
- **NOT a defect (harness-data artifact):** hero/encounter shots show "Compendium not installed
  — run Sync compendium" banners and raw `scc.v1:…` codes as titles. That's the demo harness
  lacking a synced compendium; resolves in a real vault. Ignore for styling.
- Modals remain FOLLOWUPS #31 (untouchable without a TS change) — not re-audited; C1's root
  routing would still not reach them (they mount on `document.body`, outside `[data-dse-theme]`).

## D. Prose / reference families — AUDITED 2026-07-27

Read **condition** and **class** (representative of ancestry/treasure) plugin shots vs the live
site.

- **Typography fix landed well** — body copy is serif + open + cool-ink; coherent with the site.
  These families are in good shape now; the A-series was the main gap and it's closed.
- **D1 [layout] Card-vs-page framing (note, not defect).** The site renders reference content as
  a **full-bleed page** (large display title + ◆ centred divider + prose + source line); the
  plugin renders a **self-contained boxed card** with a kind chip. That is a *defensible plugin
  affordance* — an embeddable inline reference in a note is the right shape for a plugin, vs a
  browsable wiki page. Not a fix; record only.
- **D2 [layout] class/kit stats render as a label-value list**, not a stat-tile strip, and the
  display title is less prominent than the site's large title. Same family as kit #32 (the
  `display`/`CardLayout` render path). **Kit half done with #32 (SC-100, 2026-08-03); the
  remaining display families (class/career/…) are filed as SC-120** — the SC-100 seam
  (`CardLayout.steel`) + `statTiles` primitive make each one layout-data + CSS, but each
  family needs its own sanctioned `*--steel-print` rebaseline sign-off. MED.

## E. Recommended sequencing (revised by the 07-27 audit)

1. **Steel body-text coherence (C1/C2)** — CSS-only, no DOM, no sign-off, extends plan 21's
   exact pattern to a root selector; makes the *whole* plugin read coherently. Highest
   value-per-risk. **Recommend this as the next plan.**
2. **Kit / display-layout structure (#32, D2)** — DOM + a sanctioned `kit--steel-print`
   rebaseline; needs a design decision (theme-conditional render). Its own plan.
   *(Done 2026-08-03 for kit: SC-100 / plan 24; remaining D2 families → SC-120.)*
3. **#33 / #34 / #35** — smaller filed structural items.

## F. What was NOT verified
- The remaining plugin-only families individually (montage/initiative/project/party/sidebar/…);
  C1 is structural so it applies, but per-family layout quirks (like C3) weren't all catalogued.
- ancestry / treasure read only shallowly (prose; same story as condition/class).
- Print scheme (frozen; out of scope).
