# SC-297 round 4 brief — fix round for the round-3 review findings

You are the SC-297 implementation worker (you built rounds 2 and 2b). **You never call the
tracker (Linear).** Everything is in files.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/decisions.md`
  — read the new "Round 3" section in full, including the **owner rulings**, before touching
  anything.
- Review report (the findings, with file:line, failure scenarios and prescribed fixes):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round3-review-report.md`.
  Read all findings. The reviewer's probe scripts/logs are under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/r3-*` — reuse `r3-affordance.*` / `r3-gatecrawl.*` to re-measure.
- Worktree (your ONLY write location): `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`.
  Verify `pwd` before any write; never write under `/home/scott/code/steelCompendium/workspace/`.
  `v2` on `sc297-menu-panels-site` @ `3c733f312f8db470ca18371ff487135aea90ba21`; superproject @
  `99f065862e`. Do not rebase this round; do not touch any submodule pin other than `v2`.

## 2. Findings to fix (reviewer's words, verbatim from its return)

> **HIGH-1** — `v2/docs/javascripts/scc-card-copy.js:86` + `scc-card-copy-core.js:19-26`. All
> **21** `Browse/kit/*` pages now have **zero** permalink-copy affordance (h1 `display:none`, no
> `.sc-pageact`, no `.sc-copylink`, plate = pin only). Base assets from `f9347707dd` swapped into
> the build output show a copy-link on every one, carrying the kit page's own correct
> `/scc/…/kit/<slug>/`. Full in-page gate diff over 1,603 built pages: **48 pages lost the
> copy-link**; 11 are `Read/**` chapters (the intended D2 fix), 37 are `Browse/**` leaf pages, of
> which 21 have no surviving affordance. Fix: resolve the card via `SCChrome.anchor()` and add
> `sc-kit`/`sc-trait` to `cardKind`.
>
> **HIGH-2** — `v2/docs/javascripts/sc-export.js:36-37` + `v2/docs/stylesheets/steel-export.css:1-8`.
> On `Browse/monster/retainer/summoner/minion/{razor,gorrre,violent}/` a `<p class="sb-backlink">`
> between the `<hr>` and `.sb-wrap` breaks the strict adjacency; `SCChrome.panel()` is null but
> `cardNode()`'s bare descendant selector still matches, so MD/PNG mount into `.sb__head` with
> the placement CSS deleted: `position: static`, `opacity: 1` always, 41×68 stacked over the
> "◆ RETAINER" eyebrow (base: `absolute`, `opacity 0`→1 on hover, 82×34).
>
> **MEDIUM-1** `steel-export.css:16-22` — those escaped chips are baked into the PNG export
> (`display: block` under `body.sc-export-shooting`). **MEDIUM-2** `tests/e2e/chrome-panel.e2e.cjs:111`
> — plate contents logged as INFO, never asserted, so HIGH-1 passes 135/135. **MEDIUM-3**
> `chrome-panel.e2e.cjs:171` (phone-clearance now measures against a zero rect on all five
> families) and `:115-127` (`:focus-within` check runs with the mouse still on the card).
>
> **LOW-1** seven stale "top-center control strip" references (`DESIGN.md:209`, `DESIGN.md:224`,
> `sc-pageact.js:4`, `sc-export.js:3`, `steel-scale.css:3`, `scc-card-copy.js:15-17`,
> `.repo-docs/troubleshooting.md:255-266`). **LOW-2** no `DESIGN.md` component-table row for the
> site plate. **LOW-3** `steel-chrome.css:246-247` calls the collapse toggle an open question
> (ruling 2 closed it). **LOW-4** `sc-chrome.js:37-38` selector-list ordering comment is wrong.

All of HIGH-1, HIGH-2, MEDIUM-1..3 and LOW-1..4 are in scope for this round. The INFO finding
(stale `draw-steel-elements` pin in the superproject) is NOT yours — leave every pin alone.

## 3. Owner design ruling (from the ledger, binding)

> One discriminator, one owner. `sc-chrome.js` is the single source of truth for "is this a
> card page and which element is the card". It must accept an optional `p.sb-backlink` between
> the `<hr>` and the card (those minion pages ARE card pages and get the plate). Every consumer
> (copy-link, pin, encounter-add, export) resolves the card through `SCChrome` and mounts
> nothing when `SCChrome.panel()` is null — no consumer keeps a private card-finding selector.
> `sc-pageact.js`'s plain-page test must reach the same answer as `SCChrome` (share the
> predicate), so the plate and the page strip can never both be absent or both be present.

Consequences you must verify (measure, don't assume):
- The three `Browse/monster/retainer/summoner/minion/{razor,gorrre,violent}/` pages get a plate
  with copy-link, pin, encounter-add, MD, PNG — and nothing mounted inside the head.
- Every kit and trait leaf page gets its copy-link back, carrying the page's own permalink.
  Re-run the reviewer's in-page affordance crawl over the built site: the only pages that lose
  a copy-link versus base `f9347707dd` are Read chapters (the D2 fix); every Browse leaf card
  page has exactly one affordance (the plate).
- No page has both a `.sc-pageact` strip and a plate; no card page has neither.
- The gate (`chrome-panel.e2e.cjs`) now asserts the plate's expected contents per family
  (statblock: copy, pin, encounter, MD, PNG; ability/trait/featureblock: copy, pin, MD, PNG;
  kit: copy, pin — MD/PNG absent until SC-298), fixes the zero-rect phone measurement, and
  checks `:focus-within` with the mouse moved off the card. Include the three minion pages in
  the gate. Prove the new assertions are real by breaking one on purpose (e.g. drop the
  copy-link from the kit `cardKind`) and confirming a named FAIL, then revert.

## 4. Gates and evidence

- Unit `node --test tests/*.test.js`: 78/78 before; after ≥78, 0 fail (add unit tests if you
  add pure logic to `scc-card-copy-core.js` or a chrome core).
- Original e2e: 6 pass / 2 pre-existing fail (`featureblock-fixture`, `settings-panel`) — unchanged.
- `chrome-panel.e2e.cjs`: all green; report the new assertion count (it must be > 135).
- Shots into the ledger `shots/`: `sc297-r4-minion-razor-dark-hover.png` (plate present, head
  clean), `sc297-r4-kit-dark-hover.png` (copy-link + pin in the plate), `sc297-r4-trait-light-hover.png`,
  and `sc297-r4-minion-gorrre-export.png` (the PNG export output with no stray chips).
- Commit in `v2`, then commit the superproject pointer bump in the worktree. Report both shas.

## 5. Footguns

- Devbox wrapper form; never pipe a gate through `tail`; per-run unique log files; never
  `git checkout -- .` in v2 (safe form: `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`);
  no `devbox run` from inside `v2/`; run builds/shots in the foreground with output redirected.
- The shared main checkout's `CLAUDE.md` → `@AGENTS.md` dirt is a concurrent session's — leave it.
- You cannot message me; if blocked, end with `STATUS: NEEDS_CONTEXT` in your report.

## 6. Report and return

Append "## Round 4" to `sc297-round2-report.md` in the ledger dir and refresh its top
executive summary (shas, gate counts, assertion count). Return raw facts only: verdict, `v2`
sha, superproject sha, unit/e2e/gate counts (with the gate's new total), the falsification
result, absolute paths of the four shots, `Drive-by fixes:` and `Follow-ups:` lists.
