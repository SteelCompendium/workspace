# SC-146 — round 2: Scott's three items, diagnosed then fixed

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc146-round2`
**Branch:** `sc146-round2`, cut from dse `cbf17fa` (includes the landed SC-123 ports,
SC-144's legacy-theme removal — freeze is now 66 steel-print-only lines — and SC-149's
`ds-scc`).
**Commit:** `a9e3ac5` `fix(statblock,steel): SC-146 round 2 — the flat separator's rule,
and the head diamond's clearance`
Superproject pointer bump deliberately **unstaged**.

Colour note: nothing below or in any screenshot is distinguished by hue. Every difference
is presence/absence, position or distance.

**Method:** each item diagnosed against the live site BEFORE any edit — computed geometry
from `steelcompendium.io/v2/Browse/monster/lich/lich/` driven with playwright-core + Brave
(`round2/site-probe.cjs`, raw output `round2/site-probe.json`), against the same computed
geometry from our own harness (`round2/` probe scripts). "Before" renders come from a
scratch git worktree at `cbf17fa` with its own harness bundle, so every before/after pair
is a real capture of the old code, not a reconstruction.

---

## Item 1 — "Ledger for secondary stats is still wrong I think." → **NOT a code defect**

**Verdict: the landed CSS already renders exactly what Scott describes, and it matches the
site property for property. The overwhelmingly likely cause is a stale vault build.**

Scott's description — *"a 4-cell table with weakness and immunity in the top row, movement
(and something else?) in the bottom row"* — is a correct description of the site's ledger
AND of ours. Measured, both at the same setting (site `data-sb-meta="ledger"`, plugin
`sbStats: ledger`):

| | site (`.sb__meta` / `.sb__field`) | plugin (`.dse-sb__grid` / `.dse-sb__kv`) |
|---|---|---|
| container display | `grid` | `grid` |
| columns | `393px 393px` (1fr 1fr) | `342.2px 342.2px` (1fr 1fr) |
| gap | `0px 32px` (0 1.6rem) | `0px 25.6px` (0 1.6rem) |
| cells | 3 — Immunity, Weakness, Movement | 3 — Immunity, Weakness, Movement |
| cell display | `flex`, row, `space-between` | `flex`, row, `space-between` |
| cell border | `border-bottom: 1px solid rgba(95,103,108,.14)` | `border-bottom: 1px solid rgba(95,103,108,.14)` |
| cell fill | none | none |
| cell radius | `0px` | `0px` |
| cell padding | `8px 2px` (.4rem .1rem) | `6.4px 1.6px` (.4rem .1rem) |

Every rem-valued number differs by exactly ×0.8, which is Obsidian's 16px root against the
site's 20px root — i.e. the two are the same declarations. The colour and the border are
byte-identical because both resolve the same metal-faint hairline.

**The "something else" is `With Captain`.** It is the fourth cell, and it is the one thing
the site can never show: the site's statblock generator drops `with_captain` before render
(checked across every captained page in `v2/docs/Browse` — e.g. `goblin-cursespitter`,
`dwarf-shieldwall` both carry `**-**<br>With Captain` in their markdown source template and
render only three `.sb__field` cells). The plugin renders it whenever the field is present
(`statblock/view.ts:262`). Measured on a captained creature, our four cells land as Scott
describes: Immunity and Weakness on row 1 (both at y=270), Movement and With Captain on row
2 (both at y=311).

**No CSS changed for this item.** What it did surface is a real coverage gap: no fixture
anywhere rendered a fourth secondary cell, so the full 2×2 had never been photographed by
any camera. Added `statblock/with-captain` (`visual-harness/entry.ts`, the same
`prefs:`-prefix convention SC-146 fix round 1 used for its four variants).

**If Scott still sees a single stacked column**, it is the vault's build, not the branch:
`main.js` / `styles.css` at the plugin root are untracked artifacts and the harness compiles
its own bundle, so every gate can be green while the loaded plugin lags. The rebuild is
`npm run build-no-check`, then reload Obsidian.

