# SC-601 r4: fix round report

## Executive summary

- DONE. dse branch `sc601-compendium-search-hover` HEAD **`ee113341`**, rebased onto develop **`c6077860`** (SC-596). Superproject branch `7199f0e6` (CHANGELOG, unchanged; its submodule pointer is unbumped).
- MEDIUM-1 fixed: `insertFullBlock(editor, entity, isOpen)` re-checks right before `replaceSelection`; `dispatchBlockChoice` passes `isOpen` and keeps the early check (exactly one Notice either way). LOW-1: the reviewer's 4 survivor tests ported (R2, R4a, R4c, R5).
- Rebase note: the first rebase target (`7866426e`) was superseded; every gate run on it is VOID and was re-run on `c6077860`. The rebase onto `c6077860` conflicted only in `visual-harness/obsidian-lifecycle.mjs` (G-S96 vs G-S97), so I rebuilt the branch by cherry-picking the four src/test commits and re-applying G-S97's net lifecycle diff with `--3way`; the r1 probe commit (`0da7e1d3` / `523b006d`) is no longer in the branch history (its diff is preserved as `sc601-r1-probe-0da7e1d3.diff`). The final-vs-`c6077860` lifecycle diff is additions only; G-S96 is untouched.
- Gates on `c6077860` + branch: tsc / lint rc 0 / 0; jest **10659 passed / 1 skipped** (1 skipped because `visual-harness/dist/obsidian-app.css` is cached from an earlier shots run; fresh worktree expectation 10658 / 2 skipped = 10624 + 27 + 7); lifecycle **60/60** (21 / 16 / 9 / 4 / 7 / 3); e2e `278/282 ok, 0 failed, 4 known-bug, coverage 171/171 pairs`; shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280; parity 0 / 0 / 24.
- Part 6 (`--only=G-S92,G-S96,G-S97`): **230 s** with build (under 300 s, so no part 7). Other parts 186 / 324 / 403 / 299 / 392 s.
- G-S97 trial 9 (preview closes inside `getEntity`, after the early check): **red** on the r2 bundle (built from `10f8aaf0` on `c6077860`): `1 broken expectations: not exactly one "closed" Notice []`, the other 8 trials green; **green** on the branch (part 6 and a solo run). Same red/green earlier on `7866426e`/`f9b0ceaf`.
- Mutants: **23/23 killed** (r2's 14 + R2, R4a, R4c, R5 + 5 for the late re-check); summary `sc601-r4-mutants-summary.txt`.
- Drive-by fixes: none. SKILL proposal updated.

## 1. Commits (dse, on `c6077860`)

| sha | what |
|---|---|
| `6d1b56e9` | fix: shared guard, anchor, choose-time check (r2 `ddee8074`) |
| `10f8aaf0` | jest: 25 tests (r2 `0e1154f2`) |
| `dd838596` | fix (MEDIUM-1): late re-check in `insertFullBlock`; jest ports of the r3 probe tests (7 new tests) |
| `a46b9617` | test: the early block check refuses before any vault read (an assertion in an existing test, kills L3) |
| `ee113341` | lifecycle: G-S97 with 9 trials, after G-S96, header says 60 scenarios (r2 `ea849f11` + trial 9) |

Superproject `7199f0e6` is unchanged. I did not re-check whether `## Unreleased` moved on main (the owner's message says to touch it only if it did, and the CHANGELOG is not part of any gate).

## 2. MEDIUM-1

`src/authoring/compendiumInsert.ts`: `insertFullBlock(editor, entity, isOpen = () => true)` runs `if (!refuseClosedEditor(isOpen)) return false;` after `entity.model()` / `entity.body()` and right before `editor.replaceSelection`; `dispatchBlockChoice` calls `insertFullBlock(editor, entity, isOpen)` after the early check. The reviewer's `r3-prescribed-fix.diff` was applied verbatim (plus a doc-comment sentence).

Tests added in `test/dom/authoring/compendiumSearchHoverPreview.test.ts` (now 32 tests):
- the preview closes inside `index.getEntity` (the reviewer's probe 1): nothing written, one Notice;
- the preview closes inside `entity.model()` (probe 2): nothing written, one Notice;
- `insertFullBlock(..., () => false)` alone: returns false, nothing written, one Notice; with an open editor it writes and adds no second Notice;
- the existing "block command: the same, for the snapshot choice" test now also asserts `getEntity` was not called (the early check refuses before any vault read).

Lifecycle trial 9 (`block preview hidden while the snapshot resolves`): the block command, a real press in the input, a one-shot page-side wrapper on `app.plugins.plugins['draw-steel-elements'].compendiumIndex.getEntity` (the reviewer's harness idea; deleted in the trial's `finally`) hides `previewMode?.hoverPopover ?? hoverPopover` and calls through; then a real press on a suggestion. Asserts: the hook fired once and hid the preview, exactly one "closed" Notice, nothing written in the hovered note or the host.

## 3. LOW-1 (tests ported, no bracketed ids in titles)

- R2: "a live preview editor and a different live active editor: the pick lands in the captured editor only".
- R4a: "the container is still there but the CodeMirror element is gone: refused (every element found must be connected)".
- R4c: "a closed pane editor (no preview involved) is refused too: a Notice, nothing written".
- R5: "the guard binds to the modal's own document: a press in the search inside a popout window keeps the popout's preview" (a jsdom iframe as the popout; `document.body.appendChild` of the `.modal-container` redirected into it, since `Modal.open` appends to `activeWindow.document.body` before `onOpen`). The stand-in `previewStandIn` takes a `doc` argument now. The helper is shared, so this also guards `DseModal`'s document binding (a gap since SC-595).

Not ported: the reviewer's leak test (30 cycles, no listener left) was not asked for (the r2 "guard gone one task after close" test and the R8 mutant already cover it in r3's runs). Out of scope and untouched: SC-611 (`test/mocks/obsidian-core.ts` choose/close order).

## 4. Mutants (runner `sc601-r4-mutate.py.txt`; each run over the new file + `compendiumSearchModal.test.ts` + `managedModal.test.ts`, 202 tests; run on `c6077860` + branch)

| # | Mutant | Failed / 202 |
|---|---|---|
| M1 | no guard installed | KILLED 12 |
| M2 | `preventDefault` instead of `stopPropagation` | KILLED 16 |
| M3 | guard removed synchronously at close | KILLED 5 |
| M4 | connected check dropped | KILLED 7 |
| M5 | re-target `activeEditor`, checks dropped | KILLED 7 |
| M6 | commands do not pass the anchor | KILLED 12 |
| M7 | guard installed unconditionally | KILLED 4 |
| M8 | guard stops every click | KILLED 19 |
| M9 | Ctrl copy gated by the connected check | KILLED 1 |
| M10 | block early check dropped | KILLED 1 |
| M11 | reference check dropped | KILLED 5 |
| M12 | connection test ignores `editor.cm.dom` | KILLED 4 |
| M13 | refusal without the Notice | KILLED 10 |
| M14 | `DseModal` no longer calls the helper | KILLED 6 (all SC-595 tests) |
| R2 | write target re-taken from `activeEditor`, checks kept | KILLED 1 |
| R4a | `some()` instead of `every()` | KILLED 1 |
| R4c | connected check only for a preview editor | KILLED 1 |
| R5 | guard bound to the global `document` | KILLED 1 (the popout test) |
| L1 | late re-check dropped | KILLED 3 |
| L2 | `isOpen` not passed to `insertFullBlock` | KILLED 2 |
| L3 | early check dropped (only the late one) | KILLED 1 |
| L4 | late re-check without the Notice | KILLED 3 |
| L5 | late re-check refuses but still writes | KILLED 3 |

The runner restored every source file (`git status` clean after the run). The earlier run on `7866426e` gave the same 23 kills (`mutants4-summary-on-7866426e.txt` in scratch); the table above is the `c6077860` run.

## 5. Gate numbers (all on `c6077860` + `ee113341`)

- tsc rc 0, lint rc 0 (`tsc-r4b.log`, `lint-r4b.log`).
- jest full: `Tests: 1 skipped, 10659 passed, 10660 total`, `Test Suites: 1 skipped, 266 passed`, 60 s. Count check: 10624 (base) + 25 + 2 (r2) + 7 (r4) = 10658, +1 for the cached-css un-skip = 10659.
- lifecycle (union 60/60, each `0 failed`): part 1 `G-S7a … G-S9a` 21 / 186 s; part 2 16 / 324 s; part 3 9 / 403 s; part 4 4 / 299 s; part 5 7 / 392 s; part 6 `G-S92 G-S96 G-S97` 3 / 230 s. Times include build and start-up; one other effort's lifecycle ran at times.
- e2e: `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, 167 s.
- shots 592 PNGs, `button host-leak OK (163 … 978)`, `modal button host-leak OK (… 39 button kinds … 234)`, `capture clip OK (147 …)`; freeze `280/280`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- Void: everything run before the `c6077860` rebase (all of the above on `7866426e`, and r2's on `5f7c5336`) was discarded; only the `c6077860` runs are reported. The kept FAIL temp dirs of the two red-base runs (`/tmp/dse-obsidian-lifecycle-Thf6aW`, `/tmp/dse-obsidian-lifecycle-ynged9`) were deleted by literal path.

## 6. Evidence (absolute paths)

`S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r2-adc7b64beb5b40fd5`:
- `S/tsc-r4b.log`, `S/lint-r4b.log`, `S/jest-r4bfull.log`, `S/jest-r4t1.log`
- mutants: `S/mutate4-run.log`, `S/mutants4-summary.txt`, `S/mut4-*.log`, runner `S/mutate4.py`
- trial 9: red on the r2 source `S/lc-r4b-base.log` (bundle `S/base-10f8aaf0/`), green `S/lc-r4b-p6.log`; earlier on `7866426e`: `S/lc-r4-base.log`, `S/lc-r4-branch.log`
- lifecycle parts `S/lc-r4b-p1.log` .. `S/lc-r4b-p6.log`; e2e `S/r4be2e.log`; shots `S/r4bshots.log`; freeze `S/r4bfreeze.log`; parity `S/r4bparity.log`
- the net lifecycle diff re-applied for the rebase: `S/gs97-net-lifecycle.diff`

sdd dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/`: this report, `sc601-skill-proposal.md` (updated), `sc601-r4-mutants-summary.txt`, `sc601-r4-mutate.py.txt`.

## Drive-by fixes:

None.

## Follow-ups:

- None new. The block command's late re-check has no await between it and `replaceSelection`, so the choose-time residual from r2 is closed.
- INFO for the owner: the branch no longer carries the r1 probe commit (the rebase conflict ran through it); if the probe must stay in history, it can be re-applied from `sc601-r1-probe-0da7e1d3.diff`, which would conflict with G-S97's helper block.
