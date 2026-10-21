# SC-459 r6 — fix the r5 re-review findings (implementer)

Same context, worktree and footguns as `sc459-brief-r4-rebase-regate.md` (re-read its sections 1 and 5). Head `fb1b6f6` on `ba20072`. `git -C <dse> fetch origin` first; ~~if `origin/develop` moved past `ba20072`, STOP~~ superseded 2026-10-21: rebase onto `84636a9` (see ledger) — keep SC-460 G-S12 intact, re-apply only SC-459 G-S8 hunks; lifecycle now 28/28, jest 5329/1 (5328/2 without shots cache); built output byte-identical to a build of 84636a9. Ledger rulings: "Owner rulings on r5" in `decisions.md`.

Findings to fix, verbatim from `sc459-r5-rereview-report.md`:
- **LOW-A** `visual-harness/obsidian-lifecycle.mjs:1205` + `:1231`: the 5000 ms cap counts from the click, and phase 2 now requires the pin release to be seen. At 6x CPU throttle, stock fails 1 of 2 runs with `the pin was never seen released within 5040ms (pin frames 6)`. be5607c's G-S8 passed 2/2 at 6x. At 4x there were about 400 ms to spare (4622 ms). Fix: count the cap from when the pin is first seen (`pinOnAt + 2500 + 2000`, hard cap about 12 s), or raise the cap to 8000 ms. (Owner preference: the first option — cap from first pin sighting, hard cap ~12 s.)
- **LOW-B** `src/framework/host/previewScrollPin.ts:45-46`: "a second pane, or an external edit, redraws the tracker without any write of ours, so the pin is never taken" is wrong for the second pane. That write is ours, and the pin is taken on the writer's scroller only. Fix: "a second pane (pin taken only on the writer's scroller), or an external edit (no write of ours, so the pin is never taken)".
- **INFO-A** `obsidian-lifecycle.mjs:1217,1232`: the release check `mhAtRelease >= st0` is weaker than the real no-clamp condition (about `st0 + clientHeight`). Owner ruling: add a one-line comment saying why it suffices (the 10 post-release frames feed stMin, so a clamp there fails the scrollTop check).
- **INFO-B** `previewScrollPin.ts:6-7`: the reflow leaves a one-phrase line; reflow it.

Scope unchanged (G-S8 object, line-24 description, `previewScrollPin.ts` header). One commit, no co-author trailers or AI attribution.

Gates on the new head: tsc/lint clean; jest (5260/1 or 5259/2 without shots cache); `--only=G-S8` stock ok 2x, plus **stock under 6x CPU throttle 2x** (r5's throttle method is in `sc459-r5-*` scripts in the ledger dir), nopin-js FAIL, nopin-css FAIL; full lifecycle `27/27 ok, 0 failed`; e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`; built main.js/styles.css byte-identical to the `ba20072` build (r4 shas `42f1445cb451…` / `9d88edb642d9…`).

Report `<ledger>/sc459-r6-report.md` (≤10-line exec summary first; logs `sc459-r6-`). Private scratch `…/scratchpad/sc459-r6-<yourAgentId>/`. Return raw facts + absolute artifact paths.
