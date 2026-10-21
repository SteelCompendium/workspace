# SC-459 r3: independent review of the discriminating G-S8 (fresh reviewer)

## Executive summary
- **Verdict: APPROVE_WITH_NITS.** No CRITICAL, HIGH or MEDIUM findings. 3 LOW, 6 INFO. None of them blocks landing.
- dse `be5607c` on `188755b`. `origin/develop` is still `188755b` after the fetch. The diff touches only the G-S8 scenario object (`visual-harness/obsidian-lifecycle.mjs:1175-1223`) and the comment header of `src/framework/host/previewScrollPin.ts`. Nothing else is touched.
- **Discrimination, reproduced on `be5607c` (`--only=G-S8`):** stock ok 3/3. Pin disabled in JS FAIL 2/2, CSS rule deleted FAIL 2/2. Under 4x CPU throttle, stock ok and nopin-css FAIL.
- **Vacuity probes:** the rebuilt guard catches a phase 2 run with adoption left on. The kill switch is restored after an error thrown mid-phase (`enabled=true`). The control, with `finally` removed, shows `false`, so the probe is sensitive. The MutationObserver reading the current value misses no intermediate inline min-height: the minimum from `oldValue` equals `mhMin`, stock and nopin-js.
- **Built output:** `main.js` and `styles.css` built from `188755b` (git-archive export) and from `be5607c` are byte-identical (`42f1445cb4516374` / `698d2d07cf15752c`). r2's claim holds.
- **Gates:** tsc 0 · lint 0 · jest 5256 passed / 2 skipped / 229 of 230 suites, rc 0 (no shots cache: this is the documented fresh-worktree reading, CURRENT is 5257/1) · lifecycle `27/27 ok, 0 failed` rc 0 · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` rc 0.
- **Main nit (LOW-1):** the 2.4 s sampling window closes before the pin is released, which happens about 3.09 s after the click. G-S8 therefore never sees scrollTop across the release.
- **Tree:** the dse `git status --porcelain` is empty, before and after. The superproject worktree shows ` M draw-steel-elements` both before and after: r2's pointer bump, not staged, and not mine. Every `/tmp/dse-obsidian-lifecycle-*` dir my runs created has been deleted, by exact path.

## Spec and rulings (quoted)
- Spec: "If it still clamps without the pin, make G-S8 use a note that clamps unpinned and assert that `data-dse-scroll-pin` is applied."
- Owner ruling (ledger, 2026-10-20): "**Path:** the spec's "still clamps" branch applies → land the discriminating G-S8 (r1 prototype). The pin is NOT proposed for retirement: it remains the backstop for every write that adoption misses (claim miss, collision, `viewAdoption:false`)…"
- Owner ruling: "**F2** … FOLD into r2: comment-only update to the header stating the 1.14.4 measurement … No code change."
- Conformance:
  - `Lifecycle/tall.md` clamps unpinned (2779 -> 2001) when adoption is off.
  - Assertion `:1219` checks `data-dse-scroll-pin` at the moment of the collapse.
  - The header change is comment-only, and the build is byte-identical.

## Discrimination (committed harness, prebuilt bundles; `sc459-r3-disc-*.log`)
| run | bundle | result |
|---|---|---|
| stock-1/2/3 | stock (`be5607c`) | ok, rc 0, 3/3. `adoption off: tracker rebuilt, sizer min-height fell to 2446px under the pin, scrollTop held at 2779 over 111–113 frames` |
| nopin-js-1/2 | `&& Date.now() < 0` on the pin call. Built main.js shows `…Date.now()<0)try{(p=this.scrollPin)==null\|\|p.pin(this.containerEl)}…`, sha `bba9314a99c6aba4` | FAIL rc 1, 2/2: `data-dse-scroll-pin was not on the scroller when the sizer collapsed to 2446px (pin frames 0)` |
| nopin-css-1/2 | SC-198 rule deleted from `styles-source.css`. The built styles.css has 0 matches for the rule, sha `43bec22bd3941409` | FAIL rc 1, 2/2: `scrollTop moved: start 2779 min 2001 max 2779 (… pin present true)` |

## Probes (temporary harness mutations, each reverted by `git checkout`; `sc459-r3-probe*-*.log`, the `.patch.log` files hold the exact diffs)
| probe | what | result |
|---|---|---|
| adopt-on | phase 2 sets `enabled = true` (no rebuild) | FAIL: `the write did not rebuild the tracker`. The guard catches it. |
| throw | throws right after phase 2's `writeOnce()`, with adoption off. A probe scenario `P-EN` follows | G-S8 FAIL. `P-EN`: `registry.enabled after G-S8 = true`. Restored. |
| throw-nofinally | the same, with the `finally` restore removed (control) | `P-EN`: `= false`. The probe would have caught a missing restore. |
| oldvalue (stock, nopin-js) | `attributeOldValue` added to count every intermediate sizer value | stock: olds `[5501,2446]`, current reads `[5501,5501,2446,5501]`, oldMin 2446 = mhMin. nopin-js: olds `[5501,2446,2486.11]`, oldMin 2446 = mhMin, **stMin 2001**: it also clamps, but the pin assertion fails first. |
| throttle4 (stock, nopin-css) | `Emulation.setCPUThrottlingRate 4` | stock ok over 28 frames. nopin-css FAIL, 2779 -> 2001. It fails loudly, not as a flake. |
| timeline (stock, throttle4-stock, nopin-css) | window raised to 4 s; ms after the click for each event | stock: pin on 618, collapse 648, regrow 899, **pin off 3088**. throttle4: pin on 1341, collapse 1464, **regrow 2630**, pin off 4860. nopin-css: collapse 618, st 2001 at 855 |

Timing analysis:
- A late rebuild cannot produce a false pass. If the collapse misses the window, `:1218` fails. If the tracker is not rebuilt in time, `:1217` fails.
- `pinAtCollapse === null` together with `mhMin < st0` is impossible, because the same callback sets both.

## Findings

**LOW-1. `visual-harness/obsidian-lifecycle.mjs:1201`: the sampling window (2400 ms) ends before the pin is released.**
- Measured: pin on at about 0.61 s and off at about 3.09 s (`PIN_TTL_MS = 2500`, `previewScrollPin.ts:69`). Under 4x throttle the sizer regrows at 2.63 s, which is also outside the window.
- Failure scenario: a regression where the rebuilt sizer is still short when the TTL ends. Causes include a slower mount, a re-render that lands later, or a TTL lowered to about 1.8–2.4 s with the release still outside the window. The clamp then happens at release, after sampling has stopped, and G-S8 stays green.
- The spec's two mutations are caught robustly regardless.
- Fix: keep sampling until `data-dse-scroll-pin` has been removed plus about 10 frames (cap about 5 s). Assert that scrollTop held over that whole interval, and that the sizer's inline min-height was back at ≥ st0 before the release.

**LOW-2. `src/framework/host/previewScrollPin.ts:38-39`: "sizer 5501px -> 2486px" understates the collapse.**
- The MutationObserver measures an inline minimum of **2446px** in both the unpinned and pinned runs: olds `[5501,2446,2486.11]`, unpinned. The gate's own ok and FAIL lines print 2446.
- r1's rAF sampler missed the 2446 frame and kept 2486.11, which is the step where the clamp settles.
- Failure scenario: a reader compares the comment with the gate output and cannot make the numbers match.
- Fix: change it to "5501px -> 2446px (scrollTop settles on the 2486px step)", or just "-> 2446px".

**LOW-3. `src/framework/host/previewScrollPin.ts:27`: "The collapse now comes **only** from a DSE block that is drawn FRESH" claims more than r1 measured.**
- r1 tested four non-DSE shapes: a code fence, a table, paragraphs, and head/EOF edits.
- Async-rendered non-DSE content was never measured: images, embeds, other plugins' code blocks, Mermaid, math.
- Failure scenario: a future maintainer reads "only" as proven and retires or narrows the pin on that basis.
- Fix: "In SC-459's measurements (code fence, table, paragraphs, head/EOF edits), the collapse came only from …".

**INFO-1. `previewScrollPin.ts:6` is 121 chars.** It is the only `//` line over 110 chars in `src/framework/host/*.ts`. The parenthetical was inserted without reflowing. Fix: reflow the paragraph.

