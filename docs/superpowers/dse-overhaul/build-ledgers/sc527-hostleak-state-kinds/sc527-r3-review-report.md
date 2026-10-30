# SC-527 r3 independent review (dse `sc527-hostleak-state-kinds` @ 369b3a3 on 71437da)

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 HIGH, 0 MED, 2 LOW (both comment-only), 4 INFO. None blocks landing.
- origin/develop is still `71437da`. The range is 2 commits, `044dd8e` and `369b3a3`, touching only 3 files (`shoot.mjs`, `entry.ts` comment, `fixtures.test.ts`). No `src/`, no capture path, no freeze file. The dse tree and the superproject were clean / ` M draw-steel-elements` before and after the review, unchanged.
- Shots on head: rc 0, **592 PNGs, all sha256 identical** to r1's base list, freeze 280/280. Button 157 / 942 with a 34-record boundary (28 base + 6 new legitimate `focus-visible: disabled`). Modal 228, input 15/176, checkbox 7/116, prose 106 [212]: all as expected.
- Leak probe: a host-only rule on the SC-527 states only. **Head rc 1, 192 problems on exactly the 12 `SC527_EXPECT` kinds** (0 others, 0 missing). **The same rule on the 71437da harness: rc 0**, green at 145/870. The gap was real.
- State-not-reached probe: (a) a click that lands on the section h2 and changes nothing, and (b) a later click that undoes a reached state. **rc 1, with exactly 6 named lines.** The sweep stayed in step on the real run: 0 of 157 tagged nodes changed key during the bare+host passes, dark and light. I found no vacuity path.
- First nodes, base URL vs branch URL+states, measured with the sweep's own tag functions: **0 kinds lost, 0 first nodes moved** (button, input and checkbox, dark and light). All 12 new kinds sit in SC-527 sections 37–42.
- Jest: 7 breaks. **6 each fail exactly one SC-527 test (rc 1)**, so all 5 tests guard something. J7, a break in the runtime helper logic, stays green in jest; the browser can-fail covers it (INFO-2).
- SC-526 rebase: simulated SC-526 (pref plus pips click at the END of `mountClickRevealedForSweep`, 2 placements) merges with **0 conflicts**. At runtime the popover opens after SC-527's clicks and stays open (1 popover, 3 visible buttons), and 159 keys are tagged with 0 problems. SC-527 adds no pref and never clicks the pips.
- Built `main.js`/`styles.css` are byte-identical at 71437da and 369b3a3, so r2's lifecycle 40/40 and e2e 124/124 carry. tsc rc 0, lint rc 0, jest 6132 passed / 1 skipped / 247 of 248 (rc 0).

## 1. State
- dse HEAD `369b3a3eb7da87b929c1833e9503eebccbbe15c1`; `git fetch origin` → origin/develop `71437da6a2711b1d6fb9c22d88aa0ea6891e6fc1` (not moved).
- `git status --porcelain` was empty at the start and at the end. The superproject `3eca7d31`, ` M draw-steel-elements`, was also unchanged (`pre-state.txt` = `post-state.txt`).
- Every probe edit was reverted with `git checkout HEAD -- visual-harness/shoot.mjs`, and each `*.after-status` file is empty.
- The jest protocol removed the gitignored build outputs. I rebuilt them (`build-no-check`), and `main.js`/`styles.css` match the pre-review sha256.
- `visual-harness/shots/` holds the head bytes again (sha list = `r3-shots-head.sha256`).

## 2. Findings

