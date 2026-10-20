# SC-364 r4 — scoped re-review of the fix round (a22300d..7ff6068)

**Executive summary**
- Verdict: **FIX-ROUND (LOW-only, comment-only, ~4 lines).** Every hunk is proven comment-only. L1, L2 and I2 from r2 are addressed, and the r2 L2 rewrite is accurate. The problem is new text: three comments now say ds-skills is "chrome-bearing since SC-255", which is wrong. ds-skills gained `chrome` and `collapseKeysOwnedByModel` in SC-169 round 3 (c15a4b4, 2026-08-18); SC-255 only removed SkillsView's own header (R4-L1). My r2 I2 wording ("date from before SC-255") probably seeded this error.
- Findings: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 2 / INFO 1.
- Comment-only proof:
  - Built `main.js` is the same at both commits: sha256 `42f1445cb45163749640192ef5edd3cad7d6cb8706ebf47fabeaf773955d13b0`, from clean scratch builds of a22300d and 7ff6068 and the worktree rebuild. `styles.css` is `698d2d07…` at both.
  - For all 8 touched files (including the 3 test files, which are not in the bundle), the TS-parser AST printed without comments is identical between the two commits. A negative control (one flipped operator) is detected.
- Gates at 7ff6068: tsc (incl. `-p e2e`) clean, RC 0. lint clean, RC 0. jest 5257 passed / 1 skipped, 229 of 230 suites, RC 0.
- Worktree `git status --porcelain` was empty before and after. I made no commits.

## (1) Comment-only

| File | AST without comments, a22300d vs 7ff6068 |
|---|---|
| src/framework/chrome/collapsedKey.ts | same |
| src/framework/pipeline.ts | same |
| src/framework/registry.ts | same |
| src/framework/seams/prefs.ts | same |
| src/framework/seams/theme.ts | same |
| test/dom/elements/skills.test.ts | same |
| test/dom/elements/stamina-bar.test.ts | same |
| test/dom/framework/kit-lifecycle.test.ts | same |

Method: `ts.createSourceFile` → `createPrinter({removeComments:true}).printFile`, then `cmp`. As a negative control, `def.chrome !== undefined` → `===` in pipeline.ts is reported as DIFF. A first attempt used the raw scanner. It produced false DIFFs because the scanner tokenizes backticks inside comments without context, so I replaced it with the parser-based comparison.

## (2) Accuracy of each rewritten comment

- **theme.ts:145** ("WeakMap precedent: src/framework/view.ts `AFTER_RENDER`"): accurate. `view.ts:52` is `new WeakMap<HTMLElement, AfterRenderHook>()`, and its comment (`view.ts:50`) gives the same "collectable" rationale.
- **prefs.ts:300-301** ("WeakMap precedent: theme.ts's themeServiceByApp"): accurate (`theme.ts:149`). The line break leaves a short line (`// themeServiceByApp). The plugin`). Cosmetic only.
- **stamina-bar.test.ts:67-70, kit-lifecycle.test.ts:58-61, skills.test.ts:75-80** (readCollapsePref reads via prefs.get() when the descriptors are registered and falls back otherwise; registering is what lets a test set them): accurate.
  - `pipeline.ts:95-101` `readCollapsePref` returns `fallback` when the descriptor is missing.
  - The fallbacks (true/false) equal the catalog defaults (`catalog.ts:582,589`).
  - `prefs.set`/`get` on an undescribed key throws (`seams/prefs.ts:179-183` `descriptorFor`).
  - "(not SkillsView — SC-255)" in skills.test.ts is correct: SC-255 removed SkillsView's own collapse read.
- **collapsedKey.ts:42-44, pipeline.ts:434-436, registry.ts:151**: the mechanics are accurate.
  - `skills/definition.ts:36` has `chrome: skillsChrome` and `:46` has `collapseKeysOwnedByModel: true`.
  - `stamina-bar/definition.ts:36,42` has the same pair.
  - `pipeline.ts:437` `claimLegacyKeys = def.chrome !== undefined && def.collapseKeysOwnedByModel !== true`.
  - The **provenance "since SC-255" is wrong**; see R4-L1.