Evidence: `round2/shots/r2-item1-ledger.png` (site ↔ plugin ↔ plugin-with-captain).

---

## Item 2 — "Fix 6 still isnt right … there should be a diamond separator with the fading lines." → **FIXED**

**Verdict: correct, and the diagnosis is exactly his words.** Round 1 shipped the haloed
diamond and nothing else. The site's flat-mode separator is its full stylized `<hr>`.

Site, measured (`[data-sb-featstyle="flat"] .sb__feat + .sb__feat`):

- `::before` — absolute, `top: 2px`, inset 5% each side, `height: 4px`, **four** background
  layers: `linear-gradient(to right, transparent, --fx-metal-line)` and its mirror, sized
  `calc(50% - 30px) 1px` at the left/right ends, plus two `radial-gradient(circle,
  --fx-metal 1.4px, transparent 1.9px)` seed dots sized `4px 4px` at `calc(50% ± 24px)`.
- `::after` — the 8px diamond, `rotate(45deg)`, halo `0 0 0 4px <plate solid>, 0 0 0 5px
  --fx-metal-faint`.

We already had the `::after` verbatim. The four `::before` layers were missing entirely.

**Why the layers ride the element's own `background-image` instead of a `::before`:** both
pseudos on `.dse-feature` are taken. `::before` is the **action-type spine bar** (a 3px
full-height absolutely-positioned bar, `styles-source.css:60`) and flat mode KEEPS it —
SC-101/102 made the spine a nested-card frame rather than a card-mode ornament, which is
precisely where we diverge from the site (whose spine is `[data-sb-featstyle="card"]`-only,
leaving its `::before` free). `::after` is the diamond. Refactoring a structural SC-101/102
mechanism to free a pseudo for an ornament is the wrong trade; background layers place to
the same precision a pseudo does, and flat mode already blanks the background.

Geometry re-expressed against the feature's own box, since the site's strip is inset 5%:
its `calc(50% - 30px)` line is `calc(45% - 30px)` of the feature; its dots at `calc(50% ±
24px)` are unchanged (both boxes share a centre). Everything centres on y = 4px, the
diamond's own centre — 1px lines at `top 3.5px`, 4px dots at `top 2px`.

One CSS subtlety worth recording: the lines use the **4-value** `left 5% top 3.5px` form and
the dots the **2-value** `calc(50% - 24px) 2px` form, deliberately. In the 2-value form a
percentage is a fraction of *(box − image)*, not an offset from the edge — which is exactly
what puts the dots' CENTRES at 50% ± 24px, but would make the lines' 5% inset drift with
card width.

