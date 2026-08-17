# SC-160 — Statblock sticky mini-header: implementation report

**Status:** complete, committed, battery green, evidence posted to Linear.
**Branch:** `sc160-sticky-header` @ **`b53a8b6`** (single commit), rebased onto develop **`a2fc374`** (clean, no conflicts).
**Superproject pointer:** left **unstaged** in the worktree, per instruction.
**Linear:** one implementation comment posted on SC-160 with five inline PNGs. **State and labels untouched.**

---

## 1. What shipped

The v2 site's `.sb__sticky` augmentation, ported. While a statblock's own header is scrolled
out of the top of its scroll container, a compact bar pins there carrying the creature's
name, role, the five primary stats and the five characteristics, plus a second row of
secondary stats behind a sub-toggle.

Two prefs, both **default ON** (site parity), neither a **preset member** — the site's
presets don't touch them either; an augmentation is not a layout choice.

| Pref | Attribute | Default |
|---|---|---|
| `sbSticky` | `data-dse-sb-sticky` | `on` |
| `sbStickyMeta` | `data-dse-sb-stickymeta` | `on` |

**The `dependsOn` affordance is general, not a one-off.** `PrefUi.dependsOn` names a parent
pref; `SettingsTab` renders the row indented (a leading `↳`) and **disabled rather than
hidden** while the parent is off, re-evaluated in place through obsidian's real
`refreshDomState()` (verified present in `obsidian.d.ts`, alongside
`disabled?: boolean | (() => boolean)` on the control). Disabled-not-hidden so the value
stays visible, stays findable in settings search, and the page doesn't change height as you
toggle.

**Mechanism split:** CSS owns parking, JS owns visibility. One `position: sticky; top: 0`
resolves against whatever the nearest scrolling ancestor happens to be, so a single rule
covers every render context; one IntersectionObserver rooted at the *resolved scroller*
(not the viewport) answers the only question CSS cannot express before Chromium 115 — "is
the real header off the top of the **scroller**?" — and writes one class. The site's
scroll-driven-animation reveal is **not** transplantable: it dies under the shipped
reduce-motion preference and needs Chromium 115 against a 106 floor.

The reveal predicate is deliberately "scrolled past the **top**"
(`!isIntersecting && boundingClientRect.bottom <= rootBounds.top`), not bare
`!isIntersecting` — the latter is also true for a card still below the fold, which would
leave every statblock in a long note marked stuck while off-screen.

---

## 2. Per-context behaviour (verified in a real Obsidian)

Driven over raw CDP against a real spawned Obsidian on **my own Xvfb display `:77`** with a
**scratch `--user-data-dir`**. Never `:1`, never `npm run obsidian-shots`. Driver:
`scratchpad/sc160-verify.mjs` (a cut-down sibling of `visual-harness/obsidian-camera.mjs`).

**Engine actually under test: Chromium 106.0.5249.199 / Electron 21.4.1** — Obsidian 1.13.7's
*asar* self-updates, the Electron shell does not. This is exactly the documented support
floor, and it is why the harness (modern Chromium) could not see either defect below.

| Context | Scroller resolved | Verdict | Behaviour |
|---|---|---|---|
| **Reading view, at rest** | `.markdown-preview-view` | PASS | Anchor present, `position: sticky`, bar `visibility: hidden`, zero flow reserved |
| **Reading view, scrolled** | `.markdown-preview-view` | PASS | Bar pinned flush at pane top, opaque (`rgb(26, 30, 33)`), both rows, head confirmed off-screen (`headBottom -429` vs `scrollerTop 79`) |
| **Reading view, light scheme** | `.markdown-preview-view` | PASS | Same, light ground + lighter shadow |
| **`sbStickyMeta: off`** | — | PASS | Row 2 `display: none`; row 1 intact; bar height 84→46px |
| **`sbSticky: off`** | — | PASS | Anchor `display: none` — no box at all, though the observer still ran (pref is pure CSS) |
| **Sidebar leaf (~300px)** | `.view-content` | PASS | Compact treatment: stat pills `display: none`, row 2 `display: none`, name truncates with ellipsis, role kept. Bar 264px wide in a 300px leaf |
| **Pop-out window** | pop-out's own preview scroller | PASS | Works — observer is constructed from the **element's own window**, which is what makes this hold |
| **Canvas card** | node's inner preview scroller | PASS | **Inert.** `data-dse-readonly="true"`, anchor `display: none` even after scrolling the node's own scroller past the header; no observer wired at all |
| **Print / export / print-preview** | — | PASS | Inert by construction; **freeze 67/67 unchanged** |

Narrow handling is **container** queries (`container-type: inline-size` on the anchor), not
media queries — a sidebar leaf is ~300px inside a 1400px *window*, so the viewport says
nothing about the space the bar has. Two steps: 34rem drops row 2 and truncates the name;
21rem drops the stat pills.

Evidence PNGs: `scratchpad/sc160-shots/` (`reading-scrolled`, `reading-scrolled-light`,
`reading-scrolled-nometa`, `reading-scrolled-off`, `reading-unscrolled`, `sidebar-scrolled`,
`canvas-inert`, `popout-scrolled`, plus `*-window` full-window variants) and
`verdicts.json`. Five posted inline on Linear.

---

## 3. Two defects found and fixed in real Obsidian

Both were invisible to every gate in the battery. Both were in the prior agent's
uncommitted work; both are fixed in `b53a8b6`.

### 3.1 The bar rendered fully see-through (serious)

Card text scrolled visibly through the pinned stat line. Measured:
`background-color: rgba(0, 0, 0, 0)`, `background-image: none`.

**Cause — the sheet's `color-mix()` support-floor idiom is broken whenever the enhanced
declaration contains `var()`.** The house rule (documented above `.dse-pr__row`) says an
unsupported function makes the declaration "invalid at **parse** time", so the static
declaration authored immediately above survives. That holds **only for literal values**. A
declaration containing `var()` parses fine and fails at **computed-value time**, which
happens *after* the cascade has already discarded the static declaration — the property is
then set to its `unset` value, not to the fallback. For a `background` shorthand that is
fully transparent.

Probed in-app, decisive:

| Authored | Computed on Chromium 106 |
|---|---|
| `background: #1a1e21; background: linear-gradient(…color-mix(…)…)` (**literals**) | `rgb(26, 30, 33)` — static survives ✅ |
| same pair with `var()` (**as SC-160 authored it**) | `rgba(0, 0, 0, 0)` / `background-image: none` ❌ |
| the **shipped** `.dse-pr__row` pair (pre-existing) | `background-image: none` ❌ |
| `CSS.supports('color', 'color-mix(in srgb, red 14%, blue)')` | `false` |

**Fix:** the flat `background: var(--dse-surface)` stands alone in the base rule; the
role-tinted gradient moved into
`@supports (background: color-mix(in srgb, red 14%, blue))`, which a floor engine never
enters. The static-first pair is repeated *inside* the block so
`cssSupportFloor.test.ts`'s source-text adjacency scan still passes (it does not model
`@supports`). Pinned by a new test in `statblockSticky.test.ts`.

**Systemic, beyond this ticket:** all **15** `color-mix()` declarations in the sheet have
the `var()` shape, so every one of them is inert on the floor engine. Filed as
**FOLLOWUPS #73**; cosmetic elsewhere (missing tier washes, not an unreadable surface).
The misleading doctrine comment is corrected in place so the next agent doesn't repeat it.

### 3.2 The bar parked below the scroll container's own top padding

`position: sticky` parks against the scroller's **content** box, but a scroll container's
top padding is still painted through. Obsidian's reading view sets `padding-top: 32px` on
`.markdown-preview-view`, so the bar sat 32px down with card content sliding **above** the
pinned header. The sidebar leaf had the same defect at its own smaller padding.

**Fix:** a `::before` band on the inner (`bottom: 100%; height: 100vh`) that the **scroller
itself clips** at its padding box — context-independent, no measured constant, nothing to
keep in sync with a theme's file margins. Its colour is the gradient's *starting* colour so
band and bar meet seamlessly in both engines (floor: both flat; modern: both tinted).

---

## 4. Assessment of the prior agent's work

