# SC-601 decisions ledger

Ticket: SC-601 "DSE (suspected): Compendium search opened while a hover preview is being edited may close the preview on the first click and insert into a closed editor". Backlog at start; no comments, no Scott rulings yet.

Worktree: /home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover (every submodule on branch `sc601-compendium-search-hover`), cut 2026-11-11 from dse develop `5f7c5336`.
Lifecycle id reserved if needed: G-S97 (goes in part 6 after G-S92, or its own part; G-S56 stays LAST in SCENARIOS order).

## Dispatcher instructions (2026-11-11, verbatim, the brief that launched this owner)

> It is marked "suspected, not yet reproduced": reproduce first; if it does not reproduce, say so on the ticket with the evidence. If the ticket turns out to need a decision from Scott, ask on the ticket and park.

> Owners don't edit SKILL.md; put any SKILL proposals in that dir as files.

> Report land-ready to the dispatcher and stop; the dispatcher lands.

## Scott rulings

(none yet)

## Baselines at 5f7c5336

jest 7685 passed / 2 skipped (fresh worktree) · lifecycle 58/58 (21 + 16 + 9 + 4 + 7 + 1) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (known bugs SC-257, SC-355, SC-384, SC-580) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## Rounds

- r1 (2026-11-11): reproduction probe in real Obsidian, `orchestration:reviewer` (agent a51f2dfbca649fb6b = identity R1; must not review its own probe later). Brief `sc601-r1-brief-repro.md`, report `sc601-r1-repro-report.md`. Ticket set Backlog -> Awaiting.
  - r1 result: REPRODUCED (all opening paths). Probe commit dse `0da7e1d3` (G-S97, 114 trials, ~19 min, exit 0). Input/box/backdrop press closes the editing preview 54/54; the later pick lands nowhere 42/42 (dead CM buffer, no Notice/error). Suggestion press or keys only: preview kept, insert lands 12/12. Pane control 18/18. Host-wide closing (Quick switcher, palette, Insert template close it too); the silent loss is ours. DseModal control keeps the preview 6/6.
  - Owner eyeballed the deciding pair (rv-cmd-input-click k1 before / after 1500 ms): card with "END" visible behind the search before; gone after, search still open. Confirmed.
  - Comment c1 posted 2026-11-11 (repro result + fix plan, no ask). State stays Awaiting.

## Owner rulings (2026-11-11)

