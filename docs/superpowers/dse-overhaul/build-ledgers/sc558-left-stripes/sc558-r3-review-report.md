# SC-558 r3: independent adversarial review of the r2 stripe removal

## Executive summary

- **Verdict: APPROVE.** No CRITICAL or HIGH findings. **1 MEDIUM** (needs an owner ruling: Scott's "title ink follows the stage" makes one error-card title 2.73:1 in light mode), **5 LOW** (a gap in the guard tests, plus doc/comment drift), **3 INFO**.
- Every ruling is implemented as worded (error card C with the `@supports` gate, advancement C screen-only, tier A incl. `button.dse-pr__row` and the montage `--head` row, spine A screen + print with the crest still tinted, dead role rule gone, the print quote edge removed for plugin quotes only).
- Stripe probe: 532 pages (every element × fixture + PREF/NARROW/INTERACTION shots) × steel-dark / steel-light / print twin / realprint. **No hued left stripe survives.** The only edges left are the expected ones (sticky-chars 1px divider, `.dse-chrome` hairline, the stamina cluster's all-round state border, neutral connectors).
- The 3px shift is an alignment **gain**, not a regression: tier badges now sit exactly under the "Power Roll" heading text (0.0px, was 3.0px), framed cards are symmetric (13.6/13.6px, was 16.6/13.6px), and the kit's signature ability now sits on the kit's section column.
- Freeze: moved set = **exactly r2's 39 ids / 78 lines**. All 78 `rebaseline.txt` hashes equal my own PNGs, and all 78 are baseline names whose old hash differs. With the substitution: 280/280.
- Gates (dse `eb8b7949`): tsc+lint rc 0 · jest 6497 passed / 1 skipped / 257 of 258 (union: a full run at load 20-53 had 18 timeout reds; those 8 suites run alone: 374/374) · lifecycle 21/21, 16/16, 9/9, 4/4, part 5 as-is **G-S49 ok, G-S59 FAIL** (also FAIL on a clean `6270e84a`, so it is pre-existing on this host); with SC-561's `obsidian-lifecycle.mjs` **2/2 ok** (so 52/52) · e2e 128/128, 89/89 · shots 592, 0 FAIL, host-leak 163/978, clip 147 · parity 0/0/24.
- Worktree and superproject `git status` (incl. ignored) identical before and after. Freeze baseline sha unchanged. No worktree edits, no commits.

## 1. Rulings: implemented exactly?

| Ruling | Verified by | Result |
|---|---|---|
| Error card **C**: 1px all round, stage hue mixed 60% toward the hairline, title ink follows the stage, `@supports` fallback | CSS read (`styles-source.css:406-433, 467-474`); computed style in the harness's real Obsidian cascade (`ec.mjs`) | 1/1/1/1px on all three stages. Frame = `color-mix(... 60% ...)` inside the gate, with a static hairline twin before it and a second twin inside the gate. The title takes `--dse-ec` (orange for schema/parse, blue for reference, red for render). `data-dse-error-stage` is untouched. **See MEDIUM-1 for contrast.** |
| Advancement **C**, screen only | `geom.mjs` computed boxes | Screen: 1px all round, `rgba(0,0,0,.18)` sunken fill, radius, `overflow:hidden`, head band flush. Print twin and realprint: border 0/0, padding-left 0, options at 0 (no rail, no indent). |
| Tier **A** (wash + badge kept; includes `button.dse-pr__row` and the montage `--head` row) | probe + `geom.mjs` | `div` and `button` rows: border-left 0 or 1px neutral (a button keeps its all-round 1px transparent or `--dse-border` frame). Montage head row and data rows are both 0px, so the head cell and the data cells stay aligned (both 11.2px). The 90° wash is still on every tier row and montage row (dark and light). |
| Spine **A**, screen + print; crest still tinted | probe; `crest.mjs` | No `::before` bar on any `.dse-feature`, in any combo. Crest glyph colours are identical to base (dark: main rgb(231,76,60), maneuver (93,173,226), triggered (76,175,106), trait (187,143,206), villain (224,88,75); light likewise). In print the crest is `display:none` on base and HEAD alike. |
| Dead `.dse-sb[data-dse-role]` deleted | grep + mutation | Gone. Re-adding it turns 3 tests red. |
| Obsidian's violet print quote edge removed **for plugin quotes only** | `bq.mjs`: a host `<blockquote>` placed as a sibling of the plugin root | class and perk, in print twin and realprint: plugin quote `0px none` (base: `2px solid rgb(152,115,247)`). The host quote keeps `2px solid` violet in all 4 combos. Screen quotes are unchanged. |

## 2. Stripe probe (no left stripe survives)

`probe.mjs` (r1's method; adds the realprint combo and the narrow and interaction shots) ran on a scratch copy of HEAD: **532 pages**. 14 errors, all in print/realprint interaction shots whose click target is hidden in print. Their screen combos ran. Aggregate: `…/scratchpad/sc558-r3-review-r3a/probe-head-agg.txt` (raw: `probe-head.json`).

Survivors, all expected:
- `span.dse-sb__sticky-chars`: 1px neutral (Scott: keep).
- `div.dse-chrome`: 1px neutral.
- `div.dse-stamina__cluster` / `.dse-stamina-rec` (winded, dying): a 1px state hue, but the border runs **all round** (bottom opened), excluded in r1.
- Negotiation `dse-track__slot::before` 2px and the initiative `::after` 1px: neutral connectors.
- Stamina gauge internals.
- `button.dse-pr__row[data-tier=mid]` 1px neutral on `negotiation-pr-checked`: the checked row's own all-round `--dse-border`. Before this ticket that row had a 3px tier stripe.
- 90° gradients: tier washes, montage rows, `.dse-hr__line`, and the flat-mode separator layers on `.dse-feature` (only on `*-featstyle-flat`).

No blockquote edge appears anywhere in print/realprint. The montage hero column rule is still there (inset −1px, not flagged).

## 3. Nothing else moved (alignment, follow-up 3)

`geom.mjs` measures base `6270e84a` against HEAD on feature, feature-spend, kit, statblock, statblock-villain-corpus, featureblock (default, advancement, stats), negotiation and roll, × dark/light/print/realprint (`geomdiff.txt`).

- **Tier rows:** the badge's offset from the panel-head text went from 3.0px to **0.0px** (div rows) and from 3.0 to 1.0px (button rows: 1px transparent border). Right edges are unchanged.
- **Framed cards** (statblock, featureblock, the SC-168 standalone nested arm): padding L/R went from 16.6/13.6px to **13.6/13.6px**. The crest, head, meta and power roll all start at 13.6px.
- **Kit signature ability:** padding went from 11.8/0 to **0/0**. The card now starts on the same column as the kit's "SIGNATURE ABILITY" label, bonus grid and equipment box (`sc558-r3-align-kit-dark.png`). In print the content sits flush with the page column on both sides (it was 11.8px left / 0 right).
- **Top-level standalone card:** unchanged. **Flat mode** (sb, fb): no spine arm was ever drawn there, and the diff pixels are only the removed nested-card bar. **Narrow 360px:** fine (`sc558-r3-align-fbadv-narrow.png`).
- **Advancement well:** see INFO-1.
- **Error card in LP/reading/callouts:** `.dse-error-card` is unthemed base CSS. No SC-520 callout rule touches it (no `error-card` selector outside the error block), and the frame is (0,1,0) in both arms.
- **Print quote:** the change does not leak (§1). The print quote keeps Obsidian's 24px inset (owner dropped this).

No mis-alignment was introduced. Recommendation: **drop follow-up 3.**

## 4. Colourblind check (greyscale)

Crops in `sc558-r3-crops/`:
- `sc558-r3-grey-action-types-{dark,light}.png`: sword / person / zap / star / skull glyph silhouettes. Main and villain differ by glyph and by the "Villain action 1" chip.
- `sc558-r3-grey-tiers.png`: power roll and montage. Badge text (≤11 / 12-16 / 17+ / crit) plus notch silhouettes.
- `sc558-r3-grey-error-card.png`: the stage word in parentheses. The light schema title visibly washes out (MEDIUM-1).
- `sc558-r3-grey-advancement.png`: the grouping reads from the frame and head band.

Everything stays distinguishable without hue.

## 5. Freeze

My shots run on HEAD: `FREEZE VIOLATED (78 checksum mismatches, 0 missing)`. The moved names are byte-for-byte r2's list: 35 spine ids + `class`, `perk`, `perk-headings`, `perk-narrow`, each in print and realprint.
- `sha256sum -c rebaseline.txt` against my PNGs passes, so all 78 "after" hashes match.
- All 78 names exist in the live baseline (`6a183b76…`, untouched), and all 78 baseline ("before") hashes differ from the after hashes.
- The live baseline with those 78 lines substituted gives **280/280 OK**.
- No other frozen id moved.

## 6. Tests: are the guards meaningful? (mutation probe)

I ran 12 CSS mutations on a scratch copy and re-ran the 6 SC-558-touched suites (280 tests). Summary: `mut-summary.txt`.

| Mutation | Red? |
|---|---|
| Re-add `.dse-feature[data-dse-act]::before` bar | 3 red |
| `.dse-pr__row { border-left: 3px solid var(--t) }` | 2 red |
| Montage row `border-left` | 2 red |
| Error card `border-left: 3px` | 2 red |
| Advancement rail + indent in the base rule | 2 red |
| Dead statblock role rule back | 3 red |
| Error card `color-mix` ungated | 3 red |
| Print-twin quote rule deleted | 1 red |
| Print quote rule unscoped (`blockquote {…}`) | 1 red |
| `.dse-pr__row { border-inline-start: 3px solid var(--t) }` | **0 red** |
| `.dse-pr__row { box-shadow: inset 3px 0 0 var(--t) }` | **0 red** |
| `.dse-feature[data-dse-act] { box-shadow: inset 3px 0 0 var(--dse-act) }` | **0 red** |

See LOW-1. The lightContrast crit entry was **retargeted, not deleted**: same token, ground `#edf0f0`, threshold 3.0, measured 7.57. The surface now names `.dse-pr__badge--crit::before`, which exists (`styles-source.css:15338`) and is filled with `--dse-tier-crit`.

## 7. Findings

### MEDIUM-1: error-card title ink drops below 3:1 for parse/schema in light mode

- **Where:** `styles-source.css:430-431` (`.dse-error-card-title { color: var(--dse-ec) }`) with `:467-469` (`--dse-ec: var(--color-orange)`).
- **Measured** (harness, real Obsidian app.css, title 16px / 600 on `--background-secondary`):

  | Stage | Light (base → HEAD) | Dark (base → HEAD) |
  |---|---|---|
  | schema / parse (orange) | 3.89 → **2.73:1** | 4.27 → 6.29:1 |
  | reference (blue) | 3.89 → 4.58:1 | 4.27 → **3.67:1** |
  | render (red) | 3.89 (unchanged) | 4.27 (unchanged) |

- **Failure:** in a light vault, a schema error (the most common author mistake) shows its title in `#ec7500` on `#f6f6f6`. That is below WCAG's 3:1 even for large text, and the title is not large (16px / 600). Scott is colourblind, and the greyscale crop shows the title fading.
- **Status:** this is the literal consequence of Scott's pick ("title ink follows the stage"), not an implementation slip, so it is an owner call.
- **Fix options:**
  - (a) Mix the ink toward the text colour, gated: `color: var(--dse-ec)` static twin, then inside the same `@supports` block `color: color-mix(in srgb, var(--dse-ec) 65%, var(--text-normal))`. By arithmetic that gives about 4.8:1 for light orange, still reads orange, and raises dark contrast too. cssSupportFloor inventory 11 → 12. 0 frozen bytes, because the error card is in no shot.
  - (b) Keep the hue on the frame only and ink the title with `--text-normal`. That reverses part of Scott's C, so it needs Scott.
  - (c) Accept it, as an author-facing notice whose stage is said in words.

### LOW-1: the catch-all stripe guard only knows the `border-left` spelling

- **Where:** `test/dom/theme/steelMaterial.test.ts:1302-1308`. The regex is `border-left(?:-color)?\s*:[^;]*var\(--(t|dse-role…|dse-act…|dse-tier…|text-error|color-…)`.
- **Failure:** a future rule `border-inline-start: 3px solid var(--t)` or `box-shadow: inset 3px 0 0 var(--dse-act)` brings a coloured left stripe back, and all 280 tests stay green (measured, 3 mutations).
- **Fix:** widen the property set to `(?:border-(?:left|inline-start)(?:-color)?|box-shadow)`, and for `box-shadow` require `inset\s+[1-9]`. Keep the hue-token list.

### LOW-2: the dse plugin CHANGELOG still promises the spine in the 7.0.0 release

- **Where:** `draw-steel-elements/CHANGELOG.md:565`. In the SC-168 bullet under `## 7.0.0 (unreleased)`: "...its own rounded plate, proper insets, and the action-type spine as the card's left edge."
- **Failure:** 7.0.0 now ships without that spine (Scott: SC-558 is "in the DSE 7.0.0 release"), so the release notes describe a bar users will not see. SC-558 also adds no 7.0.0 bullet of its own: only the workspace CHANGELOG has one.
- **Fix:** drop "and the action-type spine as the card's left edge" from :565, and add a `7.0.0` bullet that mirrors the workspace one.

### LOW-3: stale source comments describe the removed visuals

- **Where:**
  - `src/elements/feature/renderFeature.ts:10` ("← the action-type spine root").
  - `src/elements/feature/renderFeature.ts:587` ("The action-type spine (Steel-only accent; see the file header).").
  - `src/elements/statblock/view.ts:346` ("Role spine + header tint", where the role spine was the deleted dead rule).
- **Fix:** reword to "action-type attribute + `--dse-act` alias (crest tint)" and "role tint + header band". (The "spine vocabulary" naming of `actionTypeOf` elsewhere is harmless and can stay.)

### LOW-4: the print act-token comment claims a consumer that is not there in print

- **Where:** `styles-source.css:15798`: "act hues darken (the crest glyph tints from them)".
- **Problem:** the crest glyph tint rule is screen-only (`:8725`, `:not([data-dse-print="on"])`), and the crest is `display:none` in print (measured). With the spine gone, the only print consumer of the darkened act tokens is `--dse-act-villain`, through `.dse-sb__band--villain .dse-sb__band-crest` (`:3432`).
- **Fix:** reword it to say that in print only act-villain is consumed (the villain band crest), and that the rest are kept for parity with the screen tokens. Deleting the dead tokens would move no bytes, but it is out of scope.

### LOW-5: architecture.md cites a freeze pin that this ticket moved

- **Where:** `draw-steel-elements/.repo-docs/architecture.md:275`, kit row: "pinned by `kit--steel-print.png` staying in the freeze OK set".
- **Problem:** `kit--steel-print.png` / `-realprint` moved in SC-558 (spine removal), so the proof as written no longer holds.
- **Fix:** "verified structurally (the frame rules never match `.dse-card`); `kit--steel-print.png` moved only for the SC-558 spine removal".

### INFO-1: inside the advancement well, the head text and the options do not share a column

The "Level N Advancement" text is at 19px from the well edge. Option content starts at 25px in card mode (11.4 margin + 13.6 padding) and at 11.4px in flat mode. Base was 32 vs 30.6. This is the geometry of r1 candidate C, which Scott picked from crops (`sc558-r3-align-fbadv-flat-dark.png`). No action unless the owner wants the options' `.65rem` margin matched to the head's inset.

### INFO-2: G-S59 classification

- **Branch as-is:** FAIL ((a) write 1: `timedOut:true`; write 2: scrollTop 2779→2001, redraw 21.3 s after the write). Start load 13.9.
- **Clean `6270e84a` archive:** FAIL, same family (redraw 21.9-23.4 s, scrollTop 2779→2001). Start load 5.6.
- **Branch + SC-561 `obsidian-lifecycle.mjs` (`d344e1e1`):** G-S59 ok (redraws 4.2-6.9 s, waits 6.4-9.4 s), G-S49 ok, 2/2. Start load 3.8.
- **Conclusion:** pre-existing and harness-only. A CSS-only branch cannot affect it, and I found nothing suggesting otherwise.
- **Note:** the sc561 dse branch has moved on to `6153acfe` (+1 commit, 3 lines in `obsidian-lifecycle.mjs`). I used `d344e1e1` as briefed.

### INFO-3: jest load reds

A full run (load 20 → 53) had 18 reds in 8 suites:
- `formModalStalePreview`, `initiative-default-keys`, `initiative-sc417-minion-squad`, `stamina-bar`, `chromeFocusHandoff`, `twin-reuse`, `settings-tab`, `fixtures`.
- 34× `Exceeded timeout of 5000 ms`, plus 2 knock-on `toBe` asserts in `chromeFocusHandoff`.

All 8 suites run alone at the default timeout (load 10): 374/374.

## 8. Gate lines (dse `eb8b7949`, superproject `e8a55ef3`; base `6270e84a`)

| Gate | Result |
|---|---|
| tsc | `npm run tsc` rc 0 (incl. `-p e2e`) |
| lint | `npm run lint` rc 0 |
| jest | full: `Tests: 18 failed, 1 skipped, 6479 passed, 6498 total` / `Suites: 8 failed, 1 skipped, 249 passed, 257 of 258` (all timeout-shaped, load 20-53). The 8 suites alone: 8/8, 374/374. **Union 6497 passed / 1 skipped / 257 of 258** (CURRENT 6492 + r2's 5) |
| lifecycle | `done: 21/21 ok` · `16/16 ok` · `9/9 ok` · `4/4 ok` · part 5 as-is `1/2 ok, 1 failed` (G-S59), clean base `1/2 ok, 1 failed` (G-S59), branch + SC-561 harness `2/2 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` (pointer parked, no WARN) |
| shots | rc 0, 592 PNGs, 0 FAIL, `button host-leak OK (163 … 978 …)`, modal 228, `capture clip OK (147 … 41 print …)`, `print-twin delta OK (144 capture ids … max vertical drift 2.00px)`, montage board scroll OK |
| freeze | `FREEZE VIOLATED (78 checksum mismatches, 0 missing)` = r2's 39 ids exactly; with `rebaseline.txt` substituted, 280/280 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 |

## 9. Artifacts

- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r3-review-report.md`
- Crops: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r3-crops/`
  - `sc558-r3-grey-action-types-dark.png`, `sc558-r3-grey-action-types-light.png`, `sc558-r3-grey-tiers.png`, `sc558-r3-grey-error-card.png`, `sc558-r3-grey-advancement.png`
  - `sc558-r3-align-kit-dark.png`, `sc558-r3-align-fbadv-flat-dark.png`, `sc558-r3-align-fbadv-narrow.png`
- Scratch (logs, probes, scripts, copies): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r3-review-r3a/`
  - logs: `tsc.log`, `lint.log`, `jest1.log`, `jest-reds.log`, `lc1..5.log`, `lc5-sc561.log`, `lc5-base.log`, `e2e.log`, `shots1.log`, `freeze1.log`, `parity.log`
  - probes: `probe-head.json` / `probe-head-agg.txt`, `geom-{base,head}.json` / `geomdiff.txt`, `bq.out`, `crest.out`, `mut-summary.txt`
  - copies: `copy/` (HEAD + SC-561 harness), `base/` (`6270e84a`), `mut/`
- Kept lifecycle FAIL dirs (from the harness, not removed): `/tmp/dse-obsidian-lifecycle-jdoNLh` (branch), `/tmp/dse-obsidian-lifecycle-m76gPu` (clean base).

---

## r5: scoped re-review of the r4 fix round (dse `10db67e3` on `2ee2e405`; superproject `8cf38a7f` on `fc48a0a1`)

### r5 summary

- **Verdict: APPROVE.** All six r3 findings are fixed as prescribed. New: **1 LOW** (bookkeeping only) and **2 INFO**, none blocking.
- **MEDIUM-1 fixed.** I re-measured the title contrasts:
  - dark: 7.47 / 5.15 / 5.45
  - light: **4.85** / 7.12 / 6.52 (schema / reference / render)
  - These equal the implementer's table, and every title still reads orange, blue or red.
  - The static `color: var(--dse-ec)` sits outside the gate (`styles-source.css:420-421`). The gated `color-mix(… 65%, var(--text-normal))` is at `:436-439`.
- **LOW-1 fixed.** The widened guard turns red on `border-inline-start`, `border-inline-start-color` and inset `box-shadow`, on both tier rows and feature cards, and also when the colour is wrapped in `color-mix()`. It flags no legitimate rule and needs no exemption list. Two rarer spellings still slip through (INFO-r5-1).
- **Jest: SC-558 adds exactly +5 tests,** all in `steelMaterial.test.ts` (80 → 85). The r4 guard controls are assertions inside one existing `it`, so they add 0 tests. The "+7" comes from the base figure: CURRENT's 6584 for `2ee2e405` is 2 short (LOW-r5-1).
- **Freeze:** the same 39 ids / 78 lines. All 78 after-hashes equal `rebaseline.txt`, and the substituted baseline reads 280/280.
- **Rebase:**
  - `range-diff` shows `=` for both SC-558 commits, in dse and in the superproject.
  - Upstream `6270e84a..2ee2e405` brings only SC-561's `obsidian-lifecycle.mjs` (byte-identical to sc561 `6153acfe`) and SC-435's tests, e2e files and `data-dse-control` ids in `MinionStaminaPoolModal.ts`.
  - It does not touch `styles-source.css`.
- **Gates:** tsc and lint rc 0 · shots 592, 0 FAIL, 163/978, clip 147 · freeze as above · parity 0/0/24. Worktree `git status` (incl. ignored files) is identical before and after.

### r5 checks

1. **r4 diff** (`31209e4e..10db67e3`, the r3 commits after the rebase; 7 files): CSS changes are the title gate and a comment. The rest is tests, the dse CHANGELOG, architecture.md, and comments in `renderFeature.ts` and `statblock/view.ts`. Nothing beyond colour, comments, tests and docs, so I did not re-run lifecycle 1-4 or e2e.
   - LOW-2: the SC-168 bullet no longer mentions the spine, and a new SC-558 `[FIX]` bullet heads the 7.0.0 list.
   - LOW-3: `renderFeature.ts:10,23-25,587` and `statblock/view.ts:346` are reworded.
   - LOW-4: `styles-source.css:15804-15807` now says only act-villain is consumed in print.
   - LOW-5: the architecture.md kit row is reworded.
   - cssSupportFloor inventory goes 11 → 12 (`color: 1`).
   - The superproject CHANGELOG bullet notes the title tone.
2. **MEDIUM-1:** measured with `ec.mjs` in the harness's real Obsidian cascade on a scratch copy of `10db67e3`. The colour parser now reads `color(srgb …)` correctly. Crop: `sc558-r3-crops/sc558-r5-error-card-title.png` (colour | greyscale).
3. **LOW-1 mutation probe** (`steelMaterial.test.ts`, 85 tests; the unmutated sheet is 85/85):

   | Mutation | Red? |
   |---|---|
   | `.dse-pr__row { border-inline-start: 3px solid var(--t) }` | 1 red |
   | `.dse-pr__row { border-inline-start-color: var(--t) }` | 1 red |
   | `.dse-pr__row { box-shadow: inset 3px 0 0 var(--t) }` | 1 red |
   | `.dse-feature[data-dse-act] { box-shadow: inset 3px 0 0 var(--dse-act) }` | 1 red |
   | `.dse-feature[data-dse-act] { border-inline-start: 3px solid var(--dse-act) }` | 1 red |
   | `.dse-pr__row { box-shadow: inset 3px 0 0 color-mix(in srgb, var(--t) 60%, transparent) }` | 2 red |
   | `.dse-pr__row { border-left: 3px solid color-mix(…var(--t)…) }` | 3 red |
   | `.dse-pr__row { box-shadow: 3px 0 0 var(--t) inset }` (keyword last) | **0 red** |
   | `.dse-pr__row { box-shadow: inset .2rem 0 0 var(--t) }` | **0 red** |

4. **Jest counts:** full `--json` runs on scratch copies of base `2ee2e405` and head `10db67e3`, same machine, same conditions.
   - Base: 6587 total (6582 passed, 2 SC-568 timeouts, 3 skipped).
   - Head: 6592 total (6587 passed, 2 timeouts, 3 skipped).
   - The two runs differ in exactly one file: `steelMaterial.test.ts` 80 → 85.
   - In the scratch copies 2 of the 3 skips are `token-coverage`'s workspace-map describe, which skips when the workspace doc is not beside the repo. In the worktree it runs, so worktree numbers are base **6586** / head **6591** passed, 1 skipped.
   - The implementer's head figure (6591/1) is right. The base 6584 is 2 short.
   - The 2 timeout suites (`twin-reuse`, `initiative-default-keys`) fail the same way on base and head, and pass alone on head (71/71).
5. **Freeze:** `FREEZE VIOLATED (78 checksum mismatches, 0 missing)`. The moved names equal the `rebaseline.txt` names. `sha256sum -c rebaseline.txt` passes against my PNGs. The live baseline with those 78 lines substituted reads 280/280. Baseline sha `6a183b76…` and `rebaseline.txt` sha `ccece37e…` are untouched.
6. **Rebase:** see the summary. No conflict in `styles-source.css`: the SC-558 patches are byte-identical to r3's.

### r5 findings

- **LOW-r5-1 (bookkeeping): the "+7" is not "5 + 2 guard controls".**
  - Where: the r4 report (`sc558-r2-impl-report.md`, r4 summary) and the decisions.md r4 DONE line credit the extra 2 to the r4 guard controls.
  - What I measured: SC-558 adds +5 tests. `2ee2e405` itself has 6586 runnable tests (1 skipped), not 6584.
  - Fix: record base 6586/1, head 6591/1, delta +5. Have the dispatcher correct the dse-verify CURRENT `2ee2e405` jest figure (6584 → 6586) when it next updates the skill. Not a code change.
- **INFO-r5-1:** the guard's shadow pattern needs `inset` immediately before an offset that starts with 1-9. It misses the keyword-last form (`3px 0 0 var(--t) inset`) and fractional offsets (`inset .2rem …`, `inset 0.2rem …`). This is exactly the shape I prescribed in r3, so it is not an implementer slip.
  - Optional tightening: match any `box-shadow` declaration that has `\binset\b` and a hue `var()`. Then drop the `inset 0 0 0 <spread>` all-round rings, and pin the two forms above as extra can-fail controls.
- **INFO-r5-2:** a Chromium 106 floor engine keeps the raw stage hue on the title (the static twin), so the light schema title is still 2.73:1 there. This is by design under the support-floor rule, and modern Obsidian takes the gated mix. No action.

### r5 gate lines (worktree, dse `10db67e3`)

| Gate | Result |
|---|---|
| tsc / lint | rc 0 / rc 0 |
| jest | scratch copies, full run: head `Tests: 2 failed, 3 skipped, 6587 passed, 6592 total`, base `2 failed, 3 skipped, 6582 passed, 6587 total`. The 2 fails are load timeouts, identical on base, and pass alone 71/71. Worktree equivalent: head 6591 / 1 skipped |
| shots | rc 0, 592 PNGs, 0 FAIL, `button host-leak OK (163 … 978 …)`, `capture clip OK (147 …)`, print-twin delta OK (144 ids, max drift 2.00px), montage board scroll OK |
| freeze | `FREEZE VIOLATED (78 checksum mismatches, 0 missing)` = the sanctioned 39 ids; 280/280 with `rebaseline.txt` substituted |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 |
| lifecycle 1-4, e2e | not re-run (the r4 delta is colour, comments, tests and docs only) |

### r5 artifacts

- Crop: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc558-left-stripes/sc558-r3-crops/sc558-r5-error-card-title.png`
- Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r5-review-r3a/`
  - logs: `tsc.log`, `lint.log`, `shots1.log`, `freeze1.log`, `parity.log`
  - error card: `ec.out`, `ec-head-{dark,light}.png`
  - mutations: `mut-summary.txt`, `mut-*.log`
  - jest: `j8-{base,head}.json` (the 8 SC-558 test files), `jfull-{base,head}.json` / `.log`, `j2-head.log`
  - `rangediff.txt`
  - scratch copies: `head/`, `base/`, `mut/`
