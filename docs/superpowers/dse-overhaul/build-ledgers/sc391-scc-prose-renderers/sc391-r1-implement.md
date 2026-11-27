# SC-391 R1 implement report

## Executive summary
- Verdict: DONE. Nine prose types render a real card in `ds-scc` via a new internal family `ds-prose` (id `prose`); explicit list of nine, unknown type keeps "has no renderer".
- dse branch `sc391-scc-prose-renderers`, head `9eb5ffa3` (base `4b233886` = origin/develop, no rebase needed). Not pushed; superproject pointer untouched.
- Gates: tsc (incl. e2e) clean, lint clean, jest 14805 passed / 1 skipped (shots cache present; base 14731/1 -> +74), lifecycle 64/64 (21+16+9+4+7+4+3), e2e `OBSIDIAN-E2E done: 845/854 ok, 0 failed, 9 known-bug, coverage: 487/487 pairs`, shots 636 PNGs (592 + 44 new), freeze `280/280`, parity `0 gap(s), 0 undeclared warning(s), 24 declared`.
- styles.css: unchanged by construction (styles-source.css and esbuild config have zero diff vs base; no CSS added). Built sha256 a4dfc387dba23dfa78e422a2bc1ed882c1a459a89608266e0244cbb02c83423d. A clean base build was not rebuilt for a byte compare.
- `genericLayout` (rule) untouched; 0 frozen bytes moved.

## Commits (dse, oldest first)
- b1b5d358 feat(scc): render the nine prose compendium types as a prose card
- c5578b7e test(harness): by-SCC prose fixtures
- e9e6fbf3 docs: prose types render in ds-scc; changelog
- 714fe245 test(e2e): prose card draws in Reading view; Open chapter link opens the note
- 9eb5ffa3 test: chromeRollout covers the prose family

## What changed
- `src/services/typeAdapters.ts`: `PROSE_TYPES` (9), `PROSE_TYPE_RE` (anchored; `monster` exact), `genericNoteAdapter(PROSE_TYPE_RE, 'ds-prose')` appended last in TYPE_ADAPTERS.
- `src/elements/display/prose.ts` (new): `proseLayout` (steel composition keyed by type), `PROSE_TYPE_STYLE` (plain eyebrow + Lucide crest per type), `firstParagraph`, `proseLabel`. Chapter = first plain paragraph + "Open chapter" `a.internal-link` (data-href = synced note path, stamped `data-dse-control="prose.open-chapter"`); empty-body chapter = title-only; no source file = no link.
- `src/elements/display/displayFamily.ts`: `genericCard` takes optional `layout` and `chromeLabel` (defaults keep rule byte-identical).
- `src/elements/display/index.ts` (+ `prose/example.yaml`): `proseElement` (id `prose`, alias `ds-prose`), added to INTERNAL_DISPLAY_ELEMENTS. `src/elements/scc/definition.ts`: `'ds-prose'` in BASE_BY_ALIAS.
- Collapsed chrome line reads "Skill: Alchemy" etc.
- Docs: `docs/compendium-sync.md` (what renders), `docs/index.md`, `docs/advanced-usage.md`, `docs/migrating-to-7.md`, `README.md`, `.repo-docs/integration.md`, `AGENTS.md`, `CHANGELOG.md` (bullet at top of the 7.0.0 unreleased section; dse has no `## Unreleased` header).

