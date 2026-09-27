# SC-338 round 2 — scoped re-review (delta dse 7177033..c19069a, superproject 74a71c7..00ada4b)

**Verdict: APPROVE.** The net dse delta since r1 is comments only; the swatch revert is complete.
- **No swatch code remains.** No `.dse-swatch` selector, list membership or test assertion survives in `6c4f6aa..c19069a`. The only mention is one comment line at `styles-source.css:14033`. `git diff 7177033 c19069a -- test/` is empty (0 bytes), so the guard tests are byte-identical to r1.
- **Rendering is byte-identical to r1.** I rebuilt at `c19069a` and re-ran my r1 real-Obsidian probes (focus on both modals, rest state, swatches, dark and light). All 20 crops and both probe logs match the r1 runs byte for byte. So the chip pixels in `evidence-r1/sc338-chip-focus-grid.png` still hold, and the swatches behave exactly as on base: a focused unpressed swatch shows only Obsidian's grey `0 0 0 3px` halo.
- **`evidence-r2/sc338-grid-rest.png` is a real base capture.** It was built against base `6c4f6aa` CSS, not simulated. Its before-state box-shadows match my r1 CSSOM simulation (dark 4-layer `--input-shadow`, light `inset 0 0 0 1px rgba(0,0,0,.12)`), and the labels are in text.
- **Gates on `c19069a`:** tsc/lint clean · jest **3997 / 1 skipped / 206 of 207**, exit 0 · shots 524, 0 FAIL, host-leak **114/684** · freeze **260/260** · parity **0/0/16** · camera `modal-montage-edit` ring-checked ok and `modal-montage-limits` ok.
- **Nits only:** LOW-1, a dse-verify SKILL.md swatch saga that was kept despite R-r3; INFO-1, stale `~:` line pointers in the new comments; INFO-2, the light-mode comment omits the drop layer.
- **Tree state:** both worktrees end as they started. `git status` shows only the pre-existing uncommitted ` M draw-steel-elements` pointer, and the superproject is still at `00ada4b`.

---

## Findings

### LOW-1 — dse-verify SKILL.md still has the swatch fold/revert story, against R-r3 and the r3 commit title
- **Where:** `workspace/.claude/skills/dse-verify/SKILL.md:216-223` ("Battery at SC-338 round 2 … folded `.dse-swatch` … REVERTED in round 3 …") and `:225-233` ("Battery at SC-338 round 3 (dse `a756ec1`) … the `.dse-swatch` CSS (both hunks) and both guard-test assertions pulled back out …").
- **Problem:** ruling R-r3 says to revert "the dse-verify mention", and the superproject commit `00ada4b` is titled "dse-verify swatch mention removed". What actually happened is that the mention was rewritten into a revert story. The content is accurate, but it is per-round process history in a command-reference skill. It also names `a756ec1`, not the final head `c19069a`.
- **Fix:** replace the round 1/2/3 blocks (`:207-233`) with one "Battery at SC-338 (dse `c19069a`, base `6c4f6aa`)" entry carrying the numbers below. The swatch history already lives in the ledger and SC-361.

### INFO-1 — Stale `~:` line pointers in the SC-338 comments
- `styles-source.css:14032` says "(~:15335)"; the section-B list is at `:15356-15366`.
- `styles-source.css:15353` says "(~:14022)"; the ring rule's `.dse-optchip:focus-visible` is at `:14035`.
- (`~:2107` for the pressed bevel is exact.) The sheet uses approximate pointers everywhere, so this only matters if you re-touch the comments.

### INFO-2 — The new section-B comment describes the light-mode rest plate incompletely
- `styles-source.css:15357-15358` says "light: a 12%-black inset ring, i.e. a second border".
- The measured light `--input-shadow` also carries `0 1px 2px rgba(0,0,0,.065)`, a faint drop. Optional wording: "a 12%-black inset ring plus a faint drop".

## Brief checklist
- **Swatch residue:** checked. `git diff -U0 6c4f6aa HEAD -- styles-source.css` has exactly two non-comment changes, the r1 ring selector and the section-B `.dse-optchip` entry. The swatch rules at `:2125-2160` are untouched, and there is no swatch mention in the CHANGELOG diff.
- **(1) Swatches equal base:** `r2-probe-rest/probe.log` matches the r1 run exactly. Focused unpressed swatch: `outline: none`, `box-shadow: rgb(85,85,85) 0 0 0 3px` (dark) / `rgb(189,189,189)` (light).
- **(2) Evidence:** the r2 rest grid is real (probe-before logs are from a `6c4f6aa` stylesheet build) and labeled in text. The r1 focus grid is still valid, because head pixels are byte-identical to r1.
- **(3) Comments:** the two added comment blocks describe the current code (why the swatch is excluded, and that `box-shadow: none` applies at rest and on hover). There is no process narration beyond the SC-361 pointer. Nits: INFO-1, INFO-2.
- **(4) Docs:**
  - CHANGELOG `:11-19`: accurate, chips only, and it now carries the rest/hover drop-shadow clause.
  - SKILL.md numbers match what I measured (114/684; the 46.0/62.8px correction; 50px → `top 6.0px`; limits `top 4.0px, right 4.0px`).
  - Only LOW-1 remains.

## Gates (dse `c19069a`, worktree `sc338-chip-focus`)

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | `Tests: 1 skipped, 3997 passed, 3998 total` · `Test Suites: 1 skipped, 206 passed, 206 of 207 total` · 3 snapshots, exit 0 (first run; no SC-360 flake) |
| shots | exit 0, 524 browser PNGs, 0 FAIL; `host-copy pin OK (… verbatim Obsidian 1.14.2 …)`; `button host-leak OK (114 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 684 comparisons …)` |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| camera edit | `ok modal-montage-edit--obsidian-steel-dark.png … focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)` |
| camera limits | `ok modal-montage-limits--obsidian-steel-dark.png … focus ring inside the body (input.dse-mt__sheet-input)` |

Lifecycle was not re-run: the delta is comment/doc only and it was not in the brief's gate list. It was 6/6 at r1 and r3.

## Housekeeping
- Private Xvfb `:187` and CDP ports 9287/9288. Every process was killed by the PID I started, and none are left.
- My probes changed the tracked `demo-vault/.obsidian/appearance.json`; I restored it with `git checkout`. I regenerated the ignored Harness notes with `notes-gen.mjs`, and rebuilt `main.js`/`styles.css` from the clean head.

## Evidence
Under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/`:
- `r2-probe-branch/` and `r2-probe-rest/`: head crops and logs, byte-identical to the r1 `probe-branch/` and `probe-rest/`.
- `logs/r2-*.log`: every gate and camera log above.
