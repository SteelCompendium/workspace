# SC-202 round 6c — INDEPENDENT REVIEW of realprint option C (`d0fed38..f8bc63a`)

**Verdict: FIX-ROUND-NEEDED.** One HIGH (the delta assertion is provably blind to the exact
accident it replaced twin==realprint to catch), one MED (the shipped `statblock` PDF
ground-truth panel is a blank page, yet the report claims it matches), one MED (a folded
report correction was not applied), plus LOWs.
- **Item 1 verdict — the 32-property allowed set IS too permissive, HIGH, can-failed:** on
  non-control plugin DOM only **4** properties ever differ (`color`, `fontFamily`,
  `webkitPrintColorAdjust`, `backgroundImage`); the other 28 permissions are dead, and a
  screen-only plugin rule repainting `.dse-card__band` moved **19 twin shots, 0 realprint
  shots** and the gate still printed `print-twin delta OK` and exited 0.
- **Rebaseline integrity verdict — CLEAN, no findings.** Three of my own clean sweeps
  byte-identical (0 diff lines / 524 PNGs); `sc202-r6c-rebaseline.txt` = 252/252 `OK` on
  each; its name set is *identical* to the live baseline's 252 names (pure replacement, 0
  added / 0 removed); the 8 widening lines verify and are additions-only with unchanged
  names; all 260 print-class shots in the dir are covered; `FREEZE VIOLATED (252 checksum
  mismatches, 0 missing)` and the mismatch name set diffs empty against the rebaseline
  both ways; 0 of 264 `*--steel-{dark,light}` bytes moved.
- Battery on `f8bc63a` reproduces the report exactly: tsc/lint clean; jest 3832/1sk/200-of-201;
  shots 524/0 with all 14 OK gate lines; parity 0/0/16 LAST, exit 0.
- Twin ≠ realprint now holds for **130/130** ids (was 126/126 byte-identical); max vertical
  drift **2.00 px**.

---

## Method

Worktree `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements`
at `f8bc63a` (clean at entry and at exit — `git status --porcelain` empty both times, no
stashes, `visual-harness/shoot.mjs` and `styles-source.css` restored byte-identical:
`84df2c27…` / `97f1d41a…`; `main.js`/`styles.css` removed per protocol; `visual-harness/dist/`
intact). The shared freeze baseline was never written. Every gate foreground, output
redirected, parity last.

---

## HIGH-1 — the delta assertion cannot catch a screen-only plugin rule leaking into the print pair

`visual-harness/shoot.mjs:4801` (`printSheetEnumeratedProperties`) →
`visual-harness/shoot.mjs:4943-4952` (the style-diff loop).

### What I measured

I instrumented `assertPrintTwinDelta` to record *every* differing property before any
allow-listing, ran the full 524-shot sweep, and split the result by whether the node is
`nativeControlAdjacent` (artifact:
`sc202-r6crev-property-census.json`).

| property | nodes differing | ids | on native-control nodes | on **plugin DOM** | in allowed set |
|---|---:|---:|---:|---:|---|
| `fontFamily` | 18,074 | 130 | 3,487 | **14,587** | yes |
| `webkitPrintColorAdjust` | 17,381 | 130 | 3,489 | **13,892** | yes |
| `color` | 14,175 | 130 | 2,651 | **11,524** | yes |
| `boxShadow` | 428 | 66 | 428 | **0** | no (excused by `NATIVE_CONTROL_PAINT_PROPS`) |
| `backgroundColor` | 316 | 74 | 316 | **0** | yes |
| `backgroundImage` | 1 | 1 | 0 | **1** | yes |

**On non-control plugin DOM exactly four properties ever differ**: `color`, `fontFamily`,
`webkitPrintColorAdjust` — the ruling's own three — plus `backgroundImage` on a single node
(`perk-links#21 <a class="external-link ds-scc-web">`, which is app.css's own
`.print .external-link { background: none }` stripping the icon gradient). Everything else
control-side is already covered by the separate two-property native-control widening.

So **28 of the 32 permissions are dead**. 17 of those are on properties the sweep does not
even sample (`width`, `height`, `overflow`, `contain`, `appearance`, `MozAppearance`,
`webkitAppearance`, `alignItems`, `justifyContent`, `maxHeight`, `borderRadius`, `textIndent`,
`textOverflow`, `paddingTop`, `paddingRight`, `background`, `border`) — inert. But **11 are
live over-permissions**: `backgroundColor`, `display`, `textShadow`, and the eight
`border{Top,Right,Bottom,Left}{Width,Style}` longhands are all sampled *and* excused, and
never legitimately differ.

### Why the enumeration is wrong in principle

`printSheetEnumeratedProperties` takes the union of every declaration in **every** `@media
print` block in the pinned sheet, with no regard for whether the rule's selector can reach
plugin DOM. The pinned `dist/obsidian-app.css` (`f612f1e8…`) has five such blocks. Only
these can ever match inside `.print > .markdown-preview-view > #mount`:

```
.print .markdown-preview-view { -webkit-print-color-adjust: exact; color: initial; height: unset !important }
.print .markdown-preview-view mark { color: initial }
.print .external-link { background: none; padding-right: 0 }
* { text-shadow: none !important }
body { --font-text: var(--font-print) !important }
```

Everything else is PDF.js form-field internals (`.xfaTextfield`, `.xfaSelect`), Obsidian
window chrome (`.titlebar`, `.app-container`, `.progress-bar`, `.popover`,
`.suggestion-container`, `body > :not(.print)`), `webview`, `::-webkit-scrollbar`,
`.bases-toolbar`, `.pdf-embed`, `code[class*="language-"]`. **The `backgroundColor`
permission — the exact one the can-fail below drives through — originates from
`.xfaSelect { background: transparent }`, a PDF.js XFA form-field rule that can never match a
plugin node.** `display` comes from `body > :not(.print) { display: none !important }` and the
chrome list. The eight border longhands come from `.pdf-embed … .canvasWrapper { border: … }`.

### Can-fail — proof (non-vacuous)

**A. The hole.** Appended to `styles-source.css` a screen-only, paint-only rule on a
non-control plugin node:

```css
@media screen {
  [data-dse-theme='steel'] .dse-card__band { background-color: rgb(1, 2, 3) !important; }
}
```

Result (`sc202-r6crev-canfail-A-background.log`): sweep exit **0**, gate line
`print-twin delta OK (130 capture ids: …)`. The injection was real, not inert — it moved
**19 `*--steel-print.png` shots and 0 `*--steel-realprint.png` shots**, i.e. a visible,
one-sided divergence between the two surfaces on 19 capture ids, invisible to the gate.

**B. Control, same node, same rule shape, non-allowed property**
(`box-shadow: 0 0 0 1px rgb(1,2,3)`) → `sc202-r6crev-canfail-B-boxshadow.log`: exit **1**,
`PRINT-TWIN DELTA VIOLATED — 130 capture id(s) compared, 48 problem(s) found`, naming
`ancestry#15 <div class=dse-card__band>: boxShadow differs …`. So the traversal reaches the
node and samples it; **A passes solely because of the allow-list**.

### Prescribed fix (proved, zero pixel cost)

Intersect the sheet-derived vocabulary with the set that can actually reach plugin DOM. The
minimum viable form is two lines at the end of `printSheetEnumeratedProperties`
(`shoot.mjs:4815`):

```js
const MEASURED = new Set(['color', 'fontFamily', 'webkitPrintColorAdjust', 'backgroundImage']);
for (const p of [...props]) if (!MEASURED.has(p)) props.delete(p);
```

I ran both halves:
- clean tree, narrowed set → `print-twin delta OK (130 capture ids: … backgroundImage, color,
  fontFamily, webkitPrintColorAdjust)`, exit 0, and **0 of 524 shots changed bytes** — no
  rebaseline impact whatsoever (`sc202-r6crev-fix-narrowed-clean.log`).
- narrowed set + can-fail A → exit 1, `PRINT-TWIN DELTA VIOLATED … 48 problem(s)`, naming
  `backgroundColor differs — "rgb(1, 2, 3)" (twin) vs "rgba(0, 0, 0, 0)" (realprint)`
  (`sc202-r6crev-fix-narrowed-canfailA.log`).

The principled version, preferable if the owner wants it robust to a future pin bump: keep
deriving from `iterRules`, but admit a property **only from rules whose selector can match a
node in the captured subtree** (test `node.matches(sel)`, or ancestor-match for the
inherited `color`/`-webkit-print-color-adjust`/`--font-text` cases), and scope
`backgroundImage`/`paddingRight` to `.external-link` rather than granting them globally.
Either way the hard-coded floor above should be asserted so a pin bump cannot silently
re-widen the set.

---

## MED-1 — the shipped `statblock` PDF ground-truth panel is a blank page; the report claims it matches

`sc202-r6c-realprint-statblock-pdf.png` (1275×1650, 11,366 bytes) contains ink on **32 rows
only (y=136–167), 2,401 ink pixels total** — the note-title `h1` "statblock" and nothing
else. For comparison `sc202-r6c-realprint-feature-pdf.png` has ink on 393 rows / 33,481
pixels. The statblock card is entirely absent.

The report nevertheless asserts (§8): *"**Yes, matches** — both `feature` and `statblock`
real PDFs … Visually close to the harness's own `--steel-realprint` captures at every fixture
inspected"*, and (§10) *"**`statblock`**: … Matches the real PDF crop."* Half the PDF
ground-truth evidence for the sanction ask does not exist.