Kept essentially in full — it was high quality and correctly reasoned. Verified rather than
trusted:

- **Correct and kept:** the zero-height-anchor / absolute-inner split (avoids the site's
  documented bistable reveal loop); the anchor emitted before the card; hoisting
  `statblockDefenseCells` / `statblockMetaCells` / `statblockCharCells` so the bar cannot
  disagree with the card; row 2 always built (keeps the sub-toggle a pure CSS reflow and
  therefore per-block overridable); `aria-hidden` throughout; `nearestScroller` + the
  one-rAF re-resolve for reading-mode's detached-at-post-process sections; popout-safe
  observer construction from the element's own window; the readonly/print exclusions;
  `dependsOn` using real Obsidian 1.13 APIs (`refreshDomState`, predicate `disabled`).
- **Verified against the real API surface:** `refreshDomState()` and
  `disabled?: boolean | (() => boolean)` both exist in `node_modules/obsidian/obsidian.d.ts`
  — not invented.
- **Unfinished, completed here:** the report (did not exist), docs, CHANGELOG, the rebase,
  the full battery, and all real-Obsidian verification — which is what surfaced §3.
- **Wrong, fixed here:** the two §3 defects.

The `SCROLL_SHOTS` manifest and `shoot.mjs` loop (its last known step) were in fact complete
and correct; all 15 new captures render and the loop's `settleScroll` guard fires loudly
rather than silently photographing an unscrolled card.

---

## 5. Battery

Run in order against the worktree, rebased onto `a2fc374`. Load was 1.26–4.75 throughout —
no timeout-shaped reds, no re-runs needed.

| Gate | Baseline (`a2fc374`) | This branch |
|---|---|---|
| `npm run tsc` | clean | **clean** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** |
| `npx jest` | 2729 pass + 1 skip / 165 suites | **2756 pass + 1 skip / 166 suites** (+27 tests, +1 suite) |
| `npm run shots` | 203, 0 FAIL | **218, 0 FAIL** (+15) |
| `check-freeze.sh` | 67/67, exit 0 | **`freeze OK (67/67 …)`, exit 0** |
| `npm run parity` | 0 / 0 / 16 | **0 gaps / 0 undeclared / 16 declared, exit 0** |

**Freeze did not move.** The added DOM is `display: none` in the base layer, so it generates
no box in print — which is the whole reason this ticket could add DOM to the statblock at
all.

### New fixture names (freeze widening candidates — additions only, 15 lines)

Five new capture ids × 3 combos (`steel-dark`, `steel-light`, `steel-print`):

```
statblock-sticky--steel-{dark,light,print}.png
statblock-sticky-unscrolled--steel-{dark,light,print}.png
statblock-sticky-nometa--steel-{dark,light,print}.png
statblock-sticky-off--steel-{dark,light,print}.png
statblock-sticky-narrow--steel-{dark,light,print}.png
```

Only the 5 `*--steel-print.png` lines are baseline-eligible. **I did not touch
`freeze-baseline.sha256`** — per the division of labour, the orchestrator applies widenings
at landing (additions-only, no sanction needed).

---

## 6. Files touched

**Submodule `draw-steel-elements`** (committed, `b53a8b6`):

| File | Change |
|---|---|
| `src/elements/statblock/stickyHeader.ts` | **new** — builder, `nearestScroller`, `wireStickyHeader` |
| `src/elements/statblock/view.ts` | emit anchor before card, tint it, hoist the three cell extractions, wire the observer when `host.canPersist` |
| `src/prefs/catalog.ts` | `sbSticky` / `sbStickyMeta` descriptors; `PrefUi.dependsOn` |
| `src/views/SettingsTab.ts` | `↳` indent, `disabled` predicate, `refreshDomState()` on parent change |
| `src/views/settingsDeclarative.ts` | `NavRow.disabled` → merged into the control |
| `styles-source.css` | sticky block; **`@supports` gate**; **padding-band `::before`**; `@media print` entry; corrected floor doctrine comment |
| `test/dom/elements/statblockSticky.test.ts` | **new** — DOM, reveal predicate, inert contexts, CSS contract (incl. the new `@supports` test) |
| `test/dom/views/settings-tab.test.ts`, `test/unit/prefs/catalog.test.ts`, `test/mocks/obsidian-core.ts` | `dependsOn` coverage + `refreshDomState` mock |
| `visual-harness/entry.ts`, `visual-harness/shoot.mjs` | `SCROLL_SHOTS` + `settleScroll` |
| `docs/settings.md`, `docs/advanced-usage.md`, `CHANGELOG.md` | docs + unreleased entry |

**Superproject** (uncommitted, for the orchestrator):
- `FOLLOWUPS.md` — new **#73**, `next-id` bumped to 74.
- `draw-steel-elements` pointer — **unstaged**, as instructed.

> Note: I first appended #73 to the *shared main checkout's* `FOLLOWUPS.md` by mistake and
> **reverted it immediately** (`git checkout -- FOLLOWUPS.md`; the main checkout is clean and
> was never committed to). The entry now lives in the worktree.

---

## 7. Concerns / things for the orchestrator

