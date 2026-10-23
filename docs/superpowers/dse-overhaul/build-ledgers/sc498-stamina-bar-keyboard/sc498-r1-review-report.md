# SC-498 r1 independent review

## Executive summary
- **Verdict: LAND-READY.** Reviewed dse `47449b6` (on `9f08f06`; `origin/develop` still `9f08f06`, has not moved), superproject `874700a`. Worktree left clean at both heads. The superproject's ` M draw-steel-elements` (pointer not bumped) was already there when I started.
- **Findings: HIGH 0 · MEDIUM 0 · LOW 2 · INFO 6.** No blocker. The LOWs are a screen-reader semantics gap (`role="group"` on a focus stop) and a G-S36 comment that claims a check the code does not make.
- **Gates, re-run by me:** tsc+lint rc 0. jest **5863 passed / 1 skipped / 241 of 242** (+16). lifecycle **35/35** (G-S36 ok). e2e **`108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`**. shots rc 0, **592** PNGs, 0 FAIL, every in-run line present. freeze **`freeze OK (280/280 …)`**. parity **0 gaps / 0 undeclared / 24 declared**.
- **The tests catch the bug:** with base src+CSS the touched suites fail 9 tests, and G-S36 FAILs on a base bundle ("a real Tab never reached the stamina bar"). I also broke the handler 3 ways, one line each (no target guard, no repeat guard, no preventDefault), and jest went red every time (4, 1 and 2 tests).
- **Real-Obsidian probes passed:** Enter, Space (no scroll), held Enter/Space (one modal), Ctrl/Alt (ignored), chrome keys, Live Preview (document and cursor untouched), sidebar pin copy, focus after Apply (back on the same bar node). A mouse click draws no ring.
- **Owner check (a):** in Steel, each initiative row's numeric stamina button is a **real tab stop that becomes visible when it has focus**: hidden in a 1px box, it returns at 35x20 with the 2px ring, and Enter opens the modal. This holds in both the hero row and the detail row. It is not an invisible stop.
- **Owner check (b):** the chrome panel covers about 55 of the ring's 704 CSS px on the top edge, at the right. Every corner and the other three sides stay visible, and the pin and collapse buttons are fully visible. This is the same in dark and light. It hides neither the ring nor the buttons.

## Gates (all run by me at 47449b6; logs in the scratch dir below)
| Gate | Result | Log |
|---|---|---|
| tsc (`tsc --noEmit && tsc --noEmit -p e2e`) | rc 0 | `rv-tsc.log` |
| lint (`eslint src main.ts e2e`) | rc 0, only the existing `.eslintignore` warning | `rv-lint.log` |
| jest (after `rm -f main.js styles.css`) | `Tests: 1 skipped, 5863 passed, 5864 total` / `Test Suites: 1 skipped, 241 passed, 241 of 242 total`, rc 0 | `rv-jest.log` |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 35/35 ok, 0 failed`, rc 0. G-S36 ok: "a real Tab reaches the bar after ["bar"] (ring 2px solid, offset 2px); Enter and Space each open only the Stamina modal; focus: in modal input.dse-sedit__apply-input, after close bar / bar …" | `rv-lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0 | `rv-e2e.log` |
| shots | rc 0, 592 PNGs, 0 `FAIL` lines. Present: host-copy pin OK (1.15.0), button host-leak OK (113 kinds / 678), modal button host-leak OK (10 / 9 / 38 / 228), text scale OK (1626), text scale once OK (107256 / 214 loads), pressed toggle parity OK (96), pipette selected look OK, chrome host-leak OK (18), and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning | `rv-shots.log` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical …)`, rc 0 | `rv-freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc 0 | `rv-parity.log` |

Shots ran past the 600 s tool limit, so the harness moved it to the background. It finished with exit 0, and I read its own rc file and log.

