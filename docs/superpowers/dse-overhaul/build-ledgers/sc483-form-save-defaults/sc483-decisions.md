# SC-483 decisions ledger — block edit form Save writes default values for fields the user never touched

Ticket: https://linear.app/tski-home/issue/SC-483
Worktree: /home/scott/code/steelCompendium/worktrees/sc483-form-save-defaults (every submodule on branch `sc483-form-save-defaults`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `08206e3`); superproject (CHANGELOG) cut at `5cc6196` (origin/main).
Related: SC-466 (landed; filed this as its review LOW-1; per-model "omit absent-and-still-default keys" rule in src/elements/stamina-bar/model.ts). SC-482 runs CONCURRENTLY (per-block model serializers of other ComponentWrapper elements writing default keys) — do not touch model/serializer files; scope is src/authoring/FormModal.ts and its save path. Lifecycle id if one is added: G-S20.

## Spec (ticket description, verbatim, 2026-10-21)

> Found by the SC-466 independent review (LOW-1). Only reachable with authoring controls turned on (pref `authoringControls`, off by default).
>
> **Repro:** turn on authoring controls. Open the block edit form on a stamina bar containing only `max_stamina: 20` and `current_stamina: 15`. Change Max stamina to 25 and Save. The written block is `max_stamina: 25`, `current_stamina: 15`, `style: default`. The user never wrote `style`.
>
> **Cause:** the form's select widget fills the default into its working data when the form opens (`src/authoring/FormModal.ts:159`). Save then serializes it as a key the user declared (`FormModal.ts:183`). This lives in the generic form, so other elements with select fields are likely affected too.
>
> **Expected:** a Save writes only the fields the user set or changed. A select the user never touched, still at its default, stays absent. This is the same contract SC-466 set for stamina-bar writes.
>
> **Fix direction (from the review):** do not seed an absent select field into the working data, or drop a seeded key at Save when it was never touched and still equals its default.

## Scott rulings (verbatim, dated)

(none — thread had 0 comments at 2026-10-21 start)

## Owner decisions

