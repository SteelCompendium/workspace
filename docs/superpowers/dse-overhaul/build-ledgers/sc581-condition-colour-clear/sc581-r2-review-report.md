# SC-581 r2 review: the Conditions window's "Default" colour option

**Executive summary**
- Verdict: **LAND** (the code is correct and the tests catch its removal). One MED finding is in the evidence and the ledger, not the branch: fix it before anything is shown to Scott.
- Findings: HIGH 0 · MED 1 (evidence/ledger) · LOW 1 · INFO 3.
- Reviewed dse `14513d4a` (base `1516f894`) and superproject `4a28dd5d` (CHANGELOG). Both working trees were left as I found them (plugin clean; superproject ` M draw-steel-elements` both before and after).
- tsc exit 0 · lint exit 0 · jest `Tests: 1 skipped, 11708 passed, 11709 total` (shots cache present, so this equals the report's 11707/2 without the cache).
- e2e `OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, exit 0.
- lifecycle part 3 `done: 9/9 ok, 0 failed`; G-S1 `done: 1/1 ok, 0 failed` ("modal open across 5 writes; Done→reopen 5/5").
- Non-vacuity: with only the `src/` + CSS change reverted, jest fails 17 tests (all 15 new tests, the flipped SC-581 marker and the census row), and e2e COND-D18 and COND-D19 both FAIL (`0/2 ok, 2 failed`).
- Owner's question: yes, the pressed Default can be told apart without hue, even at rest. But the "light fill" in the evidence and in the ledger is the **:hover** state, not the pressed state (MED-1).

## Findings

### MED-1: the "Default pressed" evidence and the ledger show the hover state, not the pressed state
- Where: `.superpowers/sdd/sc581-condition-colour-clear/evidence/sc581-after-default-pressed-*.png`, the camera script `scratchpad/sc581-r1-impl/evidence.mjs` (it clicks Default and shoots without moving the pointer away; `blur()` clears focus but not `:hover`), and the ledger's r1 line "Default chip pressed = teal accent border + light fill".
- Measured with computed styles in the Steel harness (script `scratchpad/sc581-r2-review/r2-cam.mjs`):
  - pressed, pointer on the chip: bg `rgba(42,123,136,0.1)` light / `rgba(77,184,199,0.1)` dark. That fill is `.dse-optchip:hover` (`--dse-hover`).
  - pressed, pointer away: bg `rgb(246,248,248)` light / `rgb(26,30,33)` dark. This is the same fill as the unpressed chip. It is also byte-for-byte the same computed style as a pressed Duration chip ("Save Ends").
- Why it matters: the owner is judging "distinguishable without hue" from a fill that disappears as soon as the pointer moves. Scott would see the same misleading picture if these crops reach the ticket.
- What the pressed chip looks like at rest: the accent border, full ink instead of muted ink, and the Steel bevel plus a 3.5% sheen. Luminance contrast between the two states:
  - light theme: border 3.06:1 between states (border on fill: 1.5:1 unpressed, 4.6:1 pressed); ink 1.94:1 between states.
  - dark theme: border 5.24:1 between states (1.37:1 unpressed, 7.19:1 pressed); ink 1.77:1 between states.
  - So the state change clears 3:1 on luminance alone in both themes. It is the same selection look as the Duration/Effect chips.
- Fix (no code change):
  - Replace the two `after-default-pressed` colour-row crops (or add next to them) with pointer-away shots: `scratchpad/sc581-r2-review/shots/r2-default-nohover-colorrow-{light,dark}.png`. The unpressed comparison is `r2-blue-nohover-colorrow-{light,dark}.png`.
  - Correct the ledger line to "pressed = accent border + full ink (+ Steel bevel), same as the Duration/Effect chips; the light fill was hover".
  - In captions, describe the pressed look as "a darker outline (light theme) / a brighter outline (dark theme) and darker / brighter text".

### LOW-1: the tooltip spells "colour" while every other visible string says "color"
- Where: `draw-steel-elements/src/views/ConditionsModal.ts:478` `reset.setAttribute('title', 'Default (no colour)')`; pinned by `test/dom/views/conditions-modal-matrix.test.ts:257`.
- Scenario: someone hovers the chip and reads "no colour". The group it sits in is labelled "Color", the pipette says "Custom color", and the docs and the CHANGELOG bullet both say "no color". This is the only "colour" in any user-visible string in `src/`.
- Fix: change it to `'Default (no color)'` and update the test at l.257. Comments can keep their spelling.

### INFO-1: pressing Default on a plain-string condition, or on one with no colour, still writes
- `clearColor` (`ConditionsModal.ts:511`) always calls `emitChange`. Jest pins both cases (`{key:'prone'}`). This matches what Duration "Until removed" and Effect "static" already do. Not a defect.

### INFO-2: at phone width the pipette wraps to a second line
- The new `flex-wrap: wrap` (`styles-source.css:2186`) works. At a 360 px viewport the row is 199 px wide with no overflow (scrollWidth = clientWidth), and the pipette drops under Default. Shot: `shots/r2-default-360-editor-light.png`. `.dse-swatches` is used only by this modal.

### INFO-3: two different selection marks in one group (judgement call, not a defect)
- The swatches mark selection with a check inside the circle. Default marks it with an outline. A colourblind user can still read it, because when Default is pressed no swatch shows a check.
- If Scott wants a stronger cue, a check glyph inside the Default chip would be a design change. That is his call; nothing here requires it.

## Probes run (real Obsidian unless noted)
- **The written note** (a scratch spec in a throwaway worktree, never committed; copies at `scratchpad/sc581-r2-review/r2-probe-spec.e2e.ts.txt` and `r2-probe-fixture.md`):
  - Hexed set to purple, then Dazed cleared in the same window. The note lost exactly one line, `color: "#c0392b"`, and gained none (39 lines to 38).
  - ABOVE and BELOW text intact; Hexed kept `#7d3c98`; Dazed became `{key,duration:eot,effect:glow}`.
  - Tracker card after the write: Dazed `--dse-condition-color` is `''`, Hexed still `#7d3c98`.
- **Hand-written colours** (pressed on open → what Default does):
  - `color: red`: custom swatch `data-selected`, Default unpressed → key removed.
  - `color: "#ABC"`: custom selected → key removed.
  - `color: notacolour`: Default pressed, custom not selected → key removed.
  - `#1e8449`: Green pressed → key removed, `duration` kept.
  - Each one: exactly one write, exactly the colour line removed, focus left on "Default", and Ogre #1's Prone (`#8e44ad`) untouched.
- **Exactly one selected option** after every action. The jest matrix over 6 start colours and 4 clear starts adds up `aria-pressed` plus the pipette's `data-selected`.
- **Keyboard**:
  - Space on Default clears it with one write, and focus stays on Default.
  - Tab from Default goes to Red; Shift+Tab comes back to Default.
  - Enter is covered by COND-D19.
  - The letter `a` on Default opens the Add search with "a" typed (SC-580 behaves as it does on every other button). Space and Enter are not routed to the search.
- **Look** (Steel harness, light and dark, pointer away; Steel is the only renderable theme): see MED-1. The `:focus-visible` ring shows on Default (`shots/r2-default-focusvisible-colorrow-*.png`). No colour literals in the CSS diff, and the kit/token jest suites pass. Host-leak: the implementer's shots log has modal host-leak 40/240 OK. I did not re-run shots: the CSS change only touches `.dse-swatches`, which is in no frozen shot.
- **Tests are not vacuous**: see the summary. The e2e titles carry no bracketed ticket id, and `[COND-D18]` / `[COND-D19]` each occur once across `e2e/specs`.
- **Docs**: the `docs/initiative-tracker.md` Color bullet and the CHANGELOG Unreleased bullet are accurate and plain. DESIGN.md does not list the swatch row, so leaving it untouched is correct.

## Artifacts (all absolute)
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/sc581-r2-review-report.md`
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r2-review/` → `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-e2e.log`, `r2-lc3.log`, `r2-lc-gs1.log`, `r2-jest-nofix.log`, `r2-nofix-e2e.log`, `r2-probe-e2e.log`, `r2-probe-e2e-b.log`, `r2-cam.log`
- Shots: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r2-review/shots/` → `r2-default-nohover-colorrow-{light,dark}.png`, `r2-blue-nohover-colorrow-{light,dark}.png`, `r2-default-hover-colorrow-{light,dark}.png`, `r2-default-nohover-editor-{light,dark}.png`, `r2-default-focusvisible-colorrow-{light,dark}.png`, `r2-default-360-editor-light.png`
- Probe sources: `.../sc581-r2-review/r2-cam.mjs`, `r2-probe-spec.e2e.ts.txt`, `r2-probe-fixture.md`
