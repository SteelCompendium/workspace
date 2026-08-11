# SC-140 — "No compendium synced" after a sync: fix report

**Branch:** `sc140-sync-status` (worktree `/home/scott/code/steelCompendium/worktrees/sc140-sync-status`)
**Commit:** `8278f40` — `fix(settings): sync status line updates live when a sync finishes (SC-140)`
**Base:** dse `e141582`
**Status:** fixed, full dse-verify battery green, no shot moved.

---

## 1. Root cause

The compendium sync-status line is a **label-less chrome row that read the manifest exactly
once, at mount**, with no way for anything to tell it the state moved:

- `src/views/SettingsTab.ts:504-510` (pre-fix) — the row's body created the `<p
  class="ds-compendium-status">` and fired `void this.renderCompendiumStatus(statusEl)`.
- `src/views/SettingsTab.ts:589-596` (pre-fix) — `renderCompendiumStatus()` awaited
  `manifestStore.load()` once and `setText()` the result. No subscription, no second read.
- `src/data/manifest.ts:71-79` (pre-fix) — `ManifestStore.save()` wrote the file and told
  nobody. It was the only writer's only side effect, so the sync completing was invisible to
  any view.

The reason "read once at mount" is fatal here is the SC-131 declarative settings contract,
documented at `src/views/SettingsTab.ts:103-119`: **obsidian 1.13 calls
`getSettingDefinitions()` only from `update()`, caches the tree into `settingItems`, and
re-renders from that cache.** Nothing re-derives, and nothing polls. So the row's single read
happened when the Compendium page was mounted, and the only thing that produced a fresh read
was a teardown + remount — i.e. exactly Scott's workaround of closing and reopening the
settings window. During a sync started from the very button one row below, the line kept
saying `No compendium synced yet.`

Secondary enabler: `NavRow.chrome` was typed `(container: HTMLElement) => void` and its
mapping at `src/views/settingsDeclarative.ts:82-92` discarded the return value — so a chrome
row *could not* own a subscription even if it wanted one, because it had nowhere to hand back
the teardown. (`render` and `renderPreview` rows both already ride obsidian's per-mount
cleanup contract via `asCleanup`, `settingsDeclarative.ts:120`.)

## 2. The fix

Three small changes, no new settings architecture — the row now uses the same per-mount
render/cleanup contract SC-131 built for the live preview.

**a. Make the manifest observable — `src/data/manifest.ts`**

```ts
export type ManifestListener = (manifest: CompendiumManifest | null) => void;
public onChange(listener: ManifestListener): () => void   // returns unsubscribe
```

`save()` notifies **after** the write lands (a subscriber that repaints must never show a
manifest the disk doesn't have). `notify()` contains a throwing listener behind
`console.error` so a broken view can neither fail the sync that triggered it nor rob its
fellow listeners.

Every manifest writer already funnels through `save()` —
`CompendiumSyncService.applySync` (`CompendiumSyncService.ts:171`) and the SC-125 migration's
adoption (`CompendiumMigration.ts:686`) — so **all** paths that can change the displayed
state refresh the line: the settings Sync button, the command palette's sync commands, the
first-run legacy prompt's "sync anyway", and a migration adopting files. Neither writer knows
a view exists.

**b. Let a chrome row own a teardown — `src/views/settingsDeclarative.ts`**

`NavRow.chrome` is now `(container: HTMLElement) => void | (() => void)` and its definition
returns `asCleanup(chrome(setting.infoEl))`, identical to how `render`/`renderPreview` rows
are mapped. `opChrome()` in `SettingsTab.ts` was widened to match, deliberately spelled out
rather than left in a `void` return position (a `void` return type silently swallows a
returned value — precisely the ambiguity that must not exist on a cleanup contract).

**c. The status row becomes a live mount — `src/views/SettingsTab.ts`**

`renderCompendiumStatus()` (async, fire-and-forget) is replaced by
`mountCompendiumStatus(el): () => void`:

- subscribes to `manifestStore.onChange` and repaints on every notification;
- still does the initial async `load()` for the state at mount time;
- carries a **generation guard** so a notification (or a teardown) that beats the in-flight
  `load()` is not clobbered by that now-stale read when it resolves;
- returns `() => { generation++; unsubscribe(); }` as the mount's cleanup — the subscription
  dies with the `<p>` it writes into, and never outlives a page navigation or a settings
  close.

The rendering itself moved into a pure `compendiumStatusText(manifest)`, so the first read and
every live update render the same sentence by construction.

## 3. Reproduction / can-fail proof

The four new DOM tests were run against the **unfixed** row (fix reverted in
`src/views/SettingsTab.ts` only, keeping the new seam so the suite compiles). Verbatim:

```
FAIL dom test/dom/views/settings-tab.test.ts
  ● F2 Task 11 — Compendium operational section › SC-140 — live sync status › a sync completing with the settings window open updates the status line

    expect(received).toContain(expected) // indexOf

    Expected substring: "v4.20260810T120000"
    Received string:    "The compendium syncs into a folder in your vault. Only files installed by the plugin are updated or removed — your own notes in that folder are never touched.No compendium synced yet."

  ● … › the manifest going away reverts the line to the never-synced state
    Expected substring: "No compendium synced yet."
    Received string:    "…v4.20260716T000000 · 3 files · synced 2026-07-15"

  ● … › the subscription is per MOUNT: closing drops it, reopening re-reads the current state
    expect(store.listenerCount()).toBe(1) → Received: 0

  ● … › a sync landing before the first read resolves is not clobbered by it
    Expected substring: "v4.fresh"
    Received string:    "…Loading sync status…"

