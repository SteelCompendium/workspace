# SC-360 r4 scoped re-review: the r3 fix delta at dse `6ab681a` (on origin/develop `d58cf6a`)

**Executive summary**
- **Verdict: FIX-THEN-LAND.** Counts: HIGH 0 · MEDIUM 1 · LOW 2 · INFO 2. Everything else in the delta holds up when executed.
- **Rebase is clean.** The 8 commits I reviewed in r2 rebased with identical code: `git range-diff` shows `=` for 7 of them, and the 8th (46d4d1b) differs only in CHANGELOG context. A code diff of the two ranges with CHANGELOG excluded is 0 lines.
- **MEDIUM-1 (r2) is fixed.** Every probed id shape gives 1 tracker across 3 presses, with an initiative save between presses. `_dse_from` is written quoted and survives the save.
- **New MEDIUM-A.** The parse-failure branch of the LOW-1 refusal also refuses blocks that have NO `_dse_anchor` but have a YAML error (for example a duplicate key or tab indentation). Those blocks were pinnable before r3. The Notice then tells the user to fix an `_dse_anchor` line that does not exist.
- **Mutations.** 5 of the 6 r3 src fixes go red when reverted. The 6th, `requestPinToSidebar`'s new Notice branch, is untested (LOW-B).
- **Stress.** 34/34 green over both sidebar files, 42 tests per run, load 9 to 41.
- **Gates.** tsc and lint clean. jest `Tests: 1 skipped, 5011 passed, 5012 total`, 229 of 230 suites. e2e `71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`.

Reviewed: `6ab681a843618d6a9b232fdadd3bab415501dab6`. The r3 commits are 23bf5b0 (red-first tests), a05db7f (fix + CHANGELOG) and 6ab681a (type/lint follow-ups). The tree was clean before and after (`git status --porcelain` empty), and nothing was committed.
Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/sc360-evidence/r4-rereview/`.

## Findings

### MEDIUM-A: a YAML-invalid block with no `_dse_anchor` is now refused, and the Notice blames an anchor line that isn't there
- **Where:**
  - `src/framework/sidebar/anchor.ts:100-101`: `catch { return { body, id: null }; }`
  - `src/framework/sidebar/registration.ts:251-253`: maps `id === null` to `'unreadable-anchor'`.
  - `registration.ts:203`: `UNREADABLE_ANCHOR_NOTICE`.
- **Scenario.** A user has a typo in a block, for example `current_value: 1` twice, or a tab-indented line. They press "Pin to sidebar" or "Send block to sidebar".
  - Before r3, the block was stamped and pinned, and the panel showed the same error card as the note.
  - Now nothing is pinned, and the Notice says: "this block already has an `_dse_anchor` line the sidebar cannot read … Put it on one line as `_dse_anchor: value` …, or delete it". The block has no such line, so the instruction cannot be followed.
- **Measured** (`probe-pin.log`). For both entry points, on both a duplicate-key block and a tab-indented block: ret false, note unchanged, 0 panels, and that exact Notice.
- **Why it matters.** It is a regression added in this round, and the user-facing text is wrong in a common case: a typo while authoring a block.
- **Prescribed fix (2 lines + 1 test).** Refuse a body that fails to parse only when its text contains the key. Otherwise stamp as before. A body without the substring `_dse_anchor` cannot gain a duplicate key from the append:
  ```ts
  } catch {
      if (!body.includes(ANCHOR_KEY)) { /* fall through to stamping, as before r3 */ } else return { body, id: null };
  }
  ```
  An alternative is a separate `'invalid-yaml'` result with its own Notice, for example "this block has a YAML error; fix it, then send it again". Add a case to `anchor.test.ts` or `registration.test.ts`: a body with a duplicate key and no `_dse_anchor` is still stamped and pinned, with no anchor Notice.

### LOW-A: an encounter whose tracker was already rewritten before the fix still gets one more tracker
- **Where:**
  - `src/framework/sidebar/anchor.ts:147` (`findGeneratedBlock`, exact text compare).
  - CHANGELOG.md:51: "an encounter that already carries such an id now opens just one tracker".
- **Scenario.** The encounter has `_dse_anchor: "056948"` (stored quoted, so it is a string). Its existing tracker had already been rewritten by an initiative save before the fix, to `_dse_from: 56948` (or `.inf` for `"4e8540"`). The first press after updating does not match the old tracker. It appends a second one, `_dse_from: "056948"`, and stays at 2 from then on. The old tracker holds the live combat state.
- **Measured** (`probe-enc.log`). Counts per press were `[2,2,2]` for both pre-damaged pairs. For a numeric encounter id with a pre-fix tracker (`56948`/`56948`) it was `[1,1,1]`, because those match textually.
- **Prescribed fix.** Pick one:
  - (a) Accept it and reword CHANGELOG:51, for example "…opens just one tracker from now on (a tracker the old bug had already split off stays as an extra block you can delete)".
  - (b) Make `findGeneratedBlock` also match when both tokens parse to the same YAML number. `parseYaml('v: 056948').v === parseYaml('v: 56948').v` gives 56948 on both sides, and `.inf` vs `4e8540` gives Infinity on both. Restrict this to the case where neither side was quoted.

  This is the owner's call. The bug only affects beta users.

### LOW-B: `requestPinToSidebar`'s unreadable-anchor Notice branch is not guarded by any test
- **Where:** `src/framework/sidebar/registration.ts:321-322`.
- **Measured.** Mutation M6 removes the branch, so the chrome "Pin to sidebar" path falls back to "couldn't find that block in X". All 113 tests in the 4 relevant files still pass (`mut-M6.log`). The probe shows the branch does work today (`probe-pin.log`, `requestPinToSidebar` rows).
- **Prescribed fix.** Add one test to `test/dom/framework/registration.test.ts` beside the SC-184 `requestPinToSidebar` cases: a block with `_dse_anchor: abc123 # c` should give exactly one Notice containing `_dse_anchor`, none containing "couldn't find", and no leaf.