**LOW-1: the SC-527 hero section also answers to SC-513's `[data-dse-harness-extra="hero"]`.**
- Where: `shoot.mjs:2950` (`SC527_EXTRA` last entry `hero`) against SC-513's `sec('hero')` / `const hero` at `shoot.mjs:2832`, `:2857`, `:2895`, `:2904` and the Modifiers `:is(…)` at `:2911`. In the button sweep that selector now matches two sections: 36 (the probe hero) and 42 (SC-527's hero).
- Measured harmless today. Section 42 has 0 ability toggles, 0 bodies and 0 roll strips before and after the SC-513 mounts (`r3-firstnode-head.json` layout). So SC-513's toggle count, body wait and `inner.first()` see only the probe hero.
- Failure scenario: SC-526 or a later helper addresses "the hero extra" by `[data-dse-harness-extra="hero"]`, for example `… .dse-stamina-rec__pips`. Both sections carry one pips row, so the locator resolves to 2. That gives a strict-mode error or a count≠1 FAIL (loud), or with `.last()` it silently drives SC-527's post-Respite hero. SC-526's actual prototype uses `.dse-harness-section:not([data-dse-harness-extra]) [data-dse-element="hero"]`, so it is unaffected (proved in 3.6).
- Fix (comment only, optional): add one line to the SC-527 block at the hero entry (`shoot.mjs:3003-3010`): "this section shares `data-dse-harness-extra="hero"` with SC-513's probe hero, so in the button sweep that attribute selector matches two sections. Address the probe hero by its index or contents, and the gallery hero by `:not([data-dse-harness-extra])`."

**LOW-2: the `beyondTicket` doc wording is stale.** `shoot.mjs:2949` says "(owner rules on them)". The owner ruled FOLD on 2026-10-24.
- Failure scenario: a reader thinks the 3 beyond-ticket states are still provisional and drops them.
- Fix: "(owner ruled: fold, SC-527 r1)". The flag is data-only: no code reads `beyondTicket`, which is fine.

**INFO-1: the reach check is immediate, not a condition wait.** `reachStateKindsForSweep` evaluates the `reached` selectors (`shoot.mjs:3069`) straight after the last click. SC-513's mounts use `sc513WaitFor` (5 s) instead.
- It is stable in every run so far: r1 3, r2 2+, r3 3 runs × 2 schemes, 0 false FAILs. The views repaint synchronously on click.
- A future async repaint could only make it go falsely red, never falsely green.
- Optional hardening: replace the immediate evaluate with `page.waitForFunction` and a 5 s timeout, which gives the same named line.

**INFO-2: the jest tests guard data and seams, not the runtime helper body.** J7 removed both named-FAIL paths (`assertSc527Tagged` and the `unmet` filter) and jest stayed rc 0, 126/126. Only the browser run guards that logic, and probe 3.3 proves it fails by name. This is the same split as SC-513, so no action is needed.

**INFO-3: dse-verify (CURRENT and the "Button host-leak sweep" bullet) is not updated.** That text is the owner's job per the ledger. Numbers to use:
- button 157 / 942, 34-record boundary: 32 `focus-visible: disabled` + 2 hover no-hit `initiative|dse-btn.dse-init__stamina`. The new boundary kinds are `hero|dse-btn|disabled`, `montage|dse-btn.dse-btn--accent|disabled` and `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled`, ×2.
- modal 228, input 15/176, checkbox 7/116, prose 106 [212] + 9 [18] + [476], freeze 280/280.
- Helpers: `withSc527States` / `reachStateKindsForSweep` / `assertSc527Tagged`, button sweep only.

**INFO-4: SC-530's `aria-checked` key gap is cited in the comment block and stays out of scope.** The hero stepper `|disabled` kind stays compared via SC-513's probe-hero node, as ruled. It is absent from `SC527_EXPECT`, and test 5 guards that (J6).

