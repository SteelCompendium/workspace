# SC-123 — independent adversarial review

**Reviewer:** independent agent (no code written; worktree left exactly as found).
**Under review:** `sc123-settings-ports` @ `bac3321` (on dse base `9fb56f5` = current `origin/main`).
**Method:** full battery re-run from scratch + 4 live Playwright probe suites against the built
harness (computed styles, DOM, screenshot-byte comparison) + a base-commit render baseline
built by `git archive 9fb56f5` into a scratch tree with its own harness bundle.

**Verdict: FIX ROUNDS NEEDED (one small round).** The seven ports are real, the conditional-DOM
gating works, and default preservation is *proven* — not merely asserted — across 40 renders.
But three behavioural gaps and one factual error are reachable by shipped features, and two of
the implementation report's own claims are false as written.

Colour note: nothing below is distinguished by hue. Every difference described is
shape/position/presence (framed vs unframed, boxed vs bare, present vs absent).

---

## 1. Battery reproduction (my own run, not the report's numbers)

Commands run per the `dse-verify` skill (devbox-wrapped, absolute paths, gate command last,
never piped; `obsidian-shots` NOT run).

| Gate | Claimed | Reproduced | |
|---|---|---|---|
| `npm run tsc` | 0 | **exit 0**, no output | ✅ |
| `npm run lint` | 0 | **exit 0**, no output | ✅ |
| `npx jest` | 2516 passed / 1 skipped / 159 suites / 3 snapshots | **identical**, exit 0 | ✅ |
| `npm run shots` | 294 ok / 0 FAIL | **294 ok / 0 FAIL**, exit 0 | ✅ |
| `check-freeze.sh` (137-line pre-SC-146 baseline) | freeze OK (137/137) | **137/137 OK, 0 non-OK lines, exit 0** | ✅ |
| `check-freeze.sh` (current shared 149-line baseline) | — | **`freeze OK (137/149 producible OK, 12 missing, 0 checksum mismatches)`, exit 0** | ✅ |
| `npm run parity` | 0 / 0 / 16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | ✅ |

**The freeze claim reproduces verbatim.** Run against
`.superpowers/sdd/freeze-baseline.sha256.pre-sc146-fixround-bak` (137 lines — the baseline in
force when the implementer ran), `sha256sum -c` returns **137 `: OK` lines, zero non-OK lines,
exit 0**. Nothing this branch touches moved a frozen byte.

Against the *current* shared baseline the number reads 137/149 only because a sibling worktree
(SC-146) widened it after the implementer's run, with 12 lines for fixtures that exist only on
its own unlanded branch (`statblock-{featstyle-flat,stats-gridc,stats-ledger,columns-wide}--{legacy-dark,legacy-light,steel-print}.png`).
I verified the widening is additions-only (`diff` of the sorted baselines: **0 removed lines**),
that all 12 report as `FAILED open or read` — *missing*, the non-fatal category the SC-117 M3 fix
introduced — and that the script therefore still **exits 0**. Not a finding against SC-123; see
L-1 for the one-line documentation consequence.

---

## 2. Verdict per claim

### 2.1 Default preservation — **CONFIRMED, and stronger than claimed**

The report asserts conditional DOM keeps defaults byte-identical; the freeze only samples
legacy+print PNGs, so I built the real baseline.

Method: `git archive 9fb56f5` → scratch tree → `node visual-harness/esbuild.mjs` → serialised
`#mount.innerHTML` for **8 element/fixture combos × 5 theme/print combos = 40 renders** on both
trees (`statblock/{default,villain-corpus,roleless-corpus}`, `featureblock/{default,advancement}`,
`feature/{default,villain}`, `hero/default`).

Result: **40/40 differ by exactly two intended edits and nothing else.**
1. the 7 new reflected root attributes (`data-dse-kwusage="crest" … data-dse-fb-stats="grid"`),
2. removal of the hard-coded `data-dse-fb-stats="grid"` from `.dse-fb`
   (`src/elements/featureblock/view.ts:73`).

