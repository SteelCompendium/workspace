# SC-482 r2 scoped re-review — the LOW-1 / LOW-2 fix delta

Reviewer R (agent acc2988fc38efadbd). Reviewed dse `053b625` (fix commits `8a13a18` + `053b625` on `8d890f9`), superproject `01971d9`.

## Executive summary

- **Verdict: FIX-REQUIRED** — 1 MEDIUM (a regression the LOW-1 fix introduced), 0 BLOCKER/HIGH, 0 LOW, 4 INFO.
- **MEDIUM-1.** For counter and negotiation, the new empty body (`''`) is a body their parse rejects. A counter whose source has none of its own keys (for example `title: Deaths`) becomes an error card after + then − and a reopen.
  - Confirmed in real Obsidian 1.14.4 on 053b625.
  - The same probe on 8d890f9 renders fine. On r1 the body was `{}`, which also renders.
  - Party and encounter also cannot re-parse `''` (their sources are only `{}`); stamina-bar can never produce `''`. Montage and project re-parse `''` fine.
- **LOW-1 otherwise:** fixed for montage and project. The byte check re-run against bc4a0c5 gives 54,674 / 54,674 (0 fails). Compared with r1's head, exactly the 8 former misses changed (`{}` → `''`); nothing else moved.
- **LOW-2:** fixed. The encounter `party:`-only test exists, and the `['party']` mutant now fails 2 tests.
- **Mutation tests:** 16 / 16 mutants go red (the r1 set plus 4 new mutants on the empty-body guard).
- **Range-diff:** the 6 rebased commits are all `=` (identical patches). The only new content is 8a13a18 + 053b625. Superproject CHANGELOG: 0 conflict markers; the SC-432 and SC-482 bullets are both present.
- **RECOV-R07:** 10/10 runs pass on 8d890f9 and 10/10 on 053b625 (a pass means a write count of 1). The head runs went up to load 13.5. I found no path by which this branch could add a second write (INFO-2).
- **Evidence of record (implementer's `i-*` logs):** the summary lines match the expected numbers — jest 5653/1/236 of 237, lifecycle 31/31, e2e 95/98, 0 failed, 3 known-bug, 66/66, shots 580, freeze 280/280, parity 0/0/24.
- **Base moved:** dse origin/develop is now `54f8f88` (SC-483 landed, FormModal-only); `git merge-tree` shows 0 conflicts. Superproject origin/main is now `988f24f`.

## Findings

### MEDIUM-1 — the empty body is written for elements whose parse throws on an empty body
- **Where:** `src/elements/shared/undeclaredDefaults.ts` `stringifyOmittingUntouched` (`if (kept !== dto && Object.values(kept).every(v => v === undefined)) return '';`) and the inline copy in `src/elements/negotiation/model.ts` `serialize`.
- **Why it breaks:** `''` is re-parsed as `null`. These parses throw on `null`:
  - `Counter.parse(null)`: `Cannot read properties of null (reading 'max_value')`
  - `new NegotiationData(null)`: `(reading 'name')`
  - party / encounter: `The input must be a YAML object.`
  - `StaminaBar.parse(null)`: same failure, but unreachable — the schema requires `max_stamina`.

  Only montage and project accept an empty body.
- **Failure scenario (real Obsidian 1.14.4, run `20261022-001512-0168`):**
  1. A ```` ```ds-counter ```` block whose body is `title: Deaths` (a misspelled key, or `{}`).
  2. Press + → `current_value: 1`.
  3. Press − → the fence body is empty.
  4. Navigate away and back. The block is an error card: `Counter: failed to render (render)Cannot read properties of null (reading 'max_value')`.

  The same spec on `8d890f9` writes `current_value: 0 / min_value: 0 / value_height: 3 / name_height: 1` and re-renders with no error. The jest real-path probe reproduces the same error card for counter and negotiation (`emptyprobe.json`).
- **Reachability:** narrow. The source must declare none of the element's own keys; any present key, even `name:` (null), keeps the body non-empty. It is still a regression from both bc4a0c5 and r1.
- **The ruling's premise does not hold here:** the r1 ruling assumed `''` "returns the block to the user's original shape". For counter and negotiation the original shape was never empty, because their parse rejects an empty body, so `''` cannot be what the user wrote.
- **Prescribed fix:**
  - Record per instance whether the parse input was a mapping, in `recordingDefaults`. `declaredOf` already tells null/blank apart from an object.
  - Return `''` only when the source body was not a mapping (null or blank). Otherwise keep writing `{}`, the r1 behaviour, which every element re-parses.
  - Do the same in negotiation's inline guard, or route negotiation through the helper.
  - In effect only montage and project ever emit `''`, which is exactly where the user's body really was empty.
- **Tests to add or change:**
  - Counter `title: Deaths`, + then −: the body is `{}` and a re-run of the pipeline on it has no error card.
  - The same for negotiation (patience slot 3, then 5).
  - Change `wrapperDefaultKeys.test.ts` `'$name: serialize(parse({})) is empty'` to: `serialize(parse({}))` is `'{}'` for every element, and `serialize(parse(null))` is `''` for montage and project.
  - Keep the montage End round → Back write-path test as is.

### INFO-1 — SC-483 (now on develop 54f8f88) touches the same contract
- FormModal Save calls `serialize(def.parse(data, ...))` on its serialize path. A form Save that clears every field would reach MEDIUM-1's `''` for a serializer-backed element.
- The elements affected by MEDIUM-1 (counter, negotiation) have no schema, so they likely have no form. Stamina's schema requires `max_stamina`.
- SC-483's own stringify path also writes `''` for an empty object, but only for definitions without `serialize`. No conflict (merge-tree 0). The MEDIUM-1 fix makes the question moot for serializer-backed elements.

### INFO-2 — RECOV-R07 double write is a timing race in the test, unrelated to this branch
- **Mechanism:** in `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:344`, the popover − / + buttons each commit through `RecoveriesStrip` `commit` → `onSetRemaining` → `setRecoveries` → a debounced persist. A persist still in flight can land inside `waitForWrite`'s window, which `mark()` opens just before the Catch-breath click. Under load that shows up as `count: 2`, with a correct final note.
- **Why the branch cannot cause it:** the serializer is a pure function on the same model, and it decides neither the number nor the timing of persists. The fixture (`Stamina/recoveries.md`) serializes identically to the base: stamina-bar is 2916/2916 identical to SC-466 in the byte check.
- **Runs (`--only=RECOV-R07 --shards=1`):**
  - Base `8d890f9` (scratch worktree): 10/10 ok, load 3.2–4.6.
  - Head `053b625`: 10/10 ok, load 3.6–13.5.
  - Every run passed `expect(w.count).toBe(1)`.

### INFO-3 — range-diff and CHANGELOG are clean
- `git range-diff bc4a0c5..0e67be8 8d890f9..053b625`: commits 1–6 are `=`; 7 (`8a13a18`) and 8 (`053b625`) are new.
- `01971d9` changes only `CHANGELOG.md` (+7) against `3c25464`, with 0 `<<<<<<< / ======= / >>>>>>>` lines. Under `## Unreleased`, the SC-432 bullet is line 7 and the SC-482 bullet line 16.

### INFO-4 — the bases moved again
- dse `8d890f9` → `54f8f88` (SC-483, 5 commits, FormModal + its test only).
- Superproject `3c25464` → `988f24f`.

## Probes run

1. **Byte check re-run.** Same probe file and oracle as r1, against r1's stored bc4a0c5 dump (`probe-base.json`).
   - Result: 54,674 / 54,674 pass; byte-identical counts per element unchanged.
   - Diff of 053b625's dump against r1's 0e67be8 dump: 8 cases changed, every one `{}` → `''`.
2. **Empty-body re-render (jest, real pipeline and ReadingModeBlockHost).** A temporary test, deleted afterwards (`emptyprobe.json`).
   - Counter `title: Deaths`: + gives `current_value: 1`; − gives an empty body; a re-render shows an error card.
   - Negotiation `title: Frodo`: slot 3, then slot 5 → empty body → error card.
   - Model level, `''` re-parse: counter and negotiation throw on null, party and encounter throw "must be a YAML object"; montage and project are ok.
3. **Real Obsidian.** An ad hoc spec and fixtures in `e2e/specs/zz482r2/` and `e2e/vaults/shipped/Zz482r2/`, deleted afterwards.
   - Head: FAIL as described in MEDIUM-1.
   - Base 8d890f9: ok.
4. **Mutation tests.** Each mutant was run against the 10 SC-482/SC-466/byte suites (baseline 287 passed) and restored from a byte copy.

   | mutant | failed |
   |---|---|
   | helper: undefined counted as present | 4 |
   | helper: presence read after parse | 14 |
   | helper: compare primitives only | 54 |
   | helper: ignore the snapshot | 43 |
   | counter: drop `name_height` | 23 |
   | montage: filter by the wrong owner | 8 |
   | negotiation: no pitfall map | 1 |
   | negotiation: no nested record | 24 |
   | encounter: drop `monsters` | **2** (survived in r1) |
   | project: drop `rolls` | 2 |
   | party: unwrapped parse | 6 |
   | stamina: drop `style` | 14 |
   | empty-body return dropped | 8 |
   | no-record guard dropped | 1 |
   | undefined counted as content | 2 |
   | negotiation empty-body guard dropped | 1 |

5. **Targeted jest.** The touched suites are green at baseline: 287/287, which includes the 12 new r2 tests.
6. **Sanity check of the `i-*` logs.** Every rc is 0, and the summary lines are as listed in the executive summary.

## Tree state

- Plugin `git status --short`: empty.
- Superproject worktree: ` M draw-steel-elements`, unchanged from the start.
- The scratch `8d890f9` worktree is removed and pruned.
- Gitignored `e2e/.out` run dirs remain.

## Artifacts

All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r2-rereview-acc2988fc38efadbd/`:

- Byte check: `probe-head.json`, `compare.log`, `compare-fails.json`
- Mutation tests: `mutate2.sh`, `mutate-results.txt`, `mut-*.log`
- Empty-body jest probe: `zzR2EmptyBodyProbe.test.ts`, `emptyprobe.json`
- Real-Obsidian probe: `zz482r2-probe.e2e.ts`, `e2e-r2.log`, `e2e-r2-base.log`, `e2e-notes.jsonl` (holds the base run; the head notes are quoted in MEDIUM-1)
- RECOV-R07 runs: `r07-one.sh`, `r07-{base,head}-{1..10}.{log,rc,load}`
