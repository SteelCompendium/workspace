# SC-522 r6 brief — rebase onto 458abe3 + two comment folds (implementer, resumed)

Your final text goes to the ticket-owner, not a human. Workers never call the tracker.

## Context

Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/decisions.md` — newest entries ("r5 DONE", "Owner rulings on r5 INFO", the 458abe3 baseline entry). r5 report `sc522-r5-rereview-report.md` (INFO-2, INFO-3). Your r4 report and probe scripts (`sc522-r4-*`) are reusable.

Worktree `/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll`: dse `64e176f` on `34f46cf`; superproject `d82709b` on `8174d81`. Targets: dse `origin/develop` = **`458abe3`** (SC-481), superproject `origin/main` = **`367015f`** (or newer — fetch and report). Main-checkout dse dirt is Scott's live vault — ignore. Workspace files live in YOUR worktree's superproject, never under `/home/scott/code/steelCompendium/workspace/`.

## Task

1. Rebase dse onto `458abe3`. Dispatcher note (verbatim): "expect a textual conflict in obsidian-lifecycle.mjs (G-S52 vs G-S53) — keep both; your lifecycle will be 43/43." Keep SC-481's code whole; re-apply only SC-522 hunks. Fix the header scenario counts accordingly. Rebase the superproject onto origin/main (CHANGELOG: keep every bullet). `npm ci` if package files changed.
2. **Why this rebase needs re-measurement (owner, from the ledger):** "SC-481 changes Reading-view block reuse, and an LP embed's tracker is drawn by the Reading-mode block host inside the embed — reuse decides whether a redraw gives a fresh root, re-adds a root, or keeps it, which is exactly what SC-522's release rule keys on." So after the rebase, re-run your r4 probe table (i)-(v) base (458abe3) vs head, 2 reps, and r1's two headline probes ((a) `vault.process` at end → held 6800; own click → held 5420). If SC-481 changed whether the embed's root is fresh / re-added / kept, say so with numbers; if any case is now worse than base, STOP and report STATUS: NEEDS_CONTEXT with the numbers.
3. Comment folds (rulings verbatim): "INFO-2 … → **FOLD as an honest comment**: reword `:285-286` to say what really happens (the read includes the previous floor, so a re-hold never lowers it before the redraw; the redraw-time release handles a shrink); no behaviour change". "INFO-3 (any removal outside our roots in the ~20-30 ms before the redraw releases early → that write behaves like stock) → ACCEPT, add one line to KNOWN LIMITS." Commit as `docs(SC-522): …` (separate commit).

## Gates (expected at 458abe3)

tsc (incl. e2e) / lint clean · jest **6201 / 1 skipped / 249 of 250 + SC-522's tests** (report the total) · lifecycle **43/43** as two `--only` halves (each its own call) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · shots 592, 0 FAIL, `button host-leak OK (157 … 942 …)` · freeze `280/280` · parity 0/0/24 last · `styles.css` byte-identical to a 458abe3 build. Discrimination (2 runs each, bundles from the rebased sources): head ok; base FAIL (a)-(f); ctl-nohold and ctl-norelease FAIL (a)-(d)+(f); ctl-noclick FAIL (e) only; ctl-fresh FAIL (f) only. `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52,G-S53` ok 2/2. Also `git range-diff 34f46cf..64e176f 458abe3..<new head>` — report which SC-522 commits are `=` and which changed (and how).

**Footguns — same as your r4 brief §3, follow exactly** (`devbox run -c <abs>`, no compound `cd`, `git -C`, exit codes from script files, one blocking foreground gate per call, no `run_in_background`/`Monitor`/`&`, no `rm` with variables or globs, no shared `/tmp` glob deletes, PID-only kills inside your worktree, private scratch `…/scratchpad/sc522-r6-<agentId>/`, Write tool for scratch files, never key a wait on scratch names). Shots: it has auto-backgrounded past 600 s twice — run it from a script that writes its own log and rc file, then poll that rc file in short foreground calls.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r6-rebase-report.md`, ≤10-line executive summary first (shas, conflicts, range-diff, gate numbers, discrimination, (i)-(v) table base vs head, headline probes). Updated "Proposed dse-verify SKILL.md text" (lifecycle 43/43 with halves; G-S52 entry; CURRENT line). Evidence prefix `sc522-r6-`. If the write is blocked, return it inline. Final text: raw facts, porcelain (dse clean; superproject only ` M draw-steel-elements`), absolute paths. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you send starts with `SC-522:`.