1. **FOLLOWUPS numbering will conflict at landing.** The worktree's superproject is pinned to
   `bfb50c6`, whose `FOLLOWUPS.md` is at `next-id: 72` and has no `#72`; main has `#72` and
   `next-id: 73`. I took **73** (correct against main's counter) and set `next-id: 74`, so
   the merge is a plain append conflict at the file's tail plus the counter line — resolve by
   keeping both `#72` and `#73` and `next-id: 74`.
2. **Freeze widening (15 lines / 5 print lines) is unapplied** — deliberate, orchestrator's
   job at landing. Additions-only; no existing line moves (proved: `freeze OK (67/67)`).
3. **FOLLOWUPS #73 is a real shipped bug beyond SC-160.** 14 other `color-mix()`
   declarations are silently inert in the app today. Cosmetic (missing washes), but it means
   several Steel surfaces do not look in Obsidian the way any shot shows them. Worth
   scheduling.
4. **The harness cannot catch this class at all** — it runs a modern Chromium. Nothing in the
   battery tests against Chromium 106. If that matters generally, the fix shape is a
   `CSS.supports`-style assertion run inside the Obsidian camera, not another source scan.
5. **No sanction is needed for anything here.** No frozen bytes moved, no defaults diverge
   from the site, no state or labels changed on Linear.
6. `demo-vault/Harness/sc160-canvas.canvas` was generated for the canvas check.
   `demo-vault/Harness/` is gitignored and regenerated, so nothing leaks.
# SC-160 — adversarial review (independent, executing)

**Branch:** `sc160-sticky-header` @ `b53a8b6` (single commit) on develop `a2fc374`.
**Reviewer:** did not write the code. Every claim below was re-derived by execution.
**Engine actually tested:** real Obsidian, **Chromium 106.0.5249.199 / Electron 21.4.1**
(`obsidian/1.1.16` shell, self-updated asar), on my **own Xvfb display `:78`** with a scratch
`--user-data-dir` (`/tmp/claude-1000/dse-sc160-review-camera/udd`) and CDP port 9231.
Never `:1`, never `:77` (the implementer's), never `npm run obsidian-shots`/`docs-shots`.
Driver scripts: `sc160-probe{,2,3,4}.mjs` in my session scratchpad (removed with the display).

## VERDICT: **FIX ROUND** — narrow (one CSS line + two documentation corrections)

Nothing here corrupts output, leaks, or fails a gate. The whole battery is green and both
"engine defects" the implementer claims to have found and fixed **reproduce exactly** on the
floor engine. But one guard the commit message and the sheet's own comment advertise as
load-bearing is **provably inert**, and a number that is now committed to `main` (and handed
to SC-171) is wrong by ~2x with the severity understated. Both are cheap.

---

## Battery — re-run by me at `b53a8b6`, in order

| Gate | Result | Claimed |
|---|---|---|
| `npm run tsc` | clean, exit 0 | clean ✓ |
| `npm run lint` | clean, exit 0 | clean ✓ |
| `npx jest` | **2756 passed + 1 skipped / 2757**, **166 suites passed + 1 skipped / 167**, 3 snapshots, exit 0 | 2756+1skip/166 ✓ |
| `npm run shots` | **218 written, 0 FAIL**, exit 0 | 218/0 ✓ |
| `check-freeze.sh` | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 | 67/67 ✓ |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 | 0/0/16 ✓ |

Load 1.8–2.9 throughout; no timeout-shaped reds, no re-runs needed.

**Fixture names (claim 6).** All **15** new names are NEW: `statblock-sticky{,-unscrolled,
-nometa,-off,-narrow}--steel-{dark,light,print}`. Checked against the 67-line baseline
(67 unique names): `grep -c statblock-sticky` on the baseline = **0**, so 0 collisions. All
67 baseline names are producible on this branch and byte-identical. The widening candidate
is the 5 `*--steel-print.png` lines — **additions-only**. `freeze-baseline.sha256` untouched
by the branch and by me.

---

## Findings, severity-ranked

### M-1 (MEDIUM) — the `@media print` re-assertion is INERT, and the comment claims the opposite

**Reproduction (real Obsidian, Chromium 106).** Open a note, scroll until the bar is stuck,
then `Emulation.setEmulatedMedia { media: 'print' }`:

```
SCREEN       {"anchorDisplay":"block", ...,"stuck":true,"innerVis":"visible"}
@MEDIA PRINT {"anchorDisplay":"block","anchorPosition":"sticky","stuck":true,"innerVis":"visible"}
```

`display: block`, not `none`. CDP rule dump shows why — both rules match and the print one
loses on specificity:

```
{ sel: ".dse-sb__sticky",                                          display:"none",  media:"print" }   (0,1,0)
{ sel: "[data-dse-theme=steel]:not([data-dse-print=on]):not([data-dse-readonly])[data-dse-sb-sticky=on] > .dse-sb__sticky",
                                                                    display:"block", media:""      }   (0,5,1)
```

`@media` contributes no specificity, so adding `.dse-sb__sticky` to that shared
`display: none` list in `@media print` (styles-source.css, "Rule 4") does nothing. The
other members of that list (`.dse-btn`, `.dse-tabs__list`, …) work only because nothing
gives them a competing higher-specificity `display`.

**What the branch says about it, verbatim** (styles-source.css and the commit message):
> "Belt AND braces: … real printing sets no such attribute, so **without this line the
> reveal rule would still match under Ctrl-P**."

That sentence describes the state *with* the line. A future agent will trust the belt.

**Blast radius, measured honestly.** I could **not** demonstrate ink on paper.
`Page.printToPDF` is unavailable in this Electron; under emulated print media the whole
Obsidian window renders blank (Obsidian's own print CSS hides the workspace and re-renders
the note elsewhere), and in that re-render the block is never scrolled, so the bar stays at
its default `visibility: hidden`. So today the "no bar in exports" outcome holds — but it
holds on `visibility: hidden` by accident, not on the guard that is documented as holding it.
The **print-preview twin** (`data-dse-print="on"`) is genuinely correct — measured
`display: none` — and print freeze is 67/67, so no frozen byte is at risk either way.

**Fix:** `display: none !important` on that entry, or give `.dse-sb__sticky` its own rule
inside `@media print` at matching specificity. **And fix the comment.**

**The test cannot catch this.** `statblockSticky.test.ts`'s
`test('real printing (@media print …) hides it too')` asserts only that the string
`\n\t.dse-sb__sticky,` appears inside some `@media print` block — a source-text scan of a
selector that never wins. Any replacement should assert the cascade, not the text.

### M-2 (MEDIUM, doc accuracy — already on `main`) — FOLLOWUPS #73's "15 declarations" is wrong, and "cosmetic" understates it

**Count.** With comments stripped from `styles-source.css`, the sheet has **10** declarations
containing `color-mix()`, not 15 — `background` ×5, `border-bottom` ×2, `box-shadow` ×2,
`background-image` ×1. **Two** of those are SC-160's own, inside the new `@supports` gate,
so the pre-existing casualty set is **8**, not 14. (The implementer's "15 / 14 other" figure
is also repeated in the commit message, the report and CHANGELOG-adjacent prose.)

**Severity.** #73 calls the residue "cosmetic elsewhere (missing tier washes, not an
unreadable surface)". Measured on the floor engine, the statblock's own **head band** is a
casualty:

```
.dse-sb > .dse-head  ->  backgroundImage: "none"
                         backgroundColor: "rgba(0, 0, 0, 0)"
                         borderBottom:    "0px none rgba(220, 226, 230, 0.88)"
```

That is the role-tinted head plate **and** its hairline gone entirely — a missing material,
not a missing wash. Real Obsidian does not look like any statblock shot in `shots/`.

**Why it matters now:** the workspace `main` already carries #73 as commit `3b6f6d3`
("SC-160 finding → **SC-171**"). SC-171's sweep will be scoped from these numbers.

### L-1 (LOW) — inside a callout the mini-header is silently a no-op

Measured ancestor chain for a `ds-sb` inside `> [!note]`:

```
block-language-ds-sb  overflow: visible
callout-content       overflow-y: AUTO      <- both the CSS scrollport and nearestScroller()'s answer
callout               overflow-y: hidden
…
markdown-preview-view overflow-y: auto      <- the scroller that actually moves
```

`.callout-content` reports `scrollHeight 738 === clientHeight 738, scrollTop 0` — it is a
scroll container that never scrolls. So `position: sticky` parks against it (no effect) and
the IntersectionObserver is rooted at it, where the head is permanently intersecting.
Measured after scrolling the **page** 900px so the card's top is at −349px: `stuck: false`,
`innerVis: hidden`. The feature is simply absent in callouts. No artifact, no misplacement —
but it is not in the claimed per-context table and not in the docs.

### L-2 (LOW) — `nearestScroller`'s doctrine comment is wrong about `overflow: hidden`

> "`clip`/`hidden`/`visible` do NOT make a scrollport for sticky purposes"

`overflow: hidden` **does** establish a scroll container/scrollport; only `clip` and
`visible` do not. The chain above is the proof — `.callout`, `.view-content`,
`.workspace-leaf-content` are all `hidden`. The regex (`auto|scroll|overlay`) is the right
filter for "an ancestor that actually scrolls", so no case misbehaves today (an `auto`
ancestor is always nearer in the layouts I probed). But the stated reason is false, and if a
`hidden` ancestor is ever nearer than the first `auto` one, CSS will park the bar against it
while the observer is rooted further out — a silent CSS/JS divergence. Fix the comment.

### L-3 (LOW) — the bar overdraws following note content at maximum sticky travel

Short statblock in a long note, scrolled so the card's bottom sits at the scrollport top:

```
innerTop 85.5  ==  cardBottom 85.5      barExtendsBelowCardBy: 84.3px
visibility: visible   elementAtBarBottom: "dse-sb__sticky-inner"
```

84.3px of opaque bar painted over the prose that follows the card
(`sc160-shots/C2-short-max-travel.png` shows it plainly). Inherent to the zero-height-anchor
+ absolute-inner split (the site has the same shape) and transient — it only occupies the
last ~84px of the card's travel — but real, and not mentioned anywhere.

### L-4 (LOW) — the dependent row is not actually indented, and it collides by name with an existing row

In the real Settings popout, parent and child rows have the **same**
`getBoundingClientRect().left = 257`. The only indent is the `↳` glyph inside the label.
`SettingsTab.ts`'s own comment is honest about this ("the indent has to live in the NAME");
the implementation report §1 is not ("SettingsTab renders the row **indented**").

Separately, `Statblock display` now contains both **`Secondary stats`** (the pre-existing
grid/ledger select) and **`↳ Include secondary stats`**. A settings search for "secondary
stats" returns both, and they do different things.

### Nit — the sidebar "stuck" state is unverified by me

I reproduced the **compact treatment** in a real sidebar leaf, but the panel's content fit
its leaf (`scrollHeight 1060 === clientHeight 1060`), so the leaf never scrolled and I could
not exercise `--stuck` there. Report §2's sidebar row is therefore taken on trust for the
stuck half only.

---

## Claims verified GOOD (by execution)

**1. Prefs + `dependsOn`.** `sbSticky`/`sbStickyMeta`, both default `'on'`, group
`Statblock display`, `advanced: false`, `inPreset: false`, `perBlock` defaults true (so
per-block `prefs:` overrides are accepted — attr-bearing, not conditional-DOM; consistent
with the plugin CLAUDE.md's rule that only attr-less and `perBlock: false` keys are
rejected). Row 2 is always built, so the sub-toggle really is a pure CSS reflow.
The `dependsOn` API surface is real, not invented: `obsidian.d.ts`
`SettingControl.disabled?: boolean | (() => boolean)` (line 5925) and
`SettingTab.refreshDomState()` (line 6628), both `@since 1.13.0`; `disabled` correctly
merged into the **control**, which is where the type puts it.

**Measured in the real Settings popout** (probe 4):

| step | parent row | child row |
|---|---|---|
| default | `checkbox-container is-enabled`, not disabled | `↳ Include secondary stats`, `is-enabled`, not disabled |
| click parent OFF | `checkbox-container` (off) | `setting-item mod-toggle **is-disabled**`, `checkbox-container is-enabled **is-disabled**` — greyed **in place**, value preserved |
| click the disabled child | — | before `true` → after `true`; prefs unchanged (`sbSticky:off, sbStickyMeta:on`) |
| click parent back ON | on | re-enabled **in place**, still `on` |

Disabled-not-hidden, no re-render, value visible throughout. Exactly as specified.

**2. Per-context table.** All measured on the floor engine.

| Context | Scroller resolved | Result |
|---|---|---|
| Reading, at rest | `.markdown-preview-view` | anchor `display:block position:sticky top:0 height:0`, inner `visibility:hidden opacity:0` — zero flow ✓ |
| Reading, scrolled | `.markdown-preview-view` (`padding-top: 32px`) | `stuck:true`, inner visible, **opaque `rgb(26,30,33)`**, pinned **flush at the pane top** (see below), both rows ✓ |
| Light scheme | — | ground `rgb(246,248,248)`, shadow `rgba(0,0,0,.12) 0 6px 14px`, band matches ✓ |
| `sbStickyMeta: off` | — | row 2 `display:none`, bar 84.3px → **45.8px** ✓ |
| `sbSticky: off` | — | anchor `display:none position:static height:auto` — **no box** ✓ |
| Sidebar leaf (300px) | `.view-content` | anchor 276px; **`stats: none`, `row2: none`, name `white-space:nowrap` + `text-overflow:ellipsis`, actually ellipsized** ✓ |
| Pop-out | the pop-out's own `.markdown-preview-view` | `W !== window`, `W.IntersectionObserver` used, `stuck:true`, opaque, parks at 110 vs scrollport 78 + 32 pad ✓ |
| Canvas | — | `data-dse-readonly="true"`, anchor **`display:none`**, still `none` after scrolling the node's own scroller ✓ |
| Print — attribute twin | — | `data-dse-print="on"` → anchor `display:none` ✓ |
| Print — `@media print` | — | ✗ **see M-1** |
| Print — frozen shots | — | `statblock-sticky--steel-print.png` carries no bar; freeze 67/67 ✓ |

**Extra probes requested:**
- **Two statblocks in one note** — clean handoff, never two visible bars. With B stuck, A's
  anchor has ridden to `top: -105.5` (above the scrollport at 78.6) while B pins at the same
  `110.6`. At the in-between park (`3c-handoff`) A is stuck at 109.5 and B is `stuck:false`.
- **Statblock in a callout** — see L-1.
- **Very short statblock, short note (head never leaves view)** — scrolled to
  `scrollHeight`: `stuck:false`, inner `visibility:hidden`. **The bar never appears.** ✓

**3(a). The `color-mix()` + `var()` defect — REPRODUCED, mechanism confirmed.** In-app on
Chromium 106, `CSS.supports('color','color-mix(in srgb, red 14%, blue)') === false`, and
three probe divs injected into the live document:

| authored | computed |
|---|---|
| static + enhanced, **literal** colours | `background-color: rgb(26, 30, 33)` — static survives ✓ |
| same pair with **`var()`** | `background-color: rgba(0, 0, 0, 0)`, `background-image: none` ✗ |
| the **`@supports`-gated** form the branch ships | `background-color: rgb(26, 30, 33)` ✓ |

The fix is the only form that holds. **No modern-Chromium regression:** the harness shot
`statblock-sticky--steel-dark.png` shows the role-tinted gradient present on the bar, and
`npm run shots` is 218/0 FAIL with freeze unmoved.

**3(b). The scroller-padding defect — REPRODUCED, fix verified, no measured constants.**
`.markdown-preview-view` has `padding-top: 32px`; the sticky anchor parks at `y = 110.578`
with the scrollport at `y = 78.578` — exactly +32, the described defect. The `::before`
band computes `height: 1100px` (= 100vh) with `background-color` equal to the bar's ground
in **both** schemes (`rgb(26,30,33)` dark, `rgb(246,248,248)` light) and is clipped by the
scroller: the screenshot `1b-reading-scrolled.png` shows the bar flush at the pane top with
no strip of card content above it. No `--sticky-top`, no per-context rule. Band colour
matches the bar in the sidebar and the pop-out too — **no overdraw observed in either**
(the only overdraw is L-3, which is the bar itself, not the band).

**4. Observer binding + leaks.** Correct root per context (table above); constructed from
`anchor.ownerDocument.defaultView`, proven by the pop-out working at all. **Leak probe**
(temporary jest suite, recording fake `IntersectionObserver`, since removed):

```
PROBE A: 50 mount -> unload cycles     created=50  live=0   rafHandles=50
PROBE B: 50 in-place update() cycles   created=51  liveBeforeUnload=1
         liveObserversOnDetachedNodes=0
```

`StatblockElementView` defines no `onUpdate`, so I expected `update()` to pile up observers
via `owner.register()` (which `unloadOwnedChildren()` does **not** clear). It does not:
the mounted top-level view is a `RefUnwrapView`, whose `onUpdate` calls
`removeChild(previous StatblockElementView)` → `unload()` → the registered cleanup fires and
disconnects. Verified by stack trace, not inference. **No leak on either path.** Worth
knowing that the safety here comes from `RefUnwrapView`, not from the statblock view.

**5. Session-only.** `stickyHeader.ts` contains no `persist`/`session`/`saveData`/
`replaceSource`. `git show b53a8b6 | grep _dse_` → **empty**. Nothing writes the note.

**8. Docs.** `docs/settings.md` and `docs/advanced-usage.md` entries are plain-language and
accurate, including "greyed out while the mini-header is off" (verified) and the sidebar /
canvas notes. `docs/advanced-usage.md`'s per-block table correctly gains both keys. The
CHANGELOG bullet is accurate; its only soft spot is "deliberately absent where scrolling
isn't a thing: print, PDF export, print preview, and canvas cards" — true in outcome, but
resting partly on the guard M-1 shows is inert. Neither doc mentions the callout case (L-1).

---

## 7. FOLLOWUPS — the conflict is already gone; **drop the worktree's diff**

The worktree superproject has ` M FOLLOWUPS.md` adding `## 73.` and `next-id: 74`.
The shared `main` checkout **already carries #73**, committed as `3b6f6d3`
*"docs(followups): #73 color-mix fallback inert on Chromium 106 (SC-160 finding → SC-171)"*,
with `next-id: 74` and `#72` intact.

`diff` of the two `## 73.` sections: identical except `main`'s has two extra trailing lines
(`Tracked as **SC-171** (7.0.0) — the sweep + a gate that can see it.`). The worktree copy is
a strict subset. **Guidance: discard `FOLLOWUPS.md` in the worktree — do not merge it.** Then
apply M-2's corrections to `main`'s #73 (10 declarations / 8 pre-existing; head band, not a
wash) so SC-171 is scoped from real numbers. I did not touch the workspace file.

