# SC-243 independent review brief — round 1

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/decisions.md`
  (rulings O1–O6 are the spec; the ticket text is quoted there).
- The implementer's brief and report in the same dir: `sc243-brief-impl-r1.md`,
  `sc243-impl-r1-report.md` (read the exec summary; the body only where you need it).
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc243-sync-busy/draw-steel-elements`, branch
  `sc243-sync-busy`. Review the diff `git diff origin/develop...HEAD` (fetch first; do not rebase —
  that is not your change to make). Verify `pwd` before any write; you should write nothing in the
  repo except throwaway probe tests you delete afterwards (never commit).
- You never call the tracker.

## 2. Task — adversarial review; execute and probe, don't just read

Probe at minimum:
- Double-click race: two `onClick` invocations in the same tick, before any re-render — exactly one
  run starts? (a jest probe driving the real button handler, not a mock of the guard)
- Every sync entry point: Sync button, `sync-compendium` command, legacy alias command, each
  migration-modal callback (`syncAnyway`, `syncAfter`), `LegacyCompendiumModal` choice. Any path
  that starts a second concurrent run, or any path the guard wrongly refuses (self-refusal when
  `syncCompendium` calls `syncService.sync`)?
- Busy stuck ON: prelude throws (reconcile/manifest load), sync throws, modal hand-off, the modal
  dismissed without choosing, check-for-updates throws. After each, can the user sync again?
- Busy stuck OFF early: does busy drop before the run's real work finishes anywhere?
- Listener lifecycle: settings opened mid-sync, closed mid-sync, reopened; row teardown leaves no
  listener; listener exceptions can't break the sync.
- Plugin unload mid-sync: anything dangling?
- Are the new tests genuine — revert the source change (stash) and confirm they fail.
- Re-run the gates yourself: tsc, lint, `rm -f main.js styles.css && npx jest`, and the freeze check
  after `npm run shots` (expected `freeze OK (260/260 …)`, 524 shots, 0 FAIL). Parity and lifecycle
  only if the diff touches anything they cover (state why you ran or skipped).
- Eyeball the evidence PNGs the implementer saved (paths in its report): are the buttons legibly
  disabled, labels `Syncing…` / `Checking…` correct, and does the at-rest shot match develop?

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/sc243-review-r1-report.md`,
opening with a ≤10-line executive summary (verdict: APPROVE / APPROVE-WITH-FIXES / REJECT).
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.
Measured gate lines. Paths of any probe logs.

## 4. Return contract & footguns

- Final text goes to the ticket-owner: verdict, finding list (severity + one line each), gate
  numbers, artifact paths. No prose.
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to a file; run
  gates in the FOREGROUND, never background-and-wait.
- Load-sensitive jest suites (`settings-tab`, `settings-preview`): on a timeout-shaped red, check
  `/proc/loadavg` and re-run before believing it.
- Never `rm -rf` under `.superpowers/` except your own `sc243-*` files.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + question if blocked. Any message you
  send anyway starts with `SC-243:`.
