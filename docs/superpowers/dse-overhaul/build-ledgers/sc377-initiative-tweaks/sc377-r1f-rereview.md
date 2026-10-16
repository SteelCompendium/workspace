# SC-377 R1F: scoped re-review (dse `d0adf45..f38e978`, superproject `8813502`)

## Executive summary

- **VERDICT: PASS-WITH-FIXES.** The tip is `f38e978` (verified). 9 of my 11 findings are CLOSED, MEDIUM-2 is still OPEN (OWNER-2 has the same root cause), and INFO-1 is CLOSED for the jest file it named but its other half traced to a pre-existing product bug. New findings: 1 MEDIUM, 1 LOW, 2 INFO. A separate product bug (P-1) needs its own ticket.
- **MEDIUM-2 is still open, in real Obsidian and in the harness.** The not-acted group / portraits-off mark is still a raised light ball in steel-light.
  - Cause: the R1F reset rule has specificity (0,6,0). The kit button sheen rule `:is(.dse-btn…):not(…)×4:not([data-pressed])…` has (0,8,0), so the sheen wins in every not-acted state.
  - The CSS-contract test only text-matches the sheet, so it passes anyway.
  - A reset rule at (0,10,0) was validated: light becomes the same sunken well as the hero side.
- Shield delta `722b5ac` is correct.
  - Live Preview non-editable clicks are prevented again and CodeMirror keeps focus, matching base.
  - In-card click-away commits in Reading view and Live Preview.
  - A click on the input itself, a drag out of it, the quick-add Amount → Label → Add flow, embeds, a nested read-only counter, and G-S3 all behave.
- New LOW: a click on a DIFFERENT element's card, or on the same tracker in another pane, still leaves the title open and unsaved. The new CHANGELOG line "a click anywhere else saves" claims otherwise.
- INFO-1 split:
  - `sidebarEncounterHandoff`: the implementer's quoting diagnosis is CONFIRMED. With `Math.random` pinned to `800000`, `3e1234` or `012345`, the old test fails and the new one passes.
  - `sidebarInitiative` "SC-288 r2": now PROVEN to be a pre-existing product bug, P-1 below. The sidebar stamps `_dse_anchor` unquoted, and the next element write rewrites `012345`→`12345` or `3e1234`→`.inf`, so the panel loses its block. About 3% of random ids are affected, the failure is deterministic with a pinned id, and it is still flaky at the tip.
- Battery at `f38e978` matches every claim:
  - tsc/lint clean; jest 4269/1 skipped, ×3 green.
  - lifecycle 24/24; shots 556, 0 FAIL; input host-leak 14 kinds / 164 comparisons.
  - freeze: 38 mismatches, all `initiative*`. 44/44 deliverable hashes unchanged.
  - parity 0/0/24.

## Original findings: status

