# SC-459 decisions ledger — G-S8 does not guard the SC-198 scroll pin

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate (dse branch `sc459-scroll-pin-gate`, cut at dse develop `188755b`).

## Spec (ticket description, 2026-10-20 — no Scott rulings in thread yet)

> **Fix:** re-measure SC-198 scenario C (from `.superpowers/sdd/sc198/root-cause.md`) on 1.14.4. If it still clamps without the pin, make G-S8 use a note that clamps unpinned and assert that `data-dse-scroll-pin` is applied. If it no longer clamps, propose retiring the pin (`src/framework/host/previewScrollPin.ts` plus its CSS rule).

## Owner notes (not Scott rulings)

- 2026-10-20: `.superpowers/sdd/sc198/root-cause.md` does NOT exist on this machine (nor in build-ledgers). Scenario C is reconstructed from `src/framework/host/previewScrollPin.ts` header + commit `cfea821`: a note that is mostly one tall element; measured on 1.13.7 scrollTop 2596 -> 0 unpinned, 2596 held pinned; sizer inline min-height collapsed 4331px -> 246px during the rebuild; a bare one-character `vault.process` with the plugin uninvolved reproduced it.
- 2026-10-20 (dispatcher): SC-460 (stray-CR write-back) is in flight and may also touch `visual-harness/obsidian-lifecycle.mjs` — keep edits scoped to G-S8.
- Retiring the pin (if 1.14.4 no longer clamps) is a Scott decision — Needs Review, not an owner call.

## Rounds

- r1 (reviewer, agent ae7ab7c131f5c2988, dispatched 2026-10-20): measure-only survey on 1.14.4. Brief `sc459-brief-r1-measure.md`, report `sc459-r1-measure-report.md`.
- Author-independence: r1 reviewer designs/prototypes G-S8; r2 implementer implements; r3 review must be a FRESH reviewer (not r1, since r1 authored the prototype).
- r1 DONE (2026-10-20): verdict **CLAMPS** on 1.14.4 — but only when a write rebuilds a DSE block fresh. SC-340 adoption keeps the writer's tracker DOM, which is why today's G-S8 passes unpinned. Prototype `sc459-r1-gs8-prototype.patch` adds an adoption-off phase; discriminates 3/3 (pin off in JS) + 3/3 (CSS rule deleted) FAIL, stock 3/3 ok; full lifecycle 27/27.

## Owner rulings (2026-10-20)

