# SC-411 round 7 report: rebase onto develop + re-gate

Executive summary
- Verdict: DONE. Clean rebase, 0 conflicts, all gates green, all 7 GIFs stable and identical.
- Branch sc411-docs-gifs: new tip 566888a669b483cb4cde40097a8f523b23fa3f58 (was b3be096), base origin/develop 135716d240b428bf2de3021bc1743fdd3d9576aa (unmoved after fetch), 15 commits ahead. Not pushed, not tagged, nothing committed beyond the rebase.
- Gates: tsc clean; lint clean; jest 222 suites pass + 1 skipped, 4502 tests = 4501 pass / 1 skipped / 0 fail (was 4493; +9 = SC-390's tests); shots 572 PNGs (was 568; +4 = SC-390 companion-corpus fixture), 0 FAIL; freeze 276/276 (was 274; +2 pairs = SC-390 sanctioned delta), 0 mismatches; parity 0 GAPs / 0 undeclared / 24 DECLARED. Lifecycle skipped: diff vs develop touches no src/ or main.ts.
- 7 GIFs: all --check-stable stable; full npm run docs-shots then `git status --porcelain` fully empty (all 7 GIFs and every PNG byte-identical), shots dir file list unchanged (572, same listing hash).
- Merged files read sanely: CHANGELOG 7.0.0 holds SC-390 bullets (companions via ds-scc, empty-EV) and SC-411 bullets (docs-shots / GIFs); README GIF passages intact; entry.ts has SC-411 `experimental` param, `__dseHarnessWrites` counter and SC-390 companion-corpus fixture side by side.
- Obsidian asar: 1.14.4 (no drift seen). Follow-ups: none.

Evidence: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/r7-evidence/
(tsc.log lint.log jest.log shots.log freeze.log parity.log stable-<gif>.log x7 docs-shots-full.log run-stable.sh)

7-GIF table (stable / identical to committed)
| gif | stable | sha256 prefix | bytes |
|---|---|---|---|
| counter | yes | 0f979d6fecc5 | 40434 |
| feature-roll | yes | a8fec1be4dc0 | 383635 |
| initiative-tracker | yes | 8af895dff992 | 570381 |
| initiative-tracker-conditions | yes | 7388e6e0806b | 717396 |
| montage | yes | 89d5ddf08162 | 640721 |
| negotiation | yes | 3e915f7d5ef9 | 883710 |
| stamina-bar | yes | 72fec47d8b61 | 119745 |

Notes
- Rebase: `git rebase origin/develop`, 15/15 commits applied, no conflict markers in CHANGELOG/README/entry.ts.
- A first attempt at the stable loop lost its variables to devbox's double-quote expansion (ran `--only=.gif`, refused: "needs a gif entry"); that log was deleted and the loop re-run via run-stable.sh. All 7 results above are from the re-run.
- Full docs-shots: 37 images written to docs/Media; favicon.ico reported as non-regenerable brand asset (expected).
