# SC-290 independent review (REV-1): head 013063a vs base 0d69ec9

**Executive summary**
- **Verdict: APPROVE.** The fix is correct and complete for every fence writer. No BLOCKER, HIGH or MEDIUM findings.
- Counts: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 1 LOW (one behaviour change has no test), 4 INFO (all were already there before this branch; the diff does not make any of them worse).
- I ran the fix in real Obsidian with throwaway e2e probes. On HEAD a Reading-view click write and a Live Preview click write both keep the info string. That holds for a space before the language, tabs plus double spaces, a CRLF note, a 4-tilde fence with braces and backticks in the info string, and twin blocks that differ only in their info string, whichever twin is written. All 7 probes FAIL on base, including the implementer's RECOV-I01.
- Gates (measured): tsc and tsc -p e2e clean · lint rc 0 · jest `Tests: 1 skipped, 4746 passed, 4747 total` / `Test Suites: 1 skipped, 227 passed, 227 of 228 total` · lifecycle `25/25 ok, 0 failed` (port 9293) · e2e `60/72 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` · shots 572 PNG, 0 FAIL · freeze `276/276` OK · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Vacuity check: with the base host sources and the new tests kept, the 8 info-string jest cases fail and the 6 guards pass. This matches the implementer's numbers exactly.

## Findings

### LOW-1: the space-before-language fix is not pinned by any test
- Where: `test/dom/framework/reading-mode-host.test.ts:63-70` and `test/dom/framework/sidebarBlockHost.test.ts:106-113` (the `test.each` tables).
- Scenario: the implementer's report claims that ```` ``` ds-counter ```` now round-trips. No jest or e2e case covers it, and no case covers tabs between tokens either. On base, real Obsidian renders ```` ``` ds-stamina-bar extra ```` as a stamina bar, but the first click rewrote the fence to a bare ```` ``` ````, which **turns the block into a plain code block** (probe ZZ290-P1 on base). Two future refactors would bring that back with every test still green: emitting `fence + info.trimStart()`, or emitting `${fence}${language}` with `language` taken from `\S*`.
- Fix: add `['a space before the language', '```', ' ds-counter extra', '```']` and `['tabs between tokens', '```', 'ds-counter\textra\tmore', '```']` to both tables. Both pass on HEAD (my jest probe P4 and sidebar probe S2 show the exact output). The space case fails on base.

