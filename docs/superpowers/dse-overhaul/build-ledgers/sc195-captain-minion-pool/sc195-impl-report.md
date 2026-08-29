# SC-195 implementation report — the "With Captain" Stamina bonus

Worktree: `/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool/draw-steel-elements`
Branch: `sc195-captain-minion-pool`. Base: `1619396`. Commits on top: **`d3ad4ea`** (main
implementation), **`b0beb40`** (fix round — badge overflow CSS + fixture selection).
Not pushed. Superproject pointer untouched. No tags.

## What changed (file:line)

- **`src/drawSteelAdmonition/EncounterData.ts`** — new `Creature` fields `with_captain?:
  string` (merged raw statblock string), `with_captain_stamina?: number` (YAML override),
  `minion_stamina_pool_max?: number` (persisted pool max), `captain_bonus_active?: boolean`
  (persisted transition flag); mirrored `Hero.with_captain?` for merge symmetry. New
  exported helpers (all with the SC-195 rules-grounding comment block): `isCaptainDown`
  (moved here from view.ts, shared with the bonus gate; treats "no instances yet" / an
  instance with `current_stamina` still `undefined` as ALIVE — a parse-time ordering fix,
  see below), `parseWithCaptainStamina` (anchored `/^\+(\d+)\s+bonus to Stamina$/i`),
  `withCaptainStaminaN` (override-wins-over-parsed), `captainStaminaBonus` (the gate:
  captain bound + not down → N, else 0), `minionPoolMaxOf` (persisted value, else
  `max_stamina * amount` — the C1 fix), `initMinionPool` (squad-creation bake-in, only
  materializes the two new persisted fields when the bonus is actually nonzero — keeps
  every ordinary squad byte-identical), `applyCaptainBonusTransition` (edge-triggered
  `N × alive` delta on current+max, clamped ≥0, no-op when the flag already matches).
- **`src/elements/initiative/model.ts`** — re-exports the new helpers; sync `parse()`'s
  pool init now calls `initMinionPool` instead of the bare `max_stamina * amount`.
- **`src/elements/initiative/resolveRefs.ts`** — `StatblockFields` gains `with_captain`;
  both the hero and creature merge blocks copy it only-if-unset (kept in lockstep, per the
  brief); phase-3 pool init (ref-bearing squads, post-merge) also routes through
  `initMinionPool`.
- **`src/elements/initiative/view.ts`** — `staminaSpecFor` (pool max) and
  `updateStaminaDisplay` (readout, now `current/max (base+activeBonus)`) read
  `minionPoolMaxOf`/`captainStaminaBonus`; death ticks simplified to `i/amount` (identical
  output pre-SC-195, no longer depends on `per`). Removed the private `isCaptainDown`
  (now imported). New `captainBonusSuffix` helper feeds the badge word in both
  `buildCaptainBadge` (initial paint) and `refreshCaptainState` (in-place repaint) —
  `"Captain +N Sta"` when active, plain `"Captain"`/`"Captain down"` otherwise.
  `data-captain-bonus` (`on`/`off`, a group-level summary across possibly-several squads)
  stamped in `buildEnemyGroupRow` and kept live in `refreshCaptainState`. The
  promote/relieve click handler calls `applyCaptainBonusTransition` on the affected squad
  before its existing coarse rebuild. `openCreatureStaminaModal`'s apply callback now
  detects a captain-stamina edit that crosses the bonus threshold and falls back to a
  coarse rebuild in that one case only (ordinary edits keep the existing targeted
  in-place repaint — verified the pre-existing "flips in place, without a rebuild" test
  still passes unaffected, since its fixture carries no bonus).
- **`src/views/MinionStaminaPoolModal.ts`** — C1 fix: `onOpen`'s max/ticks and
  `poolNumbers()` now read `minionPoolMaxOf` (persisted/original-count) instead of
  recomputing `aliveCount * minionMaxStamina`; the CB-1 Apply clamp ceiling is the same
  persisted max (the old `len ?? 0 * max` precedence footgun no longer has an
  alive-count multiplication to protect, noted in an updated comment); the kill-ladder
  divisor is now the *current* effective per-minion Stamina (`base + captainStaminaBonus`).
- **`visual-harness/entry.ts`** — new `initiative` fixture `captain-bonus` (Hobgoblin
  Recruit corpus example: 9 Stamina, `with_captain_stamina: 4`, 6-minion squad, 65/78 (13)
  mid-fight, `selectedInstanceKey` pointed at the captain so the one screenshot documents
  both the ellipsized roster badge and the full detail-row word).
- **`styles-source.css`** — fix-round addition: `.dse-init__captain-word` gets
  `min-width: 0; overflow: hidden; text-overflow: ellipsis`; `.dse-init__captain-glyph`
  gets `flex-shrink: 0`. Both carry the standard
  `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='initiative']`
  guard (Steel-screen-only, zero print impact — see "visual finding" below).
- **`docs/initiative-tracker.md`** — new "The 'With Captain' Stamina bonus (SC-195)"
  subsection under "Minions and Captains": the rule, `with_captain_stamina`, what
  triggers a recompute, and where it displays.
