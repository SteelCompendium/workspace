# SC-585 r2 review report

## Executive summary
- **Verdict: LAND-READY.** dse `7b87b74d` (fix `4ba9116d`, e2e `7b87b74d`) on base `1f1ae442` (merge-base = origin/develop = `1f1ae442`). 0 HIGH, 0 MED, 1 LOW (CHANGELOG wording), 4 INFO.
- Measured gates (mine): tsc rc 0, lint rc 0; jest `Tests: 1 skipped, 11795 passed, 11796 total` (shots cache present: 11788 + 1 cache + 6 new); e2e `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (+1 = COND-R07, rc 0); lifecycle part 1 `21/21 ok, 0 failed` (G-S1 ok).
- Revert-the-fix proof (src/views/ConditionsModal.ts at `1f1ae442`, tests kept): matrix `-t SC-585` 4 failed / 3 passed; e2e COND-R07 FAILS at `cond-rows.e2e.ts:123` (`toBeFocused` on the input: "not focused") after its write + note assertions pass. With the fix: 7/7 and COND-R07 ok.
- Reviewer probe (8 extra jsdom cases: mouse removal both focus variants, editor-open last row, ARIA after ArrowDown, two sequential removals, Enter-pick after emptying, routed-key from cog + Escape, routed-key non-last): 8/8 with the fix; 3 fail without it (the three that empty the list by keyboard with the search open).
- Sweep is complete: only two `.dse-condal__add` focus sites exist (`removeAt` via `focusAddControl`, and `closeAdd`, which renders the button before focusing it). No other path drops focus to `<body>` in this window.
- Cosmetic describe title: not worth a round on its own; if a fix round happens, delete the now-subsumed SC-585 marker (SC-583 precedent `6453bc5d`) and retitle the describe.
- Working tree left as found: plugin clean @ `7b87b74d`; superproject worktree ` M draw-steel-elements` @ `ce7298cb` (pre-existing, unbumped pointer).

## 1. Correctness of `src/views/ConditionsModal.ts`

`focusAddControl()` (l.366-371) focuses `.dse-condal__input` when `addOpen`, else `.dse-condal__add`; `removeAt` (l.359-360) calls it when the list empties. Correct and minimal. `addOpen === true` always implies a rendered combobox (`renderAdd` is called right after every `addOpen = true`: l.589-590, l.611-613), so the `?? .dse-condal__add` fallback is never a null-for-null.

Focus-site sweep (`grep dse-condal__add`, every `.focus(` in the file):
- l.370 `focusAddControl` — the fixed site.
- l.635 `closeAdd` — sets `addOpen=false` and `renderAdd()` first, so the button exists. Safe.
- All other `.focus()` calls target the row cog / editor options / the combobox input; none can run against a missing element in the search-open-and-empty state.

Removal paths with the search open (each probed):
- Keyboard Enter / Space on trash (no mousedown): fixed path. Probe P2/P4/P6 + matrix tests.
- Mouse click on trash: mousedown outside addwrap arms the close; capture `click` closes the search first (refocus false if the trash took focus, true otherwise), then `removeAt` finds `addOpen=false` and focuses "+ Add condition". Probe P1 (trash focused) and P1b (focus left on the input) both end on "+ Add condition", never `<body>`; both also pass on base.
- Delete/Backspace: no key handler exists in ConditionsModal; not a path.
- Removal from inside the row editor: the editor has no remove control (Icon/Duration/Color/Effect only); last row with its editor open + search open → editor gone, input focused (P2).
- SC-580 routed key then removal then Escape: `returnFocusEl` is always detached after a removal (`renderList` rebuilds every row), so `closeAdd`'s `back?.isConnected` is false and focus lands on "+ Add condition" (matrix test + P6 from the cog + P7 non-last).

## 2. ARIA after the list empties with the search open
- `aria-expanded="true"` stays (the menu is still rendered — correct).
- `aria-activedescendant` is unchanged and names a live `role=option` with `aria-selected=true`, including after ArrowDown x3 (P3). `aria-controls` names the live menu.
- The menu does not need a refresh: `matchesFor` does not filter by the active list, so its contents are identical before and after a removal.

## 3. Tests
- Flipped marker (`test.failing` → `test`, matrix l.1044) fails without the fix. Not vacuous.
- New describe "removing a row while the Add search is open" (matrix l.537-610), 6 tests. Without the fix: "the last row", "typed query survives", "routed-key ... Escape" fail (discriminating). Three pass on base by design or by construction:
  - "aria-activedescendant names a live option" and "a non-last row" are regression guards for unchanged behaviour (fine).
  - "Escape after removing the last row with a normally opened search" dispatches Escape straight at the input, so it cannot see the focus defect; it guards the post-fix Escape outcome only (INFO-2).
- e2e `[COND-R07]` (cond-rows.e2e.ts:108-128): real keys — `dse.type` (pointer-click + `browser.keys`), real Shift+Tab via `browser.keys(['Shift','Tab'])` with the modifier released, `dse.press('Enter', trash)` which refuses unless the trash really holds focus. Asserts trash focused with the search displayed, exactly one write, empty modal list, the note's Ogre #1 `conditions: []`, the input focused, `focusedOption` = `cond.input`/"Add condition", value `da` kept, "+ Add condition" absent. Title carries only the scenario id `[COND-R07]` (house convention, like COND-R03); no `(SC-…)` ticket id. `COND-R07` is unique (only occurrence in e2e/ and test/ is this spec). Fails without the fix at l.123.

## 4. Gates (measured by me)
| Gate | Result | Log |
|---|---|---|
| tsc | rc 0, no output | `tsc.log` |
| lint | rc 0 (only the known `.eslintignore` deprecation warning) | `lint.log` |
| jest full (main.js/styles.css removed first) | `Test Suites: 1 skipped, 275 passed` / `Tests: 1 skipped, 11795 passed, 11796 total`, rc 0 | `jest-full.log` |
| e2e full | `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0 (2m43s) | `e2e-full.log` |
| lifecycle part 1 (21 ids incl. G-S1) | `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`; G-S1 ok | `lifecycle-part1.log` |
| revert proof jest | `Tests: 4 failed, 325 skipped, 3 passed` | `jest-sc585-nofix.log` |
| revert proof probe | `3 failed, 5 passed` | `jest-probe-nofix.log` |
| revert proof e2e | `0/1 ok, 1 failed` at cond-rows.e2e.ts:123 | `e2e-cond-r07-nofix.log` |
| with fix | matrix `-t SC-585` 7 passed; probe 8 passed | `jest-sc585-fix.log`, `jest-probe-fix.log` |

Other lifecycle parts, shots, freeze, parity not re-run (diff touches no write path and no CSS; trusted from r1 per brief).

## Findings

### LOW-1 — CHANGELOG bullet's last clause is inaccurate for the bottom row
`CHANGELOG.md` (superproject worktree, Unreleased, SC-585 bullet, last line): "removing any other condition still focuses the row that took its place". When the removed row is the bottom one (and others remain), no row takes its place; focus goes to the cog of the row above (`removeAt` l.362, `Math.min(index, length-1)`). Scenario: a reader removing the bottom of three conditions finds focus on the row above, not "the row that took its place". Fix: "…and removing any other condition still moves focus to the next condition (or the one above it, if you removed the bottom one)." Apply while resolving the rebase conflict (INFO-4); not a reason for a round on its own.

### INFO-1 — the "known bugs (each marker … fails today)" describe title (owner's cosmetic question)
`test/dom/views/conditions-modal-matrix.test.ts:1022`. It now holds 2 passing tests (SC-581 l.1027, SC-585 l.1046) and 2 `test.failing` SC-586 markers, so the title is false for half its contents. The SC-585 marker is also strictly subsumed by the new "SC-585: the last row: … exactly, has focus" (l.545; same setup, stronger assertion). Judgment: **not worth a round by itself; fold in only if a fix round happens** (agrees with the owner ruling). Prescribed fold-in: delete the SC-585 marker (precedent `6453bc5d`, "remove the SC-583 test.failing marker; the fix lands with its own tests") — jest count drops by 1, so the CURRENT entry would read 11794 / 11793-fresh; and either move the SC-581 test to the colour section or retitle the describe to e.g. `'SC-436 matrix: bug markers (test.failing = still open; a plain test = fixed, kept as a guard)'`. Retitling alone is the zero-count-change option.

### INFO-2 — one new jest test cannot detect the defect
Matrix l.601-608 "Escape after removing the last row with a normally opened search…" passes on base because `keydown(searchInput, 'Escape')` is dispatched at the input regardless of where focus is. Harmless (it guards the post-fix Escape outcome); optionally add `expect(document.activeElement).toBe(searchInput(o.container))` before the Escape so it discriminates. Not required.

### INFO-3 — mouse removal with the search open closes the search (unchanged, consistent with SC-474)
A mouse click on the last trash with the search open closes the search (outside-close gesture) and focuses "+ Add condition"; only keyboard removal keeps the search open. This asymmetry is pre-existing and matches the ruling ("search stays open" is stated for the keyboard-removal case the ticket describes). Noted so the owner is not surprised; no change prescribed.

### INFO-4 — superproject branch needs a rebase with one trivial CHANGELOG conflict
`ce7298cb` sits on `f9082867`; workspace main has `53be46e9` (SC-612 bullet) since. `git merge-tree f9082867 main ce7298cb` reports one "changed in both" conflict in `CHANGELOG.md` (both insert at the top of `## Unreleased`). Keep both bullets, SC-585 above SC-612, then one pointer bump to `7b87b74d`.

## Working tree
Before and after: plugin `git status --porcelain` empty, HEAD `7b87b74df5dcd9b2c81248f4d07c0a1a35a8a7c1`; superproject worktree ` M draw-steel-elements`, HEAD `ce7298cb`. The revert probe rewrote only `src/views/ConditionsModal.ts` from `1f1ae442` and restored it with `git checkout HEAD --`; the probe test file was copied into `test/dom/views/` for each run and deleted (literal path). Ignored build outputs (`main.js`, `styles.css`, `e2e/.out/`) were regenerated by the gates.

## Artifacts
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc585-r2-rev/`: `rc.log`, `tsc.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, `lifecycle-part1.log`, `jest-sc585-fix.log`, `jest-probe-fix.log`, `jest-sc585-nofix.log`, `jest-probe-nofix.log`, `e2e-cond-r07-nofix.log`, `revert-diffstat.log`, `zz-sc585-r2-probe.test.ts` (probe source), scripts `g1-static-jest.sh`, `g2-probe.sh`, `g3-revert.sh`, `g4-e2e-lifecycle.sh`.

---

# r4 — scoped re-review of the r3 fix delta

## Summary
- **Verdict: LAND-READY.** dse `3a5986d3` (merge-base with origin/develop = `1f1ae442`, unmoved); superproject `dbd7a210` on origin/main `6630f0e5` (fetched; unmoved).
- dse delta `7b87b74d..3a5986d3` is test-only: one file, +2/-1 (describe retitle; INFO-2 focus assertion at matrix l.606).
- INFO-2 assertion fails without the fix: only `src/views/ConditionsModal.ts` reverted to `1f1ae442` → `Tests: 1 failed, 331 skipped`, failing at `conditions-modal-matrix.test.ts:606:35` (the new line); with the fix 1 passed. All SC-585 matrix tests without the fix: 5 failed / 5 passed.
- tsc rc 0, lint rc 0, matrix suite `Tests: 332 passed, 332 total`. Full jest not re-run (optional; delta is +1 assertion, no test added or removed).
- Superproject: `origin/main..HEAD` = `99c70cdf` (CHANGELOG) + `dbd7a210` (pointer → `3a5986d3`); diff touches only `CHANGELOG.md` (+6, pure insertion, so the SC-612 bullet is intact) and the pointer. LOW-1 wording accurate. One INFO (bullet order).

## Checks
- `git log --oneline 7b87b74d..3a5986d3`: `3a5986d3 test: retitle the known-bugs describe …; assert the input has focus before Escape …`. `--stat`: `test/dom/views/conditions-modal-matrix.test.ts | 3 ++-`.
- New title `'SC-436 matrix: fixed bugs (SC-581, SC-585) and the open known-bug markers (SC-586: each encodes the correct behaviour and fails today)'` matches its contents (SC-581 and SC-585 pass; two SC-586 `test.failing`). SC-585 marker kept, so the jest count is unchanged (owner ruling).
- `git ls-tree dbd7a210 draw-steel-elements` → `3a5986d3103a8a0d6bfee722fc87ed6061dcc0df`.
- `git diff origin/main..HEAD -- CHANGELOG.md`: 6 added lines, 0 removed; SC-612 bullet present once in both origin/main and HEAD.
- LOW-1 text: "removing any other condition still moves focus to the next condition (or the one above it, if you removed the bottom one)". Matches `removeAt` l.362 (`focusRowCog(Math.min(index, length-1))`, the cog of the row that shifted in, else the row above).

## Findings
### INFO-5 — SC-585 bullet sits below SC-612 in `## Unreleased`
`CHANGELOG.md` (superproject HEAD, l.20-24): the section reads newest-first (SC-612, landed after SC-581, is above SC-581), and SC-585 lands after SC-612, so by that order it would go on top. Harmless (all three are Unreleased and get one dated header at deploy). Optional: move the bullet above SC-612 when convenient; not a reason for a round.

## Working tree
Before and after: plugin clean @ `3a5986d3`; superproject worktree clean @ `dbd7a210`. The revert touched only `src/views/ConditionsModal.ts` and was restored with `git checkout HEAD --` (`r4-status-after.log` empty).

## Artifacts (scratchpad `sc585-r2-rev/`)
`r4-gates.sh`, `r4-rc.log`, `r4-tsc.log`, `r4-lint.log`, `r4-jest-matrix.log`, `r4-jest-info2-nofix.log`, `r4-jest-info2-fix.log`, `r4-jest-sc585-nofix.log`, `r4-revert-diffstat.log`, `r4-status-after.log`.
