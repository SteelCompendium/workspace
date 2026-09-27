# SC-230 r2: independent adversarial review of r1 (dse `f2539d2` on `3b25127`)

## Executive summary
- **Verdict: APPROVE_WITH_FIXES.** The fix works. In real Obsidian 1.14.2 at 140%, modal body text measured 15px on base and 21px on head (21/15 = 1.4, the same ratio as a note block: 22.4/16). The browser harness and the 1.13.7 app.css agree. At 100%, base and head compute identically.
- **Findings:** 0 CRITICAL / 0 HIGH / 2 MEDIUM / 3 LOW / 5 INFO. One CSS change closes both MEDIUMs.
- **MEDIUM-1:** the `.dse-modal` arm plus the body/footer arms scale text TWICE (1.96x) whenever Obsidian's `.modal-content` font-size reset is missing (a theme or snippet, or a future Obsidian). I measured this in the harness with app.css off. Nothing tests for it.
- **MEDIUM-2:** the print guard on the body/footer arms sits on nodes that are never stamped. A print-stamped `.dse-modal` still scales its body and footer (measured). This is the FOLLOWUPS #43 class, and it breaks the owner's anchoring ruling. The pin test locks in the unanchored shape.
- **Gates (re-run by me on f2539d2):** tsc clean; lint clean. jest 3975 passed / 1 skipped / 204 of 205 suites, 0 failed. shots 524 PNGs, 0 FAIL, exit 0. parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0.
- **Freeze:** `freeze OK (260/260)` against the baseline of `3b25127` (the pre-SC-328 backup; re-verified 0 mismatches). Against the baseline updated for SC-328 (08:01): 260 checked, 16 failed. The failed set equals the 16 changed Skills lines: **yes**, exact match, nothing outside it.
- **Non-vacuity:** with styles-source.css reverted to base, and again at `f7c6fbc`, 4 tests go red (2 scaleRules + 2 fontSizeContract). The pins are text-only. The new managedModal test passes on base: it is diagnostic and does not guard the fix.

## Runtime evidence
The harness probe (`sc230-r2-probe.mjs` → `sc230-r2-probe-results.json`) ran the built harness with base (`3b25127`), mid (`f7c6fbc`) and head CSS. Only harness.css differs between variants, verified by diff.

| variant | sheet (app.css) | scale | .dse-modal | .modal-content | body | footer btn | body text |
|---|---|---|---|---|---|---|---|
| base | on | 1.4 | 15 | 15 | 15 | 12.75 | 15 (bug) |
| mid f7c6fbc | on | 1.4 | 21 | 15 | 15 | 12.75 | 15 (r1 claim confirmed: no visual effect) |
| head | on | 1 | 15 | 15 | 15 | 12.75 | 15 (same as base) |
| head | on | 1.4 | 21 | 15 | **21** | 17.85 | 21 (correct) |
| head | **off** | 1.4 | 22.4 | 22.4 | **31.36** | 26.66 | 31.36 = 16 x 1.96 (**compounds**) |

- Per-text-node ratio (`sc230-r2-probe-ratio.log`), head, app.css on. Conditions modal with the add combobox open: 31 of 32 text nodes are exactly x1.4. The montage Log sheet: 14 of 15. In both, the only exception is `.dse-modal__title`. Inputs, textarea, chips and footer buttons all scale.
- Real Obsidian 1.14.2 (`sc230-r2-obsidian-probe.mjs` → `.json`, `sc230-r2-obsidian-*.png`: private Xvfb :171+, CDP 9277, scratch vault/udd, deleted after). Base at 1.4: body 15, the bug reproduces. Head at 1.4: `.dse-modal` 21, `.modal-content` 15, body 21, footer 21, button text 17.85, **title 15**. Note blocks: 22.4 over 16. The FormModal live preview text went from 12.75 to 17.85 (x1.4 once). Probe caveat: my close-modal step did not close the modals, so they stacked. Every value comes from a live-restamped DseModal at the stated scale, and the PNGs show the stack.

