# SC-519 r3 fix report

## Executive summary
- STATUS: DONE. Three folds applied, nothing else. origin/develop still c2758a2 at start; HEAD was 1e97599 with a clean tree (no rebase).
- New shas: dse `253aa5f` (comment + G-S45/G-S40 wait), superproject `f0cd44b` (CHANGELOG). dse pointer not bumped.
- M-1: CHANGELOG bullet now says "in Reading view and the sidebar" and ends "(Live Preview is not covered by this fix.)".
- L-1: `view.ts` `openAfterPendingWrite` doc comment now says: dropped write -> host Notice; disk failure or write rejected before it starts -> console error only, host body can already be ahead of the disk (SC-524). Comment only.
- L-2: both fixed 1000 ms settles after the sidebar pin (G-S40 ~2597, G-S45 ~2702) removed; the shared `formKit.pinToSidebar` now waits on a condition (15 s deadline) instead.
- G-S45 vs c2758a2 bundle still FAILs (line below). G-S40 + G-S45 ok on the fix.
- Gates on 253aa5f: tsc/lint clean; jest 6074 passed / 1 skipped / 245 of 246; lifecycle 38/38; e2e 123/123 ok, 0 failed, 0 known-bug, 87/87; parity 0 gaps / 0 undeclared / 24 declared. Shots + freeze skipped: no rendered code touched and the shots cache (`visual-harness/dist/obsidian-app.css`) was already present, so jest read the after-shots numbers.

## L-2 detail: what "the panel's rebuild" is
I probed it in real Obsidian first (temporary scenario, reverted, not committed): after the pin, the stamp's `modify` event arrived 9 ms into the run, BEFORE the sidebar leaf existed; the panel mounted once (root r1, 65 ms) and no second rebuild happened in 3 s. So in the normal ordering there is no rebuild to wait for; under load the `modify` could land after the panel registered its listener and trigger one. The wait therefore does not guess a delay; `pinToSidebar` now:
1. counts Obsidian `modify` events for the note from before the pin click (page-side `vault.on('modify')`, removed in a finally);
2. after the panel root exists, waits (deadline 15 s) until: at least one `modify` was delivered, the panel host's `lastMountedChild` is loaded, the card is inside `.dse-sidebar__panel`, and `host.cachedContent` equals the note's text per `vault.cachedRead`.
Residual (stated, not hidden): the async tail of `handleExternalChange` after a late `modify` is not individually observable; a slow rebuild landing after this condition would make G-S45 fail loudly (held-timer count or card-value assertions), not pass falsely. Not seen in 3 full lifecycle runs (pair run, full 38/38, plus r1/r2 runs).

## Evidence
- G-S45 vs c2758a2 bundle (`DSE_LIFECYCLE_BUNDLE`, log `r3-base.log`): `OBSIDIAN-LIFECYCLE G-S45 FAIL: Reading view (the click was lost: the form started from "name: Health\ncurrent_value: 3\nmax_value: 20\nmin_value: 0"): the note never got "current_value: 4": "# form stale counter\n\nABOVE\n\n```ds-counter\nname: Health\ncurrent_value: 3\nmax_value: 20\nmin_value: 0\n```\n\nBELOW\n" [shot /tmp/dse-obsidian-lifecycle-JZLZpk/shots/G-S45-FAIL.png]`
- Fix: `--only=G-S40,G-S45` -> both ok (`r3-pair.log`); full lifecycle `38/38 ok, 0 failed` (`r3-lifecycle.log`, rc 0).
- Logs, all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc519-r1-impl-a1/`: `r3-tsc.log`, `r3-lint.log`, `r3-jest.log`, `r3-pair.log`, `r3-base.log`, `r3-lifecycle.log`, `r3-e2e.log`, `r3-parity.log`, `probe.log`.

## Cleanup
- Deleted by literal path (one `rm -rf` each): `/tmp/dse-obsidian-lifecycle-{UWaF1N,VOZM1l,Q6tRxq,UEb2TT,a7raUi,RCoYhM,t3UWgs,bOWljr,bvEScG}`, and my scratch `base-c2758a2` and `var-nosidebar` under `.../scratchpad/sc519-r1-impl-a1/`.
- NOT deleted, mine, for you to decide: `/tmp/dse-obsidian-lifecycle-JZLZpk` (this round's c2758a2 red run, per brief), `/tmp/dse-obsidian-lifecycle-8lyigx` (the throwaway L-2 probe's FAIL dir), and two r1 iteration FAIL dirs `/tmp/dse-obsidian-lifecycle-jfAV0T` and `/tmp/dse-obsidian-lifecycle-xRXzGA` (not on your list). Other `/tmp/dse-obsidian-lifecycle-*` dirs belong to other sessions; untouched.

Drive-by fixes: none.
Follow-ups: none new.
