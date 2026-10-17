# SC-417 — decisions ledger

Effort: `sc417-minions`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc417-minions`.
DSE branch `sc417-minions`, cut from `origin/develop` @ `a337460` (2026-10-17).
Owner: Fable ticket-owner (session a1bcbb5d-74ed-4106-9374-0e54a8e70848). Workers read THIS file, never the tracker.

## Ticket (Scott, 2026-10-17, verbatim)

Title: "Initiative tracker issue in DSE 6.0.2" — priority High, labels DSE Plugin + Bug, project DSE 7.0.0.

> when using the initiative tracker for minions, killing a minion drops the entire group to 4 hp. when healing the group, the UI breaks
>
> [screenshot: `sc417-scott-602-bug.png` in this dir]
>
> This is from the old 6.0.2 version which I dont intend on fixing.  Instead, I want to make sure the same bug doesnt exist in 7.0.0

What the screenshot shows (owner's reading, 6.0.2 UI): an "Enemy Groups" card "Mordor Forces"
with a squad header "Orc #4 — 2/160 (40)"; below it five member tiles reading, top to bottom,
"2/160 (40)", "DEAD", "DEAD", "2/160 (40)" (this one outlined, selected), "150/150". So after
two kills the shared pool reads 2 of 160 while one member still shows 150/150 — the pool and
the per-member numbers disagree.

## Rulings

(none yet beyond the ticket text)

## Owner notes (not rulings)

- 7.0.0 = dse `develop`. The initiative tracker there is `src/elements/initiative/` (framework v2,
  rewritten since 6.0.2) and the squad pool modal is `src/views/MinionStaminaPoolModal.ts`.
  6.0.2 = dse `main` @ `e38d4de`.
- Round 1 (2026-10-17): reviewer probe round — does either reported behavior reproduce on
  develop? No fix dispatched yet.

## Round 1 result (2026-10-17, reviewer probe, report `sc417-r1-probe-report.md`)

- Scott's 6.0.2 bug does NOT reproduce in 7.0.0 (both root causes identified at `e38d4de` and
  already gone from `develop`). Probe tests committed: dse `ccee0e6` (test-only).
- Three NEW 7.0.0 defects found in the same code: HIGH-1 stale grid after a detail-row pool edit
  (`view.ts:1771-1783`), MEDIUM-1 kill count from an unclamped pool locks Apply
  (`MinionStaminaPoolModal.ts:283-289`), LOW-1 negative "-1 minion(s)" text + unexplained disabled
  Apply on a refused heal (`MinionStaminaPoolModal.ts:330,361`).

## Owner ruling (2026-10-17, not Scott's — owner's scope call)

- **Fold HIGH-1, MEDIUM-1 and LOW-1 into one fix round (round 2).** All three live in the two files
  the ticket is about, and HIGH-1 is the 7.0.0 shape of exactly the "pool and tiles disagree"
  bug Scott reported. No Backlog tickets filed; nothing dropped.
- Round 2 = implementer (fresh identity; the reviewer authored the probe tests and will re-review
  the delta in round 3).
- Round-1 side observation (harness fixture `initiative-fight` has pool 9/20 with 1 dead, which
  the UI could not produce): **dropped** — picture-only fixture, no user-facing effect, and
  correcting it would move a frozen shot for no gain.
- Round 2 dispatched 2026-10-17 (implementer, brief `sc417-brief-r2-fix.md`).

## Round 2 result (2026-10-17, implementer, report `sc417-r2-fix-report.md`)

- HIGH-1 fixed `9db154a`; MEDIUM-1 + LOW-1 fixed `b393279`; docs `7264c4b` (head). Full battery
  green: tsc/lint clean · jest 4445/1 skipped/220 of 221 · lifecycle 25/25 · shots 568, 0 FAIL ·
  freeze 274/274 · parity 0/0/24.
- Owner rulings on the fixer's follow-ups:
  - "Heals within a bracket still allowed (warning only) though minions can't regain Stamina" —
    **left as-is; raised to Scott as a question in the round-3 ask.** Pre-existing behaviour,
    not introduced here; changing it is a rules/UX decision.
  - "No CHANGELOG line" — **dropped**: the three defects were introduced and fixed inside 7.0.0
    development and never shipped; nothing user-visible changes between released versions.
- Round 3 = scoped re-review of `ccee0e6..7264c4b` by the round-1 reviewer (author-independent:
  it wrote the probe tests, not the fixes).

## Round 3 result (2026-10-17, reviewer re-review, report `sc417-r3-rereview-report.md`)

- Verdict NEEDS FIX. HIGH-1 fixed+complete; MEDIUM-1 fixed for round-1 scenarios; LOW-1 fixed for
  sighted users. New: **MEDIUM-R3** (`MinionStaminaPoolModal.ts:296-298`, a heal can demand a kill
  when the pool is below `(alive-1)×per+1`, e.g. pool 77 / 3 alive / per 40 after a captain is
  relieved — regression vs `ccee0e6`); **LOW-R3** (`:383-388`, refused-heal reason only in `title`,
  not in the accessible name); nits (stale `// today:` comments in the test file; HIGH-1 tests
  don't pin the single write).

## Owner rulings (2026-10-17, round 4 scope)

