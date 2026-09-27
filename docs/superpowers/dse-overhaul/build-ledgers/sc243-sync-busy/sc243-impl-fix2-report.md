# SC-243 implementer report — fix round 2

## Executive summary

DONE. All three fix-round-1 review findings (LOW F1, LOW F2, NIT F3) closed. F1: the
idle-path tests for `LegacyCompendiumModal`'s choice and `offerMigration`'s `syncAnyway`
now assert `sync()` is actually called with the callback's own token (`(anything,
any(Symbol))`), that the busy lock genuinely reads `'sync'` while the trash/markSettled
side effect runs, and that no busy Notice ever fires on the idle path — plus the matching
idle test for `syncAnyway`, which round 1 never had at all. Both new assertions were
proven to catch the exact bug the reviewer reproduced: dropping the token at the two
`sync()` call sites made both new tests fail (mutation-red), confirmed, then reverted.
F2: two stale doc comments (`main.ts`, `CompendiumSyncService.ts`) that still said the
legacy-modal/`syncAnyway` callbacks call `sync()` bare now correctly describe round 1's
L1 fix. F3: `opRow`'s two separate JSDoc blocks merged into one. Rebase was a no-op
(`origin/develop` unchanged). Gates: tsc/lint clean, jest 4022 passed/1 skipped (4023
total = 4021 + 2 new); shots/freeze/parity/lifecycle correctly skipped per the brief
(no rendering change, no new develop commits).

## Shas

- Rebase base: `origin/develop` = **`6c4f6aa`** — unchanged; `git rebase origin/develop`
  reported "Current branch sc243-sync-busy is up to date."
- DSE tip after this round: **`2dad7d8`**
- `git status` in the DSE clone: clean.

Commits:
- `284a9a1` test(compendium): SC-243 review fix1 F1 — idle tests prove the token actually
  reaches sync()
- `6014635` docs(compendium): SC-243 review fix1 F2 — update stale claims about which
  callbacks pass a token
- `2dad7d8` docs(compendium): SC-243 review fix1 F3 — merge opRow's two JSDoc blocks into
  one

## Findings closed

- **F1 (test gap, LOW).** Round 1's idle tests for `LegacyCompendiumModal`'s
  `onChoice(true)` and `offerMigration`'s `syncAnyway` stubbed `sync()` with a generic
  `mockResolvedValue`/`mockImplementation`, asserting only call ORDER
  (`['trash', 'sync']`/`['settle', 'sync']`). Neither checked WHAT was passed to `sync()`,
  so a real bug — the callback silently dropping its own token at the `sync()` call site,
  which makes it refuse ITSELF on every idle run via a busy Notice instead of ever
  syncing — would leave the committed suite green (the mock still gets "called," in the
  wrong-argument sense, and the reviewer's own read of `callOrder` still shows `sync` was
  reached, just refused). Fixed by adding three assertions to each idle test:
  `expect(syncSpy).toHaveBeenCalledWith(expect.anything(), expect.any(Symbol))`, a
  `busyDuringTrash`/`busyDuringSettle` capture read from inside the trash/markSettled
  mock implementation asserted `=== 'sync'`, and `expect(Notice.notices).not.toContain(SYNC_BUSY_NOTICE)`.
  Added the parallel idle test for `syncAnyway`, which round 1 never wrote at all (only
  its "refused while busy" case existed).
- **F2 (stale docs, LOW).** `main.syncCompendium`'s own doc comment and
  `CompendiumSyncService.sync`'s doc comment both still said the
  `LegacyCompendiumModal`/`offerMigration` callbacks call `sync()` "BARE (no token)" —
  true before round 1's L1 fix, false after it (both now acquire their own token and
  hand it through the same way `syncCompendium` does). Only `syncAfter` still calls
  `sync()` bare. Both comments rewritten to say so. No code change.
- **F3 (doc hygiene, NIT).** Round 1's L3 comment was added as a SECOND, separate JSDoc
  block directly above `opRow`, sitting right after the function's pre-existing one — most
  editors show only the NEAREST block on hover, so the original doc (what `opRow` is, why
  `label`/`help` double as search keys) became invisible in practice. Merged into a single
  block. No code change.

## Mutation-red confirmation (F1)

Per the ask, temporarily dropped the token at both `sync()` call sites (`main.ts`, the
`trashToken`/`anywayToken` arguments), ran the affected test file, confirmed the new
assertions fail, then restored:

```
git diff before mutation:
  main.ts:750  await this.syncService.sync(this.syncOptions(), trashToken);
  main.ts:837  await this.syncService.sync(this.syncOptions(), anywayToken);
after mutation (token dropped at both sites):
  await this.syncService.sync(this.syncOptions());
```

Result: **2 failed, 4 passed** (`npx jest test/dom/framework/syncCompendiumBusy.test.ts`) —
both new idle tests failed on exactly the added assertion:

```
● LegacyCompendiumModal onChoice(true): idle …
  expect(syncSpy).toHaveBeenCalledWith(expect.anything(), expect.any(Symbol))
  Received: {"locale": "en", "releaseTag": undefined, "root": "DS Compendium"}  (one arg, not two)

● offerMigration's syncAnyway: idle …
  expect(syncSpy).toHaveBeenCalledWith(expect.anything(), expect.any(Symbol))
  Received: {"locale": "en", "releaseTag": undefined, "root": "DS Compendium"}  (one arg, not two)
```

`main.ts` restored from a pre-mutation backup (`diff` against the backup confirmed byte-
identical restoration); re-ran tsc/lint/jest clean afterward. Log:
`/tmp/sc243-fix2-mutation-red.log`.

## Gates (measured on the fix-round-2 tip `2dad7d8`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | **4022 passed / 1 skipped / 208 of 209 suites / 3 snapshots** (4023 total = 4021 round-1-fix baseline + 2 new idle tests). First run hit 1 unrelated transient failure in `test/dom/framework/sidebarInitiative.test.ts` (an SC-288 undo test, a file this ticket never touches) under elevated load (`/proc/loadavg` ~9); re-ran that file alone clean (11/11), then re-ran the full suite clean at lower load (~6.7) — confirmed a load-sensitive flake, not a regression, per the dse-verify skill's documented footgun class. |
| `npm run obsidian-lifecycle` / `npm run shots` / freeze / parity | **skipped** — no rendering change this round (test-only + two doc comments + a JSDoc merge), and the rebase brought in no new `develop` commits, per the brief's explicit condition |

Logs (scratch, not committed):
- `/tmp/sc243-fix2-tsc-2.log`, `/tmp/sc243-fix2-lint-1.log`
- `/tmp/sc243-fix2-jest-1.log` (affected file alone, pre-restore-check)
- `/tmp/sc243-fix2-jest-full.log` (first full run, 1 unrelated flake)
- `/tmp/sc243-fix2-jest-retest.log` (sidebarInitiative alone, clean)
- `/tmp/sc243-fix2-jest-full-2.log` (full suite, clean — the number reported above)
- `/tmp/sc243-fix2-mutation-red.log` (mutation-red proof)

## `git status` (DSE clone, final)

```
clean
```
