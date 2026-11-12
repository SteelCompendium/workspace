# SC-598 r3 independent review (identity R1)

## Executive summary
- **Verdict: LAND.** There is no CRITICAL or HIGH finding and no regression. MEDIUM-1 needs an owner ruling: extend the fix here (a measured 4-line shape, R14), or file a follow-up. LOW-1 must be resolved when the branch lands.
- **Counts:** CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 1 · INFO 7.
- **Gates I measured on dse `47950f45`** (origin/develop = `e0e49d4d`, fetched):
  - tsc rc 0 and lint rc 0;
  - jest **7317 passed / 2 skipped** (fresh tree, 54 s);
  - lifecycle part 5 **7/7 ok** in **385 s**;
  - e2e **`270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (130 s, RECOV-R07 ok);
  - styles.css sha256 `5e5ff488…` on the head build and on the `e0e49d4d` build.
- **G-S91:** red on my own `e0e49d4d` build (5/5 trials, "the preview was gone") and green on the head. Each trial checks that the press lands on the number's own element (`"15" on dse-stamina__ccur`). Measured gaps: 43-77 ms for title and apply, 98-134 ms for the queued double-click.
- **Mutants:**
  - jest: 23 of 24 killed. That is 12 of the 13 new SC-598 mutants plus all 11 SC-597 K mutants. The survivor, R12 (removal at 11 ms), is equivalent.
  - G-S91 against mutant bundles: R1, R2 and R6 are red. R7 is green but jest kills it; R12 is green and equivalent.
- **O8 probe (real Obsidian 1.15.1):** red on base for every opener (stamina bar, hero sheet bar, initiative row bar, montage cell text, "Log an action…"). Green on head in Reading view and Live Preview. Every open sends exactly 1 synthetic click on the anchor and opens no second modal. No opener element has a default action. No editor switch on a first open.
- **O10:** not red. The dblclick-opened pool window survives a title press about 105 ms after it opens (RV and LP, head and base).
- **MEDIUM-1:** re-opening from the same, now focused, preview with a fast second press switches the preview into a source editor, and keyboard focus moves into its CodeMirror behind the open window. The base does the same. The `.is-editing` gate leaves this as it was.

## Findings

### MEDIUM-1: a re-open from an already-focused preview with a fast second press turns the preview into a source editor (pre-existing; the `.is-editing` gate keeps it)
- **Where:** `src/framework/kit/managedModal.ts:283`, `if (!anchor || !pop || pop.classList.contains('is-editing')) return;`.
- **Scenario, measured.**
  1. Hover the link to the stamina note, press the "15" to open the window, then close it (Escape). The preview is now `.is-editing` / `isFocused`.
  2. Press the "15" again, then press the window title 65-161 ms later.
  3. 700 ms later the preview shows a source editor (`editor=Y`), and `document.activeElement` is the preview's `DIV.cm-content` while the Stamina window is still open. After Escape the preview stays in source mode until the next outside click.
  4. Obsidian's helper timer for the re-open's opening click (150 ms, on text) runs `p()` plus its "open the editor?" test. The second press has moved focus to `body` by then, and the target `.dse-stamina__ccur` is not inside an `.interactive-child`.
  5. Measured identically on base `e0e49d4d` and on head, with second-press delays of 1 ms and 100 ms (evidence in `sc598-r3-probe-again-{head,base}.log`). It is NOT a regression.
- **Why it matters:**
  - It is the ticket's own gesture. Opening a stamina window again from the same preview is the normal second use.
  - It is the failure r1 rejected (a0) for: the preview switches into a source editor.
  - Focus lands in the note's source behind an open window, so the next keys typed edit the note's source.
- **Prescribed fix (measured green):** for an `.is-editing` preview, `preventDefault()` the opening click and return, with no synthetic click and no class:
  ```ts
  if (!anchor || !pop) return;
  if (pop.classList.contains('is-editing')) { opening.preventDefault(); return; }
  ```
  - The helper's timer then skips the click, so there is no `p()` re-run, no extra scope push, no leaked window listener and no editor switch.
  - The preview is already focused, so T3 never hides it.
  - Probe with this shape (bundle `R14`): `stam:rv` re-open at 1 ms and 100 ms, `logbtn:rv` re-open at 100 ms, and a first open, all green. `editor=n`, focus stays out of the preview, Escape closes only the window, an outside click closes the preview (`sc598-r3-probe-again-R14.log`).
  - Dropping the gate entirely (R8) is also green (`sc598-r3-probe-again-R8.log`), but it runs `p()` once more and needs the synthetic click. R14 is smaller.
  - jest under R14: 1 test fails, `.is-editing preview gets only the opening click, which is not default-prevented` (`sc598-r3-mutants-R14.log`). Rewrite it to assert one click and `defaultPrevented === true`, read synchronously (see INFO-6).
  - Add a G-S91 trial `reopen rv`: open, Escape, open again, title press within 150 ms, then no `.cm-editor` visible and focus not in the preview.
- **If the owner rules it out of scope:** file a follow-up and add one sentence to the dse-verify bullet ("a re-open from an already-focused preview with a fast second press still switches the preview into a source editor, base behaviour").

### LOW-1: the superproject branch does not rebase cleanly onto current workspace `origin/main`
- Branch `2a8b0b36` (cut from `a2874ce2`) rebased onto `origin/main` `e9ff3635` gives a `CHANGELOG.md` conflict. SC-588's bullet (`04145630`) and the SC-598 bullet are both inserted at the top of `## Unreleased`. Conflict hunk: `sc598-r3-super-rebase-conflict.diff.txt`.
- **Failure:** `just wt-finish` or a rebase stops on the conflict at landing.
- **Fix:** rebase onto `origin/main` and keep both bullets (SC-598 directly above or below SC-588). The conflict is textual only and there are no other paths.

