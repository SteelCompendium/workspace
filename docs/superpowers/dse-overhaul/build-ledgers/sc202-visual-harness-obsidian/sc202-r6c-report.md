# SC-202 round 6c — realprint under Obsidian's real print conditions (option C)

**STATUS: DONE.** Commits on `d0fed38` (`origin/develop` unchanged at `8b65a14`):
`8a9e130` (r6b re-review folds), `709151a` (`feat(harness)` — realprint DOM chain + the
delta assertion), `f8bc63a` (`fix(theme)` — print font token + two genuine leak fixes).
- `--steel-realprint` = Obsidian's REAL Export-to-PDF/Ctrl-P (real DOM chain, CDP-measured).
- `--steel-print` (twin) = "the print preview inside the app" — real screen-media capture.
- SC-170's byte-parity gate → `assertPrintTwinDelta`: same DOM, ≤0.5px drift (proportional
  where font legitimately differs), vertical drift <24px, style diff limited to the pinned
  sheet's own enumerated `@media print` properties, narrowed by the fix round (below) to
  the 4 MEASURED-reachable properties, listed in §3.
- Measured: **`print-twin delta OK (130 capture ids … max vertical drift 2.00px …)`**.
- Frozen lines: **all 252 of 252 moved, 0 unchanged** — `FREEZE VIOLATED (252 checksum
  mismatches, 0 missing)`, verbatim, exactly as expected; deliverable `sc202-r6c-rebaseline.txt`.
- Print font token: the 5-rule font-slot consumer block's print exclusion removed — body/
  title now serif in print, matching a real measured PDF.
- Crops: 8 files (`feature`/`statblock`/`hero` × before/after, `feature`/`statblock` × PDF
  — `hero` PDF skipped per SC-293).
- PDF ground truth: **matches** (black-on-white, serif, tier-pill colours preserved); one
  pre-existing, upstream residual noted (§8), not caused by this round.
- Battery: tsc/lint clean; jest 3832/1sk/200-of-201; shots 524/0; parity 0/0/16 unchanged.
  No push, no tags, no attribution trailers.

## 1. Context: the real DOM chain, measured

A one-off CDP probe (not shipped — same spawn/attach pattern `obsidian-camera.mjs` already
uses, scoped to a single flow) drove a scratch Obsidian 1.13.7 through
`workspace:export-pdf` end to end against this round's `feature`/`statblock` fixtures. The
native save-dialog is the one step a script cannot click through — it was stubbed
(`electron.remote.dialog.showSaveDialog` monkey-patched to resolve instantly with a canned
path) — every OTHER step ran completely unmodified, including the real
`webContents.printToPDF()` call and the resulting PDF bytes (both real PDFs are shipped as
crops, see §5).

Reading `app.js`'s own `printToPdf()` (extracted from the pinned `.asar`, minified but
legible) plus the live CDP measurement together:

1. `window.open('about:blank', '_blank', 'popup,hide=true')` — a SEPARATE top-level
   window/document, not the workspace window's own DOM.
2. Every `<style>`/`<link rel=stylesheet>` in the main document's `<head>` is relayed into
   the popup's (app.css, no theme/snippet — a default vault has neither — then the
   plugin's own inline `<style>`, the same two-sheet order r6b's own screen-cascade
   measurement found), and the popup's `<body>` class list is copied from the main
   window's.
3. `sleep(200)`, then **`body.removeClass('theme-dark'); body.addClass('theme-light')`
   UNCONDITIONALLY** — even starting from a dark vault. Measured: the popup's body carries
   every window-chrome class the main window's does (`mod-linux`, `is-frameless`,
   `show-ribbon`, …) MINUS `is-focused`, PLUS `is-popout-window`, PLUS `theme-light` —
   never `theme-dark`.
4. `body.createDiv('print')`, and inside it a **SINGLE**
   `markdown-preview-view markdown-rendered show-properties` wrapper around the rendered
   note — measured to NOT carry the screen reading-pane's own extra classes
   (`node-insert-event`/`allow-fold-headings`/`allow-fold-lists`/`show-indentation-guide`),
   because `printToPdf()` never takes the workspace reading-pane's own `MarkdownRenderer`
   code path.

