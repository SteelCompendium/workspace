# SC-127 round 12: scoped re-review of the r11 plumbing delta (dse 3c2ca0b on 5329c56, superproject 89ef816)

**Executive summary**
1. **Verdict: APPROVE.** L1, L2 and L3 are all closed (y / y / y), each proven with my own can-fail probes.
2. **Bytes moved by r11: 0.**
   - All 131 twin hashes from my clean sweep equal `sc127-rebaseline.txt` byte for byte (`cmp`).
   - All 131 realprint hashes equal the shared 262-line baseline (0 differ).
   - All 544 PNG hashes are identical to my r10 sweep (0 lines changed).
   - Scratch-applying the rebaseline gives `freeze OK (262/262)`.
3. **Battery** (at 3c2ca0b):

   | Gate | Result |
   |---|---|
   | tsc, lint | clean |
   | jest | 4253 passed / 1 skipped / 214 of 215 on a clean full run. The first full run had 1 red in `sidebarEncounterHandoff` (the known SC-153 load flake, outside SC-127's diff); see I-1. |
   | shots | 544, 0 FAIL; every in-run gate OK (19 OK lines, incl. `SC-127 light island OK`, `print-twin delta OK (135 …)`, `modal text-scale anchoring OK`) |
   | freeze | 131 twin FAILED / 0 realprint / 0 missing, the sanctioned set |
   | parity | 0 / 0 / 24 DECLARED, exit 0 |

4. **Hygiene:** no AI trailers in `79d43eb`, `3c2ca0b` or `89ef816`. `89ef816` (parent `17e1291`) bumps only the gitlink, to `3c2ca0b`. Both trees are clean, with status identical before and after.

## Per item
- **L1 (closed).** I put a deliberate `throw` at the top of `assertSc127LightIslandPinned` and ran a full sweep (`r12/sc127-r12-canfail-L1-throw.log`).
  - `host-copy pin OK`, then `SC-127 LIGHT ISLAND GUARD FAILED (exception inside assertSc127LightIslandPinned): Error: sc127-r12 L1 probe…`, exit 1.
  - 0 occurrences of `FAIL sweep (exception)`.
  - The later gates (button, input, table, list, inline, checkbox, prose host-leak; modal anchoring; print-twin delta) do **not** run. The message does not say they were skipped. That is acceptable, because the run is red and names its cause.
  - `process.exit(1)` bypasses the outer `finally` (`browser.close()`), which is harmless since the process exits.
- **L2 (closed).** A jest test pins `generateLightIsland`'s return key list.
  - Dropping `lightDefault` → 1 of 26 red, naming the test.
  - Refactoring the return into `const result = {…}; return result;` without `lightDefault` → also red; the test cannot find the statement, so it fails safe rather than passing vacuously.
- **L3 (closed).** The extra test now derives its set from the sheet: tokens redeclared with differing literals under `.theme-dark` / `.theme-light`, with a floor of more than 20.
  - Deleting `--color-base-30` from both the block and the manifest → 1 of 26 red, `["--color-base-30"]`.
  - Without `dist/obsidian-app.css` → honest skip (1 skipped / 25 passed, with a printed reason).
  - Inherent limit, stated in the test's own comment: deleting a mapping-only token (`--text-normal`) from both files stays green 26/26, because a textual check cannot see mapping chains. The in-run guard is the enforced check and it catches that case (r10 can-fail).
- All probe mutations were restored and verified with `cmp`. The `dist/obsidian-app.css` checksum is intact.

## INFO
- **I-1: `sidebarEncounterHandoff.test.ts` flakes on this host.** Results: 1 red in the first full run, 1 red in the first isolated rerun, then 5 isolated reruns green and a second full run green. SC-127 touches no `src/` and not this test (`git diff 9ded832..HEAD -- src test/dom` shows only `theme-print.test.ts`). It matches the r7 note that it is a pre-existing load-sensitive test (load 7.5–10 at the time).
- **I-2: both remotes have moved since this tree's bases.** `origin/develop` is `8a256c5` (branch base `9ded832`) and superproject `origin/main` is `a65a429` (base `49d6aef`). The landing rebase round must re-sweep and re-confirm the 131 twin hashes, because develop changes can move twin bytes independently of SC-127.
- **I-3: installed Obsidian is now 1.14.4.** `host-copy pin OK` reports the host model is verbatim 1.14.4. The island's pin remains 1.13.7, as noted in r10 I-2.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r12/`)
Logs:
- `sc127-r12-{tsc,lint,jest,jest-full2,jest-flake-rerun,jest-flake-5x,parity,freeze}.log`
- `sc127-r12-shots-sweep.log`

Hashes and diffs:
- `sc127-r12-sweep-all.sha256`, `sc127-r12-rebaseline-from-sweep.txt`, `sc127-r12-vs-r10-allpng.diff` (empty)

Can-fail logs:
- `sc127-r12-canfail-L1-throw.log`
- `sc127-r12-canfail-jest-{L2-noreturn-lightDefault,L2-alt-return-shape-without-lightDefault,L3-both-del--color-base-30,L3-both-del--text-normal,clean}.log`
- `sc127-r12-jest-L3-no-pinned-sheet.log`

Scripts: `runjest12.sh`, `runL1.sh`
