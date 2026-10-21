# SC-466 decisions ledger — a write to a legacy ds-stamina-bar block adds default keys the user never wrote

Ticket: https://linear.app/tski-home/issue/SC-466
Worktree: /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults (every submodule on branch `sc466-stamina-bar-defaults`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `0ce76dd`); superproject (CHANGELOG) cut at `bfcdb71`.
Related: SC-432 (filed this ticket as its review INFO-5; parked, unlanded). SC-457 in flight in src/framework/host/ (fence locating) — do not touch that dir.

## Spec (ticket description, verbatim, 2026-10-21)

> Found by the SC-432 independent review (INFO-5). Predates SC-432.
>
> **Repro:** a legacy `ds-stamina` / `ds-stamina-bar` block containing only stamina fields. Apply any change from the stamina modal (a plain Damage is enough). The written block now also contains `collapsible`, `collapse_default`, `height` and `style` with their default values.
>
> **Expected:** a write changes only the fields the action touched; defaults the user never wrote stay implicit.
>
> Decide whether this is intended normalisation or a leak of resolved defaults into the serialiser.

## Scott rulings (verbatim, dated)

(none yet — thread had 0 comments at 2026-10-21 start)

Standing ruling that constrains this ticket (SC-169 round 2, Scott's ruling 2, backward compatibility, as recorded in src/elements/stamina-bar/definition.ts): `collapsible:` and `collapse_default:` are ComponentWrapper MODEL fields on this element — in the schema, on the model, re-emitted by its own serializer. An AUTHORED collapse key must keep round-tripping.

## Owner decisions

- 2026-10-21: Verdict on the ticket's question = LEAK, not intended normalisation. Root cause: `src/elements/stamina-bar/model.ts` serialize() is `stringifyYaml(model).trim()` over the StaminaBar instance, and StaminaBar.parse fills defaults into own properties (collapsible/collapse_default via ComponentWrapper, `height` 1, `style` "default", current/temp 0). The D1 "BYTE-COMPAT boundary" deliberately reproduced the legacy writer's bytes — including this leak. This ticket supersedes byte-compat ONLY for keys absent from the source.
- 2026-10-21: Rule for the fix: a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today.
- 2026-10-21: Blocks the plugin constructs itself (not parsed from a source: fromHero/fromCreature, insert-block paths) keep today's output unless the implementer finds they flow into user files with the same defect — report, don't change.
- 2026-10-21: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready to dispatcher. No visual change, so no Scott evidence round; Scott sees the verdict in the land-ready comment.

## Round log

- 2026-10-21: worktree created (`sc466-wt-new.log`, rc 0). dse origin/develop 0ce76dd, superproject bfcdb71.
- 2026-10-21 r1: implementer A (orchestration:implementer, agent a353c9845b24843ae) dispatched on `sc466-brief-r1-impl.md`. Identity A never reviews; review goes to reviewer B (Opus). Ticket -> Awaiting.
- 2026-10-21 ~10:00Z: owner + implementer A killed by session-limit 429 (A had reached tsc/lint). Resumed A via SendMessage after the 8:20am ET reset; dse develop still 0ce76dd.
- 2026-10-21 r1 DONE (A): dse e0e2fdc (2028881 red test, 06d60d8 fix+fixtures, e0e2fdc e2e STAM-W11 + docs) on 0ce76dd; superproject CHANGELOG 52a22fa. Fix: module-private WeakMap in src/elements/stamina-bar/model.ts records the default keys the source omitted; serialize() drops a key only if omitted AND still default. Gates: tsc/lint clean; jest 5423/1/232 of 233; lifecycle 29/29; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-094833-f457; STAM-W11 red on pre-fix model, run 20261021-094926-7b7d); shots 572; freeze 276/276; parity 0/0/24. All writers mutate the parsed instance in place; fromHero/fromCreature never reach a user stamina-bar block.
- Follow-up rulings (owner, 2026-10-21):
  - "Other ComponentWrapper elements (e.g. ds-skills) likely leak defaults the same way" -> filed SC-482 (Backlog, related to SC-466). OUT OF SCOPE for SC-466.
  - "A block authoring collapse_default after the stamina keys is reordered to class order on first write (pre-existing)" -> DROP: key order is deliberately unchanged by this ticket's rule; reorder predates it.