**INFO-2. `obsidian-lifecycle.mjs:1202/1207`: `on.rebuilt` is computed but never asserted.** Probes show `rebuilt:false` in phase 1. The phase 1 comment says "the tracker DOM is kept". If adoption regressed, phase 1 would silently become a pinned fresh-rebuild check. Adoption itself is covered by G-S1..G-S6h, so this is optional. Fix: `t.expect(!on.rebuilt, 'adoption on: tracker was rebuilt — SC-340 adoption missed')`, or drop the computation in phase 1.

**INFO-3. `obsidian-lifecycle.mjs:1219`: assertion order hides the scrollTop drop for nopin-js.** The probe shows stMin 2001. The FAIL line reports only that the attribute is missing. Fix: append `scrollTop min ${off.stMin}` to the `:1219` message.

**INFO-4. `obsidian-lifecycle.mjs:1202`: `rebuilt = !sameRoot` is also true when no tracker is rendered at all after the write.** Combined with LOW-1, a tracker that fails to re-render would hold scroll through the window under the pin and pass G-S8. Render failures are caught elsewhere in the battery. Fix: also assert that a connected tracker root exists after the write.

**INFO-5. Two G-S8 descriptions are now stale; both are outside the scoped diff by design (SC-460 conflict surface).**
- `obsidian-lifecycle.mjs:24` header: "G-S8 (scrollTop pin across a tracker's own write)".
- The dse-verify SKILL.md G-S8 description.
- Update at landing, or after SC-460, to mention the adoption-off phase.

