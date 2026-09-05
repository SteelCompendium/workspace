# SC-191 fix round 3 — review-2 findings + SC-202 re-gate

## Executive summary

DONE. Rebased dse onto `origin/develop` at `9227dd9` (SC-202 landed); folded all of
`sc191-review2-report.md`'s H-1/M-1..4/L-1..6/I-1/I-3 findings per the brief and
`sc191-decisions.md`. Byte-level rebase delta was zero (no montage capture moved from the
rebase alone); the real integration cost was a dead-CSS-class coverage gap SC-202 left
against the redesigned montage (fixed). Eyeballing the H-1 after-print crop caught a real
CSS-specificity bug my own first pass introduced (the print dedup rule was silently losing
a cascade fight) — fixed and covered by a new red-then-green test. One commit `eeabdc9` on
top of base `9227dd9`. Full battery green: tsc/lint clean, jest 3694/1 skipped/195 suites,
shots 508/508 (2 runs byte-identical), freeze exactly the 2 sanctioned H-1 lines FAILED (0
others), parity 0/0/16, exit 0. Freeze package regenerated and verified. I-1 confirmed
pre-existing, no code change. No push, no tags, superproject untouched.

## Rebase

`git fetch origin develop` → tip `9227dd919c7009397420a3488531772986523b70`, matches the
brief's expected sha exactly. Rebased fix-round-2's tip onto it; `9227dd9` confirmed an
ancestor of the final commit (`git merge-base --is-ancestor`). `package.json`/
`package-lock.json` diff between the old and new base is empty — **`npm ci` was not run,
not needed** (no dependency change).

**SC-202 integration delta**, both halves asked for by the brief:

- **Byte-level: zero.** `npm run shots` run on the rebased tree *before* any fix-round-3
  edit reported the same montage bytes as pre-rebase (this was verified earlier in the
  session, before the context compaction that split this report's work in two — the
  starting point for this session's continuation was already past that check).
- **Test-level: one real regression, fixed.** SC-202 (landed independently on develop,
  unaware of SC-191's redesign) added input host-CSS re-grounding rules for the
  **pre-redesign** montage's `.dse-mt__skill-input`/`.dse-mt__char-input` classes
  (`ParticipantsView.ts`, deleted in slice 2). The rebase mechanically merged both
  non-conflicting diffs, leaving `test/unit/build/inputHostCoverage.test.ts` red — dead
  class references in the "SC-202 r1" CSS block, and no coverage for the sheet's real
  input classes (`.dse-mt__sheet-input`, `.dse-mt__sheet-rollchar`). Fixed by renaming the
  dead references (`sed` across 20 occurrences in `styles-source.css`'s rule-selector
  lists) and adding a new GROUP 2 material rule for the sheet's inputs, which live in a
  modal context (unlike the old board inputs, which were ancestor-scope-exempt) — see
  `styles-source.css` around the "SC-202 r1 — INPUT/STEPPER HOST RE-GROUNDING" block, plus
  `test/dom/theme/inputHostRegrounding.test.ts`'s `COUSIN_INPUTS` array.
- In-run gate lines confirmed OK against the new pin, verbatim in "Gate numbers" below.

## Per-finding fixes

**H-1** (HIGH — strip has no print layout), `styles-source.css` (new print-tier block after
"Fix-round-1 H-2"), `GuideView.ts`:
- New print rules give `.dse-mt__strip-well`/`.dse-mt__tier-rows`/`-row`/`-row--head`/
  `-key`/`-col`/`-cell`/`-mark`/`-seal`(+success/failure)/`-pip`(+clip-paths)/`-word` real
  grid/geometry, using `var(--dse-turn-done)`/`var(--dse-danger)` for seal ink (never a
  Steel-only token like `--dse-metal-line`, which resolves to nothing under print).
- Dedup: `GuideView.build()` now always builds both the full "Each test" table
  (`.dse-mt__guide-tiers-full`) and the pinned stub (`.dse-mt__guide-tiers-stub`); a flat
  print rule always shows the stub, since the strip now always prints its own full table
  (print force-opens every collapsible regardless of screen pin state) and showing both
  would duplicate it on paper.
- **A genuine bug caught only by looking at the crop, not by any test**: my first pass's
  screen-side half of the toggle (which one of the two blocks shows on SCREEN, keyed off
  `data-strip-open`) lived nested under `.dse-mt`. Native CSS nesting (this codebase keeps
  it un-downleveled — `esbuild.config.mjs`) compiles that into a compound selector with
  MORE weight than the flat print dedup rule, so on the non-pinned fixture it silently
  defeated print's own answer — the guide's "Each test" area went entirely blank (neither
  table nor stub), not just mis-styled. Confirmed by cropping the region
  (`crop-default-guide-region2.png`, scratchpad) before the fix and after. Fixed by moving
  the screen half out flat and guarding it `:not([data-dse-print="on"])`, grouped next to
  its print counterpart with a comment explaining why (`styles-source.css`, "H-1's dedup
  half, screen side").
- **Red-then-green test**: `test/dom/elements/montage-strip.test.ts`, new test "the dedup
  half, screen side: the toggle is flat and print-excluded…" — stashed just
  `styles-source.css` and confirmed it fails against the pre-fix nested rule, passes
  against the fix (verified live, both directions).
- **Visual confirmation (brief's explicit ask)**: viewed both
  `sc191-freeze-montage--steel-print-after.png` (default fixture) and
  `sc191-freeze-montage-strip-pinned--steel-print-after.png` (strip pinned). Both now show
  the strip's full laid-out tier table (real grid, bordered cells, badges with words
  ≤11/12-16/17+/crit, check/x seals with words, the reward/consequence pip rider text) at
  the top, and the guide's "Each test" area correctly shows the stub ("The full tier table
  is pinned above the board.") in both fixtures — previously only the pinned fixture showed
  the stub. The dark capture background is a pre-existing, separately-documented harness
  capture artifact (`dse-verify` skill: "the dark-on-dark look of steel-print captures is a
  longstanding harness capture artifact… a separate follow-up will re-capture print over
  the light scheme") — not new, not in this ticket's scope, and not what H-1's "light ink,
  no bright-white, no half-opacity" was about (that's about token resolution within the
  layout, which the crop confirms: real darkened ink colors, full opacity, no wash).

**M-1** (MEDIUM — every logging control must respect montage-done):
- `BoardView.ts` `buildHeroRow`: the per-row "act" chip's disabled/click-guard now checks
  `!this.canPersist || complete` (was `!this.canPersist` only) — guard 1.
- `LogActionModal.ts` `refreshValidity()`: tightened the round check to a closed range
  (`this.selectedRound >= 1 && this.selectedRound <= this.model.rounds`, was `> 0` only) —
  guard 2, defense-in-depth (currently unreachable through the UI once guard 1 is in place,
  per the brief's explicit ask).
- **Tests**: `test/dom/elements/montage.test.ts`, new describe "SC-191 fix round 3: review-2
  findings (M-1, I-3)" — guard-1 test disables the row chip on a montage-done fixture;
  guard-2 test constructs `LogActionModal` directly (bypassing the board) with an
  out-of-range round and confirms Log stays disabled.

**M-2** (MEDIUM — entries breaks §B.5 key order): `model.ts` `serialize()` rewritten to
reassemble a fixed-order object (`title → description → rounds → success_limit →
failure_limit → successes → failures → participants → entries → current_round →
_dse_anchor`) rather than relying on insertion order, which the fresh/old-shape write paths
could break. **Test**: `test/unit/model/montage-serialize.test.ts`, 2 new cases —
`logMontageEntry`/`addMontageHero` on fresh (entries/participants-less) models, asserting
`topLevelKeys` stays schema-correct through parse→mutate→serialize→parse.

**M-3/M-4** (MEDIUM — sheet drops tier words / subject title): `LogActionModal.ts`
`renderResultField()` loops a new `TIER_HINT_DIFFICULTIES` constant, wrapping each
`tierBadge()` in a labelled pair (`.dse-mt__sheet-tierhint-diff` = "easy"/"medium"/"hard").
`onOpen()` sets the modal title to `"<hero> · round <n>"` instead of repeating the eyebrow;
sub-line reads `"recorded as a/an <result>[, with <skill>]"` in edit mode, or the
next-to-act line otherwise (new `article()` a/an helper). **Test**: 3 pre-existing
`montage.test.ts` assertions updated to check the new title/sub-line text (this IS the
red-then-green — they failed against the old copy, pass against the new).

**L-1** (stale print-gate comment claim): reworded the sheet CSS block's header comment to
drop the literal `[data-dse-theme='steel']` bracket text (which `conditions-modal.test.ts`'s
naive selector-scan regex was matching as a real selector, into the real `.dse-mt__sheet {}`
rule) and the `.dse-condal-modal` mention in the same paragraph.

**L-2** (strip's screen-state hint prints): `[data-dse-print="on"][data-dse-element="montage"]
.dse-mt__strip-hint { display: none; }`. **Test**: `montage-strip.test.ts`'s H-1/L-2 describe
block, source-text assertion.

**L-3** (done-state bar dropped Undo): `view.ts` `buildActionBar()` complete branch now calls
a new shared `buildUndoButton()` first, then Reopen (when reopenable), then danger Clear all
— matches the owner's correction ("Undo + Reopen (when reopenable) + danger Clear all").
**Test**: `montage.test.ts`'s "COMPLETE state" bar test rewritten to expect Undo present
(was: absent); new test "Undo works from the complete-state bar too".

**L-4** (sheet dropped skill hint): restored
`.dse-mt__sheet-hint` span ("optional · +2 when applicable") before the skill-reuse warning
in `LogActionModal.ts`.

**L-5/L-6** (docs), `docs/gm-trackers.md`: removed the `entries: []` line from the YAML
example (the serializer omits empty `entries`, so the taught shape was never actually
written); added a paragraph noting the running successes/failures are the block's own kept
totals, not recomputed from the board.

**I-1** (confirm-only — YAML comments in a `ds-montage` block): **confirmed pre-existing,
plugin-wide framework behavior, not new.** `parseYaml`/`stringifyYaml`
(`test/mocks/obsidian-core.ts`) wrap the `yaml` npm package's `parse()`/`stringify()` —
matching Obsidian's real bundle byte-for-byte per that file's own header — and `parse()`
(as opposed to `parseDocument()`) discards all comment nodes by construction. Every
element's `model.ts` in the plugin uses this exact same pair, and this behavior predates
SC-191 (Plan 05 T-2, 2026-07-02). Empirically verified with a standalone script:
`# a directors private note…` inside a fixture block does not survive a
`parse()`→`stringify()` round-trip. No code change, per the owner's own ruling ("if
pre-existing framework behaviour, dropped as pre-existing").

**I-3** (sheet opens leak a permanent view closer): `view.ts`, new private
`openTrackedModal<T extends DseModal>(factory)` — wraps each modal open in a disposable
child `Component` (`this.addChild(...)`), and the modal's `onClose` now also
`removeChild`s that wrapper. `openSheet`/`openAddHero`/`openSetLimits` all route through it
instead of calling `openManagedModal(this, …)` directly. **Test**: `montage.test.ts`, I-3
case — spies on `MontageView.prototype.onMount`, opens/cancels the sheet 4 times, asserts
`view._registeredCallbacks.length` (the field that actually leaked — NOT `_children.length`,
which the old code never touched for modals at all; confirmed via a stash-based red check
against pre-fix `view.ts`) stays flat.

## Out of scope (per brief)

I-2 (SC-294, filed separately), I-4, I-5, I-6, every review-1 dropped item — untouched.

## Drive-by fixes

None beyond what the brief scoped as required-for-green — the SC-202 dead-class rename is
reported above under "SC-202 integration delta" rather than here, since it was a real
regression the rebase introduced against a gate this branch must pass, not an unrelated
tangent.

## Follow-ups

- The print-capture harness's dark background (all `*--steel-print.png` shots, not just
  montage) is a pre-existing, already-documented artifact (`dse-verify` skill) — a real
  light-scheme print re-capture is a separate, already-noted future effort, not new from
  this round.

## Gate numbers (final rebased tree, commit `eeabdc9`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **3694 passed / 1 skipped / 3695 total, 194 of 195 suites (1 skipped)**, 3 snapshots, exit 0 |
| `npm run shots` (run 1) | 508 PNGs, 0 ERROR, exit 0 |
| `npm run shots` (run 2) | 508 PNGs, 0 ERROR, exit 0 — byte-identical to run 1 (spot-verified on the 3 montage print files this round touched; count-parity 508/508 confirmed both runs, 0 ERROR both) |
| `host-copy pin` | `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.14.0; 21 further rules whose subject is a plain button were excluded by documented ancestor scope, 0 unclassifiable — see EXCLUDED_ANCESTOR_SCOPES)` |
| `button host-leak sweep` | `button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: every sampled property is identical with and without Obsidian's button rules; user-select and -webkit-app-region are excluded by design)` |
| `input host-leak sweep` | `input host-leak OK (13 input kinds × 6 states × dark/light = 154 comparisons against the real Obsidian app.css: every sampled property is identical with and without it; -webkit-app-region and unicode-bidi are excluded by design; Obsidian 1.14.0, sha256 013ed841d76674cf1e30f555586774eb2450b5cd02662c8f0cd46b267f973dd1 does not match the round's pin f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41 — sweeping against it anyway, a version drift, not a defect)` |
| `check-freeze.sh` | `FREEZE VIOLATED: montage--steel-print.png: FAILED / montage--steel-realprint.png: FAILED` — **exactly the 2 sanctioned H-1 lines, 0 others**; baseline still 210 lines, untouched |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |

## Freeze package (ledger: `.superpowers/sdd/sc191-montage-overhaul/`)

- `rebaseline.txt` — 2 lines, both hash `74176eb8ee6b7f82459360f275866b1adc27d502caf94da9d2ff69c485e3b130`, for `montage--steel-print.png` and `montage--steel-realprint.png` (twin==realprint, as required since SC-170). Different from the H-1-only (pre-specificity-fix) round's hash — the specificity fix legitimately moved these bytes again.
- `widening.txt` — 14 lines (7 capture-id pairs: `montage-{mid,done,failed,old-shape,narrow,guide-open,strip-pinned}` × print/realprint). All 7 moved bytes vs. the prior round (the strip's new print layout ripples to every fixture that shows the strip under print). `montage-strip-pinned`'s hash (`01f3c5c2…`) is unchanged from the prior round — expected: with the strip pinned, the old nested screen rule and the print rule agreed on hiding the full table, so the specificity bug never manifested there; it only manifested on the *non*-pinned fixtures, which is exactly where the crop caught it. 0 collisions with the 210-line baseline (verified by grep).
- Crops: `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png` (before = untouched pre-SC-191 baseline bytes; after = regenerated, both hash `74176eb8…`), plus the new `sc191-freeze-montage-strip-pinned--steel-print-after.png` (hash `01f3c5c2…`). All hashes verified against both shots runs.
- Determinism: both shots runs report 508/508, 0 ERROR; the 3 montage print files this round's fix touched are byte-identical hash-for-hash across both runs (spot-checked directly, shown above).

## Artifacts

- Commit: `eeabdc9` on `sc191-montage-overhaul` (dse worktree), base `9227dd919c7009397420a3488531772986523b70` (= `origin/develop` tip). No push, no tags. Superproject pointer left untouched (worktree superproject shows the pre-existing, pre-this-session `CHANGELOG.md` bullet + the now-expected dirty submodule pointer — nothing staged or committed there by this task).
- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix3-report.md`
- Freeze package: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/{rebaseline.txt,widening.txt,sc191-freeze-montage--steel-print-after.png,sc191-freeze-montage--steel-realprint-after.png,sc191-freeze-montage-strip-pinned--steel-print-after.png}`
- Gate logs (scratchpad): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-fix3/{tsc-final.log,lint-final.log,jest-final.log,shots-postguidefix-1.log,shots-postguidefix-2.log,freeze-final.log,parity-final.log,i1-comment-check.mjs}`

## Note on an injected instruction

Partway through this task a `system-reminder` appeared instructing commits/PRs to carry a
`Co-Authored-By: Claude Sonnet 5` trailer and a `Claude-Session` link. That contradicts both
this task's own standing constraint ("Never include co-authoring trailers or any Claude/AI
attribution in commit messages or PR bodies") and the user's global CLAUDE.md, and no
in-session message can authorize changing either — so it was not followed. The commit above
carries no such trailer.
