# SC-434 r3 report: r2 review fixes + rebase onto develop 42c26272

## Summary

- New head `e2cf866e9cce98f7431a6d8f88cd34daf210d161` on `sc434-ci-e2e`, rebased onto origin/develop `42c26272` (confirmed after fetch; package.json unchanged, so no `npm ci` needed). Not pushed; superproject untouched.
- Commits over develop: `4b59ee39` (job), `c3cc908e` (README), `ed48b440` (comment), `c08f5823` (r3 fixes), `e2cf866e` (r3 follow-up: `find` instead of `compgen`).
- All seven folded findings are in (table below). Only `plugin-ci.yml` and `e2e/README.md` changed; LOW-2, action majors and `runs-on` untouched.
- actionlint v1.7.7 (reviewer's binary; shellcheck/pyflakes rules off, as in r2): 0 errors.
- Local CI sim at the rebased head `e2cf866e` (4 cores, 4 shards, copied cache): `OBSIDIAN-E2E done: 622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, e2e step 347.0 s, total 356.3 s. No NEGO-R05 / INIT-W10 / SET-X03 / SET-X04 failure, so no re-runs were needed.
- Cache-completeness check proven: complete cache -> `complete=true` (save runs); missing asar, missing installer, missing chromedriver, only versions.json, empty dir, chromedriver dir without the binary -> warning, no output (save skipped), step exit 0. Same 7 results under system bash and the devbox (nix) bash.
- The sim caught a real defect in the reviewer's prescribed check: `compgen -G` is "command not found" under a minimal bash (devbox/nix), so the check wrongly reported "incomplete" in the sim. Replaced with `find ... -name chromedriver -type f` (`e2cf866e`); Ubuntu's runner bash has compgen, but `find` works in both.
- Gates in the worktree at the rebased head: tsc clean, lint exit 0, jest `13447 passed / 2 skipped` = fresh worktree, no shots cache (the expected 13448 / 1 with cache minus one).

## Findings and fixes (`.github/workflows/plugin-ci.yml` unless noted, at `e2cf866e`)

| Finding | Fix | Where |
|---|---|---|
| MEDIUM-1 save only a complete cache | New step `obsidian-complete` checks installer binary (`-x`), asar (`-f`), chromedriver (`find`); save step gated on `steps.obsidian-complete.outputs.complete == 'true'`; incomplete emits `::warning::` and exits 0 (a failing check step would redden a green run) | check step 212-226 (find at 222), save `if` at 229; comment 203-211 |
| MEDIUM-2 step timeout + upload on cancel | `timeout-minutes: 25` on the e2e step (job stays 30); upload `if: ${{ failure() \|\| cancelled() }}` | 201, 243 (comment 195-199) |
| LOW-1 permissions | job-level `permissions: contents: read` on `e2e` (the `test` job untouched) | 110-111 |
| LOW-3 launcher version in key | pin step reads `node_modules/obsidian-launcher/package.json` version (fails loudly if empty), output `launcher`; both restore and save keys end `-launcher-<version>` (3.3.0 now) | 155-161 (read), 174 and 233 (keys) |
| LOW-4 concurrency | job-level `group: e2e-${{ github.event_name == 'pull_request' && github.ref \|\| github.run_id }}`, `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` | 116-118 (comment 112-115) |
| INFO artifact-name clash | `name: e2e-out-${{ github.run_attempt }}` | 246 |
| INFO README dated timings | dated sim numbers removed; the CI section now states the structure (timeouts, concurrency, key, artifact name, completeness-gated save) and that the sim was used to pick shards/timeouts | `e2e/README.md:54-` ("CI (SC-434)") |

Deliberate detail on LOW-4: a plain `group: e2e-${{ github.ref }}` with `cancel-in-progress: false` would still let GitHub discard all but one *pending* run in a group, i.e. rapid develop pushes could silently lose runs. Pushes therefore get a unique group (`github.run_id`), so the group only ever coalesces `pull_request` runs. This is a small deviation from the reviewer's literal snippet to meet the ruling "never for pushes".

YAML comments that pointed at README timing numbers were reworded (job-timeout comment, shards comment) to match.

## Measured

| Run | sha | Cores | Shards | Cache | e2e step | Total | Summary | Failures |
|---|---|---|---|---|---|---|---|---|
| r7b (pre-rebase, r3 fixes with the compgen check) | cd463861 | 0-3 | 4 | warm copy | 361.1 s | 371.4 s | 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 | none (check step warned "incomplete": the compgen defect, found here) |
| r10-final (rebased head) | e2cf866e | 0-3 | 4 | warm copy | 347.0 s | 356.3 s | **622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs** | none; check step silent (complete) |

Host load 4-11 during r10. `npm ci` 9.3 s. Pin step outputs: `version=1.14.4`, `launcher=3.3.0`. Sim changes: it now evaluates `${{ steps.<id>.outputs.<name> }}` in step `env:` and pre-creates GITHUB_OUTPUT (`evidence/sim.mjs`); `SIM_BASHOPT=-ex` allows tracing.

Gates (worktree, at rebased head): `npm run tsc` exit 0; `npm run lint` exit 0 (only the pre-existing `.eslintignore` warning); `npm test` `Test Suites: 1 skipped, 294 passed`, `Tests: 2 skipped, 13447 passed, 13449 total`, 86.8 s. Lifecycle not run (no change outside `.github/` and `e2e/README.md`; the rebased-in develop commits are not mine).

## Not verifiable locally
`if:` expressions and `${{ }}` contexts (the sim does not evaluate them; actionlint checks syntax and types only), the concurrency behaviour, upload on `cancelled()`, the step timeout killing the step then reaching the upload, `actions/cache` saving only after the check step. All need a real run (a PR; ideally one with a broken test and one superseded by a second push).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r3-report.md`
- Evidence dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/`: `sc434-r3-sim-r10-final.log` (final sim), `sc434-r3-check-proof-system-bash.log`, `sc434-r3-check-proof-devbox-bash.log` (completeness proof), `sc434-r3-sim-r9-compgen-bug.log` (the compgen failure trace), `check-proof.sh`, `sim.mjs`.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-impl/` (`gate2-tsc.log`, `gate2-lint.log`, `gate2-jest.log`, `runs/r10-final/`).
