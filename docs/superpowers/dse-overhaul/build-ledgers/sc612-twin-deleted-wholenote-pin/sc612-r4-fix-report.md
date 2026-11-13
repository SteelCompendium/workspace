# SC-612 r4 fix report (impl-r2 resumed)

**Executive summary**
- STATUS DONE. Rule P implemented as ruled: a twinned pin is placed only when the head-first answer is the UNIQUE cheapest placement of its block (capped Myers `editDistance` factored out of `mapLineOf`, no O(n*m) DP); `mapLineGreedy` / `greedyDissents` and their tests removed; `strictPins` keep the SC-607 tail-first check and get P when twinned.
- dse tip `a06dba37` (the last two commits are comment and title edits after the gates; tsc and the two touched jest files re-run green) on origin/develop `1516f894`; superproject `d9bca0ec` (one CHANGELOG commit) on origin/main `4cfac4bf`. No pointer commit.
- Gates (rebased): tsc + lint clean; jest 11773 passed / 2 skipped (base 11692 + 81); lifecycle 62/62 in 7 parts (183 / 324 / 404 / 297 / 392 / 296 / 68 s; part 5 first run had the known G-S91 flake, re-run alone 7/7); e2e `328/331 ok, 0 failed, 3 known-bug, coverage 174/174`; styles.css `a6c57131…5167` = a clean 1516f894 build, so shots / freeze / parity carry.
- r3 fuzz on this build (234,064 cells): twinned-ambiguous writes 0 (r3 tip 212), new unambiguous refusals 0 (r3 tip 508), 0 corrupt, 0 refusal without an edit, 0 next-round failures.
- Mutants 17 (adapted to P): 15 killed, 2 equivalent (P6 lower-bound prune, P17 tail trim in `editDistance`: optimisations).
- Red-on-base (c0995beb source / bundle): 31 failures in the new files; G-S108 (a)-(g) and (l)-(o) FAIL at a c0995beb bundle, (h)-(k) green. Red on the previous tip (rule R, 1a8f624c): 16 failures (H1, H1b, M1, M2, M3, M6, sweep, fuzz).
- Cost inside `vault.process` (twin note, 5000 lines, 198 edits): 7.94 ms vs base 3.28 and r2 tip 9.99; non-twin 5.02 vs base 3.27.

## Finding -> change -> test
| finding | what changed | pinned by |
|---|---|---|
| HIGH-1 wrong-block write, a counter of another value next to the twins (greedy another-body exemption) | `pinnedTarget`: twinned pin -> `placedUniquely` (unique cheapest placement among line-identical blocks or deleted); no exemption, no greedy | jest H1, H1b, H1c (form+card, refused); sweep layouts `twin-blank+diff-below/above`, `triple+diff`; fuzz; G-S108 (l)-(o) real Obsidian RV+LP form+card (red at c0995beb, green now) |
| HIGH-2 new unambiguous refusals (tail-first / greedy null on split blocks) | tail-first check only for `strictPins` as in SC-607; P prices whole blocks | jest M1, M2, M3, M6 (form+card, saved; red on the R tip); sweep: "refused although the one cheapest placement is the block" (also layout `tight-diff-neighbour`); fuzz same assertion |
| MEDIUM-1 sweep narrower than claimed | 4 new layouts (14 total); refusal must be a tie, a gone / edited block, or a head-first miss; totals re-pinned (cells 10966, checked 10264, ambiguous 2288, saved 6003, refused 4029, other 934); the seeded fuzz ported as a second sweep (3 seeds x 3000 notes, ~9 s, per-seed totals pinned); guarantees restated as "on the sweep's layouts / fuzz" in the doc comment and proposal | sweep + fuzz test files |
| LOW-1 CHANGELOG wording | reworded per r3's example ("refused when ... an identical counter was added or removed beside yours ... An edit elsewhere ... does not cause a refusal") | CHANGELOG.md `d9bca0ec` |
| LOW-2 "pays nothing" | doc comment: every pinned write counts the known body in two scans (`twinned`); a note without twins runs no placement and is never refused by the rule | `pinnedTarget` doc comment |
| LOW-3 unterminated trailing fence + closed copy above | not removed by P as written: the head-first map names the COPY (base wrote the copy: a different-block write), P refuses (the unique cheapest placement is the pinned block further down). Test pins the refusal; recorded as P residual 4 | jest "pinned UNTERMINATED trailing fence ... CLOSED copy" (form+card; red at base, which writes the copy) |
| (added) cap behaviour | a placement the capped diff cannot price keeps the head-first answer (residual 2) | jest T14 (kills the "cap not honoured" mutant) |
| (added) strict pins | M9-style: P also for twinned strict pins | drawn-pin test (kills P7) |

