# SC-127 round 6 — scoped re-review of the fix-round delta ONLY

You are the SC-127 round-4 reviewer, resumed. Review ONLY the delta since the tree you
reviewed (dse `6186261` on base `0c132d8`). The branch has since been rebased twice
(→ `f6fb208`, → `c524fd2` = SC-328 + 39 others); the r5 report's executive summary names
the final dse sha and the fix commits. The delta to review is those fix commits (r5 +
r5b) — `git log --oneline origin/develop..HEAD` lists the branch's commits; diff the
ones after the four r3 commits. Not a fresh full pass of the r3 commits.

Note on freeze: the shared baseline gained SC-328's 16 lines today (record in
`dse-verify` SKILL.md, backup `freeze-baseline.sha256.pre-sc328-bak`). On the rebased
tree the expectation is exactly 130 twin FAILED / 0 realprint FAILED / 0 missing. Workers never call the tracker. Restore every
probe; do not commit; foreground gates only, output to files with prefix `sc127-r6-`.

Read first: the ledger's newest entries (Scott's explicit "option A is great, go ahead."
ruling; the round-4 rulings — I-1, I-3, SC-348 are out of scope by ruling) and
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r5-fix-report.md`.

Check, with your own probes:
1. MED-1: hover/focus a preview number field in the dark twin — white field, dark ink, ≥4.5:1
   (your `hover.mjs`). The census guard: reproduce its OK line; can-fail by dropping one
   token from the host block (DRIFTED, names the token + consuming selector). Does it
   count `:hover`/`:focus`/`:focus-visible`/`:focus-within`/`:active` rules? Does it
   cover `--link-color-hover` (the miss it caught in r5)?
2. MED-2: one shared predicate for the loop and the self-test; remove the white check →
   the self-test must FAIL now.
3. LOW-1: `th` borders in the dark twin equal light twin/realprint; `border*Color` in the
   gate's sampled set; jest pin present and can-fail.
4. LOW-2: caret + scrollbar tokens re-declared; caret colour on a preview input is dark.
5. LOW-3 comment fixed.
6. Full battery numbers at the final sha (tsc, lint, jest, shots incl. every in-run OK
   line, freeze = exactly 130 twin FAILED / 0 realprint FAILED, parity 0/0/16); screen
   combos 0 moved vs base; your own two clean sweeps reproduce `sc127-rebaseline.txt`
   byte for byte, and applying it to a scratch copy of the baseline gives
   `freeze OK (260/260)`.
7. Commit hygiene (no AI trailers; superproject pointer re-bumped; trees clean).

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r6-rereview-report.md`,
≤10-line executive summary first: verdict (APPROVE / FIX ROUND), per-finding closed y/n,
battery numbers, realprint moved, rebaseline verified. Evidence under `.../sc127/r6/`.
Footguns as before: never wait on a background job; report-file blocked → inline; cannot
message me → `STATUS: NEEDS_CONTEXT`; never touch `freeze-baseline.sha256`.

## Added 2026-09-24 (from the fix round's own discovery)
8. `extractSc127HostBlockBody` in `shoot.mjs` used a `[^}]*` regex that a `}` inside a
   CSS comment silently truncated (the fixer hit this on its own comment). Verify the
   extractor now either parses the block correctly with a `}` in a comment or FAILS
   loudly; a truncated block that still prints `census OK` is a HIGH finding. Also confirm
   the census covers `--link-color-hover` AND `--link-external-color-hover`, and that
   re-declaring only a dependency token (eager `var()` substitution) is caught.
9. The census did NOT flag `--hr-color` (consumed by `hr`, mapped from
   `--background-modifier-border`), while the delta gate's new border-colour sampling did.
   Find why (selector enumeration? mapping-chain resolution? `hr` outside the matched set?)
   and judge whether the census's blind-spot class is closed or needs a follow-up ticket.
   A census that only checks tokens the plugin sheet references, not tokens Obsidian's own
   sheet reads for plain elements inside the root (`hr`, `a`, `th`, `input`…), is a
   finding — say which it is.
