# SC-568 decisions ledger — jest suites time out at 5 s on a loaded host

Ticket: SC-568 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts` (superproject @ `26b92a8a` =
workspace origin/main at creation; dse branch `sc568-jest-load-timeouts` @ develop `1cc54eac`).

## Ticket text (verbatim, 2026-11-13 fetch; no comments on the ticket)

> The full jest run failed two tests on 5-second timeouts while the machine's load average was
> 17–50: `twin-reuse` and the "pool back at its parse value" test in `initiative-default-keys`.
> Both suites pass when run alone, and `twin-reuse` also timed out on an unchanged develop
> checkout, so this is the test setup, not a product bug. A concurrent-orchestration machine makes
> a red jest gate look like a code fault.
>
> Also seen (SC-556 r4, 2026-11-10, load 12–40): `chromeFocusHandoff` "SC-505 r3 LOW-A" failed in
> two plain runs (wall-clock `SETTLE_MS` 1500 / `REQUEST_TTL_MS` 5000 in `chrome/focusHandoff.ts`);
> passes alone 24/24.
>
> Fix: raise those tests' timeouts or make them cheaper; check for other suites near the 5 s limit.

Also documented as load-sensitive in dse-verify ("Load-sensitive jest suites"): `settings-tab`,
`settings-preview`, first test of `sidebarInitiative`, and (SC-558, load 25-50)
`initiative-sc417-minion-squad`, `formModalStalePreview`, `fixtures`.

## Scott rulings

(none yet — the ticket's own "Fix:" line is the spec)

## Owner decisions (2026-11-13)

- D1. Scope is test setup only. No change to product behaviour in `src/`, `main.ts`, `styles.css`
  or the visual/obsidian harness. `main.js` and `styles.css` must build byte-identical to
  `1cc54eac`; then shots / freeze / parity carry (SC-557 precedent).
- D2. Fix shape: (a) raise jest's default per-test timeout for BOTH projects (`unit`, `dom`) in
  `jest.config.ts` to 30 s, with a comment citing SC-568 (it is a hang detector, not a perf
  gate; 30 s gives ~6x headroom for a 12-core host at load 50); (b) any test with its own explicit
  timeout below 30 s that is load-shaped gets raised; intentional tight ones are reported, not
  changed; (c) a test whose result depends on REAL elapsed time (e.g. `chromeFocusHandoff`
  "SC-505 r3 LOW-A" vs `SETTLE_MS` / `REQUEST_TTL_MS`) is made clock-independent (jest fake
  timers / injected clock), keeping what it asserts; (d) obvious cheap wins (a suite redoing an
  expensive setup per test) may be taken, reported separately.
- D3. Evidence required: a deterministic contention repro (CPU-pinned jest, e.g. `taskset`)
  that reddens the base and is green on the branch, repeated; plus a quiet full run at
  11794 passed / 2 skipped (or the count + any added tests).
- D4. Docs: dse-verify's "Load-sensitive jest suites" note gets a proposal file in this dir
  (owners do not edit SKILL.md).

## Rounds

- r1 implementer — dispatched 2026-11-13.

## Baseline moves

- 2026-11-13 dispatcher: SC-619 landed. dse develop now `df92a3f6`, workspace main `65098e06`.
  Rebase the dse branch onto `df92a3f6` and the superproject branch onto current workspace main
  (ONE pointer bump) before land-ready. Numbers at `df92a3f6`: jest 11817 passed / 2 skipped
  (fresh, no shots cache) · lifecycle 63/63, part 7 is now `G-S108,G-S112` (~130 s) · e2e
  331/334 ok, 0 failed, 3 known-bug, 176/176 · shots 592, freeze 280/280, parity 0/0/24
  (styles.css unchanged). Lifecycle id reserved for this effort: G-S114 (unused so far).
  D1's bundle-identity check is now against a build of `df92a3f6`.
- r1 implementer DONE 2026-11-13: branch `ed4044aa` (7 commits on `df92a3f6`, test-only, 8 files).
  testTimeout 30000 top-level (global option; project-level is ignored). Fake clocks:
  chromeFocusHandoff, initiative-outside-edit [O22], initiative-default-keys (51 s -> 2.6 s);
  macrotask-hop waits: reading-mode-host-pin, reading-mode-host-crlf-hover. Contention recipe
  `taskset -c 0 npx jest -w 11`: base 1cc54eac 4-5 reds; branch 3/3 green. Quiet jest 11817/2.
  Lifecycle 63/63, e2e 331/334 0 failed 3 known-bug 176/176, bundle byte-identical to df92a3f6.
  Follow-ups: (1) other fixed setTimeout(N) sleeps / Date.now() suites may be latent — ruling
  after review; (2) twin-reuse 2.6 s CPU — DROP (covered by 30 s; perf belongs to SC-547).
  Skill proposal: sc568-skill-proposal.md (dispatcher applies at landing).
- r2 independent reviewer — dispatched 2026-11-13.
- 2026-11-13 dispatcher: SC-586 landed. dse develop now `14521bf0`, workspace main `85f7d100`.
  Rebase onto `14521bf0` + superproject onto current workspace main (ONE pointer bump) before
  land-ready. Numbers at `14521bf0`: jest 11833 passed / 2 skipped (fresh) · lifecycle 63/63
  (part 7 `G-S108,G-S112`) · e2e `334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` ·
  shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 ·
  parity 0/0/24. Owner plan: r2 review continues on `ed4044aa`/`df92a3f6` (unchanged scope);
  the post-review round rebases onto `14521bf0`, re-runs tsc/lint/quiet jest/contention jest and
  bundle identity vs a `14521bf0` build. Lifecycle/e2e carry iff the bundle is byte-identical
  and the branch diff touches no `e2e/` or `visual-harness/` file (jest-only change; harness
  inputs identical to the landed base).
- 2026-11-13 r2 reviewer hung on a permission prompt (rm -f + rmdir of throwaway tests); could
  not TaskStop it from the owner. Probe 1 result salvaged: 30 s default applies to both projects
  (branch: 6 s pass / 31 s fail at 30000 ms; base: all fail at 5000 ms). Replaced by r2b
  reviewer (brief = sc568-r2-review-brief.md + sc568-r2b-addendum.md, no rm of any kind).
- r2b review DONE 2026-11-13: FIX-ROUND. 2 MEDIUM, 2 LOW, 4 INFO (sc568-r2b-review.md). Owner rulings:
  MEDIUM-1 (chromeFocusHandoff frozen clock, 1 ms windows pass) FIX; MEDIUM-2 (initiative-outside-edit
  later(5) etc.) FIX; LOW-3 (hop-count waits) FIX — wait on the observable condition, bounded;
  LOW-4 (5 s waitUntil caps in sidebarInitiative / formSaveRedraw / sidebarEncounterHandoff) FOLD;
  INFO-5 (jest.config comment "~6x" headroom) FOLD — correct the comment; INFO-6 (other fixed sleeps)
  DROP: the three remaining setTimeout(25) suites stayed green 4048/4048 under a 30 ms-per-hop burn
  mutant and no other suite reddened under the contention repro; the skill note tells future agents
  how to reproduce; INFO-7 (redundant useFakeTimers) FOLD; INFO-8 (proposal fixes) FOLD.
  Main-checkout dse dirt the reviewer noted = Scott's live vault (adapter §5), ignore.
- r3 = r1 implementer resumed: fix round + rebase onto 14521bf0 (sc568-r3-rebase-brief.md).
- 2026-11-13 dispatcher: SC-613 landed. dse develop now `9b94baf2`, workspace main `b8a51cfd`.
  Numbers at `9b94baf2`: jest 11853 passed / 2 skipped (fresh) · lifecycle 63/63 (part 7
  `G-S108,G-S112`) · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592,
  host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
  r3 rebase target is now `9b94baf2` (supersedes `14521bf0`); same carry rule for lifecycle/e2e
  (bundle byte-identical to a `9b94baf2` build + no src/e2e/visual-harness in diff).
- r3 DONE 2026-11-13: branch `2be69b95` (11 commits on `9b94baf2`; r3 fix commits
  `b09e73c3..2be69b95`). Quiet jest 11857/2 (11853 + 4 new), contention x3 0 failed, bundle
  byte-identical to `9b94baf2` build (main.js `81a67cb8…9219`, styles.css `18730938…f1f9`), diff =
  jest.config.ts + test/ only -> lifecycle/e2e/shots/freeze/parity carry. Implementer flags: the
  LOW-3 helper `settleVaultReads` replaced as a no-op still passes all 169 tests (precondition not
  asserted). Scratch worktree `scratchpad/sc568-r3-impl/base-9b94` left registered.
- r4 scoped re-review = r2b reviewer resumed (sc568-r4-rereview-brief.md).
- r4 re-review DONE 2026-11-13: FIX-ROUND for one 2-line test change (LOW-3 assert at
  reading-mode-host-pin.test.ts:680 is vacuous; reviewer pre-verified the replacement passes with
  the helper and reddens with a no-op helper). All else green (17/17 mutants killed, contention 0
  failed, bundle identical, scope test-only). Owner rulings: FOLD the 2-line replacement verbatim
  from sc568-r4-rereview.md; FOLD both INFOs (real-timers-only note in `_settleVaultReads.ts`
  header; proposal gains "assert the end state when observable" + the real-timers note). No
  further review round: the reviewer already measured this exact change; implementer runs the two
  affected suites with the helper real + no-op, then tsc/lint/quiet full jest.
- r5 = implementer fold round.
- r5 DONE 2026-11-13: dse `b1e4f027` (12 commits on `9b94baf2`, 12 files jest.config.ts + test/
  only). No-op-helper probe now reds the :680 test; quiet jest 11857/2; tsc/lint clean.
- Superproject: branch reset onto workspace origin/main `056c50d1`, ONE pointer bump `0f078655`.
  Scratch worktrees (br, base, base-9b94) removed. LAND-READY reported 2026-11-13.
  Lifecycle/e2e/shots/freeze/parity CARRY from `9b94baf2` (63/63; 338/341 0 failed 3 known-bug
  176/176; 592; 280/280; 0/0/24): bundle byte-identical to a `9b94baf2` build (main.js
  `81a67cb8…9219`, styles.css `18730938…f1f9`; r3 + r4 independent) and the diff touches nothing
  the harnesses consume (no src/, main.ts, styles*, e2e/, visual-harness/). r1 ran full lifecycle
  63/63 + e2e 331/334 on the same test-only change at df92a3f6.
