# SC-483 r2 scoped re-review (reviewer B) — dse 54f8f88 on 8d890f9

**Executive summary**
- Verdict: **LAND-READY**. 0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO (report-only: the empty-fence blank line, and keep-chomp scalars).
- r2 delta (`1945d40..54f8f88`) meets all three folded rulings. Nothing else changed in `src/`. The only test change to existing tests is the 8 trailing-`\n` edits.
- Range-diff of the r1 commits: `bc4a0c5..b6f73ed` vs `8d890f9..1945d40` is `=` for all 3 commits. `FormModal.ts` and `formModal.test.ts` are byte-identical across b6f73ed and 1945d40.
- Real Obsidian (e2e harness, 1.14.4, private Xvfb, experimental + authoringControls): 11 probes. **54f8f88: 11/11 green** (run `20261022-000324-11db`). **r1 tip 1945d40: 7/11** (run `20261022-000403-901b`); it fails P07, P08 and P12 on the extra blank line before the closing fence, and P10 on `{}`.
- Mutation: undoing the empty→'' change makes 2 tests fail. Dropping `trimEnd` makes 12 fail. The whole r1 FormModal makes 13 fail. Unmutated: 26/26.
- tsc (incl. `-p e2e`) clean · lint clean · `formModal.test.ts` 26/26.
- A's r2 battery (logs re-read, not re-run) matches the expected numbers: jest 5601/1/234 of 235 (5585+12+4, twice) · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 (run `20261021-233940-89f7`) · shots 580 with both text-scale lines · freeze 280/280 · parity 0/0/24 · every rc 0.
- Owner §6 empty ds-roll: well-formed and renders. ` ```ds-roll\n``` ` saves as ` ```ds-roll\n\n``` `: one blank body line added. That differs from the original by one line, but it is a valid empty block. Report only (host splice, out of scope).
- Plugin tree clean at 54f8f88. The superproject's ` M draw-steel-elements` (pointer at 8d890f9) is A's deliberately unbumped pointer.

## 1. r2 diff vs the rulings (`git diff 1945d40..54f8f88`)
- **LOW-1**: met. `FormModal.ts:230`: `Object.keys(data).length === 0 ? '' : stringifyYaml(data)`; the `prefs:` prefix is kept. Tests: "an empty schema'd block … writes an empty body (not `{}`)" expects `['']`, and "an empty body keeps the prefs: map and nothing else" expects `prefs:\n  reduceMotion: true`.
- **INFO-2**: met. `FormModal.ts:231`: `.trimEnd()` on the whole stringify-path output. Tests: the `replaceFenceBlock` round-trip returns the identical note, and "exactly one line break between prefs: and the body".
- **INFO-4**: met. Doc comment at `FormModal.ts:59-61`; no behaviour change.
- Nothing else changed. `src/` is those two hunks only. In the test file:
  - 1 import added (`replaceFenceBlock`)
  - 4 new tests
  - 8 existing SC-483 expectations, each changing only by a dropped trailing `\n` (I checked every hunk)
  - no other assertion touched
- Scope note: `stringifyWorking` is also the preview's `raw` argument and the serialize-path `catch` fallback. Trimming the end of either is harmless (no built-in parse reads trailing whitespace of `raw`).

## 2. Range-diff of the r1 commits
```
1: 524718d = 1: 44ffed0 test(SC-483): … (red)
2: 3cd5a6a = 2: c9e7a8c fix(SC-483): …
3: b6f73ed = 3: 1945d40 test(SC-483): avoid Array.prototype.at
```
`git diff b6f73ed 1945d40 -- src/authoring/FormModal.ts test/dom/authoring/formModal.test.ts` is empty. `origin/develop` is still `8d890f9`.

## 3. Real-Obsidian probes
The probes are a throwaway spec plus fixture notes, copied in and removed by explicit single-path `rm -f`.

| id | probe | 54f8f88 | r1 tip 1945d40 |
|---|---|---|---|
| P01–P06 | r1 set (repro, two blocks, declared default, touched + reopen, reopen from new source, comments) | green, same bytes as r1 | green |
| P07 | skills untouched Save, exact note | `skills:\n  - climb` then fence, byte-exact | RED: blank line before fence |
| P08 | roll Edges → 2, exact note | `roll: Might test\nedges: 2` then fence | RED: blank line before fence |
| P10 | empty ` ```ds-roll\n``` ` saved untouched | 1 write → ` ```ds-roll\n\n``` `, ABOVE/BELOW byte-exact, block renders | RED: ` ```ds-roll\n{}\n\n``` ` |
| P12 | `prefs:`-prefixed stringify-path block saved untouched | byte-identical body → **no vault write**, form closes, no Notice | RED: 1 write (adds a blank line) |
| P13 | keep-chomp `crit: \|+` as last key (record only) | `crit: \|\n  boom`; parsed `crit` = `"boom\n"` | `crit: \|\n  boom\n` + blank line; parsed `crit` = `"boom\n"` |

