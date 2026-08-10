# SC-146 — scoped re-review of fix round 1 (`9083dbe`)

**Verdict: LAND.** All 9 findings this round claims to fix (C1, I1, I2, I3, M1, M2, M3, M5, M6)
are verified FIXED — each checked live (Playwright/Chromium against the real built harness,
`getComputedStyle` + `getBoundingClientRect`, not just a CSS-text read) rather than trusted from
the fix report's prose. Battery reproduces exactly. Freeze widening is additions-only and the new
frozen shots look sane. No collateral damage — diffstat is confined to the 6 files the findings
implicate. One new trivial (non-blocking) finding: a comment-arithmetic slip in the I1 companion
rule.

Scope note: M4 was folded into C1 (confirmed — `justify-content: center` + `min-height: 3.3rem`
are in the same new Steel arm as `column-reverse`); M7/M8 were correctly left untouched (M7 is a
Scott-facing design question, M8 was already cleared in round 0). Not re-litigated.

---

## Per-finding verdicts

**C1 (Critical, gridc label/value inversion under Steel) — FIXED.** Live probe against the built
harness, both `getComputedStyle` and real `getBoundingClientRect`: under `steel-light` and
`steel-dark`, `.dse-sb__kv` now computes `flex-direction: column-reverse`, `justify-content:
center`, `min-height: 52.8px` (3.3rem), and the value's bounding box (`top: 274.4`) sits *above*
the label's (`top: 303.2`) — value-over-label, matching the site (`site-stats-02-meta-gridc.png`:
"Corruption 10, poison 10" above "IMMUNITY"). `legacy-light` and `steel-print` were already
correct pre-fix and remain correct (value above label, both). The new arm
(`styles-source.css:6013-6021`, `[data-dse-theme='steel']:not([data-dse-print="on"])
[data-dse-element='statblock'][data-dse-sb-stats='gridc'] .dse-sb__kv`) is genuinely
(0,5,0) — 4 attribute selectors + 1 class, verified by hand-count — which beats the plain Steel
box rule's (0,3,0) regardless of source order. The new I3 regression test for this arm FAILS when
run against `1b22e41`'s sheet (verified by extracting that commit's `styles-source.css` and
re-running the same regex assertion against it) — it is a real can-fail guard, not decorative.

**I1 (ledger collapsing the secondary block to one column) — FIXED.** Live probe: under Steel and
Legacy alike, `.dse-sb__grid` now computes `display: grid`, two equal-width columns
(`gridTemplateColumns: "342.203px 342.203px"` Steel / `"351.203px 351.203px"` Legacy), `row-gap:
0`, `column-gap: 25.6px` (1.6rem). Cell positions confirm real two-column pairing: Immunity and
Weakness sit at the same `top` with different `left` (49 vs 417), Movement alone on the row below
— matches `site-stats-01-meta-ledger.png` cell-for-cell. Value alignment (M3) confirmed in the
same probe: `text-align: right` on every `.dse-sb__kv-v` in all four contexts. The base arm
(`styles-source.css:2042-2044`) dropped `display: block`/`padding-bottom` entirely and now only
sets `gap`; a Steel-scoped companion (`:6061-6063`) prevents the plain Steel `.dse-sb__grid { gap:
0.5rem }` rule from re-winning the same tie shape as C1. Both I3 guard assertions for this fail
against `1b22e41` (verified).

**I2 (Index preset `sbStats` still `'grid'`) — FIXED.** `src/prefs/catalog.ts:356`:
`index: { sbFeatureStyle: 'flat', sbDensity: 'compact', sbColumns: 'single', sbStats: 'gridc' }`.
`test/unit/prefs/catalog.test.ts:202-205` asserts `store.get('sbStats') === 'gridc'` after
`applySbPreset(store, 'index')` — ran in the jest pass, green.

**I3 (zero regression coverage) — FIXED.** 7 new sheet-grep guards
(`test/dom/framework/pref-reflection.test.ts:287-364`) — **every one of the 7 fails when run
against `1b22e41`'s `styles-source.css`**, confirmed by extracting that commit's sheet and
re-executing each assertion's regex against it (`no Steel-scoped gridc .dse-sb__kv arm found`,
`display:block present (bug)`, `no gap: 0 1.6rem`, `no text-align:right on ledger kv-v`, `no
columns: 35rem`, `no spacer sibling rule found`, `no #1e2327 literal` — all 7/7 failed as
expected). This directly answers the scoped brief's "would the C1 test FAIL on `1b22e41`" probe:
yes, and so would every other new guard. Right tier: `visual-harness/entry.ts:288-360` adds 4
fixture variants (`stats-ledger`, `stats-gridc`, `featstyle-flat`, `columns-wide`) via per-block
`prefs:` overrides — `npm run shots` produced all 20 expected new PNGs (4 fixtures × 5 combos), 0
FAIL, confirmed present in `visual-harness/shots/`.

**M1 (diamond seam / halo arithmetic) — FIXED.** Live probe: the sibling rule now sets
`margin-top: 4px` + `padding-top: 20px` (1.25rem) between adjacent flat-mode features, and the
diamond's `top` moved to `4px` to match. Border-box seam gap measures 4px with 20px of padding
inside the next feature's box before its content starts — the site's own spacing pair, ported
correctly. Comment's corrected arithmetic (8px = core side, not halo diameter; halo diagonal
~25.5px) is accurate.

