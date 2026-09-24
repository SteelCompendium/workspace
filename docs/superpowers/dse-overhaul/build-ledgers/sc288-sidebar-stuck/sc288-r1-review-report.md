# SC-288 r1 independent review — reviewed `0dcc6eb` (base `f6fb208`)

## Executive summary

- **Verdict: FIX-ROUND** (small: 1 line + 1 test for MEDIUM-1; 1 test for LOW-1; optional 1-line gate for LOW-2).
- Counts: HIGH 0 · MEDIUM 1 · LOW 2 · INFO 3.
- The ticket's named bug is genuinely fixed: the regression test is non-vacuous (red on base at `sidebarInitiative.test.ts:293`, `Received: "true"`; fast path live — refs+validation+prefs all threaded), green on head; fast path still used in the non-degraded case and after every recovery.
- MEDIUM-1: the most natural recovery action — **undo** after the panel has written once — still leaves the panel stuck, because the self-echo guard swallows the restored body. The CHANGELOG bullet promises recovery "on the next valid change". Verified 1-line fix.
- LOW-1: the remount-branch `forgetMountedChild()` fixes a second user-visible bug (error card stuck after invalid→valid edit) but no test covers it — deleting it leaves the full suite 3939/3940 green.
- LOW-2: an anchor-loss landing while a recovery remount is mid-`pipeline.run` re-creates the stale-view state (forced interleave reproduces the stuck panel). The optional attribute gate closes it (verified).
- Gates re-measured by me: tsc clean · lint clean · jest **3939 passed / 1 skipped / 3940, 202 of 203 suites** · shots 0 FAIL · `freeze OK (260/260 …)` · parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)` exit 0. Flake not reproduced.

## Scope / state

- Worktree `/home/scott/code/steelCompendium/worktrees/sc288-sidebar-stuck/draw-steel-elements`, branch `sc288-sidebar-stuck`, HEAD `0dcc6eb926f48c7a1d0a456d3dc2289bde2a11ce`.
- `git fetch origin`; `git merge-base HEAD origin/develop` == `origin/develop` == `f6fb20838e008d08375d37b879cafa282e66a52c`. Diff: 5 files, +113/−0.
- Submodule `git status --porcelain` empty before and after every probe (revert probes restored with `git checkout HEAD -- src`). Superproject shows only the expected ` M draw-steel-elements` pointer (pre-existing, from the implementer's commits).

## Gates (measured on `0dcc6eb`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc288-r1-review-tsc.log` |
| lint | clean (standing `.eslintignore` deprecation warning only), exit 0 | `sc288-r1-review-lint.log` |
| jest (`rm -f main.js styles.css` first) | `Test Suites: 1 skipped, 202 passed, 202 of 203` · `Tests: 1 skipped, 3939 passed, 3940 total` — matches implementer's head count | `sc288-r1-review-jest.log` |
| shots | exit 0, all in-run gates OK, `all shots written`, 0 FAIL | `sc288-r1-review-shots.log` |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 | `sc288-r1-review-freeze.log` |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0 | `sc288-r1-review-parity.log` |

Flake check: `sidebarEncounterHandoff.test.ts` passed in the full run and 5/5 isolated runs (10/10 each) — `sc288-r1-review-handoff-5x.log`. **Not reproduced**; per ledger ruling no ticket needed.

## Probes

Probe suite (scratch, never committed): `sc288-probe.test.ts` in this dir, copied transiently to `test/dom/framework/sc288Probe.test.ts` and removed after each run. Same production-shaped harness as `sidebarInitiative.test.ts` (refs+validation+prefs, real modify delivery).

