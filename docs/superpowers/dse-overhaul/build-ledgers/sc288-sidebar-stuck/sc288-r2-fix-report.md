# SC-288 r2 fix-round report

## Executive summary

- Status: **DONE** (LAND-READY per dispatcher's session constraints — not landed).
- Folded all four r1-review findings into this one round: **MEDIUM-1** (undo after a panel write stayed stuck — self-echo guard fix), **LOW-1** (added the missing test for the remount branch's existing `forgetMountedChild()` call), **LOW-2** (attribute-gate the in-place fast path to close a mid-remount race), **INFO-1** (reworded the doc comments that overclaimed "null exactly when nothing is mounted").
- develop did not move (`f6fb208`, same as r1's base) — no rebase needed.
- Base sha (r1 head) `0dcc6eb`; r2 head sha `45dcf2b`. 3 commits: test, fix, changelog.
- Each new test independently confirmed **red** with its own specific fix line removed (mutation-verified, all three, restored and re-confirmed green afterward), per the review's explicit ask.
- Gates: tsc clean, lint clean, jest `0dcc6eb` 3939→`45dcf2b` 3942 passed / 1 skipped / 3943 total (net +3, exactly the 3 new tests), shots 0 FAIL, freeze `260/260` unchanged, parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` exit 0.
- No new drive-by fixes or follow-ups beyond the already-known, already-ruled-on `sidebarEncounterHandoff.test.ts` flake (observed again under load, not reproduced in isolation — see below).

## What r1's review found and this round fixes

Review verdict on `0dcc6eb`: FIX-ROUND, HIGH 0 / MEDIUM 1 / LOW 2 / INFO 3. Owner ruling: fold MEDIUM-1, LOW-1, LOW-2, INFO-1 into one round (INFO-2 resolved by MEDIUM-1's fix; INFO-3 is known main-checkout vault dirt, ignored; no Backlog tickets). Full review: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-review-report.md`.

### MEDIUM-1 — undo after a panel write still left the panel stuck

- Where: `src/framework/host/SidebarBlockHost.ts`, `notifyAnchorLost` (now ~L353–363).
- Mechanism: `lastWritten` (the self-echo guard) recorded the host's own last-persisted body but was never cleared when the block was lost. The most common recovery action — an editor undo (Ctrl+Z) right after a sidebar write — restores the note to exactly `lastWritten`, so `applyFreshContent`'s self-echo check (`if (body === this.lastWritten) return;`) silently swallowed the restore: `onExternalChange` never fired, and the panel stayed on "Backing block not found" until some *different* edit happened. This directly contradicted the CHANGELOG bullet's "recovers on the next valid change" and the r1 test's own (now-corrected) comment naming "an undo" as a recovery case it didn't actually exercise.
- Fix (`SidebarBlockHost.ts`): add `this.lastWritten = null;` in `notifyAnchorLost`, right after `this.anchorLostNotified = true;`. Once the block is lost, nothing on screen reflects the old write, so any content that reappears is external by definition.
- Test: `test/dom/framework/sidebarInitiative.test.ts`, `'SC-288 r2 (MEDIUM-1): undo right after a panel write recovers the degraded panel (self-echo guard cleared on anchor loss)'`. Sequence: click the malice stepper (persist, sets `lastWritten`) → delete the block (degrade) → restore the note to *exactly* the post-write bytes (the undo case) → asserts full recovery.

### LOW-1 — the remount branch's `forgetMountedChild()` call (from r1) had no covering test

- Where: `src/framework/sidebar/SidebarPanel.ts`, `handleExternalChange`'s fallback/remount branch (the r1 fix, unchanged in r2).
- The review's mutation proof: deleting that one line left the full r1 suite green (3939/3940). It fixes a real second "stuck" shape the ticket never named: an external edit that fails to *parse* (the fast path's `prepareModel` throws → falls through to a full remount → the pipeline's own error card, no `addChild`) followed by a later valid edit. Without the forget call, `lastMountedChild` still pointed at the earlier, already-removed view, so the next valid edit's fast path called `.update()` on it instead of remounting — the error card never cleared.
- No source fix needed here (r1 already had it) — only test coverage.
- Test: `'SC-288 r2 (LOW-1): an edit that fails to parse (error card), followed by a valid edit, recovers the panel'`. Sequence: valid mount → edit with unterminated YAML flow (`\nmalice: [unterminated`) → error card renders → valid edit restores → asserts the error card clears, `lastMountedChild` is a fresh `InitiativeView`, and the pre-restore `mountedAfterError` was `null` (proving the forget call ran).

### LOW-2 — an anchor loss during a recovery remount re-creates the stale-view state

- Where: `src/framework/sidebar/SidebarPanel.ts`, `handleExternalChange`'s fast-path condition (now ~L215–232).
- Mechanism: `forgetMountedChild` (r1) closes the common window, but not a narrower race the review found by forced interleave: a recovery remount's own `pipeline.run()` can still be awaiting (mid ref-resolution) when a *second* anchor-loss lands. `handleAnchorLost` sees nothing `addChild`'d yet (this remount hasn't reached that step), degrades correctly and empties `bodyEl` — but when the in-flight `pipeline.run()` then resumes and finally `addChild`'s its view, `host.lastMountedChild` becomes a live, loaded `ElementView` whose `rootEl` was never attached to the (already-emptied) DOM, while the panel shows the degrade card. The next valid change would then take the fast path against that detached view.
- Fix (`SidebarPanel.ts`): add `&& !this.panelEl?.hasAttribute('data-dse-sidebar-unavailable')` to the fast-path condition (`if (refs && validation && prefs && !this.panelEl?.hasAttribute('data-dse-sidebar-unavailable'))`). Whenever the panel is flagged unavailable, the fast path is skipped entirely and the remount branch always runs, which `removeChild`s + forgets whatever `lastMountedChild` holds — detached or not — before mounting fresh. (A fuller fix, a per-call generation token that drops a mount finishing after a newer degrade, was noted by the review as the more complete fix; the gate is what the owner accepted as sufficient for this round.)
- Test: `'SC-288 r2 (LOW-2): an anchor loss mid-remount does not leave a detached stale view behind for the fast path'`. Forces the interleave directly (`panel.handleExternalChange(validBody)` started, then `panel.handleAnchorLost()` called before awaiting it, matching the review's own forced-interleave technique — real timing would need two vault modifies landing inside one `pipeline.run()`'s microtask window, which a synthetic host can't reliably reproduce) → asserts a later valid change still fully recovers the panel.

### INFO-1 — doc comments overclaimed "exactly"/structural guarantees

- `SidebarBlockHost.ts`: `forgetMountedChild`'s doc no longer claims `lastMountedChild` is null "exactly when nothing is currently mounted" — reworded to "does not outlive a child SidebarPanel has already removed," with an explicit note that LOW-2 is the narrower race this method alone doesn't close (closed by `SidebarPanel`'s attribute gate instead).
- `SidebarBlockHost.ts`: the `mountedChild` field's own doc gained a matching note (it previously said nothing about being cleared at all).
- `SidebarBlockHost.ts`: `lastWritten`'s field doc now explains why `notifyAnchorLost` clears it (MEDIUM-1).
- `SidebarPanel.ts`: `handleExternalChange`'s top doc comment now lists the new attribute-gate condition among the reasons the fast path is skipped.
- Per the ledger's explicit instruction, no "structurally impossible" (or similar overclaim) language was used anywhere in this round's comments, commit messages, or this report.

## Mutation-based red/green evidence

Each fix line was temporarily commented out (leaving everything else — including the OTHER two r2 fixes and all of r1's fixes — intact), the specific new test run in isolation to confirm red, then the line restored and the test re-run to confirm green. This is the review's own explicit ask ("show red with its specific fix line removed, green with it") — not classic write-test-then-implement TDD, since all three fixes were authored together; the mutation check gives the same non-vacuousness guarantee per test.

| Test | Mutation | Red result | Log |
|---|---|---|---|
| MEDIUM-1 | commented out `this.lastWritten = null;` in `notifyAnchorLost` | `expect(...).toBeNull()` — `Received: "true"` at the attribute assertion | `sc288-r2-medium1-red.log` |
| LOW-1 | commented out `this.host.forgetMountedChild();` in the remount branch | `expect(panelEl.querySelector('.dse-error-card')).toBeNull()` — received the stale error-card `<div>` | `sc288-r2-low1-red.log` |
| LOW-2 | commented out the `&& !this.panelEl?.hasAttribute(...)` clause | `expect(...).toBeNull()` — `Received: "true"` at the attribute assertion | `sc288-r2-low2-red.log` |

After each mutation was reverted, `grep -n "TEMP-MUTATION" src/framework/host/SidebarBlockHost.ts src/framework/sidebar/SidebarPanel.ts` returned no matches (verified before committing) — no mutation was left applied in the committed code. Full-suite green confirmed after all three reverts: `sc288-r2-jest-restore-check.log` (11/11 in `sidebarInitiative.test.ts`) and the final full-suite run below.

## Commits

Branch `sc288-sidebar-stuck`. develop did not move from r1's base (`f6fb208`) — `git fetch origin` confirmed, no rebase needed.

1. `253999a` — `test(sidebar): SC-288 r2 red-first — MEDIUM-1 undo, LOW-1 error-card, LOW-2 race coverage` (all three new tests; also tightens the r1 test's comment that named "an undo" without exercising it)
2. `7435360` — `fix(sidebar): SC-288 r2 — clear lastWritten on anchor loss, gate fast path on the unavailable attribute` (MEDIUM-1 + LOW-2 fixes, INFO-1 doc rewording)
3. `45dcf2b` — `docs(changelog): SC-288 r2 — mention the undo and parse-error-notice recovery cases`

Base sha (r1 head): `0dcc6eb`. r2 head sha: `45dcf2b`. No AI/Claude co-author trailers, per brief.

## File:line of the r2 fixes

- `src/framework/host/SidebarBlockHost.ts:362` — `this.lastWritten = null;` in `notifyAnchorLost` (MEDIUM-1)
- `src/framework/sidebar/SidebarPanel.ts:232` — `if (refs && validation && prefs && !this.panelEl?.hasAttribute('data-dse-sidebar-unavailable')) {` (LOW-2)
- LOW-1's fix line (unchanged from r1): `src/framework/sidebar/SidebarPanel.ts:256` — `this.host.forgetMountedChild();` in the remount branch

## Gate results

Run in `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`, via `devbox run -- bash -c '... <gate> LAST'`, per `dse-verify`. `npm run shots` ran in the foreground with output redirected to a file (per the r2 brief's explicit instruction); the harness's own 120s tool timeout still moved it to a background task id, but it was NOT separately monitored/polled for — its own completion notification was awaited directly, then its log read.

| Gate | Result | Log |
|---|---|---|
| 1. tsc | clean, no output, exit 0 | `sc288-r2-tsc.log` |
| 2. lint | clean, exit 0 | `sc288-r2-lint.log` |
| 3. jest (`rm -f main.js styles.css` first) | **3942 passed / 1 skipped / 3943 total, 202 of 203 suites**, exit 0. Delta vs r1 head (3939/1/3940): **+3 passed, +3 total** — exactly the 3 new tests, 0 regressions. First run of the day hit the same already-known `sidebarEncounterHandoff.test.ts` flake (see below); this is the clean re-run's numbers. | `sc288-r2-jest.log` (clean), `sc288-r2-jest-restore-check.log` (11/11 sidebarInitiative.test.ts after mutation restores), `sc288-r2-jest-full.log` (pre-commit full-suite check) |
| 4. shots | all captures `ok`, all in-run gates OK (host-copy pin OK, chrome/button/input/table/list/inline/checkbox/prose host-leak all OK, print-twin delta OK 130/130, nested corner-radius OK); `all shots written`; exit 0 | `sc288-r2-shots.log` |
| 5. freeze | `freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0 — **0 frozen bytes moved** | `sc288-r2-freeze.log` |
| 6. parity (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0 | `sc288-r2-parity.log` |
| 7. obsidian-shots | Skipped, no display required/available (unchanged from r1). | — |

### The known jest flake, observed again

The first full-suite jest run of this round hit the exact same pre-existing failure r1 hit and the r1 reviewer's run did not reproduce: `test/dom/framework/sidebarEncounterHandoff.test.ts › SC-153: "Open in sidebar" is idempotent › the encounter block persists the id it minted (durable across a reload)`. `/proc/loadavg` at the time: `30.14 13.69 5.71` — high concurrent-agent load (several other sessions' `npm run shots`/`npm test` runs were active on this shared devbox host at the time, per `ps aux`). Re-ran in isolation: **10/10 passed**. Re-ran the full suite again on the identical, unmodified tree: **3942/1/3943, all green**. Per the ledger's own standing ruling on this flake ("DROP for now ... If the reviewer's jest run reproduces it, file a Backlog ticket then" — and the r1 reviewer's 5/5 isolated run did NOT reproduce it), this is not new information and does not change that ruling; recorded here for completeness, not as a new finding.

## Drive-by fixes

None beyond what's already covered under "What r1's review found and this round fixes" above (all of it is review-directed, not opportunistic).

## Follow-ups

- Same standing item as r1: the `sidebarEncounterHandoff.test.ts` flake (see above) remains unreproduced in isolation across two separate full-suite observations now (r1's and r2's). No action taken per the existing ledger ruling; the owner may want a Backlog ticket if a third observation lands with a reviewer's own run reproducing it.
- The review's LOW-2 finding noted a fuller fix exists (a per-call generation token that drops a mount finishing after a newer degrade) beyond the attribute gate actually applied. The owner's ruling accepted the gate as sufficient for this round; noting the fuller-fix option here in case a future SC-288-adjacent ticket wants it.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r2-fix-report.md`
- r1 review read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-review-report.md`
- Ledger read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/decisions.md`
- Gate logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/`):
  - `sc288-r2-tsc.log`, `sc288-r2-tsc-check.log`
  - `sc288-r2-lint.log`
  - `sc288-r2-jest.log` (clean full run), `sc288-r2-jest-full.log` (pre-commit full run), `sc288-r2-jest-newtests-green.log`, `sc288-r2-jest-restore-check.log`
  - `sc288-r2-medium1-red.log`, `sc288-r2-low1-red.log`, `sc288-r2-low2-red.log` (mutation red evidence)
  - `sc288-r2-shots.log`
  - `sc288-r2-freeze.log`
  - `sc288-r2-parity.log`
- Changed files (worktree `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`):
  - `src/framework/host/SidebarBlockHost.ts`
  - `src/framework/sidebar/SidebarPanel.ts`
  - `test/dom/framework/sidebarInitiative.test.ts`
  - `CHANGELOG.md`
