# SC-272 round 2 — scoped re-review (delta c296c24..5293604)

## Executive summary

- **Verdict: APPROVE.** All three round-1 findings are fixed: HIGH-1, LOW-1 and LOW-2.
- **Findings: 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 4 INFO.** None of the INFO items blocks landing.
- **HIGH-1:** the new map matches steel-etl `build.go:1412-1435` entry for entry, 21 of 22 by mechanical diff. The one difference is `rule=Rules`, left out on purpose, and leaving it out is correct.
- **Release corpus (163 files):** all 16 groups now match the site tile labels, including Negotiations (7). One eyebrow is suppressed as intended: `damage/damage`.
- **LOW-1/LOW-2:** the `/^rule(\.[^.]+)+$/` check rejects `kit`, `feature.trait…`, `rule.`, `rule..x`, `.rule.x`, `rules.combat` and bare `rule`. A multi-level `rule.x.y` uses its last segment, as the site does, for example `rule.combat.hidden-cover` → "Hidden Cover".
- **Tests are non-vacuous:** new tests on the round-1 `src` give 5 failed / 47 passed. On the base `src` they give 9 failed / 43 passed.
- **jest (full, at 5293604):** 4026 passed / 1 skipped / 207 of 208 suites / 3 snapshots, 0 failed. This matches the implementer.
- **Skipped:** shots, freeze and parity. The delta changes only TS strings and a regex on the rule by-SCC path, which the browser harness cannot reach (the round-1 finding), and it touches no CSS. The implementer's re-run reports those gates unchanged: 524 shots / 0 FAIL, freeze 260/260, parity 0/0/16.

## 1. HIGH-1 — map parity

- **Method:** I extracted both maps mechanically and diffed them (`review-r2/go-map.txt` against `review-r2/ts-map.txt`).
  - Go: 22 entries. TS: 21 entries.
  - The only diff line is `< rule=Rules`.
  - All values are verbatim, including `religion=Gods & Religion` and `project=Downtime Projects`.
- **steel-etl version:** the worktree's steel-etl is `88aec3b`, and so are workspace steel-etl and `origin/main`. The map has not moved.
- **Why omitting `rule` is correct:**
  - On the site, `rule` only ever names the top-level `rule/` directory. No rule tile sits directly in `rule/`: every corpus file is in `rule/<group>/`.
  - Every fallback deliberately passes the literal `"rule"` to `humanizeRuleGroup`: no scc, malformed scc, non-rule scc, trailing dot, and bare `rule`.
  - A mutation run confirms it. Adding `rule: 'Rules'` makes one existing test fail: `ruleCard.test.ts` › "case-insensitive: a resolved file literally named "rule"…" (`review-r2/r2-mut-rules.log`).
- **Release corpus probe:** `v4.20260924115314` run through the real adapter and the real eyebrow.

| Label | Count | Label | Count |
|---|---|---|---|
| Combat | 36 | Resource | 8 |
| Keyword | 17 | Health | 7 |
| General | 14 | **Negotiations** | **7** |
| Character | 10 | Test | 7 |
| Dice | 10 | Organization | 6 |
| Downtime | 9 | Treasures | 5 |
| Monsters | 9 | Damage | 4 |
| Role | 9 | World | 4 |
| suppressed | 1 | | |

  Checking each group against `v2/docs/Browse/rule/<group>/index.md` gives **16/16 OK**. No corpus rule is named the singular form of a pluralized group, so nothing renders as "MONSTERS / Monster".

## 2. LOW-1 / LOW-2 — the rule check (`src/services/typeAdapters.ts:177`, `:194`)

Fallback probes, run through the real adapter and eyebrow (`review-r2/r2-edge.txt`):

- **Fall back to "Rule":**
  - no scc
  - an scc without `/`
  - `a//b`
  - bare `rule`
  - `rule.`
  - `feature.trait.fury.level-1`
  - `kit`
  - `rule..x`
  - `.rule.x`
  - `rules.combat`
  - `Rule.Combat` (upper case; SCC codes are lower-case by spec)
  - an array value
- **Accepted:**
  - `scc.v1:`-prefixed codes → Combat
  - `rule.combat.hidden-cover` → Hidden Cover
  - `rule.downtime.project` → Downtime Projects (the site's `dirToTitle` on a `project` leaf gives the same)
  - `rule.religion` → Gods & Religion (the site gives the same)
- **Precedence:** a frontmatter `type: rule.dice` still beats the scc.
- **Duplicate suppression:** still works. `monster` with the name "Monsters" is suppressed.

## 3. Non-vacuity

| `src` state | Tests | Failures | Log |
|---|---|---|---|
| round 1 (`c296c24`) | 5 failed / 47 passed | 2 foreign-family cases, 1 trailing dot, 2 negotiation | `review-r2/r2-revert-c296.log` |
| base (`6c4f6aa`) | 9 failed / 43 passed | adds the original Combat pins plus monster/treasure/negotiation | `review-r2/r2-revert-base.log` |

Both runs kept the round-2 tests. The `rule.dice` control passes under every `src` version, which is expected: it is a control, not a regression pin.

## 4. INFO

1. **The `rule` omission is only guarded indirectly.** The one test that catches it uses a rule named "rule". If someone later mirrors `typeTitles` "fully" and adds `rule: 'Rules'`, that single test fails. An optional hardening is a direct pin, e.g. `{name:'Flanking', type:'rule'}` → `'Rule'`.
2. **A whitespace-only segment gives an empty eyebrow.** `scc: …/rule. /x` passes the check (`[^.]+` allows a space), and the eyebrow comes out as `""`. The site's `dirToTitle(" ")` would also give `""`. This input is extremely contrived and no action is needed. Tightening the pattern to `[^.\s]+` would cover it if wanted.
3. **A `rule.` frontmatter type still gives an empty eyebrow.** A frontmatter `type: rule.` renders `""`. This was already true at the base and is outside SC-272's scope. It is unchanged.
4. **`rule.x.rule` renders "Rule".** A multi-level segment whose leaf is `rule` shows "Rule", while the site would show "Rules" for a directory named `rule`. This is theoretical: no corpus group is named like that.

## 5. Hygiene

- The DSE worktree is clean at `5293604`, both before and after.
- My probe test files were copied in, run, and deleted.
- `src` was restored with `git checkout HEAD` after each revert and mutation run.
- I deleted the ignored `main.js`, `styles.css` and `main.css` that jest wrote.
- No processes were started in the background or killed.

## 6. Artifacts

All paths are under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/`.

- `sc272-r2-rereview.md` (this file)
- `review-r2/go-map.txt`, `review-r2/ts-map.txt` (map parity)
- `review-r2/r2-probe-release.tsv` (per-file corpus tabulation)
- `review-r2/r2-edge.txt`, `review-r2/zzSc272Edge-r2.test.ts` (fallback probes and their source)
- `review-r2/r2-revert-c296.log`, `review-r2/r2-revert-base.log`, `review-r2/r2-mut-rules.log`
- `review-r2/r2-jest-full-5293604.log`