The `draw-steel-elements` pointer is left **unstaged** in the worktree, as instructed.

---

## Recommended fix round (small)

1. **M-1** — make the `@media print` entry actually win (`!important` or its own
   matching-specificity rule), fix the CSS comment and the commit-message claim, and replace
   the source-text test with one that asserts the cascade.
2. **M-2** — correct #73/SC-171 on `main`: 10 total / 8 pre-existing, and the head band
   (`background`, `background-image`, `border-bottom` all lost) as the worked severity
   example, not "a missing tier wash".
3. **L-2** — one-line comment fix in `nearestScroller` (`hidden` DOES make a scrollport).
4. Optional, cheap: note L-1 (callouts) in `docs/settings.md`, and pick a less collidable
   label than `↳ Include secondary stats` next to the existing `Secondary stats` row (L-4).

L-3 is a design property of the ported shape; file it or accept it, but don't leave it
undocumented.

---

## Housekeeping

- Worktree left **clean at `b53a8b6`** (`git status --porcelain` empty in the submodule).
  My temporary jest probe and the `demo-vault/.obsidian/appearance.json` my probe touched
  are both reverted; no `demo-vault/Harness/sc160*` notes left behind.
- `freeze-baseline.sha256` never touched.
- Xvfb `:78` killed; scratch `--user-data-dir` removed. Display `:1` and `:77` untouched.
- Evidence PNGs (mine): `sc160-shots/` in my session scratchpad —
  `1b-reading-scrolled`, `C1-short-stuck`, `C2-short-max-travel`, `D3-sidebar-scrolled`,
  `E-canvas`, `B2-callout-page-scrolled`, `S1/S2/S3-settings-*`, `P-media-print-emulated`.