- **Path:** the spec's "still clamps" branch applies → land the discriminating G-S8 (r1 prototype). The pin is NOT proposed for retirement: it remains the backstop for every write that adoption misses (claim miss, collision, `viewAdoption:false`), which is the spec's clamp path. Mentioned to Scott as information, not an ask.
- **F1** (second pane / external edit clamps; pin covers only the writer's scroller) → filed **SC-470** (Backlog, relates SC-459 + SC-198). OUT OF SCOPE here.
- **F2** (previewScrollPin.ts header describes the 1.13.7 mechanism) → FOLD into r2: comment-only update to the header stating the 1.14.4 measurement (collapse comes from a DSE block drawn fresh; adoption keeps the writer's own write off that path; pin is the backstop for adoption misses). No code change.
- **F3** (`claim()` returns before counting a miss when adoption is off, `viewRegistry.ts:138`) → DROP: diagnostic counter in a kill-switch state, no user-visible effect.
- r2 (implementer, agent ac99b8dccbe173845, dispatched 2026-10-20): apply the prototype + F2 comment, run full dse-verify battery. Brief `sc459-brief-r2-implement.md`. r3: FRESH reviewer (not r1 — r1 authored the prototype).
- r2 DONE (2026-10-21): dse head `be5607c` on `188755b`. main.js/styles.css byte-identical to base (shots/freeze/parity skipped on that basis). tsc/lint clean, jest 5256/2 skipped (no shots cache), lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57. Discrimination: nopin-js FAIL, nopin-css FAIL, stock ok.
- r3 (fresh reviewer) dispatched 2026-10-21. Brief `sc459-brief-r3-review.md`.
- 2026-10-21 (dispatcher): dse develop moved 188755b -> ba20072 (SC-366: styles-source.css link-colour rules ~L8901/8909 + test/dom/theme/notInstalledLinkColour.test.ts). New baselines: jest 5260 / 1 skipped / 230 of 231 suites; e2e 83/87, 4 known-bug, 57/57; freeze 276/276; parity 0/0/24. **Land-ready must be on ba20072.** Owner plan: let r3 finish on be5607c (SC-366 touches neither of our files), then rebase onto ba20072 in the fix round (or a chore round if r3 is clean) and re-gate there; shots/freeze/parity skippable only if built main.js + styles.css at the rebased head are byte-identical to a build of ba20072.
- r3 DONE (2026-10-21): APPROVE_WITH_NITS, 0 CRIT/HIGH/MED, 3 LOW, 6 INFO. Discrimination re-proved (stock 3/3 ok, nopin-js 2/2 FAIL, nopin-css 2/2 FAIL, 4x CPU throttle holds). Kill-switch restore on throw proven.

## Owner rulings on r3 findings (2026-10-21)
- LOW-1 (sampling ends 2400 ms, pin released ~3090 ms) → FOLD.
- LOW-2 (comment says 2486px, measured 2446px) → FOLD.
- LOW-3 (comment overclaims "only from a DSE block drawn FRESH") → FOLD.
- INFO-1 (121-char comment line) → FOLD.
- INFO-2 (`on.rebuilt` computed, never asserted) → FOLD: phase 1 asserts the tracker was ADOPTED (not rebuilt), so a future change that stops adoption is visible.
- INFO-3 (nopin-js FAIL message hides stMin) → FOLD.
- INFO-4 ("rebuilt" also true when no tracker renders) → FOLD.
- INFO-5 (stale G-S8 description at `obsidian-lifecycle.mjs:24` + dse-verify SKILL.md) → FOLD the one-line `:24` description (it is G-S8's own line); SKILL.md G-S8 line is a workspace doc → dispatcher updates it at landing (text supplied in land-ready report).
- INFO-6 ("a scroller this pin never touched" inexact) → FOLD.
- r4 = rebase onto ba20072 + these fixes, by the r2 implementer (resumed). r5 = scoped re-review of the delta by the r3 reviewer (did not author the fixes).
- r4 DONE (2026-10-21): dse head `fb1b6f6` on `ba20072` (d12fa22 rebased r2, fb1b6f6 fixes). Built main.js/styles.css byte-identical to ba20072 build. tsc/lint clean, jest 5259/2 skipped (no shots cache), lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57. Discrimination FAIL/FAIL/ok. G-S8 phase 2 now ~3.25 s.
- r4 follow-up (eslint ignores `visual-harness/`; r2's "eslint rc=0" was vacuous) → DROP: pre-existing deliberate ignore, not this ticket; `node --check` covers syntax.
- r5 scoped re-review dispatched to the r3 reviewer (aa8bf830ded5452dd).
- r5 DONE (2026-10-21): APPROVE_WITH_NITS on fb1b6f6. All r3 findings fixed. New: LOW-A (5000 ms cap from click → stock flakes 1/2 at 6x CPU throttle), LOW-B (second-pane comment wrong), INFO-A, INFO-B.
- Owner rulings on r5: LOW-A → FOLD (gates run under heavy concurrent load; a new flake is not acceptable). LOW-B → FOLD. INFO-A → FOLD as a one-line comment explaining why `mhAtRelease >= st0` suffices (the post-release frames feed stMin). INFO-B → FOLD.
- r6 = fix round by the implementer (ac99b8dccbe173845); r7 = scoped re-review by the reviewer (aa8bf830ded5452dd), incl. 6x throttle stock runs.
- 2026-10-21 (dispatcher): dse develop moved ba20072 -> 84636a9 (SC-460 landed: stray-CR write-back tolerance; `visual-harness/obsidian-lifecycle.mjs` gains G-S12 — possible rebase touch-point). New baselines: jest 5329 / 1 skipped / 230 of 231 suites, lifecycle **28/28**; e2e 83/87, 4 known-bug, 57/57; freeze 276/276; parity 0/0/24. **Land-ready must be on 84636a9.** Owner: r6 implementer rebases onto 84636a9 inside r6 (overrides the r6 brief's STOP-if-moved line); on conflict keep SC-460's G-S12 and all its edits intact, re-apply only SC-459's G-S8 hunks. Built output must be byte-identical to a build of 84636a9.
- r6 DONE (2026-10-21): dse head `0267b8a` on `84636a9` (f67288a r2, 63f8ac3 r4, 0267b8a r6), clean rebase, G-S12 intact. Built output byte-identical to 84636a9 build (main.js 4a0b87f5…, styles.css 9d88edb6…). tsc/lint clean, jest 5328/2 (no shots cache), lifecycle 28/28, e2e 83/87 0 failed 4 known-bug 57/57. Discrimination FAIL/FAIL/ok; 6x throttle stock 2/2 ok.
- r6 follow-up (8x throttle: pin's fixed 2500 ms TTL expires before the redraw → real clamp) → filed **SC-472** (Backlog, Low). OUT OF SCOPE.
- r7 scoped re-review dispatched to reviewer aa8bf830ded5452dd.
- r7 DONE (2026-10-21): **APPROVE** on `0267b8a` / `84636a9`. 0 CRIT/HIGH/MED/LOW. SC-460 G-S12 untouched (diff = 5 SC-459 hunks only). Never-released probe FAILs loudly; 6x throttle 2/2 ok; full lifecycle 28/28.
- r7 INFO-1 (comment's "hard cap 12 s" unreachable; real bound ~9.5 s) → DROP: the real bound is stricter than the comment states; harmless.
- r7 INFO-2 (+4500 ms couples to PIN_TTL_MS) → appended to SC-472's description.
- **LAND-READY 2026-10-21:** dse `sc459-scroll-pin-gate` @ `0267b8a` on develop `84636a9`. Dispatcher to update workspace `.claude/skills/dse-verify/SKILL.md` G-S8 description at landing.
