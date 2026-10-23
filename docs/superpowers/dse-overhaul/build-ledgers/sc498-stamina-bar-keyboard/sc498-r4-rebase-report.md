# SC-498 r4 rebase report

## Executive summary
- STATUS: DONE. dse `b624eef` = the 7 SC-498 commits rebased onto origin/develop `c98bd82` (SC-495). No conflicts (git auto-merged styles-source.css and kit-index.test.ts; the shared ring rule still lists `.dse-stamina--clickable[tabindex]:focus-visible`, print removal intact). No package.json change.
- Superproject `e3e1fd6`, ONE commit on origin/main `1add69e`, touching CHANGELOG.md only (`show --stat`: `CHANGELOG.md | 6 ++++++`, 1 file changed). The dse-verify SKILL.md change is dropped. Pointer not bumped (HEAD records `c98bd82`), `git diff --cached` empty before and after, nothing pushed; ` M draw-steel-elements` is the only dirt.
- Method for the superproject: `git reset --hard origin/main` on the branch (submodule content untouched), re-added the bullet at the top of `## Unreleased`, `git add CHANGELOG.md`, checked `diff --cached --stat`, committed. All existing Unreleased bullets kept.
- Gates on `b624eef`: tsc rc 0, lint rc 0; jest 5889 passed / 1 skipped / 241 of 242; lifecycle 35/35; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79 pairs; shots 592 / 0 FAIL, in-run lines present; freeze 280/280; parity 0/0/24. All match expected.

## Gate lines
- jest: `Test Suites: 1 skipped, 241 passed, 241 of 242 total; Tests: 1 skipped, 5889 passed, 5890 total`.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 35/35 ok, 0 failed`, rc 0.
- e2e: `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`, rc 0.
- shots: rc 0 (nohup/setsid script, polled), 592 PNGs, 0 FAIL; host-copy pin OK (1.15.0); button host-leak OK 113 kinds / 678; modal button host-leak OK 10 scenarios / 38 kinds / 228; text scale OK 1626; text scale once OK 107256 over 214 loads; expected `OBSIDIAN APP.CSS PIN DRIFT` warning.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`. parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`

dse series: `dc9f39d 9278dec 89e6446 76dfc86 bf0dcc9 260ee14 b624eef` on `c98bd82`.
Logs/rc: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-impl-r4/

## Drive-by fixes:
None.
## Follow-ups:
None. Note for the dispatcher: dse-verify's lifecycle row (34/34 -> 35/35 with G-S36) is no longer in this branch; apply at landing.
