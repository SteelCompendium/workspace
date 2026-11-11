# SC-584 r3 fix report

**Executive summary**
- STATUS DONE. Rebased onto dse develop **734d7745** (first onto a339e7b3, then SC-575 landed; all gates re-run on 734d7745). dse HEAD `3e81f9a5` (8 commits over 734d7745), superproject `43f99341` (CHANGELOG only).
- HIGH-1 fixed with fix (a): `openTimeBodyLine` is gone. A form's pin after a + is the position of the host's own + write (`lastWrite`, recorded inside `Vault.process`), judged by `mapLine` / `pinnedTarget`. P1 P1d P2 P2n P3 refuse because of that judgement; they pass on 734d7745 and fail on the r1 source.
- Case 1 (short note, heading hover, whole long-note hover F3) and the callout + then pencil case land. P5 (plain `^id`) lands again.
- Gates on 734d7745: tsc/lint clean; jest 7111 passed / 2 skipped; lifecycle 53/53; e2e 255/262 ok, 0 failed (third full run; runs 1 and 2 failed RECOV-R07 and CENSUS-07 at loadavg 20-28, both green alone); styles.css `5e5ff488…` = clean 734d7745 build, so shots/freeze/parity carry.
- Red on base: 10 pin tests fail on 734d7745's source (landing), 13 on the r1 source (incl. P1-P3); G-S64 on the 734d7745 bundle fails (zk)(zl)(zm)(xc)(yc)(xd)(yd), (zn) passes.
- Mutants: every mutant of existing code killed except four shown equivalent (see Mutants).
- Behaviour change to note: the lifecycle phase (zm) (+ makes the block read like the one above it) used to expect a refusal; it now lands in the + block (position, not body search). Card writes are unchanged from base.

## Rulings
- **HIGH-1: FIXED** by fix (a). `replaceSource` sets `lastWrite = {body, text: note after the write, lineStart}` inside the `Vault.process` callback, only for a host drawn in `.markdown-embed` / `.internal-embed` and only when `fenceAt(next, lineStart)` finds the block. `rebasePin` (form pins only) tries the link, then the unique-text search, then the record: accepted when the body known at open equals the record's body; `pin.text = record.text`, `pin.lineStart = record.lineStart`, no longer partial. Nothing searches the note for a body. `openTimeBodyLine` removed: no case it alone covers (all case-1 shapes land through the record; P1-P3 would not be refused by it).
- **MEDIUM-1: FIXED.** Both CHANGELOGs and the proposal say what the code guarantees: saves into the block the + was pressed on; refuses when that block is edited or deleted since; unchanged (refused) for a hover/embed with no + on that card; callout embed whose `^id` is not directly under the callout still refused.
- **MEDIUM-2: FIXED (proposal).** Footgun corrected to the measured behaviour (moving into the form is fine, the first mouse click closes popover and form, SC-595; the `hp.hide` hold stands in for the click-free path).
- **LOW-1: FIXED.** The `^id` marker is searched after the part's end only when the found fence is quoted (`parseOpenFenceLine(...).prefix !== ''`); a plain fenced block keeps "after its closing fence". Test P5 lands (fails on r1, passes on 734d7745).
- **LOW-2: FIXED.** See Mutants.
- **LOW-3: FIXED.** Form pins are made by `takePin(true)`, card pins (`notePersistIntent`) by `takePin(false)`, which never uses the record: card writes behave as on 734d7745. Test "a card (+/-) write's pin never uses the host's last write" (second + with a stale part and an identical block: refused as before, SC-480); the old test with the misleading name is gone; mutant m-card kills.
- **LOW-4: FIXED.** (zc) kept only as a labelled smoke check, with a comment that (zc) and (z) are not controls; the controls with teeth are the jest tests (callout edited from outside after the +, P1-P3). New lifecycle (xd)/(yd): callout embed + then pencil, RV/LP, land.
- **INFO-1, INFO-3:** only where fix (a) gives the + then pencil callout case a pin from the host's own write: `takePin` returns `pinFromLastWrite()` for a form when a callout's own fence is not found in the stale part (jest: lands; edited-after-+ case refuses). No general null-pin change. P4/P13-without-+ are SC-596.
- **F3: FIXED.** Jest "a hover of a whole LONG note scrolled to the card" lands. No lifecycle phase (part 3 left alone).

