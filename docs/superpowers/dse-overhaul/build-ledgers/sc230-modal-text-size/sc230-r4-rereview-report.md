# SC-230 r4: scoped re-review of the r3 delta (dse `0dbab59` on `c524fd2`)

## Executive summary
- **Verdict: APPROVE_WITH_FIXES.** The code is approved as-is. The only fix is to recapture the evidence before Scott sees it (LOW-1).
- **Findings:** 0 CRITICAL / 0 HIGH / 0 MEDIUM / 1 LOW / 5 INFO. All five r2 findings are closed, each proven by a runtime probe.
- **Real Obsidian 1.14.2, head at 140%:** title text, body and footer all go 15 → 21px (x1.4). With `.modal-content` and `.modal-title` neutralized, they stay 21 (no compounding). With the dialog root print-stamped, all are 15. At 100%, the head capture is byte-identical to base (sha `69d732ee…`). The dialog's accessible name ("CONDITIONS") is unchanged from base.
- **The new runtime gate `assertModalTextScaleAnchoring` is non-vacuous.** I ran its verbatim source against CSS variants: RED on the r1 tip (1.96x), RED on base (1.0x), RED on "head + `.dse-modal` re-added" (1.96x), GREEN on head.
- **The jsdom pins are non-vacuous.** Un-anchoring the print guard fails `scaleRules` and `fontSizeContract`. Reverting the title span fails 2 `managedModal` tests.
- **Gates (my own runs on `0dbab59`):** tsc clean; lint clean. jest 3990 passed / 1 skipped / 205 of 206 suites, 0 failed. shots 524 PNGs, 0 FAIL, with the "modal text-scale anchoring OK" line. freeze `260/260`, exit 0. parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0. All match the r3 report.
- **LOW-1:** the r3 evidence has an inconsistent focus state. `base-140` differs from `base-100` only by a focus ring on the first gear button, so the base pair can't show "nothing changed".

## Scope
- `git range-diff 3b25127..f2539d2 c524fd2..7546028` shows all three r1 commits identical after the rebase.
- The r3 delta is `7546028..0dbab59`: 2 commits, `3eda109` and `0dbab59`.

## Brief items

| # | Check | Result |
|---|---|---|
| 1 | MEDIUM-1 closed | Real Obsidian, head at 1.4: body 21 with the resets present and 21 with them neutralized (`sc230-r4-obsidian-probe.json`). The harness gate goes red on the r1 tip and on the `.dse-modal`-re-added variant, both `withoutHostReset: ratio 1.96`. |
| 2 | MEDIUM-2 closed | Real Obsidian, head at 1.4, `data-dse-print=on` set live on `.modal.dse-modal`: title-text, body and footer are all 15. The jsdom `Element.matches` pins assert the anchored shape; un-anchoring the selector makes the suite fail. |
| 3 | Title scaling | Title text 15 → 21 (x1.4 of its own 100% size). The `.modal-title` element itself stays 15. At 100%, the head capture is byte-identical to base. The print exclusion is anchored on `.dse-modal`. |
| 4 | CHANGELOG / docs | The `[FIX] **…** (SC-230).` bullet follows the 7.0.0 section convention, and its claims are accurate. The help text and `docs/settings.md:42-43` wording are fine (see INFO-3). |
| 5 | Evidence PNGs | All six are real Obsidian, one modal each, whole dialog, nothing clipped. One problem: LOW-1 (inconsistent focus state). |
| 6 | Battery | See the summary; logs are listed under Artifacts. |

