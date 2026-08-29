# SC-195 research report — "With Captain" bonus vs the computed minion pool

Round 1: **read-only research + design recommendation. No code changed.**
Worktree: `/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool`
(`draw-steel-elements` at `16e25ff`, branch `sc195-captain-minion-pool`).
All book citations are `steel-etl/input/**` in that worktree; all code citations are
`draw-steel-elements/**` in that worktree.

---

## TASK A — the rules answer

### A1. The whole "Attached Squad Captain" section, verbatim

`steel-etl/input/monsters/Draw Steel Monsters.md:477-494` (link markup stripped for
readability; SCC anchors preserved in the file):

- **:478 `#### Attached Squad Captain`** / **:480** — "Any non-Mount, non-minion creature,
  who speaks a language that a squad of minions can understand can be attached to that
  squad as a captain."
- **:482** — "A squad of minions can have only one captain, and a creature can't be captain
  to more than one squad of minions."
- **:486 (`##### Separate Actions and Stamina`)** — "A captain takes their turn at the same
  time as the minion members of their squad but isn't limited in their action options as
  minions are. **A captain's Stamina isn't added to a minion squad's Stamina pool, and is
  tracked as for any other creature in combat.**"
- **:490 (`##### Captain Benefits`)** — "**While** a minion squad has a captain, **each
  minion in the squad** gains the benefits noted at the 'With Captain' entry on their stat
  block. Usually, this benefit is either a damage boost, a bonus to speed, or additional
  Stamina."
- **:494 (`##### I Am the Captain Now`)** — "If a squad of minions loses their captain, a
  new allied creature can become that squad's captain at the start of the next round (no
  action required)."

That is the **entire** captain ruleset. There is no worked example of the Stamina bonus, no
statement about what happens to an already-computed pool, and no statement about mid-fight
loss beyond :494.

### A2. How the pool is built and spent

- **:415 (`#### Shared Low Stamina`)** — "Each squad of minions shares a Stamina pool, with
  **initial** Stamina equal to **each individual minion's Stamina multiplied by the number
  of minions in the squad**. For example, a goblin spinecleaver has 5 Stamina, so a squad of
  eight spinecleavers has a Stamina pool of 40. Whenever a minion in a squad takes damage,
  the squad's Stamina pool is reduced by a number equal to the damage taken. Because minion
  Stamina is tracked as a pool, minions can't be winded, can't regain Stamina, and can't
  gain temporary Stamina during a battle."
- **:419 (`##### Dropping One Minion`)** — "Whenever a minion squad's Stamina pool is
  reduced by an amount equal to an individual minion's Stamina, one minion dies… If a squad
  of goblin spinecleavers has its Stamina pool reduced from 40 to 35, the minion who took
  the damage that reduced the pool dies. When the Stamina pool hits 30, 25, 20, 15, 10, 5,
  and finally 0, another minion in the squad dies each time."
- **:441 (`##### Prepping Minion Stamina Pools`)** — "a squad of eight goblin spinecleavers
  loses a minion when they take a total of 5, 10, 15, 20, 25, 30, 35, and 40 damage."
- **:409** — squads are "up to eight creatures".
- **:433** — weakness/immunity apply to the squad **once**, not per minion (the book's one
  explicit "don't multiply this by squad size" carve-out — and it is *not* the With Captain
  entry).

**Load-bearing consequence:** the book's pool is a **single descending counter with a fixed
initial value**. The word "initial" is doing real work at :415 — the max is set once, at
squad creation, and the death thresholds at :419/:441 are **absolute damage totals measured
from that initial value**. The book never shrinks the max when a minion dies; the *same*
40-point ladder runs 40→35→30→…→0. Minions are also stated at :415 to be unable to regain
Stamina, so the pool never rises.

### A3. Answers to the ticket's four questions