- **Kill-count semantics for DAMAGE revert to the `ccee0e6` ladder** (boundaries crossed by the
  pending change), with exactly two additions that ARE this ticket's MEDIUM-1: clamp the count to
  the number of living minions, and a pool driven to ≤ 0 kills every living minion. The round-2
  "survivors" formula (`alive − ceil(pool/per)`) is **withdrawn** because it changed what damage
  demands in the SC-195 post-captain underfunded state — out of this ticket's scope.
- **A heal never produces a positive kill count** (MEDIUM-R3): heal → count is ≤ 0; negative still
  means "refused: above the living minions' share".
- **LOW-R3: fold** — put the refusal reason into the button's label via `setLabel`, as the Spend
  Recovery button does; keep the `title` too.
- **Nits: fold** — delete stale `// today:` comments; pin "exactly one write" in the HIGH-1 tests.
- **Reviewer's rules question** ("after the captain bonus switches off the pool can sit below the
  living minions' threshold, e.g. 77 for 3×40 — reconcile how?"): pre-existing SC-195 behaviour,
  unchanged by this ticket after the ruling above. **Filed as a Backlog ticket** (see below) and
  mentioned to Scott in one line; not folded.
- Round 4 = implementer (resume of the round-2 fixer); round 5 = scoped re-review by the reviewer.
- Backlog ticket filed 2026-10-17 for the SC-195 underfunded-pool question: **SC-421** (related to SC-417).

## Round 4 result (2026-10-17, implementer, report `sc417-r4-fix-report.md`)

- `bbb5304` on top of `7264c4b`: MEDIUM-R3, LOW-R3 and nits fixed per the rulings; +3 tests, refused-heal
  test extended. Battery: tsc/lint clean · jest 4448/1/220 of 221 · lifecycle 25/25 · shots 568 ·
  freeze 274/274 · parity 0/0/24.
- Fixer follow-up "the older `Select N minion(s) to kill` title has the same aria-label gap":
  **dropped** — pre-existing, LOW, a disabled-button hint on a path this ticket did not change;
  the reviewer called it out of scope. Round 5 may fold it ONLY if a fix round is needed anyway.
- Round 5 = scoped re-review of `7264c4b..bbb5304` by the reviewer.

## Round 5 result (2026-10-17, reviewer, report `sc417-r5-rereview-report.md`)

- Verdict LAND-READY at `bbb5304`; MEDIUM-R3 and LOW-R3 fixed per rulings; tests honest (16 in file).
- **LOW-R5** (`MinionStaminaPoolModal.ts:304, :347, :388`): the refused-heal message prints the
  living-minions' share as the limit, but when the pool is underfunded (post-relieve 77/3×40, or a
  6.0.2-damaged block) the real ceiling is `poolMax − initialKilled × per` (84 / 40, not 120 / 80).
  Number only; no wrong state written.

## Owner ruling (2026-10-17, round 6 scope)

- **LOW-R5: fold** (this ticket authored that message; one line + a test). Round 6 = implementer
  (resume), gates tsc/lint/full jest only (string/number change in the modal; nothing shots,
  freeze, parity or lifecycle measure changes — battery was green at `bbb5304`). Round 7 = the
  reviewer re-runs its B3b/6.0.2-block jsdom probes on the delta and confirms.

## Round 6 result (2026-10-17, implementer, `sc417-r6-fix-report.md`)

- `2f1f56e`: `healCeiling` replaces `livingShare` in the refused-heal message/title/label; +2 tests.
  tsc/lint clean · jest 4450/1/220 of 221. Refusal condition unchanged (it already used the ladder,
  which equals the ceiling). Round 7 = reviewer confirmation of `bbb5304..2f1f56e`.

## Round 7 result (2026-10-17, reviewer, `sc417-r7-rereview-report.md`)

- LAND-READY at `2f1f56e`, no findings. jest 4450/1/220 of 221; tsc/lint clean.
- **Land-ready reported.** Branch `sc417-minions` in `draw-steel-elements`, head `2f1f56e`, base
  `origin/develop` `a337460` (tracked branch for landing: `develop`). Superproject worktree pointer
  bump still uncommitted (dispatcher's `wt-finish` handles it). Comment posted; ticket → In
  Progress + Needs Review (ask: approve landing; optional rules question on in-bracket heals).

## Scott ruling (2026-10-17 16:15 UTC, Linear comment, verbatim)

> approved.  keep the behavior as-is for now with the warning - this is in place to account for mistakes that the Director/GM can make and need to correct

- Landing of `sc417-minions` @ `2f1f56e` → `develop` is **approved**. In-bracket squad heals stay
  allowed with the warning icon (no code change). Needs Review cleared by owner.

## Landed (2026-10-17)

- Rebased onto dse `develop` `0ecb90e` (SC-155 sdk bump) before landing; post-rebase tsc/lint clean,
  jest 4449/1/220 of 221 (the −1 vs `2f1f56e` is SC-155's rewritten featureblock test file).
- dse `develop` → `be4f002` (6 commits); workspace `main` → `d861e0c`. Reports and real-Obsidian
  evidence PNGs stayed machine-local in `.superpowers/sdd/sc417-minions/`.
