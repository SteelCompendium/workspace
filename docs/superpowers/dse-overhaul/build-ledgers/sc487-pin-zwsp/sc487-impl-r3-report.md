# SC-487 implementer report, round 3

**Executive summary**
- **Verdict: DONE (with one flagged existing-test change, below).** LOW-R2 folded; dse rebased onto `origin/develop` `9f08f06` (SC-492; it moved past `53e1e48` twice during the round, so I rebased twice and ran the battery once), superproject onto `origin/main` `6a176e6`.
- **Heads:** dse `4ec83ea` (5 commits on `9f08f06`: `bd66aa4` guard, `dae541f` ZW parse, `a247c94` G-S33, `8b8e55c` r2 fix, `4ec83ea` r3 fix); superproject `101bfdd` (3 commits on `6a176e6`). Not pushed; pointer not bumped.
- **Gates at `4ec83ea`:** tsc + lint rc 0 · jest **5901 passed / 1 skipped / 241 of 242** (5847 base + 49 r1/r2 + 5 r3) · lifecycle **35/35 ok, 0 failed** (1.15.0) · e2e **108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs** · shots **rc 0, 592, 0 FAIL, ran to the end** · freeze **280/280** · parity **0 gap(s), 0 undeclared, 24 declared** (last).
- **FLAG for the owner:** the rule as ruled (any backtick in the info string, both fence kinds) changes one EXISTING test, `test/dom/authoring/schemaSuggest.test.ts` (SC-476): `~~~ds-counter \`x\`` was expected to give type `ds-counter` (CommonMark allows a backtick in a tilde fence); it now gives `ds-counter \`x\`` (Obsidian renders it in neither mode). I updated that one expectation and its title. Effect: authoring key completion is no longer offered inside such a tilde fence. Revert that test and branch on the fence character in `fenceScan.ts` if you prefer to keep SC-476 as it was.

## LOW-R2 (ruled verbatim)
- `fenceLanguage` starts with `if (info.includes('`')) return info.replace(/^[ \t]+/, '').replace(/\s+$/, '');` and the doc comment says why (Obsidian's `[^\n`]*$`). Everything else is unchanged; all earlier rows keep their values.
- Rows/tests (+5): e2eIntegrity table: `` ```ds-x`x ``, `` ~~~ds-x`x ``, `` ```ds-x `x ``, `` ``` ds-x` ``, `` > ```ds-x`x `` -> the trimmed info string (never `ds-x`). `blockPrefix.test.ts` +4 (host parse, anchor alias, `~~~`, zero-width mix). `registration.test.ts` +1: the host reports `ds-counter`x` for a `` ```ds-counter`x `` block and `requestPinToSidebar` refuses it: note byte-identical, one Notice, no sidebar leaf. Reverting only `src` fails 6 of the new assertions.
- CHANGELOG: one clause added ("A fence with a backtick on its opening line is not a block in either view and is now left alone too.").

## Rebase / range-diff
- dse `2c61511..97a8bfe` vs `9f08f06..4ec83ea`: commits 1, 2, 4 `=`; commit 3 (G-S33) `!` by context only: one conflict in `obsidian-lifecycle.mjs` next to SC-492's G-S32 (kept both: G-S32 then G-S33 appended; header sentence "34 scenarios in all" now reads 35 with G-S33); commit 5 new. `package.json` unchanged, no `npm ci` needed.
- superproject: conflicts in `CHANGELOG.md` (kept SC-492's bullet, then SC-485 and mine) and the dse-verify lifecycle row (kept SC-492's G-S32 text, added G-S33, count 35/35).

## Shots lines (own log, rc 0)
`OBSIDIAN APP.CSS PIN DRIFT` warning (expected) · `host-copy pin OK (… 1.15.0 …)` · `button host-leak OK (113 … 678 …)` · `modal button host-leak OK (10 … 228 …)` · `text scale OK (1626 …)` · `text scale once OK (107256 comparisons over 214 loads …)` · no ALLOWLISTED · FAIL count 0 · 592 PNGs. Run detached with a foreground PID wait (documented in dse-verify).

## Drive-by fixes:
none.

## Follow-ups:
1. The SC-476 expectation change above is a behaviour change in authoring completion; owner to confirm.
2. (carried) SC-471's second lander maps `'unregistered'` in `sendFromCommand` and updates the ```` ```js ```` command test.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r3/`)
`gate-tsc.log`, `gate-lint.log`, `jest-full.log`, `gate-lifecycle.log`, `gate-e2e.log`, `gate-shots.log`, `gate-freeze.log`, `gate-parity.log`; `jest-base.log` (new tests vs old src), `jest-p3.log`.
