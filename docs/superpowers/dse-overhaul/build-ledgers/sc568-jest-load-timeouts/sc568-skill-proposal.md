# SC-568 proposal: replacement text for dse-verify "### Load-sensitive jest suites"

Replace the whole section "### Load-sensitive jest suites (shared build host, 2026-08-16)" (its three paragraphs: the
2026-08-16 settings-tab note, the SC-360 sidebarInitiative note, the SC-568 note) with the text below.
SKILL.md is not edited by the implementer. (r3: revised for the r2b review, INFO-8.)

---

### Jest timeouts under load (SC-568, 2026-11-13)

`jest.config.ts` sets `testTimeout: 30000` (top level: it is a GLOBAL jest option, jest-circus reads it from
`globalConfig`; inside a `projects` entry it is ignored), so it covers both the `unit` and the `dom` project. It is a
hang detector, not a perf gate. Before SC-568 the 5 s default failed ordinary async tests on a loaded host (load 12-57)
that take 1-3 s alone (`twin-reuse`, `initiative-default-keys`, `settings-tab`, `settings-preview`, first test of
`sidebarInitiative`, `initiative-sc417-minion-squad`, `formModalStalePreview`, `fixtures`). A synchronous test never times
out however slow it is; only a test that awaits macrotasks does. Headroom: about 6x over the time a test takes alone,
about 2x over the slowest async test under the 1-core repro (`twin-reuse` ~16 s).

- An "Exceeded timeout of 30000 ms" is now a real hang until proven otherwise: re-run the suite alone first, do not
  blame load.
- Hand-written `waitUntil` caps in tests follow the same rule: keep them below 30 s (25 s in `sidebarInitiative`,
  `formSaveRedraw`, `sidebarEncounterHandoff`) so the descriptive message wins, never 5 s.
- Tests whose verdict depends on elapsed time must not read the wall clock. Use `jest.useFakeTimers({ doNotFake:
  ['queueMicrotask', 'nextTick'] })` and `await jest.advanceTimersByTimeAsync(ms)` (see `chromeFocusHandoff`,
  `initiative-outside-edit`, `initiative-default-keys`). **A frozen fake clock never lets time pass on its own: advance
  realistic gaps between steps, with LITERAL numbers (never the product's constant, which shrinks with a mutant), or the
  window lengths go untested** (a window cut to 1 ms still passes a test that never advances the clock; the SC-568 r2b
  review measured it, and r3 added 2900 / 1400 ms gaps and boundary tests).
- A fixed `setTimeout(25)` as "the async read is done" loses to CHAINED work: the mock vault's `read` takes one
  `setTimeout(0)` hop each and the host chains reads, so on a starved host the 25 ms timer is already due before the second
  hop is scheduled (a single product timer, or a read started before the test's timer, is ordered correctly). Wait on the
  observable condition, bounded: `test/dom/_settleVaultReads.ts` (`settleVaultReads()`) counts `cachedRead`s in flight and
  waits until none is, two hops in a row, throwing after 1000 hops. A drain wait is only the floor: where the end state is
  observable, assert it after the wait (`reading-mode-host-pin`: the rebased pin is in the note's coordinates, `pin.text`
  equals the note), which turns a no-op wait red. The helper waits on real `setTimeout(0)` hops, so it is REAL TIMERS ONLY: under
  jest fake timers it hangs to the 30 s timeout (use `pump()` there). A fixed COUNT of hops is only a fallback: it is tied to
  how many hops a mock read takes (red at 8 per read, vacuous at 20). The same fixed-`setTimeout(25)` helper is still in
  `reading-mode-host-hover-card`, `-form-pin`, `-drawn-pin` (read-once, green under a 30 ms-per-hop burn mutant); if one of
  them ever adds a second read, switch it to `settleVaultReads()`. The mock vault's reads need the fake clock pumped
  (`pump()` in `initiative-default-keys.test.ts`), or they never resolve.
- Reproduce a load-shaped red deterministically, no loaded host needed: `taskset -c 0 npx jest -w 11` (the `-w` is
  required: with `taskset` jest sees one core and runs in band, which never reddens anything). Measured: 1-5 reds per
  full run, 2 of 2 runs at `1cc54eac` and 2 of 2 at `df92a3f6`; `taskset -c 0,1 -w 11` gave 1 red. A full run takes
  about 5-7 minutes.
- Do not add a per-test timeout below 30 s to a new test; a deliberately large one (`migrationCensus` 180 s, the
  `reading-mode-host-whole-pin-*` 600 s) is fine.
