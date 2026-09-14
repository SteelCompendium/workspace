# SC-202 round 6b — INDEPENDENT REVIEW of `a8bc607` (real app.css ON for screen combos)

Reviewer: independent (did not write the code). Base `742bcd9`, develop `8b65a14`. Tree
left exactly as found (`git status --porcelain` empty before and after; `dist/obsidian-app.css`
= `f612f1e8…`, meta `pinned-cache 1.13.7`). All mutation work was done in throw-away copies
under the scratchpad, never in the worktree.

## Executive summary (≤10 lines)

**FIX-ROUND-NEEDED — 2 HIGH / 4 MED / 3 LOW.** Battery independently green and byte-reproduced
(jest 3825/1sk/199-of-200; shots 524/0 ×2 deterministic; `freeze OK (252/252 …)`; 8/8 widening;
parity 0/0/16; **256 moved screen shots = 131 dark + 125 light, 0 of 260 print/realprint**, my
own base sweep is byte-identical to the r6a re-review's file). **HIGH-1: the `vars.css` "fallback
floor" is a CEILING** — its `body.theme-dark|light` blocks sit at (0,1,1) and outrank app.css's
`.theme-dark`/`body` (0,1,0)/(0,0,1), so **11 dark / 8 light Obsidian tokens still resolve to the
stale 2026-07-10 fakes under `sheet=1`** (`--background-primary` `#1e1e1e` vs the vault's `#1C1C1C`,
`--color-blue` `#086ddd` vs `#027aff`, …), plus 2 hybrid `color-mix()` values that match neither
side; report §7 Cause B ("now correctly overridden") is false for exactly those. **HIGH-2: a
genuine un-re-grounded host property DOES exist** — Obsidian's `.markdown-rendered p { margin-block:
var(--p-spacing) }` reaches `.dse-party__member-ref p` inside `[data-dse-element]` (13.6px→16px) and
is the **sole** cause of `party--steel-{dark,light}` moving; no sweep covers a bare `<p>`. **Item 2
verdict: deviation ACCEPTED in principle, REJECTED as implemented** (right idea, wrong specificity;
one-line `:where()` fix validated below — 0 fake-wins, `freeze OK (252/252)`, 0 frozen bytes).
**Item 3 verdict: FINDING** — the SC-205 button gate and SC-189 `assertChromeHostLeak` still gate a
page no capture and no vault matches; the remedy also makes the §3 deviation unnecessary for them.
**Item 5 verdict: CLAIM CONFIRMED** — reproduced on `742bcd9`; `fontFamily` was vacuous in
input (r1) / table (r2) / heading (r4) from round 1 through 6a. Crops re-shot matched
(after ≈ before; **the round did not move the harness closer to the vault** in any of the three).

---

## What I ran (all foreground, logs in this directory, prefix `sc202-r6brev-`)

| Gate | Result (verbatim) | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc202-r6brev-tsc.log` |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation warning) | `sc202-r6brev-lint.log` |
| `npx jest` | `Test Suites: 1 skipped, 199 passed, 199 of 200 total` / `Tests:       1 skipped, 3825 passed, 3826 total` | `sc202-r6brev-jest.log` |
| `npm run shots` ×2 | 524 `ok`, 0 `FAIL`, both runs; **run1 sha == run2 sha (deterministic)** | `…-shots.log`, `…-shots2.log` |
| provenance | `host sheet: pinned-cache, Obsidian 1.13.7, sha256 f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41` | `…-shots.log:19` |
| drift | `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.14.0 … pinned 1.13.7` (expected, r6a design) | `…-shots.log:17` |
| six sweeps + chrome + pin | all `OK`, **byte-identical to the implementer's `sc202-r6b-shots-final.log` sweep lines** (`diff` empty) | `…-shots.log` |
| `check-freeze.sh` | `freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` | `sc202-r6brev-freeze.log` |
| 8 widening hashes | all `OK` (`sha256sum -c` against `sc202-r3-widening.txt` + `sc202-r4-widening.txt`) | inline |
| `npm run parity` (LAST) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0; DECLARED set **identical** to `sc202-r6arerev-parity.log` | `sc202-r6brev-parity.log` |

**Item 6 — sha diff reproduced independently.** I shot the base myself from a clean
`git archive 742bcd9` copy: my 524-line base file is **0 lines different** from the r6a
re-review's `sc202-r6arerev-allshots.sha256`. Moved: **256 = 131 `--steel-dark` + 125
`--steel-light`; 0 of 130 `--steel-print` + 0 of 130 `--steel-realprint`.** Matches the
report exactly. (`sc202-r6brev-base-allshots.sha256`, `sc202-r6brev-shadiff.txt`.)

**Item 7 — print untouched.** Confirmed three ways: `freeze OK (252/252)`, 8/8 widening
hashes, and my own filename-keyed sha diff (260/260 print+realprint identical).

**Item 11 — LOW-3b fold reproduced.** Symlinked CLI on `742bcd9`: **no output, exit 0** (the
silent no-op). Same symlink on `a8bc607`: drift line + `host sheet: pinned-cache, Obsidian
1.13.7, sha256 f612f1e8…`, exit 0. Fold is real and load-bearing.
(`sc202-r6brev-low3b-symlink{,-base}.log`.)

**Item 4 — sweeps are non-tautological; all six can-fail, re-run by me.** I proved the page
state directly rather than reading the code: on the sweep's own URL the bare pass has
`--list-indent: 2em` (vars.css) and `img { max-width: none }`, the host pass has
`calc(0.5625em * 4)` and `max-width: 100%` — the toggle genuinely adds and removes Obsidian's
rules across a CDP round-trip (`sc202-r6brev-toggle2.log`). Can-fails, each by deleting that
family's own re-grounding block from `styles-source.css` in an isolated copy and re-running the
sweeps:

| Family | deleted | result |
|---|---|---|
| button (SC-203) | 90 rule lines (`styles-source.css:14952-15041`, SC-205 fence kept) | `BUTTON HOST-LEAK VIOLATED` |
| input (r1) | `15042-15539` | `INPUT HOST-LEAK VIOLATED` |
| table (r2) | `15540-15769` | `TABLE HOST-LEAK VIOLATED` |
| list (r3) | `15770-16155` | `LIST HOST-LEAK VIOLATED` |
| inline (r4) | `16156-16585` | `INLINE HOST-LEAK VIOLATED` |
| checkbox (r5) | `16586-16962` | `CHECKBOX HOST-LEAK VIOLATED` |

(`sc202-r6brev-canfail-{button,input,table,list,inline,checkbox}.log`; baseline
`sc202-r6brev-canfail-baseline.log` prints all nine gate lines with the same counts as the
full run.)

