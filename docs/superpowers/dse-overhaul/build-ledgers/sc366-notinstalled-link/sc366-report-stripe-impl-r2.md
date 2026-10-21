# SC-366 stripe removal, implementer r2 report

## Executive summary
- Verdict: DONE. LOW-1 and INFO-2 folded; rebased onto the LATEST targets (dse develop 95981f1, superproject origin/main 383ec3f). Nothing pushed.
- dse HEAD `8d890f9` (2 commits on 95981f1): `89087cf` the stripe removal (r1, rebased), `8d890f9` the new test checks.
- Superproject HEAD `76c24a2` (2 CHANGELOG commits on 383ec3f): `284e5e4` (stripe sentence, rebased), `76c24a2` (reword per INFO-2). `draw-steel-elements` pointer left unstaged (` M draw-steel-elements`). CHANGELOG rebase was clean; SC-366 bullet appears exactly once.
- Gates at dse 8d890f9 (all measured after the final rebase): tsc + lint clean; jest 5585 passed / 1 skipped / 234 of 235 suites (develop 95981f1 = 5582, +3 mine); lifecycle 31/31 ok 0 failed; e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 pairs; shots 580, 0 FAIL; freeze 280/280 (0 moved); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Both new checks bite-proven with Edit (inset box-shadow; `::before` rule), CSS restored byte-clean (`git status --porcelain` showed only the test file).

## Changes in r2
- `test/dom/theme/notInstalledLinkColour.test.ts`: third test in the SC-366 stripe describe: for every rule on the card roots (`.dse-ref-notice` / `.dse-ref-web-card`, innermost rules), the body must not match `box-shadow:[^;]*\binset\b` and the selector must not match `::?(before|after)\b`. 4-value border-width and gradients skipped, as ruled.
- CHANGELOG continuation lines replaced with the exact owner text (print keeps its link colour; stripe sentence wrapped), commit `docs(changelog): SC-366 reword stripe sentence`.

## Bite-proof (ran on the 8d075db rebase; the test and the CSS rule are unchanged by the later rebase)
- `box-shadow: inset 3px 0 0 var(--color-blue);` added to `.dse-ref-notice` -> `Expected pattern: not /box-shadow:[^;]*\binset\b/`, 1 failed / 5 passed. Log `sc366-stripe-gate-r2-bite-inset.log`.
- `.dse-ref-notice::before { content: ''; }` added -> `Expected pattern: not /::?(before|after)\b/`, 1 failed / 5 passed. Log `sc366-stripe-gate-r2-bite-pseudo.log`.
- Both reverted with Edit.

## State check at start
Status clean, HEAD `e025dd2`, no stray processes of mine. The first r2 battery (on 8d075db) was discarded when the target moved to 95981f1; all numbers above are from the final tree.

## Notes
- Shots again exceeded 600 s on the loaded host; the harness backgrounded it, I waited on its PID, log ends `GATE-RC=0`.
- CHANGELOG/superproject rebase used `--autostash`; no stash left behind.
- Evidence crops from r1 are unchanged (`.dse-ref-notice` rule identical across all rebases): `sc366-stripe-{before,after}-{notinstalled,notice}-{dark,light}.png` and `-computed.json` in the ledger dir.

Gate logs (ledger dir): `sc366-stripe-gate-r2-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`, plus the two bite logs above.

Drive-by fixes: none. Follow-ups: none new.
