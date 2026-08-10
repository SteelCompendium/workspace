# SC-123 — implementation report: porting the site's missing display settings to the plugin

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc123-settings-ports`
**Branch:** `sc123-settings-ports` (cut from `origin/main`, dse base `9fb56f5`)
**Commits (dse submodule, not landed):**

| sha | subject |
|---|---|
| `e5cdedd` | `feat(prefs): port the site's seven missing display settings (SC-123)` |
| `bac3321` | `test(harness): preference-variant captures, and a featureblock with stats (SC-123)` |

Superproject pointer bump deliberately **unstaged** (orchestrator lands).
16 files, +1284 / −67. Only two commits rather than one per setting: `catalog.ts` and
`styles-source.css` are single files touched by all seven ports, so a per-setting split
would have produced commits that don't build. The commit messages carry the per-setting
reasoning instead.

*(The Linear comment cites `26ea682`/`77165e8` — the pre-recommit shas. The tree is
byte-identical; the two commits were rebuilt because the first one had missed
`styles-source.css` from its `git add`.)*

Colour note: nothing in this report or its screenshots is distinguished by hue —
every difference described is shape/position (framed cell vs hairline row, label-left vs
label-below, boxed letter vs word).

---

## 1. What shipped

Seven preferences, each a `src/prefs/catalog.ts` descriptor consumed by the SC-131
declarative settings tab with no per-pref UI wiring.

| # | Setting (UI label) | Key / attr | Options (default first) | Reach |
|---|---|---|---|---|
| 1 | Keyword display | `kwUsage` / `kwusage` | crest (Chips) · text · grid · ledger | every ability card |
| 2 | Distance + target | `distTarget` / `disttarget` | grid · text · ledger | every ability card |
| 3 | Characteristics | `sbCharLine` / `sb-charline` | one · two | statblock |
| 4 | Boxed first letter | `sbCharBox` / `sb-charbox` | off · on · onword | statblock |
| 5 | Villain actions | `sbVillain` / `sb-villain` | inline · banded | statblock |
| 6 | Featureblock feature style | `fbFeatureStyle` / `fb-featstyle` | card · flat | featureblock |
| 7 | Featureblock stat line | `fbStats` / `fb-stats` | grid · ledger | featureblock |

### Per-setting file:line

**1. Keyword display (`kwUsage`)** — audit S7.
- Descriptor: `src/prefs/catalog.ts:263-277`.
- CSS: `styles-source.css:5246-5259` (text arm), `:5266-5309` (grid arm), `:5311-5344`
  (ledger arm, shared with `distTarget`), `:5348-5375` (label reveal + colon reset).
- No DOM change: the bands `.dse-feature__meta-chips` / `-cell--keywords` / `-cell--type`
  already existed (`src/elements/feature/renderFeature.ts:309-362`).
- Steel-screen-scoped (`[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-kwusage=…]`):
  the chip/rail vocabulary these modes restyle only exists under Steel; Legacy paints the
  base 2-column grid with hidden labels, where "grid" and "ledger" would mean nothing.

**2. Distance + target (`distTarget`)** — audit S8.
- Descriptor: `catalog.ts:278-290`.
- CSS: `styles-source.css:5311-5344` (ledger, shared block), `:5377-5401` (text arm).
- Hook already present (`renderFeature.ts:363-364`). Same Steel-screen scoping.

**3/4. Characteristics + boxed first letter (`sbCharLine`, `sbCharBox`)** — audit S4/S5.
- Descriptors: `catalog.ts:291-316`.
- DOM: `src/elements/statblock/view.ts:250-311` — `renderChars` now emits either the merged
  `"Might +2"` text node (defaults) or the site's three-part split
  (`.dse-sb__char-box` / `-v` / `-l`, DOM order box→value→label, matching how the site's
  own CSS orders them). The switch is `charsAreSplit()` (`view.ts:307-310`).
- CSS: `styles-source.css:2020-2120` — theme-agnostic layout arms (they are unreachable at
  defaults, so they cost the frozen shots nothing) — plus Steel dressing at `:6060-6082`.
- Site quirk reproduced deliberately: at `charline=two`, `on` and `onword` render alike.
- `one` is the default value and is therefore never named in a selector; the one-line arms
  key off `:is([data-dse-sb-charbox='on'],[…='onword']):not([data-dse-sb-charline='two'])`.

**5. Villain actions (`sbVillain`)** — audit S9 / FOLLOWUPS #54.
- Descriptor: `catalog.ts:317-329`.
- DOM: `src/elements/statblock/view.ts:335-393` — at `banded`, `renderFeatures` partitions
  on `actionTypeOf(config) === 'villain'` (the same predicate that draws the villain crest
  and accent, SC-102), renders the remainder as the normal list, then mounts one kit
  `collapsible()` region carrying `.dse-sb__band .dse-sb__band--villain`, a skull crest
  before the title, and session-persisted open state (`slot: 'sb.band.villain'`).
