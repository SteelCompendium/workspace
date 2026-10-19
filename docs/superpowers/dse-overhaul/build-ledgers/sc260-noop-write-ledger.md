# SC-260 decisions ledger — ReadingModeBlockHost.replaceSource no-op write

Worktree: `/home/scott/code/steelCompendium/worktrees/sc260-noop-write` (every submodule on branch `sc260-noop-write`).
Repo touched: `draw-steel-elements` (tracked branch `develop`, base `c78a06b`).

## Scott's rulings (verbatim, dated)

_None yet. The ticket has no comments (checked 2026-10-19)._

## Owner rulings (ticket-owner judgment, 2026-10-19)

O-1. **Do NOT add a cached-body shortcut that skips `vault.process` entirely** (e.g.
`if (newSource === this.knownBody) return true`). `knownBody` is a cache; if a body edit
landed on disk that this host has not observed yet, the shortcut would silently drop a real
write. Obsidian already no-ops an identical `vault.process` result (SC-198 experiment 5:
no `modify`, no rebuild), so the read + diff inside `process` is the cheap, correct
equality check — it already exists as `changedContent` (ReadingModeBlockHost.ts ~L402).

O-2. **The real cost of a no-op write today is the SC-198 scroll pin.** `replaceSource`
calls `this.scrollPin?.pin(this.containerEl)` BEFORE `vault.process`, unconditionally. On a
no-op write no rebuild comes, so the pin holds phantom scroll space at the bottom of the
note for the full `PIN_TTL_MS` (2500 ms). Fix: pin only when the write will actually change
the file — i.e. decide inside the `vault.process` callback, after computing `next`, and pin
only when `next !== content` (still synchronously before Obsidian writes, so it still
precedes the rebuild). The `section` guard stays.

O-3. Return value unchanged: a no-op write still resolves `true` (the disk already holds the
requested body). Claim-ticket drop on `!changedContent` stays as is.

O-4. `SidebarBlockHost.replaceSource` has no scroll pin; leave its behaviour alone unless the
implementer finds a concrete no-op cost there (report it, don't fix it).

## Authorship
- Round 1 implementer: orchestration:implementer agent adcb987b8ca39ccfc (dispatched 2026-10-19)
- Round 1 implementer result: DONE at f79c0d6 (one commit on c78a06b); jest 4790/1/227 of 228, lifecycle 25/25, e2e 63/73 0 failed 10 known-bug 47/47, shots 572 0 FAIL, freeze 276/276, parity 0/0/24.
- Round 1 reviewer: orchestration:reviewer (dispatched 2026-10-19), independent of the implementer.

## Base moves
- 2026-10-19 (dispatcher relay): dse origin/develop moved c78a06b -> 8ab5e91 (SC-429 landed). Land-ready must be on 8ab5e91. New CURRENT baselines: jest 4806 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e 63/73 ok, 0 failed, 10 known-bug, coverage 47/47 pairs · shots 572 · freeze 276/276 · parity 0/0/24 DECLARED. Expected after SC-260 rebase: jest 4809 (4806 + 3).
- Plan: let the r1 review (on f79c0d6) finish; then resume the implementer to rebase onto 8ab5e91 + apply any fix findings + rerun the full battery; scoped re-review of the delta by a different identity.

## Review r1 rulings (owner, 2026-10-19) — reviewer verdict APPROVE_WITH_NITS on f79c0d6
- MEDIUM-1 (G-S8 passes with the pin disabled; pre-existing): filed as **SC-459** (Backlog, related SC-260/SC-198). OUT OF SCOPE for SC-260.
- LOW-1 (pin() throwing inside the callback after `knownBody = newSource` would abort the write and desync knownBody): FOLD. Wrap the pin call in try/catch with console.warn so a pin failure can never abort the write.
- LOW-2 (stale test title "pins BEFORE vault.process runs", previewScrollPin.test.ts:159): FOLD. Rename to describe pin-inside-callback-before-write.
- INFO (second write after detach doesn't refresh pin timer; first pin covers): DROP — first pin covers the window, no user-visible effect.
- Round 2 implementer result (2026-10-19): DONE at f818002 on 8ab5e91 (db40b9f rebased r1 + f818002 LOW-1/LOW-2 folds); jest 4810/1/227 of 228, lifecycle 25/25, e2e 63/73 0 failed 10 known-bug 47/47, shots 572 0 FAIL, freeze 276/276, parity 0/0/24. Scoped re-review sent to the r1 reviewer identity (not the author).
- Scoped re-review (2026-10-19): APPROVE, no findings, at f818002 (rebase byte-identical to r1, LOW-1 red/green verified, jest 4810/1). LAND-READY.
