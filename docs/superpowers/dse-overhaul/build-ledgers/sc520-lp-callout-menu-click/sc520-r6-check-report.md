VERDICT: LAND — dse `7bd8040b` on `91e03844` (harness-only scenario move), read-only check, no gates run.

1. Diff scope / purity: `git diff --stat 91e03844 7bd8040b` = `visual-harness/obsidian-lifecycle.mjs` only (185+/184-). Extracted every SCENARIOS object from both revisions (`cmp.py`): all 52 blocks byte-identical (G-S49, G-S56, G-S59 strictly equal incl. trailing `},`); text before the array differs by exactly one added header line (line 88: "G-S49 sits after G-S59 and BEFORE G-S56 in SCENARIOS order: G-S56 detaches and replaces every other leaf, so it stays last."); text after the array identical.
2. Order: tail `… G-S61 G-S59 G-S56 G-S49` -> `… G-S61 G-S59 G-S49 G-S56`; 52 ids, same set, every other id in the same relative order. No stale "after G-S56" text left in the header.
3. Implementer logs (`sc520-r6-w4k9/`): `gate-lc5.log` G-S59 ok, G-S49 ok, `done: 2/2 ok, 0 failed`; `gate-lc4.log` G-S57, G-S62, G-S61, G-S56 ok, `done: 4/4 ok, 0 failed`; `gate-lint.log` `lint rc=0`.
4. `sc520-dse-verify-proposal.md` now says "G-S49 sits after G-S59 and before G-S56 in SCENARIOS order (G-S56 stays last …), so part 5 `--only=G-S59,G-S49` runs G-S59 then G-S49"; part 4 still `G-S57 G-S62 G-S61 G-S56` (G-S56 last). Accurate.

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r6-check-m3p8/` (`old.mjs`, `new.mjs`, `cmp.py`, `cmp.txt`). Branch untouched.
