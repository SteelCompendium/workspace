# SC-598 r4 brief — fix round (orchestration:implementer, I1 resumed)

Same worktree, same rules and footguns as your r2 brief (`sc598-brief-r2-impl.md` §4 — all still apply: devbox `-c`, `git -C`, private scratch `.../scratchpad/sc598-r4-I1/`, no glob/variable `rm`, never `rm -rf` a `/tmp` glob, no pattern kills, foreground gates, no tracker). Workers never call the tracker. Replacement-ready: a fresh worker reads the ledger (`decisions.md`, rulings O1–O13), `sc598-r2-impl-report.md` and `sc598-r3-review-report.md` (MEDIUM-1, LOW-1, INFO-6, INFO-7).

## Task — O13 (verbatim from the ledger)

"fold into r4 (resume I1): **MEDIUM-1** — R14 exactly as prescribed (`if (!anchor || !pop) return; if (pop.classList.contains('is-editing')) { opening.preventDefault(); return; }`), rewrite the `.is-editing` jest test to assert one click and `defaultPrevented === true` read synchronously (INFO-6), add the G-S91 trial `reopen rv` (open, Escape, open again, title press within 150 ms → no `.cm-editor` visible, focus not in the preview, Escape closes only the window); part 5 must stay ≤ ~420 s. **LOW-1** — rebase the superproject branch onto current workspace `origin/main`, keep both bullets. **INFO-6** — the clause in the proposal's jest paragraph (the stand-in's timer, like Obsidian, `preventDefault()`s the click: read `defaultPrevented` synchronously). **INFO-7** — proposal updated for R14 (no "still switches" sentence needed once fixed). CHANGELOG `## Unreleased` wording (supersedes O11; owner): "A second click inside a window opened from a hover preview, right after the click that opened it, no longer closes the window and the preview. Opening the window again from the same preview and clicking inside it at once no longer switches the preview to the note's source text. A quick double-click on the stamina bar's numbers in a preview still closes the window, as it does in a note, but the preview now stays open.""

Notes:
- Update `focusHoverPreviewNow`'s doc comment for the `.is-editing` branch (why: the helper's 150 ms timer for a re-open's click on text re-ran the focus step and its editor test after a second press moved the focus, switching the preview to source).
- The `reopen rv` trial must be **red on `e0e49d4d`** (r3 measured base red for this gesture) and green on head; record both.
- Add mutants for the new branch (drop the `.is-editing` preventDefault; send the synthetic click for `.is-editing` too) and record kill status in `sc598-r4-mutants.log`.
- CHANGELOG: replace the bullet body with the O13 text, in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click/CHANGELOG.md` (never under `/home/scott/code/steelCompendium/workspace/`). Rebase the superproject branch onto workspace `origin/main` (`e9ff3635` at dispatch; `git -C <wt> fetch origin`), resolving the `## Unreleased` conflict by keeping SC-588's bullet and yours. Do not bump the dse pointer.
- dse: `git -C <wt>/draw-steel-elements fetch origin`; `origin/develop` was `e0e49d4d` at dispatch. If it moved, rebase and report the range-diff.
- Out of scope: SC-601, SC-594, SC-596, SC-604, SC-606, and everything ruled dropped in O12/O13.

## Gates (expected, dse develop `e0e49d4d`)

tsc + lint 0; jest 7317 + your new/changed tests, 2 skipped; lifecycle **all five parts** (`G-S7a … G-S9a` 21, `G-S9b … G-S40` 16, `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9, `G-S57 G-S62 G-S61 G-S56` 4, `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` 7) = 57/57, part 5 ≤ ~420 s (STOP with a split proposal if over); e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (RECOV-R07 is a real signal); styles.css sha `5e5ff488…` (= e0e49d4d build) so shots/freeze/parity carry.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/sc598-r4-fix-report.md`, opening with a ≤10-line executive summary (dse head + base, superproject head + base, every gate number, part-5 wall time, reopen trial red/green, mutants). Evidence prefixed `sc598-r4-`. Update `sc598-dse-verify-proposal.md` in place. If the report write is blocked, return it inline. If you need input, end with `STATUS: NEEDS_CONTEXT`.

## Return contract

Final text: raw facts only — shas, measured numbers, absolute paths of every evidence file.
