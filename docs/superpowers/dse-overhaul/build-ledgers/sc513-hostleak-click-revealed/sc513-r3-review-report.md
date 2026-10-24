# SC-513 r3 independent review (dse `sc513-hostleak-click-revealed` @ 324a68d on c558759)

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 HIGH, 0 MEDIUM, 3 LOW (two comment/test-hygiene items, plus the dice-pin wording versus the ruling), 3 INFO. None of them blocks landing.
- origin/develop is still `c558759`. The range `c558759..HEAD` is one commit, `324a68d`. The dse tree is clean before and after the review; the superproject worktree shows only ` M draw-steel-elements`, as found.
- My shots run on 324a68d: rc 0, 592 PNGs. **All 592 sha256 match r1's f89f69f list.** Freeze OK 280/280.
- Host-leak lines match r2's report exactly. Button: 145 kinds / 870 comparisons, 28-record boundary (26 focus-visible disabled, 2 hover no-hit). Modal: 228. Input: 15 / 176. Checkbox: 7 / 116. Prose: 106 <p> [212] + 9 <img> [18] + [476].
- Leak probe (a host-only `min-height` on `.dse-rollcard .dse-btn`) plus a mount-nothing probe (the hero toggle shows its body but never mounts the card): **rc 1**, 156 named problems. Those are 144 leak lines (8 click-mounted kinds × 3 states × 3 props × 2 schemes) and 12 mount lines. The **same leak break on the base harness: rc 0**, green at 114/684. The base never mounts a result card.
- First nodes, base URL vs branch URL+mounts, measured with the sweep's own `tagButtons` / `tagInputs` / `tagCheckboxes`: **0 kinds lost and 0 first nodes moved** (section, label, w, h) in button, input and checkbox, dark and light. The new kinds all sit in the appended extra sections, except the 3 launch kinds at load.
- Jest probes on the 7 new tests: 4 deliberate breaks, **every one rc 1**, each failing the test that guards it. One test (`fixtures.test.ts:613`) guards nothing that can break (LOW-2).
- Dice pin (Addendum): **KEEP.** No sweep-reachable `fixedDice` seam exists. The pin is the same one-line mechanism, run after load in the sweep's own page. Nothing on the page that a sweep exercises depends on `Math.random`.
- Full battery on head: tsc rc 0, lint rc 0, jest 6112 passed / 1 skipped / 247 of 248 suites (rc 0). Lifecycle and e2e were not re-run, because the change is harness-only and neither reaches the harness. r2's 39/39 and 124/124 stand.

## 1. State
- dse HEAD `324a68d373de12f654ee1dc2c83c98157decad7f`, origin/develop `c558759` (not moved), `git status --porcelain` empty at start and end.
- Files changed: `visual-harness/shoot.mjs` (+213/-5), `visual-harness/entry.ts` (+31), `test/dom/visual-harness/fixtures.test.ts` (+78).
- The `visual-harness/shots/` directory is gitignored. It was put back to my clean head run's bytes after the probe runs (sha256 identical to `r3-shots-head.sha256`). `dist/` was rebuilt from the head (`npm run harness:build` rc 0).

## 2. Probes and measurements

### 2.1 Shots on head (`r3-shots-head.log`, rc 0)
- `button host-leak OK (145 button kinds × 3 states … = 870 comparisons …)`, 28 boundary records:
  - 26× `focus-visible: disabled`. These are the 10 base records (montage, negotiation, party stepper, roll Reset, roll stepper, ×2) plus 16 new ones: {feature, featureblock, statblock, hero} × {`dse-rollbar__reset|disabled`, `dse-stepper__btn|disabled`} ×2 schemes.
  - 2× hover no-hit, `initiative|dse-btn.dse-init__stamina`.
- `modal … 228 comparisons`, `input … 15 input kinds … 176`, `checkbox … 7 plugin-authored checkbox kinds … 116`, `prose … 106 bare <p> [212] + 9 <img> [18] + 7 root-inherited properties … [476]`.
- PNG identity: `diff <(sort -k2 shots-base-f89f69f.sha256) <(sort -k2 r3-shots-head.sha256)` is empty. Freeze `freeze OK (280/280 …)` rc 0.

### 2.2 The 16 new boundary records are legitimate
- Each one is a disabled control at its authored values: Reset is disabled at defaults, and the Edges/Banes "−" is disabled at 0. They have the same shape as the existing `roll|…` pair.
- The enabled versions of the same controls are compared in all three states. `X|dse-btn.dse-btn--icon.dse-stepper__btn` for feature, featureblock and statblock is a new kind tagged in the extra sections (first-node dump).
- No other boundary record appeared.

