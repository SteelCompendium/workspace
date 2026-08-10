# SC-132 round 3 — per-component option strips (2026-08-08)

Response to Scott's review comment `d76531ae` ("Im going to break down what I like and dont
like"). He deliberately did **not** pick a layout from A/B/C/D and asked for the appearance
of the individual **components** to be settled first, plus factual answers on Catch Breath
and conditions. This round therefore ships **option strips**, not a fifth candidate, and
**asks for no layout pick**.

**Commit:** dse `c284b92` on `sc132-stamina` (parent `878c272`). NOT pushed; no superproject
pointer bump.
**Linear:** one self-contained comment on SC-132 with 10 inlined strips (dark+light stitched
per strip). Status In Progress, labels `["Needs Review"]`.

## What changed in the repo

| File | Change |
|---|---|
| `visual-harness/entry.ts` | `STRIPS` (10 definitions), `mountStrip`, `decorateStripCell`, `?strip=` param, 3 new candidate fixtures (`winded-temp`, `rec-none`, `rec-full`) |
| `visual-harness/index.html` | strip grid chrome (`.dse-cand-strip`, column caps, option rail, focus trims) |
| `visual-harness/strips.mjs` | **new** camera → `shots-candidates/strip--<id>--<scheme>.png` |
| `styles-source.css` | the round-3 variant block (E/M/H/T/R/L/CB/Y/F/X), inside the existing candidate region |

