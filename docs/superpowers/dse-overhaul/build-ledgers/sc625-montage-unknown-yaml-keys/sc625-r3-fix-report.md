# SC-625 r3 fix report

**Executive summary**
- Verdict: DONE. Rebased onto dse `8a81c5a7` (no conflicts), folded L-1, L-2, L-3, I-3, I-5, wrote the SKILL proposal, rebased the superproject, ONE pointer bump. Nothing pushed.
- Final dse head `76520b1f` (branch `sc625-montage-unknown-yaml-keys`, 5 commits on `8a81c5a7`).
- Superproject: CHANGELOG commit `ce606935`, pointer bump `d0ff29a4` (gitlink `76520b1fd33d0501a819f084081fdf95a21b4573`); `origin/main..HEAD` is exactly those two commits. Note `origin/main` is `c3f9b129` now, not `8dd3c4a4` (one docs commit later; pointer there is still `8a81c5a7`), so I rebased onto `c3f9b129`.
- tsc and lint clean. jest fresh worktree 12575 passed / 2 skipped (12551 + 24). Lifecycle 64/64 as seven `--only=` parts (21+16+9+4+7+4+3, 0 failed, no re-runs). e2e `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`.
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` on a clean `8a81c5a7` build and on the branch build: identical, so shots, freeze, parity carry (not re-run).
- No `Co-Authored-By` or AI attribution in any commit on either branch (checked both).

## Rebase
- dse: `git rebase origin/develop` onto `8a81c5a7`: no conflicts (no shared e2e manifest rows touched). `package.json` / lock unchanged by SC-439, no `npm ci` needed. Scenario ids: no duplicates among `[X-Y##]` ids in `e2e/specs`; `MONT-X09..X14` each appear once. The only bracketed ticket ids in titles in the tree are SC-439's own `test.failing` markers in `negotiation-bugs.test.ts` (jsdom, not mine, not read by the e2e runner); none of mine.
- Superproject: amended the CHANGELOG commit (one CHANGELOG commit on the branch), rebased onto `origin/main` `c3f9b129`: no conflict.

## Folds (dse commit)
- L-1 (doc comment + pin): `52889820`. The `model.ts` comment now says actions follow the top-level rule and `participants:` keep SC-610's as-typed contract (deliberate), and that an integer-looking key is written first, quoted (JS key order). New unit test pins it.
- I-5 (warning): same commit, same comment: never put a non-schema own property on the model or an entry, `serialize` writes it.
- L-3 hostile keys: same commit. The `__proto__` unit test now also carries `constructor`, `toString`, `hasOwnProperty` at both levels, asserts they come back as own plain keys in order and that nothing is polluted.
- L-3 write paths: `020d92b4`. New jsdom X11 (`test.each`: Undo, sheet edit, sheet Remove, Back to round) on a two-action fixture (each action with extras), and X12 (Clear all on a finished montage; Reopen on one out of rounds).
- I-3: `76520b1f`. R2P-01 / R2P-02 promoted to `MONT-X13` (a hand edit of an unknown key, top level and in an entry, while drawn, is kept) and `MONT-X14` (a hand delete does not come back), in `e2e/specs/montage/integrity.e2e.ts`.
- L-2: superproject `ce606935`. The bullet now says the keys are "kept, with the same values", that the block's layout may still change on a write, and that a comment or flow list is still rewritten. It no longer says "as you typed them".

## New tests this round (fail-on-base = at `8a81c5a7` with `model.ts` unfixed)
- unit, `test/unit/model/montage-serialize.test.ts`: integer-key order pin. Base: fails (the integer key and the `7` on the entry are dropped, so the first line differs). The hostile-key test is the extended r1 test (no new id); fails on base.
- jsdom, `montage-matrix.test.ts`: X11 x4 rows (fail on base: yes, all four lose the extras), X12 (fails on base: yes, `table_notes` is lost).
- e2e: MONT-X13 (base: the edit is lost, fails), MONT-X14 (base: passes, a deleted key stays deleted; it is a regression guard, matching r2's R2P-02 which passed at head).
Measured: with `model.ts` reverted to `8a81c5a7` (tests at head), 23 of 275 tests in `montage-matrix` + `montage-serialize` fail: the 17 from r1 plus the integer-key test, the extended hostile-key test (that one is r1's test, now stronger), X11 x4 and X12 (so 6 of this round's 7 jsdom additions/extensions fail on base; no unit or jsdom test added this round passes on base). Log: `base-fail.log` in the scratch dir above. The dse worktree is clean after the check.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc625-r3-fix/`)
- `tsc.log`, `lint.log` (GATE-EXIT 0 each).
- `jest-full.log`: `Test Suites: 1 skipped, 282 passed`; `Tests: 2 skipped, 12575 passed, 12577 total`.
- `life-p1.log` .. `life-p7.log`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 ok, 0 failed (union 64/64; chain script `life-chain.sh`, one `--only=` part per log, G-S56 last in part 4).
- `e2e.log`: `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` (478 + 2 flipped + 4 new MONT-X11..X14; 500 + 4; 22 - 2).
- styles: `styles-fix.sha`, `styles-base.sha` (identical, hash above); `build-fix.log`, `build-base.log`.
- Skill proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/sc625-skill-proposal.md`.

## Drive-by fixes:
None.

## Follow-ups:
- r1's stray `/tmp/claude-1000/-home-scott/code-placeholder` is still there (ledger says leave it).
- Jest "with the shots cache" figure in the skill proposal (12576 / 1) is the fresh figure plus one by the SKILL's own rule; I measured only the fresh worktree.