### 2.3 Can the mounts fail? (`r3-shots-probe.log`, `r3-shots-probe-violations.txt`, `r3-shots-probe.diff`)
Three temporary edits, all reverted with `git checkout --`. The tree was clean afterwards.
- **Leak L.** `styles-source.css` gets `[data-dse-theme] .dse-rollcard .dse-btn.dse-btn.dse-btn { min-height: var(--input-height, 0px) !important; }`. With no host the token is undefined (0px). The host model defines it as 30px. So only buttons inside a result card become host-sensitive, and a result card exists only after an SC-513 click (A / B).
- **Mount-nothing N.** In `hero/view.ts`, the toggle's `if (willShow && !mounted)` becomes `if (false && …)`. The body is un-hidden but the card is never mounted. r2 did not run this case: its probe removed the toggle itself, while N leaves the toggle present but empty.
- **Display only.** `failBtnHostLeak`'s `slice(0, 40)` is raised to 1000, so every line is printed.

Result: rc 1, `BUTTON HOST-LEAK VIOLATED`, 156 lines:
- N, per scheme, 6 lines:
  - `expanding the probe hero's 2 abilities left a body hidden, empty or box-less`;
  - `the sweep tagged no … button — a click-mounted control (SC-513) would go unchecked` for `hero|…dse-roll-btn`, `hero|dse-btn.dse-btn--accent`, `hero|dse-collapse__header`, `hero|…stepper__btn|disabled` and `hero|…rollbar__reset|disabled`.
- L, 9 lines per kind per scheme (rest/hover/focus-visible × `h`, `height`, `minHeight`; for example `25.0938px` without the host, `30px` with it), for exactly these kinds: `roll|dse-btn`, `roll|dse-btn.dse-btn--ghost`, `feature|dse-btn`, `feature|dse-btn.dse-btn--ghost`, `featureblock|dse-btn`, `featureblock|dse-btn.dse-btn--ghost`, `statblock|dse-btn` and `statblock|dse-btn.dse-btn--ghost`.
- `hero|dse-btn` is **not** flagged. Its first node is the hero's own button, not the result card inside the body (see INFO-1).

**Base control** (`r3-shots-baseprobe.log`): I checked out c558759's `shoot.mjs` and `entry.ts` and applied the same L break. Result: rc 0, `button host-leak OK (114 … 684 …)`, checkbox 3 kinds, prose 99. The base is green because it never tags a node inside `.dse-rollcard`. My first-node dump confirms this: base inCard = [] in all six runs, while the branch tags the 8 kinds above.

### 2.4 First nodes, base vs branch (`r3-firstnode.json`, `r3-firstnode-cmp.txt`)
- Method: `r3-extract.mjs` copies the sweep's own declarations out of the branch `shoot.mjs` verbatim (`tagButtons`, `tagInputs`, `tagCheckboxes`, `openRollModifiersForSweep`, `changeExtraRollModifierForSweep`, `withSc513Mounts`, `mountClickRevealedForSweep`, and so on). `r3-firstnode.mjs` then loads each sweep's base URL (c558759 query, no SC-513 mount) and its branch URL (`withSc513Mounts` + mount). For each tagged node it records the section index, the extra attribute, the label, w and h.
- Button: base 114, branch 145, +31 new, **0 lost, 0 moved**. Input: base 13, branch 14 (without the initiative title editor, which the dump does not open), +1 `feature|dse-stepper__input`, 0 lost, 0 moved. Checkbox: base 3, branch 7, +4, 0 lost, 0 moved. The same in dark and light, and both modes produced no problems and 0 page errors.
- New kinds sit in extra sections 32–36. The exceptions are the 3 launch kinds (`feature` / `featureblock` / `statblock` `…dse-roll-btn`), which sit in gallery sections 10, 11 and 27, unlaunched, as r1 measured.

### 2.5 No capture sends the sweep-only params
- `galleryExtra`, `withSc513Mounts`, `mountClickRevealedForSweep` and `expandHeroAbilityBodiesForSweep` are referenced only in `assertBtnHostLeak` (shoot.mjs:2551), `assertInputHostLeak` (:4496), `assertCheckboxHostLeak` (:6379) and `PROSE_SWEEP_VISITS` (:6694).
- The other `rollingEnabled` sites in `docs-manifest.mjs:556` and `entry.ts:1541-1575` are pre-existing and unchanged since c558759 (`git grep` at c558759).
- `probe-inline-abilities` appears only in `entry.ts:2176` and the sweep. Nothing references it in `obsidian-camera.mjs` or any other harness `.mjs`.
- The PNG identity in 2.1 confirms this at runtime.

### 2.6 The new tests fail when the thing they guard breaks (`r3-jest-*.log`, `r3-jest-probes.rcs`, `r3-jest-probe4.rcs`)
The file is `fixtures.test.ts`. On the clean head it passes 121/121.

