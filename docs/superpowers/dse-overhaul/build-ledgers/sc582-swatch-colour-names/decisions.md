# SC-582 decisions ledger — Conditions window colour swatches announced by hex

Ticket: SC-582 (Linear, team SC). Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names (every submodule on branch `sc582-swatch-colour-names`).
Base: dse `develop` @ d0561a68; workspace origin/main @ 5d4611a3.

## Ticket text (verbatim, 2026-11-10)

> Each colour swatch in the Conditions window's row editor has an accessible name made of its hex code, for example "Color #c0392b". The colour's name is only in the hover tooltip. A screen-reader user hears hex codes. A colourblind user who relies on the label also gets a hex code instead of a name.
>
> **Expected:** the swatch's accessible name carries the colour name its tooltip shows.

Agent notes (verbatim): `src/views/ConditionsModal.ts` `renderSwatches`: `aria-label` is built from the hex; `title` has the name. SC-436 `test.failing` marker: each preset swatch's `aria-label` contains the name in its `title`. The fixer must also update tests older than SC-436 that assert the hex label: the pilot's COND-E02/E03 (`e2e/specs/initiative/conditions-pick-focus.e2e.ts:56,73`) and 4 tests in `test/dom/views/conditions-modal.test.ts`.

## Scott rulings

(none yet — no comments on the ticket as of 2026-11-12)

## Owner rulings (2026-11-12)

- O1. No Scott decision needed: the ticket states the expected behaviour.
- O2. Accessible name of a preset swatch = the colour name alone, exactly as in SWATCHES: `Red`, `Amber`, `Green`, `Blue`, `Purple`. The enclosing `role=group` is already labelled `Color`, so screen readers announce "Color" as context; repeating it or adding the hex is noise. The `title` tooltip stays `Red (#c0392b)` unchanged.
- O3. `setColor`'s focus-restore (`focusPickedOption(index, 'Color', \`Color ${hex}\`)`) must look up the swatch by its new name, via the matching SWATCHES entry (case-insensitive hex match, so a custom pick equal to a preset, or YAML `#C0392B`, still lands on the named swatch).
- O4. Custom swatch labels (`Custom color`, `Custom condition color #xxxxxx, selected`) are out of scope — a custom colour has no name.
- O5. Keep `visual-harness/mocks/sc186-entry.mjs` in sync (its mock swatch row copies the aria-label). aria-label does not paint, so shots/freeze must not move.
- O6. Changelogs: an entry in the dse `CHANGELOG.md` 7.0.0 section (as SC-609 did) and a `## Unreleased` bullet in the WORKSPACE `CHANGELOG.md` in the worktree superproject (as SC-583 did).
- O7. Related-but-not-ours: SC-581 (no way to clear a colour), SC-586 (named colour opens the chooser at white), SC-585, SC-613, SC-614, SC-617, SC-618. Do not touch.

## Rounds

- R1 (2026-11-12): implementer (orchestration:implementer, agent a1d6a1ded954b7f8b) dispatched with `sc582-brief-impl-r1.md`. Ticket set to Awaiting.
- R1 done (2026-11-12): plugin dcec985a (fix b59913b5), superproject CHANGELOG b4d0526e. jest 10762/2 fresh, lifecycle 60/60, e2e 290/293 0 failed 3 known-bug 172/172, shots 592 / 163…978 / 39-234 / clip 147, freeze 280/280, parity 0/0/24. Fix reverted: 8 jest fail. Report sc582-impl-r1-report.md.
- Review R1 dispatched (orchestration:reviewer) with sc582-brief-review-r1.md.
- Review R1 done (2026-11-12): LAND, LOW 1, INFO 3. Report sc582-rev-r1-report.md. Owner rulings:
  - LOW-1 (test (c) "(any case)" never exercises the case-insensitive lookup; jsdom lowercases the colour input): FOLD — make test (c) override the input's `value` getter to return `#1E8449` (reviewer probe P3), so a `hex === h` mutant fails it.
  - INFO-1 (matrix test comment :235 "a screen reader never gets a hex code" overstates; title remains the accessible description): FOLD — reword the comment.
  - INFO-2 (YAML upper-case colour never reaches setColor): DROP — implementer's reading correct, covered by SC-361 test.
  - INFO-3 (no leftovers): DROP — nothing to do.
- Fix R2 (implementer resume): the two folds + rebase superproject onto current origin/main + exactly one pointer bump commit.
- Base moved (2026-11-12): dse develop now 711844f3 (SC-602 landed: Live Preview focus carry, touches kit/controlFocus.ts), workspace origin/main a2c64cdd. R2 rebases the plugin branch onto 711844f3 and re-runs the FULL battery. New CURRENT at 711844f3: jest 10784/2 fresh, lifecycle 60/60, e2e 304/307 0 failed 3 known-bug 174/174, shots 592 / 163…978 / 39-234 / clip 147, freeze 280/280, parity 0/0/24.
- Fix R2 done (2026-11-12): plugin dcc53f0f on 711844f3 (e7ac41b1 fix, 6607a2a9 dse CHANGELOG, dcc53f0f test fold); superproject 54ddb2ea on origin/main a11ad144 (8a4b6ece CHANGELOG, 54ddb2ea single bump). jest 10788/1 (cache), lifecycle 60/60, e2e 304/307 0 failed 3 known-bug 174/174, shots 592 / 163…978 / 39-234 / clip 147, freeze 280/280, parity 0/0/24. Mutant hex===h now fails test (c). Report sc582-impl-r2-report.md.
- Scoped re-review R2 (same reviewer identity as R1, not the author) (2026-11-12): LAND, 0 findings beyond INFO (workspace main moved docs-only to 91a05435; trivial rebase). range-diff b59913b5 = e7ac41b1; mutant fails test (c). Report sc582-rev-r2-report.md.
- Chore: rebase superproject branch onto current origin/main.
- Superproject rebased (chore) onto origin/main 91a05435: ad6914b5 CHANGELOG, 4e79049f single bump to dcc53f0f; status clean.
- LAND-READY (2026-11-12): plugin dcc53f0f on develop 711844f3; superproject 4e79049f on main 91a05435. Land-ready comment posted. Ticket stays Awaiting until the dispatcher lands; then Done via linear-post.py --state Done.
