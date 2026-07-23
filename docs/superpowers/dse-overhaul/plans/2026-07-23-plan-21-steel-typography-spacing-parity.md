# Steel Typography & Spacing Parity (plan-20 follow-up) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

> **STATUS 2026-07-23: DRAFT — READY TO EXECUTE.** Written against `draw-steel-elements`
> main @ `13e50a0` (6.0.0, unreleased — plan 20 landed) and the live site at
> steelcompendium.io/v2. Baselines: tsc clean · jest **2005** (143 suites) · shots **164** ·
> obsidian-shots **131** · parity **0 GAPs / 0 WARNs** (dark+light).

**Goal:** Close the *typography and spacing* gap between the plugin's Steel theme and the live
site — body font, line-height, padding/margins, ink — that plan 20's material layer left
untouched, and extend the parity gate to measure and guard those categories so they can't
silently regress.

**Architecture:** Plan 20 ported the *material* layer and installed a parity gate that only
compares three material properties (flat-vs-gradient background, bevel, hairline). That gate is
**blind by design** to font, size, whitespace, hue and layout — which is exactly why the theme
reads "cramped and sans" against the site's "open and slab" while the gate shows 0 gaps. This
plan (a) **extends the gate first** so those categories become measurable GAPs; (b) closes the
cross-cutting spacing/ink gaps on the shared primitives; (c) closes the body-font gap by routing
body/label text to the serif token the titles already use; (d) rebuilds the one high-visibility
structural family (kit) that the material work couldn't touch. Full evidence:
[`../2026-07-23-steel-ui-gap-inventory.md`](../2026-07-23-steel-ui-gap-inventory.md).

**Tech Stack:** TypeScript/CSS (`draw-steel-elements`), Playwright (devDependency — drives the
parity capture), Node ESM tooling under `visual-harness/parity/`, jest + jsdom for the assertion
gates.

---

## Why this is a new plan, not a gate bug

The plan-20 gate is working exactly as specified — it caught and guards the flat-surface
regression. It was never meant to check typography or spacing; the plan-20 reviews said so, and
plan 20's changelog was corrected to state it plainly. So the gaps below are **new scope**, not
a defect. The first thing this plan does is widen the ruler (Task 1) so the rest is measured, not
eyeballed — the same "gate first, then fix to it" sequence that made plan 20 robust.

## Decision: font — route body to the existing serif, don't bundle (yet)

The site's body face (`BerlingskeSlab-DBd`) is licensed and un-bundleable. Two options were
considered:

- **(chosen) Route card body + label text to `--dse-font-display`** — the serif token the plugin
  already uses for titles ("Source Serif 4"). The site uses one face for titles *and* body, so
  this matches its structure, needs **no new asset**, and is one line of CSS per surface. It is
  a serif, not a slab, so fidelity is ~80%, not 100%.
- **(deferred) Bundle a free slab** (Zilla Slab or Bitter, both OFL) as a subsetted `@font-face`
  and remap `--dse-font-display` to it — upgrades titles *and* body to true slab in one token.
  This is a self-contained follow-up (one token + one asset) that can be taken once the routing
  lands and Scott has seen it. It is **out of scope here** to avoid shipping an asset + a large
  visual change at once (the plan-20 "two risky things" rule).

**Sign-off point:** Task 3 implements the chosen routing only. If Scott wants the slab upgrade,
it becomes its own task/plan — do **not** bundle a font in this plan without explicit direction.

## Scope: what this plan does and does NOT do

