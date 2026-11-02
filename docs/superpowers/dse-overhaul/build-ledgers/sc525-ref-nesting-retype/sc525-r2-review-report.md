# SC-525 round 2 — independent review report

## Executive summary
- **Verdict: LAND-READY.** The `af09bf2` fix does what the ledger says: the form-preview retype bug is gone for feature, statblock and ds-scc. Measured: 0 of 24 three-mount permutations on head show the nesting error, against 24 of 24 on base. Real Obsidian matches.
- Findings: **0 HIGH, 2 MEDIUM, 1 LOW, 4 INFO.** Both MEDIUMs are older bugs that also happen on base. They are not caused by this branch and do not block landing. Each needs a follow-up ticket.
- MEDIUM-1: in real Obsidian the depth guard never stops a real reference cycle. One note recursed past 116 levels in 30 s with no error card, on both base and head.
- MEDIUM-2: Reading view shows a wrong "Reference nesting too deep" when the same note is open in two panes and the plugin is turned off and on (3 of 3 runs, base and head). It also shows after two quick redraws while a lookup is running.
- LOW-1 (addendum question): calling `onUpdate` on a card while its own lookup is still running now shows two stacked cards and keeps one stale child view. Base showed the card plus the old error. Both are wrong. Head is different, not worse: no endless recursion and no stuck map entry. No test covers this branch (my mutant M4 survives). A test is prescribed below.
- Empty while pending: matches develop. On base, a first-time lookup in the form preview also shows an empty slot.
- Gates on `af09bf2`, run by me: tsc and lint clean; jest 6166 passed / 1 skipped / 248 of 249 suites; lifecycle 20/20 + 21/21 = 41/41; e2e 124/124 with 87/87 coverage pairs. All match r1. I did not re-run shots, freeze or parity.
- r1's screenshots show what the report claims. One error in r1's mutation log: under M3 the `refUnwrapView` suite ran out of memory (endless recursion). r1 reported only the `displayCardHybrid` failure (INFO-1).

## What was run
Worktree `/home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements`, head `af09bf2`, base `4deb8cf`. `git status --porcelain` was empty before and after. All probes ran in throwaway files that were deleted by literal path. Base runs restored the two `src` files from `4deb8cf` and then put HEAD back.

| Probe | Where | Head | Base |
|---|---|---|---|
| F0: first-time held lookup, form preview (feature, statblock) | jsdom | slot empty (textLen 0, no error), then the card | same |
| F1: three mounts of the same reference (`@Ref.md`, +1 space, +2 spaces), all 6 release orders x 2 elements | jsdom | 0/12 nesting error; ends on the card, 1 slot, no error | 12/12 nesting error, ends on the error |
| F2: A pending, B (`@Other.md`) pending, A again; 6 orders x 2 | jsdom | 0/12; ends on the Ref card | 12/12 nesting error |
| R1: `onUpdate` with the same reference while the view's own lookup is held, both orders | jsdom | 2 stacked `A` cards; ownedChildren 3, still 3 after a later update (1 orphan) | `A` card plus the nesting error card; ownedChildren 2 |
| R2: `onUpdate` A to B while A is held (older bug class) | jsdom | `A` and `B` cards both mounted | same |
| R3: R1 with a self-reference (A to A) | jsdom | stops: 4 views, 2 nesting cards | stops: 2 views |
| R4: cycle A to B to A, ancestors unloaded mid-resolution | jsdom | stops: A, B, A, B, error | stops: A, B, error |
| R4b: adversarial, every new view loaded then unloaded before it resolves | jsdom | stopped only by the probe's cap (42 views) | 3 views |
| R5: unloaded owner whose lookup never settles, then a new mount | jsdom | new mount renders | **refused permanently** (head fixes this leak) |
| R5: live owner whose lookup never settles | jsdom | later mounts refused | same (older behaviour) |
| R5: lookup rejected; base mount throws | jsdom | entry cleared, next mount renders | same |
| R6: two live copies with one blockKey, at the same time | jsdom | second refused | same |
| Reading view A: two redraws while the first lookup is held | real Obsidian 1.15.0 | error card, **still there after release** | same |
| Reading view B: second pane opens (held), then pane 1 redraws | real Obsidian | pane 1 keeps the error after release | same |
| Reading view C: split pane plus redraw in the same tick, no hold | real Obsidian | error in 4/5 runs | 5/5 |
| Reading view D: two panes of the note, plugin off and on, no hold | real Obsidian | error in 3/3 runs | 3/3 |
| Real cycle: `Cyc.md` feature whose effect has a `~~~ds-feature` fence with body `@Cyc.md` | real Obsidian | 116 levels, 0 error cards, still growing | 117 levels, 0 error cards |

