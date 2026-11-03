# SC-552 r4 report (dse 3871e673 on ea78ebf8; superproject b166e60b)

## Executive summary
- Rebased onto ea78ebf8 (= origin/develop). One textual conflict (twin-reuse.test.ts: SC-547's block and ours both append at the end; kept both); src/remountReused.ts and the PassMemo untouched; ReadingModeBlockHost.ts merged without conflict.
- MEDIUM-1 fixed: FormModal `closed` flag set in close(), keepOpenOn returns early. Jest case red before (1 failed), green after; G-S64 now asserts registry holders === 0 after every form Save and in new phase (t) (Cancel + outside edit); mutant "closed flag removed" FAILs (t) and (a)-(k) holder checks (1,2,3,4,5,5,6,7,8 left on the registry).
- LOW-1 CHANGELOG, LOW-2 comments (lineMap.ts, pinnedTarget), LOW-3 test (shownIn) done; reviewer mutant R3-M9 now red (1 test); R3-M11 equivalent (as reviewed). All other R3 mutants red.
- Gates on final HEAD: tsc/lint clean · jest 6428 passed / 1 skipped / 255 of 256 (+45 tests, +2 suites over 6383/1/253 of 254) · lifecycle 50/50 in five parts (183/323/278/297/175 s), G-S57, G-S61, G-S64 green · e2e 128/128 89/89 · styles.css byte-identical to ea78ebf8, so shots/freeze/parity not re-run.
- G-S64 on an ea78ebf8 bundle (sha256 fccdfc78...): red on (a)-(i),(k),(l),(n),(o),(p),(q); (m),(r),(s),(t) pass. G-S64 now has 19 phases (a)-(i),(k)-(t), ~40 s.
- Superproject pointer left alone (still 260763ab from c64edebc; stale after the rebase; dispatcher bumps at landing).

## Commits (old -> new)
3871e673 test(SC-552): G-S64 asserts the registry holds nothing for a closed for
f110be1b fix(SC-552): a form that already closed is never kept open - no holder 
26d5f5eb docs(SC-552): lifecycle header counts 50 scenarios and five parts
c2d92f56 test(SC-552): G-S64 (q) triggers a redraw instead of navigating away; (
58e11047 fix(SC-552): a form is kept open past its view only while its note is s
91308c50 docs(SC-552): architecture - the pinned position, the form that outlive
90feb96e test(SC-552): G-S64 (p) catches a Save that falls back to the twin; kee
a12e4dc8 test(SC-552): lifecycle G-S64 - the block edit form opened on one of se
1eba9814 fix(SC-549/SC-552): the first click of a round pins its card's block, a
3c9f86af fix(SC-552): a pinned form stays open when Obsidian throws its view awa
e2822e5a fix(SC-552): a block edit form pins its block when it opens and Save wr
3bf46a87 test(SC-552): red tests - a block edit form pins its block (lineMap, pi

Old (r2b, on 0698550f) -> new (on ea78ebf8): cee31d9d->3bf46a87 · 05fc1225->e2822e5a · f8c7f51e->3c9f86af · 63506958(dfb50595)->1eba9814 (wide pin, own commit) · 288ce292->a12e4dc8 · e3a5cf9e->90feb96e · 34c4f02e->91308c50 · f2b913be->58e11047 · 42b62158->c2d92f56 · 260763ab->26d5f5eb · new: f110be1b (MEDIUM-1 fix + LOW-2 comments + LOW-3 test) and 3871e673 (G-S64 holder checks, phase (t)). The red jest case for MEDIUM-1 is in sc552-r4-jest-red-medium1.log (1 failed, 129 passed) before the fix.
Evidence (this dir): sc552-r4-gate-*.log, sc552-r4-jest-r3-mutants.txt, sc552-r4-lc-mutant-M12-closed-flag-removed.log, sc552-r4-lc-G-S64-head-prerebase.log, sc552-dse-verify-proposal.md.
