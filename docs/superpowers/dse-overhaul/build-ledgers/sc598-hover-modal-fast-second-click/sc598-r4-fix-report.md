# SC-598 r4 fix report (identity I1)

## Executive summary
- STATUS DONE. dse head `eafbcce579ef4fccbb5b8e1cae487f6cc9ff052c` on `origin/develop` `e0e49d4d` (unchanged since dispatch). Three earlier commits unchanged (range-diff `=`), two new: `a6425a41` (MEDIUM-1 fix, jest), `eafbcce5` (G-S91 `reopen rv`). Superproject head `7cb0fdafda341145f3d399892483ab2875c77e91`, rebased onto workspace `origin/main` `e9ff3635` (conflict in `CHANGELOG.md` resolved: SC-598 above SC-588 above SC-597; the dse pointer is NOT bumped).
- Gates at head: tsc (incl. `-p e2e`) rc 0, lint rc 0 · jest **7317 passed / 2 skipped** (263 of 264 suites, 53 s; same count as r2, one test rewritten) · lifecycle **57/57** = 21 + 16 + 9 + 4 + 7, wall 183 / 330 / 417 / 298 / **393 s** (part 5 under the ~420 s ceiling) · e2e **`270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (130 s, RECOV-R07 passed).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = the `e0e49d4d` archive build: shots, freeze, parity carry (not re-run).
- G-S91 now has 6 trials (`reopen rv` added): all 6 **red on the `e0e49d4d` bundle**; `reopen rv` **red on the r2 head `47950f45` as the only red** (editor switch + focus in the preview), **green on the r4 head** (part 5 and a scratch run; gap 50 ms).
- Mutants: 22 run on the changed file (N1-N17 with variants, K6), **21 killed, 1 survivor N7 argued equivalent** since r4. The 3 new mutants for the `.is-editing` branch (no preventDefault, no branch, branch plus synthetic click) are each killed by the rewritten test.
- Fix = O13 MEDIUM-1 exactly as prescribed: `if (!anchor || !pop) return; if (pop.classList.contains('is-editing')) { opening.preventDefault(); return; }`. CHANGELOG body = O13 wording. Proposal updated in place (R14, INFO-6, INFO-7, six trials, numbers). No trailer on commits (global CLAUDE.md).

## Changes
`managedModal.ts` (dse `a6425a41`): the `.is-editing` branch now `opening.preventDefault()`s and returns (no synthetic click, no class); doc comment gained the paragraph explaining why (the helper's 150 ms timer for a re-open's click on text re-ran the focus step and its editor test after a second press moved the focus off the window, switching the preview to source with the keyboard focus in it behind the open window; r3 MEDIUM-1, the base did the same).

jest (`managedModal.test.ts`): the `.is-editing` test rewritten (INFO-6): `defaultPrevented === true` read synchronously right after the opening click; exactly one click reaches the preview and no `interactive-child`; then a focus move at 5 ms and 200 ms of timers: `state.editor` false, `app.keymap.scopes` equals `[modal.scope]` (the helper pushed nothing), not hidden, one modal. The `setup({ isEditing: true })` fixture also sets the stand-in's `isFocused`, as Obsidian does for a focused preview. Count unchanged (13 SC-598 tests).

Lifecycle (dse `eafbcce5`): `gs91Trial` target `reopen` (RV): real press on the "15", wait for the window, 450 ms (the preview is now focused), Escape (assert: window closed, preview shown), pointer back on the number, press it again, title press as soon as its point is known (gap 50 ms); assert preview and window open at +700 ms, no visible `.cm-editor`, `document.activeElement` not inside `.hover-popover` (new `focusInPreview` field of the state record), Escape closes only the window, pointer away 1.2 s keeps the preview, a real click outside closes it. Header and scenario comments updated (six trials). Part 5: 393 s.

CHANGELOG (superproject `7cb0fdaf` (amended once: my first commit had staged the dse pointer by `-am`; the pointer is back at `e0e49d4d`, not bumped), on top of the rebased SC-598 commit `37e5f245`): body is the O13 wording, in the worktree's superproject only.

## Evidence for MEDIUM-1 and the new trial
| Bundle | G-S91 result |
|---|---|
| `e0e49d4d` base (`sc598-r4-red-on-base-G-S91.log`, FAIL shot `sc598-r4-red-on-base-G-S91-FAIL.png`) | 6/6 trials red: five "preview gone", `reopen rv`: "turned into a source editor" and "keyboard focus moved into the preview" (`editor:true, focusInPreview:true`) |
| r2 head `47950f45` (`sc598-r4-red-on-r2head-G-S91.log`, shot `sc598-r4-red-on-r2head-G-S91-FAIL.png`) | only `reopen rv` red, same two messages; the other 5 trials green (gaps 74 / 93 / 99 / 100 / 34 ms) |
| r4 head (`sc598-r4-green-on-head-G-S91-scratch.log`, part 5 `sc598-r4-gate-lifecycle-part5.log`) | 6/6 ok; reopen outcome line: "second press 50 ms later on dse-modal__title-text ... opened a second time from the focused preview ... the modal stayed, the focus stayed out of the preview, Escape closed only the modal" |

## Mutants (`sc598-r4-mutants.log`, runner `sc598-r4-mutate.py.txt`)
| Id | Mutant | Result |
|---|---|---|
| N1, N2, N3a/b, N4a/b, N5 | base; no preventDefault (non-editing path); not bubbling / on the opener; no class / removal armed first; after `arm()` | killed (15 / 3 / 8, 15 / 4, 2 / 5 tests) |
| N6 | `.is-editing` branch returns without preventDefault (the r2 code, MEDIUM-1) | killed (1: the rewritten test; real Obsidian: `reopen rv`) |
| N6b | no `.is-editing` branch (full treatment for a focused preview) | killed (1) |
| N6c | `.is-editing` branch also sends the synthetic click | killed (1) |
| N7 | preventDefault above the preview guard | SURVIVED, equivalent: `keepHoverPreviewAlive` is never reached for an anchor outside a preview, and the `.is-editing` branch default-prevents anyway |
| N8-N16 | class never removed; coordinates copied; `[10]`; non-click branch; removal guard / delay / always-add; not cancelable | all killed |
| N17 | no `view` | killed (suite crash plus the `view` assertion) |
| K6 | re-pushes armed at once | killed (11) |
The 22 opener-file SC-597 mutants (K1s-K5m, G1-G6 x2) were not re-run: the opener files, SC-597 tests and the stand-in are unchanged in r4 (`sc598-r2-mutants.log` stands).

## Gate logs (ledger dir, prefix `sc598-r4-`)
`sc598-r4-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..5.log`, `-e2e.log`, `-styles-sha.log`; `sc598-r4-mutants.log`; `sc598-r4-dse-range-diff.log`, `sc598-r4-super-range-diff.log`; G-S91 logs and shots above; scratch `sc598-r4-mutate.py.txt`, `sc598-r4-patch-reopen.py.txt`.
Wall times: lifecycle 183 / 330 / 417 / 298 / 393 s; jest 53 s; e2e 130 s.

Drive-by fixes:
- none.

Follow-ups:
- none new. Part 3 is at 417 s (404 s at r2, same code), under the ~480 s line.
- Two kept FAIL temp dirs of my own red-on-base / red-on-r2-head runs deleted by literal path. Other efforts' `/tmp/dse-obsidian-lifecycle-*` dirs left alone.