This is not intrinsic to the fixture. I produced my own PDF of the same realprint surface
(Playwright `page.pdf({format:'Letter'})` over the harness at the realprint params — the same
Chromium `printToPDF` path Obsidian calls): 3 pages, **page 1 fully rendered**, black-on-white
serif, crimson spine bar, red/orange/green tier pills, bordered "Level 3"/"Leader"/"EV 20"
chips — region-for-region equal to `sc202-r6c-realprint-statblock-after.png`. Artifact:
`sc202-r6crev-statblock-pdf-page1-reproduced.png`. `break-inside` on the card computes `auto`,
so pagination does not explain a blank first page either.

Most likely cause: the export was captured before the plugin's async code-block
post-processor finished mounting into the export popup (Obsidian's `printToPdf` sleeps 200 ms
and does not await plugin renders). **Fix:** re-export `statblock` waiting for the element to
mount, or withdraw the statblock match claim and ship only `feature` as PDF ground truth.
Compounding this: **no real PDF was retained** — only rasterized PNGs — so the claim is not
independently checkable from the shipped artifacts.

`feature`'s panel is genuine and the claim about it holds, including the glyph substitution —
see MED-3 below.

---

## MED-2 — a folded r6b report correction was not applied (the party attribution)

The r6c brief's fold list required: *"correct the party residual's attribution per the
re-review (true `--background-primary` at the edge + sub-pixel repaint of a real reading-view
layout; light 1.19 %, NOT the focus ring, NOT `--interactive-accent`)"*. The r6b re-review
(`sc202-r6b-review.md:585`) states the old attribution *"is wrong and must not be repeated on
the ticket."*

`sc202-r6b-report.md:612-617` still reads:

> The 384px `party--steel-dark` residual (and its light-scheme counterpart, **not separately
> measured under time pressure**) is unexplained beyond a plausible-but-unverified link to
> **`--interactive-accent`**'s hex-vs-hsl representation reaching **`--dse-focus-ring`** on the
> Renown stepper buttons specifically.

Both halves are stale: the light counterpart *was* measured (19,860 px, 1.19 %), and the
focus-ring/`--interactive-accent` attribution was disproven. Nothing in the report carries the
corrected reading (`grep` for `1.19` / `background-primary at the edge` / `sub-pixel repaint`
in `sc202-r6b-report.md` → no hits). **Fix:** replace that follow-up bullet with the
re-review's §"RULING" text (category (a); ~171 of 384 dark px are `--background-primary`
correctly showing the vault value at the shot edge; the remainder a sub-pixel repaint of a
real reading-view layout box, app.css chunks 251–271; light 1.19 %).

The other four folds *did* land, verified:
- **MED-5 crop replaced** — `sc202-r6b-statblock-after.png` now hashes `bddd573b…`, identical
  to `sc202-r6brerev-statblock-after-reproducible.png`; caption corrected to 0.03 %
  (`sc202-r6b-report.md:550`).
