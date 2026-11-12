# SC-580 r4 scoped re-review: the LOW-2 fold and the rebase

**Summary**
- **Verdict: LAND.** No HIGH or MED findings. Two LOW findings are test gaps only. The code does what the ruling asks, and I confirmed both points in real Obsidian.
- Reviewed: plugin `eecd2ff6` on develop `231f2a3b` (`origin/develop` has not moved); superproject `bbda9dd2` on main `bd10dc98` (`origin/main` has not moved). The submodule pointer is `eecd2ff6`.
- Rebase: `git range-diff` reports `b17044b0` and `eafa31c1` as `=` with r1's `7a6fbf7e` and `7a88aa1d`, so the patches are identical. SC-601 only moved a click guard into `hoverPreviewGuard.ts`. It added no key or focus handling and did not touch `ConditionsModal.ts`, so the two do not interact.
- Gates (re-run here):
  - jest **10741 passed / 1 skipped** (the shots cache was present).
  - e2e **`283/286 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`**.
  - lifecycle part 6 (`G-S92,G-S96,G-S97`) **3/3**.
  - I did not re-run shots, freeze or parity: the delta changes no rendering (TS focus logic and tests only).
- Real Obsidian probes, 7 plus COND-N11, all green. Escape after a routed open returns focus to the chip, Done or remove button that had it. A second Escape closes the window. When the control has gone stale (re-rendered, or the editor closed), focus goes to "+ Add condition". After a pick, after an outside click, and on a search opened by a click, focus also goes to "+ Add condition".
- Mutation: 8 jest mutants, 6 killed. **R1** (ignore the `escape` flag) and **R3** (no clear on pick) survive both jest and e2e. My throwaway probes RVW4-Q5 and RVW4-Q4 kill them in real Obsidian.

## Findings

### LOW-1: no test pins "only Escape returns focus" (mutant R1 survives)
- `src/views/ConditionsModal.ts:606`: `if (refocus && escape && back?.isConnected)`. Deleting `escape &&` leaves all 394 conditions-modal jest tests and COND-N11 green.
- What R1 would break: the search is opened by a letter on a chip, and the user then clicks the title or blank space. The outside close at `:189` calls `closeAdd(true)`, and focus would jump back to the chip instead of "+ Add condition". The same applies to a right or middle press at `:205`. This contradicts the ruling ("Escape" only).
- Today's code is correct (RVW4-Q5: focus goes to `cond.add`).
- Fix (test only): add a jest case to the `Escape on a search a routed key opened…` describe:
  1. Focus a chip and press `keydown(chip, 'd')`.
  2. Dispatch `mousedown` (button 0) and then `click` on the modal title, so focus is on body.
  3. Expect `document.activeElement` to be the "+ Add condition" button.
  The right-press variant (`mousedown` with button 2) works the same way.

### LOW-2: no test pins "a pick clears the return target" (mutant R3 survives)
- `src/views/ConditionsModal.ts:779`: `this.returnFocusEl = null; // a pick`. Deleting it is invisible to the branch's tests. Their only post-pick case uses a Duration chip, and the pick's `renderList()` detaches the chip anyway, so `isConnected` falls back to "+ Add condition" regardless.
- The line matters only for a return target that survives a pick. In practice that is the footer **Done** button.
- What R3 would break: a letter on Done, then `az`, then Enter (Dazed is added), then Escape. Focus would go back to Done instead of "+ Add condition", contrary to the ruling ("after a pick, behaviour unchanged").
- Today's code is correct (RVW4-Q4: focus goes to `cond.add`).
- Fix (test only): in "after a pick, Escape is the usual one", start from `qs(c, '[data-dse-control="cond.done"]')` instead of the chip, or add that as a second case.

### INFO (no action): a duplicate pick keeps the return target
- `pickMatch` returns early for a condition already on the list (`:772-775`) before the clear at `:779`. So: type the name of an existing condition from a chip, press Enter (nothing is added, the row scrolls into view), then Escape, and focus returns to the chip.
- Nothing was added, so this reads as "closed without a pick", which fits the ruling. I note it only so it is a known choice.

## Ruling conformance (real Obsidian 1.14.4, `sc580-r4-probe-e2e.log`)

