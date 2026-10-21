# SC-474 re-review r1 (fix-r1 delta only) — reviewer suffix q7hn

## Executive summary
- **Verdict: LAND-READY.** No findings: 0 BLOCKER, 0 HIGH, 0 MED, 0 LOW, 0 INFO. Reviewed dse `e31e1a0` on `origin/develop` `c03db7a`; superproject `da932cd`.
- HIGH-1 is fixed as prescribed (`src/views/ConditionsModal.ts:180-182`, `:553-557`). In real Obsidian a click into the icon search with the dropdown open keeps focus, and "sk" lands (X4-P15, X4-P16). A click on the custom colour leaves focus on `<input type=color>` (X4-P17).
- INFO-2 is kept: a click on the header or a row name lands focus on "+ Add" (X4-P05).
- SC-468 focus is unchanged for duration, effect and swatch (X4-P01..P03). Menu-item pick still adds (X4-P04).
- The other round-1 guarantees still hold: backdrop click, listener lifetime, drag-out, drag-in, right/middle press, Escape (X4-P06/07/08/11/12).
- Vacuity: with only HIGH-1 reverted, 2 of the 3 new jsdom tests fail (icon search, custom colour) and COND-E06 fails. The third jsdom test, the INFO-2 pin, is live too: dropping the `doc.body` clause makes it fail.
- LOW-1 is done: `const doc = activeDocument` (`:169`) is used by all three listeners and by the timer (`doc.defaultView`).
- The rebase is clean: `git range-diff` shows all 3 round-1 commits as `=`.
- Gates at the head: tsc and lint clean; jest 5384 / 1 / 231 of 232; e2e 88/92, 0 failed, 4 known-bug, coverage 64/64 pairs. COND-E04/E05/E06 pass SC-456's stricter fence check.
- No CSS in the delta and no attribution trailers. The new `cond.icon-search` follows the e2e README rule: attribute via `stampControl`, a manifest row, and a scenario that drives it.

## Gates (shared worktree, exit codes recorded by script file)
| Gate | Measured | Expected (ledger) |
|---|---|---|
| tsc (+ `-p e2e`) | clean, RC=0 | clean |
| lint (+ e2e) | clean, RC=0 | clean |
| jest | 5384 passed / 1 skipped / 231 of 232 suites, RC=0 | 5374 + 7 + 3 = 5384 |
| e2e | `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`, RC=0 | 87/91 + COND-E06, 64/64 |

I did not re-run lifecycle, shots, freeze or parity; I trust the fixer's numbers (28/28; 572 / 0 FAIL; 276/276; 0/0/24). The delta adds one data attribute and changes focus logic. It touches no CSS and nothing in print, so I see no reason to doubt them.

## Checks
1. **HIGH-1** (real Obsidian 1.14.4, raw CDP mouse, probe spec carried over from round 1). Log: `q7hn-probe-head.log`.
   - X4-P15 / X4-P16, icon search: focus is `cond.icon-search`, and the typed text "sk" lands. Round 1 at 8af4f9a: focus "+ Add", "".
   - X4-P17, custom colour: focus is `<input type="color">` with no `change`, the same state as a cancelled chooser. Round 1: "+ Add".
   - X4-P05: header and row-name clicks land focus on `cond.add` (INFO-2).
   - X4-P01/P02/P03: focus is "Save Ends" / "glow" / "Color #1e8449", no ring.
   - P04, P06, P07, P08, P11, P12: same results as round 1. Listeners go from 1 to 4 on open and back to 1 after close, twice.
2. **Vacuity** (private worktree; only `:182` replaced with an unconditional `this.closeAdd()`, diff in `q7hn-vacuity.diff`):
   - jest: 2 failed of 77, the icon-search and custom-colour tests (`q7hn-vac-jest.log`).
   - e2e: COND-E06 FAIL, "Expected: focused, Received: not focused" (`q7hn-vac-e2e.log`, bundle `q7hn-vac-bundles/COND-E06/`). Probes P16 and P17 showed focus on "+ Add".
   - Extra mutation: with `focused === doc.body` dropped, the INFO-2 pin fails (`q7hn-mut-body-jest.log`). All three new jsdom tests guard something real.
3. **LOW-1:** `:169` captures `doc`. The mousedown, mouseup and capture-click listeners and the timer's `doc.defaultView` all use it, and the round-1 per-event `activeDocument` reads are gone.
4. **Rebase:** `git range-diff 3480231..8af4f9a c03db7a..349d115` gives `=` for all three commits. The fixer reports a byte-identical pre-fix build. COND-E04/E05 pass in the full run under SC-456's fence check.
5. **Scope:**
   - `git diff --stat 349d115..e31e1a0` lists only the manifest, the e2e spec, ConditionsModal.ts and the jsdom test. No CSS.
   - No commit in `c03db7a..e31e1a0` has a Claude/AI trailer.
   - `cond.icon-search` follows the conventions: `stampControl` at `:366`, a manifest row at `e2e/manifest/conditions-modal.ts:17-18` (`click`, SC-474), and the COND-E06 drive. The jest census and the e2e coverage gate (64/64) pass.

## Hygiene
- Shared dse and superproject worktree status is identical before and after (`q7hn-status-{before,after}-{dse,super}.txt`), and the dse head is still `e31e1a0`.
- The private worktree is removed and no processes of mine are left. I used no lifecycle port, since I did not run lifecycle.

## Evidence
All files are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-rereview-r1-q7hn/`:
- gates: `q7hn-tsc.log`, `q7hn-lint.log`, `q7hn-jest.log`, `q7hn-e2e.log`
- probe spec and run on the head: `q7hn-probe.e2e.ts`, `q7hn-probe-head.log`
- vacuity: `q7hn-vacuity.diff`, `q7hn-vac-jest.log`, `q7hn-vac-e2e.log`, `q7hn-vac-bundles/COND-E06/`
- extra mutation: `q7hn-mut-body-jest.log`