- **`CHANGELOG.md`** — one `[FEATURE]` bullet under the `7.0.0 (unreleased)` header.
- **Tests** (all in the suites the brief named):
  `test/unit/model/encounter-data.test.ts` (parser corpus incl. all non-Stamina shapes,
  override-wins, gate, `minionPoolMaxOf`, `initMinionPool`, `applyCaptainBonusTransition`
  incl. promote/relieve/death/heal/clamp/no-op/idempotent-reread),
  `test/unit/model/initiative-resolve-refs.test.ts` (with_captain merge both loops,
  override wins, non-Stamina silent, ref-bearing squad bakes in at phase 3),
  `test/dom/elements/initiative.test.ts` (full DOM interaction coverage: init bake-in,
  YAML override wins, silent no-op, captain-death, healed re-application, clamp-at-0,
  promote-then-relieve no-op, `data-captain-bonus` across a multi-squad group, YAML
  round-trip), `test/dom/views/minion-stamina-pool-modal.test.ts` (original-count max
  after deaths, ticks unchanged, kill-ladder divisor, stepper-bound regression, CB-1
  Apply clamp, persisted-max-wins, bonus-aware kill divisor),
  `test/unit/model/initiative-serialize.test.ts` (byte-compat proof for an ordinary
  squad — no new keys anywhere — and a fixed-point round-trip for a bonus squad).

## Gate results

| Gate | Base (`1619396`) | Final |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **3394 passed / 1 skipped / 3395 total**, 189/190 suites, 3 snapshots | **3473 passed / 1 skipped / 3474 total** (net **+79**), 189/190 suites (unchanged — no new test FILES), 3 snapshots |
| `npm run shots` | **474**, 0 FAIL | **478** (+4: the new `captain-bonus` fixture × dark/light/print/realprint), 0 FAIL |
| `check-freeze.sh` | `freeze OK (210/210 …)` | `freeze OK (210/210 …)` — **0 mismatches, 0 bytes moved** |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED, exit 0 | 0 GAPs / 0 undeclared / 16 DECLARED — **unchanged from base** |

Jest's +79 is net across two commits: +78 new test cases in the first commit, +1 more
picked up automatically in the second (a style-guard `test.each` that enumerates matching
CSS rules — the two new Steel-scoped rules I added both carry the required
`:not([data-dse-print="on"])` guard, so the existing guard test's own count grows by one,
not a new manually-written test).

**No frozen bytes moved.** The new fixture's four capture ids
(`initiative-captain-bonus--steel-{dark,light,print,realprint}`) are new names, invisible
to `sha256sum -c` against the existing 210-line baseline by construction — no rebaseline
file needed, nothing to sanction.

## Visual finding + fix (self-caught, fix round)

First render of the new fixture showed a real defect: the extended badge word
("Captain +4 Sta", D2) is wider than the roster grid cell, and the pre-existing
`.dse-init__captain { max-width: 100% }` only clamps the badge's own box — the `nowrap`
text painted past it (default `overflow: visible`), visibly spilling into the
neighboring minion cell in BOTH themes. Fixed with `min-width: 0` (flex items refuse to
shrink below their content's natural width by default) plus
`overflow: hidden; text-overflow: ellipsis` on `.dse-init__captain-word`, and
`flex-shrink: 0` on the crown glyph so it's never the thing that visually squashes. The
narrow roster cell now reads `"Captain …"` (ellipsized, no overflow); the roomier
detail-row context still shows the full word. Both rules are Steel-scoped and
screen-only (`:not([data-dse-print="on"])`), so print is untouched by construction —
confirmed by a clean freeze re-run after the fix (still 210/210, 0 moved).

## Screenshots (evidence)

Copied into this ledger dir (also live in the worktree's gitignored
`visual-harness/shots/`, same bytes):

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc195-captain-minion-pool/sc195-fixture-dark.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc195-captain-minion-pool/sc195-fixture-light.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc195-captain-minion-pool/sc195-fixture-print.png` (no badge, no arithmetic — numbers only, per D2/print-absent-by-construction)

All three (plus the print twin's `--steel-realprint` sibling, not separately copied — it
is byte-identical to the print twin per the standing invariant) also live at:
`/home/scott/code/steelCompendium/worktrees/sc195-captain-minion-pool/draw-steel-elements/visual-harness/shots/initiative-captain-bonus--steel-{dark,light,print,realprint}.png`

## Open questions / notes for the ticket owner

1. **Pre-existing (already-running) encounters with a captained squad don't retroactively
   gain the bonus on first reload after this ships.** `initMinionPool` only runs when
   `minionPoolOf(...) == null` (a brand-new squad) — an in-progress squad that already has
   a persisted `minion_stamina_pool` keeps it untouched, and `captain_bonus_active` stays
   absent (read as `false`) until the next real transition (promote/relieve/captain
   stamina edit) recomputes it going forward. This matches the "never re-derive wholesale
   at render" requirement and avoids silently changing an established mid-fight number,
   but it does mean an ALREADY-CAPTAINED squad's bonus doesn't "just appear" on upgrade —
   it needs one transition to catch up. No fixture/test encodes this exact migration
   moment; flag if a backfill-on-load is wanted instead.
2. **`EncounterData.ts`'s own legacy async `parseEncounterData`** (used only as the
   byte-compat oracle in tests, not on the live pipeline — confirmed via search, only
   `resolveInitiativeRefs`/`model.ts` are wired into `definition.ts`) was deliberately
   **left unchanged** — its pool-init line still does the plain `max_stamina * amount`,
   with no `with_captain` merge and no bonus bake-in. Zero test/behavior impact (no
   existing oracle fixture carries a `with_captain` field), but noting the asymmetry
   explicitly in case a future change resurrects that function for real use.
3. The CSS overflow fix (visual finding above) was authored and verified within this
   round rather than filed as a follow-up, since it's small, Steel-scoped/print-inert,
   and directly a consequence of this ticket's own D2 change — flagging it for the
   ticket owner's awareness/sign-off rather than assuming it needs none.

## Commits

- `d3ad4ea` — SC-195: apply the squad captain's Stamina bonus to the minion pool (13 files, +1196/-40)
- `b0beb40` — SC-195 fix round: badge overflow + select the captain in the new fixture (2 files, +20/-1)

Neither pushed. No tags. Superproject pointer untouched.