- No Scott decision needed: the fix follows the landed SC-595 precedent (the plugin's own pop-ups keep the editing preview open). Fix = (1) SC-595 document click guard on `CompendiumSearchModal` when its target editor is inside a `.hover-popover`, both commands (`insert-compendium-reference`, `insert-compendium-block`); (2) choose-time check: if the captured editor is disconnected, show a Notice and write nothing; never re-target `activeEditor`.
- r1 follow-up "palette-input-first path": DROP. The native palette closes the preview (Obsidian's behavior); our command then acts on the visible active editor, which is coherent.
- r1 follow-up "block command's choice after closure not driven": FOLD into r2 (the fix and the tests cover both commands).
- r1 follow-up "Obsidian Insert template writes into the host note": DROP (Obsidian's bug, not ours).
- r1 SKILL proposals: carried to the land-time SKILL proposal file (r2 implementer writes `sc601-skill-proposal.md`).
- G-S97 lands as a SHORT assertion scenario (~8 trials) in lifecycle part 6 (after G-S92), not the 19-min probe. The probe is preserved as `sc601-r1-probe-0da7e1d3.diff` in this dir.
- r2 (2026-11-11): fix + jest + short G-S97 + CHANGELOG + SKILL proposal, `orchestration:implementer` (agent adc7b64beb5b40fd5 = identity I1). Brief `sc601-r2-brief-impl.md`, report `sc601-r2-impl-report.md`. Next: r3 independent review by a fresh reviewer (not R1, which authored the probe; not I1).
  - r2 result: dse `ea849f11` (fix `ddee8074`, jest `0e1154f2`, lifecycle `ea849f11`, on probe `0da7e1d3`), superproject `7199f0e6` (CHANGELOG). jest 7712/2 skipped; lifecycle 59/59 (21/16/9/4/7/2), part 6 154 s; e2e 278/282 0 failed 4 known-bug 171/171; shots 592, 163/978, 39/234, clip 147; freeze 280/280; parity 0/0/24. G-S97 8/8 green on branch, 6/8 red on base. Mutants 14/14 killed.
  - Owner rulings on r2 follow-ups (2026-11-12): (a) block command checks before `await entity.model()`, so a preview closed in that window still writes into the dead buffer: FOLD into the r3 fix round (re-check connection after the await). (b) A closed pane editor also gets the Notice: DROP, intended (a write into a dead buffer is never right). (c) jest cannot catch a `queueMicrotask` removal of the guard; G-S97 trial 3 does: DROP (same documented limit as SC-595's R4).
- r3 (2026-11-12): independent review, fresh `orchestration:reviewer` (agent a6817df7ce3df7360 = identity R2; not R1, not I1). Brief `sc601-r3-brief-review.md`, report `sc601-r3-review-report.md`. Fix round goes to I1 (resume adc7b64beb5b40fd5) with findings verbatim + the folded block-await follow-up; scoped re-review of the delta by R2 (or a fresh identity).

## Base moved (dispatcher, 2026-11-12, verbatim)

> SC-606 landed, dse develop is now 7866426e (supersedes 5f7c5336; `src/elements/montage/model.ts` only: a hero with no `skills_used` list works everywhere on the montage board; +22 jest). New CURRENT: jest 7707 passed / 2 skipped (fresh worktree) · lifecycle 58/58 (six parts) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto 7866426e before you report land-ready.

Owner plan: r3 review continues on `ea849f11` (the SC-606 delta is montage-only, disjoint from this diff). The fix round rebases onto `7866426e` first; expected after rebase: jest 7707 + 27 (r2's 25 + 2 kit-index) + fix-round additions, 2 skipped; lifecycle 59/59 (21/16/9/4/7/2); e2e/shots/freeze/parity unchanged from CURRENT.

## r3 result and owner rulings (2026-11-12)

r3 (R2) verdict FIX REQUIRED: HIGH 0, MEDIUM 1, LOW 1, INFO 5. Refactor behaviour-neutral; r2 gates confirmed (jest 7713/1 skipped with cached harness css, lifecycle parts 5 and 6 green, G-S97 red on base 6/8).
- MEDIUM-1 (block command writes into a closed preview after `await getEntity/model/body`): FOLD, r4 fix round, the prescribed fix (`insertFullBlock(editor, entity, isOpen)` re-checks right before `replaceSelection`; keep the early check; exactly one Notice) + R2's 2 jest probe tests + a direct `insertFullBlock(..., () => false)` test + a 9th G-S97 trial with the `getEntity` hook (red on `ea849f11`, green with the fix).
- LOW-1 (4 survivor mutants R2, R4a, R4c, R5): FOLD, r4 ports R2's 4 probe tests (R5 popout-document binding is the most important).
- INFO-3 (jest SuggestModal mock calls choose before close, Obsidian closes first): FILED Backlog SC-611 (related to SC-601). Out of scope for r4.
- INFO-1, 2, 4, 5: no action.
- r4: resume I1 (adc7b64beb5b40fd5) with the above, rebase onto `7866426e` first, full battery. Then a scoped re-review of the delta by R2 (a6817df7ce3df7360; it did not author the fix code, its prescribed fix is validated scratch only, so a different identity R3 is preferred if R2 is to stay independent: use a FRESH reviewer for the delta re-review).

## Base moved again (dispatcher, 2026-11-12, verbatim)

> SC-596 landed, dse develop is now c6077860 (supersedes 7866426e; reading-mode host pin code: a block edit form in an embed or hover preview is placed like a card write via `rebaseCardPin`, text search deleted, refusing pins; G-S64 (zh) re-targeted; new lifecycle scenario G-S96). Lifecycle is now 59 scenarios in six parts: part 6 is `G-S92 G-S96` (2; ~175 s; `--only=G-S92,G-S96`, comma-separated). G-S56 still last in SCENARIOS order. New CURRENT: jest 10624 passed / 2 skipped (a 2880-cell sweep suite, ~58 s alone) · lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. If you add a lifecycle scenario, check it against part 6's ~175 s. Rebase onto c6077860 before you report land-ready.

Owner: I1 (r4, running) told mid-flight to rebase onto c6077860 instead. Expected: jest 10624 + 27 + r4 additions / 2 skipped; lifecycle 60/60 (21/16/9/4/7/3), part 6 `--only=G-S92,G-S96,G-S97` (~230 s; if > 300 s, G-S97 becomes its own part 7). r5 brief to be updated to base c6077860 before dispatch.
  - r4 result (I1): dse `ee113341` on `c6077860` (6d1b56e9 fix, 10f8aaf0 jest, dd838596 MEDIUM-1, a46b9617 early refusal before vault read, ee113341 G-S97 9 trials). Reset + cherry-pick rebase; r1 probe commit dropped from history (diff kept). jest 10659/1 skipped (fresh 10658/2); lifecycle 60/60 (21/16/9/4/7/3), part 6 230 s; e2e 278/282 0 failed 171/171; shots 592 163/978 39/234 147; freeze 280/280; parity 0/0/24. Trial 9 red on 10f8aaf0 bundle, green on HEAD. Mutants 23/23.
- r5 (2026-11-12): scoped re-review of r4 delta, FRESH `orchestration:reviewer` (identity R3). Brief `sc601-r5-brief-rereview.md`.
  - r5 result (R3, agent a1fa0e8b2d579f404): FIX REQUIRED, HIGH 0 MEDIUM 0 LOW 2 INFO 4. MEDIUM-1 confirmed fixed; a46b9617 is test-only, keep. Rebase verified (range-diff equal). Part 6 230 s 3/3; trial 9 red on 10f8aaf0 bundle, green on HEAD.
  - Owner rulings (2026-11-12): LOW-1 (3-way apply changed G-S96's return at obsidian-lifecycle.mjs:8346 to append "; no page error"): FOLD, restore `return outcomes.join('; ');`. LOW-2 (mutant R2c: block command re-targeting activeEditor survives): FOLD, add the block-command twin of the R2 test. r6 = I1 resume; gates jest + tsc + lint + lifecycle part 6 (no src change, so e2e/shots/freeze/parity carry from r4). r7 = scoped re-review of the r6 delta by R3 (resume; it did not author either change).

## Base moved a third time (dispatcher, 2026-11-12, verbatim)

> SC-610 landed, dse develop is now 3ad68185 (supersedes c6077860; `src/elements/montage/` only: participants items that are not a named hero are skipped, kept as typed on write). New CURRENT: jest 10676 passed / 2 skipped (fresh worktree) · lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2) · e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24. Rebase onto 3ad68185 before you report land-ready, and make sure your superproject branch is on current workspace main too (two recent branches were cut before a landing and had to be re-applied).

Owner: I1 (r6, running) told to plain-rebase dse onto 3ad68185 (stop on conflict) and rebase the superproject branch onto workspace origin/main (CHANGELOG conflict: keep all bullets; never stage the dse pointer). Full battery re-run on the rebased branch: jest 10676 + 35 / 2; lifecycle 60/60 (21/16/9/4/7/3); e2e, shots, freeze, parity at CURRENT.
  - r6 result (I1): dse `231f2a3b` plain-rebased on `3ad68185` (40a96851 G-S96 return restored, 231f2a3b block-command R2c test). Superproject `598579d7` on workspace origin/main `d0ca9bf0` (CHANGELOG conflict resolved, SC-601 bullet first). Scenario byte-identity vs 3ad68185: 59/59 base entries identical. jest 10712/1 (fresh 10711/2); lifecycle 60/60 (21/16/9/4/7/3, part 6 230 s); e2e 278/282 0 failed 171/171; shots 592 163/978 39/234 147; freeze 280/280; parity 0/0/24. R2c killed.
- r7 (2026-11-12): scoped re-review of the r6 delta by R3 (resume a1fa0e8b2d579f404).
  - r7 result (R3): LAND-READY, HIGH 0 MEDIUM 0 LOW 0 INFO 1 (scratch-tree jest skip count; no action). Verified byte-identity, R2c killed, 15/15 mutants, superproject diff = one CHANGELOG bullet, jest 10711/2, part 6 3/3 230 s, r6 logs post-HEAD and at CURRENT.
- LAND-READY (2026-11-12): dse `231f2a3b` on develop `3ad68185`; superproject `598579d7` on workspace main `d0ca9bf0`. Reported to dispatcher. Ledger dir to preserve at landing; SKILL proposal `sc601-skill-proposal.md`.
- DONE (2026-11-12): landed by the dispatcher. dse develop `231f2a3b` (`3ad68185..231f2a3b`); workspace main `f88262ec` (CHANGELOG `598579d7`, pointer bump `34502ba2`); ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc601-compendium-search-hover/` (bookkeeping `2a02261a`). Landed comment posted; SC-601 set Done via linear-post.py `--state Done`, verified Done by get_issue. Follow-up: SC-611 (Backlog).
