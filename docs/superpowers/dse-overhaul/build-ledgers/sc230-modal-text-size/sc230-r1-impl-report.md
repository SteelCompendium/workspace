# SC-230 round 1 — implement: text-size scale reaches DSE modal content

## Executive summary

- **Verdict: DONE.** Modals now track the text-size scale exactly as rendered blocks in notes
  do, confirmed by live before/after evidence at 140%, not just by source-text pin tests.
- **Root cause (two-part, file:line below):** (1) the text-scale consumer rule
  (`styles-source.css:7680`, pre-fix) targeted only `[data-dse-element]`, never `.dse-modal` —
  though `.dse-modal` already received the stamped `--dse-text-scale` custom property via
  `DseModal.open()`'s `reflectCss()` call. (2) widening the selector to `.dse-modal` alone was
  **not sufficient**: real Obsidian's own `app.css` sets `.modal-content` /`.modal-title` to an
  **absolute** font-size (`var(--font-ui-medium)`/`var(--font-ui-large)`), which breaks the
  em-based cascade between `.dse-modal` and its actual content wrappers. Card-scale never hits
  this because `zoom` isn't part of the font-size cascade at all.
- Branch `sc230-modal-text-size`, rebased onto `origin/develop` `3b25127` (moved from the
  brief's `f6fb208` mid-task; rebase was clean, no conflicts). HEAD sha
  `f2539d29a26588b3f3f53c2cde1dc9cb45807f92`.
- Gates: tsc clean; lint clean exit 0; jest **3975 passed / 1 skipped / 204 of 205 suites**
  (base at `3b25127` + this branch's own +1 net test); shots **524 PNGs, 0 FAIL**; freeze
  **`freeze OK (260/260 …)`, exit 0**; parity **0 GAPs / 0 undeclared / 16 DECLARED, exit 0**.
- No double-application confirmed live (ratio 1.0, not 1.4²) and card zoom in modals confirmed
  unchanged (untouched CSS block, its own pin tests still pass).
- No drive-by fixes. One follow-up below (test regex robustness, already fixed in this round,
  noted for awareness).

## 1. Diagnosis

### Prong 1 — was the pref stamped on `.dse-modal`? No, this was fine.

`DseModal.open()` (`src/framework/kit/managedModal.ts:112`) already calls
`prefs.reflectCss(this.dialogEl(), this.lifecycle)`, and `textScale`/`cardScale` are ordinary
`css`-bearing `PrefDescriptor`s in `src/prefs/catalog.ts:283-291` — the exact same generic
mechanism proven for `fontTitle` in the pre-existing `managedModal.test.ts` suite. I added a
new test using the **real** `DSE_PREF_DESCRIPTORS` catalog (not a fake descriptor) to confirm
this generically for `textScale`/`cardScale` specifically:
`test/dom/kit/managedModal.test.ts:355` ("SC-230 diagnosis: open() stamps the REAL
textScale/cardScale prefs on the dialog root…") — passes both before and after my CSS
changes, ruling this hypothesis out.

### Prong 2a — consumer selector scope (the ticket's stated hypothesis). Confirmed.

`styles-source.css:7672` (pre-fix): `[data-dse-element]:not([data-dse-print="on"]) { font-size:
calc(1em * var(--dse-text-scale)); }` — never mentioned `.dse-modal`, unlike the card-scale
rule a few lines below it (`styles-source.css:7697`, pre-fix numbering) which already used
`:is([data-dse-element], .dse-modal)`. Pinned as a failing test first
(`test/dom/theme/scaleRules.test.ts`, commit `d1a247b`), red against the base CSS, green after
widening the selector (commit `f7c6fbc`).

### Prong 2b — the real blocker: Obsidian's own `.modal-content`/`.modal-title` CSS. Not in the ticket text; found via runtime evidence.

Widening the selector to `.dse-modal` alone (commit `f7c6fbc`) passed every jest gate — the
source-text pin tests can't see this — but produced **byte-identical evidence PNGs** whether or
not `textScale` was set (see "Evidence" below), which is how I caught it: the brief's step 4
("produce PNGs… BEFORE and AFTER") is what exposed a fix that looked complete on paper and
did nothing visually.

Root cause: the real, pinned Obsidian `app.css` (`visual-harness/dist/obsidian-app.css:9082`
and `:9071`) sets:

```css
.modal-content { flex: 1 1 auto; font-size: var(--font-ui-medium); }
.modal-title { font-size: var(--font-ui-large); … }
```

`DseModal`'s `contentEl` (Obsidian's `.modal-content`) is the parent of `.dse-modal__body`
and `.dse-modal__footer` (`src/framework/kit/managedModal.ts:47,78`). Because these two rules
set an **absolute** font-size (not `em`/`%`), they break the ordinary inheritance chain: even
though `.dse-modal` itself correctly computes the scaled font-size (`calc(1em * scale)`),
`.dse-modal__body`/`.dse-modal__footer` never see it — they inherit from `.modal-content`'s
flat `var(--font-ui-medium)` instead. Card-scale's rule never hits this because `zoom` is a
rendering transform applied directly to whatever descendant selector matches
(`:is(.dse-sb, .dse-card)`), not something that flows through the font-size cascade at all —
which is exactly why "card zoom already reaches modals" while text-scale didn't, and why
fixing the selector text alone wasn't enough.

**Live measurement (harness, real pinned Obsidian app.css, textScale=1.4):**

| Element | Before 2nd fix | After 2nd fix |
|---|---|---|
| `.dse-modal` computed font-size | 21px (scaled — was already fine) | 21px |
| `.dse-modal__body` computed font-size | **15px (flat, unscaled)** | **21px (= 15 × 1.4)** |

Fix (commit `f2539d2`): re-apply the multiplier directly at `.dse-modal__body` and
`.dse-modal__footer` — the two DSE-owned wrappers that sit immediately below Obsidian's reset
— using the same anchored idiom and print exclusion. `.dse-modal__title` is deliberately left
unscaled: it **is** Obsidian's own modal-title chrome, the same exemption the sheet's own
`--font-ui-*` doc comment already draws for "genuine Obsidian-chrome surfaces (modal
furniture, suggest popups)".

Final selector (`styles-source.css:7680`, current):
```css
:is([data-dse-element], .dse-modal, .dse-modal__body, .dse-modal__footer):not([data-dse-print="on"]) {
	font-size: calc(1em * var(--dse-text-scale));
}
```
and its nested-root reset (`styles-source.css:7699`):
```css
:is([data-dse-element], .dse-modal, .dse-modal__body, .dse-modal__footer) [data-dse-element]:not([data-dse-print="on"]) {
	font-size: var(--dse-fs-body);
}
```

## 2. Checks the brief asked for explicitly

- **No double-application.** No shipped modal today hosts a nested `[data-dse-element]`
  (checked: no `DseModal` subclass calls any element-mount API). Probed live anyway: injected
  a synthetic `[data-dse-element="probe"]` as a child of `.dse-modal__body` (textScale=1.4) and
  measured `getComputedStyle` — `nestedFs / bodyFs === 1.0` (would be `1.4` again, i.e. 1.96×
  total, if the nested-reset didn't cover the new `.dse-modal__body`/`.dse-modal__footer`
  anchors — which it does, per the widened nested-reset rule above and its exact-selector pin
  test). Script was throwaway, run from the worktree, deleted before the final commit — not
  part of the diff.
- **Print exclusion preserved, anchored idiom.** Every one of the four hosts is compounded
  with `:not([data-dse-print="on"])` on the SAME `:is(...)` group (never a bare descendant
  `:not(...)`, the FOLLOWUPS #43 footgun) — pinned exactly by
  `test/dom/theme/scaleRules.test.ts`'s selector-equality assertions. SC-229 (the generalized
  guard) was not touched — this reuses the existing idiom verbatim.
- **Default 100% is byte-identical.** `calc(1em * 1)` is definitionally `1em`, i.e. identical
  to plain inheritance — `.dse-modal__body`/`.dse-modal__footer` now carry an *explicit*
  `font-size: 1em` at default scale where they previously had none, but `1em` on a child always
  equals its parent's computed font-size, so the computed value is unchanged. `freeze OK
  (260/260 …)` (print, byte-level) confirms this for the theme-agnostic DOM the freeze gate
  can see; modal captures aren't part of the frozen browser-camera set by design (Obsidian-
  camera output is never frozen — see `dse-verify` skill), so the freeze number is unaffected
  by this change either way, as expected.
- **Card zoom in modals unchanged.** The card-scale CSS block was not touched at all (diff
  scoped to the text-scale block only); `scaleRules.test.ts`'s "card-scale consumer" describe
  block (unmodified) still passes.

## 3. Evidence (harness capture, not a frozen fixture)

No existing browser-harness modal fixture had enough running text to show the effect clearly
(`montage-sheet-log`, the one `fullPage` INTERACTION_SHOTS entry, is mostly form labels). Per
the brief's fallback, I built a small throwaway Playwright script
(`visual-harness/sc230-evidence-shoot.mjs`, deleted before the final commit — never part of
the diff or the frozen shot set) that drives the real harness page exactly the way
`shoot.mjs` already does: `?element=conditions&fixture=default&theme=steel&bg=dark&sheet=1
[&prefs=textScale:1.4]`, clicks the real `Add condition` affordance (opens `ConditionsModal`,
a real `DseModal`, with the harness's real pinned Obsidian `app.css` cascade active), and
takes a full-page screenshot (the modal appends to `document.body`, same as the shipped
`montage-sheet-log` fixture's own `fullPage: true` branch).

Files (all in this ledger dir, `sc230-evidence-*.png`):
- `sc230-evidence-before-140.png` / `-crop.png` — **base** `f6fb208` (styles-source.css
  unchanged between `f6fb208` and the rebased `3b25127`, so this stays valid evidence),
  `textScale=1.4`.
- `sc230-evidence-after-140.png` / `-crop.png` — this branch (`f2539d2`), `textScale=1.4`.
- `sc230-evidence-after-100.png` / `-crop.png` — this branch, default `textScale=1` (100%).

Pixel diff: `before-140` vs `after-140` differ (the fix visibly changes the modal at 140%);
`after-140` vs `after-100` differ (140% is visibly larger than default). The `-crop.png`
files (860×320, cropped to the modal's condition-chip rows) make the size difference obvious
at a glance: at 140% the chip rows, icons and the "Done" button are all visibly larger than at
100%, on both the before and after captures' matching row content ("Bleeding / Save Ends",
"Slowed / EoT", "Restrained").

## 4. Commits (branch `sc230-modal-text-size`, rebased onto `origin/develop` `3b25127`)

1. `d1a247b` — `test(typography): SC-230 pin modal text-scale gap (TDD red)` — failing tests
   first (scaleRules.test.ts selector pin + managedModal.test.ts stamping proof).
2. `f7c6fbc` — `fix(typography): SC-230 widen text-scale consumer scope to .dse-modal` — first
   (incomplete) fix; superseded in substance by the next commit but kept as an honest step in
   the diagnosis (does not regress anything on its own — the selector widening is still
   correct and necessary, just insufficient alone).
3. `f2539d2` — `fix(typography): SC-230 reach modal body/footer past Obsidian's font-size
   reset` — the real fix, with the live-measured before/after numbers in the message.

No co-author trailers, no AI attribution, no tags, no pushes, DSE `main` untouched.

## 5. Gate numbers (measured on `f2539d2`, rebased onto `origin/develop` `3b25127`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **3975 passed / 1 skipped / 204 of 205 suites**, 3 snapshots |
| `npm run shots` (after `rm -f main.js styles.css`) | **524 PNGs, 0 FAIL** |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0** |
| `npm run parity` (run last) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0** |

Jest delta: the brief's baseline (3937 at `f6fb208`) is stale — `origin/develop` moved to
`3b25127` mid-task (SC-343/SC-288 landed, adding tests unrelated to this ticket) per an
in-session update; the sibling agent's message asked me to report the post-rebase count and my
own delta rather than the pre-rebase base count. This branch adds exactly **+1 net test** over
whatever `3b25127` alone reports (the new `managedModal.test.ts` stamping-proof case; the two
`scaleRules.test.ts` tests and the `fontSizeContract.test.ts` ALLOWLIST edit are modifications
to existing tests, not additions). 0 failed throughout.

## 6. Drive-by fixes

None.

## 7. Follow-ups (for the ticket owner to triage, not fixed here)

- None beyond what's already tracked (SC-229, explicitly out of scope, untouched). The one
  thing worth flagging: my first-round `scaleRules.test.ts` predicate for locating the
  nested-reset rule used a regex that broke when the selector grew a third/fourth alternative
  inside `:is(...)` (caught and fixed within this same round, before final commit — see the
  test file's `only(...)` call, now an exact normalized-string match rather than a regex). Not
  a ticket, just a note in case a future scale-consumer widening trips the same class of
  brittle-predicate mistake in a sibling test.

## 8. Artifacts (absolute paths)

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-impl-report.md`
- Logs:
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-tsc.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-lint.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-jest.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-shots.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-freeze.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-parity.log`
- Evidence PNGs (full page + crop, all six):
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-before-140.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-before-140-crop.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-after-140.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-after-140-crop.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-after-100.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-evidence-after-100-crop.png`
- Worktree (edited repo): `/home/scott/code/steelCompendium/worktrees/sc230-modal-text-size/draw-steel-elements`
  (branch `sc230-modal-text-size`, HEAD `f2539d29a26588b3f3f53c2cde1dc9cb45807f92`, clean —
  no uncommitted changes, throwaway evidence/probe scripts removed before final commit).

## Files touched (final diff, `origin/develop..HEAD`)

- `styles-source.css` — the text-scale consumer rule + its nested-root reset.
- `test/dom/theme/scaleRules.test.ts` — updated pin tests for the widened selectors.
- `test/dom/kit/managedModal.test.ts` — new diagnostic test (real catalog stamping proof).
- `test/unit/build/fontSizeContract.test.ts` — ALLOWLIST key text moved with the selector.
