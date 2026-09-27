# SC-272 round 3 — report

## Executive summary

- **STATUS: DONE**
- DSE branch `sc272-rule-eyebrow`, head `9b51c10`, base `1adfe29` (== `origin/develop`, re-fetched right before rebasing — SC-230 landed on top of the prior base, no other change needed rebase resolution).
- Implemented Scott's ruling (decisions.md 2026-09-25): rule-group eyebrows are now plain **singular** title-casing for every group; `RULE_GROUP_TITLE_OVERRIDES` (the site's `typeTitles` plural mirror) is removed entirely, not replaced with a singular map — every one of the 16 real corpus groups is already correctly singular under plain title-casing.
- steel-etl ticket to reconsider the site's own pluralization: **SC-369** (filed by the owner, out of scope here, not touched).
- 6 test assertions changed (monster/treasure/negotiation standalone + their 3 table rows); all 6 fail against the round-2 code (verified via `git stash`).
- Gates at `9b51c10`: tsc clean, lint clean; jest baseline (`1adfe29`) 4070 total (4069 passed + 1 known pre-existing flake, unrelated file, confirmed non-deterministic in isolation) → branch **4099 passed / 1 skipped / 211 of 212 suites, 0 failed** (reproduced clean twice); obsidian-lifecycle `19/19 ok, 0 failed`, exit 0; shots 524 PNGs, 0 FAIL; freeze `260/260`, 0 bytes moved; parity `0 GAPs / 0 undeclared / 16 DECLARED`, exit 0.
- No `rebaseline.txt` needed — 0 frozen bytes moved.

## 1. Rebase

`git fetch origin` in the DSE clone: `origin/develop` moved `6c4f6aa` → `1adfe29` (SC-230, modal text-scale — unrelated to SC-272). `git rebase origin/develop` succeeded cleanly (no conflicts); the two prior commits got new SHAs (`c296c24`→`667f44d`, `5293604`→`c4c89b6`). `package.json`/`package-lock.json` unchanged in the rebase range (`git diff 6c4f6aa..1adfe29 -- package.json package-lock.json` empty) — `npm ci` not needed.

## 2. Implementation

Scott's ruling, quoted verbatim from `decisions.md` (2026-09-25): *"I think it should be singular. Go ahead and make that change and file the ticket for steel-etl."* The steel-etl ticket asking to reconsider the site's own rule-tile pluralization is **SC-369** — filed by the owner, explicitly out of scope for this worktree, not touched.

