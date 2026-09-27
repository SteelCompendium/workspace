# SC-272 round 3 — scoped re-review (rebased onto 1adfe29, head 9b51c10)

## Executive summary

- **Verdict: APPROVE**, with one LOW that can be fixed at landing time: the branch has no DSE `CHANGELOG.md` entry.
- **Findings:** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 3 INFO.
- **Release corpus (163 files):** every rule eyebrow is now singular. Monster 9, Treasure 5 and Negotiation 7 are all as expected. The other 13 groups are unchanged, and there is still exactly one suppressed eyebrow (`damage/damage`).
- **Fallbacks still work:** every fallback still gives "Rule". The rule-family check from round 2 (LOW-1/LOW-2) and SC-120's duplicate-title suppression are both unchanged.
- **Rebase:** clean. `range-diff` shows `=` for both earlier commits. `1adfe29` is `origin/develop`. `1adfe29..9b51c10` touches only the 5 SC-272 files.
- **Stale comments:** none found. No source or test comment still claims the plugin mirrors or matches the site's plurals.
- **Tests fail without the fix:** with the round-2 `displayFamily.ts` and the round-3 tests, 6 tests fail and 46 pass.
- **Full jest run at 9b51c10:** 4099 passed / 1 skipped / 211 of 212 suites / 3 snapshots, 0 failed. This matches the implementer.
- **`sidebarEncounterHandoff` flake:** not seen. Load average was 0.75.

## 1. Corpus probe

Run over release `v4.20260924115314` with the real adapter and the real eyebrow code. Per-file rows are in `review-r3/r3-probe-release.tsv`.

| Group | Eyebrow | Count |
|---|---|---|
| combat | Combat | 36 |
| keyword | Keyword | 17 |
| general | General | 14 |
| character | Character | 10 |
| dice | Dice | 10 |
| downtime | Downtime | 9 |
| monster | **Monster** | 9 |
| role | Role | 9 |
| resource | Resource | 8 |
| health | Health | 7 |
| negotiation | **Negotiation** | 7 |
| test | Test | 7 |
| organization | Organization | 6 |
| treasure | **Treasure** | 5 |
| damage | Damage | 4 |
| world | World | 4 |
| damage (`damage/damage`) | suppressed | 1 |

There are no "Rule" fallbacks, empty eyebrows or plurals anywhere in the corpus.

## 2. Fallback, rule-family check and duplicate suppression

Probes are in `review-r3/r3-edge.txt`.

**These still give "Rule":**
- no scc
- scc without a `/`
- `a//b`
- bare `rule`
- `rule.`
- `feature.trait.fury.level-1`
- `kit`
- `rule..x`
- `.rule.x`
- `rules.combat`
- `Rule.Combat`
- scc given as an array

**Accepted codes:**
- `scc.v1:`-prefixed code → Combat
- `rule.combat.hidden-cover` → Hidden Cover
- `rule.downtime.project` → Project (singular now)
- `rule.religion` → Religion

**Precedence:** a frontmatter `type: rule.dice` still wins over the scc, giving Dice.

**Suppression:** these are suppressed:
- a `negotiation` rule named "Negotiation"
- a `monster` rule named "Monster"
- the corpus rule `damage/damage`

A `monster` rule named "Monsters" now shows the eyebrow "Monster", because the name no longer matches the singular label. That is correct.

`src/services/typeAdapters.ts` is byte-identical to round 2: `git diff c4c89b6..9b51c10 -- src/services/` is empty.

## 3. Rebase

- `git range-diff 6c4f6aa..5293604 1adfe29..9b51c10` shows `c296c24 = 667f44d`, `5293604 = c4c89b6`, and one new commit, `9b51c10`.
- `1adfe29` is `origin/develop`. Everything between `6c4f6aa` and `1adfe29` is SC-230, SC-243 and SC-340 work already on develop.
- `git diff 1adfe29..9b51c10` touches only these files:
  - `displayFamily.ts`
  - `typeAdapters.ts`
  - `ruleCard.test.ts`
  - `displaySteelBatchC.test.ts`
  - `typeAdapters.test.ts`
- Nothing unexpected came in with the rebase.

## 4. Stale-comment sweep

I grepped all 5 files for `typeTitles`, `plural`, `byte-for-byte`, `mirror`, `site's`, `dirToTitle` and `Monsters`/`Treasures`/`Negotiations`.

- **`displayFamily.ts:110-133` and `:158-162`:** every hit describes the round-3 ruling correctly. The mentions of plurals are history plus the SC-369 pointer.
- **`typeAdapters.ts:185`:** says the group comes from the directory. That is still true.
- **`ruleCard.test.ts:148-150`:** "matching the site's own rule-tile label for this same fixture". This is still true for `combat`; see INFO-1.

## 5. Findings

- **LOW-1: no DSE `CHANGELOG.md` entry for SC-272.**
  - This is a user-facing change: the by-SCC rule eyebrow now shows the group instead of "Rule". It predates round 3; I missed it in r1 and r2.
  - Recent tickets on develop added a bullet under `## 7.0.0 (unreleased…)`: SC-230 (`1adfe29`), SC-243 (`0086444`) and SC-340 (`c3cbc7c`). The workspace routing table also treats this as part of done.
  - **Fix:** add a `[FIX]` bullet, for example: "Rule cards referenced from the compendium now show their rule group (Combat, Dice, Monster…) above the name instead of the generic "Rule" (SC-272)."
- **INFO-1:** `test/dom/elements/ruleCard.test.ts:148` still says "matching the site's own rule-tile label". It is accurate for this Combat fixture, but a reader could take it as a general claim. Optionally add "(the site pluralizes three groups; see SC-369)". This does not block.
- **INFO-2:** a whitespace-only segment (`rule. `) and a frontmatter `type: rule.` still give an empty eyebrow. Both were already noted in round 2, are contrived, and are unchanged.
- **INFO-3:** the evidence PNGs in `evidence/` show Combat, which is not affected by the singular ruling. No new evidence is needed.

## 6. Hygiene

- The DSE worktree is clean at `9b51c10` before and after.
- Probe test files were copied in and removed.
- `displayFamily.ts` was restored with `git checkout HEAD` after the revert check.
- I removed the ignored `main.js`, `styles.css` and `main.css` that jest wrote.
- I killed no processes.

## 7. Artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/`:

- `sc272-r3-rereview.md` (this file)
- `review-r3/r3-probe-release.tsv`
- `review-r3/r3-edge.txt`
- `review-r3/r3-revert-r2.log`
- `review-r3/r3-jest-full-9b51c10-1790514208.log`
