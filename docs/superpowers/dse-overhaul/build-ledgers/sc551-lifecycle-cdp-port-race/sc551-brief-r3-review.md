# SC-551 r3 — independent adversarial review of the CDP ownership fix (lifecycle + camera)

You are the SC-551 r3 reviewer. You did the r1 survey; you did NOT write this code (the implementer did, in r1 and
r2), so you review it independently. Your final text goes to the ticket-owner: raw facts, no prose, absolute
paths of every artifact.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/decisions.md`
  (rulings R1–R10 — judge the diff against them).
- Implementer reports (exec summaries first, then where needed): `sc551-r1-impl-report.md`,
  `sc551-r2-camera-report.md`, and `sc551-r1-dse-verify-proposal.md`, same dir.
- Code: `/home/scott/code/steelCompendium/worktrees/sc551-lifecycle-cdp-port-race/draw-steel-elements`, branch
  `sc551-lifecycle-cdp-port-race`, diff against `eafe76e1` (`git -C <plugin> diff eafe76e1`). The branch head sha
  is in the r2 report. You may run gates and probes IN that worktree now (the implementer has finished) but make
  no commits; any temporary probe edit is reverted before you finish (`git -C <plugin> status` clean at the end).
- **Workers never call the tracker (Linear).** Main checkout dse dirt is Scott's vault — ignore it.
- Other sessions (SC-472, SC-540, SC-544) run lifecycle/e2e now. Private resources only: Xvfb `:5440–:5479`, ports
  `48000–48999`; never connect to, evaluate in, or kill another session's Obsidian.

## What to do — execute and probe, not just read

1. Read the diff (helper, its tests, lifecycle start-up block, camera changes). Hunt for: any CDP connect or
   evaluate before the ownership proof completes; any later target lookup (camera `:678`/`:1459`/`:1833`
   equivalents, lifecycle reconnects if any) that can still reach a foreign port/browser; a stale
   `DevToolsActivePort` accepted as proof (camera udd persists); the proof's GUID compare vs `/json/version` on
   the right host (127.0.0.1 vs ::1/localhost); timeouts/cleanup (does an envFail leave our Obsidian/Xvfb
   running?); exit codes (2 for environment, never 1); vacuous unit tests (mutate the helper — e.g. skip the
   GUID compare, skip the stale-file delete — and confirm a test fails).
2. Re-run the base-vs-fix repros yourself with the implementer's harness scripts (in
   `sc551-r1-evidence/`, `sc551-r2-evidence/`), on YOUR private ranges: lifecycle pinned-port pair (a few tries),
   lifecycle default-port pair, camera decoy. Probe the one unexplained r1 pinned pair where BOTH runs exited 2
   (`D2a-try1`) if cheap — is there a case where neither run proceeds for a reason that would recur on a normal
   single run?
3. Gates: tsc + lint + jest once (expected: the r2 report's jest line); lifecycle part 1 (21) on a private
   explicit port; one cheap lifecycle scenario on the default port 0. e2e not required unless the diff touches
   `e2e/`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r3-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, counts by severity). Findings by severity
(CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and the prescribed fix. Evidence under
`.../sc551-r3-evidence/`.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique
  path.
- Redirect long output to files; one gate per foreground Bash call (timeout 600000); no background gates or Monitor
  waits (a two-run repro may background both runs inside ONE foreground script that `wait`s for them).
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc551-r3-review/`;
  write files with the Write tool, not heredocs. Exit codes from a script FILE run via
  `devbox run -c <abs path> -- bash <script>`.
- `devbox run -c <abs path> -- …`; never `cd X && …`; `git -C <abs path>` always.
- Never `pkill`/`killall` by pattern; kill only PIDs you spawned and recorded. No `rm` with a shell-variable
  target, no glob `rm`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT`. If you message anyway, the FIRST WORD must be `SC-551:`.
