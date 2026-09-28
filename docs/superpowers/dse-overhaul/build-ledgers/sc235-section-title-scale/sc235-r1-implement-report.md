# SC-235 round 1 — implementer report

## Executive summary

- **STATUS: DONE.** Site-parity option implemented on the branch as specified: `.dse-section__title` font-size moves from an unstated (ambient 16px) value to `calc(var(--dse-fs-body) * 1.125)` (18px at default), letter-spacing 0.07em -> 0.1em. Screen-only; line-height needs no edit (recomputes for free via the existing `line-height: 1.7` plate rule).
- **dse head sha:** `43b76cc` (branch `sc235-section-title-scale`, rebased onto `origin/develop` `825ea51`).
- **Superproject sha:** `eaad860` (rebased onto `origin/main` `689d7cf`).
- **Site measurement verdict:** every site instance measured (ability x2, statblock-leader/solo/companion, kit; both schemes, both the committed parity baseline JSON and a fresh live fetch) reads exactly **18px / 30.6px / 1.8px (`.1em`)** — no STOP condition triggered.
- **Gates (all on the rebased head, base `825ea51`):** tsc clean; lint clean; jest **4115** total (**4114 passed** / 1 skipped / 0 failed) vs base **4113** total (+2, my own new tests, 0 regressions); `obsidian-lifecycle` **19/19 ok, 0 failed**; `shots` **532 PNGs, 0 FAIL**; freeze **260/260**, exit 0; parity **0 GAPs / 0 undeclared / 10 DECLARED / exit 0** (was 16 DECLARED; -3 section-tag rows healed).
- **Can-fail proof:** reverting just the CSS fix (declarations still deleted) reproduces **6 GAPs**, exit 1 — proven twice (pre- and post-rebase), then restored byte-clean both times.
- **Narrow-wrap finding:** one new line wrap (not a mid-word break) — flagged for the owner's judgment, not fixed (see Follow-ups).
- **Evidence:** two labelled composite PNGs + full JSON/log trail, all paths listed at the end.

## 1. Context / worktree

- Worktree: `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale`
- DSE: same path `/draw-steel-elements`, branch `sc235-section-title-scale`.
- Started at DSE `origin/develop` `272c444`, implemented and gated there, then a mid-task owner message reported `origin/develop` had moved to `825ea51` (SC-284, `.dse-head` narrow/sidebar form). Rebased cleanly (`git rebase origin/develop`, no conflicts) and **re-ran every gate, the census/knockon measurements, and both evidence composites against `825ea51`** — none of SC-284's changes touch `.dse-section__title` or its containing selectors; all numbers are identical pre/post-rebase except jest's base count. The superproject worktree was then also rebased onto `origin/main` `689d7cf` (clean, no conflicts) so the CHANGELOG bullet and DSE pointer bump sit on top of everything currently landed.

## 2. Step A — measurement

### Site (both the committed `visual-harness/parity/baseline/site-inventory.json` — captured 2026-08-07 — and a fresh live Playwright fetch against steelcompendium.io, both color schemes, 2026-09-27)

| Family (URL) | `.sc-ability__section-head .tag` font-size | line-height | letter-spacing |
|---|---|---|---|
| ability-noroll (`feature/ability/shadow/…/black-ash-teleport/`) | 18px | 30.6px | 1.8px |
| ability-powerroll (`feature/ability/tactician/…/mark/`) | 18px | 30.6px | 1.8px |
| statblock-leader (`monster/human/human-bandit-chief/`) — 7 instances (Effect x5, Trigger, Special) | 18px | 30.6px | 1.8px |
| statblock-solo (`monster/ashen-hoarder/ashen-hoarder/`) — 10 instances | 18px | 30.6px | 1.8px |
| statblock-companion (`monster/companion/beastheart/bear/`) | 18px | 30.6px | 1.8px |
| kit (`kit/panther/`) | 18px | 30.6px | 1.8px |
| statblock-minion (`monster/goblin/goblin-warrior/`) | *(no boxed section on this page — 0 instances, both sides)* | — | — |
| featureblock-malice (`monster/devil/devil-malice/`) | *(no boxed section on this page — 0 instances, both sides; malice effects carry no `name`/`cost`)* | — | — |