**In scope:** the cross-cutting A-series (font/line-height/padding/margin/ink — inventory §A) and
the kit structural rebuild (FOLLOWUPS #32 — the single most visible layout gap), plus the gate
extension that guards the A-series.

**Deliberately deferred to a follow-on plan** (already filed, lower-impact, and the A-series
improves them for free via shared tokens): featureblock option layout (#33), the standalone
ability-spine decision (#34), the statblock notch (#35), and the plugin-only-family coherence
pass (inventory §C). Bundling them here would balloon the visual-change surface. **Tasks 1–3 are
a complete, independently shippable increment** (pure CSS + tooling, no DOM); Task 4 (kit) is the
only DOM task and can slip to its own plan without blocking the A-series value.

## Global Constraints

- **LEGACY-FREEZE is absolute.** Every `visual-harness/shots/*--legacy-{dark,light}.png` must
  stay **byte-identical** across every task. All new CSS is scoped under
  `[data-dse-theme='steel']` (single quotes — the file's convention; a double-quoted selector
  matches nothing).
- **`*--steel-print.png` must also stay byte-identical.** Scope new rules with
  `:not([data-dse-print="on"])` as the existing Steel rules do.
- **The plan's inherited freeze check is vacuous** — `visual-harness/shots/` is gitignored
  (0 tracked files), so `git status --porcelain visual-harness/shots/` can never fail. Use the
  real byte check established in plan 20: run `npm run shots`, then
  `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh`
  (compares 98 legacy+print PNGs against a sha256 baseline; expect `freeze OK (98/98 …)`). If it
  reports a violation, **fix the selector scope — never rebaseline.**
- **No DOM/TS changes in Tasks 1–3** (CSS + tooling + tests only). Task 4 (kit) is the sole
  DOM task and MUST be TDD: a failing jest test first, and the 2005-test suite + goldens stay
  green. If any Task 1–3 fix appears to need markup, STOP and report it — do not edit `src/`.
- **No new runtime dependencies.** Playwright is already a devDependency.
- **Never fabricate a value.** Every number written into the plugin must trace to the captured
  inventory (`visual-harness/parity/baseline/site-inventory.json`), a fresh live-site
  computed-style capture, the live stylesheets, or an existing `--dse-*` token. The
  rem-base mismatch (site 20px, plugin 16px) means you match the **px/em target**, not the
  site's rem literal — cite the target in a CSS comment.
- **Never silence a gap.** A parity GAP is closed by fixing CSS/DOM, or by a numbered
  `FOLLOWUPS.md` entry — **never** by editing `selector-map.json` to stop looking, weakening a
  `diff.mjs` rule, or narrowing a tolerance to hide a real miss. Widening coverage is
  encouraged; narrowing is forbidden.
- **The gate compares BOTH schemes** (plan 20's final fix wave). Any new `diff.mjs` rule must
  run for dark **and** light, and the two capture scripts' property lists must stay
  **byte-identical** or the inventories aren't comparable.
- **Environment:** every command runs through devbox from the repo, wrapped in `bash -c` because
  `devbox run --` ignores the surrounding `cd` (and `$PIPESTATUS`/`${var:-x}` break under its sh
  wrapper — use plain forms):
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && <cmd>'`
  (execution happens in a worktree — substitute that path; see Execution).
- **Commit messages carry no AI/Claude attribution or co-author trailers** (project rule).
- **Gates after every task:** `npm run tsc` clean · full `npx jest` green (baseline **2005**,
  plus tests a task adds) · `npm run shots` runs clean · Legacy/print freeze proven by
  `check-freeze.sh` · `npm run parity` at its expected state for that task.

## Execution

**Worktree (required — never edit the shared main checkout).** From
`/home/scott/code/steelCompendium/workspace`:

```bash
devbox run -- bash -c 'just wt-new steel-type'
```

All work happens in
`/home/scott/code/steelCompendium/worktrees/steel-type/draw-steel-elements` (branch
`steel-type`). Run `npm ci` there before the first build. **Substitute this worktree path for
the `…/workspace/draw-steel-elements` path in every command below.**

**Stop condition: do NOT land this branch.** Finish the final task, then report. Scott lands it
with `just wt-finish steel-type` from the MAIN checkout — verifying the superproject pins first
(a long-lived worktree's pins go stale as main advances).

**Natural early check-in: after Task 3.** The A-series is where "cramped + sans" should visibly
become "open + slab." Read the demo-vault/harness shots against the site references then; if it
doesn't look right at Task 3, Task 4 won't rescue it — surface it.

**Final report must include:** commit sha per task · the parity GAP count at Task 1 baseline vs.
final · final gate numbers (tsc / jest / shots / obsidian-shots / parity) · the per-family visual
verdicts · anything deferred to `FOLLOWUPS.md` with its number.

## File Structure

**Modified — gate tooling (`draw-steel-elements/visual-harness/parity/`):**
- `site-capture.mjs` / `plugin-capture.mjs` — add spacing props (`padding-*`, `line-height`) to
  the shared `PROPS` list (must stay byte-identical between the two).
- `diff.mjs` — add value-distance rules (font-size, line-height, padding) and a body-font rule
  (plugin sans where site serif), running for both schemes.
- `baseline/site-inventory.json` — regenerated with the new props (deliberate; review the diff).
- `README.md` — document the new rule classes and tolerances.

**Modified — the type/space layer:**
- `draw-steel-elements/styles-source.css` — Steel token additions (`--dse-font-body`, ink
  tokens) + spacing/line-height rules on the shared primitives.
- `draw-steel-elements/test/dom/theme/steelMaterial.test.ts` (or a sibling
  `steelTypography.test.ts`) — computed/rule-text assertions for the type/space contract.

**Modified — kit structure (Task 4, DOM):**
- `draw-steel-elements/src/elements/display/…` (kit layout) + its test — verify the exact path
  during the task.
- `docs/superpowers/dse-overhaul/D3-token-map.md`, `CHANGELOG.md`s, `FOLLOWUPS.md` as needed.

---

### Task 1: Extend the parity gate to measure typography & spacing

Build the ruler before cutting. The gate must be able to *fail* on tight padding, short
line-height, and sans body text — otherwise Tasks 2–3 are unguarded and the plan-19/20 failure
mode (unmeasured drift) recurs.

**Files:**
- Modify: `visual-harness/parity/site-capture.mjs`, `visual-harness/parity/plugin-capture.mjs`
  (add props — keep the two lists byte-identical)
- Modify: `visual-harness/parity/diff.mjs` (new rule classes, both schemes)
- Modify: `visual-harness/parity/README.md`
- Regenerate: `visual-harness/parity/baseline/site-inventory.json`

**Interfaces:**
- Produces: an extended `site-inventory.json` + a `diff.mjs` that emits GAPs for
  type/space misses. Consumed by Tasks 2–3 (their worklist) and Task 5 (guard).

- [ ] **Step 1: Add spacing props to BOTH capture scripts.** In `site-capture.mjs` and
  `plugin-capture.mjs`, append to the `PROPS` array (they must remain identical):

```js
	'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'margin-top', 'margin-bottom', 'line-height',
```
  `font-size`, `font-family`, `color`, `letter-spacing` are already captured. Confirm the two
  `PROPS` arrays are byte-identical after the edit (diff them).

- [ ] **Step 2: Add the new diff rule classes** to `diff.mjs`, running inside the existing
  `['dark','light']` loop. Use pixel tolerances so sub-pixel rounding doesn't cause noise:

```js
// helpers: parse "27.2px" -> 27.2 ; a value is "serif-ish" if its first family is not a known sans
const px = v => (v && v.endsWith('px')) ? parseFloat(v) : NaN;
const SANS = /(-apple-system|system-ui|BlinkMac|Segoe|Roboto\b|Helvetica|Arial|sans-serif|Inter)/i;
const famHead = v => (v || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
// TYPE/SPACE rules — emit GAP when the plugin misses the site by more than tolerance.
const near = (a, b, tol) => !(Math.abs(a - b) > tol);
// font-size (chips etc.): tol 1.5px ; line-height: tol 2px ; padding: tol 3px
```
  Add, per mapped pair, for each of `font-size`, `line-height`, `padding-top/right/bottom/left`:
  a GAP when both sides parse to px and `!near(site, plug, tol)`. Add a **body-font** GAP when
  the site family head is NOT sans (serif/slab) and the plugin family head IS sans
  (`SANS.test(famHead(plug['font-family']))`). **Do not** compare the licensed family *names*
  for equality — assert the plugin uses *a* serif for body, not the exact face.
  Keep every existing material rule unchanged.

- [ ] **Step 3: Regenerate the site baseline** with the new props:

Run: `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run parity:site'`
Confirm the `site-inventory.json` diff is **additions-only** for existing selectors (new props
added; no existing captured value changed).

- [ ] **Step 4: Run parity — expect it to FAIL now, with type/space GAPs.**

Run: `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run parity'`
Expected: exit 1 with GAPs for the A-series (line-height 24 vs 27.2, card padding 16 vs ~24,
body-font sans, chip font-size 13.6 vs 18, head/row/band padding). **Record the starting GAP
count and the list** — this is Tasks 2–3's worklist. 0 WARNs (a WARN means a wrong selector;
fix the map, not by narrowing).

- [ ] **Step 5: Prove the new rules can fail AND pass** (the plan-20 lesson). In a scratch copy,
  confirm each new rule class flips exit code as expected, then confirm the unmutated tree still
  reports the real A-series GAPs. Document the checks in the commit body.

- [ ] **Step 6: Document + commit.** Update `README.md` with the new rule classes and their
  tolerances (and that font is asserted as "serif, not sans", never by name).

```bash
git add visual-harness/parity package.json
git commit -m "feat(parity): measure typography & spacing — line-height, padding, body font (N gaps baseline)"
```

---

### Task 2: Close the spacing gaps on the shared primitives

Drive the spacing GAPs from Task 1 to zero with CSS on the Steel primitives. Target the measured
px values from the inventory (§A2–A5), matching px/em not the site's rem literal.

**Files:**
- Modify: `draw-steel-elements/styles-source.css`

**Interfaces:**
- Consumes: the Task 1 GAP list.
- Produces: card/section/head/row/band spacing at the site's measured values.

- [ ] **Step 1: Confirm the real levers before editing.** `grep -nE '\-\-dse-pad:|line-height|margin-top' styles-source.css` and read the card-root rule
  (`[data-dse-element='feature']` ~line 74, `padding: var(--dse-pad)` = 16px, `margin: 0.5em`).
  Decide the cleanest lever per gap: a Steel-scoped bump on the card roots vs. adjusting a token.
  `--dse-pad` (`1rem`) is shared widely — prefer a **Steel-scoped card-padding rule** over
  changing the global token unless you verify the cascade.

- [ ] **Step 2: Line-height (A2).** Set the card body line-height to the site's 1.7 (site
  27.2px on 16px), Steel-scoped + `:not(print)`, on the card body containers (feature/section/
  statblock/featureblock/card-ref bodies). Verify it doesn't disturb the tight heads
  (`line-height: 1`/`1.04`/`1.2` rules already exist for badges/titles — leave those).

- [ ] **Step 3: Card padding + margin (A3/A4).** Steel-scoped: card-root padding to the site's
  ~24px (1.5rem) and card-to-card margin to ~24px, on `[data-dse-element='feature']`,
  `[data-dse-element='featureblock']`, `.dse-sb`, `.dse-card`. Cite the site target
  (23–25px / 24px) in a comment.

- [ ] **Step 4: Head / row / band padding (A5).** Bring `.dse-section__title`, `.dse-pr__head`,
  `.dse-pr__row`, and `:is(.dse-sb,.dse-fb) > .dse-head` padding to the site targets
  (section-head 10×18, pr-head 11×18, tier-row 11×18, band 20×24). These rules exist from plan
  20 — extend them; don't add conflicting duplicates.

- [ ] **Step 5: Rebuild + re-run parity.**

Run: `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run parity'`
Expected: the spacing GAPs cleared; remaining GAPs are Task 3's (body font, ink) and any
chip-size item you route there. Count must drop, never grow.

- [ ] **Step 6: Freeze + gates + commit.**

```bash
devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run shots && npm run tsc && npx jest 2>&1 | tail -5'
bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
git add styles-source.css
git commit -m "feat(steel): match the site's spacing — line-height, card padding/margin, head/row/band padding"
```

---

### Task 3: Close the body-font and ink gaps

Route body/label text to the serif token the titles already use, and correct the body ink to the
site's cooler values. This is the identity fix (§A1/A6/A7).

**Files:**
- Modify: `draw-steel-elements/styles-source.css`

**Interfaces:**
- Consumes: `--dse-font-display` (existing serif token, ~`styles-source.css:3140`) and the Task
  1 body-font/ink GAPs.

- [ ] **Step 1: Add a `--dse-font-body` token** in the Steel block, mapped to the serif the
  titles use, with the app sans as the ultimate fallback:

```css
	/* Site parity: the site uses ONE slab face for titles AND body (BerlingskeSlab).
	   We can't bundle it; route body/label text to the same serif the titles use. */
	--dse-font-body: var(--dse-font-display);
```
  And an inert default in the base/Legacy block so Legacy is unchanged:
  `--dse-font-body: var(--font-text);`.

- [ ] **Step 2: Apply it to card body + label text**, Steel-scoped + `:not(print)`, on the card
  body/prose containers and the small labels that currently fall to sans (verify the real class
  names in the harness DOM — e.g. `.dse-section__body`, the kit/statblock label cells). Do NOT
  touch the chip/eyebrow small-caps rules that intentionally use the small-header font. Verify
  titles are unaffected (they set `--dse-font-display` explicitly).

- [ ] **Step 3: Remove the body letter-spacing (A7).** The card body carries
  `letter-spacing: .03em` (`.dse-feature` ~line 40); the site is `normal`. Set it to `normal`
  Steel-scoped (do not touch the base rule if it's shared with Legacy — override in Steel).

- [ ] **Step 4: Correct the body ink (A6).** Set the Steel body-ink token(s) to the site
  values: dark `rgba(220,226,230,.88)`, light `rgb(44,46,48)` (verify which token the card body
  color resolves through — `grep` the current `rgb(218,218,218)`/`rgb(34,34,34)` source). Trace
  each to the site inventory entry in a comment.

- [ ] **Step 5: Rebuild + re-run parity → expect 0 GAPs.**

Run: `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run parity'`
Expected: **0 GAPs / 0 WARNs, exit 0** (dark+light). If a gap remains that needs DOM, file a
FOLLOWUPS entry — do not silence it.

- [ ] **Step 6: Read the result against the site (mandatory check-in).** `npm run shots`, then
  read `visual-harness/shots/{feature,statblock,kit}--steel-dark.png` against
  `visual-harness/parity/baseline/site-shots/{ability-powerroll,statblock-minion,kit}--dark.png`.
  Confirm body copy now reads serif + open, not sans + cramped. Report what you saw.

- [ ] **Step 7: Freeze + gates + commit.**

```bash
devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run shots && npm run tsc && npx jest 2>&1 | tail -5'
bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
git add styles-source.css
git commit -m "feat(steel): route body text to the serif face + match the site's body ink"
```

---

### Task 4: Rebuild the kit card to the site's structure (FOLLOWUPS #32)

The one high-visibility structural gap: the plugin renders kit as a bare label-value list; the
site has a crest + "◆ MARTIAL KIT" eyebrow + a stat-tile grid + a boxed Equipment panel. This is
a **DOM change** in the `display` element's kit layout — TDD, and the 2005-test suite + goldens
stay green. **This task is independent of Tasks 1–3's value; if it proves larger than one task,
split it to its own plan rather than bloating this one.**

**Files:**
- Modify: `draw-steel-elements/src/elements/display/…` (the kit layout — **verify the exact
  file** first) + its test under `test/`.
- Modify: `styles-source.css` (Steel styling for the new stat-tile grid — reuse existing tokens).

**Interfaces:**
- Consumes: the shared `cardHead` kit (`src/framework/kit/cardHead.ts`) for the crest/eyebrow
  slots, and the statblock's stat-tile grammar for the bonus grid (reuse, don't reinvent).

- [ ] **Step 1: Trace the real render path.** Find how the `display` element renders the kit
  layout (`src/elements/display/`, `layouts.ts`, `src/elements/display/kit/`). Read the site's
  `.sc-kit`/kit-tile markup + `steel-kit.css` for the exact structure (crest, eyebrow, the
  stat-tile grid, the equipment panel). Confirm the SDK kit model exposes the bonus fields
  (`deriveHeroStats.ts` already parses `stamina_bonus`/`speed_bonus`/etc. — reuse that).

- [ ] **Step 2: Write the failing test** asserting the kit render now emits: a `cardHead` with a
  crest + kind-noun eyebrow; a stat-tile grid (value + label per bonus) rather than a
  label-value list; and a boxed equipment panel. Run it, confirm it FAILS for the right reason.

- [ ] **Step 3: Implement the minimal DOM** to pass — reusing `cardHead` (crest + eyebrow slots)
  and the statblock stat-tile grammar. No new colours; Steel styling reuses existing material
  tokens. Keep the richer signature-ability sub-render.

- [ ] **Step 4: Run the full suite + goldens.** `npx jest` green (2005 + new); `npm run shots`;
  `check-freeze.sh` freeze OK. Read `visual-harness/shots/kit--steel-dark.png` against
  `visual-harness/parity/baseline/site-shots/kit--dark.png` — crest, eyebrow, stat-tile grid,
  equipment panel present. If any golden legitimately changed (the kit steel shot will), that is
  expected for kit only; legacy/print must not.

- [ ] **Step 5: Close FOLLOWUPS #32** (mark it done in `FOLLOWUPS.md`, superproject) and commit
  (submodule: src + css + test; superproject: FOLLOWUPS — separate commits, no pointer bump).

```bash
git add src styles-source.css test
git commit -m "feat(kit): render kits to the site's structure — crest, eyebrow, stat-tile grid, equipment panel"
```

---

### Task 5: Lock the type/space contract in + docs + wrap

**Files:**
- Create/Modify: `draw-steel-elements/test/dom/theme/steelTypography.test.ts`
- Modify: `docs/superpowers/dse-overhaul/D3-token-map.md`, `CHANGELOG.md` (plugin + workspace),
  the inventory doc, `FOLLOWUPS.md`.

- [ ] **Step 1: Write the contract test.** Mirror plan 20's `steelMaterial.test.ts` approach
  (comment-stripped source-text assertions over `styles-source.css`, single-quote-scope aware):
  assert `--dse-font-body` is defined and consumed on the card body; assert the Steel card
  line-height is ≥1.6; assert the card-padding rule targets ~1.5rem/24px. Each assertion must be
  proven able to fail (break the rule, watch it fail, restore) — report the evidence.

- [ ] **Step 2: Run the full battery** and record exact numbers: tsc · jest (2005 + new) ·
  shots (164) · obsidian-shots (131) · parity (0/0 exit 0) · freeze (98/98).

- [ ] **Step 3: Contact sheets + per-family verdicts.** Pair the five headline families' site
  refs with the new plugin shots into `.superpowers/sdd/shots-parity-type/`; **read every pair**
  and write an honest one-line verdict each (concrete, never "close match").

- [ ] **Step 4: Docs.** Document `--dse-font-body` + the spacing targets in
  `D3-token-map.md`; add plugin + workspace `CHANGELOG.md` bullets (accurate scope — typography
  & spacing parity for the card families, guarded by the extended gate; NOT the plugin-only
  families or the deferred structural items); update the inventory doc's status; ensure the
  deferred items (#33/#34/#35 + §C) are still open in `FOLLOWUPS.md` with a pointer to this plan.

- [ ] **Step 5: Commit** (submodule: test; superproject: docs — separate commits).

```bash
git add test/dom/theme/steelTypography.test.ts
git commit -m "test(steel): typography & spacing contract — sans/cramped surfaces now fail the suite"
```

---

## Self-review

**Spec coverage.** Inventory §A (cross-cutting) → Tasks 1 (measure) + 2 (spacing) + 3 (font/ink)
+ 5 (guard). §B kit (#32) → Task 4. §B #33/#34/#35 and §C plugin-only → explicitly deferred with
reasoning (Scope section). The "font is licensed" constraint → the font Decision + Task 3's
route-to-serif approach, with slab-bundling flagged as an out-of-scope sign-off.

**Placeholder scan.** No "TBD"/"handle edge cases". Every A-series step ships the measured target
value from the audit (line-height 27.2px→1.7, padding 16→24, margin 8→24, ink literals) with the
source. Three places instruct verify-the-name (`--dse-pad` cascade, the body-ink token, the kit
render path) — deliberate, in the plan-20 style: the plan states the asserted value + the
evidence + the failure mode if wrong, and Task 1's extended gate mechanically catches a wrong
spacing target.

**Type/name consistency.** `--dse-font-body`, `--dse-font-display`, the `PROPS` list (identical
across both capture scripts), and the `diff.mjs` rule classes are named once and reused. The
gate's dark+light invariant and the byte-identical-PROPS invariant carry over from plan 20
unchanged.

**Known risk.** The biggest risk is a spacing target that reads wrong once other rules cascade
(e.g. bumping card padding double-pads a nested card). Task 1's extended gate measures the actual
computed result, and Task 3 Step 6 / Task 5 Step 3 require reading the real shots against the site
— so a bad cascade shows up as a persisting GAP or a bad contact sheet, not a silent pass.
