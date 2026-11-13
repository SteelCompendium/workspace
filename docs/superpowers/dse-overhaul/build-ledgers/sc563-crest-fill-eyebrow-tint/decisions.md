# SC-563 decisions ledger — Steel crest icon outline vs filled; site tints the trait eyebrow

Owner: ticket-owner (runs on **Opus 5.5** — post with `--model opus-5.5`).
Worktree: `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint`
(branch `sc563-crest-fill-eyebrow-tint` in every submodule; superproject cut at `e1d3d1e0`).
DSE tracked branch: `develop`. Base at cut: dse `origin/develop` = `6270e84a` (SC-526 landed).

Workers read THIS file, never the tracker.

## Ticket framing (ticket body, filed by SC-367's owner 2026-11-06; not a Scott ruling)

- **Crest icon fill:** "on the site the icon inside the crest shield is a solid, filled glyph
  (Mark's person, Determination's star). In the plugin it is drawn as a thin outline, and it is
  smaller. SC-367 handles the crest and icon *size*; the outline-vs-filled difference is not a
  size question and is left for this ticket."
- **Trait eyebrow tint:** "on the site the "◆ TRAIT" label above a trait card's name is tinted
  with the trait's accent (a light purple on Determination). The plugin draws it in the neutral
  grey every other label uses. This is colour, close to SC-368's name-colour question — decide
  the two together."
- Evidence (machine-local): `.superpowers/sdd/sc367-cardhead-title-scale/r2-evidence/sc367-ask-1-cards.png`
  (rows "Today (plugin)" and "Site" for Mark and Determination).
- "Colour is never the only channel here: the filled-vs-outline difference is a shape difference too."

## Dispatcher constraints (2026-11-10)

- Ticket is DSE 7.0.0 Backlog; Scott activated the project's Backlog for work 2026-11-10. If the
  ticket needs a decision from Scott, ask on the ticket and park.