## Do the tests catch the bug? (probe 1)
- **Base src+CSS reverted** (`git checkout 9f08f06 -- src/framework/kit/StaminaBarPanel.ts src/elements/initiative/view.ts styles-source.css`, restored afterwards): the 6 touched suites read `Tests: 9 failed, 281 passed`. The failures are the kit tab stop, Enter, Space and accessible-name tests; chrome "Enter and Space on the bar itself"; stamina-bar Enter and ring+print; the kit-index shared-ring list; and the hero-sheet tab stop. The chrome "must not open" tests and the initiative opt-out test pass on base by construction, so they guard against regressions rather than prove the fix. (`vac-jest-base.log`)
- **G-S36 on a base bundle** (built from the reverted tree; it has none of the SC-498 code or CSS): `G-S36 FAIL: a real Tab never reached the stamina bar (focus went: {"tab1":"button.dse-btn…","tab2":…,"tab3":"button.clickable-icon",…})`, `done: 0/1 ok, 1 failed`. (`vac-gs36-base.log`)
- **Mutations** (one line each, restored after each run; `mut-summary.txt`):
  - dropping `if (evt.target !== bar) return;` turns 4 tests red (the kit chrome test and all 3 pipeline chrome tests: pencil, collapse, pin);
  - dropping `evt.repeat` turns the auto-repeat test red;
  - dropping `preventDefault` turns the Enter and Space tests red.

## Real-Obsidian probes (Obsidian 1.15.0, scratch copy of the lifecycle harness, port 9288)
Facts are in `probe/RV-*.json`.
- **Tab order (Reading view):** start → **bar** → Pin to sidebar → Collapse → leaves the block. Shift+Tab from Pin returns to the bar. Exactly one stop for the bar.
- **Space:** opens the Stamina modal, and the reading view's scrollTop stays 0 before, during and after on a scrollable note. Focus returns to the bar on close.
- **Held Enter / held Space** (keyDown + 6 `autoRepeat` keyDowns + keyUp): exactly one Stamina modal. The repeats land in the modal's apply input; the value stays `0`, Apply stays disabled and the note is unchanged.
- **Modifiers:**
  - Ctrl+Enter, Alt+Enter and Ctrl+Space open nothing (no modal, no new leaf), and focus stays on the bar.
  - Shift+Enter and Shift+Space open the modal (see INFO-6).
- **Chrome items by real Tab + key:**
  - Enter on Pin pins (one sidebar copy) and opens no modal.
  - Enter on Collapse collapses the block and opens no modal.
  - A collapsed bar keeps `tabindex` but is `display: none`, so it is not focusable.
  - See INFO-3 for where focus goes afterwards.
- **Focus after Apply:** Tab, Enter, type 3, Damage, then keyboard Apply. The modal closes with focus on the bar. The write lands (temp 5→2). After the write the bar is the **same DOM node** (adopted), still focused with the ring, and its name is now "Edit Stamina: 15 of 20, 2 temporary".
- **Live Preview:** the bar is inside `.cm-content` in a `contenteditable=false` widget.
  - Reached by a real Shift+Tab from the pin, it shows the ring (`:focus-visible`, 2px solid, offset 2px).
  - Enter and Space each open only the Stamina modal. The editor document, the file on disk and the editor cursor (`{line 0, ch 0}`) are unchanged. Focus returns to the bar on close.
  - Tab from the bar goes to Pin; Shift+Tab goes into `.cm-content`. Neither changes the document.
  - CodeMirror does not swallow these keys or move the cursor into the source.
  - From inside the editor, Tab indents. That is Obsidian's normal behaviour and is not a regression.
- **Sidebar pin copy:** `tabindex=0`, `role=group`, same name. A real Tab reaches it, it shows the ring, and Enter opens the Stamina modal.
- **Mouse:** a real click opens the modal and no ring is ever painted (`:focus-visible` false during mousedown, after Escape and after a backdrop click). After a mouse-opened modal closes, focus goes to `.markdown-preview-view`, not the bar. That is the base behaviour, because a mousedown does not focus the bar here.
- **axe-core 4.10.3**, run on the block root with the bar focused (`RV-MOUSE.json`):
  - The default rules report 0 violations. Passes on the bar include `aria-allowed-role`, `aria-prohibited-attr`, `aria-allowed-attr` and `tabindex`.
  - `nested-interactive` is not triggered, because `group` does not make its children presentational.
  - The experimental rule `focus-order-semantics`, which I turned on, flags the bar (LOW-1).
  - I discarded the earlier axe run in `RV-READ.json`: it ran on a collapsed block and checked nothing.
- **Scope fence:** none of `src/framework/kit/stepper.ts`, `src/elements/counter/view.ts`, the stepper CSS/tests or `FormModal.ts` is touched (`git diff --name-only 9f08f06..HEAD`). The superproject diff is CHANGELOG (one bullet) + dse-verify's lifecycle row (35/35, G-S36). The CURRENT block is untouched.

