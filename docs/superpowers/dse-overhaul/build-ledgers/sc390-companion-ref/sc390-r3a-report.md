# SC-390 R3a report (fix round on R1a)

# R3a2 addendum (data-sdk-npm only): rebased onto origin/v3 544b3f0

- Rebase was clean (no conflicts). New data-sdk-npm HEAD: **`c63cda2`** (commits `9fd6ee3` schema/types, `afae0de` regression test, `c63cda2` sc-md Skills; base `544b3f0`). steel-etl and draw-steel-elements untouched.
- SDK `npm run build` ok; `npm test` **426/426, 16 suites** (`sc390-r3a2-sdk-test.txt`).
- `git diff origin/v3...HEAD --stat`: 12 files, only SC-390 (`.repo-docs/{ci-cd,index}.md`, CHANGELOG.md, package.json, 3 test files, StatblockDTO.ts, MarkdownStatblockReader/Writer.ts, Statblock.ts, statblock.schema.json); `justfile` is not touched. `package.json` version 3.1.0; CHANGELOG order `## Unreleased` (empty), `## 3.1.0`, `## 3.0.1`, `## 3.0.0`.
- Both `statblock.schema.json` copies byte-identical (`diff` clean).
- The tarball `sc390-r3a-steel-compendium-sdk-3.1.0.tgz` predates this rebase; the rebase only changed the base (justfile/release plumbing), not SDK source, so its contents are equivalent, but re-`npm pack` if you want it byte-fresh.
- **Release command (v3 justfile at 544b3f0):** after this branch is landed on `v3`, in `data-sdk-npm` on branch `v3` (it must have an upstream and not be behind it) run `just release 3.1.0`. The recipe: (1) runs `check-auth` first (requires `NPM_PAT`, `npm whoami` succeeds, and the user has read-write access to the package); (2) exits 1 if `git status` is not clean, if the branch has no upstream, or if it is behind its upstream; (3) sets `version` in package.json via `jq`, `git add .`, and `git commit --allow-empty -am "Prepares for release '3.1.0'"`; (4) runs `npm publish` BEFORE pushing, and if npm refuses it `git reset --keep HEAD~1` to drop the local release commit and pushes nothing; (5) then `git push` (if the push fails after a successful publish it tells you to push the release commit by hand). It creates no tags. Not run by me.

