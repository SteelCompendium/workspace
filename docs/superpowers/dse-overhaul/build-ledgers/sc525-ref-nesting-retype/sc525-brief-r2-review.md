# SC-525 round 2 — independent adversarial review

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-decisions.md` (current state).
- The implementer's report: `…/sc525-ref-nesting-retype/sc525-r1-impl-report.md` and its `sc525-r1-*` artifacts in the same dir. Treat its claims as unverified.
- Bug origin: SC-510 review INFO-1 in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r2-review-report.md` (~line 49), with its probe kit in that dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements`, branch `sc525-ref-nesting-retype`, base `develop` @ `4deb8cf`. Review the diff `git -C <that path> diff 4deb8cf..HEAD`. Do NOT commit to the branch; probes go in scratch copies or are reverted (`git -C <path> stash`/restore only your own edits, and leave the tree exactly as you found it — verify with `git status` at the end).
- **You never call the tracker (Linear).**

## 2. Task — execute and probe, do not just read
The fix decision (ledger, verbatim): "`IN_FLIGHT_REFS` becomes a Map from guard key to owning view; refuse only when the owner is a different view that has not unloaded; delete in `finally` only if this view is still the owner; public `isUnloaded()` on ElementView reading its `unloaded` flag (NOT `_loaded` — that broke the `displayCardHybrid` depth-guard test)."

Probe at least:
1. The bug is gone: held lookup + same-ref retype in the form preview (feature and statblock), while held and after release — and the CURRENT preview ends showing the resolved card (not blank, not stale). Also a three-mount sequence (A pending, B pending, C) and out-of-order release.
2. The guard still works: genuine cycles (A→B→A, self-reference, longer chains) in one live block still show the nesting error; can the new "owner unloaded" escape hatch be hit by a real cycle (e.g. a nested child view whose parent was unloaded mid-resolution — what happens, and is it harmful: infinite recursion, leak)?
3. Same-view re-entrance: can one view instance resolve the same guard key twice (re-render / onload twice) and now bypass the guard where it previously refused? Is that safe?
4. Leaks: does any path leave a Map entry behind forever (owner unloaded and never finishes; promise rejection; synchronous throw before `finally`)? Does a lingering entry block a future legitimate mount?
5. Real cards outside the form: Reading view / sidebar card that re-renders with a stable blockKey — any behaviour change? Stay out of SC-481 (block save / identical blocks redraw) and SC-522 (Live Preview scroll hold) code, but report if the change could affect them.
6. Test quality: are the new tests vacuous? Re-run the implementer's mutation checks yourself, and try one of your own.
7. Re-run the gates yourself: tsc, lint, jest (one run), and the e2e + one lifecycle half at minimum; compare to the implementer's numbers. Expected CURRENT at `4deb8cf`: jest 6153 passed / 1 skipped / 248 of 249 suites (plus new tests), lifecycle 41/41 (halves 20+21), e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, shots 592 0 FAIL, freeze 280/280, parity 0 GAPs / 0 undeclared / 24 DECLARED. Command shapes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
8. Eyeball the implementer's base/head screenshots and say whether they show what the report claims.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-r2-review-report.md`; logs as `sc525-r2-*` in that dir. Opens with a ≤10-line executive summary: verdict (LAND-READY / FIX-ROUND), finding counts by severity. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 4. Return contract
Final text goes to the ticket-owner, not a human: verdict, findings list (severity, file:line, one line each), measured gate numbers, no prose, plus the absolute path of every artifact.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches exist. Read the process's own output or write to a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- Every gate is ONE blocking foreground Bash call — no `run_in_background`, no Monitor, no `&`.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements -- bash <script-file>`; never a compound `cd X && …`; every git command is `git -C <absolute path>`; record exit codes from inside a script file.
- Never `rm` with a shell-variable or glob target; never `rm -rf` a shared `/tmp` glob or anything in `.superpowers/` you did not create.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line or `/proc/<pid>/cwd` is inside this worktree.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc525-r2-review/`, uniquely named files, created with the Write tool.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts with `SC-525:`.

## Addendum (owner, after r1 returned)
r1 is DONE at `af09bf2` (3 commits). The implementer flags one behaviour change, untested: "a view re-entering `resolveAndMount` while its own earlier resolution is still in flight (an `onUpdate` during a pending lookup) is no longer refused". Probe item 3 MUST answer this concretely: build the scenario (an `onUpdate` on a live card while its lookup is held), compare base vs head, and rule whether head is correct, harmful (double mount, stale overwrite, leaked entry, infinite recursion via a self-reference) or merely different. Prescribe a test either way.
Also note r1's head probe shows an EMPTY preview while the retyped lookup is held (base showed the error). Say whether empty-while-pending matches how the preview behaves for a first-time lookup on develop.
