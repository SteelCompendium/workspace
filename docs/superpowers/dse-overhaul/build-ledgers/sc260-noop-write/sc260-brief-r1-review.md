# SC-260 round 1 — independent review brief

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/decisions.md`
  (ledger; owner rulings O-1..O-4 are the spec) and
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-brief-r1-implement.md`
  (what the implementer was asked to do) and its report `sc260-r1-implement-report.md` in the same dir
  (executive summary first).
- **Workers never call the tracker (Linear).**
- Code under review: `/home/scott/code/steelCompendium/worktrees/sc260-noop-write/draw-steel-elements`,
  branch `sc260-noop-write`, diff = `git -C <that path> diff c78a06b..HEAD` (base `develop` @ `c78a06b`).
  You did not write this code. **Do not commit to that branch**; findings only. If you need to probe
  with throwaway edits, use `git -C … stash`/a scratch copy and leave the branch exactly as you found it
  (confirm `git status` clean and HEAD unchanged at the end).
- Never touch the shared main checkout except writing your report into the ledger dir. Use
  `git -C <absolute path>` for every git command. Devbox:
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc260-noop-write/draw-steel-elements -- bash -c 'cd … && <cmd>'`;
  devbox eats exit codes — redirect gate output to files and read them.

## 2. The task — execute and probe, not just read

The change: `ReadingModeBlockHost.replaceSource` now pins the SC-198 preview scroll only when the
`vault.process` callback actually changes the file content (pin moved inside the callback). Rulings
O-1..O-4 in the ledger are binding; quote them if you find the diff violating one.

Probe at least:
1. **Ordering.** Does pinning inside the `vault.process` callback still land before Obsidian's
   post-write rebuild? Look at how Obsidian's `Vault.process` is implemented (check
   `node_modules/obsidian` typings/docs and, if available, the real app bundle the lifecycle/e2e
   harness uses) — is the callback synchronous relative to the write and the `modify` event? Is there
   any path where `modify` fires before the callback returns?
2. **Fail-safety.** Can `pin()` throw inside the callback and abort/corrupt a write? Does a throw
   there leave the claim ticket or `knownBody` inconsistent?
3. **No regression of SC-198.** The scroll pin must still engage on every real (changing) write.
   Run lifecycle + e2e and check the SC-198/scroll-related scenarios specifically.
4. **Tests are not vacuous.** Revert only the source change (keep the tests) in a scratch copy and
   confirm the new no-op test goes red; confirm the order assertion actually observes order.
5. **Concurrent writes.** Two overlapping `replaceSource` calls (timer flush racing unload flush,
   see the SC-343 comment) — any change in pin behaviour that matters?
6. Re-run the dse-verify battery (skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`).
   Expected at base `c78a06b`: tsc + lint clean · jest 4787 passed / 1 skipped / 227 of 228 suites
   (+ the implementer's new tests) · lifecycle 25/25 · e2e `OBSIDIAN-E2E done: 63/73 ok, 0 failed,
   10 known-bug, coverage: 47/47 pairs` · shots 572, 0 FAIL · freeze `freeze OK (276/276 …)` ·
   parity 0 GAPs / 0 undeclared / 24 DECLARED. At minimum re-run tsc, lint, jest, lifecycle, e2e
   yourself; shots/freeze/parity only if the implementer's numbers look off or the diff touches CSS.

Footguns:
- Run every gate in the FOREGROUND with output to a per-run unique file
  (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-rev-<gate>-$(date +%s).log`).
  Never background a gate and wait for a notification.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match.
- Redirect long output to files; the 600 s stream watchdog kills silent agents.
- Never `pkill`/`killall` by a bare pattern; kill only by PID whose command line contains
  `worktrees/sc260-noop-write/`.
- Never `rm -rf` the shared `.superpowers/` dir.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-r1-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_NITS / CHANGES_REQUIRED,
measured gate numbers). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a
failure scenario, and a prescribed fix. If the report-file write is blocked, return it inline.

## 4. Return contract

Final text goes to the ticket-owner, not a human — raw facts: verdict, reviewed sha, measured gate
numbers, findings list (severity + file:line + one line each), and absolute paths of every artifact.
You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. Any
message you send anyway must start with `SC-260:`.
