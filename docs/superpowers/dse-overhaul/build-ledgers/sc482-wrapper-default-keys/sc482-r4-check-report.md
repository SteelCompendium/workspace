# SC-482 r4 scoped check — the MEDIUM-2 fix (`emitAhead`)

Reviewer R (agent acc2988fc38efadbd). Reviewed dse `5e9a852` (r4 commits 3435773 + 5e9a852 on `ea56712`) and superproject `0b2f4f2` (on `e5f329a`).

## Executive summary

- **Verdict: LAND-READY.** 0 BLOCKER/HIGH/MEDIUM, 1 LOW (a test gap; the behaviour is correct), 3 INFO.
- **MEDIUM-2 fixed in real Obsidian 1.14.4** (run `20261022-041818-5bcd`, then a second run with a passthrough case added). 5/5 probes pass:
  - counter `prefs:` + `title: Deaths`, + then − → just the `prefs:` lines;
  - montage with only `prefs:`, End round then Back → just the `prefs:` lines;
  - counter with a gated passthrough pref (`authoringControls`) → just the `prefs:` lines;
  - counter `title: Deaths` → `{}`;
  - blank montage → empty body.

  Every case re-renders with no error card. On `2343981` (the r3 code on ea56712) the same spec fails 3/5 with the invalid-YAML error.
- **`emitAhead` changes only the exact `{}` case.**
  - Wrapper level: 14 inner bodies × 4 override sets × the plain and passthrough branches, plus 3 collapse sets, plain and stacked. Against ea56712 exactly 14 outputs differ, and every one has an inner body of exactly `{}`. `{} `, ` {}`, `{}\n` and `{ }` are unchanged.
  - Real write path (8 prefs/collapse cases plus stamina-bar): the head is byte-identical to 2343981. The fully-authored prefs counter is byte-identical to ea56712.
- **Byte check against bc4a0c5:** the same 54,666 matches plus the 8 encounter `{}` cases (the ruled shape). Output is identical to r3's head on all 54,674.
- **FormModal Save on stamina-bar with `prefs:`:**
  - `prefs` + every field but `max_stamina` cleared → `prefs:\n  sbDensity: compact\nmax_stamina: 20`, which re-parses.
  - `prefs:` only → Save disabled (`max_stamina` is required), so the `{}` body cannot be reached through the form.
- **Mutation tests:** 5 of 8 mutants go red. 2 survivors are equivalent (INFO-1). The third (the passthrough branch reverted) is LOW-1.
- **Range-diff:** commits 1–11 are identical (`=`) to 9f6d247; 12 = 3435773 and 13 = 5e9a852 are new. The superproject CHANGELOG has 0 conflict markers, and all four bullets (SC-432, SC-483, SC-356, SC-482) are under `## Unreleased`.
- **Targeted jest:** 571/571. **Implementer's `l-*` logs:** every rc is 0, and each matches the expected numbers:

  | Gate | Result |
  |---|---|
  | jest | 5693 / 1 / 237 of 238 (= 5607 + 86 branch tests) |
  | lifecycle | 31/31 |
  | e2e | 95/98, 0 failed, 3 known-bug, 66/66 |
  | shots | 580, 0 FAIL, `modal button host-leak OK (10 …)`, both text-scale lines |
  | freeze | 280/280 |
  | parity | 0/0/24 |

## Findings

### LOW-1 — no test pins the passthrough branch of `withPrefOverrides`
- **Where:** `src/framework/prefOverrides.ts`, `return (model) => emitAhead(stringifyYaml({ prefs: merged }), serialize(model));`. Reverting this line to plain concatenation leaves all 571 targeted tests green (`mut4-prefs-passthrough-reverted.log`).
- **Why it matters:** the branch is live in the shipped state, where `experimental` is off. A block whose `prefs:` carries a gated key such as `authoringControls` is passed through it. Jest runs with `experimental` on (`test/setup/experimental.ts`), so the r4 tests only reach the plain branch.
- **Evidence the code is right:** in real Obsidian, ZZ482R4-C3 (counter `prefs:\n  authoringControls: true\ntitle: Deaths`, + then −) writes `prefs:\n  authoringControls: true` on the head and re-renders. The same spec on 2343981 error-cards.
- **Fix (tests only):** add a unit test. `withPrefOverrides(() => '{}', {}, { order: ['authoringControls'], values: { authoringControls: true } })(model)` should be `'prefs:\n  authoringControls: true'`. Alternatively, a pipeline test with `setExperimental(false)`.

