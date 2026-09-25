# SC-282 round 2 — fix-round report (implementer identity A, resumed)

## Executive summary

- Status: **DONE**. All FOLD items from the r1 review ruling closed: MEDIUM-1 (deferred
  leaves), MEDIUM-2 (test gaps — P1/P2/P4/P6 added, both surviving mutations now fail),
  LOW-1 (stable `blockKey`), LOW-2 (ENOENT rejection caught), LOW-3 (wrong comment fixed),
  plus the `DseSidebarView.ts:118-122` comment and CHANGELOG wording (INFO-5).
- MEDIUM-1 fix: `registration.ts`'s `registerDseSidebar` now also registers a **plugin-scoped**
  rename/delete pair (D3's literal shape) that patches a *deferred* sidebar leaf's persisted
  state via the public `View.setState` — verified by the r1 review to work in real Obsidian
  1.14.2 without loading the view. My round-1 "no API exists" follow-up was wrong; ratified.
- 6 new tests (13 total in `sidebarRename.test.ts`): P1/P2/P4/P6 (write-back, non-identity
  rename, real folder-event order, folder-delete sibling) + 2 deferred-leaf tests. Both
  mutations the review found surviving (delete-side bare `startsWith`, `rebindPath` removed)
  now **fail** — verified live, logs kept.
- No RN-4 real-Obsidian lifecycle scenario added — optional per the ticket-owner's message;
  reasoning below.
- Base unchanged: `origin/develop` still `c524fd2` (confirmed via `git fetch` — no rebase).
- Gates (head `6898b84`): tsc/lint clean; jest **3996 passed / 1 skipped / 3997 total, 206 of
  207 suites** (net **+6** over r1's 3990, exactly the new tests, 0 regressions, no flake);
  obsidian-lifecycle **6/6 ok, 0 failed**; shots **524, 0 FAIL**; freeze **260/260 byte-
  identical, 0 frozen bytes moved**; parity **0 gap(s), 0 undeclared warning(s), 16 declared
  deferral(s), exit 0**.
- Two mid-round interruptions (a session usage-limit reset, then a network outage) — both
  resumed cleanly from committed state; no work lost. The one artifact that landed near the
  outage (`sc282-r2-shots.log`) was independently verified complete (524/524 `ok` lines,
  terminal `EXIT:0`) before being trusted, rather than blindly re-run.

## Scope (from the ledger's "r1 review rulings")

FOLD: MEDIUM-1, MEDIUM-2, LOW-1, LOW-2, LOW-3, INFO-5. OUT OF SCOPE (per the ticket-owner):
INFO-2, INFO-4, INFO-6 (no action); INFO-3 (pre-existing `modify`-listener leak, filed
separately as SC-354 — not touched).

## Per-finding: what changed

### MEDIUM-1 — deferred sidebar leaves now follow rename/delete

**File:line:** `src/framework/sidebar/registration.ts` — new `patchDeferredSidebarLeaves`
function (after `registerDseSidebar`) + two `plugin.registerEvent(services.app.vault.on(...))`
calls added inside `registerDseSidebar`, right after `plugin.registerView(...)`.
`src/framework/sidebar/DseSidebarView.ts` — `renamedPanelPath`/`isUnderDeletedPath` changed
from module-private to `export`ed (no behavior change), and the `registerVaultListeners` doc
comment corrected (no longer claims deferred leaves are an unfixed follow-up).

**What it does:** on every vault rename/delete, in addition to each loaded `DseSidebarView`'s
own listener, a plugin-scoped listener iterates `app.workspace.getLeavesOfType
(VIEW_TYPE_DSE_SIDEBAR)`, skips any leaf whose `view` is already a loaded `DseSidebarView`
(that one's own listener already handles it), and for every other leaf (a deferred one, by
construction — Obsidian never returns anything else from `getLeavesOfType` for this type), reads
its `getState()`, rewrites/drops each panel via the SAME `renamedPanelPath`/`isUnderDeletedPath`
matchers the loaded-view path uses, and calls the leaf's public `view.setState(patched,
{ history: false })` if anything changed — the r1 review's real-Obsidian probe (RN-4) proved
this stores the new state on Obsidian's `DeferredView` without loading it. One
`requestSaveLayout()` call if any leaf changed.

**Why plugin-scoped, not view-scoped:** a deferred leaf has no loaded view instance for a
Component-scoped listener (`this.registerEvent`) to run on — D3's `registerEvent(vault.on(...))`
shape is copied at the PLUGIN level here instead, exactly as `SccResolver`/`CompendiumIndex`
already do it.

### MEDIUM-2 — test gaps closed

**File:** `test/dom/framework/sidebarRename.test.ts`. Four tests added (adapted from the
review's probe file into this file's own conventions — `note()`/`expectWritten()` helpers,
`increaseButton()`/`counterValue()` DOM helpers, `withRealVaultEvents` gained `fireModify`):

- **P1** — after a rename, clicking Increase writes to the NEW path (prose intact, anchor
  intact, no ghost content at the old path, `modifyCalls` only at the new path), and a
  further external edit to the renamed note is still tracked by the mounted panel.
- **P2** — a rename where the vault hands back a genuinely different `TFile` OBJECT (not the
  same instance mutated in place — simulated by deleting the old file and creating a new one
  at the new path) still writes correctly. This is the one test that actually exercises
  `rebindPath`'s effect: without it, this test fails (confirmed — see Mutations below).
- **P4** — real Obsidian's folder-rename event order (the folder's own "rename" event fires
  BEFORE any descendant is re-keyed — confirmed in real Obsidian by the r1 review's RN-2
  probe): fires the folder event first (asserting the panel already reflects the new path from
  the prefix match alone), THEN the child's own rename event, then a write.
- **P6** — an unrelated delete requests no layout save (a true no-op, not just "no visible
  change"); a folder delete spares a string-prefix sibling (`Foo/BarBaz.md` vs folder
  `Foo/Bar`) and is idempotent whether the per-child delete or the folder delete fires second.

### Mutations re-verified (both now FAIL — logs kept)

Applied each of the r1 review's two surviving mutations, ran `sidebarRename.test.ts`, confirmed
a failure, then reverted (`git checkout HEAD -- <file>`, `git status` clean after each):

| Mutation | File:line | Before (r1) | After (r2) | Log |
|---|---|---|---|---|
| Delete-side bare `startsWith(file.path)` (no trailing-slash guard) | `DseSidebarView.ts` `isUnderDeletedPath` | 7/7 pass (unpinned) | **P6 fails** — `Foo/BarBaz.md` incorrectly removed by a delete of folder `Foo/Bar` | `sc282-r2-mutation-delprefix.log` |
| `rebindPath` call deleted | `SidebarPanel.ts` `handleFileRenamed` | 7/7 pass (unpinned — mock preserved TFile identity in every other test) | **P2 fails** — write lands at the OLD (deleted) file, new path stays at `current_value: 3` instead of `4` | `sc282-r2-mutation-norebind.log` |

### LOW-1 — stable `blockKey`

**File:line:** `src/framework/host/SidebarBlockHost.ts` — new `private readonly sessionKey:
string` field, assigned once in the constructor from the ORIGINAL `backingFile.path` (before
any `rebindPath` call can ever run); `blockKey()` now returns `this.sessionKey` instead of
rebuilding `${this.backingFile.path}::${this.alias}::${this.anchorId}` live. Not separately
unit-tested this round (the review's own probe P11, which caught the drift, was a
record-only probe, not a committed test — folding it in wasn't in the ledger's FOLD list, and
the existing `sidebarBlockHost.test.ts`'s `blockKey is filePath::alias::anchorId` test still
passes unchanged, confirming the pre-rename value is unaffected).

### LOW-2 — persist rejection caught

**File:line:** `src/framework/view.ts`, `flushPersist` (~line 291). `replaceSource(yaml)`'s
promise chain now has a `.catch(() => { for (const resolve of waiters) resolve(false); })`
appended after the existing `.then`, so a rejection (e.g. `vault.process` throwing ENOENT when
the backing file was deleted while a write was in flight — D2's unload-triggered flush makes
this reachable, though the underlying class of bug predates SC-282, confirmed by the review at
base `c524fd2`) resolves every coalesced `persist()` waiter with `false` instead of leaving them
unresolved with an unhandled rejection. Fixed at the shared `ElementView.flushPersist` call
site (not `SidebarBlockHost`-specific), so every `BlockHost` implementation benefits, not just
the sidebar's.

### LOW-3 — corrected comment

**File:line:** `src/framework/sidebar/SidebarPanel.ts`, `handleFileRenamed` (~line 124). The
comment claiming a post-rename `TFile` lookup miss is "not expected in practice" was wrong: it
is the NORMAL case for every folder rename in real Obsidian (the folder's own rename event
fires before any descendant's vault entry is re-keyed — RN-2). Replaced with an accurate
explanation of why `rebindPath` not running on that particular call is harmless (Obsidian keeps
`TFile` identity stable, so the very next per-child event lands on the same object), and why the
call stays anyway (a direct file rename's `file` argument IS already fresh and always resolves;
a non-identity-preserving vault — including our own jest mock's `FakeVault.rename`, and P2's
even-more-adversarial fresh-object case — needs it).

### DseSidebarView.ts:118-122 comment + CHANGELOG (INFO-5)

Both corrected as part of the MEDIUM-1 commit: the view-listener doc no longer calls deferred
leaves an unfixed follow-up (it now points at `patchDeferredSidebarLeaves`); the CHANGELOG
entry gained a sentence naming background/collapsed sidebar tabs explicitly, since the claim
"follows its note... instead of turning into a permanent Note not found card" is only fully
true once MEDIUM-1 closes that gap.

## Why no RN-4 real-Obsidian lifecycle scenario

Left out this round, per the ticket-owner's "if it is cheap" framing. Judgment call, same
reasoning as round 1's original assessment of the (then-unproven) deferred-leaf gap, updated
for what changed:

- The mechanism is now independently proven twice over without it: the r1 review's own
  real-Obsidian scratch harness (RN-4, `sc282-r1-review-obsidian-probe.log`, 4/4 ok) already
  verified the EXACT mechanism this round's fix implements (public `View.setState` on a
  `DeferredView`, real Obsidian 1.14.2) end to end — control (bug reproduces) and patch
  (fix works) both — and the 2 new jest tests pin the same contract at the unit level against a
  faithful stand-in of that same public API shape.
- Porting it means importing new production-harness surface into `visual-harness/
  obsidian-lifecycle.mjs` — new FIXTURES, new `window.__lc.ren`/`del` event-order tracking,
  new `SB`/`panelsOf` helpers, and the scenario itself — a real, ongoing maintenance
  commitment to a shared file every future DSE round runs, not a one-off assertion. That is a
  legitimate scope decision, not a 20-minute port, even with the reviewer's version to start
  from.
- The gate expectations the ticket-owner gave explicitly treat 6/6 as the passing outcome
  ("lifecycle 6/6 (7/7 if you add RN-4)") — 7/7 was offered, not required.

If the owner wants it landed as permanent coverage, it's a clean, low-risk follow-up: the
reviewer's `sc282-r1-review-probe-obsidian.mjs.txt` already contains a working, real-Obsidian-
verified `RN-4` scenario (lines ~423-462) that can be ported close to verbatim.

## Gates

Base: `origin/develop` `c524fd2` — confirmed unchanged via `git fetch origin` at the start of
this round (no rebase needed). Devbox wrapping / gate-command-last / `rm -f main.js styles.css`
before jest, per `dse-verify`, throughout.

| Gate | Result | Log |
|---|---|---|
| 1. tsc | clean, exit 0 | `sc282-r2-tsc.log` |
| 2. lint | clean, exit 0 | `sc282-r2-lint.log` |
| 3. jest | **3996 passed / 1 skipped / 3997 total, 206 of 207 suites**, 0 failures. Delta over r1 head (3990/1/3991): **+6**, exactly the new tests. No `sidebarEncounterHandoff` flake. | `sc282-r2-jest.log` |
| 4. obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (own Xvfb `:160`, port 9262) | `sc282-r2-obsidian-lifecycle.log` |
| 5. shots | 524 captures, 0 FAIL, every in-run gate OK. **Verified independently** after a mid-run network-outage concern from the ticket-owner: read the log directly, confirmed 524/524 `ok` lines and a terminal `all shots written` / `EXIT:0` (not truncated) — trusted rather than re-run. | `sc282-r2-shots.log` |
| 6. freeze | `freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0 — **0 frozen bytes moved this round** | `sc282-r2-freeze.log` |
| 7. parity (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | `sc282-r2-parity.log` |

Mutation logs: `sc282-r2-mutation-delprefix.log`, `sc282-r2-mutation-norebind.log` (see table
above).

## Commits

Branch `sc282-sidebar-rename`, still on `origin/develop` `c524fd2` (no rebase this round).

1. `4181343` — `fix(sidebar): SC-282 r2 — deferred leaves follow rename/delete; stable session key; catch persist rejection` (MEDIUM-1, LOW-1, LOW-2, LOW-3, the two comment fixes, CHANGELOG)
2. `6898b84` — `test(sidebar): SC-282 r2 — write-back, real folder-event order, delete-prefix, non-identity rename, deferred-leaf coverage` (P1/P2/P4/P6 + 2 deferred-leaf tests, `withRealVaultEvents` gains `fireModify`)

Head sha: `6898b84`. No AI/Claude co-author trailers, per the brief.

Files changed this round (`git diff c524fd2..6898b84 --stat` minus round 1's own 6 files —
i.e. new/further-touched this round):
```
CHANGELOG.md                             |  further edited (INFO-5 wording)
src/framework/host/SidebarBlockHost.ts   |  further edited (LOW-1 sessionKey)
src/framework/sidebar/DseSidebarView.ts  |  further edited (export the two matchers, comment fix)
src/framework/sidebar/SidebarPanel.ts    |  further edited (LOW-3 comment)
src/framework/sidebar/registration.ts    |  new: patchDeferredSidebarLeaves + wiring (MEDIUM-1)
src/framework/view.ts                    |  new: flushPersist .catch (LOW-2)
test/dom/framework/sidebarRename.test.ts |  +6 tests, +fireModify, +note()/expectWritten() helpers
```

## Drive-by fixes

None beyond the ledger's explicit FOLD list (all of which are reviewer findings, not
independently-discovered drive-bys).

## Follow-ups

- Optional RN-4 real-Obsidian lifecycle scenario (see "Why no RN-4" above) — the reviewer's
  proven scenario is ready to port if the owner wants it as permanent coverage.
- SC-354 (INFO-3, pre-existing `modify`-listener leak) — already filed by the owner, out of
  scope here, not touched.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r2-fix-report.md`
- Ledger read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/decisions.md`
- Review read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r1-review-report.md`
- Gate logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/`):
  - `sc282-r2-tsc.log`, `sc282-r2-lint.log`
  - `sc282-r2-jest.log` (3996/1/3997)
  - `sc282-r2-obsidian-lifecycle.log` (6/6 ok)
  - `sc282-r2-shots.log` (524, 0 FAIL — independently verified complete)
  - `sc282-r2-freeze.log` (260/260)
  - `sc282-r2-parity.log` (0/0/16)
  - `sc282-r2-mutation-delprefix.log`, `sc282-r2-mutation-norebind.log`
- Changed files (worktree `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename/draw-steel-elements`):
  - `src/framework/host/SidebarBlockHost.ts`
  - `src/framework/sidebar/DseSidebarView.ts`
  - `src/framework/sidebar/SidebarPanel.ts`
  - `src/framework/sidebar/registration.ts`
  - `src/framework/view.ts`
  - `test/dom/framework/sidebarRename.test.ts`
  - `CHANGELOG.md`