| Probe | HEAD | Base src (tests kept) |
|---|---|---|
| committed regression test | pass | **fail** at l.293 `data-dse-sidebar-unavailable` `Received: "true"` |
| committed host unit test | pass | fail (`forgetMountedChild is not a function` — expected) |
| P1 panel write → delete block → undo (exact bytes back) | **FAIL** (stays degraded) | fail |
| P2 invalid external edit (error card) → valid edit | pass | **fail** — parse error card stays (`Map keys must be unique…`) |
| P3 3× degrade/recover cycles; fast path live after each recovery (root identity kept, `update` called once); persist afterwards lands in block, prefix/suffix byte-identical, anchor kept | pass | fail |
| P4 block reappears moved to a different line + edited; persist lands in the moved block, surrounding prose intact | pass | fail |
| P5 two panels on one note: degrade/recover A; B's view instance and root node never change | pass | fail (A stuck) |
| P6 panel restored via `setState` while block missing (mount() degrade), then block appears | pass | — |
| P7 unpin a degraded panel, then modify: no throw, no resurrection | pass | — |
| P8 restore + immediate re-delete via two back-to-back modifies | pass (microtask order in the mock does not open the window) | — |
| P9 forced interleave: `handleAnchorLost` while a remount `pipeline.run` is awaiting | **FAIL** (see LOW-2) | — |

Logs: `sc288-r1-review-probe-head.log`, `sc288-r1-review-revert.log`, `sc288-r1-review-revert-p2.log`, `sc288-r1-review-probe-p8.log`, `sc288-r1-review-probe-p9.log`.

## Findings

### MEDIUM-1 — undo after a panel write still leaves the panel stuck (self-echo guard swallows the recovery)

- Where: `src/framework/host/SidebarBlockHost.ts:356` (`if (body === this.lastWritten) return;`), interacting with `notifyAnchorLost` at `:328-332` (which never clears `lastWritten`).
- Scenario: user clicks the sidebar's Malice stepper (persist → `lastWritten` = body X) → deletes the block in the editor (panel degrades correctly) → Ctrl+Z. The note is byte-identical to X again; `applyFreshContent` finds the block, resets `anchorLostNotified`, then treats body X as our own write echoing and returns — `onExternalChange` never fires, the panel stays on "Backing block not found" with the block fully valid in the note. Recovers only on a later, *different* edit. Probe P1 (fails on head and base — pre-existing, not a regression, but it is the same "degraded panel never recovers" symptom through the most common recovery action, and every sidebar session that has touched a control has a non-null `lastWritten`).
- Why it matters for this ticket: the CHANGELOG bullet says "A degraded panel now recovers on the next valid change", and the regression test's own comment (`sidebarInitiative.test.ts:284`) names "an undo" as the recovery case — the test only passes because nothing was written before the degrade.
- Fix (verified: P1 green, 70/70 across sidebar suites + probes, `sc288-r1-review-p1-fixprobe.log`): in `notifyAnchorLost`, after `this.anchorLostNotified = true;` add `this.lastWritten = null;` — once the block is lost, nothing on screen reflects our write, so any reappearance is external. Add a P1-shaped regression test to `sidebarInitiative.test.ts` (panel write → delete → restore exact post-write bytes → attribute null, one initiative root). Alternative if the owner rules it out of scope: file a Backlog ticket and soften the CHANGELOG wording to "once the block is edited again".

### LOW-1 — the remount-branch `forgetMountedChild()` has no test, yet it fixes a real bug