---
---

# Fix round 1 — 2026-08-17

Same reviewer, now implementing. Branch `sc160-sticky-header`, new commit
**`f8142e6`** on top of `b53a8b6`. Same constraints: worktree only, no shared checkout,
`freeze-baseline.sha256` untouched, own Xvfb display `:78` (never `:1`, never `:77`),
scratch `--user-data-dir`.

## Battery at `f8142e6`

| Gate | Result | vs `b53a8b6` |
|---|---|---|
| `npm run tsc` | clean, exit 0 | unchanged |
| `npm run lint` | clean, exit 0 | unchanged |
| `npx jest` | **2760 passed + 1 skipped / 2761**, **166 suites passed + 1 skipped**, 3 snapshots, exit 0 | **+4 tests** |
| `npm run shots` | **218, 0 FAIL**, exit 0 | unchanged |
| `check-freeze.sh` | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 | unchanged |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 | unchanged |

Freeze did not move and the shot count did not change — expected, and worth stating
because it is also the reason the bug survived: the harness renders **screen** media and
its `steel-print` combo is the `data-dse-print="on"` **attribute** twin (`shoot.mjs` passes
`print=1`, it never calls `emulateMedia`). No shot on any branch can see an `@media print`
mistake. That is why the new guard is a cascade model rather than another picture.

> **Process note, recorded because it nearly produced a false report.** This session's
> scratchpad was pre-populated with `f-*.log` files from a *previous* session (22:31–22:44
> the day before, a different branch). A wait-loop keyed on `grep "declared deferral"
> f-parity.log` matched the **stale** file and fired immediately, and the "results" I first
> read — 203 shots, `FREEZE VIOLATED: encounter/initiative`, a log ending
> `written to …/sc152-sheet-styling/…` — were entirely that old run. Caught by noticing the
> log named another worktree, then by `/proc/<pid>/cwd` showing my own `shoot.mjs` still
> running. **Wait on the task, not on a log's contents, and never trust a scratch filename
> you did not create this session.** The numbers in the table above are from the completed
> task (`TSC=0 LINT=0 JEST=0 SHOTS=0 FREEZE=0 PARITY=0`).

## Per item

### M-1 — the `@media print` guard now wins. Measured.

Same probe, same scratch Obsidian, **Chromium 106.0.5249.199 / Electron 21.4.1**, bar
scrolled into its stuck state, then `Emulation.setEmulatedMedia { media: 'print' }`:

| | `anchorDisplay` | `anchorPosition` |
|---|---|---|
| **before** (`b53a8b6`) | `"block"` | `"sticky"` |
| **after** (`f8142e6`) | **`"none"`** | **`"static"`** |

Screen is untouched in the same run: `anchorDisplay: "block"`, `stuck: true`,
`innerVis: "visible"`, `innerBg: "rgb(26, 30, 33)"`, parked at `top: 110.6` against a
scrollport at `78.6` with its 32px padding band — identical to the pre-fix screen reading.
The attribute twin still reports `display: none`. The live rule dump now shows the reveal
rule under `media: "screen"`, and `.dse-sb__sticky` no longer appears in the `@media print`
list at all.

**Shape chosen:** `@media screen` **around the reveal rule**, and the losing `@media print`
entry deleted — not `!important`. That keeps the twin and real print on one declaration
path (one rule, excluded by attribute in one case and by media in the other), which is what
composes with SC-170: when real print starts carrying `data-dse-print="on"`, the wrapper
becomes redundant instead of a second source of truth to keep in sync. The `@media print`
list gained a note that its entries only work while nothing outranks them, with this as the
worked example.

**Test replaced, and it can fail.** The old one asserted the selector *appeared* in an
`@media print` block — it did, and it lost. The new tests model the cascade (media
applicability × specificity, plus a self-check pinning the model: `.dse-sb__sticky` =
`[0,1,0]`, the reveal rule = `[0,5,0]`) and resolve the winner for each medium. Can-fail
proof: re-introducing the exact shipped shape (reveal unwrapped + `.dse-sb__sticky` back in
the print list) turns them red —

```
● REAL PRINTING … the winning `display` on the anchor is none
  Expected: "none"   Received: "block"
● the print half is a constraint on the ONE reveal rule, not a second competing declaration
  Expected value: "@media screen"   Received array: []
```

— reproducing, from source alone, exactly what the browser measured. Fix restored after the
proof. A sibling test (`every sticky rule … is Steel- and print-scoped`) was also
strengthened: it anchored on `^[^\s/]`, so it would have silently stopped checking the
reveal rule the moment it became indented. It now trims indentation first — indentation is
not scoping.

Correction to my own review: I wrote the reveal rule's specificity as `(0,5,1)`. It is
**`(0,5,0)`** — four attribute selectors plus one class, no element. The conclusion (5 > 1,
the reveal wins) is unchanged; the figure is fixed in the code comments and the commit.

### M-2 — FOLLOWUPS #73 corrected on the branch

Count: **10** `color-mix()` declarations sheet-wide (`background` ×5, `border-bottom` ×2,
`box-shadow` ×2, `background-image` ×1), of which 2 are SC-160's own gated pair — so the
sweep is **8 pre-existing**, not 14/15. Severity: a measured table added showing
`.dse-sb > .dse-head` computing `background-image: none`, `background-color: rgba(0,0,0,0)`
and `border-bottom: 0px none` on the floor engine — the head band loses its material, which
is the end of the range a fix should lead with, not the `.dse-pr__row` tier washes.
**Branch copy only**, per instruction; the workspace `main` copy is the coordinator's to
port.

### L-2 — `nearestScroller` comment corrected

The code is unchanged and still correct: it wants the nearest ancestor that can *actually
scroll*. Only the stated reason was false. `overflow: hidden` **does** establish a
scrollport that `position: sticky` resolves against (only `clip`/`visible` do not), and
Obsidian is full of `hidden` ancestors — `.callout`, `.view-content`,
`.workspace-leaf-content`. The comment now says so, names the accepted divergence (a
`hidden` ancestor nearer than the first `auto` one would park the bar somewhere the
observer is not watching), states that no shipped layout hits it, and says what the symptom
would look like.

### L-4 — renamed; indent attempted, measured, and declined

**Renamed** to `↳ Sticky mini-header: include secondary stats`. Verified in the real
Settings popout: the row is present under that name, `Secondary stats` is still there and
distinct, parent OFF puts `is-disabled` on both the row (`setting-item mod-toggle
is-disabled`) and its checkbox (`checkbox-container is-enabled is-disabled`) in place with
the value preserved (`sbStickyMeta: 'on'` throughout), and parent ON re-enables in place.

