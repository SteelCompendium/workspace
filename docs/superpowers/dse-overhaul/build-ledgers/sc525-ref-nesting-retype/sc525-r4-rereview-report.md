# SC-525 round 4 — scoped re-review of the r3 + r3b delta (af09bf2..b1d5fa9)

## Executive summary
- **Verdict: LAND-READY.** r2 LOW-1 is fixed as prescribed. Same reference, A then B, and self-reference updates during a pending lookup all draw one card, leave no orphan child and leave no map entry, in both release orders. Self-reference now stops at 2 views (it was 4 at `af09bf2`). The r3b inline and invalid updates draw only the new content.
- Findings: **0 HIGH, 0 MEDIUM, 2 LOW (both test-only), 3 INFO.**
- LOW-1: the INFO-3 fold is partial. Holds made by the SC-510 tests in `formModalStalePreview.test.ts` are not released. One deliberate mid-hold failure there turns 12 tests red, including all 6 SC-525 `@Ref.md` form tests.
- LOW-2: no `resolveGen` check is pinned individually. All 6 single-check mutants survive the 69-test suites. I wrote four await-window tests that kill four of them; they are ready to paste.
- Mutants M4 (7 red), M6 (11), M7 (1) and M8 (4) are all red.
- Gates on `b1d5fa9`: tsc and lint clean; jest 6180 passed / 1 skipped / 248 of 249 suites (matches r3b); lifecycle half A 20/20; e2e run 1 had 123/124 with CHR-F02 failing (a stamina-bar chrome test, unrelated; INFO-1); run 2 had 124/124 with 87/87 pairs.
- Scope: the only src file in the delta is `src/elements/shared/RefUnwrapView.ts`. Nothing touches SC-536 (no ancestry guard, depth cap or RenderContext), SC-481 (save, redraw) or SC-522 (Live Preview scroll).

## Probe results (head `b1d5fa9`, jsdom; `sc525-r4-probe-head.jsonl`)
| Probe | Result |
|---|---|
| R1: same reference re-entrance, release orders 01 and 10 | one `A`, no nesting card; ownedChildren 2 (chrome + 1 base view), 1 ElementView child, still 2 after a later update (r2 head: 3); a fresh view resolves (no map entry left) |
| R2: A then B, both orders | only `B`; ownedChildren 2; fresh A and fresh B both resolve |
| R3: self-reference re-entrance, both orders | `[A]` + 1 nesting card, 2 views created, stops |
| R7: pending `@A`, then update to an inline body; stale lookup released after or during the update | only `Inline Card`; ownedChildren 2; updating back to `@A` renders A |
| R7: pending `@A`, then update to an invalid body; after or during | only "Refused body message"; no base view, no ElementView child; back to `@A` renders A |
| R7c: pending `@A`, update to inline, then the stale lookup **rejects** | only `Inline Card`, no error text |
| R9: view unloaded while its lookup runs | still draws its own root (unchanged, so no legitimate resolution is dropped) |
| R4, R4b, R5, R6 (r2 probes, SC-536 territory) | same as r2 head: no change |

## Item 2: can an early `resolveGen` return leave something behind or drop a real resolution?
I read the code and probed it. Nothing is left behind and nothing legitimate is dropped.
- **Loaded child:** none. Every check (`RefUnwrapView.ts:220, 243, 256, 304, 308, 310`) runs before `mountBase`. A superseded resolution never calls `addChild`.
- **Half-written root:** none. The only root writes before the first `await` (no compendium, toCode error, unknown code, web card) are synchronous, so nothing can supersede them mid-way.
- **Map entry:** an early return still goes through `finally`, and the delete compares the token (`:260`).
- **Skipped cleanup:** none. A stale resolution never performed any cleanup; it only wrote.
- **Dropping a real resolution:** a resolution is dropped only when a later `onMount` of the same view has started, which means newer content replaced it. An update with an identical model draws (R1). Unloading does not change `resolveGen` (R9).

## Findings

### LOW-1: the INFO-3 fold covers only the SC-525 describes; a failing SC-510 hold still cascades
- `test/dom/authoring/formModalStalePreview.test.ts:360-363` (`releasers` + `afterEach`) are filled only by the SC-525 `withRef` helper and the ds-scc test.
- `holdLookups` (`:67`), which the SC-510 tests use on the same preview blockKey, registers nothing.
- **Proof** (`sc525-r4-cascade.log`): I added a deliberate throw mid-hold in the SC-510 test "every keystroke's lookup finishes after the last one". Result: **12 failed of 28**. That is the 2 injected failures (feature and statblock) plus 10 cascades: 4 more SC-510 tests and all 6 SC-525 `@Ref.md` tests.
- The same injection inside an SC-525 test is contained on head: 2 of 28 fail, against 6 of 28 on `af09bf2`'s test file.
- The guard suite is contained too: 1 of 36 on head against 4 of 22 on `af09bf2`.
- **Fix:** register the release inside `holdLookups` itself, so every hold in the file is released (`releasers.push(async () => { holding = false; for (const h of held) h.release(); await settle(); })`). Move `releasers` and its `afterEach` above `holdLookups`, and drop the duplicate push in `withRef`.

