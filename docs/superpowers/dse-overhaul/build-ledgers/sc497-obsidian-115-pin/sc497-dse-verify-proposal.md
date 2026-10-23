# SC-497 — proposed dse-verify SKILL.md edits (for the dispatcher to apply at landing)

Summary: new CURRENT row; the host-copy bullet's floor, excluded-rule count and expected line; the gallery host-leak
figures (pre-existing drift, tracked by SC-501); and a note on which Obsidian version each gate runs on.

## 1. New CURRENT row (push the d152ea4 row down to PREVIOUS)

**CURRENT — dse `develop` @ `<SC-497 landed sha>` (2026-10-23; SC-497 landed — the shots harness's Obsidian host button copy is re-extracted from 1.15.0 after Obsidian updated itself, `PINNED_OBSIDIAN` 1.14.0 → 1.15.0; spelling-only change, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5769 passed / 1 skipped / 238 of 239 suites** · lifecycle **32/32** · e2e **`OBSIDIAN-E2E done: 104/104 ok,
0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, with `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules … excluded …, 0 unclassifiable …)`, `button host-leak OK (113 … 678 …)` (20-record boundary, see SC-501), `modal button host-leak OK (10 … 9 … 38 … 228 …)` (6-record boundary), no ALLOWLISTED line, `text scale OK (1626 …)`, `text scale once OK (107256 … 214 loads …)`, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning (installed 1.15.0 vs pinned 1.13.7, rc stays 0, SC-376) · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-497 ticket-owner at `6576fd4` (reviewer re-ran shots + freeze + the harness jest suites and matched); the dispatcher relayed, not re-ran.

## 2. "Host-copy pin" bullet (In-run gates inside `npm run shots`)
- Expected line: replace `21 further rules` with `18 further rules` (1.15.0; 1.14.4 read 20).
- Replace `(currently 1.13.7)` with `(currently 1.15.0, SC-497)`. A machine whose newest asar is 1.14.x now prints
  `host-copy pin PARTIAL` — expected, not a failure.
- Add: "1.15.0 ships a minified app.css (`@media(hover:hover)`, unquoted attribute values, `.7` for `0.7`). The copy
  is verbatim, so it keeps that spelling; the comparator is not whitespace-insensitive (SC-276)."

## 3. "Button host-leak sweep" bullet
Add after the SC-356 sentence: "**113 kinds / 678 comparisons with a 20-record boundary as of `d152ea4`** (10
focus-visible disabled, 6 hover zero-sized, 2 hover no hit point, 2 focus-visible no box; measured 2026-10-23 by
SC-497, identical on base `d152ea4` under 1.14.4, so it predates SC-497). The 10 new records are unexplained —
SC-501 tracks confirming them."

## 4. New short note: which Obsidian each gate uses (documented split, not aligned)
"Gates do not share one Obsidian version. Shots' host-copy model is checked against the newest installed asar (floor
`PINNED_OBSIDIAN`, 1.15.0). Shots' host-leak sweeps inject the real app.css pinned by content in
`obsidian-app-css.pin.mjs` (1.13.7; bumping it needs its own sanctioned rebaseline, SC-376). `npm run
obsidian-lifecycle` runs the newest installed Obsidian (1.15.0 since 2026-10-22; SC-478's branch passed 33/33 on
it). `npm run e2e` runs its own pinned Obsidian 1.14.4 (`e2e/README.md`). An Obsidian self-update therefore moves
shots' host-copy check and lifecycle, but not e2e or the app.css sweeps."
