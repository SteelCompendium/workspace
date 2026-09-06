# SC-297 — Add menu panels to Compendium Site — decisions ledger

Effort: `sc297-menu-panels-site`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`
(every submodule on branch `sc297-menu-panels-site`). Owner: Fable ticket-owner, session
`4931eaaf-23fa-45a6-9d71-eaf64645d32d`.

Rulings are appended verbatim and dated. Superseded text is struck through, never deleted.

## Ticket description (Scott, 2026-09-05, verbatim)

> As part of SC-169 and SC-189 we added "menu panels" to Elements in the DSE plugin. In the
> Compendium, some cards, statblocks, etc have the equivalent functionality floating in the
> top of the card. For example, a statblock has the "copy permalink, pin, add to encounter,
> etc" buttons at the top:
>
> [screenshot: a statblock card on the v2 site with the hover-revealed top-center button
> strip visible]
>
> Instead of having these buttons floating in the card, I want to add the menu panels that we
> have in the DSE plugin and put the functionality in there

Labels at start: `Compendium`, `Feature`. Priority: High. Related: SC-169, SC-189.

## Standing design contract the port must honor (not a new ruling — pointers)

- Plugin panel: workspace `DESIGN.md` → "The element chrome panel" (option D geometry:
  right edge `10px` inside the card's border-box right edge, bottom edge exactly on the
  card's border-box top; material E3 "hairline crown"; depth `tuck` from SC-189; hover-only
  on desktop with `:focus-within`, always-visible + reserved top space on mobile, absent in
  print; right-anchored and grows right-to-left).
- Site strip being replaced: `DESIGN.md` → "Card header system" — the hover-revealed
  top-center control strip mounted in the card HEAD by each consumer script
  (`scc-card-copy.js`, `sc-pins.js`, `sc-encounter.js`, `sc-export.js`), hard-coded rem
  offsets. Plain pages use the separate always-visible top-right `.sc-pageact` strip.
- Scott is colorblind: hue never carries meaning alone; name colors in prose.

## Rulings

### 2026-09-05 14:26Z — Scott, replying to ask 1 (verbatim)

> agree with all

Ask 1 offered a recommendation per question and said *"Agree with all" is a complete answer*.
This ruling therefore adopts every recommendation exactly as posted in `sc297-ask1.md`:

1. **Scope:** all five families that carry buttons today — statblock, featureblock, ability,
   trait, kit.
2. **Collapse toggle:** no collapse toggle on the site panel.
3. **Plain pages:** the `.sc-pageact` page-link + pin cluster on non-card pages stays as is.
4. **Embedded cards inside Read chapters:** card pages only; no panel on embedded cards. The
   two Read-chapter bugs (encounter chip on the first embedded statblock; copy-link on an
   embedded card copying the chapter link) are fixed in the rollout.
5. **Ability card corner clipping:** sanctioned — clipping turned off for cards carrying a
   panel (`overflow: visible` + `border-radius: inherit`, scoped to the panel-bearing card);
   no wrapper element.
6. **Hover lift:** keep the ability card's 2px hover lift; the plate rises with the card.
7. **Level scaler:** the −/+ steppers stay inside the Level chip; leave for now, revisit after
   the rollout.

Consequence Scott agreed to: *"round 2 rolls the panel out per your answers, fixes the two
Read-chapter bugs, updates DESIGN.md and the changelog, then goes to independent review."*

## Round 1 (2026-09-05) — survey + prototype, Opus reviewer worker

- `v2` prototype committed at `7613cbc8798769bc20be51c9affa3ac0d4a56f41` on
  `sc297-menu-panels-site` (new `docs/javascripts/sc-chrome.js`,
  `docs/stylesheets/steel-chrome.css`; consumers `scc-card-copy.js`, `sc-pins.js`,
  `sc-encounter.js`, `sc-export.js`, `mkdocs.yml` modified). Statblock + ability card only.
- Gates: v2 unit 78/78 before and after. e2e 6/8 pass; `featureblock-fixture` and
  `settings-panel` fail identically against production (pre-existing, not ours). New
  measured geometry gate `sc297-round1-chrome-panel.e2e.cjs`: 53/53 (right gap 10.00px,
  bottom delta 0.00px, both families, both schemes, desktop + 375px + print).
- Report: `sc297-round1-report.md`. Spec: `sc297-round1-port-spec.md`. Shots: `shots/`.
- Owner eyeballed: `statblock-dark-after-hover`, `ability-light-after-join`,
  `ability-dark-before-hover` — plate geometry correct, border unbroken beneath, the before
  shows the pin button on top of the card name.

**Owner ruling on round-1 follow-ups D1 and D2 (2026-09-05):** fold into round 2 (rollout).
Both are one-line strict-discriminator fixes in files the rollout already rewrites
(`sc-encounter.js:36` descendant selector mounts the encounter chip on the first embedded
statblock in a Read chapter; `scc-card-copy.js:83` parent gate lets copy-link mount on an
embedded card and copy the chapter permalink). No ticket. Contingent on Scott's Q4 answer:
"card pages only" makes the strict gate the fix; "embedded too" subsumes both.

**Ask 1 posted 2026-09-05 14:18Z** (`sc297-ask1.md`, 9 inline images). Ticket → In Progress +
`Needs Review`. Waiting on Scott.

## Round 2 (2026-09-05) — rollout, Sonnet implementer

- `v2` @ `406104ad9ff21b197e60fe7116fe125631cdd5f0`; worktree superproject @
  `e659166ea4f38cea5951095dee76d02f8187c4a9`. All five families rolled out (each was exactly
  "two declarations": `sc-chrome.js` FAMILIES + a `steel-chrome.css` frame-offset block). D1/D2
  fixed with the strict `h1:first-child + hr + card` discriminator; zero stray chips/copy-links
  on `/Read/bestiary/retainers/`. Docs: `DESIGN.md`, `CHANGELOG.md`, `v2/CLAUDE.md`,
  `v2/.repo-docs/conventions.md`, `v2/.repo-docs/troubleshooting.md`.
- Gates: unit 78/78; original e2e 6/8 (same two pre-existing failures); new
  `v2/tests/e2e/chrome-panel.e2e.cjs` **133/135** — the 2 failures are trait phone-clearance,
  root-caused to a pre-existing missing `h1+hr` hide rule in `steel-traits.css` (duplicate
  title on every trait leaf page today).
- Drive-by: two stale "top-center control strip" mentions in `DESIGN.md`'s component table
  (pinboard, card-exports rows) updated to the plate.
- Report: `sc297-round2-report.md`. Shots: `shots/sc297-r2-*` (13).

**Owner rulings on round-2 follow-ups (2026-09-05):**

1. Trait `h1+hr` hide rule missing in `steel-traits.css` → **fold** into a fix round now
   (resume the round-2 implementer). Reason: the landing gate must be green, the other four
   families carry the rule (consistency), and it removes a visible duplicate title on every
   trait page.
2. Kit leaf pages lack the `<template class="sc-src">` export island → **filed** as a Backlog
   ticket linking SC-297 (see "Tickets filed" below). Reason: `steel-etl` pipeline gap, other
   repo, pre-existing on production.
3. Shared main checkout dirty (`M CLAUDE.md` reduced to one line, untracked `AGENTS.md`,
   `m` on `data-gen`/`steel-etl`/`v2`) → **not ours**; reported to the dispatcher, who owns
   landing and needs a clean main checkout. No action by this effort.

## Tickets filed by this effort

- **SC-298** (Backlog, 2026-09-05) — Kit leaf pages have no export island; kit cards get no
  MD/PNG export. `steel-etl` pipeline gap, pre-existing. Out of scope for SC-297.
- **SC-301** (Backlog, filed after round 4, 2026-09-05; owner's eye on
  `shots/sc297-r4-minion-razor-dark-hover.png`) — Retainer-minion pages show the page H1 above the card (name twice) because the H1-hide CSS
  keys on strict `h1+hr+card` adjacency and the `p.sb-backlink` breaks it. Pre-existing,
  cosmetic, three pages. Filed as a Backlog ticket linking SC-297 rather than folded — the
  branch is mid re-review and this is not the plate's defect. Mentioned in ask 2 so Scott can
  pull it in before landing if he wants.

## Round 2b (2026-09-05) — fix round folded from follow-up 1, same implementer

Task: add the missing `h1+hr` hide rule to `steel-traits.css` matching the other four
families; chrome-panel gate expected 135/135.

Result: DONE. `steel-traits.css` rule mirrors `steel-kit.css`'s exactly. `v2` @
`3c733f312f8db470ca18371ff487135aea90ba21`; worktree superproject @
`99f065862e8adb1ef999f8d3d245ae9816d6bcdd`. chrome-panel gate **135/135**; unit 78/78; original
e2e 6/8 (same two pre-existing). CHANGELOG bullet added for the trait duplicate-title fix.
Shots: `shots/sc297-r2-trait-dark-{hover,phone}.png` (re-shot), `shots/sc297-r2b-trait-dark-title.png`.
Report §8 of `sc297-round2-report.md`.

Observation for the plugin owner (not acted on): the round-2 implementer's `SendMessage` to
this owner DID arrive (2026-09-05), contradicting the skill's "workers cannot reach you"
note; and it reports that its background-build notification also arrived. The stall watcher
was still cheap insurance; the worker confirmed it ran the remaining steps in the foreground.

Authorship for review routing: round-1 prototype = Opus reviewer worker (id ac5296aa…);
round-2/2b rollout = Sonnet implementer (id a559d0e2…). Round-3 review must be a FRESH
reviewer identity.

## Round 3 (2026-09-05) — independent review, fresh Opus reviewer (id aab6615c…)

Verdict **FIX ROUND NEEDED**: 2 HIGH, 3 MEDIUM, 4 LOW, 1 INFO. Report:
`sc297-round3-review-report.md`. Reviewer re-measured: unit 78/78, original e2e 6/8 (same two
pre-existing), chrome-panel 135/135; gate falsification worked (10→12px inset ⇒ 20 named
FAILs; +2px bottom ⇒ 20 named FAILs). All seven rulings verified satisfied on the branch.

- HIGH-1 `scc-card-copy.js:86` + `scc-card-copy-core.js:19-26`: every kit and trait leaf page
  lost its copy-link (kit: 21 pages with zero permalink affordance). 48 built pages lost the
  copy-link; 11 were the intended D2 fix, 37 are Browse leaf pages.
- HIGH-2 `sc-export.js:36-37` + `steel-export.css:1-8`: on `Browse/monster/retainer/summoner/
  minion/{razor,gorrre,violent}/` a `<p class="sb-backlink">` between `<hr>` and `.sb-wrap`
  defeats the strict adjacency; no plate mounts, but `cardNode()`'s descendant selector still
  matches and MD/PNG mount into the head with their placement CSS gone (owner eyeballed
  `shots/sc297-r3-minion-razor-dark.png`: chips stacked over the RETAINER eyebrow).
- MEDIUM-1 those stray chips are baked into the PNG export. MEDIUM-2 the gate logs plate
  contents but never asserts them (so HIGH-1 passed). MEDIUM-3 gate phone-clearance measures
  against a zero rect; `:focus-within` check runs with the mouse still on the card.
- LOW-1 seven stale "top-center control strip" references; LOW-2 no DESIGN.md component-table
  row for the site plate; LOW-3 `steel-chrome.css:246-247` calls the collapse toggle open
  (ruling 2 closed it); LOW-4 `sc-chrome.js:37-38` ordering comment wrong.
- INFO superproject `99f065862e` pins `draw-steel-elements` at `c2a5cec`; `origin/main`
  (`2aad0767`) has it at `98d5bd3`. Landing must not revert it.

**Owner rulings (2026-09-05):**

- HIGH-1, HIGH-2, MEDIUM-1..3 → fix round 4 (resume the round-2 implementer, id a559d0e2…).
- **Design ruling for the fix:** one discriminator, one owner. `sc-chrome.js` is the single
  source of truth for "is this a card page and which element is the card". It must accept an
  optional `p.sb-backlink` between the `<hr>` and the card (those minion pages ARE card pages
  and get the plate). Every consumer (copy-link, pin, encounter-add, export) resolves the card
  through `SCChrome` and mounts nothing when `SCChrome.panel()` is null — no consumer keeps a
  private card-finding selector. `sc-pageact.js`'s plain-page test must reach the same answer
  as `SCChrome` (share the predicate), so the plate and the page strip can never both be
  absent or both be present.
- LOW-1..4 → **fold** into round 4 (docs/comments, same files, part of "done").
- INFO → **dispatcher** (land-stack's stale-pin case); round 4 does not touch submodule pins.
- Scoped re-review of the round-4 delta → the round-3 reviewer (different identity from the
  fixer; author-independence holds).

## Round 4 (2026-09-05) — fix round, same implementer (id a559d0e2…)

DONE. `v2` @ `84608f494c194bbebfe5747adf9862738e11ccf1`; superproject @
`cd53f9567655ed31708abde8faf74c2d30b7ba46`. Design ruling implemented: `sc-chrome.js` accepts
optional `p.sb-backlink`; all four consumers resolve via `SCChrome.anchor()` and mount nothing
when `panel()` is null; `sc-pageact.js` calls `SCChrome.anchor()` (shared predicate). HIGH-1
root cause was `scc-card-copy-core.js` `cardKind()` lacking `sc-kit`/`sc-trait`. All nine
findings fixed; drive-by: an eighth stale strip mention in `steel-pageact.css`.
Gates: unit **82/82** (4 new `scc-card-copy-core` tests); original e2e 6/8 (same two
pre-existing); `chrome-panel.e2e.cjs` **245/245** (5 families + 3 minion pages, per-family
expected-contents assertions). Falsification: dropping `sc-kit` from `cardKind` ⇒ exactly 2
named FAILs on kit's contents assertion. Shots: `shots/sc297-r4-*` (4).

**Owner ruling on the worker's extra change (2026-09-05):** the phone-width reserved top
space in `steel-chrome.css` moved from the plugin's literal `2.1em` to `2.5em` — measured:
the plate renders 44px tall on every family and `2.1em` was 4.1px short, visible only on the
minion pages (their preceding `p.sb-backlink` is rendered). **Accepted** as a measured fit,
not a design change (site and plugin em bases differ); desktop geometry unchanged
(10.00px / 0.00px). Round-5 re-review must verify it, and check DESIGN.md does not state
`2.1em` as the site value.

Measured fact (not a defect): the three minion pages have no EV chip, so encounter-add
correctly does not mount there; their plate is copy-link + MD/PNG + pin.

## Round 5 (2026-09-05) — scoped re-review of the round-4 delta, round-3 reviewer (id aab6615c…)

Verdict: FIX ROUND NEEDED (trivial). All nine round-3 findings **closed by measurement**;
nothing regressed. Reviewer re-measured unit 82/82, original e2e 6/8 (same two), chrome-panel
245/245; its own falsification (neutering the pin host) ⇒ 16 named FAILs; reverting `2.5em`
to `2.1em` ⇒ 6 named FAILs on the minion pages (so the 2.5em change is gate-protected).
Structural check clean: no private card-finding selector remains; censuses `both=0`,
`cardpage-no-plate=0`, `stray=0`, `no-permalink=0`. Copy-link delta over 1,603 pages: lost 23
(10 Read chapters = D2 fix; 13 plain Browse pages whose old copy-link sat on an embedded card
= the fix working), gained 185 (trait leaves). `DESIGN.md:274`'s `2.1em` is the plugin value —
clean. Report: `sc297-round5-rereview-report.md`; deciding shot `shots/sc297-r5-minion-razor-phone.png`.

New, delta-introduced:
- MEDIUM `steel-statblock.css:52-53` (+4 siblings): the CSS H1-hide predicate lacks the
  `p.sb-backlink` alternation, so the 3 minion pages are card pages to the JS and plain pages
  to the CSS — visible duplicate title (= SC-301, filed by the owner from the r4 shot).
  Prescribed fix: `.md-typeset > h1:first-child:has(+ hr + p.sb-backlink + .sb-wrap),
  .md-typeset > h1:first-child + hr:has(+ p.sb-backlink + .sb-wrap) { display: none; }` and add
  the 3 pages to `page-titles.e2e.cjs` CASES.
- LOW `DESIGN.md:186` still states the strict `h1+hr+card` adjacency the delta relaxed.
- LOW `DESIGN.md:214` still scopes the copy-link to statblock/featureblock/ability (five now).
- INFO (landing): `v2` `origin/main` advanced `f9347707dd` → `e83421a61d` (two SC-177 commits
  touching `sc-pins*`); superproject `DESIGN.md` (pinboard row) and `CHANGELOG.md`
  (`## 2026-09-05 — My Table section excerpts (SC-177)`) will conflict. `draw-steel-elements`
  pin still stale (`c2a5cec` vs `98d5bd3`).

