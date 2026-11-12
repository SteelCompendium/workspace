# SC-582 independent review, round 1

Executive summary
- Verdict: LAND. O2, O3, O4 and O5 are met. I probed the paths the implementer did not test, and every one passed.
- Findings: HIGH 0, MEDIUM 0, LOW 1, INFO 3. The LOW is test strength only: the "(any case)" test does not exercise case-insensitivity. Cheap to fix, but it does not block landing.
- Reviewed: plugin dcec985a (fix b59913b5) against d0561a68 (origin/develop is still d0561a68), and superproject b4d0526e against origin/main.
- tsc rc 0, lint rc 0. jest 10763 passed / 1 skipped / 0 failed (shots-cached css; equals the implementer's fresh 10762/2 plus the 1 cached test).
- e2e: `OBSIDIAN-E2E done: 290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (rc 0). COND-E02 and COND-E03 pass with label `Green`.
- Fix reverted (src/ at d0561a68): 8 of the implementer's tests fail (the 3 new, the 1 converted, the 4 updated selectors), and 6 of my 8 probes fail. Tree restored and clean.
- Lifecycle not re-run: the diff changes no file the lifecycle reads. `obsidian-lifecycle.mjs` reads no swatch aria-label and never drives `setColor`. The implementer logs show 60/60.
- Shots and freeze not re-run: the diff changes no CSS and no harness rendering. The implementer's freeze log shows 280/280, run after both source commits.
- Working tree is the same as before the review (porcelain --ignored diff empty). I made no commits.

## Findings

### LOW-1: test (c) claims "any case" but cannot reach the case-insensitive match; a case-sensitive mutant survives
- Where: `test/dom/views/conditions-modal.test.ts:1236-1248` (test `SC-582: a custom pick equal to a preset (any case) ...`). The guarded code is `src/views/ConditionsModal.ts:507` (`SWATCHES.find(([, h]) => sameColor(hex, h))`).
- Evidence: jsdom sanitises `<input type=color>` values to lower case. Probe P1 set `#1E8449` and read back `"#1e8449"`, so the implementer's caveat is correct. I mutated line 507 to `hex === h` and ran all of `test/dom/views/`: 1099 passed and 2 failed. The only 2 failures were my probes P2 and P3. Every repo test passed against the mutant.
- Failure scenario: a later refactor makes the lookup case-sensitive. CI stays green. Any upper-case hex that reaches `setColor` would then send focus to the custom input instead of the named swatch.
- Reachability: in production I found no route for an upper-case hex into `setColor`. A swatch click passes the lower-case SWATCHES hex. The colour input's value is lower-cased by the HTML value-sanitisation rule, in Chromium as well as jsdom. A YAML `#C0392B` never reaches `setColor`. `sameColor` here is defensive, which is why this is LOW.
- Fix (pick one): (a) in test (c), override the input's value with an upper-case getter before dispatching `change`: `Object.defineProperty(input, 'value', { configurable: true, get: () => '#1E8449', set: () => undefined })`. My probe P3 does exactly this; it passes on the fix and fails on both the mutant and d0561a68. (b) Add a test that calls `(modal as any).setColor(0, '#1E8449')` and expects focus on `Green` (probe P2). (c) At minimum, drop "(any case)" from the title so the test does not claim coverage it lacks. I recommend (a): it is a one-line change.

### INFO-1: a comment overstates the result: the hex can still be read out as the accessible description
- Where: `test/dom/views/conditions-modal-matrix.test.ts:235` says "so a screen reader never gets a hex code". The source comment at `src/views/ConditionsModal.ts:476` is accurate.
- Why: the button's `title` (`Green (#1e8449)`) is not used for the name, so it becomes the accessible description. NVDA and JAWS can read "Green, toggle button, Green (#1e8449)". The ticket and O2 are about the accessible name, which is now `Green`, so the behaviour is correct.
- Fix (optional): reword the comment to "the accessible name never carries a hex code". I do not suggest changing O2; the hex in the description is harmless context.

### INFO-2: O3's "YAML #C0392B" clause does not involve `setColor`; the implementer's reading holds
- A YAML colour only drives the pressed mark that `renderSwatches` sets at render time, using the case-insensitive `sameColor`. The existing SC-361 test covers that. My probe P4 (YAML `#C0392B`) confirms all of this: Red is pressed and named `Red`, the custom swatch is not selected, the custom labels are `Custom color` and `Custom condition color`, and clicking Red then puts focus on `Red`.

### INFO-3: the implementer report's grep note is stale
- The report says "remaining hits are only historic ledger files under docs/superpowers/dse-overhaul/build-ledgers/". My grep for `Color #`, `` `Color ${ `` and "will rename" across src, test, e2e, visual-harness and docs (and the whole plugin tree outside node_modules, dist, shots and .out) finds 0 hits. Nothing is left over. No action needed.

## Probes run (temporary file `test/dom/views/zz-sc582-rev-probe.test.ts`, deleted; copy kept as evidence)
| Probe | On fix | On d0561a68 src | On `hex === h` mutant |
|---|---|---|---|
| P1 jsdom lower-cases the colour input value | pass ("#1e8449") | pass | pass |
| P2 `setColor(0,'#1E8449')` puts focus on `Green` | pass | FAIL | FAIL |
| P3 colour-input `change` with an upper-case value getter puts focus on `Green` | pass | FAIL | FAIL |
| P4 YAML `#C0392B`: Red pressed and named; O4 custom labels unchanged; click puts focus on Red | pass | FAIL | pass |
| P5 non-preset `#123456`: `Custom condition color #123456, selected` / `Custom color` (O4) | pass | pass | pass |
| P6 two rows: picking Green in row 1's editor puts focus in row 1's editor, and row 0 keeps Blue; then Purple in row 0 | pass | FAIL | pass |
| P7 close and re-open the window: names, unchanged titles, saved colour pressed | pass | FAIL | pass |
| P8 each colour name is the accessible name of exactly one button in the window | pass | FAIL | pass |

## Other checks
- O2: the names are exactly `Red, Amber, Green, Blue, Purple`. Titles are unchanged (`Name (#hex)`). The group label is `Color`.
- O5: `visual-harness/mocks/sc186-entry.mjs` uses `[name, hex]` pairs, and `aria-pressed` still compares the hex. `node --check` passes. The mock is a standalone design-options page (`sc186-build.mjs`) outside the shots gates.
- No e2e test title has a bracketed ticket id. The COND-E02 and COND-E03 titles are unchanged.
- Changelogs: in the dse `CHANGELOG.md`, the entry is the top bullet of the 7.0.0 section. In the worktree superproject `CHANGELOG.md`, the entry is under `## Unreleased`, above SC-583. Both are accurate and in plain words. Both name the colours in words, start with what a screen reader now says, and keep the hex only as the old label being quoted. Small nit, no action needed: the superproject bullet's double colon ("DSE plugin: Conditions window: ...") reads a little awkwardly.
- `docs/initiative-tracker.md:452` does not describe the accessible name, so leaving it unchanged is correct.
- The shots camera clicks the first `.dse-swatch` (`visual-harness/shoot.mjs:3677`). That click goes through `setColor`, which now finds `Red` by name. The old code found `Color #c0392b`; the focus result is the same.

## Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc582-rev-r1/`
- `sc582-rev-rc.txt`, `sc582-rev-tsc.log`, `sc582-rev-lint.log`, `sc582-rev-jest.log`: tsc, lint and full jest
- `sc582-rev-e2e.log`, `sc582-rev-e2e.rc`: e2e
- `sc582-rev-jest-reverted.log`, `sc582-rev-revert.rc`, `sc582-rev-revert-status-{during,after}.txt`: src reverted to d0561a68 (14 failed = 8 implementer + 6 probes)
- `sc582-rev-jest-mutant.log`, `sc582-rev-mutant.diff`, `sc582-rev-mutant.rc`, `sc582-rev-mutant-status-after.txt`: case-sensitive mutant (2 failed, both probes)
- `sc582-rev-probe-fix.log`: probes on the fix (8/8)
- `sc582-rev-probe.test.ts.txt`: probe source
- `sc582-rev-status-{before,after}.txt`, `sc582-rev-wstatus-{before,after}.txt`: tree before and after (identical)
- Implementer logs checked: `.../scratchpad/sc582-impl-r1/sc582-freeze.log` (280/280), `sc582-lc1..6.log` (21+16+9+4+7+3 = 60/60), `sc582-shots.log`, `sc582-parity.log`
