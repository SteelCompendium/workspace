# SC-513 — proposed dse-verify SKILL.md edits (for the dispatcher at landing)

Summary: two edits. (1) "Button host-leak sweep" bullet: append the SC-513 measurement, the click-mount mechanism, and SC-526/SC-527 as the named open gaps. (2) CURRENT block: new CURRENT for SC-513's landing sha; demote the old CURRENT to PREVIOUS. No freeze change, no widening, no rebaseline.

## 1. "Button host-leak sweep" bullet (~line 197)

After the SC-512 sentence ending `…No capture sends \`galleryExtra\`, so no shot or frozen byte moves.` insert:

> **145 kinds / 870 comparisons with a 28-record boundary as of SC-513 (`<landing sha>`)**: the boundary is the 12 above plus 16 `focus-visible: disabled` records on the Reset and stepper of the click-mounted roll strips (feature, featureblock, statblock, hero; ×2 schemes) — disabled at authored values (`rollBar.ts:263`), so legitimate. SC-513 makes the sweeps CREATE controls that only exist after a click, by real Playwright clicks in the sweep's own dark/light loads, before tagging: (A) the ds-roll result card (Reroll / Clear), by clicking Roll on SC-512's extra roll strip; (B) the ability roll strip + result card in feature, featureblock and statblock — the button, input and checkbox sweep URLs add the pref `rollingEnabled:true` and `galleryExtra` sections `feature,featureblock,statblock`, and the sweep clicks the `.dse-roll-btn` in those appended sections only (clicking the gallery's own statblock moves `statblock|dse-collapse__header`'s first node); (C) hero ability bodies, via a gate-only probe hero with inline abilities (`galleryExtra` `hero:probe-inline-abilities`, a `probeSource` — not in FIXTURES, so no shot), whose expand toggles and then a body's Roll are clicked. Each mount FAILs by name if it produces nothing ("no ability Roll button …", "the probe hero … has no ability expand toggle", "the sweep tagged no `<key>` button …"). The prose sweep's gallery visit also expands the probe hero's bodies (prose line `106 bare <p> [212] + 9 <img> [18]`, was 99 [198]). Input **15 kinds / 176** (was 14 / 164), checkbox **7 kinds / 116** (was 3 / 60), modal 228 unchanged. No capture sends these prefs or sections, so no shot or frozen byte moves. **Open gaps, deliberately not mounted:** the Recoveries popover (`staminaRecoveryPopover`) — its plain buttons leak host CSS, mounting it turns the sweep red (164 problems on `hero|dse-stamina-rec__pop-btn` / `-cb`); it is mounted by **SC-526** together with its CSS fix, never exempted. Kinds reached only by a state change (pressed toggles, enabled Complete Argument, disabled-after-Respite) are **SC-527**.

Append to the same inserted paragraph:

> The sweeps pin dice after load (`Math.random = () => 0.5`, the same one-liner `fixedDice` captures use) so the mounted result cards are byte-stable in the sweep logs; no kind count depends on the roll (145 with and without the pin).

## 2. CURRENT block

New CURRENT (fill shas at landing):

> **CURRENT — dse `develop` @ `<landing sha>` (2026-10-24; SC-513 landed — the host-leak sweeps also check controls that only exist after a click (ds-roll result card, ability roll strips in feature/featureblock/statblock, hero ability bodies) by mounting them with real clicks in the sweep's own load; harness-only, no user-visible change, no pixel or frozen-byte change; Recoveries popover left to SC-526):**
> tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6112 passed / 1 skipped / 247 of 248 suites** · lifecycle **39/39** · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (145 … 870 …)` (28-record boundary), modal `228`, input `176` (15 kinds), checkbox `116` (7 kinds), prose `106 … [212]` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-513 ticket-owner at `ed368f6` (on `c558759`; lifecycle and e2e measured on `324a68d`, whose built `main.js` / `styles.css` are byte-identical to `ed368f6`); the dispatcher relayed, not re-ran.

Demote the existing CURRENT (c558759 / SC-502, or whatever is CURRENT at landing) to PREVIOUS. If the base moves again before landing, the jest count is CURRENT's jest + 7.