| # | Question | Answer | Citation |
|---|---|---|---|
| **1** | Per-minion Stamina raised before multiplication (6-minion squad gains 6 × N)? | **YES — this is the reading.** :490 says "**each minion in the squad** gains the benefits", and :415 builds the pool as "each individual minion's Stamina **multiplied by** the number of minions". A benefit that raises each minion's Stamina therefore raises the multiplicand: `(S + N) × count`. | `Monsters.md:490` + `:415` |
| **2** | Or add N once to the pool total? | **NO.** Nothing in the text supports a flat add. The book's one *explicit* "apply once to the squad, not per minion" instruction is for weakness/immunity (`:433`) and it is phrased as an exception precisely because per-minion is the default. The With Captain entry has no such carve-out. | `Monsters.md:433` (the contrast case) |
| **3** | Conditional on the captain being alive/present — should the pool shrink? | **Conditional: YES, unambiguously** — ":490 "**While** a minion squad has a captain…"; the replacement clause at :494 exists only because the captainless state is real. **Whether the pool *shrinks*: the book does not say, and cannot be derived** — see §A4. This is the ticket's one genuinely open design point. | `Monsters.md:490`, `:494` |
| **4** | Does it interact with the multi-squad model SC-183 shipped? | **YES, and cleanly — the model already fits.** :482 "a squad of minions can have only one captain, and a creature can't be captain to more than one squad" is exactly the invariant `captainOfSquad`/`promoteCaptain` enforce. The bonus is a **property of one squad**, read from **that squad's minion statblock**, gated on **that squad's** captain. So it resolves through `captainOfSquad(group, minion)` (`EncounterData.ts:148`) per squad — no new addressing model needed. Note a group can hold squad A (captained, bonus applies) and squad B (uncaptained, no bonus) simultaneously; `data-captain` on the group body is currently `anyDown` across all captains (`view.ts:1472-1474`), which is already a per-group approximation. | `Monsters.md:482`; `EncounterData.ts:148-161` |

### A4. What the book says about mid-fight captain loss, replacement, deaths, and additions

**Everything it says:**
- Loss/replacement: only `:494` — a new allied creature *may* become captain at the start of
  the next round, no action required. Note "**at the start of the next round**": there is a
  guaranteed captainless window between the captain dropping and the swap.
- Minion deaths: `:419`, `:441` — the ladder is fixed and absolute; the max is never restated.
- Minions **added** mid-fight: the book has no rule. The only adjacent text is the
  Director-advice sidebar at `:437` ("you can always have reinforcements show up!") — which
  is narrative advice, not a pool rule; reinforcements read as a **new squad**, not a
  growing pool.
- Healing: `:415` — minions "can't regain Stamina" during a battle.

**What it does NOT say — the real ambiguity:** there is no sentence anywhere covering "the
pool was built with the bonus and the captain is now gone." Both readings are internally
consistent with the text:
- *Recompute:* :490's "While" is a continuous condition, so the moment it stops being true
  the squad's Stamina should be `S × count` again — a pool built at `(S+N) × count` must
  come down.
- *Don't recompute:* :415's word "**initial**" and the fixed absolute ladder at :419/:441
  say the pool max is set once and is never re-derived. Also, the bonus is "additional
  Stamina", and losing Stamina you already have is *damage*, which :490 does not authorize.

**MCDM's own design intent is not recoverable from the printed text.** Any implementation
must pick, and the pick must be visible.

### A5. Every distinct "With Captain" benefit in the corpus

Counted across all four book sources (`grep '\*\*…\*\*<br>With Captain'`; 438 grid cells in
Monsters, 2 in Heroes, 1 prose line in Summoner):

| Count | Value string | Stamina-flavored? |
|---:|---|---|
| 323 | `-` (no benefit) | — |
| 27 | `Gain an edge on strikes` | no |
| 18 | `+2 bonus to speed` | no |
| 13 | `+5 bonus to ranged distance` | no |
| 11 | `+1 damage bonus to strikes` | no |
| 10 | `+2 damage bonus to strikes` | no |
| **7** | **`+2 bonus to Stamina`** | **YES** |
| 7 | `+3 bonus to speed` | no |
| 4 | `+3 damage bonus to strikes` | no |
| 3 | `+4 damage bonus to strikes` | no |
| 3 | `+2 bonus to melee distance` | no |
| 2 | `+4 bonus to speed` | no |
| 2 | `+1 bonus to speed` | no |
| 1 | `Lightning spread increases by 1 square` | no |
| 1 | `Have a double edge on strikes` | no |
| **1** | **`+6 bonus to Stamina`** | **YES** |
| **1** | **`+4 bonus to Stamina`** | **YES** |
| **1** | **`+3 bonus to Stamina`** | **YES** |
| 1 | `+4 bonus to ranged distance` | no |
| 1 | `+3 bonus to melee distance` | no |
| 1 | `+2 bonus to forced movement distance` | no |
| 1 | `+1 bonus to strikes` | no |

**All ten Stamina-flavored entries** (monster name, per-minion Stamina S, bonus N, and the
delta for a full 8-minion squad under the recommended `(S+N)×count` reading):

