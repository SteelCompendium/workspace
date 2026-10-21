# SC-468 independent review brief — round 1

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/decisions.md`.
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/sc468-impl-r1-report.md`
  (read its summary; verify its claims, do not trust them).
- The implementer's brief (for scope): `.../sc468-conditions-pick-focus/sc468-brief-impl-r1.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus/draw-steel-elements`, branch
  `sc468-conditions-pick-focus`, head `3fdbe2e`, base `origin/develop` @ `84636a9`. Review `git -C <repo> diff 84636a9..HEAD`.
- **Workers never call the tracker.** **Every git command uses `git -C <absolute path>`.** Do not edit code — you
  review. Do not commit, push, or tag. The main checkout's `demo-vault/` dirt is Scott's live vault — ignore it.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. Task — adversarial review: execute and probe, do not just read

The change: after a keyboard pick of a color swatch / duration chip / effect chip in the Conditions modal, focus
stays on the chosen option (re-found after re-render) instead of jumping to the row's cog; falls back to the cog when
the option is gone. Scope ruling (ledger, verbatim): "keep SC-468 to focus management, no swatch/chip CSS."

Probe at least:
- Each of the three groups, Enter AND Space, in jsdom and in the real Obsidian e2e harness if the suite supports it:
  is `activeElement` the newly selected option (not the previously selected one, not a stale detached node)?
- Rapid successive picks; picking the already-selected option (toggle-off semantics, if any); picking in row N when
  several rows exist (no cross-row focus); a pick that removes/collapses the option (fallback path really reached).
- Interaction with SC-431's `escapeConsumer` registry and the add-dropdown, and with the comment near L620 about
  `focusRowCog` yanking focus out of an input — any regression?
- Mouse picks: does a focus ring now appear on click where it did not before (`:focus-visible` heuristics)?
- Are the new tests non-vacuous — revert the source change (in a scratch copy / `git stash` in YOUR private clone,
  never in the shared worktree with uncommitted state) and confirm they fail.
- Re-run the full battery yourself and compare to expected: tsc + lint clean · jest 5329 passed / 1 skipped /
  230 of 231 suites + the new tests · lifecycle 28/28 · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`
  — implementer measured 85/89 ok, 63/63 pairs with new COND-E02/E03 · shots 572, 0 FAIL · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

Footguns (mandatory): devbox wrapping `devbox run -c <plugin repo> -- bash -c 'cd <repo> && <cmd>'`, gate exit codes
via wrapper script FILES (devbox eats `$?`, `| tail` eats failures). Private scratch subfolder only:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc468-review-r1-<suffix>/`,
uniquely named scripts/logs. Never key a wait-loop on a scratch filename or its contents — the scratch dir is
pre-populated across sessions and branches, and a stale log from another branch will match. Redirect long-running
output to a file; run gates in the FOREGROUND (the 600s stream watchdog kills silent agents). Never `pkill` by pattern —
kill only PIDs whose command line contains `worktrees/sc468-conditions-pick-focus/`. Never `rm -rf` a shared glob or
`.superpowers/`. Freeze baseline is read-only. If you need to mutate source to test vacuity, do it in a private
`git worktree add` of the branch under your scratch subfolder, and remove only that path afterwards.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc468-conditions-pick-focus/sc468-review-r1-report.md`,
opening with a ≤10-line executive summary (verdict, counts by severity). Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO)
with file:line, failure scenario, prescribed fix. If the file write is blocked, return the report inline.

## 4. Return contract

Final text to the ticket-owner, raw facts: verdict (LAND-READY / FIX-NEEDED), findings list (severity, file:line,
one line each), measured gate numbers, vacuity result, absolute paths of every artifact. You cannot `SendMessage` me;
`to: 'main'` reaches the dispatcher, not me. If blocked, end with STATUS: NEEDS_CONTEXT and the question. If you ever
send a message anyway, its first word must be `SC-468:`.
