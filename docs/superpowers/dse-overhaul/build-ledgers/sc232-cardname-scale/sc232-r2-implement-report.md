# SC-232 round 2 — implement report

## Executive summary

- Head: dse `690582f5dfcfc6d203ef32be251f8ebd40311f07` on branch `sc232-cardname-scale` (base `619c4bd`, `origin/develop` unchanged).
- Implemented Option A: per-family Steel card-head NAME sizes — generic **27px/28.08** line-box, ability card **33.3/33.3**, statblock **41.4/39.33**, featureblock **37.8/37.04** — all measured via `npm run parity`'s new pairs, 0 GAPs on font-size/line-height, exact site match.
- Narrow guard (statblock only, mirroring the site's own 34em step-down): `statblock-sticky-narrow`'s name goes **5 → 7 lines** (raw Option A would be 8; the container-query guard saves one line). **Mid-word breaks occur in BOTH before and after** — pre-existing at base (`Huma/n/Bandi/t/Chief`), not introduced by this branch (`Hu/ma/n/Ban/dit/Chi/ef`); root cause is the crest+right-rail crowding the ~73–90px name column at 300px, which SC-284 (unlanded) is designed to fix.
- Side-effect check: 298 computed font-size/line-height diffs across all Steel-dark captures, base vs. after — **all 298 are `.dse-head__primary--left` nodes; 0 non-name nodes moved.**
- Gates at head: tsc clean; lint clean exit 0; jest **4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots**; `obsidian-lifecycle` **19/19 ok, 0 failed**; `npm run shots` **524, 0 FAIL**; `check-freeze.sh` **`freeze OK (260/260 …)`**; `npm run parity` **0 GAPs / 0 undeclared WARNs / 24 DECLARED / exit 0**.
- Found (not introduced by this ticket, deferred): a real `ink` divergence on the name node, invisible before this ticket added a pair that can see it — declared under SC-367 pending the owner's call on whether to fold it in or split it into its own ticket.

## Step 1 — the rule

`styles-source.css`, one new `SC-232` rule group inserted after the existing embossed-headings block (was `:7224`, verified against `dom-chain.mjs`):

| Family | Selector | font-size | line-height | letter-spacing | Result px |
|---|---|---|---|---|---|
| generic | `.dse-head__primary--left` | `calc(var(--dse-fs-heading) * 1.35)` | 1.04 | 0 | 27 / 28.08 |
| ability card | `[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-head__primary--left` | `* 1.665` | 1 | 0 | 33.3 / 33.3 |
| statblock | `.dse-sb > .dse-head > .dse-head__primary--left` | `* 2.07` | .95 | 0 | 41.4 / 39.33 |
| featureblock | `.dse-fb > .dse-head > .dse-head__primary--left` | `* 1.89` | .98 | 0 | 37.8 / 37.04 |

All four selectors verified against the live DOM (`dom-chain.mjs`, re-run against this tree): every nested sub-feature head (inside a statblock, featureblock, or the standalone Feature element) correctly falls through to the generic 27px rule — the family-specific selectors all require a **direct-child** chain from the card root, which a nested `.dse-feature__nested > .dse-feature > .dse-head` never satisfies. No selector fix was needed; the survey's selectors were exactly right.

Did not touch `:13636-13643` (unscoped base rule), `--dse-fs-heading` (`:6279`), or SC-284's cardHead hunks (`~13588`, `~13671`) — confirmed absent from this tree (SC-284 unlanded).

**Narrow-width guard** (owner ruling): added `container-type: inline-size; container-name: sc232-sb-head;` on `.dse-sb` (own name, not `dse-head`, to avoid colliding with SC-284's still-unlanded container) and `@container sc232-sb-head (max-width: 34rem)` stepping the statblock name down to the ability-card multiplier (`* 1.665`) — mirroring the site's own `.sb__head .sc-head__left-primary { font-size: calc(1.85rem * var(--md-large-header-scale)) }` rule at `≤34em` (`steel-statblock.css:625-628`), and reusing `34rem` as the literal threshold, the same value the sibling `dse-sb-sticky` container already uses for its own step 1 (`~:10224`). The site's matching featureblock/ability narrow rules (`.fb__name`, `.sc-ability__name`) are **dead code** — both target a pre-cardhead class that matches 0 live nodes on the site today — so only statblock gets a mirror; this matches the live site's actual (not intended) narrow behavior.

**Narrow line counts, measured (`plugin-measure.mjs`, Steel dark, base vs. after)**:

| Capture | Name text | Before | After | Note |
|---|---|---|---|---|
| `statblock-sticky-narrow` | Human Bandit Chief | 5 lines | **7 lines** | raw Option A (no guard) measured 8 in the survey; the guard saves 1 line |
| `encounter-narrow` | Ambush at the ford | 4 lines | **5 lines** | generic family |
| `montage-narrow` | Cross the Ashfall Wastes | 3 lines | **4 lines** | generic family |
| `perk-narrow` | Familiar | 1 line | 1 line | unchanged |

**Word breaks, verified with a per-character `Range` probe (not assumed from line count):**
- Base (today): `"Human Bandit Chief"` wraps `Huma / n / Bandi / t / Chief` — **already** mid-word ("Human"→"Huma"+"n", "Bandit"→"Bandi"+"t").
- After (this branch): wraps `Hu / ma / n / Ban / dit / Chi / ef` — **still** mid-word, in more chunks (bigger font, same ~73–90px name-column width once the crest + right-rail take their share at 300px).
- This is a **pre-existing** defect (base already breaks mid-word), not a new failure mode this branch introduces — but the line count did grow (5→7), so the *degree* is worse. No ancestor sets `word-break`/`overflow-wrap` on `.dse-head__primary--left`; the break comes from Obsidian's own pinned host sheet (`sheet=1`), confirmed by reproducing the SAME wrap shape with the harness's real-Obsidian-cascade flag on and its absence with it off.
- A separate, pre-existing (unchanged before/after) oddity found while investigating: 4 of the 9 name nodes in this capture (`Whip and Magic Longsword`, `Shoot!`, `Form Up!`, `Lead From the Front`) report `getBoundingClientRect().width === 0` with grossly inflated line counts (21/6/7/16) — a degenerate grid-column-collapse, identical before and after this branch, so not caused by SC-232. Filed as a follow-up below.

## Step 2 — whole-card side-effect check

Method: a broad Playwright probe walked every element under `#mount` for all 131 capture/combos (Steel dark only), recording each text-bearing node's `sig` (DOM chain), `fontSize`, `lineHeight`. Ran once against the base tree (`619c4bd`'s `styles-source.css`, temporarily checked out), once against this branch's final `styles-source.css`, byte-diffed.

**Result: 298 diffs total, all 298 on `.dse-head__primary--left` nodes. 0 non-name nodes moved.** This confirms the ratio comments' claim in reverse: the card-head mini (`~:7827`, `0.9×`) and fb option mini (`~:8033`, `1.08×`) both stayed at their pre-SC-232 pixel values (18px / 21.6px) because they read `--dse-fs-heading` directly, not the now-family-scaled rendered name — exactly what the updated comments (Step 3) now say.

## Step 3 — comments

Folded two comment blocks (values unchanged, `git diff` on this commit touches only `/* … */` text):
- `~:7827`'s card-head `--mini` derivation (was "the plugin's name slot is 1.25em… ratio is 1.125em") — now states the mini is pinned to the TOKEN, not to whichever family's rendered name now sits beside it, and that "0.9× the name" only still holds literally for the generic family.
- `~:8033`'s fb option `--mini` derivation — same TOKEN-not-name correction, plus fixed the stale `.fb__feat-name` site-selector reference (0 live nodes; the site's real sub-feature name is `.sc-head__left-primary`, the same generic node SC-232 measured) without re-deriving the mini's own current site figures (deferred to SC-367).