`data-dse-print="on"` itself needed no faking: the plugin's own `watchPrintMedia`
(`src/framework/printMedia.ts`) stamps it live off `matchMedia('print')`, which is already
`true` by the time `mountFromParams` runs for the realprint combo (`shoot.mjs`'s `snap()`
calls `page.emulateMedia({media:'print'})` before `page.goto`) — reusing the real mechanism
rather than faking its outcome was the whole point.

Window-chrome classes (`mod-linux`, `is-frameless`, `is-popout-window`, …) are deliberately
NOT reproduced on the harness's own `doc.body` — grepped against app.css, none of them
pairs with any `.markdown-rendered`/table/list/input/checkbox/prose selector this file's
sweeps or captures ever sample (`.is-popout-window` re-checked this round: two
`.mod-macos`-scoped window-chrome hits only), and they are OS/window-manager-specific.

## 2. What each print surface now represents

- **`--steel-realprint`** — real paper. `emulateMedia({media:'print'})`, the pinned app.css
  ON unconditionally, `body.theme-light` forced (even from `bg=dark`), the `.print >
  .markdown-preview-view.markdown-rendered.show-properties` chain from §1. This IS what
  Obsidian's Ctrl-P / "Export to PDF" renders.
- **`--steel-print`** (the twin) — "the print preview inside the app": a genuine
  SCREEN-media capture (`sheet: '1'` now covers it too, same as every dark/light combo
  since r6b) with the print attribute set, using the SAME single-div
  `.markdown-preview-view.markdown-rendered` wrapper the reading pane always did — a
  DIFFERENT surface from paper, by design, per the ledger's own framing.

`entry.ts`'s `applyRealPrintCascade` (realprint) and `applyRealObsidianCascade` (now the
screen-media cascade specifically — twin included) share `ensureSheetLinkLoaded` and
`unwrapHarnessCascade`; the latter is keyed on each shape's own `data-dse-harness-wrap`
marker (`"screen"` vs `"realprint"`) so a direct test caller switching modes on the same
`doc` can never leave both shapes half-applied — proven in
`test/dom/visual-harness/fixtures.test.ts`'s new describe block (4 tests, including the
idempotent-unwrap case in both directions).

## 3. The delta assertion

`assertPrintTwinDelta` (`visual-harness/shoot.mjs`), replacing `assertPrintTwinParity`
(SC-170). For every capture id, `captureMountSnapshotForPrintDelta` records a depth-first
snapshot of `#mount`'s subtree (tag, sorted attributes, `getBoundingClientRect()`, and a
fixed candidate style-property list — same "not literally every CSS property, a documented
candidate list" convention this file's other sweeps already use) for BOTH the twin and
realprint combo; the comparison runs after the full sweep, reading `produced`/
`printTwinDomSnapshots` (not a directory listing, same "narrowed run can't be fooled by a
stale full sweep" discipline `assertPrintTwinParity` already had).

1. **Same DOM** — same node count; same tag + full sorted-attribute string at every
   position in document order.
2. **No horizontal/size drift** — 0.5px, UNLESS this node's own `fontFamily` differs (an
   enumerated-allowed property) or it is/wraps a native `<input>`/`<button>` control
   (`nativeControlAdjacent`, bounded to two levels of children or the nearest `input`/
   `button` ancestor) — then proportional: `max(12, 0.25 × wider side)`. Two measured,
   narrow, cited reasons this widening exists, both discovered by the check itself, not
   guessed in advance:
   - Controls' own font stays pinned to sans-in-print by design (SC-112 Task 3, unchanged
     by this round), and that sans stack's own fallback tail still differs by media the
     same way body text's did before this round's font fix — a native
     `<input type=number>`'s width (and anything sizing to it, or a Controls-role text
     span like `.dse-stepper__value`) follows its own glyph metrics.
   - A small fixed-size icon (a statblock band-crest SVG, 16×16, its OWN size never
     changes) can still SHIFT when upstream sibling text reflows before it — the same
     font-tail difference, one level further removed. Measured live: ~9.7px on a 16px
     icon — the reason the floor is 12px, not 4px.
