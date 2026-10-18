# SC-390 R4a scoped re-review (delta: steel-etl 8d1c062..b42b901, data-sdk-npm 8bfa335 vs origin/v3 309061a, superproject 753e212..65700aa)

## Executive summary
1. **VERDICT: APPROVE.** HIGH-1 closed, MEDIUM-1 closed, LOW-1 closed, LOW-2 closed, folded sc-md Skills item closed. No new findings above INFO.
2. **HIGH-1 closed.**
   - The regression test (`dto-field-parity.test.ts`, "loads a companion statblock … feature_type 'feature' member") is meaningful. With pre-SC-155 `Feature.ts` (69c8d49) swapped in, the suite goes red: 1 failed / 6 passed, `TypeError: dto.isTrait is not a function` at Feature.ts:46. With the file restored it is green, 7/7.
   - The tarball's sha256 `953577d5…5dac29` matches the R3a report. My own `npm pack` of 8bfa335 reproduces the same hash, so the tarball was packed from 8bfa335.
   - Through that tarball, 28 of 28 companion objects (14 json + 14 ds-sb) parse with `Statblock.modelDTOAdapter`.
   - CHANGELOG: Unreleased is empty, then `## 3.1.0`, then `## 3.0.1`. package.json is 3.1.0. `diff origin/v3...HEAD --stat` touches 12 files, all SC-390.
3. **MEDIUM-1 closed.** All 232 embedded member features (29 × json/yaml/md-dse/md-dse-linked × books+unified) have `metadata` == `{scc:[1 code]}`. The golden lost only the non-scc metadata lines, the `len(meta) != 1` assertion is in, the `docs/statblocks.md:375` wording is updated, and the panther md-dse is 86 lines.
4. **LOW-1 / LOW-2 closed as prescribed.** With the dead `feature-group` map entries removed, `v2/docs` from b42b901 is byte-identical to the R2a-reviewed 8d1c062 build (whose mkdocs HTML I already proved identical to baseline). Versus the 0c74f4f baseline: 14 companion pages (frontmatter-only) plus `site.yaml`.
5. **Folded sc-md Skills closed.** The writer output for all 513 non-companion statblocks is byte-identical between v3 (309061a) and 8bfa335. The reader's DTO is identical on that output and on the 27 SDK sc-md fixtures. Real companions round-trip `skills` and `free_strike` through sc-md.
6. **Gates:** build/vet clean; go test 847/0/0; `--scc-stable` passes; registry 3,096 (1,962/241/662/231) and byte-identical to baseline; SDK build ok and 426/426 (16 suites); schema copies byte-identical; Ajv finds 0 invalid companions (json 726/328 pre-existing, yaml 1054/0, ds-sb 2108/0).
7. **INFO (new, pre-existing class, not blocking):** sc-md round-trip of a companion swaps `organization: "Companion"` into `role: "Companion"`. The reader's fixed organization set lacks Companion, the same class as Retainer ("dropping Retainer" warnings on v3 too). Backlog candidate only.

## Per-finding detail
- **HIGH-1 (data-sdk-npm)**
  - Rebase: HEAD 8bfa335 = f995afe (schema/types) + c623f10 (regression test) + 8bfa335 (sc-md Skills) on `origin/v3` 309061a. `ls-remote origin v3` = 309061a; merge-base = 309061a. npm now lists 3.0.1 (published since R2a); 3.1.0 is not published.
  - Tarball: `sc390-r3a-steel-compendium-sdk-3.1.0.tgz` has sha256 `953577d57df3d1eb7bf63c58b4e0de08583869a6ebb81ae1e2098a4ff85dac29`. My repack from a scratch clone at 8bfa335 gives the identical hash and contents (`diff -r` clean). It contains `Feature.isTrait(dto)` and the `skills` schema property, and its version is 3.1.0.
  - Parse through the tarball: Panther gives `freeStrike "1 + M"`, `stamina "= yours"`, `skills ["Sneak"]`, Pounce as ability / Signature Ability, and Mighty Spring as trait.
- **MEDIUM-1 (steel-etl 8674e46):** `statblock_transform.go:73-80` matches the prescribed code. Delta data vs the R2a build changed only companion json/yaml/md-dse/md-dse-linked (14 × 4 × 2 = 112 files). md and md-linked are unchanged, so the site input is unchanged.
- **LOW-1 (superproject 65700aa):** the `docs/scc-log.md` "/clean" is removed and the SCC API sentence is added; the `docs/scc-reference.md` wording is fixed.
- **LOW-2 (steel-etl b42b901):** the `embed_cards.go` comment is fixed and both `"feature-group": true` entries are removed. The neighbouring comment cleanups in `ability_cards.go:48,68` and `build.go:323` are comment-only, and the site output is identical.
- **sc-md Skills (8bfa335):** `MarkdownStatblockReader.ts` adds `case 'skills'` (`setList`), and `MarkdownStatblockWriter.ts:85-86` writes the centre cell only when `skills?.length`, otherwise the old `-`.

## Gate numbers
| Gate | Result |
|---|---|
| go build/vet (worktree steel-etl b42b901) | clean |
| go test -count=1 ./... | 847 pass / 0 fail / 0 skip (top-level) |
| gen --all (scratch b42b901) | 1,962 / 662 / 241 / 231 = 3,096; `classification.json` byte-identical to 0c74f4f |
| validate --scc-stable | passed, EXIT=0 |
| SDK 8bfa335 build + test | ok; 426/426, 16 suites |
| statblock.schema.json copies | byte-identical |
| v2/docs vs R2a-reviewed build | identical; vs baseline 14 frontmatter-only pages + site.yaml |

## What I executed
- Scratch at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/ce805c79-1202-4669-936e-9d6ac82db903/scratchpad/sc390-r2a-scratch/r4/`:
  - `v3/` and `new/`: SDK clones at 309061a and 8bfa335. I built both, ran tests on `new/`, repacked, and ran the Feature.ts revert probe (restored afterwards).
  - `after/`: steel-etl b42b901 + v2 2af78d0, where I ran gen, validate and site.
  - `x1/`: the extracted R3a tarball.
- Scripts: `../scripts/{r4check.js,r4writer.js,r4rt.js,validate.js}`.
- Worktree: only go build/vet/test in steel-etl. `git status` is the same as at the start. I did not touch draw-steel-elements, and I ran no chrome or shots.
- Artifacts (ledger dir): `sc390-r4a-gates.txt`, `sc390-r4a-gotest-json.txt`, `sc390-r4a-sdk-test.txt`, `sc390-r4a-regression-red.txt`, `sc390-r4a-companion-check.txt`, `sc390-r4a-ajv.txt`, `sc390-r4a-scmd-regression.txt`, `sc390-r4a-site-diffq.txt`.
