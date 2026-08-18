# SC-170 — real `@media print` gets the print scheme (implementation report)

**Status:** complete, committed.
**Worktree / branch / sha:** `worktrees/sc170-real-print/draw-steel-elements`,
`sc170-real-print`, **`6f5f3f58f965f546ba4385fa6af1aa1d6ada7f7e`** (off develop `478f991`).
Superproject pointer left **unstaged**.
**Freeze baseline:** not touched (67 lines, unchanged). Widening prepared, not applied.

---

## 1. Reproduction (step 1) — and it is worse than the ticket says

Playwright probe, `emulateMedia({ media: 'print' })`, no `data-dse-print` attribute, four
elements (`statblock`, `feature`, `characteristics`, `hero`), compared against the twin.
Raw matrix: `.superpowers/sdd/sc170/probe/base-computed.json`; PNGs
`base-<el>--{screen,twin,realprint}.png` alongside.

Under real print at base, every Steel-redefined token survived (values from the dark
scheme because the harness page is dark; a light vault gets the light Steel values):

| | twin | real print (base) |
|---|---|---|
| `--dse-card-bg` | `none` | `linear-gradient(160deg, #232a2e, #181c1f)` |
| `--dse-border` | `#ccc` | `rgba(220,226,230,0.12)` |
| `--dse-radius` | `0` | `0.4em` |
| `--dse-bevel` | `none` | `inset 0 1px 0 rgba(255,255,255,.07)` |
| `--dse-surface` | `#fff` | `#1a1e21` |
| `--dse-fg` | `#000` | `rgba(220,226,230,0.88)` |
| `.dse-hero` box-shadow | `none` | `…inset, rgba(0,0,0,.34) 0 8px 22px` |
| `.dse-hero` border / radius / pad | `0px none` / `0px` / `0px` | `1px solid` / `6.4px` / `6.4px` |

### The mechanism, exactly

Three blocks declare these tokens on an element root:

| selector | specificity | line |
|---|---|---|
| `:is([data-dse-element], .dse-modal)[data-dse-theme="steel"]` | (0,2,0) | 3780 |
| `.theme-light :is([data-dse-element], .dse-modal)[data-dse-theme="steel"]` | **(0,3,0)** | 8429 |
| `@media print { [data-dse-element] }` | **(0,1,0)** | 9245 |
| `[data-dse-element][data-dse-print="on"]` (twin) | (0,2,0) | ~9290 |

The `@media print` block loses to both Steel blocks, so real print keeps the screen
palette; only base-only tokens (`--dse-pad` 16px → 6.4px) neutralize. The twin at (0,2,0)
beats the DARK block on source order, which is why it looked correct.

**Second defect, not in the ticket, found here: the PREVIEW TWIN is broken too, in a
light-theme vault.** (0,2,0) also loses to the `.theme-light` block (0,3,0). Measured:

```
light twin  --dse-surface #f6f8f8 · --dse-card-bg linear-gradient(…) · --dse-border #c8cdd0 · --dse-fg #2c2e30
dark  twin  --dse-surface #fff     · --dse-card-bg none               · --dse-border #ccc     · --dse-fg #000
```

Invisible to the gate because the frozen `*--steel-print.png` class is captured over the
dark scheme only. This matters more than it sounds: **Obsidian's PDF exporter forces
`theme-light`** (see §3), so the light arm is the one that actually ships to paper.

---

## 2. The fix (step 2) — two parts, one source of truth

Both were required; neither subsumes the other.

### (a) Specificity — `styles-source.css`

All four print-surface selectors padded to **(0,4,0)** by repeating an attribute the
matched element is guaranteed to carry, with a block comment carrying the arithmetic:

| surface | before | after |
|---|---|---|
| neutral `@media print` | `[data-dse-element]` | `[data-dse-element]×4` |
| neutral twin | `[data-dse-element][data-dse-print="on"]` | `…[data-dse-print="on"]×3` |
| Steel act `@media print` | `:is(…)[data-dse-theme="steel"]` | `+ [data-dse-theme]×2` |
| Steel act twin | `:is(…)[data-dse-theme="steel"][data-dse-print="on"]` | `+ [data-dse-print]` |

No declaration was duplicated — only selectors changed. **`!important` was rejected on
purpose**: the font preferences stamp inline custom properties on the root and the prefs
catalog promises they apply "everywhere, including print and export", which an `!important`
print value would override. That reasoning is a test
(`no print value block wins by !important`).

### (b) The `:not([data-dse-print="on"])` guard — `src/framework/printMedia.ts` (new)

(a) alone cannot fix paper. ~297 Steel rules carry
`[data-dse-theme='steel']:not([data-dse-print="on"])`, and **a media query cannot make an
attribute selector false**, so the Steel *structure* rules apply on paper regardless of
token values — including literals the tokens do not reach (the `0 8px 22px rgba(0,0,0,.34)`
lift is hard-coded next to `var(--dse-bevel)`).

So real print is made to **use the twin**: `watchPrintMedia(root, owner)` stamps
`data-dse-print="on"` for the duration of print media, and paper and preview then resolve
through one identical set of rules. Wired in `pipeline.ts` immediately after
`applyPrefOverrides` (registered last ⇒ its stamp survives while printing).

- Listens on `rootEl.ownerDocument.defaultView` — the root's OWN window, so popouts (and
  the exporter's popout, §3) work; D3 §2.5's per-root discipline.
- `beforeprint`/`afterprint` (via `owner.registerDomEvent`) + `matchMedia('print')` change,
  plus a `matches` check at mount for a root created under an already-active print medium.
- **Restores** the previous attribute value rather than removing it — `data-dse-print` is
  also the `printPreview` preference's reflected attribute and can be pinned per block.

**Shapes considered and rejected.** (i) A second copy of the print declarations under
`@media print` — two sources of truth for "what print looks like", guaranteed to drift; the
brief forbids it and it is the wrong answer anyway. (ii) A generic ornament-killer under
`@media print` (`box-shadow:none !important` etc.) — cheap, but it lands *near* the twin,
not *on* it (a 1px `#ccc` frame and `0.4em` padding survive where the twin has none), so
the preview would still be lying, just less. (iii) Wrapping the Steel corpus in
`@media screen` — the only other way to falsify the guard, but it means restructuring 9650
interleaved lines and putting every Steel byte back in play for a mechanical win. (b) is
one 85-line module and reaches exact parity.

---

## 3. Ground truth on real Obsidian (step 4)

Own Xvfb display `:77`, scratch `--user-data-dir` (`/tmp/claude-1000/dse-sc170-probe/udd`),
CDP port 9233, real Obsidian **1.13.7** against `demo-vault`. `:1` never touched;
`obsidian-shots` / `docs-shots` never run.

### What Obsidian's exporter actually does (decompiled from the app asar, then confirmed live)

```js
win = window.open('about:blank','_blank','popup,hide=true')   // a hidden POPOUT window
win.document.body: theme-dark REMOVED, theme-light ADDED       // always LIGHT
r = win.document.body.createDiv('print'); this.print(r, …)     // renders the note
ipc 'print-to-pdf' → main: sender.printToPDF(opts) → fs.writeFile
```

