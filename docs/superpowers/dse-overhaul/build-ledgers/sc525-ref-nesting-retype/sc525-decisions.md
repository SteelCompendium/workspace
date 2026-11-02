# SC-525 decisions ledger — retyping a reference while its lookup runs shows "Reference nesting too deep"

Ticket: SC-525 (Low, Bug, DSE Plugin). Related: SC-510 (origin; its INFO-1/FU-1), SC-404.
Owner: ticket-owner session be71a0a9-199f-4e14-967b-191935312b05 (Opus 5.5; post with `--model opus-5.5`).
Worktree: /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype (every submodule on branch `sc525-ref-nesting-retype`).
DSE base: `develop` @ 4deb8cf.
Lifecycle id reserved for this effort if needed: G-S55.

## Scope (from the dispatcher, 2026-10-30)
- Stay in the form preview / reference resolution path (`src/elements/shared/RefUnwrapView.ts`, `ElementView` in `view.ts`).
- Out of scope / overlapping running efforts: SC-481 (block save / Reading-view redraw for identical blocks), SC-522 (Live Preview scroll hold). Do not touch those areas.
- Reproduce first.

## Scott rulings
(none yet — the ticket thread has no comments as of 2026-10-30)

## Owner decisions
- 2026-10-30: Implement the ticket's suggested fix (SC-510 r2 candidate C3): `IN_FLIGHT_REFS` becomes a Map from guard key to owning view; refuse only when the owner is a different view that has not unloaded; delete in `finally` only if this view is still the owner; public `isUnloaded()` on ElementView reading its `unloaded` flag (NOT `_loaded` — that broke the `displayCardHybrid` depth-guard test). Rejected (per ticket): per-render preview blockKey (C1) — resets preview session state per keystroke.
- 2026-10-30: Evidence bar: jsdom red-then-green tests (feature + statblock form preview, held lookup + same-ref retype; plus the genuine-nesting guard still refuses A→B→A), and a one-off real-Obsidian probe reproducing on base and gone on head (reuse SC-510 r2 probe kit). No new lifecycle scenario unless the reviewer shows jsdom cannot hold the behaviour — the race needs a held lookup, and the lifecycle authoring rule forbids timer-based races.
- 2026-10-30: Full dse-verify battery required (main.js changes): tsc, lint, jest, lifecycle (two halves), e2e, shots, freeze, parity.

## Rounds
- r1 implementer (orchestration:implementer, id aa10717500950afe6) dispatched 2026-10-30 — brief `sc525-brief-r1-impl.md`, report `sc525-r1-impl-report.md`. Author of the fix; must NOT review it.
- r1 DONE 2026-10-30: plugin `af09bf2` (4bbe5bb red tests, daf715f fix, af09bf2 lint type). +13 tests; full battery green (jest 6166/1, lifecycle 41/41, e2e 124/124, shots 592, freeze 280/280, parity 0/0/24). Flag: same-view re-entrance no longer refused (untested) — sent to r2 reviewer.
- r2 reviewer (orchestration:reviewer) dispatched 2026-10-30 — brief `sc525-brief-r2-review.md` (+ addendum), report `sc525-r2-review-report.md`.
- r2 DONE 2026-11-01: LAND-READY at `af09bf2`; 0 HIGH / 2 MEDIUM (pre-existing) / 1 LOW / 4 INFO. Gates re-run match r1.

