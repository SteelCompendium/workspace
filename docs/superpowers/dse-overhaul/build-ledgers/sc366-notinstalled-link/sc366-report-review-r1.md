# SC-366 independent review, round 1

## Executive summary
- Verdict: **APPROVE**. dse `365b08b` (branch sc366-notinstalled-link, base develop 188755b, origin/develop still 188755b). Findings: 0 HIGH / 0 MED / 2 LOW (both non-blocking) / 4 INFO.
- Diff is selector-only: `.dse-ref-web-card__link` added to the steel, not-print `.dse-card a` family base list and `:hover` list (styles-source.css:8901, :8909), plus a 3-line comment. Gating matches the family exactly.
- Runtime probe: built the card with the same `createDiv`/`createEl` calls as `RefUnwrapView.webCard` (RefUnwrapView.ts:358-374), under three ancestor shapes (bare root, Reading view, Live Preview), with the pinned Obsidian 1.13.7 sheet and the installed 1.14.4 sheet. That is 48 combos. In every screen combo, AFTER link colour = the `.dse-card a` family colour in the same context, at rest and on hover. Dark: rgb(77,184,199), `--dse-accent` #4db8c7. Light: rgb(42,123,136), #2a7b88. Both are teal-cyan.
- BEFORE was the host link colour. Dark: rgb(166,138,249) at rest, rgb(197,182,252) on hover. Light: rgb(138,92,245) at rest, rgb(166,138,249) on hover. Both are purple-blue.
- The SC-317 arrow (`::after` background-color) equals the link colour in every screen combo, at rest and on hover.
- Print (`data-dse-print="on"`, real sheet on): link, family link and arrow are unchanged from before to after. Crops are byte-identical (md5).
- The notice card's other parts are unchanged: msg, cta, left border and background.
- Specificity: no rule in either real Obsidian sheet beats the new selector. Of the rules that set `color` on the link and match it, the host's strongest are `a` and `.external-link`, and `.external-link:hover` at (0,2,0). The new selector is (0,3,0) at rest and (0,4,0) on hover.
- Gates (measured by me at 365b08b): tsc+lint clean; jest 5257 passed / 1 skipped / 229 of 230; lifecycle 27/27 ok (port 9367); e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 pairs; shots 572 PNGs, 0 FAIL (button host-leak 112/672); freeze OK 276/276 (no frozen shot moved, no rebaseline needed); parity 0 gaps / 0 undeclared / 24 declared.
- Follow-up verdict: **yes, file a Backlog ticket at low priority** for a harness fixture covering the ds-scc degrade cards (see the "Follow-up judgment" section).

## Gates (reviewer-run, exit codes read through a script file)
| gate | result | log |
|---|---|---|
| tsc (incl. -p e2e) | clean, RC 0 | scratch `r-tsc.log` |
| lint (incl. e2e/) | clean, RC 0 | `r-lint.log` |
| jest | 5257 passed / 1 skipped / 229 of 230 suites, RC 0 (load 2.7) | `r-jest.log` |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`, RC 0 | `r-lifecycle.log` |
| e2e | `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, RC 0 | `r-e2e.log` |
| shots | 572 PNGs, 0 FAIL lines; host-copy pin OK (1.14.4); inline host-leak OK (1134); button host-leak OK 112/672 | `r-shots.log` |
| freeze | `freeze OK (276/276 …)` | `r-freeze.log` |
| parity (last) | 0 gaps, 0 undeclared, 24 declared, RC 0 | `r-parity.log` |