- 2026-10-21: Take the review's second direction (drop at Save), not "stop seeding". Reason: the seed exists on purpose (FormModal.ts:153 comment) so validation and preview see the value the dropdown shows; removing it would make validation/preview disagree with the display again.
- 2026-10-21: Rule: a select field whose key was ABSENT from the source when the form opened, and which the user never changed (its dropdown onChange never fired), is not written by Save — it is stripped from the data before serialize/stringify. Validation and preview keep seeing the seeded value. A select the user changed is written, even if changed back to the first option (the first enum option is not always the parser's default, so "equals enum[0]" is not a safe omit test). Every key present in the source is written as today. Non-select widgets are unchanged (they do not seed).
- 2026-10-21: Out of scope: (a) a model's serializer re-adding the default from its own parse() — that is SC-482 (stamina-bar already omits it via SC-466); (b) the dropdown SHOWING enum[0] when the parser's default is a different option — report as a follow-up if found, do not fix.
- 2026-10-21: Pipeline = implementer A (r1) -> independent reviewer B (Opus, real-Obsidian probe) -> fix rounds -> scoped re-review -> land-ready to dispatcher. No visual change, so no Scott evidence round.

## Round log

- 2026-10-21: worktree created (`sc483-wt-new.log`, rc 0). dse 08206e3 (= origin/develop), superproject 5cc6196 (= origin/main).
- 2026-10-21 r1: implementer A (orchestration:implementer, agent a981055b03dc1bd34) dispatched on `sc483-brief-r1-impl.md`. Identity A never reviews; review goes to reviewer B (Opus). Ticket -> Awaiting.
- 2026-10-21 ~14:34Z: owner + implementer A killed by session-limit 429 (A had reached lifecycle 30/30, at 0997bbe: aeb1f9b red, d5182c9 fix, 0997bbe tsc fix; no CHANGELOG yet). 17:22Z: resumed A via SendMessage; dse develop still 08206e3.
- 2026-10-21 dispatcher: dse origin/develop 08206e3 -> bc4a0c5 (SC-362, harness-only, +8 shots; freeze baseline widened 276 -> 280). New baselines: jest 5457 / 1 / 232 of 233; lifecycle 30/30; e2e 89/93, 4 known-bug, 64/64; shots 580; freeze 280/280; parity 0/0/24. Land-ready must be on bc4a0c5 (or newer).
- Owner ruling 2026-10-21: A stops the 08206e3 battery after the running gate, rebases onto bc4a0c5, full battery there = evidence of record. Reviewer B reviews the rebased sha (placeholders in sc483-brief-r1-review.md: base bc4a0c5; jest 5457 + A's tests).
- 2026-10-21 r1 DONE (A): dse b6f73ed on bc4a0c5 (524718d red, 3cd5a6a fix, b6f73ed test tsc-lib fix); superproject f1f4dff (CHANGELOG) on 5cc6196. 0 rebase conflicts. Gates on b6f73ed: tsc/lint clean; jest 5469/1/232 of 233 (+12 tests in formModal.test.ts; 7 red pre-fix); lifecycle 30/30; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-174047-db37); shots 580; freeze 280/280; parity 0/0/24. Report sc483-r1-impl-report.md.
- Owner rulings on A's report (2026-10-21):
  - A's judgment call "a REQUIRED select is never stripped" -> ACCEPT provisionally (no built-in has one; stripping would write a schema-invalid block). Reviewer to probe.
  - A re-asserted the existing "Minor: a select field with no value yet…" test (expected `style: default` -> expects no `style`): ACCEPT — that is the behaviour this ticket reverses. Reviewer checks nothing else was dropped.
  - Follow-up "dropdown + preview show enum[0] for skills style / roll mode / roll difficulty, not the real default" -> filed SC-488 (Backlog, related SC-483). OUT OF SCOPE.
  - Follow-up "validation transforms mutate `working` in place (skills `Climb` saved as `climb`)" -> filed SC-489 (Backlog, related SC-483). OUT OF SCOPE.
  - Survey: no built-in select is re-added by its serializer -> nothing for SC-482 from this ticket.
- 2026-10-21 r1 review: reviewer B (orchestration:reviewer, agent a23863f6692f69c02) dispatched on `sc483-brief-r1-review.md` at dse b6f73ed.
- 2026-10-21 dispatcher: dse origin/develop bc4a0c5 -> 772c3cd (SC-457: shared fenceLanguage rule in src/framework/host/blockPrefix.ts used by every save path, sidebar, autocomplete; lifecycle G-S14). New baselines: jest 5536 / 1 / 233 of 234; lifecycle 31/31; e2e 89/93, 4 known-bug, 64/64; shots 580; freeze 280/280; parity 0/0/24. Land-ready must be on 772c3cd (or newer), superproject rebased onto origin/main.
- Owner ruling 2026-10-21: reviewer B narrowed to code + probes + tsc/lint + targeted jest + mutation, plus a read of the SC-457 src diff for interaction with FormModal's Save path (no full battery on stale b6f73ed). Then r2 rebase round = resume A: dse onto 772c3cd, superproject onto origin/main, full battery = evidence of record. Expected: jest 5548 (5536 + our 12) / 1 / 233 of 234; lifecycle 31/31; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64; shots 580; freeze 280/280; parity 0/0/24. Zero hand-resolved conflicts in src/ or test/ -> no re-review of the rebase; any -> scoped range-diff check by B. Review findings needing fixes fold into the same A round.
- 2026-10-21 dispatcher: dse origin/develop 772c3cd -> 8d075db (SC-422: text-size knobs on chrome roots — search modal, settings preview, sidebar; harness text-scale gates). New baselines: jest 5552 / 1 / 234 of 235; lifecycle 31/31; e2e 89/93, 4 known-bug, 64/64; shots 580 incl. `text scale OK (1626 …)` + `text scale once OK (104184 / 208 loads …)`; freeze 280/280; parity 0/0/24. Land-ready must be on 8d075db (or newer).
- Owner ruling 2026-10-21: same plan, new target — r2 rebases onto 8d075db; expected jest 5564 (5552 + our 12) / 1 / 234 of 235.
- 2026-10-21 18:41Z-~22:20Z: reviewer B hung (adapter footgun 13) on an `rm -r` loop over six e2e/.out run folders. Dispatcher TaskStopped and resumed it: do not retry the delete, leave the (gitignored) folders, list them in the report, finish the verdict. Plugin tree clean at b6f73ed at 22:23Z.
- 2026-10-21 r1 review (B) DONE: LAND-READY after the r2 rebase. 0 BLOCKER/HIGH/MEDIUM, 1 LOW, 6 INFO. Real Obsidian (Reading view) 8 probes: base bc4a0c5 RED 2/8, fix b6f73ed GREEN 8/8. 7/7 mutants killed. Gates on b6f73ed before narrowing: tsc/lint clean; jest 5469/1/232 of 233; lifecycle 30/30; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-181308-1e3b); shots stopped, freeze/parity not run. SC-457 does not change how FormModal's Save reaches the file. Report sc483-r1-review-report.md.
- Review rulings (owner, 2026-10-21):
  - LOW-1 (an empty schema'd block, e.g. empty ds-roll, saved untouched writes `{}\n`; FormModal.ts:217-224): FOLD. In `stringifyWorking`, an empty data object emits '' for the body (keep the `prefs:` prefix if present). Jest case: empty-source schema'd element with only optional selects, saved untouched, writes ''.
  - INFO-2 (elements without `serialize` get a blank line before the closing fence — stringifyYaml's trailing `\n` plus the host splice's own line break; FormModal.ts:223): FOLD — same function as LOW-1, and it is a byte the user never typed. Trim the trailing newline of the stringify-path body so skills/roll Saves end like stamina's. Jest case asserting the written note has no blank line before the closing fence.
  - INFO-4 (required-select guard covers top-level and allOf `required` only, not if/then / dependentRequired / oneOf): FOLD as a doc comment on the guard; no behaviour change.
  - INFO-1 (stamina-bar pencil also opens the Stamina modal; StaminaBarPanel.ts:133 click bubbling): filed SC-492 (Backlog, related SC-483). OUT OF SCOPE.
  - INFO-3 (SC-489 rewrites every transformed field, not only edited ones): appended the scope to SC-489's description. OUT OF SCOPE.
  - INFO-5 (re-asserted test hides nothing), INFO-6 (experimental-only; Live Preview not probed, same FormModal -> replaceSource path): DROP, no action.
  - Leftover gitignored e2e/.out run folders from B: leave them (gitignored, not dirt).
- 2026-10-21 r2: fix + rebase round = resume implementer A on `sc483-brief-r2-rebase.md` (folds LOW-1, INFO-2, INFO-4; rebase onto 8d075db; full battery). Scoped re-review of the fix delta -> reviewer B.
- 2026-10-21 dispatcher: dse origin/develop 8d075db -> 95981f1 (SC-432: stamina modal Spend Recovery disabled for creatures + no-pool hero confirmation; new e2e STAM tests). New baselines: jest 5582 / 1 / 234 of 235; lifecycle 31/31; e2e 95/98 ok, 0 failed, 3 known-bug, 66/66; shots 580; freeze 280/280; parity 0/0/24. Land-ready must be on 95981f1 (or newer).
- Owner ruling 2026-10-21: A's r2 retargeted to 95981f1 by SendMessage; battery once on the 95981f1-based tip. Expected jest 5594 + r2 tests / 1 / 234 of 235; e2e 95/98, 3 known-bug, 66/66.
- 2026-10-21 dispatcher: dse origin/develop 95981f1 -> 8d890f9 (SC-366 follow-up: styles-source.css `.dse-ref-notice` stripe removal + 3 jest tests; no shots moved). New baselines: jest 5585 / 1 / 234 of 235; rest unchanged. Land-ready must be on 8d890f9 (or newer).
- Owner ruling 2026-10-21: A's r2 retargeted to 8d890f9 by SendMessage; battery once on that tip. Expected jest 5597 + r2 tests / 1 / 234 of 235.
- 2026-10-21 r2 DONE (A): dse 54f8f88 on 8d890f9 (r1: 44ffed0 red, c9e7a8c fix, 1945d40 tsc fix; r2: 2df33a9 red, 54f8f88 fix); superproject d7ca6fc on origin/main 3c25464 (one CHANGELOG conflict hand-resolved, both bullets kept: SC-432 then SC-483). 0 plugin conflicts. Gates on 54f8f88: tsc/lint clean; jest 5601/1/234 of 235 (5585 + 12 + 4); lifecycle 31/31; e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 (run 20261021-233940-89f7); shots 580 with both text-scale lines; freeze 280/280; parity 0/0/24. A notes: empty body '' still yields one blank body line via replaceFenceBlock (code-read only). Report sc483-r2-report.md.
- 2026-10-21 r2 scoped re-review -> resume reviewer B on `sc483-brief-r2-rereview.md`, delta 1945d40..54f8f88 + range-diff of r1 commits + real-Obsidian probes.
- 2026-10-22 r2 scoped re-review (B) DONE: LAND-READY at dse 54f8f88 on 8d890f9. 0 BLOCKER/HIGH/MEDIUM/LOW, 2 INFO. range-diff of r1 commits all `=`. Real Obsidian 11 probes: 54f8f88 11/11 (run 20261022-000324-11db); r1 tip 1945d40 7/11. Mutants: empty->{} 2 red, no trimEnd 12 red, whole r1 FormModal 13 red. tsc/lint clean, formModal.test.ts 26/26; A's r2 battery logs re-read, all rc 0, numbers match. Report sc483-r2-rereview-report.md.
- Re-review rulings (owner, 2026-10-22):
  - INFO-A (empty ds-roll saved untouched becomes "```ds-roll\n\n```" — one blank body line from replaceFenceBlock; well-formed, renders, ABOVE/BELOW byte-exact, second Save is a no-op): DROP — well-formed, and the splice is out of scope.
  - INFO-B (`crit: |+` last-key block value parses to "boom\n" after Save, same on r1 and r2): DROP — unchanged by this ticket.
- 2026-10-22: LAND-READY. dse sc483-form-save-defaults @ 54f8f88 on 8d890f9; superproject @ afa62df on origin/main 3ba0832 (chore rebase, docs-only upstream, no conflict). Land-ready comment posted; reported to dispatcher.
