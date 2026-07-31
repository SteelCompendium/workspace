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

