# SC-612 r5 scoped re-review of the r4 delta (reviewer-r3 resumed): dse a06dba37 on 1516f894, superproject d9bca0ec on 4cfac4bf

**Executive summary**
- **Verdict: LAND,** with one MEDIUM for the owner to rule on: accept it as a residual, or fold the prototyped fix. It is a safe refusal, not a write.
- **Rule P matches the ruled rule:** capped Myers `editDistance`; the unique minimum must equal the head-map line; the deleted option is counted; a give-up keeps the head-first answer; the twin gate and the SC-607 `strictPins` tail-first check are kept. Placement ranges `[0,s)`, `(e,∞)`, `[0,q)`, `(qe,∞)` are correct, the prune's lower bound is valid, and the cap boundaries are right.
- **r3 fuzz on a06dba37** (234,064 cells, 3 seeds): twinned-ambiguous writes **0** (r3 tip 212); unambiguous new refusals **0** (508); corrupt **0**; refusals with no edit 0; next-round failures 0; flips in notes without twins 0. T6b family: all 1,060 new refusals are ties.
- **Named repro:** H1, H1b, H1c, H1d refused; M1-M6 saved (form and card). Two forms / sibling writes F1-F7 correct.
- **Real Obsidian, r4 bundle:**
  - G-S108 (l)-(o) = my H1 cells: 4/4 refused with one Notice (part 7).
  - Extra variants, my patch: H1b form RV / card LP and H1c form LP / card RV: 4/4 refused with one Notice.
- **Gates:** jest **11773 / 2 skipped** (86 s); lifecycle part 7 **1/1** (67 s). The last two commits change comments and test titles only.
- **Not vacuous:**
  - red on 1516f894: 31 of 897;
  - LOW-3 base behaviour confirmed: base writes `name: Edited` into the closed copy;
  - my 8 P mutants: 8/8 killed.
- **MEDIUM-1 (new):** in a note with twins, an outside whitespace-only edit inside the pinned block is now refused (base saved). Two shapes: a trailing space on a body line, or a blank line before its closing fence. These are unambiguous and no identical counter is involved. Cause: `placedUniquely` takes candidates by exact lines (`ReadingModeBlockHost.ts:1209`, `:1211`).
  - A narrow fix is prototyped (`sc612-r5-prototype-whitespace.diff.txt`). It fixes the trailing-space shape; all 917 SC-612 tests stay green, including the in-repo fuzz and sweep totals. The blank-line shape stays refused.
- **Timing (median, jsdom):**
  - twin note, 5000 lines: 7.65 ms vs base 3.49;
  - 100 identical counters with 198 edits: 16.1 ms vs 2.6;
  - 300 identical counters: 21.7 vs 4.7.

  Acceptable.

