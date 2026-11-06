# SC-349 independent review, round 2 (scoped: `d34b0fe..acbacbd`)

## Executive summary
- Verdict: **APPROVE**. Head `acbacbd`; `origin/develop` is still `0ce76dd`. Findings: HIGH 0, MED 0, LOW 1, INFO 2.
- Shots at `acbacbd`: rc 0, 572 PNGs, 0 FAIL. All 572 hashes equal my `d34b0fe` run. Freeze shows exactly the 40 `rebaseline.txt` lines, so `rebaseline.txt` stands.
- The gate's OK line names `gallery--steel-dark.png` and `gallery--steel-light.png` under "NOT covered — named exemption(s): … (SC-484)" and no longer claims the gallery is whole.
- MED-1 is closed. Each of the three mutations below, made in scratch clones, exits 1 and names the right captures:
  - growth broken: bottom-edge problems on the tall skills captures, plus the top-edge problem on `chrome-hover-statblock`;
  - HIGH-1 shape on element shots (growth measured from the wrapper, not `#mount`): caught;
  - HIGH-1 shape on the gallery (exemption removed): caught by both the rect check and the hidden-overflow check, with 0 false positives on the other 144 dark captures, including the fullPage modal shot.
- The exemption cannot swallow other captures. It matches the exact query key `gallery`, only the gallery loop sets that key, and the OK line prints every exempted file (exactly 2 in a full run).
- jest: 5417 passed / 1 skipped, 232 of 233 suites.
- LOW-1: the implementer's bite proof left a clipped `skills-hero-picks--steel-dark.png` in the branch worktree's `shots/`. My shots run overwrote it with the correct bytes. No frozen line was affected.

## 1. Shots at `acbacbd`
- `npm run shots` in the branch worktree: rc 0, 572 PNGs, 0 FAIL. `montage board scroll OK` is present.
- The 572 sha256 match my r1 `d34b0fe` run with an empty diff (`rv-shots-rv2-head1.sha256` vs `rv-shots-head1.sha256`).
- Gate line, as printed: `capture clip OK (139 screen-media capture(s) whose element reached below the viewport were shot with it grown to cover them and then restored; 41 print-media capture(s) were grown the same way as a precaution — … NOT covered — named exemption(s): gallery--steel-dark.png (… shows only its first element (SC-484)); gallery--steel-light.png (…))`.
- Freeze: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`. The failing names equal `rebaseline.txt` (empty diff).

## 2. MED-1 really closed (mutations in scratch clones of `acbacbd`, never the branch)
- **Growth broken (mutation A, `grownTo = null`):**
  - `--element=skills`: rc 1, `CAPTURE CLIPPED — 20 problem(s)`. Every tall skills capture is named, e.g. `skills-hero-picks--steel-dark: its element reaches 2028px but the viewport is 1200px tall`.
  - `--element=chrome-hover-statblock`: rc 1. All four combos show both `reaches 3966px…` and `starts 64px above the top of the viewport (the page was scrolled)`, so the new top-edge check bites.
- **Wrong measurement on element shots (mutation B, HIGH-1 shape):** `measureCaptureBottoms` measures `#mount.parentElement` (the wrapper, bottom 1200) instead of `#mount`, so tall captures never grow.
  - `--element=skills --bg=dark`: rc 1, 3 problems. These are exactly the three dark skills captures taller than the viewport (`skills-hero-picks`, `skills-narrow`, `skills-ledger-narrow`); the rest fit.
  - With print combos included (both the full sweep and `--element=skills`), the earlier `assertPrintTwinDelta` exits first (32 px twin/realprint drift), so the run still fails but the clip gate's own output is not reached. See INFO-1.
- **Wrong measurement on fullPage shots (mutation C, exemption removed only; the measurement code is the real one):** full sweep with `--bg=dark`, rc 1, `CAPTURE CLIPPED — 2 problem(s)`, both for the gallery:
  - `gallery--steel-dark: its element reaches 25000px but the viewport is 1200px tall`;
  - `gallery--steel-dark: a full-page shot cannot see past a scroller hiding overflow: div.markdown-preview-view (overflow-y auto) hides 23864px`.
  - The other 144 dark captures pass, including the fullPage modal `montage-sheet-log--steel-dark`, so the hidden-overflow check raises no false positive.