| # | Monster | line | S | N | pool 8× w/o captain | pool 8× w/ captain | Δ |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Dwarf Axethrower | 7597 | 7 | +2 | 56 | 72 | +16 |
| 2 | Dwarf Catchpole | 7620 | 7 | +2 | 56 | 72 | +16 |
| 3 | Dwarf Driver | 7643 | 6 | +2 | 48 | 64 | +16 |
| 4 | Dwarf Hunter | 7666 | 6 | +2 | 48 | 64 | +16 |
| 5 | Sand Stone Giant | 10521 | 14 | +6 | 112 | 160 | +48 |
| 6 | Hobgoblin Recruit | 12653 | 9 | +4 | 72 | 104 | +32 |
| 7 | Kobold Princeps | 14111 | 4 | +2 | 32 | 48 | +16 |
| 8 | Lizardfolk Shellguard | 14839 | 6 | +2 | 48 | 64 | +16 |
| 9 | Troll Crack Trooper | 19560 | 15 | +3 | 120 | 144 | +24 |
| 10 | Voiceless Talker Graywarper | 22146 | 9 | +2 | 72 | 88 | +16 |

(all in `steel-etl/input/monsters/Draw Steel Monsters.md`.)

**Format observation that matters for implementation:** every Stamina entry in the entire
corpus matches exactly `+<N> bonus to Stamina`. A single anchored regex covers 10/10 with
zero false positives against the other 21 value shapes above.

### A6. Other captain-adjacent text found (not pool rules, listed so it isn't re-discovered)

- `Monsters.md:15967` — an ability's own inline captain rider: "vertically pushed 8 (**or 13
  with a captain**)". Captain conditionality also appears *inside ability text*, not only in
  the grid cell.
- `Monsters.md:22923` — "A captain attached to a tetherite squad has their **stability**
  increased by the number of tetherites within 2 squares" — a benefit flowing to the
  *captain*, the reverse direction.
- `Monsters.md:9967` / `:14312` — abilities gated on "must be acting as a captain".
- `Summoner.md:4443` — the one prose-form entry in the corpus, `With Captain: +2 bonus to
  speed` (the `@classify: false` converted-minion example). Not Stamina.
- `Heroes.md:9284`, `:19126` — two grid cells, both `-`.
- Beastheart: **zero** occurrences.

No errata/appendix file with additional captain language exists under `steel-etl/input/`.

---

## TASK B — code survey (all paths relative to `draw-steel-elements/` in the worktree)

### B1. Squad parsing and pool construction

| What | Where |
|---|---|
| `Creature.squad_role?: 'minion' \| 'captain' \| 'attached'` | `src/drawSteelAdmonition/EncounterData.ts:79` |
| `Creature.captain_of?: string` | `EncounterData.ts:84` |
| `Creature.minion_stamina_pool?: number` (per-squad home, multi-squad only) | `EncounterData.ts:90` |
| `EnemyGroup.minion_stamina_pool?: number` (historical single-squad home) | `EncounterData.ts:104` |
| `minionCreatures(group)` | `EncounterData.ts:125-127` |
| `minionPoolOf(group, creature)` — creature field, else group field | `EncounterData.ts:131-133` |
| `setMinionPool(group, creature, value)` — writes to whichever field is live | `EncounterData.ts:138-144` |
| `validateSquad(group)` | `EncounterData.ts:207-254` |

**Pool INITIALIZATION — `max_stamina * amount`, in THREE places that must stay in step:**

- `EncounterData.ts:534` — `setMinionPool(group, creature, creature.max_stamina * creature.amount)` (async oracle parse)
- `src/elements/initiative/model.ts:196` — same expression (the sync parse split)
- `src/elements/initiative/resolveRefs.ts:187` — same expression (phase-3 refill when `max_stamina` was statblock-sourced)

`resetEncounter` clears the pool on both homes so it re-initializes: `EncounterData.ts:353-364`.

**Pool MAX at render time — and a pre-existing inconsistency SC-195 will collide with:**

- `view.ts:729-731` (`staminaSpecFor`): `const per = creature.max_stamina; const amount = creature.amount; const max = per * amount;` — **ORIGINAL squad size.** Death ticks at `view.ts:733-735` likewise.
- `view.ts:1558` (`updateStaminaDisplay`, the numeric readout, also the PRINT text): `` `${currentStamina}/${creature.max_stamina * creature.amount} (${creature.max_stamina})` `` — **ORIGINAL squad size.**
- `src/views/MinionStaminaPoolModal.ts:63-64` and `:248-249` (`poolNumbers`): `aliveMinions = instances.filter(i => !i.isDead).length; poolMaxStamina = aliveMinions * minionMaxStamina;` — **ALIVE count.**

`creature.amount` is **never decremented** anywhere (verified: every `.amount` reference is a
read or an instance-count comparison — `EncounterData.ts:511/534/537/539/582/584`,
`model.ts:173/196/199/201/227/229`, `resolveRefs.ts:187`, `view.ts:730/1254/1558`). Death is
recorded as `instance.isDead = true` (`MinionStaminaPoolModal.ts:211`).

**So today the row bar and the modal disagree about the max once a minion dies** (5×5 squad,
5 damage taken, 1 dead: the row reads `20/25`, the modal reads `20/20` and shows a full
bar). This is pre-existing, not introduced by SC-195 — but any pool-max change lands on top
of it and it should be resolved in the same round or explicitly left alone.