## Owner extras
- **Every title setter uses `setDseTitle()`:** 16 call sites across all 10 DseModal subclasses. `negotiation/view.ts:100` calls `.setTitle` on a Menu item, not a modal. No code reads the title's child nodes. The 9 existing tests that read `.dse-modal__title` use `textContent`, which is unaffected.
- **Re-titling:** `CompendiumMigrationModal` re-titles 4 times. The test "re-titling replaces the span in place" pins this (verified can-fail).
- **No title is ever empty,** so the `.modal-title:empty` hide rule is not affected.
- **Accessible name:** the same "CONDITIONS" on base and head (CDP `Accessibility.getPartialAXTree`).
- **CSS keyed on the title:** every rule on `.dse-modal__title` (font-family, weight, uppercase, text-shadow, color, letter-spacing) sets inherited properties, so the span inherits them. See INFO-4 for letter-spacing.

## Findings

### LOW-1: the evidence PNGs have an inconsistent focus state
- **Where:** `sc230-r3-evidence-base-140.png` and `sc230-r3-evidence-head-140.png` show the auto-focus ring on the first gear button. `sc230-r3-evidence-base-100.png` and `sc230-r3-evidence-head-100.png` do not.
- **What it looks like:** `base-100` vs `base-140` differ only in that ring (diff bbox x 399–428, y 49–78). Base truly renders identically at 140% (my captures of base at 1 and 1.4 are pixel-identical), but a side-by-side of r3's pair shows a spurious difference. Likewise, the head 100-vs-140 pair mixes a state change into the size change.
- **Fix:** recapture with one focus state for every shot, either by blurring `document.activeElement` before each capture or by keeping the ring in all of them.
  - Alternatively, use my r4 captures `sc230-r4-obsidian-{base,head}-plain-{1,14}.png`. The ring is present in all four; base 1 and 1.4 are pixel-identical; head 1 is byte-identical to base 1. They include an 8px margin of the note behind the dialog.
  - Also fold in the title-unscaled comparison for Scott's taste call: `sc230-r3-evidence-head-140-title-unscaled.png` is fine as-is.

### INFO
1. **The runtime gate covers only the body.** It does not cover the footer, the title, or print anchoring (the un-anchored variant is GREEN). Print anchoring is covered by the jsdom `matches` pins, which I proved can fail. The title can't compound by construction, because `.modal-title` is never scaled. Optional: extend the gate to measure `.dse-modal__title-text` and a stamped `.dse-modal`.
2. **The gate exits via `process.exit(1)` inside the try block.** That is the same convention as the file's other 24 gates, so no action.
3. **Help text overclaims slightly.** `src/prefs/catalog.ts:292` says "Applies to every Draw Steel element and dialog", but `CompendiumSearchModal` (a SuggestModal) is not scaled. The owner ruled it Obsidian chrome. Optional rewording: "and its dialogs".
4. **Title letter-spacing doesn't scale.** `letter-spacing: 0.01em` is computed on `.modal-title` and inherited by the span as an absolute length, so at 140% it stays 0.15px instead of 0.21px. Imperceptible.
5. **Pre-existing, out of scope:** the dialog's AX role is `generic` (no `role="dialog"`) on base and head alike. This could be a tangent ticket if the owner wants one.

## Tree state
- The worktree was clean at start and end: `git status --porcelain` empty, HEAD `0dbab59`, no stashes.
- For the can-fail probes I temporarily edited `styles-source.css` and `src/framework/kit/managedModal.ts`, then restored both with `git checkout`.
- The base bundle was built from `git archive c524fd2` in the scratchpad.
- I removed `main.js` and `styles.css` after building.
- No Xvfb or Obsidian processes remain, and the scratch vault and user-data dir were deleted.

## Artifacts
- Gate logs: `sc230-r4-{tsc,lint,jest,shots,freeze,parity}.log`
- Can-fail logs: `sc230-r4-gate-canfail.mjs` + `.log`, `sc230-r4-revert-unanchored.log`, `sc230-r4-revert-titlespan.log`
- Real-Obsidian probe: `sc230-r4-obsidian-probe.mjs` / `.json` / `.log`
- Real-Obsidian captures: `sc230-r4-obsidian-{base,head}-{plain,neutralized}-{1,14}.png`