- Owners do not edit dse-verify SKILL.md: any proposal is a file in this dir.
- Footguns: no compound `cd` (`git -C <abs>`, `devbox run -c <abs path> -- …`); never `rm` with a
  variable target, never a glob `rm` under /tmp; one gate per Bash call, foreground, no background
  gates except shots (then poll its log); lifecycle in FIVE `--only` parts (`G-S7a … G-S9a` 21;
  `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9;
  `G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49` 2), G-S56 stays LAST in SCENARIOS order; never set
  DSE_LIFECYCLE_PORT; private DSE_CAMERA_TMP per run; kill scratch processes by literal PID only;
  private scratch subfolder named for ticket+role+agent.
- Baseline at `6270e84a`: jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 · e2e
  128/128 ok, coverage 89/89 · shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) ·
  freeze 280/280 · parity 0/0/24.
- New lifecycle id if needed: **G-S70**.
- Overlap: SC-367 (crest/eyebrow/title scale; ledger `.superpowers/sdd/sc367-cardhead-title-scale/`)
  and SC-368 (card-head name colour; `.superpowers/sdd/sc368-cardhead-name-accent/`) both parked on
  Scott, same Steel card head. Whichever lands second rebases. Running alongside: SC-561 (G-S59
  timeout, harness), SC-486 (ds-encounter _computed write on render).
- Report land-ready to the dispatcher and stop; the dispatcher lands.

## Overlap state at start (owner reading, 2026-11-10)

- SC-367 ask (posted 2026-11-06, no Scott reply yet): recommends A-ink, under which the crest grows
  48 -> 60 px wide on ability/trait/kit-signature and the icon "grows with the crest". So SC-563's
  icon SHAPE work must not fix an icon size; it must compose with either SC-367 outcome.
- SC-368 ask (posted 2026-11-06, no Scott reply yet): recommends D (keep one dark name colour).
  The ticket says decide the eyebrow tint "together" with SC-368 — the SC-563 ask must state how
  each eyebrow option composes with SC-368's D and A.

## Scott rulings

(none yet)

## Round 1 dispatched (2026-11-10) — survey, reviewer

- Brief `sc563-brief-r1-survey.md`: measure site vs plugin crest icon (drawing method, fill vs
  stroke, glyph per kind, size, spill to other surfaces) and trait eyebrow tint (rule, values per
  kind, OKLCH L/C/h, contrast, both schemes); options + print/parity/shots consequences;
  composition with SC-367 (size) and SC-368 (name colour D/A); ≤3 same-scale composites.
  No source changes. Report `sc563-r1-survey-report.md`, evidence `r1-survey/`.

## Round 1 result (survey, 2026-11-10) — `sc563-r1-survey-report.md`

- Q1 crest icon: site = DrawSteelGlyphs font glyph, solid, 25px in 60x68; plugin = Lucide outline,
  24px in 48x54, no fill. Icon:crest ratio 0.42 both sides ("smaller" is SC-367's crest size).
  For 4 of 6 kinds the site draws a DIFFERENT picture (placeholder codepoints, ability_cards.go:83-85).
  Options I1 site font (No action + Trait become the same star; CC BY-SA font in MIT plugin),
  I2 fill our outlines on action crests only (skull outline; dashed ring unchanged), I3 stroke 3, I4 keep.
  Fill must be scoped to action crests (unscoped ruins 12 of 24 other crest icons).
- Q2 eyebrow: site tints `.sc-trait` eyebrows only (`steel-traits.css:117-118`), word + diamond:
  #bb8fce L 0.71 dark, #7d3c98 L 0.48 light. Plugin neutral #959b9e L 0.68 / #555960 L 0.46.
  Lightness change +0.03 / +0.02 — nearly all hue. Options E-A copy, E-B keep, E-C diamond only.
  Under SC-368 A (light) the eyebrow is darker than the name regardless of tint.
- Every option: 0 of 280 frozen lines (crest/eyebrow display:none in print; union shots run 280/280;
  unscoped control moves 46). Parity: no pair sees either slot, stays 24 DECLARED.
  Screen shots moved: I1/I2 18 combos, I3 19, E-A/E-C 4 (x2 schemes).
- CSS insertion point: new block after `styles-source.css:8858` (report §5 has exact CSS).

## Owner rulings, round 1 (2026-11-10)

- Owner eyeball of `r1-survey/crops/sc563-r1-q1-crest-icon.png` and `sc563-r1-q2-trait-eyebrow.png`:
  ACCEPTED (same scale, rows labelled by text, lightness in every caption). Spill image not posted.
- Recommend I2 for Q1 and E-B for Q2 (E-B pairs with SC-368's recommended D).
- Whatever Scott picks for Q1, the implementation round adds a DESIGN.md Iconography line saying
  what the crest icons are (report §4, rule 8). Fold, not a ticket.
- Filed **SC-565** (Backlog, related SC-563): site No action + Trait crests share one star
  (hue-only in light) and three crest glyphs are placeholders. OUT OF SCOPE here.

## Ask 1 POSTED (2026-11-10) — `sc563-comment-1-ask.md`

- Q1 I2 (rec) / I1 / I3 / I4; Q2 E-B (rec) / E-A / E-C, with SC-368 D/A composition stated.
  Images: q1-crest-icon, q2-trait-eyebrow. Ticket In Progress + Needs Review (verified).
  PARKED on Scott. If I4 + E-B: close with no code (DESIGN.md Iconography line is then optional —
  ask nothing more, note it on close). Otherwise: implementer round in the worktree, CSS per report §5,
  full dse-verify battery, independent review, then land-ready.

## Scott ruling, ask 1 (2026-11-12, verbatim)

> 1. **I1 - use the glyphs**
> 2. **E-B**

- ~~Owner recommendation I2 (fill our own outlines)~~ superseded by Scott's I1: use the site's
  DrawSteelGlyphs font glyphs in the action crests (villain keeps its skull: the site has no villain
  crest, per the r1 probe). He chose it with the stated costs in the ask (No action and Trait share
  one star; CC BY-SA font in the MIT plugin; follow the site if MCDM ships official glyphs).
- E-B: the "◆ TRAIT" eyebrow stays neutral grey. No eyebrow code change.

## Worktree re-cut (2026-11-12, owner)

- Old worktree (clean, no commits, at dse 6270e84a) removed with `just wt-rm`; re-created with
  `just wt-new` from workspace main `298a4ef9` = origin/main, dse `d984b115` = origin/develop.
- CURRENT at d984b115 (dispatcher, 2026-11-12): jest 11617 passed / 2 skipped (fresh worktree) ·
  lifecycle 61/61 in SIX `--only` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16;
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4;
  `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` 7; `G-S92 G-S96 G-S97 G-S99` 4; comma-separated
  `--only=`; G-S91 known flake SC-616; part 6 is full) · e2e `306/309 ok, 0 failed, 3 known-bug,
  coverage: 174/174 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 ·
  freeze 280/280 · parity 0/0/24.
- Dispatcher rules: never put a bracketed ticket id in an e2e test title; before land-ready the
  superproject branch sits on current workspace origin/main with ONE pointer bump.
- SC-367 / SC-368 still parked (no Scott rulings in their ledgers at 2026-11-12); not on develop.

## Owner rulings, implementation (2026-11-12)

- Ship the DrawSteelGlyphs OTF **unmodified, full font** (no subset — a subset is arguably an
  adaptation, ShareAlike), embedded as a `data:` URI the way Source Serif 4 is, with an attribution
  file next to `assets/fonts/OFL.txt` (copy of `reference/DrawSteelGlyphs/FontLicense.txt`) and a
  third-party credit wherever the plugin already credits Source Serif 4.
- Codepoints mirror the site exactly (`steel-etl/internal/site/ability_cards.go:88-110`): main `l`,
  maneuver `f`, triggered `)`, move `o`, none `*`, trait `*`. One commented map; comment cites the
  site file and SC-565 (placeholders; follow the site if it swaps).
- Villain keeps the Lucide skull, exactly as the I1 row Scott approved. (FYI for the closing comment:
  the font has MCDM's own villain glyph `d`; offer it, do not ship it.)
- Glyph is decorative: `content: "<cp>" / ""` so screen readers skip it; svg hidden only where the
  glyph replaces it. `font-display: block`. Glyph size 1.25em (site ratio 0.4167), comment that
  SC-367 A-ink would scale it.
- Screen-only, Steel-only (print hides crests). Scope `.dse-feature[data-dse-act]:not([data-dse-act='villain'])`
  crests; no other crest icon changes.
- Folds: DESIGN.md Iconography line (crest action icons = DrawSteelGlyphs; villain Lucide skull);
  workspace CHANGELOG `## Unreleased` bullet; dse docs per its AGENTS.md.
- E-B: no eyebrow change.

## Round 2 dispatched (2026-11-12) — implementer (Sonnet)

- Brief `sc563-brief-r2-implement.md`: I1 per the rulings above, full battery at d984b115,
  composite Before/After/Site, report `sc563-r2-implement-report.md`, evidence `r2-implement/`.
- Next: independent Opus review (a fresh identity; the r1 survey reviewer is acceptable since it
  authored no code, but prefer fresh), fix rounds, scoped re-review, then land-ready.

## Rate-limit stop + base move (2026-11-13)

- Implementer stopped by weekly API limit (429) mid-battery (about to run shots); resumed via
  SendMessage after reset. Commits survived: dse 7aa7ce1e, 452e426f; superproject 52dfc398.
- SC-605 landed: dse develop now **63e00d7e** (no CSS). Implementer told to rebase onto it and run
  the full battery once there. CURRENT at 63e00d7e: jest 11648 passed / 2 skipped (fresh) ·
  lifecycle 61/61 · e2e `315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` · shots 592,
  host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.
- Review brief `sc563-brief-r3-review.md` must use these numbers (d984b115 numbers there are stale).

## Round 2 result (implementer, 2026-11-13) — `sc563-r2-implement-report.md`

- Rebased: dse 63e00d7e -> commits 24f14359 (feat) + 07a6d0ef (docs); superproject on origin/main
  bbcd1d41 -> d98f3b9f (docs). No pointer bump, nothing pushed.
- Battery: tsc/lint clean; jest 11657/1 (claimed cache artefact; reviewer to verify); lifecycle 61/61;
  e2e 315/318 ok, 0 failed, 3 known-bug, 174/174; shots 592, 0 FAIL, 163/978, modal 39/234, clip 147;
  freeze 280/280; parity 0/0/24. Screen shots changed 76 (38 ids x dark/light), 0 print.
- Deviation: glyph size `calc(var(--dse-fs-body) * 1.25)` (= 1.25em) to satisfy fontSizeContract.test.ts.
- Owner eyeball of `r2-implement/sc563-r2-crest-before-after-site.png`: ACCEPTED — After row matches
  the Site row glyph-for-glyph in both schemes; villain keeps the outline skull.

## Round 3 dispatched (2026-11-13) — independent review (Opus, fresh identity)

## Owner rulings on r2 follow-ups (2026-11-13)

1. Stale `crestIconFor` docstring in renderFeature.ts ("glyph-font parity explicitly NOT required") —
   **FOLD** into the review fix round (comment-only, same area).
2. DESIGN.md Iconography opening "no Lucide" — **DROP**: pre-existing, and the new bullet states the
   crest case explicitly.
3. obsidian-camera rewrites tracked demo-vault appearance.json — **FILED SC-622** (Backlog). Out of scope.
4. dse-verify note on private Xvfb for the camera — **DROP**: not a gate; SKILL.md is not owners' to edit.
5. Villain glyph `d` — offer to Scott in the closing comment; not shipped.
6. Parity can't see text glyphs — **DROP**: inherent; the jest contract test guards it.
7. NOTICE file for community review — **DROP**: README credit + licence file satisfy attribution;
   revisit only if store review asks.

## Base move 2 (2026-11-13)

- SC-608 landed: dse develop **c0995beb**, workspace main **2329ba8f** (styles.css unchanged by SC-608).
  CURRENT: jest 11682 passed / 2 skipped fresh · lifecycle 61/61 · e2e `328/331 ok, 0 failed,
  3 known-bug, coverage: 174/174 pairs` · shots 592, host-leak 163/978, modal 39/234, clip 147 ·
  freeze 280/280 · parity 0/0/24.
- Plan: the review continues at 63e00d7e (no CSS moved). The fix round rebases onto c0995beb and
  runs the full battery there; the scoped re-review confirms the numbers.

## Round 3 result (review, 2026-11-13) — `sc563-r3-review-report.md`

- FIX-THEN-LAND. 0 BLOCKER / 0 HIGH / 1 MEDIUM / 4 LOW / 6 INFO. Reviewer gates at 63e00d7e: jest
  11656/2 clean (11657/1 with cached css — implementer's claim confirmed); shots 592/0 FAIL/163/978/
  39/234/147; freeze 280/280; parity 0/0/24; e2e 315/318, 0 failed, 174/174. calc() size
  pixel-identical to 1.25em.

## Owner rulings on review findings (2026-11-13)

- M1 (licence notice stripped from built styles.css) — FOLD: `/*! … */` legal comment with CC BY-SA
  4.0 + URI; same treatment for the Source Serif 4 OFL comment (same gap, same file); jest check that
  the source carries both `/*!` notices.
- L1 ("site has no villain crest" wording) — FOLD: say "no villain crest on ability cards".
- L2 (CHANGELOG bullets omit statblock abilities; "their own glyph" vs shared star) — FOLD.
- L3 (un-namespaced font family) — FOLD: rename to `"DSE DrawSteelGlyphs"`.
- L4 — FOLD the M02 assertion (selectors contain `> .dse-head > .dse-crest`); DROP M09 (cascade
  override, jsdom can't see it; Steel shots catch it).
- I-1 — rebase onto current dse origin/develop and workspace origin/main; then ONE pointer bump commit.
- I-2 (statblock abilities: glyph in full shield; SC-367 W6) — DROP: CSS comment already cites SC-367;
  whichever lands second rebases.
- I-6 DESIGN.md "`^` star (passive)" wrong — FOLD (one line, same section).
- I-3/I-4/I-5 — no action.

## Round 4 dispatched (2026-11-13) — fix round (resume implementer)

## Round 4 result (fix round, 2026-11-13)

- dse 04e57b67 + 10fcb6d3 + 1516f894 on c0995beb; superproject 4fbba5ff + 41aada3b + ONE pointer
  bump 92be5319 (-> 1516f894) on origin/main a1d359f3. Nothing pushed.
- All findings folded as ruled. Gates: tsc/lint clean; jest 11693/1 (cache present; = 11692/2 clean);
  lifecycle 61/61; e2e 328/331, 0 failed, 3 known-bug, 174/174; shots 592/0 FAIL/163/978/39/234/147;
  freeze 280/280; parity 0/0/24; same 76 changed screen shots.
- G-S97 incident: stale ignored demo-vault/Harness + DS Compendium from the r2 camera run broke G-S97
  deterministically; deleted (literal paths); part 6 then 4/4. Appended to **SC-622**.
- Source Serif 4 subset vs OFL Reserved Font Name -> filed **SC-623** (Backlog). Out of scope.

## Round 5 dispatched (2026-11-13) — scoped re-review (r3 reviewer, non-author)

## Round 5 result (scoped re-review, 2026-11-13) — LAND

- All r3 findings closed as ruled; range-diff clean; one pointer bump 92be5319 on a1d359f3.
  jest 11692/2 clean; shots 592/0 FAIL/163/978/39/234/147 (PNGs byte-identical to r3); freeze
  280/280; parity 0/0/24; lifecycle part 6 4/4. INFO R5-I1 = SC-623 (filed); R5-I2/I3 DROP (cosmetic).
- LAND-READY reported to dispatcher.
