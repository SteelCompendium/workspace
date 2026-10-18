# SC-408 R2 review: scoped re-review of fix round F1 (DSE `52f0099..1a33560`, superproject `6e1427b`)

**Executive summary**
1. Verdict: **land-ready.** HIGH 0 · MEDIUM 0 · LOW 1 (non-blocking, rollout-able) · INFO 4.
2. Every folded R1 finding is confirmed fixed by re-running my own probe: M-1, M-2, L-1, L-2, L-3, L-5, L-6, L-7, I-2 and I-3.
3. M-1 flake: **20 of 20 full runs at `--shards=4` were green**, each `61/69 ok, 0 failed, 8 known-bug, coverage: 47/47`. Seven ran beside a parallel `npx jest` (load up to 17.5, about 60 s each) and 13 unloaded (34.7–35.6 s). The R06 timing spread is 1384–1477 ms; the 8.4 s expiry signature never appears. The stale-toast probe now reads 0 notices after `openNote` and exactly 1 Undo action.
4. The new checks fail when they should and raise no false positive on the shipped specs:
   - **Skip pre-scan:** `it.skip`, `xit` and `describe.skip` each make the run exit 2 and name `file:line`.
   - **Pending reporter:** a runtime `this.skip()`, `it['skip']` and `specify.skip` (forms the pre-scan misses) each make the run exit 1 with `FAIL: the test was skipped`.
   - **Known-bug-only gate:** making STAM-T05 a known-bug test fails the gate with `sedit.temp.dec x click-disabled (only: STAM-T05)`.
   - **Per-fence invariant:** a real `src` mutation that writes the wrong block of a two-block note is flagged with `fence #0 … changed but is not a block this test declared`.
5. Driver regressions: none. R1's e2e-caught mutations M04, M21, M16, M27b, M18 and M13 are re-caught by exactly the same tests as in R1. STAM-R1X catches M29. STAM-S06 is recorded as `known-bug SC-431`.
6. Battery:
   - tsc and lint clean; lint now covers `e2e/` and is bite-proven.
   - jest 4666 passed / 1 skipped / 224 of 225 suites.
   - lifecycle 25/25 on port 9308.
   - shots 568, 0 FAIL. freeze 274/274. parity 0 / 0 / 24.
   - These match the author's numbers.
7. SIGINT to run.mjs, and to its whole process group, each exit 2 with 0 survivors and 0 `/tmp/dse-e2e-*` dirs left. Obsidian windows appear on `:200` only, 0 on `:1`.
8. The sample failure bundle is at `/tmp/claude-1000/sc408-r2/sample-bundle/screenshot.png`, from M04 (Escape writes) failing STAM-F07a. Both worktrees were left as found: DSE status is empty; the superproject shows only the pre-existing ` M draw-steel-elements`.

---

## Per-finding confirmation (R1 → F1)

