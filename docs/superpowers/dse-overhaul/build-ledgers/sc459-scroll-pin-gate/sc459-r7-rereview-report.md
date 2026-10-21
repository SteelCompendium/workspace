# SC-459 r7: scoped re-review of the r6 delta (r3/r5 reviewer)

## Executive summary
- **Verdict: APPROVE.** 0 CRITICAL, HIGH, MEDIUM or LOW findings; 2 INFO, both optional and non-blocking.
- dse head `0267b8a` on `84636a9`, and `origin/develop` = `84636a9` (it has not moved). The range-diff shows `d12fa22 = f67288a` and `fb1b6f6 = 63f8ac3`, so both rebased commits are byte-identical as patches. `0267b8a` is the only new commit.
- **SC-460 is intact:** `git diff 84636a9..HEAD` has 5 hunks only. They are the `previewScrollPin.ts` header (`@@ -4`, `@@ -24`), the G-S8 line in the lifecycle header (`@@ -24`), and the G-S8 object (`@@ -1185`, `@@ -1189`). Nothing touches G-S12 (`:1600`), and "S12" appears 0 times in the diff.
- **r5 findings:** LOW-A, LOW-B, INFO-A and INFO-B are all fixed as ruled.
- **Runs on `0267b8a` (`--only=G-S8`):**
  - Stock ok (phase 2 3265 ms); stock at 6x CPU throttle ok 2/2 (7367 and 7088 ms).
  - Pin disabled in JS: FAIL. CSS rule deleted: FAIL.
  - A new probe bundle with `PIN_TTL_MS=20000`, so the pin is never released, FAILs with "never seen released within 4750ms". Phase 2 cannot pass without seeing the release, and the sampling stops on its own.
- **Built output:** `main.js` `4a0b87f5a9e760f7` and `styles.css` `9d88edb642d97604` are byte-identical to a build of `84636a9`.
- **Full lifecycle:** `OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed`, rc 0. G-S8 phase 2 took 3216 ms; G-S12 ok.
- **Tree:**
  - The dse `git status --porcelain` is empty before and after.
  - The superproject worktree shows ` M draw-steel-elements` before and after. That is the pointer bump, not mine.
  - All my kept `/tmp` dirs are deleted by exact path, and no `/tmp/dse-obsidian-lifecycle-*` dir remains.

## Fold verification (`git -C <dse> diff 63f8ac3..0267b8a`)
| r5 finding | status | where |
|---|---|---|
| LOW-A: cap counted from the click | FIXED. The cap is now `pinSeen ? min(pinOnAt + 4500, 12000) : 5000`, and `pinOnAt` is set on the first frame the pin is seen. `t.expect(off.released, …)` is kept. | `visual-harness/obsidian-lifecycle.mjs:1221,1247` |
| LOW-B: second-pane wording | FIXED. The comment now reads "a second pane (the pin is taken only on the writer's scroller), or an external edit (no write of ours, so the pin is never taken)". | `src/framework/host/previewScrollPin.ts:44-45` |
| INFO-A: release threshold | FIXED. A comment explains why `mhAtRelease >= st0` suffices: the 10 frames after release feed stMin. | `obsidian-lifecycle.mjs:1218-1220` |
| INFO-B: short line after the reflow | FIXED. The paragraph is reflowed, and no line in the file exceeds 100 chars. | `previewScrollPin.ts:6-11` |

## Runs (`sc459-r7-summary.log`, `sc459-r7-throttle-summary.log`)
| run | result |
|---|---|
| disc-stock-1 | ok, rc 0: `…was 5501px at its release, scrollTop held at 2779 over 138 frames (3265ms)` |
| disc-nopin-js-1 | FAIL, rc 1: `data-dse-scroll-pin was not on the scroller when the sizer collapsed to 2446px (pin frames 0, scrollTop min 2001 of start 2779)` |
| disc-nopin-css-1 | FAIL, rc 1: `scrollTop moved: start 2779 min 2001 max 2779 (… pin present true)` |
| disc-ttl20000-1 (pin never released) | FAIL, rc 1: `the pin was never seen released within 4750ms (pin frames 237)`. Total run time 23 s, so nothing hung. |
| throttle6 stock 1 | ok, rc 0. Phase 1 took 8336 ms and phase 2 7367 ms; the release was seen and mh was 5501 at release. |
| throttle6 stock 2 | ok, rc 0. Phase 1 took 6450 ms and phase 2 7088 ms. |
| full lifecycle (`npm run obsidian-lifecycle`) | `28/28 ok, 0 failed`, rc 0 |

Cap analysis:
- **Phase 2 cannot pass without a release.** If the pin is never seen, `released` stays false and `:1247` fails. nopin-js fails earlier, at the pin-attribute check (`:1245`).
- **The sampling cannot hang.** If the pin has not been seen by 5000 ms, the loop stops. So `pinOnAt` is always under about 5000 ms, and the loop ends by about 9.5 s at most. The promise always resolves.

## Findings
**INFO-1. `obsidian-lifecycle.mjs:1215,1221`: the "hard cap 12 s" can never be reached.**
- If the pin is not seen within 5 s, sampling has already stopped, so `pinOnAt + 4500` is at most about 9.5 s. `Math.min(…, 12000)` never applies.
- This is harmless; the comment just overstates the cap.
- Fix (optional): describe the bound as "about 9.5 s (5 s to first sighting + 4.5 s)", or drop the `Math.min`.

**INFO-2. `obsidian-lifecycle.mjs:1221`: the `+ 4500` duplicates `PIN_TTL_MS` (2500, `previewScrollPin.ts:72`) plus 2000 ms of slack.**
- If SC-472 raises the TTL above about 4.3 s, G-S8 fails loudly with "never seen released". It would not fail silently.
- The ttl20000 probe shows a second effect of a long TTL: phase 1's pin was still on the scroller when phase 2 started (`pinOnAt` about 250 ms, 237 pin frames).
- Fix (optional): note the coupling on SC-472, or cross-reference G-S8 in the `PIN_TTL_MS` docblock when SC-472 lands.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/`)
- **Scripts:** `sc459-r7-build-bundles.sh`, `sc459-r7-disc.sh`, `sc459-r7-probe-run.sh` (uses `sc459-r5-probe-patch.py`), `sc459-r7-all.sh`, `sc459-r7-throttle.sh`, `sc459-r7-gate.sh`, `sc459-r7-battery.sh`
- **Logs:** `sc459-r7-summary.log`, `sc459-r7-throttle-summary.log`, `sc459-r7-build.log`, `sc459-r7-disc-{stock-1,nopin-js-1,nopin-css-1,ttl20000-1}.log`, `sc459-r7-probe-throttle6-stock-{1,2}.log` (each with a `.patch.log`), `sc459-r7-lifecycle.log` and `.rc`, `sc459-r7-post-shas.log`
- **FAIL shots:** `sc459-r7-*-G-S8-FAIL.png`
- **Bundles (scratch):** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r7-fresh/bundles/{base,stock,nopin-js,nopin-css,ttl20000}/`
