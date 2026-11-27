# SC-707 decisions ledger

Ticket: SC-707 — "DSE: typing inside an initiative tracker block gets no field suggestions (the element has no schema)".
Owner: ticket-owner on Opus 5.5 (Scott asked this session for owners on Opus 5.5 instead of Fable).
Worktree: /home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest (branch sc707-initiative-schema-suggest in every submodule).
Base: dse develop 17187e4c, workspace origin/main 91d24ac4.

## Scott rulings (verbatim, dated)

(none yet)

## Dispatcher constraints (2026-11-27)

- "SC-419 filed this ticket. Its docs owner is parked on Scott with an unmerged rewrite of docs/initiative-tracker.md, in worktree sc419-dse-7-docs, so don't edit that docs page."
- "Report land-ready and stop; the dispatcher lands."

## Owner rulings (2026-11-27)

Facts found at 17187e4c:
- `def.schema` is read by pipeline validation (src/framework/pipeline.ts:407), the form editor (formModel.ts, FormModal.ts), scaffold (scaffold.ts, fallback only — initiative has authoring.example) and the in-block autocomplete (src/authoring/schemaSuggest.ts).
- The autocomplete only suggests TOP-LEVEL keys (and enum values of top-level keys); every indented line is suppressed on purpose ("Finding 2": a wrong suggestion is worse than none). So even with a schema, `max_stamina:` (nested under each hero / creature) would get nothing. The initiative block's top level has only name, round, heroes, enemy_groups, malice.

O1. A suggestions-only schema is acceptable. It goes in a new optional `authoring` slot read ONLY by the in-block autocomplete — never by validation, the form editor, or scaffold — so how blocks parse and which blocks show error cards does not change. The `definition.ts` "Deliberately NO schema" comment still holds for `def.schema` and gets updated to point at the new slot.

O2. Nested-key completion is in scope for this ticket. The ticket's own examples (`max_stamina:`) are nested, so top-level-only would not fix the reported symptom. The completion resolves the cursor's YAML path (indentation + block-sequence `- ` items) against the schema and suggests only when the path resolves unambiguously; anything it can't resolve (flow style, block scalars, odd indentation) still offers nothing. It applies to every element with a schema, not just initiative.

O3. The suggestions schema lists author-facing keys only. Keys the tracker writes for itself during play (turn flags, pool bookkeeping) are left out unless an author would reasonably type them. The implementer reports both lists; the owner checks them. A jest test guards drift: every key in the suggestions schema must be a key the initiative parser actually reads.

O4. Not touched: docs/initiative-tracker.md (SC-419). SC-678 (key-side mid-word marker) and SC-676 markers stay as they are.

## Base moves

- 2026-11-27 dispatcher: dse origin/develop -> e38f7838 (SC-692, src/authoring insert commands, styles.css unchanged); workspace origin/main 5c6dcc61. Baselines: jest 15044 passed / 2 skipped fresh; lifecycle 64/64; e2e `944/964 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs`; shots 636, freeze 280/280, parity 0/0/24. Rebase before land-ready. Implementer told via SendMessage.

## Rounds

- R1 implementer: slot + initiative schema + nested completion + tests + CHANGELOG. Brief: sc707-brief-r1-impl.md. Report: sc707-r1-impl-report.md.
- R1 implementer DONE at aa06a043 (rebased on e38f7838): jest 15090/2 skipped fresh (+46), lifecycle 64/64, e2e 948/968 ok, 0 failed, 20 known-bug, 540/540 pairs; styles.css identical to clean e38f7838 (shots/freeze/parity carry).

## Owner rulings on R1 follow-ups (2026-11-27)

O5. O3 key lists accepted as reported: `round` included, `with_captain` excluded (author route is `with_captain_stamina`), `conditions` offered as a key with its entries undescribed, `statblock` typed string.
O6. FOLD: `docs/writing-blocks.md` lines 57-58 now wrong ("deeper, indented fields are not suggested yet") — fix in this ticket. SC-419's worktree does not touch writing-blocks.md (it touches initiative-tracker.md, yaml-basics.md, mkdocs.yml — do not touch those three).
O7. FILED SC-712: suggestion descriptions are not rendered (renderSuggestion writes the value only) — needs a taste call.
O8. FILED SC-713: the key list offers keys already present at that level (pre-existing at top level; now nested too).
O9. DROP: ds-hero `state.*` nested keys become suggestible with the gate on — ds-hero is hidden + deferred and `state` is in its own schema; trimming belongs to whoever un-defers ds-hero.
O10. RELAY (to dispatcher for SC-419): implementer says docs describe `statblock` as "or inline object" but the initiative parser only resolves strings. Unverified by owner.
- R1 docs follow-on DONE at 4da5ef69 (docs/writing-blocks.md only).
O11. FOLD into the fix round: drop the Roll-block `tiers` example from docs/writing-blocks.md — Roll is behind the Experimental setting, so most readers can't see it work. Keep the initiative and Skills examples.
- R2 reviewer dispatched at 4da5ef69. Brief: sc707-brief-r2-review.md.
- R2 reviewer: FIX-ROUND at 4da5ef69 — MEDIUM 1, LOW 1, INFO 3. Gates matched the implementer's. Report: sc707-r2-review-report.md.

