# SC-578 r4 scoped re-review — r3 fix delta (LOW-1, LOW-2, INFO-2)

**Executive summary**
- Verdict: **APPROVE**. Reviewed dse `c3fd8323` (r3 commits `c1e07053` fix, `1c9030eb` test, `c3fd8323` docs on `6c7216e8`) + worktree superproject `98e7cd14`.
- LOW-1 fixed as prescribed: `model.ts:523` stores `requested` only when `before + requested < 0`; `view.ts:601` renders the suffix only when `requested < amount`.
- LOW-2 fixed in both CHANGELOGs ("see the SC-578 entry above"); INFO-2 fixed (stepper wording in `EncounterData.ts:529-530`, `model.ts:507`, `docs/initiative-tracker.md:255-256`).
- Re-ran the r2 probes: `{amount:1, requested:1}` now reads `R1: +1 — Same`; 0.2 + 0.1 writes no `requested`. P1 mixed sequence and the P2 round-trip are unchanged.
- The two new jsdom rows fail with `model.ts`/`view.ts` reverted to `1b477249` (2 failed / 153 passed); restored, they pass.
- Findings: 0 HIGH · 0 MEDIUM · 0 LOW · 2 INFO.
- Gates (measured): tsc clean · lint clean · jest `Tests: 1 skipped, 7200 passed, 7201 total`, 260 of 261 suites. I did not re-run e2e, lifecycle, shots, freeze or parity (optional per brief).
- The r1/r2 commits rebased onto `6c7216e8` unchanged: `git range-diff` shows all four as `=`. The tree was clean before and after.

## Checks

| Item | Result | Evidence |
|---|---|---|
| `requested` stored only when `before + requested < 0` | OK | `model.ts:522-523`. Probe P4: `0.2+0.1` → no key; `2 + -2` → `amount -2`, no key (exact floor, not capped); `2 + -3` → `requested -3`; stored `-2` + `-1` → `amount 0, requested -1`; `0.1 + -0.3` → `amount -0.1, requested -0.3` |
| suffix only when `requested < amount` | OK | `view.ts:601`; P2: `R1: +1 — Same` (no suffix), `R1: -2 — Capped (-5, capped at 0)` |
| model and view agree | OK | When capped, `amount = -before`, so `requested < amount` ⇔ `before + requested < 0`. A float sum's sign is exact, so the two tests cannot disagree on an entry the model writes |
| new jsdom rows non-vacuous | OK | `revert-jest.log`: both new `[M09]` rows fail with the r3 fix reverted (`initiative-matrix.test.ts:503`, `:508`) |
| CHANGELOG cross-reference | OK | plugin `CHANGELOG.md:34`, worktree `CHANGELOG.md:23`: SC-578 sits above SC-577 in both |
| stepper wording | OK | "each entry records what the pool really did (the −/+ stepper changes Malice without a log entry, so the log is not a running total)" |

## Findings

### INFO-1 (carried from r2) — workspace CHANGELOG still conflicts with `main`
`git merge-tree 3f91de37 main(357106d6) 98e7cd14` shows 1 conflict hunk in `CHANGELOG.md`. Main has added bullets at
the top of `## Unreleased` (SC-584, SC-573). It is trivial to resolve at land: keep all bullets, with SC-578 above SC-577
so "see the SC-578 entry above" stays true.

### INFO-2 — the view suffix still trusts a hand-edited positive pair
A hand-edited `{amount: 3, requested: 1}` would render `(1, capped at 0)` because `1 < 3`. The model never writes such
an entry, and a check that the entry really was capped (`amount <= 0`) would close this. It is not worth a change.
Noted only for completeness.

The dse-verify skill CURRENT update (r2 INFO-3) is still the owner's land step.

## Gates (dse @ `c3fd8323`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, rc 0 | `tsc.log` |
| lint | clean, rc 0 | `lint.log` |
| jest | `Tests: 1 skipped, 7200 passed, 7201 total`; `Test Suites: 1 skipped, 260 passed, 260 of 261 total`, rc 0 | `jest.log` |

Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-rev-r4-rv4/`
(`tsc.log`, `lint.log`, `jest.log`, `probe-a.log` (P1, P2, P3), `probe-b.log` (P4), `revert-jest.log`).