- CSS: `styles-source.css:2122-2150` (base frame) + `:6084-6106` (Steel tint/head).
- Print: inherited from the kit primitive's existing forced-open rule; no new rule.
- DESIGN.md rule 7 honoured: the band is framed all the way round and carries its kind
  through the crest glyph + a faint ground wash — no colored left spine.

**6. Featureblock feature style (`fbFeatureStyle`)** — audit S17.
- Descriptor: `catalog.ts:336-344`.
- CSS: `styles-source.css:2152-2162` (base) + `:3833-3859` (Steel, the exact twin of the
  statblock's three flat arms).
- Also updates the stale `styles-source.css:3789-3798` comment: the statblock flat mode's
  `:not(.dse-fb *)` guard is no longer a gap — a nested featureblock's options are now
  flattened (or not) by their own preference.

**7. Featureblock stat line (`fbStats`)** — audit S18 / §4b (dead CSS).
- Descriptor: `catalog.ts:345-353`.
- `src/elements/featureblock/view.ts:70-77` — the hard-coded
  `card.setAttribute('data-dse-fb-stats','grid')` is **gone**; the hook now arrives on the
  element root from `prefs.reflect()` like every other attr-bearing pref. That literal was
  the exact reason the `ledger` arm had been unreachable since D4.
- CSS: `styles-source.css:2069-2107` — `grid` became the unqualified base rule (the sheet's
  default-value convention, enforced by `pref-reflection.test.ts`), `ledger` is the only
  named value, and it gained the hairline/right-align treatment the mode's name implies.

### Presets (item 8 of the brief)

`catalog.ts:435-479`. All three bundles widen from 4 members to 9 — new-key members only;
`sbFeatureStyle`/`sbColumns`/`sbStats` are untouched (SC-146's scope).

| Preset | kwUsage | distTarget | sbCharLine | sbCharBox | sbVillain |
|---|---|---|---|---|---|
| Steel card | crest | grid | one | off | inline |
| Sourcebook | text | text | one | on | inline |
| Index card | grid | grid | two | onword | banded |

`sourcebook` and `index` are the site's own values verbatim (`settings-panel.js:35-39`).
**`steel` deliberately diverges** — see §3. Multi-column stays out of every bundle, as
asked.

### Settings UX

Scott's "3 primary + advanced" balance (SC-112): the five new **statblock** rows are all
`ui.advanced`, so the Statblock display page keeps exactly the rows it has today (Preset +
Feature style, Density, Feature columns, Secondary stats) and the long tail lives one page
deeper on the section's existing nested **Advanced** page. No new machinery — `ui.advanced`
is the mechanism SC-112/SC-131 already built for this.

The two featureblock rows get their own **Featureblock display** section
(`PrefGroup` + `GROUP_ORDER`, `catalog.ts:83-101`), inserted directly after Statblock
display — the site groups them separately too. Its live preview mounts a **featureblock**
(`SettingsPreview.ts:157-186`, new `subject` parameter + `PREVIEW_FEATUREBLOCK_YAML`), since
a statblock preview would show nothing either row can change.

---

## 2. Battery (verbatim, final run at `77165e8`)

```
tsc=0
lint=0
jest=0
Test Suites: 1 skipped, 159 passed, 159 of 160 total
Tests:       1 skipped, 2516 passed, 2517 total
Snapshots:   3 passed, 3 total
```

```
shots=0
294        (ok lines)
0          (FAIL lines)
```

```
freeze=0
freeze OK (137/137 legacy+print PNGs byte-identical)
```

```
parity=0
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

Against the branch-point baseline: jest **2503 → 2516** (+13 cases, same 159 suites), shots
**234 → 294** (+60), freeze **137/137 unchanged — no frozen byte moved**, parity
**identical** (0/0/16), tsc + lint clean. `obsidian-shots` NOT run (display `:1` is Scott's
live Obsidian, per the brief).

**LEGACY-FREEZE held with no rebaselining and no negotiation.** The mechanism is stated
once and used three times: any preference that changes DOM rather than CSS builds the OLD
DOM at its default value, so no camera pointed at a default-value render can see the new
code. That is why the reverted SC-10 Task 4 characteristics split could come back here.

### Screenshot inventory (60 new PNGs, all new filenames — invisible to the freeze baseline by construction)

`PREF_SHOTS` (`visual-harness/entry.ts:437-500`), 11 entries × 5 combos
(legacy-dark, legacy-light, steel-dark, steel-light, steel-print):

| id | element / fixture | prefs |
|---|---|---|
| `statblock-kwusage-text` | statblock / default | `kwUsage: text` |
| `statblock-kwusage-grid` | statblock / default | `kwUsage: grid` |
| `statblock-kwusage-ledger` | statblock / default | `kwUsage: ledger` |
| `statblock-disttarget-text` | statblock / default | `distTarget: text` |
| `statblock-disttarget-ledger` | statblock / default | `distTarget: ledger` |
| `statblock-charline-two` | statblock / default | `sbCharLine: two` |
| `statblock-charbox-on` | statblock / default | `sbCharBox: on` |
| `statblock-charbox-onword` | statblock / default | `sbCharBox: onword` |
| `statblock-villain-banded` | statblock / villain-corpus | `sbVillain: banded` |
| `featureblock-featstyle-flat` | featureblock / default | `fbFeatureStyle: flat` |
| `featureblock-stats-ledger` | featureblock / stats | `fbStats: ledger` |

Plus the new `featureblock/stats` fixture's own 5 default-value shots
(`featureblock-stats--<combo>`): neither shipped featureblock fixture declared
stamina/size/stats, so `.dse-fb__stats` had never been photographed in any theme.

The 12th combination (`sbCharLine: two` + `sbCharBox: onword`) is deliberately unshot: it
is the site's own quirk — identical to `two` + `on` — so a shot would pin a duplicate
picture rather than a behaviour.

Composites for the Linear comment: `.superpowers/sdd/sc123/shots/sc123-01..10-*.png`, built
by `sc123-compose.py` (site panels reused from SC-146's audit capture run).

---

## 3. Deliberate divergences (both forced, neither chosen)

**(a) Three defaults differ from the site's defaults.** The site ships `disttarget=text`,
`charline=two`, `villain=banded`. The plugin cannot: its default output is freeze-pinned, so
its defaults must be the boxed rail, the merged characteristic line and un-banded villain
actions. Every new option is opt-in.

**(b) The `steel` preset is the plugin's default state, not the site's Steel Card bundle.**
Follows from (a). If `steel` wrote the site's `charline: two` / `villain: banded`, a fresh
install would derive **"Custom"** on the preset dropdown — the plugin would open on a state
the user never chose. So `steel` mirrors the defaults and the site-faithful values live in
Sourcebook and Index card, which have no fidelity bar to clear. Guarded by a new test
(`the 'steel' bundle IS the default state`).

**Scott's decision, if he wants full site parity:** flip the three defaults to the site's
values. That is a sanctioned-rebaseline change, not a code change — it moves
`statblock--legacy-{dark,light}`, `statblock--steel-print` and the villain-corpus trio, and
would need his explicit approval per the freeze rules. My recommendation is to leave it:
the plugin's current look is the one its users have, and the site look is one dropdown away.

**Not a divergence, worth flagging anyway:** `kwUsage`/`distTarget` reach EVERY ability card
(statblock, featureblock, standalone `ds-feature`), where the site's `data-sb-*` twins only
reach a statblock's feature block. The plugin renders one shared card grammar; scoping the
prefs to statblock-nested cards would have meant inventing a distinction the DOM does not
make. They live under Statblock display anyway (that is where a user looks for them, and
where the site puts them), with the wider reach stated in each row's help text.

---

## 4. Assess-only: S10 / S11 / S12 (no code written)

### S11 — Sticky mini-header · **RECOMMEND DEFER** (own ticket)

*What the site does:* a zero-height `position: sticky` anchor before the card
(`.sb__sticky` + an absolutely-positioned `.sb__sticky-inner`), revealed by a
scroll-driven view-timeline animation as the statblock's head scrolls out; the bar re-states
the creature's name/level/role, and (S12) optionally a second row of secondary stats.

*Effort:* **L**, and the largest single item in the whole SC-123 inventory. It is the only
port that is genuinely new behaviour rather than a re-layout: new DOM, new scroll
machinery, and a container question the site does not have.

*Why it is not a port:* the site's sticky is anchored to the **page** scroller. In Obsidian
a rendered block lives inside a markdown preview scroller that the plugin does not own, can
be inside a sidebar leaf, a popout window, a canvas node or an export — and
`position: sticky` resolves against the nearest scrolling ancestor, which differs in each.
The site's own implementation carries a long comment about a bistable feedback loop it had
to engineer around (the bar's height feeding back into its own view-timeline subject); we
would be re-deriving that fix against four different hosts, three of which do not scroll
the way the site's page does.

*Design sketch if built:* a `.dse-sb__sticky` zero-height anchor emitted by
`StatblockElementView` ahead of `.dse-head`, holding an absolutely-positioned bar with the
name + level/role line (and, at S12, the secondary-stat strip); revealed with
`animation-timeline: view()` under `@supports`, and simply never revealed where that is
unsupported (Obsidian's Electron is current enough, but export/print must opt out
outright). Gated by `sbSticky` (off/on) with `sbStickyMeta` (off/on) as a dependent row —
which is itself a settings-UX first for this plugin: no descriptor today is conditional on
another, so the catalog would need a `dependsOn` notion or the child row has to be
self-explaining when the parent is off.

*Recommendation:* **defer to its own ticket**, sized as a feature, not a parity port. It
needs a design pass on where a sticky header even belongs in a note (Scott's call), and it
would double this ticket's risk surface for a behaviour the other six ports do not touch.

### S12 — Sticky's secondary-stats sub-toggle · **DEFER WITH S11**

Meaningless without S11; it is a one-line CSS arm once the bar exists. No separate
assessment.

### S10 — Link conditions & keywords · **RECOMMEND DEFER, and re-scope first**

*What the site does:* `body[data-aug-links="off"]` de-links `.sb-term` — the cross-reference
links its build injects into statblock prose (conditions, keywords, ability names).

*Why it does not port as-is:* the plugin has no `.sb-term` analogue. Its cross-references
come from two different places — Obsidian's own `[[wikilink]]`/markdown links inside
compendium note bodies (which the plugin must never suppress; they are the user's own
content and Obsidian owns their rendering) and SCC resolution through `cx.refs` /
`CompendiumIndex`. A setting called "Link conditions and keywords" would therefore either do
nothing, or reach into user content.

*Effort if re-scoped:* **S–M** for the honest version — a pref that governs the plugin's
OWN injected links only, which first requires the plugin to inject any (it currently
resolves references at the block level, not term-by-term inside prose). That is a feature
("auto-link Draw Steel terms inside rendered blocks"), and the toggle is a footnote to it.

*Recommendation:* **defer**, and record it as the tail end of a future term-linking feature
rather than as a parity gap. Porting a toggle for a behaviour that does not exist would put
a dead row in the settings tab — the exact defect SC-146 §4b found in `fb-stats`.

---

## 5. Notes for the orchestrator

1. **Rebase expected.** SC-146 touches `catalog.ts` (the `sbStats` re-point, the `gridc`
   option, the Sourcebook/Index bundle fixes), `styles-source.css` (`[data-dse-sb-stats]`
   arms, the Steel ledger reset, ◆ separators, the `sbColumns` algorithm) and the same
   three test files. Conflicts are near-certain in `SB_PRESETS` (I widened every bundle;
   they change existing members) and in `pref-reflection.test.ts` / `catalog.test.ts`. All
   of them are additive-vs-additive: keep both sides' members. `git fetch origin` INSIDE
   `<worktree>/draw-steel-elements` when told to rebase.
2. **`gridc`, when SC-146 lands it,** should probably also become the Index preset's
   `sbStats` member (the site's Index bundle uses `meta: gridc`). I did not touch that
   member; flagged so it is not lost between the two tickets.
3. **FOLLOWUPS #54 (villain banding) is DONE** by this work. I did not edit
   `FOLLOWUPS.md` — it is a superproject file and SC-146's worktree may be editing it too;
   marking it `**Status:** done` is a one-line change for whoever lands.
4. **CHANGELOG nit:** the SC-131 entry says the settings tab is "nine navigable pages" and
   lists them; it is ten now. I left another ticket's entry alone to avoid a conflict —
   worth a one-word fix at landing.
5. **Not run:** `npm run obsidian-shots` (display `:1` is Scott's live vault, per the
   brief). The settings-tab additions are covered by jest definition tests, not by a real
   Obsidian capture, so a human look at the two new pages in the live vault is the one
   piece of verification this branch cannot self-serve.

---

# Fix round 1 (2026-08-10) — the review's four Mediums, five Lows, and the post-SC-146 rebase

**Owner:** fix-round implementer (the original implementer was gone; all context loaded
from `sc123-review-report.md`, this report, and `sc146/sc146-audit-report.md`).
**Worktree:** unchanged (`/home/scott/code/steelCompendium/worktrees/sc123-settings-ports`).
**Branch after this round:** `sc123-settings-ports`, now based on dse `9083dbe`
(SC-146 landed mid-round).

| sha | subject |
|---|---|
| `74a76ed` | `feat(prefs): port the site's seven missing display settings (SC-123)` — the original `e5cdedd`, rebased |
| `558d839` | `test(harness): preference-variant captures, and a featureblock with stats (SC-123)` — the original `bac3321`, rebased |
| `4f01118` | `fix(prefs,steel): SC-123 review fix round — 4 Mediums + 5 Lows` |
| `1da7884` | `feat(steel): flat-mode ◆ separator for the featureblock twin (SC-123 / SC-146 L-8)` |

Superproject pointer bump deliberately **unstaged** (orchestrator lands).

Colour note: nothing below, and nothing in the composites, is distinguished by hue.
Every difference is presence/absence, shape or position.

---

## 1. Per finding

### M-1 — a per-block `prefs:` override of a conditional-DOM key rendered corrupt output · **FIXED (option 1, the review's preferred)**

The review reproduced it and the report's counter-claim was false as written. Confirmed:
`statblock/view.ts` reads `sbCharLine`/`sbCharBox` (`charsAreSplit()`) and `sbVillain`
(`renderFeatures`) at **build** time, while `applyPrefOverrides` runs after the mount and
re-stamps an **attribute**. So an accepted override paired the GLOBAL DOM shape with a
LOCAL attribute — `"+2Might"` for the characteristics, a silent no-op band for the villain
key.

Fixed by making the limitation explicit and author-visible rather than reader-visible:

- `src/framework/seams/prefs.ts:41-56` — new `PrefDescriptor.perBlock?: boolean`
  (undefined ⇔ overridable), documented with the measured failure.
- `src/prefs/catalog.ts:315-321` (the block comment) and `:323`, `:335`, `:348` —
  `perBlock: false` on `sbCharLine`, `sbCharBox`, `sbVillain`.
- `src/framework/prefOverrides.ts:69-82` — third rejection class in
  `extractPrefOverrides`, through the same warn-and-ignore channel unknown and attr-less
  keys already use ("… cannot be set per block — it changes the rendered structure, not
  just its styling"). `applyPrefOverrides:97-99` carries the matching belt.
- Docs corrected where the false claim lived: `src/elements/statblock/view.ts:277-289`
  (the `renderChars` doc comment, which asserted the pairing "degrades to the default
  look"), `:341-347` (`renderFeatures`), `.repo-docs/architecture.md` conditional-DOM +
  per-block entries, `CLAUDE.md` prefs router line.

Regression tests, `test/dom/framework/pref-overrides.test.ts:184-291` — **9 new cases**:
a `test.each` over **both directions of all three keys** (six cases: each asserts the
warn fires, no error card, and the attribute still reads the GLOBAL value so DOM and
attribute agree); an explicit shape test proving the split DOM under `charline="two"`
reads `M+2Might` laid out by the `two` arm rather than the corrupt inline run; the
`sbVillain` mirror (band still built, attribute still `banded`, warning present); and a
scope guard that the rejected set is exactly those three and all three still reflect an
attribute (i.e. nothing lost its GLOBAL reach).

*Not done:* option 2 (threading the override bag onto `RenderContext` so per-block
conditional DOM actually works). It is a real feature, not a fix, and the review priced
it as the bigger option — noted as an open question below.

### M-2 — `kwUsage`/`distTarget` silently dropped in print and export · **FIXED**

`:not([data-dse-print="on"])` removed from every mode arm
(`styles-source.css:5230-5478`). Only the **material** refinements stay screen-scoped —
the translucent wash (`:5348-5355`) and the metal hairline colours (`:5348-5350`,
`:5397-5402`) — which is what the site does (it keeps every `.sb__field` mode on paper
and strips only backgrounds, `steel-statblock.css:654`).

Three things had to move for the modes to actually *compose* on paper, not merely be
un-excluded:

1. the frames now chain to the neutral `var(--dse-rule)` (`:5316`, `:5386`) with the Steel
   screen arms re-colouring to `--dse-metal-faint`. `--dse-metal-faint` is literally
   `none` in print, so the old declaration would have printed a 0px border;
2. `display` is restated on each band (`:5268`, `:5305`, `:5327`, `:5457`) — the Legacy
   base is `display: contents` and only the Steel *screen* layer turned the bands into
   real boxes;
3. the revealed chip labels (`:5424`) and the rail's inline labels (`:5474-5477`) restate
   `display: inline` for the same reason. Plus `grid-column: 1 / -1` on each band, inert
   on screen (the Steel meta region is `display: block`) and full-width in print.

Freeze safety, verified not asserted: every selector names a non-default value, every
frozen camera shoots defaults, and the post-change run reports **0 checksum mismatches**.
Live probe, both media, all five modes: identical computed `display`/`grid-auto-flow` on
screen and in print; the grid cell's wash drops to `rgba(0,0,0,0)` in print while its
hairline survives at `rgb(187,187,187)`.

The one pre-existing test that encoded the old rule — `test/dom/elements/feature.test.ts`'s
SC-121 B-1 contract ("every band layout rule is Steel-scoped AND print-excluded") — was
**narrowed, not deleted**: it still requires the `display: contents` BASE and Steel
scoping, and now accepts a print-reaching arm only if it names a non-default
`kwusage`/`disttarget` value. A new `pref-reflection.test.ts` case pins the same
invariant from the other side.

### M-3 — under Legacy the new borders painted nothing · **FIXED**

Root cause confirmed by measurement, and it is two different mechanisms:
`--dse-metal-line` is the literal `none` outside Steel screen (so `1px solid none` →
invalid at computed-value time → 0px), and `--dse-rule` is `var(--icon-color)` declared on
`<html>`, where Obsidian has not defined `--icon-color` — guaranteed-invalid, which *does*
trigger a var() fallback (the same mechanism the ornate-rule halo already documents).

All three new declarations now chain to Obsidian's own `--background-modifier-border`:
`styles-source.css:2054` (`.dse-sb__char-box`), `:2153` (`.dse-sb__band`), `:2244`
(the `fb-stats` ledger hairline). Steel screen re-colours the boxed letter to the metal
line (`:6338`), so the Steel look is byte-unchanged.

Probe (`getComputedStyle`, the boxed letter at `sbCharBox: on`, all five scheme/media
combinations):

| scheme | before | after |
|---|---|---|
| legacy-dark | `0px none rgba(0,0,0,0)` | `1px solid rgb(54,54,54)` |
| legacy-light | `0px none rgba(0,0,0,0)` | `1px solid rgb(221,221,221)` |
| steel-dark | `1px solid rgba(176,183,187,.5)` | **unchanged** |
| steel-light | `1px solid rgba(95,103,108,.45)` | **unchanged** |
| steel-print | `0px none` | `1px solid rgb(187,187,187)` |

The band and the fb ledger hairline both paint under Legacy too
(`1px solid rgb(54,54,54)`). The destructive case is closed at the source: the word is
only dropped where a box now actually paints. Composite `sc123-11` is the before/after —
the BEFORE reads a bare bold `M +2`, the AFTER a framed `M` beside a larger `+2`.

The CSS comment that asserted "the theme-agnostic layout arms above already give Legacy a
sane split" (`:6317-6322`) now says what is actually true and names the defect.

### M-4 — "the site ships `disttarget=text`" · **CORRECTED in all four places, plus upstream**

`settings-panel.js:31-33` ships `disttarget: "grid"`, and so does the Steel Card preset
(`:36`). Only `charline` and `villain` genuinely diverge from the site.

- `src/prefs/catalog.ts:56-64` — the `DsePrefs` block comment, rewritten to "TWO DEFAULTS
  DIVERGE", naming the source and the error's provenance.
- `test/unit/prefs/catalog.test.ts:32-38` — same correction.
- `styles-source.css:5242-5248` — same.
- This report, §3(a): superseded by this section — **the branch's own claim of three
  divergences is wrong; it is two.**
- Upstream: a dated §8 **appended** (never rewritten) to
  `.superpowers/sdd/sc146/sc146-audit-report.md`, recording that §2 row S8's
  "text / grid / ledger" is a CSS source ordering, not a default-first ordering, and that
  the §4 matrix row reads the same way. I re-checked every other §2 row's default against
  `SB_DEFAULTS`/`FB_DEFAULTS` (S2, S3, S4, S5, S6, S7, S9, S12, S17, S18) — all correct as
  written; S8 is the only one.

### L-3 — the unscoped colon reset reached the meta rail · **FIXED**

`styles-source.css:5443-5446` — both selectors now carry `.dse-feature__meta-chips`, so a
keyword setting can no longer punctuate the distance rail. Pinned by a test that counts
the two reset selectors and requires the qualifier in each.

### L-4 — two missing 1.25rem type bumps vs the site · **FIXED**

`styles-source.css:2114-2120` (`.dse-sb__char-v` on the one-line arms — the site's
`[data-sb-charline="one"] .sb__char-v`, `steel-statblock.css:231`) and `:6358-6360`
(`.dse-sb__band .dse-collapse__title` — the site's `.sb__band-title`, `:418`). Measured
after: 20px both (= 1.25rem at the 16px root). The band-title bump sits in the Steel
dressing beside the rest of that title's treatment (uppercase, tracking, family), so it is
Steel-only; under Legacy the band head stays at 16px, consistent with the band's other
Legacy-plain typography. Flagging it rather than silently deciding it.

### L-5 — a blank half-track when only one meta cell exists · **FIXED**

The two `1fr 1fr` bands became `grid-auto-flow: column` over
`grid-auto-columns: minmax(0, 1fr)` (`styles-source.css:5306-5313`, `:5372-5379`) — one
track per cell, and the band can never hold more than the two cells
`renderFeature.ts` builds. Measured: `feature/villain` (keywords, no usage) went from
`350px 350px` with one child to a single `710px` track; the two-cell case is unchanged at
`334.906px 334.906px` (grid) and `328.703px 328.719px` (ledger), i.e. exactly the reviewer's
own numbers. `repeat(auto-fit, minmax(0,1fr))`, the prescription's literal wording, would
**not** have worked — an auto-repeat over a zero minimum floors at one repetition, so it
collapses the two-cell case too.

### L-6 — grid/ledger reset the keyword run's small-caps; the site keeps it · **FIXED**

The three `font-variant: normal; text-transform: none; letter-spacing: normal` resets are
gone from the grid and ledger cell arms (the `font-size: 1em` stays). The site's grid/ledger
arms strip only the chip's border/background/padding (`steel-statblock.css:372-376`) and
leave `.sc-ability__chip`'s small-caps standing. Measured after: the cell keeps
`font-variant-caps: small-caps` + `text-transform: lowercase` in both schemes. `text` mode
still drops the voice — the one place the site drops it too. Visible in `sc123-14`.

### L-1 — the stale freeze doc line · **CORRECTED, twice over**

§2 of this report reads `freeze OK (137/137)`. That was true at the time. Since then the
baseline widened twice, so for the record:

- at the fix round, pre-rebase: `freeze OK (137/149 producible OK, 12 missing (not
  producible on this branch), 0 checksum mismatches)` — the 12 were SC-146's four unlanded
  fixture variants;
- **after the rebase onto the landed SC-146: `freeze OK (149/149 legacy+print PNGs
  byte-identical)`, exit 0.** No frozen byte has moved at any point on this branch.

### Not done, by instruction

- **L-2 (preset migration)** — left untouched per Scott's decision; see open questions.
- **L-7 (evidence)** — done, see §3.
- **L-8 (fb ◆ separators)** — was out of scope, then handed to this round after SC-146
  landed; see §2.
- **L-9 (CHANGELOG "nine navigable pages"; `FOLLOWUPS.md` #54)** — superproject/landing
  housekeeping, deliberately left for the lander to avoid a cross-branch conflict.

---

## 2. The SC-146 rebase, and the two integration items that came with it

SC-146 landed mid-round (dse main `9fb56f5` → `9083dbe`). Rebased `git fetch origin` +
`git rebase origin/main` **inside the worktree's own submodule clone**.

**Conflicts hit — four files, all additive-vs-additive, all on the first commit:**

| file | conflict | resolution |
|---|---|---|
| `src/prefs/catalog.ts` (×2) | the `DsePrefs` block (SC-146 widened `sbStats` to include `gridc`; SC-123 appended seven keys) and `SB_PRESETS` (SC-146 corrected four members; SC-123 appended five) | kept both sides in both hunks. Presets now read: sourcebook `sbFeatureStyle: 'flat'` **and** SC-123's five; index `sbColumns: 'single'`, `sbStats: 'gridc'` **and** SC-123's five. The two tickets touch disjoint members of the same three objects. Merged block comment records both provenances. |
| `CHANGELOG.md` | both tickets added an entry at the same list position | both entries kept, SC-146's first (it landed first). |
| `test/unit/prefs/catalog.test.ts` | preset-derivation walk: SC-146 needed two members flipped to reach Sourcebook, SC-123 needed the whole set | merged into a three-step walk — one member → custom, two members → **still** custom, `applySbPreset` → sourcebook. Strictly stronger than either side. |
| `test/dom/views/settings-tab.test.ts` | same shape in the DOM test, where SC-146 asserted "flat + ledger = the sourcebook bundle" | that assertion is now false (2 of 9 members), so it became `expect(preset.value).toBe('custom')` with the merged reasoning. |

`styles-source.css` and `test/dom/framework/pref-reflection.test.ts` **auto-merged** —
worth recording, since those were the two files predicted to conflict hardest. Commits 2
and 3 replayed cleanly. `npm ci` was not needed (no package/typings churn).

**Integration item (a) — preset members.** Verified after the rebase: `SB_PRESETS` carries
SC-146's corrected values for all four original members in all three bundles, with SC-123's
five appended. Both tickets' preset tests pass unchanged.

**Integration item (b) — the fb ◆ separator (commit `1da7884`).** SC-146 fix 6 gave the
statblock's `flat` mode the site's diamond; the featureblock's `flat` — the same label,
the same setting one element over — had none. Ported verbatim including both of SC-146's
own fix-round corrections: the **M1 spacing pair** (`margin-top: 4px` +
`padding-top: 1.25rem` on the `+` SIBLING selector, so only adjacent options pay for the
seam and the first option's own padding is untouched) and the **M2 plate-solid halo**
(`#1e2327` dark / `#f4f6f6` light — `.dse-fb` joins the same card-ground selector list as
`.dse-sb`, so both diamonds sit on the identical gradient). `styles-source.css:4021-4059`.

No `:not(.dse-fb *)` guard, unlike the statblock arm: that guard exists precisely to keep
the statblock's flat mode out of a nested featureblock's option list, which is the list
this rule owns. Steel + screen only; `card` is the default and is never named, so no
frozen camera reaches it. Test: `pref-reflection.test.ts` pins the fb recipe against its
statblock twin declaration for declaration (spacing pair, 8px rotated core, both halo
rings, both plate-solid literals) plus a scope sweep requiring theme + print exclusion on
every arm. Shot variant: the existing `featureblock-featstyle-flat` PREF_SHOT (5 combos) —
its three-option fixture now renders two diamonds. Before/after: composite `sc123-15`.

---

## 3. Evidence regenerated (review L-7)

Both defects the review named are fixed, and the composites now cover the fix round too.
`.superpowers/sdd/sc123/shots/`, rebuilt by the rewritten `sc123-compose.py`.

- **The mismatched pairing.** `sc123-07` used to put the site's `charbox=on` at the
  **site's** default `charline=two` beside the plugin's `charbox=on` at the **plugin's**
  default `charline=one`. `sc123-site-shots.cjs` (new, same shape/URL/zone logic as
  SC-146's own capture script) captured the site at `charline=one + charbox=on`, so both
  halves are the same configuration; `sc123-07b` adds the `onword` twin, which had no
  composite at all.
- **The cropped plugin halves.** Plugin panels are no longer pixel crops. A new
  `sc123-plugin-zone-shots.mjs` measures the zone off the live DOM — head→chars, one
  ability card, the villain band, fb head→options — the same way SC-146's site script
  measures the site's, so both halves frame the same region and nothing is cut. All ten
  original composites were rebuilt this way.
- **Five new before/after composites** (`sc123-11` … `sc123-15`) for M-3, M-2 ×2, L-5/L-6
  and L-8. "Before" is the pre-fix-round commit `558d839` rendered from **its own** harness
  bundle in a scratch git worktree — a real capture of the old code, not a reconstruction.

Reading note for the two print composites: the harness's `steel-print` camera renders print
tokens over the DARK scheme, a longstanding capture artifact recorded in the `dse-verify`
skill. Both halves of each pair share it, so the comparison is sound; real paper is
light-on-white.

---

## 4. Battery (verbatim, final run at `1da7884`, post-rebase)

```
tsc=0
lint=0
jest=0
Test Suites: 1 skipped, 159 passed, 159 of 160 total
Tests:       1 skipped, 2540 passed, 2541 total
Snapshots:   3 passed, 3 total
```

```
shots=0
314        (ok lines)
0          (FAIL lines)
```

```
freeze=0
freeze OK (149/149 legacy+print PNGs byte-identical)
```

```
parity=0
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

Measured movement, step by step (each number from its own run, none inferred):

| | branch @ `bac3321` (pre-fix, pre-rebase) | + fix round | + rebase onto `9083dbe` + fb diamond |
|---|---|---|---|
| jest | 2516 / 159 suites | **2528** (+12: 9 M-1 regression cases, 3 fix-round CSS pins) | **2540** (+12: SC-146's landed guards, +1 fb diamond pin) |
| shots | 294 | 294 | **314** (+20: SC-146's 4 fixture variants × 5 combos) |
| freeze | 137/137 | 137/149 producible, 0 mismatches | **149/149 byte-identical** |
| parity | 0/0/16 | 0/0/16 | **0/0/16** |

`obsidian-shots` NOT run (display `:1` is Scott's live vault).

### Freeze widening the lander would need (NOT applied — listed for the orchestrator)

36 frozen-class filenames exist in this worktree that the 149-line baseline does not
name — the legacy-dark / legacy-light / steel-print twins of SC-123's 12 preference-variant
captures. They are new names, so `sha256sum -c` cannot see them and the gate is green
either way; pinning them is the additions-only widening that makes a future leak into these
surfaces loud. Hashes ready to append (149 → 185):
`.superpowers/sdd/sc123/sc123-freeze-widening-36.txt`.

A **separate, pre-existing** gap found while computing that list: `hero-sparse--legacy-dark`,
`hero-sparse--legacy-light` and `hero-sparse--steel-print` are producible on `main` today
and are also absent from the baseline. Not SC-123's fixture and not touched by this branch —
flagged so whoever owns it can widen it deliberately rather than discover it later.

---

## 5. Open questions for Scott

1. **Preset migration (review L-2) — deliberately NOT done, per Scott's decision.**
   Derivation now requires all nine members, so a user who had chosen **Sourcebook** or
   **Index card** before this change will see the dropdown read **"Custom"** the first time
   they open Settings after upgrading. Nothing is broken and their rendering is unchanged —
   only the label is. The two ways to close it if he changes his mind: a CHANGELOG sentence
   saying so, or a one-shot migration (if the four legacy members exactly match a bundle and
   the five new keys are unset, write that bundle). Left open on purpose.
2. **The two remaining default divergences from the site** (`charline`, `villain` — not
   three; see M-4). Unchanged recommendation: leave them. Flipping them is a
   sanctioned-rebaseline decision, not a code change.
3. **Per-block `prefs:` for the three conditional-DOM keys is now REJECTED, not broken.**
   Making it actually work per block (review M-1 option 2 — exposing the override bag on
   `RenderContext` so the view reads the effective value at build time) is a real feature
   and would want its own ticket. Worth doing only if someone actually wants a single
   statblock in a note to band its villain actions while the rest do not.
4. **The band title's 1.25rem is Steel-only** (L-4). Under Legacy the "VILLAIN ACTIONS"
   head stays at body size, consistent with the band's other Legacy-plain typography.
   Deliberate; say the word if it should be theme-agnostic.