After normalising for those two, the residual diff is **0 characters across all 40 renders** —
including the two paths the brief singled out: the merged characteristics text node
(`<div class="dse-sb__char">Might +2</div>`, no child elements, in every theme) and the villain
inline path (`statblock/villain-corpus`, one flat `.dse-feature__nested`, source order preserved).

I also fingerprinted computed styles at defaults on both trees (`.dse-sb__chars`, `.dse-sb__char`,
`.dse-feature__meta-chips`, `.dse-feature__meta-rail`, `.dse-feature__meta-cell--keywords`) —
identical in all four theme/scheme combinations.

The riskiest refactor — `.dse-fb__stats` losing its `.dse-fb[data-dse-fb-stats='grid'] >` qualifier
and becoming the unqualified base rule (`styles-source.css:2209-2220`) — is safe: I verified the
class is emitted in exactly one place (`featureblock/view.ts:119`), is always a direct child of
`.dse-fb`, and that the new base rule reproduces the old computed values exactly
(`display: grid`, two equal tracks, `column-gap: 24px` = 1.5em, `row-gap: 8px` = 0.5em, even
child `justify-self: end; text-align: right`). No rule sits between the old (0,2,1) and new
(0,1,0) specificities. The `ledger` arm at `styles-source.css:2224` ties the even-child rule on
specificity (both 0,3,0) and wins on order — which is why the explicit `text-align: left;
justify-self: stretch` resets are load-bearing; they are present.

### 2.2 `kwUsage` (crest/text/grid/ledger) — **CONFIRMED** (audit S7), with M-2/L-3/L-6

Live computed styles, Steel dark, `statblock/default`:

| value | `.dse-feature__meta-chips` | cell frame | labels | value |
|---|---|---|---|---|
| crest (default) | `flex`, wrap, gap 8px | border 1px, bg rgba(255,255,255,.02) | hidden (`position:absolute; clip-path: inset(50%)`), `::after` = `": "` | left, 400 |
| text | `flex`, **nowrap**, baseline, space-between, gap 16px | border 0, bg transparent | still hidden | left, 400 |
| grid | `grid 1fr 1fr`, gap 10px | border 1px, bg rgba(0,0,0,.2), `column-reverse`, centred, min-height 68px | **revealed** (`position:static`), `::after` = `""` | centre, **700** |
| ledger | `grid 1fr 1fr`, gap `0 22.4px` | border-bottom only, `row`, space-between, min-height 0 | **revealed** | **right**, 400 |

That is the site's `.sb__field` three-way vocabulary (`steel-statblock.css:163-195`, `:363-379`)
reproduced faithfully, including the two resets the implementer called out (`justify-self:
stretch` / `margin-left: 0` undoing the base 2-col placement and the crest band's
`margin-left:auto`). `crest` is byte-identical to today's default — proven by §2.1.

### 2.3 `distTarget` (grid/text/ledger) — **CONFIRMED** (audit S8), but see **M-4**

| value | `.dse-feature__meta-rail` | cells |
|---|---|---|
| grid (default) | `grid 1fr 1fr` gap 10px | framed, column-reverse, centred, min-height 68px |
| text | `flex`, baseline, space-between | frameless `row`, labels kept inline (site parity), target cell `text-align: right` |
| ledger | `grid 1fr 1fr` gap `0 22.4px` | hairline row, label left / value right |

Matches `steel-statblock.css:383-389` + the shared `.sb__field` arms. **But the premise is
wrong** — see M-4: the site's default for this key is `grid`, not `text`, so this is not a
divergence at all.

### 2.4 `sbCharLine` / `sbCharBox` — **CONFIRMED for Steel**, see **M-3** for Legacy

DOM, live:

- default (`one`/`off`): `<div class="dse-sb__char">Might +2</div>` — one text node, 0 children.
- any other combination: `<div class="dse-sb__char"><span class="dse-sb__char-box">M</span><span class="dse-sb__char-v">+2</span><span class="dse-sb__char-l">Might</span></div>` — DOM order box→value→label, matching `steel-statblock.css:205-235`.

Computed layout, Steel dark:

| combo | `.dse-sb__char` | box | value | label |
|---|---|---|---|---|
| `two`/`off` | `grid`, gap 1.6px | `display:none` | 28px | shown, small-caps |
| `one`/`on` | `flex`, centre, gap 6.4px | `grid`, order 1 | order 3, **16px** | **`display:none`**, order 2 |
| `one`/`onword` | `flex`, centre | `grid`, order 1 | order 3, 16px | shown, order 2 |
| `two`/`on` | `grid`, areas `"box val" "lbl lbl"` | area `box` | area `val`, 28px | area `lbl` |
| `two`/`onword` | **identical to `two`/`on`** | | | |

**The site quirk is reproduced exactly.** I screenshotted `.dse-sb__chars` at `two+on` and
`two+onword` and compared the PNG buffers: **`identical bytes: true`**. That is the strongest
possible proof of the S5 quirk claim and it holds.

`sbCharLine='one'` is correctly never named in a selector; the one-line arms key off
`:is([data-dse-sb-charbox='on'],[…='onword']):not([data-dse-sb-charline='two'])`
(`styles-source.css:2059-2073`), and `pref-reflection.test.ts` enforces the convention.

### 2.5 `sbVillain` (inline/banded) — **CONFIRMED** (audit S9 / FOLLOWUPS #54)

`inline`: no `.dse-sb__band`, single `.dse-feature__nested`, source order
`main, villain, villain` on `villain-corpus` — byte-identical to base (§2.1). ✅

`banded`, live DOM of the head:

```
<button class="dse-collapse__header" type="button" aria-controls="dse-collapse-region-1" aria-expanded="true">
  <span class="dse-collapse__chevron" data-icon="chevron-right">…</span>
  <span class="dse-sb__band-crest" data-icon="skull">…</span>
  <span class="dse-collapse__title">Villain Actions</span>
</button>
```

- real `<button>`, aria wired, chevron → crest → title order as the test asserts. ✅
- band: `border 1px solid`, radius 6.4px, `overflow: hidden`, `background: color(srgb .878 .345 .294 / .08)` — i.e. `--dse-act-villain` = `#e0584b`, the site's exact villain hue (`steel-statblock.css:404` uses the same colour at 6%). Framed all the way round, no left spine → DESIGN.md rule 7 honoured. ✅
- crest colour `rgb(224,88,75)`. ✅
- partition on `statblock/default`: main run `main, maneuver, triggered, trait, trait`; band holds `villain, villain, villain`. Nothing lost, one `.dse-hr` divider (unchanged). ✅
- print: `.dse-collapse__region` computes `display: block`, height 403px → forced open, inherited from the kit primitive as claimed. ✅
- clicking the header collapses it (`aria-expanded=false`, region `hidden`, `display:none`). ✅

**Undocumented divergence worth recording:** the site's `inline` does *not* restore source order —
it always builds the band and strips its chrome (`steel-statblock.css:474-477`), so villain
actions stay grouped. The plugin's `inline` is true source order. The plugin's behaviour is the
correct one (freeze-mandated and arguably better), but the report presents `inline` as "the
site's inline", which it is not.

### 2.6 `fbFeatureStyle` (card/flat) — **CONFIRMED** (audit S17), see L-8

Steel: default `gap 10.4px`, option bg rgba(0,0,0,.16), radius 9px, pad-left 16.6px →
flat: `gap 0`, bg transparent, radius 0, pad-left 11.8px, pad 4px top/bottom. Exact twin of the
statblock's three flat arms, with the light restatement present. ✅