Three facts this settles: the print DOM is a **fresh render** (so our pipeline, and the
watcher, run on it); it is in a **second window** (so per-root window binding is required,
not optional); and it is **always light chrome** (so the `.theme-light` specificity loss in
§1 is the shipping case, not a corner).

**Do the print signals fire?** Yes — measured directly:
`beforeprint → matchMedia('print') change=true → afterprint → change=false`, in the
renderer that owns the element roots (`print-probe-obsidian.mjs`, base build). Option (b)
is therefore viable, which is what decided the fix shape.

### Before/after, in the product

Driven through Obsidian's own `PdfExportModal` — the export command opens it, the probe
reaches the instance by patching the base `Modal.prototype.open`, and calls its internal
`testPrint()`, which builds the identical `div.print` via the same `this.print(...)`, under
the same forced `theme-light`. Then Electron `printToPDF` (the exporter's own call).

| | before (`478f991` build) | after (`6f5f3f5` build) |
|---|---|---|
| `data-dse-print` on root | `off` | **`on`** |
| `--dse-card-bg` | `linear-gradient(160deg, #f…` | **`none`** |
| `--dse-border` / `--dse-radius` / `--dse-bevel` | `#c8cdd0` / `0.4em` / `inset 0 1px 0 …` | **`#ccc` / `0` / `none`** |
| `--dse-surface` / `--dse-fg` | `#f6f8f8` / `#2c2e30` | **`#fff` / `#000`** |
| `.dse-sb` bg-image / shadow / radius / border | gradient / inset+drop / `10.4px` / `1px solid #c8cdd0` | **`none` / `none` / `0px` / `1px solid #ccc`** |
| print-DOM height | 3694px | **2079px** |

And the full lifecycle inside the real `printToPDF` call
(`evidence/after-chars-export-trace.json`, `plateDuringPrint`):

```
beforeprint  → printAttr "on",  card-bg none,        radius 0,     fg #000
mql:true     → printAttr "on",  card-bg none
afterprint   → printAttr "off", card-bg gradient,    radius 0.4em, fg #2c2e30   ← restored
```

**Verdict: PASS.** Evidence:

- `evidence/sc170-pdf-statblock-before-after.png` — page 2 of a **real Obsidian PDF**,
  before | after. Rasterized with `pdftoppm` from `before-pdf2-export.pdf` /
  `after-pdf2-export.pdf` (both kept).
- `evidence/sc170-realprint-obsidian-before-after.png` — the same DOM under CDP-emulated
  print media in the live app, before | after.
- `evidence/{before,after}-chars-export.pdf` + traces — the small-note pair that carries
  the beforeprint/afterprint trace above.
- `evidence/sc170-harness-{statblock,hero}--steel-realprint.png` — the new harness class.

**One environment limit, recorded honestly:** Electron `printToPDF` **hangs the browser
process** under Xvfb on a tall print document if no `pageRanges` is given (reproduced 3×;
every CDP page target goes unresponsive). Passing `pageRanges` avoids it, and CDP's
`Page.printToPDF` is not implemented by Electron. This is an Xvfb/compositor limit of the
rig, not plugin behaviour — the PDFs above were produced with `pageRanges: '1-3'`.

---

## 4. Harness coverage (step 3)

`visual-harness/shoot.mjs`:

- **4th combo `{ realprint: true }` → `<id>--steel-realprint.png`.** No attribute;
  `page.emulateMedia({ media: 'print' })` is set **before** `goto` so a root mounted under
  print media sees it at mount. `--bg=` narrowing excludes it, like the twin. 203 → **270**
  shots (67 new), 0 ERROR.
- **`assertPrintTwinParity()`** after the sweep: for every capture id with both files, the
  two PNGs must be **byte-identical**; mismatches are named and the run exits 1.

**Byte-identical parity was achievable and is what shipped** — no computed-style fallback
needed. It works because the twin does not merely share the print *values*: the print
*rules* (force-open collapsibles, hidden inert chrome, `break-inside`, `print-color-adjust`)
are already mirrored for the attribute surface, so nothing is left that only `@media print`
can express. Result, both runs: `print-twin parity OK (67 capture ids byte-identical:
preview twin === real print)`.

That assertion is the real gate. Freezing `*--steel-realprint.png` pins the bytes; the
parity check catches a leak even in a class nobody re-photographs.

### Widening (orchestrator applies; I did not touch the baseline)

`.superpowers/sdd/sc170/widening.txt` — **67 lines**, `<sha256>  <filename>`, ready to
append. Verified:

- **Deterministic across 2 full `npm run shots` runs** — sorted diff empty.
- **Additions-only** — 0 of the 67 names exist in the baseline (67 → 134).
- **Every new hash equals the frozen hash of its `--steel-print` twin**, all 67. That is
  the parity invariant expressed in the baseline itself: after applying, the file holds 67
  pairs of identical hashes under different names, and any future divergence breaks both
  the freeze check and the in-run assertion.

---

## 5. Battery at `6f5f3f5`

| gate | result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2803 passed / 1 skipped / 169 suites** (base 2790+1/168 → **+13 tests, +1 suite**) |
| `npm run shots` | **270 / 0 FAIL** (203 + 67 realprint) |
| print-twin parity (in-run) | **67/67 byte-identical** |
| `check-freeze.sh` | **`freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0** |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 |

`obsidian-shots` / `docs-shots` not run (out of bounds; the Obsidian work was done with a
purpose-built probe on my own display).

**The 67 twin lines did not move** (step 5) — verified before the widening was written, and
again after the second sweep.

### New tests, all can-fail proven

- `test/dom/framework/print-media.test.ts` (7): matchMedia change stamps/unstamps;
  `beforeprint`/`afterprint` do the same; the `printPreview` value is **restored**, not
  clobbered; a root mounted under an already-active print medium is stamped at once;
  double-enter keeps the saved value; `owner.unload()` detaches every listener; no
  `matchMedia` is a no-op. *Proof:* commenting out the mount-time `mql.matches` check
  reddens exactly one case (`1 failed, 6 passed`).
- `test/dom/framework/theme-print.test.ts` (+6): parses the real sheet, computes
  specificity, and asserts each of the four print selectors outranks **both** Steel token
  blocks; pins the two Steel blocks at (0,2,0)/(0,3,0) so the comparison cannot go vacuous;
  forbids `!important` in the print blocks. *Proof:* dropping two repeats from the neutral
  `@media print` selector reddens 3 tests.
- `token-coverage.test.ts` / `steelTypography.test.ts`: their sheet-parsing regexes were
  updated for the padded selectors (they hard-matched the old literals).

---

## 6. Docs

- `docs/advanced-usage.md` → "Print and PDF export": the preview is what Export to PDF
  produces — same layout, so the preview is a proof, not an approximation — with a one-line
  note that they could disagree before 7.0.0.
- `visual-harness/README.md`: the two print classes, why they differ, and the byte-parity
  assertion.
- `CHANGELOG.md` → `## 7.0.0 (unreleased)`: one `[BUGFIX]` bullet in user language, naming
  the light-vault case.

---

## 7. Concerns / follow-ups for the orchestrator

1. **The twin was wrong in light vaults too** (§1). Fixed here as part of the same
   specificity change, and it moves **zero** frozen bytes (the frozen class is dark-only).
   Worth calling out in review because it widens the blast radius beyond the ticket title —
   anyone who used the print preview in a light vault saw a slightly wrong preview.
2. **The freeze baseline doubles** (67 → 134) if the widening is applied. Defensible — real
   print is the surface that ships, the twin was a proxy for it — but it is the largest
   single widening to date. A cheaper variant exists (freeze only the realprint class and
   drop the twin lines, since they are provably identical); I did **not** do that, because
   retiring frozen lines is a separate baseline operation with its own rules.
3. **The specificity padding is ugly on purpose.** Four selectors repeat an attribute. It is
   commented at length in the sheet and asserted arithmetically in jest, but a reviewer who
   dislikes the idiom should know the alternatives were `!important` (breaks the documented
   font-preference behaviour) and cascade layers (a whole-sheet restructure).
4. **`.dse-modal` is still outside the neutral print block** on both surfaces (it always
   was). Modals do not print, so this is deliberate minimalism, not an oversight — but if
   anyone ever prints a modal, that block is unscoped for it.
5. **Xvfb + Electron `printToPDF` needs `pageRanges`** or it hangs the browser process
   (§3). If a future ticket automates PDF capture, put that in the harness doc — it cost
   three dead runs here.
6. The `@media print`-only *rules* (rules 3-5) and their twin copies are still two literal
   copies of the same declarations in the sheet. Not touched (out of scope, and jest pins
   them), but that duplication is the next thing that will drift.
# SC-170 — adversarial review (independent, executing)

**Verdict: FIX ROUND** — one blocking defect (the branch does not compose with SC-160: the
post-rebase `npm run shots` **fails**, exit 1), plus two medium findings about the strength
of the guards and one stale deliverable (the widening is 5 lines short of the current
baseline). The *substance* of the fix — diagnosis, CSS specificity padding, the
`watchPrintMedia` module, the real-Obsidian outcome — is correct and independently
reproduced. Everything blocking is mechanical.

Reviewed: `worktrees/sc170-real-print/draw-steel-elements`, `6f5f3f5` off `478f991`,
**rebased by this review onto develop `c676d58` → new tip `fce4b75`** (single commit,
one trivial CHANGELOG conflict resolved by keeping both bullets). Worktree left clean at
`fce4b75`; freeze baseline **not touched** (still 72 lines,
md5 `91f68452658b28c3f90e0de0cd2c0663`).

---

## Battery, measured (not quoted)

| Gate | Pre-rebase (`6f5f3f5`) | Post-rebase (`fce4b75`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | **2803 passed / 1 skipped / 169 suites** | **2834 passed / 1 skipped / 170 suites** (run 1 of 2 had ONE unrelated flake — below) |
| `npm run shots` | **270 ok / 0 FAIL** | **290 ok / 0 FAIL** |
| in-run print-twin parity | **OK, 67/67 byte-identical** | **VIOLATED — 5/72** ⛔ (fixed by a one-line harness change → OK 72/72) |
| `check-freeze.sh` | `67/72 producible OK, 5 missing, 0 mismatches`, exit 0 | **`freeze OK (72/72 …)`, exit 0** |
| `npm run parity` | 0 gaps / 0 undeclared / 16 declared | 0 gaps / 0 undeclared / 16 declared |

Jest flake, recorded so it isn't mistaken for a regression: the first post-rebase full run
reported `1 failed` — `test/dom/framework/sidebarEncounterHandoff.test.ts › the encounter
block persists the id it minted` (assertion failure, not a timeout). It passes in isolation
(2×) and the full suite re-run is fully green (2834/0). Surface is SC-153's, untouched by
this branch. Not attributable to SC-170; worth a FOLLOWUPS note as an intermittent.

---

## Claim-by-claim

### 1. Diagnosis — REPRODUCED, including the bonus light-twin defect ✅

Own Playwright probe against a **base (`478f991`) build** in a scratch tree, twin vs
`emulateMedia({media:'print'})`, both schemes:

```
BASE statblock bg=dark   twin --dse-card-bg none            | REAL PRINT linear-gradient(160deg,#232a2e,#181c1f)
                         twin --dse-border  #ccc            | REAL PRINT rgba(220,226,230,0.12)
                         twin --dse-radius  0               | REAL PRINT 0.4em
                         twin .dse-sb box-shadow none       | REAL PRINT …inset, rgba(0,0,0,.36) 0 10px 26px
BASE statblock bg=light  twin --dse-card-bg linear-gradient(160deg,#ffffff,#eef1f1)   ← the TWIN is wrong
                         twin --dse-surface #f6f8f8 · --dse-fg #2c2e30 · --dse-border #c8cdd0
                         twin .dse-sb box-shadow  rgba(255,255,255,.8) inset, rgba(0,0,0,.08) 0 4px 12px
```

Both halves of the report's §1 hold: real print kept the whole Steel plate, and the preview
twin was **also** wrong in a light vault (only `--dse-radius` neutralized there). Since
Obsidian's exporter forces `theme-light`, the light arm is the shipping arm.

Rule-level audit (live, on the branch, statblock root, both schemes, print media): the ONLY
token-declaring rules that match an element root are

```
rank 400  @media print  [data-dse-element]×4                                      (46 decls)
rank 400  —             [data-dse-element][data-dse-print=on]×3                   (47 decls)
rank 400  @media print  :is(…)[data-dse-theme=steel][data-dse-theme]×2            (7 decls)
rank 400  —             :is(…)[data-dse-theme=steel][data-dse-print=on][data-dse-print] (7)
rank 300  —             .theme-light :is(…)[data-dse-theme=steel]                 (34 decls)
rank 200  —             :is(…)[data-dse-theme=steel]                              (68 decls)
rank 100  —             :is(…)                                                    (1 decl)
```

So: the arithmetic is right, the four print blocks are the top rank, and **no other rule
above (0,4,0) declares a token on an element root**. Claim 2's "nothing higher leaks"
verified by enumeration, not by grep.

`!important` rejection verified behaviourally, not just by reading: with
`prefs=fontTitle:Georgia,fontControls:Arial`, computed `--dse-font-title` /
`--dse-font-controls` are the chosen stacks **under real print media** as well as on screen.
The catalog's "applies everywhere, including print and export" survives. Correct call.

### 3. `watchPrintMedia` — behaviour verified in a real browser ✅

Probe over the harness (32 roots at once, gallery page), reading the attribute after each
media flip (with a settle delay — without one you read one step stale and it *looks* broken;
that was my probe's race, not the plugin's):

| scenario | at mount | media=print | back to screen | print again | screen again |
|---|---|---|---|---|---|
| gallery, `printPreview` OFF | 32× `off` | 32× **`on`** | 32× `off` | `on` | `off` |
| gallery, `printPreview` ON | 32× `on` | 32× `on` | 32× **`on`** (restored, not removed) | `on` | `on` |
| statblock mounted UNDER print, pref ON | `on` | `on` | `on` | `on` | `on` |
| statblock mounted UNDER print, pref OFF | **`on`** (mount-time check works) | `on` | **`off`** | `on` | `off` |
| navigate (unmount) during print | — | fresh root `on` | `off` | — | — |

All 32 roots stamp and restore independently; the `printPreview` value is restored, never
clobbered; a root mounted under an already-active print medium is stamped at mount; leaving
print after an unmount/remount leaves no dangling state.

Wiring: `watchPrintMedia(root, view)` sits in `ElementPipeline.run` after
`applyPrefOverrides`, which is the ONE place any element root is created —
`RefUnwrapView` re-stamps `data-dse-element` on that same root (it does not make a second
one), the sidebar mounts through `pipeline.run` and only `onUpdate`s afterwards, and
`SettingsPreview` uses the real pipeline. So sidebar- and canvas-hosted roots do get the
watcher; both are harmless (neither is in the exported DOM, and Obsidian hides the sidebar
when printing the window).

One gap worth knowing (LOW): the call is inside the `try` **after** `prepareModel`, so
**error cards never get the watcher** — a block that failed to parse still prints with the
Steel structure rules applied (its tokens do neutralize now, via fix (a)). Deliberate or
not, it isn't stated anywhere.

### 4. Real Obsidian PDF export — INDEPENDENTLY RE-VERIFIED ✅

Own Xvfb `:83`, own scratch `--user-data-dir` (`/tmp/claude-1000/dse-sc170-review/udd`),
CDP 9236, real Obsidian against `demo-vault`, branch build (`npm run build-no-check` at the
rebased tip). `:1` never touched; `obsidian-shots` / `docs-shots` never run.

- `workspace:export-pdf` → the real `PdfExportModal` was captured; its prototype carries
  `printToPdf` / `testPrint` / `print`. Calling the REAL `m.printToPdf()` **returned ok on
  my rig** (no hang) and my `window.open` hook recorded the exporter's actual call:
  `window.open('about:blank','_blank','popup,hide=true')` — the hidden popout the report
  describes. I could not capture the popout's internals (it is torn down before my 250 ms
  poll and my listeners produced no records), so the popout arm remains inferred, same as
  in the implementer's evidence.
- Ground truth then measured on the same DOM the exporter builds (`testPrint()`, forced
  `theme-light`, Electron `printToPDF({pageRanges:'1-2'})` — the `pageRanges` footgun is
  real and was respected):

```
before print (screen)  printAttr off  card-bg linear-gradient(160deg,#f…  border #c8cdd0  radius 0.4em  surface #f6f8f8  fg #2c2e30
                       .dse-sb  bgImg gradient · shadow inset+drop · radius 10.4px · border 1px solid #c8cdd0
beforeprint            printAttr ON   card-bg none  border #ccc  radius 0  surface #fff  fg #000
                       .dse-sb  bgImg none · shadow none · radius 0px · border 1px solid #ccc
mql:true               printAttr ON   (unchanged)
afterprint             printAttr off  card-bg gradient  radius 0.4em  fg #2c2e30      ← restored
mql:false              printAttr off  (unchanged)
```

- **PDF verdict: PASS.** `pdftoppm` page 2 of the real Electron PDF shows the print scheme —
  white ground, square corners, 1px grey frame, no gradient, no drop shadow, black ink, act
  spines still coloured (intended). The plate is gone.
- **The note renders normally again after the export**: the reading-view root's state after
  the whole cycle is byte-for-byte the same object I recorded before it
  (`printAttr off`, `--dse-card-bg` gradient, `--dse-radius 0.4em`, `--dse-fg
  rgba(220,226,230,.88)`, `.dse-sb` radius 10.4px), and the after screenshot matches the
  before screenshot. `afterprint` restore confirmed in-product.
- Observation (pre-existing, not SC-170): the exported card carries the **"Read-only"
  badge** (the export host can't persist), overlapping the role banner in the PDF. Not
  caused by this branch — the print rules never hid it — but it is visible on paper in every
  export and is worth a FOLLOWUPS entry.

### 5. Harness / widening — one blocking defect, one stale deliverable

**⛔ M-1 (BLOCKING) — the branch does not compose with SC-160.** `shoot.mjs`'s
`scrollShots` loop (added on develop by SC-160, *after* this branch's base) is the one
capture loop that did not receive SC-170's `{ media: mediaFor(c) }` argument. Git merged it
cleanly; the semantics did not. The 5 `statblock-sticky*--steel-realprint.png` files are
therefore shot under **screen** media with no print attribute — i.e. they are plain
steel-dark screen renders wearing a realprint name — and the run's own assertion catches it:

```
PRINT-TWIN PARITY VIOLATED — 5/72 capture id(s) render differently on paper than in the print preview:
  statblock-sticky  statblock-sticky-narrow  statblock-sticky-nometa
  statblock-sticky-off  statblock-sticky-unscrolled
```

`npm run shots` exits 1 on the rebased tree. Diagnosed, not assumed: I applied the one-line
fix

```js
// visual-harness/shoot.mjs, scrollShots loop (~line 244)
-			await snap(page, params, `${n.id}--${comboName(c)}${suffix}`);
+			await snap(page, params, `${n.id}--${comboName(c)}${suffix}`, { media: mediaFor(c) });
```

re-shot the five ids, and all five went byte-identical twin===realprint. So **SC-160's
sticky does not leak onto paper** — it is purely the missing argument. With the line added:
`npm run shots` → 290 ok / 0 FAIL, `print-twin parity OK (72 capture ids byte-identical)`,
`freeze OK (72/72)`. (The patch was reverted; the worktree is clean.)

Two structural notes this exposes, both cheap to close and worth doing in the fix round:
- the media argument is opt-in per call site, so **the next new shot loop will silently
  repeat this**. Passing `media` from inside `snap` (derive it from the combo, or make
  `snap` take the combo) removes the class of bug.
- `assertPrintTwinParity()` walks the whole `shots/` directory, so a **narrowed** run
  re-asserts stale files from a previous full sweep and prints "67/72 capture ids" for a
  one-element run. Cosmetic, but it makes a narrowed run's parity line meaningless.

**M-2 (blocking for landing) — `widening.txt` is stale: 67 lines, the baseline needs 72.**
Verified against the current baseline: 0 collisions, additions-only, and every one of the 67
hashes equals the frozen `*--steel-print.png` twin hash (67/67) — *and* all 67 survive the
rebase byte-identically. But SC-160 landed 5 new frozen names, so the file is missing
`statblock-sticky{,-unscrolled,-nometa,-off,-narrow}--steel-realprint.png`. I regenerated
the complete, post-rebase list at
`.superpowers/sdd/sc170/widening-review-72.txt` (72 lines) — **note it was produced with
the M-1 fix applied**; regenerate it from the fixed branch before applying.

**Widening determinism: PASS.** Two full `npm run shots` runs on the rebased tree produced
identical `*--steel-realprint.png` hash sets (sorted diff empty, 72/72), and in run 2 all 72
realprint hashes equal their twin hashes.

### 7. The two literal copies — the pin is NOT strong enough, and they have ALREADY drifted

Mutation test (both mutations applied at once, then reverted):

| mutation | jest | shots |
|---|---|---|
| `--dse-fg-muted: #333 → #f0f` in the neutral **`@media print`** copy | **2803 passed, 0 failed** | `statblock`/`feature` print **and** realprint bytes unchanged (sha256 `-c` OK), parity OK |
| `--dse-act-main: #c0392b → #0000ff` in the Steel-act **`@media print`** copy | same run, green | same |

Nothing in the battery can see it. The reason is structural: once `watchPrintMedia` stamps
the attribute, the twin blocks (same (0,4,0), later in source) win over the `@media print`
copies on every surface the harness photographs — so **the `@media print` copies are
effectively unreachable in the captured world**, and `theme-print.test.ts` only spot-checks
8 of their 47 declarations (`printMediaNeutralBody`, representative decls) and asserts
**nothing at all** about the Steel-act `@media print` copy's values.

And this is not hypothetical — the copies are already out of sync **today**:

```
neutral @media print : 46 declarations
neutral twin         : 47 declarations
twin-only            : --dse-font-controls: var(--font-text)      ← SC-112 Task 3's print pin
```

Pre-existing (identical at base `478f991`), so not caused by SC-170 — but SC-170 is the
ticket that made "the two print surfaces resolve identically" a promise, and it shipped
with the promise already broken by one token. Cheap close, and it kills the mutation class
too: assert the `@media print` neutral body's declaration **set and values equal the twin's**
(same for the Steel-act pair) rather than 8 representatives.

### 8. Docs / CHANGELOG — accurate, plain language ✅

`CHANGELOG.md` (user language, names the light-vault case), `docs/advanced-usage.md` (the
preview is a proof, with the "before 7.0.0 they could disagree" note), `visual-harness/README.md`
(the two classes, the byte-parity assertion, `--bg=` excludes both — all matching the code).
Nits only: the README's SC-144 paragraph lost its line wrapping in the edit, and the report's
own header still says "freeze baseline … 67 lines" (it is 72 since SC-160).

Report accuracy nits (no action needed beyond knowing): §3's "Driven through Obsidian's own
`PdfExportModal`" is true of `testPrint()`, but the exporter's **popout** path was never
executed end to end in either the implementer's evidence or mine — the theme-light flip was
applied by the probe, not observed from the exporter. The per-window binding is right by
construction and by the `window.open` record, but it is not measured.

---

## Findings, severity-ranked

| # | Sev | Finding |
|---|---|---|
| M-1 | **BLOCKING** | `shoot.mjs`'s SC-160 `scrollShots` loop is missing `{ media: mediaFor(c) }`; post-rebase `npm run shots` fails the parity assertion 5/72 and exits 1. One-line fix, proven (all 5 go byte-identical). |
| M-2 | **BLOCKING (landing)** | `widening.txt` is 67 lines against a 72-line baseline (SC-160's 5 sticky names missing). Regenerate after M-1; complete post-rebase list provided at `widening-review-72.txt`. |
| M-3 | MEDIUM | The two literal copies of the print declarations are unpinned: mutating a value in either `@media print` copy leaves jest AND shots green, and they have **already drifted** by `--dse-font-controls` (46 vs 47). Assert set+value equality between each `@media print` copy and its twin. |
| M-4 | MEDIUM | The `media` argument is opt-in at each of six `snap()` call sites — the same omission will recur on the next new shot loop. Derive it inside `snap`/from the combo instead. |
| L-1 | LOW | Error-card roots never get `watchPrintMedia` (the call is after `prepareModel` inside the `try`), so a failed block still prints with Steel structure rules. Undocumented. |
| L-2 | LOW | `assertPrintTwinParity()` scans the whole shots dir, so a narrowed run re-asserts stale files and reports a misleading capture count. |
| L-3 | LOW | Every real PDF export carries the **"Read-only"** badge (export host can't persist), overlapping the role banner. Pre-existing, visible in my PDF, worth a FOLLOWUPS entry. |
| L-4 | LOW/INFO | The new realprint class is, by construction, the twin rendered through the JS stamp — so it does **not** exercise fix (a) at all, and the light-vault half of the bug (the shipping half) still has **zero byte coverage** (the print classes are dark-only). The parity assertion is still the right gate; just don't over-read the 72 new frozen lines. |
| L-5 | INFO | Intermittent unrelated jest failure observed once under load: `sidebarEncounterHandoff.test.ts › persists the id it minted`. Green in isolation ×2 and on the full re-run. |

## What a fix round has to do

1. Add `{ media: mediaFor(c) }` to the `scrollShots` `snap()` call (and preferably move
   `media` inside `snap`). Re-run the full sweep → expect `290 ok`, `parity OK 72/72`,
   `freeze OK (72/72)`.
2. Regenerate `widening.txt` at 72 lines from the fixed, rebased tree; re-verify
   additions-only + deterministic across two runs.
3. Close the mirror gap in `theme-print.test.ts` (set+value equality for both `@media print`
   copies against their twins) — which also repairs the existing `--dse-font-controls` drift.
4. Optional: one sentence on error-card roots; the README wrap; the report's "67-line
   baseline".

## Reproduction pointers

- Base repro / branch probes: scratch tree at `478f991` + Playwright, twin vs
  `emulateMedia('print')` in both schemes (script kept out of the repo; probes removed).
- Rule audit: parse `visual-harness/dist/harness.css` in node, `root.matches(sel)` in the
  page, rank by specificity.
- Obsidian: own Xvfb `:83`, scratch udd, CDP 9236, `PdfExportModal.testPrint()` +
  `printToPDF({pageRanges:'1-2'})`, `pdftoppm -r 80`. Xvfb and the probe Obsidian were
  killed at the end; the only remaining Obsidian on the box is Scott's own on `:1`.

---

# Fix round 1 (same reviewer, 2026-08-17)

**Commit `75a2ca4`** on `sc170-real-print`, on top of the rebased `fce4b75` (base develop
`c676d58`). Worktree clean; freeze baseline still untouched (72 lines, md5
`91f68452658b28c3f90e0de0cd2c0663`).

## Battery at `75a2ca4`

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2836 passed / 1 skipped / 170 suites** (+2 vs `fce4b75`'s 2834 — the two mirror cases) |
| `npm run shots` | **290 ok / 0 FAIL** |
| in-run print-twin parity | **OK — 72/72 byte-identical** |
| in-run print-class coverage | OK (no capture produced one class without the other) |
| `check-freeze.sh` | **`freeze OK (72/72 steel-print PNGs byte-identical)`**, exit 0 — no frozen byte moved |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared** |

## Per item

- **M-1 — fixed.** The `scrollShots` loop now goes through the central `snap`, so its
  realprint captures are taken under print media. Full sweep: `print-twin parity OK (72
  capture ids byte-identical)`.
- **M-4 — fixed structurally, not by adding the missing argument.**
  `snap(page, combo, params, captureId, opts)` derives the print medium, the `print=1`
  query param, the `--readonly` param/suffix and the output filename **from the combo**;
  all six sweep loops call it that way and there is no signature that omits a combo. Plus a
  second assertion — **print-class coverage**: any capture id that produced a twin without
  a realprint (or vice versa) fails the run, which is the one failure byte parity cannot
  see (a loop that never shoots the class at all just produces fewer files).
  *Can-fail proven:* filtering the realprint combo out of `scrollShots` →
  `PRINT-CLASS COVERAGE VIOLATED … statblock-sticky: twin shot, NO realprint`, exit 1.
  Side effect, documented in the README: under `--readonly` the gallery captures are now
  `gallery--steel-<bg>--readonly.png` instead of silently overwriting the plain gallery
  goldens with read-only renders.
- **L-2 — fixed.** Both assertions iterate the captures **this run wrote** (a `produced`
  map filled in `snap`), never `readdirSync`. *Proven:* `--element=statblock-sticky` now
  reports `print-twin parity OK (1 capture ids …)` where it used to claim 72; a
  `--bg=dark` narrowed run asserts nothing at all, silently, as it should.
- **M-3 — drift found, fixed, and pinned.** `--dse-font-controls: var(--font-text)` (SC-112
  Task 3's print pin) was missing from the neutral `@media print` copy — 46 declarations
  against the twin's 47 — since SC-112. Added to the print copy (the twin is
  authoritative). New `theme-print.test.ts` cases compare BOTH pairs
  (`@media print` neutral ↔ neutral twin, `@media print` Steel act ↔ Steel act twin)
  as full declaration maps, property **and** value, with comments stripped so a quoted
  declaration cannot satisfy them. *Can-fail proven:* changing `--dse-tier-low` in the
  `@media print` copy alone → 2 failures naming the property
  (`- "--dse-tier-low": "#c0392b"` / `+ "#123456"`). The frozen bytes did not move
  (72/72), as expected: the twin outranks the media copy by source order once the
  attribute is stamped. Noted in `CHANGELOG.md` in user language (control text kept the
  theme's serif when printed).
- **L-4 — pinned.** The four print selectors are now asserted to be **exactly (0,4,0)**,
  alongside the existing "> `.theme-light :is(…)` (0,3,0)" comparison. This is the only
  guard on fix (a): the realprint capture class resolves through the JS stamp, so no PNG
  anywhere would go red if a repeat were deleted.
- **L-1 — documented with a measurement, not wired.** A `prepareModel` failure escapes to
  the catch before `cx.theme.apply()` runs, so an error-card root carries no
  `data-dse-theme`; `theme.apply` is the single writer of that attribute and never touches
  `document.body`, and every Steel rule block is prefixed with `[data-dse-theme='steel']`.
  Probed against the built sheet: such a root matches **0 of 418** Steel-scoped selectors
  and, under real print media, already resolves the neutral print values (`--dse-card-bg
  none`, `--dse-border #ccc`, `--dse-radius 0`, `--dse-bevel none`, `--dse-surface #fff`,
  `--dse-fg #000`) from the `@media print` block at (0,4,0). There is no plate to strip.
  Recorded at the call site in `pipeline.ts`, together with why the call must stay AFTER
  `prefs.reflect()` (earlier, and the restore snapshot is `null` while reflect overwrites
  the print stamp — paper would silently revert to the screen scheme).
- **L-3 (Read-only badge in PDFs)** — untouched, per instruction; orchestrator FOLLOWUPs it.
- **L-5 (jest flake)** — not seen again; the full suite ran green here.

## Widening

`.superpowers/sdd/sc170/widening.txt` regenerated as the complete **72-line** post-fix
list (`widening-review-72.txt` deleted — one file, no ambiguity). Verified against the
current 72-line baseline: **0 collisions** (additions-only), **0 duplicate names**, and
**72/72 hashes equal the frozen `*--steel-print.png` twin hash** of the same capture id.
**Deterministic across two full sweeps** at this commit: the sorted `*--steel-realprint.png`
hash lists from run A and run B are identical, and so are the twin lists.
# SC-170 fix round 1 — scoped RE-REVIEW (fresh eyes, executing)

**Verdict: LAND.** Every claim in "Fix round 1" reproduced by execution. Full battery green
at `75a2ca4`, freeze baseline untouched, widening file verified on all three properties and
byte-identical to an independently regenerated clean sweep. Three non-blocking nits below
(one is a real residual hole in the new coverage assertion, worth a FOLLOWUPS line — not a
fix round).

Scope: delta `fce4b75..75a2ca4` only, branch `sc170-real-print`, worktree
`/home/scott/code/steelCompendium/worktrees/sc170-real-print/draw-steel-elements`.
Delta is 6 files / +159 −49: `CHANGELOG.md`, `src/framework/pipeline.ts` (comment only),
`styles-source.css` (+1 decl +8 comment lines), `test/dom/framework/theme-print.test.ts`,
`visual-harness/README.md`, `visual-harness/shoot.mjs`.
Worktree left clean at `75a2ca4`; freeze baseline still 72 lines, md5
`91f68452658b28c3f90e0de0cd2c0663`.

---

## Battery, measured at `75a2ca4` (not quoted)

| Gate | Claimed | Measured | |
|---|---|---|---|
| `npm run tsc` | clean | clean | ✅ |
| `npm run lint` | clean, exit 0 | clean, exit 0 | ✅ |
| `npx jest` | 2836 / 1 skipped / 170 suites | **2836 passed, 1 skipped, 170 passed suites (170 of 171), 3 snapshots**, 31 s | ✅ |
| `npm run shots` | 290 ok / 0 FAIL | **290 ok / 0 FAIL** (two independent clean sweeps, `shots/` deleted first) | ✅ |
| in-run print-twin parity | OK 72/72 | **`print-twin parity OK (72 capture ids byte-identical)`**, both sweeps | ✅ |
| in-run print-class coverage | OK | no violation printed; can-fail proven below | ✅ |
| `check-freeze.sh` | 72/72 | **`freeze OK (72/72 steel-print PNGs byte-identical)`, exit 0** | ✅ |
| `npm run parity` | 0/0/16 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0** | ✅ |

No jest flake seen (L-5 not reproduced). Load at jest time 3.76 / 12 cores, so the
load-sensitive suites were not in play.

---

## Item-by-item

### 1. M-1 / M-4 — central `snap()`, six loops, coverage assertion ✅

Read of `visual-harness/shoot.mjs` confirms the structural claim: `snap(page, combo, params,
captureId, opts)` derives **all four** combo-dependent things internally — `emulateMedia(mediaFor(combo))`,
`query.print = '1'`, the `--readonly` query param **and** filename suffix, and `outName`.
There is no signature that omits a combo. All **six** sweep loops route through it
(elementShots, narrowShots, interactionShots, prefShots, scrollShots, gallery) and none of
them now builds `theme`/`bg`/`print`/`readonly`/`suffix` by hand. `snap` has no other caller
in the repo (`shoot-url.mjs` is independent).

**Coverage can-fail, executed.** Mutation: `for (const c of combos.filter((c) => !c.realprint))`
in the `scrollShots` loop only; `node visual-harness/shoot.mjs --element=statblock-sticky`:

```
  ok statblock-sticky--steel-dark.png
  ok statblock-sticky--steel-light.png
  ok statblock-sticky--steel-print.png

PRINT-CLASS COVERAGE VIOLATED — a capture produced one print class but not the other, …
  statblock-sticky: twin shot, NO realprint
Every sweep loop must run the full COMBOS list through snap(page, combo, …).
```

Exit code confirmed **nonzero** (checked via a `|| touch` marker, not an echoed `$?` — the
devbox `$?` footgun does fire here: `; echo "EXIT=$?"` reported `EXIT=0` for this same
failing run). Mutation reverted; `git status` clean.

Ordering note in `shoot.mjs`: the `failures.length` early exit runs **before**
`assertPrintTwinParity()`, so an `--ERROR` capture (which is deliberately not recorded into
`produced`) can never masquerade as a coverage violation. Correct.

### 2. M-3 — the two literal copies are now pinned as full property→value maps ✅

Verified the test does what it says: `declMap()` strips `/* … */` before matching, and the
two `test.each` cases compare `declMap(mediaBody)` to `declMap(twinBody)` with `toEqual`
(set **and** value).

Measured on the current sheet, using the test's own four extractors:

```
neutralTwin   47 decls   --dse-font-controls = var(--font-text)
neutralMedia  47 decls   --dse-font-controls = var(--font-text)
steelTwin      7 decls
steelMedia     7 decls
```

**47/47 confirmed** — the SC-112 drift is closed.

**Can-fail #1 (value half), executed.** Mutated `--dse-fg-muted: #333 → #f0f` in the neutral
`@media print` copy (line 9672) **and** `--dse-act-main: #c0392b → #0000ff` in the Steel-act
`@media print` copy (line 9793), both copies untouched on the twin side. Result:
**exactly 2 failures of 20**, one per pair, each naming the property:

```
● … › neutral: the @media print copy and the preview twin declare exactly the same thing
    -   "--dse-fg-muted": "#333",
    +   "--dse-fg-muted": "#f0f",
● … › Steel act: the @media print copy and the preview twin declare exactly the same thing
    -   "--dse-act-main": "#c0392b",
    +   "--dse-act-main": "#0000ff",
```

**Can-fail #2 (set half), executed.** Deleted the newly added
`--dse-font-controls: var(--font-text);` from the `@media print` copy only (i.e. re-created
the exact pre-fix drift): **exactly 1 failure of 20**, naming
`- "--dse-font-controls": "var(--font-text)"`. So the guard would have caught the original
SC-112 drift on the day it landed.

**Why adding the declaration moved no frozen byte — reasoned and measured.** `check-freeze.sh`
= 72/72 at `75a2ca4` (twice). Two independent reasons, both hold:
1. The frozen `*--steel-print.png` class is captured under **screen** media with
   `?print=1` stamping the attribute — the `@media print` block does not apply at all in
   that capture, so no declaration added to it can move those bytes.
2. Even in the `realprint` class (real print media, attribute stamped by `watchPrintMedia`),
   both blocks apply at equal specificity (0,4,0) and the twin is **later in source**
   (line ~9739 vs the media copy at ~9656), so the twin wins — and the twin already
   declared `--dse-font-controls: var(--font-text)`. Adding the identical declaration to the
   loser is a no-op for every pixel. Confirmed empirically: the 72 realprint hashes are
   byte-equal to their 72 frozen twins.

Steel's `--dse-font-controls` really is a serif (`var(--dse-font-body)` = `"Source Serif 4", …`,
line 3841), so the CHANGELOG's "control text kept the theme's serif when printed" is
factually right.

### 3. L-4 — the (0,4,0) cascade-model pin ✅

Two mutations, both executed:

- **CSS only** — stripped the neutral `@media print` selector from
  `[data-dse-element]×4` back to `[data-dse-element]` (styles-source.css:9656):
  **4 failures / 20**, including `neutral @media print outranks BOTH Steel token blocks`.
- **CSS + test constant** (the realistic "developer keeps the test compiling" case) — same
  CSS strip plus `NEUTRAL_MEDIA_SELECTOR = '[data-dse-element]'`:
  **exactly 1 failure / 20**, the L-4 case, on the tuple assertion
  (`Array [0, 1, 0]` received vs `[0, 4, 0]` expected).

So the pin is real, and the tuple assertion is what catches the second (otherwise
regex-satisfied) shape. Fair note, not a finding: at (0,1,0) the pre-existing
`rank(...) > rank(STEEL_DARK)` comparisons would also have gone red; the strict tuple is
what additionally catches an over- or differently-padded selector that still outranks
(0,3,0). Both files restored; `git status` clean.

### 4. L-1 — the error-card measurement, spot-checked live ✅ (claim holds)

Method: temporarily added a bad-YAML fixture (`ancestry/badyaml`) to the harness FIXTURES,
`npm run harness:build`, then a Playwright probe under `emulateMedia({media:'print'})` in
both schemes; the harness sheet was re-parsed **in-page** through a constructed
`CSSStyleSheet` (a `file://` page cannot read `cssRules` of its own linked sheet) and every
Steel-scoped selector part (depth-aware comma split) tested with `Element.matches` against
the error-card root **and all its descendants**. Fixture reverted, harness rebuilt by the
later `npm run parity`; probe files deleted; `git status` clean.

```
built harness.css: 937 rule selectorTexts → 427 Steel-scoped selector parts (377 unique)

ERRORCARD bg=light  print media: theme=null printAttr=null nodes=4 rootHits=0 anyNodeHits=0
ERRORCARD bg=dark   print media: theme=null printAttr=null nodes=4 rootHits=0 anyNodeHits=0
CONTROL valid card  print media: theme=steel printAttr=on nodes=55 rootHits=4 anyNodeHits=5
   (control's hits include both Steel token blocks AND both (0,4,0) print blocks)
```

The measurement claim reproduces: **0 Steel-scoped selectors match an error-card root** (my
count is 427/377 rather than the report's 418 — a counting-method difference on the same
sheet, not a discrepancy in the result). The root carries no `data-dse-theme` and no
`data-dse-print` (no watcher), exactly as the comment states, and it resolves the neutral
print values under real print media:

```
--dse-card-bg none · --dse-border #ccc · --dse-radius 0 · --dse-bevel none
--dse-surface #fff · --dse-fg #000        (screen, for contrast: border/surface/fg empty, radius 5px)
```

INFO, not a finding: the visible `.dse-error-card` panel does **not** consume those tokens —
it uses Obsidian's own vars (`--background-secondary`, `--radius-m`, `--text-error`), so under
print media it still paints `rgb(246,246,246)` / 8px radius in a light vault (and
`rgb(38,38,38)` in a dark one). Pre-existing base styling, no Steel plate involved, and the
exporter forces `theme-light`, so the shipping arm is a light grey box. Consistent with
"there is no plate to strip".

### 5. L-2 — narrowed runs assert only what they shot ✅, with a residual (nit)

Executed:

```
node shoot.mjs --element=statblock-sticky            → print-twin parity OK (1 capture ids …)
node shoot.mjs --element=statblock-sticky --bg=dark  → (no parity line at all)
```

The first is the claimed fix (used to claim 72). The second is the silent case.

**Judgment: silence is acceptable-but-weak, and there is a second, less benign path to it.**
`assertPrintTwinParity` returns silently whenever `compared === 0`. Reaching that via
`--bg=` is operator-requested and harmless. But the same `continue` also swallows a capture
id that produced **neither** print class — and that is reachable from a code bug, not just a
flag. Proven by mutation (`combos.filter((c) => !c.realprint && !c.print)` in `scrollShots`,
`--element=statblock-sticky`):

```
  ok statblock-sticky--steel-dark.png
  ok statblock-sticky--steel-light.png

all shots written to …            ← exit 0, no coverage complaint, no parity line
```

In a **full** sweep such a loop would not silence the run, but it would silently shrink the
denominator (`parity OK (67 capture ids …)` instead of 72) with nothing naming the loss — the
same "meaningless count" failure mode L-2 was written to kill, one level down. Recommended
one-liner (FOLLOWUPS, not a fix round): print
`print-twin parity NOT asserted (no print class in this run)` when `compared === 0`, and/or
treat "neither class" as a coverage violation unless the run is combo-narrowed (`args.bg`).
Non-blocking: SC-160's actual bug class is closed and proven closed, and this is strictly
better than the pre-fix `readdirSync` behaviour.

### 6. Widening file — all three properties + determinism ✅

`.superpowers/sdd/sc170/widening.txt`, verified by script against the current baseline:

| Check | Result |
|---|---|
| line count | **72** |
| duplicate names | **0** |
| every name is a `*--steel-realprint.png` | **72/72** (0 exceptions) |
| collisions with `freeze-baseline.sha256` (additions-only) | **0** |
| each hash == its `*--steel-print.png` twin's **baseline** hash | **72/72**, 0 mismatched, 0 without a twin |

**Determinism, two ways.** Regenerated from a from-scratch sweep (`rm -rf visual-harness/shots`
→ `npm run shots` → `sha256sum *--steel-realprint.png | sort -k2`): `diff` against the
committed `widening.txt` is **empty** — the file is byte-reproducible, not just
hash-consistent. A second from-scratch sweep produced an identical 72-hash list
(`diff runA runB` empty).

### 7. Nothing regressed outside the delta ✅

Full battery green (table above), all six gates, with `shots/` deleted before each sweep so
no stale file propped anything up. `git status --porcelain` empty and `HEAD == 75a2ca4` after
all probes and mutations were reverted. The shared main checkout was never touched; the
freeze baseline was never written (md5 unchanged).

Behavioural change worth knowing (documented in the README, and correct): under `--readonly`
the gallery now writes `gallery--steel-<bg>--readonly.png` instead of overwriting the plain
gallery goldens. No gate depends on it — `gallery` has no print combo and is therefore not in
the freeze baseline.

### 8. Docs / CHANGELOG ✅

- `CHANGELOG.md` addition is plain user language, names the observable symptom (control text
  printed in the theme's serif), no jargon, no token names.
- `visual-harness/README.md` gains the coverage half, the "read what this run wrote" rule, and
  an explicit "adding a sweep loop" instruction naming the SC-160 regression; the round-1 nit
  (lost line wrapping on the SC-144 paragraph) is fixed. All statements match the code I read.
- `src/framework/pipeline.ts` is comment-only and both comments are load-bearing and accurate:
  the ordering rationale (snapshot-before-`reflect()`) and the L-1 measurement.

Accuracy nit (INFO): the CHANGELOG bullet is true at release level, but the *mechanism* that
makes controls print sans is SC-170's `data-dse-print` stamp (which routes paper through the
twin), not the added `@media print` declaration — that copy is unreachable on any stamped
root. The added line is a mirror/defence line, not the user-visible fix. Nobody reading the
CHANGELOG is misled; only a reader of the fix-round report might over-credit it.

---

## Findings

| # | Sev | Finding |
|---|---|---|
| N-1 | LOW (nit, FOLLOWUPS) | `assertPrintTwinParity` still returns **silently** when `compared === 0`. Benign for `--bg=` (operator asked for it), but the same path swallows a loop that shoots **neither** print class — proven by mutation: exit 0, no message, and in a full sweep the parity denominator silently shrinks. One line fixes both: print "parity not asserted (no print class in this run)", and/or fail on "neither class" unless `args.bg` is set. |
| N-2 | INFO | The error card's visible panel uses Obsidian vars (`--background-secondary`, `--radius-m`), not DSE print tokens, so it prints as a grey rounded box under real print media. Pre-existing, no Steel plate, exporter forces light — consistent with the L-1 write-up, just not stated there. |
| N-3 | INFO | CHANGELOG credits the user-visible serif fix to the release; the `@media print` copy it edits is unreachable on a stamped root, so the mechanism is the SC-170 stamp. Release-level statement is accurate; no change needed. |
| — | INFO | The devbox `$?` footgun reproduced verbatim during this review: `bash -c '… ; echo "EXIT=$?"'` reported `EXIT=0` for a run that exited 1. Exit codes here were established with `|| touch <marker>`. |

Nothing blocking. **LAND.**

## Reproduction pointers

- Coverage can-fail: `combos.filter((c) => !c.realprint)` in `shoot.mjs`'s `scrollShots` loop,
  then `node visual-harness/shoot.mjs --element=statblock-sticky`.
- Silent-hole repro: same line, `!c.realprint && !c.print`.
- M-3 can-fail: `styles-source.css:9672` (`--dse-fg-muted`), `:9793` (`--dse-act-main`),
  and deleting `:9682` (`--dse-font-controls`); `npx jest test/dom/framework/theme-print.test.ts`.
- L-4 can-fail: `styles-source.css:9656` selector de-padded, ± the matching
  `NEUTRAL_MEDIA_SELECTOR` constant in `theme-print.test.ts`.
- L-1 probe: temporary `ancestry/badyaml` fixture in `visual-harness/entry.ts` +
  `harness:build` + Playwright `emulateMedia('print')`, Steel selectors re-parsed via a
  constructed `CSSStyleSheet` (a `file://` page cannot read its linked sheet's `cssRules`).
- No real Obsidian was launched for this scoped re-review (the round-1 PDF evidence was not
  in the delta); `:1` untouched.