## 3. Probes and measurements
Scratch (all evidence): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc527-r3-a864fe80ab0735510/`

### 3.1 Static gates and build identity
- `devbox run -c <dse> -- bash r3-gate.sh tsc npm run tsc` → rc 0. `… lint npm run lint` → rc 0.
- `r3-jest.sh` (rm main.js/styles.css, `npx jest`, load 9.57) → rc 0: `Tests: 1 skipped, 6132 passed, 6133 total`, `Test Suites: 1 skipped, 247 passed, 247 of 248 total`.
- `r3-buildcmp.sh`:
  - `build-no-check` at head, then with the 3 changed files checked out at 71437da (`git diff --stat 71437da` empty, so the tree is byte-identical to the base), then restored;
  - `BUILD IDENTICAL`: main.js `e4872533…`, styles.css `ae45354b…`, both times.
  - So lifecycle and e2e were not re-run, and r2's 40/40 and 124/124 0 known-bug 87/87 carry.

### 3.2 Shots on head (`r3-shots.sh head`, 21:49–22:00)
- rc 0, 592 PNGs. `diff <(sort -k2 …/sc527-r1-abb0c6465158755e8/shots-base.sha256) <(sort -k2 r3-shots-head.sha256)` is empty. 0 FAIL lines. `freeze OK (280/280 …)` rc 0.
- `button host-leak OK (157 button kinds × 3 states … = 942 comparisons …)`, 34 records:
  - 32× focus-visible disabled. These are the 28-record base's 26 plus the 6 new ones: `hero|dse-btn|disabled`, `montage|…accent|disabled` and `montage|…rowact|disabled`, ×2.
  - 2× hover no-hit stamina.
- **The new boundary records are legitimate.** Each is a control the SC-527 click disabled on purpose: Catch Breath at full Stamina after Respite, Log an action… after every hero acted, and the board row actions on a completed montage. A disabled button cannot take focus. The `.dse-btn` shape is the same as the existing `montage|dse-btn|disabled` and `negotiation|dse-btn|disabled`, and the rest and hover states are still compared. The 3.3 leak probe hits all three kinds with 18 lines each, so they are really sampled.
- modal 228, input 15 / 176, checkbox 7 / 116, prose `106 bare <p> [212] + 9 <img> [18] + 7 root-inherited properties … [476]`.

### 3.3 Leak probe, head vs base (`r3-apply.py`, `r3-probe.sh`)
- Rule appended to `injectHostCss`'s host sheet (host-only, keyed on STATE, not on section): `.dse-init__turn[aria-pressed="true"], .dse-init__portrait-toggle[aria-pressed="true"], .dse-init__action-toggle[aria-pressed="true"], .dse-init__cell[aria-pressed="true"], .dse-nt__chip[aria-pressed="true"], .dse-nt__chip.is-spent, .dse-nt__complete .dse-btn--accent:not(:disabled), .dse-btn--accent[aria-label="Log an action…"]:disabled, .dse-btn--danger[aria-label="Clear all"], .dse-mt__board-rowact:disabled, button[aria-label^="Catch Breath"]:disabled { min-height: 41px !important; }`. Display only: `failBtnHostLeak` `slice(0,40)` → 5000.
- **Head (`r3-shots-leak.*`)**:
  - rc 1, `BUTTON HOST-LEAK VIOLATED`, 192 lines (`r3-leak-violations.txt`, parsed in `r3-leak-summary.txt`).
  - The 12 kinds and their line counts:
    - 18 lines each: `hero|dse-btn|disabled`, `initiative|…init__turn|pressed|aria-pressed:true`, `initiative|…action-toggle|pressed|aria-pressed:true`, `montage|…accent|disabled`, `montage|…--danger`, `montage|…rowact|disabled`, `negotiation|dse-btn.dse-btn--accent`, and the three `negotiation|…optchip` chip kinds;
    - 6 lines each (minHeight only, because they are taller than 41 px): `initiative|…init__cell|pressed…` and `…portrait-toggle|pressed…`.
  - Flagged and not expected: **[]**. Expected and not flagged: **[]**.
  - Props: h 60, height 60, minHeight 72. PNGs identical, freeze 280/280.
- **Base (`r3-shots-leakbase.*`, 71437da `shoot.mjs` + the same rule)**: rc 0, `button host-leak OK (145 … 870 …)`, boundary 28. Every later line is green: modal 228, input 15/176, checkbox 7/116, prose 106 [212]. PNGs identical, freeze 280/280. The base sweep never reaches these states, so the leak was invisible to it.

### 3.4 State-not-reached and vacuity
- **Probe (`r3-shots-notreached.*`)**:
  - (a) montage `clicks: [['button.dse-mt__quick',0]]` → `[['h2',0]]`. This is a real click that lands on the section heading and changes nothing.
  - (b) After `reachStateKindsForSweep`, one real click on the initiative section's pressed Main action toggles it back off. That happens after its reach assertion passed and before tagging.
  - Result: rc 1, exactly 6 lines (×dark/light):
    - `SC-527 montage: log a success … — the state was not reached: nothing in the extra montage section matches \`button.dse-btn.dse-btn--accent[aria-label="Log an action…"]:disabled\``
    - `the sweep tagged no \`initiative|dse-btn.dse-init__action-toggle|pressed|aria-pressed:true\` button — …`
    - `the sweep tagged no \`montage|dse-btn.dse-btn--accent|disabled\` button — …`
  - So a state lost after its reach check is still caught, by the post-tag key check.
