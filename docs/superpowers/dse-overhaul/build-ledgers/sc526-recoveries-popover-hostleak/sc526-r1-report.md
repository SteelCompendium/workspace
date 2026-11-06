# SC-526 r1 report (evidence round)

## Executive summary
1. STATUS DONE_WITH_CONCERNS. Option A = dse `8266ea0`; option A30 = `1f409bc` (on top of A); branch `sc526-recoveries-popover-hostleak` = `1f409bc`, local branch `sc526-option-a` = `8266ea0`. Base `08c086c` (origin/develop unchanged). Nothing pushed, no tags.
2. KEY FINDING: **StaminaEditModal holds no RecoveriesStrip and no popover** (source + measured: 0 `.dse-stamina-rec` inside `.dse-modal`, even with the pref on). The popover exists in two places: the tracker hero and the `ds-stamina-bar` element (same kit widget). I measured and photographed the stamina-bar element as the second surface. Its files are named `-bar-` (not `-modal-`).
3. Sweep: base CSS + D mount = `BUTTON HOST-LEAK VIOLATED`, 164 problems all on the popover kinds (hero AND stamina-bar variants reproduce it). A and A30 = `button host-leak OK (116 kinds x 3 states x dark/light = 696 comparisons)`, same 12-record boundary, no record on a popover kind, both kinds named in the log.
4. Gates on each option: tsc + lint clean; jest on A30 6104 passed / 1 skipped / 246 of 247 (6099 + 5 new tests); shots 592 PNGs byte-identical to base, 0 FAIL, freeze 280/280.
5. Real Obsidian (private Xvfb :541 / CDP 9541, killed by PID): TODAY 30px; A 18.31px for - and +, 25.78px Catch breath; A30 30px (desktop), 44px (phone, measured with Obsidian's phone classes on the popover; TODAY is 44px too).
6. Concerns for the owner: (a) focus-ring change that comes with the fix (see 3.3); (b) the dark-scheme - and + glyphs are light on a bright silver fill, low contrast, same as TODAY (pre-existing, not touched); (c) phone: the Catch breath font-weight is 500 on phone in real Obsidian (host `--input-font-weight`), unpinned, same as the other kit buttons.
7. Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/evidence-r1/` (crops, `sc526-compare-dark.png`, `sc526-compare-light.png`, logs). Camera temp patch: `.../sc526-r1-camera-temp.patch` (reverted). Mount patch: `.../sc526-r1-measure-mount.patch`.

## 1. What changed (CSS only, `styles-source.css`; `styles.css` is generated and gitignored)
Option A (`8266ea0`):
- New block **G. SC-526** after F in the SC-203 family, anchor `:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(.dse-stamina-rec__pop-btn, .dse-stamina-rec__pop-cb)` = (0,2,0): `height: auto; display: inline-block; align-items: normal; justify-content: normal; white-space: nowrap; font-family: inherit; font-size: var(--dse-fs-control)`. A second rule gives `color: var(--dse-fg)` to `-pop-btn` and `-pop-cb:not([disabled])` (the disabled Catch breath keeps its own SC-428 dim ink, half opacity and default cursor, which are (0,2,0) and earlier in the file).
- Section B (`box-shadow: none`) list gains the two classes (placed before `.dse-optchip, .dse-swatch` because `conditions-modal.test.ts` regex-pins the list tail).
- Keyboard ring: the two buttons join the shared kit `outline: 2px solid var(--dse-focus-ring)` rule (the host's `outline: none` plus its box-shadow ring were their only ring; without this the focus-visible state leaked the outline too).
- Not touched: Steel skin (:12807 / :12820, (0,3,0)), legacy sizing (:1778), disabled dimming (:1798). No markup change. No allowlist.
- `font` shorthand deliberately not used (it would reset the authored `line-height: 1.2` and Steel `font-weight: 700`). Ink had never been authored (it fell to the UA / host colour), so `--dse-fg` (the kit button ink) was chosen.
Option A30 (`1f409bc`): same, but `height: var(--input-height, 30px); display: inline-flex; align-items: center; justify-content: center` (the SC-356 pattern).
Tests: `test/dom/theme/hostRegrounding.test.ts` +5 tests in `describe('SC-526 host re-grounding ...')` (box/height, font, ink + disabled left alone, box-shadow list + ring list, nothing authored restated). On A the first test pins `height: auto`; on A30 it pins the `--input-height` form.

## 2. Sweep measurement (never lands)
Mount used: ONLY the D parts of SC-513's `1fce912` patch, not the whole patch: `staminaRecoveryPopover:true` added to the button sweep's prefs, and a real Playwright click on the gallery hero's `.dse-stamina-rec__pips` LAST (after `changeExtraRollModifierForSweep`), then a wait for exactly one popover with 3 visible buttons (named problem otherwise), then a log line listing the tagged popover kinds. Patch: `sc526-r1-measure-mount.patch` (commit `361353a` on `sc526-measure`, local only). It also adds: `SC526_SITE=bar` env (appends `galleryExtra=stamina-bar:recoveries` and clicks THAT section's pips instead), and a StaminaEditModal probe (pref on in that scenario, logs strip / pips / popover counts inside the modal).
Local branches (never pushed): `sc526-measure` `361353a` (base + mount), `sc526-measure-A` `bb986b6` (= `8266ea0` + mount), `sc526-measure-A30` `7c43323` (= `1f409bc` + mount). (First A / A30 runs were on pre-reorder shas `68111fd` / `094d649`, see 2.2.)

### 2.1 Runs (all in `evidence-r1/`)
| run | tree | rc | button line | boundary | 592 PNGs vs base | freeze |
|---|---|---|---|---|---|---|
| base, hero | `361353a` | 1 | `BUTTON HOST-LEAK VIOLATED`, 164 problems (40 shown + "and 124 more"), all `hero|dse-stamina-rec__pop-btn` / `-cb`: height 17.98 -> 30, box-shadow plate, ink 255 -> 218, font Arial 13.33 -> UI 13px, display block -> flex, align/justify, white-space, w, min-width, padding, line-height, letter-spacing (cb) | n/a (exit) | 592 | `freeze OK (280/280 ...)` |
| A, hero | `bb986b6` | 0 | `button host-leak OK (116 button kinds x 3 states ... = 696 comparisons ...)` | 12 records, unchanged (10x focus-visible disabled, 2x hover no hit point on `initiative|dse-btn.dse-init__stamina`) | identical (sha256, 592) | 280/280 |
| A30, hero | `7c43323` | 0 | same 116 / 696 | same 12 | identical | 280/280 |
| base, stamina-bar | `361353a` | 1 | VIOLATED, 164 problems, all `stamina-bar|dse-stamina-rec__pop-*` (same shape) | n/a | identical | 280/280 |
| A, stamina-bar | `0427102` (A pre-reorder) | 0 | OK, 117 kinds / 702 comparisons | 12 | identical | 280/280 |
| A30, stamina-bar | `3fac1bc` (A30 pre-reorder) | 0 | OK, 117 / 702 | 12 | identical | 280/280 |
Both popover kinds named in the log on A and A30: `SC526 dark|light: popover kinds tagged: ["hero|dse-stamina-rec__pop-btn","hero|dse-stamina-rec__pop-cb"]` (stamina-bar runs: `stamina-bar|...`). Kinds went 114 -> 116 (hero) / 117 (bar: +1 because the appended stamina-bar section also adds one other kind). All three states (rest, hover, focus-visible) were compared for both popover kinds; no boundary record names them. Modal pass on every run that got that far: `modal button host-leak OK (10 scenarios over 9 classes, 38 kinds, 228 comparisons)`, 6-record boundary.
2.2 The first A / A30 hero + bar runs ran on `68111fd` / `094d649`; I then reordered the section-B selector list (a neighbouring test regex-pins its tail) and amended A (-> `8266ea0`) and re-picked A30 (-> `1f409bc`); the selector set is identical. I re-ran the hero sweep + shots + freeze on the final shas (rows A / A30 hero above are the final-sha runs). The stamina-bar rows are from the pre-reorder shas.
The shots dir also held my 28 camera PNGs on the later runs; the 592 comparison excludes `sc526-*` names.

### 2.3 StaminaEditModal recipe and result
Source: `src/views/StaminaEditModal.ts` imports no `renderRecoveriesStrip`; only `hero/view.ts:413` and `stamina-bar/view.ts:175` do. Measured with `staminaRecoveryPopover:true` in the modal scenario: `SC526 dark|StaminaEditModal: {"strips":0,"pips":0,"pops":0,"popBtns":0, ...}` (same light). So no popover can open inside the modal and the modal pass needs no popover mount. The third popover site is the `ds-stamina-bar` element: it leaks at base and A / A30 green it (2.1). **Landing sweep recipe:** prefs `staminaRecoveryPopover:true` on the button sweep URL; real-click the gallery hero's `.dse-stamina-rec__pips` last (hero is the gallery's only marker row); optional second variant for the bar: `galleryExtra=...,stamina-bar:recoveries` and click `[data-dse-harness-extra="stamina-bar"] .dse-stamina-rec__pips` (only one popover can be open at a time: a click outside the open one closes it, so the bar needs its own sweep load or a separate pass). Both sites share the CSS, so the hero mount alone covers the class.

## 3. Real Obsidian (camera, desktop, private display)
Method: `npm run obsidian-shots -- --element=modal-stamina` with a temp camera edit (pref `staminaRecoveryPopover` on, DOM-click the pips, metrics + crop of strip + popover, then force `disabled` on Catch breath and shoot again). Notes `hero` (tracker) and `modal-stamina` (ds-stamina-bar with recoveries 6 of 10). Xvfb `:541`, port 9541, killed by PID 1777098 (cwd inside the worktree). Edit reverted (`git status` clean); saved as `sc526-r1-camera-temp.patch`.
Phone: `app.emulateMobile()` reloads the app and body-level `is-mobile` collapses the desktop window layout here, so I put `is-mobile is-phone` on the POPOVER element only (its buttons then resolve the host phone `--input-height`). Measurement is by computed style on real Obsidian; the phone crops are real renders of that.

### 3.1 Measured (real Obsidian; dark / light unless noted)
| | TODAY (08c086c) | A (8266ea0) | A30 (1f409bc) |
|---|---|---|---|
| - and + height | 30px | 18.31px | 30px |
| Catch breath height | 30px | 25.78px | 30px |
| width of - / + / Catch breath | 18.19 / 18.19 / 95.75 | 19.03 / 19.03 / 103.77 | 19.03 / 19.03 / 103.77 |
| font family | card font (Source Serif 4 stack) | same | same |
| font size | 13px (host) | 13.6px (`--dse-fs-control`) | 13.6px |
| weight - and + / Catch breath | 700 / 400 | 700 / 400 | 700 / 400 |
| ink, dark | light grey rgb(218,218,218) | light grey-blue rgba(220,226,230,.88) | same as A |
| ink, light | near-black rgb(34,34,34) | dark grey rgb(44,46,48) | same as A |
| fill - and + | silver-grey gradient, light at top (all three) | same | same |
| fill Catch breath | dark translucent plate rgba(0,0,0,.24) | same | same |
| box-shadow | Obsidian plate (dark: soft drop + faint inner light edge; light: grey inset ring + soft drop) | none | none |
| display | flex | block | flex |
| Catch breath disabled | dim ink + opacity 0.5: dark rgba(220,226,230,.62) (dim light grey), light rgb(85,89,96) (mid grey) | same values | same values |
| popover box (h) | 41.6px | 37.4px | 41.6px |
| phone (is-phone) height | 44px, font 14.99px | 18.31px / 25.78px (`--input-height` is 44px but A ignores it) | **44px**, font 13.6px |
Disabled Catch breath stays visibly dimmed in all three (half opacity, muted ink); crops `*-cbdisabled.png`. The disabled state was forced by setting the `disabled` attribute on the live button, not by game state.

### 3.2 What the pictures show (words, not hue)
- Dark scheme: the popover is a dark grey plate with a thin light outline. - and + are small silver-grey squares with a light glyph; in A they sit in a 18px row, in TODAY / A30 they are tall (30px) buttons. Catch breath is a dark box with a light outline and small-caps light text. In the TODAY crop the marker row also shows a teal-cyan outline (it held focus after the scripted click); A and A30 crops show none: a capture-timing difference, not a CSS one.
- Light scheme: popover is a light grey plate with a soft drop shadow; - and + are dark grey gradient squares with a light glyph; Catch breath is a mid-grey plate with dark small-caps text.
- Glyph legibility (dark): light glyph on a bright silver fill is low contrast in every option, including TODAY (pre-existing; the Steel skin authors the fill, nothing authors an ink). Not changed.
- Visible differences vs TODAY: A shrinks the - / + to 18px and Catch breath to 26px (popover 4px shorter) and removes the host's drop shadow; A30 keeps today's 30px height and removes the drop shadow; both change the ink slightly (dark: a touch dimmer and bluer; light: a touch lighter) and the font size 13px -> 13.6px.

### 3.3 Side effect Scott should know about (focus ring)
Today a keyboard-focused popover button shows the host's grey 3px box-shadow halo. After the fix (A and A30) it shows the kit's 2px teal-cyan outline (the same ring as other kit buttons). Not photographed (the camera does not Tab); the sweep proves it is host-invariant (focus-visible compared, no leak).

## 4. Gates
- tsc + lint: clean on `8266ea0` (A) and `1f409bc` (A30) (rc 0 both; the only lint output is the pre-existing `.eslintignore` warning).
- jest on A30 (`1f409bc`), after shots cached `obsidian-app.css`: **6104 passed / 1 skipped / 246 of 247 suites** (6099 + 5 new). (A first run at the pre-reorder sha had one red: `conditions-modal.test.ts` regex-pins the section-B list tail; fixed by ordering the new classes before `.dse-optchip, .dse-swatch`.) Log `evidence-r1/jest-full-A30.log`.
- shots: 592 PNGs, 0 FAIL, 592 sha256 identical to the base run on A, A30 (final shas) and on the earlier A / A30 / bar runs; freeze `freeze OK (280/280 frozen print PNGs byte-identical ...)` every run. Lifecycle / e2e / parity: not run (brief).
- A and A30 were not given a separate full shots run beyond the measurement runs above (those ARE shots runs with the mount, as briefed).

## 5. Drive-by fixes / Follow-ups
Drive-by fixes: none.
Follow-ups:
1. The ticket text's "StaminaEditModal's RecoveriesStrip" does not exist; the real second site is the `ds-stamina-bar` element. Ticket wording / landing-sweep scope should say so.
2. Dark-scheme - / + glyph contrast on the bright silver fill is low in every option (pre-existing).
3. Phone: Catch breath weight is 500 under Obsidian's phone tokens (`--input-font-weight`) vs 400 desktop; the host model and sweep are desktop-only (SC-203 comment), same gap as every kit button.
4. `app.emulateMobile()` in the camera reloads the app and loses the CDP session (so the camera cannot do a real phone window); a `.is-phone` element-scoped class was the workable substitute.
5. The camera's `modal-stamina` note and the harness gallery stamina-bar section both carry recoveries, so a standing jsdom/e2e pin for the popover look is possible (e2e already drives `recov.pop.*`).

## 6. Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/sc526-r1-report.md`
- Montages: `.../evidence-r1/sc526-compare-dark.png`, `.../evidence-r1/sc526-compare-light.png` (rows: tracker, stamina-bar element, tracker with Catch breath disabled; columns TODAY | A | A30; 2x nearest)
- Crops `.../evidence-r1/sc526-<today|a|a30>-<tracker|bar>-<dark|light>.png` (+ `-cbdisabled.png` variants; 471x109 tracker, 1040x109 bar) and `sc526-<opt>-tracker-phone-dark.png`.
- Logs in `.../evidence-r1/`: `shots-base-hero.log`, `shots-A2-hero.log`, `shots-A302-hero.log`, `shots-base-bar.log`, `shots-A-bar.log`, `shots-A30-bar.log`, `freeze-A302-hero.log`, `jest-full-A30.log`, `cam-today.log`, `cam-a.log`, `cam-a30.log` (the `SC526METRICS` lines carry every number in 3.1).
- Patches: `.../sc526-r1-camera-temp.patch` (camera, reverted), `.../sc526-r1-measure-mount.patch` (D mount, local branch only).
- Scratch (per-run files, sha256 lists, scripts): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r1-impl-x7q4/`
