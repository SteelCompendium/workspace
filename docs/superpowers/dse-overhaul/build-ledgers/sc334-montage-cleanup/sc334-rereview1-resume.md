# SC-334 re-review 1 — scoped (resume message for the review-1 reviewer)

SC-334: scoped re-review of the review-1 fold. Delta only: dse `e6c551c..49309c6`
(`4a3399f` fix, `49309c6` docs), plus the workspace `CHANGELOG.md` bullet in the worktree
superproject (uncommitted there by design until the pointer-bump commit).

Owner rulings on your findings are in `sc334-decisions.md` (Round log → "Review 1 DONE").
Folded: MED-1, MED-2, LOW-1, LOW-2 (R-5 amended: plain `--dse-danger`, no sheen), LOW-3
(camera focus-ring check + jest contract on `.dse-modal__body`), INFO-2, INFO-3, INFO-4,
INFO-7. Dropped with reasons: INFO-1, INFO-5.

Verify each folded finding is actually fixed (execute/probe, not read): your MED-1 probe
sequence, the post-Back actions-left probe, the camera's new ring check (can-fail it by
removing the body padding — it must fail on modal-montage-limits and name the cut side),
light/dark track crops, and the regenerated docs/Media images. Check the delta for new
defects. Gate numbers for this head: `sc334-battery-r2.md` (written when the owner's run
finishes; re-run anything you need).

Report: `sc334-rereview1-report.md` in the same ledger dir, ≤10-line executive summary
first. Same return contract and footguns as your original brief.

One extra probe, REPORT ONLY (not a fix request): the camera's new ring check skipped
modal-montage-edit with "focused field draws no outline" — the sheet auto-focuses the
Success `.dse-optchip` (a bare `<button>`, also used by ConditionsModal), which is not in
the shared kit focus-ring rule (styles-source.css ~:14041). In REAL Obsidian, does a
keyboard-focused `.dse-optchip` show ANY visible focus indicator (host box-shadow or
otherwise)? Measure it (computed outline/box-shadow at :focus-visible) and say whether it
predates SC-334 (check `d124cc3`). The owner decides whether it earns a Backlog ticket.
