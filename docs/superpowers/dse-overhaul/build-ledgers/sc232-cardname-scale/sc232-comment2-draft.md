**Ask: please reply with three things:**

1. **Name size:** A, B or "leave".
2. **Header slots:** OK, or what's wrong.
3. **Print:** the word "sanctioned", to accept 78 print-snapshot changes.

You were right that more was going on. The plugin's card headers were leaving empty the slots that the site fills. The data was almost always already in the plugin; the header code just never used it. This branch fills them to match the site.

**1. Name size.** The first image shows one row per card family. The columns are **Before (today's plugin)**, **This branch (Option A)**, **Option B** and **Site**, all at the same scale. The Option B column is drawn on today's headers, so it shows only the size.

- **Option A** matches the site in each family: 27px for kits, traits and sub-features, 28.8px for projects, 33.3px for ability cards, 37.8px for featureblocks and 41.4px for statblocks. This is what the branch does.
- **Option B** is one shared 27px.
- **"Leave"** keeps today's 20px.

Under both A and B, card headers 480px wide or narrower keep today's 20px, so narrow panes don't wrap any worse.

For SC-235 you chose to match the site's *visible letter height* rather than its pixel number. By that same rule, names would be about 6% larger than A, because the plugin's font has shorter capitals than the site's. A is already close. Say "A plus 6%" if you want them to match exactly.

{{IMG:sc232-names.png}}

**2. Header slots.** The second image has the columns **Before**, **This branch** and **Site**. These are the slots the branch fills.

- **The line under the name:**
  - trait: ancestry, class or kit ("Human" on Determination)
  - ability: class ("Tactician")
  - class feature: class ("Fury")
  - hand-written kit signature: kit ("Panther")
  - statblock: keywords ("Human, Humanoid")
- **The small label above the name:**
  - class features read "Feature" instead of "Trait"
  - featureblocks read their kind ("Malice")
  - statblocks read "Monster", "Retainer" or "Summon", instead of the keywords
- **Right side:**
  - "Level N" at the top
  - the cost ("5 Malice"), or "Signature", beside the name
  - on standalone abilities and kit signatures only, the action type ("Main Action", "Maneuver") below it
  - statblock abilities keep their action type in the body, as on the site
  - "Signature Ability" now reads "Signature"
- **Pasted cards:** a card pasted from the compendium keeps these fields, so it matches its synced original.

{{IMG:sc232-slots.png}}

**3. Print sanction.** The new slots also print, so 78 of the 260 frozen print snapshots change, across 39 capture ids. The third image shows printed headers before and after, one row per change, labelled with the capture id. Nothing overlaps or gets clipped. The dispatcher applies the new snapshots only after you reply "sanctioned".

{{IMG:sc232-print.png}}

**Still missing, each filed in Backlog:**

- **SC-367:** crest, eyebrow and right-side title sizes, plus the small icon on statblock sub-features.
- **SC-368:** name colour.
- **SC-370:** companion statblocks such as Bear render no card.
- **SC-371:** class book chip.
- **SC-373:** summoner origin lines.
- **SC-374:** dynamic-terrain and fixture featureblock chips.
- **SC-375:** a *synced* kit's signature ability has no kit name under it, because the data doesn't carry it yet. This needs a steel-etl change.

---

Mechanics:

- Branch `sc232-cardname-scale`, dse `9ded832` on `develop` `dfb7395`.
- Gates: tsc and lint clean. jest 4218 passed / 1 skipped. Obsidian lifecycle 19/19. Shots 544, 0 fail. Parity: 0 gaps, 0 undeclared, 24 declared. Freeze: the only failures are exactly the 78 lines below. With them applied, freeze reads 262/262.
- `rebaseline.txt`: 78 lines. It is deterministic across two full runs, and the reviewer reproduced it independently. `rebaseline-map.md` gives the reason for each line.
- The parity gate now sees the card name through per-family pairs. It reads 24 declared: develop's 14, plus the 10 name-colour rows parked under SC-368.
- Two independent review passes: the last one returned land-ready.
