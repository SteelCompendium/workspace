# SC-439 r2 review: e2e and jsdom coverage of the negotiation tracker

## Executive summary
- **Verdict: NOT LAND-READY.** It needs one short round of test and manifest changes, plus filing of new bugs. The gates are green and match the expected numbers exactly. The `src/` diff only adds attributes, but it does change Live Preview focus (L-5). Every marker fails today for the reason it states.
- **Findings:** 0 CRITICAL / 0 HIGH / 1 MEDIUM / 5 LOW / 6 INFO. **New product-bug candidates: 3** (all Low): B-1 a menu opened with the keyboard appears at the window's top-left; B-2 stale argument names silently drive the tiers; B-3 a hand-typed `reusedMotivation` disagrees with the checkbox.
- **M-1:** keyboard Reset through the native menu (Enter on the options button, then ArrowDown and Enter in the menu) is a real path the branch exercises. The only test that drives it is the known-bug test NEGO-F01, which presses the keys at the page, so `coverage.json` books it as `(page)` and the coverage gate never sees it. This is the SC-438 M-1 pattern.
- **Gates at `99fa593a`:** tsc rc 0 · lint rc 0 · jest `12512 passed / 1 skipped` (282 suites, shots cache present), rc 0, loadavg 3.3 to 12.1 · e2e run 1 and run 2 both `460/483 ok, 0 failed, 23 known-bug, coverage: 278/278 pairs`, rc 0, no flake · lifecycle 21+16+9+4+7+4+3 = **64/64**. G-S91 and G-S115 passed on the first try. I did not re-run shots, freeze or parity: no other caller passes the new kit options, so no other element's output changes.
- **Pair count:** I counted 45 pairs and 18 ids myself: 233 + 45 = 278. Every interactive node carries an id. M-1 is the one interaction that is missing.
- **Censuses:** rogue `<button>`s with a click listener, one on the Argument tab and one in the standing area, turn both censuses red (jsdom 11 tests, CENSUS-13 and CENSUS-15). A listener on a plain `<div>` is caught by the real census only, by design. No allowlist uses a blanket prefix. The Reset item's `MenuItem.dom` stamp is real: removing it turns CENSUS-14, R03 and R04 red.
- **Mutations:** I broke 16 handlers in 4 builds. Every one turned at least one plain e2e test red, and the control tests stayed green. Under the mutants, 3 unpinned markers still passed: X06 and X07 (a broken seal click) and W07 (a menu that does not open). See L-1.
- **Markers:** all 10 e2e and 9 jsdom markers fail today for the stated reason. Under one simulated fix per bug, all 19 flip and the 36 plain e2e tests stay green. One plain jsdom census test goes red under the SC-641 fix (L-2). SC-639, SC-642 and the no-write Reset (mtime unchanged) all reproduce in real Obsidian; SC-642 also happens in Live Preview.

## Findings

### MEDIUM

**M-1. Keyboard activation of "Reset negotiation" is exercised but not declared. Its only driver is a known-bug test that presses the keys at the page.**
- **Where:** `e2e/specs/negotiation/focus.e2e.ts:17-18` (NEGO-F01 calls `dse.press('ArrowDown')` and `dse.press('Enter')` with no target). The manifest row is `e2e/manifest/negotiation.ts:31` (`'negotiation.menu.reset': c(['click'], …)`), with the comment at `:26-29`: "focus never moves onto an item, so only the mouse is declared".
- **Failure scenario:** the keyboard path works today. ZNR-06 and F01 both write `current_patience: 3`. My run's `e2e/.out/coverage.json` lists `(page) press:ArrowDown` and `(page) press:Enter` as driven only by `NEGO-F01`. The runner exempts `(page)` from its "unmanifested" check, so the gate cannot see this interaction. Once SC-639 is fixed and F01 is deleted or rewritten, nothing drives keyboard Reset. Before that, a keyboard-Reset regression shows up only as F01 "failed differently". The Done bar says "a manifest lists every (control, interaction) pair". The SC-438 r2 review graded the same shape (keys sent to the page around the gate) as MEDIUM M-1.
- **Probe:** I read `coverage.json` from my e2e run 1, and ran ZNR-02 and ZNR-06 (`zz-probe.e2e.ts.txt`). After Enter on the options button, focus stays on `negotiation.menu`, and Obsidian's Menu Scope handles ArrowDown and Enter. This is the `modal.close` "aimed at" case: a host control that gets the key without holding focus.
- **Fix (test-only):** let `dse.aimedAt` accept `negotiation.menu.reset`. That is a small additive `HOST_CONTROLS`-style entry in the driver, or a `negotiation.ts` driver helper that records the drive. Declare `negotiation.menu.reset: c(['click', 'press:Enter'], …)`. Add a plain test, NEGO-R05: Enter on the focused options button, ArrowDown, then Enter aimed at the Reset item. Assert one write, initial standing, the Notice and the screen (not focus; F01 owns focus). Point F01 at the same aimed pair. Coverage then reads 279/279.

