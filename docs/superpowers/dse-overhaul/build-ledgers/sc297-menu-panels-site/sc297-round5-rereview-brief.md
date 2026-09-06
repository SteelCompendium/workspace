# SC-297 round 5 brief — scoped re-review of the round-4 fix delta

You are the SC-297 independent reviewer (you wrote the round-3 review). This is a **scoped
re-review of the round-4 delta only** — not a fresh full pass. **You never call the tracker.**

## 1. Context

- Ledger `decisions.md` (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/`):
  read the "Round 3" owner rulings — especially the binding design ruling on the single
  discriminator — and the "Round 4" section.
- Your own report `sc297-round3-review-report.md` (the findings you are closing) and the
  implementer's `sc297-round2-report.md` → "## Round 4" (what it claims to have done).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`; `v2` on
  `sc297-menu-panels-site` @ `84608f494c194bbebfe5747adf9862738e11ccf1` (superproject
  `cd53f9567655`). Delta under review: `3c733f312f..HEAD`. Verify
  `pwd` before any write; never write under `/home/scott/code/steelCompendium/workspace/`.
  Leave the branch as you found it.

## 2. What to verify (execute and measure, do not just read)

1. Each of your findings HIGH-1, HIGH-2, MEDIUM-1, MEDIUM-2, MEDIUM-3, LOW-1..4: closed, or
   not, with the measurement that proves it. Re-run your `r3-affordance` / `r3-gatecrawl`
   probes against a fresh build of the fixed branch: the only pages that lose a copy-link
   versus base `f9347707dd` must be Read chapters; every Browse leaf card page has exactly one
   affordance (the plate); the three `retainer/summoner/minion/{razor,gorrre,violent}` pages
   carry a full plate and nothing in the head; no page has both `.sc-pageact` and a plate, no
   card page has neither.
2. The design ruling is honored structurally: grep the four consumers and `sc-pageact.js` for
   any remaining private card-finding selector; there must be none — every card lookup goes
   through `SCChrome`.
3. The gate now asserts plate contents per family and includes the minion pages; falsify one
   content assertion yourself (drop a button from one family's expected set, or hide the
   copy-link in the gitignored `v2/site/` build copy) and confirm a named FAIL; revert.
   Expected green count: **245/245**. The implementer's own falsification (dropping `sc-kit`
   from `cardKind`) produced exactly 2 named FAILs — pick a different mutation.
3b. **The implementer's one change beyond the findings** (owner-accepted pending your
   check, ledger → "Round 4"): phone-width reserved top space in `steel-chrome.css` moved
   from `2.1em` to `2.5em` because the plate measures 44px and `2.1em` fell 4.1px short.
   Verify at 375px on all five families plus one minion page that the reserved space ≥ the
   plate's rendered height and the plate does not overlap the element above; verify desktop
   geometry is unchanged (10.00px right gap, 0.00px bottom delta); and check that no doc on
   the branch (`DESIGN.md`, `v2/.repo-docs/*`, CSS comments) states `2.1em` as the site's value.
   Note: the minion pages' plate is copy-link + MD/PNG + pin — they have no EV chip, so no
   encounter-add; that is correct, not a finding.
4. Regression sweep limited to the delta's blast radius: one card page per family (hover,
   rest, phone, print), one Read chapter, one plain page with `.sc-pageact`, instant-nav
   card→card (exactly one plate), PNG export on one minion page (no stray chips).
5. Gates re-run by you: unit 78/78 (or the round-4 count, 0 fail), original e2e 6/8 with the
   same two pre-existing failures, `chrome-panel.e2e.cjs` all green.

Out of scope (do not report): SC-298 (kit export island), the two pre-existing e2e failures,
the stale `draw-steel-elements` pin (dispatcher's, at landing), the shared main checkout's
`CLAUDE.md` → `@AGENTS.md` dirt.

## 3. Footguns

Devbox wrapper form; never pipe a gate through `tail`; per-run unique logs; never
`git checkout -- .` in v2 (revert individual probe edits by path; keep mutations in the
gitignored `v2/site/` copy as you did before); no `devbox run` from inside `v2/`; foreground
builds with output redirected. You cannot message the ticket-owner; if blocked, end with
`STATUS: NEEDS_CONTEXT` in your report. If the report write is blocked, return it inline.

## 4. Report and return

`sc297-round5-rereview-report.md` in the ledger dir, ≤10-line executive summary first:
verdict (APPROVE / FIX ROUND NEEDED), per-finding closed/open, measured counts, any new
finding by severity with file:line (only if introduced by the delta). Return raw facts and
every artifact path.