## Cost inside `vault.process` (jsdom, form Save, median of 21; `sc612-r4-timing.log`; edits = total, half above / half below)
| note | edits | base 1516f894 | r2 tip (rule R) | r4 (rule P) |
|---|---|---|---|---|
| 2000 twin | 20 | 1.38 | 3.05 | 3.40 |
| 2000 twin | 100 | 1.40 | 4.08 | 2.91 |
| 2000 twin | 198 | 2.70 | 7.34 | 4.66 |
| 5000 twin | 20 | 2.41 | 4.61 | 5.12 |
| 5000 twin | 100 | 2.63 | 5.92 | 6.06 |
| 5000 twin | 198 | 3.28 | 9.99 | 7.94 |
| 2000 non-twin | 20 / 100 / 198 | 1.51 / 2.18 / 2.08 | 2.54 / 1.84 / 2.57 | 2.54 / 1.97 / 2.59 |
| 5000 non-twin | 20 / 100 / 198 | 2.47 / 2.70 / 3.27 | 3.74 / 4.16 / 4.78 | 3.65 / 4.14 / 5.02 |
(The non-twin overhead is the `twinned` count, unchanged by P; the twin note runs the placement.)

## Fuzz (r3's generator + classifier, seeds 1-3 x 20000 notes, `sc612-r4-fuzz-summary.txt`, per seed `sc612-r4-fuzz-class-r4-s{1,2,3}.txt`)
twinned-ambiguous writes 0; NEW-refusal-unambiguous 0; NEW-refusal-without-twins 0; new refusals base->r4 14348, all in oracle-ambiguous cells; 138 writes in ambiguous cells that are NOT twinned (P does not apply: text-identical moves / pastes, N5 / N6; identical to base); refused-no-edit 0; next-round-not-saved 0; CORRUPT 0.
In-repo fuzz (jest, 3 x 3000 notes): same assertions, all green.

## Mutants (`sc612-r4-mutants.log`; each run on whole-pin, sweep, fuzz, lineMap and drawn-pin tests, 897 tests)
P1 no uniqueness test killed (7) · P2 no twin gate killed (3) · P3 non-unique minimum allowed killed (7) · P4 ignore the deleted option killed (19) · P5 cap not honoured killed (2, T14) · **P6 no lower-bound prune SURVIVES (equivalent: an optimisation)** · P7 strict pins skip P killed (1) · P8 candidates by length only killed (12) · P9 trust a non-identical head-first answer killed (5) · P10 deleted costs no block lines killed (34) · P11 only the prefix priced killed (18) · P12 tail-first check for twinned pins again (rule R) killed (9) · P13 prune ties (>= for >) killed (7) · P14 gave-up refuses killed (5) · P15 twin gate on pin.text only killed (6) · P16 twin gate on content only killed (20) · **P17 no tail trim in editDistance SURVIVES (equivalent)**.

## Red-on-base
- c0995beb source (`sc612-r4-red-on-base.log`): 31 failed / 864 passed of 895 in the five SC-612 files (T1/T2, T3, T4, T5b, T6, T6b, T13, H1, H1b, H1c, the unterminated test, editDistance (function absent), sweep, fuzz x3, the drawn-pin strict test); T5, T7-T12, M1-M6 and T14 are green at base by design (controls / safe cases).
- Previous tip, rule R (1a8f624c, `sc612-r4-red-on-r2tip.log`): 16 failed of 72: H1, H1b, M1, M2, M3, M6 (form+card), sweep, fuzz x3.
- Lifecycle G-S108 on a c0995beb bundle (`sc612-r4-red-on-base-lifecycle-gs108.log`): (a)-(g) and (l)-(o) FAIL, (h)-(k) pass. (Base for jest and bundle: c0995beb; the dse files these tests touch are the same at 1516f894.)

