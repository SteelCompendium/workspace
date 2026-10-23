# SC-487 scoped re-review brief — r2 delta

You reviewed `2bf8541` in round 1 (`sc487-review-r1-report.md`). Now review ONLY the r2 delta. Same command rules, scratch discipline and return contract as `sc487-brief-review-r1.md`; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r2/`. Never call Linear. Do not modify the branch.

Read: the newest `decisions.md` entries (review r1 rulings — the spec for this round) and `sc487-impl-r2-report.md` (summary, range-diff, gate numbers).

Check:
1. **Rebase integrity.** `git range-diff d152ea4..2bf8541 2c61511..<new head>` — the r1 commits are `=` or differ only by the ruled fixes; nothing from SC-497 or SC-478 is reverted or altered. Superproject: CHANGELOG/dse-verify edits on current origin/main, nothing else changed.
2. **MEDIUM-1 fix.** The new `fenceLanguage` matches Obsidian's `[\w\/+#-]*` capture for every opener you measured in r1 (the 17 + the 5 controls + the core table), keeps every SC-457 row's value, returns `''` for whitespace-only and zero-width-only tokens, and never claims an opener neither mode renders. Re-run your LP pin probe on a sample (at least U+200E, `.x`, `é`, `(x)`) on the new head in real Obsidian 1.15.0 or 1.14.4: anchored, panel mounted, write lands, opener bytes kept.
3. **LOW-1 fix.** The Notice text shows invisible chars as `U+XXXX`; plain names unchanged.
4. Re-run tsc, lint, jest, lifecycle and e2e at the new head; read shots / freeze / parity from the implementer's r2 logs (they must show shots running to the end: `host-copy pin OK (… 1.15.0 …)`, both host-leak lines, both text-scale lines, rc 0).

Expected: jest 5816 (5797 + 19) + new rows / 1 skipped (your clone shows the 2 doc-sync skips as before) · lifecycle 34/34 (incl. SC-478 G-S18 and G-S33) · e2e 104/104, 69/69 · shots 592 0 FAIL rc 0 · freeze 280/280 · parity 0/0/24.

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-rereview-r2-report.md`, ≤10-line executive summary first, verdict LAND-READY / FIX-FIRST, findings by severity with file:line and prescribed fix.
