**Ruling needed: five picks below decide how a captain's "+N bonus to Stamina" lands on the squad's Stamina pool. Reply with the letters (e.g. "as recommended", or "A2 B1 C1 D2 S3" with any swaps).**

## What the book settles (no ruling needed — implemented as-is)

- **The bonus is per minion, multiplied.** *"While a minion squad has a captain, **each minion in the squad** gains the benefits noted at the 'With Captain' entry"* (Monsters, "Using Minions"), and the pool is *"each individual minion's Stamina multiplied by the number of minions."* So a 6-minion squad with "+2 bonus to Stamina" gains **12** pool, and the minion-death ladder steps by (per-minion + 2).
- **It is conditional**: *"**While** a minion squad has a captain"* — no captain, no bonus.
- 10 statblocks in the Monsters book carry a Stamina-flavored With Captain line, and all 10 match the exact shape `+N bonus to Stamina` (N = 2, 3, 4, or 6). Beastheart has none; Summoner's one With Captain line is speed, not Stamina.

## The picks (recommendation first in each)

**(a) Captain goes down mid-fight → A2, recompute and carry damage.** Pool max drops by N × squad size, and current drops by the same amount — damage already taken stays real. Alternatives: A3 freeze the pool as first built (defensible — the book calls the pool's value "initial"); A1 drop max but keep current — rejected, it makes a squad healthier for losing its captain.

**(b) Promote / relieve a captain → B1, fully symmetric.** Promoting adds the delta to max and current; relieving removes it, so promote-then-relieve is a no-op and a misclick is recoverable. Alternative B2 (promote raises max only, on the "minions can't regain Stamina" reading) is more literal but makes misclicks irreversible.

**(c) Bonus scales by ORIGINAL squad size, not live count → C1.** The book is unambiguous that a pool's max never shrinks as minions die (the death ladder is absolute damage totals from the initial value). C1 also fixes a pre-existing divergence the research found: the row bar and print readout already use original size, but the minion-pool modal recomputes max from the ALIVE count — a 5-minion squad of 5-Stamina minions that has taken 5 damage reads 20/25 on the row and 20/20 in the modal today. C1 makes the modal match the row and the book.

**(d) Display → D2, fold the numbers in and let the captain badge's word carry it.** The pool just shows the correct totals; the existing "Captain" badge text extends to e.g. "Captain +4 Sta" while the bonus is active (the word carries the meaning, the crown icon is secondary — never color alone). Alternative D1 puts the arithmetic on the row itself, e.g. "52/78 +4 w/ captain", if you want the bonus visible in the numbers.

**(S) Where N comes from → S3, parse the statblock, with a YAML override.** The tracker's data model doesn't carry `with_captain` today; we'd merge it from the referenced statblock and parse the exact `+N bonus to Stamina` shape, plus an optional `with_captain_stamina:` YAML key for ref-less/homebrew squads. Anything unparseable or non-Stamina is a silent no-op, never an error.

**Declared out of scope:** non-Stamina With Captain benefits (damage / speed / edge — 21 other shapes in the book) stay statblock-display-only; the tracker models Stamina only.

---

Mechanics, below the ask:

- Full research report: `.superpowers/sdd/sc195-captain-minion-pool/sc195-research-report.md`. Rules citations: `Draw Steel Monsters.md` :415, :419, :433, :441, :482, :490, :494.
- Code anchors: pool init lives in three places that must stay in step (`EncounterData.ts:534`, `initiative/model.ts:196`, `initiative/resolveRefs.ts:187`); captain state at `EncounterData.ts:148–187` and `view.ts:905/947–1011/1471–1487`. No pool recompute exists on any captain path today — the ticket's premise is confirmed.
- Scope estimate: ~250–350 lines incl. tests (EncounterData, resolveRefs, view, the pool modal, a visual-harness fixture); tests cover pool recompute on captain promote / relieve / death, as the ticket asked.
- Heads-up: a new captained-squad print fixture will move frozen print screenshot bytes — expect a sanctioned-rebaseline ask with before/after crops at review time.
