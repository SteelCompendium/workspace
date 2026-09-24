# SC-288 r1 implementer report

## Executive summary

- Status: **DONE** (LAND-READY per dispatcher's session constraints — not landed, no tags/deploy touched).
- Root cause fixed: `SidebarBlockHost` now has `forgetMountedChild()`; `SidebarPanel` calls it at both sites that remove the mounted child (`handleAnchorLost`, `handleExternalChange`'s remount branch), so `lastMountedChild` is null exactly when nothing is mounted.
- No attribute gate added — root-cause fix alone closes the bug; see "Design decision" below.
- Regression test written TDD-first: confirmed **red** on unfixed code (`data-dse-sidebar-unavailable` stuck at `"true"`), confirmed **green** after the fix.
- Base sha `f6fb208` (== rebased `origin/develop`); head sha `0dcc6eb`. 3 commits: test, fix, changelog.
- Gates: tsc clean, lint clean, jest base 3937 passed/1 skipped/3938 total → head 3939 passed/1 skipped/3940 total (net +2, both new tests, 0 regressions), shots 0 FAIL, freeze `260/260` unchanged, parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` exit 0.
- No drive-by fixes. One follow-up noted (pre-existing test flake, unrelated file).

## Context

Ticket (verbatim, from the brief):

> `src/framework/sidebar/SidebarPanel.ts` — `handleExternalChange`'s fast path (`if (previous instanceof ElementView) { … await previous.update(model); return; }`) returns before both the pipeline remount and the attribute clear. `handleAnchorLost` calls `removeChild(previous)` but never clears `host.lastMountedChild`, so after a degrade, a valid external change takes the fast path on a stale view and the panel never recovers (verified under production-shaped services by the re-review).
>
> One-line fix, either: null `lastMountedChild` in `handleAnchorLost`, or gate the fast path on `!hasAttribute('data-dse-sidebar-unavailable')`.

Owner ruling (ledger, `.superpowers/sdd/sc288-sidebar-stuck/decisions.md`): fix the root cause — add a way for `SidebarBlockHost` to forget its mounted child, call it from `SidebarPanel` wherever it removes the mounted child. The attribute gate is optional belt-and-braces, implementer's call.

## What changed

### `src/framework/host/SidebarBlockHost.ts`

Added `forgetMountedChild(): void` (sets the private `mountedChild` field to `null`), right after the `lastMountedChild` getter (~L232–250). Pure bookkeeping — it does not itself unload/remove anything; callers are responsible for `removeChild` first, same division of labor `addChild`/`lastMountedChild` already had.

### `src/framework/sidebar/SidebarPanel.ts`

Two call sites, both immediately after `this.removeChild(previous)`:

- `handleAnchorLost` (~L252–260): calls `this.host.forgetMountedChild()` right after `removeChild(previous)`. **This is the actual root-cause fix** — this is the site the ticket names as the bug ("`handleAnchorLost` calls `removeChild(previous)` but never clears `host.lastMountedChild`").
- `handleExternalChange`'s remount/fallback branch (~L232–241): also calls `this.host.forgetMountedChild()` right after `removeChild(previous)`, for the same reason (defense in depth — this branch also removes a mounted child and must not leave a stale reference behind for its own next call).

I audited every other `removeChild`/unload site in the sidebar framework (grep for `removeChild`, `lastMountedChild`, `mountedChild`) — the only two sites that remove `host.lastMountedChild` specifically are the two above. `SidebarPanel.onunload()` doesn't call `removeChild` at all; the panel's own Component-cascade teardown (Obsidian's `Component.unload()`) unloads the mounted child automatically, and since `host` is a private field discarded along with the panel instance, a stale `mountedChild` there is inert — nothing reads it again. `DseSidebarView`'s `removeChild(panel)` calls are one level up (removing the panel Component itself, not the mounted element), same reasoning applies.

The existing `handleExternalChange` doc comment's claim — "nothing is currently mounted (e.g. the panel was previously degraded)" — is now literally true (it wasn't, before this fix, in the specific stale-reference case the ticket describes); no comment edit was needed to make it true, only the behavior.

### Design decision: no attribute gate added

The ledger left the belt-and-braces attribute gate (`!hasAttribute('data-dse-sidebar-unavailable')`) as my call. I did not add it:

- The root-cause fix directly closes the mechanism the ticket describes — `lastMountedChild` is now null exactly when nothing is mounted, so `previous instanceof ElementView` can never again be true against a removed view.
- An attribute gate on top would be checking a symptom (the DOM attribute) for a condition the host-level fix already makes structurally impossible to hit via this path. It would add a second source of truth (attribute string vs. actual mounted-child state) that could itself drift out of sync in a future change, which is the opposite of what "root cause" fixes are for.
- The regression test (below) proves recovery end-to-end through the real DOM attribute and CSS-visible state, so the attribute-gate's own value (a defensive read of that same attribute) is not adding coverage the test doesn't already exercise.

## Tests (TDD)

All three new tests follow the existing files' own conventions (production-shaped `DseSidebarView`/`SidebarBlockHost` harness with real `vault.on('modify')` delivery for `sidebarInitiative.test.ts`; the lighter `makeHost()` harness for `sidebarBlockHost.test.ts`).

1. **Regression** — `test/dom/framework/sidebarInitiative.test.ts`, `'SC-288: a degraded panel recovers via the pipeline (not the stale view's update()) on the next valid external change'`. Production-shaped deps (refs+validation+prefs all present, so the fast path is live, matching the ticket's "verified under production-shaped services" note). Sequence: mount a valid `ds-initiative` block via `sendToSidebar` → capture the mounted `InitiativeView` and spy on its `update()` → external deletion of the whole block (`fireModify`) degrades the panel (`data-dse-sidebar-unavailable` = `"true"`) → restore the exact anchored content that was live before the degrade (captured post-stamp via `app.vault.getContent`, not a fresh unanchored `sessionNote()` — an earlier draft of this test made that mistake and could never re-anchor) and `fireModify` again. Asserts: the attribute is gone, `.dse-error-card` is gone, `[data-dse-element="initiative"]` is present with real content (`Frodo Baggins`, the malice stepper button present), the stale view's `update()` was **never called**, and `host.lastMountedChild` is a fresh `InitiativeView` instance, not the pre-degrade one.

   - **Red, confirmed on unfixed code** (`git stash` of the two `src/` files, test unchanged): fails at `expect(panelEl.getAttribute('data-dse-sidebar-unavailable')).toBeNull()` — `Received: "true"`. Log: `.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-jest-red.log`.
   - **Green after the fix**: `.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-jest-green-sidebar.log` / `sc288-r1-jest-green-both.log`.