I also settled the comment's claim at `styles-source.css:3796-3798` ("a nested featureblock's
options are flattened by their own preference"): every `.dse-fb` is created by
`FeatureblockElementView.onMount` on a pipeline-stamped root, so a nested fb *always* has its own
`[data-dse-element='featureblock']` ancestor and the fb arms always match. **The claim is true.**

### 2.7 `fbStats` (grid/ledger) — **CONFIRMED**, with a fidelity caveat

- `card.setAttribute('data-dse-fb-stats','grid')` is gone; live DOM confirms `.dse-fb` has no
  such attribute and the element root carries the reflected value. ✅
- the previously-dead `ledger` arm is reachable and works: `.dse-fb__stats` → `display:block`,
  each `.dse-fb__stat` → `flex`, space-between, `border-bottom 1px`, `justify-self: stretch`,
  `text-align: left`. Matches the site (`steel-featureblock.css:115-117`). ✅
- default `grid` computes identically to the old hard-coded path (§2.1). ✅

Caveat (not a defect, but the parity story is thinner than it reads): the site's `fb-stats: grid`
is **auto-fit framed value-over-label cells** (`steel-featureblock.css:104-110`); the plugin's
`grid` is the legacy two-per-row loose pairing. Only `ledger` is an actual port of the site's
look. The composite `sc123-10` honestly labels its left half "PLUGIN BEFORE", not "SITE", so the
evidence is not misleading — but the settings row named "Grid" does not deliver the site's Grid.

### 2.8 Preset bundles 4 → 9 — **CONFIRMED**, see L-2

- all three bundles carry the identical 9-key set; the set equals exactly the `inPreset`
  descriptors; the fb pair is correctly excluded (the site has **no** fb presets —
  `settings-panel.js:44-46`: *"No presets (only two prefs)"*). ✅
- `applySbPreset` writes all 9 (`catalog.ts:494-498`); `deriveSbPreset` requires all 9
  (`:485-491`) → switching presets can leave no stale member, because the key sets are equal. ✅
- `steel` == descriptor defaults, member for member (guarded by the new test; I re-read the
  literals and confirmed). A fresh install therefore derives **"Steel card"**, not "Custom". ✅
- `sourcebook`/`index` carry the site's values for the five new members verbatim vs.
  `settings-panel.js:36-38`. ✅

### 2.9 Settings UI + preview — **CONFIRMED**

- `Featureblock display` is a real `PrefGroup`, inserted immediately after `Statblock display`
  in `GROUP_ORDER`; the nav model is built by iterating `GROUP_ORDER`
  (`SettingsTab.ts:244-246`), and `settingsDeclarative.ts` is a pure mapper over `NavSection`, so
  the new rows need no per-pref wiring — confirmed by the page-list tests.
- the five statblock rows are all `ui.advanced` → they land on the section's nested Advanced page
  (`settingsDeclarative.ts:172-189`), leaving the primary page exactly as today. ✅
- preview gating is derived, not listed: `sectionShowsPreview` (`SettingsTab.ts:315-317`) returns
  true for any group with an `attr`/`css` descriptor, so the new section inherits a preview. ✅
- **preview-ownership contract respected**: `renderPreview` still creates a fresh `Component` per
  *mount*, and returns `() => owner.unload()` as Obsidian's row cleanup (`SettingsTab.ts:298-309`)
  — unchanged from SC-131. The only additions are a 4th argument and a subject-scoped
  `blockKey()` (`SettingsPreview.ts:218`), which correctly prevents the two subjects sharing a
  session slot. No new subscription is created outside the owner. ✅
- the fire-and-forget `fw.pipeline.run(...).catch(...)` in `mountSettingsPreview` is pre-existing
  SC-131 behaviour, not introduced here.

### 2.10 Scope discipline — **CLEAN**

