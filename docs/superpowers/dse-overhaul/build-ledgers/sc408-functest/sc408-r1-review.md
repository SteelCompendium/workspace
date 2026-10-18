# SC-408 R1 review: the functional-test pilot (DSE `be4f002..52f0099`)

**Executive summary**
1. Verdict: **a small fix round is needed.** There is no HIGH finding and the suite is not vacuous. Two MEDIUM findings: a real flake in RECOV-R06, and `it.skip` silently dropping a scenario from the tally. Fold them into the fix round the ledger already plans (N1 becomes `knownBug('SC-431')`).
2. Counts: HIGH 0 · MEDIUM 2 · LOW 7 · INFO 5.
3. Mutation probes: **32 of 32 realistic mutations were caught by at least one layer.** e2e caught 27/32 and jest caught 28/32. Four were caught by e2e only: Escape writes, the creature modal opened as a hero, swapped arrow keys, and a CSS click shield over the bar. Five were caught by jest only: Damage no longer capped at the floor, the marker boundary, the adoption blur guard, initial focus (an equivalent mutant in real Obsidian), and Reset not returning a pending Recovery. **None escaped both layers.**
4. Gate bite, all proven and reverted:
   - The jsdom census and the real census both fail on an un-id'd button and on an id missing from the manifest.
   - The exercised-set gate exits 1 on a dropped scenario (`undo.action x click`) and on a new manifest kind (`sedit.full-heal x dblclick`).
   - Locally fixing B4 and B9 flips the e2e markers (`appears fixed`) and the jest `test.failing` markers (5 tests).
5. Battery (my runs):
   - tsc and lint clean.
   - jest 4666 passed / 1 skipped / 224 of 225 suites.
   - lifecycle 25/25 on port 9308.
   - e2e 60/67 ok + 7 known-bug, 0 failed, coverage 47/47. Wall time 32.4 s and 31.5 s on 4 shards; 53.9, 55.8 and 56.1 s under a parallel `npx jest` (load 11 to 18), all green.
   - shots 568, 0 FAIL. freeze 274/274. parity 0 / 0 / 24.
   - These match the authors' numbers.
6. Safety:
   - Obsidian windows appeared on the private `:200` only, 0 on `:1` (checked by `_NET_WM_PID`).
   - SIGINT to run.mjs, and SIGINT to its whole process group, each left 0 survivors (no Xvfb, chromedriver or Obsidian).
   - `package-lock.json`: 0 of 761 existing packages changed.
7. Worktrees are byte-clean. DSE `git status --short` is empty. The superproject shows only ` M draw-steel-elements`, the uncommitted pointer bump to `52f0099` that was already present before I started; untouched.

---

## Findings

### MEDIUM

**M-1. RECOV-R06 is flaky (2 of 42 full runs, about 5%). The cause is a stale undo toast from an earlier test.**
- Where: `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:56-65` (`:60` `dse.click(dse.control('undo.action'))`, `:61` waits for the toast to go). Also `e2e/driver/cleanup.ts:35-39` (`closeEverything` never clears `.notice`s) and `e2e/driver/dse.ts:185-187` (`control()` takes the first page-wide match).
- What happened: it failed twice during mutation runs whose mutation cannot reach that path (M15 bar repaint, M17 Damage floor). Both failures took 8.4 s, which is `UNDO_NOTICE_MS` = 8000 plus setup, and the page events show only the Catch Breath write. So the Undo click never reached the current toast, and the toast expired on its own.
- Root cause, proven with a probe spec (deleted):
  - RECOV-R01's toast is still alive when R06 runs, because notices outlive `openNote`.
  - When R06's Catch Breath posts a new toast, `liveUndo.hide()` fades the old one out. For about 150-200 ms both are in the DOM.
  - The OLD toast is the first match for `[data-dse-control="undo.action"]` (probe: `actions=2 firstIsNewest=false`, opacity 0.64 then 0.001).
  - The new toast slides from top 121 to 98 to 57 px while the old one collapses.
  - wdio clicks the dying stale node, or the moving target. The wait at `:61` then passes when the toast expires after 8 s, so the failure only shows at the note assertion.