- **Drift during the sweep**:
  - The 3.3 head run carried an instrument after `sweepTaggedButtons`, which re-derives every tagged node's key from its live DOM: `SC527-R3-DRIFT dark: 0 of 157 …`, `light: 0 of 157`.
  - `r3-firstnode.mjs` drove hover and focus over all nodes twice and waited 3 s: drift [] at both points.
  - So no state reverts between tagging and comparison, and no pass samples the wrong state.
- **Vacuity analysis, no path found.**
  - The "already in state at load" case is guarded by test 3 (J4 proves it), and the browser `reached` check would then see the clicked-out state.
  - A click that times out gives a named line and skips that section's reach check, but `assertSc527Tagged` still names every missing key.
  - A gallery node that already held a key would only mean the kind was already compared. On base none of the 12 exists (3.5).
  - The tail check FAILs by name if the last 6 extras are not `SC527_EXTRA` in order.

### 3.5 First nodes (`r3-extract.mjs`, `r3-firstnode.mjs`, `r3-firstnode.sh`, `r3-fncmp.py` → `r3-firstnode-cmp.txt`)
- Method (SC-513 r3): copy the declarations VERBATIM from `git show 71437da:visual-harness/shoot.mjs` (base) and from 369b3a3 (head, plus the 6 SC-527 decls), on the same built bundle. Load each sweep's own URL, run its pre-tag steps and its own `tagButtons`/`tagInputs`/`tagCheckboxes`, and record section, extra, label, w and h per kind.
- Button: base 145, head 157, +12 new, **0 lost, 0 moved**, dark and light. Input 15 = 15 and checkbox 7 = 7: 0 lost, 0 moved. 0 page errors, 0 problems in either mode.
- New kinds' first nodes: initiative ×4 @37, negotiation ×3 @38, negotiation `is-spent|pressed` @39, montage `accent|disabled` @40, montage `danger` / `rowact|disabled` @41, `hero|dse-btn|disabled` @42 ("Catch Breath: Already at maximum Stamina").

### 3.6 SC-526 rebase-friendliness (`r3-sc526sim.py`, `r3-sc526-merge.txt`, `r3-sc526rt.*`)
- **What SC-527 changes:** the diff hunks are `shoot.mjs` @2551/@2560 (the URL wrap), @2575 (+2 lines, the call), @2592 (+1 line, the assert) and @2923 (+158 lines, a new block after the closing `}` of `mountClickRevealedForSweep`). It does not touch `SC513_PREFS`, `withSc513Mounts` or the body of `mountClickRevealedForSweep`. `withSc527States` sets only `galleryExtra`, so no pref is added. No SC-527 click targets `.dse-stamina-rec__pips`.
- **Textual merge:** SC-526 was simulated on 71437da: `staminaRecoveryPopover:true` was added to `SC513_PREFS`, and the prototype's pips click (`:not([data-dse-harness-extra])` gallery hero, count === 1) was placed at the END of `mountClickRevealedForSweep`, (A) before the park comment and (B) after the final `mouse.move`. Then `git merge-file` was run with SC-527's `shoot.mjs`: **0 conflicts** for A and for B.
- **Runtime (merge B helpers, the button-sweep URL and steps):** `prefs=authoringControls:true,rollingEnabled:true,staminaRecoveryPopover:true`. At tag time there is 1 popover with 3 visible buttons, in gallery section 12. 159 keys are tagged (157 + `hero|dse-stamina-rec__pop-btn` / `-cb`), with 0 SC-513 or SC-527 problems, dark and light. SC-527's clicks all happen before the popover opens and leave no late effect (drift above), so they cannot close it.

### 3.7 Jest probes (`r3-jbreak.py`, `r3-jbreaks.sh`, `r3-jbreaks.rcs`, `r3-jest-J*.log`)
`fixtures.test.ts` passes 126/126 when clean (J0). Each break was asserted to apply once, run, and reverted with `git checkout`; the tree was clean afterwards.

