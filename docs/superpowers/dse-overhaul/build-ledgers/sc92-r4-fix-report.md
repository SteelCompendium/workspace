# SC-92 round 4 — fix report (L1/L2/L3 + rebase to current tips)

## Executive summary

**DONE.** Rebase clean: v2 onto `110849217e` (is-ancestor OK), superproject onto `9bc4ddf`
(is-ancestor OK) — the CHANGELOG rebase auto-merged with no conflict (our branch's only
touch was the SC-92 bullet, main's hunks landed elsewhere in the file). v2 HEAD
`fab54d976b52509b5cb1671ef3c751365e4b6efd`; superproject HEAD
`3cfdfa40a89f0718a35a595a887bba10219370fa`. Node tests: **116 pass / 0 fail**, exit 0
(114 baseline + 2 new). `just build`: **exit 0**, 194.77s, `docs/Browse|Read|scc|pins.md`
untouched. E2E `feature-browser-cost.e2e.cjs`: **all checks passed, exit 0** — Signature
100, Signature+No cost 216, Signature+Conduit 8. Screenshot re-taken; chip row unchanged:
`Signature · No cost · 1 · 3 · 5 · 7 · 9 · 11`. Worktree clean, both submodules' checkouts
at expected pins (steel-etl `c4e0526`, v2 = rebased HEAD). No AI/co-author trailers in any
commit. Drive-by fixes: none. Follow-ups: none.

## Rebase (Step 0)

- Discarded unrelated `v2/devbox.lock` churn (`git -C v2 checkout -- devbox.lock`) —
  never committed to the branch; it re-accumulates every time devbox runs inside `v2`
  (confirmed again after the node-test and build gates, discarded each time).
- `v2`: fetched origin, rebased `sc92-sig-filter` onto `110849217ebe4d6740a334466246427cda3dd1a9`.
  Clean — the branch's 4 files (`docs/javascripts/`×2, `tests/`×2) were untouched by main's
  intervening commits. `git -C v2 merge-base --is-ancestor 110849217e HEAD` → **true**.
- Superproject: fetched origin, rebased onto `9bc4ddf`. **No conflict occurred** — git's
  3-way merge auto-resolved the `CHANGELOG.md` hunk (our branch's only change was the SC-92
  bullet at the old line 138; main's new commits inserted elsewhere in `## Unreleased`) and
  auto-advanced the `v2` gitlink to main's newer pin (our branch never touched the v2
  pointer, so "ours" == merge-base and git fast-forwarded to "theirs"). Verified both SC-92's
  bullet and main's newer bullets are present under `## Unreleased` post-rebase.
  `git merge-base --is-ancestor 9bc4ddf HEAD` → **true**.
- Brought `steel-etl`, `draw-steel-elements`, `steelCompendium.github.io` checkouts up to
  the rebased pins via `git submodule update --init` (detached, as expected — this branch
  doesn't advance them). Staged and committed the `v2` pointer bump to the rebased v2 HEAD
  (commit `c88829c`) so the tree was clean before editing, per Step 0's instruction.
  `git status --short` was empty before any L1/L2/L3 edit.

## The task — three folds

- **L1** (`v2/docs/javascripts/steel-feature-browser-core.js:103-121`, now shorter): replaced
  the hard-coded `COST_TIER_ORDER` amount enumeration with `COST_TIER_HEAD = ["Signature",
  "none"]` plus a partition of the tiers present in `items` into numerics (sorted `Number(a)
  - Number(b)`) and non-numerics (sorted `localeCompare`), returned as
  `head-present ∪ numerics ∪ others`. Verified byte-identical output against every existing
  test fixture. Added two new tests to `v2/tests/steel-feature-browser-core.test.js`
  (`costTierValues: an amount outside the hard-coded 1/3/5/7/9/11 set sorts into its numeric
  place…` — a hypothetical `"2"` lands as `["1","2","3"]`; `costTierValues: a non-numeric
  unknown tier sorts after every numeric amount` — `["1","11","other"]`). All 9 pre-existing
  SC-92 tests pass unchanged (same expected values).
- **L2** (`v2/docs/javascripts/steel-feature-browser-core.js:86-89`): reworded the
  `costFacetValue` JSDoc's misattributed fallback pointer from "the `values` fallback in
  steel-feature-browser.js's facet descriptor" to "see `costTierValues` below, which folds
  an unlisted tier into the facet instead of hiding it."
- **L3** (`CHANGELOG.md:152-158`, commit `9aa3ec0`): reworded the SC-92 bullet —
  (1) scoped the card-face claim to costed results ("a costed result reads its cost on its
  face" — a no-cost ability renders no tag); (2) explained the bare numerals as "the amount
  of your class resource it costs"; (3) widened the composability list from
  Source/Level/Action/Keyword/Condition to every other facet on the page, adding Type and
  Track. Kept as one bullet, user-facing language, no shas.

Out-of-scope items (steel-etl, Bestiary browser, card markup/CSS, the `{value,unit}` branch,
all INFO items) were not touched.

## Gates (all v2, `<wt>/v2`)

1. `node --test tests/*.test.js` → **116 pass / 0 fail**, exit 0 (114 baseline + 2 new).
   Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r4-node-test.log`
2. `just build` → **exit 0**, 194.77s. `git status --short docs/Browse docs/Read docs/scc
   docs/pins.md` empty both before and after (only `devbox.lock` churned, discarded, never
   committed). Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r4-build.log`
3. `tests/e2e/feature-browser-cost.e2e.cjs` against the build above, served on
   `127.0.0.1:8127`: **all checks passed, exit 0**. Ground truth / measured: Signature 100,
   No cost 116, Signature+No cost 216, Signature+Conduit 8 — chip order
   `Signature, No cost, 1, 3, 5, 7, 9, 11` (ascending numeric tail), no any/all toggle, no
   400px overflow. Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r4-e2e.log`
4. Screenshot `sc92-shot-signature-selected.png` re-taken via the e2e's `SHOT_DIR` hook
   (same 1280px viewport, Signature selected) → saved as
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r4-shot-signature-selected.png`.
   Chip row reads `Signature · No cost · 1 · 3 · 5 · 7 · 9 · 11` unchanged, count "100 of
   1592 features".

`just search-bench --gate`: not run — out of scope per `v2/AGENTS.md` (search-ranking gate,
unrelated to the facet UI touched here); same call the round-2 implementer made.

## Commits

- **v2** `fab54d976b52509b5cb1671ef3c751365e4b6efd` —
  `fix(feature-browser): costTierValues partitions present tiers instead of enumerating amounts (SC-92 review L1/L2)`
  — the L1 code change + L2 JSDoc reword + the two new tests, one commit.
- **Superproject**:
  - `c88829c` — `chore: bump v2 submodule pointer (SC-92 round 4 rebase)` (mechanical, to
    land the Step-0 rebase cleanly before editing)
  - `9aa3ec0` — `docs: reword SC-92 CHANGELOG bullet per review L3`
  - `3cfdfa4` — `chore: bump v2 submodule pointer (SC-92 L1/L2 fix commit)` (final pointer
    bump, to `fab54d976b`)
- No AI/co-author/"Generated with" trailers in any commit (checked by grep across all four
  commit messages). Worktree clean: `git -C <wt> status --short` and
  `git -C <wt>/v2 status --short` both empty at the end.

## Drive-by fixes

None.

## Follow-ups

None — all in-scope findings (L1, L2, L3) were folded; M1 was a discard-only step (done);
INFO items were left untouched per the brief.

## Round 6 — two small folds from the round-5 re-review

**DONE.** v2 HEAD `b9a37c0bc49ac3f188d8b486d52ef1f080e26b21`; superproject HEAD
`fa582053b22be845ff0eb86e53af70e8e83fab25`. Node tests: **116 pass / 0 fail**, exit 0
(unchanged count — rename only). Both trees clean.

- **LOW-1** (`v2/tests/steel-feature-browser-core.test.js:110,121`): renamed the two test
  names that still described the deleted `COST_TIER_ORDER` enumeration contract
  ("canonical order… not lexicographic" / "a tier outside the canonical list is appended
  after '11'…") to describe the current partition behaviour: "head tiers (Signature, No
  cost) come first, then present amounts sorted ascending, not lexicographic" and "numeric
  tiers sort ascending, with any non-numeric tier placed after them." Names only —
  assertions and fixtures untouched (confirmed via diff: only the two `test("…", …)` string
  literals changed).
- **LOW-2** (worktree `CHANGELOG.md`): the SC-92 bullet had landed under the `### Internal`
  sub-heading of `## Unreleased` by mistake (a user-facing feature entry, not an internal
  change). Moved it, text unchanged, to be the last bullet in the user-facing run
  immediately above `### Internal`, blank-line separated on both sides matching the
  existing style at that boundary. No other bullet was moved or edited (confirmed via
  `git diff` — a pure cut/paste, identical bullet text at both diff hunks).

Gate: `node --test tests/*.test.js` (`<wt>/v2`) → **116 pass / 0 fail**, exit 0. Log:
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r6-node-test.log`.
No build or e2e run — no runtime/behavioural change (test names and CHANGELOG prose only).

Commits:
- v2 `b9a37c0bc4` — `test: rename costTierValues tests to match the partition contract (SC-92 review LOW-1)`
- superproject `c7860d2` — `docs: move SC-92 CHANGELOG bullet out of the Internal sub-heading (SC-92 review LOW-2)`
- superproject `fa58205` — `chore: bump v2 submodule pointer (SC-92 round 6 test-rename commit)`

No AI/co-author/"Generated with" trailers in any of the three commits. Worktree clean:
`git -C <wt> status --short` and `git -C <wt>/v2 status --short` both empty at the end.