- R06 is the only driver of `undo.action x click`, so this flake also sits on a coverage pair.
- Fix:
  1. `closeEverything()` dismisses every `.notice` and waits for the count to reach 0, so notices never cross tests.
  2. Resolve the Undo inside the newest notice, and wait until its rect is stable for two frames before clicking.
  3. After the click, assert the toast is gone within about 1 s with a distinct message (not the 15 s default that accepts expiry). Use `dse.waitForWrite` and check the count is 1.
  4. Optionally add a leftover-notice check to the invariants.

**M-2. `it.skip` / `xit` silently removes a scenario. The run stays green with a smaller denominator.**
- Where: `e2e/run.mjs:103` (`TITLE_RE` matches only `it(` / `knownBug(`), `:516-525`. Mocha pending tests get no `afterEach`, so no result line is written.
- Proven: I changed `it('[INIT-STAM-E21]'` to `it.skip(` and ran `--element=initiative`. Result: `done: 6/7 ok, 0 failed, 1 known-bug`, exit 0, with no mention of the skip. The file has 8 tests.
- In a full run the gate stays green too, because E21's pair is also driven by E10. This contradicts the guarantee stated at `run.mjs:516-517`: "an id that was expected but never reported is a failure, never a silent skip".
- Fix:
  - Pre-scan for `\b(it|describe|knownBug)\.(skip|only)\(` and `\bx(it|describe)\(`, and make a full run fail as a usage error (exit 2), or count pending tests from the reporter as failures.
  - Print a `K skipped` field in the done line.
  - `describe.skip` already shows up loudly as "did not run". `it.only` does too, because its siblings go missing.

### LOW

**L-1. Four of the seven `failsWith` pins are loose enough to absorb unrelated regressions.**
- Where: `stamina-modal.e2e.ts:78` `/Lose 25 Stamina/`, `stamina-modal-stepper.e2e.ts:71` `/Gain 5 Stamina/`, `stamina-recoveries.e2e.ts:53,215` `/disabled/i`, `initiative/stamina-entry.e2e.ts:151` `/50\/60/`.
- The expected text appears in any `toHaveText` mismatch message. So for D09 and S08, any wrong Apply label counts as "the known bug".
- In INIT-STAM-B2, `/50\/60/` also matches the earlier cell assertion at `:148`. A cell-repaint regression inside B2 would be recorded as known-bug. Today E20 independently pins the cell repaint, so nothing escapes, but the pin is not doing its job.
- Mutations M01 and M03 did make B2 "fail differently", because the write itself changed.
- Fix: give each bug assertion a unique `message:` and pin on that, as STAM-S13 does (`/first click on Apply should apply/`).

**L-2. The exercised-set accounting can be satisfied without real driving.**
- `press(key, target)` records `press:<key>` against `target` without checking focus (`e2e/driver/dse.ts:303-307`). For example, `modal.close x press:Escape` is recorded while focus is in the Apply box.
- `blur()` records `blur` without checking that the control had focus (`:278-283`).
- `click()` records before acting (`:237`). A knownBug whose fn throws AT the click still counts the pair.
- No current pair depends on these. I checked a green run's `coverage.json`: no pair is driven only by known-bug tests, and 21 pairs have a single driver.
- Fix:
  - For DSE ids, `press()` asserts `document.activeElement` is inside the target; allow an explicit `aimedAt` pseudo-target for host ids.
  - Record after the action resolves.
  - Make the gate require at least one non-known-bug driver per pair.

**L-3. The "notes intact outside their blocks" invariant masks every fence, not just the target block.**
- Where: `e2e/driver/invariants.ts:18-44`, which replaces all fences with placeholders.
- A write landing in a sibling block of the same note is invisible to it, and no pilot fixture has two blocks. Lifecycle G-S7a/b covers identical twins at the framework level, but the pilot's own invariant cannot see this class.
- Fix: add a fixture with two `ds-stamina-bar` blocks, and have the invariant require non-target fences to be byte-equal to the fixture (the test names its target fence index).

