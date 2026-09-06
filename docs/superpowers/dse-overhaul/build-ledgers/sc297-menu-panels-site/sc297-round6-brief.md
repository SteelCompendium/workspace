# SC-297 round 6 brief — rebase onto moved mains + fold the round-5 findings

You are the SC-297 implementation worker (rounds 2, 2b, 4). **You never call the tracker.**

## 1. Context

- Ledger `decisions.md` (ledger dir
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/`): read
  the "Round 5" section and its owner rulings in full.
- Round-5 report `sc297-round5-rereview-report.md` for the three findings' detail.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. Verify `pwd`
  before any write; never write under `/home/scott/code/steelCompendium/workspace/`. Start
  state: `v2` on `sc297-menu-panels-site` @ `84608f494c`; superproject @ `cd53f9567655`.

## 2. Part A — rebase (do this FIRST, before any fix, so the fixes are made on the merged base)

1. In the worktree's `v2` clone: `git fetch origin`. Confirm `origin/main` is at or beyond
   `e83421a61d` (report the exact sha). `git rebase origin/main`. Expect conflicts in
   `docs/javascripts/sc-pins.js` and/or `sc-pins-core.js` (SC-177 changed them; round 4
   rewrote the mount to go through `SCChrome`). Resolve so that BOTH hold: SC-177's behaviour
   (read its two commits' messages and diffs first: `git log --oneline f9347707dd..origin/main`)
   AND this branch's rule that the pin mounts only via `SCChrome.anchor()` into the plate and
   mounts nothing when `panel()` is null. If SC-177 added a second mount site for the pin (a
   "My Table" / section-excerpt context), keep it — the plate rule applies to card pages only.
   Write down every conflict hunk and how you resolved it in the report.
2. In the worktree superproject: `git fetch origin`, report `origin/main`'s sha, then
   `git rebase origin/main`. Expected conflicts: `DESIGN.md` (pinboard row in the component
   table), `CHANGELOG.md` (main gained `## 2026-09-05 — My Table section excerpts (SC-177)`;
   keep that dated section as main has it, and keep this branch's `## Unreleased` bullets
   above it), and the `v2` submodule pointer (take this branch's rebased `v2` tip, never
   main's). After the rebase run `git submodule update --init -- draw-steel-elements steel-etl
   data-gen data-sdk-npm compendium statblock-adapter-gl-pages steelCompendium.github.io` so
   the other pins move to what main now carries (this is how the stale `draw-steel-elements`
   pin resolves — do NOT `git add` any submodule other than `v2`). Report every pin before and
   after.
3. Footgun (adapter §8.4): after the superproject rebase, doc-reading tests may see the new
   workspace docs; that is the intent here, not a phantom.
4. `npm ci` in `v2` if `package.json`/lockfile changed in the merge (adapter §8.2).

## 3. Part B — the three round-5 findings (reviewer's words, verbatim)

> **MEDIUM** — `v2/docs/stylesheets/steel-statblock.css:52-53` (+ 4 siblings): the CSS H1-hide
> predicate was not given the `p.sb-backlink` alternation, so the 3 minion pages are card pages
> to the JS and plain pages to the CSS. Measured on razor: `h1` `display:block`, `<hr>`
> `flow-root`, `h1Text="Razor"` and `cardName="Razor"` — visible duplicate title, the defect
> round 2b existed to fix. Fix: add `.md-typeset > h1:first-child:has(+ hr + p.sb-backlink + .sb-wrap),
> .md-typeset > h1:first-child + hr:has(+ p.sb-backlink + .sb-wrap) { display: none; }` and add
> the 3 pages to `page-titles.e2e.cjs` CASES.
>
> **LOW** — `DESIGN.md:186` still states the strict `h1+hr+card` adjacency the delta relaxed.
>
> **LOW** — `DESIGN.md:214` still scopes the copy-link to statblock/featureblock/ability; it is
> five families now.

Owner ruling: all three folded into this round. For the MEDIUM, apply the fix where the
existing strict H1-hide rule lives (the "+ 4 siblings" the reviewer names — keep it in ONE
place if the five are already one rule; mirror exactly if they are five). Only `.sb-wrap` has
the back-link today; do not speculatively add the alternation for other families. Add a
CHANGELOG `## Unreleased` bullet: the three retainer-minion pages no longer show their title
twice. Line numbers above are pre-rebase; re-locate by content.

## 4. Gates and evidence

- Unit: 82/82 before; after ≥82, 0 fail (SC-177 may have added tests — report the new total).
- Original e2e: 6 pass / 2 pre-existing fail (`featureblock-fixture`, `settings-panel`); if
  SC-177 added e2e files, run them too and report.
- `chrome-panel.e2e.cjs`: 245/245 (or more if you add cases; report the total).
- `page-titles.e2e.cjs`: green with the 3 minion pages added.
- Pin end to end on the merged base: pin a statblock from its card plate, open the pinboard /
  My Table page, confirm it appears; unpin; also exercise whatever SC-177's "section excerpts"
  feature does with pins, and confirm it still works. Describe what you did and saw.
- Shots to ledger `shots/`: `sc297-r6-minion-razor-title.png` (one title), `sc297-r6-pin-flow.png`
  (the pinboard showing a card pinned from the plate), `sc297-r6-statblock-dark-hover.png`
  (post-merge sanity).
- Commit in `v2` (fix commits on top of the rebased branch), then the superproject (rebased,
  with the `v2` pointer bump). Report `v2` sha, superproject sha, and `git log --oneline
  origin/main..HEAD` for both.

## 5. Footguns

- Devbox wrapper form; never pipe a gate through `tail`; per-run unique logs; foreground
  builds with output redirected; no `devbox run` from inside `v2/`.
- Never `git checkout -- .` in v2 (safe form: `git clean -fdq docs site && git checkout --
  docs/Browse docs/Read docs/scc`). During conflict resolution edit the conflicted files by
  path only.
- If the rebase goes wrong: `git rebase --abort` restores the pre-rebase state; report and stop
  with `STATUS: NEEDS_CONTEXT` rather than forcing anything. Never `push --force`, never push
  at all — landing is not yours.
- The shared main checkout's `CLAUDE.md` → `@AGENTS.md` dirt is a concurrent session's — leave it.
- You cannot message me; if blocked, end with `STATUS: NEEDS_CONTEXT` in your report.

## 6. Report and return

Append "## Round 6" to `sc297-round2-report.md` (refresh the executive summary: shas, gate
totals, conflict list). Return raw facts: verdict, both shas, `origin/main` shas you rebased
onto, every conflict hunk and its resolution in one line each, gate counts, pin-flow result,
absolute shot paths, `Drive-by fixes:` / `Follow-ups:`.
