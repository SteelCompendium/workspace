# SC-442 r8 — implementer brief: r7 review fixes (if any), rebase onto develop `758a8956` (SC-443 landed), full battery

This extends `sc442-brief-r6-implementer-rebase.md` and `sc442-brief-r6b-implementer-second-rebase.md`
(same dir). Everything in them still applies: the hard rules, the context loading, and the
gate-running rules — never read the 490 KB dse-verify SKILL.md whole (grep + `cut -c1-1500`);
every devbox call is `devbox run -c <abs path> -- bash <script-file>` with a unique log and rc
file; a long gate is started from its script and waited on with
`timeout 175 tail --pid=<the gate's own pid> -f /dev/null` repeated until it exits (never a
completion notice, never a Monitor, no `run_in_background`); never `rm` anything in /tmp or the
scratchpad; never `pkill` by pattern; `git -C <abs path>` for every git command. A fresh worker
picking this up reads those two briefs first, then this one, then the ledger's "Resume
2026-11-23" section to its end, then `sc442-r6-implementer-report.md` and
`sc442-r7-review-report.md` (executive summaries first).

Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`
dse submodule: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements`
(branch `sc442-e2e-counter-topup`, head `6d5a2caa` on develop `957e4b11` at this writing).
Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc442-r8-impl/`
(create it; new uniquely named scripts and logs — do not reuse the r6 folder's file names).

**You never call the tracker. You never push. No `src/` changes. No co-author / AI-attribution
trailers in commits.**

## 1. What changed

SC-443 landed. dse `origin/develop` is now `758a8956aa891f64b36ecdbef897f15fb9f18791` (12 commits
past `957e4b11`: e2e Tier 3 editor insert paths — new e2e specs and manifest, `[CENSUS-30..34]`,
87 `AUTH-*` ids, `e2e/README.md`, and 12 added `data-dse-control` attribute lines in
`src/authoring/CompendiumSearchModal.ts`, `schemaSuggest.ts`, `suggest.ts`). The SC-443 owner,
verbatim: "SC-442 (in flight): this branch adds `CENSUS-30..34` and 87 `AUTH-*` ids; none collides
with its worktree as of `6d5a2caa`." Files changed on both sides: `e2e/README.md` and
`test/dom/e2eCensus.test.ts`. `package.json` / `package-lock.json` did not change.

## 2. The task, in this order

1. **Review fixes first, on the current head** — the r7 findings and the owner's ruling on each
   are in the dispatch message and in the ledger ("Owner rulings on r7"). Findings are quoted
   verbatim from `sc442-r7-review-report.md`; fix exactly what is ruled "fold", nothing else.
   Commit (`test(SC-442): …`, plain words).
2. **Rebase:** `git -C <dse> fetch origin`; confirm `origin/develop` is
   `758a8956aa891f64b36ecdbef897f15fb9f18791` (else STOP, NEEDS_CONTEXT with both shas);
   `git -C <dse> rebase 758a8956`.
   - `e2e/README.md`: keep every row and section from both sides (one row per fixture file, as
     ruled in the ledger under "README rows").
   - `test/dom/e2eCensus.test.ts`: both sides' additions stay. The counter fixture scan this branch
     reworked in `6d5a2caa` must still mean the same thing after the merge, and SC-443's census
     additions must be untouched. If the two changes touch the same lines in a way that is not
     plainly additive, STOP, NEEDS_CONTEXT with the hunks.
   - Any other conflict: resolve only if plainly additive on both sides; otherwise STOP.
3. Re-check scenario ids are unique after the rebase (`CTR-*`, `[CENSUS-18]`, `[CENSUS-19]`, the
   matrix ids) and that `git -C <dse> diff 758a8956 HEAD --stat -- src` is empty.
4. **Full battery** on the final head.

## 3. Gates — numbers at develop `758a8956` (baseline)

- tsc (incl. `tsc -p e2e`) and lint clean
- jest **14271 passed / 2 skipped** fresh (**14272 / 1** with the shots css cache — your worktree
  has the cache)
- lifecycle **64/64**, seven `--only=` parts (G-S63 flaked once on part 3 at `957e4b11`, SC-689 —
  one re-run; a repeat is real)
- e2e **`OBSIDIAN-E2E done: 772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs`**
- shots **592** · freeze **280/280** · parity **0 / 0 / 24**

Expected on this branch: tsc/lint clean; jest = baseline + this branch's jsdom tests (about +166
at `6d5a2caa`; report the exact count and delta); lifecycle 64/64; e2e `0 failed`, coverage
**476/476 pairs** (466 + the 10 counter pairs — re-count, explain any other number), known-bug
**11** = 7 + CTR-V01, CTR-V02 (SC-673), CTR-Q01 (SC-674), CTR-N01 (SC-680) — list each id → ticket
and explain any other number; shots / freeze / parity unchanged. Run e2e **twice**; report both
summary lines. A full e2e run is now longer than before (SC-443 added about 90 tests) — wait on
the pid as above. Known flakes: the ledger's list; a red that repeats on a re-run is real. If any
remaining marker passes unexpectedly, STOP, NEEDS_CONTEXT. The dse tree must be clean at the end.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r8-implementer-report.md`
(a NEW file; do not overwrite the r6 report), opening with a ≤10-line executive summary (status,
final sha, base sha, each gate's summary line). Then: each r7 fix in a few lines with its commit;
every conflict and its resolution; the marker list; every gate's exact summary line with its log
path; Drive-by fixes; Follow-ups. If the report-file write is blocked by your harness, return the
report inline.

Final text to the ticket-owner: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`,
final dse head sha, base sha, `git log --oneline 758a8956..HEAD`, each gate's measured summary
line, the marker list, and the absolute path of every artifact you produced.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
`to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
completion notification and will resume you with the answer. If you ever do send a message
anyway, its FIRST WORD must be your ticket key (`SC-442:`).