Tests:       4 failed, 44 skipped, 48 total
```

The first failure *is* the ticket, in jsdom: settings open, sync completes, the line still
reads `No compendium synced yet.`

## 4. Regression tests added (8)

`test/dom/views/settings-tab.test.ts` → new `SC-140 — live sync status` block (the shared
`fakeManifestStore()` helper now carries the real store's seam: `load` + `onChange`, plus a
`sync(manifest)` that writes *and* notifies, as `save()` does):

1. a sync completing with the settings window open updates the status line (tag, file count, date);
2. the manifest going away (`sync(null)`) reverts the line to `No compendium synced yet.`;
3. the subscription is per **mount** — `closeTab()` drops it (listener count 1 → 0), a sync
   landing while closed doesn't throw, and `reopen()` (a cache replay with **no** `update()`)
   shows the state that sync left behind;
4. the load-vs-notify race: a sync that beats the mount's pending `load()` is not clobbered
   when the stale read resolves.

`test/unit/data/manifest.test.ts` → `ManifestStore.onChange`: save notifies with the manifest
it wrote (and after the write is readable); the returned unsubscribe stops notifications; a
throwing listener neither fails the save nor robs its fellows.

`test/unit/data/compendiumSync.test.ts` → the **production** wiring: `applySync` → `save` →
subscribers see the new manifest (proves the view's fake mirrors a real path).

## 5. Adjacent states checked (task item 4)

- **"Sync now" progress.** Not stale, and not the same root cause: progress is a single
  updating `Notice` owned by `CompendiumSyncService.sync()`
  (`CompendiumSyncService.ts:183-197`, `notice.setMessage(...)` per batch), which lives
  outside the settings DOM and updates live by construction. The settings row renders no
  progress text at all, so there is nothing there to go stale.
- **Sync errors.** Same: `sync()`'s catch hides the progress Notice and raises an error
  Notice (`:198-204`); the settings row never displays an error string.
- **"Check for updates".** Reports through `Notice` only (`SettingsTab.checkForUpdates`), and
  changes no persisted state — nothing to refresh.
- **Not fixed, noted:** the Sync / Check-for-updates buttons have no busy/disabled state, so a
  user can click Sync twice. That is a UX addition, not this staleness bug (different cause,
  different design decision) — worth a FOLLOWUPS item if Scott wants it.
- **Bonus coverage:** because the seam sits on `save()`, a SC-125 migration adopting files
  into the manifest now also refreshes the line, which it never did before.

## 6. Battery (verbatim)

```
$ npm run tsc
> draw-steel-elements@7.0.0 tsc
> tsc --noEmit
TSC EXIT: 0        (no output)

$ npm run lint
> draw-steel-elements@7.0.0 lint
> eslint src main.ts
LINT EXIT: 0       (only the pre-existing .eslintignore deprecation warning)

$ npx jest
Test Suites: 1 skipped, 159 passed, 159 of 160 total
Tests:       1 skipped, 2548 passed, 2549 total
Snapshots:   3 passed, 3 total
Time:        24.171 s
JEST EXIT: 0       (baseline 2540 + 8 new = 2548; suite count unchanged at 159)

$ npm run shots
all shots written to …/visual-harness/shots
SHOTS EXIT: 0      ·  ls visual-harness/shots/*.png | wc -l → 314

$ bash …/.superpowers/sdd/check-freeze.sh …/visual-harness/shots
freeze OK (188/188 legacy+print PNGs byte-identical)
FREEZE EXIT: 0     (TS-only fix — no shot moved, baseline untouched)

$ npm run parity
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
PARITY EXIT: 0
```

All six match the branch-point baselines (jest +8 tests, everything else identical).

## 7. Scope / hygiene

- Commits on `sc140-sync-status` only; superproject pointer left unstaged; no tags, releases,
  deploys or landing.
- `obsidian-shots` NOT run and display `:1` untouched, per instruction.
- CHANGELOG entry added under the `7.0.0 (unreleased)` section (a `[FIX]` bullet next to the
  other SC-1xx fixes — this repo has no separate `## Unreleased` header). Expect a keep-both
  resolution against sibling branches.
- No AI attribution in the commit message.
