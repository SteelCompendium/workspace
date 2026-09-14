# SC-92 round 5 — scoped re-review of the round-4 delta

## Executive summary

**APPROVE** — 0 HIGH · 0 MEDIUM · 2 LOW · 2 INFO. Nothing blocks land.
Reviewed: v2 `fab54d976b52509b5cb1671ef3c751365e4b6efd` (delta commit), superproject
`3cfdfa40a89f0718a35a595a887bba10219370fa` (incl. `9aa3ec0` L3, `c88829c`/`3cfdfa4` pins).
1. **L1 PASS** — amounts no longer enumerated; probed directly under node: `["11","3","Signature","1","none"]`→`["Signature","none","1","3","11"]`; +`"2"`→`…"1","2","3","11"`; non-numerics last. Live chip row unchanged.
2. **L2 PASS** — JSDoc now points at `costTierValues` in the same file.
3. **L3 PASS** — all three prescriptions applied; one bullet, no shas, under `## Unreleased`; main's bullets byte-identical.
4. **Rebase integrity PASS** — both is-ancestor true, 3 v2 commits on `110849217e`, no generated content / `devbox.lock`, pins v2=`fab54d976b` steel-etl=`c4e0526`, both `status --short` empty.
5. **Gates PASS (re-run by me)** — `node --test tests/*.test.js` **116 pass / 0 fail, exit 0**; e2e **all checks passed, exit 0**, Signature **100** / +No cost **216** / +Conduit **8**. Build **skipped** (justified, see §5).
6. **Hygiene PASS** — no AI/co-author/"Generated with" trailers in any of the 4 new commits.
Tree left exactly as found (worktree clean before and after).

## 1. L1 — `costTierValues` no longer enumerates amounts

`v2/docs/javascripts/steel-feature-browser-core.js:99-125`. `COST_TIER_ORDER` is gone; the
helper is now `COST_TIER_HEAD = ["Signature","none"]` filtered to present, then a partition of
the remaining present tiers into `numerics` (sorted `Number(a)-Number(b)`) and `others`
(`localeCompare`), concatenated. The round-3 prescription is implemented verbatim.

Probed directly by `require()`-ing the UMD core module the way the tests do
(`sc92-r5-probe.log`):

```
[11,3,Signature,1,none]            -> ["Signature","none","1","3","11"]       (brief case 1)
[… + "2"]                          -> ["Signature","none","1","2","3","11"]   (brief case 2)
[… + "zzz","other"]                -> ["Signature","none","1","3","11","other","zzz"]
today's real set (any input order) -> ["Signature","none","1","3","5","7","9","11"]
numerics only [11,2,100,1]         -> ["1","2","11","100"]
[] -> []   ;  head absent [3,1] -> ["1","3"]  ;  duplicates collapse
```

Live page: the e2e asserts the built island's chip row and it reads
`Signature · No cost · 1 · 3 · 5 · 7 · 9 · 11` — **unchanged**. The built artifact
`v2/site/javascripts/steel-feature-browser-core.js` is byte-identical to the fixed source
(`diff -q` → identical, contains `COST_TIER_HEAD`).

The two new tests (`tests/steel-feature-browser-core.test.js:131`, `:140`) pin exactly the two
cases the prescription named; both pass.

## 2. L2 — JSDoc pointer

`v2/docs/javascripts/steel-feature-browser-core.js:85-88` now reads "… see `costTierValues`
below, which folds an unlisted tier into the facet instead of hiding it." The stale
"`values` fallback in steel-feature-browser.js's facet descriptor" text is gone. The one
remaining cross-file reference (`:103`, "stamped by the caller — see steel-feature-browser.js
mount()") is accurate — `steel-feature-browser.js:165` is the stamping site. PASS.

## 3. L3 — CHANGELOG bullet

Superproject `CHANGELOG.md:152-158` (commit `9aa3ec0`). All three round-3 points addressed:
(1) card-face claim scoped — "a **costed** result reads its cost on its face"; (2) numerals
explained — "or the amount of your class resource it costs (1, 3, 5, 7, 9, 11)";
(3) composability widened to "every other facet on the page (Type, Source, Level, Action,
Keyword, Condition, Track …)" — Type and Track now present. Still one bullet, user-facing
voice, no shas, under `## Unreleased` (heading at `:9`, next `## ` at `:619`).

