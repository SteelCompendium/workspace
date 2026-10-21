# SC-457 scoped re-review r3 — after fix round 2

Same rules, footguns and return contract as `sc457-brief-rereview.md` (same dir) — read it. Scratch folder: `sc457-r3-<yourAgentId>/`. Report: `sc457-rereview-r3-report.md` (≤10-line exec summary first).

Scope: the fix-round-2 delta only. Ledger section "Re-review r2" has the rulings.

1. **Rebase.** dse on `0ce76dd` (or newer); `git range-diff aaa88b7..24b2703 <new base>..<new head>` shows only the HIGH-1 fix, its pins, the CHANGELOG reword, and the G-S13/G-S14 merge in `visual-harness/obsidian-lifecycle.mjs` (both scenarios intact — check SC-326's G-S13 is byte-identical to `origin/develop`'s). Superproject: one commit, CHANGELOG only, on current `origin/main`.
2. **HIGH-1.** Re-run your r2 real-Obsidian probes (`write.json`/`race.json` set): ```` ```ds-counter  ````, ```` ```ds-counter　 ````, ```` ``` ds-counter  ```` all save; leading NBSP/U+3000/FF/VT still not claimed; one space/tab/callout still save. The three-way agreement pin (host parse, anchor parse, e2e `typeOf`) exists and covers your trailing cases; `scanFenceState` pin present. Probe "Pin to sidebar" on ```` ```ds-counter  ```` in real Obsidian.
3. **INFO-1 wording.** Neither CHANGELOG bullet claims the opening line is kept exactly; `info` behaviour unchanged.
4. Battery: tsc (incl. `-p e2e`), lint, jest, lifecycle, e2e yourself; shots/freeze/parity from the implementer's run6 logs (no rendering change expected — re-run if the delta touches rendering). Expected: jest 5408 + branch tests / 1 skipped / 232 of 233 · lifecycle **30/30** · e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` · shots 572 / 0 FAIL · freeze 276/276 · parity 0/0/24. If `origin/develop` moved again, report it (do not rebase).
