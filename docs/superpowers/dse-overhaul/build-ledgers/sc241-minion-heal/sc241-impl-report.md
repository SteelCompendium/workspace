# SC-241 implementation report

## Executive summary

Fixed the negative-Apply-Damage inversion in `MinionStaminaPoolModal` (the same class of
bug SC-133 RC-3 fixed in `StaminaEditModal`), plus the owner-ruled fold-in of
`minionCountInput`'s unclamped `parseInt`. Both parsed values are now clamped with
`Math.max(0, …)` at the parse boundary; `damageInput` now carries `min="0"`
(`minionCountInput` already had it). Red-first suite: 4 failing / 30 passing / 34 total
against unfixed source; all green after the fix. Full battery green: tsc clean, lint clean
exit 0, jest 3930 passed / 1 skipped / 202 of 203 suites (0 failures), shots 524 PNGs / 0
FAIL, freeze 260/260 (0 checksum mismatches — zero frozen bytes moved, as ruled), parity 0
GAPs / 0 undeclared / 16 DECLARED / exit 0. Changelog bullet added under `## 7.0.0
(unreleased…)`. Branch `sc241-minion-heal`, tip `46c0c4c`, base `origin/develop` `0c132d8`
(unchanged — already current at dispatch). No drive-by fixes, no follow-ups. Status: DONE.

## Context and base

- Worktree: `/home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements`,
  branch `sc241-minion-heal`.
