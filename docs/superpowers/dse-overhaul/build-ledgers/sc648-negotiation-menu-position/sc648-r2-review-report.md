# SC-648 r2 independent review — negotiation options menu position

## Executive summary
- **Verdict: LAND-READY.** Reviewed dse `sc648-negotiation-menu-position` @ **544fd4e0** (base 09c879f2) + superproject CHANGELOG **64b43026**.
- Findings: HIGH 0 · MEDIUM 0 · LOW 1 (e2e helper's flip-up branch is wrong; latent, not hit by any test today) · INFO 4.
- Fix works in real Obsidian 1.14.4: Enter / Space / programmatic `.click()` open the menu beside the button in Reading view, Live Preview, the right sidebar, a popout window (menu goes into the popout's document), a 720 px window and a scrolled page. Mouse path unchanged.
- Revert probe: with the base view.ts, NEGO-R06 / R07 / L06 go red (menu at x 2, y 2) and NEGO-R08 stays green; the jest keyboard test goes red and the jest mouse test stays green. The tests do catch the bug.
- Gates (mine): tsc + lint clean; jest 13319 passed / 2 skipped (fresh); e2e `595/611 ok, 0 failed, 16 known-bug, coverage: 417/417 pairs`; lifecycle 64/64 (21+16+9+4+7+4+3); styles.css sha256 `18730938…f1f9`, the same as the base, so shots / freeze / parity carry.
- Shared-chrome survey confirmed: `new Menu(` / `showAtMouseEvent` have one call site in `src/`, and no other popover is placed from a click's coordinates.
- Scope clean: no change to the menu items, Reset focus, SC-640 or SC-649 files. The CHANGELOG bullet is plain words under `## Unreleased`. No pointer-bump commit.
- Before landing: develop has moved to 3e88b3f5 (SC-629). The files don't overlap and the merge has no conflicts, but after the rebase styles.css will no longer match 18730938. Compare it to a clean 3e88b3f5 build instead.

## Findings

### LOW-1 — `expectMenuAtButton` gets the "flipped up" case wrong (latent false-red, and a wrong comment)
- **Where:** `draw-steel-elements/e2e/driver/negotiation.ts:149-156` (the doc says "it ends at the button's top when it flips up"; the check is `Math.abs(m.bottom - b.top) <= tol`).
- **Fact:** In Obsidian 1.14.4 and 1.15.1, `Menu.showAtPosition` (app.js) runs `if (y + menuH > body.clientHeight) y = Math.max(padTop, y - menuH); top = y + 2`. So a menu that flips up ends at the anchor `y`, which is the button's **bottom**, not its top. It covers the button. Measured in probe RPROBE-02 (button scrolled near the window bottom): button 1046–1070, menu 1033–1071.
- **Failure scenario:** a future test (or a different window size or fixture) puts the options button within about 40 px of the window bottom. `expectMenuAtButton` then throws "opened away from the button, vertically" although the product did the right thing. The comment also gives readers the wrong idea of what Obsidian does. No current test hits this, because every caller is at 1440x1100 with the card near the top.
- **Fix:** replace the second vertical alternative with `Math.abs(m.bottom - b.bottom) <= tol` (the clamped case) and correct the doc to say "when there is no room below, Obsidian moves it up so it ends at the button's bottom (it covers the button)". Small enough to fold into this branch, or leave as a nit. Not a landing blocker.

### INFO-1 — Near the window bottom the menu covers its own button (Obsidian's own behaviour)
Same mechanism as LOW-1. It only happens inside a strip about one menu-height (about 38 px) tall at the window bottom. Obsidian's own ⋮ menus and the mouse path do the same: with the mouse the menu ends at the pointer and covers the top half of the button. No action for SC-648. If Scott ever wants "flip above the button", it needs a post-show correction (read the menu's rect and set `top = rect.top - h`), because `MenuPositionDef` has no anchor height.

### INFO-2 — Obsidian's own idiom for ⋮ buttons (optional, not a defect)
Obsidian positions its own ⋮ menus (the view header's "More options", plugin actions, the ribbon menu, the PDF toolbar) the same way for mouse and keyboard:
`menu.setParentElement(btn).showAtPosition({ x: r.x, y: r.bottom, width: r.width, overlap: true, left: true })`.
The comment at `view.ts:169` ("No `width`: Obsidian then moves the menu that far right of `x`") is only true without `overlap: true`. With `overlap: true, left: true`, Obsidian lines the menu's right edge up with the button's right edge and opens it leftward, as its own ⋮ does. `setParentElement` also adds `has-active-menu` to the button while the menu is open, and hides the menu if the button is detached or hidden (for example, the card re-renders). The current form meets the ticket and the owner's "mouse unchanged" decision. Adopting the idiom is an owner or Scott choice and could be a follow-up. Do not change it here unless asked.

### INFO-3 — Hidden copy of the card
In every Reading-view pane, a hidden copy of the card (0x0, `offsetParent` null) comes first in DOM order before the visible one. A programmatic `.click()` on that hidden copy opens the menu at (2, 2), because its rect is all zeros. A keyboard or AT user cannot reach it (it is not focusable), so there is no action. It is noted because a probe that uses `document.querySelector` on `.mod-right-split [data-dse-control="negotiation.menu"]` picks the hidden copy. The driver's `menuPlacement` scopes to `.markdown-reading-view`, which picks the visible one, so it is fine.

### INFO-4 — Landing notes
- `origin/develop` is now **3e88b3f5** (SC-629: 74e2a649, 3e88b3f5), ahead of the branch base 09c879f2. SC-629 touches `styles-source.css`, montage files, `e2e/README.md` and `wrong-values.e2e.ts`, none of SC-648's files. `git merge-tree 09c879f2 3e88b3f5 544fd4e0` gives 0 conflict markers. After the rebase, check styles.css against a clean 3e88b3f5 build, not against 18730938.
- SC-649's branch adds one line (`GHOST_APPEAL`, around line 24) to `e2e/driver/negotiation.ts`. SC-648's additions there are at lines 135-158, a different hunk, so the textual merge should be clean. I could not run merge-tree because SC-649's commits are not in this worktree's object store.
- r1 said the e2e window "cannot be resized (`Browser.getWindowForTarget` unsupported)". `driver/recorders.ts` `setWindowSize` (electron `remote.getCurrentWindow().setSize`) does resize it: I used it for 720x640 and 420x640. This is only a note for future probes.

## What I checked (execute and probe)

### 1. Fix correctness (`src/elements/negotiation/view.ts:166-177`)
- `iconButton` binds through `owner.registerDomEvent(buttonEl, 'click', …)` and calls `onClick` synchronously, so `event.currentTarget` is the button. The cast instead of `instanceof` is right for popouts.
- `showAtPosition(pos, doc)` exists since 1.1.0 (typings). `showAtMouseEvent` is `showAtPosition({x: clientX, y: clientY}, e.doc)` (app.js), so the keyboard bug was exactly clientX / clientY being 0, and both paths share the same clamping code.
- Throwaway probe spec in a scratch copy (`git archive` of 544fd4e0, node_modules symlinked; the reviewed worktree was not touched). Measurements in viewport px:

| Case | Button (l, t–b) | Menu (l–r, t–b) | Verdict |
|---|---|---|---|
| Reading view, programmatic `.click()` (detail 0) | 1179, 275–299 | 1181–1350, 301–339 | beside |
| Scrolled, button near window top | 1179, 90–113 | 1181–1350, 115–154 | beside |
| Scrolled, button near window bottom (1100) | 1179, 1046–1070 | 1181–1350, 1033–1071 | on-screen, covers the button (INFO-1) |
| Window 720x640, Enter | 619, 274–298 | 449–618, 300–338 | flipped left, beside |
| Window 720x640, Space | same | 449–618, 300–338 | beside |
| Window 720x640, mouse | same | 461–629, 287–326 | at the pointer (unchanged) |
| Right sidebar, real Enter | 1353, 214–236 | 1183–1352, 238–277 | flipped left, beside |
| Right sidebar, programmatic click | same | same | beside |
| Popout window 900x700, programmatic click | 739, 270–294 | 569–738, 296–335; **in the popout's document**, 0 menus in the main window | beside, right document |
| Popout, real Enter (wdio switched to the popout) | same | 569–738, 296–335 | beside |
| Popout, mouse | same | 581–749, 283–322 | at the pointer |
| Window 420x640 | 417, 805–828 (button below the 640 px viewport after the re-layout) | 247–415, 791–830 | follows the button; the button itself is off-screen, so this is a layout artifact and not a finding |

- AT and programmatic activation: a `.click()` has detail 0 and is anchored to the button (measured above). A click with detail ≥ 1 and real coordinates uses the pointer path. Both are fine.

### 2. Shared-chrome survey
`grep` over `src/` and `main.ts` finds one `Menu` import, `new Menu(` and `showAtMouseEvent` only in `src/elements/negotiation/view.ts`, and the only `clientX`/`clientY` use is `src/refs/sccLinkCm6.ts:38`. That one is `posAtCoords` in a CM6 **mousedown** handler: not a menu, and the keyboard never raises it. The other popovers are not placed from coordinates: the RecoveriesStrip popover is a CSS-placed child of its root, the authoring suggesters are `EditorSuggest` (cursor-anchored by Obsidian), FormModal and SettingsTab use native `addDropdown`, and `hoverLinks.ts` only reads hover events. **The owner's claim is confirmed. No sibling element has this bug.**

### 3. Tests are not vacuous
- Revert copy (`git archive` 544fd4e0 with `src/elements/negotiation/view.ts` from 09c879f2): e2e `--only=NEGO-R06,NEGO-R07,NEGO-R08,NEGO-L06` gave `1/4 ok, 3 failed`. R06, R07 and L06 failed with "opened away from the button, sideways … menu {left 2, top 2}"; R08 passed. Jest `-t SC-648` gave 1 failed (the detail-0 test, "Expected number of calls: 1, Received: 0") and 1 passed (the mouse test).
- Each id NEGO-R06, R07, R08 and L06 occurs exactly once in `e2e/specs` (the other hits are old `.out` result logs). No test title carries a bracketed ticket id.
- NEGO-R07's close with several Escapes cannot silently leave a menu open: the loop presses Escape only while `.menu` is present (at most 3), then `waitFor(... .length === 0)` throws. A stuck menu therefore fails R07 itself (r1's bundle `e2e/.out/20261114-221617-61eb/NEGO-R07` shows exactly that "timed out waiting for the menu to close" before the loop was added). No Escape is sent after the menu has closed.
- Gap (accepted): the jest test cannot tell `button.ownerDocument` from the global `document` (jsdom has one document). Only my popout probe covers the document argument. That is fine for a one-line call, but no committed test guards it.

### 4. Scope
The diff touches `view.ts` (the options-menu onClick block and one import), the negotiation e2e driver, manifest and specs, and the negotiation jest test. There is no change to the menu items (SC-641), Reset focus (SC-639), SC-640, or the roll / standing code (SC-649). The superproject commit 64b43026 changes only `CHANGELOG.md`: one plain-words, user-facing bullet at the top of `## Unreleased`. The superproject shows ` M draw-steel-elements` (the unstaged pointer, expected; `wt-finish` bumps it). There is no pointer-bump commit.

### 5. Battery (worktree `…/worktrees/sc648-negotiation-menu-position/draw-steel-elements` @ 544fd4e0)
| Gate | Result |
|---|---|
| tsc | clean, rc 0 |
| lint | clean, rc 0 (only the `.eslintignore` deprecation warning) |
| jest (fresh: main.js / styles.css moved aside) | `Tests: 2 skipped, 13319 passed, 13321 total`, rc 0 |
| e2e full | `OBSIDIAN-E2E done: 595/611 ok, 0 failed, 16 known-bug, coverage: 417/417 pairs`, rc 0, pointer parked |
| lifecycle p1–p7 (installed Obsidian 1.15.1) | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = **64/64**, every rc 0; each log's start line lists only that part's count |
| styles.css sha256 | `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (the same as the base), so shots / freeze / parity carry |

`git status --porcelain` in the plugin worktree was empty before and after. The superproject showed only ` M draw-steel-elements` before and after.

## Artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r2-review/`:
- Gate logs and rc files: `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-e2e-full.log`, `r2-lc-p1.log` … `r2-lc-p7.log`
- Revert probe: `r2-e2e-revert.log` (failure bundles under `revert-tree/e2e/.out/20261114-232339-0e04/`), `r2-jest-revert.log`
- Placement probes: `r2-probe1.log`, `r2-probe2.log`, `r2-probe4.log` (`r2-probe3.log` is the hidden-copy diagnosis); spec `probe-tree/e2e/specs/negotiation/zz-r2probe.e2e.ts`, fixture `probe-tree/e2e/vaults/shipped/Negotiation/probetall.md`
- Scratch copies (not git worktrees, no git metadata touched): `probe-tree/`, `revert-tree/`
