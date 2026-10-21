# SC-456 implementer report (round 1)

**Executive summary**
- STATUS: DONE. Head 9e1b93d (2 commits on base 188755b; no rebase needed, origin/develop was already 188755b). Not pushed.
- Diff touches only `e2e/` and `test/` (O4). main.js + styles.css sha256 identical to base.
- gates: tsc (incl. -p e2e) rc=0; lint rc=0; jest 230 suites passed, 5277 passed / 2 skipped (fresh worktree: base-equivalent 5256 + 21 new); lifecycle 27/27 ok, 0 failed; e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`.
- Mutation probe: with SC-290's emit reverted, the NEW invariant fails RECOV-I01 on its own; the OLD helper passes it.
- O1 resolved by IMPORT of the product `matchFenceMarker`/`stripBlockPrefix` (blockPrefix.ts is dependency-free), no copy of the grammar.

## Design
- New pure module `e2e/driver/noteFences.ts` (no wdio/page imports so jest can load it): `scanFences`, `fencesOf`, `skeletonOf(note, exact=true)`, `integrityProblems`. `invariants.ts` re-exports `fencesOf/integrityProblems/skeletonOf` + types, so `callout-writes.e2e.ts` is unchanged (O5).
- O1: opening/closing recognition via the product's `matchFenceMarker` + `stripBlockPrefix`. The closer rule mirrors `isFenceClose` (src/framework/sidebar/anchor.ts, which imports `obsidian`, so not loadable in the wdio worker); jest pins the mirror to `isFenceClose`, `matchFenceMarker`, `parseOpenFenceLine`, `fenceAlias` on a case table.
- O2: `Fence.lang` = first token of the TRIMMED info string (`` ``` ds-x `` -> `ds-x`).
- O3: exact skeleton placeholder = `<<fence open="<full opening line>" close="<full closing line>">>`; `integrityProblems` additionally reports `fence #i (type) opening/closing line changed: "a" -> "b"` for TARGET fences. Only the body of a target is exempt. `exempt` mode keeps the old prefix+type placeholder (`skeletonOf(note, false)`) so `externalEdit` tests behave as before.
- `dse.ts`: `declareTarget` uses the new `fencesOf`; `readBlock`/`expectNoteBlock` now uses `fencesOf(...).filter(lang)[n].body` (old regex `^((?:>[ ]?)*)```(\S+)\s*$` could not read ~~~, info-string or space-before-type blocks).
- `test/mocks/obsidian-core.ts` `makeFakeContext.getSectionInfo`: uses `matchFenceMarker`/`stripBlockPrefix`; recognises ``` / ~~~ / 4+ runs, quote prefix, info string after the type, space before the type; closer same char, >= length, same quote. Still ds-* only; text returned is the whole note, so the info string is kept.

## Tests (21 new)
- `test/unit/e2eIntegrity.test.ts` (19): ~~~ and 4-backtick-with-inner-``` correct writes -> no problems; longer closer; `` ``` ds-x `` targetable as `ds-x`; type = first trimmed token / bare fence `''`; non-ds example inside ```md is body; target BODY change not reported; target opening line changed (info dropped), reverse, fence-run change reported; target closing line change reported; first-token change reported; sibling body/opening change reported (and declaring it moves the verdict); outside text / fence count / unterminated; exempt; quote-prefix (callout + nested) body ok, opening-line drop reported; closer only in same quote; CRLF byte-exact incl. LF-ified fence lines caught; two agreement tables (open-line vs matchFenceMarker/parseOpenFenceLine/fenceAlias; close-line vs `isFenceClose`, 6 openers x ~35 closers).
- `test/unit/mocks/obsidian-mock.test.ts` (+2): fake context recognises the product fence forms (info string, space-before-type, quote prefix + ~~~, 4-backtick, CRLF) and ignores non-ds / unclosed.

## Gates (measured)
- `npm run tsc`: rc=0. `npm run lint`: rc=0. Logs: scratchpad `tsc.log`, `lint.log`.
- jest (after `rm -f main.js styles.css`): `Test Suites: 1 skipped, 230 passed, 230 of 231 total` / `Tests: 2 skipped, 5277 passed, 5279 total`. Base reading on a fresh worktree is 5256 passed / 2 skipped / 229 passed suites (the extra skip = printTwinDeltaAllowedSet without cached `visual-harness/dist/obsidian-app.css`; O4 skips shots) -> delta +21 tests, +1 suite.
- lifecycle (`DSE_LIFECYCLE_PORT=9301`): `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`.
- e2e full: `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, rc=0. The stricter invariant flagged nothing on the existing suite.
- O4: `git diff --stat 188755b..HEAD` = 6 files, all under `e2e/` and `test/` (378+/107-). sha256 main.js `42f1445cb45163749640192ef5edd3cad7d6cb8706ebf47fabeaf773955d13b0`, styles.css `698d2d07cf15752cce53d838f6c8a228a141448256032899c295da4b717a6727` - identical for base 188755b (git-archive copy, `npm run build-no-check`) and head (same command).

## Mutation probe (not committed; restored, `git status` clean, no `src/` diff)
Reverted `emitOpenFenceLine` to `${open.prefix}${open.fence}${open.language}`; `npm run e2e -- --only=RECOV-I01`:
- A) helpers new, spec as committed: FAIL via the spec's own raw-line assertion (`Expected "```ds-stamina-bar  extra words"`). Log `probe-A.log`.
- B) helpers new, spec's raw-line assertion temporarily commented out: FAIL via the after-test INVARIANT: `Stamina/info-string.md: fence #0 (ds-stamina-bar) opening line changed: "```ds-stamina-bar  extra words" -> "```ds-stamina-bar"` (plus the generic "content outside the block bodies changed" line). Log `probe-B.log`, bundle `.../e2e/.out/20261021-024622-477c/RECOV-I01`.
- C) same spec edit, OLD (188755b) `invariants.ts`/`dse.ts`: `RECOV-I01 ok` - the old check missed the regression. Log `probe-C.log`.

