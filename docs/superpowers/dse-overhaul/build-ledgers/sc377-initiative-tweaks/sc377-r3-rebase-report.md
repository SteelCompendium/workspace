# SC-377 R3 - rebase report

## Executive summary

- STATUS: DONE, with one deviation to confirm. dse branch `sc377-initiative-tweaks` is rebased to **`9ad919d`** (27 commits) on **`e0ee273`**, not on `1ac4e5a`. Superproject rebased to **`d90d7a0`** on `origin/main` `5153a9b`; the submodule pointer was not staged.
- Why `e0ee273`: after I rebased onto `1ac4e5a` (clean, one conflict), a fetch showed `origin/develop` had already moved to `e0ee273` (SC-379, negotiation tracker), `origin/main` pins `e0ee273`, and the LIVE freeze baseline is now 268 lines carrying SC-379's changes. On `1ac4e5a` the "0 non-initiative mismatches" check could not pass. `e0ee273` is a plain descendant of `1ac4e5a`, so I rebased once more (clean, no conflicts). The `1ac4e5a` base count is reported too.
- Conflicts: `CHANGELOG.md` only (dse, on commit `6bcb66d`), and `CHANGELOG.md` only in the superproject (on `cd513f5`). Both sides added bullets at the top of the same list; resolved by keeping both. No source conflicts.
- Gates at `9ad919d`: tsc/lint clean; jest 4367 passed / 1 skipped (3 of 3); lifecycle 25/25; shots 568 / 0 FAIL, twice identical; title line stable OK (52), turn-mark parity OK (20), chrome / button / input host-leak OK; parity 0 / 0 / 24 (same as base).
- Freeze against the LIVE baseline: `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`, all 38 `initiative*`, 0 elsewhere. No other id embeds the tracker.
- `rebaseline.txt` regenerated (38) and `widening.txt` (6): 19 of 38 and 3 of 6 hashes changed, all of them the `--steel-print` twin lines, caused by SC-127's twin change; every `--steel-realprint` hash is unchanged. 0 collisions with the live baseline.
- Real Obsidian rest state matches the approved look.

## Rebase

- dse: `git fetch origin`; `git rebase 1ac4e5a` -> conflict in `CHANGELOG.md` at `6bcb66d` (develop added the SC-378 bullet at the top of "7.0.0 (unreleased)", this branch added the SC-377 bullets at the same spot) -> kept both, develop's first; the 26 other commits applied (styles-source.css auto-merged). Then fetched again, saw `origin/develop` = `e0ee273`, and `git rebase e0ee273` -> no conflicts. `package.json` gained only a `gen-light-island` script line (no dependency change), so no `npm ci`. `rm -f main.js styles.css` before every jest run.
- Superproject: `git rebase origin/main` -> conflict in `CHANGELOG.md` at `cd513f5` (main added the SC-379 / SC-378 / SC-385 bullets under `## Unreleased`; ours is one bullet) -> kept both. `DESIGN.md` auto-merged. The working tree still shows ` M draw-steel-elements` and ` M steel-etl` (the latter is the stale submodule checkout in this worktree, not mine); neither was staged.

## Base numbers (detached checkouts at absolute scratch paths, removed afterwards)

Run out-of-tree, so three location-sensitive tests skip (4 skipped instead of 1; see the dse-verify note on `token-coverage.test.ts`):
- `1ac4e5a`: `Tests: 4 skipped, 4251 passed, 4255 total`, 214 of 215 suites.
- `e0ee273`: `Tests: 4 skipped, 4306 passed, 4310 total`, 215 of 216 suites. In-tree equivalent 4309 passed / 1 skipped.
- This branch adds 58 tests: 4309 + 58 = 4367 (matches).
- Parity on detached `e0ee273`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. The branch changes nothing under `visual-harness/parity/`.

## Gates at 9ad919d (printed)

| gate | result |
|---|---|
| tsc / lint | clean / clean |
| jest | `Tests: 1 skipped, 4367 passed, 4368 total`, `Test Suites: 1 skipped, 215 passed, 215 of 216 total`; 3 consecutive runs, same |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (develop added no scenarios) |
| shots | 568 PNGs (556 + 12 SC-379 captures), 0 FAIL, two runs identical; `title line stable OK (… 52 comparisons over 13 cases x dark/light, 8 of them wrapped …)`; `turn mark parity OK (… 20 comparisons …)`; chrome host-leak OK; host-copy pin OK; button host-leak OK (112 kinds, 672 comparisons); input host-leak OK (14 kinds, 164 comparisons); print-twin delta OK (141 capture ids, max drift 2.00px) |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |
| freeze (live baseline, 268 lines) | `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`; 0 non-`initiative*` |

## Deliverables

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc377-initiative-tweaks/rebaseline.txt` - 38 lines, `initiative*` twin + realprint; hashes identical across the two clean shots runs. Previous version kept as `rebaseline.txt.pre-r3`.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc377-initiative-tweaks/widening.txt` - 6 lines (`initiative-named`, `initiative-named-narrow`, `chrome-initiative-menu`, twin + realprint), additions-only, 0 name collisions with the live baseline. Previous version kept as `widening.txt.pre-r3`.
- Changed versus the previous files: rebaseline 19 of 38; widening 3 of 6. Every changed line is a `--steel-print` (twin) line; all `--steel-realprint` lines are byte-identical. Cause: SC-127's sanctioned twin rebaseline (the print-preview twin now renders on SC-127's light island), which moved all 131 twin lines in the baseline. Verified two ways: (1) a detached `e0ee273` checkout reproduces the live baseline for all 38 `initiative*` lines (38/38 OK), so the base is clean; (2) for `initiative-fight`, `initiative-squads`, `initiative` and `initiative-narrow` the twin and the realprint differ from the `e0ee273` render in exactly the same region (e.g. `initiative-fight` both (14,66)-(1508,618)), and the 2 taller ids grow by the same 74px / 22px in both, i.e. the SC-377 layout change and nothing else.
- Other ids absent from the baseline (not mine, still the SC-381 four): `feature-ability-provenance`, `feature-trait-provenance`, `featureblock-narrow`, `statblock-narrow` (twin + realprint).
- Note for the sanction: the visual change Scott approved is unchanged; the 19 twin hashes now sit on SC-127's new twin rendering, so these are new bytes for the same SC-377 look.

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc377-initiative-tweaks/r3/`)

- `sc377-r3-print-before-develop-e0ee273-initiative-fight-print.png` / `-realprint.png` - `initiative-fight` on develop `e0ee273` (before; "Round 3" in the bar, Malice at top right, no title).
- `sc377-r3-print-after-tip-initiative-fight-print.png` / `-realprint.png` - same id at the tip (after: "Round 3" beside "Heroes", "Malice: 7" at left, black-on-white twin).
- `sc377-r3-obsidian-whole-tracker-rebased-steel-dark.png` - real Obsidian 1.14.4, 1020px, named mid-fight (Frodo winded with a silver seal, Samwise dying with an empty ring, Meriadoc empty ring, Peregrin silver seal, Mordor Forces silver seal, Nazgul empty ring), stepper, quick-add and title as approved; no notice or dialog.

## Housekeeping

- Detached base worktrees (`1ac4e5a`, `e0ee273`) and the temporary backup branch removed; no processes left; nothing pushed, no tags.
