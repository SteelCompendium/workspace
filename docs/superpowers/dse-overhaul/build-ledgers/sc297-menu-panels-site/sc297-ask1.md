**Ask: look at the prototype below and answer the seven questions — then the panel rolls out to every card.**

The floating buttons at the top of a card (copy link, pin, add to encounter, MD/PNG export) move into the same plate the DSE plugin uses: a short icon-only tab seated on the card's top-right corner, outside the card, hidden until you hover or tab into the card. Same rules as the plugin panel — right edge 10px inside the card frame, bottom edge resting on the card's top border, hairline crown, tucked behind the card. The card head is clean again; today the buttons sit on top of the card name.

Prototype is on the statblock and the ability card only. Everything else still has the old strip until you answer Q1.

## What you're deciding

Each has my recommendation first. "Agree with all" is a complete answer.

1. **Which cards get the panel.** Recommend **all five** families that carry buttons today: statblock, featureblock, ability, trait, kit. Doing two of five leaves three cards with the old strip.
2. **Collapse toggle.** The plugin's rightmost control folds the element to one line. Recommend **no** on the site: a card page is one card, so collapsing it leaves a blank page. Can be added later without moving anything.
3. **Plain pages.** Non-card pages (Read chapters, indexes) have an always-visible page-link + pin cluster top-right (`.sc-pageact`). Recommend **leave as is**: the plate's look depends on sitting on a card edge, and a plain page has none.
4. **Cards embedded inside Read chapters.** Recommend **card pages only** for now. Embedded cards have no per-card permalink on the page today, so a per-card panel there is a pipeline change. Related: two live bugs found in the survey get fixed in the rollout regardless — on a Read chapter with many statblocks, the "add to encounter" chip currently appears on whichever creature is printed first, and the copy-link on an embedded card copies the chapter's link, not the card's.
5. **Ability card corner clipping.** The ability card clips anything drawn outside its box, which would cut the plate off. The prototype turns that clipping off for cards carrying a panel and lets the card draw its own rounded corners. The visible difference is a fraction of a pixel at the corner — both crops below. Recommend **yes**; the alternative wraps the card in a new element and breaks four places that rely on the card being a direct child of the page.
6. **Hover lift.** The ability card already rises 2px on hover; the plate rises with it, so they read as one object. The plugin's panel does not move. Recommend **keep the lift**.
7. **Level scaler.** The statblock's −/+ steppers stay inside the Level chip (the boxed buttons left of "LEVEL 3" in the statblock shot). With the strip gone they are the only hover-revealed control left inside the card head. Recommend **leave for now**, but this is the one to look at with fresh eyes: does it read as an orphan?

Agree = round 2 rolls the panel out per your answers, fixes the two Read-chapter bugs, updates DESIGN.md and the changelog, then goes to independent review. Change anything = say what; one more prototype round before rollout.

## Before

Ability card, dark scheme, hovered — the pin button sits on the "H" of DRAGON BREATH:
{{IMG:sc297-r1-ability-dark-before-hover.png}}

Statblock, dark scheme, hovered — the strip floating in the head band:
{{IMG:sc297-r1-statblock-dark-before-hover.png}}

## After (prototype)

Statblock, dark scheme, hovered — the plate on the top-right corner; head band clean; the −/+ steppers of Q7 are the boxed buttons left of LEVEL 3:
{{IMG:sc297-r1-statblock-dark-after-hover.png}}

Ability card, dark scheme, hovered:
{{IMG:sc297-r1-ability-dark-after-hover.png}}

Statblock, light scheme, hovered — light retune: white hairline on the plate's lip, lighter cast shadow:
{{IMG:sc297-r1-statblock-light-after-hover.png}}

Corner join, light scheme, tight crop — the card's own grey border runs unbroken under the plate; the plate's bottom edge is the card's top edge:
{{IMG:sc297-r1-ability-light-after-join.png}}

Phone width (375px), dark — panel always visible, card reserves space above so nothing is covered:
{{IMG:sc297-r1-statblock-dark-after-phone.png}}

Q5 crops, ability card corner, dark. First image: clipping relaxed (the prototype). Second image: clipped (today's behaviour):
{{IMG:sc297-r1-ability-dark-after-cornerAB-relaxed.png}}
{{IMG:sc297-r1-ability-dark-after-cornerAB-clipped.png}}

At rest (no hover) the card is unchanged; print output is unchanged (panel absent). Those shots are in the ledger dir if you want them.

## For the record

- Worktree `sc297-menu-panels-site`; `v2` @ `7613cbc879`. New `docs/javascripts/sc-chrome.js` + `docs/stylesheets/steel-chrome.css`; consumers `scc-card-copy.js`, `sc-pins.js`, `sc-encounter.js`, `sc-export.js` now mount into the shared plate; `mkdocs.yml` loads both.
- Gates: v2 unit 78/78 before and after. e2e 6/8 — the two failures (`featureblock-fixture`, `settings-panel`) fail identically against the live site and predate this work. New measured geometry gate: 53/53 (right gap 10.00px, bottom delta 0.00px, both families, both schemes, desktop + phone + print).
- Full survey, token mapping and file-by-file rollout plan: `.superpowers/sdd/sc297-menu-panels-site/sc297-round1-port-spec.md` (machine-local).