**`src/` is untouched this round.** Everything the strips need that the plugin does not emit
(marker labels, condition chips, the ledger's step, the CB1 hover demo) is injected by the
harness in `decorateStripCell`. So jest, the swept shots and the freeze surface cannot move
by construction — not merely by CSS scoping.

**Gating (doubled, as before):** every rule starts with the `[data-dse-stamina-cand]` root
attribute *and* needs a `data-dse-stamina-var` token that only the strip renderer stamps.
Options **compose** (`data-dse-stamina-var="cb1 r2 l1"`), so selectors use `~=`, and
`decorateStripCell` tests set membership — an equality test there was a real bug this round
(CB1's hover demo and F1's ledger step silently no-op'd on the first shoot).

## The two factual questions

### Catch Breath — it is fully functional; the markers are inert

- Two implementations, same shape: `src/elements/stamina-bar/view.ts:148-160` (+ handler
  `:201-211`) and `src/elements/hero/view.ts:322-327` (+ handler `:366-379`). Real
  `<button class="dse-btn">` via `src/framework/kit/iconButton.ts`, lucide `wind`.
- **Click = spend 1 recovery AND heal `floor(max_stamina / 3)` stamina**, clamped so a heal
  never overshoots max (`src/model/StaminaBar.ts:185-187` `recoveryValue`, `:205-207`
  `recoveryHealAmount`). Persists through the normal ~400 ms debounced
  `serialize → host.replaceSource` path — into the **fenced code block**, not frontmatter.
- Real-`disabled` (never hidden) when `!canPersist` / `isDying` / `recoveries <= 0`.
- **The recovery markers do nothing.** `.dse-stamina-rec__pip` are bare `div`s
  (`stamina-bar/view.ts:143-146`, `hero/view.ts:319-320`); the only update is
  `toggleClass('--filled')`. No `registerDomEvent`, no `role`/`tabindex`, no `cursor` in CSS.
- Recoveries are otherwise editable only via `StaminaEditModal`'s **Spend Recovery** quick
  action (reached by clicking the *bar*) and the hero sheet's **Respite**. Note
  `hero/view.ts:283` renders the bar with `canPersist: false`, so **on the hero sheet the bar
  is not clickable and the modal is unreachable** — Catch Breath is the only per-recovery
  affordance there.
- Tests documenting it: `test/dom/elements/staminaRecoveries.test.ts:159-200` (click → 31→47
  at max 48, recoveries 6→5, one debounced byte-exact write), `:202-252` (the three disabled
  paths).

So Scott's guess is half right: it does uncheck a marker — *and* heals. That heal is the part
that is **not** implicit in the checkboxes, which is the whole argument for CB1 (make the
marker itself the button, i.e. clicking marker *n* = "spend this recovery") over deleting the
control.

### Conditions — a separate, mature subsystem; the cluster surfaces none of it

- Five surfaces, one model: initiative tracker rows (`initiative/view.ts:531,748,862-908`),
  the minion pool modal, the standalone **`ds-conditions`** chip strip
  (`src/elements/conditions/`), the hero sheet's own **Conditions grid region**
  (`hero/view.ts:149,439-465`), and the `AddConditionsModal` / `CustomizeConditionModal` pair
  (`src/views/ConditionSelectModal.ts` — that's the `.dse-cond-list` picker, add-only;
  removal is the chip ✕ or clicking the icon).
- Model: `Condition { key; color?; effect? }` (`EncounterData.ts:127-131`), stored as YAML in
  the code block. Catalog `src/utils/Conditions.ts` — 8 real conditions + 16
  pseudo-conditions, which **already include `winded` / `dying` / `dead`**.
- **Neither stamina surface renders conditions.** `grep -i cond src/elements/stamina-bar/`
  is empty; the SC-132 candidate layer adds none. On the hero sheet Conditions is grid row 3
  column 1 while Stamina is row 1 column 2 — not adjacent.
- The one real coupling is a **duplicated wound badge**: `.dse-stamina-rec__status` (stamina
  region) and `.dse-hero__wound-badge` (conditions region) are both rendered and kept in sync
  by `refreshStaminaRegion → refreshConditionsRegion` (`hero/view.ts:387-396`), explicitly so
  that "conditions" reads as the hero's full status.
- **No Steel treatment exists for conditions at all** — zero rules in `styles-source.css`
  combine `[data-dse-theme='steel']` with any `.dse-cond*` selector. X1 is net-new work either
  way.

Recommendation: **X2** (leave conditions where they are). The duplicated wound badge is the
actual smell, and it is a separate ticket.

## The temp-edge defect (item 1) — a genuine CSS bug, diagnosed

`.dse-stamina__gshield` carried
`clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.22rem 50%)` — a **concave wedge bitten
out of its own left edge** (measured: 3.52px deep, apex at mid-height). Two consequences:

1. the boundary shows a triangular hole of bare channel instead of a join, and
2. because clip-path clips an element's entire rendered output, the
   `-1px 0 0 rgba(0,0,0,.5)` **outer** shadow that was meant to be the separator is never
   painted at all — while the pour's own `inset -1px 0 0 rgba(255,255,255,.42)` meniscus
   still draws a bright line right beside the hole.

Both edges were accidents. **E1** replaces them with the zero bulkhead's own vocabulary: one
forged two-tone seam at the join (shadow face pourwards, catch-light face tempwards), drawn on
the **channel** so it stays opaque under any temp material, plus a plain rail closing the far
end; the pour's meniscus stands down while temp is present. Measured: seam vs. pour end
**|Δ| 0.000px**, both schemes.

The right-hand "separator" is a different thing — the **base-max index mark** (item 2), which
lands on the temp plate's far edge at 24/30 +6 but *inside* the plate at 8/30 +40 and out in
empty channel at 11/30 +6. Same mark, three unrelated-looking jobs. Options M0-M3.

## Strips built

| Strip | Base | Options |
|---|---|---|
| `temp-edge` | A, 2× zoom | E0 as reviewed · E1 forged seam |
| `max-mark` | C @ H2 | M0 as reviewed · M1 drop · M2 material tells it · M3 ◆ grammar |
| `c-height` | C | H1 0.30rem · H2 0.62rem · H3 1.05rem |
| `temp` | A | T1 solid · T2 spectral glass · T3 hollow · T4 crystalline · T5 shimmer |
| `rec-shape` | A | R1 diamond · R2 square · R3 pip · R4 ingot |
| `rec-label` | A + R2 | L1 eyebrow+count · L2 count · L3 unlabeled |
| `catch-breath` | A + R2 L1 | CB1 markers-are-the-control · CB2 icon-only · CB3 labelled |
| `dying` | A + R2 L1 | Y1 border · Y2 ground · Y3 both |
| `fresh` | A + R2 L1 | F1 Recovery Ledger · F2 Forge Heat |
| `conditions` | A + R2 L1 | X1 condition register · X2 untouched |

**Recommendations:** E1 · M2 · H2 · **T2** · **R2 + L1** · **CB1** (markers clickable; keep a
disabled-state tooltip explaining the heal) · Y1 for rails / Y3 for the sheet · F1 worth a
prototype · X2.

### The two fresh directions

- **F1 "Recovery Ledger"** — the gauge is graduated in **recoveries** (one division =
  `floor(max/3)` stamina), so the bar and the recovery strip finally measure the same thing
  and "two and a bit Catch Breaths from empty" is readable off the bar. Divisions run full
  depth because the pour genuinely *is* divided there — which is exactly the objection that
  kept the winded/base-max lines *off* the fill in candidate A.
- **F2 "Forge Heat"** — the metaphor inverts: the bar is solid steel at all times and stamina
  is how much of it is still **hot**. Nothing ever looks absent, only spent. Channel is proud
  rather than recessed; the dying reserve is the one genuinely breached section.

## Verification

**Round-3 variant probe** (headless Playwright, both schemes, every strip — the round-1
`<html>`-attr / light-twin specificity trap means "looks applied" proves nothing):

```
E  clip e0=polygon(…) e1=none · seam vs pour end: worst |Δ| 0.000px
M  m0=block m1=none m2 opacity=0.52 m3 transform=true
H  heights 6.797 → 11.906 → 18.797 px (channel border-box)
T  opacity t1=1 t2=0.52 · origins locked across all 5 materials
R  r1 rot=yes · r2 12.47x12.47 · r3 radius 50% · r4 20x9.91
L  l1=flex l2=flex l3=none · CB1 btn=none
F  recstep=33.33333333333333% (3 divisions == base-max span, ±0.01px) · f2 channel differs from f1: true
X  x1 chips=3 x2 chips=0
all round-3 variant checks PASSED in both schemes
```

Notable: the **SC-133 invariant is asserted, not assumed** — for each of the three temp
states, the shield's left and right offsets are identical across all five materials
(`lefts.size === 1 && rights.size === 1`), so a material choice cannot move temp's origin or
scale. And F1's step is derived from the numbers the panel already published
(`--dse-max-x − --dse-zone` spans exactly `max`), not from a second copy of the geometry;
three divisions equal the base-max span to within 0.01px.

Probe gotcha worth keeping: `getComputedStyle` reports **unzoomed** CSS px while
`getBoundingClientRect` reports the zoomed box, and rects are measured off the channel's
**border** box while absolutely-positioned children sit in its **padding** box. Both have to
be normalised out or a pseudo-element's position looks 205px wrong when it is exact.

## Battery (verbatim, real exit codes, nothing piped)

```
npm run tsc      exit 0  (no output)
npx jest         exit 0  Test Suites: 155 passed, 155 total
                         Tests:       2291 passed, 2291 total
                         Snapshots:   3 passed, 3 total
npm run shots    exit 0  199 ok, 0 FAIL
check-freeze.sh  exit 0  freeze OK (119/119 legacy+print PNGs byte-identical)
npm run parity   exit 0  0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).
```

`check-freeze.sh` needs its SHOTS_DIR argument here — the script's default still points at the
`steel-type` worktree.

`obsidian-shots` was NOT run: `pgrep -af obsidian` shows Scott's live vault owning the display.

## Boards on disk

`round3-{temp-edge,max-mark,c-height,temp,rec-shape,rec-label,catch-breath,dying,fresh,conditions}.png`
— each one the dark board stacked over the light board (`magick … -append`).
Per-scheme originals: `draw-steel-elements/visual-harness/shots-candidates/strip--*.png`.
