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

Batches 1–3 are done (see FOLLOWUPS #9) — ~80 of the 109 `rule.*` codes are now swept
in-prose (heroes doc at **14,020** SCC links, 9,365 `rule.*`). **Only the ultra-common
words remain**, each needing HEAVY per-instance mundane-vs-mechanic review (do one at a
time, full-context, like `cover`/`strike` were):

**Next action — the remaining ultra-common terms:** combat `target`/`ally`/`enemy`/`adjacent`/
`side`/`condition`/`line`/`wall`/`melee`/`ranged`/`turn`/`combat-round`; general `ability`/
`creature`/`ground`/`supernatural`; dice `bonuses-and-penalties`; treasure `enhancement`/
`implement`; downtime `guide`; world `Capital`/`Saint`. Plus the **negotiation** group
(interest/patience/motivation/pitfall — match only in negotiation context). The mapping flags
most of these "link very sparingly".

Per-term loop (established): audit (`scripts/link_audit_sectioned.py "<term>"`) → dry-run
`link_apply.py "<regex grp1>" "<code>" <excl-ranges>` → review for mundane → `--apply` →
gen 0-WARN + broad malformed grep → commit per term-batch in steel-etl. Re-find anchors
(`grep -nE '^#{3,6} <Heading>$'`) — plan line numbers are stale. **VERIFY the target code
exists** (`jq -r '.codes[]' classification.json | grep <code>`) before linking — `test-difficulty`
was an unminted Phase-3 gap (now fixed). Watch the literal `[Term]` notation footgun
(`[potency value]`, `[damage type]`) — bare-word linking nests it into `[[…]]`.

## Verified state (as of 2026-06-08)

- **steel-etl** `d4501cd` — Phase 6 batches 1–3 (high-yield + characteristics + common-word
  tail + dice/combat/test/character/resource/downtime/treasure/world/general groups) + the
  minted `test-difficulty` code (**109 rule codes** now). Pushed. Heroes doc **14,020** SCC
  links (9,365 `rule.*`).
- **workspace** `a27d780` — submodule pointer bumped; this doc + FOLLOWUPS committed.
- **Deployed live 2026-06-08:** batches 1 + 2 + feature.trait taxonomy — **v2**
  `c3d337249d`, **API** `b42c498`, **data-rules** `5643a5e9`, **data-unified** `cc1ae49`
  (data-bestiary unchanged). **The conservative `damage` pass + all of batch 3
  (`5509f78`..`d4501cd`) are pushed but NOT yet deployed** — the live site/data still serve
  the batch-2 link state until the next `just deploy` + data-repo regen.
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