**Owner rulings (2026-09-05):**

- MEDIUM → **fold** into round 6. SC-301 is therefore delivered by SC-297; SC-301 gets
  marked Done when SC-297 lands (with a comment saying so).
- LOW ×2 → **fold** into round 6.
- INFO → **round 6 rebases** `v2` onto `origin/main` `e83421a61d` (real merge of the `sc-pins*`
  changes, not a pointer bump) and the worktree superproject onto its `origin/main`, resolving
  `DESIGN.md` / `CHANGELOG.md`; the `draw-steel-elements` pin follows whatever the superproject
  rebase brings from main (read-only submodule; never re-pin it by hand).
- Round 7 = scoped re-review of the round-6 delta by the round-3/5 reviewer, with emphasis on
  the `sc-pins*` merge (pin button end to end, pinboard page, SC-177's own behaviour intact).
- Then the consolidated "OK to land (= deploy)?" ask to Scott.

## Round 6 (2026-09-05) — rebase + three folds, same implementer

DONE. `v2` @ `27a021adbf47279c3882492d6e7fbc823efb5eb3` rebased onto `origin/main`
`e83421a61d` — zero conflicts (SC-177 touched `renderBoard()/mountLinkForm()/init()`; round 4
touched only `mountPinButton()`). Superproject @ `117911b70706060a770f9cbe003a7fe8912b041e`
rebased onto `origin/main` `f5fe049437`; conflicts: `DESIGN.md` pinboard row once (merged
plate wording + SC-177's section-excerpt clause), `v2` pointer ×3 (branch tip taken);
`CHANGELOG.md` auto-merged (Unreleased above the dated SC-177 section). `git submodule
update --init` moved only `draw-steel-elements` `c2a5cec` → `98d5bd3` (round-5 INFO resolved).
Folds: H1-hide `p.sb-backlink` alternation in `steel-statblock.css` only (the sibling form
exists on exactly the 3 minion pages; 51 other `sb-backlink` hits are nested inside the card
and never broke adjacency); 3 minion pages added to `page-titles.e2e.cjs`; both DESIGN.md
lines fixed; CHANGELOG bullet.
Gates: unit **86/86** (+4 from SC-177's `sc-pins-core.test.js`); original e2e 6/8 (same two)
+ SC-177's 2 new e2e files pass (need `PLAYWRIGHT_PATH`/`E2E_BASE` per `.repo-docs/development.md`);
chrome-panel **245/245**; page-titles **9/9**. Pin flow end to end on the merged base OK;
SC-177 section-excerpt form exercised OK. `origin/main..HEAD`: v2 5 commits, superproject 4.
Nothing pushed. Shots: `shots/sc297-r6-{minion-razor-title,pin-flow,statblock-dark-hover}.png`.

## Round 7 (2026-09-05) — scoped re-review of the round-6 delta, same reviewer (id aab6615c…)

**Verdict APPROVE.** Reviewer re-measured on a fresh build: unit 86/86; original e2e 6/8 (same
two); SC-177's 2 e2e files pass; chrome-panel 245/245; page-titles 9/9; censuses all zero;
copy-link delta identical to round 5 (lost 23 / gained 185). `sc-pins*` merge: branch's only
diff vs main is round 4's `mountPinButton()`; SC-177's API live and exercised (pin from plate
→ pinboard 4 groups → excerpt form fetches real content → unpin). Superproject merge clean:
no markers, DESIGN.md headings identical to main, CHANGELOG dated sections byte-identical,
every pin equals main's except `v2`. Three round-5 findings CLOSED. Report:
`sc297-round7-rereview-report.md`; shots `shots/sc297-r7-*`.

- LOW (new) `steel-statblock.css:60`: comment says the `sb-backlink` grep matches only the
  three minion pages; it matches 53 files (only the line-start sibling form matches 3). Rule
  correctly scoped; comment drift only.
- INFO (landing): mains moved again after round 6 — `v2` `e83421a61d` → `e2b6a9727621`
  (SC-300 "make My Table controls and headings compact", touches `mountLinkForm()` and appends
  to `steel-pins.css` at line 94+; branch edits lines 1-40); superproject `f5fe049437` →
  `021cf25ac702`. Re-rebase required; SC-300 adds `tests/e2e/pins-layout.e2e.cjs`.

**Owner rulings (2026-09-05):**

- The reviewed content is what Scott decides on → **ask 2 posted now** (In Progress +
  `Needs Review`), in parallel with round 8.
- LOW → **fold** into round 8. INFO → **round 8 re-rebases** onto the current mains and runs
  the full gate set including SC-300's `pins-layout.e2e.cjs`.
- **Re-review of round 8 is required only if** any conflict hunk occurred or any gate number
  moved unexpectedly; a zero-conflict rebase with all gates green is a mechanical delta the
  reviewer already pre-analyzed (SC-300's hunks disjoint from ours). Otherwise round 8 →
  land-ready on Scott's yes.

**Ask 2 posted 2026-09-05 (evening)** (`sc297-ask2.md`, 9 inline images): "OK to land? Landing
`v2` to `main` auto-deploys the live site." Ticket → In Progress + `Needs Review`. Round 8
(re-rebase + LOW comment fix + full gates) running in parallel; the sha in the ask
(`27a021adbf`) will be superseded by round 8's — content unchanged.

## Round 8 (2026-09-05/06) — re-rebase + LOW comment fix + full gates, same implementer

DONE. `v2` @ `a052ea70a1e1803908e5f0f2998066547b164e97` rebased onto `origin/main`
`e2b6a97276` (SC-300) — **zero conflicts**; 6 commits ahead. Superproject @
`1ea1d939ce34d0269dcf5f49744dac864d8a3f1e` rebased onto `origin/main` `021cf25ac702` — conflicts
only in the DESIGN.md pinboard row (merged; SC-300's clause kept) and the `v2` pointer ×2;
4 commits ahead. No non-`v2` pin moved. LOW comment fixed. Gates: unit 86/86; original e2e
6/8 (same two); SC-177 ×2 + SC-300 `pins-layout.e2e.cjs` pass; chrome-panel 245/245;
page-titles 9/9; pin flow re-verified (`shots/sc297-r8-pinboard.png`, SC-300's compact layout
live). Nothing pushed.

**Owner check (2026-09-06, docs-only hunks, per the round-7 ruling):** no conflict markers in
DESIGN.md / CHANGELOG.md / v2 JS+CSS; pinboard row correct; superproject HEAD directly on
`021cf25`; pins `v2`=`a052ea70a1`, `draw-steel-elements`=`98d5bd3` (= main). **Accepted; no
further review round.**

**LANDING CANDIDATE:** branch `sc297-menu-panels-site`, `v2` @ `a052ea70a1`, superproject @
`1ea1d939ce`. Land-ready is reported to the dispatcher only after Scott's yes on ask 2
(landing `v2` main auto-deploys the site). On landing: mark SC-301 Done with a comment.

## Open questions put to Scott in the round-1 ask (2026-09-05)

1. Scope: all five families (statblock, featureblock, ability, trait, kit) — recommended — or
   statblocks first?
2. Collapse toggle on the site panel? Recommended no (a card page is one card).
3. Plain-page `.sc-pageact` strip: leave as is (recommended) or restyle?
4. Embedded cards inside Read chapters: card pages only (recommended) or every embedded card?
5. Ability card clip relaxation (`overflow: visible` + `border-radius: inherit` on
   panel-bearing cards) — recommended yes; the alternative wraps the card and breaks four
   `.md-typeset > .sc-ability` adjacency contracts.
6. Card hover-lift (2px) carries the plate — recommended keep.
7. Statblock level scaler (−/+ in the Level chip) is now the only hover-revealed control
   inside the head — recommended leave, revisit after rollout.