Main preservation verified structurally, not just by eyeball: deleting only the SC-92 bullet
from the branch's `CHANGELOG.md` yields a file **byte-identical** to
`git show 9bc4ddf:CHANGELOG.md`, and `git diff 9bc4ddf..HEAD -- CHANGELOG.md` is a pure
7-line addition with zero deletions. Main's Unreleased and dated bullets are intact.

## 4. Rebase integrity

- `git -C <wt>/v2 merge-base --is-ancestor 110849217e HEAD` → **true**; `v2 origin/main` is
  `110849217ebe4d6740a334466246427cda3dd1a9`.
- `git -C <wt> merge-base --is-ancestor 9bc4ddf HEAD` → **true**.
- `git -C <wt>/v2 log --oneline 110849217e..HEAD` → exactly 3: `fab54d976b`, `4e05e0d00d`,
  `e53b0e5f9d`.
- Branch touches exactly 4 files: `docs/javascripts/steel-feature-browser-core.js`,
  `docs/javascripts/steel-feature-browser.js`, `tests/e2e/feature-browser-cost.e2e.cjs`,
  `tests/steel-feature-browser-core.test.js` (+416/−2). `git diff --name-only 110849217e..HEAD`
  filtered for `docs/Browse|docs/Read|docs/scc|docs/pins.md|site/|devbox.lock` → **no match**.
