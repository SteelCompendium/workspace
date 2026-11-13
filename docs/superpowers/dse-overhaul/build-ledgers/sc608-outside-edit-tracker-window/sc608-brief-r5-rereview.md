# SC-608 r5 — scoped re-review of the r4 fix delta (reviewer R1, resumed)

Scope: ONLY the r4 delta the r4 fix commits on the rebased branch: `63e00d7e..eb46d58d` (dse; the r2 work was rebased too — the r4 delta is `a2968c5b`, `bfd034e0`, `9adac152`, `e0556918`, `eb46d58d` plus the rebased tests `35cf1c53`, `bf81f685`; compare against r2 via `git range-diff d984b115..9761eceb 63e00d7e..eb46d58d`) and superproject `3751eef8 (on origin/main bbcd1d41)`. Not a fresh full pass.

Read: the "Owner rulings on r3" section of `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/decisions.md` and the r4 report `sc608-r4-fix-report.md` (same dir).

Check, executing and probing (re-run your own ZR/ZX probes where they apply):
1. L1–L5 and I7 each fixed as ruled. L1 ZR-28 "out" (sidebar: window stays open, Dazed in the note, no Notice); L2 ZX-01 (Notice, no focus to the inserted tracker); L3 ZR-22 / ZD-07 (focus survives a burst; no focus theft afterwards — the settle re-claim must not pull focus the user moved); L4 ZR-26 (Notice + focus on a comment-only edit); L5 O18 kills your R3 mutant; I7 cancel on plugin unload.
2. No regression on the r3 matrix: own saves still show no Notice; Reading view in-block / out-of-block; sidebar in-block; two trackers; same note pinned + Reading view.
3. New tests red without each fix (spot-check two by mutation).
4. Superproject sits on current workspace origin/main with ONE pointer bump to the dse HEAD; `git -C … fetch origin` and confirm.
5. Re-run jest and the full e2e (base is now dse 63e00d7e: expect jest 11648 fresh + new tests, e2e 315/318 + new specs, 3 known-bug, 174/174 or Y/Y pairs); confirm the rebase onto 63e00d7e kept SC-605's additions in initiative view.ts intact; confirm the report's other gate numbers are from the final HEAD.

Rules: same as your r3 brief (`sc608-brief-r3-review.md` §3) — scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r5-rereview/`. No commits; worktree clean at the end. Never call the tracker.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r5-rereview-report.md`, ≤10-line executive summary first (verdict LAND / FIX-FIRST, findings by severity with file:line, gates re-run). Final text: STATUS, summary, artifact paths.

Also judge the implementer's follow-up: "A write the host drops is still recorded as written, so `disk` can be ahead of the note until the next load. This is harmless to the checks above." — probe a refused write (SC-343 stale-block guard) followed by an outside edit; does anything misfire (window stays open with a stale model in the sidebar, a missing Notice, a lost write)?