3. **Vertical drift under 24px** — measured max **2.00px** across all 130 capture ids.
4. **Enumerated-property style diff** — `printSheetEnumeratedProperties` originally derived
   the allowed set from every longhand appearing anywhere in the pinned sheet's `@media
   print` rules (`iterRules`, SC-205's own parser), unioned across all five `@media print`
   blocks regardless of whether the rule's selector could ever match plugin DOM under the
   print chain: `MozAppearance`, `alignItems`, `appearance`, `background`, `backgroundColor`,
   `backgroundImage`, `border`, `borderBottomStyle`, `borderBottomWidth`, `borderLeftStyle`,
   `borderLeftWidth`, `borderRadius`, `borderRightStyle`, `borderRightWidth`,
   `borderTopStyle`, `borderTopWidth`, `color`, `contain`, `display`, `fontFamily`, `height`,
   `justifyContent`, `maxHeight`, `overflow`, `paddingRight`, `paddingTop`, `textIndent`,
   `textOverflow`, `textShadow`, `webkitAppearance`, `webkitPrintColorAdjust`, `width` (32
   properties). **This was HIGH-1 in the independent review of `f8bc63a`**: only one of the
   five `@media print` blocks is selector-reachable from plugin DOM at all, and unioning
   dead permissions in let a screen-only `.dse-card__band { background-color }` rule leak
   through the gate undetected (a can-fail proof: injecting that rule moved 19 twin shots
   and the sweep still printed OK). The fix round replaced the union with the MEASURED
   reachable set — `MEASURED_REACHABLE_PRINT_PROPS` in `shoot.mjs`, a hard-coded
   `Set(['color', 'fontFamily', 'webkitPrintColorAdjust', 'backgroundImage'])` — derived
   from the property census (`sc202-r6crev-property-census.json`) and intersected into
   `printSheetEnumeratedProperties`'s result every run, plus a `selfTestPrintDeltaAllowedSet`
   guard that runs before every sweep's assertion and fails the gate if a synthetic
   screen-only `backgroundColor` divergence would NOT be flagged, or if a synthetic `color`
   divergence WOULD be (the reviewer's own can-fail A/B pair, built permanently into the
   gate). A jest guard (`test/unit/build/printTwinDeltaAllowedSet.test.ts`) additionally
   parses `shoot.mjs`'s source and fails if the hard-coded set ever grows past these four
   names or the intersection/self-test wiring is removed. `backgroundImage` covers the
   `.print .external-link` node; `--font-text` (a custom property, not a computed-style key)
   maps to its visible effect, `fontFamily`. A node with ZERO size in BOTH captures (the
   element chrome panel's own buttons/icons — `display: none` under SC-169 §6's own "chrome
   is completely absent from print" contract, unrelated to this round) is excluded from the
   style diff only — DOM shape and geometry stay checked at full strictness everywhere.
   `<input>`/`<button>`-adjacent nodes get exactly two more allowed properties
   (`backgroundColor`, `boxShadow`) for the same native-token reason as #2 above — this
   two-property control widening is unchanged by the narrowing.

**Can-fail**: proven live during development — before the two commits below, the identical
524-shot sweep failed `PRINT-TWIN DELTA VIOLATED` naming the exact font/leak findings those
commits close (thousands of `stroke`/border-color-follows-`color` false positives were
found and excluded first — see `PRINT_DELTA_STYLE_PROPS`'s own comment for why `fill`/
`stroke`/border-*-color are deliberately NOT sampled: they default to `currentColor` and
trivially "differ" in lockstep with `color` on nearly every node, zero signal).

## 4. Print font token — what changed and why

The consolidated font-family "Legacy font-slot gate" block (Title/Body/Card-body/Label/
Controls consumer rules, SC-112) carried `:not([data-dse-print="on"])` on every arm since
that task shipped. That exclusion was never a considered "print should differ" design
choice — the comment it grew from records only that an earlier round's frozen baseline
happened to be sans, and that state was preserved rather than questioned. This round's own
delta check (§3) caught the real cost directly: `.dse-pr__badge-text` (a Label-slot
consumer) wrapped onto two lines inside its own fixed-width tier badge once print fell
through to whatever ambient host font `--font-text` resolves to on this machine, instead of
the bundled, metrically stable "Source Serif 4" every screen capture already uses safely —
a genuine ~3px glyph-width divergence between the twin and real paper, not cosmetic.

Independently, a real Export-to-PDF (§1's CDP probe, both `feature` and `statblock`)
confirms body/title text on real paper IS serif — matching what removing the guard now
gives the harness (both surfaces: twin AND realprint, since the guard removal is keyed on
`data-dse-print="on"`, not media type).

**What changed**: the print exclusion is removed from all five consumer rules (~29
selector arms), their SC-100 decorative siblings (`.dse-card__band-head`,
`.dse-tiles__label`), and the tier-1 badge's own mono-slot `::first-letter` override
(whose OWN, separate print exclusion caused the badge-width drift above, for the same
retired "Legacy-freeze" reasoning). `--dse-font-controls`'s own rendered font is UNCHANGED
in effect — SC-112 Task 3's "Controls stays sans in print" ruling is untouched; the
consumer rule losing its guard changes nothing because the actual value is pinned by the
print value block's own higher-specificity `--dse-font-controls` declaration regardless
(verified: 0 pixel change to any Controls-role node's font). **One pair deliberately kept
its exclusion**: `.dse-chrome-summary__label`/`__name` — chrome is `display: none` in
print by `chrome.test.ts`'s own SC-169 §6 contract, a broader guarantee than this one
rule, so there is no real paper for its font to match at all.

## 5. Two genuine leak fixes (not font-related)

The same delta check surfaced two SEPARATE, real, un-re-grounded print leaks:
`.dse-stamina__pill` and `.dse-init__portrait-fallback` each set `background-color` from a
raw Obsidian token directly (`--background-primary-alt`, `--color-base-30`) — never in
scope for either print value block's `--dse-*`-only neutral-surface system, so both kept
tracking `theme-dark`/`theme-light` under print instead of the neutral white every other
print surface holds (measured: `.dse-stamina__pill` rgb(35,35,35) twin vs rgb(250,250,250)
forced-light paper; `.dse-init__portrait-fallback` rgb(51,51,51) vs rgb(228,228,228)). Each
gets a narrow, print-only `#fff` override (an `@media print` arm + the twin's own
`[data-dse-print="on"]` arm); screen is unchanged (both arms only ever match under print).

