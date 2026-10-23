# SC-487 implementer report, round 2

**Executive summary**
- **Verdict: DONE.** Review r1 MEDIUM-1 and LOW-1 folded; dse rebased onto `origin/develop` `2c61511` (SC-478; moved past `907f55c` during the round), superproject onto `origin/main` `2ba04a6`.
- **Heads:** dse `97a8bfe` (4 commits on `2c61511`: `3469fed` guard, `b559be9` ZW parse, `57efd05` G-S33, `97a8bfe` r2 fix); superproject `4b91ced` (2 commits on `2ba04a6`: `3fd55e9` CHANGELOG + skill row, `4b91ced` bullet reworded). Pointer not bumped, nothing pushed.
- **Gates at the new head:** tsc + lint rc 0 · jest **5846 passed / 1 skipped / 239 of 240** (5797 + 19 r1 + 30 r2) · lifecycle **34/34 ok, 0 failed** (1.15.0) · e2e **104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs** · shots **592, 0 FAIL, rc 0, ran to the end** · freeze **280/280** · parity **0 gap(s), 0 undeclared, 24 declared** (last).
- **Rule now:** the name is Live Preview's own `[\w/+#-]*` (ASCII `\w`, no `u` flag) run after the `[ \t]` skip; a token that does not start with such a character keeps its whole text; whitespace- or zero-width-only tokens are `''`. All SC-457 rows and all r1 rows keep their values.
- **Not re-measured in Obsidian this round:** the 17 openers + 5 controls come from the reviewer's JSONs (1.14.4); G-S33 (trailing U+200B) passes in the 34/34 run on 1.15.0.
- **Shots was run detached** (setsid, foreground wait on its PID) because it exceeds the 10-minute foreground limit, as the dse-verify skill now documents; its own log and rc were read.

## Fixes
- **MEDIUM-1** (`src/framework/host/blockPrefix.ts`): `fenceLanguage` = `/^[\w/+#-]+/` on the first token; else the old whole-token fallback (`/^\s*\S*/`); `''` if that is only whitespace / U+200B-D / U+2060. (An unneeded `\/` escape tripped `no-useless-escape` once; fixed before the commit.) Doc comment cites Obsidian's fence regex and says the set is mirrored, not a list to extend. e2e `typeOf` already calls `fenceLanguage`.
- **LOW-1** (`registration.ts`): `visibleAlias` prints every char outside `\x21-\x7e` as `<U+XXXX>` (so `ds-counter<U+200B>`, a space is `<U+0020>`).
- **Tests (+30):** `e2eIntegrity.test.ts` table: 17 openers x 4 forms (backtick, space, `~~~`, quoted) -> `ds-x`; 6 leading-char rows kept whole; 11 control/name-char rows (`ds-xx`, `ds-x_x`, `ds-x/x`, `ds-x#`, `ds-x+`, `ds-x-`, `ds-x1`, `ds-x_`, `ds-x/y`, `c++`, `c#`). `blockPrefix.test.ts` +25 (17 openers host + anchor parse, 7 name-char controls, the fallback/empty test). `registration.test.ts` +5 (4 pin-path rows: `:`, `.x`, U+00AD, U+200E; the Notice-wording test for ZWSP and `é`/space). Reverting only `src` to r1 fails 23 of them.
- **CHANGELOG** bullet reworded (type ends at the first character other than A-Z letter, digit, `-_/+#`, as Live Preview reads it; notice spells out invisibles). Not changed: G-S33 (stays the trailing-U+200B pin); dse-verify skill row now reads `34/34` with G-S33 added to the existing SC-478 text.

## Rebase / range-diff
- dse `d152ea4..2bf8541` vs `2c61511..HEAD`: commits 1-2 `=`; commit 3 (G-S33) `!` only by context: one conflict in `obsidian-lifecycle.mjs` (header comment and the SCENARIOS tail next to SC-478's G-S18), resolved by keeping both (G-S18 then G-S33 appended; `node --check` ok); `97a8bfe` is new.
- dse `907f55c..aa334cb` (my intermediate rebase) vs `2c61511..HEAD`: same picture.
- superproject `cc5fcd8..382f595` vs `2ba04a6..HEAD`: commit 1 `!` (the dse-verify lifecycle row conflicted with SC-478's text: kept both, 33/33 -> 34/34); the r2 CHANGELOG commit is new.

## Shots lines (own log, rc 0)
- `OBSIDIAN APP.CSS PIN DRIFT` warning present (installed 1.15.0 vs pinned 1.13.7), as expected.
- `host-copy pin OK (6 button-reaching rules + 14 tokens x dark/light + ... verbatim Obsidian 1.15.0; 18 further rules ...)`
- `button host-leak OK (113 button kinds x 3 states x dark/light = 678 comparisons ...)`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds ... = 228 comparisons ...)`
- `text scale OK (1626 comparisons ...)`; `text scale once OK (107256 comparisons over 214 loads ... 99s)`; no `ALLOWLISTED` line; `grep -c FAIL` = 0; 592 PNGs.

## Drive-by fixes:
none.

## Follow-ups:
1. (carried) SC-471 second lander maps `'unregistered'` in `sendFromCommand` and updates the ```` ```js ```` command test.
2. Optional: a real-Obsidian lifecycle case for a non-zero-width terminator (e.g. ```` ```ds-counter: ````); the jest tables carry it today and the reviewer's JSON measured it.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r2/`)
`gate-tsc.log`, `gate-lint.log`, `jest-full.log`, `gate-lifecycle.log`, `gate-e2e.log`, `gate-shots.log` (+ `shots-devbox.log`, `shots.pid`), `gate-freeze.log`, `gate-parity.log`; fix-detects-old-code check `jest-base.log`; targeted run `jest-p2.log`.
