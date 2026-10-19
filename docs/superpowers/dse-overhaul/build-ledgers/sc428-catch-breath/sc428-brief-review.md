# SC-428 independent review brief — round 1

## 1. Context
- Ledger (spec + rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/decisions.md`. Implementer report: `.../sc428-catch-breath/sc428-impl-r1-report.md` (read its exec summary; dive only as needed). **Workers never call the tracker.**
- Code: `/home/scott/code/steelCompendium/worktrees/sc428-catch-breath/draw-steel-elements`, branch `sc428-catch-breath`, head `138f23a`, base `origin/develop` `c78a06b`. Review `git -C <dse> diff c78a06b..<HEAD>`. Always `git -C <absolute path>`; never write under the main checkout except your report. Do not commit to the branch — you review, you do not fix.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. Task — adversarial review: execute and probe, don't just read
- Each of the four spec items actually fixed, on every surface: stamina-bar strip button, hero view strip button, Recoveries popover "Catch breath", stamina modal Spend Recovery. Probe the state matrix in jsdom (write throwaway probe tests outside the repo or in a scratch file you delete): full Stamina; 1 below full (heal is partial, button enabled); recovery value 0 (max ≤ 2) at full and below full; 0 Recoveries; dying (current ≤ 0); temp stamina present; current > max if the data allows it; winded. Confirm a disabled button can't be activated by click, Enter/Space, or the popover path, and that nothing is written.
- One source of truth for reason strings (owner ruling). Reasons are announced accessibly (title/aria), the disabled state is not conveyed by color alone (Scott is colorblind).
- Focus fix (item 4): reproduce the original loss on the base sha, confirm the fix at the root, and check it doesn't steal focus on re-renders the user didn't cause (external file edits, other blocks, the lifecycle adoption path).
- Flipped known-bug markers: each now a real passing test that fails on base (verify at least two yourself by running them against base src). No vacuous assertions.
- Re-run tsc, lint, jest, and `npm run e2e` yourself; spot-check lifecycle only if the diff touches render/adoption paths. Expected: jest ≥ 4787 passed / 1 skipped; e2e 65/73+ ok, 0 failed, 8 known-bug, coverage Y/Y.
- Footguns: devbox exit-code eating (wrapper script files, output to per-run unique files, foreground only, never `| tail` a gate); never pkill by pattern (PID only, cmdline contains `worktrees/sc428-catch-breath/`); never key a wait-loop on a scratch filename; never rm under `.superpowers/` outside `sc428-catch-breath/`. If the report-file write is blocked, return the report inline. You cannot SendMessage me; for input end with STATUS: NEEDS_CONTEXT; any stray message must start `SC-428:`.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/sc428-review-r1-report.md`, ≤10-line exec summary first. Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 4. Return contract
Final text to the ticket-owner: raw facts — verdict (LAND / FIX-FIRST), finding list one line each, measured gate lines, paths of every artifact.

## 5. Specific questions from the owner
- Implementer follow-up: "A hero whose max Stamina is unresolved now shows Catch Breath disabled with 'Already at maximum Stamina'." Assess: is that a regression vs base (was it enabled and functional before?), and what the correct reason/behavior is. Prescribe a fix if small.
- Focus fix: root cause claimed = `pipeline.ts armClickShield` preventDefaults pointerdown so focus can't move; fix = RecoveriesStrip focuses its slider row on click. Check the focus call doesn't scroll the page/steal focus unexpectedly (e.g. `preventScroll`), and works for the popover path.
- Superproject worktree has a CHANGELOG commit `0147822` — check the bullet's wording is user-facing and accurate.
- Name-first labels (`labelWithReason`) — consistent with SC-324's existing pattern, no duplicated composition.