---

# Findings

## HIGH-1 — the `vars.css` fallback floor outranks the real sheet: 11 dark / 8 light Obsidian tokens are still the stale July fakes under `sheet=1`

**`visual-harness/vars.css:63` (`body.theme-dark {`) and `visual-harness/vars.css:85`
(`body.theme-light {`)**; the load-order argument is stated as fact in
`visual-harness/index.html:6-12`, `visual-harness/vars.css:1-17` and `sc202-r6b-report.md` §3.

The round's whole mechanism is "same selectors, so whichever is present LAST wins". That is
false. `vars.css` declares its theme tokens on **`body.theme-dark`** — specificity **(0,1,1)**.
Obsidian's `app.css` declares the same tokens on **`.theme-dark`** (0,1,0) or on **`body`**
(0,0,1). Specificity is decided before source order, so **`vars.css` wins every theme-scoped
token no matter where the link sits.** Only the 27 tokens in `vars.css`'s own bare `body {}`
block tie app.css's `body {}` and therefore lose to it — which is exactly the set the report
saw flip (`--font-text`, `--font-monospace`, `--list-indent`, `--tag-*`).

**Measured** (`sc202-r6brev-tokenwin.log`, resolved on the real `sheet=1` capture page, all 46
tokens `vars.css` declares; cross-checked against the real vault over CDP,
`sc202-r6brev-vaultprobe.log` / `sc202-r6brev-harnesstok.log`):

| token | harness `sheet=1` (shipped) | pinned app.css / real vault | verdict |
|---|---|---|---|
| `--background-primary` (dark) | `#1e1e1e` | `#1C1C1C` | FAKE WINS |
| `--background-primary-alt` | `#242424` | `#232323` | FAKE WINS |
| `--background-secondary` | `#262626` | `#282828` | FAKE WINS |
| `--background-modifier-border` | `#363636` | `#333333` | FAKE WINS |
| `--background-modifier-hover` | `rgba(255,255,255,.075)` | `color-mix(in oklch, white 6.7%, transparent)` | FAKE WINS |
| `--code-background` | `#262626` | `#232323` | FAKE WINS |
| `--color-base-25` | `#2a2a2a` | `#2e2e2e` | FAKE WINS |
| `--color-base-30` | `#363636` | `#333333` | FAKE WINS |
| `--color-blue` | `#086ddd` | `#027aff` | FAKE WINS |
| `--interactive-accent` | `#7f6df2` | `hsl(258, 88%, 66%)` | FAKE WINS |
| `--text-on-accent` | `#ffffff` | `white` | FAKE WINS (same colour) |
| `--tag-background` | `color-mix(in oklch, #7f6df2 10%, transparent)` | `color-mix(in oklch, hsl(258,88%,66%) 10%, transparent)` | **HYBRID** — neither harness-before nor vault |
| `--tag-border-color` | `color-mix(in oklch, #7f6df2 15%, transparent)` | `color-mix(… hsl(258,88%,66%) 15% …)` | **HYBRID** |

Light scheme: 8 fake-wins (`--background-modifier-border` `#dddddd` vs `#e4e4e4`,
`--code-background` `#f5f5f5` vs `#fafafa`, `--color-base-25` `#e6e6e6` vs `#efefef`,
`--color-base-30`, `--text-faint` `#999999` vs `#ababab`, `--interactive-accent`,
`--background-modifier-hover`, `--text-on-accent`) + the same 2 hybrids.

**These are not pin drift.** The vault (installed 1.14.0) reports the same values as the pinned
1.13.7 sheet for every one of them — so the harness disagrees with both.

**Failure scenario.** (a) The round's own contract — "harness value == vault value" — is
violated for 13 of the 30 tokens I sampled at the plugin root, in the direction the ticket
exists to close. (b) Worse, it is a live **false-negative surface for the gates**: every sweep's
"host" sample resolves Obsidian's declarations through these stale token values, so any leak
whose host value happens to coincide with the plugin's value under the *fake* token (but not
under the real one) reports 0 diffs. The board is green against a host that does not exist.
(c) The two hybrids are values no engine anywhere ever produces.

**Prescribed fix (validated end to end by me).** Wrap the two theme blocks in `:where()` so the
floor is a floor:

```css
:where(body.theme-dark) { … }     /* was  body.theme-dark { … }  — (0,1,1) → (0,1,0) */
:where(body.theme-light) { … }    /* was  body.theme-light { … } */
```

Applied in an isolated copy: **fake-wins 11/8 → 0/0, hybrids 2 → 0**, all 46 tokens resolve to
the real sheet when it is on and to the fallback when it is off; full battery still green
(`524 ok / 0 FAIL`, all nine gate lines `OK`); **`freeze OK (252/252 …)`, 0 of 260
print/realprint bytes move**; a further **139 screen shots** move (the tokens finally taking
effect) — screen is not frozen, so this stays inside 6b's own no-sanction fence.
Logs: `sc202-r6brev-tokenfix-validated.log`, `sc202-r6brev-wherefix-sweeps.log`,
`sc202-r6brev-wherefix-shots.log`, `sc202-r6brev-wherefix-allshots.sha256`.

Also: the report's §7 Cause-B narrative and its `--background-primary` / `--color-blue`
examples must be corrected — those two are precisely the tokens that did **not** get
superseded.

## HIGH-2 — a genuinely un-re-grounded host property does reach plugin DOM; the report's "No Cause D … Not found" is wrong