### LOW

**L-1. Seven of the ten e2e markers have no `failsWith`, so they pass when their setup action fails. Three did so under my mutants.**
- **Where:** `integrity.e2e.ts:65` (X06), `:71` (X07); `wrong-values.e2e.ts:31` (W03), `:38` (W04), `:45` (W05), `:52` (W06), `:57` (W07). Only F01, F02 and W02 pin their failure.
- **Failure scenario:** a regression in the action a marker depends on throws inside `fn`, and `knownBug` counts any throw as "the bug still exists". My runs showed it three times. With the Patience seal's click handler removed (mutant g1), X06 and X07 reported `known-bug SC-637` after an 8.7 s "no write" timeout. With the menu not opening (g3) or the Reset item unstamped (g1), W07 reported `known-bug SC-641` after a 9 to 16 s timeout. Here plain tests went red alongside, so the regression was still caught. But the marker's own evidence was wrong, and a marker whose setup path no plain test shares would hide the regression completely.
- **Fix:** pin each one: X06 `/note_to_self/`, X07 `/gm_note/`, W03 `/Expected: false/`, W04 `/not ""/`, W05 `/Appeal to/`, W06 and W07 `/hostile/`. Or follow F01's pattern and assert the setup (the write happened, the menu closed) before the bug assertion, so that a setup failure produces a different message.

**L-2. A plain jsdom census test pins SC-641's current behaviour and goes red under any fix.**
- **Where:** `test/dom/e2eCensus.test.ts:721`: "a name-only block … and with Interest defaulting to 0 it is over: static tiers, Complete present but disabled" (asserts `negotiation.tier.row` count 0 and Complete disabled).
- **Probe:** simulated SC-641 fix (`default_interest` 2, `mut-fixes.diff`). That test was the only plain jest red out of 432 (`mut-fixes-jest.log`). The e2e side and the matrix stayed green.
- **Fix:** drop the ended or static-tier assertions from that census test; its job is ids, not endings. Or add the convention suffix `[current behaviour — SC-641 will …]`. The README row for `Negotiation/minimal.md` (`e2e/README.md`, "opens already over") should cite SC-641.

**L-3. W04 and W05 (and jsdom K06 and K07) assume one fix shape: `toHaveLength(2)`.**
- **Where:** `wrong-values.e2e.ts:41,48`; `negotiation-bugs.test.ts:115,122`.
- **Failure scenario:** a reasonable SC-640 fix could merge or refuse duplicate names (one chip plus a warning, the way SC-627 refuses a duplicate montage hero), or skip a nameless motivation. Under such a fix both markers stay red although no chip is blank or announced as "Appeal to ". My index-keyed fix flipped them, so they do flip under one shape.
- **Fix:** assert on every chip that is drawn (no blank label, no bare "Appeal to "), and add at most `length >= 1`. Do not assert the count.

**L-4. No identical twin: neither e2e nor jsdom writes to one of two byte-identical negotiation blocks.**
- **Where:** the integrity tests `integrity.e2e.ts` X01 to X05 and the matrix `[X]` use two DIFFERENT blocks (`two-blocks.md`; bodyA ≠ bodyB at `negotiation-matrix.test.ts:672-673`).
- **Probe:** ZNR-01 (`zz-twins-fixture.md`) clicked a Patience seal in the second twin and then an Interest row in the first. Each write landed in its own fence, and the prose above, between and below was intact (`probe-results-head.jsonl`). The product is fine; only the coverage is missing. SC-438 covered twins; lifecycle G-S7a and G-S7b cover twins generically, but not for this element.
- **Fix:** add NEGO-X08 with a twins fixture (ZNR-01 is a drop-in body) and an identical-twin case in matrix `[X]`.

