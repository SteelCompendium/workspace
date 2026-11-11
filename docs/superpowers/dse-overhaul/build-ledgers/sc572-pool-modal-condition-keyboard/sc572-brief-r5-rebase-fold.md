# SC-572 r5 brief — rebase onto fbaba3da + fold r4 INFO-1 (resume of the implementer)

Same worktree, branch, footguns (§4 of sc572-brief-r1-implementer.md — binding; scratch sc572-r1-impl-<yourAgentId>/,
new uniquely named r5 logs), report and return contract. You never call the tracker.

## Step 1 — rebase (BEFORE any edit)
SC-576 landed: dse develop is now `fbaba3da` (was 97a9c93b). `git -C <plugin> fetch origin`, confirm
`origin/develop` == `fbaba3da` (report if it moved further), then `git -C <plugin> rebase origin/develop`.
Resolve any conflict (likely candidates: the e2e manifest / coverage pairs, CHANGELOG, shared drivers) keeping BOTH
sides' intent; record every conflicted file and how you resolved it. Record
`git -C <plugin> range-diff 97a9c93b..f62e1f5e fbaba3da..HEAD` output to a log. `npm ci` if package.json's obsidian
version changed.

## Step 2 — fold r4 INFO-1 (separate commit)
Reviewer finding (verbatim, `sc572-r4-rereview-report.md`):
> INFO-1 `src/views/MinionStaminaPoolModal.ts:544-548`: when a minion's only condition is removed by keyboard and
> no enabled control follows the row, focus lands on the footer Reset button. A second Enter then clears the staged
> damage and kill ticks; nothing is written to the note. This is the "next focusable control" rule I prescribed in
> r2. Optional tweak: prefer the damage field `pool.damage-amount` over the footer.

Owner ruling: fold it. When no condition icon remains after a keyboard removal, focus `pool.damage-amount` (the
damage field) if it is present and enabled; fall back to the current rule otherwise. Never a footer action button.
Update POOL-C06 (and the jsdom only-icon test) to assert the new target. Mouse-click behaviour unchanged.

## Step 3 — full battery on the final head
New baseline at fbaba3da (SC-576 owner): jest 7056/1 · lifecycle 52/52 · e2e 251/260 ok, 0 failed, 9 known-bug,
coverage 161/161 · shots 592, 163/978, clip 147 · freeze 280/280 · parity 0/0/24.
Expected with SC-572 on top: tsc/lint clean · jest ≈ 7056 + your new tests (~7061) / 1 skipped (SC-568 load
timeouts: re-run that suite alone) · lifecycle 52/52 (five `--only` parts) · e2e **254/262 ok, 0 failed,
8 known-bug, coverage 163/163** (if different, explain each delta) · shots 592, 163/978, modal 39 kinds / 234,
clip 147, all PNG hashes identical to a clean fbaba3da render if cheap (minimum: freeze) · freeze 280/280 ·
parity 0/0/24. Known load flakes (not findings unless reproducible alone): RECOV-R07 (SC-517/SC-570),
CENSUS-07 (SC-593), montage wheel (SC-521) — re-run once, report both.

Report `.../sc572-r5-rebase-fold-report.md` (≤10-line exec summary first: new head sha, base sha, conflicts y/n,
range-diff summary, every gate line). Return raw facts + absolute artifact paths.

## AMENDMENT (2026-11-11) — supersedes the base and lifecycle numbers above
~~Rebase onto fbaba3da~~ superseded: SC-480 landed, dse develop is now **`eeed5182`**. Rebase onto `eeed5182`
(if you already rebased onto fbaba3da, just rebase again onto eeed5182). range-diff: `97a9c93b..f62e1f5e eeed5182..HEAD`.
SC-480 changes the card-write fallback path and adds lifecycle **G-S73**. Lifecycle is now 53 scenarios in five
`--only` parts: part 5 is now **`G-S59 G-S49 G-S73`** (3; ~266 s); parts 1-4 unchanged, G-S56 stays last in part 4.
Expected: lifecycle **53/53** · jest ≈ 7076 non-skipped + your new tests (fresh worktree 7074/2 baseline; SC-568
timeouts green alone) · e2e 254/262 ok, 0 failed, 8 known-bug, 163/163 · shots/freeze/parity unchanged.
