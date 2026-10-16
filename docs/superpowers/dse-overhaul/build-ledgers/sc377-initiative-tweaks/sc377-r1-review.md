# SC-377 r1: independent review

## Executive summary

- **VERDICT: PASS-WITH-FIXES.** dse tip `d0adf45` (verified), base `9ded832`. Findings: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 6 LOW, 5 INFO.
- Battery reproduced at the tip: tsc/lint clean. jest 4252 passed / 1 skipped (4 of 6 runs green, the 2 reds are sidebar suites, proven to be load: base fails the same way under stress). Lifecycle 23/23. Shots 556, 0 FAIL. Freeze: exactly 38 mismatches, all `initiative*`, and all 38 hashes match `rebaseline.txt`. Widening: 6 lines, 0 collisions. Parity 0/0/24.
- Click shield, Reading view: correct. Real CDP clicks focus inputs. Clicks, double-clicks, drags and right-clicks on non-editable parts do not open the block. G-S9a/b/c fail on a shield-reverted bundle, so they are not vacuous.
- **MEDIUM-1: the shield's "editable control" test is unbounded.** In Live Preview, `closest()` climbs past the element root to CodeMirror's `.cm-content` (contenteditable=true). Every click in every element therefore counts as "editable", and the shield never calls preventDefault in Live Preview. The block still does not open (measured). Side effects: native text selection now works inside cards, focus moves to the widget, and Reading view and Live Preview diverge. No test models this. A fix bounded to the root was validated live: G-S9a–d and G-S3 pass.
- **MEDIUM-2: turn marks differ in steel-light.** The "not acted" mark on an enemy group (and the portraits-off fallback) keeps the kit button's light bevel gradient, so it reads as a raised white ball. The hero's mark is a sunken grey well. This is the inconsistency Scott reported, now in the light scheme only.
- Persistence is clean in real Obsidian, Reading view and Live Preview: YAML-special titles, 19 scalar edge cases, two blocks in one note, clear, Escape, a write landing mid-edit (SC-340), both chrome resets, and the content outside the block.
- Placeholder verdict: "Untitled encounter" is too loud. It is the largest text in the card. Shrink it (LOW-2).

## Findings

### MEDIUM

**MEDIUM-1: in Live Preview the click shield's editable-control test matches every target.** `src/framework/pipeline.ts:170`, `:178`, `:202`

- Defect: `isEditableControlTarget` calls `target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')` with no bound.
- In Live Preview every DSE root sits inside CM6's `div.cm-content[contenteditable=true]`. The widget wrapper's `contenteditable="false"` does not stop `closest()`. Every target inside every element therefore matches, and `preventDefault()` never runs in Live Preview. This holds for buttons, headings, plain text, the bar background and the chrome panel.
- Measured in real Obsidian 1.14.4 with CDP mouse events, probe `R-LP`:
  - The `closest()` match from the Heroes `<h3>` is `DIV.cm-content cm-lineWrapping ce=true`.
  - At the tip, `defaultPrevented=false` for every pointerdown/mousedown in Live Preview. Reading view stays `true`.
- Consequences (tip vs base, Live Preview only):
  - Focus moves from the editor to `.cm-preview-code-block` on any card click. At base, CM kept focus.
  - A double-click selects card words ("HEROES"), and a drag selects card text across rows. At base, both were blocked.
  - Keys typed after a card click no longer reach the editor. At base, `x` and `Enter` edited the note at the old cursor. That base behaviour is pre-existing, and the tip removed it by accident.
  - Not observed: the block opening, or the cursor moving (cursor `0:0` throughout), or the note changing.
- Why it matters:
  - The framework code's stated contract ("preventDefault is skipped when the target is an editable control") is false in one of the two modes.
  - Every element changed behaviour in Live Preview without that being designed, documented or tested.
  - The jest test mounts with no contenteditable ancestor, and G-S9's Live Preview half asserts only on inputs, so neither can see it.