| Case | Measured | Ruling |
|---|---|---|
| COND-N11: Duration chip + `d`, then Escape, then Escape | search closes and focus returns to the chip; the window closes second | yes |
| Q1: Done + `d`, then Escape, then Escape | focus `cond.done`, then the window closes | yes |
| Q7: a row's remove button + `x`, then Escape, then Escape | focus `cond.remove` ("Remove Bleeding"), then the window closes, no write | yes |
| Q2 (stale): chip + `d`, Space on another Effect chip (a write re-renders the editor), then `a`, then Escape | search closes, focus `cond.add`, window open, editor open | yes |
| Q3 (stale): chip + `d`, Enter on the row cog (editor closes), then `a`, then Escape | focus `cond.add` | yes |
| Q4: Done + `daz`, Enter (pick), then Escape | focus `cond.add` | yes |
| Q5: chip + `d`, then a real click on the title | search closes, focus `cond.add` (not the chip) | yes |
| Q6: search opened by a click, focus moved to a chip, `d` routed, then Escape | focus `cond.add` | yes (implementer choice, accepted) |

SC-431 order: in real Obsidian, Escape goes through `DseModal.onEscapeKey` and the consumer, which calls `preventDefault` and `stopPropagation` in the window capture phase. The input's own keydown handler therefore never runs a second `closeAdd`, so the returned focus is not overwritten. Both call sites pass `escape = true` (`:712` consumer, `:738` input handler). Mutants R5 and R6 each kill a test.

## Mutation results (`sc580-r4-mutants.log`)

Jest (`test/dom/views/conditions-modal*`, 394 tests):

| Mutant | Jest |
|---|---|
| R1 drop `escape &&` | **survives** |
| R2 no clear in `closeAdd` | killed (1) |
| R3 no clear on pick | **survives** |
| R4 drop `isConnected` | killed (2) |
| R5 consumer passes no `escape` | killed (3) |
| R6 input handler passes no `escape` | killed (1) |
| R7 record the target even when already open | killed (1) |
| R8 never record | killed (4) |

e2e (COND-N11 plus probes RVW4-Q1, Q4, Q5):

| Mutant | e2e |
|---|---|
| R1 | killed by RVW4-Q5 only |
| R3 | killed by RVW4-Q4 only |
| R5 | killed by COND-N11 and RVW4-Q1 |

## Rebase and superproject

- `git range-diff 3ad68185..7a88aa1d 231f2a3b..eafa31c1` gives `1: 7a6fbf7e = 1: b17044b0` and `2: 7a88aa1d = 2: eafa31c1`, so the patches are identical.
- `3ad68185..231f2a3b` touches `managedModal.ts` only to delegate the click guard to `guardHoverPreviewClicks` (`hoverPreviewGuard.ts`: one `click` listener on the document that stops propagation). It adds no keydown handling, no focus moves, and does not touch `ConditionsModal.ts`. The SC-580 `keydown` on `modalEl` and the guard are independent. G-S97 passes.
- Superproject `bd10dc98..bbda9dd2` changes the CHANGELOG and the pointer only. Both Unreleased bullets are kept: SC-601 first, then SC-580, then the rest unchanged. The SC-580 bullet now ends with the Escape focus sentence, which is accurate. `bd10dc98` is an ancestor of `bbda9dd2`, and `origin/main` is still `bd10dc98`. The pointer is `eecd2ff6`.

## Hygiene

- COND-N11 appears once in `e2e/specs`. No bracketed ticket id in any title.
- The worktree is clean before and after (plugin and superproject). HEADs are unchanged (`eecd2ff6` / `bbda9dd2`). The probe spec was removed; its copy is kept below.

## Artifacts (this directory)

- `sc580-r4-gate-jest.log`, `sc580-r4-gate-e2e.log`, `sc580-r4-gate-lifecycle-part6.log`
- `sc580-r4-probe-spec.e2e.ts.txt` (the throwaway spec; RVW4-Q4 and Q5 can be lifted into the branch if the owner prefers e2e over jest for LOW-1 and LOW-2), `sc580-r4-probe-e2e.log`
- `sc580-r4-mutants.log`
