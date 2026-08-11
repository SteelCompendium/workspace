# SDK beta-docs report

**Status:** DONE
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sdk-beta-docs/data-sdk-npm`
**Branch:** `sdk-beta-docs` (repo's tracked branch is `v3`; not pushed — orchestrator lands)
**Commit:** `a4c2a3efea6cb7aabf286de6854af7b113f1524b` — "Marks the 10 content-type schemas/models as beta"

## What was edited

- `README.md` — new "## Schema stability" section (placed right after the "## Schemas"
  table, before "## Development"): a two-column list (Stable: Feature, Statblock,
  Featureblock vs. Beta — subject to change without notice: the 10 content-type
  families) plus one rationale paragraph (transport shapes for book content, much of
  their structure lives in markdown `content` fields, will be redesigned as structured
  authoring/character-management schemas mature).
- `src/schema/{ancestry,career,class,complication,condition,culture,kit,perk,title,treasure}.schema.json`
  — prepended `"BETA — subject to change without notice. "` to each schema's top-level
  `description` field. Verified all ten still parse as valid JSON after edit (`python3 -c
  "json.load(...)"` on each).
- `src/model/{Ancestry,Career,Class,Complication,Condition,Culture,Kit,Perk,Title,Treasure}.ts`
  — added a one-line `// BETA — subject to change without notice. See README.md §
  Schema stability.` comment directly above each `export class`. Note: none of the ten
  model files had pre-existing JSDoc/docblocks to "follow the style of" (only
  `Feature.ts` has a precedent — a single-line `//` comment above its class), so a
  matching single-line `//` comment was used rather than fabricating a JSDoc block.
- `src/schema/index.ts` — added a 4-line header comment above the imports summarizing
  the stable/beta split and pointing to the README section.
- `.repo-docs/integration.md` — updated the "API Surface" export-path table and the
  "JSON Schemas" table (added a Stability column, split Feature/Statblock as stable vs.
  the 10 content types as beta) and added a one-line callout above the schema table.
  This file asserted "stable" for all schema/model exports including the 10 content
  types, which would have directly contradicted the new README notice for anyone
  reading it as the consumer-facing integration doc, so it was brought in scope
  alongside the required `src/schema/index.ts` docs-index note.

Explicitly untouched, per scope: `feature`, `statblock`, `featureblock` schemas/models
and shared sub-schemas (characteristics/effect/feature-stat) — no wording changed, no
hedging added. No schema restructuring, renaming, or semantic changes anywhere. No
version bump, no publish, no tags.

## Build/test result (verbatim tails)

`devbox run -- bash -c 'cd .../data-sdk-npm && npm install'` — no lockfile is
committed (`.gitignore` excludes `package-lock.json`), so `npm ci` fails with EUSAGE;
used `npm install` instead. Exit 0, `added 452 packages, and audited 453 packages in 10s`.

`npm run build` (tsc + copy schemas to dist) — exit 0, no output beyond the script
invocation line (no TS errors).

`npm test` (jest):
```
Test Suites: 14 passed, 14 total
Tests:       407 passed, 407 total
Snapshots:   0 total
Time:        7.81 s
Ran all test suites.
```
No test referenced exact schema `description` strings (grepped
`src/__tests__` and `src/validation` for `.description` usage against the ten schema
names — only test fixture data files matched, none asserting on the schema-file
description text), so no test edits were needed.

## Diff scope check

`git diff --stat` on the commit: 23 files changed, 69 insertions(+), 28 deletions(-) —
matches exactly the intended file set (README, 10 schema JSON, 10 model TS,
schema/index.ts, .repo-docs/integration.md). No `dist/`, `node_modules/`, or
`package-lock.json` included (all gitignored).

## One concern

`.repo-docs/integration.md` was edited beyond the explicit instruction list (README,
schema JSON descriptions, model docblocks, `src/schema/index.ts` / docs index) because
it's the repo's consumer-facing "API Surface" doc and previously asserted the beta
schemas/exports were "stable" — leaving it as-is would have directly contradicted the
new README notice. Flagging in case Scott wants this reverted to keep the diff strictly
to the four instructed locations.
