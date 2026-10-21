# SC-459 r5: scoped re-review of the r4 delta (r3 reviewer)

## Executive summary
- **Verdict: APPROVE_WITH_NITS.** 0 CRITICAL/HIGH/MEDIUM, 2 LOW (both new in r4), 2 INFO.
- dse head `fb1b6f6` on `ba20072`; `origin/develop` = `ba20072` (unmoved). The range-diff shows `be5607c = d12fa22`, an unchanged rebase. The delta `d12fa22..fb1b6f6` touches only the G-S8 object, the G-S8 line in the `:24` header, and the `previewScrollPin.ts` header comment.
- **Folds:** 8 of the 9 r3 findings are fixed as ruled. INFO-6 was over-applied: the new wording is wrong for the second-pane case (LOW-B).
- **Discrimination on fb1b6f6:** stock ok 2/2 (phase 2 3214 and 3215 ms). nopin-js FAIL, nopin-css FAIL. Probes: adopt-on FAIL (the rebuilt guard works), throw → `enabled = true`, 4x throttle stock ok and nopin-css FAIL.
- **LOW-A (new flake risk):** the 5 s cap counts from the click, and phase 2 now requires the pin release to be seen. At 6x CPU throttle, stock FAILs 1 of 2 runs ("pin was never seen released within 5040ms"). be5607c's G-S8 passed 2/2 at 6x.
- **Built output:** `main.js` `42f1445cb4516374` and `styles.css` `9d88edb642d97604` are byte-identical to a build of `ba20072`.
- **Gates:** tsc 0 · lint 0 · jest 5259 / 2 skipped / 230 of 231, rc 0 (no shots cache, i.e. the expected 5260/1 less one) · lifecycle `27/27 ok, 0 failed` rc 0 · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` rc 0.
- **Tree:** dse porcelain empty before and after. The superproject worktree shows ` M draw-steel-elements` before and after (the pointer, not mine). Every `/tmp` dir my runs kept has been deleted by exact path. `/tmp/dse-obsidian-lifecycle-V3CkAb` belongs to another session and is untouched.

## Fold verification (`git -C <dse> diff d12fa22..fb1b6f6`)
| r3 finding | status | where |
|---|---|---|
| LOW-1: window ends before the pin release | FIXED. Sampling runs until the pin is released plus 10 frames (cap 5 s). It asserts `off.released` and `mhAtRelease >= st0`. Stock: release seen, mh 5501 at release. | `obsidian-lifecycle.mjs:1205,1217,1231-1232` |
| LOW-2: 2486 → 2446 | FIXED | `previewScrollPin.ts:41-42`, scenario comment `:1184` |
| LOW-3: "only" overclaim | FIXED. Scoped to SC-459's measured shapes; unmeasured kinds listed. | `previewScrollPin.ts:28-33` |
| INFO-1: 121-char line | FIXED. No line over 100 chars now. The reflow leaves one short line, `:7` (INFO-B). | `previewScrollPin.ts:6-7` |
| INFO-2: phase 1 adoption | FIXED. Asserts `on.present` and `!on.rebuilt`. | `:1214-1215` |
| INFO-3: nopin-js message | FIXED. `(pin frames 0, scrollTop min 2001 of start 2779)` | `:1229` |
| INFO-4: no tracker rendered | FIXED. `present = !!root`, `rebuilt = present && !sameRoot`, `present` asserted in both phases. | `:1207-1208,1214,1226` |
| INFO-5: `:24` description | FIXED (SKILL.md line is the dispatcher's, per ruling) | `:24` |
| INFO-6: SC-470 wording | **Over-applied, see LOW-B** | `previewScrollPin.ts:45-46` |

## Runs (`sc459-r5-summary.log`)
| run | result |
|---|---|
| disc-stock-1/2 | ok, rc 0: `…sizer min-height fell to 2446px under the pin and was 5501px at its release, scrollTop held at 2779 over 148/149 frames (3215/3214ms)` |
| disc-nopin-js-1 | FAIL rc 1: `data-dse-scroll-pin was not on the scroller when the sizer collapsed to 2446px (pin frames 0, scrollTop min 2001 of start 2779)` |
| disc-nopin-css-1 | FAIL rc 1: `scrollTop moved: start 2779 min 2001 max 2779 (… pin present true)` |
| probe adopt-on (stock) | FAIL: `the write did not rebuild the tracker` |
| probe throw (stock) + P-EN | G-S8 FAIL (probe); `P-EN`: `registry.enabled after G-S8 = true` |
| throttle4 stock | ok. Phase 2 `ms` 4622: the release was seen about 400 ms before the cap. |
| throttle4 nopin-css | FAIL, 2779 → 2001 |
| throttle6 stock (fb1b6f6) run 1 | **FAIL: `the pin was never seen released within 5040ms (pin frames 6)`**. scrollTop held, the collapse sat under the pin. |
| throttle6 stock (fb1b6f6) run 2 | ok, `ms` 6478. The release landed in a long frame just before the cap. |
| throttle6 stock, **be5607c** harness, 2 runs (`sc459-r5-old-throttle6.log`) | ok 2/2 |
| full lifecycle (stock, `npm run obsidian-lifecycle`) | `27/27 ok, 0 failed`. G-S8 phase 2 took 3333 ms. |

## Findings

**LOW-A (new in r4). `visual-harness/obsidian-lifecycle.mjs:1205` + `:1231`: the 5000 ms cap counts from the click, but the pin is taken about 0.6 s after the click and held for `PIN_TTL_MS` (2500).**
- Under load the pin goes on later: about 1.34 s at 4x throttle and about 2.5 s at 6x. Its release then falls past the cap, and `:1231` hard-fails.
- Measured: 6x throttle, stock, FAIL 1/2. be5607c passed 2/2 under the same throttle. At 4x the margin was about 400 ms.
- It cannot produce a false pass; it fails loudly. Still, it is a new load-dependent flake in a mandatory gate, on a machine where several agents run Obsidian and jest at once.
- Fix: anchor the cap to the moment the pin is first seen. Stop at release + 10 frames, or at `pinOnAt + 2500 + 2000` ms, with an absolute cap of about 12 s. A cruder alternative is to raise the cap to 8000 ms.

**LOW-B (new in r4). `src/framework/host/previewScrollPin.ts:45-46`: "a second pane, or an external edit, redraws the tracker without any write of ours, so the pin is never taken" is false for the second pane.**
- In the second-pane case the write IS ours (from pane A), and the pin IS taken, but only on pane A's scroller. r1 M2c: pane A pin frames 33–47, pane B 0.
- My r3 wording proposal covered only the external-edit case and was ambiguous. r4 applied it to both cases.
- Fix: "Not covered (SC-470): a second pane showing the note (the pin is taken only on the writer's own scroller), or an external edit (no write of ours, so the pin is never taken)."

**INFO-A. `obsidian-lifecycle.mjs:1217,1232`: the release tripwire `mhAtRelease >= st0` is weaker than the no-clamp condition.**
- The no-clamp condition is about `st0 + clientHeight − padding`. A release with mh in [st0, st0 + clientHeight) would clamp and still pass this line.
- The 10 post-release frames and the scroll listener still feed `stMin`, so the scrollTop assertion catches that clamp. No action is needed. Optionally, tighten it to `>= st0 + s.clientHeight`, or note in a comment that scrollTop is the real check.

**INFO-B. `previewScrollPin.ts:6-7`: the reflow leaves a one-phrase line ("the open note makes Obsidian run").** Cosmetic; reflow the paragraph.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/`)
- Scripts: `sc459-r5-build-bundles.sh`, `sc459-r5-disc.sh`, `sc459-r5-probe-patch.py`, `sc459-r5-probe-run.sh`, `sc459-r5-all.sh`, `sc459-r5-old-throttle.sh`, `sc459-r5-new-throttle6.sh`, `sc459-r5-gate.sh`, `sc459-r5-battery.sh`, `sc459-r5-battery2.sh`
- Logs: `sc459-r5-summary.log`, `sc459-r5-build.log`, `sc459-r5-disc-{stock-1,stock-2,nopin-js-1,nopin-css-1}.log`, `sc459-r5-probe-*.log` (+ `.patch.log`), `sc459-r5-old-throttle6.log`, `sc459-r5-{tsc,lint,jest,lifecycle,e2e}.log/.rc`, `sc459-r5-rebuild-stock.log`, `sc459-r5-post-battery-shas.log`, `sc459-r5-post-battery2-porcelain.log`, FAIL shots `sc459-r5-*-G-S8-FAIL.png`
- Bundles (scratch): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r5-fresh/bundles/{base,stock,nopin-js,nopin-css}/`