**INFO-6. `previewScrollPin.ts:41-42`: "an external edit redraws the tracker in a scroller this pin never touched".** For an external edit in the user's only pane, it is the same scroller; the pin is just never invoked. Wording fix: "… redraws the tracker without any write of ours, so the pin is never taken".

## Scope / ordering
- `git diff --stat 188755b..be5607c`: `previewScrollPin.ts` +21/-2, comment-only. `obsidian-lifecycle.mjs` +43/-12, all inside the G-S8 object. No FIXTURES and no shared-helper change.
- Full lifecycle order: … G-S6i, **G-S8**, G-S9a, G-S9b, G-S9d, G-S9e, G-S9f, G-S9c, G-S10, G-S11. All ok after G-S8, including G-S9*, which asserts that adoption kept the block.
- `tall.md` is used only by G-S8 (`:159`, `:1190`). If `writeOnce` throws before its `reset`, the note is left dirty, but nothing else reads it.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/`)
- Scripts: `sc459-r3-build-bundles.sh`, `sc459-r3-disc.sh`, `sc459-r3-disc-all.sh`, `sc459-r3-probe-patch.py`, `sc459-r3-probe-run.sh`, `sc459-r3-probes-all.sh`, `sc459-r3-probes2.sh`, `sc459-r3-probes3.sh`, `sc459-r3-gate.sh`, `sc459-r3-battery.sh`
- Build: `sc459-r3-build.log`, `sc459-r3-rebuild-stock.log`, `sc459-r3-post-battery-shas.log`
- Discrimination: `sc459-r3-disc-summary.log`, `sc459-r3-disc-{stock-1,stock-2,stock-3,nopin-js-1,nopin-js-2,nopin-css-1,nopin-css-2}.log`, `sc459-r3-disc-*-G-S8-FAIL.png`
- Probes: `sc459-r3-probes-summary.log` (its two `probe-oldvalue-*` rows are void because of a regex-escaping bug in my probe, so oldMin shows as null; they are superseded by `sc459-r3-probes2-summary.log`, and the void logs were deleted), `sc459-r3-probes2-summary.log`, `sc459-r3-probes3-summary.log`, `sc459-r3-probe*-*.log`, `sc459-r3-probe*-*.patch.log`, `sc459-r3-probe*-G-S8-FAIL.png`
- Gates: `sc459-r3-{tsc,lint,jest,lifecycle,e2e}.log` and `.rc`
- Bundles (scratch): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r3-fresh/bundles/{base,stock,nopin-js,nopin-css}/`