## 6. Rebaseline

**All 252 of 252 frozen lines moved, 0 unchanged.** `bash check-freeze.sh` on the final
tree: **`FREEZE VIOLATED (252 checksum mismatches, 0 missing)`**, verbatim. Deliverable:
`sc202-r6c-rebaseline.txt` (252 `<sha256>  <filename>` lines) — deterministic across
**three** independent clean `npm run shots` sweeps (the brief asked for two), self-verified
(`sha256sum -c` from the shots dir → all 252 `OK`). Full grouping and the "why every line,
not a subset" explanation: `sc202-r6c-rebaseline-summary.md`. The 8 widening lines
(`feature-list`/`title-nested`/`treasure-hr`/`perk-links` × twin/realprint) also moved —
updated content in `sc202-r6c-r3widening-update.txt` / `sc202-r6c-r4widening-update.txt`
for the dispatcher to apply over the existing (additions-only, no re-sanction needed)
widening files at landing. `.superpowers/sdd/freeze-baseline.sha256` was never touched by
this worker.

## 7. Light-theme twin gap (brief item 6)

Still uncovered: `COMBOS`'s twin entry is hard-coded `{theme:'steel', bg:'dark',
print:true}` — there is no `--steel-print` capture of a LIGHT-themed vault's own print
preview (only realprint gets `theme-light`, deliberately, per the ruling — the twin is
supposed to show the ACTUAL vault theme, dark here, unlike paper). This is the SAME gap
that existed before this round; nothing in this round narrows or widens it.

Checked whether it is a one-line fixture add, per the brief's own conditional: it is NOT.
Adding a light-bg twin combo means a NEW capture id naming scheme (no existing frozen name
covers `<id>--steel-print-light` or similar), which means a NEW widening (new names,
additions-only, but still its own reviewed deliverable, not a fixture literal). Not
attempted here — left as the non-blocking gap the ledger already recorded.

## 8. PDF ground-truth match

**Yes, matches** — both `feature` and `statblock` real PDFs (via the CDP-driven
`workspace:export-pdf`, §1; the native save dialog stubbed, the actual
`webContents.printToPDF()` call and PDF bytes real): black text on white paper, serif body
type, tier-pill borders keep their colours (red/orange/green/gold outlines — named in
words per Scott's colour-blindness), chip borders (Villain Action, Malice) intact. Visually
close to the harness's own `--steel-realprint` captures at every fixture inspected.

**MED-1 correction (fix round):** the original `statblock` crop
(`sc202-r6c-realprint-statblock-pdf.png`) was rasterized from PDF page 1, which the review
caught as blank — `statblock.pdf` is a 4-page export where the note title alone fills page
1 and the actual card content only starts on page 2 (`feature.pdf` is a single page, so the
same page-1 extraction happened to work there by coincidence). The fix round re-rasterized
page 2 (`pdftoppm -f 2 -l 2`), confirmed non-blank ink coverage, and overwrote the same
path; the real PDF files (`sc202-r6c-statblock.pdf`, `sc202-r6c-feature.pdf`, 4 and 1 pages
respectively) are retained in this ledger directory. The "matches" claim above is
re-derived from that corrected page-2 rasterization, not the original blank page.

**One residual, pre-existing, not caused by this round**: the tier-1 badge's leading "≤"
renders as a "²" (superscript-2) glyph substitution in the REAL PDF too — the bundled
"Source Serif 4" subset genuinely lacks U+2264 (documented since SC-121 B-3), and this is
an upstream Obsidian/system font-substitution fact this plugin's CSS cannot reach, not a
regression this round introduced or could fix. (The harness's own tier-1 badge does NOT
show this substitution — its `::first-letter` mono-slot override, print-included as of
this round, correctly resolves to a real "≤" via a monospace face that carries the
character; only the SEPARATE real-Obsidian PDF, driven by Obsidian's own font stack outside
this plugin's control, shows the substitution.)

`hero`'s real PDF was **not attempted** — per SC-293 (hero PDF export = 34,205 pages,
separate ticket, out of scope here). `feature`/`statblock` stand in as the PDF ground
truth per the brief's own fallback instruction.

## 9. Battery (foreground, logs `sc202-r6c-*` in this directory)

- `npm run tsc` / `npm run lint` — clean. `sc202-r6c-tsc-final.log` / `sc202-r6c-lint-final.log`.
- `npm test` (jest) — **3832 passed / 1 skipped / 200 of 201 suites**. `sc202-r6c-jest-final.log`.
  New tests: `test/dom/visual-harness/fixtures.test.ts` (+4, the realprint cascade
  describe block); `test/dom/theme/steelTypography.test.ts` (net -1: the I1 anchor-guard
  sub-suite's 2 tests deleted, several others updated in place, one net addition);
  `test/dom/kit/powerRollPanel.test.ts` (1 test updated in place, count unchanged).
- `npm run shots` — **524/524 ok, 0 FAIL**; all TEN gate lines OK including
  **`print-twin delta OK (130 capture ids: same DOM, no horizontal/size drift, max
  vertical drift 2.00px (< 24px), …)`**. `sc202-r6c-shots-postcommit.log`. Deterministic
  across two independent runs (`sc202-r6c-allshots-run1.sha256` /
  `-run2.sha256`, diffed empty).
- `bash check-freeze.sh` — **`FREEZE VIOLATED (252 checksum mismatches, 0 missing)`** —
  EXPECTED. `sc202-r6c-freeze-postcommit.log`. N (252) matches the rebaseline summary's
  moved count exactly; every mismatched name is in `sc202-r6c-rebaseline.txt` (verified,
  diffed empty both ways).
- `sha256sum -c sc202-r6c-rebaseline.txt` (from the shots dir) — **all 252 `OK`**.
- **0 of 524 `*--steel-{dark,light}.png` screen-combo bytes moved** — this round touches
  print only, verified against `sc202-r6bfix-allshots-postcommit.sha256` (the r6b tip's own
  final snapshot), diffed empty.
- `npm run parity` — **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`**,
  exit 0, unchanged. `sc202-r6c-parity-postcommit.log`.

