# SC-362 r2 independent adversarial review

## Executive summary

- **Verdict: APPROVE.** dse `sc362-harness-scc-cards` @ `1684455` (one commit on `origin/develop` `0ce76dd`, unmoved). 0 HIGH, 0 MEDIUM, 2 LOW (a test comment and a code comment), 5 INFO.
- Re-measured: tsc (incl. e2e) clean · lint clean · jest **5419 passed / 1 skipped / 231 of 232 suites** (+11) · lifecycle (port 9364) **29/29 ok, 0 failed** · e2e **88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs** · shots **580, 0 FAIL**, `montage board scroll OK` printed, host-copy pin OK, button host-leak 112 kinds / 672 · freeze **`freeze OK (276/276 …)`** (run twice) · parity **0 gap(s), 0 undeclared, 24 declared**, exit 0.
- **Existing shots are untouched.** I ran a base sweep in parallel from a `git archive` of `0ce76dd` (572 PNGs). Every one of the 572 shared names is byte-identical to the branch sweep. The only branch-only files are the 8 new `rule-by-scc--*` / `condition-by-scc--*` files.
- **Widening file:** 4 lines in the baseline format, 0 name collisions. All 4 hashes match my fresh sweep. My sweep and the implementer's two sweeps are byte-identical across all 580 PNGs. A simulated 280-line baseline passes `sha256sum -c` with 0 duplicate names.
- **The guard really fails.** A one-letter typo in the `rule/by-scc` code turns jest red (3 tests) and turns the shots run red (`FAIL rule-by-scc--*--ERROR.png` ×4, rc 1). Setting the fixture's mode to `none` turns jest red (5 tests). Both probes were reverted byte-clean.
- **SC-469 seam works.** `fixtures` with an unseeded code gives the web card. `anchors-only` (and `none`) gives the "Compendium not installed" notice. SC-469 needs no further plumbing beyond the `expectNotice` opt-out the ledger already records, but that opt-out goes in **two** places (INFO-1).
- **Scope:** `shoot.mjs` has 0 edits. Only `entry.ts`, `fixtures.test.ts` and `README.md` changed. The three stale comments named in the brief were all rewritten.

## Gate results (this review, branch `1684455`)

| Gate | Result line | Log |
|---|---|---|
| tsc | rc 0, no output (`tsc --noEmit && tsc --noEmit -p e2e`) | `logs/tsc1.log` |
| lint | rc 0, no findings | `logs/lint1.log` |
| jest (after shots, `main.js`/`styles.css` removed first) | `Tests: 1 skipped, 5419 passed, 5420 total` · `Test Suites: 1 skipped, 231 passed, 231 of 232 total` | `logs/jest1.log` |
| lifecycle (`DSE_LIFECYCLE_PORT=9364`) | `OBSIDIAN-LIFECYCLE done: 29/29 ok, 0 failed` | `logs/lifecycle1.log` |
| e2e | `OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` | `logs/e2e1.log` |
| shots (branch) | rc 0, 580 `ok`, 0 FAIL, `montage board scroll OK (14 rounds x 900px pane …)`, `host-copy pin OK`, `button host-leak OK (112 button kinds × 3 states … = 672 comparisons …)` | `logs/shots-branch1.log` |
| shots (base `0ce76dd`, git archive) | rc 0, 572 `ok`, the same in-run OK lines | `logs/shots-base1.log` |
| freeze (branch, twice) | `freeze OK (276/276 frozen print PNGs byte-identical …)` | `logs/freeze-branch1.log`, `logs/freeze-branch2.log` |
| freeze (base) | `freeze OK (276/276 …)` | `logs/freeze-base1.log` |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc 0 | `logs/parity1.log` |

All paths are relative to `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r2-rev-w7j5/`.

## Probe results

1. **Existing shots untouched.**
   - `branch-sweep1.sha256` (580) was compared with `base-sweep1.sha256` (572): 0 hash differences on the 572 shared names, 0 names that exist only in the base, and 8 branch-only names (the new captures).
   - This byte-level result covers all 18 fixtures the survey flagged as changing DOM under global wiring. It is backed by the jest pin "every other fixture mounts with neither service".
2. **The new shots, described in words** (print and realprint, each compared with its inline twin).
   - `rule-by-scc--steel-print` / `--steel-realprint`: a small gray eyebrow "Combat" above the bold title "Opportunity Attacks", then the two body paragraphs. All 9 in-body links are underlined in plain black ink.
     - The inline `rule--steel-print` reads only "Rule" as its title, has no eyebrow, and draws the same 9 links in a tinted (violet) link color. Its body text is identical.
     - The by-SCC card is 34 device px taller (440 vs 406) because of the eyebrow line.
   - `rule-by-scc--steel-dark`: the shield-and-book icon, a "◆ COMBAT" eyebrow and the title "OPPORTUNITY ATTACKS" in caps. The inline twin's title is just "RULE". Body and links are identical.
   - `condition-by-scc--steel-print` / `--realprint`: eyebrow "Condition", title "Bleeding". The two "bleeding" self-links are tinted (they are vault links, because `bleeding.md` is seeded); every other link is black ink.
     - The inline `condition--steel-print` has the same eyebrow, title and size (488 px), but every link is tinted.
   - So the only visible difference from each twin is the eyebrow, the title and link ink. That matches the seeded-set contract described in the code comment.
