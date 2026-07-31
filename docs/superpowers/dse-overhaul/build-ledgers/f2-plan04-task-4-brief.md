### Task 4: Statblock plate — outer forged card, role-tinted header band, boxed stat rows, crest

The largest before/after (recon breakdown #1, `01-statblock--site-dark.png`). The Steel token
`--dse-card-bg`/`-bevel` rule already grounds `.dse-sb` (~3152) and `data-dse-role` role tokens
exist; this task adds the **role-tinted gradient header band**, **boxed stat/characteristics
rows**, wires the **crest** into the statblock head, and confirms the ◆ rule under the header
(already emitted by `statblock/view.ts:207`). Statblock body typography (small-caps labels, big
numerals) rides the Task-1 font + emboss.

**Files:** modify `styles-source.css`; `src/elements/statblock/view.ts` (pass `crest:` to the
head — theme-agnostic, Legacy-neutralized; the header-band is CSS keyed off the existing
`data-dse-role` attribute, no new DOM needed).

**Steel CSS (scoped):**
- **Header band:** a role-tinted gradient strip behind `.dse-head` using `var(--dse-role-<role>)` (set via the shipped `data-dse-role`) — the pink "Horde Harrier" band of `01-statblock--site-dark.png`. Steel-only; Legacy header stays flat.
- **Boxed stat rows:** the 5-stat row + immunity/weakness/movement + characteristics rows (`.dse-statgrid`, `.dse-sb__*` stat cells) → boxed grid cells (`--dse-surface-sunken`, hairline), small-caps `-key` labels, embossed big `.dse-statgrid__value` (emboss already at ~3180).
- **Single-plate hygiene:** the shipped rule zeroing the statblock root background (~3166) already prevents double plates — confirm the band + outer `.dse-sb` border read as one forged plate, not nested boxes.

- [ ] **Step 1: Baseline shots.** `npm run shots`; READ `statblock--steel-dark.png` (flat stack today) + `statblock--legacy-{dark,light}.png` baselines.
- [ ] **Step 2: Wire crest into the statblock head + implement the Steel band/boxed-row CSS.**
- [ ] **Step 3: tsc + jest** (1970; DOM assertion only if crest wiring warrants).
- [ ] **Step 4: Re-shoot + READ + compare** `statblock--steel-dark.png`/`--steel-light.png` against `shots-hfs-recon/01-statblock--site-dark.png` (+`--site-light.png`): one continuous forged plate, role-tinted band, boxed stat rows, ◆ rule, embossed numerals.
- [ ] **Step 5: LEGACY-FREEZE gate.** `statblock--legacy-{dark,light}.png` pixel-identical to Step 1 (band/boxing Steel-scoped; role tokens are leader-grey in Legacy). `statblock--steel-print.png` unchanged (SC-4). Commit.
```bash
git -C draw-steel-elements add styles-source.css src/elements/statblock/view.ts test
git -C draw-steel-elements commit -m "feat(steel): statblock forged plate — role-tinted header band + boxed stat rows + crest (match site) (SC-10)"
```

---