The log directory is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-review-r1-q9k2/`.

No screen shot can move. The two added selector parts match only an element with class `dse-ref-web-card__link`. No harness fixture renders that class (`entry.ts:1924-1929`: no `cx.compendium` and no scc fixture), and the selectors carry no `:has()` or sibling combinator. So the 572 shots cannot have been reached. The byte-identical freeze run confirms this for print.

## Probe method (and the implementer's script fidelity)
- The implementer's `sc366-impl-r1-a7f3/shoot-card.mjs` faithfully reproduces `webCard`'s DOM: same classes, `data-scc`, text, `href`, `target` and `rel`. Like `rootEl.empty()` (RefUnwrapView.ts:138), it puts the card directly under an emptied `[data-dse-element]` root that carries `data-dse-theme="steel"`. It builds the DOM with innerHTML rather than `createDiv`/`createEl`, but the resulting DOM is the same.
- One gap in that script: its print variant ran with the real sheet OFF (`print:'1'` without `sheet:'1'`), so it shows the browser-default blue rgb(0,0,238). The harness's real print-preview twin runs with the sheet ON (entry.ts:1145, SC-202 r6c), and there the link is the host purple-blue rgb(138,92,245). The conclusion still holds, because print is unchanged in both configurations (see INFO-2).
- My probe (`sc366-review-r1-probe.mjs`) differs from the implementer's in five ways:
  - It calls the real Obsidian-shim `createDiv`/`createEl` with webCard's exact arguments.
  - It wraps the root in Reading-view ancestors (`.markdown-preview-view.markdown-rendered > … > .block-language-ds-scc`) and Live-Preview ancestors (`.markdown-source-view.mod-cm6.is-live-preview … .cm-preview-code-block.cm-embed-block.markdown-rendered`).
  - It runs against both the pinned 1.13.7 sheet and the 1.14.4 `app.css` extracted from `~/.config/obsidian/obsidian-1.14.4.asar`.
  - It derives BEFORE by removing the two SC-366 selector parts through CSSOM, and it hard-fails unless exactly 2 rules were rewritten.
  - It uses CDP `CSS.forcePseudoState` for hover, and it lists every matching rule that sets `color` on the link.
- I did not open a real Obsidian window. No e2e or lifecycle fixture can produce `kind:'web'`: that needs a vault whose `SccResolver` falls through to `sccWebFallback` (src/refs/SccResolver.ts:107-110). Instead, the cascade evidence uses both real host sheets plus the real ancestor shapes, which is what decides the colour.

## Findings

### LOW-1: the new selector is one type selector below the family's specificity
- **Where:** styles-source.css:8901 and :8909.
- **What:** `.dse-card a` is (0,3,1) at rest and (0,4,1) on hover. `.dse-ref-web-card__link` is (0,3,0) at rest and (0,4,0) on hover. So the gating mirrors the family, but the specificity does not quite.
- **Failure scenario:** a community theme or CSS snippet with a link rule between (0,3,0) and (0,3,1), for example `.markdown-rendered .block-language-ds-scc a.external-link`. Such a rule beats the not-installed link but only ties the family links, and the family wins the tie because the plugin sheet loads after themes and snippets. One link in a plugin card would then drift back to the host colour, which is exactly the inconsistency SC-366 exists to remove.
- **Why it is not live today:** neither real Obsidian sheet has such a rule. The host's strongest matching rule is (0,2,0).
- **Fix (optional, one token each):** write `a.dse-ref-web-card__link` and `a.dse-ref-web-card__link:hover`. That is the same element and reaches the family's exact specificity. Moves no shot.

### LOW-2: the evidence crops have no labels, and Scott is colourblind
- **What:** `sc366-compare-{dark,light}.png` stack BEFORE above AFTER with no text label. The only difference is purple-blue against teal-cyan, which is the axis docs/working-preferences.md:36-48 says he cannot rely on ("Blue-vs-purple contrasts specifically should never carry meaning alone").
- **Fix:** post the labelled versions I produced, `sc366-review-r1-compare-{dark,light}.png`. Each has three rows (BEFORE, AFTER, AFTER hovered) labelled in words with the colour names and shas, rendered under the 1.14.4 sheet in the Reading-view shape. Also say in prose that the AFTER teal-cyan is lighter than the purple-blue in dark mode and darker in light mode, so the change also reads as a brightness difference.

### INFO-1: hover now gives no visual change
- AFTER hover equals AFTER rest: same teal-cyan, and the link is already underlined at rest. The implementer's after-dark and after-dark-hover PNGs are md5-identical.
- BEFORE, hover lightened the host purple-blue.
- This matches every other `.dse-card a` link exactly, so it follows the ledger ruling ("Must mirror … its :hover rule"). Mention it to Scott only if he asks why hover feels inert.

### INFO-2: print is untouched
- With the sheet on (the real print-twin configuration), the link and a `.dse-card a` reference link are both host purple-blue rgb(138,92,245), with rgb(166,138,249) on hover, before and after.
- The SC-317 `::after` glyph is not drawn in print (transparent, no mask) before and after. That is existing SC-317 behaviour, not this diff.
- My print crops are md5-identical before and after in both schemes, and so are the implementer's.

### INFO-3: contrast improves in both schemes
WCAG ratios on the card background:
- Dark: 5.35 before, 6.32 after.
- Light: 3.94 before, 4.53 after. The light link now passes AA (4.5:1) for body text.

### INFO-4: older comment drift, not in this diff
The GROUP 5 / GROUP 7 comments (styles-source.css:18680-18682, 19026, 19057) still cite the family at "~7965" and "(0,4,1)". The family is now at ~8893 and is (0,3,1) at rest. This is not this diff's to fix.

## Follow-up judgment (implementer's follow-up 1)
**Worth a Backlog ticket, low priority, scoped to both ds-scc degrade cards** (`.dse-ref-web-card` and `renderRefNotice`).
- **Why:**
  - Today nothing guards SC-366's CSS. Jest pins the link's classes (refUnwrapView.test.ts:245-252) but not the selector. Deleting the `.dse-ref-web-card__link` selector part would pass every gate.
  - If the card were in the harness, the existing `inline host-leak` sweep would catch exactly this regression with no new gate code. That sweep already samples `color` on every `[data-dse-element] a`, at rest and on hover, with and without the real `app.css` (shoot.mjs `LINK_REST_PROPS`/`LINK_HOVER_PROPS`). Before the fix, that sweep would have gone red (browser-default blue vs host purple-blue).
  - It would also add a frozen print shot for a card that currently has none.
- **Cost:**
  - A stub compendium (`available: true`) plus an `sccAnchors` stub returning `web` in `visual-harness/entry.ts`.
  - An explicit allowance in `mountFromParams`, which currently counts any error/notice card as a failed shot (entry.ts:1924-1929).
  - New shot ids, which means a freeze-widening file (additions only).
- **Cheaper alternative if the ticket is declined:** a jest source-text contract asserting that `.dse-ref-web-card__link` appears in both family selector lists (same pattern as `headingEmphasisLinkHostRegrounding.test.ts`). It pins the selector but not the cascade.

## Tree hygiene
- Before and after the review: dse `git status --porcelain` empty, and HEAD is 365b08b.
- The superproject shows ` M draw-steel-elements` at both points: the branch pointer is ahead of the superproject pin, and that state existed before the review.
- No `main.js` or `styles.css` at the plugin root before or after.
- I made no edits in the worktree.
