# Handoff — 2026-06-08

## Active efforts

- **Rule/glossary SCC linking — Phase 6 in-prose sweep** — **DONE** (2026-06-08).
  Full in-prose `rule.*` sweep complete (batches 1–5 this session); only the low-yield
  `side`/`line`/`wall`/`ground` deliberately left. Tracked as `FOLLOWUPS.md` **#9** (now
  marked done). Term→code source of truth: `steel-etl/docs/rule-term-mapping.md`. No active
  next step — see "You are here" for optional polish.
- **Feature/ability/trait taxonomy refactor** — code DONE & on `main` (steel-etl +
  workspace), breaking SCC change; heroes-doc links already rewritten to new codes.
  **Not yet deployed** — live site/data repos still serve old `feature.trait.<class>`
  codes until `just deploy` + manual data-repo regen. `data-sdk-npm` schema branch
  `fork/feature-type-taxonomy` is intentionally NOT merged (Scott: ignore it).
- **Other `plans/` efforts** — untouched.
- **Smaller deferred items** — `FOLLOWUPS.md` #1–#8 (#7 resolve-prune now DONE).

## You are here

**Phase 6 (FOLLOWUPS #9) is effectively COMPLETE.** The full in-prose `rule.*` sweep is
done — including the conservative `damage` pass and the conservative `creature`/`ability`/
`target`/`ally`/`enemy` pass (each linked once at its defining sentence, `damage`-style).
Heroes doc at **~17,040** SCC links (12,386 `rule.*`).

**Deliberately left unlinked in-prose:** `side`/`line`/`wall`/`ground` — mundane-dominated
("outside", physical walls, "line of effect" is its own code, "the ground"); low mechanic
yield / high mislink risk. All 109 codes are glossary-linked regardless.

**If resuming Phase 6:** there's no required next action. Optional polish only — sweep the
rare clear-mechanic uses of side/line/wall/ground (your-side initiative, Wall/Line area
abilities, the Ground-and-Ceiling rule) if desired.

Per-term loop (established): audit (`scripts/link_audit_sectioned.py "<term>"`) → dry-run
`link_apply.py "<regex grp1>" "<code>" <excl-ranges>` → review for mundane → `--apply` →
gen 0-WARN + broad malformed grep → commit per term-batch in steel-etl. Re-find anchors
(`grep -nE '^#{3,6} <Heading>$'`) — plan line numbers are stale. **VERIFY the target code
exists** (`jq -r '.codes[]' classification.json | grep <code>`) before linking — `test-difficulty`
was an unminted Phase-3 gap (now fixed). Watch the literal `[Term]` notation footgun
(`[potency value]`, `[damage type]`) — bare-word linking nests it into `[[…]]`.

## Verified state (as of 2026-06-08)

- **steel-etl** `bfd9d15` — Phase 6 fully swept + `test-difficulty` code (**109 rule codes**),
  rebased on top of the concurrent **card-data field-parity** effort (`2e554e2` + its 7
  parents). Heroes doc **~17,040** SCC links (12,386 `rule.*`).
- **Deployed live 2026-06-08 (everything):** Phase 6 (all batches + conservative
  creature/ability/target/ally/enemy + damage) + feature.trait taxonomy + card-data parity —
  **v2** `a15154b222`, **API** `6d7da7b`, **data-rules** `e28964ce`, **data-unified** `5cd2e78`
  (data-bestiary unchanged). All repos in sync; nothing pending.
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
