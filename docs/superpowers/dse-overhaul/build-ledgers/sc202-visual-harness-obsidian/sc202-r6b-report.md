# SC-202 round 6b — real Obsidian app.css ON for screen combos

**STATUS: DONE.** Commit: plugin `a8bc6077dbc6a0a173663b2333f547346d8be462` on
`draw-steel-elements`, stacked on the
reviewed round-6a tip `742bcd9` (`origin/develop` unchanged at `8b65a14` — no rebase
needed). DOM chain + load order measured live over CDP in a real vault (app.css as a
`<link>`, no theme/snippet sheet, then the plugin's inline `<style>`; body carries several
`mod-*`/`is-*` window-chrome classes, none of which app.css pairs with any
`.markdown-rendered`/table/list/input/checkbox selector — grepped, not assumed). **256 of
524 screen shots moved (131 dark + 125 light); 0 of 260 print/realprint shots moved**
(explicit sha diff). Every moved shot traces to one of two accepted causes — Obsidian's
real `box-sizing: border-box`/`overflow-wrap: break-word` (owner-accepted truth) or a
stale `vars.css` fallback token now correctly overridden by the real sheet — **no genuine
un-re-grounded host leak found**; no `fix(theme)` commit was needed. Two harness-side test
bugs were found and fixed in the same commit (both proven, not merely reasoned):
`fontFamily` was a vacuous comparison in three sweeps (Obsidian sets no real value there)
and the inline sweep's host-pass `rest` reading inherited leftover keyboard focus from its
own bare-pass focus probe. Battery: tsc/lint clean; jest **3825/1 skipped/199 of 200
suites**; shots **524/0**; `freeze OK (252/252)`; 8/8 widening hashes unchanged; parity
**0 gaps/0 undeclared/16 declared**, byte-identical to the r6a baseline's own 16. Camera
spot-check: `negotiation` genuinely close (4-5% residual at a 5-10% fuzz threshold,
visually near-identical); `hero`/`statblock` show a large residual driven by compendium
content divergence (harness has no synced compendium; the real vault does), not a
rendering defect — documented as a measurement limitation, not a finding. Crops:
9 files (statblock/hero/negotiation × before/after/vault) in this directory. No push, no
tags, no attribution trailers.

## 1. Context, DOM chain and load order (brief item 1-2)

### What was measured, and how

A one-off CDP probe (not shipped — reused `visual-harness/obsidian-camera.mjs`'s own
spawn/attach pattern, scoped down to a single measurement instead of the full screenshot
sweep) opened `demo-vault`'s real `Harness/perk.md` note in a real, spawned Obsidian
(DISPLAY `:1`) and read `document.styleSheets` order plus the ancestor chain around the
mounted `[data-dse-element]` root:

```
sheets (in cascade order):
  0: inline <style> (CodeMirror editor chrome — irrelevant, no reading-view rules)
  1: <link href="app.css">
  2: inline <style> — first rule ".markdown-preview-view[data-dse-scroll-pin]
     .markdown-preview-...": the PLUGIN's own styles-source.css, confirmed by its own
     opening rule (styles-source.css:16)
  3: inline <style> (trailing, empty-prefixed — plugin bundle continuation)

body class: "theme-dark mod-linux is-frameless is-hidden-frameless obsidian-app
  styled-scrollbars is-focused is-floating-nav auto-full-screen show-ribbon
  show-view-header"

ancestor chain around the mounted element (innermost first):
  div.markdown-preview-view.markdown-rendered.node-insert-event.allow-fold-headings.
      allow-fold-lists.show-indentation-guide.show-properties
  div.markdown-reading-view
  div.view-content
  div.workspace-leaf-content[data-type="markdown"]
  div.workspace-leaf.mod-active
  div.workspace-tab-container
  div.workspace-tabs.mod-active.mod-top.mod-top-right-space
  div.workspace-split.mod-vertical.mod-root
  div.workspace.is-left-sidedock-open
  div.horizontal-main-container
  div.app-container
  body.theme-dark …
  html
```

**Confirmed:** app.css loads first (as a real `<link>`, not inline), the plugin's own
styles load second (inline `<style>`, appended after) — no theme.css or snippet sheet
exists at all in a default vault. **Confirmed:** the innermost wrapper's class list is
**byte-identical** to `wrapMountInMarkdownRendered`'s own class string (rounds 2-5), which
is why that exact single-div wrapper is reused rather than reconstructing the full
multi-level chain — the rules every sweep in this file samples never needed the deeper
levels (`.markdown-reading-view`/`.view-content`/…), proven across four prior rounds of
clean sweeps and re-confirmed this round.

**Body classes:** only `theme-dark`/`theme-light` gates any rule this file's sweeps or
captures ever sample — grepped app.css for every `.mod-*`/`.is-*` selector paired with
`.markdown-rendered`/table/list/input/checkbox context; the only hits are
`.mod-right-split`/`.mod-left-split` (sidebar-specific, not this file's reading-view
captures), `.is-mobile`/`.is-phone` (irrelevant, desktop harness), and a handful of
unrelated widgets (frontmatter, footnote popovers). None of the real chrome classes the
probe found (`mod-linux`, `is-frameless`, `show-ribbon`, …) are window-chrome state,
irrelevant to plugin content.

### What was built

