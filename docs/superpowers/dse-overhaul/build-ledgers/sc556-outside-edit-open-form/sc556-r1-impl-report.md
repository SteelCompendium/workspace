# SC-556 r1 implementation report

## Summary
- Verdict: DONE_WITH_CONCERNS (code, tests, lifecycle phases, docs done; two gate lines hit load flakes, see Concerns).
- Change: `FormModal.save()` now passes `{ pin, pinOnly: true }` for EVERY form that holds a pin (was: kept-open forms only).
- Own block edited or deleted from outside while the form is open: Save writes nothing, the existing dropped-write Notice shows, the form stays open.
- dse branch `sc556-outside-edit-open-form` head `a4900dca` (2 commits on origin/develop `6270e84a`, which had not moved); superproject commit `71f4b60a` (CHANGELOG only; no pointer bump, wt-finish does that).
- Red on base: 5 jest tests fail on 6270e84a, green on the fix; G-S64 phases (v) and (w) fail on base, pass on the fix.
- Gates: tsc + lint clean; jest 6499 passed / 2 skipped / 257 of 258 (+8 tests); lifecycle parts 21/21, 16/16, 9/9, 4/4 ok, part 5 G-S49 ok and G-S59 FAIL (load flake, also fails on base build); e2e 128/128, 89/89.
- `styles.css` sha256 identical to a 6270e84a build, so shots 592 / freeze 280 / parity 0/0/24 carry (not re-run).
- Concerns: (1) a second dropped Save within 5 s on one note shows NO Notice (follow-up); (2) G-S59 and some jest/e2e tests time out when the machine load is above about 11 (other agents were running; load 20-50 throughout).

## Shas
- dse: `45a07cac` (source + jest tests), `a4900dca` (lifecycle G-S64 phases). Base `6270e84a`.
- superproject (worktree `/home/scott/code/steelCompendium/worktrees/sc556-outside-edit-open-form`): `71f4b60a` CHANGELOG `## Unreleased` bullet.
- Worktree needed `node_modules`: untracked symlink to the main checkout's (same as sc563).

