# SC-379 slice 1 fix round + slice 2 — independent review report

**Executive summary**
- **VERDICT: APPROVE.** HIGH 0 · MEDIUM 0 · LOW 3 · INFO 3. None of the LOWs blocks the sanction ask or landing.
- Range `1d98148..cad6ad7` (dse `sc379-negotiation`) plus superproject `88e9435`. My gate re-runs match the implementer's numbers exactly:
  - tsc and lint: clean
  - jest: **4308 passed / 1 skipped**
  - lifecycle (port 9293): **19/19**
  - shots: **556**, 0 FAIL, 114 host-leak kinds / 684 comparisons
  - freeze: **`FREEZE VIOLATED (6 checksum mismatches, 0 missing)`**, all `negotiation*`
  - parity: **0 / 0 / 24**
- **Freeze package checks out.** `rebaseline.txt` matches my sweep 6/6. `widening.txt` matches 6/6, and none of its 6 names is in the 262-line baseline. The 3 "after" crops are byte-identical to my sweep's print twins.
- **All five slice-1 findings are closed, each proven by execution:**
  - M1: the print seals are opaque.
  - M2: in real Chromium the hit box measures 44 px under `pointer: coarse`, and the D-2 pin kills the shrink-to-seal mutant.
  - L1: quoted numbers are handled; there are no `.nan` writes.
  - L2: deleting the clamp fails 5 negotiation tests.
  - M3: under **real** SC-340 adoption the root is adopted and the tab state equals the model.
- **Slice 2 matches spec §1, §4 fixes 2–5, §5 and §6.**
  - Chips use `.dse-optchip`. States are shown by shape, not only colour: ◆/◇, check + bold, a strikethrough with a "spent" note, and the triangle for pitfalls.
  - Recompute happens in place before any write, and focus stays on the chip.
  - A chosen tier survives a recompute, and Complete applies the NEW table.
  - The cards carry only Spent chips.
  - At 300 px, "Higher Authority" sits on one line.
- **The LOWs:**
  - The D-2 pin survives deleting `content: ''`.
  - The M3 regression test never drives adoption.
  - The docs page still opens on the legacy-UI gif.

## 1. Re-check of the slice-1 findings