## Design of fix (a)
- Which writes count: this host's own `replaceSource` writes (card + / - or a form Save) completed inside `Vault.process`, for a host drawn in an embed or hover preview. A write by another host (second pane) is not recorded (per-instance field; test + mutant m-sibling).
- Lifetime: replaced by the host's next write; cleared by `setMountedBody`; dies with the host. It cannot go stale into a later unrelated form: it is used only when the part is stale (link and text found nothing) and the body known at open equals the record's body (always true for a record the host wrote, since only writes and `setMountedBody` change `knownBody`); the pin is the note as the write left it, so every edit since is judged by `mapLine`/`pinnedTarget` (pin-only, body check). A very old record whose note changed by more than the diff limit refuses (a false refusal, never a wrong block); a current part still goes through the link / text first (test: 1000 lines inserted around, part redrawn: saves).
- The record and the known body are read when the pin is made, before the open-time `cachedRead` (a write landing during the read does not change the pin; test + mutants mG, mG2).
- Real-Obsidian check (G-S64): + then pencil on a hover of a short note and of `[[long#Tracker]]`, a block embed of a callout (RV, LP) and the "reads like the one above" case all land; control (zn) (outside edit of the own block plus an appended block with the + body, form open): nothing written, one Notice.

## Jest tests (reading-mode-host-pin.test.ts, 74 on base, 101 now)
Kept from r1: the callout `^id` tests (lands; marker other/absent; cache points at the upper). Rewritten: r1's case-1 tests (they set the body by `setMountedBody`; now the + is the host's own write through `plus()`), the "twin at open refuses" test (now lands in the + block: position, not search). Deleted: r1's two "open-time read" tests tied to the removed rule (the "predates the +" one kept in new form). Restored: the SC-556 test "a cache that lags AND a section text that is stale" to its 734d7745 form (refused, no host write). Added: P1 P1d P2 P2n P3 and a no-edit P1 shape, F3, heading hover, short note, own block edited after open, identical block added after open, no + by this host (refused), current part with a note changed by 1000 lines, card write stays refused, sibling host, record read at pin time, callout + then form lands / refuses after an outside edit, plain `^id` stale-longer part (P5), id not the next line after the callout.

## Commits (dse, branch sc584-embed-form-save-refusals; the first five are r1 rebased)
- `c64e756f` r1 tests, `c8f8ef57` r1 fix (open-time rule), `a1ebca4a`, `99a141ed` r1 phases, `ec4875a2` r1 CHANGELOG
- `82be6156` r3 fix: `lastWrite`, `takePin`, marker rule, jest tests
- `50f7a508` r3 tests: G-S64 (zm) lands, (xd)(yd), (zc) relabelled; jest controls
- `3e81f9a5` r3 dse CHANGELOG reworded
Superproject `43f99341` CHANGELOG reworded (on top of `0c430d0d`). No pointer bump. `git status --porcelain`: dse empty; superproject ` M draw-steel-elements` (pointer only).

