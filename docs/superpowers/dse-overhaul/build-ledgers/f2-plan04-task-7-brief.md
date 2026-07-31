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

