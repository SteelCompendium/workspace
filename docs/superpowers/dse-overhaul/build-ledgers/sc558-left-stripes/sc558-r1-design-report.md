# SC-558 r1 — design report: every coloured left stripe in DSE, and what replaces it

## Executive summary

- **Found 6 in-scope stripes in 4 groups**, all on dse `248e202b`: error card (3px, stage hue); statblock role spine (3px — **dead code, never paints**); featureblock advancement rail (2px, role hue); power-roll tier rows + the montage "Test tiers" strip (3px, tier hue); the action-type spine on feature cards (3px `::before`, action hue). The sticky-chars rule is a 1px neutral divider: **out of scope** (confirmed).
- **Every stripe repeats something a non-hue channel already says** (the error stage in the title's words, the role word in the head, the tier badge's text and shape, the action crest's glyph shape and the usage text). The greyscale sheet shows the stripes carry nothing once hue is gone. So "A — remove" is viable everywhere.
- **Recommended:** error card **A** (remove) · statblock spine **A** (delete dead rule, 0 px) · advancement rail **A** (remove) · tier rows + montage **A** (remove the stripe, keep the wash and badge) · action spine **A** (remove).
- **Cost of the recommended set (measured on a scratch copy):** frozen print **70 of 280 lines move (35 ids × print + realprint), all from the action-spine removal (+ the advancement rail on 1 of those ids)**; `npm run shots` rc 0, every in-run gate green (592 shots); `npm run parity` **0 GAPs / 0 undeclared / 24 DECLARED** (unchanged).
- **Questions for Scott (batch):** Q1 the picks · Q2 sanction the print rebaseline for the action-spine removal (statblock/featureblock/kit print bytes) · Q3 does the v2 site follow (it ships the same tier stripe and action spine), or does DSE diverge with a declared note? · Q4 error-card severity: is the stage in words enough, or does he want B's banner colour? · Q5 sequencing with SC-349's print rebaseline · Q6 (adjacent) Obsidian's own violet blockquote edge in print.

Composites (all in `sc558-r1-crops/`): `sc558-r1-errorcard.png`, `sc558-r1-role.png`, `sc558-r1-tier.png`, `sc558-r1-act.png`, `sc558-r1-sticky-chars.png`, `sc558-r1-greyscale.png`, plus `sc558-r1-adjacent-print-blockquote.png`.

## 1. Method (what was executed)

- Worktree `/home/scott/code/steelCompendium/worktrees/sc558-left-stripes`, dse HEAD `248e202b`, `git status --porcelain` empty before and after (dse and superproject). No commits, no edits to the worktree.
- Baseline `npm run shots` on the worktree: rc 0, 592 shots; `check-freeze.sh`: **280/280 OK**.
- **Computed-style survey, not a grep:** a Playwright probe (`probe-stripes.mjs`) loaded every harness element × fixture plus every `PREF_SHOTS` variant (100 pages) in steel-dark and the print twin, and recorded every element whose computed `border-left` is ≥1px and differs from its other sides, every left `inset` box-shadow, every `::before`/`::after` that is absolutely positioned and ≤6px wide, and every 90° gradient. That is how the dead statblock rule was caught: a CSS grep finds it, the rendered DOM never shows it.
- Candidates were rendered by injecting each candidate's CSS (`sc558-r1-cand-*.css`) as a late `<style>` into the harness page (same selectors, later in source order). The recommended set was then measured for real on a scratch copy of the plugin (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc558-r1-opusdesign/dsecopy/draw-steel-elements`, `node_modules` symlinked) with `styles-source.css` edited in place: full `npm run shots`, `check-freeze.sh` and `npm run parity` (§4a).

## 2. Survey

### 2a. In-scope stripes

| # | Selector · file:line (`styles-source.css`) | Width / colour | Means | Already said by (rendered DOM) | Fixtures that show it | Print (frozen)? | v2 site | Parity |
|---|---|---|---|---|---|---|---|---|
| 1 | `.dse-error-card` :416; stage colours :458-465 | 3px; red `--text-error` (render), orange `--color-orange` (parse, schema), blue `--color-blue` (reference) | state: failure stage | title text "`<Element>: failed to render (<stage>)`" (`errorCard.ts:59,73`); title is always red | **none** — the harness treats any error card as a failed mount (`entry.ts:2577`), so no shot ever shows one | base rule, unscoped; an error-card root has no `data-dse-theme` (`pipeline.ts:510-521`); 0 frozen ids contain one | no error card | not mapped |
| 2 | `.dse-sb[data-dse-role]` :3037-3039 | 3px `--dse-role` | category: combat role | **never paints.** `[data-dse-theme='steel'] .dse-sb { border: 1px solid var(--dse-border) }` (:7536-7556) has the same specificity (0,2,0) and comes later, so it wins in every combo; computed `border-left` = `1px` neutral, equal to the other sides, on 100 pages × 3 combos. Role is in the head's right-rail word ("LEADER"), the role-tinted head band and the ◆ notch | n/a (0 pixels) | n/a | no statblock left border (site carries role on the head band) | `statblock` pair does not compare border-left |
| 3 | `.dse-fb__band--adv` :3550-3554 (base 2px `--dse-role, --dse-rule`); Steel colour :10526-10528 | 2px role hue (grey `--dse-role-leader` on the fixture; pink, blue, … on a role-tinted block) | grouping (this run of options is "Level N") + role hue | "Level N Advancement" head strip (`featureblock/view.ts:196`); role in the featureblock head | `featureblock-advancement` | **yes** — prints grey; 1 frozen id (2 lines) | **different**: site has no rail, it draws a 1px role@30% rule across the TOP and a role-ink uppercase label (v2 `steel-featureblock.css:202-221`) | not mapped |
| 4 | `.dse-pr__row` :9986 (Steel screen); wash :9996-10010; also `button.dse-pr__row` (negotiation) | 3px `--t` = `--dse-tier-low/mid/high/crit` (red / amber / green / gold) | category: tier | badge **text** (≤11 / 12–16 / 17+ / crit) and badge **silhouette** (t1 notched left, t2 plain, t3 notched right, crit notched right with a doubled inner edge — clip-paths :15375-15410) | 27 pages: feature, feature-spend, featureblock, kit, negotiation(+checked/ended), roll, statblock + 17 statblock variants, featureblock-featstyle-flat | **no** — Steel-screen scoped; 0 frozen bytes | **same stripe**: v2 `steel-ability-cards.css:167` | `tier-row` pair owns `bg` (site wash non-flat), `hairline-top`, padding, type — **border-left is not compared**, so removing it opens no GAP; removing the WASH would (material, undeclarable) |
| 5 | `.dse-mt__tier-row` :5283 (nested under `[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"]) .dse-mt`, :4565) | 3px `--t` | category: tier | same badge (`StripView.ts:107 tierBadge`) | `montage-strip-pinned` (interaction shot; the strip is collapsed at rest) | **no** — screen only | no montage on site | not mapped |
| 6 | `.dse-feature[data-dse-act]::before` :72-80 (3px, `left:0`); lanes :7075 (`calc(3px + .55em)`), :7174-7180 (framed card), :7242-7248 (SC-168 standalone arm); print exact-colour :15961, :16018; hidden on standalone top level :7100 and in flat mode :7299, :7322 | 3px `--dse-act-*` (main red, maneuver blue, triggered green, move orange, none grey, trait purple, villain red) | category: action type | crest **glyph shape** per action (sword / user / zap / footprints / circle-dashed / star / skull — `renderFeature.ts:303 crestIconFor`) and the usage chip text ("Main action", "Maneuver", "Triggered action"); in print (no crest) the usage words in the meta row | 25 pages: feature, feature-spend, featureblock(+advancement, stats, stats-ledger), kit, statblock + 18 statblock variants | **yes** — prints in colour; **35 frozen ids / 70 lines** (measured; list in §4a) | **same spine**: v2 `steel-statblock.css:321`, `steel-featureblock.css:161` (card mode); site also has it on trait cards (`steel-traits.css:36`), trait previews (`steel-indexes.css:163`) and ability-type blockquotes (`extra.css:364-371`) | no nested-card pair; no GAP |

Notes on row 6: main action (`#e74c3c`) and villain (`#e0584b`) are almost the same red, and in greyscale every hue becomes the same mid-grey bar (greyscale sheet), so the spine already fails for Scott; the crest shape is what really separates them.

### 2b. Excluded (one line each)

- `.dse-sb__sticky-chars` :11093 — 1px `--dse-metal-line` column divider before the characteristics in the sticky mini-header; neutral; same rule on the site (`steel-statblock.css:583`). **Out of scope, confirmed** (`sc558-r1-sticky-chars.png`).
- Montage hero column right rule :4719 (`inset -1px 0 0 --dse-metal-line`) — per the brief.
- `.dse-chrome` / `.dse-section__title` / `.dse-nt__end` / `.dse-stamina__cluster` (recoveries variant) — 1px neutral hairlines.
- `.dse-stamina__cluster` + `.dse-stamina-rec` winded/dying — a state-hued border **all around** (bottom opened to mate the strip), not an edge stripe; state also in crest silhouette + word.
- `.dse-track__slot::before` (negotiation track) — 2px neutral vertical connector between track pips.
- `[data-dse-element='feature']::after` :110 — 1px fading `--dse-rule` corner bracket on the standalone card.
- Stamina gauge internals (`.dse-stamina__gpour/__gwound/__gidx`, :12255-12354) — meter material, not edges.
- `.dse-mt__verdict-alert` :5113 — a full-width gold fade under a top border (the "brink" band); not an edge stripe.
- `.dse-hr__line` — the ◆ rule's fading arms.
- **Adjacent finding (host CSS, not plugin CSS):** in the print twin (frozen) a plugin blockquote (class, perk, perk-headings) gets Obsidian's own 2px violet `border-inline-start` (`--blockquote-border-color`), because the plugin's re-grounding of blockquotes (:18693) is `:not([data-dse-print="on"])`. On screen it is neutralised. Crop: `sc558-r1-adjacent-print-blockquote.png`. It is the host's markdown-quote style, so not this ticket — listed for Q6.

## 3. Candidates

All candidate CSS: `sc558-r1-crops/sc558-r1-cand-<group>-<letter>.css`. Every tile is labelled in the image.

### 3.1 Error card — `sc558-r1-errorcard.png`

- **A — remove.** Hairline all round; title stays red; stage in words. *Meaning already lives in the title text*, so this is the plain removal.
- **B — banner ground.** The title becomes a header band across the card (the statblock head-band recipe: a 180° stage-hue gradient band with a stage-hue hairline under it). Severity readable at a glance; still says it in words.
- **C — border all around in the stage colour** (1px, mixed 60% toward the hairline), title ink follows the stage.
- Implementation note for B/C: `color-mix(var())` must sit behind the `@supports` gate with a static fallback (`cssSupportFloor.test.ts`).

### 3.2 Role — `sc558-r1-role.png` (statblock + featureblock advancement share `--dse-role`)

- Statblock spine: **A — delete the rule** (only candidate; it is dead). 0 px, 0 frozen bytes.
- Advancement rail (demo block re-tinted Harrier pink by script so the hue shows):
  - **A — remove the rail.** The head strip already opens each level; the options under it are framed cards.
  - **B — the site's recipe**: 1px role@30% rule across the top + small uppercase role-ink label (v2 `steel-featureblock.css:202-221`). Converges on the site. Borderline check: it is a full-width 1px divider (the weight of every section hairline), not a 2-3px accent bar, so I do not read it as "the stripe rotated". Still, it is the one candidate here that puts hue on an edge.
  - **C — sunken well, borders all around** (the `.dse-pr` panel recipe). Containment shows the grouping with no hue; heaviest (plate → well → card → section).
  - Extra tile: A together with action-spine A (the end state).

### 3.3 Tiers — `sc558-r1-tier.png` (power roll + montage strip)

- **A — remove the stripe, keep the wash and badge.** Screen-only, 0 frozen bytes, parity-safe.
- **B — remove stripe and wash** (badge only). Cleanest; **opens a `tier-row` `bg` GAP** (material, never declarable), so it only works if the v2 site drops its wash in the same landing.
- **C — banner ground**: a 180° tier band (11% → 3%) across the whole row, no left anchor. Keeps parity's non-flat background. Spends the most hue of the three.

### 3.4 Action-type spine — `sc558-r1-act.png`

- **A — remove the spine.** The framed card (sunken fill, 9px radius, gap) still separates options; crest shape + usage text carry the type. Kit signature ability (unframed) simply loses its spine and its 3px + .55em lane. Print: no spine, the usage words stay (print tiles in the sheet).
- **B — 1px border all around in the action colour** (40%). Framed contexts only.
- **C — the crest rim takes the action colour** (the glyph inside already does). Screen-only; print is the same as A.

## 4. Recommendation

| Stripe | Pick | Why |
|---|---|---|
| Error card | **A** | The stage is already in the title's words, and the colour never separated stages for Scott anyway (orange vs red). Author-facing failure notice; plain is right. B if he wants severity visible at a glance. |
| Statblock role spine | **A** | Dead rule; deleting it is pure cleanup (0 px). |
| Advancement rail | **A** | The level head strip already groups; a rail, a top rule or a well all repeat it. A is also what the site's design is closest to without adopting its label style. B if Scott wants DSE to match the site exactly. |
| Tier rows + montage | **A** | Badge text + silhouette say the tier twice without hue; keeping the wash keeps the parity contract and the site rhyme. |
| Action spine | **A** | Crest shape + usage text say it without hue; the spine is the one channel that fails in greyscale (all action hues collapse to one grey), and main vs villain are near-identical reds even in colour. |

### 4a. Measured cost of the recommended set (scratch copy, in-place edits)

Scratch copy `…/scratchpad/sc558-r1-opusdesign/dsecopy/draw-steel-elements` with `styles-source.css` edited in place exactly as §7 sketches (line-preserving: :73 `content: none`, :416/:460/:464 removed, :3038 removed, :3552-3553 removed, :5283 removed, :7076 → `0`, :7175 and :7243 → `0.85rem`, :9986 removed). Worktree untouched.

- `npm run shots`: **rc 0, 592 shots, every in-run gate OK** (incl. print-twin delta, nested corner-radius, montage gates, host-leak sweeps).
- `check-freeze.sh`: **FREEZE VIOLATED — 70 mismatches, 0 missing** (210/280 OK). The 35 ids (each print + realprint): `statblock` + 22 statblock variants (`charbox-on`, `charbox-onword`, `charline-two`, `collapsed`, `columns-wide`, `companion-corpus`, `disttarget-ledger`, `disttarget-text`, `edit-btn`, `kwusage-grid`, `kwusage-ledger`, `kwusage-text`, `roleless-corpus`, `stats-gridc`, `stats-ledger`, `sticky`, `sticky-narrow`, `sticky-nometa`, `sticky-off`, `sticky-unscrolled`, `villain-banded`, `villain-corpus`, `with-captain`), `featureblock`, `featureblock-advancement`, `featureblock-stats`, `featureblock-stats-ledger`, `kit`, `kit-collapsed`, `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-card`, `chrome-hover-statblock`, `chrome-placement-trio`. Every one is a printed action spine; error card / statblock spine / tier / montage move **0** print bytes.
- `npm run parity`: **0 gap(s), 0 undeclared, 24 declared** — unchanged from CURRENT.
- First attempt (candidate CSS APPENDED instead of edited in place) failed the **print-twin delta gate** on `featureblock-featstyle-flat` (badge x drift 13.6px) and moved a 71st line: the appended `padding-left: .85rem` reset ties (0,5,0) with the featureblock `flat` mode rule and wins by source order. In-place editing (the real implementation) has no tie. Recorded in `sc558-r1-cand-act-A.css`'s header. Logs: `shots-rec-q4m2.log` (failed append run), `shots-rec-k7p3.log` / `freeze-rec-k7p3.log` / `parity-rec-k7p3.log` (clean in-place run).

Greyscale proof: `sc558-r1-greyscale.png` — the 10 role head bands (identical greys; only the role word differs), the advancement band, the tier sets (power roll + montage) and the action set, current vs recommended.

## 5. Questions for Scott (one batch)

1. **Picks** — A across the board (above), or a different letter per stripe?
2. **Print rebaseline** — action-spine A changes printed statblocks, featureblocks and kits (the coloured bar leaves paper): **70 of 280 freeze lines (35 ids)**. Sanction the rebaseline (`rebaseline.txt` + before/after crops)? Or keep the spine on paper only (a print-only exception — not recommended: two looks for one card)?
3. **Does the v2 site follow?** The site ships the same tier stripe (`steel-ability-cards.css:167`) and action spine (`steel-statblock.css:321`, `steel-featureblock.css:161`), plus spines on trait cards, trait previews and ability blockquotes. Parity cannot see border-left, so the gate stays green either way. Options: (a) DSE-only now, site in a follow-up ticket; (b) same landing; (c) DSE diverges permanently with a note in DESIGN.md. DESIGN.md "Borders & cards" also still says "Ability cards add a 3px colored left border keyed to type" — it needs rewriting whatever he picks (rule 8).
4. **Error card** — is the stage in words enough (A), or does he want the severity colour band (B)?
5. **SC-349 sequencing** — SC-349 (shots print clipping) will move ~40 freeze lines; action-spine A moves statblock/featureblock/kit print ids. If they overlap, land one, rebaseline, then rebase the other — or fold both into one sanctioned rebaseline.
6. **Adjacent (not this ticket):** the print twin shows Obsidian's own violet blockquote edge on class/perk quotes (`sc558-r1-adjacent-print-blockquote.png`). Ticket it, or leave the host's quote style alone on paper?

## 6. Overlaps

- **SC-349** — print-shot clipping rework, ~40 freeze lines: same frozen class as Q2; possible id overlap on statblock/featureblock prints (see Q5).
- **SC-526** — Recoveries popover buttons: no overlap. The stamina cluster/recoveries strip have a state border all around, not a stripe; nothing here touches them.
- **SC-520** — Live Preview callout chrome: no plugin stripe overlap. The only related item is the host's blockquote edge (Q6), which is the same "Obsidian's own chrome leaking into plugin output" family; worth cross-referencing if Q6 becomes a ticket.

## 7. Implementation sketch for the recommended set (for r2, not done here)

- Delete :3034-3039 (dead role spine + its comment).
- `.dse-error-card`: `border-left` → plain hairline; delete the stage `border-left-color` rules :454-465 (keep `data-dse-error-stage` — tests and the `:not([data-dse-error-stage])` guards use it).
- `.dse-fb__band--adv`: drop `border-left` + `padding-left` (:3550-3554) and the Steel colour rule :10526-10528 (+ its comment).
- `.dse-pr__row` :9986 and `.dse-mt__tier-row` :5283: drop `border-left`; `.dse-mt__tier-row--head` `border-left-color` :5319 goes too. Watch the comments that "quote" the shipped recipe (:5256-5268, :9890-9897).
- Action spine: delete the base `::before` :72-80 and every lane / radius / suppression rule that exists only for it (:7070-7077, :7100-7105, :7174-7180, :7245-7248, :7299-7301, :7322-7324) and the print `print-color-adjust` arms for `::before` (:15961, :16018); framed cards keep `padding-left: .85rem`. Tests that pin the spine rules by selector need updating: `test/dom/theme/steelMaterial.test.ts` (~:745-795, :936, :1038, :1228, :1287); `test/dom/framework/lightContrast.test.ts` measures the crit tier **spine** as a contrast surface (:163, :278-289, :393 — the reason `--dse-tier-crit` got a light value, :7010); with tier A that surface goes away and the entry must be retargeted to the crit badge frame, not deleted silently. `theme-steel.test.ts` names the act/tier tokens as "spines" (:188, :389, :442) — token values stay, comments need rewording. `featureblock.test.ts` pins the band's DOM only and is unaffected. Keep `data-dse-act` + `--dse-act` (the crest glyph tints from it).
- DESIGN.md "Borders & cards" sentence + rule 7 "existing components … will be replaced" → done.
