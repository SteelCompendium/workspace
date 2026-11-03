# SC-545 r6 fix report

## Executive summary
- **DONE.** r5 MEDIUM-1, LOW-1, LOW-2 folded. Rebased onto dse `develop` **`ea78ebf8`** (SC-547) with no conflicts (`remountReused.ts` keeps `PassMemo`; `mount` is still public).
- Plugin HEAD **`09ece2eb`** (16 commits over `ea78ebf8`); superproject **`586c82ef`** (CHANGELOG only; pointer not bumped).
- Gates on `ea78ebf8`-based HEAD: tsc, `tsc -p e2e`, lint clean; jest **6415 passed / 1 skipped / 254 of 255 suites** (after shots; fresh 6415 passed with 1 skipped before shots because the CSS cache was already present; 6383 base + 32 SC-545 tests); lifecycle **50/50 = 21 + 16 + 8 + 4 + 1** (182, 322, 305, 296, 167 s; G-S61 ok first run, G-S63 last in part 3); e2e **128/128, 0 failed, 89/89**; shots 592, 0 FAIL, 161/966; freeze 280/280; parity 0/0/24.
- **Mutant K** (every note whose LP embed holds a DSE card is rebuilt): fails the new jest embed test (1 failed / 31 passed) and fails G-S63 (b) ("the fallback ran (1 setViewData(.., true) call(s))"; (b) observed raw fence in the embed while off: 0, so no rebuild allowed). Run on the 0698550f base; the code under test is unchanged by SC-547.
- G-S63 green x3 on the 0698550f-based HEAD (65 s each, (b) raw 0 / rebuilds 0 in all three) and once more on the `ea78ebf8`-based HEAD (69 s).
- Deviations: none. Drive-by fixes: none. Follow-ups: none new.

## Per finding
- **MEDIUM-1.** `visual-harness/obsidian-lifecycle.mjs` G-S63: `offOn` takes `whileOff` (called at the end of the 800 ms off dwell). Phase (b) samples `.internal-embed pre > code[class*="language-ds-"]` there; the one rebuild is allowed only if that count is > 0, otherwise `rebuilds` must be 0 (it reports which branch ran: "(b) raw fence in the embed while off: N (...)"). Jest `test/dom/framework/replugRemount.test.ts` (the embed twin of the callout case): an OWNED DSE card in an embed widget does not call `setViewData`; an unowned one does; nested and deferred ones do not.
- **LOW-1.** `.repo-docs/architecture.md` (the `host/replugRemount.ts` row) and the proposal: "seen on some toggles at SC-545 r4, not reproduced in the r5 re-review's 18 toggles, trigger not identified, and the embed's renderer does not listen to `post-processor-change`"; "(asserted)" is true again after MEDIUM-1.
- **LOW-2.** `src/framework/host/replugRemount.ts` `dispose()`: `writeStash` for every in-flight element, no `isConnected` condition (comment added). Jest: dispose after the container was detached still re-marks the element. Mutant 16 (condition restored) fails it.

## Mutants (r6), `sc545-r6-mut-*`
| # | Mutant | jest | G-S63 |
|---|---|---|---|
| 15 (K) | embed card always triggers the fallback | 1 fail (embed twin test) | FAIL (b) |
| 16 | `dispose()` re-marks only connected elements | 1 fail | - |

## Evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/`)
- Gates on `ea78ebf8`: `sc545-r6-gate-{tsc,lint,jest,jest-after-shots,lifecycle-part1..5,e2e,shots,freeze,parity}.log`; `sc545-r6-green-gs63-onea78ebf8.log`.
- On the 0698550f base (labelled): `sc545-r6-onbase-0698550f-{tsc,lint}.log`, `sc545-r6-onbase-0698550f-green-gs63-run{1,2,3}.log`, `sc545-r6-onbase-0698550f-mut-15-gs63.log`.
- Mutants: `sc545-r6-mut-15-jest.log`, `sc545-r6-mut-16-jest.log`.
- Proposal: `sc545-dse-verify-proposal.md` (base `ea78ebf8`, 32 tests, 6415, part times, wording).
- Report: this file.
- Temp dirs of my own FAIL runs were removed by explicit path.
