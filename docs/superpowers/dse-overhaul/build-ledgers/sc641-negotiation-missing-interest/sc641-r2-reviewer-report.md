# SC-641 r2 reviewer report: dse `227dfc3d` on base `3b47e55b`

**Executive summary**
- VERDICT: **APPROVE_WITH_FIXES**. Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 5 INFO. All of them are docs or changelog wording, or behaviour that was already on base.
- The code change is correct. `default_interest` 0 -> 2 in `NegotiationData.ts:269` is the only change to behaviour. Every consumer reads the model: the card, the chrome summary, the sidebar, print and the form. None of them restates 0 (the form and `/ds` have no negotiation schema or default hints). Write integrity was checked byte by byte in jsdom (31-case probe, base vs head) and in real Obsidian (9-case probe spec). All of it holds.
- Gates I ran myself: tsc rc 0, lint rc 0, jest **13861 passed / 2 skipped / 0 failed** (= base 13855 + 6), e2e `--element=negotiation` **96/96 ok, 0 failed, 0 known-bug**. `styles.css` sha256 `18730938…f1f9` is identical for base and head (both built by me). No visual fixture leaves Interest out, so shots, freeze and parity carry.
- The markers are not vacuous: against BASE source, K08, K09, K09b, K09c, the resetData unit test, the 2 new serialize tests and the 2 changed pins all FAIL (9/78). The e2e NEGO-W06 and NEGO-W07 FAIL on base (`ended: "hostile"`, `interest: [0]`).
- LOW-1: `e2e/README.md:163` says minimal.md opens "live with chips and cards". It draws no chips, because it has no motivations or pitfalls.
- LOW-2: a negotiation that ended at Interest 0 in an earlier session, saved without an interest key, now reopens live at Interest 2. Base writes exactly that note (proven in real Obsidian). The CHANGELOG does not say so. This is the owner's call.

## Findings

### LOW-1: `e2e/README.md:163` claims chips the fixture cannot draw
The row now reads "`name:` only (opens at the defaults, Interest 2 / Patience 5, live with chips and cards; SC-641)". `minimal.md` has no `motivations` and no `pitfalls`. `ArgumentView.buildAppeals` returns early when both are empty (`src/drawSteelAdmonition/negotiation/ArgumentView.ts:132`), so the card draws 0 chips. The jsdom probe P01 on head shows `chips: 0`.
Failure scenario: a later e2e author trusts the row and writes a chip assertion against MINIMAL, and it can never pass.
Fix: "`name:` only (opens at the defaults, Interest 2 / Patience 5: live, not over; it has no motivations or pitfalls, so no chips; SC-641)".