## Owner rulings on R2 (2026-11-27)

O12. FIX MEDIUM-1 (quoted value containing ` #` read as an unclosed quote in schemaPath.ts valueOf/afterKey; also before flowBalance) as the reviewer prescribed, plus its 4 jest cases.
O13. FOLD LOW-1: drop the Roll `tiers` mention from the CHANGELOG bullet (same reason as O11); keep initiative + Skills.
O14. FOLD INFO-2: add one real-Obsidian e2e case accepting a nested enum value (`squad_role:` under a creature → pick `captain`, assert saved note bytes), next free id AUTH-K21.
O15. DROP INFO-1 (drift guard holds: bogus keys fail at all 5 levels; tracker keys caught by test 4's exclusion list). DROP INFO-3 (no defect).
- R3 fix round: implementer resumed (author of R1). Scoped re-review goes to a fresh reviewer identity.
- R3 implementer DONE at 3a09fc95 (base still e38f7838): jest 15094/2 skipped fresh, lifecycle 64/64, e2e 949/969 ok, 0 failed, 20 known-bug, 540/540 pairs; styles.css unchanged. Also: a quote only opens at the start of a token (apostrophe in `Bob's` opens none) — re-reviewer to probe.
- R4 scoped re-review dispatched (fresh reviewer identity) on 4da5ef69..3a09fc95.
- R4 re-review: LAND-READY at 3a09fc95, LOW 4, INFO 2. Gates matched (jest 15094/2, lifecycle 64/64, e2e 949/969 ok 0 failed 20 kb 540/540, styles.css unchanged). Report: sc707-r4-rereview-report.md.

## Owner rulings on R4 (2026-11-27)

O16. FOLD LOW-1, LOW-2, LOW-3, LOW-4 into one more small fix round (R5). All are in src/authoring/schemaPath.ts and its test file, each fix is prescribed, and LOW-1..3 are wrong-suggestion cases that O2 rules out. Fixes as the R4 reviewer prescribed: LOW-1 open a quote only at text start or after `[ { , :` (prev non-space char); LOW-2 if a flow line ends inside a quote, the walk gives up (null) — or carry quote state, whichever is simpler and safe; LOW-3 check `st.quote` before BLANK_OR_COMMENT; LOW-4 add the reviewer's probe cases killing mutants M1–M4 (M5 needs no test).
O17. DROP INFO-1, INFO-2 (no defect).
- R5: implementer (author) fixes; R6 scoped re-review by the R4 reviewer (not the author) on 3a09fc95..HEAD.
- R5 implementer DONE at b8eb0aaa (base e38f7838): jest 15099/2 fresh, lifecycle 64/64, e2e 949/969 ok 0 failed 20 kb 540/540, styles.css unchanged. Only schemaPath.ts + its test changed.
- R6 scoped re-review: R4 reviewer resumed on 3a09fc95..b8eb0aaa (probes + jest; implementer's e2e/lifecycle accepted since the delta is a pure line-scanner with jest coverage).
- R6 re-review: LAND-READY at b8eb0aaa; LOW 2 (LOW-5, LOW-6), INFO 1. jest 15099/2 fresh, tsc+lint clean. Report: sc707-r6-rereview-report.md.

## Owner rulings on R6 (2026-11-27)

O18. DROP LOW-5: needs a YAML tag/anchor/`?` before a quoted `#` value inside a flow list (plus a stray `]` for a wrong list). DSE blocks don't use tags or anchors in flow lists; chasing every YAML corner in a line scanner has no end. Recorded here, not ticketed.
O19. FOLD LOW-6 as a test-only commit: add `conditions: [a,⏎ "b⏎ c # d", e]` and its stray-`]` variant, both expecting nothing. No source change, so gates are tsc + lint + jest; lifecycle/e2e carry from b8eb0aaa (identical src/).
- R7 implementer DONE at 545a4804 (test-only, +8 lines in schemaPath.test.ts; owner verified diff stat): tsc+lint clean, jest 15101/2 fresh; M10 now fails 1 test. src/ identical to b8eb0aaa, so lifecycle 64/64 and e2e 949/969 ok 0 failed 20 kb 540/540 carry.
- LAND-READY 2026-11-27: dse branch sc707-initiative-schema-suggest @ 545a4804 on develop e38f7838. Land-ready comment posted on SC-707. Reported to dispatcher.
