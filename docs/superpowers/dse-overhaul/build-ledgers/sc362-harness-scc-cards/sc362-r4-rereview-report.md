# SC-362 r4 scoped re-review (fix delta only)

## Executive summary

- **Verdict: APPROVE.** 0 findings of any severity.
- Branch: dse `sc362-harness-scc-cards` @ `bc4a0c5` (fixes) on `aff5034` (implementation, rebased) on `origin/develop` `08206e3`. The merge-base with origin/develop is `08206e3`.
- (1) `git diff aff5034 bc4a0c5` touches 2 files (+12/-6) and makes exactly the four folded items: LOW-1, LOW-2, INFO-3 and INFO-4. Each change is correct.
- LOW-1 probe: I forced `RefUnwrapView.errorCard` onto the friendly notice path, so the card stops being an error card. The new `toContain('error card')` assertion then fails (1 failed / 109 passed), while the old `errors.length > 0` assertion would still pass. Reverted byte-clean.
- (2) `range-diff 0ce76dd..1684455 08206e3..aff5034` gives `1: 1684455 = 1: aff5034`. The patch text, with `index` lines stripped, is identical. The rebase did not change the implementation.
- (3) `npx jest test/dom/visual-harness/fixtures.test.ts` on `bc4a0c5`: `Tests: 110 passed, 110 total`, 1 suite passed, rc 0.
- I did not re-run the rest of the battery; the brief said not to.
- The working tree is the same before and after. `git status --porcelain` is empty, the ignored set is identical (I rebuilt `main.js`/`styles.css` with `build-no-check` after the jest protocol removed them), and HEAD is `bc4a0c5`.

## (1) The fix delta, item by item

- **LOW-1** (`test/dom/visual-harness/fixtures.test.ts:191-205`):
  - The comment now says the typed `ds-rule` with no compendium renders an ERROR card, which the pre-existing check reports. It also says this test does not exercise the `.dse-ref-notice` guard, and points to the web-card test. That is accurate.
  - New assertion at `:204`: `expect(errors.join('\n')).toContain('error card')`. The probe below shows it can fail.
- **LOW-2** (`visual-harness/entry.ts:371-376`): the heroSparse comment now names `.dse-hero__ability-issue` ("not installed") instead of "notice". This matches `src/elements/hero/view.ts:645`.
- **INFO-3** (`visual-harness/entry.ts:1943-1945`): the fallback comment now mentions mountOne's `probeSource` step.
  - The claim is correct. `probeSource` (`entry.ts:2062`) only produces `montage/probe-rounds-N`, which is not a `FIXTURES` key, so it takes `montage/default`'s mode, which is `none`.
- **INFO-4** (`visual-harness/entry.ts:1928, 1930`): the seed path and the resolver now come from `deps.settings` instead of `DEFAULT_SETTINGS`.
  - `makeHarnessDeps` passes `settings: DEFAULT_SETTINGS` (`entry.ts:1996`), so behaviour is unchanged.
  - `DEFAULT_SETTINGS` is still used elsewhere in `entry.ts` (`:1960`, `:1982`, `:1996`), so the import stays live.
  - Nothing else is in the delta: no other files and no other hunks.

## LOW-1 can-fail probe

- **Edit:** `src/elements/shared/RefUnwrapView.ts:351`, `if (this.opts.friendlyErrors) {` changed to `if (true || this.opts.friendlyErrors) {`. Typed families now render the notice card instead of the error card.
- **Result:** `Tests: 1 failed, 109 passed, 110 total`. The only failure is `a by-SCC fixture mounted with no compendium fails the mount`, at `fixtures.test.ts:204`:
  - Expected substring: `"error card"`
  - Received: `"reference notice (unresolved by-SCC card): Compendium not installed — …"`
- Because the notice guard still reports an error, the old `length > 0` assertion alone would have stayed green. The new assertion is what catches the change.
- **Revert:** restored from a copy. The sha256 `17ff927a…` matches the original and `git diff` is empty.

## (2) Rebase fidelity

- `git range-diff 0ce76dd..1684455 08206e3..aff5034` gives `1:  1684455 = 1:  aff5034 SC-362: harness compendium seam + …`.
- `diff <(git diff 0ce76dd 1684455 | grep -v '^index ') <(git diff 08206e3 aff5034 | grep -v '^index ')` is empty.

## Evidence

Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc362-r4-rerev-p3n8/`

- `logs/jest-fx-clean.log`: the targeted jest run on `bc4a0c5`.
- `logs/jest-fx-probeL1.log`: the LOW-1 probe run.
- `logs/rebuild-mainjs.log`: the rebuild of the ignored `main.js`/`styles.css`.
- `RefUnwrapView.ts.orig`: the restore copy.
- `status-{before,after}{,-ignored}.txt`: tree status snapshots.
