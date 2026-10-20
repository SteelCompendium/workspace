# SC-364 r5 fix round — report

**Executive summary**
- STATUS: DONE. Head 188755b (on 7ff6068), comment-only, not pushed.
- R4-L1: removed the "(chrome-bearing since SC-255)" parenthetical entirely from collapsedKey.ts, pipeline.ts and registry.ts (per ruling; no replacement date).
- R4-L2: collapsedKey.ts "~30 elements that have not opted in" -> "the elements that have not opted in, e.g. `ds-hr`".
- Also re-wrapped the pipeline.ts comment lines the removal left short (same sentence, no content change).
- R4-I1 left alone per ruling.
- Gates: tsc (incl. -p e2e) clean; lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites.
Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r5-fix-c42e/sc364-r5-{tsc,lint,jest}.log; diffstat /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r5-fix-c42e/sc364-r5-diffstat.txt.
Drive-by fixes: none. Follow-ups: none.
