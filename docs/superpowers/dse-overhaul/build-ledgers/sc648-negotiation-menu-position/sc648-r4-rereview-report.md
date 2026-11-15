# SC-648 r4 — scoped re-review of the r3 delta

## Executive summary
- **Verdict: LAND-READY.** Findings: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 1.
- Plugin head **e1be1775**. It sits on dse `origin/develop` **3e88b3f5**, which is still the tip after a fresh fetch. The 3 commits on top are SC-648 only. `range-diff` against 09c879f2..544fd4e0 shows the r1 commits identical (`=`) and adds only e1be1775 (the r3 fixes).
- Superproject head **116ee03b** sits on `origin/main` **7cea83eb**, which contains dc16b57d. There are exactly 2 commits on top: f4c4a81a (CHANGELOG) and 116ee03b (`chore: bump draw-steel-elements to e1be1775 …`, gitlink = e1be1775). `diff origin/main --stat` shows only CHANGELOG.md and draw-steel-elements. No AI trailers. Both working trees are clean.
- LOW-1 fold is correct. Probed: with the button 30 px above the window bottom, the new helper accepts the clamped menu (button 1046–1070, menu 1033–1071); the old check would have rejected it (off by 25). A menu forced into the corner is still rejected ("opened away … sideways").
- INFO-2 fold is a comment change only (`view.ts:169`). The `showAtPosition` call is byte-identical.
- r3 gate logs verified: jest 13327 / 2 · lifecycle 64/64 (21+16+9+4+7+4+3, each start line has the right count, every rc 0) · e2e `596/611 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` · styles.css `18730938…f1f9` is the same as a clean 3e88b3f5 build. SC-629's CSS change is comment-only, so the build output is unchanged.
- Re-run on the rebased head, negotiation specs only: `61/67 ok, 0 failed, 6 known-bug`, rc 0. NEGO-R05/R06/R07/R08/L06 all ok.

## Delta checks
1. **LOW-1** (`e2e/driver/negotiation.ts:149-157`): the vertical check is now `Math.abs(m.top - b.bottom) <= tol || Math.abs(m.bottom - b.bottom) <= tol`, and the doc says Obsidian "moves it up so it ENDS at the button's bottom, covering the button". This matches Obsidian's `showAtPosition` and my measurements. Probe RFOUR-01 (near the bottom) passes. Probe RFOUR-02 (a corner menu, forced) still throws, so the helper is not weakened. Throwaway spec, scratch copy only.
2. **INFO-2** (`src/elements/negotiation/view.ts:169`): the comment now reads "without `overlap: true`, Obsidian moves the menu that far right of `x`". The code lines 170-177 are unchanged (`git show e1be1775` touches only the comment line in view.ts).
3. **Rebase**: `git log 3e88b3f5..HEAD` = ade2b0bf (fix), 4b2ce601 (tests), e1be1775 (r2 fixes). `range-diff`: 8f1efdf5 = ade2b0bf and 544fd4e0 = 4b2ce601, with no content change.
4. **Superproject**: CHANGELOG bullet under `## Unreleased`, second (after SC-629), wording unchanged from r2. The rebase conflict resolution also added a blank line between the SC-629 and SC-642 bullets, which `origin/main` lacked (INFO-1 below). The pointer bump is the only other commit and points at the plugin head.
5. **Gates**: I read r3's logs (`sc648-r3-impl/`); the summary lines and rc files match the claims above. The clean build method was `git archive` 3e88b3f5 plus `npm run build-no-check`, and the shas are equal. Current worktree styles.css: `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.

## Findings
- **INFO-1** — `CHANGELOG.md` (superproject f4c4a81a): the conflict resolution added a blank line between the SC-629 and SC-642 bullets. The resulting spacing matches every other bullet, so this is harmless and only noted because it is a line outside SC-648's own bullet. No action.

## Artifacts
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r4-review/`:
`r4-e2e-nego.log` (+ .rc), `r4-probe.log` (+ .rc), probe spec `probe-tree/e2e/specs/negotiation/zz-r4probe.e2e.ts` (scratch `git archive` of e1be1775; not a git worktree).
