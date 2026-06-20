# Data-repo consolidation + i18n-ready layout — design

**Date:** 2026-06-20
**Status:** approved (brainstorm) — pending implementation plan
**Scope:** workspace pipeline (`steel-etl`), `v2` site config + homepage, the published
data repos. Changes a workspace-level contract (the data-repo layout), so this spec lives in
the workspace `docs/superpowers/`.
**Related:** ROADMAP #10 (architecture-redesign carry-over: Phase 3.6 i18n, Phase 4.5 consumer
migration); ARCHITECTURE.md (pipeline output targets).

## Problem

The data repos predate the multi-book expansion and have drifted out of sync with the site:

- **Four books, six local output dirs, only three published repos.** `data-rules` (heroes) and
  `data-bestiary` (monsters) and `data-unified` (aggregate) are real GitHub repos.
  `data-beastheart`, `data-summoner`, and `data-rules-clean` are **local-only** (their git
  remote resolves to `workspace.git` — never published). So **summoner and beastheart data has
  no published home** even though the v2 site builds from their local dirs.
- **Misleading names.** `data-rules` is actually the *heroes* book; `data-bestiary` is the
  *monsters* book. The names describe themes, not books, and predate the per-book split.
- **No reason left for the split.** The only use case that ever justified separate per-book
  repos was a **redistribution/licensing boundary**. Confirmed out of scope: MCDM applies the
  same open license (the Draw Steel Creator License) uniformly across all profitable products,
  so all four books share identical redistribution terms. With licensing uniform, per-book
  repos buy nothing — release cadence, clone size, and SDK packaging are all solvable inside one
  well-structured repo.
- **i18n is coming.** Locale already exists as a path segment (`<repo>/en/...`) and
  `pipeline.yaml` has `locale` + `i18n_dir`, but the repo *topology* should make "add a
  language" a non-event before translation work lands (currently blocked on translators —
  ROADMAP #10 Phase 3.6).

## Goal

One cohesive, published data product that mirrors how the v2 site already presents content
(Browse = everything aggregated; Read = book-faithful), with locale as a clean top-level axis so
future languages slot in without structural redesign.

## Decision (Approach A — single consolidated repo)

Consolidate all book outputs **and** the cross-book aggregate into **one** repo, **reusing the
existing `data-unified` repo** (no new repo; optional GitHub rename to `data` deferred). Internal
layout mirrors the site's Browse/Read split, with **locale on top**:

```
<locale>/                                   # en/ today; es/, … later — the i18n axis
  unified/                                  # Browse: cross-book aggregate, organized by type
    md/<type>/<item>.md
    json/<type>/...                         # aggregate now spans ALL formats, not just md
    yaml/<type>/...
    md-linked/<type>/...
    md-dse/<type>/...
    md-dse-linked/<type>/...
    md/_index/...                           # navigation index pages (markdown, under md/ only)
  books/                                    # Read: book-faithful, full fidelity
    <book>/                                 # heroes | monsters | beastheart | summoner
      md/<type>/<item>.md
      md-linked/<type>/...
      md-dse/<type>/...
      md-dse-linked/<type>/...
      json/<type>/...
      yaml/<type>/...
      clean/<type>/...                      # stripped (annotations removed); where enabled
```

Key decisions (settled in brainstorm):

- **Formats: publish everything.** Each book carries all six variants (`md`, `json`, `yaml`,
  `md-linked`, `md-dse`, `md-dse-linked`) plus `clean` (stripped) where enabled — same set
  emitted today, just relocated. No format becomes a hidden build intermediate.
- **Repo: reuse `data-unified`.** Restructure its contents into the layout above. Its current
  `en/md/<type>` aggregate moves to `en/unified/md/<type>`. GitHub-renaming the repo to `data`
  is optional and explicitly deferred.
- **`unified/` aggregate carries all formats.** The cross-book aggregate is no longer md-only:
  it spans the same six structured variants the books do (`md`, `json`, `yaml`, `md-linked`,
  `md-dse`, `md-dse-linked`), now under `en/unified/<format>/`. This is a real expansion of the
  aggregator, which today only merges `md` (see §1). (`clean`/stripped stays a per-book
  distribution variant; it is not aggregated.)
- **Book directory slugs:** `heroes`, `monsters`, `beastheart`, `summoner` (short slugs, set
  explicitly per book — not derived from the `mcdm.<x>.v1` id).

## What changes

### 1. `steel-etl` pipeline output paths (the core change)

Today (`internal/pipeline/pipeline.go`):
- Per-book: `baseDir = Join(Output.BaseDir, locale)` → `Join(baseDir, "<format>")`
  (`:350-352`, `:361-390`) ⇒ `data-rules/en/md`.
- Aggregate: `Join(Aggregate.OutputDir, locale, "md")` (`:413`) ⇒ `data-unified/en/md`.

Target — insert a **group segment** between `locale` and `<format>`:
- Per-book: `Join(Output.BaseDir, locale, "books", <book-slug>, "<format>")`
  ⇒ `data-unified/en/books/heroes/md`.
- Aggregate: `Join(Aggregate.OutputDir, locale, "unified", "<format>")`
  ⇒ `data-unified/en/unified/{md,json,yaml,md-linked,md-dse,md-dse-linked}`. **The aggregator
  (`internal/output/aggregate.go`), today md-only, must be extended to merge every format** —
  collecting each format's per-item rendering by type the same way it currently does for md. The
  navigation `_index` pages stay markdown under `unified/md/_index/` only (they are a browse aid,
  not a per-format data contract).