**L-4. The census scope for initiative is keyed on classes, so a new entry point outside those classes escapes both censuses.**
- Where: `test/dom/e2eCensus.test.ts:186` (`button.dse-init__stamina, .dse-init__bar.dse-stamina--clickable, button.dse-init__cell`) and `e2e/specs/_census.e2e.ts:52-57`.
- A new stamina control elsewhere in a row (say a quick-damage button in the conditions line) would not be found. This is acceptable for the pilot.
- Fix (rollout): scope by row and grid containers, and allowlist the ids of the other surfaces.

**L-5. `e2e/` is type-checked but not linted.**
- `package.json` has `lint: eslint src main.ts`. Either add `e2e` to lint (it is Node code, so it needs its own config block) or say in the README that it is not linted.

**L-6. N1 is still a passing pin.**
- `stamina-modal-stepper.e2e.ts:114-122` (STAM-S06) still records dirty-draft-Escape-closes-the-modal as a plain `it`. The ledger requires `knownBug('SC-431', …)` asserting the intended behaviour in the post-review fix round. Restated so it is not dropped.

**L-7. Stale or slightly inaccurate docs.**
- The `e2e/run.mjs:11-13` header still says exit 1 = "a test failed", and its summary line has no `coverage:`. The README and the dse-verify skill are correct.
- README: "sets `DISPLAY` for every child". Xvfb (`run.mjs:320`) and the build step (`:434`) inherit the shell's `DISPLAY=:1`. This is harmless (neither opens a window), but say "every wdio/Obsidian child".
- dse-verify skill: "Current expected numbers" has no e2e entry and jest 4666. Its lifecycle row still says 19/19, which predates this branch; the real count is 25/25. The owner should update this at landing.

### INFO