### INFO-A: the next-line reader takes only the first line of a multi-line plain scalar
- `anchor.ts:29`. For `_dse_anchor:` followed by `  abc123` and `  def456`, the reader returns `abc123` but YAML's value is `abc123 def456`. On the first save the model writes `_dse_anchor: abc123 def456`. The panel then loses its block, and a re-pin is refused with the Notice.
- This only happens with a hand-typed block and fails safely: no duplicate key is added. A tab-indented next line (`\tabc123`) is read too, but YAML already rejects that block. No action.

### INFO-B: refusal never fires on normal blocks
- Probed `ensureAnchor` on every `src/elements/*/example.yaml` (22 files) as LF, CRLF and trimmed: all stamped, 1 anchor line each. `scc` is `strictBody` and is never stamped by `sendToSidebar`.
- Also stamped or reused correctly:
  - an empty body
  - a comment-only body
  - quoted `"056948"` and `'056948'`
  - letter-led ids
  - CRLF with and without an anchor
  - rewritten `9.2e+51`, `.inf`, `0`
  - nested sequences
- An end-to-end CRLF pin works: 1 anchor line, 1 panel, no Notice.
- At base and still now, a sequence or bare-scalar body (`- a`, `just a scalar`) is stamped into invalid YAML. This branch did not cause it.

## Checks requested by the brief

1. **MEDIUM-1 probe** (`probe-enc.log`; 3 presses, with an initiative parse→stringify save between each). Every shape gives `[1,1,1]`:

   | Starting id | `_dse_from` before save | `_dse_from` after save |
   |---|---|---|
   | `"056948"` | `"056948"` | `"056948"` |
   | `"4e8540"` | `"4e8540"` | `"4e8540"` |
   | `9.2e+51` | `"9.2e+51"` | `"9.2e+51"` |
   | `56948` | `"56948"` | `"56948"` |
   | `.inf` | `"Infinity"` | `Infinity` (still matches) |
   | `.nan` | `"NaN"` | `NaN` |
   | `0` | `"0"` | `"0"` |
   | `true` | `"true"` | `"true"` |
   | control `abc123` | `"abc123"` | `abc123` |
   | fresh (no id) | a new letter-led id | the same id |

   The only exception is the pre-damaged pairs in LOW-A.
2. **LOW-1 refusal** (`probe-anchor.log`, `probe-pin.log`).
   - Refusal fires for: an inline comment, `!!str`, `~`, an empty value, a space before the colon, a value on the next line after a blank line, a nested sequence or map as the value, and YAML that does not parse.
   - When it fires, nothing is written (the note is byte-identical), no panel is added, and exactly 1 Notice is shown via either entry point.
   - The wording is plain and says what to fix, except in the MEDIUM-A case.
   - The next-line form is read and reused: LF, CRLF, quoted, and with trailing whitespace. `findAnchoredBlock` finds it.
   - The empty-value hazard stays closed. Neither `_dse_anchor:` followed by `next_key: abc` (LF or CRLF), nor an unindented `abc123` on the next line, is taken. These are refused instead of getting a duplicate key appended, which is an improvement.
3. **CHANGELOG (CHANGELOG.md:43-53).** Accurate and in plain words, apart from LOW-A ("opens just one tracker" overclaims for already-split trackers) and MEDIUM-A (the refusal also covers YAML-invalid blocks without an anchor, and the bullet doesn't say so). LOW-2 and LOW-3 from r2 are addressed: the panel can lose its block once after updating and re-linking repairs it, and the second-tracker fix is mentioned.
4. **Mutations** (`mut-summary.txt`). The relevant files are anchor, sidebarInitiative, sidebarEncounterHandoff and registration (113 tests).

   | Mutation | What it reverts | Tests failing |
   |---|---|---|
   | M1 | `String(existing)` | 3 (the 56948 / 9.2e+51 / .inf encounter cases) |
   | M2 | quoting of `_dse_from` | 1 (the `"056948"` case) |
   | M3 | the parsed-key refusal | 10 |
   | M3b | the parse-failure refusal | 1 |
   | M4 | the next-line alternative | 3 |
   | M5 | `sendToSidebar`'s `id === null` handling | 1 |
   | M6 | `requestPinToSidebar`'s Notice branch | 0 (LOW-B) |

   All reverted with `git checkout -- src`, and the tree was clean afterwards.
5. **Stress** (`stress/summary.txt`). 34/34 green over both sidebar files, 42 tests per run.
   - Runs 1-20: 12 busy loops, load 9-18.
   - Runs 21-34: 24 busy loops, load 21-41.
   - 0 failures, 0 timeouts. The loops were killed by recorded PID (`pids.txt`), and 0 were left alive.
6. **Gates.** Exit codes were captured inside a script file (`g-rc.txt`, `g-e2e-rc.txt`), all rc=0.
   - tsc clean (`tsc --noEmit && tsc --noEmit -p e2e`), lint clean.
   - jest: `Test Suites: 1 skipped, 229 passed, 229 of 230 total` / `Tests: 1 skipped, 5011 passed, 5012 total`. That matches the expected counts.
   - e2e: `OBSIDIAN-E2E done: 71/76 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`.
