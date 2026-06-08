# Handoff — 2026-06-08

## Active efforts

- **Rule/glossary SCC linking — Phase 6 in-prose sweep** — IN FOCUS, IN PROGRESS.
  Infra + glossary done & deployed (2026-06-07). First in-prose batch done +
  **pushed & deployed live** this session (2026-06-08). Resume at
  `steel-etl/docs/superpowers/plans/2026-06-07-rule-glossary-scc-linking.md`
  → `## Execution status` (Phase 6 progress note) and Phase 6 task. Tracked as
  workspace `FOLLOWUPS.md` **#9**. Term→code source of truth:
  `steel-etl/docs/rule-term-mapping.md`.
- **Feature/ability/trait taxonomy refactor** — code DONE & on `main` (steel-etl +
  workspace), breaking SCC change; heroes-doc links already rewritten to new codes.
  **Not yet deployed** — live site/data repos still serve old `feature.trait.<class>`
  codes until `just deploy` + manual data-repo regen. `data-sdk-npm` schema branch
  `fork/feature-type-taxonomy` is intentionally NOT merged (Scott: ignore it).
- **Other `plans/` efforts** — untouched.
- **Smaller deferred items** — `FOLLOWUPS.md` #1–#8 (#7 resolve-prune now DONE).

## You are here

**Single next action:** continue Phase 6 with the **characteristics** batch —
`Might`/`Agility`/`Reason`/`Intuition`/`Presence` + the umbrella `characteristic`
(anchors L638–663, codes `rule.character/*`). These are DELICATE: proper nouns that
collide with the modal "might" (803 raw occ), common "reason" (356), "presence" (265).
**Use case-sensitive matching on the capitalized forms** (`\b(Might)\b` etc., no `(?i)`)
+ per-instance review of sentence-start capitals. `characteristic`/`agility`/`intuition`
are lower-ambiguity; `might`/`reason`/`presence` need the most care. After that, the
common-word tail (edge, bane, size, distance, strike, damage, line, wall).

Per-term loop (established this session): audit → `link_apply.py "<regex grp1>" "<code>"
<excl-ranges>` dry-run → review for mundane → `--apply` → gen 0-WARN + malformed grep →
commit per term-batch in steel-etl.

## Verified state (as of 2026-06-08)

- **steel-etl** `284b704` — Phase 6 first batch (6 link commits) + progress doc. **Pushed.**
- **workspace** `2f7d907` (submodule pointer bumped to `284b704`) + this doc commit.
- **Deployed live 2026-06-08** (shipped BOTH the feature.trait taxonomy AND the Phase 6
  links): **v2** `4e89c7051d`, **API** `1ee1d62`, **data-rules** `5b0898b1`,
  **data-unified** `5efa91f`. **data-bestiary** unchanged (heroes-only + monster codes
  untouched).
- `go test ./...` → **PASS**. `gen --config pipeline.yaml` → **clean (0 WARN), 1915
  classified**. Malformed-link grep → clean.

## Gotchas & lessons (cross-cutting)

- **Comprehensive linking is the policy** even for ultra-high-frequency core terms
  (Stamina/Recovery/Surge) — Scott confirmed every mechanic instance, not first-per-section.
  See memory `comprehensive-linking-density.md`.
- **`[Term]` ability-notation footgun:** the doc uses literal `[Heroic Resource]` (square
  brackets) as a placeholder; bare-word linking inside it produced `[[…]]` (fixed L4575).
  After every apply run the **broadened** malformed grep:
  `grep -nE '\]\(scc:[^)]*\)\]\(scc:|\[\[|\]\(\)|\(scc:[^)]*scc:|\]\(scc:[^)]*\)\]' DOC | grep -vE '\)\]\(scc:'`
- **Multi-word before single-word:** link `temporary stamina`/`recovery value` BEFORE bare
  `stamina`/`recovery`, else the bare pass nests inside the phrase.
- **Plan line numbers are STALE** (doc grew ~80 lines past the 2026-06-07 numbers). Always
  re-find anchors: `grep -nE '^#{3,5} <Heading>$' DOC` and next-heading via awk.
- **Go/just/node need devbox:** `devbox run -- bash -c 'cd steel-etl && go …'` (bare
  `devbox run -- go` fails).
- **Repo topology:** steel-etl is the workspace **submodule** (bump pointer after its
  commits). v2 / github.io / data-* are standalone siblings. `just deploy` runs gen ONCE,
  commits/pushes API + v2; it does **not** commit the `data/data-*` repos — do those by hand.
- **One heading = one SCC code;** don't stack `@type: rule` over an already-annotated
  non-code container.

## Verification commands

```
# from workspace root
git -C steel-etl log --oneline -1                 # 284b704
git              log --oneline -1                 # 9b2663d (+ uncommitted doc edits)
git status --short                                # ' M steel-etl' (pointer behind unpushed submodule HEAD)
devbox run -- bash -c 'cd steel-etl && go test ./...'                                          # PASS
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep -iE "WARN|classified"  # 0 WARN, 1915
# broad malformed-link guard (expect no output):
grep -nE '\]\(scc:[^)]*\)\]\(scc:|\[\[|\]\(\)|\(scc:[^)]*scc:|\]\(scc:[^)]*\)\]' "steel-etl/input/heroes/Draw Steel Heroes.md" | grep -vE '\)\]\(scc:'
# Phase 6 progress: remaining unlinked counts for a swept term should be ~def-section only
devbox run -- bash -c 'cd steel-etl && python3 scripts/link_audit_sectioned.py "winded"'       # ~7 (def section)
```
