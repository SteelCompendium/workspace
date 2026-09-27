# SC-272 round 2 (fix round) — report

## Executive summary

- **STATUS: DONE**
- DSE branch `sc272-rule-eyebrow`, head `5293604`, base `6c4f6aa` (== `origin/develop`; re-fetched, unchanged — no rebase needed).
- Fixed all three folded findings from `sc272-r1-review.md`: HIGH-1 (missing `negotiation`→"Negotiations", full `typeTitles` mirror), LOW-1 (foreign-family `scc:` segment leak), LOW-2 (trailing-dot `scc:` segment → empty eyebrow).
- All 5 new/changed test assertions fail against the round-1 code (`c296c24`), verified via `git stash`.
- jest: round-1 `4006 passed/1 skipped/207 of 208 suites` → round-2 `4026 passed/1 skipped/207 of 208 suites`, 0 failed (net +20).
- Gates: tsc clean; lint clean; shots 524 PNGs 0 FAIL; freeze `260/260`, 0 bytes moved; parity `0 GAPs / 0 undeclared / 16 DECLARED`, exit 0.
- Out of scope per the fold instructions: MEDIUM-1 (evidence PNGs — owner already mitigated, no worker action), the harness by-SCC gap (filed SC-362), no new evidence screenshots regenerated.

## Findings fixed

### HIGH-1 — full `typeTitles` mirror, `negotiation` → "Negotiations"

`src/elements/display/displayFamily.ts`'s `RULE_GROUP_TITLE_OVERRIDES` now mirrors steel-etl's whole `typeTitles` map (`build.go:1412-1435`) verbatim — 21 of its 22 entries. The one deliberate omission is `"rule": "Rules"` itself: on the site that entry only ever supplies the top-level `rule/` index page's own nav title (`dirToTitle("rule")`), never a per-tile group label — no real rule group segment can literally be `"rule"`. But every fallback path in `genericNoteAdapter` (no `scc:`, malformed `scc:`, a bare `rule` segment) hands `humanizeRuleGroup` the literal string `"rule"` on purpose, expecting the ticket's required singular `"Rule"` eyebrow. Including the entry verbatim would have silently turned every one of those fallbacks plural ("Rules") — a regression the review didn't call out but that a literal "copy all 22 verbatim" would have introduced. Documented in a code comment at the map's definition.

Tests (`test/dom/elements/ruleCard.test.ts`): the `rule.negotiation` test now expects `"Negotiations"` (was pinning the bug's own wrong value, `"Negotiation"`); the "non-overridden control" test was moved off `negotiation` (now a real override) onto `rule.dice` → `"Dice"`; a new `test.each` table pins all 16 real corpus rule groups (`character, combat, damage, dice, downtime, general, health, keyword, monster, negotiation, organization, resource, role, test, treasure, world`) against their site labels in one pass, per the review's "optionally add a table test" suggestion.

### LOW-1 — foreign-family `scc:` segment no longer leaks into the eyebrow

`src/services/typeAdapters.ts`'s `sccTypeSegment` now only accepts a segment matching `/^rule(\.[^.]+)+$/` (starts with `rule.`, one or more non-empty non-dot pieces) — a `type: rule` note carrying `scc: …/feature.trait.fury.level-1/x` or `…/kit/x` (adapter dispatch keys off the frontmatter `type:`, so `genericNoteAdapter` still claims it) now falls back to the bare frontmatter `type:` ("rule") instead of leaking `"feature.trait.fury.level-1"`/`"kit"` into `GenericNote.type` and rendering "Level 1"/"Kit". Tests: `test/unit/services/typeAdapters.test.ts`, a `test.each` over both cases from the review's probe table.

### LOW-2 — trailing-dot `scc:` segment no longer produces an empty eyebrow

The same regex rejects `"rule."` (a trailing dot with nothing after it) — `RULE_SCC_SEGMENT_RE` requires at least one non-dot character after each dot, so `sccTypeSegment` falls back to the bare frontmatter type instead of handing back `"rule."`, which used to make `split('.').pop()` return `""` and the eyebrow render empty rather than "Rule". Test: `test/unit/services/typeAdapters.test.ts`.

## Non-vacuity

`git stash` of only the two `src/` files (keeping all test changes) + `npx jest test/dom/elements/ruleCard.test.ts test/unit/services/typeAdapters.test.ts`: **5 failed, 31 passed, 36 total**. The 5 failures are exactly: the standalone `rule.negotiation` test, the `rule.negotiation` row of the new 16-group table (both HIGH-1), the two LOW-1 foreign-family cases (`feature.trait…` and `kit`), and the LOW-2 trailing-dot case. (The new `rule.dice` control test passes either way — "Dice" has no `typeTitles` override under old or new code — so it isn't part of this failing set; its job is only to be the correct non-overridden control going forward.) Restored with `git stash pop`, tree clean.

## Gates (measured at `5293604`)

| Gate | Round 1 (`c296c24`) | Round 2 (`5293604`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 4006 passed / 1 skipped / 207 of 208 suites / 3 snapshots | **4026 passed / 1 skipped / 207 of 208 suites / 3 snapshots, 0 failed** (net +20: +3 typeAdapters.test.ts, +1 dice control, +16 corpus-group table) |
| `npm run shots` | 524 PNGs, 0 FAIL | **unchanged — 524 PNGs, 0 FAIL**, exit 0 |
| `check-freeze.sh` | `260/260`, 0 moved | **unchanged — `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED | **unchanged — 0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 |

`obsidian-lifecycle` skipped (no lifecycle code touched, per both briefs). `obsidian-shots` not run (no Xvfb in this environment, unchanged from round 1). No rebase was needed — `origin/develop` is still `6c4f6aa`.

## Out of scope (per the fold instructions)

- **MEDIUM-1** (evidence PNGs are a jsdom-dump render, not a faithful plugin render): the owner already mitigated this by cropping to the card header and captioning the method; no worker action taken, no new screenshots regenerated.
- **The browser-shots-harness-has-no-compendium gap**: filed as Backlog SC-362 by the owner; out of scope for this ticket.
- **INFO items 1-6** from the review: confirmations only, no action needed.

## Artifacts

- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/sc272-r2-fix-report.md`
- jest (full suite, green): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r2-jest-full-20260924.log`
- shots: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r2-shots-20260924.log`
- parity: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc272-r2-parity-20260924.log`
- No `rebaseline.txt` — 0 frozen bytes moved. No new evidence screenshots (per fold instructions, owner has what it needs; round 1's four PNGs under `evidence/` are unchanged).