2. **Guard** — no new test needed; the existing test `'an external edit to a hero\'s stamina refreshes the mounted view in place via onUpdate — no remount'` (same file, unchanged) already asserts exactly the brief's guard requirement (non-degraded external change keeps the fast path, root-element identity preserved) and passes unchanged after the fix (verified in the same full-suite run — `sidebarInitiative.test.ts`: 8/8 passed, including this one).

3. **Host-level unit test** — `test/dom/framework/sidebarBlockHost.test.ts`, `'forgetMountedChild nulls lastMountedChild without touching the addChild-owned Component'`. Cheap (`makeHost()` harness, no vault I/O): `addChild` then `forgetMountedChild` → `lastMountedChild` is `null`; asserts forgetting is bookkeeping-only (the Component itself is untouched/still owned by `owner`, `removeChild` on it still fires `onunload`).

## Gate results

Run in `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`, via `devbox run -- bash -c '... <gate> LAST'`, per `dse-verify`.

| Gate | Result | Log |
|---|---|---|
| 1. tsc | clean, no output, exit 0 | `.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-tsc.log` |
| 2. lint | clean, exit 0 | `.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-lint.log` |
| 3. jest (BASE, `f6fb208`, before any change) | run 1: 1 failed (flake, see below), 1 skipped, 3936 passed, 3938 total; run 2 (retry, same tree, same load): **3937 passed / 1 skipped / 3938 total, 202 of 203 suites, all green** | `sc288-r1-jest-base.log`, `sc288-r1-jest-base2.log` |
| 3. jest (HEAD, `0dcc6eb`) | **3939 passed / 1 skipped / 3940 total, 202 of 203 suites**. Delta vs base: **+2 passed, +2 total** — exactly the 2 new tests (regression + host unit test), 0 regressions. | `sc288-r1-jest-full.log` |
| 4. shots | all captures `ok`, all in-run gates OK (host-copy pin OK, chrome/button/input/table/list/inline/checkbox/prose host-leak all OK, print-twin delta OK 130/130, print-twin self-test OK, nested corner-radius OK); `all shots written`; exit 0 | `sc288-r1-shots.log` |
| 5. freeze | `freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0 — **0 frozen bytes moved**, matches expectation exactly | `sc288-r1-freeze.log` |
| 6. parity (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0 — matches expectation exactly | `sc288-r1-parity.log` |
| 7. obsidian-shots | Skipped per brief (no display required/available). | — |

### Base jest flake (not this change, not fixed)

The first BASE jest run (before any of my edits, straight `f6fb208`) had one failure: `test/dom/framework/sidebarEncounterHandoff.test.ts › SC-153: "Open in sidebar" is idempotent › the encounter block persists the id it minted (durable across a reload)`. Re-ran in isolation (10/10 passed) and re-ran the full suite again on the same unmodified tree (all green, 3937/1/3938). Confirmed non-reproducible cross-test-order flake, unrelated to any file this change touches (`sidebarEncounterHandoff.test.ts` is untouched by SC-288). `/proc/loadavg` at the time was `12.83 7.03 6.71` — not the settings-tab/settings-preview timeout class the skill calls out, but load-shaped nonetheless. Logged under Follow-ups below rather than investigated further (out of scope — a different file, a different ticket).

## Commits

Branch `sc288-sidebar-stuck`, rebased onto `origin/develop` `f6fb208` (no-op rebase — branch was already there).

1. `2905604` — `test(sidebar): SC-288 red-first — degraded panel never recovers via the fast path` (regression test; amended once in-session to fix a test-authoring bug of my own — see below — before it was ever reported red for real)
2. `ce0c75b` — `fix(sidebar): SC-288 — clear lastMountedChild wherever the mounted child is removed` (the fix + the host unit test)
3. `0dcc6eb` — `docs(changelog): SC-288 — note the sidebar-panel-recovers-after-degrade fix`

Base sha: `f6fb208`. Head sha: `0dcc6eb`. No AI/Claude co-author trailers added, per brief.

**Note on the red-first record**: my first draft of the regression test captured `original` (the content to restore on "recovery") from `sessionNote()` called *before* `sendToSidebar` stamps the block's `_dse_anchor`, so restoring it could never re-anchor — that draft was red for the wrong reason (never even reached `handleExternalChange`'s fast path, due to `SidebarBlockHost`'s self-echo/anchor-not-found handling). Caught this before committing anything as "confirmed red," fixed the test to capture the anchor-stamped content post-`sendToSidebar`, then did the real red-then-green cycle (`git stash` of the two `src/` files, confirmed red at the correct assertion with the corrected test, `git stash pop`, confirmed green) documented above. The committed test (`2905604`) is the corrected version; I amended rather than adding a second commit since the earlier version was never a valid red-first artifact worth preserving in history (still un-shared, single-session work).

## File:line of the fix

- `src/framework/host/SidebarBlockHost.ts:250` — new `forgetMountedChild(): void { this.mountedChild = null; }`
- `src/framework/sidebar/SidebarPanel.ts:238` — `this.host.forgetMountedChild();` in `handleExternalChange`'s remount branch, right after `removeChild(previous)`
- `src/framework/sidebar/SidebarPanel.ts:265` — `this.host.forgetMountedChild();` in `handleAnchorLost` (the site the ticket names as the actual bug), right after `removeChild(previous)`

## Drive-by fixes

None.

## Follow-ups

- `test/dom/framework/sidebarEncounterHandoff.test.ts`'s `"the encounter block persists the id it minted (durable across a reload)"` test flaked once under concurrent-agent load (`/proc/loadavg` ~12.8/7.0/6.7) and passed cleanly both in isolation and on a full-suite re-run. Unrelated to SC-288 (different file, different feature — SC-153 encounter handoff, not sidebar degrade/recovery). Not investigated further or fixed — out of this ticket's scope per the brief's drive-by-fix bar (not local to a file this task touches). Worth the owner filing a Backlog ticket if it recurs.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/sc288-r1-impl-report.md`
- Ledger read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/decisions.md`
- Gate logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/`):
  - `sc288-r1-tsc.log`
  - `sc288-r1-lint.log`
  - `sc288-r1-jest-base.log`, `sc288-r1-jest-base2.log` (base measurement, incl. the flake + clean retry)
  - `sc288-r1-jest-red.log` (regression test red on unfixed code, corrected test)
  - `sc288-r1-jest-green-sidebar.log`, `sc288-r1-jest-green-both.log` (green after fix)
  - `sc288-r1-jest-full.log` (full suite, HEAD)
  - `sc288-r1-shots.log`
  - `sc288-r1-freeze.log`
  - `sc288-r1-parity.log`
- Changed files (worktree `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`):
  - `src/framework/host/SidebarBlockHost.ts`
  - `src/framework/sidebar/SidebarPanel.ts`
  - `test/dom/framework/sidebarBlockHost.test.ts`
  - `test/dom/framework/sidebarInitiative.test.ts`
  - `CHANGELOG.md`