### LOW-2: an old note that ended at Interest 0 reopens live, and the CHANGELOG is silent
On base, a name-only block that the user plays down to 0 in one session writes NO interest key. The key is omitted because it equals the old default 0. Real Obsidian, base `3b47e55b`, R2P-09: after Interest 1 the block is `name: A quick haggle\ncurrent_interest: 1`; after Interest 0 it is `name: A quick haggle`. On head, the same note reads Interest 2 and is live. The negotiation was over (hostile) and silently becomes active again. Head itself writes `current_interest: 0` here (R2P-09 head, R2P-02, jsdom P03 and P04c), so the problem exists only for notes saved before this change. Code cannot tell such a note from a block that never declared Interest, so this is a fact of the ruling ("Nothing new is written"), not a code defect.
Fix (owner's call): add one sentence to the workspace `CHANGELOG.md` bullet, for example: "A note saved before this update that leaves Interest out reads Interest 2 too, even one you had already played down to 0; set Interest back to 0 if that negotiation should stay over."

### INFO-1: wording in the workspace `CHANGELOG.md` bullet (lines 11-18)
- "A block with no `initial_interest` (for example just `name:`) used to start at Interest 0" is too broad. A block with `current_interest: 3` and no `initial_interest` never started at 0. Better: "A block that leaves Interest out (no `initial_interest` or `current_interest`, for example just `name:`)".
- "(SC-641)" appears twice, in the bold lead and again at the end. The neighbouring bullets carry it once. Drop the trailing one.

### INFO-2: stale header line in `test/dom/elements/negotiation-bugs.test.ts:2-3`
The header says "The real-Obsidian twins are the `knownBug` markers in e2e/specs/negotiation/ (integrity, focus, wrong-values)". `grep -rn knownBug e2e/specs/negotiation/` is now empty, and the import was dropped from wrong-values. Fix: "were the `knownBug` markers … (none is open now)". Cosmetic.

### INFO-3: Reset on the shipped `minimal.md` is not byte-identical in real Obsidian (already on base)
K09c and the implementer report say a name-only Reset leaves the note byte-identical. That holds only for the jsdom fixture, whose name is unquoted. In real Obsidian, Reset on `minimal.md` rewrites `name: "A quick haggle"` to `name: A quick haggle` (R2P-05). No key is added, so the ruling holds. The cause is the existing write path: `serialize` writes declared scalars through `stringifyYaml`, and Reset persists whenever the bytes differ. This diff leaves `serialize` unchanged. No fix needed for SC-641.

### INFO-4: `docs/negotiation-tracker.md:133-135`, "It also clears the 'negotiation over' banner"
The sentence was already there before this diff. With the owner ruling (an authored `initial_interest: 0` is honoured), Reset of such a block lands on a negotiation that is over again (jsdom P06h). The same is true for an authored `initial_interest: 5` or `initial_patience: 0`. Optional tweak: "…clears the banner, unless the block's own `initial_*` values start it over".

### INFO-5: write-path behaviour already on base, seen during probing (not SC-641)
- Any write, Reset included, drops YAML comments (`# my note`, `name: x # trailing`) and reorders known keys into class order. Unknown keys are kept after them (P06g). Base and head behave the same.
- `initial_interest:` (empty) is written back as `initial_interest: null` (P06i). Base and head behave the same.
- `current_interest: true` reads as Interest 1 (P07k). Base and head behave the same (SC-638 territory).

## Probe results (head unless noted; base differs only where stated)

All "after" bytes below are exact. Prose above and below the block survives in every case.

**jsdom probe** (31 cases; `r2-probe-head.json` / `r2-probe-base.json`):

| Case | Block | Action | Head result | Base result |
|---|---|---|---|---|
| P01 | name-only | spend Patience to 4 | opens I2/P5 live; writes `name: x\ncurrent_patience: 4` (no interest key); reopens I2/P4 | opened hostile |
| P02 | name-only + 1 motivation | toggle Spent | writes no interest key | same bytes |
| P03 | name-only | drive to 0 | writes `name: x\ncurrent_interest: 0`; reopens 0, hostile | wrote `name: x` |
| P04 | name-only | 2 -> 3 -> 2 (and coalesced) | `current_interest: 3`, then the key is gone again; reopens 2 | wrote `current_interest: 2` |
| P04b | name-only | 2 -> 0 -> 2 | `current_interest: 0`, then the key is gone; reopens 2 | — |
| P04c | name-only | 2 -> 1 -> 0 | `current_interest: 0`; reopens 0, hostile | dropped the key at 0 (see LOW-2) |
| P05 | old-default note `name: x\ncurrent_patience: 4` | open | I2/P4 live (FACT: base read 0, hostile) | 0, hostile |
| P06a | name-only | Reset | bytes identical | — |
| P06b | current-only | Reset | `current_patience: 5\ncurrent_interest: 2`, no `initial_*` | wrote `current_interest: 0`, hostile |
| P06c | `initial_interest` only | Reset | returns to 4 | same as base |
| P06d | `initial_patience` only | Reset | I2/P2 | I0, hostile |
| P06e | current + `initial_interest` | Reset | I3/P5 | same as base |
| P06f | current + `initial_patience` | Reset | I2/P3 | I0, hostile |
| P06h | authored `initial_interest: 0` | Reset | 0, hostile (owner ruling) | same as base |
| P06j | junk `initial_interest` | Reset | same as base | — |
| P06k | `_dse_anchor` | Reset | anchor kept | — |
| P07a-k | string / float / junk / negative / 7 / bool Interest | open | same as base | — |
| P07e | `current_interest:` (null) | open | 2 | hostile |
| P07i | `initial_patience`-only | open | 2 | hostile |
| P08 | two blocks | Reset the first | second byte-identical, no cross-talk | — |
| P09 | deleted and retyped name-only | open | I2/P5 | — |

**Real Obsidian probe** (`R2P-01..08`: 8/8 ok on head):

| Case | What it checks | Result |
|---|---|---|
| R2P-01 | name-only spend | `name: A quick haggle\ncurrent_patience: 4`, no interest key; reopens I2/P4 |
| R2P-02 | name-only drive to 0 | `current_interest: 0` written; reopens hostile |
| R2P-03 | name-only 2 -> 3 -> 2 | reopens 2 |
| R2P-04 | old-default note | reads I2/P4 |
| R2P-05 | name-only Reset | no key added (quote rewrite only, INFO-3) |
| R2P-06 | current-only Reset | exact bytes, no `initial_`, prose identical; reopens I2/P5 |
| R2P-07 | two current-only blocks | Reset of block 0 leaves block 1 byte-identical; then block 1 resets |
| R2P-08 | deleted and retyped block | renders I2/P5 |

R2P-09 is the record run used for LOW-2, on base and on head.

## Gates (re-measured)

All runs used devbox with a script file, and each exit code was captured inside the file.

| Gate | Where | Result |
|---|---|---|
| tsc | review tree | rc 0, no output |
| lint | review tree | rc 0 (only the .eslintignore warning) |
| jest | review tree | `Tests: 2 skipped, 13861 passed, 13863 total`; `Test Suites: 1 skipped, 300 passed`; rc 0 |
| e2e `--element=negotiation` | scratch worktree at 227dfc3d | `96/96 ok, 0 failed, 0 known-bug`; rc 0 |
| build | scratch worktrees at base and head | `styles.css` = `main.css` = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` for both |

For jest, `main.js` and `styles.css` were removed before and after the run.

Visual fixtures (my grep):
- `visual-harness/entry.ts:1052`: negotiation `default` = `example.yaml` (initial_interest 3), `checked` = `entry.ts:229` (3), `ended` = `fixture-ended.yaml` (3).
- `obsidian-camera.mjs`, `docs-manifest.mjs` and `notes-gen.mjs` use `example.yaml`.
- `obsidian-lifecycle.mjs` has no negotiation.
- In the e2e vault, only `minimal.md` and `wrong-block.md` leave Interest out.

Base-fail (head tests on BASE source, scratch worktree at `3b47e55b`): 9 failed / 69 passed / 78.
- Failed: K08, K09, K09b, K09c, `resetData: initial_* … otherwise Interest 2 / Patience 5`, the 2 new SC-641 serialize tests, `undeclared defaults are not written (pin: … interest=2 …)`, `defaults when fields are omitted: patience 5, interest 2`.
- `an authored Interest of 0 is honoured` passes on base, as expected for a pin of behaviour the change leaves alone.
- e2e: NEGO-W06 FAIL and NEGO-W07 FAIL on base: `0/2 ok, 2 failed`.

Drive-by fixes: none (nothing changed on the branch).

Follow-ups:
1. The write path drops YAML comments and reorders keys on any write (INFO-5), and `initial_interest:` becomes `null`. Already on base; file it if not already tracked.
2. LOW-2 needs owner wording if wanted.

## Tree state

- Plugin clone `git status --porcelain`: empty before and after. HEAD is `227dfc3d`. No `main.js` or `styles.css` is left in it.
- Superproject worktree: ` M draw-steel-elements` before and after (the implementer's unstaged pointer).
- The two scratch worktrees (`base-3b47e55b`, `head-227dfc3d`) were removed with `git worktree remove` and pruned. `git worktree list` shows only the review clone.

## Artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc641-r2-review/`)

