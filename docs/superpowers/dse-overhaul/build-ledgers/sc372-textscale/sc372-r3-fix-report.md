# SC-372 r3 fix report (each text-size knob applies once)

## Executive summary
- Verdict: DONE. §F1.4 steps 1-5 executed verbatim, plus INFO-1 and INFO-4; SC-422 items, INFO-2, INFO-3 and dse-verify untouched.
- dse branch `sc372-textscale` @ **f6d29ec**, rebased onto origin/develop **0ecb90e** (SC-155; package.json changed, `npm ci` run). Superproject docs commit **51e5d8d** (D3-token-map); submodule pointer not bumped.
- Gates: tsc clean; lint clean; jest 4438 passed / 1 skipped / 220 of 221 suites (base 0ecb90e = 4431, derived: SC-155 changed the featureblockConfig test, and the branch adds 7 tests, all in scaleTokenScope); lifecycle 25/25; shots 568 PNGs, 0 FAIL; `text scale OK (1146 comparisons)`; `text scale once OK (102063 comparisons over 197 loads)`; freeze `OK (274/274)`; parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Frozen bytes moved: NO (0).
- Vacuity: registry CSS removed, gate kept: `TEXT SCALE COMPOUNDS - 12 distinct element(s)`, exactly the 12 lines of r2's gate-nesting-r1.log. Restored: OK.
- Divergence-test bite: `0.85em` -> `0.86em` in the control registry rule fails the test (Expected "0.85em", Received "0.86em"), 1 failed / 6 passed.
- Evidence: 4 PNGs regenerated (BEFORE = develop 0ecb90e, AFTER = branch). "12-16" tier badge does NOT wrap at Small 120%.

## Changes
1. CSS (29998bc): `spec-once-block.css` inserted verbatim after the SC-372 token rule. Token rule, prompt rule and every consumer rule untouched.
2. Tests (29998bc): `scaleTokenScope.test.ts` test 3 rewritten (every other declaration of a scale token is in a rule whose selector is exactly `& > *, &::before, &::after, & :is([data-dse-element], .dse-modal)`); new divergence test (each registry rule declares the full token set of exactly one knob, each value equal to the token rule's `<r>em` coefficient; knobs seen = control, small). F3: `scaleRules.test.ts` and `theme-steel.test.ts:208` now use the line-anchored ROOT_BLOCK regex.
3. Gate (71e24d1): `assertTextScaleOnce(page, manifest)` ported from gate-nesting.mjs (`sweepKnobs` verbatim), called after `assertTextScale`; 3 nested rows added to `TEXT_SCALE_PAGES` (`.dse-pr__badge-text`, `.dse-nt__why`, `button.dse-init__action-toggle`); stale "un-nested" comment replaced; INFO-1 message now prints `x <value>` only when expected != baseline. `text scale OK` count 1104 -> 1146 (the 3 rows).
4. Vacuity: see Executive summary. A first attempt (CSS removed, gate not isolated) also showed the 3 new rows bite: `TEXT SCALE BROKEN` for badge-text 18.66 vs 15.55 expected, `.dse-nt__why`, and `.dse-init__action-toggle` (`logs/r3-vacuity-no-registry-text-scale-rows.log`).
5. Docs (f6d29ec, 51e5d8d): `.repo-docs/font-sizes.md` registry rule; D3-token-map point 4; CHANGELOG sentence appended to the SC-372 [FIX] entry; `tokens.ts` comment now says fourteen tokens (the eight roles plus h1-h6). dse-verify not edited (per ruling).

## Battery (logs/r3-*)
tsc clean · lint clean · jest 4438/1/220 of 221 · lifecycle 25/25 (run because tokens.ts comment changed) · shots 568, 0 FAIL, text scale OK (1146), text scale once OK (102063 comparisons / 197 loads, 69 s in the full run), print-twin delta OK 141 ids, all prior gates OK · freeze OK (274/274) · parity 0/0/24 (last).

## Drive-by fixes:
none.

## Follow-ups:
none new (SC-422 stays out of scope).