### LOW-2: no `resolveGen` check is pinned on its own
- Mutants M9-k drop only the k-th check (`sc525-r4-mutants.log`). All six (`:220, 243, 256, 304, 308, 310`) pass the 69 tests of the three suites. The tests hold only `getEntity` and `refs.resolve`, and a later check still catches those windows.
- **Per-window tests** (`sc525-r4-probe-windows.ts.txt`) pass on head and kill single-check mutants (`sc525-r4-windows.log`):
  - W1: stale `getEntity` returns null. Kills `:220`: the stale "found but not renderable" card is drawn under the new card.
  - W3: update during `entity.body()`. Kills `:256`: two cards.
  - W4: the stale lookup rejects after an update to inline. Kills `:304`: a "lookup rejected" error card is drawn over the inline card.
  - W5: update during the referenced file's block-text read. Kills `:310`: two cards.
- `:243` (after `model()`) protects only the stale "parsed undefined, not renderable" card. W2 as written passes without it because `:256` catches the mount.
- `:308` is redundant with `:310`: there is no write between them. It only skips one file read.
- **Fix:** paste W1, W3, W4 and W5 into the `in-flight depth guard (SC-525)` describe. Optionally add a W2 variant where the stale `model()` returns `undefined`, for `:243`. Optionally keep `:308` with a one-line comment that it only saves a read.

### INFO-1: e2e CHR-F02 failed once, unrelated
Run 1 (`sc525-r4-e2e-run1.log`): `[CHR-F02] Enter on Expand … [data-dse-control="chrome.collapse"] still not displayed after 8000ms` in `e2e/specs/stamina-bar/chrome-focus.e2e.ts:69`. The note is unchanged, there are no page errors, and the screenshot shows an expanded stamina bar with no hover panel. 1-min load was about 6. Run 2 (`sc525-r4-e2e-run2.log`) was 124/124. The stamina bar does not use RefUnwrapView, and the delta touches only that file. The failure bundle is copied to `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc525-r4-rereview/e2e-CHR-F02/`. Under the no-retries rule this is a flake for the owner to file.

### INFO-2: `resolveAndMount`'s own `++` is redundant after r3b
`RefUnwrapView.ts:172`, `const gen = ++this.resolveGen`. Mutant M10 (`this.resolveGen` without the `++`) passes everything, because the `onMount` bump (`:107`) always runs first. It is harmless; keep or simplify.

### INFO-3: older class, not in the delta — a child whose own mount is still awaiting when the view updates
R8: a base view that awaits before writing, then updated mid-mount, ends with two cards. `onUpdate` unloads the child, but the child's continuation still writes into the shared root. Feature, featureblock and statblock `onMount`s are synchronous (`feature/view.ts:48`, `featureblock/view.ts:97`, `statblock/view.ts:325`), so this does not apply to the SC-525 elements. No action for SC-525.

## Mutants (`sc525-r4-mutants.log`; three suites, 69 tests; tree restored)
| Mutant | Red |
|---|---|
| M4 drop `current.view !== this` | 7 |
| M6 drop all six `resolveGen` checks | 11 |
| M7 delete by `entry.view === this` instead of token | 1 |
| M8 drop the `onMount` bump (r3b) | 4 |
| M9-0..5, one check each | 0 each (LOW-2) |
| M10 no `++` in `resolveAndMount` | 0 (INFO-2) |

## Gates (`b1d5fa9`, each one foreground call)
| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc 0 | `sc525-r4-tsc.log` |
| lint | clean, rc 0 | `sc525-r4-lint.log` |
| jest | 6180 passed / 1 skipped, 248 of 249 suites, rc 0 (r3b: 6180/1) | `sc525-r4-jest-full.log` |
| lifecycle half A | 20/20, rc 0 | `sc525-r4-lifecycle-a.log` |
| e2e run 1 | 123/124, CHR-F02 failed, rc 1 (INFO-1) | `sc525-r4-e2e-run1.log` (= `sc525-r4-e2e.log`) |
| e2e run 2 | 124/124 ok, 0 failed, 0 known-bug, coverage 87/87 pairs, rc 0 | `sc525-r4-e2e-run2.log` |
