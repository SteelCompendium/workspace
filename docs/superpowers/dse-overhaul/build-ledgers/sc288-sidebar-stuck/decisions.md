# SC-288 decisions ledger — DSE sidebar: degraded panel taking the in-place fast path never recovers

Owner: Fable ticket-owner (overnight dispatcher session 2026-09-24). Worktree `sc288-sidebar-stuck`
(`/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck`). Repo: draw-steel-elements, tracked branch `develop`.

## Scott rulings (verbatim, dated)

(none — ticket thread had 0 comments at pickup, 2026-09-24. Ticket body is the spec.)

Ticket body (Scott-authored 2026-08-29), verbatim:

> `src/framework/sidebar/SidebarPanel.ts` — `handleExternalChange`'s fast path (`if (previous instanceof ElementView) { … await previous.update(model); return; }`) returns before both the pipeline remount and the attribute clear. `handleAnchorLost` calls `removeChild(previous)` but never clears `host.lastMountedChild`, so after a degrade, a valid external change takes the fast path on a stale view and the panel never recovers (verified under production-shaped services by the re-review).
>
> One-line fix, either: null `lastMountedChild` in `handleAnchorLost`, or gate the fast path on `!hasAttribute('data-dse-sidebar-unavailable')`.

## Session constraints (dispatcher, 2026-09-24)

- Do NOT land; report LAND-READY / PARKED-NEEDS-REVIEW to dispatcher. No tags/releases on DSE, never touch DSE `main`, no `just deploy*`, no freeze-baseline change without Scott's written sanction.
- Rebase onto current origin/develop before reporting LAND-READY (SC-240 landing concurrently).

## Owner rulings

- 2026-09-24 — Fix shape: root-cause option (the host forgets its mounted child whenever SidebarPanel removes it — both `handleAnchorLost` and the remount branch), NOT only the attribute gate. `SidebarBlockHost.lastMountedChild` is a getter over a private `mountedChild` field with no clear path, so the implementer adds one. The attribute gate is optional belt-and-braces; implementer's call, reviewer judges.
- 2026-09-24 — No visual change expected; freeze must stay 260/260 unchanged. No Scott ask anticipated; pipeline = implementer → independent reviewer → land-ready.
- 2026-09-24 — DSE CHANGELOG: one bullet under the 7.0.0 (unreleased) section, user-facing phrasing.

## Authorship

- r1 implementer: orchestration:implementer (dispatched 2026-09-24)
- review: orchestration:reviewer (fresh identity, dispatched 2026-09-24); r2 fix by r1 implementer; scoped re-review of r2 delta → same reviewer (not an author)

## Round log

- 2026-09-24 r1 impl DONE: base `f6fb208`, head `0dcc6eb` (2905604 test red-first, ce0c75b fix, 0dcc6eb changelog). `forgetMountedChild()` added to SidebarBlockHost; called from handleAnchorLost + remount branch. No attribute gate. Gates: tsc/lint clean; jest 3937→3939 passed / 1 skipped / 202 of 203 suites; shots 0 FAIL; freeze 260/260; parity 0/0/16.
- 2026-09-24 owner ruling on r1 follow-up (flaky `sidebarEncounterHandoff.test.ts`, 1 failure under load, not reproducible): DROP for now — single non-reproducible occurrence under concurrent load. If the reviewer's jest run reproduces it, file a Backlog ticket then.
- 2026-09-24 r1 review (orchestration:reviewer) on `0dcc6eb`: FIX-ROUND. HIGH 0 / MEDIUM 1 / LOW 2 / INFO 3. Gates re-measured identical (jest 3939/1/202 of 203; freeze 260/260; parity 0/0/16). Handoff flake did not reproduce (5/5 isolated) — drop ruling stands, no ticket.
- 2026-09-24 owner ruling on r1 review: FOLD MEDIUM-1 (undo after panel write stays stuck — clear `lastWritten` in `notifyAnchorLost` + regression test), LOW-1 (test for remount-branch `forgetMountedChild`), LOW-2 (add the attribute gate on the fast path + race test), INFO-1 (reword the doc comment; no "exactly"/"structurally impossible" claims) into ONE fix round by the r1 implementer. INFO-2 resolved by MEDIUM-1 fix (CHANGELOG wording stays accurate; implementer may mention the error-card case). INFO-3 is Scott's known main-checkout vault dirt — ignore. No Backlog tickets.
- 2026-09-24 r2 fix DONE (after a 429 kill + resume): head `45dcf2b` (253999a tests red-first, 7435360 fix, 45dcf2b changelog). origin/develop still `f6fb208`. Mutation red/green per finding recorded. Gates: tsc/lint clean; jest 3942/1 skipped/3943, 202 of 203; shots 0 FAIL; freeze 260/260; parity 0/0/16.
- 2026-09-24 owner ruling on r2 follow-ups: (1) sidebarEncounterHandoff flake now seen twice under load → FILED SC-352 (Backlog, related SC-288); out of scope here. (2) LOW-2 "per-call generation token" fuller fix → DROP: the attribute gate closes the observed race (reviewer-verified probe); a generation token adds machinery with no known remaining failure scenario. Re-review may reopen if it finds one.
- 2026-09-24 r2 scoped re-review (orchestration:reviewer) on `45dcf2b`: LAND-READY. HIGH/MED/LOW 0, INFO 3. origin/develop moved f6fb208 → 48ac20c (SC-343); trial merge: CHANGELOG.md conflict only (keep both bullets), merged tree tsc clean, jest 3972/3 skipped/3975, 204 of 205.
- 2026-09-24 owner ruling on re-review INFO: INFO-1 (rebase + CHANGELOG conflict) → rebase round by implementer, keep both bullets, full battery re-run. INFO-2 (`sidebarBlockHost.test.ts:168` "can never survive" overclaim) → FOLD into the rebase round, reviewer's wording. INFO-3 (two-remounts-in-flight ordering race, pre-existing, not reproduced, not widened) → DROP: no reproduction and no observed failure; the generation-token fix is on record in the re-review report if it ever surfaces.
- 2026-09-24 r3 rebase DONE: onto origin/develop `48ac20c`, head `3b25127` (r1/r2 rewritten to 5a6928a/32def4b/a7cc8ca/e6c0d9a/cb494a3/99d62e9 + r3 3b25127 INFO-2 reword). CHANGELOG conflict kept both bullets. Gates: tsc/lint clean; jest 3974/1 skipped/3975, 204 of 205; shots 0 FAIL; freeze 260/260; parity 0/0/16. Owner verified: merge-base == origin/develop 48ac20c, tree clean, no co-author trailers. LAND-READY reported to dispatcher.
