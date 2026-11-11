# SC-576 r3 fix report

**Executive summary**
- DONE. Plugin branch `sc576-reset-encounter-display`, final sha `8645685a` (2 new commits on `2b1525ba`: `fddfb7b3` fix, `8645685a` test). `origin/develop` still `97a9c93b`, no rebase needed.
- All 5 findings folded (MEDIUM-1 via option (b), MEDIUM-2, LOW-1, LOW-2, INFO-1). Reset note bytes re-proved identical (3 fixtures, byte-identical to pre-fix output; `[X01]` green; new REFS test pins that merged keys are not written).
- Gates on the final head: tsc/lint clean · jest 7053 passed / 1 skipped / 259 of 261 suites + 1 SC-568 timeout (`twin-reuse` SC-547; alone 53/53, so 7054 effective; +3 tests) · lifecycle 52/52 (21+16+9+4+2, five separate calls, private `DSE_CAMERA_TMP` each) · e2e `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` (INIT-X05 ok, X06 ok, X07 known-bug SC-575) · shots 592, 0 FAIL, host-leak 163 / 978, capture clip 147 · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- No marker flipped (SC-575, SC-588, SC-590 untouched).

## What changed
- **MEDIUM-1** (`src/elements/initiative/view.ts`): `rebuildFromWrittenReset` no longer falls back to the un-normalised model. A throw in `parse` (stage `render`) or `resolveInitiativeRefs` (stage `reference`) is wrapped in `ElementStageError` and stored in a new private `loadError`; `update()` then runs, and `onMount` draws `renderErrorCard(root, {id:'initiative', name:'Initiative tracker'}, loadError)` (the card a reload draws). `chromeItems()` returns `[]` while `loadError` is set (no Reset on a stale model). A successful re-parse clears it. Option (a) not used, as ruled. Note: the card def is a literal (`definition.ts` imports `view.ts`, so importing it would cycle).
- **LOW-1**: `inert` + `aria-busy="true"` set on the root at the start of `rebuildFromWrittenReset`, removed in `finally` (from the captured root and the current `rootEl`, which may differ after host adoption). I did NOT add the "skip the await when there are no `statblock` refs" shortcut: it would skip `resolveInitiativeRefs`'s validation and fills and make the ref-free path differ from what the reviewer verified byte-for-byte; the ref-free window is microtasks and the root is inert for it too.
- **LOW-2**: `rebuildAndPersist` doc comment no longer lists Reset Encounter; points to `rebuildFromWrittenReset`.
- **INFO-1**: bullet in the plugin `CHANGELOG.md` under `## 7.0.0 (unreleased; previously numbered 6.0.0)`, first in the list: screen fix plus "damaging a hero by 5 right after a Reset wrote `current_stamina: -5` instead of 25". Workspace CHANGELOG untouched.
- **MEDIUM-2** (`e2e/specs/initiative/reset-encounter.e2e.ts`): INIT-X05 now also asserts before Reset that Bruno's `init.hero.turn` is `aria-pressed="true"`, then after Reset `Round 1`, `Malice: 0`, and Bruno's turn `aria-pressed="false"` (rich.md is round 2 / Malice 4 / Bruno spent), so a "write, never rebuild" implementation fails it.

## Tests (jest, `test/dom/elements/initiative-matrix.test.ts`; `mount()` gained an optional `vault` arg that seeds `statblock:` notes and switches that mount to real timers, because the vault read does not settle under fake ones)
- `[X05]` statblock-built tracker: after Reset it shows 2 cells, `80/80`, `40/40`, and the written hero stays `{statblock: ...}` (merged name/max_stamina not leaked).
- `[X05]` broken statblock (reviewer's P4 shape): 1 write, `.dse-error-card`, `data-dse-error-stage="reference"`, message names the Orc Warrior, no roster cells, no `data-state="dying"`, no hero stamina controls, no `inert` left.
- `[X05]` inert/busy window (P5 shape, gated `resolveBarePath`): `inert` and `aria-busy` while held, both gone after, tracker rebuilt with 2 cells. (jsdom does not block clicks on `inert`, so it asserts the attributes; the real-Obsidian block is the browser's.)
- Mutation check: with `view.ts` reverted to `2b1525ba`, the broken-statblock and inert tests fail; the merged-names test passes on both (expected).
- Net jest vs 7050 baseline: +3 tests.

## Bytes
Scratch jest (deleted after) with the same three fixtures as r1 (rich live encounter, two-squad group, bare group): `bytes-r3.json` is byte-identical (`diff` exit 0) to r1's pre-fix `bytes-old.json`, one write each.

Drive-by fixes: none.
Follow-ups: none new.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-impl-r3-w4n8pd/`)
`tsc.log`, `lint.log`, `static.rc`, `jest-matrix.log`, `jest-mut.log` (mutation), `jest.log`, `jest-twin.log`, `lc1.log`..`lc5.log` (+ `.rc`), `e2e.log`, `shots.log`, `freeze.log`, `parity.log`, `bytes-r3.json`, `bytes-r3.log`. Bytes baseline: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-impl-r1-k7q2xz/bytes-old.json`.
