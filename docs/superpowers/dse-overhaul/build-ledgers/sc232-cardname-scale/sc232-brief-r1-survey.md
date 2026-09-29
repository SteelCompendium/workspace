# SC-232 round 1 — survey: what size SHOULD the Steel card-head name be?

You are an independent Opus survey worker for ticket SC-232. Your final text goes to the
ticket-owner, not a human. **You make NO source edits this round** (measurement scripts in
scratch are fine). Workers never call the tracker (Linear) — not to read history, not to post.

## Context loading (read first)

1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`
   — the ledger. It carries the ticket's claim and the owner's reason to doubt it.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, branch
   `sc232-cardname-scale` in every submodule. `pwd`-check before running anything. DSE is at
   `draw-steel-elements/`, site CSS at `v2/docs/stylesheets/`. Inside
   `draw-steel-elements/`: `git fetch origin && git rebase origin/develop` first; expected
   head `619c4bd` (nothing to rebase). Never touch the shared main checkout
   `/home/scott/code/steelCompendium/workspace/` except to read the ledger dir and the
   `dse-verify` skill.
3. Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` —
   read "The battery", "Freeze semantics" (skim), "Parity semantics", "Capture-width
   convention", "Steel scoping rule".
4. `draw-steel-elements/visual-harness/parity/` (README, selector-map.json, compare.cjs) —
   how the parity gate normalizes site vs plugin sizes.

## The question

The ticket says the plugin's card NAME (`.dse-head__primary--left`, Steel) is 20px/23px vs a
site target of 24px/24.96px. The owner doubts the target: v2 `extra.css` pins
`html{font-size:125%}` (20px rem), and the site has per-family name overrides
(`steel-cardhead.css:99` 1.5rem generic; `steel-ability-cards.css:107` 1.85rem;
`steel-statblock.css:141` 2.3rem; `steel-featureblock.css:85` 2.1rem; project 1.35rem; index
preview 1.3rem; all x `--md-large-header-scale`), and `styles-source.css` has site->plugin
ratio comments (~7816, ~7915). Answer, with measured numbers:

1. **Site truth.** Computed `font-size` / `line-height` / `letter-spacing` of
   `.sc-head__left-primary` per family (ability card, statblock, featureblock, kit/generic
   card head, anything else the plugin also renders), at the viewport the parity gate uses.
   What is `--md-large-header-scale`? What is the root font-size there? Measure with a real
   browser (the parity harness's own tooling / Playwright is fine), not by reading CSS alone.
2. **Plugin truth.** Same properties of `.dse-head__primary--left` (and `.dse-card__title` if
   that is the kit/reference-card name) per family, in the harness at 900px Steel dark, and
   in print (`data-dse-print="on"`). Which rules set them (file:line)? Is the name size a
   token (`--dse-fs-*`)? Is it one shared rule or per-family?
3. **The mapping convention.** How does the plugin translate site sizes (20px-rem site) into
   plugin sizes (16px-rem Obsidian) elsewhere — raw px parity, the 0.8 rem ratio, a
   documented ratio? Cite the precedents (the ~7816/~7915 comments, DESIGN.md
   `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/DESIGN.md`, the D3 token
   map `docs/superpowers/dse-overhaul/D3-token-map.md` in the worktree superproject). How did
   the section-title pair (SC-235: site 18px vs plugin 16px) get compared — same convention?
   State plainly whether the ticket's "83%" holds under the project's own convention, and
   what the correct % is per family.
4. **Blast radius.** Which families/captures would move if the name grows? Does the print
   layer share the size rule (i.e. will frozen `*--steel-print` / `*realprint` bytes move)?
   Check `.superpowers/sdd/freeze-baseline.sha256` (main checkout, read-only) to name which
   frozen captures contain a card-head name. Interaction with the head's row-gap, crest
   centering, the right rail, and narrow widths.
5. **Overlap.** SC-284 (unlanded) edits `.dse-head` narrow stacking in the cardHead block of
   `styles-source.css`. Identify the lines a name-size change would touch and whether they
   are in or adjacent to that block. (Branch may exist locally: `git -C
   /home/scott/code/steelCompendium/workspace/draw-steel-elements branch -a | grep -i 284` —
   read-only.)
6. **Options.** 2–4 concrete options (exact CSS values + which selector), each with the
   resulting plugin px per family, % of site under the project's convention, crest/name
   ratio, and expected freeze/parity movement. Recommend one and say why. Include the
   "per-family like the site" option vs "one shared size" option if both are plausible.

## Rules

- Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/` (`pgrep -af "worktrees/sc232-cardname-scale/"`, check each
  line). Never `pkill`/`killall` by pattern — other sessions run the same gate commands.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`. Redirect long output to files under
  your own unique scratch path, never stream it (600s silent-agent watchdog). Never key a
  wait-loop on a scratch filename or contents — the scratch dir is pre-populated across
  sessions. Never background a job and wait for a notification: run in the foreground.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-232:`.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r1-survey-report.md`.
It must open with a **≤10-line executive summary** (the recommended option with exact values,
the corrected % figure, whether print/freeze moves, the SC-284 overlap verdict). Then the
measured tables, then options. Final text: verdict + recommended values + path of the report
and of every artifact (measurement scripts, raw JSON).
