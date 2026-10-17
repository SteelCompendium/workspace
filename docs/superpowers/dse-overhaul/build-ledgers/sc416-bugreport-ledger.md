# SC-416 — decisions ledger

Effort: `sc416-bugreport`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc416-bugreport`.
Owner: Fable ticket-owner. Workers read THIS file, never the tracker.

## Ticket (Scott, 2026-10-17, verbatim)

> This bug report came in on version 6.0.2
>
> We have replaced a ton of code related to this, but its still worth looking through these to make sure we have fixed/accounted for them in 7.0.0
>
> To be clear, we arent fixing 6.0.2 bugs.  We are just going to make sure the same bugs dont exist in 7.0.0
>
> ```
> Source errors found in the Draw Steel Compendium markdown (Obsidian version, downloaded via Draw Steel Elements plugin 6.0.2 on 2026-10-10). Paths are relative to the Compendium root.
>
> 1. Rules/Abilities/Conduit/: ability files are mis-leveled and duplicated. 4th-Level Features holds Beacon of Grace, Blessing of Secrets, Penance, Sanctuary and Vessel of Retribution, and 5th-Level Features repeats four of them (Beacon of Grace, Penance, Sanctuary, Vessel of Retribution). 7th-Level Features and 8th-Level Features both contain Arise, Blessing of Steel, Blessing of the Blade and Drag the Unworthy. Rules/Classes/Conduit.md looks correct.
>
> 2. Bestiary Retainers, Hexer abilities: the Level 7 role advancement file is missing. Only Level 4 and Level 10 exist in the Hexer abilities folder. Take Root appears in Bestiary/Chapters/Retainers.md under "Hexer Abilities".
>
> 3. Rules/Classes/Talent.md, "Psi Boost" (line 971): "you can spend additional discipline". Discipline is Null's resource, Talent uses clarity. Looks copied from Null.
>
> 4. Rules/Classes/Troubadour.md, "Troubadour Advancement Table": the 7th-level Abilities column reads "Signature, 5, 7, 9" (the 3 is dropped), and the 8th-level class-act column already lists the 11-Drama ability. The class text says class-act abilities come at levels 2, 6 and 9.
>
> 5. Bestiary/Chapters/Retainers.md, Gnoll Gnasher: the header shows "EV 60". Every other retainer shows "EV -", so this looks like a typo. Same section: the ability title "Horrific Feas" is truncated (should be Horrific Feast).
>
> 6. Bestiary/Chapters/Retainers.md, Goblin Guide, Poison Blade: the effect text is cut off mid-sentence ("...if the target has M").
>
> 7. Bestiary/Chapters/Retainers.md, Undead Servitor: the Level 7 header is malformed (stray "########").
>
> Also unclear rather than wrong: Conduit's Beacon of Grace says "that creature can spend a Recovery" without saying whether that is the target or the conduit.
> ```

## Rulings

(none yet beyond the ticket text)

## Owner notes (not rulings)

- 2026-10-17: 7.0.0 downloads compendium content from `SteelCompendium/data-unified` GitHub
  releases (`draw-steel-elements/src/data/CompendiumSyncService.ts`, `COMPENDIUM_SOURCE`),
  md-dse format. 6.0.2 pulled the old `compendium/` repo. So "does the bug exist in 7.0.0"
  = "does it exist in steel-etl's input books / data-unified md-dse output".

## Owner rulings (2026-10-17, after r1 survey — not Scott's; Scott has not been asked yet)

- Items 2, 3, 4, 5, 7 are STILL-PRESENT in the steel-etl input books → fix them in round 2. Items 1, 6 are
  FIXED-IN-7 (no action). Item 8 (Beacon of Grace wording) is MCDM's own wording → no change.
- Follow-ups from r1 (all in the same files/sections the fix touches) → **fold into round 2**:
  - Hobgoblin Flameslinger duplicated statblock row (`Draw Steel Monsters.md:28424-28425`).
  - Dwarf Mortar advancement order 4/10/7 → 4/7/10 (`Draw Steel Monsters.md:28020-28052`).
  - Psi Boost links → Talent's own code (part of item 3).
  - Conduit domain-feature table rows linking to censor codes (`Draw Steel Heroes.md:7177` area):
    re-point a row ONLY where a Conduit-owned code exists in the registry; otherwise leave it and report.
- No SCC code moves (survey confirmed). Scott's eye comes after the fix + review: one consolidated
  Needs Review comment.
- r2 fix: steel-etl `c2bf829` (A–H done; H re-pointed 2 rows: Creation, Trickery). r2 follow-up —
  other Conduit tables/body text link to Censor codes (H ~6337, 6338, 6343, 7557, 7207 have existing Conduit
  codes; six 4th-level rows would need NEW SCC codes) → **file a Backlog ticket linking SC-416**; out of scope
  for this ticket (registry change + a linking-policy question, not a 6.0.2 bug).
- Filed **SC-418** (Backlog, Compendium+ETL) for the Censor-link follow-up, 2026-10-17.
- r3 re-review (same reviewer identity as r1; author-independent): **LAND-READY** at `c2bf829`, one INFO —
  `Draw Steel Monsters.md:28062` Dwarf Mortar Pacifier Shell ≤11 tier missing closing `)`. Ruling: **fold**
  into a tiny r4 fix round (same block the fix already moved); then reviewer re-checks the delta.
- r4: paren fix committed as steel-etl `b155140` (second commit; branch tip). Reviewer re-check dispatched.
- 2026-10-17: CHANGELOG bullet committed in worktree superproject `63f8e7c`. Comment posted; flipped In Progress + Needs Review. **Land-ready** for the dispatcher: worktree `sc416-bugreport`, steel-etl `b155140` (2 commits on 0c74f4f), superproject CHANGELOG `63f8e7c`; steel-etl pointer bump uncommitted (wt-finish does it).

## Scott ruling (2026-10-17, in-session, verbatim)

> mark 418 as high priority. Lets go ahead and make the data-unified release and deploy

→ SC-418 priority High. Land `sc416-bugreport` to origin/main (this session acts as dispatcher: no separate
dispatcher is running), then run the deploy that produces the data-unified release. Deploy is Scott's call
and he has made it.