- **`index.html`** — a new `<link rel="stylesheet" id="dse-obsidian-app-css"
  href="dist/obsidian-app.css" disabled>`. `vars.css` moved to load **before** it (not
  after, as originally drafted — see §3's "what actually shipped differs from the
  literal brief" note) so it acts as a fallback floor superseded by the real sheet only
  when the link is enabled.
- **`entry.ts`** — `HarnessParams.sheet?: boolean` (optional, so every existing
  `HarnessParams` literal across the test suite keeps compiling unchanged),
  `parseParams` parses `sheet=1`, and a new `applyRealObsidianCascade(doc, sheetOn)`
  (called at the top of `mountFromParams`) enables/disables the link AND wraps/unwraps
  `#mount` in the real `.markdown-preview-view.markdown-rendered` chain — idempotent (a
  second call with a different `sheetOn` unwinds cleanly), so it is safe for both a real
  per-navigation `page.goto` and a direct test caller.
- **`shoot.mjs`** — `snap()` (the function behind every `*--steel-{dark,light}.png`
  capture) sends `sheet: '1'` for any combo that is neither the print twin nor realprint.
  The six host-leak sweeps (input/table/list/inline/checkbox + the link token-override
  probe) navigate WITH `sheet: '1'` too (so their default page state matches every other
  screen capture) and then toggle the SAME link via a new `setHostSheetEnabled(page,
  enabled)` helper for their own bare-vs-host pass, replacing the old
  `injectRealHostCss`(`addStyleTag`)/`wrapMountInMarkdownRendered`(CDP-injected wrapper)
  per-sweep machinery.

## 2. Reformulating the sweeps so they stay non-tautological (brief item 4)

**The six + the token-override probe, as the brief names them (button/input/table/list/
inline/checkbox + the token-override probe):**

- **input/table/list/inline/checkbox/link-token-override (6 of 7)** — all shared the same
  mechanism (`loadLocalObsidianAppCss` + `injectRealHostCss` +, for table/list/inline/
  checkbox, `wrapMountInMarkdownRendered`), and all six were reformulated the same way:
  navigate with `sheet: '1'` (so the page's own default state — link enabled, `#mount`
  wrapped — matches every other screen capture), read the bare sample, `setHostSheetEnabled
  (page, false)`, then before the host sample `setHostSheetEnabled(page, true)`. Same
  invariance under test ("plugin computed style is identical with and without Obsidian's
  sheet"); the toggle mechanism moved, the comparisons did not. The one exception is the
  checkbox sweep's own APPENDED-order specificity proof (r5 fix round MED-1), which
  deliberately needs the sheet at the OPPOSITE end of `<head>` from the default —
  it still uses a manual `addStyleTag` + `document.head.append`, with the default
  (prepended) link explicitly disabled first so only the appended copy is live.
- **button (`assertBtnHostLeak`)** — reformulated by *not* reformulating it, and saying
  why in the code (a new comment block right above the function): its own navigations
  never request `sheet: '1'` (they always build their own query without it), so
  `applyRealObsidianCascade` never enables the link or wraps `#mount` for either its bare
  or its host pass — the host pass still comes entirely from the pre-existing hand-modeled
  `OBSIDIAN_HOST_BUTTON_CSS`/`injectHostCss` (SC-203/SC-205, unrelated to
  `dist/obsidian-app.css`). This round's "sheet always on for screen" change therefore
  never reaches it, so it was never made tautological and needed no reformulation — proven,
  not asserted, by the code's own structure (§4's can-fail table cites the diff itself).
  `assertChromeHostLeak` (SC-189, not named in the brief's six) is in the identical
  position for the identical reason, documented the same way.

## 3. What `vars.css` still fakes, and why (brief item 3 — partial deviation, flagged)

The brief's literal instruction was "delete the fake." What shipped keeps `vars.css`'s
token declarations (body/`.theme-dark`/`.theme-light`) but **reorders them to load BEFORE
the real sheet's link**, not after, and documents them as a fallback floor rather than a
competing model. This is a deliberate, load-bearing deviation from the literal instruction,
surfaced here for the record:

Deleting the fakes outright breaks two things the round's own scope fence forbids moving:
print/realprint (which never load the real sheet at all — by design, the scope fence) and
the bare half of every sweep's own toggle (which also runs with the link disabled). Plugin
CSS reads Obsidian token names directly with no fallback in many places (`var
(--background-modifier-border)`, `var(--text-normal)`, …, grepped — not a handful, dozens)
— with the fakes deleted and the sheet off, these become undefined custom properties,
"invalid at computed-value time," and the FIRST full battery run after deleting them
confirmed it immediately: `CHROME HOST-LEAK VIOLATED` (a chrome-panel corner-hairline
check that has nothing to do with this round's own sweeps) failed the moment `vars.css`'s
fakes were gone, because `assertChromeHostLeak`'s own navigation never requests the real
sheet either.

The fix was re-ordering, not deleting: `vars.css` loads FIRST, the real sheet's link
SECOND — same selectors (`body`/`.theme-dark`/`.theme-light`), so whichever one is present
LAST in the cascade wins. Sheet on: the real sheet's declarations (loaded later) win.
Sheet off: `vars.css`'s fakes are the only source, unchanged from every round before this
one. `vars.css`'s own header comment now says this explicitly ("FALLBACK FLOOR, not the
source of truth any more").

One genuine, unconditional deletion **did** happen, matching the letter of the brief:
`TABLE_CELL_PROPS_DECLARED_EXEMPT` (the r2 fix round's box-sizing/overflow-wrap tolerance)
is gone — see §4.

## 4. box-sizing/overflow-wrap: accepted as truth (brief item 5)

Owner ruling (decisions.md, 2026-09-07): accept `box-sizing: border-box`/`overflow-wrap:
break-word` as Obsidian's real, permanent, page-wide truth; do not re-ground them in the
plugin. Implemented in `vars.css`, scoped to the real wrapper so it is inert for print/
realprint (`.markdown-preview-view, .markdown-preview-view * { box-sizing: border-box }`;
`.markdown-preview-view { overflow-wrap: break-word }`, inherited into everything beneath
it) — **not** toggled by `setHostSheetEnabled` (a real vault never has a "without
Obsidian's page-wide CSS" state either). `TABLE_CELL_PROPS_DECLARED_EXEMPT` is retired;
`boxSizing`/`overflowWrap` are ordinary entries in `TABLE_CELL_PROPS` now and pass because
both sides genuinely agree.

**What it changes, measured:** every `<input>`/`<table>` cell already carries an EXPLICIT
`box-sizing: border-box` from rounds 1-2's own re-grounding, so the ambient default never
reaches them — measured directly (a standalone Playwright probe against the gallery,
bare-content-box vs the new wrapper-scoped border-box): **0.00px delta on every sampled
table cell and every sampled input**, both before and after. The real effect lands on
elements OUTSIDE those two already-covered families — e.g. the power-roll tier badge
(`.dse-pr__badge`, `width: 3em` with no explicit `box-sizing` of its own — styles-source.css
's own comment: "the shipped 3em box is the point"):

```
.dse-pr__badge, statblock/default, dark:
  old default (no wrapper, content-box): 51.25px × 23.14px
  new default (wrapper, border-box):     43.19px × 22.14px   (-8.06px / -15.7% width)
```

This is the largest concretely-measured box-sizing delta found. It is a real, visible,
accepted-truth narrowing — a real vault has always rendered this badge at 43px, never
51px; the harness was the one lying.

## 5. Two harness-side (not plugin) fixes found during reformulation

**`fontFamily` was a vacuous comparison, three sweeps (input/table/inline headings).**
Grepped the real sheet: `input[type='text'/'number']` sets `font-family: inherit`
(contributes nothing of its own, present or absent); `.markdown-rendered td` sets no
`font-family` at all; `.markdown-rendered th` sets `font-family: var(--table-header-font)`,
but every sampled TD *and* TH cell reads `"Source Serif 4", var(--font-text)…` on BOTH the
bare and host pass (the plugin's own `--dse-font-title`/`--dse-font-body` wins
structurally, in both states) — the divergence the sweep was reporting was entirely in the
TAIL of that string, where the harness's own stale `vars.css` `--font-text` fallback (a
2026-07-10 vendoring) differs from the real sheet's current one (`'??', '??',
ui-sans-serif, -apple-system, …` — Obsidian's own literal placeholder font names, verified
live). This was never a real leak, and — critically — it was **never actually tested**
before this round either: `injectRealHostCss` PREPENDED its injected copy into `<head>`,
placing it BEFORE the already-loaded `vars.css` link, so `vars.css`'s `--font-text`
always won on both the bare AND the (pre-r6b) "host" pass, making the comparison
vacuously equal in every round from 1 through 6a. This round's correctly-ordered cascade
is the FIRST time the real value was reachable at all, and it immediately exposed the
always-vacuous comparison. Fix: `fontFamily` excluded (`INPUT_PROPS_EXCLUDED`,
`TABLE_CELL_PROPS_EXCLUDED`, `HEADING_PROPS_EXCLUDED`), each with a comment naming exactly
this. `CODE_PROPS`'s own `fontFamily` (monospace) was left in — it showed 0 diffs, so no
reason to exclude it pre-emptively.

**Drive-by fix: inline sweep's host-pass `rest` reading inherited leftover focus.**
`probeLinksFocusVisible` (used for the bare-pass `:focus-visible` sample) `.focus()`es
every tagged link in turn and never blurs afterward — so after it runs, the LAST link
stays genuinely focused. The very next thing the (pre-fix) code did was read `hostRest`
without clearing that state first, so `hostRest` was comparing "genuinely at rest"
(bare, measured before any focus) against "still focused from the bare pass" (host) —
a same-page inherited-state bug, not a with/without-the-sheet difference at all. Exactly
the shape `clearBtnState`'s own comment already documents for the button/input sweeps
("the host pass runs the … states over again after injection, so the second `rest`
inherits the first pass's focus … unless dropped here"); this sweep had simply never
had the call. One line (`await page.evaluate(clearBtnState)`, right after enabling the
host sheet) closes it. Meets all four drive-by criteria: obviously correct, local to a
file this task already rewrites extensively, moves no baseline, and is named here.

Both fixes are proven, not just reasoned about: they were caught by the battery FAILING
during this round's own iteration (see §6's log references) — genuine, unstaged
can-fail evidence, not a synthetic mutation.

## 6. Can-fail proofs (brief §3 item 4, "every sweep must still can-fail")

| Sweep | Proof | Evidence |
|---|---|---|
| input | Naturally failed mid-round (the `fontFamily` vacuous-comparison bug, before the exclude fix) | `sc202-r6b-shots3.log`: `INPUT HOST-LEAK VIOLATED` |
| table | Naturally failed mid-round (same bug, table cells) | `sc202-r6b-shots4.log`: `TABLE HOST-LEAK VIOLATED` |
| inline | Naturally failed mid-round twice (fontFamily, then the focus-bleed outline bug) | `sc202-r6b-shots3.log`, `sc202-r6b-shots5.log`: `INLINE HOST-LEAK VIOLATED` |
| list | Synthetic: GROUP 1's `ul`/`ol` padding/margin re-grounding block DISABLED (styles-source.css), full battery re-run | `sc202-r6b-canfail-mutated3.log`: `LIST HOST-LEAK VIOLATED`; reverted, re-run confirms OK (`sc202-r6b-canfail-mutated4.log` line 563) |
| checkbox | Synthetic: the plugin-authored `input[type=checkbox]` rest-state re-grounding block DISABLED, full battery re-run | `sc202-r6b-canfail-mutated4.log`: `CHECKBOX HOST-LEAK VIOLATED`; reverted, confirmed OK by the final battery |
| link token-override | Synthetic: the pre-existing `.dse-card a`/`.dse-feature a`/… `color: var(--dse-accent)` rule DISABLED (so the anchor falls through to Obsidian's `--link-color`), inline sweep temporarily skipped so the probe runs standalone | `sc202-r6b-canfail-mutated5.log`: `LINK TOKEN-OVERRIDE PROBE VIOLATED` |
| button | Not reformulated (§2) — code diff shows 0 functional lines changed in `assertBtnHostLeak` itself (comment-only); its own can-fail property is unchanged from the reviewed SC-203/SC-205 history, not re-derived this round | `git diff 742bcd9..a8bc607 -- visual-harness/shoot.mjs` around `assertBtnHostLeak` |

Every mutation was applied via a Python in-place edit against a saved original, restored
byte-for-byte afterward (`diff` against the saved original confirms 0 residual — checked
before the final confirmation battery), and the FINAL full battery (§8) is the clean,
fully-restored tree.

## 7. Blast radius: 256 of 524 screen shots moved, 0 of 260 print/realprint (brief item 6)

sha256 of every `*--steel-{dark,light,print,realprint}.png`, before (the reviewer's own
independently-verified `sc202-r6arerev-allshots.sha256`, the r6a tip this round is stacked
on) vs after (this round's final battery):

```
524 files total, both before and after
256 moved:  131 *--steel-dark.png + 125 *--steel-light.png
0 moved:    *--steel-print.png (130/130 identical) + *--steel-realprint.png (130/130
            identical) — explicit filename-keyed diff, not hash-collision-prone
```

**SC-202 r6c fold (re-review LOW-2e): this section's own original classification prose is
DELETED here, not retracted 250 lines below.** It sampled `742bcd9` vs `a8bc607` by hand
(two representative pixel investigations) and got two of its own claims wrong (a fabricated
`hero` pixel sample; the right conclusion for `fontFamily` via the wrong reasoning). The
independent review built the decisive experiment instead — a three-way sweep (V0 =
`742bcd9`, V1 = `a8bc607` with the sheet emptied, V2 = `a8bc607` as shipped) that
classifies every one of the 256 moved files by direct measurement rather than a sample of
two. **See "MED-3 — corrected cause table" below for the authoritative attribution** — its
bucket table, both retracted sub-claims named explicitly, and the fix round's own further
movement from `742bcd9` (258, not `a8bc607`'s 256) all live there now instead of being
split across two places in this file.

## 8. Final battery (foreground, logs in this directory)

- `npm run tsc` — clean. `sc202-r6b-tsc-final.log`.
- `npm run lint` — clean. Same log.
- `npm test` (jest) — **3825 passed / 1 skipped / 199 of 200 suites**, 0 failures.
  `sc202-r6b-jest-final.log`.
- `npm run shots` — **524/524 ok, 0 FAIL**; every sweep line prints `OK`; provenance line
  `host sheet: pinned-cache, Obsidian 1.13.7, sha256 f612f1e8f3…`; one expected
  `OBSIDIAN APP.CSS PIN DRIFT` line (installed 1.14.0 vs pinned 1.13.7 — unrelated to this
  round, r6a's own design). `sc202-r6b-shots-final.log`.
- `bash check-freeze.sh <shots>` — **`freeze OK (252/252 …)`**. `sc202-r6b-freeze.log`
  (re-confirmed against the final battery's shots dir).
- **8/8 widening hashes unchanged** (`feature-list`/`title-nested`/`treasure-hr`/
  `perk-links` × print/realprint) — re-hashed against `sc202-r3-widening.txt` +
  `sc202-r4-widening.txt`, byte-identical.
- **0 print/realprint bytes moved** — `sc202-r6b-shadiff-final.txt` (260/260 filename-keyed
  identical); `sc202-r6b-allshots-final.sha256` is the full 524-line after-snapshot.
- `npm run parity` — **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`**, exit
  0. `sc202-r6b-parity-final.log`. `diff` of the declared-deferral text against the r6a
  baseline's own parity log is byte-identical (0 lines) — parity did not move at all
  despite the sheet going on; no owner ruling needed, no `NEEDS_CONTEXT`.

## 9. Camera parity spot-check (brief item 8)

`hero`/`negotiation`/`scc` were named; `scc` cannot be captured by the browser harness at
all — `ds-scc` renders nothing without a synced compendium and the harness carries none
(`NO_FIXTURE_IDS = ['scc']`, `entry.ts`'s own documented exclusion; confirmed:
`--element=scc` produces no harness capture, only the camera's real-vault one). Substituted
`statblock` (public, no special dependency, and — at 7204px tall — the single largest
mover in §7) as the third fixture, noted here for the record.

Method: a width-matched re-render (`width=1020` + `#mount`'s own `max-width:760px` lifted,
matching the camera's real emulated-viewport CSS width) diffed via `magick compare` against
the camera's own real-Obsidian capture (same fixture, same scheme).

- **`negotiation` — clean, close match.** AE (any-difference count) 4.5-9% depending on
  fuzz threshold (5-10%); visually, side-by-side crops are indistinguishable except a
  handful of pixels of horizontal alignment (likely a scrollbar-gutter or viewport-rounding
  difference, not a CSS regression) and ordinary sub-pixel font-hinting variance between
  two independent Chromium renderers. No layout delta.
- **`hero`/`statblock` — high raw AE (68-96%), but NOT a rendering defect.** Visual
  inspection (cropped top regions) shows the two renders are structurally and chromatically
  near-identical — same fonts, same colours, same layout. The large AE is driven almost
  entirely by **compendium content divergence**: both fixtures reference SCC codes
  (`mcdm.heroes.v1/class/fury`, ability bodies, …) that resolve differently between the
  isolated browser harness (no compendium synced at all — every reference prints "Compendium
  not installed") and the real demo-vault camera (has a synced compendium, so references
  resolve to real text of a DIFFERENT length) — a highlighted diff shows the top ~15% of
  each image (before any compendium-dependent content) essentially clean, then a hard
  vertical cutover to "everything differs" once the text streams diverge in length and
  every line below re-wraps differently. This is a **pre-existing measurement limitation**
  of comparing a no-compendium harness against a compendium-backed camera for any
  compendium-referencing fixture — unrelated to this round's own CSS work, and not a
  regression (`negotiation`, which has no such dependency, is clean). Flagged as a
  **Follow-up**, not fixed here (out of this round's scope, and not something this
  round's own changes caused or could fix).

Residual root causes, plainly: font hinting (expected, both fixtures) + compendium content
divergence (`hero`/`statblock` only, a harness/camera environment difference, not a layout
delta). No layout delta found in any of the three.

## 10. Crops for Scott (brief item 7)

Nine files, this directory, `sc202-r6b-{fixture}-{before,after,vault}.png`
(sha256-verified distinct — no accidental duplicate pair):

- **`statblock`** (largest mover) — the power-roll tier-badge region. Before: the badge
  reads noticeably WIDER, with the damage caption sitting further right. After: the badge
  is visibly narrower (the accepted box-sizing truth, §4) and the caption sits a little
  closer to it — no clipping, no overlap. Vault: the real-Obsidian capture of the same
  region, matching the "after" crop's proportions.
- **`hero`** — the character-sheet header + first three info rows. Before/after: the panel
  backgrounds are a shade DARKER in "after" (Cause B, §7 — the real, current Obsidian
  background tokens replacing the stale July vendoring) — a subtle, uniform tonal shift,
  not a hue change. Vault: the real-Obsidian capture of the same header, for comparison
  (note: the compendium-reference lines below the header read different TEXT between
  harness and vault — see §9's documented limitation, not a colour or layout difference).
- **`negotiation`** — the negotiation tracker's title + Patience/Interest rows, the
  cleanest of the three (no table/badge/compendium involvement) — included as the
  "close to a null result" anchor: before/after are nearly indistinguishable to the eye,
  and the vault crop lines up with "after" almost exactly (§9's clean spot-check).

Captions above name colours in words (darker/lighter, narrower/wider), not by hue, per
Scott's colour-blindness.

## Drive-by fixes:

- Inline sweep's host-pass `rest` reading now blurs before sampling (`clearBtnState`),
  closing a same-page leftover-focus bug that predates this round — see §5. Named in the
  commit message.

## Follow-ups:

- **Camera-vs-harness comparison for compendium-referencing fixtures** (`hero`, `statblock`,
  any element whose fixture resolves an SCC reference) cannot be pixel-diffed meaningfully
  against a real vault without either (a) syncing an equivalent compendium into the browser
  harness's own gallery/element captures, or (b) picking fixtures that avoid unresolved
  references. Not attempted this round (out of scope, no CSS consequence) — worth a ticket
  if a future round wants tighter camera-parity coverage for those fixtures specifically.
- **`vars.css`'s remaining fallback tokens are still a 2026-07-10 vendoring**, now
  DEMONSTRABLY stale in ~21 of ~47 places (§7 Cause B) — harmless today only because the
  real sheet always supersedes it for every screen capture (the fallback is only ever seen
  live by print/realprint, which intentionally never load the real sheet at all, and by a
  sweep's own momentary bare pass). Re-vendoring it to the CURRENT real sheet's values was
  considered and rejected this round specifically because doing so would move print/
  realprint's frozen baseline (§3) — a future round that revisits the print path (6c, per
  the ledger) may want to reconsider `vars.css`'s role entirely rather than patch it again.

---

## Fix round (2026-09-08)

**Executive summary.** Independent review of `a8bc607` (`sc202-r6b-review.md`):
FIX-ROUND-NEEDED, 2 HIGH / 4 MED / 3 LOW. Both HIGH findings were real and are now closed
by measurement, not assertion: **HIGH-1** (`vars.css`'s "floor" was a ceiling — 19
fake-wins) → **0/28 sampled tokens fake-win now**, fixed with `:where()`. **HIGH-2** (a
genuine un-re-grounded leak — bare `<p>`/`<img>`/`caret-color`) → new `assertProseHostLeak`
sweep, 0 diffs, re-grounded the same way every other family in this file is. Two commits:
`59cd766` (harness mechanics — HIGH-1, MED-1, MED-2, LOW-1) and `d0fed38` (theme CSS —
HIGH-2). Battery: tsc/lint clean; jest **3830/1sk/200-of-201** (+5 tests, +1 suite, the new
prose guard); shots **524/0**, all nine gate lines `OK` incl. the new `prose host-leak OK`
line; `freeze OK (252/252)`; 8/8 widening unchanged; **0 of 260 print/realprint bytes
moved**; screen movement vs `742bcd9`: **258** (SC-202 r6c fold, review LOW-2a: the
187 figure this report originally gave here was measured against `a8bc607`, not
`742bcd9` — 6 of the shots that had moved from `742bcd9` to `a8bc607` return to
`742bcd9`'s own bytes across this fix round's two commits, so the count from the true
`742bcd9` baseline is 258, not 187 — see §"Moved-shot attribution" below); parity
**0/0/16**, unchanged. `party--steel-{dark,light}`'s AE against
its `742bcd9` bytes closed from **350,232px (20.8%) to 384px (0.02%)** — the p-margin leak
is fixed; a small, deterministic, honestly-reported residual remains (see HIGH-2's own
closure below) — **byte-identity with `742bcd9` was not fully achieved**, flagged for the
owner.

### Per-finding closure

**HIGH-1 — `vars.css` floor → `:where()` fix.** `visual-harness/vars.css`: both
`body.theme-dark`/`body.theme-light` blocks wrapped in `:where(...)`. Measured with a
standalone Playwright probe (all 30 tokens the review sampled, both schemes, against the
real pinned sheet's own resolved values): **fake-wins 19 → 0, hybrids 2 → 0** (0 of 28
tokens sampled in the final probe still fake-win). `freeze OK (252/252)`, 0 print/realprint
bytes moved. **139 additional screen shots move** (the tokens finally taking effect,
confirmed by sha diff against the reviewer's own `sc202-r6brev-allshots-run1.sha256`
baseline) — unfrozen, inside 6b's own no-sanction fence.

**MED-1 — button + chrome now navigate under the sheet.** `assertBtnHostLeak` and
`assertChromeHostLeak` (`visual-harness/shoot.mjs`) now send `sheet: '1'` and call
`setHostSheetEnabled(page, false)` before their bare sample — same "disable-for-bare" shape
every other sweep in the file uses. `injectHostCss`/`OBSIDIAN_HOST_BUTTON_CSS` (their own
hand-modeled host, unrelated to `dist/obsidian-app.css`) is unchanged. Can-fail re-proven
under the new formulation in an isolated copy: disabling the button family's 90-line
re-grounding block → `BUTTON HOST-LEAK VIOLATED`
(`sc202-r6bfix-canfail-button.log`); mutating the chrome panel button's own `box-shadow:
none` → `0 0 3px red` → `CHROME HOST-LEAK VIOLATED` (`sc202-r6bfix-canfail-chrome4.log`).
Both restored, re-verified clean in the final battery.

**MED-2 — sheet-applied verification + a second race the proof surfaced.**
`setHostSheetEnabled` (`visual-harness/shoot.mjs`) now reads a sentinel
(`--list-indent`, real sheet: `calc(0.5625em * 4)`; `vars.css` fallback: literal `2em`) in
a SEPARATE round-trip after every toggle and throws if the resolved value does not match
what was requested. Proven: an emptied `dist/obsidian-app.css` now makes the very first
`setHostSheetEnabled(page, true)` call throw, instead of every sweep silently reporting
"OK" against nothing (the review's own `sc202-r6brev-v1-shots.log` reproduced the old
silent-pass). **A second, related bug surfaced while proving this and needed its own fix**:
re-enabling the link is a genuine async fetch+parse of a 637 KB `file://` file, not a
synchronous re-attach — `link.disabled === false` with `link.sheet === null` (still
loading) was reproducible live, and NOT only on the sweeps' own toggle — the very FIRST
mount of any `sheet=1` navigation could race it too. `applyRealObsidianCascade`
(`visual-harness/entry.ts`) now awaits the link's `load`/`error` event (backed by a poll)
before `mountFromParams` returns. Both fixes together make the full battery deterministic
across three separate runs.

**LOW-1 — box-sizing/overflow-wrap → absolute assertion.** `boxSizing`/`overflowWrap`
removed from `TABLE_CELL_PROPS`'s relative comparison (which could never fail — the wrapper
rule that supplies them is untoggled by design) and checked as an ABSOLUTE assertion
instead: every sampled cell's `boxSizing === 'border-box'` / `overflowWrap ===
'break-word'` under the sheet. 170 cells checked in the final battery
(`sc202-r6bfix-shots-final3.log`, table host-leak's own line).

**HIGH-2 — the prose (p/img/caret-color) leak, re-grounded.** New CSS block in
`styles-source.css` ("SC-202 r6b fix round — PROSE (p/img/caret-color) HOST
RE-GROUNDING"), same `:is([data-dse-element], .dse-modal):not([data-dse-print="on"])
:where(…)` anchor every other family uses: bare `<p>` restated to `margin-block: 1em`
(the UA default this file already rendered), `<img>` to `max-width: none` /
`image-rendering: auto`, the plugin root to `caret-color: auto`. `.dse-md-inline > p` is
now `[data-dse-element]`-prefixed (mirrors r3's own HIGH-1b fix for the sibling
`.dse-md-inline > ul`) so it keeps beating the new broader `<p>` rule in its own inline
context — verified: no other bare occurrence of the old, unprefixed selector remains
(`test/dom/theme/proseHostRegrounding.test.ts`'s own guard). New `assertProseHostLeak`
sweep (`visual-harness/shoot.mjs`), rest only, dark + light, two visits (`gallery` for
`<p>` coverage — no default fixture renders a real `<img>`; `initiative/roster` for the 9
real `<img>` portraits the review's own census found): **99 bare `<p>` [198 comparisons] +
9 `<img>` [18 comparisons] + caret-color at 33 plugin roots [66 comparisons] — 0 diffs, both
schemes.** Can-fail proven by disabling each of the three re-grounding rules in an isolated
copy and observing `PROSE HOST-LEAK VIOLATED` (`p`: `LIST HOST-LEAK`-style block removal
reproduced `0 bare <p> found` is a DIFFERENT, blindness-shaped failure mode also proven
separately during development — see the sweep's own two-visit design above, added
specifically because the first version of this sweep was blind to `<img>` on the default
`gallery` page). jest guard: `test/dom/theme/proseHostRegrounding.test.ts`, 5 tests, mirrors
the sibling `*HostRegrounding.test.ts` files' source-text-contract shape.

**The acceptance test — `party--steel-{dark,light}` vs `742bcd9` bytes — partially met,
reported honestly.** Regenerated the `742bcd9` baseline in a throwaway sibling worktree and
compared: **`party--steel-dark` AE 350,232px (20.8%) on `a8bc607` (before this fix round) →
384px (0.02%) after** — the p-margin leak (the review's own named "sole cause" of this
shot's movement) is closed, a 99.89% reduction, reproducible and deterministic across
repeat runs (checked twice). **The remaining 384px did NOT close to true byte-identity.**
Investigated: the diff is small, deterministic (not a rendering race — reproduced
identically across two separate `npm run shots -- --element=party` runs on the final
committed tree), and visually isolated to a dotted, focus-ring-shaped outline around the
"Renown -" stepper button in both party members' rows — consistent with HIGH-1's own token
fix changing `--interactive-accent` from a literal hex (`#7f6df2`, the old fake) to the
real sheet's `hsl(258, 88%, 66%)` (the same colour, numerically, but a different computed
value string feeding `--dse-focus-ring: var(--interactive-accent, currentcolor)` — a
plausible but NOT fully confirmed source of a hairline rendering difference at a
box-shadow's antialiased edge). This was not chased further given the time available —
flagged here as a Follow-up (below), not hidden. It does not call either fix's own
correctness into question: `TABLE_CELL_PROPS`'s absolute assertion, the fake-win count and
the prose sweep's own 0-diff result are each independently verified through their own
dedicated mechanism, not through `party`'s byte-identity.

### MED-3 — corrected cause table (replaces §7 above)

The independent review built the decisive experiment (three full 524-shot sweeps — V0 =
`742bcd9`, V1 = `a8bc607` with the injected sheet emptied, V2 = `a8bc607` as shipped) and
classified every file. That matrix, not this report's own original §7 sampling, is the
authoritative attribution for the ORIGINAL `a8bc607` commit's own 256 moved shots:

| bucket | count |
|---|---|
| print/realprint, unmoved | 260 |
| screen, unmoved | 8 |
| screen, moved by sheet content only | 74 |
| screen, moved by wrapper + box-sizing only | 2 (`statblock-sticky-narrow--steel-{dark,light}`) |
| screen, moved by both | 180 |

Two sub-claims in the original §7 were wrong and are retracted, not merely superseded:
"hero's panel fills: a sampled pixel moved from rgb(30,36,39) to rgb(48,53,56)" — the
review found **zero** `color`/`backgroundColor` changes across hero's 217 plugin nodes
between the wrapper-only and shipped states; the real cause of that report's own pixel
sample was elsewhere. "Cause C — font rendering … sub-pixel" — right conclusion (fontFamily
IS inert for plugin text, the bundled `Source Serif 4` wins in both harness and vault), but
for the wrong reason: it changes on every node, but is invisible because the SAME primary
face is selected either way, not because the change is merely small.

**This fix round's own two commits move the picture further**, from `742bcd9` (not
`a8bc607`) as the reference point: **258 of 524 screen shots** now differ from `742bcd9`
(0 of 260 print/realprint) — SC-202 r6c fold (review LOW-2a) corrects this report's
original "187" here, which was measured against `a8bc607`, not `742bcd9`; 6 of the shots
`a8bc607` had moved return to `742bcd9`'s own bytes across this fix round's two commits
(HIGH-2's `<p>`/`img` re-grounding, `party` chief among them), which is why the two counts
differ. HIGH-1's token fix additionally moves 139 that had previously — incorrectly —
appeared to already match the real sheet.

### MED-4 / LOW-2 — crops re-shot at the matched regions, captions corrected

The three "after" crops (`sc202-r6b-{statblock,hero,negotiation}-after.png`, this
directory) were re-shot on the fix round's final committed tree at the SAME matched
region/crop-box/scale the independent review established (harness `#mount` width-matched
to the vault's 1020 CSS-px reading pane, native 2×, downscaled to 900px wide for shipping)
— `.dse-head` (statblock), `.dse-hero` top 175px (hero), `.dse-nt` top 300px (negotiation).
"Before" and "vault" crops are unaffected by this round's code (before = `742bcd9`,
unchanged by definition; vault = a real, separately-run Obsidian capture) and were kept as
the review shipped them. All 9 files remain distinct sha256 (listed at the end).

**Measured, corrected captions** (colours in words, per Scott's colour-blindness; **not**
claiming "after == vault" — see LOW-3):

- **`statblock` head band.** Before → after: **0.03%** of pixels differ (SC-202 r6c fold,
  review MED-5/LOW-2a/LOW-2e — this caption originally said 46.1%, measured against an
  `sc202-r6b-statblock-after.png` that was NOT reproducible from `d0fed38`; the file at
  that path is now the reviewer's own `sc202-r6brerev-statblock-after-reproducible.png`,
  and 0.03% is what it actually measures against "before"). After vs vault: still a large
  residual (49.3% at an 8%-fuzz threshold) — **not new, and not a token or CSS problem**:
  LOW-3 (below) is the measured cause.
- **`hero` header.** Before → after: 14.1% of pixels differ, mostly the token floor fix's
  own colour corrections; **no layout shift**. After vs vault: 5.7% at an 8%-fuzz
  threshold — close, consistent with ordinary font-hinting variance between two independent
  Chromium builds.
- **`negotiation` title/Patience/Interest.** Before → after: 54.2% of pixels differ (again
  the token floor fix). After vs vault: 6.2% at an 8%-fuzz threshold — close, same font-
  hinting-only residual shape as `hero`.

### LOW-3 — recorded, no code change

The camera's own Obsidian runs on a 2022-era Electron shell (`Chrome/106.0.5249.199`) that
does not support `color-mix()`/`oklch()` — confirmed by the independent review
(`CSS.supports` both `false`). Every Steel surface using `color-mix()` (the statblock head
band's `@supports` branch, several of Obsidian's own pinned 1.13.7 tokens) falls back in
the CAMERA specifically, not in the harness or in a modern real vault. This is why the
statblock head band's after-vs-vault residual stays large even after this round's fixes,
and it is a camera/environment limitation, not a harness or plugin defect — recorded here
for the owner to carry to the final ask (and, per the review's own recommendation, to a
possible SC-287-adjacent follow-up ticket about the camera's Electron floor), not fixed in
this round.

### Battery (foreground, logs in this directory, prefix `sc202-r6bfix-`)

- `npm run tsc` / `npm run lint` — clean. `sc202-r6bfix-tsc-final.log`.
- `npm test` (jest) — **3830 passed / 1 skipped / 200 of 201 suites**. `sc202-r6bfix-jest-final.log`.
- `npm run shots` — **524/524 ok, 0 FAIL**, run three times across the fix round (twice to
  find and fix the two `assertProseHostLeak` visit-coverage bugs, once definitive
  post-commit) — final: `sc202-r6bfix-shots-postcommit.log`. All nine gate lines `OK`,
  including the new `prose host-leak OK` line. Provenance/drift lines unchanged from
  earlier rounds.
- `bash check-freeze.sh` — **`freeze OK (252/252 …)`**, checked on the post-commit tree.
- **8/8 widening hashes unchanged** (re-verified post-commit).
- **0 of 260 print/realprint bytes moved** (`sc202-r6bfix-shadiff-postcommit.txt`, explicit
  filename-keyed diff); **258 of 524 screen shots moved** vs `742bcd9` (SC-202 r6c fold,
  review LOW-2a — corrected from this report's original "187", which was vs `a8bc607`;
  full snapshot: `sc202-r6bfix-allshots-postcommit.sha256`).
- `npm run parity` — **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`**,
  unchanged. `sc202-r6bfix-parity-postcommit.log`.

### Artifacts

Commits: `59cd766` (harness mechanics), `d0fed38` (theme CSS). Report: this file. Gate
logs, can-fail logs and sha snapshots: `sc202-r6bfix-*` in this directory (tsc/lint/jest ×2,
shots ×5 across the round's iteration + the definitive post-commit run, freeze ×2, parity
×2, canfail-{button,chrome}×several as the chrome mutation was re-attempted after two
false starts — see the logs' own timestamps). Crops: `sc202-r6b-{statblock,hero,
negotiation}-{before,after,vault}.png` (9 files, this directory, after-files re-shot this
round, sha256-verified distinct).

## Drive-by fixes (fix round):

- None beyond what the review itself prescribed — this round's every change traces to a
  named finding.

## Follow-ups (fix round):

- **SC-202 r6c fix round (independent review MED-2) — the party residual's attribution
  below was WRONG and has been corrected**, per the r6b re-review's own RULING (category
  (a)): the `party--steel-dark` residual is the true `--background-primary` (`#1e1e1e` →
  `#1C1C1C`) at the shot edge — ~171 of the 384 dark px — **plus** a sub-pixel repaint
  artefact of the page now laid out as a real reading view (app.css chunks 251–271) for
  the remainder. The light-scheme counterpart WAS measured (not skipped): 19,860 px =
  **1.19%**. **NOT** the focus ring, **NOT** `--interactive-accent` — that attribution
  (below, kept for the record, not repeated) is disproven and must not reach the ticket.
  Worth a short, targeted follow-up if the owner wants true byte-identity with `742bcd9`
  for `party` rather than the 99.89%-closed state this round ships.
- ~~The 384px `party--steel-dark` residual (and its light-scheme counterpart, not
  separately measured under time pressure) is unexplained beyond a plausible-but-unverified
  link to `--interactive-accent`'s hex-vs-hsl representation reaching `--dse-focus-ring` on
  the Renown stepper buttons specifically.~~ Retracted by the bullet above — kept struck
  through, not deleted, so the wrong attribution's own text stays visible as the thing that
  was corrected (SC-202 r6c fix round).
- LOW-3's camera/Electron-floor limitation (recorded above) — the review's own suggested
  follow-up ticket (camera Electron floor, SC-287-adjacent) was not filed by this worker
  (workers never touch the tracker) — for the owner to file if wanted.
