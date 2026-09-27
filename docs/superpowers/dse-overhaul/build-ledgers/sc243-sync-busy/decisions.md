# SC-243 decisions ledger — Compendium Sync / Check-for-updates busy state

Worktree: /home/scott/code/steelCompendium/worktrees/sc243-sync-busy (dse branch `sc243-sync-busy`)
Base: dse `develop` c524fd2 (SC-328 fflate landed). Freeze expected `freeze OK (260/260 …)`.

## Ticket text (Scott, verbatim, 2026-08-28 migration of FOLLOWUPS #63)

> **What:** The settings' Sync and Check-for-updates buttons stay enabled while a sync is
> in flight — a double-click starts a second run. Wants a disabled/busy affordance driven
> by the sync service's in-flight state (the SC-140 ManifestStore.onChange seam plus a
> sync-service busy signal would carry it).

## Scott rulings

(none yet — no comments on the ticket as of 2026-09-24)

## Owner rulings (ticket-owner, 2026-09-24) — design, pending Scott's eye on the visual

- O1. The busy signal lives on `CompendiumSyncService` (in-flight state + subscribe/unsubscribe
  listener), not in SettingsTab. The settings row subscribes from its own render and returns
  the unsubscribe as the row cleanup (the SC-140 `mountCompendiumStatus` pattern).
- O2. Busy spans the WHOLE user-initiated sync: `main.syncCompendium`'s prelude
  (reconcile / manifest load / migration detection) plus `syncService.sync`. It clears on
  success, on a thrown error, and when the flow hands off to the migration or legacy-folder
  modal. Syncs launched later from modal callbacks call `syncService.sync` directly and are
  busy for their own duration.
- O3. Correctness guard, not just UI: a sync request while a sync is in flight (double-click
  racing the re-render, command palette, legacy alias command, modal callbacks) does NOT start
  a second run. It shows a Notice and returns. Check-for-updates while any operation is in
  flight likewise does not start.
- O4. While ANY compendium operation (sync or check) is in flight, BOTH buttons are disabled
  (native `ButtonComponent.setDisabled`, host styling — no new CSS). The in-flight button's
  label swaps: `Sync` → `Syncing…`, `Check for updates` → `Checking…`. Labels restore after.
- O5. No change to the non-busy render → shots count unchanged, freeze 260/260 unchanged,
  parity unchanged. A freeze move is a red, not a rebaseline.
- O6. Visual evidence (settings Compendium section at rest and mid-sync, real Obsidian) goes
  to Scott in one Needs Review ask per session rule (visual change needs his eye).

## Base moves

- 2026-09-24: dispatcher reports origin/develop now 6c4f6aa (SC-282 landed; freeze still 260). Implementer r1 told to rebase before final gates.

## Round log

- r1 impl (implementer): DSE 7a70c17 + e8d5274 on 6c4f6aa; ws 5bcdd27. Gates: jest 4017/1/208 of 209 (base 3997/1/206 of 207); lifecycle 6/6; shots 524/0 FAIL; freeze 260/260; parity 0/0/16. Untracked visual-harness/sc243-evidence.mjs must be resolved before land-ready.
- Owner eyeball (dark rest vs mid-sync): native disabled dimming is subtle (Sync goes a darker shade, labels dim); `Syncing…` widens the button and wraps the row description to two lines mid-sync. Both go to Scott as taste calls.
- r1 review dispatched (reviewer, independent identity).
- r1 impl follow-ups pending ruling after review: (F1) settings-evidence.mjs broken in fresh sandbox (no pinned-asar copy); (F2) two concurrent shoot.mjs observed during shots. Drive-by: FakeButton.setDisabled + disabled click suppression in test/mocks/obsidian-core.ts.
- 2026-09-24: SC-338 pkill incident (17:12–17:20 ET) checked — sc243 final shots run is complete (single run, PNGs 17:24–17:29, all shots written); no re-run needed; reviewer re-runs shots+freeze independently regardless.

