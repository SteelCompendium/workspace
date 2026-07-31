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

