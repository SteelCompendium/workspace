# SC-481 r4 fix report

## Executive summary
1. Verdict: DONE_WITH_CONCERNS. HIGH-1, MEDIUM-1, LOW-1 and the G-S50 comment are fixed in Reading view. One gap found by the Live Preview check is NOT fixed (see "Live Preview callouts"): it needs a different hook, so it is a follow-up candidate for the owner.
2. Plugin HEAD `2c5887f` on branch `sc481-twin-block-vanish`, on origin/develop `4deb8cf` (unchanged). Superproject `3e74be1c` (CHANGELOG only; submodule pointer not bumped).
3. Fix: one shared section test, `fenceOnElement` (in `ReadingModeBlockHost.ts`), now used by both `reconcile` (via `reusedBlockBody`) and `remountVacated`. A plain section must be a closed fence; a quote/callout window is read for the fence inside it (SC-455 ordinal, `locateInSectionLines`), body taken from the fence's own lines with the prefix stripped.
4. Red to green per finding: jest 5 of 15 red on d250e97's source (callout upper click shows the parse-error card; adoption off; form-Save erase for callout and quote); LOW-1 case green on HEAD and red when the `lastWriteLine` skip is removed. G-S53 FAILS on the d250e97 bundle and the 4deb8cf bundle in the new callout and quote phases (26 problems on 4deb8cf), PASSES on HEAD.
5. Gates on `2c5887f`: tsc/tsc -p e2e/lint clean; jest 6168 passed / 1 skipped / 249 of 250 (6161 + 7); lifecycle 42/42 (21 + 21); e2e 124/124, 0 known-bug, 87/87; shots 592, 0 FAIL, host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24.
6. Mutations (shared-helper guard removed, window judging removed, `lastWriteLine` skip removed): each caught by jest (4, 6 and 1 red cases).

## Changes (plugin `draw-steel-elements`)
- `src/framework/host/ReadingModeBlockHost.ts`:
  - new exported `quoteOrdinal(el, alias)` (the old `domOrdinal` DOM walk, now reusable; `domOrdinal` is a thin wrapper, same behavior);
  - `locateInSection` split into a string wrapper plus `locateInSectionLines` (no behavior change; lets callers reuse one line split);
  - new exported `fenceOnElement(ctx, el, alias, linesOf)`;
  - `reusedBlockBody` now = `fenceOnElement` + the `lastWriteLine` skip + body compare.
