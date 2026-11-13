# SC-563 r2 implementation report (option I1, site glyph font in the action crests)

## Executive summary

1. STATUS: DONE. Branch `sc563-crest-fill-eyebrow-tint`, rebased onto dse origin/develop `63e00d7e` and workspace origin/main `bbcd1d41`.
2. Commits: dse `24f14359` (feat: font, licence, CSS, test) and `07a6d0ef` (docs: README credit, dse CHANGELOG); superproject `d98f3b9f` (DESIGN.md Iconography line, CHANGELOG Unreleased bullet). dse pointer NOT bumped, nothing pushed.
3. Full battery on the rebased branch: tsc and lint clean; jest 11657 passed / 1 skipped (expected 11648 + 8 new = 11656 passed / 2 skipped; the +1/-1 is the cached obsidian-app.css after a shots run); lifecycle 61/61 (21+16+9+4+7+4); e2e 315/318 ok, 0 failed, 3 known-bug, 174/174 pairs; shots 592, 0 FAIL, host-leak 163/978, modal 39/234, capture clip 147; freeze 280/280; parity 0 GAP / 0 undeclared / 24 DECLARED.
4. Screen shots changed: 76 (38 ids x steel-dark/steel-light), 0 print, 0 realprint, measured as a base-CSS shots run vs the branch run (list in `r2-implement/changed-shots.txt`).
5. Deviation from the brief's wording: `font-size: calc(var(--dse-fs-body) * 1.25)` instead of the literal `1.25em`. `--dse-fs-body` is exactly `1em`, so the pixels are identical (20px glyph in the 48px crest = 0.4167, the site ratio); the literal would have failed `fontSizeContract.test.ts` ("declares NO new hardcoded font-size").
6. Real Obsidian check: spot-checked on a private Xvfb with `obsidian-camera.mjs --element=feature`: the Coverage Strike crest draws the crossed sword and arrow glyph (not a letter "l"). Trust-vault modal overlays the shot.

## What changed

- `assets/fonts/DrawSteelGlyphs-Regular.otf`: byte-identical to `reference/DrawSteelGlyphs/` and `v2/docs/fonts/` (cmp), full font, no subset.
- `assets/fonts/DrawSteelGlyphs-LICENSE.txt`: copy of `reference/DrawSteelGlyphs/FontLicense.txt` (MCDM, CC BY-SA 4.0).
- `styles-source.css`: (a) an `@font-face "DrawSteelGlyphs"` with a `data:font/otf;base64,` URI (28,848 base64 chars), `font-display: block`, right after the Source Serif 4 embeds (Source Serif 4 is pasted base64 in the CSS, not generated, so same mechanism); (b) one commented SC-563 block after the Steel crest-face rules (before "Per-option glyph show-override"): hide the svg and set the face/size/line-height for the six acts, then six `content: "<cp>" / ""` rules. The comment cites `ability_cards.go:88-110`, the placeholder note (`:83-85`), SC-565, and SC-367's resize scaling the 1.25.
- Scope of every rule: `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-feature:is([data-dse-act='main'], 'maneuver', 'triggered', 'move', 'none', 'trait') > .dse-head > .dse-crest .dse-crest__glyph`. Villain and any unmapped `data-dse-act` match nothing, so they keep the Lucide svg.
- Credit: README new "Third-party fonts" section (Source Serif 4 OFL and Draw Steel Glyphs CC BY-SA); the existing in-CSS Source Serif comment is the only other place the plugin credits it, and the new `@font-face` carries its own credit comment. dse CHANGELOG `[STEEL]` entry under 7.0.0.
- Superproject: DESIGN.md Iconography bullet (crest action icons = DrawSteelGlyphs, site codepoints, placeholders/SC-565, villain = Lucide skull, other crests still Lucide); CHANGELOG `## Unreleased` bullet.
- Test `test/dom/theme/crestActionGlyphs.test.ts` (8 tests): whole-contract function; six codepoints; Steel + screen-only on every rule; villain/unmapped excluded (jsdom `matches()` on the real selector, with an ancestor `[data-dse-theme=steel]`); `/ ""` alt text; `@font-face` present, display:block, and the embedded bytes equal the committed OTF; licence file; a teeth test with five mutations.
- No existing test asserted the Lucide icon visible on action crests; none changed.