3. **Widening file.**
   - Format: `<64-hex>  <name>`, two spaces, LF, the same as the baseline.
   - Collisions: 0 against the 276 baseline names. `sha256sum -c` against my fresh sweep gives 4/4 OK.
   - Sweep determinism: the implementer's sweep 1, the implementer's sweep 2 and my sweep are identical across all 580 files.
   - After the probes, a targeted re-shoot of `rule/by-scc` reproduced the same 4 hashes.
4. **The guard fires.**
   - Probe A (typo `opportunity-atack`):
     - jest: 3 failed (`rule/by-scc mounts with no error card`, `rule/by-scc resolves to the real card…`, `a resolved by-SCC mount is clean`). The received DOM is `.dse-ref-notice.dse-ref-web-card` "Not installed locally."
     - `shoot.mjs --element=rule --fixture=by-scc` gives `FAIL` ×4 with `reference notice (unresolved by-SCC card): Not installed locally.…`, rc 1. The ERROR PNG shows the "Not installed locally / View on steelcompendium.io" notice card.
   - Probe B (`FIXTURE_COMPENDIUM['rule/by-scc'] = 'none'`): jest 5 failed.
   - Probe D (notice push removed from `mountFromParams`): jest 1 failed (the web-card test only). See LOW-1.
   - After each probe I restored `entry.ts` from a copy (sha256 `ce4d5438…` matches HEAD), deleted the 4 ERROR PNGs by explicit path, and re-shot `rule/by-scc` from clean source. The shots dir is now identical to my sweep (580 files).
5. **Seam for SC-469.** A temporary jsdom probe (copied into `test/dom/visual-harness/`, run once, then deleted) mounted `ds-scc` in each mode:
   - `fixtures` with seeded Bleeding: the real card.
   - `fixtures` with unseeded `condition/dazed`: `.dse-ref-web-card` with href `https://steelcompendium.io/scc/mcdm.heroes.v1/condition/dazed/`.
   - `anchors-only`: the `.dse-ref-notice` "Compendium not installed — run "Sync compendium"…" (resolver wired, no index).
   - `none`: the same notice.
   - So both degrade cards can be reached through mode alone. Output: `logs/probeE-seam.log`.
6. **Scope.**
   - `git diff --stat origin/develop...HEAD` lists 3 files (270 insertions, 20 deletions in total): `entry.ts` (137 lines changed), `fixtures.test.ts` (139), `README.md` (14). `shoot.mjs` has 0 lines changed.
   - The stale comments at old `entry.ts:1925-1928`, `fixtures.test.ts:24-27` and `entry.ts:362-366` were all rewritten. The heroSparse rewrite is imprecise (LOW-2).
7. **Working tree.** `git status --porcelain` was empty before and after. The `--ignored` set is identical before and after. `git diff` is empty. HEAD is `1684455`. No processes were left running. The superproject's ` M draw-steel-elements` was present before the review and is unchanged.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW-1: a test named for the notice guard does not exercise it
- **Where:** `test/dom/visual-harness/fixtures.test.ts:191-202` ("a by-SCC fixture mounted with no compendium fails the mount").
- **Failure scenario:** in a mixed stack the mode is `none`. Typed `ds-rule` then renders the framework `.dse-error-card` ("Rule: failed to render (render) Compendium not installed"), not a notice, so the pre-existing error-card check already fails the mount. Probe D removed the notice push and this test still passed.
- **Why it matters:** its comment ("must read as a failure, not a green notice") overstates what it pins. A future reader may count it as a second guard test when the web-card test at `:180` is the only one.
- **Fix:**
  - Reword the comment to "renders the error card (typed family, no compendium)".
  - Optionally tighten the assertion to `expect(errors.join('\n')).toContain('error card')`.
  - No new test is needed: `:180` pins the guard.

