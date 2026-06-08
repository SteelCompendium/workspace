# Handoff — 2026-06-07

## Active efforts

- **Rule/glossary SCC linking** — IN FOCUS. Phases 0–5 + deploy **DONE & LIVE**;
  **Phase 6 (full in-prose sweep) is the remaining work.** Resume at
  `steel-etl/docs/superpowers/plans/2026-06-07-rule-glossary-scc-linking.md`
  → `## Execution status` (top) and Phase 6; tracked as workspace
  `FOLLOWUPS.md` **#9**. Term→code source of truth: `steel-etl/docs/rule-term-mapping.md`.
- **Trait `.sc-trait` cards** — DONE & shipped (prior handoff, now in git log). Not active.
- **Beastheart integration** — paused/likely-done; `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status`.
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`, `sdk-schema-alignment`, `content-linking`) — untouched.
- **Smaller deferred items** — workspace `FOLLOWUPS.md` #1–#8 (e.g. #8 settings-panel reload; #7 SCC API `resolve/` not pruned; #2/#5 mkdocs link warnings).

## You are here

**Single next action:** begin **Phase 6 — the in-prose `rule.*` sweep** (FOLLOWUPS #9):
link in-document-body occurrences of rule terms, one term/term-batch at a time,
per-instance mundane-vs-mechanic judgment. Start with the highest-yield, least-
ambiguous terms (winded, dying, suffocating, flanking, cover, concealment, surge,
recoveries, stamina), then characteristics, then the common-word tail (edge, bane,
size, distance, strike, damage — link only the game-mechanic use). Use
`steel-etl/scripts/link_apply.py '<regex w/ group 1>' '<code>' [excl…]` (dry-run by
default), the mapping's Variants/Code columns, and exclude each term's own
definition section. **Re-run gen 0-WARN + the malformed-link grep after each batch.**

This is multi-session — commit per term-batch.

## Verified state (as of 2026-06-07)

All six repos on `main`, all pushed, nothing ahead/behind:
- **steel-etl** `a61bacd` (source: rule type + 108 codes + glossary links + docs). Working tree clean.
- **workspace** `a992622` (submodule pointer → `a61bacd`; CLAUDE.md + FOLLOWUPS.md). Clean.
- **v2** `d590570` — deployed site (all `rule/*` Browse pages + scc stubs).
- **steelCompendium.github.io** (SCC API) `6d0244d` — deployed (108 rule resolve entries).
- **data-rules** `98a9de9`, **data-unified** `3e48018` — regenerated + pushed. **data-bestiary** unchanged (heroes-only change).
- `go test ./...` → **PASS**. `gen --config pipeline.yaml` → **0 WARN, 1915 classified**.
- heroes doc: **108 rule codes**, **~4,789 SCC links**, Introduction glossary fully linked (167 headwords). Reference table = **577 terms**.

## Gotchas & lessons (cross-cutting)

- **Go/just/node need devbox**, and bare `devbox run -- go …` fails — use
  `devbox run -- bash -c 'cd steel-etl && go …'`.
- **One heading mints exactly one SCC code.** Don't stack `@type: rule` above an
  already-annotated heading (e.g. a non-code `@type: feature-group` container) — the
  rule code silently won't mint. After any annotation, assert `#@type: rule` count ==
  minted `rule.*` code count. (This bit Phase 3b; fixed by anchoring `Turn` on
  `### Taking a Turn` and reusing `rule.combat/turn` for Main/Maneuver/Move Action.)
- **Mapping decisions matter:** terms already typed (conditions, movement incl.
  pushed/pulled/slide→`movement/forced-movement`, skills, classes, chapters) are
  `reuse` → existing code, NOT a new `rule.*`. Link those to the existing code.
- **Repo topology:** `steel-etl` is the workspace **submodule** (bump its pointer after
  steel-etl commits). `v2`, `steelCompendium.github.io`, and `data/data-*` are
  **standalone** sibling repos (each pushed to its own origin). Deploy = `just deploy`
  (gen once → API commit/push to org repo → v2 build/commit/push); it does **not**
  commit the `data/data-*` repos — do those by hand after deploy (same gen output).
- **`gen --all` vs bare `gen`:** bare builds only the primary (heroes) book; `just
  deploy*` pass `--all`. The deploy runs gen ONCE (the API JSON carries a `time.Now()`
  stamp; a second gen re-stamps and dirties the org repo).
- FOLLOWUPS **#7**: the SCC API `resolve/` dir isn't pruned, so renamed/removed codes
  leave stale JSON. Not triggered here (only additions), but watch it on future renames.

## Verification commands

```
# from workspace root
git -C steel-etl  log --oneline -1   # a61bacd
git              log --oneline -1    # a992622 (workspace)
git -C v2        log --oneline -1    # d590570
git -C steelCompendium.github.io log --oneline -1   # 6d0244d
for d in steel-etl v2 steelCompendium.github.io data/data-rules data/data-unified; do (cd $d && echo "$d ahead=$(git rev-list --count @{u}..HEAD) behind=$(git rev-list --count HEAD..@{u})"); done  # all 0/0
devbox run -- bash -c 'cd steel-etl && go test ./...'                              # PASS
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep -iE "WARN|classified"  # 0 WARN, 1915
grep -c '@type: rule' "steel-etl/input/heroes/Draw Steel Heroes.md"                 # 108 (== minted rule codes)
# malformed-link guard (expect no output):
grep -nE '\]\(scc:[^)]*\)\]\(scc:|\[\[|\]\(\)' "steel-etl/input/heroes/Draw Steel Heroes.md"
```
