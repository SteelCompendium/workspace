# SC-195 decisions ledger — "With Captain" bonus vs computed minion pool

Effort: `sc195-captain-minion-pool` · Worktree: `/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool`
Ticket: SC-195 (Linear, Steel Compendium). Owner session started 2026-08-28.

## Scott rulings

(none yet)

## Founding context (from the ticket description, filed per Scott on SC-183, 2026-08-23)

> "lets make a separate ticket for dealing with 'with captain' in the DSE 7.0.0 project."

The open questions, verbatim from the ticket:

> 1. Does it raise each minion's per-minion Stamina before the pool is multiplied (so a 6-minion squad gains 6 × N)?
> 2. Or does it add N once to the pool total?
> 3. Does it apply only while the captain is alive/present — i.e. should the pool *shrink* when the captain goes down (SC-183 ships a "Captain down" state that would be the natural trigger)?
> 4. Does it interact with the multi-squad model SC-183 introduced (pools now resolve per squad, `captain_of` binds a captain to a squad)?

> The tracker currently does **not** apply the With Captain bonus to the pool at all — deliberately, because guessing would silently produce wrong Stamina at the table. Whatever we choose becomes a visible number in a live combat, so it should be an explicit ruling rather than an implementation accident.

## Established facts (owner recon, 2026-08-28)