| R1 finding | Ruling | My re-probe | Result |
|---|---|---|---|
| **M-1** R06 stale-toast flake | fold fixes 1-3 | (a) 20 full runs, 7 of them loaded; (b) R1 stale-toast probe re-run. Over 3 rounds the notice count before `openNote` was 1/1/0 and **after `openNote` 0/0/0**, and once the new toast posted the Undo-action count was **1** at every sample (R1 found 2, with `firstIsNewest=false`). | **confirmed** |
| **M-2** silent skips | fold | `it.skip` → exit 2 `usage: … stamina-entry.e2e.ts:87: it.skip(…)`. `xit` → exit 2. `describe.skip` → exit 2 (`:31`). Runtime `this.skip()` → exit 1, `INIT-STAM-E21 FAIL: the test was skipped (pending)`, `6/8 ok`. **Bypass attempts** `it['skip'](` and `specify.skip(` slip past the regex, but the PendingReporter turns each into a FAIL, exit 1. | **confirmed** (two layers) |
| **L-1** loose pins | fold | I removed both the numeric and the cell repaint on the creature route (`initiative/view.ts`). B2 then gave `FAIL: known bug SC-426 failed differently than pinned (/the detail row should show…/)`, and E09/E20 went red. Under R1's `/50\/60/` pin, B2 would have stayed "known-bug". | **confirmed** |
| **L-2** pairs credited without real driving | fold all 3 | Probe spec: `press('Enter', apply-amount)` while focus is on `stamina.input` throws (`the control does not have focus (focus is on sedit.stamina.input)`). `blur(temp.input)` unfocused throws. `press(…, modal.close)` throws (`use dse.aimedAt`). A click on a missing control throws. The run's `coverage.json` holds only the 3 pairs actually driven. The known-bug-only gate bites (T05 → `coverage: 46/47`, `coverage gate FAILED: 1 pair(s) are driven only by known-bug tests … sedit.temp.dec x click-disabled (only: STAM-T05)`). | **confirmed** |
| **L-3** invariant masked every fence | fold | New src mutation **M33**: `ReadingModeBlockHost.replaceSource` retargets to the first block of the same language. Full run: STAM-W10 FAIL (block 1 not written: `current_stamina 8`, expected 5). With W10's own assertions removed, `--only=STAM-W10` still fails on the invariant alone: `Stamina/two-blocks.md: fence #0 (ds-stamina-bar) changed but is not a block this test declared it was editing (declared: 1)`. No false positive in 20 green runs (W08's external edit is exempt; initiative and modal tests declare their block). | **confirmed** |
| **L-5** lint `e2e/` | fold | `npm run lint` = `eslint src main.ts e2e`, clean. Bite: an unused const in `run.mjs` gives `no-unused-vars`, and an un-awaited `clearNotices()` in `cleanup.ts` gives `no-floating-promises`. Exit 1; reverted. | **confirmed** |
| **L-6** S06 → SC-431 | fold | STAM-S06 is `knownBug('SC-431', …)`: Damage 4 pending, type 12, Escape → expect the modal open (pinned message), draft 15, label `Lose 4 Temp Stamina`, second Escape → no write. Every run reports `STAM-S06 known-bug SC-431`. `sedit.stamina.input x press:Escape` is still driven by non-known-bug S07, so the gate stays green. | **confirmed** |
| **L-7** docs | fold | The `run.mjs` header (exit codes, `coverage:` in the summary, DISPLAY wording, reap backstop), the README (exit codes, DISPLAY, tsc/lint, gate rules, fixture table, per-fence note) and the skill (`6e1427b`: lifecycle 25/25, e2e row, CURRENT block) all match the code and my measurements. I checked the README fixture table against the vault notes. | **confirmed** |
| **I-2** reap backstop | fold | SIGINT to the run.mjs pid at 8.9 s, and SIGINT to its process group at 8.6 s: exit 2, `survivors among 53/52 observed descendants: 0`, no Xvfb, chromedriver or `dse-e2e-` processes, X socket `:200` removed, `/tmp/dse-e2e-*` = 0. | **confirmed** |
| **I-3** ergonomics | fold | STAM-R1X under M29 → `STAM-R1X FAIL: … "recoveries": 3 → 2`. The `FAIL:` line now carries the diff body. | **confirmed** |
| L-4 | carried into rollout | not reviewed (out of scope) | — |
| M-1 fix 4, I-5 | dropped | — | — |

## Driver-change regression check (R1 e2e-caught mutations, full runs after F1)

| Mutation | R1 e2e catch | R2 e2e catch |
|---|---|---|
| M04 Escape/X/backdrop writes | F07a F07b F07c D08 | **F07a F07b F07c D08** (still caught after F07a moved to `aimedAt`) |
| M21 slider arrows swapped | R05 | **R05** (still caught after `press` gained its focus assertion) |
| M16 creature modal as hero | E10 | **E10** |
| M27b CSS click shield over the bar | E08 E10 E21 | **E08 E10 E21** |
| M18 stepper blur no longer commits | S03 S14 S13b T02 T03 T09 | **identical** (unaffected by the new `blur()` focus check) |
| M13 temp take-higher broken | T03 T04 T10 | **T03 T04 T10** |
| M29 Reset keeps the pending Recovery | none in R1 | **STAM-R1X** |
| M33 (new) write lands in the first same-language block | — | **W10** (+ the invariant alone, above) |

Every mutation was reverted with `git checkout`, and `git status --porcelain` was empty after each.

## Findings

### LOW