## Can-fail proof

Mutating the real stylesheet (villain added to the hide set, alt text dropped on `o`) made the new test file fail (rc 1: "names villain", "content has no empty alt text", "svg hidden for villain", "glyph face applied to villain"); stylesheet restored byte-identically (cmp) afterwards. The in-test teeth test covers five further mutations permanently.

## Gates (rebased branch, dse 24f14359 + 07a6d0ef)

| Gate | Result |
|---|---|
| tsc | rc 0, clean |
| lint | rc 0, 0 errors |
| jest | 270+1 suites; 11657 passed, 1 skipped |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7 (G-S91 green first run), 4/4 = 61/61 |
| e2e | `OBSIDIAN-E2E done: 315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` |
| shots | 592 ok, 0 FAIL; host-leak 163/978; modal host-leak 39/234; capture clip 147 |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical)` |
| parity | rc 0; 24 DECLARED, 0 GAP, 0 undeclared |

Before the rebase (dse base d984b115) the same battery was green on the first commit set (jest 11625/2 skipped, lifecycle 61/61, e2e 306/309); those numbers are superseded by the table above. A pre-rebase shots run completed but is not used.

## Evidence

- Composite: `r2-implement/sc563-r2-crest-before-after-site.png` (1412 x 1422; 2 image px per CSS px, tiles pasted 1:1, never resized). Rows Before / After / Site; columns maneuver (Mark), main, triggered, move, no action, trait (Determination), villain; dark block, then a light block with the same grid. Ink colours named in prose with OKLCH L under every tile. The After row shows the site's shapes; ink colours are identical across rows (same tokens): blue L 0.72 / red 0.63 / green 0.68 / orange 0.76 / pale grey 0.86 / light purple 0.71 in dark; blue 0.54 / red 0.54 / green 0.54 / orange 0.62 / slate grey 0.49 / dark purple 0.48 in light. Villain stays a red outline skull (L 0.64).
- Measured: computed glyph is 20px DrawSteelGlyphs in a 48px crest (site 25px in 60px, both 0.4167); font status `loaded`; ink colours equal the site's computed colours exactly; No action and Trait draw the same star (site does too).
- "Before" is the After harness with the SC-563 rules neutralised by an injected `!important` override (svg shown, `::before` content none) and the per-kind Lucide icon `crestIconFor()` picks; the real-fixture Before tiles (Mark, Determination) agree.
- Real Obsidian: `r2-implement/feature--obsidian-steel-dark.png`, `feature--obsidian-steel-light.png`, `obs-crop-dark.png`, `obs-crest-zoom-dark.png`, `obs-crest-zoom-light.png`.
- Data: `r2-implement/data/sc563-r2-plugin.json`, `sc563-r2-site.json`; tiles in `r2-implement/tiles/`.
- Changed shots: `r2-implement/changed-shots.txt` (76 files: chrome-hover-card, chrome-hover-statblock, chrome-placement-trio, feature, feature-ability-provenance, feature-list, feature-rolled, feature-rolled-expanded, feature-rolled-expanded-narrow, feature-rolled-modified, feature-spend, feature-trait-provenance, kit, and 25 statblock ids, each in dark and light).
- Logs (private scratch): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r2-impl-k7q3/gate-*.log` (the `B`-suffixed ones are the rebased-branch runs).

## Drive-by fixes

None.

## Follow-ups

1. `src/elements/feature/renderFeature.ts` `crestIconFor` docstring still says glyph-font parity "is explicitly NOT required"; the svg is still mounted (hidden under Steel) so the code is right, but the comment now describes the pre-I1 state. Left as is (TS file the task did not need to touch).
2. DESIGN.md Iconography's opening line still says "no Lucide"; my bullet states the crest exception honestly, but the section's headline rule was already out of line with the other crests (Lucide) before this change.
3. `obsidian-camera.mjs` (non-docs mode) rewrites the tracked `demo-vault/.obsidian/appearance.json` (adds `"showRibbon": true`); I restored it with `git checkout`. Worth a ticket (the camera should not dirty tracked files).
4. dse-verify could record that `obsidian-camera.mjs --element=<id>` runs on a private Xvfb via `DSE_CAMERA_DISPLAY` plus `scripts/xvfb-owned.mjs`'s `startOwnedXvfb` (my scratch wrapper: `.../scratchpad/sc563-r2-impl-k7q3/obs-spot.mjs`), so an agent can do the real-Obsidian spot check without `:1`.
5. For the closing comment: the font ships MCDM's own villain glyph `d`; offered, not shipped (per ruling).
6. Parity cannot cover the crest glyph (text vs svg, no `fill`/`stroke` in PROPS); the contract is the jest test only.
7. The in-CSS Source Serif 4 credit is the only place the plugin credited it before; the README now credits both fonts. If the community-plugin review wants a NOTICE file, that is a separate decision.

