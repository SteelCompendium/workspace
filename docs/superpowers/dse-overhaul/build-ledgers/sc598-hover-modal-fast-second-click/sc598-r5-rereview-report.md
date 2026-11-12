# SC-598 r5: scoped re-review of the r4 delta (R1)

## Executive summary
- **Verdict: LAND.** CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3. r3 MEDIUM-1 and LOW-1 are both closed.
- **Scope:** dse `47950f45..eafbcce5` (`a6425a41`, `eafbcce5`). The three r2 commits are unchanged (range-diff all `=`). Superproject `7cb0fdaf` (2 commits on `e9ff3635`).
- **Gates, measured on dse `eafbcce5`** (`origin/develop` is still `e0e49d4d`):
  - tsc rc 0, lint rc 0.
  - jest 7317 passed / 2 skipped (54 s).
  - lifecycle part 5: 7/7 ok in 400 s, within the ~420 s ceiling.
  - e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (129 s); RECOV-R07 ok.
  - styles.css sha256 `5e5ff488…` is the same on the head build and the `e0e49d4d` build.
- **G-S91 (6 trials):**
  - Red on my own `e0e49d4d` build, 6/6. `reopen rv` fails as `editor:true, focusInPreview:true`.
  - Green on the head: `reopen rv` second press 68 ms later.
  - Red on mutant E1 (the r2 code) with `reopen rv` as the only failing trial.
- **Mutants of the `.is-editing` branch:** jest kills 4/4 (E1-E4). G-S91 kills E1. E2 and E3 are green in G-S91, which is expected: they are the R8-type alternative that is also correct in real Obsidian (see INFO-2).
- **MEDIUM-1 gesture in real Obsidian 1.15.1:**
  - Head, 5/5 trials green: RV and LP, title press 1 ms and 100 ms after the re-open, plus "Log an action…" RV at 100 ms. No `.cm-editor`, focus not in the preview, Escape closes only the window, an outside click then closes the preview.
  - Base LP at 1 ms and 100 ms: red. The preview switches to source with focus inside it (r3 already showed base RV red).
- **Superproject:** a fast-forward of `origin/main` `e9ff3635` (rebase: "up to date"). `## Unreleased` reads SC-598, then SC-588, then SC-597. The SC-598 body is O13's text verbatim (checked by script). The dse pointer is still `e0e49d4d` (not bumped).

## Checks
1. **R14 as built matches O13.**
   - `managedModal.ts:288-292` reads `if (!anchor || !pop) return; if (pop.classList.contains('is-editing')) { opening.preventDefault(); return; }` (character-for-character the prescribed text).
   - The new doc-comment paragraph (`:274-278`) is accurate. It says the preview is already focused so T3 cannot hide it, there is no synthetic click, the opening click is default-prevented, and why: the 150 ms helper re-ran the focus step and the editor test after a second press moved the focus.
2. **Real Obsidian, the MEDIUM-1 gesture.** Logs: `sc598-r5-probe-head.log`, `sc598-r5-probe-base.log`.

   | Trial | Head `eafbcce5` (at +700 ms after the re-open) | Base `e0e49d4d` |
   |---|---|---|
   | stam RV, re-open, title +1 ms (in-page 39 ms) | window and preview open, `editor=n`, `focusInPreview=False`, no `setIsFocused` after the re-open (helper skipped), 0 synthetic clicks; Escape closes only the window; rest: shown; outside: closed | r3: `editor=Y`, focus `cm-content` |
   | stam RV, re-open, title +100 ms (in-page 166 ms) | same, green | r3: red |
   | stam LP, re-open, +1 ms (95 ms) | green (after Escape the host's `cm-content` is focused, not the preview's) | `editor=Y`, `focusInPreview=True` |
   | stam LP, re-open, +100 ms (141 ms) | green | `editor=Y`, `focusInPreview=True` |
   | "Log an action…" RV, re-open, +100 ms | green | r3 R14-bundle shape green |
   | first open, stam RV / LP, title at once | green | r3: red ("preview gone") |

   G-S91's original five trials are also green on the head in part 5 (gaps 126 / 75 / 133 / 98 / 75 ms).
