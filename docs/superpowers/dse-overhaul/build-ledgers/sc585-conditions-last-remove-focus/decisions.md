# SC-585 decisions ledger — Conditions window: keyboard-removing the last condition with the Add search open drops focus to the page body

Worktree: `/home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus` (branch `sc585-conditions-last-remove-focus` in every submodule), cut from dse `develop` @ `2074a152` on 2026-11-13.

## Ticket (2026-11-13, Backlog → In Progress by owner)

Description (verbatim excerpts):
> If you remove the last condition with the keyboard while the Add search is open, keyboard focus is lost: it lands on the page body, and the Add search stays open with nothing focused. A keyboard user has to click back into the window.
> **Repro (real Obsidian):** open the Conditions window on a creature with two conditions. Remove one. Click "+ Add condition", press Shift+Tab (focus moves to the remaining condition's trash button; the search stays open), press Enter. The condition is removed and focus goes to the page body.
> **Expected:** focus stays inside the window (for example on the open search's input). The SC-186 focus contract is "never the page body".
> Agent notes: `src/views/ConditionsModal.ts` `removeAt` (l.349-350) focuses `.dse-condal__add`, which does not exist while the combobox is open. Keyboard activation sends no `mousedown`, so the outside-close (l.188-210) never arms. Fix direction: when the list empties with the combobox open, focus its input. SC-436 marker: after the removal, `document.activeElement` is inside the modal and is not `<body>` (fix-agnostic).

No Scott ruling on the thread (0 comments at start). Severity LOW (accessibility).

## Owner rulings

- 2026-11-13 (owner): **No Scott decision needed.** The ticket's Expected + fix direction settle the shape.
- 2026-11-13 (owner): **Fix shape** — when a removal empties the list while the Add search is open, the search stays open and keyboard focus goes to the search's input (`.dse-condal__input`); its typed text is kept. When the search is closed, behaviour is unchanged (focus "+ Add condition"). Removing a non-last condition is unchanged (focus the row that shifted in / the previous row's cog). Sweep every other path that focuses `.dse-condal__add` and apply the same rule wherever it can run with the search open.
- 2026-11-13 (owner): Out of scope — SC-586, SC-613, SC-614 (other Conditions window bugs, queued after this); the `test.failing('SC-586 …')` marker next to ours stays failing.
- 2026-11-13 (owner): No lifecycle scenario (no write-lifecycle change); G-S111 not used.

## Base moves

- 2026-11-13 (dispatcher): SC-612 landed — dse `develop` now **`1f1ae442`**, workspace main **`b65036cc`**. Rebase onto `1f1ae442` (superproject branch onto current workspace main, ONE pointer bump) before land-ready. New CURRENT: jest **11788 passed / 2 skipped** fresh without the shots cache · lifecycle **62/62 in SEVEN parts** (the six plus part 7 `G-S108` alone, ~67 s; G-S108 sits after G-S99 and before G-S56 in SCENARIOS order) · e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24 carry. SC-612 touched ReadingModeBlockHost.ts and lineMap.ts, no Conditions window code.

## Rounds

- r1 implementer (orchestration:implementer) — brief `sc585-r1-brief-implementer.md`.
- r1 DONE (2026-11-13): dse `7b87b74d` on `1f1ae442` (fix `4ba9116d`), superproject `ce7298cb` (CHANGELOG only, old base). Gates: jest 11795/1 with cache (11794/2 fresh), lifecycle 62/62 (7 parts), e2e 331/334 ok 0 failed 3 known-bug 176/176, shots 592 / 163/978 / 40/240 / 147, freeze 280/280, parity 0/0/24. New e2e `[COND-R07]`.
- Owner ruling on r1 follow-up (stale "known bugs (each marker … fails today)" describe title in conditions-modal-matrix, now holding the passing SC-581/SC-585 tests): fold into a fix round if one happens (rename/move); otherwise drop — a naming nit, not a ticket.
- r2 reviewer (orchestration:reviewer) — brief `sc585-r2-brief-reviewer.md`.
- r2 review (2026-11-13): LAND-READY, 0 HIGH / 0 MED / 1 LOW / 4 INFO. Report `sc585-r2-review-report.md`.
- Owner rulings on r2 findings (2026-11-13):
  - LOW-1 (CHANGELOG last clause wrong for bottom-row removal) → **fold** into r3: use wording equivalent to "…moves focus to the next condition (or the one above it, if you removed the bottom one)".
  - INFO-1 (stale "known bugs" describe title) → **fold**, retitle only (keep the SC-585 marker test; jest count unchanged); SC-581's test may move to the colour section if trivial.
  - INFO-2 (Escape test l.601-608 passes on base) → **fold**: assert the input has focus before Escape.
  - INFO-3 (mouse removal with search open still closes the search and focuses "+ Add condition") → **drop**: unchanged SC-474 click-outside rule, never `<body>`.
  - INFO-4 (superproject on old base; CHANGELOG conflict with SC-612 bullet) → **fold** into r3: rebase superproject onto current workspace origin/main, keep both bullets, ONE pointer bump to the final dse sha.
  - Reviewer's note on main-checkout dse dirt (`demo-vault/Welcome.md`, `demo-vault/montage 1.md`, `compendium-manifest.json`) → **drop**: Scott's live vault, expected per adapter §5.
- r3 fix round → resume r1 implementer. Scoped re-review of the delta → r2 reviewer.
- r3 DONE (2026-11-13): dse `3a5986d3` on `1f1ae442`; superproject `dbd7a210` on origin/main `6630f0e5` = `99c70cdf` CHANGELOG + `dbd7a210` one pointer bump. tsc/lint clean, jest 11795/1 (cache), INFO-2 assertion fails without fix.
- r4 scoped re-review of the r3 delta → r2 reviewer resumed.
- r4 scoped re-review (2026-11-13): LAND-READY. INFO-5 (SC-585 bullet sits below SC-612's in `## Unreleased`) → **drop**: harmless ordering, no reader impact; not worth a round.
- LAND-READY (2026-11-13): dse `3a5986d3` on develop `1f1ae442`; superproject `dbd7a210` on workspace main `6630f0e5` (CHANGELOG `99c70cdf` + one pointer bump `dbd7a210`); both bases re-verified current at report time. Reported to dispatcher.
- DONE (2026-11-13): landed by dispatcher — dse develop `3a5986d3`, workspace main `f159848a` (ledger-preserve commit `22732287`; worktree removed). Linear SC-585 → Done via linear-post.py, state verified.
