# SC-625 r4: scoped re-review of the r3 delta

**Executive summary**
- Verdict: **LAND-READY.** Reviewed dse `76520b1f` (5 commits on `develop` `8a81c5a7`) and superproject `ce606935` (CHANGELOG) + `d0ff29a4` (bump) on workspace `origin/main` `c3f9b129`.
- Findings: HIGH 0, MEDIUM 0, LOW 1, INFO 2.
  - L-1: the CHANGELOG says a comment "is still rewritten". A comment is removed, not rewritten (`CHANGELOG.md:13-15` in `ce606935`).
- Measured on `76520b1f` (fresh worktree): tsc exit 0, lint exit 0, jest **12575 passed / 2 skipped** (12551 + 24), e2e **`484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`** (pointer parked). MONT-X09..X14 are all ok, and no SC-625 known bug is left.
- Lifecycle not re-run. r3's `src/` delta after the r1 fix is a comment only. r3's evidence is seven real `--only=` parts (21+16+9+4+7+4+3 = 64/64, each log echoes its own id list).
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on a clean `8a81c5a7` build and on head. Shots, freeze and parity carry.
- Base check (`src/` at `8a81c5a7`, tests at head): **23 of 275** fail, matching r3's report. All 6 tests this round added or extended fail there.
- Rebase checks out. `8a81c5a7` is an ancestor of HEAD. The fix commit `c272d209` is line-for-line r1's `8b7dc083`. `52889820` changes a comment only. No e2e manifest file is touched, so there was no conflict to resolve, and coverage is 287/287.
- Superproject: `origin/main..HEAD` is exactly 2 commits. The bump changes only the `draw-steel-elements` gitlink, to `76520b1f`. `origin/main` `c3f9b129` is one docs commit past `8dd3c4a4`, and both pin dse at `8a81c5a7`. No `Co-Authored-By` or AI attribution in any commit on either branch.
- `sc625-skill-proposal.md` is correct: its numbers match what I measured and its anchors are at the lines it names.

## 1. Rebase (brief item 1)
- `git merge-base --is-ancestor 8a81c5a7 HEAD` succeeds. `origin/develop` = `8a81c5a7` after the fetch.
- `git diff 8a81c5a7..HEAD --name-only -- src/` lists only `src/elements/montage/model.ts`. The `+`/`-` lines of `8a81c5a7..c272d209 -- src` equal those of r1's `11fbded6..8b7dc083 -- src` (diff empty). `c272d209..HEAD -- src` is one doc-comment hunk in `model.ts:139-148`: the placement sentence, the integer-key note and the I-5 warning. No code changed.
- Manifest: the r3 diff touches 4 files (`integrity.e2e.ts`, `model.ts`, `montage-matrix.test.ts`, `montage-serialize.test.ts`) and no `e2e/manifest/*` file. Nothing from SC-439 is dropped. No `[ID]` is duplicated across `e2e/specs` (`uniq -d` empty). No title in `e2e/specs` carries a bracketed `[SC-…]`. No `knownBug('SC-625')` or SC-625 `test.failing` is left.

## 2. Folds against the rulings (brief item 2)
| Ruling | Where | Verdict |
|---|---|---|
| L-1: doc comment + integer-key unit test, no `Map` | `model.ts:143-148` comment; `montage-serialize.test.ts` "a key that looks like an integer is written FIRST, quoted…" (top-level `"2024"` first, entry `"7"` first, stability on a second pass) | matches; fails on base |
| L-2: "kept, with the same values", no "as you typed them" | superproject `ce606935` `CHANGELOG.md:13-15` | matches; one wording slip, see L-1 below |
| L-3: six write paths | jsdom `[X11]` ×4 (Undo, sheet edit, sheet Remove, Back to round) on a two-action fixture, each action with extras; `[X12]` Clear all (limit reached) + Reopen (out of rounds) | matches; all 5 fail on base |
| L-3: hostile `constructor` / `toString` / `hasOwnProperty` at both levels | the extended unit test checks values at both levels, order `['__proto__','constructor','toString','hasOwnProperty']` last at the top, prototypes intact | matches; fails on base |
| I-3: R2P-01/02 → e2e with free ids | `integrity.e2e.ts` `[MONT-X13]` (hand edit kept), `[MONT-X14]` (hand delete stays deleted), same bodies as my probes | matches; both ok in my run |
| I-5: one-line warning | `model.ts:146-148` | matches |
| Placement sentence | `model.ts:141-143` | matches the after-r2 ruling |

