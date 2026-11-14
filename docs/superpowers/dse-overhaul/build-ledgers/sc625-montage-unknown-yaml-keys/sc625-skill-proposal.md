# SC-625: proposed `dse-verify` SKILL.md changes (owners do not edit SKILL.md)

Each block names the line of `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` it replaces (line numbers as read 2026-11-14, SKILL at workspace `8dd3c4a4`). Numbers are measured on the r3 branch (dse `76520b1f`, on `develop` `8a81c5a7`).

## 1. Line 31 (battery table, step 4b, the e2e row): three edits inside the one cell

1. Replace `(today `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`, since SC-439 (`
   with `(today `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`, since SC-625 (+4: MONT-X11..X14, no new pair; the 2 flipped markers count as ok; the 2 SC-625 markers MONT-X09 and MONT-X10 are plain tests); 478/500 since SC-439 (`
2. In the "known bugs" list at the end of the same sentence group, replace `known bugs SC-257, SC-355, SC-384, and since SC-438 SC-625 x2, SC-627, SC-628 x2, SC-629 (SC-626 fixed)`
   with `known bugs SC-257, SC-355, SC-384, and since SC-438 SC-627, SC-628 x2, SC-629 (SC-625 and SC-626 fixed)`.
3. No change to the history entry `new known bugs SC-625 x2, SC-626 x4 ...` (it is history).

(Measured: ok = 478 + 2 flipped + 4 new = 484, total = 500 + 4 = 504, known-bug 22 - 2 = 20.)

## 2. Line 202 (Montage e2e notes): the marker list

Replace
`jsdom `test.failing` markers for montage bugs: SC-625 x2, SC-631 (SC-626's `[K03]` is a plain test since SC-626; `test/dom/elements/montage-matrix.test.ts`).`
with
`jsdom `test.failing` markers for montage bugs: SC-631 (SC-625's `[K01]`/`[K02]` and SC-626's `[K03]` are plain tests; `test/dom/elements/montage-matrix.test.ts`). A montage write keeps the keys the montage does not read (SC-625): `model.ts` carries them as own properties of the model and of each entry, so never put a non-schema own property on either (`serialize` would write it into the note).`

## 3. Lines 1526-1530 (the CURRENT paragraph under "Current expected numbers"): replace the CURRENT block, demote the old one

Demote the existing `**CURRENT — dse `develop` @ `8a81c5a7` ...` paragraph to `**PREVIOUS — ...`, and add above it:

`**CURRENT — dse branch `sc625-montage-unknown-yaml-keys` @ `76520b1f` on `develop` `8a81c5a7` (2026-11-14, before landing; replace the sha with the landed `develop` sha; SC-625: any write of a `ds-montage` block kept only the keys the montage reads, deleting a Director's own top-level keys and the extra keys on a logged action; `src/elements/montage/model.ts` only (about 60 lines): the unknown keys are carried as own properties of the model and each entry and written back after the known keys, in their original order; `participants:` items already kept theirs; the 2 e2e `knownBug('SC-625')` markers MONT-X09/X10 and the 2 jsdom `test.failing` markers `[K01]`/`[K02]` are plain tests; new e2e MONT-X11..X14, new jsdom X09 (7 write paths), X10, X11 (4 paths), X12 and 11 unit tests; CHANGELOG bullet; no lifecycle id used):**
tsc and lint clean · jest **12576 passed / 1 skipped** with the shots cache (fresh worktree: **12575 passed / 2 skipped**, 12551 + 24) · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`** · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0 / 0 / 24 carried (`styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on a clean `8a81c5a7` build and on the branch build, identical; so shots, freeze and parity were not re-run). Numbers measured by the SC-625 implementer.`

The with-shots-cache jest figure (12576 / 1) is the fresh figure plus one, as the line 29 note says; the implementer measured only the fresh worktree (12575 / 2).

## 4. The `--only=` footgun (a new bullet, next to line 201, the "Running a lifecycle part (SC-594)" bullet)

Add: `- Lifecycle flag syntax (SC-625): the filter is `--only=A,B,C` with an equals sign. `--only A,B,C` (a space) is silently ignored and the runner runs every scenario (about 30 min on a loaded host), so a "part 1" call ends up as the whole suite. Check the first lines of the log: a part must print only its own scenario ids.`
