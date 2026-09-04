# SC-119 — decisions ledger

Ticket: SC-119 "Kit Browse tile: unify absent-bonus formatting to dashes (matches the detail
page and SC-100's plugin design)". Owner session: 4931eaaf-23fa-45a6-9d71-eaf64645d32d
(Fable ticket-owner, started 2026-09-04).

Effort worktree: `/home/scott/code/steelCompendium/worktrees/sc119-kit-dash-format`
(branch `sc119-kit-dash-format` in every submodule).

## Provenance

The fix was first implemented 2026-08-23 as commit `d0e8c67` on the shared branch
`sc11x-kit-trio` (worktree `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio`),
sandwiched between SC-116 (`c31e701`, before) and SC-115 (`6415f04`, after). Prior report:
`.superpowers/sdd/sc11x/sc11x-report.md` §"SC-119". Files: `steel-etl/internal/site/cards.go`
(+13/-26), `steel-etl/internal/site/cards_test.go` (+39). Gate at the time: go build / vet /
test clean; verified against a regenerated real kit index (Boren tile `0 0 0 0` → `— — — —`).

That branch is 5 behind steel-etl `origin/main` as of 2026-09-04 and carries the other two
tickets' work, so SC-119 lands from its own worktree: `d0e8c67` cherry-picked onto current
`origin/main`, re-gated, reported land-ready independently of SC-115/SC-116.

## Scott's rulings (verbatim, dated)

- **2026-08-29 11:11 UTC** (Linear comment on SC-119, replying to the 2026-08-23 "Done"
  report describing `d0e8c67`): "approved, land it"

## Owner rulings

- ~~**2026-09-04** — Land SC-119 as an isolated cherry-pick of `d0e8c67` onto steel-etl
  `origin/main` in worktree `sc119-kit-dash-format`, not as part of the `sc11x-kit-trio`
  branch.~~ **Superseded 2026-09-04 by the dispatcher's redirect** (below). The
  `sc119-kit-dash-format` worktree had already been created and an implementer dispatched
  for the cherry-pick; the implementer was told to abort with no commits, and the worktree
  is torn down (`just wt-rm sc119-kit-dash-format`) once it confirms clean.

- **2026-09-04, dispatcher redirect (verbatim):** "SC-116's owner reports your ticket's work
  already exists on a SHARED worktree `sc11x-kit-trio` ... Scott's ruling on all three is
  'approved, land it' (2026-08-29). SC-116's owner is running review + rebase on that shared
  worktree right now and will report land-ready for the whole trio — one landing covers all
  three tickets. Do NOT create or touch a separate sc119-kit-dash-format worktree."

- **2026-09-04** — SC-119 therefore lands as part of the trio landing run by SC-116's owner
  (ledger `.superpowers/sdd/sc116-kit-kind-frontmatter/decisions.md`; Opus review round 1
  covers `d0e8c67` at lower depth, report `sc116-review-r1.md`). SC-119 owner's remaining
  duties: rule on any SC-119-specific review findings; the SC-119 CHANGELOG `## Unreleased`
  bullet (text handed to SC-116's owner to add in their fix/rebase round — copy in
  `sc119-changelog-bullet.md` here); post SC-119's land-ready comment once the trio is
  declared land-ready, citing the post-rebase sha; then Done follows the dispatcher's landing.

- **2026-09-04, cherry-pick round outcome (discarded).** The implementer completed the
  cherry-pick before the abort reached it: steel-etl `9e10381` on `sc119-kit-dash-format`,
  gates green, Boren all-8-dash and Shining Armor real bonuses verified on a regenerated index
  (report: `sc119-round1-report.md`). **Not patch-identical to `d0e8c67`**: `cards.go`
  conflicted and needed `_` → `keywords`, because `d0e8c67` was written on top of SC-116's
  frontmatter-first `kind` logic and `origin/main` still keyword-sniffs. That confirms the
  approved commit is coupled to SC-116, so the trio landing is the correct path on the merits,
  not only by the dispatcher's direction. The commit was archived as
  `sc119-discarded-cherrypick-9e10381.patch` here, steel-etl reset to `c7d6940`, and the
  worktree removed with `just wt-rm sc119-kit-dash-format`. Nothing was pushed.
  - Follow-up from that round — `gofmt -l internal/site/` flags 5 pre-existing unrelated files
    (`class_page_test.go`, `companion_statblock.go`, `feature_index.go`, `kit_page_test.go`,
    `statblock_card_test.go`): **DROP** — pre-existing, not touched by SC-119, fixed by any
    future `just fmt` in steel-etl; not worth a ticket.

- **2026-09-04, land-ready state (verified by owner, read-only, in the trio worktree).**
  steel-etl `sc11x-kit-trio` rebased onto `origin/main` `d6bb008`; SC-119's commit is now
  `71002ce` — `git patch-id --stable` identical to `d0e8c67` (`f25e6682…`), so it is exactly
  the change Scott approved. Branch HEAD `81263e9` (order `2785608` SC-116 → `71002ce` SC-119
  → `83513bc` SC-115 → four SC-115/SC-116 fix+docs commits, none touching SC-119's files).
  CHANGELOG bullet present verbatim at superproject `b297b1d`. Opus review round 1
  (`sc116-review-r1.md`): no SC-119 finding; its regenerated kit index probe shows 109
  `<div class="v">—</div>` and zero `0` values. The one HIGH was SC-115's `build.go` reorder,
  fixed in `96406f7`; scoped re-review running under SC-116's owner, who reports the trio
  land-ready to the dispatcher. SC-119 land-ready comment posted; ticket flips Done when the
  dispatcher reports the trio landed.
  - **Final trio state (SC-116 owner, 2026-09-04, after scoped re-review + mutation-probe
    round):** steel-etl HEAD `093da29` (one test-only commit on top of `81263e9`); SC-119
    commit unchanged at `71002ce`; v2 `f9347707dd`; data-sdk-npm `a4ce584`; superproject
    `b297b1d`. Trio reported land-ready to the dispatcher. The posted SC-119 comment cites
    HEAD `81263e9` in its for-the-record list — carry the final sha into the Done note rather
    than posting a correction for a tip-only change.

- **2026-09-04, SC-116 owner's confirmation (verbatim):** "agreed on all three. (1) `d0e8c67`
  rebases intact; any SC-119-specific review finding stays unfixed by me and is left under an
  'SC-119' heading in `.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r1.md` for
  your ruling (any fix you later want goes in its own `(SC-119)`-tagged commit). (2) Your
  CHANGELOG bullet goes in verbatim next to the SC-116 bullet in the same fix round — one
  commit, no second editor. (3) The land-ready report to the dispatcher will carry the
  post-rebase sha of the SC-119 commit and the final steel-etl branch sha; I will also
  message you those directly when the fix round returns."