**L-1 (R2). `dse.block()` declares a target fence even when a test only reads from it.** This can quietly weaken the per-fence check.
- Where: `e2e/driver/dse.ts:179-183` (`block()` calls `declareTarget` unconditionally). Read-only uses include `stamina-modal-stepper.e2e.ts` W08 (`dse.block(BAR).control({ css: '.dse-stamina__ccur' })`) and RECOV-W03.
- Failure scenario: a future two-block scenario edits block 1 and also reads block 0's readout through `dse.block(BAR, 0)` for a DOM assertion. Block 0 is then "declared", so a cross-talk write into block 0 passes the invariant. Today W10 never reads block 0 through `block()`, and all fixtures but `two-blocks.md` have one block, so nothing escapes now.
- Fix (rollout is fine): declare targets on drive only, recorded when `click` / `type` / `press` act inside a block scope, or add a read-only accessor such as `dse.blockView(lang, n)` that does not declare.

### INFO

- **I-1.** The `SKIP_RE` pre-scan (`run.mjs:122`) misses `it['skip']`, `specify.skip`, `context.skip` and `xspecify`. This is acceptable because the PendingReporter turns any pending test into a FAIL (proven for `it['skip']` and `specify.skip`). A non-`it` `.only` (`specify.only`) is still caught through the "did not run" accounting for `it(` siblings.
- **I-2.** The unique `failsWith` messages pin which assertion failed, not why. A regression that breaks the bug assertion itself is still recorded as "known bug" (D09/S08 under a Damage-math mutation, for example). This is inherent to known-bug markers; sibling non-known-bug tests (D01–D08) catch that class.
- **I-3.** `dse.externalEdit` exempts the whole note from the per-fence check (`dse.ts:411`). That is correct for W08 (one block), but a two-block external-edit scenario would lose cross-talk detection.
- **I-4.** Cosmetic: `modal(kind: keyof typeof MODAL_KINDS  )` and `aimedAt = (hostId: keyof typeof HOST_CONTROLS  )` have stray double spaces (`dse.ts:186`, `:366`). The skill's "CURRENT" block describes the unlanded branch; re-point it to `develop` at landing.

## Battery (DSE `1a33560`)

- tsc clean (root + `-p e2e`). lint clean (`eslint src main.ts e2e`).
- jest **4666 passed / 1 skipped / 224 of 225 suites**.
- lifecycle **25/25** (`DSE_LIFECYCLE_PORT=9308`).
- e2e 20/20 green, `61/69 ok, 0 failed, 8 known-bug, coverage: 47/47`:
  - 13 unloaded runs, 34.7–35.6 s each.
  - 7 runs beside a parallel `npx jest` (each jest 4666/1 green), 59.2–60.9 s each, load 14–17.5.
- shots **568**, 0 FAIL. freeze **274/274**. parity **0 gaps / 0 undeclared / 24 declared**.
- Author: 4666/1 · 25/25 · 61/69 + 8 · 568 · 274/274 · 0/0/24, 35.6–36.1 s. **Match.**

## Sample failure bundle (for the ticket owner)

`/tmp/claude-1000/sc408-r2/sample-bundle/`:
- `screenshot.png`: the Obsidian window at the failing moment.
- `summary.txt`: what was run and what each file shows.
- `mutation-M04.diff`.
- `STAM-F07a/`: the full bundle (`error.txt` `expected no write to Stamina/basic.md, saw 1`, `note.Stamina_basic.md.diff` with temp 5 → 1, `events.json`, DOM and screenshots, vault copy).

The run was M04 applied, `npm run e2e -- --element=stamina-bar` → `45/56 ok, 4 failed, 7 known-bug`; then reverted.

## Evidence

In `/tmp/claude-1000/sc408-r2/logs/`:
- **Flake runs:** `flake-summary.txt` (20 lines), `flake-{loaded,quiet}-N.log`, `flake-loaded-N-jest.log`, `loop-loaded.out`, `loop-quiet.out`.
- **Skip probes:** `skipprobe.out`, `skipprobe2.out`, `skip-*.log`.
- **Other probes:** `probe-toast.log` (stale-toast re-probe), `probe-press.log` (L-2), `pin-B2.log` (L-1), `invariant-M33.log` (L-3 invariant alone).
- **Mutations:** `mutA.out`, `mutB.out`, `mut-<id>.log` / `.diff`.
- **Safety:** `sigint-{pid,pgrp}.txt`, `probe5.txt` (X windows per display), `lint-bite.log`.
- **Battery:** `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `shots.log`, `freeze.log`, `parity.log`.

Scripts: `/tmp/claude-1000/sc408-r2/{loop.sh,runmut-e2e.sh,gkb.py,skipprobe.sh,skipprobe2.sh}`, plus the R1 `mutate.py` (M33 added) in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/r1/`.
