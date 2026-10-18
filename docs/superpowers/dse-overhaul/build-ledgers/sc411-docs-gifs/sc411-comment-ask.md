**Ask:** look at the seven generated GIFs below and approve them, plus the three choices under them. Approving lets me land SC-411 on `develop` (no tag, no release).

## What you're approving

1. **The seven GIFs as they look.** `npm run docs-shots` now produces each one from a script; none is recorded by hand. Initiative and negotiation replace the two stale hand-recorded GIFs; the other five are new.
2. **Steel-dark for every docs GIF**, the same theme the docs stills already use.
3. **Which interactions get a GIF.** Five items on the ticket's list are deferred in 7.0.0, and SC-407 keeps deferred elements out of the docs. So:
   - "power roll" is shown with **feature-card rolling**;
   - "conditions" is shown with the **initiative tracker's conditions modal**;
   - encounter + sidebar, party, surges, `ds-roll` and `ds-conditions` get no GIF until they un-defer (parked in **SC-414**).
4. **The white arrow cursor stays on.** It shows where each click lands. Turning it off for one GIF, or for all of them, is one setting.

**Approve:** I land the branch, and SC-388 (the hand re-record ticket) closes as a duplicate of this one.
**Decline or change something:** tell me which GIF and what to change. Each GIF is a short script in `visual-harness/docs-manifest.mjs`, so a change is a re-run, not a re-recording.

**One thing you will notice in the initiative GIF.** After the Malice "Add" click, both acted heroes' portraits gain a thin light-grey frame they didn't have a moment earlier. That is a real plugin bug: the frame only appears after a full redraw of the tracker, not right after you click the portrait. It's filed as **SC-423** (DSE 7.0.0 Backlog). The GIF shows the plugin as it behaves today and will update itself the next time docs-shots runs after the fix.

### Initiative tracker — before (hand-recorded, pre-SC-377 layout, 1.1 MB)
{{IMG:before-initiative-tracker.gif}}

### Initiative tracker — after (generated, 570 KB)
Edits the title, marks Frodo and Sam as acted, raises Malice twice, adds a "Villain action" Malice entry of 3, then advances to round 2.
{{IMG:after-initiative-tracker.gif}}

### Negotiation tracker — before (hand-recorded, pre-SC-379 look, 518 KB)
{{IMG:before-negotiation.gif}}

### Negotiation tracker — after (generated, 884 KB)
Picks the Higher Authority motivation, chooses the 12–16 tier, completes the argument (Interest rises to 4, Patience drops to 2), sets Patience back to 4, marks Peace spent, then flips to the "Learn Motivation/Pitfall" tab and back.
{{IMG:after-negotiation.gif}}

### Counter (new, 40 KB)
Steps Health up three times and down once, then types 17.
{{IMG:after-counter.gif}}

### Feature-card rolling (new, 384 KB)
With rolling turned on in settings: rolls, rolls again, then clicks a tier row. The dice are seeded, so every regeneration shows the same rolls.
{{IMG:after-feature-roll.gif}}

### Stamina bar + stamina modal (new, captured in real Obsidian, 120 KB)
{{IMG:after-stamina-bar.gif}}

### Montage + "Log an action…" sheet (new, real Obsidian, 641 KB)
{{IMG:after-montage.gif}}

### Initiative conditions modal (new, real Obsidian, 717 KB)
Opens Frodo's conditions, searches "Ble", adds Bleeding, closes; the droplet icon appears on Frodo's row.
{{IMG:after-initiative-tracker-conditions.gif}}

---

<details>
<summary>Mechanics (for the record)</summary>

- **Branch:** dse `sc411-docs-gifs` @ `b3be096`, rebased on `develop` `be4f002`. Superproject branch `b53caba` adds one footgun line to `PROJECT.md`.
- **Encoder:** `gifenc@1.0.3` + `pngjs@7.0.0`, exact-pinned devDependencies. They use one shared palette and only re-send pixels that changed. The plugin's `devbox.json` now carries `nodejs@24`, so a fresh clone + devbox runs `docs-shots`. The independent reviewer proved this from a scratch clone, which reproduced two GIFs byte-for-byte.
- **Repeatable output:** two runs give byte-identical GIFs. `npm run docs-shots -- --only=<name>.gif --check-stable` captures twice and fails loudly on any difference. The reviewer broke determinism on purpose and saw it fail.
- **Gates unchanged:** jest 4492 / 1 skipped / 0 fail; shots 568 / 0 FAIL; freeze 274/274; parity 0 GAPs / 0 undeclared / 24 declared. Nothing in the plugin's own code (`src/`, `main.ts`) changed. A full `docs-shots` changes only the GIFs and writes nothing to `visual-harness/shots/`.
- **Docs:** each element page references its GIF, and the README shows the initiative one. The README / visual-harness passages saying the GIFs are recorded by hand are gone. The release audit's SC-388 notes now point here, and the CHANGELOG has a 7.0.0 bullet.
- **Filed along the way:**
  - SC-414: GIFs for the deferred elements.
  - SC-423: the portrait-frame bug.
  - SC-424: an older docs still, `tutorial-source-mode.png`, that isn't byte-stable between runs.

</details>
