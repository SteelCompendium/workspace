# SC-241 decisions ledger

Ticket: SC-241 — "DSE: MinionStaminaPoolModal carries the RC-3 negative-input inversion, unfixed"
Worktree: /home/scott/code/steelCompendium/worktrees/sc241-minion-heal (DSE branch `sc241-minion-heal`, tracked branch `develop`)
Base: draw-steel-elements `origin/develop` = 0c132d8 (2026-09-23)

## Scott's rulings (verbatim, dated)

### 2026-08-28 — ticket description (authored by Scott, migrated FOLLOWUPS #60)

> `src/views/MinionStaminaPoolModal.ts:100-105` (`damageInput`, no `min`) and `:126-132`
> (`parseInt`, no magnitude clamp): "Apply Damage" with `-3` heals the minion pool — the
> same class of bug SC-133's RC-3 fixed in `StaminaEditModal`. Out of scope there (different
> modal/operation, and this one surfaces a "minions typically can't regain stamina" warning
> so it isn't fully silent). Apply the same parse-boundary `Math.max(0, …)` clamp + `min="0"`
> and a red-first test.

No comments on the thread as of 2026-09-23.

## Owner rulings (ticket-owner, not Scott)

- 2026-09-23 — The minion-count input is the same inversion (a negative count times a positive
  damage also heals). `minionCountInput` already has `min="0"` but its `parseInt` is also
  unclamped. Fold it into this fix: clamp BOTH parsed values at the parse boundary with
  `Math.max(0, …)`. Red-first test covers both.
- 2026-09-23 — User-facing fix, so a `[FIX]` bullet goes in `draw-steel-elements/CHANGELOG.md`
  under `## 7.0.0 (unreleased…)` (the plugin's own changelog; top of list, matching SC-278's shape).
- 2026-09-23 — No visual change expected (only `min` attribute on an input + onClick logic).
  Freeze must stay 260/260 with no rebaseline. If shots move, stop and report.

## Rounds

| Round | Worker | Role | Result |
|---|---|---|---|
| 1 | implementer (acd283b) | impl + gates | commits d99f5a0 (red tests), 18c9ac9 (fix), 46c0c4c (changelog); killed by 429 before battery; resumed 2026-09-24 for gates |
| 1b | implementer (acd283b) | gates | DONE: red-first 4 fail/30 pass; jest 3930/1 skip/202 of 203; shots 524/0 FAIL; freeze 260/260; parity 0/0/16 |
| 2 | reviewer (a3ef53a) | independent review | APPROVE at 46c0c4c; 0 HIGH/MED/LOW, 4 INFO; red-first re-proved (4 fail/30 pass); 5 mutations each caught; 15-case edge probe green; jest 3930/1/202 of 203, tsc+lint clean |

## Owner rulings on review INFO (2026-09-24)

- INFO-1 (`parseInt` reads `1e3`→1, `3.7`→3; under-damages, never heals; predates branch; same in StaminaEditModal) — DROP: not an inversion, no real table flow types exponents/decimals into a damage box; outside this ticket's bug class.
- INFO-2 (minion-count `max` counts dead minions and is not enforced at read) — DROP: the count is a GM-entered hint, over-count can only over-damage (never heal), and the pool floors at 0.
- INFO-3 (impl report says +4 new tests; actually 5 new on 29) — DROP: report bookkeeping only.
- INFO-4 (min="0" can't move pixels; no :invalid/:out-of-range selectors) — no action; confirms freeze 260/260.

Status: LAND-READY at draw-steel-elements `sc241-minion-heal` 46c0c4c. No Scott ask (no visual change, no freeze move).