**Spacing, also corrected (round 1's M1 was half-right).** The divider's centre sits 4px
inside the feature's border box, so:

- air above the centre = `margin-top` + the previous feature's `padding-bottom` (4px) + 4px
- air below the centre = `padding-top` − 4px

Round 1 set `margin-top: 4px` / `padding-top: 1.25rem` → **8px above, 16px below**; the
diamond rode high in its own seam. `margin-top: 8px` balances it at **16/16**, which is what
the site's own comment asks for (*"keep them EQUAL or the diamond drifts off-center"*).

Measured after, statblock and featureblock twins **identical**: 4 background layers, sizes
`calc(45% - 30px) 1px ×2, 4px 4px ×2`, positions `5% 3.5px, 95% 3.5px, calc(50% - 24px) 2px,
calc(50% + 24px) 2px`, diamond `top: 4px`, air 16/16. Dark scheme resolves the line to
`rgba(176,183,187,.5)` and light to `rgba(95,103,108,.45)` — the site's own two values.

`styles-source.css` — statblock arm and the featureblock twin. Screen-only, as before, so
print is untouched by this item.

Evidence: `round2/shots/r2-item2-separator.png` (site ↔ before ↔ after),
`round2/shots/r2-item2-fb-separator.png` (the featureblock twin, before ↔ after).

---

## Item 3 — "The bottom of that diamond is touching the 'Stamina' chip" → **FIXED**

**Verdict: reproduced, measured, and worse on paper than on screen.**

The notch is a 9px square centred ON the head's bottom edge with 4px + 5px halo rings.
Rotated 45°, that 19px square reaches **13.44px below the edge** (19 × √2 ÷ 2). Clearance
measured before:

| context | clearance | halo reach | air |
|---|---|---|---|
| screen, 900px | 12px | 13.44px | **−1.44px (overlap)** |
| screen, 640px / 1100px | 12px | 13.44px | **−1.44px** |
| screen, density = compact | 12px | 13.44px | **−1.44px** |
| **print / export** | 8px | 13.44px | **−5.44px** |
| site, for reference | 17px | 13.44px | +3.56px |

Root cause, two parts. (a) The head's `margin-bottom: 0.75rem` (12px) and
`.dse-sb__meta`'s `margin-top` (8px) are adjacent siblings and **collapse** — the gap is
`max(12, 8)`, not their sum — and nothing else contributed, because our stat row never
carried the site's `.sb__defenses { padding: .3rem … }` top inset. (b) In print the head's
margin comes from a `:not([data-dse-print="on"])` band rule, so it collapsed to zero and the
gap fell to the meta row's 8px.

**Fixed with the site's own two levers, not by nudging the diamond:**

1. `.dse-sb__items { padding-top: 0.3rem }` — a verbatim port of the site's
   `.sb__defenses` top inset. Padding, not margin, is load-bearing here: only padding
   survives margin collapsing.
2. `margin-bottom: 0.75rem` restated on the **print-reaching** structure twin
   `[data-dse-theme='steel'] .dse-sb[data-dse-role] > .dse-head`, which already owns
   `position: relative` and the notch itself. The room an ornament needs is part of its
   placement — the same "print follows structure" (S-1(a)) reasoning that rule already
   documents. The screen-only band rule keeps the other three sides.

Measured after — **every notch-drawing context, both media:** clearance 16.8px, air
**+3.36px**, against the site's 17px / +3.56px. Verified at 420 / 640 / 900 / 1100px wide,
at `density: compact`, in both colour schemes, and in print. (The roleless fixture reads
12.8px, but `notchDrawn: false` — it has no role, so it draws no diamond and has nothing to
clear.)

Why the site's *rem* values could not simply be ported: the ornament is sized in absolute px
on both surfaces (9px + 5px rings) while the spacing is in rem, and our root is 0.8× the
site's — porting `.55rem + .3rem` would have delivered 13.6px against a 13.44px halo, i.e.
0.16px of air, still reading as a touch. The clearance is therefore matched on the site's
**pixel** figure, which is the same call SC-128 made when porting the ornate rule's geometry.

Evidence: `round2/shots/r2-item3-notch.png` (site ↔ before ↔ after),
`round2/shots/r2-item3-notch-print.png` (print before ↔ after).

---

## Guards added

`test/dom/framework/pref-reflection.test.ts`, a new `SC-146 round 2 — regression guards`
block plus two amended fix-round-1 guards:

- **item 1** — both ledger `.dse-sb__grid` arms (base + the Steel arm that out-specifies the
  plain Steel gap rule) keep `gap: 0 1.6rem` and carry neither `display: block` nor a
  `grid-template-columns` override. A regression to one column is exactly what would make
  Scott's report true.
- **item 3** — `.dse-sb__items` carries the `0.3rem` top inset, the head twin carries both
  `position: relative` and `margin-bottom: 0.75rem`, and the twin is **not** print-excluded
  (asserted negatively — that exclusion is the bug).
- **item 2** — the existing statblock and featureblock separator guards now also require the
  two line gradients, exactly two dot gradients, the `calc(45% - 30px)` line size, the two
  dot positions, and `margin-top: 8px` on both twins.

(The two item-1/item-3 lookups strip CSS comments before matching: those rules quote the
site's own declarations, braces included, which would otherwise terminate a `[^}]*` body
match early.)

---

## Battery (verbatim, at `a9e3ac5`)

```
tsc=0
lint=0
jest=0
Test Suites: 1 skipped, 164 passed, 164 of 165 total
Tests:       1 skipped, 2689 passed, 2690 total
Snapshots:   3 passed, 3 total
```

```
shots=0
203        (ok lines)
0          (FAIL lines)
```

```
parity=0
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
```

Against the `cbf17fa` baselines: jest **2686 → 2689** (+3: the two round-2 guards and the
`with-captain` fixture's own mount case), shots **200 → 203** (+3: the new fixture × the
three surviving combos), parity **unchanged, 0/0/16** — no statblock rule this round moves a
sampled property, and `visual-harness/parity/` is untouched. `obsidian-shots` NOT run
(display `:1` is Scott's live vault).

### FREEZE — 17 steel-print lines legitimately move. Baseline NOT touched.

```
freeze=1
FREEZE VIOLATED:
statblock--steel-print.png                      statblock-charline-two--steel-print.png
statblock-roleless-corpus--steel-print.png      statblock-disttarget-ledger--steel-print.png
statblock-villain-corpus--steel-print.png       statblock-disttarget-text--steel-print.png
statblock-stats-ledger--steel-print.png         statblock-kwusage-grid--steel-print.png
statblock-stats-gridc--steel-print.png          statblock-kwusage-ledger--steel-print.png
statblock-featstyle-flat--steel-print.png       statblock-kwusage-text--steel-print.png
statblock-columns-wide--steel-print.png         statblock-villain-banded--steel-print.png
statblock-charbox-on--steel-print.png           statblock-edit-btn--steel-print.png
statblock-charbox-onword--steel-print.png
```

This is item 3 reaching print **by design** — the notch's placement is structure, and print
had the worse overlap (−5.44px). It is the whole statblock family and nothing else; no other
element's print shot moved, and no legacy shot exists to move (SC-144 removed that camera).

**Proof the delta is only this change:**

- Every one of the 17 "before" shots was regenerated from a scratch worktree at `cbf17fa`
  and **hash-matches the baseline line it would replace** — 17/17, zero mismatches. So the
  baseline is not stale and nothing else on this branch touched them.
- The change is a pure vertical shift: image widths are identical and heights grow by
  **+18px @2× = +9 CSS px** on every role-bearing fixture (12px head margin now applying in
  print where an 8px collapsed margin stood, +4.8px row inset), and **+10px @2× = +5 CSS px**
  on `statblock-roleless-corpus`, which draws no notch and so takes only the row inset.
  `statblock-featstyle-flat--steel-print` moves by the same +9px as the plain statblock,
  confirming item 2 contributed nothing to print (it is screen-only).

**Ready-to-apply hashes** for the sanctioned rebaseline at landing (count unchanged at 66):
`.superpowers/sdd/sc146/round2/rebaseline-17.txt`. Do not apply them without Scott's
sign-off on `r2-item3-notch-print.png`.

---

## Files touched

| file | items |
|---|---|
| `styles-source.css` | 2 (both flat twins), 3 (`.dse-sb__items`, the head structure twin) |
| `visual-harness/entry.ts` | 1 (the `with-captain` fixture) |
| `test/dom/framework/pref-reflection.test.ts` | guards for 1, 2, 3 |
| `CHANGELOG.md` | two bullets under the existing SC-146 entry |

## Open questions

1. **The 17-line print rebaseline needs Scott's sanction** before landing. The picture to
   approve is `r2-item3-notch-print.png`.
2. **Item 1 needs a confirmation, not a fix.** Worth asking Scott to rebuild
   (`npm run build-no-check`) and reload before we spend another round on it — if the ledger
   still stacks in a freshly built vault, that is new information and points somewhere the
   harness cannot see (an Obsidian-only cascade), not at these declarations.
3. **`With Captain` is plugin-only.** We render a cell the site drops. That is arguably
   better (the book has the field) but it is a real divergence from the site's statblock, and
   it is the only case where our secondary block has four cells rather than three. Flagging
   rather than deciding.
