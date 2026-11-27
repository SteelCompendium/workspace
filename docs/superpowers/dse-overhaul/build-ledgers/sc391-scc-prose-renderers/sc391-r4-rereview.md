# SC-391 R4: scoped re-review of the fix delta `9eb5ffa3..44bab481`

## Executive summary
- **Verdict: LAND.** All three R2 LOWs are fixed. 0 new BLOCKER / HIGH / MEDIUM / LOW; 2 INFO (no action needed).
- origin/develop is still at `4b233886` (fetched), so no rebase is needed. The R3 worktree was clean at `44bab481` before and after this review.
- **styles.css:** a rule-level diff against my clean `4b233886` production build shows **exactly one added rule**, the prose-scoped zero-band rule. Nothing else changed: 451243 bytes before, 451412 after, sha `50436d6b…` (it was `a4dfc387…`).
- **Shots:** I compared all 636 PNGs byte for byte against a fresh shots run at `9eb5ffa3`. **Only 2 changed**: `prose-chapter-empty--steel-{dark,light}.png`. All other prose shots, all rule shots and every print or realprint twin are byte-identical.
- **New test is not vacuous:** with the CSS rule reverted in a throwaway copy, `proseCard.test.ts` goes from 29/29 to 1 failed. It pins the rule text, not the computed style (jsdom has no stylesheet); the shots are the behavioural evidence.
- **Gates (my runs):**
  - tsc, `tsc -p e2e` and lint: clean.
  - jest: **14806 / 1 skipped**, one more than R2.
  - e2e: **`845/854 ok, 0 failed, 9 known-bug, coverage: 487/487 pairs`**.
  - shots: **636**, every host-leak sweep OK, capture clip OK.
  - freeze **280/280** · parity **0 / 0 / 24**.
- Lifecycle not run: the delta touches no TS outside comments, no `RefUnwrapView` and no registry.

## Checks
1. **LOW-1 (counts and comment): fixed.**
   - Every location I flagged now says twelve or 12: `AGENTS.md:69` and `:74` (the alias list gains `ds-prose`), `.repo-docs/integration.md:129`, `.repo-docs/architecture.md:192` (lists `prose`), and `src/elements/display/index.ts:173`.
   - `src/elements/project/view.ts:95-97` now reads "The `project` type resolves to the internal prose family (SC-391), whose model is a `GenericNote`; this reads the body directly…". That is true: `resolveGoal` uses `entity.body()`.
   - `integration.md:64` (dated SC-149 history, "eleven") is deliberately left as history. That is correct.
2. **LOW-2 (empty strip): fixed, and the rule is tightly scoped.**
   - The only rule added is `[data-dse-theme=steel]:not([data-dse-print=on])[data-dse-element=prose] .dse-card:not(:has(>.dse-card__band))>.dse-head{margin-bottom:0;padding-bottom:0;border-bottom:0}`. It is screen-only and prose-only.
   - It hits only zero-band prose cards: of 636 shots, exactly the 2 empty-chapter screen shots changed. The normal prose shots (skill, skill-group, monster, saint, god, chapter, project, movement, negotiation, inline default) and all `rule-*` shots are byte-identical.
   - I viewed the regenerated dark and light shots. There is no divider and no empty strip; the card ends just below the crest point with the normal card inset. Dark: light-grey title on charcoal. Light: near-black title on pale grey.
   - Putting `[data-dse-theme]` and `[data-dse-element]` on one compound selector has precedent (`styles-source.css:3423-3424`, montage and negotiation).
   - The first `.dse-card__band` is created synchronously right after the head (`CardLayout.ts:593-596`), so a card with a body never matches the zero-band selector, not even briefly.
   - **Print twin:** it still shows the head underline, because `:not([data-dse-print=on])` excludes print. `prose-chapter-empty--steel-print.png` is byte-identical to `9eb5ffa3` and shows "Chapter / The Summoner Class" with a single rule under it and no padded strip. That reads as a normal titled heading on paper, so I don't think it matters. It also keeps the project's screen-only convention, and these print twins are not in the frozen 280.
   - **Host-leak sweeps:** all pass (chrome, button, modal button, input, table, list, inline, checkbox, prose); capture clip OK.
   - **`:has` support:** `styles-source.css` already uses `:has(` 66 times. e2e runs Obsidian 1.14.4 on Chrome 150. `manifest.json` has `minAppVersion` 1.13.0, which runs on Chromium well past `:has` support (105+). On a client without `:has`, the whole selector is dropped and the card falls back to the old strip, with no breakage.
3. **LOW-3: fixed.** The comment at `src/elements/display/prose.ts:66-73` now names the limits: it is a blank-line splitter, so a setext heading, a fence with a blank line, or a paragraph that opens with inline HTML is not recognised. That is accurate. No logic changed.
4. **New test reverted:** control run 29 passed; with `styles-source.css` taken from `9eb5ffa3`, 1 failed: "SC-391 chapters render compact › a zero-band prose card has no body element and it has no band; the CSS drops the head divider for exactly that shape". The test's DOM half (zero-band card has no band; a skill card has `> .dse-card__band`) is what makes the selector's `:not(:has(...))` split meaningful.

## Findings
- **INFO-1:** the pin is on the CSS text, not the computed style. Any rewording of the selector, even an equivalent one, fails the test. That is acceptable for a one-rule pin, and the shots are the behavioural evidence.
- **INFO-2:** some older comments still carry stale counts. These predate SC-391 and I did not flag them in R2: `src/elements/shared/CardLayout.ts:39` and `:179` ("Absent (10 of the 11 display families)", "`kitLayout.steel` only, so far") and `src/elements/shared/withReference.ts:72` ("eleven inner consts"). They are historical rationale and need no action for SC-391.

## Gates (measured at `44bab481`)

| Gate | Result | R3 reported |
|---|---|---|
| tsc and `tsc -p e2e` | rc 0 | clean |
| lint | rc 0 | clean |
| jest | 14806 passed / 1 skipped (shots cache present) | 14806 / 1 |
| e2e (full) | `845/854 ok, 0 failed, 9 known-bug, coverage: 487/487 pairs`, rc 0 | ids only |
| shots | 636, rc 0 | 636 |
| freeze | `280/280`, rc 0 | 280/280 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared`, rc 0 | 0/0/24 |
| styles.css | `50436d6ba738d5cf7411181f3305c861e321abed761e7168206b0d4c50e37e98` | same |

I made three throwaway worktrees, used them and removed them: `prev` at `9eb5ffa3` (fresh shots), `base` at `4b233886` (clean production build, sha `a4dfc387…`, which matches R2) and `head` at `44bab481` (revert test). The main checkout's dirt is unchanged (Scott's vault files plus the `draw-steel-elements` pointer).

## Artifacts
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r4-rev-k2p7/`:
- Gate logs (the `r2-` prefix is inherited from the reused scripts): `r2-tsc.log`, `r2-tsce2e.log`, `r2-lint.log`, `r2-jest.log`, `r2-e2e.log`, `r2-shots.log`, `r2-freeze.log`, `r2-parity.log`, `r2-styles-sha.log`
- CSS diff: `basebuild.log`, `styles-rule-diff.txt`, `base-rules.txt`, `head-rules.txt`
- Shot comparison: `shot-compare.txt`, `prev-shots.log`, `prev-shots-kept/prose-chapter-empty--steel-*.png` (the `9eb5ffa3` versions)
- Revert test: `t2-revert.sh`, `rev-control.log`, `rev-nocss.log`