### B2. Does the tracker have `with_captain` at all? **No.**

- The statblock model **does** carry it: `data-sdk-npm/src/model/Statblock.ts:25`
  `withCaptain?: string;` ← `data-sdk-npm/src/model/Statblock.ts:43` `withCaptain:
  dto.with_captain`, written back at `dto/StatblockDTO.ts:56`.
- **Raw shape: a free-form STRING, unparsed.** `data-sdk-npm/src/io/markdown/MarkdownStatblockReader.ts:214`
  — `if (valueRaw !== '-') partial.withCaptain = valueRaw;` — the grid cell's text verbatim
  ("+2 bonus to Stamina", "Gain an edge on strikes", …). No numeric/structured form exists
  anywhere in the pipeline.
- The DSE **statblock element** renders it: `src/elements/statblock/view.ts:193` —
  `if (sb.withCaptain) cells.push({ modifier: 'captain', label: 'With Captain', value: sb.withCaptain });`
  Documented as `| with_captain | string | No | Effect when a captain is present. |` at
  `docs/statblock.md:199`.
- **The INITIATIVE tracker never sees it.** The statblock merge reads exactly three fields:
  `resolveRefs.ts:36-40` — `interface StatblockFields { name?: unknown; stamina?: unknown;
  image?: unknown; }` — copied at `resolveRefs.ts:104-106` (heroes) and
  `resolveRefs.ts:127-129` (creatures), only-if-unset. `Creature` has a `statblock?:
  unknown` passthrough field (`EncounterData.ts:91`) that keeps the *ref string* for
  byte-identical serialization, but nothing resolves it for stats beyond those three.
- The encounter builder **does** emit a resolvable ref on squad rows —
  `src/elements/encounter/view.ts:343-395` emits `statblock: scc.v1:<code>` +
  `squad_role: 'minion'` / `'captain'` — so a `with_captain` merge would work for
  builder-generated and hand-written ref-bearing blocks alike. A creature declared with a
  literal `max_stamina:` and no `statblock:` ref has no source for N at all.

### B3. Captain state — everything that would need to trigger a recompute

| What | Where |
|---|---|
| `captainOfSquad(group, minion)` — named `captain_of` first, else the unnamed captain of squad #1 | `EncounterData.ts:148-156` |
| `squadOfCaptain(group, captain)` — the inverse | `EncounterData.ts:159-161` |
| `promoteCaptain(group, creature, minion)` — relieves the previous captain, sets `squad_role='captain'`, writes `captain_of` only when >1 squad. **Touches no Stamina.** | `EncounterData.ts:170-184` |
| `relieveCaptain(creature)` — `squad_role='attached'`, `delete captain_of`. **Touches no Stamina.** | `EncounterData.ts:187-190` |
| `isCaptainDown(captain)` — every instance at `current_stamina <= 0` | `view.ts:905-907` |
| `squadCaptains(group)` → `{ captains, anyDown }` | `view.ts:912-917` |
| `promotionTarget(group)` — first captainless squad, else squad #1 | `view.ts:~926` |
| `buildCaptainBadge(...)` — the crown + WORD badge; `data-role='captain'\|'candidate'`, `data-captain-for=<creature.name>`; word = `Captain` / `Captain down` / `Make captain[: squad]` | `view.ts:947-1011` |
| the promote/relieve **click handler** → `relieveCaptain` / `promoteCaptain` then `void this.rebuildAndPersist()` (deliberate coarse rebuild) | `view.ts:997-1005` |
| `refreshCaptainState(groupBodyEl, group)` — re-stamps `data-captain=up\|down` on the group body and repaints each captain badge's word **in place** after a stamina edit | `view.ts:1471-1487` |
| group-body `data-captain` initial stamp | `view.ts:1181-1183` |
| roster-cell badge (no control) | `view.ts:1349-1350`; detail-row badge (with control) `view.ts:1393-1397` |

**There is no pool recompute anywhere on any of these paths today.** Confirmed: the ticket's
"the tracker does not apply the With Captain bonus at all" is accurate.

### B4. How the pool is edited today, and its invariants

`src/views/MinionStaminaPoolModal.ts` (whole file, 423 lines):

- Opened from the detail row / grid dblclick (`view.ts:~1414-1438`); persistence is an
  injected `persist()` callback — **the modal never touches `CodeBlocks` directly** (CB-2,
  file header comment `:10-15`).
- `onOpen` (`:59-97`): `poolMaxStamina = aliveMinions * minionMaxStamina` (`:64`);
  `poolCurrentStamina = minionPoolOf(...) ?? poolMaxStamina` (`:65`); death ticks at
  `i * per / poolMax` for `i in [1, aliveMinions)` (`:68-71`); stepper bounded `[0, poolMax]`
  (`:83-97`).
