# SC-487 implementer brief — round 2 (fix findings + rebase onto 907f55c)

Same rules as `sc487-brief-impl-r1.md` (read it again: context, command rules, report shape, return contract). Read the ledger `decisions.md` — the review r1 rulings and the SC-497 dispatcher note are there. Workers never call Linear.

## Task

1. Fix the review r1 findings the ledger rules FOLD (quoted there, with the reviewer's prescribed fixes in `sc487-review-r1-report.md`). Anything ruled FILED or DROP is out of scope.
2. Rebase dse branch `sc487-pin-zwsp` onto `origin/develop` = **`2c61511`** (was 907f55c; SC-478 landed after) (SC-497: shots host-copy pin and `obsidian-host-pin.mjs` PINNED_OBSIDIAN at 1.15.0). `git -C <dse path> fetch origin` first; if develop moved past `907f55c`, rebase onto the new tip and say so. Rebase the worktree superproject branch onto `origin/main` too (`git -C /home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp fetch origin`), resolving any CHANGELOG / dse-verify-skill conflict by keeping both sides. `npm ci` if `package.json` changed.
3. Report a `git range-diff` of the old and new ranges.
4. Full battery at the new head, one blocking foreground call per gate, in the dse-verify order.

## Expected numbers at the new head

tsc + lint clean · jest **5816 passed (5797 + 19) / 1 skipped / 239 of 240** (+ any tests the fix adds) · lifecycle **34/34 ok, 0 failed** · e2e **104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs** · shots **592, 0 FAIL, runs to the end** with `host-copy pin OK (… 1.15.0; 18 further rules …)`, `button host-leak OK (113 … 678 …)` with a 20-record boundary, `modal button host-leak OK (10 … 228 …)`, both text-scale lines, and an expected `OBSIDIAN APP.CSS PIN DRIFT` warning with rc 0 · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last).

Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-impl-r2/`. Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-impl-r2-report.md` (≤10-line executive summary first). No push; do not bump the superproject's submodule pointer.