| break | rc | failing test |
|---|---|---|
| J1 `withSc527States` drops `.filter(Boolean)` (leading comma) | 1 | "withSc527States appends the six sections LAST …" |
| J2 a second call site in the input sweep | 1 | "only the button sweep sends the SC-527 sections: one call site …" |
| J3 `reachStateKindsForSweep` moved after `tagButtons` | 1 | same order test |
| J4 hero reach selector loses `:disabled` (true at load) | 1 | "every click target exists … no reach-assertion is already true at load" |
| J5 negotiation spent click `#1` → `#0` (lands, does not reach) | 1 | "the sweep's click sequence reaches every asserted state …" |
| J6 hero stepper key added to `SC527_EXPECT` | 1 | "the expected kind keys are the 12 state-only kinds …" |
| J7 both runtime named-FAIL paths disabled | **0** | none (INFO-2; browser probe 3.4 covers it) |

## 4. Evidence index (scratch dir above)
- State: `pre-state.txt`, `post-state.txt`, `pre-build.sha`
- Static gates and builds:
  - `r3-gate.sh`, `r3-tsc.{log,rc}`, `r3-lint.{log,rc}`
  - `r3-jest.sh`, `r3-jest.{log,rc,load,head}`
  - `r3-buildcmp.sh`, `r3-buildcmp.out`, `r3-build-{head,base}.{log,sha}`, `r3-rebuild.{log,rc}`
- Shots:
  - `r3-shots.sh`
  - head run: `r3-shots-head.{log,rc,sha256,count,head,status,diff,start,end}`, `r3-freeze-head.{log,rc}`
- Probes:
  - scripts: `r3-apply.py`, `r3-probe.sh`, `dry/` (dry-run copies and diffs)
  - leak on head: `r3-shots-leak.*`, `r3-freeze-leak.*`, `r3-leak-violations.txt`, `r3-leak-summary.txt`
  - leak on base: `r3-shots-leakbase.*`, `r3-freeze-leakbase.*`
  - not-reached: `r3-shots-notreached.*`, `r3-freeze-notreached.*`
  - logs: `r3-apply-*.log`, `r3-probe-*.after-status`, `r3-probe-*.devbox.log`
- First nodes:
  - scripts: `r3-extract.mjs`, `r3-firstnode.mjs`, `r3-firstnode.sh`, `r3-fncmp.py`
  - inputs: `r3-shoot-71437da.mjs`, `r3-shoot-369b3a3.mjs`, `r3-helpers-{base,head}.mjs`
  - outputs: `r3-firstnode-{base,head}.json`, `r3-firstnode.log`, `r3-firstnode-cmp.txt`
- SC-526: `r3-sc526sim.py`, `r3-sc526sim-{A,B}.mjs`, `r3-merge-{A,B}.mjs`, `r3-sc526-merge.txt`, `r3-sc526rt.{mjs,sh,log,json}`, `r3-helpers-merge-B.mjs`
- Jest probes: `r3-jbreak.py`, `r3-jbreaks.sh`, `r3-jbreaks.rcs`, `r3-jbreaks.after-status`, `r3-jest-J0-clean.log`, `r3-jest-J{1..7}.{log,apply}`

## r4 scoped re-review (delta 369b3a3 -> 4f73043, rebased onto 9be397e)
- **Verdict: LAND-READY, 0 findings.** dse HEAD `4f73043`, origin/develop `9be397e` (not moved after fetch). Tree clean before and after; the superproject shows only ` M draw-steel-elements`.
- (1) `git range-diff 71437da..369b3a3 9be397e..48f6671`: `044dd8e = c39e314`, `369b3a3 = 48f6671`. The rebase changed nothing in either reviewed commit.
- (2) `4f73043` touches `visual-harness/shoot.mjs` only, +13/-5, and contains exactly LOW-1, LOW-2 and INFO-1 as ruled.
- (3) INFO-1's wait cannot go falsely green. (4) `node --check` rc 0, tsc rc 0, SC-527 describe 5/5 rc 0. (5) Builds are byte-identical (main.js `9c3f3fcc…`, styles.css `ae45354b…`). No shots re-run was needed.