### LOW-2: the heroSparse comment calls an issue row a "notice"
- **Where:** `visual-harness/entry.ts:372-375`.
- **Text:** "these rows degrade to the 'not installed' notice here".
- **What actually renders:** hero renders unresolved ability rows as `.dse-hero__ability-issue` (and `.dse-hero-ref-issue` in `src/elements/hero/view.ts:262-264, 645`), not `.dse-ref-notice`.
- **Failure scenario:** someone auditing the new `.dse-ref-notice` guard reads this comment and concludes that `hero-sparse` should fail the sweep, or adds an opt-out it does not need.
- **Fix:** say "degrade to a 'Compendium not installed' issue row (`.dse-hero__ability-issue`, not a `.dse-ref-notice`, so the SC-362 guard does not fire)".

### INFO-1: SC-469's opt-out is needed in two places, not one
- `fixtures.test.ts:76` now asserts no `.dse-ref-notice` for every fixture, in the per-fixture loop.
- SC-469's degrade-card fixtures will therefore need the `expectNotice` opt-out in that loop as well as in `mountFromParams` (`entry.ts:2426`). They also need:
  - an `scc` key in `FIXTURES`;
  - `FIXTURE_COMPENDIUM` entries (`fixtures` for the web card, `anchors-only` or `none` for not-installed);
  - `scc` removed from `NO_FIXTURE_IDS`.
- The ledger names only the `mountFromParams` side. Worth adding to the SC-362 closing note.

### INFO-2: `anchors-only` and `none` render the same `ds-scc` card
- `RefUnwrapView.ts` checks `cx.compendium` before `cx.sccAnchors`, so both modes give "Compendium not installed".
- `anchors-only` is the more faithful model of a real unsynced vault (resolver present, compendium unavailable), and it is a usable seam.
- SC-469 can choose either mode. The ledger's "anchors-only is the hook" holds, but it is not strictly required.

### INFO-3: the fallback comment omits mountOne's probe step
- `harnessCompendiumModeFor`'s fallback comment (`entry.ts:1942`) says mountOne falls back to `default`. mountOne actually tries `probeSource(id, fixtureName)` before `default`.
- No impact: a probe-source name maps to `<id>/default`, which is always `none`. Comment-only nit.

### INFO-4: the resolver uses `DEFAULT_SETTINGS`, not `deps.settings`
- `attachHarnessCompendium` builds the resolver from `DEFAULT_SETTINGS` (`entry.ts:1929`) rather than `deps.settings`.
- These are the same object today (`makeHarnessDeps` passes `DEFAULT_SETTINGS`). Using `deps.settings` would keep the two coupled if the harness ever overrides settings. Optional.

### INFO-5: pre-existing render traits, not caused by SC-362
- **Bottom rule:** the steel-print twin (but not realprint) carries a 2-device-px dark horizontal rule at its bottom edge on `rule-by-scc` (rows 438-439) and `condition-by-scc`. The same rule is on the frozen `condition--steel-print` and `perk-links--steel-print`, so it is pre-existing print-twin behaviour.
- **Link ink:** vault `internal-link` anchors stay tinted on real paper (realprint), as in the frozen `perk-links`. Measured with `sc362rev-hlines.cjs`; output in `logs/hlines.log`.
- **Lint scope:** lint covers `src main.ts e2e` only, so the new harness and test code is checked by tsc only. This is the pre-existing lint scope.

## Evidence artifacts

Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r2-rev-w7j5/`

- **Logs:** `logs/{tsc1,lint1,jest1,lifecycle1,e2e1,shots-branch1,shots-base1,freeze-branch1,freeze-branch2,freeze-base1,parity1}.log`.
- **Probe logs:** `logs/probeA-jest.log`, `logs/probeA-shot.log`, `logs/probeB-jest.log`, `logs/probeD-jest.log`, `logs/probeE-seam.log`, `logs/restore-shot.log`, `logs/hlines.log`.
- **Hash lists:** `branch-sweep1.sha256`, `base-sweep1.sha256`, `impl-sweep1-full.sha256`, `impl-sweep2.sha256`, `branch-after-probes.sha256`, `baseline-widened-sim.sha256`.
- **Base tree and base shots:** `base-0ce76dd/draw-steel-elements/visual-harness/shots/`.
- **Probe source:** `sc362revProbe.test.ts` (not in the repo).
- **Scripts:** `sc362rev-*.sh`, `sc362rev-hlines.cjs`.
- **Clean `entry.ts` copy:** `entry.ts.orig`.
- **Status snapshots:** `status-{before,after}{,-ignored}.txt`.

PNGs eyeballed, all in `/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards/draw-steel-elements/visual-harness/shots/`:
- `rule-by-scc--steel-print.png`, `rule-by-scc--steel-realprint.png`, `rule-by-scc--steel-dark.png`
- `rule--steel-print.png`, `rule--steel-dark.png`
- `condition-by-scc--steel-print.png`, `condition-by-scc--steel-realprint.png`, `condition-by-scc--steel-dark.png`
- `condition--steel-print.png`

I also looked at the probe-A ERROR PNG (the notice card) before deleting it.
