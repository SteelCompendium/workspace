# SC-117 — dark-mode richness audit (catalog phase)

**Scope:** catalog only. No plugin code was changed. Worktree
`/home/scott/code/steelCompendium/worktrees/sc117-audit`, plugin at `draw-steel-elements/`,
branch `sc117-audit` @ `f09f6cc`.

**Method:** computed values only, never eyeballed. Both sides were sampled with the *same*
auto-discovery walk (`extract-site.mjs` / `extract-plugin.mjs`, byte-identical
classification logic): every descendant of the family root with a non-transparent
`background-color`, a `background-image`, or a `box-shadow` is recorded with its full
material property set **and its parent chain**, so each fill is scored against the nearest
gradient-painting ancestor. Fills are classified `TRANSLUCENT-BLACK` / `TRANSLUCENT-WHITE` /
`TRANSLUCENT-MID` / `OPAQUE` / `transparent` — that classification is the whole audit.

- Site: live `https://steelcompendium.io/v2/`, 14 pages × 2 schemes. **The scheme attribute
  was verified on every capture before sampling** (`body[data-md-color-scheme]` = `slate` /
  `default`, with `bodyBg` = `rgb(26,30,33)` dark / `rgb(246,248,248)` light).
- Plugin: browser harness, 29 elements × `steel-dark` + `steel-light`.
- Static reference: full site-CSS mechanism map (all 23 stylesheets) — see §8.
- Artifacts: `data/site-material.json`, `data/plugin-material2.json`, `site-refs/`,
  `plugin-refs/`, `evidence/`.

**Families audited:** 7 site-comparable display families (ability/feature card, statblock
incl. 4 role variants, featureblock, kit, condition, card-refs/reference-cards, tables) plus
15 plugin-only widget families swept for the `--dse-surface-sunken` consumer disposition.

**Deltas kept: 16** — High 8 · Medium 5 · Low 3. Two structural findings routed out to SC-120.

---

## 1. Root cause (one token explains most of the catalog)

The mechanism Scott named is confirmed, and the plugin already has the **source** of it —
what it lacks is the *transparency* to let it through.

**The bleed source is correct.** The plugin's card plate is byte-identical to the site's, in
both schemes:

| | site | plugin |
|---|---|---|
| plate gradient (dark) | `linear-gradient(160deg, rgb(35,42,46), rgb(24,28,31))` | **identical** |
| plate gradient (light) | `linear-gradient(160deg, rgb(255,255,255), rgb(238,241,241))` | **identical** |
| plate shadow (dark) | `rgba(255,255,255,.07) 0 1px 0 inset, rgba(0,0,0,.34) 0 8px 22px` | **identical** |

`--dse-card-bg` (styles-source.css:3330 dark / :5722 light) is a faithful port of the site's
`--fx-card-bg` (steel-redesign.css:14-33).

**The occluder is `--dse-surface-sunken`.**

| scope | styles-source.css | value | class |
|---|---|---|---|
| Obsidian default theme | :3020 | `rgba(0,0,0,.2)` | translucent BLACK — *correct direction* |
| **steel-dark** | **:3272** | **`rgba(220,226,230,0.06)`** | **translucent WHITE — wrong direction** |
| **steel-light** | **:5691** | **`#eaeeef`** | **OPAQUE — occludes completely** |
| print / print-preview | :6439, :6496 | `#fff` | opaque (intended) |

The site never uses a white wash for a body surface in dark mode. Its dark alpha ladder is
entirely translucent **black** (values from the static map, §8):

| α | site surfaces |
|---|---|
| `.25` | `.sc-card__stat` (kit + reference-card stat tiles) |
| `.22` | `.sb__stat`, `.sc-kit__equip` |
| `.20` | `.sc-ability__cell` (Distance/Targets) |
| `.18` | `.sc-ability__pr`, `.sc-ability__section`, `.sc-ability__enh`, `.sc-card__intro blockquote` |
| `.16` | `.sb__field`, `.sb__feat`, `.fb__stat`, `.fb__feat` |
| `.14` | `.sc-trait__nest > .sc-trait`, `.sc-callout` |