The diff touches **none** of SC-146's declared surfaces:
- `sbStats` arms (`styles-source.css:1996-2016`) — untouched;
- `gridc` — absent;
- existing preset members (`sbFeatureStyle`/`sbDensity`/`sbColumns`/`sbStats`) in all three
  bundles — byte-identical to base;
- statblock flat ◆ separators — absent;
- `sbColumns` algorithm (`:1988-1994`) — untouched.

The one shared file, `catalog.ts`, is additive-only in `SB_PRESETS` (new members appended to each
bundle, existing members verbatim). Conflicts at rebase are certain but mechanical, as the report
says. One coordination fact the report does not know: **SC-146's worktree has already widened the
shared freeze baseline 137 → 149 without landing**, which is why this branch now reports 12
missing lines (see L-1).

---

## 3. Findings

### M-1 · MEDIUM · A per-block `prefs:` override of a conditional-DOM key renders corrupt output — and the report claims the opposite

**Where:** `src/elements/statblock/view.ts:307-310` (`charsAreSplit()` reads the **global** store)
vs `src/framework/prefOverrides.ts:77-84` (per-block override re-stamps the **attribute only**,
never re-renders). Every one of the seven new keys has an `attr`, so `prefOverrides.ts:52` accepts
all of them.

**The report's claim, which is false:** `view.ts:178-181` — *"a block that pins `sbCharLine`
locally gets the global shape with local attributes; the layout arms are written so that pairing
degrades to the default look rather than to a broken one."*

**Reproduced.** Global `sbCharLine: two` (split DOM built), then attribute re-stamped to `one`
exactly as `prefOverrides` does:

```
before  display=grid   rendered="+2\nMight"   (box hidden, value 28px, label small-caps)
after   display=block  rendered="+2Might"     (box hidden, -v and -l inline, no arm matches)
```

`"+2Might"` — the value and the word concatenated with no separator, no box, no layout. It is
corrupt, not "the default look". The cause is structural: `one`/`off` is the default pair, so by
the sheet's own convention no selector names it, and the split spans fall back to bare inline
boxes.

The other three directions are benign (I checked all four): global-default + per-block `two` or
`on` leaves the merged node inside a grid/flex cell and still reads `"Might +2"`.
`sbVillain` has the mirror-image failure with a softer symptom: global `banded` + per-block
`inline` leaves the band fully built and visible — the override is a **silent no-op** with no
diagnostic (verified: `bandStillThere: true`, header `display: flex`).

**Prescribed fix (pick one, all small):**
1. *Preferred* — mark the three conditional-DOM descriptors as not per-block overridable (a
   `perBlock: false` flag consumed at `prefOverrides.ts:52-57`, warning through the same channel
   the behavioural-key rejection already uses). Honest, and it makes the limitation visible to
   the author instead of to the reader.
2. Or make `charsAreSplit()` / `renderFeatures` read the *effective* per-block value by exposing
   the override bag on `RenderContext` — bigger, but it makes the feature actually work per block.
3. A CSS-only patch cannot fix it without naming a default value in a selector, which
   `pref-reflection.test.ts` forbids.

### M-2 · MEDIUM · `kwUsage` and `distTarget` are silently dropped in print and export

**Where:** every arm at `styles-source.css:5245-5401` carries
`[data-dse-theme='steel']:not([data-dse-print="on"])`.

**Reproduced:** under `print=1`, `kwUsage: ledger` leaves `.dse-feature__meta-chips` at
`display: contents` (the Legacy base), i.e. the mode vanishes. Meanwhile `sbCharLine: two`
(`display: grid`), `sbCharBox`, `sbVillain` (band forced open) and `fbStats: ledger`
(`display: block`) **do** carry into print, because those arms are theme-agnostic.

So a user on Sourcebook or Index card gets an on-screen layout that their printout/export
silently disagrees with, in two of the five statblock settings but not the other three. The site
does the opposite: it keeps every layout mode in print and only strips backgrounds
(`steel-statblock.css:654`).

