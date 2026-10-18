# SC-408 — Functionality Testing — decisions ledger

Effort ID: `sc408`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest`
(every submodule on branch `sc408-functest`; DSE cut at `be4f002` = `origin/develop`).
Ledger dir (shared global state — prefix every file `sc408-`):
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/`.

## The ask (ticket description, verbatim, Scott 2026-10-16)

> One thing im pretty concerned about is behavior functionality of the elements. I want to
> make sure that the dozens of interactions that are possible in the stamina modal actually
> function properly, for example.  what is the best way to go about this?  I want the tests
> to be comprehensive and able to be ran relatively easily to find regressions and other
> bugs.  If this test requires the use of the screen ( can't use laptop while it runs) then
> thats okay.

## Scott's rulings

- 2026-10-18 (SC-408 comment, verbatim, answering the consolidated ask `sc408-comment-2.md`):
  > 1. yes, land it
  > 2. yes, make it required to land future changes
  > 3. yes, I want to roll this out across all parts of the plugin, including the settings
  > 4. I would like to add CI.  Will the need for a UI be a problem in github? Make a separate ticket and put it in the 7.0.0 project
  > 5. I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands
  > 6. I like your recommendation
  >
  > For any bugs found, please mark them with the DSE 7.0.0 project.

  Where (5) = B5: "disable Spend Recovery for creatures. For heroes with no pool to spend from,
  keep it as a plain 'heal one Recovery's worth' shortcut, relabelled so it does not claim to
  spend anything" + his addition, a confirmation dialog for the no-pool hero. (6) = B6: "make the
  temp field a direct edit, like the Stamina field. Keep 'keep the higher' only for gaining temp
  from an effect."

## Owner rulings (ticket-owner, not Scott)

- 2026-10-17: Round 1 = three parallel survey rounds (orchestration:reviewer): S1 stamina
  modal interaction inventory + coverage gaps + bug probes; S2 test-tooling architecture
  recommendation; S3 element-wide interactive-surface census (sizing). Then: recommendation +
  a working pilot on the stamina modal, reviewed, before asking Scott to approve the rollout.
- 2026-10-17: S1 suspected bugs (report `sc408-s1-stamina-inventory.md` §3) triaged. Bug
  FIXES are OUT OF SCOPE for SC-408 (test infra only); the pilot encodes the correct
  behaviour and marks a known-bug scenario as an expected failure citing its ticket.
  - B1 → SC-425 (ds-hero max 0 zeroes Stamina; experimental).
  - B2 → SC-426 (initiative detail row stale after grid-cell edit). Pilot confirms in real Obsidian.
  - B3, B8, B9, B10 → SC-427 (stamina modal Apply label / parsing / Reset).
  - B4, B15, B16 → SC-428 (Catch Breath gating).
  - B11–B14 → SC-429 (minion pool modal small defects).
  - B5 (free Spend Recovery on untracked bars) and B6 (temp minus silent no-op): design
    calls, held for Scott's ruling in the SC-408 consolidated ask; ticket filed after he rules.
  - B7 (first Apply click swallowed after typing): fold confirmation into the pilot; file a
    ticket only if real Obsidian reproduces it.
  - S1 "observations, not bugs" (Full Heal discards temp, pool condition removal survives
    Cancel, Enter in Apply box does nothing, standalone ds-stamina always isHero, temp "+"
    stacking, over-selection title): dropped for now — characterisation, not defects; the
    pilot pins current behaviour where it touches them.
- 2026-10-17: Architecture (pending Scott's approval; pilot proceeds on the branch, nothing
  lands without his yes): adopt S2's recommendation C+ (`sc408-s2-tooling.md` §4) —
  WebdriverIO + `wdio-obsidian-service` behind a DSE-owned driver in
  `draw-steel-elements/e2e/`; layering L1 jsdom = combinatorial logic matrix, L2 e2e = every
  (control, interaction-kind) pair at least once end-to-end through real input asserting the
  note file + DOM, plus every needs-real-Obsidian interaction; coverage manifest + jsdom
  census + exercised-set gate; headless private Xvfb by default, `--headed` opt-in; pinned
  Obsidian app+installer 1.14.4; shipped specs run with `experimental` OFF; exit 0/1/2 and an
  `OBSIDIAN-E2E done:` summary line; no auto-retries. Lifecycle port-over (phase 2) and CI
  job are rollout, not pilot.
- 2026-10-17: Pilot = the StaminaEditModal, comprehensively, in two implementer rounds:
  P1 infrastructure + 3 proof scenarios (STAM-D01, STAM-K01, STAM-S13 = B7 confirmation) +
  headless/headed/4-shard focus proof + `pendingWrites()` seam; P2 control ids + manifest +
  full scenario set for both shipped hosts (ds-stamina-bar, initiative) + jsdom fill of S1's
  uncovered rows + census + exercised-set gate + B2 confirmation. One independent review over
  the whole pilot after P2. Minion pool modal = rollout tier 1, not pilot.
- 2026-10-17: P1 landed on the branch (dse `4464180`). B7 reproduced in real Obsidian
  (padding click only) → filed SC-430. P1 follow-ups: Node split dropped (standard workspace
  devbox shape gives Node 24.4.1; e2e green on 20.11.1 too); mocha beforeEach-skip → P2a
  uses per-test setup; junit/CI/matrix/lifecycle port stay rollout.
- 2026-10-17: P2 split into two PARALLEL rounds in separate worktrees:
  P2a (resumed P1 implementer, worktree `sc408-functest`): control ids + manifests + census +
  exercised-set gate + every L2 scenario + docs. P2b (fresh implementer, worktree
  `sc408-jsdom`, branch `sc408-jsdom` from `be4f002`): L1 jsdom fill of S1's uncovered
  jsdom-testable rows, test files only. P2b's commits are merged into `sc408-functest`
  afterwards. Pilot surfaces = StaminaEditModal, ds-stamina-bar (incl. RecoveriesStrip),
  and initiative's stamina entry points. Pool modal = rollout.
- 2026-10-17: P2b done (dse `sc408-jsdom` @ `4bdcb5c`, tests only): +204 jsdom tests,
  jest 4448 → 4652, 27 `test.failing` (SC-427 ×11, SC-428 ×10, SC-425 ×4, SC-426 ×2). Its
  F08 follow-up dropped (modal-level NaN unreachable; the two host guards are pinned).
  Merge into `sc408-functest` after P2a finishes, before review R1.
- 2026-10-17: P2a done (dse `07d9f4a`, superproject skill commit `85216b6`): 67 e2e
  scenarios (60 ok, 7 known-bug), coverage 47/47 pairs, 32 s on 4 shards / 91 s serial,
  0 flakes ×4; full battery green (jest 4461, lifecycle 25/25, shots 568, freeze 274/274,
  parity 0/0/24). New findings: N1 (dirty-draft Escape closes the modal, discarding all
  pending changes) → SC-431; the e2e scenario recording current behaviour must become
  `knownBug('SC-431', …)` asserting the intended behaviour — fold into the post-review fix
  round. N2 (marker click loses keyboard focus) → folded into SC-428 item 4.
  W02 (two Applies in one debounce) stays jsdom-only — accepted.
- ~~B5 / B6 (design calls pending Scott): tests pin CURRENT behaviour, titled
  "[current behaviour — ruling pending SC-408]"; not known-bug markers.~~ superseded by Scott's
  2026-10-18 rulings (5) and (6): tickets filed, the pins become known-bug markers citing them.
- Known-bug convention: jest `test.failing(...)` / e2e `knownBug('SC-4xx', …)` — passes while
  the bug exists, FAILS once fixed so the marker gets removed. Title cites the ticket.
- 2026-10-17: Merge of `sc408-jsdom` into `sc408-functest` done (dse `52f0099`); jest 4666 passed
  / 1 skipped (the skip is the pre-existing `migrationCensus` suite — total matches; dropped).
- 2026-10-17: Review R1 (`sc408-r1-review.md`, reviewer identity ab707e89) over `be4f002..52f0099`:
  fix round needed — HIGH 0 / MEDIUM 2 / LOW 7 / INFO 5. Mutation probes 32/32 caught by ≥1
  layer (e2e 27, jest 28); all three coverage checks and the knownBug markers bite. Rulings:
  - M-1 (RECOV-R06 stale-undo-toast flake, 2/42) → FOLD prescribed fixes 1–3. Fix 4 (leftover-
    notice invariant) DROPPED: fix 1 clears notices between tests, so the invariant would only
    re-check the cleanup.
  - M-2 (`it.skip`/`xit` silently shrinks the run) → FOLD: pre-scan makes any run exit 2 on
    `.skip`/`.only`/`xit`/`xdescribe` in a selected spec; reporter-counted pending tests (runtime
    `this.skip()`) count as failures.
  - L-1 (loose `failsWith` pins) → FOLD: unique `message:` per bug assertion, pin on it.
  - L-2 (pairs recorded without real driving) → FOLD all three prescribed fixes, incl. the gate
    requiring ≥1 non-known-bug driver per pair.
  - L-3 (invariant masks every fence) → FOLD: two-block fixture + byte-equality for non-target
    fences + a scenario editing one block of two (integrity-probe rule: two same-kind blocks
    must not cross-talk).
  - L-4 (initiative census keyed on classes) → CARRY INTO ROLLOUT (the initiative-tracker
    rollout ticket gets "census scope by row/grid containers"). Out of scope this round.
  - L-5 (`e2e/` not linted) → FOLD: lint `e2e` with its own Node config block.
  - L-6 (STAM-S06 still a plain pin) → FOLD: `knownBug('SC-431', …)` asserting SC-431's
    intended behaviour (first Escape cancels only the draft, modal stays open with the Damage
    pending; second Escape closes, no write).
  - L-7 (stale docs) → FOLD incl. the dse-verify skill's expected numbers (superproject worktree
    commit, never the pointer).
  - I-2 (env-tag reap backstop cannot see Electron processes) → FOLD: make the backstop match
    something Electron keeps (e.g. `/proc/<pid>/cmdline` containing the run's unique path), or
    delete it with a comment; prove SIGINT still reaps.
  - I-3 (ergonomics) → FOLD: add the reviewer's STAM-R1X (Reset returns a pending Spend
    Recovery; catches M29 at e2e), a README fixture-contents table, a README note that
    `npm run tsc` checks the specs, and a FAIL summary line that keeps the first lines of the diff.
  - I-1, I-4 → no action (informational). I-5 (jest `test.failing` cannot pin a message) →
    DROPPED: jest limitation; P2b hand-checked all 27; the harness-breakage case also breaks
    sibling non-failing tests.
  Fix round → resume the P2a implementer (a2175250, author). Scoped re-review → resume R1
  (did not write the fixes).
