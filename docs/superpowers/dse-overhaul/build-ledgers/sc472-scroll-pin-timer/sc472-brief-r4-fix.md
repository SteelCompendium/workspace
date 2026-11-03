# SC-472 r4 — fix round on r3's findings (implementer, resumed r2)

Worker for ticket-owner SC-472. **You never call the tracker.** All r2 footguns still apply (see `sc472-brief-r2-implement.md` §Footguns): devbox `-c <abs path>`, no compound `cd`, one gate per foreground Bash call, no background/Monitor waits, script-file exit codes, `git -C`, private scratch `.../scratchpad/sc472-r4-<agentId>/`, no `rm` with variable targets, no glob deletes, kill only own PIDs, never touch the freeze baseline, report-inline if the write is blocked, `SC-472:` first word on any message.

## Context

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/decisions.md` — "Owner rulings on r3" is the spec for this round (it supersedes the r1 "Risk 4 → ACCEPT").
- r3 report: `sc472-r3-review-report.md` in the same dir (findings with file:line; its probe tooling `sc472-r3-probe-block.mjs.txt`, `sc472-r3-mkvariant.py.txt` and Risk 4 logs `sc472-r3-risk4-*.log` show how it reproduced MEDIUM-1).
- Head `ebd81e5e` on develop `eaf64ba6`; superproject `276c3f71` on `7f058b42`.

## First: rebase

`git -C /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements fetch origin`, rebase onto **`423e798d`** (SC-546, harness-only: Xvfb via `scripts/xvfb-owned.mjs -displayfd`; required before any lifecycle/shots run, because un-rebased harnesses can pick another run's display). Fetch and rebase the superproject branch onto current `origin/main` (expect a CHANGELOG conflict; keep both sides).

## The fixes (rulings verbatim from the ledger)

1. > **MEDIUM-1 (Risk 4 real: reader scrolls during a late redraw → virtualisation removes an arm-time root → counted as "redraw started" → released next frame → 7456 -> 3889; stock holds) → FOLD, r3's prescribed fix:** count the redraw as started only with evidence of a re-render — a sizer collapse seen since the arm; a root not in `roots0` added; or an arm-time root re-inserted under a new section (adoption). Otherwise the pin waits for the backstop. Jest test(s) that go red without it; a new lifecycle phase **G-S59 (c)** (held `setViewData` + a real wheel scroll during the hold; unthrottled is fine) that FAILs on the ebd81e5e head bundle and passes on the fix; re-check G-S8 adoption-on.
2. > **LOW-1 (G-S59 does not test the busy rules; the 4 s spin is what discriminates; anti-vacuity met by construction BUSY_MS 4000 > PIN_TTL_MS 2500) → FOLD as proposal wording** stating all three plainly. Busy rules stay covered by jest mutation tests; no new lifecycle control.
3. > **LOW-2 (leaf navigated to another note keeps the old note's floor 3524 ms vs stock 2548 ms, 4544 px of empty scroll space) → FOLD:** release a pin when its scroller's view no longer shows the note the pin was armed for (record the path at arm; check in the frame loop and/or on the workspace `file-open` / layout change). Jest test that goes red without it.
4. > **LOW-3 (stale TTL wording `previewScrollPin.ts:180, :311, :393-394, :411, :440, :557`; KNOWN LIMIT (1) → about 1-1.3 s) → FOLD.**
5. > **LOW-4 (`livePreviewScrollHold.ts:156-158` "(r3 probes it)") → FOLD:** replace with r3's pane B numbers (hold 3127 / 4134 / 3265 ms vs stock 4047 / 3764 / 3283 ms, 0 blank frames, scrollTop 3020 held, 8x).
6. > **INFO (deviation (i) hardening: a re-pin inside the same mutation delivery is released early by the previous redraw's queued records) → FOLD:** `held.observer?.takeRecords()` in `arm()`, with a jest test.
7. > **CHANGELOG → FOLD:** give the numbers a unit ("scrolled from 2779 px to 2001 px"), and the delete-at-end trade as "about 1 second longer" (r2 1.10-1.32 s, r3 0.98 s). Rebase the superproject branch onto current `origin/main` to clear the expected CHANGELOG conflict.

Update `sc472-dse-verify-proposal.md` for G-S59 (c), the LOW-1 wording, the control that FAILs (c) (the ebd81e5e head bundle — "redraw-start on any arm-time root removal"), and the part timings. Re-run the mutation check over the new guards (one line per mutation). Re-run G-S59 discrimination once each: fix head ok; `423e798d` base FAIL (a)+(b); plain-timer control FAIL (b); ebd81e5e-head control FAIL (c) only. Out of scope: SC-548.

## Gates — full battery on the rebased head

Expected: tsc/lint clean · jest **6272 + your net new / 1 skipped / 251 of 252** (develop 423e798d is 6272 / 1 / 250 of 251) · lifecycle **47/47** in four `--only` parts (21 / 16 / `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S56` 9 / `G-S59` 1) — report each part's line and time · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · shots 592, 0 FAIL, 161/966 · freeze 280/280 · parity 0/0/24 (LAST).

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/sc472-r4-fix-report.md`, evidence prefixed `sc472-r4-`. Open with a ≤10-line executive summary: new dse head sha + base, superproject sha, each gate line, G-S59 discrimination incl. (c), MEDIUM-1 before/after numbers, mutation survivors. Final text: raw facts + absolute paths, `Drive-by fixes:` / `Follow-ups:` lists.