- 2026-10-21 r1 review: reviewer B (orchestration:reviewer, agent a0851fcab83d49091) dispatched on `sc466-brief-r1-review.md` at dse e0e2fdc.
- 2026-10-21 r1 review (B) DONE: LAND-READY at dse e0e2fdc / superproject 52a22fa. 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 3 INFO. B's gates match A: jest 5423/1/232 of 233; lifecycle 29/29; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-123331-17cf); shots 572; freeze 276/276; parity 0/0/24. 640-combination rule probe pass; 10/10 mutations red; 7 real-Obsidian probes green on fix, red on revert.
- Review rulings (owner, 2026-10-21):
  - LOW-2 (`model.ts:60` hasOwnProperty counts a key present-but-`undefined` as declared; FormModal clear-field -> `height: 1` written): FOLD. One-line fix `declared[key] === undefined` = absent, plus a jest test feeding parse data with `height: undefined` (and one for a cleared textarea-style string key if applicable).
  - LOW-1 (FormModal select seeds `style: default` on open, Save writes it; generic form, opt-in authoring controls): filed SC-483 (Backlog, related SC-466 + SC-482). OUT OF SCOPE. The r1 impl report's writer item 6 claim ("FormModal Save ... tracks the file") is wrong for `style`; recorded here, report not rewritten.
  - INFO-1 (a key the plugin wrote is removed again when it returns to its default on the same adopted view): DROP — matches the ruling's wording and returns the block to the user's original shape.
  - INFO-2 (PARSER_DEFAULTS duplicates parser defaults): DROP — tests catch drift.
  - INFO-3 (brief's `bash -c '…; echo rc=$? > file'` under devbox always records rc=0): process fix, not a ticket. r2 briefs use script files run through devbox (adapter footgun 1 already says so). Reported to dispatcher with land-ready.
- 2026-10-21 r2: fix round = resume implementer A (`sc466-brief-r2-fix.md`). Scoped re-review -> reviewer B.
- 2026-10-21 r2 DONE (A): dse 0c5022e (86e9cff red tests, 0c5022e fix) on e0e2fdc / 0ce76dd; superproject unchanged 52a22fa. `declared[key] === undefined` = absent. Gates: tsc/lint clean; jest 5426/1/232 of 233; lifecycle 29/29; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-130536-b972); shots 572; freeze 276/276; parity 0/0/24.
- 2026-10-21 r2 scoped re-review -> reviewer B (`sc466-brief-r2-rereview.md`), delta e0e2fdc..0c5022e.
- 2026-10-21 dispatcher: dse origin/develop 0ce76dd -> 1c271b5 (SC-470: scroll pin covers every Reading view; src/framework/host/previewScrollPin.ts + neighbours; lifecycle G-S15). New baselines: jest 5428 / 1 / 231 of 232; lifecycle 30/30; e2e 88/92, 4 known-bug, 64/64; freeze 276/276; parity 0/0/24. Land-ready must be on 1c271b5 (or newer), superproject rebased onto origin/main.
- Owner ruling 2026-10-21: re-review B narrowed to delta checks + targeted jest + mutation (no full battery on the soon-stale 0c5022e). Then r3 rebase round = resume A: rebase dse onto 1c271b5, superproject branch onto origin/main, full battery = evidence of record. Expected: jest 5446 (5428 + our 18) / 1 / 232 of 233; lifecycle 30/30; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64; shots 572; freeze 276/276; parity 0/0/24. Zero hand-resolved conflicts in src/ or test/ -> no re-review; any -> scoped range-diff check by B.
- 2026-10-21 r2 scoped re-review (B) DONE: LAND-READY on delta e0e2fdc..0c5022e, 0 findings at any severity. Tree clean at 0c5022e. B ran tsc, lint, jest 5426/1, lifecycle 29/29, e2e 89/93 ok, 4 known-bug, 64/64, shots 572 (freeze/parity not run; superseded by r3 battery). Report sc466-r2-rereview-report.md.
- 2026-10-21 r3: rebase round = resume implementer A on `sc466-brief-r3-rebase.md` (dse onto 1c271b5, superproject onto origin/main 7e48d25, full battery = evidence of record).
- 2026-10-21 r3 DONE (A): dse 08206e3 on 1c271b5 (1311420, 0699f09, 9daa9d6, 7b642d2, 08206e3); superproject 721e48e on origin/main 7e48d25 (CHANGELOG conflict in ## Unreleased resolved by keeping both bullets; owner verified: no markers, SC-470 then SC-466). Zero conflicts in src/ or test/ -> no re-review (owner ruling). Gates: tsc/lint clean; jest 5446/1/232 of 233; lifecycle 30/30; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 (run 20261021-135242-fcf4); shots 572; freeze 276/276; parity 0/0/24. LAND-READY.
- 2026-10-21: land-ready comment posted to SC-466 (no ask; state left Awaiting). Reported LAND-READY to dispatcher: dse 08206e3 on 1c271b5, superproject 721e48e on 7e48d25.
