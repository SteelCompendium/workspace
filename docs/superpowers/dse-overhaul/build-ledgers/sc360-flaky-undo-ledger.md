# SC-360 decisions ledger — flaky sidebar jest tests under host load

Ticket: SC-360 (Backlog -> picked up 2026-10-19). Owner: ticket-owner (Opus 5.5).
Worktree: /home/scott/code/steelCompendium/worktrees/sc360-flaky-undo (branch sc360-flaky-undo in every submodule)
Base: draw-steel-elements origin/develop @ c616e22 (jest baseline 4849 passed / 1 skipped / 228 of 229 suites)

## Scope (from the ticket description, 2026-09-24 — no Scott comments on the thread as of 2026-10-19)

> This is probably a timing assumption in the test that breaks when the machine is busy. A flaky gate costs every agent a re-run and can hide a real failure. The fix is to find the timing dependency and make the test deterministic, for example with fake timers or by awaiting the real event.

> A second sidebar test failed the same way later that day: `sidebarEncounterHandoff.test.ts:416`, on a full run at load average about 8. It passed on the re-run, and the change being tested was comment-only. Look at both tests together; they may share a timing helper.

Failing assertion 1: `sidebarInitiative.test.ts:350` (SC-288 r2 undo case) received `"true"`.
Failing assertion 2: `sidebarEncounterHandoff.test.ts:416`.
(Line numbers are as of 2026-09-24; they may have drifted.)

## Scott rulings

(none yet)

## Owner rulings

- ~~2026-10-19: test-only fix preferred. If root cause turns out to be a real production race (not a test timing assumption), the worker stops and reports (NEEDS_CONTEXT) before changing src/.~~ superseded by the r1 ruling below.
- 2026-10-19 (r1 ruling, after sc360-r1-impl-report.md): root cause of the sidebarInitiative undo flake is a PRODUCTION bug, not load: `generateAnchorId()` (src/framework/sidebar/anchor.ts ~34) mints random 6-hex ids, ~3% of which YAML reads as numbers (`056948`, `092e50`, `000000`); the first sidebar write round-trips parseYaml/stringifyYaml and rewrites the anchor, so `findAnchoredBlock` loses the block ("Backing block not found"). RULING: Option A — fix it in `src/` so a newly minted id can never parse as a non-string YAML scalar; add a pinned-id regression test that fails first at base. Option B (pin Math.random in the test) REJECTED — it hides a user-facing bug. Stays in SC-360 (no separate ticket); the fix IS the flake fix. sidebarEncounterHandoff: already fixed upstream by d31978d + 0e7d6c5 (2026-10-02); no further change unless the worker finds a remaining real-time race.
- 2026-10-19 (r1 ruling): already-damaged notes (anchor rewritten to a number by an earlier write) — worker to INVESTIGATE and REPORT what a user sees and whether it self-heals; owner rules on any recovery work after seeing it. Do not implement matcher-side normalization in r1 without that ruling.
- 2026-10-19 (owner): SC-383 (Backlog, "Deferred from 7.0.0") is the same bug; linked as related. SC-360's fix covers it — at land-ready, tell the dispatcher SC-383 can close as fixed by SC-360 (Scott's call on the 7.0.0 deferral label; develop is not a release).
- 2026-10-19 (coordination): SC-453 owner, relayed by dispatcher, verbatim: "SC-453 and SC-360 can land in either order, and neither needs to depend on the other. My G-S10 `Math.random` stub is harmless once SC-360's id fix lands. I'm now making G-S10 assert only that the stamped id is a YAML string, not the exact `abcdef` value, so SC-360's id rule can't break it." -> no dependency; either landing order.
- 2026-10-19: session crash mid-r1; implementer resumed at b1f15d9 (5bc8b96 red-first tests, b1f15d9 fix+changelog) to finish investigation, battery, stress, report.
- 2026-10-19 (owner, r1b rulings after sc360-r1-impl-report.md DONE @ 8c39741):
  - ACCEPT scope addition: encounter builder (`src/elements/encounter/view.ts:541`) now uses the shared generator (1fddb73 + 8c39741) — same ~3% defect via unquoted `_dse_from`.
  - Already-damaged notes: FOLD option (a) — widen the anchor regexes so `readAnchor`/`ensureAnchor` accept any scalar token, so a re-pin reuses a rewritten id (`9.2e+51`, `.inf`, `56948`) instead of appending a duplicate `_dse_anchor:` key ("Map keys must be unique"). DROP option (b) (auto re-attach): the sidebar is unreleased (no dse tag contains src/framework/sidebar/anchor.ts; it ships first in 7.0.0), so damaged notes exist only in beta vaults, and after (a) a re-pin repairs them. DROP option (c) (vault scan).
  - CHANGELOG bullet: replace "A note that was already affected is not repaired by this fix" with the re-pin repair statement once (a) lands.
  - ~~DROP quote-at-stamp defence in depth: generator now covers every minting path; the reader already accepts quoted ids.~~ superseded for `_dse_from` by the r2 rulings below (old pre-fix ids persist in encounter blocks).
  - DROP hand-typed numeric `_dse_anchor` follow-up: after (a) the rewritten value is readable and re-pin reuses it.
  - Cold-compile 5s timeout in the first sidebarInitiative test at load 40+: not a ticket; same class as dse-verify's "Load-sensitive jest suites" — dispatcher may add the suite name to that note.
