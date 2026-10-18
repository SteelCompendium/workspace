# SC-390 R4b: scoped re-review of R3b (dse `sc390-companion-ref` @ 39cf35a on 0ecb90e)

## Executive summary
1. Verdict: **APPROVE**. Closed: MED-1, MED-2, LOW-1, LOW-2 and the docstring INFO. No new defects. 1 new INFO (landing).
2. MED-1 closed: the merge-base is 0ecb90e. `diff origin/develop...HEAD` covers only the 13 SC-390 files. `diff 0ecb90e HEAD -- package.json package-lock.json src/model/` is empty, so the pin stays 3.0.1 and no shim was resurrected. `StatblockConfig`/`FeatureblockConfig` contain no `feature_type` / `applyFeatureTypeDefaults`.
3. MED-2 closed: the whitespace case now replaces `ev: ""` and asserts there is no error card and that a head exists. M3 (drop `.trim()`, view.ts:180) goes RED (1 failed / 77).
4. LOW-1 closed. Probe: `0`, `"0"` -> "EV 0"; `3` -> "EV 3"; `"6"` -> "EV 6"; `null`, `~`, bare `ev:`, `""` and `"   "` -> omitted; absent -> "EV N/A". M5 (drop the null check) goes RED.
5. LOW-2 closed. Probe via the sticky parts, which share `statblockMetaCells`: `Sneak` -> "Sneak"; `[""]`, `["  "]`, `~`, `""` and absent -> no cell; `[Sneak, Hide]` -> "Sneak, Hide"; `[Sneak, "", " Hide "]` -> "Sneak, Hide". M6 (no scalar coercion) and M7 (no blank filter) each go RED. All mutants were reverted byte-clean (`git diff -- src` = 0 lines).
6. Battery on the committed tree (SDK 3.0.1, no tarball):
   - tsc and lint clean.
   - jest 4440 passed / 1 skipped / 219 of 220.
   - shots 572, 0 FAIL; host-copy pin OK; host-leak 112 / 672; print-twin 142.
   - freeze `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `statblock-roleless-corpus--steel-{print,realprint}.png`.
   - parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
7. Hashes: `rebaseline.txt` and `widening.txt` reproduce byte for byte. All 572 PNG hashes are identical to my R2b 3.1.0 run. Name diff 274 -> 276, 0 removed, 2 added, 0 duplicates. Only the 2 rebaseline names moved. The shared baseline was untouched (md5 3810d542…).
8. NEW INFO-1 (landing, not a defect): my `git fetch` shows dse `origin/develop` has moved again, 0ecb90e -> **be4f002**. It adds 6 SC-417 commits touching initiative/view.ts, MinionStaminaPoolModal.ts, docs/initiative-tracker.md, docs/running-an-encounter.md and a new test, with no file overlap with SC-390. The branch is not on the current tip, so the lander rebases or merges, then re-runs the battery. SC-417 may move initiative shots: check freeze on be4f002 alone first.
9. `git status` is clean at the end; HEAD is 39cf35a.

## Executed
- `npm ci` on the committed lock (3.0.1) -> `sc390-r4b-npmci.txt`.
- Mutations M3/M5/M6/M7 -> `sc390-r4b-mutations.txt`.
- Probe (a scratch test, deleted afterwards) -> `sc390-r4b-probe.txt`.
- `sc390-r4b-{tsc,lint,jest,shots,freeze,parity}.txt`.
- `sc390-r4b-allhash.txt`, `sc390-r4b-hashes.txt`, `sc390-r4b-namediff.txt`; `sc390-r4b-allhash-vs-r2b.txt` (empty, meaning identical).
