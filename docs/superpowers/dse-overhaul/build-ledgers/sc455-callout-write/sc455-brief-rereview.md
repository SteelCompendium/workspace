# SC-455 scoped re-review brief (fix round 1 + rebase onto 7817133)

You reviewed e4f60eb (report `sc455-review-report.md`). Review ONLY the delta, not a fresh full pass:
1. **Rebase onto dse 7817133 (SC-360)**: check every conflict resolution in the implementer's `sc455-fix1-report.md`. Check that SC-360's any-scalar anchor readers and `generateAnchorId` survive intact, that `FENCE_LINE` is gone, and that every fence-locating anchor reader goes through the prefix helper. Use `git range-diff d58cf6a..e4f60eb 7817133..<new head>` for the rebased commits, then a plain diff for the fix commits.
2. **Each folded finding**: HIGH-1 (re-run your probes P1/P2/P2b and the raw-mode form save; the sidebar self-echo with a `>` prefix plus nested YAML, which you did not probe last time), LOW-1 (P6), LOW-2 (exactly one Notice through the form editor), LOW-3, INFO-1, follow-up 6 (missing TFile Notice), and the workspace CHANGELOG bullet in the worktree superproject. Do the new tests fail on e4f60eb's src?
3. **Gates**: confirm the implementer's battery numbers, re-running at least jest, lifecycle and e2e yourself. Base at 7817133: jest 5013 / 1 / 229 of 230, lifecycle 26/26, e2e 71/76 0 failed 5 known-bug 51/51, shots 572 + pressed line, freeze 276/276, parity 0/0/24.

Do not commit. Use the same footguns as `sc455-brief-review.md` §4. Out of scope: SC-461, SC-462, SC-463, SC-464.
Report: `sc455-rereview-report.md` in the ledger dir. Start it with an executive summary of 10 lines or fewer: verdict LAND-READY or FIX-REQUIRED, head sha, finding counts by severity.
Return raw facts plus the absolute path of every artifact.