### INFO-1 — two equivalent mutants
- `body.trim() === '{}'` and `/^\{\s*\}$/` in place of `body === '{}'` both survive.
- They are equivalent in practice: every serializer returns `stringifyYaml(...).trim()`, so a body that is "nothing left" is always exactly `{}`.

### INFO-2 — Form Save drops the framework `collapsed:` key on stamina-bar (pre-existing, not SC-482)
- Source `prefs:\n  sbDensity: compact\ncollapsed: true\nmax_stamina: 20` saves as `prefs:\n  sbDensity: compact\nmax_stamina: 20`.
- FormModal pops `prefs:` but not the framework collapse keys, and `StaminaBar.parse` drops the unknown key.
- Base ea56712 gives byte-identical output, so this is not from this branch. It is FormModal territory (SC-483/SC-493); the owner may want to file it.

### INFO-3 — procedural
- I wrote `run-wrap.sh` with a heredoc rather than the Write tool. It still captures its own rc and log.

## Probes run

1. **Real Obsidian:** the r3 spec plus ZZ482R4-C3, run on the head (`e2e-r4.log`, 5/5 ok, notes in `e2e-notes-head.jsonl`) and on a scratch worktree of 2343981 (`e2e-r4-r3.log`, 2/5 ok, notes in `e2e-notes-r3.jsonl`).
2. **Wrapper and write-path probe** (`zzR4WrapProbe.test.ts`), run on ea56712, 2343981 and the head (`wrap-*.json`), 10/10 tests in each tree.
   - Wrapper level: 0 diffs between ea56712 and 2343981. Head vs ea56712: 14 diffs, all with an inner body of `{}`.
   - Write path: the head is identical to 2343981 in all 9 cases.
3. **Byte check:** the r1 probe and oracle against r1's stored bc4a0c5 dump (`compare.log`); 0 diffs vs r3's head dump.
4. **Form Save probe** (`zzR4FormProbe.test.ts`), run on the head and on ea56712, with identical results (`r4form.json`, `r4form-base.json`).
5. **Mutation tests** (`mutate4.sh`, `mutate4-results.txt`), 11 suites including `test/dom/authoring`, baseline 571 passed:

   | Mutant | Failed |
   |---|---|
   | always concatenate | 3 |
   | no `trimEnd` | 3 |
   | drop the head | 3 |
   | trimmed compare | 0 (equivalent) |
   | regex compare | 0 (equivalent) |
   | plain branch reverted | 2 |
   | passthrough branch reverted | **0 (LOW-1)** |
   | collapse wrapper reverted | 1 |

## Tree state

- Plugin `git status --short`: empty.
- Superproject worktree: ` M draw-steel-elements`, unchanged from the start.
- The scratch worktrees (ea56712, 2343981) are removed and pruned. dse origin/develop is still ea56712.

## Artifacts

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r4-check-acc2988fc38efadbd/`:

- Real-Obsidian probes: `zz482r3-probe.e2e.ts`, `e2e-r4.sh`, `e2e-r4.log`, `e2e-r4-r3.log`, `e2e-notes-head.jsonl`, `e2e-notes-r3.jsonl`
- Wrapper and write-path probe: `zzR4WrapProbe.test.ts`, `wrap-ea56712.json`, `wrap-2343981.json`, `wrap-head.json`
- Byte check: `probe-head.json`, `compare.log`
- Form Save probe: `zzR4FormProbe.test.ts`, `r4form.json`, `r4form-base.json`
- Mutation tests: `mutate4.sh`, `mutate4-results.txt`, `mut4-*.log`