- Superproject pins (`git ls-tree HEAD`): v2 `fab54d976b…` (= v2 HEAD), steel-etl
  `c4e0526dd4…`, draw-steel-elements `96e22381…` (= main's). Superproject branch touches only
  `CHANGELOG.md` and the `v2` gitlink.
- `git -C <wt> status --short` and `git -C <wt>/v2 status --short` both **empty** (no
  ` M <submodule>`), before and after my gates.

## 5. Gates (re-run by me)

1. `devbox run -- node --test tests/*.test.js` in `<wt>/v2` → `tests 116 / pass 116 / fail 0`,
   `EXIT_CODE=0`. Matches the round-4 report's 116/0.
   Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r5-node-test.log`
2. E2E `tests/e2e/feature-browser-cost.e2e.cjs` served from `<wt>/v2/site` on
   `127.0.0.1:8133` → **all checks passed**, `E2E_EXIT:0`. Measured: ground truth
   `Signature=100 NoCost=116 Signature+NoCost=216 Signature+Conduit=8`; chip set
   `[Signature, No cost, 1, 3, 5, 7, 9, 11]`; Cost row between Action and Keyword; no any/all
   toggle; no 400px overflow; 100 cards each tagged "Signature".
   Logs: `…/sc92-r5-e2e.log`, `…/sc92-r5-httpserver.log`
3. `just build` — **skipped, per the brief's escape clause, and it holds**: `sc92-r4-build.log`
   ends `EXIT:0` ("Documentation built in 194.77 seconds"); `<wt>/v2/site` mtime
   `2026-09-14 09:57:39` is newer than the last `docs/javascripts` commit `fab54d976b`
   (`2026-09-14 09:53:50`); and the built copy of the changed file is byte-identical to the
   source. The e2e above therefore exercised the L1 code as shipped.

## 6. Hygiene

`git log --format='%B'` over `110849217e..HEAD` (v2) and `9bc4ddf..HEAD` (superproject),
grepped case-insensitively for `co-authored-by|generated with|claude|anthropic` → **no match**
in either range. All 4 commits authored `Scott Tomaszewski <scottTomaszewski@gmail.com>`.
Log: `…/sc92-r5-hygiene.log`

---

## Findings

### LOW-1 — two test names still describe the contract L1 deleted
`v2/tests/steel-feature-browser-core.test.js:110` and `:121`.

`:110` — "costTierValues: **canonical order**, filtered to values present, not lexicographic".
`:121` — "costTierValues: a tier outside the **canonical list** is **appended after '11'** in
numeric order".

After `fab54d976b` there is no canonical list and nothing is appended after `"11"`: `"13"` in
that fixture lands where it does because it is numerically greater than `11`, and `"other"`
lands last because it is non-numeric — not "in numeric order". The assertions are still
correct (both pass; I re-derived `["Signature","11","13","other"]` from the new implementation
by probe), so this is documentation, not correctness.

Failure scenario: a maintainer adds `cost_tier: "2"` to the `:121` fixture, trusts the name,
expects `["Signature","11","13","2","other"]`, gets `["Signature","2","11","13","other"]`, and
either "fixes" the helper back toward an enumerated order or files a false regression. This is
the same class of stale-pointer defect L2 was raised for.

Prescribed fix (test names only, no assertion changes):
- `:110` → `"costTierValues: head (Signature, No cost) then amounts ascending, filtered to values present, not lexicographic"`
- `:121` → `"costTierValues: an unseen amount sorts by value and a non-numeric tier sorts last — neither is dropped"`

### LOW-2 — the SC-92 bullet sits below `### Internal` (pre-existing drift, not introduced here)
Superproject `CHANGELOG.md:152`, under the `### Internal` sub-heading at `:113`, while the
file's own rule at `:6-7` says "One bullet per user-facing change; internal/process changes go
under an *Internal* sub-heading." The Cost facet is user-facing.

**Not a round-4 regression and not caused by the rebase**: main already has the same drift —
SC-90's bullet (`:142`) and several plainly user-facing DSE bullets (SC-183 at `:159`, SC-187/193,
SC-188) sit under the same heading on `9bc4ddf`. The branch placed SC-92 immediately after its
SC-90 precedent, which is the locally consistent choice.

Failure scenario: at deploy the Unreleased section is promoted to a dated header and the
*Internal* grouping is taken at face value, so a headline user-facing feature ships filed as
internal.

Prescribed fix (owner's call, **not** this branch's job): leave as-is for consistency with
main, or move the SC-90/SC-92/DSE user-facing bullets above `### Internal` in a separate
CHANGELOG-hygiene commit on main. Do not fix it inside the SC-92 branch — it would drag
unrelated main content into this diff.

### INFO-1 — numeric classification accepts a few non-amount strings
`v2/docs/javascripts/steel-feature-browser-core.js:118-119` partitions on `!isNaN(Number(v))`,
so `""`, `" "`, `"Infinity"`, `"0x10"` would be classified numeric (probe: `""` and `" "` sort
ahead of `"1"` as 0). **Unreachable today**: `cost_tier` is only ever produced by
`Core.costFacetValue` at `v2/docs/javascripts/steel-feature-browser.js:165`, which maps empty
and whitespace-only to `"none"` and every other non-integer-leading string to `"other"`. No
action — flagged only so a future change to `costFacetValue`'s contract knows this coupling
exists.

### INFO-2 — superseded intermediate pointer bump on the superproject branch
`c88829c` ("bump v2 submodule pointer (SC-92 round 4 rebase)") pins the pre-fix v2 HEAD and is
superseded by `3cfdfa4`. Deliberate and explained in the round-4 report (it kept the tree clean
before editing); harmless, and a candidate for squashing at land if the owner prefers a
two-commit superproject branch. No action required.

---