| break (entry.ts, reverted) | rc | failing SC-513 tests |
|---|---|---|
| J1: `probe-inline-abilities` added to `FIXTURES.hero` | 1 | "gate-only: not a FIXTURES entry", "mounts with inline abilities", "clicking a probe-hero toggle…" |
| J2: `probeSource` returns `heroDefault` (refs unresolved) | 1 | "mounts with inline abilities", "clicking a probe-hero toggle…" |
| J3: `galleryExtra` dropped from the gallery target list | 1 | "mounts with inline abilities", "clicking a probe-hero toggle…", "feature / featureblock / statblock extras append…" (+2 SC-512 tests) |
| J4: probe hero gets only one inline ability | 1 | "mounts with inline abilities" (expects 2 toggles) |

Note: my first J4 attempt used a perl pattern that did not match, so nothing was edited and it read rc 0. I discarded it and re-ran the probe with a python replace whose application was asserted: rc 1.

### 2.7 Code quality
- Every mount uses a real Playwright `locator.click()`. There is no `evaluate(() => el.click())`. (The jsdom unit test uses `.click()`, which is correct there.)
- Waits are condition waits (`page.waitForFunction`, 5 s, timeout → named problem). There is no fixed sleep.
- Every failure string is named and says what would go unchecked.
- The helper comment (shoot.mjs:2734-2762) cites SC-513, the SC-205 rule, SC-526 as the open D gap ("NOT an exemption … fix the CSS") and SC-527.
- The order is correct: after `openRollModifiersForSweep` and SC-512's Edges "+", and before tagging, on every dark and light load. SC-512's enabled and disabled Reset assertions still hold after A rolls the extra strip.

## 3. Dice pinning (Addendum question): KEEP
- **No existing sweep-only seam.** `fixedDice` is a per-entry option of `interactionShots` manifest captures. `snap()` applies it (shoot.mjs:549-551) and so does the interaction count pass (:7987-7988). A sweep cannot reach it; it is not a URL parameter. r2's `page.evaluate(() => { Math.random = () => 0.5; })` (shoot.mjs:2855-2857) is the identical one-liner, run after load in the sweep's own page, so it never reaches a capture. PNG identity holds.
- **Nothing else on the swept page depends on it.** The bundle (`dist/harness.js`) calls `Math.random` in exactly 4 places:
  1. `NATIVE_DICE.rollDie`, the intended target;
  2. `generateAnchorId` (`src/framework/sidebar/anchor.ts:51`), reached only by Pin to sidebar, which no sweep clicks (hover is a pointer move, focus is Tab plus `focus()`);
  3. and 4. ajv-keywords `dynamicDefaults` `random` / `randomint`, which no schema here uses.
- No id or shuffle is involved. The pin cannot hide a kind: the only roll-dependent node is `.dse-rollcard__crit-note` (`rollResultCard.ts:43`), which is text, not a control. The tier never enters a button's key. Kind counts are 145 both pinned (r2, r3) and unpinned (r1). With the pin in place, no first node moved (2.4).
- Prescription: keep it. The ledger should record that the ruling's "existing seam" condition was met in spirit (the same mechanism) but not literally. Optionally, see LOW-3.

## 4. Findings

**LOW-1: a stale jsdoc on the `galleryExtra` param.** `visual-harness/entry.ts:1110-1115` still says "Only the button host-leak sweep sends it, to mount a SECOND `ds-roll` strip…". Since 324a68d the input, checkbox and prose sweeps send it too, along with the feature, featureblock, statblock and `hero:probe-inline-abilities` sections.
- Failure scenario: a future editor trusts the comment and changes `galleryExtra` semantics assuming only one caller. That would silently drop sections from three sweeps. The named FAILs would catch it, but late.
- Fix: reword it to "Only the host-leak sweeps (button, input, checkbox, prose) send it: SC-512's second roll strip and SC-513's click-mount sections. Absent on every capture URL…".

**LOW-2: one new test guards nothing that can break.** `test/dom/visual-harness/fixtures.test.ts:613` ("a capture URL (no galleryExtra, no prefs) parses to none of it") only checks that `parseParams` returns `undefined` for keys absent from a hand-written query. It cannot fail if a real capture builder in `shoot.mjs` started sending `galleryExtra` or `rollingEnabled`; the real guarantee is PNG identity plus freeze.
- Failure scenario: a reader counts it as capture-side protection that it does not give.
- Fix: drop it, or rename it to what it checks ("parseParams leaves galleryExtra/prefs undefined when absent"). Do not add a source-grep test.

**LOW-3: the dice pin is an inline copy, not a shared seam.** shoot.mjs:2855-2857 is the third inline copy of `Math.random = () => 0.5` (the others are :551 and :7988). The ruling asked for an existing seam.
- Failure scenario: a future change to the capture pin (for example a different pinned value) misses the sweep copy. The harm is only that the logs differ, but the ruling's intent ("one seam") drifts.
- Fix (optional, not land-blocking): factor out `pinDiceAfterLoad(page)` and call it from all three places. Otherwise, record the deviation in the ledger as accepted.