**`.markdown-rendered p { margin-block-start: var(--p-spacing); margin-block-end: var(--p-spacing) }`**
(Obsidian's own rule, confirmed via `CSS.getMatchedStylesForNode` — `sc202-r6brev-pmargin-rule.log`)
reaches **`[data-dse-element] .dse-party__member-ref p`**: `margin-top`/`margin-bottom`
**13.6px → 16px** in both schemes. The plugin re-grounds `p` only through
`styles-source.css:216` (`.dse-md-inline > p { margin-block: 0 }`); a bare `<p>` that is not
inside `.dse-md-inline` is not covered by that rule and is not covered by **any** sweep (the
list sweep covers `ul/ol/li/blockquote/hr` + a synthetic `li > p`; the inline sweep covers
headings/emphasis/links).

**It is visible and it is the sole cause of two moved shots.** My three-way byte matrix
(below) puts `party--steel-dark` and `party--steel-light` in the "moved by sheet content only"
bucket — `V0 → V1` (wrapper + box-sizing/overflow-wrap) moves **0** pixels on them, and the
only non-`fontFamily`, non-`caret-color` computed change from `V1 → V2` across the whole
fixture is this margin. AE `party--steel-dark` = **350,232 px**, `--steel-light` = **340,138 px**.

Two more properties in the same class, found by the same scan over 41 fixture/scheme pairs
(`sc202-r6brev-causeD.log`, `sc202-r6brev-causeD2.log`):

- **`img`**: `.markdown-rendered img { max-width: 100%; image-rendering: -webkit-optimize-contrast; -webkit-touch-callout: default }`
  reaches the 9 portraits in `initiative-roster` (`max-width: none → 100%`,
  `image-rendering: auto → -webkit-optimize-contrast`). No pixel consequence measured at the
  current portrait sizes, but `image-rendering` is a paint property and `max-width` is a box
  property — both are exactly what the ticket calls a leak.
- **`caret-color`**: changes on ~1,860 plugin nodes per scheme (`rgba(220,226,230,.88) →
  rgb(218,218,218)` dark, `rgb(44,46,48) → rgb(34,34,34)` light). Invisible in a static
  screenshot, but this is the *named deferral* from round 2 — `shoot.mjs`'s own r2 comment says
  the exceptions "fold into the 'turn the sheet on' round's census **alongside r1's
  `caret-color`**". This round is that round, and `caret-color` appears nowhere in the report
  or the code.

**Failure scenario.** The ticket's premise is that an un-re-grounded host property reaching
plugin DOM is the defect class the harness must make visible. Three of them are reaching it
today, one with a 350k-pixel visible effect, and the round's report declares the class empty —
so they will be carried into the final ask as "no leaks left".

**Prescribed fix.** (a) Re-ground bare `p` inside `[data-dse-element]` the way `li > p` was
re-grounded in r3, or make the party member-ref body use `.dse-md-inline` like every other
markdown body; (b) add `p` (bare, not just `li > p`) and `img` to a sweep's subject list so the
class is gated, not just patched — the list sweep is the natural home for `p`, and `img` wants
its own small block; (c) census `caret-color` explicitly (re-ground it or record it as accepted
truth with the owner's ruling), since r2 promised this round would.

## MED-1 (item 3) — the button and chrome gates still run against a page that no capture and no vault matches

**`visual-harness/shoot.mjs:1541-1546`** (`assertBtnHostLeak`) and
**`visual-harness/shoot.mjs:968-974`** (`assertChromeHostLeak`) build their navigations without
`sheet: '1'`. I verified the consequence rather than reading the comment: on those URLs
`applyRealObsidianCascade` leaves `#dse-obsidian-app-css` disabled **and** leaves `#mount`
unwrapped, so those two gates run with (i) no Obsidian sheet, (ii) no `.markdown-preview-view`
ancestor, (iii) `box-sizing: content-box` — because `vars.css`'s new accepted-truth rule is
scoped to `.markdown-preview-view` — and (iv) only the stale fake tokens.

The report calls this "not reformulated by design… so it was never made tautological". That is
true and beside the point: the round changed what every *capture* is, and these two gates were
left gating the old world. **Every one of the 524 screen shots now renders buttons under
`border-box`, under `.markdown-rendered`, under the real sheet; the button gate proves nothing
about that page.**

**Measured blast radius today: small.** Toggling the real sheet on a `sheet=1` gallery page and
re-reading all 256 plugin buttons × 24 properties finds exactly one changed property —
`fontFamily` (`sc202-r6brev-btngap.log`). So this is a structural/process gap, not a live
defect, which is why it is MED and not HIGH. But the box model the gate compares in is not the
box model anything ships in, and `assertHostCopyPinnedToObsidian`'s documented ancestor-scope
exclusions were derived under the old assumption.

**Prescribed fix (demonstrated).** Add `sheet: '1'` to both navigations and use
`setHostSheetEnabled` for their bare/host halves, exactly as the other six do. I ran the
half-measure (add `sheet: '1'` to both navigations) *with `vars.css`'s fakes deleted entirely*
and **both gates come back green** (`sc202-r6brev-varsdelete-sheeton.log`) — which is also the
proof that the §3 deviation was not required for these two.

## MED-2 — nothing verifies that the stylesheet the browser actually applied is Obsidian's

r6a's MED-1 remedy hashes the bytes `loadLocalObsidianAppCss()`/`readVerifiedSheet()` read.
Since r6b, the bytes that *reach the page* arrive by `<link href="dist/obsidian-app.css">`
(`visual-harness/index.html:26`) and are never checked. I replaced that href with an **empty**
stylesheet in an isolated copy and ran the full battery: **524 ok / 0 FAIL and all six sweeps
plus the token-override probe printed `OK` with byte-identical comparison counts**
(`sc202-r6brev-v1-shots.log`). A harness that has silently lost Obsidian's CSS is
indistinguishable from a green one.

Coupled fragility, proven: `link.disabled = true` **detaches** the sheet
(`link.sheet === null`), and re-enabling it does **not** restore it within the same
`page.evaluate` — only across a round-trip (`sc202-r6brev-toggle.log` vs
`sc202-r6brev-toggle2.log`). Today's sweeps are safe because their enable and their read are
separate CDP calls. Any future refactor that batches them yields a vacuously green host pass
with no warning.

**Prescribed fix.** In `setHostSheetEnabled(page, true)`, assert the sheet is really live before
the host sample — cheapest reliable sentinel is a value only the real sheet can produce, e.g.
`getComputedStyle(document.body).getPropertyValue('--list-indent') === 'calc(0.5625em * 4)'`
(and its negation for the bare pass), or `link.sheet.cssRules.length > 3000`. Hard-fail with
the r6a `HASH_FAILURE_REMEDY` wording.

## MED-3 — the report's cause table names the wrong dominant cause

The report says Cause A (box-sizing/overflow-wrap) "is the DOMINANT cause across the 131". I
built the decisive experiment instead of sampling: three full 524-shot sweeps —
**V0** = `742bcd9`; **V1** = `a8bc607` with the injected sheet emptied (so only the
`.markdown-preview-view` wrapper + `vars.css`'s accepted-truth `box-sizing`/`overflow-wrap` are
live); **V2** = `a8bc607` as shipped — and classified **every** file
(`sc202-r6brev-cause-matrix.txt`):

| bucket | count |
|---|---|
| print/realprint, unmoved | 260 |
| screen, unmoved | 8 |
| screen, moved by **sheet content only** (V0==V1, V1≠V2) | **74** |
| screen, moved by **wrapper + box-sizing only** (V0≠V1, V1==V2) | **2** (`statblock-sticky-narrow--steel-{dark,light}`) |
| screen, moved by **both** | **180** |

So sheet content touches 254 of 256; box-sizing/overflow-wrap touches 182 and is the *sole*
cause of 2. Per-shot magnitudes vary wildly in both directions (`hero--steel-dark`: A=409,735 px
B=338 px; `party--steel-dark`: A=0 B=350,232; `statblock--steel-dark`: A=310,860 B=7,719,030;
`treasure--steel-dark`: A=0 B=5,499). The table should be replaced with this matrix.

Two sub-claims in §7 that my measurements contradict:
- *"hero's panel fills: a sampled pixel moved from `rgb(30,36,39)` to `rgb(48,53,56)`"* — across
  hero's 217 plugin nodes there are **zero** `color` or `backgroundColor` changes between V1
  and V2, and the whole V1→V2 delta on `hero--steel-dark` is **338 px (0.0001 %)**.
- *"Cause C — font rendering … sub-pixel"* — `fontFamily` changes on **every** plugin node, but
  the primary face `Source Serif 4` is a bundled `@font-face` and is the font actually used in
  both the harness and the vault (`CSS.getPlatformFontsForNode`, `sc202-r6brev-vaultfonts.log`),
  so the change is inert for plugin text. That is the right conclusion by the wrong reasoning,
  and it is worth stating correctly because it is *also* why excluding `fontFamily` from three
  sweeps costs nothing.

## MED-4 (items 8 + 9) — re-shot matched crops: the round did **not** move the harness closer to the vault

The implementer's crops were not comparable (the owner already spotted this). I re-shot all
nine at a **matched region, matched crop box and matched device scale**: same element, same
clip rect, harness `#mount` width-matched to the vault's reading pane (1020 CSS px), vault
captured at `scale: 1` on a dpr-2 display so both sides are natively 2×.

Overwritten at the brief's paths, 900 px wide, **9 distinct sha256** (listed at the end).
Triptychs (before / after / vault, stacked) also written for eyeballing.

| region | before vs after | after vs vault | before vs vault |
|---|---|---|---|
| `statblock` head band (`.dse-head`, 2036×234) | AE **67** (0.01 %), 0 at fuzz 8 % | AE 471,762 (99 %), **228,361 (47.9 %)** at fuzz 8 % | AE 471,762, 228,364 at fuzz 8 % |
| `hero` top 175 px (`.dse-hero`, 2040×350) | AE 337,927 (47 %), **0** at fuzz 8 % | AE 431,178, 34,848 (4.9 %) at fuzz 8 % | AE 425,942, 34,843 (4.9 %) |
| `negotiation` top 300 px (`.dse-nt`, 1972×600) | AE **205** (0.02 %), 0 at fuzz 8 % | AE 735,001, 64,642 (5.5 %) at fuzz 8 % | AE 734,989, 64,647 (5.5 %) |

**The after-vs-vault residual is the same as the before-vs-vault residual, to within 0.01 %, in
all three regions.** Whatever the round changed, it did not close the harness/vault gap in the
regions the owner will show Scott. `hero` moved 47 % of pixels before→after but **0** at fuzz
8 % — that is a 1–2 px vertical shift from box-sizing, not a colour or material change.

**Captions (colours in words, per Scott's colour-blindness).**

- **`statblock` — the head band.** Before and after are indistinguishable (67 differing pixels
  in a 476k-pixel band). The vault's band is **noticeably darker**: the harness paints a
  near-black-to-charcoal gradient starting at a **mid slate-grey**, the vault starts at a
  **very dark charcoal** — measured, `linear-gradient(rgb(77,83,87) → rgb(38,42,45))` in the
  harness vs `linear-gradient(rgb(34,39,43) → rgb(26,30,33))` in the vault. The crest shield,
  the pale eyebrow text ("HUMAN, HUMANOID"), the white title and the two outlined chips ("LEVEL
  3", "EV 20") are otherwise identical in position and colour. **Measured cause: not this
  round, and not tokens** — see LOW-3.
- **`hero` — header + first three reference rows.** Before → after: everything shifts up by
  about 2 px and the card's content box widens from 726 to 760 CSS px (accepted `box-sizing`
  truth). No colour change anywhere — the pale-grey title "TORIN STONEFIST", the muted
  "Lvl 3 · Echelon 1" line and the outlined reference pills are the same shade in both. Vault:
  same fonts, same shades, same layout — but the reference pills read different **text**
  (`"mcdm.heroes.v1/class/fury" not found in compendium` vs the harness's `Compendium not
  installed — run "Sync compendium"`), because the harness has no compendium and the demo vault
  does. That text-length difference is the whole of the `hero` residual below the header; it is
  a measurement limitation, exactly as the report says.
- **`negotiation` — title, Patience track, Interest ladder.** Before → after: 205 differing
  pixels out of 1.18 M; visually a null result. Vault: same layout, same shades; the only
  visible difference is the current Interest rung — the harness draws a soft **teal-cyan halo**
  around the filled dot, the vault draws the dot with only a thin teal-cyan edge and no halo.
  **Measured cause: LOW-3** (the halo is a `color-mix()` product).

## LOW-1 — `boxSizing`/`overflowWrap` are now un-failable entries in `TABLE_CELL_PROPS`

`visual-harness/shoot.mjs:2196-2216` keeps both properties in the sampled list, and the printed
gate line advertises them ("including box-sizing/overflow-wrap, accepted as Obsidian's permanent
page-wide truth"). But `vars.css:110-132` declares both unconditionally on the wrapper, and the
wrapper is **not** toggled by `setHostSheetEnabled` — so bare and host read the same value by
construction. The comparison can never fail; the gate line implies coverage it does not have.
**Fix:** either drop the two from `TABLE_CELL_PROPS` and say in the comment that they are
accepted truth asserted elsewhere, or convert them to an **absolute** assertion
(`boxSizing === 'border-box'` on a sampled cell) so the accepted truth is actually pinned.

## LOW-2 — report §10's crop captions describe changes the matched crops do not show

§10 says the `statblock` badge "reads noticeably WIDER" before and the `hero` panel backgrounds
are "a shade DARKER in after". In matched regions the statblock head band is unchanged
(67 px) and hero shows **zero** colour change at any of its 217 plugin nodes. The badge
narrowing (`.dse-pr__badge`, 51.25 → 43.19 px) is real — I reproduced it — but it lives in the
Power Roll block, not in the region §10 says the crop shows, which is the same mix-up the owner
already flagged. Captions must be re-derived from the shipped crops.

## LOW-3 (INFO-grade, pre-existing, but it invalidates the camera as ground truth for Steel)

The Obsidian the camera photographs reports **`Chrome/106.0.5249.199`** and
`CSS.supports('background','color-mix(in srgb, red 14%, blue)') === false`,
`CSS.supports('color','oklch(…)') === false` (`sc202-r6brev-vaultband.log`). The system
installer's Electron shell is 2022-era; Obsidian self-updates only the app asar. Consequences:

- Every Steel surface built with `color-mix()` falls back in the camera. The statblock head band
  is exactly this: the harness takes the `@supports` branch
  (`color-mix(in srgb, var(--dse-role) 40%, var(--dse-surface))`, `styles-source.css:9209-9218`),
  the vault takes the plain `linear-gradient(--dse-surface-raised, --dse-surface)` fallback.
  **That, not any token or any Obsidian rule, is the 47.9 % statblock residual.**
- Obsidian's own pinned 1.13.7 tokens that are `color-mix(in oklch, …)`
  (`--background-modifier-hover`, `--tag-background`, `--tag-border-color`) are invalid at
  use time in that build too.
- So "harness after == vault" cannot be evidenced with this camera for any `color-mix`/`oklch`
  surface, and the final ask should not claim it. Scott's own Obsidian (Insider 1.14.0 on a
  modern Electron) will look like the **harness**, not like the camera, for these surfaces.

Recommend the owner file this as its own ticket (camera Electron floor) and soften the final
ask's camera-parity language accordingly.

---

# Explicit verdicts on the three items the brief names

**Item 2 — the `vars.css` deviation: ACCEPTED IN PRINCIPLE, REJECTED AS IMPLEMENTED.**

- **(a) Does any faked token still win?** **Yes — 11 in dark, 8 in light, plus 2 hybrids**, enumerated
  above with the vault's own values beside them. The floor is a ceiling. The mechanism is
  specificity, not order, and the code, the comments and the report all assert the opposite.
- **(b) Is the chrome sweep's breakage a real dependency or a sweep bug?** **Both — the dependency
  is real, the diagnosis is wrong.** I reproduced it: strip every token declaration from
  `vars.css` and `assertChromeHostLeak` goes red (`CHROME HOST-LEAK VIOLATED`,
  `sc202-r6brev-varsdelete.log`). But it goes red *because that sweep never loads the real
  sheet* (MED-1), not because the harness needs a second copy of Obsidian's tokens. With the
  fakes still deleted and `sheet: '1'` added to the chrome and button navigations, **both gates
  are green again** (`sc202-r6brev-varsdelete-sheeton.log`). The genuine, irreducible part of
  the dependency is only the print/realprint path and the sweeps' own bare pass — a real reason
  to keep a floor, and no reason at all to let it outrank the sheet.
- **(c) What does the PRINT path read now?** The same 2026-07-10 fakes it has always read —
  unchanged by this round, which is why 0 of 260 frozen bytes moved. **That is acceptable until
  6c** and is correctly fenced. It becomes a defect the moment 6c re-points print at Obsidian's
  real print conditions, because the print path would then read Obsidian's real print rules
  through fake Obsidian tokens. Flag it in the 6c brief; it is not a 6b defect.

**Item 3 — the button/chrome sweeps: FINDING (MED-1).** Both still run against a page with no
sheet, no `.markdown-rendered` ancestor, `content-box`, and stale tokens — i.e. against a page
that no capture and no vault matches. The report's justification ("its own navigation never
requests `sheet=1`") explains why they were not made *tautological*; it does not address that
they now gate the wrong world. Measured live consequence is limited to `fontFamily`, so this is
MED, not HIGH — and the fix is one line per sweep, demonstrated green.

**Item 5 — the vacuous-`fontFamily` claim: CONFIRMED, and the honesty note the owner needs is
narrower than "font-family was unproven".** Reproduced on `742bcd9`
(`sc202-r6brev-vacuous.log`): running `injectRealHostCss`'s exact
`addStyleTag` + `document.head.prepend(el)` leaves `--font-text` and the computed `fontFamily`
of `td`, `input[type=number]` and `h3` **byte-identical** to the bare pass; moving that same
injected `<style>` to sit *after* the `vars.css` link changes all four immediately. Confirmed
fixed on `a8bc607` (`--font-text` now resolves to the real sheet's value — it is one of the
five "real sheet wins" tokens).

- **Which comparisons were unproven, and in which rounds:** `fontFamily` in `INPUT_PROPS`
  (added r1), `TABLE_CELL_PROPS` (r2) and `HEADING_PROPS` (r4). Those entries printed `OK`
  vacuously in **every** battery from round 1 through round 6a inclusive — r1, r2, r3, r4, r4
  fix, r5, r5 fix, r6a, r6a fix and all their reviews. `CODE_PROPS`'s `fontFamily` was equally
  vacuous then and is genuinely tested now (0 diffs under the corrected cascade), so leaving it
  in was the right call.
- **What was NOT unproven, and should be said plainly so the ask is not over-corrected:** the
  prepend order only broke *token-valued* comparisons. Obsidian's *rules* were still injected
  ahead of the plugin's own styles, which is the real vault's relative order, so every non-token
  leak the five families found and fixed stands. Where an Obsidian declaration read a token
  (`color: var(--text-normal)`, borders, backgrounds), a leak would still have been **detected**
  (plugin value vs Obsidian value) but **reported at a stale colour**.
- **The honest carry-forward:** that second class is *still* mis-valued today for the 11/8
  tokens of HIGH-1. Fixing HIGH-1 is what actually closes item 5, not the `fontFamily`
  exclusions.

---

# Moved-shot attribution — the answer to the brief's item 6

The report's two-cause classification **does not hold**. Complete, non-sampled attribution over
all 524 files (three full sweeps, `sc202-r6brev-cause-matrix.txt`), with per-property causes
measured on 41 fixture/scheme pairs:

- **Cause A — accepted `box-sizing`/`overflow-wrap` + the `.markdown-preview-view` wrapper**:
  182 of 256, sole cause of 2. Real, accepted, correctly recorded.
- **Cause B — token supersession**: **much smaller than claimed and half-broken.** Only 5 dark /
  5 light tokens actually flipped to the real value; the 11/8 the report lists as "corrected"
  did **not** (HIGH-1). The one flip with a layout consequence is `--list-indent` `2em` →
  `calc(0.5625em * 4)`.
- **Cause C — font stack**: `fontFamily` changes on every plugin node but is inert (bundled
  `Source Serif 4` wins in both harness and vault). Its only measurable effects are `ch`-unit
  and line-box crumbs — e.g. `span.dse-sb__sticky-stats` `margin-left` 7.797 → 7.484 px and
  `.dse-pr__badge` height 23.14 → 22.14 px, which is what turns `statblock--steel-dark` into a
  7.7 M-pixel diff (a 1 px reflow at the top of a 7,204 px document).
- **Cause D — genuinely un-re-grounded host properties: PRESENT, three of them** (HIGH-2):
  `p { margin-block }` (visible, sole cause of 2 shots), `img { max-width; image-rendering }`,
  `caret-color` (r2's own named deferral, never censused).

---

# Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/sc202-r6b-review.md`

Re-shot matched crops (overwritten at the brief's paths, 900 px wide, 9 distinct sha256):

```
e88034c78c2c76d631a3431afdafc3a8f858f7f8cc592986036507d1af01964d  sc202-r6b-statblock-before.png
17d9ac602493d101ed5e1c30907669917d9897d1c3af6fbebf653224b4db2e23  sc202-r6b-statblock-after.png
8178ba0234d22f9ab8c538b2cd9fec77fd0c70caf85ee50ee0860728a20b368b  sc202-r6b-statblock-vault.png
3bf02018af6af19cb890909848b020611820fdcdc12cd3939d97d983f2c7ebf5  sc202-r6b-hero-before.png
9d9e1bbafc8dcbba8c19832b04d8b7722b89d1bd449177359f984b69ecab83d9  sc202-r6b-hero-after.png
d89cb140ccd9f972097fd934a57287ba6af5261cff6f869449913a4d1db19e04  sc202-r6b-hero-vault.png
670a04d40225dd4ff249b6ef93d0209228f1977b7b7ef84b39e53c2e72ebf380  sc202-r6b-negotiation-before.png
38f98630fb64db4976dc31f205f7c9ee87ea0e56d58ecc5f24dd0e8b2c7e7695  sc202-r6b-negotiation-after.png
1002ff9188d30052a99c0fbab954e7254b9c31c1c61875967bb6cb7e5275055c  sc202-r6b-negotiation-vault.png
```

Stacked triptychs for eyeballing (before / after / vault, top to bottom):
`sc202-r6brev-{statblock,hero,negotiation}-triptych.png`.

Evidence logs (all in this directory): `sc202-r6brev-tsc.log`, `-lint.log`, `-jest.log`,
`-shots.log`, `-shots2.log`, `-freeze.log`, `-parity.log`, `-base-shots.log`,
`-base-allshots.sha256`, `-allshots-run1.sha256`, `-allshots-run2.sha256`, `-shadiff.txt`,
`-cause-matrix.txt`, `-v1-shots.log`, `-v1-allshots.sha256`, `-tokenwin.log`, `-vaultprobe.log`,
`-harnesstok.log`, `-attribution.log`, `-causeD.log`, `-causeD2.log`, `-pleak.log`,
`-pmargin-rule.log`, `-imgleak.log`, `-toggle.log`, `-toggle2.log`, `-btngap.log`,
`-vacuous.log`, `-varsdelete.log`, `-varsdelete-sheeton.log`, `-tokenfix.log`,
`-tokenfix-validated.log`, `-wherefix-sweeps.log`, `-wherefix-shots.log`,
`-wherefix-allshots.sha256`, `-vaultfonts.log`, `-vaultband.log`, `-low3b-symlink.log`,
`-low3b-symlink-base.log`, `-canfail-baseline.log`, `-canfail-{button,input,table,list,inline,checkbox}.log`.

Throw-away copies used for the mutations (nothing under the worktree was touched):
`…/scratchpad/r6a-base` (742bcd9), `…/scratchpad/r6b-v1` (empty-sheet variant),
`…/scratchpad/r6b-mut` (mutation playground), `…/scratchpad/probes` (probe scripts),
`…/scratchpad/crops` (native-resolution crop masters).

---

# Scoped re-review of `d0fed38` (`a8bc607..d0fed38`: `59cd766` harness + `d0fed38` prose)

Delta only, verified by execution. Tree left as found (`git status --porcelain` empty before
and after; `dist/obsidian-app.css` = `f612f1e8…`). All mutation work in throw-away scratchpad
copies. Logs prefixed `sc202-r6brerev-`.

## Executive summary (≤10 lines)

**APPROVE the code — 0 HIGH / 1 MED / 4 LOW, all of them artifact/report, none needing a code
fix round.** HIGH-1 CLOSED: my own enumeration of all 46 tokens on `d0fed38` → **fake-wins
11 dark / 8 light → 0/0, hybrids 2 → 0**, floor intact with the sheet off, **0 of 260
print/realprint bytes moved**, `freeze OK (252/252 …)`. HIGH-2 CLOSED: `prose host-leak OK
(99 bare <p> [198] + 9 <img> [18] + caret-color at 33 plugin roots [66] × dark/light)`,
can-fail reproduces the exact leaks I found (`party|p71` 13.6→16px; `initiative|img0`
`max-width` and `image-rendering`; caret-color). MED-1, MED-2, LOW-1 all CLOSED by execution
(emptied sheet now aborts with `OBSIDIAN APP.CSS NOT APPLIED`; `boxSizing→content-box`
perturbation fires 60 `ABSOLUTE:` problems). **RULING on the `party` residual: (a) — the
harness now showing the true cascade, record it, no defect** (proof below: with the sheet
emptied, `d0fed38`'s `party` bytes are **byte-identical** to `742bcd9`). The implementer's
*attribution* ("`--interactive-accent` hex→hsl on the Renown stepper's focus ring") is
**wrong** and should not go in the ticket. MED-5 (new): `sc202-r6b-statblock-after.png` is
**not reproducible from `d0fed38`** — re-shoot before it goes in front of Scott (replacement
supplied). Battery: jest **3830/1sk/200-of-201**; shots **524/0** with **ten** gate lines;
`freeze OK (252/252 …)`; 8/8 widening; parity **0/0/16**, DECLARED set unchanged.

## Battery on `d0fed38` (verbatim)

- `npm run tsc` clean, exit 0 (`sc202-r6brerev-tsc.log`); `npm run lint` clean, exit 0.
- `npx jest` — `Test Suites: 1 skipped, 200 passed, 200 of 201 total` /
  `Tests:       1 skipped, 3830 passed, 3831 total` (`sc202-r6brerev-jest.log`). Matches the
  implementer's count; the new suite is `test/dom/theme/proseHostRegrounding.test.ts`.
- `npm run shots` — **524 `ok`, 0 `FAIL`**; provenance `host sheet: pinned-cache, Obsidian
  1.13.7, sha256 f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41`; one
  expected `OBSIDIAN APP.CSS PIN DRIFT` line; **ten** gate lines (chrome, host-copy pin,
  button, input, table, list, inline, token-override, checkbox, **prose**).
  `sc202-r6brerev-shots.log`.
- `check-freeze.sh` → `freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin
  + steel-realprint since SC-170)`; 8/8 widening hashes `OK`.
- sha256 of all 524 PNGs vs my `sc202-r6brev-allshots-run1.sha256`: **0 of 260
  print/realprint moved**; **187 screen shots moved vs `a8bc607`**, **258 vs `742bcd9`**, and
  **6 screen shots returned to `742bcd9`'s exact bytes**.
- `npm run parity` LAST — `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`,
  exit 0; the DECLARED block is byte-identical to the `a8bc607` run.

## Per-finding verdicts

**HIGH-1 — CLOSED.** `visual-harness/vars.css:77,100` now `:where(body.theme-dark|light)`.
Re-ran my own token enumeration against the shipped page (`sc202-r6brerev-tokenwin.log`, all
46 declarations, both schemes): **dark — 28 identical / 18 real-sheet-wins / 0 fake-wins /
0 hybrids; light — 31 / 15 / 0 / 0** (was 11 and 8 fake-wins + 2 hybrids each). With the sheet
off the fallback still supplies every token unchanged, and `freeze OK (252/252)` with 0 of 260
print bytes moved proves the print path is untouched.

**HIGH-2 — CLOSED.** New sixth family, and it can-fail. Deleting the whole `SC-202 r6b fix
round — PROSE …` block (3,620 chars) and re-running the sweeps gives
`PROSE HOST-LEAK VIOLATED` naming exactly the leaks I reported:
`dark|p|party|p71: … marginBlockStart — "13.6px" without the host, "16px" with it`,
`dark|img|initiative|img0: … maxWidth — "none" … "100%" with it` and
`… imageRendering — "auto" … "-webkit-optimize-contrast" with it`, plus caret-color at every
plugin root (18 `|img|` lines, 60-line print cap). `sc202-r6brerev-canfail-prose.log`.

**MED-1 — CLOSED (with LOW-2b below).** `shoot.mjs:984` and `:1563` now carry `sheet: '1'`,
so both sweeps run under the real `.markdown-preview-view.markdown-rendered` wrapper and
therefore under `border-box`/`break-word` and the real tokens — the box model a capture
actually uses. Both then call `setHostSheetEnabled(page, false)` and keep their own
hand-modelled `OBSIDIAN_HOST_BUTTON_CSS` subject, which is correct: their invariance is about
that model, not about the real sheet. Both still can-fail — I re-proved the button family in
the first pass (`sc202-r6brev-canfail-button.log`) and `assertChromeHostLeak` reddens the
moment its dependency is disturbed (`sc202-r6brev-varsdelete.log` → `CHROME HOST-LEAK
VIOLATED`), while `sc202-r6brev-varsdelete-sheeton.log` shows both green under the new
formulation.

**MED-2 — CLOSED.** Re-ran my emptied-sheet probe on `d0fed38`
(`sc202-r6brerev-med2-emptysheet.log`): the run now **aborts, exit 1**, with
`OBSIDIAN APP.CSS NOT APPLIED — setHostSheetEnabled(page, true) but --list-indent reads
"2em", expected the real sheet's own "calc(0.5625em * 4)"` plus the r6a remedy — where before
every sweep printed `OK`. Both directions are asserted (`…STILL APPLIED` guards the bare
sample), and the toggle waits for `link.sheet != null` in a genuine separate round-trip, which
is exactly the failure mode I measured in the first pass. `entry.ts`'s
`applyRealObsidianCascade` is now `async` and awaits the link's `load`/`error` (plus a poll and
a 3 s ceiling) — a real fix for a race that reached ordinary captures, not just the sweeps.

**LOW-1 — CLOSED.** `boxSizing`/`overflowWrap` are out of the relative list and pinned
absolutely; the gate line now reads `… 170 cells' box-sizing/overflow-wrap ABSOLUTE-asserted
border-box/break-word — SC-202 r6b fix round LOW-1, accepted Obsidian truth pinned, not
compared`. Perturbing `vars.css` to `content-box` fires 60 `ABSOLUTE: boxSizing is
"content-box", expected "border-box"` problems and exits 1 (`sc202-r6brerev-canfail-low1.log`).

**MED-3 / MED-4 / LOW-2 — closed in substance; three artifact defects below.**

## RULING — the `party--steel-*` residual (the item the owner asked me to decide)

**Verdict: (a) — the harness now showing the true cascade. Acceptable; record it. Not a fake
still winning, not a leak. The implementer's stated attribution is wrong and must not be
repeated on the ticket.**

Measured, in this order:

1. **Magnitude.** `party--steel-dark` 384 px differ from `742bcd9` (0.03 % of 1,665,920);
   `party--steel-light` **19,860** px (1.19 %) — the light figure is 52× the dark one and was
   not reported. Max per-channel amplitude 23/255 (dark), 19/255 (light); mean 2.6 and 1.0.
   Deterministic: two independent full sweeps of `d0fed38` produced byte-identical `party`
   shots.
2. **It is entirely Obsidian's real sheet.** With `dist/obsidian-app.css` replaced by an empty
   file and everything else at `d0fed38`, **`party--steel-dark` and `--steel-light` are
   byte-identical to `742bcd9` (AE 0 and 0)**. So the `<p>` re-grounding is exactly right and
   complete, and nothing the fix round wrote contributes a pixel.
3. **It is not the focus ring and not `--interactive-accent`.** The differing pixels are
   diffuse (bbox = the whole image), not a ring; a static capture never paints
   `:focus-visible`; and a full computed-style dump of the Renown stepper's `<input>` and its
   `<button>` (`sc202-r6brerev-stepper.log`) shows **identical geometry, border widths, border
   colours, backgrounds, box-shadows and colours** — the only deltas are `-webkit-app-region`,
   `font-family`'s unusable tail, `overflow-wrap`, `scrollbar-color`, `tab-size`,
   `unicode-bidi`, `user-select`, `-webkit-tap-highlight-color`. `--interactive-accent`
   appears in no computed property of that region.
4. **Roughly 171 of the 384 dark pixels ARE the token floor showing the true value.** Forcing
   the theme-block declarations to win again with `!important` drops dark 384 → 213 and leaves
   light unchanged; the affected pixels are the shot's outer edge, where the page ground moves
   `#1e1e1e` → `#1C1C1C` — i.e. `--background-primary` now correctly reading the vault's own
   value. Pure category (a).
5. **The remainder is a repaint artefact of the page now being laid out as a real reading
   view, with no plugin-visible property behind it.** Ruled out by direct experiment, each
   re-shot and re-measured: `text-rendering` (no change), `unicode-bidi` (no change), all
   `vars.css` tokens forced to win incl. `--font-text`/`--font-monospace` (no change beyond
   step 4), the wrapper's scroll-container-ness (no change), and every `@font-face` app.css
   adds (no change). Delta-debugging the sheet by omitting slices localises it to app.css
   chunks **251–271**, whose load-bearing members are `html, body { margin:0; padding:0;
   height:100%; width:100% }`, `body { contain: strict; overflow: clip; font-size: 15px;
   line-height: 19.5px }` and the `.markdown-preview-view` reading-view box
   (`position: relative; overflow: auto; scrollbar-gutter: stable; padding: 32px`) — the page's
   own layout box, which a real vault has always had and the harness never did
   (`sc202-r6brerev-wrapper.log`). Sub-pixel raster consequence, no plugin DOM property behind
   it, therefore not a leak by this ticket's own definition.
6. **The fix brief's acceptance test was unachievable by construction.** "`party--steel-*`
   must return to their `742bcd9` bytes" can only hold if turning Obsidian's sheet on changed
   nothing about the page — which is the opposite of the round's purpose. The correct
   isolation test for the `<p>` half is the one in step 2, and it **passes byte-for-byte**.
   Use that as the acceptance record.

## New / residual findings

**MED-5 (artifact, blocks the crop going to Scott) — `sc202-r6b-statblock-after.png` is not
reproducible from `d0fed38`.** Re-shooting it myself at the identical crop box (`.dse-head`,
`#mount` width-matched to 1020 CSS px, native 2×, downscaled to 900) gives an image that
differs from the shipped file by **42,701 px (≈4.6 % of the region)** — the shipped band reads
a shade LIGHTER than the tree renders. It is not the pre-fix token state either (rendering
`d0fed38` with the old `(0,1,1)` ceiling restored differs by 42,712 — no closer). The shipped
caption is inconsistent with the tree in the same direction: it says "Before → after: **46.1 %**
of pixels differ" where I measure **152 px = 0.03 %** at that crop box (`hero` and
`negotiation` after-crops, by contrast, are byte-identical to my own re-shoots, AE 0).
**Fix:** re-shoot that one crop from the committed tree and re-derive its caption. A
reproducible replacement is already written to
`sc202-r6brerev-statblock-after-reproducible.png` (sha256 `bddd573b37de36a9…`) — drop it in if
the owner prefers not to spend a round on it.

**LOW-2a (report numbers) — the fix round's own screen-movement figure is wrong.** §MED-3's
correction says "**187 of 524 screen shots** now differ from `742bcd9` … smaller than
`a8bc607`'s own 256". 187 is the delta versus **`a8bc607`**; versus `742bcd9` it is **258**,
which is *more* than 256, not fewer, and exactly **6** screen shots returned to `742bcd9`'s
bytes. The sentence compares two different reference points and draws the opposite conclusion.

**LOW-2b (gate coverage) — the two hand-model sweeps never exercise the MED-2 sentinel.**
`assertChromeHostLeak` and `assertBtnHostLeak` call `setHostSheetEnabled(page, false)` only;
the sentinel's loud branch is the `true` one. With an emptied `dist/obsidian-app.css` both
still printed `OK` before the first sentinel-guarded sweep aborted the run
(`sc202-r6brerev-med2-emptysheet.log`). Harmless today — their subject is the hand-modelled
copy and the box model they now depend on comes from the DOM wrapper, not from the sheet — but
one `setHostSheetEnabled(page, true)` (or a bare `assertSheetLive(page)`) right after their
navigation would close it.

**LOW-2c (false comment) — `vars.css`'s specificity arithmetic is wrong.** The new header says
`:where()` drops the blocks to "(0,1,0)/(0,1,0) — a TRUE tie with app.css's own
`.theme-dark`/`.theme-light`… (`:where()` itself is (0,0,0); the class selector inside it is
what remains)". `:where()` zeroes **everything inside it**, so `:where(body.theme-dark)` is
**(0,0,0)** — it does not tie app.css's `.theme-dark` (0,1,0), it loses to it outright, and it
also loses to any `body`-level (0,0,1) declaration from a later sheet. The *behaviour* is what
the fix intended and what I measured (0 fake-wins), so this is a comment defect, not a code
defect — but it is the same class of thing r4 MED-5 was made a fix for, and the next reader
will reason from it.

**LOW-2d (census completeness) — the inherited-property census stopped at `caret-color`.** The
fix brief asked for "anything else `.markdown-rendered`/`.markdown-preview-view` sets that
INHERITS into plugin DOM … measure, don't assume". Measured at `#mount` under the sheet, six
further inherited host properties reach plugin DOM and are not re-grounded or recorded:
`text-rendering` (`auto → optimizelegibility`), `tab-size` (`8 → 4`), `user-select`
(`auto → text/none`), `-webkit-tap-highlight-color`, `scrollbar-color`, `-webkit-app-region`.
I measured their cost: re-grounding all six moves **0 of 524 shots**
(`sc202-r6brerev-census-shots.log`), so this is genuinely non-blocking — but it should be
recorded as "enumerated, inert by measurement" rather than left unmentioned, since
`text-rendering` in particular is a paint property and the round's own comment claims the
census is complete.

**LOW-2e (report hygiene) — §7's original text still asserts the retracted claims.** MED-3 was
closed by appending "corrected cause table (replaces §7 above)" rather than editing §7, so a
reader still meets "This is the DOMINANT cause across the 131" and the `rgb(30,36,39) →
rgb(48,53,56)` sample before reaching the retraction ~250 lines later. Honest, but the owner's
brief said delete; at minimum §7 should carry an inline pointer at the top.

## Artifacts (this re-review)

`sc202-r6brerev-{tsc,lint,jest,shots,freeze,parity}.log`,
`sc202-r6brerev-allshots.sha256`, `sc202-r6brerev-canfail-{baseline,prose,low1}.log`,
`sc202-r6brerev-med2-emptysheet.log`, `sc202-r6brerev-tokenwin.log`,
`sc202-r6brerev-partyresid.log`, `sc202-r6brerev-stepper.log`,
`sc202-r6brerev-wrapper.log`, `sc202-r6brerev-matchrules.log`,
`sc202-r6brerev-census-shots.log`, `sc202-r6brerev-census-allshots.sha256`,
`sc202-r6brerev-textrendering-probe.log`,
`sc202-r6brerev-statblock-after-reproducible.png`.