- `src/framework/host/remountReused.ts`: `remountVacated` uses `fenceOnElement` (was: the section's raw lines, the MEDIUM-1 parse-error source); one-line comment that Live Preview never adopts and its getSectionInfo answers for destroyed widgets (INFO-5 drive-by, allowed by the ruling).
- Tests: `test/dom/framework/twin-reuse.test.ts` +7 cases: callout and quote (each: upper click with adoption, adoption off, form-Save-style write then lower click) = 6, plus the LOW-1 two-docId case. Infra: `windowsOf`/`quotedBody`/`quoted` helpers and a `windowed` option on `setup`.
- Lifecycle `G-S53` (still one scenario): new phases for callout twins and quote twins: click upper then lower; adoption off; form Save on the upper then a click on the lower (names must stay [Edited, Twin]); no error card drawn; outside-of-quote text equals the fixture; fixtures `Lifecycle/twin-callouts.md`, `Lifecycle/twin-quotes.md`. The form is opened from the keyboard in these phases: a callout's title sits where the hover menu is drawn, so the pointer never reveals it (measured; not a product change).
- `visual-harness/obsidian-lifecycle.mjs` G-S50 comment: the twin-mode note "old root/pencil stay in the document (inside the twin)" is now accurate (comment-only).
- `.repo-docs/architecture.md` rows; superproject `CHANGELOG.md`: bullet now says "blocks inside a callout or a quote" and adds "(Identical blocks in two separate callouts are not covered in Live Preview yet.)". Owner may drop or reword that sentence.

## Red to green
- Jest on d250e97 source, new cases (commit 4cac5fd): 5 failed: callout upper click (`failed to render (parse)` card, r3 MEDIUM-1), callout and quote adoption off (lower card shows 6), callout and quote form-Save then lower click (names [Twin, Twin]). Passing by design on d250e97: quote upper click with adoption (r3: fine), the LOW-1 case (guards the existing skip).
- Jest on HEAD: 55/55 in the three touched files; full 6168.
- G-S53 on the d250e97 bundle (log `lc-gs53-d250.log` in scratch): callout twins click upper `cards [6,null]` vs disk [6,5], lower "no control on card #1", 1 error card drawn; adoption off [6,6] vs [6,5] then [7,5]; form Save upper then lower: disk [6,5], names [Twin, Twin]; same for quote adoption off and form Save.
- G-S53 on the 4deb8cf bundle: 26 callout/quote problems (callout adoption on: 1 card for 2 blocks; the rest as above).
- G-S53 on HEAD: ok. Callout and quote: upper [6,5], lower [6,6], adoption off [6,5] / [6,6], form Save upper cards ["Edited=5","Twin=5"], lower click [5,6], names [Edited, Twin]; claims +1, collisions +0 where adoption is on.

## Mutation checks (each reverted; tree clean after)
- Remove the shared helper's window guard (window sections take the raw section lines): jest 4 red (callout upper click, callout adoption off, callout form-Save, and the r2 "block in a callout is left alone" case).
- Remove window judging (window sections return null): jest 6 red (callout and quote x upper click / adoption off / form-Save).
- Remove the `lastWriteLine` skip (r3 LOW-1): jest 1 red (the new two-docId case). Logs: `sc481-r4-mut-guard-jest.log`, `-mut-window-jest.log`, `-mut-skip-jest.log`.
- Lifecycle was not rerun on the mutants; jest catches each ("and/or" in the brief).

## Live Preview (the "also check")
- Quotes: a fenced block inside a plain blockquote is not drawn as a DSE card in Live Preview at all (start state: 0 cards), so nothing to fix.
- Callouts: NOT fixed, same as base. With `Lifecycle/twin-callouts.md` in Live Preview, after one click on the upper block: disk [6,5]; the upper callout is drawn as raw source (editor cursor inside it) and the lower callout widget shows 6 (the writer's value; disk 5). A click on it writes the UPPER block (disk [7,5]). Identical on the 4deb8cf bundle and on HEAD.
- Why r4 does not reach it: the callout widget gets no section from Obsidian, and after the write Obsidian runs NO code-block processor at all for it (checked with a debug hook in `reconcile`: only the initial draws called it), so there is no hook where `reconcile` runs. After the page settles, `reusedBlockBody` via the editor's `livePreviewCalloutSection()` does detect the stale view (measured), so a fix would be a deferred/observer-driven pass, not a processor-time one. I tried a deferred pass (processor-time trigger plus a 150 ms timer) and it never ran, for the reason above; the experiment was reverted (`git checkout`), nothing of it is committed.
- Suggest a follow-up ticket for the owner to rule on: "SC-481 for twin blocks in Live Preview callouts".

## Gates (logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/`)
- `sc481-r4-gate-tsc-lint.log`: tsc, tsc -p e2e, lint all rc=0.
- `sc481-r4-gate-jest.log`: 6168 passed, 1 skipped, 249 of 250 suites.
- `sc481-r4-gate-lifecycle-1.log` 21/21, `-lifecycle-2.log` 21/21 (G-S50 and G-S53 included; the second half took 541 s).
- `sc481-r4-gate-e2e.log`: 124/124 ok, 0 known-bug, 87/87 pairs (CHR-F02 did not recur).
- `sc481-r4-gate-shots.log`: 592 PNGs, rc=0, 0 FAIL, button 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]. The first foreground attempt was killed at 598 s (`sc481-r4-gate-shots-run1-killed-at-598s.log`, load 6.5); the second ran in the background and I polled its own unique log for its `rc=` line (no notification wait): rc=0.
- `sc481-r4-gate-freeze.log` 280/280; `sc481-r4-gate-parity.log` 0 gaps, 0 undeclared, 24 declared.

## Drive-by fixes
- INFO-5 code comment at `remountVacated` (allowed by the ruling); G-S50 twin-mode comment (folded by the ruling).
- `locateInSection` now delegates to a lines-based twin (`locateInSectionLines`): needed so `fenceOnElement` splits a note once per call batch; no behavior change.

## Follow-ups
- Live Preview callout twins (above): same bug as base, needs an editor-side hook.
- The CHANGELOG sentence about Live Preview callouts: owner may remove it if the follow-up ticket lands first.
- Shots still exceeds 600 s under load (already named to the dispatcher in r2).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r4-fix-report.md`
- Screenshot (Reading view, callout twins after form Save upper then lower click: "Edited 5" above, "Twin 6" below): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r4-callout-twins-form-save-then-lower-click.png`
- Gate logs and mutation logs: `sc481-r4-gate-*.log`, `sc481-r4-mut-{guard,window,skip}-jest.log` in the same directory.
- Scratch (probes, d250e97 and 4deb8cf bundles, base-fail logs, Live Preview probe JSON `lp-head*/p481-lp.json`, `lp-b4deb*/`): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r4-impl-b2/`
