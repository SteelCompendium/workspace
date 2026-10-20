# SC-364 decisions ledger

Ticket: SC-364 — Delete dead `resolveCollapsePrefs` and the ComponentWrapper `declaredCollapsePrefs` side channel (no callers after SC-255).
Worktree: /home/scott/code/steelCompendium/worktrees/sc364-dead-collapse-prefs (branch sc364-dead-collapse-prefs; dse base develop @ 71ac43a)
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05

## Scope (ticket description, verbatim — no Scott comments on the thread as of 2026-10-20)

> **What:** `resolveCollapsePrefs` (`src/prefs/catalog.ts` ~line 740) has no production callers once SC-255 lands. `ds-skills` was the last one; `ds-stamina` stopped using it in SC-169. The helper's only input is the `declaredCollapsePrefs` WeakMap side channel in `src/model/ComponentWrapper.ts` (~lines 47-59 and 92), and nothing else reads that channel. Chrome decides whether a collapse key was declared from the raw keys instead (`collapsedKey.ts` `extractCollapseKeys`).
>
> **Why it matters:** someone may later fix collapse-pref behaviour inside `resolveCollapsePrefs`, and nothing would change at runtime.
>
> **Work:** delete the helper and the side channel. Then update the stale references: `.repo-docs/architecture.md` (~line 396), `test/dom/framework/kit-lifecycle.test.ts:58-61`, `test/dom/elements/stamina-bar.test.ts:67-70` and `test/dom/framework/pref-overrides.test.ts:7,428`.
>
> **Why this isn't part of SC-255:** it touches the ComponentWrapper model, which every element parses through. That is outside SC-255's skills-only scope.

## Scott rulings

(none yet)

## Owner rulings

- 2026-10-20: Pure dead-code deletion. Expected: built `main.js` changes (code removed) but rendering is unchanged, so shots/freeze/parity must be byte-identical (freeze 276/276, no rebaseline). jest count drops only by tests that exercised the deleted helper/channel directly; any such deletion must be itemised.

- 2026-10-20 (r1 follow-ups): (a) fresh-worktree jest reads 5256/2 skipped until `npm run shots` caches `visual-harness/dist/obsidian-app.css` (printTwinDeltaAllowedSet skips); (b) dse-verify SKILL.md line ~268 still quotes button host-leak 114 kinds / 684, current is 112 / 672 (already recorded in a later CURRENT/PREVIOUS entry). Ruling: no ticket — both are dse-verify skill-doc nits, workspace bookkeeping the dispatcher may make; relayed in the land-ready report. Nothing on the dse branch.

- 2026-10-20 (r2 review findings, verdict FIX-ROUND, 0 CRIT/HIGH/MED; pure deletion proven by 180-case base/head probe, byte-identical): L1 (stale "precedent" comments citing the deleted WeakMap in seams/theme.ts:145, seams/prefs.ts:300-301) -> FOLD. L2 (makeDeps comments in kit-lifecycle/stamina-bar/skills tests misdescribe the mechanism; real one is pipeline.ts readCollapsePref fallback) -> FOLD. I1 (AMENDMENT test titles in pref-overrides.test.ts) -> DROP: historical titles, harmless, renaming churns test names. I2 (collapsedKey.ts:39-41 and pipeline.ts:434-436 still say ds-skills has no chrome, stale since SC-255) -> FOLD: comment-only, same collapse area, cheaper than a ticket.

- 2026-10-20 (r4 re-review, comment-only proven: main.js sha256 identical a22300d vs 7ff6068): R4-L1 ("chrome-bearing since SC-255" is wrong; skills got chrome in SC-169 r3 c15a4b4) -> FOLD. R4-L2 ("~30 elements that have not opted in" stale; 20/22 declare chrome) -> FOLD. R4-I1 (short reflowed line prefs.ts:301) -> DROP: cosmetic.

## Rounds

| Round | Worker | Report |
|---|---|---|
| r1 impl | implementer (Sonnet) | sc364-r1-impl-report.md |
| r1 result | implementer | a22300d, all gates at baseline, 0 tests deleted |
| r2 review | reviewer (Opus) | sc364-r2-review-report.md |
| r2 result | reviewer | FIX-ROUND: LOW L1, L2; INFO I1 (drop), I2 (fold) |
| r3 fix | implementer (resume) | sc364-r3-fix-report.md |
| r3 result | implementer | 7ff6068 comment-only (+ drive-by registry.ts:151); tsc/lint/jest 5257/1/229 of 230 |
| r4 scoped re-review | reviewer (resume, not author) | sc364-r4-rereview-report.md |
| r4 result | reviewer | FIX-ROUND: LOW R4-L1, R4-L2 (fold); R4-I1 drop |
| r5 fix | implementer (resume) | sc364-r5-fix-report.md |
| r5 result | implementer | 188755b comment-only; tsc/lint/jest 5257/1/229 of 230 |
| r6 scoped re-review | reviewer (resume) | sc364-r6-rereview-report.md |
| r6 result | reviewer | LAND-READY at 188755b, 0 findings; main.js 42f1445c identical a22300d/7ff6068/188755b |
- 2026-10-20: LAND-READY at dse 188755b; land-ready comment posted; reported to dispatcher.