- Apply-damage row (`:99-139`): `totalDamage = damage * minions`.
- **Apply clamp (CB-1, the named data-corruption fix):** `:205-206` —
  `const maxStamina = (this.creature.instances?.filter(i => !i.isDead).length ?? 0) * minionMaxStamina;`
  then `setMinionPool(group, creature, Math.min(maxStamina, Math.max(0, newStamina)))`.
  The parenthesization is load-bearing (the old `len ?? 0 * max` precedence bug).
- Kill accounting (`:246-257` `poolNumbers`): `initialMinionsKilled = floor((poolMax -
  poolCurrent)/per)`, `finalMinionsKilled = floor((poolMax - newStamina)/per)`,
  `minionsToKill = final - initial`. **Apply is disabled until exactly `minionsToKill`
  checkboxes are ticked** (`:300-331`).
- At `newStamina <= 0` all checkboxes auto-check and lock (`:342-352`).
- Healing shows the "minions typically cannot regain stamina" warning (`:334-339`) but is
  **not blocked**.
- Known deviation already documented at `:77-81`: a typed draft past `poolMax` is clamped at
  commit, where legacy carried the overshoot until Apply.

Test: `test/dom/views/minion-stamina-pool-modal.test.ts`.

### B5. What SC-157 concluded about `with_captain`

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/sc157-report.md`. SC-157
was a **v2-site rendering bug, not a data-model change**:

- `with_captain` was always parsed correctly into frontmatter —
  `steel-etl/internal/content/statblock_parse.go:246-247` (`ParseStatblockFields`) reads the
  grid's "With Captain" cell whenever it isn't `-` (report `:22-25`).
- The site's `buildStatblockIsland` used to derive the cell from a body-prose regex
  (`sbCaptainRe`, matching `"With Captain: …"`, which occurs **exactly once** in the whole
  corpus — the Summoner converted-minion example at `Summoner.md:4443`), so every real
  captained minion rendered `With Captain -`. Fixed on `main` before SC-157 was filed, at
  `steel-etl/internal/site/statblock_page.go:178-190` (`statblockMeta4`). SC-157 shipped the
  missing regression test + corpus verification (116 captained minions).
- **It concluded nothing about the field's semantics or shape** beyond "it is a string in
  frontmatter, present only when the grid cell isn't `-`, and it must be read from
  frontmatter and not from prose." No structured/numeric parse was introduced. SC-195 is
  therefore the first consumer that needs to *interpret* the string.

---

## TASK C — design recommendation

### C0. Primary answers (my recommendation)

- **Q1/Q2 → per-minion, multiplied.** `poolMax = (per_minion_stamina + N) × count`, exactly
  as `Monsters.md:490` ("each minion … gains") composes with `:415` ("multiplied by the
  number of minions"). Do **not** add N once. A 6-minion Hobgoblin Recruit squad goes
  72 → 104, not 76. **Corollary that must ship with it: the death ladder step becomes
  `per + N`, not `per`** — a captained Hobgoblin Recruit squad drops a minion every 13
  damage, not every 9. Anything less is an inconsistent pool.
- **Q3 → conditional on the captain, and the tracker should reflect it.** ":490 says
  "While…". A squad whose captain is down/relieved is `S × count`. **How** the change lands
  on a mid-fight pool is a ruling — see C1(a).
- **Q4 → yes, and the SC-183 model already carries it.** Resolve N per squad through
  `captainOfSquad(group, minion)` (`EncounterData.ts:148`); a group can hold one captained
  and one uncaptained squad and each gets its own answer. One caveat to fix in passing: the
  group-body `data-captain` attribute is `anyDown` across all captains
  (`view.ts:1472-1474`), which is a group-level approximation of a per-squad fact.

### C1. Ambiguous points that need Scott's ruling

---

**(a) Pool MAX and pool CURRENT when the captain goes down mid-fight** *(the big one)*

Setup: 6 Hobgoblin Recruits (S=9, N=+4). Captained pool max 78, currently at 52 (26 damage
taken → 2 dead under the `per+N`=13 ladder). Captain drops to 0. Uncaptained max is 54.

| Option | Behaviour | Consequence |
|---|---|---|
| **A1 — recompute max, clamp current down** | max 78→54; current `min(52, 54)` = 52 | The squad is suddenly at 52/54 — nearly full — after having taken 26 damage. Reads as the squad being *healed by the captain dying*. |
| **A2 — recompute max, apply the delta as damage** | max 78→54; current 52 − 24 = 28 | The 4 Stamina each living minion "had" from the captain is removed with them. Preserves proportion-taken and the 4-alive count (28/54 = 2 more deaths to go, consistent). Never heals. |
| **A3 — freeze the max, apply nothing** | max stays 78, current stays 52 | The bonus is treated as "initial Stamina" per `:415`'s word "initial". Zero recompute, zero surprise, but the badge then says "Captain down" while a 78-max pool is still on screen. |

**My pick: A2**, with A3 as the defensible fallback. A2 is the only option that honours
`:490`'s "While" without ever making a squad *better off* for losing its captain (A1's
failure mode is a table-visible absurdity, and a GM will notice it in one fight). A2's
delta is `N × living_minion_count` under the live-count reading of (c) — which is precisely
"each minion loses the additional Stamina it had", the literal inverse of :490. It also keeps
the death ladder honest: after the recompute the ladder step is `S`, and `floor((54−28)/9) =
2` dead, matching reality.

The counter-argument for **A3** is real and Scott may prefer it: it is the only option that
never silently changes a number the GM did not edit, and `:415`'s "initial" is genuine
textual support. If Scott picks A3, the honest UI is a badge that says the bonus is **now
inactive but still banked** — which is more explanation than most tables want.

**A1 should be rejected outright** regardless of the ruling on the rest.

---

**(b) Same question on promote / relieve**

`promoteCaptain` and `relieveCaptain` are explicit user actions (`view.ts:997-1004`),
unlike a captain dying — which matters, because an undo affordance is more expected here.

| Option | Behaviour |
|---|---|
| **B1 — symmetric with (a)** | Relieve = the same delta-down as a captain going down. Promote = the mirror: max up by `N × living`, current up by the same. |
| **B2 — symmetric down, asymmetric up** | Relieve removes it (as (a)); promote raises the **max** only, leaving current where it is (because ":415 says minions can't regain Stamina during a battle"). |
| **B3 — recompute only at squad init; promote/relieve change nothing but the badge** | Today's behaviour, made explicit. |

**My pick: B1.** It is the only option under which the pool is a pure function of
`(S, N, count, captain-present, damage-taken)` — i.e. promote-then-relieve is a no-op and the
GM can fix a misclick. B2 is *more literally rules-correct* (`:415` genuinely forbids minions
regaining Stamina) but it makes the operation irreversible, which is a bad property for a
one-click button, and it means promote-relieve-promote strictly drains a squad. If Scott
wants B2's rules purity, the promote path should at minimum warn.

Note B1 also implies the **"I Am the Captain Now" window** is real at the table: `:494` lets
a replacement step in "at the start of the next round", so a squad legitimately spends part
of a round captainless, and the pool visibly dips and recovers. That is the rules working as
written, not a bug — but it should be in the docs so it doesn't get filed as one.

---

**(c) Does the bonus scale with LIVE minion count or ORIGINAL squad size?**

Grounding, from `Monsters.md:415`/`:419`/`:441`: **the book's pool max NEVER shrinks.** The
max is "initial", set once; the ladder (40/35/30/…/0) is fixed absolute damage totals. In the
book, "how many minions are alive" is *derived from* the pool, not an input to it.

But **DSE already violates this in one of its two pool-max sites** (§B1): the modal uses
alive count (`MinionStaminaPoolModal.ts:64`, `:249`, `:205`) while the row/print readout uses
original `amount` (`view.ts:731`, `:1558`).

| Option | Behaviour |
|---|---|
| **C1 — ORIGINAL count everywhere; bonus = `N × amount`, fixed** | Matches the book exactly. Requires fixing the modal to use `amount` — which changes the modal's max, its ticks, and its CB-1 clamp. Biggest blast radius, most correct. |
| **C2 — LIVE count for the bonus, original for the base** | Internally incoherent; produces a max that shrinks by N per death. Reject. |
| **C3 — LIVE count everywhere; bonus = `N × alive`** | Matches the modal's existing convention. Requires changing `view.ts:731`/`:1558` to alive count — which **changes printed text** and moves the frozen print PNGs. |

**My pick: C1 (original count everywhere), and fix the modal's max to match** — but flag it
loudly, because it is a behaviour change to an existing, tested modal that is out of SC-195's
literal scope. The book is unambiguous that the max is fixed, the ladder is fixed, and a
5×5 squad that has taken 5 damage is at **20/25**, not at a full 20/20. The modal's alive-based
max is the bug; `view.ts` is right.

If Scott wants SC-195 kept narrow, the fallback is: **apply the bonus as `N × amount` (fixed)
in both places, and leave the existing alive-vs-original divergence exactly as-is**, filing it
as its own Backlog ticket. That is honest and keeps the freeze/print surface smaller. I'd
still recommend C1.

*(Minions added mid-fight: the book has no rule — `:437` is narrative advice about
reinforcements, which read as a new squad. Recommend the tracker do nothing here; `amount` is
already immutable at runtime.)*

---

**(d) How the UI shows the bonus**

Constraints from the codebase: Scott is colourblind, so **the word/number is always the first
channel and colour is never the only one** — the standing convention (`view.ts:762-764`,
`:1020-1027`, SC-183 r2 §3). The pool's numeric readout at `view.ts:1558` is in the **base
(print) DOM**; the Steel bar at `view.ts:824+` is screen-only.

| Option | Behaviour |
|---|---|
| **D1 — show the split in the readout: `52/78 (13) +4 w/ captain`** | Maximum honesty; every number a GM needs is on the row. Longest string; changes printed text; crowds the narrow (300px) layout. |
| **D2 — fold the bonus silently into the numbers, and say it on the CAPTAIN BADGE** | The readout stays `52/78 (13)` — already correct, already reflects the bonus. The badge's word becomes **"Captain +4 Sta"** / **"Captain down"**. One place tells you *why* the pool is that size, and it is the place that already owns the captain fact and already repaints on every relevant event (`refreshCaptainState`, `view.ts:1471-1487`). |
| **D3 — fold in silently, no indication at all** | Smallest diff, smallest freeze delta, but the ticket's own stated fear ("a visible number in a live combat") lands: the GM sees a pool that doesn't match their own arithmetic and has nothing to explain it. Reject. |

**My pick: D2.** The badge is already the squad's captain instrument, already carries a WORD
first + crown glyph second + ink third (`view.ts:977-980`), already has a per-captain
`data-captain-for` repaint path, and already flips its word on captain-down. Appending the
active bonus to that word costs one string, no new DOM node, and no new channel. Add a
`data-captain-bonus` attribute for testability/styling. Reserve D1 as an option Scott can
ask for if he wants the arithmetic on the row.

**Freeze/print note either way:** the pool numeric readout at `view.ts:1558` is in the print
DOM, so **any change to the pool max changes printed text**, and the frozen print PNGs will
move for any harness fixture with a captained Stamina-bonus squad. The current `fight` /
`squads` fixtures use Goblins (no Stamina bonus), so if the fixtures are left alone the freeze
may hold at zero — **but a new fixture demonstrating the feature will require a sanctioned
rebaseline.** Plan for one; run the `dse-verify` battery with the freeze gate.

---

**(e) Non-Stamina bonuses (damage / speed / edge / distance) — does the tracker need anything?**

**Explicitly out of scope. Recommend the tracker do nothing with them.** Reasons:

1. The tracker models exactly one number per actor — Stamina. It has no speed field, no
   damage field, no edge/bane model, and no strike resolution. There is nothing for
   "+2 bonus to speed" or "Gain an edge on strikes" to modify.
2. Those 21 non-Stamina shapes are **already surfaced** where a GM reads them: the statblock
   element's With Captain cell (`view.ts:193`) and the site's `.sb__meta` / sticky bar
   (SC-157). The information is not missing, it is just not in the tracker.
3. Making them mean something would require parsing 21 heterogeneous free-form strings —
   including `Lightning spread increases by 1 square` — with no model to apply them to.

The one thing worth considering (and worth its own ticket, **not** this one): the captain
badge could show the squad's raw `with_captain` string as a **tooltip** regardless of flavor,
so a GM running a `+2 damage bonus to strikes` squad sees the rider without opening the
statblock. Zero rules logic, one `title` attribute. Say the word and I'll fold it in;
otherwise it should be a Backlog item.

---

### C2. One more decision the ticket didn't name: **where does N come from?**

The tracker cannot read `with_captain` today (§B2). Three sources:

| Option | Behaviour |
|---|---|
| **S1 — merge it from the referenced statblock** | Add `with_captain?: unknown` to `StatblockFields` (`resolveRefs.ts:36-40`) and copy it at `:127-129`; parse `/^\s*\+(\d+)\s+bonus to Stamina\s*$/i` (10/10 corpus coverage, 0 false positives). Automatic for every builder-emitted and ref-bearing block. Silently does nothing for a hand-written creature with a literal `max_stamina` and no `statblock:` ref. |
| **S2 — an explicit encounter-YAML field**, e.g. `with_captain_stamina: 4` on the minion creature | Explicit, no string parsing, works with no ref. But every user must look it up and type it, and existing blocks get nothing. |
| **S3 — both: S1 as the default, S2 as an override** | Automatic where a ref exists; escape hatch where it doesn't, or where the string doesn't parse, or where the GM is homebrewing. |

**My pick: S3.** S1 alone leaves ref-less squads (a real, common hand-written shape) with a
silently absent bonus; S2 alone is a tax on every user for a value the data already has.
S3's cost over S1 is one optional field + one `??`. **Back-compat:** `with_captain_stamina`
is additive and only written when the user types it, so existing blocks keep their exact
bytes (the standing rule at `EncounterData.ts:115-122`).

One sharp edge to decide with it: **an unparseable or non-Stamina `with_captain` must be a
silent no-op, never an error** — 27 squads say "Gain an edge on strikes" and none of them
should fail to load.

### C3. Implementation scope estimate

**Files (recommendation as picked above: per-minion × original count, S3 sourcing, D2 UI, A2/B1 recompute):**

| File | Change | Size |
|---|---|---|
| `src/drawSteelAdmonition/EncounterData.ts` | optional `Creature.with_captain_stamina?: number` (~:90); new `captainStaminaBonus(group, minion)` (parses + gates on `captainOfSquad` + captain-alive) and `poolMaxFor(group, minion)`; pool init at `:534` routes through it; `validateSquad` untouched | ~60 lines new, 1 line changed |
| `src/elements/initiative/model.ts` | pool init at `:196` routes through the same helper | 1-2 lines |
| `src/elements/initiative/resolveRefs.ts` | `StatblockFields` gains `with_captain` (`:36-40`); merge copies it only-if-unset (`:127-129`); pool refill at `:187` routes through the helper | ~6 lines |
| `src/elements/initiative/view.ts` | `staminaSpecFor` pool max + ticks (`:729-735`); `updateStaminaDisplay` readout (`:1558`); **new**: pool recompute on promote/relieve (`:997-1004`) and on captain-down inside `refreshCaptainState` (`:1471-1487`); badge word gains the bonus + `data-captain-bonus` (`:947-1011`) | ~50-70 lines |
| `src/views/MinionStaminaPoolModal.ts` | `onOpen` max + ticks (`:62-71`), `poolNumbers` (`:246-257`), **the CB-1 clamp at `:205`** — the parenthesization stays, the max expression changes | ~15 lines, high-care |
| `styles-source.css` | only if the badge needs a bonus sub-span; likely a `data-captain-bonus` hook, base-hidden per the standing print rule | ~5-10 lines |
| `visual-harness/entry.ts` | a captained Stamina-bonus fixture + shot id (e.g. Hobgoblin Recruit squad) — **triggers the rebaseline** | ~20 lines |
| `docs/initiative-tracker.md` | the §"Minions and Captains" block (`:196-206`) gains the bonus rule, the captainless-window note, and `with_captain_stamina` | ~15 lines |
| `CHANGELOG.md` | one `## Unreleased` bullet | 1 line |

