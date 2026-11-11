# SC-566 r4 scoped re-review report

## r4

Summary
- Verdict: LAND-READY. Head dse `b4e7b4f4` (r1 rebased as `8ca64cb9`, on `origin/develop` `734d7745`, confirmed after `git fetch`).
- Findings: 0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW / 1 INFO (pre-existing, not from this change).
- Rebase: `range-diff a339e7b3..a918c78c 734d7745..8ca64cb9` → `1: a918c78c = 1: 8ca64cb9`. The +/- lines of the two diffs are identical.
- `b4e7b4f4`: the source change is exactly the prescribed `Math.max(raw, -Math.max(0, poolCurrentStamina))`. The docstring carries the ruled INFO-1 wording, and "the sign never flips" is now true: the damage branch returns ≤ 0 and the heal branch ≥ 0.
- Vacuity: with only that line reverted (scratch copy), exactly 1 test fails, the new -5 test ("Received: Deal 5 damage, kill 5 minion(s)"). The other 168 tests pass.
- Note bytes: 39 probe scenarios (r2's 37, plus pool -5 with 99 x 5 and pool -5 with stepper +). Saved note, persist calls and preview bar are identical for `734d7745` vs `b4e7b4f4`. Against r2's head, only the pool -5 labels changed: "Deal 5" → "Deal 0".
- Mine: tsc (incl. `-p e2e`) clean. Pool modal suites (matrix + modal) in the worktree: 169/169.
- Implementer logs spot-checked, matching the r3 report: jest `1 failed, 1 skipped, 7087 passed` (the failure is the SC-568 `twin-reuse` SC-547 timeout; rerun 53/53, so 7088/1). Lifecycle 21 + 16 + 9 + 4 + 3 = 53/53. e2e run 3 `255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` rc 0. Runs 1 and 2 each failed only RECOV-R07 (`Expected: 1 | Received: 2`, the documented load flake); alone 1/1. Shots rc 0, host-leak 163/978, modal 39/234, clip 147. Freeze 280/280. Parity 0/0/24.

## Findings

### INFO-1 (pre-existing, out of scope): a hand-edited negative pool's refused heal names a negative ceiling

Pool -5 (hand edit only; no write path produces it), stepper + → "Heal 6 stamina", disabled. The info line reads "A heal can't raise the pool above the living minions' share (-4 stamina)." and the title reads "(at most -4)". `734d7745` reads exactly the same (`healCeiling` = 20 − floor(25/4)·4). It is in the same unreachable class as the 25/20 case, so no action is needed.

## Artifacts

All evidence is in `S = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc566-r4-rev-r2a/`:

- `S/base` = `git archive 734d7745`; `S/head` = `git archive b4e7b4f4`; `S/revert` = head with the one line reverted.
- `S/sc566-probe.test.ts`, `S/probe-base.json`, `S/probe-head.json`
- `S/matrix-revert-vac.log`
- `S/tsc.log`, `S/matrix-worktree.log`

Worktree after review: dse `status --porcelain` is empty and HEAD is still `b4e7b4f4`. The superproject shows only the ` M draw-steel-elements` pointer, as before.
