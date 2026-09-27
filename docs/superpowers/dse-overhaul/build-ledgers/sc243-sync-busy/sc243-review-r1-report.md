# SC-243 independent review — round 1

## Executive summary

**Verdict: APPROVE-WITH-FIXES.** Nothing HIGH or MEDIUM. The lock is correct: it is acquired synchronously before the first `await`, so a double-click in one tick starts exactly one run (probe P1 drives the real button handler). Every sync entry point I probed is refused while busy: button, both commands, `syncAnyway`, `syncAfter`, the legacy-modal choice, and the search-modal CTA, which also goes through `syncCompendium`. No entry point refuses itself. Busy clears on success, on a throw in the prelude (reconcile, load or isPending) or in sync, on modal hand-off, on a check that throws, and on unload mid-sync. Listener lifecycle is clean.
One fix is required: **L1**. `LegacyCompendiumModal`'s choice trashes the root folder *before* the guard, so a refused choice can still trash the folder a running sync is writing into.
Two cheap hardenings are recommended: **L2** (validate `heldToken`) and **L3** (the type of opRow's cleanup).
**L4** is a visual note for Scott's Needs Review ask: "Syncing…" wraps the row description, so the row grows 16px while syncing.
The `sync()` return change (`SyncReport | null`) was justified. No src caller reads the return value, so none can treat a refusal as success.
Gates re-run by me: tsc and lint are clean. Jest: 4017 passed, 1 skipped, 208 of 209 suites. Lifecycle: 6/6. Shots: 524, 0 FAIL. Freeze OK 260/260. Parity was skipped (reason below). Red-check: 17 failed plus 1 suite that failed to load.

Diff reviewed: DSE `sc243-sync-busy` `7a70c17`+`e8d5274` on `origin/develop` `6c4f6aa`; workspace worktree `5bcdd27` (CHANGELOG only). No AI-attribution trailers in any of the 3 commits.

## Findings

### L1 (LOW, fix required): legacy-modal choice trashes the root outside the lock
- `main.ts:726-732`. The `onChoice` callback runs `await this.app.fileManager.trashFile(root)` first, and only then calls the bare `syncService.sync(...)`, where the guard sits.
- Failure scenario: a sync is in flight when the user picks "trash old root and sync". The configured root is the same folder that sync is writing into, and it gets trashed under the running sync. After that, this choice's own sync is refused with `SYNC_BUSY_NOTICE`. Probe P5 proves the ordering: the lock is held, `onChoice(true)` still calls `trashFile(folder)`, and the busy Notice follows.
- Reachability is low. It needs a second sync to start while the legacy modal is open, for example a hotkey or the command palette during the modal. But the step is destructive, and B3 says modal callbacks start "NO second run".
- Fix: take the lock at the top of the callback:
  - `const t = this.syncService.beginOperation('sync')`
  - if `t` is null: `new Notice(SYNC_BUSY_NOTICE)` and return
  - otherwise, in `try { if (trashOldRoot) await trashFile(root); await this.syncService.sync(this.syncOptions(), t); } finally { this.syncService.endOperation(t); }`
- Optionally apply the same pattern to `syncAnyway` (`main.ts:801-806`). It calls `markSettled(root)` before its guarded sync. On refusal the offer is settled anyway. That is harmless in practice, because the concurrent sync creates the destinations anyway, which is why this is not a separate finding.

### L2 (LOW, hardening): `sync()` trusts any `heldToken`
- `src/data/CompendiumSyncService.ts:280`: `heldToken ?? this.beginOperation("sync")` never checks that `heldToken === this.busyToken`.
- Failure scenario: a stale token, or a caller-supplied token after release, runs a completely unguarded sync while another operation holds the lock. Probe P10: a released `sync` token is passed while a `check` holds the lock, the network is hit, and no busy Notice appears.
- There is no live bug today. The only caller that passes a token is `syncCompendium`, and its token is live.
- Fix: `if (heldToken !== undefined && heldToken !== this.busyToken) { new Notice(SYNC_BUSY_NOTICE); return null; }`. Throwing is also acceptable.

### L3 (LOW, type hygiene): opRow's cleanup travels through a `void` return type
- `src/views/SettingsTab.ts:107`: `opRow(..., build: (setting: Setting) => void)`. The Sync row is the first opRow that returns a cleanup. Obsidian does keep and call it: `toDefinition` → `asCleanup` passes it through, and the probe P8 listener counts show 1→0 on close and 1 after reopen or re-render.
- The problem is the type. `opChrome`'s own doc (`SettingsTab.ts:114-118`) says a `void` return position must not carry a cleanup implicitly.
- Fix: widen `build` to `(setting: Setting) => void | (() => void)`. No behavior change.

### L4 (LOW, visual, for Scott's Needs Review ask; no code action unless he wants one)
- Evidence `sc243-compendium-mid-sync-{dark,light}.png` is 728×209, against 728×193 at rest and mid-check. "Syncing…" is wider than "Sync", so the row description wraps to two lines, and the row grows 16px and jumps when a sync starts and ends. "Checking…" does not reflow.
- In light theme, the disabled Check button that is *not* in flight (mid-sync) barely differs from enabled: only the text greys slightly. Dark is clearer.
- Both come from host styling under O4 (no new CSS). If Scott dislikes either, the lever is a CSS `min-width`, which needs a ruling change to O4.

### INFO
- **I1, return-type change (brief extra item 1): justified.** The bare-call refusal path needs a result that neither throws nor looks like a report, and `SyncReport | null` is the minimal typed signal. The alternative, throwing a BusyError, would route every refusal into callers' error Notices and unhandled rejections. No src caller consumes the return value: `main.ts:717,731,737,804,810` all discard it. `syncCompendium` resolves `void` on refusal, and nothing that calls it acts afterwards: Sync button, both commands, `CompendiumSearchModal` CTA `:137`. So no caller treats a refusal as success. The 9 repairs are 6 `!` in `compendiumSyncRelease.test.ts` plus 3 `syncService` mocks in `settings-tab.test.ts`, which now use `fakeSyncService()`. All are minimal, with no assertion weakened.
- **I2, pre-existing, out of O2/O3 scope: migration work is not guarded.** The `migrate-compendium-layout` command (`main.ts:580`) and the migration modal's `run` (`migrationService.execute`) can both run concurrently with a sync. By the O2 ruling, busy clears at hand-off. A sync that starts mid-migration creates destinations and blocks the remaining moves. Backlog candidate.
- **I3, pre-existing: unhandled rejections.** `void this.plugin.syncCompendium()` on the Sync button and `void this.syncService.sync(...)` in `syncAfter`/`syncAnyway` reject after `sync()` has already shown its Notice. Errors in the prelude (reconcile, load or isPending) show no Notice at all. This is not a regression. Jest surfaced it when my probe drove an idle `syncAfter` run to failure.
- **I4:** `CompendiumSyncService.isBusy()` (`:95`) has no src caller; only tests use it. Harmless.
- **I5:** Obsidian's real `refreshDomState` cannot re-enable the buttons mid-sync. I checked the 1.14.2 asar: `G6` calls `setting.setDisabled` only when the definition declares `disabled` or `control.disabled`, and the Sync row declares neither. Real `ButtonComponent.setDisabled(false)` sets only `buttonEl.disabled=false` plus `mod-disabled`/`aria-disabled` toggles, and these are no-ops at rest. So the at-rest DOM equals develop's, which matches B6 and the evidence.
- **I6, evidence script (brief extra item 2):** `visual-harness/sc243-evidence.mjs` (untracked, left untouched) is not reusable as-is: the busy kinds, token and clip are hard-coded for SC-243. Its two environment fixes should be ported into `settings-evidence.mjs`, as the implementer's follow-up proposes:
  - copy the newest `~/.config/obsidian/obsidian-*.asar` into the isolated user data dir
  - call `app.plugins.setEnable(true)` to escape restricted mode

  When porting, note that its asar pick uses a lexicographic `.sort()` (`:158-160`), which would choose `1.14.2` over a future `1.14.10`. Use a version-aware sort.

## Probes (execute, not read)

The probe file was `test/dom/framework/zz-sc243-review-probe.test.ts`, run against the real `onload()` plugin and real `DseSettingTab`. It was deleted after the run; an archived copy is kept (path below). **12/12 passed**, and the two probes that document findings assert the problem behavior.

| # | Probe | Result |
|---|---|---|
| P1 | Real Sync `clickCb` invoked twice in one tick (bypassing disabled) | 1 reconcile, 1 release request, busy Notice shown; buttons show `Syncing…`, both disabled; check handler refused with its own Notice; everything restored after the run |
| P2 | `sync-compendium` + legacy alias commands mid-run | both refused (2 busy Notices), 1 reconcile |
| P3 | Prelude throw from `reconcile`, `manifestStore.load` or `isPending` | busy clears; next sync not refused |
| P4 | Migration hand-off | busy=`sync` during `plan()`, cleared after modal open; `syncAnyway`/`syncAfter` refused mid-run with no network calls; `syncAfter` when idle holds its own busy span |
| P5 | Legacy hand-off | busy cleared; **`onChoice(true)` while locked trashes the root, then is refused (L1)** |
| P6 | Check button with network 403 | `Checking…` + Sync disabled during the check; restored after; error Notice |
| P7 | Throwing busy listener | sync unaffected, lock clears, `console.error` logged |
| P8 | Settings opened mid-sync / closed / reopened / re-rendered | disabled on open; listeners 1→0→1; no build-up on re-render; re-enabled live at the end; 0 after close |
| P9 | `plugin.onunload()` mid-sync | no throw; run settles; lock clears |
| P10 | Stale `heldToken` | **runs unguarded while `check` holds the lock (L2)** |

**Red-first:** I restored `main.ts`, `CompendiumSyncService.ts` and `SettingsTab.ts` to `origin/develop` while keeping the new tests. Result: 17 tests failed, 3 of 4 suites failed (including `syncCompendiumBusy` failing to load), 70 passed. `B6` passes both ways by design. I then restored the source from HEAD.

## Gates (measured at `e8d5274`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | **4017 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0 (load average about 3–5) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0. Run because `main.ts` changed; confirms the plugin loads in real Obsidian 1.14.2 |
| `npm run shots` | 524 PNGs, 0 FAIL (the only "FAIL" matches are `montage-failed` fixture names), exit 0 |
| `check-freeze.sh` | `freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0 |
| `npm run parity` | **skipped**: the diff touches no CSS, element DOM or selector-map; the settings UI is not a parity surface |

The numbers match the implementer's report exactly.

## Working tree

`git status --porcelain` in the DSE clone showed `?? visual-harness/sc243-evidence.mjs` both before and after. The superproject worktree showed ` M draw-steel-elements` both before and after (a pre-existing pointer change). Nothing was committed. The ignored `main.js`/`styles.css` files were rebuilt by lifecycle/shots, as they are in any battery run.

## Artifacts

Logs and the archived probe are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc243r/`:
- `tsc.log`
- `lint.log`
- `jest.log`
- `jest-red.log`
- `probe.log`
- `lifecycle.log`
- `shots.log`
- `freeze.log`
- `zz-sc243-review-probe.test.ts`
