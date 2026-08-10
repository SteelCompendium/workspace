# SC-146 — fix report

Implements the six clear-bug fixes from `sc146-audit-report.md` §5(a) (audit's items
1-5, minus the out-of-scope dead-CSS item) plus the judgment-call additions Scott approved
(§5(c), items 16-19 — C1/C2/C3/C4). All work done in the worktree
`/home/scott/code/steelCompendium/worktrees/sc146-statblock-settings/draw-steel-elements`,
branch `sc146-statblock-settings`, on top of dse main `9fb56f5`.

Commit: **`1b22e41`** — `fix(statblock): display settings brought back in line with the v2
site (SC-146)`. Superproject pointer bump left unstaged (orchestrator lands).

Out of scope, untouched, per the brief: `data-dse-fb-stats`/featureblock (SC-123's dead-CSS
item), and the ten missing-setting ports (kwusage, disttarget, villain bands, characteristics
two/one, boxed first letter, sticky header, link toggle, featureblock feature
style/stat line) — SC-123's territory, worked in parallel by another agent.

---

## Fix 1 — re-point `sbStats` to the real secondary-stats block

**Root cause** (audit §1): the descriptor is labelled "Secondary stats" but its CSS targeted
`.dse-sb__items`/`.dse-sb__item` — the PRIMARY Size/Speed/Stamina/Stability/Free Strike row
(`view.ts:210-214`), not the secondary Immunity/Weakness/Movement/With Captain block
(`.dse-sb__grid`/`.dse-sb__kv`, `view.ts:222-227`). Exact inverse of the site's
`data-sb-meta`.

**Fix**: `styles-source.css:1996-2018` (pre-edit line numbers) — every
`[data-dse-element='statblock'][data-dse-sb-stats='ledger']` selector renamed from
`.dse-sb__item(-v|-l)` to `.dse-sb__kv(-v|-l)`, container from `.dse-sb__items` to
`.dse-sb__grid`. No primary-stats layout setting was added — the site has none either
(audit judgment C1, Scott-approved: "yes, lose it").

**Guard test**: `test/dom/framework/pref-reflection.test.ts:56` — regex updated from
`.dse-sb__item` to `.dse-sb__grid`.

## Fix 2 — real hairline ledger under Steel

**Root cause** (audit §1b): the Steel theme boxes `.dse-sb__kv` unconditionally
(`styles-source.css:5811-5824` pre-edit — border + radius + sunken background), and the
ledger arm only added a `border-bottom`, so `ledger` rendered as boxed panels with a
doubled bottom edge, not a hairline row.

