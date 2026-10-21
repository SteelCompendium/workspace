# SC-457 scoped re-review r4 — after fix round 3

Same rules, footguns and return contract as `sc457-brief-rereview.md` (same dir). Scratch: `sc457-r4-<yourAgentId>/`. Report: `sc457-rereview-r4-report.md` (≤10-line exec summary first). Ledger section "Re-review r3" has the rulings.

Scope: the fix-round-3 delta only (`git range-diff 0ce76dd..690c783 1c271b5..<new head>`; dse must sit on `1c271b5` (or newer) with G-S13, G-S14 and G-S15 all intact (G-S13/G-S15 byte-identical to origin/develop)).

1. MEDIUM-1: `fenceLanguage` takes the first space/tab-delimited word, then trims its end; e2e `typeOf` same. Re-run your `probe-head3/pin2.json` pin-to-sidebar probe and `probe-head2/write2.json` in real Obsidian: ```` ```ds-counter  x ```` and ```` ```ds-counter　 extra ```` anchor, mount the panel and land the write like develop does. Spot-check that every r3-verified opener still saves (the `write.json` set).
2. The e2eIntegrity open-line table now has an EXPECTED-language column and every parse is asserted EQUAL to it (not only to each other). Try to break it: think of an opener Obsidian renders as the block where the expected value would be wrong, and probe it.
3. Pin-path jest test exists and would fail on `690c783` (check it).
4. Battery: tsc (incl. `-p e2e`), lint, jest, lifecycle, e2e yourself; shots/freeze/parity from the implementer's run8 logs. Expected: jest 5428 + branch tests / 1 skipped / 232 of 233 · lifecycle 31/31 · e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` · shots 572 / 0 FAIL · freeze 276/276 · parity 0/0/24. Report if either base moved (do not rebase).
