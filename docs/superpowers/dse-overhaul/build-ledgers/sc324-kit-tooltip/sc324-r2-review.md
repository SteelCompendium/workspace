# SC-324 round 2: independent review

**Executive summary**
- Verdict: **APPROVE-WITH-FIXES.** The branch is correct as built: every `tooltip:` caller is accounted for, hover is proven in real Obsidian 1.14.4, all mutations go red, and every gate reproduces. Both MEDIUMs are older than this branch: they are direct aria-label overwrites on iconButtons, and D1's rule says they should be folded into the fix round.
- Counts: HIGH 0, MEDIUM 2, LOW 3, INFO 5.
- Reviewed: dse `sc324-kit-tooltip` @ `0afcb2f` (fix `6f45472`), base `origin/develop` `0d69ec9`. Superproject `cfb7c00`.
- Gates (re-run by me): tsc rc0, lint rc0; jest `4738 passed / 1 skipped / 227 of 228 suites`; lifecycle `25/25 ok, 0 failed`; e2e `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`; shots 572 PNG, 0 FAIL; freeze `freeze OK (276/276 …)`; parity `0 gap(s), 0 undeclared, 24 declared`.
- Real-Obsidian hover probe: `.tooltip` text equals the new label for Advance round (+3 Malice), a condition remove button, and the two-line Complete Argument (`white-space: pre-wrap`, 84px tall).
- Mutations: 9/9 red (baseline 330/330 green across the 9 touched suites).
- D2 StaminaEditModal answer: **yes**, it writes a different string. When disabled, the accessible name becomes "No Recoveries remaining" / "Already at maximum Stamina" and "Spend Recovery" is gone. Folding it in also trips the SC-428 `test.failing` (see M1).
- The fix round also needs to cover `RecoveriesStrip.ts:276`. Catch Breath has the same bug and appears in neither the implementer's report nor D2 (M2).

Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc324-r2/` (gate logs suffix `-1792415056`, `probe-*.log`, `mutation.log`, `asar/app.js`).
Working tree: `git status --porcelain --ignored` identical before and after; HEAD unchanged.

---

## 1. Caller enumeration (independent)

`git grep -n "tooltip\s*:" origin/develop -- src` finds 16 `iconButton` option sites in 7 files: ArgumentView:401, conditions/panel:107/122, hero/view:212, initiative/view:457/712/778/858/933/1296/2055, mountChrome:199/220/232, conditionIcons:128, CompendiumMigrationModal:173. All 16 are handled in the diff and match the implementer's table. Pass-through helpers (`buttonRow`, `managedModal.footer` forwarding `IconButtonOptions[]`): the only forwarded `tooltip` was CompendiumMigrationModal (handled). No spread-forwarding helper exists. The option is removed from the interface and tsc (src + e2e) is clean, so no literal caller remains. `visual-harness/*.mjs` has no `tooltip:` option use.

Lost explanatory strings: none. Every caller whose tooltip held information missing from the label now has that information merged in. The keep-label sites (Remove / Grabbed / turn toggles / action chips / captain) had tooltips that were subsets of the label. The one exception is the portrait hint (I3), which is acceptable.

`setLabel` state flips: hero:653 and mountChrome:256 (Collapse/Expand), initiative:1631/1634 (selection), CompendiumMigrationModal:214 ("Stopping…"), MinionStaminaPoolModal:396 (`${actionText} — ${reason}`), StaminaEditModal:170 (apply button text). None of these is on a button whose tooltip changed, and none drops an explanation. **The real D1-rule violations are not `setLabel` calls.** They are the direct `tooltip()`/`setTooltip()` writes on an iconButton's `buttonEl` (M1, M2). The only two in `src` are found with `grep -rnE "(setTooltip|tooltip)\([^,]*buttonEl" src`.

## 2. Hover renders (decompiled + real-Obsidian runtime)

Decompiled from `~/.config/obsidian/obsidian-1.14.4.asar` → `app.js`:
- `setTooltip:()=>oS`; `function oS(e,t,n){e.setAttribute("aria-label",t),rS(e,n),WM===e&&ZM(e,t,n)}`
- `rS(e,t)` sets `data-tooltip-position/classes/delay/gap` only when options are passed. The kit never passed any.
- Hover is delegated: `t.on("pointerover","[aria-label]",KM)` → `QM(e)` → `e.getAttribute("aria-label")`.
- `pointerup` → `iS()` hides the tooltip and clears `WM`.

At mount, the removed `tooltip()` call did nothing else: the button is new, so `WM!==e`, and no options were passed. **Nothing setTooltip did at mount is lost.**

Runtime probe: a scratch copy of the repo plus one added lifecycle scenario, `--only=SC324-HOVER`, port 9293, with a real CDP `mouseMoved` hover. Log: `…/sc324-r2/probe-*.log`.
```
advance:   aria = tooltip = "Advance round (+3 Malice)"           dataTooltipAttrs: []
condition: aria = tooltip = "Remove condition: Bleeding"
complete:  aria = tooltip = "Complete Argument: Resolve the Argument …, etc.\nRequires Power Roll tier to be selected."  ttH 84px, white-space pre-wrap
afterSetAttr (aria-label rewritten while tooltip visible): "Advance round (+3 Malice)"   ← stale, see L2
```
Hover also shows on the disabled Complete Argument button.

## 3. Findings

### MEDIUM

**M1. `src/views/StaminaEditModal.ts:608-616`: the disabled-reason write replaces Spend Recovery's accessible name (answer to D2: it differs).**
- Scenario: open a stamina modal with 0 Recoveries. The button's visible text is "Spend Recovery", but its aria-label (both the hover and the screen-reader name) is "No Recoveries remaining", and at max Stamina it is "Already at maximum Stamina". The action is gone from the name. That breaks D1 ("lead with the action, then explanation") and WCAG 2.5.3 label-in-name. This predates the branch.
- Fix: `spendRecoveryBtn.setLabel(noneLeft ? \`${SPEND_RECOVERY_LABEL}: ${NO_RECOVERIES_TOOLTIP}\` : noGain ? \`${SPEND_RECOVERY_LABEL}: ${NO_GAIN_TOOLTIP}\` : SPEND_RECOVERY_LABEL)` in both branches, then drop the `tooltip` import if it becomes unused. Pick the separator per I2.
- **Test trap the fix round must handle:** `test/dom/views/stamina-edit-modal-matrix.test.ts:509-513` is `test.failing('[Q16] … [known bug SC-428]')` asserting `aria-label` `.not.toBe('Already at maximum Stamina')`. After the merge the assertion passes, the `test.failing` goes red, and that reads as "SC-428 appears fixed" when it is not. Rewrite it to `.not.toContain('Already at maximum Stamina')`. Do **not** delete the marker. Other assertions to update: the matrix `REASON_MAX/REASON_NONE` (:425-426, used as expected aria-labels); `stamina-edit-modal.test.ts:239-281, 445-451`; e2e `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:151,161` (STAM-Q09/Q10).
- Note: moving from `tooltip()` to `setLabel()` here also loses the live refresh of an already-visible tooltip (L2).

**M2. `src/framework/kit/RecoveriesStrip.ts:276`: read-only Catch Breath has the same bug, and it was missed (in neither the implementer's report nor D2).**
- `if (opts.readOnlyTooltip !== undefined) setTooltip(catchBreath.buttonEl, opts.readOnlyTooltip);` sets the button's whole name to "Read-only in this context". Catch Breath is icon-only under Steel (`text` is hidden), so a screen-reader user hears a button with no name. On the same read-only hero sheet, the new branch now gives Respite "Respite: Read-only in this context". The siblings are inconsistent. `heroSheet.test.ts:420-424` already works around this by finding the button "by its stable icon, not the label text".
- Scenario: a hero sheet or ds-stamina-bar with `recoveries_max`, rendered read-only (canPersist=false), for example in a hover popover or embed.
- Fix: `catchBreath.setLabel(\`Catch Breath: ${opts.readOnlyTooltip}\`)`, matching Respite. Add a jest assertion next to `heroSheet.test.ts:429` (and in the stamina-bar read-only test) that the label is `'Catch Breath: Read-only in this context'`.

### LOW

**L1. `visual-harness/obsidian-lifecycle.mjs:881` (G-S4) still selects `button[aria-label="Advance round"]` exactly.** The implementer moved every jest selector to `^=`, but the lifecycle gate was left exact. It passes today only because `Lifecycle/B.md` has no `round_gain`. If someone adds one to that fixture, the selector returns `null` and G-S4 throws on `.click()`, which looks like an adoption failure. Fix: use `.dse-init__round-advance` (stable class), or `^=`.

**L2. Bare `setAttribute('aria-label')` (iconButton mount and `setLabel`) does not refresh a tooltip that is already showing. `setTooltip` does (`WM===e&&ZM`).** The probe confirms this: after the attribute is rewritten mid-hover, the visible text stays stale until the user hovers again. Mount is unaffected. Today `setLabel` already behaves this way (pre-existing), and a mouse click hides the tooltip on `pointerup`, so the visible case is keyboard activation while the pointer rests on the button. For example: press Space on Spend Recovery while hovering, and on the last Recovery the tooltip still says "Spend Recovery" on a now-disabled button. M1's switch from `tooltip()` to `setLabel()` adds exactly that case. Fix (owner's call):
- (a) Make kit `setLabel` call Obsidian `setTooltip(buttonEl, label)`. It writes the same attribute and adds the live refresh for every `setLabel` caller. The spy assertion in `iconButton.test.ts:207-216` (`expect(spy).not.toHaveBeenCalled()` after setLabel) would need updating.
- (b) Accept and document it.

**L3. Complete Argument wording (`ArgumentView.ts:398-400`).** The text is "Complete Argument: Resolve the Argument using the current state of motivations, pitfalls, etc.\nRequires Power Roll tier to be selected." It reads acceptably, but:
- "Requires Power Roll tier" is missing an article.
- "Argument" appears twice.
- The prerequisite sentence stays after a tier is picked and after the negotiation ends. The visible hint (`hintEl`) already covers that state.

Suggested: `Complete Argument: resolve it using the current motivations, pitfalls, etc.\nRequires a Power Roll tier to be selected.` This is optional. The test uses `startsWith`/`toContain` and would need its substrings updated.

### INFO

- **I1.** Roll save `Roll save vs {name} (6+ ends)`: the merge is accepted (D2). The wording is terse but follows Draw Steel's "save ends" idiom. Optional: `(ends on 6+)`. Not a defect.
- **I2.** Separator house style for disabled reasons is now split: the colon in `Respite: Read-only in this context` (this branch) and the em dash in `MinionStaminaPoolModal.ts:396` `${actionText} — ${reason}`. The fix round should pick one for M1/M2. The colon matches this branch and the "Remove condition: X" family.
- **I3.** The initiative portrait toggle (`view.ts:~773`) dropped the "Click the portrait to mark this turn taken" hint. That fits keep-label: the hover target is the portrait itself, and the label "Toggle turn taken: {name}" says what clicking does.
- **I4.** `docs/superpowers/dse-7.0.0-release-audit.md:439` still lists SC-324 as open. D2 already folds this in.
- **I5.** Docs/JSDoc/CHANGELOG reflect the new contract: the iconButton JSDoc, the D2 spec §2.1/§2.5 (`cfb7c00`), and both CHANGELOG bullets (the five buttons listed are accurate). No stale "tooltip option" guidance remains outside the historical build-ledgers. The dse `docs/`, `AGENTS.md` and `README.md` have no iconButton API guidance.

## 4. Strings (D1 rule check)

| Button | New label | Verdict |
|---|---|---|
| Respite (writable) | `Respite: Restore Stamina + Recoveries; clear Surges, temp Stamina, and end-of-encounter conditions` | OK, action first |
| Respite (read-only) | `Respite: Read-only in this context` | OK (model for M2) |
| Complete Argument | `Complete Argument: Resolve the Argument … etc.\nRequires Power Roll tier to be selected.` | OK; wording nit L3; `\n` renders as a line break (pre-wrap), and screen readers treat it as whitespace |
| Sync without moving | `Sync without moving: Downloads the new compendium … the move can no longer be done.` | OK; "(links will break)" is covered by "Links … will stop working" |
| Roll save | `Roll save vs {name} (6+ ends)` | OK (I1) |
| Advance round | `Advance round (+N Malice)` / `Advance round` | OK |
| Keep-label sites | unchanged | OK |

## 5. Tests are not vacuous (mutation results, `…/sc324-r2/mutation.log`)

Each mutation was run in a scratch copy against the 9 touched suites (baseline 330/330 green):

| Mutation | Red tests |
|---|---|
| M1 Respite writable label to bare explanation | 2 (SC-324 Respite + the existing respite click, via the `^=` selector) |
| M2 Respite read-only to `'Respite'` | 1 |
| M3 Roll save drops ` (6+ ends)` | 1 |
| M4 Advance round drops gain | 1 |
| M5 Complete Argument bare | 1 |
| M6 Sync back to old label | 2 |
| M7 mount via `setTooltip(buttonEl, label)` | 2 |
| M8 discard-shaped: aria-label = `opts.text ?? opts.label` | 23 |
| M9 conditionIcons label to bare name | 3 |

Weakened selectors: the exact-to-`^=` prefix changes (Respite, Advance round) and the `docs-manifest.mjs` Complete Argument click still pin the button uniquely. The exact-string assertions were moved into new dedicated tests, so the change is not a weakening. Removed `setTooltip` spy assertions (initiative ×2, conditionIcons) pinned the discarded hover strings; removing them is correct, and the end-state aria-label assertions stay. e2e specs and the manifest needed no change.

## 6. Battery (my runs; logs in the evidence dir, suffix `-1792415056`)

| Gate | Result | rc |
|---|---|---|
| tsc (src + e2e) | clean | 0 |
| lint | clean | 0 |
| jest | `Tests: 1 skipped, 4738 passed, 4739 total`; `Test Suites: 1 skipped, 227 passed, 227 of 228` | 0 |
| lifecycle (port 9293) | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` | 0 |
| e2e | `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` | 0 |
| shots | 572 PNGs, 0 FAIL, all in-run OK lines | 0 |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical …)` | 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 0 |