Every instance where the site *does* render `.sc-ability__section-head .tag` reads **18px / 30.6px / 1.8px**, uniformly, across every family the ticket names. No family reads anything else, so the STOP condition ("if any site family's section title is NOT 18px/.1em") does not fire. Two families (statblock-minion, featureblock's own shipped content shape) render **no** boxed section title on the site *or* the plugin, for the same content-shape reason on both sides (see Follow-up 1).

### Plugin — today (base `825ea51`) vs head (this branch)

| Family | Today font-size / line-height / letter-spacing | Head font-size / line-height / letter-spacing |
|---|---|---|
| feature (5 titles: Trigger, Effect, Special (2 Malice), Aftermath, Inner Effect) | 16px / 27.2px / 1.12px | 18px / 30.6px / 1.8px |
| statblock (nested features, 8 instances) | 16px / 27.2px / 1.12px | 18px / 30.6px / 1.8px |
| kit (signature ability) | 16px / 27.2px / 1.12px | 18px / 30.6px / 1.8px |
| featureblock | *(no shipped fixture renders a title — see Follow-up 1; the CSS rule is the same class-selector rule as every other family, so it is covered by construction)* | |

Ticket's claimed today/site values (site 18/30.6/1.8, plugin 16/27.2/1.12) verified exactly.

## 3. Step B — implementation

`styles-source.css` (~8163, the Steel-scoped `.dse-section__title` "boxed EFFECT header" rule):

```css
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-section__title {
	display: flex;
	align-items: center;
	gap: 0.32em;
	font-variant: small-caps;
	text-transform: lowercase;
	font-size: calc(var(--dse-fs-body) * 1.125);
	letter-spacing: 0.1em;
}
```

- **Unit-rule compliance (x1.125-at-other-text-sizes table).** `.repo-docs/font-sizes.md` prohibits a bare hardcoded `font-size` — it must trace to a `--dse-fs-*` role. `--dse-fs-body` is the identity role (`1em`, "the element's own reading size"), so `calc(var(--dse-fs-body) * 1.125)` is a pure x1.125 of whatever the title inherited before (which had no font-size rule at all, i.e. was already an implicit x1 of the ambient). Measured live by forcing `#mount`'s font-size (simulating the Obsidian text-size setting):

  | `#mount` font-size (simulated Obsidian text size) | `.dse-section__title` computed font-size | Ratio |
  |---|---|---|
  | 16px (default) | 18px | 1.125 exactly |
  | 18px | 20.25px | 1.125 exactly |
  | 20px | 22.5px | 1.125 exactly |

  `fontSizeContract.test.ts` (the repo's own guard for this rule) passes unmodified — `calc(var(--dse-fs-body) * ...)` is on-scale by construction (`isOnScale()` accepts any `var(--dse-fs-`-bearing value), and the doc explicitly blesses deriving via `calc()` from a role ("deriving from a role is fine and normal").

- **line-height:** no separate declaration. The plate root's existing unitless `line-height: 1.7` (styles-source.css ~7170, unchanged) recomputes against the title's own new font-size for free: 18 x 1.7 = 30.6px, exactly the site's value.

- **letter-spacing:** `0.1em`, site parity; automatically computes to 1.8px at the new 18px (em is relative to the element's own font-size for this property).

- **Modal check (SC-230 anchoring).** Hosted a `feature` card's section title inside a synthetic `.dse-modal__body` with `--dse-text-scale: 1.4` (same construction SC-232's own r4 evidence used):

  | | modal body font-size | title font-size in modal | ratio vs. unscaled title (16.875px = 15px x 1.125) |
  |---|---|---|
  | measured | 21px (15px x 1.4) | 23.625px | 23.625 / 16.875 = **1.4 exactly** |

  The title scales x1.4 inside the modal exactly like every other element, no compounding — matches SC-230's contract. `npm run shots`'s own in-run assertion also prints `modal text-scale anchoring OK` unaffected by this change.

- **No knock-on geometry.**

  | | today | head | em-relative to title's own font-size? | verdict |
  |---|---|---|---|---|
  | head-strip padding (`section-head` pair, rem-based) | 10px 18px | 10px 18px | no (rem) | **unchanged**, matches owner ruling |
  | `::before` diamond width/height (`0.36rem`) | 5.75px | 5.75px | no (rem) | **unchanged** |
  | title's own flex `gap` (`0.32em`) | 5.12px | 5.76px | **yes** | scales proportionally (12.5%) — expected, checked, not asked to freeze |
  | spend-variant chip padding (`0.2em 0.6em`) | 3.2px / 9.6px | 3.6px / 10.8px | **yes** | scales proportionally — expected, checked |
  | spend-variant letter-spacing (inherited) | 1.12px | 1.8px | — | matches the base rule's new value |

- **No other text changed.** Full text-node font-size census (every `#mount`-descendant node carrying its own text, all four families, today vs. head): the *only* nodes whose font-size moved are `span.dse-section__title` instances — 5/4/0/1 changed nodes for feature/statblock/featureblock/kit respectively, every one of them a `.dse-section__title`. Verified via `dse-census.mjs`.

- **Parity.** Deleted the three `section-tag:font-size` / `:line-height` / `:letter-spacing` `declaredDeferrals` entries in `selector-map.json` (was FOLLOWUPS #51): 8 entries/16 rows -> **5 entries/10 rows**. Moved `compare.test.ts`'s documented-N guard (now asserts the 5-entry list) and `visual-harness/parity/README.md`'s declared-deferrals table + a new "HEALED and deleted" paragraph, in the same commit as the CSS fix.

- **Comments updated to the new truth** (in the same branch, per owner ruling): the SC-143 comment at ~8305 (kit band-head fix rationale, which cited the section title's *then*-current 1em/16px as a comparison anchor) and the letter-spacing/tracking comment at ~7344, both in `styles-source.css`; the analogous comment in `test/dom/theme/steelTypography.test.ts` (~587, added there by my own new test in the same commit).

- **CHANGELOG:** one bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`, and one `[FIX]` bullet under DSE's own `CHANGELOG.md` `## 7.0.0 (unreleased…)` (DSE's convention: every landed ticket gets one there).

## 4. Step C — evidence composites

Both viewed and confirmed to show what their captions claim (measured px printed in each cell's caption; 1 image px = 1 CSS px throughout — every cell's clip/crop was taken directly from a Playwright screenshot at `deviceScaleFactor: 1`, never resized).

- **`sc235-compare-wide.png`** — 4 rows (feature/ability, statblock, featureblock, kit) x 3 columns (Today `825ea51` / This branch / Site, dark scheme, 900px main-pane width). featureblock's Today/This-branch cells are explicitly labelled **SYNTHETIC** (see Follow-up 1) and its Site cell is `n/a` (no site page for this content shape renders a boxed title either — verified, not assumed).
- **`sc235-compare-narrow.png`** — 2 rows (feature's longest title "Special (2 Malice)"; statblock's "Effect"/"(2 Malice)") x 2 columns (Today/This branch) at 300px card width, with per-cell line/mid-word-break counts in the captions.

## 5. Narrow-wrap table (owner ruling: "0 new mid-word breaks and no new line wraps")

| Family / title | Today (16px) | This branch (18px) | New mid-word break? | New line wrap? |
|---|---|---|---|---|
| feature: Trigger | 1 line | 1 line | no | no |
| feature: Effect | 1 line | 1 line | no | no |
| feature: **Special (2 Malice)** | 1 line | **2 lines** (`Special (2 ` / `Malice)`) | **no** | **yes** |
| feature: Aftermath | 1 line | 1 line | no | no |
| feature: Inner Effect | 1 line | 1 line | no | no |
| statblock: Effect (x4) | 1 line | 1 line | no | no |
| statblock: (2 Malice) (x2) | 1 line | 1 line | no | no |
| statblock: Trigger | 1 line | 1 line | no | no |

**0 new mid-word breaks. 1 new LINE wrap** ("Special (2 Malice)", the longest title tested), a direct consequence of the 12.5% larger title at a fixed 300px width. See Follow-up 2 — reported per the owner ruling's "report a table" instruction, not treated as a stop condition (the ruling's hard stop is reserved for the site-family-mismatch case).

## 6. Gate numbers (measured, rebased head `825ea51` -> `43b76cc`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base `825ea51`, no SC-235 commits) | 4113 total (4112 passed / 1 skipped / 0 failed) |
| `npx jest` (head `43b76cc`) | **4115 total (4114 passed / 1 skipped / 0 failed)** — exactly base + 2 (my own new tests) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 |
| `npm run shots` | **532 PNGs, 0 FAIL**; in-run gates all OK (host-copy pin, button host-leak 114 kinds x 3 states x 2 schemes, modal text-scale anchoring) |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared / 10 DECLARED / exit 0** |
| Can-fail proof (CSS reverted, declarations still deleted) | **6 GAPs, exit 1** — `section-tag:font-size`/`:line-height`/`:letter-spacing`, both schemes; restored byte-clean immediately after, re-verified parity green again |

(Everything above was measured twice — once pre-rebase on `272c444`, once post-rebase on `825ea51` — with identical results except the jest base count, which moved with `origin/develop`'s own unrelated growth.)

## 7. Drive-by fixes

None. The three comment updates (styles-source.css x2, test file x1) were explicitly directed by the owner ruling ("Comments that state the section title is 16px/1em/.07em … are updated"), not discretionary drive-bys.

## 8. Follow-ups (for the owner's judgment, not fixed here)

1. **No shipped `featureblock` fixture (nor real site content) exercises a titled `.dse-section__title`.** `renderFeature.ts`'s `section()` helper only creates the title span when an effect carries a `name` or `cost`, or when the feature has a `trigger`; every featureblock fixture in this repo (`angulotl-malice`, `featureblockAdvancement`, `featureblockStats`) uses bare `effect:` text with no name/cost — and the live site's own equivalent page (`monster/devil/devil-malice/`) renders the identical shape (verified live, 0 instances both sides). The fix's CSS is a single class-selector rule shared by every family, so it applies to featureblock by construction (proven via a synthetic evidence-only title injection, clearly labelled in the wide composite) — but there is a genuine, pre-existing **fixture/test-coverage gap**: nothing in the harness or site today actually exercises a titled featureblock section. Worth a ticket if real coverage is wanted (e.g. a fixture where one malice effect carries a `name`).
2. **New line wrap at 300px.** "Special (2 Malice)" (the longest section title in any current fixture) wraps to 2 lines at the new 18px where it fit on 1 line at 16px, at a 300px card width. No `feature`/`statblock`/`featureblock`/`kit` capture id is in the shot gate's `NARROW_SHOTS` list today, so no frozen/committed shot moves — this is a real but ungated visual change, shown in the narrow evidence composite for Scott's review alongside the size decision itself.
3. **Em-relative knock-on geometry scales as designed, not frozen.** The title's own flex `gap` (0.32em) and the spend-variant chip's padding (0.2em 0.6em) are both relative to the title's own font-size and therefore grow ~12.5% along with it (measured in §3). This is the existing, deliberate behavior of an em-relative rule, not a bug — flagged because the owner ruling asked these to be checked, not because anything needs changing.

## Evidence artifacts (all absolute paths)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/sc235-r1-implement-report.md`
- Composites: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r1-evidence/sc235-compare-wide.png`, `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r1-evidence/sc235-compare-narrow.png`
- Composite specs: `r1-evidence/wide-spec.json`, `r1-evidence/narrow-spec.json`
- Per-cell crops: `r1-evidence/crops/*.png` (14 files: today/head/site x feature/statblock/featureblock/kit, plus narrow today/head x feature/statblock)
- Measurement scripts (copied/adapted from SC-232's r6-evidence, plus new ones): `r1-evidence/scripts/{wrap,measure,families,sitesel,site-measure,dse-census,knockon,crop,crop-site,compose}.mjs`
- Raw measurement JSON: `r1-evidence/census-today.json`, `r1-evidence/census-head.json`, `r1-evidence/knockon-today.json`, `r1-evidence/knockon-head.json`
- Site live-fetch log: `r1-evidence/site-measure.log`
- Gate logs (final, post-rebase): `r1-evidence/tsc-r2.log`, `r1-evidence/lint-r2.log`, `r1-evidence/jest-rebased-base.log`, `r1-evidence/jest-rebased-head.log`, `r1-evidence/obsidian-lifecycle-r2.log`, `r1-evidence/shots-r2.log`, `r1-evidence/freeze.log`, `r1-evidence/parity-rebased.log`, `r1-evidence/parity-canfail-rebased.log`
- Gate logs (pre-rebase, kept for the record): `r1-evidence/{tsc,lint,jest-1,jest-base,jest-base-retest,jest-final,jest-newtest,obsidian-lifecycle,shots,parity-1,parity-2,parity-canfail-proof}.log`

## Commits

DSE (`draw-steel-elements`), branch `sc235-section-title-scale`, now at `43b76cc`:
1. `f4fddaa` (was `9407788` pre-rebase) — `fix(feature): SC-235 section-title type scale — site parity (18px/.1em)` (CSS + parity map/test/README)
2. `c8b054d` (was `50c2bd0` pre-rebase) — `test(feature): SC-235 pin the section-title font-size/letter-spacing source`
3. `43b76cc` — `docs(changelog): SC-235 section-title type scale bullet`

Superproject worktree, branch `sc235-section-title-scale`, now at `eaad860`:
1. `eaad860` — `docs: SC-235 section-title type scale — CHANGELOG bullet + DSE pointer bump`
