# SC-255 r3 fix round — report

## Executive summary
- **Verdict: DONE.** All 8 findings the ledger assigned to r3 (MEDIUM-1, LOW-1 partial, LOW-2,
  LOW-3, LOW-4, LOW-5, LOW-6, INFO-3) are fixed. Comments/docs/tests only — no production
  behaviour change, and none was expected.
- **DSE final sha:** `4ff0b88` on branch `sc255-skills-collapse` (base `cbbb190`, itself on
  `origin/develop` `6c4f6aa` — unchanged; `git fetch origin` confirmed develop had not moved).
- **Superproject sha:** none — INFO-3's target file (`docs/superpowers/sc169-element-menu-panel-spec.md`)
  lives inside the `draw-steel-elements` submodule, not the workspace superproject, so no
  superproject commit was needed or made.
- **Gates:** tsc clean; lint clean exit 0; jest **3998 passed / 1 skipped / 206 of 207 suites /
  3 snapshots** (base 3996 + the 2 new LOW-6 tests); lifecycle **6/6 ok, 0 failed**, exit 0;
  shots **524, 0 FAIL**; freeze **FREEZE VIOLATED (20 checksum mismatches, 0 missing)**, exit 1,
  exactly the 20 names in `rebaseline.txt`; parity **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0.
- **Rebaseline hash diff:** all 20 shots hash **byte-identical** to `rebaseline.txt` — this
  round moved zero pixels, as expected for a comments/docs/tests-only round.
- **Out of scope, confirmed untouched:** SC-364 (`resolveCollapsePrefs` /
  `ComponentWrapper.declaredCollapsePrefs`), `src/prefs/catalog.ts`, `src/model/ComponentWrapper.ts`;
  INFO-1, INFO-2, INFO-4 (owner ruled no work).

## Per-finding detail

### MEDIUM-1 — false "no SessionPersist" claim
Commit `e9780d3`. `src/elements/skills/view.ts:11` and the whole-element-collapse describe
block's header comment in `test/dom/elements/skills.test.ts` (~lines 180-186) both said the
removed wrapper "passed no SessionPersist". Corrected to state it persisted at SessionStore
slot `open`, and that chrome's own `chrome.collapsed` persistence predates SC-255 too.
Retitled `test/dom/elements/skills.test.ts`'s test from `'IS session-tracked now: a remount
with the same blockKey remembers the user toggle'` to `'the chrome collapse persists across a
remount (same blockKey)'` and rewrote its body comment to say both mechanisms persisted before,
chrome is now the only one.

### LOW-1 (partial) — dead `resolveCollapsePrefs` reference in skills.test.ts only
Commit `e9780d3`. Fixed only `test/dom/elements/skills.test.ts:74-77` (the `makeDeps` comment
claiming `SkillsView now resolves collapsible/collapse_default through resolveCollapsePrefs`),
which SC-255 made false. Rewrote it to say the framework chrome layer reads those prefs now,
not SkillsView. `resolveCollapsePrefs` / the `ComponentWrapper.declaredCollapsePrefs` side
channel itself, and every other stale reference the review listed
(`.repo-docs/architecture.md:396`, `kit-lifecycle.test.ts:58-61`, `stamina-bar.test.ts:67-70`,
`pref-overrides.test.ts:7,428`), were **not** touched — SC-364, filed separately, out of scope.

### LOW-2 — remaining stale "whole-element wrapper" comments
Commit `e9780d3`.
- `src/elements/skills/definition.ts:1-4`: "whole-element wrapper" → "whole-element chrome".
- `test/dom/elements/skills.test.ts:1-4`: dropped "the whole-element wrapper AND each skill
  group are kit collapsible regions"; now describes only the per-group collapsible and notes
  the whole-element collapse is the framework chrome panel (SC-255), also SessionPersist-backed
  but its own slot.
- `styles-source.css:3395`: dropped "(and the whole-element wrapper)" from the "Group headers
  ... are the kit collapsible" sentence.
- `test/dom/framework/chromeRound2.test.ts:460-463`: reworded — the un-popped-keys reason is
  now only "popping would let ComponentWrapper substitute defaults", not "the model still
  parses them for its own ComponentWrapper wrapper".
- `test/dom/framework/chromeRound2.test.ts:473`: "removes the collapse control and the inner
  wrapper" → "removes the collapse control" (there is no more inner wrapper).

### LOW-3 — the removed header is "Skill List", not "Skills"
Commit `20b188c`. `CHANGELOG.md` (7.0.0 entry) and `docs/skills-element.md` (the "Changed in
7.0.0" callout, ~line 38) both said the removed header was called "Skills"; the rendered
constant was `WRAPPER_TITLE = 'Skill List'`. Both corrected to "Skill List".

### LOW-4 — CHANGELOG tag + practical-effect wording
Commit `20b188c`. Prefixed the CHANGELOG entry `[FIX]` to match every neighbouring 7.0.0 entry's
convention, and added the practical effect: "a block that starts collapsed now opens with one
click on the element menu instead of two, since the redundant second header no longer hides
the list behind its own closed state." Mirrored the equivalent sentence into
`docs/skills-element.md`'s callout while touching it for LOW-3 (same finding's practical
consequence, same location already under edit).

