# SC-272 decisions ledger — ds-rule Steel eyebrow shows the rule group

Worktree: /home/scott/code/steelCompendium/worktrees/sc272-rule-eyebrow (DSE branch `sc272-rule-eyebrow`, cut at origin/develop 6c4f6aa)
Owner: Fable ticket-owner. Tracker comments: none from Scott as of 2026-09-24.

## Ticket statement (description, verbatim, 2026-08-28)

> the site's rule tile types a rule by its group directory (`COMBAT`, `DICE` — `steel-etl/internal/site/cards.go:594-599`), and SC-120's `genericLayout.steel` eyebrow implements "last dot-segment of `type`, humanized" to match — but the eyebrow can never render anything except the literal `Rule`: all 153 corpus rule files carry bare `type: rule` in frontmatter, and the group lives only in the `scc:` code, which `genericNoteAdapter` never captures into `GenericNote.type`.
>
> Fix direction: have the adapter (or a `typeAdapters` entry) derive the group from the `scc:` type segment (e.g. `rule.combat` → `Combat`) so the eyebrow carries real information in by-SCC mode. SC-120 shipped the interim mitigation (eyebrow suppressed when it duplicates the card title, so inline rules don't render "RULE / RULE").

## Scott rulings

- 2026-09-25 (comment 4e24624d, answering the plural question — option 1 keep site plurals vs option 2 singular + steel-etl ticket), verbatim:
  > I think it should be singular. Go ahead and make that change and file the ticket for steel-etl
  This supersedes the plural mirror: ~~plugin mirrors steel-etl's full `typeTitles` map so rule groups read Monsters / Treasures / Negotiations (r2, HIGH-1 fold)~~ superseded by Scott 2026-09-25: singular (Monster / Treasure / Negotiation), and a steel-etl ticket for the site's rule tile.

## Session operating constraints (dispatcher, 2026-09-24)

- No tags/releases/RCs on DSE; never touch DSE `main` (tracks `develop`); no `just deploy*`.
- No freeze-baseline change without Scott's written sanction on the ticket. Frozen-byte movement => ship `rebaseline.txt` + before/after crops, and ask.
- Kill processes only by PID, and only ones whose command line contains this worktree's path (adapter footgun 8.9).
- Freeze baseline 260 lines. Rebase onto current origin/develop before LAND-READY.

## Owner rulings on follow-ups

- 2026-09-24, r1 follow-up 1 (browser shots harness has no compendium, cannot render by-SCC cards): FILED as Backlog SC-362 (out of scope for SC-272).
- 2026-09-24, r1 follow-up 2 (RULE_GROUP_TITLE_OVERRIDES drift risk for `monster`/`treasure` plurals): PENDING the r1 review's verdict on whether the site's rule tile actually uses plural `typeTitles`.
- Evidence note: owner cropped the implementer's 760x430 screenshots to the 92px card header (`evidence/sc272-header-*.png`, grid `sc272-header-grid.png`) — the standalone Playwright render shows raw `[x](scc.v1:...)` link markdown in the body (no Obsidian markdown renderer), which is a harness artifact and would mislead. No Xvfb on this machine, so no real-Obsidian capture.
- 2026-09-24, r1 review (APPROVE_WITH_FIXES, `sc272-r1-review.md`) rulings:
  - ~~HIGH-1 (missing `negotiation` → "Negotiations"; subset mirror drifted): FOLD into r2 — mirror steel-etl full `typeTitles` map, fix the test control, add an all-16-corpus-groups test.~~ superseded by Scott 2026-09-25 (singular; see Scott rulings). This also resolves r1 follow-up 2 (drift) — superseding the PENDING line above.
  - MEDIUM-1 (evidence PNGs are a jsdom-dump render: empty crest, raw link markdown): already mitigated by the owner's header crop; the Scott comment captions the method. No worker action.
  - LOW-1 (cross-family scc segment leaks into the eyebrow) + LOW-2 (trailing dot → empty eyebrow): FOLD into r2 — accept only `/^rule(\.[^.]+)+$/`, else fall back; tests for both.
  - INFO x6: drop (confirmations, no action).
  - Taste question for Scott (in the consolidated ask): the site prints plural group titles on single rule tiles (Monsters / Treasures / Negotiations) because the rule tile reuses the landing-page `typeTitles` map. Plugin matches the site by default.
- 2026-09-24 r2 fix: head 5293604 (implementer). Scoped re-review of c296c24..5293604 dispatched to the r1 reviewer (not the author).
- 2026-09-24 r2 scoped re-review: APPROVE (0 C/H/M/L). INFO 1-4 DROPPED: (1) optional extra guard test — the existing 'rule'-named test already fails under the mutation; (2) 'rule. ' empty label matches the site's own output; (3) frontmatter 'type: rule.' is pre-existing, out of scope; (4) 'rule.x.rule' shape does not exist in the corpus.
- 2026-09-24: consolidated Needs Review posted (header before/after image + plural question: option 1 keep site plurals [default, current branch] vs option 2 singular + steel-etl ticket). Ticket In Progress + Needs Review. Branch land-ready code-wise at 5293604 on origin/develop 6c4f6aa, pending Scott's answer.
- 2026-09-27: filed SC-369 (steel-etl: site rule tile singular). SC-272 -> Awaiting, Ready for Agent cleared. r3 (singular + rebase onto current origin/develop + full battery) dispatched to the implementer; scoped re-review goes to the reviewer.
- 2026-09-27 r3 (implementer): singular via plain titleCase, typeTitles mirror removed; rebased onto origin/develop 1adfe29; head 9b51c10. Gates: tsc/lint clean, lifecycle 19/19, jest 4099/1 skipped/0 failed, shots 524/0 FAIL, freeze 260/260, parity 0/0/16. Scoped re-review dispatched to the reviewer.
- r3 follow-up (sidebarEncounterHandoff "persists the id it minted" flakes under load on the 1adfe29 baseline): DROPPED here — already tracked by SC-352 / SC-327 / SC-302; not touched by this branch.
- 2026-09-27 r3 re-review: APPROVE. LOW-1 (no plugin CHANGELOG [FIX] bullet) FOLD; INFO-1 (qualify ruleCard.test.ts:148 comment, cite SC-369) FOLD; INFO-2 (contrived empty eyebrow cases, unchanged since r2) DROP; INFO-3 (evidence still valid, Combat unchanged) DROP. Folded as r4 to the implementer (docs/comment only).
- 2026-09-27 r4/r4b: CHANGELOG [FIX] bullet (top of 7.0.0 section) + test comment qualified; head 36635e9 on origin/develop 1adfe29; tsc/lint clean. Owner reviewed the docs-only delta. LAND-READY.
