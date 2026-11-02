# SC-525 round 6 — scoped check of the test-only r5 delta (b1d5fa9..34f46cf)

## Executive summary
- **Verdict: LAND-READY.** Findings: 0 HIGH / 0 MEDIUM / 0 LOW / 1 INFO.
- (1) `git diff b1d5fa9..34f46cf -- src` is empty: 0 lines. Only `formModalStalePreview.test.ts` and `refUnwrapView.test.ts` changed.
- (2) W1, W3, W4 and W5 are faithful copies of r4's `sc525-r4-probe-windows.ts.txt`: same holds, same assertions, renamed helpers, block keys unique per setup. Each one kills exactly its single-check mutant: `:220`→W1, `:256`→W3, `:304`→W4, `:310`→W5, 1 red each. `:243` and `:308` survive (0 red), as the owner accepted. Unmutated: 73/73.
- (3) The SC-510 mid-hold cascade is now contained: 2 of 28 fail, only the 2 injected tests (feature and statblock); it was 12 of 28 at `b1d5fa9`. The same injection in an SC-525 test also gives 2 of 28.
- (4) The idempotent `release` hides no double-release and makes no test vacuous. With a second release outside `afterEach` set to throw, the whole suite passes 28/28, so no test body releases twice. Without the guard, 12 SC-510 tests fail: `afterEach` repeats the real lookup and the repeat raises an unhandled rejection. The guard only absorbs that teardown repeat. A Promise ignores a second resolve anyway, so the product never saw a repeat.
- (5) jest full run on `34f46cf`: 6184 passed / 1 skipped, 248 of 249 suites, rc 0. This matches the expected numbers.
- Tree left as found: `git status --porcelain` empty, HEAD `34f46cf`.

## Details
- Mutants (`sc525-r6-mutants.log`; the three suites, 73 tests; same mutation script as r4):

  | Check dropped | Tests red |
  |---|---|
  | M9-0 `RefUnwrapView.ts:220` | 1 (SCC stale null read, W1) |
  | M9-1 `:243` | 0 |
  | M9-2 `:256` | 1 (SCC `body()` window, W3) |
  | M9-3 `:304` | 1 (legacy stale rejection, W4) |
  | M9-4 `:308` | 0 |
  | M9-5 `:310` | 1 (legacy block-text read, W5) |

  Source restored after each mutant: 0 changed files.
- Cascade and idempotence (`sc525-r6-cascade.log`; scratch copies of the head form test file, deleted by literal path):

  | Variant | Result |
  |---|---|
  | Throw mid-hold in an SC-510 test | 2 failed of 28: only the injected feature and statblock "every keystroke's lookup …" tests |
  | Throw mid-hold in an SC-525 test | 2 failed of 28: only the injected tests |
  | Instrumented: a second `release` outside `afterEach` throws | 28 passed of 28 |
  | Guard removed (`formModalStalePreview.test.ts:86`) | 12 failed of 28, all SC-510 tests (matches the implementer's account of the first r5 attempt) |
- Vacuity: every in-body `release(i)` still resolves on its first call (`:86-88`), so all assertions after a release see a real settled lookup. Only the `afterEach` teardown ever hits the guard.

## INFO-1 (harmless asymmetry)
`formModalStalePreview.test.ts:435-438`: the ds-scc test's own releaser calls each `reads` release again in `afterEach`, after the test body has already released them. Each repeat starts another real `getEntity` whose result is discarded, because the Promise is already settled. That read does not reject, so it is harmless and the test passes. Optional: give it the same `released` flag for symmetry.

## Artifacts
- `sc525-r6-mutants.log`
- `sc525-r6-cascade.log`
- `sc525-r6-jest-full.log`
- `sc525-r6-check.sh.txt`
- `sc525-r6-jest.sh.txt`

All are in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/`.