- **Counts corrected** — 258 vs `742bcd9`, 6 returned, 187-was-vs-`a8bc607` (`:405-409`).
- **§7 retracted text deleted in place** (`:272`, "DELETED here, not retracted 250 lines
  below").
- **LOW-2c** — `vars.css` comment now says (0,0,0), which is correct: `:where()`'s entire
  argument contributes zero specificity.
- **LOW-2b** — both chrome and button sweeps now call `setHostSheetEnabled(page, true)` before
  the bare pass (`8a9e130`); that helper throws `OBSIDIAN APP.CSS NOT APPLIED` when
  `--list-indent` ≠ `calc(0.5625em * 4)`, so an emptied sheet fails them by construction.
- **LOW-2d** — all six inherited properties re-grounded to `initial`; the prose gate line now
  reads `7 root-inherited properties (caret-color + the SC-202 r6c fold's six) [462]`, and I
  measured **0 of 264** screen-combo bytes moved across the whole `d0fed38..f8bc63a` range.

---

## MED-3 — realprint chain and PDF ground truth: both confirmed

**Item 2 — no findings.** I extracted `app.js` from the pinned `obsidian-1.13.7.asar` and read
`printToPdf()` directly. Verbatim from the minified source:

```js
t=window.open("about:blank","_blank","popup,hide=true") … [4,sleep(200)];case 1:
l.sent(), i.body.removeClass("theme-dark"), i.body.addClass("theme-light"),
r=i.body.createDiv("print")
```

and its `print()`:

```js
i=e.createDiv("markdown-preview-view markdown-rendered"),
i.toggleClass("rtl", …), i.toggleClass("show-properties","hidden"!==o.vault.getConfig("propertiesInDocument"))
```

So the real chain is `body > .print > .markdown-preview-view.markdown-rendered.show-properties`
with `theme-light` forced unconditionally — exactly what the report claims, including the
absence of the reading pane's `node-insert-event`/`allow-fold-*`/`show-indentation-guide`
(those come from the workspace `MarkdownRenderer` path `printToPdf` never takes). I then read
the harness's own chain live:

```
body.theme-light > div.print > div.markdown-preview-view.markdown-rendered.show-properties > div#mount
  bodyClass="theme-light"  (combo bg is 'dark')   data-dse-print="on"
```

Identical. `#mount` is a direct child of `<body>` in `visual-harness/index.html:35`, so
`.print` really is `body > .print` and app.css's `body > :not(.print) { display:none }`
scoping behaves as in the real export. Print media is emulated before `goto`, and
`data-dse-print` is stamped by the plugin's own `watchPrintMedia`, not faked.

**Item 3 — `feature` panel verified region by region.** Colours named for Scott:

| region | after (harness) | pdf (real export) |
|---|---|---|
| ground | white | white |
| body/heading ink | black, serif | black, serif |
| "5 Malice" chip | grey outline, top-right | grey outline, top-right |
| "Villain Action 1" chip | black outline | black outline |
| tier 1 / 2 / 3 / crit pills | red / orange-amber / green / gold outlines | same four, same order |
| right-aligned "Main action" / "One creature" | present | present |

**The glyph substitution claim is true and verified in the real PDF**: the tier-1 badge reads
**"²11"** (a superscript-two) in `sc202-r6c-realprint-feature-pdf.png`, and **"≤11"** in
`sc202-r6c-realprint-feature-after.png`. Present in the PDF, absent from the harness, as the
report says.

**The owner's own read is correct and it is page geometry, not a rendering delta.** The PDF
panels are 1275×1650 = US Letter at 150 dpi, a whole page including the export's `includeName`
`h1` and the page margins; the after panels are 1520-px-wide element captures with no page box.
Nothing about the card itself is narrower.

---

## MED-4 — 126 of the 252 rebaselined lines still photograph a dark-on-dark surface, and no crop in the ask shows it

The three before/after crop pairs are all `--steel-realprint`. The **twin** — the other half
of the frozen class, `*--steel-print.png`, 126 of the 252 moved lines — is unchanged in
character: `visual-harness/shots/featureblock--steel-print.png` on the final tree is still
near-black ground with very dark grey headings ("Angulotl Malice", "Leapfrog", "Resonating
Croak", "Rainfall") and near-invisible "3/5/7 Malice" labels. It is now serif (the font fix
reaches it) but it is not legible.

This is defensible under the ruling — the twin is deliberately "the vault's actual theme" —
but the ask as currently framed shows Scott three dark-on-dark → black-on-white pairs and asks
him to sanction 252 lines, half of which still look like the "before" panel. **Fix:** add one
twin before/after pair to the crop set, or say in the ask, in one sentence, that 126 of the
252 lines are the in-app preview twin and still render on the vault's dark ground by design.

Worth flagging for the owner's judgement, not blocking: Obsidian has no live print preview —
its only print path is the Export-to-PDF popup, which is `realprint`. The twin is a
harness-only construct (`?print=1` in screen media); no user ever sees it. The report's phrase
"the print preview inside the app" reads as if a user surface is being pinned.

---

## LOW-1 — the report's executive summary says 30 properties; there are 32

`sc202-r6c-report.md` line 8: *"style diff limited to the pinned sheet's own enumerated
`@media print` properties (**30 properties**, listed in §3)"*. §3's own list, and the gate line
itself, enumerate **32**. Cosmetic, but this number is quoted into the ask.

## LOW-2 — the before/after crop pairs are not at the same crop box

`feature` before/after are both 1520×1092 (comparable). `hero` is 1566 → 1546 and `statblock`
4114 → 4206 — the pairs are full captures of differently-tall renders, not the same crop box
the brief asked for. The change is plain enough to read anyway, but the pairs cannot be
flipped or diffed. All 8 files are sha256-distinct (checked; no repeat of round 5's identical
pair).

## LOW-3 — the report's own honest limit is understated for the light vault

Item 8, measured. I probed 10 fixtures under `data-dse-print="on"` in screen media with the
sheet on, dark vs light vault (`sc202-r6crev-lightgap.log`): **10 of 10 fixtures differ**, and
**1,554 of 1,993 nodes (78 %)** — `color` on 1,540 nodes (rgb(218,218,218) dark vs
rgb(34,34,34) light), plus `backgroundColor` on 103 and `boxShadow` on 116, and the four
border-colour longhands on ~1,400 each. So the uncovered light-vault twin is not a corner: it
is a third surface differing from the pinned one on roughly four fifths of all plugin nodes.
The report's §7 ("the SAME gap that existed before this round") is accurate but gives no
magnitude; the ask should carry the number, and the two leak fixes this round made
(`.dse-stamina__pill`, `.dse-init__portrait-fallback` — both raw-Obsidian-token
background-colours) are exactly the failure class that surface would expose.

---

## Battery on `f8bc63a` (verbatim)

```
npm run tsc                 exit 0, clean            sc202-r6crev-tsc.log
npm run lint                exit 0, clean            sc202-r6crev-lint.log
npx jest                    Test Suites: 1 skipped, 200 passed, 200 of 201 total
                            Tests:       1 skipped, 3832 passed, 3833 total
                            Snapshots:   3 passed, 3 total          sc202-r6crev-jest.log
npm run shots               524 PNGs, 0 FAIL, exit 0; 14 OK gate lines
                            host sheet: pinned-cache, Obsidian 1.13.7, sha256 f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41
                            (OBSIDIAN APP.CSS PIN DRIFT — installed 1.14.0 vs pinned 1.13.7: expected)
check-freeze.sh             FREEZE VIOLATED (252 checksum mismatches, 0 missing)      exit 1 — EXPECTED
sha256sum -c rebaseline     252 OK / 252, exit 0 (on each of three sweeps)
npm run parity  (LAST)      **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**  exit 0
```

Gate line, verbatim:

```
print-twin delta OK (130 capture ids: same DOM, no horizontal/size drift, max vertical drift 2.00px (< 24px), every differing computed-style property is one of the pinned sheet's own @media print properties: MozAppearance, alignItems, appearance, background, backgroundColor, backgroundImage, border, borderBottomStyle, borderBottomWidth, borderLeftStyle, borderLeftWidth, borderRadius, borderRightStyle, borderRightWidth, borderTopStyle, borderTopWidth, color, contain, display, fontFamily, height, justifyContent, maxHeight, overflow, paddingRight, paddingTop, textIndent, textOverflow, textShadow, webkitAppearance, webkitPrintColorAdjust, width)
```

All 14 OK lines present: chrome placement, montage track widths, chrome host-leak, host-copy
pin, button host-leak, input host-leak, table host-leak, list host-leak, inline host-leak,
link token-override probe, checkbox host-leak, prose host-leak, print-twin delta, nested
corner-radius.

## Rebaseline integrity (item 5) — full detail

- Three independent clean sweeps (`rm -rf visual-harness/shots` before each):
  `sc202-r6crev-allshots-run{1,2,3}.sha256` — run1↔run2 and run2↔run3 both diff to **0 lines**
  across all 524 PNGs.
- `sha256sum -c sc202-r6c-rebaseline.txt` from the shots dir → **252 `OK`, 0 failures**, on
  each sweep.
- `sha256sum -c` on `sc202-r6c-r3widening-update.txt` (6 lines) and
  `sc202-r6c-r4widening-update.txt` (2 lines) → all `OK`.
- **Full replacement set, no missing/extra:** rebaseline name column vs the live
  `freeze-baseline.sha256` name column → `diff` empty (252 = 252, 0 added, 0 removed). The 8
  widening names appear in neither the baseline nor the rebaseline (`comm -12` empty =
  additions-only) and are byte-for-byte the same *names* as `sc202-r3-widening.txt` /
  `sc202-r4-widening.txt` (only hashes changed). Every one of the 260 print-class PNGs in the
  shots dir is covered by rebaseline ∪ widening (`comm -23` → 0).
- Freeze mismatch list vs rebaseline names → `diff` empty both directions.
- **Twin ≠ realprint by design:** live baseline (pre-round) = 126 ids, **126 twin==realprint**,
  0 differing. Rebaseline = 126 ids, **0 twin==realprint, 126 differing**. Full print class on
  the final tree = 130 ids, all 130 differing. Max vertical drift **2.00 px** (budget 24 px).
- **Screen combos untouched:** 264 `*--steel-{dark,light}.png`, `diff` against
  `sc202-r6brerev-allshots.sha256` → empty. 0 moved.

## Artifacts (all absolute, in `…/sc202-visual-harness-obsidian/`)

```
sc202-r6c-review.md                              (this report)
sc202-r6crev-tsc.log  sc202-r6crev-lint.log  sc202-r6crev-jest.log
sc202-r6crev-shots1.log  sc202-r6crev-shots2.log  sc202-r6crev-shots-final.log
sc202-r6crev-allshots-run1.sha256  -run2.sha256  -run3.sha256
sc202-r6crev-freeze1.log  sc202-r6crev-freeze-final.log
sc202-r6crev-rebaseline-check1.log  sc202-r6crev-parity.log
sc202-r6crev-property-census.json                (HIGH-1: the measured per-property census)
sc202-r6crev-canfail-A-background.log            (HIGH-1: the hole — passes, exit 0)
sc202-r6crev-canfail-B-boxshadow.log             (HIGH-1: control — fails, exit 1)
sc202-r6crev-fix-narrowed-clean.log              (HIGH-1: prescribed fix, clean tree, exit 0)
sc202-r6crev-fix-narrowed-canfailA.log           (HIGH-1: prescribed fix catches A, exit 1)
sc202-r6crev-lightgap.log                        (LOW-3: light-vault twin gap)
sc202-r6crev-statblock-pdf-page1-reproduced.png  (MED-1: page 1 is NOT blank)
```

---

# Scoped re-review of `e12c6bd`

**Verdict: APPROVE with two LOW carry-overs and one MED qualification the owner should
fold into the ask text (no further code round needed).**
- **HIGH-1 — CLOSED, verified four ways.** Allowed set verbatim: `backgroundImage, color,
  fontFamily, webkitPrintColorAdjust`. My can-fail A now FAILS (exit 1, 48 problems); B
  still FAILS; the in-run self-test and the jest guard both go red under mutation.
- **0 of 524 shots moved** vs `sc202-r6crev-allshots-run1.sha256`; `sha256sum -c
  sc202-r6c-rebaseline.txt` → **252 OK**; 8 widening lines OK; `FREEZE VIOLATED (252
  checksum mismatches, 0 missing)` unchanged.
- **MED-1 — CLOSED.** The statblock crop is byte-identical to page 2 of the retained
  4-page `sc202-r6c-statblock.pdf`; page 1 being title-only is the **real page**, not a
  pagination bug — caused by the plugin's own `@media print { [data-dse-element] {
  break-inside: avoid } }` (`styles-source.css:14091-14095`, Rule 5).
- **MED-2 — CLOSED.** **MED-4 — CLOSED.** **LOW-1 — CLOSED.** **LOW-3 — CLOSED.**
- **NEW MED-a:** the real PDF shows a **"Read-only"** chip where the harness realprint
  shows **"Level 3"**; §8's "matches … at every fixture inspected" does not name it.
- **NEW LOW-a:** `statblock-after` was equalised to one crop box by **truncating** it —
  it now ends mid-sentence with the card's bottom border cut off. **LOW-b:**
  `twin-feature-before` is byte-identical to `realprint-feature-before` (correct — they
  were byte-identical at `d0fed38` — but unexplained in the captions).

## HIGH-1 — closed

Delta reviewed: `git diff f8bc63a..e12c6bd` (2 files, +147/-3) — the narrowing at
`shoot.mjs:4817`, `MEASURED_REACHABLE_PRINT_PROPS` at `:4856`, `selfTestPrintDeltaAllowedSet`
at `:4869`, its call site at `:5082`, and `test/unit/build/printTwinDeltaAllowedSet.test.ts`.
The set is exactly my measured reachable set, and the comment cites the census by filename
and records honestly that the selector-reachability version is *not* what this ships.

Gate line, verbatim, on a clean sweep of `e12c6bd`:

```
print-twin delta self-test OK (the reviewer's can-fail pair: a synthetic backgroundColor-only divergence on a non-control node is caught; a synthetic color-only divergence is correctly excused)

print-twin delta OK (130 capture ids: same DOM, no horizontal/size drift, max vertical drift 2.00px (< 24px), every differing computed-style property is one of the pinned sheet's own @media print properties: backgroundImage, color, fontFamily, webkitPrintColorAdjust)
```

Four independent proofs, each executed:

| probe | expected | result |
|---|---|---|
| can-fail A re-run (screen-only `background-color` on `.dse-card__band`) | now fails | **exit 1**, `PRINT-TWIN DELTA VIOLATED — 130 capture id(s) compared, 48 problem(s)`, naming `ancestry#15 <div class=dse-card__band>: backgroundColor differs — "rgb(1, 2, 3)" (twin) vs "rgba(0, 0, 0, 0)" (realprint)` |
| can-fail B re-run (`box-shadow`, control) | still fails | **exit 1**, 48 problems, `boxShadow differs — "rgb(1, 2, 3) 0px 0px 0px 1px" (twin) vs "none"` |
| mutate the set `+display` / `+backgroundColor` → jest | red | **exit 1** both, `Tests: 1 failed, 3 passed, 4 total` |
| mutate `+backgroundColor` → full sweep | red | **exit 1**, `PRINT-TWIN DELTA SELF-TEST FAILED — … backgroundColor-differs WRONGLY EXCUSED (regression …)`, aborting before the assertion runs |

Zero-cost confirmed: **0 of 524 shot bytes moved** (`diff` vs
`sc202-r6crev-allshots-run1.sha256` → 0 lines); rebaseline **252/252 `OK`**; both widening
files `OK`; the freeze line is unchanged verbatim. The rebaseline deliverable therefore
stands exactly as approved in the first pass — **no regeneration needed**.

One honest note on the self-test's construction, recorded but **not** a finding: it is not
an injection — it re-implements the style-diff condition (`a.style[p] !== b.style[p] &&
!enumeratedProps.has(p)`) over synthetic records rather than calling
`assertPrintTwinDelta`, so it is effectively a set-membership assertion. It nonetheless has
real teeth (proven by the mutation above), and the true injection pair remains reproducible
from the logged commands. The brief's literal "a `box-shadow` injection must fail" is
implemented as its complement (a `color` divergence must *not* be flagged), which guards
over-narrowing — the more useful of the two given `boxShadow` is already outside the set.

## MED-1 — closed; the blank page 1 is real

`sc202-r6c-realprint-statblock-pdf.png` now carries **1,278 rows of ink / 74,797 ink px**
(was 32 rows / 2,401). It is **sha256-identical** to page 2 of the retained
`sc202-r6c-statblock.pdf` rasterised at 150 dpi — so the shipped crop is provably the real
export page, not a re-render.

The retained PDF (4 pages, 612×792 pt Letter) measures:

| page | rows with ink | ink px |
|---|---:|---:|
| 1 | 32 | 2,401 |
| 2 | 1,278 | 74,797 |
| 3 | 1,491 | 74,962 |
| 4 | 213 | 20,029 |

**Confirmed: the real page, not a pagination bug.** `styles-source.css:14089-14095` sets,
under `@media print`, `[data-dse-element], .dse-feature, .dse-pr, .dse-statgrid {
break-inside: avoid }` — "Rule 5 — page-break hygiene: never split a statblock / ability /
power-roll / characteristics row across a page." The statblock root carries it, so Chromium
refuses to start the card in page 1's remaining space after the note-title `h1` and pushes
it wholesale to page 2. (My first-pass probe read `break-inside: auto`; I had queried the
inner `.dse-sb`/`.dse-card`, not `[data-dse-element]`, which is the node that carries the
rule — the two readings reconcile.) `sc202-r6c-feature.pdf` is a single page, which is why
the page-1 extraction masked the bug there. Retained page 1 for the record:
`sc202-r6crerev2-statblock-pdf-page1-titleonly.png`.

**Observation for the owner, not a finding against this round** (Rule 5 predates it): the
card is 3 pages tall, so `break-inside: avoid` cannot be honoured anyway — pages 2→3→4 show
it split regardless. The rule therefore costs a blank first page without buying an unsplit
card for any statblock taller than one page. Worth its own ticket if Scott ever prints one.

**Region-by-region re-derivation of the statblock "matches" claim** (harness
`…-statblock-after.png` vs real page 2), colours named:

| region | harness after | real PDF page 2 |
|---|---|---|
| ground / body type | white, black serif | white, black serif |
| eyebrow + title | "Human, Humanoid" / "Human Bandit Chief" bold serif | same |
| stat row | 1M / 5 / 120 / 2 / 5 + labels | same |
| characteristics | +2 / +3 / +2 / +3 / +2 | same |
| first ability spine | dark red (crimson) | dark red (crimson) |
| "Kneel, Peasant!" spine | blue | blue |
| "Bloodstones" spine | green | green |
| "Signature Ability" chip | grey outline | grey outline |
| tier pills | red / orange-amber / green | red / orange-amber / green |
| tier-1 glyph | "≤11" | "²11" (documented upstream substitution) |
| **top-right chips** | **"Level 3" / "Leader" / "EV 20"** | **"Read-only" / "Leader" / "EV 20"** |

Everything matches except the last row — see MED-a.

## MED-a (new) — the real PDF shows a "Read-only" chip the harness crop does not

In `sc202-r6c-realprint-statblock-pdf.png` the top-right slot that the harness capture
fills with **"Level 3"** instead reads **"Read-only"**, and the chip immediately below it is
drawn clipped. The harness realprint combo is shot without `--readonly`, while Obsidian's
export popup renders the element in its read-only context — so this is a *capture-parameter*
difference, not a print-CSS one, and it is pre-existing rather than caused by this round.

It still matters because §8's sentence — *"Visually close to the harness's own
`--steel-realprint` captures at every fixture inspected"* — is the sanction-ask evidence,
and this is the second consecutive round where the statblock match claim is stated more
strongly than the artifact supports. **Fix (report text only, no code):** either qualify §8
with one sentence naming the Read-only chip and its cause, or re-shoot the realprint
statblock crop with `--readonly` so both panels show the same surface. Does not affect the
rebaseline, the freeze line, or any verdict above.

## MED-2, MED-4, LOW-1, LOW-3 — closed

- **MED-2.** `sc202-r6b-report.md:611-620` now leads with the corrected attribution: true
  `--background-primary` (`#1e1e1e` → `#1C1C1C`) at the shot edge, ~171 of 384 dark px, plus
  a sub-pixel repaint of a real reading-view layout (app.css chunks 251–271); light measured
  at 19,860 px = **1.19 %**; explicitly **NOT** the focus ring, **NOT**
  `--interactive-accent`. The old bullet is struck through and kept for the record. Matches
  the 6b re-review's RULING.
  *Carry-over (LOW-c):* the report **body** at `:486-498` still narrates the disproven
  reading in prose ("visually isolated to a dotted, focus-ring-shaped outline … consistent
  with … `--interactive-accent`") with no marker pointing to the correction 120 lines below.
  One inline pointer would close it.
- **MED-4.** `sc202-r6c-twin-feature-{before,after}.png` exist at 1520×1092 — the same crop
  box as the realprint feature pair — captioned as the in-app dark-vault preview, dark on
  dark by design. The "before" was taken at `d0fed38` with the old `print-twin parity OK`
  line observed, which is genuine old-code provenance.
- **LOW-1.** The "30 properties" claim is gone; the report states the original 32-property
  union, names HIGH-1, and documents the narrowing to 4.
- **LOW-3.** Recorded twice (`:312` and `:405-407`) with my measured numbers: 10 of 10
  fixtures, 1,554 of 1,993 nodes (78 %), `color` 1,540 / `backgroundColor` 103 /
  `boxShadow` 116 / four border-colour longhands ~1,400 each.

## LOW-a (new) — LOW-2's "one crop box" was achieved by truncating the after panel

Pair heights are now equal (feature 1092/1092, hero 1546/1546, statblock 4114/4114, twin
1092/1092) and all files are sha256-distinct within their pair, so LOW-2's stated goal is
met. But the report's own method — *"top-anchored crop box (the shorter render's own
height)"* — cuts the taller render. Measured on the bottom rows:

- `statblock-before`: last rows carry **1,516–1,520 ink px** — the card's bottom border and
  frame; the panel terminates naturally.
- `statblock-after`: last rows carry **10–34 ink px** — a spine bar and glyph fragments. The
  panel ends mid-sentence on "…against that target." with the bottom border, the closing
  spine and ~92 px of card cut off.

`hero` is unaffected (the after is shorter; the box is padded, and the before only lost
empty bottom margin). **Fix:** pad both panels to `max(before, after)` instead of truncating
to `min`, or add one caption word saying the after is cropped. As shipped, Scott sees an
"after" that appears to lose the card's bottom edge — a rendering defect that does not exist.

## LOW-b (new) — two crop files are byte-identical, correctly but unexplained

`sc202-r6c-twin-feature-before.png` and `sc202-r6c-realprint-feature-before.png` share
sha256 `9ac760e4…`. This is **correct**: at `d0fed38` the twin and realprint were
byte-identical for all 126 ids (the SC-170 invariant this round replaces), so the two
"before" panels genuinely are one image — and it is the cleanest possible illustration of
what option C changed. The report only asserts distinctness *within* each pair, so an owner
sha256-ing the crop set will find an unexplained duplicate. **Fix:** one caption sentence
("identical by construction — before this round the twin and realprint were the same bytes").

## Battery on `e12c6bd` (verbatim)

```
npm run tsc                 exit 0, clean                sc202-r6crerev2-tsc.log
npm run lint                exit 0, clean                sc202-r6crerev2-lint.log
npx jest                    Test Suites: 1 skipped, 201 passed, 201 of 202 total
                            Tests:       1 skipped, 3836 passed, 3837 total
                            Snapshots:   3 passed, 3 total     sc202-r6crerev2-jest.log
                            (+4 tests, +1 suite vs 3832/200 — exactly the new guard file)
npm run shots               524 PNGs, 0 FAIL, exit 0; self-test line + narrowed delta line
check-freeze.sh             FREEZE VIOLATED (252 checksum mismatches, 0 missing)   exit 1 — EXPECTED, unchanged
sha256sum -c rebaseline     252 OK / 252
widening r3 + r4            8 lines, 0 failures
shots moved vs r6crev run1  0
npm run parity  (LAST)      **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**  exit 0
```

Tree left as found: `git status --porcelain` empty, `shoot.mjs` `3ef50d5c…` and
`styles-source.css` `97f1d41a…` restored byte-identical after every probe, `main.js`/
`styles.css` removed, `visual-harness/dist/` intact, shots dir holding the clean `e12c6bd`
bytes. Shared freeze baseline untouched (`ce4150e4…`).

## Re-review artifacts

```
sc202-r6crerev2-{tsc,lint,jest,shots1,freeze,parity}.log
sc202-r6crerev2-allshots-run1.sha256
sc202-r6crerev2-canfail-A-background.log          (A now fails, exit 1)
sc202-r6crerev2-canfail-B-boxshadow.log           (B still fails, exit 1)
sc202-r6crerev2-mutation-display-jest.log         (+display  → jest red)
sc202-r6crerev2-mutation-bgcolor-jest.log         (+backgroundColor → jest red)
sc202-r6crerev2-mutation-selftest.log             (+backgroundColor → sweep self-test red)
sc202-r6crerev2-statblock-pdf-page1-titleonly.png (the real page 1, title only)
```
