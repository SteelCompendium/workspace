# SC-596 r4 fix + rebase report (implementer)

**Executive summary**
- Status DONE. dse branch `sc596-hover-embed-form-wrong-block` HEAD `c6077860`, rebased onto `origin/develop` `7866426e` (SC-606, montage only; no conflicts, package.json unchanged). Superproject CHANGELOG commit `bb622f86` (submodule pointer not bumped). No pushes.
- LOW-1: two new jest tests (non-embedded callout card, second + in the stale window lands; non-embedded list-item form `pinPosition()` null). Mutant k6 (drop `embedded ?` at the no-own-fence branch) now dies: 2 tests fail. I also killed a sibling mutant on the no-section branch (`k6b`: 1 fails).
- LOW-2 / LOW-3: docs only (CHANGELOG, proposal §1, §3, §4). No code change in r4.
- Owner item: Notice measured per case (table below); CHANGELOG bullet shortened to 6 lines; proposal §1 states the exact messages.
- Gates on the rebased branch: tsc / tsc -p e2e / lint 0 / 0 / 0; jest 10624 passed / 2 skipped (7707 + 2917); lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2: 185 / 323 / 409 / 294 / 390 / 175 s); e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; styles.css `5e5ff488…dc2b27` = clean 7866426e build.

## Commits
- dse `c6077860` test: the two non-embedded tests (in `reading-mode-host-form-pin.test.ts`, in the card describe). Branch = the 7 r2 commits rebased (`d93fe5a7` was the rebased r2 tip) + this one.
- superproject `bb622f86` docs: shortened CHANGELOG bullet.
- Proposal updated in the ledger dir (not a commit).

## LOW-1 evidence (`sc596-r4-mutant-k6.log`)
- Test 1: a card in a callout of the note itself (no embed): `+` lands; the window is still the pre-+ text, the second `+` has no own fence, `pendingPin` is null, the window freshens, the write lands (`values ['7']`, no Notice).
- Test 2: non-embedded list-item form: `pinPosition()` is null.
- Mutant k6 (`return this.pinFromLastWrite() ?? this.refusingPin();`): 2 failed / 2915 passed (both new tests). Mutant k6b (`if (!section) return this.refusingPin();`, guard dropped): 1 failed (the existing "card outside any embed with no section" control).

## Owner item: which Notice shows where (measured)
Source: the sweep oracle (2880 cells, kind asserted per cell; counts from the same oracle), named tests, FormModal.
| Notice (full text after "Draw Steel Elements: a change to a block in <note> was not saved — ") | when |
|---|---|
| "the block changed on disk first." | a pin exists and nothing places it: block edited / deleted from outside, a heading link naming two places while the body occurs twice, lagging / wrong cache, unresolved subpath, no cache, a paragraph of the section edited, Y1-Y6. 1752 of the 2880 sweep cells (every non-list construct) |
| "the plugin can't tell where this block sits in the note." | a REFUSING pin: stale non-plain window with no own-write record (P13, N1, N4), section gone at the pencil (N3b), the same for a card + / -; plus list items / footnotes whose window no longer shows a list line (228 of 720 cells, block deleted) |
| same, with " (blocks inside lists can't be edited yet)" appended | list item / footnote while the note's lines at the part hold a list line (492 of 720 cells) |
| none from the host; FormModal shows "Draw Steel Elements: couldn't save — the block may have moved." | the section never resolved (N3): `canPersist` is false |
Card Notices are rate limited (once per note per 5 s, per message); a form's is forced. CHANGELOG now names the first two; proposal §1 has the full table.

## Docs changed
- `/home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block/CHANGELOG.md`: 6 lines: user-visible change first, the Notices in one clause, rare newly refusing shapes in one sentence (stale callout or vanished section even with no twin, also for + / -; heading link whose name occurs twice with identical counters).
- Proposal `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/sc596-dse-verify-proposal.md`: §1 exact Notice table, LOW-2 shapes (refusing pin with a unique body; nested `#P2#Tracker` heading link refused like two `## Tracker`), §3 and §4 block-hover residual (`popoverShows` cannot tell two block previews apart; forms share it now; jest-only), §5 timings, §6 CURRENT draft with the new numbers.

## Gates (rebased branch `c6077860`; code unchanged since the rebased `a65207fc`)
| gate | result | log |
|---|---|---|
| tsc, tsc -p e2e, lint | 0 / 0 / 0 | `sc596-r4-gate-tsc-lint.*` |
| jest | 10624 passed / 2 skipped, 265 suites + 1 skipped, 60 s, no timeouts | `sc596-r4-gate-jest.log` |
| lifecycle 1 | 21/21, 185 s | `sc596-r4-gate-lifecycle-part1.log` |
| 2 | 16/16, 323 s | `…part2.log` |
| 3 | 9/9, 409 s | `…part3.log` |
| 4 | 4/4, 294 s | `…part4.log` |
| 5 | 7/7, 390 s | `…part5.log` |
| 6 `--only=G-S92,G-S96` | 2/2, 175 s | `…part6.log` |
| e2e | `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, 183 s | `sc596-r4-gate-e2e.log` |
| styles.css | branch `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = clean 7866426e build; main.js branch `7f619bd0…`, clean `9f69846b…` | `sc596-r4-gate-styles-sha.log` |
Shots / freeze / parity carry (styles identical), not re-run. Union lifecycle 59/59. dse worktree clean after the runs.

## Drive-by fixes
None.

## Follow-ups
- None new. (Carried: card refusing-pin Notice is rate limited; SC-607 and the block-hover popover residual now apply to forms.)