## Executive summary
1. **Verdict: DONE.** All four review findings fixed (HIGH-1, MEDIUM-1, LOW-1, LOW-2) plus the folded sc-md Skills follow-up; everything re-proven.
2. **New shas** (branch `sc390-companion-ref`, nothing pushed): steel-etl `b42b901` (R3a commits `8674e46` metadata trim, `b42b901` embed_cards); data-sdk-npm `8bfa335` (rebased onto origin/v3 `309061a`; commits `f995afe` SC-390 schema/types, `c623f10` regression test, `8bfa335` sc-md Skills); superproject `65700aa` (docs only); v2 unchanged `2af78d0690`.
3. **Go gates:** `go build`/`go vet` clean; `go test -count=1 ./...` 847 PASS / 0 FAIL / 0 SKIP (8 packages ok). **SDK:** build ok, jest 426/426 (16 suites). Both `statblock.schema.json` copies byte-identical.
4. **SCC:** `gen --all` = 3,096 (heroes 1,962 / beastheart 241 / monsters 662 / summoner 231); 0 added / 0 removed vs the original-binary registry; `validate --scc-stable` passes.
5. **Ajv (reviewer's validate.js):** companions 0 invalid in json, yaml and ds-sb (json 726 valid / 328 invalid pre-existing non-companion null-list cases = SC-412; yaml 1054/0; ds-sb 2108/0).
6. **Site diff (`sc390-r3a-site-diff.txt`):** still frontmatter-only: 14 of 7,308 files, byte-identical to the R1a diff; all 28 companion/advancement bodies identical; embed_cards dead-entry removal has no rendered effect. API: 14 `resolve/*.json`, `scc.json`, `types.json` (+ timestamps).
7. **SDK tarball for the DSE round:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/sc390-r3a-steel-compendium-sdk-3.1.0.tgz` (sha256 953577d5…ac29; version 3.1.0, contains the SC-155 `Feature.isTrait` fix and `skills` in the schema). Same file at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/ce805c79-1202-4669-936e-9d6ac82db903/scratchpad/sdk-pack/steel-compendium-sdk-3.1.0.tgz`.
8. **Publish note (replaces R1a's):** land the rebased data-sdk-npm branch on `v3`, then in `data-sdk-npm` run `just release 3.1.0` (v3's recipe runs check-auth first, then commit/push/`npm publish`; needs NPM_PAT). Not published; no tags.
9. Panther md-dse is now 86 lines (`sc390-r3a-panther-mddse.md`).

## What was done, per finding
- **HIGH-1 (data-sdk-npm):** `fetch` + `rebase origin/v3`. Note origin/v3 had advanced past the 0c924b3 you cited: it is now `309061a` ("Prepares for release '3.0.1'" twice on top of 0c924b3). Conflicts only in CHANGELOG.md and package.json, resolved as prescribed: `"version": "3.1.0"`; `## Unreleased` empty; `## 3.1.0` (SC-390 bullets) above `## 3.0.1` holding the SC-155 `### Fixed` block (v3's own CHANGELOG still had that block under Unreleased, so I moved it under a new `## 3.0.1` header). Regression test added in `src/__tests__/io/dto-field-parity.test.ts` (the finding's exact test): **red on 5ec5a8e** (`TypeError: dto.isTrait is not a function` at `Feature.fromDTO`, run in a scratch clone), green after the rebase. steel-etl still emits `feature_type: feature` (not changed).
- **MEDIUM-1 (steel-etl):** `statblockMemberFeature` trims `metadata` to `{scc}` (or deletes it); `dse_test.go` golden updated; `len(meta) != 1` assertion added in `TestTransformStatblock_CompanionMembers`; `docs/statblocks.md` updated.
- **LOW-1:** `docs/scc-log.md` "/clean" dropped; SCC API sentence appended; `docs/scc-reference.md` wording fixed ("json/yaml `features[]` and md-dse `ds-sb` block").
- **LOW-2:** `embed_cards.go` comment fixed and both dead `"feature-group": true` entries removed; also dropped the stale `feature-group` mention from four neighbouring comments (`embed_cards.go`, `ability_cards.go`, `build.go`). `embed_cards_test.go` needed no change.
- **Folded follow-up:** `MarkdownStatblockReader` reads a `Skills` cell (`setList`), `MarkdownStatblockWriter` writes it in the centre cell of the third stat row (where the book table puts it) when `skills` is non-empty, else the old `-`. Two round-trip tests (with skills + text free strike; no Skills cell when empty). Existing sc-md fixtures unchanged. CHANGELOG 3.1.0 bullet updated ("round-trips through sc-md too").

## Artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/)
sc390-r3a-report.md, sc390-r3a-site-diff.txt, sc390-r3a-panther-mddse.md, sc390-r3a-steel-compendium-sdk-3.1.0.tgz, sc390-r3a-gotest-v.txt, sc390-r3a-gobuild.txt (buildvet=0, test=0), sc390-r3a-gen.txt, sc390-r3a-site.txt, sc390-r3a-ajv.txt, sc390-r3a-sdk-test.txt. (`sc390-r1a-validate-scc-stable.txt` still holds the stability method; the R3a re-run: default `validate --scc-stable` against the original-binary registry passed, registry set diff 0/0.)

## Notes
- I read `sc390-r2a-scratch/scripts/validate.js` before running it (read-only, takes sdk dir, schema dir, side root); I did not modify anything under that scratch dir.
- `git status` in the superproject shows ` M draw-steel-elements` (pointer moved by the other worker, not mine); I did not touch it.
- Generated dirt restored with the safe form; v2, steelCompendium.github.io, steel-etl and data-sdk-npm all report 0 dirty files. `data/` holds the R3a gen output (gitignored scratch).
- Open questions: none. Follow-ups: unchanged from R1a except the sc-md Skills item, now done.
