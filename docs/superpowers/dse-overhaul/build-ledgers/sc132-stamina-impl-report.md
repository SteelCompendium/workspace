# SC-132 round 8 — PRODUCTION implementation (2026-08-10)

The seven design rounds are closed (Scott's final confirms: Linear comments `67763d6d` —
his layout — and `cebbf5cf` — keep the crest, the rail tweaks, "light is fine as-is").
This round deletes the candidate scaffolding and re-authors the round-7 winner as
production code across the element, the hero sheet, both stamina modals, the settings and
the docs. **SC-132 is the last child of SC-97**, the High-Fantasy Steel overhaul.

**Branch:** `sc132-stamina`, dse `fe2222f..97c71d2` (11 commits — 8 implementation, 2 from
the review fix round (§11), 1 from Scott's final gate (§12)) on `origin/main` (`74adb05`).
NOT pushed. **Scott has approved: ship it, and the 5-line rebaseline is SANCTIONED**
(comment `b3b6806d`). Superproject pointer left uncommitted.
**Superproject:** reset to `origin/main` (`8e05800`), dropping the stale `4068c5a`
(a duplicate of `172bebf`, already on main); `steel-etl` and `v2` re-pinned to main's
commits. One superproject commit, `5ccb5b7` (the workspace CHANGELOG bullet), so that the
`draw-steel-elements` gitlink is the ONLY dirty thing left, as required.
**Linear:** self-contained gate comment `02903859` with 8 inlined boards. In Progress,
labels `["Needs Review"]`.

---

## 1. Battery (real exit codes via a wrapper SCRIPT — `echo $?` under devbox lies)

Final numbers, after Scott's gate round (§12); artifacts `impl3-*`:

```
npx tsc --noEmit   exit 0
npx jest           exit 0   156 suites, 2414 tests, 3 snapshots
npm run shots      exit 0   229 ok, 0 FAIL
check-freeze.sh    exit 1   5 checksum mismatches (the sanction ask, §5), 114/119 OK
npm run parity     exit 0   0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)
```

The freeze result is **unchanged by the fix round** — same five names, and their after
hashes are byte-identical to the ones already reported to Scott (re-verified, §11).

`obsidian-shots` NOT run: `pgrep -af obsidian` shows a live instance owning the display.

| gate | main | here | delta |
|---|---|---|---|
| jest tests | 2354 | **2414** | +60 |
| jest suites | 155 | **156** | +1 (`test/unit/kit/staminaGauge.test.ts`) |
| browser shots | 204 | **229** | +25 (5 new fixture NAMES × 5 combos) |
| freeze | 119/119 | 114/119 | 5 mismatches (§5) |
| parity | 0/0/16 | 0/0/16 | unchanged |

The +49 tests, exactly:

| where | + | what |
|---|---|---|
| `test/dom/kit/kit-index.test.ts` | 6 | its two `test.each(kitFiles)` blocks × 3 new kit modules |
| `test/unit/kit/staminaGauge.test.ts` | 19 | NEW suite — the coordinate model as properties (+4 from the review round) |
| `test/dom/elements/staminaRecoveries.test.ts` | 19 | Model M (9), the undo toast (5), the popover setting (5) |
| `test/dom/views/stamina-edit-modal.test.ts` | 6 | the preview gauge, temp geometry, the delta band |
| `test/dom/elements/heroSheet.test.ts` | 6 | the stepper is gone, the cluster renders, markers persist; + 3 for review H1 |
| `test/dom/harness/fixtures.test.ts` | 3 | its `test.each(FIXTURES)` × 3 new stamina fixtures |
| `test/dom/kit/kit-index.test.ts` | 1 | the new tabindex-vs-focus-ring guard (review M1) |

Parity is unchanged and that is the correct answer, not a coincidence worth glossing:
the stamina family has **no steelcompendium.io counterpart**, so no `selector-map.json`
pair names any node this round touched, and `git diff origin/main...HEAD --
visual-harness/parity/` is empty.

---

## 2. Architecture of the production code

### 2.1 The split: three shared kit modules

The cluster renders on four surfaces (standalone element, hero sheet, stamina edit modal,
minion pool modal). The candidate stage got away with one superset DOM because nothing
shipped; production needs one implementation and four consumers.

**`src/framework/kit/staminaGauge.ts` (NEW)** — the gauge builder plus the one written
statement of its coordinate model.

- `staminaGaugeGeometry(values, opts)` is **pure**: no DOM. That is what lets the modal
  compute a *pending* state's geometry without touching the committed model, and it is
  what made the 15-test property suite possible.
- `renderStaminaGauge` / `updateStaminaGauge` build and refresh; `setStaminaGaugeDelta`
  draws the modal previews' pending band.
- `staminaState` (healthy | winded | dying) moved here from `StaminaBarPanel`, so the
  cluster, the gauge and both previews cannot disagree about where "winded" starts.
  FOLLOWUPS #27a's inclusive `<=` is preserved verbatim with its citation.
- Options: `dyingZone` (false collapses the bulkhead onto the channel's left edge — the
  creature/minion case) and `ticks` (the minion pool's per-minion death marks, rendered in
  the gauge's own graduation vocabulary).

**`src/framework/kit/RecoveriesStrip.ts` (NEW)** — the strip, which existed TWICE in
near-identical copies (`stamina-bar/view.ts` D7 Task 4 and `hero/view.ts`'s re-expression
against `HeroState`). Tolerable at three read-only pips and a button; not tolerable once
Model M adds click-to-set, a keyboard value control, G4 grouping, the eyebrow, per-marker
labelling and an optional popover. Both views now compose it and keep only what they own
(their model, their winded/dying derivation, their persist path).

- `markerTarget(index, remaining)` is Model M's set-rule **alone**, so it is testable
  without a DOM: `index < remaining ? index : index + 1`. Clicking an available marker
  spends up to and including it; clicking a spent one restores up to and including it. So
  the last available marker spends exactly one, the first spent marker restores exactly
  one, no click is a no-op, and neither end of the row is a trap.
- **ARIA: the row is ONE `role="slider"`, not N focusable markers.** That is the honest
  ARIA for a value control (Model M's own description), it keeps the tab order to one stop
  instead of twelve, and — load-bearing for the freeze — it leaves the markers as
  decorative `div`s. Real `<button>`s would put UA chrome inside a 12px cell and change
  what the LEGACY theme renders.
- Keyboard: arrows step, Home/End empty and refill, Escape closes the popover.

**`src/framework/kit/undoNotice.ts` (NEW)** — Scott's own answer to "I dont want a
missclick to be super punishing": no confirmation in FRONT of a one-click edit (that taxes
the 999 correct clicks to protect the 1 wrong one), an escape hatch BEHIND it. Built from
a `DocumentFragment` because a Notice needs a real clickable node and obsidian renders a
string message as text. Uses plain `document.createElement`, deliberately NOT obsidian's
`createSpan`/`createEl` — those are an augmentation of `Node` a DocumentFragment only
carries inside a real obsidian runtime.

### 2.2 The DOM, and why it is unconditional

`StaminaBarPanel.renderStaminaBar` builds the cluster **always**, and the BASE stylesheet
hides it (`.dse-stamina__cluster, .dse-stamina-rec__eyebrow { display: none }`). This is
the convention `kit/crest.ts` already uses, and here it is the only correct option: the
theme is a live CSS attribute (`seams/theme.ts` is the single writer of `data-dse-theme`,
and nothing re-renders on a switch), so a DOM that branched on the theme would be wrong
the instant the user flipped it.

```
div.dse-stamina[.dse-stamina--clickable]
  div.dse-stamina__track            ← LEGACY, untouched; Steel-screen hides it
  div.dse-stamina__cluster          ← base-hidden; Steel-screen shows it as the grid
    span.dse-crest.dse-stamina__crest[aria-hidden] > span.dse-crest__glyph…
    div.dse-stamina__cid            > __clabel "Stamina" + __cstate
    div.dse-stamina__cnums          > __ccur __cslash __cmax __ctemp
    div.dse-stamina__gauge          > __gchannel(__gdying __gwound __gpour __gdelta
                                       __gshield) + three/​N __gidx marks
```

All four boxes are DIRECT children of the cluster: one grid has to contain both the crest
(spanning two rows) and the gauge (row 2, spanning two columns). The design rounds needed
a `display: contents` wrapper to express that against a fixed candidate DOM; production
owns its DOM and simply does not build the wrapper.

Two consequences of the base-hide, both deliberate and both verified by the freeze check:

1. **Legacy renders byte-for-byte what it rendered before SC-132** — a `display:none` node
   contributes no box. `stamina-bar--legacy-{dark,light}.png` are unmoved.
2. **So does the print scheme.** Every Steel rule carries the standing
   `:not([data-dse-print="on"])` guard, which is exactly what that guard is FOR — print
   drops the Steel skin. Paper keeps the flat linear bar, which is also the ink-cheap
   answer: a machined channel with three gradient layers is not something to send to a
   printer. `stamina-bar--steel-print.png` is unmoved.

### 2.3 The CSS

One self-contained ~600-line section in `styles-source.css`, after the existing
`.dse-stamina-rec__status[hidden]` Steel guard, in eleven numbered parts: (1) which
instrument is visible, (2) row 1, (3) the living icon, (4) the gauge, (5) the N1 index
marks, (6) the recoveries foot, (7) winded/dying, (8) the hero sheet's adjustments, (9)
the rail, (10) the modal previews, (11) the popover skin. Light twins are inline beside
each dark rule rather than in a trailing block, so a change to a surface and its light
answer stay adjacent.

Everything from round 7 landed unchanged in kind: the two-row grid with the crest
spanning both rows and `minmax(0, 1fr)` on column 2; the 0.7/0.85/0.75rem plate, 0.75rem
crest gap, 0.45rem row gap, 0.45/0.85rem foot; the H2 forged channel; N1 hairlines (2px
two-tone for a real EDGE, 1px solid for a GRADUATION); the appended violet temp plate with
its seam drawn on the channel; R6 skewed outlined cells at G4; the icon-only Catch Breath
on the right margin; Y3 dying with the softened grey divider; no coloured left-border
(DESIGN.md rule 7).

**The living icon** animates via the independent `scale` property, not `transform`.
`.dse-crest__glyph` already owns its transform (SC-130's optical-centring `translateY`), so
a transform keyframe would silently throw that nudge away for the whole cycle and drop the
glyph ~5px mid-breath. `scale` is Chromium 104, under the 106 floor, and composites on top.
Two animations, not one at two speeds (winded is exertion at 2.6s, dying is failing at
4.4s); healthy does not move. Both `prefers-reduced-motion: reduce` and the plugin's own
`reduceMotion` pref pin it — the latter needs no new rule, the D4
`[data-dse-element][data-dse-reduce-motion='true'] *` declaration already reaches the glyph.
Both keyframes' 0%/100% frame is the IDENTITY frame, so "motion off" and "motion at rest"
are the same picture.

**Every state is said at least three ways** — frame colour, crest silhouette (shield →
shield-alert → skull), the word, and the numeral's colour — so hue is never load-bearing
alone (docs/working-preferences.md; Scott is colourblind, disclosed on this ticket).
Scott's round-7 tweak (the current numeral takes the amber winded colour as well as the red
dying one) is one rule off `--dse-st`, so the two ends of the ladder cannot drift apart.

### 2.4 How the rail is selected — the honest mechanism

The rail is the **standalone element's narrow form**, chosen by a container query on the
element root:

```css
[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='stamina-bar'] {
	container-type: inline-size; container-name: dse-stamina-host;
}
@container dse-stamina-host (max-width: 400px) { … }
```

Width alone cannot be the whole rule, and this is the part worth documenting: **the hero
sheet's stamina column is 240px at its narrowest, NARROWER than the ~300px sidebar leaf
that wants the rail.** So a bare width threshold would either make the sheet a rail or
stop the sidebar being one. Scoping the query to the standalone element resolves it
without a lie: the sheet's own grid guarantees its stamina region a two-row-capable
column, and §8's crest step-down + the eyebrow stand-down are what make 240px work there.

Threshold 400px, deliberately at the TOP of the reviewed range: 360px was a rail on the
round-7 board Scott approved, so 360px must be a rail here.

`container-type: inline-size` is Chromium 105, under the 106 floor. The support-floor
deny-list bans `@container style(` (STYLE queries, 111), not size queries —
`test/unit/build/cssSupportFloor.test.ts` pins `container-type` / `@container` / `:has(`
in its `KNOWN_SAFE_BELOW_FLOOR` list, and the run is green.

### 2.5 The hero sheet

`renderStaminaRegion` loses `.dse-hero__stamina-stepper` and mounts the bar with the
host's real `canPersist`. This is the round-6 approved proposal, and the two halves are
inseparable: the stepper was the ONLY way to change Stamina on the sheet *because* the bar
was mounted read-only, so deleting the row has to ship with its replacement.

The bar's click opens `StaminaEditModal` through a throwaway `StaminaBar` bridge (three
numbers in, three out) rather than re-typing the modal against a union of two element
models. **Recoveries are deliberately NOT bridged**, and the reason is a real bug avoided:
the modal derives its recovery value from `StaminaBar.recoveryValue` = `floor(max/3)`,
whereas the SHEET's comes from `deriveHeroStats`, which kits and class features can move. A
bridge carrying recoveries would silently heal the wrong amount whenever the two disagreed.
The sheet's own markers and Catch Breath — right under the bar, using the derived value —
are the recoveries affordance there; the modal handles damage, healing and temp.

`.dse-hero__region:has(.dse-stamina) { min-width: 0 }` closes the round-7 finding: a grid
item's automatic minimum is its max-content size, fine while the strip wrapped and an
overflow the moment it is told not to. The `:has()` narrowing is not cosmetic — zeroing it
on ALL regions made the sheet's columns 305/305 and clipped "Presence" off the
characteristics row.

### 2.6 The modals (SC-133 RC-1 + RC-2)

`staminaPreviewBar` keeps the legacy `.dse-stamina__track` untouched and additionally
mounts `.dse-stamina__cluster--preview` holding the production gauge. The new handle
method is `setGauge(committed, pending)` and it takes **whole {current, temp, max}
triples, not percentages** — the gauge's scale depends on temp, and handing it two
pre-computed widths off two different denominators is the exact bug SC-133 exists to fix.
The gauge draws the PENDING state (what Apply will produce) and ghosts the difference as a
delta band whose direction is carried by POSITION as well as hue: a heal band always sits
past the pour's end, a damage band always eats back into it.

**The modal's math is untouched.** Every `bar.set(...)` call, every clamp, every pending
bookkeeping line is exactly as SC-133 left it; `setGauge` is purely additive. All 27
SC-133 tests pass unmodified.

The minion pool modal inherits it for free: no negative range (`dyingZone: false`) and no
temp, so the gauge degenerates to what that modal always showed, in the cluster's material,
with the death ticks coming through as graduations.

### 2.7 The setting

`staminaRecoveryPopover`, default **false**, group `Element defaults`, `advanced: true`,
behavioral (no attr — views read `cx.prefs.get`). One descriptor in
`src/prefs/catalog.ts`; the post-SC-131 declarative settings tab renders it from there and
needed no other change, which is the point of that model.

---

## 3. Every existing test touched, and why

| file | change | why |
|---|---|---|
| `test/dom/elements/heroSheet.test.ts` | two tests re-driven | They changed Stamina through the deleted `− 31 +` stepper. They now use the affordance that replaced it: click the bar, use the modal (`.dse-sedit__apply-input` → Damage → the footer's accent action). Same user act, one affordance instead of two. |
| ″ | the read-only test's assertions | "the stepper's ± are disabled" became "the bar carries no click affordance (`.dse-stamina--clickable` absent) and the markers are `aria-disabled` with no `tabindex`", plus a real click on every marker that writes nothing. Same contract, against the controls that now exist. |
| `test/dom/framework/heroInSidebar.test.ts` | `staminaMinusBtn` → `spendRecoveryMarker`, 5 tests | These used the stepper as a generic "make a write from a sidebar leaf" driver; none of them cared which affordance wrote. They now click a recovery marker (deterministic: the fixture is `recoveries: 6` of 10) and assert `state.recoveries` instead of `state.stamina.current`. The SUBJECT of each — sidebar leaf → model → debounced persist → authored definition byte-identical — is unchanged. |
| `test/dom/kit/iconButton.test.ts` | regex anchored | The `.dse-btn` hit-area guard did `sheet.match(/\.dse-btn\s*\{…/)` and so matched the FIRST `.dse-btn {` in the file. The new `… .dse-stamina-rec .dse-btn { … }` rule is earlier in the sheet and contains that same substring, so the guard silently started reading a different rule than the one it names. Anchored to line start (`/^\.dse-btn\s*\{…/m`). Any future element-scoped button rule would have hit this too. |
| `test/unit/prefs/catalog.test.ts` | two exhaustive maps | The new pref added to the defaults assertions and to the attr-vocabulary map, where it is correctly `null` (behavioral). |
| `test/mocks/obsidian-core.ts` | `Notice` extended | Gained `noticeEl` and a `last` static so a test can reach the ACTION inside a rich notice — the undo toast is the plugin's first notice carrying a control rather than only text. `noticeEl` is **null in the node-environment `unit` project**, which has no `document` and where node-side services (CompendiumSyncService) legitimately post notices; the first cut broke 10 of those. |

Nothing else in the suite was touched.

### Can-fail proofs (implementation broken, suite watched go red, then restored)

| break | result |
|---|---|
| `markerTarget` → `index + 1` always | 7 red in `staminaRecoveries` (both edge tests, the distance test, persistence, the tooltip, the undo message, the popover-off test) |
| `undoNotice` stops calling `onUndo` | 3 red (restore, spent-once, Catch Breath restore) |
| `opts.popoverEditor` ignored | 2 red (popover opens; outside-click dismiss) |
| gauge denominator `max + temp` → `max`, `capW` → 0 (the literal SC-133 regression) | 6 red across the modal suite and the geometry suite |
| hero bar back to `canPersist: false` | 5 red in `heroSheet` |

---

## 4. Two thresholds moved by SHOOTING them, not by reasoning about them

Both are the kind of thing round 7 could not catch, because round 7 never rendered the
production surfaces.

1. **The `RECOVERIES` eyebrow's stand-down: 290px → 250px of strip.** At 290 it also fired
   on the STANDARD hero sheet (a ~288px strip at the harness's 760px page), which is the
   wrong half of Scott's ruling — he asked for the label *in* the full sheet and only
   wanted it dropped on condensed views. At 250 it stays at 288 (markers still ~11px each,
   comfortably above their 6.7px floor) and still drops at the 240px column, where it
   cannot fit.
2. **The rail: 340px → 400px** (§2.4).

And one real defect the same way: the recoveries strip needed `flex-wrap: nowrap` +
`min-width: 0` in the **full** form too, not only inside the rail's container query. At a
660px sheet it was pushing Catch Breath onto a line of its own instead of letting the
markers compress — the exact failure mode round 7 diagnosed on the rail, one surface over.

---

## 5. FREEZE MAP — the sanction request (5 lines)

**Mapped before implementing, then verified after.** Frozen lines that could plausibly be
reached by this work: `stamina-bar--legacy-{dark,light}`, `stamina-bar--steel-print`,
`hero--legacy-{dark,light}`, `hero--steel-print`, `hero-tokens--*`, and the two `gallery`
legacy lines (the sweep renders every element).

**Result: the redesign itself moves nothing.** The base-hide strategy (§2.2) means Legacy
and print keep the legacy track, so all three `stamina-bar--*` frozen lines and both
`hero-tokens` lines are byte-identical.

Five lines move, and all five have **one** cause: deleting `.dse-hero__stamina-stepper`,
which is a theme-agnostic DOM change and therefore deleted under Legacy too.

| frozen line | before (baseline) | after |
|---|---|---|
| `hero--legacy-dark.png` | `f49d01243c49…` | `1a1a65ea625d…` |
| `hero--legacy-light.png` | `af0578b1b790…` | `b5972ca20f70…` |
| `hero--steel-print.png` | `ee1edbd875cd…` | `de03cc1f2e1d…` |
| `gallery--legacy-dark.png` | `399194cfaded…` | `b9c2e79fa5ca…` |
| `gallery--legacy-light.png` | `c38d93d41c03…` | `057c30610bde…` |

Verified, not asserted, per the plan-25 lesson ("re-run after the rebase, count the
mismatch names rather than trusting the plan's predicted number"):

- checked out `origin/main` in the submodule, ran `npm run shots`, ran the freeze check →
  `freeze OK (119/119 legacy+print PNGs byte-identical)`, exit 0. So the environment
  reproduces the baseline exactly, and the five "before" PNGs captured there **hash-match
  their baseline lines**;
- back on the branch, those five and **only** those five report `FAILED`; the other 114
  are `OK`.

Before/after crops are on the ticket (`DECISION 4`). The visible diff is the stepper row
vanishing and the content below moving up; nothing changes colour, size or position.

**I have NOT touched `freeze-baseline.sha256`.** Approval = replace exactly those five
`<hash>  <name>` lines at landing, count unchanged at 119, with a dated sign-off in
`.claude/skills/dse-verify/SKILL.md` (same procedure as SC-100 and plan 25).

### Screen-theme shot changes (NOT frozen, enumerated)

`npm run shots` 204 → 229. All 25 are **new names**, so they cannot collide with a frozen
line by construction; no existing shot's bytes are touched by them.

| new fixture | why it exists |
|---|---|
| `stamina-bar/recoveries` (31/48 +4, 6 of 10) | the healthy cluster WITH a recoveries strip — the family had no such fixture at all |
| `stamina-bar/winded` (18/48) | the amber ladder end to end |
| `stamina-bar/dying` (−6/48) | the red ground, the skull, the wound past zero |
| `stamina-rail` (NARROW_SHOTS, 300px) | the rail is a CONTAINER-QUERY branch; the default sweep's width cannot reach it, so it would ship unshot |
| `hero-narrow` (NARROW_SHOTS, 660px) | likewise for the crest step-down and the eyebrow stand-down |

The stamina family previously had exactly ONE fixture — a healthy bar with temp and no
recoveries — so for a redesign whose subject is the state ladder, that was a real coverage
gap and not thoroughness for its own sake. Whether to PIN these in the baseline is a
separate, deliberate widening; I have not done it.

---

## 6. Cleanup — verified, not assumed

```
$ grep -rn "stamina-cand\|staminaCandidate\|StaminaCandidate" src/ visual-harness/*.ts styles-source.css test/
(no hits)
$ ls visual-harness/          # no candidates.mjs, no strips.mjs, no assemblies.mjs
$ grep -n "?asm=\|?strip=\|?cand=\|board=" visual-harness/entry.ts
(no hits)
```

Commit 1 restores `styles-source.css`, `entry.ts`, `index.html`, `kit/index.ts` and
`StaminaBarPanel.ts` to their `origin/main` bytes exactly (`git checkout origin/main --
…`), so `git diff origin/main...HEAD` from that point is the production change and nothing
else. The `visual-harness/shots-candidates` gitignore entry is gone; the directory is
deleted.

---

## 7. Commits

| sha | title |
|---|---|
| `fe2222f` | chore(steel): delete the SC-132 candidate design layer |
| `3b23767` | feat(kit): the stamina gauge, the recoveries strip and the undo toast |
| `751a84c` | feat(steel): the stamina cluster — Scott's two-row layout, forged gauge, R6 recoveries |
| `4001a65` | feat(hero,stamina-bar): Model M editing, and the sheet's duplicate stepper row is gone |
| `7d0a911` | feat(modals): the stamina previews carry the production gauge, temp included |
| `0e63650` | feat(settings): optional stepper-popover editor for Recoveries |
| `834629c` | test(stamina): Model M, the undo toast, the popover setting, the gauge geometry |
| `37900a2` | feat(harness,docs): stamina state + rail fixtures, and the docs/changelog for the redesign |

---

## 8. Docs

- `draw-steel-elements/docs/stamina-bar.md` — Model M's interaction rule, the keyboard
  control, the Undo, the popover setting, and a new "The Steel theme's gauge" section
  (zero as a marked bulkhead, temp as a plate on the same scale, the rail).
- `draw-steel-elements/CHANGELOG.md` — four user-facing entries under `7.0.0`: the
  redesign, Recoveries editing + Undo, hero-sheet editing, and the modal-preview fix
  (tagged `[FIX]`, credited to SC-133).
- workspace `CHANGELOG.md` — one bullet under `### Added (pending plugin 7.0.0 release)`.
- `.repo-docs/` needed no change: nothing there describes the stamina DOM.

---

## 9. Open questions on the ticket (Scott rules at the gate)

1. **Ship it.**
2. **The rail's state word** — kept (shipped) or dropped. Shot both ways. Dropping buys
   the gauge ~90px at a 300px leaf; keeping it preserves the rail's only non-hue channel
   besides the frame colour (there is no crest on the rail). My lean: keep.
3. **Dying on the rail** — border only (shipped) or border + the red gradient ground. His
   question ("is that just because they are samples or is that the plan?") is answered:
   it is the plan, and it is his own round-3 ruling, "Y1 for the rail, Y3 for the sheet".
   Shot both ways.
4. **The five-line freeze rebaseline** (§5).

## 10. Deliberately NOT done

- **No baseline widening** for the 5 new fixtures (25 new shots). Additions-only widening
  is its own deliberate act with its own procedure; bundling it into a round that already
  carries a rebaseline ask would blur two different kinds of change.
- **The duplicated Winded/Dying wound badge** (`.dse-stamina-rec__status` vs
  `.dse-hero__wound-badge`) — deferred since round 6, still deferred, still unrelated. The
  Steel layer hides the strip's copy, so the duplication is invisible under Steel and
  remains only under Legacy.
- **A print treatment for the cluster.** Print keeps the legacy bar (§2.2). Giving paper
  the forged gauge would need its own ink-economical authoring pass and would move the
  three `stamina-bar`/`hero` print lines for a second reason; it is a follow-up, not a
  silent rider on this one.
- **`obsidian-shots`** — Scott's live Obsidian owns the display.


---

## 11. Review fix round (2026-08-10)

Whole-branch review returned one HIGH and five MEDIUM plus an L-list. Two commits:
`d99a282` (H1) and `7d0e8cb` (the rest). Every finding, and what happened to it:

### H1 (blocker) — the sheet's modal gave free, mis-rated healing. FIXED, preferred shape.

The reviewer is right and my report was wrong: I wrote that Spend Recovery "stays closed
on the sheet", and it does not. The button is rendered **unconditionally**
(`StaminaEditModal.ts`); `recoveriesTracked` gates only the decrement and the ran-out
disable. So the bridge that carried only {max, current, temp} produced a control that
healed `floor(max/3)` and spent nothing — reproduced live by the reviewer at 31/48 → three
presses → 48/48 with all six Recoveries intact. Pre-SC-132 the sheet could not reach this
modal (`canPersist: false`), so the branch introduced it. **My error was reasoning about
the modal's behaviour from one flag's name instead of reading what the flag gates.**

Fixed the preferred way — bridge Recoveries in full, not suppress the control:

- `StaminaEditModalOptions` (new, optional, so all 27 SC-133 tests and every existing
  caller are untouched): `recoveryValue` overrides RR §8's `floor(max/3)`, and
  `spendRecovery` (default true) can suppress the control for a caller that knows there is
  no pool;
- `recoverySpendResult` resolves `this.opts.recoveryValue ?? this.staminaBar.recoveryValue`;
- the hero bridge passes `recoveries`/`recoveries_max`, supplies `deriveHeroStats`'
  `recoveryValue`, writes `bridge.recoveries` back on Apply, and passes
  `spendRecovery: false` only in the genuinely poolless case (an unresolved class).

Three tests; can-fail proven (unbridge the fields → red). The heal-rate test is pinned as
an **equality between the two paths** (the modal's result must equal what the sheet's own
Catch Breath produces) rather than a hardcoded number, so it keeps holding whatever kits
do to the derived value.

### M1 — no focus ring on the new keyboard control. FIXED, plus the class of mistake.

`.dse-stamina-rec__pips[tabindex]:focus-visible` joins the shared kit ring. And rather than
only fixing the instance, `kit-index.test.ts` gained a guard: any kit module that sets
`tabindex` must name at least one class the ring covers. **It failed on its first run** —
on `undoNotice.ts`, whose Undo action is also focusable and also had no ring. That is now
covered too. The guard is a heuristic (a module could name a covered class and still leave
a second control ringless) and says so; it catches "new focusable widget, no ring at all",
which is the failure that actually happens.

### M2 — the popover overflowed the card. FIXED, and measured.

`position: relative` in flow on a `flex-wrap: nowrap` strip: it took width from the markers
at every size and rendered ~117px outside the card at 300px. Now an absolute overlay
anchored bottom-right of the strip, with `max-width: 100%` + `flex-wrap: wrap` — a
right-anchored popover escapes to the LEFT, which is exactly the side you do not see
coming, and that is what the first pass of this fix did at 260px (measured −29px). The
strip carries an unscoped `position: relative` so the anchor exists under Legacy too;
`container-type` brings layout/style/size containment and NOT paint containment, so
nothing clips the overlay.

Verified by a measuring probe (`impl/pop-*.png` for the pictures) at 260/300/360/760, both
schemes: **8/8 PASS** — zero overflow left or right, and the pip row's width is identical
with the popover open and closed:

```
PASS dark 260px  overflow right=-13 left=-13  pip-row 200 -> 200
PASS dark 300px  overflow right=-13 left=-13  pip-row 164 -> 164
PASS dark 360px  overflow right=-13 left=-33  pip-row 224 -> 224
PASS dark 760px  overflow right=-1  left=-445 pip-row 616 -> 616
…light identical…
```

### M3 — NaN reintroduced into `--dse-*` vars. FIXED, and more broadly than asked.

`!(denom > 0)` was the requested change, but it is not sufficient on its own: a NaN
NUMERATOR sails past any denominator check (`current: NaN` still produced `pourW: NaN`,
which the new test caught immediately). Every input is now sanitised on the way in with
`Number.isFinite`. Test covers NaN in each field and all three at once.

### M4 — two rulers. DOCUMENTED + PINNED (the reviewer accepted either answer).

Kept the fixed-width reserve and made the exception explicit in the module header, with
the reason: one shared denominator would **move the zero bulkhead** whenever temp changed,
and the bulkhead is this model's origin. Two tests pin the choice — the bulkhead does not
move when temp appears, and the two sides really do carry different scales at temp > 0 —
so it cannot be "tidied up" by someone who has not read the reasoning.

### M5 — the setting gated the mouse only. FIXED.

Value keys now open the popover instead of committing; its − / + are real buttons in the
tab order, so the keyboard is gated rather than disabled. `openPopover` became idempotent
(the keyboard calls it per keypress — a version that toggled would close itself on the
second ArrowLeft) and the mouse path got its own `togglePopover`. Two tests: on → four
value keys change nothing and leave the popover open; off → the keyboard commits directly,
unchanged.

### L-list

| item | outcome |
|---|---|
| L1 undo-toast stacking | FIXED — one live undo; a new change dismisses the previous toast (each closes over the value BEFORE its own change, so a stack is a stack of stale snapshots). Tested, can-fail proven. |
| L2 `container-type` constraint | FIXED — stated on the element-root rule (no block-size dependence; it becomes a containing block for `position: fixed`; it does not clip). |
| L4 dead `.dse-hero__stamina-stepper` rule | FIXED — deleted, with a one-line note where it was. |
| L5 stale 340px comment | FIXED — entry.ts now says 400px. |
| L6 max=0 wearing the dying dress | FIXED — `staminaState` returns 'healthy' when `max` is not > 0. **This updates one existing assertion** in `staminaBarPanel.test.ts` (it pinned `'dying'`); the reasoning is recorded at the assertion. Invisible before SC-132 (the Legacy fill's `data-state` only tints a 0-width bar) and loud the moment the Steel cluster started reading it. |
| L8 bare `*:has()` | FIXED — four (not three) selectors qualified to `.dse-hero__region:has(…)`. |
| L9 ticks JSDoc vs CSS | FIXED (the doc) — the CSS places ticks as fractions of the CHANNEL; the JSDoc said "of the positive region". Today's only caller passes `dyingZone: false`, where they coincide, which is why it never bit. |
| L10 "nudge survives untouched" | FIXED — softened to what `scale` actually guarantees: composed with the transform, not discarded. The offset does scale with the breath (~0.05em at the trough), which is the coherent thing for a shrinking glyph. |
| L3, L7 | NOT taken this round, per the reviewer's "note only". |

### Can-fail proofs, review round

| break | result |
|---|---|
| unbridge `recoveries`/`recoveries_max` from the hero | H1 spend-decrements test red |
| `!(denom > 0)` → `denom <= 0` and drop the sanitiser | the NaN geometry test red |
| the popover's keyboard branch disabled | the M5 gating test red |
| `liveUndo?.hide()` removed | the single-live-undo test red |
| the ring arm removed | both focus-ring tests red (the hand-list one and the new auto-detect guard) |
| (M2) the popover back in flow | the measuring probe FAILs — that is how the 260px left-overflow was found in the first place |

### What did NOT move

The freeze result is identical: the same five names, and their after hashes re-verified
byte-for-byte against the ones already in Scott's gate comment
(`1a1a65ea625d` / `b5972ca20f70` / `de03cc1f2e1d` / `b9c2e79fa5ca` / `057c30610bde`). The
base-sheet `position: relative` and the max=0 state change move no rendered pixel in any
frozen shot, which is the result the check was run to establish rather than to assume.
Parity is unchanged at 0/0/16, shots at 229.


---

## 12. Scott's final gate round (2026-08-10, comment `b3b6806d`) — dse `97c71d2`

He answered all four asks: **ship it** (one visual nit), **drop** the rail's state word,
**red gradient ground** for the rail's dying state, and the 5-line rebaseline **approved**.

### The nit: "the top-border of the crest in light-theme doesnt appear to be the right color?"

He is right, and it is not a colour. **Measured** down the crest's centre column (dsf 1),
before the fix — and identically on the established ability-card crest, so this was never
SC-132's doing:

| | y0 | y1 | y2+ (face) | card behind |
|---|---|---|---|---|
| dark | `rgb(228,231,233)` | `rgb(224,228,230)` | `rgb(35,40,45)` | `rgb(22,22,22)` |
| light | `rgb(235,236,237)` | `rgb(151,158,163)` | `rgb(238,241,241)` | `rgb(241,241,241)` |

Dark gets a 2px bright metal rim over a near-black face. Light gets **one** grey row, and
above it a near-white line that is within 6/255 of the card behind it — so three edges of
the shield are grey metal and the top is a smear that dissolves into the page.

**Root cause:** the rim is the 1.5px of `--dse-metal-grad` left visible around the
`::before` face (`inset: 1.5px`), and `--dse-bevel` under light is
`inset 0 1px 0 rgba(255,255,255,0.8)`. That white line eats the top 1px of the 1.5px rim
and repaints it the colour of the page. Under dark the same declaration is
`rgba(255,255,255,0.07)` — nothing — which is exactly why only one scheme shows it. A
bevel is a lit LIP on a large flat plane; a crest is a small clipped pentagon whose own
metal gradient already carries the light.

**Fix:** `.dse-crest { box-shadow: none }` in the Steel screen layer. After:

| | y0 | y1 |
|---|---|---|
| light | `rgb(153,160,165)` | `rgb(151,158,163)` | → a full 2px mid-grey rim, all four edges matching |
| dark | `rgb(226,230,232)` | `rgb(224,228,230)` | → unchanged to within 2/255 |

Fixed on the shared `.dse-crest`, not on the stamina crest alone: the defect is in the
primitive, and two crests with different edges would be worse than the bug. That means
ability/feature/statblock crests get the same correction — unfrozen `*--steel-{dark,light}`
shots only, since `.dse-crest` is `display: none` under Legacy and print.

### The rail: state word dropped, dying gets the ground

The whole `__cid` lane is hidden rather than just the word — an emptied box still takes
the flex row's gap and would leave a hole exactly where the word was. The reclaimed ~90px
goes to the gauge (visible in `impl/final-rail.png`: at 300px the bar now runs to the
plate's right edge in the winded row).

Dying now takes the red border **and** the red gradient ground on the enclosing region
(the rail's plate is the whole row), light twin included. This overrides his own round-3
"Y1 for the rail, Y3 for the sheet", and with the word gone it is also the arithmetic
answer: the rail's channels were down to the border and the numeral's colour — two, both
hue — and the ground restores a third that survives a grayscale glance.

### Two review nits folded in

- **L10, for real this time.** The earlier pass edited a different sentence and left the
  offending one standing at `styles-source.css:6642`. `scale` composes with SC-130's
  translateY rather than discarding it, but it also *multiplies* it: at the 0.84 trough
  the ~4.8px nudge becomes ~4.0px, so the glyph sits ~0.8px lower at the bottom of a
  breath. Stated, with the reason it is still the right property (a fifth of the ~5px
  error a `transform` keyframe would cause, fully recovered at the identity frame).
- **`applyStaminaChange` deleted** from `hero/view.ts` — dead since the stepper row went —
  along with its now-unused `HeroStamina` type import.

### Battery (`impl3-*`)

```
npx tsc --noEmit   exit 0
npx jest           exit 0   156 suites, 2414 tests, 3 snapshots   (unchanged)
npm run shots      exit 0   229 ok, 0 FAIL                        (unchanged)
check-freeze.sh    exit 1   the SAME five sanctioned lines
npm run parity     exit 0   0 gaps / 0 undeclared / 16 declared   (unchanged)
```

The five sanctioned lines' after-hashes were re-verified byte-for-byte against the ones in
Scott's gate comment (`1a1a65ea625d` / `b5972ca20f70` / `de03cc1f2e1d` / `b9c2e79fa5ca` /
`057c30610bde`) — **SAME**, all five. All three changes are Steel-screen-only and the
crest is hidden in the two schemes that are frozen, so none of them can reach a frozen
shot; the check was run to establish that rather than to assume it.

### For the lander

The sanctioned rebaseline is those five lines only, count unchanged at 119. The 25 new
shots from this branch's five new fixture names are a separate, additions-only widening —
not done here, deliberately (§5).