The harness's per-test checks held on 54f8f88 for all 11 probes: other fences byte-identical, fence lines intact, no page errors, no orphan modal.

### INFO-A (owner §6, report only) — an empty body adds one blank line inside the fence
- `replaceFenceBlock` splits `''` into one empty line, so the original ` ```ds-roll\n``` ` becomes ` ```ds-roll\n\n``` `.
- It is well-formed: it renders as a ds-roll and parses as an empty block. It is one line longer than what the user had. A second untouched Save writes no change, because the body stays `''`.
- Only reachable on a Save of an empty block. Out of scope (host splice). If wanted, the fix belongs in `replaceFenceBlock`: emit zero body lines for `''`.

### INFO-B — a keep-chomp block scalar as the last key loses its trailing blank lines (pre-existing, unchanged by r2)
- Source `crit: |+\n  boom\n` + blank line. r1 and r2 both parse the saved `crit` as `"boom\n"`, so r2 changes no data here.
- r2's `trimEnd()` could only ever drop trailing newlines of the LAST top-level value, and only for `|+` values; no built-in field needs that. Noted for completeness; no action.

## 4. Mutation (`formModal.test.ts`, 26 tests)
| mutant | failed | which tests |
|---|---|---|
| R0 unmutated | 0/26 | — |
| R1 `body = stringifyYaml(data)` (empty → `{}`) | 2 | both new empty-body tests |
| R2 no `trimEnd()` | 12 | the 8 re-asserted, the splice round-trip, prefs + body, the empty-prefs test, the null-valued-key test |
| R3 whole r1 FormModal (1945d40) | 13 | — |

Matches A's 13 red / 26 green. The file was restored to 54f8f88 after each mutant.

## 5. Gates (this round)
- tsc clean, rc 0. lint clean, rc 0 (only the known `.eslintignore` warning). `formModal.test.ts` 26 passed, rc 0.
- Full battery not re-run, as briefed. I re-read A's logs `sc483-r2-impl-a/r2e-*.log`; every rc is 0 and the numbers are the ones listed in the summary.

## Housekeeping
- Plugin `git status --porcelain` is empty; HEAD 54f8f88.
- Scratch worktree at 1945d40: created under my scratch folder, then removed with `git worktree remove --force` (its run bundle was copied out first).
- I deleted nothing in `e2e/.out`. The harness's own 12-run retention pruned older runs during my probes.
- Current `e2e/.out` contents:
  - six r1 probe-debug runs: `20261021-183222-8540`, `-183433-283d`, `-183648-0847`, `-183705-0389`, `-183832-9f79`, `-184005-4a93`
  - A's runs: `20261021-223634-56de`, `-224648-f548`, `-230901-27fc`, `-233940-89f7` (evidence of record, still present)
  - my r2 runs: `20261022-000235-93d6` (first try; P12 helper waited for a write) and `20261022-000324-11db` (green)
  - `coverage.json`, last written by my partial run
- The retention prune removed `20261021-142406-848b`, `-174047-db37` (A's r1 evidence) and `-181308-1e3b` (my r1 full e2e). The r1 report quotes their summary lines, and the r1 copies `fix-run-bundle/` and `base-run-bundle/` in `sc483-r1-review-b/` are unaffected.

## Artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r2-review-b/`)
- Gates: `tsc.log`, `lint.log`, `jestfm.log` (+ `.rc`)
- Mutation: `mutants.txt`, `mut-R*.log`
- Probe spec and fixtures: `e2e-probe/spec/form.e2e.ts`, `e2e-probe/fixtures/SC483/*.md`
- Probe results: `e2e-probe/results-r2fix.jsonl`, `e2e-probe/results-r1tip.jsonl`
- Probe logs and run copy: `e2e-probe-r2fix.log`, `e2e-probe-r1tip.log`, `e2e-probe/r1tip-run-bundle/`
- Scripts: `run-e2e-probe.sh`, `run-mutants.sh`, `gate-*.sh`