Survey (per the task's "unless the survey shows a corpus group whose plain humanization would be wrong"): all 16 real corpus rule-group segments (`character, combat, damage, dice, downtime, general, health, keyword, monster, negotiation, organization, resource, role, test, treasure, world`) are single words with no hyphens, and plain `titleCase` already produces the correct singular for every one of them (`Character`, `Combat`, …, `Monster`, `Negotiation`, `Treasure`, …). No group's plain humanization is wrong — so `RULE_GROUP_TITLE_OVERRIDES` is removed entirely rather than kept as a map of singulars, per the task's preferred option. `humanizeRuleGroup` (`src/elements/display/displayFamily.ts`) is now a thin, documented one-line alias for `titleCase`, kept as a named function so the round 1→3 history stays attached to its one call site rather than being lost by inlining `titleCase` directly into the eyebrow.

Comments updated: the block above `humanizeRuleGroup` now states the plugin uses Scott's singular ruling, not the site's `typeTitles` map, and points to SC-369 for the site's own tracking; the eyebrow's own inline comment (in `genericLayout.steel`) was updated the same way. The LOW-1/LOW-2 `RULE_SCC_SEGMENT_RE` gate in `src/services/typeAdapters.ts` (round 2) and SC-120's duplicate-title suppression logic in the eyebrow are both untouched — neither depends on the override map.

## 3. Tests

`test/dom/elements/ruleCard.test.ts`'s `describe` block (previously "…matches the site's dirToTitle, including its plural overrides") is rewritten to "…is plain singular title-casing (Scott's ruling, round 3 — steel-etl SC-369 tracks the site's own plural)": the three standalone group tests (`rule.monster`, `rule.treasure`, `rule.negotiation`) now expect the singular (`"Monster"`, `"Treasure"`, `"Negotiation"`); the `rule.dice` control test is unchanged (dice was never plural either way); the 16-row `test.each` corpus table has its `monster`/`negotiation`/`treasure` rows flipped to singular, the other 13 rows unchanged. Fallback ("Rule"), the LOW-1/LOW-2 rule-family gate tests (`test/unit/services/typeAdapters.test.ts`), and SC-120's duplicate-title suppression tests are all untouched — none of them exercised the override map.

**Non-vacuity:** `git stash` of only `src/elements/display/displayFamily.ts` (test changes kept) + `npx jest test/dom/elements/ruleCard.test.ts`: **6 failed, 22 passed, 28 total** — the three standalone group tests and the three corresponding table rows (`monster`, `treasure`, `negotiation`), each received the round-2 plural instead of the expected singular. Restored with `git stash pop`, tree clean.

## 4. Gates (measured at `9b51c10`, base `1adfe29`)

| Gate | Baseline (`1adfe29`) | Branch (`9b51c10`) |
|---|---|---|
| `npm run tsc` | — | clean |
| `npm run lint` | — | clean, exit 0 |
| `npx jest` | 4070 total (4069 passed + **1 known pre-existing flake**, see below) / 1 skipped / 210 of 211 suites | **4099 passed / 1 skipped / 211 of 212 suites / 3 snapshots, 0 failed** (reproduced clean twice, +29 net vs. the true baseline: this branch's own 3 rounds of new/changed tests) |
| `npm run obsidian-lifecycle` | not measured separately (unrelated to this change) | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 |
| `npm run shots` | — | **524 PNGs, 0 FAIL**, exit 0 |
| `check-freeze.sh` | — | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 — 0 frozen bytes moved |
| `npm run parity` | — | **16 DECLARED, 0 GAPs, exit 0** |

**Baseline flake, not a regression:** measuring the jest baseline at `1adfe29` (detached checkout, tree verified identical to that commit — confirmed the round-1-added `test/unit/services/typeAdapters.test.ts` does not exist there and is not present on disk during the measurement) hit one failure both times it was run as part of the full suite: `test/dom/framework/sidebarEncounterHandoff.test.ts` › "the encounter block persists the id it minted (durable across a reload)" (`Expected: true, Received: false`). This file is untouched by SC-272 (sidebar/encounter handoff, unrelated to the rule-card eyebrow). Re-run 5 more times in isolation (once via the whole file, 3 more times via `-t` filter): passed 4/5, failed 1/5 — confirmed non-deterministic under this host's current load (`/proc/loadavg` around 9-15 on 12 cores while measuring, consistent with the skill doc's documented "several agents running batteries concurrently" load-sensitivity pattern, though this specific test isn't one of the two the skill names). Not fixed here (out of scope, pre-existing, unrelated file) — flagged as a follow-up below. The branch's own full-suite run was reproduced clean (0 failed) twice in a row.

Xvfb note: despite no system `Xvfb`/`xvfb-run` binary being found by `command -v`, `npm run obsidian-lifecycle` ran successfully end-to-end (own private Xvfb `:160`, CDP port 9262) — the npm script evidently provisions its own, so no environment-exit-2 to report.

## 5. Follow-ups

1. **`test/dom/framework/sidebarEncounterHandoff.test.ts`'s "persists the id it minted (durable across a reload)" test is flaky** on this host under load (~9-15 1-min load average on 12 cores while measuring) — passed 4 of 5 isolated re-runs, failed on both full-suite runs at the `1adfe29` baseline. Pre-existing, unrelated to SC-272 (never touches sidebar/encounter handoff code); worth the ticket-owner's attention as a standalone flake report if it recurs elsewhere.

## 6. Artifacts

- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/sc272-r3-report.md`
- Lifecycle log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r3-lifecycle-20260927.log`
- jest branch logs (both clean): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r3-jest-branch-20260927.log`, `.../sc272-r3-jest-branch-rerun-20260927.log`
- jest baseline logs (both hit the flake): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r3-jest-baseline-20260927.log`, `.../sc272-r3-jest-baseline-rerun-20260927.log`
- shots log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r3-shots-20260927.log`
- parity log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r3-parity-20260927.log`
- No `rebaseline.txt` — 0 frozen bytes moved.