## Findings

### MEDIUM-1 (older bug, follow-up): the depth guard does not stop a real reference cycle in Obsidian
- `src/elements/shared/RefUnwrapView.ts:163-172`: `guardKey` is built from `cx.host.blockKey()`. `src/framework/host/ReadingModeBlockHost.ts:723-731`: that key is `sourcePath::language::lineStart`, or a `docId` fallback.
- **Scenario:** `Cyc.md` holds a feature whose effect markdown contains a `~~~ds-feature` / `@Cyc.md` / `~~~` fence. A note's ds-feature block contains `@Cyc.md`.
  - Reading view nests the card inside itself without limit: 116 levels and 116 lookups in about 30 s, no "nesting too deep" card, and lookups never settle.
  - Base behaves the same (117 levels).
  - The jsdom guard tests pass only because their nested `pipeline.run` reuses the same host, so nested views share one blockKey. Real nested blocks evidently get a different key. I did not instrument the key; the docId fallback is the likely cause.
  - Logs: `sc525-r2-obsidian-cycle-{head,base}.log`.
- **Not caused by SC-525,** and it does not block landing. It does mean "genuine cycles are still refused" holds only in jsdom.
- **Fix (follow-up ticket):** make the guard follow ancestry instead of block identity:
  - Either pass the chain of references being resolved down through `RenderContext`, so a nested view sees its ancestors' references whatever its blockKey.
  - Or refuse when a live owner's `rootEl.contains(root)`.
  - Add a hard depth cap as a backstop.
  - Add a lifecycle scenario using the `Cyc.md` fixture from `sc525-r2-obsidian-cycle-scenario.js.txt`.
  - This change would also cover MEDIUM-2 and the SC-525 case, and could later replace the owner map.

### MEDIUM-2 (older bug, follow-up): Reading view shows the nesting error when one block is live twice
- Same lines as MEDIUM-1. The guard reads "another live view with the same blockKey" as nesting. Two Reading panes of one note have the same blockKey.
- **Scenario:**
  - Real Obsidian, no hooks: open a note with a `@Ref.md` feature block in two panes, then turn the plugin off and on. The second pane shows "Feature: failed to render (render) Reference nesting too deep" in 3/3 runs on both base and head.
  - Split pane plus a redraw in the same tick: error in 5/5 runs on base, 4/5 on head.
  - `previewMode.rerender(true)` twice while the first lookup is held: the error stays after release. The first redraw's view is still live when the second view resolves. This is the SC-525 symptom, but in Reading view, and head does not fix it.
  - Logs: `sc525-r2-obsidian-probe-{head,base}.log`.
- **Fix:** the same ancestry guard as MEDIUM-1, in one follow-up ticket. SC-525's fix is correct for the form preview, where the old view is unloaded before the new one mounts (`FormModal.ts` `renderPreview`). It cannot help where the other copy is really live.

### LOW-1 (addendum ruling): a view that re-enters while its own lookup runs is no longer refused; result is a double mount plus an orphan child
- `src/elements/shared/RefUnwrapView.ts:165` (`owner !== this`), `:239` (`finally`), `:140-153` (`onUpdate`), `:347-351` (`mountBase`).
- **How it happens:** `SidebarPanel.handleExternalChange` (`src/framework/sidebar/SidebarPanel.ts:301`, fire-and-forget at `:168`) calls `previous.update(model)` on the pinned card. A second edit to the backing note during an in-flight lookup that leaves the reference unchanged (for example a `prefs:` line, or a trailing space) re-enters `resolveAndMount` on the same view. The form never does this.
- **Measured (R1, jsdom, both release orders):**
  - Head: both resolutions run and both call `mountBase`, so two cards are stacked in one root. The first child view stays loaded and is no longer tracked as `mountedChild`, so the next `onUpdate` cannot remove it. ownedChildren stays at 3 against base's 2 until the card unloads.
  - Base: the second call is refused, so the card is drawn under a stale nesting error card.
  - No map entry is left behind: a fresh view afterwards renders.
  - Self-reference (R3) stops (4 views). The first resolution's `finally` deletes the entry while the second is still running, so the second's nested child gets one extra level before it is refused.
  - A→B re-entrance (R2) already double-mounts on base. This is an older class of bug that now also covers the same reference.
- **Ruling:** different, not more harmful. No endless recursion, no stuck entry, and the orphan is freed when the card unloads. Not a blocker.
- **Mutant M4** (drop `owner !== this`) survives the whole test set: the branch has no test.
- **Prescribed fix (small, optional in this ticket):**
  - Store a per-resolution token, `const token = { view: this }`, with `IN_FLIGHT_REFS: Map<string, { view: ElementView<unknown> }>`.
  - Refuse when `cur && cur.view !== this && !cur.view.isUnloaded()`.
  - In `finally`, delete only if `IN_FLIGHT_REFS.get(guardKey) === token`.
  - Add `private resolveGen = 0`: take `const gen = ++this.resolveGen` at the start of `resolveAndMount`, and after each `await`, `if (gen !== this.resolveGen) return;` before any `errorCard`/`webCard`/`mountBase` write. A superseded resolution of the same view then never writes.