### Detail
- **(1) Upstream since 71437da** (`71437da..9be397e`): `src/authoring/FormModal.ts`, `src/elements/hero/view.ts`, `src/framework/chrome/focusHandoff.ts`, `src/framework/pipeline.ts`, two jest files and `obsidian-lifecycle.mjs`. No `shoot.mjs` or `entry.ts` change.
  - The hero/view.ts hunk only passes a form opener to Edit definition (`formOpenerOf(evt)`). It does not touch Respite or Catch Breath, the state the SC-527 hero section relies on.
  - r2's r4 shots on 4f73043: rc 0, button 157/942. Its PNG list `r4/shots-r4.sha256` (592) equals my r3 head list.
- **(2) The r4 diff, hunk by hunk:**
  - LOW-2, `shoot.mjs:2949`: the text is now `(owner ruled: fold, SC-527 r1)`, the reviewer's fix verbatim.
  - LOW-1, `shoot.mjs:3007-3009`: three comment lines at the hero entry. They say the section carries `data-dse-harness-extra="hero"` (SC-513's probe-hero attribute), that the selector therefore matches two sections in the button sweep, that this section has no ability toggles, bodies or roll strips, and that it should be addressed by `data-dse-harness-index` or the probe id, never by the attribute alone.
  - INFO-1, `shoot.mjs:3072-3080`: the immediate `page.evaluate` is replaced by a `page.waitForFunction` (5 s) on `sels.every(… length > 0)`. On catch it falls back to `unmet = evaluate(unmetNow)`, and the named problem text is unchanged.
  - Nothing else changed.
- **(3) Why the wait cannot go falsely green:**
  - The `try` path leaves `unmet = []` only when `waitForFunction` resolved, and it resolves only when the predicate returned true, that is, when every `reached` selector matched in the section.
  - Any rejection (timeout or a page error) goes to `catch`, which re-reads the live DOM and names each still-unmet selector.
  - If a state lands in the gap between the timeout and the re-read, the list is empty, but the state then truly exists, so that is not false green.
  - An invalid selector makes the predicate throw. The re-read throws the same SyntaxError, which nothing catches, so the sweep dies loud.
  - `assertSc527Tagged` still runs after tagging, independently of this check.
  - r2's never-matching-selector probe (`r4/canfail-reach.diff`: `…:disabled.never-reached`, log `r4/shots-canfail-reach.log`) shows exactly the named `the state was not reached … \`button[aria-label^="Catch Breath"]:disabled.never-reached\`` line, dark and light (log lines 636-637), under `BUTTON HOST-LEAK VIOLATED`. No "tagged no" line appears, which is correct: the real state was reached and its key tagged.
- **(4) Gates on 4f73043:**
  - `node --check visual-harness/shoot.mjs` rc 0 (`r3-r4-nodecheck.{log,rc,head}`).
  - `npm run tsc` rc 0 (`r3-r4-tsc.{log,rc}`).
  - `npx jest test/dom/visual-harness/fixtures.test.ts -t "SC-527"`: `Tests: 121 skipped, 5 passed, 126 total`, rc 0 (`r4-jest.{log,rc,head}`). The literal regex still parses `SC527_STATES` with the new comment lines.
- **(5) Builds** (`r4-buildcmp.sh`): `build-no-check` at 4f73043, then with the 3 SC-527 files checked out at 9be397e (`git diff --stat 9be397e` empty), then restored and rebuilt. `BUILD IDENTICAL`: main.js `9c3f3fcc37726f56…`, styles.css `ae45354b6369168e…`, both times. These match r2's `r4/hash-{head,base}.txt`. The worktree's `main.js`/`styles.css` are restored to their pre-check hashes (`r4-pre-build.sha`).
- **Evidence:**
  - in my scratch dir `sc527-r3-a864fe80ab0735510/`: `r4-range-diff.txt`, `r4-commit.diff`, `r3-r4-nodecheck.*`, `r3-r4-tsc.*`, `r4-jest.sh`, `r4-jest.{log,rc,head}`, `r4-buildcmp.sh`, `r4-buildcmp.out`, `r4-build-{head,base,restore}.log`, `r4-build-{head,base}.sha`, `r4-pre-build.sha`;
  - in r2's `sc527-r2-impl/r4/`: `canfail-reach.diff`, `shots-canfail-reach.log`, `shots-r4.sha256`, `hash-{head,base}.txt`.
