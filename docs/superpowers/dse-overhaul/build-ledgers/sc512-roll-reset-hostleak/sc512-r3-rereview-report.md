# SC-512 r3 scoped re-review

## Executive summary
- **Verdict: LAND-READY.** I reviewed dse `a706ff7..f89f69f` on base `253aa5f`, which is still `origin/develop`. No new findings at LOW or above; 2 INFO.
- **Rebase:** `git range-diff c2758a2..635b6df 253aa5f..a706ff7` reads `1: 635b6df = 1: a706ff7`, so the rebase did not change r1.
- **Scope:** the delta is LOW-1 + INFO-1 only (2 files, +11/−5). Nothing from LOW-2 / SC-513 is in it.
- **Shots on f89f69f:** rc 0, 592 PNGs, `button host-leak OK (114 … 684 …)`, the same 12-record boundary (disabled roll Reset ×2 still listed), modal 228, input 164, checkbox 60. All 592 sha256 match base c2758a2 (from r2).
- **Freeze:** `280/280`, rc 0. **Parity (run last):** `0 gap(s), 0 undeclared, 24 declared`, rc 0.
- **Jest:** `test/dom/visual-harness/fixtures.test.ts` 114/114 passed, rc 0, run in a clean scratch copy with no `main.js`.
- **LOW-1 anti-vacuity:** my own run, with the stepper's control id renamed in a scratch copy, gives rc 1 with `expected exactly one Edges "+" … found 0` per scheme. The implementer's log shows the same lines.
- **Superproject:** `merge-base --is-ancestor origin/main HEAD` returns 0. HEAD = origin/main = `104dd85`, and the status is only ` M draw-steel-elements`.

## Delta review
- **`visual-harness/shoot.mjs:2690-2714`** — `incCount` is read once. The click still happens only when the count is exactly 1. The new problem is pushed when the count is not 1. The Reset checks still run after it, so the sweep FAILS whatever the count. The new line comes first in the output, so the reader sees the cause before what follows from it. The comment is accurate.
- **`test/dom/visual-harness/fixtures.test.ts:492, 514, 521, 532`** — the three redundant `galleryIds: ['roll']` spreads are gone. `as const` became `Parameters<typeof mountFromParams>[1]`. That is needed, because a readonly tuple would not be assignable to the mutable `galleryIds`, and it is type-safe. tsc covers `**/*.ts`, and the implementer reports tsc clean.

## INFO
- **INFO-1:** the new message hard-codes `roll.edges.inc` instead of building it from the selector at `:2690`. If someone renames the selector and forgets the message, the message names the old id. Optional: hoist the selector into a const and interpolate it.
- **INFO-2:** when the count is not 1, the run prints the new line plus the two follow-on lines ("did not leave an enabled Reset", "tagged no … reset"). That matches the brief ("the Reset checks still run either way"), so no change is needed.

## Probes and evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r3-rereview/`)

| Probe | Result | Log |
|---|---|---|
| shots, reviewed worktree at f89f69f | rc 0, 592, 114/684, 12-record boundary, 0 FAIL; sha256 list identical to r2's base list | r3-shots-branch.log / .rc, r3-shots-branch.sha256 |
| freeze | 280/280, rc 0 | r3-freeze-branch.log / .rc |
| fixtures jest (scratch at f89f69f, no main.js) | 114 passed, rc 0 | r3-jest-fixtures-scratch.log / .rc / .tree |
| LOW-1 anti-vacuity: scratch copy, `roll.edges.inc` → `roll.edges.RENAMED` in the locator | rc 1, 6 problem lines, the first per scheme being `expected exactly one Edges "+" ([data-dse-control="roll.edges.inc"]) on the extra roll strip, found 0 — the click that enables its Reset could not be made` | r3-scratch-renamedStepper.log / .rc / .tree |
| Implementer's anti-vacuity log | same 6 lines, rc 1 | `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r1-impl/shots-r3-antivacuity.log` |
| parity (last) | 0/0/24, rc 0 | r3-parity-branch.log / .rc |
| worktree state | `status-before.txt` = `status-after.txt` | |

- **Scratch copy:** the scratch worktree was reverted and removed (`git worktree remove`), with the node_modules symlink unlinked first and its target left intact.
- **Reviewed worktree:** nothing tracked changed there. My shots and parity runs only regenerated its gitignored outputs.
- **Not re-run, with reasons:**
  - Lifecycle and e2e: the r3 delta touches only shoot.mjs and a jest test.
  - Full jest: the brief asked only for the fixtures suite. The implementer reports 6078/1/245 of 246.
