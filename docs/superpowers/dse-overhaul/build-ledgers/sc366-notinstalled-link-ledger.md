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

## Follow-up: the left stripe (2026-10-21)

Scott ruling, 2026-10-21 (comment 87f8b5fb), verbatim:
> "Colors look good.  For the left-stripe,  i thought those were banned in the design.  Can we get those removed?"

~~Owner: "stripe teal" offered as an option~~ superseded by Scott's ruling above — neither "close" nor "stripe teal"; REMOVE the stripe.

Owner decisions:
- The ban is DESIGN.md rule 7 (SC-132, 2026-08-10): "No decorative colored left-borders ... banned for new work ... Existing components that ship one today may stay for now but **will be replaced**". Scott is asking that this one be replaced now.
- Scope: `.dse-ref-notice`'s `border-left: 3px solid var(--color-blue)` (styles-source.css ~495 on develop bc4a0c5). That class is shared by BOTH ds-scc degrade cards (the not-installed card `.dse-ref-web-card` and the `renderRefNotice` notice card), so both lose the stripe. Replacement per rule 7's "borders-all-around": the card keeps its existing 1px `--background-modifier-border` on all four sides and its `--background-secondary` ground — no new accent device. Update the SC-149 CSS comment that justifies the "informational blue accent".
- Out of scope: other left-stripes still on develop (`.dse-error-card` red stripe ~416; role/tier/act stripes ~3009, 3524, 5211, 7018, 9891). They fall under rule 7's "will be replaced" and are named to Scott in the land-ready comment, not touched here.
- Worktree: `sc366-stripe-remove` (dispatcher suggested `sc366-stripe-teal` for the teal outcome; renamed to match the ruling), off dse develop bc4a0c5.
- Baselines (dispatcher, 2026-10-21): jest 5457 / 1 skipped / 232 of 233, lifecycle 30/30, e2e 89/93 with 4 known-bug and 64/64, shots 580, freeze 280/280, parity 0/0/24.
- stripe r1 impl: orchestration:implementer (agent adaa2c090ad9cfdc5), brief sc366-brief-stripe-impl-r1.md, worktree sc366-stripe-remove @ bc4a0c5. Ticket -> Awaiting, labels [DSE Plugin] (Ready for Agent removed). Reviewer must be a different identity (prior reviewer ae7523fd8f89310a8 is eligible: did not author this).
- 2026-10-21: dse develop moved bc4a0c5 -> 772c3cd (SC-457). Implementer told to rebase + full battery. New baselines: jest 5536 / 1 skipped / 233 of 234, lifecycle 31/31, e2e 89/93 4 known-bug 64/64, shots 580, freeze 280/280, parity 0/0/24.
- stripe r1 impl result: dse e025dd2 (on 772c3cd), superproject CHANGELOG 82382a2. Battery: jest 5538/1/233 of 234, lifecycle 31/31, e2e 89/93 0 failed 4 kb 64/64, shots 580 0 FAIL, freeze 280/280, parity 0/0/24. Owner eyeballed sc366-stripe-after-notinstalled-light.png: uniform 1px border, no stripe, teal link intact.
- stripe review: resumed reviewer ae7523fd8f89310a8 (not the author).
- 2026-10-21 ~19:08Z: owner + reviewer killed by session-limit 429; reviewer resumed after reset with state-check. dse develop now 8d075db — land-ready must be on 8d075db+. Plan: reviewer finishes checks 1-5 on e025dd2 (no gates); then implementer adaa2c090ad9cfdc5 rebases onto 8d075db + full battery; then reviewer scoped confirm (jest+parity+range-diff).
- stripe review r1: APPROVE, 0 HIGH/MED, 1 LOW, 3 INFO (report sc366-report-stripe-review-r1.md). Owner rulings:
  - LOW-1 (stripe test misses inset box-shadow / ::before bar): FOLD into rebase round — also reject `box-shadow: inset` and pseudo-element rules on the card roots. Keep it small; skip 4-value border-width and gradients.
  - INFO-2 (CHANGELOG "Print is unchanged." now contradicts; line too long): FOLD — owner-written reworded bullet in the r2 message.
  - INFO-1 (illustrative hint in notice crop): DROP — border evidence unaffected; Scott comment doesn't claim the hint text.
  - INFO-3: no action.
- stripe r2: resume implementer adaa2c090ad9cfdc5: rebase onto 8d075db + LOW-1 + INFO-2 + full battery. Then scoped confirm by reviewer ae7523fd8f89310a8.
- 2026-10-21: develop moved 8d075db -> 95981f1 (SC-432). Implementer retargeted: dse rebase onto 95981f1 + superproject rebase onto origin/main. Baselines: jest 5582/1/234 of 235, lifecycle 31/31, e2e 95/98 0 failed 3 known-bug 66/66, shots 580, freeze 280/280, parity 0/0/24.
- stripe r2 impl result: dse 8d890f9 (89087cf stripe + 8d890f9 LOW-1 test checks) on develop 95981f1; superproject 76c24a2 (284e5e4 + 76c24a2) on origin/main 383ec3f. Battery: tsc/lint clean, jest 5585/1/234 of 235, lifecycle 31/31, e2e 95/98 0 failed 3 kb 66/66, shots 580 0 FAIL, freeze 280/280, parity 0/0/24. Scoped confirm -> reviewer ae7523fd8f89310a8.
- stripe scoped confirm: APPROVE, 0 HIGH/MED/LOW, INFO-4 (pseudo check also trips on descendant ::after rules) -> DROP, loud failure, none exist today.
- LAND-READY (stripe): dse sc366-stripe-remove @ 8d890f9 on develop 95981f1; superproject 76c24a2 on origin/main 383ec3f. Ask posted to Scott (can it close; offer ticket for remaining left stripes).
- 2026-10-21 LANDED (stripe): dse develop 8d890f9, workspace merge 0124590; worktree sc366-stripe-remove removed. Ticket stays In Progress + Needs Review awaiting Scott: close? + ticket for remaining left stripes?