## Findings

### MEDIUM-1: the scale compounds (1.96x) whenever the host's `.modal-content` reset is absent
- **Where:** `styles-source.css:7692` (`:is([data-dse-element], .dse-modal, .dse-modal__body, .dse-modal__footer):not(...)`).
- **Why:** `.dse-modal` computes `1em x s`, and body and footer apply `x s` again. The result is correct only because stock app.css re-sets `.modal-content { font-size: var(--font-ui-medium) }` between the two. That rule exists in 1.13.7 (`dist/obsidian-app.css:9082`) and in 1.14.2 (asar line 9264).
- **Failure scenario:** any theme or CSS snippet that sets `.modal-content { font-size: inherit | 1em | 100% }`, or an Obsidian release that moves that declaration. Every DSE modal then renders at scale² (140% gives 196%; 60% gives 36%). Measured in the harness with the sheet off: body 16 → 31.36.
- **Not caught by:** the jsdom pins (text only) or the harness shots (modal captures run with sheet=1 only).
- **Fix:** take `.dse-modal` out of the font-size arm and anchor the body/footer arm on the modal. Keep `.dse-modal` in the nested-root reset.
  ```css
  [data-dse-element]:not([data-dse-print="on"]),
  .dse-modal:not([data-dse-print="on"]) :is(.dse-modal__body, .dse-modal__footer) {
  	font-size: calc(1em * var(--dse-text-scale));
  }
  ```
  - If the fontSizeContract allowlist keys by one selector per rule, split this into two rules.
  - Nothing else in the sheet sets font-size on `.dse-modal__body` or `__footer`.
  - The scale then applies exactly once, with or without the host reset.
  - The only cost: `.dse-modal` itself stops scaling. In real Obsidian its only effect is em-based chrome such as `.modal-header { margin-bottom: 0.75em }`.
  - Add a runtime pin: harness body font-size at textScale 1.4 must be exactly 1.4x its value at 1, with `sheet=1` AND `sheet=0`.

### MEDIUM-2: the body/footer print exclusion is not anchored to the stamped node
- **Where:** `styles-source.css:7692`; pinned as-is by `test/dom/theme/scaleRules.test.ts:82-84` and `test/unit/build/fontSizeContract.test.ts:199`.
- **Why:** `:not([data-dse-print="on"])` is compounded onto `.dse-modal__body` / `__footer`, which nothing ever stamps. Print stamps element roots (`printMedia.ts` and pipeline `reflect()`); DseModal only calls `reflectCss()`. So the guard is always true, and a stamped ancestor never excludes these arms. That is the #43 shape the owner ruling forbids ("exclusion compounded onto the stamped node").
- **Proof** (constructed DOM, head, `sc230-r2-probe-results.json` → `probes`):
  - `.dse-modal[data-dse-print=on]` with `--dse-text-scale: 1.4`: modal 15 (excluded), but body 21 and footer 21 (scaled).
  - `[data-dse-element][data-dse-print=on] > .dse-modal__body`: root 15, body 21.
  - The unstamped control DOM scales the same way.
- **Live impact:** none today. Modals are never stamped, and freeze does not move.
- **Fix:** the same selector as MEDIUM-1 (`.dse-modal:not([data-dse-print="on"]) :is(.dse-modal__body, .dse-modal__footer)`). Update the pin and the allowlist key. Add a DOM-level assertion: a stamped `.dse-modal` does not scale its body.