| finding | status | how verified |
|---|---|---|
| MEDIUM-1 (shield unbounded in Live Preview) | **CLOSED** | My `R-LP` probe, real Obsidian: Live Preview non-editable click/double-click/drag → `.cm-content` keeps focus, no selection, cursor 0:0 (identical to base). Inputs still focus, take typing and double-click selection. A bundle with only the bound removed fails G-S9a in Live Preview ("press on non-editable card text was not default-prevented"). Jest mutant N1 kills 3 tests. |
| MEDIUM-2 (steel-light group/portraits-off not-acted = raised light ball) | **OPEN** | See NEW-MEDIUM-A. Real Obsidian, moonstone: group not-acted centre `rgb(203,203,203)`, button `background-image: linear-gradient(rgba(255,255,255,.9)…)`. Harness: same. |
| LOW-1 (Reading view: click in same card doesn't commit) | **CLOSED** for the same card | `R-BLUR-RV/LP`: a click on the Heroes heading or the Malice bar commits the title in both modes. Mutant bundle without the blur fails G-S9e. Jest mutant N2 kills 2. Gap across elements/panes: NEW-LOW-B. |
| LOW-2 (loud placeholder) | **CLOSED** | Caption-size small caps (r1f evidence). The input-size side effect is NEW-INFO-C. |
| LOW-3 (`name: 1984` breaks tracker) | **CLOSED** | Real Obsidian, hand-edited: `1984`, `true`, `3.5` render as text. `[a, b]` and `{x: 1}` show "'name' must be text". `""` and `'  '` show the empty prompt. Mutant N4 kills 3. |
| LOW-4 (Malice ± lost 44px overlay) | **CLOSED** | `::after` measured 44×44 on the 23.8px button. Overlay bottom 413.2 < log toggle top 416.2: no overlap at main or 300px. Note that my old "bar background" probe click now lands on − (correct behaviour). |
| LOW-5 (docs) | **CLOSED** for both cited items | The CHANGELOG print sentence now names the Malice-line move. DESIGN rule 9 cites SC-377 only (`8813502`). New inaccurate docs claims: NEW-LOW-B and NEW-MEDIUM-A. |
| LOW-6 ("Not zero" on empty) | **CLOSED** | Empty → "Amount required" in the field and in the `role=alert` hint. Real click flow B2 shows the hint "Label required" with the Amount draft "2" kept. |
| INFO-1 (sidebar jest reds) | **CLOSED** for `sidebarEncounterHandoff`; **ROOT-CAUSED, not fixed** for `sidebarInitiative` | See the INFO-1 section and P-1. |
| INFO-2 (`1.5`/`1e2` accepted) | **CLOSED** | "Whole numbers only". Mutant N3 kills 4. |
| INFO-3 (G-S9d Reading view only) | **CLOSED** | G-S9d now reports "Reading view + Live Preview, cursor stayed on line 0". |
| OWNER-1 (hero seal dimmer) | **CLOSED** | Real Obsidian centres: hero acted `rgb(85,89,91)`, group acted `rgb(86,90,91)` in both themes. Computed effective opacity 1.00 on both. |
| OWNER-2 (ring ≥3:1) | **CLOSED for contrast**, inconsistent shape in light (MEDIUM-2) | See section 3. |

## New findings

**NEW-MEDIUM-A: MEDIUM-2's fix does not win the cascade, so the not-acted group / portraits-off mark is unchanged.** `styles-source.css` (R1F reset block after `:13592`, "The socket's own paint is the box's")

- Defect: the reset selector is `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative'] .dse-init__grouphead > .dse-init__turnbox .dse-init__turn`, specificity (0,6,0).
- The kit's `[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-btn, .dse-tabs__tab):not(.dse-btn--accent):not(.dse-btn--ghost):not(.dse-btn--danger):not([data-pressed]):not([aria-selected="true"])` is (0,8,0). It sets `background-image: var(--dse-sheen)` and `box-shadow: var(--dse-chip-bevel)` on every NOT-pressed button.
- CDP `CSS.getMatchedStylesForNode` lists that rule last, so it wins.
- The acted state is unaffected only because `[data-pressed]` excludes it.
- Result: in steel-light (sheen `rgba(255,255,255,.9)…`) the not-acted group and portraits-off mark is still a raised light ball. The hero's is a sunken grey well. Dark carries the faint sheen too.
- Reproduced:
  - Real Obsidian 1.14.4 moonstone: `sc377-r1frev-obsidian-marks-crops-steel-light.png`, last tile vs the "hero not" tiles.
  - Harness: `sc377-r1frev-turn-marks-portraits-sheet-steel-light.png`, "group" and "off" columns.
- Why it passed: the new jest "CSS contract" test regex-matches the stylesheet text, never the computed cascade. The implementer's light evidence image does not match the shipped render.
- Fix:
  1. Raise the reset's specificity above (0,8,0). Validated: `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative'] :is(.dse-init__grouphead > .dse-init__turnbox, .dse-init__row > .dse-init__turnbox) .dse-init__turn.dse-btn:not(.dse-btn--accent):not(.dse-btn--ghost):not(.dse-btn--danger) { background: none; box-shadow: none; border: 0; }` (0,10,0). Computed `background-image: none` in both schemes; light becomes the sunken well with a dark metal ring (`sc377-r1frev-medium2-asshipped-vs-fix.png`, left to right: light as-shipped, light fixed, dark as-shipped, dark fixed). Check that `:hover`/`:active`/`:focus-visible` kit rules also lose to it.
  2. Replace or augment the regex test with a computed-style check, either a shots assertion or Playwright `getComputedStyle(...).backgroundImage === 'none'` for a not-acted group button in both schemes.
  3. CHANGELOG ("one turn mark in both light and dark") and DESIGN rule 9 ("used identically") are only true after this fix.

**NEW-LOW-B: "click anywhere else saves" stops at the element boundary.** `src/framework/pipeline.ts` (`armClickShield`: `root.contains(active)`); docs `CHANGELOG.md` ("Enter, or a click anywhere else, saves")

- Scenario: title being edited in tracker A, then a click on a non-editable part of:
  - (a) another DSE element in the same note (a `ds-counter` name), or
  - (b) the same tracker open in a second pane.
- Result: the title input stays open and focused, and nothing is written (`F-EDGE-RV/LP` E1, `F-EMBED` two-panes). Clicking plain note text afterwards does commit, so there is no data loss.
- The cause: B's shield prevents default (no focus move) but only blurs an active element inside its own root.
- Fix (pick one):
  - Blur when `active.closest('[data-dse-element]')` is any DSE root and `active.matches(EDITABLE_CONTROL)`. This never touches `.cm-content`, which is outside every root.
  - Or narrow the CHANGELOG/docs wording to "a click anywhere else in the tracker or outside the cards".

**NEW-INFO-C: naming an UNNAMED tracker types in caption size.**

- The input inherits `h2[data-empty]`'s 13.6px small caps, then jumps to the 23.4px h2 on commit. The heading grows about 11px and the card shifts under the pointer.
- Measured with real clicks: Add Condition / Advance round still receive the click (shift 11px < button height), so nothing is lost today.
- Suggest `font-size`/`font-variant` overrides on `.dse-init__title-input`, so the draft previews the real title size.
- Evidence: `sc377-r1frev-title-editing-unnamed-steel-dark.png` and `-named-`.

**NEW-INFO-D: in Live Preview, a modal opened from the card closes when a pending write lands.**

- Title click-away commit followed by Add Condition gives a modal that opens and then closes.
- It is pre-existing. Base `9ded832` does the same after Malice + then Add Condition (`F-LPMODAL`). Live Preview never adopts (SC-340 G-S6c), so the rebuild unloads the modal's owner.
- The title commit is just one more write that can precede the click. Not R1F's to fix; worth a backlog line.

## INFO-1 detail

- **`sidebarEncounterHandoff`: the diagnosis is confirmed.**
  - With `Math.random` pinned so the minted id is `800000`, `3e1234` or `012345`, the d0adf45 version of "persists the id it minted" fails. The f38e978 version passes. Both pass for `b33333`.
  - The encounter mints into the model as a string, so `stringifyYaml` writes it quoted.
  - Product readers accept quotes: `readAnchor` / `readGeneratedFrom` regexes are `['"]?…['"]?`, and model fields stay strings.
  - So no product path mis-reads a QUOTED anchor.
- **`sidebarInitiative` "SC-288 r2": root cause proven. It is a product bug, P-1.**
  - With `Math.random` pinned to `3e1234` or `012345`, the test fails deterministically at `:350` (`data-dse-sidebar-unavailable` = "true" right after a Malice write). `800000` passes.
  - Mechanism: `src/framework/sidebar/registration.ts:225` calls `ensureAnchor`, which stamps `_dse_anchor: <id>` UNQUOTED (`src/framework/sidebar/anchor.ts:62`). YAML then reads a numeric-looking id as a number, and the element's next `serialize` rewrites it. The `readAnchor` lookup then fails, and the panel shows "Backing block not found".
  - Real Obsidian, `F-ANCHOR`, after one + click on a counter:

    | stamped | written back |
    |---|---|
    | `_dse_anchor: 012345` | `_dse_anchor: 12345` |
    | `_dse_anchor: 3e1234` | `_dse_anchor: .inf` |
    | `_dse_anchor: 800000` | unchanged |
    | `_dse_anchor: "012345"` (quoted) | unchanged |

  - Rate: about 3.0% of `generateAnchorId()` outputs (simulated over 200k ids).
  - The test file is therefore still about 3% flaky at the tip. "5 green runs" cannot show that.
  - Fix, out of SC-377 scope (new ticket):
    - (a) stamp the id quoted (`${ANCHOR_KEY}: "${id}"`), or better, generate ids that can never parse as numbers (a letter prefix);
    - (b) coerce `_dse_anchor` to String in the models that pass it through.
  - Severity recommendation for that ticket: MEDIUM. A sent-to-sidebar block randomly loses its panel.

## Shield delta `722b5ac`: probe matrix (real Obsidian 1.14.4, Xvfb `:160`, CDP 9291)

| case | Reading view | Live Preview |
|---|---|---|
| click on the focused title input itself | stays open, focused, not written | same |
| drag-select inside title input ending on the Heroes heading | stays open, focused | same |
| right-click on card text while editing | commits | commits; editor context menu shows (pre-existing) |
| Amount → click Label → type → click Add | entry lands, Malice 3→6, Amount cleared | same |
| Amount typed, Add with empty label | "Label required" hint, label focused, Amount "2" kept; then label + Add → lands (8) | same |
| title editing, click Add Condition | commits, modal opens | commits; modal closes on the write (NEW-INFO-D, pre-existing) |
| counter: type 15, click its own + | commit 15 then +1 → 16 (file and input) | same |
| title editing, click another element's card | **stays open, not written** (NEW-LOW-B) | same |
| then click plain note text | commits | commits (cursor moves to the clicked line, expected) |
| embed (A embeds B): click Amount / click heading | focuses / blurs, no selection | n/a |
| two panes, same note: edit in pane 1, click pane 2 | **stays open, not written** (NEW-LOW-B) | n/a |
| nested read-only counter in ds-party: award focused, click nested | award blurred, no selection | n/a |
| G-S3 (SC-340 adoption protects drafts) | ok in the 24/24 gate | ok |

Also confirmed:
- In Live Preview, keys typed after a card click again edit the note at the old cursor, exactly as at base (pre-existing; this was my R1 caveat).
- My earlier "R-RV note unchanged: false" is a probe artifact. The "bar background" press now hits the − button's restored 44px overlay, which is legitimate.

## 3. Turn marks, both schemes, both sides, portraits-off

- Computed paint is identical on the hero mark and the group box: ring = `inset 0 0 0 2px var(--dse-metal), 0 0 0 1px rgba(0,0,0,.7), inset 0 3px 5px rgba(0,0,0,.45)`, and seal gradient identical, at effective opacity 1.00.
- What renders differs only because of NEW-MEDIUM-A: the button on top of the group / portraits-off socket.
- Ring-edge contrast, my own 4× renders (darkest/brightest edge pixel vs adjacent ground):

  | case | ratio |
  |---|---|
  | dark group | 5.53 |
  | light group | 7.77 (that edge is the button's, not the metal ring) |
  | dark, white portrait | 8.39 |
  | dark, metal-grey portrait | 5.53 |
  | dark, pale-skin portrait | 7.22 |
  | light, white portrait | 8.49 |
  | light, black portrait | 4.50 |
  | dark, real `rogue.png` | 6.51 |
  | dark, real `token_1.png` | 4.29 |
  | light, real `token_1.png` | 5.97 |
  | dark, checkerboard | 17.16 |

  All are ≥ 3:1. The implementer's four figures (7.59 / 6.59 / 5.06 / 4.29) are in the same range. My sampling differs, so the exact values do not match. The light-group figure of theirs (5.06, the metal ring) is not what renders today, because of NEW-MEDIUM-A.
- **Legibility over real portraits: yes.** On the bright metal-grey and white portraits in dark mode, the metal line alone vanishes, but the 1px dark outer line plus the dark inner well keep a clear circular edge. Over the real token art (`rogue.png`, `token_1.png`, `steelcompendium.png`) the ring reads clearly in both schemes (`sc377-r1frev-obsidian-marks-crops-steel-{dark,light}.png`, `sc377-r1frev-turn-marks-portraits-sheet-steel-{dark,light}.png`).
- The struck seal is the same brightness on both sides (OWNER-1 closed).

## 5. New tests are not vacuous

Mutants applied one at a time, each restored. `git status --porcelain` empty afterwards.

- N1, bound removed: pipeline 3 failed.
- N2, click-away blur removed: pipeline 2 failed.
- N3, whole-number check removed: malicePanel 4 failed.
- N4, scalar-name coercion removed: serialize 3 failed.
- N5, hint not written: malicePanel 5 failed.
- Lifecycle against patched bundles:
  - without the blur: G-S9e FAIL ("clicking elsewhere in the card left the title input open");
  - without the bound: G-S9a FAIL in Live Preview and G-S9e FAIL.
- Exception: the two new turn-mark "CSS contract" tests ARE effectively vacuous for MEDIUM-2. They pass while the computed render is wrong (NEW-MEDIUM-A).

## 6. Scope and hashes

- `d0adf45..f38e978` touches only:
  - `src/framework/pipeline.ts`, `src/elements/initiative/{model,view}.ts`, `styles-source.css`;
  - initiative/pipeline/sidebar tests, `obsidian-lifecycle.mjs`, `shoot.mjs`;
  - CHANGELOG, `docs/initiative-tracker.md`, 4 `docs/Media` PNGs.
- No other element's source changed.
- `rebaseline.txt` and `widening.txt` are unchanged since 09:53 (md5 `c934eaf0…`, `b4e4c003…`), and `sha256sum -c` gives 44/44 OK against this run's shots.
- The freeze mismatch set equals `rebaseline.txt` exactly.

## 8. Docs

- dse CHANGELOG and `docs/initiative-tracker.md`: the R1 items are fixed. Two new claims are not yet true: "one turn mark in both light and dark" (NEW-MEDIUM-A) and "a click anywhere else saves" (NEW-LOW-B).
- DESIGN rule 9 attribution is fixed. "used identically" waits on NEW-MEDIUM-A.
- Regenerated `docs/Media/initiative-tracker.png` shows the new layout: title, round + Advance on the Heroes line, Malice stepper, ring marks.
- The animated `initiative-tracker.gif` is still the old layout. The implementer disclosed this: it is a manual recording.

## Battery at `f38e978` (my runs, skill order)

- `npm run tsc`, `npm run lint`: clean, exit 0.
- `npx jest` ×3: `Tests: 1 skipped, 4269 passed, 4270 total`, `Test Suites: 1 skipped, 213 passed, 213 of 214 total`, all three green (load 2–7).
- `DSE_LIFECYCLE_PORT=9291 npm run obsidian-lifecycle`: `OBSIDIAN-LIFECYCLE done: 24/24 ok, 0 failed`.
- `npm run shots`: 556 PNGs, 0 FAIL.
  - host-copy pin OK (Obsidian 1.14.4)
  - button host-leak OK (112 kinds, 672 comparisons)
  - input host-leak OK (14 input kinds × 6 states × dark/light = 164 comparisons)
  - print-twin delta OK (138 ids, max drift 2.00px)
- `check-freeze.sh`: `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`. 0 outside `initiative*`; the set equals `rebaseline.txt`. 44/44 deliverable hashes OK.
- `npm run parity`: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, exit 0.

## State left behind

- dse `git status --porcelain` is empty, and the tip is still `f38e978`. Temporary probe test files were created and deleted.
- No processes remain.
- My lifecycle temp dirs were removed. `/tmp/dse-obsidian-lifecycle-7HalYF` (10:57, not mine) and `-xe8ZdU` (Sep 25) were left alone.