### INFO
1. **Popouts:** `managedModal.ts:289` arms the `interactive-child` removal on `win`, the modal's window. Obsidian's helper (`zh`) arms on the global `window`, which is the main window.
   - In a popout the "armed after the helper's" order therefore spans two windows' timer queues, which nothing guarantees. The same holds, pre-existing, for `arm()`'s re-pushes.
   - In practice this is harmless:
     - T3 is registered on the main window only, so the SC-598 close does not happen in a popout at all.
     - The class matters only if a second press moves focus off a control within 10 ms.
   - No action needed. If wanted, put the removal on the same timer queue as the helper.
   - Not probed: the harness has no popout hover path.
2. **R12 (removal at 11 ms) survives jest and G-S91.** It is equivalent: the class still comes off after the helper's 10 ms read. Ordering by construction versus by margin is invisible to fake timers. No action.
3. **O10 (initiative grid dblclick).**
   - Minion cell, text "12/12 (4)", RV and LP, head and base: the dblclick opens the pool window 104-127 ms after the second press. A title press about 105 ms after the window opens leaves the window and the preview open, and Escape closes only the window. The first click's helper had focused the preview first (at +289 to +374 ms; the dblclick handler's synchronous work delays the timer).
   - Captain cell, press on "Captain", head and base: no window opens at all. The first click selects the cell and builds `.dse-init__detail` under the pointer, so the `dblclick` target is the detail row.
   - (b) is never entered on a dblclick (it is the non-click branch). Not red, so it is dropped per O10. The captain dblclick that opens nothing is pre-existing and out of scope; a possible follow-up.
4. **Out of scope, pre-existing (base too):** `LogActionModal` in edit mode throws in `onOpen` when the logged hero's participant has no `skills_used`.
   - Stack: `model.ts:367` `p.skills_used.slice()` via `refreshSkillWarning`. That participant shape is the one the lifecycle's own `gs87-mont` fixture uses.
   - `DseModal.open` then never reaches `keepHoverPreviewAlive`, so in a preview the half-built window and the preview close on the next click.
   - Probe `monttextns` (`sc598-r3-probe-head2.log`, `sc598-r3-probe-final-{head,base}.log`). Suggest a Backlog ticket: default `skills_used` to `[]` at parse.
5. **Not probed by its own control:** the initiative hero's numeric stamina button (`init.hero.stamina`, "30/30") could not be hit in the preview at the harness size. `elementsFromPoint` at its centre lists row, entry, group… and not the button. Head only. I probed the same StaminaEditModal through the row bar (`initbar`) instead, red on base and green on head.
6. **jest stand-in fidelity** (`test/dom/_hoverPreviewStandIn.ts`). T3 is a window CAPTURE listener, the helper is an embed bubble listener, and the delays are the literals 10 / 150. That is correct and meaningful: my R1-R11 and R13 are all killed. Two notes:
   - The stand-in does not model `zh`'s `mousedown detail>1 → clearTimeout`, nor its "focus inside the container" early return. Neither path is used by these tests.
   - Like Obsidian, its timer calls `preventDefault()` on the click, so a test must read `defaultPrevented` synchronously, before advancing timers. My own first scratch test tripped on this. Worth one clause in the proposal's jest paragraph.
7. **Docs:**
   - The worktree CHANGELOG bullet body is O11's text verbatim. The bold headline above it paraphrases the first sentence, in the same format as the sibling bullets.
   - The dse-verify proposal is accurate against what I measured: 13 tests, 57/57 lifecycle with part 5 at 384-385 s, the gaps, CURRENT. It is ready to apply, plus MEDIUM-1's sentence or fix and INFO-6's clause.
   - O9, O10 and O12: no new evidence against them. O10's probe result is INFO-3.

