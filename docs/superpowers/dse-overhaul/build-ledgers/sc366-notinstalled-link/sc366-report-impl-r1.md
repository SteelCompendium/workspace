# SC-366 implementer report, round 1

## Executive summary
- Verdict: DONE. One commit on dse branch `sc366-notinstalled-link`: `365b08b` (base `develop` 188755b, unmoved on fetch). Not pushed.
- Change: `.dse-ref-web-card__link` added to the steel, not-print `.dse-card a` colour family, base rule and `:hover` rule (styles-source.css, +7/-2 incl. a 3-line comment note).
- Link colour, dark scheme: BEFORE rgb(166,138,249) host purple-blue link; AFTER rgb(77,184,199) = `--dse-accent` #4db8c7 teal-cyan accent. Hover after: same teal-cyan, underline kept.
- Link colour, light scheme: BEFORE rgb(138,92,245) host purple-blue link; AFTER rgb(42,123,136) = `--dse-accent` #2a7b88 darker teal-cyan accent. Hover after: same.
- SC-317 arrow: follows the link colour (::after background-color computes equal to the link colour, both schemes).
- Print: link colour unchanged (UA blue rgb(0,0,238) in the preview twin, no sheet); print crops byte-identical before/after (md5).
- Gates: tsc+lint clean; jest 5257 passed / 1 skipped / 229 of 230 suites; lifecycle 27/27; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572 PNGs, 0 FAIL; freeze OK 276/276 (zero frozen shots moved, no rebaseline.txt needed); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- No test added: no existing test pins this colour family's selectors (only `headingEmphasisLinkHostRegrounding.test.ts` mentions it in prose, asserting colour is NOT restated in GROUP 5).

## Details
### Edit
`styles-source.css` ~8893: appended
`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-ref-web-card__link` to both the base selector list and the `:hover` list (identical gating to `.dse-card a`), plus a short SC-366 note in the existing family comment. `styles.css` is an untracked build artifact (`git ls-files` = 0); no token map or duplicate to update.

### Evidence (no existing shot of this card)
The card is not in the harness fixture set (grep `ref-web-card` / not-installed finds only tests and RefUnwrapView; the harness never wires a real SccAnchorResolver). So I rendered it with a scratch script that loads the harness perk page (`theme=steel`, `sheet=1` real Obsidian app.css, `bg=dark|light`, 2x scale) and injects DOM mirroring `RefUnwrapView.webCard` verbatim (same classes/attrs) into the mounted `[data-dse-element]` root, then crops to the card. Scratch script is not committed (scratchpad `sc366-impl-r1-a7f3/shoot-card.mjs`).

Computed `color` of `a.dse-ref-web-card__link` (full JSON in the `-computed.json` files):

| scheme | before | after | token |
|---|---|---|---|
| dark | rgb(166,138,249) host purple-blue link | rgb(77,184,199) teal-cyan accent | --dse-accent #4db8c7 |
| light | rgb(138,92,245) host purple-blue link | rgb(42,123,136) teal-cyan accent (darker) | --dse-accent #2a7b88 |
| dark hover | rgb(197,182,252) lighter purple-blue | rgb(77,184,199) | same |
| light hover | rgb(166,138,249) | rgb(42,123,136) | same |
| print twin (both bg) | rgb(0,0,238) UA blue | rgb(0,0,238) UA blue, unchanged | n/a |

Other card text unchanged: message rgb(218,218,218)/rgb(34,34,34), hint rgb(179,179,179)/rgb(92,92,92), left border blue rgb(2,122,255)/rgb(8,109,221).

Files, all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/:
- sc366-compare-dark.png, sc366-compare-light.png (before on top, after below, 2x)
- sc366-before-{dark,light}.png, sc366-after-{dark,light}.png; `-hover` variants; `-print` variants (before/after byte-identical)
- sc366-before-computed.json, sc366-after-computed.json
- Gate logs: sc366-gate-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log

### Freeze
Freeze OK (276/276): no frozen print shot moved, so no rebaseline.txt. (Consistent with the card being in no fixture.)

Drive-by fixes: none.
Follow-ups: (1) the harness has no fixture/shot for the `.dse-ref-web-card` (nor `renderRefNotice`) card, so this visual change is unpinned by any shot; a fixture would need a faked compendium+sccAnchors in entry.ts. Left alone. (2) `docs/Media`/docs-manifest deliberately never shoots the not-installed card.
