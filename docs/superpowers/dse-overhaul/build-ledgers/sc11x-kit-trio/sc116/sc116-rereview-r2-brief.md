# SC-116 — scoped re-review, round 2 (brief)

You are the same independent reviewer that wrote `sc116-review-r1.md`. **Workers never call the
tracker (Linear).** Your final text goes to the ticket-owner, not a human.

## Scope: the DELTA only — not a fresh full pass

Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-fix-r1-report.md`
(the fix round's report; exec summary first) and the owner's rulings in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/decisions.md`
("Owner rulings on the findings"). The branch has been rebased onto `origin/main` and carries
new commits on top of the three you reviewed; shas are in the fix report.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio`. Do not commit, amend, or
rebase. Verify `pwd` before any write; never write under
`/home/scott/code/steelCompendium/workspace/` except your report.

Check, and only this:

1. **HIGH-1 / MED-1 fix (Commit A, `(SC-115)`):** the `build.go` re-walk is exactly the
   prescribed shape (or the stated equivalent), the invariant doc comment exists, and the new
   ordering test would FAIL if the re-walk were removed (mutation-probe it: revert the re-walk
   in a scratch copy or `git stash`-style, run the test, restore). Re-measure
   `v2/docs/Read/summoner/other-summoners.md` after a `site` build: 217,633 bytes, 5
   `## Summons`, 1 `## Advancement Features`, 17 `sb-backlink`; `Browse/kit/index.md` still
   21 Martial / 3 Magic / 1 Psionic with 25 `sc-card__sig-card`.
2. **LOW-1 / LOW-2 / LOW-3 fix (Commit B, SC-116):** link-target stripping keeps display text
   and `Magic; Light Weapon` still reads Magic; the empty-annotation guard; the new unit
   tests actually pin those behaviours (mutation-probe each). If LOW-3 was skipped, confirm the
   report says so and why.
3. **Commit C (schema description, both copies):** description-only change; `diff` of the two
   `kit.schema.json` copies shows only the SDK "BETA —" prefix line; 25/25 generated kit JSON
   still validate against both (re-run your `validate.py`).
4. **Rebase integrity:** commit order `c31e701'` (SC-116) → `d0e8c67'` (SC-119) → `6415f04'`
   (SC-115) preserved; `git diff <old-sha> <new-sha>` for each rebased commit's tree delta is
   empty relative to its parent (i.e. the rebase changed no content); no upstream regression
   in the 5 (steel-etl) / 3 (v2) upstream commits' areas.
5. **Cleanliness:** superproject `git status --short` shows only `M steel-etl` / `M v2` /
   `M data-sdk-npm`; every submodule `git status --porcelain` empty; CHANGELOG bullets and the
   `steel-etl/CLAUDE.md` sentence present and readable.
6. Gates: `go build ./... && go vet ./... && go test ./...` all ok, zero vet.

## Footguns

Same as round 1: devbox wrapper for every Go command; redirect output to files; never
background a gate and wait; clean v2 generated dirt ONLY with
`git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`; no wait-loops
keyed on scratch filenames; if the report write is blocked, return it inline; you cannot
message the owner — `STATUS: NEEDS_CONTEXT` in the report if you need input; a stray message's
first word must be `SC-116:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r2.md`
— ≤10-line executive summary first: verdict LAND-READY / FIX-FIRST, per-item PASS/FAIL, one-line
reason. Then detail only where something failed or deviated.

## Return contract

Raw facts only: verdict, per-item PASS/FAIL, shas verified, the measured numbers, artifact
paths.
