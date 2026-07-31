### Task 8: Final sweep — full batteries (shots + obsidian-shots), docs, CHANGELOG

Finalize: run both camera batteries at their counts, READ the real-Obsidian sign-off shots
(the repo's stated fidelity gate, recon §3b), refresh docs, and land the changelog.

**Files:** modify `docs/superpowers/dse-overhaul/D3-token-map.md` (record the temp-color flip
`#5dade2 → #7c5cd6` + a Source Serif 4 `@font-face` row / note), plugin `CHANGELOG.md`,
workspace `CHANGELOG.md`, workspace `DESIGN.md` (a pointer note: "The DSE plugin's Steel theme
now ports this look — see `dse-overhaul/plans/2026-07-19-plan-19-hfs-steel-theme.md`").

- [ ] **Step 1: Full jest + tsc.** `devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npx jest'` — **1970 green** (+ any small DOM assertions added).
- [ ] **Step 2: Shots battery.** `devbox run -- bash -c 'cd draw-steel-elements && npm run shots'` — **295 PNGs** (no new fixtures; look-only). READ the full Steel set (`feature`/`statblock`/`featureblock`/`stamina-bar`/`initiative`/`hero`/`conditions` `--steel-{dark,light}`) side-by-side with the `shots-hfs-recon/*--site-*` refs for whole-family parity; READ `04-kit-card--site-dark.png` vs the plugin kit render for the composite (kit = header + equipment grid + spliced signature ability). Confirm **every `<id>--legacy-*` and `<id>--steel-print` PNG is unchanged across the whole sweep** (the branch-level Legacy-freeze + SC-4 proof).
- [ ] **Step 3: obsidian-shots (real-Obsidian sign-off).** `devbox run -- bash -c 'cd draw-steel-elements && npm run obsidian-shots'` — **131** (unchanged count; look-only). READ the ability/statblock/featureblock/hero Steel ground-truth shots — the final fidelity gate.
- [ ] **Step 4: Docs-as-done.**
  - `D3-token-map.md`: update the `--dse-stamina-temp` row to `#7c5cd6` (resolve the "Scott review" flag → taste #1 RESOLVED), add a Source Serif 4 `@font-face` note (the font is now shipped, not just declared).
  - plugin `CHANGELOG.md`: an SC-10 entry (Steel theme now ports the site's High-Fantasy Steel look — bundled Source Serif 4, crest/embossed heads, boxed rails, role-tinted statblock plate, featureblock band, teal links; Legacy unchanged).
  - workspace `CHANGELOG.md`: one `## Unreleased` bullet.
  - workspace `DESIGN.md`: the pointer note (no design-language change — the site is unchanged; the plugin now matches it).
- [ ] **Step 5: Commit + record counts.**
```bash
git -C draw-steel-elements add CHANGELOG.md docs/superpowers/dse-overhaul/D3-token-map.md
git -C draw-steel-elements commit -m "docs(steel): SC-10 CHANGELOG + D3-token-map (temp #7c5cd6, Source Serif 4 shipped)"
git add CHANGELOG.md DESIGN.md && git commit -m "docs: DSE Steel theme ports High-Fantasy Steel (SC-10, Unreleased)"
```
Record the final `shots` (295) / `obsidian-shots` (131) counts in the commit body.

---

## Self-review (coverage sweep)

- **Recon order honored, grouped to 8 tasks:** typography+links (1) → head grammar completion
  (2) → ability card (3) → statblock (4) → featureblock (5) → trackers+hero (6) → reference
  cards (7) → sweep+docs (8). The recon's 9 steps map on: recon 1→T1, 2→T1, 3/4→T2+T3, 5→T4,
  6→T5, 7(◆ rule)→already-shipped/T2, 8→T6, 9→T7.
- **Recon corrections applied** (preamble): head grammar / ◆ rule / `.dse-section` / meta rail
  ALREADY exist and (except crest) are wired — the plan ports STYLING + fills slots, does not
  rebuild the grammar. Crest is the one true wiring gap.
- **Every task:** baseline shot → implement → re-shoot → READ vs the **named** site reference →
  LEGACY-FREEZE gate (`<id>--legacy-{dark,light}` pixel-identical; `<id>--steel-print` frozen)
  → full `tsc`+`jest`. Theme-agnostic-DOM called out per view-touching task (2,4,5,6).
- **Constraints honored:** no serialize/schema/game-rule edits; no new runtime deps (only
  bundled OFL font + OFL.txt); JetBrains Mono deferred; print/Legacy-print (SC-4) untouched;
  taste picks resolved by "match the site" (temp→purple #7c5cd6 the one live flip; gold + act
  already site-correct; #4 parked).
- **Baselines:** jest 1970, shots 164 fixtures/295 PNGs, obsidian-shots 131, tip `ffbfec7`.
