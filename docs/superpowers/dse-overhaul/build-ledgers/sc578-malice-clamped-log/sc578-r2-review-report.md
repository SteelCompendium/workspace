# SC-578 r2 review report — independent adversarial review of the r1 fix

**Executive summary**
- Verdict: **APPROVE** (no HIGH, no MEDIUM). Reviewed dse `sc578-malice-clamped-log` @ `2747307f` (base `eaa8742a`, 4 commits) + worktree superproject `f0fd9a65` (CHANGELOG only).
- Findings: 0 HIGH · 0 MEDIUM · 2 LOW · 4 INFO.
- D1 items 1-7 all conform, proven by probes (mixed 8-step sequence sums to the pool; `requested` absent on every uncapped entry; `0` not `+0`; Advance round from 0 with gain -3 still logs).
- Data integrity in real Obsidian (scratch e2e on `two-trackers.md`): hand-edited entries (old shape, capped, `requested == amount`, `requested: abc`, stored `value: -2`) round-trip byte-for-byte; ABOVE/BETWEEN/BELOW and the other tracker untouched; 50-cap trims correctly.
- Non-vacuity: with the 3 `src/` files reverted to `eaa8742a`, 7 jsdom/unit tests and e2e INIT-M09 + INIT-R03 fail; restored, all green.
- Gates (measured here): tsc clean · lint clean · jest 7185 passed / 1 skipped, 260/261 suites · e2e `259/264 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · lifecycle 54/54 (21+16+9+4+4, all rc 0; 188/402/443/302/256 s). Shots/freeze/parity not re-run (no CSS/DOM-structure change beyond log text).
- Working tree clean before and after (`git -C $DSE status --porcelain` empty).

## Findings

### LOW-1 — the "capped at 0" suffix trusts any `requested`, and `amount !== requested` is not "capped"
- `src/elements/initiative/view.ts:601` renders the suffix whenever `typeof entry.requested === 'number'`;
  `src/elements/initiative/model.ts:522` stores `requested` whenever `amount !== requested`.
- Failure scenarios (both measured):
  1. A hand-edited entry `{round: 1, amount: 1, label: Same, requested: 1}` renders `R1: +1 — Same (1, capped at 0)`
     (jsdom probe P2 and the real-Obsidian probe). A gain was never capped at 0.
  2. Float drift: a hand-edited `value: 0.2` with `round_gain: 0.1` (or any fractional pair) gives
     `amount: 0.10000000000000003, requested: 0.1`, so an uncapped GAIN is written with `requested` and shown
     `(0.1, capped at 0)`. (Quick-add is whole-numbers-only, so only hand-edited/fractional `round_gain` reaches this.)
- Prescribed fix: decide "capped" from the floor, not from inequality: in `applyMaliceChange`,
  `if (before + requested < 0) entry.requested = requested;` (amount stays `after - before`). In the view, render the
  suffix only when `typeof entry.requested === 'number' && entry.requested < entry.amount` (a spend that was
  shortened). Add one jsdom row for a hand-edited `requested` equal to `amount` (no suffix).
- Severity LOW: needs a hand edit or non-integer YAML; normal use never produces it.

### LOW-2 — "see the next entry" points the wrong way (plugin and workspace CHANGELOG)
- `draw-steel-elements/CHANGELOG.md:34` and worktree `CHANGELOG.md:23` (SC-577 bullet, the drive-by edit):
  "(the Malice log shows the change it made; see the next entry)". The SC-578 bullet was inserted ABOVE the SC-577
  bullet in both files, so the "next entry" is SC-584 (plugin) / SC-480 (workspace), not SC-578.
- Prescribed fix: "see the SC-578 entry above" (or just "see SC-578"). The rest of the drive-by is accurate: the old
  "the Malice log shows the configured amount" clause became false with this change, and both bullets are still
  unreleased (plugin `## 7.0.0 (unreleased…)`, workspace `## Unreleased`), so rewriting them is in order.

### INFO-1 — workspace CHANGELOG commit will conflict on land
- `f0fd9a65` is based on `3f91de37`; workspace `main` (`35dbdfae`) added the SC-584 bullet at the same spot (top of
  `## Unreleased`). `git merge-tree 3f91de37 main f0fd9a65` shows a conflict in `CHANGELOG.md`. Trivial
  (keep both bullets); resolve at land. Fix LOW-2's wording at the same time.

### INFO-2 — "the log always adds up to the pool's movement" is true per logged change only
- `src/drawSteelAdmonition/EncounterData.ts:529`, `docs/initiative-tracker.md` ("so the log adds up to the pool"):
  the − / + stepper (`view.ts:499`, `data.malice.value = v`) changes the pool without a log entry (pre-existing
  design), and old pre-SC-578 entries keep the typed amount. So the sum of the log does not equal the pool once the
  stepper is used. D1 item 1 uses the same words, so this is ledger-conformant; optional wording: "each entry is the
  change the pool made" rather than "the log adds up to the pool".