## 1. r3 findings: fixed / not fixed
| r3 finding | status (a06dba37) | evidence |
|---|---|---|
| HIGH-1 different-block write, a different counter next to the run | **FIXED** | fuzz 0 twinned-ambiguous writes; repro H1/H1b/H1c refused; real Obsidian G-S108 (l)-(o) + my 4 variants refused |
| HIGH-2 new refusals in unambiguous cells | **FIXED** (on the fuzz's edit set; see MEDIUM-1 for a whitespace edit outside it) | fuzz 0; M1, M2, M3, M6 save |
| MEDIUM-1 sweep narrower than claimed | **FIXED**: 14 layouts, refusal assertion, seeded fuzz in jest, totals re-pinned, guarantees restated "on the sweep's layouts / fuzz" | test files; doc comment `ReadingModeBlockHost.ts:1158-1167` |
| LOW-1 CHANGELOG wording | **FIXED** (one nit, LOW-1 below) | `CHANGELOG.md:11-18` (d9bca0ec) |
| LOW-2 "pays nothing" | **FIXED** | doc comment |
| LOW-3 unterminated + closed copy | **ruled deviation, confirmed**: base writes the closed copy (`name: Edited` lands in the copy; the r4 test's red on 1516f894 shows the diff); r4 refuses | `sc612-r5-red-on-base.log` |

## 2. Gates
| gate | result | log |
|---|---|---|
| jest full (worktree, a06dba37) | **11773 passed / 2 skipped**, 275 suites + 1 skipped, 86 s, rc 0 (= 11692 + 81) | sc612-r5-gate-jest-1.log |
| lifecycle part 7 G-S108 | **1/1 ok** (15 cells incl. (l)-(o)), 67 s | sc612-r5-gate-lifecycle-part7.log |
| commits 75b3d20b / a06dba37 | comments in `lineMap.ts`, a header comment and 3 test titles; no code token changed | `git diff 9b272808..a06dba37` |
Other lifecycle parts, e2e, tsc / lint: not re-run (r4 ran them on this code; the last two commits change no code).

## 3. Rule P read against the ruling (`ReadingModeBlockHost.ts:1176-1229`, `lineMap.ts` `editDistance` / `myers`)
- `pinnedTarget` does three things in order:
  1. keeps the SC-607 `strictPins && mapLineFromTail !== line` check;
  2. then, when twinned, requires `placedUniquely`;
  3. keeps the body check after that.

  The greedy maps and `greedyDissents` are gone.
- **Ranges:** `pre = A[0,s)`, `suf = A(e,∞)`, candidates `B[0,q)` / `B(qe,∞)`; the deleted option is `dist(pre+suf, B) + blk.length`. These are correct. Mutant R3 (`B.slice(qe)`) is killed (15 tests).
- **Cap:**
  - `best === null` (here cannot be priced) means the head-first answer stands (documented residual 2, T14).
  - Other candidates are priced with cap `best`, so a null means strictly costlier.
  - `blk.length > best` means the deleted option is strictly costlier.
  - `editDistance` returns null when `|n-m| > cap`; it returns `n+m` only after that check.

  All correct. Mutant R7 (`>= cap`) is killed.
- **Prune:** `|q - s| + |suffix-length difference| > best` is a valid lower bound (an edit distance is at least the length difference), and `>` keeps ties. Mutant R4 (`>=`) is killed.
- **CRLF:** `splitLines` drops terminators. E7 (a CRLF tie) is refused; E8 (the whole note converted LF to CRLF) saves.
- **Unterminated trailing fence:** `blockSpans` adds it as `[start, lastNonBlank]`. E10 (blank lines appended after an unterminated pinned twin) saves. E9 (an unterminated pinned twin, the closed twin deleted) is refused, but base refuses it too: not P's.
- **Cap path, as asked** (a twin note with a >400-line one-sided edit; `sc612-r5-edge.log` E3-E6):
  - E3: the lower twin deleted, 500 lines pasted above, pin on the lower;
  - E6: the upper twin deleted, 500 lines appended, pin on the upper.

  Both still write the survivor (a tie), exactly as base: the documented residual 2. E4 / E5 (the mirror pins) are refused by `mapLine` itself, as at base.

## 4. Findings (new)

### MEDIUM-1: a whitespace-only outside edit inside the pinned block of a twinned note is refused (base saved)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:1209` (candidates must be line-identical to the block as pinned) and `:1211` (`if (!here) return false`).
- **Scenario** (`sc612-r5-edge.log`; form and card alike; base 1516f894 saves into the pinned counter, r4 refuses with the Notice):
  - The note is `TOP / C5 / '' / C5 / END`, and the form or + is on the upper counter.
  - **E1:** an outside edit only adds a trailing space to the upper counter's `current_value: 5` line.
  - **E2:** the outside edit adds a blank line before its closing fence.
- **Why it matters:**
  - Nothing is ambiguous: the other counter is untouched, and `normalizeBody` treats the edited block as the same body.
  - No identical counter is added or removed, so this is outside the ruled class.
  - It is safe (Notice, nothing written, the next round saves) and rare: another app touching whitespace inside the block during the round.
- **Fix option** (prototype `sc612-r5-prototype-whitespace.diff.txt`):
  - When the head-first block is not line-identical but has the same length and the same normalized body, keep it as the candidate `here`.
  - Price every candidate with its own internal line edits (`editDistance(blk, B[q..qe])`) added.
  - Results: E1 saves (form and card); all 917 SC-612 tests pass, including the in-repo fuzz (3 seeds) and the sweep's pinned totals; H1 / M cases unchanged.
  - E2 (block length changed) stays refused. Dropping the length condition breaks fuzz seed 3: a closed copy of an unterminated fence becomes writable.
- **Owner choice:** fold the narrow fix (and add E1 as a test), or record E1 / E2 as P residual 6 under "Save nothing with a notice is fine."

### LOW-1: CHANGELOG over-claims "a counter with another value … does not cause a refusal"
- **Where:** `CHANGELOG.md:16` (superproject d9bca0ec).
- **Problem:** r4's own P residual 5 (proposal §3) says a counter of another value pasted directly above the pinned block is refused. That is base behaviour too, but the sentence states the opposite.
- **Fix:** "An edit elsewhere in the note, or a sibling's + / -, does not cause a refusal."

### INFO
- **Mutants** (`sc612-r5-mutants.log`, on the 5 SC-612 files, 897 tests), all killed:

  | mutant | tests failed |
  |---|---|
  | R1 ties allowed | 7 |
  | R2 head-first not identical → place | 5 |
  | R3 suffix off by one | 15 |
  | R4 prune `>=` | 7 |
  | R5 deleted tie counted as unique | 19 |
  | R6 no twin gate | 3 |
  | R7 cap boundary | 16 |
  | R8 candidates by length only | 12 |

  r4's own P6 / P17 equivalents (optimisations) are accepted.
- **Red on base 1516f894** (r4's 5 test files on base source; `sc612-r5-red-on-base.log`): 31 failed / 866 passed of 897, the same set r4 reports (editDistance x5, fuzz x3, sweep, H1/H1b/H1c, unterminated, T1-T6b, T13, the drawn-pin strict test).
- **Timing inside `vault.process`** (`sc612-r5-timing.log`, a form Save, median of 21; base 1516f894 vs r4):
  - non-twin notes: 2000 lines 2.21 / 2.73 vs 1.59 / 3.04 ms; 5000 lines 4.84 vs 3.65;
  - twin notes: 2000 lines with 20 / 198 changes 3.15 / 5.03 vs 1.09 / 2.08; 5000 lines with 198 changes 7.65 vs 3.49;
  - many identical counters (the new probe): 100 counters (1,900 lines) with 20 / 198 changes 2.77 / 16.1 vs 1.24 / 2.59; 300 counters (5,700 lines) with 198 changes 21.7 vs 4.65.

  Lower than R's twin cost at r3 (7.80 at 2000 lines / 198 changes). The many-twin case is the new worst, about 22 ms. Acceptable.
- **Superproject:** d9bca0ec on 4cfac4bf = workspace origin/main after `fetch`; one CHANGELOG commit; no pointer commit.

## 5. Artifacts (ledger dir)
| file | contents |
|---|---|
| `sc612-r5-rereview-report.md` | this report |
| `sc612-r5-gate-jest-1.log` | jest full gate |
| `sc612-r5-gate-lifecycle-part7.log` | lifecycle part 7 (G-S108) gate |
| `sc612-r5-obsidian-h1-variants-r4.log` | real-Obsidian H1b / H1c variants on the r4 bundle |
| `sc612-r5-lc-h1-variants-patch.py.txt` | the harness patch for those variants |
| `sc612-r5-fuzz-summary-r4.txt` | fuzz totals |
| `sc612-r5-repro-twoforms-r4.log` | named repro and two-forms runs |
| `sc612-r5-edge.log` | edge probes: base / r4 / prototype |
| `sc612-r5-edge.test.ts.txt` | the edge-probe test |
| `sc612-r5-red-on-base.log` | r4's tests on 1516f894 source |
| `sc612-r5-mutants.log` | mutant results |
| `sc612-r5-mutants.py.txt` | the mutant script |
| `sc612-r5-timing.log` | timing results |
| `sc612-r5-timing.test.ts.txt` | the timing test |
| `sc612-r5-prototype-whitespace.diff.txt` | the MEDIUM-1 fix prototype |

Raw fuzz records are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc612-r5-reviewer/` (`fz-r4-s{1,2,3}.jsonl`, `t6b-r4.jsonl`). The base records are r3's c0995beb runs; `src/framework/host` and `test/mocks` are unchanged from c0995beb to 1516f894.

## 6. Working tree
- dse `git status --porcelain`: empty, HEAD a06dba37.
- superproject: ` M draw-steel-elements` (the unbumped pointer, as before), HEAD d9bca0ec.
- Nothing committed. No PIDs killed. Every probe ran in scratch exports.
