# SC-460 implementer report (round 1)

**Executive summary**
- STATUS DONE. dse branch `sc460-stray-cr`, head `3045082`, FINAL rebase onto `origin/develop` = `188755b` (0 conflicts, package.json unchanged). 4 commits: `ae74c85` (failing tests) `fbc46b4` (fix) `80b9a58` (lifecycle G-S12) `3045082` (CHANGELOG). Not pushed, no tag.
- Cause confirmed by measurement (real Obsidian 1.14.4): Obsidian numbers lines with CR, CRLF and LF each as ONE break (U+2028/2029/NEL/VT/FF are not breaks). The plugin indexed the note with `split('\n')`, so everything below a lone CR was off by one. Fix: one rule, `splitLines`/`splitWithEols` in `lineEnding.ts`, used by every locate/write site; the splice keeps each line's own terminator, so every byte outside the block (lone CRs included) survives.
- FINAL gates on head (188755b base; logs in `logs/sc460-final/`): tsc (incl. -p e2e) + lint clean · jest **5307 passed / 1 skipped / 229 of 230 suites** (base 5257; +50) · lifecycle **28/28** (G-S12 new) · e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` (unchanged) · shots 572, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze `freeze OK (276/276 …)` (no rebaseline) · parity 0 / 0 / 24 declared.
- FAIL-on-base: jest 31 of the 48 SC-460-titled tests fail on base src (the other 17 are no-lone-CR / lone-CR-below / Live Preview regression guards by design); lifecycle G-S12 FAILS on the base bundle (Reading view click: file unchanged) and passes on head.
- Also found and fixed (same class): the sidebar pin from the editor cursor picked the WRONG block (plus a "multiple blocks" Notice) with a lone CR above two blocks and the cursor on the second block's close fence.
- Not touched by choice: a note whose only breaks are lone CRs is written with LF (see Decisions). Owner items: workspace CHANGELOG bullet, dse-verify numbers (below).

## 1. Step-1 measurements (real Obsidian 1.14.4, base bundle at b6b08f3/ab34293 src, scratch vault)
Probe = throwaway copy of the lifecycle harness with 20 fixtures (`logs/sc460-probe-scenarios.mjs.txt`, generator `logs/sc460-mkprobe.mjs.txt`; raw outputs `logs/sc460-probe-base-1792512001.log` (run 1) and `logs/sc460-probe-base2-*.log` (run 2, reading-only entries, plus sidebar part)). Not committed.

**What is a line break (metadata cache `sections`, `ctx.getSectionInfo`, editor `lineCount`):**
| Input above the block | Obsidian breaks? | evidence (code section, lines) |
|---|---|---|
| `A\rB` (lone CR) | YES, one | `lf-cr1`: sections `p2-3 c5-10` (a `\n` split puts the fence at 4); editor lineCount 14 vs 13 |
| `\r\n` | one | normal |
| `A\r\r\nB` | TWO (CR, then CRLF) | `lf-crcrnl`: `p2-2 p4-4 c6-11` |
| `\n\r\n` | two | same count as `\n` split (`lf-crAfterBlankLine` c4-9) |
| U+2028, U+2029, NEL (U+0085), VT, FF | NO | `lf-ls/ps/nel/vt`: `c4-9`, identical to a plain note |
| 3 lone CRs / one in a heading / pure-CR note | each is a break | `lf-cr3` c7-12, `lf-cr-in-heading` c5-10, `pureCR` c4-9 |

**Reading view section text** is the raw disk text (`text === disk`, true for every fixture). **Live Preview** `getSectionInfo(el).text` is the editor's copy: lone CR (and CRLF) already turned into `\n` (`editor.getValue()` = LF-normalised disk), with the same line numbers as Reading view. The processor `src` (host.knownBody) turns a lone CR inside the body into `\n` (`lf-crInBody`: `"name: Health\ncurrent_value: 10\nmax_value: 20\nmin_value: 0"`).

**Base behaviour per fixture** (click Increase with a real pointer click, 1.8 s):
- Reading view FAILS (file unchanged) for: `lf-cr1`, `crlf-cr1`, `lf-cr3`, `lf-crcrnl`, `lf-crFenceAfterCr`, `lf-crOnFence`, `lf-twoblocks-cr-between`, `pureCR`, `lf-cr-in-heading`, `mixed-cr1` (10 of 20). Lands (by luck or via the durable fallback): lone CR only below the block, `\n\r\n`, CR inside the body, the callout cases, and all U+2028 etc. cases.
- **SC-455 Notice now fires** for this case (not silent any more): `"Draw Steel Elements: a change to a block in <note> was not saved — the plugin can't tell where this block sits in the note."` (`lf-crOnFence` shows the older "the block changed on disk first" one). The write still did not land: that is what this ticket fixes.
- Live Preview mostly lands on base: the LF-normalised text parses the fence at the Obsidian line, so `knownLanguage` is set and the durable `locateByBody` fallback finds the block. It still FAILS (Notice) for `lf-crFenceAfterCr`, `lf-crOnFence`, `pureCR`, and its "nearest to last known line" tie-break for identical twins used Obsidian's numbers against `\n`-split positions.
- Sidebar pin, cursor on the close fence of the 2nd of two blocks with a lone CR above: base stamped the FIRST block and showed "multiple blocks … sent the one starting at line 5" (`lf-twoblocks-cr-between`, `anchorBlockIdx=1`); the fence-after-CR and pure-CR fixtures were not stamped at all.

## 2. Design
`src/framework/host/lineEnding.ts` (extended, not duplicated):
- `splitLines(text)` — NOW Obsidian's rule `/\r\n|\r|\n/` (was `/\r?\n/`). Its callers (anchor.ts `iterateFences`, `extractBody`, registration.ts, the host) therefore number lines like Obsidian with no per-site change.
- `splitWithEols(text)` / `joinWithEols(lines, eols)` — lines plus each line's own terminator (`'\r\n' | '\r' | '\n' | ''`); byte-exact round trip.
- `detectEol` unchanged in behaviour (CRLF vs LF vote; a lone CR casts none); comment corrected (it used to say a lone CR is not a break and that SC-460 "cannot be fixed here"). `terminateLines` removed (unused).
`fenceLine.ts`: `replaceFenceBlock` / `replaceFenceBody` hold the note as lines+eols, splice only the block's lines, new lines take the dominant ending, the close fence keeps the terminator of the line it replaces (an LF-dominant note still never keeps a CR before an LF — byte-identical to the pre-SC-453/SC-455 output for notes with no lone CR; the oracle tests for that pass). SC-455's prefix helper (`blockPrefix.ts`) and SC-453's EOL policy are reused untouched.

## 3. Sites surveyed
| Site | Disposition |
|---|---|
| `ReadingModeBlockHost` `parseOpenFence`, `readSection`/`findOwnFence`, `resolveWriteTarget`, `locateByBody`, `locateInSection`, `looksLikeList`, `livePreviewCalloutSection` | changed: every `split('\n')` / `stripCr(..).split` -> `splitLines`; redundant `stripCr` in `locateByBody` dropped, wrong comments corrected |
| `fenceLine.ts` `replaceFenceBlock`, `replaceFenceBody` | changed (lines + eols) |
| `SidebarBlockHost` (`extractBody`, `locate`, `replaceSource`) | numbering fixed through `splitLines` + anchor.ts. One real change: `lastWritten` is now read back from the bytes written (`extractBody(next, this.locate(next))`), because a body ending in a lone CR joins the close fence's LF into one CRLF and is a line shorter than `splitLines(newSource)` says (SC-453 review LOW-1 fix; the pre-existing SC-453 test "new body ending in a lone CR" caught it) |
| `sidebar/anchor.ts` (`iterateFences`, `listFences`, `findFenceAtLine`, `findAnchoredBlock`, `findFenceByBody`, `findGeneratedBlock`) | changed only via `splitLines` (doc comment corrected). They locate by content, but their `lineStart/End` are compared with Obsidian numbers (section lineStart, editor cursor line), so the numbering mattered: base pinned the wrong block (see §1) |
| `sidebar/registration.ts` `bindBlockToSidebar` (`blockBodyLines(splitLines(..))`, `replaceFenceBody`) | already fine after `splitLines`; tested. `aliasAtLine` uses `editor.getLine` (already CodeMirror numbering) — already fine |
| chrome "Pin to sidebar" (`pipeline.ts` -> `getBlockInfo().lineStart` -> `requestPinToSidebar` cursorLine) | already fine after the host change (tested) |
| `elements/encounter/view.ts` EOF append (`lineStart = trimmed.split('\n').length + 1`) | changed to `splitLines(trimmed).length + 1` (hint number only; the append itself is by content) |
| `LivePreviewBlockHost` | stub that throws; LP writes go through `ReadingModeBlockHost` — covered there |
| `main.ts` initiative alias via `listFences`, `authoring/*` (editor-based inserts), `utils/CodeBlocks.ts` (dead legacy, still `split('\n')`) | out of scope / untouched |

## 4. Decisions
- **Lone CR inside the block body**: it is a line break for Obsidian, CommonMark and YAML, and the processor already receives it as `\n`. The body is rewritten line by line from the element's text, in the note's dominant ending, like any edit; nothing is lost (the element's model carries the content), and nothing outside the block moves. A lone CR inside the element's NEW text (rare: a string value) is written as given. Tests: `lf-crInBody` (LF and CRLF note) and the `replaceFenceBlock` unit case.
- **Close-fence terminator**: copied from the line replaced (a lone CR terminator survives); only CRLF -> LF in an LF-dominant note, as before.
- **Notice rule (item 5)**: unchanged mechanism (SC-455). Still-unplaceable cases give exactly one Notice and leave the file unchanged: block edited away -> "changed on disk first" (`droppedWriteMessage`), section that is not a block with no identity -> unsavable Notice; tests assert exactly one and bytes unchanged. Identical-content write: no Notice.
- **Pure-CR note** (only lone CRs as breaks): the write now lands (it did not before); the block's new lines use LF because a lone CR casts no vote in `detectEol`, so that note ends up mixed (every byte outside the block, and the close terminator, unchanged). Left on purpose: classic-Mac line endings, `Eol` type and `toEol` used by the encounter append would all widen. Follow-up if wanted.

## 5. Tests
jest +50 (5261 -> 5311 passed; skipped 2 both): `lineEnding.test.ts` (+2 detectEol rows, 2 splitLines/splitWithEols, 9 replaceFenceBlock/Body; 2 old tests rewritten that encoded the old rule), `reading-mode-host-durable.test.ts` +16 (lone CR above in LF/CRLF notes, several CRs, lone CR below guard, fence after CR, LP-style LF-normalised text with identical twins, two blocks with CR between both write orders, identical twins, callout + CR, CR inside body LF/CRLF, edited-away block one Notice, non-block section one Notice, identical content no Notice, getBlockInfo numbering, locateByBody numbering), `sidebarBlockHost.test.ts` +6, `anchor.test.ts` +5, `registration.test.ts` +4. Lifecycle **G-S12** (28th): real pointer clicks, on-disk bytes: Reading view on an LF note, a CRLF note, the 2nd of two blocks; Live Preview on LF and CRLF notes; sidebar pin from the 2nd block's close fence, then a panel write. Asserts the edit landed in the right block, outside text and lone-CR count byte-identical, no Notice, no mixed endings in the rewritten block.
- FAIL-on-base: jest run `logs/sc460-base-newtests.log/.json` (5 files, base src): 31 failed of 48 SC-460 tests (lineEnding 12/17, reading-mode-host 11/16, sidebarBlockHost 2/6, registration 1/4, anchor 5/5; passing ones are guards). Lifecycle `logs/sc460-lc-g12-base.log`: G-S12 FAIL on base bundle; `logs/sc460-lc-g12.log` ok on head.

## 6. Gate logs (head d609552) — `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/logs/`
`sc460-gate-tsc.log` (rc 0) · `sc460-gate-lint.log` (rc 0) · `sc460-gate-jest.log` (5311 passed / 2 skipped / 230 of 231) · `sc460-base-jest-inplace.log` (ab34293 in this tree: 5261 / 2 / 230 of 231; your 5262/1 differs by one environment-skipped test, `printTwinDeltaAllowedSet` needs a cached `visual-harness/dist/obsidian-app.css`) · `sc460-gate-lifecycle.log` (`done: 28/28 ok, 0 failed`) · `sc460-gate-e2e.log` (`83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`) · `sc460-gate-shots.log` (572 shots, 0 FAIL, pressed toggle parity OK 96) · `sc460-gate-freeze.log` (`freeze OK (276/276 …)`) · `sc460-gate-parity.log` (0 gap(s), 0 undeclared, 24 declared).

## 7. For the owner
- Workspace CHANGELOG bullet (user-facing): "Edits in Reading view now save in notes that contain a stray carriage-return character above the block (SC-460); the sidebar also pins the right block in such notes. Nothing outside the block is changed." (dse `CHANGELOG.md` bullet already added under 7.0.0 unreleased.)
- dse-verify expected numbers to update: lifecycle 28/28 (G-S12 added); jest +50; e2e/shots/freeze/parity unchanged.
- No docs page changed (`docs/writing-blocks.md` has nothing about line endings).

Drive-by fixes: none beyond comments that claimed the old rule (lineEnding.ts header/`detectEol`, `locateByBody`, anchor.ts `iterateFences`) and the SC-453-review LOW-1 `lastWritten` fix, which this change needed to keep SC-453's own test green.

Follow-ups:
1. Pure-CR notes get LF in the rewritten block (§4); widen `Eol` if wanted.
2. Obsidian itself rewrites the whole file LF-normalised after ANY editor edit (lone CRs become LF); not DSE, unchanged, noted in the G-S10 comment already.
3. `utils/CodeBlocks.ts` (dead legacy) still uses `split('\n')`.

## 8. Final battery after the rebase onto 188755b (supersedes the §6 numbers; commits rewritten by the rebase, content unchanged)
Logs: `logs/sc460-final/{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`. tsc rc 0, lint rc 0, jest 5307 passed / 1 skipped / 229 of 230 suites, lifecycle `28/28 ok, 0 failed`, e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, shots 572 / 0 FAIL / pressed toggle parity OK (96), freeze `276/276`, parity 0 gap(s) / 0 undeclared / 24 declared. Earlier-numbered logs in `logs/` (sc460-gate-*) are from the ab34293 base.