- Stripped: into the book folder, e.g. `…/books/<slug>/clean`.

`pipeline.yaml` then points **every** book's `output.base_dir`, the `aggregate.output_dir`, and
the `stripped.output_dir` at the single repo root `../data/data-unified`, and gives each book a
`dir:` (slug) field. The `scc_api` / `scc_map` outputs are unaffected (they target the org repo
and a local json file, not the data repos).

### 2. `justfile`

- `clone-all`: the `data_repos` list collapses to just `data-unified` (drop `data-rules`,
  `data-bestiary`; the orphans were never cloned).
- `deploy`: the per-repo commit/push loop targets only `data-unified`.

### 3. v2 site

- **Build-time:** `v2/site.yaml` `source_dirs` (4 entries) repoint to the new local layout:
  `../data/data-unified/en/books/{heroes,monsters,beastheart,summoner}/md-linked`.
- **Content:** `v2/docs/index.md` (hand-authored, git-tracked homepage) "Data Repos" link list
  (lines ~63–99) collapses its multi-repo + legacy-per-format list down to the single
  consolidated repo, described as Browse (`unified/`) + Read (`books/`).

These two are the **only** site touch-points (verified by grep — nothing else references the
data repos).

### 4. Old published repos

`data-rules` and `data-bestiary` stop receiving output. Each gets a **deprecation README**
pointing at `data-unified` (the consolidated repo) and noting the new internal path for that
book (`en/books/<slug>/`). **No dual-publishing.** Per the brainstorm, we do **not** touch
`data-sdk-npm` or the `draw-steel-elements` plugin in this effort beyond linking — their
migration stays under ROADMAP #10 Phase 4.5. The local-only orphans (`data-beastheart`,
`data-summoner`, `data-rules-clean`) simply stop being separate dirs; their content now lands
inside `data-unified`.

### 5. Docs sync (part of "done")

- **ARCHITECTURE.md** — output-targets table, the pipeline diagram's "Output (7 targets)" list,
  and the multi-book gotcha all describe the new single-repo layout.
- **CLAUDE.md** (workspace router) — the `data/` layout bullet under "Layout".
- **ROADMAP #10** — note Phase 4.5's repo-consolidation half as delivered (consumer code
  migration still pending).
- **docs/scc-log.md** — not required (no SCC scheme/registry change: SCC codes are unchanged;
  this is purely an output-location/packaging change).

## i18n readiness (explicitly *ready*, not *active*)

This work makes the layout i18n-ready; it does **not** add a language or wire the MkDocs locale
switcher (still blocked on translators — ROADMAP #10 Phase 3.6). Readiness means: a future
`steel-etl gen --locale es` writes `data-unified/es/{unified,books/…}/…` with zero structural
change, and a language is a single new top-level folder rather than a fan-out across repos. SCC
codes remain shared across locales (one classification registry), so the future locale switcher
links equivalent content by code.

## Out of scope

- Touching `data-sdk-npm` or `draw-steel-elements` plugin code (link-only on old-repo READMEs).
- GitHub-renaming `data-unified` → `data` (optional, deferable; auto-redirect makes it safe
  later).
- Actual translated content / MkDocs i18n locale-switcher config (Phase 3.6, blocked).
- Any SCC code/registry change.

## Risks & mitigations

- **Repo size growth.** `data-unified` goes from md-only aggregate to all books × all six
  variants + clean **and** an all-format aggregate. Accepted (the "publish everything" +
  "all-format unified" choices). Mitigation: it is one git
  history, so growth is linear and expected; no submodules.
- **In-flight working trees.** `data/` dirs are gitignored independent clones. Migration must
  (a) restructure the `data-unified` clone in place, (b) stop writing the abandoned dirs, and
  (c) leave old-repo clones only long enough to push their deprecation README. The plan
  sequences this so a single `gen --all` + `deploy` lands the new layout atomically.
- **Hidden consumer of a moved path.** Mitigated by the homepage + READMEs pointing to the new
  locations; deeper consumer migration is tracked (Phase 4.5), not silently dropped.

## Acceptance criteria

1. `steel-etl gen --all` writes **only** `data/data-unified/`, populated as
   `en/unified/<6 variants>/<type>/…` (cross-book aggregate, all formats) and
   `en/books/<slug>/<6 variants + clean>/<type>/…` for all four books.
2. No pipeline writes to `data/data-rules`, `data/data-bestiary`, `data/data-beastheart`,
   `data/data-summoner`, or `data/data-rules-clean`.
3. `steel-etl site` builds the v2 site unchanged in output, reading the new `source_dirs`
   (Browse still includes monsters/beastheart/summoner; no missing books).
4. `just clone-all` and `just deploy` operate on the single `data-unified` repo and succeed.
5. `data-rules` and `data-bestiary` carry deprecation READMEs pointing to `data-unified`.
6. Homepage data-repo links point only to the consolidated repo.
7. `gen --locale es` (smoke test, English fallback content) produces a parallel `data-unified/es/`
   tree — proving i18n readiness — with no code change.
8. ARCHITECTURE.md, CLAUDE.md, ROADMAP #10 updated.