**The freeze cannot be the reason.** Every print arm would be keyed on a non-default value
(`kwusage='text'|'grid'|'ledger'`, `disttarget='text'|'ledger'`), and `*--steel-print.png` is
captured at defaults — so the rules are unreachable by every frozen camera by construction, the
same argument the implementer uses three times elsewhere. The `:not([data-dse-print="on"])`
exclusion here is over-broad.

**Prescribed fix:** drop `:not([data-dse-print="on"])` from the `kwUsage`/`distTarget` mode arms
(keep it on anything that paints a background/gradient, and add a print arm that flattens those
to `background: none` like the site does). Re-run freeze to confirm 0 mismatches — it will be 0.

### M-3 · MEDIUM · Under Legacy the new hairline/frame arms paint nothing, and `sbCharBox: on` loses the characteristic's name with nothing in its place

`--dse-rule` is **undefined** outside Steel and `--dse-metal-line` resolves to `none` (measured on
the element root: legacy `{rule:"", metalLine:"none", metalFaint:"none", actVillain:"none"}`;
steel `{rule:"#8e959a", metalLine:"rgba(176,183,187,.5)", actVillain:"#e0584b"}`). Any
`border: 1px solid var(--dse-rule)` is therefore invalid-at-computed-value-time in Legacy and
computes to width 0. Measured consequences:

| rule | Steel | Legacy |
|---|---|---|
| `.dse-sb__char-box` border (`styles-source.css:2043-2054`) | 1px solid, gradient ground | **0px, `none`, transparent** |
| `.dse-sb__band` border (`:2140-2145`) | 1px solid, tinted, radius | **0px, `none`, no tint** |
| `[data-dse-fb-stats='ledger'] .dse-fb__stat` border-bottom (`:2224-2231`) | 1px solid `#8e959a` | **0px, `none`** |

The first is the damaging one. At `sbCharBox: on` the CSS also sets
`.dse-sb__char-l { display: none }` (`:2077-2079`), so a **Legacy** user who turns on "Boxed first
letter → Letter only" gets `M +2` with **no box and no word** — the affordance the setting is
named for is absent and the information it was allowed to replace is gone. Measured: legacy
dark/light both `borderTopWidth: 0px, borderTopStyle: none, backgroundColor: rgba(0,0,0,0)`,
`labelDisplay: none`.

The `.dse-sb__band` and `fb-stats` cases are cosmetic degradations (unframed band, hairline-less
"Ledger"), and there is precedent — the pre-existing `sbStats: ledger` arm at
`styles-source.css:2001` has the same flaw. But SC-123 triples the surface and adds the first
case that destroys content, while the CSS comment at `:2050-2051` asserts *"the theme-agnostic
layout arms above already give Legacy a sane split."*

**Prescribed fix:** give the three declarations a non-Steel fallback —
`var(--dse-rule, var(--background-modifier-border))` and
`var(--dse-metal-line, var(--dse-rule, var(--background-modifier-border)))` — Obsidian defines
`--background-modifier-border` in every theme, and the tokens are undefined at Legacy defaults so
no frozen shot can see the change. At minimum, gate the `.dse-sb__char-l { display: none }` drop
behind a context where the box actually paints, so no configuration ever renders a bare initial.

### M-4 · MEDIUM (correctness of the record) · "The site ships `disttarget=text`" is false — the site's default is `grid`

`v2/docs/javascripts/settings-panel.js:31-33`:

```js
var SB_DEFAULTS = {
  kwusage: "crest", featstyle: "card", disttarget: "grid", meta: "grid", charline: "two",
  charbox: "off", villain: "banded", wide: "off", stickymeta: "on"
};
```

`disttarget` defaults to **`grid`**, identical to the plugin's chosen default. Only **two**
defaults diverge from the site (`charline`, `villain`), not three.

