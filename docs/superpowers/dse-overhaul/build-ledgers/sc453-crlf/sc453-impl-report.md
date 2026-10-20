# SC-453 implementer report (round 1)

**Executive summary (updated for the rebase round)**
- STATUS DONE. dse branch `sc453-crlf`, head `6bcf9c8`, rebased onto `origin/develop` = `c616e22` (origin had not moved beyond it; 0 conflicts; no package.json/lock change, no `npm ci`). 9 commits: `bd947ba 8202282 3c919f1 aa43bc0 8091132 d7dd0ad db63921 995398d 6bcf9c8`. Not pushed, no tag.
- Fix: `anchor.ts` splits on `\r?\n` (CRLF fences parse); shared EOL-aware splice (`fenceLine.replaceFenceBlock`) + `lineEnding.ts` drive sidebar/reading-mode writes, anchor stamp, encounter tracker append. All-CRLF stays CRLF, all-LF byte-identical, mixed = dominant (tie: first break).
- Rebase round: G-S10 no longer hard-codes `abcdef`; it asserts the on-disk id equals the panel's `anchorId` and that YAML parses it as a string (Math.random stub kept). `generateAnchorId` untouched.
- Gates on head: tsc/lint clean · jest **4908 passed / 1 skipped / 229 of 230** (`ariaPressedWriters` 5/5) · lifecycle **26/26**, G-S10 solo x5 ok · e2e `68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze `276/276` · parity 0 / 0 / 24.
- Fail-on-base counts from round 0 unchanged.

## EOL policy and why
- `detectEol(content)`: count of `\r\n` vs bare `\n`; majority wins; tie -> the first line break's style; no line break -> LF. Lone `\r` is not a line break (keeps line numbering equal to `split('\n')`).
- Parse side: always LF-normalised (`splitLines`, `stripCr`); element bodies (sidebar `extractBody`, `sendToSidebar` body) are LF-joined, so the self-echo guard / strict-body identity do not depend on the note's ending.
- Write side: LF-dominant -> exactly the old code path (byte-identical, even if the new source carries CRLF). CRLF-dominant -> new block lines get `\r`; incoming CRLF is normalised first (no `\r\r\n`); the LAST new line (close fence) copies the ending of the line it replaces, so a block ending the note with no trailing newline grows no stray `\r`. Lines outside `[lineStart,lineEnd]` are never rewritten, so a mixed note cannot lose content: the written block follows the dominant ending, everything else keeps what it had.
- Why dominant/first-break: no content outside the block is touched, so the choice only decides the ending of text DSE itself emits; the dominant ending is what the user most plausibly authored with.

## Write-site survey
| Site | Disposition |
|---|---|
| `SidebarBlockHost.replaceSource` (`vault.process`) | changed: `replaceFenceBlock`; `extractBody` LF; `lastWritten = stripCr(newSource)` |
| `ReadingModeBlockHost.replaceSource` (`vault.process`) | changed: `replaceFenceBlock`. Locate (`locateByBody`, section path, `resolveWriteTarget`) already worked on CRLF (SC-343 strip, `normalizeBody`, `.trim()`); only the write was mixed. Local `stripCr` in `locateByBody` kept (the `lines` it reads must be CR-free), comment updated |
| `sidebar/registration.ts` `sendToSidebar` (anchor stamp, `vault.process`) | changed: LF body, stamped lines re-terminated with the note's ending; strict-body path never writes |
| `elements/encounter/view.ts` `writeTrackerBlock` (appends fence) | changed: `detectEol` + `toEol` on the appended fence; `findGeneratedBlock` now finds blocks in CRLF notes (re-press binds, no duplicate) |
| `anchor.ts` (`listFences`/`findAnchoredBlock`/`findFenceByBody`/`findFenceAtLine`/`findGeneratedBlock`) | changed: the locate fix. Other callers checked: `registration.aliasAtLine` uses live editor lines (already LF, uses `matchFenceLine`/`isFenceClose`, unchanged); `pipeline.ts` only imports `ANCHOR_KEY`; `ensureAnchor`'s own body-only `detectEol` is untouched (body is LF now) |
| `authoring/{scaffold,insert,suggest,compendiumInsert,schemaSuggest}.ts` (`editor.replaceSelection/replaceRange`) | already fine, evidence below; unchanged |
| `utils/CodeBlocks.ts` `updateMarkdownCodeBlock` (`vault.modify`) | out of scope: dead code (no src caller; only its own unit test + comments), legacy "until D1". Not touched (Follow-up) |
| `data/*` (`vault.create` for new files, `createBinary`/`modifyBinary`, `adapter.write` JSON, `renameFile`, `trashFile`) | out of scope: not rewriting text in an existing user note |
| hero/other element models | no direct note write; go through the hosts. `hero/model.ts` keeps its own EOL logic on its raw body (now fed LF bodies from the sidebar; host re-applies the ending) |

Editor evidence (real Obsidian 1.14.4, lifecycle scratch probe, logs below): `editor.getValue()` of a CRLF note contains no `\r`; after `replaceRange('PROBE1\nPROBE2\n')` the file on disk is entirely LF; control: a single typed character `replaceRange('Z')` also rewrites the whole file as LF. So an editor insert can never produce a mixed note, and CRLF->LF there is Obsidian's own editor save, not DSE's. G-S10 pins "all-LF or all-CRLF, never mixed".

## Files changed (vs f818002)
src: `framework/host/lineEnding.ts` (new), `framework/host/fenceLine.ts` (+`replaceFenceBlock`), `framework/host/SidebarBlockHost.ts`, `framework/host/ReadingModeBlockHost.ts`, `framework/sidebar/anchor.ts`, `framework/sidebar/registration.ts`, `elements/encounter/view.ts`.
tests: `test/unit/framework/lineEnding.test.ts` (new, 26), `test/unit/framework/anchor.test.ts` (+5), `test/dom/framework/sidebarBlockHost.test.ts` (+9), `test/dom/framework/reading-mode-host-durable.test.ts` (+8), `test/dom/framework/registration.test.ts` (+6), `test/dom/framework/sidebarEncounterHandoff.test.ts` (+2). Total +57.
`visual-harness/obsidian-lifecycle.mjs` (+G-S10, fixture `Lifecycle/crlf.md`), `CHANGELOG.md` (+1 bullet in the unreleased 7.0.0 section; the file has no `## Unreleased` heading).

Commits: `5c38cf9` tests (failing first), `79df2ab` fix, `f825984` lifecycle G-S10, `b3631f8` changelog.

## Tests (each requested behaviour)
CRLF sidebar locate + write (all-CRLF after, above/below byte-identical); same for ReadingModeBlockHost; LF byte-identical guards (host x2, legacy-splice oracle in lineEnding test, sendToSidebar, encounter); two same-kind blocks no cross-talk (anchor, sidebar, reading, sendToSidebar-at-cursor); hand-edited CRLF note re-located after a write (sidebar by id, reading via durable locate); mixed notes both dominances (sidebar, reading, helper); CRLF last line with no trailing newline (helper, sidebar, reading); unterminated fence at EOF (CRLF); strict-body bind by body (sidebar host, sendToSidebar); empty-body stamp; self-echo not mistaken for external edit; encounter append + re-press.
Real Obsidian: lifecycle G-S10 (chosen over e2e: needs the experimental sidebar + vault-level bytes, which the lifecycle gate already provides; e2e suite is scoped to the stamina/initiative pilot surfaces with coverage pairs, so its numbers are unchanged). It writes a CRLF note to disk, clicks Increase in Reading view, pins via the real `send-block-to-sidebar` command, clicks Increase inside the sidebar panel, asserting bytes after each (all-CRLF, edit landed, `_dse_anchor` kept, prefix/suffix identical), then the editor-insert never-mixed pin.

## FAIL-on-base detail
Base = `f818002`. Run: 6 files, 24 failed / 80 passed / 104 total, 6 of 6 suites reporting failure (lineEnding suite: module not found). By file: anchor 5, sidebarBlockHost 7 (incl. strict-body, hand-edit, mixed-CRLF-dominant, no-trailing-newline, two-block, locate, write), reading-mode-durable 6, registration 5, sidebarEncounterHandoff 1. Passing on base by design (regression guards): the LF-note cases (4) and the LF-dominant-mixed cases (2) + self-echo (1). Logs: `logs/base-newtests-1792434386.log`. Lifecycle G-S10 on a base bundle built from `git archive f818002`: `logs/lc-G-S10-BASE-1792434652.log` (FAIL: Reading view note not all-CRLF) and `logs/lc-G-S10-BASE-sidebar-half-1792434674.log` (reading check temporarily skipped; FAIL: timed out waiting for the anchor stamp, note unchanged — the pin never found the block).

## Gate numbers and logs (dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/logs/`)
- tsc (incl. `-p e2e`): clean, rc 0 — `gate-tsc-final.log`; lint: clean, rc 0 — `gate-lint-final.log`.
- jest: `gate-jest-final2.log`: 4867 passed, 1 skipped, 4868 total, 228 of 229 suites (base 4810/1/227 of 228). An earlier run (`gate-jest-final.log`) read 4866 passed / 2 skipped because the fresh worktree had no cached `obsidian-app.css` (the documented `printTwinDeltaAllowedSet` skip); it disappeared after `npm run shots` fetched it.
- lifecycle: `gate-lifecycle-final.log`: `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`.
- e2e: `gate-e2e-final.log`: `OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`.
- shots: `gate-shots-final.log`: 572 PNGs, 0 FAIL, host-copy pin OK, button host-leak 112 kinds / 672 comparisons (base-side drift from other landings; unrelated to this change).
- freeze: `gate-freeze-final.log`: `freeze OK (276/276 ...)`, no rebaseline. Parity: `gate-parity-final.log`: 0 gap(s), 0 undeclared, 24 declared, rc 0.
- Probe logs: `lc-probe-1792434.log` family (`lc-probe-*.log`, `lc-probe2-*.log`). Helper script `sc453-run.sh`. `npm ci` was needed (worktree had no node_modules).

## Workspace CHANGELOG bullet (for the owner; not edited)
"- Fixed: notes with Windows (CRLF) line endings now work with the Draw Steel sidebar (pinned blocks could not be found, so edits never saved), and DSE saves no longer leave a CRLF note with mixed line endings."

## Drive-by fixes:
None.

## Follow-ups:
1. `src/utils/CodeBlocks.ts` (`updateMarkdownCodeBlock`, `vault.modify`) is dead legacy code with the same CRLF/mixed hazard; delete it (and its test) or make it use `replaceFenceBlock` — owner's call.
2. Hero `defnRaw` / `detectEol` in `elements/hero/model.ts` and `anchor.ts`'s `ensureAnchor` `detectEol` are now second EOL detectors with a stricter rule ("CRLF only when every break is CRLF"); with LF bodies from the hosts they are effectively LF-only. Could be consolidated onto `lineEnding.detectEol`; left alone (different input, no behaviour gap).
3. Obsidian's editor rewrites a CRLF note wholesale to LF on any editor edit (measured 1.14.4). Not DSE's; worth knowing if "CRLF stays CRLF" is ever promised to users beyond DSE's own writes (the CHANGELOG bullet scopes it to DSE's writes).
4. dse-verify CURRENT row needs updating at landing: jest 4867/1/228 of 229, lifecycle 26/26 (G-S10 added); e2e/shots/freeze/parity numbers unchanged (shots button host-leak count read 112 kinds / 672 here).

## Incident to disclose
After the base-sidebar-half probe I ran `rm -rf /tmp/dse-obsidian-lifecycle-*` (intended for my own kept temp dir). That glob could also have removed another concurrent effort's lifecycle scratch dirs under `/tmp` (only dirs from runs that kept FAIL shots, or an active run's vault). I did not observe any effect; flagging it in case another effort's lifecycle run reports a vanished scratch vault around 14:35-14:45 local on 2026-10-19.

## Fix round 1

Dispositions (logs in `logs/`, prefix `fr1-`):
- **MEDIUM-1 (G-S10 ~3% flake)** — FIXED (test only; `generateAnchorId` untouched, SC-383). `52c9414`: G-S10 stubs `Math.random` to `0xabcdef / 0x1000000` (yields id `abcdef`, not YAML-numeric) around the pin command + anchor-stamp wait, restored in a `finally`; the scenario also asserts `_dse_anchor: abcdef\r\n` landed. Comment cites SC-383. Evidence: G-S10 alone 6/6 ok (`fr1-G-S10-run1..6.log`), plus ok in the full 26/26 run.
- **LOW-1 (lone-CR-ending body on an LF note misread as external edit)** — FIXED, `3554856`. `replaceSource` no longer pre-sets `lastWritten`; inside the `vault.process` callback it sets `lastWritten = extractBody(next, {…lineEnd = lineStart + newSource.split('\n').length + 1})`, i.e. the read-back of what was written (set before Obsidian emits `modify`). Test: "LF note, new body ending in a lone CR" — fails on the pre-fix code (`fr1-lowone-base.log`, 1 failed), passes after (`fr1-lowone-fixed2.log`). Side effect: an aborted write (block not found) no longer leaves a stale `lastWritten`.
- **LOW-2 (`stripCr(newSource)` untested)** — FIXED, test `2cc5b28`: "a new source that itself carries CRLF is still recognised as our own write". Mutation shown: with `lastWritten = newSource` (the stripCr removed) it FAILS (`fr1-lowtwo-MUTANT-no-stripcr.log`: 1 failed / 30 passed); with stripCr it passes (`fr1-lowtwo-with-stripcr.log`, 31/31). After LOW-1 the stripCr itself is gone (the read-back is LF by construction); re-ran the mutation `lastWritten = newSource` against the final code: BOTH new tests fail (`fr1-MUTANT-raw-newsource.log`: 2 failed / 30 passed), then restored (`fr1-lowone-fixed2.log`: 32/32).
- **INFO-1 (redundant `stripCr` in `locateByBody`, inaccurate comment)** — FIXED, `4351e4e`: call kept as a guard, comment now says it is redundant for correctness and why it stays.
- **INFO-2 (lone CR above a block drops Reading-view writes)** — comments corrected only, `4351e4e`: `lineEnding.ts` `detectEol` doc and the `locateByBody` comment now say Obsidian's section numbering counts a lone CR as a break (measured 1.14.4) and cite SC-460; no behaviour change.
- Left alone per ruling: INFO-6, SC-454 (CodeBlocks.ts), second EOL detectors, INFO-3/4/5.

Gate numbers on head `52c9414` (logs `fr1-gate-*.log`, dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/logs/`):
tsc rc 0 · lint rc 0 · jest 4869 passed / 1 skipped / 4870 total / 228 of 229 suites (+2 tests over round 0's 4867) · lifecycle `done: 26/26 ok, 0 failed` · G-S10 solo x6: all `1/1 ok` · e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots 572 PNGs, 0 FAIL · freeze `freeze OK (276/276 …)` · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

dse-verify CURRENT row (for the land-ready report): jest 4869/1/228 of 229, lifecycle 26/26; other numbers unchanged from base.

## Rebase round (c616e22)

- `git fetch origin`: `origin/develop` = `c616e22` (SC-450 tip); not beyond it. `git rebase origin/develop`: all 8 prior commits replayed, **no conflicts**. `package.json`/`package-lock.json` unchanged across `f818002..c616e22`, so no `npm ci`. Old -> new shas: `5c38cf9`->`bd947ba`, `79df2ab`->`8202282`, `f825984`->`3c919f1`, `b3631f8`->`aa43bc0`, `2cc5b28`->`8091132`, `3554856`->`d7dd0ad`, `4351e4e`->`db63921`, `52c9414`->`995398d`; new commit `6bcf9c8`.
- **G-S10 change (owner ruling), `6bcf9c8`**: removed the hard-coded `_dse_anchor: abcdef` assertion. After the pin it now (1) reads the stamped id from disk, (2) asserts the sidebar leaf's `getState().panels` holds exactly one panel whose `anchorId` equals it, (3) asserts `yaml.parse('k: <id>').k` is a string. Obsidian's `parseYaml` is not reachable from the page (`require('obsidian')` fails there: first attempt `rb-G-S10-try1.log`), and it is the `yaml` v2 package (test/mocks/obsidian-core.ts), so the check runs node-side via `await import('yaml')` (`yaml.parse('k: 927e10').k` is a number, `abcdef` a string, so the assertion can fail). The Math.random stub stays; comment says it is harmless once SC-360 lands and that the assertions do not depend on its value. `generateAnchorId` untouched, so SC-453 and SC-360 land in either order.
- Numbers vs expectation: all as expected (jest 4908/1/229 of 230 = base 4849 + 59 tests + 1 suite; the new SC-450 guard `test/unit/build/ariaPressedWriters.test.ts` passes 5/5 alone and in the full run; e2e 68/76 0 failed 8 known-bug 51/51; shots 572 with the `pressed toggle parity OK (96 comparisons …)` line). No differences to explain.

Gates on head `6bcf9c8` (logs `rb-*`, dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/logs/`):
tsc rc 0 (`rb-gate-tsc.log`) · lint rc 0 (`rb-gate-lint.log`) · jest 4908 passed / 1 skipped / 4909 total / 229 of 230 suites (`rb-gate-jest.log`; `rb-ariaPressed.log` 5/5) · lifecycle `done: 26/26 ok, 0 failed` (`rb-gate-lifecycle.log`); G-S10 solo x5 all `1/1 ok` (`rb-G-S10-run1..5.log`) · e2e `OBSIDIAN-E2E done: 68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs` (`rb-gate-e2e.log`) · shots 572 PNGs, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` (`rb-gate-shots.log`) · freeze `freeze OK (276/276 …)` (`rb-gate-freeze.log`) · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (`rb-gate-parity.log`).
dse-verify CURRENT row: jest 4908/1/229 of 230, lifecycle 26/26; other numbers equal the c616e22 base row.
