# SC-127 round 2: design report (print preview draws its own paper)

**Executive summary**
1. Cause 1, nothing paints the element root in print: `styles-source.css:7026-7050` (the Steel card plate `background: var(--dse-card-bg)`, which the print value block sets to `none` at `:14231` and `:14168`), `:7176-7178` (statblock root `transparent`), and `:7030-7044` (the tracker-family plate, `:not([data-dse-print="on"])`). Black ink therefore lands on Obsidian's dark page.
2. Cause 2, inherited ink comes from the host: `:7283-7290` (the root's `color: var(--dse-fg)` is screen-only), so every node without its own `color` inherits `.markdown-preview-view { color: var(--text-normal) }` (pinned app.css:4464), which is pale grey `#dadada`. That reads pale-on-white wherever a `--dse-surface` panel does paint: negotiation `:2482`, `.dse-tabs__panel :13487`, initiative rows, condition chips.
3. Cause 3, the r1 "white signature-ability box" comes from `:hover`, not a background image: `:210-212` `.dse-feature__nested > .dse-feature:hover { background-color: var(--dse-surface-raised) }` (white in print) under r1's parked camera pointer. I reproduced it in the harness: white box, text `rgb(218,218,218)`. The pale text inside it is cause 2.
4. Cause 4, native controls stay dark: app.css:8228 (inputs), :7199/:7219 (`<button>`), :14009 (checkboxes), and `color-scheme: dark` all read Obsidian's dark tokens.
5. **Recommend option A: paper plus ink on the root, and Obsidian's own tokens re-pointed to light values, dark vault only. No frame.** In the dark twin, text below 4.5:1 drops from 162 nodes to 7. The 7 left are the pre-existing role chip (2.59:1), which fails identically in the light twin and in realprint.
6. **Realprint lines moved: 0 for A, B and C** (full sweep, all 130 `*--steel-realprint.png` sha256 identical to base). **Predicted twin lines moved: 130 of 130 `*--steel-print.png`** for each option. The A hashes are deterministic across 2 sweeps. The rebaseline is 130 of the 260 freeze lines.
7. Taste calls for Scott: (a) frame or no frame, A vs B; (b) if a frame, a grey hairline (B) vs a soft shadow (Bshadow). The shadow cannot be seen on the dark desk. (c) Margin size; 12px was rendered.
8. PNGs are in `.superpowers/sdd/sc127/r2/` (101 files): `before-*`, `A-*`, `B-*`, `Bshadow-*`, `C-*` × 9 captures × dark/light, `target-*-realprint` × 9, and 2 `evidence-hover-*`. There is one patch per option in the ledger directory.
9. Round 3 must also carry a shoot.mjs gate exemption (it is in every patch), because the screen-only paper differs from realprint on the root. Separately, I found a pre-existing gate hole: 73 of 75 element roots count as `nativeControlAdjacent` because of the hidden chrome buttons (see §5).

---

## 1. Method (everything measured; nothing is inferred from source alone)

- Worktree `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`, branch `sc127-print-preview` at `e4bcd0f`. It was clean at the start and is clean at the end: `git status --porcelain` is empty, only ignored `visual-harness/{dist,shots}` changed, and nothing was committed.
- Baseline full `npm run shots`: 524 PNGs, every in-run gate OK, and `check-freeze.sh` reported `freeze OK (260/260)`. A second baseline sweep gave identical hashes (deterministic).
- Scratch tools (not committed) in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3a3267bf-ca7b-4859-a161-38ee3f6c31da/scratchpad/sc127r2/`:
  - `probe.mjs` measures WCAG contrast per text node, walks up to the effective painted background, and uses CDP `CSS.getMatchedStylesForNode` to find the winning `color` rule.
  - `census.mjs` lists the host `var(--*)` tokens read by rules that match plugin DOM, across 34 fixtures.
  - `render.mjs` renders the review PNGs: element plus 24px of desk. It grows the viewport to the content so the harness-only white area below the fold never shows.
  - `dumpdiff.js` diffs twin vs realprint node by node over `assertPrintTwinDelta`'s own snapshots. I got those with a temporary, since-removed `SC127_DUMP` hook in `shoot.mjs`, over full sweeps of base, A, B and C.
- The light-vault print preview was captured by my renderer with `bg=light&print=1&sheet=1`. The COMBOS were not touched.

## 2. Task A: diagnosis

### 2.1 Contrast, dark-vault twin, before the fix

Count of text nodes below 4.5:1, per capture: statblock-charline-two 40, statblock villain-corpus 25, feature 9, featureblock 8, hero 20, initiative 8, montage 4, negotiation 36, encounter 12.

The light twin and realprint had 0–5 each. Those 5 are the role chip (§6.1), not this bug.

### 2.2 Failing nodes grouped by the rule that supplies their colour (CDP, dark twin)

| Nodes | Ink rule (winning) | Ink → background | Why |
|---|---|---|---|
| 16+5 | `.dse-head__primary--left { color: var(--dse-heading) }` (`:13627`) | black on `rgb(28,28,28)` 1.23:1 | print sets `--dse-heading: #000`; the root is unpainted |
| 13 | `.dse-section__title` (`:186`, `--dse-heading`) | black on dark, 1.23 | same |
| 15 | `.dse-sb__char-l` (`:2994`, `--dse-fg-muted`) | dark grey `#333` on dark, 1.35 | same |
| 10 | `.dse-sb__item-l` (`:2775`, `--dse-fg-muted`) | #333 on dark, 1.35 | same |
| 6 | `.dse-sb__kv-l` (`:2795`, `--dse-heading`) | black on dark | same |
| 12+6 | `.dse-head__eyebrow, .dse-head__deck` (`:13620`, `--dse-fg-muted`) | #333 on dark | same |
| 4 | `.dse-pr__head` (`:13664`) | black on dark | same |
| 7/5/3/2/… | hero region title / encounter `th` / hero meta / initiative round / encounter heading | black or #333 on dark | same |
| 18+8+8+6+2+1… | **inherited** from app.css `.markdown-preview-view { color: var(--text-normal) }` | pale grey `#dadada` on white, 1.40:1 | the root's `color: var(--dse-fg)` is screen-only (`:7283-7290`); white comes from the `--dse-surface` panels (negotiation root `:2482`, `.dse-tabs__panel :13487`, `.dse-init__row`, `.dse-cond-chip`) |
| 8 | `.dse-pr__badge { color: var(--dse-badge-fg) }` → inherits host ink | pale on white | same inheritance |
| 8 | `button.dse-pr__row` → app.css `button:not(.clickable-icon) { color: var(--text-color) }` | pale on white | a host control token |
| 1 | app.css `h4 { color: var(--h4-color) }` (`--h4-color: inherit`) | pale on white | inherits host ink |
| 7+3+4 | UA `fieldtext` on checkboxes (`color-scheme: dark`) | white "ink" on white | a host control |

Plugin-owned ink that reads correctly (from `--dse-fg`/`--dse-heading`) needs no change. It fails only because it has no paper under it. Body text that took the host ink passed on the dark page (12.19:1) only by accident.

### 2.3 What leaves the root transparent

The `@media print` block's ink-saving `background: none` is not the cause. The cause is that no print-tier rule gives the root a background:

- **Feature, featureblock, `.dse-sb`**: `:7026-7050` paints `background: var(--dse-card-bg)`, and the print value block sets `--dse-card-bg: none` (twin `:14231`, @media `:14168`). That rule wins at (0,3,0) over the base (0,2,0) `background: var(--dse-surface)` (`:93`, `:2728`). The result is transparent. Measured on the feature root: `rgba(0,0,0,0)`.
- **Statblock root**: `[data-dse-theme='steel'][data-dse-element='statblock'] { background: transparent }` (`:7176`).
- **Initiative, encounter, montage, project, party, counter, hero-family**: the plate arm `:7030-7044` is `:not([data-dse-print="on"])`, and no print replacement exists.
- **Negotiation**: its base `:2482` paints `var(--dse-surface)`, which is white. This is why r1 saw it as a white card with pale ink.

### 2.4 The white signature-ability box (r1 said "background-image")

It is `:210-212`, the Legacy-era base hover rule, which is not print-excluded. `--dse-surface-raised` is `#fff` in print. r1's camera left the pointer over the first statblock ability and over the feature's nested card.

Harness reproduction (Playwright hover on `.dse-feature__nested > .dse-feature`, dark twin): `background-color: rgb(255,255,255)`, `background-image: none`, text `rgb(218,218,218)`. See `r2/sc127-r2-evidence-hover-before-feature-dark.png`.

Under A the same hover shows text `rgb(0,0,0)`, and the box is white on white, so it cannot be seen (`…evidence-hover-A-feature-dark.png`). No separate fix is needed. Optionally, round 3 could anchor that hover under `:not([data-dse-print="on"])`, or point it at `--dse-hover` (transparent in print).

### 2.5 Native controls that stay dark in the dark-vault preview (before the fix)

- **Inputs** (`.dse-stepper__input`, initiative quick-add, montage/party/project inputs). App.css:8228 wins over the plugin: `background: var(--background-modifier-form-field)` `#2e2e2e`, `color: var(--text-normal)` `#dadada`, border `--background-modifier-border` `#333`. They render as dark charcoal fields with pale digits.
- **`<button>`** (pr rows, initiative turn toggles, the malice-log header, collapse headers). App.css:7199/:7219: `--text-color` → `--text-normal`, `background-color: var(--interactive-normal)` `#333`, and the dark `--input-shadow`. The malice-log header under option C is charcoal text on a charcoal button, 1:1.
- **Checkboxes**. App.css:14009 border `--checkbox-border-color` (`--text-faint`, dark `#666`); checked fill `--checkbox-color`; UA `fieldtext` under `color-scheme: dark`.
- **Links** (`--link-color` → dark `--text-accent`, a light lavender `rgb(166,138,249)`), and tables (`--table-header-color`, `--table-border-color`).

### 2.6 Harness-only white region below ~1140 CSS px

**Mechanism.** Pinned app.css makes `body` exactly viewport-tall (1200px) with `overflow: clip`. The `.markdown-preview-view` wrapper is a 1200px `overflow: auto` scroller (measured: html 1200px transparent; body 1200px `rgb(28,28,28)` clip; wrapper 1200px). A `#mount` that is 2102px tall is captured beyond the viewport by Playwright's element screenshot, and nothing paints past 1200px, so that area comes out white.

**Worth fixing?** No. With paper under any option, the element root covers the whole `#mount` crop. On the A/B sweep, `statblock-charline-two--steel-print.png` and `montage--steel-print.png` have 0 dark pixels below 1200 CSS px, and the white there is paper. If you want a cheap honest fix anyway, grow the viewport to the content before the print-twin screenshot, as my `render.mjs` does. That moves twin bytes only, and those move anyway.

## 3. Task B: the options (rendered)

The patches live in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`. Each is `git apply --check`-clean against `e4bcd0f`. The CSS is inserted just after the print RULES twin block (after `:14402`, before "Sidebar-width layout adaptations").

### Option A: paper and ink on the root, plus Obsidian tokens re-pointed (patch `sc127-r2-option-A.patch`, +113 lines)

- `[data-dse-element][data-dse-element][data-dse-print="on"][data-dse-print="on"] { color: var(--dse-fg) }` applies on screen and in real print.
- `@media screen { same { background: var(--dse-page-bg) } }` applies on screen only (see the real-print row below for why).
- `.theme-dark [data-dse-element][data-dse-print="on"][data-dse-print="on"] { color-scheme: light; …49 declarations… }`. These restate Obsidian 1.13.7's `.theme-light` palette (`--color-base-00…100`, `--mono-*`, `--color-accent-1/2`, `--input-shadow(-hover)`). They also re-declare the body-level mappings the census found the plugin consumes, so those re-resolve at the root: `--background-primary(-alt)`, `--background-secondary`, `--background-modifier-border|form-field|hover`, `--text-normal|muted|faint|accent`, `--interactive-normal|hover|accent(-hover)`, `--link-color`, `--link-external-color`, `--checkbox-*` (5), `--table-header-color`, `--table-border-color`, `--code-normal|background`, `--icon-color`, `--blockquote-border-color`. Re-declaring the mappings is required because Obsidian declares `--text-normal: var(--color-base-100)` on `body`, and custom properties inherit the already-resolved dark value.
- **Result, dark twin**: text below 4.5:1 is 0 on feature, featureblock, hero, initiative, montage, negotiation (both fixtures) and encounter. It is 5 and 2 on the statblocks, all the pre-existing role chip. The counts are identical in the light twin and realprint.
- **Convergence**: dark twin vs light twin, node by node inside element roots, gives 0 property differences. The only differences left are the 3 harness wrapper nodes per capture (`#mount`, `.dse-harness-section`, and the pipeline div), which sit outside the root.

### Option B: A plus a visible sheet (patch `sc127-r2-option-B.patch`, +129 lines)

- Everything in A, plus `@media screen { [data-dse-element][data-dse-print="on"][data-dse-print="on"]:not([data-dse-element] [data-dse-element]) { box-shadow: 0 0 0 12px var(--dse-page-bg), 0 0 0 13px #bbb } }`. That is a paint-only 12px white margin and a light grey hairline on the outermost root. It causes no layout change, so geometry still matches paper.
- The `Bshadow-*` variant swaps the hairline for `0 2px 14px 12px rgba(0,0,0,.55)`. It is a one-line swap and is not a separate patch.
- On the dark desk the shadow is invisible: a dark shadow on a dark page. It shows only in a light vault.
- The frame is visible in only 62 of 130 frozen twin crops. The `#mount` crop clips the ring wherever the root fills the mount, so the freeze gate covers B's frame only weakly.
- The frame paints 13px outside the element box, over neighbouring note content (Obsidian's block gap is roughly 16px).

### Option C: minimal (patch `sc127-r2-option-C.patch`, +50 lines)

- A's paper and ink rules only. Native controls stay host-themed.
- **Result, dark twin**: the plugin's ink is fixed everywhere, as in A. Native controls remain dark on the white sheet:
  - Ferocity/Surges steppers are charcoal fields with pale digits (`C-hero-dark.png`).
  - Initiative's malice-log header button is charcoal with charcoal text, 1:1, so the "Malice log · no entries" label disappears. The quick-add inputs are charcoal (`C-initiative-dark.png`).
  - Minion cells take the dark `--color-base-30` fill.
  - Negotiation checkboxes are dark-scheme.
  - 232 link nodes in 22 captures keep the dark-theme lavender instead of the light violet.
- Full sweep: 759 control-adjacent nodes still differ in `color` twin vs realprint, 325 in `backgroundColor` and 428 in `boxShadow`.

### Per-option facts table

| | A | B | C |
|---|---|---|---|
| Real print (`@media print`, attribute stamped by printMedia.ts) | ink rule is a no-op (the print sheet already inherits black, `.print .markdown-preview-view{color:initial}`); paper is `@media screen`; the host block is `.theme-dark`-scoped and real print always forces `theme-light` | as A; the frame is `@media screen` | as A minus the host block |
| realprint sha256 moved (full sweep, 130 files) | **0** | **0** | **0** |
| twin `*--steel-print.png` moved vs base | 130/130 | 130/130 (62 differ from A) | 130/130 |
| twin deterministic (2 sweeps) | yes (A) | not re-swept | not re-swept |
| `assertPrintTwinDelta` | OK with the patch's exemption | OK (+ boxShadow exemption) | OK with the exemption |
| other in-run gates (corner, chrome, host-copy pin, 7 host-leak sweeps) | all OK | all OK | all OK |
| dark-vault preview readable | yes | yes | plugin ink yes, native controls no |
| light-vault preview | ink `#222`→`#000` (= realprint), otherwise unchanged | + frame | as A |

**Why the paper is `@media screen`, measured.** My first cut put `background` in the universal rule. That moved 91 of 130 realprint PNGs. Every change was at most 1/255 per channel on a handful of antialiased text pixels, because the text is re-rasterised over an opaque layer (e.g. hero 47 px, statblock-villain 11 px, negotiation 0 px since its root was already white). The ruling says realprint must not move, so the paper is screen-only, and the delta gate needs the one exemption below.

## 4. Specificity plan (the (0,4,0) padding convention)

- **Paper and ink**: `[data-dse-element][data-dse-element][data-dse-print="on"][data-dse-print="on"]` is (0,4,0).
  - It beats the Steel plate at (0,3,0), `[data-dse-theme='steel'][data-dse-element='feature']:not([data-dse-error-stage])` (`:7027`), the statblock `transparent` at (0,2,0) (`:7176`), and the base surfaces at (0,2,0).
  - It uses no `!important`.
  - It is spelled differently from `NEUTRAL_TWIN_SELECTOR` on purpose. `theme-print.test.ts` (first-match regex plus `declMap` equality) and `token-coverage.test.ts` (`/\[data-dse-element\](?:\[data-dse-print="on"\])+\s*\{/`) find the value block by exact text, and neither matches the new rule.
- **Host block**: `.theme-dark [data-dse-element][data-dse-print="on"][data-dse-print="on"]` is (0,4,0). It only competes with Obsidian's body-level declarations, which reach the root by inheritance, so any rule on the root wins. Nested roots also match, which is harmless.
- **B frame**: (0,5,0) via `:not([data-dse-element] [data-dse-element])`. It beats the twin's `box-shadow: none` at (0,3,0)/(0,4,0) (`[data-dse-print="on"][data-dse-theme='steel'][data-dse-element='feature']`, `[data-dse-theme='steel'][data-dse-print="on"] .dse-sb`).

## 5. Gates and jest guards

**Jest.** With patch A applied, every suite that reads `styles-source.css` or `shoot.mjs` passes: 64 suites, 1929 tests, including `theme-print`, `token-coverage`, `printTwinDeltaAllowedSet`, `print-media`, `kit-index` and `steelTypography`.

- `token-coverage`: no change needed. No `--dse-*` token is added or changed, and the new selectors don't match its regex.
- `PRINT_INVARIANT` (`theme-print.test.ts`): no change. No `--dse-*` token is added.
- `theme-print`: no change. The distinct selector spelling keeps its value-block regexes and the `declMap` media-vs-twin equality intact.
- `printTwinDeltaAllowedSet`: no change. The four-name set is untouched, because the exemption is node-scoped, like `nativeControlAdjacent`.

**New guards to add in round 3 (not in the patches):**

- (a) A `theme-print` test that the paper rule exists at (0,4,0) with `color: var(--dse-fg)`, and that its `background: var(--dse-page-bg)` sits only under `@media screen`, never in an `@media print` block.
- (b) An in-run check, next to the host-copy pin in `shoot.mjs`, that the host block's palette literals equal the resolved pinned sheet's `.theme-light` block. Otherwise a pin bump silently leaves stale values. jest cannot do this, because the sheet isn't in git.
- (c) A can-fail self-test for the paper exemption. A synthetic root with a non-white background must fail, and a descendant painting white-vs-transparent must fail.

**`assertPrintTwinDelta` exemption, in every patch** (`shoot.mjs`):

- The snapshot gets `printPaperRoot: n.matches('[data-dse-element][data-dse-print="on"]')`.
- `backgroundColor` is excused only when both are paper roots, the twin is `rgb(255, 255, 255)`, and realprint is transparent or white.
- B adds `boxShadow` on the paper root vs realprint `none`.

**What the gate can tighten after A.** Residual twin-vs-realprint differences across all 130 capture ids (from the `dumpdiff` of full sweeps, before → after A):

| property | base | A | why it still differs |
|---|---|---|---|
| `color`, plugin DOM (inside roots + roots + control-adjacent) | 11110 + 130 + 2545 nodes | **0** | converged |
| `color`, harness nodes (`#mount`, `.dse-harness-section`, pipeline div) | 390 | 390 | outside the element root; body ink |
| `backgroundColor` on control-adjacent nodes | 316 | 9 (the 2nd+ roots of stacked captures, i.e. paper) | converged |
| `boxShadow` on control-adjacent nodes | 428 | 0 | converged |
| `backgroundColor` on roots | 0 | 127 (paper, excused) | screen-only paper |
| `fontFamily` | 14173 / 3381 / 130 / 390 | unchanged | print sheet `--font-text: var(--font-print)` fallback tail; cannot converge without moving realprint |
| `webkitPrintColorAdjust` | 13478 / 3383 / 130 / 390 | unchanged | `.print .markdown-preview-view { -webkit-print-color-adjust: exact }` inherited; cannot converge |
| `backgroundImage` | 1 (perk-links external-link icon) | 1 | `.print .external-link { background: none }` |

Tightening this makes possible (a follow-up or round 3's call; each step would need the `printTwinDeltaAllowedSet` floor test updated deliberately):

- (1) Excuse `color` only on nodes outside an element root.
- (2) Delete the `NATIVE_CONTROL_PAINT_PROPS` widening (`backgroundColor`/`boxShadow`), since control paint converges under A.
- (3) Fix the hole below.

Neither (1) nor (2) is possible under C.

**Pre-existing gate hole (Medium).** `captureMountSnapshotForPrintDelta`'s `nativeControlAdjacent` looks two levels down for `<input>`/`<button>`. The hidden `.dse-chrome` panel's buttons are children of almost every element root, so the root itself qualifies: 73 of 75 element×fixture roots (the exceptions are horizontal-rule and roll). Every root's `backgroundColor`/`boxShadow` twin-vs-realprint difference is therefore excused.

Proof: option A's screen-only root paper with the SC-127 exemption removed still printed `print-twin delta OK` on `--element=feature`. A Steel rule leaking a root paint into only one print surface would pass silently.

Fix: skip unrendered descendants in the adjacency walk (for example `c.getClientRects().length === 0` or `display: none`), then keep the precise paper exemption.

## 6. Other findings (not this bug)

1. **Role-chip ink fails on paper (pre-existing, all print surfaces).** `.dse-head__primary--right { color: var(--dse-role, var(--dse-heading)) }` (`:13604`/`:13640`) renders "Leader", "Signature Ability" and "Villain Action N" in light grey `rgb(154,162,168)` on white. That is 2.59:1 in the light twin, the dark twin and realprint alike. It deserves its own ticket, because fixing it moves realprint.
2. **The white hover in print preview** (`:210-212`). See §2.4. With paper it can't be seen, and it is optional to anchor it out of print.
3. **Host palette duplication (cost of A).** The 49 literal/mapping declarations are tied to the Obsidian 1.13.7 pin. With a custom dark theme, the preview's native controls use Obsidian's default light values, not the theme's light variant. The light vault and real print are unaffected, because the block never matches there.

## 7. Per-block overrides

`printPreview` is `attr: 'print'` with no `perBlock: false` (`src/prefs/catalog.ts:212`), so `prefs: { printPreview: on }` in one block is allowed by `src/framework/prefOverrides.ts` (it rejects only attr-less and `perBlock: false` keys).

All three options key everything on the element root that carries `data-dse-print="on"`, so a single overridden block gets its own sheet. Nothing assumes a whole-note toggle. The only global input is the `body.theme-dark` class in A's host block, and that describes the vault, not the toggle.

## 8. Recommendation: A

**Why A:**
- It fixes every measured failure: the dark twin is now as readable as the light twin and realprint.
- It makes the preview's native controls look like the exported page's: light fields, buttons and checkboxes.
- It moves 0 realprint bytes, with no frame to hide on paper.
- It is the only option that lets the delta gate drop `color` and the control-paint widening for plugin DOM.

**Why not C:** it leaves charcoal steppers and buttons (one of them 1:1 unreadable) and dark-theme checkboxes and links on the white sheet.

**Why not B:** it adds an ornament paper never shows. That ornament needs its own gate exemption, is invisible in 68 of 130 frozen crops, and overlaps neighbouring note content. Its shadow variant disappears on the dark desk. Whether the preview should look like a page on a desk is a taste call for Scott, so both are rendered.

## 9. Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r2-design-report.md`
- Patches: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r2-option-{A,B,C}.patch`
- PNGs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r2/`
  - `sc127-r2-{before,A,B,Bshadow,C}-{statblock-charline-two,statblock-villain,feature,featureblock,hero,initiative,montage,negotiation,encounter}-{dark,light}.png` (90 files)
  - `sc127-r2-target-<same 9>-realprint.png` (9 files)
  - `sc127-r2-evidence-hover-{before,A}-feature-dark.png` (2 files)
  - `statblock-villain` is the `villain-corpus` fixture (it has the Signature Ability). `negotiation` is the `checked` fixture.
- Scratch (not durable): full-sweep logs `full-{base,base2,A,A2,A3,B,C}.log`, hash files `hash-*.txt`, snapshot dumps `dump-{base,A,B,C}.json`, the probe/census/render scripts, all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3a3267bf-ca7b-4859-a161-38ee3f6c31da/scratchpad/sc127r2/`.
