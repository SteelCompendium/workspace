# SC-391 decisions ledger — ds-scc: 9 prose compendium types render "has no renderer"

Owner: ticket-owner (Opus 5.5, per Scott 2026-11-26 "Let the ticket owners run under opus 5.5 and continue").
Worktree: `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers` (branch `sc391-scc-prose-renderers` in every submodule).
Base at creation (2026-11-26): workspace `e596a51c` (worktree superproject), dse `develop` `4b233886`, steel-etl `1b57338`.
Gates: `dse-verify` CURRENT @ `4b233886`: tsc+lint clean · jest 14730 passed / 2 skipped fresh · lifecycle 64/64 (seven parts) · e2e `OBSIDIAN-E2E done: 843/852 ok, 0 failed, 9 known-bug, coverage: 486/486 pairs` · shots 592, freeze 280/280, parity 0 / 0 / 24.

## Ticket (no Scott rulings in the thread at pickup — 0 comments)

Description, verbatim core: "The reference insert (`src/authoring/compendiumInsert.ts:360`) offers every compendium entry, but `ds-scc` only renders types with a `baseForType` mapping and a `ds-*` block. In today's md-dse output, 219 files across 9 prose/display types hit the `"<name>" (type: <t>) has no renderer in this plugin.` card [...] These nine need a different answer: a generic note/prose card family in DSE (and the md-dse emitter giving them a block), dedicated cards, and/or filtering the insert palette to renderable types."

Counts: skill 57, monster (group lore) 51, saint 28, chapter 26, project 16, movement 13, negotiation 12, god 11, skill-group 5.

## Related standing context
- SC-390 (landed) fixed companions (`feature-group` -> `type: statblock`); its ask item 4 added a "what renders / what doesn't yet" line to `docs/compendium-sync.md` (+ `docs/index.md`).
- Scott's 2026-10-17 SC-390 "approved" covered SC-390 only; nothing about SC-391's approach.

## Rulings
(no Scott rulings yet)

