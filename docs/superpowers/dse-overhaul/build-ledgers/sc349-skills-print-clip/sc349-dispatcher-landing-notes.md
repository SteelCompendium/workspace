# SC-349 landing notes for the dispatcher (refreshed by the owner, 2026-11-06)

**LAND-READY. Scott's sanction is on the ticket**: SC-349 comment `f5db4077`, 2026-11-05 00:28Z, "sanctioned". It replies to
the ask `34b7ebbd`, whose options were "sanctioned" = all 40 lines or "skills only" = 8 lines. So all 40 lines are sanctioned.

- **Branch:** dse `sc349-skills-print-clip` @ `69b5c0d4`, 4 commits `970e3ec9`, `b3cd8dd3`, `cf1c207c`, `69b5c0d4`, rebased onto
  develop `7bd8040b` (the tip at 2026-11-06 11:3xZ). Clean, not pushed. The diff is 3 files: `visual-harness/shoot.mjs` (+145/-2),
  new `visual-harness/capture-viewport.mjs`, new `test/unit/build/captureViewport.test.ts`. The superproject worktree shows only the
  submodule pointer. No CHANGELOG entry: the change is harness-only.
- **Review chain:** independent Opus review r1 FIX-REQUIRED (fixed), scoped r2 APPROVE (`acbacbd`), rebase re-review r3 APPROVE
  (`25abfce2` on `248e202b`: diff identical to the approved one, all 28 develop in-run gate lines identical base vs head). r5 is a
  conflict-free rebase onto the CSS-only SC-520, with all 592 head PNG hashes equal to the reviewed `25abfce2` head, so no further review.
- **Gates at `69b5c0d4`:**
  - tsc and lint clean
  - jest 6483 / 1 skipped / 257 of 258 (+9 tests, +1 suite)
  - lifecycle 52/52 (five parts: 21, 16, 9, 4 with G-S56 last, and 2 `G-S59,G-S49`)
  - e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`
  - shots 592, 0 FAIL, button host-leak 161/966, plus the new line
    `capture clip OK (147 screen-media capture(s) … 41 print-media capture(s) … NOT covered — named exemption(s): gallery--steel-dark.png (…SC-484); gallery--steel-light.png (…))`
  - parity 0 GAPs / 0 undeclared / 24 DECLARED
- **Freeze:** base `7bd8040b` reads `freeze OK (280/280 …)`. Head reads `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`, which
  is exactly the 40. The moving set has been the same 40 names on every base, `0ce76dd` → `bc4a0c5` → `248e202b` → `7bd8040b`, and the
  hashes are unchanged throughout.
- **Apply:** `.superpowers/sdd/sc349-skills-print-clip/rebaseline-r5.txt` (40 lines; the same lines as `rebaseline.txt` once both are
  sorted). It is 40 in-place replacements, and the count stays 280. Take the backup `freeze-baseline.sha256.pre-sc349-bak` first.
  After applying, expect `freeze OK (280/280 …)`.
  Classification: a capture-artifact correction (the harness was pinning blank rows), applied as a sanctioned rebaseline.
- **dse-verify SKILL.md:**
  - Add a dated record quoting Scott's "sanctioned" (`f5db4077`).
  - Add the new CURRENT block (numbers above).
  - Mark the note near line ~367 (negotiation-ended/-narrow "cut by the 1200 px viewport") as fixed by SC-349.
  - Add the new in-run gate to "In-run gates inside `npm run shots`". It fails the run if any capture is taken with its element
    outside the viewport. The gallery is the one named exemption (SC-484).
- **Tell the other owners (SC-367 and SC-368 wait on this):** 40 print lines move, all `--steel-print.png` and no realprint:
  - Skills (8): skills, skills-narrow, skills-chips, skills-chips-narrow, skills-ledger, skills-ledger-narrow, skills-hero-picks,
    chrome-skills-menu
  - Statblock (17): statblock, statblock-charbox-on, statblock-charbox-onword, statblock-charline-two, statblock-collapsed,
    statblock-columns-wide, statblock-disttarget-ledger, statblock-disttarget-text, statblock-edit-btn, statblock-featstyle-flat,
    statblock-kwusage-grid, statblock-kwusage-ledger, statblock-kwusage-text, statblock-stats-gridc, statblock-stats-ledger,
    statblock-with-captain, chrome-hover-statblock
  - Montage (8): montage, montage-done, montage-failed, montage-guide-open, montage-mid, montage-narrow, montage-old-shape,
    montage-strip-pinned
  - Negotiation (2): negotiation-ended, negotiation-narrow
  - Other (5): ancestry, class, chrome-collapsed-rollout, chrome-collapsed-trio, chrome-placement-trio

  143 PNGs in all change bytes (every capture taller than 1200 CSS px, plus scroll-blanked tops). A branch that moves any of these
  must recompute its hashes on top of SC-349.
- **Filed during this effort:** SC-484 (the gallery shot shows only its first element) and SC-562 (no shot covers SC-490's pinned
  montage column). Both are Backlog.
- Preserve the ledger dir at landing.