- The check is independent. `measureShotVisibility` (`shoot.mjs:513`) reads `#mount`'s raw viewport rect and its ancestors' overflow after the screenshot. It shares nothing with `measureCaptureBottoms`, which now only decides the growth.

## 3. Can the exemption swallow a non-gallery capture?
No.
- `shoot.mjs:657` uses `Object.keys(CLIP_EXEMPTIONS).find((f) => query[f])`. That is an exact own-key lookup on the snap query, not a prefix or id match.
- `query` is `{...params, theme, bg, print?, sheet?, readonly?}`. Of the seven `snap(` call sites (`shoot.mjs:6259–6363`), only the gallery loop passes `gallery`. Element, narrow, interaction, pref, scroll and chrome params never carry it, and the other `gallery: '1'` navigations in `shoot.mjs` (host-leak sweeps) are not snaps.
- A capture id such as `gallery-foo` is not exempt unless its query sets `gallery`.
- Any future capture that sets the flag would show up by name in the OK line, so it could not be exempted silently. A full run prints exactly two exempt files.
- Residual note, not a defect: an exempt capture also skips the layout-fingerprint check and is left out of the grown count. That is harmless today because the gallery never grows.

## 4. jest
- `rm -f main.js styles.css` first, then `npx jest`: `Test Suites: 1 skipped, 232 passed, 232 of 233 total`, `Tests: 1 skipped, 5417 passed, 5418 total`.
- `captureViewport.test.ts` has 9 tests covering inside, bottom below, top above, hidden overflow on a fullPage shot (ignored for an element shot), and a layout change.

## Findings

### LOW-1: the bite proof left a clipped PNG in the branch worktree's `shots/`
- **What happened:** the implementer's bite proof (`shoot-r2bite.mjs`, run inside the branch worktree after proofB) wrote the clipped base bytes of `skills-hero-picks--steel-dark.png` (`1ae60de0…`, equal to the `0ce76dd` base) into `draw-steel-elements/visual-harness/shots/` at 09:52:51. The correct head bytes are `e006da88…`.
- **Impact:** that file is unfrozen, so freeze was unaffected. But anyone eyeballing or diffing the worktree's `shots/` before my run would have seen a clipped capture.
- **Now:** my shots run rewrote it, and the directory now matches `rv-shots-rv2-head1.sha256`.
- **Prescribed:** no code change. Run future bite or mutation probes in a scratch clone, or re-run shots afterwards.

### INFO
1. **Gate order.** `assertNoClippedCapture()` runs last, after gates that `process.exit(1)`, such as `assertPrintTwinDelta`. In a full sweep a clip that also changes print-twin geometry is reported by the print-twin gate, not the clip gate. The run still fails, so nothing goes green wrongly; only the diagnosis is indirect. The implementer hit the same effect. No action needed.
2. **Failure message on realprint.** It now says "under the screen-media cascade everything below the viewport paints blank". For a realprint capture that clause describes a condition that does not apply, but it shows only on the failure path. Cosmetic; no action needed.

## Hygiene
- `git status --porcelain` is the same as at r1: the superproject worktree shows ` M draw-steel-elements`, and the plugin is clean at `acbacbd`.
- `main.js`, `styles.css` and `main.css` were restored byte-for-byte after jest.
- The shared freeze baseline is unchanged (`f0dc00e4…`), and `check-freeze.sh` was not touched.
- The mutation clones are scratch only. Nothing was committed and nothing was written to the shared main checkout.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-review-r1/`)
- `rv-shots-rv2-head1.{log,rc,sha256,count}`, `rv2-worktree-shots-pre.sha256` (shows the stale bite-proof file), `rv2-freeze.{log,rc}`.
- `rv2-mutate.py`, `rv2-run-clone.sh`, and the clones `rv2-mutA/`, `rv2-mutB/`, `rv2-mutC/`.
- `rv2-mutA-skills.{log,rc}`, `rv2-mutA-chs.{log,rc}`, `rv2-mutB-skills-dark.{log,rc}`, `rv2-mutB-skills.{log,rc}`, `rv2-mutB-full.{log,rc}`, `rv2-mutC-dark.{log,rc}`.
- `rv2-jest.log`.