**L-5. The new ids change keyboard focus after a save in Live Preview, and no test pins the change.**
- **Where:** the SC-602 carry, `src/framework/host/livePreviewFocusCarry.ts:58-64`, which calls `captureControlFocus` and `controlSuccessor` and works by `data-dse-control` id.
- **Probe:** I ran ZNR-03 and ZNR-04 in Live Preview, once with the head `src/` and once with base `src/` checked out (`a5313f9d`). After ArrowRight on a focused Patience seal or Enter on an appeal chip, focus lands as follows:
  - **Base:** on the card's `div.dse-chrome-anchor`. The carry found no id and fell back to the root.
  - **Head:** on `negotiation.patience.seal` value 4 and on the chip (`probe-results-base.jsonl` against `probe-results-head.jsonl`).
- **Assessment:** the change is an improvement, but it is a behaviour change the brief's "attribute only" bar does not allow for, and no NEGO test runs in Live Preview at all.
- **Fix:** record it in the ledger as accepted. Add one Live Preview test (NEGO-L01: focus by script, ArrowRight on the Patience track, focus is on seal 4 after the save; ZNR-03 is the body) so the improvement cannot regress silently.

### INFO
- **I-1.** The modifier checkboxes declare only `click`. Not declared: Space on the focused box, and a click on the `<label>` text (the large target, `ArgumentView.ts:269-283`). The precedents are `pool.kill` with `press:Space` and `pool.minion-name` with `click` on a label (`manifest/minion-pool-modal.ts:24-25`). This is optional, for consistency.
- **I-2.** The real-Obsidian census cannot see `change` or `input` listeners: `INPUT_EVENTS` (`e2e/driver/census.ts:9`) predates this branch. The checkboxes are therefore censused by jsdom only, as `_census.e2e.ts` says.
- **I-3.** SC-640 also affects pitfalls. With two pitfalls named "Power", the first mention chip is blank (`ZJ4`, `zz-jsdom-probe.json`), from the `pitfallChips` Map (`ArgumentView.ts:63,148`). Add this to SC-640's scope; no new ticket is needed.
- **I-4.** SC-642 also happens in Live Preview: after Enter on Complete, focus is on `BODY` (ZNR-04, at head and base). SC-639 was checked in Reading view only. Note both on the tickets.
- **I-5.** Same-argument stays checked while greyed out once a motivation is appealed to (`ZJ5`). The tiers correctly ignore it, and un-appealing applies it again. This looks intended (the "why" line explains it), so it is not a bug.
- **I-6.** Nits: `integrity.e2e.ts:54` has `void root;` (an unused scope); the README rows for the bug fixtures (`wrong-name`, `fraction`, `dup-names`, `nameless`, `current-only`, `minimal`) do not cite their ticket, unlike the montage rows; the superproject worktree shows ` M draw-steel-elements` (no pointer commit yet; this is the owner's single bump).

## Product bugs (candidates; the owner files them)

**B-1 (Low, NEW). Enter on the options button opens the native menu at the window's top-left corner, not by the button.**
- **Repro:** open `Negotiation/basic.md` in Reading view. Tab to the ⋮ options button and press Enter. The menu's rect is x 2, y 2, while the button is at x 1179, y 275. A mouse click opens the menu at x 1193, y 288, beside the button (ZNR-02, `probe-results-head.jsonl`).
- **Cause:** `src/elements/negotiation/view.ts:152` calls `m.showAtMouseEvent(event)`. A click synthesised from the keyboard has `clientX` and `clientY` 0.
- **Fix shape (for the ticket):** when `event.detail === 0`, show the menu at the button's rect with `showAtPosition({ x: rect.left, y: rect.bottom })`.
- **Marker:** a knownBug on R02's Enter path asserting the menu is near the button.
- **Known tickets:** none match.

**B-2 (Low, NEW; SC-638 family: hand-typed values). An argument entry that names a motivation or pitfall the block no longer has silently drives the tiers and Complete, with no chip pressed and no way to clear it.**
- **Repro (jsdom `ZJ1` and `ZJ2`):** a block with motivations `[Peace]` and pitfalls `[Power]`.
  - With `currentArgument.motivationsUsed: [Ghost]`, the tiers show the motivation table (`-1 Patience`, `+1 Interest, -1 Patience`, …). Peace's chip is not pressed, and same-argument is greyed out "not while a Motivation is appealed to". Complete at High writes Interest 4.
  - With `pitfallsUsed: [Ghost]`, every tier is `-1 Interest, -1 Patience` and no chip is pressed.
  - Only Complete or Reset clears the hidden entry.
- **Realistic cause:** renaming or deleting a motivation in the YAML while an argument is in progress.
- **Where:** `ArgumentView.ts:103-111` (`sync` paints only the chips of motivations that exist), `:336-337` (`mountRoll` uses `usesMotivation()` and `usesPitfall()`), and `src/model/NegotiationData.ts:158-168` (both are length-based).

**B-3 (Low, NEW; may share a ticket with B-2). A hand-typed `reusedMotivation: true` with no spent motivation appealed to: the Reuse box shows unchecked and greyed out, while the tiers apply the reuse table.**
- **Repro (jsdom `ZJ3`):** `motivationsUsed: [Peace]` (Peace unspent) and `reusedMotivation: true`. Every tier reads `-1 Patience` and the Reuse checkbox is unchecked and disabled.
- **Where:** `ArgumentView.ts:294` paints `reusable && arg.reusedMotivation`, but `:340` passes the raw flag to `ArgumentPowerRoll.build`. I found no UI path into this state; `setMotivationUsed` and the chip-removal recompute keep the flag consistent. It needs hand-typed YAML or an older note.

**Known tickets reconfirmed:**
- **SC-637:** X06, X07, K01, K02 (`note_to_self` and `gm_note` dropped).
- **SC-638:** W02 `o.trim is not a function`; W03 seal 0 shown while not hostile.
- **SC-639:** Reading view, focus on `BODY` after keyboard Reset (F01 and ZNR-06).
- **SC-640:** W04 has an empty first label; W05 announces "Appeal to ".
- **SC-641:** W06 and W07 open `hostile`.
- **SC-642:** Reading view and Live Preview, `BODY` after Enter on Complete.
- **B4:** confirmed not a bug. A second Reset leaves the bytes and the mtime (1794642331269) unchanged (ZNR-05).

## What I verified, item by item
1. **Surface completeness.** I enumerated the following:
   - `view.ts`: cardHead (no listener), the options iconButton, the native Menu item's `onClick`, kit tabs (tab click, tablist keydown Left/Right/Home/End).
   - `PatienceInterestView`: two kit tracks (seal click, radiogroup keydown with 6 keys).
   - `EndBandView`: `role=status`, no listener.
   - `MotivationsPitfallsView`: a Spent chip per motivation; pitfalls are text.
   - `ArgumentView`: appeal and mention chips, three checkbox `change` listeners, a selectable powerRollPanel (row click, keydown with 6 keys), the Complete iconButton.
   - `LearnMoreView`: a static powerRollPanel, no listener.
   - Tooltips (`setTooltip`, no listener) and the framework chrome (Collapse and Expand, which the chrome manifest owns).

   Every node that has a handler carries an id, across these variants: live, spent, ended, deal, hostile, minimal, unknown-keys, Learn tab, read-only host, menu open. Every declared pair has a real handler. The only gap is M-1. I-1 lists optional extras.
2. **Censuses.** In the scratch worktree I added 3 rogues (`mut-g4census.diff`): a `<button>` with a click listener on the Argument tab, one in the standing area, and a `<div>` with a click listener.
   - Real Obsidian: CENSUS-13 and CENSUS-15 were red on all three (`mut-g4census.log`); CENSUS-14 stayed green.
   - jsdom: 11 SC-439 census tests were red on both buttons (`mut-census-jest.log`). It misses the div, which is selector-based by design.
   - The allowlists are `NEGO_IDS` (negotiation + chrome manifests) and jsdom `negotiationIds`. There is no prefix match.
   - With the `MenuItem.dom` stamp removed (M16), CENSUS-14, R03 and R04 went red.
3. **Manifest honesty and mutations.** Mutants are in `mut-g1.diff` to `mut-g3.diff` and `mut-g4census.diff`, applied by `rv2-mutate.py`. Each line gives the mutant, then the tests that went red:
   - g1:
     - patience click: P01, P03, T03, X01-X05, R01, R02 (F01 failed differently)
     - interest ArrowDown/Right: I02
     - pitfall chip: A02, A03
     - tab click: T01, T03, CENSUS-13
     - tier ArrowDown/Right: A07
     - Reset item stamp: CENSUS-14, R03, R04
   - g2:
     - motivation chip: A01, A03, A05, R01
     - lie: A04
     - Complete: A09, A11, W01 (F02 failed differently)
     - Reset `resetData`: R03, X02 (W07 "appears fixed")
     - tablist ArrowRight: T02
   - g3:
     - Spent chip: M01, M02
     - tier row click: A06, A08, A09, A11, W01, CENSUS-13
     - reuse: A04
     - menu does not open: R01-R04, X02, CENSUS-14
   - g4: same-argument: A04.

   No plain driver stayed green against the mutant aimed at its own pair. I read every NEGO test. All plain drivers assert the note (a value, or `expectNoWrite` for tabs, tiers and the menu) and the screen. None starts from the state it claims to produce. The vacuous cases are markers only (L-1).
4. **jsdom matrix.** The expectations come from a hand-written rules table (`delta()`, `negotiation-matrix.test.ts:375-386`), literal offer strings and literal tier texts. `ArgumentPowerRoll` and `NegotiationData` are not called for the expectations. The grid sizes are real: 36 + 36 click grids, 36 key grids, 36 standings, 64 combinations × tiers, 8 reset states, and 8 actions × 2 blocks. Under all simulated fixes, the 355 matrix tests stayed green; the only plain red was L-2's census test.
5. **Markers.** Today's failure text is in `e2e1-nego-out/*/error.txt` and `kmarkers-today.log` (the jsdom markers run as plain tests: 9 of 9 fail for the stated reason). Each one obeys its ledger ruling:
   - SC-638 case 1 asserts only "no raw JS error text".
   - SC-638 case 2 asserts only that the seal agrees with the ending.
   - SC-641 asserts only "not ended", never a value.
   - There is one marker per place or case.

   Simulated fixes (`mut-fixes.diff`): all 10 e2e markers report "appears fixed" and 36 of 36 plain tests stay green (`mut-fixes.log`). All 9 jsdom markers flip; the only plain red is L-2 (`mut-fixes-jest.log`). The bugs I reproduced independently are listed above.
6. **Bug hunt.** B-1, B-2 and B-3 above; I-3 and I-4 are scope notes on existing tickets. Not bugs:
   - past-scale Patience 7 shows seal 5, and clicking 5 writes nothing (`ZJ6`, display clamp, SC-379);
   - Interest wraps 0 to 5 under ArrowDown (WAI-ARIA radiogroup wrap);
   - a tier choice is dropped when the negotiation ends (documented).
7. **Product diff.** 7 `src/` files (+50/-8) plus the mock's `MenuItem.dom`.
   - Every hunk is a `control` option, a `stampControl` call, or the guarded `MenuItem.dom` stamp.
   - `stampControl` is a no-op for `undefined`.
   - No other caller of `tabs`, `track` or `powerRollPanel` (hero, roll, feature, LearnMoreView) passes the new options: grep shows none.
   - The id readers in product code: `controlFocus` / `livePreviewFocusCarry` / `windowHandoff`. They produce L-5 (a Live Preview change). Reading view is unaffected: base and head behave the same in ZNR-06.
8. **Integrity.**
   - e2e X01 to X05: second block, Reset in the second block, prose around, a hand edit, no default keys.
   - The driver's per-test check of the text outside each fence.
   - Matrix `[X]` (8 actions × 2 different blocks, real `ReadingModeBlockHost` plus FakeVault).

   An identical twin is not covered (L-4); my ZNR-01 probe shows the product handles one correctly.
9. **Scenario ids.**
   - The 43 `[NEGO-*]` ids and `[CENSUS-13..15]` are unique. origin/develop (`a5313f9d`, unmoved) stops at CENSUS-12 and has no NEGO ids.
   - In the parallel worktrees, SC-440 uses CENSUS-16 and 17, and no other worktree has NEGO ids.
   - Every id is a literal in its title (no template-literal titles). No bracketed `[SC-…]` appears in any e2e title.
   - The rebase is additive: `--numstat` shows 0 deletions in `e2eCensus.test.ts`, `_census.e2e.ts` and `e2e/README.md`, and `dse.ts` is untouched. No SC-438 line was dropped.
10. **Gates.** See below.

## Gate logs
All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-rev-r2/`. The branch worktree was clean at `99fa593a` before and after (`git status --porcelain` empty in dse).
- **tsc** `tsc.log`, rc 0.
- **lint** `lint.log`, rc 0.
- **build** `build.log`, rc 0. I rebuilt `main.js` before jest instead of deleting it.
- **jest** `jest.log`: `Test Suites: 1 skipped, 282 passed, 282 of 283 total; Tests: 1 skipped, 12512 passed, 12513 total; 90.5 s`, rc 0. Loadavg (`jest.load`) 3.26 at the start, 12.08 at the end. This equals 12133 + 379.
- **e2e run 1** `e2e1.log`: `OBSIDIAN-E2E done: 460/483 ok, 0 failed, 23 known-bug, coverage: 278/278 pairs`, rc 0, loadavg 10.6 to 10.9.
- **e2e run 2** `e2e2.log`: identical line, rc 0, loadavg 7.7 to 11.8. No flake.
- **lifecycle** `lc1.log` to `lc7.log`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc 0. `appearance.json` was clean before part 6. Part 7 ran once on a quiet host (loadavg 2.0); G-S91 and G-S115 passed on the first try. Each part had its own `DSE_CAMERA_TMP` (`camtmp-lc1` to `camtmp-lc7`).
- **shots, freeze, parity:** not re-run. No other caller passes the new kit options, freeze compares PNGs, and the implementer's f6e504c7 run (592 / 0 FAIL, 280/280, 0/0/24) predates only SC-615's initiative focus change.
- **Probe runs (scratch worktree, `--only`):**

  | Run | Log | Result |
  |---|---|---|
  | head probes | `probe-head.log` | 6/6 |
  | base probes | `probe-base.log` | 3/3 |
  | mutant group 1 | `mut-g1.log` | 16/46, 21 failed |
  | mutant group 2 | `mut-g2.log` | 25/46, 14 failed |
  | mutant group 3 | `mut-g3.log` | 21/46, 17 failed |
  | mutant group 4 + census rogues | `mut-g4census.log` | 33/46, 3 failed |
  | simulated fixes | `mut-fixes.log` | 36/46, 10 failed = the 10 markers |
  | jsdom census rogues | `mut-census-jest.log` | 11 failed / 68 |
  | jsdom simulated fixes | `mut-fixes-jest.log` | 10 failed / 432 |
  | jsdom markers as plain tests | `kmarkers-today.log` | 9 failed / 9 |
  | jsdom bug-hunt probes | `zz-jsdom-probe.log` | results in `zz-jsdom-probe.json` |

- **Probe sources:**
  - `rv2-mutate.py` (every mutant and fix), plus `mut-g1.diff`, `mut-g2.diff`, `mut-g3.diff`, `mut-g4census.diff` and `mut-fixes.diff`.
  - `zz-probe.e2e.ts.txt` and `zz-twins-fixture.md` (ZNR-01 to ZNR-06), with results in `probe-results-head.jsonl` and `probe-results-base.jsonl`.
  - `zz-review-probe.test.ts.txt` (ZJ1 to ZJ6).
  - The marker bundles from run 1: `e2e1-nego-out/`.
- **Scratch worktree:** removed with `git worktree remove --force <literal path>` (it held untracked probe files). The branch's `node_modules` is intact.

## r4

### Summary (scoped re-review of the r3 delta `03f956cc..1615843e`, rebased on develop `11fbded6`)
- **Verdict: LAND-READY.** All 10 folded r2 findings (M-1, L-1 to L-5, I-1, I-3, I-4, I-6) are in, as the owner ruled, and each one bites under mutation. There is one new LOW (r4-L1), and it does not block landing: K11, K12 and K13 assume one fix shape. Fixing it touches one jsdom file.
- **Gates at `1615843e`:**
  - tsc rc 0 and lint rc 0.
  - jest `12552 passed / 1 skipped`, 282 suites, rc 0, loadavg 5.5 to 12.1.
  - e2e (one full run) `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`, rc 0, loadavg 7.5 to 12.3. This is exactly the expected line: 235 + 52 pairs, and 54 new tests of which 13 are known-bug.
  - Lifecycle, shots, freeze and parity were not re-run: nothing I found warrants it, and the implementer's r3 run on this head covered them.
- **Rebase:** `git range-diff a5313f9d..99fa593a 11fbded6..1615843e` reads `=` for all 6 old commits, plus 3 new ones. Shared files have 0 deletions (`dse.ts` +3, `_census.e2e.ts` +51, `e2eCensus.test.ts` +144, README +15). The SC-626 focus changes are opt-in (`controlFocusRules`, `fallbacks`, `data-dse-focus-at`), and the negotiation uses none of them. No NEGO focus expectation changed; only F01's Enter is now aimed.
- **Superproject:** `6030e7cd` is the only commit over origin/main `b45a5f24` (unmoved). Its diff is the single `draw-steel-elements` gitlink, `11fbded6` to `1615843e`. Status is clean, and no commit has an AI trailer.
- **The label ids are attribute-only:** `ArgumentView.ts:271` adds `stampControl(line, …label)` and no listener. A13's clicks reach the checkbox's existing `change` listener through native label activation.

### Mutation probes of the folded findings
- **Group A** (`r4-mutA.diff`, `r4-mutA.log`):
  - The Reset menu item's `onClick` made a no-op: R01, R03, R04, R05 and X02 went red, and F01, L03 and W07 failed differently. M-1 and L-1 bite.
  - Writes redirected to the first identical twin: X08 went red. L-4 bites.
  - The modifier checkboxes' `change` listener removed: A04, A12 and A13 went red. I-1 bites.
- **Group B** (`r4-mutB.diff`, `r4-mutB.log`):
  - Patience seal click removed: X06 and X07 now fail differently (`/note_to_self/`, `/gm_note/`); in r2 they passed. L-1 bites.
  - The Live Preview carry made to always land on the card root: L01 went red ("timed out waiting for focus to settle on seal 4"). L-5 bites.
- **Simulated fixes for the new markers** (`r4-fixes.diff`):
  - e2e (`r4-fixes.log`): R06 (SC-648), L02 (SC-642) and L03 (SC-639) report "appears fixed", as do F01 and F02. All 41 plain NEGO and census tests stayed green.
  - jsdom (`r4-fixes-jest.log`): K05, K10, K11, K12 and K13 flip. The other 433 negotiation, matrix and census tests stayed green.
  - Today's failures read as stated. R06 fails `Expected: true`; the menu is at x 2, y 2 against the button at about x 1179. The other new markers fail on their own assertions.

### Findings
**r4-L1 (LOW). The SC-649 markers K11, K12 and K13 assume one fix shape, which goes against the ruling ("ONLY that the tiers shown agree with the chips / Reuse box shown — never a specific fix").**
- **Where:**
  - `test/dom/elements/negotiation-bugs.test.ts`, K11 and K12: `expect(pressed).toHaveLength(0)`.
  - The same file, K13: `expect(reuse.checked).toBe(false)`.
- **Failure scenario:** a valid fix could show what the roll counts, instead of dropping it from the roll. For example, it could paint the hand-typed Reuse flag as checked, or draw the stray entry as a pressed chip. Then the tiers agree with what is shown, but the precondition assertion still throws, so the markers never flip.
- **Probe:** fix shape (b) for B-3 (`r4-altB.diff`: the box paints `arg.reusedMotivation`, and the roll is unchanged) leaves K13 still "failing", 13 of 13 (`r4-altB-jest.log`). Fix shape (a) (`G649a-roll` in `r4-fixes.diff`: the roll counts only what is shown) flips it. K11 and K12 have the same precondition, so I judged them by reading.
- **Fix:** build the reference block from what the card shows: `motivationsUsed` from the pressed motivation chips' names, `pitfallsUsed` from the pressed mention chips, and `reusedMotivation` from `reuse.checked`. Then assert that `tiersOf(stray) == tiersOf(reference)`. Drop the `pressed` and `checked` precondition assertions. This is a test-only change to one file.

**r4-INFO-1.** The `failsWith` patterns on W03 (`/Expected: false/`) and R06 (`/Expected: true/`) are generic jest wording. They still reject a setup failure (a timeout or a TypeError), so this is acceptable. A more specific pattern would be sturdier, but it is optional.

### r4 logs
In `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-rev-r2/`:

| Log | What it is |
|---|---|
| `r4tsc.log` | tsc |
| `r4lint.log` | lint |
| `r4build.log` | build |
| `r4jest.log` / `.load` | full jest |
| `r4e2e.log` / `.load` | full e2e |
| `r4-mutA.log` | mutant group A |
| `r4-mutB.log` | mutant group B |
| `r4-fixes.log` | e2e under the simulated fixes |
| `r4-fixes-jest.log` | jsdom under the simulated fixes |
| `r4-altB-jest.log` | jsdom under the alternative fix shape for K13 |

The mutants and fixes are in `rv4-mutate.py` and the `.diff` files. The scratch worktree `mut-wt4` was removed with `git worktree remove --force <literal path>`. The branch worktree was clean at `1615843e` before and after.

## r6

### Summary (scoped re-check of the r5 fold `1615843e..8a81c5a7`: 3 test files, no `src/` change)
- **Verdict: LAND-READY.** The fold closes r4-L1 and r4-INFO-1. I have no new findings.
- **K11-K13 follow the ruling.** The precondition assertions are gone (`expect(pressed).toHaveLength(0)` and `expect(reuse.checked).toBe(false)`). Each marker now builds its reference block from what the card shows: the names on the pressed chips and the three boxes as drawn (`shownArgument`, `negotiation-bugs.test.ts:157-170`). It then asserts that the tiers shown equal the reference's tiers (`:172-193`).
- **They fail today for the stated reason.** I ran them as plain tests (`r6-k11-13-today.log`). Each fails only on the tier comparison:
  - K11: `+1 Interest` shown, `-1 Interest, -1 Patience` in the reference;
  - K12: three `-1 Interest, -1 Patience` rows against the normal table;
  - K13: three `-1 Patience` rows against the motivation table.
- **They flip under both fix shapes.** These are jsdom runs over `negotiation-bugs.test.ts`, the matrix and the census, 438 tests:
  - At head (`r6-head-jest.log`), all 438 pass.
  - With `r4-fixes.diff` applied (`r6-fixes-jest.log`), K05, K10, K11, K12 and K13 fail ("fixed"), and the other 433 pass.
  - With `r4-altB.diff` applied (`r6-altB-jest.log`), K13 fails ("fixed"), and the other 437 pass.
- **W03 and R06 fail today for the stated reason.** In `r6-head-e2e.log` (W03, R06 and R05):
  - W03 throws `the seal shown disagrees with the ending: seal 0, ending null`.
  - R06 throws `the options menu opened away from the button`.
  - R05 passes.
- **Their `failsWith` rejects a broken setup.** In `r6-setup-e2e.log`, with the menu never opening and the fraction card failing to render (`r6-setup-mut.diff`), both report "failed differently than pinned":
  - R06: `timed out waiting for the menu to open`;
  - W03: `Expected length: 1 | Received length: 0`.
- **Superproject:** `c66f631c` is the only commit over origin/main `b45a5f24` (unmoved). Its diff is the single `draw-steel-elements` gitlink, `11fbded6` to `8a81c5a7`. Status is clean and there is no AI trailer.
- **Not re-run:** the full e2e (the brief did not require it, and the fold is test-only), tsc and lint. The scratch worktree `mut-wt6` was removed with `git worktree remove --force <literal path>`. The branch worktree was clean at `8a81c5a7` before and after.