## (3) Remaining stale references

I grepped `src/ test/ .repo-docs/` at 7ff6068 for `resolveCollapsePrefs|declaredCollapsePrefs|DeclaredCollapsePrefs|side.?channel|ComponentWrapper.ts:<n>|opts into chrome|once it opts|not opted|non-chrome|without the slot|no chrome`.
- Channel and helper references: **none left**. The only hit, the historical note at `skills.test.ts:79`, is gone too; that comment was rewritten.
- "ds-skills has no chrome" claims: **none left**.
- Remaining "non-chrome"/"without the slot" hits are generic and accurate: `collapsedKey.ts:39`, `pipeline.ts:434`, and the chrome tests that use `ds-hr`.
- One stale count remains on a line this round edited; see R4-L2.

## Findings

### LOW

**R4-L1. "chrome-bearing since SC-255" is false provenance.**
- Where: `src/framework/chrome/collapsedKey.ts:43`, `src/framework/pipeline.ts:435`, `src/framework/registry.ts:151`.
- Evidence:
  - `git log -S'chrome: skillsChrome'` and `git log -S'collapseKeysOwnedByModel'` on `src/elements/skills/definition.ts` both point only to `c15a4b4` ("SC-169 round 3 — … rollout to every card element", 2026-08-18).
  - `test/dom/framework/chromeRound2.test.ts:459` is titled "ROUND 3 — `ds-skills` opts in and keeps ownership of the legacy pair".
  - `skills/definition.ts:37` says "SC-169 ROLLOUT — the SECOND definition to set this".
  - SC-255 (495c91b, 2026-09-24) only removed SkillsView's own header, which made the panel the only consumer.
- Failure scenario: someone tracing why ds-skills reads the legacy pair non-destructively looks for the change in SC-255, does not find it, or concludes SC-255 changed parse semantics. It did not.
- Fix: replace "(chrome-bearing since SC-255)" with "(chrome-bearing since SC-169 round 3)" in all three places, or drop the parenthetical. This is comment-only. Gate: tsc and lint, plus a main.js sha256 check that it is still `42f1445c…`.

**R4-L2. The "~30 elements that have not opted in" count is stale, on a line this round edited.**
- Where: `src/framework/chrome/collapsedKey.ts:40-41`.
- Evidence: after the SC-169 round-3 rollout, 20 of the 22 `src/elements/*/definition.ts` declare `chrome`; only `horizontal-rule` (ds-hr) and `roll` do not. The display family sets `chrome` in `displayFamily.ts:79,223`.
- The count predates SC-364, but the fix round rewrote this sentence ("…not opted in); and") and kept the wrong number.
- Fix (optional, comment-only): change it to "(zero blast radius across the elements that have not opted in, e.g. `ds-hr`)", with no count.

### INFO

**R4-I1.** The `prefs.ts:301` reflow leaves a short comment line (`// themeServiceByApp). The plugin`). Cosmetic only; no action needed.

## Evidence (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc364-r4-rereview-m3v7/`)
- Gates: `sc364-r4-tsc.log`, `sc364-r4-lint.log`, `sc364-r4-jest.log`, and `sc364-r4-build.log` (the worktree rebuild after jest's `rm -f main.js styles.css`). Each ends with `RC=` from the wrapper `sc364-r4-gate.sh`.
- main.js hashes: `sc364-r4-build-a.log` (a22300d) and `sc364-r4-build-b.log` (7ff6068), built from git-archive trees `a/` and `b/`.
- AST comparison: `sc364-r4-tokens.js`, `sc364-r4-tokcmp.sh`, `sc364-r4-tokcmp.log`. Negative control: `sc364-r4-neg.sh`, `neg/pipeline.ts`.
