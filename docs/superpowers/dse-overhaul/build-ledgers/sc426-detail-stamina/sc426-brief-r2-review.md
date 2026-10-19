# SC-426 round 2 — independent adversarial review (orchestration:reviewer)

## 1. Context loading
- Read: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc426-detail-stamina/decisions.md
  (ledger, ticket spec verbatim), the round-1 brief sc426-brief-r1-implement.md and the implementer's
  report sc426-r1-implement-report.md (same dir).
- Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md
- Branch under review: `sc426-detail-stamina` in
  /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements , head 0d1c0cf,
  base origin/develop f8e050f. Review `git -C <path> diff f8e050f..0d1c0cf`.
- You did not author this code. Do NOT modify the branch (no commits). Scratch work goes in your own
  scratch dir or a throwaway copy, never committed. Use `git -C <absolute path>` for every git command.
- You never call the tracker (Linear).

## 2. The task — execute and probe, not just read
The fix: when stamina is edited from an initiative grid cell for the SELECTED creature, the detail row
(number, bar, state chip) must refresh too; for a non-selected creature the detail row must not change.
Probe:
- Does the detail row really update in a real render (jsdom test you write in scratch, and/or the e2e
  scenario, run it)? Number, bar width/fill, state chip (healthy -> winded -> dying thresholds), temp
  stamina if shown.
- Non-selected instance edit: detail row unchanged. Selection changes mid-modal (modal open on Orc #1,
  user selects Orc #2, then Apply) — what refreshes? Stale closure over the wrong elements?
- Minion/squad groups, multiple instances of one creature, hero vs monster rows, detail-row DOM rebuilt
  between open and Apply (view adoption / re-draw — SC-340): does the callback write into a detached
  element and leave the live one stale?
- Is the refresh reusing the existing detail-row path or a parallel one-off that will drift?
- Are the known-bug markers removed correctly (e2e B2/S1, jest two [E12]) and do the tests now FAIL
  without the fix? Prove it: revert only the src change in a scratch copy and run the converted tests.
- Re-run the gates yourself: tsc, lint, jest, e2e full run. (Lifecycle/shots/freeze/parity: re-run if
  the diff touches render/first paint; otherwise state why the implementer's numbers stand.)
  Expected: jest per implementer report; e2e `62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`
  unless the implementer added scenarios.
- CHANGELOG bullet: plain user language, accurate.

Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc426-detail-stamina/sc426-r2-review-report.md
opening with a <=10-line executive summary (verdict APPROVE / FIX-REQUIRED, finding counts, measured
gate numbers). If the write is blocked, return it inline.

## 4. Return contract
Final text to the ticket-owner: raw facts — verdict, findings list (severity + file:line one-liners),
measured numbers, report path, evidence artifact paths. No prose.

## Footguns
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match).
- Redirect long output to files; run gates in the FOREGROUND (timeout up to 600000 ms) — never
  background a gate and wait for a notification.
- Devbox: `devbox run -c <dse path> -- bash -c 'cd <abs> && <cmd> > <log> 2>&1; echo $? > <rc>'`;
  never pipe a gate into tail. `rm -f main.js styles.css` before jest.
- Kill only by PID whose cmdline contains `worktrees/sc426-detail-stamina/`; never pkill by pattern.
  Set DSE_LIFECYCLE_PORT (e.g. 9293) if you run lifecycle. Never --headed on :1.
- Never rm -rf .superpowers/.
- You cannot SendMessage me; end with STATUS: NEEDS_CONTEXT and the question if blocked. If you message
  anyway, first word `SC-426:`.

## Specific items from round 1 to judge
1. Deviation: the implementer guards the detail-row refresh with a DOM stamp (`data-detail-key`,
   `detailHandlesFor`) found at Apply time, not `group.selectedInstanceKey === instanceKey` as the
   ticket's fix direction says. Is that correct in every case (selection change mid-modal, re-draw /
   adoption between open and Apply, two trackers or pane+embed of the same note showing the same
   instance — could it find the WRONG tracker's detail row via a document-wide lookup?)
2. The e2e assertion was rewritten (`toHaveText` read '' because Steel hides that control). Confirm it
   is not vacuous: it must fail on base view.ts (implementer reports "60/60" received) and pass with fix.
3. The callback calls `updateStaminaDisplay` / `refreshRowStamina` without `group`. Wrong for any
   reachable case (minion captain? squads)? 
4. Implementer saw, in real Obsidian after a write, a second 0x0 initiative root outside
   `.markdown-reading-view` holding the OLD values. Check on base f8e050f (a scratch `git worktree add`
   at an absolute path under your scratchpad, NOT re-pointing anything) whether it exists there too.
   Report: pre-existing or branch-caused, and whether it looks like a leak (cite SC-340 lifecycle
   G-S6i "no leak" expectations). Bound this to ~20 minutes; a clear "pre-existing, here's the repro"
   is enough.