## Step 4 — parity pairs

Added `name-generic` / `name-ability` / `name-statblock` / `name-featureblock` to `selector-map.json`, mapping each family's live site name node to the exact plugin selector the new CSS rule targets. `font-size` and `line-height` pass with **0 GAPs, both schemes, all four pairs** — the CSS lands the site's own computed px exactly. Mapping the node also surfaced a real, pre-existing `ink` (color) divergence — never part of SC-232's rule table — declared (8 new scheme-scoped rows) under **SC-367** (the sibling crest/eyebrow/right-rail-sizes follow-up already filed for this same "plugin paints one accent everywhere" pattern). Regenerating the parity site baseline (required by the tool's own documented procedure to add new selectors, `visual-harness/parity/README.md`) also picked up ~7 weeks of unrelated live-site drift (font-family/weight literal changes on already-mapped nodes) — verified legitimate before committing (same 28 page/scheme keys, no entry went empty, spot-checked diffs are real font updates); it produced 0 new GAPs/WARNs on any pre-existing pair.

New check counts: `npm run parity` → **0 GAPs / 0 undeclared WARNs / 24 DECLARED / exit 0** (was 16 DECLARED; +8 new, all `ink`, all scheme-scoped, all citing SC-367).

## Step 5 — gates (measured at head `690582f`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (main.js/styles.css removed first) | **4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots** — unchanged from the documented base; no new tests added, 2 existing tests adjusted (see "Drive-by fixes") |
| `DSE_LIFECYCLE_PORT=9288 npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 |
| `npm run shots` | **524, 0 FAIL** |
| `check-freeze.sh .../visual-harness/shots` | **`freeze OK (260/260 frozen print PNGs byte-identical …)`**, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 24 DECLARED / exit 0** |

`obsidian-shots` skipped per the brief (shared display).

## Step 6 — evidence

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r2-evidence/sc232-compare-wide.png` — 1940×833. Rows: ability card, statblock, featureblock, kit (generic). Columns: Today (20px) | Option A (this branch) | Option B (shared 27px, `probe-B.css`) | Site. Steel dark; harness captures at the 900-wide viewport, site at 1440-wide (both cropped tight to the head, same convention as the round-1 survey's `crops.mjs`). All labels are text, never color-only.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r2-evidence/sc232-compare-narrow.png` — 722×1229. `statblock-sticky-narrow`, `encounter-narrow`, `montage-narrow` at 300px, Today vs. Option A, each row's line-count delta stated in its own label.

## Drive-by fixes

Two fixes were required to land this change with every gate green — both are direct, mechanical consequences of the CSS change itself (not independent pre-existing bugs found by chance), listed here per the report format:

1. **`test/dom/theme/steelTypography.test.ts`** — the new ability-card NAME rule's selector contains `CARD_HOST` (`[data-dse-element='feature']`) verbatim as a substring (a nested descendant chain, not a plate root), so the existing "Task 2 body-rhythm line-height ≥ 1.6" test's substring-based matcher swept it in as if it were a body-copy rule and failed on its `line-height: 1`. Narrowed the matcher to exclude any selector routing through `.dse-head` — the same collision class one test above it already handles (via a font-family filter) for the identical reason.
2. **`visual-harness/entry.ts` + `shoot.mjs`** — `statblock-sticky-narrow`'s sticky-reveal capture scrolls to a fixed `scrollTo: 320`, tuned for the pre-SC-232 head height; the bigger screen-only name pushed the band past that distance, so the sticky bar never reached `--stuck` (`npm run shots` FAIL). Growing `scrollTo` uniformly would have scrolled the **print** twin further too, moving frozen bytes that never see the screen-only name rule — a scoping leak, not legitimate. Added `scrollToPrint` (defaults to `scrollTo` for every other entry, zero behavior change elsewhere) so screen and print/realprint can scroll different distances; `statblock-sticky-narrow` now uses 450 (screen) / 320 (print, unchanged).

## Follow-ups (owner decides)

1. **Name `ink` divergence (new, adjacent to SC-367).** The site paints the generic name at the page's default body ink and the ability/statblock/featureblock names at a dimmer `--sc-steel-lighter` accent; the plugin paints all four at one shared `--dse-heading` accent. Out of SC-232's scope (color was never in this ticket's rule table) and invisible before this ticket added a pair that can see the name node at all. Declared under SC-367 (crest/eyebrow/right-rail sizes) as the nearest already-filed bucket for "the plugin's Steel name/rail chrome doesn't fully match the site outside the tuned type scale" — but it's a genuinely separate finding (ink, not size), so the owner may want to split it into its own ticket rather than fold it into SC-367 silently.
2. **Degenerate 0-width grid column, `statblock-sticky-narrow`.** 4 of 9 name nodes in that one fixture (`Whip and Magic Longsword`, `Shoot!`, `Form Up!`, `Lead From the Front`) report a 0px bounding-box width with grossly inflated line counts (21/6/7/16 lines) — a real layout bug, identical before and after this branch (not caused by SC-232), likely the same crest/rail-crowding class SC-284 addresses. Not investigated further (out of this ticket's scope), but worth its own look.
3. **Pre-existing mid-word breaks at narrow widths, generally.** Confirmed present in the BASE state too (not introduced here) across at least `statblock-sticky-narrow` and (word-count growth, not directly word-break-checked) `encounter-narrow`/`montage-narrow`. The survey's recommendation stands: land SC-284 (narrow head stacking) to give the name column the full width instead of sharing it with the crest/rail at narrow widths.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r2-implement-report.md`
- Wide composite: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r2-evidence/sc232-compare-wide.png`
- Narrow composite: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r2-evidence/sc232-compare-narrow.png`
- Modified in the worktree (`/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements/`):
  - `styles-source.css` (commit `b96ba51`, comment fold `2ec888b`)
  - `test/dom/theme/steelTypography.test.ts` (commit `b96ba51`)
  - `visual-harness/parity/selector-map.json`, `visual-harness/parity/README.md`, `visual-harness/parity/baseline/site-inventory.json`, `visual-harness/parity/baseline/site-shots/*.png` (28 files), `test/unit/parity/compare.test.ts` (commit `611c638`)
  - `visual-harness/entry.ts`, `visual-harness/shoot.mjs` (commit `690582f`)
- Gate logs (session scratchpad, not part of the deliverable): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc232/{jest-full3,shots3,parity-final,lifecycle-final}.log`

## Verdict

**DONE.** All six steps complete; full gate battery green at head `690582f`. Two follow-ups (name ink, the degenerate 0-width grid column) and one recommendation (land SC-284) for the owner to triage.