- Probe specs: `sc641r2-probe.test.ts` (jsdom), `sc641r2-probe.e2e.ts` (real Obsidian).
- Scripts: `r2-gate-static.sh`, `r2-gate-jest.sh`, `r2-build-both.sh`, `r2-jest-basefail-and-probe.sh`, `r2-e2e.sh`, `r2-e2e-probe2.sh`, `r2-e2e-probe3.sh`, `r2-e2e-basefail.sh`, `r2-e2e-probe09.sh`.
- Logs: `r2-tsc.log`, `r2-lint.log`, `r2-jest-full.log`, `r2-build-base-3b47e55b.log`, `r2-build-head-227dfc3d.log`, `r2-styles-sha.txt.base-3b47e55b`, `r2-styles-sha.txt.head-227dfc3d`, `r2-basefail-jest.log`, `r2-probe-base.log`, `r2-probe-head.log`, `r2-probe-base.json`, `r2-probe-head.json`, `r2-e2e-gate.log`, `r2-e2e-probe.log` (run 1, broken harness), `r2-e2e-probe2.log` (run 2, harness), `r2-e2e-probe3.log` (8/8 ok), `r2-e2e-basefail.log`, `r2-e2e-probe09-base-3b47e55b.log`, `r2-e2e-probe09-head-227dfc3d.log`, and the `*-devbox.log` wrappers.
