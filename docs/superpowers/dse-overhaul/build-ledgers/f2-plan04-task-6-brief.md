### Task 6: Trackers + hero-sheet harmonization (stamina/initiative palette → tokens; temp-color purple; hero-sheet Steel chrome)

Lowest structural gap (recon breakdown #5) — no 1:1 site component, so this is **palette
harmonization + the one live taste flip**, not a structural port. The Steel `--dse-stamina-*`/
`--dse-turn-done`/`--dse-malice` tokens already carry harmonized values; retarget the view CSS's
raw color literals (`limegreen`/`yellow`/`red`) onto them, and flip the temp color to **purple**
(taste pick #1). Harmonize the D7 hero sheet (`ds-hero`) to the shared head/panel Steel chrome.

**Files:** modify `styles-source.css` (temp token flip + any raw literals in the trackers'
scoped CSS); `src/elements/stamina-bar/view.ts` / `initiative/view.ts` **only if** a color is
hardcoded in JS/inline-style rather than a token (verify first — prefer moving literals into
`--dse-*` tokens, keeping DOM/serialize untouched).

**Changes:**
- **Temp-stamina purple (taste #1):** `--dse-stamina-temp: #7c5cd6;` in the Steel block (~3099, currently `#5dade2`). Frees blue for Maneuver; sits outside the HP ramp. (Legacy base `deepskyblue` untouched.)
- **Raw-literal retarget:** any `limegreen`/`yellow`/`red`/`orange` in a stamina/initiative Steel-scoped rule → the matching `--dse-stamina-*`/`--dse-tier-*`/`--dse-turn-done`/`--dse-malice` token. **Legacy keeps its raw literals** (the tokens resolve to them in the Legacy base) — verify no Legacy drift.
- **Hero sheet (`ds-hero`):** confirm its regions (characteristics grid, stamina+recoveries, resource/surges/conditions panels) inherit the shared Steel head/section/chip chrome from Tasks 1–3; add any Steel-scoped hero-specific polish (e.g. `.dse-hero__*` embossed section titles) — theme-agnostic DOM, Legacy frozen.

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `stamina-bar--steel-dark.png`, `initiative--steel-dark.png`, `hero--steel-dark.png` + their `--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Flip temp token + retarget literals to tokens + hero Steel polish** (all Steel-scoped; verify no view serialize/DOM change).
- [ ] **Step 3: tsc + jest** (1970 baseline; no serialize tests touched).
- [ ] **Step 4: Re-shoot + READ + compare.** READ `stamina-bar--steel-dark.png` (temp band now purple, HP ramp on tokens), `initiative--steel-dark.png`, `hero--steel-dark.png`/`--steel-light.png`. No like-for-like site ref — compare temp/HP against `shots-hfs-recon/07-stamina-bar--plugin-dark.png` (before) and confirm the DESIGN.md palette intent (semantic-only color); hero sheet reads as a cohesive Steel plate.
- [ ] **Step 5: LEGACY-FREEZE gate.** `stamina-bar--legacy-{dark,light}.png`, `initiative--legacy-{dark,light}.png`, `hero--legacy-{dark,light}.png` pixel-identical to Step 1 (tokens resolve to the same Legacy literals). Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/stamina-bar/view.ts src/elements/initiative/view.ts test
git -C draw-steel-elements commit -m "feat(steel): harmonize tracker palette onto --dse-* tokens + temp-stamina purple (taste #1) + hero-sheet Steel chrome (SC-10)"
```

---