- 2026-10-17: Fix round F1 done (dse `1a33560`, superproject skill commit `6e1427b`; `src/`
  unchanged): every folded R1 finding in, each new check bite-proven. e2e 69 scenarios (61 ok,
  8 known-bug incl. SC-431), coverage 47/47, 25/25 full runs green at 4 shards (35.6–36.1 s);
  jest 4666/1, lifecycle 25/25, shots 568, freeze 274/274, parity 0/0/24. Deviations accepted:
  eslint src block narrowed to the files lint already covered; `@wdio/reporter` pinned explicit
  (already in tree); per-run TMPDIR under /tmp (Chromium socket-path limit). Scoped re-review R2
  → resume R1 identity.
- 2026-10-17: Review R2 (`sc408-r2-review.md`, R1 identity, delta `52f0099..1a33560`):
  LAND-READY. HIGH 0 / MEDIUM 0 / LOW 1 / INFO 4. Every folded finding confirmed by re-running
  the R1 probe; 20/20 full runs green (7 under parallel jest load); 6 e2e-caught mutations still
  caught; battery matches F1. Rulings:
  - LOW-1 (`dse.block()` marks a block "edited" on read, `e2e/driver/dse.ts:179-183`) → CARRY
    INTO ROLLOUT: the first Tier-1 rollout ticket gets "driver: mark a block edited only on
    click/type/press inside it, or add a read-only accessor". No current test is affected.
  - INFO (skip pre-scan misses bracket/`specify` forms — pending reporter covers them; pins say
    which assertion not why; `externalEdit` exempts the whole note; cosmetic double spaces) →
    DROPPED, informational. INFO "skill CURRENT block → re-point to `develop`" → LANDING STEP.
  Sample failure bundle eyeballed by owner (M04 Escape-writes: STAM-F07a red, note diff temp 5→1,
  screenshot shows real Obsidian with the bar at 15/20 +1 temp).
