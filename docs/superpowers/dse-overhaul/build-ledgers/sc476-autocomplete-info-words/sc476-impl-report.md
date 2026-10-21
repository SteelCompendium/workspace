# SC-476 fix round 1 (summary, <=10 lines)
STATUS: DONE. Plugin head `aaa88b7` (on `37d625c`, one commit); superproject `27092fe` (amended; still ONE CHANGELOG-only commit).
- LOW-1: dropped `.toLowerCase()` in `scanFenceState` (language = first token, case kept); doc comment updated; mixed-case pin flipped to `DS-Counter`.
- LOW-2: a backtick-marker line whose info string contains a backtick is not an opener (skipped as literal); tilde fences unaffected; pinned.
- MEDIUM-1: both CHANGELOG bullets now use ```` ```ds-stamina-bar extra ```` (each bullet had one occurrence; the unrelated SC-290 `ds-counter extra` entry was left alone).
- INFO-2: real `ds-stamina-bar` tests (extra word == bare opener's keys; wrong-case and backtick-in-info -> no completions).
- Gates: tsc/lint clean; jest 5399 passed / 1 skipped (231 of 232) = 5394 + 5; lifecycle 28/28 (port 9293; 9291 was held by another process); e2e 88/92 ok, 0 failed, 4 known-bug, 64/64.
- Shots/freeze/parity NOT re-run: the harness imports nothing from `src/authoring/` (only `fenceScan` consumers are `suggest.ts`/`schemaSuggest.ts`), so no bundle path to shots changed.

# SC-476 implementer report, round 1

STATUS: DONE. dse branch `sc476-autocomplete-info-words` head `37d625c` (base `e31e1a0`, origin/develop unmoved).
- `504f884` fix(authoring): `scanFenceState` takes the first whitespace-delimited token of the trimmed info string, then lowercases (`/^\S*/.exec(rest.trim())![0].toLowerCase()`), with a comment naming SC-457's `fenceLanguage`. Tests added in `test/dom/authoring/schemaSuggest.test.ts` (10 new tests, 7 of them failed before the fix).
- `37d625c` docs(changelog): `draw-steel-elements/CHANGELOG.md` (7.0.0 section, [FIX] bullet).
- Superproject `c3eca47` (CHANGELOG.md only, `## Unreleased` bullet). Superproject still shows ` M draw-steel-elements` (pointer) uncommitted, per the CHANGELOG-only rule.
- Gates all green; no shots/freeze/parity movement. Numbers below.

## Gates (worktree `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/draw-steel-elements`)
- tsc (incl. `-p e2e`) clean; lint (incl. e2e) clean.
- jest before shots: 231 of 232 suites, 5393 passed / 2 skipped. After shots: **5394 passed / 1 skipped / 5395 total, 231 of 232 suites** (= 5384 + 10 new).
- lifecycle (`DSE_LIFECYCLE_PORT=9291`): `OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
- shots: 572 PNGs, 0 FAIL, host-copy pin OK, button host-leak 112 kinds / 672 comparisons (unchanged).
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.

## Tests (O3), all in `test/dom/authoring/schemaSuggest.test.ts`, `describe('SC-476 ...')`
`scanFenceState().lang === 'ds-counter'` for: extra words, leading space (already passed pre-fix), tab-separated extra word, tilde fence with extra words, callout-prefixed fence with extra words, language alone, mixed case (`DS-Counter extra` -> lowercased). Plus: bare fence -> `''`, outside fence -> `null`; suggest-level key completions (```` ```ds-x extra words ````) and enum completions (`~~~ ds-x<TAB>extra`). Red run before the fix: 7 failed / 16 passed; after: all green.

## O2 finding (case sensitivity)
The authoring scan lowercases; the hosts do not. `parseOpenFenceLine` (`src/framework/host/fenceLine.ts`) keeps `language` as written, `ReadingModeBlockHost` compares it with `===` (line ~136), and `registry.get` (`src/framework/registry.ts` ~281) is an exact-key Map lookup. So a block written ```` ```DS-Counter ```` gets completions from the authoring suggester (the scan lowercases it to `ds-counter`) while the hosts treat the identifier case-sensitively. Whether Obsidian itself dispatches ```` ```DS-Counter ```` to the `ds-counter` processor was not measured. Not fixed (out of scope per O2).

## Other callers / greps
- `src/authoring/suggest.ts:35` uses only `.inFence`: unaffected.
- `schemaSuggest.ts:73-74` is the only consumer of `.lang`.
- No other place under `src/authoring/` derives a fence language from the whole info string.

Drive-by fixes: updated the `FenceState.lang` doc comment in `fenceScan.ts` (it described the old whole-info-string behaviour); same file as the fix.

Follow-ups:
1. Once SC-457 lands, swap the local regex for an import of `fenceLanguage` (mechanical, per O1).
2. O2 case-sensitivity mismatch above (authoring lowercases; hosts/registry exact-case).
3. Worktree had no `node_modules`; I ran `npm ci` in the plugin dir (gitignored, no repo change).

## Artifacts
Gate logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-impl-a1/`: `red.log` (pre-fix jest), `green.log`, `tsc.log`, `lint.log`, `jest1.log`, `jest2.log`, `lifecycle.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`.


# Fix round 1 detail
- New tests (5): backtick-in-info scan pin; tilde-with-backtick row; mixed-case row flipped to expect `DS-Counter`; three real-registry tests (ds-stamina-bar extra == bare keys incl. `max_stamina`; `DS-Stamina-Bar` / `DS-Stamina-Bar extra` give null; backtick-in-info gives null). With the round-1 source restored, 4 of the new/flipped tests fail (case pin, scan backtick pin, 2 suggest-level).
- Lifecycle first attempt with port 9291 exited 2 (`port 9291 already serves CDP`, an environment issue, not a code failure); rerun on 9293: 28/28.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-impl-a1/` `r2-authoring.log`, `r2-red.log`, `r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-lifecycle.log` (exit 2), `r2-lifecycle2.log`, `r2-e2e.log`.