The error originates in the SC-146 audit (§2 row S8 lists "Values (default first): text / grid /
ledger") and has been copied into four places on this branch, where it will mislead the next
porter and overstates the divergence the report asks Scott to rule on:

- `sc123-impl-report.md` §3(a) — "The site ships `disttarget=text`, `charline=two`, `villain=banded`";
- `src/prefs/catalog.ts:294-295` — "site defaults are disttarget=text, charline=two, villain=banded";
- `test/unit/prefs/catalog.test.ts:1455-1457` — same sentence in the test comment;
- `styles-source.css:5240-5243` — "the site defaults `disttarget` to `text`".

**Prescribed fix:** correct all four (and feed the correction back to the SC-146 audit's §2/§4
rows) so the "deliberate divergence" section names the two keys it actually covers.

### L-1 · LOW (documentation only) · Annotate the freeze line for the moved baseline

The claim "freeze OK (137/137)" is **correct** and I reproduced it exactly against the 137-line
baseline in force at the time (`freeze-baseline.sha256.pre-sc146-fixround-bak`). Since then
SC-146's worktree widened the shared baseline to 149 (additions-only, verified 0 removed lines),
so a reader re-running the gate today sees `137/149 producible OK, 12 missing, 0 checksum
mismatches` — still exit 0, still zero mismatches. Add one sentence to the implementation report
naming the 12 as SC-146's unlanded fixtures, so the next reader does not read 137/149 as a
regression. No code change.

### L-2 · LOW · No migration: existing Sourcebook / Index-card users silently become "Custom"

Derivation now requires all 9 members. A user who had picked "Sourcebook" before this change has
`sbStats: ledger` stored and the five new keys at their (Steel-card) defaults, so
`deriveSbPreset` returns `custom` on first open after upgrade. The settings-tab test change at
`test/dom/views/settings-tab.test.ts:195-201` documents exactly this shift. Nothing is broken and
their rendering is unchanged; but the dropdown will read "Custom" for people who never chose it —
the same failure mode §3(b) of the report goes out of its way to avoid for fresh installs.
**Prescribed fix:** either accept and say so in the CHANGELOG, or add a one-shot migration: if the
four legacy members exactly match a bundle and the five new keys are unset, write that bundle.

### L-3 · LOW · The colon reset is unscoped and reaches the distance/target rail

`styles-source.css:5348-5352`:
`[data-dse-kwusage='grid'] .dse-feature__meta-key::after, [data-dse-kwusage='ledger'] .dse-feature__meta-key::after { content: ""; }`
— no `.dse-feature__meta-chips` qualifier, so it also clears the rail's keys. Currently inert (I
measured: the rail key's `::after` is already `""` at every setting; only the chip band's is
`": "`), but it is a latent cross-pref coupling: the *keyword* setting silently controls the
*distance* rail's punctuation. One-word fix: insert `.dse-feature__meta-chips ` into both
selectors.

### L-4 · LOW · Two missing type-scale bumps vs the site

- `steel-statblock.css:231` gives `.sb__char-v { font-size: 1.25rem }` at `charline="one"`; the
  plugin's one-line arms set no size, so the value renders at 16px body size while the two-line
  arm bumps to 28px. This is precisely the Sourcebook preset's configuration, and it is visible
  in `sc123-07`.
- `steel-statblock.css:418` gives `.sb__band-title { font-size: 1.25rem }`; the plugin's band
  title inherits 16px (measured). Visible in `sc123-08` — the plugin's "VILLAIN ACTIONS" head
  reads noticeably lighter than the site's.

### L-5 · LOW · `grid`/`ledger` keep two tracks when only one meta cell exists

On `feature/villain` (keywords, no usage) the chip band has 1 child but computes
`grid-template-columns: 350px 350px` → a blank half-track. The site has the same shape, so this
is parity-faithful; flagging because the plugin's cell set is genuinely optional where the site's
is not. `grid-template-columns: repeat(auto-fit, minmax(0,1fr))` would close it.

