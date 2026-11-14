# SC-438 — proposed dse-verify SKILL.md updates (for the dispatcher at landing)

Measured on dse `f6e504c7` (on develop `6785fa06`, SC-569 landed).

1. Battery row 4b "today" e2e line → `415/428 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs`
   (since SC-438: +83 e2e tests — 80 montage `[MONT-*]` + `[CENSUS-10..12]` — and +57 pairs; known
   bugs SC-257, SC-355, SC-384 plus SC-625 ×2, SC-626 ×4 (one in Live Preview), SC-627, SC-628 ×2,
   SC-629). Previous: `342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (SC-569).
2. CURRENT jest → 12125 passed / 1 skipped with the shots cache present (fresh worktree: one fewer
   passed, 2 skipped). SC-438 adds `test/dom/elements/montage-matrix.test.ts` + census tests; jsdom
   `test.failing` markers SC-625 ×2, SC-626, SC-631.
3. CURRENT lifecycle 64/64 (no lifecycle id used; G-S120 free), shots 592, host-leak 163/978, modal
   host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24 — unchanged (montage `src/` change
   is `data-dse-control` attributes only; shots/freeze/parity measured on the pre-rebase head
   `0bbc1948` and `d5acaabb`).
4. Optional e2e note: the montage strip / guide open state lives in the plugin session store keyed by
   the block, so it outlives a test; specs reset it with `closeDisclosures` (`e2e/driver/montage.ts`).