---

# Round 4 (fix round, 2026-11-13)

## Summary

1. STATUS: DONE. Rebased onto dse origin/develop `c0995beb` and workspace origin/main `a1d359f3` (the fetched tip; the dispatcher's `2329ba8f` is not what origin/main resolves to).
2. Final shas: dse `04e57b67` (feat) + `10fcb6d3` (docs) + `1516f894` (r3 fixes); superproject docs `4fbba5ff` + `41aada3b`; ONE pointer bump `92be5319` (`draw-steel-elements` -> `1516f894`). Nothing pushed.
3. M1: both font credits are now `/*!` legal comments (Draw Steel Glyphs, CC BY-SA 4.0 + licence URI; Source Serif 4, Adobe + OFL 1.1 + URI). A production build (`npm run build-no-check`) keeps both, at the end of the 450,152 B `styles.css`: grep counts MCDM Productions 1, CC BY-SA 4.0 1, SIL Open Font License 1.
4. L1 (CSS comment + DESIGN.md: "no villain crest on ability cards; the statblock villain glyph is the same `*` placeholder"), L2 (both CHANGELOGs mention statblock abilities; the dse bullet no longer says "their own glyph"), L3 (family renamed `"DSE DrawSteelGlyphs"` in the `@font-face`, the glyph rule and the test), L4 (every glyph rule must contain `> .dse-head > .dse-crest`; mutation M02 now caught), I-6 (DESIGN.md "`^` star (passive)" -> "`*` star (trait)", `d` = villain action / malice), `crestIconFor` docstring (comment only) all done.
5. Tests: 2 more in `crestActionGlyphs.test.ts` (10 now): both legal notices present, with a teeth test (plain-comment mutants are reported); plus the M02 mutation inside the existing teeth test.
6. Gates on the final branch: tsc, lint clean; jest 11693 passed / 1 skipped (obsidian-app.css cache PRESENT; expected 11682 + 10 = 11692 passed / 2 skipped without the cache); lifecycle 61/61 (21, 16, 9, 4, 7, 4); e2e 328/331 ok, 0 failed, 3 known-bug, 174/174; shots 592 ok, 0 FAIL, host-leak 163/978, modal 39/234, capture clip 147; freeze 280/280; parity 0 GAP / 0 undeclared / 24 DECLARED. Changed shots: the same 76 (38 ids x dark/light) as round 2, identical list.
7. One self-inflicted incident, found and fixed: my round-2 real-Obsidian camera run executed `notes-gen`, which left git-ignored `demo-vault/Harness/` and `demo-vault/DS Compendium/` in the worktree. The lifecycle scratch vault copies `demo-vault`, so G-S97 ("the pick did not land in the edited note") failed deterministically, on this branch, on `c0995beb` and on `63e00d7e` alike. I deleted those two literal paths; G-S97 then passed alone and part 6 passed 4/4. It is not a product regression. dse-verify should say: after any `notes-gen` / camera run, delete `demo-vault/Harness` and `demo-vault/DS Compendium` before lifecycle (extends SC-622).
8. The camera was not re-run this round (no appearance.json change).

## Notes

- The `/*!` Source Serif 4 notice says the font is a Latin subset. The OFL's Reserved Font Name clause ("Source") for a modified subset still named "Source Serif 4" is a pre-existing question I did not touch.
- Evidence unchanged from round 2 (composite, changed-shots list); logs: `.../scratchpad/sc563-r2-impl-k7q3/gate-*4.log` (round 4 runs; `lc64`/`lc64b`/`lc97*` are the G-S97 incident runs).