### LOW-5 — delete the fake "before" shot
Deleted (no commit — `.superpowers/` is gitignored, confirmed via `git check-ignore`):
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/before/chrome-skills-menu--steel-dark.png`.
Confirmed byte-identical (md5sum match) to the `after/` copy before deleting. Nothing else
under `before/` was touched.

### LOW-6 — pin the one-click-expand fix as a real test
Commit `5724710`. Added two tests to the "whole-element collapse = FRAMEWORK CHROME" describe
block in `test/dom/elements/skills.test.ts` (promoted from r2's probe file P1 and P6/h3):
- `'collapse_default: true -> ONE click on the chrome control shows the list (no second hidden
  layer)'`
- `'collapsed: false + collapse_default: true -> not collapsed and the list is visible
  (declared collapsed: false beats the model default)'`

Both were verified both ways, per the brief:
- **Branch (`4ff0b88`):** both pass — `sc255-r3-logs/low6-branch-run.log`
  (`Tests: 23 skipped, 2 passed, 25 total`).
- **Base `view.ts` restored** (`git show 6c4f6aa:src/elements/skills/view.ts >
  src/elements/skills/view.ts`, ran the same 2 tests, then `git checkout --
  src/elements/skills/view.ts`): both **fail** —
  `sc255-r3-logs/low6-base-revert-run.log` (`Tests: 2 failed, 23 skipped, 25 total`), each on
  `expect(root.querySelector('.dse-skills')?.closest('[hidden]')).toBeNull()` finding the list
  still under a `hidden` ancestor. `view.ts` was confirmed restored to the branch version
  (`git status --short` showed only the test file modified) before committing.

### INFO-3 — mark the sc169 spec's open item resolved
Commit `4ff0b88`. `docs/superpowers/sc169-element-menu-panel-spec.md` lives inside the
`draw-steel-elements` submodule (confirmed by `find`), not the workspace superproject, so this
was a normal DSE-branch commit — no superproject edit was needed. §9c item 2 and the §10
`ds-skills` paragraph (~lines 543-547, 600-606) both still called "`ds-skills` still has two
collapse mechanisms" an open item (FOLLOWUPS #76). Both marked `RESOLVED by SC-255`, with the
header's name corrected to "Skill List" in passing (same sentence already under edit).

## Drive-by fixes
None. This was a comments/docs/tests-only round; every edit above is a fix the brief
explicitly named (or, for the "Skill List" naming correction touched in the same sentence as
INFO-3, a trivial consistency fix inside a location LOW-3 already required editing for the
identical wording issue — not an independent finding).

## Follow-ups
None new. SC-364 (delete `resolveCollapsePrefs` + the `ComponentWrapper.declaredCollapsePrefs`
side channel) was already filed by the owner before this round and remains out of scope here.

## Gate log paths (all under `sc255-r3-logs/`)
- `tsc-1.log` — clean, exit 0
- `lint-1.log` — clean, exit 0
- `jest-1.log` — `3998 passed / 1 skipped / 206 of 207 suites / 3 snapshots`, exit 0
- `lifecycle-1.log` — `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0
- `shots-1.log` — 524 `ok` lines, 0 FAIL, all in-run gates OK (chrome placement, montage,
  host-leak sweeps ×6, print-twin delta, nested corner-radius)
- `freeze-1.log` — `FREEZE VIOLATED (20 checksum mismatches, 0 missing)`, exit 1; the 20 names
  match `rebaseline.txt` exactly (`rebaseline-names-sorted.txt` vs
  `freeze-1-mismatch-names-sorted.txt`, diff empty)
- `r3-hashes-run1.txt` / `rebaseline-sorted.txt` — the 20 shots' sha256 hashes from this run vs
  `rebaseline.txt`, **diff empty** (byte-identical)
- `parity-1.log` — `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0
- `low6-branch-run.log` — the 2 new LOW-6 tests, branch: 2 passed
- `low6-base-revert-run.log` — the 2 new LOW-6 tests, base `view.ts` restored: 2 failed
  (proves they pin real behaviour)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r3-logs/`.

## Working tree state at handoff
`draw-steel-elements` worktree (`/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`):
`git status --short` clean, on branch `sc255-skills-collapse` at `4ff0b88`, 4 commits ahead of
`cbbb190`. `main.js`/`styles.css` present at the plugin root as untracked, gitignored build
artifacts (produced by the gate runs; harmless, not part of the diff). No stray processes
under `worktrees/sc255-skills-collapse/` at handoff (`pgrep -af` empty). Never pushed, per the
brief.
