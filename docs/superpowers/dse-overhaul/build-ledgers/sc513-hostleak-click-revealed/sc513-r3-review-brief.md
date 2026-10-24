# SC-513 r3 — independent review brief (orchestration:reviewer)

## 1. Context loading
- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/decisions.md` (task, rulings), the r1 survey report `sc513-r1-survey-report.md` (exec summary + §1, §3), and the r2 implementation report `sc513-r2-impl-report.md` (exec summary first) in the same dir.
- You did not write any of this code. Review the dse branch `sc513-hostleak-click-revealed` in `/home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed/draw-steel-elements`, range `c558759..HEAD` (base moved f89f69f → 08c086c → c558759 as SC-510 and SC-502 landed) (r2's head sha is in its report; confirm `git -C <dse> log --oneline c558759..HEAD`). If origin/develop has moved, say so; review on the branch as-is.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read-only; "Button host-leak sweep" bullet ~line 197, CURRENT ~line 1231).
- **Workers never call the tracker** (Linear). Every git command is `git -C <absolute path> …`; never `cd` in a compound command. Do not commit to the branch; any probe edit is reverted before you finish (`git -C <dse> checkout -- <file>`), and the branch must end clean at r2's head.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, never touch it.

## 2. The task — execute and probe, not just read
Rulings to check the code against (verbatim from the ledger):
- "Mount by REAL click (dispatch through the page, not by calling internals), in the sweep's own load only. Captures never perform these clicks, so zero shots/frozen bytes move. If a photographed-state change is unavoidable, it needs a widening file and Scott's sanction (owner asks)."
- "Every mount asserts it produced the expected controls (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared."
- "D (popover): option (b). … OUT of scope for SC-513: do not add `staminaRecoveryPopover` to the sweep prefs, do not click the pips. Not an exemption — the mount is simply not added here; the dse-verify text names SC-526 as the open gap."
- "Pref route: ACCEPT `rollingEnabled:true` in the button, input and checkbox sweep URLs only."
- "Probe hero: ACCEPT gate-only `probeSource('hero','probe-inline-abilities')` (not in FIXTURES, no shot)."
- "Gallery-section clicks: B clicks ONLY the appended `[data-dse-harness-extra=…]` sections."
- "Prose sweep coverage of C's body: FOLD into r2 … measure and report the prose line."

Probe at least:
1. Re-run `npm run shots` on r2's head; confirm the host-leak lines (button kinds/comparisons/boundary kinds, modal, input, checkbox, prose) match r2's report, and sha256 all 592 PNGs against the base list `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r1-k7q2/shots-base-f89f69f.sha256`. Run the freeze check (dse-verify) — expect 280/280.
2. **The mounts are not vacuous:** a leak probe — inject a host-CSS-sensitive break that affects ONLY a click-mounted control (e.g. temporarily strip one mounted kind's re-grounding rule, or make a result-card button pick up host height) and show the sweep turns red naming that kind, and that it is green on the base for the same reason the base never saw it. Plus one "mount produces nothing" probe of your choosing that r2 did not run.
3. **No capture sends** `galleryExtra` sections or `rollingEnabled` (read every capture URL builder; grep).
4. Every boundary record that is new vs base is legitimate (disabled at authored values), and no existing kind's first node moved (compare the sweep's tagged first nodes base vs branch if the log or a quick dump shows them).
5. The tests r2 added actually fail when the thing they guard is broken (break, run the single jest file, revert).
6. Code quality: real clicks only (no `el.click()` via evaluate if it bypasses the page? — judge: Playwright `locator.click()` is the standard; an `evaluate(() => el.click())` is acceptable only if r2 justifies it), robust waits (no fixed sleeps where a condition wait exists), named failure strings, comments citing SC-513 and the SC-526 gap.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT.

## 3. Run rules
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed/draw-steel-elements -- bash <script file>`.
- Private scratch subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r3-rev-<random suffix>/`; uniquely named scripts/logs; write scripts with the Write tool; exit codes recorded inside the script file; never pipe a gate into `tail`.
- Shots runs take 456–897 s under load, past the 600 s tool limit: launch the script with `run_in_background: true`, have it write `$$` to a unique pid file, then poll in FOREGROUND calls `while kill -0 <pid> 2>/dev/null; do sleep 15; done; echo EXITED` (timeout 590000), repeated; then read the rc file and log. Never wait for a completion notification. Other gates: one blocking foreground call each.
- Never key a wait-loop on a scratch filename or its contents (the scratch dir is pre-populated across sessions). No `rm` with a variable target, no glob `rm`, never `rm -rf` under `.superpowers/` or a `/tmp` glob. Never `pkill`/`killall` by pattern; kill only by PID whose `readlink /proc/<pid>/cwd` is in your worktree. Redirect long output to files.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/sc513-r3-review-report.md`, opening with a ≤10-line executive summary (verdict, finding counts by severity, measured lines, PNG identity, probe rcs). If the write is blocked, return it inline.

## 5. Return contract
Final text goes to the ticket-owner: raw facts — verdict, shas, numbers, findings with file:line — plus the path of every evidence artifact. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question; you cannot SendMessage me (`to: 'main'` reaches the dispatcher, not me). If you ever do send one, its FIRST WORD must be `SC-513:`.

## Addendum (owner, after r2)
- r2 head is `324a68d` on `c558759`. r2's evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-x7q4/`.
- Specific question: the dice-pinning ruling was "FOLD only if an existing sweep-only seam (e.g. `fixedDice`) pins these rolls with no capture change; otherwise leave unpinned and say so." r2 instead overrides `Math.random = () => 0.5` in the sweep's load. Judge: is that sweep-only and harmless (does anything else on the page depend on Math.random — ids, shuffles — such that the pin could hide a kind or change a first node)? Does an existing seam (`fixedDice` or similar) exist that would serve? Prescribe keep, switch to the seam, or drop.