In the light scheme the same surfaces collapse to a `.02–.045` translucent-**black** band —
i.e. **light uses the same mechanism, thinner**, over the light plate gradient. It is *not*
"flat plate + flat fill", which is what the plugin's opaque `#eaeeef` implements.

**Why it reads flat, numerically.** For `.sc-card__stat` at α=.25 over the dark plate: plate
top `#232a2e`(35,42,46) → tile `(26,32,35)`; plate bottom `#181c1f`(24,28,31) → tile
`(18,21,23)`. The tile carries an 8-unit internal ramp inherited from the parent *plus* a
~9-unit step down from the plate. A 6% white wash instead **adds** a constant toward white
and compresses that ramp to near-nothing — every panel lands on the same pale grey regardless
of its position on the plate. That is precisely the flatness in Scott's observation.

**The code comments already assert the fix as though it were done.** styles-source.css:4687
(`.dse-pr`) reads:

```
     background: rgba(0,0,0,.18);              → --dse-surface-sunken, again the
       token .dse-section already maps this exact site value to.
```

The premise is false: in steel-dark the token resolves to `rgba(220,226,230,0.06)`, not
`rgba(0,0,0,.18)`. The same claim appears at :4590 (`.dse-section`). SC-100 discovered and
fixed exactly this on two kit surfaces by **hardcoding the site literals and bypassing the
token** (:4358, :4291) — it did not fix the token, so every other consumer still carries the
bug.

---

## 2. Delta catalog — per family × surface

Severity: **High** = visibly flat where the site is rich, or a wrong-direction wash.
**Medium** = partial / lower-visibility / same bug on an unrendered or secondary surface.
**Low** = nit or coverage gap.

### High