- 2026-10-17: Consolidated approval ask posted on SC-408 (`sc408-comment-2.md` + sample failure
  screenshot); state In Progress + label Needs Review (verified: Feature, DSE Plugin, Needs
  Review). Asks: (1) land the pilot (dse `1a33560`, superproject `6e1427b`); (2) `npm run e2e`
  as a required gate step; (3) rollout tickets per tier (T1 pool modal, ConditionsModal,
  initiative tracker + ResetEncounter, carrying L-4 and R2 LOW-1; T2; T3; T4; T5 with 7.1.0);
  (4) CI job ticket yes/no; (5) B5 ruling; (6) B6 ruling; side note on his installer. Parked
  awaiting Scott. On approval: file rollout tickets, report land-ready (landing re-points the
  dse-verify skill CURRENT block to `develop`), then `just wt-rm sc408-jsdom` after copying
  anything worth keeping into `docs/superpowers/dse-overhaul/build-ledgers/`.
- 2026-10-18: Acting on Scott's rulings. Tracker:
  - Bugs into DSE 7.0.0 project (his "for any bugs found"): SC-426, 427, 428, 429, 430, 431, and
    new SC-432 (B5, ruling 5 incl. his confirmation dialog) and SC-433 (B6, ruling 6). SC-425 is
    LEFT OUT: ds-hero is not in 7.0.0 and carries the "Deferred from 7.0.0" label — flagged to
    Scott in the land comment.
  - CI → SC-434 (DSE 7.0.0, per ruling 4), with the answer to "Will the need for a UI be a
    problem in github?" (no — run.mjs starts its own Xvfb).
  - Rollout (ruling 3), all Backlog, related to SC-408. Tier 1–4 in DSE 7.0.0 (owner call: they
    test 7.0.0's shipped surfaces): T1 SC-435 pool modal (+R2 LOW-1), SC-436 conditions modal,
    SC-437 initiative tracker (+R1 L-4); T2 SC-438 montage, SC-439 negotiation, SC-440 settings,
    SC-441 compendium sync, SC-442 counter; T3 SC-443 editor insert, SC-444 chrome, SC-445
    rolling/statblock/skills, SC-446 SCC links; T4 SC-447 render smoke. No project: SC-448
    experimental-elements umbrella (7.1.0), SC-449 lifecycle port (phase 2).
  - SC-408 → Awaiting, Needs Review removed (labels verified: Feature, DSE Plugin).
  Fix round F2 (resumed a2175250, brief `sc408-brief-fix2.md`): B5/B6 pins → SC-432/SC-433
  known-bug markers; e2e required to land any DSE change (ruling 2) in dse-verify, PROJECT.md §4,
  DSE AGENTS.md, e2e/README.md. Then a scoped re-review by a fresh identity, then land.
- 2026-10-18: F2 done. `origin/develop` moved `be4f002` → `566888a` (SC-411, SC-390); branch
  rebased (F1 head `1a33560` ≡ `cc05e7d`), lock regenerated (0/763 existing versions changed).
  DSE head `a066544`; superproject commits `279895b`, `74795d7`, `d72c46b` (dse-verify +
  PROJECT.md only). e2e 71 (59 ok, 12 known-bug), coverage 47/47, 5/5 runs green; jest 4720/1
  (226/227 suites, upstream tests included); lifecycle 25/25; shots 572; freeze 276/276; parity
  0/0/24. SC-432 markers: INIT-STAM-Q13 + 2 jest; SC-433: T03/T04/T10 + 4 jest; no-pool hero
  pins retitled. Brief assumption wrong (temp "−" never lowers temp, even after an in-session
  "+") → plain driver STAM-T11 asserts label/field agreement + no write; SC-433 text gets that
  detail. Scoped re-review R3 → fresh implementer identity (never authored this code).
- 2026-10-18: Review R3 (`sc408-r3-review.md`, fresh identity aa900e36, scoped to F2 + rebase):
  LAND-READY. HIGH 0 / MEDIUM 0 / LOW 4 / INFO 4. Range-diff clean (lock-only differences; 0/763
  existing packages changed); simulated fixes flip exactly the SC-432/SC-433 markers; battery
  matches F2. Rulings:
  - LOW-1 (6 plain creature tests go red under the SC-432 fix but don't cite it) → FOLD: retitle
    with "[current behaviour — SC-432 changes this]" (or flip to a hero where the row is not about
    creatures), so the fixer knows.
  - LOW-2 (nothing catches a temp "−" that RAISES temp) → FOLD: bounds assertions in STAM-T11 +
    one plain jest test.
  - LOW-3 (`Initiative/hurt.md` missing from the README fixture table), LOW-4 (skill Overview
    omits e2e; `.repo-docs/development.md:79` lacks "required"), INFO-3 (skill/README still
    describe the retired "ruling pending" suffix) → FOLD (docs).
  - INFO-1 (`origin/develop` moved to `e9502a8`) → FOLD: rebase before landing.
  - INFO-2 (4718 wording) → no action. INFO-4 (SC-432 markers assume "disable" not "hide") →
    DROPPED: SC-432's text says disabled with a reason tooltip.
  Fix round F3 → resume author a2175250; delta re-check → resume R3 identity.
- 2026-10-18: F3 done. Rebased onto `origin/develop` `e9502a8` (no lock conflict; 0/763
  existing versions changed). DSE head `713b992`; superproject commits `61dde40`, `04545a1`
  (skill only). LOW-1 retitles (6 tests), LOW-2 bounds in STAM-T11 + 1 jest test (bite proven),
  docs folded. jest 4721/1 (226/227), lifecycle 25/25, e2e 59 ok + 12 known-bug of 71 ×4 runs,
  coverage 47/47, shots 572, freeze 276/276, parity 0/0/24. Delta re-check → resume R3 identity
  (scoped: range-diff, lock, LOW-1/LOW-2, docs, tsc/lint/jest/e2e).
- 2026-10-18: R3b (scoped F3 re-check, R3 identity): LAND-READY, HIGH/MEDIUM/LOW 0, INFO 1 (skill
  CURRENT block header still says "F1 and F2" → LANDING STEP, re-pointed with the block). Range-
  diff 23 `=` + lock-only `!`; lock 0/763 changed; LOW-1/LOW-2 re-proven; jest 4721/1, e2e 59+12
  of 71, coverage 47/47.
  **LAND-READY:** DSE `sc408-functest` @ `713b992` on `origin/develop` `e9502a8`; superproject
  `sc408-functest` @ `04545a1` (skill + PROJECT.md commits; submodule pointer to be bumped by the
  landing). Gates: tsc/lint clean · jest 4721 passed / 1 skipped / 226 of 227 · lifecycle 25/25 ·
  e2e 59 ok + 12 known-bug of 71, 0 failed, coverage 47/47 · shots 572 / 0 FAIL · freeze 276/276 ·
  parity 0/0/24. Landing steps: re-point the dse-verify CURRENT block to `develop`; copy this
  ledger + reports worth keeping to `docs/superpowers/dse-overhaul/build-ledgers/`; then
  `just wt-rm sc408-jsdom` (merged, `4bdcb5c`). Waiting on who lands (asked in-session).

## 2026-10-18 — Scott in-session: "land it"

Scott, in-session, 2026-10-18, verbatim: "land it". Supersedes the land-ready "waiting on who lands"
line above: this session lands (Scott's direct instruction overrides the ticket-owner default of
handing landing to the dispatcher).

Pre-flight at landing found `develop` moved again: `e9502a8` → `7982deb` (SC-423, 10 commits:
initiative `repaintTurn` data-pressed, acted-frame CSS, `assertPortraitMarkParity` shots gate, the
initiative docs GIF). DSE `sc408-functest` is no longer FF onto `origin/develop`. The superproject
branch forks at `4fcffbc`; `origin/main` is `7c424e8`; predicted conflicts in
`.claude/orchestrate/PROJECT.md` and `.claude/skills/dse-verify/SKILL.md` (SC-411/SC-390/SC-423 edits).
Round L1 (implementer): rebase both, resolve, write the post-landing CURRENT block, full battery,
commit the pointer bump. Then this session runs `wt-finish`.
- 2026-10-18 L1 (implementer, `sc408-brief-land1.md`): DSE rebased onto `7982deb` → `1640ed0`, range-diff 27/27 `=`,
  lock 0/763 upstream changed; superproject merged `origin/main` `f3dcced` (SKILL.md CURRENT conflict only),
  pointer bump `b1dd4df`, head `bf45f82`. Gates: tsc/lint clean · jest 4725 / 1 / 226 of 227 (4721 + SC-423's 4)
  · lifecycle 25/25 · e2e 3× `59/71 ok, 0 failed, 12 known-bug, coverage 47/47` · shots 572 / 0 FAIL with
  `portrait mark parity OK` · freeze 276/276 · docs-shots initiative GIF stable · parity 0/0/24.
- 2026-10-18 **LANDED** (this session, land-stack): owner re-verified pre-flight (FF-safe, gitlink scope
  dse-only, no predicted conflicts, range-diff all `=`), stash-wrapped Scott's dse vault state
  (restored byte-identical), `wt-finish`: dse `develop` 7982deb..1640ed0 (27 commits), workspace
  `main` f3dcced..b97a068 ("merge sc408-functest into main"). Comment 3 posted, SC-408 → Done
  (verified; labels Feature, DSE Plugin). Ledger copied to
  `docs/superpowers/dse-overhaul/build-ledgers/sc408-functest/`; then `wt-rm sc408-functest`, `wt-rm sc408-jsdom`.
