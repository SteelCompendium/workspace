# SC-460 fix round 1 (resume of the round-1 implementer)

Read the independent review: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-review-report.md` — findings MEDIUM-1, MEDIUM-2 and LOW-1 (lines ~14-61) are your spec, verbatim; read them in full. Evidence dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/logs/sc460-review-1792551164/` (`zz-sc460-review-stale.test.ts`, `fixtrial.log`, `mutation-summary.json`).

Owner rulings (ledger, 2026-10-21, verbatim):
> **MEDIUM-1 fix** (as prescribed), **MEDIUM-2 fix** (adopt the reviewer's 5 stale-section tests), **LOW-1 fold** (add a test for the encounter-append line hint), INFO-1..4,6 no action, **INFO-5 filed as SC-471** (Backlog; "Send block to sidebar" hotkey silent on the opening fence line) — out of scope for SC-460.

and the ruling MEDIUM-1 enforces:
> **fold into the fix round** — small, same helper; a CR-only note must stay CR-only like SC-453's all-CRLF rule.

Tasks:
1. FIRST rebase: `git -C /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements fetch origin && git -C /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements rebase origin/develop` — expect `ba20072` (SC-366: CSS link colour + `test/dom/theme/notInstalledLinkColour.test.ts`) or a fast-forward of it; report the sha.
2. MEDIUM-1: implement the prescribed `Eol`/`detectEol`/`toEol` change in `lineEnding.ts`; rewrite `lineEnding.test.ts:29`; add jest cases (CR-only note stays CR-only on Reading-view write, sidebar write/stamp; LF/CRLF/mixed unchanged) written failing first. Extend lifecycle G-S12 (or add an assertion) so a CR-only note in real Obsidian stays CR-only.
3. MEDIUM-2: move the reviewer's 5 stale-section cases into `test/.../reading-mode-host-durable.test.ts` (adapt names/conventions); confirm each of the three call-site reverts (`:80`, `:636`, `:215`) now fails ≥1 test — record which.
4. LOW-1: add a test that fails when the `encounter/view.ts:496` line hint is reverted to the old rule; record it.
5. Out of scope: SC-471 (do not touch `aliasAtLine`). No other changes.
6. Commit each step, messages ending `(SC-460)`, no attribution trailers.
7. Full dse-verify battery on the rebased head. Base numbers at ba20072: tsc+lint clean · jest **5260 passed / 1 skipped / 230 of 231 suites** (+ your SC-460 tests, ~+50 plus this round's) · lifecycle **28/28 expected with G-S12** (base 27/27) · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` · shots 572, 0 FAIL, pressed-toggle line · freeze `freeze OK (276/276 …)` · parity 0/0/24.

All footguns of `sc460-brief-impl.md` §4 still apply (private scratch subfolder `<scratchpad>/sc460-impl-<timestamp>/`, devbox wrapping + exit codes to files, foreground gates, no pattern kills, no shared-/tmp-glob rm, `git -C` only, never edit the main checkout except your report/logs, never push/tag, never call Linear, NEEDS_CONTEXT instead of messaging).

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-fix1-report.md`, opening with a ≤10-line executive summary; logs in `.../logs/sc460-fix1/`. Return raw facts: STATUS, rebased base sha, head sha, commit list, gate numbers, mutation-kill results for items 3-4, FAIL-first evidence, artifact paths.
