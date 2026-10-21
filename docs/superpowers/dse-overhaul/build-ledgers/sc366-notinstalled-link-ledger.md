# SC-366 decisions ledger — "View on steelcompendium.io" link colour in the not-installed card

Worktree: /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link (branch sc366-notinstalled-link in every submodule)
dse base: develop @ 188755b
Ticket-owner: Opus 5.5 (session be71a0a9-199f-4e14-967b-191935312b05)

## Scott rulings (verbatim, dated)

(none yet — the ticket thread is empty as of 2026-10-20)

Ticket description (Scott-filed, 2026-10, from SC-317), verbatim ask:
> "Decide whether this link should use the plugin's link colour, then add `.dse-ref-notice` (or the link class) to the colour family. Visual change: needs a crop for review."

## Owner decisions

- 2026-10-20 (owner): YES, the link uses the plugin's link colour. Every other plugin-drawn link in DSE content uses the `.dse-card a` / `.dse-feature a` family (`--dse-accent`, teal-cyan); a lone host-coloured link inside a plugin card is the inconsistency the ticket names. Scope: add the link class (`.dse-ref-web-card__link`) to that family — the narrowest selector, so the notice card's other text is untouched. Must mirror the family's exact gating (steel theme, not print) and its :hover rule. Scott's eye on the before/after crop is the gate.
- Concurrency: SC-422 (text-scale CSS) and SC-326 (montage board CSS) edit styles-source.css concurrently — keep the CSS edit to this one link.

## Rounds / authorship
- r1 impl: orchestration:implementer (agent af020d37dd4be9b09), brief sc366-brief-impl-r1.md, dispatched 2026-10-20. Reviewer must be a different identity.
- r1 impl result: dse 365b08b, full battery green at CURRENT numbers, freeze 276/276 (card is in no frozen shot; no rebaseline). Owner eyeballed sc366-compare-dark.png: link + arrow go host purple-blue -> teal-cyan; card text unchanged.
- r1 review: orchestration:reviewer (agent ae7523fd8f89310a8), brief sc366-brief-review-r1.md.
- Owner note for Scott's ask: the card's 3px left stripe is `--color-blue` by deliberate SC-149 design ("informational blue accent") — after this change the card pairs a blue stripe with a teal-cyan link. Out of scope by default; ask Scott in the same consolidated ask whether to leave it.
- r1 review result: APPROVE, 0 HIGH / 0 MED / 2 LOW / 4 INFO; reviewer re-ran full battery at 365b08b, all CURRENT numbers. Report sc366-report-review-r1.md.
- Owner rulings on findings (2026-10-20):
  - LOW-1 (new selector (0,3,0) is one step below the family's (0,3,1)): FOLD into fix round r2 — write it `a.dse-ref-web-card__link` / `a.dse-ref-web-card__link:hover`.
  - Reviewer's "cheaper alternative" jest pin (selector present in both family rules, in the style of headingEmphasisLinkHostRegrounding.test.ts): FOLD into r2 — today removing the selector passes every gate.
  - Permanent harness fixture for both degrade cards: FILED SC-469 (Backlog, low). OUT OF SCOPE for r2.
  - LOW-2 (implementer crops unlabelled): use the reviewer's labelled crops sc366-review-r1-compare-{dark,light}.png for Scott. No code.
  - INFO-1/2/3: no action. INFO-4 (stale line-number comments ~18680/19026/19057 elsewhere): DROP — pre-existing, not this diff, and SC-422/SC-326 are editing the same file.
- r2 fix: resume implementer af020d37dd4be9b09. r2 scoped re-review: resume reviewer ae7523fd8f89310a8 (not the author).
- r2 fix result: dse ba20072 (on 365b08b). Selector `a.dse-ref-web-card__link`; new test/dom/theme/notInstalledLinkColour.test.ts (3 tests, bite-proven). Battery: tsc/lint clean, jest 5260/1/230 of 231, lifecycle 27/27, e2e 83/87 0 failed 4 known-bug 57/57, shots 572 0 FAIL, freeze 276/276, parity 0/0/24. Crops pixel-identical to r1 after.
- r2 scoped re-review: resumed reviewer ae7523fd8f89310a8 on delta 365b08b..ba20072.
- r2 re-review: APPROVE, 0 HIGH/MED/LOW, 2 INFO (test strict on banner wording/quote style; end-anchor banner text duplicated at :15333). Owner: DROP both — strictness matches the sibling test, correct today.
- LAND-READY: dse sc366-notinstalled-link @ ba20072 (base develop 188755b). Ask posted to Scott (link look + whether blue left stripe should go teal).
- 2026-10-21: dispatcher blocked landing for a missing CHANGELOG bullet; chore worker (a46d5a4cd6ad48d65) adding owner-written bullet under ## Unreleased in the worktree superproject (pointer left unstaged, no push).
- CHANGELOG commit: superproject e117f47 (worktree sc366-notinstalled-link), pointer unstaged, not pushed.
- 2026-10-21 LANDED: dse develop ba20072, workspace merge 0fac4d4 (CHANGELOG e117f47). Ticket kept In Progress + Needs Review: Scott's look check and stripe question still open; landed-notice comment posted.