- Where: `src/framework/sidebar/SidebarPanel.ts:238`.
- Mutation: deleting that one line leaves the full suite green (3939 passed / 1 skipped / 3940, `sc288-r1-review-mutant-remount.log`).
- What it fixes (P2, red on base): valid block → external edit that fails to parse (fast path's `prepareModel` throws → remount → pipeline error card, no `addChild`) → before the fix `mountedChild` still pointed at the removed view, so the next valid edit took the fast path against it and the error card never cleared. So the fix closes a second user-visible "stuck" state the ticket didn't name.
- Fix: add a P2-shaped test (append `\nmalice: [unterminated` to the body → error card → restore → error card gone, `Frodo Baggins` rendered, `lastMountedChild` an `InitiativeView`). Optionally add half a sentence to the CHANGELOG bullet ("…or a block that failed to render after an outside edit…").

### LOW-2 — an anchor loss during a recovery remount re-creates the stale-view state

- Where: `src/framework/sidebar/SidebarPanel.ts:232-245` (remount branch awaits `pipeline.run`) vs `:257-267` (`handleAnchorLost`); `pipeline.ts:682` (`host.addChild(view)` runs after `prepareModel`'s awaits).
- Scenario: panel degraded → block restored (remount branch starts, `pipeline.run` awaiting ref resolution) → block lost again before it finishes. `handleAnchorLost` sees `lastMountedChild === null` (nothing mounted yet) and renders the degrade card, emptying `bodyEl` (detaching the new root). `pipeline.run` then resumes and `addChild`s the view: `lastMountedChild` = a loaded `InitiativeView` whose root is **not in the DOM**, while the panel shows the degrade card. The next valid change takes the fast path against that detached view — exactly SC-288's stuck state. P9 forced interleave: mid-state `{ degraded: 'true', staleChild: 'InitiativeView', staleInDom: false }`, final restore still degraded. Needs two modifies inside one pipeline run, so rare; the implementer's report claims this is "structurally impossible", which it is not.
- Fix (verified: P9 green; P1 only remaining failure, `sc288-r1-review-gate-probe.log`): take the ledger's optional belt-and-braces — `SidebarPanel.ts:214`: `if (refs && validation && prefs && !this.panelEl?.hasAttribute('data-dse-sidebar-unavailable'))`. Degraded then always remounts, and the remount branch unloads the detached view. (A per-call generation token that drops a mount finishing after a newer degrade is the fuller fix; the gate is enough to guarantee recovery.) If adopted, add P9 as a test.

### INFO-1 — doc overclaims

`SidebarBlockHost.ts:247-248`: "`lastMountedChild` is null exactly when nothing is currently mounted (matching this class's own field doc for `mountedChild`)". The field doc (`:90-94`) says nothing about null-when-unmounted, and LOW-2 contradicts "exactly". Suggest: "…so `lastMountedChild` does not outlive a child SidebarPanel removed" and add "null after SidebarPanel removes it (forgetMountedChild)" to the field doc. `handleExternalChange`'s doc (`SidebarPanel.ts:201-206`, "nothing is currently mounted (e.g. the panel was previously degraded)") is now true outside the LOW-2 race.

### INFO-2 — CHANGELOG bullet

It is user-facing, sits correctly as the first bullet under `## 7.0.0 (unreleased…)`, and matches the neighbours' `[FIX] **…** (SC-nnn).` style; the quoted strings match the UI ("Backing block not found — …", "Draw Steel: panel unavailable"). Accuracy depends on MEDIUM-1: fix it, or soften "on the next valid change". "the only way out was to unpin and re-pin" also leaves out that reloading Obsidian (layout restore → fresh mount) recovered it; harmless.

### INFO-3 — fix shape and teardown audit hold up

The only sites that remove the mounted child are the two patched ones. `SidebarPanel.onunload` / `DseSidebarView.removePanel` / `onClose` / `setState` tear down the whole panel with its private host, so no stale reference is ever read again (P7). `mount()`'s degrade paths never `addChild`, so `mountedChild` stays null there (P6). Two panels on one note keep separate hosts and never cross-talk (P5). After recovery, persist writes land in the right block (including a moved block, P4), with the prefix and suffix byte-identical and the anchor kept (P3). No duplicate roots after any cycle.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc288-sidebar-stuck/`)

- Report: `sc288-r1-review-report.md`
- Probe source (scratch): `sc288-probe.test.ts`
- Gate logs: `sc288-r1-review-{tsc,lint,jest,shots,freeze,parity}.log`, `sc288-r1-review-handoff-5x.log`
- Probe logs: `sc288-r1-review-probe-head.log`, `sc288-r1-review-revert.log`, `sc288-r1-review-revert-p2.log`, `sc288-r1-review-mutant-remount.log`, `sc288-r1-review-p1-fixprobe.log`, `sc288-r1-review-probe-p8.log`, `sc288-r1-review-probe-p9.log`, `sc288-r1-review-gate-probe.log`