## Owner rulings on r2 findings (2026-11-01)
- MEDIUM-1 (real cycle never stopped in Obsidian) + MEDIUM-2 (false nesting error when one block is live twice): pre-existing on base → FILED **SC-536** (Backlog, Medium, related SC-525/SC-510). OUT OF SCOPE for SC-525 — no ancestry guard, no depth cap, no RenderContext change here.
- LOW-1 (same-view re-entrance double-mounts + orphan child; mutant M4 survives): FOLD into r3. Apply the reviewer's prescribed fix verbatim: per-resolution token in `IN_FLIGHT_REFS: Map<string, { view: ElementView<unknown> }>`; refuse when `cur && cur.view !== this && !cur.view.isUnloaded()`; `finally` deletes only if `IN_FLIGHT_REFS.get(guardKey) === token`; `private resolveGen = 0`, `const gen = ++this.resolveGen` at the start of `resolveAndMount`, and after each `await` `if (gen !== this.resolveGen) return;` before any errorCard/webCard/mountBase write. Plus the prescribed tests (same-ref and A→B variants, both release orders, one `.test-base-view`, ownedChildren back to pre-update count).
- INFO-3 (module-level IN_FLIGHT_REFS leaks across tests after a mid-hold failure): FOLD, test-side only (unique blockKey per harness setup in the SC-525 tests, or equivalent) — no new src export unless unavoidable.
- INFO-1 (r1 M3 OOM unreported): drop — informational; depth-cap backstop goes to SC-536.
- INFO-2, INFO-4: no action (confirm develop parity / head improvement).
- r3 fix round: r1 implementer (aa10717500950afe6) resumed 2026-11-01 with `sc525-brief-r3-fix.md`; report `sc525-r3-fix-report.md`. Scoped re-review of the r3 delta goes to the r2 reviewer (a5b62926bffdcd76c) — not the author.
- r3 DONE 2026-11-01: head `f6b5fee` (4016eee red+INFO-3, 1ab2bcf fix, 6068ca0 SCC test, f6b5fee M7 test). jest 6176/1 (+10), lifecycle 41/41, e2e 124/124, shots 592, freeze 280/280, parity 0/0/24. Mutants M1/M2/M4/M5/M6/M6a/M6b/M7 all red.
- 2026-11-01 owner ruling on r3 follow-up ("`onMount` for inline/invalid bodies does not bump `resolveGen`, so an `update()` from a pending reference to an inline body lets the old resolution draw late"): FOLD into r3b — same file, same stale-write class LOW-1 just fixed, ~1 line. Every path that replaces the view's content (inline, invalid, and reference bodies) must supersede any in-flight resolution; add a red-then-green test (pending `@A` → update to an inline body → release: only the inline card), both release orders, and a mutant that drops the new bump. Full battery after.
- r3b DONE 2026-11-01: head `b1d5fa9` (5bb5cd2 red, b1d5fa9 `this.resolveGen++` at top of onMount). jest 6180/1 (+4), lifecycle 41/41, e2e 124/124, shots 592, freeze 280/280, parity 0/0/24. M8 red.
- r4 scoped re-review (af09bf2..b1d5fa9): r2 reviewer a5b62926bffdcd76c resumed with `sc525-brief-r4-rereview.md`.
- r4 re-review DONE 2026-11-02: LAND-READY at `b1d5fa9`; 0 HIGH / 0 MEDIUM / 2 LOW (test-only) / 3 INFO. Gates: tsc/lint clean, jest 6180/1, lifecycle half A 20/20, e2e run1 123/124 (CHR-F02 flake) run2 124/124.

## Owner rulings on r4 findings (2026-11-02)
- r4 LOW-1 (`formModalStalePreview.test.ts:67`, `:360-363` — `holdLookups` registers no releaser, so an SC-510 mid-hold failure still cascades into the SC-525 form tests): FOLD into r5, test-only. Reviewer's prescribed fix verbatim: "push the releaser from inside `holdLookups` itself, move `releasers` and its `afterEach` above it, and drop the duplicate push in `withRef`."
- r4 LOW-2 (single `resolveGen` checks at `RefUnwrapView.ts:220, 243, 256, 304, 308, 310` unpinned): FOLD into r5, test-only. Paste the reviewer's W1, W3, W4, W5 from `sc525-r4-probe-windows.ts.txt` into the `in-flight depth guard (SC-525)` describe (they kill the single-check mutants at :220, :256, :304, :310). :243/:308 stay unpinned — accepted (:243 guards only a stale "not renderable" card; :308 is an optimisation redundant with :310).
- r4 INFO-1 (e2e CHR-F02 flake, recurred after SC-481 r2): FILED **SC-539** (Backlog, Low).
- r4 INFO-2 (redundant `++` in `resolveAndMount`): DROP — harmless; keeps `resolveAndMount` correct on its own if a caller other than `onMount` is added.
- r4 INFO-3 (base view mid-mount when parent updates writes a second card; mounts are synchronous for SC-525 elements): DROP — does not reach these elements.
- r5 is test-only (no `src/` change, so `main.js` is byte-identical to `b1d5fa9`): gates are tsc, lint, jest, plus `git diff b1d5fa9..HEAD -- src` empty; lifecycle/e2e/shots/freeze/parity carry from `b1d5fa9`. Scoped check of the r5 delta by the r4 reviewer (it authored W1–W5 as probes, not branch code; the implementer commits them).
- r5 DONE 2026-11-02: head `34f46cf` (test-only; `git diff b1d5fa9..HEAD -- src` empty). jest 6184/1 (+4). Single-check mutants :220/:256/:304/:310 each red; cascade 12/28 → 2/28. Scoped check of r5 delta → r4 reviewer.
- 2026-11-02: CHANGELOG bullet (workspace `## Unreleased`) via chore a65ccec68d6944a07 in the worktree superproject; brief `sc525-brief-chore-changelog.md`.
- r6 check DONE 2026-11-02: LAND-READY at plugin `34f46cf`; 0 HIGH/MEDIUM/LOW, 1 INFO. INFO-1 (ds-scc test releaser repeats entity reads in afterEach; harmless): DROP — test-only, passes, no product effect.
- LAND-READY 2026-11-02: plugin `draw-steel-elements` branch `sc525-ref-nesting-retype` @ `34f46cf` (on develop `4deb8cf`); superproject worktree commit `8b49fb55` (CHANGELOG only, cut from `e9147c7e`, pointer bump unstaged — landing does it). Reported to dispatcher.
- DONE 2026-11-02: landed by the dispatcher — dse develop fast-forwarded to `34f46cf`; workspace main `8234d0e4` (pointer bump `35cf7c62`; docs `4b697078`: dse-verify CURRENT at `34f46cf`, ledger preserved to `docs/superpowers/dse-overhaul/build-ledgers/sc525-ref-nesting-retype/`). Worktree removed. Ticket flipped to Done.