| ID | Surface (plugin) | Site counterpart | Site mechanism (dark) | Plugin mechanism (dark) | Families | Token/selector |
|---|---|---|---|---|---|---|
| **D1** | `.dse-section` | `.sc-ability__section` | `rgba(0,0,0,.18)` translucent black over plate | `rgba(220,226,230,.06)` translucent **white** | feature ×5, statblock ×10, featureblock ×3, kit ×1 | `--dse-surface-sunken` @ :4590 |
| **D2** | `.dse-pr` | `.sc-ability__pr` | `rgba(0,0,0,.18)` | `rgba(220,226,230,.06)` white | feature, statblock ×2, featureblock, kit | `--dse-surface-sunken` @ :4687 |
| **D3** | `.dse-feature__meta-cell--distance` / `--target` | `.sc-ability__cell` | `rgba(0,0,0,.2)` | `rgba(220,226,230,.06)` white | feature, statblock ×6, kit | `--dse-surface-sunken` @ :4541 |
| **D4** | `.dse-sb__item` | `.sb__stat` | `rgba(0,0,0,.22)` | `rgba(220,226,230,.06)` white | statblock ×5 | `--dse-surface-sunken` @ :5111 |
| **D5** | `.dse-sb__kv` | `.sb__field` (grid/gridc) | `rgba(0,0,0,.16)` | `rgba(220,226,230,.06)` white | statblock ×3 | `--dse-surface-sunken` @ :5133 |
| **D6** | `.dse-section__title` | `.sc-ability__section-head` | **no `background-color` at all** — only the sheen `linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0))`; the section's own `.18` black shows through | `background-color: var(--dse-surface-raised)` = **OPAQUE `#22272b`** *under* the identical sheen | feature, statblock, featureblock, kit | `--dse-surface-raised` @ :4612 — **separate token, separate fix** |
| **D7** | `.dse-hero__region` | *(plugin-only family; the site's grammar analogue is `.sc-ability__section`)* | `rgba(0,0,0,.18)` | `rgba(220,226,230,.06)` white over `.dse-hero`'s own `--dse-card-bg` gradient | hero ×7 | `--dse-surface-sunken` @ :5229 |
| **D8** | `.dse-init__cell`, `.dse-init__groupbody`, `.dse-enc__summary` | *(plugin-only; CSS comment cites `.dse-sb__item`/`.dse-sb__kv` as the model)* | model is `rgba(0,0,0,.22)`/`.16` | `rgba(220,226,230,.06)` white over a gradient ancestor | initiative ×6, encounter ×1 | `--dse-surface-sunken` @ :5340 |

**D6 is the one High delta that is not the sunken token.** The site's section head is a pure
sheen over the section's own recessed fill; the plugin paints an opaque raised plate under
the sheen, which occludes both the section fill *and* the card gradient across the full width
of every section header. Its sibling `.dse-pr__head` is **correct** (transparent + the same
sheen) — so the plugin already has the right recipe one selector away. Fixing D1 without D6
will leave the head strips reading brighter than the panels they cap.

### Medium

| ID | Surface | Site counterpart | Delta | Note |
|---|---|---|---|---|
| **D9** | `.dse-section--spend` (:4816) | `.sc-ability__enh` `rgba(0,0,0,.18)` + `1px dashed` | same white-wash bug, inherited from the same token | **Not rendered by any default fixture** — bug is certain by token inheritance but visually unverified. Fixture gap. |
| **D10** | `.dse-feature__meta-cell--keywords` / `--type` | `.sc-ability__chip` `rgba(255,255,255,.02)` | plugin `rgba(220,226,230,.06)` — **right direction, ~3× too strong** | The site *does* use a faint white here (its one dark-mode white chip wash) — so these two cells must **not** move to black with D3. They need their own value. Also entangled with SC-121 **B-1** (the keywords/type pairing is an invented layout) — settle B-1's DOM question before repainting. |
| **D11** | every sunken consumer, **light scheme** | site light: translucent black `.02–.045` over the light plate gradient | plugin light `--dse-surface-sunken: #eaeeef` is **OPAQUE** — occludes the `#ffffff→#eef1f1` plate entirely | Same one-token fix, light half. Lower severity only because the light plate's ramp is perceptually ~7% relative vs the dark plate's ~33%. |
| **D12** | nested ability inside statblock | `.sb__feat` = `article.sc-ability` with `background: rgba(0,0,0,.16)` | plugin's nested feature has **no fill at all** (transparent) | Site gives each nested ability its own recessed well; the plugin renders them flush to the plate, so abilities don't separate from the statblock body. |
| **D13** | `.dse-stepper__input` (:5837), `input[type=checkbox]` (:5643) | — | `rgba(220,226,230,.06)` white | **Split disposition:** a real occlusion where they sit inside a card gradient (hero ×3, montage ×3, party ×1, negotiation ×2); cosmetic-only where there is no gradient ancestor (roll, party ×8, heroic-resource, surges, hero-tokens). Control affordances, not body surfaces — lower priority than D1–D8. |

### Low

| ID | Surface | Delta | Note |
|---|---|---|---|
| **D14** | `.dse-stamina--modal .dse-stamina__threshold--dying` (:1132) | token now resolves white where the CSS comment says it "WAS the `rgba(0,0,0,.2)`" | Modal-only; **not rendered** in any captured fixture. Coverage gap (matches SC-121 D-5: no modal shot coverage). |
| **D15** | `.dse-modal__section` (:5340) | same token, same bug class | **Not rendered** in any captured fixture. Coverage gap. |
| **D16** | tables | Site tables are **OPAQUE** `--md-default-bg-color` (`#1a1e21` dark) — they deliberately punch a flat hole *darker than both plate stops*. The plugin has **no table fixture** in the harness, so parity is unverified. | Coverage gap, not a confirmed defect. Relevant to SC-121 **C-6** (perk's embedded markdown table has no styling at all). |

---

## 3. What is already CORRECT (positive controls — do not regress these)

These were measured and match the site; they are the proof the extraction is sound and the
guardrail for any fix batch.

| Surface | Value (dark) | Status |
|---|---|---|
| card plate `--dse-card-bg` | `linear-gradient(160deg, #232a2e, #181c1f)` + `inset 0 1px 0 rgba(255,255,255,.07), 0 8px 22px rgba(0,0,0,.34)` | **exact match**, both schemes |
| `.dse-kit__equip` | `rgba(0,0,0,.22)` | **exact match** (SC-100 fix) |
| `.dse-tiles__cell` / `--dmg` | `rgba(0,0,0,.25)` | **exact match** (SC-100 fix) |
| `.dse-sb__chars` | `linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.16))` | **exact match** |
| `.dse-pr__head` | transparent + `linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0))` | **exact match** — the recipe D6 should adopt |
| `.dse-pr__row` tier wash | `linear-gradient(90deg, color-mix(--t 8%, transparent), transparent 60%)` | **exact match** |
| `.dse-crest` | `linear-gradient(180deg, #e3e7e9, #a9b0b5 48%, #686f74)` | **exact match**, both schemes |
| `.dse-head__eyebrow--chip` (cost) | `linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.14))` | **exact match**, both schemes |

**The SC-100 kit fixes are exactly right** — kit dark is the only plugin family that shows
*any* translucent-black fills (3 of them), and all 3 match the site literal-for-literal.

---

## 4. `--dse-surface-sunken` consumer sweep — every consumer dispositioned

Static scan of `styles-source.css` found **13 declaration sites → 17 distinct selectors**
(the `:is()` group at :5340 expands to 4). Each was then located in the live harness capture
and scored against its nearest gradient-painting ancestor.

| # | Consumer selector | Line | Renders in | Disposition |
|---|---|---|---|---|
| 1 | `.dse-stamina--modal .dse-stamina__threshold--dying` | 1132 | — | **UNRENDERED** (modal-only) → D14 |
| 2 | `.dse-feature__meta-cell--distance` | 4541 | feature, statblock ×6, kit | **BUG** — white wash over plate gradient → D3 |
| 3 | `.dse-feature__meta-cell--target` | 4541 | feature, statblock ×6, kit | **BUG** → D3 |
| 4 | `.dse-section` | 4590 | feature ×5, statblock ×10, featureblock ×3, kit | **BUG** → D1 |
| 5 | `.dse-pr` | 4687 | feature, statblock ×2, featureblock, kit *(+ negotiation, roll — no gradient ancestor)* | **BUG** → D2 |
| 6 | `.dse-section--spend` | 4816 | — | **UNRENDERED** → D9 (bug by inheritance, unverified) |
| 7 | `.dse-sb__item` | 5111 | statblock ×5 | **BUG** → D4 |
| 8 | `.dse-sb__kv` | 5133 | statblock ×3 | **BUG** → D5 |
| 9 | `.dse-hero__region` | 5229 | hero ×7 | **BUG** → D7 |
| 10 | `.dse-init__cell` | 5340 | initiative ×5 | **BUG** → D8 |
| 11 | `.dse-init__groupbody` | 5340 | initiative ×1 | **BUG** → D8 |
| 12 | `.dse-enc__summary` | 5340 | encounter ×1 | **BUG** → D8 |
| 13 | `.dse-modal__section` | 5340 | — | **UNRENDERED** → D15 |
| 14 | `input[type='checkbox']:not(.task-list-item-checkbox)` | 5643 | negotiation ×8 (2 over a gradient) | **PARTIAL BUG** → D13 |
| 15 | `.dse-stepper__input` | 5837 | hero ×3, montage ×3, party ×9, roll, heroic-resource, surges, hero-tokens | **PARTIAL BUG** → D13 (occludes in hero/montage/party; cosmetic elsewhere) |
| 16 | `.dse-pr__row[aria-checked='true']` | 6155 | rows render but **never checked** in any fixture | **UNVERIFIED** — would occlude when checked (all `.dse-pr__row` instances sit over a gradient) |
| 17 | `.dse-rollbar` | 6181 | roll ×1 — **no gradient ancestor** | **CORRECT-ish** — nothing to occlude; off-language but no richness loss |

**Sweep result: 17 consumers → 1 correct (no bleed to occlude) / 12 bugs (10 confirmed + 2
partial) / 4 unrendered-or-unverified.**

**Not a single consumer wants the white wash.** Of the 13 that render, 12 sit over a gradient
in at least one family. This makes the token itself — not its call sites — the right fix
point, with two carve-outs (D10's chip cells, and print, which already flips to `#fff`).

---

## 5. Interaction with approved surfaces — **read before fixing**

**The SC-100-approved kit card WILL change.** The kit's Equipment box and stat tiles were
fixed in SC-100 by hardcoding the site literals, so they are immune. But the kit's **nested
signature ability** is rendered inline in the same `.dse-card` and its interior
(`.dse-pr`, `.dse-section`, `.dse-section__title`, `--distance`/`--target` cells) is still on
the shared token. Measured on `kit--steel-dark`:

- `.dse-pr` `rgba(220,226,230,.06)` → would become `rgba(0,0,0,.18)`
- `.dse-section` `rgba(220,226,230,.06)` → `rgba(0,0,0,.18)`
- `--distance`/`--target` `rgba(220,226,230,.06)` → `rgba(0,0,0,.2)`
- `.dse-section__title` opaque `#22272b` → transparent (D6)

All four move **toward** the site (site's kit page nested ability uses exactly `.18`/`.18`/`.2`
and a transparent section head), so this is a correctness improvement — but it visibly
restyles the interior of a card Scott already signed off. **Any batch touching D1/D2/D3/D6
needs a Scott gate.**

---

## 6. Routed out (not SC-117 fix batches)

- **R1 — kit signature ability is a sibling plate on the site, inline in the plugin.** Site:
  `.md-typeset .sc-kit + h3[data-scc] + .sc-ability` (steel-kit.css:80-82) — the signature
  ability is a **separate card with its own full `--fx-card-bg` plate**, not a nested block.
  The plugin renders it inside `.dse-card` with no plate of its own. Structural/DOM, not
  material → **SC-120** (which already owns "other families lack the kit's cardhead grammar").
- **R2 — non-kit `CardLayout` families are materially near-empty.** treasure/ancestry/class/
  perk/career/culture/title/complication/rule render 1–3 painted surface kinds each vs the
  site's reference-card grammar (`.sc-card__stat` tiles, `.sc-card__intro blockquote` well,
  ledger rules). There is almost nothing there to be flat *or* rich. Same root as SC-121
  **C-1** → **SC-120**.

---

## 7. Proposed fix batches

Sequenced. Batches 1–3 share one mechanism and should land together or in order; each is
independently verifiable via the harness diff.

| # | Batch | Contents | Gate? |
|---|---|---|---|
| **B1** | **Flip the token** — `--dse-surface-sunken` to the site's polarity in both steel scopes | steel-dark `rgba(220,226,230,.06)` → a translucent black; steel-light `#eaeeef` → a low-alpha translucent black. Resolves D1, D2, D4, D5, D7, D8, D9, D11, D13, D14, D15 in one edit. **Open question for the gate:** the site does not use one alpha — it uses a ladder (`.25/.22/.20/.18/.16`). Either (a) set the token to `.18` (the modal value, covering `.dse-section`/`.dse-pr`) and give `.dse-sb__item`/`.dse-sb__kv`/`--distance`/`--target` their own site literals, or (b) introduce 2–3 sunken steps. Recommend (a) — it matches SC-100's established "hardcode the site literal per surface" precedent. | **YES** — touches the SC-100-approved kit interior (§5) |
| **B2** | **Per-surface alphas** — align the surfaces whose site value differs from B1's token | `.dse-feature__meta-cell--distance/--target` → `.2`; `.dse-sb__item` → `.22`; `.dse-sb__kv` → `.16`; `.dse-section--spend` → `.18` + confirm the dashed border. Depends on B1's (a)/(b) decision. | **YES** (same kit interior) |
| **B3** | **Section head strip (D6)** — drop the opaque raised fill | `.dse-section__title`: remove `background-color: var(--dse-surface-raised)`, keep `background-image: var(--dse-sheen-soft)` — i.e. adopt `.dse-pr__head`'s already-correct recipe. Must land with B1: on its own it makes heads transparent over a still-white-washed panel. | **YES** — changes every card's section headers incl. kit |
| **B4** | **Chip cells (D10)** — keywords/type to the site's `rgba(255,255,255,.02)` | Explicitly *excluded* from B1/B2's black flip. **Blocked on SC-121 B-1** (the keywords/type pairing may be an invented layout that changes DOM). | no — but blocked |
| **B5** | **Nested-ability well (D12)** — give `.sb__feat`'s plugin counterpart the site's `rgba(0,0,0,.16)` | Independent of B1–B3; small, statblock-only. | no |
| **B6** | **Fixture coverage** — add fixtures for `.dse-section--spend`, `.dse-modal__section`, the stamina modal, a checked `.dse-pr__row`, and a table | Closes D9, D14, D15, D16 and consumer #16 from unverified to verified. Overlaps SC-121 D-5/D-8. Recommend **before** B1 so the flip is provable on every consumer. | no |

**Recommended order:** B6 → B1 (+B2) → B3 → B5 → B4 (when SC-121 B-1 clears).

---

## 8. Evidence

**Real-Obsidian reproduction confirmed.** `evidence/H0-ability-card--site-vs-harness-vs-obsidian--dark.png`
is a three-way: site-dark | plugin browser harness | plugin in **real Obsidian** (141 shots,
`DISPLAY=:1 npm run obsidian-shots`, exit 0). The harness and Obsidian renders are visually
identical, so every delta below is real-app reproducible and not a harness artifact. This
matters because SC-122 found that natively-nested CSS silently drops in Obsidian's Chromium —
all 13 `--dse-surface-sunken` declaration sites are **top-level rules**, so they do apply
there, which the shot confirms.

Side-by-side site-dark vs plugin-dark for each High delta family, in `evidence/`:

- `H1-ability-card--site-vs-plugin--dark.png` — D1/D2/D3/D6. The site's Distance/Targets
  cells and Effect section read as recessed wells; the plugin's read as pale bars floating on
  the plate. Clearest single repro of Scott's observation.
- `H2-statblock--site-vs-plugin--dark.png` — D4/D5/D12.
- `H3-featureblock--site-vs-plugin--dark.png` — D1/D2 in the featureblock family.
- `H4-kit-nested-ability--site-vs-plugin--dark.png` — §5's interaction: the kit's *own*
  equip/tiles surfaces match (SC-100), while the nested ability's interior directly above them
  is still white-washed — the two mechanisms visible in one frame.

Raw captures: `site-refs/` (14 pages × 2 schemes), `plugin-refs/` (29 elements × 2 schemes).
Full computed inventories: `data/site-material.json`, `data/plugin-material2.json`.
Reproduce with `extract-site.mjs`, `extract-plugin.mjs`, `sweep.mjs`, `analyze.mjs`, `q.mjs`,
`q2.mjs` (all read-only; run under devbox with the plugin's `node_modules`).

Full static site-CSS mechanism map (per-family gradient ancestors, every child fill
classified, both schemes, plus the 23 places the site *does* put a gradient on a child) is
summarized in §1's alpha ladder; the notable exceptions to the bleed-through hypothesis are:
`.sb__head`/`.fb__head` role bands (child-owned gradients over `--sb-plate-solid`),
`.sc-trait`/`.sc-folder` recessed cards (own 168deg gradient, no plate ancestor), and five
dark-only white sheens with no light twin (`.sc-ability__pr-head`, `.sc-ability__section-head`,
`.sb__band-head`, `.sc-trait__seg-head`, `.sb__char-box`).
