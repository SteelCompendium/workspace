# SC-498 r2 scoped re-review (delta 47449b6..213f29b)

## Executive summary
- **Verdict: LAND-READY.** Reviewed dse `213f29b` (commits 4fd6002, 124597e, 213f29b on r1's `47449b6`). Superproject unchanged at `874700a`. `origin/develop` is still `9f08f06`: not moved, no rebase needed. The worktree is clean at `213f29b`; the superproject's ` M draw-steel-elements` (pointer not bumped) is as found.
- **Findings on the delta: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 2.** Every r1 fold is done correctly.
- **Gates, re-run by me:** jest **5864 passed / 1 skipped / 241 of 242** (tsc+lint rc 0). lifecycle **35/35** (G-S36 ok). e2e **`108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`**. shots rc 0, **592** PNGs, 0 FAIL, all in-run lines present; freeze **`freeze OK (280/280 …)`**.
- **LOW-2 assertion is meaningful, not false comfort.** I injected a "focus the bar on mouse press" change into a scratch copy of G-S36, and step 3 FAILs ("a mouse press on the bar draws the focus ring"). Without the injection it passes. It does not catch a `:focus-visible`→`:focus` CSS swap on its own, but jest already pins that selector. Keep it; no rewording needed.
- **LOW-1:** `aria-description="Press Enter or Space to open the Stamina editor"` is set only on the keyboard bar. It is asserted by jest and by G-S36. axe 4.10.3 passes it under `aria-valid-attr` and `aria-allowed-attr`. The experimental `focus-order-semantics` rule still flags the group, as expected under the owner's ruling (INFO-A).
- **INFO-5:** no "Edit stamina" (lower-case) text remains anywhere in the dse worktree or the superproject (src, tests, e2e, harness, docs).
- **Follow-up 1:** no host lost its pointer cursor. Hero sheet, initiative rows, the standalone element and the sidebar pin copy all pass owner + onClick whenever they are writable. The flipped kit test is correct, and positive cases are pinned elsewhere.

## Gates (213f29b; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-review-r2/`)
| Gate | Result | Log |
|---|---|---|
| tsc + lint | rc 0 / rc 0 | `rv-tsc.log`, `rv-lint.log`, `rv-static.rc` |
| jest | `Tests: 1 skipped, 5864 passed, 5865 total`; `Test Suites: 1 skipped, 241 passed, 241 of 242 total`; rc 0 | `rv-jest.log` |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 35/35 ok, 0 failed`, rc 0. G-S36 ok line now ends "mouse: bar not focused (the element click shield, pipeline armClickShield, cancels the mousedown focus), no ring while pressed and after close (bar not focused)" | `rv-lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0. `initiative/stamina-entry.e2e.ts` PASSED | `rv-e2e.log` |
| shots | rc 0, 592 PNGs, 0 `FAIL` lines. Present: host-copy pin OK (1.15.0), button host-leak OK (113 kinds / 678), modal button host-leak OK (10 / 9 / 38 / 228), text scale OK (1626), text scale once OK (107256 / 214 loads), pressed toggle parity OK, pipette selected look OK, chrome host-leak OK (18), and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning. It ran about 14 min: the harness moved it to the background past the 600 s tool limit, and I read its own rc file and log | `rv-shots.log`, `rv-shots.rc` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical …)`, rc 0 (its own call) | `rv-freeze.log`, `rv-freeze.rc` |

Parity was not re-run: the delta touches no CSS and no DOM class or structure, and the brief scoped it out.

## 1. LOW-1 and LOW-2
**LOW-1 (aria-description).**
- `src/framework/kit/StaminaBarPanel.ts`: `KEYBOARD_HINT` is set in `makeKeyboardOperable`, so it appears only on bars that are actually keyboard stops. Read-only bars, bars with no handler and `keyboard: false` bars get none.
- The text is static, so it has nothing to keep current. The name, which does change, is still kept current by `updateStaminaBar`.
- Wording: "Press Enter or Space to open the Stamina editor". It is accurate (both keys work), and it matches the modal, whose title is "Stamina".
- Tests:
  - `staminaBarPanel.test.ts`, the "exactly one tab stop" test, asserts the exact string.
  - G-S36 asserts it in real Obsidian, and my A run passed.
- axe-core 4.10.3 in real Obsidian (`mx-G-axe.log`, `probe/RV-MOUSE.json`):
  - The bar passes `aria-valid-attr`, `aria-allowed-attr`, `aria-allowed-role` and `aria-prohibited-attr`.
  - The default rules report 0 violations.
  - The only violation is the experimental, opt-in `focus-order-semantics`, which looks at the role only (INFO-A).

**LOW-2 (G-S36 no-ring-on-click).** I ran a discrimination matrix: a scratch copy of HEAD's G-S36, port 9289, its own Xvfb (`mx-summary.txt`).

| Run | Bundle | Change | Step 3 |
|---|---|---|---|
| A | fix | none | ok |
| B | CSS mutant (`.dse-stamina--clickable[tabindex]:focus` instead of `:focus-visible`) | none | ok |
| C | fix | window capture `pointerdown` → `bar.focus()` (a future "focus on press") | **FAIL**: `a mouse press on the bar draws the focus ring: {"focused":true,"visible":true,"outline":"solid"}` |
| D | CSS mutant | same injection | **FAIL** (same) |
| E/F | mutant / fix | injection + a stricter `outline === 'none'` check | **FAIL** (same) |

- The implementer is right that step 3 cannot fail today: the click shield (`src/framework/pipeline.ts:220-238`, `preventDefault` on mousedown/pointerdown) means a press never focuses the bar.
- It is still not false comfort. Run C shows that the moment anything focuses the bar on a press, Chromium/Electron matches `:focus-visible` and the shared rule paints the ring, and the assertion catches it.
- Run B shows its blind spot: a CSS change from `:focus-visible` to `:focus` alone. With the shield in place the bar never gets focus, so there is nothing to paint. That blind spot is already covered by jest: `stamina-bar.test.ts` (the ring+print test requires `.dse-stamina--clickable[tabindex]:focus-visible`) and the `kit-index.test.ts` shared-ring list.
- The comment says honestly that taking focus is "recorded, not required", and the ok line reports which case happened. No rewording needed.
- The stricter variant (E/F) adds nothing over the current check, so I do not recommend changing it.

## 2. INFO-4 and INFO-5
- **INFO-4:** the `makeKeyboardOperable` doc comment now leads with the chrome panel mounting inside the cluster plate. It explains why it is `group` and not `button`, and why there is no `aria-haspopup` (not allowed on `group`). The stale "Legacy shows the track" sentence is gone. Accurate.
- **INFO-5:** `src/elements/initiative/view.ts:1454` and `:1808` now read `Edit Stamina: ${name}`; updated in `initiative.test.ts:352/356` and `e2e/specs/initiative/stamina-entry.e2e.ts:110`.
  - `grep -rI "Edit stamina"` over the whole dse worktree (excluding `node_modules` and `.git`) and over the superproject worktree (docs, CHANGELOG, `.claude`) returns nothing.
  - The only aria-label-prefix selector in the harnesses is `button[aria-label^="Edit "]` (`obsidian-camera.mjs:212`, a feature card). It does not depend on case.
  - The docs manifest triggers on `.dse-init__stamina` by class, not by label.

## 3. Follow-up 1: `dse-stamina--clickable` only with a handler
- New rule: `hasHandler = canPersist && !!owner && !!onClick` (`StaminaBarPanel.ts:115`). Before, it was `canPersist` alone.
- What each host passes:
  - **Standalone `ds-stamina-bar`** (`stamina-bar/view.ts:119`): `owner: this`, and `onClick` whenever `canPersist`, so it is clickable when writable. This also covers the **sidebar pin copy**, which is the same element rendered in the sidebar. In r1 I measured it as clickable, a tab stop, and opening the modal on Enter.
  - **Hero sheet** (`hero/view.ts:327`): `canPersist: !readOnly`, `owner: this`, `onClick` when `!readOnly`. Clickable exactly when writable.
  - **Initiative rows** (`initiative/view.ts:1111`): `canPersist: canWrite`, `owner`, and `onClick` when `canWrite && onClick`. Both callers pass a non-null closure (`openHeroStamina`, `openDetailStamina`). Clickable exactly when writable.
  - **Modal previews** pass `cluster: false` and no handler. They were never clickable in practice (`formModal.test.ts:278` expects false).
- No host lost the cursor where a click works.
- The only CSS consumer is `cursor: pointer` (`styles-source.css:1487`) plus the ring selector, which already needed `[tabindex]`.
- The harness and e2e selectors on `.dse-stamina--clickable` (`shoot.mjs:2805/2818`, `docs-manifest.mjs:371/584`, `obsidian-camera.mjs:175/181`, `stamina-modal-stepper.e2e.ts:207`) all target the standalone bar with a handler. Shots and e2e stayed green.
- **The flipped kit test** (`staminaBarPanel.test.ts:35`, the D7 Task 1 geometry test) renders `{ canPersist: true }` with no owner and no handler. The bar is inert, so `false` is the right expectation under the new rule.
  - It is not a weakened test: the true case is covered by the new test at `:289-297` (owner+handler → true; no handler / no owner / `canPersist: false` → false).
  - The true case is also pinned per host: `stamina-bar.test.ts:171`, `heroSheet.test.ts:197`, `stamina-entry-points-matrix.test.ts:76`, `initiative.test.ts:1302/1321`.
  - The false case is pinned in `stamina-bar.test.ts:384`, `heroSheet.test.ts:431` and `initiative.test.ts:1436` (read-only hosts).

## Findings
- **INFO-A**: axe's experimental `focus-order-semantics` still flags the bar. It checks the role only, and `aria-description` does not change that. This is the ruled trade-off (keep `group` plus the description); recorded for completeness. No action.
- **INFO-B**: G-S36 step 3 does not catch a `:focus-visible`→`:focus` swap by itself (run B). jest pins that selector, so nothing is needed. If the owner wants the lifecycle to stand alone, one line in step 3 would do it: after the Tab-focus step, assert `getComputedStyle(bar)` is `none` when the bar is focused but not `:focus-visible`. I do not recommend the extra code.

## Artifacts
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-review-r2/`
- Gate logs: `rv-tsc.log`, `rv-lint.log`, `rv-jest.log`, `rv-static.rc`, `rv-lifecycle.log`, `rv-lifecycle.rc`, `rv-e2e.log`, `rv-e2e.rc`, `rv-shots.log`, `rv-shots.rc`, `rv-freeze.log`, `rv-freeze.rc`
- Matrix: `run-matrix.sh`, `mx-summary.txt`, `mx-A-fix.log`, `mx-B-cssfocus.log`, `mx-C-fix-inject.log`, `mx-D-cssfocus-inject.log`, `mx-E-cssfocus-inject-strict.log`, `mx-F-fix-inject-strict.log`, `mx-G-axe.log`, `harness/visual-harness/rv2-probe.mjs`, `bundle-fix/`, `bundle-cssfocus/`
- Probe output: `probe/RV-MOUSE.json`, plus the FAIL screenshots of runs C to F: `probe/dse-obsidian-lifecycle-kg6qJZ-G-S36-FAIL.png` (C), `probe/dse-obsidian-lifecycle-7oVdib-G-S36-FAIL.png` (D), `probe/dse-obsidian-lifecycle-pHF7IS-G-S36-FAIL.png` (E), `probe/dse-obsidian-lifecycle-B67Wy8-G-S36-FAIL.png` (F). I removed each run's `/tmp/dse-obsidian-lifecycle-*` temp dir by its exact path.
