# SC-255 r1 — implementer report

## Executive summary

**DONE.** Final sha `4ff0b88` on branch `sc255-skills-collapse` (base `6c4f6aa`). Removed
`ds-skills`' own whole-element kit `collapsible()` wrapper (the "Skill List" header); the
SC-169 framework chrome panel is now the only whole-element collapse, matching `ds-stamina`.
Full battery green at final HEAD: tsc clean, lint clean, jest **3998 passed / 1 skipped / 3999
total** (206/207 suites, 3 snapshots), `obsidian-lifecycle` **6/6 ok**, shots **524 PNGs / 0
FAIL**, freeze **20/20 failing = exactly the 10 Skills capture ids × print+realprint, 0
non-skills lines moved**, parity **0 gaps / 0 undeclared / 16 declared / exit 0**. Rebaseline
deliverable is deterministic across 2 clean sweeps. Two review/fix rounds (r2 review, r3 fix
— see §6) already landed on this same branch correcting three comment/doc inaccuracies in my
r1 work and adding 2 regression tests; final numbers above are measured against that corrected
HEAD, not my original `cbbb190`.

## 1. Diff summary by file

Production:
- `src/elements/skills/view.ts` — deleted the `collapsible()` whole-element wrapper from
  `onMount` (the `WRAPPER_OPEN_SLOT`/`WRAPPER_TITLE` constants, the `resolveCollapsePrefs`
  call, and the branch that built it); `renderGroups(root, model)` now runs unconditionally.
  Removed the now-unused `resolveCollapsePrefs` import. Header comment rewritten to describe
  the SC-255 change and why (the framework chrome panel already wrapped every `ds-skills`
  block via `chrome: skillsChrome`, so the view's own wrapper was a second, independent
  collapse stacked underneath it).
- `src/elements/skills/definition.ts` — comment-only: updated the `collapseKeysOwnedByModel`
  doc comment to say `SkillsView` no longer reads these keys itself.