Drive-by fixes: none.

Follow-ups:
- `Callout/list.md`-style fences with 4+ spaces / list indentation are still "not a block" for both product and helper (same grammar by design); nothing to do.
- Behaviour change to note: `readBlock` previously counted a `ds-x` line inside another open fence; it now (correctly) treats it as body.
- The wdio worker now imports `src/framework/host/blockPrefix.ts` (tsx resolved it; e2e run green). If that module ever gains an `obsidian`/DOM import, the e2e driver import breaks - a one-line comment in noteFences.ts documents it as dependency-free; the jest suite would not catch a new import there.
- No e2e/README mention of the integrity check exists; no doc change made.

## Artifacts (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc456-impl-r1/)
`tsc.log`, `lint.log`, `jestfull.log`, `life.log`, `e2e.log`, `probe-A.log`, `probe-B.log`, `probe-C.log`, `build-base.log`, `build-head.log`, `jest1.log`, `ci.log`. Worktree: /home/scott/code/steelCompendium/worktrees/sc456-e2e-fence-integrity/draw-steel-elements (note: `npm ci` was needed - fresh worktree had no node_modules).

---
## r2 summary (fix round 1; head bbf0b32 on 9e1b93d; not pushed)
- R1: `scanFences` and `makeFakeContext` now end a quoted fence where its quote ends (unterminated; scanning resumes at the line that left the quote). Added the reviewer's two cases (quote ends before a later `> ```; unclosed callout fence then a real block - the false negative now reports a corrupted opening line) plus a 15-note table checking the scan against `listFences` (closed ds-x ranges equal). The close-line table's body line now carries the opener's prefix. Mutating the rule out fails 6 tests.
- R6 fell out of R1: the fake now skips every fence's body, so a `ds-x` inside a ```md fence is not a block (test added).
- R2: `'```\nouro'` -> `outro`; the check now asserts opening-line, closing-line and placeholder problems are all reported. R3: `e2e/README.md` states the target's fence-lines-byte-identical rule and the SC-290 trailing-whitespace caveat. Added a dependency-free note to noteFences.ts (F2).
- Gates: tsc rc=0; lint rc=0; jest `230 passed (1 skipped suite), 5294 passed / 2 skipped` (+17 vs r1's 5277); lifecycle (port 9302) `27/27 ok, 0 failed`; e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`.
- O4: diff 188755b..HEAD = 7 files, all `e2e/` + `test/`; main.js/styles.css sha256 unchanged (`42f1445c...5d13b0` / `698d2d07...6a6727`).
- Artifacts: scratchpad `sc456-impl-r2/` (tsc.log, lint.log, jestfull.log, life.log, e2e.log, jest1.log, build-*.log).

---
## r3 summary (rebase round; dse head c03db7a on develop 3480231; superproject on origin/main 27e9de0)
- dse: `git rebase origin/develop` (3480231) applied all 3 commits with NO conflicts (f5ce164, 05a4968, c03db7a). Superproject branch rebased onto origin/main 27e9de0 cleanly (it carries no commits of its own; the `draw-steel-elements` pointer is left unstaged at c03db7a). No `package*.json` change, so no `npm ci`.
- Gates: tsc rc=0; lint rc=0; jest `231 passed (1 skipped suite) of 232`, `5373 passed / 2 skipped`; lifecycle (port 9303) `28/28 ok, 0 failed`; e2e `85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs` (COND-E02 and COND-E03 pass under the stricter invariant).
- O4: `diff --stat 3480231..HEAD` = 7 files, all `e2e/` + `test/`; main.js `dc44016c...516a23` and styles.css `9d88edb6...aa091` identical to a build of 3480231.
- Artifacts: scratchpad `sc456-impl-r3/` (tsc.log, lint.log, jestfull.log, life.log, e2e.log, build-*.log).
