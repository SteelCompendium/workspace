# SC-495 r1 independent review — kit stepper focus at its bounds

## Executive summary
- Verdict: **APPROVE_WITH_FIXES**. The FOCUS TARGET RULE is implemented exactly (stepper.ts:192-200) and behaves per the rule in real Obsidian on editable AND bounded read-only steppers, keyboard Enter/Space, a held (auto-repeating) Enter, min===max, Tab/Shift+Tab. No spurious writes. Tab order is byte-identical to base on 3 surfaces. Every mutation goes red in at least one layer.
- Reviewed: dse `247bd27` (c1f65e0, 247bd27) on base `9f08f06` (= origin/develop); superproject `64464bf` on origin/main `6a176e6`. Shas verified.
- Severity: CRITICAL 0 / HIGH 0 / MEDIUM 1 / LOW 2 / INFO 6.
- MEDIUM-1 (owner call, since the ledger chose "pointer -> same target"): in the Stamina modal a MOUSE press that reaches a bound now puts focus in the number `<input>`. A mouse wheel over it then changes the pending value (measured 0 -> 2, Apply label "Lose 2 Temp Stamina"; base: unchanged). On mobile it may also raise the soft keyboard (not verified on a device).
- LOW-1: the CHANGELOG bullet names "the initiative Malice" (it has no bounds, so this never happens there) and describes the old symptom as "the next Tab started again from the top" (on Obsidian 1.14.4 the next Tab carried on from the button's position; the real symptoms were focus on `<body>`, Enter/Space doing nothing and the ring vanishing).
- LOW-2: no committed real-Obsidian test covers the read-only path, but one can be written: `ds-feature` with `rollingEnabled: true` (roll bar Edges/Banes, 0..9) was driven with real keys in this review (see Owner question).
- Gates measured on 247bd27: tsc + tsc -p e2e clean; lint clean; jest 5859 passed / 1 skipped / 241 of 242; lifecycle 34/34; e2e 112/112 ok, 0 failed, 0 known-bug, coverage 73/73; shots 592 PNGs, rc 0, 0 FAIL; freeze OK 280/280. These match the implementer's numbers.

## Findings

### MEDIUM-1 — a pointer press at a bound puts focus in the number input, which the mouse wheel can then change (Stamina modal)
- Where: `src/framework/kit/stepper.ts:197-199` (the move ignores `visible === false`), ledger rule bullet "ring follows the input ... pointer -> false".
- Measured in real Obsidian 1.14.4 (probe PRB-12): open the Stamina modal on `Stamina/basic.md` (Temp 5), click Temp "−" 5 times. Focus goes to `sedit.temp.input` (no ring). Three wheel-up notches over the input, with the pointer still resting near the "−" button, move the field from 0 to 2, and the Apply label becomes "Lose 2 Temp Stamina". A later Apply writes 2, not the 0 the user clicked to. The same steps on base `9f08f06`: focus on `<body>`, the wheel changes nothing (value 0, "Lose 5 Temp Stamina").
- Scope: modals only. In notes the click shield (`src/framework/pipeline.ts:220-239`, mousedown `preventDefault`) stops a mouse click from focusing the button, so `held` is null for a pointer press there (PRB-07: no move, wheel changes nothing). The surfaces affected are the StaminaEditModal Stamina and Temp steppers (`src/views/StaminaEditModal.ts:148`, `:525`).
- Second exposure (not verified, no device): `manifest.json` `isDesktopOnly: false`. On Android (Chromium WebView) a tap focuses a `<button>`, so a tap that reaches the bound would call `input.focus()` inside a user gesture, which normally raises the on-screen keyboard.
- Fix (owner call, because the ledger asked for "pointer -> same target"): move focus into an editable `<input>` only for a keyboard press. When `visible === false`, either (a) do not move at all, which is the base behaviour (a pointer user does not depend on the Tab position, and in notes the pointer never focuses the button), or (b) give the stepper root `tabindex="-1"` and focus `rootEl` with `{ preventScroll: true, focusVisible: false }`, which keeps focus inside the stepper without a field that the wheel or the keyboard acts on. Then update `[STAM-SF03]` and the jest "pointer press" tests to match, and add a wheel check to SF03 (it would fail today).

### LOW-1 — the CHANGELOG bullet overclaims (Malice) and misdescribes the old symptom
- Where: worktree `CHANGELOG.md:21-24` (commit `64464bf`).
- "A stepper that only displays its number (the initiative Malice, the roll controls) gets the same": Malice is created with no `min`/`max` (`src/elements/initiative/view.ts:411-421`), so its buttons never turn off. The real read-only steppers with bounds are the roll bar's Edges and Banes.
- "focus used to fall out of the page and the next Tab started again from the top": on base `9f08f06` in Obsidian 1.14.4 / Chromium 150, after the in-note counter's "−" turned off at 0, the next Tab landed on `counter.input`, the next control (PRB-03 base); the modal behaves the same: PRB-13 base, Tab -> `sedit.temp.input`. What users actually lost: focus sat on `<body>`, so Enter/Space did nothing (PRB-01/02 base: the repeated Enter went to BODY), the focus ring disappeared, and screen readers lost their place.
- Fix: reword it, for example "...If you were on that button, focus dropped off it: the focus outline vanished and Enter or Space did nothing until you clicked or tabbed back in. Focus now moves to the number beside the button... A stepper that only displays its number (the roll modifiers' Edges and Banes) gets the same, without making the number a Tab stop."

### LOW-2 — no committed real-Obsidian test covers the read-only path
- Mutations M3 (drop `tabindex="-1"`, `stepper.ts:167`) and M7 (drop the `.dse-stepper__value:focus-visible` CSS) leave all 4 new e2e tests green. Only jest catches them, and jsdom cannot show that a `tabindex="-1"` span really takes focus in Chromium or that it shows a ring.
- Per the owner's ruling ("if one is drivable, FOLD"): it is drivable. Details are under "Owner question" below.

### INFO
1. Held Enter (auto-repeat) is not covered by a committed test. My probes PRB-01/02/09 show no bounce on an editable in-note stepper (counter 3 -> 0, repeats land on `counter.input`, 1 write), on the modal (Temp 5 -> 0), on the editable characteristic (Might 0 -> 5) and on a read-only stepper (Edges 9 -> 0, repeats land on the SPAN). M2 ("focus the opposite button") is already caught by every focus assertion, so a dedicated held-key test is optional.
2. The ledger line "The next Tab then lands on the enabled opposite button" is true only for "−" at min. For "+" at max, focus is on the value, Tab goes past the stepper, and Shift+Tab reaches "−" (PRB-04, PRB-09). That is the natural order, not a defect. The SF02 assertion ("Tab stays in the modal") is correct.
3. Counter surface: `e2e/manifest/counter.ts` lists only `counter.dec`. `counter.input` and `counter.inc` are stamped but appear in no manifest, and the counter is in neither census (`test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`). This is consistent with "pilot scope deliberately narrow" and passes the gate. Noted so nobody assumes the counter is fully registered.
4. `showsFocusRing` (`stepper.ts:96-103`) is the third copy of the same try/catch `:focus-visible` read (StaminaEditModal, `adoptView.captureFocus`). Optional dedupe later.
5. In notes, a keyboard-focused button clicked up to its bound with the mouse hands over focus WITH the ring (PRB-09 `ptr`: `fv: true`), because the click shield keeps keyboard focus on the button. This follows the rule ("ring follows the button's state").
6. Non-adopted path (an external edit rebuilds the block fresh, PRB-06): focus goes to `<body>` on both base and fixed (on base it was already `<body>` after the press). There is no plugin write (the only modify is the external one), and the next Tab lands on `counter.dec`. No worse than base.

## Probe log (real Obsidian 1.14.4, Chromium 150; throwaway spec in a scratch worktree, never committed)
Spec (copied out before the scratch worktree was removed): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r1-review-b7q4/probe-src/probe.e2e.ts`; fixtures `probe-src/Probe/*.md`. Raw JSON: `probe-fixed1.jsonl`, `probe-fixed2.jsonl`, `probe-fixed3.jsonl` (fixed 247bd27), `probe-fixed4.jsonl` (PRB-13), `probe-base.jsonl` + `probe-base2.jsonl` (stepper.ts + styles-source.css at 9f08f06, everything else 247bd27).

| id | scenario | fixed 247bd27 | base 9f08f06 |
|---|---|---|---|
| PRB-01 | counter 3, HELD Enter on "−" (8 keydowns, autoRepeat) | 0, focus `counter.input` ring on, repeats hit the input, 1 write | 0, focus BODY, repeats hit BODY |
| PRB-02 | modal Temp 5, HELD Enter on "−" (9) | 0, focus `sedit.temp.input` ring on, no bounce | 0, focus BODY |
| PRB-03 | counter 1, Space on "−" | `counter.input` ring; Tab -> `counter.inc`; Shift+Tab -> input; Shift+Tab -> view header | BODY; Tab -> `counter.input` |
| PRB-04 | counter 2, Enter on "+" -> 3 | `counter.input` ring; Shift+Tab -> `counter.dec`; Tab -> input; Tab -> "Collapse Counter" | BODY |
| PRB-05 | after the handoff, Tab / Shift+Tab / click away | 0 writes, note bytes identical | 0 writes |
| PRB-06 | after the handoff, external edit 0 -> 2 (fresh rebuild) | focus BODY, 0 plugin writes, Tab -> `counter.dec` | same (focus already BODY) |
| PRB-07 | in-note MOUSE "−" to 0, then wheel | no move (click shield), wheel no effect, 0 writes | same |
| PRB-08 | min===max (4 under 3..3), Enter on "−" | both buttons disabled, focus `counter.input` ring | BODY |
| PRB-09 | ds-feature roll bar (read-only, 0..9): Edges "+" Enter x9 | focus Edges `.dse-stepper__value` (tabindex -1), `:focus-visible`, `solid 2px rgb(77,184,199)`; Tab -> Increase Banes; Shift+Tab -> Decrease Edges | BODY |
| PRB-09 | HELD Enter on Edges "−" 9 -> 0 (14 keydowns) | stops at 0, repeats hit the SPAN, no bounce; Tab -> Increase Edges | — |
| PRB-09 | Banes "+" to 1, Shift+Tab, Enter on "−" | Banes value focused with ring; Tab -> Increase Banes | BODY |
| PRB-09/10/11 | Tab walks: feature roll bar (13 stops), initiative tracker (28 stops), Stamina modal | identical to base; 0 stops on a `.dse-stepper__value` | — |
| PRB-10 | Malice (renderValue) focused with focusVisible:true | ring around the caption + numeral box (screenshot) | no ring rule |
| PRB-12 | modal MOUSE Temp "−" x5, wheel x3 over the input | focus input (no ring); value 0 -> **2**; "Lose 2 Temp Stamina" | focus BODY; value 0; "Lose 5 Temp Stamina" |
| PRB-13 | modal keyboard Temp "−" to 0, then Tab | focus `sedit.temp.input`; Tab -> `sedit.temp.inc` | focus BODY; Tab -> `sedit.temp.input` (continues from the button, NOT the top) |

Ring screenshots (viewed): `fixed3-edges-ring.png` (Edges value "2+" boxed by the kit ring), `fixed2-malice-ring.png` (Malice caption+numeral boxed). The ring comes from the existing shared rule (`styles-source.css:15504-15509`, same rule and token as `.dse-stepper__btn:focus-visible`); no new token.

## Mutation table (scratch worktree; jest = `test/dom/kit/stepper.test.ts` + `kit-index.test.ts`; e2e = `--only=STAM-SF01,STAM-SF02,STAM-SF03,CTR-F01`)

| mutation | jest | e2e | caught by |
|---|---|---|---|
| M1 drop the activeElement check (move whenever a button is disabled) | 2 red | CTR-F01, SF01 red | jest "nothing moves when ... did not hold focus", "editable: min===max"; e2e: Tab lands on the input instead of "+" |
| M2 focus the opposite button | 9 red | 4/4 red | every focus-target assertion |
| M3 drop `tabindex="-1"` | 5 red | 4/4 green | jest only (read-only tests + the tab-stop test) |
| M4 drop `preventScroll` | 4 red | green | jest focus-spy tests only |
| M5 ring always on | 2 red | SF03 red | jest pointer tests; SF03 |
| M6 read `:focus-visible` AFTER the disable | 0 red | CTR-F01, SF01, SF02 red | e2e only (jsdom mocks `matches`) |
| M7 drop the CSS selector | 1 red (kit-index "one rule") | green | jest only |
| M8 move even when the held button did not disable | 2 red | SF01, SF02 red | jest "press not reaching the bound", "nothing moves"; e2e |
| M9 never move (base behaviour) | 9 red | 4/4 red | all |

Neither layer is vacuous. Read-only gaps: LOW-2.

## Owner question — read-only path in real Obsidian
(a) **It behaves per the rule.** On `ds-feature` with the shipped "Enable rolling" preference on (`rollingEnabled`, default off, NOT behind `experimental`), the roll bar's Edges/Banes steppers (`src/framework/kit/rollBar.ts:151`, `:159`, `min 0, max 9`, read-only) were driven with real keys: at both bounds focus goes to the value span with a keyboard ring, it is never a Tab stop, Tab/Shift+Tab continue in order, and a held Enter does not bounce (PRB-09).
(b) **The e2e harness can drive it as a committed test.** It needs:
- a fixture, e.g. `e2e/vaults/shipped/Feature/feature.md`, holding a `ds-feature` block with one effect carrying `roll: Power Roll + Might` and tier1-3 (the probe's `Probe/feature.md` is enough);
- `before(() => dse.setPrefs({ rollingEnabled: true }))` / `after(() => dse.setPrefs({}))`;
- control ids, because the driver and gate want driven controls addressed by id: pass `control: 'roll.edges'` / `'roll.banes'` at `rollBar.ts:151/159` (attributes only), plus ids on the launch button (`.dse-roll-btn`, rollController.ts ~:86) and on the Modifiers disclosure header;
- a manifest `e2e/manifest/roll-bar.ts` (for example `roll.launch` click, `roll.modifiers` click, `roll.edges.inc` press:Enter, `roll.banes.dec` press:Enter);
- the scenario: click Roll, open Modifiers, `tabTo(roll.edges.inc)`, Enter x9, assert `focusedControl() === 'roll.edges.value'` with `:focus-visible` and computed `outline-style: solid`, Tab -> `roll.banes.inc`; then Banes "+" once, Shift+Tab, Enter -> `roll.banes.value`, Tab -> `roll.banes.inc`. That would turn M3 and M7 red in e2e (the outline check catches M7).
- Stamping ids on rollBar changes no pixels (`controlId.ts`: attribute only), so it cannot move shots or freeze.

**ds-counter `control: 'counter'` stamp:** `src/elements/counter/view.ts:61` passes only `control` to the kit, and `stampControl` (`src/framework/kit/controlId.ts:14-16`) only calls `setAttribute('data-dse-control', …)`. No class, text or pixel changes. Shots (592, 0 FAIL) and freeze (280/280) on 247bd27 confirm it.

## Scope check
`git diff --stat 9f08f06 247bd27`: `src/framework/kit/stepper.ts`, `styles-source.css` (+1 selector), `src/elements/counter/view.ts` (+1 line `control`), `test/dom/kit/{stepper,kit-index}.test.ts`, `e2e/specs/{counter,stamina-bar}/…`, `e2e/manifest/{counter,stamina-edit-modal}.ts`, `e2e/vaults/shipped/Counter/counter.md`. Nothing in `StaminaBarPanel.ts` (SC-492) or FormModal (SC-489). `focusNeighbourStop` (`StaminaEditModal.ts`) is untouched. The superproject change is CHANGELOG only.

## Gate logs (this review)
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r1-review-b7q4/`: `g-tsc.log`, `g-lint.log`, `g-jest.log` (`Tests: 1 skipped, 5859 passed, 5860 total` / `Test Suites: 1 skipped, 241 passed, 241 of 242 total`), `g-life.log` (`OBSIDIAN-LIFECYCLE done: 34/34 ok, 0 failed`, port 9297), `g-e2e.log` (`OBSIDIAN-E2E done: 112/112 ok, 0 failed, 0 known-bug, coverage: 73/73 pairs`), `g-shots.log`, `g-freeze.log`, each with its `.rc`. Mutation logs: `mut-M*.{jest,e2e}.log`. Probe logs: `p-e2e-{fixed1,fixed2,fixed3,base,base2}.log`.