### INFO-1: the e2e note-integrity invariant cannot see opening-line changes, tilde fences, or a space before the language
- Where: `e2e/driver/invariants.ts:24,29,46,49` (`/^```(\S*)/`, `line.trim() === '```'`) and `e2e/driver/dse.ts:164-177` (`declareTarget` keys on that first token).
- Scenario: the placeholder `skeletonOf` records for each fence is the first token only, so a write that rewrites a **target** block's opening line passes the after-every-test invariant. The invariant alone would never have caught SC-290; only RECOV-I01's explicit assertion does. My probes also hit false invariant failures on correct writes:
  - a `~~~~` fence is read as "content outside the blocks changed" (ZZ290-P4);
  - a ```` ``` ds-stamina-bar ```` fence gets lang `''`, so `dse.block()` cannot declare it as the target (ZZ290-P1).
- Fix (separate ticket, can go with the existing `expectNoteBlock` follow-up): record the full opening line in the skeleton placeholder, recognise `~~~` fences, and derive lang from the trimmed rest of the line.

### INFO-2: a fence with a space before the language has an empty language identity, so the durable relocate always misses it
- Where: `src/framework/host/fenceLine.ts:12,31` (`language` is still `\S*`, so `''` for ```` ``` ds-counter ````), `src/framework/host/ReadingModeBlockHost.ts:299` (`knownLanguage = ''`), `:346` (`fence?.language ?? this.alias` does not catch `''`), `:122` (`open[2] === language`), `:473` (`locateByBody(content, '', …)` → `listFences(lf, '')` matches nothing).
- Scenario (measured in jest probe P6): `getBlockInfo().language === ''` and `blockKey() === 'Note.md::::1'`. When the section snapshot goes stale (line drift, or the section is gone), the durable path cannot find the block and the user gets a "not saved" Notice instead of a write. This was already true on base, where the first write also destroyed the block (LOW-1). Now that such blocks survive their first write, more users can reach this path, but the diff does not change the behaviour.
- Fix (separate ticket): derive `language` the way `anchor.ts` `fenceAlias(rest.trim())` does, so that host identity, `anchor.ts` and Obsidian all agree. Check the effect on `blockKey` for collapse state.

### INFO-3: blocks inside a callout or blockquote cannot be written at all (silently)
- Where: `ReadingModeBlockHost.ts:438-472`. `OPEN_FENCE` is anchored at column 0, so `> ```ds-counter extra` never parses. `knownLanguage` stays null, which gives `'abort'` and `replaceSource` returns false with no Notice.
- Measured: jest probe P5, identical output on base and HEAD. Not a regression. Out of SC-290's scope. File a separate ticket only if callout-nested interactive blocks are meant to be supported.

### INFO-4: a CRLF note ends up with mixed line endings after a write (this was already true on base)
- Real Obsidian probe ZZ290-P3: after a write the opening line, body and close are LF and the rest of the note stays CRLF (`"```\n\r\nBELOW\r\n"`). Base gives the same output, minus the info string.
- The `trimEnd()` in `fenceLine.ts:31` deliberately removes the `\r` from the opening line, which matches base, so this is not worse. The Sidebar CRLF locate failure was already known and is unchanged.

## Probe results by brief item
1. **Every fence writer:** these are all the sites I found that write to the note, checked independently:
   - **Rebuild the opening line (both fixed):** the `vault.process` callbacks at `SidebarBlockHost.ts:307` and `ReadingModeBlockHost.ts:379`.
   - **Write without rebuilding an opening line:**
     - `sidebar/registration.ts:209` splices the body only, never the fence line.
     - `elements/encounter/view.ts:455` either appends a brand-new fence or returns the content byte-identical.
     - `authoring/{scaffold,insert,suggest,compendiumInsert,schemaSuggest}.ts` only insert new text.
     - `LivePreviewBlockHost.replaceSource` throws (stub). Live Preview writes go through `ReadingModeBlockHost`, which I confirmed in real Obsidian (ZZ290-P5 passes on HEAD and fails on base).
   - **Legacy:** `src/utils/CodeBlocks.ts:97,120` still has the old re-emit bug. It has no `src/` caller (this was already known).
   - **Build fixtures, not writes:** `visual-harness/*.mjs` emitters.
   - No writer is missed.
2. **Integrity:** all probes passed on HEAD:
   - content above and below the block survives;
   - two same-language blocks with different info strings do not affect each other, in both write orders, for both hosts (jest P1, S1) and in real Obsidian (ZZ290-P2, ZZ290-P2b);
   - identical-body twins differing only by info string: the section path and the durable body path (nearest line, after an external line insert) each find their own block (jest P2a, P2b);
   - a fence hand-edited after mount survives a re-trigger even when the section snapshot is stale, because the re-emit reads the live document (jest P3);
   - CRLF (INFO-4), a trailing tab or space after the info string (dropped), tabs between tokens, `~~~` and `~~~~` with backticks in the info string, 5 backticks with `{.x} k=v`, `{title="a b"}`: all kept.
   - Callout: INFO-3.
3. **Location and identity:** nothing compares the full fence line to find a block. `listFences`/`iterateFences` use `fenceAlias(rest)` (first token). `locateByBody`, `resolveWriteTarget` (`openOk` only checks that it parses), `blockKey`, `knownLanguage` and the Sidebar `sessionKey` all use `language` or `alias`, and none of these changed. P6 shows `getBlockInfo` and `blockKey` are identical on base and HEAD.
4. **Not vacuous:** 8 of the 14 new tests fail on base host sources, and the 6 guards pass by design (log `probe-and-newtests-on-base.log`). RECOV-I01 fails on base (`e2e-probe-base.log`).
5. **Real Obsidian:** the full lifecycle and e2e gates are green. Probes are listed above.
6. **tsc, lint, jest:** these match the implementer's numbers.

## Judgment calls (brief §6)
- **Trailing whitespace is dropped:** this is consistent with CommonMark, which strips trailing spaces and tabs from the info string, so the rendered block is unchanged. It keeps language-only fences byte-identical to base. One nit: `String.prototype.trimEnd()` also strips Unicode spaces such as NBSP, which CommonMark does not. A fence ending in `extra ` loses the NBSP (probe P4 "NBSP trailing"); base dropped it too. This is not worth changing. If you want it exact, use `.replace(/[ \t\r]+$/, '')`.
- **Space before the language:** this is a **fix, not a regression**. Obsidian renders ```` ``` ds-stamina-bar extra ```` as the element. On base, the first click write rewrote the fence to a bare ```` ``` ````, which destroyed the block (real Obsidian, ZZ290-P1 base). On HEAD it round-trips. Matching and rendering are unchanged; the identity gap remains (INFO-2), and a test is still missing (LOW-1).
- **Known items:** the dead `CodeBlocks.ts`, the Sidebar CRLF locate failure, and `expectNoteBlock`/`makeFakeContext` are all untouched, and the diff does not make any of them worse. INFO-1 extends the third item to the invariants module.

## Gates (measured on 013063a; logs in the scratch dir below)
- tsc: rc 0, no output (includes `tsc --noEmit -p e2e`); lint: rc 0.
- jest: `Test Suites: 1 skipped, 227 passed, 227 of 228 total` · `Tests: 1 skipped, 4746 passed, 4747 total`.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (DSE_LIFECYCLE_PORT=9293).
- e2e: `OBSIDIAN-E2E done: 60/72 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`.
- shots: 572 PNGs, 0 FAIL · freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Artifacts
Scratch dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-20261019-091936-3794800/`
- Gate logs: `tsc.log`, `tsc-e2e.log`, `lint.log`, `jest.log`, `lifecycle.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`
- jest probes: `zz-sc290-review-probe.test.ts.txt`; results `probe-head.log` (HEAD) and `probe-and-newtests-on-base.log` (base host sources plus the new tests)
- e2e probes: `e2e-probe-files/` (spec plus 4 fixtures); results `e2e-probe-head2.log` (HEAD) and `e2e-probe-base.log` (base: 0/7 ok, including RECOV-I01)
- Worktree status before and after: identical (`status-before.txt`); all probe files were removed from the worktree, and nothing was committed or pushed.

## R4 (scoped re-review of the delta: head c78a06b, base a89ffd9 = origin/develop)

**Verdict: APPROVE.** I found nothing new. LOW-1 is closed.

- **(a) range-diff** `0d69ec9..013063a` vs `a89ffd9..c78a06b`:
  - `e019932 = 437489c` (fix plus jest): the patch is identical.
  - `013063a ! 1c3b57a` (e2e plus changelog): the only change is the CHANGELOG hunk's context. The spec, fixture, README and source are unchanged.
  - `c78a06b` is new.
  - CHANGELOG resolution is correct. `git diff a89ffd9..c78a06b -- CHANGELOG.md` is a pure 4-line addition: no upstream bullet is lost or duplicated. The order under `7.0.0 (unreleased ...)` is SC-426, SC-324, SC-290, SC-423.
- **(b) c78a06b rows:** both tables gain `' ds-counter extra'` and `'ds-counter\textra\tmore'`. Each asserts that the whole note is byte-identical apart from the body, which is what LOW-1 asked for. Measured results:
  - HEAD: `Tests: 39 passed, 39 total` for the two files.
  - Base host sources (0d69ec9 `ReadingModeBlockHost.ts` and `SidebarBlockHost.ts`, new tests kept): `Tests: 12 failed, 27 passed, 39 total`. That is R1's 8 failures plus the 4 new rows, one space row and one tabs row per host. The space-before-language failure on base shows `- \`\`\` ds-counter extra` / `+ \`\`\`` (the bare fence that destroys the block).
- **(c) RECOV-I01 on c78a06b:** `npm run e2e -- --only=RECOV-I01,RECOV-R01` gives `OBSIDIAN-E2E RECOV-I01 ok (856 ms)`, `RECOV-R01 ok`, `done: 2/2 ok, 0 failed`. The test still asserts `w.count === 1` plus `current_stamina: 22` and `recoveries: 2` on disk, so a real click write still happens after SC-430, SC-324 and SC-426.
- **Implementer logs `sc290-r3c/`:** they belong to c78a06b. The reflog shows HEAD reached c78a06b at 11:51:52 local with no move since; the scripts are dated 11:51, jest.log 11:53, and the e2e run id `20261019-155727` is 11:57 local. Their summary lines match the numbers claimed: jest `1 skipped, 4787 passed, 4788 total` / `227 of 228`; lifecycle `25/25 ok, 0 failed`; e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`; freeze `276/276`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- **Worktree:** `git status --porcelain` is identical before and after (clean). Nothing was committed or pushed.
- **Artifacts:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-r4-20261019-131625-4161416/`, containing `range-diff.txt`, `jest-two-head.log`, `jest-two-base-hosts.log` and `e2e-recov.log`.
