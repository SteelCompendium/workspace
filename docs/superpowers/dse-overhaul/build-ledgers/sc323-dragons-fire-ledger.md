# SC-323 decisions ledger — "Dragon's Fire" is listed as a "common" ability

Ticket: https://linear.app/tski-home/issue/SC-323
Worktree: /home/scott/code/steelCompendium/worktrees/sc323-dragons-fire (every submodule on branch `sc323-dragons-fire`)
Baselines at cut (2026-09-14): steel-etl f90da5f (= origin/main), v2 2f4e8e2 (= origin/main)

## Scott's rulings (verbatim, dated)

- 2026-09-14 (ticket description): "In the site, "Dragon's Fire" is listed under "common".  Im not sure where its supposed to go, but i doubt it goes there."

## Owner findings (2026-09-14)

- Root cause: `steel-etl/input/heroes/Draw Steel Heroes.md` line 23156 tags Dragon's Fire `<!-- @type: ability -->` inside the `rule.treasure/enhancement` ("Imbue Armor") section, under the "Dragon Soul II" 9th-level armor enhancement. `internal/content/ability.go` only recognises class/kit/ancestry/treasure ancestors as an ability's parent; a `rule` ancestor is not one, so it falls to the `common` bucket (`feature.ability.common/dragons-fire`).
- `steel-etl/docs/site-builder.md` (searchBoostFor paragraph) wrongly calls dragons-fire "ancestry-granted".
- Only inbound reference to the code: `internal/site/project_cards_test.go:29` (test fixture). No source-document links to it.
- Registry is not frozen (`pipeline.yaml` classification.freeze: false); a code move is a normal gen.

## Owner decision (2026-09-14, pending Scott's confirm)

- New code: `mcdm.heroes.v1/feature.ability.treasure/dragons-fire` — flat `treasure` bucket, mirroring `common`'s flatness; the granting page is carried as a frontmatter link (`granted_by: mcdm.heroes.v1/rule.treasure/enhancement`), per the scc-reference rule "relationships are frontmatter links, never path nesting". Browse: Features → Abilities → Treasure → Dragon's Fire.
- Alternatives to offer Scott: (b) `feature.ability.enhancement/dragons-fire` (bucket named after the rule id); (c) de-classify — drop the tag, keep it inline on the Imbue Armor page with no own page/permalink.

## Round 1 review rulings (owner, 2026-09-14) — review report: sc323-review-r1-report.md

- HIGH-1 (bucket index renders as treasure-item cards): FIX. `richCardTypes["treasure"]` must not claim a dir under `feature/ability` or `feature/`; add the `featureKind(dir) != ""` early return the reviewer prescribed so `buildFeatureIndexContent` renders ability preview cards with deck "Treasures".
- HIGH-1b (label "Treasures" vs docs "Treasure"): KEEP "Treasures" (parallels the "Kits" bucket label; no code change). FIX the docs to say "Treasures": CHANGELOG bullet, docs/scc-reference.md, docs/scc-log.md, and the owner's comment draft.
- MED-2 (feature.go pre-gates on any-level ancestors; ability.go is nearest-ancestor-wins): FIX — make feature.go nearest-ancestor-wins, identical semantics to ability.go, and add `companion` to `findTreasureRuleAncestor`'s switch. Precedence ruling (also closes LOW-4): **nearest recognised ancestor wins** in both parsers, so a treasure rule nested inside a class section yields the treasure bucket (hypothetical in today's corpus). Correct the scc-log wording so it states this accurately.
- MED-3 (`granted_by` absent from JSON/YAML/API metadata): FIX — add `granted_by` to the sdk_transform allowlists (`buildAbilityMetadata`, `buildTraitMetadata`, and the plain-feature metadata builder if separate) so every format carries it; verify with grep on the regenerated JSON/YAML and the API resolve payload.
- LOW-5 (typePath unguarded when `book` missing): DROP — `book` is always on the context stack in the pipeline; the guard only matters in bare unit contexts.
- LOW-6 (feature.go treasure branch drops an intervening feature-group id): DROP as intended — the treasure bucket is flat for both abilities and features, mirroring the flat `common` ability bucket; add a one-line code comment saying so.
- LOW-7 (no alias for the retired common code): DROP — zero inbound refs; matches scc-log precedent.
- Screenshot gap: FIX — capture `Browse/feature/ability/treasure/` (the bucket index) after HIGH-1 is fixed.

## Round 2 rulings (owner, 2026-09-14) — fix report: sc323-impl-r2-report.md
- Round-2 shas: steel-etl d619637, 23de092; superproject e2ac233.
- Implementer follow-up (AbilityParser: companion ancestor + a farther-out treasure rule would set `granted_by` while the path stays companion): DROP unless the re-review finds a reachable corpus path — treasure rules live only in the treasure chapter, companions only in the beastheart book. Reviewer asked to confirm unreachability in the scoped re-review.

## Round 2 re-review rulings (owner, 2026-09-14) — sc323-review-r2-report.md: APPROVE, 0 HIGH/MED, 2 LOW, 2 INFO
- LOW-1 (scc-reference/scc-log overclaim "identically in both parsers" / shared helper): FOLD — docs-only correction in round 3.
- LOW-2 (feature_index_test doesn't assert the "Treasures" deck label): FOLD — add the assertion in round 3.
- INFO-1 (featureKind matches any `feature` path segment): DROP — pre-existing convention, no site dir is named `feature`.
- INFO-2 (footer sha is hand-authored mkdocs.yml value): DROP — not a defect.
- Implementer follow-up (companion + treasure rule): confirmed UNREACHABLE (treasure rules only in heroes, companions only in beastheart, context stack is per document). Stays dropped.
- Round 3 is docs + one test assertion; owner verifies the diff and test run directly (small non-runtime delta), no further review round.

## Posted to Scott (2026-09-14) — Needs Review
- Comment with 4 screenshots posted; state In Progress + `Needs Review`. Ask: confirm the "Treasures" bucket (alternatives: rule-id bucket, or de-classify).
- Branch state: worktree sc323-dragons-fire, steel-etl c4e0526 (4 commits over origin/main f90da5f), superproject 23a305a. Gates green, registry 3,086 with exactly one code moved. Land-ready pending Scott's confirm; landing is the dispatcher's move.