## Correctness of (b) as built (section 2.1 of the brief)

| Check | How | Result |
|---|---|---|
| `focusHoverPreviewNow` before `arm()` | R7 mutant | jest kills it (5 tests, scope order at 20 ms). G-S91 green under R7: Escape at 700 ms hides it, as expected. |
| Helper timer before the 10 ms re-push; class removal after the helper's | R6 (0 ms) and R12 (11 ms); real-Obsidian event logs | R6: jest 3 red, G-S91 red (dblq RV and LP: source editor). R12 is equivalent. In real Obsidian `setIsFocused` comes 10-50 ms after the synthetic click, and the anchor is without the class at +30 ms in every trial (`anchorIC=False`). |
| `.is-editing` gate | R8 mutant; real-Obsidian re-open probe | jest kills it (1 test). Real re-open: synthetic=0 (a no-op), but see MEDIUM-1. |
| `interactive-child` only if absent | I1's N12/N15; my P-tests | covered (killed). |
| Popout `MouseEvent` from the anchor's window | read | `new anchorWin.MouseEvent` is correct; see INFO-1 for the timer queue. |
| Nested child modal from a preview-opened parent | scratch jest P2; G-S83 free-heal Confirm | the child sends no further synthetic click (the parent's document guard stops the click before the window); G-S83 ok. |
| Already-focused preview is a no-op | scratch jest P3; real probe | no synthetic click and the opening click not default-prevented at dispatch; real: synthetic=0. |
| Closed within 10 ms | scratch jest P1 | at +300 ms the class is removed (the removal timer is deliberately not lifecycle-registered), scopes are `[popover]`, the preview is focused, not hidden, not an editor. |
| Re-entrancy | scratch jest P4; real event logs | `focusHoverPreviewNow` runs once per open, one `.modal-container`. Real: exactly 1 synthetic click (`SYN … ANCHOR d0 cx0`) per open, `modal+` = 1 per trial. The synthetic click passes the document guard (its path has no modal) and reaches the helper (`setIsFocused` follows). |

Scratch jest probes: `sc598-r3-probe-jest-scratch.test.ts.txt`, run `sc598-r3-probe-jest2.log` (5/5 pass).

## O8 probe: each opener opened from a preview by a press on its TEXT, second press on the window title

How the probe works:
- It is a scratch copy of the worktree's lifecycle harness with one scenario injected (`sc598-r3-probe-scenario.js.txt`, `sc598-r3-make-probe.py.txt`). It uses a real Ctrl-hover and real CDP presses. For each opener it asserts that `elementFromPoint` at the press point is the text node's own parent.
- The second press is sent as soon as the title's point is known.
- "Margin" is how far the second press landed inside the base's helper window: modal-open time + 150 ms − second-click time. A positive margin means the base would not yet have focused the preview.
- State is read at +700 ms, then Escape, then the pointer away for 1.2 s, then a real click on the view header.

| Opener (text pressed) | Element | Default action | Mode | Margin | Base `e0e49d4d` at +700 ms | Head `47950f45` at +700 ms; after Escape / rest / outside |
|---|---|---|---|---|---|---|
| Stamina bar ("15") | `DIV.dse-stamina` | none | RV | 127 / 131 ms | preview and window gone (HIDE 5-7 ms after the press) | both open, synth 1, no editor; Escape closes only the window / stays / closes |
| | | | LP | 124 ms | — | same green |
| Hero sheet bar ("31") | `DIV.dse-stamina` | none | RV | 107 / 125 ms | gone | green (`modal+ "Torin Stonefist Stamina"`, synth 1) |
| Initiative row bar ("30") | `DIV.dse-stamina` | none | RV | 72 / 85 ms | gone | green (`"Alice Alpha Stamina"`, synth 1) |
| Montage cell text ("Nature") | `DIV.dse-mt__cell` | none | RV | 98 / 99 ms | gone | green (`"Kira · round 1"`, synth 1) |
| | | | LP | 88 ms | — | green |
| "Log an action…" (`.dse-btn__text`) | `BUTTON.dse-btn` `type=button` | none | RV | 93 / 108 ms | gone | green (`"Kira · round 2"`, synth 1) |
| | | | LP | 94 ms | — | green |

Common to every head trial:
- exactly 1 untrusted click, on the anchor (`block-language-ds-*`, detail 0, clientX 0);
- no second window;
- leaf count unchanged, no navigation, no source editor;
- the anchor has lost `interactive-child` by +30 ms.

`hasDefault` was false for every opener (no `a[href]`, `label`, `summary`, `form`, `input`, or non-`type=button` button on or above it). That confirms I1's O8 (i) table by probe. Logs: `sc598-r3-probe-final-{head,base}.log` (+`-raw`), `sc598-r3-probe-head3.log`.

O8 (ii), checked by code against I1's table:
- Every DSE `click` listener on the anchor or above it is one of four: the document guard, `onWindowBubble`, `sccLinkClickHandler`'s capture listener (`closest('a')` is null), or `RecoveriesStrip`'s click-outside (a no-op unless its popover is open; the opening click closed it first).
- `ConditionsModal`'s listener exists only while one is open.
- `armClickShield` sits on the root, a descendant of the anchor, and never sees the synthetic click.

I1's table is correct, and the probe shows no second modal.

## Regressions
- **SC-595:** G-S83 ok (form RV and LP, stamina, stamtext, conditions RV and LP; free-heal Confirm and form Cancel keep the parent and the preview). Its 32 jest tests pass within the full run.
- **SC-597:** G-S87 ok. Its 22 tests pass. K1s-K6 against the UPDATED tests are 11/11 killed (`sc598-r3-mutants.log`). The O7 updates did not weaken them: K4 (two clicks) and K3 (parent) die on the new `filter(target === opener).length === 1` assertion.
- **SC-552, SC-556, SC-584:** covered by G-S59, G-S49, G-S73 and G-S77, all ok in part 5. The rest of the suite is covered by full jest and e2e.
- **After close:** in every first-open trial the preview stays with the pointer away and an outside click closes it, RV and LP. There is no source editor except in MEDIUM-1's re-open case, which the base shares.

## Mutants (mine, scratch archive copy `r3mut`; runner `sc598-r3-mutate.py.txt`)

| Id | Mutant | jest | G-S91 |
|---|---|---|---|
| R1 | no `preventDefault` | killed (3) | **red**: title RV/LP and dblq RV/LP show a source editor |
| R2 | no synthetic click | killed (14) | **red**: 5/5 "preview gone" |
| R3 | dispatch on the popover | killed (14) | — |
| R4 | non-bubbling | killed (8) | — |
| R5 | class never removed | killed (1) | — |
| R6 | removal at 0 ms | killed (3) | **red**: dblq RV/LP source editor |
| R7 | call after `arm()` | killed (5) | green (jest only) |
| R8 | no `.is-editing` gate | killed (1) | — (fixes MEDIUM-1 in a real probe) |
| R9 | dispatch on the anchor's parent | killed (9) | — |
| R10 | class on the popover | killed (2) | — |
| R11 | synthetic `detail: 2` | killed (7) | — |
| R12 | removal at 11 ms | survived (equivalent) | green (equivalent) |
| R13 | trusted-only gate (skips SC-597 keyboard opens) | killed (14) | — |
| K1s-K6 | SC-597 (11) | 11/11 killed | — |

R14 is the MEDIUM-1 fix shape, not a mutant: jest 1 red, the `.is-editing` test it deliberately changes.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/`)
- **Gates:** `sc598-r3-gate-summary.txt`, `sc598-r3-gate-tsc.log`, `sc598-r3-gate-lint.log`, `sc598-r3-gate-jest.log`, `sc598-r3-gate-lifecycle-part5.log`, `sc598-r3-gate-e2e.log`, `sc598-r3-build-styles-sha.log`.
- **G-S91:** `sc598-r3-gs91-base.log`, `sc598-r3-red-on-base-G-S91-FAIL.png`, `sc598-r3-gs91-R1.log`, `-R2.log`, `-R6.log`, `-R7.log`, `-R12.log`.
- **Mutants:** `sc598-r3-mutants.log`, `sc598-r3-mutants-R14.log`, `sc598-r3-mutant-bundles.log`; scratch jest `sc598-r3-probe-jest2.log`.
- **Probes:** `sc598-r3-probe-final-head.log`, `sc598-r3-probe-final-base.log` (+`-raw.log`), `sc598-r3-probe-again-{head,base,R8,R14}.log` (+`-raw.log`), `sc598-r3-probe-head2.log`, `sc598-r3-probe-head3.log`.
- **Superproject:** `sc598-r3-super-rebase-conflict.diff.txt`.
- **Scripts:** `sc598-r3-*.sh.txt`, `sc598-r3-mutate.py.txt`, `sc598-r3-probe-scenario.js.txt`, `sc598-r3-make-probe.py.txt`, `sc598-r3-summarize.py.txt`, `sc598-r3-probe-jest-scratch.test.ts.txt`.
- **Worktree:** left as found: superproject ` M draw-steel-elements` (the unbumped pointer, as at start), dse clean at `47950f45`. My four kept lifecycle FAIL dirs were deleted by literal path. One process note: I wrote one scratch script (`r3-probe-again.sh`) with a heredoc instead of the Write tool; it is scratch only.