## Out of scope, untouched
INFO items I1–I6 from round 3, the facet design, the `{value,unit}` branch, steel-etl, card
markup/CSS. I fixed nothing. Both worktree levels are clean; the only dirt anywhere is in the
**shared main checkout** (`workspace/docs/handoffs/HANDOFF.md`, and
`draw-steel-elements` demo-vault content with mtimes of 09:48, before this review began) —
not mine, not touched.

---

## Round 7 — scoped recheck of the two folds (LOW-1, LOW-2)

**VERDICT: APPROVE.** Both round-5 LOW findings are correctly folded. 0 HIGH · 0 MEDIUM ·
0 LOW · 1 INFO (new, cosmetic). Nothing blocks land.

Shas rechecked: v2 `b9a37c0bc49ac3f188d8b486d52ef1f080e26b21` (on `fab54d976b`), superproject
`fa582053b22be845ff0eb86e53af70e8e83fab25` (`c7860d2` CHANGELOG move + `fa58205` pointer bump).
v2 branch is now four commits on `110849217e`: `e53b0e5f9d`, `4e05e0d00d`, `fab54d976b`,
`b9a37c0bc4`.

1. **LOW-1 FIXED.** `git show b9a37c0bc4` → `2 2 tests/steel-feature-browser-core.test.js`;
   grepping every changed line for anything that is not a `test(` line returns **empty**, and
   the two file versions with all `test(` lines stripped are **byte-identical** — names only,
   no assertion touched. New names describe the partition contract:
   `:110` "head tiers (Signature, No cost) come first, then present amounts sorted ascending,
   not lexicographic"; `:121` "numeric tiers sort ascending, with any non-numeric tier placed
   after them". Both are accurate against the implementation probed in round 5.
2. **LOW-2 FIXED.** SC-92 bullet now at `CHANGELOG.md:113-119`, the **last bullet of the
   user-facing run, directly above `### Internal` (`:121`)**, still inside `## Unreleased`
   (`:9`). Bullet text is **byte-identical** (7 lines) to its `3cfdfa4` version — pure move,
   no reword, no shas.
3. **Gate re-run.** `node --test tests/*.test.js` → `tests 116 / pass 116 / fail 0`,
   `EXIT_CODE=0`; both renamed tests appear green in the output.
   Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc92-sig-filter/sc92-r7-node-test.log`
4. **Tree/pins.** `git -C <wt> status --short` and `git -C <wt>/v2 status --short` both
   **empty**. Pins: v2 `b9a37c0bc49ac3f188d8b486d52ef1f080e26b21` (= v2 HEAD), steel-etl
   `c4e0526dd44fb8162a2949d58ceeb7f8e1632b71`.
5. **Hygiene.** No `co-authored-by|generated with|claude|anthropic` in `b9a37c0bc4`,
   `c7860d2`, `fa58205`; all authored `Scott Tomaszewski <scottTomaszewski@gmail.com>`.

### INFO-3 (new, cosmetic) — the move deletes one main-owned blank line
`CHANGELOG.md`. `c7860d2` is a move, but not a *pure* one: the removal hunk also drops the
blank line that separated SC-90's bullet from the SC-183 DSE bullet, which is main's content.
`git diff --numstat 9bc4ddf..HEAD -- CHANGELOG.md` is now **8 added / 1 deleted** — before the
move it was 7/0, a pure addition.

No rendering change: that list is already loose (several sibling bullets in the same run are
blank-separated, several are not), so CommonMark wraps every item in `<p>` either way. Flagged
only because the branch now touches a line it does not own, which a future rebase or a
CHANGELOG-conflict resolution could surface.

Prescribed fix (optional, owner's call): re-insert the single blank line between
`…slowed down" stay out of those lists.` and `- **DSE plugin: the initiative tracker …`, which
restores the branch's CHANGELOG diff against main to a pure addition. Not worth a round on its
own — fold it only if another CHANGELOG touch happens anyway.

**Tree left as found**: worktree clean at both levels before and after this recheck; nothing
written outside the ledger dir.