## Owner-requested checks
**(a) Initiative numeric button (`keyboard: false` opt-out), Steel theme, `Lifecycle/tracker.md`** (`RV-INIT.json`, shots below)
- Row bars carry no `tabindex` or `role`; I checked all 3.
- **Hero row:**
  - Unfocused, `.dse-init__right` is `position: absolute`, 1x1, `clip: rect(0 0 0 0)`, and a hit test at the button lands on the row. It is visually hidden, but it stays in the tab order and keeps its name ("Edit stamina: Alice Alpha").
  - The 9th real Tab focuses it. `.dse-init__right` turns `static` at 35x24, the button is 35x20 and visible, the hit test lands on it, and it shows the 2px solid ring. This is the same in both schemes.
  - Enter opens the Stamina modal, and focus returns to the button on close.
- **Detail row** (Goblin Captain selected): the same pattern. It is reached on the 30th Tab, shows the 2px ring (`#4db8c7`, dark), and Enter opens the Stamina modal.
- **Verdict:** a real tab stop that becomes visible when it has focus (the `:focus-within` skip-link pattern from SC-183). It is not invisible and not missing, so it is not a finding.
- **Cosmetic, existed before SC-498:** the revealed chip sits at the row's top-left in the hero row, and below the portrait, overlapping its bottom edge, in the detail row (INFO-2).

