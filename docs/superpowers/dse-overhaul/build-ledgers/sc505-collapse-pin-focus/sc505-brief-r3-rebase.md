# SC-505 r3 fix + rebase brief (implementer A, resumed)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/decisions.md` (read the 2026-10-24 entries). Review report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r2-rereview-report.md` (sections LOW-A, LOW-B, INFO-1; reviewer probe sources incl. `embed2.md` and `probe.e2e.ts` are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r2-rereview-m4w8/` — read-only for you). Same worktree, branch, scratch folder and section-4 footguns as `sc505-brief-r1-impl.md`. Head at start: dse `3717849` on `efc17de`; superproject `6e7f67d` on `7e45f8d`. You never call the tracker.

## Steps

1. **Rebase first.** `git -C /home/scott/code/steelCompendium/worktrees/sc505-collapse-pin-focus/draw-steel-elements fetch origin`; rebase onto `054c9c5` (SC-501: harness-only, `visual-harness/shoot.mjs`) or newer `origin/develop`; `npm ci` only if package.json changed. Rebase the superproject branch onto origin/main (keep both bullets on a CHANGELOG conflict). Report `git range-diff efc17de..3717849 <new base>..<rebased head>`; every commit should be `=`. If you hand-resolve ANY conflict in `src/` or `test/`, stop and return STATUS: NEEDS_CONTEXT with the range-diff.
2. **Fixes**, owner rulings verbatim from the ledger:

> - LOW-A (a note embedding the same note twice puts two same-key copies in ONE pane; Pin on embed 1 -> focus to embed 0's Pin (the twin); Pin on embed 0 -> <body>; measured RV-P17A/B) -> FOLD into r3 as prescribed: scope the request below the pane to the pressed copy (`pressed.closest('.internal-embed, .markdown-embed')` or its position among same-key copies in the pane); count focus on a Pin this request already claimed as ours; jest test with two same-key hosts in one fake leaf; e2e in RV-P17 shape if drivable.
> - LOW-B (the focusin guard has no committed real-Obsidian test) -> FOLD: CHR-F07 in RV-P16's shape.
> - INFO-1 (the "still on the pressed button" branch untested; claim-time disarm redundant with the focusin guard) -> FOLD: after LOW-A, every branch in focusHandoff's claim/disarm logic is either covered by a test that goes red when it is removed, or removed. Report which.

   Failing test first for each (red on 3717849, green after); one commit per finding with its id. CHR-F07 shape (from the review): Tab to Pin, Enter, wait for the write; Tab once to Collapse; `dse.externalEdit` inside the 1.5 s settle window; expect focus not on `chrome.pin`. It must go red with the `focusin` listener removed. If the RV-P17 double-embed e2e is drivable, add it (the e2e vault may need a fixture note embedding a stamina note twice — follow the coverage-gate rules); if not, say why and rely on jest.
3. Do not touch SC-511 (Unpin). Do not bump the submodule pointer; do not push.

## Gates — full dse-verify battery, each one blocking foreground call

Expected (base 054c9c5: jest 6003/1/242 of 243, e2e 114/114 79/79; plus this branch): tsc/lint clean; jest **6020 + r3 new / 1 skipped / 243 of 244**; lifecycle **36/36**; e2e **120 + r3 new ok, 0 failed, 0 known-bug, coverage 84/84** (+ any new pairs); shots **592, 0 FAIL** with SC-501's new in-run sweep lines (gallery boundary 12 records, kinds listed); freeze **280/280**; parity **0/0/24**. Report each gate's own summary line.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r3-fix-report.md`, ≤10-line summary first (shas, bases, range-diff verdict, per-finding commit, every gate line). Inline if the write is blocked. Return raw facts + artifact paths. Cannot message me; NEEDS_CONTEXT to ask; first word `SC-505:` if you ever message.