| Finding | Closed? | Evidence (executed) |
|---|---|---|
| **M1** rails through numerals in print | **Yes** | Base `.dse-track__mark { background-color: var(--dse-surface) }` (`c7100ab`). The fresh `negotiation-ended--steel-realprint.png` shows clean seals with the rail stopping at each seal edge (`sc379-s2-review-ended-realprint-zoom.png`), and the 3 "after" freeze crops look the same. |
| **M2** coarse hit box + D-2 pins | **Yes** | Steel `::after` hit box (`styles-source.css:14804-14811`). Playwright against the built harness (`sc379-s2-review-hitbox.log`), hit box measured from the seal centre with `elementFromPoint`:<br>• fine pointer, 760 px: seal 30.4 → hit 32×32<br>• fine pointer, 300 px: seal 25.6 → hit 29×29<br>• **coarse pointer, 760 px: hit 45×45**<br>• **coarse pointer, 300 px: hit 37.5×45**, where the width is capped by the 37.1 px pitch (later siblings win the overlap, so no slot steals a neighbour's seal).<br>D-2 mutation runs on copies of the test and sheet in the probe dir:<br>• unmutated control: green<br>• all four sides set to `0` (hit box = seal): **fails**<br>• `min(`→`max(`: **fails**<br>• `content: ''` deleted: **passes** (LOW-1)<br>• contrived `/ 2 * 0`: passes (INFO) |
| **L1** quoted numbers | **Yes** | `advanceStanding` plus a `Number()`-coercing, finite `clampStanding`. Under real adoption:<br>• `"3"/"2"` + crit → `current_patience: 2`, `current_interest: 4`<br>• `"4.5"` + crit → interest 5, which is a deal<br>• `lots` → left as authored<br>No `.nan` appears anywhere (`sc379-s2-review-probe.log`, QUOTED lines). |
| **L2** vacuous clamp tests | **Yes** | I ran `negotiation.test.ts` against a mutant `NegotiationData` with the clamp deleted, mapped in via `moduleNameMapper`; no repo edit. **5 failed / 60 passed**: the lie case, 4.5 + crit, 0.5 + pitfall, junk, and the direct `clampStanding` pin (`sc379-s2-review-mutant-L2.log`). |
| **M3** stale tab after a live Complete | **Yes** | Probe through `registerFrameworkElements(..., { viewAdoption: true })`:<br>1. appeal Higher Authority + Power + lie, pick 17+, then Complete<br>2. own write, then Obsidian re-renders the section<br>Results:<br>• `adopted=true`, `claims=1`, and the **tab equals the written model's `currentArgument`**: no chips pressed, lie/reuse/same false, 0 tiers checked, Complete disabled.<br>• The Higher Authority Spent chip is pressed.<br>• A second argument (Peace + crit) applied the motivation table: +1 Interest, 0 Patience.<br>• The prose after the block is intact. |

## 2. Slice 2 checked against the spec

- **§1 DOM.** All of the following match:
  - `.dse-nt__appeals` > groups > `.dse-nt__chiprow` of `button.dse-optchip.dse-nt__chip[data-kind][aria-pressed]`, with glyph, check, text, note, and `.is-spent`
  - `.dse-nt__mods` with 3 `label.dse-nt__check` and `span.dse-nt__why` only while disabled
  - `.dse-nt__roll-slot` with its own child Component
  - `.dse-nt__complete`, which is the hint plus the iconButton, toggling `dse-btn--accent`
  - the dossier, with "N of M open" / "N known", where pitfall rows have no controls
  - the Learn tab, unchanged
- **Fix 2, recompute.** Probe results:
  - Clicking Peace with "mid" chosen changed the row from "-1 Patience" to "+1 Interest, -1 Patience" with **0 writes yet**.
  - Focus stayed on the chip, and mid stayed `aria-checked` with its chosen mark.
  - Same-argument went disabled with its why-hint.
  - Complete then wrote 4/2, which is the NEW motivation table, not the stale plain one.
- **Fix 3, chosen row.**
  - The ring is Steel-scoped (`.dse-nt__roll-slot button.dse-pr__row[aria-checked='true']`), and the kit base is untouched.
  - The row also gets a check plus the word "chosen". At ≤420 px the word hides and the ring and check stay; I verified that on a full-height 300 px render.
- **Fixes 4 and 5.** The tooltip says Medium (`ArgumentView.ts:41-42`). The why-hints use the spec's exact strings.
- **Complete.** It is accented and armed only once a tier is picked. The hints are "Choose the test result…", "Applies the chosen tier…" and the over-hint.
- **Cards.**
  - `.dse-nt__dossier button` contains only `data-kind="spent"` chips.
  - The Spent chip writes bytes identical to the **base** model's `setMotivationUsed`.
  - Toggling it spends the tab chip and enables and ticks the reuse modifier in place.
- **Integrity.** Two blocks sat in one note under adoption, with a pitfall, a tier, Complete and Spent applied in block B. Block A stayed byte-identical, A's chips were unaffected, the key set stayed legacy, and the trailing prose is intact.
- **CSS.**
  - No new `rgba(`/`#hex`/`hsl(` literals.
  - Every new `font-size` is a `--dse-fs-*` role token, and the contract test is green.
  - Every new Steel rule opens with `[data-dse-theme='steel'][data-dse-element='negotiation']:not([data-dse-print="on"])`.
  - The chip's base-tier `color`/`background-color` are tokens that re-ground Obsidian's button rules. They reach print, but only negotiation's print, which is moving anyway.
- **300 px.**
  - "Higher Authority" is on one line (`sc379-s2-review-narrow-dark-tab.png`).
  - On a full-height render, nothing overflows (`scrollWidth 298 = clientWidth 298`).
  - The dossier stacks, and the Spent chip drops under the reason.
- **§5 capture.** `negotiation-appeal` is present (`entry.ts`). It shows the motivation table (-1 P / +1 I -1 P / +1 I / +1 I), the pressed chip, and same-argument greyed with its why.
- **Colours, in words.**
  - Pressed chip: dark has a teal border, teal check and bold text; light has a dark-teal border.
  - Spent: a hollow diamond, struck-through name and a small "spent".
  - Pitfall: an orange triangle.
  - Mark spent: a quiet dashed chip that becomes a solid "✓ Spent".
  - Chosen tier: a teal ring with "✓ chosen".
  - Complete armed: a solid teal button.
- **§7 docs.**
  - `docs/negotiation-tracker.md` reads plainly. It covers: the seals; keyboard use; "When the negotiation ends", including that nothing is locked; Spent chips; that the cards have no appeal controls; why-hints; the medium test; the chosen mark; the 0–5 clamp; and that the tab is fresh after Complete.
  - It states what deliberately doesn't work: pitfalls are reference only, and Complete is off once the negotiation ends.
  - The regenerated `docs/Media/negotiation.png` shows the new design (`sc379-s2-review-docs-image.png`).
  - LOW-3 covers the gif.
- **CHANGELOG** (`88e9435`). It is the spec's bullet verbatim, and every claim in it is true of the build.

## 3. Freeze package and what moved (prose for Scott's sanction ask)

Verified: `sha256sum -c rebaseline.txt` 6/6 OK and `sha256sum -c widening.txt` 6/6 OK against my own sweep. None of the 6 widening names is in `freeze-baseline.sha256` (262 lines). The 3 `-after` crops are byte-identical to my sweep's `*--steel-print.png` (`cmp`). Side-by-sides: `sc379-s2-review-freeze-*-sidebyside.png`.

- **`negotiation` (default).**
  - **Before:** Patience printed as a bare grey bar with no visible levels. Interest was a plain list whose lower rungs were greyed. The modifiers were plain checkboxes. Motivations and pitfalls were a checkbox list.
  - **After, Patience:** a framed strip of six numbered circles. 0–3 are solid outlines with 3 in a bold ring, 4–5 are dashed, all on a dashed line, with a "3 / 5" readout.
  - **After, Interest:** a framed table of six numbered rows (5 at the top) joined by a vertical line. Row 3 is bold and carries a "NOW" tag.
  - **After, argument area:** motivations and the pitfall are small labelled buttons (◆ Higher Authority, ◆ Peace, ⚠ Power). There is a "Modifiers" heading, and the greyed "Reuses…" line has an italic "only when a spent Motivation is appealed to". The tier table is unchanged in content, with "Choose the test result to complete the argument" under it.
  - **After, bottom:** two bordered cards, Motivations ("2 of 2 open", each with a dashed "Mark spent" button) and Pitfalls ("1 known").
  - Print grew from about 787 to 1068 CSS px. That is still complete in the capture.
- **`negotiation-checked`.**
  - The same frame as the default.
  - The Higher Authority button shows a hollow diamond and a check, is struck through, and carries a small "spent". The Reuse and Lie boxes are ticked.
  - "Argument has already been made" is greyed with "not while a Motivation is appealed to".
  - All four tiers read "-1 Interest, -1 Patience", as before.
  - The Higher Authority card is struck through with "✓ Spent", and its count reads "1 of 2 open".
- **`negotiation-pr-checked`.**
  - The same as the default, except the 12–16 row is marked "✓ CHOSEN" at its right.
  - The hint reads "Applies the chosen tier to Interest and Patience".
  - Before, the chosen row was told apart only by a faint outline.
- **Unchanged:** the card title and its "Negotiation" eyebrow. The Complete Argument button does not print, before or after.

## 4. Findings

### LOW

**LOW-1 — The D-2 pin survives deleting the hit box's `content: ''`.**
- Where: `controlDensity.test.ts:218-232` asserts the four `min(0px, calc(...--dse-track-mark...--dse-control-min` sides and `position: absolute`. It never asserts `content`.
- Mutant run: removing `content: ''` from `styles-source.css:14805` leaves all 32 tests green (`sc379-s2-review-mutant-M2-b-no-content.log`).
- Failure scenario: someone tidies the rule, the `::after` stops generating, and the coarse hit box silently falls back to the 26–30 px seal while D-2 stays green. That is exactly the regression M2 fixed.
- Fix: add `expect(r.body).toMatch(/content:\s*['"]{2}/)` to the hit-box test.

**LOW-2 — The M3 regression test does not exercise adoption.**
- Where: `negotiation.test.ts:1515-1574` runs on the mock `makeHost()`, which never re-renders. So `expect(host.containerEl.firstElementChild).toBe(root)` (`:1536`) holds by construction, and the comment's "SC-340 adoption keeps it" premise is never tested.
- The behaviour is correct, as my real-adoption probe shows.
- Failure scenario: a future change to adoption or to the tab's re-sync could reintroduce M3 while this test stays green.
- Fix: add one case in the `view-adoption.test.ts` shape. That means `registerFrameworkElements(..., { viewAdoption: true })`, a Complete, a flush, a re-render through the processor, and then asserting `adopted === root` plus that the tab equals the written `currentArgument`. `sc379-s2-review-probe/probe2.test.ts` "M3 under REAL SC-340 adoption" is a ready template.

**LOW-3 — The docs page opens on the legacy-UI gif.**
- Where: `docs/negotiation-tracker.md:11` (`![negotiation](Media/negotiation.gif)`) is the first image a reader sees. It shows the old bubbles and checkbox cards, which the text below now contradicts. The implementer reported it as non-regenerable (`docs-manifest.mjs` `DOCS_MANUAL`).
- Fix: point `:11` at `Media/negotiation.png`, or drop it, until a new recording exists. Then file the manual re-record as a follow-up.

### INFO

- **INFO-1 — Head baselines are about 2 CSS px apart.** The "Appeals to Motivation" and "Motivations" heads, which lead with the text glyph ◆, sit about 2 CSS px lower than the "Mentions Pitfall" and "Pitfalls" heads, which lead with an SVG icon (`.dse-nt__appeals-head` `:2724`, `.dse-nt__dossier-head` `:2872`, both `align-items: center`). It is visible side by side in `sc379-s2-review-appeal-dark-tab.png`. This is cosmetic.
- **INFO-2 — The CHANGELOG will conflict at landing.** Superproject `88e9435` is based on `49d6aef`. `main` has since added Unreleased bullets (SC-385, SC-378, SC-127), so `git merge-tree` reports a conflict in `CHANGELOG.md`. Both sides add a bullet at the top of `## Unreleased`, and resolving it is a keep-both. This is for the land-stack step.
- **INFO-3 — The D-2 regex accepts a contrived mutant.** A `/ 2 * 0` mutant passes, because the regex pins token names, not the arithmetic. That is acceptable for a source-text guard. The Chromium measurement above is the real proof.

## Gate lines I measured (dse `cad6ad7`)

| Gate | Line | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc379-s2-review-tsc.log` |
| lint | clean, exit 0 | `sc379-s2-review-lint.log` |
| jest | `Test Suites: 1 skipped, 215 passed, 215 of 216 total` · `Tests: 1 skipped, 4308 passed, 4309 total` | `sc379-s2-review-jest.log` |
| lifecycle (`DSE_LIFECYCLE_PORT=9293`) | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed` | `sc379-s2-review-lifecycle.log` |
| shots | 556 PNGs, 0 FAIL; host-copy pin OK; SC-127 light island OK; `button host-leak OK (114 button kinds … = 684 comparisons`; `print-twin delta OK (138 capture ids` | `sc379-s2-review-shots.log` |
| freeze | `FREEZE VIOLATED (6 checksum mismatches, 0 missing)`. The 6 are `negotiation`, `negotiation-checked` and `negotiation-pr-checked`, each as `--steel-{print,realprint}`. `rebaseline.txt` is 6/6 OK, `widening.txt` is 6/6 OK, and 0 widening names are in the baseline. | `sc379-s2-review-freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | `sc379-s2-review-parity.log` |
| probes | 5/5. Clamp mutant: 5 killed. D-2 mutants: control 32/32 green; shrink and max killed; no-content and ×0 survive. Hit box: coarse 44 px. | `sc379-s2-review-probe.log`, `-mutant-L2.log`, `-mutant-M2-*.log`, `-hitbox.log`, `-narrowfull.log` |

Working tree: `git status --porcelain` was the same before and after. The plugin is clean, and the superproject's ` M draw-steel-elements` was there before I started. All probes and mutants live under `sc379-s2-review-probe/` in the ledger dir.
