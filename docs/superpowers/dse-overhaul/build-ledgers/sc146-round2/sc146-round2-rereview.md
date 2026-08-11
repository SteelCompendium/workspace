# SC-146 round 2 — independent re-review (scoped to the round-2 delta)

**Reviewer:** independent agent. No code changed, no Linear touched.
**Subject:** branch `sc146-round2` @ `a9e3ac5` (single commit) on dse `cbf17fa`.
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc146-round2/draw-steel-elements` — clean.
**Date:** 2026-08-11. Freeze regime: post-SC-144, 66 `*--steel-print.png` lines.

## Recommendation

**LAND pending Scott's sanction of the 17-line print rebaseline.** All three items verified
by measurement rather than by reading; the battery reproduces exactly; the rebaseline is
correct, minimal, and — a probe the report did not run — survives a rebase onto current
`origin/main` unchanged. Findings are two precision nits and two landing notes. Nothing
needs another fix round.

---

## Battery at `a9e3ac5` (reproduced)

| Gate | Claimed | Measured | |
|---|---|---|---|
| `npm run tsc` | 0 | clean, exit 0 | ✅ |
| `npm run lint` | 0 | clean, exit 0 | ✅ |
| `npx jest` | 2689 / 1 skipped / 164 suites | **2689 passed, 1 skipped, 2690 total, 164 of 165 suites, 3 snapshots** | ✅ |
| `npm run shots` | 203 ok / 0 FAIL | **203 ok, 0 FAIL, exit 0** (regenerated from an emptied dir by me) | ✅ |
| `npm run parity` | 0 / 0 / 16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | ✅ |
| `check-freeze.sh` | exactly 17 FAILED | **17 FAILED + 49 OK + 0 missing = 66**, exit 1 | ✅ |

The 17 `FAILED` names are **set-identical** to `round2/rebaseline-17.txt` (`diff` of the two
sorted name lists is empty). Nothing else in the frozen set moved.

---

## Item 1 — the ledger "no code defect" verdict: **CONFIRMED**

Measured in the built harness (computed styles + client rects), not read off the sheet.

| | site (`steel-statblock.css`) | plugin, measured | |
|---|---|---|---|
| container | `grid`, `1fr 1fr` | `grid`, `342.203px 342.203px` | ✅ |
| gap | `0 1.6rem` → 32px @20px root | **`0px 25.6px`** = 0 1.6rem @16px root (×0.8) | ✅ |
| cell | `flex`, baseline, `space-between` | same | ✅ |
| cell border | `border-bottom: 1px solid --fx-metal-faint` | `1px solid rgba(176,183,187,.16)`, no other edge | ✅ |
| cell fill / radius | none / 0 | `rgba(0,0,0,0)` / `0px` | ✅ |
| cell padding | `.4rem .1rem` → 8px 2px | **`6.4px 1.6px`** (×0.8) | ✅ |

Every rem-valued property is exactly ×0.8 of the site's, i.e. the same declarations under
Obsidian's 16px root. **The report's table is accurate.**

**The 2×2 is real.** The new `statblock/with-captain` fixture measures four cells at
Immunity (x=49, y=270.34), Weakness (x=416.8, y=270.34), Movement (x=49, y=311.31),
With Captain (x=416.8, y=311.31) — two rows, two columns, equal widths (342.2px each,
`416.8 = 49 + 342.203 + 25.6`), fill order matching the site's Immunity → Weakness →
Movement. Exactly Scott's description.

**The site really does drop `with_captain`.** Checked in the built Browse pages, not
inferred: `v2/docs/Browse/monster/retainer/gnoll-gnasher.md` (and siblings) render
`<div class="sb__meta">` with exactly **three** `.sb__field` cells — Immunity, Weakness,
Movement — while the page's own fallback markdown table carries `**-**<br>With Captain`.
The generator drops it before render. ✅

**Two extra probes the report did not run, both of which strengthen the verdict:**

- **No width-based collapse exists in the plugin.** The site collapses `.sb__meta` to one
  column under `@media (max-width: 34em)` (`steel-statblock.css:609-615`). The plugin has
  **no** media/container query on `.dse-sb__grid` at all — it is `repeat(2, minmax(0, 1fr))`
  at every width. So a narrow Obsidian pane cannot produce the stacked column Scott
  described; if anything the plugin keeps two columns where the site would drop to one.
  This removes the most plausible non-stale-build explanation.
- **No shrink-to-fit asymmetry.** The base rule `.dse-sb__kv:nth-child(even) { justify-self:
  end }` is not reset by either ledger arm, which would have made the right-hand cells
  shrink to content and shorten their hairlines. Measured `justify-self` resolves to
  `stretch` on the even cells and the widths are equal, so the concern does not
  materialise.

**Guard has teeth (falsified).** Re-inserting `display: block` into the base ledger arm →
the item-1 guard fails; into the Steel arm → it fails again. Both mutations reverted.

**Residual risk:** the "stale vault build" hypothesis remains a hypothesis. Everything
reachable from the harness matches the site. Open question 2 in the report (ask Scott to
`npm run build-no-check` and reload before spending another round) is the right next step.

---

## Item 2 — the flat separator is now the site's full rule: **CONFIRMED**

Measured on the real fixtures (`prefs=sbFeatureStyle:flat` / `fbFeatureStyle:flat`):

| property | statblock | featureblock twin | |
|---|---|---|---|
| `margin-top` | `8px` | `8px` | ✅ |
| `padding-top` | `20px` (1.25rem) | `20px` | ✅ |
| layers | 4: 2 × `linear-gradient` + 2 × `radial-gradient(circle, --dse-metal 1.4px, transparent 1.9px)` | identical | ✅ |
| `background-size` | `calc(45% - 30px) 1px, calc(45% - 30px) 1px, 4px 4px, 4px 4px` | identical | ✅ |
| `background-position` | `5% 3.5px, 95% 3.5px, calc(50% - 24px) 2px, calc(50% + 24px) 2px` | identical | ✅ |
| `background-repeat` | `no-repeat` ×4 | identical | ✅ |
| diamond `::after` | `top 4px`, 8×8, `rotate(45°)`, halo `0 0 0 4px <plate>` + `0 0 0 5px --dse-metal-faint` | identical | ✅ |
| **air above / below the centre** | **16 / 16** | **16 / 16** | ✅ |

Both colour schemes: the line resolves to `rgba(176,183,187,.5)` dark and
`rgba(95,103,108,.45)` light — the site's own two values. **The twins are identical
declaration for declaration, measured, not asserted.**

**The pseudo-element argument checks out.** `::before` on `.dse-feature` is occupied (3px
wide, `content: ""`) — the SC-101/102 action spine, which flat mode keeps; `::after` is the
diamond. Riding the four layers on the element's own `background-image` is the correct trade.

**Screen-only, confirmed by measurement:** with `print=1` the same element reports
`background-image: none`, `margin-top: 0px`, `::after` absent. This is the independent
confirmation that item 2 contributes nothing to the print delta.

**Guards have teeth (falsified).** Dropping the two line gradients from the statblock arm →
the statblock separator guard fails. Dropping them from the featureblock arm → the
featureblock-twin guard fails. Reverting `margin-top` to round 1's `4px` → the statblock
guard fails. All reverted.

---

## Item 3 — head-notch clearance: **CONFIRMED, and measured wider than the report did**

The correct reference is the **stat cell's** border box (`.dse-sb__item`, which carries a
real `1px solid rgba(176,183,187,.16)` frame, `rgba(0,0,0,.22)` fill, 6.4px radius) — not
the row container, whose 0.3rem inset is interior. Measured cell-top minus head-bottom:

| context | notch | head `margin-bottom` | row `padding-top` | clearance | halo | **air** |
|---|---|---|---|---|---|---|
| 640 / 900 / 1100px, dark | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| 900px, light | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| 900px, `density: compact` | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| **900px, PRINT** | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| **420px, PRINT** | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| 900px, light, PRINT | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| `villain-corpus`, `stats-ledger` | ✔ | 12px | 4.8px | 16.8px | 13.44px | **+3.36** |
| `roleless-corpus` (screen + print) | ✘ | 0px | 4.8px | 12.8px | — | n/a |

Against the site's own levers — `.sb__head { margin-bottom: .55rem }` (11px) +
`.sb__defenses { padding: .3rem … }` (6px) = **17px**, halo 13.44px, air **+3.56px** — the
claim "16.8px / +3.36px vs 17px / +3.56px" is **exactly right**, in every notch-drawing
context and in both media. The roleless case reads 12.8px with `notchDrawn: false`, as the
report says.

**Guards have teeth (falsified).** Removing `margin-bottom` from the structure twin → item-3
guard fails. Print-excluding the twin (the original bug) → fails. Removing the row's
`padding-top: 0.3rem` → fails. All reverted.

---

## The 17-line rebaseline: **CORRECT and MINIMAL**

| Check | Result |
|---|---|
| All 17 names present in the shared 66-line baseline | ✅ 17/17 |
| Any line a no-op (after == before) | ✅ none — every line genuinely changes |
| **All 17 "after" hashes match shots I regenerated myself at `a9e3ac5`** | ✅ **17/17 OK, 0 mismatches** |
| "Before" hashes are the baseline's | ✅ proven the strong way — see below |
| Applying the rebaseline yields a green gate | ✅ simulated 66-line file (17 swapped, count and order preserved) → **66/66 OK** |
| Shared baseline untouched by the agent | ✅ 66 lines, mtime `2026-08-11 01:56` (the SC-144 retirement), commit is 08:37 |

**Stronger than a 17-hash check:** I regenerated the whole sweep from a scratch worktree at
`cbf17fa` and ran the shared baseline against it → **`freeze OK (66/66 steel-print PNGs
byte-identical)`, exit 0.** The baseline is exactly `cbf17fa`'s bytes, so every "before" hash
is current and nothing else on this branch had already moved them.

**The change set is exactly what the two items predict.** Comparing all 200 common shot names
before vs after: **3 new names** (`statblock-with-captain--steel-{dark,light,print}`), 0 lost,
**55 changed** = 19 steel-dark + 19 steel-light + 17 steel-print. The 17 print names are the
rebaseline set. The two ids that change on **screen only** are `featureblock-featstyle-flat`
(item 2's twin — screen-only, as designed) and `gallery` (a composite containing statblocks;
there is no gallery print shot). No other element moved in any combo.

### Is the delta "a pure vertical shift"? — substantively yes, with a precision correction

Pixel forensics on 5 sampled print shots (`statblock`, `statblock-featstyle-flat`,
`statblock-roleless-corpus`, `statblock-villain-banded`, `statblock-kwusage-text`):

- **Widths identical** in all 5. Heights `+18` device px on every role-bearing fixture and
  `+10` on `statblock-roleless-corpus` — matching the report.
- **Rows 0..203 byte-identical** in all 5: everything above the head's bottom edge is
  untouched, so the head, name, role band and the diamond itself did not move or change.
- **The best-fit alignment below the seam is exactly the height delta** — testing shifts of
  {dh−1, dh, dh+1}, the residual is minimised at dh by a factor of ~3-8× in every sample
  (e.g. `statblock`: 3.34% → **1.14%** → 3.84% nonzero). A single global vertical
  translation is the transform.
- **The residual at the correct shift is thin-edge only**: 374 of 3724 rows carry any
  >32 residual, in 38 bands of 1-6 device px each — the signature of glyph and hairline edges
  re-rasterizing, not of anything structural moving. No thick or block-shaped residual
  anywhere.

**Why there is any residual at all (F1, precision):** the true layout delta is **8.8 CSS px**
— 4px from restating the head's `margin-bottom` (print had 8px, now 12px) plus 4.8px from the
row's new `0.3rem` inset — which at deviceScaleFactor 2 is **17.6 device px**, not 18. The
element box rounds up to +18, so every glyph below the seam re-hints at a ~0.4-device-px
offset. The report's "+18px @2× = +9 CSS px" describes the *image* growth correctly but reads
as if the *layout* moved a whole 9px; it moved 8.8. Consequence for the sanction: the after
shots are a **visual** translation of the before shots, not a byte-translation, so anyone
diffing them will see faint edge noise on text below the header. That is expected and
harmless — but it should be said, because "pure vertical shift" invites the opposite
expectation. The roleless fixture is the clean check on the arithmetic: it takes only the
4.8px row inset (9.6 device px → +10), exactly as observed.

---

## Landing probe the report did not run: the branch is already one rebase behind

`origin/main` has moved two commits past `cbf17fa` (`b0e908c` + `ac78c6a`, SC-142's
`docs-shots`). The dse-verify standing rule is never to carry numbers across a rebase, so I
ran it:

- `git cherry-pick a9e3ac5` onto `origin/main` — **auto-merges cleanly**, including
  `CHANGELOG.md` and `visual-harness/entry.ts` (both touched by main and by this branch). No
  conflicts.
- On the rebased tree: `tsc` clean, `jest` **2687 passed / 3 skipped / 2690 total** — the same
  suite as `a9e3ac5` (the 2-test delta is the known location-sensitivity of
  `token-coverage.test.ts`, which skips its two map-backed cases outside a recognised
  workspace layout; in a recognised layout this is 2689/1).
- `npm run shots` → **203**, unchanged; **all 17 "after" hashes still hold** (17/17 OK); the
  simulated post-rebaseline 66-line file → **66/66 OK**.

**The rebaseline is rebase-proof.** Main changes no CSS and no statblock fixture — SC-142's
`entry.ts` edit is confined to the gallery parameter and explicitly preserves `gallery=1`.

---

## Findings

**F1 — MINOR (precision, report wording only).** "+18px @2× = +9 CSS px" conflates image
growth with layout delta; the layout moves **8.8 CSS px** (4 + 4.8), i.e. 17.6 device px, and
the +18 is a rounding-up of the element box. Because the shift is fractional in device pixels,
the after shots are not a byte-translation of the before shots — text below the header
re-hints (~1% of pixels, thin edges only). Say so in the sanction note so the approval isn't
given against an expectation of a clean pixel diff. **No code change.**

**F2 — MINOR (report wording).** Item 3 claims the 16.8px figure was "verified at 420 / 640 /
900 / 1100px". At **420px** the stat row wraps, and the measured clearance is **29.03px**
(air +15.6), not 16.8. The substance is unaffected — 420px is the most generous case, never
an overlap — but the sentence should say "≥16.8px, and 29px at 420px where the row wraps".

**F3 — LANDING NOTE.** The new `statblock-with-captain--steel-print.png` is **not** in the
baseline (0 hits), so the fixture's own bytes are unpinned. That is correct for this commit —
a widening is a separate operation — but if the 2×2 layout is worth protecting (it is the only
picture of it that exists anywhere, and the site can never produce it), it wants a one-line
widening. Post-SC-144 a widening is **one** line per capture id, not three.

**F4 — LANDING NOTE, pre-existing, not this branch's doing.** The shared main checkout's
`draw-steel-elements` submodule is dirty (`M demo-vault/Welcome.md`, `?? compendium-manifest.json`)
— the same residue flagged in the SC-144 review. `just deploy*` / `wt-finish` hard-abort on a
dirty tree, so it must be cleared before landing.

**Not findings, recorded for completeness:** the CHANGELOG's two new bullets are accurate —
"the same ornament a bare `---` already draws" is true (the `ds-hr` steel rule is the same
recipe: two centre-out fading `--dse-metal-line` gradients, two `1.4px/1.9px --dse-metal` seed
dots and a 9px rotated diamond with a 4px halo + 5px ring; only the dot offset differs, ±22px
there vs the site's ±24px here, each being that surface's own site value), "about 1px … and
about 5px on paper" matches the measured −1.44 / −5.44, and "Featureblocks in 'Flat list' draw
the identical separator" is measured true. Open question 3 (`With Captain` is plugin-only) is
a real, correctly-flagged divergence and is out of scope here.

---

## Collateral

Diffstat confined to the four declared files (`CHANGELOG.md`, `styles-source.css`,
`test/dom/framework/pref-reflection.test.ts`, `visual-harness/entry.ts`), 179 insertions /
5 deletions. No `src/` change, no parity change (`visual-harness/parity/` untouched, gate
unchanged at 0/0/16). Branch worktree `git status` clean. Workspace shows only the pre-existing
`m draw-steel-elements` of F4. The shared freeze baseline is untouched (66 lines, and my
`cbf17fa` regeneration scores 66/66 against it).

## Review hygiene

Three scratch git worktrees (`r2mut` for mutation testing, `r2base` at `cbf17fa`, `r2reb` at
`origin/main` + cherry-pick) were created and all removed, with `git worktree prune` run. Ten
mutations were applied and every one reverted (`git checkout`); the branch worktree is clean at
`a9e3ac5`. Probe scripts were run from the scratchpad and their temporary copies deleted from
the repo; nothing was written into the worktree except regenerated `visual-harness/shots/`,
which is gitignored.