Docs:
- `docs/skills-element.md` — Field Definitions intro rewritten with a "Changed in 7.0.0" note
  (stamina-bar.md's pattern): the header is gone; `collapse_default:`/`collapsible:` behavior
  is unaffected; the menu always shows on `ds-skills` because of its own eye toggle; a
  collapsed block now opens with one click, not two.
- `docs/common-element-fields.md` — dropped the stale carve-out sentence calling out
  `ds-skills` as keeping a second header alongside the menu.
- `docs/superpowers/sc169-element-menu-panel-spec.md` — (r3 commit `4ff0b88`, not mine)
  marked the SC-169 spec's open item ("`ds-skills` still has two collapse mechanisms",
  FOLLOWUPS #76) resolved by SC-255.
- `CHANGELOG.md` — one `[FIX]` bullet added under the unreleased `## 7.0.0` section, following
  the existing SC-169/SC-282/SC-328 bullet convention, naming the removed header correctly
  ("Skill List") and stating the practical effect (one click to expand instead of two).

Tests:
- `test/dom/elements/skills.test.ts` — replaced the 5-test "whole-element wrapper = kit
  collapsible" describe block with a 4-test (then +2 in r3 = 6-test) "whole-element collapse
  = FRAMEWORK CHROME" describe block, mirroring `stamina-bar.test.ts`'s SC-169 precedent:
  mounts straight onto root; `collapse_default: true` starts collapsed via the panel;
  `collapsible: false` removes the collapse control but the panel itself still mounts (the
  SC-182 eye toggle is its own chrome item, unlike `ds-stamina`); the toggle is now
  session-tracked across a remount. r3 added two more tests pinning the one-click-to-expand
  fix.
- `test/dom/framework/pref-overrides.test.ts` — re-pointed the `collapsibleDefault` pref
  ladder test from `.dse-collapse` presence to `[data-dse-chrome-item="collapse"]` presence;
  the ladder itself (block key > global pref > default) is unchanged.
- `test/dom/framework/chromeRound2.test.ts` — (r3, not mine) dropped a stale "whole-element
  wrapper" phrase in a comment.

## 2. Behaviour-change list (user-visible)

- **The "Skill List" disclosure header is gone.** A `ds-skills` block used to show TWO
  collapse affordances (the element menu's collapse control, and this header underneath it).
  Now there is one, the same as every other card element.
- **`collapse_default: true` still starts the element collapsed** — now expressed as the
  panel's one-line summary (`SKILLS (N selected)`) instead of a closed inner header. No
  behavior change to the authored default; only the collapsed FORM changed.
- **`collapsible: false` still removes the collapse control** — no behavior change (both the
  old wrapper and the chrome panel already independently honored this key before SC-255;
  removing the wrapper doesn't change what `collapsible: false` does). The panel itself still
  always shows on `ds-skills` because the block always contributes its own SC-182
  "hide/show unowned skills" eye toggle as a chrome item — unlike `ds-stamina`, which has no
  chrome items of its own and so loses the whole panel under `collapsible: false`.
  `ds-skills` never loses its panel.
- **The whole-element collapse toggle is now session-persisted across a remount** in exactly
  the same way it already was — the old wrapper ALSO persisted at SessionStore slot `open`
  (this was a factual error in my r1 write-up, corrected by r3; see §6). The real,
  previously-untested user-visible fix: **a block that starts collapsed now opens with ONE
  click on the menu instead of two** — before, expanding the outer chrome panel still left
  the list hidden behind the inner wrapper's own closed state.
- **Per-group collapse (Crafting/Exploration/...) is unchanged.**
- **Title/heading visibility:** the "Skill List" text is gone from the DOM entirely (it was
  never a heading, just the wrapper's disclosure button label).

## 3. Global collapse prefs (`collapseDefault` / `collapsibleDefault`)

Unaffected in composition — they already reached `ds-skills` through chrome before this
change (chrome was already mounted on `ds-skills` prior to SC-255, per `chrome: skillsChrome`
in `definition.ts` and the pipeline's unconditional `if (def.chrome)` mount). What changed is
only that `resolveCollapsePrefs` (the view's OWN, separate reading of the same prefs for its
now-deleted wrapper) is gone — one less redundant reader of the same three-tier ladder
(block key > global pref > default), same ladder, same result. Verified by
`pref-overrides.test.ts`'s rewritten `collapsibleDefault` ladder test (still green).

## 4. Freeze — exact failing list (final HEAD, `freeze-final.log`)

```
FREEZE VIOLATED (20 checksum mismatches, 0 missing)
chrome-skills-menu--steel-print.png
chrome-skills-menu--steel-realprint.png
skills-chips-hidden--steel-print.png
skills-chips-hidden--steel-realprint.png
skills-chips-narrow--steel-print.png
skills-chips-narrow--steel-realprint.png
skills-chips--steel-print.png
skills-chips--steel-realprint.png
skills-hero-picks--steel-print.png
skills-hero-picks--steel-realprint.png
skills-ledger-hidden--steel-print.png
skills-ledger-hidden--steel-realprint.png
skills-ledger-narrow--steel-print.png
skills-ledger-narrow--steel-realprint.png
skills-ledger--steel-print.png
skills-ledger--steel-realprint.png
skills-narrow--steel-print.png
skills-narrow--steel-realprint.png
skills--steel-print.png
skills--steel-realprint.png
```

Exactly the 20 lines the ledger predicted (10 capture ids × print twin + realprint, including
`chrome-skills-menu` and both `-hidden` ids). Every other line in the 260-line baseline
matched. Reproduced identically on a fresh `check-freeze.sh` run against the final HEAD's
shots (`freeze-final.log`) as well as the intermediate run (`freeze-after-1.log`) — same 20
names both times.

SC-349 note: the Skills captures stop at 2400px, so the lower skill list is not byte-covered.
The header removal does not change what falls inside the 2400px window — it REMOVES ~50-70px
of vertical space at the TOP of the render (the deleted header + its padding), which shifts
everything below it up by that amount but does not change how much total content fits in the
fixed 2400px capture height; nothing that was inside the window moves outside it or vice
versa purely from this change (confirmed by eye against the crops in `crops/`).

## 5. Rebase base / gate numbers

- Rebase base: `origin/develop` = `6c4f6aa` (matched exactly; no rebase needed, worktree was
  already current). `npm ci` was required (fresh worktree had no `node_modules` at all, not
  just a version mismatch) — 760 packages installed, exit 0 (`npm-ci.log`).
- Base (pre-change, `6c4f6aa`) measured myself: jest **3997 passed / 1 skipped / 3998 total**,
  206 suites (`jest-before-1.log`, obtained via `git stash` around the base measurement).
  Freeze at base: **260/260**, exit 0 (`freeze-before-1.log`).
- Final HEAD (`4ff0b88`) battery:
  - `npm run tsc` — clean, exit 0 (`tsc-final.log`)
  - `npm run lint` — clean, exit 0 (`lint-final.log`)
  - `npx jest` — **3998 passed / 1 skipped / 3999 total**, 206 of 207 suites, 3 snapshots,
    exit 0 (`jest-final-2.log`; `jest-final.log`'s first attempt had one unrelated failure —
    `sidebarEncounterHandoff.test.ts`, a debounced-write timing assertion, under measured
    1-min load 17.19 — confirmed a load-flake: green alone (`jest-retry-sidebar.log`) and
    green in the immediate full-suite re-run at load 14.75). Net +1 vs base (3997→3998): my
    r1 replaced 5 old-wrapper tests with 4 chrome tests (net −1), r3 added 2 more (net +2) =
    +1 overall.
  - `npm run obsidian-lifecycle` — `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0
    (`lifecycle-final.log`, private port 9274 — port 9262 was owned by a concurrent effort).
  - `npm run shots` — **524 PNGs, 0 FAIL** (unchanged from base's 524; no new fixtures added),
    print-twin delta OK on 130 capture ids both full runs (`shots-after-1.log`,
    `shots-after-2.log`).
  - `check-freeze.sh` — 20 failing (§4 above), exit 1 as expected for an unapplied rebaseline;
    every other of the 260 lines OK.
  - `npm run parity` — **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0
    (`parity-final.log`).
- No production/CSS bytes changed between my last commit (`cbbb190`) and final HEAD
  (`4ff0b88`) — verified `git diff cbbb190 HEAD -- src/elements/skills/view.ts
  src/elements/skills/definition.ts` has zero non-comment/non-blank line changes, and the
  `styles-source.css` r3 diff is a comment-only edit. The shots/freeze/parity results
  captured at `cbbb190` therefore remain valid evidence for `4ff0b88`; tsc/lint/jest were
  re-run fresh at `4ff0b88` since test files did change.

## 6. Concurrent review/fix rounds already landed on this branch

While I was building the rebaseline/crop evidence (shots + narrow before-capture), a review
round (r2, not mine, artifacts at `sc255-r2-logs/` I did not produce) and a fix round (r3, 4
commits: `e9780d3`, `20b188c`, `5724710`, `4ff0b88`) landed directly on this same branch/
worktree on top of my `cbbb190`. I did not request or expect this — it appears the
ticket-owner or another agent proceeded from the visible commit/artifact state before my
report existed. The r3 commits are legitimate corrections to my r1 work:

- **MEDIUM-1 (real error in my work):** my `view.ts`/`skills.test.ts` comments claimed the
  removed wrapper "passed no SessionPersist" (copied from the `ds-stamina` precedent's
  language without checking `ds-skills`' actual old code, which DID have
  `persist: { session: ..., blockKey: ..., slot: WRAPPER_OPEN_SLOT }`). Fixed.
- **LOW-1 (partial):** a stale test comment claiming `SkillsView` still resolves collapse
  prefs via `resolveCollapsePrefs`. Fixed (the ComponentWrapper side-channel mechanism itself
  is out of scope, filed as SC-364).
- **LOW-2:** leftover "whole-element wrapper" phrasing in comments across 4 files. Fixed.
- **LOW-3 (real error in my work):** I named the removed header "Skills" in CHANGELOG.md and
  docs/skills-element.md; its actual rendered title (the `WRAPPER_TITLE` constant) was
  **"Skill List"**. Fixed.
- **LOW-4:** tagged the CHANGELOG entry `[FIX]` per the file's convention and named the
  practical one-click-vs-two-click effect.
- **LOW-6:** promoted two review probes into permanent tests pinning the one-click-to-expand
  fix (confirmed to fail against base `6c4f6aa` view.ts and pass on the branch).
- **INFO-3:** marked the `sc169-element-menu-panel-spec.md` open item (FOLLOWUPS #76)
  resolved.

None of these touched production DOM/CSS (confirmed, §5). I re-ran tsc/lint/jest/freeze/
parity against the resulting final HEAD myself (§5) rather than trusting the r3 commits'
own claims uninspected.

## 7. Drive-by fixes

None — the header-title and "no SessionPersist" corrections above were made by the r3 round,
not by me in passing; I'm reporting them under §6 for traceability rather than claiming them
as my own drive-by fixes.

## 8. Follow-ups

- `test/dom/framework/kit-lifecycle.test.ts`'s `makeDeps()` comment (for `ds-stam`, unrelated
  to skills) still says "StaminaBarView now resolves collapse_default through
  resolveCollapsePrefs" — stale since SC-169 removed that call from `ds-stamina` too. Not
  touched (not a file this task edited, not skills-related, cosmetic only).
- `resolveCollapsePrefs`/`declaredCollapsePrefs` (the ComponentWrapper ladder side-channel
  itself, `src/prefs/catalog.ts`) is now unused by both `ds-stamina` and `ds-skills`'s views
  — its only remaining callers may be test-only. Not investigated further; r3's commit
  message flags the same area as filed under SC-364. Worth the owner confirming SC-364's
  scope covers it.

## 9. Evidence artifacts (absolute paths)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r1-impl-report.md`
- Rebaseline: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/rebaseline.txt`
- Before shots (20 print/realprint + 9 steel-dark): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/before/`
- After shots (20 print/realprint + 10 steel-dark): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/after/`
- Crops: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/crops/sc255-skills-steel-print-before-after.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/crops/sc255-chrome-skills-menu-steel-print-before-after.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/crops/sc255-skills-ledger-steel-print-before-after.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/crops/sc255-skills-steel-dark-before-after.png`
- Gate logs directory: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r1-logs/`
  (key files: `tsc-final.log`, `lint-final.log`, `jest-final-2.log`, `lifecycle-final.log`,
  `shots-after-2.log`, `freeze-final.log`, `parity-final.log`, `jest-before-1.log`,
  `freeze-before-1.log`, `skills-hashes-run1.txt`/`skills-hashes-run2-final.txt` (determinism
  proof, byte-identical))

## 10. Commits (branch `sc255-skills-collapse`)

- `8dc12b6` feat(skills): SC-255 remove ds-skills' own whole-element "Skills" collapse header (mine)
- `c4e6e8b` test(skills): SC-255 re-point wrapper coverage at chrome behaviour (mine)
- `cbbb190` docs(skills): SC-255 drop the "Skills disclosure header" from the docs (mine)
- `e9780d3` fix(skills): SC-255 r3 (MEDIUM-1, LOW-1 partial, LOW-2) — correct stale wrapper comments (not mine)
- `20b188c` docs(skills): SC-255 r3 (LOW-3, LOW-4) — name the removed header correctly, tag+detail the entry (not mine)
- `5724710` test(skills): SC-255 r3 (LOW-6) — pin the one-click expand fix as a real test (not mine)
- `4ff0b88` docs(skills): SC-255 r3 (INFO-3) — mark the sc169 double-collapse open item resolved (not mine)

Final: `4ff0b88`. Not pushed (per brief instruction).
