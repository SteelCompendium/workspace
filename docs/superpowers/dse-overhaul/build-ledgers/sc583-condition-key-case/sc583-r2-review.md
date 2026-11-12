# SC-583 r2 review (independent reviewer)

**Executive summary**
- Verdict: **APPROVE**. 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO. Reviewed dse `6453bc5d` against base `93e8e48c` and rules O1-O7.
- Gates (my runs): tsc rc 0, lint rc 0, jest `10760 passed / 1 skipped / 10761` (266 suites passed, 1 skipped; the implementer's 10759/2 differs only because shots CSS was cached), e2e full `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (COND-K01..K05 all ok).
- Vacuous-test check: helper mutated to strict `a === b` made 10 jest tests red (all 10 new recognition/no-dup/lookup tests) and e2e `--only=COND-K01..K05` went `1/5 ok, 4 failed` (K04 passes at base, a guard). Source restored; HEAD unchanged; dse tree clean.
- Site survey (my own grep): the only condition-key comparison/lookup sites in `src/` are `ConditionManager.get{,Pseudo,Any}ConditionByKey` and `ConditionsModal.pickMatch`. Both now go through `conditionKeysEqual`. Every reader (ConditionsModal rows and icon picker, kit `conditionIcons`, `conditions/panel`, `MinionStaminaPoolModal`, initiative tracker, sidebar) resolves through the manager. Removal and edit are by identity or index. No missed site.
- The deleted jest `test.failing` SC-583 marker is fully covered (and more strictly) by `test/dom/views/conditions-modal.test.ts:703`. Deleting it follows the repo's known-bug rule ("appears fixed - remove the marker").
- Keeping the SC-592 maps in `initiative/model.ts` exact-case is **correct and necessary**. Runtime probes P1-P5 show plain `- Dazed`, mixed-case plain-plus-object pairs and mixed-case duration edits round-trip byte-exact. Case-folding those maps would break O3 (see INFO-1).
- LOW-1: COND-K05's "still a no-op" pick is unasserted and is a no-op even at base. INFO items are out-of-scope edges (slug or space mismatches) and follow-up candidates.

## Gates run by the reviewer

| Gate | Result | Log |
|---|---|---|
| tsc | `TSC_RC=0` (no output) | `sc583-r2-gate-tsc.log` |
| lint | `LINT_RC=0` (only the stock `.eslintignore` warning) | `sc583-r2-gate-lint.log` |
| jest full (after `rm -f main.js styles.css`) | `Tests: 1 skipped, 10760 passed, 10761 total`; `Test Suites: 1 skipped, 266 passed`; `JEST_RC=0`; load 1.4-3 | `sc583-r2-gate-jest.log` |
| e2e full | `OBSIDIAN-E2E done: 290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`, `E2E_RC=0` | `sc583-r2-gate-e2e-full.log` |
| jest mutant (helper is strict `===`), the 6 touched suites | `Tests: 10 failed, 513 passed` | `sc583-r2-jest-mutant-strict-eq.log` |
| e2e mutant `--only=COND-K01..K05` | `1/5 ok, 4 failed` (K01 custom true, K02/K03 unexpected write, K05 custom true; K04 ok) | `sc583-r2-e2e-K-mutant-strict-eq.log` |
| reviewer runtime probe (jest, throwaway file, deleted after the run) | `9 passed` | `sc583-r2-probe-jest-run1.log`, source `zz-sc583-r2-probe.test.ts` |

I spot-checked the implementer's logs (not re-run). Lifecycle p1-p6: 21/21, 16/16, 9/9, 4/4, 7/7, 3/3 ok, 0 failed. e2e: 290/293, 0 failed. freeze: `280/280 frozen print PNGs byte-identical`. parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. shots: host-leak and capture-clip OK lines are present. All match the report.

All logs are under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc583-r2-review/`.

## O1-O7 conformance

- **O1 Recognition: met.** Registry lookups ignore case, so the name, icon, CUSTOM tag, icon-picker default, tracker icons, ds-conditions chip, pool modal and sidebar (all via `kitBuildConditionIcons`) all recognise the hand-written casing. The Add menu has no "already present" filter at base, so its present-ness lives in `pickMatch`, which is covered.
- **O2 No duplicate: met.** `pickMatch` dedupes with the helper for known and custom picks. Probe P1 confirms: `- Dazed` plain with picks of Dazed, custom "DAZED" and custom "HEXED" (with `Hexed` written) all produced 0 writes.
- **O3 Preserve bytes: met.** P1-P5 confirmed byte-exact serialized condition lines. Details below.
- **O4 One helper: met.** One exported `conditionKeysEqual` covers every comparison site. It compares case only, by design (see INFO-2).
- **O5 Existing duplicates: met.** A note with `Dazed` and `dazed` shows two standard rows and writes nothing on open. Removing one leaves the other with its fields. Jest `conditions-modal.test.ts:743` and e2e K05 cover this.
- **O6 Ids and titles: met.** e2e ids are `[COND-K01]`..`[COND-K05]`, with no bracketed ticket id in any title or describe. Jest titles use the unbracketed `SC-583:` prefix, the same style as the existing suites.
- **O7 Fixtures: met.** The new note is `e2e/vaults/shipped/Initiative/key-case.md`. No visual-harness fixture changed (implementer freeze 280/280). `Initiative/conditions.md` is untouched.

## Extra probes requested by the owner

### 1. The deleted jest `test.failing` marker (`conditions-modal-matrix.test.ts`, removed by 6453bc5d)
The marker opened `[{ key: 'Dazed' }]`, picked Dazed by mousedown and asserted exactly one case-folded `dazed` across `lastEmit` or `holder.conditions`. Replacement `conditions-modal.test.ts:703` uses the same setup and the same mousedown pick, routed through the same `pickMatch`. It asserts more:
- `onChange` is never called.
- 1 row remains.
- `holder.conditions` equals `[{key:'Dazed'}]`.
- A later Grabbed pick emits `[{key:'Dazed'},{key:'grabbed'}]`.

The replacement goes red under the strict-equality mutant. It is a genuine superset. Per e2e/README "Known bugs", the convention is to remove a marker once its bug is fixed, and the deletion follows it. No other SC-583 markers remain in `e2e/` or `test/`.

### 2. SC-592 plain/object maps left exact-case (`src/elements/initiative/model.ts:144-209`)
Probes drive the real initiative path: `parse` → `ConditionsModal` with the view's `onChange` (`holder.conditions = updated`) → `serialize`.
- P1: hero `- Dazed` (plain) and `- key: Hexed`. Picking Dazed, custom "DAZED" and custom "HEXED" gives 0 writes. Picking Grabbed gives 1 write, and the lines are `- Dazed` / `- key: Hexed` / `- key: grabbed`. The plain string stays plain.
- P2: `- Dazed` (plain) with `- key: dazed / duration: eot` (the K05 shape) shows two standard rows. After an unrelated pick the lines are byte-exact: `- Dazed` / `- key: dazed` / `  duration: eot` / `- key: grabbed`.
- P3: `- dazed` (plain) with `- key: Dazed` (key-only object). After an unrelated pick, plain stays plain and the object stays an object.
- P4: editing a mixed-case plain entry, run for both spellings `Dazed` and `dazed`. Save Ends turns `- Dazed` into `- key: Dazed` / `duration: save-ends`. "Until removed" brings it back to `- Dazed`. Behaviour is identical to the lowercase run, and the spelling is kept.
- P5: removing plain `- DAZED` leaves `- bleeding` / `- key: Hexed` byte-exact.
- P6: two holders do not cross-talk. Hero `- Dazed`, then picking Dazed on the Ogre, adds `{key:'dazed'}` to the Ogre only. The hero stays `['Dazed']`.

Why exact-case is required: ConditionsModal clones every entry (`ConditionsModal.ts:134`, `{ ...entry }`), so the `bornPlain` WeakSet is lost after any modal write. If `mixed` were built case-folded, P2's `Dazed`/`dazed` pair would count as "mixed". The cloned `{key:'Dazed'}` would then fall back to `bornPlain` (false) and be rewritten as `- key: Dazed`, which violates O3. Exact-case is right: the maps match the literal bytes the user wrote, and SC-583's dedupe means the plugin no longer adds a second casing of a written key.

## Findings

### LOW-1: COND-K05's "already present twice: still a no-op" step asserts nothing and cannot fail
- Where: `e2e/specs/conditions-modal/cond-keycase.e2e.ts:83-87`.
- Problem: `addByKeyboard(modal, 'Dazed')` is followed only by `dse.settle()`. There is no `expectNoWrite` and no row count, and the final check reads only `noteCondition(KEYCASE, 'creature', 0)`.
  - Ogre #1 already holds a lowercase `dazed`, so this pick is a no-op even under the strict-equality base. The step cannot distinguish the fix.
  - If any regression appended a third `dazed` here, the test would still pass. After removing index 0 the list would be `[{dazed, eot}, {dazed}]`, and index 0 still matches.
  - The same gap means "removing one leaves the other" is not checked for the absence of extras.
- The jest twin (`conditions-modal.test.ts:743`) does assert both points, so behaviour coverage exists. Only the e2e claim is unbacked.
- Fix: wrap the pick in `await dse.expectNoWrite(KEYCASE, () => addByKeyboard(modal, 'Dazed'))`. Replace the final single-index check with a whole-list check, e.g. `dse.expectNoteBlock(KEYCASE, INIT).toMatchObject({ enemy_groups: [{ creatures: [{ instances: [{ conditions: [{ key: 'dazed', duration: 'eot' }] }, {}] }] }] })`, or assert `modalRows()` has length 1 before closing.
- Optional: make the pick meaningful by using a fixture holder whose only dazed is non-lowercase. K02 already covers that for the hero.

### INFO-1: Rationale worth a code comment
- Where: `src/elements/initiative/model.ts:172` (the `mixed` set) and `:199`.
- The implementer's reason for keeping the maps exact-case is in the report but not in the code. A future "consistency" pass could route these through `conditionKeysEqual` and silently break O3 (scenario under probe 2).
- Fix (optional, one line): `// exact-case on purpose (SC-583): these remember the literal bytes written; ConditionsModal clones entries, so a case-folded 'mixed' would rewrite a plain 'Dazed' as an object`.

### INFO-2: A custom condition written with spaces, punctuation or non-ASCII casing still duplicates (out of O4's case-only scope)
- Where: `src/views/ConditionsModal.ts:770-772`. A custom pick compares the slug of the typed text against the written key.
- Probe P7: hand-written `key: Hex Mark` plus typed "hex mark" gives 1 write, `[{key:'Hex Mark'},{key:'hex-mark'}]`.
- Probe P9: `key: Straße` plus typed "STRASSE" gives a duplicate `strasse`. `toLowerCase` does not fold ß, and the slug strips non-ASCII.
- Both behave the same at base, and O4 only requires `Hexed` vs "hexed".
- Possible follow-up (owner's call): for custom picks, compare `slugConditionKey(c.key) === slug` as well as the helper.

### INFO-3: `key: High Ground` (display name, not key) is not recognised as `high-ground`
- Probe P8: rows are `[{High Ground, custom: true}, {High Ground, custom: false}]` for `key: High Ground` plus `key: HIGH-GROUND`. Two rows share one name and only the CUSTOM tag tells them apart.
- This is outside O1, which is about the key ignoring case only. The implementer's helper test pins `high-ground` ≠ `High Ground` deliberately.
- Follow-up candidate if Scott wants display-name keys recognised.

### INFO-4: In O5's duplicate case the rows share identical accessible names
- Where: `ConditionsModal.ts:333` (`Remove ${displayName}`).
- With `Dazed` plus `dazed`, both rows read "Dazed", with buttons "Remove Dazed" and "Customize Dazed". Only the badge differs. A screen-reader user cannot tell which one they are removing.
- At base the same note showed "Dazed (custom)" and "Dazed". This is the same situation as an exact-case duplicate (`dazed` twice), which predates this branch. Report-only, per O5 ("Report what the UI shows").

## Not findings (checked)
- Commit hygiene: 3 commits, author Scott, no AI attribution or co-author trailers.
- No CHANGELOG change on the branch. That is correct: the r1 brief assigns the CHANGELOG and the pointer bump to the owner.
- `matchesFor` (`ConditionsModal.ts:612`) is a search filter whose query is already lowercase, against lowercase registry keys. It needs no change.
- The new fixture note leaves coverage at 172/172 and full e2e has 0 failures, so it does not disturb other specs.

## Tree state
- Before: superproject ` M draw-steel-elements` (the pre-existing unstaged pointer) and a clean dse tree at `6453bc5d`.
- After: identical. The helper mutation was reverted with `git checkout -- src/utils/Conditions.ts`, and the throwaway probe test file was removed after its run.
- Ignored build outputs (`main.js`, `styles.css`, `e2e/.out/`) were regenerated by the jest and e2e runs, as on every battery.
- Mutant e2e failure bundles are at `/home/scott/code/steelCompendium/worktrees/sc583-condition-key-case/draw-steel-elements/e2e/.out/20261112-123428-7252/`.