- **I-1. Equivalent mutants.**
  - M25 (drop DseModal's initial `focus()`): real Obsidian focuses the first input itself, so E01's `focusedControl() === 'sedit.apply-amount'` still passes. jest catches it (6 tests).
  - My first CSS click-shield attempt (M27) was inert, because the rule's `clip: rect(0 0 0 0)` kept it out of hit-testing. It is excluded. M27b is the real shield.
- **I-2. `/proc/<pid>/environ` is not usable for Electron processes.** Chromium overwrites that memory region, so it shows no `DISPLAY` and no `DSE_E2E_RUN_ID`.
  - So run.mjs's env-tag backstop (`taggedPids`, `run.mjs:247-259`) cannot find Obsidian processes. Reaping relies on the 400 ms ppid-tree poll.
  - Both SIGINT probes still reaped everything.
  - DISPLAY safety was verified through X instead: `xdotool search --class obsidian` on `:1` and `:200`, filtered to our process tree, found 2 windows on `:200` and 0 on `:1`. chromedriver's environment does carry `DISPLAY=:200`.
- **I-3. Authoring ergonomics are good.**
  - From the README alone I wrote `[STAM-R1X] Reset also returns a pending Spend Recovery` in 19 lines. It was green on the first run (1.4 s) and failed under M29, a mutation the shipped e2e misses (jest catches it). I deleted it afterwards; consider adding it.
  - Friction:
    - The README does not list what each fixture note contains (you open the `.md` or the spec header).
    - The `FAIL:` summary line cuts `toMatchObject` diffs to "Object {", so you need the bundle.
    - The README does not mention that `npm run tsc` type-checks the specs.
- **I-4. No visible change from the `data-dse-control` stamping.**
  - No CSS, harness or parity selector matches `data-dse-control`.
  - shots 568 / freeze 274/274 / parity unchanged.
  - The kit `RecoveriesStrip` and `undoNotice` stamp their ids unconditionally, so ds-hero's strip carries `recov.*` too. That is intended; it is attributes only.
- **I-5. jest `test.failing` cannot pin a failure message.** Any throw counts as "known bug". P2b checked each of the 27 by hand. If they are rerun under a broken harness, the sibling non-failing tests that share the harness would fail too, so the risk is low.

---

## Mutation table

Method: each mutation applied with an exact, count-checked replacement (`mutate.py`). Then a full `npx jest` (after `rm -f main.js styles.css`) and a full `npm run e2e`, then `git checkout`. `git status --porcelain` was verified empty after every one. Per-mutation diff, logs, jest JSON and summary are in `…/scratchpad/r1/mut/<id>/`.

| # | Mutation (file) | jest | e2e (failing ids) |
|---|---|---|---|
| M01 | Damage applies 1 too little (StaminaEditModal) | 29 (matrix ×20, modal ×7, heroSheet ×2) | E07 E08 E09 E20 B2(differently) S14 D01 D02 D03 D08 |
| M02 | temp no longer absorbs damage first | 21 | S14 D01 D02 D03 D08 |
| M03 | Apply writes nothing (no updateCallback) | 108 | 22 tests (`no write …`) |
| M04 | Escape/X/backdrop commits the pending edit (onClose) | **0** | F07a F07b F07c D08 |
| M05 | Kill sets floor+1 | 23 | INIT E10, Q01 |
| M06 | Full Heal keeps damage | 22 | Q04 |
| M07 | strip Catch Breath doesn't decrement Recoveries (bar view) | 7 | R01 R07 |
| M08 | modal Spend Recovery doesn't decrement | 23 | Q06 Q08 |
| M09 | disabled reason swapped (no-recoveries shows no-gain text) | 6 | Q09 |
| M10 | grid-cell dblclick edits the wrong instance (initiative) | 1 (initiative T-9) | E20 |
| M11 | Catch Breath listener detached (no-op onClick) | 12 | CENSUS-03 R01 R06 |
| M12 | Healing label uncapped | 15 | E08 H01 |
| M13 | temp take-higher broken (typed lower reduces temp) | 4 | T03 T04 T10 |
| M14 | initiative hero callback never persists | 2 | E07 E08 |
| M15 | bar not repainted after modal Apply | 3 | W03 (+R06 flake, M-1) |
| M16 | creature modal opened as hero (floor -max/2) | **0** | E10 |
| M17 | Damage not capped at the death floor | 14 | **none** (R06 failed = flake, M-1) |
| M18 | stepper blur no longer commits (kit stepper) | 4 | S03 S14 S13b T02 T03 T09 |
| M19 | marker click boundary off-by-one (`<=`) | 2 | **none** |
| M20 | undo restores Recovery but not Stamina | 1 | R06 (genuine: 953 ms, `current_stamina 22`) |
| M21 | slider ArrowRight steps the wrong way | **0** | R05 |
| M22 | Apply drops the Recoveries write-back | 20 | Q06 Q08 |
| M23 | stepper's adoption-blur guard removed | 2 | **none** (lifecycle G-S3 territory) |
| M24 | Spend Recovery not disabled at full | 5 | Q08 Q10 |
| M25 | DseModal initial focus removed | 6 | **none** (equivalent in real Obsidian, I-1) |
| M26 | cell single-click selection not persisted | 3 | E11 E20 |
| M27b | CSS: stood-down numeric box becomes an invisible click shield over the bar | **0** | E08 E10 (`element click intercepted`) E21 |
| M28 | Kill keeps temp | 12 | Q01 |
| M29 | Reset doesn't return a pending Spend Recovery | 3 | **none** (the I-3 scenario catches it) |
| M30 | popover − / + swapped | 2 | R07 |
| M31 | Catch Breath allowed while dying | 4 | R02b W03 |
| M32 | Healing also wipes temp | 13 | H01 |

Headline: 32/32 caught by at least one layer, 0 by neither, so no HIGH. Caught by both: 23. e2e only: M04 M16 M21 M27b. jest only: M17 M19 M23 M25 M29. Each layer catches things the other cannot (Escape/close semantics, real hit-testing, keyboard, initiative hero/creature wiring on the e2e side; floor caps, boundaries and adoption guards on the jest side). That is the layering the ledger designed.

## Gate bite (all reverted, `git status` clean after each)

| Probe | Result |
|---|---|
| Un-id'd `iconButton` "Rogue" + `control: 'sedit.bogus'` in the modal | jest `e2eCensus` **2 failed** (`no data-dse-control: <button class="dse-btn"> Rogue`, `id "sedit.bogus" is not in the manifest`); e2e **CENSUS-02 FAIL** (+4 problems) |
| Drop RECOV-R06 | full run exit 1: `done: 59/66 ok, 0 failed …, coverage: 46/47`, `coverage gate FAILED … undo.action x click` |
| Add a manifest kind `sedit.full-heal: ['click','dblclick']` | full run exit 1: `coverage: 47/48`, `… sedit.full-heal x dblclick` |
| "Fix" B4 (Catch Breath disabled at full) + B9 (`Number` not `parseInt`) | e2e **STAM-D09, RECOV-R03 FAIL: known bug … appears fixed - remove the marker**; jest **5 `test.failing` flipped** (A09 ×2, R03 ×3) |
| `it.skip` on INIT-STAM-E21 | **not caught**: `6/7 ok`, exit 0 (M-2) |

## Battery (this review, DSE `52f0099`)

- tsc clean (root + `-p e2e`). lint clean.
- jest **4666 passed / 1 skipped / 224 of 225 suites**, 40 s. The skip is the pre-existing `migrationCensus` suite.
- lifecycle (`DSE_LIFECYCLE_PORT=9308`) **25/25 ok**.
- e2e ×3 unloaded: **60/67 ok, 0 failed, 7 known-bug, coverage 47/47**; 32.4 s and 31.5 s on 4 shards (the first run was not timed).
- e2e ×3 with `--shards=4` alongside a parallel `npx jest`: all **green**, 53.9 / 55.8 / 56.1 s, loadavg up to 18.7.
- Over 42 full e2e runs in total, R06 flaked 2 times (M-1); there were no other flakes.
- shots **568**, 0 FAIL, all in-run gates OK.
- freeze **`freeze OK (274/274 …)`**.
- parity **0 gaps / 0 undeclared / 24 declared**.

## Read-for-correctness notes (no finding unless listed above)

- **Waits:** keyed on state. These are `waitWriteIdle`: `pendingWrites()` with two idle polls 30 ms apart, `modify` events, and retrying wdio asserts. The fixed short waits are 1500 ms in knownBug bodies, there to fail fast. The only fixed `pause` is `--slow`. Every write path goes through `ElementView.persist`, so the seam is complete (`grep replaceSource|vault.process`).
- **knownBug semantics:** correct. The marker passes on the pinned failure, fails on "appears fixed", fails on "failed differently", and tidies up modals before the invariants run. Pin looseness is L-1.
- **Exercised set:** see L-2. Coverage from failed runs never gates, because the gate only runs at `failed === 0`.
- **DISPLAY:** `run.mjs:458-461` deletes `DISPLAY`, `XAUTHORITY`, `WAYLAND_DISPLAY` and `XDG_SESSION_TYPE` and sets `:200`; wdio `autoXvfb: false`; if no Xvfb is found the run exits 2 and never falls back to `:1`. Only `--headed` defaults to `:1`.
- **package-lock:** lockfileVersion 3 on both sides; 761 → 1146 packages; 0 changed versions, integrity values or dev/optional flags, 0 removed.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/r1/`)

- `mutate.py`, `runmut.sh`, `summarize.py`, `mut/<id>/{mutation.diff,jest.json,jest.log,e2e.log,summary.txt}`, `batch1.log` … `batch11.log`
- `gate/{g1-jest.log,g1-e2e.log,g2-e2e.log,g6-e2e.log,g3-jest.json,g3-e2e.log}`, `skip-probe.log`
- `tsc.log`, `lint.log`, `jest-full.log`, `lifecycle.log`, `e2e-base1.log`, `e2e-base2.log`, `e2e-base3.log`, `load{1,2,3}-{e2e,jest}.log`, `load{1,2,3}-loadavg.txt`, `shots.log`, `freeze.log`, `parity.log`
- `probe.py`, `probe-env.txt`, `probe-env2.txt`, `probe3.txt`, `probe5.txt` (X windows per display), `probe-sigint-pid.txt`, `probe-sigint-pgrp.txt`, `probe-m27.log`, `probe-r06.log` (stale-toast proof), `ergo-clean.log`, `ergo-m29.log`
- The R06 flake bundles were pruned by the 12-run retention before I could copy them. The failure text and timing are kept in `mut/M15-bar-no-repaint-after-modal/e2e.log` and `mut/M17-damage-uncapped-at-floor/e2e.log`, and the root cause is shown by `probe-r06.log`.