## Gates, rebased onto 1516f894 (logs `sc612-r4-gate-*.log`)
tsc + lint rc 0 / rc 0 · jest 11773 passed / 2 skipped, 86 s (a first run on a stale `main.js` gave the same numbers, kept as `...jest-0-stale-bundle.log`; the reported run is after `rm` of main.js / styles.css) · lifecycle part 1 21/21 183 s, 2 16/16 324 s, 3 9/9 404 s, 4 4/4 297 s, 5 7/7 392 s (run 1: G-S91 "title rv: 700 ms after the second press the preview was gone", the known SC-616 flake, `...part5-run1-G-S91-flake.log`; re-run alone green), 6 4/4 296 s, 7 1/1 68 s (G-S108, 15 cells) · e2e 328/331 ok, 0 failed, 3 known-bug, coverage 174/174, 206 s · styles.css `a6c57131ab692a3c0d13135369fbe67cbbff6081385d0009d0c6bb4203405167` equals a clean 1516f894 export build (`sc612-r4-gate-e2e.log` end; scratch export build in `.../sc612-r4-impl/clean-1516f894`) so shots / freeze / parity carry (not run).

## CURRENT block (proposal)
dse `develop` @ `1516f894` + SC-612 (branch tip `a06dba37` (the last two commits are comment and title edits after the gates; tsc and the two touched jest files re-run green); a form Save or card + / - on one of two identical blank-line-separated counters of a note open in its own pane is refused with the "changed on disk first" Notice when the note cannot tell which was meant (rule P: the head-first placement is accepted only when it is the unique cheapest placement of the block, `editDistance` capped at LINE_MAP_MAX_EDITS); never written into another counter on the sweep's 14 layouts and the seeded fuzz; SC-621 filed for the `rebaseCardPin` residual; new lifecycle G-S108, part 7):
tsc and lint clean · jest **11773 passed / 2 skipped** in a fresh worktree (11692 + 81) · lifecycle **62/62** (21 + 16 + 9 + 4 + 7 + 4 + 1; 183 / 324 / 404 / 297 / 392 / 296 / 68 s; G-S108 is part 7) · e2e **`328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** · styles.css `a6c57131…5167` = a clean 1516f894 build, so shots / freeze / parity carry. Fuzz 234,064 cells: 0 twinned-ambiguous writes, 0 new unambiguous refusals. Mutants 17: 15 killed, 2 equivalent.

## Drive-by fixes
- Sweep `edit-pinned` now sets the pinned value to `pv + 3` (was a fixed 8, which collided with the card's `pv + 1` for a counter of value 7 in the new layouts). Test-only, local.

## Follow-ups
- SC-621 untouched. LOW-3's literal "saves" is not met (a safe refusal; residual 4 in the proposal).
- Pre-existing false refusal (not this rule's, base-identical): a counter of another value pasted directly above the pinned block with only blank lines between (residual 5).
- 138 fuzz writes in oracle-ambiguous cells without a twin (N5 / N6) = base behaviour; no rule here can see them.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/)
sc612-r4-fix-report.md · sc612-dse-verify-proposal.md (rewritten for rule P) · sc612-r4-mutants.log · sc612-r4-red-on-base.log · sc612-r4-red-on-r2tip.log · sc612-r4-red-on-base-lifecycle-gs108.log · sc612-r4-timing.log · sc612-r4-fuzz-summary.txt · sc612-r4-fuzz-class-r4-s{1,2,3}.txt · sc612-r4-fuzz-run.log · sc612-r4-gate-{tsc-lint,jest-1,jest-0-stale-bundle,e2e}.log · sc612-r4-gate-lifecycle-part{1..7}.log · sc612-r4-gate-lifecycle-part5-run1-G-S91-flake.log · sc612-r4-gate-lifecycle-gs108-try1.log