## Owner decisions (2026-11-26, after R0) — defaults to build; shown to Scott at review for override
- **Approach: Option A** (R0 survey §4/§5): one internal prose family in DSE, reusing `genericNoteAdapter` -> `GenericNote` -> `DisplayCardView`, keyed by entry type. No steel-etl / emitter change (B rejected), no per-type dedicated cards (C deferred), no palette filter (D rejected).
- **Explicit list of the nine types, not a catch-all.** An unknown future type keeps the loud "has no renderer" card (a structured type with a too-narrow family regex must not quietly degrade to prose). Types: `skill`, `skill-group`, `monster` (exact `^monster$`; group lore), `saint`, `god`, `chapter`, `project`, `movement`, `negotiation`.
- **Chapters render compact**: title + first paragraph + an "Open chapter" link to the synced compendium note in the vault (omit the link if the file can't be found). Empty-body chapters (2) give a title-only card. Every other type renders its full body.
- **Projects: prose card now; dedicated card filed as SC-704** (Backlog, related to SC-391). Out of scope here.
- **Eyebrow = plain type label**: Skill, Skill group, Monster group, Saint, God, Chapter, Project, Movement, Negotiation. Richer data-driven wording is NOT in scope (ask Scott at review).
- Family id must NOT be `negotiation`, `project` or `skills` (element-scoped tracker CSS). `genericLayout` (rule) stays byte-identical — 0 frozen bytes expected.

## Rounds
- R0 survey (orchestration:reviewer) done 2026-11-26. Report: `sc391-r0-survey.md` (recommends A; 4 Scott questions, answered above as owner defaults).
- R1 implement (orchestration:implementer) — brief `sc391-brief-r1-implement.md`, report `sc391-r1-implement.md`.
- R1 done 2026-11-27: dse head `9eb5ffa3` on `4b233886` (5 commits). Family `ds-prose` / id `prose`. Gates: tsc+lint clean · jest 14805/1 (shots cache) · lifecycle 64/64 · e2e 845/854 ok, 0 failed, 9 known-bug, 487/487 · shots 636 (592+44) · freeze 280/280 · parity 0/0/24 · styles.css unchanged (no CSS diff).
  - Follow-up rulings (owner): `.repo-docs/architecture.md` ~:192 "eleven D6 reference cards" -> fold into the next fix round. Chapter `monsters.md` opens with a table so its compact card is title + "Open chapter" link only -> accept (the link is the point of a compact chapter); mention to Scott. Project prose repeats frontmatter fields -> covered by SC-704. obsidian-shots not run -> drop (harness shots + e2e are the evidence).
- R2 review (orchestration:reviewer, fresh identity) dispatched 2026-11-27 — brief `sc391-brief-r2-review.md`, report `sc391-r2-review.md`.
- R2 review done 2026-11-27: verdict LAND, 0 BLOCKER/HIGH/MEDIUM, 3 LOW, 5 INFO. Corpus probe: exactly the 219 changed resolution (all -> prose), nothing else moved. Mutation controls: new tests not vacuous. Gates matched R1 (lifecycle skipped with reason; styles.css identical to a clean base build).
  - Owner rulings on findings:
    - LOW-1 (eleven -> twelve family counts in `AGENTS.md:74`, `.repo-docs/integration.md:129`, `.repo-docs/architecture.md:192`, `src/elements/display/index.ts:173`; stale comment `src/elements/project/view.ts:95`) -> FOLD into R3.
    - LOW-2 (empty-body chapters show a divider plus an empty ~35 px strip) -> FOLD into R3: no divider and no empty body strip on a card with zero bands. Prefer scoping it to the prose family's layout; touching the shared card shell is allowed only if freeze stays 280/280.
    - LOW-3 (`firstParagraph` splits on blank lines only; setext heading / fence with blank line could leak) -> FOLD as a one-line limit note in the comment (no corpus case; no logic change).
    - INFO-1 (epigraph as first paragraph for two chapters; `monsters` chapter link-only) -> mention to Scott, no code.
    - INFO-2 (steel-etl linker starts links mid-word, e.g. `l[and prone]`) -> FILED SC-705 (Backlog, ETL+Bug, related SC-391). Out of scope.
    - INFO-3/4/5 -> drop (no defect; reviewer confirmed callers and scoping).
- R3 fix round: resume R1 implementer with the LOW findings verbatim. Then scoped re-review of the delta by a different identity (not R1, not necessarily R2... R2 reviewer may re-review the delta since it did not author it).
- R3 done 2026-11-27: head `44bab481` (+`f3f6b161`, `44bab481` on `9eb5ffa3`). LOW-1/2/3 fixed. LOW-2 via one prose-scoped CSS rule (`[data-dse-element='prose'] .dse-card:not(:has(> .dse-card__band)) > .dse-head`, screen only, not print) -> styles.css CHANGED (sha `50436d6b…`). jest 14806/1 · shots 636 · freeze 280/280 · parity 0/0/24 · e2e PROSE-C01/C02 2/2 (full e2e and lifecycle not re-run).
- R4 scoped re-review of `9eb5ffa3..44bab481` -> R2 reviewer (did not author). Report `sc391-r4-rereview.md`.
- R4 re-review done 2026-11-27: LAND, 0 findings above INFO. styles.css = base + exactly one prose rule; of 636 shots only the 2 prose-chapter-empty screen shots changed. Full e2e 845/854 ok, 0 failed, 9 known-bug, 487/487; jest 14806/1; freeze 280/280; parity 0/0/24.
  - INFO-1 (test pins CSS text) -> drop (shots are the behavioural evidence). INFO-2 (stale counts in `CardLayout.ts:39,179`, `withReference.ts:72`) -> drop: comment-only, not worth another round + re-review.
- LAND-READY 2026-11-27: dse `sc391-scc-prose-renderers` @ `44bab481` on develop `4b233886`. Reported to dispatcher. Scott comment `sc391-c1-landready.md` (non-blocking ask on the 4 owner defaults).