### INFO-3 — dse-verify skill CURRENT needs the land-time update
- `.claude/skills/dse-verify/SKILL.md:31` still lists SC-578 among the e2e known bugs and `258/264 … 6 known-bug`.
  After this lands: `259/264 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, known bugs SC-257, SC-355, SC-384,
  SC-580, SC-588. Owner's land step, not the implementer's.

### INFO-4 — garbage-in YAML (pre-existing, not introduced)
- `round_gain: .nan` or `value: .inf` give `amount: NaN` and render `NaN`; `parse` only checks `typeof value ===
  'number'`. Same before this change (SC-577 already wrote `NaN` into `value`). Not worth a ticket unless the owner
  wants `parse` to reject non-finite numbers.

## D1 conformance (item by item)

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | `amount` = after − before via `maliceValueOf` | OK | `model.ts:518-520`; P1 sequence 2 → -5,+4,adv,adv,adv,+2,-9,+1 gives amounts `[-2,4,-3,-1,0,2,-2,1]`, sum + 2 = final 1 |
| 2 | `requested` only when it differs; uncapped entries have no key | OK (see LOW-1 for the float edge) | P1 `requested` column `[-5,·,·,-3,-3,·,-9,·]`; jsdom `'requested' in entry` false rows |
| 3 | line `R<round>: <amount> — <label> (<requested>, capped at 0)` | OK | `R1: -2 — A (-5, capped at 0)`, `R3: -1 — Round gain (-3, capped at 0)`; uncapped `R1: +4 — B` unchanged |
| 4 | zero renders `0` | OK | `R4: 0 — Round gain (-3, capped at 0)`; hand-edited old `amount: 0` now reads `R1: 0 — Zero old` |
| 5 | Advance round from 0 with negative gain still logs | OK | P1 step 5; jsdom row; unit `fromZero` |
| 6 | one code path | OK | `applyMaliceChange` is the only caller of `addToMalicePool` and of `appendMaliceLogEntry` in `src/` (view.ts:682 quick-add, model.ts:481 Advance round); no other reader of `log[].amount` in `src/` besides the one renderer (`view.ts:596-605`, shared by editable, read-only and print) |
| 7 | `MaliceLogEntry` doc comment corrected | OK | `EncounterData.ts:526-532` |

## Data integrity probes

- jsdom P2 (through the real `ElementPipeline`, last `replaceSource` bytes): a note with `value: -2` and entries
  old-shape / capped / `requested == amount` / `requested: abc` / old `amount: 0`, then quick-add -5: value written 0,
  all five old entries re-emitted with identical keys and values (incl. `requested: abc` kept as a string), new entry
  `{round 1, amount 0, label Spend, requested -5}` appended.
- Real Obsidian (scratch spec `[ZZR2-01]`, `--only`, removed after): `Initiative/two-trackers.md`, first tracker
  externally edited to the hand-edited log above; quick-add -5 on tracker 1, then -5 on tracker 2 (Malice 2).
  Note text: `# Two trackers\n\nABOVE` prefix intact; everything from `BETWEEN` to `BELOW` byte-identical after the
  first write; the first tracker's bytes identical after the second write; tracker 2 log
  `{round 1, amount -2, label Other, requested -5}`, value 0. Rendered lines:
  `["R1: +3 — Old shape","R1: -2 — Capped (-5, capped at 0)","R1: +1 — Same (1, capped at 0)","R1: -1 — Weird","R1: 0 — Spend (-5, capped at 0)","R1: -2 — Other (-5, capped at 0)"]`.
  (Tracker 2's `- grabbed` was rewritten `- key: grabbed` by the existing condition writer: pre-existing, unrelated.)
- jsdom P3: 50 capped entries + a capped quick-add → 50 entries, `E1` dropped, new `{amount -1, requested -3}` last.

## Test quality

- Non-vacuity: `git checkout eaa8742a -- <3 src files>` → jest (matrix + economy-serialize) 7 failed / 146 passed:
  the four new `[M09]` capped/zero/Advance rows, `[R01]` gain -5 row, the T-9 negative-gain test, the
  `applyMaliceChange` test (not a function). e2e `--only=INIT-M09,INIT-R03` → both FAIL (`amount -5` vs `-3`;
  `-9` vs `-4`). Restored with `git checkout HEAD -- …`; tree clean.
- The uncapped rows and the parse → serialize round-trip pass on the base too: they are regression guards for D1 item 2
  and key order, correctly so.
- No bracketed ticket id in any test title (`(SC-577)`/`(SC-578)` are parenthesised; jsdom `[M09]` ids repeat across
  six rows, which only the e2e runner would care about, and it does not read jsdom titles).
- INIT-R03 uses `toMatchObject`, so it cannot catch a stray `requested` on the uncapped "Opening Malice" entry; the
  jsdom/unit rows cover that, so no change needed.

## Gates (this review, dse @ `2747307f`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, rc 0 | `tsc.log` |
| lint | clean, rc 0 | `lint.log` |
| jest | `Tests: 1 skipped, 7185 passed, 7186 total`; `Test Suites: 1 skipped, 260 passed, 260 of 261` (shots cache present, so 1 skipped not 2) | `jest.log` |
| e2e (full) | `OBSIDIAN-E2E done: 259/264 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0 (known bugs SC-257, SC-384, SC-580, SC-355, SC-588) | `e2e.log` |
| lifecycle (five `--only` parts, private `DSE_CAMERA_TMP` each) | `21/21`, `16/16`, `9/9`, `4/4`, `4/4` ok, 0 failed: **54/54**; 188 s, 402 s, 443 s (part 3), 302 s, 256 s | `lc1.log` … `lc5.log` |

All logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-rev-r2-rv2/`
(also `probe1.log`, `probe2.log`, `e2e-probe.log`, `e2e-probe2.log`, `revert-jest.log`, `revert-e2e.log`).
