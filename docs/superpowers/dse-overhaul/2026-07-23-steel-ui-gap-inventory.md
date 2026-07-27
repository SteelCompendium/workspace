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
- **§C (plugin-only families) — still OPEN, un-audited.** Out of plan 21's scope; needs its own
  coherence pass now that the §A tokens/spacing have landed.

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

- **kit (FOLLOWUPS #32, most visible):** no crest, no "◆ MARTIAL KIT" eyebrow; bonuses render
  as a `Stamina: +6` label-value list, not the site's stat-tile grid; equipment is a list row,
  not a boxed panel. (Rendered by the generic `display` element — `src/elements/display/` —
  which is why it's a plain layout.) The signature-ability sub-render is richer than the site's;
  keep it.
- **feature/ability (FOLLOWUPS #34):** standalone ability card has a full-height coloured left
  action spine the site's standalone card lacks. Nuance: the site's *statblock* abilities DO
  carry a red left rail, so the plugin matches inside statblocks — divergence is standalone-only.
- **featureblock (FOLLOWUPS #33):** option cost as a chip vs site's large display text; one
  continuous rail vs the site's per-option bars.
- **statblock (FOLLOWUPS #35):** diamond notch under the characteristics strip vs under the head
  band. Otherwise the strongest structural match.

## C. Plugin-only families (trackers, hero sheet, sidebar, modals, montage, encounter,
## initiative, project, negotiation, …)

No site counterpart — goal is internal coherence with the card family once the A-series lands
(shared tokens). **Not yet individually audited** — needs its own coherence pass. Modals are
additionally FOLLOWUPS #31 (untouchable without a TS change).

## D. What was NOT verified
- The ~20 plugin-only families individually (Section C).
- condition / ancestry / class / treasure visually (prose pages; expect mostly A-series gaps).
- Print scheme (frozen; out of scope).