**Tests needed** (the ticket named "pool recompute on captain promote / relieve / death"):

- `test/unit/model/encounter-data.test.ts` — the bonus helper: `(S+N)×count` at init; N=0 with no captain; N=0 when the captain is down; per-squad resolution in a 2-squad group where only one squad is captained; unparseable/non-Stamina strings → no-op; `with_captain_stamina` overrides the parsed string.
- `test/unit/model/initiative-resolve-refs.test.ts` — `with_captain` survives the statblock merge; only-if-unset; a ref-less creature still parses.
- `test/dom/elements/initiative.test.ts` — **the three recompute triggers**: promote raises the pool, relieve lowers it, captain hitting 0 lowers it; promote-then-relieve round-trips (B1); the readout and the badge word agree after each; the badge shows the bonus as a WORD/number (not colour); a squad with a non-Stamina `with_captain` is unaffected.
- `test/dom/views/minion-stamina-pool-modal.test.ts` — the modal's max, its death ticks, and the CB-1 clamp all reflect the bonus; the kill ladder steps by `per + N`.
- `test/unit/model/initiative-serialize.test.ts` — byte-compat: a block without `with_captain_stamina` never grows it.

**Gates:** full `dse-verify` battery — `tsc`, `lint`, `jest`, `shots` ×2, `check-freeze.sh`,
`parity` last. **Expect a freeze delta if a captained-Stamina fixture is added**; predict and
declare it, and produce a rebaseline list rather than editing the baseline silently.

**Rough size: one focused implementation round** (~250-350 lines incl. tests) *if* Scott
rules on (a)–(d) and C2 up front. It grows by a second, riskier pass if C1's
alive-vs-original max unification (§C1(c)) is folded in, since that touches the modal's
tested kill-accounting and moves print text on its own.

---

## STATUS

Round 1 complete. **No code changed.** Blocked on Scott's rulings for C1(a) captain-down
recompute, C1(b) promote/relieve symmetry, C1(c) live-vs-original count (and whether to
unify the existing modal/row divergence in this ticket), C1(d) UI channel, and C2 where N
comes from. C1(e) is a recommendation to do nothing, stated explicitly.
