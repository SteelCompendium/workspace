# SC-626 decisions ledger — Montage: keyboard focus drops to the page after every write or strip toggle

Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05
Worktree: /home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write
  (superproject at workspace origin/main 7aae3668; dse branch sc626-montage-focus-after-write @ develop f6e504c7)
Lifecycle id reserved if needed: G-S123

## Ticket requirement (from the SC-626 description, 2026-11-14 — no Scott comments on the ticket yet)

> A keyboard user tabs to a montage button (for example End round) and presses Enter. The write lands,
> the card is redrawn, and keyboard focus is gone: it sits on the page, not on the button. The same
> happens when the round strip is opened or closed, and when a montage window closes after it wrote.
> The user has to tab back from the top of the note after every action.
>
> Expected: focus returns to the same control after the redraw (or to its nearest equivalent when the
> control no longer exists).

> A fix must cover Reading view AND Live Preview.

Markers to flip to plain tests: e2e `[MONT-F01]`..`[MONT-F04]` (`e2e/specs/montage/focus.e2e.ts`),
jsdom `[K03]` (`test/dom/elements/montage-matrix.test.ts`).

## Scott rulings

(none yet)

## Owner decisions

- 2026-11-14: No decision needed from Scott up front — the ticket states the expected behaviour.
  "Nearest equivalent" mappings are the implementer's to propose and document; reviewer probes them.
  If a mapping turns out to be a genuine taste call, ask Scott then.
- 2026-11-14: Follow the prior-art rule from SC-614 / SC-585 / SC-613: focus is restored only when it
  was inside the card (or the window that wrote) before the action; a write with focus elsewhere
  (outside edit, file-change re-render, click while focus is outside the card) never pulls focus in.

## Rounds

- r1 implementer (Sonnet, agent a23e143ddb54351d1): fix + tests + battery. Brief: sc626-brief-r1-implementer.md. Dispatched 2026-11-14.
- 2026-11-14: Dispatcher: new baseline — SC-615 landed; dse develop a5313f9d, workspace main bf79f688. Numbers at
  a5313f9d: jest 12133 passed / 1 skipped (shots cache) · lifecycle 64/64 · e2e `424/437 ok, 0 failed, 13 known-bug,
  coverage: 233/233 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 · freeze 280/280 ·
  parity 0/0/24. Must rebase dse onto a5313f9d and superproject branch onto current workspace main (one pointer bump)
  before land-ready. Sent r1 implementer a rebase instruction mid-round (its branch was at 11185b4c, 4 commits).
- 2026-11-14: r1 DONE on dse 11fbded6 (rebased on a5313f9d). jest 12166/2 fresh, 12167/1 cached; e2e 437/446 ok,
  0 failed, 9 known-bug, coverage 235/235; lifecycle 64/64; shots 592 / 163/978 / 40/240 / 147; freeze 280/280;
  parity 0/0/24. G-S123 unused. Open taste calls (implementer chose conservative):
  (1) End round on the last round -> focus on "Back to round N"; (2) Remove on the round-in-play cell -> that
  socket's first quick button. Owner ruling: accept both (each lands on the control that undoes or continues the
  action); mention them in the closing comment so Scott can redirect. Follow-ups: generic framework focus hand-back
  (not filed: each element owns its rebuild, prior art agrees) and SC-608-style outside-edit window close for montage
  -> owner to decide after review.
- r2 reviewer (Opus): brief sc626-brief-r2-reviewer.md, head 11fbded6.
- 2026-11-14: Follow-up rulings on r1: (a) generic framework focus hand-back -> DROP: each element owns its rebuild
  and the kit helper is already shared; not worth a ticket. (b) montage windows stay open across an outside edit
  (initiative fixed this in SC-608; no montage ticket exists, checked) -> rule after r2 review says whether the
  open window then writes stale data; file a Backlog ticket linking SC-626 if it does or if focus is lost there.
- 2026-11-14: r2 reviewer (Opus, agent a958622fd3351ebcf) LAND on 11fbded6: 0 CRIT / 0 HIGH / 0 MED / 1 LOW / 6 INFO;
  full battery re-run matches r1 (jest 12167/1 cached; lifecycle 64/64; e2e 437/446 ok, 0 failed, 9 known-bug,
  235/235; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24). Vacuity: 23 jsdom red, 11/13 MONT-F red
  under revert; 3 mutants red. Both flagged mappings judged fine for keyboard users.
  Rulings: LOW-1 (outside edit with a window open closes it, focus to body, no stale write) -> FILED SC-650 (Backlog,
  related SC-626/SC-608). INFO-2 (comment wording view.ts:89-91) -> DROP, behaviour correct, comment nit.
  INFO-3 (initiative not opted into controlFocusRules for LP carry) -> DROP, no observed bug, behaviour unchanged.
  INFO-4 (skill text stale) -> skill proposal file sc626-skill-proposal.md for the dispatcher.
  Mapping (2) Remove on round-in-play cell -> first quick button: mention in the closing comment (Enter there now
  logs a Success instead of opening the sheet; one Undo away) so Scott can redirect.
- Next: r3 chore — superproject branch onto workspace origin/main, CHANGELOG bullet + one pointer bump.
- 2026-11-14: r3 chore (Haiku) DONE: superproject branch ff'd to origin/main 42a14300, then 70f5c408 (CHANGELOG bullet,
  text in sc626-changelog-bullet.md) and 313b6ffb (pointer bump dse -> 11fbded6). origin/main..HEAD = exactly those 2.
  Not pushed. Land-ready comment posted on SC-626 (mentions mappings 1 and 2 as redirectable; no Needs Review —
  no ask blocking landing). Reported LAND-READY to the dispatcher. Skill proposal: sc626-skill-proposal.md.
- 2026-11-14: DONE. Dispatcher landed: dse develop 11fbded6, workspace main fa7c9875 (ledger preserved, dse-verify
  proposal applied in 7399aa94, worktree removed). Done comment posted and state set via linear-post.py --state Done;
  verified Done. Follow-up open: SC-650 (Backlog).
