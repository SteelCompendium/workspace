# SC-364 round 2 — independent review brief

## 1. Context loading
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc364-dead-collapse-prefs/sc364-decisions.md (scope = ticket description quoted there, verbatim).
- Implementer report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc364-dead-collapse-prefs/sc364-r1-impl-report.md (read its executive summary; treat every claim as unverified).
- Worktree: /home/scott/code/steelCompendium/worktrees/sc364-dead-collapse-prefs/draw-steel-elements, branch `sc364-dead-collapse-prefs`, head `a22300d`, base dse develop `71ac43a`. Review `git -C <plugin path> diff 71ac43a..HEAD`.
- `git -C <absolute path>` for every git command. You make NO commits and NO edits to tracked files — review only. Never call Linear.
- The main checkout's dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault — expected, ignore it.

## 2. Task — execute and probe, don't just read
The change claims to be pure dead-code deletion. Prove or disprove:
1. Independently grep the whole plugin (src/, test/, e2e/, scripts/, .repo-docs/, docs, any build/bundle config) at HEAD for `resolveCollapsePrefs`, `declaredCollapsePrefs`, and anything the deleted code exported. Also check at base 71ac43a that no runtime path read the channel (including indirect: re-exports, dynamic property access, the `ds-skills`/`ds-stamina` paths, `collapsedKey.ts` `extractCollapseKeys`).
2. Collapse-pref behaviour unchanged: verify the runtime collapse-key path (declared vs undeclared collapse keys, user overrides) is tested and still green; if coverage of "declared key from raw keys" is thin, write a throwaway probe test in your private scratch (NOT committed) or run the relevant existing suites and report.
3. Every deleted/rewritten test: was it exercising only the deleted code? Was any assertion about live behaviour lost? Itemise.
4. Docs: `.repo-docs/architecture.md` and any other doc now describe the real mechanism accurately (no lingering reference to the channel).
5. Re-run gates yourself: tsc (incl. `tsc -p e2e`), lint, jest, and lifecycle (`npm run obsidian-lifecycle`) per the dse-verify skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md). Spot-check freeze if the implementer's shots/freeze evidence looks incomplete. Expected: tsc/lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites minus exactly the itemised deleted tests; lifecycle 27/27; (implementer's) e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 pairs; shots 572, 0 FAIL; freeze 276/276 with no rebaseline; parity 0 GAPs / 0 undeclared / 24 DECLARED.

Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## Footguns (all apply)
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r2-review-<random suffix>/`, unique script/log names inside. Never a generic name at the scratchpad root.
- Devbox: `devbox run -c <dir> -- bash -c 'cd <dir> && <cmd>'`; its sh wrapper eats `$?`/`$PIPESTATUS`; `| tail` eats failures — gate via wrapper script FILES that capture the exit code, output to a log file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match.
- Redirect long-running output to a file; the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; never background one and wait for a notification.
- Never `pkill`/`killall` by pattern — kill only a PID whose command line contains `worktrees/sc364-dead-collapse-prefs/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. Need input → end with STATUS: NEEDS_CONTEXT. Any message you send anyway starts with `SC-364:`.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc364-dead-collapse-prefs/sc364-r2-review-report.md — opens with a ≤10-line executive summary (verdict LAND-READY / FIX-ROUND, finding counts by severity, gate numbers you measured).

## 4. Return contract
Final text goes to the ticket-owner, not a human: verdict, findings (severity, file:line, one-line fix), measured gate numbers, absolute paths of the report and every log. No prose.