## Files changed (dse, vs 6270e84a: 8 files, +222 / -21 (numstat below))
- `src/authoring/FormModal.ts` +7/-4: save() always `pinOnly: true` with a pin; comments.
- `src/framework/host/BlockHost.ts` +4/-2: `pinOnly` doc and `replaceSource` doc now say the form's Save always passes it, the view's own write does not.
- `src/framework/host/ReadingModeBlockHost.ts` +4/-3: the `replaceSource` fallback comment and the `pinnedTarget` doc.
- `src/framework/host/lineMap.ts` +4/-3: "Known limit" paragraph: the `LINE_MAP_MAX_EDITS` (400) limit now applies to every form's Save.
- `test/dom/authoring/formModal.test.ts` +4/-4: pin test expects `pinOnly: true`; the "kept open vs not" test rewritten to "every pinned form is strict".
- `test/dom/framework/reading-mode-host-pin.test.ts` +33/-1: control (the card's own `fromView` write is not pin-only: an unplaceable pin still falls back, no Notice); control (unterminated trailing fence, lines inserted above, pinOnly Save lands, final newline kept); header comment.
- `test/dom/framework/twin-reuse.test.ts` +110/-1: six tests (below).
- `visual-harness/obsidian-lifecycle.mjs` +56/-3: G-S64 phases (v), (w), a fixture `Lifecycle/form-strict-triplets.md`, header comments.
- Superproject `CHANGELOG.md` +9.

## Tests (+8 jest tests, all in existing files)
In `twin-reuse.test.ts` (real FormModal + real ReadingModeBlockHost, the file's Reader stand-in), describe "SC-552 ... a block edit form":
- (a) 3 twins, form on the middle block, middle body edited from outside, card not kept open: note byte-identical after Save, Notice == `droppedWriteMessage('Note')`, form open.
- (b) 3 twins with prose between, form on the middle block, middle block deleted, card reused: same expectations.
- (c) 2 twins, form on the upper block, upper body edited: same expectations, then Cancel leaves the note untouched.
- Control: a twin ABOVE deleted: Save writes the form's own block; text around and twins byte for byte.
- Control: lines inserted above AND below: writes own block, rest untouched.
- Control: unique block, edits elsewhere in the note: writes the block.
- Existing and still green (cover "twin above edited" and "insert above"): "no click at all: an outside edit of the upper block...", "an outside edit that also inserts text above the blocks...".
In the other two files: the card-write control, the unterminated-fence control, and the FormModal "every pinned form is strict" test.

## Red-on-base proof
Command: only `src/` reverted to 6270e84a (`git stash push -- src`), same 4 touched test files. Log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r1/jest-touched-base-red.log`
- `Tests: 5 failed, 137 passed, 142 total` (then 143 with the added control, all green on the fix: `jest-touched-1.log`).
- Failing on base: formModal (2: pin arg lacks `pinOnly`), twin-reuse (a), (b), (c). Quote for (a):
  `expect(t.app.vault.getContent('Note.md')).toBe(outside)` fails: `- name: Twin` / `+ name: Edited` in the LOWER block (the edit lands in the identical twin).
- Controls pass on base too (as they must: they pin down what must not change).
- Lifecycle G-S64 on base (FormModal.ts reverted): FAIL at (v): `Save said nothing | the form is closed, the note is ...current_value: 9 ... name: Edited ... current_value: 5` (edit written into the lower twin, the form closed); (w) also FAIL. Log: `.../sc556-impl-r1/lc-gs64-base-red.log`. Green on the fix: `lc-gs64-fix-green.log`: (v) "form's card on block 2 at Save, Save wrote nothing, one Notice, form stayed open", (w) "card on block 1 ...".

## Lifecycle: G-S64 extended, no G-S68
- Phases (v) edit on disk of the middle of three plain twins and (w) in-app deletion of the middle block (with prose between the blocks), Reading view, form on the middle block. Both assert: the form's card is not thrown away (recorded: block 2 and block 1), Save writes nothing (note == outside text byte for byte), exactly one Notice with the exact text, form open, registry holders 0.
- (w) uses its own note (`Lifecycle/form-strict-triplets.md`) because a dropped write's Notice is rate limited to one per note per 5 s.
- Scenario count 52, five-part split and G-S56-last unchanged. Proposal file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc556-outside-edit-open-form/sc556-dse-verify-proposal.md` (SKILL.md NOT edited).

## Gates (logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r1/`, call it `$S`)
- tsc (incl. `-p e2e`): rc 0, `$S/gate-tsc.log`. lint (incl. e2e): rc 0, `$S/gate-lint.log`.
- jest, plain `npx jest`, three runs, each with exactly one DIFFERENT unrelated 5 s timeout under load 20-50:
  `gate-jest-full-run1-1flaky.log` (initiative-default-keys SC-485 squad pool), `gate-jest-full-run2-1flaky-twinreuse-547.log` (twin-reuse SC-547 40-block pass), `gate-jest-full-run3-1flaky-initiative.log`: `Tests: 1 failed, 2 skipped, 6498 passed, 6501 total`, `Test Suites: 1 failed, 1 skipped, 256 passed, 257 of 258`. Each failing file passes alone (`gate-jest-init.log`: 25/25; twin-reuse passes in `jest-touched-1.log`).
  Clean run with `--testTimeout=30000` (`gate-jest-t30.log`): `Test Suites: 1 skipped, 257 passed, 257 of 258 total`, `Tests: 2 skipped, 6499 passed, 6501 total` (fresh worktree reads one fewer passed and 2 skipped per dse-verify; baseline 6492/1 + 8 new tests - 1 = 6499).
- Lifecycle, five `--only` calls (ids from dse-verify CURRENT):
  - part 1 `$S/lc-part1.log`: `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`
  - part 2 `$S/lc-part2.log`: `done: 16/16 ok, 0 failed`
  - part 3 `$S/lc-part3.log`: `done: 9/9 ok, 0 failed` (includes G-S64 with (v), (w))
  - part 4 `$S/lc-part4.log`: `done: 4/4 ok, 0 failed`
  - part 5 `$S/lc-part5.log` (4 runs, `lc-part5-run{1..4}-*.log`): G-S49 ok every time; G-S59 `FAIL: Runtime.evaluate: timed out after 30000 ms` / `timed out waiting for the pin or hold released and the tracker redrawn`, at loadavg 10-30. The SAME scenario fails on an unmodified 6270e84a build at the same load: `$S/lc-base-gs59.log` (`done: 0/1 ok`). Matches the SC-561 diagnosis (CDP throttle plus load). G-S59 does not touch forms or FormModal. I could not get a clean G-S59 pass because machine load stayed above 11 (other agents' jest/e2e/shots runs).
- e2e: `$S/gate-e2e.log` (run 3): `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`. Runs 1 and 2 (`gate-e2e-run1-recov-r07-load52.log`, `gate-e2e-run2-recov-r07-load30.log`) each failed only RECOV-R07 (`w.count` 2 vs 1, a card-write debounce count in the stamina Recoveries popover, no form involved) at load 30-52; `--only=RECOV-R07` passes alone (`e2e-only-fix.log`).
- shots / freeze / parity: carried. `sha256sum styles.css`: worktree HEAD build `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04`; clean `git archive 6270e84a` build (`$S/base-6270e84a/styles.css`) `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04`. Byte-identical. `git diff 6270e84a -- styles-source.css assets` is empty.

## Answers to the brief's "verify" items
- Form stays open on a dropped Save when NOT kept open: yes. Jest (a)(b)(c) assert `isOpen(form) === true`; lifecycle (v)(w) assert it in real Obsidian, with the card's registry entry live on block 2 / block 1 (not released).
- Notice text exact: asserted `toEqual([droppedWriteMessage('Note')])` in jest, and as the literal `Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.` in the lifecycle phases.
- Card writes are not pin-only: the view's own write passes `fromView` with the round's `pendingPin` and NO `pinOnly`, so an unplaceable pin still falls back (jest control added). ds-hero "Edit definition" goes through `openFormEditor` -> FormModal -> `save()`, so it is included.
- Forms without a pin: only `SidebarBlockHost` (no `pinPosition`); it keeps the old unpinned `replaceSource(body)`. `LivePreviewBlockHost` is a deferred stub that throws and is never constructed. `ReadingModeBlockHost.pinPosition()` returns null while the block has no section, so such a form is also unpinned.

## Drive-by fixes:
- None.

## Follow-ups:
1. A second dropped Save on the same note within 5 s shows no Notice at all. `notifyDroppedWrite` rate-limits to one per note per 5 s, yet `ReadingModeBlockHost.reported = dropped` is true regardless, so FormModal also skips its own "couldn't save" Notice. A user who clicks Save, reads the Notice, edits, and clicks Save again within 5 s gets a silent no-op with the form open. This ticket makes that path more common. Design choice (reset the clock when the same form retries? show anyway for form Saves?), so left. Hit this while writing (w): the lifecycle needs one note per phase.
2. Deleting one of several byte-identical blocks whose surrounding text is also identical (e.g. three counters separated only by blank lines) cannot be told from deleting another one: the line diff treats the deletion as the last of the run, so the pinned line maps to a surviving twin with the same body and Save writes it. Not tested (reasoning from `mapLine`: head/tail trimming); inherent, no position-based fix. The brief's (b) therefore uses prose between the twins; the lifecycle fixtures already have TOP/M1/M2/BOTTOM.
3. Load-sensitive gates: jest `initiative-default-keys` (SC-485 squad pool test, 5 s timeout, 63 s suite) and `twin-reuse` SC-547 (40-block callout pass), e2e RECOV-R07, lifecycle G-S59 all time out under load above about 11. SC-561 already covers G-S59 only.
4. The dse repo's own `CHANGELOG.md` (7.0.0 section) was not touched; the brief asked for the workspace CHANGELOG only.
5. The `LINE_MAP_MAX_EDITS` = 400 cost is now documented in `lineMap.ts` and the CHANGELOG bullet: a Save after more than 400 changed lines on BOTH sides of the block is refused with "the block changed on disk first" although the block is unchanged. No data lost (form stays open).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc556-outside-edit-open-form/sc556-r1-impl-report.md`
- dse-verify proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc556-outside-edit-open-form/sc556-dse-verify-proposal.md`
- Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r1/`

---

# r2 section (fix round: F1, F2, F4)

## Summary
- Verdict: DONE. dse branch head `92288b73` (on `a4900dca`); superproject `789bf152` (on `71f4b60a`).
- F1: a form Save's dropped-write Notice is never rate limited. Mechanism: `notifyDroppedWrite` / `notifyUnsavableWrite` take a `force` flag; `ReadingModeBlockHost.replaceSource` and `SidebarBlockHost.replaceSource` pass `force = (options?.fromView !== true)`. Only `view.ts` (fromView) and FormModal write, so "not fromView" is exactly "a form Save".
- A forced Notice restarts the note's clock, so card writes right behind a form Save are folded into it. Card-write (fromView) rate limiting is unchanged.
- One Notice per Save: `reported` stays true, so FormModal's own "couldn't save - the block may have moved" Notice is NOT added; that FormModal text is unchanged (no change forced).
- Also forced for the "unplaceable" Notice (note gone / cannot be placed), same mechanism, so no form Save is silent on that path either.
- Tests: +7 jest (red on a4900dca src: 4 fail, the other 3 are controls). Gates: tsc/lint clean; jest t30 6506 passed / 2 skipped / 257 of 258; plain run 1 flake (SC-568); lifecycle part 3 9/9, part 1 21/21; styles.css sha256 unchanged.
- F2: comment added in `pinnedTarget` doc and `mapLine` doc. F4: plugin CHANGELOG bullet added.

## Changes (vs a4900dca, numstat)
- `src/framework/host/droppedWriteNotice.ts` +16/-5: `force` param on both notify functions (doc says why; a forced Notice sets the clock).
- `src/framework/host/ReadingModeBlockHost.ts` +7/-4: passes `force` at the three notify sites; F2 sentence in the `pinnedTarget` doc.
- `src/framework/host/SidebarBlockHost.ts` +1/-1: passes `force` at its one notify site.
- `src/framework/host/lineMap.ts` +3/-1: F2 sentence in the `mapLine` doc.
- `test/dom/framework/reading-mode-host-pin.test.ts` +64: describe "SC-556: a dropped form Save is never silent": (1) two more dropped form Saves within 5 s each show the Notice (3 Saves = 3 Notices, note untouched, `lastWriteReported` true), (2) a dropped card write then a dropped form Save within 5 s: 2 Notices, the second for the Save, (3) a burst of 3 dropped card writes is 1 Notice (limit kept), (4) a form Save restarts the clock (card write behind it adds none).
- `test/dom/framework/twin-reuse.test.ts` +17: real FormModal Saved 3 times within 5 s on a dropped block: Notices == 1, 2, 3 (exactly one per Save, none of the form's own), form open, note byte-identical.
- `test/dom/framework/sidebarBlockHost.test.ts` +24: sidebar card write drop -> 1 Notice, second card drop within 5 s -> still 1, form Save drop right behind -> 2.
- `test/dom/framework/dropped-write-notice.test.ts` +12: `force` for dropped and unsavable, clock restart.
- `draw-steel-elements/CHANGELOG.md` +9: `[FIX]` bullet (SC-556) at the top of the `## 7.0.0 (unreleased ...)` section (that file has no literal "Unreleased" heading; that section is its unreleased one), format of SC-477/SC-490. Says: nothing saved, a Notice says so, the form stays open, the outside change is kept, the Notice shows on every Save incl. a quick second one.
- Workspace `CHANGELOG.md` (+2 lines in the existing bullet): already named the Notice and that the form stays open; added "The Notice shows on every such Save, also when you press Save again within a few seconds."

## Red on a4900dca (src reverted, same 6 files): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r2/jest-touched-base-red.log`
`Tests: 4 failed, 316 passed, 320 total` (then +1 notice-unit test = 321 on the fix, all green: `jest-touched-green.log`). Failing: two-form-Saves-within-5 s (host), card-then-form-Save (host), sidebar form Save behind a card write, twin-reuse 3 Saves. Failure shape: `Expected 3 Notices, received 1` (later Saves silent).

## Gates (`$R2` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r2`)
- tsc (incl. `-p e2e`) rc 0 `$R2/gate-tsc.log`; lint (incl. e2e) rc 0 `$R2/gate-lint.log`.
- jest `--testTimeout=30000`: `Test Suites: 1 skipped, 257 passed, 257 of 258 total`, `Tests: 2 skipped, 6506 passed, 6508 total` (r1 6499 + 7) `$R2/gate-jest-t30.log`.
- jest plain: `Test Suites: 1 failed, 1 skipped, 256 passed, 257 of 258 total`, `Tests: 1 failed, 2 skipped, 6505 passed, 6508 total`; the one failure is twin-reuse "SC-547 ... 40 same-alias blocks" 5 s timeout (SC-568's load flake; loadavg 27 at start; the same file passes in the touched run and in the t30 run) `$R2/gate-jest-plain.log`.
- lifecycle part 3 `$R2/lc-part3.log`: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed` (G-S64 incl. (v), (w)). Part 1 `$R2/lc-part1.log`: `done: 21/21 ok, 0 failed` (G-S6u, G-S28 included).
- Skipped (code touched: Notice rate limiting in host/notice code only, plus tests/docs): lifecycle parts 2, 4, 5 and e2e.
- styles.css sha256 `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04` == clean 6270e84a build (r1 base build); `git status` clean after the build.

## Drive-by fixes:
- None.

## Follow-ups:
- In a single Save, if a sibling view's pending card write is flushed first (SC-544) and ALSO drops, the user sees that card write's Notice plus the Save's: two Notices for one Save. Rare (needs two edits of the same note dropping together); not addressed.
- SidebarBlockHost: after its first lost write, later writes return at `canPersist` (false) without reaching the lost/Notice path, so FormModal shows its own "couldn't save - the block may have moved" Notice there (never silent). Unchanged.

---

# r4 section (fix round: HIGH-1, LOW-1..LOW-4)

## Summary
- Verdict: DONE (G-S59 FAIL is the known SC-561 load flake). dse head `7095e3aa` (on `92288b73`); superproject `2f946190` (on `789bf152`).
- HIGH-1 fixed, by the reviewer's "alternative" (rebase the pin at open time) rather than the run-search at write time. Why: a write-time search that falls back to `mapLine` when the section changed would map a partial pin through the diff and could land in an identical twin outside the section (jest test 3 below fails on 92288b73 for exactly that reason), so Scott's ruling would not hold in embeds.
- Mechanism: `ReadingModeBlockHost.pinPosition()`, for a card inside `.internal-embed` / `.markdown-embed`, starts `rebasePin`: `vault.cachedRead` the note; if the section's lines (trailing blank lines dropped) occur in it exactly once, the pin becomes `{ text: whole note, lineStart: offset + relative line }`. Found twice or not at all: the pin is left as it was. `replaceSource` awaits the rebase (a `WeakMap` pin -> promise; no change to the `BlockPin` shape).
- Gated on the embed ancestor on purpose: the jest mock `Vault.cachedRead` waits a real macrotask, so awaiting it hung the fake-timer form tests (about a dozen timed out) in my first try. Plain forms never await it.
- Tests +8 jest (6 embed host tests, 2 for LOW-1); G-S64 gets phases (x), (y), (z), no new scenario. Gates: tsc/lint clean; jest 6514 / 2 skipped / 257 of 258 (`--maxWorkers=4`); lifecycle parts 1, 2, 3, 4 ok, part 5 G-S49 ok + G-S59 FAIL; e2e 128/128; styles.css sha256 unchanged.

## HIGH-1 detail
- `src/framework/host/ReadingModeBlockHost.ts` +48/-2: `pinPosition`, `rebasePin`, `pinRebased` WeakMap, one `await` at the top of `replaceSource`.
- Jest, `reading-mode-host-pin.test.ts`, describe "SC-556: a block edit form in a heading embed" (host on a section whose text and relative line numbers are the embed's, in a `.internal-embed.markdown-embed` ancestor):
  1. 500 lines on each side, nothing changed: Save lands, rest byte for byte, no Notice. RED on 92288b73 (refused + Notice).
  2. an identical block above the embedded section: Save writes the embedded block, never the twin; every other byte untouched. RED on 92288b73 (refused: the lines outside the section count as edits).
  3. the embedded block's body edited from outside while the form is open, an identical block outside the section holding the OLD body: Save writes nothing, one Notice, note byte-identical. RED on 92288b73: the edit lands in the twin (the mapLine-garbage case). This is the "Scott's ruling holds in embeds" check.
  4. the embedded block deleted from outside (600-line note): nothing written, one Notice. (Green on both.)
  5. an outside edit elsewhere in the source (above and below): Save still lands. (Green on both.)
  6. the section occurs twice in the note: the pin is left as it was (no guess). (Green on both.)
  Red-on-base command: `src/` reverted to 92288b73, same 8 test files; 3 failed (1, 2, 3 above), 349 passed: `$R4/jest-touched-base-red.log`. Green: `$R4/jest-touched-green.log` (`Tests: 352 passed`, 8 suites).
- Lifecycle G-S64 (`visual-harness/obsidian-lifecycle.mjs` +79/-2): fixtures `Lifecycle/gs64-emb-src.md` (1,220 lines: an identical counter above, 300 paragraphs, `## Tracker` + counter, `## After`, 300 paragraphs) and `Lifecycle/gs64-emb-host.md` (`![[gs64-emb-src#Tracker]]`); phases
  - (x) Reading view: Save lands in the embedded block, twin above and every other byte untouched, no Notice;
  - (y) Live Preview: same;
  - (z) the embedded block edited on disk while its form is open: nothing written into the twin. Measured: in Reading view the form closes with its embed's redraw (the note shown is the host note, not the source, so the form is not kept open), nothing written; if it were open the phase expects the one Notice. The refuse-with-form-open path is therefore covered by jest (3 above), not by Obsidian.
  The phases also assert the card sits inside `.internal-embed`/`.markdown-embed` (the rebase is keyed on it: measured true for both modes).
  Green: `$R4/lc-gs64-green.log`. Red with the host reverted to 92288b73: `$R4/lc-gs64-red-on-92288b73.log`: (x) and (y) FAIL ("the form closed after Save" timed out: Save refused), as the reviewer measured.
- Block embeds (`![[note#^id]]`): not measured (same class of pin if Obsidian gives them a partial section; the rebase would apply since they sit in `.internal-embed`). The CHANGELOG claims only heading embeds.

## LOW-1
`reading-mode-host-durable.test.ts` +38: `test.each` over (unplaceable block in a list item, note gone): three form Saves (no `fromView`) within 5 s show three `unsavableWriteMessage` Notices; three `fromView` writes show one and `lastWriteReported` true. Mutation check: with `force` forced false at both host sites (M7 line ~923, M8 line ~813) both cases fail (`$R4/jest-mutation-m7m8.log`: 2 failed), code restored.

## LOW-2 (comment only), LOW-3, LOW-4
- `lineMap.ts` and the `pinnedTarget` doc now say what happens: of two identical blocks with only blank lines between, the diff trims the common head so it reads the LOWER one as deleted: a form on the upper block saves into the surviving block (same note either way), a form on the lower block is refused (Notice, nothing written, form open). They also say a heading embed's pin is rebased so only real changes count toward the 400-edit limit. No behavior change.
- CHANGELOGs (workspace `CHANGELOG.md` and `draw-steel-elements/CHANGELOG.md`): "into another block" (no longer "identical block" promise); heading embeds named as unaffected; two plain limits: adjacent identical blocks with only blank lines between them (upper saves into the survivor, lower refused), and "hundreds of lines changed both above and below the block" (now true: after the rebase only real changes count).
- `sc556-dse-verify-proposal.md` rewritten: footgun 1 now "card writes only" (form Save Notice is forced since r2), G-S64 phases (v)-(z) listed, embed rebase + mock `cachedRead` macrotask footgun, final CURRENT pointers.

## Gates (`$R4` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r4`)
- tsc (incl. `-p e2e`) rc 0 `$R4/gate-tsc.log`; lint (incl. e2e) rc 0 `$R4/gate-lint.log`.
- jest `--testTimeout=30000` (the brief's t30), two runs: `Tests: 1 failed, 2 skipped, 6513 passed, 6516 total`, `Test Suites: 1 failed, 1 skipped, 256 passed, 257 of 258 total`, the one failure each time `chromeFocusHandoff` "SC-505 r3 LOW-A" (`$R4/gate-jest-t30-run1-1flaky-chromeFocusHandoff.log`, `...run2-...log`). That test depends on wall-clock windows in `chrome/focusHandoff.ts` (`SETTLE_MS` 1500, `REQUEST_TTL_MS` 5000), has no form or pin in it, and passes alone (24/24, `$R4/jest-focus.log`). Load was 12-40. Not SC-556; suggest adding it to SC-568's list.
  Clean full run with `--testTimeout=30000 --maxWorkers=4`: `Test Suites: 1 skipped, 257 passed, 257 of 258 total`, `Tests: 2 skipped, 6514 passed, 6516 total` `$R4/gate-jest-w4.log` (r2 6506 + 8 new = 6514).
- jest plain, one run: `Tests: 2 failed, 2 skipped, 6512 passed, 6516 total`; the two failures are exactly SC-568's: `initiative-default-keys` (SC-485 squad pool) and `twin-reuse` "SC-547 ... 40 same-alias blocks", 5 s timeouts at load 28 `$R4/gate-jest-plain.log`.
- Lifecycle, five foreground calls: part 1 `$R4/lc-part1.log` 21/21 ok; part 2 `$R4/lc-part2.log` 16/16 ok; part 3 `$R4/lc-part3.log` 9/9 ok (G-S64 with (x)-(z)); part 4 `$R4/lc-part4.log` 4/4 ok; part 5 `$R4/lc-part5.log` + `lc-part5-run1-gs59-timeout.log`: G-S49 ok, G-S59 `FAIL: Runtime.evaluate: timed out after 30000 ms` (2 runs, load 4-13; the known SC-561 failure, not chased).
- e2e `$R4/gate-e2e.log`: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- styles.css sha256 `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04` == clean 6270e84a build; shots/freeze/parity carry.

## Drive-by fixes:
- None.

## Follow-ups:
- `chromeFocusHandoff` "SC-505 r3 LOW-A" is a wall-clock flake under load (see above); belongs with SC-568.
- Block embeds `![[note#^id]]` not measured in real Obsidian.
- A heading embed of a note with two identical sections (same text twice): the pin is not rebased (no guess), so such a form keeps the pre-r4 behavior (refused when the note is long).

---

# r6 section (fix round: MEDIUM-1, MEDIUM-2, LOW-1, LOW-2, LOW-4; rebased)

## Summary
- Verdict: DONE. dse head `a3ac0769`, rebased onto dse origin/develop `2ee2e405` (SC-561 and SC-435 included; both rebases were clean, no conflicts). Superproject `63ea40ff` (CHANGELOG only, unchanged by the rebase).
- MEDIUM-1 + MEDIUM-2: the embedded card's pin is rebased by the embed's OWN LINK. `embedStartLine`: the embed element's `src` -> `getFirstLinkpathDest` must be this note -> `resolveSubpath(metadataCache.getFileCache(file), '#...')` -> `start.line` (heading line / `^id` block's first line). Heading and block subpaths both work.
- Hard rule kept: `verifiedPinLine` checks the position against the note text just read: the line must read like the first line of the section text Obsidian gave the block, and a fence of the host's language must open at the pin's line with the known body. A position that does not verify is no position.
- Unresolved subpath, no cache, no `src` / no `#`, a link to another note, nested embed: each returns null from the link path, and the TEXT SEARCH (kept as the fallback, for hover previews that have no `src` and for a lagging cache) runs. It accepts only a run that occurs EXACTLY ONCE, never a choice between identical runs. Nothing verifies: the pin is left as it was.
- Nested embed: the nearest `.internal-embed[src]` is used (the innermost embed names the note this block belongs to); its link must resolve to this note or the link path steps aside. Not measured in real Obsidian.
- Tests: +14 jest in `reading-mode-host-pin.test.ts`; G-S64 phases (xa), (ya), (xb). Gates on the rebased head: tsc/lint clean; jest 6622 / 2 skipped, 258 of 259 (t30 AND plain, both clean); lifecycle 52/52 with G-S59 passing; e2e 163/164, 1 known-bug, 113/113; styles.css sha256 identical to a 2ee2e405 build.

## What changed (vs 2ee2e405, numstat)
- `src/framework/host/ReadingModeBlockHost.ts` +131/-21 in total for the ticket (r6: `rebasePin` now `verifiedPinLine` ?? `searchedPinLine`; new `embedStartLine`, `fenceAt` (shared with `pinnedTarget`); `resolveSubpath` import).
- `test/mocks/obsidian-core.ts` +23: a `resolveSubpath` mock over a cache's `headings` / `blocks` (the first heading of that name, case-insensitive; the `^id` block).
- `test/dom/framework/reading-mode-host-pin.test.ts` +370 in total: describe "SC-556 r6: an embedded block's pin is rebased by the embed's link" (below).
- `visual-harness/obsidian-lifecycle.mjs`: fixtures `Lifecycle/gs64-embb-src.md` / `gs64-embb-host.md`, `embedCase` takes `kind` ('heading' | 'block') and `how` 'plus'; only G-S64 code and its fixtures are ours (`git diff 2ee2e405..HEAD -- visual-harness/obsidian-lifecycle.mjs`: hunks at the G-S64 header comment, the fixtures, and inside G-S64).
- Both CHANGELOGs (LOW-1): "however long that note is" removed. They now say: a form in an embed of one heading or one block (`![[note#Heading]]`, `![[note#^id]]`) is unaffected, also right after pressing +; it finds its block by the embed's own link; in a hover preview, or when Obsidian's index of the note is behind a change, it finds the embedded part by its text, and if that text is not unique in a long note Save is refused with the same Notice.

## Tests (+14 jest, 10 listed bullets because some are test.each)
1. (a) + then pencil: section text stale (old value), host body newer, 1,000-line note: Save lands. RED on 7095e3aa.
2. (b) block embed `^blk` of the LOWER of two identical blocks, short note: writes the embedded block, not the other. RED on 7095e3aa (and base: the text was found twice, no rebase). 3. The same in a long note. RED on 7095e3aa.
4. (c) heading embed of a note with two identical sections: writes the first (the one `resolveSubpath` names, which Obsidian embeds). RED on 7095e3aa.
5. (d) a cache whose heading line is the twin's heading line (its line + the pin's line is the twin's fence): the anchor-line check rejects it; the text search places the pin; the twin is not written.
6. (d) a lagging cache AND a stale section text, long note: pin stays as it was, Save refused, Notice, note unchanged.
7. Four "link path steps aside" cases (no `src`; no subpath; a link to another note; a subpath that does not resolve): the text search places the pin. 8. No metadata cache: the same.
9. The block at the cache's position holds another body than the host knows: the pin is not rebased (`pin` equal to its input). 10. LOW-2: the part's own trailing blank lines are dropped by the text search (section is the last of the note and its text ends with two blank lines, the file with one): Save lands.
Red on 7095e3aa (src reverted, same 8 test files): `$R6/jest-touched-red-7095e3aa.log`: `Tests: 4 failed, 360 passed, 364 total` (a, b-short, b-long, c). Green: 364 then 366 after the two extra tests.
Mutations (my own, each on `reading-mode-host-pin.test.ts`): R4 (no trailing-blank trim) 1 failed; S1 (take the first of two identical runs) 1 failed; V1 (no anchor-line check) 1 failed; V3 (no body check) 1 failed. All killed (logs `$R6/mut-{R4,S1,V1,V3}.log`).

## LOW-2 decision
The trailing-blank-line trim is kept (the text search is still used for hover previews and a lagging cache), and now has the test above (item 10); mutation R4 is killed.

## Lifecycle G-S64 in real Obsidian (no new scenario)
- (xa) heading embed of the 1,220-line note, Reading view: the + on the card and at once its pencil, Save lands in the embedded block (value 6, name Edited), twin above and every other byte untouched, no Notice. (ya) the same in Live Preview. (xb) block embed of the lower of two identical counters in a 21-line note: Save writes the embedded block, not the one above. Green log `$R6/lc-gs64-green.log`; with the host reverted to 7095e3aa: `$R6/lc-gs64-red-on-7095e3aa.log`: (xa) and (ya) refused (timed out waiting for the form to close after Save), (xb) writes the block above (`name: Edited` on the first counter).
- That (xa), (ya) and (xb) pass proves the subpath path (not the text search) is what runs in real Obsidian: (xb)'s text occurs twice and (xa)'s section text is stale, so the text search could not have placed either.

## Gates (`$R6` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r6`), final head `a3ac0769` on 2ee2e405
- tsc (incl. `-p e2e`) rc 0 `$R6/gate-tsc.log`; lint (incl. e2e) rc 0 `$R6/gate-lint.log`.
- jest `--testTimeout=30000`: `Test Suites: 1 skipped, 258 passed, 258 of 259 total`, `Tests: 2 skipped, 6622 passed, 6624 total` `$R6/gate-jest-t30.log`.
- jest plain: the same numbers, clean (no SC-568 timeout this run) `$R6/gate-jest-plain.log`. (Earlier, on the 6153acfe-based head, a plain run had one SC-568 `twin-reuse` timeout: `$R6/pre-rebase2/gate-jest-plain.log`.)
- Jest count check: a clean 2ee2e405 tree in a scratch copy gives `Test Suites: 1 skipped, 258 passed, 258 of 259 total`, `Tests: 4 skipped, 6583 passed, 6587 total` (`$R6/jest-base-2ee2e405.log`; the scratch copy skips 2 more tests than a real worktree because it lacks cached artifacts). The branch adds 37 tests in all (r1 8, r2 7, r4 8, r6 14): 6583 + 37 = 6620, plus the 2 tests that run in my worktree and skip in the scratch copy = 6622. That matches the measured 6622 passed / 2 skipped.
- lifecycle, five foreground calls: part 1 `$R6/lc-part1.log` 21/21; part 2 `$R6/lc-part2.log` 16/16; part 3 `$R6/lc-part3.log` 9/9 (G-S64 with (v)-(z), (xa), (ya), (xb)); part 4 `$R6/lc-part4.log` 4/4; part 5 `$R6/lc-part5.log` 2/2 (G-S59 PASSES now, G-S49 ok).
- e2e `$R6/gate-e2e.log`: `OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`.
- styles.css sha256 `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04` for the HEAD build and for a clean 2ee2e405 build (`$R6/base-2ee2e405/styles.css`); the same hash as 6270e84a's. Shots 592 / freeze 280 / parity 0/0/24 carry.
- Superproject: `git status` clean in the dse worktree; the pointer for landing is the dispatcher's.

## Drive-by fixes:
- None.

## Follow-ups:
- Nested embeds and canvas file nodes were not measured in real Obsidian (by construction they use the nearest `src` or fall back to the text search).
- In a hover preview a form opened right after a +, or in a note whose index lags, uses the text search: a stale section text there is still refused in a long note (the old MEDIUM-1 symptom). The hover link has no `src` on the element (measured by the r5 reviewer as `.popover.hover-popover > .markdown-embed`).

---

# r8 section (fix round: MEDIUM-A, MEDIUM-B, LOW-1, LOW-2; rebased onto 10db67e3)

## Summary
- Verdict: DONE. dse head `f69b8fd6`, rebased onto dse origin/develop `10db67e3` (SC-558). Superproject `5c5641e7` (CHANGELOG only).
- Rebase: 1 conflict, dse `CHANGELOG.md` (SC-558's bullet vs mine at the same spot): kept both, SC-558's first. SC-558's tests/docs did not conflict with anything of mine.
- MEDIUM-A: for a `^id` subpath `verifiedPinLine` now also requires the first non-blank line after the block's closing fence to be `^id` (the reviewer's K1/K5 are tests, short and long note).
- MEDIUM-B: an embedded card's pin that `rebasePin` could not place stays in a `partialPins` WeakSet; `pinnedTarget` refuses it, so Save writes nothing, shows the existing Notice (text unchanged), form stays open. An embed of a WHOLE note (src with no `#`) is not partial.
- G-S64 gets the hover phase (zh): a hover preview of `[[note#^blk]]` with an identical block above writes nothing; with the host reverted to the r6 head it writes the block above (and says nothing).
- Gates: tsc/lint clean; jest 6634 / 2 skipped / 258 of 259 (t30 and plain, both clean); lifecycle 52/52 (21+16+9+4+2, G-S59 ok); e2e 163/164 ok, 0 failed, 1 known-bug, 113/113; styles.css sha256 equals a clean 10db67e3 build.

## Changes (vs 10db67e3: 15 files, +1074/-46 for the whole branch; r8's part)
- `src/framework/host/ReadingModeBlockHost.ts`: `partialPins` WeakSet (+ doc), set in `pinPosition` for embeds whose link has a `#` (or no `src`, i.e. hover previews), cleared by `rebasePin` on success or when the part IS the note; `pinnedTarget` returns null for a partial pin; `embedStartLine` returns `{ line, blockId }`; `verifiedPinLine` checks the `^id` marker (case-insensitive, own line, after blank lines) for block subpaths.
- `test/dom/framework/reading-mode-host-pin.test.ts`: +7 tests (below). `visual-harness/obsidian-lifecycle.mjs`: fixture `Lifecycle/gs64-hov-host.md`, `hoverCase`, phase (zh); only G-S64 code and its fixtures are ours.
- Both CHANGELOGs (LOW-1): "A form in an embed finds its block by the embed's own link. In a hover preview, or when Obsidian's index of the note is behind a change, it finds the block by its text instead. If the plugin cannot tell which block an embed or preview shows (the same text appears twice, or the block changed before you opened the form), Save writes nothing and shows the same Notice, in a short note as in a long one, and never writes into another block."
- `sc556-dse-verify-proposal.md` (LOW-2): final text, "Refreshed at r4" removed, G-S59 removed from footgun 5 (it passes since SC-561), footgun 3 deduped into one paragraph, (zh) added.

## Tests (+7 jest; the branch now adds 44 in all)
1. K1 / K5 (`test.each` short and long note): a metadata cache that lags, so its `^blk` line is now an identical block's fence: the marker is not there, nothing verifies, Save writes nothing + Notice, note byte-identical. RED on a3ac0769 (writes the twin).
2. Hover preview (no `src`) of a block link with an identical block above, short note: Save writes nothing + Notice. RED on a3ac0769 (the block above is written).
3. Hover preview of a block whose text is unique: the text search places the pin and Save lands.
4. K3: a heading embed whose block was edited from outside BEFORE the form opened while the embed still shows the old section, a twin above holding the old body: nothing written + Notice. RED on a3ac0769.
5. An embed of a whole note (`src` with no `#`) whose note changed since it was drawn: Save lands (a partial-pin refusal must not reach it).
6. LOW-2/V2: a link that resolves to ANOTHER note, with two identical sections in this note (the text cannot decide): Save writes nothing. Without the link-target check the cache would verify the FIRST section and write it.
Red on a3ac0769 (src reverted, same 8 test files): `$R8/jest-touched-red-a3ac0769.log`: 5 failed (K1, K5, hover-twin, K3, V2-link; the last fails there because the partial pin was mapped), 368 passed, 373 total. Green: `$R8/jest-touched-green.log` 373 passed.
Mutations killed (`reading-mode-host-pin.test.ts`): V2 (no link-note check) 1 failed; MARKER (no `^id` marker check) 2 failed; PARTIAL (`pinnedTarget` ignores partial) 5 failed; WHOLE (a whole-note embed also partial) 1 failed (`$R8/mut-{V2,MARKER,PARTIAL,WHOLE}.log`).

## Lifecycle (zh)
Real Obsidian 1.15.1: hover (`hover-link` with Ctrl) on a link to `^gs64blk` in a short note with an identical counter above it; the preview card has NO `src` (asserted); Save: exactly one Notice with the exact text, the note byte-identical (nothing written, in particular not the block above). The preview closes when the pointer leaves it and its form closes with it, so the phase records whether the form is still open instead of asserting it (first try asserted it and failed for that reason only). Green `$R8/lc-gs64-green.log`; with `ReadingModeBlockHost.ts` reverted to the r6 head: `$R8/lc-gs64-red-on-a3ac0769-host.log`: "Save said nothing" (the block above was written, no Notice, form closed).

## Does any embedded shape that saves today start refusing?
- Still save, tested or measured: a heading or block embed whose link verifies; the same right after + (xa/ya); a nested embed (nearest `src` verified; r7 measured it); a full-note embed `![[note]]` even when the note changed since it was drawn (test 5: not partial); a hover preview whose text is unique in the note (test 3); a plain Reading-view block (no embed: untouched).
- Now refuse (before: mapped against the note, which put the write on the right block only by luck): a hover preview or embed whose block text occurs twice in the note and whose link does not verify; a hover preview opened right after a + (stale text, no `src` to use); an embed whose block changed from outside before the form opened (K3); a `cachedRead` that rejects (the pre-r8 short-note success relied on the same mapping). A hover preview of a WHOLE note (`[[note]]`) whose text changed after it was drawn is also partial (no `src` to tell) and refuses. I found no embedded shape that saved correctly by design and now refuses.
- Cost, as ruled: in the ambiguous no-outside-change case the Notice says "changed on disk first" although nothing changed on disk (no data lost; the Notice text is not reworded).

## Gates (`$R8` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r8`), final head `f69b8fd6`
- tsc (incl. `-p e2e`) rc 0 `$R8/gate-tsc.log`; lint rc 0 `$R8/gate-lint.log`.
- jest `--testTimeout=30000`: `Test Suites: 1 skipped, 258 passed, 258 of 259 total`, `Tests: 2 skipped, 6634 passed, 6636 total` `$R8/gate-jest-t30.log`. Plain run: the same numbers, clean `$R8/gate-jest-plain.log`.
- Delta check: a clean 10db67e3 tree (scratch copy, which skips 2 more tests than a real worktree): `Tests: 4 skipped, 6588 passed, 6592 total` `$R8/jest-base-10db67e3.log`; 6636 - 6592 = 44 = the branch's tests (r1 8, r2 7, r4 8, r6 14, r8 7).
- lifecycle, five foreground calls: part 1 `$R8/lc-part1.log` 21/21; part 2 `$R8/lc-part2.log` 16/16; part 3 `$R8/lc-part3.log` 9/9 (G-S64 with (v)-(z), (xa), (ya), (xb), (zh)); part 4 `$R8/lc-part4.log` 4/4; part 5 `$R8/lc-part5.log` 2/2.
- e2e `$R8/gate-e2e.log`: `OBSIDIAN-E2E done: 163/164 ok, 0 failed, 1 known-bug, coverage: 113/113 pairs`.
- styles.css sha256 `4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01` for my build and for a clean 10db67e3 build (`$R8/base-10db67e3/styles.css`): equal (and different from the old 16e9aa64…, as SC-558 changed CSS), so shots 592 / host-leak 163/978 / freeze 280/280 / parity 0/0/24 carry; not re-run.

## Drive-by fixes:
- None.

## Follow-ups:
- The "changed on disk first" Notice for an ambiguous embed or hover where nothing changed on disk is the accepted wording cost (owner ruling); a future ticket could add a separate message.
- Canvas file nodes still unmeasured in real Obsidian.
