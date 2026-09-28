# SC-235 round 6 — implement Scott's choice (option B), full battery (implementer)

Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 0. Context

- Ledger `decisions.md` in this dir — read "Scott rulings" and "Owner rulings, round 6"; they
  are your spec. Prior reports: `sc235-r3-fix-report.md`, `sc235-r4-rereview-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale`; DSE branch
  `sc235-section-title-scale` head `845a491` on `origin/develop` `5a20d5f`; superproject branch
  head `d3787af`. First: `git fetch origin` in the DSE clone and in the worktree superproject;
  rebase DSE onto `origin/develop` (expected `5a20d5f`) and the superproject onto `origin/main`
  (now `0cd7934` or later). Say what you ended on.
- Verify `pwd` before every write. Workspace-level CHANGELOG.md is in YOUR worktree
  superproject, never under `/home/scott/code/steelCompendium/workspace/` (only your ledger-dir
  files go there). No DSE `main`, no tags, no `just deploy*`, never touch the shared freeze
  baseline, never `rm -rf` under `.superpowers/` beyond your own `sc235-*`/`r6/` files.
- Commit after every coherent step.

## 1. Scott's ruling (verbatim from the ledger)

> Recommended approach is good.

The recommendation was B. Owner rulings, round 6 (quoted):

> - Section title: `font-size: calc(var(--dse-fs-body) * 0.9375)` (15px at default) +
>   `letter-spacing: 0.12em` (1.8px at 15px). Line-height follows (1.7 -> 25.5px).
> - Spend chip stays pinned at today's 16px / 0.07em (unchanged ruling).
> - Parity: re-declare whichever `section-tag` rows now fire (expect font-size, line-height; and
>   letter-spacing only if it fires — 1.8px vs 1.8px should match, so likely NOT). Each `why`
>   cites SC-235 and the reason: the site's Petrona has no small-caps glyphs, the browser
>   synthesizes them at 70%, so the plugin (real smcp) matches the site's RENDERED letter height
>   (8px) at 15px; Scott chose this 2026-09-28 (comment 00d1a795). Declared count is whatever the
>   run proves (expected 16 - 6 + 4 = 14 if only font-size/line-height fire, x2 schemes).
>   Move compare.test.ts's guard + parity README with it. The jest exact-value test pins 15px/0.12em.
> - Every comment / CHANGELOG line describing A is rewritten for B: plain wording — "section
>   titles are now 15px with wider letter spacing, so their letters match the site's height
>   (the site fakes its small caps)". No "matches the site's size" claim.
> - Narrow: B adds 0 wraps (measured r3/r4); re-verify on the final head.
> - Freeze must stay 260/260 (screen-only).

Notes: base develop has 16 DECLARED (the 3 section-tag entries you deleted in round 1 are
back as new entries citing SC-235, with whatever subset actually fires). If letter-spacing
does NOT fire, do not declare it (a dead declaration fails the run). Also re-check the
x-scaling rule: 0.9375 at text sizes 16/18/20 and the modal text-scale 1.4 (exact ratios).
Check the round-1/3 tests you added still describe the truth (rename/re-pin as needed).

## 2. Evidence (small)

`r6/sc235-final-B.png`: one row per family (feature/ability, statblock, kit), columns
**Today (16px)** | **This branch (15px, B)** | **Site**, 1 image px = 1 CSS px, crop never
rescale, computed size verified at capture time, caption with measured letter height. Reuse the
round-3 scripts. View it yourself. Plus the narrow wrap table (300/240px, today vs head).

## 3. Gates (dse-verify, in order, foreground, logs in `r6/`)

tsc/lint clean; jest = base at your develop sha + your tests (re-measure base; at `5a20d5f` it
was 4119 total and your branch added 3), 0 failed; lifecycle 19/19; shots 532 / 0 FAIL; freeze
260/260; parity 0 GAPs / 0 undeclared / N DECLARED (report N and the declared list) / exit 0.
Can-fail: show that deleting your new section-tag declarations turns the run red.

## 4. Process rules (non-negotiable)

- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>' > <log> 2>&1; echo rc=$?`; never pipe
  a gate into `tail`. Redirect long output to files — the 600s stream watchdog kills silent
  agents.
- Run every gate in the foreground. Never background a gate or wait on a `Monitor`.
- Never key a wait-loop on a scratch filename or its contents; per-run unique paths.
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose command line contains
  `worktrees/sc235-section-title-scale/`.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + question. If you ever message
  anyway, first word `SC-235:`.
- If the report-file write is blocked, return the report inline.

## 5. Report

`sc235-r6-optionB-report.md`, ≤10-line executive summary first (STATUS, dse sha, superproject
sha, develop/main shas, gate numbers, DECLARED N + list). Final text: raw facts + absolute paths.