## Tests added
- `test/dom/elements/proseCard.test.ts` (new): nine types through real by-SCC stack (title, eyebrow, crest, `data-dse-element=prose`, no notice), full body to renderMarkdown for the 8 non-chapter types, skill-group table + monster `####` headings, collapsed label, scc.v1 link rewriting, chapter compact (first paragraph only, link + control id, empty = title-only, no-source = no link), `firstParagraph`, eyebrow guard/fallbacks, family id not negotiation/project/skills.
- `test/dom/elements/sccElement.test.ts`: nine types -> `prose`, `rule`/`statblock` unchanged, near-miss types still undefined, real unclaimed-type file still shows "has no renderer".
- `test/unit/kit/crestIconValidity.test.ts`: each prose crest is a canonical Lucide id.
- `test/dom/visual-harness/fixtures.test.ts`: each `prose/<fixture>` resolves (title + eyebrow); PROSE_COMPENDIUM seeded only in `prose` mode; FIXTURE_COMPENDIUM list updated.
- `test/dom/framework/chromeRollout.test.ts`: `prose` row (fix for the completeness check).
- e2e `e2e/specs/compendium/prose-card.e2e.ts` (PROSE-C01 skill card in Reading view, PROSE-C02 chapter compact + real pointer click on Open chapter opens `DS Compendium/chapter/combat.md`) + `e2e/manifest/prose.ts` (`prose.open-chapter` x click; +1 pair, 486 -> 487). Click verified in real Obsidian 1.14.4.
- Real md-dse fixtures copied into `test/fixtures/md-dse/` (skill/crafting/alchemy, skill/group/crafting, monster/group/goblin, religion/saint/atossa-the-shepherd, religion/god/adun, chapter/combat, chapter/the-summoner-class, project/build-airship, movement/climb-or-swim, negotiation/discovery).

## Visual harness
- `visual-harness/entry.ts`: FIXTURES key `prose` (appended last so no gallery section above it moves) with `default` (inline) + `skill, skill-group, monster, saint, god, chapter, chapter-empty, project, movement, negotiation` by SCC code. New mode `prose` = frozen `fixtures` seed + `PROSE_COMPENDIUM`; `HARNESS_COMPENDIUM` left at exactly its two frozen files.
- Screenshots (steel theme, screen = `--steel-dark` / `--steel-light`; also `-print` / `-realprint`), all in `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers/draw-steel-elements/visual-harness/shots/`:
  - prose-skill, prose-skill-group (table), prose-monster (### headings, long), prose-saint, prose-god, prose-chapter (compact + link), prose-chapter-empty (title-only), prose-project, prose-movement, prose-negotiation, prose (inline default); each as `<name>--steel-dark.png` and `<name>--steel-light.png`.
  - Viewed: chapter, chapter-empty, skill, skill-group, monster rendered correctly (crest, plain eyebrow, title, body, table, headings, Open chapter link).

## Gate logs (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r1-impl-x7k3/`)
g-tsc.log, g-lint.log, g-jest2.log, g-lc1..g-lc7.log, g-e2e.log, g-shots.log, g-freeze.log, g-parity.log, e2e-prose.log.
Shots host-leak sweeps all OK (button 165 kinds / 990 comparisons, modal 11 scenarios / 43 kinds / 258, input 176, table 278, list 352, inline, checkbox 116, prose); `capture clip OK (152 ...)`.

## Drive-by fixes:
None.

## Follow-ups:
- `.repo-docs/architecture.md` (~line 192) still says "the eleven D6 reference cards"; now twelve with `ds-prose` (left alone: prose-only wording, no design choice, but outside the touched set).
- Chapter `monsters.md` opens with a table, so its compact card is title + "Open chapter" link only (no paragraph); `firstParagraph` deliberately skips headings/tables/quotes/lists. Owner may want a different rule.
- Project prose bodies repeat their frontmatter fields as bold lines (SC-704 dedicated card covers it).
- `npm run obsidian-shots` (real-Obsidian ground-truth PNGs) was not run; no display on `:1` was used. The only real-Obsidian evidence is lifecycle + e2e (incl. the chapter link click).
- Jest count 14805/1 is with the shots cache present (fresh worktree reads one fewer passed, 2 skipped).
- Lifecycle parts used: 1 = G-S7a..G-S9a (21), 2 = G-S9b..G-S40 (16), 3 = G-S45..G-S64 (9), 4 = G-S57,G-S62,G-S61,G-S56 (4), 5 = G-S59..G-S91 (7), 6 = G-S92,G-S96,G-S97,G-S99 (4), 7 = G-S108,G-S112,G-S115 (3). Parts over 180 s auto-backgrounded by the harness; waited by `tail --pid`.
