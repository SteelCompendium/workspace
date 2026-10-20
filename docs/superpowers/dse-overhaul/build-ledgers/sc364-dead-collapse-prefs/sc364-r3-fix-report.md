# SC-364 r3 fix round — report

**Executive summary**
- STATUS: DONE. Head 7ff6068 (on a22300d), comment-only, not pushed.
- L1: theme.ts WeakMap precedent now cites framework/view.ts AFTER_RENDER; prefs.ts drops the ComponentWrapper clause, keeps themeServiceByApp.
- L2: makeDeps comments in kit-lifecycle, stamina-bar and skills tests now name readCollapsePref (pipeline.ts) and its fallback-to-catalog-defaults when the descriptors are unregistered.
- I2: collapsedKey.ts and pipeline.ts comments now say ds-stamina AND ds-skills own the keys and are chrome-bearing since SC-255 (verified: skills/definition.ts has chrome: skillsChrome + collapseKeysOwnedByModel: true).
- Beyond the findings (same stale claim, same class): registry.ts:151 "(once it opts into chrome) ds-skills" -> "ds-skills (chrome-bearing since SC-255)".
- Gates: tsc (incl. -p e2e) clean; lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites (unchanged). I1 dropped per ruling (no test renames).

Files: src/framework/{seams/theme.ts,seams/prefs.ts,chrome/collapsedKey.ts,pipeline.ts,registry.ts}, test/dom/{elements/skills,elements/stamina-bar,framework/kit-lifecycle}.test.ts.
Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r3-fix-b91c/sc364-r3-{tsc,lint,jest}.log; diffstat /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r3-fix-b91c/sc364-r3-diffstat.txt.

Drive-by fixes: registry.ts:151 comment (above).
Follow-ups: none.
