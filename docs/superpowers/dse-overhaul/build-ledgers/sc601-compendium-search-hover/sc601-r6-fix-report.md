# SC-601 r6: fix round report

## Executive summary

- DONE. dse branch `sc601-compendium-search-hover` HEAD **`231f2a3b`**, plain-rebased onto develop **`3ad68185`** (SC-610), no conflict. Superproject branch HEAD **`598579d7`**, plain-rebased onto workspace `origin/main` `d0ca9bf0` (one CHANGELOG conflict, resolved: our bullet put first, the convention is newest first; nothing of other efforts dropped). The dse pointer is not staged and `git submodule update` was not run.
- LOW-1 fixed: G-S96's `return` restored to the base text. Byte check: all 59 base SCENARIOS entries (G-S92, G-S96, G-S56 among them) are byte-identical to `3ad68185`'s; only G-S97 is new; the file diff is 253 added / 0 removed.
- LOW-2 fixed: a block-command twin of the activeEditor write-target test. Mutant **R2c killed** (1 test; 202 -> 203 tests, 1 failed), R2b and R2 and M5 killed too.
- Gates on `3ad68185` + branch: tsc / lint 0 / 0; jest **10712 passed / 1 skipped** (10676 + 35 = 10711 fresh-equivalent with 2 skipped; the 1 skipped is because `visual-harness/dist/obsidian-app.css` is cached from a shots run); lifecycle **60/60** as 21 / 16 / 9 / 4 / 7 / 3; e2e `278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs`; shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280; parity 0 / 0 / 24.
- Part 6 (`G-S92,G-S96,G-S97`): 230 s with build. G-S96's ok line now ends `... outside edit kept)`, no "; no page error".
- Void: the earlier part-6 run and the jest run on `c6077860` (lifecycle part 6 3/3 230 s, jest 10660 / 1 skipped) were superseded by the `3ad68185` runs; nothing from `c6077860` is reported as a gate.
- Drive-by fixes: none.

## 1. LOW-1: G-S96 return, and how I checked

The 3-way apply in r4 had swapped G-S96's `return` (`return outcomes.join('; ');`) with G-S56's tail (`return \`${outcomes.join('; ')}; no page error\`;`) in the merged text. Restored at the G-S96 return line (commit `40a96851` on the final branch).

Method (script `S/scen-compare-3ad.py`): read `git show 3ad68185:visual-harness/obsidian-lifecycle.mjs` and the worktree file; cut the `SCENARIOS` array body; split it into entries (a line `\t{` through the next line `\t},`), key each by its `id: '...'` line; compare every base entry with HEAD's as an exact string. Result: 59 base entries, 60 HEAD entries, `only in head: ['G-S97']`, `only in base: []`, `entries that differ: []`; G-S92 5610 = 5610 bytes, G-S96 4780 = 4780, G-S56 11719 = 11719; order tail `G-S91, G-S92, G-S96, G-S97, G-S56`. `git diff 3ad68185 --numstat -- visual-harness` = `253 0`. The same script run against the previous commit (`ee113341`) reports `entries that differ: ['G-S96']` (4780 vs 4800 bytes), so it detects the defect it is there for.

## 2. LOW-2

`test/dom/authoring/compendiumSearchHoverPreview.test.ts` (33 tests now): "block command: a live preview editor and a different live active editor: the snapshot lands in the captured editor only" (picks GOBLIN, waits for the awaits with `flush` and `until`, expects 1 write in the captured editor, 0 in the host, no Notice).

Mutants (runner `sc601-r6-mutate.py.txt`, run on `3ad68185` + branch over the three suites, 203 tests; summary `sc601-r6-mutants-summary.txt`):

| Mutant | Result |
|---|---|
| R2 (both commands re-target `activeEditor`, checks kept) | KILLED, 2 failed |
| R2b (reference command only) | KILLED, 1 failed (the reference test) |
| R2c (block command only, `compendiumInsert.ts` `dispatchBlockChoice` call) | KILLED, 1 failed (the new block test) |
| M5 (both, checks dropped) | KILLED, 7 failed |

Sources were restored after the run (`git status` showed only the intended test/lifecycle changes). The r4 table of the other 21 mutants is unchanged (no src change).

## 3. Commits (dse, on `3ad68185`)

`d90f9c0f` fix; `5a3eea94` jest (25); `bf9c9e55` late re-check + ported tests; `2852f6ac` early-check assertion; `4aba98d9` G-S97 (9 trials); `40a96851` restore G-S96 return; `231f2a3b` block-command activeEditor test. All shas changed again with the rebase.

## 4. Superproject rebase

- `git fetch origin` then `git rebase origin/main` in the worktree: CHANGELOG.md conflicted under `## Unreleased` (main added SC-610's bullet and others); resolved by keeping every bullet and putting the SC-601 bullet first (newest first, as the file's existing order shows). Commit `598579d7`.
- `git status --short`: ` M draw-steel-elements` (the unstaged pointer only).
- `git submodule status`: `compendium` main, `data-gen` and `data-sdk-npm` on `heads/sc601-compendium-search-hover`, `+231f2a3b... draw-steel-elements`, `statblock-adapter-gl-pages` main, `steel-etl` `1b57338`, `steelCompendium.github.io` main, `v2` main. Only draw-steel-elements shows `+` (expected: it is on our branch). No other submodule differs from its pin, so no `submodule update` was run.

## 5. Gate numbers (all on `3ad68185` + `231f2a3b`)

- tsc rc 0, lint rc 0 (`tsc-r6b.log`, `lint-r6b.log`).
- jest full: `Tests: 1 skipped, 10712 passed, 10713 total`, 266 suites passed, rc 0.
- lifecycle, all six parts, 60/60: part 1 21 / 184 s; part 2 16 / 326 s; part 3 9 / 404 s; part 4 4 / 298 s; part 5 7 / 401 s; part 6 3 / 230 s. Every part `0 failed`.
- e2e: `OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (133 s).
- shots 592 PNGs; `button host-leak OK (163 ... 978)`; `modal button host-leak OK (... 39 button kinds ... 234)`; `capture clip OK (147 ...)`; freeze `280/280`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## 6. Evidence (absolute paths)

`S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r2-adc7b64beb5b40fd5`: `S/tsc-r6b.log`, `S/lint-r6b.log`, `S/jest-r6bfull.log`, `S/jest-r6t1.log`, `S/mutate6-run.log`, `S/mutants6-summary.txt`, `S/mut6-*.log`, `S/mutate6.py`, `S/lc-r6b-p1.log` .. `S/lc-r6b-p6.log`, `S/r6be2e.log`, `S/r6bshots.log`, `S/r6bfreeze.log`, `S/r6bparity.log`, `S/scen-compare-3ad.py`, `S/scen-compare-old.py` (the check run against `ee113341`, shows the defect). Voided (c6077860): `S/lc-r6-p6.log`, `S/jest-r6full.log`.

sdd dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/`: this report, `sc601-skill-proposal.md` (updated), `sc601-r6-mutants-summary.txt`, `sc601-r6-mutate.py.txt`.

## Drive-by fixes:

None.

## Follow-ups:

None.