New tests that fail on base: the integer-key unit test, the extended hostile-key unit test, X11 ×4 and X12 (6 of 6). MONT-X14 passes on base by design (r3 says so; a deleted key cannot come back when the base drops it anyway). It is a regression guard, which is fine. I did not run e2e on base. MONT-X13 must fail on base, because the base drops `table_notes` on any write.

## 3. Superproject (brief item 3)
- `git log --oneline origin/main..HEAD`: `d0ff29a4 chore: bump draw-steel-elements to 76520b1f (…)`, `ce606935 docs(changelog): …`. `git diff --name-only origin/main..HEAD` gives `CHANGELOG.md` and `draw-steel-elements`. `d0ff29a4 --stat` shows only `draw-steel-elements | 2 +-`. `ls-tree HEAD` gives `76520b1fd33d0501a819f084081fdf95a21b4573`.
- `origin/main` = `c3f9b129` ("docs: sc439 ledger Done entry; handoff SC-643 in flight"), whose parent is `8dd3c4a4`. `ls-tree` pins `draw-steel-elements` at `8a81c5a7` on both: the r3 claim is verified.
- Attribution grep (`co-authored|claude|generated|anthropic`) over the bodies of `8a81c5a7..HEAD` (dse) and `origin/main..HEAD` (superproject) finds nothing.
- Nothing pushed (the branch is ahead of `origin/main`, the worktree is clean).

## 4. Gates (brief item 4)
Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r4-rereview/`:
- `chain.rc` (head `76520b1f`, base-jest=1 as expected, tsc=0, lint=0, jest=0, e2e=0)
- `tsc.log`, `lint.log`
- `jest.log`: `Tests: 2 skipped, 12575 passed, 12577 total`, 0 "Exceeded timeout"
- `e2e.log`: `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`. The known bugs are SC-257, SC-355, SC-384, SC-627, SC-628 ×2, SC-629, SC-637 ×2, SC-638 ×2, SC-639 ×2, SC-640 ×2, SC-641 ×2, SC-642 ×2 and SC-648.
- `base-jest.log` (23 failed / 252 passed / 275), `base-status.txt`, `restored-status.txt` (empty)
- `styles-base.sha`, `styles-head.sha` (identical)
- `final-status.txt` (empty)

## 5. Skill proposal (brief item 5)
- §1 (line 31): both quoted substrings occur verbatim on line 31. The new figures `484/504 ok, 0 failed, 20 known-bug, 287/287` match my e2e run. The edited known-bug group (SC-625 removed, "SC-625 and SC-626 fixed") matches the run: no SC-625 known bug.
- §2 (line 202): the quoted text is verbatim. The new marker list (only SC-631 left) is correct. The added I-5 sentence matches `model.ts:146-148`.
- §3 (line 1526 CURRENT): jest fresh 12575 / 2 = 12551 + 24 is correct. 24 = r1's 18 + r3's 6 (integer unit test, X11 ×4, X12). 11 unit tests = r1's 10 + 1. The shots-cache figure 12576 / 1 is inferred by the line-29 rule, not measured; I did not measure it either, and the proposal says so.
- §4 (the `--only=` note beside line 201): correct. Every part of r3's and my r2 lifecycle logs echoes exactly its own ids.

## Findings

**L-1 (LOW): the CHANGELOG says a comment "is still rewritten"; it is removed.**
`CHANGELOG.md:13-15` (commit `ce606935`): "…and a comment or a flow list `[a, b]` is still rewritten". A YAML comment inside the block does not survive `parseYaml` → `stringifyYaml` at all. It is deleted (sc191 I-1, plugin-wide; SC-599). A flow list is rewritten as a block list. A user who reads "rewritten" will expect the comment to survive in some form.
Fix: "…and a comment in the block is still removed and a flow list `[a, b]` is rewritten as a list (SC-599)." Amend `ce606935` and re-create the bump on top. Or leave it, if the owner prefers to keep the SC-599 detail out of the bullet. It does not block the landing.

**I-1 (INFO): jsdom `[X11]`/`[X12]` and e2e `[MONT-X11]`/`[MONT-X12]` share numbers but are different scenarios** (jsdom X11 = Undo/edit/remove/back, e2e MONT-X11 = Add a hero). The jsdom ids are local to the file and the e2e runner never reads them, so nothing collides. It is only a reading hazard. No action needed.

**I-2 (INFO): MONT-X14 passes on base.** This is intended (a guard against a stale extra coming back) and r3 reports it. Nothing to fix.

Working tree: the dse worktree was clean before and after (`git status --porcelain` empty, HEAD `76520b1f`); `src/` was restored after the base check. The superproject worktree is clean. No probe file was written into either tree this round.