**Fix**: a Steel-scoped, attribute-qualified arm —
`[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__kv`
— resets `border`/`border-radius`/`background` to nothing, sets `flex-direction: row`, and
draws a single `border-bottom: 1px solid var(--dse-metal-faint)`. Its higher specificity
(5 simple selectors vs. the plain box rule's 3) wins regardless of source order, and the
light-theme background override (`body.theme-light [data-dse-theme='steel']:not(...)
.dse-sb__kv`) is also outranked, so the reset holds in both color schemes.

## Fix 3 — add the missing `gridc` ("Grid (centered)") mode

**Site reference**: `steel-statblock.css:169-172` — same framed cell as `grid`, but value
sits above the label, both centred, value bolded/coloured.

**Fix**:
- `src/prefs/catalog.ts` — `sbStats` type widened to `'grid' | 'gridc' | 'ledger'`; descriptor
  options gained `{ value: 'gridc', label: 'Grid (centered)' }`.
- `styles-source.css` — base structural rule (non-themed, so it works under Legacy too):
  `[data-dse-element='statblock'][data-dse-sb-stats='gridc'] .dse-sb__kv { display: flex;
  flex-direction: column-reverse; align-items: center; text-align: center; gap: 0.08rem; }`
  (flex `column-reverse` flips the visual stack without touching the label-then-value DOM
  order `view.ts`'s `renderMeta` already emits — no view.ts change needed).
- Steel arm bolds/colours the value: `[data-dse-theme='steel']:not(...)
  [data-dse-element='statblock'][data-dse-sb-stats='gridc'] .dse-sb__kv-v { font-weight:
  bold; color: var(--dse-heading); }`. The shared box (border/bg/radius) is untouched —
  `gridc` reuses `grid`'s frame.

## Fix 4 — Sourcebook preset: Feature style → Flat

`src/prefs/catalog.ts` `SB_PRESETS.sourcebook.sbFeatureStyle` changed `'card'` → `'flat'`,
matching the site's own Sourcebook bundle (`settings-panel.js:37`).

## Fix 5 — Index preset: Feature columns → Single (Density: Compact kept, documented)

`src/prefs/catalog.ts` `SB_PRESETS.index.sbColumns` changed `'wide'` → `'single'` — the site
pins multi-column `off` in every preset (`settings-panel.js:711`) and treats it as a
standalone toggle. `sbDensity: 'compact'` was **kept** in the bundle: the site has no density
preset member at all (it's the plugin's own PLUGIN-ONLY divergence — matrix row P3/S21), so
keeping it is a deliberate choice now spelled out in a code comment (audit judgment C3,
Scott-approved: "keep it... but write it down as a deliberate divergence, not an accident").

**Guard tests updated** (both bundles now diverge from `steel` in TWO members apiece, so a
single-member toggle from defaults no longer lands on a named preset):
- `test/unit/prefs/catalog.test.ts` — preset-derivation test now flips both
  `sbFeatureStyle`+`sbStats` to reach `sourcebook`, and checks `sbColumns === 'single'` after
  applying `index` (was `'wide'`).
- `test/dom/views/settings-tab.test.ts` — "twiddling one preset member" test: toggling
  Secondary stats alone now derives `custom` immediately (was `sourcebook`); toggling Feature
  style to `flat` on top reaches `sourcebook`.

## Fix 6 — ◆ diamond separator in `flat` feature style

**Site reference**: `steel-statblock.css:315-345` — `[data-sb-featstyle="flat"] .sb__feat +
.sb__feat::before/::after` draws a center-out line + two seed dots + a haloed diamond between
consecutive flat-mode features.

**Fix** (`styles-source.css`, after the existing flat-mode block, ~3711 post-edit):
`::before` on `.dse-feature` is already the action-type spine bar (`.dse-feature[data-dse-act]::before`,
still drawn in flat mode), so the separator takes `::after` instead — free on this class.
Reuses the plugin's own halo'd-diamond recipe (same shape as `.dse-hr__diamond`, ~5772: 8×8px
rotated square, `background-color: var(--dse-metal)`, halo via `box-shadow: 0 0 0 4px
var(--dse-page-bg, var(--dse-surface)), 0 0 0 5px var(--dse-metal-faint)`) rather than porting
the site's line+dots gradient, for visual consistency with the rest of the sheet. Selector:
`[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='statblock']
[data-dse-sb-featstyle='flat'] .dse-feature__nested > .dse-feature + .dse-feature:not(.dse-fb *)::after`
— Steel + screen-only (Legacy has no ornaments; print excluded), and excludes any option
nested inside a `.dse-fb` (same convention the neighbouring flat-mode rules use, so a nested
featureblock inside a statblock villain action isn't touched).

Verified visually: `shots-after/after-feat-01-featstyle-flat.png` shows a centred diamond
between "Whip and Magic Longsword" and "Kneel, Peasant!".

## Fix 7 — `sbColumns: wide` — CSS `grid` → CSS `columns`

**Root cause** (audit §4, C4): `styles-source.css:1989-1994` (pre-edit) used
`grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr))`, which row-aligns — a short
card's row stretches to match its taller neighbour, leaving a dead-space gap underneath. The
site uses CSS `columns: 28rem` (`steel-statblock.css:601-604`), which packs greedily with no
forced row alignment.

**Fix**: `[data-dse-element='statblock'][data-dse-sb-columns='wide'] .dse-sb >
.dse-feature__nested` now sets `display: block; columns: 28rem; column-gap: 2rem;` — `display:
block` is required to override the unconditional Steel `.dse-feature__nested { display: flex
}` rule elsewhere in the sheet (columns has no effect on a flex container), and it wins on
specificity (4 simple selectors vs. that rule's 3). A companion rule adds `break-inside: avoid;
margin-bottom: 0.65rem;` on each top-level feature (columns has no vertical-gap concept, so the
margin replaces it — zeroed again when `flat` is also active, mirroring the site's
`[data-sb-wide="on"][data-sb-featstyle="flat"] .sb__feat { margin-bottom: 0 }`).

**Guard-test fallout**: `test/dom/framework/theme-print.test.ts`'s "page-break hygiene" test
grabbed the FIRST `break-inside: avoid` rule in the file via an unscoped regex and asserted it
was the print-hygiene rule — but fix 7's new (unrelated: CSS *multi-column* break, not *page*
break) `break-inside: avoid` now appears earlier in the file. Narrowed the test to search
inside `@media print { ... }` specifically (matching the file's own established pattern for
other print-scoped assertions), rather than "first occurrence anywhere".

Verified visually: `shots-after/after-full-01-columns-wide.png` (captured with the harness's
`#mount { max-width: 760px }` chrome widened to 1400px so the 28rem breakpoint has room to
show 2 columns, matching what a real wide Obsidian reading pane gives it) shows two
independently-packed columns with no forced-row dead space, vs. the audit's
`shots/plugin-full-01-columns-wide.png` "before" (2-column grid, visible dead space under
shorter cards in each row).

---

## Battery results (verbatim)

- **tsc**: clean, no output, exit 0.
- **lint**: clean, no output, exit 0.
- **jest**: `Test Suites: 1 skipped, 159 passed, 159 of 160 total` / `Tests: 1 skipped, 2503
  passed, 2504 total` / `Snapshots: 3 passed, 3 total` — matches the expected baseline
  (2503 passed / 159 suites / +1 skipped) exactly.
- **shots**: 234 PNGs written to `visual-harness/shots/` — matches the expected baseline (234)
  exactly; no new fixtures were added (every SC-146 change is pref-driven CSS on the existing
  `statblock`/`feature` fixtures).
- **freeze**: `freeze OK (137/137 legacy+print PNGs byte-identical)`, exit 0.
- **parity**: `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).` exit 0 — same 16
  declarations as the documented set (FOLLOWUPS #39/#40/#51), composition unchanged.

One incidental test fix along the way (not a regression in shipped behavior, a fragile guard
assumption): `test/dom/framework/theme-print.test.ts`'s page-break test, described under
Fix 7 above.

Obsidian shots (`npm run obsidian-shots`) were **not** run — no display available in this
environment, per the skill's guidance (headless environment, skip rather than fake).

---

## Screenshot inventory

Audit "before" evidence (already captured, pre-fix, in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc146/shots/`):
- `plugin-stats-01-sbstats-ledger.png` — Secondary stats: Ledger, broken (restyles primary
  row, secondary block untouched and still boxed).
- `plugin-stats-03-preset-sourcebook.png` — Sourcebook preset, broken (kept Cards, wrong block
  ledgered).
- `plugin-stats-04-preset-index.png` — Index preset, broken (forced Wide columns on).
- `plugin-feat-01-featstyle-flat.png` — Flat feature style, no separator.
- `plugin-full-01-columns-wide.png` — Wide columns, CSS grid, ragged row-forced gaps.
- `site-stats-02-meta-gridc.png` / `site-02-meta-gridc.png` — site's Grid (centered) mode
  (the plugin had no equivalent at all before this fix).

"After" evidence (this session, worktree `sc146-statblock-settings`, same harness technique —
Steel theme, light background, `statblock` default fixture — via
`fix-shots/sc146-fix-shots.cjs`, output in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc146/shots-after/`):
- `after-stats-00-default.png` — unchanged default (Grid), for reference.
- `after-stats-01-sbstats-ledger.png` — **Fix 1+2**: primary row untouched, secondary block now
  real hairline rows.
- `after-stats-02-sbstats-gridc.png` — **Fix 3**: new Grid (centered) mode.
- `after-stats-03-preset-sourcebook.png` — **Fix 4**: Sourcebook now ledgers the correct block
  (Feature style = Flat is visible separately in the feat-zone shots, not this stats-zone crop).
- `after-stats-04-preset-index.png` — **Fix 5**: Index preset — Grid stats, Density: Compact
  (visibly tighter padding/smaller numerals), single-column (confirmed via jest + the wide
  columns shot below, which uses the same CSS arm keyed off the same attribute).
- `after-feat-00-default.png` — unchanged default Cards, for reference.
- `after-feat-01-featstyle-flat.png` — **Fix 6**: visible ◆ between "Whip and Magic Longsword"
  and "Kneel, Peasant!".
- `after-full-01-columns-wide.png` — **Fix 7**: packed two-column layout, no forced-row dead
  space.

All "after" PNGs were captured against the harness's own local static server (not the shared
`npm run shots` output, which is gitignored scratch) — a `visual-harness/index.html` served on
`127.0.0.1:8126` after `npm run harness:build`, same technique the audit's own
`sc146-plugin-shots.cjs` used against its own ephemeral server.

---

# Fix round 1

Implements every fix prescribed in `sc146-review-report.md` §5 (C1, I1, I2, I3, M1, M2, M3,
M6) **except the print-test-regex-fragility note (M8)**, which the review itself classified
as "LEGITIMATE, with a fragility note only" and the brief explicitly excluded. M4 and M5 are
folded into C1 (M4) and verified-already-true (M5), per the review's own cross-references.
M7 is a Scott-facing design note, not a defect, and is untouched.

Commit: **`9083dbe`** — `fix(statblock): SC-146 fix round 1 — gridc Critical fix, ledger
grid, diamond geometry (SC-146)`, on top of `1b22e41` in the same worktree/branch
(`sc146-statblock-settings`). Superproject pointer bump left unstaged.

## C1 (Critical) — gridc rendered label-over-value under Steel

**`styles-source.css:6004-6021`** (new). The base `gridc` arm (`:2069`, unscoped) and the
plain Steel `.dse-sb__kv` box rule (`:5906`ish, pre-fix line numbers) were both `(0,3,0)` —
a specificity tie the box rule won on source order (it sits ~3,850 lines later), so
`flex-direction: column-reverse` never applied under Steel. Fixed by re-declaring the
layout at `(0,5,0)` — theme-qualified and attribute-qualified, the same shape the ledger
Steel-reset arm next to it already used — so it wins the tie regardless of order, in both
colour schemes. Folds in M4 (`justify-content: center`, `min-height: 3.3rem`,
`steel-statblock.css:168-172`) in the same arm.

**Compared against the site reference and my own fresh capture, both schemes:**
- Before (probed live against the unmodified `1b22e41` commit in an isolated temp
  worktree, not from a stale file — see "Verification method" below):
  `IMMUNITY` centred above `Corruption 4, psychic 4`, label-over-value — the defect,
  confirmed reproduced.
- After (`visual-harness/shots/statblock-stats-gridc--steel-{light,dark}.png`, both
  schemes checked): `Corruption 4, psychic 4` sits above `IMMUNITY`, both centred, value
  bold/coloured — value-over-label. Matches `shots/site-stats-02-meta-gridc.png` exactly
  (site: `Corruption 10, poison 10` above `IMMUNITY`).
- Legacy and print were already correct pre-fix (the Steel box rule that caused the tie is
  excluded from both) and are untouched: the new arm is Steel-scoped, and the freeze check
  (137/137, then 149/149 after widening) confirms no Legacy/print byte moved.

## I1 (Important) — ledger collapsed the secondary block to one column

**`styles-source.css:2033-2043`** (base arm) **+ `:6055-6063`** (Steel-scoped companion,
new). The ledger `.dse-sb__grid` arm carried `display: block` — a carry-over from the
selector's pre-fix-1 life targeting `.dse-sb__items` (the primary row, where collapsing
to one column was the point). Re-pointed to `.dse-sb__grid` at fix round 0 but not
re-thought, it also collapsed the SECONDARY block's two-column pairing. Replaced with
`gap: 0 1.6rem`, mirroring the site's `[data-sb-meta="ledger"] .sb__meta { gap: 0 1.6rem
}` (`steel-statblock.css:196`) — the base `.dse-sb__grid` 2-col grid (`:1924`) now
survives; only the gap changes. A second, Steel-scoped, attribute-qualified companion arm
was needed because the plain Steel `.dse-sb__grid { gap: 0.5rem }` rule (`:5903`ish) ties
the base arm's specificity and sits later in the file — the exact same tie shape as C1,
caught before it could ship the same way.

**Compared against the site reference, both schemes:**
- Before (probed live against `1b22e41`, `.dse-sb__grid` computed `display: block`, three
  full-width stacked rows — Immunity, then Weakness, then Movement, each spanning the
  card's full width with the value pushed to the far right by `justify-content:
  space-between` on the now-full-width `.dse-sb__kv` flex items).
- After (`statblock-stats-ledger--steel-{light,dark}.png`): Immunity and Weakness sit
  side by side in a real two-column grid, Movement alone on the row below on the left —
  matches `shots/site-stats-01-meta-ledger.png` cell-for-cell (site: Immunity | Weakness
  paired, Movement alone below-left).

## I2 (Important) — Index preset still wrote `sbStats: 'grid'`

**`src/prefs/catalog.ts:356`** (`SB_PRESETS.index.sbStats`, `'grid'` → `'gridc'`), comment
at `:353-358`. One-line fix, blocked behind C1 per the review's own note ("flipping it is
blocked behind C1 — it would currently apply a broken mode") — landed in the same commit
since C1 lands first in this same round. `test/unit/prefs/catalog.test.ts:202-205` asserts
`store.get('sbStats') === 'gridc'` after `applySbPreset(store, 'index')`.

**Compared:** `after-r1-stats-04-preset-index--light.png` shows the Index preset's
secondary-stats block in Grid (centered) mode (value-over-label) with the compact
density's visibly tighter padding — matches the site's Index bundle (`meta: gridc`,
`settings-panel.js:39`).

## I3 (blocking) — zero regression coverage for the changed surfaces

**Cheap tier**: `test/dom/framework/pref-reflection.test.ts:72-146`, a new `describe`
block with 7 sheet-grep guards (same convention the file already used, extended with the
brace-matching-adjacent regex style `controlDensity.test.ts`/`theme-steel.test.ts` use
elsewhere in the repo for "assert the DECLARED rule text" — jsdom cannot cascade
`var()`/`calc()`, so this repo's established idiom is parsing `styles-source.css` text
directly rather than `getComputedStyle`):
1. no `[data-dse-sb-stats=...]` selector anywhere still mentions `.dse-sb__items` (blanket
   guard for the ticket's original root cause);
2. gridc has a Steel-scoped, theme-qualified arm with `column-reverse` +
   `justify-content: center` + `min-height: 3.3rem` — **this is the one assertion the
   review said would have caught C1**;
3. ledger's `.dse-sb__grid` arm (base AND Steel companion) never carries `display: block`
   and always carries `gap: 0 1.6rem`;
4. ledger's Steel `.dse-sb__kv` arm still resets to a real hairline (`border: none` +
   `border-bottom: 1px solid`);
5. ledger's value is right-aligned (M3);
6. the flat-mode `::after` diamond's sibling selector opens real `margin-top`/
   `padding-top` spacing and its halo uses the plate literal (`#1e2327`), not
   `--dse-page-bg` — plus the light-scheme override exists;
7. wide columns packs at `35rem`, never `28rem` (M6).

**Right tier**: `visual-harness/entry.ts:288-360` — four new fixture variants under
`FIXTURES.statblock` (`stats-ledger`, `stats-gridc`, `featstyle-flat`, `columns-wide`),
each the default statblock fixture plus a per-block `prefs:` override map (the same
reserved YAML key `src/framework/prefOverrides.ts` already validates for real vault
notes — no new harness plumbing needed). `npm run shots` now produces 254 PNGs (was 234,
+20: 4 fixtures × 5 combos), all `ok`, 0 `FAIL`. The freeze baseline was widened
additions-only, 137 → 149 (12 new lines: the four fixtures' legacy-dark/legacy-light/
steel-print twins) — documented in `check-freeze.sh`'s header. Verified before and after:
`diff <(head -137 freeze-baseline.sha256) freeze-baseline.sha256.pre-sc146-fixround-bak`
is empty (pre-existing 137 lines byte-untouched), and `check-freeze.sh` reports
`149/149 legacy+print PNGs byte-identical` after.

## M1 (Minor) — the ◆ halo's clearance and the comment's wrong arithmetic

**`styles-source.css:3745-3776`** (new `margin-top`/`padding-top` sibling rule) **+
`:3777-3798`** (diamond `::after`, `top` moved 0 → 4px). The original comment claimed
flat's `0.25rem` top/bottom padding + zero gap left "exactly an 8px seam — this diamond's
own halo diameter"; both halves were wrong (8px is the core square's SIDE, and the actual
halo's rotated diagonal is ~25.5px). Fixed by porting the site's own spacing pair
(`steel-statblock.css:315` — `margin-top: calc(1.25rem + -16px)` / `padding-top: 1.25rem`
on the `.sb__feat + .sb__feat` sibling selector, not the shared per-feature rule) onto the
plugin's equivalent sibling selector, print-excluded like the diamond it makes room for.

**Compared, both schemes:** `after-r1-feat-01-featstyle-flat--{light,dark}.png` show a
clean, centred gap around the diamond between "Whip and Magic Longsword" and "Kneel,
Peasant!" — no clipping into either neighbouring feature's content or box border (visible
in the round-0 evidence, `scratchpad/flat-narrow-seams.png` per the review). The site's
own separator (`shots/site-feat-01-featstyle-flat.png`) uses a line+dots+diamond
treatment the plugin deliberately does not port (Fix 6's own documented visual-consistency
call, unchanged this round) — the comparison here is clearance/geometry, not glyph style.

