# SC-240 independent review — round 1

## Executive summary

- **Verdict: APPROVE.** draw-steel-elements `225b02e` (base `46c0c4c`) implements owner rulings 1–3 exactly. The LOW findings are optional polish and do not block landing.
- Findings: 0 BLOCKER · 0 HIGH · 0 MEDIUM · 3 LOW · 5 INFO.
- Gates (re-run by the reviewer at `225b02e`): tsc clean, exit 0 · lint clean, exit 0 · jest **3934 passed / 1 skipped / 202 of 203 suites**, exit 0 (matches the implementer's number) · shots **524 PNGs, 0 FAIL**, exit 0 · freeze **260/260**, exit 0 (0 pixels moved) · parity **0 gaps / 0 undeclared / 16 declared**, exit 0.
- Probes: 19/19 ref-shape probes and 8/8 portrait probes behave as the ledger requires. Bare-path messages are byte-equal to the legacy `parseEncounterData` oracle for `Nope`, `@Nope`, `[[Nope]]`, `scc-notes/Nope` and `sccNope` (hero and creature). No SCC-shaped ref reaches the file hint. No message is wrapped twice.
- Sabotage: 7 of 8 sabotages turn the new or existing tests red. One gap: removing `.trim()` from the predicate goes undetected (LOW-2).
- The `initiative-resolve-refs.test.ts` diff contains only additions (the header comment, an import, `makeSccEnv` and the new describe). No pinned assertion changed.
- Working tree byte-clean before and after (`git status --porcelain` empty). All sabotage edits were restored with `git checkout`, and both probe files were deleted. Copies of the probes are kept as evidence.

## Findings

### LOW-1 — The JSDoc for `resolveStatblockRef` is now attached to the wrong function
- `src/elements/initiative/resolveRefs.ts:60-94`. The new `isSccShapedRef` and its own `/** SC-240 … */` block were inserted between the long SC-134 JSDoc (`:60-87`) and `resolveStatblockRef` (`:95`).
- Failure scenario: an IDE hover and TypeScript's JSDoc attachment now pair the SC-134 routing and M1 trim doc with `isSccShapedRef`, and `resolveStatblockRef` has no doc. A later reader loses the explanation of the null contract and the M1 trim rule right where they apply.
- Fix: move the `isSccShapedRef` block (`:88-93`) above the SC-134 JSDoc, directly after `SCC_PREFIX_RE` at `:58`, so the long block sits against `resolveStatblockRef` again. No code change.

### LOW-2 — No test covers the whitespace-padded SCC path (sabotage `a-notrim` stays green)
- `src/elements/initiative/resolveRefs.ts:92` (`SCC_PREFIX_RE.test(raw.trim())`). Changing it to `.test(raw)` leaves all 54 tests in the two affected suites green (`sc240-review-sab-a-notrim.log`).
- Failure scenario: someone "simplifies" the predicate and a padded `  scc.v1:<code>` ref falls through to `resolveBarePath`. The SC-134 routing breaks, and the SC-240 hint returns with a bogus `Reference file (  scc.v1:…) not found` message. No test would catch it. The routing half of this gap predates SC-240 (it comes from SC-134 M1). The predicate is now shared, so one test would cover both halves.
- Fix: in the `T-2 / SC-240` describe (`test/unit/model/initiative-resolve-refs.test.ts:384`), add a case with a padded ref such as `"  scc.v1:<code>  "` (hero or creature). Assert that the SccRefProvider text is present and that `multiple instances` is absent. The reviewer's probe case `hero padded scc.v1 (scc provider)` can be pasted in as-is.

### LOW-3 — The "warn still fires" test covers only the hero call site
- `test/dom/elements/initiative-portrait-missing.test.ts:147`. The new positive test specifies an `image` only on a hero. The enemy detail row (`view.ts:1532`) and the instance grid cell (`view.ts:1500`) have no positive-warn test. The negative (no-warn) test does cover all three sites, because SOURCE has a hero and 2 goblins.
- Failure scenario: a later refactor that gives the enemy sites their own portrait path could silently drop the warn for a broken enemy image. The risk is low today because all three sites share `renderPortrait`.
- Fix (optional): give the goblin an `image: nope/goblin.png` in the new test, and assert 1 warn for the hero plus 1 per enemy site (the reviewer's probe measured 3 enemy warns: 1 detail row + 2 grid cells).

### INFO
- **INFO-1 — Whitespace-only `image: "   "` still warns** (probe: 4 warns, fallback glyphs render). This is within the ruling ("non-empty `imgSrcRaw`"): a value was specified and it is garbage. A `.trim()` in the gate would make it silent, but that goes beyond the ruling. The owner can decide; no action needed.
- **INFO-2 — A broken custom `defaultImagePath` with no `image` is now silent** (probe `default-broken-no-image`: 0 warns). This follows the ruling exactly, and the stock default `Media/token_1.png` is missing in most vaults, so warning here would bring the noise back. The owner may want to mention it to Scott because it is a small loss of a diagnostic.
- **INFO-3 — The lead-in echoes the raw, untrimmed ref**, for example `(\tscc:…)` or `(  scc.v1:…)`. The legacy lead-in did the same. The inner provider message uses the trimmed code. Harmless.
- **INFO-4 — `scc.v1:not a code at all` reports "is not available in this vault. Sync the compendium…"** rather than "malformed". That text comes from SccRefProvider/SccResolver, not from this ticket, and there is no hint and no double wrap. `scc:` with an empty code and `scc.v2:` correctly report "unsupported scheme version or is malformed". Out of scope.
- **INFO-5 — The CHANGELOG bullet sits under `## 7.0.0 (unreleased; previously numbered 6.0.0)`** (`CHANGELOG.md:18`), not under a literal `## Unreleased`. That is correct for this repo: no `## Unreleased` heading exists, and SC-241 and other in-flight bullets live in the same place. The text is accurate. The `refs.ts:221` comment is still accurate because it describes `resolveBarePath`, which only non-SCC refs reach. There is exactly one warn site: `grep "no portrait image found" src/` finds only `view.ts:1185`, and the `:741` site cited in SC-134 no longer exists.

## Probe log

### 1. Bare-path contract
- `git diff 46c0c4c..225b02e -- test/unit/model/initiative-resolve-refs.test.ts` contains only added lines: the header paragraph, 2 imports, `makeSccEnv` and the new describe. No existing assertion changed.
- Probe: hero and creature × {`Nope`, `@Nope`, `[[Nope]]`, `scc-notes/Nope`, `sccNope`}, all `toBe` the legacy `parseEncounterData` message (10/10 pass). Each contains the "multiple instances" hint.
- `SCC:` in upper case is routed as a bare path and keeps the hint. It is byte-equal to legacy and consistent with the case-sensitive routing.

### 2. SCC shape (all pass: no `multiple instances`, no `full path`, exactly one `Failed to resolve`)
| Case | Inner message |
|---|---|
| hero `  scc.v1:<code>  ` (real provider) | SccRefProvider "not available… Sync the compendium" |
| creature `\tscc:<code>` (real provider), index 1 | same |
| hero `scc.v2:<code>` | "uses an unsupported scheme version or is malformed" |
| creature `scc:` (empty) | same, malformed |
| hero `scc.v1:not a code at all` | "not available…" (INFO-4) |
| hero `scc:<code>`, no provider (reserved) | `Unresolvable reference: "…" (no provider could resolve this reference)` |
| creature `  scc.v1:<code>`, no provider (reserved) | same (trimmed code passed to the reserved provider, as M1 requires) |
| custom scc provider throwing `Failed to parse YAML in X.md: boom` | passed through verbatim, no hint |

No SCC-shaped ref reaches `resolveBarePath`: routing and message choice share `isSccShapedRef`.

### 3. Portrait warn (hero + enemy with `amount: 2`, so 4 portrait slots)
| Case | Warns | Slots |
|---|---|---|
| enemy `image: nope/goblin.png`, no default | 3 (detail + 2 grid cells) | shield, skull×3 |
| `image: ""` | 0 | fallback glyphs |
| `image: "   "` | 4 | fallback glyphs (INFO-1) |
| `image: ~` | 0 | fallback glyphs |
| no image, `Media/token_1.png` present | 0 | IMG×4 (unchanged) |
| image missing, default present | 0 | IMG×4 (unchanged) |
| no image, `defaultImagePath: Custom/missing.png` | 0 | fallback glyphs (INFO-2) |
| no image, `defaultImagePath: ''` | 0 | fallback glyphs |

### 4. Sabotage (each edit restored with `git checkout`; diff clean afterwards)
| Sabotage | Result |
|---|---|
| `a-revert` (resolveRefs.ts at 46c0c4c) | 3 red: unit hero, unit creature, DOM SC-134 negative control |
| `a-creature-only` (creature branch forced to hint) | 2 red: unit creature + DOM |
| `a-hero-only` (hero branch forced to hint) | 1 red: unit hero |
| `a-always-drop` (both branches never hint) | 5 red: 4 pinned legacy T-2 + SC-240 boundary check |
| `a-notrim` (predicate without `.trim()`) | **0 red** (LOW-2) |
| `b-revert` (view.ts at 46c0c4c) | 1 red: NO-warn test (0 expected, 4 received) |
| `b-never-warn` (`if (false)`) | 1 red: "warn STILL fires" test. The implementer did not prove this direction; it is now proven. |
| `b-warn-on-null` (`imgSrcRaw !== undefined`) | 1 red: NO-warn test |

## Artifacts
All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/`:
- Gate logs: `sc240-review-tsc.log`, `sc240-review-lint.log`, `sc240-review-jest.log`, `sc240-review-shots.log`, `sc240-review-freeze.log`, `sc240-review-parity.log`.
- Probe logs and sources: `sc240-review-probe-refs.log`, `sc240-review-probe-portrait.log`, `sc240-review-probe-refs.test.ts.txt`, `sc240-review-probe-portrait.test.ts.txt`.
- Sabotage logs: `sc240-review-sab-{a-revert,a-creature-only,a-hero-only,a-always-drop,a-notrim,b-revert,b-never-warn,b-warn-on-null}.log`.

## Re-review (fix round, `git diff 225b02e..3284b5d`)

**Verdict: APPROVE-WITH-FIXES.** All four folded findings are fixed as prescribed and their tests can fail. However, the INFO-1 gate `imgSrcRaw?.trim()` introduces a MEDIUM regression when the `image` value is not a string.

### MEDIUM-1 — A non-string `image` value throws inside `.catch`, so the fallback glyph never mounts
- `src/elements/initiative/view.ts:1188` (`if (imgSrcRaw?.trim())`). The `image` field is not type-validated at parse (`model.ts:19` `image?: unknown`; the view passes `character.image ?? null` straight through). For `image: 123`, `true`, `[a, b]`, `{x: 1}`, or an unquoted Obsidian wikilink `image: [[Frodo.png]]` (YAML reads that as a nested array, and users plausibly type it):
  - `resolveImageSource` rejects on `.match`.
  - The `.catch` handler then throws `TypeError: imgSrcRaw.trim is not a function`.
  - `renderPortraitFallback` is never reached, so the portrait slot is **EMPTY**.
- Measured with an A/B probe on the same file: at `3284b5d`, 5/5 cases leave an empty slot with 0 warns, and the TypeError appears in the log. At `225b02e`, 5/5 cases show the shield fallback with 1 warn each. This is a visible change for malformed input, which breaks ruling 2 ("No visual change").
- Fix: make the gate type-safe and keep the warn for non-string garbage, as 225b02e did:
  `if (typeof imgSrcRaw === 'string' ? imgSrcRaw.trim() !== '' : imgSrcRaw != null) {`
  Add a test with hero `image: [[Frodo.png]]` (unquoted) that asserts no TypeError or rejection, the `shield` fallback mounted, and 1 warn.
- Evidence: `sc240-review-rereview-probe-nonstring-HEAD.log`, `sc240-review-rereview-probe-nonstring-225b02e.log`, probe source `sc240-review-rereview-probe-nonstring.test.ts.txt`.

### Folded findings — verified
- LOW-1: fixed. `isSccShapedRef` now sits at `resolveRefs.ts:60-65` next to `SCC_PREFIX_RE`, and the SC-134 JSDoc (`:67-94`) sits directly against `resolveStatblockRef` (`:95`). The move is pure: the function body is unchanged.
- LOW-2: fixed. `initiative-resolve-refs.test.ts:435` adds the padded-ref test. Re-running the `a-notrim` sabotage now turns it red (1 failed / 54 passed; `sc240-review-sab-rr-a-notrim.log`).
- LOW-3: fixed, and the assertion is real. The new test expects `toHaveBeenCalledTimes(4)` (1 hero + 1 enemy detail row + 2 grid cells) and a `skull` fallback on each enemy slot. Sabotage `kind === 'hero'`-only warn → red (`sab-rr-b-hero-only-warn.log`). Sabotage never-warn → red (`sab-rr-b-never-warn.log`).
- INFO-1: fixed, and the test can fail. Sabotage `?.trim()` → plain `imgSrcRaw` turns the whitespace-only test red (`sab-rr-b-notrim-gate.log`).
- Behavior change beyond INFO-1: only MEDIUM-1 above. The resolveRefs change is a comment/position move only.

### INFO-R1 — A flaky, unrelated test in the first full jest run
- The first full run (`sc240-rereview-jest.log`) had 1 failure: `test/dom/framework/sidebarEncounterHandoff.test.ts:416` (SC-153 "persists the id it minted"). Load was about 4–6. The suite passed 3/3 isolated re-runs, and a second full run was green (`sc240-rereview-jest-2.log`). The delta does not touch the sidebar or handoff code. This looks like an existing timing flake; the owner may want a Backlog ticket.

### Jest
- Second full run at `3284b5d`: **3936 passed / 1 skipped / 202 of 203 suites, exit 0** (matches the implementer). The first run had 3935 passed and 1 failed because of the INFO-R1 flake.
- Shots, freeze and parity were not re-run as instructed. MEDIUM-1 only affects malformed input that no shot fixture uses.
- Working tree byte-clean before and after. Every sabotage edit was restored with `git checkout`, and the probe file was moved out of the repo.

## Re-review 2 (MEDIUM-1 fix, `git diff 3284b5d..f6fb208`)

**Verdict: APPROVE.** MEDIUM-1 is resolved. There are no new findings beyond one optional INFO.

- The guard at `src/elements/initiative/view.ts:1200` (`const wasSpecified = typeof imgSrcRaw === 'string' ? imgSrcRaw.trim() !== '' : imgSrcRaw != null;`) is exactly the prescribed expression. The delta changes nothing else in the source besides comments.
- Non-string probe at `f6fb208`: all 5 cases (`123`, `true`, `[a, b]`, `{x: 1}`, `[[Frodo.png]]`) show the `shield` glyph with 1 warn each. That matches `225b02e`, and no TypeError appears in the log (`sc240-rereview2-probe-nonstring.log`). The probe is hero-only; enemy slots share the same `renderPortrait` code.
- The new test can fail:
  - Sabotage that reverts the guard to `imgSrcRaw?.trim()` → 1 red, and the log shows `TypeError: imgSrcRaw.trim is not a function` (`sc240-rereview2-sab-revert-guard.log`).
  - Sabotage that makes the non-string branch return `false` → 1 red (`sc240-rereview2-sab-nonstring-silent.log`).
  - All other tests stayed green in both sabotages.
- The two initiative test files plus the probe at `f6fb208`: **47 passed / 3 suites, exit 0** (`sc240-rereview2-tests.log`). Of the 47, `initiative-portrait-missing.test.ts` holds 6 and `initiative-resolve-refs.test.ts` holds 36.
- **INFO-R2** (optional, comment only): `test/dom/elements/initiative-portrait-missing.test.ts:237` says the test "Pins: no TypeError/unhandled rejection". In fact the `rejections` assertion stayed green under the revert-guard sabotage, because this throw never reaches the `unhandledRejection` listener. The test goes red through the warn-count and glyph assertions instead. Reword the comment to "pins the fallback glyph + warn (a throw here would skip both)" if desired. No behavior impact.
- Working tree byte-clean before and after. Both sabotages were restored with `git checkout`, and the probe file was deleted after each run.
