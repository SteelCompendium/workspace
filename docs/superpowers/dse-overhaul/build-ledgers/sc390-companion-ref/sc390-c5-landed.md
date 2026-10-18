**Landed. One action left for you: publish data-sdk-npm 3.1.0 so the plugin can pin it.**

From the main checkout, with npm auth ready:

```
cd /home/scott/code/steelCompendium/workspace/data-sdk-npm && git checkout v3 && git pull --ff-only
devbox run -- just release 3.1.0
```

The recipe checks npm auth, makes the version commit, runs `npm publish`, and pushes `v3`. No tags. When npm shows 3.1.0, say so here and I dispatch the last small round: the plugin's pin bump (`package.json` + lock only) plus the battery, then SC-390 can close. Nothing waits on this except that pin. The plugin on `develop` already renders the Panther on the 3.0.1 pin.

**What landed today (2026-10-18)**

- steel-etl `main` 1b57338: the 14 beastheart companions are `type: statblock` with structured stats and a `ds-sb` block in md-dse; website output byte-identical.
- data-sdk-npm `v3` c63cda2: schema widened (`free_strike` text, optional `skills`), types, reader/writer Skills row, regression test; version 3.1.0 unpublished.
- v2 `main` e95d2dc: `site.yaml` drops the dead feature-group include.
- draw-steel-elements `develop` 135716d: `ds-scc` companion refs render the statblock card, Skills cell, empty-EV chip omitted, docs honesty line.
- workspace `main` 3e0e526 (merge) + 19969db (ledger preserved under `docs/superpowers/dse-overhaul/build-ledgers/sc390-companion-ref*`).

The freeze baseline is applied per your sanction: backup `freeze-baseline.sha256.pre-sc390-bak`, 2 lines replaced + 2 appended, and `check-freeze.sh` against the landed tree reads `freeze OK (276/276)`. The record is in dse-verify's SKILL.md.

Not deployed. `just deploy` is yours when you want the data and site live; the Panther appears in Obsidian after that deploy and a compendium re-sync.

Left as is: the "COMPANION" role chip next to the "Companion" eyebrow on the card (you did not ask for it suppressed). Follow-up tickets from this effort: SC-391, SC-392, SC-393, SC-394, SC-412, SC-413, SC-415.