## M2 (Minor) — the ◆ halo was keyed to the page background, not the plate

**`styles-source.css:3780-3798`** (dark, raw literal `#1e2327`) **+ `:3799-3803`** (new
`body.theme-light` override, `#f4f6f6`). Was `var(--dse-page-bg, var(--dse-surface))` —
right for `.dse-hr__diamond`'s `<hr>`, which sits on the page, wrong for this diamond,
which sits on `.dse-sb`'s gradient plate. The site solved the same problem with a real
token, `--sb-plate-solid` (`steel-statblock.css:67,74`). **Implementation note — no new
`--dse-*` token was added.** The repo's D3 token map
(`test/dom/framework/theme-steel.test.ts`) enumerates the shared Steel token union
exhaustively and asserts nothing extra is defined; adding `--dse-sb-plate-solid` there
broke three of that file's guard tests (`the Steel block defines no stray token...`, `the
light block overrides EXACTLY the shifting tokens (34)`, `the light block defines no token
outside the union`) until the map itself was updated, which is out of scope for a one-off
halo colour with a single consumer. Used a raw literal instead — copied byte-for-byte from
the site's `--sb-plate-solid` values, which are themselves the exact solid mid-tone of
`--dse-card-bg`'s gradient (byte-identical to the site's `--fx-card-bg`) — with a
`body.theme-light` override, the same "one-off raw-rgba, no token" precedent
`.dse-sb__chars`'s own gradient already sets a few hundred lines below (documented in
both rules' comments).

**Compared, both schemes:** the halo now reads as a subtle tonal match against the card
plate in both `after-r1-feat-01-featstyle-flat--light.png` (light plate, `#f4f6f6` halo)
and `--dark.png` (dark plate, `#1e2327` halo) — no visible seam between the halo edge and
the surrounding plate gradient at the diamond's position, unlike the pre-fix page-token
mismatch the review measured (sampled deltas of 2-8 per channel, structurally unpinned).