### LOW-1: the unscaled title inverts the hierarchy in current Obsidian (judgment call)
- **Where:** `styles-source.css:7688-7691` (the comment exempting the title).
- **What happens:** installed Obsidian **1.14.2** changed `.modal-title` to `var(--font-ui-medium)` = 15px; the 1.13.7 pin has `--font-ui-large` = 20px. At 140% in real 1.14.2, the uppercase DSE title is 15px over 21px bold body text (`sc230-r2-obsidian-head-conditions-14.png`).
- **Conflict with the ruling:** the owner's ruling says modals track text size "exactly as rendered blocks in notes do", and block headings scale. The title is DSE-styled (`--dse-font-title`, 700, uppercase), so the "Obsidian chrome" exemption is arguable.
- **Evidence gap:** the r1 evidence uses the 1.13.7 pin (title 20px), which hides the inversion.
- **Fix:** the owner decides. Either scale `.dse-modal__title` (anchored the same way), or show Scott 1.14.x images of the exemption and get his call.

### LOW-2: the r1 evidence overclaims and isn't fit for the Scott ask as-is
- **Overclaim:** `sc230-evidence-before-140-crop.png` and `sc230-evidence-after-100-crop.png` are byte-identical (sha `eadb6944…`). That is correct and is the proof of the bug. But the report says the crops show "icons and the Done button … visibly larger … on both the before and after captures". The Done button is not in any crop, and the crops clip the gear icons at the right edge.
- **What does show the change:** the full-page PNGs (before-140 vs after-140).
- **Other limits:** the harness mock has no dialog box (the title sits to the left of the body), and it uses the 1.13.7 sheet.
- **Fix:** for the Scott ask, capture real Obsidian: `obsidian-camera --element=modal-conditions` on a private display, with textScale 1 vs 1.4, on base and head.

### LOW-3: no CHANGELOG entry
- The DSE `CHANGELOG.md` 7.0.0 section carries a `[FIX]` bullet per shipped fix (SC-288, SC-241, SC-343). This is a user-visible change and has none. Add one.
- Optional: `src/prefs/catalog.ts:292` help text and `docs/settings.md:41-42` say "inside elements". Consider "and their dialogs".

### INFO
1. The r1 claim that "no DseModal subclass calls any element-mount API" is false. `FormModal` mounts a live element preview into `.dse-modal__body` (`src/authoring/FormModal.ts:97, 238-241`). It bypasses the pipeline, so the preview has no `[data-dse-element]`, and its text inherits the scaled body once (real 1.14.2: 12.75 → 17.85). There is no compounding, so the behavior is correct.
2. Modal enumeration: all 9 DseModal subclasses render only into `this.body` / `this.footer()`. They are FormModal, LogActionModal, CompendiumMigrationModal, MontageAddHeroModal, MontageSetLimitsModal, LegacyCompendiumModal, StaminaEditModal, ConditionsModal, ResetEncounterModal and MinionStaminaPoolModal. `CompendiumSearchModal` (`src/authoring/CompendiumSearchModal.ts:73`) is a `SuggestModal`, not a DseModal, so it gets neither text scale nor card zoom. That fits the "suggest popups are Obsidian chrome" exemption.
3. Nested element root in a modal body: 21 = body, so no compounding (the widened nested reset works). A nested `.dse-modal` inside a body compounds at the `.dse-modal` level (21 → 29.4), but the `.modal-content` reset shields its body. That DOM shape doesn't happen in practice: Obsidian stacks modals as sibling containers. A `.dse-modal__body` inside a note element root compounds (22.4 → 31.36) because the nested reset only covers `[data-dse-element]` descendants; this is not a shipped shape. The MEDIUM-1 fix removes all three.
4. Card zoom in modals is unchanged: that CSS block is untouched and its pins pass. Default 100% is identical: all base/head computed values match at scale 1, in both the harness and real Obsidian.
5. Main checkout note (not SC-230): at review time `/home/scott/code/steelCompendium/workspace` shows ` M draw-steel-elements`, from another session. I left it alone.

## Tree state
The worktree was clean before and after (`git status --porcelain` empty, HEAD `f2539d2`). I temporarily replaced `styles-source.css` for the revert probes and restored it with `git checkout`. I removed `main.js` / `styles.css` after building; the `main.css` rebuild is gitignored and was present before. `visual-harness/shots` and `dist` were regenerated by the gates (gitignored). No leftover Xvfb or Obsidian processes.