### L-6 · LOW · `grid`/`ledger` reset the keyword run's small-caps; the site keeps it

`styles-source.css:5300-5303` / `:5341-5344` set `font-variant: normal; text-transform: none;
letter-spacing: normal` on the keyword cell. The site's grid/ledger modes only strip the chip's
border/background/padding (`steel-statblock.css:372-376`) and keep the small-caps voice. Visible
in `sc123-02`: the site reads `MAGIC, RANGED, STRIKE`, the plugin reads `Magic, Melee, Strike,
Weapon`. Narrated as matching; it is close but not the same treatment.

### L-7 · LOW · Two composites overstate their pairing

- `sc123-07-charbox-on.png` puts the site's `charbox=on` **at the site's default `charline=two`**
  (box+value over the word) beside the plugin's `charbox=on` **at the plugin's default
  `charline=one`** (box+value, word dropped), under one shared heading. Those are different
  configurations; the honest pairing is site `charline=one,charbox=on` vs plugin ditto.
- Several composites (`01`, `02`, `07`, `08`) crop the plugin panel mid-card (the site panel is
  much taller), so the plugin half shows only its first ~230-460px. Cosmetic, but it means the
  evidence does not actually show the surfaces below the fold.

### L-8 · LOW · `fbFeatureStyle: flat` has no ◆ separators; the site's does

`steel-featureblock.css:165-185` gives the site's flat mode line+dots+diamond separators between
options. The plugin's fb `flat` inherits the statblock flat mode's existing gap (audit S6: "plugin's
`flat` inserts none"). Correctly out of scope here — but when SC-146 adds ◆ to the statblock's
flat mode, the fb twin at `styles-source.css:3836-3858` must be updated in the same pass or the
two "Flat list" settings will diverge from each other.

### L-9 · LOW · Two housekeeping items (both self-flagged, repeated for the landing checklist)

- `CHANGELOG.md` still says the settings tab is "nine navigable pages"; it is ten.
- `FOLLOWUPS.md #54` (villain banding) is done by this work and not marked.

---

## 4. Recommendation

One fix round, all four Medium items, none of which touches architecture or can move a frozen
byte:

1. **M-1** — reject the three conditional-DOM keys from per-block `prefs:` (or make them
   effective per block). Add a regression test for the `"+2Might"` shape.
2. **M-2** — un-scope `kwUsage`/`distTarget` from `:not([data-dse-print="on"])`, add the site's
   print background flattening, re-run freeze (expect 0 mismatches).
3. **M-3** — token fallbacks on the three new border declarations; at minimum stop
   `sbCharBox: on` dropping the word where no box paints.
4. **M-4** — correct the `disttarget=text` claim in all four places (and upstream in the SC-146
   audit).

Then re-run the battery and correct the freeze line (L-1). Everything else is Low and can land
as follow-ups. The core of the ticket — seven working ports, a proven-inert default state, a
faithfully-reproduced site quirk, and clean scope separation from SC-146 — is sound work.

---

## 5. Evidence

Probe scripts and raw output (scratch, not committed):
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/sc123/`
— `pref-probe.mjs` / `probe.log` (per-pref computed styles, charbox byte-comparison, legacy +
print leakage), `probe2.mjs` / `probe2-{branch,base}.log` (token values, default fingerprints),
`probe3.mjs` (legacy borders, single-cell bands, band toggle), `probe4.mjs` (per-block override
simulation), `dom-dump.mjs` + `dom-{base,branch}.json` (the 40-render default baseline),
`base/` (the `9fb56f5` scratch tree), `{tsc,lint,jest,shots,freeze,parity}.log`.

Worktree left clean: `git status --short` in `draw-steel-elements` is empty; the superproject
shows only the implementer's deliberately-unstaged pointer bump.