**(b) Chrome panel over the bar ring** (`RV-SHOT.json`; my crops plus the implementer's)
- Geometry (CSS px): bar `[386,242 → 1086,323]`; panel `[1021,216 → 1076,242]`, `z-index: 3`, opaque background (`rgb(34,39,43)` dark / `rgb(237,240,240)` light). The ring sits 2–4 px outside the bar, so the panel's bottom 2–4 px lie over about 55 px of the ring's top edge.
- What I see in both schemes:
  - The ring is continuous on the left, bottom and right edges and on all four corners. The top edge is visible except where the panel sits.
  - The panel reads as a tab sitting on the outline.
  - Both buttons (pin, chevron) are fully drawn and unclipped.
- It hides neither the ring nor the buttons. No finding (INFO-1).
- When focus moves to Pin, the bar's ring goes away and the pin button draws its own 2px ring. That is clear which-is-which (`rv-bar-chrome-focused-*.png`).

## Findings

### LOW-1: a focus stop with a non-widget role; screen readers get no "you can press this" cue
- **Where:** `src/framework/kit/StaminaBarPanel.ts:183` (`bar.setAttribute('role', 'group')` on a `tabindex=0` element).
- **Scenario:** a screen-reader user tabs to the bar and hears roughly "Edit Stamina: 15 of 20, 5 temporary, group". Nothing says Enter will act on it: `group` is a structural role, not an activatable one. axe-core 4.10.3's experimental best-practice rule `focus-order-semantics` ("Elements in the focus order should have an appropriate role") flags exactly this node. Every default-on rule passes.
- **Why the choice was made:** `role="button"` would make the chrome panel's real buttons inside the bar presentational, which is worse. The verb-first name ("Edit Stamina") partly makes up for it.
- **Prescribed fix (owner's call; either is enough):**
  - (1) Accept, and record the trade-off in the ledger. The montage board cells were ruled the same way.
  - (2) Keep `role="group"` and add `aria-description="Press Enter to open the Stamina window"`. It is supported in Chromium/Electron, and it adds the cue without making the chrome buttons presentational.
- Do not use `aria-haspopup`: it is not allowed on `group` and would trip `aria-allowed-attr`.

### LOW-2: G-S36 step 3 claims a "no ring on click" check it never makes
- **Where:** `visual-harness/obsidian-lifecycle.mjs:2323` ("3. A real mouse click on the bar paints no ring (focus-visible, not focus) …"). The step only asserts that the modal opened and the note is unchanged.
- **Scenario:** a future change swaps `:focus-visible` for `:focus`, or focuses the bar on mousedown with a visible ring. G-S36 stays green while its own comment says this is covered. Behaviour is correct today: I measured `:focus-visible` false and `outline-style: none` during mousedown, after Escape and after a backdrop close.
- **Prescribed fix:** after `t.realClick(...)` and again after `closeModal('click')`, assert `!(bar.matches(':focus-visible') && getComputedStyle(bar).outlineStyle !== 'none')`. Or reword the comment to say only what is asserted.

### INFO-1: chrome panel over the ring (owner check b)
Judged acceptable; see above. No change.

### INFO-2: the initiative numeric button is a visible-on-focus tab stop (owner check a)
It is not a defect. Its placement when revealed (top-left in the hero row; overlapping the portrait's bottom edge in the detail row) dates from SC-183 and is cosmetic. Ticket it only if Scott wants the revealed chip placed better.

### INFO-3: existed before SC-498, outside its scope: keyboard Collapse/Pin leave focus on `<body>`
- Enter on Collapse (reached by Tab) collapses the block and `document.activeElement` becomes `<body>`. The collapse button is inside the bar it hides, so its own focus is destroyed.
- Enter on Pin also left focus on `<body>`.
- This follows from SC-492's chrome placement plus collapse hiding the bar. SC-498 does not change it. I reasoned this from the code and did not measure it on base.
- Suggested follow-up ticket: "keyboard Collapse/Pin in the stamina bar drops focus to the page". After collapse, move focus to the collapsed summary's expand control.

### INFO-4: part of the stated reason for the a11y structure is out of date
`StaminaBarPanel.ts:164-166` (and the impl report) say the bar must be the stop because "Legacy shows the track and hides the cluster". The Legacy theme was removed in SC-144 (`src/framework/seams/theme.ts:15`): only Steel ships, and the track shows only in base and print. The conclusion still holds, because the chrome panel mounts inside the cluster plate. The comment should lead with that reason. It is a wording fix only.

### INFO-5: name casing differs between related controls
The bar says "Edit Stamina: 15 of 20" and the initiative numeric button says "Edit stamina: Alice Alpha". This is cosmetic. Align them only if the owner wants one style.

### INFO-6: Shift+Enter and Shift+Space open the modal
Ctrl, Alt and Meta are ignored. This matches native `<button>` activation, which also fires with Shift. No change.

## Evidence (all absolute)
Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-review-r1/`
- Gate logs: `rv-tsc.log`, `rv-lint.log`, `rv-jest.log`, `rv-static.rc`, `rv-lifecycle.log`, `rv-lifecycle.rc`, `rv-e2e.log`, `rv-e2e.rc`, `rv-shots.log`, `rv-freeze.log`, `rv-shots.rc`, `rv-parity.log`, `rv-parity.rc`
- Test-catch evidence: `vac-jest-base.log`, `vac-gs36-base.log`, `vac.rc`, `vac-status-reverted.txt`, `vac-status-restored.txt`, `mut-summary.txt`, `mut-noTargetGuard.log`, `mut-noRepeatGuard.log`, `mut-noPreventDefault.log`
- Probe harness and output: `harness/visual-harness/rv-probe.mjs` (a scratch copy of the lifecycle harness plus `rv-insert.mjs` and `rv-insert2.mjs`), `rv-probe.log`, `rv-probe2.log`, `probe/RV-READ.json`, `probe/RV-APPLY.json`, `probe/RV-LP.json`, `probe/RV-LP2.json`, `probe/RV-PIN.json`, `probe/RV-INIT.json`, `probe/RV-SHOT.json`, `probe/RV-MOUSE.json`
- Screenshots (`probe/`, real Obsidian 1.15.0, 2x crops):
  - `rv-bar-focused-dark.png`, `rv-bar-focused-light.png`: the bar focused by a real Tab. A solid 2px outline runs around the whole plate; the chrome panel (pin, chevron) sits on the outline's top edge at the right.
  - `rv-bar-chrome-focused-dark.png`, `rv-bar-chrome-focused-light.png`: focus on Pin. There is no outline around the bar; a 2px square outline surrounds the pin button.
  - `rv-init-hero-row-numeric-focused.png`, `rv-init-hero-row-numeric-focused-light.png` (both captured in the light scheme; the vault started light): the hero row's "30/30" numeric button, revealed at the top-left with a 2px outline.
  - `rv-init-detail-row-numeric-focused.png` (dark): the detail row's "40/40" button, revealed under the portrait with a 2px outline.
  - `rv-sidebar-focused.png`: the pinned sidebar copy, focused.
- Base bundle used for the G-S36 base run: `bundle-base/`. Fix bundle used for the probes: `bundle-fix/`.