- Repro: `r1-review/sc377-r1rev-probe-scenarios.mjs` (`nonEditableProbe`). Logs: `sc377-r1rev-lp-probe-{tip,base,fix}.log`.
- Fix:
  1. Bound the match to the root: `const m = target.closest?.(EDITABLE_CONTROL); if (!(m && root.contains(m))) event.preventDefault();` (pass `root` into the predicate). Validated as a patched bundle (`bundle-fix`): G-S9a/b/c/d + G-S3 5/5 ok. Live Preview inputs focus, take typing and double-click selection, and the cursor does not move. Non-editable clicks behave as at base.
  2. Add a jest case that mounts the element under `<div contenteditable="true"><div contenteditable="false">…` and asserts that a button or plain-content mousedown is still prevented.
  3. Add a G-S9 Live Preview assertion that a click on a non-editable part leaves `document.activeElement` unchanged.
  4. If the owner prefers the accidental Live Preview behaviour (keys no longer leak into the note), make it a deliberate, separate decision. Do not get it from this predicate.

**MEDIUM-2: in steel-light, the "not acted" mark on enemy groups (and the portraits-off fallback) is a raised light disc; on heroes it is a sunken grey well.** `styles-source.css:13608` (the 12e "NOT ACTED" rule)

- Defect: the rule paints the ring on the `.dse-init__turnbox`. The `.dse-init__turn` button inside it (`inset: 0`) keeps the kit button's bevel: `linear-gradient(rgba(255,255,255,0.9) …)` in light, `0.07` in dark. That bevel covers the socket.
  - Measured centre pixels in light: hero not-acted `rgb(158,158,158)`, group not-acted `rgb(204,205,205)`.
  - Computed: the `taken=false` button has a gradient background plus the kit box-shadow. The `taken=true` button has `none`.
  - Dark is fine: the bevel is near-invisible there.
- Scott's item 5 ("should generally feel the same") and DESIGN rule 9 ("used identically on heroes and enemy groups") both fail in steel-light.
- Repro: harness `fixture=fight&bg=light`. Evidence: `sc377-r1rev-turn-markers-light-crops.png` (left to right: hero acted, hero not-acted, group acted, group not-acted) vs `sc377-r1rev-turn-markers-dark-crops.png`, and `sc377-r1rev-whole-mid-fight-steel-light.png` (Samwise vs Goblin Squad).
- Fix: add screen-scoped `background: none; box-shadow: none; border: 0` for `.dse-init__grouphead > .dse-init__turnbox .dse-init__turn` and the portraits-off twin, in all states (as the `[data-taken]` state already gets). Re-shoot dark and light.

### LOW

**LOW-1: in Reading view, "click away saves" does not hold for a click inside the same card.** `src/elements/initiative/view.ts:348` (blur commit), with the shield at `pipeline.ts:202`; docs at `CHANGELOG.md:26` and `docs/initiative-tracker.md:274`

- In Reading view the shield prevents pointerdown on non-editable parts, so focus never leaves the title input.
- Scenario: type a title, then click the Heroes heading or the Malice bar. The input stays open and focused, and nothing is written. Measured with `R-BLUR-RV`: `inputOpen:true, nameInFile:false` after both clicks.
- A click outside the card, or navigating away, does commit, so no data is lost. Live Preview commits on any click (because of MEDIUM-1).
- The same applies to the Amount/Label drafts and the ds-counter editable stepper (pre-existing there).
- Fix: in `armClickShield`, when preventing default and `document.activeElement` is an editable control inside `root` other than the target's control, call `activeElement.blur()`. Or narrow the docs to "Enter or clicking outside the tracker". Whichever is chosen, it must hold the same in both modes after MEDIUM-1 is fixed.