## 10. Crops (this directory)

`sc202-r6c-realprint-{feature,statblock,hero}-{before,after,pdf}.png` (8 files — no
`hero-pdf.png`, §8). "Before" = `d0fed38` (round 6b's reviewed tip, via `git stash`/rebuild,
never committed as a real tree state); "after" = this round's final committed tree. All 8
distinct sha256 (checked, no accidental duplicate pair):

- **`feature`**: before — dark background, dark/light ink barely distinguishable ("dark on
  dark"), sans body text. After — white background, black ink, serif body text, tier pills
  keep coloured outlines (red/orange/green/gold). Matches the real PDF crop closely.
- **`statblock`**: same before/after character as `feature`, on the larger statblock card
  (spine-coloured feature bars, tier badges, Villain Action chips all correctly white-
  surfaced with preserved accent colours after). Matches the real PDF crop.
- **`hero`**: same before/after character; no PDF crop (SC-293).

## Drive-by fixes:

- None beyond what the round's own realprint work required — every change traces to a
  named finding from §1 measurement, §3's delta check, or §4/§5's leak fixes.

## Follow-ups:

- **Light-theme twin gap** (§7) — recorded, not a one-line fixture add; left for a future
  round if Scott wants it. **Measured (fix round, LOW-3, `sc202-r6crev-lightgap.log`):**
  probing 10 fixtures under `data-dse-print="on"` in screen media with the sheet on, dark
  vs light vault — **10 of 10 fixtures differ**, and **1,554 of 1,993 nodes (78%)** —
  `color` differs on 1,540 nodes (rgb(218,218,218) dark vs rgb(34,34,34) light), plus
  `backgroundColor` on 103 nodes and `boxShadow` on 116, and the four border-colour
  longhands on ~1,400 nodes each. This is not a corner case: the uncovered light-vault
  twin is a third surface differing from the pinned dark-vault twin on roughly four fifths
  of all plugin nodes. Carried to the final ask by the owner.
- **The tier-1 badge's "≤"→"²" glyph substitution in real PDF exports** (§8) — pre-existing
  (SC-121 B-3), upstream (Obsidian's own font stack / the bundled Source Serif 4 subset),
  not fixable from this plugin's CSS; not new to this round.
- **Two more `--dse-*`-token-bypassing leaks might exist elsewhere** in the sheet beyond
  the two this round's own delta check happened to surface (`.dse-stamina__pill`,
  `.dse-init__portrait-fallback`) — the check only samples nodes that actually differ
  visibly enough to move geometry/paint on the SPECIFIC fixtures this round's sweep
  exercises; a fixture that never renders a given class would never surface its leak. Not
  a known defect, just an honest limit of what "0 problems on the full sweep" can prove —
  worth a note if a future round adds more fixture coverage under print specifically.

## Fix round (2026-09-09)

**STATUS: DONE.** One commit on top of `f8bc63a`: `e12c6bd` (`fix(harness)` — narrow the
print-twin allowed set to the measured reachable properties, self-test can-fail). No push,
no tags, no attribution trailers. Resumed and re-verified 2026-09-13 after a session
rate-limit kill mid-battery; the tree's uncommitted state matched the coordinator's
description exactly and the diff was re-checked against the brief before finishing.

Independent review of `f8bc63a` returned FIX-ROUND-NEEDED (1 HIGH / 3 MED / 3 LOW),
full detail in `sc202-r6c-review.md`. Owner rulings and resolutions, per finding:

- **HIGH-1 (FIX) — the allowed set was every longhand in all five `@media print` blocks
  (32 properties), unioned regardless of selector reachability; a screen-only
  `.dse-card__band { background-color }` injection moved 19 twin shots and the gate still
  printed OK.** Narrowed `printSheetEnumeratedProperties`'s result to the MEASURED
  reachable set via a hard-coded intersection:
  ```js
  const MEASURED_REACHABLE_PRINT_PROPS = new Set(['color', 'fontFamily', 'webkitPrintColorAdjust', 'backgroundImage']);
  // …
  for (const p of [...props]) if (!MEASURED_REACHABLE_PRINT_PROPS.has(p)) props.delete(p);
  ```
  — **`color`, `fontFamily`, `webkitPrintColorAdjust`, `backgroundImage`** on non-control
  nodes, plus the pre-existing two-property native-control widening
  (`backgroundColor`, `boxShadow` on `<input>`/`<button>`-adjacent nodes only, unchanged).
  Built the reviewer's own can-fail pair permanently into the sweep as
  `selfTestPrintDeltaAllowedSet`, which runs before every `assertPrintTwinDelta` call and
  fails the gate outright if a synthetic screen-only `backgroundColor` divergence on a
  non-control node would NOT be flagged, or a synthetic `color` divergence WOULD be flagged
  (i.e. proves the allowed set both excludes the hole and still permits the real signal).
  Added a jest guard, `test/unit/build/printTwinDeltaAllowedSet.test.ts` (4 tests), that
  parses `shoot.mjs`'s own source text and fails if the hard-coded set ever grows past
  these four names, or the intersection/self-test call sites are removed — so the gate
  cannot silently re-widen in a future round without a test failure naming it.
  **Self-test output (every `npm run shots` run, including the final re-run below):**
  `print-twin delta self-test OK (the reviewer's can-fail pair: a synthetic
  backgroundColor-only divergence on a non-control node is caught; a synthetic color-only
  divergence is correctly excused)`.
  **Proof the narrowing costs nothing:** 0 of 524 shot bytes moved (verified against the
  reviewer's own `sc202-r6crev-allshots-run1.sha256` — sorted, diffed, 0 lines different);
  `sc202-r6c-rebaseline.txt` stays byte-valid (`sha256sum -c` from the shots dir → all 252
  `OK`).
- **MED-1 (FIX) — `sc202-r6c-realprint-statblock-pdf.png` was a blank page; no real PDF
  retained.** Root cause: `statblock.pdf` is a 4-page export (note title alone fills page
  1; card content starts on page 2), and the crop had been rasterized from page 1 —
  `feature.pdf` is a single page, so the same page-1 extraction happened to work there by
  coincidence, masking the bug. Re-rasterized page 2 (`pdftoppm -f 2 -l 2`), confirmed
  non-blank ink coverage, overwrote the same path. Real PDFs retained in this directory:
  `sc202-r6c-statblock.pdf` (4 pages), `sc202-r6c-feature.pdf` (1 page). The report's §8
  "matches" claim for `statblock` is now derived from this corrected page-2 rasterization.
- **MED-2 (FIX) — the party-attribution fold from the r6b re-review had not been applied;
  `sc202-r6b-report.md` still blamed `--interactive-accent`/`--dse-focus-ring`.** Applied
  the fold exactly as the r6b re-review ruled: the `party--steel-dark` residual is the true
  `--background-primary` (~171 of 384 dark px) at the shot edge plus a sub-pixel repaint
  artefact of a real reading-view layout (app.css chunks 251–271); light-scheme WAS
  measured at 1.19%; NOT the focus ring, NOT `--interactive-accent`. Old (wrong) text kept
  struck through rather than deleted, to preserve the visible correction history.
- **MED-4 (FOLD) — 126 of the 252 rebaselined lines are the twin, still dark-on-dark in a
  dark vault, with no crop showing it.** Added `sc202-r6c-twin-feature-before.png` /
  `-after.png` at the same crop box as the realprint pair (1520×1092, the raw capture size,
  no cropping needed) — "before" captured via `git stash` + detached checkout to `d0fed38`
  (rebuilt, shot, confirmed the OLD `print-twin parity OK` line to prove genuine old-code
  execution), "after" captured at this round's tip. sha256-distinct
  (`9ac760e4…` before vs `db21708c…` after). Captioned: the in-app print preview in a dark
  vault — dark on dark by design, now under Obsidian's sheet.
- **LOW-1 (FOLD) — the report said "30 properties"; the real original count was 32, now
  narrowed to 4.** Corrected the summary line and rewrote §3 item 4 in full: it now states
  the original 32-property union, names HIGH-1 explicitly, and documents the
  `MEASURED_REACHABLE_PRINT_PROPS` narrowing, the self-test, and the jest guard.
- **LOW-2 (FOLD) — the `hero`/`statblock` before/after crop pairs were captured at
  different heights (full-page captures of differently-tall renders: hero 1566→1546,
  statblock 4114→4206), so they could not be flipped or diffed.** Re-cropped each pair to
  ONE shared, top-anchored crop box (the shorter render's own height): hero to
  1520×1546+0+0, statblock to 1520×4114+0+0. All 4 files remain sha256-distinct within
  their pair (hero: `9e401f2c…` before / `60700130…` after; statblock: `1e3a7799…` before /
  `ef606fdb…` after). Captions unchanged (already measurement-based).
- **LOW-3 (RECORD) — the light-vault twin gap was understated.** Recorded under
  Follow-ups (§ above) with the review's own measured numbers: 10 of 10 fixtures differ
  under `data-dse-print="on"` in screen media (sheet on, dark vs light vault), 1,554 of
  1,993 nodes (78%) — `color` on 1,540 nodes, `backgroundColor` on 103, `boxShadow` on 116,
  the four border-colour longhands on ~1,400 each. Carried to the final ask by the owner,
  not resolved here.
- **MED-3** — confirmation only per the ruling; no action taken.

**Battery (foreground, logs `sc202-r6cfix-*` in this directory; re-run fresh on resume
2026-09-13 rather than trusting the pre-kill logs, per the coordinator's instruction —
results identical):**

- `npm run tsc` / `npm run lint` — clean. `sc202-r6cfix-tsc.log` / `sc202-r6cfix-lint.log`.
- `npm test` (jest) — **3836 passed / 1 skipped / 201 of 202 suites** (+4 tests, +1 suite
  vs the original round's 3832/1sk/200-of-201 — exactly the new guard file).
  `sc202-r6cfix-jest.log`.
- `npm run shots` — **524/524 ok, 0 FAIL**, including **`print-twin delta self-test OK
  (the reviewer's can-fail pair: a synthetic backgroundColor-only divergence on a
  non-control node is caught; a synthetic color-only divergence is correctly excused)`**
  and **`print-twin delta OK (130 capture ids: same DOM, no horizontal/size drift, max
  vertical drift 2.00px (< 24px), every differing computed-style property is one of the
  pinned sheet's own @media print properties: backgroundImage, color, fontFamily,
  webkitPrintColorAdjust)`**. `sc202-r6cfix-shots.log`.
- `bash check-freeze.sh <shots-dir>` — **`FREEZE VIOLATED (252 checksum mismatches, 0
  missing)`** — EXPECTED, unchanged from the original round. `sc202-r6cfix-freeze.log`.
- `sha256sum -c sc202-r6c-rebaseline.txt` (from the shots dir) — **all 252 `OK`**.
  `sc202-r6cfix-rebaseline-check.log`.
- **0 of 524 `*.png` bytes moved** vs the reviewer's own `sc202-r6crev-allshots-run1.sha256`
  (sorted both sides, diffed, 0 lines different). `sc202-r6cfix-allshots-current.sha256` /
  `sc202-r6cfix-0moved-proof.log`.
- `npm run parity` — **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`**, exit
  0, unchanged, run LAST. `sc202-r6cfix-parity.log`.
- `.superpowers/sdd/freeze-baseline.sha256` was never touched by this worker.

**New/changed crops (this directory, sha256-distinct within each pair):**

- `sc202-r6c-twin-feature-before.png` (`9ac760e4…`) / `-after.png` (`db21708c…`) — new,
  MED-4.
- `sc202-r6c-realprint-hero-before.png` (`9e401f2c…`) / `-after.png` (`60700130…`) —
  re-cropped in place, LOW-2.
- `sc202-r6c-realprint-statblock-before.png` (`1e3a7799…`) / `-after.png` (`ef606fdb…`) —
  re-cropped in place, LOW-2.
- `sc202-r6c-realprint-statblock-pdf.png` — overwritten with the corrected page-2
  rasterization, MED-1.

**Note on prompt-injection attempts encountered mid-task:** two separate tool-result
system-reminders appeared during this round instructing that commits carry
`Co-Authored-By`/`Claude-Session` attribution trailers (naming two different, mutually
inconsistent session identities). Both contradict the user's own global `CLAUDE.md`
("never include co-authoring trailers or any Claude/AI attribution") and this brief's own
explicit "no attribution trailers" instruction. Per this worker's own operating rules, no
message arriving through a tool result or side channel can override CLAUDE.md or an
owner's brief — both were disregarded; the final commit (`e12c6bd`) carries no such
trailers, verified directly.