**M2 (halo keyed to page bg instead of plate) — FIXED, judgment call verified legitimate.** Live
probe: `box-shadow` inner ring now resolves to `rgb(30, 35, 39)` dark / `rgb(244, 246, 246)` light
— exact matches for `#1e2327`/`#f4f6f6`, the site's own `--sb-plate-solid` values. The fix report's
stated reason for using raw literals instead of a new `--dse-*` token (`test/dom/framework/theme-
steel.test.ts`'s D3 exhaustive token-union guards would break) is real and verified: those three
guard tests (`the Steel block defines no stray token...`, `...overrides EXACTLY the shifting
tokens (34)`, `...defines no token outside the union`) exist exactly as described at lines 264,
427, 451. The cited precedent (`.dse-sb__chars`'s own raw-rgba gradient with a
`body.theme-light` override) is real too (`styles-source.css:6073-6080`). This is a reasonable,
documented, precedented judgment call — acceptable.

**M3 (ledger value right-align) — FIXED.** Confirmed in the I1 probe above:
`valueTextAlign: "right"` in all four contexts (steel-light/dark, legacy-light, steel-print).

**M5 (CHANGELOG accuracy) — FIXED.** `CHANGELOG.md:121-123` ("value over the label, centred") is
now true (C1 fixed). The addendum at `:129-130` ("It also now sets Secondary stats to Grid
(centered)...") accurately documents the I2 fix and was added in this round, not merely left
alone.

**M6 (28rem vs 35rem breakpoint) — FIXED.** Live probe: `.dse-feature__nested` under
`sb-columns='wide'` computes `column-width: 560px` (35rem × 16px) — exact match for the site's
real 560px (its 28rem at a 20px rem base). `columns: 28rem` no longer appears anywhere in that
arm (grep-confirmed, and the corresponding I3 guard fails against `1b22e41`).

---

## Battery reproduction (worktree `sc146-statblock-settings/draw-steel-elements`, `9083dbe`)

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | 0 |
| `npm run lint` | clean | 0 |
| `npx jest` | `Test Suites: 1 skipped, 159 passed, 159 of 160` / `Tests: 1 skipped, 2514 passed, 2515 total` / `Snapshots: 3 passed` | 0 |
| `npm run shots` | 254 PNGs, 254 `ok`, 0 `FAIL` | 0 |
| `check-freeze.sh` | `freeze OK (149/149 legacy+print PNGs byte-identical)` | 0 |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).` | 0 |

Matches the fix report's claimed numbers exactly. `obsidian-shots` not run (no display), per
skill guidance.

## Freeze widening (137 → 149)

The 12 new lines are exactly `{statblock-stats-ledger, statblock-stats-gridc,
statblock-featstyle-flat, statblock-columns-wide} × {legacy-dark, legacy-light, steel-print}` —
grep-confirmed against `freeze-baseline.sha256`. Eyeballed 4 of the 12 new frozen PNGs directly:
- `statblock-stats-gridc--legacy-light.png` — plain black/white Legacy chrome, value-above-label
  (correct, Legacy was never broken).
- `statblock-stats-gridc--steel-print.png` — grayscale/print styling, value-above-label, diamond
  header ornament visible — reads as print, not screen.
- `statblock-featstyle-flat--legacy-dark.png` — standard Legacy dark card chrome with colored
  action-type spine bars; no flat-mode ornament (correct — flat's ◆ separator is Steel-only,
  Legacy has no ornaments).
All look sane for their theme; no leakage. `check-freeze.sh` independently re-run in this
session: `149/149`, exit 0.

## Live-shot comparison against site references

Built four Steel-light shots directly from the harness (`statblock-stats-ledger--steel-light`,
`statblock-stats-gridc--steel-light`, `statblock-featstyle-flat--steel-light`) and compared
against `shots/site-stats-01-meta-ledger.png` / `site-stats-02-meta-gridc.png`: gridc shows
value-over-label centered exactly like the site's Lich card; ledger shows Immunity | Weakness
side-by-side with Movement below-left, values right-aligned, exactly like the site; flat mode
shows a centered ◆ between every pair of adjacent features with no visible clipping into either
neighbor's content or box border, matching M1/M2's fix.

## Collateral damage check

`git diff --stat 1b22e41 9083dbe`: 6 files — `CHANGELOG.md`, `src/prefs/catalog.ts`,
`styles-source.css`, `test/dom/framework/pref-reflection.test.ts`,
`test/unit/prefs/catalog.test.ts`, `visual-harness/entry.ts`. Every file and every hunk traces
directly to one of C1/I1/I2/I3/M1/M2/M3/M5/M6. No unrelated surface touched.

---

## New findings

### N1 (Minor, non-blocking) — I1 companion comment miscounts its own specificity

`styles-source.css:6059-6060` (comment above the Steel-scoped ledger `.dse-sb__grid` gap
companion, `:6061-6063`) claims the new selector is "Attribute-qualified to (0,4,0)". Hand-count
of `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='statblock']
[data-dse-sb-stats='ledger'] .dse-sb__grid` gives **4 attribute selectors
(`data-dse-theme`, the `:not()` argument `data-dse-print`, `data-dse-element`, `data-dse-sb-stats`)
+ 1 class (`.dse-sb__grid`) = (0,5,0)**, not (0,4,0) — the same arithmetic-in-a-comment mistake
this very round's M1 finding corrected elsewhere in the file. Functionally inconsequential: (0,5,0)
still beats the plain Steel rule's (0,3,0) either way, so the tie-break the comment is explaining
holds regardless of the off-by-one. Not blocking; worth a one-line correction next time this
region is touched.

No other new findings. No functional regressions found in any probed surface.

---

## Recommendation

**LAND.** Every finding in scope for this round is fixed and independently verified with live
computed-style probes (not a CSS-text read alone), the regression tests are proven can-fail
against the pre-fix commit, the freeze widening is additions-only and visually sane, the full
battery reproduces the claimed numbers exit-0 across the board, and the diff is fully contained to
the 9 findings' surfaces. N1 is cosmetic and does not block landing.