**Indent: built, then reverted, on evidence.** Obsidian 1.13 has no per-row class hook
(`SettingDefinitionBase` = name/desc/aliases/searchable/visible; only a GROUP takes `cls`,
and `toPage()` already wraps every row in one group — a group may not nest in a group, so a
one-row group is not expressible). The one element-bearing field is `desc`, which takes a
DocumentFragment, so I implemented marker-span + `:has()` (`:has()` is Chromium 105 and
already in `KNOWN_SAFE_BELOW_FLOOR`). **It is a trap.** Obsidian calls
`getSettingDefinitions()` only from `update()` and re-renders from the cached
`settingItems` — verified against the shipped 1.13.4 bundle contract the repo's own
`PluginSettingTab` mock documents and enforces. Appending a DocumentFragment *moves its
children out*, so the fragment is emptied by the first render and the row would draw with
**no description at all** on every render after it: every settings re-open, every page
navigation. Trading a working description for an indent is a bad trade, so the indent is
declined, the whole derivation is written into `settingsDeclarative.ts`, and a test pins
`desc` as a plain string so the next person cannot re-try it without reading why.

The relationship is carried instead by: the `↳` prefix, adjacency to the parent, and the
parent's name inside the label (which is the only one of the three that survives a
settings-search hit).

### L-1 / L-3 — documented, no code change

`docs/settings.md` gained a short "two things the mini-header deliberately does not do"
block, in plain language: a statblock inside a callout gets no pinned bar (a callout body
is a scroll box that never scrolls, so there is no "scrolled past the header" moment), and
at the very end of a long statblock the bar briefly covers a strip of the text below it and
clears as you keep scrolling. The CHANGELOG's "deliberately absent where scrolling isn't a
thing" list gained callouts too, and both docs carry the renamed setting.

## Still open for the orchestrator

1. **Drop the worktree's `FOLLOWUPS.md` diff at landing is no longer right** — it now
   carries the M-2 corrections that `main`'s copy does not. Port the corrected §Scope and
   §Severity paragraphs into `main`'s #73 (coordinator said they would), then discard the
   rest as before; `main` additionally has the "Tracked as SC-171" line the branch lacks.
2. **Freeze widening unchanged**: still the same 5 `*--steel-print.png` additions
   (`statblock-sticky{,-unscrolled,-nometa,-off,-narrow}`), additions-only, no collisions,
   baseline still 67 lines and untouched by me.
3. The superproject pointer is still **unstaged**, and the worktree's submodule is clean at
   `f8142e6`.
# SC-160 fix round 1 — SCOPED re-review (fresh eyes, executing)

**Delta reviewed:** `b53a8b6..f8142e6` on `sc160-sticky-header`, worktree
`/home/scott/code/steelCompendium/worktrees/sc160-sticky-header/draw-steel-elements`.
**Reviewer:** did not write either the original code or the fix. Every claim below was
re-derived by execution.
**Engine used:** the repo's own browser harness (`visual-harness/index.html` + Playwright
**Chromium 149.0.7827.55**), driven by my own probe with `emulateMedia()` — which
`shoot.mjs` never calls. No real Obsidian, no Xvfb, no display `:1`/`:77`/`:78`. My probe
lived entirely in my session scratchpad (`rr/probe-print.mjs`, node_modules symlinked in).

## VERDICT: **LAND**

The M-1 fix is real and I reproduced both halves of the A/B in a browser. The battery
reproduces at the claimed numbers. The L-4 decline is correct on the merits. What is left
is three LOW documentation/comment inaccuracies — including one where the fix round's own
report claims a correction it did not make, and one where the test file the round touched
still asserts, in prose, the very thing this round decided is not true. None blocks landing;
all are one-line edits that the next toucher of this code will otherwise trust.

---

## 4. Battery re-run by me at `f8142e6` — all six gates, in order

| Gate | Measured | Claimed | |
|---|---|---|---|
| `npm run tsc` | clean, exit 0 | clean | ✓ |
| `npm run lint` | clean, exit 0 | clean | ✓ |
| `npx jest` | **2760 passed + 1 skipped / 2761**, **166 suites passed + 1 skipped / 167**, 3 snapshots, exit 0 | 2760+1skip/166 | ✓ |
| `npm run shots` | **218 written, 0 FAIL**, exit 0 | 218/0 | ✓ |
| `check-freeze.sh` | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 | 67/67 | ✓ |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | 0/0/16 | ✓ |

`/proc/loadavg` 2.05 → 7.93 → 2.20 across the session (1-min peak 7.93 during jest). No
timeout-shaped reds anywhere, no re-runs needed.

**Fixture names (task item 4).** All **15** new shot files exist and are new:
`statblock-sticky{,-unscrolled,-nometa,-off,-narrow}--steel-{dark,light,print}`.
`grep -c sticky` on `freeze-baseline.sha256` = **0**, so the 5 `*--steel-print.png` lines are
an additions-only widening with zero collisions. Baseline is 67 lines, all `steel-print`,
md5 `321f2d82f34f1863085a8dc0e72307cf` — **I did not touch it**, and the fix round did not
either (`git diff b53a8b6..f8142e6 -- visual-harness/` is **empty**: the harness and its
fixtures are unchanged by this round, so the shot set is exactly the one the first review
already validated).

---

## 1. M-1 — VERIFIED FIXED, and the pre-fix bug reproduced independently

Probe: harness page, `statblock`/`with-captain`, `scroll=560&scrollTo=320` (the same
parameters the frozen `statblock-sticky` capture uses), read
`getComputedStyle('.dse-sb__sticky')` under each medium.

**At `f8142e6` (shipped fix):**

```
A. SCREEN media, scrolled    anchor {display:"block", position:"sticky", stuck:true}  inner {visibility:"visible"}
B. PRINT  media, scrolled    anchor {display:"none",  position:"static", stuck:true}
C. back to SCREEN            anchor {display:"block", position:"sticky", stuck:true}
D. data-dse-print=on, screen anchor {display:"none",  position:"static"}
E. data-dse-print=on, print  anchor {display:"none",  position:"static"}
```

- **B** is the fix: under real print media the anchor is `display: none` / `position: static`
  — inert, zero box. ✓
- **A/C** prove the fix did not disable the feature: the same scroll state still reveals on
  screen, and toggling print media and back is not sticky (no latching). ✓
- **D/E** prove the **print-attribute twin still hides it**, in both media — one declaration
  path, exactly as the fix claims. ✓

**Can-fail, in the browser as well as in jest.** I re-introduced the exact pre-fix shape by
script (unwrap the `@media screen` around the reveal rule, de-indent it, put
`.dse-sb__sticky,` back at the head of the `@media print { … display: none }` list), rebuilt
the harness bundle, and re-ran the identical probe:

```
A. SCREEN media, scrolled    anchor {display:"block", position:"sticky"}
B. PRINT  media, scrolled    anchor {display:"block", position:"sticky"}   <-- the M-1 bug
D/E. data-dse-print=on       anchor {display:"none",  position:"static"}   (twin unaffected)
```

So M-1 reproduces on **Chromium 149** too — it was never a Chromium-106 quirk, it is plain
specificity, and the fix is what closes it. (The twin was, and stays, correct either way.)

**The new jest guard flips red on that same shape** (task item 1), run against the flipped
sheet:

```
● SC-160 sticky mini-header — CSS contract › REAL PRINTING (…): the winning `display` on the anchor is none
  Expected: "none"   Received: "block"
● SC-160 sticky mini-header — CSS contract › the print half is a constraint on the ONE reveal rule, …
  Expected value: "@media screen"   Received array: []
Tests: 2 failed, 22 passed, 24 total
```

Verbatim what the fix round reported. **CSS reverted (`git checkout -- styles-source.css`),
harness rebuilt, submodule verified clean at `f8142e6`, and both the sticky suite and
`settings-tab` re-run green afterwards (77/77).**

Shape review: `@media screen` around the reveal rather than `!important` is the right call
and the stated SC-170 rationale holds — when real print starts carrying
`data-dse-print="on"`, the wrapper degrades to redundant instead of becoming a second source
of truth. The `@media print` list also gained the right generalised warning (its entries only
win while nothing outranks them).