- Rules text, `steel-etl/input/monsters/Draw Steel Monsters.md` line 490:
  > "While a minion squad has a captain, each minion in the squad gains the benefits noted at the 'With Captain' entry on their stat block. Usually, this benefit is either a damage boost, a bonus to speed, or additional Stamina."
  - "**each minion** ... gains" → the Stamina bonus is per-minion, so a pool of k minions gains k × N (question 1's reading).
  - "**While** a minion squad has a captain" → conditional; benefit ends when the squad has no captain.
- Stamina-flavored With Captain entries in the Monsters book: "+2/+3/+4/+6 bonus to Stamina" (11 statblocks found by grep).
- From SC-183 (`.superpowers/sdd/sc183/round2-report.md`): squads can't be winded, minions can't be winded, captain is winded independently ("A captain's Stamina isn't added to a minion squad's Stamina pool"); SC-183 shipped per-squad pools, `captain_of`, and a "Captain down" state keyed on the rule "If a squad of minions loses their captain, a new allied creature can become that squad's captain at the start of the next round (no action required)". The SC-183 round-2 worker explicitly flagged the With Captain +Stamina ambiguity "for Scott, not guessed at".

## Round 1 research (2026-08-28, Opus worker) — findings pointer

Full report: `sc195-research-report.md` (this dir). Headlines:
- Q1/Q2: per-minion, multiplied — Monsters.md:490 "each minion in the squad gains" + :415 pool = per-minion Stamina × count. Death ladder steps become (per+N).
- Q3: conditional yes (":490 While a minion squad has a captain"); what happens to an already-built pool on captain loss is textually undecidable — needs ruling.
- Q4: SC-183's `captainOfSquad`/`promoteCaptain` model already fits (one captain per squad, Monsters.md:482).
- Corpus: 10 Stamina-flavored With Captain lines in Monsters, all exactly `+N bonus to Stamina` (N ∈ 2,3,4,6); Beastheart 0; Summoner 1 (speed).
- Tracker cannot see `with_captain` at all (resolveRefs.ts:36-40 merges only {name, stamina, image}); raw field is a free-form string.
- Pre-existing divergence: row bar/print use ORIGINAL squad size, modal uses ALIVE count (view.ts:731/1558 vs MinionStaminaPoolModal.ts:64/249).
- No pool recompute exists on any captain path — ticket premise confirmed.
- Freeze warning: new captained print fixture will move frozen print PNGs → sanctioned rebaseline expected.

## Ask 1 posted (2026-08-28)

Posted rulings ask to Scott (In Progress + Needs Review): picks (a) captain-down A1/A2/A3, (b) promote/relieve B1/B2, (c) original-vs-live count C1, (d) display D1/D2, (S) source of N S3. Recommendations: A2, B1, C1, D2, S3. Out of scope declared: non-Stamina With Captain benefits.

## Base moved (2026-08-29)

SC-205 landed; dse origin/develop moved 16e25ff → c09cf6f (zero frozen pixels/bytes moved, no
freeze-baseline change). Worktree fast-forwarded before any commits existed: superproject
rebased onto origin/main (3d02bbd), dse branch sc195-captain-minion-pool ff'd to c09cf6f.
All future briefs cite base c09cf6f.

## Base moved again (2026-08-29)

SC-190 landed; dse origin/develop moved c09cf6f → 6035d12 (no freeze-baseline change).
Worktree fast-forwarded again pre-implementation (superproject onto origin/main, dse branch
ff'd to 6035d12; submodule status clean). All future briefs cite base 6035d12.

## Base moved a third time (2026-08-29)

SC-120 landed; dse origin/develop moved 6035d12 → 1619396, and a sanctioned 24-line freeze
rebaseline was applied (backup: freeze-baseline.sha256.pre-sc120-bak). Worktree
fast-forwarded pre-implementation (superproject onto origin/main, dse branch ff'd to
1619396; submodule status clean). All future briefs cite base 1619396, and any freeze-gate
numbers must be read fresh from dse-verify's SKILL.md at dispatch time — the baseline just
changed.

## RULING 1 — Scott, 2026-08-28 (comment 3763…9528), verbatim

> I asked for clarity about how stamina is handled "with captain" and this is the response I got: `Reduces the current and maximum stamina by the captain bonus multiplied by the current number of minions`
>
> a. So i think A2 is correct
>
> b. and B1 is correct
>
> c. sounds good
>
> `d. D2 is good`
>
> S. `with_captain` is not supported?  Shouldnt the plugin be using the `data-npm-sdk` repo which should support the field, right?  Can you follow up on this

**Owner interpretation (stated back to Scott in reply, 2026-08-29):**
- A2, B1, C1, D2 all confirmed.
- The quoted clarification supersedes the ask's "N × squad size" wording for the captain
  delta: captain-down removes (and, symmetrically under B1, promote adds)
  **N × CURRENT (alive) minion count** on both current and max.
- Coherent with C1: base pool max = (per + N) × ORIGINAL count while captained, never
  shrinks on minion death (ladder is absolute); dead minions' bonus share was already
  consumed as damage, so removing N × alive on captain loss is exact bookkeeping.
- S is a follow-up question, answered in owner reply (SDK already carries the field as a
  raw string; tracker's ref-merge ignores it — see reply for cited anchors).

## Implementation round complete (2026-08-29, Sonnet worker)

Commits d3ad4ea + b0beb40 on branch sc195-captain-minion-pool (base 1619396, not pushed).
Full battery green: tsc/lint clean; jest 3473 passed +79 net-new; shots 478 (+4 new
captain-bonus fixture), 0 FAIL; freeze 210/210, ZERO frozen bytes moved (no rebaseline
needed — new capture ids are new names); parity 0 GAPs/0 undeclared/16 DECLARED. Report:
sc195-impl-report.md. Owner eyeballed sc195-fixture-dark.png: badge "CAPTAIN +4 STA",
pool 65/78 (13) arithmetic correct ((9+4)×6=78).

**Owner rulings on the worker's three open questions:**
1. NO retroactive backfill for pre-upgrade saved squads on load — deliberate; a GM may
   have hand-adjusted the pool already, and auto-adding would double-count. Bonus applies
   from the next captain transition. Will be stated to Scott in the evidence comment
   (he can override).
2. Legacy async parseEncounterData left without bonus logic — accepted; reviewer must
   verify the "test-oracle only, not on the live pipeline" claim.
3. Mid-round badge-overflow CSS fix — provisionally accepted; reviewer checks the
   Steel-scoped/print-inert claim; Scott sees the screenshots.

## Review round complete (2026-08-29, Opus reviewer) — FIX ROUND NEEDED

Report: sc195-review-report.md. Gates all re-run green by reviewer; 12 probes, 3 failing
areas. Findings: HIGH-1 (live gate vs persisted flag disagree at view.ts:1626 +
MinionStaminaPoolModal.ts:262 — wrong kill counts on pre-upgrade blobs), HIGH-2
(resetEncounter leaves minion_stamina_pool_max + captain_bonus_active behind —
unrecoverable no-op promotes), MEDIUM-1 (flag latches when captain leaves by a non-badge
route, e.g. YAML deletion), LOWs (isCaptainDown edge semantics call-out; ladder residue
cosmetic; ticks; stale-max-on-YAML-edit), INFO (parser negative corpus lacks
embedded-Stamina case; with_captain serialization accepted class). Implementer claims 1-3
all CONFIRMED.

**Owner rulings on findings (2026-08-29):**
- HIGH-1, HIGH-2: fix this round, reviewer's prescribed fixes.
- MEDIUM-1 RULING: when a squad has NO bound captain entry at all (captainOfSquad == null)
  and the persisted flag is true, fire the OFF transition (subtract, clamp >= 0, clear
  flag). Persist the applied per-minion N alongside the flag so the un-wind works even
  when the captain creature (and its statblock N) was deleted. Still edge-triggered on the
  flag — this does NOT contradict the no-backfill ruling, which governs the ON direction
  only ("no captain bound = no bonus" is deterministic from the rules text "While a minion
  squad has a captain"). Captain-down-then-deleted is already flag=false and unaffected.
- INFO parser corpus: add the embedded-Stamina negative test this round.
- LOW stale-max-on-YAML-edit: DEFERRED → SC-291 (Backlog, filed 2026-08-29, links SC-195).
  Out of scope for the fix round.
- Other LOWs/INFO: accepted as-is, no action (isCaptainDown call-out goes in the evidence
  comment to Scott).

## Fix round complete (2026-08-29, Sonnet worker — fresh identity, replaced the
## rate-limit-killed original; resumed mid-round after limit reset)

Commit 778a341 on top of b0beb40/d3ad4ea. All four fixes closed: FIX 1
foldedCaptainStaminaBonus (EncounterData.ts:293-305, wired at view.ts:1616-1634 +
MinionStaminaPoolModal.ts:257-276); FIX 2 resetEncounter clears
minion_stamina_pool_max/captain_bonus_active/captain_bonus_n (EncounterData.ts:527-541);
FIX 3 persisted captain_bonus_n + reconcileOrphanedCaptainBonus (EncounterData.ts:337-368,
both parse paths — worker self-caught and fixed a call-ordering bug where reconcile ran
before minion instances materialized); FIX 4 embedded-Stamina negative parser test. Gates:
tsc/lint clean, jest 3491 passed (+18), shots 478 0 FAIL, freeze 210/210, parity
0/0/16 DECLARED. One unrelated transient flake (sidebarEncounterHandoff, SC-153) cleared
on re-run. Report: sc195-fixround-report.md. Scope held; out-of-scope list untouched.

## Scoped re-review complete (2026-08-29, original Opus reviewer) — LAND-READY on 778a341

Appended to sc195-review-report.md. All three findings re-probed FIXED (HIGH-1 kill-counts
now match base; HIGH-2 reset fully clears state, promote works after reset; MEDIUM-1
single un-wind via persisted captain_bonus_n, no double-un-wind, byte-compat holds for
ordinary squads). Delta code review clean: reconcile ordering right in both parse paths,
live-gate audit clean, captain_bonus_n lifecycle airtight, 21 real new tests. Gates re-run
green: jest 3491/1 skipped, shots 478 0 FAIL, freeze 210/210, parity 0/0/16.
Non-blocking INFO-A/B accepted; INFO-C (pre-existing ref+captain parse error) →
SC-292 (Backlog, filed 2026-08-29). Earlier LOW notes stand as filed (SC-291 for
stale-max; isCaptainDown one-liner goes in the evidence comment).

## Evidence comment + land-ready (2026-08-29)

Evidence comment with dark/light fixture screenshots posted; ticket → In Progress +
Needs Review (Scott's taste check on the badge is non-blocking; landing proceeds).
LAND-READY reported to dispatcher: branch sc195-captain-minion-pool, dse commit 778a341
(d3ad4ea, b0beb40, 778a341 on base 1619396), zero frozen bytes moved, no rebaseline
needed. Landing is the dispatcher's move.
