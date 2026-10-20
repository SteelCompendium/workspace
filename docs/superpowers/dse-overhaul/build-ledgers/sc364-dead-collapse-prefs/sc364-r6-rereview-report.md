# SC-364 r6 — scoped re-review (7ff6068..188755b)

**Executive summary**
- Verdict: **LAND-READY.** Both r4 findings are resolved accurately, and the change introduces no new inaccuracy.
- Findings: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 0.
- The change is comment-only:
  - `main.js` sha256 is `42f1445cb45163749640192ef5edd3cad7d6cb8706ebf47fabeaf773955d13b0` for clean scratch builds of both 7ff6068 and 188755b, and for the worktree rebuild.
  - For all 3 touched files, the code printed by the TS parser with comments removed is identical between the two commits.
  - A negative control (one flipped operator in pipeline.ts) is detected.
- Gates at 188755b: tsc (incl. `-p e2e`) clean, RC 0. lint clean, RC 0. jest 5257 passed / 1 skipped, 229 of 230 suites, RC 0.
- Worktree `git status --porcelain` was empty before and after. HEAD is 188755b. I made no commits.

## R4-L1: resolved
The "(chrome-bearing since SC-255)" parenthetical is gone from `collapsedKey.ts:42-43`, `pipeline.ts:435-436` and `registry.ts:151`. The remaining claims are accurate:
- "Two definitions set it: `ds-stamina` and `ds-skills`": `git grep "collapseKeysOwnedByModel: true"` finds exactly `skills/definition.ts:46` and `stamina-bar/definition.ts:42`.
- "have the slot AND own them": both also declare `chrome` (`skills/definition.ts:36`, `stamina-bar/definition.ts:36`).

## R4-L2: resolved
`collapsedKey.ts:41` now reads "the elements that have not opted in, e.g. `ds-hr`". This is accurate: `horizontal-rule/definition.ts` has aliases `ds-hr`/`ds-horizontal-rule` and no `chrome` key.

## Sweep
`git grep` of `src test .repo-docs` at 188755b for `chrome-bearing since|~30 elements|resolveCollapsePrefs|declaredCollapsePrefs|ComponentWrapper.ts:<n>` returns 0 hits.

## Evidence (in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r6-rereview-k4p9/`)
- Gate logs:
  - `sc364-r6-tsc.log`, `sc364-r6-lint.log`, `sc364-r6-jest.log`.
  - `sc364-r6-build.log`: the worktree rebuild after jest's `rm -f main.js styles.css`.
  - Each log ends with the `RC=` line written by the wrapper `sc364-r6-gate.sh`.
- Builds per commit: `sc364-r6-build-a.log` (7ff6068) and `sc364-r6-build-b.log` (188755b).
- Code comparison: `sc364-r6-tokens.js`, `sc364-r6-tokcmp.sh`, `sc364-r6-tokcmp.log` (includes the negative control).
