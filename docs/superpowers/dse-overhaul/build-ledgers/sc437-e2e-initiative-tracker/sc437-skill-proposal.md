# SC-437 — dse-verify SKILL.md proposal (for the dispatcher at landing)

Owners do not edit SKILL.md. Apply at landing, after any SC-436 re-count:

- CURRENT e2e line → `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`
  (known-bug set: SC-572, SC-575, SC-576 ×2, SC-577, SC-578, SC-588). If SC-436 lands first,
  the rebased branch's re-counted line replaces this.
- CURRENT jest → 6765 passed / 1 skipped (259 of 260 suites; on a worktree with the shots CSS
  cache).
- Lifecycle, shots, freeze, parity: unchanged (52/52 · 592 / host-leak 163/978 / clip 147 ·
  280/280 · 0/0/24).
