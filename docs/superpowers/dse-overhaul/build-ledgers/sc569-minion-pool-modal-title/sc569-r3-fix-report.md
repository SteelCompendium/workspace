# SC-569 r3 fix report

**Executive summary**
- Verdict DONE. All four folds in (LOW-1, LOW-2, both CHANGELOG bullets, INFO-2 probe tests). Not pushed.
- dse branch `sc569-minion-pool-modal-title` head `c663a137`, rebased onto `origin/develop` `506786cb` (SC-614) with no conflicts. r3 added one commit on top of r1's two.
- Superproject head `e490a9ae` on `origin/main` `075b61e3`: `66f2f2c3` (CHANGELOG bullet), `e490a9ae` (one pointer bump to `c663a137`). `diff origin/main --stat`: only `CHANGELOG.md` and `draw-steel-elements`.
- LOW-1: the tracker draws a cell per `creature.instances` entry, so only squads with instances (or, before parse, `amount > 0`) are counted.
- LOW-2: same-name test uses `name.replace(/\s+/g,' ').trim().toLocaleLowerCase()`, displayed name stays raw.
- New jest +9 (7 red against the r1 helper, 2 are green regression guards); total SC-569 jest +16. e2e unchanged (POOL-E06/E07).
- Gates on the final head (after the SC-614 rebase): tsc/lint 0, jest 11916 passed / 1 skipped (cache present), lifecycle 64/64, e2e 342/345 + 176/176 pairs, shots 592, freeze 280/280, parity 0/0/24.

## Commits
dse (`/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title/draw-steel-elements`), after the rebase onto `506786cb`:
- `42bc5757` feat(minion-pool): title the pool modal with the squad when a group holds several (SC-569) [r1; was `f956e306`]
- `e4e9acb2` test(minion-pool): e2e for squad-named pool modal titles, two-squads fixture (SC-569) [r1; was `8dbd9698`]
- `c663a137` fix(minion-pool): pool modal title counts only drawn squads and folds name case/spacing; tracker-level title tests; changelog (SC-569) [r3; pre-rebase `27a65b45`]
Rebase conflicts: none (SC-614 touched `view.ts`, `conditionIcons.ts`, `initiative-matrix.test.ts`, `conditionIcons.test.ts`, `e2e/manifest/initiative.ts`, a focus e2e spec and `CHANGELOG.md`; my edits merged cleanly, CHANGELOG bullet still first in 7.0.0).
Superproject (`/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`): the branch had no commits of its own, so "rebase" was a move onto `origin/main` `075b61e3` (soft reset + mixed reset so the submodule checkout stayed on my head; stale working-tree files restored from HEAD). Commits: `66f2f2c3` docs CHANGELOG Unreleased bullet, `e490a9ae` chore: bump draw-steel-elements to c663a137. dse submodule HEAD verified `c663a137` afterwards.

## Code (`src/views/MinionStaminaPoolModal.ts`)
- `minionPoolModalTitle`: `squads = minionCreatures(group).filter((c) => (c.instances?.length ?? c.amount) > 0)`; `< 2` squads gives the plain title; same-name match by `squadNameKey` (`replace(/\s+/g,' ').trim().toLocaleLowerCase()`); `(squad N)` by identity position; raw `creature.name` shown.
- LOW-1 tracker-render finding: `view.ts` renders `group.creatures.forEach(... creature.instances?.forEach(...cell))`, and `adjustInstances` (`elements/initiative/model.ts`) gives `amount <= 0` an empty list (`want = amount > 0 ? ceil(amount) : 0`), so an amount-0 squad has no cell and no way to open its modal. `amount: 0.5` still draws one cell (ceil) and still counts; a squad whose minions are all dead keeps its DEAD cells and still counts.

## Tests (TDD)
Against the r1 helper (`git stash` of the src file only): 7 failed, 9 passed of the 16 SC-569-named tests; with the fix 16/16.
- `test/dom/views/minion-stamina-pool-modal.test.ts` (helper, +5): amount-0 squad not counted (plain title, two shapes); amount-0 takes no number; post-parse drawn squads = those with instances; case/space fold ("Wolf"/"wolf", "  Dire  Wolf "/"Dire Wolf"), shown as written; folding does not merge "Wolf" with "Dire Wolf". All 5 red on r1's helper.
- New `test/dom/elements/initiative-sc569-pool-modal-title.test.ts` (real tracker via ElementPipeline, +4): `[Flow, Boss(captain), Flow]` grid sweep (squad 1 / captain "Boss Stamina" / squad 2); detail-row route (select squad 2, open from the stamina readout and from `init.detail.bar`); amount-0 squad draws no cells and keeps the plain title; amount-0 beside two squads numbers them 1 and 2. The last two are red on r1's helper; the sweep and detail-route tests are green on it (regression guards, INFO-2).
- Probe adopted from the reviewer's `sc569-r2-probe.test.ts` (grid sweep, detail route); its captain_of / geometry probes not adopted (out of scope: SC-634, SC-635).

## CHANGELOG
- dse `CHANGELOG.md`: `- [FEATURE] **Minion pool window: when a group holds several squads, the title names the squad you opened** (SC-569).` at the top of `## 7.0.0`.
- Workspace `CHANGELOG.md` (in my worktree's superproject only): bold first line `(SC-569)` plus two lines with the OD-1 example titles, first bullet under `## Unreleased`.

## Gates on `c663a137` (all re-run after the SC-614 rebase; earlier runs on `27120710` void). Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r3/`
- tsc exit 0 (`tsc-b.log`); lint exit 0 (`lint-b.log`).
- jest `--silent`: `Tests: 1 skipped, 11916 passed, 11917 total`; `Test Suites: 1 skipped, 279 passed` (`jest-full-b.log`). Shots cache present (from my earlier shots run), so this is 11900 (SC-614 base) + 16 SC-569 tests. Fresh (no cache) figure by the documented 1 passed <-> 1 skipped relation: 11915 passed / 2 skipped (derived, not measured: I cannot delete the cache).
- lifecycle, seven parts, union 64/64: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, part 7 `G-S108,G-S112,G-S115` 3/3 (`lifeB-1.log` .. `lifeB-7.log`). No G-S115 red this round (loadavg 3.5 at part 7).
- e2e: `OBSIDIAN-E2E done: 342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (`e2e-full-b.log`).
- shots: 592 written; button host-leak 163 kinds / 978; modal button host-leak 40 kinds / 240; capture clip 147; exit 0 (`shots.log`).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)` (`freeze.log`).
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 (`parity.log`).
- Working tree clean after gates. Pre-rebase run on `27120710` for reference only (tsc/lint 0, jest 11909/1, e2e 340/343, lifecycle parts 1-6 green): superseded.

## Drive-by fixes
None.

## Follow-ups
- Out of scope per brief, already filed by the owner: SC-634, SC-635, SC-636.
- `docs/initiative-tracker.md:309` still says nothing about the squad-named title (reviewer marked optional; not added).
- Fresh-worktree jest figure was derived, not measured (no `rm` of the shots cache allowed).
