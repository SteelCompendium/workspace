# SC-140 — independent review report

**Reviewed:** worktree `/home/scott/code/steelCompendium/worktrees/sc140-sync-status/draw-steel-elements`,
branch `sc140-sync-status`, commit `8278f40`, base `e141582`.
**Reviewer method:** executed the full dse-verify battery independently, reverted the fix in
a scratch `git worktree` to re-derive the can-fail proof from scratch (not just re-reading the
report), and wrote four new independent probe tests (leak/race/error-containment) against the
real `ManifestStore` + real `DseSettingTab`, verified they pass on the fix and fail on
pre-fix code, then deleted them.

## Verdict per claim

| Claim | Verdict |
|---|---|
| `ManifestStore.onChange` makes the manifest observable; `save()` notifies after the write lands | **Confirmed.** `src/data/manifest.ts:104-121`. Notify happens after `adapter.rename` (line 84→87), so a repaint can never show a manifest the disk doesn't have. |
| Every manifest writer funnels through `save()` | **Confirmed by grep.** Only two writers exist: `CompendiumSyncService.applySync` (`CompendiumSyncService.ts:171`) and `CompendiumMigration.reconcile` (`CompendiumMigration.ts:686`), both call `this.store.save(...)` / `this.manifestStore.save(...)`. No direct `vault.adapter.write` to the manifest path outside `manifest.ts` itself. |
| Status row becomes a live per-mount subscription with a generation guard, riding the SC-131 chrome-cleanup contract | **Confirmed.** `SettingsTab.ts:187-207` (`mountCompendiumStatus`), `settingsDeclarative.ts:82-96` (`asCleanup(chrome(...))`), `settingsDeclarative.ts:57` (`NavRow.chrome` widened). |
| Full battery green, matching reported numbers | **Confirmed, exact match** (below). |
| The 4 new DOM tests can-fail against pre-fix code | **Confirmed independently**, by reverting only `SettingsTab.ts` to `e141582` in a scratch worktree (keeping the manifest/settingsDeclarative seam so the suite compiles) — same 4 failures, same messages as the report's §3. |
| No leak: subscription dies with the mount | **Confirmed independently** with my own probe (real store, real tab, 5 mount/unmount cycles, listener count 0→1→0 every cycle, no growth; a post-unmount `save()` resolves cleanly with no dangling listener; two concurrently open tabs each hold exactly one listener and closing one doesn't touch the other). |
| Race guard: sync-vs-load interleaving, fresh state wins | **Confirmed independently** with the real (non-fake) async `ManifestStore` — a `save()` that lands while the mount's `load()` is still in flight is not clobbered when the stale read resolves. |
| Error containment: a throwing listener doesn't break `save()` or its fellow listeners | **Confirmed independently** — a hostile listener registered ahead of the settings row's own listener throws, is caught and logged, and the row still repaints with the new state. |
| CHANGELOG entry placement/accuracy | **Confirmed accurate**, placement is a cosmetic non-issue (see Low finding). |
| No collateral (diff confined, freeze untouched) | **Confirmed.** `git diff e141582 8278f40 --stat` touches exactly `CHANGELOG.md`, `src/data/manifest.ts`, `src/views/SettingsTab.ts`, `src/views/settingsDeclarative.ts`, and 3 test files. `git status --porcelain` in the worktree and the superproject show nothing added by this review (the superproject's `M draw-steel-elements` is the pre-existing pinned-pointer-vs-branch-commit diff, not new dirt). |

## Battery (independently re-run, verbatim results)

```
tsc      : exit 0, no output
lint     : exit 0, only the pre-existing .eslintignore deprecation warning
jest     : 1 skipped, 159 passed / 160 suites; 1 skipped, 2548 passed / 2549 tests; 3 snapshots — EXACT match to report
shots    : 314 PNGs written — EXACT match
freeze   : freeze OK (188/188 legacy+print PNGs byte-identical), exit 0 — EXACT match
parity   : 0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0 — EXACT match
```

## Can-fail re-derivation (independent, not just re-reading the report)

Used `git worktree add <scratch> e141582`, then overlaid `8278f40`'s `src/data/manifest.ts`
and `src/views/settingsDeclarative.ts` (the new seam) plus the fixed test files, leaving
`src/views/SettingsTab.ts` at its pre-fix state. Result: same 4 failures the report quotes,
byte-for-byte matching messages (including the exact "Received: 0" on the listener-count
assertion). This independently proves the tests exercise the real bug, not an
implementation-detail tautology.

## Independent probes (new, not in the implementer's suite)

Wrote and ran (then deleted) `test/dom/views/sc140-review-probe.test.ts`, 4 tests against
the **real** `ManifestStore` and **real** `DseSettingTab` (the implementer's own tests use a
hand-rolled `fakeManifestStore`, so this exercises the actual class instead of a stand-in):

1. **Leak hunt A** — 5 mount/unmount cycles: listener count is 0 before, 1 mid-mount, 0 after
   close, every cycle (no monotonic growth); a `save()` fired with nothing mounted resolves
   without throwing and leaves the listener set at 0.
2. **Leak hunt B** — two tabs open concurrently hold 2 listeners; closing one drops to 1 and
   the other tab still repaints correctly on the next `save()`; closing the second drops to 0.
3. **Error containment** — a listener registered *before* the row's own (so it fires first in
   Set-iteration order) throws on every notification; the row still repaints with the fresh
   state and `save()` still resolves; `console.error` was called (contained, not silent).
4. **Race guard (real timing)** — primed the store with a stale manifest, mounted the tab
   (kicks off the real async `load()` against the fake vault adapter), then called `save()`
   with fresh data before `load()` had a chance to resolve. The rendered text shows the fresh
   manifest, never the stale one.

All 4 passed against the fix and **all 4 failed** against the same pre-fix scratch worktree
used for the can-fail re-derivation above (verified in the same run) — confirming these are
real regression probes, not tests that would pass regardless of the fix.

## Findings by severity

**None found at Critical or High.** The subscription lifecycle, generation guard, and error
containment all behave exactly as claimed under direct probing.

### Medium: none.

### Low

**L-1 — `mountCompendiumStatus`'s initial `load()` has no `.catch()` on its promise chain.**
`src/views/SettingsTab.ts:200-202`:
```ts
void this.plugin.manifestStore.load().then((manifest) => {
    if (mine === generation) show(manifest);
});
```
`ManifestStore.load()` (`manifest.ts:57-73`) wraps its entire body in try/catch and always
resolves (never rejects) by design — fail-safe on a corrupt/missing manifest. So this is not
a live bug today. But the safety is implicit: it depends on `load()`'s current internal
contract, not on anything the call site enforces. If `load()` were ever refactored to
propagate an error (e.g. a future caller wants to distinguish "no manifest" from "vault I/O
failed"), this `.then()` becomes an unhandled promise rejection with no user-visible symptom
beyond a console warning. Low severity because it requires a future, unrelated change to
`load()` to bite. **Prescription (optional, not blocking):** add a trailing
`.catch((error) => console.error(...))` for defense in depth, or note the invariant inline
("`load()` never rejects — see its try/catch") so a future editor of `load()` sees the
dependency.

**L-2 — CHANGELOG entry ordering is not ticket-number or date order within the `[FIX]` run.**
The SC-140 entry (`CHANGELOG.md:95-100`) sits between an SC-132 `[FEATURE]` and an SC-133
`[FIX]`, i.e. out of numeric ticket order. This matches the file's existing convention
(entries are appended near related work, not strictly sorted — confirmed by scanning the
full `## 7.0.0 (unreleased)` section, which is not ticket-ordered anywhere), and the report
itself flags "expect a keep-both resolution against sibling branches," so this is a
non-issue, noted only for completeness. Content is accurate: matches the actual observable
behavior (settings button / command palette / first-run prompt all funnel through the same
`save()` seam, verified above).

### Informational

- The `notify()` fan-out iterates a snapshot copy (`[...this.listeners]`,
  `manifest.ts:114`), so a listener that unsubscribes itself (or subscribes a new one)
  mid-notification cannot corrupt the iteration or skip/double-call a sibling. Correct
  defensive copy, not asked for in the probe list but worth recording as verified.
- `opChrome`'s widened signature (`void | (() => void)`) plus `asCleanup`'s truthy-callable
  check closes exactly the ambiguity the SC-131 preview contract already had to solve for
  `render`/`renderPreview` — this row now rides the identical contract rather than a new one,
  which is the right amount of design for the fix.

## Recommendation

**LAND.** All claims verified against the real code and real store (not just the
implementer's fakes), the can-fail proof was independently re-derived from a fresh revert
rather than trusted from the report, four additional adversarial probes (repeated
mount/unmount, concurrent tabs, hostile listener ordering, real-timing race) all pass on the
fix and fail on pre-fix code, the full battery matches reported numbers exactly, and the diff
carries no collateral. The two Low findings are non-blocking (L-1 is defense-in-depth on an
invariant that already holds; L-2 is a pre-existing changelog convention, not a defect
introduced by this fix).