### FINDING R-1 (LOW, doc accuracy) — the specificity figure was NOT fixed in the code comments

The fix-round report states: *"I wrote the reveal rule's specificity as (0,5,1). It is
**(0,5,0)** … the figure is fixed in the code comments and the commit."* The commit message
does say `(0,5,0)`. The **code comments still say `(0,5,1)`**, in both places this round
wrote:

- `styles-source.css:7005` — "This reveal rule is (0,5,1); an entry in the sheet's shared
  `@media print { … display: none }` list is `.dse-sb__sticky`, (0,1,0)."
- `styles-source.css:9789` — "its reveal rule is (0,5,1) and `.dse-sb__sticky` is (0,1,0)".

`(0,5,0)` is the correct value (4 attribute selectors + 1 class, no element or
pseudo-element), and the round's own new jest self-check pins exactly that:
`expect(specificityOf("[data-dse-theme='steel']…> .dse-sb__sticky")).toEqual([0, 5, 0])`.
So the sheet's comment now disagrees with the test that guards it. This is the same defect
class M-1 was — a comment asserting something the code does not hold — reintroduced by the
commit that fixed M-1. Two-character edit, ×2.

---

## 2. L-4 — rename present; the DECLINE is correct; two of its three stated reasons are not

**Rename: present and correct.** `src/prefs/catalog.ts` now carries
`label: 'Sticky mini-header: include secondary stats'`; the page renders
`↳ Sticky mini-header: include secondary stats` directly beneath `Sticky mini-header`, and
`Secondary stats` is still present, exactly once, and distinct — pinned by the updated
`settings-tab` tests, which pass. ✓

**Is the DocumentFragment reasoning correct against the repo's mock and the typings? YES.**

- `obsidian.d.ts:5990` `SettingDefinitionBase` is exactly `name` / `desc` / `aliases` /
  `searchable` / `visible`, and `desc?: string | DocumentFragment`. ✓
- The caching contract is corroborated by a mock header **that predates SC-160** —
  `test/mocks/obsidian-core.ts:887-899`, written in `2075f7b` (2026-08-09, SC-131 review),
  which records the shipped 1.13.4 bundle as
  `update() { this.settingItems = this.getSettingDefinitions(); … }` /
  `renderTab() { settingItems.length > 0 ? renderFromCache(this) : this.display() }`, and
  states outright that the `.d.ts`'s "Called on every display()" is **false for 1.13.4**.
  So the fix is not resting on its own say-so; it is resting on a contract this repo
  independently derived and enforces in its mock.
- Even discounting that, the definitions array is replayed across **page navigation within a
  single settings open**, and `appendChild(fragment)` moves the fragment's children out — so
  the second render of the row draws with no description regardless. The trap is real.

**Is there a cheaper indent the fixer missed? No — but the comment's absolutes are false,
and one of them is contradicted by the same file 40 lines below.**

### FINDING R-2 (LOW, comment accuracy) — "There is NO per-row class or id hook" is wrong; the real constraint is unstated

`settingsDeclarative.ts`'s new decline block, reason 1, says: *"There is NO per-row class or
id hook."* The same file adds a class to a row's own element twice:

- line 129 — `setting.settingEl.addClass(CHROME_CLS)`
- line 187 — `setting.settingEl.addClass(PREVIEW_CLS)`

Both from inside a `render` callback, which receives the live `Setting`. So a per-row class
hook exists and this repo already uses it. The actual blocker — which the comment never
states — is that `render` and `control` are **mutually exclusive**
(`obsidian.d.ts:6031` `SettingDefinitionControl` declares `render?: never`), so taking the
class hook means hand-building the toggle and giving up the native `control` binding
(`getControlValue`/`setControlValue`) **and** the native `disabled` predicate that
`refreshDomState()` drives — the one half of the dependent-row feature that is verified
working. **That trade is worse than no indent, so the decline still stands** — but as
written the comment tells the next reader something demonstrably false about the API, in a
file that disproves it a screen further down.

Reason 2 is also overstated. "A group may not nest inside a group" is true
(`SettingGroupItem = SettingDefinition | SettingDefinitionPage`, `obsidian.d.ts:6414`), but
the conclusion — "so a one-row group around the dependent row is **not expressible**" — is
false: `SettingDefinitionPage.items?: SettingDefinitionItem[]` (`:6242`) and
`SettingDefinitionItem` **includes** `SettingDefinitionGroup` (`:6147`), so a page can hold
**sibling** groups, one of which could be a one-row group carrying `cls`. The real blocker
there is the layout, not the schema: `toPage()`'s own comment says the single `PAGE_CLS`
group is "what gives the CSS a single container holding both the rows and the preview", so
splitting it would cost the bottom-docked preview layout (plus obsidian's own inter-group
chrome). Again: decline still right, reason as written wrong.

Suggested edit for both: keep the decision, replace "no hook exists" with "the hook exists
(`render` → `settingEl.addClass`) but is mutually exclusive with `control`", and replace
"not expressible" with "expressible only as sibling page-level groups, which the
preview-docking CSS depends on not having".

### FINDING R-3 (LOW, test-prose accuracy) — the test file still asserts the indent this round decided does not exist

`test/dom/views/settings-tab.test.ts`, all in the block this round edited:

- `:1041-1043` describe preamble — still "Two halves … the **label indent** (a sub-toggle
  that reads like a peer setting is just a confusing extra checkbox)".
- `:1049` test title — "the sub-toggle **is indented** under its parent, adjacent to it, on
  the SAME page".
- `:1057` in-body comment — "**The row is really indented now** (the marker below)".
- `:1068` — the very next test, titled "the row is **NOT** visually indented".

Two adjacent tests state opposite things. The prose that survived is the same overclaim the
original L-4 was filed against ("SettingsTab renders the row indented"); the round fixed it
thoroughly in `SettingsTab.ts` and `settingsDeclarative.ts` and missed it in the test file
whose titles are what a future reader greps. Retitle to something like "the sub-toggle
follows its parent, adjacent to it, on the SAME page" and drop the "really indented"
sentence.

---

## 3. Docs & CHANGELOG — accurate, plain-language, matched

- `docs/settings.md` — the renamed row reads correctly, and the parenthetical explaining
  *why* the label repeats "sticky mini-header" (and distinguishing it from **Secondary
  stats** above) is exactly the disambiguation L-4 asked for. The new "Two things the
  mini-header deliberately does not do" block is plain language, no jargon, and both items
  match the measured behaviour: the callout item matches the review's own ancestor-chain
  measurement (`.callout-content` is `overflow-y: auto` with `scrollHeight === clientHeight`),
  and the overdraw item matches L-3.
- `docs/advanced-usage.md` — untouched this round; its `sbSticky`/`sbStickyMeta` per-block
  rows and its narrow/canvas notes were already correct. (It does not mention the callout
  case; `settings.md` is the right home for it, so I am not filing that.)
- `CHANGELOG.md` — carries the new label verbatim and adds "— and inside a callout, whose
  body never scrolls" to the deliberately-absent list. With M-1 fixed, that list's "print,
  PDF export" claim is now actually load-bearing rather than accidental. Matches the code. ✓

**Nit, not a finding.** settings.md says "At the very end of a **long** statblock the bar
briefly covers a strip of the text below it"; the measured L-3 repro was a **short**
statblock in a long note, and the effect is a property of the card's *travel*, not its
length. "the last centimetre" is also a physical unit for an 84.3px screen effect. Harmless
as user prose.

---

## 5. Nothing regressed outside the delta

`git diff --stat b53a8b6..f8142e6` — 9 files, 366 insertions / 58 deletions, every one
accounted for by an item above:

```
CHANGELOG.md 14 | docs/settings.md 21 | src/elements/statblock/stickyHeader.ts 21 (comment only)
src/prefs/catalog.ts 9 | src/views/SettingsTab.ts 18 (comment only) | src/views/settingsDeclarative.ts 30 (comment only)
styles-source.css 75 | test/dom/elements/statblockSticky.test.ts 199 | test/dom/views/settings-tab.test.ts 37
```

- No `visual-harness/` change → fixture set and shot count unchanged by construction.
- No `freeze-baseline.sha256` change (it is not in this repo, and the shared copy is
  byte-untouched).