- `git fetch origin && git rebase origin/develop`: already up to date; base
  `origin/develop` = `0c132d8` (matches the brief's expected base — no drift).
- `npm ci` was required (fresh worktree had no `node_modules`) before any gate could run;
  771 packages installed, exit 0.

## Steps taken

1. **Red first.** Added a `describe('SC-241: negative Apply Damage input (damage or minion
   count) is clamped to a magnitude (0), never heals the pool', …)` block to
   `test/dom/views/minion-stamina-pool-modal.test.ts`, mirroring the SC-133 RC-3 tests in
   `test/dom/views/stamina-edit-modal.test.ts`. Five tests:
   - damage `-3`, minions `1` → the "can't regain stamina" warning stays hidden, and (using
     a pool value of 17 chosen so an unfixed +3 heal exactly reaches the persisted 20-point
     max, keeping the real `disabled` gate open so a click-through persisted-pool assertion
     is meaningful) `group.minion_stamina_pool` stays 17 after Apply.
   - damage `3`, minions `-2` → `pendingStaminaChange` stays 0 (asserted directly — the
     button's kill-selection gate makes a click-based persisted assertion non-discriminating
     for this magnitude, so this one checks the pending delta instead).
   - damage `-3`, minions `-2` → `pendingStaminaChange` stays 0 (the double-negative no-op
     case).
   - `damageInput` carries `min="0"`.
   - a normal positive Apply Damage (`3`, `1`) still subtracts 3 from a full 20-point pool
     (guard against a vacuous suite).
   Ran against the unfixed source: **4 failed, 30 passed, 34 total** (the 5th, the positive
   guard case, passed unchanged — it isn't supposed to move). Committed at `d99f5a0`.
2. **Fix** in `src/views/MinionStaminaPoolModal.ts`: added `damageInput.setAttribute('min',
   '0')` next to the existing aria-label wiring, and in the Apply Damage `onClick`, clamped
   both parsed values (`clampedDamage = Math.max(0, damage)`, `clampedMinions = Math.max(0,
   minions)`) before computing `totalDamage`, each with an `SC-241` comment pointing at
   SC-133 RC-3, mirroring `StaminaEditModal.ts`'s idiom. Committed at `18c9ac9`. Re-ran the
   same test file: **34/34 passed** (0 failures). Also ran alongside
   `stamina-edit-modal.test.ts` to confirm no regression there: **98/98 passed** combined.
3. **Changelog:** added one `[FIX]` bullet at the top of the list under `## 7.0.0
   (unreleased; previously numbered 6.0.0)` in `CHANGELOG.md`, citing `(SC-241)`, plain-
   language, matching SC-278's bullet shape. Committed at `46c0c4c`.

No other files touched. No CSS, no other modal, no refactor of the apply row.

## Drive-by fixes

None.

## Follow-ups

None identified beyond ticket scope.

## Gate results (measured, this session, worktree tip `46c0c4c`)

| Gate | Command | Result |
|---|---|---|
| tsc | `npm run tsc` | clean (no output), exit reported clean |
| lint | `npm run lint` | clean (no output beyond the known ESLintIgnoreWarning notice), exit 0 |
| jest (full) | `rm -f main.js styles.css` then `npx jest` | **1 skipped, 202 passed, 202 of 203 suites; 3930 passed, 1 skipped, 3931 total; 3 snapshots passed.** 0 failures. (Brief's dispatch baseline was ~3919+/202-of-203 at `e4bcd0f`; this branch is based on `0c132d8`, which the brief flagged as already carrying SC-278's additional tests — delta from the dispatch baseline is +11, consistent with SC-278's own suite growth plus this ticket's own net +4 new tests beyond the pre-existing 30 in that file, i.e. no unexplained drift.) |
| shots | `npm run shots` | **524 PNGs, 0 FAIL** — matches the brief's expected number exactly. All in-run gates (host-copy pin, button/input/table/list/inline/checkbox/prose host-leak sweeps, print-twin delta, nested corner-radius) reported OK. |
| freeze | `check-freeze.sh …/visual-harness/shots` | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`** — 0 checksum mismatches, 0 missing. Zero frozen bytes moved, as the owner ruled (`min` attribute + onClick logic only, no visual change). |
| parity (last) | `npm run parity` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).** Exit 0. Composition unchanged from the brief's expected 16-row declared set (FOLLOWUPS #39/#40/#51 — none of them touches this modal). |

Jest was run with load-sensitive settings-tab/settings-preview suites passing cleanly (no
timeout-shaped reds observed); no re-run was needed.

## Commits (branch `sc241-minion-heal`)

1. `d99f5a0` — `test(minion-stamina): SC-241 red-first — negative Apply Damage input heals the pool`
2. `18c9ac9` — `fix(minion-stamina): SC-241 — clamp Apply Damage input to a magnitude`
3. `46c0c4c` — `docs(changelog): SC-241 — note the minion Apply Damage negative-input fix`

Final branch tip: `46c0c4c`. No AI-attribution trailers in any commit message.

## Evidence artifacts (absolute paths)

- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/sc241-impl-report.md`
- Red-first jest log (4 failed / 30 passed / 34 total):
  `/tmp/claude-1000/sc241-redfirst-run3-1790219100.log`
- Full jest log (post-fix, 3930 passed / 1 skipped / 202 of 203 suites):
  `/tmp/claude-1000/sc241-jest-full-1790219123.log`
- Post-fix targeted jest log (minion-stamina + stamina-edit-modal, 98/98 passed):
  `/tmp/claude-1000/sc241-green-1790219200.log`
- tsc log (clean): `/tmp/claude-1000/sc241-tsc-1790219300.log`
- lint log (clean, exit 0): `/tmp/claude-1000/sc241-lint-1790219350.log`
- shots log (524 PNGs, 0 FAIL): `/tmp/claude-1000/sc241-shots-1790219166.log`
- freeze log (260/260, 0 mismatches): `/tmp/claude-1000/sc241-freeze-1790219500.log`
- parity log (0 GAPs / 0 undeclared / 16 DECLARED, exit 0):
  `/tmp/claude-1000/sc241-parity-1790229674.log`
- npm ci install log: `/tmp/claude-1000/sc241-npmci-1790218960.log` (glob-matched; run once,
  named with a `date +%s` timestamp at install time)

## Return contract

- **Verdict: DONE.**
- Final DSE branch sha: `46c0c4c` (test `d99f5a0`, fix `18c9ac9`, changelog `46c0c4c`).
- Red-first failing count: **4 failed / 30 passed / 34 total**, against unfixed source.
- Gate numbers: see table above — all six gates green, matching or explained relative to
  the brief's expected numbers.
- Drive-by fixes: none.
- Follow-ups: none.
