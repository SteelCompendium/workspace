# SC-470 r5 — scoped re-review of the r4 delta (reviewer)

You reviewed SC-470 in r3. Now review ONLY the r4 fix delta. Final text goes to the ticket-owner. **Never call the tracker.**

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/decisions.md` ("Owner rulings on r3 findings").
- Your r3 report `sc470-r3-review-report.md`; the r4 report `sc470-r4-fix-report.md` (exec summary first), same dir.
- dse worktree `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements`, head `1c271b5` on develop `0ce76dd`. The fix delta is the commits after the rebased r2 work (commits `737a099` + `1c271b5`; the rebased r2 work below them was reviewed in r3); also confirm the rebase kept SC-326's G-S13 intact (`git diff 0ce76dd..1c271b5 -- visual-harness/obsidian-lifecycle.mjs` shows only SC-470 hunks). **Do not commit.** Revert any temporary mutation; `git status --porcelain` clean at the end.

## Task — execute and probe
1. Each finding (HIGH-1, MEDIUM-1, MEDIUM-2, LOW-1, LOW-2) fixed as ruled? Re-run your r3 probe (`sc470-r3-probe.mjs.txt`, `sc470-r3-run.sh`) on the new build: embed height during a pin; floor raises when Obsidian grows the sizer and never lowers on collapse (and never sits below scrollTop+clientHeight); popout closed while pinned leaves no Map entry/timer; no MutationObserver loop (count observer callbacks per pin); set/clear/update cost ms.
2. New risks from the observer: leaks after release/`releaseAll`/plugin disable; behaviour when the sizer is replaced mid-pin; the floor can't grow unbounded from its own writes.
3. Gates you re-run: `--only=G-S8,G-S15` 2/2; discrimination with the `<style>` append disabled → both FAIL 2/2; full lifecycle **30/30**; jest (state the count); e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`. Freeze/parity: re-run if r4 changed CSS; otherwise cite r4's numbers.
Findings by severity with file:line, failure scenario, prescribed fix. Verdict APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES.

## Footguns
Private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r3-a4497bfa86ebad2da/` (yours from r3). `devbox run -c <dse abs> -- …` or wrapper script files; never `cd` in a compound command; `git -C <abs>`. No glob `rm`; exact paths only; never `rm -rf` under `.superpowers/`. Kill only PIDs whose command line contains `worktrees/sc470-scroll-pin-panes/`. Own `DSE_LIFECYCLE_PORT` (9372); never Xvfb `:1`. Exit codes to per-run files, output to logs. Foreground every gate; if forced to background, wait on its PID in a foreground `while kill -0` loop. Never key a wait on a scratch filename. You cannot `SendMessage` me — `STATUS: NEEDS_CONTEXT` if blocked. If the report write is blocked, return it inline.

## Output
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r5-rereview-report.md` (≤10-line exec summary first; evidence prefixed `sc470-r5-`). Final text: verdict, findings (severity, file:line, one line each), measured gate lines, tree state, absolute paths of all artifacts.
