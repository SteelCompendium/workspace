# SC-408 fix round F3: rebase onto the latest develop, plus R3's small items

## 0. Context
1. Read the ledger `decisions.md`, newest entry "Review R3 … Rulings". That is your scope.
2. Read the review `sc408-r3-review.md` (same dir). Its findings carry `file:line` and the
   prescribed fixes.
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `a066544`. Superproject worktree commits up to `d72c46b`; the
   submodule pointer stays uncommitted. Workers never call the tracker.

## 1. Task
1. `git -C … fetch origin` and rebase `sc408-functest` onto the current `origin/develop` (R3 saw
   `e9502a8`: SC-390, sdk 3.1.0, touching `package.json`, the lock and statblock source).
   Resolve the lock as before: take upstream's, regenerate from `package.json`, and show that 0
   existing package versions changed. Report the old → new sha mapping and the new base sha.
2. LOW-1: retitle the 6 plain creature tests in `stamina-edit-modal-matrix.test.ts` (the 5
   Q06–Q10 rows and Q16) that go red under the SC-432 fix. Use the suffix
   "[current behaviour — SC-432 changes this]". Alternatively, where a row's point is not
   creature-specific, flip it to a hero.
3. LOW-2: add bounds assertions to `[STAM-T11]` so a temp "−" never RAISES temp. The bound must
   hold today and after SC-433. Add one plain jest test asserting the same. Prove it bites: mutate
   "−" to raise temp, show both tests fail, then revert.
4. LOW-3 / LOW-4 / INFO-3 (docs):
   - add `Initiative/hurt.md` to the `e2e/README.md` fixture table;
   - add the e2e gate to the dse-verify skill's Overview paragraph;
   - add "required to land any change" at `.repo-docs/development.md:79`;
   - remove or update the skill and README text that still describes the retired "ruling pending"
     suffix.
   Commit the superproject skill change in the superproject worktree, never the pointer.

Commit after each step. No push. No Claude/AI attribution in commit messages. No `src/` changes.

## 2. Gates (dse-verify order)
tsc and lint clean. Jest (`rm -f main.js styles.css` first): 4720 + 1 new + whatever the new
develop adds, 0 failures. Lifecycle (`DSE_LIFECYCLE_PORT=9308`) 25/25. `npm run e2e`: 0 failed,
coverage 47/47, 12 known-bug; then 3 back-to-back full runs at `--shards=4`. Shots 0 FAIL and
freeze all-OK; report the counts, since the new develop may add captures. Parity LAST: 0 / 0 / 24.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-fix3-report.md`, opening
with an executive summary of at most 10 lines: the new base sha, the DSE head, the superproject
commit(s), every gate number, and the bite proof for LOW-2.

Return contract: your final text goes to the ticket-owner, not a human. Give raw facts, shas,
numbers and absolute paths. If the report write is blocked, return it inline. Run gates in the
foreground with output redirected to files; never background a job and wait for a notification.
You cannot message me; if you need input, end with `STATUS: NEEDS_CONTEXT`.
