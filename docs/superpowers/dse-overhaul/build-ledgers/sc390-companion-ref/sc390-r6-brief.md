# SC-390 R6 brief — DSE pin bump to steel-compendium-sdk 3.1.0 (final round)

You are an `orchestration:implementer`. Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers) plus the filesystem path of every artifact. **Workers never call the tracker** (Linear) — not to read, not to post.

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/decisions.md` (read the whole file; rulings are verbatim there). Prior DSE-side reports in the same dir: `sc390-r1b-report.md`, `sc390-r2b-review.md`, `sc390-r4b-rereview.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc390-pin-bump`; plugin repo `<wt>/draw-steel-elements`, branch `sc390-pin-bump`, cut from `origin/develop` 566888a (SC-411 landed after SC-390 landed at 135716d). First thing: `git -C <wt>/draw-steel-elements fetch origin` and confirm you are on 566888a or rebase onto the tip.
- Devbox: Go/Node are not on PATH. Run every command as `devbox run -- bash -c 'cd /abs/path && <cmd>'` from `/home/scott/code/steelCompendium/workspace` (the plugin repo also has its own devbox; the dse-verify skill tells you which to use for each step). Devbox eats exit codes: judge by output, never `$?`.
- Scott's rulings (verbatim from the ledger): approved item 2 — "shared schema `free_strike` integer|string + optional `skills`, both schema copies move, data-sdk-npm release + plugin pin bump inside SC-390". 2026-10-18: "3.1.0 is released".
- The npm registry now serves `steel-compendium-sdk@3.1.0` (verify with `npm view steel-compendium-sdk@3.1.0 version dist.shasum`; record the shasum).

## 2. Task
1. In `<wt>/draw-steel-elements`: set `"steel-compendium-sdk": "3.1.0"` in `package.json` and refresh `package-lock.json` with `npm install` (no other lock drift; if the lock moves anything else, report it and stop with STATUS: NEEDS_CONTEXT).
2. Precedent to follow: commit `0ecb90e` "chore(deps): steel-compendium-sdk 3.0.1; drop the featureblock feature_type shim (SC-155)" bumped the pin AND removed the local shim the SDK fix made redundant. Do the same here: `src/elements/statblock/companionFields.ts` is a local type mirroring SDK 3.1.0's `skills` / `free_strike: number | string`. If 3.1.0's `StatblockDTO` (and the `Statblock` model) now carry those fields with matching types, delete `companionFields.ts`, import from the SDK, and adjust its tests. Behaviour must be identical: the Skills cell, the empty/null/whitespace-EV omit, the scalar-`skills` coercion all stay (they live in `src/elements/statblock/view.ts`). If the SDK types do NOT match (anything would need a cast or a shim), keep `companionFields.ts`, report exactly which field differs, and do only the pin bump.
3. `CHANGELOG.md` (plugin): add the dependency bump to the existing SC-390 bullet under Unreleased, in the house style (see how 0ecb90e / SC-155 was recorded).
4. One commit, message in the shape of 0ecb90e: `chore(deps): steel-compendium-sdk 3.1.0; …(SC-390)`. No AI/Claude attribution trailers of any kind.
5. Out of scope (do not touch): SC-392 (advancement under the card), SC-415 (SDK sc-md organization set), the duplicate "COMPANION" chip, any CSS, any fixture, any other dependency.

## 3. Gates — `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read it; battery order tsc, lint, jest, shots, freeze, parity LAST; e2e step 4b if the skill requires it on this base)
- First run the battery on the **clean** 566888a tree (detached, before your change) so you own the base numbers: expected freeze `freeze OK (276/276 …)` (SC-390's 2+2 delta is applied), parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, shots 0 FAIL. jest count on 566888a is not yet recorded in the skill (SC-411 added tests on top of 4458 passed / 1 skipped / 220 of 221): record what you measure.
- Then the full battery on your committed tree. Expected: tsc/lint clean; jest same pass count as base (or higher only if you adjusted tests — explain any delta); shots same count, 0 FAIL; **freeze `freeze OK (276/276 …)` — a dependency bump must move zero frozen bytes; any FREEZE VIOLATED is a stop-and-report, not a rebaseline**; parity unchanged.
- Runtime probe: render the real Panther through the plugin's `ds-scc` path (the jest fixture `test/fixtures/md-dse/monster/companion/beastheart/statblock/panther.md` and `test/dom/elements/sccElement.test.ts` cover it) under the 3.1.0 install — confirm those tests are green and `node_modules/steel-compendium-sdk/package.json` reads 3.1.0.
- Redirect long output to files under the ledger dir (`sc390-r6-<step>.txt`); never stream a battery (the 600 s watchdog kills silent agents). Never key a wait on a scratch filename or its contents; read your own process output.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/sc390-r6-report.md` — open with a ≤10-line executive summary: verdict, final dse sha, base sha, 3.1.0 shasum, every gate number base vs after, whether `companionFields.ts` was removed and why, files changed, follow-ups (left alone) vs drive-by fixes (made). If the report write is blocked, return it inline.

## 5. Footguns
- You cannot message the ticket-owner. `to: "main"` reaches the top-level session, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in the report. If you ever send a message anyway, its first word must be `SC-390:`.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`. Never create a tag or release on draw-steel-elements. Never run `just deploy*`, `just wt-finish`, `just wt-rm`, or `land-stack`. Do not push.
- Never `rm -rf` anything under `.superpowers/`. Never `pkill` by pattern.
- The main checkout `/home/scott/code/steelCompendium/workspace/draw-steel-elements` is Scott's live vault — do not run anything there.
