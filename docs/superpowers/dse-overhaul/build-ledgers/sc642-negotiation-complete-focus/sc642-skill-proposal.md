# SC-642 dse-verify SKILL.md proposal (for the dispatcher to apply at landing)

Owners do not edit SKILL.md. Proposed changes, measured on dse `09c879f2` (on develop `10c271fe`):

1. **CURRENT block** ("Current expected numbers"): dse `develop` @ `<landed sha>`; SC-642 landed: Complete Argument in a
   `ds-negotiation` keeps keyboard focus on the card (lands on the first Motivation chip, else the first Pitfall chip,
   else the Lie box, scrolled into view with `block: 'nearest'`); e2e markers NEGO-F02 / NEGO-L02 are plain tests, new
   e2e NEGO-F03, NEGO-F04, NEGO-L04, NEGO-L05; no lifecycle id used (G-S134 free).
   Numbers: tsc and lint clean · jest **13317 passed / 2 skipped** fresh (13318 / 1 with the shots cache) · lifecycle
   **64/64** · e2e **`OBSIDIAN-E2E done: 591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs`** · shots 592,
   host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.

2. **Gate table, row 4b (e2e)**: prepend "`591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs`, since SC-642
   (+6 ok, +4 total: NEGO-F03, F04, L04, L05 new; the SC-642 markers NEGO-F02 and NEGO-L02 are plain tests, no new
   pair); 585/604 since SC-628 …". Known-bug list: drop SC-642 from "since SC-439 SC-639, SC-640, SC-641, SC-642, SC-648,
   SC-649" and add it to the fixed list "(SC-637, SC-638 and SC-642 fixed)".

3. **New footgun line** under "Lifecycle and e2e notes" (SC-642):
   - A button that disables ITSELF in its click handler loses keyboard focus in Chromium synchronously, inside the click
     dispatch (2-3 ms after the click, before any write or redraw): focus goes to `<body>`. jsdom keeps the disabled
     node as `document.activeElement`, so only e2e can show it. Fix pattern: capture the control before disabling and
     hand focus on in the same handler (`restoreControlFocus(..., { fromDisabled: true })` in
     `src/framework/kit/controlFocus.ts`); the Live Preview carry then sees the new control, not the disabled one.
   - A mouse press on a DSE card button moves no focus in real Obsidian: the click shield cancels `pointerdown` /
     `mousedown` (`pipeline.ts`), so a hand-off that starts "only when focus was on the control" is keyboard-only in
     practice.
   - Negotiation e2e in Live Preview: the active tab is session-remembered; a previous test that left the Learn tab
     open hides the Argument controls from `focusByScript`. Select the Argument tab first.