**LOW-2: the "Untitled encounter" placeholder is too loud (verdict on the implementer's follow-up 6).** `styles-source.css:16374`

- It renders at h2 size in italics. That makes it the largest text in the card, bigger than HEROES, and at 300px it wraps over two lines (about 84px tall).
- It reads as an actual title: someone glancing at the screen would take the encounter to be named "Untitled encounter".
- Fix (pick one):
  - (a) Render the empty prompt at `--dse-fs-label`/caption size, in small-caps muted text ("Name this encounter"), and keep h2 size only for a real name.
  - (b) Show the prompt only on `:hover`/`:focus-within` of the root, leaving a collapsed zero-height slot otherwise.
- I recommend (a). It is discoverable and quiet.

**LOW-3: a hand-authored name that YAML parses as a non-string breaks the whole tracker.** `src/elements/initiative/model.ts:139`

- `name: 1984`, `name: true` or `name: 3.5` makes parse throw, and the block becomes an error card. Authors write that naturally.
- The in-card editor itself always quotes such values. Verified 19/19 scalars round-trip in real Obsidian, including `1984`, `true`, `null`, `~`, `0x10`, `.inf`, `'`, `"`.
- Fix: coerce `number`/`boolean` to `String(data.name)`, reject only objects and arrays, and add a parse test.

**LOW-4: the Malice ± buttons lost their ≥44px hit overlay and are now 23.8×23.8px.** `styles-source.css` base layer around `:629–648` (the `.dse-init__malice .dse-stepper__btn` entries were dropped from the §4.6 overlay group)

- Measured 23.8px at every width, below the 24px floor. The old hover-reveal ± had the §4.6 44px `::after` catcher.
- The spacing exception (WCAG 2.2 AA, criterion 2.5.8) probably saves it, since the gap to the well is about 6px, but this is a regression against the plugin's own §4.6 rule.
- Fix: keep the `::after` overlay for the kit stepper buttons in this element, or give the kit stepper buttons `min-block-size: 24px` on screen.

**LOW-5: the docs are inaccurate in two places.**

- (a) dse `CHANGELOG.md:43` says "Printing is unchanged apart from the round label's new place and the title". In print, the "Malice: N" line also moves from top-right to left, and the quick-add inputs re-centre across two rows. My own before/after renders show this: `sc377-r1rev-print-ab-controls.png` and `-squads.png`. Fix: name the Malice line move.
- (b) Workspace `DESIGN.md:425`, rule 9, is headed "(Scott's SC-377 brief, 2026-10-02)". It codifies the owner's readings O1/O4/O5 as Scott's rule: green is not a turn colour, chrome-panel placement for destructive actions, and no hover-reveal adjusters. Those readings are still flagged for Scott to overturn. Fix: attribute the rule to "owner rulings O1/O4/O5 on SC-377, pending Scott's review", or land it only after he confirms.

**LOW-6: the "Not zero" reason shows for an EMPTY Amount.** `src/elements/initiative/view.ts:550`

- An empty field with the placeholder "Not zero" is confusing.
- Fix: use "Amount required" when the field is empty, and keep "Not zero" for a literal 0.

### INFO

- **INFO-1: the sidebar jest flake is load, not SC-377.**
  - Full runs at the tip: 2 of 6 red (`sidebarEncounterHandoff` "persists the id it minted", `sidebarInitiative` "SC-288 r2"), at load 1–11. Base full runs: 0 of 6.
  - Under a concurrent stress run of only those two suites (6 parallel × 3 rounds each), the tip had 1 of 18 runs red and **base also had 1 of 18 red**. Base failed with the same `SC-288 r2` test.
  - Cause: `sidebarEncounterHandoff.test.ts:410` waits a real `setTimeout(400)` against `PERSIST_DEBOUNCE_MS = 400`, a dead-heat race, and the `sidebarInitiative` path mixes fake and real timers.
  - Follow-up: add both suites to the skill's "load-sensitive" list, and wait `PERSIST_DEBOUNCE_MS + margin` or use fake timers.
- **INFO-2: the quick-add accepts non-integer amounts.** `1.5` makes Malice 8.5, and `1e2` adds 100. This is pre-existing (base has the same `Number()` check). Enter-submit only makes it easier to reach. Follow-up: integer-only validation.
- **INFO-3: G-S9d covers Reading view only.** I covered Live Preview title editing with my own probe `R-TITLE-LP`: special characters, YAML-ish text, 400-character blur commit, Escape and clear all write correctly, the second block is untouched, and the cursor stays on line 0.
- **INFO-4: hover vs acted on the hero portrait differs only by opacity.** Both show the ◆ seal. Hover is transient and acted also dims the portrait and hatches the row, so this is acceptable.
- **INFO-5: the superproject worktree shows ` M draw-steel-elements`.** The pointer is not committed, as the implementer reported. Left as found.

## Verification detail

### 1. Click shield in real Obsidian (private Xvfb `:160`, CDP port 9291)

- Reading view:
  - Non-editable targets (Heroes h3, round label, Malice well, bar background): pointerdown prevented, no mousedown, no selection, block not rebuilt, note unchanged. Applies to click, double-click and drag.
  - Amount input: click focuses it, a drag out of it keeps the selection inside the input, double-click selects inside the input, right-click shows no menu, and real keys (End, 9, Backspace ×2, ArrowLeft, Delete) edit only the input value. Final value `12345`→`123`, note unchanged.
- Live Preview: same input results, cursor stays `0:0`, CM not focused. Right-click shows Obsidian's editor context menu at both base and tip (contextmenu is not shielded, pre-existing). Non-editable results: see MEDIUM-1.
- ds-project (`<label>` + checkbox, number inputs), both modes:
  - Roll input focuses.
  - A click on the label text toggles the checkbox, which is correct label activation.
  - A click on the checkbox toggles it.
  - Note unchanged; Live Preview cursor `0:0`.
- `pointerdown` vs `mousedown` are consistent. Both use one handler. In Reading view a prevented pointerdown also suppresses the compat mousedown, which is why the title does not blur (LOW-1).
- Vacuity: G-S9a/b/c FAIL against `bundle-revert` (the tip with only the predicate call removed): "Reading view: a real click on input… did not focus it". G-S9d passes there, as expected: it is a title test, and the span is not an input.

### 2. Persistence (real Obsidian)

- `Probe/two.md`: text with `: # " '` above, between and below two trackers, one unnamed and one `name: Alpha`. Reading view and Live Preview:
  - Title ` Ambush: at #the "Ford" 'x'  ` → `name: "Ambush: at #the \"Ford\" 'x'"`, trimmed.
  - `- [a, b]: {c} | > & * ! % @ \`` → quoted correctly.
  - 400 L's via blur → written (Live Preview).
  - Escape → nothing written.
  - Clear → `name` removed.
  - Text outside the fences byte-identical and the second block byte-identical after every case.
- SC-340 (`R-ADOPT`): Malice + is pressed, then the title or Amount is clicked and typed within 60ms, and the debounced write lands mid-edit (1 modify). The draft survives (`"Half"` / `"4"`), the input keeps focus, the root is adopted rather than rebuilt, and nothing is committed.
- Chrome resets with real clicks (`R-CHROME-CLICK`):
  - Reset turns: Notice "Turns reset for this round", `has_taken_turn` cleared, Malice untouched.
  - Reset encounter: confirm modal ("Confirm Encounter Reset…"); Cancel leaves the state alone.
  - Buttons are 25.5×24.2px. The reset icons are `rotate-ccw` and `eraser`, which are distinct.
  - Caution for future camera runs: Obsidian's "Update Available" notice sits exactly over the chrome panel and swallowed my first click (implementer follow-up 5 confirmed as a real test hazard).
- Hand-edited block: re-render from disk after navigating away and back is correct for all 19 scalars. For unquoted numbers and booleans, see LOW-3.

### 3. Read-only (harness `readonly=1`)

- `fight` (unnamed): no title node, no inputs, no `role=button`, `tabindex=0` count 0.
- `named` and `default`: static `<h2>` text, no focusables, no placeholder pseudo-element.
- Buttons are only the chrome expand/collapse plus the log disclosure. No reset items (also killed by mutant M7).

### 4. The six items against O1–O7

- **O1:** resets are in the chrome panel, Notice and confirm as specified, and the action bar is gone.
- **O2:** at main width and 500px the round label and Advance round sit on the Heroes line, at y=124.6 (same line as the h3). At 300px the cluster wraps whole under the heading. There is no document overflow and no element outside the root. The chrome panel sits above the card's top edge (panel bottom 88 = root top 88), so there is no collision at main or 300px.
- **O3:** Enter submits from either field. An empty label gives focus, `aria-invalid`, the "Label required" placeholder and a doubled red edge, so the cue is not hue alone. Amount, Label and Add are all 28.55px at main/500/300.
- **O4:** the stepper is always visible, with a sunken well and a small-caps caption over a numeral in `--dse-malice`. For the ± size see LOW-4.
- **O5:** ring and struck seal on both sides. The difference is a shape (◆ vs none), so it is not colour-only.
  - Focus ring: 2px outline on the title span, Advance round, portrait toggle and group turn button (dark `rgb(77,184,199)`, light `rgb(42,123,136)`).
  - Hit targets: portrait 76px (60px at 300), group and portraits-off button 28.5px.
  - Light-scheme inconsistency: MEDIUM-2.
- **O6:** the title works in both modes. It is screen-only when empty: print `display:none`, and a named title prints.
- **O7:** see section 5.

### 5. Steel scoping and print

- Every new screen rule in the diff carries `[data-dse-theme='steel']:not([data-dse-print="on"])`.
- The unscoped additions are intentionally print-visible layout: `.dse-init__title` margin, `[data-empty]{display:none}`, `.dse-init__group-head` flex, `.dse-init__round` margin, and the bar-grid re-flow.
- `rebaseline.txt`: the 38 filenames equal the freeze mismatch set exactly (sorted diff empty), and all 38 hashes match my run (`sha256sum -c`: 38 OK).
- My own before/after renders of `controls`, `squads` and `no-images` @300 (`sc377-r1rev-print-ab-*.png`, base left, tip right) show only:
  - the round label moving to the Heroes line;
  - "Malice: N" moving left and the quick-add re-centring;
  - nothing else (no seal or stepper styling in print).
- The implementer's `r1/` print crops agree.
- `widening.txt`: 6 additions-only lines, every hash verified, 0 name collisions in `freeze-baseline.sha256` (262 lines).

### 7. Tests are not vacuous (each mutant run, then restored; `git status --porcelain` empty after)

| mutant | killed by |
|---|---|
| M1 shield always prevents | pipeline.test 2 failed |
| M2 title drops the `data-dse-moving` guard | initiative.test "SC-340 adoption-blur guard" |
| M3 serialize writes `name` last | 3 failed (serialize ×2, view ×1) |
| M4 Enter no longer submits | malicePanel 3 failed |
| M5 empty label silent | malicePanel 1 failed |
| M6 Escape commits | initiative.test "Escape reverts" |
| M7 chrome items on read-only | initiative.test read-only "NO buttons at all" |

### 8. Docs

- dse `docs/initiative-tracker.md`, `running-an-encounter.md` and `.repo-docs/integration.md` match the code, except "click away to save" (LOW-1).
- The stale comment "a group has no portrait to click…checkbox" is rewritten correctly.
- No remaining comment asserts the action bar, the hover-reveal or the green turn mark. The remaining `--dse-turn-done` uses are montage-only. The `view.ts:6` "check/dot glyph swap" is still true of the DOM and print.
- Root `CHANGELOG.md` is fine.
- Remaining issues: LOW-5.

### 9. Visual eyeball (steel-dark `r1/` set plus my steel-light set)

- Layout is clean at all widths, with no clipping or overflow.
- The chrome icons sit outside the card.
- The Heroes line baseline-aligns.
- The quick-add row shares one height.
- The light scheme reads well apart from MEDIUM-2 and the placeholder (LOW-2).
- Minor, no action: the ± buttons are visibly shorter than the 38px Malice well. That is the kit's stepper proportion.

## Battery (tip `d0adf45`, run by me in skill order)

- `npm run tsc`: clean. `npm run lint`: clean, exit 0.
- `npx jest`: run 1 `Tests: 1 failed, 1 skipped, 4251 passed, 4253 total` (sidebarEncounterHandoff). Runs 2, 4, 5 and 6: `Tests: 1 skipped, 4252 passed, 4253 total`, `Test Suites: 1 skipped, 213 passed, 213 of 214 total`. Run 3: 2 failed (sidebarEncounterHandoff + sidebarInitiative). Base `9ded832` (scratch worktree): 6/6 green, `3 skipped, 4216 passed` (2 extra skips come from the out-of-tree location). Load is classified in INFO-1.
- `DSE_LIFECYCLE_PORT=9291 npm run obsidian-lifecycle`: `OBSIDIAN-LIFECYCLE done: 23/23 ok, 0 failed` (obsidian 1.14.4, display :160).
- `npm run shots`: 556 PNGs, 0 FAIL. Gate lines:
  - `host-copy pin OK (… verbatim Obsidian 1.14.4 …)`
  - `button host-leak OK (112 button kinds × 3 states … = 672 comparisons …)`
  - input/table/list/inline/checkbox/prose host-leak OK
  - `print-twin delta OK (138 capture ids … max vertical drift 2.00px …)`
- `check-freeze.sh`: `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`. All 38 are `initiative*`, and the set and hashes equal `rebaseline.txt`.
- `npm run parity`: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, exit 0.

## State left behind

- dse `git status --porcelain` is empty, and the branch tip is still `d0adf45`.
- The scratch base worktree was removed and pruned.
- The superproject worktree still shows ` M draw-steel-elements`, as found.
- No processes remain.
- Evidence is under `.superpowers/sdd/sc377-initiative-tweaks/r1-review/`.