3. **The new G-S91 `reopen rv` trial.** Red on my `e0e49d4d` build (`editor:true, focusInPreview:true`) and on E1 (= the r2 code, main.js sha identical to the r3 head build). Green on the head (gap 68 ms; E2 81 ms, E3 33 ms). What it asserts:
   - the press is on `"15" on dse-stamina__ccur`;
   - the first open leaves the window and the preview open, and its Escape closes only the window;
   - after the re-open: the gap gate (< 140 ms), no visible `.cm-editor`, focus not inside `.hover-popover`, the window open at +700 ms, Escape closes only the window, the preview stays with the pointer away, and an outside click closes it.

   Part 5 took 400 s; I1 measured 393 s.
4. **jest.** The rewritten `.is-editing` test reads `defaultPrevented === true` synchronously. It then asserts exactly one click and no class. After a focus move at 5 ms and 200 ms of timers it asserts: no editor, `keymap.scopes` equal to `[modal.scope]`, not hidden, one modal. The fixture marks the stand-in `isFocused` as Obsidian does. Mutants (`sc598-r5-mutants.log`), each killed by that test:
   - E1: the branch without `preventDefault`.
   - E2: no branch, so the full treatment.
   - E3: the branch also sends the synthetic click.
   - E4: the `.is-editing` check on the anchor, so it is always false.
5. **Gates:** see the summary. The count is unchanged at 7317, since one test was rewritten in place.
6. **Superproject:** `sc598-r5-super-rebase.log`. It is a fast-forward. The diff against `origin/main` is `CHANGELOG.md` only (+6 lines), and SC-588's bullet is kept.
7. **dse-verify proposal:** INFO-6's clause is present (the stand-in's timer default-prevents, so `defaultPrevented` must be read synchronously). R14 is reflected in the "focuses the preview itself" bullet. G-S91 is six trials. The numbers are r4's (393 s; mine 400 s). Ready to apply.

## INFO
1. **`reopen rv` does not assert the precondition in its name.** It never checks that the preview is `.is-editing` before the second open; the 450 ms wait implies it. The E1 run shows the precondition held: only `reopen` is red, and that path exists only for a focused preview. My probe recorded `is-editing=Y` after the first Escape in every trial. Optional hardening: `t.expect(rec.afterFirstClose` … `.is-editing`).
2. **E2 and E3 are not red in G-S91.** They give a focused preview the synthetic click again. That is the R8 shape, which r3 measured correct in real Obsidian. Only jest pins the chosen R14 shape. No action.
3. **Timing margin under load.** Part 5 took 400 s at loadavg 1-3, against the ~420 s ceiling. The title RV gap was 126 ms in this part-5 run, and E1's runs at load 9 gave 111-118 ms, close to the 140 ms vacuity gate. A loaded host may trip it; that would fail as "vacuous", not as a product red.

## Evidence (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/`)
- **Gates:** `sc598-r5-gate-summary.txt`, `sc598-r5-gate-tsc.log`, `sc598-r5-gate-lint.log`, `sc598-r5-gate-jest.log`, `sc598-r5-gate-lifecycle-part5.log`, `sc598-r5-gate-e2e.log`, `sc598-r5-build-styles-sha.log`.
- **G-S91:** `sc598-r5-gs91-base.log`, `sc598-r5-red-on-base-G-S91-FAIL.png`, `sc598-r5-gs91-E1.log`, `sc598-r5-red-on-E1-G-S91-FAIL.png`, `sc598-r5-gs91-E2.log`, `sc598-r5-gs91-E3.log`.
- **Mutants:** `sc598-r5-mutants.log`, `sc598-r5-mutant-bundles.log`.
- **Probes:** `sc598-r5-probe-head.log`, `sc598-r5-probe-base.log` (+`-raw.log`).
- **Git:** `sc598-r5-dse-range-diff.log`, `sc598-r5-super-rebase.log`.
- **Scripts:** `sc598-r5-*.txt`.
- **Worktree:** as found. The superproject shows ` M draw-steel-elements` (unbumped pointer) at `7cb0fdaf`, and dse is clean at `eafbcce5`. My two kept FAIL dirs were deleted by literal path.