## M3 (Minor) — ledger value lacked right alignment

**`styles-source.css:2053-2062`**, added `text-align: right;` to
`[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__kv-v`. Matches the
site's `.sb__field-v { text-align: right }` (`steel-statblock.css:190`). One-declaration
fix; regression-guarded in I3's test 5.

## M4 (Minor) — folded into C1

The site's `justify-content: center` + `min-height: 3.3rem` are declared in the same
Steel-scoped `gridc` arm C1 added (`styles-source.css:6004-6021`) — see C1 above. No
separate fix needed.

## M5 (Minor) — CHANGELOG documents behaviour that didn't ship

The review flagged this as "False until C1 is fixed. Otherwise the entry is well placed
... and accurate." With C1 shipped, the existing CHANGELOG wording ("Added the missing
third mode, 'Grid (centered)' — a framed cell with the value over the label, centred") is
now true and needed no correction. **One related addition, not a correction**:
`CHANGELOG.md`'s Index-preset bullet was extended to note the preset now also sets
Secondary stats to Grid (centered) — a new fact from the I2 fix that the original bullet
predated.

## M6 (Minor) — `28rem` matched the site's declaration but not its pixel width

**`styles-source.css:1998-2012`**, `columns: 28rem` → `columns: 35rem` (35 × 16px = 560px,
matching the site's own real breakpoint — the site's Material theme runs a 125% rem base,
20px, so its `28rem` computes to 560px against the plugin's 16px-rem 448px). Comment
updated with the arithmetic.

**Compared:** `after-r1-full-01-columns-wide--light.png` (mount widened to 1400px, same
technique round 0 used) packs cleanly into two independently-sized columns, matching the
site's own packing behaviour; no forced-row dead space. The specific 28-vs-35rem
breakpoint difference is not usually visible at a single fixed test width (both values
happen to fit exactly 2 columns at 1400px — verified by an isolated probe against the
unmodified `1b22e41` commit at the same width and mount size), so the fix is
regression-guarded by I3's sheet-grep test (`columns: 35rem` present, `28rem` absent)
rather than by a dramatic visual diff.

## M7 and M8 — untouched, per the brief

M7 (two diamonds within ~10px in flat mode — the eyebrow's own `◆` plus the new
separator) is explicitly a Scott-facing design question in the review, not a defect. M8
(the `theme-print.test.ts` narrowing) was explicitly confirmed legitimate by the review
itself, with only a fragility note attached — the brief excludes it by name.

## Verification method for "before" states

Two of this round's findings (C1, I1) needed a genuine "before" comparison, and the
existing `shots-after/` directory from round 0 turned out to be ambiguous to eyeball at a
glance (the ledger "before" shot's full-width stacked rows are easy to misread as
side-by-side at first look). Rather than trust a stale capture, both defects were
**reproduced live**: `git worktree add` a temporary, isolated checkout of the unmodified
`1b22e41` commit (not this worktree — no file here was touched), `npm run harness:build`
+ a local static server there, then the same attribute-stamping technique
`sc146-fix-shots.cjs` uses (`root.setAttribute('data-dse-sb-stats', 'ledger')` etc.) plus
one direct `getComputedStyle` probe (`.dse-sb__grid` → `display: block`, confirmed). The
temporary worktree and its server were removed after capture; `git worktree list` and
`git status` in the real worktree are unaffected.

## Battery (verbatim)

- **tsc**: clean, no output, exit 0.
- **lint**: clean (only the pre-existing `.eslintignore` deprecation notice), exit 0.
- **jest**: `Test Suites: 1 skipped, 159 passed, 159 of 160 total` / `Tests: 1 skipped,
  2514 passed, 2515 total` / `Snapshots: 3 passed, 3 total`, exit 0. (+11 over round 0's
  2504 total: 7 new regression-guard tests in `pref-reflection.test.ts` + 4 tests that
  now exercise the new fixture wiring implicitly via existing element/fixture-list
  assertions.)
- **shots**: 254 PNGs written (was 234), 0 `FAIL` — the 20 new files are the four new
  statblock fixtures × 5 combos (legacy-dark/light, steel-dark/light, steel-print).
- **freeze**: `freeze OK (149/149 legacy+print PNGs byte-identical)`, exit 0 — widened
  from 137 (additions only, documented in `check-freeze.sh`).
- **parity**: `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).` exit 0 — same
  16 declarations as round 0 (FOLLOWUPS #39/#40/#51), composition unchanged.

Obsidian shots (`npm run obsidian-shots`) were not run — no display available in this
environment, per the skill's guidance.

## Fix-round-1 screenshot inventory

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc146/shots-after-r1/`
(captured via `fix-shots/sc146-fix-shots-r1.cjs`, same harness/local-server technique as
round 0, extended to also shoot the dark scheme):
- `after-r1-stats-01-sbstats-ledger--{light,dark}.png` — I1: two-column ledger restored.
- `after-r1-stats-02-sbstats-gridc--{light,dark}.png` — C1: value-over-label restored.
- `after-r1-stats-03-preset-sourcebook--{light,dark}.png` — Sourcebook preset re-verified
  (unaffected by this round's changes, still ledgers the correct block, now with the
  two-column I1 fix applied).
- `after-r1-stats-04-preset-index--{light,dark}.png` — I2: Index preset now shows Grid
  (centered), not plain Grid.
- `after-r1-feat-01-featstyle-flat--{light,dark}.png` — M1+M2: diamond spacing and halo
  colour.
- `after-r1-full-01-columns-wide--{light,dark}.png` — M6: 35rem two-column packing.