**INFO-1:** the controls inside the hero-body strip (Reroll/Clear, the enabled stepper) share kind keys with the hero's own controls. Their first node is the hero's own button, so the in-body copies are not compared. The probe shows this: `hero|dse-btn` is not flagged under L. They render through the same kit code that the extra feature strip's compared kinds use. This follows from the sweep's per-kind design. No action.

**INFO-2:** the input and checkbox sweeps also run mount A (the result card), which adds no input or checkbox. It is harmless (one click and one wait) and keeps one helper for all three sweeps.

**INFO-3:** dse-verify (`SKILL.md` "Button host-leak sweep" bullet and the CURRENT block) is not updated. The ledger assigns that text to the owner. The numbers to use: button 145/870 with the 28-record boundary in 2.1; modal 228; input 15/176; checkbox 7/116; prose 106 [212] + 9 [18] + [476]. Name the new helper `mountClickRevealedForSweep` / `expandHeroAbilityBodiesForSweep`, and name D (popover) as the open gap SC-526.

## 5. Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r3-rev-m4t8/`
- Head run: `r3-shots-head.sh`, `r3-shots-head.log`, `r3-shots-head.rc` (0), `r3-shots-head.sha` (324a68d), `r3-shots-head.sha256`, `r3-freeze-head.log`, `r3-freeze-head.rc` (0)
- Probe run: `r3-shots-probe.sh`, `r3-shots-probe.diff`, `r3-shots-probe.log`, `r3-shots-probe.rc` (1), `r3-shots-probe-violations.txt`, `r3-shots-probe.notes`
- Base control: `r3-shots-baseprobe.sh`, `r3-shots-baseprobe.diffstat`, `r3-shots-baseprobe.log`, `r3-shots-baseprobe.rc` (0), `r3-shots-baseprobe.notes`, `r3-shots-restored.sha256`
- First nodes: `r3-extract.mjs`, `r3-helpers.mjs`, `r3-firstnode.mjs`, `r3-firstnode.sh`, `r3-firstnode.json`, `r3-firstnode-cmp.py`, `r3-firstnode-cmp.txt`
- Jest probes: `r3-jest-probes.sh`, `r3-jest-probes.rcs`, `r3-jest-probe4.sh`, `r3-jest-probe4.rcs`, `r3-jest-J0-clean.log`, `r3-jest-J1-probe-in-FIXTURES.log`, `r3-jest-J2-probe-returns-unresolved-hero.log`, `r3-jest-J3-galleryExtra-dropped.log`, `r3-jest-J4b-one-ability-only.log` (the stale `r3-jest-J4-one-ability-only.log` is the no-op attempt)
- Static/jest: `r3-static.sh`, `r3-harness-build.rc`, `r3-tsc.log`/`.rc`, `r3-lint.log`/`.rc`, `r3-jest-full.log`/`.rc`, `r3-static.status` (empty)
- `shots-head-backup/` (a copy of the clean head run's shots/, used to restore it)

## r4 re-review (delta 324a68d..ed368f6, scoped)
- **Verdict: LAND-READY**, 0 findings. dse HEAD is `ed368f6`, still on c558759, and the tree is clean.
- The `git diff 324a68d ed368f6` contains only the two folded changes (2 files, +11/-8):
  - `visual-harness/entry.ts:1109-1118`: the `galleryExtra` jsdoc now names the button, input, checkbox and prose sweeps, both the SC-512 and SC-513 sections, and the gate-only probe hero. Every claim matches the code.
  - `test/dom/visual-harness/fixtures.test.ts:613`: the test is renamed to "absent galleryExtra and prefs keys stay undefined", with the body unchanged.
- Gates on ed368f6: `npm run tsc` rc 0 (no output), and `fixtures.test.ts` passes 121/121 (rc 0), the same count as before the rename.
- Spot-check of r4's evidence:
  - `main.js` (b5a41fcc…) and `styles.css` (ae45354b…) are identical in `r4-build-old.sha` and `r4-build-new.sha`. The scripts do not record the commit they were built at. This is also guaranteed structurally, because the delta touches no `src/` file and no CSS.
  - The sha256 in `r4-shots.sha256` matches the f89f69f list (diff empty). `r4-shots.rc` is 0, `r4-freeze.rc` is 0, and the freeze log reads 280/280.
- Evidence: scratch `sc513-r3-rev-m4t8/` files `r4rev-gates.sh`, `r4rev-head.sha`, `r4rev-tsc.{log,rc}`, `r4rev-jest-fixtures.{log,rc}`, `r4rev.status` (empty).