## Review r1 rulings (owner, 2026-09-24) — reviewer verdict APPROVE-WITH-FIXES, 0 HIGH/MEDIUM
- L1 (legacy-modal choice trashes root before the lock): FOLD, required. Also apply the same lock-first pattern to `syncAnyway` (reviewer's optional note) — FOLD.
- L2 (`sync()` trusts any heldToken): FOLD — reject a token that is not the live busyToken.
- L3 (opRow build typed `=> void` but returns cleanup): FOLD — widen type.
- L4 (Syncing… widens button → description wraps, row +16px; light-theme disabled look faint): SCOTT'S ASK.
- I1: no action (return change justified). I4 (isBusy test-only): DROP — harmless test seam.
- I2 → filed SC-357 (migration unguarded vs sync). OUT OF SCOPE for SC-243.
- I3 → filed SC-358 (prelude errors silent / unhandled rejections). OUT OF SCOPE.
- I6 + impl F1 → filed SC-359 (settings-evidence.mjs env fixes). sc243-evidence.mjs copied to ledger `evidence-tool/`; must be removed from the DSE tree (never committed).
- impl F2 (two concurrent shoot.mjs): DROP — coincided with SC-338's concurrent shots runs and pkill incident; reviewer's shots run was clean.
- fix r1 (implementer, author of r1): DSE 50b3b1d (L1) 99264eb (L2) 7af05c2 (L3); jest 4021/1/208 of 209; lifecycle 6/6; shots 524/0; freeze 260/260; tree clean; evidence script removed. Scoped re-review dispatched to r1 reviewer (did not author).
- fix r1 re-review (reviewer): APPROVE. Rulings: F1 (idle tests stub sync, token handoff unasserted) FOLD; F2 (stale token docs main.ts:668-675, CompendiumSyncService.ts:270-273) FOLD; F3 (duplicate JSDoc on opRow) FOLD. Fix round 2 -> implementer; scoped re-review -> reviewer.
- fix r2 (implementer): DSE 284a9a1 (F1) 6014635 (F2) 2dad7d8 (F3); jest 4022/1/208 of 209 (one load flake in untouched sidebarInitiative re-ran clean); mutation-red confirmed; tree clean. Final scoped re-review -> reviewer.
- fix r2 re-review (reviewer): APPROVE, no findings. DSE 2dad7d8 on develop 6c4f6aa (verified tip at 2026-09-24 ~22:15 UTC). Workspace branch 5bcdd27 is behind origin/main a683ff0 (no CHANGELOG overlap; land-stack handles).
- 2026-09-24: Needs Review ask posted (L4: busy look — options A ship as shown / B fixed-width Sync button / C disable only, no label swap; plus optional stronger disabled look). State In Progress + Needs Review. PARKED.

## Scott rulings (verbatim)
- 2026-09-25 18:28 UTC, SC-243 comment 6237edbe, on the busy-look ask (A ship as shown / B fixed-width / C disable only):
  > Option A is fine
  → Ship as shown. No stronger-disabled CSS (not requested). No visual work remains.

## Resume 2026-09-25
- Base moved: origin/develop 619c4bd (SC-282, SC-340 view adoption landed). Freeze 260. obsidian-lifecycle now 19 scenarios. Rebase + full battery -> implementer.
- 2026-09-25 ~17:15: implementer killed by session usage limit before rebase started (tree untouched at 2dad7d8).
- 2026-09-27: resumed. No new Scott comments since "Option A is fine". Rebase round re-sent to implementer (resume).
- 2026-09-27 rebase round (implementer): DSE e9bc15e on origin/develop 619c4bd, 0 conflicts, range-diff vs 2dad7d8 all "=" (owner-verified; no re-review needed). jest 4063/1/210 of 211; lifecycle 19/19; shots 524/0; freeze 260/260; parity 0/0/16; tree clean. LAND-READY.