## Gate lines (734d7745 base)
- tsc `TSC_RC=0`; lint `LINT_RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7111 passed, 7113 total` (fresh worktree, no SC-568 timeout).
- lifecycle: p1 `21/21 ok` 188 s · p2 `16/16 ok` 338 s · p3 `9/9 ok` 445 s · p4 `4/4 ok` 303 s · p5 `3/3 ok` 256 s = 53/53 (calls over 180 s are moved to the background by the harness; each read to its end).
- e2e: `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (run 3, 387 s). Run 1: 254/262, 1 failed (RECOV-R07, load-sensitive, SC-517/SC-570), run 2: 254/262, 1 failed (CENSUS-07, a 45 s timeout), loadavg 20-28 from other agents; `--only=CENSUS-07,RECOV-R07` alone: `2/2 ok`.
- styles.css `5e5ff4884e05…` = clean 734d7745 build (also equal to the a339e7b3 build): shots 592 / host-leak 163/978 / modal 39 kinds 234 / clip 147, freeze 280/280, parity 0/0/24 carry, not re-run.

## Red on base
- jest, current tests on the r1 source (`c8f8ef57`): 13 failed / 101: P1, P1d, P2, P2n, P3 (the r1 code wrote the identical block), the restored SC-556 test, plain-`^id` P5, no-+ refusal, sibling, callout (2), "+ made the block read like another", no-outside-edit shape. Log `sc584-r3-red-on-r1-jest.log`.
- jest, current tests on the 734d7745 source: 10 failed / 101: the landing tests (short note, heading hover, F3, callout `^id`, callout + then form, shape with no outside edit, "+ made it read like another", identical block added after open, callout control, record read at pin time). P1 P1d P2 P2n P3 and P5 PASS there (base refused / base saved). Log `sc584-r3-red-on-base-jest.log`.
- lifecycle G-S64 on the unpatched 734d7745 bundle: `done: 0/1 ok, 1 failed`; FAILs (zk) (zl) (zm) (xc) (yc) (xd) (yd); (zn) passes. Log `sc584-r3-red-on-base-lifecycle-G-S64.log`.

## Mutants (jest pin suite, `sc584-r3-mutants.log`, script `sc584-r3-mutate.py.txt`; run on a339e7b3, the host source and the test file are byte-identical on 734d7745)
The reviewer's mA B D E G H I J target `openTimeBodyLine`, now deleted. Still-existing code:
- mC (`^id` anywhere after the block): killed (4). mM (part end for plain blocks too): killed (1, P5). m-card (card pin uses the record): killed (1). m-sibling (record shared by every host): killed (1; it survived twice before the test used an embedded second host and set the body first). mG (record read after the note read): killed (2). mG2 (known body read after the read): killed (1). mO (no pin from the record for a callout): killed (2). mQ (nothing recorded): killed (9). mR (record before the link): killed (1, the current-part test).
- mF (part end without `max` against the fence end): EQUIVALENT: the part always contains the block's own fence, whose body equals the known body, so the part cannot end before the fence's end. Kept as a defence.
- mK (record kept on `setMountedBody`), mL (no body equality record/known body), mN (record not verified by `fenceAt`): EQUIVALENT: the record's body is always the known body (only a write, which replaces the record, or `setMountedBody`, changes it) and `fenceAt` finds a block a splice just wrote. Kept as defences.

## Drive-by fixes:
None.

## Follow-ups:
1. Real-Obsidian end-to-end for P1-P3 is not reachable (the outside edit's redraw closes the form); they are jest-only, as in r2.
2. A hover over a block-link of a note whose block was edited before open without a + (P4, searchedPinLine) and a callout form with no + and a stale part (P13 without +) remain SC-596.
3. The record is held as a full note string per host that wrote in an embed; fine for a note-sized string, but a long-lived hover host in a huge note keeps one copy until its next write. No action unless a profile says so.

## Evidence artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/)
sc584-r3-fix-report.md, sc584-dse-verify-proposal.md (r3), sc584-r3-gate-{tsc,lint,jest,e2e,styles-sha}.log, sc584-r3-gate-lifecycle-p1..p5.log, sc584-r3-gate-e2e-run1-RECOV-R07.log, sc584-r3-gate-e2e-run2-CENSUS-07.log, sc584-r3-gate-e2e-only.log, sc584-r3-red-on-r1-jest.log, sc584-r3-red-on-base-jest.log, sc584-r3-red-on-base-lifecycle-G-S64.log, sc584-r3-mutants.log, sc584-r3-mutate.py.txt.
