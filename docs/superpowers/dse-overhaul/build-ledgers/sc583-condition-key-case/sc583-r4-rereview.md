# SC-583 r4 scoped re-review (r3 delta only)

**Executive summary**
- Verdict: **APPROVE**. 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (wording of the comment; optional).
- LOW-1 is fixed. On `d0561a68` the strengthened COND-K05 goes red under two mutants of `pickMatch`, and it was blind to both before r3:
  - mutant A (dedupe off): fails at the new `expectNoWrite`;
  - mutant B (silent push, no write, no render): fails at the new `modalNames` check after removal.
- Source restored after each mutant. COND-K01..K05 `--only` on `d0561a68`: `5/5 ok, 0 failed`.
- The INFO-1 comment (`src/elements/initiative/model.ts:171-173`, `:202`) is accurate.
- Superproject: exactly 2 commits on `origin/main` (`eccfe90e`): `67be12c8` (CHANGELOG) and `bbbe6d79` (pointer). Only `CHANGELOG.md` and `draw-steel-elements` change. The pointer is `d0561a68`. No AI attribution in any dse (4) or superproject (2) commit message.
- The CHANGELOG entry matches the behaviour I probed in r2, including the custom "hexed" next to `Hexed` claim (probe P1, jest `conditions-modal.test.ts` "custom `Hexed`" test, e2e COND-K03). No inaccurate sentence.
- My own tsc rc 0 and lint rc 0 on `d0561a68`. Implementer r3 logs: tsc and lint `GATE_RC=0`; jest `1 skipped, 10760 passed, 10761 total`; e2e `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`. All consistent.
- Tree: worktree superproject clean at `bbbe6d79`, dse clean at `d0561a68`, both as found.

## 1. LOW-1 (COND-K05 repeat pick)
Delta `6453bc5d..d0561a68` in `e2e/specs/conditions-modal/cond-keycase.e2e.ts:83-94`:
- The repeat pick is now `dse.click(cond.add)` → `dse.type('Dazed')` → `dse.expectNoWrite(KEYCASE, press Enter)`.
- After the pick: `modalNames()` equals `['Dazed','Dazed']`.
- After removing the first row: `modalNames()` equals `['Dazed']`.
- Then `expectNoteBlock(...).toMatchObject` asserts the whole Ogre #1 condition list as `[{key:'dazed',duration:'eot'}]`, with instance 2 present. That is a whole-array match, so an extra entry fails it. `modalNames` exists in the driver (`e2e/driver/conditions.ts:56`).

| Run (all `--only`, on `d0561a68`) | Result | Log |
|---|---|---|
| mutant A: `pickMatch` dedupe off (`false && conditionKeysEqual(...)`); the repeat pick appends and writes a second `dazed` | `0/1 ok, 1 failed`; `COND-K05 FAIL: expected no write to Initiative/key-case.md, saw 1` | `sc583-r4-e2e-K05-mutantA-nodedupe.log` |
| mutant B: on "already present", push `{key}` silently (no emit, no render); the extra appears only at the next write | `0/1 ok, 1 failed`; `COND-K05 FAIL: expect(received).toEqual(expected) … ["Dazed", + "Dazed"]` (the post-remove `modalNames`) | `sc583-r4-e2e-K05-mutantB-silentpush.log` |
| restored source, COND-K01..K05 | `5/5 ok, 0 failed, 0 known-bug`, `E2E_RC=0` | `sc583-r4-e2e-K01-K05-green.log` |

The old K05 would have passed both mutants. It made no write assertion, and after removing index 0 its only check (`noteCondition(creature, 0)` = `{dazed, eot}`) still held with a trailing extra `dazed`. The strict-`===` helper mutant is not useful here: it fails K05 earlier, at the first `modalRows` check, before the repeat pick.

Both mutants were applied with `sed` to `src/views/ConditionsModal.ts` and reverted with `git checkout -- src/views/ConditionsModal.ts`. `git status` was clean after each. Failure bundles are in `draw-steel-elements/e2e/.out/20261112-124447-0ad3/` (A) and `20261112-124502-cb3b/` (B).

## 2. INFO-1 comment (`src/elements/initiative/model.ts:171-173`, `:202`)
Accurate. The `plain`/`mixed` maps do decide plain-string shape by exact spelling, and folding case would rewrite an unedited entry. Probe 2 in r2 showed the case: `- Dazed` next to `key: dazed`, after a modal write that clones entries.

**INFO-A (optional wording):** "Recognition of a key's case-insensitive meaning lives in the Conditions registry" is slightly narrow. Duplicate detection also uses `conditionKeysEqual` in `ConditionsModal.pickMatch`. Suggested fix: "lives in `conditionKeysEqual` (the Conditions registry and the Conditions window's duplicate check)". It is not misleading as written, and no fix is required.

## 3. Superproject and CHANGELOG
- `git rev-list --count origin/main..HEAD` = 2, and `origin/main` (`eccfe90e`) is an ancestor.
  - `67be12c8 docs(SC-583): CHANGELOG Unreleased entry`
  - `bbbe6d79 chore: bump draw-steel-elements to d0561a68 (SC-583: …)`
- `git diff --stat eccfe90e..HEAD`: `CHANGELOG.md | 6`, `draw-steel-elements | 2`. `ls-tree` gives `draw-steel-elements` = `d0561a68a27e…`.
- Attribution grep (`co-authored|claude|anthropic|generated with`) over dse `93e8e48c..d0561a68` (4 commits) and superproject `eccfe90e..bbbe6d79` (2 commits): 0 hits. Author on all of them is Scott Tomaszewski.

CHANGELOG sentences checked against the probed behaviour:
1. "a hand-written condition key in capitals, such as `key: Dazed`, is now the standard condition": true (r2 P1, COND-K01).
2. "used to match only in lowercase, so `Dazed` showed as a custom condition, and picking Dazed … added a second, lowercase `dazed`": true. This is the base behaviour the mutant and red runs reproduced (K01 `custom: true`, K02 unexpected write).
3. "`Dazed` shows Dazed's name and icon, and picking Dazed again adds nothing": true (jest glyph `waves`, K01, K02).
4. "The key keeps the spelling you wrote; the plugin never rewrites it": true. r2 P1-P5 were byte-exact, including plain-string shape and duration edits.
5. "adding a custom 'hexed' next to a hand-written `Hexed` does not add a second one": true (r2 P1 also with "HEXED"; jest; K03).

The custom-match sentence covers capitals only. r2 INFO-2 (`Hex Mark` vs typed "hex mark" still duplicates) differs by a space, not by capitals, so the sentence is not inaccurate.

## 4. Implementer r3 gates (spot-checked)
`…/scratchpad/sc583-r3-impl/`:
- tsc `GATE_RC=0` with no TS errors.
- lint `GATE_RC=0` (stock `.eslintignore` warning only).
- jest `Test Suites: 1 skipped, 266 passed`, `Tests: 1 skipped, 10760 passed, 10761 total`, `GATE_RC=0`.
- e2e `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`, `GATE_RC=0`, with COND-K05 ok.

The tsc log's timestamp (07:39:55) is 20 s before the `d0561a68` commit time (07:40:15), so I re-ran tsc and lint myself on the committed head: `TSC_RC=0`, `LINT_RC=0` (`sc583-r4-gate-tsc.log`, `sc583-r4-gate-lint.log`).

All r4 logs are under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc583-r4-review/`.
