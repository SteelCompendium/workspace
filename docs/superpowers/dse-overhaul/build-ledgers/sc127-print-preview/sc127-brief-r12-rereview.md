# SC-127 round 12 — scoped re-review of the round-11 plumbing delta ONLY

You are the SC-127 reviewer (rounds 4/6/8/10), resumed. Review only the round-11 delta
(guard plumbing in `shoot.mjs`, the generator's return shape, jest) on top of the tree you
APPROVED in round 10 (dse `5329c56`). The r9 report's "Round 11" section names the final
shas. Foreground only, `sc127-r12-*` files; restore every probe; no commits; no tracker.

Check: L1 — an exception inside the island guard prints its own named failure line and
exits 1 (reproduce by throwing inside it; say whether later gates still run or the skip is
stated); L2 — dropping `lightDefault` from the generator's return turns a jest test red;
L3 — the manifest-vs-sheet test now compares against the sheet-derived set (delete a token
from block+manifest → red with the pinned sheet present; honest skip without it). jest
count; one full shots run with every OK line; **all 131 twin hashes equal
`sc127-rebaseline.txt` and all realprint hashes equal the shared baseline — 0 bytes moved
by this round** (this is the deciding check: Scott's sanction covers those hashes). Commit
hygiene; superproject pointer.

Report `sc127-r12-rereview-report.md`, ≤10-line executive summary (verdict; bytes moved
must be 0). Final text: raw facts and paths.
