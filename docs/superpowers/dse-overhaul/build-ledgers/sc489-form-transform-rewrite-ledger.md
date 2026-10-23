# SC-489 decisions ledger — block edit form Save rewrites values the user typed (`Climb` -> `climb`)

Ticket: https://linear.app/tski-home/issue/SC-489
Worktree: /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite (every submodule on branch `sc489-form-transform-rewrite`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `0dff966` = origin/develop); superproject (CHANGELOG) cut at `3762276` (origin/main).
Prior art (both just changed `src/authoring/FormModal.ts`):
- SC-483 `docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-decisions.md` (+ `sc483-r1-review-report.md` INFO-3 = this bug's scope).
- SC-488 `docs/superpowers/dse-overhaul/build-ledgers/sc488-form-real-default-ledger.md` (optional selects lead with a `Default (…)` sentinel; nothing seeded; labels derived from `parse()`; declared keys keep source order on Save; required select seeded and always written).
Lifecycle id if one is added: G-S34.
Out of scope also: SC-504 (sidebar `_dse_anchor` shallow-clone, pipeline.ts) and SC-404 (form redesign; Save re-stringifies untouched keys).
Overlapping tickets in the same file — NOT in scope, one FormModal ticket at a time: SC-493 (emptied raw-YAML box -> error card for counter/negotiation/party/encounter), SC-494 (Save drops a stamina bar's `collapsed:` line). Both wait for SC-489.
Authoring controls are experimental (data.json `experimental: true` + pref `authoringControls`).

## Spec (ticket description, verbatim, 2026-10-23)

> Found while fixing SC-483. Only reachable with authoring controls turned on (pref `authoringControls`, off by default).
>
> **Problem:** the block edit form's validation step runs the schema's transforms (trim, lowercase) on the form's working data in place. Save then writes the transformed values. A `ds-skills` block where the user wrote `Climb` is saved as `climb`, even when the user did not touch that field.
>
> **Expected:** Save writes only what the user changed. Validation may normalise a copy for checking, but it must not rewrite the values that get saved.
>
> **Where:** `src/authoring/FormModal.ts` `revalidate()`, which calls the validation service on `this.working`.
>
> **Scope (SC-483 review, confirmed in jest probes):** it rewrites every field that has a `transform`, not only the ones the user edited. Examples: an untouched skills Save writes `Climb` as `climb`; a skills block with `style: Chips` where only "Only show selected" was toggled is written with `style: chips`; a stamina bar's declared, untouched `style: Sheet` is written as `style: sheet`. The cause is ajv-keywords `transform` mutating `working` when `revalidate()` runs at open.

## Scott rulings (verbatim, dated)

(none — thread had 0 comments at 2026-10-23 start)

## Owner decisions

- 2026-10-23: Pipeline = design survey (reviewer, Opus, read + jest probes, no edits) -> owner picks the design -> implementer A -> independent reviewer B (real-Obsidian probe) -> fix rounds -> scoped re-review -> land-ready to dispatcher.
- 2026-10-23: why a survey first (owner read of FormModal.ts at 0dff966): transforms exist only in SkillsSchema.yaml (`style`, `skills[]` items, custom skill `skill_group`) and StaminaBarSchema.yaml (`style`). Two traps a naive "validate a clone" fix would hit: (1) the select case (FormModal.ts:172-205) matches `scalarToString(current)` against lowercase enum options — an un-normalised `Chips`/`Sheet` would match no option; (2) stamina-bar has `serialize`, so Save writes `serialize(parse(working))` (FormModal.ts:243-251) — whether `Sheet` survives depends on the parser. Also the preview/labels currently parse transformed data, like the render pipeline may.

## Round log

- 2026-10-23: worktree created (`sc489-wt-new.log`, rc 0). dse 0dff966 (= origin/develop), superproject 3762276 (= origin/main).
- 2026-10-23 r0: design survey -> reviewer S (orchestration:reviewer, agent a7422fcf3763bda4b) on sc489-brief-r0-survey.md. S authors no code; review of the implementation goes to a fresh reviewer B (S authored the design input). Ticket -> Awaiting.
- 2026-10-23 dispatcher: dse origin/develop 0dff966 -> 53e1e48 (SC-485: initiative tracker model writes + e2e + a fixture; no FormModal change). New baselines: jest 5840 / 1 / 240 of 241; lifecycle 33/33; e2e 108/108 ok, 0 failed, 0 known-bug, 69/69; shots 592; freeze 280/280; parity 0/0/24. Land-ready must be on 53e1e48 (or newer), superproject rebased onto origin/main.
- Owner ruling 2026-10-23: survey S continues on 0dff966 (read-only; SC-485 does not touch FormModal/schemas). r1 implementer A rebases the dse branch onto 53e1e48 (and the superproject onto origin/main) BEFORE writing code.
- 2026-10-23 ~15:07Z: owner + S killed by session-limit 429 (reset 1:10pm ET). Resumed S via SendMessage; worktree clean at 0dff966, report already written.
- 2026-10-23 r0 DONE (S): recommendation B. Census 4 transforms in 2 of 8 schema'd elements (skills style select, skills[] + custom_skills[].skill_group YAML textareas, stamina style select). Reproduced all three ticket examples at 0dff966. Real pipeline lowercases in place before parse(); views compare style case-sensitively -> A alone gives a wrong preview. Trap 1 broken TODAY (controls drawn before first revalidate -> Chips/Sheet/required Alpha open blank). Trap 2 needs no extra code (stamina parse passes style through, serialize keeps declared keys -> Save writes `style: Sheet`). SC-488 labels/source-order unaffected. structuredClone undefined in jest dom env. Report sc489-r0-survey-report.md; probe artifacts in scratchpad/sc489-r0-survey-k7q2xm/.
- Survey tangent rulings (owner, 2026-10-23):
  - Sidebar `_dse_anchor` shallow-clone (pipeline.ts:149-156: sidebar-mounted `style: Sheet` renders the default bar): FILED SC-504 (Backlog, DSE Plugin + Bug, related SC-489 + SC-403). OUT OF SCOPE.
  - Save re-stringifies untouched keys' formatting/comments (option C territory, pre-existing): DROP — covered by SC-404 (form redesign before re-exposing).

## Design (owner decisions on the r0 survey, 2026-10-23) — the spec for r1

- D1. Validation never sees `this.working`. A module helper `cloneContainers(v)` recursively copies arrays and plain objects and keeps every other value by reference (NOT `structuredClone` — undefined in the jest dom env; NOT a shallow spread — `skills[]` / `custom_skills[]` would still mutate). `normalise()` clones `working`, validates the clone, and stores it as `this.checked`. Called once in `onOpen` BEFORE the field loop, and by every `revalidate()` (fresh clone each time).
- D2. Save (`currentBody()` / `save()`) writes the raw `working` — what the source said, plus only what the user changed. A value the user types (e.g. `- " Climb "`) is saved as typed.
- D3. The live preview parses `this.checked` with `currentBody()` as the body text (mirrors `pipeline.ts:473`: normalised data + un-normalised text). The SC-488 `Default (…)` labels build `absent` from `this.checked`. Both therefore keep matching the real render of the saved text.
- D4. Select display (required and optional): when `current` is non-null and not one of the options, but `checked[key]` is, the dropdown shows `checked[key]`. `working` is left alone (no change event), so an untouched `Chips` is saved as `Chips`. Picking another option writes that option (user change, SC-483 precedent). A value that normalises to no option (e.g. `Grid`) stays blank with the validation error, as today.
- D5. Taste call recorded as FYI for Scott in the land-ready comment, not a blocking ask: an untouched `style: Chips` shows as the option `chips` while Save keeps `Chips`. (Alternative rejected: a literal `Chips` option would list `Chips` next to `chips`.)
- D6. Tests: new `describe('SC-489')` in test/dom/authoring/formModal.test.ts, survey §5 rows 1–11, real elements + real ValidationService, red commit first. No existing assertion changes. No lifecycle scenario (G-S34 unused), no e2e manifest change, no shot change expected. Update the stale doc comments (FormModal.ts:237-240, the SC-488 "same working" comment).
- D7. CHANGELOG bullet under `## Unreleased` in the worktree superproject.
- 2026-10-23 r1: implementer A (orchestration:implementer, agent a122205c7c86d1d5d) on sc489-brief-r1-impl.md — rebase dse onto 53e1e48 + superproject onto origin/main first. Review -> fresh reviewer B (not S).
- 2026-10-23 dispatcher: dse origin/develop 53e1e48 -> 9f08f06 (SC-492: click guard in src/framework/kit/StaminaBarPanel.ts + lifecycle G-S32; no FormModal change). New baselines: jest 5847 / 1 / 241 of 242; lifecycle 34/34; e2e 108/108 ok, 0 failed, 0 known-bug, 69/69; shots 592; freeze 280/280; parity 0/0/24. Land-ready must be on 9f08f06 (or newer), superproject on origin/main.
- Owner ruling 2026-10-23: A's r1 retargeted to 9f08f06 by SendMessage; battery once on that tip. Expected jest 5847 + A's new tests / 1 / 241 of 242; lifecycle 34/34. Reviewer B's brief updated to the same numbers.
- 2026-10-23 ~18:15Z: A hung ~30 min (footgun 13: `rm -f $S/$g.rc $S/$g.log` held for a prompt). Dispatcher stopped it and resumed it: fresh filenames, no rm. State: dse 3708b54 (red) + 6cfc338 (fix) on 9f08f06, tree clean; superproject 220c0a7 (CHANGELOG) on 6a176e6. Battery pending on 6cfc338.
- 2026-10-23 r1 DONE (A): dse 6cfc338 (3708b54 red: 9 of 11 new tests red at base, 2 pins) on 9f08f06; superproject 220c0a7 (CHANGELOG) on 6a176e6. Files: FormModal.ts + formModal.test.ts only. Gates on 6cfc338: tsc/lint clean; jest 5858/1/241 of 242 (5847+11); lifecycle 34/34; e2e 108/108, 0 known-bug, 69/69; shots 592 rc 0 all in-run lines; freeze 280/280; parity 0/0/24. Drive-by: none. Follow-ups: D5 FYI (in design already); initiative-default-keys.test.ts 5 s timeout once at load ~26 on the superseded 53e1e48 run -> DROP (one-off under host load, passed on the final run, unrelated file).
- 2026-10-23 r1 review: fresh reviewer B (orchestration:reviewer, agent ac67bc0c46abd1732) on sc489-brief-r1-review.md at 6cfc338, incl. two real-Obsidian screenshots for Scott. origin/main moved to 3c7f392 meanwhile — superproject rebase at land-ready time.
- 2026-10-23 r1 review (B) DONE: LAND-READY at dse 6cfc338 on 9f08f06. 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 5 INFO. Real Obsidian base 1/8 (the 1 = SC-488 roll label, expected both), tip 8/8. Base Save for the shot steps: blank dropdown, `style: chips\nskills:\n  - climb\nonly_show_selected: true`; tip `style: Chips\nskills:\n  - Climb\nonly_show_selected: true`. 23 sources x 8 schema'd elements: 10 Save diffs, all expected transform cases; preview HTML and Default labels identical in all 23. Spy: validate never gets a working container at tip (0/16; base 13/13). Mutants: 4 survey mutants red; of 5 extras 4 red, labels-from-working survives (LOW-2). Gates at 6cfc338: tsc/lint clean; jest 5858/1/241 of 242 (first run 1 timeout INFO-3, re-run green); lifecycle 34/34; e2e 108/108, 0 known-bug, 69/69; shots 592 rc 0 all in-run lines; freeze 280/280; parity 0/0/24. Shots sc489-r1-shot-{form,saved}.png — owner eyeballed both: form Style dropdown shows "chips", Skills box `- Climb`, chips preview with Climb highlighted (Exploration 1/10); Source view after Save: block 1 `style: Chips` / `- Climb` / `only_show_selected: true`, block 2 (`style: chips` / `- Sneak`) and surrounding text unchanged. Report sc489-r1-review-report.md.
- Review rulings (owner, 2026-10-23):
  - LOW-1 (CHANGELOG "Save now keeps what you wrote and changes only what you edited" overclaims; Save still re-stringifies the whole block, comments dropped — SC-404): FOLD. Reviewer's fix verbatim: "reword to say what changed, e.g. "Save no longer lowercases or trims values you did not edit (`Climb` stays `Climb`, `style: Chips` stays `Chips`)". Keep the dropdown sentence."
  - LOW-2 (FormModal.ts:337 labels-from-`checked` has no test; mutant `{ ...this.working }` passes 52/52): FOLD. Reviewer's fix verbatim: "add one `describe('SC-489')` test with a derived def: Schema: `style` with `transform: [trim, toLowerCase]` and enum `[alpha, beta]`, plus an optional `mode` enum `[x, y]`. Parse: `{ mode: d.mode ?? (d.style === 'alpha' ? 'x' : 'y') }`. Assert: source `style: Alpha` shows `Default (x)` on the Mode select." Must be red against the `{ ...this.working }` mutant.
  - INFO-1 (FormModal.ts:210-213 "validation, the live preview and Save all see the same data" now imprecise): FOLD — comment only, reviewer's wording: "…all see the same keys (validation and the preview see the normalised copy)".
  - INFO-2 (test 11 identity indirect; mutants prove enough): DROP.
  - INFO-3 (initiative-default-keys.test.ts:459 5 s timeout, second sighting): FILED SC-506 (Backlog, DSE Plugin + Bug, related SC-489/SC-485/SC-360). OUT OF SCOPE.
  - INFO-4 (out-of-scope tickets not made worse): DROP, no action.
  - INFO-5 (B ran shots/lifecycle detached via setsid + blocking `tail --pid`; rc from script files): DROP — rc files are the evidence of record.
- 2026-10-23 r2: resume A (fix round: LOW-1, LOW-2, INFO-1 + superproject rebase onto origin/main 3c7f392 or newer; full battery once). Then scoped re-review by B (delta only).
- 2026-10-23 r2 DONE (A): dse 66f474b (LOW-2 test + INFO-1 comment) on 9f08f06 (r1 commits unchanged); superproject 21a9557 (+8131699, CHANGELOG only; A's first commit used -a and bumped the pointer — reset and recommitted, owner verified both commits touch CHANGELOG.md only) on origin/main 3c7f392. LOW-2 test red vs the `{ ...this.working }` mutant (Default (y) vs (x)), mutant reverted. Gates on 66f474b: tsc/lint clean; jest 5859/1/241 of 242 (no SC-506 flake); lifecycle 34/34; e2e 108/108, 0 known-bug, 69/69; shots 592 rc 0 all in-run lines; freeze 280/280; parity 0/0/24. Report sc489-r2-fix-report.md.
- 2026-10-23 r2 scoped re-review -> resumed reviewer B on sc489-brief-r2-rereview.md at 66f474b.
- 2026-10-23 r2 scoped re-review (B) DONE: LAND-READY at dse 66f474b on 9f08f06, superproject 21a9557 on 3c7f392. 0 BLOCKER/HIGH/MEDIUM/LOW, 2 INFO. range-diff r1 commits `=`; LOW-2 test red vs labels mutant (1/53), unmutated 53/53; superproject commits CHANGELOG-only, pointer still 9f08f06; A's r2a logs rc 0 and current. Report sc489-r2-rereview-report.md.
- Re-review rulings (owner, 2026-10-23): INFO-1 (CHANGELOG bold title "no longer rewrites what you wrote" still broad; body qualifies it): DROP — the body sentence states the exact scope. INFO-2 (CHANGELOG:16 not re-wrapped, 158 chars): DROP — cosmetic.
- 2026-10-23: LAND-READY. dse sc489-form-transform-rewrite @ 66f474b on 9f08f06; superproject @ 21a9557 on origin/main 3c7f392 (pointer unbumped). At landing: preserve this ledger dir to docs/superpowers/dse-overhaul/build-ledgers/sc489-form-transform-rewrite/.
- 2026-10-23: land-ready comment posted to SC-489 (both screenshots; D5 display choice as FYI). State stays Awaiting (landing by dispatcher). Reported land-ready to the dispatcher.
