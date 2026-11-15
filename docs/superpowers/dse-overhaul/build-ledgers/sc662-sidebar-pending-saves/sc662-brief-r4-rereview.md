# SC-662 r4 — scoped re-review of the r3 delta (reviewer R1, resumed)

Same rules and footguns as your r2 brief (`sc662-brief-r2-review.md`). Review only the delta `5245240c..944fda6a` (the branch was REBASED onto dse develop `bab0dbb2` (SC-652 landed); the r3 commits are 3348b265, 79f50ff4, 8b30ba41, 2920e67d, 944fda6a; the r1 commits were rebased to 641825d8..8a084fdb) on branch `sc662-sidebar-pending-saves` (if I1 rebased, use `git range-diff` to confirm the r1 commits are unchanged). The fix brief I1 worked from is `sc662-brief-r3-fix.md`; I1's report is `sc662-r3-fix-report.md` (both in the ledger dir). Owner rulings: `decisions.md` "Owner rulings on r2".

Check, executing and probing in real Obsidian:

1. MED-1: re-run RV-F01..F04 on head (the sidebar form Save is refused with the Notice when its block changed, lands when the edit was elsewhere; Reading view unchanged). Does the strict write ever refuse a legitimate form Save (the form opened just after an own write; the block moved by an edit above it)?
2. MED-2: re-run RV-U01..U04 (stamina bar) and the hero twin. The undo refusal must not fire on a plain own-write path (Undo with no outside edit; Undo after an outside edit elsewhere).
3. LOW-1: RV-C01/C03 — focus on the add-condition control in the sidebar and hero; the coverage gate's new Y.
4. LOW-2/3/4, INFO-1: RJ08, RJ03/RJ04 and N5 now killed by branch tests; your N1/N12 mutants red.
5. OOS-1: RV-O02B/O02C — the panel stays live after Done and `_dse_anchor` survives; probe Reading view conditions too (no regression), and two pinned conditions blocks in one note.
6. The rebase conflict in `SidebarPanel.ts` `handleExternalChange` fast path: I1 kept SC-652's `withReservedKeys` serializer rebuild but applies it AFTER the view's own pending save settles. Check that a sidebar write still keeps `prefs:` / `collapsed:` wrapper keys (SC-652's behaviour) in: an own write with no outside edit; an own write pending when an outside edit changes the wrapper keys; an outside edit that only changes a wrapper key (is it skipped as unchanged? if so, is the next own write's wrapper the new one?).
7. OOS-1 widened: resource, surges and tokens also got the `_dse_anchor` passthrough (sweep test `persistedAnchorPassthrough.test.ts`). Spot-check one of them pinned in real Obsidian.
8. Full battery at head against the bab0dbb2 numbers (jest 13607/1 with shots cache + branch tests; lifecycle 63/64 with G-S61 the only red, SC-668; e2e `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` + branch tests/pairs; shots 592, 163/978, 40/240, clip 147; freeze 280/280; parity 0/0/24). Also check the rebase conflict resolutions in montage/initiative view.ts (SC-652 touched both) keep both behaviours.

Append your findings to `sc662-r2-review-report.md` under a new heading `## r4 re-review` that opens with a ≤10-line summary (verdict LAND / FIX, severity counts, battery). Final text to me: raw facts plus absolute paths of every artifact.