- **Prescribed test (either way)**, in the `in-flight depth guard (SC-525)` describe:
  - Hold, `run('@A')`, then `views[0].update(views[0].currentModel())`, then release in both orders.
  - With the fix: exactly one `.test-base-view`, no nesting card, and `ownedChildren` back to its pre-update count after a later `update`.
  - Without the fix: pin the current two-card behaviour, titled `[current behaviour — SC-nnn will …]`.
  - Add the A→B variant.

### INFO-1: r1's M3 mutant result is incomplete
Under M3 (`_loaded` in place of `isUnloaded()`), r1 and I both see `Tests: 1 failed, 32 passed, 33 total` with 2 suites failed. The missing 22 tests are the `refUnwrapView` suite, which **ran out of memory**: a JS heap out-of-memory crash after 65 s (`sc525-r2-m3-oom.log`). The cycle tests' views are never `load()`ed, so they read as dead owners and the cycle never stops. r1 reported only the `displayCardHybrid` failure. This is the clearest evidence for the `unloaded`-not-`_loaded` choice, and for a depth-cap backstop: any future case that misjudges an owner as dead is unbounded (see R4b). With the real `unloaded` flag the escape is bounded in practice: views created under an unloaded tree are never loaded, so they count as live owners. R4 shows exactly one extra lap of the cycle.

### INFO-2: empty while pending matches develop
F0 on base and head: a first-time `@Ref.md` lookup leaves the preview slot empty (text length 0, Read-only badge, no error) until it resolves. Head's empty preview at the Space key is the same state, not a new one.

### INFO-3: test hygiene — module-level `IN_FLIGHT_REFS` persists across tests in a file
In my first base run, a failing test left a live held lookup. Every later test in that file with the same preview blockKey was then refused, before its own code ran. The suites are green today because every test releases its holds. A future test that times out mid-hold will cascade into unrelated failures. Optional: give each harness setup a unique blockKey (my probes do), or add a test-only reset export.

### INFO-4: head also fixes a permanent-block leak
R5: on base, an unloaded owner whose lookup never settles blocks its key forever: every later mount of that block shows the nesting error. On head the new mount renders. A live owner that never settles still blocks, on both.

## Test quality
- The 13 new tests are not vacuous. Re-run mutants:
  - M1 (drop the unloaded check): 9 red.
  - M2 (unconditional delete): 1 red.
  - M5 (mine: no takeover, set only if absent): 1 red.
- M3 makes the refUnwrapView suite run out of memory (INFO-1).
- M4 (mine: drop `owner !== this`) has 0 red, so the re-entrance branch is untested (LOW-1).
- The form tests check both release orders and the held count, so they prove the current preview starts its own lookup.
- The cycle tests are valid jsdom pins, but they do not model real nested blockKeys (MEDIUM-1).

## Real cards outside the form, and SC-481 / SC-522
Head's only change outside the form: no refusal when the previous owner has unloaded, and no deleting another view's entry. That gives fewer wrong refusals and never more (R5, R6 and the Reading-view probes match base except where an owner had unloaded). Nothing here touches block save, identical-block redraw (SC-481) or the Live Preview scroll hold (SC-522). The lifecycle G-S7a/b, G-S18, G-S40 and G-S50 scenarios are green on head.

## Screenshots (r1)
- `sc525-r1-shot-base-form-preview.png`: box `@Ref.md ` with the red "Feature: failed to render (render) Reference nesting too deep" card. This matches the base claim.
- `sc525-r1-shot-head-form-preview.png`: the same box with the full Ref Strike card. This matches the head claim.

## Gates (head `af09bf2`, by me, each one foreground call)
| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc 0 | `sc525-r2-tsc.log` |
| lint | clean (only the `.eslintignore` warning), rc 0 | `sc525-r2-lint.log` |
| jest | 6166 passed / 1 skipped, 248 of 249 suites, rc 0 | `sc525-r2-jest-full.log` |
| lifecycle half A | 20/20, rc 0 | `sc525-r2-lifecycle-a.log` |
| lifecycle half B | 21/21, rc 0 | `sc525-r2-lifecycle-b.log` |
| e2e | `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0 | `sc525-r2-e2e.log` |
| shots / freeze / parity | not re-run (r1: 592 / 280/280 / 0-0-24) | — |
