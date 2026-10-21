# SC-457 independent review brief — round 1

You are the independent reviewer for SC-457. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (the spec — rulings O1–O7): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/decisions.md`.
- Implementer brief + report: `…/sc457-fence-space-lang/sc457-brief-impl.md`, `…/sc457-fence-space-lang/sc457-impl-report.md` (read its executive summary first; dive into the body where you need to check a claim).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang`, dse checkout `…/draw-steel-elements`, branch `sc457-fence-space-lang`. HEAD and base shas: see the implementer report (base must be dse `develop` @ `c03db7a` — SC-456 landed; the worktree SUPERPROJECT branch must also be rebased on workspace `origin/main`; if the branch is not on it, that is a finding). Run `git -C <dse abs> fetch origin`; if `origin/develop` has moved past the branch base, say so (do NOT rebase — that is a fix-round job).
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the battery, devbox shapes, lifecycle conventions.
- **Workers never call the tracker.** Never work in `/home/scott/code/steelCompendium/workspace/` (shared main checkout; its dse dirt is Scott's live vault — expected, ignore). Every git command `git -C <absolute path>`. Do not commit, push, or leave probe files in the worktree (record `git status` before and after; they must match).

## 2. The task — execute and probe, not just read

Review the branch diff against the ledger rulings (quoted verbatim there; O1–O7). Specifically:

1. **O1/O3 completeness.** Independently grep every place that parses a fence line or compares a fence language (hosts, `listFences`, `locateByBody`, `locateUnterminatedTrailingFence`, SC-455 section-window locate, `getBlockInfo`, `blockKey`, sidebar `anchor.ts`/`registration.ts`, encounter view, authoring/suggest, `MarkdownPostProcessor` registration, anything under `src/`). Is there exactly one definition of language identity now? Any site still on `\S*` of the untrimmed rest?
2. **O2 fidelity.** Do the implementer's real-Obsidian measurements hold? Re-probe at least one variant yourself in real Obsidian (lifecycle harness or a throwaway scenario run with `--only=`, then removed), including a variant Obsidian does NOT render as the block (if any), and confirm DSE does not claim it.
3. **O5/O6 integrity probes (write-back into user files).** Run your own: content above/below survives; info string incl. leading whitespace survives byte-for-byte; spaced and unspaced twin blocks with the same body don't cross-talk (write to each, check the other); CRLF note stays CRLF; lone `\r` above (SC-460) still saves; hand-edited body survives a re-trigger; a deleted block yields the one Notice, not a write elsewhere.
4. **O4.** Verify the blockKey persistence claim yourself.
5. **G-S14.** Confirm it fails on base code (revert only the `src/` fix in a scratch copy, or check out base `src/` in a throwaway `git worktree add` at an absolute scratch path) and passes on HEAD. A test that passes on base is vacuous — HIGH.
6. **Scope.** (The superproject branch is being rewritten to a CHANGELOG-only commit in parallel — ignore its dse-verify SKILL.md edits; review the dse diff `c03db7a..bf3a3b4` plus the CHANGELOG bullet.) Per O8 the only `e2e/driver/` change allowed is the `noteFences.ts` comment reword; `test/unit/e2eIntegrity.test.ts` must assert scanner type == product language UNCONDITIONALLY. No other e2e driver/spec edits. No freeze-baseline edits.
7. Re-run the full battery at HEAD (all required). Expected: tsc (incl. `-p e2e`) + lint clean · jest **5374 + the branch's new tests passed / 1 skipped / suites 231(+new) of 232(+new)** · lifecycle **29/29** · e2e **`85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`** · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a prescribed fix.

## 3. Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/draw-steel-elements -- bash -c 'cd … && <cmd>'`. Devbox eats `$?`/`$PIPESTATUS`; piping eats failures. Run gates via wrapper script FILES that log output and write exit codes to separate files.
- `rm -f main.js styles.css` in the plugin root before `npx jest`.
- Own `DSE_LIFECYCLE_PORT` in 9400–9499 (e.g. 9457).
- **Scratch:** ONLY `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r1-<yourAgentId>/`, uniquely named scripts/logs (`sc457-r1-jest.sh` …). Never a generic name at the scratchpad top level.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc457-fence-space-lang/` (or your own scratch path).
- Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir. Delete only paths you created and recorded.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; run gates in the FOREGROUND (Bash timeout up to 600000 ms). Never background a gate and wait for a notification — it will not come.
- If the report-file write is blocked by your harness, return the report inline.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/sc457-review-r1-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, head sha reviewed, counts by severity, gate numbers).

## 5. Return contract

Final text: raw facts — verdict, sha reviewed, findings list (severity, file:line, one line each), measured gate numbers, report path, absolute paths of every evidence artifact. You cannot `SendMessage` me (depth-2 cannot reach its parent; `to: 'main'` goes to the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-457:`.