- 2026-10-19 (dispatcher): dse origin/develop moved c616e22 -> 6bcf9c8 (SC-453 landed: CRLF notes, lifecycle G-S10). Land-ready MUST be on 6bcf9c8. New baselines: jest 4908 passed / 1 skipped / 229 of 230 suites · lifecycle 26/26 · e2e 68/76 ok, 0 failed, 8 known-bug, coverage 51/51 pairs · shots 572 + pressed-toggle parity line · freeze 276/276 · parity 0/0/24 DECLARED. Expected rebase conflicts: src/elements/encounter/view.ts:20-21 (adjacent imports) and CHANGELOG.md (adjacent bullets) — keep both sides.
- 2026-10-19 (owner): r1 DONE @ 0a8ac82 (6bcf9c8 + 8 commits). Follow-up "G-S10 Math.random pin now unnecessary" — DROP: harmless (SC-453 owner made G-S10 assert only YAML-string-ness), and a pinned id keeps that lifecycle scenario deterministic. Extra jest skip explained as environmental (printTwinDeltaAllowedSet LOW-C needs git-ignored visual-harness/dist/obsidian-app.css from `npm run shots`).
- 2026-10-19: r2 independent review dispatched (orchestration:reviewer) on 0a8ac82. Author of r1: implementer a9e9e7f (must not review).
- 2026-10-19 (owner, r2 rulings on sc360-r2-review-report.md — FIX-THEN-LAND, 0 HIGH / 1 MED / 3 LOW / 3 INFO):
  - MEDIUM-1 FOLD: encounters still carrying a pre-fix id keep appending duplicate trackers; fix = `ensureEncounterAnchor` returns `String(existing)`, and `view.ts:451` writes `_dse_from` quoted (JSON.stringify). Red-first tests for both shapes.
  - LOW-1 FOLD: `ensureAnchor` checks the parsed YAML for an existing `_dse_anchor` key before appending (covers next-line values from the `\s*`->`[ \t]*` change and the hand-edited forms that already duplicated at base).
  - LOW-2 FOLD: CHANGELOG says an old number-like id breaks the panel once on its first save after upgrading, and one re-link fixes it permanently.
  - LOW-3 FOLD: CHANGELOG mentions the encounter "second tracker on re-open" fix.
  - INFO-1/2/3: no action.
  - Fix round -> implementer a9e9e7f (author). Scoped re-review of the delta -> reviewer a26a33e (did not author code).
- 2026-10-19 (dispatcher): dse origin/develop moved 6bcf9c8 -> d58cf6a (SC-427 landed: StaminaEditModal / MinionStaminaPoolModal clamping + Apply label). Land-ready MUST be on d58cf6a. Baselines: jest 4950 passed / 1 skipped / 229 of 230 suites · lifecycle 26/26 · e2e 71/76 ok, 0 failed, 5 known-bug, coverage 51/51 pairs · shots 572 + pressed-toggle line · freeze 276/276 · parity 0/0/24 DECLARED.
- 2026-10-19: r3 fix round DONE @ 6ab681a (d58cf6a + 11). LOW-1 resolved as REFUSE (no stamp, one Notice) when the parsed YAML already has `_dse_anchor` or does not parse — owner accepts pending scoped re-review. Scoped re-review (delta 0a8ac82..6ab681a, rebased) -> reviewer a26a33e.
- 2026-10-20 (owner, r4 rulings on sc360-r4-rereview-report.md — FIX-THEN-LAND, 0 HIGH / 1 MED / 2 LOW / 2 INFO; r2 findings all confirmed fixed; stress 34/34):
  - MEDIUM-A FOLD (first option): in `ensureAnchor`'s parse-error `catch` (anchor.ts:100-101), refuse only when the body contains `_dse_anchor`; otherwise stamp as before r3. One test each way.
  - LOW-A: REWORD the CHANGELOG (no matcher change). An encounter whose old tracker was already rewritten (`_dse_from: 56948` / `.inf`) gets one more tracker once; the old tracker keeps its state. Numeric-equivalence matching in `findGeneratedBlock` DROPPED — sidebar is unreleased (beta vaults only), and number-equivalence risks collisions (`000000` vs `0e0000` both read as 0).
  - LOW-B FOLD: add a `registration.test.ts` test for `requestPinToSidebar`'s refusal Notice branch (registration.ts:321-322).
  - INFO-A/B: no action.
  - Fix round -> implementer a9e9e7f; scoped re-review -> reviewer a26a33e.
- 2026-10-20: r5 DONE @ 9cae8d3 (d58cf6a + 13); jest 5013/1 skipped/5014, lifecycle 26/26, e2e 71/76 0 failed 5 known-bug 51/51. r6 scoped re-review -> reviewer a26a33e.
- 2026-10-20 (owner, r6 rulings on sc360-r6-rereview-report.md — LAND, 0 HIGH / 0 MED / 1 LOW / 1 INFO): LOW-1 FOLD — CHANGELOG.md:51 "now opens one tracker per press" -> "now reopens the same tracker on every press" (CHANGELOG-only; owner verifies the diff). INFO-1 (includes check refuses broken YAML mentioning the key in a comment): DROP — needs a YAML error AND the literal key, writes nothing, block already shows an error card.
- 2026-10-20: r7 CHANGELOG nit committed @ 7817133 (owner verified diff: 1 line). LAND-READY on d58cf6a (ff). Comment posted; reported land-ready to dispatcher.