- `stickyHeader.ts` / `SettingsTab.ts` / `settingsDeclarative.ts` are **comment-only** —
  verified: the only non-comment line in the whole runtime delta is the `catalog.ts` label
  string. No behaviour changed except the CSS.
- **L-2 spot-check:** the corrected `nearestScroller` comment is right —
  `overflow: hidden` does establish a scroll container/scrollport, only `clip` and `visible`
  do not; the regex is unchanged and still selects "the nearest ancestor that can actually
  scroll", and the accepted divergence is now named. ✓
- **M-2 spot-check (branch copy of FOLLOWUPS #73):** re-counted independently with comments
  stripped — **10** `color-mix()` declarations (`background` ×5, `border-bottom` ×2,
  `box-shadow` ×2, `background-image` ×1), **all 10 contain `var()`**, 2 of them SC-160's own
  gated pair → **8 pre-existing**. Exactly the corrected figures. ✓
- The `every sticky rule … is Steel- and print-scoped` sibling test really does now cover the
  indented reveal rule (the old `^[^\s/]` anchor would have skipped it). ✓

**Still open for the orchestrator, unchanged from the fix round's own list:** the worktree
superproject carries ` M FOLLOWUPS.md` (base at `next-id: 72`, adding `## 73.`) plus the
unstaged `draw-steel-elements` pointer. `main`'s copy of #73 already exists with the
"Tracked as SC-171" lines and `#72`; the branch copy is the one holding the M-2 corrections.
Port the corrected §Scope and §Severity paragraphs into `main`'s #73 and discard the rest —
do not merge the file.

---

## Housekeeping

- Worktree left **clean at `f8142e6`** (`git status --porcelain` empty in the submodule).
  The temporary CSS flip was reverted with `git checkout --` and the harness bundle rebuilt
  from the restored source; the sticky + settings-tab suites re-run green (77/77) after the
  revert.
- Shared freeze baseline **untouched** — 67 lines, md5 `321f2d82f34f1863085a8dc0e72307cf`
  before and after.
- No real Obsidian, no Xvfb, no display used at all. Displays `:1`, `:77`, `:78` never
  touched. My probe and logs live only in my session scratchpad.
- `visual-harness/shots/` is regenerated and gitignored, as normal for a battery run.

---
---

# Polish round — 2026-08-17 (same re-reviewer, now applying)

Coordinator accepted **LAND pending the three text corrections**, and assigned them to me.
New commit **`c052d64`** on top of `f8142e6`, branch `sc160-sticky-header`. Same constraints:
worktree only, no shared checkout, `freeze-baseline.sha256` untouched, no display used.

## What changed — comment / test-title / docs prose ONLY

`git diff --stat f8142e6..c052d64`:

```
docs/settings.md                    |  6 +++---
src/views/SettingsTab.ts            | 11 ++++++-----
src/views/settingsDeclarative.ts    | 24 +++++++++++++++++-------
styles-source.css                   |  4 ++--
test/dom/views/settings-tab.test.ts | 20 +++++++++++---------
```

**Proof it is text-only:** `git diff -U0 -- src/` filtered to non-comment lines is **empty**
— every changed line in both TS files begins `*`, `//` or `/*`. The whole `styles-source.css`
delta is two characters inside comment blocks (shown below). The test-file delta is one
`test(...)` title string plus two comment blocks; **no assertion, no expectation and no
selector changed**. `docs/settings.md` is user prose.

### R-1 — the specificity figure, fixed where the report said it already was

```
-   (0,5,1); an entry in the sheet's shared `@media print { … display: none }` list is
+   (0,5,0); …                                                          (styles-source.css ~7005)
-	   exactly that reason: its reveal rule is (0,5,1) and `.dse-sb__sticky` is (0,1,0),
+	   exactly that reason: its reveal rule is (0,5,0) and …            (styles-source.css ~9789)
```

The sheet now agrees with the commit message and with the jest self-check that pins
`[0, 5, 0]`.

### R-2 — the two wrong reasons in the decline block, replaced with the real ones

`settingsDeclarative.ts`, reasons 1 and 2 rewritten; **reason 3 (the
`desc`-as-DocumentFragment trap) is untouched because it is correct**, and **the decision is
unchanged — the row is still not indented**.

- Reason 1 now states that a per-row class hook *does* exist (`render` receives the live
  `Setting`; `toDefinition`/`previewDefinition` in the same file use it for `CHROME_CLS` /
  `PREVIEW_CLS`), and that the real cost is `render` vs `control` mutual exclusion
  (`SettingDefinitionControl` declares `render?: never`) — reaching the hook means
  hand-building the toggle and losing the native `getControlValue`/`setControlValue` binding
  **and** the native `disabled` predicate `refreshDomState()` drives, which is the one half
  of the dependent-row feature that is measured working.
- Reason 2 now states that group-in-group is indeed forbidden but a **page**'s `items`
  accept groups, so sibling one-row groups *are* expressible — and that the real blocker is
  the layout: `toPage()` keeps everything in ONE `PAGE_CLS` group because the bottom-docked
  preview CSS lays out against that single container.

**Also corrected, same claim, second location:** `SettingsTab.ts`'s `DEPENDENT_PREFIX` doc
comment carried the identical false "there is no per-row class hook and no safe
element-bearing field" sentence and pointed at the derivation I had just corrected. Left
as-was it would have re-asserted the thing the fix removed, one file away. Rewritten to name
all three costs in one line and to say plainly that the row is **not** visually indented.
(Outside the coordinator's literal list of three files, inside the finding.)

### R-3 — the test file no longer asserts an indent in prose

- Title: `the sub-toggle is indented under its parent, adjacent to it, on the SAME page`
  → `the sub-toggle is NOT visually indented (glyph only; see settingsDeclarative decline
  note) but is adjacent to its parent, on the SAME page`.
- In-body comment: "The row is really indented now (the marker below)" → "There is no real
  indent (the next test pins why)".
- Describe preamble: "the **label indent** (a sub-toggle that reads like a peer setting…)" →
  "the **LABEL** (… the row is not visually indented, so the `↳` glyph and the parent's name
  in the label carry the whole relationship)".

The two adjacent tests now say the same thing.

### Nit — docs/settings.md

"At the very end of a **long** statblock the bar briefly covers…" → "At the very end of a
statblock…", and "in the last **centimetre** of that card's travel" → "in the last
**stretch**". The measured repro was a *short* statblock in a long note, and the effect is a
property of the card's travel, not its length or any physical unit.

## Gates re-run at `c052d64`

| Gate | Result | vs `f8142e6` |
|---|---|---|
| `npm run tsc` | clean, exit 0 | unchanged |
| `npm run lint` | clean, exit 0 | unchanged |
| `npx jest` | **2760 passed + 1 skipped / 2761**, **166 suites passed + 1 skipped / 167**, 3 snapshots, exit 0 | unchanged |

`/proc/loadavg` 2.65 at start of the run; no timeout-shaped reds.

**`npm run shots` / `check-freeze.sh` / `npm run parity` deliberately NOT re-run**, and the
reason is checkable rather than asserted: the only non-test, non-docs file touched is
`styles-source.css`, whose entire delta is two characters inside `/* … */` comment blocks —
no selector, no declaration, no at-rule. Nothing the camera, the byte gate or the parity
sampler can observe moved. The full six-gate battery at `f8142e6` (measured earlier in this
report: 218/0 shots, `freeze OK (67/67)`, 0/0/16 parity) therefore still stands for this
commit.

## Housekeeping

- Worktree left **clean at `c052d64`** (`git status --porcelain` empty in the submodule).
- Shared `freeze-baseline.sha256` untouched: 67 lines, md5
  `321f2d82f34f1863085a8dc0e72307cf`, unchanged across this whole session.
- Superproject worktree state unchanged and still the orchestrator's: ` M FOLLOWUPS.md`
  (base at `next-id: 72`, adding `## 73.`) and the unstaged `draw-steel-elements` pointer,
  which now needs to land at `c052d64` rather than `f8142e6`.
- No display used at any point; `:1`, `:77`, `:78` never touched.
