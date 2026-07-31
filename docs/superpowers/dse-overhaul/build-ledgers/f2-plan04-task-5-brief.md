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

