# SC-638 — proposed dse-verify SKILL.md text (owner does not edit SKILL.md; dispatcher applies at landing)

Numbers on dse `afd1436c` + SC-638 (`12aaf5b5`):

- Step 3 jest: `13032 passed / 2 skipped` fresh after SC-638 (+110 on `afd1436c`'s 12922: `negotiation-wrong-types`
  unit + jsdom, plus the restoreUsed / summary rows); 13033 / 1 with the shots cache.
- Step 4b e2e CURRENT: `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs`, since SC-638 (+6 ok, +4 total:
  NEGO-W08..W11 new; NEGO-W02 and NEGO-W03 are plain tests; no new pair). Drop SC-638 from the known-bug list
  (SC-639, SC-640, SC-641, SC-642, SC-648, SC-649 remain from the negotiation set).
- Lifecycle unchanged, 64/64.

New e2e authoring footguns (SC-638), for the "Lifecycle and e2e notes" list:

- A block refused at parse is an error card with no registry entry. `openNote(rel)` waits for a drawn view and times
  out on an error card; a test that EXPECTS an error card opts in with `openNote(rel, { errorCard: true })` (only
  NEGO-W08, W09, W11 do). Never make it the default: with acceptance on for every caller, a block that regressed to an
  error card left a negative-only test green (SC-638 r2 review).
- `dse.click(el)` records a coverage pair even for a non-control; a click on a node with no manifest id (an error-card
  root) must use the raw wdio `el.click()`, or the coverage gate fails with `selector:[object Promise] x click`.
- Negotiation model (SC-638): text fields read numbers / booleans as text and write untouched ones back with their
  typed value (a module-private snapshot, matched per text for `motivationsUsed` / `pitfallsUsed`); wrong-shaped
  structure throws `Invalid data: …` at parse (encounter form); one shared `NegotiationData.standingOf` reads a
  standing for the seal, the ending and the chrome summary. SC-628 (montage twin) will need the same `openNote` opt-in.
